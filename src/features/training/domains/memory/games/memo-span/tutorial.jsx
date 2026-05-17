import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import MemoObject, { MemoObjectRow } from './MemoObject';

const TUTORIAL_KEY = 'mm_memo_span_tutorial_seen_v1';

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
        title: 'Memo Span',
        body: 'Remember everyday objects, then answer quick memory questions.',
      },
      memorize: {
        title: 'Memorize',
        body: 'Objects appear one at a time — ball, cup, chair, and more. Focus on each one.',
      },
      question: {
        title: 'Did you see this?',
        body: 'We show an object and ask if it was in your list. Tap Yes or No.',
      },
      lures: {
        title: 'Watch for tricks',
        body: 'Some objects were NOT shown. Say No when you never saw them.',
      },
      ready: {
        title: 'Ready!',
        body: 'Read the task card every round. Accurate answers win stars.',
      },
    },
    free: 'Free mode: list size grows when you pass and shrinks when you miss.',
    challenge:
      'Challenge: everyone gets the same objects and questions. Hand the device around — highest score wins!',
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
        title: 'ذاكرة الأشياء',
        body: 'تذكّر أشياء يومية، ثم أجب عن أسئلة الذاكرة بسرعة.',
      },
      memorize: {
        title: 'احفظ',
        body: 'تظهر الأشياء واحداً تلو الآخر — كرة، كوب، كرسي… ركّز على كل واحد.',
      },
      question: {
        title: 'هل رأيت هذا؟',
        body: 'نعرض شيئاً ونسأل إن كان في قائمتك. اضغط نعم أو لا.',
      },
      lures: {
        title: 'انتبه للفخاخ',
        body: 'بعض الأشياء لم تُعرض. قل لا إذا لم تره.',
      },
      ready: {
        title: 'جاهز!',
        body: 'اقرأ بطاقة المهمة كل جولة. الإجابات الدقيقة تربح نجوماً.',
      },
    },
    free: 'الوضع الحر: يزيد عدد الأشياء عند النجاح وينقص عند الخطأ.',
    challenge: 'التحدي: نفس الأشياء والأسئلة للجميع. سلّم الجهاز — أعلى نتيجة يفوز!',
  },
};

const STEPS = ['welcome', 'memorize', 'question', 'lures', 'ready'];

function DemoCard({ step, isAr }) {
  if (step === 'memorize') {
    return <MemoObject objectId="cup" isAr={isAr} size="lg" showName />;
  }
  if (step === 'question') {
    return <MemoObject objectId="ball" isAr={isAr} size="lg" showName />;
  }
  if (step === 'lures') {
    return <MemoObjectRow objectIds={['chair', 'phone', 'computer']} isAr={isAr} size="sm" />;
  }
  return <MemoObjectRow objectIds={['ball', 'cup', 'book']} isAr={isAr} size="sm" />;
}

export default function MemoSpanTutorial({ kind, isAr, onClose, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  if (kind === 'main') {
    return <MainTutorial t={t} isAr={isAr} onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'free-tip') {
    return <ModeTip t={t} isAr={isAr} text={t.free} mood="ready" onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'challenge-tip') {
    return (
      <ModeTip t={t} isAr={isAr} text={t.challenge} mood="focused" onClose={onClose} playSfx={playSfx} />
    );
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

function MainTutorial({ t, isAr, onClose, playSfx }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const skip = () => { playSfx?.('click'); onClose?.(); };
  const next = () => { playSfx?.('click'); setStepIdx((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { playSfx?.('click'); setStepIdx((s) => Math.max(s - 1, 0)); };
  const finish = () => { playSfx?.('win'); onClose?.(); };
  const mood = step === 'welcome' ? 'ready' : step === 'ready' ? 'proud' : step === 'lures' ? 'tired' : 'focused';
  const stepCopy = t.main[step];
  return (
    <div className="ct-fq-tut-root ct-fq-tut-main" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-card" style={{ padding: '18px 14px 12px' }}>
        <DemoCard step={step} isAr={isAr} />
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