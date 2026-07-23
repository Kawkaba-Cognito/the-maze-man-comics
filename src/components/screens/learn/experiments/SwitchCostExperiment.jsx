import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult, ExpSteps, ExpCountdown, expStimStyle, avgRT, pct } from './expShared';

/*
 * Switch-cost task — fixed rule vs true alternation. Practice then scored.
 */

const PRACTICE_N = 2;
const SCORED_N = 10;
const ODD_DIGITS = [1, 3, 7, 9];
const EVEN_DIGITS = [2, 4, 6, 8];
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'K', 'L', 'M', 'N', 'R'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function makeParityTrial() {
  const isOdd = Math.random() < 0.5;
  const value = isOdd ? pick(ODD_DIGITS) : pick(EVEN_DIGITS);
  return { task: 'parity', value: String(value), answer: isOdd ? 'ODD' : 'EVEN' };
}
function makeVowelTrial() {
  const isVowel = Math.random() < 0.5;
  const value = isVowel ? pick(VOWELS) : pick(CONSONANTS);
  return { task: 'vowel', value, answer: isVowel ? 'VOWEL' : 'CONSONANT' };
}

const TEXT = {
  en: {
    introTitle: 'Prove your own switching cost',
    introBody: 'You will answer as fast as you can. First a short practice, then Round 1 (one rule), then Round 2 (two rules alternating every trial).',
    steps: [
      'Practice: 2 warm-up trials (not scored).',
      'Round 1: Odd / Even only — 10 trials.',
      'Round 2: Odd/Even and Vowel/Consonant alternate every trial — 10 trials.',
    ],
    start: 'Start practice',
    ready: 'Get ready',
    practiceLabel: 'Practice',
    block1Label: 'Round 1 — same rule',
    block2Label: 'Round 2 — switching rules',
    block2Intro: 'Now the rule flips every trial. Stay sharp — we are still timing you.',
    continueBtn: 'Start round 2',
    again: 'Run it again',
    parityCue: 'Odd or even?',
    vowelCue: 'Vowel or consonant?',
    odd: 'ODD', even: 'EVEN', vowel: 'VOWEL', consonant: 'CONSONANT',
    sameRule: 'Same rule', switching: 'Switching',
    accuracy: 'Accuracy',
  },
  ar: {
    introTitle: 'أثبت لنفسك تكلفة التبديل',
    introBody: 'ستجيب بأسرع ما يمكن. أولاً تمرين قصير، ثم الجولة الأولى (قاعدة واحدة)، ثم الجولة الثانية (قاعدتان تتبادلان كل محاولة).',
    steps: [
      'تمرين: محاولتان للإحماء (غير مسجّلتين).',
      'الجولة ١: فردي / زوجي فقط — ١٠ محاولات.',
      'الجولة ٢: فردي/زوجي وعلّة/ساكن يتبادلان كل محاولة — ١٠ محاولات.',
    ],
    start: 'ابدأ التمرين',
    ready: 'استعد',
    practiceLabel: 'تمرين',
    block1Label: 'الجولة ١ — قاعدة ثابتة',
    block2Label: 'الجولة ٢ — قواعد متبدّلة',
    block2Intro: 'الآن القاعدة تتبدّل كل محاولة. انتبه — ما زلنا نقيس وقتك.',
    continueBtn: 'ابدأ الجولة ٢',
    again: 'أعد المحاولة',
    parityCue: 'فردي أم زوجي؟',
    vowelCue: 'حرف علة أم ساكن؟',
    odd: 'فردي', even: 'زوجي', vowel: 'علّة', consonant: 'ساكن',
    sameRule: 'قاعدة ثابتة', switching: 'تبديل',
    accuracy: 'الدقة',
  },
};

