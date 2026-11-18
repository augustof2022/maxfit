// Progress photos (Renz, 2026-11-18): take or pick a photo, choose the stats to show on it,
// pick a look and a size, then save it to the gallery or share it (story / post).
// Every photo is also kept in a timeline on THIS PHONE ONLY (never synced, to save cloud space).

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { EXERCISE_BY_ID } from '../core/exercises';
import { didLines } from '../core/history';
import { fmtClock } from '../core/live';
import { fmtValues } from '../core/measures';
import { AVATAR_STAGES, bmi, COLORS, dayKey, doneSessions } from '../core/rules';
import type { Photo } from '../core/types';
import { db, uid } from '../data/db';
import type { Game } from '../data/useGame';
import { saveFile, shareFile } from '../lib/native';
import { loadImage, renderPhoto, shrink, SIZES, TEMPLATES, type PhotoSize, type PhotoTemplate, type StatLine } from '../lib/photoCard';
import { confirmAsk } from './Confirm';
import { IconBtn, Sheet } from './ui';

/** The workout day a photo is about: today's finished sessions, or else the last one. */
function refDay(game: Game) {
  const today = dayKey(Date.now());
  const done = doneSessions(game.sessions);
  const todays = done.filter((s) => dayKey(s.startedAt) === today);
  const last = done[done.length - 1];
  const ref = todays.length ? todays : last ? [last] : [];
  const ids = new Set(ref.map((s) => s.id));
  return { today: todays.length > 0, ref, sets: game.d!.liveSets.filter((x) => ids.has(x.sessionId)) };
}

/** "I did" lines for the photo, e.g. "Push-ups · 25 reps": every exercise that day, or only the records. */
function didOptions(game: Game, photoAt?: number): Record<'all' | 'records', string[]> {
  const d = game.d!;
  // An older photo gets the lines of its own day, never today's (code review 2026-11-18).
  const day = photoAt !== undefined ? dayKey(photoAt) : null;
  const sets = day && day !== dayKey(Date.now()) ? d.liveSets.filter((x) => dayKey(x.at) === day) : refDay(game).sets;
  const make = (mode: 'all' | 'records') => didLines(sets, mode, d.measuresOf, d.beatOf).map((l) => `${l.name} · ${l.value}`);
  return { all: make('all'), records: make('records') };
}

/** Every stat that can go on a photo, with today's value. Weight and BMI are off by default (private). */
function statOptions(game: Game): (StatLine & { on: boolean })[] {
  const d = game.d!;
  const p = game.profile!;
  const { today, ref, sets: refSets } = refDay(game);
  const todays = today ? ref : [];
  const mins = Math.round(ref.reduce((t, s) => t + s.activeSec + s.restSec, 0) / 60);
  const pr = [...d.liveSets].reverse().find((x) => x.isPR);
  const prEx = pr ? EXERCISE_BY_ID[pr.exerciseId] : null;
  const w = game.weights[game.weights.length - 1];
  const out: (StatLine & { on: boolean })[] = [
    { key: 'streak', label: 'Streak', value: `${d.stats.streak} day${d.stats.streak === 1 ? '' : 's'}`, on: true },
    { key: 'session', label: todays.length ? "Today's workout" : 'Last workout', value: ref.length ? `${mins} min · ${refSets.length} sets` : '—', on: ref.length > 0 },
    { key: 'level', label: 'Level', value: `${d.level} · ${AVATAR_STAGES[d.stage].name}`, on: true },
    { key: 'record', label: prEx ? `Record · ${prEx.name}` : 'Latest record', value: pr && prEx ? fmtValues(d.measuresOf(prEx), pr) : '—', on: !!pr },
    { key: 'sessions', label: 'Sessions', value: String(d.stats.sessions), on: false },
    { key: 'minutes', label: 'Total time', value: fmtClock(d.stats.totalMinutes * 60), on: false },
    { key: 'unlocked', label: 'Exercises unlocked', value: String(d.unlocked.length), on: false },
    { key: 'weight', label: 'Weight', value: w ? `${w.kg} kg` : '—', on: false },
    { key: 'bmi', label: 'BMI', value: w && p.heightCm ? String(bmi(w.kg, p.heightCm)) : '—', on: false },
  ];
  return out.filter((x) => x.value !== '—');
}

