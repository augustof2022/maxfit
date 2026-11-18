// Full-screen timer for timed exercises (Renz, 2026-11-18): "3 · 2 · 1 · GO!", then a large clock he
// can read from a distance, with a big STOP that is easy to hit. Stop hands the seconds back (still
// editable before Log). Starting = "working"; Stop = "resting" (the caller switches the session mode).

import { useEffect, useRef, useState } from 'react';
import { beep, buzz } from '../lib/alarm';
import { reducedMotion } from './ui';

function fmt(sec: number, tenths: boolean): string {
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  const ss = tenths ? s.toFixed(1).padStart(4, '0') : String(Math.floor(s)).padStart(2, '0');
  // Whole seconds read as a clock (0:45); a sprint keeps tenths (14.6).
  return m || !tenths ? `${m}:${ss}` : s.toFixed(1);
}

export function TimerOverlay({
  name,
  targetSec,
  fasterWins,
  sound,
  vibrate,
  onGo,
  onStop,
  onCancel,
}: {
  name: string;
  /** The number to beat, in seconds (optional). */
  targetSec?: number;
  /** Faster time wins (a sprint): show tenths, and "beat" means stopping before the target. */
  fasterWins: boolean;
  sound: boolean;
  vibrate: boolean;
  onGo: () => void;
  onStop: (seconds: number) => void;
  onCancel: () => void;
}) {
  const [count, setCount] = useState(3); // 3, 2, 1, 0 = GO!
  const [startAt, setStartAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const goRef = useRef(onGo);
  goRef.current = onGo;
  const stopRef = useRef<HTMLButtonElement>(null);
  const [asking, setAsking] = useState(false);

  // Countdown: one step a second, a short beep on 3-2-1 and a high one on GO.
  useEffect(() => {
    if (startAt !== null) return;
    if (count > 0) {
      if (sound) beep(1, 660);
      const t = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (sound) beep(1, 1320);
    if (vibrate) buzz([120]);
    const t0 = Date.now();
    setStartAt(t0);
    setNow(t0);
    goRef.current();
  }, [count, startAt, sound, vibrate]);

  useEffect(() => {
    if (startAt === null) return;
    stopRef.current?.focus();
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, [startAt]);

  const sec = startAt === null ? 0 : (now - startAt) / 1000;
  const passed = targetSec ? (fasterWins ? false : sec >= targetSec) : false;
  const stop = () => {
    if (startAt === null) return;
    const s = (Date.now() - startAt) / 1000;
    onStop(fasterWins ? Math.round(s * 10) / 10 : Math.round(s));
  };
  const still = reducedMotion();

  return (
    <div className="timer-full" role="dialog" aria-modal="true" aria-label={`${name} timer`}>
      <div className="row between timer-top">
        <span className="tiny">{name}</span>
        {asking ? (
          <div className="row" role="group" aria-label="Cancel the timer?">
            <button className="btn ghost timer-small" onClick={() => setAsking(false)}>
              Keep timing
            </button>
            <button className="btn danger timer-small" onClick={onCancel}>
              Throw away
            </button>
          </div>
        ) : (
          // Before GO, cancel at once; after GO, ask first (the time would be lost).
          <button className="btn ghost timer-small" onClick={() => (startAt === null ? onCancel() : setAsking(true))}>
            ✕ Cancel
          </button>
        )}
      </div>
      {startAt === null ? (
        <div className="timer-count" aria-live="assertive">
          <span key={count} className={still ? '' : 'count-pop'}>
            {count > 0 ? count : 'GO!'}
          </span>
          <span className="small muted">{count > 0 ? 'Get ready' : ''}</span>
        </div>
      ) : (
        <div className="timer-run">
          <div className={`timer-clock num ${passed ? 'passed' : ''}`} aria-live="off">
            {fmt(sec, fasterWins)}
          </div>
          {targetSec ? (
            <span className={`timer-target ${passed ? 'passed' : ''}`}>
              {passed ? '🏆 Past your target! Keep going or stop.' : `${fasterWins ? 'Beat' : 'Target'} ${fmt(targetSec, fasterWins)}${fasterWins ? ' (faster wins)' : ''}`}
            </span>
          ) : null}
        </div>
      )}
      <button ref={stopRef} className="timer-stop" onClick={stop} disabled={startAt === null} aria-label="Stop the timer">
        ■ STOP
      </button>
    </div>
  );
}
