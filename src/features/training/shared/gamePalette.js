/*
 * GAME PALETTE — the one set of colours every training game plays in.
 *
 * Not to be confused with ./palette.js, which colours the training *chrome*
 * (hub, shrine, cards). This file is the PLAYFIELD: the pieces, tiles, dots and
 * cards inside a game, plus the sky they sit on.
 *
 * ── Where these values come from ──────────────────────────────────────────
 * Target Tracking is the reference: it was the game that read best, so it is
 * the game everything else matches. But its source constants are NOT what you
 * see on screen. Its dots are declared #4f9fe0 and render as #36688a, because
 * MeshStandardMaterial with `metalness: 0.35` and no environment map moves 35%
 * of the albedo into a specular lobe that has nothing to reflect. Measured
 * darkening was 0.684 / 0.654 / 0.616 per channel — the 0.65 that bug predicts.
 *
 * The values below are the RENDERED colours, not the declared ones, with
 * lightness tuned so each clears 3:1 against the whole sky gradient. That is
 * why they look darker here than the constants they replace: the darkening was
 * always there, it just used to happen by accident inside a shader.
 *
 * ⚠ If you set one of these on a Three.js material, either use `metalness: 0`
 * or the same 35% will come off again and the 3D game will not match the 2D
 * ones. See the 3D games (Spaceship, Story Time, Detective).
 *
 * ── The isoluminance rule ─────────────────────────────────────────────────
 * These six hues are near-ISOLUMINANT by design — they are told apart by hue,
 * not brightness. Worst pair is item vs bad at 1.01:1. That is fine for
 * decoration and NOT fine for state: a player with colour-vision deficiency
 * would see six identical greys.
 *
 * So: never encode state in `fill` alone. Every state change must ALSO move a
 * non-colour channel — a ring, a size step, an icon, a stroke weight. Target
 * Tracking already does this (cued dots get a ring AND scale 1.15×); the shared
 * board kit enforces it. This is a correctness rule, not a style preference.
 *
 * ── Contrast, measured ────────────────────────────────────────────────────
 * Dark tokens are measured against the sky's DARKEST stop, light tokens against
 * its brightest — each against the stop that is hardest for it.
 *
 *   fill        vs sky   vs ink    role
 *   item        3.32     2.49      the neutral piece — most things, most times
 *   ok          3.30     2.50      correct / success
 *   bad         3.29     2.51      wrong / error
 *   muted       3.32     2.49      dead, spent, out of play
 *   accent      1.26     6.55      the cued/hot piece — LIGHT token, see below
 *   selected    1.28    15.18      player's active pick — LIGHT token
 *
 * accent and selected are deliberately BRIGHTER than the sky rather than
 * darker: "hot" should glow, not recede. They therefore cannot earn 3:1 by
 * luminance, so each carries `stroke: GAME_INK` (8.05:1 on the sky at worst)
 * to delimit the shape. Dark tokens stroke with their own `edge` instead.
 */

/*
 * The play surface. Mirrors --play-surface in tokens.css — keep the two in step.
 *
 * ── One hue, not two (2026-08-01) ─────────────────────────────────────────
 * This ramp used to run cool blue at the zenith into warm taupe at the horizon
 * (#d2c5b5 → #c6b199), echoing Home's dusk. On Home that reads as a sunset,
 * because there is a horizon and a light source to justify it. On a playfield
 * there is neither — the board is face-on and lit from nowhere — so the taupe
 * had nothing to be, and read as dirt behind the pieces.
 *
 * It is now a single blue at ~207° hue throughout, going deeper toward the
 * bottom. The LUMINANCES are unchanged (0.686 / 0.570 / 0.464 vs the old
 * 0.686 / 0.576 / 0.461), which is the load-bearing part: every contrast figure
 * in the table below was measured against this ramp, and the pieces are tuned
 * to clear 3:1 against its darkest stop. Re-hue freely, but hold the
 * luminances or re-measure the whole table.
 */
