import { useState } from 'react';
import { celebrate } from '../components/Celebrate';
import type { Gender } from '../core/types';
import { Avatar } from '../components/Avatar';
import { CountUp, Sheet } from '../components/ui';
import { CircleCheck, ExIcon, Flame, Gift, Ico, KeyRound, Palette, Sparkles, Trophy, Zap } from '../components/Icon';
import { EXERCISE_BY_ID } from '../core/exercises';
import { fmtClock } from '../core/live';
import { fmtValues, mainMeasure } from '../core/measures';
import { AVATAR_STAGES, avatarStage, COLORS, type MeasuresOf } from '../core/rules';
import type { SessionSummary } from '../data/repo';

export function Summary({ s, onClose, avatarStyle, gender, measuresOf }: { s: SessionSummary; onClose: () => void; avatarStyle?: 'athlete' | 'line' | 'buddy'; gender?: Gender; measuresOf?: MeasuresOf }) {
  const [chestOpen, setChestOpen] = useState(false);
  const stageBefore = avatarStage(s.levelBefore);
  const stageAfter = avatarStage(s.levelAfter);
  const prs = s.sets.filter((x) => x.isPR);

  return (
    <Sheet>
      <div className="sheet-body">
        <div className="sheet-title">
          <span className="done-mark" aria-hidden>
            <Ico as={CircleCheck} size={26} />
          </span>
          <div className="stack" style={{ gap: 2, flex: 1, minWidth: 0 }}>
            <h1>Session complete</h1>
            <p className="note">{s.habitMet ? `Daily goal met. Tomorrow's goal: ${s.habitTargetMin} min.` : `Daily goal: ${s.habitTargetMin} min. Every minute counts toward it.`}</p>
          </div>
        </div>

        <div className="card stats num" aria-label="Session totals">
          <div className="stat">
            <b>{fmtClock(s.session.activeSec + s.session.restSec)}</b>
            <span>Total</span>
          </div>
          <div className="stat">
            <b style={{ color: 'var(--accent)' }}>{fmtClock(s.session.activeSec)}</b>
            <span>Active</span>
          </div>
          <div className="stat">
            <b style={{ color: 'var(--rest)' }}>{fmtClock(s.session.restSec)}</b>
            <span>Rest</span>
          </div>
          <div className="stat">
            <b>
              <Ico as={Flame} size={18} style={{ color: 'var(--accent)' }} />
              {s.streak}
            </b>
            <span>Streak</span>
          </div>
        </div>
        {s.trimmed && <p className="small banner">This session was left open, so it ended 1 minute after your last activity.</p>}

        {prs.length > 0 && (
          <section className="group" aria-label="New records">
            <div className="group-head">
              <h2>New records</h2>
            </div>
            <div className="list">
              {prs.map((x) => {
                const ex = EXERCISE_BY_ID[x.exerciseId];
                return (
                  <div key={x.id} className="row-item pop">
                    <span className="ico gold">
                      <Ico as={Trophy} />
                    </span>
                    <span className="meta">
                      <b>{ex?.name}</b>
                    </span>
                    <span className="trail">
                      <b>{ex ? fmtValues(measuresOf ? measuresOf(ex) : ex.measures, x) : ''}</b>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="group" aria-label="XP earned">
          <div className="group-head">
            <h2 className="xp-total">
              +<CountUp value={s.xp} ms={1100} /> XP
            </h2>
            {s.levelAfter > s.levelBefore && <span className="badge new pop">Level {s.levelAfter}</span>}
          </div>
          <div className="list">
            {s.xpParts.map((p) => (
              <div key={p.label} className="row-item" style={{ minHeight: 48 }}>
                <span className="meta">
                  <span>{p.label}</span>
                </span>
                <span className="trail">+{p.xp}</span>
              </div>
            ))}
          </div>
        </section>

        {stageAfter > stageBefore && (
          <div className="card hero pop">
            <Avatar stage={stageAfter} gear={[]} color="#ff7a1a" size={90} style={avatarStyle} gender={gender} action="celebrate" />
            <div className="info">
              <h2>Your avatar evolved</h2>
              <span className="note">
                {AVATAR_STAGES[stageBefore].name} → {AVATAR_STAGES[stageAfter].name}
              </span>
            </div>
          </div>
        )}

        {s.unlocked.length > 0 && (
          <section className="group pop" aria-label="Surprise unlocked">
            <div className="group-head">
              <h2>Surprise unlocked</h2>
            </div>
            <p className="group-note">Added to your exercise inventory. Try it when you like; it is optional.</p>
            <div className="list">
              {s.unlocked.map((id) => {
                const ex = EXERCISE_BY_ID[id];
                if (!ex) return null;
                return (
                  <div key={id} className="row-item">
                    <ExIcon ms={measuresOf ? measuresOf(ex) : ex.measures} exerciseId={id} />
                    <span className="meta">
                      <b>{ex.name}</b>
                      <span className="sub">{ex.cue}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="card chest-box">
          {!chestOpen ? (
            <>
              <span className="chest" aria-hidden>
                <Ico as={Gift} size={36} />
              </span>
              <p className="note">One mystery chest per session: bonus XP, a color, a challenge or a secret exercise.</p>
              <button
                className="btn primary"
                style={{ alignSelf: 'stretch' }}
                onClick={() => {
                  setChestOpen(true);
                  // A new colour is a grand moment too: show the avatar wearing it.
                  if (s.chest.kind === 'color') celebrate([{ kind: 'color', colorId: s.chest.colorId }]);
                }}
              >
                Open mystery chest
              </button>
            </>
          ) : (
            <div className="chest-result pop">
              <ChestText s={s} />
            </div>
          )}
        </div>
      </div>

      <div className="sheet-footer">
        <button className={`btn big ${chestOpen ? 'primary' : 'secondary'}`} onClick={onClose} disabled={!chestOpen}>
          Done
        </button>
      </div>
    </Sheet>
  );
}

function ChestText({ s }: { s: SessionSummary }) {
  const c = s.chest;
  if (c.kind === 'xp')
    return (
      <>
        <span className="ico">
          <Ico as={Sparkles} size={28} />
        </span>
        <h2 className="num">+{c.xp} bonus XP</h2>
      </>
    );
  if (c.kind === 'color') {
    const col = COLORS.find((x) => x.id === c.colorId)!;
    return (
      <>
        <span className="ico" style={{ color: col.hex }}>
          <Ico as={Palette} size={28} />
        </span>
        <h2>New avatar color: {col.name}</h2>
        <p className="note">Change it in Progress.</p>
      </>
    );
  }
  if (c.kind === 'secret')
    return (
      <>
        <span className="ico gold">
          <Ico as={KeyRound} size={28} />
        </span>
        <h2>Secret exercise: {EXERCISE_BY_ID[c.exerciseId]?.name}</h2>
        <p className="note">{EXERCISE_BY_ID[c.exerciseId]?.cue}</p>
      </>
    );
  const ex = EXERCISE_BY_ID[c.challenge.exerciseId];
  return (
    <>
      <span className="ico gold">
        <Ico as={Zap} size={28} />
      </span>
      <h2>Surprise challenge</h2>
      <p className="note">
        Next time: {ex?.name}. Hit {ex ? fmtValues([mainMeasure(ex)], { reps: c.challenge.target, seconds: c.challenge.target, distanceKm: c.challenge.target }) : c.challenge.target} in one set for +{c.challenge.xp} XP.
      </p>
    </>
  );
}
