// All writes go through here, so every row gets updatedAt (needed for sync)
// and the game rules run in one place when a session ends.

import { EXERCISE_BY_ID, STARTER_IDS } from '../core/exercises';
import { EQUIPMENT } from '../core/equipment';
import { activeSeconds, newLive, switchMode, totals } from '../core/live';
import {
  availableExercises,
  buildStats,
  challengeMet,
  computeRecords,
  dayKey,
  doneSessions,
  fitsEquipment,
  ownedEquipment,
  habitTarget,
  levelFromXp,
  openChest,
  prFlags,
  sessionXp,
  totalXp,
  unlockedFrom,
  XP,
  type ChestReward,
  type BeatOf,
  type MeasuresOf,
} from '../core/rules';
import { beatFor, levelOf, measuresFor } from '../core/measures';
import type { Beat, EquipmentCategory, EquipmentId, Focus, Goal, LiveMode, Location, Measure, Plan, PlanItem, Profile, Session, Settings, WeightEntry, WorkSet } from '../core/types';
import { cleanTarget, copyName, copyPlan, PLAN_DESC_MAX, PLAN_NAME_MAX, planError } from '../core/plans';
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
    goals: [],
    focus: [],
    exerciseMeasures: {},
    revealed: [...STARTER_IDS],
    avatarStyle: 'athlete',
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

/**
 * Version of the record rules. When it goes up, every stored record flag (and the XP it gave) is checked
 * again once, so old sets follow the new rules (2 = "how to beat it", 2026-11-18).
 */
export const RECORD_RULES_VERSION = 2;

export async function migrateRecords(): Promise<boolean> {
  const done = ((await db.meta.get('recordRules'))?.value as number | undefined) ?? 0;
  if (done >= RECORD_RULES_VERSION) return false;
  await db.transaction('rw', [db.profile, db.sets, db.sessions, db.meta], async () => {
    const ids = [...new Set((await db.sets.toArray()).filter((x) => !x.deleted).map((x) => x.exerciseId))];
    await reconcileRecords(ids);
    await db.meta.put({ key: 'recordRules', value: RECORD_RULES_VERSION });
  });
  return true;
}

export async function getProfile(): Promise<Profile> {
  return (await db.profile.get('me')) ?? defaultProfile();
}

export async function updateProfile(patch: Partial<Profile>): Promise<void> {
  await db.profile.update('me', { ...patch, updatedAt: Date.now() });
}

function beatOfProfile(p: Profile): BeatOf {
  return (ex) => beatFor(ex, p.exerciseBeat, p.exerciseMeasures);
}

function measuresOfProfile(p: Profile): MeasuresOf {
  const beatOf = beatOfProfile(p);
  return (ex) => measuresFor(ex, p.exerciseMeasures, beatOf(ex));
}

/**
 * Set how this user beats one exercise: mode any with these measures, or mode same (fixed + beaten).
 * null = back to the default. Records and XP are re-checked.
 */
export async function setExerciseTrack(exerciseId: string, beat: Beat | null, measures: Measure[]): Promise<void> {
  const p = await getProfile();
  const own = { ...(p.exerciseMeasures ?? {}) };
  const beats = { ...(p.exerciseBeat ?? {}) };
  if (beat) beats[exerciseId] = beat;
  else delete beats[exerciseId];
  if (beat?.kind === 'any' && measures.length) own[exerciseId] = measures;
  else delete own[exerciseId];
  await db.transaction('rw', db.profile, db.sets, db.sessions, async () => {
    await updateProfile({ exerciseMeasures: own, exerciseBeat: beats });
    await reconcileRecords([exerciseId]);
  });
}

/** Set how this user measures one exercise in "beat any number" mode (empty = back to the default). */
export async function setExerciseMeasures(exerciseId: string, measures: Measure[]): Promise<void> {
  await setExerciseTrack(exerciseId, measures.length ? { kind: 'any' } : null, measures);
}

