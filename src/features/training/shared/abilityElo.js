/* =============================================================================
 * ABILITY — a Rasch-scaled Elo rating over the PLAYER only.
 *
 * ⚠ THIS FILE IS PURE MATHS AND MUST STAY THAT WAY. No localStorage, no React,
 * no imports that reach either. The gates run in plain Node and have to be able
 * to load it; persistence belongs to the caller. Any import it gains needs an
 * explicit `.js` extension for the same reason.
 *
 * ── Why Elo and not a staircase ──────────────────────────────────────────────
 * A transformed up-down staircase (Levitt 1971) is the obvious instrument and
 * it is the wrong one here, for three independent reasons:
 *   • It has NO MEMORY ACROSS SESSIONS. Every run restarts from the initial
 *     guess, so a player's tenth run is calibrated no better than their first.
 *   • It CANNOT RATE AN AUTHORED LEVEL. Levels mode would need a second,
 *     separate mechanism, and two difficulty systems in one game is how they
 *     end up disagreeing.
 *   • It needs 30-60 trials to converge, and a survival run is a fraction of
 *     that — so the reversal-averaged estimate would be dominated by the early
 *     reversals a staircase is supposed to discard.
 * Elo is the same feedback loop with a persistent scale. It is a staircase that
 * remembers.
 *
 * ── Elo IS Rasch ─────────────────────────────────────────────────────────────
 * Rasch 1PL:  P(correct) = 1 / (1 + exp(-(theta - b)))
 * Elo:        E = 1 / (1 + 10^((Ro - R)/400))
 * The second is the first re-based: 10^(x/400) = exp(x·ln10/400), so one logit
 * is 400/ln(10) = 173.72 Elo points. Elo is Rasch estimated by single-step
 * stochastic approximation instead of marginal maximum likelihood — which is
 * exactly what an online, on-device, no-backend rating needs.
 *
 * ⚠ THE PLAYER IS RATED; AUTHORED LEVELS ARE NOT. Klinkenberg's Math Garden
 * rates both sides because its items are interchangeable arithmetic problems
 * with no authored order. Ours are not: the 60 levels carry a product promise
 * (monotone difficulty, a nameable mechanic per band, audit:curves enforcing
 * that no band is inert). If play data re-rated a level, monotonicity would
 * stop being a guarantee and become a statistical outcome — level 37 could end
 * up rated easier than 36 because a cohort had a good week. Monotonicity is
 * content's job. See CANCELLATION-TASK-PLAN.md §2.5.
 *
 * ⚠ THETA ADVISES. IT NEVER GATES. A player who beat level 40 beat level 40.
 *
 * ⚠ ONLY THE OUTCOME FEEDS THETA. d-prime, ICV, Concentration Performance and
 * the search-organisation indices are the INSTRUMENT — the thing the game
 * exists to measure. The moment any of them drives the difficulty controller,
 * difficulty becomes a function of the measurement and the measurement becomes
 * a function of difficulty, and neither is interpretable afterwards. Same rule
 * practiceLog.js enforces in Wellbeing (gamify the skill, never the mood
 * score), and the same reason coach taps are kept out of trialLog.
 * ========================================================================== */

/** 400 / ln(10). One logit in Elo points — only needed if a rating is shown. */
export const LOGIT_PER_ELO = 400 / Math.LN10;

/**
 * The success rate difficulty aims at.
 *
 * 0.84 is defensible from two literatures at once, which is why it was chosen
 * over either one alone:
 *   • It is the Wilson, Shenhav, Straccia & Cohen (2019) optimum for the
 *     Gaussian case — the "85% rule" for maximising LEARNING RATE.
 *   • It is 0.5^(1/4), the convergence point of a 1-up/4-down transformed
 *     staircase, so it is also a defensible psychophysical target.
 *
 * ⚠ THE 85% RULE IS NOT A THEOREM ABOUT PEOPLE. It is derived for
 * gradient-descent-trained binary classifiers, and the paper is explicit that
 * the number is a property of the Gaussian noise assumption: Laplacian noise
 * gives 18.4% error, Cauchy 25%. Treat 0.84 as a well-motivated default.
 *
 * ⚠ It also sits below a realistic touchscreen LAPSE ceiling. A rule whose
 * target exceeds a player's asymptotic accuracy can never converge — it runs
 * away toward the easy end forever. Math Garden's live choice is 0.75; if
 * playtesting says 0.84 is punishing on one life, move to 0.75 (offset 1.099)
 * rather than inventing a number.
 */
