import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react';
import { DomainIconArt } from '../../features/training/shared/DomainIcon';
import UniverseStage from '../shared/UniverseStage';
import { DOMAINS } from './trainingData';
import { useApp } from '../../context/AppContext';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { tokens } from '../../styles/tokens';
import { domainPlanetUrl } from '../../lib/planetIcons';

/** Kawkab at the hub centre. Imported directly, not lazily: it is a 108 KB
 *  image now, so there is no 3D stack left worth deferring. */
import TrainingHubMascot from './TrainingHubMascot';
const TrainingPlanetField3D = lazy(() => import('./TrainingPlanetField3D'));

/** OS "reduce motion" preference — decorative loops honour this. */
function prefersReducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

/** Stagger so the six worlds don't breathe in lockstep. */
const PLANET_PHASE = {
  attention: 0,
  speed: 0.55,
  memory: 1.1,
  language: 1.65,
  reasoning: 2.2,
  flexibility: 2.75,
};

/**
 * Hub-only Graphite Mist palette. Domain colours elsewhere remain untouched;
 * these six related cool hues let surface pattern, rather than candy colour,
 * carry each world's identity beside the blue Kawkab mascot.
 */
const HUB_PLANET_COLOR = {
  attention: '#a9b9cb',
  speed: '#8da3bd',
  memory: '#849bad',
  language: '#9aa9bd',
  reasoning: '#8f9db3',
  flexibility: '#91a7b9',
};

/** Local alias kept for in-file readability — values come from the central token set. */
const L = {
  bg: tokens.bg,
  text: tokens.text,
  textMuted: tokens.textMuted,
  paper: tokens.stone,
  paperEdge: tokens.stoneEdge,
  shadow: 'rgba(0, 0, 0, 0.55)',
  /** Slightly softer so modular grid reads as structure, not noise */
  grid: 'rgba(232, 172, 78, 0.045)',
};

const DOMAIN_LABEL_AR = {
  attention: 'الانتباه',
  speed: 'السرعة',
  memory: 'الذاكرة',
  language: 'اللغة',
  reasoning: 'الاستدلال',
  flexibility: 'المرونة',
};

/** Short, friendly planet captions (EN). */
const DOMAIN_DOOR_LABEL_EN = {
  attention: 'Attention',
  speed: 'Speed',
  memory: 'Memory',
  language: 'Language',
  reasoning: 'Reasoning',
  flexibility: 'Flexibility',
};

function domainDoorLabel(id, isAr) {
  if (isAr) return DOMAIN_LABEL_AR[id] ?? DOMAINS.find(d => d.id === id)?.name ?? id;
  return DOMAIN_DOOR_LABEL_EN[id] ?? DOMAINS.find(d => d.id === id)?.name ?? id;
}

/** Soft surface markings so each domain planet feels distinct. */
function PlanetMarkings({ domainId, col }) {
  switch (domainId) {
    case 'attention':
      return (
        <>
          <ellipse cx="0" cy="-6" rx="14" ry="7" fill="none" stroke={col} strokeWidth="1.1" opacity="0.45" />
          <ellipse cx="0" cy="8" rx="11" ry="5" fill="none" stroke={col} strokeWidth="0.9" opacity="0.3" />
        </>
      );
    case 'speed':
      return (
        <>
          <path d="M -16 -4 Q -2 -10 14 -2" fill="none" stroke={col} strokeWidth="1.2" opacity="0.4" />
          <path d="M -14 6 Q 2 0 16 8" fill="none" stroke={col} strokeWidth="1" opacity="0.28" />
        </>
      );
    case 'memory':
      return (
        <>
          <circle cx="-8" cy="-4" r="3.2" fill={col} opacity="0.28" />
          <circle cx="7" cy="5" r="4.5" fill={col} opacity="0.22" />
          <circle cx="2" cy="-9" r="2.2" fill={col} opacity="0.2" />
        </>
      );
    case 'language':
      return (
        <>
          <path d="M -15 2 C -6 -8 6 -8 15 2" fill="none" stroke={col} strokeWidth="1.1" opacity="0.35" />
          <path d="M -12 8 C -4 0 4 0 12 8" fill="none" stroke={col} strokeWidth="0.9" opacity="0.25" />
        </>
      );
    case 'reasoning':
      return (
        <>
          <circle cx="0" cy="0" r="10" fill="none" stroke={col} strokeWidth="1" opacity="0.28" />
          <circle cx="0" cy="0" r="5" fill="none" stroke={col} strokeWidth="0.85" opacity="0.35" />
        </>
      );
    case 'flexibility':
      return (
        <>
          <ellipse cx="0" cy="0" rx="16" ry="5.5" fill="none" stroke={col} strokeWidth="1.15" opacity="0.4" transform="rotate(-18)" />
          <ellipse cx="0" cy="0" rx="16" ry="5.5" fill="none" stroke={col} strokeWidth="0.85" opacity="0.22" transform="rotate(22)" />
        </>
      );
    default:
      return null;
  }
}

