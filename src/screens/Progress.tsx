import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { Bar, IconBtn, Sheet, Stepper } from '../components/ui';
import { confirmAsk } from '../components/Confirm';
import { EditSetSheet, MeasureSheet, trackLabel } from '../components/SetEditors';
import { ExerciseDemo } from '../components/ExerciseDemo';
import { EXERCISES, EXERCISE_BY_ID, TIER_NAMES } from '../core/exercises';
import { equipmentName } from '../core/equipment';
import { fmtClock } from '../core/live';
import { fmtValues, iconFor } from '../core/measures';
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
      <h1>Progress</h1>

      <section className="card stack" aria-label="Avatar evolution">
        <h2>Avatar evolution</h2>
        <div className="row" style={{ overflowX: 'auto', gap: 4, paddingBottom: 4 }}>
          {AVATAR_STAGES.map((s, i) => (
            <div key={s.name} className="stack" style={{ alignItems: 'center', gap: 2, flex: 'none' }}>
              <Avatar stage={i} gear={i === d.stage ? d.gear : []} color={color} size={64} silhouette={i > d.stage} style={p.avatarStyle} gender={p.gender} action={i === d.stage ? 'idle' : 'still'} />
              <span className={`tiny ${i === d.stage ? '' : 'muted'}`}>{i > d.stage ? `Lv ${s.minLevel}` : s.name}</span>
            </div>
          ))}
        </div>
        <div className="row wrap small">
          {GEAR.map((g) => (
            <span key={g.id} className={`badge ${d.gear.includes(g.id) ? 'new' : ''}`}>
              {d.gear.includes(g.id) ? '✓' : '🔒'} {g.name} ({g.unlocks} unlocks)
            </span>
          ))}
        </div>
        <div className="row wrap" role="radiogroup" aria-label="Avatar color">
          {COLORS.map((c) => {
            const owned = p.cosmetics.includes(c.id);
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={p.color === c.id}
                aria-label={owned ? c.name : `${c.name} (locked)`}
                disabled={!owned}
                onClick={() => updateProfile({ color: c.id })}
                style={{ width: 36, height: 36, borderRadius: 99, background: owned ? c.hex : 'var(--line)', border: p.color === c.id ? '3px solid #fff' : '2px solid var(--line)' }}
              >
                {owned ? '' : '?'}
              </button>
            );
          })}
        </div>
        <p className="small muted">New colors come from mystery chests. Change the avatar style in Settings.</p>
      </section>

      <section className="card row between num" aria-label="Stats">
        <div className="stat">
          <span className="tiny muted">Sessions</span>
          <b>{d.stats.sessions}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Best streak</span>
          <b>{d.stats.bestStreak}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Minutes</span>
          <b>{d.stats.totalMinutes}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Unlocked</span>
          <b>{d.unlocked.length}</b>
        </div>
      </section>

      <DoneExercises game={game} />

      <section className="stack" aria-label="Your exercises">
        <h2>Your exercise inventory</h2>
        {[1, 2, 3, 4, 5, 6, 0].map((tier) => {
          const mine = EXERCISES.filter((e) => e.tier === tier && unlocked.has(e.id));
          if (!mine.length) return null;
          return (
            <div key={tier} className="stack" style={{ gap: 8 }}>
              <div className="tier-head">
                <h3>
                  Tier {tier || '★'} · {TIER_NAMES[tier]}
                </h3>
              </div>
              {mine.map((e) => {
                const ms = d.measuresOf(e);
                const rec = d.stats.records.get(e.id);
                return (
                  <div key={e.id} className={`card ex ${d.canDo(e) ? '' : 'locked'}`}>
                    <span className="ico">{iconFor(ms)}</span>
                    <div className="grow stack" style={{ gap: 4 }}>
                      <button className="linkish" onClick={() => setHist(e)} aria-label={`${e.name} history`}>
                        <b>{e.name}</b> <span className="small muted">📈</span>
                      </button>
                      {e.base && EXERCISE_BY_ID[e.base] && unlocked.has(e.base) && <span className="tiny muted" style={{ textTransform: 'none', letterSpacing: 0 }}>Variation of {EXERCISE_BY_ID[e.base].name} · optional</span>}
                      <span className="small muted num">{rec?.last ? `${lastBestText(ms, rec)} · ${rec.count} sets` : 'Unlocked. Try it next session!'}</span>
                      {e.equipment.length > 0 && <span className="tiny muted">{d.canDo(e) ? 'Needs' : 'Needs equipment none of your places has'}: {e.equipment.map((id) => equipmentName(id, game.customEquipment)).join(', ')}</span>}
                    </div>
                    <div className="stack" style={{ gap: 6 }}>
                      <IconBtn label={`How to do ${e.name}`} onClick={() => setDemo(e)}>
                        ▶ How to
                      </IconBtn>
                      <IconBtn label={`How ${e.name} is measured`} onClick={() => setMeasuring(e)}>
                        📏 {trackLabel(ms, d.beatOf(e))}
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {waiting > 0 && (
          <div className="card stack surprise" aria-label="Surprises waiting">
            <span style={{ fontSize: 34 }} aria-hidden>
              🎁
            </span>
            <b>{waiting} surprises waiting</b>
            <span className="small muted">New exercises and variations stay hidden until you unlock them. They are optional: they go into your inventory.</span>
            {next && (
              <>
                <Bar value={next.current} max={next.needed} />
                <span className="small muted">Next one: {next.text}</span>
              </>
            )}
          </div>
        )}
        {needGear > 0 && <p className="small muted">{needGear} more exercises need equipment that none of your places has. Add equipment to a place (Settings → My places) and they can come up as surprises too.</p>}
      </section>

      <section className="card stack" aria-label="History">
        <h2>History</h2>
        <p className="small muted">Tap ✎ to fix a wrong entry, or delete test data.</p>
        {history.length === 0 && <p className="muted">No sessions yet. Your first one is the hardest. Start small.</p>}
        {history.map((s) => {
          const sets = d.liveSets.filter((x) => x.sessionId === s.id).sort((a, b) => a.at - b.at);
          return (
            <div key={s.id} className="stack" style={{ gap: 4 }}>
              <div className="row between small">
                <b>{new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</b>
                <span className="num">
                  {fmtClock(s.activeSec + s.restSec)} · +{s.xpEarned} XP {s.prs > 0 && <span className="badge pr">{s.prs} PR</span>}
                </span>
                <IconBtn label="Edit session" onClick={() => setEditSession(s)}>
                  ✎
                </IconBtn>
              </div>
              <span className="small muted">
                Active {fmtClock(s.activeSec)} · Rest {fmtClock(s.restSec)} · {game.locations.find((l) => l.id === s.locationId)?.name ?? 'Anywhere'}
              </span>
              {sets.map((x) => {
                const ex = EXERCISE_BY_ID[x.exerciseId];
                if (!ex) return null;
                return (
                  <button key={x.id} className="row between small set-row" onClick={() => setEditSet(x)} aria-label={`Edit ${ex.name} set`}>
                    <span>
                      {ex.name}: {fmtValues(d.measuresOf(ex), x)} {x.isPR && <span className="badge pr">PR</span>}
                    </span>
                    <span className="muted">✎</span>
                  </button>
                );
              })}
              <hr />
            </div>
          );
        })}
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
        <label className="field">
          Date
          <input className="input" type="date" value={date} max={dayKey(Date.now())} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="field">
          Start
          <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
      </div>
      <div className="row wrap">
        <Stepper label="Active" unit="min" value={active} onChange={setActive} />
        <Stepper label="Rest" unit="min" value={rest} onChange={setRest} />
      </div>
      <div className="row wrap" role="radiogroup" aria-label="Place">
        {game.locations.map((l) => (
          <button key={l.id} role="radio" aria-checked={loc === l.id} className={`chip ${loc === l.id ? 'on' : ''}`} onClick={() => setLoc(l.id)}>
            {l.name}
          </button>
        ))}
      </div>
      <p className="small muted">To fix a set, close this and tap the set in the list.</p>
      <div className="row">
        <button className="btn danger" onClick={remove}>
          Delete
        </button>
        <button className="btn ghost grow" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary grow" onClick={save} disabled={!date || !time}>
          Save
        </button>
      </div>
    </Sheet>
  );
}
