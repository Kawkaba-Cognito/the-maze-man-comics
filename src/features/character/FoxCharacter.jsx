import React, { useId } from 'react';
import { equipped2d } from './items';
import { ramp, metal, lighten, mix } from './shade';

// Where each gear slot attaches on the fox (its own 0..200 viewBox).
const ANCHORS = {
  hat: { x: 100, y: 52, s: 0.95 },
  face: { x: 100, y: 82, s: 0.85 },
  neck: { x: 100, y: 128, s: 0.95 },
  back: { x: 100, y: 152, s: 1.1 },
};

/**
 * FoxCharacter — the Maze Man guide fox, drawn with REAL fox anatomy:
 * tall triangular ears, slender wedge muzzle, deep chest with a ruff,
 * straight close-set forelegs, rounded haunch, and the brush tail wrapped
 * around the front paws. Painterly shading: volumetric radial gradients,
 * warm key / cool ground-bounce / gold rim, fur tufts and directional
 * strokes, anatomical amber eyes. Recolorable via `fur` + `accent`.
 */
const MOOD_EYE = {
  ready: '#ffc24a',
  focused: '#9be85a',
  proud: '#ffe07a',
  tired: '#d8a85a',
};

/** Short directional fur flicks along an arc (deterministic, no RNG). */
function furArc({ cx, cy, rx, ry, from, to, n, len, color, opacity, sweep = 0.22, w = 1.1 }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = from + ((to - from) * i) / (n - 1);
    const x = cx + Math.cos(t) * rx;
    const y = cy + Math.sin(t) * ry;
    const a = t + Math.PI / 2 + sweep;
    const x2 = x + Math.cos(a) * len * (0.8 + 0.4 * ((i * 7) % 3) / 2);
    const y2 = y + Math.sin(a) * len * (0.8 + 0.4 * ((i * 5) % 3) / 2);
    out.push(<path key={`fa${cx}-${cy}-${i}`} d={`M${x.toFixed(1)},${y.toFixed(1)} Q${((x + x2) / 2 + 1).toFixed(1)},${((y + y2) / 2).toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`}
      fill="none" stroke={color} strokeWidth={w} opacity={opacity} strokeLinecap="round" />);
  }
  return out;
}

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
  const bounce = mix(fur, '#5a6f9e', 0.5); // cool sky/ground bounce
  const warm = mix(fur, accent, 0.32);     // warm terminator band

  const width = size;
  const height = size * 1.2;
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur };

  return (
    <div className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg viewBox="0 0 200 240" width={width} height={height} role="img"
        aria-label="fox character" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <radialGradient id={id('furB')} cx="36%" cy="28%" r="90%">
            <stop offset="0%" stopColor={f.spec} />
            <stop offset="22%" stopColor={f.key} />
            <stop offset="52%" stopColor={f.core} />
            <stop offset="82%" stopColor={f.deep} />
            <stop offset="100%" stopColor={f.occ} />
          </radialGradient>
          <radialGradient id={id('furH')} cx="44%" cy="34%" r="78%">
            <stop offset="0%" stopColor={f.spec} />
            <stop offset="28%" stopColor={f.key} />
            <stop offset="60%" stopColor={f.core} />
            <stop offset="100%" stopColor={f.deep} />
          </radialGradient>
          <linearGradient id={id('furT')} x1="0" y1="0" x2="0.9" y2="0.6">
            <stop offset="0%" stopColor={f.key} />
            <stop offset="45%" stopColor={f.core} />
            <stop offset="100%" stopColor={f.occ} />
          </linearGradient>
          <linearGradient id={id('gold')} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor={g.hi} />
            <stop offset="50%" stopColor={g.core} />
            <stop offset="100%" stopColor={g.lo} />
          </linearGradient>
          <radialGradient id={id('eye')} cx="50%" cy="36%" r="68%">
            <stop offset="0%" stopColor={eyeCore} />
            <stop offset="46%" stopColor={eye} />
            <stop offset="86%" stopColor={g.lo} />
            <stop offset="100%" stopColor="#160d02" />
          </radialGradient>
          <filter id={id('soft')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id={id('soft2')} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={id('eglow')} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {glow && <ellipse cx="100" cy="125" rx="90" ry="105" fill={eye} opacity="0.07" />}
        {/* grounded contact shadow */}
        <ellipse cx="100" cy="221" rx="64" ry="12" fill="#000" opacity="0.3" filter={`url(#${id('soft')})`} />
        <ellipse cx="98" cy="220" rx="46" ry="7" fill="#000" opacity="0.4" />

        {/* equipped gear behind the body (cape / balloon) */}
        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        {/* ── HAUNCH + BACK (body mass behind chest) ── */}
        <g className="mmv-breathe">
        {/* back line sweeps from neck over the rump */}
        <path d="M116,108 C138,118 150,142 150,170 C150,196 138,212 116,216 L96,216 C92,200 92,170 96,142 Z"
          fill={`url(#${id('furB')})`} />
        {/* haunch: the folded hind leg reads through the fur */}
        <path d="M148,168 C150,188 142,206 124,212 C138,202 144,186 142,168 C142,156 138,146 130,140 C142,146 147,156 148,168 Z"
          fill={f.occ} opacity="0.45" filter={`url(#${id('soft2')})`} />
        <ellipse cx="130" cy="180" rx="16" ry="22" fill={f.core} opacity="0.4" filter={`url(#${id('soft')})`} />
        {/* warm terminator + cool bounce on the rump */}
        <path d="M146,140 C151,156 152,178 148,196" fill="none" stroke={warm} strokeWidth="5" opacity="0.18" filter={`url(#${id('soft')})`} strokeLinecap="round" />
        <path d="M124,210 C136,206 144,196 147,184" fill="none" stroke={bounce} strokeWidth="3" opacity="0.25" filter={`url(#${id('soft2')})`} strokeLinecap="round" />
        {/* gold rim along the back */}
        <path d="M122,112 C140,124 150,144 150,168" fill="none" stroke={g.hi} strokeWidth="2" opacity="0.45" strokeLinecap="round" />
        {/* fur direction over the haunch */}
        {furArc({ cx: 128, cy: 178, rx: 18, ry: 26, from: -0.6, to: 1.2, n: 8, len: 7, color: f.key, opacity: 0.3, sweep: -0.3 })}
        {furArc({ cx: 126, cy: 182, rx: 22, ry: 28, from: 1.8, to: 2.8, n: 6, len: 7, color: f.occ, opacity: 0.4 })}
        {/* hind paw peeking under the haunch */}
        <ellipse cx="128" cy="212" rx="13" ry="6.5" fill={`url(#${id('furB')})`} />
        <path d="M124,210 L124,214 M128,210 L128,215 M132,210 L132,214" stroke={f.occ} strokeWidth="1.3" opacity="0.6" strokeLinecap="round" />

        {/* ── TAIL — thick brush wrapped around the front paws (idle sway) ── */}
        <g className="mmv-tail">
          {/* brush: rises at the rear, sweeps down and wraps left along the ground */}
          <path d="M138,200 C152,196 158,184 156,170 C166,182 164,200 152,210 C136,222 100,224 74,218 C58,214 52,206 56,200 C62,194 74,192 86,196 C104,202 124,206 138,200 Z"
            fill={`url(#${id('furT')})`} />
          {/* tail top light + underside occlusion */}
          <path d="M150,176 C154,190 146,202 132,207" fill="none" stroke={f.key} strokeWidth="2" opacity="0.4" strokeLinecap="round" />
          <path d="M80,216 C104,221 130,219 146,210" fill="none" stroke={f.occ} strokeWidth="3" opacity="0.5" strokeLinecap="round" filter={`url(#${id('soft2')})`} />
          {/* fur clumps along the brush */}
          <path d="M126,208 l-3,6 6,-2 M108,212 l-2,6 5,-2 M92,212 l-3,5 6,-1" fill="none" stroke={f.deep} strokeWidth="1.4" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
          {furArc({ cx: 110, cy: 208, rx: 34, ry: 8, from: 2.6, to: 3.8, n: 7, len: 6, color: f.key, opacity: 0.3, sweep: -0.4 })}
          {/* gold tip with hot core at the wrap end */}
          <path d="M74,218 C62,219 53,212 56,202 C58,196 66,193 74,196 C66,199 62,204 64,209 C66,214 70,217 74,218 Z" fill={`url(#${id('gold')})`} />
          <path d="M66,200 C62,204 62,210 66,214" fill="none" stroke={g.hi} strokeWidth="1.6" opacity="0.7" strokeLinecap="round" />
        </g>

        {/* ── CHEST + FORELEGS ── */}
        {/* deep chest falling from the cheeks; slightly narrower at the legs */}
        <path d="M78,104 C68,124 66,148 72,170 C76,188 82,202 86,212 L116,212 C120,196 122,170 118,142 C115,122 108,110 100,106 Z"
          fill={`url(#${id('furB')})`} />
        {/* cool bounce at the belly + occlusion between chest and tail */}
        <path d="M82,196 C92,206 108,208 114,202 C110,210 92,212 84,206 Z" fill={bounce} opacity="0.18" filter={`url(#${id('soft2')})`} />
        <path d="M84,206 C96,212 110,212 116,208 L116,212 L86,212 Z" fill={f.occ} opacity="0.55" filter={`url(#${id('soft2')})`} />
        {/* chest ruff: long layered tufts (the fox bib) */}
        <path d="M84,112 C78,126 76,142 80,158 C84,152 86,162 90,168 C94,160 98,170 102,162 C106,168 110,158 112,150 C114,136 112,122 104,112 C98,108 90,108 84,112 Z"
          fill={f.key} opacity="0.22" filter={`url(#${id('soft2')})`} />
        <path d="M80,150 l4,8 4,-6 4,9 4,-8 4,8 4,-7 4,6" fill="none" stroke={f.key} strokeWidth="1.4" opacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M82,134 l3.5,7 3.5,-5 3.5,7 3.5,-6 3.5,6 3.5,-5" fill="none" stroke={f.key} strokeWidth="1.1" opacity="0.3" strokeLinecap="round" strokeLinejoin="round" />
        {/* gold chest blaze */}
        <path d="M96,118 C92,132 92,148 96,160 C100,166 104,160 106,150 C108,138 106,126 102,118 C100,114 98,114 96,118 Z"
          fill={`url(#${id('gold')})`} opacity="0.85" />
        <path d="M98,124 C96,136 96,148 99,156" fill="none" stroke={g.hi} strokeWidth="1.2" opacity="0.6" strokeLinecap="round" />
        {/* forelegs: straight close columns with carpal joint + paws */}
        <path d="M88,160 C86,176 86,196 88,210 L97,210 C98,196 98,176 97,160 Z" fill={`url(#${id('furB')})`} />
        <path d="M103,160 C102,176 102,196 103,210 L112,210 C114,196 114,176 112,160 Z" fill={`url(#${id('furB')})`} />
        <path d="M92,160 C90,176 90,196 92,208 M108,160 C108,176 108,196 108,208" stroke={f.occ} strokeWidth="1.6" opacity="0.4" fill="none" strokeLinecap="round" />
        <path d="M88,186 q4,2 9,0 M103,186 q4,2 9,0" stroke={f.deep} strokeWidth="1" opacity="0.5" fill="none" strokeLinecap="round" />
        {/* paws over the tail wrap */}
        <ellipse cx="92" cy="211" rx="11" ry="7" fill={`url(#${id('furB')})`} />
        <ellipse cx="108" cy="211" rx="11" ry="7" fill={`url(#${id('furB')})`} />
        <path d="M88,209 L88,214 M92,209 L92,215 M96,209 L96,214" stroke={f.occ} strokeWidth="1.3" opacity="0.65" strokeLinecap="round" />
        <path d="M104,209 L104,214 M108,209 L108,215 M112,209 L112,214" stroke={f.occ} strokeWidth="1.3" opacity="0.65" strokeLinecap="round" />
        <path d="M86,207 Q90,205 94,207 M102,207 Q106,205 110,207" fill="none" stroke={f.key} strokeWidth="1" opacity="0.4" strokeLinecap="round" />
        {/* gold collar low on the neck */}
        <path d="M82,116 Q100,130 118,116 L116,124 Q100,138 84,124 Z" fill={`url(#${id('gold')})`} />
        <path d="M83,117 Q100,131 117,117" fill="none" stroke={g.hi} strokeWidth="1.1" opacity="0.7" />
        <path d="M100,127 L107,136 L100,147 L93,136 Z" fill={`url(#${id('gold')})`} />
        <path d="M100,131 L104,136 L100,143 L96,136 Z" fill={eye} opacity="0.9" />
        <circle cx="98.6" cy="134.5" r="0.8" fill="#fff" opacity="0.85" />
        </g>

        {/* ── EARS — tall, slender, slightly splayed (idle twitch) ── */}
        <g className="mmv-ear-l">
          <path d="M68,16 C64,30 66,46 74,60 L92,50 C88,36 80,24 68,16 Z" fill={`url(#${id('furH')})`} />
          <path d="M68,16 C66,28 68,42 74,56" fill="none" stroke={f.key} strokeWidth="1.3" opacity="0.4" />
          <path d="M72,26 C70,36 72,46 77,55 L88,49 C85,38 80,30 72,26 Z" fill={`url(#${id('gold')})`} />
          <path d="M76,32 C75,40 77,47 80,52 L86,49 C84,41 81,35 76,32 Z" fill={f.occ} opacity="0.6" />
          <path d="M74,34 l3,8 M78,31 l4,9 M82,30 l3,8" stroke={mix(fur, '#ffffff', 0.35)} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
        </g>
        <g className="mmv-ear-r">
          <path d="M132,16 C136,30 134,46 126,60 L108,50 C112,36 120,24 132,16 Z" fill={`url(#${id('furH')})`} />
          <path d="M132,16 C134,28 132,42 126,56" fill="none" stroke={f.deep} strokeWidth="1.3" opacity="0.5" />
          <path d="M128,26 C130,36 128,46 123,55 L112,49 C115,38 120,30 128,26 Z" fill={`url(#${id('gold')})`} />
          <path d="M124,32 C125,40 123,47 120,52 L114,49 C116,41 119,35 124,32 Z" fill={f.occ} opacity="0.6" />
          <path d="M126,34 l-3,8 M122,31 l-4,9 M118,30 l-3,8" stroke={mix(fur, '#ffffff', 0.35)} strokeWidth="0.9" opacity="0.5" strokeLinecap="round" />
        </g>

        {/* ── HEAD — slender wedge with a long muzzle ── */}
        <path d="M100,46 C114,46 126,52 130,64 C133,73 130,82 122,90 C115,98 108,108 103,116 C101,119 99,119 97,116 C92,108 85,98 78,90 C70,82 67,73 70,64 C74,52 86,46 100,46 Z"
          fill={`url(#${id('furH')})`} />
        {/* skull planes: brow shelf light, side shadow, muzzle blaze */}
        <path d="M78,62 C86,56 114,56 122,62 C114,59 86,59 78,62 Z" fill={f.spec} opacity="0.3" filter={`url(#${id('soft2')})`} />
        <path d="M126,68 C129,76 126,84 119,91 C124,83 126,75 124,68 Z" fill={f.deep} opacity="0.55" filter={`url(#${id('soft2')})`} />
        <path d="M74,68 C71,76 74,84 81,91 C76,83 74,75 76,68 Z" fill={bounce} opacity="0.3" filter={`url(#${id('soft2')})`} />
        {/* muzzle: lighter blaze running to the nose */}
        <path d="M93,92 C95,102 97,110 100,115 C103,110 105,102 107,92 C104,88 96,88 93,92 Z" fill={f.key} opacity="0.25" filter={`url(#${id('soft2')})`} />
        <path d="M91,90 Q100,98 109,90 Q104,108 100,113 Q96,108 91,90 Z" fill={f.deep} opacity="0.35" filter={`url(#${id('soft')})`} />
        {/* cheek ruffs: layered side tufts */}
        <path d="M78,88 L60,92 L72,97 L58,102 L72,105 L64,112 L80,104 Z" fill={`url(#${id('furH')})`} />
        <path d="M122,88 L140,92 L128,97 L142,102 L128,105 L136,112 L120,104 Z" fill={`url(#${id('furH')})`} />
        <path d="M72,97 L62,100 M72,105 L66,109" stroke={f.occ} strokeWidth="1.1" opacity="0.4" strokeLinecap="round" />
        <path d="M128,97 L138,100 M128,105 L134,109" stroke={f.occ} strokeWidth="1.1" opacity="0.4" strokeLinecap="round" />
        <path d="M62,93 L72,95 M60,101 L70,103" stroke={f.key} strokeWidth="0.9" opacity="0.35" strokeLinecap="round" />
        <path d="M138,93 L128,95 M140,101 L130,103" stroke={f.key} strokeWidth="0.9" opacity="0.35" strokeLinecap="round" />
        {/* gold rim on the lit cheek + head specular */}
        <path d="M129,66 C132,74 129,83 122,90" fill="none" stroke={g.hi} strokeWidth="1.8" opacity="0.45" strokeLinecap="round" />
        <ellipse cx="95" cy="58" rx="13" ry="7" fill={f.spec} opacity="0.25" filter={`url(#${id('soft')})`} />
        {/* forehead gem */}
        <circle cx="100" cy="52" r="1.9" fill={`url(#${id('gold')})`} />
        <path d="M100,55 L104.5,62 L100,71 L95.5,62 Z" fill={`url(#${id('gold')})`} />
        <path d="M100,57 L103,62 L100,68.5 L97,62 Z" fill={g.hi} opacity="0.3" />

        {/* EYES — slanted almonds set into the brow (idle blink) */}
        <path d="M76,78 Q86,70 97,76 Q88,86 76,78 Z" fill={f.occ} />
        <path d="M124,78 Q114,70 103,76 Q112,86 124,78 Z" fill={f.occ} />
        <g className="mmv-blink">
          <g filter={glow ? `url(#${id('eglow')})` : undefined}>
            <path d="M78.5,78 Q87,71.5 95.5,76 Q88,84 78.5,78 Z" fill={`url(#${id('eye')})`} />
            <path d="M121.5,78 Q113,71.5 104.5,76 Q112,84 121.5,78 Z" fill={`url(#${id('eye')})`} />
          </g>
          {/* iris striations */}
          <g opacity="0.5">
            <path d="M87,75 L87,73 M83.5,75.6 L82.2,74 M90.5,75.8 L91.8,74.2 M83,79 L81,79.8 M91,79 L93,79.6" stroke={g.lo} strokeWidth="0.6" strokeLinecap="round" />
            <path d="M113,75 L113,73 M116.5,75.6 L117.8,74 M109.5,75.8 L108.2,74.2 M117,79 L119,79.8 M109,79 L107,79.6" stroke={g.lo} strokeWidth="0.6" strokeLinecap="round" />
          </g>
          {/* slit pupils */}
          <ellipse cx="87" cy="77.5" rx="2" ry="4" fill="#160d02" opacity="0.4" filter={`url(#${id('soft2')})`} />
          <ellipse cx="113" cy="77.5" rx="2" ry="4" fill="#160d02" opacity="0.4" filter={`url(#${id('soft2')})`} />
          <ellipse cx="87" cy="77.5" rx="1.4" ry="3.6" fill="#160d02" opacity="0.95" />
          <ellipse cx="113" cy="77.5" rx="1.4" ry="3.6" fill="#160d02" opacity="0.95" />
          {/* upper lid shadow + lower waterline light */}
          <path d="M79,76.5 Q87,71 95,75" fill="none" stroke={f.occ} strokeWidth="2.2" opacity="0.8" strokeLinecap="round" />
          <path d="M121,76.5 Q113,71 105,75" fill="none" stroke={f.occ} strokeWidth="2.2" opacity="0.8" strokeLinecap="round" />
          <path d="M80,81 Q88,85 95,79.5" fill="none" stroke={eyeCore} strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
          <path d="M120,81 Q112,85 105,79.5" fill="none" stroke={eyeCore} strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
          {/* catchlights */}
          <circle cx="84.5" cy="74.5" r="1.3" fill="#fff" opacity="0.95" />
          <circle cx="110.5" cy="74.5" r="1.3" fill="#fff" opacity="0.95" />
          <ellipse cx="90" cy="79.5" rx="1.1" ry="0.7" fill={eyeCore} opacity="0.5" />
          <ellipse cx="116" cy="79.5" rx="1.1" ry="0.7" fill={eyeCore} opacity="0.5" />
        </g>

        {/* nose: small black leather tip with wet speculars + mouth line */}
        <path d="M100,114.5 C97.4,114.5 95.6,112.6 95.6,110.8 C95.6,109.6 97.4,109 100,109 C102.6,109 104.4,109.6 104.4,110.8 C104.4,112.6 102.6,114.5 100,114.5 Z" fill="#0a0708" />
        <ellipse cx="98.2" cy="110.6" rx="1.2" ry="0.8" fill="#fff" opacity="0.45" />
        <circle cx="102.2" cy="111.8" r="0.5" fill="#fff" opacity="0.4" />
        <path d="M100,114.5 L100,118.5" stroke={f.occ} strokeWidth="1.1" opacity="0.7" strokeLinecap="round" />
        <path d="M100,118.5 Q96,121.5 93,119.5 M100,118.5 Q104,121.5 107,119.5" fill="none" stroke={f.occ} strokeWidth="1.1" opacity="0.55" strokeLinecap="round" />

        {/* whiskers */}
        <path d="M92,108 Q76,104 64,101 M92,111 Q75,110 62,111 M93,114 Q78,117 66,121" fill="none" stroke={f.spec} strokeWidth="0.85" opacity="0.45" strokeLinecap="round" />
        <path d="M108,108 Q124,104 136,101 M108,111 Q125,110 138,111 M107,114 Q122,117 134,121" fill="none" stroke={f.spec} strokeWidth="0.85" opacity="0.45" strokeLinecap="round" />

        {/* ── EQUIPPED GEAR (front) ── */}
        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
});
