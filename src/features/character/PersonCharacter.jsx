import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, darken, mix } from './shade';

/**
 * PersonCharacter — Maze Man / Maze Woman as a clinical geometric mascot.
 *
 * Flat planes, one shade pass, restrained expression — aligned with the
 * splash screen's professional cognitive-training tone.
 */
const VARIANTS = {
  male: {
    skin: '#c4a088', hair: '#2a2520', lips: null, long: false,
    shHalf: 30, hipHalf: 28, skirt: false,
  },
  female: {
    skin: '#d4b098', hair: '#342830', lips: '#a85868', long: true,
    shHalf: 23, hipHalf: 26, skirt: true,
  },
};

// Where each gear slot attaches (0..200 viewBox). Head r=36 @ (100,64).
const ANCHORS = {
  hat: { x: 100, y: 31, s: 1.8 },
  face: { x: 100, y: 62, s: 1.5 },
  neck: { x: 100, y: 101, s: 1.3 },
  back: { x: 100, y: 106, s: 1.2 },
};

export default React.memo(function PersonCharacter({
  size = 200,
  variant = 'male',
  accent = '#c8943e',
  cloth = '#181820',
  glow = true,
  float = false,
  equipped = null,
}) {
  const v = VARIANTS[variant] || VARIANTS.male;
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${uid}-${n}`;

  const sk = ramp(v.skin);
  const hr = ramp(v.hair);
  const cl = ramp(cloth);
  const g = metal(accent);
  const ink = darken(cloth, 0.78);
  const blush = mix(v.skin, '#b87060', 0.28);

  const cx = 100;
  const headR = 36, headY = 64;
  const sh = v.shHalf, hip = v.hipHalf;
  const bodyTop = 98, bodyBot = v.skirt ? 168 : 184;

  const width = size, height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur: cloth };

  // torso: male = capsule taper; female = cinched waist into the hips
  const waist = v.skirt ? sh - 8 : null;
  const body = v.skirt
    ? `M${cx - sh},${bodyTop + 14} ` +
      `Q${cx - sh},${bodyTop} ${cx - sh + 11},${bodyTop} ` +
      `L${cx + sh - 11},${bodyTop} ` +
      `Q${cx + sh},${bodyTop} ${cx + sh},${bodyTop + 14} ` +
      `C${cx + sh},${bodyTop + 28} ${cx + waist},${bodyTop + 34} ${cx + waist},${bodyTop + 44} ` +
      `C${cx + waist},${bodyTop + 54} ${cx + hip},${bodyBot - 14} ${cx + hip},${bodyBot - 6} ` +
      `Q${cx + hip},${bodyBot} ${cx + hip - 10},${bodyBot} ` +
      `L${cx - hip + 10},${bodyBot} ` +
      `Q${cx - hip},${bodyBot} ${cx - hip},${bodyBot - 6} ` +
      `C${cx - hip},${bodyBot - 14} ${cx - waist},${bodyTop + 54} ${cx - waist},${bodyTop + 44} ` +
      `C${cx - waist},${bodyTop + 34} ${cx - sh},${bodyTop + 28} ${cx - sh},${bodyTop + 14} Z`
    : `M${cx - sh},${bodyTop + 16} ` +
      `Q${cx - sh},${bodyTop} ${cx - sh + 12},${bodyTop} ` +
      `L${cx + sh - 12},${bodyTop} ` +
      `Q${cx + sh},${bodyTop} ${cx + sh},${bodyTop + 16} ` +
      `L${cx + hip},${bodyBot - 12} ` +
      `Q${cx + hip},${bodyBot} ${cx + hip - 10},${bodyBot} ` +
      `L${cx - hip + 10},${bodyBot} ` +
      `Q${cx - hip},${bodyBot} ${cx - hip},${bodyBot - 12} Z`;

  const legY0 = v.skirt ? 184 : 182;
  const legX = v.skirt ? 11 : 13;

  return (
    <div className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 200 240" width={width} height={height} role="img"
        aria-label={`${variant} character`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <clipPath id={id('headclip')}>
            <circle cx={cx} cy={headY} r={headR} />
          </clipPath>
          <clipPath id={id('bodyclip')}>
            <path d={body} />
          </clipPath>
        </defs>

        {glow && <ellipse cx={cx} cy="120" rx="70" ry="100" fill={accent} opacity="0.045" />}
        <ellipse cx={cx} cy="218" rx="42" ry="8" fill={ink} opacity="0.18" />

        {/* equipped gear behind the body (cape / wings / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* long back hair (female) behind everything else on the figure */}
        {v.long && (
          <path
            d={`M${cx - 34},52 Q${cx},20 ${cx + 34},52 L${cx + 30},132 Q${cx + 26},144 ${cx + 14},140 L${cx - 14},140 Q${cx - 26},144 ${cx - 30},132 Z`}
            fill={hr.core} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* ── legs + feet ── */}
        <line x1={cx - legX} y1={legY0} x2={cx - legX} y2="204" stroke={cl.deep} strokeWidth="14" strokeLinecap="round" />
        <line x1={cx + legX} y1={legY0} x2={cx + legX} y2="204" stroke={cl.deep} strokeWidth="14" strokeLinecap="round" />
        <ellipse cx={cx - legX - 2} cy="209" rx="11" ry="5.5" fill={ink} />
        <ellipse cx={cx + legX + 2} cy="209" rx="11" ry="5.5" fill={ink} />

        {/* skirt (female) */}
        {v.skirt && (
          <path d={`M${cx - hip},156 L${cx + hip},156 L${cx + hip + 8},186 Q${cx},192 ${cx - hip - 8},186 Z`}
            fill={cl.core} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* ── arms: rounded capsules, hands as simple skin discs ── */}
        <line x1={cx - sh + 3} y1="110" x2={cx - sh - 4} y2="148" stroke={cl.core} strokeWidth="13" strokeLinecap="round" />
        <line x1={cx + sh - 3} y1="110" x2={cx + sh + 4} y2="148" stroke={cl.core} strokeWidth="13" strokeLinecap="round" />
        <circle cx={cx - sh - 5} cy="155" r="7" fill={sk.core} stroke={ink} strokeWidth="1.6" />
        <circle cx={cx + sh + 5} cy="155" r="7" fill={sk.core} stroke={ink} strokeWidth="1.6" />

        {/* ── torso ── */}
        <path d={body} fill={cl.core} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        {/* single flat shade plane (right third) */}
        <path d={`M${cx + sh * 0.35},${bodyTop} L${cx + sh},${bodyTop} L${cx + hip},${bodyBot} L${cx + hip * 0.35},${bodyBot} Z`}
          fill={cl.deep} opacity="0.35" clipPath={`url(#${id('bodyclip')})`} />
        {/* accent belt + chest maze emblem (brand mark) */}
        <rect x={cx - hip - 1} y={v.skirt ? 148 : 152} width={(hip + 1) * 2} height="9" rx="4.5"
          fill={`url(#${id('gold')})`} stroke={ink} strokeWidth="1.4" />
        <rect x={cx - 8} y="118" width="16" height="16" rx="4" fill={`url(#${id('gold')})`} stroke={ink} strokeWidth="1.3" opacity="0.92" />
        <path d="M96,123 H104 M104,123 V127 M104,127 H98 M98,127 V130 M98,130 H104"
          fill="none" stroke={ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          transform={`translate(${cx - 100},0)`} />

        {/* ── head ── */}
        <circle cx={cx} cy={headY} r={headR} fill={sk.core} stroke={ink} strokeWidth="2.2" />
        {/* one shade crescent + one highlight */}
        <ellipse cx={cx + 20} cy={headY + 6} rx="22" ry="30" fill={sk.deep} opacity="0.22"
          clipPath={`url(#${id('headclip')})`} />
        <ellipse cx={cx - 16} cy={headY - 18} rx="13" ry="8" fill={sk.spec} opacity="0.35"
          clipPath={`url(#${id('headclip')})`} transform={`rotate(-24 ${cx - 16} ${headY - 18})`} />

        {/* hair */}
        {v.long ? (
          <>
            {/* crown with a soft sweep, leaving the face open from the brow */}
            <path
              d={`M${cx - headR},${headY + 6} A${headR},${headR} 0 0 1 ${cx + headR},${headY + 6} Q${cx + headR - 5},${headY - 13} ${cx + 9},${headY - 18} Q${cx},${headY - 21} ${cx - 9},${headY - 18} Q${cx - headR + 5},${headY - 13} ${cx - headR},${headY + 6} Z`}
              fill={hr.core} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
            {/* face-framing side curtains down past the jaw */}
            <path
              d={`M${cx - headR + 1},${headY - 4} C${cx - headR - 7},${headY + 12} ${cx - headR - 4},${headY + 30} ${cx - headR + 9},${headY + 40} C${cx - headR + 6},${headY + 24} ${cx - headR + 7},${headY + 8} ${cx - headR + 5},${headY - 1} Z`}
              fill={hr.core} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
            <path
              d={`M${cx + headR - 1},${headY - 4} C${cx + headR + 7},${headY + 12} ${cx + headR + 4},${headY + 30} ${cx + headR - 9},${headY + 40} C${cx + headR - 6},${headY + 24} ${cx + headR - 7},${headY + 8} ${cx + headR - 5},${headY - 1} Z`}
              fill={hr.core} stroke={ink} strokeWidth="1.8" strokeLinejoin="round" />
            {/* one quiet shine band on the crown */}
            <path d={`M${cx - 20},${headY - 14} Q${cx},${headY - 22} ${cx + 20},${headY - 14}`}
              fill="none" stroke={lighten(v.hair, 0.35)} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
            {/* small gold earrings */}
            <circle cx={cx - headR + 3} cy={headY + 16} r="2.6" fill={`url(#${id('gold')})`} stroke={ink} strokeWidth="1" />
            <circle cx={cx + headR - 3} cy={headY + 16} r="2.6" fill={`url(#${id('gold')})`} stroke={ink} strokeWidth="1" />
          </>
        ) : (
          <path
            d={`M${cx - headR},${headY - 4} A${headR},${headR} 0 0 1 ${cx + headR},${headY - 4} L${cx + headR - 4},${headY - 2} Q${cx + 18},${headY - 18} ${cx},${headY - 16} Q${cx - 20},${headY - 18} ${cx - headR + 4},${headY} Z`}
            fill={hr.core} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
        )}

        {/* face: dot eyes, brows, smile — minimal and friendly */}
        <circle cx={cx - 13} cy={headY - 2} r={v.long ? 4.4 : 3.6} fill={ink} />
        <circle cx={cx + 13} cy={headY - 2} r={v.long ? 4.4 : 3.6} fill={ink} />
        <circle cx={cx - 12} cy={headY - 3.6} r="1.3" fill="#fff" />
        <circle cx={cx + 14} cy={headY - 3.6} r="1.3" fill="#fff" />
        {v.long && (
          <>
            {/* lash fans on the outer corner of each eye */}
            <path d={`M${cx - 17},${headY - 5} L${cx - 21},${headY - 7.5} M${cx - 17.5},${headY - 2.5} L${cx - 22},${headY - 3.5} M${cx + 17},${headY - 5} L${cx + 21},${headY - 7.5} M${cx + 17.5},${headY - 2.5} L${cx + 22},${headY - 3.5}`}
              stroke={ink} strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
        {v.long ? (
          <>
            <path d={`M${cx - 17},${headY - 12} Q${cx - 12},${headY - 15.5} ${cx - 7},${headY - 13.5}`}
              fill="none" stroke={hr.core} strokeWidth="1.9" strokeLinecap="round" />
            <path d={`M${cx + 7},${headY - 13.5} Q${cx + 12},${headY - 15.5} ${cx + 17},${headY - 12}`}
              fill="none" stroke={hr.core} strokeWidth="1.9" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d={`M${cx - 14},${headY - 11} Q${cx - 9},${headY - 14} ${cx - 5},${headY - 12}`}
              fill="none" stroke={hr.core} strokeWidth="2.4" strokeLinecap="round" />
            <path d={`M${cx + 5},${headY - 12} Q${cx + 9},${headY - 14} ${cx + 14},${headY - 11}`}
              fill="none" stroke={hr.core} strokeWidth="2.4" strokeLinecap="round" />
          </>
        )}
        <circle cx={cx - 22} cy={headY + 9} r="3.5" fill={blush} opacity={v.long ? 0.18 : 0.12} />
        <circle cx={cx + 22} cy={headY + 9} r="3.5" fill={blush} opacity={v.long ? 0.18 : 0.12} />
        {v.lips ? (
          /* cupid's-bow lips: two upper arcs over a soft lower curve */
          <path
            d={`M${cx - 6.5},${headY + 14.5} Q${cx - 3},${headY + 12.5} ${cx},${headY + 14.5} Q${cx + 3},${headY + 12.5} ${cx + 6.5},${headY + 14.5} Q${cx + 3.5},${headY + 19.5} ${cx},${headY + 19.5} Q${cx - 3.5},${headY + 19.5} ${cx - 6.5},${headY + 14.5} Z`}
            fill={v.lips} stroke={darken(v.lips, 0.35)} strokeWidth="0.8" />
        ) : (
          <path d={`M${cx - 6},${headY + 14} Q${cx},${headY + 16.5} ${cx + 6},${headY + 14}`}
            fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
        )}

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
