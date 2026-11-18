// The game engine. Pure functions only (no database, no clock unless passed in),
// so every rule can be unit-tested. See docs/GAME-DESIGN.md for the "why".

import { EXERCISE_BY_ID, EXERCISES, SECRET_IDS } from './exercises';
import { ANY, beatFor, beats, defaultBeat, fmtLevel, fmtValues, hasValue, levelOf, lowerWins, mainMeasure, MEASURES, measuresFor, measureValue } from './measures';
import type { Beat, Challenge, EquipmentId, Exercise, Focus, Goal, Measure, Session, UnlockRule, WorkSet } from './types';

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
  /** Best value of the exercise's main measure (reps, seconds, km or kg). Used for unlocks and challenges. */
  best: number;
  /** Best value of each measure on its own. */
  bests: Partial<Record<Measure, number>>;
  /**
   * The benchmark ("the record"). Mode any: the first set, then each set that beat it (rule A).
   * Mode same: the best set at the level (weight / distance) of the latest set.
   */
  bestSet: WorkSet | null;
  /** How this exercise is beaten. */
  beat: Beat;
  /** Mode same: best set per level (kg or km). */
  levels: Map<number, WorkSet>;
  /** Mode same: the heaviest weight / longest distance ever logged. */
  maxLevel: number;
  last: WorkSet | null;
  count: number;
  /** cardio only: fastest pace in minutes per km */
  bestPace: number | null;
}

/** Which measures to use for an exercise (the user's choice or the default). */
export type MeasuresOf = (ex: Exercise) => Measure[];
export const defaultMeasuresOf: MeasuresOf = (ex) => ex.measures;

function liveSets(sets: WorkSet[]): WorkSet[] {
  return sets.filter((s) => !s.deleted).sort((a, b) => a.at - b.at);
}

export function pace(s: WorkSet): number | null {
  if (!s.distanceKm || !s.durationSec) return null;
  return s.durationSec / 60 / s.distanceKm;
}

export type BeatOf = (ex: Exercise) => Beat;
export const defaultBeatOf: BeatOf = (ex) => defaultBeat(ex);

/**
 * One walk through the sets in time order: records and which sets were records (PRs).
 * Mode any (rule A): a set beats the benchmark when one number is better and none worse.
 * Mode same: records per level. A set is a record when it beats the best at its own weight / distance,
 * or when it is the first set at a weight heavier than ever (a new weight). The first set at a new
 * lighter weight or a new distance just starts that level's record (so dropping the weight cannot farm records).
 */
function walk(sets: WorkSet[], measuresOf: MeasuresOf, beatOf: BeatOf) {
  const records = new Map<string, ExRecord>();
  const flags = new Map<string, boolean>();
  for (const s of liveSets(sets)) {
    const ex = EXERCISE_BY_ID[s.exerciseId];
    if (!ex) continue;
    const ms = measuresOf(ex);
    const bt = beatOf(ex);
    const r: ExRecord = records.get(s.exerciseId) ?? { exerciseId: s.exerciseId, best: 0, bests: {}, bestSet: null, last: null, count: 0, bestPace: null, beat: bt, levels: new Map(), maxLevel: 0 };
    let isPR = false;
    if (bt.kind === 'same') {
      let lvl = levelOf(bt, s)!;
      // Sprints logged before distances existed (no distance) count as the old 100 m.
      if (bt.fixed === 'distance' && lvl === 0 && s.exerciseId === 'sprint_100m') lvl = 0.1;
      const prev = r.levels.get(lvl);
      if (prev) {
        isPR = beats([bt.beat], s, prev);
        if (isPR) r.levels.set(lvl, s);
      } else if (hasValue([bt.beat], s)) {
        isPR = bt.fixed === 'weight' && r.count > 0 && lvl > r.maxLevel;
        r.levels.set(lvl, s);
      }
      // Only a real set (beaten number above 0) can raise the heaviest-weight mark.
      if (lvl > r.maxLevel && hasValue([bt.beat], s)) r.maxLevel = lvl;
      r.bestSet = r.levels.get(lvl) ?? r.bestSet;
    } else if (r.bestSet) {
      isPR = beats(ms, s, r.bestSet);
      if (isPR) r.bestSet = s;
    } else if (hasValue(ms, s)) {
      r.bestSet = s;
    }
    flags.set(s.id, isPR);
    r.count++;
    r.last = s;
    for (const m of MEASURES) {
      const v = measureValue(s, m.id);
      if (v <= 0) continue;
      const cur = r.bests[m.id];
      if (cur === undefined || (lowerWins(m.id) ? v < cur : v > cur)) r.bests[m.id] = v;
    }
    r.best = r.bests[mainMeasure(ex)] ?? 0;
    const p = pace(s);
    if (p !== null && (r.bestPace === null || p < r.bestPace)) r.bestPace = p;
    records.set(s.exerciseId, r);
  }
  return { records, flags };
}

