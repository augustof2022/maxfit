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
- 2026-11-18: Balance sim with a "dumb rotation" user hid record-gated moves forever; a sim user that follows the unlock hints is the realistic test. Keep both in mind.
- 2026-11-18: Background research agent + coding in parallel saved the most time; give it a strict output table format so it converts straight into exercises.ts.
- 2026-11-18: Debug APKs built in CI get a new random key each run, so they can never update each other. Any update feature needs a fixed key in secrets first.
- 2026-11-18: When a stored list becomes derived (unlocks), check the sync merge too: a union merge silently undoes resets.
- 2026-11-18: Renz is phone-first: answer "where does X go" with the exact GitHub/Supabase menu path and exact names; say when no file is needed.
- 2026-11-18: Generating code from the scientist's markdown tables: insert extra fields at the END of each object line (a lazy regex matched the unlock object's "}," first).
