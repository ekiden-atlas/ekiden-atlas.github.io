-- Reviewed deployment only. Requires pg_net, Vault, and a configured Edge Function.
begin;

create or replace function public.wsd_atlas_queue_submission_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
  endpoint text;
begin
  select decrypted_secret into token from vault.decrypted_secrets
    where name = 'atlas_submission_webhook_token' limit 1;
  select decrypted_secret into endpoint from vault.decrypted_secrets
    where name = 'atlas_submission_alert_url' limit 1;
  if token is null or endpoint is null then return new; end if;

  perform net.http_post(
    url := endpoint,
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || token),
    body := jsonb_build_object('kind',tg_argv[0],'id',new.id,'created_at',new.created_at),
    timeout_milliseconds := 10000
  );
  return new;
exception when others then
  raise warning 'Atlas could not queue a submission email notification';
  return new;
end;
$$;
revoke all on function public.wsd_atlas_queue_submission_alert() from public, anon, authenticated;

create trigger atlas_result_submission_email after insert on public.wsd_atlas_result_submissions
  for each row execute function public.wsd_atlas_queue_submission_alert('result');
create trigger atlas_other_submission_email after insert on public.wsd_atlas_other_submissions
  for each row execute function public.wsd_atlas_queue_submission_alert('other');
commit;
