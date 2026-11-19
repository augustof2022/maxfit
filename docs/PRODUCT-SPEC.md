# MaxFit product spec (v0.1 MVP)

**Problem:** Renz is starting to train. He needs a reason to show up every day (habit) and a
clear number to beat every set (progression). Generic loggers do not make this fun.
**User:** Renz first: a beginner, phone at the gym or at home, one hand, between sets.
**Done when (MVP):** the 8 brief items below work in the web app and the end-to-end test passes;
the Android build generates; cloud sync code and schema are ready (applied after Renz's yes).

Status key: ✅ built and tested · 🟡 built, needs a device or Renz's action to verify · ⏳ backlog

| # | Brief item (Renz said, 2026-11-17) | What we built | Test | Status |
|---|---|---|---|---|
| 1 | Game: streaks / records unlock new exercises in levels of difficulty; start with running + push-ups; 2 days in a row unlocks a new one; new benchmark after a record; avatar evolves; surprises | 38-exercise ladder in 6 tiers + 5 secret; unlock rules (streak, sessions, level, record, all/any); XP and levels; 7 avatar stages + 6 gear pieces + colours; mystery chest and surprise challenges | Unit: ladder, unlocks, chest. E2E: 2-day streak unlocks squat; PR shows NEW RECORD | ✅ |
| 2 | See last rep, record and the number to beat; input today's result | Exercise card: Last · Record · **Beat this**, stepper pre-filled with the target | E2E: target 5 → after 10, "Beat 10: do 11" | ✅ |
| 3 | Session tracker with rest marking and rest minutes; cardio run / walk / rest / stop, then km and minutes to beat | Live session clock (active vs rest), auto-rest after each set, Start rest / Back to work; cardio panel with Run, Walk, Rest, Stop → km → pace; best km and best pace records | E2E: rest timer, cardio save | ✅ |
| 4 | Weight and BMI log | Body screen: height, daily weight entry, BMI with WHO category and scale, trend chart, log with delete | E2E: 70 kg / 170 cm → 24.2 Normal | ✅ |
| 5 | Home / gym sessions with available equipment; correct exercises per place | **Equipment library** (Renz, 2026-11-17): 37 built-in items in 5 groups, search, quick-fill (Bodyweight / Home basics / Park / Full gym), add your own items (synced); exercise list filtered by equipment; live "N exercises possible here" | Unit + E2E: curl at Gym, not at Home; new place with custom item | ✅ |
| 6 | Save a location so equipment loads without re-entering | Places: type a name, pick equipment once; "+ New place" also on the Train screen; last-used remembered | E2E: Office gym saved and loaded | ✅ |
| 7 | Habit builder: short sessions, few exercises, daily totals like "last 2 days 15 min, yesterday 20 min" | Starter mode (first 10 sessions, max 3 exercises); daily minute goal 10 → 45 that grows slowly; Home shows today, last 2 days, yesterday, 7-day exercise/rest chart | Unit: habit goal; E2E screenshot | ✅ |
| 8 | Alarms: too much rest, weigh-in, start exercise | Rest alarm (sound + vibration, repeats every 30 s; screen-off alarm in Android app); weekly weigh-in and daily workout reminders (Android: scheduled notifications; web: while open) | E2E: rest-over state. Android alarms need the APK | 🟡 |
| — | Cloud sync with login (Renz's choice) | Email + password login, local-first push/pull, `maxfit_rows` table with RLS | Code + schema ready; waiting for Renz's new Supabase project | 🟡 |
| — | Android APK | Capacitor project in `android/`; GitHub Actions builds a debug APK | APK built in GitHub Actions (run 1, 2026-11-17, success). Alarms still need a real-phone test | 🟡 |
| — | Backup | Export / import JSON | Manual | ✅ |

## Round 4 — v0.3.0 (Boss R's 8 items, 2026-11-18)

| # | Item | What we built | Test | Status |
|---|---|---|---|---|
| R4-1 | Exercise plans per place | Train: plans of the picked place right under "Where are you today?" (name, description, last used, N exercises). Create / edit (name, description, place, unlocked + doable exercises only, sets, target, "How to beat it", reorder, remove), duplicate, delete (asks first), import from another place = a deep COPY. Starting a plan shows only its exercises + "Show all exercises here". Synced table `plans` + in backups | Unit: copy independence (core + database), names, checks, backup, v3→v4 upgrade. E2E: create, reorder, duplicate, delete, import + edit copy, start plan | ✅ (cloud sync of plans 🟡: server migration not applied yet, Q28) |
| R4-2 | Timer for timed exercises | ▶ Start timer → 3 · 2 · 1 · GO! (beeps) → full-screen clock + big STOP; Stop fills the seconds (editable before Log) | E2E: countdown, clock, Stop fills time | ✅ |
| R4-3 | Auto work / rest + "Back to work" FAB | Timer start = working, Stop / Log = resting; rep exercises get a big ▶ Start set; "Back to work" floats bottom-right while resting (red when rest is over); space under Finish so it is never covered | E2E: FAB in view after scrolling, Start set → working, timer → working → resting | ✅ |
| R4-4 | Records and history everywhere | Every exercise row: Last (date) · Best. Tap → history: best set of each day, 🏆 record days, trend chart with record days ringed. Home: "Exercises you've done"; Train: rows with Last/Best; Progress: done list + inventory with history | Unit: best per day (any, same weight, faster time). E2E: history list, record mark, chart, Home list | ✅ |
| R4-5 | Grand unlock moments mid-session | Full-screen bronze/red card with laurel, serif type, rays and shine (still with reduced motion), one at a time, "Skip the rest" when 3+ wait. New exercise: name, cue, "See it and try it…", ＋ Add to plan. Gear and colour: avatar wearing it. Level: big level-up card with the evolution | E2E: mid-session card after a record, add-to-plan from the card | ✅ |
| R4-6 | Photo card "I did" | "I did: Push-up · 25 reps, Plank · 60s" with the best set per exercise; choose all exercises or records only; kept with the photo | E2E: lines saved with the photo; worker screenshots of all 3 looks | ✅ |
| R4-7 | BMI bar animation | Marker slides into place with a soft fill, 1 s; in place with reduced motion | Worker screenshots (settled + mid-slide) | ✅ |
| R4-8 | Gender | Settings → You: Male / Female (synced in the profile). Female avatar: same stages, gear and moves, female body shape and hair, all 3 styles | E2E: Female saved; worker screenshots | ✅ |

## Round 5 — v0.4.0 (Boss R, 2026-11-18: plan builder rejected, screens "not well designed")

| # | Item | What we built | Test | Status |
|---|---|---|---|---|
| R5-1 | Train = place + My plans only | Train shows "Where are you today?" (+ Place) and "My plans at <place>" (+ New plan). Rows: name, description, N exercises, last used, Start. Tap a row → the plan opens (exercises, Edit plan, Duplicate, Delete); Import below the list. The old Starter card and the "You can do here" list are gone | E2E: only 2 sections, Start on rows, Edit plan | ✅ |
| R5-2 | No workout without a plan | Every place gets one real, editable "Starter plan" (fixed id `starter-<place>`, max 3 exercises, seed row with updatedAt 0). New places get one too; a deleted one stays deleted; existing users get it once | Unit: once per place, concurrent runs, delete sticks, new place, editing makes it a normal plan. E2E: Home and a new place | ✅ |
| R5-3 | Exercise picker (row list) | New plan and Edit plan show a list: name, body parts, description, Watch the steps, Last (date), Best, "→ Beat", + Add. + Add → sheet: sets, target, how to beat → back with search + filters kept, row shows "Added". Filters: search, Cardio / body parts, Any / Bodyweight / Equipment. Only unlocked exercises doable at the place | Unit: search, areas, kit, chips. E2E: row contents, every filter, sheet, Added + kept search | ✅ |
| R5-4 | Design pass, every screen | docs/DESIGN.md (from impeccable + taste-skill sources): tokens, one button family, grouped lists, Lucide icons instead of emoji, no eyebrows, 150–250 ms motion, Cinzel only on the reward card | Screenshots of every screen and state at 412×915 in docs/screens/round5/ | ✅ (skills not installable here: followed from source) |

## Out of scope for v0.1 (see `team/BACKLOG.md`)
Exercise images/videos, custom exercises, Play Store release, social features, GPS distance.
