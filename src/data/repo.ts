// All writes go through here, so every row gets updatedAt (needed for sync)
// and the game rules run in one place when a session ends.

import { EXERCISE_BY_ID, STARTER_IDS } from '../core/exercises';
import { EQUIPMENT } from '../core/equipment';
import { activeSeconds, newLive, switchMode, totals } from '../core/live';
import {
  availableExercises,
  betterThan,
  buildStats,
  challengeMet,
  computeRecords,
  dayKey,
  doneSessions,
  habitTarget,
  levelFromXp,
  newUnlocks,
  openChest,
  sessionXp,
  totalXp,
  XP,
  type ChestReward,
} from '../core/rules';
import type { EquipmentCategory, EquipmentId, LiveMode, Location, Profile, Session, Settings, WeightEntry, WorkSet } from '../core/types';
import { db, uid } from './db';

export const DEFAULT_SETTINGS: Settings = {
  restLimitSec: 90,
  sound: true,
  vibrate: true,
  workoutReminder: { enabled: false, time: '18:00', days: [1, 2, 3, 4, 5, 6] },
  weighReminder: { enabled: false, time: '07:00', day: 0 },
};

/** Seed rows use updatedAt 0, so any real copy from the cloud wins over them. */
export function defaultProfile(now = 0): Profile {
  return {
    id: 'me',
    name: '',
    heightCm: null,
    unlocked: [...STARTER_IDS],
    cosmetics: ['ember'],
    color: 'ember',
    habitBaseMin: 10,
    habitCapMin: 45,
    settings: DEFAULT_SETTINGS,
    lastLocationId: null,
    challenge: null,
    updatedAt: now,
  };
}

/** First run: create the profile and two starter locations. */
export async function ensureSeed(): Promise<void> {
  await db.transaction('rw', db.profile, db.locations, async () => {
    if (!(await db.profile.get('me'))) await db.profile.put(defaultProfile());
    if ((await db.locations.count()) === 0) {
      // Fixed ids: the same seed on two devices is the same row, not a duplicate.
      const home: Location = { id: 'home', name: 'Home', kind: 'home', equipment: ['mat'], updatedAt: 0 };
      const gym: Location = { id: 'gym', name: 'Gym', kind: 'gym', equipment: EQUIPMENT.map((e) => e.id), updatedAt: 0 };
      await db.locations.bulkPut([home, gym]);
      await db.profile.update('me', { lastLocationId: home.id });
    }
  });
}

export async function getProfile(): Promise<Profile> {
  return (await db.profile.get('me')) ?? defaultProfile();
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  await db.profile.update('me', { ...patch, updatedAt: Date.now() });
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const p = await getProfile();
  await updateProfile({ settings: { ...p.settings, ...patch } });
}

// ---------- locations ----------

export async function saveLocation(loc: Omit<Location, "updatedAt" | "id"> & { id?: string }): Promise<string> {
  const id = loc.id || uid();
  await db.locations.put({ ...loc, id, updatedAt: Date.now() });
  return id;
}

export async function deleteLocation(id: string): Promise<void> {
  await db.locations.update(id, { deleted: true, updatedAt: Date.now() });
}

/** Add an item to the user's own equipment library. Returns its id. */
export async function addEquipment(name: string, category: EquipmentCategory): Promise<string> {
  const clean = name.trim().slice(0, 40);
  if (!clean) throw new Error('Give the equipment a name.');
  const all = await db.equipment.toArray();
  const same = all.find((e) => !e.deleted && e.name.toLowerCase() === clean.toLowerCase());
  if (same) return same.id;
  const id = `custom-${uid()}`;
  await db.equipment.put({ id, name: clean, category, custom: true, updatedAt: Date.now() });
  return id;
}

/** Remove one of the user's own items from the library (soft delete, so it syncs). */
export async function deleteEquipment(id: string): Promise<void> {
  if (!id.startsWith('custom-')) throw new Error('Built-in equipment cannot be deleted.');
  await db.equipment.update(id, { deleted: true, updatedAt: Date.now() });
}

