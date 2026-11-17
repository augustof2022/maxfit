import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { totalXp } from '../core/rules';
import { db } from './db';
import { ensureSeed, exportAll, finishSession, importAll, logSet, startSession } from './repo';

beforeEach(async () => {
  await Promise.all([db.profile.clear(), db.locations.clear(), db.sessions.clear(), db.sets.clear(), db.weights.clear(), db.meta.clear()]);
  await ensureSeed();
});

describe('seed', () => {
  it('seed rows use updatedAt 0 and fixed ids, so a new device never overwrites cloud data', async () => {
    expect((await db.profile.get('me'))!.updatedAt).toBe(0);
    const locs = await db.locations.toArray();
    expect(locs.map((l) => l.id).sort()).toEqual(['gym', 'home']);
    expect(locs.every((l) => l.updatedAt === 0)).toBe(true);
  });
});

describe('sessions', () => {
  it('a double tap on Start makes only one active session', async () => {
    const [a, b] = await Promise.all([startSession('home'), startSession('home')]);
    expect(a.id).toBe(b.id);
    expect(await db.sessions.where('status').equals('active').count()).toBe(1);
  });

  it('an empty session cannot be finished (no XP farming)', async () => {
    const s = await startSession('home');
    await expect(finishSession(s.id)).rejects.toThrow(/at least one set/);
  });

  it('finishing stores XP on the session; a second finish is refused', async () => {
    const s = await startSession('home');
    await logSet(s.id, 'push_up', { reps: 8 });
    const sum = await finishSession(s.id);
    expect(sum.xp).toBeGreaterThan(0);
    expect(totalXp(await db.sessions.toArray())).toBe(sum.xp);
    await expect(finishSession(s.id)).rejects.toThrow(/already finished/);
  });

  it('streak bonus is paid once per day', async () => {
    const s1 = await startSession('home');
    await logSet(s1.id, 'push_up', { reps: 8 });
    const a = await finishSession(s1.id);
    const s2 = await startSession('home');
    await logSet(s2.id, 'push_up', { reps: 8 });
    const b = await finishSession(s2.id);
    expect(a.xpParts.some((p) => p.label.includes('streak'))).toBe(true);
    expect(b.xpParts.some((p) => p.label.includes('streak'))).toBe(false);
  });

  it('a session left open for hours ends at the last activity', async () => {
    const s = await startSession('home');
    const threeHoursAgo = Date.now() - 3 * 3600_000;
    await db.sessions.update(s.id, { startedAt: threeHoursAgo, live: { ...s.live!, modeStartedAt: threeHoursAgo } });
    const set = await logSet(s.id, 'push_up', { reps: 8 });
    await db.sets.update(set.set.id, { at: threeHoursAgo + 60_000 });
    const sum = await finishSession(s.id);
    expect(sum.trimmed).toBe(true);
    expect(sum.session.activeSec + sum.session.restSec).toBeLessThanOrEqual(3 * 60);
  });
});

describe('backup', () => {
  it('rejects a broken backup and changes nothing', async () => {
    await expect(importAll(JSON.stringify({ app: 'maxfit', profile: [] }))).rejects.toThrow();
    expect(await db.profile.get('me')).toBeTruthy();
  });

  it('restore stamps rows as new (so they sync) and soft-deletes rows not in the backup', async () => {
    const s = await startSession('home');
    await logSet(s.id, 'push_up', { reps: 8 });
    await finishSession(s.id);
    const backup = JSON.parse(await exportAll());
    const s2 = await startSession('home'); // not in the backup
    const before = Date.now();
    await importAll(JSON.stringify(backup));
    expect((await db.sessions.get(s2.id))!.deleted).toBe(true);
    expect((await db.sessions.get(s.id))!.updatedAt).toBeGreaterThanOrEqual(before);
  });
});
