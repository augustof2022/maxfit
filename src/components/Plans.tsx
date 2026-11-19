// Exercise plans per place (Renz, 2026-11-18; round 5 redesign). Train shows "My plans at <place>":
// each row has the name, description, number of exercises, last used, and Start. Tapping a row opens the
// plan (its exercises, and an obvious Edit). Editing happens on a full page: name, description, place,
// the exercises (configure, reorder, remove) and the exercise picker to add more. Import copies a plan
// from another place (a COPY); Duplicate copies it in the same place. No workout without a plan.

import { useEffect, useRef, useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { fmtDay, lastBestText } from '../core/format';
import { fmtPlanItem, moveItem, PLAN_DESC_MAX, PLAN_NAME_MAX, planError, plansAt } from '../core/plans';
import { availableExercises } from '../core/rules';
import type { Exercise, Location, Plan, PlanItem } from '../core/types';
import { db } from '../data/db';
import { deletePlan, duplicatePlan, importPlan, markPlanViewed, savePlan, startSession, type PlanDraft } from '../data/repo';
import type { Game } from '../data/useGame';
import { confirmAsk } from './Confirm';
import { HistorySheet } from './ExerciseHistory';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Copy, Download, ExIcon, Pencil, Play, Plus, PlaceIcon, Trash2, X } from './Icon';
import { ConfigSheet, ExercisePicker } from './Picker';
import { Sheet } from './ui';

