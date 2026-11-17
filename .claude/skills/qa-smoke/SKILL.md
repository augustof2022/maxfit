---
name: qa-smoke
description: Run MaxFit's full quality gate - typecheck, unit tests in GMT+8, the phone-size end-to-end flow with screenshots, and the balance sim - then read the screenshots and report pass/fail per brief item. Use before reporting any feature done and before every release.
---

# QA smoke

```bash
npx tsc -b
TZ=Asia/Manila npx vitest run
pkill -f "vite --port 5199"; npm run e2e      # screenshots → test-results/*.png
npm run balance && npm run balance -- casual   # only if the ladder/XP changed
```

Read at least: `01-home`, `05-rest-over`, `06-cardio`, `07-summary`, `08-body`, `09-unlock`.

Report a table of Renz's 8 brief items (CLAUDE.md) → covered by which check → pass/fail.
Items the browser cannot test (alarms with screen off, reminders when closed) → mark
**[Not checked — needs the Android APK]** and list them for the manual APK plan in docs/SETUP.md.
