/**
 * Word Maze — connect adjacent letters to spell words (Boggle-style).
 */

import { mulberry32 } from '../../../../../../lib/rng.js';
import { LINK_WORDS_EN_COMMON } from './link-words-en-common.js';
import { LINK_WORDS_AR_COMMON } from './link-words-ar-common.js';
import { computeGridWords } from './linkDictionary.js';
import { CURATED_EN_SHORT, CURATED_MAX_LEN } from './link-words-en-curated.js';
import { clamp, lerp } from '../../../../../../lib/math.js';
import { BAND_SIZE, ladderFraction, mechanicsAt } from '../../../../shared/difficulty.js';

export const WORDLE_LEVELS_PER_TIER = 100;
export const WORDLE_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const WORDLE_PROGRESS_ORDER = ['easy', 'medium', 'hard'];

export const WORDLE_DM = {
  easy: { label: 'Easy', labelAr: 'سهل', pop: 'Common words · 3+ letters', popAr: 'كلمات شائعة · ٣+ حروف', lvc: 'lve', grid: 4 },
  medium: { label: 'Medium', labelAr: 'متوسط', pop: 'Mixed vocabulary · 3+ letters', popAr: 'مفردات متنوعة · ٣+ حروف', lvc: 'lvi', grid: 5 },
  hard: { label: 'Hard', labelAr: 'صعب', pop: 'Tougher words · 4+ letters', popAr: 'كلمات أصعب · ٤+ حروف', lvc: 'lvh', grid: 5 },
};

export function wordleDiffMeta(diff, isAr) {
  const d = WORDLE_DM[diff] ?? WORDLE_DM.easy;
  return { label: isAr ? d.labelAr : d.label, pop: isAr ? d.popAr : d.pop, lvc: d.lvc, grid: d.grid };
}

export const WORDLE_FREE_SESSION_START_SEC = 90;
export const WORDLE_FREE_SESSION_CAP_SEC = 180;

/** Free mode is endless and lives-based: reach the (small) word target on each
 *  grid before its timer runs out. Clear → harder grid; time out → lose a life;
 *  run ends at 0 lives. */
export const WORDLE_FREE_LIVES = 3;

const CHALLENGE_LEVEL = { diff: 'medium', lv: 10 };
/** Pass-n-Play representative level per difficulty. */
export const WORDLE_PASS_PLAY_LV = { easy: 10, medium: 10, hard: 10 };

const PLACE_POOL = LINK_WORDS_EN_COMMON.filter((w) => w.length >= 3 && w.length <= 5);
// Seed Arabic grids from the CURATED common list so boards are made of familiar
// words; the full corpus is still used to validate whatever the player finds.
const PLACE_POOL_AR = LINK_WORDS_AR_COMMON.filter((w) => w.length >= 3 && w.length <= 5);

const VOWELS = 'eeeeaaaoooiiiuu';
const CONSONANTS = 'rstlnccddppmmhbbffwwyyggvvkk';
// Arabic filler weighted by rough letter frequency (long vowels + common consonants).
const VOWELS_AR = 'اااااويييه';
const CONSONANTS_AR = 'لللنننممرررتتببسسددعففقققككهحجشطزخصضذثغ';

function langPools(lang) {
  return lang === 'ar'
    ? { place: PLACE_POOL_AR, vowels: VOWELS_AR, consonants: CONSONANTS_AR, vowelRate: 0.5 }
    : { place: PLACE_POOL, vowels: VOWELS, consonants: CONSONANTS, vowelRate: 0.42 };
}

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];



function rcToIdx(r, c, size) {
  return r * size + c;
}

function pickWeightedLetter(rng, pools) {
  const pool = rng() < pools.vowelRate ? pools.vowels : pools.consonants;
  return pool[Math.floor(rng() * pool.length)];
}

function tryPlaceWord(grid, size, word, rng) {
  const len = word.length;
  for (let attempt = 0; attempt < 48; attempt++) {
    const r0 = Math.floor(rng() * size);
    const c0 = Math.floor(rng() * size);
    const [dr, dc] = DIRS[Math.floor(rng() * DIRS.length)];
    const cells = [];
    let ok = true;
    for (let k = 0; k < len; k++) {
      const r = r0 + dr * k;
      const c = c0 + dc * k;
      if (r < 0 || c < 0 || r >= size || c >= size) {
        ok = false;
        break;
      }
      const idx = rcToIdx(r, c, size);
      if (grid[idx] && grid[idx] !== word[k]) {
        ok = false;
        break;
      }
      cells.push(idx);
    }
    if (!ok || cells.length !== len) continue;
    for (let k = 0; k < len; k++) grid[cells[k]] = word[k];
    return true;
  }
  return false;
}

