---
name: progressive-overload
description: The MaxFit rules for "the number to beat" - how targets grow for reps, holds, weights and distance, how rest limits are set, and which sources back them. Use when changing targets, rest defaults or any training advice shown in the app.
---

# Progressive overload in MaxFit

Code: `nextTarget()` in `src/core/rules.ts`. Sources: `docs/RESEARCH.md`.

| Metric | "Beat this" target | Note |
|---|---|---|
| reps | record + 1 rep | first time: 5 or as many as you can |
| time | record + 5 s | first time: 20 s |
| weight_reps | double progression: same weight +1 rep up to 12, then +2.5 kg and back to 8 reps | heavier always beats lighter |
| distance | record + 0.1 km, or beat best pace (min/km) | first time: 1 km |

- Rest alarm default: 90 s, inside the 1–2 min range ACSM (2009) gives for hypertrophy
  training. User can change it. [Source: docs/RESEARCH.md, ACSM 2009]
- The +1 rep / +5 s / +0.1 km / 2.5 kg step sizes are **[Design choice]**: the smallest
  steps a beginner can feel and the smallest common plate pair. Ask `fitness-coach` before changing.
- Never tell the user to push through pain. Cues stay short and safe.
