// Exercise picker for plans (Renz, 2026-11-18, round 5). A row list, not chips: each row has the name,
// body parts, a one-line description, "Watch the steps", my last, and the number to beat, then "+ Add".
// "+ Add" opens a sheet to set sets, target and "How to beat it"; confirming returns to the list with the
// search and filters kept, and the row shows "Added", so he can keep browsing and adding.
// Only exercises he has unlocked AND can do with this place's equipment are listed.

import { useMemo, useState } from 'react';
import { fmtDay } from '../core/format';
import { fmtValues, measuresFor } from '../core/measures';
import { areaChips, AREA_LABEL, bodyParts, filterExercises, type PickerArea, type PickerKit } from '../core/picker';
import { cleanTarget, PLAN_MAX_SETS } from '../core/plans';
import { availableExercises, fmtTarget, nextTarget } from '../core/rules';
import type { Beat, Exercise, Measure, PlanItem, PlanTarget, WorkSet } from '../core/types';
import { setExerciseTrack } from '../data/repo';
import type { Game } from '../data/useGame';
import { confirmAsk } from './Confirm';
import { ExerciseDemo } from './ExerciseDemo';
import { Check, CirclePlay, ExIcon, Plus, Search, X } from './Icon';
import { MeasureInputs } from './SetEditors';
import { Sheet, Stepper } from './ui';

/** MeasureInputs writes a run's time as durationSec; a plan keeps it as seconds. */
function timeKey(ms: Measure[], beat: Beat): 'seconds' | 'durationSec' {
  return ms.includes('distance') && !(beat.kind === 'same' && beat.fixed === 'distance') ? 'durationSec' : 'seconds';
}
const toInputs = (t: PlanTarget, k: 'seconds' | 'durationSec'): Partial<WorkSet> => (k === 'durationSec' ? { ...t, seconds: undefined, durationSec: t.seconds } : { ...t });
const fromInputs = (v: Partial<WorkSet>, k: 'seconds' | 'durationSec'): PlanTarget => cleanTarget({ reps: v.reps, weightKg: v.weightKg, distanceKm: v.distanceKm, seconds: k === 'durationSec' ? v.durationSec : v.seconds });

/** The ways to beat this exercise that make sense for it (same weight needs a weight, same distance a distance). */
function beatOptions(ex: Exercise): { id: string; label: string; beat: Beat }[] {
  const out: { id: string; label: string; beat: Beat }[] = [{ id: 'any', label: 'Beat any number', beat: { kind: 'any' } }];
  if (ex.measures.includes('weight')) out.push({ id: 'weight', label: 'Same weight, more reps', beat: { kind: 'same', fixed: 'weight', beat: 'reps' } });
  if (ex.measures.includes('distance')) out.push({ id: 'distance', label: 'Same distance, faster', beat: { kind: 'same', fixed: 'distance', beat: 'speed' } });
  return out;
}
const beatId = (b: Beat) => (b.kind === 'any' ? 'any' : b.fixed);

/** "Last 6 reps (Nov 18) · Best 16 reps" and the number to beat, for a picker row. */
function numbersFor(game: Game, ex: Exercise) {
  const d = game.d!;
  const ms = d.measuresOf(ex);
  const beat = d.beatOf(ex);
  const rec = d.stats.records.get(ex.id);
  const shownMs = beat.kind === 'same' ? [beat.fixed, beat.beat] : ms;
  return {
    last: rec?.last ? `${fmtValues(shownMs, rec.last)} (${fmtDay(rec.last.at)})` : null,
    best: rec?.bestSet ? fmtValues(shownMs, rec.bestSet) : null,
    beatTo: rec?.bestSet ? fmtTarget(ms, nextTarget(ex, rec, ms, game.profile!.goals ?? [], beat)) : null,
  };
}

