// Core data types for MaxFit. Pure types only: no browser or database code here.

/** A built-in id (see EQUIPMENT in src/core/equipment.ts) or a custom one ("custom-<uuid>"). */
export type EquipmentId = string;

export type EquipmentCategory = 'basics' | 'free_weights' | 'bars_benches' | 'cardio' | 'machines';

/** One item in the equipment library. Built-ins live in code; custom items live in the database. */
export interface EquipmentItem {
  id: EquipmentId;
  name: string;
  category: EquipmentCategory;
  custom?: boolean;
  updatedAt?: number;
  deleted?: boolean;
}

/**
 * One way to measure a set. An exercise can be tracked by one or more (Renz, 2026-11-18).
 * 'time' = longer wins (plank, a run's duration). 'speed' = "faster time": the same seconds, but lower
 * wins (a 100 m sprint, a 1 km time trial). Renz, 2026-11-18: "a sprint is a set distance, how fast".
 */
export type Measure = 'reps' | 'time' | 'speed' | 'distance' | 'weight';

/**
 * How a record is beaten (Renz, 2026-11-18: "configurable for every exercise").
 * any  = at least one tracked number better, none worse (rule A). A run: farther or longer.
 * same = keep one number fixed (weight or distance) and beat the other. Records are kept per weight or
 *        per distance: 20 kg x 20 and 30 kg x 12 are separate records; a heavier weight than ever is a record.
 */
export type Beat = { kind: 'any' } | { kind: 'same'; fixed: 'weight' | 'distance'; beat: 'reps' | 'time' | 'speed' };

/** Body areas the user can focus on. */
export type Focus = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs' | 'cardio';

/** Training goals the user can pick (more than one). */
export type Goal = 'lose_weight' | 'lean' | 'muscle' | 'strength' | 'stamina';

/** Avatar look (Settings). */
export type AvatarStyle = 'athlete' | 'line' | 'buddy';

/** Profile gender (Renz, 2026-11-18: Male / Female only). Female gives a female avatar body. */
export type Gender = 'male' | 'female';

export type UnlockRule =
  | { type: 'start' }
  | { type: 'streak'; days: number }
  | { type: 'sessions'; count: number }
  | { type: 'level'; level: number }
  | { type: 'totalMinutes'; minutes: number }
  /** Best value of one measure (default: the exercise's main measure) reaches `value`. */
  | { type: 'record'; exerciseId: string; value: number; measure?: Measure }
  | { type: 'all'; rules: UnlockRule[] }
  | { type: 'any'; rules: UnlockRule[] }
  | { type: 'secret' }; // only from a mystery chest

export interface Exercise {
  id: string;
  name: string;
  /** Default measures, main one first (the user may choose others). */
  measures: Measure[];
  /** All of these must be at the location. Empty = bodyweight, works anywhere. */
  equipment: EquipmentId[];
  muscles: string[];
  /** Body areas it trains, for the goal profile. */
  focus: Focus[];
  /** The move this one is a variation or regression of (shown as "Variation of ..."). */
  base?: string;
  /** Default "how to beat it" (else: weight + reps → same weight, beat reps; others → any). */
  beat?: Beat;
  /** Secrets: a chest can only give it once this exercise is unlocked. */
  requires?: string;
  /** free-exercise-db id (public domain) whose 2 photos are bundled in public/demos/. */
  demo?: string;
  /** Goals it serves best, for the goal profile. */
  goals: Goal[];
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
  /**
   * Legacy store of unlocks. Unlocks are now worked out from the data (sessions and sets), so deleting
   * wrong data can lock an exercise again (Renz, 2026-11-18). Only secret exercises found in chests
   * before that change are still read from here.
   */
  unlocked: string[];
  cosmetics: string[];
  color: string;
  habitBaseMin: number;
  habitCapMin: number;
  settings: Settings;
  lastLocationId: string | null;
  challenge: Challenge | null;
  /** Goals and body focus; surprises and suggestions lean toward them. */
  goals?: Goal[];
  focus?: Focus[];
  /** The user's own choice of measures per exercise id. */
  exerciseMeasures?: Record<string, Measure[]>;
  /** The user's own "how to beat it" per exercise id. */
  exerciseBeat?: Record<string, Beat>;
  avatarStyle?: AvatarStyle;
  /** Male / Female (undefined = not set yet, shown as male). */
  gender?: Gender;
  /**
   * Moves already shown to the user. They stay in the inventory even if the equipment for them is
   * removed later (shown as "needs equipment"); moves earned but never doable stay hidden until the
   * equipment is added, then are revealed as a surprise at the next session end (code review, 2026-11-18).
   */
  revealed?: string[];
  /** When "Delete test data" last ran; sync uses it so old copies do not bring progress back. */
  resetAt?: number;
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
  /** Secret exercise this session's mystery chest gave (deleting the session locks it again). */
  chestSecret?: string;
  /** The exercise plan this session was started from (null / missing = a free session). */
  planId?: string | null;
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

/** A progress photo. Kept on this phone only (Renz, 2026-11-18): never synced to the cloud. */
export interface Photo {
  id: string;
  at: number;
  /** The photo itself (resized JPEG). */
  image: Blob;
  /** The finished picture with the stats on top, as saved or shared. */
  composite: Blob | null;
  template: string;
  size: 'story' | 'post';
  /** Stat lines shown on the photo, as text at the time it was made. */
  stats: { key: string; label: string; value: string }[];
  /** "I did" lines (e.g. "Push-ups · 25 reps"), as text at the time it was made. */
  did?: { mode: 'all' | 'records'; lines: string[] };
  note: string;
  updatedAt: number;
}

/** The target for one exercise in a plan. Only the numbers the user set. */
export interface PlanTarget {
  reps?: number;
  seconds?: number;
  weightKg?: number;
  distanceKm?: number;
}

export interface PlanItem {
  exerciseId: string;
  sets: number;
  target: PlanTarget;
}

/**
 * A saved exercise plan for one place (Renz, 2026-11-18). Import and duplicate make a full COPY
 * (new id, own items), so editing a copy never changes the original.
 */
export interface Plan {
  id: string;
  name: string;
  description: string;
  locationId: string;
  items: PlanItem[];
  createdAt: number;
  lastUsedAt: number | null;
  lastViewedAt: number | null;
  updatedAt: number;
  deleted?: boolean;
}
