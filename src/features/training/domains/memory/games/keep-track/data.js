/*
 * Keep Track — content bank and difficulty curve.
 *
 * The task (Miyake et al. 2000): a stream of words goes past, each shown with
 * its category. Several categories are named up front as TARGETS. At the end
 * the player reports the LAST word they saw in each target category — so every
 * new exemplar of a tracked category must overwrite the one before it. That
 * overwriting is working-memory updating, and it is the construct Story Time
 * and Pair Match do not touch.
 *
 * ⚠ THE INVARIANT THAT MATTERS: no exemplar may appear in two categories.
 * A word that plausibly belongs to two live categories makes a trial
 * unanswerable, and it is invisible to review — you cannot eye-check 120 words
 * against each other. `npm run validate:keeptrack` asserts it instead, in both
 * languages, the way validate:sort enumerates card splits rather than trusting
 * the author. This is why the colour list has no "olive", "amber" or "violet",
 * and the metals category was dropped entirely: each collided with a plant, a
 * stone or a flower somewhere else in the bank.
 *
 * ⚠ The Arabic bank is a FIRST DRAFT and needs a native review pass. The
 * structural invariants are gated, but typicality and word frequency are not —
 * and they do not survive translation. The prototypical bird in English is not
 * the prototypical bird in Arabic, and Keep Track leans on typicality.
 */

import {
  BAND_SIZE, ladderFraction, ladderStage, mechanicsAt,
} from '../../../../shared/difficulty.js';

export const CATEGORIES = [
  {
    id: 'animals',
    name: { en: 'Animals', ar: 'حيوانات' },
    items: {
      en: ['camel', 'falcon', 'dolphin', 'wolf', 'gazelle', 'heron', 'lynx', 'otter', 'ibex', 'badger'],
      ar: ['جمل', 'صقر', 'دولفين', 'ذئب', 'غزال', 'بلشون', 'وشق', 'قندس', 'وعل', 'غرير'],
    },
  },
  {
    id: 'colours',
    name: { en: 'Colours', ar: 'ألوان' },
    items: {
      // No olive / amber / violet / turquoise here on purpose — each is also a
      // plant, a stone or a flower, and the gate rejects cross-category words.
      en: ['crimson', 'indigo', 'teal', 'magenta', 'beige', 'maroon', 'scarlet', 'khaki', 'mauve', 'cyan'],
      ar: ['قرمزي', 'نيلي', 'فيروزي', 'أرجواني', 'بيج', 'عنابي', 'قاني', 'كاكي', 'بنفسجي', 'سماوي'],
    },
  },
  {
    id: 'countries',
    name: { en: 'Countries', ar: 'بلدان' },
    items: {
      en: ['Brazil', 'Norway', 'Kenya', 'Japan', 'Peru', 'Egypt', 'Iceland', 'Vietnam', 'Morocco', 'Chile'],
      ar: ['البرازيل', 'النرويج', 'كينيا', 'اليابان', 'بيرو', 'مصر', 'آيسلندا', 'فيتنام', 'المغرب', 'تشيلي'],
    },
  },
  {
    id: 'instruments',
    name: { en: 'Instruments', ar: 'آلات موسيقية' },
    items: {
      en: ['violin', 'flute', 'cello', 'harp', 'trumpet', 'clarinet', 'piano', 'accordion', 'banjo', 'tambourine'],
      ar: ['كمان', 'ناي', 'تشيلو', 'قيثارة', 'بوق', 'كلارينيت', 'بيانو', 'أكورديون', 'بانجو', 'دف'],
    },
  },
  {
    id: 'weather',
    name: { en: 'Weather', ar: 'طقس' },
    items: {
      en: ['drizzle', 'hail', 'monsoon', 'frost', 'gale', 'haze', 'thunder', 'blizzard', 'sleet', 'drought'],
      ar: ['رذاذ', 'برد', 'موسمية', 'صقيع', 'زوبعة', 'ضباب', 'رعد', 'عاصفة ثلجية', 'مطر متجمد', 'جفاف'],
    },
  },
  {
    id: 'furniture',
    name: { en: 'Furniture', ar: 'أثاث' },
    items: {
      en: ['wardrobe', 'stool', 'bookcase', 'bench', 'dresser', 'couch', 'cradle', 'desk', 'cabinet', 'mattress'],
      ar: ['خزانة', 'كرسي', 'مكتبة', 'مصطبة', 'تسريحة', 'أريكة', 'مهد', 'مكتب', 'رف', 'مرتبة'],
    },
  },
];

