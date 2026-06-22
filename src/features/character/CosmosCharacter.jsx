import React, { useId } from 'react';
import { equipped2d } from './items';
import { metal, lighten, darken, mix } from './shade';

/**
 * CosmosCharacter — the genderless main character: a small living planet / a
 * whole universe in one body, now with little legs and hands so it reads as a
 * tidy, composed mascot rather than a floating ball.
 *
 * Tuned to feel clinical & professional: a black world, gold orbital ring,
 * gold glowing eyes, neat limbs in a grounded stance, and a focused expression.
 *
 * Same prop contract as every other character so the home pedestal, the
 * Character screen and the 3D world can render it interchangeably:
 *   - `fur`    recolors the planet body (kept the name for API symmetry)
 *   - `accent` recolors the ring, aura and stars
 *   - `mood`   tints the eye-glow
 *   - `equipped`/`glow`/`float`/`size` behave like the other characters
 *   - `faceOnly` — planet head (ring + eyes) without limbs; for compact icons
 */
const MOOD_EYE = {
  ready: '#ffd85a',
  focused: '#fff1a8',
  proud: '#fffbe0',
  tired: '#e8c060',
};

// Gear attach points (0..200 viewBox). Planet centre (100,102), r=52.
const ANCHORS = {
  hat: { x: 100, y: 38, s: 1.7 },
  face: { x: 100, y: 96, s: 1.45 },
  neck: { x: 100, y: 156, s: 1.2 },
  back: { x: 100, y: 102, s: 1.15 },
};

