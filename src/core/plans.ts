// Exercise plans per place (Renz, 2026-11-18). Pure helpers, unit-tested in plans.test.ts.
// Import and duplicate make a deep COPY: a new id and its own items, so editing the copy never
// changes the original (like importing questions in Google Forms).

import { fmtValues } from './measures';
import type { Measure, Plan, PlanItem, PlanTarget } from './types';

export const PLAN_NAME_MAX = 40;
export const PLAN_DESC_MAX = 140;
export const PLAN_MAX_SETS = 10;

/** A deep copy of a plan for another place (import) or the same place (duplicate). */
export function copyPlan(src: Plan, opts: { id: string; locationId: string; name?: string; now: number }): Plan {
  return {
    id: opts.id,
    name: (opts.name ?? src.name).slice(0, PLAN_NAME_MAX),
    description: src.description,
    locationId: opts.locationId,
    items: src.items.map((it) => ({ exerciseId: it.exerciseId, sets: it.sets, target: { ...it.target } })),
    createdAt: opts.now,
    lastUsedAt: null,
    lastViewedAt: null,
    updatedAt: opts.now,
  };
}

/** "Push day (copy)", then "Push day (copy 2)", ... — a name not used yet among `taken`. */
export function copyName(name: string, taken: string[]): string {
  const base = name.replace(/ \(copy( \d+)?\)$/, '');
  const used = new Set(taken.map((t) => t.toLowerCase()));
  for (let n = 1; ; n++) {
    const candidate = `${base} (copy${n === 1 ? '' : ` ${n}`})`.slice(0, PLAN_NAME_MAX);
    if (!used.has(candidate.toLowerCase())) return candidate;
  }
}

/** Check a plan before saving. Returns a readable error, or null if OK. */
export function planError(p: { name: string; locationId: string; items: PlanItem[] }): string | null {
  if (!p.name.trim()) return 'Give the plan a name.';
  if (!p.locationId) return 'Pick the place this plan is for.';
  if (!p.items.length) return 'Add at least one exercise.';
  if (new Set(p.items.map((i) => i.exerciseId)).size !== p.items.length) return 'An exercise is in the plan twice.';
  if (p.items.some((i) => !Number.isFinite(i.sets) || i.sets < 1 || i.sets > PLAN_MAX_SETS)) return `Sets must be 1 to ${PLAN_MAX_SETS}.`;
  return null;
}

/** Move one item up (-1) or down (+1). Returns a new list. */
export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const j = index + dir;
  if (index < 0 || index >= list.length || j < 0 || j >= list.length) return list;
  const out = [...list];
  [out[index], out[j]] = [out[j], out[index]];
  return out;
}

/** Only the numbers that are set (above 0), so an empty target stays empty. */
export function cleanTarget(t: PlanTarget): PlanTarget {
  const out: PlanTarget = {};
  if ((t.reps ?? 0) > 0) out.reps = Math.round(t.reps!);
  if ((t.seconds ?? 0) > 0) out.seconds = t.seconds;
  if ((t.weightKg ?? 0) > 0) out.weightKg = t.weightKg;
  if ((t.distanceKm ?? 0) > 0) out.distanceKm = t.distanceKm;
  return out;
}

export function hasTarget(t: PlanTarget): boolean {
  return Object.keys(cleanTarget(t)).length > 0;
}

/** "3 sets × 12 reps", "2 sets × 45s", "3 sets". */
export function fmtPlanItem(it: PlanItem, ms: Measure[]): string {
  const sets = `${it.sets} ${it.sets === 1 ? 'set' : 'sets'}`;
  return hasTarget(it.target) ? `${sets} × ${fmtValues(ms, it.target)}` : sets;
}

/**
 * When each plan was last used, worked out from the sessions started from it (not stored on the plan:
 * a "touch" on a last-write-wins row would overwrite an edit made on another device — code review 2026-11-18).
 */
export function planLastUsed(sessions: { planId?: string | null; startedAt: number; deleted?: boolean }[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sessions) if (s.planId && !s.deleted && (out.get(s.planId) ?? 0) < s.startedAt) out.set(s.planId, s.startedAt);
  return out;
}

/** Plans of one place, last used (or made) first. */
export function plansAt(plans: Plan[], locationId: string | null, lastUsed: Map<string, number> = new Map()): Plan[] {
  const key = (p: Plan) => lastUsed.get(p.id) ?? p.createdAt;
  return plans.filter((p) => !p.deleted && p.locationId === locationId).sort((a, b) => key(b) - key(a));
}
