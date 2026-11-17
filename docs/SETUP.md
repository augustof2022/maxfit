# Setup, cloud sync and Android

## Run on a computer
```bash
npm install
npm run dev        # open the printed link; on a phone on the same Wi-Fi: npm run dev -- --host
```

## Turn on cloud sync (Supabase)
1. Create a new Supabase project for MaxFit (Renz's decision, 2026-11-17). Then apply
   `supabase/migrations/20261117000000_maxfit_rows.sql` (SQL editor → paste → Run, or tell the
   team the project name and `backend-dev` applies it with the Supabase connector).
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project settings → API; the anon/publishable key is public by design. Never the service_role key).
3. For the GitHub builds, add the same two values as repository **variables** (not secrets needed,
   they are public): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
4. In Supabase Auth settings, email confirmation can stay on: after "Create account" open the
   email link, then "Sign in" in MaxFit.

## Get the Android app (APK)

**Easiest (on your phone):**
1. Open **https://github.com/augustof2022/maxfit/releases/tag/apk-latest** in Chrome.
2. Under **Assets**, tap **maxfit-debug.apk**. It downloads.
3. Open the downloaded file. If Android asks, allow **"Install unknown apps"** for Chrome, then tap **Install**.
4. Open MaxFit → Settings → Reminders → turn on → allow notifications (and **"Alarms & reminders"** if asked).

A new APK is posted there automatically after every push. To build one by hand:
GitHub → **Actions** → **Android APK** (left list) → **Run workflow** → in "Use workflow from" pick
**`main`** → green **Run workflow**. Wait about 2–3 minutes for the green tick, then use the link above.

**Other way (computer):** open the finished run → scroll to the bottom → **Artifacts** →
**maxfit-debug-apk** (a .zip; unzip it to get the .apk). The Artifacts box often does not show
in the GitHub phone app.

## Manual test plan for the APK (alarms cannot be tested in a browser)
| # | Step | Expected |
|---|---|---|
| 1 | Set rest alarm to 15 s. Start a session, log a set, lock the screen | Notification "Rest is over" after ~15 s |
| 2 | Turn on "Remind me to train" for today, 2 minutes from now; close the app | Notification at that time |
| 3 | Same for weigh-in | Notification at that time |
| 4 | Reboot the phone, wait for the next reminder time | Notification still comes |
| 5 | Deny notification permission | App still works; no crash |
| 6 | Airplane mode: do a session; then go online and press Sync now | Session appears on a second device |

## Publish the web app (optional)
Actions → **Deploy web app** → Run workflow. Needs GitHub Pages turned on (Settings → Pages →
Source: GitHub Actions). Then open the page on the phone and "Add to Home screen".
