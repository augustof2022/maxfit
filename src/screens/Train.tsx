import { useEffect, useRef, useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { equipmentName, knownEquipment } from '../core/equipment';
import { PlaceEditor } from '../components/PlaceEditor';
import { cardioTotals, fmtClock, inMode, totals, activeSeconds } from '../core/live';
import { fmtPace, fmtTarget, GOAL_TARGETS, goalFor, nextTarget, starterPlan, suggestedPlan, type ExRecord } from '../core/rules';
import { ExerciseDemo } from '../components/ExerciseDemo';
import { fmtLevel, fmtValues, iconFor, isCardioFlow, levelOf } from '../core/measures';
import type { Beat, Exercise, Goal, LiveMode, Measure, Session, WorkSet } from '../core/types';
import { cancelCardio, discardSession, finishCardio, finishSession, logSet, setMode, startCardio, startSession, updateProfile, type SessionSummary } from '../data/repo';
import { confirmAsk } from '../components/Confirm';
import { EditSetSheet, MeasureInputs, MeasureSheet, trackLabel } from '../components/SetEditors';
import type { Game } from '../data/useGame';
import { alarm, keepAwake, primeAudio } from '../lib/alarm';
import { cancelRestAlarm, scheduleRestAlarm } from '../lib/notify';
import { Sheet, Stepper, useNow } from '../components/ui';
import { Avatar, actionFor, type AvatarAction } from '../components/Avatar';
import { COLORS } from '../core/rules';

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
          unlocked={game.d!.unlockedAll}
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
  const goals = game.profile!.goals ?? [];
  const focus = game.profile!.focus ?? [];
  const starter = starterPlan(d.available, d.stats.sessions, goals, focus);
  const plan = starter.length ? starter : goals.length || focus.length ? suggestedPlan(d.available, goals, focus) : [];
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
    <div className="stack screen">
      <h1>Train</h1>
      <section className="card stack">
        <h2>Where are you today?</h2>
        <LocationPicker game={game} value={loc?.id ?? null} onPick={(id) => updateProfile({ lastLocationId: id })} />
        <p className="small muted">Equipment: {eqNames.length ? eqNames.join(', ') : 'none (bodyweight only)'}. Edit in Settings → My places.</p>
      </section>

      {plan.length > 0 && (
        <section className="card stack">
          <h2>{starter.length ? 'Starter plan' : 'Plan for your goals'}</h2>
          <p className="small muted">{starter.length ? 'Short on purpose: build the habit first. Beat one number, then rest.' : 'Picked from your goals and focus (Settings). Beat one number in each.'}</p>
          {plan.map((x) => (
            <div key={x.exerciseId} className="row between">
              <span>
                {iconFor(d.measuresOf(EXERCISE_BY_ID[x.exerciseId]))} {EXERCISE_BY_ID[x.exerciseId].name}
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
                {iconFor(d.measuresOf(e))} {e.name}
              </span>
              <span className="small muted num">{r ? `Record ${fmtRecord(d.measuresOf(e), r)}` : 'New'}</span>
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

/** The record ("the number to beat") in the user's measures, plus best pace for cardio. */
export function fmtRecord(ms: Measure[], r: ExRecord): string {
  const b = r.bestSet;
  if (!b) return '-';
  const bt = r.beat;
  if (bt.kind === 'same') {
    const lvl = levelOf(bt, b)!;
    const heaviest = bt.fixed === 'weight' && r.maxLevel > lvl ? ` · heaviest ${r.maxLevel} kg` : '';
    const others = r.levels.size > 1 ? ` · ${r.levels.size} ${bt.fixed === 'weight' ? 'weights' : 'distances'}` : '';
    return `${fmtValues([bt.beat], b)} ${fmtLevel(bt, lvl)}${heaviest}${others}`;
  }
  return `${fmtValues(ms, b)}${ms.includes('distance') && r.bestPace ? ` · best pace ${fmtPace(r.bestPace)}/km` : ''}`;
}

export function fmtSet(ms: Measure[], s: WorkSet): string {
  const base = fmtValues(ms, s);
  if (s.runSec || s.walkSec) return `${base} (run ${fmtClock(s.runSec ?? 0)}, walk ${fmtClock(s.walkSec ?? 0)}, rest ${fmtClock(s.restSec ?? 0)})`;
  return base;
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
  const starter = starterPlan(d.available, d.stats.sessions, p.goals ?? [], p.focus ?? []);
  const plan = (starter.length ? starter : (p.goals ?? []).length || (p.focus ?? []).length ? suggestedPlan(d.available, p.goals ?? [], p.focus ?? []) : []).map((x) => x.exerciseId);
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

  // The avatar trains with you: it does the move of the open exercise, runs or walks in cardio, breathes at rest.
  const avAction: AvatarAction = live.cardio ? (live.mode === 'walk' ? 'walk' : live.mode === 'run' ? 'run' : 'idle') : live.mode === 'rest' ? 'idle' : actionFor(open);
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';

  return (
    <div className="stack screen">
      <div className="row between">
        <Avatar stage={d.stage} gear={d.gear} color={color} size={68} style={p.avatarStyle} action={avAction} />
        <div className="grow">
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
              ms={d.measuresOf(e)}
              beat={d.beatOf(e)}
              goals={p.goals ?? []}
              known={(id) => d.unlocked.includes(id)}
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

function ExerciseCard({ ex, ms, beat, goals, known, rec, sets, open, inPlan, onToggle, session, onLogged }: { ex: Exercise; ms: Measure[]; beat: Beat; goals: Goal[]; known: (id: string) => boolean; rec: ExRecord | undefined; sets: WorkSet[]; open: boolean; inPlan: boolean; onToggle: () => void; session: Session; onLogged: (m: string) => void }) {
  const baseTarget = nextTarget(ex, rec, ms, goals, beat);
  const goal = goalFor(ex, goals);
  // The goal rep range drives targets only for weighted moves, so show it only there.
  const gt = goal && ms.includes('weight') ? GOAL_TARGETS[goal] : null;
  const [demo, setDemo] = useState(false);
  const fromTarget = (): Partial<WorkSet> => ({ reps: baseTarget.reps, seconds: baseTarget.seconds, weightKg: baseTarget.weightKg, distanceKm: baseTarget.distanceKm });
  const [v, setV] = useState<Partial<WorkSet>>(fromTarget);
  // Same-weight / same-distance: the record and the number to beat follow the weight or distance typed now.
  const typedLevel = levelOf(beat, v);
  const target = beat.kind === 'same' && typedLevel !== null ? nextTarget(ex, rec, ms, goals, beat, typedLevel) : baseTarget;
  const levelBest = beat.kind === 'same' && typedLevel !== null ? rec?.levels.get(typedLevel) : rec?.bestSet;
  const [measuring, setMeasuring] = useState(false);
  const [editing, setEditing] = useState<WorkSet | null>(null);
  const [glow, setGlow] = useState(false);

  // Keep inputs on the new target after a record is beaten or the measures change.
  useEffect(() => {
    setV(fromTarget());
  }, [rec?.bestSet?.id, ms.join(), JSON.stringify(beat)]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = rec?.last;
  const cardio = isCardioFlow(ms, beat);
  const canLog = ms.some((m) => ((m === 'reps' ? v.reps : m === 'time' || m === 'speed' ? v.seconds : m === 'weight' ? v.weightKg : v.distanceKm) ?? 0) > 0);
  const log = async () => {
    const values = {
      reps: ms.includes('reps') ? v.reps : undefined,
      seconds: ms.includes('time') || ms.includes('speed') ? v.seconds : undefined,
      weightKg: ms.includes('weight') ? v.weightKg : undefined,
      distanceKm: ms.includes('distance') ? v.distanceKm : undefined,
    };
    const r = await logSet(session.id, ex.id, values);
    if (r.isPR) {
      setGlow(true);
      setTimeout(() => setGlow(false), 1700);
    }
    onLogged(r.newWeight ? `🏆 NEW WEIGHT! ${ex.name}: ${fmtValues(ms, r.set)}` : r.isPR ? `🏆 NEW RECORD! ${ex.name}: ${fmtValues(ms, r.set)}` : `Set logged: ${fmtValues(ms, r.set)}`);
  };

  return (
    <div className={`card stack ${glow ? 'glow-pr' : ''}`} style={inPlan ? { borderColor: 'rgba(255,122,26,.5)' } : undefined}>
      <button className="ex" style={{ background: 'none', border: 0, padding: 0, textAlign: 'left' }} onClick={onToggle} aria-expanded={open}>
        <span className="ico">{iconFor(ms)}</span>
        <span className="grow">
          <b>{ex.name}</b> {inPlan && <span className="badge">plan</span>}
          <br />
          <span className="small muted">{rec?.bestSet ? `Record ${fmtRecord(ms, rec)} · Last ${last ? fmtValues(ms, last) : '-'}` : 'No record yet'}</span>
        </span>
        <span className="badge num">{sets.length} done</span>
      </button>

      {open && (
        <>
          <div className="beat">
            <div>
              <span className="tiny muted">Last</span>
              <b className="num">{last ? fmtValues(ms, last, true) : '-'}</b>
            </div>
            <div>
              <span className="tiny muted">{beat.kind === 'same' && typedLevel !== null ? `Record ${fmtLevel(beat, typedLevel).replace(/^(at|over) /, '')}` : 'Record'}</span>
              <b className="num">{levelBest ? fmtValues(beat.kind === 'same' ? [beat.beat] : ms, levelBest, true) : beat.kind === 'same' ? 'new' : '-'}</b>
            </div>
            <div className="target">
              <span className="tiny muted">Beat this</span>
              <b className="num">{fmtTarget(ms, target)}</b>
            </div>
          </div>
          <p className="small muted">{target.label}</p>
          {gt && (
            <p className="small goal-line">
              🎯 {gt.label}: {gt.low}–{gt.high} reps × {gt.sets} sets, rest {gt.restSec} s
            </p>
          )}
          <p className="small muted">💡 {ex.cue}</p>
          <div className="row wrap">
            <button className="btn ghost icon-btn" onClick={() => setDemo(true)}>
              ▶ How to do it
            </button>
            <button className="btn ghost icon-btn" onClick={() => setMeasuring(true)}>
              📏 {trackLabel(ms, beat)}
            </button>
          </div>

          {cardio ? (
            <button className="btn primary big" onClick={() => startCardio(session.id, ex.id)}>
              Start {ex.name.toLowerCase()}
            </button>
          ) : (
            <>
              <MeasureInputs ms={ms} v={v} onChange={setV} beat={beat} />
              <button className="btn primary big" onClick={log} disabled={!canLog}>
                Log set + rest
              </button>
            </>
          )}

          {sets.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              {sets.map((s, i) => (
                <div key={s.id} className="row between small">
                  <span>
                    Set {i + 1}: {fmtSet(ms, s)} {s.isPR && <span className="badge pr">PR</span>}
                  </span>
                  <button className="btn ghost icon-btn" onClick={() => setEditing(s)} aria-label={`Edit set ${i + 1}`}>
                    ✎ Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {measuring && <MeasureSheet ex={ex} current={ms} beat={beat} onClose={() => setMeasuring(false)} />}
      {demo && <ExerciseDemo ex={ex} known={known} onClose={() => setDemo(false)} />}
      {editing && <EditSetSheet ex={ex} ms={ms} set={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const CARDIO_MODES: { mode: LiveMode; label: string; cls: string }[] = [
  { mode: 'run', label: '🏃 Run', cls: 'primary' },
  { mode: 'walk', label: '🚶 Walk', cls: 'good' },
  { mode: 'rest', label: '⏸ Rest', cls: 'rest' },
];

function CardioPanel({ session, game, now, toast }: { session: Session; game: Game; now: number; toast: (t: string) => void }) {
  const live = session.live!;
  const ex = EXERCISE_BY_ID[live.cardio!.exerciseId];
  const ms = game.d!.measuresOf(ex);
  const rec = game.d!.stats.records.get(ex.id);
  const c = cardioTotals(live, now)!;
  const total = c.run + c.walk + c.rest;
  const target = nextTarget(ex, rec, ms, game.profile!.goals ?? [], game.d!.beatOf(ex));
  const [stopping, setStopping] = useState(false);
  const [km, setKm] = useState(target.distanceKm ?? 1);
  const [reps, setReps] = useState(target.reps ?? 0);

  const save = async () => {
    const r = await finishCardio(session.id, km, ms.includes('reps') ? reps : undefined);
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
        {rec?.bestSet ? `Record ${fmtRecord(ms, rec)}. ` : ''}
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
          onClick={async () => {
            if (await confirmAsk({ title: `Cancel this ${ex.name.toLowerCase()}?`, body: 'Its time will not be saved.', ok: 'Cancel it', danger: true })) void cancelCardio(session.id);
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
          {ms.includes('reps') && <Stepper label="Hard intervals done" value={reps} onChange={(x) => setReps(Math.round(x))} />}
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

