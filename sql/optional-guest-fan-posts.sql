-- Apply after optional-fan-board.sql with owner approval.
-- Rollback: revoke execution of the guest RPC, drop both new RPCs, and
-- restore the original fan post snapshot trigger function from optional-fan-board.sql.
begin;
set local lock_timeout = '5s';

create or replace function public.wsd_atlas_fan_post_snapshot()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.owner_id is null then
    return new;
  end if;
  select profile.nickname, profile.avatar into strict new.nickname, new.avatar
  from public.wsd_atlas_fan_profiles profile where profile.owner_id = auth.uid();
  return new;
end;
$$;

-- Guests can create a pending row with only the supplied public name and message.
-- Table grants and read/moderation policies are unchanged.
create function public.wsd_atlas_submit_guest_fan_post(public_name text, body text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if public_name is null or char_length(trim(public_name)) not between 1 and 24
     or public_name !~ '[^[:space:]]' or body is null or char_length(trim(body)) > 1000
     or body !~ '[^[:space:]]' then
    raise exception 'Invalid guest message' using errcode = '22023';
  end if;
  insert into public.wsd_atlas_fan_posts(owner_id,nickname,avatar,message,status)
    values (null,trim(public_name),null,trim(body),'pending');
end;
$$;
revoke all on function public.wsd_atlas_submit_guest_fan_post(text,text) from public, anon, authenticated;
grant execute on function public.wsd_atlas_submit_guest_fan_post(text,text) to anon, authenticated;

create function public.wsd_atlas_guest_fan_posts_ready()
returns boolean language sql stable security invoker set search_path = '' as $$
  select has_function_privilege(current_user,'public.wsd_atlas_submit_guest_fan_post(text,text)','execute')
$$;
revoke all on function public.wsd_atlas_guest_fan_posts_ready() from public, anon, authenticated;
grant execute on function public.wsd_atlas_guest_fan_posts_ready() to anon, authenticated;
notify pgrst, 'reload schema';
commit;