export async function equipmentFor(locationId: string | null): Promise<EquipmentId[]> {
  if (!locationId) return [];
  return (await db.locations.get(locationId))?.equipment ?? [];
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

// ---------- sessions ----------

export async function activeSession(): Promise<Session | undefined> {
  return (await db.sessions.where('status').equals('active').toArray()).find((s) => !s.deleted);
}

export async function startSession(locationId: string | null): Promise<Session> {
  // One transaction: a double tap cannot create two active sessions.
  return db.transaction('rw', db.sessions, db.profile, async () => {
    const existing = await activeSession();
    if (existing) return existing;
    const now = Date.now();
    const s: Session = { id: uid(), startedAt: now, endedAt: null, locationId, status: 'active', activeSec: 0, restSec: 0, xpEarned: 0, prs: 0, live: newLive(now), updatedAt: now };
    await db.sessions.put(s);
    await updateProfile({ lastLocationId: locationId });
    return s;
  });
}

export async function setMode(sessionId: string, mode: LiveMode): Promise<void> {
  const s = await db.sessions.get(sessionId);
  if (!s?.live || s.live.mode === mode) return;
  await db.sessions.update(sessionId, { live: switchMode(s.live, mode, Date.now()), updatedAt: Date.now() });
}

export async function startCardio(sessionId: string, exerciseId: string): Promise<void> {
  const s = await db.sessions.get(sessionId);
  if (!s?.live) return;
  const now = Date.now();
  const live = switchMode(s.live, 'run', now);
  live.cardio = { exerciseId, banked: { idle: 0, exercise: 0, rest: 0, run: 0, walk: 0 } };
  await db.sessions.update(sessionId, { live, updatedAt: now });
}

export async function cancelCardio(sessionId: string): Promise<void> {
  const s = await db.sessions.get(sessionId);
  if (!s?.live) return;
  const live = switchMode(s.live, 'exercise', Date.now());
  live.cardio = null;
  await db.sessions.update(sessionId, { live, updatedAt: Date.now() });
}

export interface LoggedSet {
  set: WorkSet;
  isPR: boolean;
  previousBest: number;
}

async function allSets(): Promise<WorkSet[]> {
  return (await db.sets.toArray()).filter((s) => !s.deleted);
}

export async function logSet(sessionId: string, exerciseId: string, values: Pick<WorkSet, 'reps' | 'seconds' | 'weightKg' | 'distanceKm' | 'durationSec' | 'runSec' | 'walkSec' | 'restSec'>): Promise<LoggedSet> {
  const ex = EXERCISE_BY_ID[exerciseId];
  const before = computeRecords(await allSets()).get(exerciseId);
  const now = Date.now();
  const set: WorkSet = { id: uid(), sessionId, exerciseId, at: now, ...values, isPR: false, updatedAt: now };
  const isPR = !!before?.bestSet && betterThan(ex, set, before.bestSet);
  set.isPR = isPR;
  await db.sets.put(set);
  return { set, isPR, previousBest: before?.best ?? 0 };
}

/** Ends a cardio block: saves the run as one set, returns to normal session mode. */
export async function finishCardio(sessionId: string, distanceKm: number): Promise<LoggedSet | null> {
  const s = await db.sessions.get(sessionId);
  if (!s?.live?.cardio) return null;
  const now = Date.now();
  const exerciseId = s.live.cardio.exerciseId;
  const live = switchMode(s.live, 'exercise', now);
  const c = live.cardio!.banked;
  live.cardio = null;
  await db.sessions.update(sessionId, { live, updatedAt: now });
  return logSet(sessionId, exerciseId, {
    distanceKm,
    runSec: Math.round(c.run),
    walkSec: Math.round(c.walk),
    restSec: Math.round(c.rest),
    durationSec: Math.round(c.run + c.walk + c.rest),
  });
}

export async function deleteSet(id: string): Promise<void> {
  await db.sets.update(id, { deleted: true, updatedAt: Date.now() });
}

export async function discardSession(id: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.sessions, db.sets, async () => {
    await db.sessions.update(id, { status: 'done', deleted: true, live: null, updatedAt: now });
    const sets = await db.sets.where('sessionId').equals(id).toArray();
    await db.sets.bulkPut(sets.map((s) => ({ ...s, deleted: true, updatedAt: now })));
  });
}

export interface SessionSummary {
  session: Session;
  sets: WorkSet[];
  xp: number;
  xpParts: { label: string; xp: number }[];
  levelBefore: number;
  levelAfter: number;
  unlocked: string[];
  chest: ChestReward;
  challengeDone: boolean;
  habitTargetMin: number;
  habitMet: boolean;
  streak: number;
  /** true when the session was left open and was ended at the last activity */
  trimmed: boolean;
}

