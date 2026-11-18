-- EKIDEN ATLAS: OPTIONAL, ADDITIVE migration for the existing Supabase project.
-- REVIEW BEFORE RUNNING. Nothing executes automatically.
-- Target: oflrjljywtqpgrcetwob (production). Do not change original tables/RLS.
-- Does not contain any athlete photos, full articles, or copyrighted materials.
-- This new content overlay is NOT automatically read by the original website.
BEGIN;

CREATE TABLE IF NOT EXISTS public.wsd_public_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('athlete','pb','story','ekiden','school_record','alltime_rank','world_rank')),
  record_key text NOT NULL CHECK (length(trim(record_key)) BETWEEN 2 AND 180),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(payload) = 'object' AND octet_length(payload::text) <= 24000),
  source_url text NOT NULL CHECK (source_url ~ '^https://[^[:space:]]+$' AND length(source_url) <= 600),
  is_deleted boolean NOT NULL DEFAULT false,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wsd_public_content_key UNIQUE (kind,record_key)
);
CREATE INDEX IF NOT EXISTS wsd_public_content_kind_idx ON public.wsd_public_content(kind,is_deleted);

-- Additional invitations belong to the NEW site only. Existing admins are inherited
-- from wsd_community_admins, but this migration never inserts/deletes there.
CREATE TABLE IF NOT EXISTS public.wsd_atlas_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.wsd_atlas_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wsd_atlas_admins FROM PUBLIC,anon,authenticated;

CREATE TABLE IF NOT EXISTS public.wsd_public_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind text NOT NULL,
  record_key text NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','GRANT_ADMIN','REVOKE_ADMIN')),
  before_data jsonb,
  after_data jsonb,
  actor_id uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wsd_public_audit_recent_idx ON public.wsd_public_audit(changed_at DESC);

-- SECURITY DEFINER is required solely to look up the protected admin membership
-- and the Google identity without granting public read access to those tables.
CREATE OR REPLACE FUNCTION public.wsd_atlas_is_google_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.identities i
    WHERE i.user_id = auth.uid() AND i.provider='google'
  ) AND (EXISTS (
    SELECT 1 FROM public.wsd_community_admins a WHERE a.user_id=auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.wsd_atlas_admins a WHERE a.user_id=auth.uid()
  ));
$$;
REVOKE ALL ON FUNCTION public.wsd_atlas_is_google_admin() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wsd_atlas_is_google_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.wsd_atlas_touch_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  NEW.updated_at := now();
  NEW.changed_by := auth.uid();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.wsd_atlas_touch_content() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS wsd_atlas_touch_content ON public.wsd_public_content;
CREATE TRIGGER wsd_atlas_touch_content
BEFORE INSERT OR UPDATE ON public.wsd_public_content
FOR EACH ROW EXECUTE FUNCTION public.wsd_atlas_touch_content();

CREATE OR REPLACE FUNCTION public.wsd_atlas_track_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.wsd_public_audit(kind,record_key,action,before_data,after_data,actor_id)
  VALUES(NEW.kind,NEW.record_key,TG_OP,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
         to_jsonb(NEW),auth.uid());
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.wsd_atlas_track_content() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS wsd_atlas_content_audit ON public.wsd_public_content;
CREATE TRIGGER wsd_atlas_content_audit
AFTER INSERT OR UPDATE ON public.wsd_public_content
FOR EACH ROW EXECUTE FUNCTION public.wsd_atlas_track_content();

ALTER TABLE public.wsd_public_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wsd_public_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wsd_public_content FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.wsd_public_audit FROM PUBLIC, anon, authenticated;

-- Public can read tombstone (is_deleted=true) rows because they mask old static data.
-- Do not render deleted rows in the UI. No content is uploaded by a visitor.
GRANT SELECT (id,kind,record_key,payload,source_url,is_deleted,created_at,updated_at)
ON public.wsd_public_content TO anon,authenticated;
GRANT INSERT (kind,record_key,payload,source_url,is_deleted)
ON public.wsd_public_content TO authenticated;
GRANT UPDATE (kind,record_key,payload,source_url,is_deleted)
ON public.wsd_public_content TO authenticated;
GRANT SELECT (id,kind,record_key,action,before_data,after_data,actor_id,changed_at)
ON public.wsd_public_audit TO authenticated;

