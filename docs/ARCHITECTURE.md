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
