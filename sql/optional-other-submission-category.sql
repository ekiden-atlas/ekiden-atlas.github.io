-- Apply after optional-submission-review-and-attachments.sql.
-- Existing submissions have NULL (unclassified). Existing RLS policies and
-- attachment storage rules continue to govern who can see or change a row.
-- Rollback: export id/category pairs if needed, then DROP COLUMN category.
-- Dropping the column discards classifications only and removes its grants.
begin;
alter table public.wsd_atlas_other_submissions
  add column category text
  constraint atlas_other_submission_category
  check (category in ('athlete','event','other'));
grant insert (category), update (category) on public.wsd_atlas_other_submissions to authenticated;
notify pgrst, 'reload schema';
commit;
