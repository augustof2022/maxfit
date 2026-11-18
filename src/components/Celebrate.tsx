// Grand unlock moments (Renz, 2026-11-18): when something unlocks, show it at once, full screen,
// mid-session — a "grand Spartan" reward card (bronze and red, a laurel, strong type, a short
// celebratory animation; still when the phone asks for reduced motion). Several at once: one at a time.
// Call `celebrate([...])` anywhere; <CelebrateHost/> (in App) shows the queue.

import { useEffect, useState, useSyncExternalStore } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { plansAt } from '../core/plans';
import { AVATAR_STAGES, COLORS, fitsEquipment, GEAR } from '../core/rules';
import { addToPlan } from '../data/repo';
import type { Game } from '../data/useGame';
import { beep, buzz } from '../lib/alarm';
import { Avatar } from './Avatar';
import { reducedMotion } from './ui';

export type Reward =
  | { kind: 'exercise'; exerciseId: string }
  | { kind: 'gear'; gearId: string }
  | { kind: 'color'; colorId: string }
  | { kind: 'level'; level: number; stageFrom: number; stageTo: number };

export const rewardKey = (r: Reward): string =>
  r.kind === 'exercise' ? `ex:${r.exerciseId}` : r.kind === 'gear' ? `gear:${r.gearId}` : r.kind === 'color' ? `color:${r.colorId}` : `level:${r.level}`;

