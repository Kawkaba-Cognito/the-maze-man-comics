import React from 'react';
import { TrainingModeList } from '../../../../shared/TrainingScreens';

export default function StroopModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge },
  ];
  return <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />;
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
export function StroopTarget({ probe, state = '', size = 92, useColor = false }) {
  const color = useColor && probe.color ? probe.color : null;
  if (!probe.flankerDir) {
    return <StroopArrow dir={probe.dir} state={state} size={size} color={color} />;
  }
  const coreSize = Math.min(size, 64);
  const fsize = Math.round(coreSize * 0.4);
  const flank = (key) => (
    <StroopArrow key={key} dir={probe.flankerDir} size={fsize} color={null} />
  );
  return (
    <div className="ct-stroop-flankers">
      {flank('fl1')}
      {flank('fl2')}
      <div className="ct-stroop-flank-target">
        <StroopArrow dir={probe.dir} state={state} size={coreSize} color={color} />
      </div>
      {flank('fr1')}
      {flank('fr2')}
    </div>
  );
}
