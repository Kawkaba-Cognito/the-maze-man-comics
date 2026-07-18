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

const BLOBS_LIGHT = [
  { x: '4%', y: '8%', w: 380, h: 250, c: 'rgba(255,255,255,0.6)', dur: 30 },
  { x: '56%', y: '0%', w: 430, h: 280, c: 'rgba(196,208,236,0.55)', dur: 36 },
  { x: '42%', y: '52%', w: 480, h: 320, c: 'rgba(244,214,178,0.5)', dur: 42 },
];

export default function UniverseStage({
  accent = 'default',
  shootingStar,
  dark: darkProp,
}) {
  const { appTheme } = useApp();
  const dark = darkProp ?? appTheme !== 'light';
  const key = BLOBS_DARK[accent] ? accent : 'default';
  const blobs = dark ? BLOBS_DARK[key] : BLOBS_LIGHT;
  const showShoot = shootingStar ?? dark;

  const stars = useMemo(
    () => Array.from({ length: STAR_COUNT }, (_, i) => {
      const sz = 1.2 + seed(i, 3) * 2.6;
      return {
        left: `${seed(i, 1) * 100}%`,
        top: `${seed(i, 2) * 100}%`,
        width: sz,
        height: sz,
        opacity: dark ? 0.25 + seed(i, 4) * 0.5 : 0.3 + seed(i, 4) * 0.4,
        boxShadow: sz > 2.7
          ? `0 0 6px 1px rgba(255,255,255,${dark ? 0.55 : 0.75})`
          : 'none',
        animationDuration: `${2.6 + seed(i, 5) * 4}s`,
        animationDelay: `-${seed(i, 6) * 5}s`,
      };
    }),
    [dark],
  );

  return (
    <div
      aria-hidden="true"
      className={`uv-stage uv-stage--${dark ? 'dark' : 'light'} uv-stage--${key}`}
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
      ) : (
        <span
          className="uv-celestial"
          style={{
            left: '7%',
            top: '6%',
            width: 140,
            height: 140,
            filter: 'blur(4px)',
            background: 'radial-gradient(circle, rgba(255,251,238,0.95) 0%, rgba(255,245,216,0.5) 46%, transparent 70%)',
            boxShadow: '0 0 90px 46px rgba(255,247,222,0.5)',
          }}
        />
      )}

      {stars.map((s, i) => (
        <span key={`s${i}`} className="uv-star" style={s} />
      ))}

      {dark && <span className="uv-kawkab-glow" />}
      {showShoot && <span className="uv-shoot" />}

      <span
        className="uv-mist"
        style={{
          background: dark
            ? 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)'
            : 'linear-gradient(180deg, transparent 0%, rgba(255,249,240,0.6) 100%)',
        }}
      />
      <span
        className="uv-veil"
        style={{
          background: dark
            ? 'radial-gradient(ellipse 130% 95% at 50% 38%, transparent 58%, rgba(0,0,0,0.45) 100%)'
            : 'radial-gradient(ellipse 130% 80% at 50% 0%, rgba(255,255,255,0.45) 0%, transparent 55%)',
        }}
      />
    </div>
  );
}
