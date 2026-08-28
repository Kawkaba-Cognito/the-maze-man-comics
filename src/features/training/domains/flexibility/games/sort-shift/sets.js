/*
 * Sort It Another Way — the card sets.
 *
 * Six cards, split three and three. Each set carries several FEATURES, and
 * every feature must cut the six exactly 3–3, which is what makes every
 * grouping either unambiguously valid or unambiguously not.
 *
 * ── The one way this format fails, and why it cannot fail here ──
 * A player finds a grouping that is genuinely sensible, the author never wrote
 * it down, and the game calls them wrong. That is the same unfairness that got
 * Card Sort and Kawkab Hops retired, so it is designed out rather than
 * apologised for: validity is DERIVED from the features on the cards, never
 * matched against a list of blessed answers. Six cards have exactly ten
 * possible 3–3 splits (C(6,3)/2), and `npm run validate:sort` enumerates all
 * ten of them for every set — so every split is accounted for, and the count of
 * valid ones is a fact about the data rather than a claim in a comment.
 *
 * Difficulty is how OBVIOUS the features are, not how many there are. Colour
 * and shape are seen; "things that hold liquid" has to be thought about.
 */

/** Compact authoring form → cards with named features. */
const set = (id, tier, cards, features) => ({ id, tier, features, cards });

/*
 * `features` names each dimension for the reveal ("split by colour"), and the
 * key is the property on every card. Cards may carry extra properties that are
 * NOT listed as features — those are deliberate decoys and must not divide the
 * six evenly, which the validator also checks.
 */
