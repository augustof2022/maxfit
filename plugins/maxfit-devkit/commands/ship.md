---
description: Prepare a MaxFit release - quality gate, version bump, release notes, Android APK via GitHub Actions
argument-hint: <version, e.g. 0.2.0>
---
Release version $ARGUMENTS of MaxFit.
1. Run the `qa-smoke` skill. Stop and report if anything fails.
2. Follow the `release-android` skill (version bump in package.json and android/app/build.gradle).
3. Write release notes in simple English in `team/WORK-LOG.md`: new, fixed, what Renz must do.
4. Commit on the current branch and push. Tell Renz where to download the APK artifact.