export function generateLetterGrid(size, seed, lang = 'en') {
  const pools = langPools(lang);
  const rng = mulberry32(seed >>> 0);
  const grid = Array(size * size).fill('');
  const picks = [];
  const nPlace = Math.min(6, 3 + Math.floor(size * 0.8));
  for (let i = 0; i < nPlace; i++) {
    const w = pools.place[Math.floor(rng() * pools.place.length)];
    if (w && tryPlaceWord(grid, size, w, rng)) picks.push(w);
  }
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) grid[i] = pickWeightedLetter(rng, pools);
  }
  return grid;
}

export function isAdjacent(a, b, size) {
  if (a === b) return false;
  const ar = Math.floor(a / size);
  const ac = a % size;
  const br = Math.floor(b / size);
  const bc = b % size;
  return Math.abs(ar - br) <= 1 && Math.abs(ac - bc) <= 1;
}

export function wordFromPath(path, grid) {
  return path.map((i) => grid[i]).join('').toLowerCase();
}

/**
 * Is this a word the game will accept at all?
 *
 * `computeGridWords` searches words_alpha.txt, which at 3–4 letters is mostly
 * abbreviations and archaic forms — 2,130 three-letter entries including aal,
 * abt, abv, aeq, and 7,186 four-letter including abbr, acct, acpt. A player
 * tracing letters in what looked like a scramble kept hitting one and being
 * told "correct" (`sart` scored). Reported 2026-08-15.
 *
 * 5+ letters keep the permissive corpus: nobody traces a five-letter path by
 * accident, so discovery stays open. Arabic is unaffected — its corpus is
 * already paired with a curated common list (see linkDictionary.js).
 *
 * ⚠ Applied when the ROUND IS BUILT, not at submit time. If it were only a
 * submit-time filter, `gridWords` would still count the junk — and the
 * pass-target clamp below divides by that count, so a grid with 50 corpus words
 * but 8 real ones would set a target of 12 and be unwinnable. Filtering here
 * keeps the clamp, the target and the player looking at the same set. Same
 * lesson as audit:fq certifying a board nobody could clear.
 */
export function acceptableWord(word, lang = 'en') {
  if (lang === 'ar' || word.length > CURATED_MAX_LEN) return true;
  return CURATED_EN_SHORT.has(word);
}

export function isValidLinkedWord(word, gridWords, minLen) {
  return word.length >= minLen && gridWords.has(word);
}

export function scoreLinkedWord(word) {
  const n = word.length;
  return n * n;
}

/*
 * ── THE LADDER ──
 *
 * ONE climb of 50 levels, in five bands of ten. Replaced easy/med/hard on
 * 2026-08-28 — see LADDER-PLAN.md and shared/difficulty.js.
 *
 * ⚠ Word Maze has only TWO structural states to spend — the grid grows 4→5 and
 * the minimum word length goes 3→4 — so, like Task Switch, the honest per-band
 * lever is the LOAD: how many words the board asks you to find. Each band steps
 * it, which is a change the player meets directly, rather than padding the
 * ladder with bands that are the same board slightly faster.
 *
 * Span unchanged at both ends: L1 is the old easy L1 (4×4 grid, 3-letter words,
 * find 4, 75s) and L50 the old hard L100 (5×5, 4-letter minimum, find 12, 55s).
 *
 * ⚠ `targetWords` is what `validate:wordmaze` simulates against. It builds real
 * boards through createRound() and asserts the findable words exceed the target
 * by 1.5×, because a player never finds every word on a grid. Raising a band's
 * target without running that gate can make a level unwinnable in a way nothing
 * else would catch.
 */
export const LADDER = [
  /* L1–10  */ { size: 4, minLen: 3, targetWords: 4, adds: ['find'] },
  /* L11–20 */ { size: 4, minLen: 3, targetWords: 6, adds: [] },
  /* L21–30 */ { size: 5, minLen: 3, targetWords: 8, adds: ['biggerGrid'] },
  /* L31–40 */ { size: 5, minLen: 4, targetWords: 10, adds: ['longerWords'] },
  /* L41–50 */ { size: 5, minLen: 4, targetWords: 12, adds: [] },
];

export const LADDER_LEVELS = LADDER.length * BAND_SIZE; // 50

