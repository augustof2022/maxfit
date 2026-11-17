// Original MaxFit avatar. It grows with the level stage (0-6) and wears gear earned by unlocks.

interface Props {
  stage: number;
  gear: string[];
  color: string;
  size?: number;
  silhouette?: boolean;
}

export function Avatar({ stage, gear, color, size = 120, silhouette = false }: Props) {
  const s = Math.max(0, Math.min(6, stage));
  const shoulder = 22 + s * 4; // half width of shoulders
  const waist = 14 + s * 1.5;
  const arm = 7 + s * 1.2;
  const leg = 9 + s * 1.1;
  const skin = silhouette ? '#2a303b' : '#f1c9a5';
  const suit = silhouette ? '#2a303b' : color;
  const dark = silhouette ? '#2a303b' : '#11141a';
  const has = (g: string) => !silhouette && gear.includes(g);
  const cx = 60;

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Avatar stage ${s + 1}`}>
      <defs>
        <radialGradient id={`aura-${color}`} cx="50%" cy="55%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity=".55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      {has('aura') && <circle cx={cx} cy={64} r={56} fill={`url(#aura-${color})`} />}
      {has('cape') && <path d={`M${cx - shoulder + 4} 44 L${cx + shoulder - 4} 44 L${cx + shoulder + 8} 108 L${cx - shoulder - 8} 108 Z`} fill="#7f1d1d" opacity=".9" />}
      {/* legs */}
      <rect x={cx - waist + 1} y={78} width={leg} height={30} rx={leg / 2} fill={dark} />
      <rect x={cx + waist - leg - 1} y={78} width={leg} height={30} rx={leg / 2} fill={dark} />
      {/* arms */}
      <rect x={cx - shoulder - arm + 3} y={44} width={arm} height={34} rx={arm / 2} fill={skin} />
      <rect x={cx + shoulder - 3} y={44} width={arm} height={34} rx={arm / 2} fill={skin} />
      {has('wristbands') && (
        <>
          <rect x={cx - shoulder - arm + 3} y={68} width={arm} height={5} fill={color} />
          <rect x={cx + shoulder - 3} y={68} width={arm} height={5} fill={color} />
        </>
      )}
      {/* torso */}
      <path d={`M${cx - shoulder} 44 Q${cx} 38 ${cx + shoulder} 44 L${cx + waist} 82 L${cx - waist} 82 Z`} fill={suit} />
      {s >= 2 && !silhouette && <path d={`M${cx} 50 L${cx} 74 M${cx - 9} 58 L${cx + 9} 58 M${cx - 8} 66 L${cx + 8} 66`} stroke={dark} strokeOpacity=".35" strokeWidth="2" />}
      {s >= 4 && !silhouette && <path d={`M${cx - 6} 47 l6 6 l6 -6`} fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="2.5" strokeLinecap="round" />}
      {has('belt') && <rect x={cx - waist - 1} y={76} width={(waist + 1) * 2} height={7} rx={2} fill="#3f2a14" stroke="#c08a3e" />}
      {/* head */}
      <circle cx={cx} cy={28} r={14} fill={skin} />
      {!silhouette && (
        <>
          <path d={`M${cx - 14} 26 Q${cx - 12} 10 ${cx} 12 Q${cx + 13} 11 ${cx + 14} 25 Q${cx + 4} 18 ${cx - 14} 26 Z`} fill={dark} />
          <circle cx={cx - 5} cy={30} r={1.8} fill={dark} />
          <circle cx={cx + 5} cy={30} r={1.8} fill={dark} />
          <path d={s >= 3 ? `M${cx - 5} 36 Q${cx} 39 ${cx + 5} 36` : `M${cx - 4} 36 L${cx + 4} 36`} stroke={dark} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        </>
      )}
      {has('headband') && <rect x={cx - 14} y={21} width={28} height={5} rx={2} fill={color} stroke="#fff" strokeOpacity=".5" />}
      {has('crown') && <path d={`M${cx - 10} 14 L${cx - 10} 5 L${cx - 5} 10 L${cx} 3 L${cx + 5} 10 L${cx + 10} 5 L${cx + 10} 14 Z`} fill="#facc15" stroke="#a16207" />}
    </svg>
  );
}
