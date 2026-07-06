import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { INK, SUB, SERIF } from './PracticeShell';
import { markWellbeingPracticeDone } from './habitState';

/*
 * 5-4-3-2-1 Grounding — a guided senses walk-through to break acute anxiety by
 * pulling attention back to the present. Tap each item as you notice it.
 */

const ACCENT = '#6fae7a';

const STEPS = [
  { n: 5, ic: '👁️', en: 'see', ar: 'تراها' },
  { n: 4, ic: '✋', en: 'can feel', ar: 'تلمسها' },
  { n: 3, ic: '👂', en: 'can hear', ar: 'تسمعها' },
  { n: 2, ic: '👃', en: 'can smell', ar: 'تشمّها' },
  { n: 1, ic: '👅', en: 'can taste', ar: 'تتذوّقها' },
];

export default function GroundingPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('intro'); // intro | step | done
  const [idx, setIdx] = useState(0);
  const [filled, setFilled] = useState(0);

  const t = useMemo(() => ({
    title: isAr ? 'التأريض ٥-٤-٣-٢-١' : '5-4-3-2-1 Grounding',
    intro: isAr ? 'عندما يتسارع القلق، أعِد انتباهك إلى اللحظة عبر حواسك الخمس. سنمرّ بها واحدة واحدة.'
      : 'When anxiety spikes, bring your attention back to the present through your five senses. We\'ll go through them one at a time.',
    start: isAr ? 'ابدأ' : 'Begin',
    name: isAr ? 'سمِّ' : 'Name',
    thing: isAr ? 'أشياء' : 'things you',
    thing1: isAr ? 'شيئاً' : 'thing you',
    tapEach: isAr ? 'اضغط كل واحدة حين تلاحظها' : 'Tap each one as you notice it',
    next: isAr ? 'التالي' : 'Next',
    done: isAr ? 'أنت هنا الآن' : "You're here, now",
    doneSub: isAr ? 'لاحظ كيف تباطأ كل شيء قليلاً.' : 'Notice how everything slowed down a little.',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    note: isAr ? 'أداة تهدئة، وليست علاجاً طبياً.' : 'A calming tool, not medical treatment.',
  }), [isAr]);

  const startStep = useCallback((i) => { setIdx(i); setFilled(0); setPhase('step'); }, []);
  const tapPip = useCallback(() => {
    playSfx?.('click');
    setFilled((f) => {
      const nf = f + 1;
      const step = STEPS[idx];
      if (nf >= step.n) {
        setTimeout(() => { if (idx + 1 >= STEPS.length) { setPhase('done'); playSfx?.('collect'); } else startStep(idx + 1); }, 450);
      }
      return nf;
    });
  }, [idx, playSfx, startStep]);

  useEffect(() => {
    if (phase === 'done') markWellbeingPracticeDone('grounding');
  }, [phase]);

  const step = STEPS[idx];

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">🖐️</div>
          <div className="grd-intro">{t.intro}</div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); startStep(0); }}>{t.start}</button>
          <div className="rxp-tip">{t.note}</div>
        </div>
      )}

      {phase === 'step' && (
        <div className="rxp-body rxp-center">
          <div className="grd-count">{step.n}</div>
          <div className="grd-ic">{step.ic}</div>
          <div className="grd-prompt serif">
            {t.name} {step.n} {step.n === 1 ? t.thing1 : t.thing} {isAr ? step.ar : step.en}
          </div>
          <div className="grd-hint">{t.tapEach}</div>
          <div className="grd-pips">
            {Array.from({ length: step.n }).map((_, i) => (
              <button key={i} className={`grd-pip${i < filled ? ' on' : ''}`} disabled={i !== filled} onClick={tapPip} aria-label="notice" />
            ))}
          </div>
          <div className="grd-progress">{STEPS.map((s, i) => (
            <span key={i} className={`grd-dot${i < idx ? ' done' : ''}${i === idx ? ' cur' : ''}`} />
          ))}</div>
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">🌿</div>
          <div className="grd-doneT serif">{t.done}</div>
          <div className="grd-doneS">{t.doneSub}</div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); startStep(0); }}>{t.again}</button>
          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.grd-intro { font-size:15px; color:${SUB}; line-height:1.7; max-width:340px; }
.grd-count { font-family:${SERIF}; font-size:72px; font-weight:700; color:${ACCENT}; line-height:1; }
.grd-ic { font-size:46px; margin-top:-6px; }
.grd-prompt { font-family:${SERIF}; font-size:24px; font-weight:600; color:${INK}; max-width:320px; }
.grd-hint { font-size:13px; color:${SUB}; }
.grd-pips { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:8px; }
.grd-pip { width:42px; height:42px; border-radius:50%; border:2px solid #cfe0d2; background:#fff; cursor:pointer; transition:all .18s; }
.grd-pip.on { background:${ACCENT}; border-color:${ACCENT}; transform:scale(1.08); box-shadow:0 4px 12px rgba(111,174,122,0.4); }
.grd-pip:disabled { opacity:0.5; cursor:default; }
.grd-pip.on:disabled { opacity:1; }
.grd-progress { display:flex; gap:7px; margin-top:14px; }
.grd-dot { width:8px; height:8px; border-radius:50%; background:#d9e4db; }
.grd-dot.done { background:${ACCENT}; }
.grd-dot.cur { background:${'#3d8a52'}; transform:scale(1.3); }
.grd-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.grd-doneS { font-size:14px; color:${SUB}; max-width:300px; }
`;
