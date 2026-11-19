-- Apply only after review. Requires the existing Atlas Google-admin check.
begin;

create table public.wsd_atlas_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message text not null check (
    length(message) <= 2000 and message ~ '[^[:space:]]'
  )
);

create index wsd_atlas_feedback_inbox_idx
  on public.wsd_atlas_feedback (created_at desc, id desc);

alter table public.wsd_atlas_feedback enable row level security;
revoke all on public.wsd_atlas_feedback from public, anon, authenticated;
grant insert (message) on public.wsd_atlas_feedback to anon;
grant select (id, created_at, message) on public.wsd_atlas_feedback to authenticated;

create policy feedback_submit on public.wsd_atlas_feedback
  for insert to anon with check (true);
create policy feedback_admin_read on public.wsd_atlas_feedback
  for select to authenticated using ((select public.wsd_atlas_is_google_admin()));

commit;
