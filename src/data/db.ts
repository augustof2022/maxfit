import Dexie, { type Table } from 'dexie';
import type { EquipmentItem, Location, Photo, Plan, Profile, Session, WeightEntry, WorkSet } from '../core/types';

// Local-first database (IndexedDB in the browser and in the Android app).
// Every row carries updatedAt so cloud sync can merge with last-write-wins.

export interface Meta {
  key: string;
  value: unknown;
}

export class MaxFitDB extends Dexie {
  profile!: Table<Profile, string>;
  locations!: Table<Location, string>;
  sessions!: Table<Session, string>;
  sets!: Table<WorkSet, string>;
  weights!: Table<WeightEntry, string>;
  equipment!: Table<EquipmentItem, string>;
  meta!: Table<Meta, string>;
  /** Progress photos: on this phone only, never synced (not in SYNC_TABLES). */
  photos!: Table<Photo, string>;
  /** Exercise plans per place (synced). */
  plans!: Table<Plan, string>;

  constructor(name = 'maxfit') {
    super(name);
    this.version(1).stores({
      profile: 'id',
      locations: 'id, updatedAt',
      sessions: 'id, startedAt, status, updatedAt',
      sets: 'id, sessionId, exerciseId, at, updatedAt',
      weights: 'id, date, updatedAt',
      meta: 'key',
    });
    // v2: the user's own equipment items (the built-in library lives in code).
    // The pull cursor is reset so rows of the new table that an older app skipped are pulled again
    // (merging is last-write-wins, so a full re-pull is safe).
    this.version(2)
      .stores({ equipment: 'id, updatedAt' })
      .upgrade((tx) => tx.table('meta').bulkDelete(['pullSeq', 'pullTime']));
    // v3: progress photos (phone only, Renz 2026-11-18).
    this.version(3).stores({ photos: 'id, at' });
    // v4: exercise plans per place (Renz, 2026-11-18). New sync table, so the pull cursor is reset
    // (rows of it that an older app skipped are pulled again; merging is last-write-wins, so it is safe).
    this.version(4)
      .stores({ plans: 'id, locationId, updatedAt' })
      .upgrade((tx) => tx.table('meta').bulkDelete(['pullSeq', 'pullTime']));
  }
}

export const db = new MaxFitDB();

export const SYNC_TABLES = ['profile', 'locations', 'sessions', 'sets', 'weights', 'equipment', 'plans'] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

export function uid(): string {
  return crypto.randomUUID();
}
