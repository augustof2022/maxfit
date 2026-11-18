import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { availableExercises, deriveGame, fitsEquipment, gearFor, habitTarget, levelProgress, avatarStage, dailyTotals, ownedEquipment, visibleUnlocks } from '../core/rules';
import type { Exercise } from '../core/types';
import { db } from './db';

/** Everything the screens need, live from the local database. */
export function useGame() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const sets = useLiveQuery(() => db.sets.toArray(), []) ?? [];
  const locations = (useLiveQuery(() => db.locations.toArray(), []) ?? []).filter((l) => !l.deleted);
  const weights = (useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []).filter((w) => !w.deleted);
  const customEquipment = useLiveQuery(() => db.equipment.toArray(), []) ?? [];
  const plans = (useLiveQuery(() => db.plans.toArray(), []) ?? []).filter((x) => !x.deleted);

  const derived = useMemo(() => {
    if (!profile) return null;
    const now = Date.now();
    const liveSets = sets.filter((s) => !s.deleted);
    const { xp, stats, unlocked: unlockedAll, measuresOf, beatOf } = deriveGame(profile, sessions, liveSets, now);
    // Only moves the user can do with equipment from any of their places are shown (Renz, 2026-11-18).
    // Others stay hidden until that equipment is added to a place.
    const owned = ownedEquipment(locations);
    const canDo = (e: Exercise) => fitsEquipment(e, owned);
    const unlocked = visibleUnlocks(unlockedAll, canDo, profile.revealed);
    const lp = levelProgress(xp);
    const active = sessions.find((s) => s.status === 'active' && !s.deleted) ?? null;
    const location = locations.find((l) => l.id === (active?.locationId ?? profile.lastLocationId)) ?? locations[0] ?? null;
    return {
      stats,
      level: lp.level,
      xpInto: lp.into,
      xpNeed: lp.need,
      stage: avatarStage(lp.level),
      gear: gearFor(unlocked.length),
      unlocked,
      unlockedAll,
      owned,
      canDo,
      measuresOf,
      beatOf,
      xp,
      goalMin: habitTarget(sessions, profile.habitBaseMin, profile.habitCapMin),
      week: dailyTotals(sessions, 7, now),
      active,
      location,
      available: availableExercises(unlocked, location?.equipment ?? []),
      liveSets,
    };
  }, [profile, sessions, sets, locations]);

  return { profile, sessions, sets, locations, weights, customEquipment, plans, d: derived };
}

export type Game = ReturnType<typeof useGame>;
