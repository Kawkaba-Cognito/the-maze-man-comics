import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import MazeManAvatar from './MazeManAvatar';
import { SH } from './focusQuestData';

/* =============================================================================
 * Focus Quest tutorial — Maze Man + animated hand walkthrough.
 *
 * Main tutorial (7 steps): runs once on the first time a user enters any play
 * mode. Self-contained: renders its own demo round (5×5, 3 known targets) so
 * nothing in the real game state has to be paused or mocked.
 *
 * Mode tips (1 step each): brief Maze Man speech bubble explaining the rules
 * specific to Free or Challenge mode; shown once after the user completes the
 * main tutorial and chooses that mode.
 *
 * Persistence: localStorage key `mm_fq_tutorial_seen_v1`. Skipping counts as
 * seen — players have an explicit "?" replay button on the hub menu bar.
 * ============================================================================ */

const TUTORIAL_KEY = 'mm_fq_tutorial_seen_v1';

export function loadTutorialSeen() {
  try {
    return JSON.parse(localStorage.getItem(TUTORIAL_KEY) || '{}') || {};
  } catch {
    return {};
  }
}
export function saveTutorialSeen(map) {
  try {
    localStorage.setItem(TUTORIAL_KEY, JSON.stringify(map || {}));
  } catch {}
}
export function markTutorialSeen(key) {
  const m = loadTutorialSeen();
  m[key] = true;
  saveTutorialSeen(m);
}
export function resetTutorialSeen() {
  saveTutorialSeen({});
}

/** Build the queue of tutorials to play before launching `modeKind`.
 *  Returns [] when nothing to show. */
export function buildTutorialQueueFor(modeKind) {
  const seen = loadTutorialSeen();
  const q = [];
  if (!seen.main) q.push({ kind: 'main' });
  if (modeKind === 'free' && !seen.free) q.push({ kind: 'free-tip' });
  if (modeKind === 'challenge' && !seen.challenge) q.push({ kind: 'challenge-tip' });
  return q;
}

const STR = {
  en: {
    skip: 'Skip',
    back: 'Back',
    next: 'Next',
    done: 'Got it!',
    start: "Let's go!",
    progress: (n, t) => `${n} / ${t}`,
    bannerCue: 'Tap every tile that matches this.',
    timeLbl: 'Time',
    foundLbl: 'Found',
    strikesLbl: 'Strikes',
    main: {
      welcome: "Hi! I'm Maze Man. I'll show you the ropes in 30 seconds.",
      target: 'This is your target — the shape (and colour, on harder rounds) you need to find.',
      firstTap: 'Tap any tile that matches it. Watch my hand!',
      practiceTap: 'Your turn! Find the other matching tiles to continue.',
      timer: 'In a real round, beat this timer. When the bar empties, the round ends.',
      strikes: 'Wrong taps cost time. In Free mode, three wrong taps end your run.',
      ready: "That's it — you're ready, friend. Good luck out there!",
    },
    free: 'Free mode: one timer for the whole run. Each clear adds time. Three wrong taps end it. Play as long as you can!',
    challenge: 'Challenge mode: every player faces the EXACT same grid. Hand the device around and compare scores fairly!',
    replayHint: 'Replay tutorial',
  },
  ar: {
    skip: 'تخطّي',
    back: 'السابق',
    next: 'التالي',
    done: 'فهمت!',
    start: 'لنبدأ!',
    progress: (n, t) => `${n} / ${t}`,
    bannerCue: 'انقر كل مربع يطابق هذا.',
    timeLbl: 'الوقت',
    foundLbl: 'مُوجَد',
    strikesLbl: 'الأخطاء',
    main: {
      welcome: 'أهلًا! أنا Maze Man. سأشرح لك الطريقة في 30 ثانية.',
      target: 'هذا هو الشكل المطلوب — تبحث عن الشكل (واللون في المراحل الأصعب).',
      firstTap: 'انقر على أي مربع يطابقه. راقب يدي!',
      practiceTap: 'دورك! ابحث عن باقي المربعات المطابقة للمتابعة.',
      timer: 'في الجولة الحقيقية اسبق هذا المؤقت. عند فراغ الشريط تنتهي الجولة.',
      strikes: 'النقرات الخاطئة تكلف وقتًا. في الوضع الحر ثلاث أخطاء تنهي المحاولة.',
      ready: 'هذا كل شيء — أنت جاهز يا صديقي. حظًا موفقًا!',
    },
    free: 'الوضع الحر: مؤقت واحد للجولة كاملة. كل إكمال يضيف وقتًا. ثلاث أخطاء تنهي المحاولة. العب أطول ما يمكن!',
    challenge: 'وضع التحدي: كل اللاعبين يلعبون نفس الشبكة بالضبط. سلّم الجهاز للجميع وقارنوا النتائج بإنصاف!',
    replayHint: 'إعادة الشرح',
  },
};

