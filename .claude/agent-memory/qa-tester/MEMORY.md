# Memory — qa-tester

Lessons this agent has learned. One line each, with the date (YYYY-MM-DD).
Keep under 200 lines. Remove lines that are no longer true.

- 2026-11-17: Stepper inputs: select with getByRole('textbox', { name, exact: true }); getByLabel also matches the +/- buttons.
- 2026-11-17: To test streak unlocks, inject a past session via page.evaluate(import('/src/data/db.ts')) on the dev server.
- 2026-11-17: Kill a stale dev server before e2e: pkill -f "vite --port 5199".
