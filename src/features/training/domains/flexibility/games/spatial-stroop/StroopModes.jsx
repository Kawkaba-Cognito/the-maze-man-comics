import React from 'react';

export default function StroopModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    {
      k: 'free',
      ic: '♾️',
      lb: t.freeMode,
      hint: t.hubNodeFreeHint,
      on: onFree,
      mod: 'ct-fq-attn-mode--free',
    },
    {
      k: 'levels',
      ic: '🎯',
      lb: t.levelMode,
      hint: t.hubNodeLevelsHint,
      on: onLevels,
      mod: 'ct-fq-attn-mode--levels',
    },
    {
      k: 'chal',
      ic: '⚔️',
      lb: t.challengeMode,
      hint: t.hubNodeChallengeHint,
      on: onChallenge,
      mod: 'ct-fq-attn-mode--chal',
    },
  ];
  return (
    <div className="ct-fq-attn-modes" role="group" aria-label={t.hubMapAria}>
      {items.map((m) => (
        <button
          key={m.k}
          type="button"
          className={`ct-fq-attn-mode ${m.mod}`}
          onClick={() => {
            playSfx('click');
            m.on();
          }}
        >
          <span className="ct-fq-attn-mode-ic" aria-hidden="true">
            {m.ic}
          </span>
          <span className="ct-fq-attn-mode-body">
            <span className="ct-fq-attn-mode-lb">{m.lb}</span>
            <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
              {m.hint}
            </span>
          </span>
          <span className="ct-fq-attn-mode-chev" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}

/** Shared arrow glyph: an SVG arrow that points left or right, optionally coloured. */
export function StroopArrow({ dir = 'right', state = '', size = 96, color = null }) {
  const flip = dir === 'left';
  const colorCls = color ? ` ct-stroop-arrow--c-${color}` : '';
  return (
    <svg
      className={`ct-stroop-arrow ct-stroop-arrow--${dir}${state ? ` ct-stroop-arrow--${state}` : ''}${colorCls}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <path
        d="M8 42 H62 V24 L94 50 L62 76 V58 H8 Z"
        fill="currentColor"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The target arrow with optional Eriksen flanker arrows on either side. */
export function StroopTarget({ probe, state = '', size = 110, useColor = false }) {
  const color = useColor && probe.color ? probe.color : null;
  if (!probe.flankerDir) {
    return <StroopArrow dir={probe.dir} state={state} size={size} color={color} />;
  }
  const fsize = Math.round(size * 0.52);
  const flank = (key) => (
    <StroopArrow key={key} dir={probe.flankerDir} size={fsize} color={null} />
  );
  return (
    <div className="ct-stroop-flankers">
      {flank('fl1')}
      {flank('fl2')}
      <div className="ct-stroop-flank-target">
        <StroopArrow dir={probe.dir} state={state} size={size} color={color} />
      </div>
      {flank('fr1')}
      {flank('fr2')}
    </div>
  );
}
