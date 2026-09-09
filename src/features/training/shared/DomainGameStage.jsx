import React from 'react';

/**
 * Shared visual ground for every game launched from Training or Daily Workout.
 * The game remains responsible for its interactive board; this stage owns only
 * the domain-level art behind the game chrome and full-screen flow.
 */
export default function DomainGameStage({ domainId, children, className = '' }) {
  const classes = ['ct-domain-game-stage', className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-training-domain={domainId || undefined}>
      {children}
    </div>
  );
}
