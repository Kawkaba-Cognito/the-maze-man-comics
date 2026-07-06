import React from 'react';
import CosmosCharacter from './CosmosCharacter';

/**
 * Character roster. Every entry exposes a `Component` with the same prop shape
 * (size/fur/accent/mood/hat/neck/glow/float), so the home pedestal and the
 * Character screen can render any of them interchangeably.
 *
 * Add a new character = add an entry here (and a component if it's a new body).
 */
export const CHARACTERS = [
  {
    id: 'cosmos',
    en: 'The Cosmos',
    ar: 'الكون',
    supportsHats: true,
    Component: CosmosCharacter,
  },
];

export const DEFAULT_CHARACTER = 'cosmos';

/** Sentinel for the "no character" choice. getCharacter() still falls back to a
 *  default body (so the 3D world always has an avatar); 2D screens check for
 *  this id to show an empty pedestal instead. */
export const NO_CHARACTER = 'none';

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS.find((c) => c.id === DEFAULT_CHARACTER);
}