export function computeRecords(sets: WorkSet[], measuresOf: MeasuresOf = defaultMeasuresOf, beatOf: BeatOf = defaultBeatOf): Map<string, ExRecord> {
  return walk(sets, measuresOf, beatOf).records;
}

/** Which sets are records. Used when logging, and again after an edit or delete. */
export function prFlags(sets: WorkSet[], measuresOf: MeasuresOf = defaultMeasuresOf, beatOf: BeatOf = defaultBeatOf): Map<string, boolean> {
  return walk(sets, measuresOf, beatOf).flags;
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

/**
 * Targets per goal for resistance moves (exercise-scientist, round 2; grades and sources in
 * docs/research/EXERCISE-LADDER.md section C). Muscle/strength reps, sets and rest: grade A.
 * Stamina and lose_weight numbers, set counts and the 25-rep cap: [Design choice].
 */
export const GOAL_TARGETS: Record<Goal, { low: number; high: number; sets: number; restSec: number; label: string }> = {
  strength: { low: 5, high: 8, sets: 3, restSec: 120, label: 'Get stronger' },
  muscle: { low: 8, high: 12, sets: 3, restSec: 90, label: 'Build muscle' },
  lean: { low: 8, high: 12, sets: 3, restSec: 90, label: 'Get lean' },
  stamina: { low: 15, high: 25, sets: 2, restSec: 60, label: 'Stamina' },
  lose_weight: { low: 10, high: 15, sets: 2, restSec: 60, label: 'Lose weight' },
};
export const GOAL_ORDER: Goal[] = ['strength', 'muscle', 'lean', 'stamina', 'lose_weight'];

/**
 * Which goal sets the numbers for this exercise: the first picked goal (in GOAL_ORDER) that the exercise
 * also serves; else the first picked goal; else none (default 8-12 reps, 90 s). Research, round 2, section C.
 */
export function goalFor(ex: Exercise | null, goals: Goal[] = []): Goal | null {
  const picked = GOAL_ORDER.filter((g) => goals.includes(g));
  if (!picked.length) return null;
  return (ex && picked.find((g) => ex.goals.includes(g))) ?? picked[0];
}

/** Suggested rest between sets for the whole profile (its first goal in GOAL_ORDER). */
export function suggestedRestSec(goals: Goal[] = []): number | null {
  const g = goalFor(null, goals);
  return g ? GOAL_TARGETS[g].restSec : null;
}
export const WEIGHT_STEP_KG = 2.5;

function asSet(t: Target): Partial<WorkSet> {
  return { reps: t.reps, seconds: t.seconds, weightKg: t.weightKg, distanceKm: t.distanceKm };
}

/**
 * The number to beat. Under rule A a target raises ONE measure a little and keeps the others,
 * so it always counts as a beat. Weight + reps: add reps up to the top of the range, then add
 * weight and keep the reps (see docs/RESEARCH.md, progression).
 */
export function nextTarget(ex: Exercise, rec: ExRecord | undefined, ms: Measure[] = ex.measures, goals: Goal[] = [], beat: Beat = ANY, atLevel?: number): Target {
  const has = (m: Measure) => ms.includes(m);
  const g = goalFor(ex, goals);
  const RANGE = g ? { low: GOAL_TARGETS[g].low, high: GOAL_TARGETS[g].high } : REP_RANGE;
  if (beat.kind === 'same') return sameTarget(beat, rec, RANGE, atLevel);
  const b = rec?.bestSet;
  if (!b) {
    const t: Target = { label: '' };
    if (has('weight')) t.weightKg = 0;
    if (has('reps')) t.reps = has('weight') ? RANGE.low : 5;
    if (has('distance')) t.distanceKm = 1;
    if (has('time') && !has('distance')) t.seconds = 20;
    const bits: string[] = [];
    if (has('speed')) bits.push('go all out once and log your time; that is the time to beat');
    if (has('weight')) bits.push(`pick a weight you can lift ${RANGE.low}-${RANGE.high} times`);
    else if (has('reps')) bits.push('try 5, or as many as you can with good form');
    if (has('distance')) bits.push('go 1 km, run or walk');
    else if (has('time')) bits.push('try 20 seconds');
    t.label = `First time: ${bits.join('; ')}`;
    return t;
  }
  const t: Target = { label: '' };
  if (has('reps')) t.reps = b.reps ?? 0;
  if (has('weight')) t.weightKg = b.weightKg ?? 0;
  if (has('distance')) t.distanceKm = b.distanceKm ?? 0;
  if (has('time')) t.seconds = measureValue(b, 'time');
  if (has('speed')) t.seconds = measureValue(b, 'speed');
  let how: string;
  if (has('weight') && has('reps')) {
    if ((b.reps ?? 0) >= RANGE.high) {
      t.weightKg = round1((b.weightKg ?? 0) + WEIGHT_STEP_KG);
      how = `level up: add ${WEIGHT_STEP_KG} kg, keep ${t.reps} reps`;
    } else {
      t.reps = (b.reps ?? 0) + 1;
      how = 'one more rep';
    }
  } else if (has('speed')) {
    // Faster wins: a small cut. Short sprints in tenths; long time trials in whole seconds.
    const cur = measureValue(b, 'speed');
    const step = cur < 60 ? 0.2 : cur < 600 ? 2 : 10;
    // A tiny record (likely a typo) cannot be beaten by a fixed step: use 5% of it instead.
    t.seconds = cur - step > 0 ? Math.round((cur - step) * 10) / 10 : Math.max(0.01, Math.round(cur * 0.95 * 100) / 100);
    how = `${step} s faster${has('distance') ? ', same distance or more' : ''}`;
  } else if (has('distance')) {
    t.distanceKm = round1((b.distanceKm ?? 0) + 0.1);
    how = has('time') ? 'go 0.1 km farther, for at least the same time' : 'go 0.1 km farther';
  } else if (has('reps')) {
    t.reps = (b.reps ?? 0) + 1;
    how = 'one more rep';
  } else if (has('time')) {
    t.seconds = (t.seconds ?? 0) + 5;
    how = '5 seconds longer';
  } else {
    t.weightKg = round1((b.weightKg ?? 0) + WEIGHT_STEP_KG);
    how = `add ${WEIGHT_STEP_KG} kg`;
  }
  const others = ms.length > 1 ? ' Keep the other numbers at least the same.' : '';
  t.label = `Beat ${fmtValues(ms, b)}: ${how} → ${fmtValues(ms, asSet(t))}.${others}`;
  return t;
}

/** Mode same: beat your best at this weight / distance (by default the one you used last). */
function sameTarget(bt: Extract<Beat, { kind: 'same' }>, rec: ExRecord | undefined, RANGE: { low: number; high: number }, atLevel?: number): Target {
  const fixedKey = bt.fixed === 'weight' ? 'weightKg' : 'distanceKm';
  const lastLevel = rec?.last ? levelOf(bt, rec.last) : null;
  const level = atLevel ?? lastLevel;
  if (!rec || level === null) {
    const t: Target = { label: '' };
    if (bt.fixed === 'weight') {
      t.weightKg = 0;
      t.label = `First time: pick a weight you can lift ${RANGE.low}-${RANGE.high} times with good form. Each weight keeps its own record.`;
    } else {
      t.distanceKm = 0.1;
      t.label = bt.beat === 'speed' ? 'First time: pick a distance (for example 100 m), warm up, go all out once and log your time. Each distance keeps its own record.' : 'First time: pick a distance. Each distance keeps its own record.';
    }
    if (bt.beat === 'reps') t.reps = RANGE.low;
    return t;
  }
  const b = rec.levels.get(level);
  const t: Target = { label: '', [fixedKey]: level } as Target;
  const at = fmtLevel(bt, level);
  if (!b) {
    const heavier = bt.fixed === 'weight' && level > rec.maxLevel;
    if (bt.beat === 'reps') t.reps = RANGE.low;
    t.label = heavier ? `New weight ${at}: any good set is a new record and starts your count here.` : `First time ${at}: your first set starts this record.`;
    return t;
  }
  const v = measureValue(b, bt.beat);
  if (bt.beat === 'reps') {
    if (bt.fixed === 'weight' && v >= RANGE.high) {
      // Double progression [Design choice, docs/research/EXERCISE-LADDER.md]: at the top of the range, move up.
      t.weightKg = round1(level + WEIGHT_STEP_KG);
      t.reps = RANGE.low;
      t.label = `Best ${at}: ${v} reps, the top of your range. Move up: ${t.weightKg} kg x ${RANGE.low} is a new-weight record. (Or ${v + 1} reps ${at}.)`;
    } else {
      t.reps = v + 1;
      t.label = `Best ${at}: ${v} reps. Beat it: ${v + 1} reps ${at}.`;
    }
  } else if (bt.beat === 'speed') {
    const step = v < 60 ? 0.2 : v < 600 ? 2 : 10;
    t.seconds = v - step > 0 ? Math.round((v - step) * 10) / 10 : Math.max(0.01, Math.round(v * 0.95 * 100) / 100);
    t.label = `Best ${at}: ${fmtValues(['speed'], b)}. Beat it: ${fmtValues(['speed'], { seconds: t.seconds })} ${at}.`;
  } else {
    t.seconds = v + 5;
    t.label = `Best ${at}: ${v}s. Beat it: ${v + 5}s ${at}.`;
  }
  return t;
}

/** Short "number to beat" for the big tile. */
export function fmtTarget(ms: Measure[], t: Target): string {
  return fmtValues(ms, asSet(t), true);
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

/** Gear the avatar wears, earned by the number of unlocked exercises. Day 1 has 4 starters (2026-11-18: +2 to every step). */
export const GEAR = [
  { unlocks: 6, id: 'headband', name: 'Headband' },
  { unlocks: 8, id: 'wristbands', name: 'Wristbands' },
  { unlocks: 11, id: 'belt', name: 'Lifting belt' },
  { unlocks: 15, id: 'cape', name: 'Cape' },
  { unlocks: 20, id: 'aura', name: 'Power aura' },
  { unlocks: 27, id: 'crown', name: 'Crown' },
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

export function buildStats(sessions: Session[], sets: WorkSet[], xp: number, now: number, measuresOf: MeasuresOf = defaultMeasuresOf, beatOf: BeatOf = defaultBeatOf): GameStats {
  const done = doneSessions(sessions);
  return {
    streak: currentStreak(sessions, now),
    bestStreak: bestStreak(sessions),
    sessions: done.length,
    level: levelFromXp(xp),
    totalMinutes: Math.floor(done.reduce((t, s) => t + s.activeSec + s.restSec, 0) / 60),
    records: computeRecords(sets, measuresOf, beatOf),
  };
}

/** Everything derived from the data in one call: XP, stats and unlocks. */
export function deriveGame(profile: { unlocked: string[]; exerciseMeasures?: Record<string, Measure[]>; exerciseBeat?: Record<string, Beat> }, sessions: Session[], sets: WorkSet[], now: number) {
  const beatOf: BeatOf = (ex) => beatFor(ex, profile.exerciseBeat, profile.exerciseMeasures);
  const measuresOf: MeasuresOf = (ex) => measuresFor(ex, profile.exerciseMeasures, beatOf(ex));
  const xp = totalXp(sessions);
  const stats = buildStats(sessions, sets, xp, now, measuresOf, beatOf);
  const unlocked = unlockedFrom(stats, sessions, profile.unlocked);
  return { xp, stats, unlocked, measuresOf, beatOf };
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
    case 'record': {
      const ex = EXERCISE_BY_ID[rule.exerciseId];
      const m = rule.measure ?? (ex ? mainMeasure(ex) : 'reps');
      const best = st.records.get(rule.exerciseId)?.bests[m];
      // Faster time: met when the best time is at or under the value (progress = value / best).
      if (lowerWins(m)) return best ? { current: Math.min(rule.value, (rule.value * rule.value) / best), needed: rule.value } : { current: 0, needed: rule.value };
      return { current: best ?? 0, needed: rule.value };
    }
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

/**
 * The unlock rule in words. `known(id)` = may this exercise be named? Locked ones are surprises
 * (Renz, 2026-11-18), so they show as "a hidden exercise".
 */
export function describeRule(rule: UnlockRule, known: (id: string) => boolean = () => true): string {
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
      const m = rule.measure ?? (ex ? mainMeasure(ex) : 'reps');
      const name = known(rule.exerciseId) ? (ex?.name ?? rule.exerciseId) : 'a hidden exercise';
      return `${name}: ${fmtValues([m], { reps: rule.value, seconds: rule.value, distanceKm: rule.value, weightKg: rule.value })} in one set`;
    }
    case 'all':
      return rule.rules.map((r) => describeRule(r, known)).join(' + ');
    case 'any':
      return rule.rules.map((r) => describeRule(r, known)).join(' OR ');
  }
}

/**
 * Every unlocked exercise, worked out from the data: starters, every ladder rule met by the
 * sessions and sets that exist now, and secrets from chests of sessions that still exist.
 * So deleting wrong data locks again what only that data earned (Renz, 2026-11-18).
 * `legacy` = secrets found before this rule (kept, as their session is not known).
 */
export function unlockedFrom(st: GameStats, sessions: Session[], legacy: string[] = []): string[] {
  const have = new Set<string>();
  for (const e of EXERCISES) if (e.unlock.type === 'start' || (e.unlock.type !== 'secret' && ruleMet(e.unlock, st))) have.add(e.id);
  for (const s of doneSessions(sessions)) if (s.chestSecret) have.add(s.chestSecret);
  for (const id of legacy) if (SECRET_IDS.includes(id)) have.add(id);
  return EXERCISES.filter((e) => have.has(e.id)).map((e) => e.id);
}

/** Exercises whose rule is met now but are not yet in `unlocked`. */
export function newUnlocks(unlocked: string[], st: GameStats): string[] {
  const have = new Set(unlocked);
  return EXERCISES.filter((e) => !have.has(e.id) && e.unlock.type !== 'secret' && ruleMet(e.unlock, st)).map((e) => e.id);
}

/** Locked, non-secret exercises closest to unlocking first. `canDo` = only ones the user has equipment for. */
export function nextUnlockHints(unlocked: string[], st: GameStats, limit = 3, canDo: (e: Exercise) => boolean = () => true) {
  const have = new Set(unlocked);
  return EXERCISES.filter((e) => !have.has(e.id) && e.unlock.type !== 'secret' && canDo(e))
    .map((e) => {
      const p = ruleProgress(e.unlock, st);
      return { exercise: e, ...p, ratio: Math.min(1, p.current / p.needed), text: describeRule(e.unlock, (id) => have.has(id)) };
    })
    .sort((a, b) => b.ratio - a.ratio || a.exercise.tier - b.exercise.tier)
    .slice(0, limit);
}

/**
 * What the user sees as unlocked: earned AND (doable with their equipment OR already shown to them).
 * `revealed` undefined = an app version before the reveal list: then everything doable counts as shown.
 */
export function visibleUnlocks(unlockedAll: string[], canDo: (e: Exercise) => boolean, revealed?: string[]): string[] {
  return unlockedAll.filter((id) => canDo(EXERCISE_BY_ID[id]) || (revealed ?? []).includes(id));
}

/** Every equipment id found in the user's places: what they own, somewhere. */
export function ownedEquipment(places: { equipment: EquipmentId[]; deleted?: boolean }[]): EquipmentId[] {
  return [...new Set(places.filter((p) => !p.deleted).flatMap((p) => p.equipment))];
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

export function starterPlan(available: Exercise[], doneCount: number, goals: Goal[] = [], focus: Focus[] = []): { exerciseId: string; sets: number }[] {
  if (doneCount >= STARTER_SESSIONS) return [];
  return suggestedPlan(available, goals, focus, 3).map((p) => ({ ...p, sets: p.sets === 1 ? 1 : 2 }));
}

/**
 * A short plan that fits the goal profile: best matches first, then the newest (highest tier) moves.
 * At most one cardio (distance) move, so a plan is not just running.
 */
export function suggestedPlan(available: Exercise[], goals: Goal[] = [], focus: Focus[] = [], n = 4): { exerciseId: string; sets: number }[] {
  const sorted = [...available].sort((a, b) => profileScore(b, goals, focus) - profileScore(a, goals, focus) || b.tier - a.tier);
  const out: Exercise[] = [];
  for (const e of sorted) {
    if (out.length >= n) break;
    if (e.measures.includes('distance') && out.some((x) => x.measures.includes('distance'))) continue;
    out.push(e);
  }
  return out.map((e) => ({ exerciseId: e.id, sets: e.measures.includes('distance') ? 1 : 3 }));
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

/** How well an exercise fits the user's goals and focus. 0 = no match. Focus counts double. */
export function profileScore(ex: Exercise, goals: Goal[] = [], focus: Focus[] = []): number {
  return ex.focus.filter((f) => focus.includes(f)).length * 2 + ex.goals.filter((g) => goals.includes(g)).length;
}

/** Pick one item, more likely the better its weight (all weights > 0). */
function weightedPick<T>(items: T[], weight: (x: T) => number, rnd: () => number): T {
  const total = items.reduce((t, x) => t + weight(x), 0);
  let r = rnd() * total;
  for (const x of items) {
    r -= weight(x);
    if (r < 0) return x;
  }
  return items[items.length - 1];
}

export function openChest(
  seed: string,
  ctx: { unlocked: string[]; cosmetics: string[]; hadPR: boolean; records: Map<string, ExRecord>; available: Exercise[]; goals?: Goal[]; focus?: Focus[]; owned?: EquipmentId[] },
): ChestReward {
  const rnd = seededRandom(seed);
  // A secret only after its base move, and only if the user has the equipment for it (Renz, 2026-11-18).
  const lockedSecrets = SECRET_IDS.filter((id) => {
    const e = EXERCISE_BY_ID[id];
    return !ctx.unlocked.includes(id) && (!e.requires || ctx.unlocked.includes(e.requires)) && (!ctx.owned || fitsEquipment(e, ctx.owned));
  });
  const lockedColors = COLORS.filter((c) => c.id !== 'ember' && !ctx.cosmetics.includes(c.id));
  // Challenges use one plain number, so not for weight moves or "same distance" moves (sprints).
  const challengeable = ctx.available.filter((e) => (ctx.records.get(e.id)?.best ?? 0) > 0 && mainMeasure(e) !== 'weight' && defaultBeat(e).kind === 'any');

  const roll = rnd();
  // A PR makes a "special" reward more likely: XP only on a low roll.
  const xpChance = ctx.hadPR ? 0.2 : 0.45;
  if (roll < xpChance) return { kind: 'xp', xp: 20 + Math.floor(rnd() * 5) * 10 };
  if (roll < xpChance + 0.25 && lockedColors.length) return { kind: 'color', colorId: lockedColors[Math.floor(rnd() * lockedColors.length)].id };
  if (roll < xpChance + 0.45 && challengeable.length) {
    const e = challengeable[Math.floor(rnd() * challengeable.length)];
    const best = ctx.records.get(e.id)!.best;
    const m = mainMeasure(e);
    // Faster time: the challenge is a LOWER time (about 3% faster), never a slower one.
    if (lowerWins(m)) return { kind: 'challenge', challenge: { exerciseId: e.id, target: Math.max(0.1, round1(best * 0.97)), xp: 100 } };
    const bump = m === 'time' ? 10 : m === 'distance' ? 0.3 : 2;
    return { kind: 'challenge', challenge: { exerciseId: e.id, target: round1(best + bump), xp: 100 } };
  }
  // Surprises lean toward the goal profile: a matching secret is up to several times more likely.
  if (lockedSecrets.length) {
    const pick = weightedPick(lockedSecrets, (id) => 1 + 2 * profileScore(EXERCISE_BY_ID[id], ctx.goals, ctx.focus), rnd);
    return { kind: 'secret', exerciseId: pick };
  }
  return { kind: 'xp', xp: 50 };
}

export function challengeMet(ch: Challenge, sets: WorkSet[]): boolean {
  const ex = EXERCISE_BY_ID[ch.exerciseId];
  if (!ex) return false;
  const m = mainMeasure(ex);
  return sets.some((s) => {
    if (s.exerciseId !== ch.exerciseId || s.deleted) return false;
    const v = measureValue(s, m);
    return lowerWins(m) ? v > 0 && v <= ch.target : v >= ch.target;
  });
}
