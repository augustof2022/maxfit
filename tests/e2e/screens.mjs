// Phone screenshots of every screen and state, for design review (round 5).
// Run: npm run screens   → docs/screens/round5/*.png at 412×915 (a common Android size), 2x for crisp review.
// Seeds realistic data (yesterday's session with records, a weigh-in) through the app's own database.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');

const PORT = 5197;
const BASE = `http://localhost:${PORT}/`;
const OUT = process.env.SCREENS_OUT || 'docs/screens/round5';
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'pipe', env: { ...process.env, TZ: 'Asia/Manila' } });
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => String(d).includes('Local') && res());
  server.on('exit', () => rej(new Error('vite exited')));
  setTimeout(() => rej(new Error('vite start timeout')), 20000);
});

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2, timezoneId: 'Asia/Manila' });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const taken = [];
const shot = async (name, full = false) => {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  taken.push(name);
};
const tab = (name) => page.locator('.tabbar').getByRole('button', { name, exact: true }).click();
const dismissRewards = async () => {
  for (let i = 0; i < 40 && (await page.locator('.reward').isVisible().catch(() => false)); i++) {
    const skip = page.getByRole('button', { name: /Skip the rest/ });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    else await page.getByRole('button', { name: /^Continue/ }).click();
    await page.waitForTimeout(150);
  }
};

