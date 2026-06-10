import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, darken, mix } from './shade';

// Where each gear slot attaches on a person (its own 0..200 viewBox).
const ANCHORS = {
  hat: { x: 100, y: 28, s: 0.6 },
  face: { x: 100, y: 39.5, s: 0.45 },
  neck: { x: 100, y: 62, s: 0.6 },
  back: { x: 100, y: 78, s: 0.85 },
};

/**
 * PersonCharacter — Maze Man / Maze Woman drawn at REALISTIC proportions
 * (~7 heads tall) like an illustrated poster hero, replacing the old
 * big-head chibi build. Painterly shading: radial skin volume, skull-plane
 * lighting, anatomical small-scale features (value-driven eyes/nose/lips),
 * hair strand clusters with a sheen band, fitted guardian outfit with
 * fold shadows and bevelled gold trim.
 *
 *   variant 'male'   — broader shoulders, pauldrons, trousers, stubble
 *   variant 'female' — cinched waist, skirt over leggings, long hair, lips
 */
const VARIANTS = {
  male: {
    skin: '#c68a5e', hair: '#1d160f', lips: null, long: false,
    shHalf: 25, waistHalf: 15, hipHalf: 16, pauldrons: true, skirt: false,
  },
  female: {
    skin: '#dba078', hair: '#171320', lips: '#b56a66', long: true,
    shHalf: 19.5, waistHalf: 11.5, hipHalf: 17, pauldrons: false, skirt: true,
  },
};

