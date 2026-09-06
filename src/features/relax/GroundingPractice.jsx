import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { PracticeHero, INK, SUB, FAINT, SERIF } from './PracticeShell';
import { markWellbeingPracticeDone } from './habitState';
import { logPracticeSession } from './practiceLog';
import { CheckInBefore, CheckInAfter, CheckInResult, CHECKIN_CSS } from './PracticeCheckIn';
import SafetyNote, { SAFETY_CSS } from './SafetyNote';

/*
 * 5-4-3-2-1 Grounding — an orienting task that walks attention out through the
 * senses. Standard in trauma and DBT work, and the right tool for acute panic
 * precisely because it is NOT breath-focused: attending to the breath during a
 * panic attack can amplify the interoceptive cues the panic is feeding on.
 *
 * ⚠ IT NO LONGER TELLS YOU HOW YOU FEEL. This screen used to end on "Notice how
 * everything slowed down a little" — an outcome asserted on a user's behalf,
 * and wrong for exactly the people who most needed the tool to be honest. It
 * now asks, before and after, and reports the number they gave. See
 * PracticeCheckIn.
 */

const ACCENT = 'var(--rx-calm-core)';
const ACCENT_LIT = 'var(--rx-calm-lit)';

/*
 * ⚠ THE TASTE STEP IS THE ONE THAT BREAKS THE PRACTICE, and it broke it
 * silently. "Name 1 thing you can taste" is frequently unanswerable — most
 * people mid-panic have no taste in their mouth to report — so the practice's
 * final step was the one most likely to strand them on a screen they could not
 * complete, at the worst possible moment. The standard clinical variant is used
 * instead: notice whatever IS there, or bring a taste in deliberately.
 *
 * Each step also carries a short coaching line. The bare "Name 5 things you
 * see" is a instruction without a method, and the method is the active part:
 * naming them slowly and specifically is what occupies the attention that panic
 * is otherwise using.
 */
const STEPS = [
  { n: 5, ic: '👁️', en: 'you can see', ar: 'تراها',
    coachEn: 'Say each one to yourself, slowly. Be specific — not "a wall", but "the crack near the light switch".',
    coachAr: 'قل كل واحدة لنفسك ببطء. كن دقيقاً — لا "جدار"، بل "الشقّ قرب مفتاح الإنارة".' },
  { n: 4, ic: '✋', en: 'you can feel', ar: 'تلمسها',
    coachEn: 'Actually touch them. The floor under your feet, the seam of your sleeve, the temperature of the air.',
    coachAr: 'المسها فعلاً. الأرض تحت قدميك، حاشية كُمّك، حرارة الهواء.' },
  { n: 3, ic: '👂', en: 'you can hear', ar: 'تسمعها',
    coachEn: 'Let the far ones count too — traffic, a fan, someone in another room.',
    coachAr: 'اجعل البعيدة تُحتسب أيضاً — حركة مرور، مروحة، شخص في غرفة أخرى.' },
  { n: 2, ic: '👃', en: 'you can smell', ar: 'تشمّها',
    coachEn: 'If you cannot find two, it is fine to go and find one — your sleeve, a drink, the air by a window.',
    coachAr: 'إن لم تجد اثنتين، لا بأس أن تذهب وتجد واحدة — كُمّك، مشروب، الهواء عند نافذة.' },
  /* ⚠ AR agrees with the SINGULAR noun here ("شيئاً واحداً"), not the plural
     "أشياء" the other four steps take — hence تتذوّقه rather than تتذوّقها. */
  { n: 1, ic: '👅', en: 'you can taste — or one you could go and get', ar: 'تتذوّقه — أو واحداً يمكنك إحضاره',
    coachEn: 'Whatever is already in your mouth counts. So does a sip of water, on purpose.',
    coachAr: 'ما هو موجود في فمك أصلاً يُحتسب. وكذلك رشفة ماء، عن قصد.' },
];