/** Pointing-finger SVG. Renders inline so colour and drop-shadow scale freely. */
function PointingHand({ size = 60 }) {
  const gradId = `fq-tut-hand-${React.useId().replace(/:/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde2bf" />
          <stop offset="100%" stopColor="#d39459" />
        </linearGradient>
      </defs>
      <path
        d="M28 4 C25.5 4 23.5 6 23.5 9 L23.5 28 L20 30 C15 32.5 11 36 11 42 L11 51 C11 55 13.5 57.5 17.5 57.5 L41 57.5 C45 57.5 49 54.5 49 49.5 L49 36 C49 33 47 31 44 31 L34.5 31 L34.5 9 C34.5 6 32.5 4 30 4 Z"
        fill={`url(#${gradId})`}
        stroke="#7a4a1f"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Highlight on the finger pad */}
      <ellipse cx="29" cy="11" rx="3" ry="4.5" fill="#fff5e0" opacity="0.55" />
    </svg>
  );
}

/* ---------------------------------------------------------------------------
 * Demo round content for the main tutorial.
 *
 * Fixed seed: a 4×4 grid (compact enough to fit above the speech-bubble dock
 * on small phones), three target stars (orange) at known indices. The
 * remaining 13 cells are filled deterministically so the hand can point at
 * the first-target cell reliably across every run. Distractors avoid the
 * target shape so the categorical-search rule reads cleanly.
 * --------------------------------------------------------------------------- */
const DEMO = {
  grid: 4,
  target: 'star',
  targetCol: '#e8a07a',
  targetIndices: [5, 10, 13], // row 1 col 1, row 2 col 2, row 3 col 1
  distShapes: ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'heart'],
  distCols: ['#7ab87a', '#7ab8c4', '#9a7ab8', '#c4a87a', '#b696d4'],
};

function buildDemoCells() {
  const cells = [];
  for (let i = 0; i < DEMO.grid * DEMO.grid; i++) {
    if (DEMO.targetIndices.includes(i)) {
      cells.push({
        id: i,
        shape: DEMO.target,
        fill: DEMO.targetCol,
        isT: true,
        tapped: false,
        feedback: null,
      });
    } else {
      cells.push({
        id: i,
        shape: DEMO.distShapes[(i * 7 + 3) % DEMO.distShapes.length],
        fill: DEMO.distCols[(i * 11 + 5) % DEMO.distCols.length],
        isT: false,
        tapped: false,
        feedback: null,
      });
    }
  }
  return cells;
}

function ShapeSvg({ shape, color, size = 36 }) {
  const inner = SH[shape] || SH.circle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ color, display: 'block' }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

/* ---------------------------------------------------------------------------
 * Public entry: chooses the right sub-component for `kind`.
 * --------------------------------------------------------------------------- */