/** Free-standing category artwork with a legacy planet fallback. */
function DomainPlanet({ domainId, col, hovered, bodyGradId, glowGradId, ink }) {
  const r = hovered ? 35 : 31;
  const dur = hovered ? 2.4 : 6.2;
  const phase = PLANET_PHASE[domainId] ?? 0;
  const artUrl = domainPlanetUrl(domainId);
  const sparks = hovered
    ? [
        { x: -r * 1.02, y: -r * 0.62, s: 1.15 },
        { x: r * 0.94, y: r * 0.48, s: 0.9 },
      ]
    : [];

  return (
    <g className={`rh-domain-planet${hovered ? ' is-hot' : ''}`}>
      {/* The approved drawings stay free-standing. Circular atmosphere is
          reserved for the legacy fallback so they never become badges. */}
      {!artUrl && (
        <circle
          cx="0" cy="0"
          r={r + (hovered ? 18 : 12)}
          fill={`url(#${glowGradId})`}
          opacity={hovered ? 1 : 0.78}
        >
          <animate
            attributeName="opacity"
            values={hovered ? '0.85;1;0.85' : '0.62;0.82;0.62'}
            dur={`${dur}s`}
            begin={`${phase}s`}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* One restrained interaction halo. Persistent rings made six otherwise
          distinct worlds read like identical products on a shelf. */}
      {!artUrl && hovered && (
        <g opacity="0.46">
          <ellipse
            cx="0" cy="1" rx={r + 10} ry={(r + 10) * 0.31}
            fill="none" stroke={col} strokeWidth="1.1"
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-22 0 0"
              to="338 0 0"
              dur="10s"
              begin={`${phase}s`}
              repeatCount="indefinite"
            />
          </ellipse>
        </g>
      )}

      {/* Breathing body */}
      <g>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1;1.025;1"
          keyTimes="0;0.5;1"
          dur={`${dur}s`}
          begin={`${phase}s`}
          repeatCount="indefinite"
        />

        {artUrl ? (
          <foreignObject
            x={-r - 10}
            y={-r - 10}
            width={(r + 10) * 2}
            height={(r + 10) * 2}
            overflow='visible'
            style={{ pointerEvents: 'none' }}
          >
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              className={`rh-category-art-shell rh-category-art-shell--${domainId}`}
              style={{ '--rh-planet-color': col }}
            >
              <img className='rh-category-art' src={artUrl} alt='' aria-hidden='true' draggable='false' />
            </div>
          </foreignObject>
        ) : (
          <>
            <circle cx="0" cy="0" r={r} fill={`url(#${bodyGradId})`} stroke={col} strokeWidth={hovered ? 2.2 : 1.55} />
            <g opacity={hovered ? 0.95 : 0.8}>
              <PlanetMarkings domainId={domainId} col={col} />
            </g>
            <ellipse cx={-r * 0.28} cy={-r * 0.32} rx={r * 0.38} ry={r * 0.22} fill="rgba(255,255,255,0.28)" />
            <DomainIconArt domainId={domainId} color="#fffef8" strokeWidth={1.7} />
          </>
        )}

        {/* The fallback planet keeps its painted rim; category art does not. */}
        {!artUrl && (
          <circle
            cx="0" cy="0" r={r}
            fill="none"
            stroke={col}
            strokeWidth={hovered ? 2.1 : 1.35}
            opacity={hovered ? 0.95 : 0.55}
          />
        )}

        {/* Light appearance: an ink contour on top of the rim.
            The accent rim is a GLOW — it works against the black map and
            disappears against the paper one, leaving the painted worlds with
            soft edges that read as smudges. A drawn outline gives them their
            silhouette back. Two strokes, not one: a wide, very soft ring for
            weight, then a crisp hairline for the actual edge, which is what
            keeps it looking drawn rather than stuck on. */}
        {!artUrl && ink && (
          <>
            <circle
              cx="0" cy="0" r={r + 0.6}
              fill="none" stroke="rgba(19,14,8,0.20)"
              strokeWidth={hovered ? 4 : 3}
            />
            <circle
              cx="0" cy="0" r={r}
              fill="none" stroke="rgba(19,14,8,0.92)"
              strokeWidth={hovered ? 1.9 : 1.45}
            />
          </>
        )}
      </g>

      {/* A single hover pulse keeps tap feedback without surrounding every
          resting planet with the same donut-like rings. */}
      {!artUrl && hovered && (
        <circle cx="0" cy="0" r={r + 4} fill="none" stroke={col} strokeWidth="0.85" opacity="0.3">
          <animate attributeName="r" values={`${r + 2};${r + 13};${r + 2}`} dur={`${dur * 1.4}s`} begin={`${phase}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.36;0.03;0.36" dur={`${dur * 1.4}s`} begin={`${phase}s`} repeatCount="indefinite" />
        </circle>
      )}

      {/* Twinkling sparkles */}
      {sparks.map((sp, i) => (
        <circle key={i} cx={sp.x} cy={sp.y} r={sp.s} fill="#fff8e8" opacity="0.55">
          <animate
            attributeName="opacity"
            values="0.15;0.9;0.15"
            dur={`${1.4 + i * 0.35}s`}
            begin={`${phase + i * 0.2}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="r"
            values={`${sp.s * 0.6};${sp.s * 1.35};${sp.s * 0.6}`}
            dur={`${1.6 + i * 0.3}s`}
            begin={`${phase + i * 0.15}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
}

/** 30px path lattice; every visible guide line is 60px so the map reads cleanly. */
const GRID = 30;
const GUIDE_GRID = GRID * 2;

/*
 * Two arrangements of the same topology, one per screen shape.
 *
 * The map used to exist only as `portrait` — 360x660, an aspect of 0.55 — and
 * was scaled to whatever height was free. On a phone that is right. On a laptop
 * it is not: a 1366x577 window leaves about 350px of free height, so the fit
 * lands at 350/660 = 0.53 and draws the whole map 190px wide inside a 1366px
 * screen. Fourteen percent of the width, with the planets at half size.
 *
 * Widening the scale cap cannot fix that, because HEIGHT is the binding
 * constraint — a portrait composition in a landscape window is always going to
 * be pillarboxed. The fix is a composition whose aspect matches the screen, so
 * `landscape` is the same six-planet hub-and-spoke re-laid at 760x430: the
 * planets spread out along the axis that actually has room. Same topology, same
 * ring order, same corridors — only the coordinates differ.
 */
const HUB_LAYOUTS = {
  portrait: {
    w: 360,
    h: 660,
    nexus: [180, 360],
    // Never grows past its authored size: on a tall phone a ballooned map looks
    // clumsy, and the planets are already comfortably tappable at 1.
    maxScale: 1,
    pos: [[60, 180], [180, 120], [300, 180], [60, 480], [180, 540], [300, 480]],
  },
  landscape: {
    w: 860,
    // 470, not the 430 this started at. A planet is not just its centre: it has
    // a 52px body (64 hovered) and a caption at y+48. At 430 the south planet
    // sat at y 372, so its label ran to ~434 — past the bottom of the box — and
    // collided with the "Puzzles" button underneath. The box has to contain the
    // whole planet, label included.
    h: 470,
    nexus: [430, 235],
    // Free to grow here — on a large desktop the constraint is taste, not room.
    maxScale: 1.4,
    pos: [[150, 95], [710, 95], [150, 235], [710, 235], [150, 375], [710, 375]],
  },
};

function shrinesFor(layout) {
  return DOMAINS.map((d, i) => ({ ...d, x: layout.pos[i][0], y: layout.pos[i][1] }));
}

/**
 * Hub-and-spoke world map (one readable topology — standard for RTS/skill trees):
 *
 *                    Speed      ← spine only (north planet)
 *                      │
 *   Attention ────┬────┼────┬─── Memory    ← east/west “collector” highways
 *                 │    │    │
 *              [west│ nexus│east]
 *                 │    │    │
 *   Language  ────┴────┼────┴─── Flex
 *                      │
 *                  Reasoning    ← spine only (south planet)
 *
 * West lanes mirror east (180±60). Every vertex snaps to GRID so corridors align
 * with the modular backdrop instead of looking like stray scribbles.
 */
const AVATAR_R = 42;

function mazeCorridorD(domainId, shrines, nexus) {
  const s = shrines.find(p => p.id === domainId);
  if (!s) return '';
  const dx = s.x - nexus[0];
  const dy = s.y - nexus[1];
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;
  const sx = nexus[0] + nx * AVATAR_R;
  const sy = nexus[1] + ny * AVATAR_R;
  const cpx = nexus[0] + dx * 0.5;
  const cpy = nexus[1] + dy * 0.5;
  return `M ${sx} ${sy} Q ${cpx} ${cpy} ${s.x} ${s.y}`;
}

export default function RadialMazeHub({ onOpenDomain, onOpenAssessment }) {
  const { currentLang, toggleLang, playSfx, switchTab } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr, { universe: true });
  const [hovered, setHovered] = useState(null);
  const [tick, setTick] = useState(0);
  const [reducedMotion] = useState(prefersReducedMotion);

  /*
   * Shrink the 660px-tall map to whatever height is actually free, so the
   * lower three domains stay on screen and tappable. Never scales UP — on a
   * tall phone the map keeps its authored size rather than ballooning.
   */
  const stageRef = useRef(null);
  const [stageScale, setStageScale] = useState(1);
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current;
      if (!el) return;

      /*
       * Never measure while the tab is hidden.
       *
       * AppShell keeps every tab mounted and hides the inactive ones, and the
       * poll below runs regardless. Measured hidden, `top` is 0 and clientWidth
       * is 0 — so freeW fell back to window.innerWidth and the whole map was
       * sized for a viewport it was not in, storing a far too generous scale
       * (and sometimes flipping to the landscape layout as well).
       *
       * The result was visible on EVERY entry to Training, not just the first:
       * leaving the tab let the poll overwrite a correct scale with a bogus one,
       * so the hub drew large on arrival and snapped back up to 500ms later.
       * That "zoom in then zoom out" was this, not an animation.
       */
      if (!el.offsetParent) return false;
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return false;

      // The stage's own top is stable: scaling changes its HEIGHT, not where it
      // starts, so this does not need a second pass.
      const top = rect.top;
      // Measure against the real tab bar rather than guessing a reserve — it is
      // fixed, 81px tall, and is exactly what the lower domains were hiding
      // behind. Falling back to the viewport keeps this safe if it is absent.
      const bar = document.querySelector('.app-tabbar');
      const floor = bar ? bar.getBoundingClientRect().top : window.innerHeight;
      /*
       * Reserve the Puzzles button's own row.
       *
       * The fit used to hand the stage every pixel between its top and the tab
       * bar, but the "Puzzles — take a break" button lives BELOW the stage in
       * normal flow. So the map grew into the space the button needed and pushed
       * it behind the fixed tab bar, where it could not be tapped at all. It is
       * measured rather than assumed, because its height changes with language
       * (the Arabic label wraps differently) and with the user's font settings.
       */
      const cta = document.querySelector('.rh-puzzles-cta');
      const ctaReserve = cta ? cta.getBoundingClientRect().height + 26 : 58;

      const free = floor - top - 12 - ctaReserve;
      const freeW = el.clientWidth || window.innerWidth;

      /*
       * Pick the composition that matches the hole we have to fill, then fit it.
       * The 780px floor keeps tablets in portrait on the portrait map — the
       * landscape one needs real width before its planets beat the portrait
       * map's, and a 1.15 aspect is where that crossover sits.
       */
      const nextWide = freeW >= 780 && freeW / Math.max(1, free) > 1.15;
      setWide(nextWide);

      // Derived from nextWide rather than the `wide` state so the scale and the
      // layout can never disagree for a frame — a mismatch here would size the
      // container for one map and draw the other.
      const L = nextWide ? HUB_LAYOUTS.landscape : HUB_LAYOUTS.portrait;
      const byHeight = free / L.h;
      const byWidth = freeW / L.w;
      setStageScale(Math.max(0.5, Math.min(L.maxScale, byHeight, byWidth)));
      return true;
    };
    fit();
    window.addEventListener('resize', fit);

    /*
     * First entry has no valid measurement yet, and waiting for the 500ms poll
     * would show one wrong frame — the same flash, just once. Watch per-frame
     * until the first real measurement lands, then stop; `offsetParent` is a
     * cheap check and this ends as soon as the tab is opened.
     */
    let raf = 0;
    const untilVisible = () => {
      if (fit()) return;
      raf = window.requestAnimationFrame(untilVisible);
    };
    raf = window.requestAnimationFrame(untilVisible);

    /*
     * AppShell mounts every tab up front and hides the inactive ones, so this
     * hub is laid out at 0x0 long before it is ever shown. Measuring then gives
     * top = 0 and a uselessly generous scale — which is exactly what left the
     * lower domains clipped: 490/660 = 0.74 instead of the correct 0.58.
     *
     * A ResizeObserver on the parent was tried first and never fired once,
     * including across a full tab round-trip, so the display:none → visible
     * transition is not observable here. A poll is unglamorous but it is what
     * works in this shell (TrainingBlueRobot3D uses the same trick for the same
     * reason). React bails out when the value is unchanged, so the steady state
     * costs one getBoundingClientRect every 500ms.
     */
    const id = window.setInterval(fit, 500);
    return () => {
      window.removeEventListener('resize', fit);
      window.clearInterval(id);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  const LY = wide ? HUB_LAYOUTS.landscape : HUB_LAYOUTS.portrait;
  const shrines = useMemo(() => shrinesFor(LY), [LY]);

  useEffect(() => {
    // The rising embers are pure atmosphere; when the user asks for reduced
    // motion we simply stop pumping the tick (also spares a re-render/120ms).
    if (reducedMotion) return undefined;
    const t = setInterval(() => setTick(x => x + 1), 120);
    return () => clearInterval(t);
  }, [reducedMotion]);

  return (
    <div
      className={`app-stage app-stage--universe app-stage--${chrome.dark ? 'dark' : 'light'} rh-training-hub rh-training-hub--${wide ? 'desktop' : 'phone'}`}
      style={{
        minHeight: '100%', ...chrome.shell,
        fontFamily: 'Outfit, system-ui, sans-serif', position: 'relative',
        paddingBottom: 110, overflowX: 'hidden', overflowY: 'visible',
      }}
    >
      <UniverseStage accent="training" dark={chrome.dark} homeDusk />

      {/* Top bar — sticky so “Training” stays visible while the hub scrolls */}
      <div className="app-chrome-bar rh-training-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(14px, env(safe-area-inset-top)) 18px 12px',
        position: 'sticky', top: 0, zIndex: 20,
        background: chrome.dark
          ? 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0) 100%)'
          : 'linear-gradient(180deg, rgba(38,44,60,0.94) 0%, rgba(52,53,68,0.76) 65%, transparent 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }} />
        {/* Type treatment lives entirely in trainingHubPremium.css
            (`.rh-training-title`), which already carried !important rules that
            silently beat anything set here. Setting font properties inline
            again would just recreate a half-dead override. */}
        <div className="rh-training-title" style={chrome.title}>
          {isAr ? 'التدريب المعرفي' : 'Cognitive Training'}
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" style={chrome.langBtn} onClick={toggleLang}>
            {isAr ? 'EN' : 'عر'}
          </button>
        </div>
      </div>

      {/* Orienting caption — mirrors the Home / Wellbeing intro line so a
          first-time user knows the map is interactive and what the glowing
          figure at its centre is for. */}
      <p className="rh-training-intro" style={{
        position: 'relative', zIndex: 4,
        margin: '4px auto 0', maxWidth: 330, padding: '0 22px',
        textAlign: 'center', color: chrome.muted,
        fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
        fontSize: 14, lineHeight: 1.55, fontWeight: 500,
      }}>
        {isAr
          ? 'اختر مجالًا معرفيًا، أو افتح التقييم للحصول على خط أساس شامل.'
          : 'Select a cognitive domain, or open Assessment for a complete baseline.'}
      </p>

      {/*
        Radial maze canvas.

        The stage is authored at a fixed 360x660 — the SVG viewBox and every
        absolutely-positioned overlay agree on those numbers — and it used to be
        rendered at that size unconditionally, in a screen that does not scroll.
        On any viewport shorter than about 770px the bottom of the map fell
        past the tab bar, which left Language, Reasoning and Flexibility drawn
        but UNTAPPABLE. Half the domains were unreachable on a laptop or a
        phone in landscape.

        Scaling the whole stage keeps the hybrid SVG + DOM model in sync: one
        transform moves the paths, the planets and the mascot together, so
        nothing has to be re-measured. Height collapses to the scaled height so
        the layout does not reserve space that is no longer drawn.
      */}
      <div
        ref={stageRef}
        className={`rh-hub-stage rh-hub-stage--${wide ? 'desktop' : 'phone'}`}
        style={{
          position: 'relative',
          width: '100%',
          height: LY.h * stageScale,
          marginTop: 4,
          zIndex: 4,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            height: LY.h,
            transform: `scale(${stageScale})`,
            transformOrigin: 'top center',
          }}
        >
        {/* Local cosmos FX — mirrors mode-planet hub atmosphere */}
        <div className="rh-hub-sky" aria-hidden="true">
          <div className="rh-hub-nebula rh-hub-nebula--a" />
          <div className="rh-hub-nebula rh-hub-nebula--b" />
          <div className="rh-hub-nebula rh-hub-nebula--c" />
          <div className="rh-hub-stars rh-hub-stars--a" />
          <div className="rh-hub-stars rh-hub-stars--b" />
          <div className="rh-hub-shoot rh-hub-shoot--1" />
          <div className="rh-hub-shoot rh-hub-shoot--2" />
          <div className="rh-hub-shoot rh-hub-shoot--3" />
          <div className="rh-hub-dust" />
        </div>

        <svg width={LY.w} height={LY.h} viewBox={`0 0 ${LY.w} ${LY.h}`} style={{
          position: 'absolute', inset: 0, margin: 'auto', left: 0, right: 0, overflow: 'visible', zIndex: 2,
        }}>
          <defs>
            <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            {shrines.map(s => {
              const col = HUB_PLANET_COLOR[s.id];
              return (
                <React.Fragment key={`planet-defs-${s.id}`}>
                  <radialGradient id={`planetBody-${s.id}`} cx="32%" cy="28%" r="72%">
                    <stop offset="0%" stopColor="#fff8e8" stopOpacity="0.95" />
                    <stop offset="28%" stopColor={col} stopOpacity="0.95" />
                    <stop offset="72%" stopColor={col} stopOpacity="0.82" />
                    <stop offset="100%" stopColor="#1a1010" stopOpacity="0.92" />
                  </radialGradient>
                  <radialGradient id={`planetGlow-${s.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={col} stopOpacity="0.55" />
                    <stop offset="45%" stopColor={col} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={col} stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id={`sh-${s.id}`} cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0%" stopColor={col} stopOpacity="0.48" />
                    <stop offset="55%" stopColor={col} stopOpacity="0.14" />
                    <stop offset="100%" stopColor={col} stopOpacity="0" />
                  </radialGradient>
                </React.Fragment>
              );
            })}
            <radialGradient id="centerGlow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#ffd85a" stopOpacity="0.6"/>
              <stop offset="40%" stopColor="#f5a623" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#f5a623" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="rh-planet-shade" cx="32%" cy="28%" r="78%">
              <stop offset="0%" stopColor="#fff8e8" stopOpacity="0" />
              <stop offset="55%" stopColor="#0a0812" stopOpacity="0" />
              <stop offset="100%" stopColor="#05040a" stopOpacity="0.42" />
            </radialGradient>
            <radialGradient id="rh-assess-body" cx="34%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fff3c4" stopOpacity="0.98" />
              <stop offset="35%" stopColor="#e8ac4e" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#8a5a18" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#1a1008" stopOpacity="0.98" />
            </radialGradient>
          </defs>

          {/* Sparse guide grid — enough structure to feel designed, not noisy */}
          <g opacity="1">
            {Array.from({ length: Math.floor(LY.h / GUIDE_GRID) + 1 }, (_, i) => (
              <line key={`h${i}`} x1="0" x2={LY.w} y1={i * GUIDE_GRID} y2={i * GUIDE_GRID} stroke={L.grid} strokeWidth="0.55"/>
            ))}
            {Array.from({ length: Math.floor(LY.w / GUIDE_GRID) + 1 }, (_, i) => (
              <line key={`v${i}`} x1={i * GUIDE_GRID} x2={i * GUIDE_GRID} y1="0" y2={LY.h} stroke={L.grid} strokeWidth="0.55"/>
            ))}
          </g>

          {/* Radial corridors — smooth spokes from center avatar to each planet */}
          {shrines.map(s => {
            const col = HUB_PLANET_COLOR[s.id];
            const isHovered = hovered === s.id;
            const d = mazeCorridorD(s.id, shrines, LY.nexus);
            const wCorridor = isHovered ? 2 : 1.15;
            const corridorStroke = isHovered ? col : 'rgba(158,177,216,0.38)';
            const runnerStroke = isHovered ? col : '#d7c28f';
            return (
              <g key={`path-${s.id}`}>
                <path
                  d={d}
                  fill="none"
                  stroke={corridorStroke}
                  strokeWidth={wCorridor + 2.5}
                  strokeLinecap="round"
                  opacity={isHovered ? 0.18 : 0.06}
                />
                <path
                  d={d}
                  fill="none"
                  stroke={corridorStroke}
                  strokeWidth={wCorridor}
                  strokeLinecap="round"
                  opacity={isHovered ? 0.72 : 0.3}
                  strokeDasharray={isHovered ? '8 5' : '4 6'}
                >
                  {isHovered && (
                    <animate
                      attributeName="stroke-dashoffset"
                      from="0"
                      to="-13"
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  )}
                </path>
                <circle r={isHovered ? 3 : 2.2} fill="#fffefb" stroke={runnerStroke} strokeWidth={1.3} opacity={isHovered ? 1 : 0.6}>
                  <animateMotion dur={isHovered ? '1.2s' : '2.8s'} repeatCount="indefinite" path={d}/>
                </circle>
                <circle r={isHovered ? 1.1 : 0.8} fill={runnerStroke} opacity={isHovered ? 1 : 0.55}>
                  <animateMotion dur={isHovered ? '1.2s' : '2.8s'} repeatCount="indefinite" path={d}/>
                </circle>
              </g>
            );
          })}

          {/* Center Assessment nexus (placeholder until 3D mascot) */}
          <g
            className="rh-assess-nexus"
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={isAr ? 'ابدأ التقييم' : 'Start assessment'}
            onClick={onOpenAssessment}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenAssessment();
              }
            }}
          >
            <circle cx={LY.nexus[0]} cy={LY.nexus[1]} r={72} fill="url(#centerGlow)" opacity="0.8">
              <animate attributeName="opacity" values="0.55;0.85;0.55" dur="3.6s" repeatCount="indefinite" />
            </circle>
            <circle cx={LY.nexus[0]} cy={LY.nexus[1]} r={38} fill="none" stroke="rgba(232,172,78,0.45)" strokeWidth="1.2">
              <animate attributeName="r" values="34;48;34" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.55;0.08;0.55" dur="3.2s" repeatCount="indefinite" />
            </circle>
            {/* The solid "planet" body is gone — the 3D Kawkab mascot (overlaid
                canvas below) stands here. We keep the orbit ring as a ground
                halo the mascot floats above. */}
            <ellipse
              cx={LY.nexus[0]} cy={LY.nexus[1] + 20}
              rx="40" ry="12"
              fill="none"
              stroke="rgba(232,172,78,0.5)"
              strokeWidth="1.1"
              opacity="0.5"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from={`-12 ${LY.nexus[0]} ${LY.nexus[1] + 20}`}
                to={`348 ${LY.nexus[0]} ${LY.nexus[1] + 20}`}
                dur="14s"
                repeatCount="indefinite"
              />
            </ellipse>
            {/* Assessment label is rendered as a premium DOM badge above the robot. */}
          </g>

          {/* Domain planets */}
          {shrines.map(s => {
            const col = HUB_PLANET_COLOR[s.id];
            const isHovered = hovered === s.id;
            const phase = PLANET_PHASE[s.id] ?? 0;
            return (
              <g key={s.id} style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={domainDoorLabel(s.id, isAr)}
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(s.id)}
                onBlur={() => setHovered(null)}
                onClick={() => onOpenDomain(s.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDomain(s.id);
                  }
                }}>
                <circle cx={s.x} cy={s.y} r={isHovered ? 64 : 52} fill={`url(#sh-${s.id})`}/>
                <g transform={`translate(${s.x}, ${s.y})`}>
                  <g>
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="0 0; 0 -1.5; 0 0"
                      keyTimes="0;0.5;1"
                      dur={isHovered ? '1.4s' : '3.6s'}
                      begin={`${phase}s`}
                      repeatCount="indefinite"
                    />
                    <DomainPlanet
                      domainId={s.id}
                      col={col}
                      hovered={isHovered}
                      bodyGradId={`planetBody-${s.id}`}
                      glowGradId={`planetGlow-${s.id}`}
                      ink={false}
                    />
                  </g>
                </g>
                <foreignObject
                  x={s.x - 64}
                  y={s.y + 43}
                  width="128"
                  height="38"
                  overflow="visible"
                  style={{ pointerEvents: 'none' }}
                >
                  <div
                    xmlns="http://www.w3.org/1999/xhtml"
                    className={`rh-domain-label${isHovered ? ' is-active' : ''}`}
                    lang={isAr ? 'ar' : 'en'}
                    dir={isAr ? 'rtl' : 'ltr'}
                  >
                    {domainDoorLabel(s.id, isAr)}
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* Rising embers / dust */}
          {Array.from({ length: 8 }).map((_, i) => {
            const seed = i * 137;
            // Spread across whichever map is mounted — hardcoded to the portrait
            // 360x660 box, these all bunched into the top-left corner of the
            // wider landscape stage.
            const span = LY.w - 60;
            const rise = LY.h - 100;
            const t = (tick * (3 + (i % 4)) + seed) % rise;
            const x = (seed % span) + 30;
            const y = (LY.h - 60) - t;
            const op = Math.max(0, 0.6 - t / rise);
            return <circle key={i}
              cx={x + Math.sin(tick / 20 + i) * 6} cy={y}
              r={0.8 + (i % 3) * 0.4} fill="#e8ac4e" opacity={op * 0.22}/>;
          })}
        </svg>

        {/* One real WebGL scene supplies all six lit sphere meshes. The painted
            DOM planets beneath remain available as a no-WebGL fallback. */}
        <Suspense fallback={null}>
          <TrainingPlanetField3D
            width={LY.w}
            height={LY.h}
            planets={shrines}
            hovered={hovered}
            reducedMotion={reducedMotion}
            radius={wide ? 38 : 31}
          />
        </Suspense>

        {/* Kawkab — overlaid exactly on the SVG hub nexus. Both layouts put the
            nexus on the horizontal centre, so left:50% holds for either; the
            vertical offset has to follow the active map (360 in the portrait
            360x660 box, 215 in the landscape 760x430 one). Tapping opens the
            assessment.

            No drop-shadow here any more: the character carries its own halo,
            and a cast shadow on a glowing translucent body reads as grime. */}
        <div
          className="rh-assess-mascot"
          style={{
            position: 'absolute',
            left: '50%',
            top: LY.nexus[1],
            transform: 'translate(-50%, -70%)',
            zIndex: 5,
          }}
        >
          <TrainingHubMascot
            size={150}
            isAr={isAr}
            label={isAr ? 'ابدأ التقييم' : 'Start assessment'}
            onActivate={onOpenAssessment}
          />
        </div>
        </div>
      </div>

      {/* Daily Workout now lives at the end of the Assessment screen. */}

      {/* Puzzles now lives inside Training — a distinct, lower-pressure
          "break" entry rather than one of the domain planets, since it isn't
          a tracked/scored exercise the way the 6 domains are. */}
      {/* The -18 pull-up is a portrait tuning: that map ends with 120px of empty
          box below its south planet, so the button has to climb into it or it
          floats. The landscape box has no such slack — its planets fill it — so
          pulling up there lands the button ON the south planet instead. */}
      <div style={{ position: 'relative', zIndex: 6, display: 'flex', justifyContent: 'center', marginTop: wide ? 10 : -18 }}>
        <button
          type="button"
          className="rh-puzzles-cta"
          onClick={() => { playSfx('click'); switchTab('puzzles'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 100,
            background: 'linear-gradient(180deg, #1f160c 0%, #150e08 100%)',
            border: '1.5px solid rgba(232,172,78,0.55)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(220,170,70,0.12)',
            color: L.text, cursor: 'pointer',
            fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', sans-serif",
            fontSize: isAr ? 13 : 14, fontWeight: isAr ? 800 : 400, letterSpacing: isAr ? 0 : 0.3,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"
            style={{ flexShrink: 0, color: '#e8ac4e' }}>
            <path
              d="M19.44 7.85c-.05.32.06.65.29.88l1.56 1.57c.47.47.71 1.08.71 1.7s-.24 1.23-.71 1.7l-1.61 1.61a.98.98 0 0 1-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 1 0-3.21 3.22c.45.16.86.5.93.97a.98.98 0 0 1-.28.84l-1.61 1.61c-.47.47-1.08.7-1.7.7s-1.23-.23-1.7-.7l-1.57-1.57a1.03 1.03 0 0 0-.88-.29c-.49.07-.84.5-1.02.97a2.5 2.5 0 1 1-3.24-3.24c.46-.18.9-.53.97-1.02a1.03 1.03 0 0 0-.29-.88L2.7 13.7A2.4 2.4 0 0 1 2 12c0-.62.24-1.23.71-1.7L4.23 8.77c.24-.24.58-.35.92-.3.51.07.88.53 1.07 1a2.5 2.5 0 1 0 3.26-3.25c-.48-.2-.93-.56-1.01-1.07-.05-.34.06-.68.3-.92l1.53-1.52C10.77 1.74 11.38 1.5 12 1.5s1.23.24 1.7.71l1.57 1.57c.23.23.56.34.88.29.49-.08.84-.5 1.02-.97a2.5 2.5 0 1 1 3.24 3.24c-.47.18-.9.53-.97 1.02Z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
          </svg>
          {isAr ? 'مختبر الألغاز' : 'Puzzle Studio'}
        </button>
      </div>

      {/* Domain hover callout */}
      {hovered && (
        <div className="rh-domain-detail" style={{
          position: 'absolute', bottom: 88, left: 0, right: 0, textAlign: 'center', zIndex: 6,
          pointerEvents: 'none',
        }}>
          <div className="rh-domain-detail__pill" style={{
            display: 'inline-block', padding: '8px 16px', borderRadius: 100,
            background: 'linear-gradient(180deg, #1f160c 0%, #150e08 100%)',
            border: `1.5px solid ${HUB_PLANET_COLOR[hovered]}`,
            boxShadow: `0 4px 16px rgba(0,0,0,0.7), 0 0 18px ${HUB_PLANET_COLOR[hovered]}55, inset 0 1px 0 rgba(220,170,70,0.12)`,
            fontSize: 12, color: L.text, letterSpacing: 0.2,
            maxWidth: 'min(92vw, 340px)',
          }}>
            <span style={{
              color: HUB_PLANET_COLOR[hovered],
              fontWeight: 900,
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
              letterSpacing: isAr ? 0 : 0.5,
            }}>
              {domainDoorLabel(hovered, isAr)}
            </span>
            <span style={{ color: L.textMuted, margin: '0 8px' }}>·</span>
            <span style={{ color: L.textMuted, fontWeight: 600 }}>{DOMAINS.find(d => d.id === hovered).desc}</span>
          </div>
        </div>
      )}
    </div>
  );
}