export const TARGET_P = 0.84;

/** ln(p/(1-p)) — how far BELOW theta to place the next board. 1.658 logits. */
export const TARGET_OFFSET_LOGITS = Math.log(TARGET_P / (1 - TARGET_P));

/* K-factor: Pelanek's decaying form, K = a / (1 + b·n).
 *
 * ⚠ `a` AND `b` ARE OURS, NOT CITED. Every open source that reproduces this
 * function says the meta-parameters are "determined by grid search" and gives
 * no numbers. What IS published, from Math Garden's live implementation, is the
 * bracket: learner K between 0.2 and 1.0. Do not present these as literature.
 *
 * ⚠ THE FLOOR IS NOT DECORATION. The decay handles initial uncertainty; the
 * floor handles NON-STATIONARITY. A player genuinely improves over months, and
 * an un-floored K eventually refuses to notice — the rating freezes and starts
 * describing who they used to be. */
const K_A = 1.0;
const K_B = 0.05;
const K_FLOOR = 0.10;

/**
 * Trials before a theta-derived number may be SHOWN.
 *
 * Simulation with constant true ability converges at 35-45 trials, and the
 * earliest possible convergence is trial 21. Below this, theta still drives
 * board selection — silently, where being wrong costs a slightly-off board —
 * but nothing derived from it is displayed as if it were a measurement. Same
 * cold-start posture as features/personalization.
 */
export const DISPLAY_MIN_N = 20;

export function kFor(n) {
  return Math.max(K_FLOOR, K_A / (1 + K_B * Math.max(0, n || 0)));
}

/** Rasch 1PL: probability a player at `theta` clears a board at `b`. */
export function expectedClear(theta, b) {
  return 1 / (1 + Math.exp(-((theta || 0) - (b || 0))));
}

/** Board difficulty that a player at `theta` clears with probability `p`. */
export function difficultyForP(theta, p = TARGET_P) {
  const q = Math.min(0.999, Math.max(0.001, p));
  return (theta || 0) - Math.log(q / (1 - q));
}

/**
 * The outcome, as `S` in the Rasch update. Binary, on purpose.
 *
 * ⚠ TWO TIME-WEIGHTED VERSIONS WERE BUILT FIRST AND BOTH FAILED TO CONVERGE.
 * Recorded because the attraction of grading the outcome is real — it roughly
 * halves the boards needed — and the next person will want to try it again.
 *
 * ATTEMPT 1, Klinkenberg's High-Speed-High-Stakes rule, normalised:
 *      S = [ (2Y - 1)·(1 - T/d) + 1 ] / 2
 * maps a clear into [0.5, 1] and a failure into [0, 0.5]. Against this game's
 * target expectation of E = 0.84, a CLEAR using 40% of the clock scores 0.80 —
 * below E — so theta falls on a win. Simulated against five known abilities it
 * recovered none and drifted down in all five: true +2 estimated at -1.12.
 *
 * ATTEMPT 2, anchoring on the outcome and letting the clock nudge it:
 *      cleared: S = 1 - w·(T/d)      failed: S = w·(1 - T/d)      w = 0.25
 * tracks the right direction and is still biased, by a constant ~1.2 logits.
 * The algebra says exactly why, which is the useful part: at equilibrium
 * E[S] = E, and with a typical win scoring 0.90 the fixed point is 0.90·p =
 * 0.84, i.e. p = 0.933. The estimate settles where the player's TRUE clear rate
 * is 93%, not the 84% intended — a predicted bias of -0.98 logits against the
 * -1.06 to -1.54 observed.
 *
 * THE RULE IT VIOLATES, and it is general: `S` must be an unbiased estimator of
 * the quantity `E` predicts. `E` is P(clear). Any score that cannot reach 1 on
 * a win is estimating something else, and the shortfall becomes a permanent
 * offset in theta. Klinkenberg's rule works in Math Garden because it is paired
 * with a matching time-weighted E(S) from the Signed Residual Time model; bolted
 * onto a plain Rasch expectation it is simply a different estimator.
 *
 * ⚠ And it was never ours to use anyway. This file's own rule is that only the
 * OUTCOME feeds theta and that speed is INSTRUMENT — it is already measured, and
 * reported, as avgRt, Q-score and Concentration Performance. Feeding it into the
 * difficulty controller would make difficulty a function of the measurement.
 * The convergence failure and the design rule point the same way.
 *
 * If graded outcomes are ever wanted, the correct route is to derive the matching
 * E(S) — not to shrink S and hope.
 */
