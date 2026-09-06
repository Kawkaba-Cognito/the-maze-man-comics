import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, SERIF } from './PracticeShell';
import { markWellbeingPracticeDone } from './habitState';
import { logPracticeSession } from './practiceLog';
import { CheckInBefore, CheckInAfter, CheckInResult, CHECKIN_CSS } from './PracticeCheckIn';
import SafetyNote, { PracticeCaution, SAFETY_CSS } from './SafetyNote';
import { PRACTICE_NAMES } from './GroundingPractice';

/*
 * Progressive Muscle Relaxation (Jacobson; abbreviated Bernstein & Borkovec
 * protocol) — tense a group, release it, and attend to the difference.
 *
 * ⚠ THE RELEASE IS THE PRACTICE, AND THE RATIO CARRIES IT. Tensing is only
 * there to make the contrast legible; the therapeutic content is the long,
 * attended release. So release runs 3× the tension (5s / 15s) and the release
 * screen now says what to attend TO — the old build just said "Release &
 * notice", which names the action without naming its object, and the mechanism
 * here is discrimination training: learning to feel the difference between a
 * tense muscle and a loose one is what later lets you catch tension early.
 */

const ACCENT = 'var(--rx-sleep-core)';
const ACCENT_LIT = 'var(--rx-sleep-lit)';
const TENSE_S = 5;
const RELEASE_S = 15;

const GROUPS = [
  { en: 'Hands & forearms', ar: 'اليدان والساعدان', cue: { en: 'Clench both fists tight', ar: 'اقبض قبضتيك بإحكام' } },
  { en: 'Upper arms', ar: 'العضدان', cue: { en: 'Bend your elbows, tense your biceps', ar: 'اثنِ مرفقيك وشُدّ عضلاتك' } },
  { en: 'Shoulders', ar: 'الكتفان', cue: { en: 'Shrug them up toward your ears', ar: 'ارفعهما نحو أذنيك' } },
  { en: 'Face', ar: 'الوجه', cue: { en: 'Scrunch your whole face', ar: 'قطّب وجهك بالكامل' } },
  { en: 'Neck', ar: 'الرقبة', cue: { en: 'Gently press your head back — go easy here', ar: 'اضغط رأسك للخلف برفق — تمهّل هنا' } },
  { en: 'Chest & back', ar: 'الصدر والظهر', cue: { en: 'Deep breath in, arch slightly', ar: 'شهيق عميق وتقوّس قليلاً' } },
  { en: 'Stomach', ar: 'البطن', cue: { en: 'Tighten your abdomen', ar: 'شُدّ عضلات بطنك' } },
  { en: 'Thighs', ar: 'الفخذان', cue: { en: 'Press your thighs together', ar: 'اضغط فخذيك معاً' } },
  { en: 'Calves & feet', ar: 'الساقان والقدمان', cue: { en: 'Point your toes, tense your calves', ar: 'مُدّ أصابع قدميك وشُدّ ساقيك' } },
];

/* Rotating attention cues for the release phase — the same instruction worded
   nine identical times stops being read by group three. */
const RELEASE_CUES = [
  { en: 'Let it go all at once. Feel the difference against how it was a second ago.', ar: 'أطلقها دفعة واحدة. لاحظ الفرق عمّا كانت عليه قبل ثانية.' },
  { en: 'Notice the warmth, or the heaviness, or the tingling — whatever is actually there.', ar: 'لاحظ الدفء أو الثِّقل أو الوخز — أياً كان الموجود فعلاً.' },
  { en: 'Nothing to do now. Just keep your attention parked on this part of you.', ar: 'لا شيء لتفعله الآن. فقط أبقِ انتباهك على هذا الجزء منك.' },
  { en: 'Let it get looser than "relaxed". There is usually more slack available.', ar: 'دعها ترتخي أكثر من "مسترخية". عادةً هناك مساحة إضافية.' },
];

