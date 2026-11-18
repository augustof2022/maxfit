import type { Tab } from '../App';
import { Avatar } from '../components/Avatar';
import { Bar, CountUp, WeekChart } from '../components/ui';
import { GoalPicker } from '../components/GoalPicker';
import { DoneExercises } from '../components/ExerciseHistory';
import { ChevronRight, Flame, Gift, Ico, Scale, Zap } from '../components/Icon';
import { EXERCISE_BY_ID, EXERCISES } from '../core/exercises';
import { fmtValues, mainMeasure } from '../core/measures';
import { AVATAR_STAGES, COLORS, nextUnlockHints, STARTER_SESSIONS, dayKey } from '../core/rules';
import type { Game } from '../data/useGame';

export function Home({ game, go }: { game: Game; go: (t: Tab) => void }) {
  const p = game.profile!;
  const d = game.d!;
  const color = COLORS.find((c) => c.id === p.color)?.hex ?? '#ff7a1a';
  const today = d.week[d.week.length - 1];
  const todayMin = Math.round((today.activeSec + today.restSec) / 60);
  const hints = nextUnlockHints(d.unlocked, d.stats, 3, d.canDo);
  // Only count surprises the user could do with the equipment in their places.
  const waiting = EXERCISES.filter((e) => d.canDo(e) && !d.unlocked.includes(e.id)).length;
  const needsGoals = !(p.goals ?? []).length && !(p.focus ?? []).length;
  const last2 = d.week.slice(-3, -1);
  const challengeEx = p.challenge ? EXERCISE_BY_ID[p.challenge.exerciseId] : null;
  const lastWeigh = game.weights[game.weights.length - 1];
  const weighDue = p.settings.weighReminder.enabled && new Date().getDay() === p.settings.weighReminder.day && lastWeigh?.date !== dayKey(Date.now());
  const min = (x: { activeSec: number; restSec: number }) => (x.activeSec + x.restSec) / 60;

  return (
    <div className="stack screen">
      <header className="screen-head">
        <h1>{p.name ? `Hi, ${p.name}` : 'MaxFit'}</h1>
        <span className="streak" title="Current streak">
          <Ico as={Flame} size={16} />
          {d.stats.streak} day{d.stats.streak === 1 ? '' : 's'}
          <span className="vh"> streak</span>
        </span>
      </header>

      <section className="card hero" aria-label="Your avatar">
        <Avatar stage={d.stage} gear={d.gear} color={color} size={112} style={p.avatarStyle} gender={p.gender} action={d.active ? 'run' : 'life'} />
        <div className="info">
          <div className="stack" style={{ gap: 2 }}>
            <h2>
              Level <CountUp value={d.level} />
            </h2>
            <span className="stage">{AVATAR_STAGES[d.stage].name}</span>
          </div>
          <Bar value={d.xpInto} max={d.xpNeed} thick label="XP to next level" />
          <span className="small muted num">
            <CountUp value={d.xpInto} /> / {d.xpNeed} XP to level {d.level + 1}
          </span>
          <span className="small muted num">
            {d.unlocked.length} exercises unlocked · {waiting} surprises waiting
          </span>
        </div>
      </section>

      <section className="group" aria-label="Today">
        <div className="group-head">
          <h2>Today's goal</h2>
          <span className="goal-num">
            <b>{todayMin}</b> / {d.goalMin} min
          </span>
        </div>
        <Bar value={todayMin} max={d.goalMin} tone={todayMin >= d.goalMin ? 'good' : 'accent'} thick label="Today's goal" />
        <p className="note">
          {d.stats.sessions < STARTER_SESSIONS
            ? `Starter mode (${d.stats.sessions}/${STARTER_SESSIONS} sessions): short and easy. Showing up is the win.`
            : 'Your goal grows by 5 minutes after every 5 days you meet it.'}
          {last2.length === 2 && ` Last 2 days: ${Math.round(min(last2[0]) + min(last2[1]))} min. Yesterday: ${Math.round(min(last2[1]))} min.`}
        </p>
        <button className="btn primary big" onClick={() => go('train')}>
          {d.active ? 'Continue session' : 'Start session'}
        </button>
      </section>

      {weighDue && (
        <div className="list">
          <button className="row-item" onClick={() => go('body')}>
            <span className="ico">
              <Ico as={Scale} />
            </span>
            <span className="meta">
              <b>Weigh-in day</b>
              <span className="sub">Tap to log your weight.</span>
            </span>
            <Ico as={ChevronRight} className="chev" />
          </button>
        </div>
      )}

      {needsGoals && (
        <section className="group" aria-label="Your goals">
          <div className="group-head">
            <h2>What is your goal?</h2>
          </div>
          <div className="card">
            <GoalPicker goals={[]} focus={[]} />
          </div>
        </section>
      )}

      <DoneExercises game={game} limit={4} />

      {p.challenge && challengeEx && (
        <section className="group" aria-label="Surprise challenge">
          <div className="group-head">
            <h2>Surprise challenge</h2>
          </div>
          <div className="list">
            <div className="row-item">
              <span className="ico gold">
                <Ico as={Zap} />
              </span>
              <span className="meta">
                <b>{challengeEx.name}</b>
                <span className="sub">
                  Hit {fmtValues([mainMeasure(challengeEx)], { reps: p.challenge.target, seconds: p.challenge.target, distanceKm: p.challenge.target })} in one set.
                </span>
              </span>
              <span className="trail">
                <b>+{p.challenge.xp}</b> XP
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="group" aria-label="Next unlocks">
        <div className="group-head">
          <h2>Next surprises</h2>
        </div>
        <div className="list">
          {hints.length === 0 && <p className="empty">You unlocked every exercise your places allow. Add equipment to a place in Settings for more.</p>}
          {hints.map((h, i) => (
            <div key={h.exercise.id} className="row-item">
              <span className="ico">
                <Ico as={Gift} />
              </span>
              <span className="meta">
                <b>
                  Surprise {i + 1} <span className="faint small">· tier {h.exercise.tier}</span>
                </b>
                <Bar value={h.current} max={h.needed} />
                <span className="sub">To unlock: {h.text}</span>
              </span>
              <span className="trail">
                {Math.min(h.current, h.needed)}/{h.needed}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="group" aria-label="Last 7 days">
        <div className="group-head">
          <h2>Last 7 days</h2>
          <span className="legend" aria-hidden>
            <span>
              <i style={{ background: 'var(--accent)' }} />
              Exercise
            </span>
            <span>
              <i style={{ background: 'var(--rest)' }} />
              Rest
            </span>
          </span>
        </div>
        <div className="card">
          <WeekChart days={d.week} goalMin={d.goalMin} />
        </div>
      </section>
    </div>
  );
}
