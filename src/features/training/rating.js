/*
 * TRAINING RATING — a clinical-style skill rating (0–1000) per training game.
 *
 * Measurement model:
 *  - Every completed FREE-MODE run reports its "level reached" (the same
 *    scalar the points economy uses). The rating is an exponentially-weighted
 *    moving average of that level, mapped onto 0–1000 through a per-game
 *    saturating calibration curve  R = 1000 · L / (L + L_half)  — so each
 *    game's own scale (span, rounds, words…) lands on one comparable axis.
 *  - The first 3 runs adapt fast (K=0.5, status "calibrating"), then the
 *    estimate stabilises (K=0.25) — standard EWMA practice for noisy
 *    behavioural series.
 *  - Before any run is banked, the latest ASSESSMENT seeds a provisional
 *    rating for the game's domain (score 0–100 → rating ×8), so a fresh user
 *    still gets a suitable starting difficulty ("the assessment decides the
 *    initial rating").
 *  - The Daily Workout reads the DOMAIN rating to pick block difficulty, so
 *    as ratings climb, tomorrow's workout climbs with them.
 */
import { loadAssessSessions } from './assessment/assessmentProfile';

const KEY = 'mm_rating_v1';

/** free-run reporter key → game identity + calibration (level where R=500). */
export const RATED_GAMES = {
  cancel: { gameKey: 'cancel-task', domainId: 'attention', lHalf: 8, en: 'Cancellation', ar: 'الشطب' },
  stroop: { gameKey: 'spatial-stroop', domainId: 'flexibility', lHalf: 7, en: 'Spatial Stroop', ar: 'ستروب المكاني' },
  wordle: { gameKey: 'wordle', domainId: 'language', lHalf: 5, en: 'Word Builder', ar: 'باني الكلمات' },
  memo: { gameKey: 'memo-span', domainId: 'memory', lHalf: 5, en: 'Memo Span', ar: 'مدى الذاكرة' },
  rush: { gameKey: 'rush-hour', domainId: 'reasoning', lHalf: 7, en: 'Rush Hour', ar: 'ساعة الذروة' },
  speed: { gameKey: 'speed-match', domainId: 'speed', lHalf: 9, en: 'Speed Match', ar: 'مطابقة سريعة' },
};
const BY_GAMEKEY = Object.fromEntries(Object.entries(RATED_GAMES).map(([k, v]) => [v.gameKey, k]));

/** Rating bands — labels for users, thresholds for difficulty mapping. */
export const RATING_BANDS = [
  { id: 'developing', max: 300, en: 'Developing', ar: 'في التطوّر', color: '#c0563f' },
  { id: 'emerging', max: 480, en: 'Emerging', ar: 'صاعد', color: '#d08a3a' },
  { id: 'proficient', max: 640, en: 'Proficient', ar: 'متمكّن', color: '#5fa9d8' },
  { id: 'advanced', max: 800, en: 'Advanced', ar: 'متقدّم', color: '#5ec07a' },
  { id: 'elite', max: 1001, en: 'Elite', ar: 'نخبة', color: '#9be85a' },
];
export function ratingBand(r) {
  return RATING_BANDS.find((b) => r < b.max) || RATING_BANDS[RATING_BANDS.length - 1];
}

/** Rating → workout difficulty level 1..5. */
export function ratingToLevel(r) {
  if (r < 300) return 1;
  if (r < 480) return 2;
  if (r < 640) return 3;
  if (r < 800) return 4;
  return 5;
}

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { games: {} }; } catch { return { games: {} }; }
}
function save(st) {
  try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ }
  return st;
}

const toRating = (l, lHalf) => Math.round(1000 * (l / (l + lHalf)));

/** Latest assessment per-domain scores (0–100), or {}. */
function latestAssessScores() {
  try {
    const ss = loadAssessSessions();
    for (let i = ss.length - 1; i >= 0; i--) if (ss[i]?.scores) return ss[i].scores;
  } catch { /* ignore */ }
  return {};
}

/**
 * Bank a completed free run (level reached) into the game's rating.
 * Returns { rating, delta, status } or null for unrated keys / empty runs.
 */
export function updateRating(freeKey, level) {
  const def = RATED_GAMES[freeKey];
  const L = Math.max(0, Number(level) || 0);
  if (!def || L <= 0) return null;
  const st = load();
  const g = st.games[freeKey] || { n: 0, ewma: 0, hist: [] };
  const before = g.n > 0 ? toRating(g.ewma, def.lHalf) : null;
  const K = g.n < 3 ? 0.5 : 0.25;
  g.ewma = g.n === 0 ? L : g.ewma + K * (L - g.ewma);
  g.n += 1;
  const rating = toRating(g.ewma, def.lHalf);
  g.hist = [...(g.hist || []), { d: new Date().toISOString().slice(0, 10), r: rating }].slice(-60);
  st.games[freeKey] = g;
  save(st);
  return { rating, delta: before == null ? null : rating - before, status: g.n < 3 ? 'calibrating' : 'stable' };
}

/**
 * A game's current rating. Falls back to a provisional rating derived from
 * the latest assessment's domain score when no runs are banked yet.
 */
export function gameRating(freeKey) {
  const def = RATED_GAMES[freeKey];
  if (!def) return null;
  const g = load().games[freeKey];
  if (g && g.n > 0) {
    return { rating: toRating(g.ewma, def.lHalf), n: g.n, status: g.n < 3 ? 'calibrating' : 'stable', hist: g.hist || [] };
  }
  const s = latestAssessScores()[def.domainId];
  if (typeof s === 'number') return { rating: Math.round(s * 8), n: 0, status: 'provisional', hist: [] };
  return null;
}

export function gameRatingByGameKey(gameKey) {
  const freeKey = BY_GAMEKEY[gameKey];
  return freeKey ? gameRating(freeKey) : null;
}

/** Domain rating = mean of its games' ratings (measured beats provisional). */
export function domainRating(domainId) {
  const keys = Object.keys(RATED_GAMES).filter((k) => RATED_GAMES[k].domainId === domainId);
  const rs = keys.map((k) => gameRating(k)).filter(Boolean);
  if (!rs.length) return null;
  const measured = rs.filter((r) => r.status !== 'provisional');
  const use = measured.length ? measured : rs;
  return Math.round(use.reduce((a, r) => a + r.rating, 0) / use.length);
}