export default function PmrPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('intro'); // intro | before | run | after | result
  const [gIdx, setGIdx] = useState(0);
  const [sub, setSub] = useState('tense'); // tense | release
  const [secsLeft, setSecsLeft] = useState(TENSE_S);
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const startedAt = useRef(0);

  const t = useMemo(() => ({
    title: isAr ? 'استرخاء العضلات' : 'Muscle Relaxation',
    intro: isAr
      ? 'سنشدّ كل مجموعة عضلية ثم نُرخيها، ونلاحظ الفرق. الجزء المهم هو الإرخاء لا الشدّ. اجلس أو استلقِ في مكان مريح.'
      : "We'll tense each muscle group, then release it and notice the difference. The release is the part that matters, not the tensing. Sit or lie down somewhere comfortable.",
    start: isAr ? 'ابدأ' : 'Begin',
    tense: isAr ? 'شُدّ' : 'Tense',
    release: isAr ? 'أرخِ' : 'Release',
    stop: isAr ? 'إنهاء' : 'Finish',
    doneT: isAr ? 'اكتمل المسح' : 'Body scan complete',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    note: isAr ? 'ممارسة استرخاء، وليست علاجاً طبياً.' : 'A relaxation practice, not medical treatment.',
    caution: isAr
      ? 'شُدّ العضلة إلى نحو ٧٠٪ فقط — لا إلى حدّ الألم — وتجاوز أي منطقة مصابة أو مؤلمة أو خضعت لجراحة حديثة. إن أزعجك تشنّج أو ازداد شعورك سوءاً، توقّف وافتح عينيك.'
      : 'Tense to about 70% — never to the point of pain — and skip any area that is injured, sore, or recently operated on. If you cramp, or if this starts to feel worse rather than better, stop and open your eyes.',
    of: isAr ? 'من' : 'of',
  }), [isAr]);

  const beginPractice = useCallback((v) => {
    setBefore(v);
    startedAt.current = Date.now();
    setGIdx(0); setSub('tense'); setSecsLeft(TENSE_S); setPhase('run');
    playSfx?.('click');
  }, [playSfx]);

  const finishRatings = useCallback((v) => {
    setAfter(v);
    logPracticeSession({
      practice: 'pmr',
      before,
      after: v,
      seconds: (Date.now() - startedAt.current) / 1000,
    });
    markWellbeingPracticeDone('pmr');
    playSfx?.('collect');
    setPhase('result');
  }, [before, playSfx]);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    const dur = sub === 'tense' ? TENSE_S : RELEASE_S;
    setSecsLeft(dur);
    const tick = setInterval(() => setSecsLeft((s) => Math.max(0, s - 1)), 1000);
    const id = setTimeout(() => {
      if (sub === 'tense') { setSub('release'); }
      else if (gIdx + 1 >= GROUPS.length) { setPhase('after'); }
      else { setGIdx(gIdx + 1); setSub('tense'); }
    }, dur * 1000);
    return () => { clearInterval(tick); clearTimeout(id); };
  }, [phase, gIdx, sub]);

  const restart = useCallback(() => {
    playSfx?.('click');
    setBefore(null); setAfter(null); setGIdx(0); setSub('tense');
    setPhase('before');
  }, [playSfx]);

  const g = GROUPS[gIdx];
  const tensing = sub === 'tense';
  const releaseCue = RELEASE_CUES[gIdx % RELEASE_CUES.length];

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>
      <style>{CHECKIN_CSS}</style>
      <style>{SAFETY_CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <PracticeHero emoji="💪" />
          <div className="pmr-intro">{t.intro}</div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('before'); }}>{t.start}</button>
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
          <div className="rxp-remain">{gIdx + 1} {t.of} {GROUPS.length}</div>
          <div className="pmr-group serif">{isAr ? g.ar : g.en}</div>
          <div className={`pmr-circle ${tensing ? 'tense' : 'release'}`}>
            <span className="pmr-num">{secsLeft}</span>
          </div>
          <div className={`pmr-action ${tensing ? 'tense' : 'release'}`}>{tensing ? t.tense : t.release}</div>
          <div className="pmr-cue">{tensing ? (isAr ? g.cue.ar : g.cue.en) : (isAr ? releaseCue.ar : releaseCue.en)}</div>
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
          <PracticeHero emoji="🌙" />
          <div className="pmr-doneT serif">{t.doneT}</div>
          <CheckInResult
            isAr={isAr}
            practice="pmr"
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
.pmr-intro { font-size:15px; color:${SUB}; line-height:1.7; max-width:340px; }
.pmr-group { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.pmr-circle { width:170px; height:170px; border-radius:50%; display:grid; place-items:center; margin:6px 0; transition:transform .6s ease-in-out, background .6s, box-shadow .6s; }
.pmr-circle.tense { transform:scale(0.86); background:var(--rx-hue); box-shadow:var(--elev-raise); }
.pmr-circle.release { transform:scale(1.12); background:color-mix(in srgb, var(--rx-hue-lit) 62%, transparent); box-shadow:var(--elev-rest); }
.pmr-num { font-family:${SERIF}; font-size:52px; font-weight:700; color:#fff; }
.pmr-action { font-weight:800; font-size:18px; letter-spacing:1px; }
.pmr-action.tense { color:var(--rx-hue-lit); }
.pmr-action.release { color:var(--rx-calm-lit); }
.pmr-cue { font-size:14px; color:${SUB}; max-width:320px; line-height:1.6; min-height:44px; }
.pmr-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.pmr-doneS { font-size:14px; color:${FAINT}; max-width:300px; }
`;
