-- MaxFit: allow the new "plans" table (exercise plans per place, 2026-11-18) in the sync table.
-- Additive and re-runnable: it only widens the list of allowed table names. No data is changed.
-- Apply BEFORE (or soon after) shipping the app build that pushes plans. Until then the app keeps
-- plans on the phone (and in backups) and syncs everything else as before.

alter table public.maxfit_rows drop constraint if exists maxfit_rows_tbl_check;
alter table public.maxfit_rows add constraint maxfit_rows_tbl_check
  check (tbl in ('profile', 'locations', 'sessions', 'sets', 'weights', 'equipment', 'plans'));
