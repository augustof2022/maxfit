import type { EquipmentCategory, EquipmentItem } from './types';

// The built-in equipment library. Users can add their own items (stored in the database).
// Ids are permanent: exercises and saved places point to them.

export const CATEGORIES: { id: EquipmentCategory; name: string }[] = [
  { id: 'basics', name: 'Basics & accessories' },
  { id: 'free_weights', name: 'Free weights' },
  { id: 'bars_benches', name: 'Bars, racks & benches' },
  { id: 'cardio', name: 'Cardio machines' },
  { id: 'machines', name: 'Strength machines' },
];

export const EQUIPMENT: EquipmentItem[] = [
  // Basics & accessories
  { id: 'mat', name: 'Exercise mat', category: 'basics' },
  { id: 'resistance_band', name: 'Resistance band', category: 'basics' },
  { id: 'jump_rope', name: 'Jump rope', category: 'basics' },
  { id: 'ab_wheel', name: 'Ab wheel', category: 'basics' },
  { id: 'foam_roller', name: 'Foam roller', category: 'basics' },
  { id: 'medicine_ball', name: 'Medicine ball', category: 'basics' },
  { id: 'plyo_box', name: 'Plyo box / sturdy step', category: 'basics' },
  { id: 'suspension_trainer', name: 'Suspension trainer (TRX)', category: 'basics' },
  { id: 'battle_ropes', name: 'Battle ropes', category: 'basics' },
  // Free weights
  { id: 'dumbbell', name: 'Dumbbells', category: 'free_weights' },
  { id: 'kettlebell', name: 'Kettlebell', category: 'free_weights' },
  { id: 'barbell', name: 'Barbell + plates', category: 'free_weights' },
  { id: 'ez_bar', name: 'EZ curl bar', category: 'free_weights' },
  { id: 'sandbag', name: 'Sandbag', category: 'free_weights' },
  // Bars, racks & benches
  { id: 'pullup_bar', name: 'Pull-up bar', category: 'bars_benches' },
  { id: 'dip_bars', name: 'Dip bars', category: 'bars_benches' },
  { id: 'bench', name: 'Flat bench', category: 'bars_benches' },
  { id: 'incline_bench', name: 'Adjustable / incline bench', category: 'bars_benches' },
  { id: 'squat_rack', name: 'Squat rack / power rack', category: 'bars_benches' },
  { id: 'smith_machine', name: 'Smith machine', category: 'bars_benches' },
  { id: 'preacher_bench', name: 'Preacher curl bench', category: 'bars_benches' },
  // Cardio machines
  { id: 'treadmill', name: 'Treadmill', category: 'cardio' },
  { id: 'stationary_bike', name: 'Stationary bike', category: 'cardio' },
  { id: 'rowing_machine', name: 'Rowing machine', category: 'cardio' },
  { id: 'elliptical', name: 'Elliptical', category: 'cardio' },
  { id: 'stair_climber', name: 'Stair climber', category: 'cardio' },
  // Strength machines
  { id: 'cable_machine', name: 'Cable machine / lat pulldown', category: 'machines' },
  { id: 'leg_press', name: 'Leg press machine', category: 'machines' },
  { id: 'leg_curl', name: 'Leg curl machine', category: 'machines' },
  { id: 'leg_extension', name: 'Leg extension machine', category: 'machines' },
  { id: 'chest_press', name: 'Chest press machine', category: 'machines' },
  { id: 'pec_deck', name: 'Pec deck / fly machine', category: 'machines' },
  { id: 'shoulder_press_machine', name: 'Shoulder press machine', category: 'machines' },
  { id: 'seated_row', name: 'Seated row machine', category: 'machines' },
  { id: 'hack_squat', name: 'Hack squat machine', category: 'machines' },
  { id: 'calf_raise_machine', name: 'Calf raise machine', category: 'machines' },
  { id: 'assisted_pullup', name: 'Assisted pull-up / dip machine', category: 'machines' },
];

export const EQUIPMENT_BY_ID: Record<string, EquipmentItem> = Object.fromEntries(EQUIPMENT.map((e) => [e.id, e]));

/** Quick-fill sets for a new place [Design choice]. */
export const PRESETS: { id: string; name: string; equipment: string[] }[] = [
  { id: 'none', name: 'Bodyweight only', equipment: [] },
  { id: 'home', name: 'Home basics', equipment: ['mat', 'resistance_band', 'jump_rope', 'dumbbell'] },
  { id: 'park', name: 'Park / outdoor', equipment: ['pullup_bar', 'dip_bars'] },
  { id: 'gym', name: 'Full gym', equipment: EQUIPMENT.map((e) => e.id) },
];

/** Built-ins + the user's own items (not deleted), sorted by category then name. */
export function libraryOf(custom: EquipmentItem[]): EquipmentItem[] {
  const order = CATEGORIES.map((c) => c.id);
  return [...EQUIPMENT, ...custom.filter((c) => !c.deleted).map((c) => ({ ...c, custom: true }))].sort(
    (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (a.custom ? 1 : 0) - (b.custom ? 1 : 0) || 0,
  );
}

export function equipmentName(id: string, custom: EquipmentItem[] = []): string {
  return EQUIPMENT_BY_ID[id]?.name ?? custom.find((c) => c.id === id && !c.deleted)?.name ?? id.replace(/_/g, ' ');
}
