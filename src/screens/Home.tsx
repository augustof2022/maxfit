import type { Tab } from '../App';
import { Avatar } from '../components/Avatar';
import { Bar, WeekChart } from '../components/ui';
import { EXERCISE_BY_ID } from '../core/exercises';
import { AVATAR_STAGES, COLORS, nextUnlockHints, STARTER_SESSIONS, dayKey } from '../core/rules';
import type { Game } from '../data/useGame';

export function Home({ game, go }: { game: Game; go: (t: Tab) => void }) {
  const p = game.profile!;
  const d = game.d!;
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';
  const today = d.week[d.week.length - 1];
  const todayMin = Math.round((today.activeSec + today.restSec) / 60);
  const hints = nextUnlockHints(p.unlocked, d.stats, 3);
  const last2 = d.week.slice(-3, -1);
  const challengeEx = p.challenge ? EXERCISE_BY_ID[p.challenge.exerciseId] : null;
  const lastWeigh = game.weights[game.weights.length - 1];
  const weighDue = p.settings.weighReminder.enabled && new Date().getDay() === p.settings.weighReminder.day && lastWeigh?.date !== dayKey(Date.now());

  return (
    <div className="stack">
      <div className="row between">
        <h1>{p.name ? `Hi, ${p.name}` : 'MaxFit'}</h1>
        <span className="badge" title="Current streak">
          🔥 {d.stats.streak} day{d.stats.streak === 1 ? '' : 's'}
        </span>
      </div>

      <section className="card row" aria-label="Your avatar">
        <Avatar stage={d.stage} gear={d.gear} color={color} size={110} />
        <div className="grow stack" style={{ gap: 6 }}>
          <span className="tiny muted">{AVATAR_STAGES[d.stage].name}</span>
          <h2>Level {d.level}</h2>
          <Bar value={d.xpInto} max={d.xpNeed} />
          <span className="small muted num">
            {d.xpInto} / {d.xpNeed} XP to level {d.level + 1}
          </span>
          <span className="small muted">{p.unlocked.length} exercises unlocked</span>
        </div>
      </section>

      <section className="card stack" aria-label="Today">
        <div className="row between">
          <h2>Today's goal</h2>
          <span className="num">
            <b>{todayMin}</b> / {d.goalMin} min
          </span>
        </div>
        <Bar value={todayMin} max={d.goalMin} />
        <p className="small muted">
          {d.stats.sessions < STARTER_SESSIONS
            ? `Starter mode (${d.stats.sessions}/${STARTER_SESSIONS} sessions): short and easy. Showing up is the win.`
            : 'Your goal grows by 5 minutes after every 5 days you meet it.'}
          {last2.length === 2 && ` Last 2 days: ${Math.round((last2[0].activeSec + last2[0].restSec + last2[1].activeSec + last2[1].restSec) / 60)} min. Yesterday: ${Math.round((last2[1].activeSec + last2[1].restSec) / 60)} min.`}
        </p>
        <button className="btn primary big" onClick={() => go('train')}>
          {d.active ? 'Continue session' : 'Start session'}
        </button>
      </section>

      {weighDue && (
        <button className="banner small" style={{ textAlign: 'left', color: 'inherit' }} onClick={() => go('body')}>
          ⚖️ Weigh-in day. Tap to log your weight.
        </button>
      )}

      {p.challenge && challengeEx && (
        <section className="card stack" aria-label="Surprise challenge">
          <span className="tiny" style={{ color: 'var(--accent2)' }}>
            Surprise challenge
          </span>
          <p>
            <b>{challengeEx.name}</b>: hit {p.challenge.target}
            {challengeEx.metric === 'time' ? ' seconds' : challengeEx.metric === 'distance' ? ' km' : ' reps'} in one set for <b>+{p.challenge.xp} XP</b>.
          </p>
        </section>
      )}

      <section className="card stack" aria-label="Next unlocks">
        <h2>Next unlocks</h2>
        {hints.length === 0 && <p className="muted">You unlocked everything. Legend!</p>}
        {hints.map((h) => (
          <div key={h.exercise.id} className="stack" style={{ gap: 4 }}>
            <div className="row between small">
              <span>🔒 {h.exercise.name}</span>
              <span className="muted num">
                {Math.min(h.current, h.needed)}/{h.needed}
              </span>
            </div>
            <Bar value={h.current} max={h.needed} />
            <span className="small muted">{h.text}</span>
          </div>
        ))}
      </section>

      <section className="card stack" aria-label="Last 7 days">
        <div className="row between">
          <h2>Last 7 days</h2>
          <span className="small muted">
            <span style={{ color: 'var(--accent)' }}>■</span> exercise <span style={{ color: 'var(--rest)' }}>■</span> rest
          </span>
        </div>
        <WeekChart days={d.week} goalMin={d.goalMin} />
      </section>
    </div>
  );
}
