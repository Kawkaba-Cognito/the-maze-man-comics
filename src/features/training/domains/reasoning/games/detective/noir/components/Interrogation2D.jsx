import React, { useEffect, useMemo } from 'react';
import { assetUrl } from '../../../../../../../../lib/assetUrl';
import { cast2dUrl } from '../../../../../../shared/cast2d';
import { DETECTIVE_ASSETS } from '../scenes';

function localName(suspect, isAr) {
  if (typeof suspect.name === 'string') return suspect.name;
  return suspect.name?.[isAr ? 'ar' : 'en'] || suspect.name?.en || suspect.id;
}

export default function Interrogation2D({
  suspects,
  activeId,
  reaction,
  cleared,
  isAr,
  onSelect,
  onReady,
  onError,
}) {
  const castKey = suspects.map((suspect) => suspect.id).join(',');
  const clearedSet = useMemo(() => new Set(cleared || []), [cleared]);

  useEffect(() => {
    let live = true;
    const ids = ['kawkab', ...suspects.map((suspect) => suspect.id)];
    Promise.all(ids.map((id) => new Promise((resolve, reject) => {
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
  // The asset set changes only when a new line-up is mounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [castKey]);

  return (
    <div
      className="nr-stage nr-stage--2d"
      role="group"
      aria-label={isAr ? 'صف المشتبه بهم التفاعلي' : 'Interactive suspect line-up'}
    >
      <img
        className="nr-2d-backdrop"
        src={assetUrl(DETECTIVE_ASSETS.interrogation)}
        alt=""
        aria-hidden="true"
        draggable="false"
      />
      <div className="nr-2d-room" aria-hidden="true">
        <span className="nr-2d-light nr-2d-light--left" />
        <span className="nr-2d-light nr-2d-light--right" />
        <span className="nr-2d-floor-line" />
      </div>
      <div className="nr-2d-detective" aria-hidden="true">
        <span>{isAr ? 'المحقق' : 'Detective'}</span>
        <img src={cast2dUrl('kawkab')} alt="" draggable="false" />
      </div>
      <div className="nr-2d-lineup" style={{ '--suspect-count': suspects.length }}>
        {suspects.map((suspect) => {
          const active = suspect.id === activeId;
          const isCleared = clearedSet.has(suspect.id);
          const reacting = reaction?.sid === suspect.id;
          const reactionType = reaction?.action === 'concede' ? 'concede' : 'rattled';
          const stateClass = [
            'nr-2d-suspect',
            active && 'is-active',
            isCleared && 'is-cleared',
            reacting && `is-${reactionType}`,
          ].filter(Boolean).join(' ');
          return (
            <button
              type="button"
              key={suspect.id}
              className={stateClass}
              style={{ '--suspect-accent': suspect.accent || '#d9a441' }}
              aria-pressed={active}
              onClick={() => onSelect?.(suspect.id)}
            >
              <span className="nr-2d-spotlight" aria-hidden="true" />
              <img src={cast2dUrl(suspect.id)} alt="" draggable="false" />
              <span className="nr-2d-name">{localName(suspect, isAr)}</span>
              {isCleared && <span className="nr-2d-cleared">{isAr ? 'مستبعد' : 'Cleared'}</span>}
            </button>
          );
        })}
      </div>
      <div className="nr-stage-frame" aria-hidden="true"><i /><i /><i /><i /></div>
    </div>
  );
}
