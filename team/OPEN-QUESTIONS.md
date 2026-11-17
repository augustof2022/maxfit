# Open questions for Renz

| # | Date | Question | Why it matters | Status |
|---|---|---|---|---|
| Q1 | 2026-11-17 | May we apply the MaxFit migration (one new table `maxfit_rows` + RLS) to your existing Supabase project "augustof2022's Project"? It already holds your notes app tables; we only add `maxfit_`-prefixed objects. Or do you want a new Supabase project? | Cloud sync and login do not work until the table exists | Open |
| Q2 | 2026-11-17 | Do you have a pull-up bar, dip bars, dumbbells or a jump rope at home? Which equipment does your gym have? | We seeded "Home" with a mat only and "Gym" with everything. You can edit them in Settings | Open |
| Q3 | 2026-11-17 | BMI categories: keep the WHO general cut-offs (25 overweight, 30 obese), or use the lower Asian cut-offs? | Changes the label you see for the same BMI | Open |
| Q4 | 2026-11-17 | A 2026 ACSM resistance-training stand exists; we could not open it here. OK to keep 90 s rest default (ACSM 2009: 1–2 min) until we can check it? | Rest alarm default | Open |
| Q6 | 2026-11-17 | Fair-play rules from the code review: streak + daily-goal XP once per day (not per session); a session needs 1+ set to finish; a session left open 30+ min ends at the last activity. Keep these? | Stops XP farming; changes game balance a little | Open (applied as default) |
| Q7 | 2026-11-17 | Should several short sessions on the same day (each with at least 1 set) each count toward "finish N sessions" unlocks and each open a chest? Now: yes | Someone could unlock faster with many tiny sessions | Open |
| Q5 | 2026-11-17 | Is the repo public or private? GitHub Pages for a private repo needs a paid plan | Decides how you open the web app on your phone | Open |
