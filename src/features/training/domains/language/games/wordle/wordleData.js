/**
 * Word Maze — connect adjacent letters to spell words (Boggle-style).
 */

import { LINK_WORDS_EN } from './link-words-en';
import { computeGridWords } from './linkDictionary';

export const WORDLE_LEVELS_PER_TIER = 20;
export const WORDLE_DIFF_KEYS = ['easy', 'medium', 'hard'];
export const WORDLE_PROGRESS_ORDER = ['easy', 'medium', 'hard'];

export const WORDLE_DM = {
  easy: { label: 'Easy', pop: 'Common words · 3+ letters', lvc: 'lve', grid: 4 },
  medium: { label: 'Medium', pop: 'Mixed vocabulary · 3+ letters', lvc: 'lvi', grid: 5 },
  hard: { label: 'Hard', pop: 'Tougher words · 4+ letters', lvc: 'lvh', grid: 5 },
};

export const WORDLE_FREE_SESSION_START_SEC = 90;
export const WORDLE_FREE_SESSION_CAP_SEC = 180;

const CHALLENGE_LEVEL = { diff: 'medium', lv: 10 };

const PLACE_POOL = LINK_WORDS_EN.filter((w) => w.length >= 3 && w.length <= 5);

const VOWELS = 'eeeeaaaoooiiiuu';
const CONSONANTS = 'rstlnccddppmmhbbffwwyyggvvkk';

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rcToIdx(r, c, size) {
  return r * size + c;
}

function pickWeightedLetter(rng) {
  const pool = rng() < 0.42 ? VOWELS : CONSONANTS;
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

export function generateLetterGrid(size, seed) {
  const rng = mulberry32(seed >>> 0);
  const grid = Array(size * size).fill('');
  const picks = [];
  const nPlace = Math.min(6, 3 + Math.floor(size * 0.8));
  for (let i = 0; i < nPlace; i++) {
    const w = PLACE_POOL[Math.floor(rng() * PLACE_POOL.length)];
    if (w && tryPlaceWord(grid, size, w, rng)) picks.push(w);
  }
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i]) grid[i] = pickWeightedLetter(rng);
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

export function createRound(seed, spec, extra = {}) {
  const grid = generateLetterGrid(spec.size, seed);
  const gridWords = computeGridWords(grid, spec.size, spec.minLen);
  return {
    ...spec,
    seed: seed >>> 0,
    grid,
    gridWords,
    found: [],
    score: 0,
    timeLeft: spec.timeSec ?? 75,
    complete: false,
    failed: false,
    ...extra,
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
  if (!isValidLinkedWord(word, round.gridWords, round.minLen)) {
    return { ok: false, reason: 'invalid' };
  }
  if (round.found.includes(word)) {
    return { ok: false, reason: 'duplicate' };
  }
  const pts = scoreLinkedWord(word);
  round.found.push(word);
  round.score += pts;
  if (round.mode === 'level' && round.found.length >= round.targetWords) {
    round.complete = true;
  }
  return { ok: true, word, pts };
}

/** Verbal Fluency Score from words found vs target (levels) or efficiency (timed). */
export function computeVFS(round) {
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

export function prepareFreeRound(stage, seed) {
  const { diff, lv } = freeStageToDiffLv(stage);
  const spec = specificationForLevel(diff, lv);
  return createRound(seed, { ...spec, timeSec: 9999 }, { mode: 'free', freeStage: stage });
}

export function prepareLevelRound(diff, lv, seed) {
  const spec = specificationForLevel(diff, lv);
  return createRound(seed, spec, { mode: 'level' });
}

export function prepareChallengeSeed() {
  const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  const spec = specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
  return { seed, spec, diff: CHALLENGE_LEVEL.diff, lv: CHALLENGE_LEVEL.lv };
}

export function prepareChallengeRound(cSeed) {
  const spec = cSeed.spec ?? specificationForLevel(CHALLENGE_LEVEL.diff, CHALLENGE_LEVEL.lv);
  return createRound(
    cSeed.seed,
    { ...spec, timeSec: 90, targetWords: 999 },
    { mode: 'challenge' },
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
