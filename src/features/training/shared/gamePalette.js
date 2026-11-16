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
/*
 * ── Re-hued to Beige, 2026-08-07 ──
 * Was one blue at ~207°. The app's chrome is now warm beige, and a cool blue
 * board beside it read as a second, arguing system — it is also what the user
 * kept describing as "the light blue in the activities".
 *
 * Re-hued to ~42°, luminances HELD as the note above requires:
 *   top 0.686 → 0.682 · mid 0.570 → 0.572 · low 0.464 → 0.467
 * Within 0.005 at every stop, so the contrast table below is still valid and
 * the pieces still clear 3:1 against the darkest stop. Nothing was re-measured
 * because nothing needed to be.
 *
 * ⚠️ Mirrors --play-surface in tokens.css. Canvas and Three.js games cannot
 * read CSS custom properties, so these two MUST move together — if they drift,
 * DOM games and canvas games render different boards.
 */
export const GAME_SKY = Object.freeze({
  top: '#faf7f2',
  mid: '#f5f0e6',
  low: '#efe9dc',
  bot: '#efe9dc',
  /** For a DOM background. */
  gradient: 'linear-gradient(180deg, #faf7f2 0%, #f5f0e6 55%, #efe9dc 100%)',
  /** Single-colour fallback (canvas clear, Three.js clear colour). */
  flat: '#faf7f2',
});

/** Body text and the outline for light pieces. */
export const GAME_INK = '#1e293b';

/**
 * The six playfield roles (Duolingo high-contrast palette).
 *   fill   — the shape's body
 *   edge   — its shaded side / lower edge; gives a flat shape form without faking 3D
 *   stroke — what to outline with so the silhouette reads against the sky
 */
export const GAME_COLORS = Object.freeze({
  /** Default piece. Anything not currently saying anything about itself. */
  item: Object.freeze({ fill: '#2586f7', edge: '#106ad6', stroke: '#106ad6' }),
  /** Cued / target / "look at me". The hot state. */
  accent: Object.freeze({ fill: '#ff7800', edge: '#cc5a00', stroke: GAME_INK }),
  /** Correct, solved, earned. */
  ok: Object.freeze({ fill: '#58cc02', edge: '#46a302', stroke: '#46a302' }),
  /** Wrong, missed, lost. */
  bad: Object.freeze({ fill: '#ff4b4b', edge: '#ea2b2b', stroke: '#ea2b2b' }),
  /** The player's current pick, mid-decision. */
  selected: Object.freeze({ fill: '#ddf4ff', edge: '#2586f7', stroke: GAME_INK }),
  /** Spent, disabled, out of play — present but not competing for attention. */
  muted: Object.freeze({ fill: '#94a3b8', edge: '#64748b', stroke: '#64748b' }),
});

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
export const GAME_STIMULUS = Object.freeze([
  '#1cb0f6', // Duolingo Sky Blue
  '#ff9600', // Duolingo Orange
  '#58cc02', // Duolingo Feather Green
  '#ce82ff', // Duolingo Berry Purple
]);

/**
 * The same set extended to six, for the games that need more than four
 * categories at once (Spaceship matches ships to bays and can run six colours
 * on screen).
 */
export const GAME_STIMULUS_6 = Object.freeze([
  ...GAME_STIMULUS,
  '#2586f7', // Duolingo Royal Blue
  '#ff4b4b', // Duolingo Cardinal Red
]);

/*
 * ── The effects nobody had a token for ────────────────────────────────────
 *
 * A survey of the games found ~60 hand-written `rgba(0,0,0,0.35)` /
 * `rgba(255,255,255,0.1)` values doing the same five jobs. They were reinvented
 * per game for one reason: there was no shared name for them, so every author
 * picked their own alpha. That is how a "shadow" ends up at 0.28 in one game
 * and 0.45 in the next.
 *
 * These are deliberately NEUTRAL-COOL rather than pure black: on the Tide blue
 * surface a pure-black shadow reads as a grey smudge, because it desaturates
 * everything under it. #131e28 at low alpha keeps the hue.
 *
 * ⚠ JS constants as well as CSS variables (--fx-* in tokens.css), because a
 * canvas game sets `ctx.fillStyle` and CANNOT read a CSS custom property. That
 * asymmetry is exactly why the canvas games drifted furthest.
 */
export const GAME_FX = {
  /** Behind a modal / pause overlay. */
  scrim: 'rgba(19, 30, 40, 0.46)',
  /** Contact shadow under a raised piece or card. */
  shadowSoft: 'rgba(19, 30, 40, 0.14)',
  /** A card lifted off the surface. */
  shadowDrop: 'rgba(19, 30, 40, 0.28)',
  /** A 1px separating line that must not read as a border. */
  hairline: 'rgba(19, 30, 40, 0.12)',
  /** The lit top edge of a raised surface. */
  glint: 'rgba(255, 255, 255, 0.55)',
};

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
