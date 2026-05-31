import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';

const TUTORIAL_KEY = 'mm_wordle_tutorial_seen_v1';

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
  if (modeKind === 'free') {
    if (!seen.free) q.push({ kind: 'free-tip' });
    return q;
  }
  if (!seen.main) q.push({ kind: 'main' });
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
        title: 'Word Maze',
        body: 'Letters sit on a grid. Drag a line through touching cells to spell a word, then lift your finger to submit.',
      },
      connect: {
        title: 'How to connect',
        body: 'You can move up, down, left, right, or diagonal. Each letter can be used once per word. Drag back one step to undo.',
      },
      words: {
        title: 'Valid words',
        body: 'Words must be in the dictionary and meet the minimum length (3 or 4 letters depending on difficulty).',
      },
      score: {
        title: 'Scoring',
        body: 'Longer words earn more points (length × length). In levels, find enough words before the timer ends.',
      },
      ready: {
        title: 'Ready!',
        body: 'Try common stems like STAR, LINE, or BRAIN — then branch with prefixes and suffixes on the grid.',
      },
    },
    free: 'Free mode: endless grids that get harder. Find a few words on each grid before its timer runs out. You have 3 lives — miss the target in time and you lose one. Run ends at zero lives.',
    challenge:
      'Pass n Play: pick a difficulty, then every player gets the identical letter grid. Highest total score wins — pass the device each turn.',
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
        title: 'متاهة الكلمات',
        body: 'حروف على شبكة. اسحب خطًا عبر خلايا متجاورة لتكوين كلمة، ثم ارفع إصبعك للإرسال.',
      },
      connect: {
        title: 'كيفية الوصل',
        body: 'يمكنك التحرك أفقيًا أو عموديًا أو قطريًا. كل حرف مرة واحدة لكل كلمة.',
      },
      words: {
        title: 'كلمات صالحة',
        body: 'يجب أن تكون الكلمة في القاموس وتحقق الحد الأدنى للطول.',
      },
      score: {
        title: 'النقاط',
        body: 'الكلمات الأطول = نقاط أكثر. في المستويات، أوجد عددًا كافيًا قبل انتهاء الوقت.',
      },
      ready: {
        title: 'جاهز!',
        body: 'جرّب جذورًا شائعة ثم امتد بأحرف متجاورة على الشبكة.',
      },
    },
    free: 'وضع حر: شبكات لا تنتهي وتزداد صعوبة. جِد بضع كلمات في كل شبكة قبل نفاد مؤقتها. لديك ٣ أرواح — إن لم تبلغ الهدف تخسر روحاً. تنتهي عند نفاد الأرواح.',
    challenge: 'مرّر والعب: اختر الصعوبة، ثم نفس الشبكة للجميع. أعلى نقاط يفوز — مرّر الجهاز كل دور.',
  },
};

const DEMO_GRID = ['s', 't', 'a', 'r', 'l', 'i', 'n', 'e', 'e', 'a', 'r', 't'];
const DEMO_PATH = [0, 1, 2, 3];

function ConnectDemo() {
  return (
    <div
      className="ct-wordle-link-grid ct-wordle-tut-demo-grid"
      style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
      aria-hidden="true"
    >
      {DEMO_GRID.map((ch, i) => {
        const active = DEMO_PATH.includes(i);
        const pos = DEMO_PATH.indexOf(i);
        return (
          <div
            key={i}
            className={`ct-wordle-link-cell${active ? ' ct-wordle-link-cell--active' : ''}`}
          >
            {active && <span className="ct-wordle-link-order">{pos + 1}</span>}
            <span className="ct-wordle-link-letter">{ch.toUpperCase()}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function WordleTutorial({ kind, isAr, onClose, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  if (kind === 'main') {
    return <MainTutorial t={t} isAr={isAr} onClose={onClose} playSfx={playSfx} />;
  }
  if (kind === 'free-tip') {
    return (
      <ModeTip t={t} isAr={isAr} text={t.free} icon="♾️" onClose={onClose} playSfx={playSfx} />
    );
  }
  if (kind === 'challenge-tip') {
    return (
      <ModeTip
        t={t}
        isAr={isAr}
        text={t.challenge}
        icon="⚔️"
        onClose={onClose}
        playSfx={playSfx}
      />
    );
  }
  return null;
}

function ModeTip({ t, isAr, text, icon, onClose, playSfx }) {
  return (
    <div className="ct-fq-tut-root" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-tip">
        <div className="ct-fq-tut-tip-avatar ct-wordle-tut-tip-icon" aria-hidden="true">
          {icon}
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

const STEPS = ['welcome', 'connect', 'words', 'score', 'ready'];

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

  const mood = step === 'welcome' ? 'ready' : step === 'ready' ? 'proud' : 'focused';
  const stepCopy = t.main[step];

  return (
    <div
      className="ct-fq-tut-root ct-fq-tut-main"
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-card" style={{ padding: '18px 14px 12px' }}>
        <ConnectDemo />
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
