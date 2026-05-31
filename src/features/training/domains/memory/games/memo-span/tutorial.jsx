import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import MemoObject from './MemoObject';

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
        title: 'Memory Grid',
        body: 'Cells in a grid light up one by one. Watch the order, then tap the cells back.',
      },
      watch: {
        title: 'Watch the order',
        body: 'Each cell lights up for a moment. Remember which cells, and in what order — 1, 2, 3…',
      },
      recall: {
        title: 'Tap them back',
        body: 'Then tap the same cells in the order they lit up. The number shows your taps.',
      },
      reverse: {
        title: 'Reverse = working memory',
        body: 'On harder rounds you tap them in REVERSE order. Holding the list and flipping it is working memory. A badge tells you which way.',
      },
      ready: {
        title: 'Ready!',
        body: 'Watch closely, then reproduce the order — forward or reverse. Go!',
      },
    },
    free: 'Free mode: endless, and the sequence grows each time you nail it. You have 3 lives — a broken sequence costs one. The run ends when your lives reach zero.',
    challenge:
      'Pass n Play: pick a difficulty, everyone gets the same sequence. Hand the device around — best memory wins!',
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
        title: 'شبكة الذاكرة',
        body: 'تضيء خلايا الشبكة واحدة تلو الأخرى. راقب الترتيب ثم أعد الضغط على الخلايا.',
      },
      watch: {
        title: 'احفظ الترتيب',
        body: 'تضيء كل خلية للحظة. تذكّر أي الخلايا وبأي ترتيب — 1، 2، 3…',
      },
      recall: {
        title: 'أعد الضغط',
        body: 'ثم اضغط نفس الخلايا بترتيب إضاءتها. الرقم يبيّن ترتيب ضغطك.',
      },
      reverse: {
        title: 'المعكوس = ذاكرة عاملة',
        body: 'في الجولات الأصعب تضغطها بترتيب معكوس. الاحتفاظ بالقائمة وعكسها هو الذاكرة العاملة. شارة تخبرك بالاتجاه.',
      },
      ready: {
        title: 'جاهز!',
        body: 'راقب جيداً ثم أعد الترتيب — مباشر أو معكوس. انطلق!',
      },
    },
    free: 'الوضع الحر: لا ينتهي ويطول التسلسل كلما نجحت. لديك ٣ أرواح — كسر التسلسل يكلّفك روحاً. تنتهي المحاولة عند نفاد الأرواح.',
    challenge: 'مرّر والعب: اختر الصعوبة، الجميع يحصل على نفس التسلسل. سلّم الجهاز — أفضل ذاكرة تفوز!',
  },
};

const STEPS = ['welcome', 'watch', 'recall', 'reverse', 'ready'];

const DEMO_OBJ = ['ball', 'cup', 'book', 'chair', 'phone', 'apple'];

function DemoGrid({ nums, lit, isAr }) {
  return (
    <div className="ct-ms-tut-demo-grid">
      {DEMO_OBJ.map((id, i) => {
        const num = nums?.[i];
        const isLit = lit?.includes(i);
        return (
          <div
            key={id}
            className={`ct-ms-tut-demo-item${num ? ' ct-ms-tut-demo-item--tap' : ''}`}
            data-num={num || undefined}
            style={isLit ? { background: 'linear-gradient(180deg,#e8f4c8,#9cb752)', boxShadow: '0 0 0 3px #c4d88a' } : undefined}
          >
            <MemoObject objectId={id} isAr={isAr} size="sm" />
          </div>
        );
      })}
    </div>
  );
}

function DemoCard({ step, isAr }) {
  // Sequence is cells 0,1,2 (ball, cup, book).
  if (step === 'watch') return <DemoGrid lit={[0, 1, 2]} nums={{ 0: '1', 1: '2', 2: '3' }} isAr={isAr} />;
  if (step === 'recall') return <DemoGrid nums={{ 0: '1', 1: '2', 2: '3' }} isAr={isAr} />;
  if (step === 'reverse') return <DemoGrid nums={{ 0: '3', 1: '2', 2: '1' }} isAr={isAr} />;
  return <DemoGrid nums={{ 0: '1', 1: '2', 2: '3' }} isAr={isAr} />;
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
