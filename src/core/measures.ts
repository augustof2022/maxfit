// How an exercise is measured, and what "beating" a record means.
// Renz chose (2026-11-18): each exercise can be tracked by one or more measures,
// and a set beats the record when at least one tracked measure goes up and none goes down ("rule A").

import { fmtClock } from './live';
import type { Exercise, Measure, WorkSet } from './types';

export const MEASURES: { id: Measure; label: string; unit: string; step: number }[] = [
  { id: 'reps', label: 'Reps', unit: 'reps', step: 1 },
  { id: 'time', label: 'Time', unit: 's', step: 5 },
  { id: 'distance', label: 'Distance', unit: 'km', step: 0.1 },
  { id: 'weight', label: 'Weight', unit: 'kg', step: 2.5 },
];

/** Fixed display order, so "20 kg x 10" always reads the same way. */
const ORDER: Measure[] = ['weight', 'distance', 'reps', 'time'];

export type MeasureOverrides = Record<string, Measure[] | undefined>;

/** The measures this user tracks for this exercise: their own choice, or the default. */
export function measuresFor(ex: Exercise, overrides?: MeasureOverrides | null): Measure[] {
  const own = overrides?.[ex.id]?.filter((m) => ORDER.includes(m));
  return own && own.length ? own : ex.measures;
}

/** The main measure: used by unlock rules and challenges ("12 push-ups"). Always the exercise's default. */
export function mainMeasure(ex: Exercise): Measure {
  return ex.measures[0];
}

/** A set's value for one measure. Time is the held/worked seconds, or the cardio duration. */
export function measureValue(s: Partial<WorkSet>, m: Measure): number {
  switch (m) {
    case 'reps':
      return s.reps ?? 0;
    case 'time':
      return s.seconds ?? s.durationSec ?? 0;
    case 'distance':
      return s.distanceKm ?? 0;
    case 'weight':
      return s.weightKg ?? 0;
  }
}

/** True when the set has a positive number for at least one tracked measure. */
export function hasValue(ms: Measure[], s: Partial<WorkSet>): boolean {
  return ms.some((m) => measureValue(s, m) > 0);
}

/**
 * Rule A: `a` beats `b` when at least one tracked measure is higher and none is lower.
 * The first set ever (no `b`) is the first benchmark, not a "beat".
 */
export function beats(ms: Measure[], a: Partial<WorkSet>, b: Partial<WorkSet> | null | undefined): boolean {
  if (!b) return false;
  let up = false;
  for (const m of ms) {
    const va = measureValue(a, m);
    const vb = measureValue(b, m);
    if (va < vb) return false;
    if (va > vb) up = true;
  }
  return up;
}

function fmtOne(m: Measure, v: number, short: boolean): string {
  switch (m) {
    case 'reps':
      return short ? `${v}` : `${v} reps`;
    case 'time':
      return v >= 90 ? fmtClock(v) : `${v}s`;
    case 'distance':
      return `${v} km`;
    case 'weight':
      return `${v} kg`;
  }
}

/** "20 kg x 10", "1.2 km in 8:30", "45s", "12 reps". */
export function fmtValues(ms: Measure[], s: Partial<WorkSet>, short = false): string {
  // With several measures, leave out the ones this set has no number for ("11 reps", not "11 · 0s").
  const all = ORDER.filter((m) => ms.includes(m));
  const withValue = all.filter((m) => measureValue(s, m) > 0);
  const shown = withValue.length ? withValue : all.slice(0, 1);
  ms = shown;
  if (shown.length === 1) return fmtOne(shown[0], measureValue(s, shown[0]), short);
  const parts = shown.map((m) => fmtOne(m, measureValue(s, m), true));
  if (ms.includes('distance') && ms.includes('time')) {
    const rest = shown.filter((m) => m !== 'distance' && m !== 'time').map((m) => fmtOne(m, measureValue(s, m), true));
    return [`${measureValue(s, 'distance')} km in ${fmtClock(measureValue(s, 'time'))}`, ...rest].join(' · ');
  }
  if (ms.includes('weight') && ms.includes('reps')) {
    const rest = shown.filter((m) => m !== 'weight' && m !== 'reps').map((m) => fmtOne(m, measureValue(s, m), true));
    return [`${measureValue(s, 'weight')} kg × ${measureValue(s, 'reps')}`, ...rest].join(' · ');
  }
  return parts.join(' · ');
}

export const MEASURE_ICON: Record<Measure, string> = { reps: '🔁', time: '⏱️', distance: '📍', weight: '🏋️' };

export function iconFor(ms: Measure[]): string {
  if (ms.includes('distance')) return '🏃';
  if (ms.includes('weight')) return MEASURE_ICON.weight;
  return MEASURE_ICON[ms[0]];
}

/** Uses the run / walk / rest tracker when the user tracks distance. */
export function isCardioFlow(ms: Measure[]): boolean {
  return ms.includes('distance');
}
