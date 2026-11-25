-- Requires owner approval. Apply after the rank/division and submitter-edit migrations.
begin;
set local lock_timeout = '5s';

create schema atlas_review;
revoke all on schema atlas_review from public, anon, authenticated;
create table atlas_review.reviewers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on atlas_review.reviewers from public, anon, authenticated;

create function public.wsd_atlas_can_review()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    public.wsd_atlas_is_google_admin() or (
      exists (select 1 from atlas_review.reviewers r where r.user_id = auth.uid()) and
      exists (select 1 from auth.identities i where i.user_id = auth.uid() and i.provider = 'google')
    )
  );
$$;
revoke all on function public.wsd_atlas_can_review() from public, anon, authenticated;
grant execute on function public.wsd_atlas_can_review() to authenticated;

alter policy submission_read on public.wsd_atlas_result_submissions
  using (author_id = (select auth.uid()) or (select public.wsd_atlas_can_review()));
alter policy submission_review on public.wsd_atlas_result_submissions
  using (status = 'pending' and (select public.wsd_atlas_can_review()))
  with check (status in ('published','rejected') and (select public.wsd_atlas_can_review()));

alter policy atlas_other_read on public.wsd_atlas_other_submissions
  using (author_id = (select auth.uid()) or (select public.wsd_atlas_can_review()));
alter policy atlas_other_review on public.wsd_atlas_other_submissions
  using (status = 'pending' and (select public.wsd_atlas_can_review()))
  with check (status in ('accepted','rejected') and (select public.wsd_atlas_can_review()));
alter policy atlas_attachment_read on storage.objects
  using (bucket_id = 'atlas-submission-files' and (
    (storage.foldername(name))[1] = (select auth.uid())::text or
    (select public.wsd_atlas_can_review())
  ));

create function atlas_review.publish_submission()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  result_key text := coalesce(old.target_key, 'submission-' || old.id::text);
  result_data jsonb := jsonb_build_object('id',result_key,'time',new.mark,'pb',false);
  affected integer;
begin
  if tg_relid <> 'public.wsd_atlas_result_submissions'::regclass
     or old.status <> 'pending' or not public.wsd_atlas_can_review()
     or new.id is distinct from old.id or new.author_id is distinct from old.author_id
     or new.target_key is distinct from old.target_key then
    raise exception 'Review not authorized' using errcode = '42501';
  end if;
  if new.status = 'published' and old.target_key is not null
     and not public.wsd_atlas_is_google_admin() then
    raise exception 'Correction requires a content administrator' using errcode = '42501';
  end if;
  new.reviewed_by := auth.uid();
  new.reviewed_at := now();
  if new.status <> 'published' then return new; end if;

  if new.finish_rank is not null then
    result_data := result_data || jsonb_build_object('rank', new.finish_rank);
  end if;
  if new.race_division is not null then
    result_data := result_data || jsonb_build_object(
      'status', case left(new.race_division,1)
        when 'm' then 'middleSchool' when 'h' then 'highSchool' else 'student' end,
      'gradeAtRace', right(new.race_division,1)::integer
    );
  end if;

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
revoke all on function atlas_review.publish_submission() from public, anon, authenticated;
drop trigger publish_submission on public.wsd_atlas_result_submissions;
create trigger publish_submission before update of status on public.wsd_atlas_result_submissions
  for each row when (new.status in ('published','rejected'))
  execute function atlas_review.publish_submission();
notify pgrst, 'reload schema';
commit;