export const MECHANIC_LABELS = {
  find: { en: 'Trace words in the grid', ar: 'تتبّع الكلمات في الشبكة' },
  biggerGrid: { en: 'A bigger grid', ar: 'شبكة أكبر' },
  longerWords: { en: 'Four letters minimum', ar: 'أربعة أحرف على الأقل' },
};

/** ⚠ SIGNATURE CHANGED with the ladder: one argument, no tier. */
export function specificationForLevel(lv) {
  const li = clamp(Math.round(Number(lv) || 1), 1, LADDER_LEVELS);
  const b = LADDER[Math.min(LADDER.length - 1, Math.floor((li - 1) / BAND_SIZE))];
  const t = ladderFraction(li, LADDER_LEVELS);
  return {
    lv: li,
    size: b.size,
    minLen: b.minLen,
    targetWords: b.targetWords,
    timeSec: Math.round(lerp(75, 55, t)),
    mechanics: mechanicsAt(LADDER, li),
  };
}

export function createRound(seed, spec, extra = {}, lang = 'en') {
  const grid = generateLetterGrid(spec.size, seed, lang);
  const gridWords = new Set(
    [...computeGridWords(grid, spec.size, spec.minLen, lang)]
      .filter((w) => acceptableWord(w, lang)),
  );
  // Keep the pass target achievable on THIS grid (essential for the sparser
  // Arabic dictionary): never ask for more than ~60% of the findable words.
  let targetWords = spec.targetWords;
  if (extra.mode === 'level' || extra.mode === 'free') {
    targetWords = Math.max(3, Math.min(targetWords, Math.floor(gridWords.size * 0.6)));
  }
  return {
    ...spec,
    ...extra,
    targetWords,
    lang,
    seed: seed >>> 0,
    grid,
    gridWords,
    found: [],
    score: 0,
    timeLeft: spec.timeSec ?? 75,
    complete: false,
    failed: false,
  };
}

function isValidPathChain(path, size) {
  if (path.length === 0) return false;
  for (let i = 1; i < path.length; i++) {
    if (!isAdjacent(path[i - 1], path[i], size)) return false;
  }
  return true;
}

export function trySubmitWord(round, path) {
  if (!isValidPathChain(path, round.size)) {
    return { ok: false, reason: 'invalid' };
  }
  const word = wordFromPath(path, round.grid);
  if (word.length < round.minLen) {
    return { ok: false, reason: 'short' };
  }
  // Accept the word; for Arabic also accept it traced right-to-left (the same
  // letters in reverse order), since RTL players may drag the other way.
  let canonical = null;
  if (isValidLinkedWord(word, round.gridWords, round.minLen)) {
    canonical = word;
  } else if (round.lang === 'ar') {
    const rev = word.split('').reverse().join('');
    if (isValidLinkedWord(rev, round.gridWords, round.minLen)) canonical = rev;
  }
  if (!canonical) {
    return { ok: false, reason: 'invalid' };
  }
  if (round.found.includes(canonical)) {
    return { ok: false, reason: 'duplicate' };
  }
  const pts = scoreLinkedWord(canonical);
  round.found.push(canonical);
  round.score += pts;
  if (
    (round.mode === 'level' || round.mode === 'free') &&
    round.found.length >= round.targetWords
  ) {
    round.complete = true;
  }
  return { ok: true, word: canonical, pts };
}

/** Verbal Fluency Score from words found vs target (levels) or efficiency (timed). */
export function computeVFS(round) {
  if (round.mode === 'assess') {
    const sec = round.timeSec || 120;
    const words = round.found.length;
    const wpm = (words / sec) * 60;
    const avgLen = words > 0 ? round.found.reduce((s, w) => s + w.length, 0) / words : 0;
    // Rate-based: ~12 words/min ≈ strong; length bonus rewards longer finds without early ceiling.
    return Math.min(100, Math.round(wpm * 4.8 + avgLen * 2.2));
  }
  if (round.mode === 'level') {
    if (!round.complete) return 0;
    const ratio = round.found.length / Math.max(1, round.targetWords);
    const timeBonus = clamp(round.timeLeft / (round.timeSec || 75), 0, 1) * 25;
    return Math.min(100, Math.round(60 * ratio + timeBonus + Math.min(15, round.found.length)));
  }
  const avgLen =
    round.found.length > 0
      ? round.found.reduce((s, w) => s + w.length, 0) / round.found.length
      : 0;
  return Math.min(100, Math.round(round.found.length * 8 + avgLen * 6));
}

