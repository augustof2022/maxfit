// Game balance simulator. Plays a pretend user through N days and prints when each
// exercise unlocks, the level, avatar stage and the daily goal. Use it after changing
// the ladder (src/core/exercises.ts) or XP numbers (src/core/rules.ts).
//   npm run balance              -> steady user: trains 6 days a week, +1 rep most sessions
//   npm run balance -- casual    -> trains 3 days a week, slower progress
//   npm run balance -- home      -> steady, but only at home with no equipment (Renz's usual case)
import { EXERCISES, EXERCISE_BY_ID } from '../src/core/exercises';
import { AVATAR_STAGES, avatarStage, buildStats, habitTarget, levelFromXp, newUnlocks, nextUnlockHints, sessionXp, currentStreak } from '../src/core/rules';
import type { UnlockRule } from '../src/core/types';
import type { Measure, Session, WorkSet } from '../src/core/types';

const mode = process.argv[2] ?? 'steady';
const profile = mode === 'casual' ? { daysPerWeek: 3, gain: 0.5 } : { daysPerWeek: 6, gain: 1 };
// Gym access for steady/casual; nothing for home.
const GYM = ['dumbbell', 'pullup_bar', 'barbell', 'bench', 'treadmill', 'resistance_band', 'squat_rack', 'cable_machine', 'dip_bars', 'jump_rope', 'ab_wheel'];
const EQUIP = mode === 'home' ? [] : GYM;
const DAYS = 90;
const DAY = 86_400_000;
const start = new Date(2026, 0, 5, 18).getTime(); // a Monday

let xp = 0;
let unlocked = EXERCISES.filter((e) => e.unlock.type === 'start').map((e) => e.id);
const sessions: Session[] = [];
const sets: WorkSet[] = [];
const best: Record<string, number> = {};
let id = 0;

const firstVal = (m: Measure) => (m === 'time' ? 20 : m === 'distance' ? 1 : m === 'weight' ? 10 : 5);
const step = (m: Measure) => (m === 'time' ? 5 : m === 'distance' ? 0.1 : m === 'weight' ? 0.5 : 1);
const done: Record<string, number> = {};

console.log(`Profile: ${mode} (${profile.daysPerWeek} days/week, equipment: ${EQUIP.length ? 'gym' : 'none'})\n`);
console.log('Day  Lvl  Stage      Goal  Unlocked this day');
for (let d = 0; d < DAYS; d++) {
  if (d % 7 >= profile.daysPerWeek) continue;
  const now = start + d * DAY;
  const goal = habitTarget(sessions);
  const sid = `s${id++}`;
  // Do up to 4 unlocked bodyweight/cardio + dumbbell moves (gym access), 2 sets each.
  // Rotate through what this user can do (gym with dumbbells, bar, barbell, bench, treadmill), 4 moves a session.
  const pool = unlocked.filter((x) => EXERCISE_BY_ID[x].equipment.every((e) => EQUIP.includes(e)));
  // Like a real user who reads the "next unlock" hints: up to 2 moves named in the closest record gates,
  // then fill to 4 by rotating through everything else.
  const recIds = (r: UnlockRule): string[] => (r.type === 'record' ? [r.exerciseId] : r.type === 'all' || r.type === 'any' ? r.rules.flatMap(recIds) : []);
  const hinted = [...new Set(nextUnlockHints(unlocked, buildStats(sessions, sets, xp, now), 4).flatMap((h) => recIds(h.exercise.unlock)))].filter((x) => pool.includes(x)).slice(0, 2);
  const rest = pool.filter((x) => !hinted.includes(x));
  const todays = [...hinted, ...Array.from({ length: Math.min(4 - hinted.length, rest.length) }, (_, k) => rest[(sessions.length * 4 + k) % rest.length])].filter((x, i, a) => a.indexOf(x) === i);
  let prs = 0;
  for (const exId of todays) {
    const ex = EXERCISE_BY_ID[exId];
    const prev = best[exId] ?? 0;
    const main = ex.measures[0];
    const v = prev ? Math.round((prev + step(main) * profile.gain) * 10) / 10 : firstVal(main);
    if (prev && v > prev) prs++;
    best[exId] = Math.max(prev, v);
    done[exId] = (done[exId] ?? 0) + 1;
    for (let k = 0; k < 2; k++) {
      const s: WorkSet = { id: `w${id++}`, sessionId: sid, exerciseId: exId, at: now + k, isPR: false, updatedAt: 0 };
      if (main === 'reps') s.reps = v;
      if (main === 'time') s.seconds = v;
      // Weighted moves: reps climb 8 -> 12 (double progression), so rep-based gates can be met.
      if (main === 'weight') Object.assign(s, { weightKg: v, reps: Math.min(12, 8 + Math.floor(done[exId] * profile.gain / 2)) });
      if (main === 'distance') Object.assign(s, { distanceKm: v, durationSec: v * 420 });
      sets.push(s);
    }
  }
  const minutes = goal + 2;
  sessions.push({ id: sid, startedAt: now, endedAt: now + minutes * 60_000, locationId: null, status: 'done', activeSec: minutes * 45, restSec: minutes * 15, xpEarned: 0, prs, live: null, updatedAt: 0 });
  xp += sessionXp({ sets: todays.length * 2, prs, activeSec: minutes * 45, streak: currentStreak(sessions, now), habitMet: true }) + 25; // + average mystery chest XP
  const stats = buildStats(sessions, sets, xp, now);
  const fresh = newUnlocks(unlocked, stats);
  unlocked = [...unlocked, ...fresh];
  const lvl = levelFromXp(xp);
  console.log(`${String(d + 1).padStart(3)}  ${String(lvl).padStart(3)}  ${AVATAR_STAGES[avatarStage(lvl)].name.padEnd(9)}  ${String(goal).padStart(3)}m  ${fresh.map((x) => EXERCISE_BY_ID[x].name).join(', ')}`);
}
const never = EXERCISES.filter((e) => e.unlock.type !== 'secret' && !unlocked.includes(e.id)).map((e) => e.name);
console.log(`\nAfter ${DAYS} days: level ${levelFromXp(xp)}, ${unlocked.length} unlocked. Still locked: ${never.join(', ') || 'none'}`);
