---
name: ui-review
description: Review a MaxFit screen for gym use - one-handed, mid-set, sweaty - using phone screenshots; checks the number-to-beat hierarchy, touch targets, states, copy, contrast and motion. Use for any new or changed screen.
---

# UI review (phone, gym context)

1. Get screenshots at 390×844 (`npm run e2e` or a Playwright script). Look at each state.
2. Check, and write pass/fail with the screenshot name:
   - The one number that matters (target / rest timer) is the biggest thing on screen.
   - Main action is a full-width button in thumb reach. Targets ≥ 44 px.
   - Labels + units on every number. Colour is never the only signal.
   - States exist: first day (empty), active, rest, rest over, PR, unlock, offline, error.
   - Copy is simple English, encouraging, short. No shaming for missed days.
   - Motion is short and respects reduced motion.
3. Give at most 7 findings, ranked, each with the fix.
