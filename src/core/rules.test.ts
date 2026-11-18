import { describe, expect, it } from 'vitest';
import { EXERCISES, EXERCISE_BY_ID } from './exercises';
import {
  availableExercises,
  bmi,
  bmiCategory,
  buildStats,
  challengeMet,
  computeRecords,
  currentStreak,
  dayKey,
  habitTarget,
  levelFromXp,
  newUnlocks,
  nextTarget,
  openChest,
  prFlags,
  profileScore,
  ruleMet,
  sessionXp,
  starterPlan,
  unlockedFrom,
  COLORS,
  goalFor,
  suggestedRestSec,
  visibleUnlocks,
  xpForLevel,
} from './rules';
import { beats, measuresFor } from './measures';
import type { Session, WorkSet } from './types';

const DAY = 86_400_000;
const T0 = new Date(2026, 10, 1, 18, 0, 0).getTime(); // 1 Nov 2026, 6 PM local

let n = 0;
function session(dayOffset: number, minutes = 15): Session {
  return {
    id: `s${n++}`,
    startedAt: T0 + dayOffset * DAY,
    endedAt: T0 + dayOffset * DAY + minutes * 60_000,
    locationId: null,
    status: 'done',
    activeSec: minutes * 45,
    restSec: minutes * 15,
    xpEarned: 0,
    prs: 0,
    live: null,
    updatedAt: 0,
  };
}
function set(exerciseId: string, v: Partial<WorkSet>, at = T0): WorkSet {
  return { id: `w${n++}`, sessionId: 's', exerciseId, at, isPR: false, updatedAt: 0, ...v };
}

describe('catalog', () => {
  it('day 1: five starters, all possible at home with no equipment (knee/incline/push-up, run, run in place)', () => {
    const st = buildStats([], [], 0, T0);
    expect(newUnlocks([], st).sort()).toEqual(['incline_push_up', 'knee_push_up', 'push_up', 'run', 'run_in_place']);
    expect(newUnlocks([], st).every((id) => EXERCISE_BY_ID[id].equipment.length === 0)).toBe(true);
  });
  it('every exercise has measures, focus and goals; ids are unique', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) {
      expect(e.measures.length, e.id).toBeGreaterThan(0);
      expect(e.focus.length, e.id).toBeGreaterThan(0);
      expect(e.goals.length, e.id).toBeGreaterThan(0);
    }
  });
  it('every record rule points to a real exercise that unlocks earlier', () => {
    const check = (r: any, tier: number) => {
      if (r.type === 'record') {
        expect(EXERCISE_BY_ID[r.exerciseId], r.exerciseId).toBeDefined();
        expect(EXERCISE_BY_ID[r.exerciseId].tier).toBeLessThanOrEqual(tier);
      }
      if (r.type === 'all' || r.type === 'any') r.rules.forEach((x: any) => check(x, tier));
    };
    EXERCISES.forEach((e) => check(e.unlock, e.tier));
  });
  it('ids are unique', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
  });
});

describe('streak', () => {
  it('counts consecutive days and survives until the end of the next day', () => {
    const s = [session(0), session(1), session(2)];
    expect(currentStreak(s, T0 + 2 * DAY)).toBe(3);
    expect(currentStreak(s, T0 + 3 * DAY)).toBe(3);
    expect(currentStreak(s, T0 + 4 * DAY)).toBe(0);
  });
  it('two sessions on one day count once', () => {
    expect(currentStreak([session(0), session(0)], T0)).toBe(1);
  });
});