export default React.memo(function PersonCharacter({
  size = 200,
  variant = 'male',
  accent = '#f5c542',
  cloth = '#16161f',
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
  const eye = '#a8742e';
  const blush = mix(v.skin, '#c2452f', 0.4);
  const skBounce = mix(v.skin, '#7d8fc0', 0.35);

  const cx = 100;
  const shHalf = v.shHalf, waistHalf = v.waistHalf, hipHalf = v.hipHalf;
  const shY = 65, waistY = 102, hipY = 121;
  const legSplit = v.skirt ? 152 : hipY;

  const width = size, height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur: cloth };

  // fitted torso: shoulders → cinched waist → hips
  const torso =
    `M${cx - shHalf},${shY} ` +
    `C${cx - shHalf},${shY + 13} ${cx - waistHalf - 4},${waistY - 10} ${cx - waistHalf},${waistY} ` +
    `C${cx - waistHalf + 1},${waistY + 9} ${cx - hipHalf},${hipY - 6} ${cx - hipHalf},${hipY} ` +
    `L${cx + hipHalf},${hipY} ` +
    `C${cx + hipHalf},${hipY - 6} ${cx + waistHalf - 1},${waistY + 9} ${cx + waistHalf},${waistY} ` +
    `C${cx + waistHalf + 4},${waistY - 10} ${cx + shHalf},${shY + 13} ${cx + shHalf},${shY} ` +
    `C${cx + shHalf - 5},${shY - 5} ${cx + 9},${shY - 7} 100,${shY - 7} ` +
    `C${cx - 9},${shY - 7} ${cx - shHalf + 5},${shY - 5} ${cx - shHalf},${shY} Z`;

  // arm: deltoid → tapered forearm → wrist, hanging slightly away from the body
  const arm = (sgn) => {
    const sx = cx + sgn * shHalf;
    return `M${sx},${shY} ` +
      `C${sx + sgn * 6},${shY + 4} ${sx + sgn * 7},${shY + 16} ${sx + sgn * 6},${shY + 30} ` +
      `C${sx + sgn * 5},${shY + 46} ${sx + sgn * 4},${shY + 56} ${sx + sgn * 3},${shY + 62} ` +
      `C${sx + sgn * 2.5},${shY + 66} ${sx - sgn * 4.5},${shY + 66} ${sx - sgn * 5},${shY + 62} ` +
      `C${sx - sgn * 6},${shY + 50} ${sx - sgn * 6.5},${shY + 34} ${sx - sgn * 6},${shY + 20} ` +
      `C${sx - sgn * 6},${shY + 10} ${sx - sgn * 4},${shY + 2} ${sx},${shY} Z`;
  };

  // leg as a tapering column: thigh → knee → calf → ankle
  const leg = (lx, wTop, top) =>
    `M${lx - wTop},${top} ` +
    `C${lx - wTop - 0.5},${top + 20} ${lx - 5.5},162 ${lx - 5},176 ` +
    `C${lx - 4.6},190 ${lx - 4.4},200 ${lx - 4.4},207 ` +
    `L${lx + 4.4},207 ` +
    `C${lx + 4.4},200 ${lx + 4.6},190 ${lx + 5},176 ` +
    `C${lx + 5.5},162 ${lx + wTop + 0.5},${top + 20} ${lx + wTop},${top} Z`;

  return (
    <div className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 200 240" width={width} height={height} role="img"
        aria-label={`${variant} character`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id={id('skin')} cx="42%" cy="32%" r="74%">
            <stop offset="0%" stopColor={sk.spec} />
            <stop offset="30%" stopColor={sk.key} />
            <stop offset="62%" stopColor={sk.core} />
            <stop offset="100%" stopColor={sk.deep} />
          </radialGradient>
          <linearGradient id={id('cloth')} x1="0.25" y1="0" x2="0.75" y2="1">
            <stop offset="0%" stopColor={cl.key} />
            <stop offset="50%" stopColor={cl.core} />
            <stop offset="100%" stopColor={cl.deep} />
          </linearGradient>
          <linearGradient id={id('hair')} x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor={hr.key} />
            <stop offset="55%" stopColor={hr.core} />
            <stop offset="100%" stopColor={hr.deep} />
          </linearGradient>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <radialGradient id={id('iris')} cx="50%" cy="38%" r="62%">
            <stop offset="0%" stopColor={lighten(eye, 0.5)} />
            <stop offset="62%" stopColor={eye} />
            <stop offset="100%" stopColor={darken(eye, 0.5)} />
          </radialGradient>
          <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
          <filter id={id('soft1')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {glow && <ellipse cx="100" cy="120" rx="66" ry="102" fill={accent} opacity="0.05" />}
        {/* grounded contact shadow */}
        <ellipse cx="100" cy="217" rx="40" ry="9" fill="#000" opacity="0.28" filter={`url(#${id('soft')})`} />
        <ellipse cx="100" cy="216" rx="27" ry="5" fill="#000" opacity="0.42" />

        {/* equipped gear behind the body (cape / wings / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* back hair mass (female) falling behind the shoulders */}
        {v.long && (
          <>
            <path d="M88,30 C84,22 92,16 100,16 C108,16 116,22 112,30 C120,46 121,76 117,104 C115,112 108,114 104,110 L96,110 C92,114 85,112 83,104 C79,76 80,46 88,30 Z"
              fill={`url(#${id('hair')})`} />
            <path d="M86,48 C84,70 85,92 88,106 L92,106 C89,90 88,68 90,50 Z" fill={hr.occ} opacity="0.5" filter={`url(#${id('soft1')})`} />
            <path d="M114,48 C116,70 115,92 112,106 L108,106 C111,90 112,68 110,50 Z" fill={hr.occ} opacity="0.5" filter={`url(#${id('soft1')})`} />
          </>
        )}

        {/* ── LEGS ── */}
        {v.skirt ? (
          <>
            <path d={leg(93, 6, legSplit)} fill={`url(#${id('cloth')})`} />
            <path d={leg(107, 6, legSplit)} fill={`url(#${id('cloth')})`} />
          </>
        ) : (
          <>
            <path d={leg(91.5, 7.5, legSplit)} fill={`url(#${id('cloth')})`} />
            <path d={leg(108.5, 7.5, legSplit)} fill={`url(#${id('cloth')})`} />
          </>
        )}
        {/* inner-leg core shadow + knee crease + outer key light */}
        <path d={`M96,${legSplit + 4} C95.4,166 95.2,188 95.4,205 M104,${legSplit + 4} C104.6,166 104.8,188 104.6,205`}
          stroke={cl.occ} strokeWidth="2" opacity="0.5" fill="none" strokeLinecap="round" />
        <path d="M89,167 q3.5,1.8 7,0 M104,167 q3.5,1.8 7,0" stroke={cl.deep} strokeWidth="1.1" opacity="0.5" fill="none" strokeLinecap="round" />
        <path d={`M87.5,${legSplit + 6} C86.8,168 86.6,190 87,204 M112.5,${legSplit + 6} C113.2,168 113.4,190 113,204`}
          stroke={cl.key} strokeWidth="1.1" opacity="0.35" fill="none" strokeLinecap="round" />
        {/* boots: shaft, toe-cap light, gold trim, sole */}
        <path d="M86,188 C86,184 96,184 96,188 L96.6,210 C96.6,213.6 100,212.5 100,215 L86,215 C85,210 86,196 86,188 Z" fill={cl.deep} />
        <path d="M114,188 C114,184 104,184 104,188 L103.4,210 C103.4,213.6 100,212.5 100,215 L114,215 C115,210 114,196 114,188 Z" fill={cl.deep} />
        <path d="M88,189 Q91,187.6 94,189" stroke={cl.key} strokeWidth="1" opacity="0.5" fill="none" strokeLinecap="round" />
        <path d="M106,189 Q109,187.6 112,189" stroke={cl.key} strokeWidth="1" opacity="0.5" fill="none" strokeLinecap="round" />
        <path d="M86.4,190.5 L95.8,190.5 M104.2,190.5 L113.6,190.5" stroke={accent} strokeWidth="1.3" opacity="0.65" />
        <path d="M86,214.2 L100,214.2 M100,214.2 L114,214.2" stroke="#000" strokeWidth="1.6" opacity="0.5" />

        {/* ── ARMS (hanging, slight outward curve) ── */}
        <path d={arm(-1)} fill={`url(#${id('cloth')})`} />
        <path d={arm(1)} fill={`url(#${id('cloth')})`} />
        {/* deltoid highlight + elbow fold + forearm core shadow */}
        <ellipse cx={cx - shHalf - 1} cy={shY + 8} rx="4" ry="6" fill={cl.key} opacity="0.3" filter={`url(#${id('soft1')})`} />
        <ellipse cx={cx + shHalf + 1} cy={shY + 8} rx="4" ry="6" fill={cl.key} opacity="0.3" filter={`url(#${id('soft1')})`} />
        <path d={`M${cx - shHalf - 5},${shY + 32} q3,1.6 5.5,0 M${cx + shHalf + 5},${shY + 32} q-3,1.6 -5.5,0`}
          stroke={cl.occ} strokeWidth="1" opacity="0.55" fill="none" strokeLinecap="round" />
        {/* gold cuffs with bevel */}
        <rect x={cx - shHalf - 6} y={shY + 56} width="9" height="4" rx="1.8" fill={`url(#${id('gold')})`} />
        <rect x={cx + shHalf - 3} y={shY + 56} width="9" height="4" rx="1.8" fill={`url(#${id('gold')})`} />
        <path d={`M${cx - shHalf - 5},${shY + 56.8} l7,0 M${cx + shHalf - 2},${shY + 56.8} l7,0`} stroke={g.hi} strokeWidth="0.8" opacity="0.8" />
        {/* hands: palm + thumb + knuckle hint */}
        <ellipse cx={cx - shHalf - 1.5} cy={shY + 66} rx="3.4" ry="4.6" fill={`url(#${id('skin')})`} />
        <ellipse cx={cx + shHalf + 1.5} cy={shY + 66} rx="3.4" ry="4.6" fill={`url(#${id('skin')})`} />
        <ellipse cx={cx - shHalf + 1.4} cy={shY + 64} rx="1.3" ry="2.2" fill={`url(#${id('skin')})`} />
        <ellipse cx={cx + shHalf - 1.4} cy={shY + 64} rx="1.3" ry="2.2" fill={`url(#${id('skin')})`} />
        <path d={`M${cx - shHalf - 3.6},${shY + 65} q1.8,1.2 3.6,0.8 M${cx + shHalf + 0},${shY + 65.8} q1.8,0.4 3.6,-0.8`}
          stroke={sk.deep} strokeWidth="0.7" opacity="0.5" fill="none" strokeLinecap="round" />

        {/* ── TORSO (breathing) ── */}
        <g className="mmv-breathe">
        <path d={torso} fill={`url(#${id('cloth')})`} />
        {/* skirt (female) with pleats */}
        {v.skirt && (
          <>
            <path d={`M${cx - hipHalf},${hipY - 4} C${cx - hipHalf - 5},136 ${cx - hipHalf - 7},146 ${cx - hipHalf - 7},152 L${cx + hipHalf + 7},152 C${cx + hipHalf + 7},146 ${cx + hipHalf + 5},136 ${cx + hipHalf},${hipY - 4} Z`}
              fill={`url(#${id('cloth')})`} />
            <path d="M88,126 C85,138 84,146 84,151 M96,128 C95,138 94.6,145 94.6,151 M104,128 C105,138 105.4,145 105.4,151 M112,126 C115,138 116,146 116,151"
              fill="none" stroke={cl.occ} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
            <path d="M92,127 C90,138 89,146 89,151 M108,127 C110,138 111,146 111,151"
              fill="none" stroke={cl.key} strokeWidth="0.8" opacity="0.35" strokeLinecap="round" />
            <path d={`M${cx - hipHalf - 6},150 Q100,156 ${cx + hipHalf + 6},150`} fill="none" stroke={cl.occ} strokeWidth="1.4" opacity="0.5" />
          </>
        )}
        {/* chest plane: pec shadow (male) / bust shading (female) */}
        {v.pauldrons ? (
          <path d="M88,84 Q100,89 112,84" fill="none" stroke={cl.occ} strokeWidth="1.6" opacity="0.45" strokeLinecap="round" filter={`url(#${id('soft1')})`} />
        ) : (
          <path d="M91,84 Q95.5,89 100,86.5 Q104.5,89 109,84" fill="none" stroke={cl.occ} strokeWidth="1.4" opacity="0.45" strokeLinecap="round" filter={`url(#${id('soft1')})`} />
        )}
        {/* V-neck skin + collarbones + gold trim */}
        <path d={`M94.5,${shY - 6} L100,${shY + 8} L105.5,${shY - 6} Z`} fill={`url(#${id('skin')})`} />
        <path d={`M95.8,${shY - 3} q3,2 3.6,4.4 M104.2,${shY - 3} q-3,2 -3.6,4.4`} fill="none" stroke={sk.deep} strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
        <path d={`M94,${shY - 6} L100,${shY + 9} L106,${shY - 6}`} fill="none" stroke={`url(#${id('gold')})`} strokeWidth="1.7" />
        <path d={`M94.7,${shY - 5.4} L100,${shY + 7.6}`} fill="none" stroke={g.hi} strokeWidth="0.6" opacity="0.7" />
        {/* center seam + waist folds + side core shadows */}
        <path d={`M100,${shY + 9} L100,${waistY + 4}`} stroke={cl.deep} strokeWidth="1.6" opacity="0.5" />
        <path d={`M${cx - waistHalf + 1},${waistY - 16} q3,5 2.4,12 M${cx + waistHalf - 1},${waistY - 16} q-3,5 -2.4,12`}
          stroke={cl.occ} strokeWidth="1.2" opacity="0.5" fill="none" strokeLinecap="round" />
        <path d={`M91,${waistY - 3} q4,-2.6 7,-1 M109,${waistY - 3} q-4,-2.6 -7,-1`} stroke={cl.occ} strokeWidth="1" opacity="0.55" fill="none" strokeLinecap="round" />
        <path d={`M${cx - shHalf + 4},${shY + 8} C${cx - shHalf + 7},${shY + 22} ${cx - waistHalf - 1},${waistY - 14} ${cx - waistHalf + 1},${waistY - 4}`}
          fill="none" stroke={cl.deep} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
        <path d={`M${cx + shHalf - 4},${shY + 8} C${cx + shHalf - 7},${shY + 22} ${cx + waistHalf + 1},${waistY - 14} ${cx + waistHalf - 1},${waistY - 4}`}
          fill="none" stroke={cl.deep} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
        {/* cloth sheen + cool bounce + gold rim on the lit side */}
        <ellipse cx={cx - 9} cy={shY + 22} rx="6" ry="13" fill={cl.key} opacity="0.25" filter={`url(#${id('soft')})`} />
        <path d={`M${cx + waistHalf},${waistY} C${cx + waistHalf + 3},${waistY - 16} ${cx + shHalf},${shY + 16} ${cx + shHalf},${shY + 4}`}
          fill="none" stroke={g.hi} strokeWidth="1.7" opacity="0.4" strokeLinecap="round" />
        <path d={`M${cx - waistHalf},${waistY} C${cx - waistHalf - 3},${waistY - 16} ${cx - shHalf},${shY + 16} ${cx - shHalf},${shY + 4}`}
          fill="none" stroke={skBounce} strokeWidth="1.5" opacity="0.22" strokeLinecap="round" />
        {/* female brooch */}
        {v.skirt && <path d={`M100,${shY + 11} L102.4,${shY + 14} L100,${shY + 18} L97.6,${shY + 14} Z`} fill={`url(#${id('gold')})`} />}
        {/* belt: bevelled strap + buckle */}
        <rect x={cx - waistHalf - 1.5} y={waistY + 2} width={(waistHalf + 1.5) * 2} height="5.5" rx="1.6" fill={`url(#${id('gold')})`} />
        <path d={`M${cx - waistHalf - 0.5},${waistY + 2.9} l${(waistHalf + 0.5) * 2},0`} stroke={g.hi} strokeWidth="0.8" opacity="0.8" />
        <path d={`M${cx - waistHalf - 0.5},${waistY + 6.7} l${(waistHalf + 0.5) * 2},0`} stroke={g.lo} strokeWidth="0.8" opacity="0.8" />
        <rect x={cx - 3} y={waistY + 1.2} width="6" height="7" rx="1.6" fill={darken(accent, 0.25)} />
        <circle cx={cx} cy={waistY + 4.7} r="1.3" fill={g.hi} opacity="0.9" />
        {/* pauldrons (male) */}
        {v.pauldrons && (
          <>
            <ellipse cx={cx - shHalf + 1} cy={shY - 1} rx="8" ry="6" fill={`url(#${id('gold')})`} />
            <ellipse cx={cx + shHalf - 1} cy={shY - 1} rx="8" ry="6" fill={`url(#${id('gold')})`} />
            <path d={`M${cx - shHalf - 6},${shY + 1} a8,6 0 0 1 14,-3.4 M${cx + shHalf - 8},${shY - 2.4} a8,6 0 0 1 14,3.4`}
              fill="none" stroke={g.lo} strokeWidth="0.9" opacity="0.6" />
            <ellipse cx={cx - shHalf - 1} cy={shY - 3.4} rx="2.8" ry="1.7" fill={g.hi} opacity="0.8" />
            <ellipse cx={cx + shHalf - 3} cy={shY - 3.4} rx="2.8" ry="1.7" fill={g.hi} opacity="0.8" />
          </>
        )}
        </g>

        {/* ── NECK: cylinder + jaw drop shadow + trapezius ── */}
        <path d={`M96,50 L96,${shY - 6} C96,${shY - 4} 104,${shY - 4} 104,${shY - 6} L104,50 Z`} fill={`url(#${id('skin')})`} />
        <path d={`M96,52 C98,56 102,56 104,52 L104,50 L96,50 Z`} fill={sk.occ} opacity="0.55" filter={`url(#${id('soft1')})`} />
        <path d={`M96.8,${shY - 10} L97,${shY - 6} M103.2,${shY - 10} L103,${shY - 6}`} stroke={sk.deep} strokeWidth="0.7" opacity="0.4" strokeLinecap="round" />
        <path d={`M96,${shY - 8} C92,${shY - 6} 88,${shY - 4} 84,${shY - 2} M104,${shY - 8} C108,${shY - 6} 112,${shY - 4} 116,${shY - 2}`}
          fill="none" stroke={sk.deep} strokeWidth="0.001" opacity="0" />

        {/* ── EARS ── */}
        <ellipse cx="89" cy="40.5" rx="2.2" ry="3.4" fill={`url(#${id('skin')})`} />
        <ellipse cx="111" cy="40.5" rx="2.2" ry="3.4" fill={`url(#${id('skin')})`} />
        <path d="M88.4,38.8 a2,2.6 0 0 1 2,1.8 a1.5,2 0 0 0 -1.3,1.8" fill="none" stroke={sk.deep} strokeWidth="0.6" opacity="0.6" strokeLinecap="round" />
        <path d="M111.6,38.8 a2,2.6 0 0 0 -2,1.8 a1.5,2 0 0 1 1.3,1.8" fill="none" stroke={sk.deep} strokeWidth="0.6" opacity="0.6" strokeLinecap="round" />

        {/* ── HEAD: skull + tapered jaw ── */}
        <path d="M100,26 C107.6,26 110.8,32 110.8,40 C110.8,45.6 108.4,49.8 104.6,52.4 C103.2,53.5 101.6,54 100,54 C98.4,54 96.8,53.5 95.4,52.4 C91.6,49.8 89.2,45.6 89.2,40 C89.2,32 92.4,26 100,26 Z"
          fill={`url(#${id('skin')})`} />
        {/* skull planes: forehead light, temples, cheekbones, jaw AO, chin */}
        <ellipse cx="96" cy="33.5" rx="6.5" ry="4.5" fill={sk.spec} opacity="0.4" filter={`url(#${id('soft1')})`} />
        <path d="M109.6,36 C110.6,41 109.4,46 106.4,49.6 C108.8,45.6 109.8,40.8 108.8,36.4 Z" fill={sk.deep} opacity="0.5" filter={`url(#${id('soft1')})`} />
        <ellipse cx="107.2" cy="43.5" rx="1.9" ry="3" fill={sk.deep} opacity="0.35" filter={`url(#${id('soft1')})`} />
        <ellipse cx="92.6" cy="43.4" rx="2" ry="1.4" fill={sk.key} opacity="0.5" filter={`url(#${id('soft1')})`} />
        <path d="M104.4,47 C106,50 103.6,52.6 100,53.4 C102,51.8 103.4,49.6 103.2,47.4 Z" fill={sk.deep} opacity="0.45" filter={`url(#${id('soft1')})`} />
        <path d="M97,52.6 C99,53.4 101,53.4 103,52.6 C101.4,54 98.6,54 97,52.6 Z" fill={skBounce} opacity="0.3" filter={`url(#${id('soft1')})`} />
        {/* male stubble */}
        {!v.lips && <path d="M94,46.5 C96,50.8 104,50.8 106,46.5 C105,51.4 102.4,53.2 100,53.2 C97.6,53.2 95,51.4 94,46.5 Z" fill={hr.deep} opacity="0.15" filter={`url(#${id('soft1')})`} />}

        {/* brows: tapered value strips (thicker inner, thin tail) */}
        <path d="M93.6,35.8 Q96,34.7 98.3,35.4" fill="none" stroke={hr.deep} strokeWidth="0.85" opacity="0.9" strokeLinecap="round" />
        <path d="M101.7,35.4 Q104,34.7 106.4,35.8" fill="none" stroke={hr.deep} strokeWidth="0.85" opacity="0.9" strokeLinecap="round" />
        <path d="M94.4,35.4 Q96.4,34.6 98,35.2 M102,35.2 Q103.6,34.6 105.6,35.4" fill="none" stroke={hr.core} strokeWidth="0.4" opacity="0.6" strokeLinecap="round" />
        {/* eye sockets */}
        <ellipse cx="96" cy="37.4" rx="3.1" ry="1.4" fill={sk.deep} opacity="0.3" filter={`url(#${id('soft1')})`} />
        <ellipse cx="104" cy="37.4" rx="3.1" ry="1.4" fill={sk.deep} opacity="0.3" filter={`url(#${id('soft1')})`} />

        {/* eyes (idle blink): small, value-driven realism */}
        <g className="mmv-blink">
          <path d="M93.8,38.6 Q96,36.9 98.2,38.5 Q96,40 93.8,38.6 Z" fill="#efe9dd" />
          <path d="M101.8,38.5 Q104,36.9 106.2,38.6 Q104,40 101.8,38.5 Z" fill="#efe9dd" />
          <circle cx="96.1" cy="38.4" r="1.35" fill={`url(#${id('iris')})`} />
          <circle cx="103.9" cy="38.4" r="1.35" fill={`url(#${id('iris')})`} />
          <circle cx="96.1" cy="38.4" r="1.35" fill="none" stroke={darken(eye, 0.55)} strokeWidth="0.35" opacity="0.85" />
          <circle cx="103.9" cy="38.4" r="1.35" fill="none" stroke={darken(eye, 0.55)} strokeWidth="0.35" opacity="0.85" />
          <circle cx="96.1" cy="38.55" r="0.6" fill="#140c04" />
          <circle cx="103.9" cy="38.55" r="0.6" fill="#140c04" />
          <circle cx="96.55" cy="37.9" r="0.38" fill="#fff" />
          <circle cx="104.35" cy="37.9" r="0.38" fill="#fff" />
          {/* lash line + crease + outer flick (lashes on female) */}
          <path d="M93.8,38.3 Q96,36.6 98.2,38.2" fill="none" stroke={sk.occ} strokeWidth="0.75" opacity="0.8" strokeLinecap="round" />
          <path d="M101.8,38.2 Q104,36.6 106.2,38.3" fill="none" stroke={sk.occ} strokeWidth="0.75" opacity="0.8" strokeLinecap="round" />
          <path d="M94,37.4 Q96,36 98,37.2" fill="none" stroke={sk.deep} strokeWidth="0.5" opacity="0.5" strokeLinecap="round" />
          <path d="M102,37.2 Q104,36 106,37.4" fill="none" stroke={sk.deep} strokeWidth="0.5" opacity="0.5" strokeLinecap="round" />
          <path d="M93.9,38.2 l-0.8,-0.4 M106.1,38.2 l0.8,-0.4" stroke={sk.occ} strokeWidth="0.6" opacity="0.85" strokeLinecap="round" />
          {v.lips && <path d="M94.2,37.7 l-0.5,-0.7 M105.8,37.7 l0.5,-0.7 M95.2,37.2 l-0.4,-0.7 M104.8,37.2 l0.4,-0.7" stroke={sk.occ} strokeWidth="0.45" opacity="0.9" strokeLinecap="round" />}
          {/* lower waterline */}
          <path d="M94.4,39.3 Q96,40.3 97.7,39.4" fill="none" stroke={sk.spec} strokeWidth="0.45" opacity="0.6" strokeLinecap="round" />
          <path d="M102.3,39.4 Q104,40.3 105.6,39.3" fill="none" stroke={sk.spec} strokeWidth="0.45" opacity="0.6" strokeLinecap="round" />
        </g>

        {/* nose: bridge light, tip, alar wings, nostrils */}
        <path d="M99.6,36.5 C99.4,40 99,43 98.7,44.6" fill="none" stroke={sk.key} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
        <path d="M100.5,40 C100.7,42.4 101,44 101.3,45" fill="none" stroke={sk.deep} strokeWidth="0.7" opacity="0.4" strokeLinecap="round" />
        <ellipse cx="100" cy="45.4" rx="1.7" ry="1.2" fill={sk.core} opacity="0.5" />
        <ellipse cx="99.5" cy="44.9" rx="0.75" ry="0.55" fill={sk.spec} opacity="0.7" />
        <path d="M97.9,45.1 a1.1,1.1 0 0 0 0.8,1.1 M102.1,45.1 a1.1,1.1 0 0 1 -0.8,1.1" fill="none" stroke={sk.deep} strokeWidth="0.6" opacity="0.6" strokeLinecap="round" />
        <ellipse cx="98.9" cy="46.1" rx="0.42" ry="0.3" fill={sk.occ} opacity="0.75" />
        <ellipse cx="101.1" cy="46.1" rx="0.42" ry="0.3" fill={sk.occ} opacity="0.75" />
        <path d="M98.4,47.2 Q100,47.8 101.6,47.2" fill="none" stroke={sk.deep} strokeWidth="0.6" opacity="0.4" strokeLinecap="round" filter={`url(#${id('soft1')})`} />

        {/* cheeks: subsurface blush */}
        <ellipse cx="93.4" cy="44.4" rx="2.4" ry="1.7" fill={blush} opacity="0.22" filter={`url(#${id('soft1')})`} />
        <ellipse cx="106.6" cy="44.4" rx="2.4" ry="1.7" fill={blush} opacity="0.22" filter={`url(#${id('soft1')})`} />

        {/* mouth: philtrum + lips */}
        <path d="M99.4,47.3 L99.4,48.4 M100.6,47.3 L100.6,48.4" stroke={sk.deep} strokeWidth="0.4" opacity="0.45" strokeLinecap="round" />
        {v.lips ? (
          <>
            <path d="M96.8,49 Q98.4,48 100,48.8 Q101.6,48 103.2,49 Q101.6,49.8 100,49.7 Q98.4,49.8 96.8,49 Z" fill={darken(v.lips, 0.25)} />
            <path d="M97.2,49.5 Q100,51.4 102.8,49.5 Q101.6,51.2 100,51.2 Q98.4,51.2 97.2,49.5 Z" fill={v.lips} />
            <ellipse cx="99.4" cy="50.3" rx="1" ry="0.45" fill={lighten(v.lips, 0.45)} opacity="0.8" />
            <path d="M96.8,49.1 Q100,50 103.2,49.1" fill="none" stroke={darken(v.lips, 0.55)} strokeWidth="0.5" opacity="0.85" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M97,49.2 Q100,50.6 103,49.2" fill="none" stroke={darken(v.skin, 0.5)} strokeWidth="0.95" strokeLinecap="round" />
            <path d="M97.6,50.8 Q100,51.8 102.4,50.8" fill="none" stroke={sk.key} strokeWidth="0.6" opacity="0.5" strokeLinecap="round" />
            <path d="M96.8,49.1 l-0.6,0.3 M103.2,49.1 l0.6,0.3" stroke={sk.deep} strokeWidth="0.5" opacity="0.5" strokeLinecap="round" />
          </>
        )}
        <ellipse cx="100" cy="52" rx="1.3" ry="0.6" fill={sk.key} opacity="0.35" filter={`url(#${id('soft1')})`} />

        {/* ── HAIR ── */}
        {v.long ? (
          <>
            {/* center-part curtains framing the face */}
            <path d="M100,24.4 C92,24.4 87.6,30 88.2,38 C88.6,33 92,29.6 95,29.2 C93,31.6 92.6,34 93,35.6 C95,31.4 99,30 100,30 C101,30 105,31.4 107,35.6 C107.4,34 107,31.6 105,29.2 C108,29.6 111.4,33 111.8,38 C112.4,30 108,24.4 100,24.4 Z"
              fill={`url(#${id('hair')})`} />
            <path d="M88.2,36 C86.6,44 87,54 89.4,62 C90.8,57 90.4,46 91.4,39.4 Z" fill={`url(#${id('hair')})`} />
            <path d="M111.8,36 C113.4,44 113,54 110.6,62 C109.2,57 109.6,46 108.6,39.4 Z" fill={`url(#${id('hair')})`} />
            {/* sheen band + strands + flyaways */}
            <path d="M91.4,28.6 C95,26 105,26 108.6,28.6" fill="none" stroke={hr.spec} strokeWidth="1.2" opacity="0.3" strokeLinecap="round" filter={`url(#${id('soft1')})`} />
            <path d="M93.4,27.4 C96.6,25.6 103.4,25.6 106.6,27.4" fill="none" stroke={hr.key} strokeWidth="0.9" opacity="0.55" strokeLinecap="round" />
            <path d="M89.4,40 C88.6,48 89,55 90.2,60 M110.6,40 C111.4,48 111,55 109.8,60" fill="none" stroke={hr.key} strokeWidth="0.7" opacity="0.4" strokeLinecap="round" />
            <path d="M96,30.4 C94.4,32.4 93.8,34.4 93.8,35.4 M104,30.4 C105.6,32.4 106.2,34.4 106.2,35.4" fill="none" stroke={hr.deep} strokeWidth="0.6" opacity="0.5" strokeLinecap="round" />
            <path d="M89,32 C88,30.6 87.6,29 87.8,27.6 M111,32 C112,30.6 112.4,29 112.2,27.6" fill="none" stroke={hr.core} strokeWidth="0.5" opacity="0.6" strokeLinecap="round" />
            <path d="M92.4,30.4 C94.8,28 105.2,28 107.6,30.4" fill="none" stroke={sk.deep} strokeWidth="1" opacity="0.3" strokeLinecap="round" filter={`url(#${id('soft1')})`} />
          </>
        ) : (
          <>
            {/* short crop: hairline arcs over the temples */}
            <path d="M100,24.6 C91.6,24.6 88.4,30.4 89,37.2 C90,32.4 91.6,30 94,29 C93,30.8 92.8,32.4 93.2,33.6 C94.8,30.4 97.6,29.2 100,29.2 C102.4,29.2 105.2,30.4 106.8,33.6 C107.2,32.4 107,30.8 106,29 C108.4,30 110,32.4 111,37.2 C111.6,30.4 108.4,24.6 100,24.6 Z"
              fill={`url(#${id('hair')})`} />
            <path d="M89,36.4 C88.8,38 88.9,39.4 89.2,40.6 C89.8,38.8 90,37.4 90,36.2 Z" fill={`url(#${id('hair')})`} />
            <path d="M111,36.4 C111.2,38 111.1,39.4 110.8,40.6 C110.2,38.8 110,37.4 110,36.2 Z" fill={`url(#${id('hair')})`} />
            {/* sheen + strands + sideburns */}
            <path d="M92,27.8 C95.4,25.6 104.6,25.6 108,27.8" fill="none" stroke={hr.spec} strokeWidth="1.5" opacity="0.45" strokeLinecap="round" filter={`url(#${id('soft1')})`} />
            <path d="M93.6,26.8 C96.6,25.2 103.4,25.2 106.4,26.8" fill="none" stroke={hr.key} strokeWidth="0.8" opacity="0.55" strokeLinecap="round" />
            <path d="M95.4,29.4 C94.2,30.8 93.6,32.2 93.6,33.2 M104.6,29.4 C105.8,30.8 106.4,32.2 106.4,33.2" fill="none" stroke={hr.deep} strokeWidth="0.55" opacity="0.5" strokeLinecap="round" />
            <path d="M89.6,39 L89.6,42.4 M110.4,39 L110.4,42.4" stroke={hr.deep} strokeWidth="1.1" opacity="0.7" strokeLinecap="round" />
            <path d="M92.8,29.8 C95.2,27.8 104.8,27.8 107.2,29.8" fill="none" stroke={sk.deep} strokeWidth="0.9" opacity="0.3" strokeLinecap="round" filter={`url(#${id('soft1')})`} />
          </>
        )}

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
