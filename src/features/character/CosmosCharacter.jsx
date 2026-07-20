import React, { useEffect, useId, useState } from 'react';
import { equipped2d } from './items';
import { metal, lighten, darken, mix } from './shade';
import { assetUrl } from '../../lib/assetUrl';

/**
 * CosmosCharacter / Kawkab — living-planet mascot.
 *
 * Default full-body & face use the new Kawkab raster art. The legacy SVG path
 * is kept when the caller needs features the PNGs cannot express yet:
 *   - equipped gear (hat / face / neck / back anchors)
 *   - custom `fur` / `accent` (e.g. Story Time pink variant)
 *
 * Prop contract is unchanged so Home, Character, shop, hub and games keep working.
 */

const DEFAULT_FUR = '#0a0a0f';
const DEFAULT_ACCENT = '#c8943e';

const KAWKAB_ASSETS = {
  idle: 'Assets/characters/kawkab/kawkab-idle.png',
  face: 'Assets/characters/kawkab/kawkab-face.png',
  dance: 'Assets/characters/kawkab/kawkab-dance.png',
};

const MOOD_EYE = {
  ready: '#ffd85a',
  focused: '#fff1a8',
  proud: '#fffbe0',
  tired: '#e8c060',
};

const MOOD_GLOW = {
  ready: '#e8ac4e',
  focused: '#f0c878',
  proud: '#e8c878',
  tired: '#a89870',
};

// Gear attach points (0..200 viewBox). Planet centre (100,102), r=52.
const ANCHORS = {
  hat: { x: 100, y: 38, s: 1.7 },
  face: { x: 100, y: 96, s: 1.45 },
  neck: { x: 100, y: 156, s: 1.2 },
  back: { x: 100, y: 102, s: 1.15 },
};

function hasEquippedGear(equipped) {
  if (!equipped || typeof equipped !== 'object') return false;
  return Object.values(equipped).some((v) => typeof v === 'string' && v.length > 0);
}

/** Prefer new art unless gear or custom palette requires the SVG body. */
function preferRasterArt({ faceOnly, equipped, fur, accent }) {
  if (hasEquippedGear(equipped)) return false;
  if (fur && fur !== DEFAULT_FUR) return false;
  if (accent && accent !== DEFAULT_ACCENT) return false;
  return true;
}

function useDanceFrame(active, frames = 25, fps = 12) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) {
      setFrame(0);
      return undefined;
    }
    const id = window.setInterval(() => {
      setFrame((f) => (f + 1) % frames);
    }, Math.round(1000 / fps));
    return () => window.clearInterval(id);
  }, [active, frames, fps]);
  return frame;
}