describe('unlock ladder (Boss R example: 2 days in a row unlocks a new exercise)', () => {
  it('2-day streak unlocks squat', () => {
    const st = buildStats([session(0), session(1)], [], 0, T0 + DAY);
    expect(newUnlocks(['push_up', 'run'], st)).toContain('squat');
  });
  it('beating a push-up record of 12 unlocks plank', () => {
    const st = buildStats([session(0)], [set('push_up', { reps: 12 })], 0, T0);
    expect(newUnlocks(['push_up', 'run'], st)).toContain('plank');
  });
  it('"all" rules need every part', () => {
    const bench = EXERCISE_BY_ID.bench_press.unlock;
    const many = Array.from({ length: 15 }, (_, i) => session(i * 3));
    expect(ruleMet(bench, buildStats(many, [], 0, T0))).toBe(false);
    expect(ruleMet(bench, buildStats(many, [set('push_up', { reps: 15 })], 0, T0))).toBe(true);
  });
  it('"any" rules: a 3-day-a-week user still unlocks sit-up by session count', () => {
    const sitUp = EXERCISE_BY_ID.sit_up.unlock;
    const spaced = Array.from({ length: 7 }, (_, i) => session(i * 2));
    expect(ruleMet(sitUp, buildStats(spaced.slice(0, 6), [], 0, T0 + 12 * DAY))).toBe(false);
    expect(ruleMet(sitUp, buildStats(spaced, [], 0, T0 + 12 * DAY))).toBe(true);
  });
  it('secret exercises never unlock by rules', () => {
    const many = Array.from({ length: 60 }, (_, i) => session(i));
    const st = buildStats(many, [], 1_000_000, T0 + 59 * DAY);
    expect(newUnlocks([], st)).not.toContain('bear_crawl');
  });
});

describe('equipment', () => {
  it('home with no equipment hides dumbbell moves', () => {
    const ids = availableExercises(['push_up', 'db_curl'], []).map((e) => e.id);
    expect(ids).toEqual(['push_up']);
  });
  it('gym with dumbbells shows them', () => {
    const ids = availableExercises(['push_up', 'db_curl'], ['dumbbell']).map((e) => e.id);
    expect(ids).toContain('db_curl');
  });
});

describe('records and targets', () => {
  it('reps: beat the best by one', () => {
    const recs = computeRecords([set('push_up', { reps: 10 }, T0), set('push_up', { reps: 8 }, T0 + 1)]);
    const r = recs.get('push_up')!;
    expect(r.best).toBe(10);
    expect(r.last?.reps).toBe(8);
    expect(nextTarget(EXERCISE_BY_ID.push_up, r).reps).toBe(11);
  });
  it('weight: add reps to 12, then add 2.5 kg and keep the reps (a target is always a beat under rule A)', () => {
    const ex = EXERCISE_BY_ID.db_curl;
    let r = computeRecords([set('db_curl', { weightKg: 10, reps: 9 })]).get('db_curl');
    expect(nextTarget(ex, r)).toMatchObject({ weightKg: 10, reps: 10 });
    r = computeRecords([set('db_curl', { weightKg: 10, reps: 12 })]).get('db_curl')!;
    const t = nextTarget(ex, r);
    expect(t).toMatchObject({ weightKg: 12.5, reps: 12 });
    expect(beats(ex.measures, { weightKg: t.weightKg, reps: t.reps }, r.bestSet)).toBe(true);
  });
  it('rule A: heavier with fewer reps is not a record; the best weight is still tracked', () => {
    const r = computeRecords([set('db_curl', { weightKg: 10, reps: 12 }, 1), set('db_curl', { weightKg: 12.5, reps: 6 }, 2)]).get('db_curl')!;
    expect(r.bestSet?.weightKg).toBe(10);
    expect(r.bests.weight).toBe(12.5);
    expect(r.best).toBe(12.5); // main measure (weight) best, used by unlocks
  });
  it('rule A: one measure up and none down is a beat', () => {
    expect(beats(['weight', 'reps'], { weightKg: 10, reps: 11 }, { weightKg: 10, reps: 10 })).toBe(true);
    expect(beats(['weight', 'reps'], { weightKg: 10, reps: 10 }, { weightKg: 10, reps: 10 })).toBe(false);
    expect(beats(['weight', 'reps'], { weightKg: 12.5, reps: 9 }, { weightKg: 10, reps: 10 })).toBe(false);
    expect(beats(['reps'], { weightKg: 0, reps: 11 }, { weightKg: 10, reps: 10 })).toBe(true); // weight not tracked
  });
  it('the user can choose the measures; records follow the choice', () => {
    const ex = EXERCISE_BY_ID.knee_raise;
    expect(measuresFor(ex, {})).toEqual(ex.measures);
    expect(measuresFor(ex, { knee_raise: ['time'] })).toEqual(['time']);
    const sets = [set('knee_raise', { seconds: 30 }, 1), set('knee_raise', { seconds: 40 }, 2)];
    const byTime = computeRecords(sets, () => ['time']).get('knee_raise')!;
    expect(byTime.bestSet?.seconds).toBe(40);
    expect(nextTarget(ex, byTime, ['time']).seconds).toBe(45);
    const flags = prFlags(sets, () => ['time']);
    expect([...flags.values()]).toEqual([false, true]);
  });
  it('distance: tracks best km and best pace', () => {
    const r = computeRecords([set('run', { distanceKm: 2, durationSec: 840 }), set('run', { distanceKm: 1, durationSec: 360 }, T0 + 1)]).get('run')!;
    expect(r.best).toBe(2);
    expect(r.bestPace).toBe(6);
  });
});

