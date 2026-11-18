// The exercise picker for plans (Renz, 2026-11-18, round 5): a searchable, filterable list of the
// exercises he has unlocked AND can do at the place. Pure, unit-tested in picker.test.ts.

import type { Exercise, Focus } from './types';

/** "All", cardio, or one body area. */
export type PickerArea = 'all' | Focus;
/** Any kit, bodyweight only (no equipment), or equipment only. */
export type PickerKit = 'any' | 'bodyweight' | 'equipment';

export const AREA_LABEL: Record<Focus, string> = {
  cardio: 'Cardio',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  legs: 'Legs',
};

/** The filter chips in their order: All first, then the areas that have at least one exercise in the list. */
export function areaChips(list: Exercise[]): PickerArea[] {
  const order: Focus[] = ['cardio', 'chest', 'back', 'shoulders', 'arms', 'core', 'legs'];
  return ['all', ...order.filter((f) => list.some((e) => e.focus.includes(f)))];
}

/** "Chest, arms, shoulders" — the body areas an exercise trains, cardio first. */
export function bodyParts(ex: Exercise): string {
  return ex.focus.map((f) => AREA_LABEL[f]).join(', ');
}

/** Lower case, no accents or punctuation, so "push up" finds "Push-up". */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Filter the doable list by search text (name, body area, muscle), area and kit. Keeps the input order. */
export function filterExercises(list: Exercise[], f: { query?: string; area?: PickerArea; kit?: PickerKit }): Exercise[] {
  const words = norm(f.query ?? '').split(' ').filter(Boolean);
  return list.filter((e) => {
    if (f.area && f.area !== 'all' && !e.focus.includes(f.area)) return false;
    if (f.kit === 'bodyweight' && e.equipment.length > 0) return false;
    if (f.kit === 'equipment' && e.equipment.length === 0) return false;
    if (!words.length) return true;
    const hay = norm([e.name, ...e.focus.map((x) => AREA_LABEL[x]), ...e.muscles].join(' '));
    return words.every((w) => hay.includes(w));
  });
}
