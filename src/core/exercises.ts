import type { Exercise } from './types';

// The unlock ladder. Order inside a tier does not matter; the rule decides.
// Science basis (movement-pattern progressions, sources S1..S22, grades): docs/research/EXERCISE-LADDER.md
// Session counts in the rules are game pacing: [Design choice], checked with `npm run balance`.
// Design notes and the reasons for each step: docs/GAME-DESIGN.md
// To add an exercise, follow .claude/skills/add-exercise/SKILL.md and run `npm run balance`.

export { EQUIPMENT } from './equipment';

export const TIER_NAMES = ['Secret', 'Starter', 'Habit', 'Builder', 'Strong', 'Advanced', 'Legend'];

export const EXERCISES: Exercise[] = [
  // Tier 1 - Starter: day 1 at home, no equipment.
  // Horizontal push, step 1 (regression). Higher hands = easier (wall → table → chair). Keep the same height until you pass 15, then go lower [S9, S7]
  { id: 'incline_push_up', name: 'Incline push-up', measures: ['reps'], equipment: [], muscles: ['chest', 'triceps', 'shoulders'], focus: ['chest', 'arms'], goals: ['muscle', 'lean'], tier: 1, unlock: { type: 'start' }, cue: 'Hands on a wall, table or sturdy chair. Body straight, chest to the edge, push away.', demo: 'Incline_Push-Up' },
  // Horizontal push, step 2 (≈64% body mass) [S7, S8, S9]
  { id: 'push_up', name: 'Push-up', measures: ['reps'], equipment: [], muscles: ['chest', 'triceps', 'shoulders'], focus: ['chest', 'arms', 'shoulders'], goals: ['muscle', 'strength', 'lean'], tier: 1, unlock: { type: 'start' }, cue: 'Body straight like a plank. Chest close to the floor, then push up.', demo: 'Pushups' },
  // Outdoor cardio base. Walk ↔ run intervals [S3, S11]
  { id: 'run', name: 'Run / walk', measures: ['distance', 'time'], equipment: [], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['lose_weight', 'stamina', 'lean'], tier: 1, unlock: { type: 'start' }, cue: 'Run when you can, walk when you must. Log the km at the end.' },
  // Home cardio base (day 1 at home). Regression: march in place [S3; MET [No source found]]
  { id: 'run_in_place', name: 'Run in place', measures: ['time'], equipment: [], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['lose_weight', 'stamina'], tier: 1, unlock: { type: 'start' }, cue: 'Light, quick steps on the balls of your feet. March if you need a break.' },

  // Tier 2 - Habit: unlocked by showing up, plus the first easy progressions.
  // Squat pattern, step 1 [S1]
  { id: 'squat', name: 'Bodyweight squat', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'lean'], tier: 2, unlock: { type: 'streak', days: 2 }, cue: 'Feet shoulder-width. Sit back until thighs are level, chest up.', demo: 'Bodyweight_Squat' },
  // Hip flexion / low-impact cardio, step 1 (Renz already does these) [S4 (moderate calisthenics, by class)]
  { id: 'knee_raise', name: 'Standing knee raise', measures: ['reps', 'time'], equipment: [], muscles: ['core', 'hip flexors'], focus: ['core', 'cardio'], goals: ['stamina', 'lose_weight'], tier: 2, unlock: { type: 'sessions', count: 3 }, cue: 'Stand tall. Drive one knee to hip height, switch. Count both legs.' },
  // Home cardio, step 2 (first impact move; teaches soft landings). Regression: step-jacks [S4 (7.5 MET), S11, S18]
  { id: 'jumping_jack', name: 'Jumping jack', measures: ['time', 'reps'], equipment: [], muscles: ['legs', 'shoulders', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina', 'lose_weight', 'lean'], tier: 2, unlock: { type: 'sessions', count: 4 }, cue: 'Jump feet out as arms go up, jump back in. Land soft. Step side to side if jumping hurts.' },
  // Core anti-extension, step 1 (low spine load) [S17, S4]
  { id: 'dead_bug', name: 'Dead bug', measures: ['reps'], equipment: [], muscles: ['core'], focus: ['core'], goals: ['stamina'], tier: 2, unlock: { type: 'sessions', count: 5 }, cue: 'On your back, arms up, knees over hips. Lower opposite arm and leg slowly, low back stays down. Count both sides.', demo: 'Dead_Bug' },
  // Trunk flexion. Kept for Renz's data; not a gate for anything [S17 (spine load caution)]
  { id: 'sit_up', name: 'Sit-up', measures: ['reps'], equipment: [], muscles: ['core'], focus: ['core'], goals: ['stamina'], tier: 2, unlock: { type: 'any', rules: [{ type: 'streak', days: 4 }, { type: 'sessions', count: 7 }] }, cue: 'Knees bent, feet flat. Curl up slowly; do not pull your neck. Stop if your back hurts.', demo: 'Sit-Up' },
  // Core anti-extension, step 2 (hold) [S4 (2.8 MET), S17]
  { id: 'plank', name: 'Plank', measures: ['time'], equipment: [], muscles: ['core', 'shoulders'], focus: ['core', 'shoulders'], goals: ['stamina', 'strength'], tier: 2, unlock: { type: 'any', rules: [{ type: 'record', exerciseId: 'push_up', value: 12 }, { type: 'record', exerciseId: 'dead_bug', value: 12 }] }, cue: 'Forearms down, body in one line. Squeeze glutes, breathe.', demo: 'Plank' },

  // Tier 3 - Builder: the next step of each movement pattern; first equipment moves.
  // Hinge (hip), step 1 [S1]
  { id: 'glute_bridge', name: 'Glute bridge', measures: ['reps'], equipment: [], muscles: ['glutes', 'hamstrings'], focus: ['legs'], goals: ['muscle', 'lean'], tier: 3, unlock: { type: 'sessions', count: 8 }, cue: 'Lie on your back, push through heels, squeeze at the top.', demo: 'Butt_Lift_Bridge' },
  // Squat pattern, step 2 (one leg, static, easier balance than a lunge) [S22]
  { id: 'split_squat', name: 'Split squat', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'record', exerciseId: 'squat', value: 15 }, cue: 'Long stance, back heel up. Drop the back knee straight down. Count both legs.' },
  // Squat pattern, step 3 (moving, more balance) [S22, S4]
  { id: 'lunge', name: 'Lunge', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'lean', 'stamina'], tier: 3, unlock: { type: 'all', rules: [{ type: 'any', rules: [{ type: 'streak', days: 6 }, { type: 'sessions', count: 12 }] }, { type: 'record', exerciseId: 'split_squat', value: 10 }] }, cue: 'Long step, both knees to 90 degrees. Count both legs.', demo: 'Bodyweight_Walking_Lunge' },
  // Hip flexion, step 2 (longer lever; needs dead-bug control). Renz already does these [S17]
  { id: 'leg_raise', name: 'Lying leg raise', measures: ['reps'], equipment: [], muscles: ['core', 'hip flexors'], focus: ['core'], goals: ['stamina', 'strength'], tier: 3, unlock: { type: 'record', exerciseId: 'dead_bug', value: 16 }, cue: 'On your back, hands under hips. Raise straight legs, lower slowly, low back stays down.' },
  // Moving plank / conditioning [S11]
  { id: 'mountain_climber', name: 'Mountain climber', measures: ['reps', 'time'], equipment: [], muscles: ['core', 'shoulders', 'heart'], focus: ['core', 'cardio'], goals: ['stamina', 'lose_weight', 'lean'], tier: 3, unlock: { type: 'record', exerciseId: 'plank', value: 45 }, cue: 'High plank. Drive knees to chest fast. Count both legs.', demo: 'Mountain_Climbers' },
  // Home cardio, step 3 (harder run in place) [S11, S18; MET [No source found]]
  { id: 'high_knees', name: 'High knees', measures: ['time', 'reps'], equipment: [], muscles: ['legs', 'hip flexors', 'heart'], focus: ['cardio', 'legs', 'core'], goals: ['stamina', 'lose_weight', 'lean'], tier: 3, unlock: { type: 'record', exerciseId: 'run_in_place', value: 90 }, cue: 'Run in place, knees to hip height, quick light steps. Land soft.' },
  // Whole-body conditioning, built from push-up + squat [S4 (7.5 MET), S11]
  { id: 'burpee', name: 'Burpee', measures: ['reps', 'time'], equipment: [], muscles: ['full body', 'heart'], focus: ['cardio', 'chest', 'legs'], goals: ['lose_weight', 'stamina', 'lean'], tier: 3, unlock: { type: 'all', rules: [{ type: 'level', level: 5 }, { type: 'record', exerciseId: 'push_up', value: 8 }, { type: 'record', exerciseId: 'squat', value: 15 }] }, cue: 'Squat, jump feet back, push-up, jump feet in, jump up. Step instead of jump to start.' },
  // Cardio with impact, after landing practice [S4 (11.0 MET), S18]
  { id: 'jump_rope', name: 'Jump rope', measures: ['time', 'reps'], equipment: ['jump_rope'], muscles: ['calves', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina', 'lose_weight', 'lean'], tier: 3, unlock: { type: 'all', rules: [{ type: 'sessions', count: 10 }, { type: 'record', exerciseId: 'jumping_jack', value: 60 }] }, cue: 'Small hops, wrists turn the rope, elbows close.', demo: 'Rope_Jumping' },
  // Core anti-side-bend (time one side) [S17]
  { id: 'side_plank', name: 'Side plank', measures: ['time'], equipment: [], muscles: ['obliques', 'shoulders'], focus: ['core'], goals: ['stamina', 'strength'], tier: 3, unlock: { type: 'record', exerciseId: 'plank', value: 30 }, cue: 'On one forearm, feet stacked, hips high in one line. Time one side, then the other.', demo: 'Side_Bridge' },
  // Vertical push, step 1 (home shoulder press) [C]
  { id: 'pike_push_up', name: 'Pike push-up', measures: ['reps'], equipment: [], muscles: ['shoulders', 'triceps'], focus: ['shoulders', 'arms'], goals: ['muscle', 'strength'], tier: 3, unlock: { type: 'record', exerciseId: 'push_up', value: 12 }, cue: 'Hips high, body in an upside-down V. Lower your head toward the floor between your hands, push up.' },
  // Hinge, step 2 (one leg) [C]
  { id: 'single_leg_glute_bridge', name: 'Single-leg glute bridge', measures: ['reps'], equipment: [], muscles: ['glutes', 'hamstrings'], focus: ['legs'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'record', exerciseId: 'glute_bridge', value: 20 }, cue: 'One foot down, other leg up. Push through the heel, hips level. Count both legs.', demo: 'Single_Leg_Glute_Bridge' },
  // Horizontal pull at home, step 1 [S2 (equipment type not decisive), C]
  { id: 'band_row', name: 'Band row', measures: ['reps'], equipment: ['resistance_band'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['muscle', 'lean'], tier: 3, unlock: { type: 'sessions', count: 7 }, cue: 'Band anchored at chest height. Pull elbows back, squeeze shoulder blades, return slowly.' },
  // Vertical pull, step 1 (grip and shoulder base) [C]
  { id: 'dead_hang', name: 'Dead hang', measures: ['time'], equipment: ['pullup_bar'], muscles: ['grip', 'shoulders', 'back'], focus: ['back', 'arms'], goals: ['strength'], tier: 3, unlock: { type: 'sessions', count: 8 }, cue: 'Hang with straight arms, shoulders pulled slightly down. Step down, do not drop.' },
  // Horizontal pull with load. Moved earlier: multi-joint before single-joint [S1, S2]
  { id: 'db_row', name: 'Dumbbell row', measures: ['weight', 'reps'], equipment: ['dumbbell'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'sessions', count: 6 }, cue: 'Flat back, pull the weight to your hip, lower slowly.', demo: 'One-Arm_Dumbbell_Row' },
  // Single-joint arm move, after the rows and presses [S1]
  { id: 'db_curl', name: 'Dumbbell curl', measures: ['weight', 'reps'], equipment: ['dumbbell'], muscles: ['biceps'], focus: ['arms'], goals: ['muscle'], tier: 3, unlock: { type: 'sessions', count: 14 }, cue: 'Elbows fixed at your sides. Lift, then lower slowly.', demo: 'Dumbbell_Bicep_Curl' },
  // Vertical push with load [S1]
  { id: 'db_press', name: 'Dumbbell shoulder press', measures: ['weight', 'reps'], equipment: ['dumbbell'], muscles: ['shoulders', 'triceps'], focus: ['shoulders', 'arms'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'sessions', count: 12 }, cue: 'Start at shoulders, press straight up, do not arch your back.', demo: 'Dumbbell_Shoulder_Press' },
  // Hinge with load, step 3 (teaches the deadlift) [S1, C]
  { id: 'db_rdl', name: 'Dumbbell Romanian deadlift', measures: ['weight', 'reps'], equipment: ['dumbbell'], muscles: ['hamstrings', 'glutes', 'back'], focus: ['legs', 'back'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'all', rules: [{ type: 'sessions', count: 10 }, { type: 'record', exerciseId: 'glute_bridge', value: 15 }] }, cue: 'Soft knees, push hips back, weights slide down your thighs. Flat back. Start light.' },
  // Horizontal pull, step 2 (bodyweight). Bar at waist height [S16]
  { id: 'inverted_row', name: 'Inverted row', measures: ['reps'], equipment: ['squat_rack'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'sessions', count: 10 }, cue: 'Bar at waist height, body straight, heels down. Pull chest to bar, lower slowly.', demo: 'Inverted_Row' },
  // Gym cardio [S3, S10]
  { id: 'treadmill_run', name: 'Treadmill run', measures: ['distance', 'time'], equipment: ['treadmill'], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['lose_weight', 'stamina', 'lean'], tier: 3, unlock: { type: 'sessions', count: 9 }, cue: 'Same as a run. Log the km from the screen.', demo: 'Running_Treadmill' },
  // Gym cardio, no impact [S3, S10]
  { id: 'bike', name: 'Stationary bike', measures: ['distance', 'time'], equipment: ['stationary_bike'], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['lose_weight', 'stamina'], tier: 3, unlock: { type: 'sessions', count: 11 }, cue: 'Seat at hip height. Steady cadence. Log the km.', demo: 'Bicycling_Stationary' },
  // Vertical pull with a machine (gym regression of the pull-up) [S2]
  { id: 'lat_pulldown', name: 'Lat pulldown', measures: ['weight', 'reps'], equipment: ['cable_machine'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['muscle', 'strength', 'lean'], tier: 3, unlock: { type: 'sessions', count: 12 }, cue: 'Pull the bar to your upper chest, elbows down and back.', demo: 'Wide-Grip_Lat_Pulldown' },

  // Tier 4 - Strong: earned by records in the easier version of the same pattern.
  // Horizontal push, step 3 (≈70–74% body mass) [S9]
  { id: 'decline_push_up', name: 'Decline push-up', measures: ['reps'], equipment: [], muscles: ['chest', 'shoulders', 'triceps'], focus: ['chest', 'shoulders', 'arms'], goals: ['muscle', 'strength'], tier: 4, unlock: { type: 'record', exerciseId: 'push_up', value: 15 }, cue: 'Feet on a chair or step, hands on the floor. Body straight, chest down, push up.', demo: 'Decline_Push-Up' },
  // Horizontal push, triceps branch [C]
  { id: 'diamond_push_up', name: 'Diamond push-up', measures: ['reps'], equipment: [], muscles: ['triceps', 'chest'], focus: ['arms', 'chest'], goals: ['muscle', 'strength'], tier: 4, unlock: { type: 'record', exerciseId: 'push_up', value: 25 }, cue: 'Hands together under your chest, elbows close to the body.' },
  // Vertical push down (dip) [C]
  { id: 'dips', name: 'Dips', measures: ['reps'], equipment: ['dip_bars'], muscles: ['triceps', 'chest'], focus: ['arms', 'chest'], goals: ['muscle', 'strength'], tier: 4, unlock: { type: 'record', exerciseId: 'push_up', value: 25 }, cue: 'Lower until elbows are at 90 degrees, push back up. Stop if your shoulder hurts.', demo: 'Parallel_Bar_Dip' },
  // Squat pattern, power branch (after squat volume) [S18]
  { id: 'jump_squat', name: 'Jump squat', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes', 'heart'], focus: ['legs', 'cardio'], goals: ['stamina', 'lose_weight'], tier: 4, unlock: { type: 'record', exerciseId: 'squat', value: 30 }, cue: 'Squat down, jump up, land soft and go straight into the next.', demo: 'Freehand_Jump_Squat' },
  // Squat with load, step 1 [S1]
  { id: 'goblet_squat', name: 'Goblet squat', measures: ['weight', 'reps'], equipment: ['dumbbell'], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'strength', 'lean'], tier: 4, unlock: { type: 'record', exerciseId: 'squat', value: 20 }, cue: 'Hold one dumbbell at your chest. Squat deep, chest up.', demo: 'Goblet_Squat' },
  // Squat pattern, step 4 (rear foot raised; most one-leg load before a pistol) [S22]
  { id: 'bulgarian_split_squat', name: 'Bulgarian split squat', measures: ['reps', 'weight'], equipment: [], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'strength', 'lean'], tier: 4, unlock: { type: 'record', exerciseId: 'split_squat', value: 16 }, cue: 'Back foot on a chair or bench. Lower the back knee straight down, front foot flat. Count both legs.', demo: 'Split_Squat_with_Dumbbells' },
  // Vertical pull, step 2 (lowering only) [C]
  { id: 'negative_pull_up', name: 'Negative pull-up', measures: ['reps'], equipment: ['pullup_bar'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['strength', 'muscle'], tier: 4, unlock: { type: 'record', exerciseId: 'dead_hang', value: 30 }, cue: 'Step up so your chin is over the bar. Lower yourself slowly, about 3–5 seconds. Step down.' },
  // Vertical pull, step 3 [C]
  { id: 'pull_up', name: 'Pull-up', measures: ['reps'], equipment: ['pullup_bar'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['strength', 'muscle'], tier: 4, unlock: { type: 'record', exerciseId: 'negative_pull_up', value: 5 }, cue: 'Hang with straight arms, pull chin over the bar, lower slowly.', demo: 'Pullups' },
  // Horizontal push with a barbell [S2, S7]
  { id: 'bench_press', name: 'Bench press', measures: ['weight', 'reps'], equipment: ['barbell', 'bench'], muscles: ['chest', 'triceps'], focus: ['chest', 'arms'], goals: ['strength', 'muscle'], tier: 4, unlock: { type: 'all', rules: [{ type: 'sessions', count: 15 }, { type: 'record', exerciseId: 'push_up', value: 15 }] }, cue: 'Feet flat, bar to mid-chest, press up. Use a spotter for heavy sets.', demo: 'Barbell_Bench_Press_-_Medium_Grip' },
  // Squat with a barbell [S2]
  { id: 'barbell_squat', name: 'Barbell back squat', measures: ['weight', 'reps'], equipment: ['barbell'], muscles: ['quads', 'glutes', 'back'], focus: ['legs'], goals: ['strength', 'muscle'], tier: 4, unlock: { type: 'all', rules: [{ type: 'sessions', count: 15 }, { type: 'record', exerciseId: 'squat', value: 25 }] }, cue: 'Bar on upper back, brace, sit down to parallel, stand up. Start light; use a rack.', demo: 'Barbell_Squat' },
  // Squat pattern on a machine [S2]
  { id: 'leg_press', name: 'Leg press', measures: ['weight', 'reps'], equipment: ['leg_press'], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'strength'], tier: 4, unlock: { type: 'sessions', count: 16 }, cue: 'Feet mid-plate. Lower until knees reach 90 degrees. Do not lock knees.', demo: 'Leg_Press' },

  // Tier 5 - Advanced
  // Hinge with a barbell, last step [S2, C]
  { id: 'deadlift', name: 'Deadlift', measures: ['weight', 'reps'], equipment: ['barbell'], muscles: ['back', 'glutes', 'hamstrings'], focus: ['back', 'legs'], goals: ['strength', 'muscle'], tier: 5, unlock: { type: 'all', rules: [{ type: 'level', level: 10 }, { type: 'any', rules: [{ type: 'record', exerciseId: 'db_rdl', value: 10, measure: 'reps' }, { type: 'record', exerciseId: 'single_leg_glute_bridge', value: 15 }] }] }, cue: 'Bar over mid-foot, flat back, push the floor away. Start light.', demo: 'Barbell_Deadlift' },
  // Vertical push with a barbell [S2, C]
  { id: 'overhead_press', name: 'Barbell overhead press', measures: ['weight', 'reps'], equipment: ['barbell'], muscles: ['shoulders', 'triceps'], focus: ['shoulders', 'arms'], goals: ['strength', 'muscle'], tier: 5, unlock: { type: 'all', rules: [{ type: 'level', level: 12 }, { type: 'any', rules: [{ type: 'record', exerciseId: 'db_press', value: 8, measure: 'reps' }, { type: 'record', exerciseId: 'pike_push_up', value: 10 }] }] }, cue: 'Bar at collarbone, squeeze glutes, press straight up. Start light.', demo: 'Standing_Military_Press' },
  // Squat pattern, last step (one-leg strength, not jump power, is the base) [S22, C]
  { id: 'pistol_squat', name: 'Pistol squat (assisted ok)', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes', 'balance'], focus: ['legs'], goals: ['strength'], tier: 5, unlock: { type: 'record', exerciseId: 'bulgarian_split_squat', value: 20 }, cue: 'One leg out in front, sit down slowly. Hold a door frame at first.' },
  // Hip flexion, last step (needs the leg raise and the grip) [C]
  { id: 'hanging_leg_raise', name: 'Hanging leg raise', measures: ['reps'], equipment: ['pullup_bar'], muscles: ['core', 'hip flexors'], focus: ['core'], goals: ['strength'], tier: 5, unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'leg_raise', value: 15 }, { type: 'record', exerciseId: 'dead_hang', value: 30 }] }, cue: 'Hang still, raise straight legs to hip height, lower slowly. Bend knees to make it easier.', demo: 'Hanging_Leg_Raise' },
  // Horizontal push, one-arm-biased step [S9, C]
  { id: 'archer_push_up', name: 'Archer push-up', measures: ['reps'], equipment: [], muscles: ['chest', 'triceps'], focus: ['chest', 'arms'], goals: ['strength', 'muscle'], tier: 5, unlock: { type: 'any', rules: [{ type: 'record', exerciseId: 'diamond_push_up', value: 20 }, { type: 'record', exerciseId: 'decline_push_up', value: 20 }] }, cue: 'Wide hands, shift your weight to one arm, the other stays straight.' },
  // Core anti-extension, last step [C]
  { id: 'ab_rollout', name: 'Ab wheel rollout (knees)', measures: ['reps'], equipment: ['ab_wheel'], muscles: ['core', 'shoulders'], focus: ['core'], goals: ['strength'], tier: 5, unlock: { type: 'record', exerciseId: 'plank', value: 90 }, cue: 'On your knees, roll out only as far as your back stays flat, roll back. Start short.', demo: 'Ab_Roller' },

  // Tier 6 - Legend
  // Vertical pull + dip, top skill [C]
  { id: 'muscle_up', name: 'Muscle-up', measures: ['reps'], equipment: ['pullup_bar'], muscles: ['back', 'chest', 'triceps'], focus: ['back', 'arms', 'chest'], goals: ['strength'], tier: 6, unlock: { type: 'record', exerciseId: 'pull_up', value: 12 }, cue: 'Explosive pull-up, lean over the bar, press to straight arms.' },
  // Vertical push, last step [C]
  { id: 'handstand_push_up', name: 'Wall handstand push-up', measures: ['reps'], equipment: [], muscles: ['shoulders', 'triceps'], focus: ['shoulders', 'arms'], goals: ['strength'], tier: 6, unlock: { type: 'all', rules: [{ type: 'level', level: 20 }, { type: 'record', exerciseId: 'pike_push_up', value: 15 }] }, cue: 'Handstand against a wall, lower head to a pad, press up. Have a spotter at first.', demo: 'Handstand_Push-Ups' },

  // ---- Round 2 (2026-11-18): variations of base moves and running variations (docs/research/EXERCISE-LADDER.md, Round 2) ----
  // Round 2: push_up (regression) [S9 (≈49% body mass, between incline and floor), S7 (opened)]
  { id: 'knee_push_up', name: 'Knee push-up', measures: ['reps'], equipment: [], muscles: ['chest', 'triceps', 'shoulders'], focus: ['chest', 'arms'], goals: ['muscle', 'lean'], tier: 1, base: 'push_up', unlock: { type: 'start' }, cue: 'Knees on a mat, body straight from knees to head. Chest to the floor, push up.' },
  // Round 2: variation of push_up [S31, C]
  { id: 'wide_push_up', name: 'Wide push-up', measures: ['reps'], equipment: [], muscles: ['chest', 'shoulders', 'triceps'], focus: ['chest', 'shoulders'], goals: ['muscle', 'lean'], tier: 3, base: 'push_up', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'push_up', value: 10 }, { type: 'sessions', count: 6 }] }, cue: 'Hands a little wider than shoulders, body straight, chest down, push up. Stop if a shoulder hurts.', demo: 'Push-Up_Wide' },
  // Round 2: variation of push_up [S31 (narrow > wide activation), C]
  { id: 'close_grip_push_up', name: 'Close-grip push-up', measures: ['reps'], equipment: [], muscles: ['triceps', 'chest', 'shoulders'], focus: ['arms', 'chest'], goals: ['muscle', 'strength'], tier: 3, base: 'push_up', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'push_up', value: 12 }, { type: 'record', exerciseId: 'wide_push_up', value: 10 }] }, cue: 'Hands under your shoulders, elbows close to your sides. Body straight, chest down, push up.', demo: 'Push-Ups_-_Close_Triceps_Position' },
  // Round 2: variation of squat [C]
  { id: 'sumo_squat', name: 'Sumo squat', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes', 'adductors'], focus: ['legs'], goals: ['muscle', 'lean'], tier: 3, base: 'squat', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'squat', value: 12 }, { type: 'sessions', count: 6 }] }, cue: 'Feet wide, toes turned out. Knees follow your toes, sit down, chest up.' },
  // Round 2: variation of squat [C]
  { id: 'pause_squat', name: 'Pause squat', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'strength'], tier: 3, base: 'squat', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'squat', value: 20 }, { type: 'sessions', count: 10 }] }, cue: 'Squat down, hold still for 3 seconds at the bottom, stand up. Count only paused reps.' },
  // Round 2: variation of split_squat [S22, C]
  { id: 'reverse_lunge', name: 'Reverse lunge', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes'], focus: ['legs'], goals: ['muscle', 'lean'], tier: 3, base: 'split_squat', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'split_squat', value: 8 }, { type: 'sessions', count: 8 }] }, cue: 'Step back, lower the back knee toward the floor, push through the front heel to stand. Count both legs.' },
  // Round 2: variation of lunge [C]
  { id: 'lateral_lunge', name: 'Side lunge', measures: ['reps'], equipment: [], muscles: ['quads', 'glutes', 'adductors'], focus: ['legs'], goals: ['muscle', 'lean', 'stamina'], tier: 3, base: 'lunge', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'lunge', value: 12 }] }, cue: 'Big step to the side, sit back into that hip, other leg straight. Push back to stand. Count both legs.' },
  // Round 2: variation of plank [S24 (02024), C]
  { id: 'high_plank', name: 'High plank', measures: ['time'], equipment: [], muscles: ['core', 'shoulders', 'chest'], focus: ['core', 'shoulders'], goals: ['stamina', 'strength'], tier: 3, base: 'plank', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'plank', value: 20 }] }, cue: 'Hands under shoulders, arms straight, body in one line. Squeeze glutes, breathe.' },
  // Round 2: variation of plank [C]
  { id: 'plank_shoulder_tap', name: 'Plank shoulder tap', measures: ['reps'], equipment: [], muscles: ['core', 'shoulders'], focus: ['core', 'shoulders'], goals: ['stamina', 'strength'], tier: 3, base: 'plank', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'plank', value: 40 }, { type: 'record', exerciseId: 'push_up', value: 10 }] }, cue: 'High plank, feet wide. Tap one shoulder, then the other; keep hips still. Count both sides.' },
  // Round 2: variation of glute_bridge [C]
  { id: 'marching_glute_bridge', name: 'Marching glute bridge', measures: ['reps'], equipment: [], muscles: ['glutes', 'hamstrings', 'core'], focus: ['legs', 'core'], goals: ['muscle', 'lean'], tier: 3, base: 'glute_bridge', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'glute_bridge', value: 15 }] }, cue: 'Bridge up and stay up. Lift one foot a little, then the other; hips stay level. Count both legs.' },
  // Round 2: variation of glute_bridge [S33]
  { id: 'hip_thrust', name: 'Hip thrust (bodyweight)', measures: ['reps', 'weight'], equipment: [], muscles: ['glutes', 'hamstrings'], focus: ['legs'], goals: ['muscle', 'strength', 'lean'], tier: 3, base: 'glute_bridge', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'glute_bridge', value: 20 }, { type: 'sessions', count: 12 }] }, cue: 'Upper back on a sturdy bench or a sofa against a wall. Push through your heels to a straight line, lower slowly.' },
  // Round 2: variation of band_row [C]
  { id: 'band_pull_apart', name: 'Band pull-apart', measures: ['reps'], equipment: ['resistance_band'], muscles: ['upper back', 'rear shoulders'], focus: ['back', 'shoulders'], goals: ['muscle', 'lean'], tier: 3, base: 'band_row', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'band_row', value: 12 }] }, cue: 'Arms straight at chest height. Pull the band apart to your chest, squeeze shoulder blades, return slowly.', demo: 'Band_Pull_Apart' },
  // Round 2: variation of dead_hang [C]
  { id: 'scapular_pull_up', name: 'Scapular pull-up', measures: ['reps'], equipment: ['pullup_bar'], muscles: ['back', 'shoulders'], focus: ['back'], goals: ['strength'], tier: 3, base: 'dead_hang', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'dead_hang', value: 15 }] }, cue: 'Hang with straight arms. Pull your shoulders down to rise a little, lower slowly. Arms stay straight.', demo: 'Scapular_Pull-Up' },
  // Round 2: variation of negative_pull_up [S32, C]
  { id: 'chin_up', name: 'Chin-up', measures: ['reps'], equipment: ['pullup_bar'], muscles: ['back', 'biceps'], focus: ['back', 'arms'], goals: ['strength', 'muscle'], tier: 4, base: 'negative_pull_up', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'negative_pull_up', value: 4 }] }, cue: 'Palms facing you, hands shoulder-width. Pull chin over the bar, lower slowly.', demo: 'Chin-Up' },
  // Round 2: variation of dead_bug [S17]
  { id: 'bird_dog', name: 'Bird dog', measures: ['reps'], equipment: [], muscles: ['core', 'lower back', 'glutes'], focus: ['core', 'back'], goals: ['stamina'], tier: 2, base: 'dead_bug', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'dead_bug', value: 10 }] }, cue: 'On hands and knees, back flat. Reach one arm and the opposite leg out long, hold 2 seconds, switch. Count both sides.' },
  // Round 2: variation of dead_bug [C]
  { id: 'hollow_hold', name: 'Hollow hold', measures: ['time'], equipment: [], muscles: ['core'], focus: ['core'], goals: ['strength', 'stamina'], tier: 3, base: 'dead_bug', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'dead_bug', value: 20 }, { type: 'record', exerciseId: 'plank', value: 30 }] }, cue: 'On your back, low back pressed down. Lift shoulders and legs a little and hold. Bend knees to make it easier.' },
  // Round 2: burpee (regression; gated by its parts) [S24 (02214), S11]
  { id: 'half_burpee', name: 'Squat thrust (half burpee)', measures: ['reps', 'time'], equipment: [], muscles: ['full body', 'heart'], focus: ['cardio', 'legs', 'core'], goals: ['lose_weight', 'stamina', 'lean'], tier: 3, base: 'burpee', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'squat', value: 12 }, { type: 'record', exerciseId: 'plank', value: 20 }] }, cue: 'Squat, hands down, step or jump feet back to a plank, back in, stand up. No push-up, no jump.' },
  // Round 2: variation of run [S29 (opened), S25, C]
  { id: 'sprint_100m', name: 'Sprint 100 m', measures: ['speed'], equipment: [], muscles: ['legs', 'glutes', 'hamstrings', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina', 'strength'], tier: 4, base: 'run', unlock: { type: 'all', rules: [{ type: 'any', rules: [{ type: 'record', exerciseId: 'run', value: 3, measure: 'distance' }, { type: 'record', exerciseId: 'treadmill_run', value: 3, measure: 'distance' }] }, { type: 'sessions', count: 15 }] }, cue: 'Warm up 10 minutes. Use a track or a marked flat 100 m. Build up speed over a few runs. Stop if the back of your thigh pulls.' },
  // Round 2: variation of run [C (time trial as a test), S3]
  { id: 'run_1k_time_trial', name: '1 km time trial', measures: ['speed'], equipment: [], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina', 'lose_weight'], tier: 3, base: 'run', unlock: { type: 'all', rules: [{ type: 'any', rules: [{ type: 'record', exerciseId: 'run', value: 1.5, measure: 'distance' }, { type: 'record', exerciseId: 'treadmill_run', value: 1.5, measure: 'distance' }] }, { type: 'sessions', count: 6 }] }, cue: 'Warm up first. Run 1 km at the fastest pace you can hold to the end. Log the time.' },
  // Round 2: variation of run [S26, C]
  { id: 'run_5k_time_trial', name: '5 km time trial', measures: ['speed'], equipment: [], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina', 'lose_weight'], tier: 4, base: 'run', unlock: { type: 'all', rules: [{ type: 'any', rules: [{ type: 'record', exerciseId: 'run', value: 5, measure: 'distance' }, { type: 'record', exerciseId: 'treadmill_run', value: 5, measure: 'distance' }] }, { type: 'sessions', count: 20 }] }, cue: 'Warm up first. Run 5 km at a pace you can hold; walk if you must. Log the total time.' },
  // Round 2: variation of run [S25 (A), S10 (A), S24 (02210); 30 s / 90 s is [Design choice]]
  { id: 'interval_run', name: 'Interval run', measures: ['reps', 'distance'], equipment: [], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina', 'lose_weight', 'lean'], tier: 3, base: 'run', unlock: { type: 'all', rules: [{ type: 'any', rules: [{ type: 'record', exerciseId: 'run', value: 1, measure: 'distance' }, { type: 'record', exerciseId: 'treadmill_run', value: 1, measure: 'distance' }] }, { type: 'sessions', count: 8 }] }, cue: 'Warm up 5 minutes. Run hard (not all-out) 30 s, walk 90 s = 1 rep. Count the hard runs.' },
  // Round 2: variation of run [S28]
  { id: 'cooper_12min', name: '12-minute run (Cooper test)', measures: ['distance'], equipment: [], muscles: ['legs', 'heart'], focus: ['cardio', 'legs'], goals: ['stamina'], tier: 3, base: 'run', unlock: { type: 'all', rules: [{ type: 'any', rules: [{ type: 'record', exerciseId: 'run', value: 2, measure: 'distance' }, { type: 'record', exerciseId: 'treadmill_run', value: 2, measure: 'distance' }] }] }, cue: 'Warm up first. Cover as much ground as you can in 12 minutes; walk if you must. Log the km.' },
  // Round 2: variation of treadmill_run [S23 (17355 = 3.8 flat vs 17035 = 7.0 at 6–10% grade)]
  { id: 'incline_treadmill_walk', name: 'Incline treadmill walk', measures: ['time', 'distance'], equipment: ['treadmill'], muscles: ['legs', 'glutes', 'heart'], focus: ['cardio', 'legs'], goals: ['lose_weight', 'stamina'], tier: 3, base: 'treadmill_run', unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'treadmill_run', value: 1, measure: 'distance' }] }, cue: 'Start with a small incline. Walk tall; hold the rail lightly only for balance. Same incline to compare records.', demo: 'Walking_Treadmill' },

  // Secret - only from mystery chests (surprises).
  // Secret; safe at any level [C]
  { id: 'bear_crawl', name: 'Bear crawl', measures: ['time'], equipment: [], muscles: ['full body'], focus: ['core', 'shoulders', 'cardio'], goals: ['stamina'], tier: 0, unlock: { type: 'secret' }, cue: 'Hands and feet, knees just off the floor. Crawl forward and back.', requires: 'plank' },
  // Secret; isometric squat [C]
  { id: 'wall_sit', name: 'Wall sit', measures: ['time'], equipment: [], muscles: ['quads'], focus: ['legs'], goals: ['stamina'], tier: 0, unlock: { type: 'secret' }, cue: 'Back on the wall, thighs level, hold.', requires: 'squat' },
  // Secret; back extension [C]
  { id: 'superman_hold', name: 'Superman hold', measures: ['time'], equipment: [], muscles: ['lower back', 'glutes'], focus: ['back'], goals: ['stamina'], tier: 0, unlock: { type: 'secret' }, cue: 'Lie face down, lift arms and legs a little, hold.', requires: 'bird_dog', demo: 'Superman' },
  // Secret; low-impact cardio [C]
  { id: 'shadow_boxing', name: 'Shadow boxing', measures: ['time'], equipment: [], muscles: ['shoulders', 'heart'], focus: ['cardio', 'shoulders'], goals: ['stamina', 'lose_weight'], tier: 0, unlock: { type: 'secret' }, cue: 'Guard up, light on your feet, throw fast straight punches.', requires: 'run_in_place' },
  // Secret; one-leg landing (see risk R3) [S18]
  { id: 'skater_jump', name: 'Skater jump', measures: ['reps'], equipment: [], muscles: ['legs', 'balance'], focus: ['legs', 'cardio'], goals: ['stamina', 'lose_weight'], tier: 0, unlock: { type: 'secret' }, cue: 'Leap side to side, land soft on one foot. Step instead of jump to start. Count both sides.', requires: 'jumping_jack', demo: 'Lateral_Bound' },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const STARTER_IDS = EXERCISES.filter((e) => e.unlock.type === 'start').map((e) => e.id);
export const SECRET_IDS = EXERCISES.filter((e) => e.unlock.type === 'secret').map((e) => e.id);
