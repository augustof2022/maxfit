# MaxFit

**Train like a game.** Start with push-ups and running. Show up and beat your records to
unlock new exercises, level up, and evolve your avatar. Built for a beginner who wants the
habit first and then to push to the limit.

| | |
|---|---|
| 🎮 Unlock ladder | 33 exercises in 6 tiers + 5 secret ones. Streaks, sessions, levels and records unlock the next move |
| 🏆 Beat this | Every exercise shows **Last · Record · Beat this**, with the input pre-filled |
| ⏱️ Session tracker | Active vs rest time, auto rest after each set, alarm when rest is too long |
| 🏃 Cardio | Run / Walk / Rest / Stop, then km → pace, best distance and best pace |
| ⚖️ Body | Weight log, BMI (WHO ranges), trend chart |
| 📍 Locations | Home, Gym, ... with their equipment; only doable exercises show |
| 🌱 Habit builder | Starter mode (short, max 3 exercises), daily goal from 10 min that grows slowly, 7-day chart |
| 🔔 Alarms | Rest alarm, daily "time to train", weekly weigh-in (real alarms in the Android app) |
| 🎁 Surprises | Mystery chest after every session: bonus XP, colours, secret exercises, challenges |
| ☁️ Sync | Works offline; optional login to sync through Supabase |

## Quick start
```bash
npm install
npm run dev
```
More: [docs/SETUP.md](docs/SETUP.md) (sync, Android APK, test plan).

## Docs
- [Product spec and status](docs/PRODUCT-SPEC.md)
- [Game design and balance](docs/GAME-DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Research and sources](docs/RESEARCH.md)

## The AI team that builds MaxFit
Open this repo in Claude Code and talk to the **`maxfit-pm`** (default agent). It runs the
team: `game-designer`, `ux-designer`, `frontend-dev`, `backend-dev`, `fitness-coach`,
`qa-tester`, `code-reviewer`, `release-engineer`. Rules: [CLAUDE.md](CLAUDE.md).

Skills in `.claude/skills/`: `add-exercise`, `game-balance`, `progressive-overload`,
`sync-schema-change`, `qa-smoke`, `ui-review`, `release-android`.

Plugin `maxfit-devkit` (`/plugin marketplace add ./` then `/plugin install maxfit-devkit@maxfit`):
`/maxfit-devkit:qa`, `/maxfit-devkit:balance`, `/maxfit-devkit:new-exercise`,
`/maxfit-devkit:ship`, `/maxfit-devkit:status`, plus a hook that reminds the team to run the
balance check when the game rules change.

## Checks
```bash
npm run typecheck && TZ=Asia/Manila npm test && npm run e2e && npm run balance
```
