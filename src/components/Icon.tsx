// One icon system (round 5, impeccable craft floor: no emoji standing in for icons).
// Lucide (ISC licence): one stroke weight, drawn SVG, tree-shaken. Use these helpers so size and
// stroke stay the same everywhere.

import type { LucideIcon, LucideProps } from 'lucide-react';
import { Bike, Dumbbell, Footprints, House, MapPin, Repeat, Timer, Trees, Weight, Zap } from 'lucide-react';
import type { Location, Measure } from '../core/types';

export * from 'lucide-react';

/** Default size 20, stroke 2. Decorative unless a label is given. */
export function Ico({ as: Cmp, size = 20, label, ...rest }: { as: LucideIcon; size?: number; label?: string } & Omit<LucideProps, 'ref'>) {
  return <Cmp size={size} strokeWidth={2} aria-hidden={label ? undefined : true} aria-label={label} role={label ? 'img' : undefined} {...rest} />;
}

/** The icon for how an exercise is measured (replaces the old emoji). */
export function measureIcon(ms: Measure[]): LucideIcon {
  if (ms.includes('distance')) return Footprints;
  if (ms.includes('speed')) return Zap;
  if (ms.includes('weight')) return Dumbbell;
  if (ms[0] === 'time') return Timer;
  return Repeat;
}

/** An exercise's icon in a rounded tile. */
export function ExIcon({ ms, size = 'md', exerciseId }: { ms: Measure[]; size?: 'md' | 'sm'; exerciseId?: string }) {
  const Cmp = exerciseId && /bike|cycle/.test(exerciseId) ? Bike : exerciseId && /kettlebell|barbell|deadlift|bench|press/.test(exerciseId) && ms.includes('weight') ? Weight : measureIcon(ms);
  return (
    <span className={`ico ${size === 'sm' ? 'sm' : ''}`} aria-hidden>
      <Cmp size={size === 'sm' ? 18 : 20} strokeWidth={2} />
    </span>
  );
}

export function placeIcon(kind: Location['kind']): LucideIcon {
  return kind === 'home' ? House : kind === 'gym' ? Dumbbell : kind === 'outdoor' ? Trees : MapPin;
}

export function PlaceIcon({ kind, size = 18 }: { kind: Location['kind']; size?: number }) {
  const Cmp = placeIcon(kind);
  return <Cmp size={size} strokeWidth={2} aria-hidden />;
}
