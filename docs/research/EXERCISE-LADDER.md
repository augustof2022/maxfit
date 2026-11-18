# MaxFit exercise ladder, measures and goals — evidence and proposal

Author: `exercise-scientist` (effort high), 2026-11-18 (GMT+8). Brief from `maxfit-pm`, based on
Renz's requests of 2026-11-18. Status: **proposal**. The PM implements the code; `game-designer`
runs `npm run balance` on the pacing numbers.

**Read this first.** In this session the network blocked every source page (acsm.org,
pacompendium.com, pmc.ncbi.nlm.nih.gov). So every source below is **search only**: the fact
came from a web-search summary of the paper, not from the paper itself. Re-open them when the
network allows. Nothing here is medical advice. Pain, dizziness or a health condition → see a doctor.

Grades: **A** = position stand, guideline or meta-analysis. **B** = single controlled study or
standard reference (for example the Compendium). **C** = coaching convention or biomechanics
(muscle-activity or force) data only. **[Design choice]** = a game number with no science behind it.

---

## 1. Summary of the evidence

| # | What the evidence says | Grade | Source |
|---|---|---|---|
| E1 | Train all major muscle groups at least 2 days a week. For strength: heavier loads (≥80% of 1-rep max), 2–3 sets, at the start of the session, ≥2 sessions a week. For muscle size: about 10 sets per muscle group per week. Training to failure, machines vs free weights and periodization did not consistently change results. Adherence (enjoyment, safety, personal goals) matters | A | S2 ACSM 2026 |
| E2 | Novices: loads of 8–12 reps max, 2–3 days a week; multi-joint exercises give the best overall strength gains; 2–3 min rest between multiple sets; muscular endurance: 40–60% 1RM, more than 15 reps, under 90 s rest | A | S1 ACSM 2009 |
| E3 | Muscle grows about the same with light or heavy loads when sets go near failure; heavy loads give more maximal strength | A | S5 Schoenfeld 2017a; S15 Schoenfeld 2021 |
| E4 | More weekly sets → more muscle growth, shown up to about 10 sets per muscle per week | A | S6 Schoenfeld 2017b |
| E5 | Rest longer than 60 s gives a small extra muscle gain; no clear difference beyond 90 s | A | S14 Singer 2024 |
| E6 | Push-ups at a matched load build chest/triceps size and bench-press strength like the bench press (untrained men, 8 weeks; and a 4-week progressive push-up study) | B | S7 Kikuchi 2017; S8 Kotarsky 2018 |
| E7 | Push-up difficulty, as % of body mass on the hands: hands on a 61 cm box ≈ 41%, knees ≈ 49%, floor ≈ 64%, feet on a 30 cm box ≈ 70%, feet on a 61 cm box ≈ 74%. So incline → floor → decline is a real, measured ladder | B | S9 Ebben 2011 |
| E8 | Adults: 150–300 min a week moderate aerobic activity, or 75–150 min vigorous, plus muscle strengthening. Some activity is better than none | A | S3 WHO 2020 |
| E9 | Energy cost (METs): vigorous calisthenics (push-ups, sit-ups, pull-ups, **jumping jacks, burpees**) 7.5; moderate calisthenics (lunges, push-ups) 3.8; light calisthenics (curl-ups, crunches, **plank**) 2.8; rope skipping 11.0; rowing machine (vigorous) 7.3. Light = 1.6–2.9, moderate = 3.0–5.9 METs | B | S4 Compendium 2024 |
| E10 | **No Compendium entry was found for "running in place" or "high knees".** | — | [No source found] |
| E11 | HIIT and steady cardio give the same fat loss in adults with overweight; HIIT took about 40% less time | A | S10 Wewege 2017 |
| E12 | Whole-body (bodyweight) HIIT: same effect on fat mass as other aerobic training, slightly less on aerobic fitness, more on muscle fitness | A | S11 Scoubeau 2022 |
| E13 | 150–250 min a week of moderate activity prevents weight gain but gives only modest loss; ≥250 min a week is linked to clinically significant loss; diet + exercise beats diet alone | A | S12 Donnelly 2009 (ACSM) |
| E14 | Resistance training in adults with overweight: fat about −1.6%, lean mass +0.8 kg. Resistance training + calorie restriction gave the largest fall in body-fat % while keeping lean mass | A | S13 Lopez 2022 |
| E15 | A 2019 meta-analysis claimed interval training cuts 28.5% more fat mass; a 2021 meta-analysis says it was retracted and finds no real difference. **We do not use the 28.5%.** | A (2021) | S21 Steele 2021 |
| E16 | Sit-ups put high compression on a bent spine; bent knees do not change it much; curl-up, side bridge and bird-dog style moves load the spine less | C | S17 McGill (secondary summaries only) |
| E17 | Inverted row: highest lat activation and lowest spine load of three rows tested | B | S16 Fenwick 2009 |
| E18 | Split squats load the hip extensors more than back squats; early strength gains are similar for one-leg and two-leg training (small studies) | C | S22 (secondary summaries) |
| E19 | Jumps (plyometrics): learn soft landings first; low volume for beginners; add height only when landings are good | C | S18 NSCA-based study guides (position statement not reached) |
| E20 | Habit: median 66 days to automaticity (wide range 18–254); one missed day did not hurt; complex behaviours (exercise) took longer | B | S19 Lally 2010 |
| E21 | New gym members: at least 4 sessions a week for 6 weeks was the minimum to form an exercise habit | B | S20 Kaushal & Rhodes 2015 |

