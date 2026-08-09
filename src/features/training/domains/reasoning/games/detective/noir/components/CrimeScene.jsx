import React from 'react';
import { assetUrl } from '../../../../../../../../lib/assetUrl';
import { L } from '../schema';
import { sceneFor } from '../scenes';

/*
 * The searchable room.
 *
 * The case's drawn scene sits underneath; hotspots are laid over it at the
 * positions the ART defines, so each one lands on the prop it describes. Ones
 * holding evidence stop pulsing once collected, and "Instinct" flashes whatever
 * is still out there for players who get stuck.
 */
export default function CrimeScene({
  caseData, isAr, found, hinted, examined, onExamine,
}) {
  const scene = sceneFor(caseData.id);

  return (
    <div className="nr-scene">
      {scene?.image ? (
        <img
          className="nr-scene-art"
          src={assetUrl(scene.image)}
          alt=""
          aria-hidden="true"
          draggable="false"
        />
      ) : <div className="nr-scene-floor" aria-hidden="true" />}

      {caseData.hotspots.map((h) => {
        const isFound = h.clue ? found.includes(h.clue) : examined.has(h.id);
        const label = L(h.name, isAr);
        const pos = scene?.anchors?.[h.id] || h.pos;
        return (
          <button
            type="button"
            key={h.id}
            className={`nr-hs${isFound ? ' found' : ''}${hinted && h.clue && !isFound ? ' hinted' : ''}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            onClick={() => onExamine(h)}
            aria-label={label}
            title={label}
          >
            <span aria-hidden="true">{isFound && h.clue ? '✓' : h.e}</span>
          </button>
        );
      })}
    </div>
  );
}
