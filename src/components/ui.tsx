import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DayTotal } from '../core/rules';

export const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/**
 * Progress bar that fills like liquid: it rises from empty on first show, eases to new values,
 * and a slow sheen runs through the fill (CSS, off when the phone asks for reduced motion).
 */
export function Bar({ value, max, tone = 'accent', thick = false, label }: { value: number; max: number; tone?: 'accent' | 'good' | 'rest'; thick?: boolean; label?: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);
  return (
    <div className={`bar ${tone} ${thick ? 'thick' : ''} ${pct >= 100 ? 'full' : ''}`} role="progressbar" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${shown}%` }} />
    </div>
  );
}

/** A number that counts up to its new value (about 0.7 s, fast at first, then settles). */
export function CountUp({ value, decimals = 0, ms = 700 }: { value: number; decimals?: number; ms?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const a = from.current;
    let id = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(a + (value - a) * e);
      if (k < 1) id = requestAnimationFrame(tick);
      else from.current = value;
    };
    id = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(id);
      from.current = value;
    };
  }, [value, ms]);
  const f = 10 ** decimals;
  return <>{(Math.round(shown * f) / f).toFixed(decimals)}</>;
}

export function Stepper({ value, onChange, step = 1, min = 0, label, unit }: { value: number; onChange: (v: number) => void; step?: number; min?: number; label: string; unit?: string }) {
  // Keep the typed text so "12." can become "12.5" (a number-only state would drop the dot).
  const [text, setText] = useState(String(value));
  useEffect(() => {
    if (Number(text.replace(',', '.')) !== value) setText(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <label className="field">
      {label}
      <div className="stepper">
        <button type="button" aria-label={`Less ${label}`} onClick={() => onChange(Math.max(min, round(value - step)))}>
          -
        </button>
        <input
          className="input num"
          inputMode="decimal"
          value={text}
          onChange={(e) => {
            const t = e.target.value.replace(/[^0-9.,]/g, '');
            setText(t);
            const n = Number(t.replace(',', '.'));
            if (Number.isFinite(n)) onChange(n);
          }}
          aria-label={label}
        />
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(round(value + step))}>
          +
        </button>
        {unit && <span className="muted">{unit}</span>}
      </div>
    </label>
  );
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export function Sheet({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="sheet stack" role="dialog" aria-modal="true">
        {children}
      </div>
    </div>
  );
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return (
    <div className="toast" role="status">
      {text}
    </div>
  );
}

/** Stacked bars: active (orange) + rest (blue) minutes per day, with the daily goal line. */
export function WeekChart({ days, goalMin }: { days: DayTotal[]; goalMin: number }) {
  const W = 320;
  const H = 120;
  const pad = 18;
  const max = Math.max(goalMin * 1.2, ...days.map((d) => (d.activeSec + d.restSec) / 60), 1);
  const bw = (W - 8) / days.length;
  const y = (min: number) => H - pad - (min / max) * (H - pad - 8);
  const gy = y(goalMin);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Minutes trained per day, last 7 days">
      {days.map((d, i) => {
        const a = d.activeSec / 60;
        const r = d.restSec / 60;
        const x = 4 + i * bw + bw * 0.2;
        const w = bw * 0.6;
        const label = new Date(d.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
        return (
          <g key={d.date}>
            <rect x={x} y={y(a)} width={w} height={H - pad - y(a)} rx={3} fill="var(--accent)" />
            <rect x={x} y={y(a + r)} width={w} height={y(a) - y(a + r)} rx={3} fill="var(--rest)" opacity=".8" />
            {a + r > 0 && (
              <text x={x + w / 2} y={y(a + r) - 3} textAnchor="middle" fontSize="9" fill="var(--text)">
                {Math.round(a + r)}
              </text>
            )}
            <text x={x + w / 2} y={H - 4} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {label}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={W} y1={gy} y2={gy} stroke="var(--accent2)" strokeDasharray="4 4" />
      <text x={W - 2} y={gy - 3} textAnchor="end" fontSize="9" fill="var(--accent2)">
        goal {goalMin}m
      </text>
    </svg>
  );
}

export function LineChart({ points, unit }: { points: { label: string; v: number }[]; unit: string }) {
  if (points.length < 2) return <p className="muted small">Log 2 or more weigh-ins to see your trend.</p>;
  const W = 320;
  const H = 130;
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs) - 1;
  const hi = Math.max(...vs) + 1;
  const x = (i: number) => 10 + (i / (points.length - 1)) * (W - 20);
  const y = (v: number) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 34);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Trend in ${unit}`}>
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r={3} fill="var(--accent2)" />
      ))}
      <text x={10} y={H - 4} fontSize="10" fill="var(--muted)">
        {points[0].label}
      </text>
      <text x={W - 10} y={H - 4} fontSize="10" fill="var(--muted)" textAnchor="end">
        {points[points.length - 1].label} · {points[points.length - 1].v} {unit}
      </text>
    </svg>
  );
}

/** Small round button used for edit / delete on list rows. */
export function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button className="btn ghost icon-btn" onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  );
}
