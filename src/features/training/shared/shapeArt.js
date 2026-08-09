/*
 * Premium flat 2D object art for Cancellation training modes.
 *
 * The engine keeps its stable internal shape keys for difficulty, scoring and
 * saved data. Survival, Levels and Pass n Play map those keys to one coherent
 * Cosmic Atlas. Assessment and Adaptive deliberately keep the controlled
 * abstract stimulus set so their longitudinal measurement stays comparable.
 */
import { assetUrl } from '../../../lib/assetUrl';

/*
 * ── `motif`: which object family each illustration belongs to ──
 *
 * This is what decides whether a BOARD may use art at all, and it exists
 * because the illustrations broke the hard tiers.
 *
 * The engine grades difficulty by SILHOUETTE similarity — SH's own three tiers,
 * from distinct through near-identical — and the near-identical tier is what
 * makes a hard round a conjunction search. Mapping those silhouettes to pictures
 * quietly destroyed that: `fatOval`, `almostCircle`, `thinOval`, `ovalH`, `ovalV`,
 * `semicircle` and `bigSemi` all became PLANETS, and hard pools put several of
 * them on one board.
 *
 * The failure is not "hard got harder", it is "hard became unreadable", and the
 * mechanism is specific. An ellipse's aspect ratio lives in its OUTLINE, and
 * peripheral vision resolves outlines — you scan the grid peripherally and only
 * foveate candidates. An illustration's difference lives in INTERIOR detail,
 * which peripheral vision does not resolve at all, and every tile is the same
 * rounded frame so the outline channel now carries no information anywhere. The
 * result forces a foveation of all 81 tiles: tedious, not difficult, and
 * measuring patience rather than selective attention.
 *
 * So art is allowed only where no two objects on the board share a motif.
 * Families are grouped GENEROUSLY on purpose — a false "these clash" costs one
 * board its illustrations, while a false "these are fine" costs the player a
 * round they cannot read.
 */
const COSMIC_ART = Object.freeze({
  circle: {
    file: 'planet', motif: 'planet', en: 'Ringed planet', ar: 'كوكب ذو حلقات',
    variant: { file: 'galaxy', en: 'Spiral galaxy', ar: 'مجرة حلزونية' },
  },
  square: {
    file: 'satellite', motif: 'satellite', en: 'Satellite', ar: 'قمر اصطناعي',
    variant: { file: 'lunar-rover', en: 'Lunar rover', ar: 'مركبة قمرية' },
  },
  triangle: {
    file: 'rocket', motif: 'rocket', en: 'Rocket', ar: 'صاروخ',
    variant: { file: 'space-fighter', en: 'Space fighter', ar: 'مقاتلة فضائية' },
  },
  diamond: {
    file: 'crystal', motif: 'crystal', en: 'Crystal cluster', ar: 'بلورات كونية',
    variant: { file: 'quantum-shard', en: 'Quantum shard', ar: 'شظية كمومية' },
  },
  pentagon: {
    file: 'helmet', motif: 'helmet', en: 'Astronaut helmet', ar: 'خوذة رائد فضاء',
    variant: { file: 'astronaut-suit', en: 'Astronaut suit', ar: 'بدلة رائد فضاء' },
  },
  hexagon: {
    file: 'telescope', motif: 'optics', en: 'Telescope', ar: 'تلسكوب',
    variant: { file: 'radio-telescope', en: 'Radio telescope', ar: 'تلسكوب راديوي' },
  },
  star: {
    file: 'star', motif: 'star', en: 'Radiant star', ar: 'نجمة مشعّة',
    variant: { file: 'supernova', en: 'Supernova', ar: 'مستعر أعظم' },
  },
  cross: {
    file: 'station', motif: 'station', en: 'Space station', ar: 'محطة فضائية',
    variant: { file: 'docking-hub', en: 'Docking hub', ar: 'مركز التحام' },
  },
  heart: {
    file: 'comet', motif: 'comet', en: 'Comet', ar: 'مذنّب',
    variant: { file: 'meteor-cluster', en: 'Meteor cluster', ar: 'عنقود نيازك' },
  },
  lightning: {
    file: 'nebula-bolt', motif: 'nebula', en: 'Electric nebula', ar: 'سديم كهربائي',
    variant: { file: 'solar-flare', en: 'Solar flare', ar: 'توهج شمسي' },
  },

  roundsq: { file: 'portal', motif: 'portal', en: 'Cosmic portal', ar: 'بوابة كونية' },
  ovalH: { file: 'oval-planet-h', motif: 'planet', en: 'Horizontal exoplanet', ar: 'كوكب بيضاوي أفقي' },
  ovalV: { file: 'oval-planet-v', motif: 'planet', en: 'Aurora planet', ar: 'كوكب الشفق' },
  triR: { file: 'rocket-right', motif: 'rocket', en: 'Right-facing rocket', ar: 'صاروخ متجه يميناً' },
  triFlat: { file: 'lunar-shuttle', motif: 'rocket', en: 'Lunar shuttle', ar: 'مكوك قمري' },
  hexTall: { file: 'observatory', motif: 'optics', en: 'Space observatory', ar: 'مرصد فضائي' },
  arrowR: { file: 'probe-right', motif: 'probe', en: 'Right-facing probe', ar: 'مسبار متجه يميناً' },
  arrowL: { file: 'probe-left', motif: 'probe', en: 'Left-facing probe', ar: 'مسبار متجه يساراً' },
  moon: { file: 'moon', motif: 'moon', en: 'Crescent moon', ar: 'هلال' },

  semicircle: { file: 'planet-rise', motif: 'planet', en: 'Planet rise', ar: 'شروق كوكب' },
  rhombus: { file: 'rhombus-asteroid', motif: 'crystal', en: 'Diamond asteroid', ar: 'كويكب ماسي' },
  parallelR: { file: 'solar-sail', motif: 'solar', en: 'Solar sail', ar: 'شراع شمسي' },
  trapezoid: { file: 'lunar-base', motif: 'base', en: 'Lunar base', ar: 'قاعدة قمرية' },
  shield: { file: 'crew-capsule', motif: 'capsule', en: 'Crew capsule', ar: 'كبسولة فضائية' },
  ovalSq: { file: 'warp-gate', motif: 'portal', en: 'Warp gate', ar: 'بوابة انتقال' },

  fatOval: { file: 'wide-planet', motif: 'planet', en: 'Wide gas planet', ar: 'كوكب غازي عريض' },
  thinOval: { file: 'thin-planet', motif: 'planet', en: 'Tall oval planet', ar: 'كوكب بيضاوي طويل' },
  almostCircle: { file: 'round-planet', motif: 'planet', en: 'Round mosaic planet', ar: 'كوكب فسيفسائي دائري' },
  wideRect: { file: 'solar-array', motif: 'solar', en: 'Orbital solar array', ar: 'ألواح شمسية مدارية' },
  tallRect: { file: 'launch-tower', motif: 'tower', en: 'Launch tower', ar: 'برج إطلاق' },
  bigSemi: { file: 'planet-horizon', motif: 'planet', en: 'Planet horizon', ar: 'أفق كوكبي' },
  tinyMoon: { file: 'thin-moon', motif: 'moon', en: 'Thin crescent', ar: 'هلال رفيع' },
  fatDiamond: { file: 'fat-crystal', motif: 'crystal', en: 'Wide cosmic crystal', ar: 'بلورة كونية عريضة' },
});

