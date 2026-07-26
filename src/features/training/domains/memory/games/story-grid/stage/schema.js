/*
 * Story Time · Stage — the authored story shape.
 *
 * The old engine tested one thing: could you rebuild each panel's place +
 * characters + action from a dock of chips. That is feature binding, and
 * because every answer sits in the dock it leans on recognition.
 *
 * This engine splits retrieval in two, so a wrong answer says WHICH memory
 * failed:
 *
 *   ORDER   — the beats come back shuffled, as short labels. Put the episode
 *             back in sequence. Pure temporal order; the content is given.
 *   PROBES  — cued questions about what happened inside a beat (who was there,
 *             where it happened, what followed). Feature binding and
 *             relational detail, with order already banked.
 *
 * Both are scored separately and reported separately.
 *
 *   Story  { id, tier, title, moral, cast:[castId], beats:[Beat], probes:[Probe] }
 *   Beat   { id, sky, label, narr, actors:[Actor], say? }
 *   Actor  { id: castId, act: STORY_ACTS, x: -1..1 }   // x = stage position
 *   Probe  { id, kind, q, options:[{ v, l }], answer }
 *
 * T is always { en, ar } — no i18n framework here, every string inline
 * (see CLAUDE.md). `label` is the short form used on the ordering cards: it
 * must identify the beat WITHOUT retelling it, or ordering becomes reading.
 */

/** Pick the localised half of a { en, ar } pair. */
export const L = (v, isAr) => (typeof v === 'string' ? v : (v?.[isAr ? 'ar' : 'en'] ?? ''));

/** Sky palettes a beat may set. Drives the stage gradient + light colour. */
export const SKIES = {
  dawn: { top: 0x2a2140, bot: 0x8a5a4e, key: 0xffd2a1, rim: 0x6f7fd0, ground: 0x2b2333 },
  noon: { top: 0x1d3358, bot: 0x4a7fa8, key: 0xfff3d8, rim: 0x7fb0e0, ground: 0x24354a },
  dusk: { top: 0x241a38, bot: 0x6d3a55, key: 0xffb277, rim: 0x8a6fd0, ground: 0x281f33 },
  night: { top: 0x090a18, bot: 0x1b2244, key: 0xbfd2ff, rim: 0x5a6fc0, ground: 0x131628 },
};

export const SKY_IDS = Object.keys(SKIES);

/** Every beat, flattened — the run's ordering target. */
export const beatCount = (story) => story.beats.length;

/**
 * Score an ordering attempt.
 *
 * `exact` is the headline (how many beats sat in the right slot), but a player
 * who shifts everything by one has still remembered the sequence, so we also
 * report `adjacent`: how many neighbouring PAIRS kept their true relative
 * order. That separates "misremembered the story" from "fumbled one card".
 */
export function scoreOrder(attempt, story) {
  const truth = story.beats.map((b) => b.id);
  const exact = attempt.reduce((n, id, i) => n + (id === truth[i] ? 1 : 0), 0);
  let pairsOk = 0;
  let pairs = 0;
  for (let i = 0; i < attempt.length; i++) {
    for (let j = i + 1; j < attempt.length; j++) {
      pairs += 1;
      if (truth.indexOf(attempt[i]) < truth.indexOf(attempt[j])) pairsOk += 1;
    }
  }
  return {
    exact,
    total: truth.length,
    pairsOk,
    pairs,
    perfect: exact === truth.length,
  };
}

/** Score the cued probes. */
export function scoreProbes(answers, story) {
  const correct = story.probes.reduce(
    (n, p) => n + (answers[p.id] === p.answer ? 1 : 0),
    0,
  );
  return { correct, total: story.probes.length, perfect: correct === story.probes.length };
}

/** Everyone who appears in the story, in first-appearance order. */
export function castOf(story) {
  const seen = [];
  for (const beat of story.beats) {
    for (const a of beat.actors) if (!seen.includes(a.id)) seen.push(a.id);
  }
  return seen;
}