export function PlansSection({ game, location, onStart, toast }: { game: Game; location: Location | null; onStart: (planId: string) => void; toast: (t: string) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState<PlanDraft | null>(null);
  const [importing, setImporting] = useState(false);
  if (!location) return null;
  const plans = plansAt(game.plans, location.id, game.planUsed);

  const open = (p: Plan) => {
    const next = openId === p.id ? null : p.id;
    setOpenId(next);
    if (next) void markPlanViewed(p.id);
  };
  const edit = (p: Plan) => setEditing({ id: p.id, name: p.name, description: p.description, locationId: p.locationId, items: p.items.map((i) => ({ ...i, target: { ...i.target } })) });

  return (
    <section className="group" aria-label="My plans">
      <div className="group-head">
        <h2>My plans at {location.name}</h2>
        <button className="btn secondary sm" onClick={() => setEditing({ name: '', description: '', locationId: location.id, items: [] })}>
          <Plus size={18} aria-hidden /> New plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="list empty">
          <p>No plans here yet. Every workout starts from a plan: pick the exercises once, then just tap Start.</p>
          <div className="row">
            <button className="btn primary" onClick={() => setEditing({ name: '', description: '', locationId: location.id, items: [] })}>
              <Plus size={18} aria-hidden /> New plan
            </button>
            <button className="btn secondary" onClick={() => setImporting(true)}>
              <Download size={18} aria-hidden /> Import
            </button>
          </div>
        </div>
      ) : (
        <div className="list">
          {plans.map((p) => {
            const used = game.planUsed.get(p.id);
            const isOpen = openId === p.id;
            return (
              <div key={p.id} className={`plan-wrap ${isOpen ? 'open' : ''}`}>
                <div className="row" style={{ gap: 0, paddingRight: 'var(--s3)' }}>
                  <button className={`plan-row ${isOpen ? 'on' : ''}`} onClick={() => open(p)} aria-expanded={isOpen} aria-label={`${p.name}, ${p.items.length} exercises`}>
                    <span className="meta">
                      <b>{p.name}</b>
                      {p.description && !isOpen && <span className="sub clamp1">{p.description}</span>}
                      <span className="small faint num">
                        {p.items.length} {p.items.length === 1 ? 'exercise' : 'exercises'} · {used ? `last used ${fmtDay(used)}` : 'not used yet'}
                      </span>
                    </span>
                    {isOpen ? <ChevronUp size={20} className="chev" aria-hidden /> : <ChevronDown size={20} className="chev" aria-hidden />}
                  </button>
                  <button className="btn primary sm" onClick={() => onStart(p.id)} aria-label={`Start ${p.name}`}>
                    <Play size={16} aria-hidden /> Start
                  </button>
                </div>
                {isOpen && (
                  <PlanDetail
                    game={game}
                    plan={p}
                    onEdit={() => edit(p)}
                    onDuplicate={async () => {
                      const id = await duplicatePlan(p.id).catch((e: Error) => {
                        toast(e.message);
                        return null;
                      });
                      if (!id) return;
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
            );
          })}
        </div>
      )}
      {plans.length > 0 && (
        <button className="btn quiet" style={{ alignSelf: 'flex-start' }} onClick={() => setImporting(true)}>
          <Download size={18} aria-hidden /> Import a plan from another place
        </button>
      )}

      {editing && (
        <PlanEditor
          game={game}
          draft={editing}
          onClose={(id) => {
            setEditing(null);
            if (id) {
              setOpenId(id);
              toast('Plan saved.');
            }
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

/** An open plan: what is in it, when it was used, and the actions. Editing is one obvious button. */
function PlanDetail({ game, plan, onEdit, onDuplicate, onDelete }: { game: Game; plan: Plan; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const d = game.d!;
  const [hist, setHist] = useState<Exercise | null>(null);
  const used = game.planUsed.get(plan.id);
  const viewed = game.planViewed.get(plan.id);
  return (
    <section className="plan-detail" aria-label={`Plan ${plan.name}`}>
      {plan.description && <p className="small">{plan.description}</p>}
      <span className="small faint">
        {used ? `Last used ${fmtDay(used, true)}` : 'Not used yet'}
        {viewed ? ` · viewed ${fmtDay(viewed)}` : ''}
      </span>
      <ol className="plan-list">
        {plan.items.map((it) => {
          const ex = EXERCISE_BY_ID[it.exerciseId];
          if (!ex) return null;
          const ms = d.measuresOf(ex);
          const ok = d.unlocked.includes(ex.id);
          return (
            <li key={it.exerciseId}>
              <button className="plan-ex" onClick={() => setHist(ex)} aria-label={`${ex.name} history`}>
                <ExIcon ms={ms} exerciseId={ex.id} size="sm" />
                <span className="meta">
                  <b>{ex.name}</b>
                  <span className="sub">{fmtPlanItem(it, ms)}</span>
                  <span className="small faint num">{ok ? lastBestText(ms, d.stats.records.get(ex.id)) : 'Locked again (its unlock data was deleted)'}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <button className="btn secondary big" onClick={onEdit}>
        <Pencil size={18} aria-hidden /> Edit plan
      </button>
      <div className="row">
        <button className="btn secondary grow" onClick={onDuplicate}>
          <Copy size={18} aria-hidden /> Duplicate
        </button>
        <button className="btn danger grow" onClick={onDelete}>
          <Trash2 size={18} aria-hidden /> Delete
        </button>
      </div>
      {hist && <HistorySheet game={game} ex={hist} onClose={() => setHist(null)} />}
    </section>
  );
}

/**
 * Create or edit a plan on a full page: details, the exercises in it (configure, reorder, remove), and the
 * picker to add more. Only exercises he has unlocked and the place's equipment allows can be added.
 */
export function PlanEditor({ game, draft, onClose }: { game: Game; draft: PlanDraft; onClose: (savedId?: string) => void }) {
  const d = game.d!;
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description);
  const [locationId, setLocationId] = useState(draft.locationId);
  const [items, setItems] = useState<PlanItem[]>(draft.items);
  const [configuring, setConfiguring] = useState<number | null>(null);
  const [showDesc, setShowDesc] = useState(!!draft.description);
  // "In this plan" is a summary bar that opens the reorder / remove list (the list below is for adding).
  const [review, setReview] = useState(false);
  const summaryRef = useRef<HTMLButtonElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loc = game.locations.find((l) => l.id === locationId) ?? null;
  const doableIds = new Set(availableExercises(d.unlocked, loc?.equipment ?? []).map((e) => e.id));
  const dirty = name !== draft.name || description !== draft.description || locationId !== draft.locationId || JSON.stringify(items) !== JSON.stringify(draft.items);
  const isNew = !draft.id;
  const invalid = items.filter((i) => !doableIds.has(i.exerciseId)).length;
  const nameRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  // Focus moves into the page (its title), so a screen reader and the keyboard start here.
  useEffect(() => titleRef.current?.focus(), []);

  useEffect(() => setErr(null), [name, locationId, items]);
  // The page is a dialog: lock the app behind it from scrolling.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const close = async () => {
    if (dirty && !(await confirmAsk({ title: 'Leave without saving?', body: 'Your changes to this plan are lost. (A "How to beat it" change is already saved for that exercise.)', ok: 'Leave', danger: true }))) return;
    onClose();
  };
  const save = async () => {
    const finalName = name.trim() || (isNew && items.length ? 'My plan' : '');
    const e = planError({ name: finalName, locationId, items });
    if (e) {
      setErr(e);
      if (!finalName) nameRef.current?.focus();
      return;
    }
    if (items.some((i) => !doableIds.has(i.exerciseId))) {
      setReview(true);
      return setErr(`Some exercises cannot be done at ${loc?.name ?? 'this place'} (equipment or locked). Remove them first.`);
    }
    setBusy(true);
    try {
      onClose(await savePlan({ id: draft.id, name: finalName, description, locationId, items }));
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const editing = configuring !== null ? items[configuring] : null;

  return (
    <div className="page" role="dialog" aria-modal="true" aria-label={isNew ? 'New plan' : 'Edit plan'}>
      <header className="page-head">
        <button className="btn icon secondary" onClick={close} aria-label="Close">
          <X size={20} aria-hidden />
        </button>
        <h1 ref={titleRef} tabIndex={-1}>
          {isNew ? 'New plan' : 'Edit plan'}
        </h1>
      </header>
      {/* Compact top so the exercise list starts on the first screen (Chief of Staff review, round 5). */}
      <div className="page-body editor-body">
        <section className="editor-details" aria-label="Plan details">
          <input ref={nameRef} className="input" value={name} maxLength={PLAN_NAME_MAX} placeholder="Plan name, e.g. Push day" aria-label="Plan name" onChange={(e) => setName(e.target.value)} />
          {showDesc ? (
            <textarea className="input" rows={2} value={description} maxLength={PLAN_DESC_MAX} placeholder="e.g. Chest and arms, 30 minutes" aria-label="Description" onChange={(e) => setDescription(e.target.value)} autoFocus={!description} />
          ) : null}
          <div className="row" style={{ gap: 'var(--s2)' }}>
            <div className="chips grow" role="radiogroup" aria-label="Plan place">
              {game.locations.map((l) => (
                <button key={l.id} role="radio" aria-checked={locationId === l.id} className={`chip ${locationId === l.id ? 'on' : ''}`} onClick={() => setLocationId(l.id)}>
                  <PlaceIcon kind={l.kind} /> {l.name}
                </button>
              ))}
            </div>
            {!showDesc && (
              <button className="btn quiet" style={{ flex: 'none' }} onClick={() => setShowDesc(true)}>
                <Plus size={16} aria-hidden /> Description
              </button>
            )}
          </div>
        </section>

        <section className="editor-summary" aria-label="Exercises in this plan">
          <button ref={summaryRef} className="summary-bar" onClick={() => setReview(!review)} aria-expanded={review} disabled={items.length === 0}>
            <span className="grow">
              {items.length === 0 ? 'No exercises yet: tap + Add below' : `${items.length} added`}
              {invalid > 0 && <span style={{ color: 'var(--bad)' }}> · {invalid} not doable here</span>}
            </span>
            {items.length > 0 && (
              <span className="summary-act">
                Review {review ? <ChevronUp size={18} aria-hidden /> : <ChevronDown size={18} aria-hidden />}
              </span>
            )}
          </button>
          {review && items.length > 0 && (
            <ol className="list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((it, i) => {
                const ex = EXERCISE_BY_ID[it.exerciseId];
                if (!ex) return null;
                const ms = d.measuresOf(ex);
                const ok = doableIds.has(ex.id);
                return (
                  <li key={ex.id} className={`plan-item ${ok ? '' : 'warn'}`} aria-label={`Plan exercise ${i + 1}: ${ex.name}`}>
                    <button className="linkish grow" style={{ minWidth: 0 }} onClick={() => setConfiguring(i)} aria-label={`Configure ${ex.name}`}>
                      <ExIcon ms={ms} exerciseId={ex.id} size="sm" />
                      <span className="meta">
                        <b>{ex.name}</b>
                        <span className="sub">{ok ? fmtPlanItem(it, ms) : `Not doable at ${loc?.name ?? 'this place'}`}</span>
                      </span>
                    </button>
                    <div className="row" style={{ gap: 2 }}>
                      <button className="btn icon secondary" aria-label={`Move ${ex.name} up`} disabled={i === 0} onClick={() => setItems((c) => moveItem(c, i, -1))}>
                        <ArrowUp size={18} aria-hidden />
                      </button>
                      <button className="btn icon secondary" aria-label={`Move ${ex.name} down`} disabled={i === items.length - 1} onClick={() => setItems((c) => moveItem(c, i, 1))}>
                        <ArrowDown size={18} aria-hidden />
                      </button>
                      <button className="btn icon secondary" aria-label={`Remove ${ex.name}`} onClick={() => {
                          // Removing the last one closes the list: keep focus on the summary bar, not lost on the page.
                          if (items.length === 1) summaryRef.current?.focus();
                          setItems((c) => c.filter((_, j) => j !== i));
                        }}>
                        <Trash2 size={18} aria-hidden />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {review && items.length > 0 && <span className="small faint">Tap an exercise to change its sets, target or how to beat it.</span>}
        </section>

        <section aria-label="Add exercises">
          <ExercisePicker game={game} locationId={locationId} added={new Set(items.map((i) => i.exerciseId))} onAdd={(it) => setItems((c) => (c.some((x) => x.exerciseId === it.exerciseId) ? c : [...c, it]))} />
        </section>
      </div>
      <footer className="page-foot" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        {err && (
          <p className="small banner" role="alert">
            {err}
          </p>
        )}
        <button className="btn primary big" onClick={save} disabled={busy}>
          Save plan{items.length ? ` (${items.length} ${items.length === 1 ? 'exercise' : 'exercises'})` : ''}
        </button>
      </footer>
      {editing && configuring !== null && EXERCISE_BY_ID[editing.exerciseId] && (
        <ConfigSheet
          game={game}
          ex={EXERCISE_BY_ID[editing.exerciseId]}
          item={editing}
          okLabel="Save"
          onClose={(next) => {
            const at = configuring;
            setConfiguring(null);
            if (next) setItems((c) => c.map((x, j) => (j === at ? next : x)));
          }}
        />
      )}
    </div>
  );
}

/** Import: pick a place, then a plan by name. It is copied into `to`. */
function ImportSheet({ game, to, onClose }: { game: Game; to: Location; onClose: (id?: string, name?: string) => void }) {
  const others = game.locations.filter((l) => l.id !== to.id && plansAt(game.plans, l.id).length > 0);
  // Plans of a place that was deleted stay importable (code review 2026-11-18).
  const orphans = game.plans.filter((p) => !game.locations.some((l) => l.id === p.locationId));
  const GONE = '__deleted_places__';
  const [from, setFrom] = useState<string | null>(others[0]?.id ?? (orphans.length ? GONE : null));
  const [busy, setBusy] = useState(false);
  const list = from === GONE ? orphans : from ? plansAt(game.plans, from, game.planUsed) : [];
  const doable = new Set(availableExercises(game.d!.unlocked, to.equipment).map((e) => e.id));
  return (
    <Sheet onClose={() => onClose()}>
      <h2>Import a plan into {to.name}</h2>
      <p className="small muted">It is copied. Changing the copy never changes the original.</p>
      {others.length === 0 && orphans.length === 0 ? (
        <p className="muted">No other place has plans yet.</p>
      ) : (
        <>
          <span className="tiny">From which place?</span>
          <div className="chips" role="radiogroup" aria-label="Import from place">
            {others.map((l) => (
              <button key={l.id} role="radio" aria-checked={from === l.id} className={`chip ${from === l.id ? 'on' : ''}`} onClick={() => setFrom(l.id)}>
                <PlaceIcon kind={l.kind} /> {l.name}
              </button>
            ))}
            {orphans.length > 0 && (
              <button role="radio" aria-checked={from === GONE} className={`chip ${from === GONE ? 'on' : ''}`} onClick={() => setFrom(GONE)}>
                <Trash2 size={16} aria-hidden /> Deleted places
              </button>
            )}
          </div>
          <span className="tiny">Which plan?</span>
          <div className="list">
            {list.map((p) => {
              const missing = p.items.filter((i) => !doable.has(i.exerciseId)).length;
              return (
                <button
                  key={p.id}
                  className="row-item"
                  disabled={busy}
                  aria-label={`Import ${p.name}`}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      onClose(await importPlan(p.id, to.id), p.name);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <span className="meta">
                    <b>{p.name}</b>
                    {p.description && <span className="sub clamp1">{p.description}</span>}
                    <span className="small faint">
                      {p.items.length} exercises{missing ? ` · ${missing} not doable at ${to.name} (edit after import)` : ''}
                    </span>
                  </span>
                  <span className="badge accent">
                    <Download size={14} aria-hidden /> Import
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
      <button className="btn secondary" onClick={() => onClose()}>
        Close
      </button>
    </Sheet>
  );
}

/**
 * Start a workout from Home (round 5, Chief of Staff: no workout without a plan). Lists the plans at the
 * current place, last used first, each with Start. No plan-less start exists anywhere.
 */
export function StartPlanSheet({ game, onStarted, onTrain, onClose }: { game: Game; onStarted: () => void; onTrain: () => void; onClose: () => void }) {
  const d = game.d!;
  const loc = d.location;
  const plans = plansAt(game.plans, loc?.id ?? null, game.planUsed);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const start = async (id: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await startSession(loc?.id ?? null, id);
      onStarted();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet onClose={onClose}>
      <h2>Start a plan{loc ? ` at ${loc.name}` : ''}</h2>
      {plans.length === 0 ? (
        <p className="muted">No plans here yet. Make one in Train: pick the exercises once, then just tap Start.</p>
      ) : (
        <div className="list">
          {plans.map((p) => {
            const used = game.planUsed.get(p.id);
            return (
              <div key={p.id} className="row-item">
                <span className="meta">
                  <b>{p.name}</b>
                  <span className="small faint num">
                    {p.items.length} {p.items.length === 1 ? 'exercise' : 'exercises'} · {used ? `last used ${fmtDay(used)}` : 'not used yet'}
                  </span>
                </span>
                <button className="btn primary sm" onClick={() => void start(p.id)} disabled={busy} aria-label={`Start ${p.name}`}>
                  <Play size={16} aria-hidden /> Start
                </button>
              </div>
            );
          })}
        </div>
      )}
      {err && (
        <p className="small banner" role="alert">
          {err}
        </p>
      )}
      <button className="btn secondary" onClick={onTrain}>
        {plans.length ? 'Change place or edit plans' : 'Go to Train'}
      </button>
    </Sheet>
  );
}