export default React.memo(function CosmosCharacter({
  size = 200,
  fur = '#0a0a0f',
  accent = '#c8943e',
  mood = 'ready',
  equipped = null,
  glow = true,
  float = false,
  faceOnly = false,
}) {
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${uid}-${n}`;

  const g = metal(accent);       // ring / star metal ramp
  const eye = MOOD_EYE[mood] || MOOD_EYE.ready;
  const eyeCore = lighten(eye, 0.55);
  const edge = '#000000';
  const ink = lighten(fur, 0.18);
  const limb = lighten(fur, 0.14);
  const limbHi = lighten(limb, 0.18);
  const cap = lighten(fur, 0.28);
  const nebula = mix(fur, accent, 0.28);

  const cx = 100, cy = 102, R = 52;

  const width = size;
  const height = faceOnly ? size : size * 1.2;
  const viewBox = faceOnly ? '28 32 144 132' : '0 0 200 240';
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur };

  // A small, restrained 4-point star.
  const Star = ({ x, y, r, fill = accent, o = 1 }) => (
    <path
      d={`M${x},${y - r} L${x + r * 0.24},${y - r * 0.24} L${x + r},${y} L${x + r * 0.24},${y + r * 0.24} L${x},${y + r} L${x - r * 0.24},${y + r * 0.24} L${x - r},${y} L${x - r * 0.24},${y - r * 0.24} Z`}
      fill={fill}
      opacity={o}
    />
  );

  // a limb = rounded capsule + a rounded cap (hand / foot)
  const Limb = ({ x1, y1, x2, y2, w, capX, capY, capR }) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={limb} strokeWidth={w} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={limbHi} strokeWidth={w * 0.34} strokeLinecap="round" opacity="0.5" />
      <circle cx={capX} cy={capY} r={capR} fill={cap} stroke={ink} strokeWidth="1.6" />
    </>
  );

  // Clean glowing gold eye — a soft almond with a white-hot core, gold rim,
  // outer glow halo and a crisp catchlight. Outer corner lifts slightly so the
  // pair reads calm + alert rather than harsh.
  const GlowEye = ({ x, y, dir = 1 }) => {
    const w = 10;
    const hTop = 11.5;
    const hBot = 4.2;
    const tilt = -dir * 7;
    const almond = `M${x - w},${y} Q${x},${y - hTop} ${x + w},${y} Q${x},${y + hBot} ${x - w},${y} Z`;
    return (
      <g transform={`rotate(${tilt} ${x} ${y})`}>
        <ellipse cx={x} cy={y - 2} rx={w * 1.45} ry={hTop * 1.15} fill={accent} opacity="0.3" filter={`url(#${id('eyeglowOuter')})`} />
        <path d={almond} fill={eye} opacity="0.95" filter={`url(#${id('eyeglow')})`} />
        <path d={almond} fill={`url(#${id('eyeCore')})`} stroke={lighten(accent, 0.35)} strokeWidth="1" strokeLinejoin="round" />
        <circle cx={x - w * 0.28} cy={y - hTop * 0.38} r="2" fill="#fff" opacity="0.95" />
        <circle cx={x + w * 0.38} cy={y - hTop * 0.12} r="1.1" fill="#fff" opacity="0.55" />
      </g>
    );
  };

  return (
    <div
      className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}
    >
      <svg
        viewBox={viewBox}
        width={width}
        height={height}
        role="img"
        aria-label="cosmos character"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={id('body')} cx="0.42" cy="0.36" r="0.82">
            <stop offset="0%" stopColor={lighten(fur, 0.1)} />
            <stop offset="42%" stopColor={fur} />
            <stop offset="78%" stopColor="#050508" />
            <stop offset="100%" stopColor={edge} />
          </radialGradient>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="0.35">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <clipPath id={id('sphere')}>
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
          {/* Layered aura — all gradients (cheap; no per-frame blur that caused
              mobile jank). A wide soft halo for atmosphere + a brighter ring that
              hugs the planet edge so the black world looks like it radiates gold. */}
          <radialGradient id={id('auraOuter')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
            <stop offset="38%" stopColor={accent} stopOpacity="0.14" />
            <stop offset="70%" stopColor={accent} stopOpacity="0.05" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('halo')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="56%" stopColor={accent} stopOpacity="0" />
            <stop offset="65%" stopColor={lighten(accent, 0.35)} stopOpacity="0.82" />
            <stop offset="75%" stopColor={accent} stopOpacity="0.34" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={id('eyeCore')} cx="0.42" cy="0.38" r="0.72">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="38%" stopColor={eyeCore} />
            <stop offset="100%" stopColor={eye} />
          </radialGradient>
          <filter id={id('eyeglow')} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
          <filter id={id('eyeglowOuter')} x="-180%" y="-180%" width="460%" height="460%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>
        </defs>

        {/* aura (layered, gently pulsing) + ground shadow. Opacity-only SMIL
            pulse → cheap to composite, gives the black world a living glow. */}
        {glow && (
          <g>
            <animate attributeName="opacity" values="0.8;1;0.8" dur="3.6s" repeatCount="indefinite" />
            <circle cx={cx} cy={cy} r={faceOnly ? 92 : 116} fill={`url(#${id('auraOuter')})`} />
            <circle cx={cx} cy={cy} r={faceOnly ? 68 : 86} fill={`url(#${id('halo')})`} />
          </g>
        )}
        {!faceOnly && <ellipse cx={cx} cy="214" rx="44" ry="7.5" fill={ink} opacity="0.22" />}

        {/* a few restrained distant stars */}
        {!faceOnly && (
          <>
            <Star x={40} y={54} r={4} o={0.7} />
            <Star x={166} y={70} r={3.4} o={0.65} />
            <circle cx={150} cy={34} r="1.8" fill={lighten(accent, 0.4)} opacity="0.6" />
            <circle cx={30} cy={120} r="1.6" fill={lighten(accent, 0.4)} opacity="0.55" />
          </>
        )}

        {/* equipped gear behind the body */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* ring — back half (behind the planet): a precise thin double ring */}
        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="90" ry="23" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="5" opacity="0.92" />
          <ellipse cx={cx} cy={cy} rx="78" ry="19.5" fill="none" stroke={lighten(accent, 0.45)} strokeWidth="2" opacity="0.55" />
        </g>

        {/* planet body — deep black fill, with a luminous gold edge so the black
            world reads (and glows) against dark backgrounds */}
        <circle cx={cx} cy={cy} r={R + 0.6} fill="none" stroke={edge} strokeWidth="3.2" />
        <circle cx={cx} cy={cy} r={R} fill={`url(#${id('body')})`} stroke={edge} strokeWidth="2.4" />
        <circle cx={cx} cy={cy} r={R - 0.6} fill="none" stroke={`url(#${id('gold')})`} strokeWidth="1.7" opacity="0.72" />

        {/* surface: nebula band + craters (no blur filters — the body's radial
            gradient supplies the lit/shaded form, so this stays cheap to raster) */}
        <g clipPath={`url(#${id('sphere')})`}>
          <path d={`M${cx - 54},${cy + 12} Q${cx - 4},${cy - 6} ${cx + 40},${cy + 8} Q${cx + 56},${cy + 18} ${cx + 56},${cy + 32} L${cx + 56},${cy + 56} L${cx - 56},${cy + 56} Z`}
            fill={nebula} opacity="0.22" />
          <circle cx={cx + 16} cy={cy - 18} r="6" fill={lighten(fur, 0.05)} opacity="0.22" />
          <circle cx={cx - 28} cy={cy + 16} r="4.5" fill={lighten(fur, 0.04)} opacity="0.18" />
          <circle cx={cx + 34} cy={cy + 2} r="3.4" fill={lighten(fur, 0.03)} opacity="0.16" />
          <circle cx={cx - 10} cy={cy + 28} r="1.3" fill={lighten(accent, 0.15)} opacity="0.28" />
          <circle cx={cx + 38} cy={cy - 6} r="1.2" fill={lighten(accent, 0.15)} opacity="0.24" />
        </g>
        {/* brighter specular rim light, upper-left */}
        <path d={`M${cx - 38},${cy - 35} A${R},${R} 0 0 1 ${cx + 4},${cy - 51}`}
          fill="none" stroke={lighten(accent, 0.55)} strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
        <path d={`M${cx - 33},${cy - 33} A${R - 6},${R - 6} 0 0 1 ${cx - 2},${cy - 44}`}
          fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />

        {/* ring — front half (over the lower planet) */}
        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <path d={`M${cx + 90},${cy} A90,23 0 0 1 ${cx - 90},${cy}`}
            fill="none" stroke={`url(#${id('gold')})`} strokeWidth="5" strokeLinecap="round" opacity="0.95" />
          <path d={`M${cx + 78},${cy} A78,19.5 0 0 1 ${cx - 78},${cy}`}
            fill="none" stroke={lighten(accent, 0.45)} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* ── limbs: small, neat, grounded stance ── */}
        {!faceOnly && (
          <>
            <Limb x1={cx - 36} y1={cy + 18} x2={cx - 58} y2={cy + 34} w={10} capX={cx - 60} capY={cy + 36} capR={6.5} />
            <Limb x1={cx + 36} y1={cy + 18} x2={cx + 58} y2={cy + 34} w={10} capX={cx + 60} capY={cy + 36} capR={6.5} />
            <Limb x1={cx - 16} y1={cy + R - 6} x2={cx - 16} y2={cy + R + 22} w={12} capX={cx - 16} capY={cy + R + 24} capR={0} />
            <Limb x1={cx + 16} y1={cy + R - 6} x2={cx + 16} y2={cy + R + 22} w={12} capX={cx + 16} capY={cy + R + 24} capR={0} />
            <ellipse cx={cx - 16} cy={cy + R + 26} rx="9" ry="5" fill={cap} stroke={ink} strokeWidth="1.6" />
            <ellipse cx={cx + 16} cy={cy + R + 26} rx="9" ry="5" fill={cap} stroke={ink} strokeWidth="1.6" />
          </>
        )}

        {/* ── face: clean glowing gold eyes + a calm mouth (no harsh brows) ── */}
        <GlowEye x={cx - 18} y={cy - 3} dir={-1} />
        <GlowEye x={cx + 18} y={cy - 3} dir={1} />
        {/* small, composed mouth — a calm, confident line */}
        <path d={`M${cx - 9},${cy + 18} Q${cx},${cy + 21} ${cx + 9},${cy + 18}`}
          fill="none" stroke={darken(accent, 0.5)} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />

        {/* a single quiet moon on the near ring */}
        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <circle cx={cx - 60} cy={cy + 18} r="5" fill={lighten(fur, 0.35)} stroke={ink} strokeWidth="1.6" />
          <circle cx={cx - 61} cy={cy + 16} r="1.7" fill={lighten(fur, 0.42)} opacity="0.7" />
        </g>

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
