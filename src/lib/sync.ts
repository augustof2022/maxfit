// Cloud sync with Supabase. The phone database stays the main copy (works offline at the gym).
// Order: pull first (so a new device never overwrites real data), then push.
// The server keeps the newest copy per row (maxfit_push only overwrites older rows).

import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { db, SYNC_TABLES, type SyncTable } from '../data/db';
import { mergeRow } from './merge';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const syncConfigured = !!supabase;

type Row = { id: string; updatedAt: number; [k: string]: unknown };

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

/** Signs out. Local data stays (it is still yours, and the app works offline). */
export async function signOut() {
  await supabase?.auth.signOut();
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  at: number;
}

let running: Promise<SyncResult> | null = null;

/** Pull then push. Safe to call often; concurrent calls share one run. */
export function syncNow(): Promise<SyncResult> {
  if (!running) running = doSync().finally(() => (running = null));
  return running;
}

const PAGE = 1000;
const OVERLAP_MS = 2 * 60_000; // re-read recent rows in case a slow upload committed late

async function doSync(): Promise<SyncResult> {
  const user = await currentUser();
  if (!supabase || !user) throw new Error('Sign in to sync.');

  // Never mix two accounts' data on one phone.
  const owner = await getMeta<string | null>('ownerId', null);
  if (owner && owner !== user.id) {
    throw new Error('This phone has MaxFit data from another account. Export a backup, then Settings → Erase this device, then sign in again.');
  }
  if (!owner) await setMeta('ownerId', user.id);

  const startedAt = Date.now();
  const pulled = await pull();
  const pushed = await push(startedAt);
  const result = { pushed, pulled, at: Date.now() };
  await setMeta('lastSync', result);
  return result;
}

async function applyRemote(rows: { tbl: string; id: string; data: Row }[]): Promise<number> {
  let n = 0;
  for (const r of rows) {
    const tbl = r.tbl as SyncTable;
    if (!SYNC_TABLES.includes(tbl)) continue;
    const table = db[tbl] as any;
    const merged = mergeRow(tbl, (await table.get(r.id)) as Row | undefined, r.data);
    if (merged) {
      await table.put(merged);
      n++;
    }
  }
  return n;
}

async function pull(): Promise<number> {
  let cursor = await getMeta<number>('pullSeq', 0);
  const lastTime = await getMeta<string | null>('pullTime', null);
  let maxTime = lastTime;
  let pulled = 0;

  // 1. Page through new rows by a unique, increasing sequence number (no rows skipped).
  for (;;) {
    const { data, error } = await supabase!.from('maxfit_rows').select('tbl,id,data,seq,server_updated_at').gt('seq', cursor).order('seq', { ascending: true }).limit(PAGE);
    if (error) throw error;
    if (!data?.length) break;
    pulled += await applyRemote(data as any);
    cursor = Number(data[data.length - 1].seq);
    for (const r of data) if (!maxTime || r.server_updated_at > maxTime) maxTime = r.server_updated_at;
    if (data.length < PAGE) break;
  }

  // 2. Re-read the last 2 minutes: a row whose upload committed late can have a lower seq.
  if (lastTime) {
    const since = new Date(new Date(lastTime).getTime() - OVERLAP_MS).toISOString();
    let after = 0;
    for (;;) {
      const { data, error } = await supabase!.from('maxfit_rows').select('tbl,id,data,seq').gte('server_updated_at', since).gt('seq', after).order('seq', { ascending: true }).limit(PAGE);
      if (error) throw error;
      if (!data?.length) break;
      pulled += await applyRemote(data as any);
      after = Number(data[data.length - 1].seq);
      if (data.length < PAGE) break;
    }
  }

  await setMeta('pullSeq', cursor);
  if (maxTime) await setMeta('pullTime', maxTime);
  return pulled;
}

async function push(startedAt: number): Promise<number> {
  const lastPush = await getMeta<number>('lastPush', 0);
  let pushed = 0;
  for (const tbl of SYNC_TABLES) {
    const rows = ((await (db[tbl] as any).toArray()) as Row[]).filter((r) => r.updatedAt > lastPush);
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500).map((r) => ({ tbl, id: r.id, data: r, updated_at: r.updatedAt }));
      // Server-side upsert that only replaces an OLDER row (see supabase/migrations).
      const { error } = await supabase!.rpc('maxfit_push', { rows: chunk });
      if (error) throw error;
      pushed += chunk.length;
    }
  }
  await setMeta('lastPush', startedAt);
  return pushed;
}

export async function lastSync(): Promise<SyncResult | null> {
  return getMeta<SyncResult | null>('lastSync', null);
}
