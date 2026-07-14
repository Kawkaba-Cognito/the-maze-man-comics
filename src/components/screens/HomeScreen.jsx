import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import UniversePlanets from '../../features/universe/UniversePlanets';
import { assetUrl } from '../../lib/assetUrl';

/*
 * Home — "Your Universe". A living scene, not a dashboard: multi-layer
 * parallax starfield (CSS transform/opacity only, no rAF/canvas loop),
 * Kawkab glowing at the center (decorative — triple-tap to dance, single
 * taps do nothing; navigation lives in the bottom tab bar only), and the
 * user's own small planets (notes / goals / journal) freely placed and
 * draggable around the scene. See project_home_prototypes memory for the
 * four earlier directions this superseded, and project_universe_planets
 * for the small-planets system.
 */

function useStarLayer(count, sizeRange, seedOffset) {
  return useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n) => {
      const x = Math.sin((i + seedOffset) * 12.9898 + n * 78.233) * 43758.5453;
      return x - Math.floor(x);
    };
    return {
      id: i,
      x: r(1) * 100,
      y: r(2) * 100,
      size: sizeRange[0] + r(3) * (sizeRange[1] - sizeRange[0]),
      delay: r(4) * 6,
      dur: 2.4 + r(5) * 3,
    };
  }), [count, sizeRange, seedOffset]);
}

