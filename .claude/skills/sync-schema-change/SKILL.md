---
name: sync-schema-change
description: Change MaxFit's stored data safely - Dexie (phone) schema versions, the Supabase maxfit_rows table and RLS, and the sync code - without losing records. Use for any new field, table, index or migration.
---

# Data / sync change

1. **Phone DB (Dexie):** never edit an old `this.version(n)`. Add `this.version(n+1).stores({...})`
   with an `.upgrade()` if old rows need a new field. New optional fields need no schema change.
2. **Sync:** new local table → add it to `SYNC_TABLES` in `src/data/db.ts` and to the `tbl`
   check constraint in a NEW migration file `supabase/migrations/<timestamp>_<name>.sql`.
3. **Supabase:** migrations are additive and idempotent (`if not exists`). RLS on, four policies
   with `(select auth.uid()) = user_id`. Prefix objects with `maxfit_` (shared project).
   **Once a migration file has been applied anywhere, never edit it:** add a new file. Apply the
   SQL to the server BEFORE shipping an app build that pushes the new table.
   New sync table → also reset the pull cursor in the Dexie upgrade (`meta`: `pullSeq`, `pullTime`)
   so rows an older app skipped are pulled again.
4. **Apply:** ask Renz first. Then apply with the Supabase MCP `apply_migration`, and run
   `get_advisors` (security and performance). Report any warnings with their links.
5. **Never:** service_role key in the app or repo; hard deletes of user rows (use `deleted: true`).
6. **Test:** `npm test`, `npm run e2e`, and a manual two-browser sync check (sign in on both,
   log a set on one, Sync now on the other).
