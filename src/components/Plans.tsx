// Exercise plans per place (Renz, 2026-11-18). On Train, right under "Where are you today?":
// the plans saved for the picked place. Tap one to see it, start it, edit, duplicate or delete it.
// "Import" copies a plan from another place (like importing questions in Google Forms): a COPY.

import { useEffect, useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { fmtDay, lastBestText } from '../core/format';
import { iconFor } from '../core/measures';
import { cleanTarget, fmtPlanItem, moveItem, PLAN_DESC_MAX, PLAN_MAX_SETS, PLAN_NAME_MAX, planError, plansAt } from '../core/plans';
import { availableExercises } from '../core/rules';
import type { Beat, Exercise, Location, Measure, Plan, PlanItem, PlanTarget, WorkSet } from '../core/types';
import { deletePlan, duplicatePlan, importPlan, markPlanViewed, savePlan, type PlanDraft } from '../data/repo';
import { db } from '../data/db';
import type { Game } from '../data/useGame';
import { confirmAsk } from './Confirm';
import { HistorySheet } from './ExerciseHistory';
import { MeasureInputs, MeasureSheet, trackLabel } from './SetEditors';
import { Sheet, Stepper } from './ui';

const placeIcon = (l: Location) => (l.kind === 'home' ? '🏠' : l.kind === 'gym' ? '🏋️' : l.kind === 'outdoor' ? '🌳' : '📍');

/** MeasureInputs writes a run's time as durationSec; a plan stores it as seconds. */
function timeKey(ms: Measure[], beat: Beat): 'seconds' | 'durationSec' {
  return ms.includes('distance') && !(beat.kind === 'same' && beat.fixed === 'distance') ? 'durationSec' : 'seconds';
}
const toInputs = (t: PlanTarget, k: 'seconds' | 'durationSec'): Partial<WorkSet> => (k === 'durationSec' ? { ...t, seconds: undefined, durationSec: t.seconds } : { ...t });
const fromInputs = (v: Partial<WorkSet>, k: 'seconds' | 'durationSec'): PlanTarget => cleanTarget({ reps: v.reps, weightKg: v.weightKg, distanceKm: v.distanceKm, seconds: k === 'durationSec' ? v.durationSec : v.seconds });

export function PlansSection({ game, location, onStart, toast }: { game: Game; location: Location | null; onStart: (planId: string) => void; toast: (t: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PlanDraft | null>(null);
  const [importing, setImporting] = useState(false);
  if (!location) return null;
  const plans = plansAt(game.plans, location.id);

  const open = (p: Plan) => {
    const next = openId === p.id ? null : p.id;
    setOpenId(next);
    if (next) void markPlanViewed(p.id);
  };

  return (
    <section className="card stack" aria-label="Exercise plans">
      <div className="row between wrap">
        <h2>
          Plans · {placeIcon(location)} {location.name}
        </h2>
        <div className="row">
          <button className="btn ghost icon-btn" onClick={() => setImporting(true)}>
            ⇩ Import
          </button>
          <button className="btn ghost icon-btn" onClick={() => setEditing({ name: '', description: '', locationId: location.id, items: [] })}>
            + New plan
          </button>
        </div>
      </div>
      {plans.length === 0 && <p className="small muted">No plans here yet. Make one from the exercises you have unlocked, or import one from another place.</p>}
      {plans.map((p) => (
        <div key={p.id} className="stack" style={{ gap: 8 }}>
          <button className={`plan-row ${openId === p.id ? 'on' : ''}`} onClick={() => open(p)} aria-expanded={openId === p.id}>
            <span className="grow stack" style={{ gap: 2 }}>
              <b>{p.name}</b>
              {p.description && <span className="small muted clamp1">{p.description}</span>}
              <span className="tiny muted">
                {p.lastUsedAt ? `Last used ${fmtDay(p.lastUsedAt)}` : 'Not used yet'} · {p.items.length} {p.items.length === 1 ? 'exercise' : 'exercises'}
              </span>
            </span>
            <span aria-hidden className="muted">
              {openId === p.id ? '▴' : '▾'}
            </span>
          </button>
          {openId === p.id && (
            <PlanDetail
              game={game}
              plan={p}
              onStart={() => onStart(p.id)}
              onEdit={() => setEditing({ id: p.id, name: p.name, description: p.description, locationId: p.locationId, items: p.items.map((i) => ({ ...i, target: { ...i.target } })) })}
              onDuplicate={async () => {
                const id = await duplicatePlan(p.id);
                setOpenId(id);
                toast('Plan duplicated. Rename it and change what you like.');
                const copy = await db.plans.get(id);
                if (copy) setEditing({ id, name: copy.name, description: copy.description, locationId: copy.locationId, items: copy.items });
              }}
              onDelete={async () => {
                if (!(await confirmAsk({ title: `Delete "${p.name}"?`, body: 'The plan goes. Your sets, records and sessions stay.', ok: 'Delete', danger: true }))) return;
                await deletePlan(p.id);
                setOpenId(null);
                toast('Plan deleted.');
              }}
            />
          )}
        </div>
      ))}
      {editing && (
        <PlanEditor
          game={game}
          draft={editing}
          onClose={(id) => {
            setEditing(null);
            if (id) setOpenId(id);
          }}
        />
      )}
      {importing && (
        <ImportSheet
          game={game}
          to={location}
          onClose={(id, name) => {
            setImporting(false);
            if (id) {
              setOpenId(id);
              toast(`Imported "${name}" as a copy. Edit it freely: the original stays the same.`);
            }
          }}
        />
      )}
    </section>
  );
}

function PlanDetail({ game, plan, onStart, onEdit, onDuplicate, onDelete }: { game: Game; plan: Plan; onStart: () => void; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const d = game.d!;
  const [hist, setHist] = useState<Exercise | null>(null);
  const active = !!d.active;
  return (
    <section className="plan-detail stack" aria-label={`Plan ${plan.name}`}>
      <div className="stack" style={{ gap: 2 }}>
        <h3>{plan.name}</h3>
        {plan.description && <p className="small">{plan.description}</p>}
        <span className="tiny muted">
          {plan.lastUsedAt ? `Last used ${fmtDay(plan.lastUsedAt, true)}` : 'Not used yet'}
          {plan.lastViewedAt ? ` · Viewed ${fmtDay(plan.lastViewedAt)}` : ''}
        </span>
      </div>
      <ol className="plan-list">
        {plan.items.map((it) => {
          const ex = EXERCISE_BY_ID[it.exerciseId];
          if (!ex) return null;
          const ms = d.measuresOf(ex);
          const ok = d.unlocked.includes(ex.id);
          return (
            <li key={it.exerciseId}>
              <button className="plan-ex" onClick={() => setHist(ex)} aria-label={`${ex.name} history`}>
                <span className="ico" aria-hidden>
                  {iconFor(ms)}
                </span>
                <span className="grow stack" style={{ gap: 2 }}>
                  <b>{ex.name}</b>
                  <span className="small">{fmtPlanItem(it, ms)}</span>
                  <span className="tiny muted num" style={{ textTransform: 'none', letterSpacing: 0 }}>
                    {ok ? lastBestText(ms, d.stats.records.get(ex.id)) : 'Locked again (its unlock data was deleted)'}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button className="btn primary big" onClick={onStart} disabled={active}>
        ▶ Start this plan
      </button>
      {active && <p className="small muted">A session is running. Finish it first.</p>}
      <div className="row">
        <button className="btn ghost grow" onClick={onEdit}>
          ✎ Edit
        </button>
        <button className="btn ghost grow" onClick={onDuplicate}>
          ⧉ Duplicate
        </button>
        <button className="btn danger" onClick={onDelete}>
          Delete
        </button>
      </div>
      {hist && <HistorySheet game={game} ex={hist} onClose={() => setHist(null)} />}
    </section>
  );
}

/** Create or edit a plan: name, description, place, and exercises (sets, target, how to beat). */
export function PlanEditor({ game, draft, onClose }: { game: Game; draft: PlanDraft; onClose: (savedId?: string) => void }) {
  const d = game.d!;
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description);
  const [locationId, setLocationId] = useState(draft.locationId);
  const [items, setItems] = useState<PlanItem[]>(draft.items);
  const [adding, setAdding] = useState(draft.items.length === 0);
  const [measuring, setMeasuring] = useState<Exercise | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loc = game.locations.find((l) => l.id === locationId) ?? null;
  // Only exercises he has unlocked AND the place's equipment allows.
  const doable = availableExercises(d.unlocked, loc?.equipment ?? []);
  const doableIds = new Set(doable.map((e) => e.id));
  const addable = doable.filter((e) => !items.some((i) => i.exerciseId === e.id));
  const dirty = name !== draft.name || description !== draft.description || locationId !== draft.locationId || JSON.stringify(items) !== JSON.stringify(draft.items);

  useEffect(() => setErr(null), [name, locationId, items]);

  const close = async () => {
    if (dirty && !(await confirmAsk({ title: 'Leave without saving?', body: 'Your changes to this plan are lost.', ok: 'Leave', danger: true }))) return;
    onClose();
  };
  const save = async () => {
    const e = planError({ name, locationId, items });
    if (e) return setErr(e);
    if (items.some((i) => !doableIds.has(i.exerciseId))) return setErr(`Some exercises cannot be done at ${loc?.name ?? 'this place'} (equipment or locked). Remove them first.`);
    setBusy(true);
    try {
      const id = await savePlan({ id: draft.id, name, description, locationId, items });
      onClose(id);
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const patch = (i: number, p: Partial<PlanItem>) => setItems((cur) => cur.map((it, j) => (j === i ? { ...it, ...p } : it)));

  return (
    <Sheet onClose={close}>
      <h2>{draft.id ? 'Edit plan' : 'New plan'}</h2>
      <label className="field">
        Name
        <input className="input" value={name} maxLength={PLAN_NAME_MAX} placeholder="e.g. Push day" onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="field">
        Description (optional)
        <textarea className="input" rows={2} value={description} maxLength={PLAN_DESC_MAX} placeholder="e.g. Chest and arms, 30 minutes" onChange={(e) => setDescription(e.target.value)} />
      </label>
      <span className="tiny muted">Place</span>
      <div className="row wrap" role="radiogroup" aria-label="Plan place">
        {game.locations.map((l) => (
          <button key={l.id} role="radio" aria-checked={locationId === l.id} className={`chip ${locationId === l.id ? 'on' : ''}`} onClick={() => setLocationId(l.id)}>
            {placeIcon(l)} {l.name}
          </button>
        ))}
      </div>

      <div className="row between">
        <span className="tiny muted">Exercises ({items.length})</span>
        <span className="tiny muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
          Target 0 = beat your record
        </span>
      </div>
      {items.map((it, i) => {
        const ex = EXERCISE_BY_ID[it.exerciseId];
        if (!ex) return null;
        const ms = d.measuresOf(ex);
        const beat = d.beatOf(ex);
        const k = timeKey(ms, beat);
        const ok = doableIds.has(ex.id);
        return (
          <div key={ex.id} className={`card flat stack plan-item ${ok ? '' : 'warn'}`} aria-label={`Plan exercise ${i + 1}: ${ex.name}`}>
            <div className="row between">
              <b>
                {i + 1}. {iconFor(ms)} {ex.name}
              </b>
              <div className="row" style={{ gap: 4 }}>
                <button className="btn ghost icon-btn" aria-label={`Move ${ex.name} up`} disabled={i === 0} onClick={() => setItems((c) => moveItem(c, i, -1))}>
                  ↑
                </button>
                <button className="btn ghost icon-btn" aria-label={`Move ${ex.name} down`} disabled={i === items.length - 1} onClick={() => setItems((c) => moveItem(c, i, 1))}>
                  ↓
                </button>
                <button className="btn ghost icon-btn" aria-label={`Remove ${ex.name}`} onClick={() => setItems((c) => c.filter((_, j) => j !== i))}>
                  ✕
                </button>
              </div>
            </div>
            {!ok && <span className="small" style={{ color: 'var(--bad)' }}>Not doable at {loc?.name ?? 'this place'}: remove it or pick another place.</span>}
            <Stepper label="Sets" value={it.sets} min={1} onChange={(x) => patch(i, { sets: Math.max(1, Math.min(PLAN_MAX_SETS, Math.round(x))) })} />
            <span className="tiny muted">Target per set</span>
            <MeasureInputs ms={ms} beat={beat} v={toInputs(it.target, k)} onChange={(v) => patch(i, { target: fromInputs(v, k) })} />
            <button className="btn ghost icon-btn" style={{ alignSelf: 'flex-start' }} onClick={() => setMeasuring(ex)}>
              📏 How to beat it: {trackLabel(ms, beat)}
            </button>
          </div>
        );
      })}

      {adding ? (
        <div className="card flat stack">
          <div className="row between">
            <b>Add exercises</b>
            {items.length > 0 && (
              <button className="btn ghost icon-btn" onClick={() => setAdding(false)}>
                Done
              </button>
            )}
          </div>
          <p className="small muted">Only exercises you have unlocked that {loc?.name ?? 'this place'} has the equipment for.</p>
          {addable.length === 0 && <p className="small muted">All of them are in the plan.</p>}
          <div className="row wrap">
            {addable.map((e) => (
              <button key={e.id} className="chip" onClick={() => setItems((c) => [...c, { exerciseId: e.id, sets: 3, target: {} }])}>
                + {e.name}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button className="btn ghost" onClick={() => setAdding(true)}>
          + Add exercise
        </button>
      )}

      {err && <p className="small banner">{err}</p>}
      <div className="row sheet-footer">
        <button className="btn ghost grow" onClick={close}>
          Cancel
        </button>
        <button className="btn primary grow" onClick={save} disabled={busy}>
          Save plan
        </button>
      </div>
      {measuring && <MeasureSheet ex={measuring} current={d.measuresOf(measuring)} beat={d.beatOf(measuring)} onClose={() => setMeasuring(null)} />}
    </Sheet>
  );
}

/** Import: pick a place, then a plan by name. It is copied into `to`. */
function ImportSheet({ game, to, onClose }: { game: Game; to: Location; onClose: (id?: string, name?: string) => void }) {
  const others = game.locations.filter((l) => l.id !== to.id && plansAt(game.plans, l.id).length > 0);
  const [from, setFrom] = useState<string | null>(others[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const list = from ? plansAt(game.plans, from) : [];
  return (
    <Sheet onClose={() => onClose()}>
      <h2>Import a plan into {to.name}</h2>
      <p className="small muted">It is copied. Changing the copy never changes the original.</p>
      {others.length === 0 ? (
        <p className="muted">No other place has plans yet.</p>
      ) : (
        <>
          <span className="tiny muted">1. From which place?</span>
          <div className="row wrap" role="radiogroup" aria-label="Import from place">
            {others.map((l) => (
              <button key={l.id} role="radio" aria-checked={from === l.id} className={`chip ${from === l.id ? 'on' : ''}`} onClick={() => setFrom(l.id)}>
                {placeIcon(l)} {l.name}
              </button>
            ))}
          </div>
          <span className="tiny muted">2. Which plan?</span>
          {list.map((p) => {
            const missing = p.items.filter((i) => !availableExercises(game.d!.unlocked, to.equipment).some((e) => e.id === i.exerciseId)).length;
            return (
              <button
                key={p.id}
                className="plan-row"
                disabled={busy}
                aria-label={`Import ${p.name}`}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const id = await importPlan(p.id, to.id);
                    onClose(id, p.name);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <span className="grow stack" style={{ gap: 2 }}>
                  <b>{p.name}</b>
                  {p.description && <span className="small muted clamp1">{p.description}</span>}
                  <span className="tiny muted">
                    {p.items.length} exercises{missing ? ` · ${missing} not doable at ${to.name} (edit after import)` : ''}
                  </span>
                </span>
                <span className="badge">Import</span>
              </button>
            );
          })}
        </>
      )}
      <button className="btn ghost" onClick={() => onClose()}>
        Close
      </button>
    </Sheet>
  );
}
