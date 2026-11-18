-- Review and test with optional-managed-content.sql before applying to production.
begin;

create table public.wsd_atlas_result_invites (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.wsd_atlas_result_submissions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  target_key text check (length(trim(target_key)) between 2 and 180),
  athlete_name text not null check (length(trim(athlete_name)) between 1 and 120),
  meet text not null check (length(trim(meet)) between 1 and 240),
  event text not null check (length(trim(event)) between 1 and 80),
  race_date date check ((race_date is not null or target_key is not null) and (race_date between date '1900-01-01' and date '2100-12-31' or race_date is null)),
  mark text not null check (length(mark) <= 20 and mark ~ '^([0-9]+:)?[0-9]+:[0-5][0-9]([.][0-9]{1,3})?$|^[0-9]+[.][0-9]{1,3}$'),
  source_url text not null check (length(source_url) <= 600 and source_url ~ '^https://[a-zA-Z0-9.-]+([/:?#][^[:space:]]*)?$'
    and source_url !~* '^https://([^/:?#]*[.])?(github[.]com|github[.]io|githubusercontent[.]com)([/:?#]|$)'
    and source_url !~ '^https://[^/?#]*[@\\]'),
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  expected_version timestamptz
);
create index wsd_atlas_submission_author_idx on public.wsd_atlas_result_submissions (author_id, created_at desc);
create index wsd_atlas_submission_status_idx on public.wsd_atlas_result_submissions (status, created_at desc);

alter table public.wsd_atlas_result_invites enable row level security;
alter table public.wsd_atlas_result_submissions enable row level security;
revoke all on public.wsd_atlas_result_invites, public.wsd_atlas_result_submissions from public, anon, authenticated;
grant select (user_id) on public.wsd_atlas_result_invites to authenticated;
grant select (id, author_id, created_at, target_key, athlete_name, meet, event, race_date, mark, source_url, status)
  on public.wsd_atlas_result_submissions to authenticated;
grant insert (target_key, athlete_name, meet, event, race_date, mark, source_url)
  on public.wsd_atlas_result_submissions to authenticated;
grant update (status, expected_version) on public.wsd_atlas_result_submissions to authenticated;

create policy invite_self on public.wsd_atlas_result_invites for select to authenticated
  using (user_id = (select auth.uid()) and (select auth.jwt()->'app_metadata'->>'provider') = 'google');
create policy submission_read on public.wsd_atlas_result_submissions for select to authenticated
  using (author_id = (select auth.uid()) or (select public.wsd_atlas_is_google_admin()));
create policy submission_insert on public.wsd_atlas_result_submissions for insert to authenticated
  with check (author_id = (select auth.uid()) and exists (
    select 1 from public.wsd_atlas_result_invites where user_id = (select auth.uid())
  ));
create policy submission_review on public.wsd_atlas_result_submissions for update to authenticated
  using ((select public.wsd_atlas_is_google_admin()) and status = 'pending')
  with check ((select public.wsd_atlas_is_google_admin()) and status in ('published','rejected'));

create function public.wsd_atlas_submissions_ready()
returns boolean language sql stable security invoker set search_path = '' as $$ select true $$;
revoke execute on function public.wsd_atlas_submissions_ready() from public;
grant execute on function public.wsd_atlas_submissions_ready() to anon, authenticated;

create function public.wsd_atlas_publish_submission()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  result_key text := coalesce(old.target_key, 'submission-' || old.id::text);
  result_data jsonb := jsonb_build_object('id',result_key,'time',old.mark,'pb',false);
  affected integer;
begin
  new.reviewed_by := auth.uid();
  new.reviewed_at := now();
  if new.status <> 'published' then return new; end if;

  if old.target_key is null then
    result_data := result_data || jsonb_build_object(
      'name',old.athlete_name,'meet',old.meet,'event',old.event,'date',old.race_date,
      'year',extract(year from old.race_date)::integer
    );
  end if;

  if new.expected_version is null then
    insert into public.wsd_public_content (kind,record_key,payload,source_url)
      values ('result',result_key,result_data,old.source_url)
      on conflict (kind,record_key) do nothing;
  elsif old.target_key is not null then
    update public.wsd_public_content set payload = payload || result_data, source_url = old.source_url
      where kind = 'result' and record_key = result_key and not is_deleted and updated_at = new.expected_version;
  else
    raise exception 'Invalid publication version';
  end if;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'The public result changed. Refresh and review again.' using errcode = '40001'; end if;
  return new;
end;
$$;
revoke execute on function public.wsd_atlas_publish_submission() from public, anon, authenticated;
create trigger publish_submission before update of status on public.wsd_atlas_result_submissions
  for each row execute function public.wsd_atlas_publish_submission();

commit;
