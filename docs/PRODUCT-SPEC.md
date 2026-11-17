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
| 5 | Home / gym sessions with available equipment; correct exercises per place | Locations with kind + 13 equipment items; exercise list filtered by equipment | Unit + E2E: curl at Gym, not at Home | ✅ |
| 6 | Save a location so equipment loads without re-entering | Saved locations (Home, Gym seeded), last-used remembered | E2E | ✅ |
| 7 | Habit builder: short sessions, few exercises, daily totals like "last 2 days 15 min, yesterday 20 min" | Starter mode (first 10 sessions, max 3 exercises); daily minute goal 10 → 45 that grows slowly; Home shows today, last 2 days, yesterday, 7-day exercise/rest chart | Unit: habit goal; E2E screenshot | ✅ |
| 8 | Alarms: too much rest, weigh-in, start exercise | Rest alarm (sound + vibration, repeats every 30 s; screen-off alarm in Android app); weekly weigh-in and daily workout reminders (Android: scheduled notifications; web: while open) | E2E: rest-over state. Android alarms need the APK | 🟡 |
| — | Cloud sync with login (Renz's choice) | Email + password login, local-first push/pull, `maxfit_rows` table with RLS | Code + schema ready; not applied to Supabase yet (needs Renz's yes, Q1) | 🟡 |
| — | Android APK | Capacitor project in `android/`; GitHub Actions builds a debug APK | APK built in GitHub Actions (run 1, 2026-11-17, success). Alarms still need a real-phone test | 🟡 |
| — | Backup | Export / import JSON | Manual | ✅ |

## Out of scope for v0.1 (see `team/BACKLOG.md`)
Exercise images/videos, custom exercises, Play Store release, social features, GPS distance.
