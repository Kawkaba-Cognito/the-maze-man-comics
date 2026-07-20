import { assetUrl } from './assetUrl';

/*
 * Real 3D-rendered planet/celestial icons (Microsoft Fluent Emoji, MIT
 * license — https://github.com/microsoft/fluentui-emoji) replacing the flat
 * CSS gradient spheres. Each category is a fixed, hand-picked asset rather
 * than a runtime-tinted color, since every surface using these has a small,
 * fixed set of categories (domains / wellbeing pillars / planet types).
 */
const FILES = {
  // Training domains (legacy Fluent — prefer domainPlanetUrl on the hub)
  attention: 'ringed_planet.webp',
  speed: 'comet.webp',
  memory: 'full_moon.webp',
  language: 'sun.webp',
  reasoning: 'crystal_ball.webp',
  flexibility: 'glowing_star.webp',
  // Wellbeing pillars
  calm: 'herb.webp',
  sleep: 'crescent_moon.webp',
  meaning: 'sparkles.webp',
  relationships: 'sparkling_heart.webp',
  personality: 'compass.webp',
  // Universe planet types
  note: 'spiral_notepad.webp',
  goal: 'bullseye.webp',
  journal: 'notebook_with_decorative_cover.webp',
};

/** Hand-painted cosmos planets for the Training radial hub (per-domain art). */
const DOMAIN_PLANET_IDS = [
  'attention', 'speed', 'memory', 'language', 'reasoning', 'flexibility',
];

export function planetIconUrl(categoryId) {
  const file = FILES[categoryId];
  return file ? assetUrl(`Assets/planets/${file}`) : null;
}

/** Painted domain planet for RadialMazeHub — falls back to Fluent emoji. */
export function domainPlanetUrl(domainId) {
  if (!DOMAIN_PLANET_IDS.includes(domainId)) return planetIconUrl(domainId);
  return assetUrl(`Assets/domain-planets/${domainId}.webp`);
}
