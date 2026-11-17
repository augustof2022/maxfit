// The game engine. Pure functions only (no database, no clock unless passed in),
// so every rule can be unit-tested. See docs/GAME-DESIGN.md for the "why".

import { EXERCISE_BY_ID, EXERCISES, SECRET_IDS } from './exercises';
import type { Challenge, EquipmentId, Exercise, Session, UnlockRule, WorkSet } from './types';

// ---------- dates ----------

/** Local calendar day as YYYY-MM-DD (the phone's time zone, e.g. GMT+8). */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Whole days between two day keys (b - a). */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

// ---------- streak & stats ----------

export function doneSessions(sessions: Session[]): Session[] {
  return sessions.filter((s) => s.status === 'done' && !s.deleted).sort((a, b) => a.startedAt - b.startedAt);
}

/** Total XP = sum of what each finished session earned. Derived, so two devices can never lose each other's XP. */
export function totalXp(sessions: Session[]): number {
  return doneSessions(sessions).reduce((t, s) => t + (s.xpEarned || 0), 0);
}

/** Days in a row with at least one finished session. Alive if the last one was today or yesterday. */
export function currentStreak(sessions: Session[], now: number): number {
  const days = [...new Set(doneSessions(sessions).map((s) => dayKey(s.startedAt)))].sort();
  if (days.length === 0) return 0;
  const today = dayKey(now);
  const last = days[days.length - 1];
  if (daysBetween(last, today) > 1) return 0;
  let streak = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (daysBetween(days[i - 1], days[i]) === 1) streak++;
    else break;
  }
  return streak;
}

