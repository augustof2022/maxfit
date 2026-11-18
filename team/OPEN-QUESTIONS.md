# Open questions for Renz

| # | Date | Question | Why it matters | Status |
|---|---|---|---|---|
| Q1 | 2026-11-17 | Supabase project for MaxFit | Cloud sync needs it | **Answered 2026-11-17:** Renz will create a NEW Supabase project. Then: apply the migration, set the two env values (docs/SETUP.md) |
| Q2 | 2026-11-17 | Do you have a pull-up bar, dip bars, dumbbells or a jump rope at home? Which equipment does your gym have? | We seeded "Home" with a mat only and "Gym" with everything. You can edit them in Settings | Open |
| Q3 | 2026-11-17 | BMI categories | Label for the same BMI | **Answered 2026-11-17:** use WHO (current setting) |
| Q4 | 2026-11-17 | A 2026 ACSM resistance-training stand exists; we could not open it here. OK to keep 90 s rest default (ACSM 2009: 1–2 min) until we can check it? | Rest alarm default | Open |
| Q6 | 2026-11-17 | Fair-play rules (bonuses once a day, 1+ set to finish, forgotten sessions trimmed) | Game balance | **Answered 2026-11-17:** yes, keep |
| Q7 | 2026-11-17 | Several short sessions in one day each count toward session unlocks and chests | Unlock speed | **Answered 2026-11-17:** yes |
| Q5 | 2026-11-17 | Is the repo public or private? GitHub Pages for a private repo needs a paid plan | Decides how you open the web app on your phone | Open |
| Q8 | 2026-11-17 | The repo's default branch on GitHub is still the work branch. Switch it to `main`? (GitHub → Settings → General → Default branch) | New sessions and PRs start from main | Open |
| Q9 | 2026-11-18 | In-app update: OK to set a fixed APK signing key (one-time uninstall/reinstall)? Is cloud sync on, so that reinstall keeps data? Where to host the APK if the repo is private? | Each CI build is signed with a new random debug key, so Android refuses to update over it | Open |
| Q10 | 2026-11-18 | Multi-metric "beat" rule (e.g. weight + reps): A any goes up and none goes down / B main metric only / C combined score | Decides records, PRs and unlocks | Open |
| Q11 | 2026-11-18 | Starter cardio at home: swap "Run" for a home move (jumping jacks / high knees) or pick by location? | Run cannot be measured at home | Open |
| Q12 | 2026-11-18 | Hidden unlocks: hide fully, or show "? surprises waiting" plus a nameless hint for the next one? | Item 3 | Open |
| Q13 | 2026-11-18 | Goal profile: which goals and focus areas; may goals change reps and rest (only with sources)? | Item 4 | Open |
| Q14 | 2026-11-18 | Add a new `exercise-scientist` agent (high effort) to the MaxFit team? | Item 5; adding an agent needs Renz's yes | Open |
| Q15 | 2026-11-18 | Avatar style: an example image of a look you like | Item 6 quality bar | Open |
| Q16 | 2026-11-18 | After you edit or delete data: recompute XP, records and streak (yes); also re-lock exercises earned only from deleted data? | Item 7; today unlocks never re-lock | Open |
| Q17 | 2026-11-18 | Progress photos: phone only, or also private cloud backup? Show weight/BMI on the photo by default? | Item 8; body photos are sensitive data | Open |
| Q18 | 2026-11-18 | Deadline and order of the 8 items | Planning | Open |
