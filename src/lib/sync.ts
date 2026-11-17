// Cloud sync with Supabase. The phone database stays the main copy (works offline at the gym);
// this pushes local changes up and pulls changes from other devices, last-write-wins per row.

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { db, SYNC_TABLES, type SyncTable } from '../data/db';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const syncConfigured = !!supabase;

type Row = { id: string; updatedAt: number };

async function getMeta<T>(k: string, fallback: T): Promise<T> {
  return ((await db.meta.get(k))?.value as T) ?? fallback;
}
async function setMeta(k: string, value: unknown) {
  await db.meta.put({ key: k, value });
}

export async function currentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Cloud sync is not set up for this build.');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUp(email: string, password: string) {
  if (!supabase) throw new Error('Cloud sync is not set up for this build.');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return { needsConfirm: !data.session };
}

export async function signOut() {
  await supabase?.auth.signOut();
  await setMeta('lastPush', 0);
  await setMeta('lastPull', null);
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  at: number;
}

let running: Promise<SyncResult> | null = null;

/** Push then pull. Safe to call often; concurrent calls share one run. */
export function syncNow(): Promise<SyncResult> {
  if (!running) running = doSync().finally(() => (running = null));
  return running;
}

async function doSync(): Promise<SyncResult> {
  const user = await currentUser();
  if (!supabase || !user) throw new Error('Sign in to sync.');
  const startedAt = Date.now();

  // 1. Push rows changed since the last push.
  const lastPush = await getMeta<number>('lastPush', 0);
  let pushed = 0;
  for (const tbl of SYNC_TABLES) {
    const rows = ((await (db[tbl] as any).toArray()) as Row[]).filter((r) => r.updatedAt > lastPush);
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500).map((r) => ({ user_id: user.id, tbl, id: r.id, data: r, updated_at: r.updatedAt }));
      const { error } = await supabase.from('maxfit_rows').upsert(chunk, { onConflict: 'user_id,tbl,id' });
      if (error) throw error;
      pushed += chunk.length;
    }
  }
  await setMeta('lastPush', startedAt);

  // 2. Pull rows changed on the server since the last pull (server clock).
  const lastPull = await getMeta<string | null>('lastPull', null);
  let pulled = 0;
  let cursor = lastPull;
  for (;;) {
    let q = supabase.from('maxfit_rows').select('tbl,id,data,updated_at,server_updated_at').order('server_updated_at', { ascending: true }).limit(1000);
    if (cursor) q = q.gt('server_updated_at', cursor);
    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) {
      const tbl = r.tbl as SyncTable;
      if (!SYNC_TABLES.includes(tbl)) continue;
      const table = db[tbl] as any;
      const local = (await table.get(r.id)) as Row | undefined;
      if (!local || local.updatedAt < r.updated_at) {
        await table.put(r.data);
        pulled++;
      }
    }
    cursor = data[data.length - 1].server_updated_at;
    if (data.length < 1000) break;
  }
  if (cursor) await setMeta('lastPull', cursor);
  const result = { pushed, pulled, at: Date.now() };
  await setMeta('lastSync', result);
  return result;
}

export async function lastSync(): Promise<SyncResult | null> {
  return getMeta<SyncResult | null>('lastSync', null);
}
