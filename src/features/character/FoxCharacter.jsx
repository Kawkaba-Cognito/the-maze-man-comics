import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten } from './shade';

// Where each gear slot attaches on the fox (its own 0..200 viewBox).
const ANCHORS = {
  hat: { x: 100, y: 34, s: 1.0 },
  face: { x: 100, y: 79, s: 0.95 },
  neck: { x: 100, y: 122, s: 1.0 },
  back: { x: 100, y: 150, s: 1.15 },
};

/**
 * FoxCharacter — the Maze Man guide fox, professional vector build.
 * Technique: a gradient-shaded base for volume, ambient-occlusion shadow
 * shapes, a warm back-lit rim light, glossy speculars, and glowing eyes with a
 * hot core. Fully recolorable (the shading ramp is derived from `fur`).
 *
 * Props: size, fur, accent (gold trim/eye), mood, hat, neck, glow, float.
 */
const MOOD_EYE = {
  ready: '#ffc24a',
  focused: '#9be85a',
  proud: '#ffe07a',
  tired: '#d8a85a',
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
  const eyeCore = lighten(eye, 0.65);

  const width = size;
  const height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur };

  return (
    <div className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 200 240" width={width} height={height} role="img"
        aria-label="fox character" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={id('fur')} x1="0.2" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor={f.key} />
            <stop offset="42%" stopColor={f.core} />
            <stop offset="100%" stopColor={f.deep} />
          </linearGradient>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <radialGradient id={id('eye')} cx="50%" cy="42%" r="62%">
            <stop offset="0%" stopColor={eyeCore} />
            <stop offset="55%" stopColor={eye} />
            <stop offset="100%" stopColor={g.lo} />
          </radialGradient>
          <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={id('eglow')} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {glow && <ellipse cx="100" cy="120" rx="92" ry="108" fill={eye} opacity="0.07" />}
        <ellipse cx="100" cy="223" rx="58" ry="11" fill="#000" opacity="0.42" />

        {/* equipped gear behind the body (cape / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* ── TAIL (behind) — bushy, scalloped fur, flame-tip ── */}
        <path d="M138,178 C162,186 184,180 194,160 C188,166 180,166 176,160 C188,150 192,130 188,112 C184,150 168,170 150,170 C158,162 162,150 160,140 C152,160 140,170 132,166 C140,176 138,178 138,178 Z" fill={`url(#${id('fur')})`} />
        {/* tail fur grooves (shadow) + strands (light) */}
        <path d="M176,118 C172,142 160,160 144,166" fill="none" stroke={f.occ} strokeWidth="2" opacity="0.45" strokeLinecap="round" />
        <path d="M184,124 C181,144 172,158 160,166" fill="none" stroke={f.key} strokeWidth="1.6" opacity="0.4" strokeLinecap="round" />
        {/* gold flame tip */}
        <path d="M188,112 C196,120 198,136 192,150 C190,158 184,162 178,160 C186,150 186,134 180,120 C182,112 186,110 188,112 Z" fill={`url(#${id('gold')})`} />
        <path d="M180,120 C186,134 186,150 178,160" fill="none" stroke={g.lo} strokeWidth="1.2" opacity="0.5" />

        {/* ── BODY (sitting) ── */}
        <path d="M100,116 C74,118 60,140 58,168 C56,197 70,215 100,215 C130,215 144,197 142,168 C140,140 126,118 100,116 Z" fill={`url(#${id('fur')})`} />
        {/* haunch fur direction strokes */}
        <path d="M66,150 C64,168 68,186 78,198" fill="none" stroke={f.occ} strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />
        <path d="M134,150 C136,168 132,186 122,198" fill="none" stroke={f.occ} strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />
        {/* occlusion: under chin onto chest, between legs */}
        <path d="M80,122 Q100,140 120,122 Q116,154 100,158 Q84,154 80,122 Z" fill={f.occ} opacity="0.45" filter={`url(#${id('soft')})`} />
        <path d="M97,150 L100,210 L103,150 Z" fill={f.occ} opacity="0.7" />
        {/* fluffy chest mane (lighter fur with tuft edge) */}
        <path d="M100,120 C90,124 86,138 88,154 C92,150 96,162 100,166 C104,162 108,150 112,154 C114,138 110,124 100,120 Z" fill={f.key} opacity="0.3" filter={`url(#${id('soft')})`} />
        <path d="M88,150 l3,7 3,-5 3,7 3,-7 3,6 3,-6" fill="none" stroke={f.key} strokeWidth="1.4" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* front paws + toes */}
        <ellipse cx="84" cy="208" rx="13" ry="9" fill={`url(#${id('fur')})`} />
        <ellipse cx="116" cy="208" rx="13" ry="9" fill={`url(#${id('fur')})`} />
        <path d="M80,205 L80,210 M84,206 L84,211 M88,205 L88,210" stroke={f.occ} strokeWidth="1.4" opacity="0.65" strokeLinecap="round" />
        <path d="M112,205 L112,210 M116,206 L116,211 M120,205 L120,210" stroke={f.occ} strokeWidth="1.4" opacity="0.65" strokeLinecap="round" />
        <ellipse cx="80" cy="205" rx="6" ry="3" fill={f.key} opacity="0.18" />
        <ellipse cx="112" cy="205" rx="6" ry="3" fill={f.key} opacity="0.18" />
        {/* rim light (warm back-light) + speculars */}
        <path d="M142,168 C144,150 138,132 126,122" fill="none" stroke={g.hi} strokeWidth="2.2" opacity="0.4" strokeLinecap="round" />
        <ellipse cx="122" cy="180" rx="11" ry="18" fill={f.spec} opacity="0.12" filter={`url(#${id('soft')})`} />

        {/* chest collar (gold ornament) with gem */}
        <path d="M78,126 Q100,144 122,126 L119,135 Q100,152 81,135 Z" fill={`url(#${id('gold')})`} />
        <path d="M100,138 L110,150 L100,164 L90,150 Z" fill={`url(#${id('gold')})`} />
        <path d="M100,144 L106,150 L100,158 L94,150 Z" fill={eye} opacity="0.9" />
        <path d="M100,146 L103,150 L100,155 L97,150 Z" fill={eyeCore} opacity="0.8" />

        {/* ── HEAD ── */}
        {/* ears: outer fur, gold inner, dark canal, fur tuft */}
        <path d="M58,18 L77,64 L95,48 Z" fill={`url(#${id('fur')})`} />
        <path d="M142,18 L123,64 L105,48 Z" fill={`url(#${id('fur')})`} />
        <path d="M65,27 L79,58 L89,49 Z" fill={`url(#${id('gold')})`} />
        <path d="M135,27 L121,58 L111,49 Z" fill={`url(#${id('gold')})`} />
        <path d="M70,33 L80,55 L85,50 Z" fill={f.occ} opacity="0.55" />
        <path d="M130,33 L120,55 L115,50 Z" fill={f.occ} opacity="0.55" />
        <path d="M64,24 l2,7 3,-4 2,7" fill="none" stroke={f.key} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <path d="M136,24 l-2,7 -3,-4 -2,7" fill="none" stroke={f.key} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        {/* head */}
        <path d="M100,42 C122,42 140,56 142,76 C143,90 134,101 120,107 C113,117 108,118 100,120 C92,118 87,117 80,107 C66,101 57,90 58,76 C60,56 78,42 100,42 Z" fill={`url(#${id('fur')})`} />
        {/* multi-tuft cheek ruff */}
        <path d="M62,84 L44,92 L58,96 L43,102 L60,104 L50,112 L68,106 Z" fill={`url(#${id('fur')})`} />
        <path d="M138,84 L156,92 L142,96 L157,102 L140,104 L150,112 L132,106 Z" fill={`url(#${id('fur')})`} />
        <path d="M58,96 L48,99 M60,104 L52,108" stroke={f.occ} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        <path d="M142,96 L152,99 M140,104 L148,108" stroke={f.occ} strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
        {/* muzzle / bridge shadow */}
        <path d="M88,98 Q100,110 112,98 Q100,122 88,98 Z" fill={f.deep} opacity="0.5" filter={`url(#${id('soft')})`} />
        {/* head speculars + rim */}
        <ellipse cx="100" cy="58" rx="16" ry="9" fill={f.spec} opacity="0.22" filter={`url(#${id('soft')})`} />
        <path d="M142,76 C143,90 134,101 120,107" fill="none" stroke={g.hi} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
        {/* ornate forehead gem */}
        <circle cx="100" cy="47" r="2.2" fill={`url(#${id('gold')})`} />
        <path d="M100,50 L106,60 L100,73 L94,60 Z" fill={`url(#${id('gold')})`} />
        <path d="M100,55 L102.5,60 L100,68 L97.5,60 Z" fill={f.occ} opacity="0.4" />
        {/* brow tufts */}
        <path d="M72,70 l8,-2 -5,4 Z" fill={f.key} opacity="0.5" />
        <path d="M128,70 l-8,-2 5,4 Z" fill={f.key} opacity="0.5" />
        {/* nose — heart snout + philtrum + mouth */}
        <path d="M100,117 C96,117 92.5,114 92.5,111 C92.5,109.5 95,109 100,109 C105,109 107.5,109.5 107.5,111 C107.5,114 104,117 100,117 Z" fill={f.occ} />
        <ellipse cx="97" cy="111.5" rx="1.7" ry="1.1" fill={f.spec} opacity="0.55" />
        <path d="M100,117 L100,123" stroke={f.occ} strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        <path d="M100,123 Q94,127 90,124 M100,123 Q106,127 110,124" fill="none" stroke={f.occ} strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />

        {/* EYES — almond socket, glow, slit pupil, lid */}
        <path d="M70,80 Q84,66 100,77 Q86,92 70,80 Z" fill={f.occ} />
        <path d="M130,80 Q116,66 100,77 Q114,92 130,80 Z" fill={f.occ} />
        <g filter={glow ? `url(#${id('eglow')})` : undefined}>
          <path d="M73,80 Q84,69 98,78 Q86,89 73,80 Z" fill={`url(#${id('eye')})`} />
          <path d="M127,80 Q116,69 102,78 Q114,89 127,80 Z" fill={`url(#${id('eye')})`} />
        </g>
        <ellipse cx="86" cy="80" rx="1.7" ry="4.2" fill="#1a0f02" opacity="0.9" />
        <ellipse cx="114" cy="80" rx="1.7" ry="4.2" fill="#1a0f02" opacity="0.9" />
        <path d="M74,78 Q84,71 97,77" fill="none" stroke={f.occ} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
        <path d="M126,78 Q116,71 103,77" fill="none" stroke={f.occ} strokeWidth="2" opacity="0.7" strokeLinecap="round" />
        <circle cx="83" cy="76.5" r="1.4" fill={eyeCore} />
        <circle cx="111" cy="76.5" r="1.4" fill={eyeCore} />

        {/* whiskers */}
        <path d="M88,113 Q70,110 56,108 M88,116 Q70,116 54,118 M88,119 Q72,122 58,127" fill="none" stroke={f.spec} strokeWidth="0.9" opacity="0.45" strokeLinecap="round" />
        <path d="M112,113 Q130,110 144,108 M112,116 Q130,116 146,118 M112,119 Q128,122 142,127" fill="none" stroke={f.spec} strokeWidth="0.9" opacity="0.45" strokeLinecap="round" />

        {/* ── EQUIPPED GEAR (front) ── */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
