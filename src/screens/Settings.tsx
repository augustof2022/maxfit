import { useEffect, useState } from 'react';
import { Stepper } from '../components/ui';
import { PlaceEditor } from '../components/PlaceEditor';
import { CATEGORIES, EQUIPMENT, equipmentName } from '../core/equipment';
import type { Location } from '../core/types';
import { deleteEquipment, exportAll, importAll, updateProfile, updateSettings, wipeLocal } from '../data/repo';
import type { Game } from '../data/useGame';
import { alarm, primeAudio } from '../lib/alarm';
import { askPermission, isNative } from '../lib/notify';
import { currentUser, lastSync, signIn, signOut, signUp, syncConfigured, syncNow, type SyncResult } from '../lib/sync';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SettingsScreen({ game, toast }: { game: Game; toast: (t: string) => void }) {
  const p = game.profile!;
  const s = p.settings;
  const [editing, setEditing] = useState<Partial<Location> | null>(null);

  return (
    <div className="stack">
      <h1>Settings</h1>

      <section className="card stack">
        <h2>You</h2>
        <label className="field">
          Name (shown on Home)
          <input className="input" value={p.name} onChange={(e) => updateProfile({ name: e.target.value })} />
        </label>
      </section>

      <section className="card stack" aria-label="Locations">
        <div className="row between">
          <h2>My places</h2>
          <button className="btn ghost" onClick={() => setEditing({ name: '', kind: 'gym', equipment: [] })}>
            + New place
          </button>
        </div>
        <p className="small muted">Name a place and pick its equipment once. When you train there, MaxFit loads it and shows only exercises you can do.</p>
        {game.locations.map((l) => {
          const names = l.equipment.map((id) => equipmentName(id, game.customEquipment));
          return (
            <button key={l.id} className="card flat row between" style={{ textAlign: 'left' }} onClick={() => setEditing(l)}>
              <span className="grow">
                <b>{l.name}</b>
                <br />
                <span className="small muted">{names.length ? `${names.length} items: ${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}` : 'Bodyweight only'}</span>
              </span>
              <span className="muted">Edit ›</span>
            </button>
          );
        })}
      </section>

      <section className="card stack" aria-label="Equipment library">
        <h2>Equipment library</h2>
        <p className="small muted">
          {EQUIPMENT.length} built-in items in {CATEGORIES.length} groups. Add your own from any place's editor.
        </p>
        {game.customEquipment.filter((e) => !e.deleted).length === 0 ? (
          <p className="small muted">No items of your own yet.</p>
        ) : (
          game.customEquipment
            .filter((e) => !e.deleted)
            .map((e) => (
              <div key={e.id} className="row between small">
                <span>
                  ★ {e.name} <span className="muted">· {CATEGORIES.find((c) => c.id === e.category)?.name}</span>
                </span>
                <button
                  className="btn ghost"
                  style={{ minHeight: 32, padding: '4px 10px' }}
                  aria-label={`Remove ${e.name} from library`}
                  onClick={async () => {
                    if (confirm(`Remove "${e.name}" from your library? Places that have it will no longer list it.`)) await deleteEquipment(e.id);
                  }}
                >
                  ✕
                </button>
              </div>
            ))
        )}
      </section>

      <section className="card stack" aria-label="Rest alarm">
        <h2>Rest alarm</h2>
        <Stepper label="Alarm when rest is longer than" unit="sec" value={s.restLimitSec} step={15} min={15} onChange={(v) => updateSettings({ restLimitSec: Math.max(15, v) })} />
        <p className="small muted">For muscle growth, a common guide is 1–2 minutes between sets (ACSM). Start at 90 seconds.</p>
        <Toggle label="Sound" on={s.sound} set={(v) => updateSettings({ sound: v })} />
        <Toggle label="Vibrate" on={s.vibrate} set={(v) => updateSettings({ vibrate: v })} />
        <button
          className="btn ghost"
          onClick={() => {
            primeAudio();
            alarm(s);
          }}
        >
          Test alarm
        </button>
      </section>

      <section className="card stack" aria-label="Reminders">
        <h2>Reminders</h2>
        {!isNative && <p className="small banner">In the web app, reminders show only while MaxFit is open. Install the Android app for alarms that ring when it is closed.</p>}
        <Toggle label="Remind me to train" on={s.workoutReminder.enabled} set={async (v) => { if (v) await askPermission(); updateSettings({ workoutReminder: { ...s.workoutReminder, enabled: v } }); }} />
        {s.workoutReminder.enabled && (
          <>
            <label className="field">
              Time
              <input className="input" type="time" value={s.workoutReminder.time} onChange={(e) => updateSettings({ workoutReminder: { ...s.workoutReminder, time: e.target.value } })} />
            </label>
            <div className="row wrap">
              {DAYS.map((d, i) => {
                const on = s.workoutReminder.days.includes(i);
                return (
                  <button key={d} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => updateSettings({ workoutReminder: { ...s.workoutReminder, days: on ? s.workoutReminder.days.filter((x) => x !== i) : [...s.workoutReminder.days, i] } })}>
                    {d}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <hr />
        <Toggle label="Remind me to weigh in" on={s.weighReminder.enabled} set={async (v) => { if (v) await askPermission(); updateSettings({ weighReminder: { ...s.weighReminder, enabled: v } }); }} />
        {s.weighReminder.enabled && (
          <div className="row">
            <label className="field grow">
              Day
              <select className="input" value={s.weighReminder.day} onChange={(e) => updateSettings({ weighReminder: { ...s.weighReminder, day: Number(e.target.value) } })}>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="field grow">
              Time
              <input className="input" type="time" value={s.weighReminder.time} onChange={(e) => updateSettings({ weighReminder: { ...s.weighReminder, time: e.target.value } })} />
            </label>
          </div>
        )}
      </section>

      <section className="card stack" aria-label="Daily goal">
        <h2>Daily goal (habit builder)</h2>
        <Stepper label="Start at" unit="min" value={p.habitBaseMin} step={5} min={5} onChange={(v) => updateProfile({ habitBaseMin: Math.max(5, v) })} />
        <Stepper label="Grow up to" unit="min" value={p.habitCapMin} step={5} min={10} onChange={(v) => updateProfile({ habitCapMin: Math.max(10, v) })} />
        <p className="small muted">The goal grows by 5 minutes after every 5 days you meet it. Rest days do not reset it; a missed week does.</p>
      </section>

      <SyncCard toast={toast} />

      <section className="card stack" aria-label="Backup">
        <h2>Backup</h2>
        <p className="small muted">Save a copy of all your data as a file, or restore one.</p>
        <div className="row">
          <button
            className="btn ghost grow"
            onClick={async () => {
              const blob = new Blob([await exportAll()], { type: 'application/json' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = `maxfit-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Export
          </button>
          <label className="btn ghost grow" style={{ textAlign: 'center' }}>
            Import
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!confirm('Replace all data on this device with the backup?')) return;
                try {
                  await importAll(await f.text());
                  toast('Backup restored');
                } catch (err) {
                  toast(String((err as Error).message));
                }
              }}
            />
          </label>
        </div>
      </section>

      <section className="card stack" aria-label="Erase">
        <h2>Erase this device</h2>
        <p className="small muted">Removes all MaxFit data from this phone (cloud data stays). Use before someone else signs in here. Export a backup first.</p>
        <button
          className="btn danger"
          onClick={async () => {
            if (!confirm('Erase ALL MaxFit data on this device? This cannot be undone.')) return;
            await wipeLocal();
            toast('This device was erased');
          }}
        >
          Erase this device
        </button>
      </section>

      <p className="tiny muted" style={{ textAlign: 'center' }}>
        MaxFit v0.1 · Train like a game
      </p>

      {editing && <PlaceEditor loc={editing} customEquipment={game.customEquipment} unlocked={p.unlocked} onClose={() => setEditing(null)} canDelete={game.locations.length > 1} />}
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="row between" style={{ minHeight: 44 }}>
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} style={{ width: 24, height: 24, accentColor: 'var(--accent)' }} />
    </label>
  );
}

function SyncCard({ toast }: { toast: (t: string) => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [user, setUser] = useState<string | null>(null);
  const [last, setLast] = useState<SyncResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void currentUser().then((u) => setUser(u?.email ?? null));
    void lastSync().then(setLast);
  }, []);

  if (!syncConfigured)
    return (
      <section className="card stack" aria-label="Cloud sync">
        <h2>Cloud sync</h2>
        <p className="small muted">This build has no cloud server set. Your data is saved on this device. Use Backup to keep a copy.</p>
      </section>
    );

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setUser((await currentUser())?.email ?? null);
      setLast(await lastSync());
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card stack" aria-label="Cloud sync">
      <h2>Cloud sync</h2>
      {user ? (
        <>
          <p className="small">Signed in as {user}</p>
          <p className="small muted">{last ? `Last sync ${new Date(last.at).toLocaleString()} · sent ${last.pushed}, got ${last.pulled}` : 'Not synced yet.'}</p>
          <div className="row">
            <button className="btn primary grow" disabled={busy} onClick={() => run(syncNow, 'Synced')}>
              Sync now
            </button>
            <button className="btn ghost" disabled={busy} onClick={() => run(signOut, 'Signed out')}>
              Sign out
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="small muted">Sign in to back up to the cloud and use MaxFit on more than one device. The app still works offline.</p>
          <input className="input" type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" autoComplete="current-password" placeholder="Password (6+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="row">
            <button className="btn primary grow" disabled={busy || !email || pw.length < 6} onClick={() => run(async () => { await signIn(email, pw); await syncNow(); }, 'Signed in and synced')}>
              Sign in
            </button>
            <button
              className="btn ghost grow"
              disabled={busy || !email || pw.length < 6}
              onClick={() =>
                run(async () => {
                  const r = await signUp(email, pw);
                  if (r.needsConfirm) throw new Error('Check your email to confirm, then sign in.');
                  await syncNow();
                }, 'Account created')
              }
            >
              Create account
            </button>
          </div>
        </>
      )}
    </section>
  );
}
