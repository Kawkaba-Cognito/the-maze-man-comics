import React from 'react';
import { assetUrl } from '../../../lib/assetUrl';

const DOMAIN_BACKGROUNDS = Object.freeze({
  attention: {
    desktop: 'Assets/training/domain-backgrounds-universal-v1/desktop.webp',
    mobile: 'Assets/training/domain-backgrounds-universal-v1/mobile.webp',
  },
  speed: {
    desktop: 'Assets/training/domain-backgrounds-universal-v1/desktop.webp',
    mobile: 'Assets/training/domain-backgrounds-universal-v1/mobile.webp',
  },
  memory: {
    desktop: 'Assets/training/domain-backgrounds-universal-v1/desktop.webp',
    mobile: 'Assets/training/domain-backgrounds-universal-v1/mobile.webp',
  },
  language: {
    desktop: 'Assets/training/domain-backgrounds-universal-v1/desktop.webp',
    mobile: 'Assets/training/domain-backgrounds-universal-v1/mobile.webp',
  },
  reasoning: {
    desktop: 'Assets/training/domain-backgrounds-universal-v1/desktop.webp',
    mobile: 'Assets/training/domain-backgrounds-universal-v1/mobile.webp',
  },
  flexibility: {
    desktop: 'Assets/training/domain-backgrounds-universal-v1/desktop.webp',
    mobile: 'Assets/training/domain-backgrounds-universal-v1/mobile.webp',
  },
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
    ? {
        '--training-domain-background': `url("${assetUrl(background.desktop)}")`,
        '--training-domain-background-mobile': `url("${assetUrl(background.mobile)}")`,
      }
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