export function ExercisePicker({ game, locationId, added, onAdd }: { game: Game; locationId: string; added: Set<string>; onAdd: (item: PlanItem) => void }) {
  const d = game.d!;
  const loc = game.locations.find((l) => l.id === locationId) ?? null;
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<PickerArea>('all');
  const [kit, setKit] = useState<PickerKit>('any');
  const [configuring, setConfiguring] = useState<Exercise | null>(null);
  const [demo, setDemo] = useState<Exercise | null>(null);
  const doable = useMemo(() => availableExercises(d.unlocked, loc?.equipment ?? []), [d.unlocked, loc?.equipment]);
  const chips = areaChips(doable);
  const list = filterExercises(doable, { query, area, kit });
  const filtered = query !== '' || area !== 'all' || kit !== 'any';

  return (
    <div className="stack" style={{ gap: 0 }}>
      <div className="picker-filters" role="search" aria-label="Find exercises">
        <label className="search">
          <Search size={18} aria-hidden />
          <input className="input" type="search" value={query} placeholder="Search exercises" aria-label="Search exercises" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className="chips" role="radiogroup" aria-label="Body part">
          {chips.map((c) => (
            <button key={c} role="radio" aria-checked={area === c} className={`chip ${area === c ? 'on' : ''}`} onClick={() => setArea(c)}>
              {c === 'all' ? 'All' : AREA_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="seg" role="radiogroup" aria-label="Equipment">
          {(
            [
              ['any', 'Any'],
              ['bodyweight', 'Bodyweight'],
              ['equipment', 'Equipment'],
            ] as const
          ).map(([k, label]) => (
            <button key={k} role="radio" aria-checked={kit === k} className={kit === k ? 'on' : ''} onClick={() => setKit(k)}>
              {label}
            </button>
          ))}
        </div>
        <span className="small faint">
          {list.length} of {doable.length} exercises you can do{loc ? ` at ${loc.name}` : ''}
        </span>
      </div>

      {list.length === 0 ? (
        <div className="empty list" role="status">
          <p>No exercise matches these filters.</p>
          {filtered && (
            <button
              className="btn secondary"
              onClick={() => {
                setQuery('');
                setArea('all');
                setKit('any');
              }}
            >
              <X size={18} aria-hidden /> Clear filters
            </button>
          )}
        </div>
      ) : (
        <ul className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Exercises to add">
          {list.map((ex) => {
            const n = numbersFor(game, ex);
            const isAdded = added.has(ex.id);
            return (
              <li key={ex.id} className={`pick-row ${isAdded ? 'added' : ''}`} aria-label={ex.name}>
                <div className="top">
                  <ExIcon ms={d.measuresOf(ex)} exerciseId={ex.id} />
                  <div className="grow stack" style={{ gap: 2 }}>
                    <span className="name">{ex.name}</span>
                    <span className="parts">{bodyParts(ex)}{ex.equipment.length ? '' : ' · Bodyweight'}</span>
                  </div>
                </div>
                <p className="cue clamp2">{ex.cue}</p>
                <div className="numbers">
                  {n.last ? <span>Last {n.last}</span> : <span className="faint">Not done yet</span>}
                  {n.best && <span>Best {n.best}</span>}
                  {n.beatTo && <span className="beat-to">→ Beat: {n.beatTo}</span>}
                </div>
                <div className="actions">
                  <button className="btn quiet" onClick={() => setDemo(ex)} aria-label={`Watch the steps: ${ex.name}`}>
                    <CirclePlay size={18} aria-hidden /> Watch the steps
                  </button>
                  {isAdded ? (
                    <span className="added-mark" role="status" aria-label={`${ex.name} added`}>
                      <Check size={18} aria-hidden /> Added
                    </span>
                  ) : (
                    <button className="btn primary sm" onClick={() => setConfiguring(ex)} aria-label={`Add ${ex.name}`}>
                      <Plus size={18} aria-hidden /> Add
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {configuring && (
        <ConfigSheet
          game={game}
          ex={configuring}
          okLabel="Add to plan"
          onClose={(item) => {
            setConfiguring(null);
            if (item) onAdd(item);
          }}
        />
      )}
      {demo && <ExerciseDemo ex={demo} known={(id) => d.unlocked.includes(id)} onClose={() => setDemo(null)} />}
    </div>
  );
}

/**
 * Set up one exercise in a plan: sets, the target per set and how to beat it.
 * "How to beat it" is the exercise's own setting (records are kept per exercise), so it applies
 * everywhere; changing it re-checks his records (asked first when he has any).
 */
export function ConfigSheet({ game, ex, item, okLabel, onClose }: { game: Game; ex: Exercise; item?: PlanItem; okLabel: string; onClose: (item?: PlanItem) => void }) {
  const d = game.d!;
  const p = game.profile!;
  const rec = d.stats.records.get(ex.id);
  const currentBeat = d.beatOf(ex);
  const options = beatOptions(ex);
  const [choice, setChoice] = useState(options.some((o) => o.id === beatId(currentBeat)) ? beatId(currentBeat) : 'any');
  const beat = options.find((o) => o.id === choice)!.beat;
  const beatChanged = beatId(beat) !== beatId(currentBeat);
  // In "any" mode keep his own measures (or the default); in "same" mode the fixed + beaten pair.
  const msFor = (b: Beat): Measure[] => (b.kind === 'same' ? measuresFor(ex, null, b) : currentBeat.kind === 'any' ? d.measuresOf(ex) : ex.measures);
  const ms = msFor(beat);
  const k = timeKey(ms, beat);
  /** The number to beat for this way of beating it (a fresh start when the way changes). */
  const suggestFor = (b: Beat): PlanTarget => {
    const t = nextTarget(ex, beatId(b) !== beatId(currentBeat) ? undefined : rec, msFor(b), p.goals ?? [], b);
    return cleanTarget({ reps: t.reps, seconds: t.seconds, weightKg: t.weightKg, distanceKm: t.distanceKm });
  };
  const suggested = () => suggestFor(beat);
  const [sets, setSets] = useState(item?.sets ?? (ms.includes('distance') ? 1 : 3));
  const [target, setTarget] = useState<PlanTarget>(item?.target ?? suggested());
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    if (beatChanged) {
      if (rec && !(await confirmAsk({ title: `Beat ${ex.name} a new way?`, body: `"${options.find((o) => o.id === choice)!.label}" applies to ${ex.name} everywhere. Your records for it are checked again.`, ok: 'Change' }))) return;
      setBusy(true);
      // "Beat any number" is stored with its measures, so it never falls back to a lift's default (same weight).
      await setExerciseTrack(ex.id, beat, beat.kind === 'any' ? ms : []);
    }
    onClose({ exerciseId: ex.id, sets: Math.max(1, Math.min(PLAN_MAX_SETS, Math.round(sets))), target: cleanTarget(target) });
  };

  return (
    <Sheet onClose={() => onClose()}>
      <div className="row">
        <ExIcon ms={ms} exerciseId={ex.id} />
        <div className="grow">
          <h2>{ex.name}</h2>
          <span className="small faint">{bodyParts(ex)}</span>
        </div>
      </div>
      <Stepper label="Sets" value={sets} min={1} onChange={(x) => setSets(Math.max(1, Math.min(PLAN_MAX_SETS, Math.round(x))))} />
      <div className="stack" style={{ gap: 6 }}>
        <span className="tiny">Target per set</span>
        <MeasureInputs ms={ms} beat={beat} v={toInputs(target, k)} onChange={(v) => setTarget(fromInputs(v, k))} />
        {rec?.bestSet && <span className="small faint">Your best: {fmtValues(beat.kind === 'same' ? [beat.fixed, beat.beat] : ms, rec.bestSet)}. Leave 0 to aim for your record +1 each time.</span>}
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="tiny">How to beat it</span>
        <div className="seg" role="radiogroup" aria-label="How to beat it">
          {options.map((o) => (
            <button
              key={o.id}
              role="radio"
              aria-checked={choice === o.id}
              className={choice === o.id ? 'on' : ''}
              onClick={() => {
                setChoice(o.id);
                setTarget(suggestFor(o.beat));
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        {beatChanged && <span className="small faint">Applies to {ex.name} everywhere; your records are checked again.</span>}
      </div>
      <div className="row sheet-footer">
        <button className="btn secondary grow" onClick={() => onClose()}>
          Cancel
        </button>
        <button className="btn primary grow" onClick={confirm} disabled={busy}>
          {okLabel}
        </button>
      </div>
    </Sheet>
  );
}

