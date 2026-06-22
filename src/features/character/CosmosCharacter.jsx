import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, darken, mix } from './shade';

/**
 * CosmosCharacter — the genderless main character: a small living planet / a
 * whole universe in one body, now with little legs and hands so it reads as a
 * tidy, composed mascot rather than a floating ball.
 *
 * Tuned to feel clinical & professional: a deep, calm body, a precise thin
 * double ring (more scientific instrument than cartoon Saturn), a restrained
 * cosmic surface, neat limbs in a grounded stance, and a focused, level-eyed
 * expression instead of a wide grin. No gendered cues by design.
 *
 * Same prop contract as every other character so the home pedestal, the
 * Character screen and the 3D world can render it interchangeably:
 *   - `fur`    recolors the planet body (kept the name for API symmetry)
 *   - `accent` recolors the ring, aura and stars
 *   - `mood`   tints the eye-glow
 *   - `equipped`/`glow`/`float`/`size` behave like the other characters
 */
const MOOD_EYE = {
  ready: '#cdebff',
  focused: '#b6ff7a',
  proud: '#ffe79a',
  tired: '#e6b86a',
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
  fur = '#252c5e',
  accent = '#6fd2df',
  mood = 'ready',
  equipped = null,
  glow = true,
  float = false,
}) {
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${uid}-${n}`;

  const p = ramp(fur);           // planet body ramp
  const g = metal(accent);       // ring / star metal ramp
  const eye = MOOD_EYE[mood] || MOOD_EYE.ready;
  const eyeHot = lighten(eye, 0.5);
  const ink = darken(fur, 0.76);
  const limb = darken(fur, 0.4);          // tidy graphite limbs
  const limbHi = lighten(limb, 0.22);
  const cap = lighten(fur, 0.18);          // hands / feet caps
  const nebula = lighten(mix(fur, accent, 0.42), 0.06); // muted surface band

  const cx = 100, cy = 102, R = 52;

  const width = size;
  const height = size * 1.2;
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

  return (
    <div
      className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}
    >
      <svg
        viewBox="0 0 200 240"
        width={width}
        height={height}
        role="img"
        aria-label="cosmos character"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <radialGradient id={id('body')} cx="0.4" cy="0.34" r="0.8">
            <stop offset="0%" stopColor={p.key} />
            <stop offset="52%" stopColor={p.core} />
            <stop offset="100%" stopColor={p.occ} />
          </radialGradient>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="1" y2="0.35">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <clipPath id={id('sphere')}>
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>
          {/* aura as a gradient (cheap) instead of a large blur filter — big
              blurs re-rasterise every frame on mobile and caused home-screen jank */}
          <radialGradient id={id('aura')} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
            <stop offset="58%" stopColor={accent} stopOpacity="0.05" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <filter id={id('eyeglow')} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
        </defs>

        {/* aura + ground shadow */}
        {glow && <circle cx={cx} cy={cy} r="94" fill={`url(#${id('aura')})`} />}
        <ellipse cx={cx} cy="214" rx="44" ry="7.5" fill={ink} opacity="0.22" />

        {/* a few restrained distant stars */}
        <Star x={40} y={54} r={4} o={0.7} />
        <Star x={166} y={70} r={3.4} o={0.65} />
        <circle cx={150} cy={34} r="1.8" fill={lighten(accent, 0.4)} opacity="0.6" />
        <circle cx={30} cy={120} r="1.6" fill={lighten(accent, 0.4)} opacity="0.55" />

        {/* equipped gear behind the body */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* ring — back half (behind the planet): a precise thin double ring */}
        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="90" ry="23" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="5" opacity="0.92" />
          <ellipse cx={cx} cy={cy} rx="78" ry="19.5" fill="none" stroke={lighten(accent, 0.45)} strokeWidth="2" opacity="0.55" />
        </g>

        {/* planet body */}
        <circle cx={cx} cy={cy} r={R} fill={`url(#${id('body')})`} stroke={ink} strokeWidth="2.2" />

        {/* surface: nebula band + craters (no blur filters — the body's radial
            gradient supplies the lit/shaded form, so this stays cheap to raster) */}
        <g clipPath={`url(#${id('sphere')})`}>
          <path d={`M${cx - 54},${cy + 12} Q${cx - 4},${cy - 6} ${cx + 40},${cy + 8} Q${cx + 56},${cy + 18} ${cx + 56},${cy + 32} L${cx + 56},${cy + 56} L${cx - 56},${cy + 56} Z`}
            fill={nebula} opacity="0.28" />
          <circle cx={cx + 16} cy={cy - 18} r="6" fill={darken(fur, 0.3)} opacity="0.5" />
          <circle cx={cx - 28} cy={cy + 16} r="4.5" fill={darken(fur, 0.3)} opacity="0.45" />
          <circle cx={cx + 34} cy={cy + 2} r="3.4" fill={darken(fur, 0.32)} opacity="0.4" />
          <circle cx={cx - 10} cy={cy + 28} r="1.3" fill="#fff" opacity="0.55" />
          <circle cx={cx + 38} cy={cy - 6} r="1.2" fill="#fff" opacity="0.5" />
        </g>
        {/* crisp rim light, upper-left */}
        <path d={`M${cx - 37},${cy - 37} A${R},${R} 0 0 1 ${cx + 6},${cy - 51}`}
          fill="none" stroke={lighten(accent, 0.4)} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />

        {/* ring — front half (over the lower planet) */}
        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <path d={`M${cx + 90},${cy} A90,23 0 0 1 ${cx - 90},${cy}`}
            fill="none" stroke={`url(#${id('gold')})`} strokeWidth="5" strokeLinecap="round" opacity="0.95" />
          <path d={`M${cx + 78},${cy} A78,19.5 0 0 1 ${cx - 78},${cy}`}
            fill="none" stroke={lighten(accent, 0.45)} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* ── limbs: small, neat, grounded stance ── */}
        {/* arms tuck down at the lower sides */}
        <Limb x1={cx - 36} y1={cy + 18} x2={cx - 58} y2={cy + 34} w={10} capX={cx - 60} capY={cy + 36} capR={6.5} />
        <Limb x1={cx + 36} y1={cy + 18} x2={cx + 58} y2={cy + 34} w={10} capX={cx + 60} capY={cy + 36} capR={6.5} />
        {/* legs stand under the body */}
        <Limb x1={cx - 16} y1={cy + R - 6} x2={cx - 16} y2={cy + R + 22} w={12} capX={cx - 16} capY={cy + R + 24} capR={0} />
        <Limb x1={cx + 16} y1={cy + R - 6} x2={cx + 16} y2={cy + R + 22} w={12} capX={cx + 16} capY={cy + R + 24} capR={0} />
        {/* feet */}
        <ellipse cx={cx - 16} cy={cy + R + 26} rx="9" ry="5" fill={cap} stroke={ink} strokeWidth="1.6" />
        <ellipse cx={cx + 16} cy={cy + R + 26} rx="9" ry="5" fill={cap} stroke={ink} strokeWidth="1.6" />

        {/* ── face: composed, focused, level-eyed ── */}
        {/* level brows for an attentive, professional read */}
        <path d={`M${cx - 25},${cy - 15} L${cx - 11},${cy - 15}`} stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        <path d={`M${cx + 25},${cy - 15} L${cx + 11},${cy - 15}`} stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        {/* eye glow halos */}
        <ellipse cx={cx - 17} cy={cy - 2} rx="8" ry="9.5" fill={eye} opacity="0.7" filter={`url(#${id('eyeglow')})`} />
        <ellipse cx={cx + 17} cy={cy - 2} rx="8" ry="9.5" fill={eye} opacity="0.7" filter={`url(#${id('eyeglow')})`} />
        {/* eye bodies */}
        <ellipse cx={cx - 17} cy={cy - 2} rx="5.4" ry="7.2" fill={eyeHot} stroke={ink} strokeWidth="1.8" />
        <ellipse cx={cx + 17} cy={cy - 2} rx="5.4" ry="7.2" fill={eyeHot} stroke={ink} strokeWidth="1.8" />
        {/* pupils + catchlights — level, forward gaze */}
        <ellipse cx={cx - 17} cy={cy - 1} rx="2.6" ry="3.6" fill={ink} />
        <ellipse cx={cx + 17} cy={cy - 1} rx="2.6" ry="3.6" fill={ink} />
        <circle cx={cx - 18} cy={cy - 4} r="1.3" fill="#fff" />
        <circle cx={cx + 16} cy={cy - 4} r="1.3" fill="#fff" />
        {/* small, composed mouth — a calm, confident line */}
        <path d={`M${cx - 9},${cy + 17} Q${cx},${cy + 20} ${cx + 9},${cy + 17}`}
          fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />

        {/* a single quiet moon on the near ring */}
        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <circle cx={cx - 60} cy={cy + 18} r="5" fill={lighten(fur, 0.22)} stroke={ink} strokeWidth="1.6" />
          <circle cx={cx - 61} cy={cy + 16} r="1.7" fill={lighten(fur, 0.42)} opacity="0.7" />
        </g>

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
