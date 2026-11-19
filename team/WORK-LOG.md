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

## 2026-11-18 — Round 2 (Renz's answers)
- exercise-scientist (high): 23 new moves, secret prerequisites, goal targets, demo map (41 of 78), sources re-opened where the network allowed.
- Built: faster-time measure + stopwatch input with tenths; equipment-aware reveals/hints/chests; secret prerequisites;
  goal rep/rest targets (Apply in Settings); interval reps on cardio stop; "How to do it" demo sheet.
- Checks: typecheck clean; 74 unit tests; e2e 30/30; balance steady/casual/home (GAME-DESIGN.md).
- Round-2 review (code-reviewer, high): changes requested → fixed: speed challenges now ask for a faster time; base names of
  locked moves never shown; "revealed" list (shown moves stay with a "needs equipment" note; equipment-gated moves are revealed
  at the next session end after the equipment is added); place editor counts all earned moves; empty time box cannot log
  the old target; m:ss parse rejects 1:75 and does not reformat while typing; goal rep line only for weighted moves.
  Not fixed (nit): a running stopwatch is lost if the card closes.
- CI: first signed release build OK (build 11, keystore from secrets). Checks: 77 unit tests, e2e 30/30, balance unchanged.

## 2026-11-18 — Round 3: "How to beat it" (Renz approved; PR #3 merged first)
- Mode any / same; records per weight or distance; NEW WEIGHT records; sprint distance in meters; live target per typed weight.
- Checks: typecheck clean; 81 unit tests; e2e 31/31; balance unchanged.
- Review (code-reviewer, high): pass with fixes → fixed all 5: sprint set edits save the right field (meters, seconds);
  v0.2 "measured by" choices keep "beat any number"; one-time re-check of old record flags after the update
  (meta recordRules = 2); empty sets cannot raise the heaviest-weight mark and cannot be logged in "same" mode;
  old sprints without a distance count as 100 m; the reps box follows the typed weight; "at bodyweight" for 0 kg.
- Checks: 85 unit tests, e2e 31/31.

## 2026-11-18 — Round 4: plans, timer, auto rest, history, grand unlocks, photo "I did", BMI, gender (v0.3.0)
- Brief from the Chief of Staff, cleared by Boss R (deadline now). Built in the order 3 → 2 → 4 → 1 → 5, items 6–8 in parallel.
- maxfit-pm (high): plans (core, Dexie v4, repo, sync skip-and-retry, migration file, backup), Plans UI, plan-only session,
  full-screen timer, Back-to-work FAB + Start set, history (best per day, chart, Last/Best rows on Home/Train/Progress),
  grand reward cards + detection, e2e extended. frontend-dev (medium): photo "I did", BMI animation, gender + female avatar, wording.
- Found by looking at screenshots: the FAB covered "Finish session" (spacer added); laurel leaves scattered (SVG transform vs CSS
  transform-box; fixed); 13+ cards in a row after catch-up (added "Skip the rest"); long equipment text pushed plans down (shortened).
- Checks: typecheck clean; 101 unit tests (16 new); e2e 47/47 (16 new checks); balance steady L15/57, casual L10/35, home L15/56 (no rule change).
- Open: Q28 apply the plans migration to Supabase; Q29 per-plan "how to beat"; Q30 time format.
- Review (code-reviewer, high): changes requested → all fixed: (1) viewing/starting a plan no longer bumps the synced row
  (last used = from sessions; last viewed = this device only); (2) a Log during rest restarts the rest clock + alarm unless
  the timer's Stop started it (restartRest); (3) Settings says when plans are phone-only until the cloud update; (4) a backup
  from before plans keeps today's plans; (5) plans of a deleted place stay importable; (6) timer Cancel after GO asks first,
  44 px; (7) reward cards remembered per session across a reload; (8) an old photo gets its own day's "I did" lines; (9) BMI rAF.
- Checks after fixes: 103 unit tests, e2e 47/47. Re-review (code-reviewer): pass; its nit (timer rest flag kept too long) fixed — the flag now belongs to the timed exercise.

## 2026-11-18 — Round 5: plan builder redo + design pass on every screen (v0.4.0)
- Brief from the Chief of Staff, cleared by Boss R. He rejected the v0.3.0 plan builder (chips with no details) and said the screens are not well designed. New standing rule: design work uses taste-skill + impeccable (CLAUDE.md rule 12).
- Capability gap: neither skill is installed in cloud sessions. I read the published sources (impeccable 4.10.0 Operate mode + craft floor; taste-skill 2.5.1 system/checklist rules) and followed impeccable's "launcher unavailable" path; no downloaded binary was run. The Chief of Staff OK'd this.
- maxfit-pm (high):
  - Design foundation: docs/DESIGN.md, tokens, Lucide icons, Cinzel on the reward card.
  - Train = place + My plans; default Starter plan per place (fixed id, seed row).
  - Exercise picker + config sheet; session, timer and overlay redesign.
  - e2e + `npm run screens`.
- frontend-dev (medium): design pass on Home, Progress, Body, Settings, Summary, photos, place editor, demo, history.
- Review (code-reviewer, high): changes requested → all fixed.
  - Must-fix: confirms were hidden under the full-page editor. Fixed, plus an e2e "on top and tappable" check, proved by reverting the fix once.
  - Also fixed: Starter seeding moved outside write locks; Starter plans after sync and wipe; "how to beat" copy and errors; one live region; focus into the editor; lost .pop/.bar.full; 44 px segments; named icon exports.
  - Re-review: pass.
- Checks: typecheck clean; 110 unit tests (25 new); e2e 56/56; balance unchanged (L15 / 57); 27 screenshots at 412×915 in docs/screens/round5/.
- Chief of Staff screenshot review (impeccable critique): not OK yet → fixed all 6.
  - P1: compact plan editor, so the first exercise row and its + Add show without scrolling (e2e check); description behind "+ Description"; "N added · Review" summary bar; no duplicate header Save.
  - P1: Home's Start opens a plan sheet; no plan-less start anywhere (e2e check).
  - P2: one-option "How to beat it" as plain text; help line "Your best: 12 reps. 13 beats it."
  - P2: Lucide minus/plus on steppers; Finish session neutral (one accent).
  - P3: more bottom padding, plus a real-viewport screenshot (03b).
  - Checks: unit 110, e2e 58/58.
