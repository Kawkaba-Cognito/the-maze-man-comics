import React, { useId } from 'react';
import { folkOf } from './data.js';

/*
 * THE TRAVELLERS — six little planet folk who come to the gate.
 *
 * Drawn as inline SVG rather than shipped as art, on purpose. `public/` is
 * served straight from the repo and dev reads the working tree, so art that is
 * referenced from src but never `git add`ed builds green locally and 404s in
 * production with nothing in build, lint or CI to catch it. This repo has
 * shipped that exact failure (Detective and Story Time nearly went out with
 * broken casts). A component cannot be forgotten by git.
 *
 * ── EVERY ATTRIBUTE IS DRAWN TWICE ──────────────────────────────────────
 * The laws in this game can be about any of four attributes, so a player must
 * be able to read all four off a card reliably. Consistency rule 9.6 forbids
 * carrying task information by colour alone, and "only the rust ones may pass"
 * would be exactly that. So each attribute has a redundant channel:
 *
 *   folk    hue + a distinct FACE + a forehead CREST + the name on the card
 *   shape   the silhouette (round / boxy / pointy) — already non-colour
 *   moons   counted objects — already non-colour
 *   fill    diagonal stripes — a texture, not a tint
 *
 * A player with no colour vision can still solve every law in the game.
 *
 * Hues are CSS custom properties defined in gatekeeper.css, never literals, so
 * they follow the theme and stay out of the audit:design ratchet. They are
 * deliberately NOT the six --game-* role tokens: --game-ok and --game-bad mean
 * "correct" and "wrong" here, and CLAUDE.md records what happened in Intercept
 * when a piece's identity colour collided with a feedback colour — the thing to
 * tap and the thing not to tap rendered identically.
 */

/*
 * ── THE CREST ────────────────────────────────────────────────────────────
 * A small mark on the forehead, one per folk. It exists because the six folk
 * had to become tellable apart WITHOUT binding appearance to `shape` — shape is
 * its own puzzle attribute, so a folk that was always boxy would make every law
 * about shape secretly a law about folk, and the two attributes would stop
 * being orthogonal. `validate:gatekeeper` would still pass, because each gate
 * would remain decidable; the game would just be quietly measuring less.
 *
 * So identity is carried by face + crest, both of which are pure decoration
 * that no law can ever be about.
 *
 * ⚠ GEOMETRY: the crest must fit inside ALL THREE bodies, and `pointy` is the
 * tight one — it is a triangle from (32, 20.5) widening to y=48, so at y=30 it
 * is only about 12 units across. Anything wider than ~8 units centred on x=32
 * pokes out of the silhouette on pointy cards only, which is the kind of bug
 * that shows up on one card in nine. Keep crests within x 28–36 at y≈30.
 * It also has to stay BELOW the moons (y 10–17, outside the body) so the two
 * never read as one group — the moon count is a real attribute a law can use.
 */
const CREST = {
  toti: <circle cx="32" cy="30" r="1.9" fill="var(--gk-ink)" />,
  zuzu: <path d="M28.5 30h7" stroke="var(--gk-ink)" strokeWidth="2.2" strokeLinecap="round" />,
  lulu: (
    <>
      <circle cx="29.2" cy="30" r="1.7" fill="var(--gk-ink)" />
      <circle cx="34.8" cy="30" r="1.7" fill="var(--gk-ink)" />
    </>
  ),
  nunu: <path d="M28.6 28.9 32 31.6l3.4-2.7" stroke="var(--gk-ink)" strokeWidth="2.1" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  momo: <path d="M32 27.9 35.4 31.4h-6.8Z" fill="var(--gk-ink)" />,
  kiki: <path d="M32 27.8 34.9 30.2 32 32.6 29.1 30.2Z" fill="var(--gk-ink)" />,
};

