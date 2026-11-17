import Dexie, { type Table } from 'dexie';
import type { Location, Profile, Session, WeightEntry, WorkSet } from '../core/types';

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
  meta!: Table<Meta, string>;

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
  }
}

export const db = new MaxFitDB();

export const SYNC_TABLES = ['profile', 'locations', 'sessions', 'sets', 'weights'] as const;
export type SyncTable = (typeof SYNC_TABLES)[number];

export function uid(): string {
  return crypto.randomUUID();
}
