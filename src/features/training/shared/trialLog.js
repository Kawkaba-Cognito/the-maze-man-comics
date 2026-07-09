/*
 * TRIAL LOG — per-trial data capture for the training games.
 *
 * Professional cognitive instruments log every trial (stimulus, condition,
 * response, RT, timestamp), not just end-of-run aggregates. This module is
 * the one shared capture/persistence layer:
 *
 *   const log = createTrialLog({ game: 'speed-match', mode: 'free' });
 *   log.trial({ rt: 612, ok: true, sym: 3 });        // per response
 *   log.finish({ level: 7 });                         // banks the session
 *
 * Design constraints:
 *  - Pure JS, no React (ARCHITECTURE.md).
 *  - Trials buffer in memory; localStorage is written ONCE at finish() —
 *    never per trial (a reaction game would otherwise write 60×/min).
 *  - Storage is capped per game (sessions + bytes) so years of play can't
 *    blow the ~5 MB localStorage quota shared with the rest of the app.
 *  - Tutorial runs should NOT be logged (they're coached, not performance).
 *    Callers guard this; loadTrialSessions never returns mode 'tutorial'.
 */
import { summarize } from './metrics';
import { loadJson } from '../../../lib/storage';

const KEY_PREFIX = 'mm_trials_';
const KEY_VERSION = 'v1';

/** Hard caps — tuned so 6 games × full history stays well under ~1.5 MB. */
const MAX_TRIALS_PER_SESSION = 600;
const MAX_SESSIONS_PER_GAME = 20;
const MAX_BYTES_PER_GAME = 200 * 1024;

const storageKey = (game) => `${KEY_PREFIX}${game}_${KEY_VERSION}`;

function loadStore(game) {
  const st = loadJson(storageKey(game));
  return Array.isArray(st?.sessions) ? st : { sessions: [] };
}

function saveStore(game, st) {
  // Oldest sessions are evicted first — recent data is what reports need.
  while (st.sessions.length > MAX_SESSIONS_PER_GAME) st.sessions.shift();
  try {
    let raw = JSON.stringify(st);
    while (raw.length > MAX_BYTES_PER_GAME && st.sessions.length > 1) {
      st.sessions.shift();
      raw = JSON.stringify(st);
    }
    localStorage.setItem(storageKey(game), raw);
  } catch {
    // Quota or privacy mode — losing history must never break gameplay.
  }
}

/**
 * Start a logging session for one run (a free run, a level attempt, an
 * assessment block). Returns a logger; call finish() exactly once at the end.
 *
 * Trial fields are game-specific, but two names are contractual so shared
 * metrics work everywhere:
 *   rt — response time in ms (omit for untimed trials)
 *   ok — boolean correct/incorrect (omit for unscored events)
 */
export function createTrialLog({ game, mode, meta }) {
  const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const trials = [];
  let truncated = 0;
  let finished = false;

  return {
    game,
    mode,

    trial(fields) {
      if (finished) return;
      if (trials.length >= MAX_TRIALS_PER_SESSION) {
        truncated += 1;
        return;
      }
      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      trials.push({ t: Math.round(now - t0), ...fields });
    },

    get count() {
      return trials.length + truncated;
    },

    /** Bank the session. `extra` carries run-level results (level reached, score…). */
    finish(extra) {
      if (finished) return null;
      finished = true;
      if (!trials.length) return null;
      const session = {
        when: new Date().toISOString(),
        game,
        mode,
        ...(meta ? { meta } : {}),
        ...(extra ? { result: extra } : {}),
        ...(truncated ? { truncated } : {}),
        summary: summarize(trials),
        trials,
      };
      const st = loadStore(game);
      st.sessions.push(session);
      saveStore(game, st);
      return session;
    },

    /** Abandon without persisting (quit mid-run, coach replays, etc.). */
    discard() {
      finished = true;
    },
  };
}

/** All banked sessions for a game, oldest → newest. Optional mode filter. */
export function loadTrialSessions(game, { mode } = {}) {
  const sessions = loadStore(game).sessions.filter((s) => s.mode !== 'tutorial');
  return mode ? sessions.filter((s) => s.mode === mode) : sessions;
}

export function latestTrialSession(game, mode) {
  const ss = loadTrialSessions(game, { mode });
  return ss.length ? ss[ss.length - 1] : null;
}