describe('faster time (sprints) and variations (round 2)', () => {
  it('a sprint record is the LOWEST time; a slower time is not a record', () => {
    const ex = EXERCISE_BY_ID.sprint_100m;
    expect(ex.measures).toEqual(['speed']);
    const sets = [set('sprint_100m', { seconds: 18.4 }, 1), set('sprint_100m', { seconds: 19.0 }, 2), set('sprint_100m', { seconds: 17.9 }, 3)];
    const r = computeRecords(sets).get('sprint_100m')!;
    expect(r.bestSet?.seconds).toBe(17.9);
    expect(r.bests.speed).toBe(17.9);
    expect([...prFlags(sets).values()]).toEqual([false, false, true]);
    expect(nextTarget(ex, r).seconds).toBeLessThan(17.9);
  });
  it('a run measured by distance + faster time: same km in less time is a record', () => {
    expect(beats(['distance', 'speed'], { distanceKm: 1, durationSec: 360 }, { distanceKm: 1, durationSec: 420 })).toBe(true);
    expect(beats(['distance', 'speed'], { distanceKm: 1, durationSec: 480 }, { distanceKm: 1, durationSec: 420 })).toBe(false);
    expect(beats(['distance', 'time'], { distanceKm: 1, durationSec: 480 }, { distanceKm: 1, durationSec: 420 })).toBe(true); // a normal run: longer counts
  });
  it('time and faster time are never tracked together', () => {
    expect(measuresFor(EXERCISE_BY_ID.run, { run: ['distance', 'time', 'speed'] })).toEqual(['distance', 'speed']);
  });
  it('every variation names a real base move; every secret requires a real move', () => {
    for (const e of EXERCISES) {
      if (e.base) expect(EXERCISE_BY_ID[e.base], e.id).toBeDefined();
      if (e.requires) expect(EXERCISE_BY_ID[e.requires], e.id).toBeDefined();
      if (e.unlock.type === 'secret') expect(e.requires, e.id).toBeDefined();
    }
  });
  it('a speed challenge asks for a FASTER time, and only a faster time meets it', () => {
    const records = computeRecords([set('sprint_100m', { seconds: 14.6 })]);
    const ctx = { unlocked: ['sprint_100m'], cosmetics: COLORS.map((c) => c.id), hadPR: true, records, available: [EXERCISE_BY_ID.sprint_100m] };
    const ch = Array.from({ length: 200 }, (_, i) => openChest(`c${i}`, ctx)).find((r) => r.kind === 'challenge') as any;
    expect(ch.challenge.target).toBeLessThan(14.6);
    expect(challengeMet(ch.challenge, [set('sprint_100m', { seconds: 14.0 })])).toBe(true);
    expect(challengeMet(ch.challenge, [set('sprint_100m', { seconds: 20 })])).toBe(false);
  });
  it('moves already shown stay visible without their equipment; never-shown ones stay hidden', () => {
    const noGear = (e: any) => e.equipment.length === 0;
    expect(visibleUnlocks(['push_up', 'db_curl'], noGear, ['push_up', 'db_curl'])).toEqual(['push_up', 'db_curl']);
    expect(visibleUnlocks(['push_up', 'db_curl'], noGear, ['push_up'])).toEqual(['push_up']);
  });
  it('a chest never gives a secret before its base move, or one the user lacks equipment for', () => {
    const base = { cosmetics: COLORS.map((c) => c.id), hadPR: false, records: new Map(), available: [], owned: [] as string[] };
    const picks = new Set(Array.from({ length: 300 }, (_, i) => openChest(`s${i}`, { ...base, unlocked: ['push_up', 'squat'] })).filter((r) => r.kind === 'secret').map((r) => (r as any).exerciseId));
    expect([...picks]).toEqual(['wall_sit']); // only wall sit's base (squat) is unlocked
  });
});

