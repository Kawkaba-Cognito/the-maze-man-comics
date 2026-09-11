import React from 'react';
import { atlasUrl } from './CancelPlanetPath.jsx';

/*
 * CANCEL MODE ATLAS — the mode-pick screen, Cancellation only.
 *
 * Replaces `ModePlanetHub` (shared/ModePlanetHub.jsx) at this ONE call site,
 * same drop-in pattern `CancelPlanetPath` already used to replace
 * `TrainingLevelGrid`: identical prop contract (`items: [{k, lb, hint, on}],
 * isAr, playSfx`), so `ModePlanetHub` itself is never edited and every other
 * game calling it is byte-for-byte unaffected.
 *
 * ⚠ WHY THIS EXISTS: `ModePlanetHub`'s three mode planets
 * (`Assets/mode-planets/{survival,levels,passplay}.webp`) are photorealistic
 * rendered spheres — volumetric cloud bands, specular limb glow, cast
 * shadow. This game's own written art direction
 * (`cancel-cosmic-atlas-2026/README.md`) explicitly prohibits exactly that
 * (photorealism, gradients, cast shadows) — the same rule that got a
 * generated background photo removed from the level-select screen. This was
 * the first screen a player sees and the first place the game crossed its
 * own art direction. Zero new assets: same 43 tracked hand-inked pieces the
 * live board and the level-select map already use.
 */

const ART = { free: 'astronaut-suit', levels: 'launch-tower', chal: 'docking-hub' };

export default function CancelModeAtlas({ items, isAr, playSfx }) {
  const byKey = Object.fromEntries(items.map((it) => [it.k, it]));
  const order = ['free', 'levels', 'chal'];
  return (
    <div className="cxm" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="cxm-hero">
        <img className="cxm-hero-mark" src={atlasUrl('galaxy')} alt="" />
      </div>
      <div className="cxm-cards" role="group" aria-label={isAr ? 'اختر الوضع' : 'Choose a mode'}>
        {order.map((k, i) => {
          const it = byKey[k];
          if (!it) return null;
          return (
            <button
              key={k}
              type="button"
              className="cxm-card"
              style={{ '--cx-i': i }}
              onClick={() => { playSfx?.('click'); it.on?.(); }}
            >
              <span className="cxm-card-art" aria-hidden="true">
                <img src={atlasUrl(ART[k])} alt="" loading="eager" />
              </span>
              <span className="cxm-card-copy">
                <span className="cxm-card-name">{it.lb}</span>
                <span className="cxm-card-hint">{it.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