export default function FocusQuestTutorial({ kind, isAr, onClose, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  if (kind === 'main') {
    return <MainTutorial t={t} isAr={isAr} onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'free-tip') {
    return (
      <ModeTip
        t={t}
        isAr={isAr}
        text={t.free}
        mood="ready"
        emoji="♾️"
        onClose={onClose}
        playSfx={playSfx}
      />
    );
  }
  if (kind === 'challenge-tip') {
    return (
      <ModeTip
        t={t}
        isAr={isAr}
        text={t.challenge}
        mood="focused"
        emoji="⚔️"
        onClose={onClose}
        playSfx={playSfx}
      />
    );
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * Mode tip — tiny single-screen overlay with Maze Man + a one-liner.
 * --------------------------------------------------------------------------- */
function ModeTip({ t, isAr, text, mood, emoji, onClose, playSfx }) {
  return (
    <div className="ct-fq-tut-root" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-tip">
        <div className="ct-fq-tut-tip-avatar">
          <MazeManAvatar size={120} mood={mood} glow />
        </div>
        <div className="ct-fq-tut-tip-bubble">
          <div className="ct-fq-tut-tip-emoji" aria-hidden="true">{emoji}</div>
          <p className="ct-fq-tut-tip-text">{text}</p>
          <button
            type="button"
            className="ct-fq-tut-btn ct-fq-tut-btn-pri"
            onClick={() => { playSfx?.('click'); onClose?.(); }}
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Main tutorial — 7 steps. Hosts its own demo state.
 * --------------------------------------------------------------------------- */
const STEPS = ['welcome', 'target', 'firstTap', 'practiceTap', 'timer', 'strikes', 'ready'];

function MainTutorial({ t, isAr, onClose, playSfx }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [cells, setCells] = useState(() => buildDemoCells());
  const [shake, setShake] = useState(false);
  const [handPos, setHandPos] = useState(null);
  const shakeTimerRef = useRef(0);
  const autoTapTimerRef = useRef(0);
  const advanceTimerRef = useRef(0);
  const cardRef = useRef(null);
  const step = STEPS[stepIdx];

  const foundCount = cells.filter((c) => c.isT && c.tapped).length;
  const targetCount = DEMO.targetIndices.length;

  // Auto-tap the first target during step 'firstTap', then advance.
  useEffect(() => {
    if (step !== 'firstTap') return undefined;
    autoTapTimerRef.current = setTimeout(() => {
      setCells((prev) =>
        prev.map((c) =>
          c.id === DEMO.targetIndices[0] && !c.tapped
            ? { ...c, tapped: true, feedback: 'ok' }
            : c,
        ),
      );
      playSfx?.('collect');
      advanceTimerRef.current = setTimeout(() => setStepIdx((s) => s + 1), 900);
    }, 1100);
    return () => {
      clearTimeout(autoTapTimerRef.current);
      clearTimeout(advanceTimerRef.current);
    };
  }, [step, playSfx]);

  // Auto-advance from 'practiceTap' as soon as the player has found all 3 targets.
  useEffect(() => {
    if (step !== 'practiceTap') return undefined;
    if (foundCount >= targetCount) {
      advanceTimerRef.current = setTimeout(() => setStepIdx((s) => s + 1), 650);
      return () => clearTimeout(advanceTimerRef.current);
    }
    return undefined;
  }, [step, foundCount, targetCount]);

  // Cleanup on unmount.
  useEffect(() => () => {
    clearTimeout(autoTapTimerRef.current);
    clearTimeout(advanceTimerRef.current);
    clearTimeout(shakeTimerRef.current);
  }, []);

  const onCellTap = (idx) => {
    // Cell taps are interactive only during 'practiceTap'.
    if (step !== 'practiceTap') return;
    setCells((prev) => {
      const c = prev[idx];
      if (!c || c.tapped) return prev;
      if (c.isT) {
        playSfx?.('collect');
        return prev.map((x) => (x.id === idx ? { ...x, tapped: true, feedback: 'ok' } : x));
      }
      playSfx?.('error');
      setShake(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setShake(false);
        shakeTimerRef.current = 0;
      }, 320);
      return prev.map((x) =>
        x.id === idx ? { ...x, tapped: true, feedback: 'bad' } : x,
      );
    });
  };

  const skip = () => {
    playSfx?.('click');
    onClose?.();
  };
  const next = () => {
    playSfx?.('click');
    setStepIdx((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => {
    playSfx?.('click');
    setStepIdx((s) => Math.max(s - 1, 0));
  };
  const finish = () => {
    playSfx?.('win');
    onClose?.();
  };

  // Re-measure the hand anchor whenever the step changes or the card layout
  // settles (font load, language flip). Position is fixed-viewport so it never
  // gets confused by parent containing-block changes.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) {
      setHandPos(null);
      return undefined;
    }
    let raf = 0;
    const measure = () => {
      let anchorEl = null;
      let tilt = -10;
      let tap = false;
      if (step === 'target') {
        anchorEl = card.querySelector('[data-tut-anchor="banner"]');
        tilt = -10;
      } else if (step === 'firstTap') {
        anchorEl = card.querySelector(`[data-tut-cell="${DEMO.targetIndices[0]}"]`);
        tilt = -16;
        tap = true;
      } else if (step === 'timer') {
        anchorEl = card.querySelector('[data-tut-anchor="time"]');
        tilt = -10;
      } else if (step === 'strikes') {
        anchorEl = card.querySelector('[data-tut-anchor="strikes"]');
        tilt = 16;
      }
      if (!anchorEl) {
        setHandPos(null);
        return;
      }
      const r = anchorEl.getBoundingClientRect();
      // Aim the fingertip slightly above the anchor centre so the finger pad
      // visibly overlays the target instead of the palm.
      const offsetY = step === 'firstTap' ? -6 : -10;
      setHandPos({
        x: r.left + r.width / 2,
        y: r.top + r.height / 2 + offsetY,
        tilt,
        tap,
      });
    };
    measure();
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(card);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      ro.disconnect();
    };
  }, [step]);

  // Mood per step.
  const mood = step === 'welcome'
    ? 'ready'
    : step === 'practiceTap'
      ? 'focused'
      : step === 'strikes'
        ? 'tired'
        : step === 'ready'
          ? 'proud'
          : 'focused';

  // Spotlight target — highlights the relevant chrome by adding a class.
  const spotlightClass = step === 'target'
    ? 'spot-banner'
    : step === 'firstTap'
      ? 'spot-cell-1'
      : step === 'timer'
        ? 'spot-time'
        : step === 'strikes'
          ? 'spot-strikes'
          : '';

  const speech = t.main[step];

  return (
    <div
      className={`ct-fq-tut-root ct-fq-tut-main ${spotlightClass}`}
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="ct-fq-tut-backdrop" />

      {/* Demo "round" UI — all controlled by the tutorial. */}
      <div className="ct-fq-tut-card" ref={cardRef}>
        <div className="ct-fq-tut-hud" data-tut-anchor="hud">
          <div className="ct-fq-tut-hud-stat ct-fq-tut-hud-time">
            <div className="ct-fq-tut-hud-val">12.0s</div>
            <div className="ct-fq-tut-hud-lbl">{t.timeLbl}</div>
          </div>
          <div className="ct-fq-tut-hud-stat">
            <div className="ct-fq-tut-hud-val">{foundCount}/{targetCount}</div>
            <div className="ct-fq-tut-hud-lbl">{t.foundLbl}</div>
          </div>
          <div className="ct-fq-tut-hud-stat ct-fq-tut-hud-strikes" data-tut-anchor="strikes">
            <div className="ct-fq-tut-hud-val">0/3</div>
            <div className="ct-fq-tut-hud-lbl">{t.strikesLbl}</div>
          </div>
        </div>

        <div className="ct-fq-tut-timebar" data-tut-anchor="time">
          <div className="ct-fq-tut-timebar-fill" />
        </div>

        <div className="ct-fq-tut-banner" data-tut-anchor="banner">
          <div className="ct-fq-tut-banner-icon">
            <ShapeSvg shape={DEMO.target} color={DEMO.targetCol} size={32} />
          </div>
          <span className="ct-fq-tut-banner-cue">{t.bannerCue}</span>
        </div>

        <div className={`ct-fq-tut-grid${shake ? ' shake' : ''}`}>
          {cells.map((c) => (
            <button
              key={c.id}
              type="button"
              data-tut-cell={c.id}
              className={`ct-fq-tut-cell${c.feedback === 'ok' ? ' ok' : ''}${c.feedback === 'bad' ? ' bad' : ''}`}
              disabled={c.tapped || step !== 'practiceTap'}
              onClick={() => onCellTap(c.id)}
              aria-label={c.isT ? 'Target tile' : 'Distractor tile'}
            >
              <ShapeSvg shape={c.shape} color={c.fill} size={28} />
              {c.feedback === 'ok' && <span className="ct-fq-tut-ck">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Pointing hand — fixed to viewport coordinates measured from the
          current step's anchor element. Sits above the card on z-index. */}
      {handPos && (
        <div
          className={`ct-fq-tut-hand${handPos.tap ? ' tap' : ''}`}
          style={{
            left: `${handPos.x}px`,
            top: `${handPos.y}px`,
            transform: `translate(-50%, -50%) rotate(${handPos.tilt || 0}deg)`,
          }}
        >
          <PointingHand size={56} />
        </div>
      )}

      {/* Maze Man + speech bubble dock — bottom of the screen. */}
      <div className="ct-fq-tut-dock">
        <div className="ct-fq-tut-dock-mm">
          <MazeManAvatar size={92} mood={mood} glow />
        </div>
        <div className="ct-fq-tut-bubble">
          <div className="ct-fq-tut-bubble-progress">
            {t.progress(stepIdx + 1, STEPS.length)}
          </div>
          <p className="ct-fq-tut-bubble-text">{speech}</p>
          <div className="ct-fq-tut-bubble-actions">
            {stepIdx === 0 && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>
                  {t.skip}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>
                  {t.start}
                </button>
              </>
            )}
            {stepIdx > 0 && stepIdx < STEPS.length - 1 && step !== 'practiceTap' && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>
                  {t.skip}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={back}>
                  {t.back}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>
                  {t.next}
                </button>
              </>
            )}
            {step === 'practiceTap' && (
              <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>
                {t.skip}
              </button>
            )}
            {stepIdx === STEPS.length - 1 && (
              <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={finish}>
                {t.done}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
