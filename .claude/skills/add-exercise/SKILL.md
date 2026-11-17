---
name: add-exercise
description: Add a new exercise to the MaxFit unlock ladder safely - pick metric, equipment, tier and unlock rule, write a safe cue, check the science with fitness-coach, then prove balance with the simulator and tests. Use when adding, moving or changing any exercise.
---

# Add an exercise to MaxFit

## 1. Fill in the card (in `src/core/exercises.ts`)

| Field | How to choose |
|---|---|
| `id` | snake_case, unique, never renamed later (records point to it) |
| `metric` | `reps` (count), `time` (seconds hold), `weight_reps` (kg × reps), `distance` (km, cardio) |
| `equipment` | every item needed, from `EQUIPMENT`. Empty = bodyweight, shows at every location |
| `tier` | 1 Starter · 2 Habit · 3 Builder · 4 Strong · 5 Advanced · 6 Legend · 0 Secret (chest only) |
| `unlock` | see rules below |
| `cue` | one line, safe, plain English. Heavy barbell moves: "start light" / "use a spotter" |

## 2. Pick the unlock rule

- Tier 2 (habit): reward showing up → `sessions`, or `any`[`streak`, `sessions`] so a
  3-days-a-week user can still get it. Never streak-only.
- Tier 3: sessions or a record on a tier 1–2 move.
- Tier 4+: a `record` on an easier move of the same pattern (push → dips, squat → jump squat),
  often `all`[record, sessions] so strength AND experience come first.
- A `record` rule must point to an exercise of the same or lower tier (unit test checks this).
- Secret moves: `{ type: 'secret' }`, tier 0, bodyweight only.

## 3. Check

1. `fitness-coach` confirms the progression order and cue are safe; source in `docs/RESEARCH.md`.
2. `npm run balance` and `npm run balance -- casual`: note the day it unlocks for each.
   Target: no day with 3+ unlocks; tier 2 reachable by a casual user within ~4 weeks.
3. `TZ=Asia/Manila npm test` green. Add a test if the rule type is new.
4. Update the ladder table in `docs/GAME-DESIGN.md`.