/** A session with no activity for this long was forgotten; it ends at the last activity. */
export const IDLE_CAP_MS = 30 * 60_000;

export async function finishSession(id: string): Promise<SessionSummary> {
  // One transaction: a sync or a second tap cannot interleave and overwrite the result.
  return db.transaction('rw', [db.sessions, db.sets, db.profile, db.locations], async () => {
    const s = await db.sessions.get(id);
    if (!s || !s.live || s.status !== 'active') throw new Error('This session is already finished.');
    const sessionSets = (await db.sets.where('sessionId').equals(id).toArray()).filter((x) => !x.deleted);
    if (sessionSets.length === 0) throw new Error('Log at least one set (or a run) before finishing. Or discard the session.');

    // Forgotten session: end it shortly after the last activity, not hours later.
    const now = Date.now();
    const lastActivity = Math.max(s.live.modeStartedAt, ...sessionSets.map((x) => x.at));
    const trimmed = now - lastActivity > IDLE_CAP_MS;
    const endAt = trimmed ? lastActivity + 60_000 : now;

    const t = totals(s.live, endAt);
    const activeSec = Math.round(activeSeconds(t));
    const restSec = Math.round(t.rest);
    const profile = await getProfile();
    const prs = sessionSets.filter((x) => x.isPR).length;

    const allSessions = await db.sessions.toArray();
    const xpBefore = totalXp(allSessions);
    const targetBefore = habitTarget(allSessions, profile.habitBaseMin, profile.habitCapMin);
    const today = dayKey(s.startedAt);
    const earlierToday = doneSessions(allSessions).filter((x) => dayKey(x.startedAt) === today);
    const minBefore = earlierToday.reduce((a, x) => a + x.activeSec + x.restSec, 0) / 60;
    const minAfter = minBefore + (activeSec + restSec) / 60;
    // Streak and daily-goal bonuses are paid once per day [Design choice; Q6 for Renz].
    const firstToday = earlierToday.length === 0;
    const habitMet = minAfter >= targetBefore;
    const goalCrossedNow = habitMet && minBefore < targetBefore;

    const finished: Session = { ...s, status: 'done', endedAt: endAt, activeSec, restSec, prs, live: null, updatedAt: now };
    const sessionsAfter = allSessions.map((x) => (x.id === id ? finished : x));
    const sets = await allSets();
    const statsPre = buildStats(sessionsAfter, sets, xpBefore, now);
    const streakBonus = firstToday ? Math.min(XP.streakCap, statsPre.streak * XP.perStreakDay) : 0;
    const parts = [
      { label: plural(sessionSets.length, 'set'), xp: sessionSets.length * XP.perSet },
      { label: plural(prs, 'new record'), xp: prs * XP.perPR },
      { label: 'Session done', xp: XP.sessionDone },
      { label: plural(Math.floor(activeSec / 60), 'active minute'), xp: Math.floor(activeSec / 60) * XP.perActiveMinute },
      { label: `${statsPre.streak}-day streak (once a day)`, xp: streakBonus },
      { label: 'Daily goal met', xp: goalCrossedNow ? XP.habitGoalMet : 0 },
    ];
    let xp = sessionXp({ sets: sessionSets.length, prs, activeSec, streak: firstToday ? statsPre.streak : 0, habitMet: goalCrossedNow });

    // Surprise challenge from an earlier chest
    let challengeDone = false;
    let challenge = profile.challenge;
    if (challenge && challengeMet(challenge, sessionSets)) {
      challengeDone = true;
      xp += challenge.xp;
      parts.push({ label: 'Surprise challenge beaten', xp: challenge.xp });
      challenge = null;
    }

    const stats = buildStats(sessionsAfter, sets, xpBefore + xp, now);
    const unlockedNow = newUnlocks(profile.unlocked, stats);
    let unlocked = [...profile.unlocked, ...unlockedNow];

    // Mystery chest
    const equipment = await equipmentFor(s.locationId);
    const chest = openChest(id, { unlocked, cosmetics: profile.cosmetics, hadPR: prs > 0, records: stats.records, available: availableExercises(unlocked, equipment) });
    let cosmetics = profile.cosmetics;
    if (chest.kind === 'xp') {
      xp += chest.xp;
      parts.push({ label: 'Mystery chest', xp: chest.xp });
    } else if (chest.kind === 'color') cosmetics = [...cosmetics, chest.colorId];
    else if (chest.kind === 'secret') unlocked = [...unlocked, chest.exerciseId];
    else if (chest.kind === 'challenge') challenge = chest.challenge;

    // Level-ups can open level-based unlocks too.
    const more = newUnlocks(unlocked, buildStats(sessionsAfter, sets, xpBefore + xp, now));
    unlocked = [...unlocked, ...more];

    finished.xpEarned = xp;
    await db.sessions.put(finished);
    await db.profile.update('me', { unlocked, cosmetics, challenge, updatedAt: now });

    return {
      session: finished,
      sets: sessionSets,
      xp,
      xpParts: parts.filter((p) => p.xp > 0),
      levelBefore: levelFromXp(xpBefore),
      levelAfter: levelFromXp(xpBefore + xp),
      unlocked: [...unlockedNow, ...more, ...(chest.kind === 'secret' ? [chest.exerciseId] : [])],
      chest,
      challengeDone,
      habitTargetMin: habitTarget(sessionsAfter, profile.habitBaseMin, profile.habitCapMin),
      habitMet,
      streak: stats.streak,
      trimmed,
    };
  });
}

