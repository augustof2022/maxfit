import { describe, expect, it } from 'vitest';
import { cleanTarget, copyName, copyPlan, moveItem, planError, plansAt } from './plans';
import type { Plan } from './types';

const plan = (o: Partial<Plan> = {}): Plan => ({
  id: 'p1',
  name: 'Push day',
  description: 'Chest',
  locationId: 'home',
  items: [
    { exerciseId: 'push_up', sets: 3, target: { reps: 12 } },
    { exerciseId: 'plank', sets: 2, target: { seconds: 45 } },
  ],
  createdAt: 1,
  lastUsedAt: 5,
  lastViewedAt: 6,
  updatedAt: 6,
  ...o,
});

describe('plans', () => {
  it('a copy is independent: changing the copy never changes the original', () => {
    const src = plan();
    const c = copyPlan(src, { id: 'p2', locationId: 'gym', now: 100 });
    c.items[0].sets = 9;
    c.items[0].target.reps = 99;
    c.items.push({ exerciseId: 'run', sets: 1, target: {} });
    expect(src.items).toHaveLength(2);
    expect(src.items[0]).toEqual({ exerciseId: 'push_up', sets: 3, target: { reps: 12 } });
    expect(c).toMatchObject({ id: 'p2', locationId: 'gym', lastUsedAt: null, lastViewedAt: null, createdAt: 100 });
  });

  it('copy names: (copy), then (copy 2), never a name already used', () => {
    expect(copyName('Push day', ['Push day'])).toBe('Push day (copy)');
    expect(copyName('Push day', ['Push day', 'Push day (copy)'])).toBe('Push day (copy 2)');
    expect(copyName('Push day (copy)', ['Push day', 'push day (copy)'])).toBe('Push day (copy 2)');
  });

  it('checks a plan before saving', () => {
    expect(planError({ name: ' ', locationId: 'home', items: plan().items })).toMatch(/name/);
    expect(planError({ name: 'A', locationId: 'home', items: [] })).toMatch(/at least one/);
    expect(planError({ name: 'A', locationId: 'home', items: [...plan().items, plan().items[0]] })).toMatch(/twice/);
    expect(planError({ name: 'A', locationId: 'home', items: [{ exerciseId: 'run', sets: 0, target: {} }] })).toMatch(/Sets/);
    expect(planError({ name: 'A', locationId: 'home', items: plan().items })).toBeNull();
  });

  it('reorders one step and ignores moves past the ends', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    expect(moveItem(['a', 'b'], 0, -1)).toEqual(['a', 'b']);
  });

  it('keeps only targets above 0; lists plans of one place, last used first, no deleted', () => {
    expect(cleanTarget({ reps: 0, seconds: 30, weightKg: undefined })).toEqual({ seconds: 30 });
    const list = [plan({ id: 'a', lastUsedAt: 10 }), plan({ id: 'b', lastUsedAt: 20 }), plan({ id: 'c', deleted: true }), plan({ id: 'd', locationId: 'gym' })];
    expect(plansAt(list, 'home').map((p) => p.id)).toEqual(['b', 'a']);
  });
});
