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
progression (8→12 reps, then +2.5 kg), distance +0.1 km (same or more time). Note: with rule A and raw time, a faster run over the same distance is not a record and a slower one is — open question Q19 (pace) for Renz.

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
- One unbroken stretch counts at most 30 min of exercise or rest (4 h for run / walk), so a
  rest left running overnight cannot add hours.
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

## Changes 2026-11-18 (Renz's 8 requests)

- **Science-backed ladder (55 moves, 17 new).** Built by `exercise-scientist` from movement-pattern
  progressions (easier version → harder version). Evidence, sources and grades: `docs/research/EXERCISE-LADDER.md`.
  Day 1 = 4 home moves with no equipment: incline push-up, push-up, run / walk, run in place.
  Session counts in rules stay **[Design choice]** (pacing).
- **Measures.** Each exercise has default measures (main one first); the user can pick any of
  reps / time / distance / weight per exercise (Train → "Measured by", or Progress → 📏).
  **Beat rule A (Renz):** a new record = at least one tracked number up, none down. Targets always
  raise one number and keep the others, so following the target is always a beat.
  Weight + reps: +1 rep up to 12, then +2.5 kg at the same reps. Unlock rules use the default main
  measure, so changing measures never blocks an unlock.
- **Unlocks come from the data.** Unlocked = starters + every rule met by the sessions and sets that
  exist now + chest secrets of sessions that still exist. Deleting wrong data locks again what only that
  data earned; correcting a set keeps an unlock if the corrected value still meets the rule (Renz).
- **Surprises stay hidden.** Locked moves are never named (Progress shows "N surprises waiting";
  hints say "Surprise #1 · To unlock: …" and name only moves you already have).
- **Goal profile.** Goals (lose weight, get lean, build muscle, get stronger, stamina) and focus
  (chest, back, shoulders, arms, core, legs, cardio), any number. Chest secrets: weight =
  1 + 2 × match score (focus match counts 2, goal match 1). Plans: best match first, at most one cardio.
- **Gear** thresholds +2 (6/8/11/15/20/27 unlocks) because day 1 now has 4 starters.

### Balance results (2026-11-18, `npm run balance`, simulated user follows the unlock hints)
| Profile | After 90 days | Old ladder (2026-11-17 sim) |
|---|---|---|
| steady (6 days/week, gym) | level 15, 41 of 50 ladder moves | 28 of 33 |
| casual (3 days/week, gym) | level 10, 27 of 50 | 18 of 33 |
| home (6 days/week, no equipment) | level 15, 43 of 50 (High knees day 62) | — |
High knees gate lowered 120 s → 90 s of run in place **[Design choice]**: at 120 s the home user never
unlocked it in 90 days. Still locked after 90 days are tier 5–6 moves (deadlift, pistol, muscle-up…): intended.

## Round 2 (2026-11-18, Renz's answers)
- **Faster time** is a measure of its own (`speed`): same seconds, lower wins. Sprints and time trials use it;
  any exercise can switch Time ⇄ Faster time in 📏. A run can be distance + time (longer wins) or distance + faster time.
- **78 moves** (73 ladder + 5 secrets): 17 variations of base moves (knee/wide/close-grip push-up, sumo/pause squat,
  reverse/side lunge, high plank, shoulder taps, marching bridge, hip thrust, band pull-apart, scapular pull-up,
  chin-up, bird dog, hollow hold, half burpee) and 6 running variations (100 m sprint, 1 km and 5 km time trials,
  intervals, 12-minute run, incline treadmill walk). Each variation names its base move. All optional: they go
  into the inventory. Day 1 now has 5 starters (knee push-up added).
- **Equipment-aware surprises.** Only moves doable with the equipment of at least one place are revealed,
  hinted, counted or given by a chest. Others stay hidden until that equipment is added to a place.
- **Secrets need their base move** (bear crawl ← plank, wall sit ← squat, superman ← bird dog,
  shadow boxing ← run in place, skater jump ← jumping jack).
- **Goal targets** (`GOAL_TARGETS`): strength 5–8 × 3, 120 s; muscle and lean 8–12 × 3, 90 s; stamina 15–25 × 2, 60 s;
  lose weight 10–15 × 2, 60 s. Per exercise the first picked goal (strength > muscle > lean > stamina > lose weight)
  that the move serves. The rest alarm is only suggested (Settings → Apply), never changed silently.
- **Demos**: 41 moves have 2 public-domain photos (free-exercise-db, Unlicense) bundled in `public/demos/`;
  every move has the avatar doing it and a YouTube search button.

### Balance (round 2, 90 days)
| Profile | Unlocked (of 73 ladder moves) | Most unlocks in one day |
|---|---|---|
| steady (gym) | 57 | 3 |
| casual (gym) | 35 | 4 (day 80) |
| home (no equipment) | 56 | 3 |
High knees stays locked at 90 days in the simulation because the simulated user rarely trains run in place;
a real user who runs in place often reaches 90 s in about 14 practice sessions [Design choice; watch it].

## Round 3: "How to beat it" per exercise (Renz approved, 2026-11-18)
- Two modes, set per exercise in 📏 (default shown there):
  - **Beat any number** (rule A): one tracked number better, none worse. Default for runs, cardio and holds.
  - **Same ___, beat ___**: keep weight or distance fixed, beat reps / longer time / faster time. Records are kept
    **per weight or per distance**. Default for every weight + reps move (same weight, more reps) and for Sprint
    (same distance, faster time; Renz picks the distance, in meters).
- **Heavier weight than ever = a record** ("NEW WEIGHT!"), and it starts that weight's count. If the reps at the
  heavier weight also beat the old reps, it is just as much a record. A first set at a **lighter** weight (or a new
  distance) only starts that level's record — dropping the weight cannot farm records [Design choice].
- The record and "Beat this" follow the weight or distance typed in the card right now.
- When the best reps at a weight reach the top of the goal's rep range, the target is to move up 2.5 kg at the
  bottom of the range (double progression, [Design choice] per docs/research/EXERCISE-LADDER.md).
- Challenges from chests skip "same" moves (one plain number does not fit them).
- Balance unchanged (records do not drive unlock pacing): steady 57, casual 35, home 56 of 73 in 90 days.
