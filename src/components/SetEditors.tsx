// Shared editors: how an exercise is measured, and correcting / deleting a logged set.

import { useEffect, useState } from 'react';
import { defaultBeat, MEASURES, fmtValues } from '../core/measures';
import type { Beat, Exercise, Measure, WorkSet } from '../core/types';
import { deleteSet, setExerciseTrack, updateSet } from '../data/repo';
import { confirmAsk } from './Confirm';
import { Sheet, Stepper } from './ui';

const LABEL = (m: Measure) => MEASURES.find((x) => x.id === m)!.label;
const FIXED: { id: 'weight' | 'distance'; label: string }[] = [
  { id: 'weight', label: 'Same weight' },
  { id: 'distance', label: 'Same distance' },
];
const BEATEN: { id: 'reps' | 'time' | 'speed'; label: string }[] = [
  { id: 'reps', label: 'More reps' },
  { id: 'time', label: 'Longer time' },
  { id: 'speed', label: 'Faster time' },
];

/** "Measured by ..." text for a button. */
export function trackLabel(ms: Measure[], beat: Beat): string {
  if (beat.kind === 'same') return `${beat.fixed === 'weight' ? 'Same weight' : 'Same distance'} → ${BEATEN.find((b) => b.id === beat.beat)!.label.toLowerCase()}`;
  return ms.map(LABEL).join(' + ');
}

/**
 * "How do you beat it?" for one exercise (Renz, 2026-11-18: configurable for every exercise).
 * Mode any: pick the measures; one better, none worse. Mode same: keep weight or distance fixed and beat
 * reps / longer time / faster time; every weight or distance keeps its own record.
 */
