# Research and sources

Every fitness, health or market fact used in MaxFit is listed here with its source.
Checked on 2026-11-17 (GMT+8). "Opened" = we read the page itself. "Search only" = the fact
came from a web-search summary; the page itself was blocked or not opened. Re-check those.

## 1. Open-source apps we looked at (Renz asked: "search for an open web app or Android app")

| App | What it is | License | Fit for MaxFit | Source |
|---|---|---|---|---|
| wger (Flutter app) | Workout, weight and diet tracker; Flutter app on a Django server; ~996 stars | AGPL-3.0 (with app store exception) | Mature tracker, but no game layer. AGPL would force MaxFit to stay AGPL if we copy code | [github.com/wger-project/flutter](https://github.com/wger-project/flutter) (opened) |
| Liftosaur | Weightlifting PWA (Preact + TypeScript), auto progression scripted in "Liftoscript", rest timers, shows last results; ~782 stars | AGPL-3.0 | Best idea source for "last result to beat" and progression rules. AGPL | [github.com/astashov/liftosaur](https://github.com/astashov/liftosaur) (opened) |
| workout.cool | Next.js + PostgreSQL workout planner with exercise database; ~8.7k stars | MIT | Big web stack (server + Postgres), no game layer | [github.com/Snouzy/workout-cool](https://github.com/Snouzy/workout-cool) (opened) |
| Bati — Fitness RPG | Expo / React Native + SQLite fitness RPG: village buildings rise as you train, boss fights, GPS expeditions; ~57 stars | MIT (code); art CC BY-SA 4.0 | Closest "game" idea, but its game is a village builder, not avatar evolution or exercise unlocks | [github.com/Guiforge/bati](https://github.com/Guiforge/bati) (opened) |
| free-exercise-db | 800+ exercises as JSON with equipment, level, muscles, images | The Unlicense (public domain) | Good future import for a bigger exercise list | [github.com/yuhonas/free-exercise-db](https://github.com/yuhonas/free-exercise-db) (opened) |
| openGym | Self-hosted gym tracker, React PWA + Capacitor Android | AGPL v3 (per a mirror) | Same stack idea as ours; AGPL | [noted.lol/opengym](https://noted.lol/opengym/) (search only) |
| Lyftr | Gym tracker with Android APK | MIT | PWA only planned | [github.com/Cawlumm/lyftr](https://github.com/Cawlumm/lyftr/wiki) (search only) |
| LibreFit | Native Android tracker on IzzyOnDroid | GPL-3.0-or-later | Android only | [apt.izzysoft.de](https://apt.izzysoft.de/fdroid/index/apk/org.librefit.app?repo=main) (search only) |
| Habitica | Habit RPG with avatar levels | MIT (per search) | Habits and to-dos, not exercise | [github.com/Habitica-App](https://github.com/Habitica-App) (search only) |

**Decision (Renz, 2026-11-17):** build fresh, borrow ideas only, no AGPL code.
None of the apps above has an exercise unlock ladder with avatar evolution.

## 2. Training science

| Fact used in MaxFit | Where in the app | Source | Status |
|---|---|---|---|
| For hypertrophy-style training, rest 1–2 minutes between sets; multiple sets, moderate speed | Rest alarm default 90 s; Settings hint | ACSM position stand, "Progression models in resistance training for healthy adults", *Med Sci Sports Exerc* 2009 — [PubMed 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/); copy at [sfu.ca](https://sfu.ca/~ryand/kin343/ACSMresistance.pdf) | Search only (pubmed blocked in this session) |
| A newer ACSM resistance-training position stand (2026) updated the 2009 guidance, including rest intervals | Not used yet | [exrx.net guidelines](https://exrx.net/WeightTraining/Guidelines.html), [Medical News Today](https://www.medicalnewstoday.com/amp/articles/new-resistance-training-guidelines-debunk-myths-stronger-muscles-strength-size) | **[Not checked]** — exact numbers not found. Open question Q4 |
| Progressive overload: increase the demand (reps, load) step by step | "Beat this" target | ACSM 2009 (as above) | Search only |
| Step sizes: +1 rep, +5 s, +0.1 km, +2.5 kg; rep range 8–12 | `nextTarget()` | **[Design choice]** — smallest steps a beginner can feel; 2.5 kg = smallest common plate pair | Ask `fitness-coach` before changing |

## 3. Body measures

| Fact | Where | Source | Status |
|---|---|---|---|
| BMI = weight (kg) ÷ height (m)² | Body screen | WHO fact sheet "Obesity and overweight" — [who.int](https://www.who.int/news-room/fact-sheets/detail/obesity-and-overweight) | Search only (who.int blocked in this session) |
| Adult overweight = BMI ≥ 25; obesity = BMI ≥ 30 | `bmiCategory()` | WHO fact sheet (as above) | Search only |
| Underweight < 18.5; normal 18.5–24.9 | `bmiCategory()` | WHO-linked tables, e.g. [WHO NLiS](https://www.who.int/data/nutrition/nlis/info/malnutrition-in-women) | Search only |
| BMI is a rough guide; it may not match the same fatness in different people | Body screen note | WHO fact sheet (as above) | Search only |

Note: some Asian-population BMI cut-offs differ from the WHO general ones. MaxFit uses the
WHO general cut-offs (Renz said, 2026-11-17).

## 4. Habit science

| Fact | Where | Source | Status |
|---|---|---|---|
| In one study, time to reach habit "automaticity" had a median of 66 days (range 18–254) | Starter mode length, slow goal growth | Lally et al., "How are habits formed", *Eur J Soc Psychol* 2010 — summary at [BPS Research Digest](https://bps.org.uk/research-digest/how-form-habit), [UCL blog](https://blogs.ucl.ac.uk/bsh/2012/06/29) | Search only |
| Missing one opportunity did not significantly affect habit formation | Streak survives until end of next day; rest days do not reset the habit goal | Lally et al. 2010 (as above) | Search only |
| The 66 days comes from the 39 participants whose data fit the model; small study | Caution in docs | [thebehavioralscientist.com](https://www.thebehavioralscientist.com/articles/how-long-to-form-a-habit) | Search only |

## 5. Platform facts

| Fact | Source |
|---|---|
| Capacitor Local Notifications can schedule by weekday/hour/minute (`schedule.on`) and `allowWhileIdle` | `node_modules/@capacitor/local-notifications/dist/esm/definitions.d.ts` (opened) |
| The plugin declares POST_NOTIFICATIONS, SCHEDULE_EXACT_ALARM, RECEIVE_BOOT_COMPLETED, WAKE_LOCK | `node_modules/@capacitor/local-notifications/android/src/main/AndroidManifest.xml` (opened) |
| Web apps cannot fire scheduled alarms when closed; MaxFit's web build shows reminders only while open | **[Design choice]** based on the above; Android app used for real alarms |
