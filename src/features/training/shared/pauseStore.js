import { useSyncExternalStore } from 'react';

/*
 * Is a training game currently paused?
 *
 * ── Why a module-level store and not React state ──────────────────────────
 * The pause BUTTON lives in the chrome (C3dProtoChrome), but the things that
 * must actually stop live elsewhere and above it: the survival countdown is a
 * hook inside the game, which renders the chrome as a child. State cannot flow
 * from a child back up to its parent's hooks, so the alternative was lifting
 * pause into all seven games by hand — exactly the per-game work this whole
 * effort exists to remove.
 *
 * Exactly one training game is on screen at a time, but MORE THAN ONE component
 * can hold the pause at once (a game plus its chrome), so the store tracks
 * OWNERS rather than a single boolean — see the holders note below. If two
 * games ever run side by side, this needs a key per game as well.
 *
 * The scene clock in c3dBoot is keyed per-element and stays that way — it is
 * about a specific renderer. This is about the SESSION.
 */

let paused = false;
let pausedAt = 0;
let pausedTotal = 0;
const subscribers = new Set();

/*
 * WHO is holding the pause, not merely whether someone is.
 *
 * A plain boolean broke as soon as two components could pause: Matrix IQ has
 * its own useGamePause AND renders C3dProtoChrome, which has another. With a
 * boolean, whichever unmounted first cleared the flag for BOTH — so the game
 * could resume while its pause menu was still on screen.
 *
 * Paused is now "at least one owner is holding it". Each useGamePause holds a
 * unique token and releases only its own, so owners cannot clobber each other
 * and the clock resumes exactly when the last one lets go.
 */
const holders = new Set();
const GLOBAL_TOKEN = { global: true };

function recompute() {
  const next = holders.size > 0;
  if (next === paused) return;
  paused = next;
  if (paused) pausedAt = performance.now();
  else pausedTotal += performance.now() - pausedAt;
  subscribers.forEach((fn) => fn());
}

/**
 * @param {boolean} value
 * @param {object} [token] the owner. Omit only from non-component callers —
 *   a shared token then behaves like the old boolean.
 */
export function setTrainingPaused(value, token = GLOBAL_TOKEN) {
  if (value) holders.add(token);
  else holders.delete(token);
  recompute();
}


/** Release everything. For a hard reset (leaving Training entirely). */
export function clearTrainingPause() {
  holders.clear();
  recompute();
}

/**
 * performance.now() minus every millisecond spent paused.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 * Timers in this codebase are written three different ways: the c3d render
 * tick, the shared useSurvivalCountdown hook, and per-game setInterval loops
 * reading performance.now() directly (Wisconsin3DProto, and it is not alone).
 * Pausing the first two centrally still left the third draining behind the
 * menu — measured: 41s → 37s across four paused seconds.
 *
 * There is no way to fix that category from the outside, because the game owns
 * the clock. What there IS is a drop-in replacement: swap `performance.now()`
 * for `nowMs()` and the timer becomes pause-correct with no other change. Two
 * lines per game, and the arithmetic is not re-derived (or got wrong) each time.
 *
 * Monotonic and never runs backwards, so a duration computed across a pause is
 * simply shorter by the paused time — which is exactly what a player expects.
 */
export function nowMs() {
  return (paused ? pausedAt : performance.now()) - pausedTotal;
}

export function getTrainingPaused() {
  return paused;
}

export function subscribeTrainingPaused(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

/**
 * Read the flag reactively.
 *
 * useSyncExternalStore rather than useState + an effect, so a component that
 * mounts while already paused sees `true` on its first render instead of
 * flashing a running frame first.
 */
export function useTrainingPaused() {
  return useSyncExternalStore(subscribeTrainingPaused, getTrainingPaused, getTrainingPaused);
}