describe('goal targets (round 2)', () => {
  it('weight moves use the rep range of the goal; strength levels up at 8 reps', () => {
    const ex = EXERCISE_BY_ID.db_row;
    const r = computeRecords([set('db_row', { weightKg: 10, reps: 8 })]).get('db_row')!;
    expect(nextTarget(ex, r, ex.measures, ['strength'])).toMatchObject({ weightKg: 12.5, reps: 8 });
    expect(nextTarget(ex, r, ex.measures, ['muscle'])).toMatchObject({ weightKg: 10, reps: 9 });
  });
  it('several goals: the first one (strength > muscle > lean > stamina > lose weight) the move serves', () => {
    expect(goalFor(EXERCISE_BY_ID.db_curl, ['stamina', 'muscle'])).toBe('muscle');
    expect(goalFor(EXERCISE_BY_ID.jumping_jack, ['strength', 'stamina'])).toBe('stamina');
    expect(goalFor(EXERCISE_BY_ID.db_curl, [])).toBeNull();
    expect(suggestedRestSec(['stamina', 'muscle'])).toBe(90);
    expect(suggestedRestSec([])).toBeNull();
  });
});

describe('unlocks come from the data', () => {
  it('deleting the record that earned an unlock locks it again', () => {
    const recordRule = EXERCISES.find((e) => e.unlock.type === 'record' && (e.unlock as any).exerciseId === 'push_up')!;
    const need = (recordRule.unlock as any).value as number;
    const good = set('push_up', { reps: need });
    const withRecord = unlockedFrom(buildStats([session(0)], [good], 0, T0), [session(0)]);
    expect(withRecord).toContain(recordRule.id);
    const deleted = unlockedFrom(buildStats([session(0)], [{ ...good, deleted: true }], 0, T0), [session(0)]);
    expect(deleted).not.toContain(recordRule.id);
  });
  it('a chest secret stays only while its session exists', () => {
    const s = { ...session(0), chestSecret: 'wall_sit' };
    expect(unlockedFrom(buildStats([s], [], 0, T0), [s])).toContain('wall_sit');
    const gone = { ...s, deleted: true };
    expect(unlockedFrom(buildStats([gone], [], 0, T0), [gone])).not.toContain('wall_sit');
  });
});

describe('xp and levels', () => {
  it('level thresholds', () => {
    expect(xpForLevel(2)).toBe(200);
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(199)).toBe(1);
    expect(levelFromXp(200)).toBe(2);
    expect(levelFromXp(9000)).toBe(10);
  });
  it('session xp adds parts and caps the streak bonus', () => {
    expect(sessionXp({ sets: 4, prs: 1, activeSec: 600, streak: 20, habitMet: true })).toBe(40 + 25 + 20 + 10 + 50 + 30);
  });
});

