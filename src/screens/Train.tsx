import { useEffect, useRef, useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { equipmentName, knownEquipment } from '../core/equipment';
import { PlaceEditor } from '../components/PlaceEditor';
import { cardioTotals, fmtClock, inMode, totals, activeSeconds } from '../core/live';
import { fmtPace, nextTarget, starterPlan, type ExRecord } from '../core/rules';
import type { Exercise, LiveMode, Session, WorkSet } from '../core/types';
import { cancelCardio, discardSession, finishCardio, finishSession, logSet, setMode, startCardio, startSession, updateProfile, deleteSet, type SessionSummary } from '../data/repo';
import type { Game } from '../data/useGame';
import { alarm, keepAwake, primeAudio } from '../lib/alarm';
import { cancelRestAlarm, scheduleRestAlarm } from '../lib/notify';
import { ICONS, Sheet, Stepper, useNow } from '../components/ui';

interface Props {
  game: Game;
  toast: (t: string) => void;
  onFinished: (s: SessionSummary) => void;
}

export function Train(props: Props) {
  return props.game.d!.active ? <ActiveSession {...props} session={props.game.d!.active} /> : <PreSession {...props} />;
}

function LocationPicker({ game, value, onPick }: { game: Game; value: string | null; onPick: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="row wrap" role="radiogroup" aria-label="Where are you training?">
      {game.locations.map((l) => (
        <button key={l.id} role="radio" aria-checked={value === l.id} className={`chip ${value === l.id ? 'on' : ''}`} onClick={() => onPick(l.id)}>
          {l.kind === 'home' ? '🏠' : l.kind === 'gym' ? '🏋️' : l.kind === 'outdoor' ? '🌳' : '📍'} {l.name}
        </button>
      ))}
      <button className="chip" onClick={() => setAdding(true)}>
        + New place
      </button>
      {adding && (
        <PlaceEditor
          loc={{ name: '', kind: 'gym', equipment: [] }}
          customEquipment={game.customEquipment}
          unlocked={game.profile!.unlocked}
          canDelete={false}
          onClose={(id) => {
            setAdding(false);
            if (id) onPick(id);
          }}
        />
      )}
    </div>
  );
}

function PreSession({ game }: Props) {
  const d = game.d!;
  const [busy, setBusy] = useState(false);
  const loc = d.location;
  const plan = starterPlan(d.available, d.stats.sessions);
  const eqNames = knownEquipment(loc?.equipment ?? [], game.customEquipment).map((id) => equipmentName(id, game.customEquipment));

  const start = async () => {
    if (busy) return;
    setBusy(true);
    primeAudio();
    try {
      await startSession(loc?.id ?? null);
      void keepAwake(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <h1>Train</h1>
      <section className="card stack">
        <h2>Where are you today?</h2>
        <LocationPicker game={game} value={loc?.id ?? null} onPick={(id) => updateProfile({ lastLocationId: id })} />
        <p className="small muted">Equipment: {eqNames.length ? eqNames.join(', ') : 'none (bodyweight only)'}. Edit in Settings → My places.</p>
      </section>

      {plan.length > 0 && (
        <section className="card stack">
          <h2>Starter plan</h2>
          <p className="small muted">Short on purpose: build the habit first. Beat one number, then rest.</p>
          {plan.map((x) => (
            <div key={x.exerciseId} className="row between">
              <span>
                {ICONS[EXERCISE_BY_ID[x.exerciseId].metric]} {EXERCISE_BY_ID[x.exerciseId].name}
              </span>
              <span className="muted small">
                {x.sets} {x.sets === 1 ? 'round' : 'sets'}
              </span>
            </div>
          ))}
        </section>
      )}

      <section className="card stack">
        <h2>You can do here ({d.available.length})</h2>
        {d.available.map((e) => {
          const r = d.stats.records.get(e.id);
          return (
            <div key={e.id} className="row between">
              <span>
                {ICONS[e.metric]} {e.name}
              </span>
              <span className="small muted num">{r ? `Record ${fmtRecord(e, r)}` : 'New'}</span>
            </div>
          );
        })}
      </section>

      <button className="btn primary big" onClick={start} disabled={busy}>
        Start session
      </button>
    </div>
  );
}

export function fmtRecord(e: Exercise, r: ExRecord): string {
  const b = r.bestSet;
  if (!b) return '-';
  switch (e.metric) {
    case 'reps':
      return `${b.reps}`;
    case 'time':
      return `${b.seconds}s`;
    case 'weight_reps':
      return `${b.weightKg} kg x ${b.reps}`;
    case 'distance':
      return `${b.distanceKm} km${r.bestPace ? ` · ${fmtPace(r.bestPace)}/km` : ''}`;
  }
}

export function fmtSet(e: Exercise, s: WorkSet): string {
  switch (e.metric) {
    case 'reps':
      return `${s.reps} reps`;
    case 'time':
      return `${s.seconds}s`;
    case 'weight_reps':
      return `${s.weightKg} kg x ${s.reps}`;
    case 'distance':
      return `${s.distanceKm} km in ${fmtClock(s.durationSec ?? 0)} (run ${fmtClock(s.runSec ?? 0)}, walk ${fmtClock(s.walkSec ?? 0)}, rest ${fmtClock(s.restSec ?? 0)})`;
  }
}

function ActiveSession({ game, toast, onFinished, session }: Props & { session: Session }) {
  const d = game.d!;
  const p = game.profile!;
  const now = useNow(500);
  const live = session.live!;
  const t = totals(live, now);
  const limit = p.settings.restLimitSec;
  const restFor = live.mode === 'rest' ? inMode(live, now) : 0;
  const over = live.mode === 'rest' && restFor >= limit;
  const lastAlarm = useRef(0);
  const [open, setOpen] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState<'finish' | 'discard' | null>(null);
  const [busy, setBusy] = useState(false);
  const sessionSets = d.liveSets.filter((s) => s.sessionId === session.id);
  const plan = starterPlan(d.available, d.stats.sessions).map((x) => x.exerciseId);
  const ordered = [...d.available].sort((a, b) => Number(plan.includes(b.id)) - Number(plan.includes(a.id)));

  useEffect(() => {
    void keepAwake(true);
    return () => void keepAwake(false);
  }, []);

  // Rest alarm: first at the limit, then every 30 s until rest ends.
  useEffect(() => {
    if (!over) {
      lastAlarm.current = 0;
      return;
    }
    if (Date.now() - lastAlarm.current > 30_000) {
      lastAlarm.current = Date.now();
      alarm(p.settings);
    }
  }, [over, now, p.settings]);

  const goRest = async () => {
    primeAudio();
    await setMode(session.id, 'rest');
    void scheduleRestAlarm(limit);
  };
  const goWork = async () => {
    await setMode(session.id, 'exercise');
    void cancelRestAlarm();
  };

  const onLogged = async (msg: string) => {
    toast(msg);
    await goRest();
  };

  const finish = async () => {
    if (busy) return;
    setBusy(true);
    try {
      void cancelRestAlarm();
      const s = await finishSession(session.id);
      void keepAwake(false);
      setConfirmEnd(null);
      onFinished(s);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="row between">
        <div>
          <span className="tiny muted">Session · {game.locations.find((l) => l.id === session.locationId)?.name ?? 'Anywhere'}</span>
          <div className="clock">{fmtClock(t.exercise + t.rest + t.run + t.walk)}</div>
        </div>
        <div className="stack small num" style={{ gap: 2, textAlign: 'right' }}>
          <span>
            <span style={{ color: 'var(--accent)' }}>●</span> Active {fmtClock(activeSeconds(t))}
          </span>
          <span>
            <span style={{ color: 'var(--rest)' }}>●</span> Rest {fmtClock(t.rest)}
          </span>
          <span className="muted">{sessionSets.length} {sessionSets.length === 1 ? 'set' : 'sets'}</span>
        </div>
      </div>

      {live.cardio ? (
        <CardioPanel session={session} game={game} now={now} toast={toast} />
      ) : live.mode === 'rest' ? (
        <div className={`mode-card stack ${over ? 'over' : 'rest'}`} aria-live="polite">
          <span className="tiny">{over ? 'Rest is over. Back to work!' : 'Resting'}</span>
          <div className="clock">
            {fmtClock(restFor)} <span className="muted" style={{ fontSize: 18 }}>/ {fmtClock(limit)}</span>
          </div>
          <button className="btn primary big" onClick={goWork}>
            Back to work
          </button>
        </div>
      ) : (
        <div className="mode-card work stack">
          <span className="tiny">Working</span>
          <p className="small muted">Log a set below. The rest timer starts by itself.</p>
          <button className="btn rest big" onClick={goRest}>
            Start rest
          </button>
        </div>
      )}

      {!live.cardio && (
        <section className="stack" aria-label="Exercises">
          {ordered.map((e) => (
            <ExerciseCard
              key={e.id}
              ex={e}
              rec={d.stats.records.get(e.id)}
              sets={sessionSets.filter((s) => s.exerciseId === e.id)}
              open={open === e.id}
              inPlan={plan.includes(e.id)}
              onToggle={() => setOpen(open === e.id ? null : e.id)}
              session={session}
              onLogged={onLogged}
            />
          ))}
        </section>
      )}

      <div className="row">
        <button className="btn danger" onClick={() => setConfirmEnd('discard')}>
          Discard
        </button>
        <button className="btn good grow" onClick={() => setConfirmEnd('finish')} disabled={!!live.cardio || sessionSets.length === 0}>
          Finish session
        </button>
      </div>
      {sessionSets.length === 0 && !live.cardio && <p className="small muted">Log at least one set or a run to finish. Even one set counts!</p>}

      {confirmEnd && (
        <Sheet onClose={() => setConfirmEnd(null)}>
          <h2>{confirmEnd === 'finish' ? 'Finish this session?' : 'Discard this session?'}</h2>
          <p className="muted">{confirmEnd === 'finish' ? `${sessionSets.length} sets, ${fmtClock(t.exercise + t.rest + t.run + t.walk)} total.` : 'Its sets and time will not count.'}</p>
          <div className="row">
            <button className="btn ghost grow" onClick={() => setConfirmEnd(null)}>
              Back
            </button>
            {confirmEnd === 'finish' ? (
              <button className="btn good grow" onClick={finish} disabled={busy}>
                Finish
              </button>
            ) : (
              <button
                className="btn danger grow"
                onClick={async () => {
                  void cancelRestAlarm();
                  await discardSession(session.id);
                  setConfirmEnd(null);
                }}
              >
                Discard
              </button>
            )}
          </div>
        </Sheet>
      )}
    </div>
  );
}

function ExerciseCard({ ex, rec, sets, open, inPlan, onToggle, session, onLogged }: { ex: Exercise; rec: ExRecord | undefined; sets: WorkSet[]; open: boolean; inPlan: boolean; onToggle: () => void; session: Session; onLogged: (m: string) => void }) {
  const target = nextTarget(ex, rec);
  const [reps, setReps] = useState(target.reps ?? 0);
  const [seconds, setSeconds] = useState(target.seconds ?? 0);
  const [kg, setKg] = useState(target.weightKg ?? 0);

  // Keep inputs on the new target after a record is beaten.
  useEffect(() => {
    setReps(target.reps ?? 0);
    setSeconds(target.seconds ?? 0);
    setKg(target.weightKg ?? 0);
  }, [rec?.best, rec?.bestSet?.reps]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = rec?.last;
  const log = async () => {
    const values = ex.metric === 'reps' ? { reps } : ex.metric === 'time' ? { seconds } : { weightKg: kg, reps };
    const r = await logSet(session.id, ex.id, values);
    onLogged(r.isPR ? `🏆 NEW RECORD! ${ex.name}: ${fmtSet(ex, r.set)}` : `Set logged: ${fmtSet(ex, r.set)}`);
  };

  return (
    <div className="card stack" style={inPlan ? { borderColor: 'rgba(255,122,26,.5)' } : undefined}>
      <button className="ex" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left' }} onClick={onToggle} aria-expanded={open}>
        <span className="ico">{ICONS[ex.metric]}</span>
        <span className="grow">
          <b>{ex.name}</b> {inPlan && <span className="badge">plan</span>}
          <br />
          <span className="small muted">{rec ? `Record ${fmtRecord(ex, rec)} · Last ${last ? fmtSet(ex, last) : '-'}` : 'No record yet'}</span>
        </span>
        <span className="badge num">{sets.length} done</span>
      </button>

      {open && (
        <>
          <div className="beat">
            <div>
              <span className="tiny muted">Last</span>
              <b className="num">{last ? shortVal(ex, last) : '-'}</b>
            </div>
            <div>
              <span className="tiny muted">Record</span>
              <b className="num">{rec?.bestSet ? shortVal(ex, rec.bestSet) : '-'}</b>
            </div>
            <div className="target">
              <span className="tiny muted">Beat this</span>
              <b className="num">{shortTarget(ex, target)}</b>
            </div>
          </div>
          <p className="small muted">{target.label}</p>
          <p className="small muted">💡 {ex.cue}</p>

          {ex.metric === 'distance' ? (
            <button className="btn primary big" onClick={() => startCardio(session.id, ex.id)}>
              Start {ex.name.toLowerCase()}
            </button>
          ) : (
            <>
              <div className="row wrap">
                {ex.metric === 'weight_reps' && <Stepper label="Weight" unit="kg" value={kg} step={2.5} onChange={setKg} />}
                {ex.metric !== 'time' && <Stepper label="Reps done" value={reps} onChange={setReps} />}
                {ex.metric === 'time' && <Stepper label="Seconds" unit="s" value={seconds} step={5} onChange={setSeconds} />}
              </div>
              <button className="btn primary big" onClick={log} disabled={(ex.metric === 'time' ? seconds : reps) <= 0}>
                Log set + rest
              </button>
            </>
          )}

          {sets.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              {sets.map((s, i) => (
                <div key={s.id} className="row between small">
                  <span>
                    Set {i + 1}: {fmtSet(ex, s)} {s.isPR && <span className="badge pr">PR</span>}
                  </span>
                  <button className="btn ghost" style={{ minHeight: 32, padding: '4px 10px' }} onClick={() => deleteSet(s.id)} aria-label={`Delete set ${i + 1}`}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function shortVal(ex: Exercise, s: WorkSet): string {
  if (ex.metric === 'reps') return `${s.reps}`;
  if (ex.metric === 'time') return `${s.seconds}s`;
  if (ex.metric === 'weight_reps') return `${s.weightKg}×${s.reps}`;
  return `${s.distanceKm}km`;
}

function shortTarget(ex: Exercise, t: ReturnType<typeof nextTarget>): string {
  if (ex.metric === 'reps') return `${t.reps}`;
  if (ex.metric === 'time') return `${t.seconds}s`;
  if (ex.metric === 'weight_reps') return t.weightKg ? `${t.weightKg}×${t.reps}` : `${t.reps} reps`;
  return `${t.distanceKm}km`;
}

const CARDIO_MODES: { mode: LiveMode; label: string; cls: string }[] = [
  { mode: 'run', label: '🏃 Run', cls: 'primary' },
  { mode: 'walk', label: '🚶 Walk', cls: 'good' },
  { mode: 'rest', label: '⏸ Rest', cls: 'rest' },
];

function CardioPanel({ session, game, now, toast }: { session: Session; game: Game; now: number; toast: (t: string) => void }) {
  const live = session.live!;
  const ex = EXERCISE_BY_ID[live.cardio!.exerciseId];
  const rec = game.d!.stats.records.get(ex.id);
  const c = cardioTotals(live, now)!;
  const total = c.run + c.walk + c.rest;
  const target = nextTarget(ex, rec);
  const [stopping, setStopping] = useState(false);
  const [km, setKm] = useState(target.distanceKm ?? 1);

  const save = async () => {
    const r = await finishCardio(session.id, km);
    setStopping(false);
    if (r) toast(r.isPR ? `🏆 NEW RECORD! ${ex.name}: ${km} km` : `${ex.name} saved: ${km} km`);
  };

  return (
    <div className="mode-card work stack">
      <span className="tiny">{ex.name}</span>
      <div className="clock">{fmtClock(total)}</div>
      <div className="row between small num">
        <span>Run {fmtClock(c.run)}</span>
        <span>Walk {fmtClock(c.walk)}</span>
        <span>Rest {fmtClock(c.rest)}</span>
      </div>
      <p className="small muted">
        {rec?.bestSet ? `Record ${fmtRecord(ex, rec)}. ` : ''}
        {target.label}
      </p>
      <div className="modes">
        {CARDIO_MODES.map((m) => (
          <button key={m.mode} className={`btn ${m.cls} ${live.mode === m.mode ? 'on' : ''}`} onClick={() => setMode(session.id, m.mode)} aria-pressed={live.mode === m.mode}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="row">
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm(`Cancel this ${ex.name.toLowerCase()}? Its time will not be saved.`)) void cancelCardio(session.id);
          }}
        >
          Cancel
        </button>
        <button
          className="btn danger grow"
          style={{ background: 'var(--bad)', color: '#fff' }}
          onClick={async () => {
            await setMode(session.id, 'idle');
            setStopping(true);
          }}
        >
          ⏹ Stop
        </button>
      </div>
      {stopping && (
        <Sheet>
          <h2>How far did you go?</h2>
          <p className="muted small">Time: {fmtClock(total)}. Check your watch, treadmill or map app.</p>
          <Stepper label="Distance" unit="km" value={km} step={0.1} onChange={setKm} />
          {km > 0 && total > 0 && <p className="small muted">Pace: {fmtPace(total / 60 / km)} per km</p>}
          <div className="row">
            <button
              className="btn ghost grow"
              onClick={async () => {
                await setMode(session.id, 'run');
                setStopping(false);
              }}
            >
              Keep going
            </button>
            <button className="btn primary grow" onClick={save} disabled={km <= 0}>
              Save
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

