---
name: game-balance
description: Check and tune MaxFit's game balance - unlock pacing, XP and level curve, avatar stage timing, habit-goal growth and chest odds - using the balance simulator for a steady and a casual player. Use after any change to exercises, unlock rules, XP numbers, levels or chests.
---

# Game balance check

## Run
```bash
npm run balance            # steady: 6 days/week
npm run balance -- casual  # casual: 3 days/week
```
The output shows, per training day: level, avatar stage, daily goal, and what unlocked.

## Targets (design choices, see docs/GAME-DESIGN.md)

| Check | Steady (6/wk) | Casual (3/wk) |
|---|---|---|
| First unlock | day 2 | by session 2–3 |
| Unlocks per day | max 2 | max 2 |
| Habit tier (2) all unlocked | within 2 weeks | within 4–5 weeks |
| Avatar "Fighter" (level 5) | ~day 10 | ~week 6 |
| Avatar "Champion" (level 12) | ~2 months | not before 3 months |
| Daily goal 10 → 45 min | ~6 weeks | ~3 months |

## If a target fails, change one lever at a time
- Pacing: the rule's `count` / `days` / record `value`.
- Levels: `xpForLevel` curve or the `XP` table in `src/core/rules.ts`.
- Goal growth: `HABIT_MET_DAYS` and `step` in `habitTarget`.
Then re-run both profiles, `TZ=Asia/Manila npm test`, and paste the before/after timeline in the report.