export const SORT_SETS = [
  // ── EASY: two perceptual features plus one plain category ──────────────
  set('tools', 'easy', [
    { w: { en: 'CAT', ar: 'قطة' }, colour: 'red', shape: 'circle', kind: 'animal' },
    { w: { en: 'DOG', ar: 'كلب' }, colour: 'red', shape: 'square', kind: 'animal' },
    { w: { en: 'HAMMER', ar: 'مطرقة' }, colour: 'red', shape: 'square', kind: 'tool' },
    { w: { en: 'BIRD', ar: 'طائر' }, colour: 'blue', shape: 'circle', kind: 'animal' },
    { w: { en: 'SAW', ar: 'منشار' }, colour: 'blue', shape: 'circle', kind: 'tool' },
    { w: { en: 'DRILL', ar: 'مثقاب' }, colour: 'blue', shape: 'square', kind: 'tool' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'kind', en: 'living or made', ar: 'حيّ أم مصنوع' },
  ]),

  set('garden', 'easy', [
    { w: { en: 'APPLE', ar: 'تفاحة' }, colour: 'red', shape: 'circle', kind: 'food' },
    { w: { en: 'PEAR', ar: 'كمثرى' }, colour: 'red', shape: 'square', kind: 'food' },
    { w: { en: 'LEAF', ar: 'ورقة' }, colour: 'red', shape: 'square', kind: 'plant' },
    { w: { en: 'GRAPE', ar: 'عنب' }, colour: 'blue', shape: 'circle', kind: 'food' },
    { w: { en: 'FLOWER', ar: 'زهرة' }, colour: 'blue', shape: 'circle', kind: 'plant' },
    { w: { en: 'TREE', ar: 'شجرة' }, colour: 'blue', shape: 'square', kind: 'plant' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'kind', en: 'eaten or not', ar: 'يُؤكل أم لا' },
  ]),

  set('sky', 'easy', [
    { w: { en: 'SUN', ar: 'شمس' }, colour: 'red', shape: 'circle', kind: 'sky' },
    { w: { en: 'STAR', ar: 'نجمة' }, colour: 'red', shape: 'square', kind: 'sky' },
    { w: { en: 'KITE', ar: 'طائرة ورقية' }, colour: 'red', shape: 'square', kind: 'made' },
    { w: { en: 'MOON', ar: 'قمر' }, colour: 'blue', shape: 'circle', kind: 'sky' },
    { w: { en: 'PLANE', ar: 'طائرة' }, colour: 'blue', shape: 'circle', kind: 'made' },
    { w: { en: 'BALLOON', ar: 'منطاد' }, colour: 'blue', shape: 'square', kind: 'made' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'kind', en: 'natural or built', ar: 'طبيعي أم مصنوع' },
  ]),

  // ── MEDIUM: one perceptual feature, two that must be thought about ──────
  set('kitchen', 'med', [
    { w: { en: 'CUP', ar: 'كوب' }, colour: 'red', shape: 'circle', holds: 'liquid' },
    { w: { en: 'BOTTLE', ar: 'زجاجة' }, colour: 'red', shape: 'square', holds: 'liquid' },
    { w: { en: 'KNIFE', ar: 'سكين' }, colour: 'red', shape: 'square', holds: 'nothing' },
    { w: { en: 'BUCKET', ar: 'دلو' }, colour: 'blue', shape: 'circle', holds: 'liquid' },
    { w: { en: 'SPOON', ar: 'ملعقة' }, colour: 'blue', shape: 'circle', holds: 'nothing' },
    { w: { en: 'TABLE', ar: 'طاولة' }, colour: 'blue', shape: 'square', holds: 'nothing' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'holds', en: 'holds liquid', ar: 'يحمل سائلاً' },
  ]),

  set('travel', 'med', [
    { w: { en: 'BOAT', ar: 'قارب' }, colour: 'red', shape: 'circle', where: 'water' },
    { w: { en: 'CANOE', ar: 'زورق' }, colour: 'red', shape: 'square', where: 'water' },
    { w: { en: 'CAR', ar: 'سيارة' }, colour: 'red', shape: 'square', where: 'land' },
    { w: { en: 'SURFBOARD', ar: 'لوح ركوب' }, colour: 'blue', shape: 'circle', where: 'water' },
    { w: { en: 'TRAIN', ar: 'قطار' }, colour: 'blue', shape: 'circle', where: 'land' },
    { w: { en: 'BICYCLE', ar: 'دراجة' }, colour: 'blue', shape: 'square', where: 'land' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'where', en: 'water or land', ar: 'ماء أم برّ' },
  ]),

  set('weather', 'med', [
    { w: { en: 'RAIN', ar: 'مطر' }, colour: 'red', shape: 'circle', state: 'wet' },
    { w: { en: 'SNOW', ar: 'ثلج' }, colour: 'red', shape: 'square', state: 'wet' },
    { w: { en: 'DUST', ar: 'غبار' }, colour: 'red', shape: 'square', state: 'dry' },
    { w: { en: 'FOG', ar: 'ضباب' }, colour: 'blue', shape: 'circle', state: 'wet' },
    { w: { en: 'SUNSHINE', ar: 'شمس ساطعة' }, colour: 'blue', shape: 'circle', state: 'dry' },
    { w: { en: 'FROST', ar: 'صقيع' }, colour: 'blue', shape: 'square', state: 'dry' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'state', en: 'wet or dry', ar: 'رطب أم جاف' },
  ]),

  // ── HARD: nothing is perceptual. Every rule has to be reasoned. ─────────
  set('music', 'hard', [
    { w: { en: 'DRUM', ar: 'طبل' }, colour: 'red', shape: 'circle', family: 'struck' },
    { w: { en: 'BELL', ar: 'جرس' }, colour: 'red', shape: 'square', family: 'struck' },
    { w: { en: 'GUITAR', ar: 'غيتار' }, colour: 'red', shape: 'square', family: 'string' },
    { w: { en: 'CYMBAL', ar: 'صنج' }, colour: 'blue', shape: 'circle', family: 'struck' },
    { w: { en: 'HARP', ar: 'قيثارة' }, colour: 'blue', shape: 'circle', family: 'string' },
    { w: { en: 'VIOLIN', ar: 'كمان' }, colour: 'blue', shape: 'square', family: 'string' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'family', en: 'struck or plucked', ar: 'يُقرع أم يُنقر' },
  ]),

  set('body', 'hard', [
    { w: { en: 'EYE', ar: 'عين' }, colour: 'red', shape: 'circle', sense: 'yes' },
    { w: { en: 'EAR', ar: 'أذن' }, colour: 'red', shape: 'square', sense: 'yes' },
    { w: { en: 'HAND', ar: 'يد' }, colour: 'red', shape: 'square', sense: 'no' },
    { w: { en: 'NOSE', ar: 'أنف' }, colour: 'blue', shape: 'circle', sense: 'yes' },
    { w: { en: 'HEART', ar: 'قلب' }, colour: 'blue', shape: 'circle', sense: 'no' },
    { w: { en: 'SPINE', ar: 'عمود فقري' }, colour: 'blue', shape: 'square', sense: 'no' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'sense', en: 'a sense organ', ar: 'عضو حسّي' },
  ]),

  set('time', 'hard', [
    { w: { en: 'CLOCK', ar: 'ساعة حائط' }, colour: 'red', shape: 'circle', shows: 'time', worn: 'no' },
    { w: { en: 'WATCH', ar: 'ساعة يد' }, colour: 'red', shape: 'square', shows: 'time', worn: 'yes' },
    { w: { en: 'RING', ar: 'خاتم' }, colour: 'red', shape: 'square', shows: 'nothing', worn: 'yes' },
    { w: { en: 'CALENDAR', ar: 'تقويم' }, colour: 'blue', shape: 'circle', shows: 'time', worn: 'no' },
    { w: { en: 'SCARF', ar: 'وشاح' }, colour: 'blue', shape: 'circle', shows: 'nothing', worn: 'yes' },
    { w: { en: 'LAMP', ar: 'مصباح' }, colour: 'blue', shape: 'square', shows: 'nothing', worn: 'no' },
  ], [
    { key: 'colour', en: 'by colour', ar: 'حسب اللون' },
    { key: 'shape', en: 'by shape', ar: 'حسب الشكل' },
    { key: 'shows', en: 'tells the time', ar: 'يدلّ على الوقت' },
    { key: 'worn', en: 'worn on the body', ar: 'يُلبس' },
  ]),
];

