# Memory — maxfit-pm

Lessons this agent has learned. One line each, with the date (YYYY-MM-DD).
Keep under 200 lines. Remove lines that are no longer true.

## Renz's feedback and decisions
- 2026-11-17: Clearance answers: build fresh (no AGPL code), web app + Android APK (Capacitor), cloud sync with login (Supabase), team + working MVP in one session.
- 2026-11-17: Call him "Boss R" in reports. Time zone GMT+8.

## What works / what to avoid
- 2026-11-17: The balance sim caught 3 problems the unit tests missed (goal grew 10→45 min in 25 days; 3 unlocks on one day; casual users locked out of streak-only moves). Run it on every ladder/XP change.
- 2026-11-17: Agent files created mid-session cannot be called as subagent types until the next session. Use general-purpose: "read <agent file> and act as that agent".
- 2026-11-17: Renz's Supabase project is shared with a notes app. Ask before applying migrations; prefix MaxFit objects with maxfit_.
- 2026-11-17: First code review found 10 issues (5 in sync) that 27 unit + 16 e2e tests missed. Always run code-reviewer before calling a feature done, and add tests for every finding.
