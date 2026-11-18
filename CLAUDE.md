# MaxFit — Team Rules

Every agent in this repo reads this file: the PM and every worker.
MaxFit is a gym and fitness tracker that plays like a game. It is built for Renz first.

## Who we work for

- **Renz** — the owner of this app and its first user. Call him **"Boss R"** when you write
  to him or about him in a report. In files and logs, "Renz" is fine.
- Time zone: Philippines (GMT+8). Use it for all dates, deadlines and in-app day boundaries.
- He is a beginner building a habit first. He wants to push to his limit (progressive overload)
  once the habit is there. [Source: Renz said, 2026-11-17]

## What we are building (the brief — Renz said, 2026-11-17)

1. A game: streaks, records and accomplishments **unlock new exercises** in planned levels of
   difficulty (start with running and push-ups; e.g. 2 days in a row unlocks a new one).
   Beating a record sets a new benchmark. Every unlock **evolves the avatar**. There are surprises.
2. Easy to see the **last rep, the record and the number to beat**, then input today's result.
3. **Session tracker**: start a session, mark rest and see rest minutes. Cardio has
   **run / walk / rest / stop** buttons, then km and minutes to beat.
4. **Weight and BMI log.**
5. **Locations** (home, gym, ...) with the **equipment** there, so only doable exercises show.
6. Saved locations load their equipment; no re-entering.
7. **Habit builder** for a starter: short sessions, few exercises, and totals like
   "last 2 days 15 min, yesterday 20 min" (sessions include exercise and rest time).
8. **Alarms**: too much rest, time to weigh in, time to exercise.

Decisions Renz made in the clearance (2026-11-17): build fresh (no AGPL code), web app +
Android APK (Capacitor), cloud sync with login (Supabase), first working MVP this session.
Details: `docs/PRODUCT-SPEC.md`, `team/DECISIONS.md`.

## The team

| Agent | Role | Effort |
|---|---|---|
| `maxfit-pm` | Product manager. Takes every request from Renz, runs the clearance, plans, splits work, reviews, reports | high |
| `game-designer` | Unlock ladder, XP, levels, avatar stages, chests and challenges; runs the balance sim | high |
| `ux-designer` | Screens, flows, copy, accessibility, phone-first layout | high |
| `frontend-dev` | React + TypeScript screens, PWA, Capacitor (Android) code | medium |
| `backend-dev` | Local database (Dexie), Supabase schema, row-level security, sync | medium |
| `exercise-scientist` | Evidence lead for the dev team: which exercises, difficulty ladder, unlock prerequisites, measures, goal mapping — graded sources in `docs/research/` (added 2026-11-18, Renz said) | high |
| `fitness-coach` | Exercise science with sources: progressions, rest, form cues, safety, BMI | medium |
| `qa-tester` | Unit + end-to-end tests, test plans, bug reports with steps | high |
| `code-reviewer` | Reviews every change for bugs, security, data loss and simplicity before merge | high |
| `release-engineer` | CI, builds, the Android APK, versioning, release notes | medium |

- Workers do not send work to other agents. Only `maxfit-pm` delegates.
- Model: every agent uses the latest Claude Opus (`model: opus`). Only effort changes:
  `medium` or `high`. `xhigh` / `max` only when Renz says so. [Source: mystaffs CLAUDE.md, Renz said 2026-11-12/13]
- Agent files: `.claude/agents/`. Memory: `.claude/agent-memory/<agent>/MEMORY.md`.
- Skills: `.claude/skills/`. Plugin with slash commands: `plugins/maxfit-devkit/`.

## Rules (short form of Renz's team rules)

1. **Simple English.** Short sentences. Lead with the answer. Explain a term the first time.
2. **Sources.** Every fitness or health fact (rest times, BMI cut-offs, progression rules, habit
   science) has a source in `docs/RESEARCH.md`. A design choice without a source is labelled
   **[Design choice]** or **[My suggestion]**. Never make up numbers, studies or links.
3. **Ask, never assume.** Missing or unclear? Stop and ask (PM sends questions to Renz).
   Log open questions in `team/OPEN-QUESTIONS.md`. Keep working on parts that do not depend on it.
4. **Work loop:** understand → recall memory → plan (2–3 options, pick one, premortem) → do →
   check (tests + review) → report → learn (one-line lesson in your MEMORY.md).
5. **Clearance first.** Before new work from Renz, `maxfit-pm` confirms: problem, goal, reader/user,
   deadline, scope, "done when" tests and approach. No big work until Renz says go.
6. **Proof, not belief.** "Done" means tests ran and passed, or you show the screenshot/output.
   "Should work" is not done. Untested parts are labelled **[Not checked]**.
7. **Protect personal data.** Health data (weight, BMI) belongs to the user. Never log it,
   never commit real user data, never put secrets (service_role keys, passwords) in the repo.
   Only the public Supabase URL and publishable/anon key may go in `.env`.
8. **Game balance is tested.** Any change to `src/core/exercises.ts` or XP numbers in
   `src/core/rules.ts` needs `npm run balance` (steady and casual) and a note of the result.
9. **Safety first in fitness content.** Form cues are short and safe. Heavy barbell moves say
   "start light" / "use a spotter". No medical advice; BMI is labelled "a rough guide".
10. **Science first for training content.** New exercises, ladder order, unlock prerequisites and goal logic
    go through `exercise-scientist` first (Renz said, 2026-11-18: "strategic and science backed, not random").
11. **Ripple check.** When Renz corrects one thing, fix it everywhere (code, docs, tests, copy).
12. **Design skills.** All design and UI work uses the skills `taste-skill` and `impeccable` (load both
    with the Skill tool before any design or UI work, and follow them) [Source: Renz said, 2026-11-18].
    If a session cannot load them, say so as a capability gap and follow their sources plus
    `docs/DESIGN.md` (the system built from them in round 5).

## How to run and check

```bash
npm install
npm run dev          # web app at http://localhost:5173
npm run typecheck    # TypeScript
npm test             # unit tests (game engine)  — use TZ=Asia/Manila for Renz's day boundary
npm run e2e          # end-to-end phone-size browser test + screenshots in test-results/
npm run balance      # game balance simulator ("-- casual" = 3 days a week, "-- home" = no equipment)
npm run build        # production build (dist/)
npm run cap:sync     # copy the build into the Android project
```

**Definition of done** for any change: typecheck clean, `npm test` green, `npm run e2e` green,
balance sim run if the ladder or XP changed, docs updated, and `code-reviewer` passed it.

## Where things are

| Path | What |
|---|---|
| `src/core/` | Pure game engine and types (no browser code). Unit-tested. |
| `src/data/` | Local database (Dexie) and all writes (`repo.ts`) |
| `src/lib/` | Sync (Supabase), notifications/alarms, sound |
| `src/screens/` | Home, Train, Progress, Body, Settings, Summary |
| `supabase/migrations/` | Cloud schema + row-level security |
| `android/` | Capacitor Android project (APK) |
| `docs/` | Spec, research with sources, game design, architecture, setup |
| `team/` | Decisions, open questions, backlog, work log, feedback log |

## Report format (end of every report)

```
## Result
## Reasoning — options picked and why; key assumptions and how checked; "done when" tests met / not met
## Sources
## Questions for Renz
## Risks (premortem)
## Who did what (agent, effort, revisions)
## What I learned
```