/**
 * Which feature (if any) a chosen trio shares.
 *
 * Derived, not looked up — see the note at the top. A trio is a valid split
 * exactly when all three share a value on one of the set's declared features;
 * because every feature divides the six 3–3, the other three then necessarily
 * share the opposite value.
 */
export function ruleForTrio(setDef, trio) {
  for (const f of setDef.features) {
    const v = setDef.cards[trio[0]][f.key];
    if (trio.every((i) => setDef.cards[i][f.key] === v)) return f;
  }
  return null;
}

/** Every set of one tier. */
export function setsForTier(tier) {
  const pick = SORT_SETS.filter((s) => s.tier === tier);
  return pick.length ? pick : SORT_SETS;
}

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * ⚠ THIS GAME IS WHY THE POOL ACCUMULATES INSTEAD OF SLIDING. There are only
 * THREE sets per tier. A band drawing from one tier alone would cycle the same
 * three boards for ten levels — the precise repetition the ladder exists to
 * remove. So the pool grows as you climb and the newest tier is weighted up:
 * the top band draws from all nine sets, but sees a hard one most of the time.
 *
 * The second lever is how many of a set's rules you must FIND before it
 * clears. Two is a taster; all three is the real task, and it arrives at band 2
 * rather than being locked behind a menu word as it was on the old easy tier.
 */
import { BAND_SIZE, ladderFraction, mechanicsAt, pickWeighted, tierMass } from '../../../../shared/difficulty.js';

/** Tier order, easiest first — the axis `tierMass` measures along. */
export const TIER_ORDER = ['easy', 'med', 'hard'];

export const LADDER = [
  /* L1–10  */ { tiers: { easy: 1 }, rules: 2, adds: ['sort'] },
  /* L11–20 */ { tiers: { easy: 1 }, rules: 3, adds: ['allRules'] },
  /* L21–30 */ { tiers: { easy: 0.30, med: 0.70 }, rules: 3, adds: ['meaning'] },
  /* L31–40 */ { tiers: { easy: 0.15, med: 0.45, hard: 0.40 }, rules: 3, adds: ['abstract'] },
  /* L41–50 */ { tiers: { easy: 0.10, med: 0.30, hard: 0.60 }, rules: 3, adds: [] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  sort: { en: 'Find a way to group them', ar: 'جد طريقة لتجميعها' },
  allRules: { en: 'Find every rule', ar: 'جد كل القواعد' },
  meaning: { en: 'Rules hide in meaning', ar: 'القواعد في المعنى' },
  abstract: { en: 'Abstract rules', ar: 'قواعد مجرّدة' },
};

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  return {
    tiers: b.tiers,
    rules: b.rules,
    tierMass: tierMass(b.tiers, TIER_ORDER),
    poolSize: Object.keys(b.tiers).reduce((n, t) => n + setsForTier(t).length, 0),
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f: ladderFraction(lv, LADDER_LEVELS),
  };
}

/** The sets a level may deal, drawn by the band's weights. */
export function pickSetTier(cfg, rng) {
  return pickWeighted(cfg.tiers, rng) || 'easy';
}
