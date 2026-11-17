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
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: true });

try {
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'MaxFit' }).waitFor();
  await page.getByRole('heading', { name: 'Level 1', exact: true }).waitFor();
  check('Home loads with level 1 avatar', true);
  check('Starter: 2 exercises unlocked', await page.getByText('2 exercises unlocked').isVisible());
  await shot('01-home');

  // Train: location picker -> Home has no dumbbells
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByRole('heading', { name: 'Train' }).waitFor();
  check('Train shows only push-up and run at Home', (await page.getByText('You can do here (2)').count()) === 1);
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
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'More Reps done' }).click();
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await page.getByText('Resting').waitFor();
  check('Logging a set starts the rest timer', true);
  await shot('04-resting');
  await page.waitForTimeout(16000);
  check('Rest alarm state after limit', await page.getByText('Rest is over. Back to work!').isVisible());
  await shot('05-rest-over');
  await page.getByRole('button', { name: 'Back to work' }).click();

  // Second set beats the record -> PR
  check('Target is now record + 1 (11)', await page.getByText('Beat 10: do 11').isVisible());
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
  await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    await db.profile.update('me', { unlocked: ['push_up', 'run', 'db_curl'] });
  });
  await page.getByRole('button', { name: 'Train' }).click();
  await page.getByRole('radio', { name: /Gym/ }).click();
  await page.waitForTimeout(400);
  const gymHasCurl = (await page.getByText('Dumbbell curl').count()) > 0;
  await page.getByRole('radio', { name: /Home/ }).click();
  await page.waitForTimeout(400);
  const homeHasCurl = (await page.getByText('Dumbbell curl').count()) > 0;
  check('Saved locations load equipment (curl at Gym, not at Home)', gymHasCurl && !homeHasCurl, `gym=${gymHasCurl} home=${homeHasCurl}`);

  // Reload keeps data (local database)
  await page.reload();
  await page.getByRole('button', { name: 'Progress' }).click();
  check('Data survives reload', await page.getByText('Recent sessions').isVisible());
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
