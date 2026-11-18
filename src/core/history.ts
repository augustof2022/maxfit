// Exercise history: the best set of each day, for the history sheet, the trend chart and the
// "I did" lines on the progress photo. Pure functions (unit-tested in history.test.ts).

import { EXERCISE_BY_ID } from './exercises';
import { fmtValues, hasValue, levelOf, lowerWins, measureValue } from './measures';
import { dayKey, type BeatOf, type MeasuresOf } from './rules';
import type { Beat, Measure, WorkSet } from './types';

/** Sort key of a set: bigger is better, compared number by number in this order. */
function key(s: WorkSet, ms: Measure[], beat: Beat): number[] {
  const one = (m: Measure) => {
    const v = measureValue(s, m);
    if (lowerWins(m)) return v > 0 ? -v : -Infinity;
    return v;
  };
  // Same weight / distance: the heaviest weight (or longest distance) first, then the beaten number.
  if (beat.kind === 'same') return [levelOf(beat, s) ?? 0, one(beat.beat)];
  return ms.map(one);
}

function better(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }
  return false;
}

/** The best set among these (the first one wins a tie). Null when none has a number. */
export function bestSetOf(sets: WorkSet[], ms: Measure[], beat: Beat): WorkSet | null {
  let best: WorkSet | null = null;
  let bestKey: number[] = [];
  for (const s of sets) {
    if (s.deleted) continue;
    const k = key(s, ms, beat);
    if (!hasValue(beat.kind === 'same' ? [beat.beat] : ms, s)) continue;
    if (!best || better(k, bestKey)) {
      best = s;
      bestKey = k;
    }
  }
  return best;
}

export interface DayBest {
  date: string;
  best: WorkSet;
  /** A record (PR) was set that day. */
  record: boolean;
  sets: number;
}

/** One row per day the exercise was done: the best set that day. Newest day first. */
export function historyByDay(sets: WorkSet[], exerciseId: string, ms: Measure[], beat: Beat): DayBest[] {
  const byDay = new Map<string, WorkSet[]>();
  for (const s of sets) {
    if (s.deleted || s.exerciseId !== exerciseId) continue;
    const k = dayKey(s.at);
    byDay.set(k, [...(byDay.get(k) ?? []), s]);
  }
  const out: DayBest[] = [];
  for (const [date, list] of byDay) {
    const best = bestSetOf(list, ms, beat);
    if (best) out.push({ date, best, record: list.some((x) => x.isPR), sets: list.length });
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** The number the trend chart draws for a set, and its unit. */
export function chartPoint(s: WorkSet, ms: Measure[], beat: Beat): { v: number; unit: string; measure: Measure } {
  const m: Measure = beat.kind === 'same' ? beat.beat : ms[0];
  const unit = m === 'reps' ? 'reps' : m === 'distance' ? 'km' : m === 'weight' ? 'kg' : 's';
  return { v: Math.round(measureValue(s, m) * 100) / 100, unit, measure: m };
}

export interface DidLine {
  exerciseId: string;
  name: string;
  value: string;
  record: boolean;
}

/**
 * "I did" lines for a set of sets (e.g. one day): each exercise once, with its best set, in the order
 * they were first done. mode 'records' keeps only exercises with a record, and shows the best record set.
 */
export function didLines(sets: WorkSet[], mode: 'all' | 'records', measuresOf: MeasuresOf, beatOf: BeatOf): DidLine[] {
  const live = sets.filter((s) => !s.deleted).sort((a, b) => a.at - b.at);
  const order: string[] = [];
  for (const s of live) if (!order.includes(s.exerciseId)) order.push(s.exerciseId);
  const out: DidLine[] = [];
  for (const id of order) {
    const ex = EXERCISE_BY_ID[id];
    if (!ex) continue;
    const mine = live.filter((s) => s.exerciseId === id);
    const pool = mode === 'records' ? mine.filter((s) => s.isPR) : mine;
    if (!pool.length) continue;
    const ms = measuresOf(ex);
    const beat = beatOf(ex);
    const best = bestSetOf(pool, ms, beat);
    if (!best) continue;
    out.push({ exerciseId: id, name: ex.name, value: fmtValues(beat.kind === 'same' ? [beat.fixed, beat.beat] : ms, best), record: mine.some((s) => s.isPR) });
  }
  return out;
}