let queue: Reward[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Add rewards to the queue (a reward already waiting is not added twice). */
export function celebrate(rewards: Reward[]) {
  const keys = new Set(queue.map(rewardKey));
  const fresh = rewards.filter((r) => !keys.has(rewardKey(r)));
  if (!fresh.length) return;
  queue = [...queue, ...fresh];
  emit();
}

function next() {
  queue = queue.slice(1);
  emit();
}

function skipAll() {
  queue = [];
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** A laurel wreath: two curved branches of leaves, drawn in SVG. */
function Laurel({ size = 260 }: { size?: number }) {
  // Leaves sit on a circle (centre 130,130; radius 100), from the bottom up each side, tilted outward.
  const leaves = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const deg = side < 0 ? 112 + i * 17 : 68 - i * 17; // left: 112° → 248°, right: 68° → -68° (y points down)
      const t = (deg * Math.PI) / 180;
      const cx = 130 + 100 * Math.cos(t);
      const cy = 130 + 100 * Math.sin(t);
      const rot = deg + side * -28;
      // The group places and turns the leaf; the leaf itself only grows in (CSS), so the two never fight.
      leaves.push(
        <g key={`${side}-${i}`} transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot})`}>
          <ellipse className="leaf" style={{ animationDelay: `${120 + i * 45}ms` }} cx={0} cy={0} rx={6.5} ry={16} />
        </g>,
      );
    }
  }
  return (
    <svg className="laurel" width={size} height={size} viewBox="0 0 260 260" aria-hidden>
      <defs>
        <linearGradient id="bronze" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#f6d38b" />
          <stop offset=".5" stopColor="#cd8a3a" />
          <stop offset="1" stopColor="#8a4b1c" />
        </linearGradient>
      </defs>
      {/* Two stems, from the bottom up each side (radius 100). */}
      <path d={`M ${130 + 100 * Math.cos(1.75)} ${130 + 100 * Math.sin(1.75)} A 100 100 0 0 1 ${130 + 100 * Math.cos(4.33)} ${130 + 100 * Math.sin(4.33)}`} fill="none" stroke="#b9772f" strokeWidth="2.5" strokeLinecap="round" />
      <path d={`M ${130 + 100 * Math.cos(1.39)} ${130 + 100 * Math.sin(1.39)} A 100 100 0 0 0 ${130 + 100 * Math.cos(-1.19)} ${130 + 100 * Math.sin(-1.19)}`} fill="none" stroke="#b9772f" strokeWidth="2.5" strokeLinecap="round" />
      <g fill="url(#bronze)">{leaves}</g>
    </svg>
  );
}

export function CelebrateHost({ game }: { game: Game }) {
  const q = useSyncExternalStore(subscribe, () => queue);
  const r = q[0];
  if (!r || !game.profile || !game.d) return null;
  return <RewardCard key={rewardKey(r)} game={game} r={r} total={q.length} />;
}

function RewardCard({ game, r, total }: { game: Game; r: Reward; total: number }) {
  const p = game.profile!;
  const d = game.d!;
  const [added, setAdded] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // One short cheer per card (sound and buzz follow the alarm settings).
  useEffect(() => {
    if (p.settings.sound) beep(2, 990);
    if (p.settings.vibrate) buzz([80, 60, 160]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const color = COLORS.find((c) => c.id === (r.kind === 'color' ? r.colorId : p.color))?.hex ?? '#ff7a1a';
  const still = reducedMotion();

  // The plan to add a new exercise to: the running session's plan, else the last used plan here.
  const activePlan = d.active?.planId ? game.plans.find((x) => x.id === d.active!.planId) : undefined;
  const plan = activePlan ?? plansAt(game.plans, d.location?.id ?? null)[0];
  const planLoc = plan ? game.locations.find((l) => l.id === plan.locationId) : undefined;

  let kicker = '';
  let title = '';
  let body = '';
  let gear = d.gear;
  let stage = d.stage;
  if (r.kind === 'exercise') {
    const ex = EXERCISE_BY_ID[r.exerciseId];
    kicker = 'New exercise unlocked';
    title = ex?.name ?? r.exerciseId;
    body = 'See it and try it in your exercise inventory.';
  } else if (r.kind === 'gear') {
    const g = GEAR.find((x) => x.id === r.gearId);
    kicker = 'New gear earned';
    title = g?.name ?? r.gearId;
    body = 'Your avatar wears it from now on.';
    gear = [...new Set([...d.gear, r.gearId])];
  } else if (r.kind === 'color') {
    kicker = 'New avatar colour';
    title = COLORS.find((c) => c.id === r.colorId)?.name ?? r.colorId;
    body = 'Pick it any time in Progress.';
  } else {
    kicker = 'Level up';
    title = `Level ${r.level}`;
    body = r.stageTo > r.stageFrom ? `Your avatar evolved: ${AVATAR_STAGES[r.stageFrom].name} → ${AVATAR_STAGES[r.stageTo].name}.` : 'Stronger every session. Keep showing up.';
    stage = Math.max(stage, r.stageTo);
  }

  const ex = r.kind === 'exercise' ? EXERCISE_BY_ID[r.exerciseId] : null;
  const fits = !!(ex && planLoc && fitsEquipment(ex, planLoc.equipment));
  const inPlan = !!(ex && plan?.items.some((i) => i.exerciseId === ex.id));

  return (
    <div className={`reward ${still ? 'still' : ''}`} role="alertdialog" aria-modal="true" aria-labelledby="reward-title" aria-describedby="reward-body">
      <div className="reward-rays" aria-hidden />
      <div className="reward-inner">
        <span className="reward-kicker">{kicker}</span>
        <div className="reward-crest">
          <Laurel />
          <div className="reward-figure">
            {r.kind === 'exercise' ? (
              <Avatar stage={d.stage} gear={d.gear} color={color} size={130} style={p.avatarStyle} gender={p.gender} action="celebrate" />
            ) : (
              <Avatar stage={stage} gear={gear} color={color} size={130} style={p.avatarStyle} gender={p.gender} action="celebrate" />
            )}
          </div>
        </div>
        <h1 id="reward-title" className="reward-title">
          {title}
        </h1>
        {r.kind === 'level' && <span className="reward-sub">{AVATAR_STAGES[stage].name}</span>}
        <p id="reward-body" className="reward-body">
          {body}
        </p>
        {ex && <p className="reward-cue">💡 {ex.cue}</p>}
        {ex && (
          <div className="stack" style={{ gap: 6, width: '100%' }}>
            {plan ? (
              <button
                className="btn reward-btn"
                disabled={!!added || inPlan || !fits}
                onClick={async () => {
                  try {
                    await addToPlan(plan.id, ex.id);
                    setAdded(plan.name);
                  } catch (e) {
                    setErr((e as Error).message);
                  }
                }}
              >
                {added ? `✓ Added to "${added}"` : inPlan ? `Already in "${plan.name}"` : fits ? `＋ Add to plan "${plan.name}"` : `Not doable at ${planLoc?.name ?? 'that place'}`}
              </button>
            ) : (
              <span className="small reward-body">Make a plan on Train to add it to.</span>
            )}
            {err && <span className="small">{err}</span>}
          </div>
        )}
        <button className="btn reward-go" onClick={next} autoFocus>
          {total > 1 ? `Continue (${total - 1} more)` : 'Continue'}
        </button>
        {total > 2 && (
          <button className="btn reward-skip" onClick={skipAll}>
            Skip the rest (all are in your inventory)
          </button>
        )}
      </div>
    </div>
  );
}
