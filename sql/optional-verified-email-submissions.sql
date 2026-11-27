-- Review before production. Requires the Atlas reviewer and linked Google submission migrations.
begin;
set local lock_timeout = '5s';

create function public.wsd_atlas_can_submit()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    coalesce(auth.jwt()->'app_metadata'->>'provider' = 'google', false)
    or coalesce((auth.jwt()->'app_metadata'->'providers') ? 'google', false)
    or exists (
      select 1 from auth.users u where u.id = auth.uid()
      and u.email_confirmed_at is not null and exists (
        select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email'
      )
    )
  )
$$;
revoke all on function public.wsd_atlas_can_submit() from public, anon, authenticated;
grant execute on function public.wsd_atlas_can_submit() to authenticated;

create function public.wsd_atlas_email_submissions_ready()
returns boolean language sql stable security invoker set search_path = '' as $$ select true $$;
revoke all on function public.wsd_atlas_email_submissions_ready() from public, anon, authenticated;
grant execute on function public.wsd_atlas_email_submissions_ready() to anon, authenticated;

alter policy submission_insert on public.wsd_atlas_result_submissions
  with check (author_id = (select auth.uid()) and (select public.wsd_atlas_can_submit()));
alter policy atlas_other_insert on public.wsd_atlas_other_submissions
  with check (author_id = (select auth.uid()) and (select public.wsd_atlas_can_submit()));
alter policy atlas_attachment_insert on storage.objects
  with check (bucket_id = 'atlas-submission-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 2
    and (select public.wsd_atlas_can_submit())
    and not exists (select 1 from public.wsd_atlas_other_submissions s
      where s.author_id = (select auth.uid()) and s.folder::text = (storage.foldername(name))[2]));

-- Route policies remain bound to the existing functions. Password and recovery
-- sessions cannot exercise admin permissions for an account with a linked Google identity.
create or replace function public.wsd_atlas_is_google_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and coalesce(auth.jwt()->'amr' @> '[{"method":"oauth"}]'::jsonb,false)
    and auth.jwt()->'app_metadata'->>'provider' = 'google'
    and exists (select 1 from auth.identities i where i.user_id=auth.uid() and i.provider='google')
    and (exists (select 1 from public.wsd_community_admins a where a.user_id=auth.uid())
      or exists (select 1 from public.wsd_atlas_admins a where a.user_id=auth.uid()))
$$;
create or replace function public.wsd_atlas_can_review()
returns boolean language sql stable security definer set search_path = '' as $$
  select public.wsd_atlas_is_google_admin() or (
    auth.uid() is not null
    and coalesce(auth.jwt()->'amr' @> '[{"method":"oauth"}]'::jsonb,false)
    and auth.jwt()->'app_metadata'->>'provider' = 'google'
    and exists (select 1 from atlas_review.reviewers r where r.user_id=auth.uid())
    and exists (select 1 from auth.identities i where i.user_id=auth.uid() and i.provider='google')
  )
$$;
notify pgrst, 'reload schema';
commit;
