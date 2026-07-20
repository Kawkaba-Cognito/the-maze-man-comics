import React, { useState } from 'react';
import { assetUrl } from '../../../lib/assetUrl';

/*
 * Artistic mode constellation — painted planets on a cosmos stage.
 * Three main worlds (Survival / Levels / Pass n Play) + a small 3D satellite.
 */

const ART = {
  free: assetUrl('Assets/mode-planets/survival.webp'),
  levels: assetUrl('Assets/mode-planets/levels.webp'),
  chal: assetUrl('Assets/mode-planets/passplay.webp'),
  proto3d: assetUrl('Assets/mode-planets/proto3d.webp'),
};

const ACCENT = {
  free: '#e8ac4e',
  levels: '#5aabbb',
  chal: '#d97240',
  proto3d: '#a880cc',
};

function PlanetButton({
  modeKey, label, hint, onPick, playSfx, size = 'lg', hovered, setHovered, floatDelay = 0,
}) {
  const art = ART[modeKey];
  const col = ACCENT[modeKey];
  const isH = hovered === modeKey;
  const isSat = size === 'sm';

  return (
    <button
      type="button"
      className={`ct-mph-planet ct-mph-planet--${size}${isH ? ' is-hot' : ''}`}
      style={{ '--mph-accent': col, '--mph-float-delay': `${floatDelay}s` }}
      onClick={() => { playSfx?.('click'); onPick?.(); }}
      onMouseEnter={() => setHovered(modeKey)}
      onMouseLeave={() => setHovered(null)}
      onFocus={() => setHovered(modeKey)}
      onBlur={() => setHovered(null)}
      aria-label={hint ? `${label} — ${hint}` : label}
    >
      <span className="ct-mph-planet-orb" aria-hidden="true">
        <span className="ct-mph-planet-glow" />
        <span className="ct-mph-planet-ring" />
        <img src={art} alt="" className="ct-mph-planet-img" draggable={false} />
        <span className="ct-mph-planet-shade" />
      </span>
      <span className="ct-mph-planet-copy">
        <span className="ct-mph-planet-name">{label}</span>
        {!isSat && hint ? <span className="ct-mph-planet-hint">{hint}</span> : null}
      </span>
    </button>
  );
}

/**
 * @param {{
 *   items: Array<{ k: string, lb: string, hint?: string, on: () => void }>,
 *   isAr: boolean,
 *   playSfx?: Function,
 * }} props
 */
export default function ModePlanetHub({ items, isAr, playSfx }) {
  const [hovered, setHovered] = useState(null);
  const byKey = Object.fromEntries(items.map((it) => [it.k, it]));
  const free = byKey.free;
  const levels = byKey.levels;
  const chal = byKey.chal;
  const proto = byKey.proto3d;

  return (
    <div className="ct-mph" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-mph-sky" aria-hidden="true">
        <div className="ct-mph-nebula ct-mph-nebula--a" />
        <div className="ct-mph-nebula ct-mph-nebula--b" />
        <div className="ct-mph-nebula ct-mph-nebula--c" />
        <div className="ct-mph-stars ct-mph-stars--a" />
        <div className="ct-mph-stars ct-mph-stars--b" />
        <div className="ct-mph-shoot ct-mph-shoot--1" />
        <div className="ct-mph-shoot ct-mph-shoot--2" />
        <div className="ct-mph-shoot ct-mph-shoot--3" />
        <div className="ct-mph-dust" />
      </div>

      <div className="ct-mph-constellation" role="group" aria-label={isAr ? 'اختر الوضع' : 'Choose a mode'}>
        {free && (
          <div className="ct-mph-slot ct-mph-slot--survival">
            <PlanetButton
              modeKey="free"
              label={free.lb}
              hint={free.hint}
              onPick={free.on}
              playSfx={playSfx}
              size="lg"
              floatDelay={0}
              hovered={hovered}
              setHovered={setHovered}
            />
          </div>
        )}

        <div className="ct-mph-row">
          {levels && (
            <div className="ct-mph-slot ct-mph-slot--levels">
              <PlanetButton
                modeKey="levels"
                label={levels.lb}
                hint={levels.hint}
                onPick={levels.on}
                playSfx={playSfx}
                size="md"
                floatDelay={0.7}
                hovered={hovered}
                setHovered={setHovered}
              />
            </div>
          )}
          {chal && (
            <div className="ct-mph-slot ct-mph-slot--pass">
              <PlanetButton
                modeKey="chal"
                label={chal.lb}
                hint={chal.hint}
                onPick={chal.on}
                playSfx={playSfx}
                size="md"
                floatDelay={1.4}
                hovered={hovered}
                setHovered={setHovered}
              />
            </div>
          )}
        </div>

        {proto && (
          <div className="ct-mph-slot ct-mph-slot--sat">
            <div className="ct-mph-tether" aria-hidden="true" />
            <PlanetButton
              modeKey="proto3d"
              label={proto.lb}
              hint={proto.hint}
              onPick={proto.on}
              playSfx={playSfx}
              size="sm"
              floatDelay={2.1}
              hovered={hovered}
              setHovered={setHovered}
            />
          </div>
        )}
      </div>
    </div>
  );
}
