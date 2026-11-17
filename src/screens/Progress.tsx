import { Avatar } from '../components/Avatar';
import { Bar, ICONS } from '../components/ui';
import { EXERCISES, EXERCISE_BY_ID, TIER_NAMES } from '../core/exercises';
import { fmtClock } from '../core/live';
import { AVATAR_STAGES, COLORS, describeRule, doneSessions, GEAR, ruleProgress } from '../core/rules';
import { updateProfile } from '../data/repo';
import type { Game } from '../data/useGame';
import { fmtRecord } from './Train';

export function Progress({ game }: { game: Game }) {
  const p = game.profile!;
  const d = game.d!;
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';
  const unlocked = new Set(p.unlocked);
  const history = doneSessions(game.sessions).reverse().slice(0, 20);

  return (
    <div className="stack">
      <h1>Progress</h1>

      <section className="card stack" aria-label="Avatar evolution">
        <h2>Avatar evolution</h2>
        <div className="row" style={{ overflowX: 'auto', gap: 4, paddingBottom: 4 }}>
          {AVATAR_STAGES.map((s, i) => (
            <div key={s.name} className="stack" style={{ alignItems: 'center', gap: 2, flex: 'none' }}>
              <Avatar stage={i} gear={i === d.stage ? d.gear : []} color={color} size={64} silhouette={i > d.stage} />
              <span className={`tiny ${i === d.stage ? '' : 'muted'}`}>{i > d.stage ? `Lv ${s.minLevel}` : s.name}</span>
            </div>
          ))}
        </div>
        <div className="row wrap small">
          {GEAR.map((g) => (
            <span key={g.id} className={`badge ${d.gear.includes(g.id) ? 'new' : ''}`}>
              {d.gear.includes(g.id) ? '✓' : '🔒'} {g.name} ({g.unlocks} unlocks)
            </span>
          ))}
        </div>
        <div className="row wrap" role="radiogroup" aria-label="Avatar color">
          {COLORS.map((c) => {
            const owned = p.cosmetics.includes(c.id);
            return (
              <button
                key={c.id}
                role="radio"
                aria-checked={p.color === c.id}
                aria-label={owned ? c.name : `${c.name} (locked)`}
                disabled={!owned}
                onClick={() => updateProfile({ color: c.id })}
                style={{ width: 36, height: 36, borderRadius: 99, background: owned ? c.hex : 'var(--line)', border: p.color === c.id ? '3px solid #fff' : '2px solid var(--line)' }}
              >
                {owned ? '' : '?'}
              </button>
            );
          })}
        </div>
        <p className="small muted">New colors come from mystery chests.</p>
      </section>

      <section className="card row between num" aria-label="Stats">
        <div className="stat">
          <span className="tiny muted">Sessions</span>
          <b>{d.stats.sessions}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Best streak</span>
          <b>{d.stats.bestStreak}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Minutes</span>
          <b>{d.stats.totalMinutes}</b>
        </div>
        <div className="stat">
          <span className="tiny muted">Unlocked</span>
          <b>
            {p.unlocked.length}/{EXERCISES.length}
          </b>
        </div>
      </section>

      <section className="stack" aria-label="Exercise ladder">
        <h2>Exercise ladder</h2>
        {[1, 2, 3, 4, 5, 6, 0].map((tier) => (
          <div key={tier} className="stack" style={{ gap: 8 }}>
            <div className="tier-head">
              <h3>
                Tier {tier || '?'} · {TIER_NAMES[tier]}
              </h3>
            </div>
            {EXERCISES.filter((e) => e.tier === tier).map((e) => {
              const has = unlocked.has(e.id);
              const rec = d.stats.records.get(e.id);
              const secretHidden = tier === 0 && !has;
              const prog = ruleProgress(e.unlock, d.stats);
              return (
                <div key={e.id} className={`card ex ${has ? '' : 'locked'}`}>
                  <span className="ico">{has ? ICONS[e.metric] : '🔒'}</span>
                  <div className="grow stack" style={{ gap: 4 }}>
                    <b>{secretHidden ? '???' : e.name}</b>
                    {has ? (
                      <span className="small muted">{rec ? `Record ${fmtRecord(e, rec)} · ${rec.count} sets` : 'Unlocked. Try it next session!'}</span>
                    ) : (
                      <>
                        <span className="small muted">{describeRule(e.unlock)}</span>
                        {!secretHidden && <Bar value={prog.current} max={prog.needed} />}
                      </>
                    )}
                    {e.equipment.length > 0 && <span className="tiny muted">Needs: {e.equipment.join(', ').replace(/_/g, ' ')}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </section>

      <section className="card stack" aria-label="History">
        <h2>Recent sessions</h2>
        {history.length === 0 && <p className="muted">No sessions yet. Your first one is the hardest. Start small.</p>}
        {history.map((s) => {
          const sets = d.liveSets.filter((x) => x.sessionId === s.id);
          const names = [...new Set(sets.map((x) => EXERCISE_BY_ID[x.exerciseId]?.name))].join(', ');
          return (
            <div key={s.id} className="stack" style={{ gap: 2 }}>
              <div className="row between small">
                <b>{new Date(s.startedAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</b>
                <span className="num">
                  {fmtClock(s.activeSec + s.restSec)} · +{s.xpEarned} XP {s.prs > 0 && <span className="badge pr">{s.prs} PR</span>}
                </span>
              </div>
              <span className="small muted">
                Active {fmtClock(s.activeSec)} · Rest {fmtClock(s.restSec)} · {sets.length} sets{names ? ` · ${names}` : ''}
              </span>
              <hr />
            </div>
          );
        })}
      </section>
    </div>
  );
}
