# Setup, cloud sync and Android

## Run on a computer
```bash
npm install
npm run dev        # open the printed link; on a phone on the same Wi-Fi: npm run dev -- --host
```

## Turn on cloud sync (Supabase) — about 10 minutes
Cloud sync backs up your training data and lets you use MaxFit on more than one device.
Progress photos are **never** uploaded (Renz, 2026-11-18): they stay on the phone.

1. Go to **supabase.com** → **Start your project** → sign in with GitHub.
2. **New project** → Name: `maxfit` → make a database password (save it in your password
   manager; the app does not need it) → Region: **Southeast Asia (Singapore)** → **Create new project**.
   Wait 1–2 minutes until it is ready.
3. Left menu → **SQL Editor** → **New query**. On GitHub open
   `supabase/migrations/20261117000000_maxfit_rows.sql` → **Raw** → copy all → paste → **Run**.
   You should see "Success. No rows returned". (This makes the table and the rules that let each
   user read and write only their own rows.)
4. Left menu → **Project Settings** → **API** (may be called **API Keys** / **Data API**). Copy:
   - **Project URL** (looks like `https://abcd.supabase.co`)
   - the **anon** / **publishable** key (public by design). **Never** copy the `service_role` / secret key.
5. GitHub → **augustof2022/maxfit** → **Settings** → **Secrets and variables** → **Actions** →
   **Variables** tab → **New repository variable**, two times:
   - `VITE_SUPABASE_URL` = the Project URL
   - `VITE_SUPABASE_ANON_KEY` = the anon / publishable key
6. Supabase → **Authentication** → **Sign In / Providers** → Email is on by default. If you keep
   "Confirm email" on: after **Create account** in MaxFit, open the email link, then **Sign in**.
7. The next app build has sync. In MaxFit: **Settings → Cloud sync → Create account**.

For the phone app **no file is needed**: the build reads the two GitHub variables. Only to run MaxFit on a
computer: copy `.env.example` to a file named exactly **`.env`** (not `maxfit.env`) in the main folder next to
`package.json`, and put the same two values in it. Git ignores `.env`, so it is never uploaded.

## The app signing key (one time) — needed for "tap Update"
Android only installs an update over the app if both were signed with the **same key**. The
build used a new random key every time, so updates could not install. Now there is one fixed key,
kept only in GitHub **secrets** (never in the code).

1. Open the file **MAXFIT-SIGNING-KEY.txt** the team sent you (keep a copy in a private place:
   if it is lost, the next update needs one more uninstall).
2. GitHub → **augustof2022/maxfit** → **Settings** → **Secrets and variables** → **Actions** →
   **Secrets** tab → **New repository secret**, two times:
   - Name `MAXFIT_KEYSTORE_PASSWORD` → value: the password line from the file
   - Name `MAXFIT_KEYSTORE_B64` → value: the long line from the file (copy all of it)
3. Done. From now on every build from `main` is signed with this key.

## Get the Android app (APK)

**First install with the new key (one time):** the app on your phone was signed with an old
random key, so Android cannot update it. Uninstall it once, then install the new one.
- Uninstalling deletes the data on the phone, **including progress photos** (they are never in the cloud
  or in backups). Save the photos you want to the gallery first (Body → photo → Save).
- Training data: To keep it: set up cloud sync first, build, install,
  sign in; or use **Settings → Backup → Export** in the new app later. (The old app's Export may
  not save a file on Android; that is fixed in the new version.)

**Install (on your phone):**
1. Open **https://github.com/augustof2022/maxfit/releases/tag/apk-latest** in Chrome.
2. Under **Assets**, tap **maxfit.apk**. It downloads.
3. Open the downloaded file. If Android asks, allow **"Install unknown apps"** for Chrome, then tap **Install**.
4. Open MaxFit → Settings → Reminders → turn on → allow notifications (and **"Alarms & reminders"** if asked).

**Updates after that (in the app):** when a newer build exists, MaxFit shows
**"New version ready · Update"** at the top. Tap **Update** → it downloads → Android shows
**Install** → tap it. Your data stays. The first time, Android asks you to allow
"Install unknown apps" for **MaxFit** (go back and tap Update again).
Android always asks you to tap Install for apps that are not from the Play Store; the app cannot skip that.

**When is a new version published?** Only builds of `main` (after a pull request is merged), and
only when the signing key secrets are set. Each build gets a higher build number
(the workflow run number), which is how the app knows it is newer.
To build by hand: GitHub → **Actions** → **Android APK** → **Run workflow** → branch **main**.

**Other way (computer):** any build (also from a work branch) has the APK under the run's
**Artifacts** (`maxfit-apk-build-N`, a .zip).

## Manual test plan for the APK (alarms cannot be tested in a browser)
| # | Step | Expected |
|---|---|---|
| 1 | Set rest alarm to 15 s. Start a session, log a set, lock the screen | Notification "Rest is over" after ~15 s |
| 2 | Turn on "Remind me to train" for today, 2 minutes from now; close the app | Notification at that time |
| 3 | Same for weigh-in | Notification at that time |
| 4 | Reboot the phone, wait for the next reminder time | Notification still comes |
| 5 | Deny notification permission | App still works; no crash |
| 6 | Airplane mode: do a session; then go online and press Sync now | Session appears on a second device |
| 7 | With an older build installed, open the app online | "New version ready · Update" shows; Update downloads, Android installer opens, Install keeps the data |
| 8 | Body → Take photo → pick stats → Save | Picture in the gallery (Pictures/MaxFit) and in the app's Progress photos |
| 9 | Same → Share | Phone share menu opens; Instagram → Story works |
| 10 | Settings → Backup → Export | File in Downloads/MaxFit |

## Publish the web app (optional)
Actions → **Deploy web app** → Run workflow. Needs GitHub Pages turned on (Settings → Pages →
Source: GitHub Actions). Then open the page on the phone and "Add to Home screen".
