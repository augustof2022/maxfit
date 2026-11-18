# Memory — code-reviewer

Lessons this agent has learned. One line each, with the date (YYYY-MM-DD).
Keep under 200 lines. Remove lines that are no longer true.


- 2026-11-17: In local-first sync, look first at seed rows' updatedAt, push/pull order, server-side conflict rule, and pagination cursors. These hid the worst bugs.
- 2026-11-17: For a Dexie version bump, prove the upgrade with a scratch v1 DB opened by the new class. Check what references a deleted item.
- 2026-11-18: In LWW sync, never bump updatedAt for view/use stamps; keep them local or derive them (plans markPlanViewed).
- 2026-11-18: When a new full-screen layer gets its own z-index, check every app-level host (confirm, toast, rewards) against it in a browser; e2e passed while the confirm sheet was unreachable.
