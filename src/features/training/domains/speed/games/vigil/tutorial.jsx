import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import VigilShape, { VigilShapeRow } from './VigilShape';

const TUTORIAL_KEY = 'mm_vigil_tutorial_seen_v1';

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
    main: {
      welcome: {
        title: 'Vigil Test',
        body: 'Shapes appear in the center. Tap the shape directly when you should respond.',
      },
      watch: {
        title: 'Watch the center',
        body: 'Different shapes flash for a moment. Before each block you get a clear task card — read it, then start.',
      },
      square: {
        title: 'Tap target only',
        body: 'Tap only when you see the shape named on your task card (often a square). Other shapes are distractors.',
      },
      circle: {
        title: 'Ignore distractors',
        body: 'Circles, triangles, diamonds, and hexagons may appear — do not tap unless your task says to.',
      },
      ready: {
        title: 'Ready!',
        body: 'Read the task card every block. Tap targets only. Stay steady.',
      },
    },
    free: 'Free mode: endless blocks that keep getting harder. You have 3 lives — fail a block and you lose one. Clear blocks to score. The run ends only when your lives reach zero.',
    challenge:
      'Pass n Play: pick a difficulty, then every player gets the same trial sequence. Hand the device around — highest vigil score wins!',
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
        title: 'اختبار اليقظة',
        body: 'تظهر أشكال في الوسط. اضغط على الشكل مباشرة عندما يجب أن تستجيب.',
      },
      watch: {
        title: 'راقب الوسط',
        body: 'تظهر أشكال مختلفة للحظة. قبل كل كتلة تظهر بطاقة المهمة — اقرأها ثم ابدأ.',
      },
      square: {
        title: 'الهدف فقط',
        body: 'اضغط فقط للشكل المذكور في بطاقة المهمة (غالباً مربع). الباقي مشتتات.',
      },
      circle: {
        title: 'تجاهل المشتتات',
        body: 'قد تظهر دوائر ومثلثات ومعيّنات وسداسيات — لا تضغط إلا إذا طلبت المهمة ذلك.',
      },
      ready: {
        title: 'جاهز!',
        body: 'اقرأ بطاقة المهمة كل كتلة. اضغط للأهداف فقط. ابقَ مركزاً.',
      },
    },
    free: 'الوضع الحر: كتل لا تنتهي وتزداد صعوبة. لديك ٣ أرواح — إذا فشلت كتلة تخسر روحاً. أكمل الكتل لجمع النقاط. تنتهي المحاولة فقط عند نفاد الأرواح.',
    challenge:
      'مرّر والعب: اختر الصعوبة، ثم يحصل كل اللاعبين على نفس تسلسل المحاولات. سلّم الجهاز — أعلى درجة يقظة يفوز!',
  },
};

function DemoVigil({ step }) {
  const showSquare = step === 'square' || step === 'welcome';
  const showCircle = step === 'circle';
  const showRow = step === 'watch' || step === 'ready';
  const tapGlow = step === 'square';
  const holdGlow = step === 'circle';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 280,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          width: '100%',
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f3ebe4',
          borderRadius: 12,
          border: '2px solid #1a1208',
          boxShadow: '4px 4px 0 #1a1208',
        }}
      >
        {showSquare && <VigilShape shape="square" size="lg" />}
        {showCircle && <VigilShape shape="circle" size="lg" />}
        {showRow && (
          <VigilShapeRow shapes={['circle', 'triangle', 'diamond', 'hexagon']} size="sm" />
        )}
      </div>
      <button
        type="button"
        className={`ct-vigil-tap-pad${tapGlow ? ' ct-vigil-tap-pad--go' : ''}${holdGlow ? ' ct-vigil-tap-pad--hold' : ''}`}
        style={{ pointerEvents: 'none', maxWidth: 220, width: '100%' }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {tapGlow ? 'TAP!' : holdGlow ? 'HOLD' : 'TAP'}
      </button>
    </div>
  );
}

export default function VigilTutorial({ kind, isAr, onClose, playSfx }) {
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
            onClick={() => {
              playSfx?.('click');
              onClose?.();
            }}
          >
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}

const STEPS = ['welcome', 'watch', 'square', 'circle', 'ready'];

function MainTutorial({ t, isAr, onClose, playSfx }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];

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

  const mood =
    step === 'welcome' ? 'ready' : step === 'ready' ? 'proud' : step === 'circle' ? 'tired' : 'focused';
  const stepCopy = t.main[step];

  return (
    <div className="ct-fq-tut-root ct-fq-tut-main" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-card" style={{ padding: '18px 14px 12px' }}>
        <DemoVigil step={step} />
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
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={skip}>
                  {t.skip}
                </button>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={next}>
                  {t.start}
                </button>
              </>
            )}
            {stepIdx > 0 && stepIdx < STEPS.length - 1 && (
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
