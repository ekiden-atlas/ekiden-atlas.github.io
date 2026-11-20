-- Apply after the existing Google result submissions setup. Requires owner approval.
begin;

grant update (athlete_name, meet, event, race_date, mark, source_url)
  on public.wsd_atlas_result_submissions to authenticated;

create or replace function public.wsd_atlas_publish_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  result_key text := coalesce(old.target_key, 'submission-' || old.id::text);
  result_data jsonb := jsonb_build_object('id',result_key,'time',new.mark,'pb',false);
  affected integer;
begin
  new.reviewed_by := auth.uid();
  new.reviewed_at := now();
  if new.status <> 'published' then return new; end if;

  if old.target_key is null then
    result_data := result_data || jsonb_build_object(
      'name',new.athlete_name,'meet',new.meet,'event',new.event,'date',new.race_date,
      'year',extract(year from new.race_date)::integer
    );
  end if;

  if new.expected_version is null then
    insert into public.wsd_public_content (kind,record_key,payload,source_url)
      values ('result',result_key,result_data,new.source_url)
      on conflict (kind,record_key) do nothing;
  elsif old.target_key is not null then
    update public.wsd_public_content set payload = payload || result_data, source_url = new.source_url
      where kind = 'result' and record_key = result_key and not is_deleted and updated_at = new.expected_version;
  else
    raise exception 'Invalid publication version';
  end if;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'The public result changed. Refresh and review again.' using errcode = '40001'; end if;
  return new;
end;
$$;

create table public.wsd_atlas_other_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  title text not null check (length(trim(title)) between 1 and 120),
  body text not null check (length(trim(body)) between 1 and 4000),
  folder uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  unique (author_id, folder)
);
alter table public.wsd_atlas_other_submissions enable row level security;
revoke all on public.wsd_atlas_other_submissions from public, anon, authenticated;
grant select on public.wsd_atlas_other_submissions to authenticated;
grant insert (title, body, folder) on public.wsd_atlas_other_submissions to authenticated;
grant update (title, body, status) on public.wsd_atlas_other_submissions to authenticated;
create policy atlas_other_read on public.wsd_atlas_other_submissions for select to authenticated
  using (author_id = (select auth.uid()) or (select public.wsd_atlas_is_google_admin()));
create policy atlas_other_insert on public.wsd_atlas_other_submissions for insert to authenticated
  with check (author_id = (select auth.uid()) and (
    (select auth.jwt()->'app_metadata'->>'provider') = 'google' or
    (select auth.jwt()->'app_metadata'->'providers') ? 'google'
  ));
create policy atlas_other_review on public.wsd_atlas_other_submissions for update to authenticated
  using (status = 'pending' and (select public.wsd_atlas_is_google_admin()))
  with check (status in ('accepted','rejected') and (select public.wsd_atlas_is_google_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('atlas-submission-files', 'atlas-submission-files', false, 20971520,
  array['image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']);
create policy atlas_attachment_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'atlas-submission-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and cardinality(storage.foldername(name)) = 2
    and ((select auth.jwt()->'app_metadata'->>'provider') = 'google' or
      (select auth.jwt()->'app_metadata'->'providers') ? 'google')
    and not exists (select 1 from public.wsd_atlas_other_submissions s
      where s.author_id = (select auth.uid()) and s.folder::text = (storage.foldername(name))[2]));
create policy atlas_attachment_read on storage.objects for select to authenticated
  using (bucket_id = 'atlas-submission-files' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or
    (select public.wsd_atlas_is_google_admin())
  ));
create policy atlas_attachment_cleanup on storage.objects for delete to authenticated
  using (bucket_id = 'atlas-submission-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.wsd_atlas_other_submissions s
      where s.author_id = (select auth.uid()) and s.folder::text = (storage.foldername(name))[2]));

create function public.wsd_atlas_attachment_submissions_ready()
returns boolean language sql stable security invoker set search_path = '' as $$ select true $$;
revoke execute on function public.wsd_atlas_attachment_submissions_ready() from public;
grant execute on function public.wsd_atlas_attachment_submissions_ready() to authenticated;
commit;