export function gradeRound(round) {
  const vfs = computeVFS(round);
  const won =
    round.mode === 'level'
      ? round.complete
      : round.found.length > 0;
  let stars = 0;
  if (round.mode === 'level' && round.complete) {
    stars = 1;
    if (round.timeLeft >= (round.timeSec || 75) * 0.35) stars = 2;
    if (round.timeLeft >= (round.timeSec || 75) * 0.55) stars = 3;
  }
  return { won, stars, vfs };
}

/* ⚠ LADDER PROGRESS: flat `lad-N` keys. The old per-tier keys stay on disk so
   migrateLadderReached can read them once and the change stays reversible. */
export function isWordleLevelUnlocked(lv, doneMap, reached = 0) {
  if (lv <= 1) return true;
  if (lv <= (reached || 0) + 1) return true;
  return !!(doneMap[`lad-${lv - 1}`] || doneMap[`lad-${lv}`]);
}

/** Deepest level under the old tiers → a level on the ladder (best tier wins). */
export function migrateLadderReached(doneMap) {
  const per = LADDER_LEVELS / WORDLE_DIFF_KEYS.length;
  let reached = 0;
  WORDLE_DIFF_KEYS.forEach((k, i) => {
    let deepest = 0;
    for (const key of Object.keys(doneMap || {})) {
      const m = key.match(/^([a-z]+)-(\d+)$/);
      if (m && m[1] === k) deepest = Math.max(deepest, Number(m[2]) || 0);
    }
    if (deepest > 0) {
      reached = Math.max(reached, Math.round(i * per + (deepest / WORDLE_LEVELS_PER_TIER) * per));
    }
  });
  return Math.max(0, Math.min(LADDER_LEVELS, reached));
}

/** Survival stage → a level on the ladder (it used to be a tier + a level). */
export function freeStageToDiffLv(stage) {
  const s = Math.max(0, stage | 0);
  return { lv: clamp(s + 1, 1, LADDER_LEVELS) };
}

export function prepareFreeRound(stage, seed, lang = 'en') {
  const { lv } = freeStageToDiffLv(stage);
  const spec = specificationForLevel(lv);
  // Small per-grid target that grows slowly, on a shrinking per-grid clock.
  const targetWords = Math.min(6, 3 + Math.floor(stage / 10));
  const timeSec = Math.max(35, 60 - Math.floor(stage * 0.8));
  return createRound(seed, { ...spec, targetWords, timeSec }, { mode: 'free', freeStage: stage }, lang);
}

export function prepareLevelRound(lv, seed, lang = 'en') {
  const spec = specificationForLevel(lv);
  return createRound(seed, spec, { mode: 'level' }, lang);
}

/** One fixed, open-ended timed grid for the global assessment (verbal fluency). */
export function prepareAssessRound(seed, lang = 'en') {
  const spec = specificationForLevel('medium', 50);
  return createRound(
    seed,
    { ...spec, timeSec: 120, targetWords: 999 },
    { mode: 'assess' },
    lang,
  );
}

/* Pass n Play depths on the ladder — three points on one climb. */
export const WORDLE_PP_DEPTHS = { start: 12, mid: 27, deep: 43 };
export function prepareChallengeSeed(depth = 'mid', lang = 'en') {
  const lv = WORDLE_PP_DEPTHS[depth] ?? WORDLE_PP_DEPTHS.mid;
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const spec = specificationForLevel(lv);
  return { seed, spec, depth, lv, lang };
}

export function prepareChallengeRound(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(WORDLE_PP_DEPTHS.mid);
  return createRound(
    cSeed.seed,
    { ...spec, timeSec: 90, targetWords: 999 },
    { mode: 'challenge' },
    cSeed.lang ?? 'en',
  );
}

export function freeClearBonusSec(stage) {
  return +Math.min(12, Math.max(1, 2 + 10 / (1 + stage * 0.15))).toFixed(1);
}

export function freeWordPoints(pts, streak) {
  return Math.max(3, Math.round(pts * (1 + Math.min(streak, 12) * 0.05)));
}

export function mergeWordleChallengeRow(prev, grade, round, name) {
  const snap = { vfs: grade.vfs, score: round.score, words: round.found.length };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  let vfsSum = 0;
  let scoreSum = 0;
  for (const r of rounds) {
    vfsSum += r.vfs;
    scoreSum += r.score;
  }
  return {
    nm: name,
    rounds,
    vfs: Math.round(vfsSum / n),
    totalScore: scoreSum,
    avgWords: +(rounds.reduce((s, r) => s + r.words, 0) / n).toFixed(1),
    last: snap,
  };
}

export function compareWordleChallengeRows(a, b) {
  if (b.vfs !== a.vfs) return b.vfs - a.vfs;
  return b.totalScore - a.totalScore;
}
