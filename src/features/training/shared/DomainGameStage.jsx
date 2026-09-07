import React from 'react';
import { assetUrl } from '../../../lib/assetUrl';

const DOMAIN_BACKGROUNDS = Object.freeze({
  attention: 'Assets/training/domain-backgrounds-2026/attention.webp',
  speed: 'Assets/training/domain-backgrounds-2026/speed.webp',
  memory: 'Assets/training/domain-backgrounds-2026/memory.webp',
  language: 'Assets/training/domain-backgrounds-2026/language.webp',
  reasoning: 'Assets/training/domain-backgrounds-2026/reasoning.webp',
  flexibility: 'Assets/training/domain-backgrounds-2026/flexibility.webp',
});

/**
 * Shared visual ground for every game launched from Training or Daily Workout.
 * The game remains responsible for its interactive board; this stage owns only
 * the domain-level art behind the game chrome and full-screen flow.
 */
export default function DomainGameStage({ domainId, children, className = '' }) {
  const background = DOMAIN_BACKGROUNDS[domainId];
  const classes = ['ct-domain-game-stage', className].filter(Boolean).join(' ');
  const style = background
    ? { '--training-domain-background': `url("${assetUrl(background)}")` }
    : undefined;

  return (
    <div
      className={classes}
      data-training-domain={background ? domainId : undefined}
      style={style}
    >
      {children}
    </div>
  );
}