/** New Kawkab raster — same outer box as the SVG so hub/home layout stay stable. */
function KawkabRaster({ size, faceOnly, mood, glow, float, pose }) {
  // Dance only when explicitly requested — never on hub/home idle "proud" looks.
  const cheer = !faceOnly && pose === 'cheer';
  const frame = useDanceFrame(cheer);
  const glowColor = MOOD_GLOW[mood] || MOOD_GLOW.ready;
  const width = size;
  const height = faceOnly ? size : size * 1.2;
  const src = assetUrl(faceOnly ? KAWKAB_ASSETS.face : KAWKAB_ASSETS.idle);
  const danceSrc = assetUrl(KAWKAB_ASSETS.dance);

  const col = frame % 5;
  const row = Math.floor(frame / 5);

  return (
    <div
      className={float ? 'mm-float' : undefined}
      style={{ width, height, position: 'relative', display: 'inline-block' }}
      role="img"
      aria-label="Kawkab"
    >
      {glow && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: faceOnly ? '-12%' : '-8% -6% -2%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor}55 0%, ${glowColor}18 42%, transparent 70%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {!faceOnly && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '2%',
            transform: 'translateX(-50%)',
            width: '48%',
            height: '6%',
            borderRadius: '50%',
            background: 'rgba(10, 12, 20, 0.22)',
            filter: 'blur(3px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {cheer ? (
        <div
          aria-hidden="true"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            backgroundImage: `url("${danceSrc}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '500% 500%',
            backgroundPosition: `${col * 25}% ${row * 25}%`,
            filter: glow
              ? `drop-shadow(0 0 ${size * 0.06}px ${glowColor}aa)`
              : 'none',
          }}
        />
      ) : (
        <img
          src={src}
          alt=""
          draggable={false}
          width={width}
          height={height}
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            filter: glow
              ? `drop-shadow(0 0 ${size * 0.05}px ${glowColor}99)`
              : mood === 'tired'
                ? 'saturate(0.85) brightness(0.92)'
                : 'none',
          }}
        />
      )}
    </div>
  );
}

/** Legacy SVG body — gear anchors + custom palette. */
function CosmosSvgBody({
  size,
  fur,
  accent,
  mood,
  equipped,
  glow,
  float,
  faceOnly,
}) {
  const uid = useId().replace(/:/g, '');
  const id = (n) => `${uid}-${n}`;

  const g = metal(accent);
  const eye = MOOD_EYE[mood] || MOOD_EYE.ready;
  const edge = '#000000';
  const ink = lighten(fur, 0.18);
  const limb = lighten(fur, 0.14);
  const limbHi = lighten(limb, 0.18);
  const cap = lighten(fur, 0.28);
  const nebula = mix(fur, accent, 0.28);

  const cx = 100;
  const cy = 102;
  const R = 52;
  const EYE_H_TOP = 11.5;
  const EYE_H_BOT = 4.2;

  const width = size;
  const height = faceOnly ? size : size * 1.2;
  const viewBox = faceOnly ? '28 32 144 132' : '0 0 200 240';
  const gearProps = { accent, gold: `url(#${id('gold')})`, fur };

  const Star = ({ x, y, r, fill = accent, o = 1 }) => (
    <path
      d={`M${x},${y - r} L${x + r * 0.24},${y - r * 0.24} L${x + r},${y} L${x + r * 0.24},${y + r * 0.24} L${x},${y + r} L${x - r * 0.24},${y + r * 0.24} L${x - r},${y} L${x - r * 0.24},${y - r * 0.24} Z`}
      fill={fill}
      opacity={o}
    />
  );

  const Limb = ({ x1, y1, x2, y2, w, capX, capY, capR }) => (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={limb} strokeWidth={w} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={limbHi} strokeWidth={w * 0.34} strokeLinecap="round" opacity="0.5" />
      <circle cx={capX} cy={capY} r={capR} fill={cap} stroke={ink} strokeWidth="1.6" />
    </>
  );

  const GlowEye = ({ x, y, dir = 1 }) => {
    const w = 10;
    const hTop = EYE_H_TOP;
    const hBot = EYE_H_BOT;
    const tilt = -dir * 7;
    const almond = `M${-w},0 Q0,${-hTop} ${w},0 Q0,${hBot} ${-w},0 Z`;
    return (
      <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
        <ellipse cx={0} cy={0} rx={w * 1.45} ry={hTop * 1.05} fill={accent} opacity="0.3" filter={`url(#${id('eyeglowOuter')})`} />
        <path d={almond} fill={eye} opacity="0.95" filter={`url(#${id('eyeglow')})`} />
        <path d={almond} fill="none" stroke={lighten(accent, 0.35)} strokeWidth="1" strokeLinejoin="round" />
        <circle cx={0} cy={0} r="2.1" fill="#fff" opacity="0.95" />
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
          <filter id={id('eyeglow')} x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.8" />
          </filter>
          <filter id={id('eyeglowOuter')} x="-180%" y="-180%" width="460%" height="460%">
            <feGaussianBlur stdDeviation="5.5" />
          </filter>
        </defs>

        {glow && (
          <g>
            <animate attributeName="opacity" values="0.8;1;0.8" dur="3.6s" repeatCount="indefinite" />
            <circle cx={cx} cy={cy} r={faceOnly ? 92 : 116} fill={`url(#${id('auraOuter')})`} />
            <circle cx={cx} cy={cy} r={faceOnly ? 68 : 86} fill={`url(#${id('halo')})`} />
          </g>
        )}
        {!faceOnly && <ellipse cx={cx} cy="214" rx="44" ry="7.5" fill={ink} opacity="0.22" />}

        {!faceOnly && (
          <>
            <Star x={40} y={54} r={4} o={0.7} />
            <Star x={166} y={70} r={3.4} o={0.65} />
            <circle cx={150} cy={34} r="1.8" fill={lighten(accent, 0.4)} opacity="0.6" />
            <circle cx={30} cy={120} r="1.6" fill={lighten(accent, 0.4)} opacity="0.55" />
          </>
        )}

        {equipped2d(equipped, ANCHORS, 'back', gearProps)}

        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="90" ry="23" fill="none" stroke={`url(#${id('gold')})`} strokeWidth="5" opacity="0.92" />
          <ellipse cx={cx} cy={cy} rx="78" ry="19.5" fill="none" stroke={lighten(accent, 0.45)} strokeWidth="2" opacity="0.55" />
        </g>

        <circle cx={cx} cy={cy} r={R + 0.6} fill="none" stroke={edge} strokeWidth="3.2" />
        <circle cx={cx} cy={cy} r={R} fill={`url(#${id('body')})`} stroke={edge} strokeWidth="2.4" />
        <circle cx={cx} cy={cy} r={R - 0.6} fill="none" stroke={`url(#${id('gold')})`} strokeWidth="1.7" opacity="0.72" />

        <g clipPath={`url(#${id('sphere')})`}>
          <path d={`M${cx - 54},${cy + 12} Q${cx - 4},${cy - 6} ${cx + 40},${cy + 8} Q${cx + 56},${cy + 18} ${cx + 56},${cy + 32} L${cx + 56},${cy + 56} L${cx - 56},${cy + 56} Z`}
            fill={nebula} opacity="0.22" />
          <circle cx={cx + 16} cy={cy + 22} r="6" fill={lighten(fur, 0.05)} opacity="0.22" />
          <circle cx={cx - 28} cy={cy + 16} r="4.5" fill={lighten(fur, 0.04)} opacity="0.18" />
          <circle cx={cx + 34} cy={cy + 2} r="3.4" fill={lighten(fur, 0.03)} opacity="0.16" />
          <circle cx={cx - 10} cy={cy + 28} r="1.3" fill={lighten(accent, 0.15)} opacity="0.28" />
          <circle cx={cx - 36} cy={cy - 8} r="1.2" fill={lighten(accent, 0.15)} opacity="0.24" />
        </g>
        <path d={`M${cx - 38},${cy - 35} A${R},${R} 0 0 1 ${cx + 4},${cy - 51}`}
          fill="none" stroke={lighten(accent, 0.55)} strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
        <path d={`M${cx - 33},${cy - 33} A${R - 6},${R - 6} 0 0 1 ${cx - 2},${cy - 44}`}
          fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.35" />

        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <path d={`M${cx + 90},${cy} A90,23 0 0 1 ${cx - 90},${cy}`}
            fill="none" stroke={`url(#${id('gold')})`} strokeWidth="5" strokeLinecap="round" opacity="0.95" />
          <path d={`M${cx + 78},${cy} A78,19.5 0 0 1 ${cx - 78},${cy}`}
            fill="none" stroke={lighten(accent, 0.45)} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>

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

        <GlowEye x={cx - 18} y={cy - 3} dir={-1} />
        <GlowEye x={cx + 18} y={cy - 3} dir={1} />
        <path d={`M${cx - 9},${cy + 18} Q${cx},${cy + 21} ${cx + 9},${cy + 18}`}
          fill="none" stroke={darken(accent, 0.5)} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />

        <g transform={`rotate(-15 ${cx} ${cy})`}>
          <circle cx={cx - 60} cy={cy + 18} r="5" fill={lighten(fur, 0.35)} stroke={ink} strokeWidth="1.6" />
          <circle cx={cx - 61} cy={cy + 16} r="1.7" fill={lighten(fur, 0.42)} opacity="0.7" />
        </g>

        {equipped2d(equipped, ANCHORS, 'front', gearProps)}
      </svg>
    </div>
  );
}

export default React.memo(function CosmosCharacter({
  size = 200,
  fur = DEFAULT_FUR,
  accent = DEFAULT_ACCENT,
  mood = 'ready',
  equipped = null,
  glow = true,
  float = false,
  faceOnly = false,
  /** `cheer` plays the dance sheet (win moments only). */
  pose = 'idle',
  /** Force legacy SVG (`legacy`) or new art (`kawkab`). Default: auto. */
  art = 'auto',
}) {
  const useRaster = art === 'kawkab'
    || (art !== 'legacy' && preferRasterArt({ faceOnly, equipped, fur, accent }));

  if (useRaster) {
    return (
      <KawkabRaster
        size={size}
        faceOnly={faceOnly}
        mood={mood}
        glow={glow}
        float={float}
        pose={pose}
      />
    );
  }

  return (
    <CosmosSvgBody
      size={size}
      fur={fur}
      accent={accent}
      mood={mood}
      equipped={equipped}
      glow={glow}
      float={float}
      faceOnly={faceOnly}
    />
  );
});