export default function GroundingPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [phase, setPhase] = useState('intro'); // intro | before | step | after | result
  const [idx, setIdx] = useState(0);
  const [filled, setFilled] = useState(0);
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const startedAt = useRef(0);

  const t = useMemo(() => ({
    title: isAr ? 'التأريض ٥-٤-٣-٢-١' : '5-4-3-2-1 Grounding',
    intro: isAr
      ? 'عندما يتسارع القلق، أعِد انتباهك إلى اللحظة عبر حواسك الخمس. سنمرّ بها واحدة واحدة — لا شيء لتتذكّره، فقط ما هو أمامك الآن.'
      : "When anxiety spikes, bring your attention back to the present through your five senses. We'll go through them one at a time — nothing to remember, just what's in front of you.",
    start: isAr ? 'ابدأ' : 'Begin',
    /* ⚠ The noun is a separate token because it INFLECTS with the count, in
       both languages — "5 things" vs "1 thing", "٥ أشياء" vs "شيئاً واحداً".
       Folding it into each step's label produced "Name 5 you can see". */
    name: isAr ? 'سمِّ' : 'Name',
    things: isAr ? 'أشياء' : 'things',
    thing1: isAr ? 'شيئاً واحداً' : 'one thing',
    tapEach: isAr ? 'اضغط كل واحدة حين تلاحظها' : 'Tap each one as you notice it',
    doneT: isAr ? 'أنت هنا الآن' : "You're here, now",
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    note: isAr ? 'أداة تهدئة، وليست علاجاً طبياً.' : 'A calming tool, not medical treatment.',
  }), [isAr]);

  const startStep = useCallback((i) => { setIdx(i); setFilled(0); setPhase('step'); }, []);

  const beginPractice = useCallback((v) => {
    setBefore(v);
    startedAt.current = Date.now();
    startStep(0);
  }, [startStep]);

  const finishRatings = useCallback((v) => {
    setAfter(v);
    logPracticeSession({
      practice: 'grounding',
      before,
      after: v,
      seconds: (Date.now() - startedAt.current) / 1000,
    });
    markWellbeingPracticeDone('grounding');
    playSfx?.('collect');
    setPhase('result');
  }, [before, playSfx]);

  const tapPip = useCallback(() => {
    playSfx?.('click');
    setFilled((f) => {
      const nf = f + 1;
      const step = STEPS[idx];
      if (nf >= step.n) {
        setTimeout(() => {
          if (idx + 1 >= STEPS.length) setPhase('after');
          else startStep(idx + 1);
        }, 450);
      }
      return nf;
    });
  }, [idx, playSfx, startStep]);

  const restart = useCallback(() => {
    playSfx?.('click');
    setBefore(null); setAfter(null); setIdx(0); setFilled(0);
    setPhase('before');
  }, [playSfx]);

  const step = STEPS[idx];

  return (
    <PracticeShell title={t.title} accent={ACCENT} accentLit={ACCENT_LIT} isAr={isAr} onBack={onBack}>
      <style>{CSS}</style>
      <style>{CHECKIN_CSS}</style>
      <style>{SAFETY_CSS}</style>

      {phase === 'intro' && (
        <div className="rxp-body rxp-center">
          <PracticeHero emoji="🖐️" />
          <div className="grd-intro">{t.intro}</div>
          <button className="rxp-primary" onClick={() => { playSfx?.('click'); setPhase('before'); }}>{t.start}</button>
          <div className="rxp-tip">{t.note}</div>
          <SafetyNote isAr={isAr} />
        </div>
      )}

      {phase === 'before' && (
        <div className="rxp-body rxp-center">
          <CheckInBefore isAr={isAr} onDone={beginPractice} />
        </div>
      )}

      {phase === 'step' && (
        <div className="rxp-body rxp-center">
          <div className="grd-count">{step.n}</div>
          <div className="grd-ic">{step.ic}</div>
          <div className="grd-prompt serif">
            {step.n === 1
              ? `${t.name} ${t.thing1} ${isAr ? step.ar : step.en}`
              : `${t.name} ${step.n} ${t.things} ${isAr ? step.ar : step.en}`}
          </div>
          <div className="grd-coach">{isAr ? step.coachAr : step.coachEn}</div>
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

      {phase === 'after' && (
        <div className="rxp-body rxp-center">
          <CheckInAfter isAr={isAr} onDone={finishRatings} />
        </div>
      )}

      {phase === 'result' && (
        <div className="rxp-body rxp-center">
          <PracticeHero emoji="🌿" />
          <div className="grd-doneT serif">{t.doneT}</div>
          <CheckInResult
            isAr={isAr}
            practice="grounding"
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

/* Names for the "what works for you" line. Local and tiny on purpose: importing
   the practice registry here would pull the Wellbeing landing's data into every
   practice chunk, and these three are the only measured practices there are. */
export const PRACTICE_NAMES = (isAr) => (isAr
  ? { breathe: 'تنفّس', grounding: 'التأريض', pmr: 'استرخاء العضلات' }
  : { breathe: 'Breathe', grounding: 'Grounding', pmr: 'Muscle Relaxation' });

const CSS = `
.grd-intro { font-size:15px; color:${SUB}; line-height:1.7; max-width:340px; }
.grd-count { font-family:${SERIF}; font-size:72px; font-weight:700; color:var(--rx-hue-lit); line-height:1; }
.grd-ic { font-size:46px; margin-top:-6px; }
.grd-prompt { font-family:${SERIF}; font-size:24px; font-weight:600; color:${INK}; max-width:320px; }
.grd-coach { font-size:13px; color:${SUB}; line-height:1.6; max-width:320px; }
.grd-hint { font-size:13px; color:${FAINT}; }
.grd-pips { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:8px; }
.grd-pip { width:42px; height:42px; border-radius:50%; border:1px solid var(--rx-hair); background:var(--rx-card); cursor:pointer; transition:all .18s; box-shadow:var(--elev-rest); }
.grd-pip.on { background:var(--rx-hue); border-color:var(--rx-hue); transform:scale(1.08); }
.grd-pip:disabled { opacity:0.5; cursor:default; }
.grd-pip.on:disabled { opacity:1; }
.grd-progress { display:flex; gap:7px; margin-top:14px; }
.grd-dot { width:8px; height:8px; border-radius:50%; background:color-mix(in srgb, var(--rx-ink) 16%, transparent); }
.grd-dot.done { background:var(--rx-hue); }
.grd-dot.cur { background:var(--rx-hue-lit); transform:scale(1.3); }
.grd-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
`;
