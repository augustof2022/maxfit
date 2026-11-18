import { useCallback, useEffect, useState } from 'react';
import { ensureSeed, migrateRecords, type SessionSummary } from './data/repo';
import { useGame } from './data/useGame';
import { Toast } from './components/ui';
import { ConfirmHost } from './components/Confirm';
import { UpdateBar } from './components/UpdateBar';
import { Home } from './screens/Home';
import { Train } from './screens/Train';
import { Progress } from './screens/Progress';
import { Body } from './screens/Body';
import { SettingsScreen } from './screens/Settings';
import { Summary } from './screens/Summary';
import { applyReminders, tickWebReminders, isNative } from './lib/notify';
import { currentUser, syncConfigured, syncNow } from './lib/sync';

export type Tab = 'home' | 'train' | 'progress' | 'body' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: 'M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { id: 'train', label: 'Train', icon: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12' },
  { id: 'progress', label: 'Progress', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { id: 'body', label: 'Body', icon: 'M12 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6zM6 21l2-9h8l2 9M8 12l-3-2M16 12l3-2' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-2-4-2 1-2-1V5h-4v2l-2 1-2-1-2 4 2 1v0l-2 1 2 4 2-1 2 1v2h4v-2l2-1 2 1 2-4z' },
];

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>(() => (location.hash.slice(1) as Tab) || 'home');
  const [toast, setToast] = useState<string | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    void ensureSeed().then(() => migrateRecords());
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
    };
    void run();
    const t = setInterval(run, 5 * 60_000);
    return () => clearInterval(t);
  }, []);

  const onFinished = (s: SessionSummary) => {
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={t.icon} />
            </svg>
            {t.label}
            {t.id === 'train' && game.d?.active && <span className="live-dot" aria-label="Session running" />}
          </button>
        ))}
      </nav>
      {toast && <Toast text={toast} onDone={clearToast} />}
      <ConfirmHost />
      {summary && (
        <Summary
          s={summary}
          avatarStyle={game.profile.avatarStyle}
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
