-- MaxFit cloud sync: one generic table of rows, owned by the signed-in user.
-- The app is local-first; this table is a copy for backup and multi-device use.
-- Safe to run on a shared Supabase project: it only adds new objects with a maxfit_ prefix.

create table if not exists public.maxfit_rows (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tbl text not null check (tbl in ('profile', 'locations', 'sessions', 'sets', 'weights')),
  id text not null,
  data jsonb not null,
  updated_at bigint not null, -- client clock (ms), used for last-write-wins
  server_updated_at timestamptz not null default now(), -- server clock, used as the pull cursor
  primary key (user_id, tbl, id)
);

create index if not exists maxfit_rows_pull_idx on public.maxfit_rows (user_id, server_updated_at);

create or replace function public.maxfit_touch() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.server_updated_at := now();
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
