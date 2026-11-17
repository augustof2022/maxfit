import { useMemo, useState } from 'react';
import { CATEGORIES, PRESETS, libraryOf } from '../core/equipment';
import { EXERCISES } from '../core/exercises';
import { fitsEquipment } from '../core/rules';
import type { EquipmentCategory, EquipmentItem, Location } from '../core/types';
import { addEquipment, deleteLocation, saveLocation } from '../data/repo';
import { Sheet } from './ui';

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
  const [eq, setEq] = useState<string[]>(loc.equipment ?? []);
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
    const id = await addEquipment(newName, newCat);
    setEq((cur) => (cur.includes(id) ? cur : [...cur, id]));
    setNewName('');
    setAdding(false);
    setQuery('');
  };

  const save = async () => {
    if (busy) return;
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
      <div className="row wrap" role="radiogroup" aria-label="Type of place">
        {(['home', 'gym', 'outdoor', 'other'] as const).map((k) => (
          <button key={k} role="radio" aria-checked={kind === k} className={`chip ${kind === k ? 'on' : ''}`} onClick={() => setKind(k)}>
            {k === 'home' ? '🏠 Home' : k === 'gym' ? '🏋️ Gym' : k === 'outdoor' ? '🌳 Outdoor' : '📍 Other'}
          </button>
        ))}
      </div>

      <div className="row between">
        <h3>Equipment here</h3>
        <span className="badge num">{eq.length} selected</span>
      </div>
      <div className="row wrap" aria-label="Quick fill">
        {PRESETS.map((p) => (
          <button key={p.id} className="chip" onClick={() => setEq([...p.equipment])}>
            {p.name}
          </button>
        ))}
      </div>
      <input className="input" type="search" placeholder="Search equipment…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search equipment" />

      {CATEGORIES.map((c) => {
        const items = shown.filter((e) => e.category === c.id);
        if (!items.length) return null;
        return (
          <div key={c.id} className="stack" style={{ gap: 6 }}>
            <span className="tiny muted">{c.name}</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {items.map((e) => (
                <button key={e.id} className={`chip ${eq.includes(e.id) ? 'on' : ''}`} aria-pressed={eq.includes(e.id)} onClick={() => toggle(e.id)}>
                  {eq.includes(e.id) ? '✓ ' : ''}
                  {e.name}
                  {e.custom ? ' ★' : ''}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {q && shown.length === 0 && <p className="small muted">"{query}" is not in the library yet.</p>}

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
            <button className="btn ghost grow" onClick={() => setAdding(false)}>
              Cancel
            </button>
            <button className="btn primary grow" disabled={!newName.trim()} onClick={addNew}>
              Add + select
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn ghost"
          onClick={() => {
            setNewName(query);
            setAdding(true);
          }}
        >
          + Add new equipment{query ? ` "${query}"` : ''}
        </button>
      )}

      <p className="small banner">
        With this equipment: <b>{doable.length}</b> MaxFit exercises, <b>{doableNow.length}</b> unlocked now.
        {eq.some((id) => id.startsWith('custom-')) && ' ★ = your own item (saved in your library; no built-in exercise uses it yet).'}
      </p>

      <div className="row sheet-footer">
        {loc.id && canDelete && (
          <button
            className="btn danger"
            onClick={async () => {
              if (!confirm(`Delete the place "${loc.name}"? Your sessions stay.`)) return;
              await deleteLocation(loc.id!);
              onClose();
            }}
          >
            Delete
          </button>
        )}
        <button className="btn ghost grow" onClick={() => onClose()}>
          Cancel
        </button>
        <button className="btn primary grow" disabled={!name.trim() || busy} onClick={save}>
          Save place
        </button>
      </div>
    </Sheet>
  );
}
