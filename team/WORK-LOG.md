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
- Re-check by code-reviewer: 8/9 fixed, #6 partly → per-mode time caps added (30 min exercise/rest, 4 h run/walk); recent-row re-read now paged; migration adds seq if missing. 43 unit tests, e2e 16/16. First APK built in GitHub Actions.

## 2026-11-17 — Renz's answers + equipment library
- `main` branch created; draft PR #1 opened. New Supabase project to come from Renz. WHO BMI kept. Fair-play rules kept.
- Equipment library: places start with a name; 37 built-in items in 5 groups; search; quick-fill; add your own (synced, backups include them); live "exercises possible here". "+ New place" on Train too.
- Checks: 49 unit tests; e2e 20/20.
- Review of equipment library (code-reviewer, high): no data loss on v1→v2; fixed: deleted item cleaned from places, pull cursor reset on upgrade, double-tap guard, quick-fill adds instead of replacing, 44px touch target. Migration edit OK (never applied); rule added to sync-schema-change skill.

## 2026-11-18 — Renz's 8 requests (one PR)
- Update: native plugin + update bar; CI signs with secrets, versionCode = run number, publishes from main only.
- Measures per exercise (rule A), edit/delete for sets, sessions, weigh-ins, places, photos, all with "are you sure?".
  Unlocks derived from data. "Delete test data" (two questions).
- exercise-scientist (new, high): 55-move ladder with graded sources (docs/research/EXERCISE-LADDER.md).
- Hidden surprises; goals + focus; animated avatar in 3 styles; liquid progress bars, count-up numbers, screen ease-in.
- Progress photos: 3 looks, story/post sizes, save to gallery, share sheet, timeline + compare; phone only.
- Checks: typecheck clean; 64 unit tests; e2e 29/29; balance steady/casual/home run (results in GAME-DESIGN.md).
- Review (code-reviewer, high): pass with fixes. Fixed: session edit refuses NaN dates / negative minutes and re-checks records when moved;
  "Delete test data" stamps resetAt so sync cannot bring old unlocks/colours back; photo-loss warnings (erase, reinstall);
  update URL parsed and checked (host, path, no ".."); Summary uses the user's measures; "Use default" asks first.
  Open for Renz: Q19 (cardio pace), and old unlocks may re-lock under the new ladder (finding 6).
- CI: apk job green on the first push (the new Java compiles). Release signing path untested until the secrets are added.
