// Rest alarm sound + vibration, and keeping the screen on during a session.

let ctx: AudioContext | null = null;

/** Call from a tap first (browsers only allow sound after a user gesture). */
export function primeAudio() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    /* no audio */
  }
}

export function beep(times = 3, freq = 880) {
  try {
    ctx ??= new AudioContext();
    const c = ctx;
    for (let i = 0; i < times; i++) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      const t = c.currentTime + i * 0.35;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + 0.3);
    }
  } catch {
    /* no audio */
  }
}

export function buzz(pattern: number[] = [300, 150, 300, 150, 300]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no vibration */
  }
}

export function alarm(opts: { sound: boolean; vibrate: boolean }) {
  if (opts.sound) beep();
  if (opts.vibrate) buzz();
}

let lock: { release: () => Promise<void> } | null = null;

export async function keepAwake(on: boolean) {
  try {
    if (on && !lock && 'wakeLock' in navigator) lock = await (navigator as any).wakeLock.request('screen');
    if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    /* not supported or denied */
  }
}
