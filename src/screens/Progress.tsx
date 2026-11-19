import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Bar, IconBtn, Sheet, Stepper } from '../components/ui';
import { confirmAsk } from '../components/Confirm';
import { EditSetSheet, MeasureSheet, trackLabel } from '../components/SetEditors';
import { ExerciseDemo } from '../components/ExerciseDemo';
import { EXERCISES, EXERCISE_BY_ID, TIER_NAMES } from '../core/exercises';
import { equipmentName } from '../core/equipment';
import { fmtClock } from '../core/live';
import { fmtValues } from '../core/measures';
import { Check, ChevronRight, CirclePlay, ExIcon, Gift, Ico, Lock, Pencil, Ruler } from '../components/Icon';
import { AVATAR_STAGES, COLORS, dayKey, doneSessions, GEAR, nextUnlockHints } from '../core/rules';
import type { Exercise, Session, WorkSet } from '../core/types';
import { deleteSession, updateProfile, updateSession } from '../data/repo';
import type { Game } from '../data/useGame';
import { lastBestText } from '../core/format';
import { DoneExercises, HistorySheet } from '../components/ExerciseHistory';

export function Progress({ game }: { game: Game }) {
  const p = game.profile!;
  const d = game.d!;
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';
  const unlocked = new Set(d.unlocked);
  const history = doneSessions(game.sessions).reverse().slice(0, 30);
  const waiting = EXERCISES.filter((e) => d.canDo(e) && !d.unlocked.includes(e.id)).length;
  const needGear = EXERCISES.filter((e) => !d.canDo(e)).length;
  const next = nextUnlockHints(d.unlocked, d.stats, 1, d.canDo)[0];
  const [demo, setDemo] = useState<Exercise | null>(null);
  const [hist, setHist] = useState<Exercise | null>(null);
  const [measuring, setMeasuring] = useState<Exercise | null>(null);
  const [editSet, setEditSet] = useState<WorkSet | null>(null);
  const [editSession, setEditSession] = useState<Session | null>(null);

  return (
    <div className="stack screen">
      <header className="screen-head">
        <h1>Progress</h1>
      </header>

      <section className="card stats" aria-label="Stats">
        <div className="stat">
          <b>{d.stats.sessions}</b>
          <span>Sessions</span>
        </div>
        <div className="stat">
          <b>{d.stats.bestStreak}</b>
          <span>Best streak</span>
        </div>
        <div className="stat">
          <b>{d.stats.totalMinutes}</b>
          <span>Minutes</span>
        </div>
        <div className="stat">
          <b>{d.unlocked.length}</b>
          <span>Unlocked</span>
        </div>
      </section>

      <section className="group" aria-label="Avatar evolution">
        <div className="group-head">
          <h2>Avatar evolution</h2>
          <span className="small muted">{AVATAR_STAGES[d.stage].name}</span>
        </div>
        <div className="card stack">
          <div className="evo">
            {AVATAR_STAGES.map((s, i) => (
              <div key={s.name} className={i === d.stage ? 'on' : ''}>
                <Avatar stage={i} gear={i === d.stage ? d.gear : []} color={color} size={64} silhouette={i > d.stage} style={p.avatarStyle} gender={p.gender} action={i === d.stage ? 'idle' : 'still'} />
                <span>{i > d.stage ? `Level ${s.minLevel}` : s.name}</span>
              </div>
            ))}
          </div>
          <div className="gear" aria-label="Gear">
            {GEAR.map((g) => {
              const has = d.gear.includes(g.id);
              return (
                <span key={g.id} className={`badge ${has ? 'new' : ''}`}>
                  <Ico as={has ? Check : Lock} size={12} />
                  {g.name} <span className="num">({g.unlocks} unlocks)</span>
                </span>
              );
            })}
          </div>
          <hr />
          <span className="field-label">Avatar color</span>
          <div className="swatches" role="radiogroup" aria-label="Avatar color">
            {COLORS.map((c) => {
              const owned = p.cosmetics.includes(c.id);
              return (
                <button
                  key={c.id}
                  role="radio"
                  className="swatch"
                  aria-checked={p.color === c.id}
                  aria-label={owned ? c.name : `${c.name} (locked)`}
                  disabled={!owned}
                  onClick={() => updateProfile({ color: c.id })}
                  style={owned ? { background: c.hex } : undefined}
                >
                  {!owned && <Ico as={Lock} size={14} />}
                </button>
              );
            })}
          </div>
          <p className="note">New colors come from mystery chests. Change the avatar style in Settings.</p>
        </div>
      </section>

      <DoneExercises game={game} />

      <section className="group" aria-label="Your exercises">
        <div className="group-head">
          <h2>Your exercise inventory</h2>
        </div>
        {[1, 2, 3, 4, 5, 6, 0].map((tier) => {
          const mine = EXERCISES.filter((e) => e.tier === tier && unlocked.has(e.id));
          if (!mine.length) return null;
          return (
            <div key={tier} className="stack" style={{ gap: 8 }}>
              <div className="tier-label">
                <h3>{tier ? `Tier ${tier}` : 'Secret'}</h3>
                <span>{TIER_NAMES[tier]}</span>
              </div>
              <div className="list">
                {mine.map((e) => {
                  const ms = d.measuresOf(e);
                  const rec = d.stats.records.get(e.id);
                  const base = e.base && EXERCISE_BY_ID[e.base] && unlocked.has(e.base) ? EXERCISE_BY_ID[e.base] : null;
                  return (
                    <div key={e.id} className={`inv-item ${d.canDo(e) ? '' : 'locked'}`}>
                      <button className="row-item" onClick={() => setHist(e)} aria-label={`${e.name} history`}>
                        <ExIcon ms={ms} exerciseId={e.id} />
                        <span className="meta">
                          <b>{e.name}</b>
                          {base && <span className="sub">Variation of {base.name} · optional</span>}
                          <span className="sub num">{rec?.last ? `${lastBestText(ms, rec)} · ${rec.count} sets` : 'Unlocked. Try it next session.'}</span>
                          {e.equipment.length > 0 && (
                            <span className="sub faint">
                              {d.canDo(e) ? 'Needs' : 'Needs equipment none of your places has'}: {e.equipment.map((id) => equipmentName(id, game.customEquipment)).join(', ')}
                            </span>
                          )}
                        </span>
                        <Ico as={ChevronRight} className="chev" />
                      </button>
                      <div className="inv-actions">
                        <button className="btn secondary" aria-label={`How to do ${e.name}`} title={`How to do ${e.name}`} onClick={() => setDemo(e)}>
                          <Ico as={CirclePlay} size={16} />
                          <span>How to</span>
                        </button>
                        <button className="btn secondary" aria-label={`How ${e.name} is measured`} title={`How ${e.name} is measured`} onClick={() => setMeasuring(e)}>
                          <Ico as={Ruler} size={16} />
                          <span>{trackLabel(ms, d.beatOf(e))}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {waiting > 0 && (
          <div className="card stack surprise" aria-label="Surprises waiting">
            <span className="ico">
              <Ico as={Gift} size={22} />
            </span>
            <b>{waiting} surprises waiting</b>
            <span className="note">New exercises and variations stay hidden until you unlock them. They are optional: they go into your inventory.</span>
            {next && (
              <div className="stack" style={{ gap: 6, alignSelf: 'stretch' }}>
                <Bar value={next.current} max={next.needed} />
                <span className="note">Next one: {next.text}</span>
              </div>
            )}
          </div>
        )}
        {needGear > 0 && <p className="note">{needGear} more exercises need equipment that none of your places has. Add equipment to a place (Settings → My places) and they can come up as surprises too.</p>}
      </section>

      <section className="group" aria-label="History">
        <div className="group-head">
          <h2>History</h2>
        </div>
        {history.length > 0 && <p className="group-note">Tap a set or the pencil to fix a wrong entry, or to delete test data.</p>}
        <div className="list">
          {history.length === 0 && <p className="empty">No sessions yet. Your first one is the hardest: start small, 5 minutes counts.</p>}
          {history.map((s) => {
            const sets = d.liveSets.filter((x) => x.sessionId === s.id).sort((a, b) => a.at - b.at);
            return (
              <div key={s.id} className="hist-session">
                <div className="head">
                  <div className="meta">
                    <b>
                      {new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} {s.prs > 0 && <span className="badge pr">{s.prs} PR</span>}
                    </b>
                    <span>
                      {fmtClock(s.activeSec + s.restSec)} · +{s.xpEarned} XP · {game.locations.find((l) => l.id === s.locationId)?.name ?? 'Anywhere'}
                    </span>
                    <span className="faint">
                      Active {fmtClock(s.activeSec)} · Rest {fmtClock(s.restSec)}
                    </span>
                  </div>
                  <IconBtn label="Edit session" onClick={() => setEditSession(s)}>
                    <Ico as={Pencil} size={18} />
                  </IconBtn>
                </div>
                {sets.map((x) => {
                  const ex = EXERCISE_BY_ID[x.exerciseId];
                  if (!ex) return null;
                  return (
                    <button key={x.id} className="set-row" onClick={() => setEditSet(x)} aria-label={`Edit ${ex.name} set`}>
                      <span className="num">
                        {ex.name}: {fmtValues(d.measuresOf(ex), x)} {x.isPR && <span className="badge pr">PR</span>}
                      </span>
                      <span className="muted">
                        <Ico as={Pencil} size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {hist && <HistorySheet game={game} ex={hist} onClose={() => setHist(null)} />}
      {demo && <ExerciseDemo ex={demo} known={(id) => unlocked.has(id)} onClose={() => setDemo(null)} />}
      {measuring && <MeasureSheet ex={measuring} current={d.measuresOf(measuring)} beat={d.beatOf(measuring)} onClose={() => setMeasuring(null)} />}
      {editSet && EXERCISE_BY_ID[editSet.exerciseId] && <EditSetSheet ex={EXERCISE_BY_ID[editSet.exerciseId]} ms={d.measuresOf(EXERCISE_BY_ID[editSet.exerciseId])} beat={d.beatOf(EXERCISE_BY_ID[editSet.exerciseId])} set={editSet} onClose={() => setEditSet(null)} />}
      {editSession && <EditSessionSheet game={game} s={editSession} onClose={() => setEditSession(null)} />}
    </div>
  );
}

function EditSessionSheet({ game, s, onClose }: { game: Game; s: Session; onClose: () => void }) {
  const start = new Date(s.startedAt);
  const [date, setDate] = useState(dayKey(s.startedAt));
  const [time, setTime] = useState(`${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`);
  const [active, setActive] = useState(Math.round(s.activeSec / 60));
  const [rest, setRest] = useState(Math.round(s.restSec / 60));
  const [loc, setLoc] = useState(s.locationId);
  const sets = game.d!.liveSets.filter((x) => x.sessionId === s.id).length;

  const save = async () => {
    const [y, m, dd] = date.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const startedAt = new Date(y, m - 1, dd, hh, mm).getTime();
    if (!Number.isFinite(startedAt) || active < 0 || rest < 0) {
      await confirmAsk({ title: 'Check the date, time and minutes', body: 'Pick a date and a start time; minutes cannot be below 0.', ok: 'OK' });
      return;
    }
    if (!(await confirmAsk({ title: 'Save changes to this session?', body: 'Streaks, the daily goal and records follow the new date and minutes.', ok: 'Save' }))) return;
    try {
      await updateSession(s.id, { startedAt, activeSec: Math.round(active * 60), restSec: Math.round(rest * 60), locationId: loc });
      onClose();
    } catch (e) {
      await confirmAsk({ title: 'Not saved', body: (e as Error).message, ok: 'OK' });
    }
  };
  const remove = async () => {
    if (!(await confirmAsk({ title: 'Delete this session?', body: `It has ${sets} sets and +${s.xpEarned} XP. Everything goes, and anything only it unlocked locks again.`, ok: 'Delete', danger: true }))) return;
    await deleteSession(s.id);
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <h2>Edit session</h2>
      <div className="row wrap">
        <label className="field grow">
          Date
          <input className="input" type="date" value={date} max={dayKey(Date.now())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field grow">
          Start
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <div className="row wrap">
        <Stepper label="Active" unit="min" value={active} onChange={setActive} />
        <Stepper label="Rest" unit="min" value={rest} onChange={setRest} />
      </div>
      <span className="field-label">Place</span>
      <div className="chips wrap" role="radiogroup" aria-label="Place">
        {game.locations.map((l) => (
          <button key={l.id} role="radio" aria-checked={loc === l.id} className={`chip ${loc === l.id ? 'on' : ''}`} onClick={() => setLoc(l.id)}>
            {l.name}
          </button>
        ))}
      </div>
      <p className="note">To fix a set, close this and tap the set in the list.</p>
      <div className="row sheet-footer">
        <button className="btn danger" onClick={remove}>
          Delete
        </button>
        <button className="btn secondary grow" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary grow" onClick={save} disabled={!date || !time}>
          Save
        </button>
      </div>
    </Sheet>
  );
}
