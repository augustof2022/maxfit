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
| Q9 | 2026-11-18 | In-app update: OK to set a fixed APK signing key (one-time uninstall/reinstall)? Is cloud sync on, so that reinstall keeps data? Where to host the APK if the repo is private? | Each CI build is signed with a new random debug key, so Android refuses to update over it | **Answered 2026-11-18:** yes to a fixed signing key (Renz adds 2 GitHub secrets); no cloud sync yet (setup steps sent); repo is public |
| Q10 | 2026-11-18 | Multi-metric "beat" rule (e.g. weight + reps): A any goes up and none goes down / B main metric only / C combined score | Decides records, PRs and unlocks | **Answered 2026-11-18:** rule A |
| Q11 | 2026-11-18 | Starter cardio at home: swap "Run" for a home move (jumping jacks / high knees) or pick by location? | Run cannot be measured at home | **Answered 2026-11-18 (via research):** day 1 has run in place + run; jumping jacks and high knees follow |
| Q12 | 2026-11-18 | Hidden unlocks: hide fully, or show "? surprises waiting" plus a nameless hint for the next one? | Item 3 | **Answered 2026-11-18:** hide fully; nameless hint kept |
| Q13 | 2026-11-18 | Goal profile: which goals and focus areas; may goals change reps and rest (only with sources)? | Item 4 | **Answered 2026-11-18:** OK to the list; rep/rest by goal only with sources (not built yet) |
| Q14 | 2026-11-18 | Add a new `exercise-scientist` agent (high effort) to the MaxFit team? | Item 5; adding an agent needs Renz's yes | **Answered 2026-11-18:** yes, added |
| Q15 | 2026-11-18 | Avatar style: an example image of a look you like | Item 6 quality bar | **Answered 2026-11-18:** propose 3, and they must move (walk, jump, do exercises) |
| Q16 | 2026-11-18 | After you edit or delete data: recompute XP, records and streak (yes); also re-lock exercises earned only from deleted data? | Item 7; today unlocks never re-lock | **Answered 2026-11-18:** yes, deleted data locks again; corrections keep it; every change asks "are you sure?" |
| Q17 | 2026-11-18 | Progress photos: phone only, or also private cloud backup? Show weight/BMI on the photo by default? | Item 8; body photos are sensitive data | **Answered 2026-11-18:** phone only |
| Q18 | 2026-11-18 | Deadline and order of the 8 items | Planning | **Answered 2026-11-18:** deadline now |
| Q19 | 2026-11-18 | Cardio records: may run / treadmill / bike compare distance and **pace** instead of raw time? With rule A and raw time, a faster run over the same distance is not a record | Fairness for cardio records | **Answered 2026-11-18:** by exercise: normal run = distance + time; sprints = fixed distance, faster time wins (built) |
| Q20 | 2026-11-18 | Home equipment: do you have a resistance band, pull-up bar, dumbbells, ab wheel? | Several new moves need them; Home is seeded with a mat only | **Answered 2026-11-18:** depends on his places; never surprise-add a move he cannot do (built: equipment-aware) |
| Q21 | 2026-11-18 | Secret moves only after their base move is unlocked (e.g. skater jump after jumping jacks)? | Safety of chest surprises; small engine change | **Answered 2026-11-18:** yes (built) |
| Q22 | 2026-11-18 | Allow acsm.org, pacompendium.com and pmc.ncbi.nlm.nih.gov in the session network so sources can be opened, not just searched? | All new sources are "search only" | **Answered 2026-11-18:** yes (hosts added; acsm.org still 403) |
| Q23 | 2026-11-18 | Goal-based rep and rest targets (e.g. shorter rest for stamina)? The research table has them with grades | Item 4 part 2 | **Answered 2026-11-18:** yes (built, Apply button for rest) |
| Q24 | 2026-11-18 | Should a variation count as a full unlock (gear, "N unlocked") or a smaller "inventory" unlock? Built as full for now | Avatar gear pace | Open |
| Q25 | 2026-11-18 | Is 100 m the sprint distance you want? The distance is part of the exercise id | Changing later splits records | **Answered 2026-11-18:** sprint = an exercise where Renz sets the distance and the faster time wins; same idea for barbell: fixed weight, beat the reps; a heavier weight starts a new count (proposal sent, waiting for go) |
| Q26 | 2026-11-18 | "How to beat" per exercise: (1) beat any number, or (2) same weight/distance, beat reps/time, with records kept per weight or distance (heavier = new level). Defaults: lifts = same weight, beat reps; sprint = same distance, faster time; run = farther or longer. Go? | Renz: "I think this needs to be configurable for every exercise" | Open |
| Q27 | 2026-11-18 | Q24 (variation = full unlock?) — did Renz's answer cover it? Default kept: full unlock | Gear pace | Open |
