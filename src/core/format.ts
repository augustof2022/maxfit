// Shared text formats for records and sets (used by Train, Progress, Home and the history sheet).

import { fmtClock } from './live';
import { fmtLevel, fmtValues, levelOf } from './measures';
import { fmtPace, type ExRecord } from './rules';
import type { Measure, WorkSet } from './types';

/** The record ("the number to beat") in the user's measures, plus best pace for cardio. */
export function fmtRecord(ms: Measure[], r: ExRecord): string {
  const b = r.bestSet;
  if (!b) return '-';
  const bt = r.beat;
  if (bt.kind === 'same') {
    const lvl = levelOf(bt, b)!;
    const heaviest = bt.fixed === 'weight' && r.maxLevel > lvl ? ` · heaviest ${r.maxLevel} kg` : '';
    const others = r.levels.size > 1 ? ` · ${r.levels.size} ${bt.fixed === 'weight' ? 'weights' : 'distances'}` : '';
    return `${fmtValues([bt.beat], b)} ${fmtLevel(bt, lvl)}${heaviest}${others}`;
  }
  return `${fmtValues(ms, b)}${ms.includes('distance') && r.bestPace ? ` · best pace ${fmtPace(r.bestPace)}/km` : ''}`;
}

export function fmtSet(ms: Measure[], s: WorkSet): string {
  const base = fmtValues(ms, s);
  if (s.runSec || s.walkSec) return `${base} (run ${fmtClock(s.runSec ?? 0)}, walk ${fmtClock(s.walkSec ?? 0)}, rest ${fmtClock(s.restSec ?? 0)})`;
  return base;
}

/** "Nov 17" from a time or a day key (YYYY-MM-DD). */
export function fmtDay(at: number | string, weekday = false): string {
  const d = typeof at === 'number' ? new Date(at) : new Date(`${at}T12:00:00`);
  return d.toLocaleDateString(undefined, { ...(weekday ? { weekday: 'short' as const } : {}), month: 'short', day: 'numeric' });
}

/** "Last 12 reps (Nov 17) · Best 15 reps", or "Not done yet". For every exercise listing. */
export function lastBestText(ms: Measure[], r: ExRecord | undefined): string {
  if (!r?.last) return 'Not done yet';
  const best = r.bestSet ? fmtRecord(ms, r) : '-';
  return `Last ${fmtValues(ms, r.last)} (${fmtDay(r.last.at)}) · Best ${best}`;
}