**What the 2026 ACSM stand changes for us (E1):** it was found (Currier et al., *MSSE* 58(4):851–872,
April 2026) but not opened. Search summaries say it gives no rest-interval number and that rest
was not a consistent factor; the abstract we saw does not list rest. Keep the 90 s default
(inside ACSM 2009 and above the 60 s threshold of E5) until it is opened. **[Not checked]**

## 2. Design principles used (and why)

1. **Movement patterns, not random moves.** Every exercise belongs to one pattern: horizontal push,
   vertical push, horizontal pull, vertical pull, squat (knee), hinge (hip), core (anti-extension,
   anti-side-bend, hip flexion), cardio/conditioning. Each pattern runs from an easier version
   (regression) to a harder one (progression). [E1, E2 multi-joint first; C for the pattern taxonomy]
2. **Unlock the harder version by a record on the easier version of the same pattern.** E.g.
   pull-up needs negative pull-ups, not push-ups. Records are the readiness test. The exact record
   numbers are **[Design choice]**, set where the evidence says the easier move stops being a hard
   stimulus: muscle grows across a wide rep range (E3), so we move up when a set passes about
   15–25 good reps. [E3 grade A for the idea; the numbers are design]
3. **Regressions are never locked.** The easiest version of the main patterns is open from day 1
   (incline push-up) so a beginner always has a safe version. [C]
4. **Habit first, then strength.** Tier 2 still unlocks by showing up (streaks, sessions), because
   consistency builds the habit (E20, E21). Strength-gated moves come from tier 3 up.
5. **No dead ends.** When the prerequisite needs equipment, an `any` rule gives a bodyweight path
   too (e.g. deadlift: dumbbell RDL **or** single-leg glute bridge). [Design choice]
