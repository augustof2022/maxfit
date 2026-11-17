import type { EquipmentId, Exercise } from './types';

// The unlock ladder. Order inside a tier does not matter; the rule decides.
// Design notes and the reasons for each step: docs/GAME-DESIGN.md
// To add an exercise, follow .claude/skills/add-exercise/SKILL.md and run `npm run balance`.

export const EQUIPMENT: { id: EquipmentId; name: string }[] = [
  { id: 'mat', name: 'Exercise mat' },
  { id: 'pullup_bar', name: 'Pull-up bar' },
  { id: 'dip_bars', name: 'Dip bars' },
  { id: 'dumbbell', name: 'Dumbbells' },
  { id: 'kettlebell', name: 'Kettlebell' },
  { id: 'barbell', name: 'Barbell + plates' },
  { id: 'bench', name: 'Bench' },
  { id: 'resistance_band', name: 'Resistance band' },
  { id: 'jump_rope', name: 'Jump rope' },
  { id: 'treadmill', name: 'Treadmill' },
  { id: 'stationary_bike', name: 'Stationary bike' },
  { id: 'cable_machine', name: 'Cable machine' },
  { id: 'leg_press', name: 'Leg press machine' },
];

export const TIER_NAMES = ['Secret', 'Starter', 'Habit', 'Builder', 'Strong', 'Advanced', 'Legend'];