export function outcomeScore({ cleared }) {
  return cleared ? 1 : 0;
}

/** A fresh, unseeded ability record. */
export function freshAbility(theta = 0) {
  return { theta: +theta.toFixed(4), n: 0, seeded: false };
}

/**
 * One update. Returns a NEW record; never mutates.
 * `b` is the difficulty of the board just played, in logits.
 */
export function updateAbility(prev, { b, cleared, timeUsed, timeLimit }) {
  const cur = prev && Number.isFinite(prev.theta) ? prev : freshAbility();
  const S = outcomeScore({ cleared, timeUsed, timeLimit });
  const E = expectedClear(cur.theta, b);
  const K = kFor(cur.n);
  const theta = cur.theta + K * (S - E);
  return {
    ...cur,
    theta: +theta.toFixed(4),
    n: (cur.n || 0) + 1,
    last: { b: +Number(b).toFixed(3), S: +S.toFixed(3), E: +E.toFixed(3), K: +K.toFixed(3) },
  };
}

/** Has enough been banked for a theta-derived number to be shown? */
export function isSettled(ability) {
  return !!ability && (ability.n || 0) >= DISPLAY_MIN_N;
}

/** Elo-style integer, for display only. Never used in the maths. */
export function eloPoints(theta, base = 1200) {
  return Math.round(base + (theta || 0) * LOGIT_PER_ELO);
}

/**
 * Standard error of theta, in logits — the measurement error of the ability
 * estimate itself.
 *
 * Fisher information for the 1PL/Rasch model is I(theta) = P·(1 - P) per item,
 * and information adds across items, so over `n` boards
 *
 *      SE(theta) = 1 / sqrt( n · P·(1 - P) )
 *
 * This is the standard computerised-adaptive-testing result, and it is the
 * reason adaptive placement is worth doing at all: information is maximised at
 * P = 0.5 and falls away from it, so boards near a player's ability are worth
 * more per trial than boards they always clear or never do.
 *
 * ⚠ THIS GAME DELIBERATELY DOES NOT TEST AT MAXIMUM INFORMATION. It targets
 * P = 0.84, where P(1-P) = 0.134 rather than 0.25 — about 54% of the
 * information per board. That is a deliberate trade of measurement precision
 * for a success rate somebody will actually keep playing at, and the cost shows
 * up here as a wider error bar rather than being hidden:
 *
 *      n = 20 boards  ->  SE = 0.61 logits
 *      n = 50         ->  SE = 0.39
 *      n = 100        ->  SE = 0.27
 *
 * ⚠ It assumes every board was answered at roughly the target rate, which is
 * what the placement rule arranges but never exactly achieves. It is therefore
 * an optimistic floor on the true error — which is the safe direction for a
 * reliable-change test, since it makes the test HARDER to pass, not easier.
 */
export function abilityStandardError(n, p = TARGET_P) {
  const trials = Math.max(0, Math.round(n || 0));
  if (trials < 1) return null;
  const info = Math.max(1e-6, p * (1 - p));
  return 1 / Math.sqrt(trials * info);
}
