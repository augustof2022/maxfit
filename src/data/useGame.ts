import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { availableExercises, deriveGame, gearFor, habitTarget, levelProgress, avatarStage, dailyTotals } from '../core/rules';
import { db } from './db';

/** Everything the screens need, live from the local database. */
export function useGame() {
  const profile = useLiveQuery(() => db.profile.get('me'), []);
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) ?? [];
  const sets = useLiveQuery(() => db.sets.toArray(), []) ?? [];
  const locations = (useLiveQuery(() => db.locations.toArray(), []) ?? []).filter((l) => !l.deleted);
  const weights = (useLiveQuery(() => db.weights.orderBy('date').toArray(), []) ?? []).filter((w) => !w.deleted);
  const customEquipment = useLiveQuery(() => db.equipment.toArray(), []) ?? [];

  const derived = useMemo(() => {
    if (!profile) return null;
    const now = Date.now();
    const liveSets = sets.filter((s) => !s.deleted);
    const { xp, stats, unlocked, measuresOf } = deriveGame(profile, sessions, liveSets, now);
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
      measuresOf,
      xp,
      goalMin: habitTarget(sessions, profile.habitBaseMin, profile.habitCapMin),
      week: dailyTotals(sessions, 7, now),
      active,
      location,
      available: availableExercises(unlocked, location?.equipment ?? []),
      liveSets,
    };
  }, [profile, sessions, sets, locations]);

  return { profile, sessions, sets, locations, weights, customEquipment, d: derived };
}

export type Game = ReturnType<typeof useGame>;
