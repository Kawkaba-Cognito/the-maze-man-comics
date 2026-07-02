import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { INK, SUB, SERIF } from './PracticeShell';

/*
 * Breathe — a guided breathing pacer. An animated circle expands on the inhale
 * and contracts on the exhale, with four evidence-based patterns. Non-medical.
 */

const ACCENT = '#5aa9c8';

const PATTERNS = [
  { id: 'box', en: 'Box', ar: 'الصندوق', d: { en: 'Calm & focus', ar: 'هدوء وتركيز' }, phases: [
    { a: 'in', s: 4, en: 'Breathe in', ar: 'شهيق' }, { a: 'hold', s: 4, en: 'Hold', ar: 'احبس' },
    { a: 'out', s: 4, en: 'Breathe out', ar: 'زفير' }, { a: 'hold', s: 4, en: 'Hold', ar: 'احبس' } ] },
  { id: '478', en: '4-7-8', ar: '٤-٧-٨', d: { en: 'Sleep & calm', ar: 'نوم وهدوء' }, phases: [
    { a: 'in', s: 4, en: 'Breathe in', ar: 'شهيق' }, { a: 'hold', s: 7, en: 'Hold', ar: 'احبس' },
    { a: 'out', s: 8, en: 'Breathe out', ar: 'زفير' } ] },
  { id: 'coherent', en: 'Coherent', ar: 'المتناغم', d: { en: '~5.5/min relax', ar: '≈٥٫٥/د استرخاء' }, phases: [
    { a: 'in', s: 5.5, en: 'Breathe in', ar: 'شهيق' }, { a: 'out', s: 5.5, en: 'Breathe out', ar: 'زفير' } ] },
  { id: 'sigh', en: 'Physiological sigh', ar: 'التنهيدة الفسيولوجية', d: { en: 'Fast stress relief', ar: 'تفريغ سريع للتوتر' }, phases: [
    { a: 'in', s: 2.4, en: 'Breathe in', ar: 'شهيق' }, { a: 'in', s: 1.2, en: 'Sip more air', ar: 'شهيق إضافي' },
    { a: 'out', s: 5, en: 'Long exhale', ar: 'زفير طويل' } ] },
];
const MINUTES = [1, 2, 3, 5];
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function BreathePractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [minutes, setMinutes] = useState(2);
  const [phase, setPhase] = useState('setup'); // setup | run | done
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [remaining, setRemaining] = useState(120);
  const [circle, setCircle] = useState({ scale: 0.45, dur: 0.3 });
  const lastScaleRef = useRef(0.45);

  const t = useMemo(() => ({
    title: isAr ? 'تنفّس' : 'Breathe',
    pick: isAr ? 'اختر النمط' : 'Choose a pattern',
    dur: isAr ? 'المدة' : 'Duration',
    start: isAr ? 'ابدأ' : 'Begin',
    stop: isAr ? 'إنهاء' : 'Finish',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    done: isAr ? 'أحسنت' : 'Nicely done',
    doneSub: isAr ? 'خذ لحظة قبل أن تكمل يومك.' : 'Take a moment before you carry on.',
    tip: isAr ? 'اجلس مرتاحاً وتنفّس من أنفك. اتبع الدائرة — تتّسع مع الشهيق وتنكمش مع الزفير.'
      : 'Sit comfortably and breathe through your nose. Follow the circle — it grows as you inhale and shrinks as you exhale.',
    note: isAr ? 'ممارسة للاسترخاء، وليست علاجاً طبياً.' : 'A relaxation practice, not medical treatment.',
  }), [isAr]);

  const finish = useCallback(() => { setPhase('done'); playSfx?.('collect'); }, [playSfx]);

  const start = useCallback(() => {
    lastScaleRef.current = 0.45;
    setPhaseIdx(0); setRemaining(minutes * 60); setCircle({ scale: 0.45, dur: 0.3 });
    setPhase('run'); playSfx?.('click');
  }, [minutes, playSfx]);

  // advance breathing phases + drive the circle
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const ph = pattern.phases[phaseIdx];
    let target = lastScaleRef.current;
    if (ph.a === 'in') target = 1;
    else if (ph.a === 'out') target = 0.45;
    lastScaleRef.current = target;
    setCircle({ scale: target, dur: ph.a === 'hold' ? 0.25 : ph.s });
    const id = setTimeout(() => setPhaseIdx((i) => (i + 1) % pattern.phases.length), ph.s * 1000);
    return () => clearTimeout(id);
  }, [phase, phaseIdx, pattern]);

  // session countdown
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const id = setInterval(() => setRemaining((r) => { if (r <= 1) { finish(); return 0; } return r - 1; }), 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  const ph = pattern.phases[phaseIdx];

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>

      {phase === 'setup' && (
        <div className="rxp-body">
          <div className="rxp-hero">🫁</div>
          <div className="rxp-field">
            <div className="rxp-label">{t.pick}</div>
            <div className="rxp-chips" style={{ flexDirection: 'column' }}>
              {PATTERNS.map((p) => (
                <button key={p.id} className={`rxp-chip${pattern.id === p.id ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setPattern(p); }}>
                  {isAr ? p.ar : p.en}<small>{isAr ? p.d.ar : p.d.en}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="rxp-field">
            <div className="rxp-label">{t.dur}</div>
            <div className="rxp-chips">
              {MINUTES.map((m) => (
                <button key={m} className={`rxp-chip${minutes === m ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setMinutes(m); }}>{m} {isAr ? 'د' : 'min'}</button>
              ))}
            </div>
          </div>
          <button className="rxp-primary" onClick={start}>{t.start}</button>
          <div className="rxp-tip">{t.tip}</div>
          <div className="rxp-tip">{t.note}</div>
        </div>
      )}

      {phase === 'run' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-remain">{fmt(remaining)}</div>
          <div className="brk-stage">
            <div className="brk-halo" style={{ transform: `scale(${circle.scale})`, transitionDuration: `${circle.dur}s` }} />
            <div className="brk-circle" style={{ transform: `scale(${circle.scale})`, transitionDuration: `${circle.dur}s` }} />
            <div className="brk-word">{isAr ? ph.ar : ph.en}</div>
          </div>
          <button className="rxp-ghost" onClick={() => { playSfx?.('click'); finish(); }}>{t.stop}</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">🌿</div>
          <div className="brk-doneT serif">{t.done}</div>
          <div className="brk-doneS">{t.doneSub}</div>
          <button className="rxp-primary" onClick={start}>{t.again}</button>
          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.brk-stage { position:relative; width:260px; height:260px; display:grid; place-items:center; margin:8px 0; }
.brk-halo { position:absolute; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(90,169,200,0.28), rgba(90,169,200,0) 70%); transition:transform ease-in-out; }
.brk-circle { position:absolute; width:180px; height:180px; border-radius:50%; background:linear-gradient(160deg, #7fc3dd, #4f96b8); box-shadow:0 8px 26px rgba(40,90,110,0.28), inset 0 4px 12px rgba(255,255,255,0.35); transition:transform ease-in-out; }
.brk-word { position:relative; z-index:2; font-family:${SERIF}; font-weight:600; font-size:24px; color:#0e3a4a; text-shadow:0 1px 3px rgba(255,255,255,0.5); }
.brk-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.brk-doneS { font-size:14px; color:${SUB}; max-width:300px; }
`;
