import { useState } from 'react';
import { Avatar } from '../components/Avatar';
import { CountUp, Sheet } from '../components/ui';
import { EXERCISE_BY_ID } from '../core/exercises';
import { fmtClock } from '../core/live';
import { fmtValues, mainMeasure } from '../core/measures';
import { AVATAR_STAGES, avatarStage, COLORS, type MeasuresOf } from '../core/rules';
import type { SessionSummary } from '../data/repo';

export function Summary({ s, onClose, avatarStyle, measuresOf }: { s: SessionSummary; onClose: () => void; avatarStyle?: 'athlete' | 'line' | 'buddy'; measuresOf?: MeasuresOf }) {
  const [chestOpen, setChestOpen] = useState(false);
  const stageBefore = avatarStage(s.levelBefore);
  const stageAfter = avatarStage(s.levelAfter);
  const prs = s.sets.filter((x) => x.isPR);

  return (
    <Sheet>
      <h1>Session complete 💪</h1>
      <div className="row between num">
        <div className="stat">
          <span className="tiny muted">Total</span>
          <b>{fmtClock(s.session.activeSec + s.session.restSec)}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Active</span>
          <b style={{ color: 'var(--accent)' }}>{fmtClock(s.session.activeSec)}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Rest</span>
          <b style={{ color: 'var(--rest)' }}>{fmtClock(s.session.restSec)}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Streak</span>
          <b>🔥 {s.streak}</b>
        </div>
      </div>
      {s.trimmed && <p className="small banner">This session was left open, so it ended 1 minute after your last activity.</p>}
      <p className="small muted">{s.habitMet ? `Daily goal met. Tomorrow's goal: ${s.habitTargetMin} min.` : `Daily goal: ${s.habitTargetMin} min. Every minute counts toward it.`}</p>

      {prs.length > 0 && (
        <div className="card stack">
          <h2>🏆 New records</h2>
          {prs.map((x) => (
            <span key={x.id} className="pop">
              {EXERCISE_BY_ID[x.exerciseId]?.name}: {EXERCISE_BY_ID[x.exerciseId] ? fmtValues(measuresOf ? measuresOf(EXERCISE_BY_ID[x.exerciseId]) : EXERCISE_BY_ID[x.exerciseId].measures, x) : ''}
            </span>
          ))}
        </div>
      )}

      <div className="card stack">
        <div className="row between">
          <h2>
            +<CountUp value={s.xp} ms={1100} /> XP
          </h2>
          {s.levelAfter > s.levelBefore && <span className="badge new pop">LEVEL {s.levelAfter}!</span>}
        </div>
        {s.xpParts.map((p) => (
          <div key={p.label} className="row between small">
            <span className="muted">{p.label}</span>
            <span className="num">+{p.xp}</span>
          </div>
        ))}
      </div>

      {stageAfter > stageBefore && (
        <div className="card row pop">
          <Avatar stage={stageAfter} gear={[]} color="#ff7a1a" size={90} style={avatarStyle} action="celebrate" />
          <div>
            <span className="tiny muted">Avatar evolved</span>
            <h2>
              {AVATAR_STAGES[stageBefore].name} → {AVATAR_STAGES[stageAfter].name}
            </h2>
          </div>
        </div>
      )}

      {s.unlocked.length > 0 && (
        <div className="card stack pop" style={{ borderColor: 'var(--good)' }}>
          <h2>🎁 Surprise unlocked!</h2>
          {s.unlocked.map((id) => (
            <span key={id}>
              <b>{EXERCISE_BY_ID[id]?.name}</b> <span className="small muted">— {EXERCISE_BY_ID[id]?.cue}</span>
            </span>
          ))}
        </div>
      )}

      <div className="card stack" style={{ textAlign: 'center', alignItems: 'center' }}>
        {!chestOpen ? (
          <>
            <span className="chest" aria-hidden>
              🎁
            </span>
            <button className="btn primary" onClick={() => setChestOpen(true)}>
              Open mystery chest
            </button>
          </>
        ) : (
          <div className="pop">
            <ChestText s={s} />
          </div>
        )}
      </div>

      <button className="btn good big" onClick={onClose} disabled={!chestOpen}>
        Done
      </button>
    </Sheet>
  );
}

function ChestText({ s }: { s: SessionSummary }) {
  const c = s.chest;
  if (c.kind === 'xp') return <h2>✨ +{c.xp} bonus XP</h2>;
  if (c.kind === 'color') {
    const col = COLORS.find((x) => x.id === c.colorId)!;
    return (
      <>
        <h2 style={{ color: col.hex }}>🎨 New avatar color: {col.name}</h2>
        <p className="small muted">Change it in Progress.</p>
      </>
    );
  }
  if (c.kind === 'secret')
    return (
      <>
        <h2>🗝️ Secret exercise: {EXERCISE_BY_ID[c.exerciseId]?.name}</h2>
        <p className="small muted">{EXERCISE_BY_ID[c.exerciseId]?.cue}</p>
      </>
    );
  const ex = EXERCISE_BY_ID[c.challenge.exerciseId];
  return (
    <>
      <h2>⚡ Surprise challenge</h2>
      <p>
        Next time: {ex?.name} — hit {ex ? fmtValues([mainMeasure(ex)], { reps: c.challenge.target, seconds: c.challenge.target, distanceKm: c.challenge.target }) : c.challenge.target} in one set for +{c.challenge.xp} XP.
      </p>
    </>
  );
}