/** Every stable engine key that has a premium training asset. */
export const TRAINING_ART_SHAPES = Object.freeze(Object.keys(COSMIC_ART));
/** Backwards-compatible name retained for older callers. */
export const SURVIVAL_ART_SHAPES = TRAINING_ART_SHAPES;

/**
 * Stable 0/1 visual set for a round. It is derived from authored round fields,
 * so every occurrence of a target uses the same picture and Pass n Play stays
 * identical for every player, while consecutive rounds can show Atlas II.
 */
export function shapeArtSetForRound(round) {
  const key = [
    round?.mode,
    round?.diff,
    round?.lv,
    round?.freeStage,
    round?.target,
    round?.targetCol,
    round?.grid,
  ].join('|');
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) & 1;
}

/** File slug used by audits and asset tooling, or null for controlled stimuli. */
export function shapeArtFile(shape, artSet = 0) {
  const art = COSMIC_ART[shape];
  if (!art) return null;
  return artSet === 1 && art.variant ? art.variant.file : art.file;
}

/** URL of the illustrated object for `shape`, or null outside the art family. */
export function shapeArtUrl(shape, artSet = 0) {
  const file = shapeArtFile(shape, artSet);
  return file
    ? assetUrl(`Assets/training/cancel-cosmic-atlas-2026/${file}.webp`)
    : null;
}

/** Human label matching the illustrated object rather than the internal key. */
export function shapeArtLabel(shape, isAr = false, artSet = 0) {
  const art = COSMIC_ART[shape];
  if (!art) return shape;
  const active = artSet === 1 && art.variant ? art.variant : art;
  return active[isAr ? 'ar' : 'en'];
}

export function hasShapeArt(shape) {
  return shape in COSMIC_ART;
}

/** Which object family `shape`'s illustration belongs to, or null. */
export function shapeArtMotif(shape) {
  return COSMIC_ART[shape]?.motif ?? null;
}

/**
 * May a board made of these shapes use the illustrations?
 *
 * Yes only when every shape has art AND no two share a motif — i.e. the objects
 * on screen are tellable apart at a glance. A pool of
 * {circle, square, triangle, moon} passes (planet / satellite / rocket / moon);
 * {fatOval, almostCircle, circle} does not, because all three are planets.
 *
 * ⚠ ALL-OR-NOTHING PER BOARD, and that is the whole point of taking a list
 * rather than one shape. Deciding per piece would put framed illustrations and
 * bare silhouettes on the same grid, and the framed ones carry a coloured border
 * plus a tinted fill — far more salient than a plain shape. The target would
 * then be findable from its treatment rather than its identity, which is a
 * bigger measurement problem than the one this function exists to fix.
 */
export function shapesAreArtSafe(shapes) {
  const motifs = new Set();
  for (const shape of shapes) {
    const motif = shapeArtMotif(shape);
    if (!motif || motifs.has(motif)) return false;
    motifs.add(motif);
  }
  return motifs.size > 0;
}
