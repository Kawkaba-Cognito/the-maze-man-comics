import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Shared cosmos stage for tab landings — CSS-only night/dawn sky
 * (nebula wash, stars, mist, optional shooting star). Matches Home's
 * universe palette without mounting Three.js.
 *
 * `accent`: subtle per-tab wash — training | learn | wellbeing | other | default
 * Layout/chrome of the host screen is unchanged; this is environment only.
 */
const STAR_COUNT = 48;

function seed(i, n) {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/* Soft nebula only — keep the void black like Home; accents stay whisper-quiet */
const BLOBS_DARK = {
  default: [
    { x: '8%', y: '12%', w: 320, h: 220, c: 'rgba(120,180,255,0.05)', dur: 28 },
    { x: '60%', y: '4%', w: 360, h: 240, c: 'rgba(232,172,78,0.04)', dur: 36 },
    { x: '40%', y: '58%', w: 400, h: 280, c: 'rgba(120,180,255,0.035)', dur: 42 },
  ],
  training: [
    { x: '10%', y: '10%', w: 340, h: 240, c: 'rgba(232,172,78,0.055)', dur: 30 },
    { x: '55%', y: '6%', w: 360, h: 250, c: 'rgba(120,180,255,0.04)', dur: 36 },
    { x: '38%', y: '56%', w: 420, h: 300, c: 'rgba(232,172,78,0.045)', dur: 44 },
  ],
  learn: [
    { x: '12%', y: '8%', w: 340, h: 230, c: 'rgba(140,180,255,0.055)', dur: 30 },
    { x: '58%', y: '12%', w: 360, h: 250, c: 'rgba(120,160,220,0.04)', dur: 38 },
    { x: '36%', y: '58%', w: 400, h: 280, c: 'rgba(232,172,78,0.03)', dur: 42 },
  ],
  wellbeing: [
    { x: '8%', y: '12%', w: 320, h: 220, c: 'rgba(120,180,255,0.05)', dur: 28 },
    { x: '58%', y: '4%', w: 360, h: 240, c: 'rgba(90,160,122,0.045)', dur: 36 },
    { x: '42%', y: '56%', w: 400, h: 280, c: 'rgba(232,172,78,0.035)', dur: 42 },
  ],
  other: [
    { x: '14%', y: '14%', w: 300, h: 210, c: 'rgba(150,130,200,0.04)', dur: 30 },
    { x: '54%', y: '2%', w: 340, h: 230, c: 'rgba(120,180,255,0.04)', dur: 38 },
    { x: '40%', y: '54%', w: 400, h: 280, c: 'rgba(232,172,78,0.03)', dur: 42 },
  ],
};

/* Parchment, per Kawnera's .mode-paper. The middle blob used to be
   rgba(196,208,236) — a cool blue, the one hue that cannot appear on paper and
   the thing that made this screen read as a different app from the library. */
const BLOBS_LIGHT = [
  { x: '4%', y: '8%', w: 380, h: 250, c: 'rgba(255,253,246,0.62)', dur: 30 },
  { x: '56%', y: '0%', w: 430, h: 280, c: 'rgba(238,231,213,0.5)', dur: 36 },
  { x: '42%', y: '52%', w: 480, h: 320, c: 'rgba(226,214,186,0.42)', dur: 42 },
];

/* The seven-stop Home dusk already carries the broad colour movement, so its
   extra nebulae stay restrained and atmospheric. */
const BLOBS_DUSK = [
  { x: '4%', y: '8%', w: 380, h: 250, c: 'rgba(132,148,194,0.16)', dur: 30 },
  { x: '56%', y: '18%', w: 430, h: 280, c: 'rgba(184,118,103,0.18)', dur: 36 },
  { x: '36%', y: '60%', w: 480, h: 320, c: 'rgba(244,169,101,0.14)', dur: 42 },
];

/*
 * Kawnera's --accent (#a8792b), used for the few loose flecks light mode keeps.
 *
 * There were drawn constellations here — three asterisms joined by gold
 * linework. The idea was that on parchment they would read as an antique star
 * chart; in practice they read as lines with dots on them, and they were
 * removed. Nothing on this ground should ask to be looked at: it sits behind
 * planets, cards and text, and the moment it has a figure of its own it becomes
 * one more thing competing with the content.
 */
const GOLD_STAR = 'rgba(168, 121, 43, 0.5)';
const DUSK_STAR = 'rgba(255, 239, 211, 0.78)';

export default function UniverseStage({
  accent = 'default',
  shootingStar,
  dark: darkProp,
  homeDusk = false,
}) {
  const { appTheme } = useApp();
  const dark = darkProp ?? appTheme !== 'light';
  const key = BLOBS_DARK[accent] ? accent : 'default';
  const blobs = dark ? BLOBS_DARK[key] : (homeDusk ? BLOBS_DUSK : BLOBS_LIGHT);
  const showShoot = shootingStar ?? dark;

  const stars = useMemo(
    () => Array.from({ length: dark ? STAR_COUNT : Math.round(STAR_COUNT * 0.5) }, (_, i) => {
      const sz = 1.2 + seed(i, 3) * 2.6;
      return {
        left: `${seed(i, 1) * 100}%`,
        // Light: keep the scatter in the upper band, where the sky is still blue
        // enough to hold a point. Lower down it is warm cream and a star there is
        // just a mark on paper.
        top: dark
          ? `${seed(i, 2) * 100}%`
          : `${8 + seed(i, 2) * (homeDusk ? 64 : 30)}%`,
        width: sz,
        height: sz,
        opacity: dark ? 0.25 + seed(i, 4) * 0.5 : 0.28 + seed(i, 4) * 0.34,
        background: dark ? undefined : (homeDusk ? DUSK_STAR : GOLD_STAR),
        boxShadow: sz > 2.7
          ? (dark
            ? '0 0 6px 1px rgba(255,255,255,0.55)'
            : (homeDusk
              ? '0 0 6px 1px rgba(255,224,184,0.36)'
              : '0 0 5px 1px rgba(214,168,74,0.35)'))
          : 'none',
        animationDuration: `${2.6 + seed(i, 5) * 4}s`,
        animationDelay: `-${seed(i, 6) * 5}s`,
      };
    }),
    [dark, homeDusk],
  );

  return (
    <div
      aria-hidden="true"
      className={`uv-stage uv-stage--${dark ? 'dark' : 'light'} uv-stage--${key}${homeDusk ? ' uv-stage--home' : ''}`}
    >
      {blobs.map((b, i) => (
        <span
          key={`b${i}`}
          className="uv-blob"
          style={{
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            background: `radial-gradient(circle, ${b.c} 0%, transparent 68%)`,
            animationDuration: `${b.dur}s`,
            animationDelay: `-${i * 9}s`,
          }}
        />
      ))}

      {dark ? (
        /* Soft distant moon — dim like Home's black space, not a bright lamp */
        <span
          className="uv-celestial"
          style={{
            right: '10%',
            top: '10%',
            width: 28,
            height: 28,
            background: 'radial-gradient(circle at 38% 34%, rgba(248,242,223,0.85) 0%, rgba(200,190,160,0.35) 55%, transparent 72%)',
            boxShadow: '0 0 28px 8px rgba(246,240,214,0.1)',
          }}
        />
      ) : homeDusk ? (
        <span
          className="uv-celestial"
          style={{
            right: '9%',
            top: '11%',
            width: 34,
            height: 34,
            background: 'radial-gradient(circle at 38% 34%, rgba(255,246,221,0.9) 0%, rgba(236,202,154,0.46) 56%, transparent 74%)',
            boxShadow: '0 0 38px 12px rgba(255,214,158,0.16)',
          }}
        />
      ) : (
        /* Not a sun — a warm pool of lamplight on the page. A sun is a thing in
           a sky, and this ground is paper; the old near-white disc with its wide
           bloom read as a smudge wiped across the sheet. Softened to the barest
           warm lift, so it gives the corner some light without becoming an
           object the eye has to explain. */
        <span
          className="uv-celestial"
          style={{
            left: '7%',
            top: '6%',
            width: 190,
            height: 190,
            filter: 'blur(14px)',
            background: 'radial-gradient(circle, rgba(255,252,242,0.5) 0%, rgba(248,240,220,0.2) 52%, transparent 74%)',
            boxShadow: '0 0 110px 60px rgba(252,246,231,0.18)',
          }}
        />
      )}

      {stars.map((s, i) => (
        <span key={`s${i}`} className="uv-star" style={s} />
      ))}

      {(dark || homeDusk) && <span className="uv-kawkab-glow" />}
      {showShoot && <span className="uv-shoot" />}

      <span
        className="uv-mist"
        style={{
          background: dark
            ? 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)'
            : homeDusk
              ? 'linear-gradient(180deg, transparent 0%, rgba(42,28,39,0.24) 100%)'
              : 'linear-gradient(180deg, transparent 0%, rgba(233,227,210,0.55) 100%)',
        }}
      />
      <span
        className="uv-veil"
        style={{
          background: dark
            ? 'radial-gradient(ellipse 130% 95% at 50% 38%, transparent 58%, rgba(0,0,0,0.45) 100%)'
            /* Paper gets a vignette rather than a top-lit wash: a sheet darkens
               slightly at its edges where it curls, which is the opposite of the
               sky's brighter-toward-the-light reading. */
            : homeDusk
              ? 'radial-gradient(ellipse 128% 92% at 50% 42%, transparent 58%, rgba(20,14,28,0.34) 100%)'
              : 'radial-gradient(ellipse 128% 92% at 50% 42%, transparent 62%, rgba(196,183,152,0.2) 100%)',
        }}
      />
    </div>
  );
}
