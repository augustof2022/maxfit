// Core data types for MaxFit. Pure types only: no browser or database code here.

export type EquipmentId =
  | 'mat'
  | 'pullup_bar'
  | 'dip_bars'
  | 'dumbbell'
  | 'kettlebell'
  | 'barbell'
  | 'bench'
  | 'resistance_band'
  | 'jump_rope'
  | 'treadmill'
  | 'stationary_bike'
  | 'cable_machine'
  | 'leg_press';

/** How an exercise is measured. */
export type Metric =
  | 'reps' // count of reps in one set (push-ups)
  | 'time' // seconds held or done (plank)
  | 'weight_reps' // kg x reps (dumbbell curl)
  | 'distance'; // km + minutes, with run / walk / rest split (running)

export type UnlockRule =
  | { type: 'start' }
  | { type: 'streak'; days: number }
  | { type: 'sessions'; count: number }
  | { type: 'level'; level: number }
  | { type: 'totalMinutes'; minutes: number }
  | { type: 'record'; exerciseId: string; value: number }
  | { type: 'all'; rules: UnlockRule[] }
  | { type: 'any'; rules: UnlockRule[] }
  | { type: 'secret' }; // only from a mystery chest

export interface Exercise {
  id: string;
  name: string;
  metric: Metric;
  /** All of these must be at the location. Empty = bodyweight, works anywhere. */
  equipment: EquipmentId[];
  muscles: string[];
  /** 0 = secret, 1 = starter ... 6 = legend */
  tier: number;
  unlock: UnlockRule;
  /** One-line form cue. */
  cue: string;
}

export interface Settings {
  restLimitSec: number;
  sound: boolean;
  vibrate: boolean;
  workoutReminder: { enabled: boolean; time: string; days: number[] }; // days: 0=Sun..6=Sat
  weighReminder: { enabled: boolean; time: string; day: number };
}

export interface Challenge {
  exerciseId: string;
  target: number;
  xp: number;
}

export interface Profile {
  id: 'me';
  name: string;
  heightCm: number | null;
  /** Never re-lock. Merged as a union when syncing so no device loses an unlock. */
  unlocked: string[];
  cosmetics: string[];
  color: string;
  habitBaseMin: number;
  habitCapMin: number;
  settings: Settings;
  lastLocationId: string | null;
  challenge: Challenge | null;
  updatedAt: number;
}

export interface Location {
  id: string;
  name: string;
  kind: 'home' | 'gym' | 'outdoor' | 'other';
  equipment: EquipmentId[];
  updatedAt: number;
  deleted?: boolean;
}

export type LiveMode = 'idle' | 'exercise' | 'rest' | 'run' | 'walk';

export interface LiveState {
  mode: LiveMode;
  modeStartedAt: number;
  /** Seconds banked per mode before modeStartedAt. */
  banked: Record<LiveMode, number>;
  /** Cardio segment in progress (seconds per mode for the current run). */
  cardio: { exerciseId: string; banked: Record<LiveMode, number> } | null;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt: number | null;
  locationId: string | null;
  status: 'active' | 'done';
  activeSec: number;
  restSec: number;
  xpEarned: number;
  prs: number;
  live: LiveState | null;
  updatedAt: number;
  deleted?: boolean;
}

export interface WorkSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  at: number;
  reps?: number;
  seconds?: number;
  weightKg?: number;
  distanceKm?: number;
  /** cardio: total minutes, and the split */
  durationSec?: number;
  runSec?: number;
  walkSec?: number;
  restSec?: number;
  isPR: boolean;
  updatedAt: number;
  deleted?: boolean;
}

export interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  kg: number;
  updatedAt: number;
  deleted?: boolean;
}
