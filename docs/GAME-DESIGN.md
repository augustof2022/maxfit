# MaxFit game design

Goal: make showing up feel like a game, then make getting stronger feel like levelling up.
Code: `src/core/exercises.ts` (ladder) and `src/core/rules.ts` (all numbers). Tested in
`src/core/rules.test.ts` and `scripts/balance-sim.ts`.

## Core loop

1. Start a session at a location → only exercises you unlocked **and** have equipment for show.
2. Each exercise shows **Last · Record · Beat this**. Log a set → rest timer starts by itself.
3. Rest too long → alarm. Beat a record → 🏆 and a new, higher target.
4. Finish → XP, level, streak, daily goal, **new unlocks**, and a **mystery chest**.
5. Level-ups evolve the avatar; more unlocks add gear to it.

## Unlock ladder (Renz: "start with running and push-ups; 2 days in a row unlocks a new one")

Unlocks never re-lock. Streak rules use the best streak ever, so a broken streak never takes
anything away. Records = the best single set.

| Tier | Exercise | Needs | Unlock rule |
|---|---|---|---|
| 1 Starter | Push-up | — | day 1 |
| 1 Starter | Run / walk | — | day 1 |
| 2 Habit | Bodyweight squat | — | 2 days in a row |
| 2 Habit | Standing knee raise | — | 3 sessions |
| 2 Habit | Sit-up | — | 4 days in a row OR 7 sessions |
| 2 Habit | Run in place | — | 5 sessions |
| 2 Habit | Plank | — | push-up record 12 |
| 3 Builder | Lunge | — | 6 days in a row OR 12 sessions |
| 3 Builder | Glute bridge | — | 8 sessions |
| 3 Builder | Mountain climber | — | plank record 45 s |
| 3 Builder | Burpee | — | level 5 |
| 3 Builder | Jump rope | jump rope | 10 sessions |
| 3 Builder | Dumbbell curl | dumbbells | 6 sessions |
| 3 Builder | Dumbbell shoulder press | dumbbells | 12 sessions |
| 3 Builder | Dumbbell row | dumbbells | 14 sessions |
| 3 Builder | Treadmill run | treadmill | 9 sessions |
| 3 Builder | Stationary bike | bike | 11 sessions |
| 4 Strong | Pull-up | pull-up bar | push-up record 20 |
| 4 Strong | Diamond push-up | — | push-up record 25 |
| 4 Strong | Jump squat | — | squat record 30 |
| 4 Strong | Goblet squat | dumbbells | squat record 20 |
| 4 Strong | Dips | dip bars | push-up record 25 |
| 4 Strong | Bench press | barbell + bench | 15 sessions + push-up record 15 |
| 4 Strong | Barbell back squat | barbell | 15 sessions + squat record 25 |
| 4 Strong | Leg press | leg press | 16 sessions |
| 4 Strong | Lat pulldown | cable machine | 18 sessions |
| 5 Advanced | Deadlift | barbell | level 10 + (5 days in a row OR 40 sessions) |
| 5 Advanced | Barbell overhead press | barbell | level 12 |
| 5 Advanced | Pistol squat (assisted ok) | — | jump squat record 20 |
| 5 Advanced | Hanging leg raise | pull-up bar | knee raise record 30 + plank record 90 s |
| 5 Advanced | Archer push-up | — | diamond push-up record 20 |
| 6 Legend | Muscle-up | pull-up bar | pull-up record 12 |
| 6 Legend | Wall handstand push-up | — | level 20 + push-up record 40 |
| Secret | Bear crawl, Wall sit, Superman hold, Shadow boxing, Skater jump | — | mystery chest only |

Why this order **[Design choice]**: tier 2 rewards *showing up* (habit first); tier 3 adds
volume and the first equipment; tier 4+ is gated by *records* on the easier version of the same
movement, so strength comes before the harder move. Exercise order to be confirmed by
`fitness-coach` (see `docs/RESEARCH.md`).

## Records and "beat this"

See `.claude/skills/progressive-overload/SKILL.md`. Reps +1, holds +5 s, weights by double
progression (8→12 reps, then +2.5 kg), distance +0.1 km or a faster pace.

## XP and levels

| Source | XP |
|---|---|
| Each set | 10 |
| Each new record | 25 |
| Finishing a session | 20 |
| Each active minute | 1 |
| Streak bonus (first session of the day only) | 5 per streak day, max 50 |
| Daily goal met (once, in the session that reaches it) | 30 |
| Surprise challenge beaten | 100 |
| Mystery chest (sometimes) | 20–60 |

Total XP to reach level n = 100 · n · (n − 1). L2 = 200, L5 = 2,000, L10 = 9,000, L20 = 38,000.

Fair-play rules (from the code review, 2026-11-17) **[Design choice; Q6 for Renz]**:
- A session needs at least one logged set (or a run) to finish. Empty sessions can only be discarded,
  so they never count toward "N sessions" unlocks or open a chest.
- Streak and daily-goal bonuses are paid once per day, not per session.
- A session left open with no activity for 30+ minutes ends 1 minute after the last activity.
- Total XP is the sum of each session's XP (not a stored counter), so two devices can never
  overwrite each other's XP.

## Avatar evolution

| Stage | From level | | Gear | Unlocked exercises |
|---|---|---|---|---|
| Rookie | 1 | | Headband | 4 |
| Trainee | 3 | | Wristbands | 6 |
| Fighter | 5 | | Lifting belt | 9 |
| Warrior | 8 | | Cape | 13 |
| Champion | 12 | | Power aura | 18 |
| Titan | 17 | | Crown | 25 |
| Legend | 25 | | | |

The body grows wider and more defined each stage. Colours come from chests. The avatar art is
original SVG (`src/components/Avatar.tsx`).

## Surprises

After every session: a **mystery chest** (seeded random, so it is testable). Rewards:
bonus XP, a new avatar colour, a **secret exercise**, or a **surprise challenge**
("hit your record + 2 reps for +100 XP"). A session with a new record makes non-XP rewards more likely.

## Habit builder (Renz: "short and few exercises only for building habit")

- **Starter mode** for the first 10 sessions: a plan of at most 3 exercises, 2 sets each
  (1 round for cardio).
- **Daily goal** in minutes (exercise + rest) starts at 10, grows by 5 after every 5 days you
  meet it, up to 45 (both settable). Rest days do not reset the count; a missed week does.
  Reason: consistency matters more than perfection (Lally et al. 2010, `docs/RESEARCH.md`).
- **Home** shows today vs goal, "last 2 days" and "yesterday" totals, and a 7-day chart split
  into exercise and rest minutes.

## Balance results (2026-11-17, `npm run balance`)

| Milestone | Steady (6 days/week) | Casual (3 days/week) |
|---|---|---|
| First unlock | day 2 (squat) | day 2 (squat) |
| Max unlocks in one day | 2 | 2 |
| Level 5 / Fighter | day 10 | day 17 |
| Level 12 / Champion | day 54 | not reached in 90 days (level 10) |
| Daily goal reaches 45 min | day 41 | day 80 |
| Unlocked after 90 days | 28 of 33 non-secret | 18 of 33 non-secret |

Before rebalancing, the sim showed the goal reaching 45 min in 25 days and Champion at day 23,
and casual players could never unlock streak-only moves. All three were fixed.
