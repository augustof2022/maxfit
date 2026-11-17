import { describe, expect, it } from 'vitest';
import { mergeRow } from './merge';

describe('sync merge', () => {
  it('normal rows: newer wins, older is ignored', () => {
    expect(mergeRow('sets', { id: 'a', updatedAt: 1 }, { id: 'a', updatedAt: 2, reps: 5 })).toMatchObject({ reps: 5 });
    expect(mergeRow('sets', { id: 'a', updatedAt: 3 }, { id: 'a', updatedAt: 2 })).toBeNull();
    expect(mergeRow('sets', undefined, { id: 'a', updatedAt: 2 })).toMatchObject({ id: 'a' });
  });
  it('a fresh seed profile (updatedAt 0) never beats the real cloud profile', () => {
    const seed = { id: 'me', updatedAt: 0, unlocked: ['push_up', 'run'], cosmetics: ['ember'] };
    const cloud = { id: 'me', updatedAt: 500, unlocked: ['push_up', 'run', 'squat', 'plank'], cosmetics: ['ember', 'gold'], heightCm: 170 };
    const m = mergeRow('profile', seed, cloud, 999)!;
    expect(m.heightCm).toBe(170);
    expect(m.unlocked).toEqual(['push_up', 'run', 'squat', 'plank']);
    expect(m.updatedAt).toBe(500); // nothing new to push back
  });
  it('profile unlocks are a union; a merged row is stamped so it syncs back up', () => {
    const local = { id: 'me', updatedAt: 100, unlocked: ['push_up', 'squat'], cosmetics: ['ember'] };
    const remote = { id: 'me', updatedAt: 200, unlocked: ['push_up', 'plank'], cosmetics: ['ember', 'gold'] };
    const m = mergeRow('profile', local, remote, 999)!;
    expect(new Set(m.unlocked as string[])).toEqual(new Set(['push_up', 'squat', 'plank']));
    expect(new Set(m.cosmetics as string[])).toEqual(new Set(['ember', 'gold']));
    expect(m.updatedAt).toBe(999);
  });
  it('local profile newer and already has everything: keep local', () => {
    const local = { id: 'me', updatedAt: 300, unlocked: ['push_up', 'plank'], cosmetics: ['ember'] };
    const remote = { id: 'me', updatedAt: 200, unlocked: ['push_up'], cosmetics: ['ember'] };
    expect(mergeRow('profile', local, remote)).toBeNull();
  });
});
