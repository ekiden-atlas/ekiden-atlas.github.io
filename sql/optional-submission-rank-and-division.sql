-- Apply after the editable moderation and submitter edits migrations.
begin;
alter table public.wsd_atlas_result_submissions
  add column finish_rank integer check (finish_rank > 0),
  add column race_division text check (race_division ~ '^(m[1-3]|h[1-3]|u[1-4])$');
grant select (finish_rank, race_division), insert (finish_rank, race_division),
  update (finish_rank, race_division) on public.wsd_atlas_result_submissions to authenticated;

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

create function public.wsd_atlas_submission_details_ready()
returns boolean language sql stable security invoker set search_path = '' as $$ select true $$;
revoke execute on function public.wsd_atlas_submission_details_ready() from public, anon;
grant execute on function public.wsd_atlas_submission_details_ready() to authenticated;
commit;