export const EXERCISES: Exercise[] = [
  // Tier 1 - Starter: two moves only, so the first day is easy to start.
  { id: 'push_up', name: 'Push-up', metric: 'reps', equipment: [], muscles: ['chest', 'triceps', 'shoulders'], tier: 1, unlock: { type: 'start' }, cue: 'Body straight like a plank. Chest close to the floor, then push up.' },
  { id: 'run', name: 'Run / walk', metric: 'distance', equipment: [], muscles: ['legs', 'heart'], tier: 1, unlock: { type: 'start' }, cue: 'Run when you can, walk when you must. Log the km at the end.' },

  // Tier 2 - Habit: unlocked by showing up (streak and sessions), not by strength.
  { id: 'squat', name: 'Bodyweight squat', metric: 'reps', equipment: [], muscles: ['quads', 'glutes'], tier: 2, unlock: { type: 'streak', days: 2 }, cue: 'Feet shoulder-width. Sit back until thighs are level, chest up.' },
  { id: 'knee_raise', name: 'Standing knee raise', metric: 'reps', equipment: [], muscles: ['core', 'hip flexors'], tier: 2, unlock: { type: 'sessions', count: 3 }, cue: 'Stand tall. Drive one knee to hip height, switch. Count both legs.' },
  { id: 'sit_up', name: 'Sit-up', metric: 'reps', equipment: [], muscles: ['core'], tier: 2, unlock: { type: 'any', rules: [{ type: 'streak', days: 4 }, { type: 'sessions', count: 7 }] }, cue: 'Knees bent, feet flat. Curl up slowly; do not pull your neck.' },
  { id: 'run_in_place', name: 'Run in place', metric: 'time', equipment: [], muscles: ['legs', 'heart'], tier: 2, unlock: { type: 'sessions', count: 5 }, cue: 'Light, quick steps on the balls of your feet. Arms swing.' },
  { id: 'plank', name: 'Plank', metric: 'time', equipment: [], muscles: ['core', 'shoulders'], tier: 2, unlock: { type: 'record', exerciseId: 'push_up', value: 12 }, cue: 'Forearms down, body in one line. Squeeze glutes, breathe.' },

  // Tier 3 - Builder: more volume; the first equipment moves appear.
  { id: 'lunge', name: 'Lunge', metric: 'reps', equipment: [], muscles: ['quads', 'glutes'], tier: 3, unlock: { type: 'any', rules: [{ type: 'streak', days: 6 }, { type: 'sessions', count: 12 }] }, cue: 'Long step, both knees to 90 degrees. Count both legs.' },
  { id: 'glute_bridge', name: 'Glute bridge', metric: 'reps', equipment: [], muscles: ['glutes', 'hamstrings'], tier: 3, unlock: { type: 'sessions', count: 8 }, cue: 'Lie on your back, push through heels, squeeze at the top.' },
  { id: 'mountain_climber', name: 'Mountain climber', metric: 'reps', equipment: [], muscles: ['core', 'heart'], tier: 3, unlock: { type: 'record', exerciseId: 'plank', value: 45 }, cue: 'High plank. Drive knees to chest fast. Count both legs.' },
  { id: 'burpee', name: 'Burpee', metric: 'reps', equipment: [], muscles: ['full body', 'heart'], tier: 3, unlock: { type: 'level', level: 5 }, cue: 'Squat, jump feet back, push-up, jump feet in, jump up.' },
  { id: 'jump_rope', name: 'Jump rope', metric: 'time', equipment: ['jump_rope'], muscles: ['calves', 'heart'], tier: 3, unlock: { type: 'sessions', count: 10 }, cue: 'Small hops, wrists turn the rope, elbows close.' },
  { id: 'db_curl', name: 'Dumbbell curl', metric: 'weight_reps', equipment: ['dumbbell'], muscles: ['biceps'], tier: 3, unlock: { type: 'sessions', count: 6 }, cue: 'Elbows fixed at your sides. Lift, then lower slowly.' },
  { id: 'db_press', name: 'Dumbbell shoulder press', metric: 'weight_reps', equipment: ['dumbbell'], muscles: ['shoulders', 'triceps'], tier: 3, unlock: { type: 'sessions', count: 12 }, cue: 'Start at shoulders, press straight up, do not arch your back.' },
  { id: 'db_row', name: 'Dumbbell row', metric: 'weight_reps', equipment: ['dumbbell'], muscles: ['back', 'biceps'], tier: 3, unlock: { type: 'sessions', count: 14 }, cue: 'Flat back, pull the weight to your hip, lower slowly.' },
  { id: 'treadmill_run', name: 'Treadmill run', metric: 'distance', equipment: ['treadmill'], muscles: ['legs', 'heart'], tier: 3, unlock: { type: 'sessions', count: 9 }, cue: 'Same as a run. Log the km from the screen.' },
  { id: 'bike', name: 'Stationary bike', metric: 'distance', equipment: ['stationary_bike'], muscles: ['legs', 'heart'], tier: 3, unlock: { type: 'sessions', count: 11 }, cue: 'Seat at hip height. Steady cadence. Log the km.' },

  // Tier 4 - Strong: earned by records, so strength comes before harder moves.
  { id: 'pull_up', name: 'Pull-up', metric: 'reps', equipment: ['pullup_bar'], muscles: ['back', 'biceps'], tier: 4, unlock: { type: 'record', exerciseId: 'push_up', value: 20 }, cue: 'Hang with straight arms, pull chin over the bar, lower slowly.' },
  { id: 'diamond_push_up', name: 'Diamond push-up', metric: 'reps', equipment: [], muscles: ['triceps', 'chest'], tier: 4, unlock: { type: 'record', exerciseId: 'push_up', value: 25 }, cue: 'Hands together under your chest, elbows close to the body.' },
  { id: 'jump_squat', name: 'Jump squat', metric: 'reps', equipment: [], muscles: ['quads', 'glutes', 'heart'], tier: 4, unlock: { type: 'record', exerciseId: 'squat', value: 30 }, cue: 'Squat down, jump up, land soft and go straight into the next.' },
  { id: 'goblet_squat', name: 'Goblet squat', metric: 'weight_reps', equipment: ['dumbbell'], muscles: ['quads', 'glutes'], tier: 4, unlock: { type: 'record', exerciseId: 'squat', value: 20 }, cue: 'Hold one dumbbell at your chest. Squat deep, chest up.' },
  { id: 'dips', name: 'Dips', metric: 'reps', equipment: ['dip_bars'], muscles: ['triceps', 'chest'], tier: 4, unlock: { type: 'record', exerciseId: 'push_up', value: 25 }, cue: 'Lower until elbows are at 90 degrees, push back up.' },
  { id: 'bench_press', name: 'Bench press', metric: 'weight_reps', equipment: ['barbell', 'bench'], muscles: ['chest', 'triceps'], tier: 4, unlock: { type: 'all', rules: [{ type: 'sessions', count: 15 }, { type: 'record', exerciseId: 'push_up', value: 15 }] }, cue: 'Feet flat, bar to mid-chest, press up. Use a spotter for heavy sets.' },
  { id: 'barbell_squat', name: 'Barbell back squat', metric: 'weight_reps', equipment: ['barbell'], muscles: ['quads', 'glutes', 'back'], tier: 4, unlock: { type: 'all', rules: [{ type: 'sessions', count: 15 }, { type: 'record', exerciseId: 'squat', value: 25 }] }, cue: 'Bar on upper back, brace, sit down to parallel, stand up.' },
  { id: 'leg_press', name: 'Leg press', metric: 'weight_reps', equipment: ['leg_press'], muscles: ['quads', 'glutes'], tier: 4, unlock: { type: 'sessions', count: 16 }, cue: 'Feet mid-plate. Lower until knees reach 90 degrees. Do not lock knees.' },
  { id: 'lat_pulldown', name: 'Lat pulldown', metric: 'weight_reps', equipment: ['cable_machine'], muscles: ['back', 'biceps'], tier: 4, unlock: { type: 'sessions', count: 18 }, cue: 'Pull the bar to your upper chest, elbows down and back.' },

  // Tier 5 - Advanced
  { id: 'deadlift', name: 'Deadlift', metric: 'weight_reps', equipment: ['barbell'], muscles: ['back', 'glutes', 'hamstrings'], tier: 5, unlock: { type: 'all', rules: [{ type: 'level', level: 10 }, { type: 'any', rules: [{ type: 'streak', days: 5 }, { type: 'sessions', count: 40 }] }] }, cue: 'Bar over mid-foot, flat back, push the floor away. Start light.' },
  { id: 'overhead_press', name: 'Barbell overhead press', metric: 'weight_reps', equipment: ['barbell'], muscles: ['shoulders', 'triceps'], tier: 5, unlock: { type: 'level', level: 12 }, cue: 'Bar at collarbone, squeeze glutes, press straight up.' },
  { id: 'pistol_squat', name: 'Pistol squat (assisted ok)', metric: 'reps', equipment: [], muscles: ['quads', 'glutes', 'balance'], tier: 5, unlock: { type: 'record', exerciseId: 'jump_squat', value: 20 }, cue: 'One leg out in front, sit down slowly. Hold a door frame at first.' },
  { id: 'hanging_leg_raise', name: 'Hanging leg raise', metric: 'reps', equipment: ['pullup_bar'], muscles: ['core'], tier: 5, unlock: { type: 'all', rules: [{ type: 'record', exerciseId: 'knee_raise', value: 30 }, { type: 'record', exerciseId: 'plank', value: 90 }] }, cue: 'Hang still, raise straight legs to hip height, lower slowly.' },
  { id: 'archer_push_up', name: 'Archer push-up', metric: 'reps', equipment: [], muscles: ['chest', 'triceps'], tier: 5, unlock: { type: 'record', exerciseId: 'diamond_push_up', value: 20 }, cue: 'Wide hands, shift your weight to one arm, the other stays straight.' },

  // Tier 6 - Legend
  { id: 'muscle_up', name: 'Muscle-up', metric: 'reps', equipment: ['pullup_bar'], muscles: ['back', 'chest', 'triceps'], tier: 6, unlock: { type: 'record', exerciseId: 'pull_up', value: 12 }, cue: 'Explosive pull-up, lean over the bar, press to straight arms.' },
  { id: 'handstand_push_up', name: 'Wall handstand push-up', metric: 'reps', equipment: [], muscles: ['shoulders', 'triceps'], tier: 6, unlock: { type: 'all', rules: [{ type: 'level', level: 20 }, { type: 'record', exerciseId: 'push_up', value: 40 }] }, cue: 'Handstand against a wall, lower head to a pad, press up.' },

  // Secret - only from mystery chests (surprises).
  { id: 'bear_crawl', name: 'Bear crawl', metric: 'time', equipment: [], muscles: ['full body'], tier: 0, unlock: { type: 'secret' }, cue: 'Hands and feet, knees just off the floor. Crawl forward and back.' },
  { id: 'wall_sit', name: 'Wall sit', metric: 'time', equipment: [], muscles: ['quads'], tier: 0, unlock: { type: 'secret' }, cue: 'Back on the wall, thighs level, hold.' },
  { id: 'superman_hold', name: 'Superman hold', metric: 'time', equipment: [], muscles: ['lower back', 'glutes'], tier: 0, unlock: { type: 'secret' }, cue: 'Lie face down, lift arms and legs, hold.' },
  { id: 'shadow_boxing', name: 'Shadow boxing', metric: 'time', equipment: [], muscles: ['shoulders', 'heart'], tier: 0, unlock: { type: 'secret' }, cue: 'Guard up, light on your feet, throw fast straight punches.' },
  { id: 'skater_jump', name: 'Skater jump', metric: 'reps', equipment: [], muscles: ['legs', 'balance'], tier: 0, unlock: { type: 'secret' }, cue: 'Leap side to side, land on one foot. Count both sides.' },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const STARTER_IDS = EXERCISES.filter((e) => e.unlock.type === 'start').map((e) => e.id);
export const SECRET_IDS = EXERCISES.filter((e) => e.unlock.type === 'secret').map((e) => e.id);
