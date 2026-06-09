import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, darken } from './shade';

// Where each gear slot attaches on a person (its own 0..200 viewBox).
const ANCHORS = {
  hat: { x: 100, y: 25, s: 0.95 },
  face: { x: 100, y: 52, s: 0.82 },
  neck: { x: 100, y: 84, s: 0.9 },
  back: { x: 100, y: 92, s: 1.0 },
};

/**
 * PersonCharacter — Maze Man / Maze Woman as stylized 3D-look heroes.
 * Built in SVG with volumetric shading (radial skin gradients, form-shadow
 * shapes, rim light) so they read as rounded figures, not flat icons.
 * Black + gold "guardian" attire ties them to the fox and the chamber.
 *
 *   variant 'male'   — broader shoulders, pauldrons, trousers
 *   variant 'female' — cinched waist, skirt, long hair
 */
const VARIANTS = {
  male: {
    skin: '#c68a5e', hair: '#1d160f', lips: null, long: false,
    shHalf: 36, waistHalf: 23, hipHalf: 22, pauldrons: true, skirt: false,
  },
  female: {
    skin: '#dba078', hair: '#171320', lips: '#b56a66', long: true,
    shHalf: 29, waistHalf: 18, hipHalf: 25, pauldrons: false, skirt: true,
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
  const eye = '#ffb648';

  const cx = 100;
  const shHalf = v.shHalf, waistHalf = v.waistHalf, hipHalf = v.hipHalf;
  const waistY = 134, hipY = 151;
  const ax = cx - shHalf + 2;   // left arm anchor
  const bx = cx + shHalf - 2;   // right arm anchor
  const legTop = v.skirt ? 170 : hipY;

  const torso =
    `M${cx - shHalf},90 ` +
    `C${cx - shHalf - 3},100 ${cx - waistHalf - 3},122 ${cx - waistHalf},${waistY} ` +
    `C${cx - waistHalf},142 ${cx - hipHalf},145 ${cx - hipHalf},${hipY} ` +
    `L${cx + hipHalf},${hipY} ` +
    `C${cx + hipHalf},145 ${cx + waistHalf},142 ${cx + waistHalf},${waistY} ` +
    `C${cx + waistHalf + 3},122 ${cx + shHalf + 3},100 ${cx + shHalf},90 ` +
    `C${cx + shHalf - 6},86 ${cx + 12},84 ${cx + 10},84 ` +
    `L${cx - 10},84 C${cx - 12},84 ${cx - shHalf + 6},86 ${cx - shHalf},90 Z`;

  const arm = (x, dir) =>
    `M${x},92 C${x + dir * 6},106 ${x + dir * 4},128 ${x + dir * 1},140 ` +
    `C${x},144 ${x - dir * 7},144 ${x - dir * 8},140 ` +
    `C${x - dir * 10},126 ${x - dir * 11},104 ${x - dir * 10},96 Z`;

  const leg = (lx) =>
    `M${lx - 5},${legTop} C${lx - 6},${legTop + 22} ${lx - 6},204 ${lx - 5},212 ` +
    `C${lx - 5},216 ${lx + 5},216 ${lx + 5},212 C${lx + 6},204 ${lx + 6},${legTop + 22} ${lx + 5},${legTop} Z`;

  const width = size, height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur: cloth };

  return (
    <div className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 200 240" width={width} height={height} role="img"
        aria-label={`${variant} character`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id={id('skin')} cx="42%" cy="35%" r="70%">
            <stop offset="0%" stopColor={sk.key} />
            <stop offset="60%" stopColor={sk.core} />
            <stop offset="100%" stopColor={sk.deep} />
          </radialGradient>
          <linearGradient id={id('cloth')} x1="0.2" y1="0" x2="0.7" y2="1">
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
          <radialGradient id={id('iris')} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={lighten(eye, 0.5)} />
            <stop offset="100%" stopColor={darken(eye, 0.35)} />
          </radialGradient>
          <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>

        {glow && <ellipse cx="100" cy="120" rx="74" ry="104" fill={eye} opacity="0.05" />}
        <ellipse cx="100" cy="220" rx="40" ry="9" fill="#000" opacity="0.42" />

        {/* equipped gear behind the body (cape / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* back hair (female) */}
        {v.long && (
          <path d="M74,44 C64,26 80,12 100,12 C120,12 136,26 126,44 C136,74 134,124 123,156 L77,156 C66,124 64,74 74,44 Z"
            fill={`url(#${id('hair')})`} />
        )}

        {/* legs */}
        <path d={leg(91)} fill={`url(#${id('cloth')})`} />
        <path d={leg(109)} fill={`url(#${id('cloth')})`} />
        <path d={`M${91 - 1},152 L${91 - 1},210`} stroke={cl.deep} strokeWidth="0" />
        {/* boots */}
        <path d="M84,210 C84,206 98,206 98,210 L98,216 C98,219 84,219 84,216 Z" fill={cl.deep} />
        <path d="M102,210 C102,206 116,206 116,210 L116,216 C116,219 102,219 102,216 Z" fill={cl.deep} />
        <path d="M84,214 L98,214 M102,214 L116,214" stroke={accent} strokeWidth="1.5" opacity="0.6" />

        {/* arms (long sleeves) + gold cuffs + hands */}
        <path d={arm(ax, 1)} fill={`url(#${id('cloth')})`} />
        <path d={arm(bx, -1)} fill={`url(#${id('cloth')})`} />
        <rect x={ax - 4.5} y="138" width="10" height="4.5" rx="2" fill={`url(#${id('gold')})`} />
        <rect x={bx - 5.5} y="138" width="10" height="4.5" rx="2" fill={`url(#${id('gold')})`} />
        <ellipse cx={ax + 1} cy="147" rx="4.2" ry="5" fill={`url(#${id('skin')})`} />
        <ellipse cx={ax + 4.5} cy="144" rx="1.6" ry="2.4" fill={`url(#${id('skin')})`} />
        <ellipse cx={bx - 1} cy="147" rx="4.2" ry="5" fill={`url(#${id('skin')})`} />
        <ellipse cx={bx - 4.5} cy="144" rx="1.6" ry="2.4" fill={`url(#${id('skin')})`} />

        {/* torso outfit */}
        <path d={torso} fill={`url(#${id('cloth')})`} />
        {/* skirt (female) */}
        {v.skirt && (
          <path d="M82,132 C74,148 70,166 70,172 C70,176 130,176 130,172 C130,166 126,148 118,132 Z"
            fill={`url(#${id('cloth')})`} />
        )}
        {/* V-neck skin + gold trim */}
        <path d="M93,85 L100,103 L107,85 Z" fill={`url(#${id('skin')})`} />
        <path d="M92,85 L100,104 L108,85" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="2" />
        {/* center seam + form shadow */}
        <path d={`M100,104 L100,${waistY}`} stroke={cl.deep} strokeWidth="2" opacity="0.5" />
        <path d="M78,96 C82,112 84,124 84,134" fill="none" stroke={cl.deep} strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
        <path d="M122,96 C118,112 116,124 116,134" fill="none" stroke={cl.deep} strokeWidth="2.5" opacity="0.4" strokeLinecap="round" />
        {/* cloth sheen (key light) */}
        <ellipse cx="87" cy="106" rx="7" ry="15" fill={cl.key} opacity="0.22" filter={`url(#${id('soft')})`} />
        {/* rim light on right */}
        <path d={`M${cx + shHalf},90 C${cx + shHalf + 3},100 ${cx + waistHalf + 3},122 ${cx + waistHalf},${waistY}`}
          fill="none" stroke={g.hi} strokeWidth="2" opacity="0.35" strokeLinecap="round" />
        {/* female brooch at collar */}
        {v.skirt && <path d="M100,90 L103,94 L100,99 L97,94 Z" fill={`url(#${id('gold')})`} />}
        {/* belt + buckle gem */}
        <rect x={cx - waistHalf - 1} y={waistY - 3} width={(waistHalf + 1) * 2} height="7" rx="2" fill={`url(#${id('gold')})`} />
        <rect x={cx - 4} y={waistY - 4} width="8" height="9" rx="2" fill={darken(accent, 0.25)} />
        <circle cx={cx} cy={waistY + 0.5} r="1.6" fill={g.hi} opacity="0.8" />
        {/* pauldrons (male) + highlight */}
        {v.pauldrons && (
          <>
            <ellipse cx={cx - shHalf + 3} cy="91" rx="10" ry="8" fill={`url(#${id('gold')})`} />
            <ellipse cx={cx + shHalf - 3} cy="91" rx="10" ry="8" fill={`url(#${id('gold')})`} />
            <ellipse cx={cx - shHalf} cy="88" rx="3.5" ry="2.2" fill={g.hi} opacity="0.7" />
            <ellipse cx={cx + shHalf - 6} cy="88" rx="3.5" ry="2.2" fill={g.hi} opacity="0.7" />
          </>
        )}

        {/* neck */}
        <path d="M93,67 C93,76 93,82 95,84 L105,84 C107,82 107,76 107,67 Z" fill={`url(#${id('skin')})`} />
        <path d="M93,80 C96,84 104,84 107,80 L107,84 L93,84 Z" fill={sk.deep} opacity="0.5" />

        {/* head */}
        <ellipse cx="80.5" cy="50" rx="4.5" ry="6" fill={`url(#${id('skin')})`} />
        <ellipse cx="119.5" cy="50" rx="4.5" ry="6" fill={`url(#${id('skin')})`} />
        <path d="M100,25 C112,25 120,35 120,48 C120,58 116,66 108,70 C105,72 103,73 100,73 C97,73 95,72 92,70 C84,66 80,58 80,48 C80,35 88,25 100,25 Z"
          fill={`url(#${id('skin')})`} />
        {/* jaw / cheek form shadow */}
        <path d="M108,56 C112,62 108,69 100,72 C104,69 106,63 105,57 Z" fill={sk.deep} opacity="0.45" filter={`url(#${id('soft')})`} />
        <ellipse cx="90" cy="42" rx="10" ry="8" fill={sk.key} opacity="0.4" filter={`url(#${id('soft')})`} />

        {/* brows */}
        <path d="M86,46 Q91,43.8 96,46" fill="none" stroke={hr.deep} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M104,46 Q109,43.8 114,46" fill="none" stroke={hr.deep} strokeWidth="1.8" strokeLinecap="round" />
        {/* eyes */}
        <path d="M87,52 Q91,48.8 95,52 Q91,54.8 87,52 Z" fill="#f4efe6" />
        <path d="M105,52 Q109,48.8 113,52 Q109,54.8 105,52 Z" fill="#f4efe6" />
        <circle cx="91" cy="52" r="2.4" fill={`url(#${id('iris')})`} />
        <circle cx="109" cy="52" r="2.4" fill={`url(#${id('iris')})`} />
        <circle cx="91" cy="52.2" r="1.1" fill="#1a0f02" />
        <circle cx="109" cy="52.2" r="1.1" fill="#1a0f02" />
        <circle cx="91.9" cy="51" r="0.7" fill="#fff" />
        <circle cx="109.9" cy="51" r="0.7" fill="#fff" />
        <path d="M87,51.4 Q91,48.4 95,51.4" fill="none" stroke={sk.deep} strokeWidth="1" opacity="0.55" strokeLinecap="round" />
        <path d="M105,51.4 Q109,48.4 113,51.4" fill="none" stroke={sk.deep} strokeWidth="1" opacity="0.55" strokeLinecap="round" />
        {/* nose */}
        <path d="M99.5,53 C98.7,58 97.5,60.5 99.5,62.5" fill="none" stroke={sk.deep} strokeWidth="1.3" opacity="0.4" strokeLinecap="round" />
        <ellipse cx="101" cy="62" rx="2.2" ry="1.4" fill={sk.key} opacity="0.35" />
        {/* cheeks (subtle warmth) */}
        <ellipse cx="86" cy="60" rx="4" ry="3" fill={v.lips || '#c2745a'} opacity="0.12" />
        <ellipse cx="114" cy="60" rx="4" ry="3" fill={v.lips || '#c2745a'} opacity="0.12" />
        {/* mouth */}
        {v.lips ? (
          <path d="M95,66 Q100,64.2 105,66 Q100,69.5 95,66 Z" fill={v.lips} opacity="0.85" />
        ) : (
          <path d="M95.5,66 Q100,68.2 104.5,66" fill="none" stroke={darken(v.skin, 0.4)} strokeWidth="1.5" strokeLinecap="round" />
        )}

        {/* front hair */}
        {v.long ? (
          <>
            <path d="M79,48 C77,30 90,23 100,23 C110,23 123,30 121,48 C117,38 110,35 105,40 C108,32 92,32 95,40 C90,35 83,38 79,48 Z"
              fill={`url(#${id('hair')})`} />
            <path d="M79,47 C74,66 75,96 80,120 C82,108 81,80 84,58 Z" fill={`url(#${id('hair')})`} />
            <path d="M121,47 C126,66 125,96 120,120 C118,108 119,80 116,58 Z" fill={`url(#${id('hair')})`} />
            <path d="M88,30 C96,26 104,26 112,30" fill="none" stroke={hr.key} strokeWidth="1.6" opacity="0.5" />
            <path d="M82,54 C80,78 81,100 83,118 M118,54 C120,78 119,100 117,118" fill="none" stroke={hr.key} strokeWidth="1" opacity="0.35" strokeLinecap="round" />
            <path d="M90,34 C86,46 85,62 86,78" fill="none" stroke={hr.deep} strokeWidth="1" opacity="0.4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M79,49 C77,29 90,22 100,22 C110,22 123,29 121,49 C117,39 111,36 106,38 C108,33 92,33 94,38 C89,36 83,39 79,49 Z"
              fill={`url(#${id('hair')})`} />
            <path d="M88,28 C96,24 104,24 112,28" fill="none" stroke={hr.key} strokeWidth="1.6" opacity="0.5" />
            <path d="M84,33 C88,29 94,28 99,28 M101,28 C106,28 112,30 116,34" fill="none" stroke={hr.key} strokeWidth="0.9" opacity="0.4" strokeLinecap="round" />
          </>
        )}

        {/* equipped gear in front (hat / face / neck) */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