const FACE = {
  // Toti — wide awake and a little anxious.
  toti: (
    <>
      <circle cx="26" cy="36" r="2.6" fill="var(--gk-ink)" />
      <circle cx="38" cy="36" r="2.6" fill="var(--gk-ink)" />
      <path d="M27 44q5 4 10 0" stroke="var(--gk-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  // Zuzu — beaming. Arched eyes, the classic "happy" curve.
  zuzu: (
    <>
      <path d="M23 37q3-4 6 0M35 37q3-4 6 0" stroke="var(--gk-ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M26 43q6 6 12 0" stroke="var(--gk-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  // Lulu — mid-wink, so the two eyes differ in shape as well as the face doing.
  lulu: (
    <>
      <circle cx="26" cy="36" r="3.4" fill="var(--gk-ink)" />
      <path d="M35 36h6" stroke="var(--gk-ink)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M27 44q5 3 10 0" stroke="var(--gk-ink)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  // Nunu — half-lidded and unimpressed.
  nunu: (
    <>
      <path d="M22.5 35h6.5M35 35h6.5" stroke="var(--gk-ink)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="26" cy="38" r="1.8" fill="var(--gk-ink)" />
      <circle cx="38" cy="38" r="1.8" fill="var(--gk-ink)" />
      <path d="M28 45h8" stroke="var(--gk-ink)" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  // Momo — square eyes and a small round mouth: startled, and unmistakably
  // not a curve, which is what separates it from Toti at 40px.
  momo: (
    <>
      <rect x="23.6" y="33.6" width="5" height="5" rx="1" fill="var(--gk-ink)" />
      <rect x="35.4" y="33.6" width="5" height="5" rx="1" fill="var(--gk-ink)" />
      <circle cx="32" cy="45" r="2.4" stroke="var(--gk-ink)" strokeWidth="2" fill="none" />
    </>
  ),
  // Kiki — angled brows over small eyes, and a bold flat mouth. The brows are
  // the read at small size; the eyes alone would look like Nunu's.
  kiki: (
    <>
      <path d="M22.8 32.6 29 35M41.2 32.6 35 35" stroke="var(--gk-ink)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="26" cy="38.4" r="2.3" fill="var(--gk-ink)" />
      <circle cx="38" cy="38.4" r="2.3" fill="var(--gk-ink)" />
      <path d="M27.5 45.4h9" stroke="var(--gk-ink)" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
};

/** Where the moons sit — an arc over the head, so three never crowd. */
const MOON_POS = {
  1: [[32, 12]],
  2: [[22, 14], [42, 14]],
  3: [[19, 17], [32, 10], [45, 17]],
};

function bodyPath(shape) {
  if (shape === 'round') return <circle cx="32" cy="38" r="16.5" />;
  if (shape === 'boxy') return <rect x="15.5" y="21.5" width="33" height="33" rx="9" />;
  // pointy — a rounded triangle, so the silhouette reads at 40px
  return <path d="M32 20.5 L48.5 48 Q49 54 42 54 L22 54 Q15 54 15.5 48 Z" />;
}

/**
 * @param card  { folk, shape, moons, fill }
 * @param size  rendered px (the SVG is a 64-unit square)
 * @param name  show the character's name beneath — the redundant channel for
 *              the `folk` attribute, and the reason a colour-blind player can
 *              still answer a law about who someone is
 */
export default function PlanetFolk({ card, size = 56, name = false, dim = false, isAr = false }) {
  const uid = useId().replace(/:/g, '');
  const f = folkOf(card.folk);
  const hue = `var(--gk-${f.hue})`;
  const striped = card.fill === 'striped';
  const patternId = `gkstripe-${uid}`;

  return (
    <span className="gk-folk" style={{ opacity: dim ? 0.45 : 1 }}>
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        role="img"
        aria-label={isAr ? f.ar : f.en}
        className="gk-folk-svg"
      >
        {striped && (
          <defs>
            <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill={hue} />
              <rect width="2.6" height="6" fill="var(--gk-stripe)" />
            </pattern>
          </defs>
        )}

        {/* moons first, so the body overlaps them and they read as behind */}
        {(MOON_POS[card.moons] || MOON_POS[1]).map(([mx, my], i) => (
          <circle
            key={i}
            cx={mx}
            cy={my}
            r="4.2"
            fill="var(--gk-moon)"
            stroke="var(--gk-ink)"
            strokeWidth="1.8"
          />
        ))}

        <g fill={striped ? `url(#${patternId})` : hue} stroke="var(--gk-ink)" strokeWidth="2.4">
          {bodyPath(card.shape)}
        </g>

        {CREST[card.folk] || CREST.toti}
        {FACE[card.folk] || FACE.toti}
      </svg>
      {name && <span className="gk-folk-name">{isAr ? f.ar : f.en}</span>}
    </span>
  );
}

/** The name in the player's language — used for labels outside the SVG. */
export const folkName = (id, isAr) => (isAr ? folkOf(id).ar : folkOf(id).en);
