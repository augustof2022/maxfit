import { useMemo, useState } from 'react';
import { CATEGORIES, PRESETS, knownEquipment, libraryOf } from '../core/equipment';
import { EXERCISES } from '../core/exercises';
import { fitsEquipment } from '../core/rules';
import type { EquipmentCategory, EquipmentItem, Location } from '../core/types';
import { addEquipment, deleteLocation, saveLocation } from '../data/repo';
import { confirmAsk } from './Confirm';
import { Sheet } from './ui';
import { Check, Ico, PlaceIcon, Plus, Search, Star } from './Icon';

interface Props {
  loc: Partial<Location>;
  customEquipment: EquipmentItem[];
  unlocked: string[];
  canDelete: boolean;
  onClose: (savedId?: string) => void;
}

/**
 * Add or edit a place: type its name, pick what equipment is there from the library
 * (grouped, searchable, quick-fill), or add new equipment to the library.
 */
export function PlaceEditor({ loc, customEquipment, unlocked, canDelete, onClose }: Props) {
  const [name, setName] = useState(loc.name ?? '');
  const [kind, setKind] = useState<Location['kind']>(loc.kind ?? 'gym');
  const [eq, setEq] = useState<string[]>(() => knownEquipment(loc.equipment ?? [], customEquipment));
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<EquipmentCategory>('machines');
  const [busy, setBusy] = useState(false);

  const library = useMemo(() => libraryOf(customEquipment), [customEquipment]);
  const q = query.trim().toLowerCase();
  const shown = q ? library.filter((e) => e.name.toLowerCase().includes(q)) : library;
  const toggle = (id: string) => setEq(eq.includes(id) ? eq.filter((x) => x !== id) : [...eq, id]);

  // Live preview: what this equipment lets you train.
  const doable = EXERCISES.filter((e) => e.tier > 0 && fitsEquipment(e, eq));
  const doableNow = doable.filter((e) => unlocked.includes(e.id));

  const addNew = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const id = await addEquipment(newName, newCat);
      setEq((cur) => (cur.includes(id) ? cur : [...cur, id]));
      setNewName('');
      setAdding(false);
      setQuery('');
    } finally {
      setBusy(false);
    }
  };

  // Quick-fill: "Bodyweight only" clears (after asking); the others ADD to what is picked.
  const quickFill = async (preset: (typeof PRESETS)[number]) => {
    if (preset.equipment.length === 0) {
      if (eq.length === 0 || (await confirmAsk({ title: 'Clear all equipment for this place?', ok: 'Clear', danger: true }))) setEq([]);
      return;
    }
    setEq((cur) => [...new Set([...cur, ...preset.equipment])]);
  };

  const save = async () => {
    if (busy) return;
    if (loc.id && !(await confirmAsk({ title: `Save changes to "${name.trim()}"?`, body: 'Only exercises you can do with this equipment will show here.', ok: 'Save' }))) return;
    setBusy(true);
    try {
      const id = await saveLocation({ id: loc.id, name: name.trim(), kind, equipment: eq });
      onClose(id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet onClose={() => onClose()}>
      <h2>{loc.id ? 'Edit place' : 'New place'}</h2>
      <label className="field">
        Name of the place
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anytime Fitness Cubao, Office gym, Home" autoFocus={!loc.id} maxLength={40} />
      </label>
      <span className="field-label">Type of place</span>
      <div className="chips wrap" role="radiogroup" aria-label="Type of place">
        {(['home', 'gym', 'outdoor', 'other'] as const).map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
            <PlaceIcon kind={k} size={16} />
            {k === 'home' ? 'Home' : k === 'gym' ? 'Gym' : k === 'outdoor' ? 'Outdoor' : 'Other'}
          </button>
        ))}
      </div>

      <div className="group-head" style={{ marginTop: 'var(--s3)' }}>
        <h3>Equipment here</h3>
        <span className="badge num">{eq.length} selected</span>
      </div>
      <span className="field-label">Quick fill</span>
      <div className="chips" aria-label="Quick fill">
        {PRESETS.map((p) => (
          <button key={p.id} className="chip" onClick={() => quickFill(p)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="search">
        <Ico as={Search} size={18} />
        <input className="input" type="search" placeholder="Search equipment…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search equipment" />
      </div>

      {CATEGORIES.map((c) => {
        const items = shown.filter((e) => e.category === c.id);
        if (!items.length) return null;
        return (
          <div key={c.id} className="stack" style={{ gap: 6 }}>
            <span className="cat-head">{c.name}</span>
            <div className="chips wrap" style={{ gap: 6 }}>
              {items.map((e) => (
                <button key={e.id} className={`chip ${eq.includes(e.id) ? 'on' : ''}`} aria-pressed={eq.includes(e.id)} onClick={() => toggle(e.id)}>
                  {eq.includes(e.id) && (
                    <>
                      <Ico as={Check} size={14} />
                    </>
                  )}
                  {e.name}
                  {e.custom && (
                    <>
                      <Ico as={Star} size={14} />
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {q && shown.length === 0 && <p className="note">"{query}" is not in the library yet.</p>}

      {adding ? (
        <div className="card flat stack">
          <h3>Add equipment to your library</h3>
          <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Hip abductor machine" maxLength={40} aria-label="New equipment name" autoFocus />
          <select className="input" value={newCat} onChange={(e) => setNewCat(e.target.value as EquipmentCategory)} aria-label="Category">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="row">
            <button className="btn secondary grow" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn primary grow" disabled={!newName.trim() || busy} onClick={addNew}>
              Add + select
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn secondary"
          onClick={() => {
            setNewName(query);
            setAdding(true);
          }}
        >
          <Ico as={Plus} size={18} />
          Add new equipment{query ? ` "${query}"` : ''}
        </button>
      )}

      <p className="note num">
        With this equipment: <b style={{ color: 'var(--text)' }}>{doable.length}</b> MaxFit exercises, <b style={{ color: 'var(--text)' }}>{doableNow.length}</b> unlocked now.
        {eq.some((id) => id.startsWith('custom-')) && ' The star marks your own items (saved in your library; no built-in exercise uses them yet).'}
      </p>

      <div className="row sheet-footer">
        {loc.id && canDelete && (
          <button
            className="btn danger"
            onClick={async () => {
              if (!(await confirmAsk({ title: `Delete the place "${loc.name}"?`, body: 'Your sessions stay.', ok: 'Delete', danger: true }))) return;
              await deleteLocation(loc.id!);
              onClose();
            }}
          >
            Delete
          </button>
        )}
        <button className="btn secondary grow" onClick={() => onClose()}>
          Cancel
        </button>
        <button className="btn primary grow" disabled={!name.trim() || busy} onClick={save}>
          Save place
        </button>
      </div>
    </Sheet>
  );
}
