-- Apply after optional-result-submissions.sql.
begin;
alter policy submission_insert on public.wsd_atlas_result_submissions
  with check (
    author_id = (select auth.uid())
    and (select auth.jwt()->'app_metadata'->>'provider') = 'google'
  );
commit;
