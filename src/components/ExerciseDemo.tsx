// "How to do it" for one exercise (Renz, 2026-11-18: "I hope each exercise has video samples or animations").
// 1) Two real photos (start and finish) that fade into each other, from free-exercise-db (public domain),
//    bundled in the app so they work offline. 2) The avatar doing the exercise. 3) The safe cue.
// 4) "Watch on YouTube" opens a YouTube search for the exercise (no hand-picked links that could break).

import { useLiveQuery } from 'dexie-react-hooks';
import { EXERCISE_BY_ID } from '../core/exercises';
import { equipmentName } from '../core/equipment';
import { COLORS } from '../core/rules';
import type { Exercise } from '../core/types';
import { db } from '../data/db';
import { Avatar, actionFor } from './Avatar';
import { Sheet } from './ui';
import { CirclePlay, Ico, Lightbulb, TriangleAlert } from './Icon';

export function ExerciseDemo({ ex, onClose, known }: { ex: Exercise; onClose: () => void; known: (id: string) => boolean }) {
  const p = useLiveQuery(() => db.profile.get('me'), []);
  const color = COLORS.find((c) => c.id === p?.color)?.hex ?? '#ff7a1a';
  // Never name a base exercise that is still a surprise.
  const base = ex.base && known(ex.base) ? EXERCISE_BY_ID[ex.base] : null;
  const yt = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} exercise proper form`)}`;
  return (
    <Sheet onClose={onClose}>
      <div className="stack" style={{ gap: 4 }}>
        <h2>{ex.name}</h2>
        {base && <span className="note">Variation of {base.name}</span>}
      </div>
      {ex.demo ? (
        <figure className="demo" aria-label={`${ex.name}: start and finish photos`}>
          <img src={`./demos/${ex.id}-0.jpg`} alt={`${ex.name}, start position`} />
          <img src={`./demos/${ex.id}-1.jpg`} alt={`${ex.name}, finish position`} className="demo-b" />
          <figcaption className="tiny">Start and finish · photos: free-exercise-db (public domain)</figcaption>
        </figure>
      ) : (
        <p className="note">No photo for this exercise yet. The avatar shows the idea; YouTube shows it in full.</p>
      )}
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <Avatar stage={2} gear={[]} color={color} size={96} style={p?.avatarStyle} gender={p?.gender} action={actionFor(ex.id)} />
        <div className="grow stack" style={{ gap: 6 }}>
          <p className="row" style={{ alignItems: 'flex-start', gap: 'var(--s2)' }}>
            <Ico as={Lightbulb} size={18} style={{ color: 'var(--gold)', marginTop: 2 }} />
            <span>{ex.cue}</span>
          </p>
          <span className="note">Works: {ex.muscles.join(', ')}</span>
          {ex.equipment.length > 0 && <span className="note">Needs: {ex.equipment.map((id) => equipmentName(id)).join(', ')}</span>}
        </div>
      </div>
      <p className="note row" style={{ gap: 'var(--s2)' }}>
        <Ico as={TriangleAlert} size={16} style={{ color: 'var(--text-3)' }} />
        Stop if you feel pain. Start easy; good form first, then more reps.
      </p>
      <div className="row sheet-footer">
        <a className="btn secondary grow" href={yt} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Ico as={CirclePlay} size={18} />
          Watch on YouTube
        </a>
        <button className="btn primary grow" onClick={onClose}>
          Got it
        </button>
      </div>
    </Sheet>
  );
}
