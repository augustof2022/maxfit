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

## 6. Exercise ladder and goals (2026-11-18)

Added by `exercise-scientist`. Full write-up and the proposed ladder: `docs/research/EXERCISE-LADDER.md`.
(Numbered 6 because sections 4 and 5 already exist.) The network blocked acsm.org, pacompendium.com
and pmc.ncbi.nlm.nih.gov in this session, so every row was search only in round 1. Round 2 (2026-11-18) opened WHO, Kikuchi, Scoubeau and the Compendium; their Status now says "Opened". Grades: A = position
stand / guideline / meta-analysis; B = single study or standard reference; C = coaching convention
or biomechanics only.

| Fact | Where used | Source | Status | Grade |
|---|---|---|---|---|
| Train all major muscle groups ≥2 days/week; strength: ≥80% 1RM, 2–3 sets, early in session, ≥2 sessions/week; muscle size: ~10 sets per muscle group per week; failure, machines vs free weights and periodization not consistently important | Goal table; balanced base in goal profile | Currier BS et al., ACSM position stand, *Med Sci Sports Exerc* 2026;58(4):851–872 — [ACSM news](https://acsm.org/resistance-training-guidelines-update-2026/), [Newswise](https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years) | Search only. Rest-interval advice **[Not checked]** (Q4 still open) | A |
| Novices: 8–12 RM loads, 2–3 days/week; multi-joint moves give best overall strength gains; 2–3 min rest between multiple sets; muscular endurance: 40–60% 1RM, >15 reps, <90 s rest | Goal table; db_row before db_curl | ACSM 2009, [PubMed 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/) | Search only | A |
| Muscle growth is similar with low or high loads when sets go near failure; heavy loads give more 1RM strength | Bodyweight ladder logic; goal table | Schoenfeld et al., *J Strength Cond Res* 2017 — [PubMed 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) | Search only | A |
| Muscular adaptations occur across a wide spectrum of loading zones | Same | Schoenfeld et al., *Sports* 2021;9(2):32 — [VU repository](https://vuir.vu.edu.au/42418/) | Search only | A/B (narrative review) |
| More weekly sets → more muscle growth, shown up to ~10 sets per muscle per week | Goal table | Schoenfeld, Ogborn, Krieger, *J Sports Sci* 2017 — [PDF copy](https://paulogentil.com/pdf/Dose-response%20relationship%20between%20weekly%20resistance%20training%20volume%20and%20increases%20in%20muscle%20mass%20-%20A%20systematic%20review%20and%20metaanalysis.pdf) | Search only | A |
| Rest >60 s gives a small extra muscle gain; no clear difference beyond 90 s | Supports 90 s rest default | Singer, Schoenfeld et al., *Front Sports Act Living* 2024 — [Frontiers](https://www.frontiersin.org/articles/10.3389/fspor.2024.1429789/full) | Search only | A |
| Push-ups at a matched load build muscle and bench strength like the bench press (18 untrained men, 8 weeks) | Push-up chain as a real muscle builder | Kikuchi & Nakazato, *J Exerc Sci Fit* 2017;15(1):37–42 — [PMC5812864](https://pmc.ncbi.nlm.nih.gov/articles/PMC5812864) | Opened 2026-11-18: push-ups adjusted (e.g. kneeling) to 40% 1RM, 3 sets to failure, 2-min rest, 2×/week, 8 weeks | B |
| Progressive push-up training increased bench strength like bench training (23 moderately trained men, 4 weeks) | Same | Kotarsky et al., *J Strength Cond Res* 2018 — [PubMed 29466268](https://pubmed.ncbi.nlm.nih.gov/29466268/) | Search only | B |
| Push-up load as % body mass: hands on 61 cm box ≈41%, knees ≈49%, floor ≈64%, feet on 30 cm ≈70%, feet on 61 cm ≈74% | Order: incline → push-up → decline | Ebben et al., *J Strength Cond Res* 2011;25(10):2891–2894 — [summary](https://breakingmuscle.com/fitness/kinetic-analysis-of-the-push-up-which-version-is-hardest) | Search only (values from secondary summaries) | B |
| Adults: 150–300 min/week moderate or 75–150 min vigorous aerobic activity + muscle strengthening; some is better than none | Stamina / lose-weight goal; cardio minutes | Bull et al., WHO 2020, *Br J Sports Med* 2020;54:1451 — [BJSM](https://bjsm.bmj.com/content/54/24/1451), [PMC7719906](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/) | Opened 2026-11-18 (PMC7719906): 150–300 min moderate or 75–150 min vigorous per week; muscle strengthening "on 2 or more days a week" confirmed | A |
| METs: vigorous calisthenics incl. jumping jacks and burpees 7.5 (02020); moderate 3.8 (02022); light incl. plank 2.8 (02024); rope skipping 11.0 (02068); rowing machine vigorous 7.3 (02070); moderate band = 3.0–5.9 | Cardio choice; jumping jack, burpee, jump rope | Herrmann et al., 2024 Adult Compendium, *J Sport Health Sci* 2024;13(1):6–12 — [PubMed 38242596](https://pubmed.ncbi.nlm.nih.gov/38242596/), [conditioning table](https://pacompendium.com/conditioning-exercise/) | Opened 2026-11-18 (codes confirmed on pacompendium.com; 02022 examples are "pushups, sit ups, pull-ups, lunges") | B |
| Corrected 2026-11-18 (round 2): Compendium 12025 "Jogging, in place" = 4.8 METs; still no entry for high knees | Run in place MET if shown; no MET for high knees | 2024 Adult Compendium, running table — [pacompendium.com/running](https://pacompendium.com/running/) | Opened | B |
| HIIT and steady cardio give the same fat loss in adults with overweight; HIIT ~40% less time | Lose-weight goal | Wewege et al., *Obes Rev* 2017;18(6):635–646 — [PubMed 28401638](https://pubmed.ncbi.nlm.nih.gov/28401638/) | Search only | A |
| Whole-body (bodyweight) HIIT: fat mass effect like other aerobic training, slightly less aerobic fitness, more muscle fitness | Home cardio/conditioning moves | Scoubeau et al., *IJERPH* 2022;19:9559 — [PMC9367756](https://pmc.ncbi.nlm.nih.gov/articles/PMC9367756) | Opened 2026-11-18 (abstract and conclusion confirmed) | A |
| 150–250 min/week moderate activity prevents weight gain, modest loss; ≥250 min/week linked to clinically significant loss; diet + exercise > diet alone | Lose-weight goal copy | Donnelly et al., ACSM position stand 2009 — [PubMed 19127177](https://pubmed.ncbi.nlm.nih.gov/19127177/) | Search only | A |
| Resistance training in overweight adults: body fat ≈ −1.6%, lean mass +0.8 kg; resistance training + calorie restriction gave the biggest body-fat % fall while keeping lean mass | Lose-weight and "get lean" goals | Lopez et al., *Obes Rev* 2022;23(5):e13428 — [UWA record](https://research-repository.uwa.edu.au/en/publications/resistance-training-effectiveness-on-body-composition-and-body-we/) | Search only | A |
| The "28.5% more fat loss with intervals" (Viana 2019) was reportedly retracted; later meta-analysis finds trivial difference | Do NOT use the 28.5% claim | Steele et al., *Sports* 2021 — [PMC8619923](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8619923/) | Search only; retraction notice not seen | A |
| Sit-ups load the bent spine heavily; bent knees change little; curl-up / side bridge load the spine less | Dead bug and plank first; sit-up cue "stop if your back hurts" | McGill — secondary summary at [Michigan Today](https://michigantoday.umich.edu/2016/08/17/just-say-no-to-sit-ups) | Search only (original papers not reached) | C |
| Inverted row: highest lat activation and lowest spine load of three rows tested | Inverted row in the pull chain | Fenwick et al., *J Strength Cond Res* 2009 — [PDF](https://www.backfitpro.com/medical-scientific-articles/2009/[80]Fenwick,C.M.J.(2009)Comparison-of-different-rowing-exercises[J.Strength-and-Cond.].pdf) | Search only | B |
| Split squats load hip extensors more than back squats; early strength gains similar for one-leg vs two-leg training (small studies) | Split squat → Bulgarian → pistol | [Georgia Southern record](https://scholars.georgiasouthern.edu/en/publications/biomechanical-differences-between-the-bulgarian-split-squat-and-b/) + secondary summaries | Search only | C |
| Jumps: learn soft landings first, low volume for beginners, add height only when landings are good | Jumping jack before jump rope; jump squat after squat volume | NSCA-based study guide — [PT Pioneer](https://www.ptpioneer.com/personal-training/certifications/nsca-cscs/cscs-chapter-18/) | Search only; NSCA statement not reached | C |
| New gym members: ≥4 sessions/week for 6 weeks was the minimum to form an exercise habit | Habit pacing (sessions, streaks) | Kaushal & Rhodes, *J Behav Med* 2015 — [PubMed 25851609](https://pubmed.ncbi.nlm.nih.gov/25851609/) | Search only | B |
| Lally 2010: more complex behaviours (such as exercise) took longer to become habits | Caution on habit timelines | [BPS digest](https://bps.org.uk/research-digest/how-form-habit) | Search only | B |
| Order dead hang → negative pull-up → pull-up; pike push-up → handstand push-up; record numbers that gate each step | Unlock rules | Coaching convention; numbers **[Design choice]** | No controlled trial found | C |

## 7. Exercise ladder round 2 (2026-11-18)

Added by `exercise-scientist`. Details, tables and source codes S23–S34: `docs/research/EXERCISE-LADDER.md`,
section "Round 2". Grades: A = position stand / guideline / meta-analysis or systematic review of training
studies; B = single study, standard reference or systematic review of mechanism studies; C = coaching convention.

| Fact | Where used | Source | Status | Grade |
|---|---|---|---|---|
| METs: jogging in place 4.8 (12025); running 6–6.3 mph 9.3 (12050); running uphill 6 mph 5% 13.3 (12260); treadmill walk 3.0–3.4 mph 0% 3.8 (17355); climbing hills no load 6–10% grade 7.0 (17035) | Run in place; incline treadmill walk is harder than flat walking | 2024 Adult Compendium — [running](https://pacompendium.com/running/), [walking](https://pacompendium.com/walking/) | Opened | B |
| METs: HIIT moderate 7.0 (02210); HIIT with burpees, mountain climbers, squat jumps, vigorous 11.0 (02214) | Interval run, half burpee, conditioning moves | 2024 Adult Compendium — [conditioning](https://pacompendium.com/conditioning-exercise/) | Opened | B |
| Sprint interval training raises VO2max (~3.6 mL/kg/min); about equal to continuous endurance training with less volume (young, healthy) | Interval run, sprint 100 m | Gist et al., *Sports Med* 2014;44(2):269–279 — [PubMed 24129784](https://pubmed.ncbi.nlm.nih.gov/24129784/) | Search only | A |
| Novice runners: >30% weekly distance increase had a non-significant higher risk of distance-related injuries (HR 1.59, 95% CI 0.96–2.66); no overall difference | No big distance jumps in cardio targets; 5 km time trial gated late | Nielsen et al., *JOSPT* 2014 — [AAU record](https://vbn.aau.dk/da/publications/excessive-progression-in-weekly-running-distance-and-risk-of-runn) | Search only | B |
| A 1% treadmill grade best matches the energy cost of outdoor running (9 trained men) | Treadmill cue suggestion | Jones & Doust, *J Sports Sci* 1996;14:321–327 — [record](https://www.sponet.de/sponet/Record/4001902) | Search only | B |
| 12-minute run distance correlates with treadmill VO2max (r = 0.897, 115 men) | 12-minute run (Cooper test) | Cooper, *JAMA* 1968;203(3):201–204 — [record](https://lida.sport-iat.de/ta/Record/4077559?lng=en) | Search only | B |
| Sprint hamstring injuries most likely come from excessive eccentric strain in late swing | Sprint gated at tier 4; warm-up and "build up speed" cue | Danielsson et al., *BMC Musculoskelet Disord* 2020 — [PMC7526261](https://pmc.ncbi.nlm.nih.gov/articles/PMC7526261/) | Opened | B |
| Rest for strength: untrained ~60–120 s seems enough; trained >2 min | Strength goal rest 120 s | Grgic et al., *Sports Med* 2018;48:137–151 — [record](https://lida.sport-iat.de/ta/Record/4047011) | Search only | A |
| Narrow-base push-ups give more chest and triceps EMG than wide-base | Order regular → wide → close-grip push-up | Cogley et al., *J Strength Cond Res* 2005;19(3):628–633 — [record](https://bvbvf1.bib-bvb.de/vufind/PrimoRecord/cdi_proquest_miscellaneous_68474100) | Search only | B |
| Chin-up: more pectoralis and biceps EMG; pull-up: more lower trapezius | Chin-up as a pull-up variation | Youdas et al., *J Strength Cond Res* 2010;24(12):3404–3414 — [PubMed 21068680](https://pubmed.ncbi.nlm.nih.gov/21068680/) | Search only | B |
| Hip thrust: more glute EMG than back squat; a later training trial found similar glute growth | Hip thrust as a glute-bridge variation | Contreras et al., *J Appl Biomech* 2015 — [PubMed 26214739](https://pubmed.ncbi.nlm.nih.gov/26214739/); Plotkin et al., *Front Physiol* 2023 — [DOAJ](https://doaj.org/article/e0f865b8c13d4086895c8762e72a6988) | Search only | B |
| %1RM–reps: 80% 1RM ≈ 8 reps, 85% ≈ 6 reps (point estimates) | Strength goal rep high = 8 | NSCA *Essentials* table — [ACE reproduction](https://www.acefitness.org/fitness-certifications/ace-answers/exam-preparation-blog/2894/understanding-1-rm-and-predicted-1-rm-assessments/) | Search only | B |
| Goal targets: strength 5–8 reps, 3 sets, 120 s; muscle and lean 8–12, 3, 90 s; stamina 15–25, 2, 60 s; lose weight 10–15, 2, 60 s; several goals → per exercise, order strength → muscle → lean → stamina → lose_weight | Goal profile targets | ACSM 2009 (S1), ACSM 2026 (S2), Schoenfeld 2017 (S5), Singer 2024 (S14), Lopez 2022 (S13), Kikuchi 2017 (S7), Grgic 2018, NSCA table; set counts, 25-rep cap, stamina/lose-weight numbers and the combine order are **[Design choice]** | Mixed (see EXERCISE-LADDER.md Round 2 C) | A/B + [Design choice] |
| Demo photos: 41 of 78 MaxFit ids have a same-movement match in free-exercise-db (The Unlicense); all 82 images returned HTTP 200 | Exercise demo | [free-exercise-db](https://github.com/yuhonas/free-exercise-db) `dist/exercises.json` | Opened (downloaded and HEAD-checked 2026-11-18) | — |
