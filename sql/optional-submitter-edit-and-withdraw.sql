-- Apply after optional-submission-review-and-attachments.sql.
begin;

alter table public.wsd_atlas_result_submissions
  drop constraint wsd_atlas_result_submissions_status_check,
  add constraint wsd_atlas_result_submissions_status_check
    check (status in ('pending','published','rejected','withdrawn')),
  add column revision uuid not null default gen_random_uuid();
alter table public.wsd_atlas_other_submissions
  drop constraint wsd_atlas_other_submissions_status_check,
  add constraint wsd_atlas_other_submissions_status_check
    check (status in ('pending','accepted','rejected','withdrawn')),
  add column revision uuid not null default gen_random_uuid();
grant select (revision) on public.wsd_atlas_result_submissions to authenticated;

create policy result_submission_author_edit on public.wsd_atlas_result_submissions for update to authenticated
  using (author_id = (select auth.uid()) and status = 'pending')
  with check (author_id = (select auth.uid()) and status in ('pending','withdrawn'));
create policy other_submission_author_edit on public.wsd_atlas_other_submissions for update to authenticated
  using (author_id = (select auth.uid()) and status = 'pending')
  with check (author_id = (select auth.uid()) and status in ('pending','withdrawn'));

create function public.wsd_atlas_rotate_submission_revision()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.revision := gen_random_uuid();
  return new;
end;
$$;
revoke execute on function public.wsd_atlas_rotate_submission_revision() from public, anon, authenticated;
create trigger rotate_submission_revision before update on public.wsd_atlas_result_submissions
  for each row execute function public.wsd_atlas_rotate_submission_revision();
create trigger rotate_submission_revision before update on public.wsd_atlas_other_submissions
  for each row execute function public.wsd_atlas_rotate_submission_revision();

drop trigger publish_submission on public.wsd_atlas_result_submissions;
create trigger publish_submission before update of status on public.wsd_atlas_result_submissions
  for each row when (new.status in ('published','rejected'))
  execute function public.wsd_atlas_publish_submission();

create function public.wsd_atlas_submitter_edits_ready()
returns boolean language sql stable security invoker set search_path = '' as $$ select true $$;
revoke execute on function public.wsd_atlas_submitter_edits_ready() from public, anon;
grant execute on function public.wsd_atlas_submitter_edits_ready() to authenticated;
commit;
