# Work log

## 2026-11-17 — v0.1 MVP
- Research: 9 open-source apps compared (docs/RESEARCH.md). Renz chose build fresh, PWA + APK, Supabase sync.
- Built: game engine, 38 exercises in 6 tiers + secrets, 5 screens, session/rest/cardio timers,
  weight + BMI, locations + equipment, habit builder, alarms/reminders, Supabase sync, backup.
- Team: maxfit-pm + 8 workers, 7 skills, plugin `maxfit-devkit` (5 commands + balance hook).
- Checks: typecheck clean; 27 unit tests pass; e2e 16/16 pass; balance sim run for steady + casual;
  Android project generates (Gradle build runs in CI).
- Code review (code-reviewer via general-purpose, high): 10 findings — new device could reset progress,
  server overwrote newer rows, pull paging could skip rows, restore never synced, two accounts could mix,
  forgotten sessions inflated XP, empty sessions farmed unlocks, double-tap Start, non-atomic Finish,
  cardio Cancel without asking. All fixed; 12 new tests (39 total); SQL checked in PGlite.