/*
 * Difficulty. Three levers, all of which make updating harder rather than
 * making the words harder: how many categories you must hold at once, how long
 * the stream runs, and how fast it moves.
 */

/** Floor for ms-per-word, asserted by `npm run audit:pacing`. */
export const KEEP_TRACK_MIN_RATE = 1200;

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. This replaced easy/med/hard on
 * 2026-08-28; Keep Track was the pilot for the platform-wide migration and the
 * reasoning behind bands lives in `shared/difficulty.js`.
 *
 * The three tiers were never three difficulties HERE, and this game is the
 * clearest case in the app: `targets` was 2→2 across all hundred Easy levels,
 * 3→3 across Medium, 4→4 across Hard. The one lever that changes what the task
 * asks of working memory only ever moved when the player backed out to a menu
 * and chose a different word. Now it moves at L21 and L41, by playing.
 *
 * The span is unchanged at both ends — L1 is the old easy L1, L50 is the old
 * hard L100 — so nothing got easier or harder. What went away is 250 levels of
 * repetition in the middle.
 *
 * ⚠ WHY 50 AND NOT 100. Counting only mechanics a player can NAME, this game
 * currently has three: hold two, hold three, hold four. Five bands is what that
 * honestly supports, and the number was not chosen — it was FOUND. The first
 * draft of this table had six bands, and `audit:curves` rejected it: L51–60
 * introduced no mechanic and moved no structural lever, so it was ten levels of
 * the same game slightly faster. That is the tier problem in miniature, and the
 * fix was to delete the band rather than soften the gate.
 *
 * The empty `adds` below are the SLOTS for the deferred feature work, and the
 * ladder grows when they are filled. Growing is safe (cleared levels stay
 * cleared); shrinking takes levels away from people who earned them.
 *
 * ⚠ `rate` is ms per stream word, and it is NOT the difficulty lever.
 * Reported 2026-08-15 as "it goes so fast, I don't have time to memorize". It
 * was 1500/1250/1000 falling to a 650ms floor — but every word costs the player
 * a read, a category decision, and (if it is a target category) an overwrite of
 * what they were holding. Miyake et al. present the keep-track stream at about
 * 2s per word for exactly that reason. At 650ms the task stopped measuring
 * updating and started measuring reading speed. Difficulty comes from LOAD —
 * targets, pool and stream length. `audit:pacing` gates the floor so this
 * cannot be quietly traded back for a harder-looking curve.
 */
