import { describe, expect, it } from 'vitest';
import { newLive, switchMode, totals } from './live';

const MIN = 60_000;
describe('live clock', () => {
  it('banks time per mode', () => {
    let l = newLive(0);
    l = switchMode(l, 'rest', 5 * MIN);
    const t = totals(l, 7 * MIN);
    expect(t.exercise).toBe(300);
    expect(t.rest).toBe(120);
  });
  it('a forgotten rest counts at most 30 minutes', () => {
    const l = switchMode(newLive(0), 'rest', 0);
    expect(totals(switchMode(l, 'exercise', 13 * 60 * MIN), 13 * 60 * MIN).rest).toBe(1800);
  });
  it('a long run is not cut at 30 minutes', () => {
    const l = switchMode(newLive(0), 'run', 0);
    expect(totals(l, 75 * MIN).run).toBe(4500);
  });
});