export async function setGoals(goals: Goal[], focus: Focus[]): Promise<void> {
  await updateProfile({ goals, focus });
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
  const now = Date.now();
  // Also take it out of every place that has it, so no place keeps a dead id.
  await db.transaction('rw', db.equipment, db.locations, async () => {
    await db.equipment.update(id, { deleted: true, updatedAt: now });
    const places = (await db.locations.toArray()).filter((l) => l.equipment.includes(id));
    await db.locations.bulkPut(places.map((l) => ({ ...l, equipment: l.equipment.filter((x) => x !== id), updatedAt: now })));
  });
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

export async function startSession(locationId: string | null, planId: string | null = null): Promise<Session> {
  // One transaction: a double tap cannot create two active sessions.
  return db.transaction('rw', db.sessions, db.profile, db.plans, async () => {
    const existing = await activeSession();
    if (existing) return existing;
    const now = Date.now();
    const plan = planId ? await db.plans.get(planId) : undefined;
    const usePlan = plan && !plan.deleted ? plan.id : null;
    const s: Session = { id: uid(), startedAt: now, endedAt: null, locationId, status: 'active', activeSec: 0, restSec: 0, xpEarned: 0, prs: 0, live: newLive(now), planId: usePlan, updatedAt: now };
    await db.sessions.put(s);
    // "Last used" is worked out from sessions (planLastUsed); the plan row is not touched, so an edit
    // made on another device is never overwritten by simply using the plan.
    await updateProfile({ lastLocationId: locationId });
    return s;
  });
}

// ---------- exercise plans (per place) ----------

export type PlanDraft = { id?: string; name: string; description: string; locationId: string; items: PlanItem[] };

/** Create or update a plan. Returns its id. */
export async function savePlan(draft: PlanDraft): Promise<string> {
  const items = draft.items.map((it) => ({ exerciseId: it.exerciseId, sets: Math.round(it.sets), target: cleanTarget(it.target) }));
  const clean = { ...draft, name: draft.name.trim().slice(0, PLAN_NAME_MAX), description: draft.description.trim().slice(0, PLAN_DESC_MAX), items };
  const err = planError(clean);
  if (err) throw new Error(err);
  const now = Date.now();
  return db.transaction('rw', db.plans, async () => {
    const old = clean.id ? await db.plans.get(clean.id) : undefined;
    if (clean.id && (!old || old.deleted)) throw new Error('This plan no longer exists.');
    const id = old?.id ?? uid();
    const row: Plan = old
      ? { ...old, name: clean.name, description: clean.description, locationId: clean.locationId, items, updatedAt: now }
      : { id, name: clean.name, description: clean.description, locationId: clean.locationId, items, createdAt: now, lastUsedAt: null, lastViewedAt: null, updatedAt: now };
    await db.plans.put(row);
    return id;
  });
}

/** Soft delete (so the delete syncs). Sessions started from it keep their sets. */
export async function deletePlan(id: string): Promise<void> {
  await db.plans.update(id, { deleted: true, updatedAt: Date.now() });
}

async function copyInto(id: string, locationId: string): Promise<string> {
  return db.transaction('rw', db.plans, async () => {
    const src = await db.plans.get(id);
    if (!src || src.deleted) throw new Error('This plan no longer exists.');
    const taken = (await db.plans.toArray()).filter((p) => !p.deleted && p.locationId === locationId).map((p) => p.name);
    // Same place: always "(copy)". Another place: keep the name unless that place already has it.
    const name = src.locationId === locationId || taken.some((t) => t.toLowerCase() === src.name.toLowerCase()) ? copyName(src.name, taken) : src.name;
    const copy = copyPlan(src, { id: uid(), locationId, name, now: Date.now() });
    await db.plans.put(copy);
    return copy.id;
  });
}

/** Duplicate a plan in the same place. Returns the new plan's id. */
export async function duplicatePlan(id: string): Promise<string> {
  const src = await db.plans.get(id);
  if (!src) throw new Error('This plan no longer exists.');
  return copyInto(id, src.locationId);
}

/** Import (copy) a plan from another place into this one. The original is not touched. */
export async function importPlan(id: string, toLocationId: string): Promise<string> {
  return copyInto(id, toLocationId);
}

/** Remember when a plan was last opened ("last viewed"), on this device only (never touches the synced row). */
export async function markPlanViewed(id: string): Promise<void> {
  await db.meta.put({ key: `planViewed:${id}`, value: Date.now() });
}

/** Add one exercise to the end of a plan (e.g. right after it unlocks). No-op if it is already there. */
export async function addToPlan(id: string, exerciseId: string, sets = 2): Promise<boolean> {
  return db.transaction('rw', db.plans, async () => {
    const p = await db.plans.get(id);
    if (!p || p.deleted) throw new Error('This plan no longer exists.');
    if (p.items.some((i) => i.exerciseId === exerciseId)) return false;
    await db.plans.put({ ...p, items: [...p.items, { exerciseId, sets, target: {} }], updatedAt: Date.now() });
    return true;
  });
}

export async function setMode(sessionId: string, mode: LiveMode): Promise<void> {
  const s = await db.sessions.get(sessionId);
  if (!s?.live || s.live.mode === mode) return;
  await db.sessions.update(sessionId, { live: switchMode(s.live, mode, Date.now()), updatedAt: Date.now() });
}

/**
 * Start a fresh rest now. Logging a set while the rest clock still runs (he did the set without tapping
 * Start set) must restart the rest, or "rest is over" fires during the next set (code review 2026-11-18).
 * The time since the last switch is banked as rest (we cannot know when the set began).
 */
export async function restartRest(sessionId: string): Promise<void> {
  const s = await db.sessions.get(sessionId);
  if (!s?.live) return;
  const now = Date.now();
  const live = s.live.mode === 'rest' ? switchMode(switchMode(s.live, 'exercise', now), 'rest', now) : switchMode(s.live, 'rest', now);
  await db.sessions.update(sessionId, { live, updatedAt: now });
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
  /** A record because the weight is heavier than ever. */
  newWeight?: boolean;
  previousBest: number;
}

async function allSets(): Promise<WorkSet[]> {
  return (await db.sets.toArray()).filter((s) => !s.deleted);
}

export async function logSet(sessionId: string, exerciseId: string, values: Pick<WorkSet, 'reps' | 'seconds' | 'weightKg' | 'distanceKm' | 'durationSec' | 'runSec' | 'walkSec' | 'restSec'>): Promise<LoggedSet> {
  const prof = await getProfile();
  const measuresOf = measuresOfProfile(prof);
  const beatOf = beatOfProfile(prof);
  const sets = await allSets();
  const before = computeRecords(sets, measuresOf, beatOf).get(exerciseId);
  const now = Date.now();
  // Sets of one exercise are ordered by time; two sets in the same millisecond would be ordered by their
  // random ids, so a set always gets a time after the last one of its exercise.
  const lastAt = Math.max(0, ...sets.filter((x) => x.exerciseId === exerciseId).map((x) => x.at));
  const set: WorkSet = { id: uid(), sessionId, exerciseId, at: Math.max(now, lastAt + 1), ...values, isPR: false, updatedAt: now };
  // The same rules as the record keeper (any: rule A; same: per weight / distance, new weight).
  const isPR = prFlags([...sets.filter((x) => x.exerciseId === exerciseId), set], measuresOf, beatOf).get(set.id) ?? false;
  set.isPR = isPR;
  await db.sets.put(set);
  const bt = beatOf(EXERCISE_BY_ID[exerciseId]);
  const lvl = levelOf(bt, set);
  const newWeight = isPR && bt.kind === 'same' && bt.fixed === 'weight' && lvl !== null && !before?.levels.has(lvl);
  return { set, isPR, newWeight, previousBest: before?.best ?? 0 };
}

/** Ends a cardio block: saves the run as one set, returns to normal session mode. */
export async function finishCardio(sessionId: string, distanceKm: number, reps?: number): Promise<LoggedSet | null> {
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
    reps,
    runSec: Math.round(c.run),
    walkSec: Math.round(c.walk),
    restSec: Math.round(c.rest),
    durationSec: Math.round(c.run + c.walk + c.rest),
  });
}

