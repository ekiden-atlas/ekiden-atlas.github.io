-- Apply after the result submissions and managed content migrations.
begin;
set local lock_timeout = '5s';

alter table public.wsd_atlas_result_submissions
  drop constraint wsd_atlas_result_submissions_source_url_check,
  add constraint wsd_atlas_result_submissions_source_url_check check (
    length(source_url) <= 600
    and source_url ~ '^https?://[a-zA-Z0-9.-]+([/:?#][^[:space:]]*)?$'
    and source_url !~* '^https?://([^/:?#]*[.])?(github[.]com|github[.]io|githubusercontent[.]com)([/:?#]|$)'
    and source_url !~ '^https?://[^/?#]*[@\\\\]'
  );

alter table public.wsd_public_content
  drop constraint wsd_public_content_source_url_check,
  add constraint wsd_public_content_source_url_check check (
    length(source_url) <= 600
    and (
      source_url ~ '^https://[^[:space:]]+$'
      or (kind = 'result' and source_url ~ '^http://[a-zA-Z0-9.-]+([/:?#][^[:space:]]*)?$'
        and source_url !~ '^http://[^/?#]*[@\\\\]')
    )
    and source_url !~* '^https?://[^/]*github[^/]*(/|$)'
    and source_url !~ '^https?://[^/]*@'
  );

commit;
