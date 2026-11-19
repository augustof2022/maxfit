import { useEffect, useState } from 'react';
import { IconBtn, LineChart, reducedMotion, Sheet, Stepper } from '../components/ui';
import { confirmAsk } from '../components/Confirm';
import { PhotoJournal } from '../components/PhotoJournal';
import { Ico, Pencil } from '../components/Icon';
import { bmi, bmiCategory, dayKey } from '../core/rules';
import type { WeightEntry } from '../core/types';
import { addWeight, deleteWeight, updateProfile, updateWeight } from '../data/repo';
import type { Game } from '../data/useGame';

const CAT_COLOR: Record<string, string> = { Underweight: 'var(--rest)', Normal: 'var(--good)', Overweight: 'var(--gold)', Obese: 'var(--bad)' };

export function Body({ game }: { game: Game }) {
  const p = game.profile!;
  const ws = game.weights;
  const last = ws[ws.length - 1];
  const [kg, setKg] = useState(last?.kg ?? 70);
  const [date, setDate] = useState(dayKey(Date.now()));
  const [height, setHeight] = useState(p.heightCm ?? 0);
  const b = last && p.heightCm ? bmi(last.kg, p.heightCm) : null;
  const first = ws[0];
  const [editing, setEditing] = useState<WeightEntry | null>(null);

  const save = async () => {
    const v = Math.round(kg * 10) / 10;
    const existing = ws.find((w) => w.date === date);
    if (existing && !(await confirmAsk({ title: `Replace ${date}?`, body: `That day already has ${existing.kg} kg. Replace it with ${v} kg?`, ok: 'Replace' }))) return;
    await addWeight(date, v);
  };

  const cat = b ? bmiCategory(b) : null;
  const change = first && last && first.id !== last.id ? Math.round((last.kg - first.kg) * 10) / 10 : null;

  return (
    <div className="stack screen">
      <header className="screen-head">
        <h1>Body</h1>
      </header>

      <section className="card stack" aria-label="BMI">
        <div className="body-stats">
          <div className="stat">
            <span>Weight</span>
            <b className="num">{last ? last.kg : '-'}{last && <small>kg</small>}</b>
          </div>
          <div className="stat">
            <span>BMI</span>
            <b className="num" style={{ color: cat ? CAT_COLOR[cat] : undefined }}>
              {b ?? '-'}
            </b>
            {cat && (
              <span className="cat" style={{ color: CAT_COLOR[cat] }}>
                {cat}
              </span>
            )}
          </div>
        </div>
        {b && <BmiScale value={b} />}
        {change !== null && (
          <p className="note num">
            Since {first!.date}: {change > 0 ? '+' : ''}
            {change} kg
          </p>
        )}
        {!p.heightCm && <p className="note" style={{ color: 'var(--gold)' }}>Set your height below to see your BMI.</p>}
        <p className="note faint">BMI = kg ÷ (height in m)². WHO adult ranges. A rough guide: it does not tell muscle from fat.</p>
      </section>

      <section className="group" aria-label="Log weight">
        <div className="group-head">
          <h2>Log weight</h2>
        </div>
        <div className="card stack">
          <Stepper label="Weight" unit="kg" value={kg} step={0.1} onChange={setKg} />
          <label className="field">
            Date
            <input className="input" type="date" value={date} max={dayKey(Date.now())} onChange={(e) => setDate(e.target.value)} />
          </label>
          <button className="btn primary" disabled={kg <= 0} onClick={save}>
            Save weight
          </button>
        </div>
      </section>

      <section className="group" aria-label="Trend">
        <div className="group-head">
          <h2>Trend</h2>
          {ws.length > 1 && <span className="small muted">Last {Math.min(30, ws.length)} weigh-ins</span>}
        </div>
        <div className="card">
          <LineChart points={ws.slice(-30).map((w) => ({ label: w.date.slice(5), v: w.kg }))} unit="kg" />
        </div>
      </section>

      <section className="group" aria-label="Height">
        <div className="group-head">
          <h2>Height</h2>
          {p.heightCm ? <span className="small muted num">Saved: {p.heightCm} cm</span> : null}
        </div>
        <div className="card stack">
          <Stepper label="Height" unit="cm" value={height} step={1} onChange={setHeight} />
          <button
            className="btn secondary"
            disabled={height < 100 || height > 250 || height === p.heightCm}
            onClick={async () => {
              if (p.heightCm && !(await confirmAsk({ title: 'Change your height?', body: `${p.heightCm} cm → ${height} cm. All BMI numbers use the new height.`, ok: 'Change' }))) return;
              await updateProfile({ heightCm: height });
            }}
          >
            Save height
          </button>
        </div>
      </section>

      <section className="group" aria-label="Weight log">
        <div className="group-head">
          <h2>Log</h2>
          {ws.length > 0 && <span className="small muted num">{ws.length}</span>}
        </div>
        <div className="list">
          {ws.length === 0 && <p className="empty">No weigh-ins yet. Log one above: same time of day (morning is easiest) gives the fairest trend.</p>}
          {[...ws].reverse().map((w) => (
            <div key={w.id} className="row-item weigh-row">
              <span className="meta">
                <b>{w.kg} kg</b>
                <span className="sub num">
                  {w.date}
                  {p.heightCm ? ` · BMI ${bmi(w.kg, p.heightCm)}` : ''}
                </span>
              </span>
              <IconBtn label={`Edit ${w.date}`} onClick={() => setEditing(w)}>
                <Ico as={Pencil} size={18} />
              </IconBtn>
            </div>
          ))}
        </div>
      </section>

      <PhotoJournal game={game} />

      {editing && <EditWeightSheet w={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditWeightSheet({ w, onClose }: { w: WeightEntry; onClose: () => void }) {
  const [kg, setKg] = useState(w.kg);
  const [date, setDate] = useState(w.date);
  return (
    <Sheet onClose={onClose}>
      <h2>Edit weigh-in</h2>
      <Stepper label="Weight" unit="kg" value={kg} step={0.1} onChange={setKg} />
      <label className="field">
        Date
        <input className="input" type="date" value={date} max={dayKey(Date.now())} onChange={(e) => setDate(e.target.value)} />
      </label>
      <div className="row sheet-footer">
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirmAsk({ title: 'Delete this weigh-in?', body: `${w.date}: ${w.kg} kg.`, ok: 'Delete', danger: true }))) return;
            await deleteWeight(w.id);
            onClose();
          }}
        >
          Delete
        </button>
        <button className="btn secondary grow" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn primary grow"
          disabled={kg <= 0 || !date}
          onClick={async () => {
            if (!(await confirmAsk({ title: 'Save this correction?', body: `${w.date} ${w.kg} kg → ${date} ${Math.round(kg * 10) / 10} kg.`, ok: 'Save' }))) return;
            await updateWeight(w.id, date, Math.round(kg * 10) / 10);
            onClose();
          }}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}

function BmiScale({ value }: { value: number }) {
  const lo = 15;
  const hi = 35;
  const pos = (v: number) => `${((Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * 100}%`;
  // Start at the left (15), then slide to the value on the next frame (CSS eases it over ~1 s).
  // Later changes slide from the old value to the new one. Reduced motion: shown in place.
  const [shown, setShown] = useState(() => (reducedMotion() ? value : lo));
  useEffect(() => {
    if (reducedMotion()) {
      setShown(value);
      return;
    }
    let inner = 0;
    const r = requestAnimationFrame(() => (inner = requestAnimationFrame(() => setShown(value))));
    return () => {
      cancelAnimationFrame(r);
      cancelAnimationFrame(inner);
    };
  }, [value]);
  return (
    <div className="bmi-scale" aria-hidden>
      <div className="bmi-bands">
        <div style={{ width: pos(18.5), background: CAT_COLOR.Underweight }} />
        <div style={{ width: `calc(${pos(25)} - ${pos(18.5)})`, background: CAT_COLOR.Normal }} />
        <div style={{ width: `calc(${pos(30)} - ${pos(25)})`, background: CAT_COLOR.Overweight }} />
        <div style={{ flex: 1, background: CAT_COLOR.Obese }} />
      </div>
      <div className="bmi-fill" style={{ width: pos(shown) }} />
      <div className="bmi-marker" style={{ left: pos(shown) }} />
      <div className="tiny muted bmi-ticks">
        {[15, 18.5, 25, 30, 35].map((v) => (
          <span key={v} style={{ position: 'absolute', left: pos(v), transform: v === 15 ? 'none' : v === 35 ? 'translateX(-100%)' : 'translateX(-50%)' }}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
