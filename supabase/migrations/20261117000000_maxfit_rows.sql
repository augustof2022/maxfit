-- MaxFit cloud sync: one generic table of rows, owned by the signed-in user.
-- The app is local-first; this table is a copy for backup and multi-device use.
-- Safe to run on a shared Supabase project: it only adds new objects with a maxfit_ prefix.

create sequence if not exists public.maxfit_rows_seq;

create table if not exists public.maxfit_rows (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tbl text not null,
  id text not null,
  data jsonb not null,
  updated_at bigint not null, -- client clock (ms): the newest copy wins
  server_updated_at timestamptz not null default now(),
  seq bigint not null default nextval('public.maxfit_rows_seq'), -- unique pull cursor
  primary key (user_id, tbl, id)
);

-- Which local tables may sync (re-created so the file can be re-run after adding a table).
alter table public.maxfit_rows drop constraint if exists maxfit_rows_tbl_check;
alter table public.maxfit_rows add constraint maxfit_rows_tbl_check
  check (tbl in ('profile', 'locations', 'sessions', 'sets', 'weights', 'equipment'));

-- In case an earlier draft of this table exists without seq (keeps the file re-runnable).
alter table public.maxfit_rows add column if not exists seq bigint not null default nextval('public.maxfit_rows_seq');

create index if not exists maxfit_rows_pull_idx on public.maxfit_rows (user_id, seq);
create index if not exists maxfit_rows_time_idx on public.maxfit_rows (user_id, server_updated_at);

-- Every insert or update gets a new seq and server time, so a device pulling by seq sees it.
create or replace function public.maxfit_touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at := now();
  new.seq := nextval('public.maxfit_rows_seq');
  return new;
end;
$$;

drop trigger if exists maxfit_rows_touch on public.maxfit_rows;
create trigger maxfit_rows_touch before insert or update on public.maxfit_rows
for each row execute function public.maxfit_touch();

alter table public.maxfit_rows enable row level security;

drop policy if exists "maxfit own rows select" on public.maxfit_rows;
drop policy if exists "maxfit own rows insert" on public.maxfit_rows;
drop policy if exists "maxfit own rows update" on public.maxfit_rows;
drop policy if exists "maxfit own rows delete" on public.maxfit_rows;

create policy "maxfit own rows select" on public.maxfit_rows for select to authenticated using ((select auth.uid()) = user_id);
create policy "maxfit own rows insert" on public.maxfit_rows for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "maxfit own rows update" on public.maxfit_rows for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "maxfit own rows delete" on public.maxfit_rows for delete to authenticated using ((select auth.uid()) = user_id);

-- Push: insert new rows; replace a stored row ONLY if the incoming copy is newer.
-- security invoker = runs as the signed-in user, so the RLS policies above still apply.
create or replace function public.maxfit_push(rows jsonb) returns integer
language sql
security invoker
set search_path = ''
as $$
  with up as (
    insert into public.maxfit_rows (user_id, tbl, id, data, updated_at)
    select (select auth.uid()), r->>'tbl', r->>'id', r->'data', (r->>'updated_at')::bigint
    from jsonb_array_elements(rows) as r
    on conflict (user_id, tbl, id) do update
      set data = excluded.data, updated_at = excluded.updated_at
      where public.maxfit_rows.updated_at < excluded.updated_at
    returning 1
  )
  select count(*)::integer from up;
$$;

revoke all on function public.maxfit_push(jsonb) from public, anon;
grant execute on function public.maxfit_push(jsonb) to authenticated;
grant usage on sequence public.maxfit_rows_seq to authenticated;
