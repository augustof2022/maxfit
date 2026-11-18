// Goals and body focus (Renz, 2026-11-18): pick several; surprises and plans lean toward them.

import { useState } from 'react';
import type { Focus, Goal } from '../core/types';
import { setGoals } from '../data/repo';

export const GOALS: { id: Goal; label: string; icon: string }[] = [
  { id: 'lose_weight', label: 'Lose weight', icon: '🔥' },
  { id: 'lean', label: 'Get lean', icon: '✨' },
  { id: 'muscle', label: 'Build muscle', icon: '💪' },
  { id: 'strength', label: 'Get stronger', icon: '🏋️' },
  { id: 'stamina', label: 'Stamina', icon: '🫀' },
];

export const FOCUS: { id: Focus; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
  { id: 'legs', label: 'Legs & glutes' },
  { id: 'cardio', label: 'Cardio' },
];

export function GoalPicker({ goals, focus, onSaved }: { goals: Goal[]; focus: Focus[]; onSaved?: () => void }) {
  const [g, setG] = useState<Goal[]>(goals);
  const [f, setF] = useState<Focus[]>(focus);
  const flip = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const changed = g.join() !== goals.join() || f.join() !== focus.join();
  return (
    <div className="stack">
      <span className="tiny muted">Goals (pick any)</span>
      <div className="row wrap" role="group" aria-label="Goals">
        {GOALS.map((x) => (
          <button key={x.id} className={`chip ${g.includes(x.id) ? 'on' : ''}`} aria-pressed={g.includes(x.id)} onClick={() => setG(flip(g, x.id))}>
            {x.icon} {x.label}
          </button>
        ))}
      </div>
      <span className="tiny muted">Focus on (pick any)</span>
      <div className="row wrap" role="group" aria-label="Body focus">
        {FOCUS.map((x) => (
          <button key={x.id} className={`chip ${f.includes(x.id) ? 'on' : ''}`} aria-pressed={f.includes(x.id)} onClick={() => setF(flip(f, x.id))}>
            {x.label}
          </button>
        ))}
      </div>
      <p className="small muted">Surprise unlocks and your plan lean toward these. Change them any time.</p>
      <button
        className="btn primary"
        disabled={!changed}
        onClick={async () => {
          await setGoals(g, f);
          onSaved?.();
        }}
      >
        Save goals
      </button>
    </div>
  );
}