try {
  await page.goto(BASE);
  await page.getByRole('heading', { name: 'Level 1', exact: true }).waitFor();
  // Realistic history: 3 earlier days with push-ups and planks, a weigh-in, height.
  await page.evaluate(async () => {
    const { db } = await import('/src/data/db.ts');
    const day = 86400000;
    const now = Date.now();
    const rows = [];
    const sets = [];
    [3, 2, 1].forEach((n, i) => {
      const t = now - n * day;
      rows.push({ id: `s${n}`, startedAt: t, endedAt: t + 1200000, locationId: 'home', status: 'done', activeSec: 840, restSec: 360, xpEarned: 60, prs: 1, live: null, updatedAt: now });
      sets.push({ id: `p${n}a`, sessionId: `s${n}`, exerciseId: 'push_up', at: t + 60000, reps: 8 + i * 2, isPR: true, updatedAt: now });
      sets.push({ id: `p${n}b`, sessionId: `s${n}`, exerciseId: 'push_up', at: t + 240000, reps: 7 + i * 2, isPR: false, updatedAt: now });
      sets.push({ id: `r${n}`, sessionId: `s${n}`, exerciseId: 'run_in_place', at: t + 480000, seconds: 60 + i * 15, isPR: i > 0, updatedAt: now });
    });
    await db.sessions.bulkPut(rows);
    await db.sets.bulkPut(sets);
    await db.weights.put({ id: 'w1', date: new Date(now - day).toISOString().slice(0, 10), kg: 72.4, updatedAt: now });
    await db.profile.update('me', { heightCm: 172, name: 'Renz', goals: ['muscle'], focus: ['chest', 'core'], updatedAt: now });
  });
  await page.reload();
  await page.getByRole('heading', { name: /Hi, Renz/ }).waitFor();
  await shot('01-home');
  await shot('01b-home-full', true);
  await page.getByRole('button', { name: 'Start session' }).click();
  await page.getByRole('heading', { name: /Start a plan/ }).waitFor();
  await shot('01c-home-start-sheet');
  await page.getByRole('button', { name: 'Change place or edit plans' }).click();

  // Train: place + My plans
  await page.getByRole('heading', { name: 'My plans at Home' }).waitFor();
  await shot('02-train');
  await page.getByRole('button', { name: /^Starter plan, / }).click();
  await shot('03-plan-open');
  // Real viewport, scrolled to the end: the last rows clear the tab bar (no full-page capture artefact).
  await page.mouse.wheel(0, 3000);
  await shot('03b-plan-open-bottom');
  await page.mouse.wheel(0, -3000);

  // New plan: picker, filter, config sheet, editing
  await page.getByRole('button', { name: 'New plan', exact: true }).first().click();
  await page.getByRole('list', { name: 'Exercises to add' }).waitFor();
  await shot('04-new-plan-picker');
  await page.getByRole('radio', { name: 'Cardio', exact: true }).click();
  await shot('05-picker-filter-cardio');
  await page.getByRole('radio', { name: 'All', exact: true }).click();
  await page.getByRole('button', { name: 'Add Push-up', exact: true }).click();
  await page.locator('[aria-label="How to beat it"]').waitFor();
  await shot('06-config-sheet');
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await page.getByRole('button', { name: 'Add Run in place', exact: true }).click();
  await page.getByRole('button', { name: 'Add to plan', exact: true }).click();
  await shot('07-picker-added');
  await page.getByPlaceholder('e.g. Push day').fill('Push and cardio');
  await page.getByRole('button', { name: 'Description', exact: true }).click();
  await page.getByPlaceholder(/Chest and arms/).fill('Chest first, then a short run in place');
  await page.locator('.page-body').evaluate((el) => el.scrollTo(0, 0));
  await shot('08-plan-editor-top');
  await page.getByRole('button', { name: /2 added/ }).click();
  await shot('08b-plan-editor-review');
  await page.getByRole('button', { name: /^Save plan/ }).click();
  await page.waitForTimeout(400);
  await shot('09-train-with-plans');

  // Session from the plan
  await page.getByRole('button', { name: 'Start Push and cardio', exact: true }).click();
  await page.getByText('Working').waitFor();
  await page.getByRole('button', { name: /^Push-up/ }).first().click();
  await shot('10-session-working');
  await page.getByRole('button', { name: 'Log set + rest' }).click();
  await dismissRewards();
  await page.getByText('Resting').waitFor();
  await page.mouse.wheel(0, 600);
  await shot('11-session-resting-fab');
  await page.getByRole('button', { name: 'Back to work' }).click();
  await page.getByRole('button', { name: /^Run in place/ }).first().click();
  await page.getByRole('button', { name: 'Start timer', exact: true }).click();
  await page.getByText('Get ready').waitFor();
  await shot('12-timer-countdown');
  await page.waitForTimeout(4300);
  await shot('13-timer-running');
  await page.getByRole('button', { name: 'Stop the timer' }).click();
  await page.getByRole('button', { name: 'History', exact: true }).click();
  await shot('14-history-sheet');
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  // Reward cards (shown for review): new exercise, gear, level up
  await page.evaluate(async () => {
    const m = await import('/src/components/Celebrate.tsx');
    m.celebrate([{ kind: 'exercise', exerciseId: 'plank' }, { kind: 'gear', gearId: 'headband' }, { kind: 'level', level: 3, stageFrom: 0, stageTo: 1 }]);
  });
  await page.locator('.reward').waitFor();
  await page.waitForTimeout(1200);
  await shot('15-reward-exercise');
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForTimeout(1200);
  await shot('16-reward-gear');
  await page.getByRole('button', { name: /^Continue/ }).click();
  await page.waitForTimeout(1200);
  await shot('17-reward-level');
  await page.getByRole('button', { name: /^Continue/ }).click();

  // Finish → summary
  await page.mouse.wheel(0, 4000);
  await page.getByRole('button', { name: 'Finish session' }).click();
  await page.getByRole('button', { name: 'Finish', exact: true }).click();
  await page.getByRole('heading', { name: /Session complete/ }).waitFor();
  await dismissRewards();
  await shot('18-summary');
  await page.getByRole('button', { name: 'Open mystery chest' }).click();
  await dismissRewards();
  await page.getByRole('button', { name: 'Done' }).click();

  await tab('Progress');
  await shot('19-progress');
  await shot('19b-progress-full', true);
  await tab('Body');
  await page.waitForTimeout(1200);
  await shot('20-body');
  await shot('20b-body-full', true);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Choose photo/ }).click();
  await (await chooser).setFiles('tests/e2e/fixtures/photo.jpg');
  await page.getByRole('img', { name: 'Preview with your stats' }).waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);
  await shot('21-photo-composer');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await tab('Settings');
  await shot('22-settings');
  await shot('22b-settings-full', true);
  await tab('Home');
  await shot('23-home-after');
} catch (e) {
  console.log('FAILED at', taken[taken.length - 1] ?? 'start', '-', String(e).split('\n')[0]);
  await page.screenshot({ path: `${OUT}/99-failure.png`, fullPage: true });
  process.exitCode = 1;
} finally {
  console.log(`${taken.length} screenshots in ${OUT}`);
  if (errors.length) console.log('page errors:', errors.slice(0, 3));
  await browser.close();
  server.kill();
  process.exit(process.exitCode ?? 0);
}
