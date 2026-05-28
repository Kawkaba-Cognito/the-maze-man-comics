import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import MemoObject, { MemoObjectRow } from './MemoObject';

const TUTORIAL_KEY = 'mm_memo_span_tutorial_seen_v2';

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
        title: 'Serial Recall',
        body: 'Watch a short sequence of objects, then tap them back in the SAME order.',
      },
      memorize: {
        title: 'Watch the order',
        body: 'Objects appear one by one. Burn the order into your mind — 1, 2, 3…',
      },
      recall: {
        title: 'Tap them in order',
        body: 'A grid appears with the objects (plus some extras). Tap them in the exact order they appeared.',
      },
      foils: {
        title: 'Extra objects',
        body: 'Some objects in the grid were never shown. Ignore those — they are foils to test your memory.',
      },
      ready: {
        title: 'One slip ends it',
        body: 'First wrong tap stops the round. Full sequence = 3 stars. Ready?',
      },
    },
    free: 'Free mode: the sequence grows longer when you nail it, shorter when you slip.',
    challenge:
      'Challenge: everyone gets the same sequence. Hand the device around — longest correct span wins!',
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
        title: 'استدعاء تسلسلي',
        body: 'شاهد تسلسل أشياء قصير، ثم اضغطها بنفس الترتيب.',
      },
      memorize: {
        title: 'احفظ الترتيب',
        body: 'تظهر الأشياء واحداً تلو الآخر. ركّز على الترتيب — 1، 2، 3…',
      },
      recall: {
        title: 'اضغطها بالترتيب',
        body: 'تظهر شبكة فيها الأشياء (وأخرى إضافية). اضغطها بنفس ترتيب ظهورها.',
      },
      foils: {
        title: 'أشياء إضافية',
        body: 'بعض الأشياء في الشبكة لم تُعرض. تجاهلها — هي فقط لاختبار ذاكرتك.',
      },
      ready: {
        title: 'خطأ واحد ينهي الجولة',
        body: 'أول ضغطة خاطئة تنهي الجولة. التسلسل الكامل = 3 نجوم. مستعد؟',
      },
    },
    free: 'الوضع الحر: يطول التسلسل عند النجاح ويقصر عند الخطأ.',
    challenge: 'التحدي: نفس التسلسل للجميع. سلّم الجهاز — أطول مدى صحيح يفوز!',
  },
};

const STEPS = ['welcome', 'memorize', 'recall', 'foils', 'ready'];

function DemoCard({ step, isAr }) {
  if (step === 'memorize') {
    return <MemoObjectRow objectIds={['ball', 'cup', 'book']} isAr={isAr} size="md" />;
  }
  if (step === 'recall') {
    return (
      <div className="ct-ms-tut-demo-grid">
        <div className="ct-ms-tut-demo-item ct-ms-tut-demo-item--tap" data-num="1">
          <MemoObject objectId="ball" isAr={isAr} size="sm" />
        </div>
        <div className="ct-ms-tut-demo-item">
          <MemoObject objectId="chair" isAr={isAr} size="sm" />
        </div>
        <div className="ct-ms-tut-demo-item ct-ms-tut-demo-item--tap" data-num="2">
          <MemoObject objectId="cup" isAr={isAr} size="sm" />
        </div>
        <div className="ct-ms-tut-demo-item">
          <MemoObject objectId="phone" isAr={isAr} size="sm" />
        </div>
        <div className="ct-ms-tut-demo-item ct-ms-tut-demo-item--tap" data-num="3">
          <MemoObject objectId="book" isAr={isAr} size="sm" />
        </div>
        <div className="ct-ms-tut-demo-item">
          <MemoObject objectId="apple" isAr={isAr} size="sm" />
        </div>
      </div>
    );
  }
  if (step === 'foils') {
    return <MemoObjectRow objectIds={['chair', 'phone', 'apple']} isAr={isAr} size="sm" />;
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
  const mood = step === 'welcome' ? 'ready' : step === 'ready' ? 'proud' : step === 'foils' ? 'tired' : 'focused';
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
