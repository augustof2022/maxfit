// Shared editors: how an exercise is measured, and correcting / deleting a logged set.

import { useEffect, useState } from 'react';
import { MEASURES, fmtValues } from '../core/measures';
import type { Exercise, Measure, WorkSet } from '../core/types';
import { deleteSet, setExerciseMeasures, updateSet } from '../data/repo';
import { confirmAsk } from './Confirm';
import { Sheet, Stepper } from './ui';

/** Pick one or more measures for an exercise (Renz, 2026-11-18). */
export function MeasureSheet({ ex, current, onClose }: { ex: Exercise; current: Measure[]; onClose: () => void }) {
  const [pick, setPick] = useState<Measure[]>(current);
  // Time (longer wins) and Faster time are the same number, so picking one drops the other.
  const toggle = (m: Measure) =>
    setPick((p) => {
      if (p.includes(m)) return p.filter((x) => x !== m);
      const other = m === 'time' ? 'speed' : m === 'speed' ? 'time' : null;
      return [...p.filter((x) => x !== other), m];
    });
  const same = pick.length === current.length && pick.every((m) => current.includes(m));
  const save = async () => {
    const ok = await confirmAsk({
      title: `Measure ${ex.name} by ${pick.map((m) => MEASURES.find((x) => x.id === m)!.label.toLowerCase()).join(' + ')}?`,
      body: 'Your records for this exercise are checked again with the new measures. A new record = at least one number up, none down.',
      ok: 'Change',
    });
    if (!ok) return;
    await setExerciseMeasures(ex.id, pick);
    onClose();
  };
  return (
    <Sheet onClose={onClose}>
      <h2>How do you measure {ex.name}?</h2>
      <p className="small muted">Pick one or more. To beat your record, make at least one better and keep the others the same or better. Time = longer wins (a plank, a long run). Faster time = lower wins (a sprint, a 1 km time trial).</p>
      <div className="row wrap" role="group" aria-label="Measures">
        {MEASURES.map((m) => (
          <button key={m.id} className={`chip ${pick.includes(m.id) ? 'on' : ''}`} aria-pressed={pick.includes(m.id)} onClick={() => toggle(m.id)}>
            {m.label} <span className="small">({m.id === 'speed' ? 's, lower wins' : m.unit})</span>
          </button>
        ))}
      </div>
      <p className="tiny muted">Default: {ex.measures.map((m) => MEASURES.find((x) => x.id === m)!.label).join(' + ')}. Unlock goals always use the default.</p>
      <div className="row">
        <button
          className="btn ghost grow"
          onClick={async () => {
            if (!(await confirmAsk({ title: `Measure ${ex.name} the default way again?`, body: 'Your records for this exercise are checked again.', ok: 'Use default' }))) return;
            await setExerciseMeasures(ex.id, []);
            onClose();
          }}
          disabled={current.join() === ex.measures.join()}
        >
          Use default
        </button>
        <button className="btn primary grow" onClick={save} disabled={pick.length === 0 || same}>
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
  return (m[1] ? Number(m[1]) * 60 : 0) + Number(m[2]);
}

/** A time field: type 45, 14.6 or 5:42; +/- buttons; and a stopwatch to time the set itself. */
export function DurationInput({ label, value, onChange, fine }: { label: string; value: number; onChange: (sec: number) => void; fine: boolean }) {
  const [text, setText] = useState(fmtDur(value));
  const [running, setRunning] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (running === null) setText(fmtDur(value));
  }, [value, running]);
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
            if (n !== null) onChange(Math.round(n * 10) / 10);
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
export function MeasureInputs({ ms, v, onChange }: { ms: Measure[]; v: Partial<WorkSet>; onChange: (v: Partial<WorkSet>) => void }) {
  const timeKey: 'seconds' | 'durationSec' = ms.includes('distance') ? 'durationSec' : 'seconds';
  const tm = ms.includes('speed') ? 'speed' : ms.includes('time') ? 'time' : null;
  return (
    <div className="row wrap">
      {ms.includes('weight') && <Stepper label="Weight" unit="kg" value={v.weightKg ?? 0} step={2.5} onChange={(x) => onChange({ ...v, weightKg: x })} />}
      {ms.includes('distance') && <Stepper label="Distance" unit="km" value={v.distanceKm ?? 0} step={0.1} onChange={(x) => onChange({ ...v, distanceKm: x })} />}
      {ms.includes('reps') && <Stepper label="Reps" value={v.reps ?? 0} onChange={(x) => onChange({ ...v, reps: Math.round(x) })} />}
      {tm && <DurationInput label={tm === 'speed' ? 'Time (faster wins)' : 'Time'} fine={tm === 'speed'} value={(timeKey === 'durationSec' ? v.durationSec : v.seconds) ?? 0} onChange={(x) => onChange({ ...v, [timeKey]: tm === 'speed' ? x : Math.round(x) })} />}
    </div>
  );
}

/** Correct or delete one logged set, with "are you sure?". */
export function EditSetSheet({ ex, ms, set, onClose }: { ex: Exercise; ms: Measure[]; set: WorkSet; onClose: () => void }) {
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
      <MeasureInputs ms={shown} v={v} onChange={setV} />
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