export function bestStreak(sessions: Session[]): number {
  const days = [...new Set(doneSessions(sessions).map((s) => dayKey(s.startedAt)))].sort();
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

// ---------- records (benchmarks) ----------

export interface ExRecord {
  exerciseId: string;
  /** The single number used for unlocks and "beat this". reps, seconds, kg or km. */
  best: number;
  bestSet: WorkSet | null;
  last: WorkSet | null;
  count: number;
  /** cardio only: fastest pace in minutes per km */
  bestPace: number | null;
}

function liveSets(sets: WorkSet[]): WorkSet[] {
  return sets.filter((s) => !s.deleted).sort((a, b) => a.at - b.at);
}

/** The value a set scores for its exercise's metric. */
export function setValue(ex: Exercise, s: WorkSet): number {
  switch (ex.metric) {
    case 'reps':
      return s.reps ?? 0;
    case 'time':
      return s.seconds ?? 0;
    case 'weight_reps':
      return s.weightKg ?? 0;
    case 'distance':
      return s.distanceKm ?? 0;
  }
}

/** Is set `a` better than set `b` for this exercise? Weight: heavier wins, then more reps. */
export function betterThan(ex: Exercise, a: WorkSet, b: WorkSet | null): boolean {
  if (!b) return setValue(ex, a) > 0;
  const va = setValue(ex, a);
  const vb = setValue(ex, b);
  if (ex.metric === 'weight_reps' && va === vb) return (a.reps ?? 0) > (b.reps ?? 0);
  return va > vb;
}

export function pace(s: WorkSet): number | null {
  if (!s.distanceKm || !s.durationSec) return null;
  return s.durationSec / 60 / s.distanceKm;
}

export function computeRecords(sets: WorkSet[]): Map<string, ExRecord> {
  const out = new Map<string, ExRecord>();
  for (const s of liveSets(sets)) {
    const ex = EXERCISE_BY_ID[s.exerciseId];
    if (!ex) continue;
    const r: ExRecord = out.get(s.exerciseId) ?? { exerciseId: s.exerciseId, best: 0, bestSet: null, last: null, count: 0, bestPace: null };
    r.count++;
    r.last = s;
    if (betterThan(ex, s, r.bestSet)) {
      r.bestSet = s;
      r.best = setValue(ex, s);
    }
    const p = pace(s);
    if (p !== null && (r.bestPace === null || p < r.bestPace)) r.bestPace = p;
    out.set(s.exerciseId, r);
  }
  return out;
}

/** What to aim for next set: always "beat the record by a little" (progressive overload). */
export interface Target {
  reps?: number;
  seconds?: number;
  weightKg?: number;
  distanceKm?: number;
  label: string;
}

export const REP_RANGE = { low: 8, high: 12 };
export const WEIGHT_STEP_KG = 2.5;

export function nextTarget(ex: Exercise, rec: ExRecord | undefined): Target {
  const b = rec?.bestSet;
  switch (ex.metric) {
    case 'reps': {
      const reps = b ? (b.reps ?? 0) + 1 : 5;
      return { reps, label: b ? `Beat ${b.reps}: do ${reps}` : 'First time: try 5, or as many as you can' };
    }
    case 'time': {
      const seconds = b ? (b.seconds ?? 0) + 5 : 20;
      return { seconds, label: b ? `Beat ${b.seconds}s: hold ${seconds}s` : 'First time: try 20 seconds' };
    }
    case 'weight_reps': {
      if (!b) return { weightKg: 0, reps: REP_RANGE.low, label: `First time: pick a weight you can lift ${REP_RANGE.low}-${REP_RANGE.high} times` };
      // Double progression: add reps up to the top of the range, then add weight and drop back.
      if ((b.reps ?? 0) >= REP_RANGE.high) {
        const w = round1((b.weightKg ?? 0) + WEIGHT_STEP_KG);
        return { weightKg: w, reps: REP_RANGE.low, label: `Level up: ${w} kg x ${REP_RANGE.low}` };
      }
      const reps = (b.reps ?? 0) + 1;
      return { weightKg: b.weightKg, reps, label: `Beat ${b.weightKg} kg x ${b.reps}: do ${reps} reps` };
    }
    case 'distance': {
      if (!b) return { distanceKm: 1, label: 'First time: run or walk 1 km' };
      const d = round1((b.distanceKm ?? 0) + 0.1);
      const p = rec?.bestPace;
      return { distanceKm: d, label: `Beat ${b.distanceKm} km: go ${d} km${p ? ` or beat ${fmtPace(p)}/km` : ''}` };
    }
  }
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function fmtPace(minPerKm: number): string {
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ---------- XP, levels, avatar ----------

/** Total XP needed to reach level n. L2 = 200, L5 = 2000, L10 = 9000, L20 = 38000. */
export function xpForLevel(n: number): number {
  return 100 * n * (n - 1);
}

export function levelFromXp(xp: number): number {
  let n = 1;
  while (xpForLevel(n + 1) <= xp) n++;
  return n;
}

export function levelProgress(xp: number): { level: number; into: number; need: number } {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  return { level, into: xp - base, need: xpForLevel(level + 1) - base };
}

export const XP = {
  perSet: 10,
  perPR: 25,
  sessionDone: 20,
  perActiveMinute: 1,
  perStreakDay: 5,
  streakCap: 50,
  habitGoalMet: 30,
} as const;

export function sessionXp(input: { sets: number; prs: number; activeSec: number; streak: number; habitMet: boolean }): number {
  return (
    input.sets * XP.perSet +
    input.prs * XP.perPR +
    XP.sessionDone +
    Math.floor(input.activeSec / 60) * XP.perActiveMinute +
    Math.min(XP.streakCap, input.streak * XP.perStreakDay) +
    (input.habitMet ? XP.habitGoalMet : 0)
  );
}

export const AVATAR_STAGES = [
  { minLevel: 1, name: 'Rookie' },
  { minLevel: 3, name: 'Trainee' },
  { minLevel: 5, name: 'Fighter' },
  { minLevel: 8, name: 'Warrior' },
  { minLevel: 12, name: 'Champion' },
  { minLevel: 17, name: 'Titan' },
  { minLevel: 25, name: 'Legend' },
];

export function avatarStage(level: number): number {
  let i = 0;
  AVATAR_STAGES.forEach((s, idx) => {
    if (level >= s.minLevel) i = idx;
  });
  return i;
}

/** Gear the avatar wears, earned by the number of unlocked exercises. */
export const GEAR = [
  { unlocks: 4, id: 'headband', name: 'Headband' },
  { unlocks: 6, id: 'wristbands', name: 'Wristbands' },
  { unlocks: 9, id: 'belt', name: 'Lifting belt' },
  { unlocks: 13, id: 'cape', name: 'Cape' },
  { unlocks: 18, id: 'aura', name: 'Power aura' },
  { unlocks: 25, id: 'crown', name: 'Crown' },
];

export function gearFor(unlockCount: number): string[] {
  return GEAR.filter((g) => unlockCount >= g.unlocks).map((g) => g.id);
}

// ---------- unlocks ----------

export interface GameStats {
  streak: number;
  bestStreak: number;
  sessions: number;
  level: number;
  totalMinutes: number;
  records: Map<string, ExRecord>;
}

export function buildStats(sessions: Session[], sets: WorkSet[], xp: number, now: number): GameStats {
  const done = doneSessions(sessions);
  return {
    streak: currentStreak(sessions, now),
    bestStreak: bestStreak(sessions),
    sessions: done.length,
    level: levelFromXp(xp),
    totalMinutes: Math.floor(done.reduce((t, s) => t + s.activeSec + s.restSec, 0) / 60),
    records: computeRecords(sets),
  };
}

/** Progress toward a rule as current / needed (needed > 0). Unlocks use bestStreak so a rule met once stays met. */
export function ruleProgress(rule: UnlockRule, st: GameStats): { current: number; needed: number } {
  switch (rule.type) {
    case 'start':
      return { current: 1, needed: 1 };
    case 'secret':
      return { current: 0, needed: 1 };
    case 'streak':
      return { current: Math.max(st.streak, st.bestStreak), needed: rule.days };
    case 'sessions':
      return { current: st.sessions, needed: rule.count };
    case 'level':
      return { current: st.level, needed: rule.level };
    case 'totalMinutes':
      return { current: st.totalMinutes, needed: rule.minutes };
    case 'record':
      return { current: st.records.get(rule.exerciseId)?.best ?? 0, needed: rule.value };
    case 'all': {
      // progress = the weakest part
      let worst = { current: 1, needed: 1 };
      for (const r of rule.rules) {
        const p = ruleProgress(r, st);
        if (p.current / p.needed < worst.current / worst.needed) worst = p;
      }
      return worst;
    }
    case 'any': {
      // progress = the closest part
      let bestP = { current: 0, needed: 1 };
      for (const r of rule.rules) {
        const p = ruleProgress(r, st);
        if (p.current / p.needed > bestP.current / bestP.needed) bestP = p;
      }
      return bestP;
    }
  }
}

export function ruleMet(rule: UnlockRule, st: GameStats): boolean {
  if (rule.type === 'all') return rule.rules.every((r) => ruleMet(r, st));
  if (rule.type === 'any') return rule.rules.some((r) => ruleMet(r, st));
  const p = ruleProgress(rule, st);
  return p.current >= p.needed;
}

export function describeRule(rule: UnlockRule): string {
  switch (rule.type) {
    case 'start':
      return 'Ready from day 1';
    case 'secret':
      return 'Found only in a mystery chest';
    case 'streak':
      return `Train ${rule.days} days in a row`;
    case 'sessions':
      return `Finish ${rule.count} sessions`;
    case 'level':
      return `Reach level ${rule.level}`;
    case 'totalMinutes':
      return `Train ${rule.minutes} minutes in total`;
    case 'record': {
      const ex = EXERCISE_BY_ID[rule.exerciseId];
      const unit = ex?.metric === 'time' ? 's' : ex?.metric === 'distance' ? ' km' : ex?.metric === 'weight_reps' ? ' kg' : ' reps';
      return `${ex?.name ?? rule.exerciseId} record: ${rule.value}${unit}`;
    }
    case 'all':
      return rule.rules.map(describeRule).join(' + ');
    case 'any':
      return rule.rules.map(describeRule).join(' OR ');
  }
}

/** Exercises whose rule is met now but are not yet in `unlocked`. Unlocks never re-lock. */
export function newUnlocks(unlocked: string[], st: GameStats): string[] {
  const have = new Set(unlocked);
  return EXERCISES.filter((e) => !have.has(e.id) && e.unlock.type !== 'secret' && ruleMet(e.unlock, st)).map((e) => e.id);
}

/** Locked, non-secret exercises closest to unlocking first. */
export function nextUnlockHints(unlocked: string[], st: GameStats, limit = 3) {
  const have = new Set(unlocked);
  return EXERCISES.filter((e) => !have.has(e.id) && e.unlock.type !== 'secret')
    .map((e) => {
      const p = ruleProgress(e.unlock, st);
      return { exercise: e, ...p, ratio: Math.min(1, p.current / p.needed), text: describeRule(e.unlock) };
    })
    .sort((a, b) => b.ratio - a.ratio || a.exercise.tier - b.exercise.tier)
    .slice(0, limit);
}

/** Can this exercise be done with this equipment? */
export function fitsEquipment(ex: Exercise, equipment: EquipmentId[]): boolean {
  return ex.equipment.every((e) => equipment.includes(e));
}

export function availableExercises(unlocked: string[], equipment: EquipmentId[]): Exercise[] {
  const have = new Set(unlocked);
  return EXERCISES.filter((e) => have.has(e.id) && fitsEquipment(e, equipment));
}

// ---------- habit builder ----------

export interface DayTotal {
  date: string;
  activeSec: number;
  restSec: number;
}

export function dailyTotals(sessions: Session[], days: number, now: number): DayTotal[] {
  const today = dayKey(now);
  const map = new Map<string, DayTotal>();
  for (let i = days - 1; i >= 0; i--) {
    const k = addDays(today, -i);
    map.set(k, { date: k, activeSec: 0, restSec: 0 });
  }
  for (const s of doneSessions(sessions)) {
    const t = map.get(dayKey(s.startedAt));
    if (t) {
      t.activeSec += s.activeSec;
      t.restSec += s.restSec;
    }
  }
  return [...map.values()];
}

/**
 * Daily minutes goal. Starts small (base) and grows by `step` after every `metDays` days the goal was met.
 * Rest days do not reset progress; a full missed week (7+ days) does (see docs/GAME-DESIGN.md, habit section).
 */
export const HABIT_MET_DAYS = 5;

export function habitTarget(sessions: Session[], base = 10, cap = 45, step = 5, metDays = HABIT_MET_DAYS): number {
  const perDay = new Map<string, number>();
  for (const s of doneSessions(sessions)) {
    const k = dayKey(s.startedAt);
    perDay.set(k, (perDay.get(k) ?? 0) + s.activeSec + s.restSec);
  }
  const days = [...perDay.keys()].sort();
  let target = base;
  let metRun = 0;
  let prev: string | null = null;
  for (const d of days) {
    if (prev && daysBetween(prev, d) > 7) metRun = 0; // a full missed week resets the count
    if ((perDay.get(d) ?? 0) / 60 >= target) {
      metRun++;
      if (metRun >= metDays) {
        target = Math.min(cap, target + step);
        metRun = 0;
      }
    }
    prev = d;
  }
  return target;
}

/** First 10 sessions = starter mode: a short plan of few exercises to build the habit. */
export const STARTER_SESSIONS = 10;

export function starterPlan(available: Exercise[], doneCount: number): { exerciseId: string; sets: number }[] {
  if (doneCount >= STARTER_SESSIONS) return [];
  const picks = [...available].sort((a, b) => b.tier - a.tier).slice(0, 3);
  return picks.map((e) => ({ exerciseId: e.id, sets: e.metric === 'distance' ? 1 : 2 }));
}

// ---------- BMI ----------

export function bmi(kg: number, heightCm: number): number {
  const m = heightCm / 100;
  return round1(kg / (m * m));
}

/** WHO adult BMI categories (see docs/RESEARCH.md for the source). */
export function bmiCategory(v: number): string {
  if (v < 18.5) return 'Underweight';
  if (v < 25) return 'Normal';
  if (v < 30) return 'Overweight';
  return 'Obese';
}

// ---------- surprises (mystery chest) ----------

/** Small seeded random so a chest result is the same if replayed (testable). */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export const COLORS = [
  { id: 'ember', hex: '#ff7a1a', name: 'Ember' },
  { id: 'ocean', hex: '#2bb3ff', name: 'Ocean' },
  { id: 'jade', hex: '#22c55e', name: 'Jade' },
  { id: 'violet', hex: '#a78bfa', name: 'Violet' },
  { id: 'gold', hex: '#facc15', name: 'Gold' },
  { id: 'rose', hex: '#fb7185', name: 'Rose' },
];

export type ChestReward =
  | { kind: 'xp'; xp: number }
  | { kind: 'color'; colorId: string }
  | { kind: 'secret'; exerciseId: string }
  | { kind: 'challenge'; challenge: Challenge };

export function openChest(seed: string, ctx: { unlocked: string[]; cosmetics: string[]; hadPR: boolean; records: Map<string, ExRecord>; available: Exercise[] }): ChestReward {
  const rnd = seededRandom(seed);
  const lockedSecrets = SECRET_IDS.filter((id) => !ctx.unlocked.includes(id));
  const lockedColors = COLORS.filter((c) => c.id !== 'ember' && !ctx.cosmetics.includes(c.id));
  const challengeable = ctx.available.filter((e) => (ctx.records.get(e.id)?.best ?? 0) > 0 && e.metric !== 'weight_reps');

  const roll = rnd();
  // A PR makes a "special" reward more likely: XP only on a low roll.
  const xpChance = ctx.hadPR ? 0.2 : 0.45;
  if (roll < xpChance) return { kind: 'xp', xp: 20 + Math.floor(rnd() * 5) * 10 };
  if (roll < xpChance + 0.25 && lockedColors.length) return { kind: 'color', colorId: lockedColors[Math.floor(rnd() * lockedColors.length)].id };
  if (roll < xpChance + 0.45 && challengeable.length) {
    const e = challengeable[Math.floor(rnd() * challengeable.length)];
    const best = ctx.records.get(e.id)!.best;
    const bump = e.metric === 'time' ? 10 : e.metric === 'distance' ? 0.3 : 2;
    return { kind: 'challenge', challenge: { exerciseId: e.id, target: round1(best + bump), xp: 100 } };
  }
  if (lockedSecrets.length) return { kind: 'secret', exerciseId: lockedSecrets[Math.floor(rnd() * lockedSecrets.length)] };
  return { kind: 'xp', xp: 50 };
}

export function challengeMet(ch: Challenge, sets: WorkSet[]): boolean {
  const ex = EXERCISE_BY_ID[ch.exerciseId];
  if (!ex) return false;
  return sets.some((s) => s.exerciseId === ch.exerciseId && !s.deleted && setValue(ex, s) >= ch.target);
}
