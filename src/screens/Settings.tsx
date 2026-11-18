import { useEffect, useState } from 'react';
import { Stepper } from '../components/ui';
import { PlaceEditor } from '../components/PlaceEditor';
import { CATEGORIES, EQUIPMENT, equipmentName, knownEquipment } from '../core/equipment';
import type { Location } from '../core/types';
import { deleteEquipment, exportAll, importAll, resetTrainingData, updateProfile, updateSettings, wipeLocal } from '../data/repo';
import { confirmAsk } from '../components/Confirm';
import { GoalPicker } from '../components/GoalPicker';
import { Avatar, AVATAR_STYLES } from '../components/Avatar';
import { COLORS, GOAL_TARGETS, goalFor, suggestedRestSec } from '../core/rules';
import { saveFile } from '../lib/native';
import { appVersion } from '../lib/update';
import type { Game } from '../data/useGame';
import { alarm, primeAudio } from '../lib/alarm';
import { askPermission, isNative } from '../lib/notify';
import { currentUser, lastSync, signIn, signOut, signUp, syncConfigured, syncNow, type SyncResult } from '../lib/sync';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SettingsScreen({ game, toast }: { game: Game; toast: (t: string) => void }) {
  const p = game.profile!;
  const s = p.settings;
  const [editing, setEditing] = useState<Partial<Location> | null>(null);
  const [version, setVersion] = useState<string>('');
  useEffect(() => {
    void appVersion().then((v) => setVersion(`v${v.name}${v.build ? ` · build ${v.build}` : ''}`)).catch(() => undefined);
  }, []);
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';
  const d = game.d!;

  return (
    <div className="stack screen">
      <h1>Settings</h1>

      <section className="card stack">
        <h2>You</h2>
        <label className="field">
          Name (shown on Home)
          <input className="input" value={p.name} onChange={(e) => updateProfile({ name: e.target.value })} />
        </label>
        <span className="tiny muted">Gender (sets your avatar's body)</span>
        <div className="seg" role="radiogroup" aria-label="Gender">
          {(['male', 'female'] as const).map((g) => (
            <button key={g} role="radio" aria-checked={(p.gender ?? 'male') === g} className={`chip ${(p.gender ?? 'male') === g ? 'on' : ''}`} onClick={() => updateProfile({ gender: g })}>
              {g === 'male' ? 'Male' : 'Female'}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack" aria-label="Goals">
        <h2>Your goals</h2>
        <GoalPicker key={`${(p.goals ?? []).join()}|${(p.focus ?? []).join()}`} goals={p.goals ?? []} focus={p.focus ?? []} onSaved={() => toast('Goals saved')} />
      </section>

      <section className="card stack" aria-label="Avatar style">
        <h2>Avatar style</h2>
        <p className="small muted">Three looks. It trains when you train.</p>
        <div className="seg" role="radiogroup" aria-label="Avatar style">
          {AVATAR_STYLES.map((st) => (
            <button key={st.id} role="radio" aria-checked={(p.avatarStyle ?? 'athlete') === st.id} className={`card flat stack style-pick ${(p.avatarStyle ?? 'athlete') === st.id ? 'on' : ''}`} onClick={() => updateProfile({ avatarStyle: st.id })}>
              <Avatar stage={d.stage} gear={d.gear} color={color} size={86} style={st.id} gender={p.gender} action="demo" />
              <b className="small">{st.name}</b>
              <span className="tiny muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
                {st.blurb}
              </span>
            </button>
          ))}
        </div>
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
          const names = knownEquipment(l.equipment, game.customEquipment).map((id) => equipmentName(id, game.customEquipment));
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
                  style={{ minWidth: 44, padding: '4px 10px' }}
                  aria-label={`Remove ${e.name} from library`}
                  onClick={async () => {
                    if (await confirmAsk({ title: `Remove "${e.name}"?`, body: 'It is also removed from every place that has it.', ok: 'Remove', danger: true })) await deleteEquipment(e.id);
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
        {(() => {
          const sug = suggestedRestSec(p.goals ?? []);
          const g = goalFor(null, p.goals ?? []);
          if (!sug || !g || sug === s.restLimitSec) return null;
          return (
            <div className="row between banner small">
              <span>
                For your goal ({GOAL_TARGETS[g].label}): rest about <b>{sug} s</b>.
              </span>
              <button
                className="btn ghost icon-btn"
                onClick={async () => {
                  if (await confirmAsk({ title: `Set the rest alarm to ${sug} s?`, body: `Now ${s.restLimitSec} s. You can change it back any time.`, ok: 'Apply' })) await updateSettings({ restLimitSec: sug });
                }}
              >
                Apply
              </button>
            </div>
          );
        })()}
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
              try {
                const blob = new Blob([await exportAll()], { type: 'application/json' });
                toast(await saveFile(blob, `maxfit-backup-${new Date().toISOString().slice(0, 10)}.json`, 'downloads'));
              } catch (err) {
                toast((err as Error).message);
              }
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
                if (!(await confirmAsk({ title: 'Restore this backup?', body: 'All data on this device is replaced with the backup.', ok: 'Restore', danger: true }))) return;
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

      <section className="card stack" aria-label="Delete test data">
        <h2>Delete my test data</h2>
        <p className="small muted">Deletes all sessions, sets and weigh-ins, and starts the game again (level 1, starter exercises). Keeps your places, equipment, goals, settings and photos. Synced devices delete them too.</p>
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirmAsk({ title: 'Delete all training data?', body: `${d.stats.sessions} sessions, their sets, and ${game.weights.length} weigh-ins. Your level and unlocks start again.`, ok: 'Continue', danger: true }))) return;
            if (!(await confirmAsk({ title: 'Are you sure?', body: 'This cannot be undone. Export a backup first if you may want it back.', ok: 'Delete everything', danger: true }))) return;
            await resetTrainingData();
            toast('Training data deleted. Fresh start!');
          }}
        >
          Delete test data
        </button>
      </section>

      <section className="card stack" aria-label="Erase">
        <h2>Erase this device</h2>
        <p className="small muted">Removes all MaxFit data from this phone (cloud data stays). Progress photos are only on this phone and are deleted for good: save the ones you want to your gallery first. Use before someone else signs in here. Export a backup first.</p>
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirmAsk({ title: 'Erase ALL MaxFit data on this device?', body: 'This cannot be undone. Cloud data stays, but progress photos (phone only) are deleted for good.', ok: 'Erase', danger: true }))) return;
            await wipeLocal();
            toast('This device was erased');
          }}
        >
          Erase this device
        </button>
      </section>

      <p className="tiny muted" style={{ textAlign: 'center' }}>
        MaxFit {version} · Train like a game
      </p>

      {editing && <PlaceEditor loc={editing} customEquipment={game.customEquipment} unlocked={d.unlockedAll} onClose={() => setEditing(null)} canDelete={game.locations.length > 1} />}
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