describe('habit builder', () => {
  it('starts at 10 minutes and grows by 5 after 5 met days', () => {
    expect(habitTarget([])).toBe(10);
    expect(habitTarget([0, 1, 2, 3].map((d) => session(d, 12)))).toBe(10);
    expect(habitTarget([0, 1, 2, 3, 4].map((d) => session(d, 12)))).toBe(15);
  });
  it('rest days do not reset the count; a missed week does', () => {
    expect(habitTarget([0, 2, 4, 7, 9].map((d) => session(d, 12)))).toBe(15);
    expect(habitTarget([0, 1, 10, 11, 12].map((d) => session(d, 12)))).toBe(10);
  });
  it('days under the goal do not count', () => {
    expect(habitTarget([0, 1, 2, 3, 4].map((d) => session(d, 8)))).toBe(10);
  });
  it('starter plan is short: max 3 exercises', () => {
    const avail = availableExercises(['push_up', 'run', 'squat', 'plank', 'sit_up'], []);
    expect(starterPlan(avail, 0).length).toBe(3);
    expect(starterPlan(avail, 10)).toEqual([]);
  });
  it('day keys use the phone time zone', () => {
    expect(dayKey(T0)).toBe('2026-11-01');
  });
});

describe('bmi', () => {
  it('computes and classifies (WHO cut-offs)', () => {
    expect(bmi(70, 170)).toBe(24.2);
    expect(bmiCategory(18.4)).toBe('Underweight');
    expect(bmiCategory(24.9)).toBe('Normal');
    expect(bmiCategory(25)).toBe('Overweight');
    expect(bmiCategory(30)).toBe('Obese');
  });
});

describe('mystery chest', () => {
  it('is deterministic for the same seed', () => {
    const ctx = { unlocked: ['push_up'], cosmetics: [], hadPR: false, records: new Map(), available: [] };
    expect(openChest('abc', ctx)).toEqual(openChest('abc', ctx));
  });
  it('gives every kind of reward across many seeds', () => {
    const records = computeRecords([set('push_up', { reps: 10 })]);
    const ctx = { unlocked: ['push_up', 'plank', 'squat', 'bird_dog', 'run_in_place', 'jumping_jack'], cosmetics: [], hadPR: true, records, available: [EXERCISE_BY_ID.push_up] };
    const kinds = new Set(Array.from({ length: 300 }, (_, i) => openChest(`seed${i}`, ctx).kind));
    expect([...kinds].sort()).toEqual(['challenge', 'color', 'secret', 'xp']);
  });
  it('secrets lean toward the goal profile', () => {
    const ctx = { unlocked: ['push_up', 'plank', 'squat', 'bird_dog', 'run_in_place', 'jumping_jack'], cosmetics: ['ember', 'ocean', 'jade', 'violet', 'gold', 'rose'], hadPR: false, records: new Map(), available: [], focus: ['legs' as const] };
    const picks = Array.from({ length: 400 }, (_, i) => openChest(`f${i}`, ctx)).filter((r) => r.kind === 'secret').map((r) => (r as any).exerciseId as string);
    const legHits = picks.filter((id) => profileScore(EXERCISE_BY_ID[id], [], ['legs']) > 0).length;
    const legShare = EXERCISES.filter((e) => e.unlock.type === 'secret' && profileScore(e, [], ['legs']) > 0).length / EXERCISES.filter((e) => e.unlock.type === 'secret').length;
    expect(legHits / picks.length).toBeGreaterThan(legShare);
  });
  it('challenge is met by a set at or above target', () => {
    expect(challengeMet({ exerciseId: 'push_up', target: 12, xp: 100 }, [set('push_up', { reps: 12 })])).toBe(true);
    expect(challengeMet({ exerciseId: 'push_up', target: 12, xp: 100 }, [set('push_up', { reps: 11 })])).toBe(false);
  });
});
