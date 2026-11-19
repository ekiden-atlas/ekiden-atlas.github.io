-- Apply only after review. Requires public.wsd_atlas_is_google_admin().
begin;

create table public.wsd_atlas_fan_profiles (
  owner_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 24 and nickname ~ '[^[:space:]]'),
  avatar text check (length(avatar) <= 32768 and avatar ~ '^data:image/webp;base64,UklGR[A-Za-z0-9+/]*={0,2}$')
);

create table public.wsd_atlas_fan_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid default auth.uid() references auth.users(id) on delete set null,
  nickname text not null,
  avatar text,
  message text not null check (char_length(message) <= 1000 and message ~ '[^[:space:]]'),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','published','hidden'))
);

create index wsd_atlas_fan_posts_feed_idx on public.wsd_atlas_fan_posts(status,created_at desc,id desc);
create index wsd_atlas_fan_posts_owner_idx on public.wsd_atlas_fan_posts(owner_id);
alter table public.wsd_atlas_fan_profiles enable row level security;
alter table public.wsd_atlas_fan_posts enable row level security;
revoke all on public.wsd_atlas_fan_profiles, public.wsd_atlas_fan_posts from public, anon, authenticated;

grant select (owner_id,nickname,avatar), insert (owner_id,nickname,avatar), update (nickname,avatar)
  on public.wsd_atlas_fan_profiles to authenticated;
grant select (id,nickname,avatar,message,created_at,status)
  on public.wsd_atlas_fan_posts to anon, authenticated;
grant insert (message), update (status) on public.wsd_atlas_fan_posts to authenticated;

create policy fan_profile_read on public.wsd_atlas_fan_profiles for select to authenticated
  using (owner_id = (select auth.uid()));
create policy fan_profile_create on public.wsd_atlas_fan_profiles for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy fan_profile_edit on public.wsd_atlas_fan_profiles for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

create policy fan_post_public on public.wsd_atlas_fan_posts for select to anon, authenticated
  using (status = 'published');
create policy fan_post_review_read on public.wsd_atlas_fan_posts for select to authenticated
  using ((select public.wsd_atlas_is_google_admin()));
create policy fan_post_submit on public.wsd_atlas_fan_posts for insert to authenticated
  with check (
    owner_id = (select auth.uid()) and status = 'pending' and (
      (select auth.jwt()->'app_metadata'->>'provider') = 'google'
      or (select auth.jwt()->'app_metadata'->'providers') ? 'google'
    )
  );
create policy fan_post_moderate on public.wsd_atlas_fan_posts for update to authenticated
  using ((select public.wsd_atlas_is_google_admin()) and status in ('pending','published'))
  with check ((select public.wsd_atlas_is_google_admin()) and status in ('published','hidden'));

create function public.wsd_atlas_fan_post_snapshot()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  select profile.nickname, profile.avatar into strict new.nickname, new.avatar
  from public.wsd_atlas_fan_profiles profile where profile.owner_id = auth.uid();
  return new;
end;
$$;
revoke execute on function public.wsd_atlas_fan_post_snapshot() from public, anon, authenticated;
create trigger wsd_atlas_fan_post_snapshot before insert on public.wsd_atlas_fan_posts
  for each row execute function public.wsd_atlas_fan_post_snapshot();

create function public.wsd_atlas_submit_fan_post(public_name text, public_avatar text, body text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.wsd_atlas_fan_profiles(nickname,avatar) values (public_name,public_avatar)
    on conflict (owner_id) do update set nickname=excluded.nickname, avatar=excluded.avatar;
  insert into public.wsd_atlas_fan_posts(message) values (body);
end;
$$;
revoke execute on function public.wsd_atlas_submit_fan_post(text,text,text) from public, anon, authenticated;
grant execute on function public.wsd_atlas_submit_fan_post(text,text,text) to authenticated;

commit;
