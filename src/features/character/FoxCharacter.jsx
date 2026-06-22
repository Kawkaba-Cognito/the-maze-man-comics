import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, darken, mix } from './shade';

/**
 * FoxCharacter — the Maze Man guide fox, redrawn to match the guide-fox sprite
 * seen in Training: a SLEEK ALL-DARK fox with warm amber RIM-LIGHT glowing
 * around the whole silhouette, sharp amber-lined ears, pale glowing almond
 * eyes, and a big bushy tail curling up the right side with an amber-glowing
 * tip. No cream bib/muzzle — the form reads through the rim glow + one shade
 * plane. Recolorable via `fur` + `accent`; `mood` tints the eye glow.
 */
const MOOD_EYE = {
  ready: '#fff0c8',
  focused: '#ffe79a',
  proud: '#fff4d4',
  tired: '#d4b870',
};

// Where each gear slot attaches (0..200 viewBox). Head r=34 @ (100,68).
const ANCHORS = {
  hat: { x: 100, y: 36, s: 1.7 },
  face: { x: 100, y: 64, s: 1.45 },
  neck: { x: 100, y: 104, s: 1.25 },
  back: { x: 100, y: 112, s: 1.15 },
};

export default React.memo(function FoxCharacter({
  size = 200,
  fur = '#12121a',
  accent = '#c8943e',
  mood = 'ready',
  equipped = null,
  glow = true,
  float = false,
}) {
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${uid}-${n}`;
  const f = ramp(fur);
  const g = metal(accent);
  const eye = MOOD_EYE[mood] || MOOD_EYE.ready;
  const eyeHot = lighten(eye, 0.6);
  const ink = darken(fur, 0.65);
  const innerEar = mix(fur, accent, 0.55);

  const cx = 100;
  const headR = 34, headY = 68;

  const width = size;
  const height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur };

  // Render a fur part with an amber rim-light: a blurred accent copy sits behind
  // the dark fill, so warm light bleeds around the silhouette edge.
  const Rim = ({ d, sw = 2.2, fill = f.core }) => (
    <>
      <path d={d} fill={accent} opacity="0.62" filter={`url(#${id('rim')})`} />
      <path d={d} fill={fill} stroke={ink} strokeWidth={sw} strokeLinejoin="round" />
    </>
  );

  return (
    <div className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 200 240" width={width} height={height} role="img"
        aria-label="fox character" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <clipPath id={id('headclip')}>
            <circle cx={cx} cy={headY} r={headR} />
          </clipPath>
          <filter id={id('rim')} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <filter id={id('eyeglow')} x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>

        {glow && <ellipse cx={cx} cy="120" rx="78" ry="104" fill={accent} opacity="0.05" />}
        <ellipse cx={cx} cy="212" rx="46" ry="8" fill={ink} opacity="0.2" />

        {/* equipped gear behind the body (cape / wings / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* bushy tail curling up the right side, amber-glowing underside + tip */}
        <Rim sw={2.2} d={`M${cx + 20},198 C${cx + 58},208 ${cx + 84},168 ${cx + 74},126 C${cx + 70},104 ${cx + 52},94 ${cx + 42},106 C${cx + 58},110 ${cx + 64},140 ${cx + 56},166 C${cx + 50},186 ${cx + 34},194 ${cx + 20},198 Z`} />
        {/* amber tail tip */}
        <path d={`M${cx + 42},106 C${cx + 56},96 ${cx + 70},104 ${cx + 74},126 C${cx + 68},112 ${cx + 56},108 ${cx + 46},114 Z`}
          fill={`url(#${id('gold')})`} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        {/* warm underside sheen */}
        <path d={`M${cx + 44},112 C${cx + 58},118 ${cx + 62},144 ${cx + 55},166 C${cx + 60},142 ${cx + 56},120 ${cx + 44},114 Z`}
          fill={accent} opacity="0.4" />

        {/* sitting body: sleek pear silhouette */}
        <Rim sw={2.2} d={`M${cx - 26},206 C${cx - 40},198 ${cx - 34},150 ${cx - 18},112 L${cx + 18},112 C${cx + 34},150 ${cx + 40},198 ${cx + 26},206 Q${cx},214 ${cx - 26},206 Z`} />
        {/* single flat form-shadow plane on the right */}
        <path d={`M${cx + 6},112 L${cx + 18},112 C${cx + 34},150 ${cx + 40},198 ${cx + 26},206 Q${cx + 16},209 ${cx + 8},208 C${cx + 22},176 ${cx + 18},140 ${cx + 6},112 Z`}
          fill={f.occ} opacity="0.45" />
        {/* soft chest sheen (no cream bib) */}
        <path d={`M${cx - 12},122 Q${cx},118 ${cx + 11},122 C${cx + 13},150 ${cx + 7},180 ${cx},188 C${cx - 8},180 ${cx - 14},150 ${cx - 12},122 Z`}
          fill={lighten(fur, 0.14)} opacity="0.55" />

        {/* front paws */}
        <line x1={cx - 13} y1="176" x2={cx - 13} y2="200" stroke={f.deep} strokeWidth="13" strokeLinecap="round" />
        <line x1={cx + 13} y1="176" x2={cx + 13} y2="200" stroke={f.deep} strokeWidth="13" strokeLinecap="round" />
        <line x1={cx - 16} y1="180" x2={cx - 16} y2="196" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <line x1={cx + 10} y1="180" x2={cx + 10} y2="196" stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
        <ellipse cx={cx - 13} cy="203" rx="9" ry="4.8" fill={ink} />
        <ellipse cx={cx + 13} cy="203" rx="9" ry="4.8" fill={ink} />

        {/* ears: sharp triangles with amber inner */}
        <Rim sw={2.2} d={`M${cx - 30},${headY - 14} L${cx - 42},${headY - 58} Q${cx - 40},${headY - 63} ${cx - 35},${headY - 59} L${cx - 8},${headY - 30} Z`} />
        <Rim sw={2.2} d={`M${cx + 30},${headY - 14} L${cx + 42},${headY - 58} Q${cx + 40},${headY - 63} ${cx + 35},${headY - 59} L${cx + 8},${headY - 30} Z`} />
        <path d={`M${cx - 29},${headY - 23} L${cx - 38},${headY - 53} L${cx - 15},${headY - 32} Z`} fill={innerEar} />
        <path d={`M${cx + 29},${headY - 23} L${cx + 38},${headY - 53} L${cx + 15},${headY - 32} Z`} fill={innerEar} />

        {/* head */}
        <Rim sw={2.2} d={`M${cx - headR},${headY} a${headR},${headR} 0 1,0 ${headR * 2},0 a${headR},${headR} 0 1,0 ${-headR * 2},0`} />
        {/* one shade crescent + one highlight */}
        <ellipse cx={cx + 19} cy={headY + 6} rx="21" ry="28" fill={f.occ} opacity="0.34"
          clipPath={`url(#${id('headclip')})`} />
        <ellipse cx={cx - 15} cy={headY - 17} rx="13" ry="7" fill={lighten(fur, 0.34)} opacity="0.55"
          clipPath={`url(#${id('headclip')})`} transform={`rotate(-24 ${cx - 15} ${headY - 17})`} />

        {/* lighter muzzle mask so the nose & mouth read clearly against the dark fur */}
        <path d={`M${cx - 15},${headY + 5} Q${cx},${headY - 2} ${cx + 15},${headY + 5} Q${cx + 12},${headY + 29} ${cx},${headY + 33} Q${cx - 12},${headY + 29} ${cx - 15},${headY + 5} Z`}
          fill={mix(fur, '#f3e7cf', 0.34)} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />

        {/* angled brows for a clear, confident expression */}
        <path d={`M${cx - 22},${headY - 11} Q${cx - 14},${headY - 14} ${cx - 5},${headY - 11}`}
          fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />
        <path d={`M${cx + 22},${headY - 11} Q${cx + 14},${headY - 14} ${cx + 5},${headY - 11}`}
          fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" />

        {/* eyes: crisp dark socket so the glowing almond pops, mood-tinted halo */}
        <g>
          <ellipse cx={cx - 13} cy={headY - 2} rx="10" ry="6.5" fill={eye} opacity="0.8"
            filter={`url(#${id('eyeglow')})`} transform={`rotate(12 ${cx - 13} ${headY - 2})`} />
          <ellipse cx={cx + 13} cy={headY - 2} rx="10" ry="6.5" fill={eye} opacity="0.8"
            filter={`url(#${id('eyeglow')})`} transform={`rotate(-12 ${cx + 13} ${headY - 2})`} />
        </g>
        <path d={`M${cx - 23},${headY - 2} Q${cx - 13},${headY - 11} ${cx - 4},${headY - 1} Q${cx - 13},${headY + 6} ${cx - 23},${headY - 2} Z`}
          fill={eyeHot} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <path d={`M${cx + 23},${headY - 2} Q${cx + 13},${headY - 11} ${cx + 4},${headY - 1} Q${cx + 13},${headY + 6} ${cx + 23},${headY - 2} Z`}
          fill={eyeHot} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        {/* dark pupils + catchlight read the gaze clearly */}
        <ellipse cx={cx - 11} cy={headY - 1} rx="2.6" ry="3.4" fill={ink} />
        <ellipse cx={cx + 11} cy={headY - 1} rx="2.6" ry="3.4" fill={ink} />
        <circle cx={cx - 12} cy={headY - 3} r="1.4" fill="#fff" />
        <circle cx={cx + 10} cy={headY - 3} r="1.4" fill="#fff" />

        {/* bolder nose + mouth */}
        <path d={`M${cx - 5},${headY + 14} Q${cx},${headY + 12} ${cx + 5},${headY + 14} Q${cx + 4},${headY + 19} ${cx},${headY + 21} Q${cx - 4},${headY + 19} ${cx - 5},${headY + 14} Z`}
          fill={ink} stroke={ink} strokeWidth="1" strokeLinejoin="round" />
        <ellipse cx={cx - 1.6} cy={headY + 15.5} rx="1.2" ry="0.9" fill="#fff" opacity="0.7" />
        <path d={`M${cx},${headY + 21} L${cx},${headY + 25} M${cx - 8},${headY + 28} Q${cx},${headY + 32} ${cx + 8},${headY + 28}`}
          fill="none" stroke={ink} strokeWidth="2.2" strokeLinecap="round" />

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
