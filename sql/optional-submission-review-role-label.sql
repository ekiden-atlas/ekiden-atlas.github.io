-- Apply after optional-atlas-reviewer-role.sql, with owner approval.
-- Rollback: remove both capture_review_role triggers and both functions,
-- then export/drop atlas_review.submission_roles if the labels are no longer needed.
begin;
set local lock_timeout = '5s';

create table atlas_review.submission_roles (
  submission_kind text not null check (submission_kind in ('result','other')),
  submission_id uuid not null,
  reviewer_role text not null check (reviewer_role in ('main','deputy')),
  primary key (submission_kind, submission_id)
);
revoke all on atlas_review.submission_roles from public, anon, authenticated;

create function atlas_review.capture_review_role()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  kind text;
  role_at_review text;
begin
  if tg_relid = 'public.wsd_atlas_result_submissions'::regclass then
    kind := 'result';
  elsif tg_relid = 'public.wsd_atlas_other_submissions'::regclass then
    kind := 'other';
  else
    raise exception 'Unexpected review table';
  end if;
  if public.wsd_atlas_is_google_admin() then
    role_at_review := 'main';
  elsif public.wsd_atlas_can_review() then
    role_at_review := 'deputy';
  else
    return new;
  end if;
  insert into atlas_review.submission_roles values (kind, new.id, role_at_review)
    on conflict do nothing;
  return new;
end;
$$;
revoke all on function atlas_review.capture_review_role() from public, anon, authenticated;

create trigger capture_review_role after update of status on public.wsd_atlas_result_submissions
  for each row when (old.status = 'pending' and new.status in ('published','rejected'))
  execute function atlas_review.capture_review_role();
create trigger capture_review_role after update of status on public.wsd_atlas_other_submissions
  for each row when (old.status = 'pending' and new.status in ('accepted','rejected'))
  execute function atlas_review.capture_review_role();

create function public.wsd_atlas_review_roles(p_kind text, p_ids uuid[])
returns table (submission_id uuid, reviewer_role text)
language sql stable security definer set search_path = '' as $$
  select r.submission_id, r.reviewer_role
  from atlas_review.submission_roles r
  where public.wsd_atlas_is_google_admin()
    and r.submission_kind = p_kind
    and r.submission_id = any(p_ids)
    and cardinality(p_ids) <= 100;
$$;
revoke all on function public.wsd_atlas_review_roles(text, uuid[]) from public, anon, authenticated;
grant execute on function public.wsd_atlas_review_roles(text, uuid[]) to authenticated;
notify pgrst, 'reload schema';
commit;
