// Live session clock: time is "banked" per mode each time the mode changes,
// so the totals survive an app reload (the state is saved in the session row).

import type { LiveMode, LiveState } from './types';

export const ZERO: Record<LiveMode, number> = { idle: 0, exercise: 0, rest: 0, run: 0, walk: 0 };

/**
 * Longest one unbroken stretch in a mode can count, so a forgotten session cannot pile up hours.
 * Exercise / rest: 30 min. Run / walk: 4 h (a long run is real).
 */
export const MAX_SEGMENT_SEC: Record<LiveMode, number> = { idle: 30 * 60, exercise: 30 * 60, rest: 30 * 60, run: 4 * 3600, walk: 4 * 3600 };

function segment(live: LiveState, now: number): number {
  return Math.min(MAX_SEGMENT_SEC[live.mode], Math.max(0, (now - live.modeStartedAt) / 1000));
}

export function newLive(now: number): LiveState {
  return { mode: 'exercise', modeStartedAt: now, banked: { ...ZERO }, cardio: null };
}

/** Seconds spent per mode, including the mode running now. */
export function totals(live: LiveState, now: number): Record<LiveMode, number> {
  const t = { ...live.banked };
  t[live.mode] += segment(live, now);
  return t;
}

export function cardioTotals(live: LiveState, now: number): Record<LiveMode, number> | null {
  if (!live.cardio) return null;
  const t = { ...live.cardio.banked };
  t[live.mode] += segment(live, now);
  return t;
}

export function switchMode(live: LiveState, mode: LiveMode, now: number): LiveState {
  const elapsed = segment(live, now);
  const banked = { ...live.banked, [live.mode]: live.banked[live.mode] + elapsed };
  const cardio = live.cardio ? { ...live.cardio, banked: { ...live.cardio.banked, [live.mode]: live.cardio.banked[live.mode] + elapsed } } : null;
  return { mode, modeStartedAt: now, banked, cardio };
}

/** Seconds in the current mode (for the rest alarm). */
export function inMode(live: LiveState, now: number): number {
  return Math.max(0, (now - live.modeStartedAt) / 1000);
}

export function activeSeconds(t: Record<LiveMode, number>): number {
  return t.exercise + t.run + t.walk;
}

export function fmtClock(sec: number): string {
  const s = Math.floor(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? h + ':' : ''}${mm}:${String(r).padStart(2, '0')}`;
}
