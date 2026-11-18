import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { totalXp } from '../core/rules';
import { db } from './db';
import { addEquipment, deleteEquipment, deleteSession, deleteSet, ensureSeed, exportAll, finishSession, importAll, logSet, resetTrainingData, setExerciseMeasures, setExerciseTrack, migrateRecords, setMode, startSession, updateSession, updateSet, updateWeight, addWeight } from './repo';

beforeEach(async () => {
  await Promise.all([db.photos.clear(), db.profile.clear(), db.locations.clear(), db.sessions.clear(), db.sets.clear(), db.weights.clear(), db.equipment.clear(), db.meta.clear(), db.plans.clear()]);
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

  it('a forgotten rest is capped at 30 minutes even after a mode switch', async () => {
    const s = await startSession('home');
    await logSet(s.id, 'push_up', { reps: 8 });
    const thirteenHoursAgo = Date.now() - 13 * 3600_000;
    const live = (await db.sessions.get(s.id))!.live!;
    await db.sessions.update(s.id, { live: { ...live, mode: 'rest', modeStartedAt: thirteenHoursAgo } });
    await setMode(s.id, 'exercise'); // "Back to work" the next morning
    const sum = await finishSession(s.id);
    expect(sum.session.restSec).toBeLessThanOrEqual(30 * 60);
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

describe('equipment library', () => {
  it('adds a custom item once (same name = same item) and soft-deletes it', async () => {
    const a = await addEquipment('Hip abductor machine', 'machines');
    const b = await addEquipment('  hip ABDUCTOR machine ', 'machines');
    expect(a).toBe(b);
    expect(a.startsWith('custom-')).toBe(true);
    await db.locations.update('gym', { equipment: ['dumbbell', a] });
    await deleteEquipment(a);
    expect((await db.equipment.get(a))!.deleted).toBe(true);
    expect((await db.locations.get('gym'))!.equipment).toEqual(['dumbbell']);
    await expect(deleteEquipment('dumbbell')).rejects.toThrow(/Built-in/);
  });
  it('an old backup without an equipment list still restores', async () => {
    const backup = JSON.parse(await exportAll());
    delete backup.equipment;
    await importAll(JSON.stringify(backup));
    expect(await db.profile.get('me')).toBeTruthy();
  });
});

describe('edit and delete (Renz, 2026-11-18)', () => {
  async function twoSessions() {
    const a = await startSession('home');
    await logSet(a.id, 'push_up', { reps: 8 });
    const sa = await finishSession(a.id);
    const b = await startSession('home');
    const pr = await logSet(b.id, 'push_up', { reps: 10 });
    const sb = await finishSession(b.id);
    return { a: sa, b: sb, prSet: pr.set };
  }

  it('deleting a record set removes its XP and its record flag', async () => {
    const { b, prSet } = await twoSessions();
    expect(prSet.isPR).toBe(true);
    const before = (await db.sessions.get(b.session.id))!.xpEarned;
    await deleteSet(prSet.id);
    const after = (await db.sessions.get(b.session.id))!;
    expect(before - after.xpEarned).toBe(10 + 25);
    expect(after.prs).toBe(0);
  });

  it('editing a set re-checks records: a lower value is no longer a record', async () => {
    const { b, prSet } = await twoSessions();
    await updateSet(prSet.id, { reps: 7 });
    expect((await db.sets.get(prSet.id))!.isPR).toBe(false);
    expect((await db.sessions.get(b.session.id))!.prs).toBe(0);
  });

  it('deleting a session deletes its sets and its XP', async () => {
    const { a } = await twoSessions();
    const xp = totalXp(await db.sessions.toArray());
    await deleteSession(a.session.id);
    expect((await db.sets.where('sessionId').equals(a.session.id).toArray()).every((x) => x.deleted)).toBe(true);
    expect(totalXp(await db.sessions.toArray())).toBeLessThan(xp);
  });

  it('moving a session to another day moves its sets too', async () => {
    const { a } = await twoSessions();
    const day = 86_400_000;
    await updateSession(a.session.id, { startedAt: a.session.startedAt - day });
    const set = (await db.sets.where('sessionId').equals(a.session.id).toArray())[0];
    expect(set.at).toBeLessThan(a.session.startedAt - day + 60_000);
  });

  it('a broken date or negative minutes are refused', async () => {
    const { a } = await twoSessions();
    await expect(updateSession(a.session.id, { startedAt: NaN })).rejects.toThrow(/real date/);
    await expect(updateSession(a.session.id, { activeSec: -60 })).rejects.toThrow(/below 0/);
  });

  it('moving a session earlier re-checks records (the later set becomes the first, not a record)', async () => {
    const { a, b, prSet } = await twoSessions();
    await updateSession(b.session.id, { startedAt: a.session.startedAt - 86_400_000 });
    expect((await db.sets.get(prSet.id))!.isPR).toBe(false);
  });

  it('changing the measure re-checks records', async () => {
    const s = await startSession('home');
    await logSet(s.id, 'push_up', { reps: 8, seconds: 30 });
    const second = await logSet(s.id, 'push_up', { reps: 9, seconds: 20 });
    expect(second.isPR).toBe(true);
    await setExerciseMeasures('push_up', ['reps', 'time']);
    expect((await db.sets.get(second.set.id))!.isPR).toBe(false); // time went down: not a beat under rule A
  });

  it('a weigh-in can be moved to a day that already has one (that one is replaced)', async () => {
    await addWeight('2026-11-01', 70);
    await addWeight('2026-11-02', 71);
    const first = (await db.weights.where('date').equals('2026-11-01').toArray())[0];
    await updateWeight(first.id, '2026-11-02', 69.5);
    const live = (await db.weights.toArray()).filter((w) => !w.deleted);
    expect(live).toHaveLength(1);
    expect(live[0]).toMatchObject({ date: '2026-11-02', kg: 69.5 });
  });

  it('a move earned without its equipment is revealed once the equipment is added', async () => {
    await db.locations.bulkPut((await db.locations.toArray()).map((l) => ({ ...l, equipment: ['mat'] }))); // no dumbbells anywhere
    for (let i = 0; i < 6; i++) {
      const s = await startSession('home');
      await logSet(s.id, 'push_up', { reps: 5 });
      const sum = await finishSession(s.id);
      expect(sum.unlocked).not.toContain('db_row'); // db_row unlocks at 6 sessions but needs a dumbbell
    }
    await db.locations.update('home', { equipment: ['mat', 'dumbbell'] });
    const s = await startSession('home');
    await logSet(s.id, 'push_up', { reps: 5 });
    expect((await finishSession(s.id)).unlocked).toContain('db_row');
  });

  it('logging a heavier weight than ever says NEW WEIGHT; switching to "beat any number" re-checks it', async () => {
    const s = await startSession('gym');
    await logSet(s.id, 'db_row', { weightKg: 20, reps: 12 });
    const heavier = await logSet(s.id, 'db_row', { weightKg: 25, reps: 8 });
    expect(heavier).toMatchObject({ isPR: true, newWeight: true });
    await setExerciseTrack('db_row', { kind: 'any' }, ['weight', 'reps']);
    expect((await db.sets.get(heavier.set.id))!.isPR).toBe(false); // rule A: reps went down
  });

  it('after the update, old record flags are checked once against the new rules (and XP follows)', async () => {
    const s = await startSession('gym');
    await logSet(s.id, 'db_row', { weightKg: 20, reps: 10 });
    const heavy = await logSet(s.id, 'db_row', { weightKg: 25, reps: 8 });
    await finishSession(s.id);
    await db.sets.update(heavy.set.id, { isPR: false }); // as v0.2 (rule A) stored it
    await db.meta.delete('recordRules');
    expect(await migrateRecords()).toBe(true);
    expect((await db.sets.get(heavy.set.id))!.isPR).toBe(true);
    expect(await migrateRecords()).toBe(false); // only once
  });

  it('reset deletes training data but keeps places', async () => {
    await twoSessions();
    await resetTrainingData();
    expect((await db.sessions.toArray()).every((x) => x.deleted)).toBe(true);
    expect((await db.sets.toArray()).every((x) => x.deleted)).toBe(true);
    expect((await db.locations.toArray()).filter((l) => !l.deleted)).toHaveLength(2);
  });
});

import { addToPlan, deletePlan, duplicatePlan, importPlan, markPlanViewed, restartRest, savePlan } from './repo';
import { planLastUsed } from '../core/plans';
import { inMode } from '../core/live';
import Dexie from 'dexie';
import { MaxFitDB } from './db';

describe('exercise plans', () => {
  const draft = { name: 'Push day', description: 'Chest', locationId: 'home', items: [{ exerciseId: 'push_up', sets: 3, target: { reps: 12 } }, { exerciseId: 'run_in_place', sets: 1, target: {} }] };

  it('import from Home into Gym is a copy: editing it leaves the original as it was', async () => {
    const orig = await savePlan(draft);
    const copyId = await importPlan(orig, 'gym');
    expect(copyId).not.toBe(orig);
    const copy = (await db.plans.get(copyId))!;
    expect(copy).toMatchObject({ name: 'Push day', locationId: 'gym', lastUsedAt: null });
    await savePlan({ id: copyId, name: 'Gym push', description: '', locationId: 'gym', items: [{ ...copy.items[1] }, { exerciseId: 'push_up', sets: 5, target: { reps: 20 } }] });
    const o = (await db.plans.get(orig))!;
    expect(o.name).toBe('Push day');
    expect(o.locationId).toBe('home');
    expect(o.items).toEqual(draft.items);
  });

  it('duplicate stays in the same place with a "(copy)" name; deleting the copy keeps the original', async () => {
    const orig = await savePlan(draft);
    const dup = await duplicatePlan(orig);
    expect(await db.plans.get(dup)).toMatchObject({ name: 'Push day (copy)', locationId: 'home' });
    expect((await db.plans.get(await duplicatePlan(orig)))!.name).toBe('Push day (copy 2)');
    await deletePlan(dup);
    expect((await db.plans.get(dup))!.deleted).toBe(true);
    expect((await db.plans.get(orig))!.deleted).toBeUndefined();
  });

  it('starting from a plan links the session and sets "last used"; add-to-plan adds once', async () => {
    const id = await savePlan(draft);
    const before = (await db.plans.get(id))!.updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const s = await startSession('home', id);
    expect(s.planId).toBe(id);
    expect(planLastUsed(await db.sessions.toArray()).get(id)).toBe(s.startedAt);
    // Using or viewing a plan never touches its synced row (an edit on another device must win).
    await markPlanViewed(id);
    expect((await db.plans.get(id))!.updatedAt).toBe(before);
    expect((await db.meta.get(`planViewed:${id}`))?.value).toBeGreaterThan(0);
    expect(await addToPlan(id, 'jumping_jack')).toBe(true);
    expect(await addToPlan(id, 'jumping_jack')).toBe(false);
    expect((await db.plans.get(id))!.items.map((i) => i.exerciseId)).toEqual(['push_up', 'run_in_place', 'jumping_jack']);
  });

  it('refuses a plan with no name or no exercises', async () => {
    await expect(savePlan({ ...draft, name: '' })).rejects.toThrow(/name/);
    await expect(savePlan({ ...draft, items: [] })).rejects.toThrow(/at least one/);
  });

  it('plans are in backups and come back on restore; an old backup without plans keeps them', async () => {
    const id = await savePlan(draft);
    const json = await exportAll();
    await deletePlan(id);
    await importAll(json);
    expect((await db.plans.get(id))!.deleted).toBeUndefined();
    const old = JSON.parse(json);
    delete old.plans;
    await importAll(JSON.stringify(old));
    expect((await db.plans.get(id))!.deleted).toBeUndefined(); // a backup from before plans keeps today's plans
  });
});

describe('database upgrade v3 → v4 (plans)', () => {
  it('keeps every row and resets the pull cursor so plans are pulled', async () => {
    const name = 'upgrade-test';
    await Dexie.delete(name);
    const old = new Dexie(name);
    old.version(3).stores({ profile: 'id', locations: 'id, updatedAt', sessions: 'id, startedAt, status, updatedAt', sets: 'id, sessionId, exerciseId, at, updatedAt', weights: 'id, date, updatedAt', meta: 'key', equipment: 'id, updatedAt', photos: 'id, at' });
    await old.open();
    await old.table('sets').put({ id: 'a', sessionId: 's', exerciseId: 'push_up', at: 1, reps: 10, isPR: false, updatedAt: 1 });
    await old.table('meta').bulkPut([{ key: 'pullSeq', value: 42 }, { key: 'lastPush', value: 9 }]);
    old.close();
    const upgraded = new MaxFitDB(name);
    await upgraded.open();
    expect(await upgraded.sets.get('a')).toMatchObject({ reps: 10 });
    expect(await upgraded.meta.get('pullSeq')).toBeUndefined();
    expect((await upgraded.meta.get('lastPush'))?.value).toBe(9);
    expect(await upgraded.plans.count()).toBe(0);
    upgraded.close();
  });
});

describe('auto rest', () => {
  it('a Log while the rest clock runs starts a fresh rest; the earlier rest stays counted', async () => {
    const s = await startSession('home');
    await setMode(s.id, 'rest');
    await db.sessions.update(s.id, { live: { ...(await db.sessions.get(s.id))!.live!, modeStartedAt: Date.now() - 80_000 } });
    await restartRest(s.id);
    const live = (await db.sessions.get(s.id))!.live!;
    expect(live.mode).toBe('rest');
    expect(inMode(live, Date.now())).toBeLessThan(2);
    expect(live.banked.rest).toBeGreaterThanOrEqual(79);
  });
  it('from working, restartRest just switches to rest', async () => {
    const s = await startSession('home');
    await restartRest(s.id);
    expect((await db.sessions.get(s.id))!.live!.mode).toBe('rest');
  });
});
