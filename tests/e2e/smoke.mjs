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

try {
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'MaxFit' }).waitFor();
  await page.getByRole('heading', { name: 'Level 1', exact: true }).waitFor();
  check('Home loads with level 1 avatar', true);
  check('Starter: 4 home-friendly exercises unlocked', await page.getByText(/^4 exercises unlocked/).isVisible());
  check('Goal prompt shows on first open', await page.getByRole('heading', { name: 'What is your goal?' }).isVisible());
  await shot('01-home');

  // Train: location picker -> Home has no dumbbells
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByRole('heading', { name: 'Train' }).waitFor();
  check('Train shows the 4 starters at Home', (await page.getByText('You can do here (4)').count()) === 1);
  await shot('02-train-pre');

  // Settings: rest limit 15 s so the alarm test is quick
  await page.getByRole('button', { name: 'Settings' }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Less Alarm when rest is longer than' }).click();
  await page.waitForTimeout(300);
  check('Rest limit set to 15 s', (await page.getByRole('textbox', { name: 'Alarm when rest is longer than', exact: true }).inputValue()) === '15');
  await shot('03-settings');

  // Start session, log push-ups
  await page.getByRole('button', { name: 'Train' }).click();
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await page.getByText('Working').waitFor();
  await page.getByRole('button', { name: /Push-up/ }).click();
  check('First push-up target shown', await page.getByText('First time: try 5').isVisible());
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'More Reps', exact: true }).click();
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.getByText('Resting').waitFor();
  check('Logging a set starts the rest timer', true);
  await shot('04-resting');
  await page.waitForTimeout(16000);
  check('Rest alarm state after limit', await page.getByText('Rest is over. Back to work!').isVisible());
  await shot('05-rest-over');
  await page.getByRole('button', { name: 'Back to work' }).click();

  // Second set beats the record -> PR
  check('Target is now record + 1 (11)', await page.getByText(/Beat 10 reps: one more rep → 11 reps/).isVisible());
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.getByText(/NEW RECORD/).waitFor({ timeout: 3000 });
  check('Beating the record shows NEW RECORD', true);
  await page.getByRole('button', { name: 'Back to work' }).click();

  // Cardio: run / walk / rest, stop, enter km
  await page.getByRole('button', { name: /Run \/ walk/ }).click();
  await page.getByRole('button', { name: 'Start run / walk' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: '🚶 Walk' }).click();
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: '⏸ Rest' }).click();
  await page.waitForTimeout(1200);
  await shot('06-cardio');
  await page.getByRole('button', { name: '⏹ Stop' }).click();
  await page.getByRole('heading', { name: 'How far did you go?' }).waitFor();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByText(/Run \/ walk saved: 1 km/).waitFor();
  check('Cardio saved with km', true);

  // Finish -> summary -> chest
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('heading', { name: /Session complete/ }).waitFor();
  check('Summary shows XP', await page.getByText(/\+\d+ XP/).first().isVisible());
  await page.getByRole('button', { name: 'Open mystery chest' }).click();
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
  await page.getByRole('button', { name: 'Start session', exact: true }).click();
  await page.getByRole('button', { name: /Push-up/ }).click();
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.getByRole('button', { name: 'Back to work' }).click();
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('heading', { name: /Session complete/ }).waitFor();
  check('2-day streak unlocks Bodyweight squat', await page.getByText('Bodyweight squat').first().isVisible());
  await page.getByRole('button', { name: 'Open mystery chest' }).click();
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
  await page.getByRole('radio', { name: /Gym/ }).click();
  await page.waitForTimeout(400);
  const gymHasCurl = (await page.getByText('Dumbbell curl').count()) > 0;
  await page.getByRole('radio', { name: /Home/ }).click();
  await page.waitForTimeout(400);
  const homeHasCurl = (await page.getByText('Dumbbell curl').count()) > 0;
  check('Saved locations load equipment (curl at Gym, not at Home)', gymHasCurl && !homeHasCurl, `gym=${gymHasCurl} home=${homeHasCurl}`);

  // New place: type a name, pick equipment from the library, add a custom item.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: '+ New place' }).click();
  await page.getByPlaceholder(/Office gym/).fill('Office gym');
  await page.getByRole('button', { name: 'Dumbbells' }).click();
  await page.getByRole('searchbox', { name: 'Search equipment' }).fill('hip abductor');
  check('Search shows "not in the library yet"', await page.getByText('is not in the library yet').isVisible());
  await page.getByRole('button', { name: /\+ Add new equipment/ }).click();
  await page.getByRole('button', { name: 'Add + select' }).click();
  await page.waitForTimeout(300);
  check('Custom equipment added and selected', await page.getByRole('button', { name: /✓ hip abductor ★/ }).isVisible());
  await shot('12-place-editor');
  await page.getByRole('button', { name: 'Save place' }).click();
  await page.waitForTimeout(300);
  check('New place listed with its equipment', await page.getByText('Office gym').isVisible() && (await page.getByText(/2 items: Dumbbells, hip abductor/).count()) > 0);
  await page.getByRole('button', { name: 'Train' }).click();
  await page.getByRole('radio', { name: /Office gym/ }).click();
  await page.waitForTimeout(300);
  check('Training at the new place loads its equipment', (await page.getByText('Dumbbell curl').count()) > 0);
  await shot('13-train-new-place');

  // Reload keeps data (local database)
  await page.reload();
  await page.getByRole('button', { name: 'Progress' }).click();
  check('Data survives reload', await page.getByRole('heading', { name: 'History' }).isVisible());

  // Surprises: locked moves are hidden; only a count and a nameless hint show.
  check('Locked exercises are hidden (no Muscle-up on Progress)', (await page.getByText('Muscle-up').count()) === 0 && (await page.getByText(/surprises waiting/).count()) > 0);
  await shot('14-progress-surprises');

  // Measures: push-up measured by reps + time.
  await page.getByRole('button', { name: 'How Push-up is measured' }).click();
  await page.getByRole('button', { name: /^Time/ }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('button', { name: 'Change', exact: true }).click();
  await page.waitForTimeout(300);
  check('Push-up can be measured by reps + time', (await page.getByRole('button', { name: 'How Push-up is measured' }).textContent()).includes('Reps+Time'));

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
  await page.getByRole('button', { name: '⬇ Save' }).click();
  await dl;
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  check('Photo saved to the timeline', (await page.getByRole('button', { name: /Photo from/ }).count()) === 1);
  await shot('18-body-photos');

  // Delete test data (two questions), then Home is back to a fresh start.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Delete test data' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await page.waitForTimeout(400);
  await page.locator('.tabbar').getByRole('button', { name: 'Home' }).click();
  await page.waitForTimeout(600);
  check('Reset: back to level 1 and 4 starters', await page.getByRole('heading', { name: 'Level 1', exact: true }).isVisible() && (await page.getByText(/^4 exercises unlocked/).count()) === 1);
} catch (e) {
  check('Flow ran to the end', false, String(e).split('\n')[0]);
  await shot('99-failure');
} finally {
  check('No page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  server.kill();
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