export const GAME_SKY = {
  top: '#ccdae6',
  mid: '#b3cadd',
  low: '#9cb9d2',
  /** For a DOM background. */
  gradient: 'linear-gradient(180deg, #ccdae6 0%, #b3cadd 58%, #9cb9d2 100%)',
  /** Single-colour fallback (canvas clear, Three.js clear colour). */
  flat: '#b3cadd',
};

/** Body text and the outline for light pieces. 8.27:1 on the worst sky stop. */
export const GAME_INK = '#131e28';

/**
 * The six playfield roles.
 *   fill   — the shape's body
 *   edge   — its shaded side / lower edge; gives a flat shape form without faking 3D
 *   stroke — what to outline with so the silhouette reads against the sky
 */
export const GAME_COLORS = {
  /** Default piece. Anything not currently saying anything about itself. */
  item: { fill: '#2f5f86', edge: '#224460', stroke: '#224460' },
  /** Cued / target / "look at me". The hot state. */
  accent: { fill: '#d4952f', edge: '#996b22', stroke: GAME_INK },
  /** Correct, solved, earned. */
  ok: { fill: '#386544', edge: '#284931', stroke: '#284931' },
  /** Wrong, missed, lost. */
  bad: { fill: '#854c49', edge: '#603735', stroke: '#603735' },
  /** The player's current pick, mid-decision. */
  selected: { fill: '#eaf4ff', edge: '#a9b0b8', stroke: GAME_INK },
  /** Spent, disabled, out of play — present but not competing for attention. */
  muted: { fill: '#545c66', edge: '#3c4249', stroke: '#3c4249' },
};

/*
 * ── When colour is the TASK, not the decoration ───────────────────────────
 *
 * Four games score the player on colour itself: Cancellation (find the red
 * triangle), Wisconsin (sort by colour), Raven (colour is a matrix dimension),
 * Spatial Stroop. There, colour is a stimulus dimension the result depends on,
 * so it cannot come from the six semantic roles above — those are near-
 * isoluminant and already mean "correct", "wrong", "spent".
 *
 * Those games use this categorical set instead: Okabe-Ito, at FULL strength.
 *
 * It is deliberately NOT toned into the Tide key like everything else. Toning
 * was tried and measured: at x0.65 the four colours' mutual separation falls to
 * 1.10–1.90, and under simulated deuteranopia green and blue converge toward
 * #403955 / #2c276a while orange and pink converge toward #878a39 / #747865.
 * The whole reason this set exists is to stay discriminable without colour
 * vision, so darkening it defeats its purpose and would quietly corrupt the
 * scores of any colour-blind player.
 *
 * They still read as one family: three of these four hues are the same hues as
 * item / accent / ok above, just more saturated. A stimulus SHOULD be louder
 * than the furniture around it.
 */
export const GAME_STIMULUS = ['#0072B2', '#E69F00', '#009E73', '#CC79A7'];

/**
 * The same set extended to six, for the games that need more than four
 * categories at once (Spaceship matches ships to bays and can run six colours
 * on screen). The two extra hues are the remaining Okabe-Ito entries —
 * vermillion and sky blue — so the extended set is still CVD-safe as a whole.
 * Use GAME_STIMULUS when four is enough; more categories always means less
 * separation, so don't reach for this one by default.
 */
export const GAME_STIMULUS_6 = [
  '#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9',
];

/** '#2f5f86' → 0x2f5f86, for Three.js colour arguments. */
export const intOf = (hex) => parseInt(String(hex).replace('#', ''), 16);

/**
 * Darken a hex by a factor — how every `edge` above was derived (k = 0.72).
 * Use it for stimulus colours, which don't have a pre-computed edge because
 * they are chosen by the game at runtime.
 * @param {string} hex @param {number} k
 */
export function shadeOf(hex, k = 0.72) {
  const n = intOf(hex);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The same roles as Three.js ints, for the games that stay 3D.
 * @example new THREE.Color(GAME_INTS.item.fill)
 */
export const GAME_INTS = Object.fromEntries(
  Object.entries(GAME_COLORS).map(([role, c]) => [
    role,
    { fill: intOf(c.fill), edge: intOf(c.edge), stroke: intOf(c.stroke) },
  ]),
);

/** Role names, for iteration and prop validation. */
export const GAME_ROLES = Object.keys(GAME_COLORS);
