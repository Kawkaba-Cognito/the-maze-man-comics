/*
 * ARMY STATE — the recruitment campaign's persistence (localStorage).
 *
 * You recruit soldiers by beating their timed challenge. Each soldier has a
 * `power` (harder challenge = stronger soldier). You get MAX_ATTEMPTS tries per
 * soldier; fail them all and the soldier leaves for good. Gather enough total
 * power to take on the boss.
 */
const KEY = 'mm_army_v2'; // bumped: recruitment now uses real puzzles (old saves ignored)
export const MAX_ATTEMPTS = 5;
export const BOSS_POWER = 28;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
}
function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
}

export function getArmy() { return load().soldiers || []; }
export function totalPower() { return getArmy().reduce((a, x) => a + (x.power || 0), 0); }

/** 'recruited' | 'gone' | 'open' */
export function status(id) {
  const s = load();
  if ((s.soldiers || []).some((x) => x.id === id)) return 'recruited';
  if ((s.gone || []).includes(id)) return 'gone';
  return 'open';
}

export function attemptsUsed(id) { return (load().attempts || {})[id] || 0; }

export function recordAttempt(id) {
  const s = load();
  s.attempts = s.attempts || {};
  s.attempts[id] = (s.attempts[id] || 0) + 1;
  save(s);
  return s.attempts[id];
}

export function recruit(soldier) {
  const s = load();
  s.soldiers = s.soldiers || [];
  if (!s.soldiers.some((x) => x.id === soldier.id)) s.soldiers.push(soldier);
  save(s);
}

export function markGone(id) {
  const s = load();
  s.gone = s.gone || [];
  if (!s.gone.includes(id)) s.gone.push(id);
  save(s);
}
