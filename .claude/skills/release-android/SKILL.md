---
name: release-android
description: Build and ship the MaxFit Android APK with Capacitor - sync the web build, build in GitHub Actions, download the artifact, install on the phone, and run the alarm test plan. Use to produce an APK or prepare a release.
---

# Android release

1. Bump `version` in `package.json` and `versionCode` / `versionName` in `android/app/build.gradle`.
2. `npm run build && npx cap sync android` and commit the Android changes.
3. Push. GitHub Actions → workflow **Android APK** → artifact `maxfit-debug-apk`.
   (Or run it by hand: Actions → Android APK → Run workflow.)
4. Renz installs: download the artifact on the phone, unzip, open the `.apk`, allow
   "install unknown apps" for the browser/files app once.
5. Manual test plan (from docs/SETUP.md): rest alarm with screen off, workout reminder,
   weigh-in reminder, reminders after reboot, permission denied path, offline then sync.
6. Release signing (Play Store) needs a keystore in GitHub secrets, added by Renz. Never commit it.
