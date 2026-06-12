import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, darken, mix } from './shade';

/**
 * FoxCharacter — the Maze Man guide fox as a GEOMETRIC MASCOT, matching the
 * PersonCharacter style doctrine: simple confident silhouette, flat colour
 * planes + one shade pass + one highlight, consistent ink outline, no fur
 * strokes or painterly gradients. Sitting pose, brush tail curled around,
 * cream bib and muzzle, mood-coloured eyes. Recolorable via `fur` + `accent`.
 */
const MOOD_EYE = {
  ready: '#ffc24a',
  focused: '#9be85a',
  proud: '#ffe07a',
  tired: '#d8a85a',
};

// Where each gear slot attaches (0..200 viewBox). Head r=34 @ (100,68).
const ANCHORS = {
  hat: { x: 100, y: 38, s: 1.7 },
  face: { x: 100, y: 64, s: 1.45 },
  neck: { x: 100, y: 104, s: 1.25 },
  back: { x: 100, y: 112, s: 1.15 },
};

export default React.memo(function FoxCharacter({
  size = 200,
  fur = '#0e0e16',
  accent = '#f5c542',
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
  const ink = darken(fur, 0.6);
  const cream = '#f3e7cf';
  const creamDeep = darken(cream, 0.16);
  const innerEar = mix(fur, accent, 0.4);

  const cx = 100;
  const headR = 34, headY = 68;

  const width = size;
  const height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur };

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
        </defs>

        {glow && <ellipse cx={cx} cy="124" rx="72" ry="98" fill={accent} opacity="0.06" />}
        <ellipse cx={cx} cy="212" rx="46" ry="8" fill={ink} opacity="0.18" />

        {/* equipped gear behind the body (cape / wings / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* brush tail: one clean swoosh curling around the right side */}
        <path
          d={`M${cx + 28},196 C${cx + 62},198 ${cx + 70},168 ${cx + 58},146 C${cx + 70},170 ${cx + 52},186 ${cx + 30},182 Z`}
          fill={f.core} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        <path
          d={`M${cx + 28},196 C${cx + 62},198 ${cx + 70},168 ${cx + 58},146 C${cx + 66},160 ${cx + 66},176 ${cx + 56},186 C${cx + 48},194 ${cx + 38},197 ${cx + 28},196 Z`}
          fill={f.core} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path
          d={`M${cx + 58},150 C${cx + 66},164 ${cx + 64},176 ${cx + 55},184 C${cx + 62},172 ${cx + 62},160 ${cx + 56},152 Z`}
          fill={`url(#${id('gold')})`} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />

        {/* sitting body: pear silhouette */}
        <path
          d={`M${cx - 30},204 C${cx - 44},196 ${cx - 40},150 ${cx - 22},116 L${cx + 22},116 C${cx + 40},150 ${cx + 44},196 ${cx + 30},204 Q${cx},212 ${cx - 30},204 Z`}
          fill={f.core} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        {/* single flat shade plane on the right */}
        <path
          d={`M${cx + 8},116 L${cx + 22},116 C${cx + 40},150 ${cx + 44},196 ${cx + 30},204 Q${cx + 20},207 ${cx + 10},206 C${cx + 24},178 ${cx + 20},142 ${cx + 8},116 Z`}
          fill={f.deep} opacity="0.4" />
        {/* cream chest bib */}
        <path
          d={`M${cx - 16},118 L${cx + 16},118 C${cx + 22},148 ${cx + 18},178 ${cx},186 C${cx - 18},178 ${cx - 22},148 ${cx - 16},118 Z`}
          fill={cream} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
        <path d={`M${cx + 6},122 C${cx + 14},148 ${cx + 11},170 ${cx + 2},182 C${cx + 12},170 ${cx + 15},146 ${cx + 6},122 Z`}
          fill={creamDeep} opacity="0.5" />

        {/* front paws */}
        <line x1={cx - 13} y1="178" x2={cx - 13} y2="200" stroke={f.deep} strokeWidth="12" strokeLinecap="round" />
        <line x1={cx + 13} y1="178" x2={cx + 13} y2="200" stroke={f.deep} strokeWidth="12" strokeLinecap="round" />
        <ellipse cx={cx - 13} cy="203" rx="9" ry="4.8" fill={ink} />
        <ellipse cx={cx + 13} cy="203" rx="9" ry="4.8" fill={ink} />

        {/* ears: rounded triangles with accent inner */}
        <path d={`M${cx - 32},${headY - 16} L${cx - 40},${headY - 52} Q${cx - 38},${headY - 56} ${cx - 34},${headY - 54} L${cx - 10},${headY - 30} Z`}
          fill={f.core} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d={`M${cx + 32},${headY - 16} L${cx + 40},${headY - 52} Q${cx + 38},${headY - 56} ${cx + 34},${headY - 54} L${cx + 10},${headY - 30} Z`}
          fill={f.core} stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
        <path d={`M${cx - 31},${headY - 24} L${cx - 36},${headY - 47} L${cx - 19},${headY - 31} Z`} fill={innerEar} />
        <path d={`M${cx + 31},${headY - 24} L${cx + 36},${headY - 47} L${cx + 19},${headY - 31} Z`} fill={innerEar} />

        {/* head */}
        <circle cx={cx} cy={headY} r={headR} fill={f.core} stroke={ink} strokeWidth="2.2" />
        {/* one shade crescent + one highlight */}
        <ellipse cx={cx + 19} cy={headY + 6} rx="21" ry="28" fill={f.deep} opacity="0.32"
          clipPath={`url(#${id('headclip')})`} />
        <ellipse cx={cx - 15} cy={headY - 17} rx="12" ry="7" fill={lighten(fur, 0.3)} opacity="0.5"
          clipPath={`url(#${id('headclip')})`} transform={`rotate(-24 ${cx - 15} ${headY - 17})`} />

        {/* cream muzzle mask */}
        <path
          d={`M${cx - 20},${headY + 8} Q${cx},${headY - 2} ${cx + 20},${headY + 8} Q${cx + 18},${headY + 30} ${cx},${headY + 32} Q${cx - 18},${headY + 30} ${cx - 20},${headY + 8} Z`}
          fill={cream} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />

        {/* mood eyes: amber discs with ink pupils */}
        <circle cx={cx - 14} cy={headY - 4} r="6.4" fill={eye} stroke={ink} strokeWidth="1.6" />
        <circle cx={cx + 14} cy={headY - 4} r="6.4" fill={eye} stroke={ink} strokeWidth="1.6" />
        <circle cx={cx - 13} cy={headY - 3} r="3" fill={ink} />
        <circle cx={cx + 15} cy={headY - 3} r="3" fill={ink} />
        <circle cx={cx - 14.6} cy={headY - 5.6} r="1.2" fill="#fff" />
        <circle cx={cx + 13.4} cy={headY - 5.6} r="1.2" fill="#fff" />

        {/* nose + smile */}
        <path d={`M${cx - 4.5},${headY + 12} L${cx + 4.5},${headY + 12} L${cx},${headY + 17} Z`}
          fill={ink} stroke={ink} strokeWidth="1" strokeLinejoin="round" />
        <path d={`M${cx},${headY + 17} L${cx},${headY + 21} M${cx - 7},${headY + 24} Q${cx},${headY + 28} ${cx + 7},${headY + 24}`}
          fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
