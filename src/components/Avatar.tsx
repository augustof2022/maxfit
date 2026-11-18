// Original MaxFit avatar: one jointed figure (shoulders, elbows, hips, knees) that really moves —
// runs in place, walks, does jumping jacks, squats, presses, pulls and celebrates.
// Three looks share the same joints (Renz picked "propose 3", 2026-11-18): athlete, line, buddy.
// It grows with the level stage (0-6) and wears gear earned by unlocks.
// Female (Profile.gender, 2026-11-18): same joints, gear and motion; narrower shoulders, a defined
// waist, slightly wider hips and shoulder-length hair.
// Motion is CSS (see .av-* in styles.css): calm loops, eased; off when the phone asks for reduced motion.

import '../styles-extra.css';
import { useEffect, useId, useState, type CSSProperties } from 'react';
import type { AvatarStyle, Gender } from '../core/types';

export type AvatarAction = 'idle' | 'walk' | 'run' | 'jump' | 'squat' | 'press' | 'pull' | 'celebrate' | 'still' | 'life' | 'demo';

export const AVATAR_STYLES: { id: AvatarStyle; name: string; blurb: string }[] = [
  { id: 'athlete', name: 'Athlete', blurb: 'Clean, solid, sporty' },
  { id: 'line', name: 'Neon line', blurb: 'Minimal glowing lines' },
  { id: 'buddy', name: 'Buddy', blurb: 'Round game mascot' },
];

/** Which move the avatar shows for an exercise (by id), while you train it. */
export function actionFor(exerciseId: string | null | undefined): AvatarAction {
  if (!exerciseId) return 'idle';
  if (/run|knee|treadmill|bike|march|mountain|bear|shadow/.test(exerciseId)) return 'run';
  if (/jump|jack|burpee|skater|rope/.test(exerciseId)) return 'jump';
  if (/squat|lunge|split|wall_sit|leg_press|deadlift|rdl|bridge/.test(exerciseId)) return 'squat';
  if (/pull|row|hang|lat_|muscle/.test(exerciseId)) return 'pull';
  if (/push|press|dip|bench|curl/.test(exerciseId)) return 'press';
  return 'idle';
}

// "life": everyday loop on Home (mostly calm, sometimes a move). "demo": shows every move.
const LIFE: AvatarAction[] = ['idle', 'idle', 'walk', 'idle', 'jump', 'idle', 'squat', 'walk'];
const DEMO: AvatarAction[] = ['run', 'jump', 'squat', 'press', 'pull', 'celebrate'];

function useCycle(action: AvatarAction): Exclude<AvatarAction, 'life' | 'demo'> {
  const list = action === 'life' ? LIFE : action === 'demo' ? DEMO : null;
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!list) return;
    const t = setInterval(() => setI((x) => (x + 1) % list.length), action === 'demo' ? 2600 : 3600);
    return () => clearInterval(t);
  }, [list, action]);
  return (list ? list[i % list.length] : action) as Exclude<AvatarAction, 'life' | 'demo'>;
}

interface Props {
  stage: number;
  gear: string[];
  color: string;
  size?: number;
  silhouette?: boolean;
  style?: AvatarStyle;
  action?: AvatarAction;
  gender?: Gender;
}

