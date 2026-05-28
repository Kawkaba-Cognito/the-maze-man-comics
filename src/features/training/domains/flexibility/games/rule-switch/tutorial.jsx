import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';

import { WCST_REFERENCE_CARDS } from './ruleSwitchData';

const TUTORIAL_KEY = 'mm_wcst_tutorial_seen_v1';

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
  } catch {
    /* ignore */
  }
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
        title: 'Card Sort (WCST)',
        body: 'A neuroscience classic: sort by a hidden rule using only Correct / Not correct feedback.',
      },
      piles: {
        title: 'Four reference piles',
        body: 'These key cards stay fixed. Each shows color, shape, and count (1–4 dots).',
      },
      probe: {
        title: 'Match the center card',
        body: 'A new card appears. Tap the pile it matches — by color, shape, or count. The rule is never told.',
      },
      shift: {
        title: 'Rule shifts',
        body: 'After R consecutive correct sorts (R = 6–10), the rule changes with no warning. Flexibility = adapting fast.',
      },
      science: {
        title: 'What we measure',
        body: 'Categories completed (CC), perseverative errors (PE), efficiency η = correct/total, and Cognitive Flexibility Score (CFS).',
      },
      ready: {
        title: 'Ready!',
        body: 'Use feedback to discover each rule. Avoid sorting by the old rule after a shift.',
      },
    },
    free: 'Free mode: session timer, blocks get harder when you pass. Too many errors ends the run.',
    challenge:
      'Challenge: identical card sequence for every player. Highest CFS wins — pass the device each turn.',
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
        title: 'فرز البطاقات (WCST)',
        body: 'اختبار عصبي كلاسيكي: فرز بقاعدة مخفية من تغذية «صحيح / غير صحيح» فقط.',
      },
      piles: {
        title: 'أربع كوم مرجعية',
        body: 'بطاقات ثابتة: لون، شكل، وعدد (١–٤ نقاط).',
      },
      probe: {
        title: 'طابق البطاقة الوسطى',
        body: 'بطاقة جديدة كل مرة. اضغط الكومة المطابقة — باللون أو الشكل أو العدد. القاعدة لا تُقال.',
      },
      shift: {
        title: 'تبديل القاعدة',
        body: 'بعد R إجابات صحيحة متتالية (٦–١٠) تتغير القاعدة دون تنبيه. المرونة = التكيف بسرعة.',
      },
      science: {
        title: 'ما نقيسه',
        body: 'فئات مكتملة (CC)، أخطاء إصرار (PE)، كفاءة η = صحيح/المجموع، ودرجة المرونة المعرفية (CFS).',
      },
      ready: {
        title: 'جاهز!',
        body: 'اكتشف القاعدة من التغذية الراجعة. تجنب الفرز بالقاعدة القديمة بعد التبديل.',
      },
    },
    free: 'وضع حر: مؤقت جلسة، الكتل تصعب عند النجاح. أخطاء كثيرة تنهي المحاولة.',
    challenge:
      'تحدي: نفس تسلسل البطاقات للجميع. أعلى CFS يفوز — مرّر الجهاز كل دور.',
  },
};

function TutCardFace({ card, small }) {
  const size = small ? 'sm' : 'md';
  const shapes = Array.from({ length: card.count }, (_, i) => i);
  return (
    <div className={`ct-wcst-tut-card${small ? ' ct-wcst-tut-card--sm' : ''}`}>
      <div className="ct-wcst-shapes">
        {shapes.map((i) => (
          <div
            key={i}
            className={`ct-wcst-shape ct-wcst-shape--${card.shape} ct-wcst-shape--${card.color} ct-wcst-shape--${size}`}
          />
        ))}
      </div>
    </div>
  );
}

function DemoBoard({ step }) {
  const demoProbe = { color: 'blue', shape: 'square', count: 2 };
  return (
    <div className="ct-wcst-tut-demo">
      <div className="ct-wcst-refs">
        {WCST_REFERENCE_CARDS.map((c) => (
          <TutCardFace key={c.id} card={c} small />
        ))}
      </div>
      {step === 'probe' || step === 'shift' ? (
        <div className="ct-wcst-probe-card">
          <div className="ct-wcst-shapes">
            {Array.from({ length: demoProbe.count }, (_, i) => (
              <div
                key={i}
                className={`ct-wcst-shape ct-wcst-shape--${demoProbe.shape} ct-wcst-shape--${demoProbe.color} ct-wcst-shape--lg`}
              />
            ))}
          </div>
        </div>
      ) : null}
      {step === 'shift' && (
        <p className="ct-wcst-tut-shift-tag">Rule changed — discover again</p>
      )}
    </div>
  );
}

export default function CardSortTutorial({ kind, isAr, onClose, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  if (kind === 'main') {
    return <MainTutorial t={t} isAr={isAr} onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'free-tip') {
    return (
      <ModeTip t={t} isAr={isAr} text={t.free} mood="ready" onClose={onClose} playSfx={playSfx} />
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

const STEPS = ['welcome', 'piles', 'probe', 'shift', 'science', 'ready'];

function MainTutorial({ t, isAr, onClose, playSfx }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const mood =
    step === 'welcome'
      ? 'ready'
      : step === 'ready'
        ? 'proud'
        : 'focused';
  const copy = t.main[step];

  return (
    <div
      className="ct-fq-tut-root ct-fq-tut-main"
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-card" style={{ padding: '14px 12px' }}>
        <DemoBoard step={step} />
      </div>
      <div className="ct-fq-tut-dock">
        <div className="ct-fq-tut-dock-mm">
          <MazeManAvatar size={92} mood={mood} glow />
        </div>
        <div className="ct-fq-tut-bubble">
          <div className="ct-fq-tut-bubble-progress">{t.progress(stepIdx + 1, STEPS.length)}</div>
          <h3 className="ct-fq-tut-bubble-title">{copy.title}</h3>
          <p className="ct-fq-tut-bubble-text">{copy.body}</p>
          <div className="ct-fq-tut-bubble-actions">
            {stepIdx === 0 && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={onClose}>
                  {t.skip}
                </button>
                <button
                  type="button"
                  className="ct-fq-tut-btn ct-fq-tut-btn-pri"
                  onClick={() => {
                    playSfx?.('click');
                    setStepIdx(1);
                  }}
                >
                  {t.start}
                </button>
              </>
            )}
            {stepIdx > 0 && stepIdx < STEPS.length - 1 && (
              <>
                <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-ghost" onClick={onClose}>
                  {t.skip}
                </button>
                <button
                  type="button"
                  className="ct-fq-tut-btn ct-fq-tut-btn-ghost"
                  onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                >
                  {t.back}
                </button>
                <button
                  type="button"
                  className="ct-fq-tut-btn ct-fq-tut-btn-pri"
                  onClick={() => {
                    playSfx?.('click');
                    setStepIdx((s) => s + 1);
                  }}
                >
                  {t.next}
                </button>
              </>
            )}
            {stepIdx === STEPS.length - 1 && (
              <button
                type="button"
                className="ct-fq-tut-btn ct-fq-tut-btn-pri"
                onClick={() => {
                  playSfx?.('win');
                  onClose?.();
                }}
              >
                {t.done}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
