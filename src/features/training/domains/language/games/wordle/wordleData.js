/**
 * Word Maze — connect adjacent letters to spell words (Boggle-style).
 */

import { mulberry32 } from '../../../../../../lib/rng';
import { LINK_WORDS_EN } from './link-words-en';
import { LINK_WORDS_AR_COMMON } from './link-words-ar-common';
import { computeGridWords } from './linkDictionary';
import { clamp, lerp } from '../../../../../../lib/math';

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

const PLACE_POOL = LINK_WORDS_EN.filter((w) => w.length >= 3 && w.length <= 5);
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

export function isValidLinkedWord(word, gridWords, minLen) {
  return word.length >= minLen && gridWords.has(word);
}

export function scoreLinkedWord(word) {
  const n = word.length;
  return n * n;
}

export function specificationForLevel(diff, lv) {
  const key = WORDLE_DIFF_KEYS.includes(diff) ? diff : 'easy';
  const li = clamp(lv, 1, WORDLE_LEVELS_PER_TIER);
  const t = (li - 1) / (WORDLE_LEVELS_PER_TIER - 1);
  const size = key === 'easy' ? 4 : 5;
  const minLen = key === 'hard' ? 4 : 3;
  const targetWords = Math.round(
    lerp(key === 'easy' ? 4 : 5, key === 'easy' ? 7 : key === 'medium' ? 9 : 12, t),
  );
  const timeSec = Math.round(lerp(75, 55, t));
  return { diff: key, lv: li, size, minLen, targetWords, timeSec };
}

export function createRound(seed, spec, extra = {}, lang = 'en') {
  const grid = generateLetterGrid(spec.size, seed, lang);
  const gridWords = computeGridWords(grid, spec.size, spec.minLen, lang);
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

export function isWordleLevelUnlocked(diff, lv, doneMap) {
  if (lv <= 1) return true;
  return !!(doneMap[`${diff}-${lv - 1}`] || doneMap[`${diff}-${lv}`]);
}

export function freeStageToDiffLv(stage) {
  const s = Math.max(0, stage | 0);
  const max = WORDLE_PROGRESS_ORDER.length * WORDLE_LEVELS_PER_TIER - 1;
  const capped = Math.min(s, max);
  const diffIx = Math.floor(capped / WORDLE_LEVELS_PER_TIER);
  return {
    diff: WORDLE_PROGRESS_ORDER[diffIx],
    lv: (capped % WORDLE_LEVELS_PER_TIER) + 1,
  };
}

export function prepareFreeRound(stage, seed, lang = 'en') {
  const { diff, lv } = freeStageToDiffLv(stage);
  const spec = specificationForLevel(diff, lv);
  // Small per-grid target that grows slowly, on a shrinking per-grid clock.
  const targetWords = Math.min(6, 3 + Math.floor(stage / 10));
  const timeSec = Math.max(35, 60 - Math.floor(stage * 0.8));
  return createRound(seed, { ...spec, targetWords, timeSec }, { mode: 'free', freeStage: stage }, lang);
}

export function prepareLevelRound(diff, lv, seed, lang = 'en') {
  const spec = specificationForLevel(diff, lv);
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

export function prepareChallengeSeed(diff = 'medium', lang = 'en') {
  const d = WORDLE_DIFF_KEYS.includes(diff) ? diff : 'medium';
  const lv = WORDLE_PASS_PLAY_LV[d] ?? CHALLENGE_LEVEL.lv;
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const spec = specificationForLevel(d, lv);
  return { seed, spec, diff: d, lv, lang };
}

export function prepareChallengeRound(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
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