export function Avatar({ stage, gear, color, size = 120, silhouette = false, style = 'athlete', action = 'idle', gender = 'male' }: Props) {
  const uid = useId().replace(/:/g, '');
  const act = useCycle(silhouette ? 'still' : action);
  const s = Math.max(0, Math.min(6, stage));
  const buddy = style === 'buddy';
  const line = style === 'line';

  // Body grows with the stage.
  const fem = gender === 'female';
  const sw = fem ? 10.5 + s * 1.25 : 12 + s * 1.7; // half shoulder width
  const waist = 8.5 + s * 0.7; // male: width at the hips
  const fWaist = 6.6 + s * 0.45; // female: narrowest point
  const fHip = 9.6 + s * 0.6; // female: hip width
  const hipW = fem ? 5.2 + s * 0.45 : 4.5 + s * 0.4;
  const armW = (buddy ? 7 : 5.5) + s * (fem ? 0.4 : 0.6) - (fem ? 0.6 : 0);
  const legW = (buddy ? 8.5 : 7) + s * 0.6 - (fem ? 0.3 : 0);
  const headR = buddy ? 15 : 9.5;
  const headY = buddy ? 25 : 31;
  const neckY = 44;
  const hipY = 70;
  const kneeY = buddy ? 88 : 90;
  const footY = 110;
  const elbowDy = 16;
  const handDy = 31;

  const skin = silhouette ? '#2a303b' : '#f1c9a5';
  const suit = silhouette ? '#2a303b' : color;
  const dark = silhouette ? '#2a303b' : '#151a22';
  const hair = silhouette ? '#2a303b' : '#2b1d14';
  const gold = '#ffd166';
  const has = (g: string) => !silhouette && gear.includes(g);

  // Line style: strokes only, with a soft glow.
  const L = line && !silhouette;
  const stroke = (c: string, w: number) => (L ? { stroke: color, strokeWidth: 3, fill: 'none' } : { stroke: c, strokeWidth: w, fill: 'none' });
  const fill = (c: string) => (L ? { fill: 'none', stroke: color, strokeWidth: 2.6 } : { fill: c });

  // Torso outline. Male: a taper from shoulders to hips. Female: shoulders in to a waist, out to the hips.
  const wY = neckY + 15;
  const torso = fem
    ? `M${60 - sw} ${neckY + 3} Q60 ${neckY - 2} ${60 + sw} ${neckY + 3} Q${60 + sw - 0.5} ${wY - 7} ${60 + fWaist} ${wY} Q${60 + fWaist - 0.5} ${hipY - 7} ${60 + fHip} ${hipY + 1} Q60 ${hipY + 4} ${60 - fHip} ${hipY + 1} Q${60 - fWaist + 0.5} ${hipY - 7} ${60 - fWaist} ${wY} Q${60 - sw + 0.5} ${wY - 7} ${60 - sw} ${neckY + 3} Z`
    : `M${60 - sw} ${neckY + 3} Q60 ${neckY - 2} ${60 + sw} ${neckY + 3} L${60 + waist} ${hipY + 1} Q60 ${hipY + 4} ${60 - waist} ${hipY + 1} Z`;
  // Buddy female: a soft pear shape (narrower top, fuller bottom).
  const bt = neckY - 1;
  const bb = hipY + 5;
  const bm = (bt + bb) / 2 + 3;
  const buddyFem = `M60 ${bt} C${60 + sw + 1} ${bt} ${60 + sw - 1} ${bm - 8} ${60 + sw + 3} ${bm + 2} C${60 + sw + 5} ${bb - 1} ${60 + 6} ${bb} 60 ${bb} C${60 - 6} ${bb} ${60 - sw - 5} ${bb - 1} ${60 - sw - 3} ${bm + 2} C${60 - sw + 1} ${bm - 8} ${60 - sw - 1} ${bt} 60 ${bt} Z`;
  // Female hair: shoulder-length, behind the head (drawn first so the face sits on top).
  const hr = headR + 1.6;
  const hb = headY + headR + (buddy ? 1 : 3.5);
  const backHair = `M${60 - hr + 0.4} ${hb} Q${60 - hr - 1.2} ${headY} ${60 - hr} ${headY - 2} A${hr} ${hr} 0 0 1 ${60 + hr} ${headY - 2} Q${60 + hr + 1.2} ${headY} ${60 + hr - 0.4} ${hb}`;

  const j = (x: number, y: number, d = 1): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, ['--d' as string]: d });

  const arm = (side: 'l' | 'r') => {
    const d = side === 'l' ? 1 : -1;
    const sx = 60 - d * sw;
    const ex = sx - d * 3;
    const hx = ex - d * 1;
    return (
      <g className={`j-arm ${side}`} style={j(sx, 47, d)}>
        <line x1={sx} y1={47} x2={ex} y2={47 + elbowDy} {...stroke(L ? color : skin, armW)} strokeLinecap="round" />
        {!L && !silhouette && <line x1={sx} y1={47} x2={sx - d * 1} y2={53} stroke={suit} strokeWidth={armW + 1.5} strokeLinecap="round" />}
        <g className="j-fore" style={j(ex, 47 + elbowDy, d)}>
          <line x1={ex} y1={47 + elbowDy} x2={hx} y2={47 + handDy} {...stroke(L ? color : skin, armW - 0.5)} strokeLinecap="round" />
          {L && <circle cx={hx} cy={47 + handDy} r={2.4} fill={color} />}
          {has('wristbands') && <line x1={hx + d * 0.2} y1={47 + handDy - 6} x2={hx} y2={47 + handDy - 3} stroke={gold} strokeWidth={armW + 1} strokeLinecap="butt" />}
        </g>
        {L && <circle cx={ex} cy={47 + elbowDy} r={2} fill={color} />}
      </g>
    );
  };

  const leg = (side: 'l' | 'r') => {
    const d = side === 'l' ? 1 : -1;
    const hx = 60 - d * hipW;
    const kx = hx - d * 1;
    return (
      <g className={`j-leg ${side}`} style={j(hx, hipY, d)}>
        <g className="j-thigh" style={j(hx, hipY, d)}>
          <line x1={hx} y1={hipY} x2={kx} y2={kneeY} {...stroke(L ? color : dark, legW)} strokeLinecap="round" />
          <g className="j-shin" style={j(kx, kneeY, d)}>
            <line x1={kx} y1={kneeY} x2={kx} y2={footY - 3} {...stroke(L ? color : skin, legW - 1.5)} strokeLinecap="round" />
            {L ? <line x1={kx} y1={footY - 1} x2={kx - d * 6} y2={footY - 1} stroke={color} strokeWidth={3} strokeLinecap="round" /> : <ellipse cx={kx - d * 2.5} cy={footY - 1} rx={buddy ? 7 : 6} ry={3.4} fill={silhouette ? '#2a303b' : '#e8ecf3'} />}
            {L && <circle cx={kx} cy={kneeY} r={2} fill={color} />}
          </g>
        </g>
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Avatar, stage ${s + 1}${act !== 'still' && act !== 'idle' ? `, doing ${act}` : ''}`} className={`av av-${act} av-${style}`}>
      <defs>
        <radialGradient id={`aura-${uid}`} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity=".5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`shade-${uid}`} x1="0" x2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".2" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {has('aura') && <ellipse className="j-aura" cx="60" cy="66" rx="50" ry="54" fill={`url(#aura-${uid})`} />}
      <ellipse className="j-shadow" cx="60" cy="112" rx={16 + s} ry="3.2" fill="#000" opacity=".35" />

      <g className="j-root" filter={L ? `url(#glow-${uid})` : undefined}>
        {has('cape') && <path className="j-cape" style={j(60, neckY)} d={`M${60 - sw + 2} ${neckY + 2} L${60 + sw - 2} ${neckY + 2} L${60 + sw + 6} 96 Q60 101 ${60 - sw - 6} 96 Z`} fill={L ? 'none' : '#7f1d1d'} stroke={L ? color : 'none'} strokeWidth={L ? 2 : 0} opacity={L ? 0.6 : 1} />}
        {leg('l')}
        {leg('r')}

        <g className="j-torso" style={j(60, hipY)}>
          {buddy ? (
            fem ? <path d={buddyFem} {...fill(suit)} /> : <ellipse cx="60" cy={(neckY + hipY) / 2 + 2} rx={sw + 1} ry={(hipY - neckY) / 2 + 3} {...fill(suit)} />
          ) : (
            <path d={torso} {...fill(suit)} strokeLinejoin="round" />
          )}
          {!L && !silhouette && !buddy && <path d={torso} fill={`url(#shade-${uid})`} />}
          {!L && !silhouette && s >= 2 && !buddy && <path d={`M60 ${neckY + 6} L60 ${hipY - 4}`} stroke="#000" strokeOpacity=".18" strokeWidth="1.2" />}
          {L && <line x1="60" y1={neckY} x2="60" y2={hipY} stroke={color} strokeWidth="1.4" opacity=".5" />}
          {has('belt') && <rect x={60 - (fem ? fHip - 1.5 : waist) - 1} y={hipY - 5} width={((fem ? fHip - 1.5 : waist) + 1) * 2} height="5" rx="1.5" fill={L ? 'none' : '#3b2a1a'} stroke={gold} strokeWidth={L ? 1.6 : 1} />}
        </g>

        {arm('l')}
        {arm('r')}

        <g className="j-head" style={j(60, neckY)}>
          {fem && (L ? <path d={backHair} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" opacity={0.85} /> : <path d={`${backHair} Q60 ${hb + 2.5} ${60 - hr + 0.4} ${hb} Z`} fill={hair} />)}
          {!buddy && <line x1="60" y1={neckY + 2} x2="60" y2={headY + headR - 2} {...stroke(L ? color : skin, fem ? 4.2 : 5)} strokeLinecap="round" />}
          <circle cx="60" cy={headY} r={headR} {...fill(skin)} />
          {!L && !silhouette && !fem && <path d={`M${60 - headR} ${headY - 1} Q${60 - headR + 1} ${headY - headR - 3} 60 ${headY - headR - 1} Q${60 + headR - 1} ${headY - headR - 3} ${60 + headR} ${headY - 1} Q60 ${headY - headR + 4} ${60 - headR} ${headY - 1} Z`} fill={hair} />}
          {!L && !silhouette && fem && <path d={`M${60 - headR - 0.6} ${headY + 2} Q${60 - headR} ${headY - headR - 2} 60 ${headY - headR - 1.2} Q${60 + headR} ${headY - headR - 2} ${60 + headR + 0.6} ${headY + 2} Q${60 + headR * 0.55} ${headY - headR * 0.55} ${60 - headR * 0.15} ${headY - headR * 0.42} Q${60 - headR * 0.7} ${headY - headR * 0.3} ${60 - headR - 0.6} ${headY + 2} Z`} fill={hair} />}
          {!silhouette && (
            <g className="j-eyes" style={j(60, headY + (buddy ? 2 : 1))}>
              <circle cx={60 - headR * 0.38} cy={headY + (buddy ? 2 : 1)} r={buddy ? 2.6 : 1.4} fill={L ? color : dark} />
              <circle cx={60 + headR * 0.38} cy={headY + (buddy ? 2 : 1)} r={buddy ? 2.6 : 1.4} fill={L ? color : dark} />
              {buddy && !L && (
                <>
                  <circle cx={60 - headR * 0.38 + 0.9} cy={headY + 1.1} r=".9" fill="#fff" />
                  <circle cx={60 + headR * 0.38 + 0.9} cy={headY + 1.1} r=".9" fill="#fff" />
                </>
              )}
            </g>
          )}
          {buddy && !L && !silhouette && (
            <>
              <ellipse cx={60 - headR * 0.62} cy={headY + 6} rx="2.6" ry="1.5" fill="#fb7185" opacity=".45" />
              <ellipse cx={60 + headR * 0.62} cy={headY + 6} rx="2.6" ry="1.5" fill="#fb7185" opacity=".45" />
            </>
          )}
          {!silhouette && <path d={`M${60 - 2.4} ${headY + (buddy ? 7 : 4.5)} Q60 ${headY + (buddy ? 9 : 6.3)} ${60 + 2.4} ${headY + (buddy ? 7 : 4.5)}`} stroke={L ? color : dark} strokeWidth="1.2" fill="none" strokeLinecap="round" />}
          {has('headband') && <rect x={60 - headR} y={headY - headR * 0.55} width={headR * 2} height="3.2" rx="1.2" fill={L ? 'none' : '#ef4444'} stroke={L ? gold : 'none'} strokeWidth="1.4" />}
          {has('crown') && <path d={`M${60 - 8} ${headY - headR - 1} L${60 - 9} ${headY - headR - 9} L${60 - 4} ${headY - headR - 5} L60 ${headY - headR - 11} L${60 + 4} ${headY - headR - 5} L${60 + 9} ${headY - headR - 9} L${60 + 8} ${headY - headR - 1} Z`} fill={L ? 'none' : gold} stroke={gold} strokeWidth={L ? 1.6 : 0.6} />}
        </g>
      </g>
    </svg>
  );
}