export default function SwitchCostExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  // intro | countdown | practice | block1 | block1done | countdown2 | block2 | result
  const [phase, setPhase] = useState('intro');
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState(null);
  const resultsRef = useRef({ block1: [], block2: [] });
  const t0Ref = useRef(0);
  const afterCountdownRef = useRef('practice');

  const makeTrialFor = useCallback((block, index) => {
    if (block === 'practice' || block === 'block1') return makeParityTrial();
    // True alternation: even index → parity, odd → vowel
    return index % 2 === 0 ? makeParityTrial() : makeVowelTrial();
  }, []);

  function beginCountdown(next) {
    afterCountdownRef.current = next;
    setPhase('countdown');
  }

  const finishCountdown = useCallback(() => {
    const next = afterCountdownRef.current;
    if (next === 'practice') resultsRef.current = { block1: [], block2: [] };
    else if (next === 'block1') resultsRef.current.block1 = [];
    else if (next === 'block2') resultsRef.current.block2 = [];
    setTrialIndex(0);
    setPhase(next);
  }, []);

  useEffect(() => {
    if (phase !== 'practice' && phase !== 'block1' && phase !== 'block2') return;
    const next = makeTrialFor(phase, trialIndex);
    setTrial(next);
    t0Ref.current = performance.now();
  }, [phase, trialIndex, makeTrialFor]);

  function answer(choice) {
    if (!trial) return;
    const rt = performance.now() - t0Ref.current;
    const correct = choice === trial.answer;
    playSfx?.(correct ? 'click' : 'error');

    if (phase === 'practice') {
      const nextIndex = trialIndex + 1;
      if (nextIndex >= PRACTICE_N) beginCountdown('block1');
      else setTrialIndex(nextIndex);
      return;
    }

    resultsRef.current[phase].push({ rt, correct });
    const nextIndex = trialIndex + 1;
    if (nextIndex >= SCORED_N) {
      setPhase(phase === 'block1' ? 'block1done' : 'result');
    } else {
      setTrialIndex(nextIndex);
    }
  }

  function reset() {
    resultsRef.current = { block1: [], block2: [] };
    setTrial(null);
    setTrialIndex(0);
    setPhase('intro');
  }

  const buttonsFor = (task) => (task === 'parity'
    ? [{ label: t.odd, value: 'ODD' }, { label: t.even, value: 'EVEN' }]
    : [{ label: t.vowel, value: 'VOWEL' }, { label: t.consonant, value: 'CONSONANT' }]);

  const labelForPhase = () => {
    if (phase === 'practice') return `${t.practiceLabel} — ${trialIndex + 1}/${PRACTICE_N}`;
    if (phase === 'block1') return `${t.block1Label} — ${trialIndex + 1}/${SCORED_N}`;
    if (phase === 'block2') return `${t.block2Label} — ${trialIndex + 1}/${SCORED_N}`;
    return '';
  };

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 10px' }}>{t.introBody}</p>
          <ExpSteps chrome={chrome} steps={t.steps} />
          <ExpButton onClick={() => { playSfx?.('click'); beginCountdown('practice'); }}>{t.start}</ExpButton>
        </>
      )}

      {phase === 'countdown' && (
        <ExpCountdown chrome={chrome} label={t.ready} onDone={finishCountdown} />
      )}

      {(phase === 'practice' || phase === 'block1' || phase === 'block2') && trial && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: chrome.muted, marginBottom: 6 }}>
            {labelForPhase()}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: chrome.accent, marginBottom: 4 }}>
            {trial.task === 'parity' ? t.parityCue : t.vowelCue}
          </div>
          <div style={{ ...expStimStyle(chrome), fontSize: 40, color: chrome.text }}>{trial.value}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {buttonsFor(trial.task).map((b) => (
              <ExpButton key={b.value} variant="ghost" style={{ flex: 1 }} onClick={() => answer(b.value)}>
                {b.label}
              </ExpButton>
            ))}
          </div>
        </>
      )}

      {phase === 'block1done' && (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.block2Intro}</p>
          <ExpButton onClick={() => { playSfx?.('click'); beginCountdown('block2'); }}>{t.continueBtn}</ExpButton>
        </>
      )}

      {phase === 'result' && (() => {
        const b1 = resultsRef.current.block1;
        const b2 = resultsRef.current.block2;
        const singleRT = avgRT(b1);
        const switchRT = avgRT(b2);
        const cost = Math.round(switchRT - singleRT);
        const acc1 = pct(b1.filter((r) => r.correct).length, b1.length);
        const acc2 = pct(b2.filter((r) => r.correct).length, b2.length);
        return (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.sameRule}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 24, color: chrome.text }}>{Math.round(singleRT)}ms</div>
                <div style={{ fontSize: 11, color: chrome.muted }}>{t.accuracy}: {acc1}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.switching}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 24, color: chrome.text }}>{Math.round(switchRT)}ms</div>
                <div style={{ fontSize: 11, color: chrome.muted }}>{t.accuracy}: {acc2}%</div>
              </div>
            </div>
            <ExpResult chrome={chrome}>
              {cost > 20
                ? (isAr
                  ? <>دفع دماغك نحو <strong>{cost} م.ث</strong> إضافية في كل تبديل قاعدة — هذه <strong>تكلفة التبديل</strong>. لم تفكّر في شيئين معاً؛ بدّلت بينهما. نفس الضريبة عند التنقّل بين الرسائل والعمل العميق، أو النظر إلى الشاشة أثناء حديث.</>
                  : <>Your brain paid roughly <strong>{cost}ms</strong> extra every time the rule flipped — that is your real <strong>switching cost</strong>. You were not thinking two things at once; you were flipping. Same tax when you bounce between chat and deep work, or glance at a phone mid-conversation.</>)
                : (isAr
                  ? 'كانت النتيجتان متقاربتين هذه المرة — التأثير حقيقي في المتوسط لكنه يتفاوت من جلسة لأخرى. أعد التجربة وراقب الفرق، خاصة بعد يوم مليء بتبديل النوافذ.'
                  : 'Close race this time — the effect is real on average but varies session to session. Run it again after a day of tab-switching and watch the gap.')}
            </ExpResult>
            <div style={{ marginTop: 12 }}>
              <ExpButton variant="ghost" onClick={() => { playSfx?.('click'); reset(); }}>{t.again}</ExpButton>
            </div>
          </>
        );
      })()}
    </ExpCard>
  );
}
