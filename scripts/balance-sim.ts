// Game balance simulator. Plays a pretend user through N days and prints when each
// exercise unlocks, the level, avatar stage and the daily goal. Use it after changing
// the ladder (src/core/exercises.ts) or XP numbers (src/core/rules.ts).
//   npm run balance              -> steady user: trains 6 days a week, +1 rep most sessions
//   npm run balance -- casual    -> trains 3 days a week, slower progress
import { EXERCISES, EXERCISE_BY_ID } from '../src/core/exercises';
import { AVATAR_STAGES, avatarStage, buildStats, habitTarget, levelFromXp, newUnlocks, sessionXp, currentStreak } from '../src/core/rules';
import type { Session, WorkSet } from '../src/core/types';

const profile = process.argv[2] === 'casual' ? { daysPerWeek: 3, gain: 0.5 } : { daysPerWeek: 6, gain: 1 };
const DAYS = 90;
const DAY = 86_400_000;
const start = new Date(2026, 0, 5, 18).getTime(); // a Monday

let xp = 0;
let unlocked = EXERCISES.filter((e) => e.unlock.type === 'start').map((e) => e.id);
const sessions: Session[] = [];
const sets: WorkSet[] = [];
const best: Record<string, number> = {};
let id = 0;

const firstVal = (metric: string) => (metric === 'time' ? 20 : metric === 'distance' ? 1 : metric === 'weight_reps' ? 10 : 5);
const step = (metric: string) => (metric === 'time' ? 5 : metric === 'distance' ? 0.1 : metric === 'weight_reps' ? 0.5 : 1);

console.log(`Profile: ${process.argv[2] ?? 'steady'} (${profile.daysPerWeek} days/week)\n`);
console.log('Day  Lvl  Stage      Goal  Unlocked this day');
for (let d = 0; d < DAYS; d++) {
  if (d % 7 >= profile.daysPerWeek) continue;
  const now = start + d * DAY;
  const goal = habitTarget(sessions);
  const sid = `s${id++}`;
  // Do up to 4 unlocked bodyweight/cardio + dumbbell moves (gym access), 2 sets each.
  // Rotate through what this user can do (gym with dumbbells, bar, barbell, bench, treadmill), 4 moves a session.
  const pool = unlocked.filter((x) => !EXERCISE_BY_ID[x].equipment.some((e) => !['dumbbell', 'pullup_bar', 'barbell', 'bench', 'treadmill'].includes(e)));
  const todays = Array.from({ length: Math.min(4, pool.length) }, (_, k) => pool[(sessions.length * 4 + k) % pool.length]).filter((x, i, a) => a.indexOf(x) === i);
  let prs = 0;
  for (const exId of todays) {
    const ex = EXERCISE_BY_ID[exId];
    const prev = best[exId] ?? 0;
    const v = prev ? Math.round((prev + step(ex.metric) * profile.gain) * 10) / 10 : firstVal(ex.metric);
    if (prev && v > prev) prs++;
    best[exId] = Math.max(prev, v);
    for (let k = 0; k < 2; k++) {
      const s: WorkSet = { id: `w${id++}`, sessionId: sid, exerciseId: exId, at: now + k, isPR: false, updatedAt: 0 };
      if (ex.metric === 'reps') s.reps = v;
      if (ex.metric === 'time') s.seconds = v;
      if (ex.metric === 'weight_reps') Object.assign(s, { weightKg: v, reps: 8 });
      if (ex.metric === 'distance') Object.assign(s, { distanceKm: v, durationSec: v * 420 });
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