export function PhotoJournal({ game }: { game: Game }) {
  const photos = useLiveQuery(() => db.photos.orderBy('at').reverse().toArray(), []) ?? [];
  const [compose, setCompose] = useState<{ file: Blob; photo?: Photo } | null>(null);
  const [view, setView] = useState<Photo | null>(null);
  const [compare, setCompare] = useState<[Photo, Photo] | null>(null);

  const pick = (capture: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) input.setAttribute('capture', 'environment');
    input.onchange = () => {
      const f = input.files?.[0];
      if (f) setCompose({ file: f });
    };
    input.click();
  };

  return (
    <section className="card stack" aria-label="Progress photos">
      <div className="row between">
        <h2>Progress photos</h2>
        <span className="tiny muted">On this phone only</span>
      </div>
      <p className="small muted">Take a photo, put your stats on it, then save or share it as a story or post. Each one is kept here so you can see your change. They are not in the cloud or in backups: tap Save to keep a copy in your gallery.</p>
      <div className="row">
        <button className="btn primary grow" onClick={() => pick(true)}>
          📷 Take photo
        </button>
        <button className="btn ghost grow" onClick={() => pick(false)}>
          🖼️ Choose photo
        </button>
      </div>
      {photos.length > 0 && (
        <div className="photo-grid">
          {photos.map((ph) => (
            <Thumb key={ph.id} photo={ph} onClick={() => setView(ph)} />
          ))}
        </div>
      )}
      {photos.length >= 2 && (
        <button className="btn ghost" onClick={() => setCompare([photos[photos.length - 1], photos[0]])}>
          Compare first and latest
        </button>
      )}

      {compose && <Composer game={game} file={compose.file} photo={compose.photo} onClose={() => setCompose(null)} />}
      {view && (
        <PhotoView
          photo={view}
          onClose={() => setView(null)}
          onEdit={() => {
            setCompose({ file: view.image, photo: view });
            setView(null);
          }}
        />
      )}
      {compare && <CompareView a={compare[0]} b={compare[1]} photos={photos} onClose={() => setCompare(null)} onPick={setCompare} />}
    </section>
  );
}

function useObjectUrl(blob: Blob | null | undefined): string | null {
  const url = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);
  return url;
}

