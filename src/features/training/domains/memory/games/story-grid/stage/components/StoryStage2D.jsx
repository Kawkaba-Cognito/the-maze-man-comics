import React, { useEffect, useMemo } from 'react';
import { cast2dUrl } from '../../../../../../shared/cast2d';
import { CAST } from '../../../../../../shared/castRoster';

const STORY_ACTS = new Set([
  'idle', 'arrive', 'greet', 'search', 'agree', 'cheer', 'upset', 'work', 'wait',
]);

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function StoryStage2D({
  beat,
  cast = [],
  isAr,
  shot = 'mid',
  focusX = 0,
  onReady,
  onError,
}) {
  const castKey = cast.join(',');
  const actors = useMemo(() => beat?.actors || [], [beat]);
  const focusedId = useMemo(() => {
    if (shot === 'wide' || !actors.length) return null;
    return actors.reduce((best, actor) => (
      Math.abs((actor.x || 0) - focusX) < Math.abs((best.x || 0) - focusX) ? actor : best
    )).id;
  }, [actors, focusX, shot]);

  useEffect(() => {
    let live = true;
    Promise.all(cast.map((id) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = reject;
      image.src = cast2dUrl(id);
    }))).then(() => {
      if (live) onReady?.();
    }).catch((error) => {
      if (live) onError?.(error);
    });
    return () => { live = false; };
  // A story keeps one cast; beat changes should not reload the artwork.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey]);

  return (
    <div
      className="sgs-stage sgs-stage--2d"
      data-sky={beat?.sky || 'night'}
      data-shot={shot}
      role="img"
      aria-label={isAr ? 'مشهد قصة مصور ثنائي الأبعاد' : 'Illustrated two-dimensional story scene'}
    >
      <div className="sgs-2d-backdrop" aria-hidden="true">
        <span className="sgs-2d-orb" />
        <span className="sgs-2d-cloud sgs-2d-cloud--one" />
        <span className="sgs-2d-cloud sgs-2d-cloud--two" />
        <span className="sgs-2d-hill sgs-2d-hill--back" />
        <span className="sgs-2d-hill sgs-2d-hill--front" />
        <span className="sgs-2d-ground" />
      </div>

      <div className="sgs-2d-cast" aria-hidden="true">
        {actors.map((actor, index) => {
          const act = STORY_ACTS.has(actor.act) ? actor.act : 'idle';
          const left = 50 + clamp(actor.x || 0, -1.25, 1.25) * 27;
          const classes = [
            'sgs-2d-actor',
            `is-${act}`,
            actor.id === focusedId && 'is-focused',
          ].filter(Boolean).join(' ');
          return (
            <figure
              className={classes}
              key={`${actor.id}-${index}`}
              style={{ '--actor-left': `${left}%`, '--actor-order': index }}
            >
              <span className="sgs-2d-shadow" />
              <img src={cast2dUrl(actor.id)} alt="" draggable="false" />
              <figcaption>{CAST[actor.id]?.name?.[isAr ? 'ar' : 'en'] || actor.id}</figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
