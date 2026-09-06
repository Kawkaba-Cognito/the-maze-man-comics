import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, SERIF } from './PracticeShell';
import { markWellbeingPracticeDone } from './habitState';
import { logPracticeSession } from './practiceLog';
import { CheckInBefore, CheckInAfter, CheckInResult, CHECKIN_CSS } from './PracticeCheckIn';
import SafetyNote, { PracticeCaution, SAFETY_CSS } from './SafetyNote';
import { PRACTICE_NAMES } from './GroundingPractice';

/*
 * Breathe — a guided pacer. A circle expands on the inhale and contracts on the
 * exhale, over four patterns that do genuinely different jobs.
 *
 * ⚠ EACH PATTERN NOW SAYS WHAT IT IS FOR AND WHAT IT COSTS. "Box · calm &
 * focus" is a label, not information; a user picking between four patterns had
 * no basis to pick. They differ in mechanism (exhale-lengthening vs. equal
 * pacing vs. a double inhale) and in demand — 4-7-8 is a 19-second cycle, which
 * is a lot of air discipline for a beginner and is the one pattern that can
 * make an anxious person feel worse.
 */

const ACCENT = 'var(--rx-calm-core)';
const ACCENT_LIT = 'var(--rx-calm-lit)';

/*
 * ⚠ `maxMin` EXISTS BECAUSE OF 4-7-8 SPECIFICALLY. Weil's own instruction for
 * that pattern is FOUR CYCLES to begin with; at 19s a cycle, the old flat 5-
 * minute option served roughly sixteen — four times the recommended starting
 * dose of the one pattern with a long breath-hold, which is also the one most
 * able to reproduce the light-headedness an anxious user is already frightened
 * of. The cap is per-pattern rather than global because the coherent pattern
 * genuinely wants five minutes: slow paced breathing is a dose-dependent vagal
 * lever, and cutting it short would remove the reason to use it.
 */
