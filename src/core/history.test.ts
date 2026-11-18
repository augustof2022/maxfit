import { describe, expect, it } from 'vitest';
import { bestSetOf, chartPoint, didLines, historyByDay } from './history';
import { defaultBeatOf, defaultMeasuresOf } from './rules';
import type { WorkSet } from './types';

const day = (d: number, h = 10) => new Date(2026, 10, d, h).getTime();
let n = 0;
const set = (o: Partial<WorkSet>): WorkSet => ({ id: `s${n++}`, sessionId: 'x', exerciseId: 'push_up', at: day(1), isPR: false, updatedAt: 1, ...o });

describe('exercise history', () => {
  it('best per day: one row per day with that day best set, newest first, records marked', () => {
    const sets = [set({ at: day(1, 9), reps: 8 }), set({ at: day(1, 10), reps: 12, isPR: true }), set({ at: day(1, 11), reps: 10 }), set({ at: day(3), reps: 11 }), set({ at: day(3), reps: 5, deleted: true }), set({ exerciseId: 'plank', at: day(3), seconds: 30 })];
    const rows = historyByDay(sets, 'push_up', ['reps'], { kind: 'any' });
    expect(rows.map((r) => [r.date, r.best.reps, r.record, r.sets])).toEqual([
      ['2026-11-03', 11, false, 1],
      ['2026-11-01', 12, true, 3],
    ]);
  });

  it('same weight: the heaviest weight first, then the most reps at it', () => {
    const b = bestSetOf([set({ weightKg: 20, reps: 15 }), set({ weightKg: 30, reps: 8 }), set({ weightKg: 30, reps: 10 })], ['weight', 'reps'], { kind: 'same', fixed: 'weight', beat: 'reps' });
    expect([b?.weightKg, b?.reps]).toEqual([30, 10]);
    expect(chartPoint(b!, ['weight', 'reps'], { kind: 'same', fixed: 'weight', beat: 'reps' })).toMatchObject({ v: 10, unit: 'reps' });
  });

  it('faster time: the lowest time is the best; a set without a time is skipped', () => {
    const b = bestSetOf([set({ seconds: 15.2 }), set({ seconds: 14.6 }), set({})], ['speed'], { kind: 'any' });
    expect(b?.seconds).toBe(14.6);
  });

  it('"I did": each exercise once with its best; records-only keeps exercises with a record', () => {
    const sets = [set({ at: day(5, 9), reps: 20 }), set({ at: day(5, 10), reps: 25, isPR: true }), set({ exerciseId: 'plank', at: day(5, 11), seconds: 60 })];
    expect(didLines(sets, 'all', defaultMeasuresOf, defaultBeatOf).map((l) => `${l.name} ${l.value}`)).toEqual(['Push-up 25 reps', 'Plank 60s']);
    expect(didLines(sets, 'records', defaultMeasuresOf, defaultBeatOf).map((l) => l.name)).toEqual(['Push-up']);
  });
});