DROP POLICY IF EXISTS wsd_atlas_content_public_read ON public.wsd_public_content;
CREATE POLICY wsd_atlas_content_public_read ON public.wsd_public_content FOR SELECT TO anon,authenticated USING (true);
DROP POLICY IF EXISTS wsd_atlas_content_admin_insert ON public.wsd_public_content;
CREATE POLICY wsd_atlas_content_admin_insert ON public.wsd_public_content FOR INSERT TO authenticated
WITH CHECK ((SELECT public.wsd_atlas_is_google_admin()));
DROP POLICY IF EXISTS wsd_atlas_content_admin_update ON public.wsd_public_content;
CREATE POLICY wsd_atlas_content_admin_update ON public.wsd_public_content FOR UPDATE TO authenticated
USING ((SELECT public.wsd_atlas_is_google_admin()))
WITH CHECK ((SELECT public.wsd_atlas_is_google_admin()));
-- No DELETE policy / DELETE grant: admins use is_deleted, with full audit history.
DROP POLICY IF EXISTS wsd_atlas_audit_admin_read ON public.wsd_public_audit;
CREATE POLICY wsd_atlas_audit_admin_read ON public.wsd_public_audit FOR SELECT TO authenticated
USING ((SELECT public.wsd_atlas_is_google_admin()));

-- Adding an admin requires a Google identity already registered in auth.users.
-- This makes it impossible for a regular Google sign-in alone to grant privileges.
CREATE OR REPLACE FUNCTION public.wsd_public_grant_admin_by_email(p_email text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE target_user uuid; norm_email text;
BEGIN
  IF NOT public.wsd_atlas_is_google_admin() THEN RAISE EXCEPTION 'not authorized' USING ERRCODE='42501'; END IF;
  norm_email := lower(trim(p_email));
  IF norm_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' OR length(norm_email)>254
  THEN RAISE EXCEPTION 'invalid email'; END IF;
  SELECT u.id INTO target_user FROM auth.users u
  WHERE lower(u.email)=norm_email AND u.email_confirmed_at IS NOT NULL
    AND EXISTS(SELECT 1 FROM auth.identities i WHERE i.user_id=u.id AND i.provider='google')
  LIMIT 1;
  IF target_user IS NULL THEN RETURN 'not_found'; END IF;
  IF EXISTS (SELECT 1 FROM public.wsd_community_admins a WHERE a.user_id=target_user) THEN RETURN 'already_admin'; END IF;
  INSERT INTO public.wsd_atlas_admins(user_id,granted_by) VALUES(target_user,auth.uid()) ON CONFLICT DO NOTHING;
  INSERT INTO public.wsd_public_audit(kind,record_key,action,before_data,after_data,actor_id)
  VALUES('admin',target_user::text,'GRANT_ADMIN',NULL,jsonb_build_object('email',norm_email),auth.uid());
  RETURN 'granted';
END;
$$;
REVOKE ALL ON FUNCTION public.wsd_public_grant_admin_by_email(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wsd_public_grant_admin_by_email(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.wsd_public_revoke_admin(p_user_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE old_email text;
BEGIN
  IF NOT public.wsd_atlas_is_google_admin() THEN RAISE EXCEPTION 'not authorized' USING ERRCODE='42501'; END IF;
  IF p_user_id = auth.uid() THEN RAISE EXCEPTION 'cannot remove yourself'; END IF;
  IF EXISTS (SELECT 1 FROM public.wsd_community_admins WHERE user_id=p_user_id) THEN RAISE EXCEPTION 'original site admin cannot be revoked here'; END IF;
  SELECT email INTO old_email FROM auth.users WHERE id=p_user_id;
  DELETE FROM public.wsd_atlas_admins WHERE user_id=p_user_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  INSERT INTO public.wsd_public_audit(kind,record_key,action,before_data,after_data,actor_id)
  VALUES('admin',p_user_id::text,'REVOKE_ADMIN',jsonb_build_object('email',old_email),NULL,auth.uid());
  RETURN 'revoked';
END;
$$;
REVOKE ALL ON FUNCTION public.wsd_public_revoke_admin(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wsd_public_revoke_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.wsd_public_list_admins()
RETURNS TABLE (user_id uuid,email text,created_at timestamptz,scope text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.wsd_atlas_is_google_admin() THEN RAISE EXCEPTION 'not authorized' USING ERRCODE='42501'; END IF;
  RETURN QUERY SELECT a.user_id,u.email::text,a.created_at,'shared'::text
  FROM public.wsd_community_admins a JOIN auth.users u ON u.id=a.user_id
  UNION ALL
  SELECT a.user_id,u.email::text,a.created_at,'atlas'::text
  FROM public.wsd_atlas_admins a JOIN auth.users u ON u.id=a.user_id
  WHERE NOT EXISTS (SELECT 1 FROM public.wsd_community_admins old WHERE old.user_id=a.user_id);
END;
$$;
REVOKE ALL ON FUNCTION public.wsd_public_list_admins() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wsd_public_list_admins() TO authenticated;

COMMIT;

-- Post-deployment verification, execute as a separate read-only SQL statement:
-- SELECT relname,relrowsecurity FROM pg_class WHERE relname IN ('wsd_public_content','wsd_public_audit');
-- SELECT * FROM pg_policies WHERE tablename LIKE 'wsd_public_%';
-- Confirm that public.wsd_community_admins has NEVER been modified by this migration.
-- Test with an anon key (INSERT must be 403) and an authorized Google admin session.
-- No service_role key belongs in a browser or GitHub Pages repository.