// ---------- weight ----------

export async function addWeight(date: string, kg: number): Promise<void> {
  // One entry per day: replace that day's entry.
  const same = (await db.weights.where('date').equals(date).toArray()).filter((w) => !w.deleted);
  const entry: WeightEntry = { id: same[0]?.id ?? uid(), date, kg, updatedAt: Date.now() };
  await db.weights.put(entry);
}

export async function deleteWeight(id: string): Promise<void> {
  await db.weights.update(id, { deleted: true, updatedAt: Date.now() });
}

// ---------- backup ----------

export async function exportAll(): Promise<string> {
  const data = {
    app: 'maxfit',
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: await db.profile.toArray(),
    locations: await db.locations.toArray(),
    sessions: await db.sessions.toArray(),
    sets: await db.sets.toArray(),
    weights: await db.weights.toArray(),
    equipment: await db.equipment.toArray(),
  };
  return JSON.stringify(data);
}

const TABLES = ['profile', 'locations', 'sessions', 'sets', 'weights', 'equipment'] as const;

/** Check a backup before touching any data. Returns a readable error, or null if OK. */
export function validateBackup(data: any): string | null {
  if (!data || data.app !== 'maxfit') return 'This is not a MaxFit backup file.';
  if (data.equipment === undefined) data.equipment = []; // backups made before the equipment library
  for (const t of TABLES) if (!Array.isArray(data[t])) return `Backup is missing "${t}".`;
  if (data.profile.length !== 1 || data.profile[0]?.id !== 'me') return 'Backup has no valid profile.';
  for (const t of TABLES) if (data[t].some((r: any) => !r || typeof r.id !== 'string')) return `Backup has a broken row in "${t}".`;
  return null;
}

/**
 * Restore a backup. Rows get updatedAt = now so they sync up and win; rows not in the backup
 * are soft-deleted (not cleared) so the delete also reaches the cloud.
 */
export async function importAll(json: string): Promise<void> {
  const data = JSON.parse(json);
  const err = validateBackup(data);
  if (err) throw new Error(err);
  const now = Date.now();
  await db.transaction('rw', [db.profile, db.locations, db.sessions, db.sets, db.weights, db.equipment], async () => {
    for (const t of TABLES) {
      const table = db[t] as any;
      const keep = new Set<string>(data[t].map((r: any) => r.id));
      const current = (await table.toArray()) as { id: string; deleted?: boolean }[];
      const gone = current.filter((r) => !keep.has(r.id) && !r.deleted).map((r) => ({ ...r, deleted: true, updatedAt: now }));
      await table.bulkPut([...data[t].map((r: any) => ({ ...r, updatedAt: now })), ...gone]);
    }
  });
  // Old backups had profile.xp; XP is now derived from sessions, so the field is ignored.
}

/** Erase all MaxFit data on this device (used before another account signs in). */
export async function wipeLocal(): Promise<void> {
  await db.transaction('rw', [db.profile, db.locations, db.sessions, db.sets, db.weights, db.equipment, db.meta], async () => {
    await Promise.all([db.profile.clear(), db.locations.clear(), db.sessions.clear(), db.sets.clear(), db.weights.clear(), db.equipment.clear(), db.meta.clear()]);
  });
  await ensureSeed();
}