export const LADDER = [
  /* L1–10  */ { targets: 2, pool: 4, adds: ['track'] },
  /* L11–20 */ { targets: 2, pool: 5, adds: [] },
  /* L21–30 */ { targets: 3, pool: 5, adds: ['hold3'] },
  /* L31–40 */ { targets: 3, pool: 6, adds: [] },
  /* L41–50 */ { targets: 4, pool: 6, adds: ['hold4'] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

/** What arrives at each band, for the level grid and the results screen. */
export const MECHANIC_LABELS = {
  track: { en: 'Track the last word', ar: 'تتبّع آخر كلمة' },
  hold3: { en: 'A third category', ar: 'فئة ثالثة' },
  hold4: { en: 'A fourth category', ar: 'فئة رابعة' },
};

/**
 * Level config. Front-loaded (^0.85) so early levels feel distinct.
 *
 * ⚠ SIGNATURE CHANGED with the ladder: `levelCfg(level)`, one argument. The
 * old `levelCfg(diff, level)` is gone rather than shimmed, deliberately — a
 * shim that quietly accepted a tier name would let a caller keep passing
 * 'easy' and silently get band 0 forever.
 */
export function levelCfg(level) {
  const lv = Math.min(LADDER_LEVELS, Math.max(1, Math.round(Number(level) || 1)));
  const band = LADDER[Math.min(LADDER.length - 1, Math.floor((lv - 1) / BAND_SIZE))];
  const f = ladderFraction(lv, LADDER_LEVELS);
  return {
    targets: band.targets,
    pool: band.pool,
    stream: 10 + Math.round(f * 16),
    // Floor 1200ms: still brisk, still readable. The old floor was 650.
    rate: Math.max(KEEP_TRACK_MIN_RATE, Math.round(2200 - f * 1000)),
    mechanics: mechanicsAt(LADDER, lv),
    lv,
    f,
  };
}

/** Survival: one continuous ramp up the ladder, then it clamps at the top. */
export function survivalCfg(stage) {
  const { lv } = ladderStage(stage, { levels: LADDER_LEVELS });
  return { lv, ...levelCfg(lv) };
}

/*
 * Build one round.
 *
 * Guarantees, all of which the gate checks rather than trusting:
 *  • every target category appears at least twice, so there is genuinely
 *    something to overwrite — a category seen once tests storage, not updating;
 *  • the final answer for a target is never also its first appearance;
 *  • no two consecutive stream items come from the same category, which would
 *    let the player batch rather than update.
 */
export function buildRound(cfg, lang, rng = Math.random) {
  const pick = (arr) => arr[Math.floor(rng() * arr.length)];
  const shuffled = CATEGORIES.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pool = shuffled.slice(0, Math.min(cfg.pool, shuffled.length));
  const targets = pool.slice(0, Math.min(cfg.targets, pool.length));

  const counts = {};
  pool.forEach((c) => { counts[c.id] = 0; });
  const stream = [];
  let guard = 0;
  while (stream.length < cfg.stream && guard++ < 2000) {
    // Force any under-served target to appear rather than leaving it to chance.
    const owed = targets.filter((c) => counts[c.id] < 2
      && (cfg.stream - stream.length) <= (2 - counts[c.id]) * targets.length);
    const cat = owed.length ? owed[0] : pick(pool);
    if (stream.length && stream[stream.length - 1].catId === cat.id) continue;
    const items = cat.items[lang] || cat.items.en;
    let word = pick(items);
    // Don't repeat a word inside one round: "the last one" must be unambiguous.
    if (stream.some((s) => s.word === word)) {
      const free = items.filter((w) => !stream.some((s) => s.word === w));
      if (!free.length) continue;
      word = free[Math.floor(rng() * free.length)];
    }
    stream.push({ catId: cat.id, word });
    counts[cat.id] += 1;
  }

  // Any target still short of two appearances gets topped up at the end.
  targets.forEach((cat) => {
    while (counts[cat.id] < 2 && stream.length < cfg.stream + targets.length * 2) {
      const items = cat.items[lang] || cat.items.en;
      const free = items.filter((w) => !stream.some((s) => s.word === w));
      if (!free.length) break;
      if (stream[stream.length - 1]?.catId === cat.id) {
        const other = pool.find((c) => c.id !== cat.id);
        if (!other) break;
        const oItems = (other.items[lang] || other.items.en)
          .filter((w) => !stream.some((s) => s.word === w));
        if (!oItems.length) break;
        stream.push({ catId: other.id, word: oItems[0] });
        counts[other.id] += 1;
      }
      stream.push({ catId: cat.id, word: free[Math.floor(rng() * free.length)] });
      counts[cat.id] += 1;
    }
  });

  const answers = {};
  targets.forEach((cat) => {
    for (let i = stream.length - 1; i >= 0; i--) {
      if (stream[i].catId === cat.id) { answers[cat.id] = stream[i].word; break; }
    }
  });

  return { pool, targets, stream, answers };
}

/* ── Answer matching ─────────────────────────────────────────────────────── */

/** Arabic needs normalising before comparison: alef forms, taa marbuta, yaa, tashkeel. */
export function normalise(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Typed free recall, so this is genuine recall rather than recognition — but a
 * one-character slip is a typo, not a memory failure, so short words must match
 * exactly and longer ones tolerate a single edit.
 */
export function isCorrect(typed, expected) {
  const a = normalise(typed), b = normalise(expected);
  if (!a) return false;
  if (a === b) return true;
  return b.length >= 5 && editDistance(a, b) <= 1;
}