6. **Jumps after landings.** Jumping moves need a base (jumping jacks / squats) first (E19).
7. **Spine-friendly core first.** Dead bug and plank come before sit-ups are the only core option;
   sit-up stays (Renz's data refers to it) but with a safer cue (E16).
8. **Balance across the body.** Goals and focus *tilt* suggestions; they never remove a pattern,
   because the guidelines say train all major muscle groups ≥2 days a week (E1, E8).
9. **Keep each existing id and its main measure.** Users' records are stored in that measure;
   changing it would break "the number to beat". [Design choice]

## 3. The proposed ladder (55 exercises: 38 kept, 17 new)

Measures: first = main (used for records and `record` rules). "both sides" = count left + right.
Source refs: S-codes in section 7. **NEW** = new id. **CHANGED** = rule or tier differs from today.
All session counts, levels and record values are **[Design choice]** for `game-designer` to tune.

| id | name | measures (default, in order, first = main) | equipment ids | muscles | focus tags | goal tags | tier | unlock rule (as JSON) | pattern/progression note | one-line safe cue | source refs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| incline_push_up | Incline push-up **NEW** | reps | (none) | chest, triceps, shoulders | chest, arms | muscle, lean | 1 | `{"type":"start"}` | Horizontal push, step 1 (regression). Higher hands = easier (wall → table → chair). Keep the same height until you pass 15, then go lower | Hands on a wall, table or sturdy chair. Body straight, chest to the edge, push away. | S9, S7 |
| push_up | Push-up | reps | (none) | chest, triceps, shoulders | chest, arms, shoulders | muscle, strength, lean | 1 | `{"type":"start"}` | Horizontal push, step 2 (≈64% body mass) | Body straight like a plank. Chest close to the floor, then push up. | S7, S8, S9 |
| run | Run / walk | distance, time | (none) | legs, heart | cardio, legs | lose_weight, stamina, lean | 1 | `{"type":"start"}` | Outdoor cardio base. Walk ↔ run intervals | Run when you can, walk when you must. Log the km at the end. | S3, S11 |
| run_in_place | Run in place | time | (none) | legs, heart | cardio, legs | lose_weight, stamina | 1 **CHANGED** (was 2) | `{"type":"start"}` **CHANGED** (was sessions 5) | Home cardio base (day 1 at home). Regression: march in place | Light, quick steps on the balls of your feet. March if you need a break. | S3; MET [No source found] |
| squat | Bodyweight squat | reps | (none) | quads, glutes | legs | muscle, lean | 2 | `{"type":"streak","days":2}` | Squat pattern, step 1 | Feet shoulder-width. Sit back until thighs are level, chest up. | S1 |
| knee_raise | Standing knee raise | reps, time | (none) | core, hip flexors | core, cardio | stamina, lose_weight | 2 | `{"type":"sessions","count":3}` | Hip flexion / low-impact cardio, step 1 (Renz already does these) | Stand tall. Drive one knee to hip height, switch. Count both legs. | S4 (moderate calisthenics, by class) |
| jumping_jack | Jumping jack **NEW** | time, reps | (none) | legs, shoulders, heart | cardio, legs | stamina, lose_weight, lean | 2 | `{"type":"sessions","count":4}` | Home cardio, step 2 (first impact move; teaches soft landings). Regression: step-jacks | Jump feet out as arms go up, jump back in. Land soft. Step side to side if jumping hurts. | S4 (7.5 MET), S11, S18 |
| dead_bug | Dead bug **NEW** | reps | (none) | core | core | stamina | 2 | `{"type":"sessions","count":5}` | Core anti-extension, step 1 (low spine load) | On your back, arms up, knees over hips. Lower opposite arm and leg slowly, low back stays down. Count both sides. | S17, S4 |
| sit_up | Sit-up | reps | (none) | core | core | stamina | 2 | `{"type":"any","rules":[{"type":"streak","days":4},{"type":"sessions","count":7}]}` | Trunk flexion. Kept for Renz's data; not a gate for anything | Knees bent, feet flat. Curl up slowly; do not pull your neck. Stop if your back hurts. | S17 (spine load caution) |
| plank | Plank | time | (none) | core, shoulders | core, shoulders | stamina, strength | 2 | `{"type":"any","rules":[{"type":"record","exerciseId":"push_up","value":12},{"type":"record","exerciseId":"dead_bug","value":12}]}` **CHANGED** (adds the dead-bug path) | Core anti-extension, step 2 (hold) | Forearms down, body in one line. Squeeze glutes, breathe. | S4 (2.8 MET), S17 |
| glute_bridge | Glute bridge | reps | (none) | glutes, hamstrings | legs | muscle, lean | 3 | `{"type":"sessions","count":8}` | Hinge (hip), step 1 | Lie on your back, push through heels, squeeze at the top. | S1 |
| split_squat | Split squat **NEW** | reps | (none) | quads, glutes | legs | muscle, strength, lean | 3 | `{"type":"record","exerciseId":"squat","value":15}` | Squat pattern, step 2 (one leg, static, easier balance than a lunge) | Long stance, back heel up. Drop the back knee straight down. Count both legs. | S22 |
| lunge | Lunge | reps | (none) | quads, glutes | legs | muscle, lean, stamina | 3 | `{"type":"all","rules":[{"type":"any","rules":[{"type":"streak","days":6},{"type":"sessions","count":12}]},{"type":"record","exerciseId":"split_squat","value":10}]}` **CHANGED** (adds split-squat record) | Squat pattern, step 3 (moving, more balance) | Long step, both knees to 90 degrees. Count both legs. | S22, S4 |
| leg_raise | Lying leg raise **NEW** | reps | (none) | core, hip flexors | core | stamina, strength | 3 | `{"type":"record","exerciseId":"dead_bug","value":16}` | Hip flexion, step 2 (longer lever; needs dead-bug control). Renz already does these | On your back, hands under hips. Raise straight legs, lower slowly, low back stays down. | S17 |
| mountain_climber | Mountain climber | reps, time | (none) | core, shoulders, heart | core, cardio | stamina, lose_weight, lean | 3 | `{"type":"record","exerciseId":"plank","value":45}` | Moving plank / conditioning | High plank. Drive knees to chest fast. Count both legs. | S11 |
| high_knees | High knees **NEW** | time, reps | (none) | legs, hip flexors, heart | cardio, legs, core | stamina, lose_weight, lean | 3 | `{"type":"record","exerciseId":"run_in_place","value":120}` | Home cardio, step 3 (harder run in place) | Run in place, knees to hip height, quick light steps. Land soft. | S11, S18; MET [No source found] |
| burpee | Burpee | reps, time | (none) | full body, heart | cardio, chest, legs | lose_weight, stamina, lean | 3 | `{"type":"all","rules":[{"type":"level","level":5},{"type":"record","exerciseId":"push_up","value":8},{"type":"record","exerciseId":"squat","value":15}]}` **CHANGED** (was level 5 only) | Whole-body conditioning, built from push-up + squat | Squat, jump feet back, push-up, jump feet in, jump up. Step instead of jump to start. | S4 (7.5 MET), S11 |
| jump_rope | Jump rope | time, reps | jump_rope | calves, heart | cardio, legs | stamina, lose_weight, lean | 3 | `{"type":"all","rules":[{"type":"sessions","count":10},{"type":"record","exerciseId":"jumping_jack","value":60}]}` **CHANGED** (adds jumping-jack base) | Cardio with impact, after landing practice | Small hops, wrists turn the rope, elbows close. | S4 (11.0 MET), S18 |
| side_plank | Side plank **NEW** | time | (none) | obliques, shoulders | core | stamina, strength | 3 | `{"type":"record","exerciseId":"plank","value":30}` | Core anti-side-bend (time one side) | On one forearm, feet stacked, hips high in one line. Time one side, then the other. | S17 |
| pike_push_up | Pike push-up **NEW** | reps | (none) | shoulders, triceps | shoulders, arms | muscle, strength | 3 | `{"type":"record","exerciseId":"push_up","value":12}` | Vertical push, step 1 (home shoulder press) | Hips high, body in an upside-down V. Lower your head toward the floor between your hands, push up. | C |
| single_leg_glute_bridge | Single-leg glute bridge **NEW** | reps | (none) | glutes, hamstrings | legs | muscle, strength, lean | 3 | `{"type":"record","exerciseId":"glute_bridge","value":20}` | Hinge, step 2 (one leg) | One foot down, other leg up. Push through the heel, hips level. Count both legs. | C |
| band_row | Band row **NEW** | reps | resistance_band | back, biceps | back, arms | muscle, lean | 3 | `{"type":"sessions","count":7}` | Horizontal pull at home, step 1 | Band anchored at chest height. Pull elbows back, squeeze shoulder blades, return slowly. | S2 (equipment type not decisive), C |
| dead_hang | Dead hang **NEW** | time | pullup_bar | grip, shoulders, back | back, arms | strength | 3 | `{"type":"sessions","count":8}` | Vertical pull, step 1 (grip and shoulder base) | Hang with straight arms, shoulders pulled slightly down. Step down, do not drop. | C |
| db_row | Dumbbell row | weight, reps | dumbbell | back, biceps | back, arms | muscle, strength, lean | 3 | `{"type":"sessions","count":6}` **CHANGED** (was 14) | Horizontal pull with load. Moved earlier: multi-joint before single-joint | Flat back, pull the weight to your hip, lower slowly. | S1, S2 |
| db_curl | Dumbbell curl | weight, reps | dumbbell | biceps | arms | muscle | 3 | `{"type":"sessions","count":14}` **CHANGED** (was 6) | Single-joint arm move, after the rows and presses | Elbows fixed at your sides. Lift, then lower slowly. | S1 |
| db_press | Dumbbell shoulder press | weight, reps | dumbbell | shoulders, triceps | shoulders, arms | muscle, strength, lean | 3 | `{"type":"sessions","count":12}` | Vertical push with load | Start at shoulders, press straight up, do not arch your back. | S1 |
| db_rdl | Dumbbell Romanian deadlift **NEW** | weight, reps | dumbbell | hamstrings, glutes, back | legs, back | muscle, strength, lean | 3 | `{"type":"all","rules":[{"type":"sessions","count":10},{"type":"record","exerciseId":"glute_bridge","value":15}]}` | Hinge with load, step 3 (teaches the deadlift) | Soft knees, push hips back, weights slide down your thighs. Flat back. Start light. | S1, C |
| inverted_row | Inverted row **NEW** | reps | squat_rack | back, biceps | back, arms | muscle, strength, lean | 3 | `{"type":"sessions","count":10}` | Horizontal pull, step 2 (bodyweight). Bar at waist height | Bar at waist height, body straight, heels down. Pull chest to bar, lower slowly. | S16 |
| treadmill_run | Treadmill run | distance, time | treadmill | legs, heart | cardio, legs | lose_weight, stamina, lean | 3 | `{"type":"sessions","count":9}` | Gym cardio | Same as a run. Log the km from the screen. | S3, S10 |
| bike | Stationary bike | distance, time | stationary_bike | legs, heart | cardio, legs | lose_weight, stamina | 3 | `{"type":"sessions","count":11}` | Gym cardio, no impact | Seat at hip height. Steady cadence. Log the km. | S3, S10 |
| lat_pulldown | Lat pulldown | weight, reps | cable_machine | back, biceps | back, arms | muscle, strength, lean | 3 **CHANGED** (was 4) | `{"type":"sessions","count":12}` **CHANGED** (was 18) | Vertical pull with a machine (gym regression of the pull-up) | Pull the bar to your upper chest, elbows down and back. | S2 |
| decline_push_up | Decline push-up **NEW** | reps | (none) | chest, shoulders, triceps | chest, shoulders, arms | muscle, strength | 4 | `{"type":"record","exerciseId":"push_up","value":15}` | Horizontal push, step 3 (≈70–74% body mass) | Feet on a chair or step, hands on the floor. Body straight, chest down, push up. | S9 |
| diamond_push_up | Diamond push-up | reps | (none) | triceps, chest | arms, chest | muscle, strength | 4 | `{"type":"record","exerciseId":"push_up","value":25}` | Horizontal push, triceps branch | Hands together under your chest, elbows close to the body. | C |
| dips | Dips | reps | dip_bars | triceps, chest | arms, chest | muscle, strength | 4 | `{"type":"record","exerciseId":"push_up","value":25}` | Vertical push down (dip) | Lower until elbows are at 90 degrees, push back up. Stop if your shoulder hurts. | C |
| jump_squat | Jump squat | reps | (none) | quads, glutes, heart | legs, cardio | stamina, lose_weight | 4 | `{"type":"record","exerciseId":"squat","value":30}` | Squat pattern, power branch (after squat volume) | Squat down, jump up, land soft and go straight into the next. | S18 |
| goblet_squat | Goblet squat | weight, reps | dumbbell | quads, glutes | legs | muscle, strength, lean | 4 | `{"type":"record","exerciseId":"squat","value":20}` | Squat with load, step 1 | Hold one dumbbell at your chest. Squat deep, chest up. | S1 |
| bulgarian_split_squat | Bulgarian split squat **NEW** | reps, weight | (none) | quads, glutes | legs | muscle, strength, lean | 4 | `{"type":"record","exerciseId":"split_squat","value":16}` | Squat pattern, step 4 (rear foot raised; most one-leg load before a pistol) | Back foot on a chair or bench. Lower the back knee straight down, front foot flat. Count both legs. | S22 |
| negative_pull_up | Negative pull-up **NEW** | reps | pullup_bar | back, biceps | back, arms | strength, muscle | 4 | `{"type":"record","exerciseId":"dead_hang","value":30}` | Vertical pull, step 2 (lowering only) | Step up so your chin is over the bar. Lower yourself slowly, about 3–5 seconds. Step down. | C |
| pull_up | Pull-up | reps | pullup_bar | back, biceps | back, arms | strength, muscle | 4 | `{"type":"record","exerciseId":"negative_pull_up","value":5}` **CHANGED** (was push-up record 20) | Vertical pull, step 3 | Hang with straight arms, pull chin over the bar, lower slowly. | C |
| bench_press | Bench press | weight, reps | barbell, bench | chest, triceps | chest, arms | strength, muscle | 4 | `{"type":"all","rules":[{"type":"sessions","count":15},{"type":"record","exerciseId":"push_up","value":15}]}` | Horizontal push with a barbell | Feet flat, bar to mid-chest, press up. Use a spotter for heavy sets. | S2, S7 |
| barbell_squat | Barbell back squat | weight, reps | barbell | quads, glutes, back | legs | strength, muscle | 4 | `{"type":"all","rules":[{"type":"sessions","count":15},{"type":"record","exerciseId":"squat","value":25}]}` | Squat with a barbell | Bar on upper back, brace, sit down to parallel, stand up. Start light; use a rack. | S2 |
| leg_press | Leg press | weight, reps | leg_press | quads, glutes | legs | muscle, strength | 4 | `{"type":"sessions","count":16}` | Squat pattern on a machine | Feet mid-plate. Lower until knees reach 90 degrees. Do not lock knees. | S2 |
| deadlift | Deadlift | weight, reps | barbell | back, glutes, hamstrings | back, legs | strength, muscle | 5 | `{"type":"all","rules":[{"type":"level","level":10},{"type":"any","rules":[{"type":"record","exerciseId":"db_rdl","value":10,"measure":"reps"},{"type":"record","exerciseId":"single_leg_glute_bridge","value":15}]}]}` **CHANGED** (hinge prerequisite replaces streak/sessions) | Hinge with a barbell, last step | Bar over mid-foot, flat back, push the floor away. Start light. | S2, C |
| overhead_press | Barbell overhead press | weight, reps | barbell | shoulders, triceps | shoulders, arms | strength, muscle | 5 | `{"type":"all","rules":[{"type":"level","level":12},{"type":"any","rules":[{"type":"record","exerciseId":"db_press","value":8,"measure":"reps"},{"type":"record","exerciseId":"pike_push_up","value":10}]}]}` **CHANGED** (adds vertical-push prerequisite) | Vertical push with a barbell | Bar at collarbone, squeeze glutes, press straight up. Start light. | S2, C |
| pistol_squat | Pistol squat (assisted ok) | reps | (none) | quads, glutes, balance | legs | strength | 5 | `{"type":"record","exerciseId":"bulgarian_split_squat","value":20}` **CHANGED** (was jump-squat record 20) | Squat pattern, last step (one-leg strength, not jump power, is the base) | One leg out in front, sit down slowly. Hold a door frame at first. | S22, C |
| hanging_leg_raise | Hanging leg raise | reps | pullup_bar | core, hip flexors | core | strength | 5 | `{"type":"all","rules":[{"type":"record","exerciseId":"leg_raise","value":15},{"type":"record","exerciseId":"dead_hang","value":30}]}` **CHANGED** (was knee-raise 30 + plank 90) | Hip flexion, last step (needs the leg raise and the grip) | Hang still, raise straight legs to hip height, lower slowly. Bend knees to make it easier. | C |
| archer_push_up | Archer push-up | reps | (none) | chest, triceps | chest, arms | strength, muscle | 5 | `{"type":"any","rules":[{"type":"record","exerciseId":"diamond_push_up","value":20},{"type":"record","exerciseId":"decline_push_up","value":20}]}` **CHANGED** (adds decline path) | Horizontal push, one-arm-biased step | Wide hands, shift your weight to one arm, the other stays straight. | S9, C |
| ab_rollout | Ab wheel rollout (knees) **NEW** | reps | ab_wheel | core, shoulders | core | strength | 5 | `{"type":"record","exerciseId":"plank","value":90}` | Core anti-extension, last step | On your knees, roll out only as far as your back stays flat, roll back. Start short. | C |
| muscle_up | Muscle-up | reps | pullup_bar | back, chest, triceps | back, arms, chest | strength | 6 | `{"type":"record","exerciseId":"pull_up","value":12}` | Vertical pull + dip, top skill | Explosive pull-up, lean over the bar, press to straight arms. | C |
| handstand_push_up | Wall handstand push-up | reps | (none) | shoulders, triceps | shoulders, arms | strength | 6 | `{"type":"all","rules":[{"type":"level","level":20},{"type":"record","exerciseId":"pike_push_up","value":15}]}` **CHANGED** (pike replaces push-up 40) | Vertical push, last step | Handstand against a wall, lower head to a pad, press up. Have a spotter at first. | C |
| bear_crawl | Bear crawl | time | (none) | full body | core, shoulders, cardio | stamina | 0 | `{"type":"secret"}` | Secret; safe at any level | Hands and feet, knees just off the floor. Crawl forward and back. | C |
| wall_sit | Wall sit | time | (none) | quads | legs | stamina | 0 | `{"type":"secret"}` | Secret; isometric squat | Back on the wall, thighs level, hold. | C |
| superman_hold | Superman hold | time | (none) | lower back, glutes | back | stamina | 0 | `{"type":"secret"}` | Secret; back extension | Lie face down, lift arms and legs a little, hold. | C |
| shadow_boxing | Shadow boxing | time | (none) | shoulders, heart | cardio, shoulders | stamina, lose_weight | 0 | `{"type":"secret"}` | Secret; low-impact cardio | Guard up, light on your feet, throw fast straight punches. | C |
| skater_jump | Skater jump | reps | (none) | legs, balance | legs, cardio | stamina, lose_weight | 0 | `{"type":"secret"}` | Secret; one-leg landing (see risk R3) | Leap side to side, land soft on one foot. Step instead of jump to start. Count both sides. | S18 |

**Starters (day 1, home, no equipment):** incline push-up, push-up, run in place (+ run outdoors).

### Notes for the PM / game-designer

- **Equipment "OR" is missing.** Inverted row works with a squat rack, Smith machine or suspension
  trainer, but `equipment` means "all of these". We picked `squat_rack`. An `anyOf` equipment field
  would let more places show it. Same idea for incline/decline push-up and Bulgarian split squat,
  which need a chair or step (left as bodyweight because almost every home has one). [Design choice]
- **Incline push-up height.** The record is only comparable at the same height (E7). Suggest a
  short note field or a fixed "table height" instruction. [Design choice]
- **Record values in rules** use the main measure, except where `measure: "reps"` is written
  (weighted moves, so the rule means "10 good reps at any weight"). [Design choice]
- **Pacing.** We changed several session numbers (db_row 6, db_curl 14, lat_pulldown 12, band_row 7,
  dead_hang 8, inverted_row 10). A full-gym user could get 3 unlocks on one day. `npm run balance`
  (steady and casual) must check "max unlocks in one day" and the 90-day unlock count.

## 4. Goals: what the evidence supports

The goal profile **tilts** which exercises are suggested and which secrets a chest favours. It should
not change the base: every plan keeps push, pull, legs, core and some cardio, because all
guidelines say train all major muscle groups ≥2 days a week (E1, E8). [Design choice based on A]

| Goal | Reps per set | Sets | Rest | Cardio per week | Exercises to favour | Grade and source | Weak points |
|---|---|---|---|---|---|---|---|
| **Build muscle** (`muscle`) | Wide range works if sets end near failure (E3). Beginner default 8–12 reps (E2). Bodyweight: move to the harder version when a set passes ~15–25 reps [Design choice] | ~10 sets per muscle group per week (E1, E4) | >60 s; 90 s default; no clear extra gain past 90 s (E5) | WHO minimum (E8) | Multi-joint resistance moves; push-ups count (E6) | A (S2, S5, S6, S14), B (S7, S8) | The 15–25 rep step-up point is design, not science |
| **Get stronger** (`strength`) | Heavier loads (≥80% 1RM) (E1). The app shows reps, not %1RM: in practice the harder variation or heavier weight where only a few good reps are possible | 2–3 sets per exercise, done early in the session, ≥2 sessions a week (E1) | 2–3 min between sets (E2) | WHO minimum (E8) | Barbell moves, pull-up chain, one-leg squats, archer, hanging moves | A (S2, S1, S5) | %1RM → rep conversion **[No source found]** in this session; do not show a %1RM number |
| **Stamina** (`stamina`) | Muscular endurance: >15 reps at light–moderate loads (E2) | Not specified in what we found | <90 s for muscular endurance (E2) | 150–300 min moderate or 75–150 min vigorous (E8). Bodyweight HIIT is a valid way (E12) | Cardio moves, conditioning (burpee, mountain climber, high knees), holds | A (S1, S3, S11) | ACSM 2026 endurance numbers **[Not checked]** |
| **Lose weight** (`lose_weight`) | Any; resistance training also cuts fat (~1.6%) and adds lean mass (E14) | — | — | 150–250 min/week prevents gain, modest loss; ≥250 min/week for clinically significant loss; diet matters most (E13). HIIT = steady cardio for fat loss, in less time (E11) | Cardio + whole-body moves, plus resistance work | A (S12, S10, S11, S13) | Do not promise kg. Viana 28.5% claim not used (E15). No diet advice in the app (not our scope; see a professional) |
| **Get lean** (`lean`) | As "build muscle" | As "build muscle" | As "build muscle" | As "lose weight" | Resistance (multi-joint) + HIIT-style moves | A (S13: resistance training + calorie restriction gave the biggest body-fat % drop while keeping lean mass) | "Lean" is not a research term; we map it to "lose fat, keep muscle" [Design choice] |

**Session size for a habit-building starter.** No source gives a minimum session length for habit
formation. Kaushal & Rhodes found ≥4 sessions a week for 6 weeks was the minimum for a gym habit
(E21, B). Lally: median 66 days, and one missed day did not hurt (E20, B). This supports
MaxFit's "sessions + streaks that forgive a missed day" design. Short daily goals stay **[Design choice]**.

**Focus tags.** Use the `focus tags` column directly. `cardio` focus favours the cardio rows;
each body focus favours rows with that tag. [Design choice]

## 5. "Beat rule" notes per measure (Renz's rule: at least one tracked measure goes up, none goes down)

| Measure | "Better" means | Source |
|---|---|---|
| reps | More good reps on the same exercise (same version, same height for incline) | Progressive overload, S1 (A) |
| time — hold or continuous effort (plank, dead hang, run in place, jumping jacks, jump rope) | Longer = better | Progressive overload, S1 (A); direction is [Design choice] |
| weight | Heavier = better. Weight up but reps down → **not** a beat under Renz's rule (mixed result). Double progression (8→12 reps, then add weight) already handles this | S1 (A) for 8–12; double progression [Design choice] |
| distance | Farther = better | [Design choice] |
| **distance + time** (run, treadmill, bike) | **Problem:** with the literal rule, the same km in less time (faster) counts as "time went down" → not a beat, and the same km in more time (slower) counts as a beat. **Suggest:** compare distance (↑ better) and **pace** = time ÷ km (↓ better) instead of raw time: beaten when distance goes up and pace is not slower, or pace is faster and distance is not lower | [Design choice] — needs Renz's yes (Q-A below) |
| reps + time (e.g. jumping jacks counted in a timed bout) | Both "more is better" (longer bout, more reps). Note: more reps in a shorter bout is not a beat under the rule | [Design choice] |

## 6. Open questions for Renz

1. **Q-A (beat rule for cardio).** For run / treadmill / bike, may we compare **distance and pace**
   instead of distance and raw time? Otherwise a faster run over the same distance will not count as
   a record. — Decides records for every cardio exercise.
2. **Q-B (home equipment, links to Q2).** Do you have a resistance band, pull-up bar, dumbbells or an
   ab wheel at home? — Decides which home rows (band row, dead hang, pull-up chain) you will see.
3. **Q-C (secrets safety).** Skater jump (a one-leg landing) can drop from a chest on day 2. OK to
   only allow a secret once its pattern base is unlocked (e.g. skater jump after jumping jacks)? —
   Safety for a beginner; needs a small engine change.
4. **Q-D (ACSM 2026).** We found the 2026 ACSM stand but could not open it. May the PM allow
   acsm.org, pacompendium.com and pmc.ncbi.nlm.nih.gov in the session network so we can verify the
   numbers? — Every row here is "search only" until then.

## 7. Sources (all **search only** in this session — page itself not opened)

| Code | Source | Link | Grade |
|---|---|---|---|
| S1 | ACSM position stand. Progression models in resistance training for healthy adults. *Med Sci Sports Exerc* 2009;41(3):687–708 | [PubMed 19204579](https://pubmed.ncbi.nlm.nih.gov/19204579/) | A |
| S2 | Currier BS et al. ACSM position stand: resistance training prescription for muscle function, hypertrophy and physical performance in healthy adults — an overview of reviews. *Med Sci Sports Exerc* 2026;58(4):851–872 | [ACSM news](https://acsm.org/resistance-training-guidelines-update-2026/), [Newswise](https://www.newswise.com/articles/acsm-unveils-landmark-2026-resistance-training-guidelines-first-update-in-17-years), [APTA listing](https://www.apta.org/patient-care/evidence-based-practice-resources/cpgs/american-college-of-sports-medicine-position-stand-resistance-training-prescription-for-muscle-function-hypertrophy-and-physical-performance-in-healthy-adults-an-overview-of-reviews) | A |
| S3 | Bull FC et al. WHO 2020 guidelines on physical activity and sedentary behaviour. *Br J Sports Med* 2020;54:1451–1462 | [BJSM](https://bjsm.bmj.com/content/54/24/1451), [PMC7719906](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/) | A |
| S4 | Herrmann SD et al. 2024 Adult Compendium of Physical Activities. *J Sport Health Sci* 2024;13(1):6–12 (codes 02020 = 7.5, 02022 = 3.8, 02024 = 2.8, 02068 = 11.0, 02070 = 7.3) | [PubMed 38242596](https://pubmed.ncbi.nlm.nih.gov/38242596/), [tracking guide PDF](https://pacompendium.com/wp-content/uploads/2025/02/4_2024_adult-compendium-tracking-guide-1-2024.pdf) | B |
| S5 | Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs high-load resistance training: a systematic review and meta-analysis. *J Strength Cond Res* 2017 | [PubMed 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/) | A |
| S6 | Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci* 2017 | [PDF copy](https://paulogentil.com/pdf/Dose-response%20relationship%20between%20weekly%20resistance%20training%20volume%20and%20increases%20in%20muscle%20mass%20-%20A%20systematic%20review%20and%20metaanalysis.pdf) | A |
| S7 | Kikuchi N, Nakazato K. Low-load bench press and push-up induce similar muscle hypertrophy and strength gain. *J Exerc Sci Fit* 2017;15(1):37–42 | [PMC5812864](https://pmc.ncbi.nlm.nih.gov/articles/PMC5812864) | B |
| S8 | Kotarsky CJ et al. Effect of progressive calisthenic push-up training on muscle strength and thickness. *J Strength Cond Res* 2018 | [PubMed 29466268](https://pubmed.ncbi.nlm.nih.gov/29466268/) | B |
| S9 | Ebben WP et al. Kinetic analysis of several variations of push-ups. *J Strength Cond Res* 2011;25(10):2891–2894 (% values from secondary summaries) | [Breaking Muscle summary](https://breakingmuscle.com/fitness/kinetic-analysis-of-the-push-up-which-version-is-hardest), [conference abstract](https://ojs.ub.uni-konstanz.de/cpa/article/view/4457) | B |
| S10 | Wewege M et al. The effects of HIIT vs moderate-intensity continuous training on body composition in overweight and obese adults. *Obes Rev* 2017;18(6):635–646 | [PubMed 28401638](https://pubmed.ncbi.nlm.nih.gov/28401638/) | A |
| S11 | Scoubeau C et al. Effectiveness of whole-body HIIT on health-related fitness. *Int J Environ Res Public Health* 2022;19:9559 | [PMC9367756](https://pmc.ncbi.nlm.nih.gov/articles/PMC9367756) | A |
| S12 | Donnelly JE et al. ACSM position stand: appropriate physical activity intervention strategies for weight loss and prevention of weight regain. *Med Sci Sports Exerc* 2009 | [PubMed 19127177](https://pubmed.ncbi.nlm.nih.gov/19127177/) | A |
| S13 | Lopez P et al. Resistance training effectiveness on body composition and body weight outcomes in individuals with overweight and obesity. *Obes Rev* 2022;23(5):e13428 | [UWA record](https://research-repository.uwa.edu.au/en/publications/resistance-training-effectiveness-on-body-composition-and-body-we/) | A |
| S14 | Singer A, Schoenfeld BJ et al. Give it a rest: Bayesian meta-analysis on inter-set rest interval and hypertrophy. *Front Sports Act Living* 2024 | [Frontiers](https://www.frontiersin.org/articles/10.3389/fspor.2024.1429789/full) | A |
| S15 | Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. Loading recommendations for muscle strength, hypertrophy and local endurance: a re-examination of the repetition continuum. *Sports* 2021;9(2):32 | [VU repository](https://vuir.vu.edu.au/42418/) | A (narrative review; treat as B) |
| S16 | Fenwick CMJ et al. Comparison of different rowing exercises. *J Strength Cond Res* 2009 | [PDF](https://www.backfitpro.com/medical-scientific-articles/2009/[80]Fenwick,C.M.J.(2009)Comparison-of-different-rowing-exercises[J.Strength-and-Cond.].pdf) | B |
| S17 | McGill SM — spine load in sit-ups vs curl-up / side bridge (secondary summaries only) | [Michigan Today](https://michigantoday.umich.edu/2016/08/17/just-say-no-to-sit-ups) | C |
| S18 | Plyometric progression for beginners (NSCA-based study guides; position statement not reached) | [PT Pioneer CSCS ch. 18](https://www.ptpioneer.com/personal-training/certifications/nsca-cscs/cscs-chapter-18/) | C |
| S19 | Lally P et al. How are habits formed. *Eur J Soc Psychol* 2010;40(6):998–1009 | [BPS digest](https://bps.org.uk/research-digest/how-form-habit) | B |
| S20 | Kaushal N, Rhodes RE. Exercise habit formation in new gym members: a longitudinal study. *J Behav Med* 2015 | [PubMed 25851609](https://pubmed.ncbi.nlm.nih.gov/25851609/) | B |
| S21 | Steele J et al. Slow and steady, or hard and fast? Interval vs continuous training on body composition. *Sports* 2021 (reports Viana 2019 was retracted — retraction notice not seen) | [PMC8619923](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8619923/) | A |
| S22 | Bulgarian split squat vs back squat (small biomechanics/EMG studies; secondary summaries) | [Georgia Southern record](https://scholars.georgiasouthern.edu/en/publications/biomechanical-differences-between-the-bulgarian-split-squat-and-b/) | C |
| C | Coaching convention (regression → progression order, dead hang → negatives → pull-up, pike → handstand push-up). Widely used; no controlled trial found for the order | — | C |

## 8. Risks (premortem)

- **R1 — All sources search only.** A number could be slightly off. Mitigation: grades and links are
  listed; re-open when the network allows (Q-D).
- **R2 — Pacing drift.** New `all` rules (lunge, burpee, jump rope) could slow unlocks for a casual
  user. Mitigation: `npm run balance` steady + casual before merge.
- **R3 — Secret jump moves for a day-2 beginner** (skater jump). Mitigation: softer cue now; Q-C.
- **R4 — Incline height changes difficulty**, so records can be "beaten" by raising the hands.
  Mitigation: cue + note field suggestion.
- **R5 — Records on weighted moves used as gates** (`measure: "reps"`) can be met with a very light
  weight. Accepted: the goal is pattern practice, and `level` gates still apply. [Design choice]
