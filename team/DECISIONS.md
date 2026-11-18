# Decisions

| Date | Decision | Options considered | Who | Why |
|---|---|---|---|---|
| 2026-11-17 | Build fresh; borrow ideas only | Fork wger/Liftosaur (AGPL), fork Bati (MIT), build fresh | Renz (clearance) | No AGPL limits; no existing app has the unlock ladder + avatar |
| 2026-11-17 | Web app + Android APK via Capacitor | PWA only, native Android, PWA + Capacitor | Renz | One codebase; real scheduled alarms in the APK |
| 2026-11-17 | Cloud sync with login (Supabase) | Phone only + backup file, cloud sync | Renz | Multi-device and cloud backup. App stays local-first so it works offline |
| 2026-11-17 | Team + working MVP this session | Team + plan only | Renz | — |
| 2026-11-17 | Rebalanced XP (100·n·(n−1), PR 25), habit goal +5 min per 5 met days, `any` unlock rules | Keep first numbers | maxfit-pm + game-designer | Balance sim showed goal 10→45 min in 25 days, Champion at day 23, casual users locked out |
| 2026-11-17 | New Supabase project just for MaxFit | Share the notes-app project | Renz | Keeps MaxFit data separate |
| 2026-11-17 | `main` branch created; work merges through PRs | No main | Renz | A PR needs a base branch |
| 2026-11-17 | Equipment library: name a place, pick from 37 built-in items in 5 groups, add your own items (synced) | Fixed checklist of 13 items | Renz | Gyms differ; type once, reuse everywhere |
| 2026-11-17 | Keep WHO BMI ranges; keep fair-play rules; many short sessions each count | Asian BMI cut-offs; stricter session rule | Renz | — |
| 2026-11-18 | Beat rule A: one number up, none down | B main only; C combined score | Renz | Simple and fair; targets always satisfy it |
| 2026-11-18 | Unlocks derived from data (deleted data locks again) | Keep "never re-lock" | Renz | Test data and wrong entries must be fixable |
| 2026-11-18 | Locked exercises hidden; nameless hints | Show all with lock icons | Renz | Surprise |
| 2026-11-18 | Progress photos on the phone only | Also cloud | Renz | Cloud space; personal device |
| 2026-11-18 | New agent `exercise-scientist` (high) | Raise fitness-coach effort; borrow My Staffs researcher | Renz | Everything training-related science-backed |
| 2026-11-18 | Fixed APK signing key in GitHub secrets; version = run number; publish from main only | Keep debug key | Renz | In-app "Update" needs the same key every build |
| 2026-11-18 | Avatar: one jointed figure, 3 styles (athlete, neon line, buddy), CSS motion | Lottie/Rive files | maxfit-pm | No art files needed; same moves in every style; light |
| 2026-11-18 | "Faster time" as its own measure (lower wins) | A per-exercise flag | maxfit-pm | Works with the measure picker and rule A with no extra settings |
| 2026-11-18 | Surprises only for equipment in Renz's places | Reveal all | Renz | "Don't surprise-add an exercise I can't do" |
| 2026-11-18 | Demos = public-domain photos + avatar + YouTube search | Avatar only; hand-picked video links | maxfit-pm | Clear, offline, no broken or made-up links |
| 2026-11-18 | "How to beat it" per exercise: any (rule A) or same weight/distance (records per level; heavier = record) | Rule A only; one combined score | Renz | A heavier weight lowers reps; that must count as progress |
| 2026-11-18 | One Sprint exercise; the user picks the distance; best time per distance | Fixed 100 m | Renz (Q25) | Any distance, own records |
