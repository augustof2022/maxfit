import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../data/db';
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
import { ChevronRight, Download, Ico, PlaceIcon, Plus, Star, Upload, X } from '../components/Icon';
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
      <header className="screen-head">
        <h1>Settings</h1>
      </header>

      <section className="group" aria-label="You">
        <div className="group-head">
          <h2>You</h2>
        </div>
        <div className="card stack">
          <label className="field">
            Name (shown on Home)
            <input className="input" value={p.name} placeholder="Your first name" onChange={(e) => updateProfile({ name: e.target.value })} />
          </label>
          <span className="field-label">Gender (sets your avatar's body)</span>
          <div className="seg" role="radiogroup" aria-label="Gender">
            {(['male', 'female'] as const).map((g) => (
              <button key={g} role="radio" aria-checked={(p.gender ?? 'male') === g} onClick={() => updateProfile({ gender: g })}>
                {g === 'male' ? 'Male' : 'Female'}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="group" aria-label="Goals">
        <div className="group-head">
          <h2>Your goals</h2>
        </div>
        <div className="card">
          <GoalPicker key={`${(p.goals ?? []).join()}|${(p.focus ?? []).join()}`} goals={p.goals ?? []} focus={p.focus ?? []} onSaved={() => toast('Goals saved')} />
        </div>
      </section>

      <section className="group" aria-label="Avatar style">
        <div className="group-head">
          <h2>Avatar style</h2>
        </div>
        <p className="group-note">Three looks. It trains when you train.</p>
        <div className="avatar-styles" role="radiogroup" aria-label="Avatar style">
          {AVATAR_STYLES.map((st) => (
            <button key={st.id} role="radio" aria-checked={(p.avatarStyle ?? 'athlete') === st.id} className={`stack style-pick ${(p.avatarStyle ?? 'athlete') === st.id ? 'on' : ''}`} onClick={() => updateProfile({ avatarStyle: st.id })}>
              <Avatar stage={d.stage} gear={d.gear} color={color} size={80} style={st.id} gender={p.gender} action="demo" />
              <b className="small">{st.name}</b>
              <span className="tiny">{st.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="group" aria-label="Locations">
        <div className="group-head">
          <h2>My places</h2>
          <button className="btn quiet" onClick={() => setEditing({ name: '', kind: 'gym', equipment: [] })}>
            <Ico as={Plus} size={18} />
            New place
          </button>
        </div>
        <p className="group-note">Name a place and pick its equipment once. When you train there, MaxFit loads it and shows only exercises you can do.</p>
        <div className="list">
          {game.locations.length === 0 && <p className="empty">No places yet. Add Home or your gym, and pick what equipment is there.</p>}
          {game.locations.map((l) => {
            const names = knownEquipment(l.equipment, game.customEquipment).map((id) => equipmentName(id, game.customEquipment));
            return (
              <button key={l.id} className="row-item" onClick={() => setEditing(l)} aria-label={`Edit place ${l.name}`}>
                <span className="ico">
                  <PlaceIcon kind={l.kind} size={20} />
                </span>
                <span className="meta">
                  <b>{l.name}</b>
                  <span className="sub clamp1">{names.length ? `${names.length} item${names.length === 1 ? '' : 's'}: ${names.slice(0, 4).join(', ')}${names.length > 4 ? '…' : ''}` : 'Bodyweight only'}</span>
                </span>
                <Ico as={ChevronRight} className="chev" />
              </button>
            );
          })}
        </div>
      </section>

      <section className="group" aria-label="Equipment library">
        <div className="group-head">
          <h2>Equipment library</h2>
        </div>
        <p className="group-note">
          {EQUIPMENT.length} built-in items in {CATEGORIES.length} groups. Add your own from any place's editor.
        </p>
        <div className="list">
          {game.customEquipment.filter((e) => !e.deleted).length === 0 ? (
            <p className="empty">No items of your own yet. Open a place and tap "Add new equipment" if something is missing.</p>
          ) : (
            game.customEquipment
              .filter((e) => !e.deleted)
              .map((e) => (
                <div key={e.id} className="row-item">
                  <span className="ico gold">
                    <Ico as={Star} />
                  </span>
                  <span className="meta">
                    <b>{e.name}</b>
                    <span className="sub">{CATEGORIES.find((c) => c.id === e.category)?.name}</span>
                  </span>
                  <button
                    className="btn secondary icon"
                    aria-label={`Remove ${e.name} from library`}
                    onClick={async () => {
                      if (await confirmAsk({ title: `Remove "${e.name}"?`, body: 'It is also removed from every place that has it.', ok: 'Remove', danger: true })) await deleteEquipment(e.id);
                    }}
                  >
                    <Ico as={X} size={18} />
                  </button>
                </div>
              ))
          )}
        </div>
      </section>

      <section className="group" aria-label="Rest alarm">
        <div className="group-head">
          <h2>Rest alarm</h2>
        </div>
        <div className="card stack">
          <Stepper label="Alarm when rest is longer than" unit="sec" value={s.restLimitSec} step={15} min={15} onChange={(v) => updateSettings({ restLimitSec: Math.max(15, v) })} />
          <p className="note">For muscle growth, a common guide is 1–2 minutes between sets (ACSM). Start at 90 seconds.</p>
          {(() => {
            const sug = suggestedRestSec(p.goals ?? []);
            const g = goalFor(null, p.goals ?? []);
            if (!sug || !g || sug === s.restLimitSec) return null;
            return (
              <div className="row between banner small">
                <span>
                  For your goal ({GOAL_TARGETS[g].label}): rest about <b className="num">{sug} s</b>.
                </span>
                <button
                  className="btn secondary icon-btn"
                  onClick={async () => {
                    if (await confirmAsk({ title: `Set the rest alarm to ${sug} s?`, body: `Now ${s.restLimitSec} s. You can change it back any time.`, ok: 'Apply' })) await updateSettings({ restLimitSec: sug });
                  }}
                >
                  Apply
                </button>
              </div>
            );
          })()}
        </div>
        <div className="list">
          <Toggle label="Sound" on={s.sound} set={(v) => updateSettings({ sound: v })} />
          <Toggle label="Vibrate" on={s.vibrate} set={(v) => updateSettings({ vibrate: v })} />
        </div>
        <button
          className="btn secondary"
          onClick={() => {
            primeAudio();
            alarm(s);
          }}
        >
          Test alarm
        </button>
      </section>

      <section className="group" aria-label="Reminders">
        <div className="group-head">
          <h2>Reminders</h2>
        </div>
        {!isNative && <p className="group-note">In the web app, reminders show only while MaxFit is open. Install the Android app for alarms that ring when it is closed.</p>}
        <div className="list">
          <Toggle label="Remind me to train" on={s.workoutReminder.enabled} set={async (v) => { if (v) await askPermission(); updateSettings({ workoutReminder: { ...s.workoutReminder, enabled: v } }); }} />
          {s.workoutReminder.enabled && (
            <div className="stack stack-pad">
              <label className="field">
                Time
                <input className="input" type="time" value={s.workoutReminder.time} onChange={(e) => updateSettings({ workoutReminder: { ...s.workoutReminder, time: e.target.value } })} />
              </label>
              <span className="field-label">Days</span>
              <div className="chips wrap">
                {DAYS.map((d, i) => {
                  const on = s.workoutReminder.days.includes(i);
                  return (
                    <button key={d} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => updateSettings({ workoutReminder: { ...s.workoutReminder, days: on ? s.workoutReminder.days.filter((x) => x !== i) : [...s.workoutReminder.days, i] } })}>
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Toggle label="Remind me to weigh in" on={s.weighReminder.enabled} set={async (v) => { if (v) await askPermission(); updateSettings({ weighReminder: { ...s.weighReminder, enabled: v } }); }} />
          {s.weighReminder.enabled && (
            <div className="row stack-pad">
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
        </div>
      </section>

      <section className="group" aria-label="Daily goal">
        <div className="group-head">
          <h2>Daily goal (habit builder)</h2>
        </div>
        <div className="card stack">
          <Stepper label="Start at" unit="min" value={p.habitBaseMin} step={5} min={5} onChange={(v) => updateProfile({ habitBaseMin: Math.max(5, v) })} />
          <Stepper label="Grow up to" unit="min" value={p.habitCapMin} step={5} min={10} onChange={(v) => updateProfile({ habitCapMin: Math.max(10, v) })} />
          <p className="note">The goal grows by 5 minutes after every 5 days you meet it. Rest days do not reset it; a missed week does.</p>
        </div>
      </section>

      <SyncCard toast={toast} />

      <section className="group" aria-label="Backup">
        <div className="group-head">
          <h2>Backup</h2>
        </div>
        <p className="group-note">Save a copy of all your data as a file, or restore one.</p>
        <div className="row">
          <button
            className="btn secondary grow"
            onClick={async () => {
              try {
                const blob = new Blob([await exportAll()], { type: 'application/json' });
                toast(await saveFile(blob, `maxfit-backup-${new Date().toISOString().slice(0, 10)}.json`, 'downloads'));
              } catch (err) {
                toast((err as Error).message);
              }
            }}
          >
            <Ico as={Download} size={18} />
            Export
          </button>
          <label className="btn secondary grow" style={{ textAlign: 'center' }}>
            <Ico as={Upload} size={18} />
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

      <section className="group" aria-label="Delete data">
        <div className="group-head">
          <h2>Delete data</h2>
        </div>
        <div className="card stack danger-zone">
          <section className="stack" aria-label="Delete test data" style={{ gap: 'var(--s2)' }}>
            <h3>Delete my test data</h3>
            <p className="note">Deletes all sessions, sets and weigh-ins, and starts the game again (level 1, starter exercises). Keeps your places, equipment, goals, settings and photos. Synced devices delete them too.</p>
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
          <hr />
          <section className="stack" aria-label="Erase" style={{ gap: 'var(--s2)' }}>
            <h3>Erase this device</h3>
            <p className="note">Removes all MaxFit data from this phone (cloud data stays). Progress photos are only on this phone and are deleted for good: save the ones you want to your gallery first. Use before someone else signs in here. Export a backup first.</p>
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
        </div>
      </section>

      <p className="foot-note num">MaxFit {version} · Train like a game</p>

      {editing && <PlaceEditor loc={editing} customEquipment={game.customEquipment} unlocked={d.unlockedAll} onClose={() => setEditing(null)} canDelete={game.locations.length > 1} />}
    </div>
  );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} />
    </label>
  );
}

function SyncCard({ toast }: { toast: (t: string) => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [user, setUser] = useState<string | null>(null);
  const [last, setLast] = useState<SyncResult | null>(null);
  const [busy, setBusy] = useState(false);
  // Set by sync when the cloud does not accept plans yet (migration not applied).
  const plansBlocked = useLiveQuery(() => db.meta.get('syncBlocked:plans'), [])?.value === true;

  useEffect(() => {
    void currentUser().then((u) => setUser(u?.email ?? null));
    void lastSync().then(setLast);
  }, []);

  if (!syncConfigured)
    return (
      <section className="group" aria-label="Cloud sync">
        <div className="group-head">
          <h2>Cloud sync</h2>
        </div>
        <p className="group-note">This build has no cloud server set. Your data is saved on this device. Use Backup to keep a copy.</p>
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
    <section className="group" aria-label="Cloud sync">
      <div className="group-head">
        <h2>Cloud sync</h2>
      </div>
      <div className="card stack">
      {user ? (
        <>
          <p className="small">Signed in as {user}</p>
          <p className="note">{last ? `Last sync ${new Date(last.at).toLocaleString()} · sent ${last.pushed}, got ${last.pulled}` : 'Not synced yet.'}</p>
          {plansBlocked && <p className="small banner">Exercise plans are on this phone only until the cloud is updated (everything else syncs). Export a backup to keep them safe.</p>}
          <div className="row">
            <button className="btn primary grow" disabled={busy} onClick={() => run(syncNow, 'Synced')}>
              Sync now
            </button>
            <button className="btn secondary" disabled={busy} onClick={() => run(signOut, 'Signed out')}>
              Sign out
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="note">Sign in to back up to the cloud and use MaxFit on more than one device. The app still works offline.</p>
          <input className="input" type="email" autoComplete="email" aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" type="password" autoComplete="current-password" aria-label="Password" placeholder="Password (6+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <div className="row">
            <button className="btn primary grow" disabled={busy || !email || pw.length < 6} onClick={() => run(async () => { await signIn(email, pw); await syncNow(); }, 'Signed in and synced')}>
              Sign in
            </button>
            <button
              className="btn secondary grow"
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
      </div>
    </section>
  );
}
