---
description: Add a new exercise to the MaxFit unlock ladder (metric, equipment, tier, unlock rule, safe cue) and prove balance
argument-hint: <exercise name and any notes>
---
Add this exercise: $ARGUMENTS

Follow the skill `add-exercise` step by step. Before editing, show the filled card
(id, metric, equipment, tier, unlock rule, cue) and the reason for the tier and rule.
Then edit `src/core/exercises.ts`, run the balance sim for both profiles and the unit tests,
and update the ladder table in `docs/GAME-DESIGN.md`.
