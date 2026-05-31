import React, { useState, useEffect, useRef } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';

const TUTORIAL_KEY = 'mm_rh_tutorial_seen_v1';

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
export function markRhTutorialSeen(key) {
  const m = loadTutorialSeen();
  m[key] = true;
  saveTutorialSeen(m);
}

export function buildRhTutorialQueueFor(modeKind) {
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
    main: {
      welcome: {
        title: 'Rush Hour',
        body: 'Slide the cars to clear a path for the gold car to escape through the exit on the right.',
      },
      goal: {
        title: 'The Goal',
        body: 'The gold car (Maze Man) must reach the right edge. Other cars block its path.',
      },
      sliding: {
        title: 'How to Move',
        body: 'Drag any car along its lane. Horizontal cars slide left/right, vertical cars slide up/down.',
      },
      blocked: {
        title: 'Plan Ahead',
        body: 'Cars cannot pass through each other. Move blockers out of the way first.',
      },
      par: {
        title: 'Par Moves',
        body: 'Each puzzle has a "par" — the minimum moves needed. Try to match or beat it!',
      },
      ready: {
        title: 'Ready!',
        body: 'Slide, think, solve. Fewer moves = better score.',
      },
    },
    free: 'Free mode: endless puzzles that get harder. Each puzzle has its own timer — solve it in time. You have 3 lives; run out of time on a puzzle and you lose one. Fewer moves score more. The run ends at zero lives.',
    challenge: 'Pass n Play: every player faces the same puzzle. Hand the device around — lowest average moves wins!',
  },
  ar: {
    skip: 'تخطّي',
    back: 'السابق',
    next: 'التالي',
    done: 'فهمت!',
    start: 'لنبدأ!',
    progress: (n, t) => `الخطوة ${n} من ${t}`,
    main: {
      welcome: {
        title: 'طريق الخروج',
        body: 'حرّك السيارات لتفتح طريقاً للسيارة الذهبية لتخرج من الفتحة على اليمين.',
      },
      goal: {
        title: 'الهدف',
        body: 'السيارة الذهبية (رجل المتاهة) يجب أن تصل للحافة اليمنى. السيارات الأخرى تسدّ طريقها.',
      },
      sliding: {
        title: 'كيف تتحرك',
        body: 'اسحب أي سيارة في مسارها. السيارات الأفقية تتحرك يميناً/يساراً، والعمودية أعلى/أسفل.',
      },
      blocked: {
        title: 'خطّط مسبقاً',
        body: 'السيارات لا تستطيع المرور عبر بعضها. حرّك العوائق أولاً.',
      },
      par: {
        title: 'الحركات المثالية',
        body: 'لكل لغز عدد "مثالي" — أقل حركات مطلوبة. حاول تحقيقه!',
      },
      ready: {
        title: 'جاهز!',
        body: 'حرّك، فكّر، حُل. حركات أقل = نتيجة أفضل.',
      },
    },
    free: 'الوضع الحر: ألغاز لا تنتهي وتزداد صعوبة. لكل لغز مؤقته — حلّه في الوقت. لديك ٣ أرواح؛ إذا نفد وقت لغز تخسر روحاً. حركات أقل = نقاط أكثر. تنتهي المحاولة عند نفاد الأرواح.',
    challenge: 'مرّر والعب: كل اللاعبين يلعبون نفس اللغز. سلّم الجهاز — أقل متوسط حركات يفوز!',
  },
};

const DEMO_PIECES = [
  { id: 'hero', row: 2, col: 0, len: 2, dir: 'h', isHero: true },
  { id: 'A', row: 0, col: 2, len: 3, dir: 'v' },
  { id: 'B', row: 1, col: 4, len: 2, dir: 'v' },
  { id: 'C', row: 0, col: 0, len: 2, dir: 'h' },
  { id: 'D', row: 4, col: 1, len: 2, dir: 'h' },
  { id: 'E', row: 3, col: 3, len: 2, dir: 'h' },
];
const DEMO_GRID = 6;
const DEMO_EXIT_ROW = 2;

const HERO_FILL = '#f5c44a';
const CAR_FILLS = ['#7ab090', '#8888a8', '#a08868', '#c08060', '#8fb8c8'];

function pieceColor(pid) {
  if (pid === 'hero') return HERO_FILL;
  const i = (pid.charCodeAt(0) - 65) % CAR_FILLS.length;
  return CAR_FILLS[i];
}

