import { describe, expect, it } from 'vitest';
import { EXERCISE_BY_ID } from './exercises';
import { areaChips, bodyParts, filterExercises } from './picker';

const list = ['push_up', 'plank', 'run', 'db_curl', 'squat'].map((id) => EXERCISE_BY_ID[id]).filter(Boolean);

describe('exercise picker filters', () => {
  it('search matches the name in any spelling, and body areas and muscles', () => {
    expect(filterExercises(list, { query: 'push up' }).map((e) => e.id)).toEqual(['push_up']);
    expect(filterExercises(list, { query: 'PUSH-UP' }).map((e) => e.id)).toEqual(['push_up']);
    expect(filterExercises(list, { query: 'biceps' }).map((e) => e.id)).toContain('db_curl');
    expect(filterExercises(list, { query: 'zzz' })).toEqual([]);
  });

  it('area filter: cardio and body parts', () => {
    expect(filterExercises(list, { area: 'cardio' }).every((e) => e.focus.includes('cardio'))).toBe(true);
    expect(filterExercises(list, { area: 'cardio' }).map((e) => e.id)).toContain('run');
    expect(filterExercises(list, { area: 'legs' }).map((e) => e.id)).toContain('squat');
    expect(filterExercises(list, { area: 'all' })).toHaveLength(list.length);
  });

  it('bodyweight = no equipment; equipment = needs some', () => {
    expect(filterExercises(list, { kit: 'bodyweight' }).map((e) => e.id)).not.toContain('db_curl');
    expect(filterExercises(list, { kit: 'equipment' }).map((e) => e.id)).toEqual(['db_curl']);
  });

  it('filters combine, keep the list order; chips only for areas present', () => {
    expect(filterExercises(list, { area: 'arms', kit: 'bodyweight' }).map((e) => e.id)).toEqual(['push_up']);
    const chips = areaChips(list);
    expect(chips[0]).toBe('all');
    expect(chips).toContain('cardio');
    expect(areaChips([EXERCISE_BY_ID.push_up])).not.toContain('legs');
    expect(bodyParts(EXERCISE_BY_ID.push_up)).toBe('Chest, Arms, Shoulders');
  });
});