function StarLayer({ stars, driftClass, opacity }) {
  return (
    <div className={`u-star-layer ${driftClass}`} style={{ position: 'absolute', inset: '-6%' }}>
      {stars.map((s) => (
        <span
          key={s.id}
          className="u-star"
          style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, borderRadius: '50%',
            background: '#fff', opacity,
            animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** Occasional shooting stars, beyond the one steady comet — spawn one every
 *  few seconds at a random angle/position/duration so the sky never feels
 *  static, without a rAF loop (each is just a self-timing CSS animation). */
function useShootingStars() {
  const [stars, setStars] = useState([]);
  useEffect(() => {
    let cancelled = false;
    let timer;
    const spawn = () => {
      if (cancelled) return;
      const id = `${Date.now()}-${Math.random()}`;
      const fromX = 10 + Math.random() * 70;
      const fromY = -4;
      const angle = 25 + Math.random() * 30;
      const dur = 1.1 + Math.random() * 0.8;
      setStars((prev) => [...prev.slice(-3), { id, fromX, fromY, angle, dur }]);
      setTimeout(() => setStars((prev) => prev.filter((s) => s.id !== id)), dur * 1000 + 200);
      timer = setTimeout(spawn, 3200 + Math.random() * 5200);
    };
    timer = setTimeout(spawn, 1800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);
  return stars;
}

export default function HomeScreen() {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const far = useStarLayer(70, [1, 1.6], 0);
  const mid = useStarLayer(40, [1.5, 2.4], 100);
  const near = useStarLayer(18, [2, 3.2], 200);
  const shootingStars = useShootingStars();

  // Three quick taps on Kawkab makes him dance — a decorative easter egg
  // only. Single taps do nothing (navigation lives in the bottom tab bar).
  const [pose, setPose] = useState('idle');
  const tapsRef = useRef([]);
  const danceTimerRef = useRef(null);
  useEffect(() => () => clearTimeout(danceTimerRef.current), []);

  // Whole-scene depth parallax — the far nebula/star layers drift opposite
  // the pointer, the near layer drifts with it, for a cheap sense of depth
  // without any WebGL. Desktop only (mousemove); no-op on touch.
  const sceneRef = useRef(null);
  function handlePointerMove(e) {
    const el = sceneRef.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--u-parallax-x', px.toFixed(3));
    el.style.setProperty('--u-parallax-y', py.toFixed(3));
  }

  // Kawkab reacts when a planet is dragged close to him — a little
  // "gravity well" feedback loop between the two systems.
  const [kawkabExcited, setKawkabExcited] = useState(false);

  function handleKawkabTap() {
    playSfx?.('click');
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 1400), now];
    if (tapsRef.current.length >= 3) {
      tapsRef.current = [];
      clearTimeout(danceTimerRef.current);
      setPose('cheer');
      danceTimerRef.current = setTimeout(() => setPose('idle'), 3000);
    }
  }

  return (
    <div
      ref={sceneRef}
      onPointerMove={handlePointerMove}
      style={{
        position: 'absolute', inset: 0, overflow: 'hidden',
        backgroundColor: '#05040c',
        '--u-parallax-x': 0, '--u-parallax-y': 0,
      }}
    >
      <div aria-hidden="true" className="u-nebula-far" style={{
        position: 'absolute', inset: '-8%',
        backgroundImage: `url("${assetUrl('Assets/proto-planets/nebula-bg.jpg')}")`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.4, filter: 'hue-rotate(20deg) saturate(1.3)', mixBlendMode: 'screen',
      }} />
      <div aria-hidden="true" className="u-nebula-near" style={{
        position: 'absolute', inset: '-8%',
        backgroundImage: `radial-gradient(ellipse 90% 70% at 50% 30%, rgba(32,22,64,0.5) 0%, rgba(10,7,22,0.72) 55%, rgba(5,4,12,0.94) 100%), url("${assetUrl('Assets/universe-nebula.webp')}")`,
        backgroundSize: 'cover, cover', backgroundPosition: 'center, center',
      }} />

      <StarLayer stars={far} driftClass="u-drift-slow" opacity={0.5} />
      <StarLayer stars={mid} driftClass="u-drift-mid" opacity={0.75} />
      <StarLayer stars={near} driftClass="u-drift-fast" opacity={0.95} />
      <div className="u-comet" />
      {shootingStars.map((s) => (
        <span
          key={s.id}
          aria-hidden="true"
          className="u-shooting-star"
          style={{
            position: 'absolute', left: `${s.fromX}%`, top: `${s.fromY}%`, width: 2, height: 2, borderRadius: '50%',
            background: '#fff', boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
            '--u-angle': `${s.angle}deg`, animationDuration: `${s.dur}s`,
          }}
        />
      ))}

      <div style={{ position: 'absolute', top: 'calc(58px + env(safe-area-inset-top))', left: 0, right: 0, textAlign: 'center', color: '#e8dcc0', padding: '0 20px' }}>
        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.75, textTransform: 'uppercase', fontWeight: 700 }}>
          {isAr ? 'كونك' : 'Your universe'}
        </div>
        <div style={{ fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontSize: 15, opacity: 0.85, marginTop: 2 }}>
          {isAr ? 'أضف كواكب لأفكارك، أو المس كوكب موجود لتعديله' : 'Add planets for your thoughts, or tap one to edit it'}
        </div>
      </div>

      <div style={{ position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%,-50%)', width: 1, height: 1 }}>
        <button
          type="button"
          onClick={handleKawkabTap}
          className={kawkabExcited ? 'u-kawkab-excited' : ''}
          style={{
            position: 'absolute', top: 0, left: 0, transform: 'translate(-50%,-50%)',
            background: 'none', border: 'none', cursor: 'pointer',
            filter: kawkabExcited ? 'drop-shadow(0 0 46px rgba(245,196,74,0.85))' : 'drop-shadow(0 0 30px rgba(120,180,255,0.55))',
            transition: 'filter 0.3s ease',
          }}
          aria-label={isAr ? 'كوكب (اضغط ثلاث مرات للرقص)' : 'Kawkab (tap 3 times to dance)'}
        >
          <CosmosCharacter size={116} glow float pose={pose} />
        </button>
      </div>

      <UniversePlanets isAr={isAr} playSfx={playSfx} onDragProximity={setKawkabExcited} />

      <style>{`
        .u-nebula-far { transform: translate(calc(var(--u-parallax-x) * -14px), calc(var(--u-parallax-y) * -14px)); transition: transform 0.15s ease-out; }
        .u-nebula-near { transform: translate(calc(var(--u-parallax-x) * 8px), calc(var(--u-parallax-y) * 8px)); transition: transform 0.15s ease-out; }
        .u-star-layer { transform: translate(calc(var(--u-parallax-x) * 18px), calc(var(--u-parallax-y) * 18px)); transition: transform 0.15s ease-out; }
        .u-star { animation-name: uTwinkle; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @keyframes uTwinkle { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        .u-drift-slow { animation: uDrift 50s ease-in-out infinite alternate; }
        .u-drift-mid { animation: uDrift 34s ease-in-out infinite alternate; }
        .u-drift-fast { animation: uDrift 20s ease-in-out infinite alternate; }
        @keyframes uDrift { from { transform: translate(0,0); } to { transform: translate(-2.5%,-1.5%); } }
        .u-comet {
          position: absolute; top: 0; left: 0; width: 3px; height: 3px; border-radius: 50%;
          background: #fff; box-shadow: 0 0 6px 2px #fff, -60px 20px 12px 0 rgba(255,255,255,0.15);
          animation: uComet 16s linear infinite;
        }
        @keyframes uComet {
          0%, 82% { opacity: 0; transform: translate(-10vw,-6vh) rotate(35deg); }
          84% { opacity: 1; }
          94% { opacity: 1; transform: translate(65vw,55vh) rotate(35deg); }
          100% { opacity: 0; transform: translate(72vw,62vh) rotate(35deg); }
        }
        .u-shooting-star { animation: uShootingStar linear forwards; }
        @keyframes uShootingStar {
          0% { opacity: 0; transform: rotate(var(--u-angle)) translateX(0); box-shadow: 0 0 6px 2px rgba(255,255,255,0.8); }
          8% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; transform: rotate(var(--u-angle)) translateX(46vh); }
        }
        .u-kawkab-excited { animation: uKawkabPulse 0.6s ease-in-out infinite; }
        @keyframes uKawkabPulse { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-50%,-50%) scale(1.06); } }
        @media (prefers-reduced-motion: reduce) {
          .u-star, .u-drift-slow, .u-drift-mid, .u-drift-fast, .u-comet, .u-shooting-star,
          .u-nebula-far, .u-nebula-near, .u-star-layer, .u-kawkab-excited { animation: none !important; transform: none !important; }
        }
      `}</style>
    </div>
  );
}
