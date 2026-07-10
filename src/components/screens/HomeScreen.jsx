import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import { DOMAINS, DOMAIN_COLOR } from '../training/trainingData';
import { loadHabits, getTodayProgress, computeStreak } from '../../features/relax/habitState';

/*
 * Home — "Your Universe". A living scene, not a dashboard: multi-layer
 * parallax starfield (CSS transform/opacity only, no rAF/canvas loop),
 * Kawkab glowing at the center, three real "planets" (Training/Streak/
 * Recovery) in actual CSS orbit around it, an occasional comet.
 * `prefers-reduced-motion` disables all motion. See project_home_prototypes
 * memory for the four earlier directions this superseded.
 */

function todaysDomain() {
  const dayIdx = Math.floor(Date.now() / 86400000);
  return DOMAINS[dayIdx % DOMAINS.length];
}

function useHomeData() {
  return useMemo(() => {
    const st = loadHabits();
    const progress = getTodayProgress(st);
    const streak = computeStreak(st);
    return { progress, streak, domain: todaysDomain() };
  }, []);
}

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

function OrbitPlanet({ radiusVw, radiusMaxPx, duration, delay = 0, reverse, color, icon, label, sub, onClick }) {
  const dir = reverse ? ' reverse' : '';
  // Radius scales with viewport width (clamped) so orbits never push planets
  // off-screen on a narrow phone — the primary device this actually runs on.
  const r = `min(${radiusMaxPx}px, ${radiusVw}vw)`;
  return (
    <div
      className="u-orbit"
      style={{
        position: 'absolute', top: '50%', left: '50%', pointerEvents: 'none',
        width: `calc(${r} * 2)`, height: `calc(${r} * 2)`,
        marginTop: `calc(${r} * -1)`, marginLeft: `calc(${r} * -1)`,
        animation: `uOrbit ${duration}s linear infinite${dir}`, animationDelay: `-${delay}s`,
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '50%' }}>
        <button
          type="button"
          onClick={onClick}
          className="u-orbit-inner"
          style={{
            transform: 'translate(-50%,-50%)',
            animation: `uOrbitCounter ${duration}s linear infinite${dir}`, animationDelay: `-${delay}s`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, pointerEvents: 'auto',
          }}
        >
          <span style={{
            width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, background: `radial-gradient(circle at 35% 30%, #fff8, ${color})`,
            boxShadow: `0 0 16px ${color}aa, 0 0 4px #fff6 inset`,
          }}>
            {icon}
          </span>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#f3ecd8', textShadow: '0 1px 3px rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>
            {label}
          </span>
          {sub ? <span style={{ fontSize: 9, color: '#c9bfe0', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{sub}</span> : null}
        </button>
      </div>
    </div>
  );
}

export default function HomeScreen() {
  const { currentLang, playSfx, switchTab } = useApp();
  const isAr = currentLang === 'ar';
  const data = useHomeData();
  const far = useStarLayer(70, [1, 1.6], 0);
  const mid = useStarLayer(40, [1.5, 2.4], 100);
  const near = useStarLayer(18, [2, 3.2], 200);
  const { progress, streak, domain } = data;
  const domainName = isAr && domain.nameAr ? domain.nameAr : domain.name;
  const suggestTraining = progress.done < progress.total || progress.total === 0;
  const [callout, setCallout] = useState(null);

  // Three quick taps on Kawkab makes him dance instead of navigating —
  // a single deliberate tap still continues as normal, so the "continue"
  // action is held for a beat to see if more taps are coming.
  const [pose, setPose] = useState('idle');
  const tapsRef = useRef([]);
  const continueTimerRef = useRef(null);
  const danceTimerRef = useRef(null);
  useEffect(() => () => {
    clearTimeout(continueTimerRef.current);
    clearTimeout(danceTimerRef.current);
  }, []);

  function handleKawkabTap() {
    playSfx?.('click');
    const now = Date.now();
    tapsRef.current = [...tapsRef.current.filter((t) => now - t < 1400), now];
    if (tapsRef.current.length >= 3) {
      tapsRef.current = [];
      clearTimeout(continueTimerRef.current);
      clearTimeout(danceTimerRef.current);
      setPose('cheer');
      danceTimerRef.current = setTimeout(() => setPose('idle'), 3000);
      return;
    }
    clearTimeout(continueTimerRef.current);
    continueTimerRef.current = setTimeout(() => {
      tapsRef.current = [];
      switchTab(suggestTraining ? 'comics' : 'wellbeing');
    }, 350);
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(ellipse 90% 70% at 50% 30%, #201640 0%, #0a0716 55%, #05040c 100%)' }}>
      <StarLayer stars={far} driftClass="u-drift-slow" opacity={0.5} />
      <StarLayer stars={mid} driftClass="u-drift-mid" opacity={0.75} />
      <StarLayer stars={near} driftClass="u-drift-fast" opacity={0.95} />
      <div className="u-comet" />

      <div style={{ position: 'absolute', top: 'calc(58px + env(safe-area-inset-top))', left: 0, right: 0, textAlign: 'center', color: '#e8dcc0', padding: '0 20px' }}>
        <div style={{ fontSize: 12, letterSpacing: 2, opacity: 0.75, textTransform: 'uppercase', fontWeight: 700 }}>
          {isAr ? 'كونك' : 'Your universe'}
        </div>
        <div style={{ fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontSize: 15, opacity: 0.85, marginTop: 2 }}>
          {isAr ? 'المس أي كوكب، أو المس كوكب نفسه للاستمرار' : 'Tap a planet, or tap Kawkab to just continue'}
        </div>
      </div>

      <div style={{ position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%,-50%)', width: 1, height: 1 }}>
        <button
          type="button"
          onClick={handleKawkabTap}
          style={{
            position: 'absolute', top: 0, left: 0, transform: 'translate(-50%,-50%)',
            background: 'none', border: 'none', cursor: 'pointer', filter: 'drop-shadow(0 0 30px rgba(120,180,255,0.55))',
          }}
          aria-label={isAr ? 'استمر (اضغط ثلاث مرات للرقص)' : 'Continue (tap 3 times to dance)'}
        >
          <CosmosCharacter size={116} glow float pose={pose} />
        </button>

        <OrbitPlanet
          radiusVw={20} radiusMaxPx={82} duration={26} color={DOMAIN_COLOR[domain.id]} icon="🎯"
          label={isAr ? 'تدريب' : 'Training'} sub={domainName}
          onClick={() => { playSfx?.('click'); switchTab('comics'); }}
        />
        <OrbitPlanet
          radiusVw={30} radiusMaxPx={130} duration={34} delay={11} reverse color="#e8ac4e" icon="🔥"
          label={isAr ? 'السلسلة' : 'Streak'} sub={`${streak}${isAr ? ' يوم' : 'd'}`}
          onClick={() => { playSfx?.('click'); setCallout('streak'); }}
        />
        <OrbitPlanet
          radiusVw={40} radiusMaxPx={175} duration={42} delay={22} color="#5aa9c8" icon="🌿"
          label={isAr ? 'راحة' : 'Recovery'}
          onClick={() => { playSfx?.('click'); switchTab('wellbeing'); }}
        />
      </div>

      {callout && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setCallout(null)}
          style={{
            position: 'absolute', bottom: 'calc(96px + env(safe-area-inset-bottom))', left: 0, right: 0, textAlign: 'center', cursor: 'pointer',
          }}
        >
          <span style={{
            display: 'inline-block', padding: '10px 18px', borderRadius: 100, background: 'rgba(20,14,34,0.85)',
            border: '1px solid rgba(232,172,78,0.5)', color: '#f3ecd8', fontSize: 13, fontWeight: 700,
          }}>
            🔥 {isAr
              ? `سلسلة ${streak} يوم · تم ${progress.done} من ${progress.total} اليوم`
              : `${streak}-day streak · ${progress.done} of ${progress.total} done today`}
          </span>
        </div>
      )}

      <style>{`
        .u-star { animation-name: uTwinkle; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @keyframes uTwinkle { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }
        .u-drift-slow { animation: uDrift 50s ease-in-out infinite alternate; }
        .u-drift-mid { animation: uDrift 34s ease-in-out infinite alternate; }
        .u-drift-fast { animation: uDrift 20s ease-in-out infinite alternate; }
        @keyframes uDrift { from { transform: translate(0,0); } to { transform: translate(-2.5%,-1.5%); } }
        @keyframes uOrbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes uOrbitCounter { from { transform: translate(-50%,-50%) rotate(0deg); } to { transform: translate(-50%,-50%) rotate(-360deg); } }
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
        @media (prefers-reduced-motion: reduce) {
          .u-star, .u-drift-slow, .u-drift-mid, .u-drift-fast, .u-orbit, .u-orbit-inner, .u-comet { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