function DemoBoard({ step, animateSlide }) {
  const cellPx = 38;
  const gap = 3;
  const boardPx = cellPx * DEMO_GRID + gap * (DEMO_GRID - 1);

  const pieces = animateSlide ? animateSlide : DEMO_PIECES;

  return (
    <div
      style={{
        position: 'relative',
        width: boardPx,
        height: boardPx,
        margin: '0 auto',
        background: '#f3ebe4',
        borderRadius: 10,
        border: '2px solid #1a1208',
        boxShadow: '4px 4px 0 #1a1208',
      }}
    >
      {/* Grid lines */}
      {Array.from({ length: DEMO_GRID }, (_, i) =>
        Array.from({ length: DEMO_GRID }, (_, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              position: 'absolute',
              left: j * (cellPx + gap),
              top: i * (cellPx + gap),
              width: cellPx,
              height: cellPx,
              borderRadius: 4,
              background: '#e8dfd0',
            }}
          />
        )),
      )}

      {/* Exit marker */}
      <div
        style={{
          position: 'absolute',
          right: -8,
          top: DEMO_EXIT_ROW * (cellPx + gap) + cellPx / 2 - 8,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: step === 'goal' ? '#f5c44a' : '#e8c47a',
          border: '2px solid #1a1208',
          boxShadow: step === 'goal' ? '0 0 8px #f5c44a' : 'none',
          transition: 'box-shadow 0.3s',
        }}
      />

      {/* Pieces */}
      {pieces.map((p) => {
        const w = p.dir === 'h' ? p.len * cellPx + (p.len - 1) * gap : cellPx;
        const h = p.dir === 'v' ? p.len * cellPx + (p.len - 1) * gap : cellPx;
        const left = p.col * (cellPx + gap);
        const top = p.row * (cellPx + gap);
        const highlight = p.isHero && (step === 'goal' || step === 'welcome');
        return (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left,
              top,
              width: w,
              height: h,
              borderRadius: 6,
              background: pieceColor(p.id),
              border: `2px solid ${highlight ? '#c8881e' : '#1a1208'}`,
              boxShadow: highlight
                ? '0 0 12px rgba(245,196,74,0.6)'
                : '2px 2px 0 rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'left 0.4s ease, top 0.4s ease, box-shadow 0.3s',
            }}
          >
            {p.isHero && (
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1208' }}>
                ★
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RushHourTutorial({ kind, isAr, onClose, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  if (kind === 'main') {
    return <MainTutorial t={t} isAr={isAr} onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'free-tip') {
    return <ModeTip t={t} isAr={isAr} text={t.free} mood="ready" onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'challenge-tip') {
    return <ModeTip t={t} isAr={isAr} text={t.challenge} mood="focused" onClose={onClose} playSfx={playSfx} />;
  }
  return null;
}

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

const STEPS = ['welcome', 'goal', 'sliding', 'blocked', 'par', 'ready'];

function MainTutorial({ t, isAr, onClose, playSfx }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [animPieces, setAnimPieces] = useState(null);
  const animTimerRef = useRef(0);
  const step = STEPS[stepIdx];

  useEffect(() => {
    clearTimeout(animTimerRef.current);
    setAnimPieces(null);

    if (step === 'sliding') {
      animTimerRef.current = setTimeout(() => {
        setAnimPieces(
          DEMO_PIECES.map((p) =>
            p.id === 'A' ? { ...p, row: 1 } : p,
          ),
        );
      }, 600);
    }

    if (step === 'blocked') {
      animTimerRef.current = setTimeout(() => {
        setAnimPieces(
          DEMO_PIECES.map((p) =>
            p.id === 'E' ? { ...p, col: 4 } : p,
          ),
        );
      }, 600);
    }

    return () => clearTimeout(animTimerRef.current);
  }, [step]);

  const skip = () => { playSfx?.('click'); onClose?.(); };
  const next = () => { playSfx?.('click'); setStepIdx((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { playSfx?.('click'); setStepIdx((s) => Math.max(s - 1, 0)); };
  const finish = () => { playSfx?.('win'); onClose?.(); };

  const mood = step === 'welcome' ? 'ready'
    : step === 'ready' ? 'proud'
    : step === 'blocked' ? 'tired'
    : 'focused';

  const stepCopy = t.main[step];

  return (
    <div className="ct-fq-tut-root ct-fq-tut-main" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />

      <div className="ct-fq-tut-card" style={{ padding: '18px 14px 12px' }}>
        <DemoBoard step={step} animateSlide={animPieces} />
      </div>

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
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>{t.skip}</button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>{t.start}</button>
              </>
            )}
            {stepIdx > 0 && stepIdx < STEPS.length - 1 && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>{t.skip}</button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={back}>{t.back}</button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>{t.next}</button>
              </>
            )}
            {stepIdx === STEPS.length - 1 && (
              <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={finish}>{t.done}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
