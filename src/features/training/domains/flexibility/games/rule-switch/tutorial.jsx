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
        title: 'Card Sort',
        body: 'Sort each card by the rule shown at the top — colour, shape, or number. The rule keeps switching.',
      },
      piles: {
        title: 'Four reference piles',
        body: 'These key cards stay fixed. Each shows a colour, a shape, and a count (1–4 dots).',
      },
      probe: {
        title: 'Match by the shown rule',
        body: 'A card appears. The banner says which rule is active (e.g. COLOR) — tap the pile that matches the card by that rule.',
      },
      shift: {
        title: '⚡ The rule switches',
        body: 'After a streak, a banner announces the NEW rule (e.g. → SHAPE). Let go of the old rule and follow the new one fast — that is cognitive flexibility.',
      },
      science: {
        title: 'What we measure',
        body: 'How well you adapt at each switch: efficiency, switches completed, and perseverative errors (sorting by the old rule). It all feeds your Flexibility score.',
      },
      ready: {
        title: 'Ready!',
        body: 'Always follow the rule on the banner. When it switches, switch with it — don’t keep using the old rule.',
      },
    },
    free: 'Free mode: endless, and it gets harder. Sort by the shown rule; it keeps switching. Solid play continues the run.',
    challenge:
      'Pass n Play: identical card sequence for every player. Highest flexibility wins — pass the device each turn.',
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
        title: 'فرز البطاقات',
        body: 'افرز كل بطاقة حسب القاعدة المعروضة في الأعلى — اللون أو الشكل أو العدد. القاعدة تتبدّل باستمرار.',
      },
      piles: {
        title: 'أربع كوم مرجعية',
        body: 'بطاقات ثابتة: لون، شكل، وعدد (١–٤ نقاط).',
      },
      probe: {
        title: 'طابق حسب القاعدة المعروضة',
        body: 'تظهر بطاقة. الشارة تخبرك بالقاعدة الحالية (مثلاً اللون) — اضغط الكومة التي تطابق البطاقة بتلك القاعدة.',
      },
      shift: {
        title: '⚡ تتبدّل القاعدة',
        body: 'بعد سلسلة نجاحات تعلن شارة القاعدة الجديدة (مثلاً ← الشكل). اترك القديمة واتبع الجديدة بسرعة — هذه هي المرونة الذهنية.',
      },
      science: {
        title: 'ما نقيسه',
        body: 'مدى تكيّفك عند كل تبديل: الكفاءة، عدد التبديلات، وأخطاء الإصرار (الفرز بالقاعدة القديمة). كله يغذّي درجة مرونتك.',
      },
      ready: {
        title: 'جاهز!',
        body: 'اتبع دائماً القاعدة على الشارة. عند تبديلها بدّل معها — لا تستمر بالقاعدة القديمة.',
      },
    },
    free: 'وضع حر: لا ينتهي ويزداد صعوبة. افرز حسب القاعدة المعروضة؛ وهي تتبدّل. اللعب الجيد يواصل المحاولة.',
    challenge:
      'مرّر والعب: نفس تسلسل البطاقات للجميع. أعلى مرونة يفوز — مرّر الجهاز كل دور.',
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

function DemoBoard({ step, isAr }) {
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
        <p className="ct-wcst-tut-shift-tag">{isAr ? '⚡ تبدّلت القاعدة — اتبع الجديدة' : '⚡ Rule switched — follow the new one'}</p>
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
        <DemoBoard step={step} isAr={isAr} />
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
