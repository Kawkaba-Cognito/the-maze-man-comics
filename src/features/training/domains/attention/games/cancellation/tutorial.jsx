import React, { useEffect, useRef, useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import { SH } from '../../../../shared/focusQuestData';

/* =============================================================================
 * Focus Quest tutorial — short text + demo board (no pointers or arrows).
 *
 * Main tutorial (7 steps): runs once on the first time a user enters any play
 * mode. Self-contained: renders its own demo round (4×4, 3 known targets) so
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
    progress: (n, t) => `Step ${n} of ${t}`,
    bannerCue: 'Tap every tile that matches this.',
    timeLbl: 'Time',
    foundLbl: 'Found',
    strikesLbl: 'Strikes',
    main: {
      welcome: {
        title: 'Focus Quest',
        body:
          'Tap every tile that matches the shape in the banner. A few short screens — use Next or Skip.',
      },
      target: {
        title: 'Match the banner',
        body:
          'Same shape as the banner counts (on harder modes, same colour too). Ignore everything else.',
      },
      firstTap: {
        title: 'A correct tap',
        body:
          'The board plays one hit for you so you can see a tile clear as found.',
      },
      practiceTap: {
        title: 'Try it',
        body:
          'Tap every tile that matches the banner. Wrong shapes only shake here — it is practice.',
      },
      timer: {
        title: 'Time',
        body:
          'The bar is your countdown. When it is empty, the round ends.',
      },
      strikes: {
        title: 'Mistakes',
        body:
          'Wrong taps add strikes. In Free mode, three strikes end the run.',
      },
      ready: {
        title: 'Ready',
        body:
          'Match the banner, watch the bar, and tap carefully.',
      },
    },
    free:
      'Free mode: one session timer. Each full clear adds only a little time — the clock should feel tight. Earn score on every correct tap and a bigger chunk when you clear a round; streaks of clears multiply that bonus. Wrong taps cost score & build strikes — three strikes end the run.',
    challenge: 'Challenge mode: every player faces the EXACT same grid. Hand the device around and compare scores fairly!',
    replayHint: 'Replay tutorial',
  },
  ar: {
    skip: 'تخطّي',
    back: 'السابق',
    next: 'التالي',
    done: 'فهمت!',
    start: 'لنبدأ!',
    progress: (n, t) => `الخطوة ${n} من ${t}`,
    bannerCue: 'انقر كل مربع يطابق هذا.',
    timeLbl: 'الوقت',
    foundLbl: 'مُوجَد',
    strikesLbl: 'الأخطاء',
    main: {
      welcome: {
        title: 'مهمة التركيز',
        body:
          'انقر كل مربع يطابق شكل الشريط في الأعلى. بضع شاشات قصيرة — التالي أو التخطّي.',
      },
      target: {
        title: 'طابق الشريط',
        body:
          'نفس شكل الشريط فقط (وفي مستويات أصعب نفس اللون أيضاً). تجاهل الباقي.',
      },
      firstTap: {
        title: 'نقرة صحيحة',
        body:
          'نؤدي نقرة واحدة تلقائياً لترى كيف يُعلَّم المربع كـ«مُوجَد».',
      },
      practiceTap: {
        title: 'جرّب',
        body:
          'انقر كل مربع يطابق الشريط. الشكل الخاطئ يهتز هنا فقط — هذه تجربة.',
      },
      timer: {
        title: 'الوقت',
        body:
          'الشريط يعدّ تنازلياً. عندما ينفد تنتهي الجولة.',
      },
      strikes: {
        title: 'الأخطاء',
        body:
          'النقر الخاطئ يزيد الأخطاء. في الوضع الحر ثلاثة أخطاء تنهي المحاولة.',
      },
      ready: {
        title: 'جاهز',
        body:
          'طابق الشريط، راقب الشريط، وانقر بهدوء.',
      },
    },
    free:
      'الوضع الحر: مؤقت واحد للجولة. كل إكمال كامل يضيف وقتاً قليلاً فقط — ابقَ تحت ضغط الوقت. اجمع نقاطاً بكل نقرة صحيحة ومكافأة أكبر عند إكمال الجولة؛ سلسلة إكمالات متتالية تزيد المكافأة. النقر الخاطئ يخصم نقاطاً ويصبح خطأً — ثلاثة أخطاء تنهي المحاولة.',
    challenge: 'وضع التحدي: كل اللاعبين يلعبون نفس الشبكة بالضبط. سلّم الجهاز للجميع وقارنوا النتائج بإنصاف!',
    replayHint: 'إعادة الشرح',
  },
};

/* ---------------------------------------------------------------------------
 * Demo round content for the main tutorial.
 *
 * Fixed seed: a 4×4 grid (compact enough to fit above the speech-bubble dock
 * on small phones), three target stars at known indices. Remaining cells are
 * filled deterministically. Distractors avoid the target shape so the rule
 * reads cleanly.
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
function ModeTip({ t, isAr, text, mood, onClose, playSfx }) {
  return (
    <div className="ct-fq-tut-root" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-tip">
        <div className="ct-fq-tut-tip-avatar">
          <MazeManAvatar size={120} mood={mood} glow />
        </div>
        <div className="ct-fq-tut-tip-bubble">
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
  const shakeTimerRef = useRef(0);
  const autoTapTimerRef = useRef(0);
  const advanceTimerRef = useRef(0);
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
    : step === 'timer'
      ? 'spot-time'
      : step === 'strikes'
        ? 'spot-strikes'
        : '';

  const stepCopy = t.main[step];

  return (
    <div
      className={`ct-fq-tut-root ct-fq-tut-main ${spotlightClass}`}
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="ct-fq-tut-backdrop" />

      {/* Demo "round" UI — all controlled by the tutorial. */}
      <div className="ct-fq-tut-card">
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

      {/* Maze Man + speech bubble dock — bottom of the screen. */}
      <div className="ct-fq-tut-dock">
        <div className="ct-fq-tut-dock-mm">
          <MazeManAvatar size={92} mood={mood} glow />
        </div>
        <div className="ct-fq-tut-bubble">
          <div className="ct-fq-tut-bubble-progress" aria-live="polite">
            {t.progress(stepIdx + 1, STEPS.length)}
          </div>
          <h3 className="ct-fq-tut-bubble-title">{stepCopy.title}</h3>
          <p className="ct-fq-tut-bubble-text">{stepCopy.body}</p>
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