const PATTERNS = [
  {
    id: 'box', en: 'Box', ar: 'الصندوق',
    d: { en: 'Steady and even — good under pressure', ar: 'ثابت ومتّزن — مناسب تحت الضغط' },
    noteEn: 'Equal counts in, hold, out, hold. Used for staying level rather than winding all the way down.',
    noteAr: 'أعداد متساوية: شهيق، حبس، زفير، حبس. يُستخدم للبقاء متّزناً أكثر من الاسترخاء الكامل.',
    phases: [
      { a: 'in', s: 4, en: 'Breathe in', ar: 'شهيق' }, { a: 'hold', s: 4, en: 'Hold', ar: 'احبس' },
      { a: 'out', s: 4, en: 'Breathe out', ar: 'زفير' }, { a: 'hold', s: 4, en: 'Hold', ar: 'احبس' }],
  },
  {
    id: '478', en: '4-7-8', ar: '٤-٧-٨',
    d: { en: 'Long exhale — for sleep, not for panic', ar: 'زفير طويل — للنوم لا للذعر' },
    noteEn: 'The most demanding pattern here: a 19-second cycle with a long hold. Start with about four cycles.',
    noteAr: 'أكثر الأنماط صعوبة: دورة من ١٩ ثانية مع حبس طويل. ابدأ بأربع دورات تقريباً.',
    maxMin: 2,
    phases: [
      { a: 'in', s: 4, en: 'Breathe in', ar: 'شهيق' }, { a: 'hold', s: 7, en: 'Hold', ar: 'احبس' },
      { a: 'out', s: 8, en: 'Breathe out', ar: 'زفير' }],
  },
  {
    id: 'coherent', en: 'Coherent', ar: 'المتناغم',
    d: { en: 'About 5.5 breaths a minute', ar: 'نحو ٥٫٥ نفَس في الدقيقة' },
    noteEn: 'No holds, nothing to brace against — the easiest to sustain, and the one worth giving five minutes.',
    noteAr: 'بلا حبس، ولا شيء تتحمّله — الأسهل للاستمرار، والأجدر بخمس دقائق كاملة.',
    phases: [
      { a: 'in', s: 5.5, en: 'Breathe in', ar: 'شهيق' }, { a: 'out', s: 5.5, en: 'Breathe out', ar: 'زفير' }],
  },
  {
    id: 'sigh', en: 'Physiological sigh', ar: 'التنهيدة الفسيولوجية',
    d: { en: 'Two quick inhales, one long release', ar: 'شهيقان سريعان وزفير طويل' },
    noteEn: 'The fastest of the four. A second short sip of air on top of the first, then let it all go.',
    noteAr: 'الأسرع بين الأربعة. رشفة هواء قصيرة ثانية فوق الأولى، ثم أطلق كل شيء.',
    phases: [
      { a: 'in', s: 2.4, en: 'Breathe in', ar: 'شهيق' }, { a: 'in', s: 1.2, en: 'Sip more air', ar: 'شهيق إضافي' },
      { a: 'out', s: 5, en: 'Long exhale', ar: 'زفير طويل' }],
  },
];
const MINUTES = [1, 2, 3, 5];
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function BreathePractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [pattern, setPattern] = useState(PATTERNS[0]);
  const [minutes, setMinutes] = useState(2);
  const [phase, setPhase] = useState('setup'); // setup | before | run | after | result
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [remaining, setRemaining] = useState(120);
  const [circle, setCircle] = useState({ scale: 0.45, dur: 0.3 });
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const lastScaleRef = useRef(0.45);
  const startedAt = useRef(0);

  // A pattern with a cap must not keep a longer duration selected from before.
  const allowedMinutes = useMemo(
    () => MINUTES.filter((m) => !pattern.maxMin || m <= pattern.maxMin),
    [pattern],
  );
  useEffect(() => {
    if (!allowedMinutes.includes(minutes)) setMinutes(allowedMinutes[allowedMinutes.length - 1]);
  }, [allowedMinutes, minutes]);

  const t = useMemo(() => ({
    title: isAr ? 'تنفّس' : 'Breathe',
    pick: isAr ? 'اختر النمط' : 'Choose a pattern',
    dur: isAr ? 'المدة' : 'Duration',
    start: isAr ? 'ابدأ' : 'Begin',
    stop: isAr ? 'إنهاء' : 'Finish',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    done: isAr ? 'اكتملت الجلسة' : 'Session complete',
    cycles: isAr ? 'دورات' : 'cycles',
    tip: isAr
      ? 'اجلس مرتاحاً وتنفّس من أنفك. اتبع الدائرة — تتّسع مع الشهيق وتنكمش مع الزفير. إن لم تصل إلى العدد كاملاً، لا بأس؛ اتبعها بقدر ما تستطيع.'
      : 'Sit comfortably and breathe through your nose. Follow the circle — it grows as you inhale and shrinks as you exhale. If you cannot reach a full count, that is fine; follow it as far as you comfortably can.',
    caution: isAr
      ? 'لا تمارس هذا أثناء القيادة أو تشغيل الآلات. إن شعرت بدوار أو وخز أو ضيق، عد إلى تنفّسك الطبيعي — فهذه علامات فرط تهوية لا خطر. تمهّل إن كنت مصاباً بالربو أو أمراض تنفّسية أو قلبية أو كنتِ حاملاً.'
      : 'Not while driving or operating machinery. If you feel dizzy, tingly, or short of breath, return to your normal breathing — those are signs of over-breathing, not danger. Go gently if you have asthma, a respiratory or cardiac condition, or are pregnant.',
    note: isAr ? 'ممارسة للاسترخاء، وليست علاجاً طبياً.' : 'A relaxation practice, not medical treatment.',
  }), [isAr]);

  const beginPractice = useCallback((v) => {
    setBefore(v);
    startedAt.current = Date.now();
    lastScaleRef.current = 0.45;
    setPhaseIdx(0); setCycles(0); setRemaining(minutes * 60); setCircle({ scale: 0.45, dur: 0.3 });
    setPhase('run'); playSfx?.('click');
  }, [minutes, playSfx]);

  const finishRatings = useCallback((v) => {
    setAfter(v);
    logPracticeSession({
      practice: 'breathe',
      before,
      after: v,
      seconds: (Date.now() - startedAt.current) / 1000,
      meta: { pattern: pattern.id },
    });
    markWellbeingPracticeDone('breathe');
    playSfx?.('collect');
    setPhase('result');
  }, [before, pattern.id, playSfx]);

  // advance breathing phases + drive the circle
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const ph = pattern.phases[phaseIdx];
    let target = lastScaleRef.current;
    if (ph.a === 'in') target = 1;
    else if (ph.a === 'out') target = 0.45;
    lastScaleRef.current = target;
    setCircle({ scale: target, dur: ph.a === 'hold' ? 0.25 : ph.s });
    const id = setTimeout(() => setPhaseIdx((i) => {
      const next = (i + 1) % pattern.phases.length;
      if (next === 0) setCycles((c) => c + 1);
      return next;
    }), ph.s * 1000);
    return () => clearTimeout(id);
  }, [phase, phaseIdx, pattern]);

  // session countdown
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const id = setInterval(() => setRemaining((r) => {
      if (r <= 1) { setPhase('after'); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const restart = useCallback(() => {
    playSfx?.('click');
    setBefore(null); setAfter(null);
    setPhase('setup');
  }, [playSfx]);

  const ph = pattern.phases[phaseIdx];

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>
      <style>{CHECKIN_CSS}</style>
      <style>{SAFETY_CSS}</style>

      {phase === 'setup' && (
        <div className="rxp-body">
          <PracticeHero emoji="🫁" />
          <div className="rxp-field">
            <div className="rxp-label">{t.pick}</div>
            <div className="rxp-chips" style={{ flexDirection: 'column' }}>
              {PATTERNS.map((p) => (
                <button key={p.id} className={`rxp-chip${pattern.id === p.id ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setPattern(p); }}>
                  {isAr ? p.ar : p.en}<small>{isAr ? p.d.ar : p.d.en}</small>
                </button>
              ))}
            </div>
            <p className="brk-pattern-note">{isAr ? pattern.noteAr : pattern.noteEn}</p>
          </div>
          <div className="rxp-field">
            <div className="rxp-label">{t.dur}</div>
            <div className="rxp-chips">
              {allowedMinutes.map((m) => (
                <button key={m} className={`rxp-chip${minutes === m ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setMinutes(m); }}>{m} {isAr ? 'د' : 'min'}</button>
              ))}
            </div>
          </div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('before'); }}>{t.start}</button>
          <div className="rxp-tip">{t.tip}</div>
          <PracticeCaution>{t.caution}</PracticeCaution>
          <div className="rxp-tip">{t.note}</div>
          <SafetyNote isAr={isAr} />
        </div>
      )}

      {phase === 'before' && (
        <div className="rxp-body rxp-center">
          <CheckInBefore isAr={isAr} onDone={beginPractice} />
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
          <div className="brk-cycles">{cycles} {t.cycles}</div>
          <button className="rxp-ghost" onClick={() => { playSfx?.('click'); setPhase('after'); }}>{t.stop}</button>
        </div>
      )}

      {phase === 'after' && (
        <div className="rxp-body rxp-center">
          <CheckInAfter isAr={isAr} onDone={finishRatings} />
        </div>
      )}

      {phase === 'result' && (
        <div className="rxp-body rxp-center">
          <PracticeHero emoji="🌿" />
          <div className="brk-doneT serif">{t.done}</div>
          <CheckInResult
            isAr={isAr}
            practice="breathe"
            before={before}
            after={after}
            practiceNames={PRACTICE_NAMES(isAr)}
          />
          <button className="rxp-primary" onClick={restart}>{t.again}</button>
          <button className="rxp-ghost" onClick={onBack}>{t.back}</button>
          <SafetyNote isAr={isAr} />
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.brk-stage { position:relative; width:260px; height:260px; display:grid; place-items:center; margin:8px 0; }
.brk-halo { position:absolute; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, color-mix(in srgb, var(--rx-hue-lit) 30%, transparent), transparent 70%); transition:transform ease-in-out; }
.brk-circle { position:absolute; width:180px; height:180px; border-radius:50%; background:linear-gradient(160deg, var(--rx-hue-lit), var(--rx-hue)); box-shadow:var(--elev-raise); transition:transform ease-in-out; }
.brk-word { position:relative; z-index:2; font-family:${SERIF}; font-weight:600; font-size:24px; color:#fff; }
.brk-cycles { font-size:12.5px; font-weight:700; color:${FAINT}; letter-spacing:1px; }
.brk-pattern-note { margin:2px 0 0; font-size:12.5px; color:${SUB}; line-height:1.6; }
.brk-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
`;