function Thumb({ photo, onClick }: { photo: Photo; onClick: () => void }) {
  const url = useObjectUrl(photo.composite ?? photo.image);
  return (
    <button className="photo-thumb" onClick={onClick} aria-label={`Photo from ${new Date(photo.at).toLocaleDateString()}`}>
      {url && <img src={url} alt="" />}
      <span className="tiny">{new Date(photo.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
    </button>
  );
}

function Composer({ game, file, photo, onClose }: { game: Game; file: Blob; photo?: Photo; onClose: () => void }) {
  const options = useMemo(() => statOptions(game), [game]);
  const fresh = useMemo(() => didOptions(game, photo?.at), [game, photo?.at]);
  // An old photo keeps the "I did" lines it was saved with (they were true that day).
  const kept = photo?.did;
  const [didMode, setDidMode] = useState<'all' | 'records'>(kept?.mode ?? 'all');
  const [didOn, setDidOn] = useState<boolean>(photo ? !!kept : fresh.all.length > 0);
  const didAll = kept ? kept.lines : fresh[didMode];
  const did = useMemo(() => (didOn ? didAll : []), [didOn, didAll]);
  const isToday = useMemo(() => refDay(game).today, [game]);
  const [img, setImg] = useState<ImageBitmap | HTMLImageElement | null>(null);
  const [template, setTemplate] = useState<PhotoTemplate>((photo?.template as PhotoTemplate) ?? 'clean');
  const [size, setSize] = useState<PhotoSize>(photo?.size ?? 'story');
  const [on, setOn] = useState<string[]>(photo ? photo.stats.map((s) => s.key) : options.filter((o) => o.on).map((o) => o.key));
  const [note, setNote] = useState(photo?.note ?? '');
  const [out, setOut] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const preview = useObjectUrl(out);
  const at = photo?.at ?? Date.now();
  const accent = COLORS.find((c) => c.id === game.profile!.color)?.hex ?? '#ff7a1a';

  // When editing an old photo, keep the numbers it had then (they were true on that day).
  const lines: StatLine[] = useMemo(() => {
    const pool = photo ? [...photo.stats, ...options.filter((o) => !photo.stats.some((s) => s.key === o.key))] : options;
    return on.map((k) => pool.find((o) => o.key === k)).filter((x): x is StatLine => !!x).map(({ key, label, value }) => ({ key, label, value }));
  }, [on, options, photo]);

  useEffect(() => {
    let live = true;
    loadImage(file)
      .then((i) => live && setImg(i))
      .catch(() => setErr('Could not open this photo. Try another one.'));
    return () => {
      live = false;
    };
  }, [file]);

  useEffect(() => {
    if (!img) return;
    let live = true;
    const t = setTimeout(() => {
      void renderPhoto(img, {
        template,
        size,
        stats: lines,
        note: note.trim(),
        date: new Date(at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        accent,
        did,
        didTitle: (kept?.mode ?? didMode) === 'records' ? 'I DID · NEW RECORDS' : 'I DID',
      }).then((b) => live && setOut(b));
    }, 120);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [img, template, size, lines, note, at, accent, did, didMode, kept]);

  /** Save to the on-phone timeline (once; later taps update the same entry). */
  const log = async (composite: Blob): Promise<void> => {
    const image = photo?.image ?? (await shrink(img!));
    await db.photos.put({ id: photo?.id ?? savedId, at, image, composite, template, size, stats: lines, note: note.trim(), did: did.length ? { mode: kept?.mode ?? didMode, lines: did } : undefined, updatedAt: Date.now() });
  };
  const [savedId] = useState(() => uid());

  const act = async (kind: 'save' | 'share') => {
    if (!out || busy) return;
    if (photo && !(await confirmAsk({ title: 'Save changes to this photo?', body: 'The stats and look on it are replaced.', ok: 'Save' }))) return;
    setBusy(true);
    setErr(null);
    try {
      await log(out);
      const name = `maxfit-${dayKey(at)}-${template}-${size}.jpg`;
      if (kind === 'save') {
        setErr(await saveFile(out, name, 'pictures'));
      } else {
        await shareFile(out, name, 'Training with MaxFit 💪');
      }
    } catch (e) {
      const m = (e as Error).message;
      if (!/cancel|abort/i.test(m)) setErr(m);
    } finally {
      setBusy(false);
    }
  };

  const ratio = SIZES[size].h / SIZES[size].w;
  return (
    <Sheet onClose={onClose}>
      <h2>{photo ? 'Edit photo' : 'New progress photo'}</h2>
      <div className="photo-preview" style={{ aspectRatio: `1 / ${ratio}`, width: `min(100%, calc(52dvh / ${ratio}))` }}>
        {preview ? <img src={preview} alt="Preview with your stats" /> : <span className="muted small">{err ?? 'Preparing…'}</span>}
      </div>
      <div className="seg" role="radiogroup" aria-label="Size">
        {(Object.keys(SIZES) as PhotoSize[]).map((k) => (
          <button key={k} role="radio" aria-checked={size === k} className={`chip ${size === k ? 'on' : ''}`} onClick={() => setSize(k)}>
            {SIZES[k].label}
          </button>
        ))}
      </div>
      <div className="seg" role="radiogroup" aria-label="Look">
        {TEMPLATES.map((t) => (
          <button key={t.id} role="radio" aria-checked={template === t.id} className={`chip ${template === t.id ? 'on' : ''}`} onClick={() => setTemplate(t.id)}>
            {t.name}
          </button>
        ))}
      </div>
      <span className="tiny muted">Stats on the photo (up to 6)</span>
      <div className="row wrap" role="group" aria-label="Stats">
        {(photo ? [...photo.stats, ...options.filter((o) => !photo.stats.some((s) => s.key === o.key))] : options).map((o) => (
          <button
            key={o.key}
            className={`chip ${on.includes(o.key) ? 'on' : ''}`}
            aria-pressed={on.includes(o.key)}
            onClick={() => setOn((cur) => (cur.includes(o.key) ? cur.filter((k) => k !== o.key) : cur.length >= 6 ? cur : [...cur, o.key]))}
          >
            {o.label}
          </button>
        ))}
      </div>
      {didAll.length > 0 || fresh.all.length > 0 ? (
        <div className="stack" style={{ gap: 6 }}>
          <button className={`chip ${didOn ? 'on' : ''}`} aria-pressed={didOn} onClick={() => setDidOn((v) => !v)} style={{ alignSelf: 'flex-start' }}>
            {didOn ? '✓ ' : ''}"I did" list on the photo
          </button>
          {didOn && !kept && (
            <div className="seg" role="radiogroup" aria-label="I did: which exercises">
              <button role="radio" aria-checked={didMode === 'all'} className={`chip ${didMode === 'all' ? 'on' : ''}`} onClick={() => setDidMode('all')}>
                {isToday ? 'All exercises today' : 'All exercises (last workout)'}
              </button>
              <button role="radio" aria-checked={didMode === 'records'} aria-disabled={fresh.records.length === 0} disabled={fresh.records.length === 0} className={`chip ${didMode === 'records' ? 'on' : ''}`} onClick={() => setDidMode('records')}>
                Only records
              </button>
            </div>
          )}
          {didOn && !kept && fresh.records.length === 0 && <span className="tiny muted did-note">No records that day, so "Only records" is off.</span>}
          {didOn && kept && <span className="tiny muted did-note">Kept as saved on that day.</span>}
          {didOn && <span className="tiny muted did-note">{didAll.length} exercise{didAll.length === 1 ? '' : 's'}{didAll.length > 6 ? ' (the photo shows up to 6)' : ''}</span>}
        </div>
      ) : null}
      <label className="field">
        Caption (optional)
        <input className="input" maxLength={40} value={note} placeholder="e.g. Week 4. Still showing up." onChange={(e) => setNote(e.target.value)} />
      </label>
      {err && <p className="small banner">{err}</p>}
      <div className="row sheet-footer">
        <button className="btn ghost" onClick={onClose}>
          Close
        </button>
        <button className="btn ghost grow" onClick={() => act('save')} disabled={!out || busy}>
          ⬇ Save
        </button>
        <button className="btn primary grow" onClick={() => act('share')} disabled={!out || busy}>
          ↗ Share
        </button>
      </div>
      <p className="tiny muted" style={{ textTransform: 'none', letterSpacing: 0 }}>
        Share opens your phone's menu: pick Instagram, then Story or Post. Weight and BMI are off unless you tick them.
      </p>
    </Sheet>
  );
}

function PhotoView({ photo, onClose, onEdit }: { photo: Photo; onClose: () => void; onEdit: () => void }) {
  const url = useObjectUrl(photo.composite ?? photo.image);
  const [msg, setMsg] = useState<string | null>(null);
  const name = `maxfit-${dayKey(photo.at)}.jpg`;
  return (
    <Sheet onClose={onClose}>
      <div className="row between">
        <h2>{new Date(photo.at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h2>
        <IconBtn label="Edit photo" onClick={onEdit}>
          ✎ Edit
        </IconBtn>
      </div>
      <div className="photo-preview" style={{ aspectRatio: `1 / ${SIZES[photo.size].h / SIZES[photo.size].w}`, width: `min(100%, calc(60dvh / ${SIZES[photo.size].h / SIZES[photo.size].w}))` }}>
        {url && <img src={url} alt="Progress photo" />}
      </div>
      {msg && <p className="small banner">{msg}</p>}
      <div className="row">
        <button
          className="btn danger"
          onClick={async () => {
            if (!(await confirmAsk({ title: 'Delete this photo?', body: 'It is removed from MaxFit. A copy you saved to the gallery stays there.', ok: 'Delete', danger: true }))) return;
            await db.photos.delete(photo.id);
            onClose();
          }}
        >
          Delete
        </button>
        <button className="btn ghost grow" onClick={async () => setMsg(await saveFile(photo.composite ?? photo.image, name, 'pictures').catch((e) => (e as Error).message))}>
          ⬇ Save
        </button>
        <button className="btn primary grow" onClick={() => void shareFile(photo.composite ?? photo.image, name).catch(() => undefined)}>
          ↗ Share
        </button>
      </div>
    </Sheet>
  );
}

function CompareView({ a, b, photos, onClose, onPick }: { a: Photo; b: Photo; photos: Photo[]; onClose: () => void; onPick: (p: [Photo, Photo]) => void }) {
  const ua = useObjectUrl(a.image);
  const ub = useObjectUrl(b.image);
  const days = Math.round((b.at - a.at) / 86_400_000);
  return (
    <Sheet onClose={onClose}>
      <h2>Then and now</h2>
      <p className="small muted">{days} days apart</p>
      <div className="compare">
        {[
          [a, ua],
          [b, ub],
        ].map(([p, u], i) => (
          <figure key={i}>
            {u && <img src={u as string} alt="" />}
            <figcaption className="tiny">{new Date((p as Photo).at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</figcaption>
          </figure>
        ))}
      </div>
      <label className="field">
        Compare with
        <select className="input" value={a.id} onChange={(e) => onPick([photos.find((p) => p.id === e.target.value)!, b])}>
          {photos.filter((p) => p.id !== b.id).map((p) => (
            <option key={p.id} value={p.id}>
              {new Date(p.at).toLocaleDateString()}
            </option>
          ))}
        </select>
      </label>
      <button className="btn ghost" onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
}
