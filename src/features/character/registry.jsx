import React from 'react';
import CosmosCharacter from './CosmosCharacter';
import FoxCharacter from './FoxCharacter';
import PersonCharacter from './PersonCharacter';

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
  {
    id: 'male',
    en: 'Maze Man',
    ar: 'رجل المتاهة',
    supportsHats: false,
    Component: (props) => <PersonCharacter variant="male" {...props} />,
  },
  {
    id: 'female',
    en: 'Maze Woman',
    ar: 'امرأة المتاهة',
    supportsHats: false,
    Component: (props) => <PersonCharacter variant="female" {...props} />,
  },
  {
    id: 'fox',
    en: 'Guide Fox',
    ar: 'الثعلب الدليل',
    supportsHats: true,
    Component: FoxCharacter,
  },
];

export const DEFAULT_CHARACTER = 'cosmos';

export function getCharacter(id) {
  return CHARACTERS.find((c) => c.id === id) || CHARACTERS.find((c) => c.id === DEFAULT_CHARACTER);
}