/**
 * After a set is edited or deleted, re-check which sets are records for these exercises and
 * fix each finished session's record count and XP by the difference (a set is worth XP.perSet,
 * a record XP.perPR). Call inside a transaction on profile, sets and sessions.
 */
async function reconcileRecords(exerciseIds: string[], removed: WorkSet[] = []): Promise<void> {
  const now = Date.now();
  const prof = await getProfile();
  const sets = await allSets();
  const flags = prFlags(sets, measuresOfProfile(prof), beatOfProfile(prof));
  const delta = new Map<string, { xp: number; prs: number }>();
  const add = (sid: string, xp: number, prs: number) => {
    const d = delta.get(sid) ?? { xp: 0, prs: 0 };
    delta.set(sid, { xp: d.xp + xp, prs: d.prs + prs });
  };
  const changed: WorkSet[] = [];
  for (const s of sets) {
    if (!exerciseIds.includes(s.exerciseId)) continue;
    const isPR = flags.get(s.id) ?? false;
    if (isPR !== s.isPR) {
      changed.push({ ...s, isPR, updatedAt: now });
      add(s.sessionId, isPR ? XP.perPR : -XP.perPR, isPR ? 1 : -1);
    }
  }
  for (const r of removed) add(r.sessionId, -XP.perSet - (r.isPR ? XP.perPR : 0), r.isPR ? -1 : 0);
  if (changed.length) await db.sets.bulkPut(changed);
  for (const [sid, d] of delta) {
    const sess = await db.sessions.get(sid);
    // Only finished sessions hold XP; an active session counts its sets when it ends.
    if (!sess || sess.deleted || sess.status !== 'done') continue;
    await db.sessions.update(sid, { xpEarned: Math.max(0, sess.xpEarned + d.xp), prs: Math.max(0, sess.prs + d.prs), updatedAt: now });
  }
}

