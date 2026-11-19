import { useCallback, useEffect, useRef, useState } from 'react';
import { ensureSeed, ensureStarterPlans, migrateRecords, type SessionSummary } from './data/repo';
import { useGame } from './data/useGame';
import { Toast } from './components/ui';
import { ConfirmHost } from './components/Confirm';
import { UpdateBar } from './components/UpdateBar';
import { ChartColumn, Dumbbell, House, PersonStanding, Settings, type LucideIcon } from './components/Icon';
import { celebrate, CelebrateHost, rewardKey, type Reward } from './components/Celebrate';
import { avatarStage, gearFor } from './core/rules';
import { Home } from './screens/Home';
import { Train } from './screens/Train';
import { Progress } from './screens/Progress';
import { Body } from './screens/Body';
import { SettingsScreen } from './screens/Settings';
import { Summary } from './screens/Summary';
import { applyReminders, tickWebReminders, isNative } from './lib/notify';
import { currentUser, syncConfigured, syncNow } from './lib/sync';

export type Tab = 'home' | 'train' | 'progress' | 'body' | 'settings';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: House },
  { id: 'train', label: 'Train', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: ChartColumn },
  { id: 'body', label: 'Body', icon: PersonStanding },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/** Reward cards already shown in a session, kept for this tab (survives a reload). */
function loadShown(sessionId: string): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(`shown:${sessionId}`) ?? '[]');
  } catch {
    return [];
  }
}
function saveShown(sessionId: string | null, shown: Set<string>) {
  if (!sessionId) return;
  try {
    sessionStorage.setItem(`shown:${sessionId}`, JSON.stringify([...shown]));
  } catch {
    /* storage off: only a repeat card at worst */
  }
}

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>(() => (location.hash.slice(1) as Tab) || 'home');
  const [toast, setToast] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    // Then every place gets its default Starter plan once (round 5).
    void ensureSeed()
      .then(() => migrateRecords())
      .then(() => ensureStarterPlans());
  }, []);

  useEffect(() => {
    history.replaceState(null, '', `#${tab}`);
    window.scrollTo(0, 0);
  }, [tab]);

  // Reminders: schedule on the Android app; check every minute in the web app.
  const settings = game.profile?.settings;
  useEffect(() => {
    if (!settings) return;
    void applyReminders(settings);
    if (isNative) return;
    const check = async () => {
      const text = await tickWebReminders(settings);
      if (text) setToast(text);
    };
    void check();
    const t = setInterval(check, 60_000);
    return () => clearInterval(t);
  }, [settings]);

  // Cloud sync: on start and every 5 minutes, when signed in.
  useEffect(() => {
    if (!syncConfigured) return;
    const run = async () => {
      if (navigator.onLine && (await currentUser())) await syncNow().catch(() => undefined);
      // Places pulled from the cloud get their Starter plan too.
      await ensureStarterPlans().catch(() => undefined);
    };
    void run();
    const t = setInterval(run, 5 * 60_000);
    return () => clearInterval(t);
  }, []);

  // Grand unlock moments (Renz, 2026-11-18). Mid-session: anything newly unlocked (a record can unlock
  // an exercise, and with it new gear) is shown at once. At the end: the rest (streak / session unlocks,
  // level-ups). Each reward is shown once per session.
  const seen = useRef<{ session: string | null; shown: Set<string>; unlocked: Set<string> | null; gear: Set<string> | null }>({ session: null, shown: new Set(), unlocked: null, gear: null });
  const d = game.d;
  useEffect(() => {
    if (!d) return;
    const st = seen.current;
    const prevU = st.unlocked;
    const prevG = st.gear;
    st.unlocked = new Set(d.unlocked);
    st.gear = new Set(d.gear);
    if (!d.active) return;
    if (st.session !== d.active.id) {
      // A new session (or the app reloaded mid-session): start counting from what is unlocked now, and
      // remember what this session already showed, so a reload never shows a card twice.
      st.session = d.active.id;
      st.shown = new Set(loadShown(d.active.id));
      return;
    }
    if (!prevU || !prevG) return;
    const out: Reward[] = [
      ...d.unlocked.filter((id) => !prevU.has(id)).map((exerciseId): Reward => ({ kind: 'exercise', exerciseId })),
      ...d.gear.filter((g) => !prevG.has(g)).map((gearId): Reward => ({ kind: 'gear', gearId })),
    ].filter((r) => !st.shown.has(rewardKey(r)));
    out.forEach((r) => st.shown.add(rewardKey(r)));
    if (out.length) {
      saveShown(st.session, st.shown);
      celebrate(out);
    }
  }, [d]);

  const onFinished = (s: SessionSummary) => {
    const st = seen.current;
    const before = game.d;
    const out: Reward[] = s.unlocked.map((exerciseId): Reward => ({ kind: 'exercise', exerciseId }));
    if (before) {
      const count = new Set([...before.unlocked, ...s.unlocked]).size;
      for (const gearId of gearFor(count)) if (!before.gear.includes(gearId)) out.push({ kind: 'gear', gearId });
    }
    if (s.levelAfter > s.levelBefore) out.push({ kind: 'level', level: s.levelAfter, stageFrom: avatarStage(s.levelBefore), stageTo: avatarStage(s.levelAfter) });
    const fresh = out.filter((r) => !st.shown.has(rewardKey(r)));
    fresh.forEach((r) => st.shown.add(rewardKey(r)));
    if (fresh.length) celebrate(fresh);
    setSummary(s);
    if (syncConfigured) void syncNow().catch(() => undefined);
  };

  if (!game.profile || !game.d) return <div className="app muted">Loading…</div>;

  return (
    <>
      <main className="app" key={tab}>
        <UpdateBar />
        {tab === 'home' && <Home game={game} go={setTab} />}
        {tab === 'train' && <Train game={game} toast={setToast} onFinished={onFinished} />}
        {tab === 'progress' && <Progress game={game} />}
        {tab === 'body' && <Body game={game} />}
        {tab === 'settings' && <SettingsScreen game={game} toast={setToast} />}
      </main>
      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <t.icon size={24} strokeWidth={t.id === tab ? 2.25 : 2} aria-hidden />
            {t.label}
            {t.id === 'train' && game.d?.active && <span className="live-dot" aria-label="Session running" />}
          </button>
        ))}
      </nav>
      {toast && <Toast text={toast} onDone={clearToast} />}
      <ConfirmHost />
      <CelebrateHost game={game} />
      {summary && (
        <Summary
          s={summary}
          avatarStyle={game.profile.avatarStyle}
          gender={game.profile.gender}
          measuresOf={game.d.measuresOf}
          onClose={() => {
            setSummary(null);
            setTab('home');
          }}
        />
      )}
    </>
  );
}
