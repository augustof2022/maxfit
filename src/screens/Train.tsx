import { useEffect, useRef, useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { knownEquipment } from '../core/equipment';
import { PlaceEditor } from '../components/PlaceEditor';
import { cardioTotals, fmtClock, inMode, totals, activeSeconds } from '../core/live';
import { fmtPace, fmtTarget, GOAL_TARGETS, goalFor, nextTarget, starterPlan, suggestedPlan, type ExRecord } from '../core/rules';
import { fmtRecord, fmtSet, lastBestText } from '../core/format';
import { fmtPlanItem, hasTarget } from '../core/plans';
import { PlansSection } from '../components/Plans';
import { HistorySheet } from '../components/ExerciseHistory';
import { Activity, AlarmClock, CirclePlay, ExIcon, Footprints, Pause, Pencil, PersonStanding, PlaceIcon, Play, Plus, Ruler, Square, Timer, TrendingUp } from '../components/Icon';
import { TimerOverlay } from '../components/TimerOverlay';
import { ExerciseDemo } from '../components/ExerciseDemo';
import { fmtLevel, fmtValues, isCardioFlow, levelOf } from '../core/measures';
import type { Beat, Exercise, Goal, LiveMode, Measure, PlanItem, Session, Settings, WorkSet } from '../core/types';
import { cancelCardio, discardSession, finishCardio, finishSession, logSet, restartRest, setMode, startCardio, startSession, updateProfile, type SessionSummary } from '../data/repo';
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
    <div className="chips wrap" role="radiogroup" aria-label="Where are you training?">
      {game.locations.map((l) => (
        <button key={l.id} role="radio" aria-checked={value === l.id} className={`chip ${value === l.id ? 'on' : ''}`} onClick={() => onPick(l.id)}>
          <PlaceIcon kind={l.kind} /> {l.name}
        </button>
      ))}
      <button className="chip" onClick={() => setAdding(true)} aria-label="New place">
        <Plus size={18} aria-hidden /> Place
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

/**
 * Train before a session (round 5, Renz): only two things. Where are you today, and your plans there.
 * No workout without a plan: every place has a default "Starter plan" he can edit, rename or delete.
 */
function PreSession({ game, toast }: Props) {
  const d = game.d!;
  const [busy, setBusy] = useState(false);
  const loc = d.location;
  const eq = knownEquipment(loc?.equipment ?? [], game.customEquipment);

  const start = async (planId: string) => {
    if (busy) return;
    setBusy(true);
    primeAudio();
    try {
      await startSession(loc?.id ?? null, planId);
      void keepAwake(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack screen">
      <div className="screen-head">
        <h1>Train</h1>
      </div>
      <section className="group" aria-label="Where are you today?">
        <div className="group-head">
          <h2>Where are you today?</h2>
        </div>
        <LocationPicker game={game} value={loc?.id ?? null} onPick={(id) => updateProfile({ lastLocationId: id })} />
        <p className="small faint">
          {eq.length ? `${eq.length} equipment ${eq.length === 1 ? 'item' : 'items'} here` : 'Bodyweight only here'} · {d.available.length} exercises you can do. Edit places in Settings.
        </p>
      </section>

      <PlansSection game={game} location={loc} toast={toast} onStart={(id) => void start(id)} />
    </div>
  );
}

export { fmtRecord, fmtSet } from '../core/format';

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
  // Started from a saved plan: show only its exercises, in its order ("Show all exercises here" for the rest).
  const myPlan = session.planId ? game.plans.find((x) => x.id === session.planId) : undefined;
  const [showAll, setShowAll] = useState(false);
  const planItems = (myPlan?.items ?? []).filter((it) => d.unlocked.includes(it.exerciseId) && EXERCISE_BY_ID[it.exerciseId]);
  const planIds = new Set(planItems.map((it) => it.exerciseId));
  const others = ordered.filter((e) => !planIds.has(e.id));
  const [hist, setHist] = useState<Exercise | null>(null);

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

  // Auto work / rest (Renz, 2026-11-18): Start set / the timer = working; Stop / Log = resting.
  // The timer's Stop starts the rest; the Log right after it keeps that rest. Any other Log while the rest
  // clock runs (a set done without Start set) starts a fresh rest and re-arms the alarm.
  // Which exercise's timer started the rest now running (only its own Log keeps that rest).
  const restFromTimer = useRef<string | null>(null);
  const goRest = async (timerExercise: string | null = null, loggedExercise: string | null = null) => {
    primeAudio();
    if (timerExercise) {
      restFromTimer.current = timerExercise;
      await setMode(session.id, 'rest');
    } else if (session.live?.mode === 'rest' && loggedExercise && restFromTimer.current === loggedExercise) {
      restFromTimer.current = null;
      return;
    } else {
      restFromTimer.current = null;
      await restartRest(session.id);
    }
    void scheduleRestAlarm(limit);
  };
  const goWork = async () => {
    primeAudio();
    restFromTimer.current = null;
    await setMode(session.id, 'exercise');
    void cancelRestAlarm();
  };

  const onLogged = async (msg: string, exerciseId: string) => {
    toast(msg);
    await goRest(null, exerciseId);
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

  function renderCard(e: Exercise, planItem?: PlanItem) {
    return (
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
        inPlan={!myPlan && plan.includes(e.id)}
        planItem={planItem}
        mode={live.mode}
        settings={p.settings}
        onToggle={() => setOpen(open === e.id ? null : e.id)}
        onHistory={() => setHist(e)}
        onWork={goWork}
        onRest={() => goRest(e.id)}
        session={session}
        onLogged={onLogged}
      />
    );
  }

  // The avatar trains with you: it does the move of the open exercise, runs or walks in cardio, breathes at rest.
  const avAction: AvatarAction = live.cardio ? (live.mode === 'walk' ? 'walk' : live.mode === 'run' ? 'run' : 'idle') : live.mode === 'rest' ? 'idle' : actionFor(open);
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';

  return (
    <div className="stack screen">
      <header className="session-head">
        <Avatar stage={d.stage} gear={d.gear} color={color} size={64} style={p.avatarStyle} gender={p.gender} action={avAction} />
        <div className="grow">
          <h1 className="clamp1" style={{ fontSize: 'var(--fs-lg)' }}>{myPlan ? myPlan.name : 'Session'}</h1>
          <span className="small faint">{game.locations.find((l) => l.id === session.locationId)?.name ?? 'Anywhere'}</span>
          <div className="clock" aria-label="Session time">{fmtClock(t.exercise + t.rest + t.run + t.walk)}</div>
        </div>
        <div className="session-times">
          <span>
            <i className="dot" style={{ background: 'var(--accent)' }} />
            Active {fmtClock(activeSeconds(t))}
          </span>
          <span>
            <i className="dot" style={{ background: 'var(--rest)' }} />
            Rest {fmtClock(t.rest)}
          </span>
          <span className="faint">
            {sessionSets.length} {sessionSets.length === 1 ? 'set' : 'sets'}
          </span>
        </div>
      </header>

      {live.cardio ? (
        <CardioPanel session={session} game={game} now={now} toast={toast} />
      ) : live.mode === 'rest' ? (
        <div className={`mode-card ${over ? 'over' : 'rest'}`} aria-live="polite">
          <span className="mode-label">
            {over ? <AlarmClock size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
            {over ? 'Rest is over. Back to work!' : 'Resting'}
          </span>
          <div className="clock">
            {fmtClock(restFor)} <span className="faint" style={{ fontSize: 'var(--fs-lg)' }}>/ {fmtClock(limit)}</span>
          </div>
          <p className="small muted">Tap Back to work (bottom right) or Start set when you go again.</p>
        </div>
      ) : (
        <div className="mode-card work">
          <span className="mode-label">
            <Activity size={18} aria-hidden /> Working
          </span>
          <p className="small muted">Log a set below. The rest timer starts by itself.</p>
          <button className="btn rest big" onClick={() => void goRest()}>
            <Pause size={20} aria-hidden /> Start rest
          </button>
        </div>
      )}

      {!live.cardio && myPlan && (
        <section className="group" aria-label="Plan exercises">
          <div className="group-head">
            <h2>Exercises</h2>
            <span className="small faint">{planItems.length} in this plan</span>
          </div>
          {planItems.length === 0 && <p className="small muted">This plan has no exercises you can do now.</p>}
          {planItems.map((it) => {
            const e = EXERCISE_BY_ID[it.exerciseId];
            return renderCard(e, it);
          })}
          <button className="btn secondary" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
            {showAll ? 'Hide other exercises' : `Show all exercises here (${others.length} more)`}
          </button>
        </section>
      )}
      {!live.cardio && (!myPlan || showAll) && (
        <section className="group" aria-label="Exercises">
          {myPlan && (
            <div className="group-head">
              <h2>Other exercises here</h2>
            </div>
          )}
          {(myPlan ? others : ordered).map((e) => renderCard(e))}
        </section>
      )}
      {hist && <HistorySheet game={game} ex={hist} onClose={() => setHist(null)} />}

      {live.mode === 'rest' && !live.cardio && (
        <button className={`fab-work ${over ? 'over' : ''}`} onClick={goWork} aria-label="Back to work">
          <span className="fab-ico" aria-hidden>
            <Play size={22} fill="currentColor" />
          </span>
          <span className="stack" style={{ gap: 0, alignItems: 'flex-start' }}>
            <b>Back to work</b>
            <span className="small num">Rest {fmtClock(restFor)}</span>
          </span>
        </button>
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
      {/* Room at the bottom so the floating Back to work never covers Finish / Discard. */}
      {live.mode === 'rest' && !live.cardio && <div className="fab-space" aria-hidden />}

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

interface CardProps {
  ex: Exercise;
  ms: Measure[];
  beat: Beat;
  goals: Goal[];
  known: (id: string) => boolean;
  rec: ExRecord | undefined;
  sets: WorkSet[];
  open: boolean;
  inPlan: boolean;
  /** Set when the session runs from a saved plan: its sets and target for this exercise. */
  planItem?: PlanItem;
  mode: LiveMode;
  settings: Settings;
  onToggle: () => void;
  onHistory: () => void;
  onWork: () => Promise<void>;
  onRest: () => Promise<void>;
  session: Session;
  onLogged: (m: string, exerciseId: string) => void;
}

function ExerciseCard({ ex, ms, beat, goals, known, rec, sets, open, inPlan, planItem, mode, settings, onToggle, onHistory, onWork, onRest, session, onLogged }: CardProps) {
  const baseTarget = nextTarget(ex, rec, ms, goals, beat);
  const planTarget = planItem && hasTarget(planItem.target) ? planItem.target : null;
  const [timing, setTiming] = useState(false);
  const goal = goalFor(ex, goals);
  // The goal rep range drives targets only for weighted moves, so show it only there.
  const gt = goal && ms.includes('weight') ? GOAL_TARGETS[goal] : null;
  const [demo, setDemo] = useState(false);
  // The plan's own target (when set) goes in the boxes; else the number to beat.
  const fromTarget = (): Partial<WorkSet> => ({ reps: baseTarget.reps, seconds: baseTarget.seconds, weightKg: baseTarget.weightKg, distanceKm: baseTarget.distanceKm, ...(planTarget ?? {}) });
  const [v, setV] = useState<Partial<WorkSet>>(fromTarget);
  // Same-weight / same-distance: the record and the number to beat follow the weight or distance typed now.
  const typedLevel = levelOf(beat, v);
  const target = beat.kind === 'same' && typedLevel !== null ? nextTarget(ex, rec, ms, goals, beat, typedLevel) : baseTarget;
  const levelBest = beat.kind === 'same' && typedLevel !== null ? rec?.levels.get(typedLevel) : rec?.bestSet;
  // When the user changes the weight / distance, put that level's number to beat in the box.
  const prevLevel = useRef(typedLevel);
  useEffect(() => {
    if (beat.kind !== 'same' || prevLevel.current === typedLevel) return;
    prevLevel.current = typedLevel;
    setV((cur) => (beat.beat === 'reps' ? { ...cur, reps: target.reps ?? cur.reps } : { ...cur, seconds: target.seconds ?? cur.seconds }));
  }, [typedLevel]); // eslint-disable-line react-hooks/exhaustive-deps
  const [measuring, setMeasuring] = useState(false);
  const [editing, setEditing] = useState<WorkSet | null>(null);
  const [glow, setGlow] = useState(false);

  // Keep inputs on the new target after a record is beaten or the measures change.
  useEffect(() => {
    setV(fromTarget());
  }, [rec?.bestSet?.id, ms.join(), JSON.stringify(beat)]); // eslint-disable-line react-hooks/exhaustive-deps

  const last = rec?.last;
  const cardio = isCardioFlow(ms, beat);
  // Timed exercises (a plank, a sprint) get the full-screen timer; rep exercises get a big Start set.
  const timed = !cardio && (ms.includes('time') || ms.includes('speed'));
  const fasterWins = ms.includes('speed');
  const beatenValue = beat.kind === 'same' ? (beat.beat === 'reps' ? v.reps : v.seconds) ?? 0 : 0;
  const sameOk = beat.kind !== 'same' || (beatenValue > 0 && (beat.fixed !== 'distance' || (v.distanceKm ?? 0) > 0));
  const canLog = sameOk && ms.some((m) => ((m === 'reps' ? v.reps : m === 'time' || m === 'speed' ? v.seconds : m === 'weight' ? v.weightKg : v.distanceKm) ?? 0) > 0);
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
    onLogged(r.newWeight ? `🏆 NEW WEIGHT! ${ex.name}: ${fmtValues(ms, r.set)}` : r.isPR ? `🏆 NEW RECORD! ${ex.name}: ${fmtValues(ms, r.set)}` : `Set logged: ${fmtValues(ms, r.set)}`, ex.id);
  };

  return (
    <div className={`card ex-card ${open ? 'open' : ''} ${inPlan ? 'in-plan' : ''} ${glow ? 'glow-pr' : ''}`}>
      <button className="ex" onClick={onToggle} aria-expanded={open}>
        <ExIcon ms={ms} exerciseId={ex.id} />
        <span className="meta">
          <b>
            {ex.name} {inPlan && <span className="badge accent">plan</span>}
          </b>
          <span className="small muted num">{lastBestText(ms, rec)}</span>
          {planItem && (
            <>
              <span className="small plan-line">
                Plan: {fmtPlanItem(planItem, ms)}
                {sets.length >= planItem.sets ? ' · done ✓' : ` · set ${sets.length + 1} of ${planItem.sets}`}
              </span>
            </>
          )}
        </span>
        <span className="badge num">{sets.length} done</span>
      </button>

      {open && (
        <div className="ex-body">
          <div className="beat">
            <div>
              <span className="tiny">Last</span>
              <b className="num">{last ? fmtValues(ms, last, true) : '-'}</b>
            </div>
            <div>
              <span className="tiny">{beat.kind === 'same' && typedLevel !== null ? `Record ${fmtLevel(beat, typedLevel).replace(/^(at|over) /, '')}` : 'Record'}</span>
              <b className="num">{levelBest ? fmtValues(beat.kind === 'same' ? [beat.beat] : ms, levelBest, true) : beat.kind === 'same' ? 'new' : '-'}</b>
            </div>
            <div className="target">
              <span className="tiny" style={{ color: 'var(--accent)' }}>Beat this</span>
              <b className="num">{fmtTarget(ms, target)}</b>
            </div>
          </div>
          <p className="small muted">{target.label}</p>
          {gt && (
            <p className="small goal-line">
              🎯 {gt.label}: {gt.low}–{gt.high} reps × {gt.sets} sets, rest {gt.restSec} s
            </p>
          )}
          <p className="small muted">{ex.cue}</p>
          <div className="row wrap" style={{ gap: 'var(--s2)' }}>
            <button className="btn secondary sm" onClick={() => setDemo(true)}>
              <CirclePlay size={18} aria-hidden /> How to do it
            </button>
            <button className="btn secondary sm" onClick={() => setMeasuring(true)}>
              <Ruler size={18} aria-hidden /> {trackLabel(ms, beat)}
            </button>
            <button className="btn secondary sm" onClick={onHistory}>
              <TrendingUp size={18} aria-hidden /> History
            </button>
          </div>

          {cardio ? (
            <button className="btn primary big" onClick={() => startCardio(session.id, ex.id)}>
              Start {ex.name.toLowerCase()}
            </button>
          ) : (
            <>
              {timed ? (
                <button className="btn outline big start-set" onClick={() => setTiming(true)}>
                  <Timer size={22} aria-hidden /> Start timer
                </button>
              ) : mode === 'exercise' ? (
                <div className="working-pill" role="status">
                  <Activity size={20} aria-hidden /> Set in progress. Log it when you finish.
                </div>
              ) : (
                <button className="btn outline big start-set" onClick={() => void onWork()}>
                  <Play size={20} aria-hidden /> Start set
                </button>
              )}
              <MeasureInputs ms={ms} v={v} onChange={setV} beat={beat} />
              <button className="btn primary big" onClick={log} disabled={!canLog}>
                Log set + rest
              </button>
            </>
          )}

          {sets.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              {sets.map((s, i) => (
                <div key={s.id} className="set-row">
                  <span>
                    Set {i + 1}: {fmtSet(ms, s)} {s.isPR && <span className="badge pr">PR</span>}
                  </span>
                  <button className="btn ghost icon-btn" onClick={() => setEditing(s)} aria-label={`Edit set ${i + 1}`}>
                    <Pencil size={16} aria-hidden /> Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {timing && (
        <TimerOverlay
          name={ex.name}
          targetSec={target.seconds}
          fasterWins={fasterWins}
          sound={settings.sound}
          vibrate={settings.vibrate}
          onGo={() => void onWork()}
          onStop={(sec) => {
            // Stop fills the time (still editable before Log) and starts the rest.
            setV((cur) => ({ ...cur, seconds: sec }));
            setTiming(false);
            void onRest();
          }}
          onCancel={() => setTiming(false)}
        />
      )}
      {measuring && <MeasureSheet ex={ex} current={ms} beat={beat} onClose={() => setMeasuring(false)} />}
      {demo && <ExerciseDemo ex={ex} known={known} onClose={() => setDemo(false)} />}
      {editing && <EditSetSheet ex={ex} ms={ms} beat={beat} set={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

const CARDIO_MODES: { mode: LiveMode; label: string; cls: string }[] = [
  { mode: 'run', label: 'Run', cls: 'primary' },
  { mode: 'walk', label: 'Walk', cls: 'good' },
  { mode: 'rest', label: 'Rest', cls: 'rest' },
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
      <span className="mode-label">
        <Footprints size={18} aria-hidden /> {ex.name}
      </span>
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
            {m.mode === 'run' ? <Footprints size={20} aria-hidden /> : m.mode === 'walk' ? <PersonStanding size={20} aria-hidden /> : <Pause size={20} aria-hidden />} {m.label}
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
          <Square size={18} fill="currentColor" aria-hidden /> Stop
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

