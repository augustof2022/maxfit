// Records and history everywhere (Renz, 2026-11-18): every exercise row shows Last and Best;
// tapping it opens its history — each day with the best set that day, records marked, and a trend chart.

import { useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { fmtDay, fmtRecord, lastBestText } from '../core/format';
import { chartPoint, historyByDay } from '../core/history';
import { fmtValues, MEASURES } from '../core/measures';
import type { Exercise } from '../core/types';
import type { Game } from '../data/useGame';
import { LineChart, Sheet } from './ui';
import { ChevronRight, ExIcon, Ico, Trophy, X } from './Icon';

/** One exercise row: icon, name, "Last … · Best …". Tap = history. */
export function ExerciseRow({ game, ex, onOpen, extra }: { game: Game; ex: Exercise; onOpen: (ex: Exercise) => void; extra?: string }) {
  const d = game.d!;
  const ms = d.measuresOf(ex);
  const rec = d.stats.records.get(ex.id);
  return (
    <button className="ex-row" onClick={() => onOpen(ex)} aria-label={`${ex.name} history`}>
      <ExIcon ms={ms} exerciseId={ex.id} />
      <span className="meta grow" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <b>
          {ex.name}
          {extra && <span className="small muted"> · {extra}</span>}
        </b>
        <span className="small muted num">{lastBestText(ms, rec)}</span>
      </span>
      <Ico as={ChevronRight} className="chev" style={{ color: 'var(--text-3)' }} />
    </button>
  );
}

/** Exercises with at least one logged set, most recently done first. */
export function doneExercises(game: Game): Exercise[] {
  const last = new Map<string, number>();
  for (const s of game.d!.liveSets) if ((last.get(s.exerciseId) ?? 0) < s.at) last.set(s.exerciseId, s.at);
  return [...last.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => EXERCISE_BY_ID[id])
    .filter((e): e is Exercise => !!e);
}

/** "Exercises you've done" list with Last / Best and history on tap. */
export function DoneExercises({ game, limit, title = "Exercises you've done", filter }: { game: Game; limit?: number; title?: string; filter?: (e: Exercise) => boolean }) {
  const [open, setOpen] = useState<Exercise | null>(null);
  const [all, setAll] = useState(false);
  const list = doneExercises(game).filter((e) => !filter || filter(e));
  const shown = limit && !all ? list.slice(0, limit) : list;
  return (
    <section className="group" aria-label={title}>
      <div className="group-head">
        <h2>{title}</h2>
        {limit && list.length > limit ? (
          <button className="btn quiet" onClick={() => setAll(!all)}>
            {all ? 'Show less' : `Show all ${list.length}`}
          </button>
        ) : (
          list.length > 0 && <span className="small muted num">{list.length}</span>
        )}
      </div>
      <div className="list">
        {list.length === 0 && <p className="empty">Nothing logged yet. Start a session and log one set: it shows up here with your record.</p>}
        {shown.map((e) => (
          <ExerciseRow key={e.id} game={game} ex={e} onOpen={setOpen} />
        ))}
      </div>
      {open && <HistorySheet game={game} ex={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

/** One exercise's history: summary, trend chart (records ringed) and the best set of each day. */
export function HistorySheet({ game, ex, onClose }: { game: Game; ex: Exercise; onClose: () => void }) {
  const d = game.d!;
  const ms = d.measuresOf(ex);
  const beat = d.beatOf(ex);
  const rec = d.stats.records.get(ex.id);
  const days = historyByDay(d.liveSets, ex.id, ms, beat);
  const shownMs = beat.kind === 'same' ? [beat.fixed, beat.beat] : ms;
  const pts = [...days].reverse().slice(-30);
  const first = pts[0] ? chartPoint(pts[0].best, ms, beat) : null;
  const unitLabel = first ? MEASURES.find((m) => m.id === first.measure)!.label : '';
  return (
    <Sheet onClose={onClose}>
      <div className="sheet-title">
        <ExIcon ms={ms} exerciseId={ex.id} />
        <h2>{ex.name}</h2>
        <button className="btn secondary icon-btn" onClick={onClose}>
          <Ico as={X} size={18} />
          Close
        </button>
      </div>
      <div className="beat">
        <div>
          <span className="tiny muted">Last</span>
          <b className="num">{rec?.last ? fmtValues(shownMs, rec.last, true) : '-'}</b>
        </div>
        <div className="target">
          <span className="tiny muted">Best</span>
          <b className="num">{rec?.bestSet ? fmtValues(beat.kind === 'same' ? [beat.beat] : ms, rec.bestSet, true) : '-'}</b>
        </div>
        <div>
          <span className="tiny muted">Days</span>
          <b className="num">{days.length}</b>
        </div>
      </div>
      {rec?.bestSet && <p className="small muted">Record: {fmtRecord(ms, rec)}</p>}
      <div className="stack" style={{ gap: 4 }}>
        <span className="note">
          Trend · {unitLabel} (best set of each day){days.some((x) => x.record) ? ' · ringed = record day' : ''}
        </span>
        <LineChart points={pts.map((x) => ({ label: fmtDay(x.date), v: chartPoint(x.best, ms, beat).v }))} marks={pts.map((x) => x.record)} unit={first?.unit ?? ''} empty="Do it on 2 or more days to see your trend." />
      </div>
      <div className="list" role="list" aria-label={`${ex.name} by day`}>
        {days.length === 0 && <p className="empty">Not done yet. Log a set and it shows up here.</p>}
        {days.map((x) => (
          <div key={x.date} role="listitem" className="hist-row">
            <span>{fmtDay(x.date, true)}</span>
            <span className="num">
              <b>{fmtValues(shownMs, x.best)}</b> {x.record && (
                <span className="badge pr">
                  <Ico as={Trophy} size={12} />
                  Record
                </span>
              )}
            </span>
            <span className="muted num">
              {x.sets} {x.sets === 1 ? 'set' : 'sets'}
            </span>
          </div>
        ))}
      </div>
    </Sheet>
  );
}
