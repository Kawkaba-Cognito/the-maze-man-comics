import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import TutorialHand3D from '../../../../shared/tutorials/TutorialHand3D';

// Lazy — same reasoning as every other Dr Kawkab spot: pulls in three.js only
// once a guided tutorial actually opens.
const AssessmentMascot3D = lazy(() => import('../../../../../../components/training/AssessmentMascot3D'));

/*
 * CancelTaskGuidedTutorial — Clash-Royale-style walkthrough: Dr Kawkab talks
 * through a speech bubble, and whenever he explains an ACTION, the 3D
 * pointer hand demonstrates it live over a small mock board (not the real
 * grid — a fixed, predictable 3x2 layout so the hand's target coordinates
 * don't depend on measuring live DOM layout).
 *
 * Swapped in ONLY for cancel-task's onboarding 'carousel' phase (see
 * index.jsx) — every other game still uses the shared TutorialCarousel.
 */

const UI = {
  en: { skip: 'Skip', next: 'Next', gotIt: "Got it, let's play!", target: 'Target' },
  ar: { skip: 'تخطّي', next: 'التالي', gotIt: 'فهمت، لنلعب!', target: 'الهدف' },
};

// Row-major 3x2 mock grid. Cells 0 and 5 match the target (a star); the rest
// are distractors. Positions are hand-picked to sit at each cell's visual
// centre for the CSS grid built below (padding 14px, gap 10px, 3 cols).
const CELLS = [
  { shape: 'star', match: true },
  { shape: 'circle', match: false },
  { shape: 'square', match: false },
  { shape: 'square', match: false },
  { shape: 'circle', match: false },
  { shape: 'star', match: true },
];
const CELL_POS = [
  { x: 0.17, y: 0.28 }, { x: 0.5, y: 0.28 }, { x: 0.83, y: 0.28 },
  { x: 0.17, y: 0.78 }, { x: 0.5, y: 0.78 }, { x: 0.83, y: 0.78 },
];
const MATCH_INDICES = CELLS.reduce((acc, c, i) => (c.match ? [...acc, i] : acc), []);

function Shape({ shape, size = 30, color = 'currentColor' }) {
  const common = { fill: color };
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: 'block' }}>
      {shape === 'star' && <polygon points="50,5 61,35 94,35 68,57 79,91 50,70 21,91 32,57 6,35 39,35" {...common} />}
      {shape === 'circle' && <circle cx="50" cy="50" r="38" {...common} />}
      {shape === 'square' && <rect x="12" y="12" width="76" height="76" rx="8" {...common} />}
    </svg>
  );
}

/** Step script. `hand: 'demo'` triggers the tap-both-matches sequence. */
function stepsFor(isAr) {
  const L = (en, ar) => (isAr ? ar : en);
  return [
    {
      speech: L(
        'The TARGET shape sits at the top — memorize it before you scan.',
        'شكل الهدف في الأعلى — احفظه قبل أن تمسح الشبكة.',
      ),
      hand: null,
    },
    {
      speech: L(
        "Tap every shape that matches the target. Watch — I'll show you.",
        'اضغط كل شكل يطابق الهدف. راقب — سأريك.',
      ),
      hand: 'demo',
    },
    {
      speech: L(
        'Clear all targets before time runs out. Ready?',
        'امسح كل الأهداف قبل انتهاء الوقت. جاهز؟',
      ),
      hand: null,
    },
  ];
}

