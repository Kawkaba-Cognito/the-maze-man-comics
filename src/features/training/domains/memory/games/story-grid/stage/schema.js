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
import { clamp } from '../../../../../../../lib/math';

/** Pick the localised half of a { en, ar } pair. */
export const L = (v, isAr) => (typeof v === 'string' ? v : (v?.[isAr ? 'ar' : 'en'] ?? ''));

/*
 * ── The story plays as a short film ──────────────────────────────────────
 *
 * Beats are not slides any more: they run on a clock, the camera cuts between
 * shots, and dialogue appears as a subtitle. Two optional authoring fields
 * steer that; both have sane defaults, so an un-annotated story still plays.
 *
 *   shot  — how the beat is framed (see SHOT_IDS)
 *   hold  — how long it stays on screen, in ms (see beatHold)
 */

/**
 * Shot vocabulary. The NUMBERS live in StoryStage3D (they are a camera
 * concern); these are the names an author may write and the validator checks.
 *
 *   wide   establishing — the whole stage, cast small
 *   mid    the group at working size, the default
 *   close  pushed in on one actor, used when somebody speaks
 */
export const SHOT_IDS = ['wide', 'mid', 'close'];

/**
 * The house grammar, applied when a beat does not name its own shot: open
 * wide so the place registers, cut in for dialogue, and pull back out for the
 * last beat so the story resolves on the whole scene.
 */
export function pickShot(beat, index, total) {
  if (beat?.shot && SHOT_IDS.includes(beat.shot)) return beat.shot;
  if (index === 0 || index === total - 1) return 'wide';
  if (beat?.say) return 'close';
  return 'mid';
}

/** Whoever the camera favours in a close-up: the speaker, else centre stage. */
export function focusActor(beat) {
  if (beat?.say?.who) {
    const a = (beat.actors || []).find((x) => x.id === beat.say.who);
    if (a) return a;
  }
  return null;
}

/*
 * How long a beat holds, in ms.
 *
 * Derived from how much there is to take in rather than a flat timer — a beat
 * carrying a line of dialogue AND narration needs longer than a wordless one.
 * 2.6 words/sec is a comfortable read-while-watching pace: slower than the
 * ~3.3 of silent reading, because the eye is also on the performance.
 */
/*
 * 3.2 words/sec ≈ 190 wpm — brisk but under the ~240 wpm of silent reading,
 * because the eye is also on the performance. Both numbers were tuned against
 * the real corpus rather than guessed: the beats run 23–39 words, and at the
 * first attempt (2.6 w/s, 9s cap) TWELVE of the eighteen saturated the cap, so
 * every beat held for exactly as long as every other and the film had no
 * rhythm at all. At 3.2 with a 13s ceiling only one beat saturates, holds
 * spread across 8.1–13.0s, and the fastest any beat asks you to read is
 * 3.0 w/s.
 *
 * Re-check these if the corpus grows — `validate:stage` prints each story's
 * runtime and fails any beat that outruns a reader.
 */
const WORDS_PER_SEC = 3.2;
const HOLD_BASE = 900;
export const HOLD_MIN = 2600;
export const HOLD_MAX = 13000;

const wordCount = (v, isAr) => L(v, isAr).trim().split(/\s+/).filter(Boolean).length;

export function beatHold(beat, isAr) {
  if (typeof beat?.hold === 'number') return beat.hold;
  const words = wordCount(beat?.narr, isAr) + (beat?.say ? wordCount(beat.say.t, isAr) : 0);
  return clamp(HOLD_BASE + (words / WORDS_PER_SEC) * 1000, HOLD_MIN, HOLD_MAX);
}

/** Total runtime of a story, for the "N sec" label on the replay control. */
export const storyRuntime = (story, isAr) =>
  (story.beats || []).reduce((ms, b) => ms + beatHold(b, isAr), 0);

/** Sky palettes a beat may set. Drives the stage gradient + light colour. */
/*
 * The four skies are FUNCTIONAL, not decorative: the stage recolours per beat
 * (dawn → noon → dusk → night) so a change of time reads instantly, which is a
 * non-verbal cue the player can encode and use when reordering the story. They
 * must stay clearly distinguishable from one another — that separation is doing
 * task work, the same way the Okabe-Ito palettes do in the attention games.
 *
 * They have been moved INTO the Tide family rather than flattened to one
 * colour: every stop is now Tide's cool slate → warm brown, with the four times
 * of day separated by depth and warmth instead of by hue (the old set ran
 * purple/teal/magenta, four hues from outside the palette). Noon stays the
 * lightest and coolest, night the deepest — so the cue survives while the stage
 * stops being a sixth colour scheme.
 */
export const SKIES = {
  dawn: { top: 0x2a3040, bot: 0x8a6553, key: 0xffd2a1, rim: 0x6f7fa0, ground: 0x2f2b33 },
  noon: { top: 0x3d4f66, bot: 0xa88a6a, key: 0xfff3d8, rim: 0x8fb0c8, ground: 0x3a3b40 },
  dusk: { top: 0x232b3a, bot: 0x6d5648, key: 0xffb277, rim: 0x8a7fa0, ground: 0x2a2730 },
  night: { top: 0x121826, bot: 0x332c33, key: 0xbfd2ff, rim: 0x5a6fa0, ground: 0x161a26 },
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
