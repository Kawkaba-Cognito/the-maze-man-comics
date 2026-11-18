import React, { useState } from 'react';
import { Cube, Lightning, Play, Sword, Target } from '@phosphor-icons/react';

/*
 * Light Clay Studio Mode Hub — tactile polymer clay mode cards for
 * Levels, Survival & Pass & Play. Preserves `.ct-mph*` selectors for
 * full compatibility across all 18 cognitive training games.
 */

const MODE_ICON_MAP = {
  levels: Target,
  free: Lightning,
  chal: Sword,
  proto3d: Cube,
};

const SLOT_CLASS = {
  free: 'ct-mph-slot--survival',
  levels: 'ct-mph-slot--levels',
  chal: 'ct-mph-slot--pass',
  proto3d: 'ct-mph-slot--sat',
};

function ModeCard({ item, isAr, playSfx, hovered, setHovered }) {
  const modeKey = item.k;
  const isHot = hovered === modeKey;
  const ModeIcon = MODE_ICON_MAP[modeKey] || Target;

  return (
    <button
      type="button"
      className={`ct-mph-planet duo-mode-card clay-mode-card${isHot ? ' is-hot' : ''}`}
      onClick={() => {
        playSfx?.('click');
        item.on?.();
      }}
      onMouseEnter={() => setHovered(modeKey)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(modeKey)}
      onBlur={() => setHovered(null)}
      aria-label={item.hint ? `${item.lb} — ${item.hint}` : item.lb}
    >
      <span className={`duo-mode-icon-wrap duo-mode--${modeKey} clay-mode-token`} aria-hidden="true">
        <ModeIcon size={22} weight="fill" />
      </span>
      <span className="ct-mph-planet-copy">
        <span className="ct-mph-planet-name">{item.lb}</span>
        {item.hint ? <span className="ct-mph-planet-hint">{item.hint}</span> : null}
      </span>
      <span className="duo-play-btn duo-mode-play-pill" aria-hidden="true">
        <Play size={14} weight="fill" />
        <span>{isAr ? 'العب' : 'Play'}</span>
      </span>
    </button>
  );
}

/**
 * @param {{
 *   items: Array<{ k: string, lb: string, hint?: string, ic?: string, on: () => void }>,
 *   isAr: boolean,
 *   playSfx?: Function,
 * }} props
 */
export default function ModePlanetHub({ items = [], isAr, playSfx }) {
  const [hovered, setHovered] = useState(null);
  const byKey = Object.fromEntries(items.map((it) => [it.k, it]));
  const orderedKeys = ['levels', 'free', 'chal'];
  const ordered = orderedKeys.map((k) => byKey[k]).filter(Boolean);
  const extras = items.filter((it) => !orderedKeys.includes(it.k));
  const cards = [...ordered, ...extras];

  return (
    <div className="ct-mph duo-mode-hub clay-mode-hub" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-mph-constellation" role="group" aria-label={isAr ? 'اختر الوضع' : 'Choose a mode'}>
        {cards.map((item) => (
          <div key={item.k} className={`ct-mph-slot ${SLOT_CLASS[item.k] || ''}`.trim()}>
            <ModeCard
              item={item}
              isAr={isAr}
              playSfx={playSfx}
              hovered={hovered}
              setHovered={setHovered}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
