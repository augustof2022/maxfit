# Architecture

```
 Phone (browser PWA or Android app via Capacitor)
 ┌──────────────────────────────────────────────────────────┐
 │ screens/ (React)  ──read──▶ useGame() ◀──live── Dexie DB  │
 │      │                                (IndexedDB, main copy)
 │      └──write──▶ data/repo.ts ──▶ core/rules.ts (pure game engine)
 │                         │                                 │
 │ lib/notify.ts (alarms)  │  lib/sync.ts ──push/pull──▶ Supabase (maxfit_rows, RLS)
 └──────────────────────────────────────────────────────────┘
```

## Choices (options considered → pick → why)

| Decision | Options | Pick | Why |
|---|---|---|---|
| Base | fork wger / Liftosaur (AGPL), fork Bati (MIT, Expo), build fresh | Build fresh | Renz's choice. No license limits; none has the unlock ladder |
| App type | PWA only; native Android; PWA + Capacitor APK | PWA + Capacitor | Renz's choice. One codebase; APK gives real scheduled alarms |
| UI | React + plain CSS tokens; Tailwind; React Native | React 19 + CSS tokens | Small, fast, no build-time CSS tooling |
| Local data | localStorage; IndexedDB via Dexie; SQLite plugin | Dexie | Works in browser and WebView, live queries, transactions |
| Cloud | none; Supabase; Firebase | Supabase | Renz's choice (login + sync); he already has a project; Postgres + RLS |
| Sync model | server is main copy; local-first last-write-wins | Local-first LWW, one generic table | Works offline at the gym; one user, few conflicts; simple to reason about |
| Game rules | inside components; pure module | Pure `src/core/` | Unit-testable, used by the balance sim |

## Data

| Table (phone) | Key fields |
|---|---|
| `profile` (one row `me`) | xp, unlocked[], cosmetics[], color, heightCm, settings, habit base/cap, challenge, lastLocationId |
| `locations` | name, kind, equipment[] |
| `sessions` | startedAt, endedAt, status, activeSec, restSec, xpEarned, prs, live (timer state) |
| `sets` | sessionId, exerciseId, reps / seconds / weightKg / distanceKm, durationSec, run/walk/restSec, isPR |
| `weights` | date (one per day), kg |

Every row has `updatedAt`; deletes are soft (`deleted: true`) so they sync.

## Sync rules (fixed after code review, 2026-11-17)

1. **Pull first, then push.** Seed rows (profile, Home, Gym) have `updatedAt: 0` and fixed ids,
   so a new phone never overwrites real cloud data and never duplicates the seed locations.
2. **Server keeps the newest copy.** Uploads go through `maxfit_push()`, which only replaces a
   row whose stored `updated_at` is older. Runs as the user, so RLS still applies.
3. **No skipped rows.** Pull pages by a unique, increasing `seq` number, then re-reads the last
   2 minutes in case an upload committed late. Merging is idempotent.
4. **Never lose earned things.** XP is derived from sessions; unlocks and colours merge as a union.
5. **One account per phone.** The first account to sync owns the local data; another account
   gets a clear message (export, then "Erase this device").
6. **Restore syncs.** Importing a backup stamps rows as new and soft-deletes rows not in it.
Tested: `src/lib/merge.test.ts`, `src/data/repo.test.ts`; SQL checked in PGlite (insert,
older-copy ignored, newer applied, user isolation, bad table rejected, migration re-runnable).
Records, streaks, levels and unlock progress are **computed** from sessions and sets, so they
cannot drift. `unlocked` is stored so unlocks never re-lock.

## Timers

The live session stores `mode` + `modeStartedAt` + seconds `banked` per mode. Switching mode
banks the elapsed time. A reload or a killed app keeps counting correctly from the stored start.

## Alarms

| Alarm | Android app | Web app |
|---|---|---|
| Rest too long | In-app sound + vibration, plus a scheduled notification at the limit (rings with screen off) | Sound + vibration while open; screen kept on with Wake Lock |
| Time to train (days + time) | Weekly scheduled notifications | Notification/banner while the app is open |
| Weigh-in (day + time) | Weekly scheduled notification | Notification/banner while open + Home banner |