export function MeasureSheet({ ex, current, beat, onClose }: { ex: Exercise; current: Measure[]; beat: Beat; onClose: () => void }) {
  const [mode, setMode] = useState<Beat['kind']>(beat.kind);
  const [pick, setPick] = useState<Measure[]>(beat.kind === 'any' ? current : ex.measures);
  const [fixed, setFixed] = useState<'weight' | 'distance'>(beat.kind === 'same' ? beat.fixed : ex.measures.includes('distance') ? 'distance' : 'weight');
  const [beaten, setBeaten] = useState<'reps' | 'time' | 'speed'>(beat.kind === 'same' ? beat.beat : fixed === 'distance' ? 'speed' : 'reps');
  // Time (longer wins) and Faster time are the same number, so picking one drops the other.
  const toggle = (m: Measure) =>
    setPick((p) => {
      if (p.includes(m)) return p.filter((x) => x !== m);
      const other = m === 'time' ? 'speed' : m === 'speed' ? 'time' : null;
      return [...p.filter((x) => x !== other), m];
    });
  const next: Beat = mode === 'same' ? { kind: 'same', fixed, beat: beaten } : { kind: 'any' };
  const unchanged = JSON.stringify(next) === JSON.stringify(beat) && (mode === 'same' || pick.join() === current.join());
  const describe = mode === 'same' ? `${FIXED.find((f) => f.id === fixed)!.label.toLowerCase()}, ${BEATEN.find((b) => b.id === beaten)!.label.toLowerCase()}` : pick.map(LABEL).join(' + ').toLowerCase();
  const save = async () => {
    const ok = await confirmAsk({
      title: `Beat ${ex.name} by ${describe}?`,
      body: 'Your records for this exercise are checked again with the new rule (and the XP of records with them).',
      ok: 'Change',
    });
    if (!ok) return;
    await setExerciseTrack(ex.id, next, mode === 'any' ? pick : []);
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <h2>How do you beat {ex.name}?</h2>
      <div className="seg" role="radiogroup" aria-label="How to beat it">
        <button role="radio" aria-checked={mode === 'any'} className={`chip ${mode === 'any' ? 'on' : ''}`} onClick={() => setMode('any')}>
          Beat any number
        </button>
        <button role="radio" aria-checked={mode === 'same'} className={`chip ${mode === 'same' ? 'on' : ''}`} onClick={() => setMode('same')}>
          Same ___, beat ___
        </button>
      </div>
      {mode === 'any' ? (
        <>
          <p className="small muted">Pick one or more. A record = at least one number better, none worse. Time = longer wins (a plank, a long run). Faster time = lower wins.</p>
          <div className="row wrap" role="group" aria-label="Measures">
            {MEASURES.map((m) => (
              <button key={m.id} className={`chip ${pick.includes(m.id) ? 'on' : ''}`} aria-pressed={pick.includes(m.id)} onClick={() => toggle(m.id)}>
                {m.label} <span className="small">({m.id === 'speed' ? 's, lower wins' : m.unit})</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="small muted">Keep one number the same and beat the other. Every weight (or distance) keeps its own record. A heavier weight than ever is a record too, and starts a new count.</p>
          <div className="seg" role="radiogroup" aria-label="Keep the same">
            {FIXED.map((f) => (
              <button key={f.id} role="radio" aria-checked={fixed === f.id} className={`chip ${fixed === f.id ? 'on' : ''}`} onClick={() => setFixed(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="seg" role="radiogroup" aria-label="Beat">
            {BEATEN.map((b) => (
              <button key={b.id} role="radio" aria-checked={beaten === b.id} className={`chip ${beaten === b.id ? 'on' : ''}`} onClick={() => setBeaten(b.id)}>
                {b.label}
              </button>
            ))}
          </div>
          <p className="small banner">
            Example: {fixed === 'weight' ? '20 kg × 20 last time; today 30 kg × 12 = 🏆 new weight. Next time at 30 kg, beat 12 reps.' : 'Your best 100 m is 15.2 s; beat it at 100 m. A 200 m keeps its own best.'}
          </p>
        </>
      )}
      <p className="tiny muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
        Default for {ex.name}: {trackLabel(ex.measures, defaultBeat(ex))}. Unlock goals always use the default numbers.
      </p>
      <div className="row">
        <button
          className="btn ghost grow"
          onClick={async () => {
            if (!(await confirmAsk({ title: `Beat ${ex.name} the default way again?`, body: 'Your records for this exercise are checked again.', ok: 'Use default' }))) return;
            await setExerciseTrack(ex.id, null, []);
            onClose();
          }}
        >
          Use default
        </button>
        <button className="btn primary grow" onClick={save} disabled={(mode === 'any' && pick.length === 0) || unchanged}>
          Save
        </button>
      </div>
    </Sheet>
  );
}

/** Seconds as "m:ss.t" (tenths only when there are any). */
function fmtDur(sec: number): string {
  const t = Math.max(0, Math.round(sec * 10) / 10);
  const m = Math.floor(t / 60);
  const r = t - m * 60;
  const rs = (Math.round(r * 10) / 10).toFixed(r % 1 ? 1 : 0).padStart(r % 1 ? 4 : 2, '0');
  return m ? `${m}:${rs}` : `${Math.round(r * 10) / 10}`;
}
/** "1:05.3", "65.3" or "65" → seconds. */
function parseDur(text: string): number | null {
  const t = text.trim().replace(',', '.');
  const m = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(t);
  if (!m) return null;
  if (m[1] && Number(m[2]) >= 60) return null; // "1:75" is not a time
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
}

/** A time field: type 45, 14.6 or 5:42; +/- buttons; and a stopwatch to time the set itself. */
export function DurationInput({ label, value, onChange, fine }: { label: string; value: number; onChange: (sec: number) => void; fine: boolean }) {
  const [text, setText] = useState(fmtDur(value));
  const [running, setRunning] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  // Re-format only when the value changed from outside (+/-, stopwatch), not while typing.
  useEffect(() => {
    const typed = parseDur(text);
    if (running === null && typed !== value && !(typed === null && value === 0)) setText(fmtDur(value));
  }, [value, running]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (running === null) return;
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [running]);
  const step = fine ? 0.1 : 5;
  const shown = running !== null ? fmtDur((now - running) / 1000) : text;
  return (
    <label className="field">
      {label} <span className="tiny muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(seconds or m:ss)</span>
      <div className="stepper">
        <button type="button" aria-label={`Less ${label}`} disabled={running !== null} onClick={() => onChange(Math.max(0, Math.round((value - step) * 10) / 10))}>
          -
        </button>
        <input
          className="input num"
          inputMode="decimal"
          value={shown}
          readOnly={running !== null}
          aria-label={label}
          onChange={(e) => {
            setText(e.target.value);
            const n = parseDur(e.target.value);
            // Empty or unreadable = 0, so an empty box can never log the old target by mistake.
            onChange(n === null ? 0 : Math.round(n * 10) / 10);
          }}
        />
        <button type="button" aria-label={`More ${label}`} disabled={running !== null} onClick={() => onChange(Math.round((value + step) * 10) / 10)}>
          +
        </button>
        <button
          type="button"
          className={`watch ${running !== null ? 'on' : ''}`}
          aria-label={running !== null ? 'Stop the stopwatch' : 'Start the stopwatch'}
          onClick={() => {
            if (running === null) {
              setNow(Date.now());
              setRunning(Date.now());
            } else {
              onChange(Math.round(((Date.now() - running) / 1000) * 10) / 10);
              setRunning(null);
            }
          }}
        >
          {running !== null ? '■' : '⏱'}
        </button>
      </div>
    </label>
  );
}

/** Inputs for a set, one per measure. Values are kept in a WorkSet-shaped object. */
export function MeasureInputs({ ms, v, onChange, beat }: { ms: Measure[]; v: Partial<WorkSet>; onChange: (v: Partial<WorkSet>) => void; beat?: Beat }) {
  // A fixed distance (sprint) is typed in meters and its time is a plain timed effort, not a cardio duration.
  const meters = beat?.kind === 'same' && beat.fixed === 'distance';
  const timeKey: 'seconds' | 'durationSec' = ms.includes('distance') && !meters ? 'durationSec' : 'seconds';
  const tm = ms.includes('speed') ? 'speed' : ms.includes('time') ? 'time' : null;
  return (
    <div className="row wrap">
      {ms.includes('weight') && <Stepper label="Weight" unit="kg" value={v.weightKg ?? 0} step={2.5} onChange={(x) => onChange({ ...v, weightKg: x })} />}
      {ms.includes('distance') &&
        (meters ? (
          <Stepper label="Distance" unit="m" value={Math.round((v.distanceKm ?? 0) * 1000)} step={50} onChange={(x) => onChange({ ...v, distanceKm: Math.round(x) / 1000 })} />
        ) : (
          <Stepper label="Distance" unit="km" value={v.distanceKm ?? 0} step={0.1} onChange={(x) => onChange({ ...v, distanceKm: x })} />
        ))}
      {ms.includes('reps') && <Stepper label="Reps" value={v.reps ?? 0} onChange={(x) => onChange({ ...v, reps: Math.round(x) })} />}
      {tm && <DurationInput label={tm === 'speed' ? 'Time (faster wins)' : 'Time'} fine={tm === 'speed'} value={(timeKey === 'durationSec' ? v.durationSec : v.seconds) ?? 0} onChange={(x) => onChange({ ...v, [timeKey]: tm === 'speed' ? x : Math.round(x) })} />}
    </div>
  );
}

/** Correct or delete one logged set, with "are you sure?". */
export function EditSetSheet({ ex, ms, beat, set, onClose }: { ex: Exercise; ms: Measure[]; beat: Beat; set: WorkSet; onClose: () => void }) {
  // Show every measure the set has a number for, plus the ones tracked now.
  const shown = MEASURES.map((m) => m.id).filter((m) => ms.includes(m) || (m === 'weight' && set.weightKg) || (m === 'reps' && set.reps) || (m === 'distance' && set.distanceKm) || (m === 'time' && !ms.includes('speed') && (set.seconds || set.durationSec)));
  const [v, setV] = useState<Partial<WorkSet>>({ reps: set.reps, seconds: set.seconds, weightKg: set.weightKg, distanceKm: set.distanceKm, durationSec: set.durationSec });
  const save = async () => {
    if (!(await confirmAsk({ title: 'Save this correction?', body: `${ex.name}: ${fmtValues(shown, set)} → ${fmtValues(shown, v)}. Records and XP are checked again.`, ok: 'Save' }))) return;
    await updateSet(set.id, { reps: v.reps, seconds: v.seconds, weightKg: v.weightKg, distanceKm: v.distanceKm, durationSec: v.durationSec });
    onClose();
  };
  const remove = async () => {
    if (!(await confirmAsk({ title: 'Delete this set?', body: `${ex.name}: ${fmtValues(shown, set)}. Its XP is removed. If it was the record that unlocked something, that unlock locks again.`, ok: 'Delete', danger: true }))) return;
    await deleteSet(set.id);
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <h2>Edit set · {ex.name}</h2>
      <p className="small muted">{new Date(set.at).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
      <MeasureInputs ms={shown} v={v} onChange={setV} beat={beat} />
      <div className="row">
        <button className="btn danger" onClick={remove}>
          Delete
        </button>
        <button className="btn ghost grow" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary grow" onClick={save}>
          Save
        </button>
      </div>
    </Sheet>
  );
}