export type SetValues = Pick<WorkSet, 'reps' | 'seconds' | 'weightKg' | 'distanceKm' | 'durationSec'>;

/** Correct a logged set. Records and XP are re-checked. */
export async function updateSet(id: string, values: SetValues): Promise<void> {
  await db.transaction('rw', db.profile, db.sets, db.sessions, async () => {
    const s = await db.sets.get(id);
    if (!s || s.deleted) throw new Error('This set no longer exists.');
    await db.sets.put({ ...s, ...values, updatedAt: Date.now() });
    await reconcileRecords([s.exerciseId]);
  });
}

export async function deleteSet(id: string): Promise<void> {
  await db.transaction('rw', db.profile, db.sets, db.sessions, async () => {
    const s = await db.sets.get(id);
    if (!s || s.deleted) return;
    await db.sets.update(id, { deleted: true, updatedAt: Date.now() });
    await reconcileRecords([s.exerciseId], [s]);
  });
}

/** Delete a session (active or finished) with all its sets. Its XP and anything only it unlocked go too. */
export async function discardSession(id: string): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', db.profile, db.sessions, db.sets, async () => {
    await db.sessions.update(id, { status: 'done', deleted: true, live: null, updatedAt: now });
    const sets = (await db.sets.where('sessionId').equals(id).toArray()).filter((s) => !s.deleted);
    await db.sets.bulkPut(sets.map((s) => ({ ...s, deleted: true, updatedAt: now })));
    // Later sets may now be records.
    await reconcileRecords([...new Set(sets.map((s) => s.exerciseId))]);
  });
}

export const deleteSession = discardSession;

