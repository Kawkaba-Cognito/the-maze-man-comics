import React, { useState } from 'react';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import { SH } from './speedMatchData';

const TUTORIAL_KEY = 'mm_speedmatch_tutorial_seen_v1';

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

const DEMO_LEGEND = [
  { digit: 1, symbol: 'triangle' },
  { digit: 2, symbol: 'circle' },
  { digit: 3, symbol: 'square' },
  { digit: 4, symbol: 'star' },
];

const STR = {
  en: {
    skip: 'Skip', back: 'Back', next: 'Next', done: 'Got it!', start: "Let's go!",
    progress: (n, t) => `Step ${n} of ${t}`,
    keyLabel: 'Key',
    main: {
      welcome: { title: 'Speed Match', body: 'Match each symbol to its number — as fast as you can. Speed is the whole point.' },
      key: { title: 'Read the key', body: 'The key stays on screen: every symbol has a number. Glance up whenever you need it.' },
      match: { title: 'Tap the number', body: 'A symbol appears. Tap the number it matches in the key. Correct → the next symbol pops up instantly.' },
      speed: { title: 'Build a combo', body: 'Fast correct taps build a combo for more points. A wrong tap breaks it.' },
      ready: { title: 'Ready!', body: 'Match fast, keep accuracy high, ride the combo. Go!' },
    },
    free: 'Free mode: endless, and it speeds up. The key grows and each symbol gives you less time. You have 3 lives — a wrong tap or running out of time on a symbol costs one. The run ends only when your lives reach zero.',
    challenge: 'Pass n Play: pick a difficulty, then every player gets the same key and symbols. Hand the device around — most matches wins!',
  },
  ar: {
    skip: 'تخطّي', back: 'السابق', next: 'التالي', done: 'فهمت!', start: 'لنبدأ!',
    progress: (n, t) => `الخطوة ${n} من ${t}`,
    keyLabel: 'المفتاح',
    main: {
      welcome: { title: 'مطابقة سريعة', body: 'طابق كل رمز مع رقمه — بأسرع ما يمكن. السرعة هي الهدف.' },
      key: { title: 'اقرأ المفتاح', body: 'يبقى المفتاح على الشاشة: لكل رمز رقم. انظر إليه متى احتجت.' },
      match: { title: 'اضغط الرقم', body: 'يظهر رمز. اضغط الرقم المطابق له في المفتاح. الصحيح → يظهر الرمز التالي فوراً.' },
      speed: { title: 'ابنِ تتابعاً', body: 'النقرات الصحيحة السريعة تبني تتابعاً لنقاط أكثر. النقر الخاطئ يكسره.' },
      ready: { title: 'جاهز!', body: 'طابق بسرعة، حافظ على الدقة، واصل التتابع. انطلق!' },
    },
    free: 'الوضع الحر: لا ينتهي ويتسارع. يكبر المفتاح ويقل وقت كل رمز. لديك ٣ أرواح — النقر الخاطئ أو نفاد الوقت يكلّفك روحاً. تنتهي المحاولة فقط عند نفاد الأرواح.',
    challenge: 'مرّر والعب: اختر الصعوبة، ثم يحصل كل اللاعبين على نفس المفتاح والرموز. سلّم الجهاز — أكثر مطابقات يفوز!',
  },
};

function SmSymbol({ shape, size = 30 }) {
  const inner = SH[shape] || SH.circle;
  return <svg width={size} height={size} viewBox="0 0 100 100" style={{ color: '#2d2d2d', display: 'block' }} dangerouslySetInnerHTML={{ __html: inner }} />;
}

function DemoMatch({ step, t }) {
  const highlight = step === 'match' || step === 'speed' || step === 'ready';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, width: '100%', maxWidth: 300, margin: '0 auto' }}>
      <div style={{ width: '100%' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8a8078', marginBottom: 6, textAlign: 'center' }}>{t.keyLabel}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, background: '#f3ebe4', border: '2px solid #1a1208', borderRadius: 10, padding: '8px 10px' }}>
          {DEMO_LEGEND.map((p) => (
            <div key={p.digit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <SmSymbol shape={p.symbol} size={24} />
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: 14, color: '#1a4a1a' }}>{p.digit}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 84, height: 84, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '2px solid #1a1208', borderRadius: 14, boxShadow: '4px 4px 0 #1a1208' }}>
        <SmSymbol shape="square" size={56} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {DEMO_LEGEND.map((p) => (
          <div key={p.digit} style={{
            width: 40, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, border: '2px solid #1a1208', fontFamily: "'Fredoka One', cursive", fontSize: 18,
            background: highlight && p.digit === 3 ? 'linear-gradient(180deg,#c8e8c8,#9acc9a)' : '#fff',
            color: '#1a1208', boxShadow: '3px 3px 0 #1a1208',
          }}>{p.digit}</div>
        ))}
      </div>
    </div>
  );
}

export default function SpeedMatchTutorial({ kind, isAr, onClose, playSfx }) {
  const t = isAr ? STR.ar : STR.en;
  if (kind === 'main') return <MainTutorial t={t} isAr={isAr} onClose={onClose} playSfx={playSfx} />;
  if (kind === 'free-tip') return <ModeTip t={t} isAr={isAr} text={t.free} mood="ready" onClose={onClose} playSfx={playSfx} />;
  if (kind === 'challenge-tip') return <ModeTip t={t} isAr={isAr} text={t.challenge} mood="focused" onClose={onClose} playSfx={playSfx} />;
  return null;
}

function ModeTip({ t, isAr, text, mood, onClose, playSfx }) {
  return (
    <div className="ct-fq-tut-root" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-tip">
        <div className="ct-fq-tut-tip-avatar"><MazeManAvatar size={120} mood={mood} glow /></div>
        <div className="ct-fq-tut-tip-bubble">
          <p className="ct-fq-tut-tip-text">{text}</p>
          <button type="button" className="ct-fq-tut-btn ct-fq-tut-btn-pri" onClick={() => { playSfx?.('click'); onClose?.(); }}>{t.done}</button>
        </div>
      </div>
    </div>
  );
}

const STEPS = ['welcome', 'key', 'match', 'speed', 'ready'];

function MainTutorial({ t, isAr, onClose, playSfx }) {
  const [stepIdx, setStepIdx] = useState(0);
  const step = STEPS[stepIdx];
  const skip = () => { playSfx?.('click'); onClose?.(); };
  const next = () => { playSfx?.('click'); setStepIdx((s) => Math.min(s + 1, STEPS.length - 1)); };
  const back = () => { playSfx?.('click'); setStepIdx((s) => Math.max(s - 1, 0)); };
  const finish = () => { playSfx?.('win'); onClose?.(); };
  const mood = step === 'welcome' ? 'ready' : step === 'ready' ? 'proud' : 'focused';
  const copy = t.main[step];
  return (
    <div className="ct-fq-tut-root ct-fq-tut-main" role="dialog" aria-modal="true" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="ct-fq-tut-backdrop" />
      <div className="ct-fq-tut-card" style={{ padding: '18px 14px 12px' }}>
        <DemoMatch step={step} t={t} />
      </div>
      <div className="ct-fq-tut-dock">
        <div className="ct-fq-tut-dock-mm"><MazeManAvatar size={92} mood={mood} glow /></div>
        <div className="ct-fq-tut-bubble">
          <div className="ct-fq-tut-bubble-progress" aria-live="polite">{t.progress(stepIdx + 1, STEPS.length)}</div>
          <h3 className="ct-fq-tut-bubble-title">{copy.title}</h3>
          <p className="ct-fq-tut-bubble-text">{copy.body}</p>
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
