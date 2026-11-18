// End-to-end smoke test: drives the real app in Chromium at phone size.
// Run: npm run e2e   (starts the Vite dev server itself; screenshots go to test-results/)
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
// Uses the Playwright installed on the machine (npm i -g playwright && npx playwright install chromium).
const { chromium } = createRequire(import.meta.url)('playwright');

const PORT = 5199;
const BASE = `http://localhost:${PORT}/`;
const OUT = 'test-results';
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', env: { ...process.env, TZ: 'Asia/Manila' } });
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => String(d).includes('Local') && res());
  server.on('exit', () => rej(new Error('vite exited')));
  setTimeout(() => rej(new Error('vite start timeout')), 20000);
});

const results = [];
function check(name, ok, info = '') {
  results.push({ name, ok, info });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' - ' + info : ''}`);
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, timezoneId: 'Asia/Manila', permissions: [] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
// Wait for the screen's ease-in (about 0.5 s) so screenshots show the settled screen.
const shot = async (n) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });
};

// No workout without a plan (round 5): start a plan by name, then show every exercise here.
async function startPlan(name = 'Starter plan', showAll = true) {
  await page.getByRole('button', { name: `Start ${name}`, exact: true }).click();
  await page.getByText('Working').waitFor();
  if (showAll) await page.getByRole('button', { name: /Show all exercises here/ }).click();
}

// Grand reward cards (unlocks, gear, level-ups) come one at a time: tap Continue until none is left.
const rewardsSeen = [];
async function dismissRewards() {
  for (let i = 0; i < 60; i++) {
    const card = page.locator('.reward');
    if (!(await card.isVisible().catch(() => false))) {
      await page.waitForTimeout(250);
      if (!(await card.isVisible().catch(() => false))) return;
    }
    rewardsSeen.push((await page.locator('.reward-kicker').textContent()) + ': ' + (await page.locator('.reward-title').textContent()));
    await page.getByRole('button', { name: /^Continue/ }).click();
    await page.waitForTimeout(200);
  }
}

try {
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'MaxFit' }).waitFor();
  await page.getByRole('heading', { name: 'Level 1', exact: true }).waitFor();
  check('Home loads with level 1 avatar', true);
  check('Starter: 5 home-friendly exercises unlocked', await page.getByText(/^5 exercises unlocked/).isVisible());
  check('Goal prompt shows on first open', await page.getByRole('heading', { name: 'What is your goal?' }).isVisible());
  await shot('01-home');

  // Train: location picker -> Home has no dumbbells
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByRole('heading', { name: 'Train' }).waitFor();
  // Round 5: Train = "Where are you today?" + "My plans at <place>" only; every place has a Starter plan.
  await page.getByRole('heading', { name: 'My plans at Home' }).waitFor();
  check('Train shows only the place picker and My plans', (await page.getByText(/You can do here/).count()) === 0 && (await page.getByRole('heading', { name: 'Starter plan' }).count()) === 0 && (await page.getByRole('heading', { level: 2 }).count()) === 2);
  check('Home has a default, editable Starter plan', (await page.getByRole('button', { name: 'Start Starter plan', exact: true }).count()) === 1);
  check('No free session: no plain Start session on Train', (await page.getByRole('button', { name: 'Start session', exact: true }).count()) === 0);
  await shot('02-train-pre');

  // Settings: rest limit 15 s so the alarm test is quick
  await page.getByRole('button', { name: 'Settings' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Less Alarm when rest is longer than' }).click();
  await page.waitForTimeout(300);
  check('Rest limit set to 15 s', (await page.getByRole('textbox', { name: 'Alarm when rest is longer than', exact: true }).inputValue()) === '15');
  await shot('03-settings');

  // Start session, log push-ups
  await page.getByRole('button', { name: 'Train' }).click();
  await startPlan();
  await page.getByRole('button', { name: /^Push-up/ }).click();
  check('First push-up target shown', await page.getByText('First time: try 5').isVisible());
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'More Reps', exact: true }).click();
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.getByText('Resting').waitFor();
  check('Logging a set starts the rest timer', true);
  await shot('04-resting');
  await page.waitForTimeout(16000);
  check('Rest alarm state after limit', await page.getByText('Rest is over. Back to work!').isVisible());
  // "Back to work" floats: still on screen after scrolling to the bottom.
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(400);
  const fab = await page.getByRole('button', { name: 'Back to work' }).boundingBox();
  check('Back to work FAB stays visible while resting', !!fab && fab.y > 0 && fab.y + fab.height <= 844);
  check('Rep exercise shows a big Start set while resting', await page.getByRole('button', { name: 'Start set', exact: true }).isVisible());
  await shot('05-rest-over');
  await page.getByRole('button', { name: 'Start set', exact: true }).click();
  await page.getByText('Set in progress').waitFor();
  check('Start set switches to working', await page.getByText('Working', { exact: true }).isVisible());

  // Second set beats the record -> PR
  check('Target is now record + 1 (11)', await page.getByText(/Beat 10 reps: one more rep → 11 reps/).isVisible());
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.getByText(/NEW RECORD/).waitFor({ timeout: 3000 });
  check('Beating the record shows NEW RECORD', true);
  await dismissRewards();
  await page.getByRole('button', { name: 'Back to work' }).click();

  // Cardio: run / walk / rest, stop, enter km
  await page.getByRole('button', { name: /Run \/ walk/ }).click();
  await page.getByRole('button', { name: 'Start run / walk' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Walk', exact: true }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Rest', exact: true }).click();
  await page.waitForTimeout(1200);
  await shot('06-cardio');
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await page.getByRole('heading', { name: 'How far did you go?' }).waitFor();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText(/Run \/ walk saved: 1 km/).waitFor();
  check('Cardio saved with km', true);

  // Finish -> summary -> chest
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('heading', { name: /Session complete/ }).waitFor();
  await dismissRewards();
  check('Summary shows XP', await page.getByText(/\+\d+ XP/).first().isVisible());
  await page.getByRole('button', { name: 'Open mystery chest' }).click();
  await dismissRewards();
  await shot('07-summary');
  await page.getByRole('button', { name: 'Done' }).click();

  // Weight + BMI
  await page.getByRole('button', { name: 'Body' }).click();
  await page.getByRole('textbox', { name: 'Height', exact: true }).fill('170');
  await page.getByRole('button', { name: 'Save height' }).click();
  await page.getByRole('textbox', { name: 'Weight', exact: true }).fill('70');
  await page.getByRole('button', { name: 'Save weight' }).click();
  await page.getByText('24.2').first().waitFor();
  check('BMI 70 kg / 170 cm = 24.2 Normal', await page.getByText('Normal').first().isVisible());
  await shot('08-body');

  // Simulate yesterday's session to test the 2-day streak unlock (Boss R's example).
  await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    const t = Date.now() - 86400000;
    await db.sessions.put({ id: 'yday', startedAt: t, endedAt: t + 900000, locationId: null, status: 'done', activeSec: 700, restSec: 200, xpEarned: 0, prs: 0, live: null, updatedAt: Date.now() });
  });
  await page.getByRole('button', { name: 'Train' }).click();
  await startPlan();
  await page.getByRole('button', { name: /^Push-up/ }).click();
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  // 12 push-ups unlock Plank by a record: the grand card shows at once, mid-session.
  await page.locator('.reward').waitFor({ timeout: 4000 });
  check('Mid-session unlock shows a full-screen card', (await page.locator('.reward-kicker').textContent()) === 'New exercise unlocked' && /See it and try it in your exercise inventory/.test(await page.locator('.reward').textContent()));
  await shot('08b-reward-mid-session');
  await dismissRewards();
  await page.getByRole('button', { name: 'Back to work' }).click();
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('heading', { name: /Session complete/ }).waitFor();
  check('2-day streak unlocks Bodyweight squat (grand card)', await page.getByText('Bodyweight squat').first().isVisible());
  await dismissRewards();
  await page.getByRole('button', { name: 'Open mystery chest' }).click();
  await dismissRewards();
  await shot('09-unlock');
  await page.getByRole('button', { name: 'Done' }).click();

  await shot('10-home-after');
  await page.getByRole('button', { name: 'Progress' }).click();
  await shot('11-progress');

  // Gym location shows equipment exercises once unlocked; Home does not.
  // Unlocks come from the data now: 14 finished sessions unlock the dumbbell curl.
  await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    const t = Date.now() - 30 * 86400000;
    await db.sessions.bulkPut(Array.from({ length: 14 }, (_, i) => ({ id: `old${i}`, startedAt: t + i * 3600000, endedAt: t + i * 3600000 + 600000, locationId: null, status: 'done', activeSec: 500, restSec: 100, xpEarned: 10, prs: 0, live: null, updatedAt: Date.now() })));
  });
  await page.getByRole('button', { name: 'Train' }).click();
  // The picker lists only unlocked exercises the place's equipment allows.
  const pickerHas = async (place, exercise) => {
    await page.getByRole('radio', { name: place, exact: true }).first().click();
    await page.getByRole('button', { name: 'New plan', exact: true }).first().click();
    await page.getByRole('list', { name: 'Exercises to add' }).waitFor();
    const has = (await page.getByRole('button', { name: `Add ${exercise}`, exact: true }).count()) > 0;
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    return has;
  };
  const gymHasCurl = await pickerHas('Gym', 'Dumbbell curl');
  const homeHasCurl = await pickerHas('Home', 'Dumbbell curl');
  check('Saved locations load equipment (curl at Gym, not at Home)', gymHasCurl && !homeHasCurl, `gym=${gymHasCurl} home=${homeHasCurl}`);

  // New place: type a name, pick equipment from the library, add a custom item.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'New place', exact: true }).click();
  await page.getByPlaceholder(/Office gym/).fill('Office gym');
  await page.getByRole('button', { name: 'Dumbbells' }).click();
  await page.getByRole('searchbox', { name: 'Search equipment' }).fill('hip abductor');
  check('Search shows "not in the library yet"', await page.getByText('is not in the library yet').isVisible());
  await page.getByRole('button', { name: /^Add new equipment/ }).click();
  await page.getByRole('button', { name: 'Add + select' }).click();
  await page.waitForTimeout(300);
  check('Custom equipment added and selected', (await page.getByRole('button', { name: 'hip abductor', exact: true }).getAttribute('aria-pressed')) === 'true');
  await shot('12-place-editor');
  await page.getByRole('button', { name: 'Save place' }).click();
  await page.waitForTimeout(300);
  check('New place listed with its equipment', await page.getByText('Office gym').isVisible() && (await page.getByText(/2 items: Dumbbells, hip abductor/).count()) > 0);
  await page.getByRole('button', { name: 'Train' }).click();
  await page.getByRole('radio', { name: /Office gym/ }).click();
  await page.waitForTimeout(300);
  check('A new place gets its own Starter plan', (await page.getByRole('heading', { name: 'My plans at Office gym' }).count()) === 1 && (await page.getByRole('button', { name: 'Start Starter plan', exact: true }).count()) === 1);
  check('Training at the new place loads its equipment', await pickerHas('Office gym', 'Dumbbell curl'));
  await shot('13-train-new-place');

  // ---- Exercise plans per place (Boss R, 2026-11-18) ----
  await page.getByRole('radio', { name: 'Gym', exact: true }).first().click();
  await page.getByRole('button', { name: 'New plan', exact: true }).first().click();
  // + New plan = the row list: name, body parts, description, Watch the steps, my last, beat target, + Add.
  const pushRow = page.getByRole('listitem', { name: 'Push-up', exact: true });
  check('Picker row: name, body parts, description, Watch the steps, Last, Beat, + Add', /Chest, Arms, Shoulders/.test(await pushRow.textContent()) && /Body straight/.test(await pushRow.textContent()) && (await pushRow.getByRole('button', { name: 'Watch the steps: Push-up' }).count()) === 1 && /Last .*Beat: /.test(await pushRow.textContent()) && (await pushRow.getByRole('button', { name: 'Add Push-up' }).count()) === 1);
  await shot('19-picker');
  // Filters: cardio, bodyweight vs equipment, search; then add with the config sheet, filters kept.
  await page.getByRole('radio', { name: 'Cardio', exact: true }).click();
  const cardioOk = (await page.getByRole('button', { name: 'Add Run in place' }).count()) === 1 && (await page.getByRole('button', { name: 'Add Push-up' }).count()) === 0;
  await page.getByRole('radio', { name: 'All', exact: true }).click();
  await page.getByRole('radio', { name: 'Bodyweight', exact: true }).click();
  const bwOk = (await page.getByRole('button', { name: 'Add Dumbbell curl' }).count()) === 0 && (await page.getByRole('button', { name: 'Add Push-up' }).count()) === 1;
  await page.getByRole('radio', { name: 'Equipment', exact: true }).click();
  const eqOk = (await page.getByRole('button', { name: 'Add Dumbbell curl' }).count()) === 1 && (await page.getByRole('button', { name: 'Add Push-up' }).count()) === 0;
  await page.getByRole('radio', { name: 'Any', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search exercises' }).fill('push up');
  const searchOk = (await page.getByRole('button', { name: 'Add Push-up' }).count()) === 1 && (await page.getByRole('button', { name: 'Add Run in place' }).count()) === 0;
  check('Picker filters: cardio, bodyweight, equipment, search', cardioOk && bwOk && eqOk && searchOk, `cardio=${cardioOk} bw=${bwOk} eq=${eqOk} search=${searchOk}`);
  await page.getByRole('button', { name: 'Add Push-up' }).click();
  await page.getByRole('radiogroup', { name: 'How to beat it' }).waitFor();
  check('+ Add opens the config sheet: sets, target, how to beat', (await page.getByRole('textbox', { name: 'Sets', exact: true }).count()) === 1 && (await page.getByRole('textbox', { name: 'Reps', exact: true }).count()) === 1);
  await page.getByRole('button', { name: 'More Sets' }).click();
  await shot('19b-config-sheet');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  check('Back in the list with the search kept; the row shows Added', (await page.getByRole('searchbox', { name: 'Search exercises' }).inputValue()) === 'push up' && (await pushRow.getByText('Added', { exact: true }).count()) === 1 && (await page.getByRole('status').filter({ hasText: 'Push-up added' }).count()) === 1);
  await page.getByRole('searchbox', { name: 'Search exercises' }).fill('');
  for (const n of ['Dumbbell curl', 'Run in place']) {
    await page.getByRole('button', { name: `Add ${n}`, exact: true }).click();
    await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  }
  await page.getByPlaceholder('e.g. Push day').fill('Gym A');
  await page.getByPlaceholder(/Chest and arms/).fill('Quick full body');
  await page.getByRole('button', { name: 'Move Run in place up' }).click();
  check('Plan item keeps its sets from the sheet (4 sets)', /4 sets/.test(await page.getByRole('listitem', { name: 'Plan exercise 1: Push-up' }).textContent()));
  await shot('20-plan-editor');
  await page.getByRole('button', { name: /^Save plan/ }).click();
  await page.getByRole('region', { name: 'Plan Gym A' }).waitFor();
  const order = await page.getByRole('region', { name: 'Plan Gym A' }).locator('.plan-ex b').allTextContents();
  check('Plan saved with its exercises in the chosen order', order.join(',') === 'Push-up,Run in place,Dumbbell curl', order.join(','));
  await shot('21-plan-detail');
  await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
  await page.getByRole('heading', { name: 'Edit plan' }).waitFor();
  check('Duplicate opens the copy to rename', (await page.getByPlaceholder('e.g. Push day').inputValue()) === 'Gym A (copy)');
  await page.getByPlaceholder('e.g. Push day').fill('Gym B');
  await page.getByRole('button', { name: /^Save plan/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await page.waitForTimeout(300);
  check('Duplicate made, then deleted; the original stays', (await page.getByRole('button', { name: /^Gym B, / }).count()) === 0 && (await page.getByRole('button', { name: /^Gym A, / }).count()) === 1);
  // Import from Gym into Home: a copy. Edit the copy; the Gym original keeps 3 exercises.
  await page.getByRole('radio', { name: 'Home', exact: true }).first().click();
  await page.getByRole('button', { name: 'Import a plan from another place' }).click();
  await page.getByRole('radiogroup', { name: 'Import from place' }).getByRole('radio', { name: 'Gym', exact: true }).click();
  await page.getByRole('button', { name: 'Import Gym A' }).click();
  await page.getByRole('region', { name: 'Plan Gym A' }).waitFor();
  // Editing is obvious on the open plan: "Edit plan".
  await page.getByRole('button', { name: 'Edit plan', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Dumbbell curl' }).click();
  await shot('21b-plan-edit');
  // Code review round 5: a confirm opened from the editor must be on top and tappable.
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  const leave = page.getByRole('button', { name: 'Leave', exact: true });
  await leave.waitFor();
  const onTop = await leave.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && (hit === el || el.contains(hit));
  });
  check('"Leave without saving?" shows on top of the plan editor and can be tapped', onTop);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: /^Save plan/ }).click();
  await page.waitForTimeout(300);
  const counts = await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    return (await db.plans.toArray()).filter((p) => !p.deleted && p.name === 'Gym A').map((p) => `${p.locationId}:${p.items.length}`).sort().join(',');
  });
  check('Imported plan is a copy (Home edited, Gym original unchanged)', counts === 'gym:3,home:2', counts);

  // Start the plan at Gym: only its exercises, plus "Show all exercises here".
  await page.getByRole('radio', { name: 'Gym', exact: true }).first().click();
  await page.getByRole('button', { name: 'Start Gym A', exact: true }).click();
  await page.getByRole('heading', { name: 'Gym A', level: 1 }).waitFor();
  const onlyPlan = (await page.getByRole('button', { name: /Bodyweight squat/ }).count()) === 0;
  await page.getByRole('button', { name: /Show all exercises here/ }).click();
  check('A plan shows only its exercises, with "Show all exercises here"', onlyPlan && (await page.getByRole('button', { name: /Bodyweight squat/ }).count()) === 1);
  await page.getByRole('button', { name: /Show all exercises here|Hide other exercises/ }).click();

  // Timer: 3-2-1-GO, big clock, big Stop; Stop fills the time and starts the rest.
  await page.getByRole('button', { name: /Run in place/ }).first().click();
  await page.getByRole('button', { name: 'Start timer', exact: true }).click();
  await page.getByText('Get ready').waitFor();
  await shot('22-timer-countdown');
  await page.waitForTimeout(4200);
  check('Timer: big clock running, session switched to working', await page.locator('.timer-clock').isVisible() && (await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    return (await db.sessions.toArray()).find((x) => x.status === 'active')?.live?.mode;
  })) === 'exercise');
  await shot('23-timer-running');
  await page.getByRole('button', { name: 'Stop the timer' }).click();
  await page.getByText('Resting').waitFor();
  const filled = await page.getByRole('textbox', { name: 'Time', exact: true }).inputValue();
  check('Stop fills the seconds and switches to resting', Number(filled) >= 1, `time=${filled}`);
  // 95 s of running in place unlocks High knees by a record: add it to this plan from the card.
  await page.getByRole('textbox', { name: 'Time', exact: true }).fill('95');
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.locator('.reward').waitFor({ timeout: 4000 });
  for (let i = 0; i < 6 && !(await page.getByRole('button', { name: /Add to plan "Gym A"/ }).isVisible()); i++) await page.getByRole('button', { name: /^Continue/ }).click();
  await shot('24-reward-add-to-plan');
  await page.getByRole('button', { name: /Add to plan "Gym A"/ }).click();
  await page.getByRole('button', { name: /Added to "Gym A"/ }).waitFor();
  await dismissRewards();
  check('New exercise added to the running plan from its unlock card', (await page.getByRole('button', { name: /High knees/ }).count()) === 1);

  // History: tap it, see days with the best set, records marked, and a trend chart.
  // (One earlier day of push-ups, so there are 2 days to chart.)
  await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    const t = Date.now() - 3 * 86400000;
    await db.sets.bulkPut([{ id: 'h1', sessionId: 'old0', exerciseId: 'push_up', at: t, reps: 6, isPR: false, updatedAt: Date.now() }, { id: 'h2', sessionId: 'old0', exerciseId: 'push_up', at: t + 60000, reps: 8, isPR: false, updatedAt: Date.now() }]);
  });
  await page.getByRole('button', { name: /Push-up/ }).first().click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  const hist = page.getByRole('list', { name: 'Push-up by day' });
  await hist.waitFor();
  check('History lists days with the best set and records marked', (await hist.getByRole('listitem').count()) >= 2 && (await hist.getByText('Record', { exact: true }).count()) >= 1 && (await hist.getByText('8 reps').count()) === 1 && (await page.getByRole('img', { name: /Trend in reps/ }).count()) === 1);
  await shot('25-history');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.mouse.wheel(0, 5000);
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('heading', { name: /Session complete/ }).waitFor();
  await dismissRewards();
  await page.getByRole('button', { name: 'Open mystery chest' }).click();
  await dismissRewards();
  await page.getByRole('button', { name: 'Done' }).click();
  check('Home lists exercises done with Last and Best', (await page.getByRole('region', { name: "Exercises you've done" }).getByText(/Last .* · Best /).count()) >= 2);
  await shot('26-home-done');

  // Reload keeps data (local database)
  await page.reload();
  await page.getByRole('button', { name: 'Progress' }).click();
  check('Data survives reload', await page.getByRole('heading', { name: 'History' }).isVisible());

  // Surprises: locked moves are hidden; only a count and a nameless hint show.
  check('Locked exercises are hidden (no Muscle-up on Progress)', (await page.getByText('Muscle-up').count()) === 0 && (await page.getByText(/surprises waiting/).count()) > 0);
  await shot('14-progress-surprises');

  // How to do it: real start/finish photos + avatar + YouTube search.
  await page.getByRole('button', { name: 'How to do Push-up' }).click();
  await page.getByRole('img', { name: 'Push-up, finish position' }).waitFor();
  const ok = await page.getByRole('img', { name: 'Push-up, start position' }).evaluate((img) => img.complete && img.naturalWidth > 0);
  check('Exercise demo shows real photos and a YouTube link', ok && (await page.getByRole('link', { name: /Watch on YouTube/ }).count()) === 1);
  await shot('14b-demo');
  await page.getByRole('button', { name: 'Got it' }).click();

  // Measures: push-up measured by reps + time.
  await page.getByRole('button', { name: 'How Push-up is measured' }).click();
  await page.getByRole('radio', { name: 'Same ___, beat ___' }).click();
  await shot('15a-how-to-beat');
  check('"How to beat it" offers same weight / same distance', (await page.getByRole('radio', { name: 'Same weight' }).count()) === 1 && (await page.getByRole('radio', { name: 'Faster time' }).count()) === 1);
  await page.getByRole('radio', { name: 'Beat any number' }).click();
  await page.getByRole('button', { name: /^Time/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.waitForTimeout(300);
  check('Push-up can be measured by reps + time', (await page.getByRole('button', { name: 'How Push-up is measured' }).textContent()).includes('Reps + Time'));

  // Edit a set from History, with "are you sure?"
  await page.getByRole('button', { name: 'Edit Push-up set' }).first().click();
  await page.getByRole('heading', { name: /Edit set · Push-up/ }).waitFor();
  await page.getByRole('button', { name: 'More Reps', exact: true }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  check('Edit asks "Save this correction?"', await page.getByRole('heading', { name: 'Save this correction?' }).isVisible());
  await page.getByRole('button', { name: 'Save', exact: true }).last().click();
  await page.waitForTimeout(300);
  await shot('15-edited');

  // Delete a session, with confirm
  await page.getByRole('button', { name: 'Edit session' }).first().click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  check('Delete asks first', await page.getByRole('heading', { name: 'Delete this session?' }).isVisible());
  await page.getByRole('button', { name: 'Delete', exact: true }).last().click();
  await page.waitForTimeout(300);

  // Goals + avatar style
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /Lose weight/ }).first().click();
  await page.getByRole('button', { name: 'Core', exact: true }).first().click();
  await page.getByRole('button', { name: 'Save goals' }).first().click();
  await page.waitForTimeout(300);
  check('Goals saved', await page.getByRole('button', { name: /Lose weight/ }).first().getAttribute('aria-pressed') === 'true');
  await page.getByRole('radio', { name: /Neon line/ }).click();
  await page.waitForTimeout(400);
  check('Three avatar styles, one picked', (await page.getByRole('radio', { name: /Athlete|Neon line|Buddy/ }).count()) === 3 && (await page.getByRole('radio', { name: /Neon line/ }).getAttribute('aria-checked')) === 'true');
  await page.getByRole('radiogroup', { name: 'Gender' }).getByRole('radio', { name: 'Female' }).click();
  await page.waitForTimeout(300);
  check('Gender Female saved in the profile', (await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    return (await db.profile.get('me')).gender;
  })) === 'female');
  await shot('16-settings-goals-style');

  // Progress photo with stats, saved to the on-phone timeline.
  await page.getByRole('button', { name: 'Body' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Choose photo/ }).click();
  await (await chooser).setFiles('tests/e2e/fixtures/photo.jpg');
  await page.getByRole('img', { name: 'Preview with your stats' }).waitFor({ timeout: 10000 });
  await page.getByRole('radio', { name: 'Glass card' }).click();
  await page.waitForTimeout(500);
  await shot('17-photo-composer');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await dl;
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  check('Photo saved to the timeline', (await page.getByRole('button', { name: /Photo from/ }).count()) === 1);
  check('Photo row keeps the "I did" lines', (await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    return (await db.photos.toArray())[0]?.did?.lines?.length ?? 0;
  })) >= 1);
  await shot('18-body-photos');

  // Delete test data (two questions), then Home is back to a fresh start.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Delete test data' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await page.waitForTimeout(400);
  await page.locator('.tabbar').getByRole('button', { name: 'Home' }).click();
  await page.waitForTimeout(600);
  check('Reset: back to level 1 and 5 starters', await page.getByRole('heading', { name: 'Level 1', exact: true }).isVisible() && (await page.getByText(/^5 exercises unlocked/).count()) === 1);
} catch (e) {
  check('Flow ran to the end', false, String(e).split('\n')[0]);
  await shot('99-failure');
} finally {
  check('No page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  console.log('Reward cards seen: ' + rewardsSeen.join(' | '));
  await browser.close();
  server.kill();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
