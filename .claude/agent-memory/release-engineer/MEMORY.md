# Memory — release-engineer

Lessons this agent has learned. One line each, with the date (YYYY-MM-DD).
Keep under 200 lines. Remove lines that are no longer true.

- 2026-11-17: No Android SDK in the cloud container; build APKs in GitHub Actions. `npx cap add android` works offline here.
- 2026-11-17: Added android.permission.VIBRATE to the manifest so navigator.vibrate works in the WebView.
