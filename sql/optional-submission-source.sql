-- Apply after editable moderation and the HTTP result-source migration.
begin;
set local lock_timeout = '5s';

alter table public.wsd_atlas_result_submissions
  alter column source_url drop not null,
  add constraint wsd_atlas_published_submission_requires_source
    check (status <> 'published' or source_url is not null);

create function public.wsd_atlas_optional_submission_source_ready()
returns boolean language sql stable security invoker set search_path = '' as $$ select true $$;
revoke execute on function public.wsd_atlas_optional_submission_source_ready() from public, anon;
grant execute on function public.wsd_atlas_optional_submission_source_ready() to authenticated;

commit;