export default function CancelTaskGuidedTutorial({ isAr, playSfx, onFinish, onSkip }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const steps = useMemo(() => stepsFor(isAr), [isAr]);
  const [stepIdx, setStepIdx] = useState(0);
  const [handTarget, setHandTarget] = useState(null);
  const [tapSignal, setTapSignal] = useState(0);
  const [matched, setMatched] = useState(() => new Set());
  const timersRef = useRef([]);

  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setHandTarget(null);
    setMatched(new Set());
    if (step.hand !== 'demo') return undefined;

    const at = (ms, fn) => { timersRef.current.push(setTimeout(fn, ms)); };
    const [a, b] = MATCH_INDICES;
    at(500, () => setHandTarget(CELL_POS[a]));
    at(1050, () => { setTapSignal((n) => n + 1); playSfx?.('collect'); setMatched((prev) => new Set(prev).add(a)); });
    at(1750, () => setHandTarget(CELL_POS[b]));
    at(2300, () => { setTapSignal((n) => n + 1); playSfx?.('collect'); setMatched((prev) => new Set(prev).add(b)); });

    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  }, [stepIdx, step.hand, playSfx]);

  const advance = () => {
    playSfx?.('click');
    if (isLast) onFinish?.({ dontShowAgain: false });
    else setStepIdx((i) => i + 1);
  };
  const skip = () => { playSfx?.('click'); onSkip?.(); };

  return (
    <div
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 18, padding: '24px 16px',
        background: 'rgba(6,5,10,0.86)', fontFamily: "'Outfit', system-ui, sans-serif",
      }}
    >
      <button
        type="button"
        onClick={skip}
        style={{
          position: 'absolute', top: 16, insetInlineEnd: 16, background: 'transparent',
          border: '1px solid rgba(240,226,192,0.35)', color: 'rgba(240,226,192,0.8)',
          borderRadius: 999, padding: '7px 16px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {t.skip}
      </button>

      {/* mock board */}
      <div
        style={{
          position: 'relative', width: 'min(360px, 82vw)', aspectRatio: '3 / 2.1',
          background: '#171018', border: '2px solid #3a2e42', borderRadius: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)', overflow: 'hidden',
        }}
      >
        <div style={{
          position: 'absolute', top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 6, background: '#2a2035',
          border: '1px solid #5a4670', borderRadius: 999, padding: '4px 12px', zIndex: 2,
        }}
        >
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: '#c9a4e8', textTransform: 'uppercase' }}>{t.target}</span>
          <Shape shape="star" size={18} color="#f0c674" />
        </div>

        <div style={{
          position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(2, 1fr)', gap: 10, padding: '38px 14px 14px',
        }}
        >
          {CELLS.map((cell, i) => {
            const isMatched = matched.has(i);
            return (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isMatched ? '#26402c' : '#241c2c',
                  border: `1.5px solid ${isMatched ? '#5fb56f' : '#3a2e42'}`,
                  borderRadius: 12, transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <Shape shape={cell.shape} size={26} color={isMatched ? '#8fe39c' : '#a894c2'} />
              </div>
            );
          })}
        </div>

        <TutorialHand3D target={handTarget} tapSignal={tapSignal} />
      </div>

      {/* Kawkab + speech bubble */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, width: 'min(420px, 92vw)' }}>
        <div style={{ width: 64, height: 74, flex: 'none' }}>
          <Suspense fallback={null}>
            <AssessmentMascot3D size={64} isAr={isAr} label={isAr ? 'د. كوكب' : 'Dr Kawkab'} onActivate={() => {}} />
          </Suspense>
        </div>
        <div style={{
          flex: 1, background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 16,
          borderEndStartRadius: 4, padding: '12px 14px', boxShadow: '3px 3px 0 rgba(26,18,8,0.18)',
        }}
        >
          <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#2d2210', lineHeight: 1.45 }}>{step.speech}</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, gap: 8 }}>
            <button
              type="button"
              onClick={advance}
              style={{
                padding: '9px 20px', borderRadius: 12, border: '2px solid #1a1208', background: '#2e8b57',
                color: '#fff', fontWeight: 900, fontSize: 13.5, cursor: 'pointer', boxShadow: '2px 2px 0 #1a1208',
              }}
            >
              {isLast ? t.gotIt : t.next}
            </button>
          </div>
        </div>
      </div>

      {/* step dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {steps.map((_, i) => (
          <span
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: i === stepIdx ? '#f0c674' : 'rgba(240,226,192,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