/** Correct a finished session: its date and start time, minutes and place. */
export async function updateSession(id: string, patch: { startedAt?: number; activeSec?: number; restSec?: number; locationId?: string | null }): Promise<void> {
  if (patch.startedAt !== undefined && (!Number.isFinite(patch.startedAt) || patch.startedAt > Date.now() + 60_000)) throw new Error('Pick a real date and time, not in the future.');
  for (const v of [patch.activeSec, patch.restSec]) if (v !== undefined && (!Number.isFinite(v) || v < 0)) throw new Error('Minutes cannot be below 0.');
  await db.transaction('rw', db.profile, db.sessions, db.sets, async () => {
    const s = await db.sessions.get(id);
    if (!s || s.deleted) throw new Error('This session no longer exists.');
    if (s.status !== 'done') throw new Error('Finish the session before editing it.');
    const now = Date.now();
    const next: Session = { ...s, ...patch, updatedAt: now };
    const shift = next.startedAt - s.startedAt;
    next.endedAt = next.startedAt + (next.activeSec + next.restSec) * 1000;
    await db.sessions.put(next);
    // Moving a session to another day moves its sets with it (streaks and records follow the date).
    if (shift) {
      const sets = (await db.sets.where('sessionId').equals(id).toArray()).filter((x) => !x.deleted);
      await db.sets.bulkPut(sets.map((x) => ({ ...x, at: x.at + shift, updatedAt: now })));
      // The order of sets changed, so which ones are records may change too.
      await reconcileRecords([...new Set(sets.map((x) => x.exerciseId))]);
    }
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
    const measuresOf = measuresOfProfile(profile);
    const beatOf = beatOfProfile(profile);
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
    // Unlocks before this session: without its sets.
    const unlockedBefore = unlockedFrom(buildStats(allSessions, sets.filter((x) => x.sessionId !== id), xpBefore, now, measuresOf, beatOf), allSessions, profile.unlocked);
    const statsPre = buildStats(sessionsAfter, sets, xpBefore, now, measuresOf, beatOf);
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

    finished.xpEarned = xp;
    const stats = buildStats(sessionsAfter, sets, xpBefore + xp, now, measuresOf, beatOf);
    const unlockedMid = unlockedFrom(stats, sessionsAfter, profile.unlocked);

    // Mystery chest (surprises lean toward the goal profile)
    const equipment = await equipmentFor(s.locationId);
    const owned = ownedEquipment(await db.locations.toArray());
    const chest = openChest(id, {
      unlocked: unlockedMid,
      cosmetics: profile.cosmetics,
      hadPR: prs > 0,
      records: stats.records,
      available: availableExercises(unlockedMid, equipment),
      goals: profile.goals,
      focus: profile.focus,
      owned,
    });
    let cosmetics = profile.cosmetics;
    if (chest.kind === 'xp') {
      xp += chest.xp;
      parts.push({ label: 'Mystery chest', xp: chest.xp });
    } else if (chest.kind === 'color') cosmetics = [...cosmetics, chest.colorId];
    else if (chest.kind === 'secret') finished.chestSecret = chest.exerciseId;
    else if (chest.kind === 'challenge') challenge = chest.challenge;

    // Level-ups can open level-based unlocks too.
    finished.xpEarned = xp;
    const sessionsFinal = allSessions.map((x) => (x.id === id ? finished : x));
    const unlockedAfter = unlockedFrom(buildStats(sessionsFinal, sets, xpBefore + xp, now, measuresOf, beatOf), sessionsFinal, profile.unlocked);
    // Reveal only what the user can do with their equipment; the rest waits until they have it.
    // `revealed` remembers what was shown, so a move earned earlier is revealed once its equipment is added.
    const canDo = (x: string) => fitsEquipment(EXERCISE_BY_ID[x], owned);
    const shownBefore = profile.revealed ?? unlockedBefore.filter(canDo);
    const visibleAfter = unlockedAfter.filter(canDo);
    const newly = visibleAfter.filter((x) => !shownBefore.includes(x));
    const revealed = [...new Set([...shownBefore, ...visibleAfter])];

    await db.sessions.put(finished);
    await db.profile.update('me', { cosmetics, challenge, revealed, updatedAt: now });

    return {
      session: finished,
      sets: sessionSets,
      xp,
      xpParts: parts.filter((p) => p.xp > 0),
      levelBefore: levelFromXp(xpBefore),
      levelAfter: levelFromXp(xpBefore + xp),
      unlocked: newly,
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

/** Correct a weigh-in. If the new date already has one, that one is replaced. */
export async function updateWeight(id: string, date: string, kg: number): Promise<void> {
  await db.transaction('rw', db.weights, async () => {
    const w = await db.weights.get(id);
    if (!w || w.deleted) throw new Error('This weigh-in no longer exists.');
    const now = Date.now();
    const clash = (await db.weights.where('date').equals(date).toArray()).filter((x) => !x.deleted && x.id !== id);
    if (clash.length) await db.weights.bulkPut(clash.map((x) => ({ ...x, deleted: true, updatedAt: now })));
    await db.weights.put({ ...w, date, kg, updatedAt: now });
  });
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
    plans: await db.plans.toArray(),
  };
  return JSON.stringify(data);
}

const TABLES = ['profile', 'locations', 'sessions', 'sets', 'weights', 'equipment', 'plans'] as const;

/** Check a backup before touching any data. Returns a readable error, or null if OK. */
export function validateBackup(data: any): string | null {
  if (!data || data.app !== 'maxfit') return 'This is not a MaxFit backup file.';
  if (data.equipment === undefined) data.equipment = []; // backups made before the equipment library
  if (data.plans === undefined) data.plans = []; // backups made before exercise plans
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
  // A backup from before plans existed says nothing about plans: keep the plans on this phone.
  const hasPlans = Array.isArray(data?.plans);
  const err = validateBackup(data);
  if (err) throw new Error(err);
  const now = Date.now();
  await db.transaction('rw', [db.profile, db.locations, db.sessions, db.sets, db.weights, db.equipment, db.plans], async () => {
    for (const t of TABLES) {
      const table = db[t] as any;
      const keep = new Set<string>(data[t].map((r: any) => r.id));
      const current = (await table.toArray()) as { id: string; deleted?: boolean }[];
      const gone = t === 'plans' && !hasPlans ? [] : current.filter((r) => !keep.has(r.id) && !r.deleted).map((r) => ({ ...r, deleted: true, updatedAt: now }));
      await table.bulkPut([...data[t].map((r: any) => ({ ...r, updatedAt: now })), ...gone]);
    }
  });
  // Old backups had profile.xp; XP is now derived from sessions, so the field is ignored.
}

/**
 * Delete all training data (sessions, sets, weigh-ins) and game progress, keeping places,
 * equipment, settings, goals and photos. Soft delete, so the cloud copy is deleted too.
 */
export async function resetTrainingData(): Promise<void> {
  const now = Date.now();
  await db.transaction('rw', [db.profile, db.sessions, db.sets, db.weights], async () => {
    for (const table of [db.sessions, db.sets, db.weights] as const) {
      const rows = ((await (table as any).toArray()) as { id: string; deleted?: boolean }[]).filter((r) => !r.deleted);
      await (table as any).bulkPut(rows.map((r) => ({ ...r, deleted: true, ...(table === db.sessions ? { status: 'done', live: null } : {}), updatedAt: now })));
    }
    await db.profile.update('me', { unlocked: [...STARTER_IDS], cosmetics: ['ember'], color: 'ember', challenge: null, revealed: [...STARTER_IDS], resetAt: now, updatedAt: now });
  });
}

/** Erase all MaxFit data on this device (used before another account signs in). */
export async function wipeLocal(): Promise<void> {
  await db.transaction('rw', [db.profile, db.locations, db.sessions, db.sets, db.weights, db.equipment, db.meta, db.photos, db.plans], async () => {
    await Promise.all([db.profile.clear(), db.locations.clear(), db.sessions.clear(), db.sets.clear(), db.weights.clear(), db.equipment.clear(), db.meta.clear(), db.photos.clear(), db.plans.clear()]);
  });
  await ensureSeed();
}
