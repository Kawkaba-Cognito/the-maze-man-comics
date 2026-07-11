import React, { useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult, expStimStyle } from './expShared';

/*
 * Switch-cost task — the personal proof behind "multitasking is switching,
 * and switching has a cost." Block 1: one fixed rule (odd/even), 8 trials.
 * Block 2: the same two rules (odd/even, vowel/consonant) alternating every
 * trial, with a visible rule cue. Compares average RT between the blocks.
 */

const N_TRIALS = 8;
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
    introBody: "Round 1 is one simple rule, 8 times. Round 2 is the same two rules, but the rule changes every single trial. Answer as fast as you can — we're timing you.",
    start: 'Start round 1',
    block1Label: 'Round 1 — same rule',
    block2Label: 'Round 2 — switching rules',
    block2Intro: 'Now the rule changes every round. Stay sharp.',
    continueBtn: 'Start round 2',
    again: 'Run it again',
    parityCue: 'Odd or even?',
    vowelCue: 'Vowel or consonant?',
    odd: 'ODD', even: 'EVEN', vowel: 'VOWEL', consonant: 'CONSONANT',
    sameRule: 'Same rule', switching: 'Switching rules',
  },
  ar: {
    introTitle: 'أثبت لنفسك تكلفة التبديل',
    introBody: 'الجولة الأولى قاعدة واحدة بسيطة، 8 مرات. الجولة الثانية نفس القاعدتين، لكنها تتغيّر كل مرة. أجب بأسرع ما يمكن — نحن نقيس وقتك.',
    start: 'ابدأ الجولة الأولى',
    block1Label: 'الجولة الأولى — قاعدة ثابتة',
    block2Label: 'الجولة الثانية — قواعد متبدّلة',
    block2Intro: 'الآن القاعدة تتغيّر كل جولة. انتبه.',
    continueBtn: 'ابدأ الجولة الثانية',
    again: 'أعد المحاولة',
    parityCue: 'فردي أم زوجي؟',
    vowelCue: 'حرف علة أم ساكن؟',
    odd: 'فردي', even: 'زوجي', vowel: 'علّة', consonant: 'ساكن',
    sameRule: 'قاعدة ثابتة', switching: 'قواعد متبدّلة',
  },
};

export default function SwitchCostExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | block1 | block1done | block2 | result
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState(null);
  const resultsRef = useRef({ block1: [], block2: [] });
  const t0Ref = useRef(0);

  function startBlock(block) {
    resultsRef.current[block] = [];
    setTrialIndex(0);
    setPhase(block);
  }

  useEffect(() => {
    if (phase !== 'block1' && phase !== 'block2') return;
    const next = phase === 'block1' ? makeParityTrial() : (Math.random() < 0.5 ? makeParityTrial() : makeVowelTrial());
    setTrial(next);
    t0Ref.current = performance.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, trialIndex]);

  function answer(choice) {
    if (!trial) return;
    const rt = performance.now() - t0Ref.current;
    const correct = choice === trial.answer;
    resultsRef.current[phase].push({ rt, correct });
    playSfx?.(correct ? 'click' : 'error');
    const nextIndex = trialIndex + 1;
    if (nextIndex >= N_TRIALS) setPhase(phase === 'block1' ? 'block1done' : 'result');
    else setTrialIndex(nextIndex);
  }

  function avgRT(list) {
    const correctOnes = list.filter((r) => r.correct);
    const src = correctOnes.length ? correctOnes : list;
    return src.reduce((s, r) => s + r.rt, 0) / src.length;
  }

  function reset() {
    resultsRef.current = { block1: [], block2: [] };
    setPhase('intro');
  }

  const buttonsFor = (task) => (task === 'parity'
    ? [{ label: t.odd, value: 'ODD' }, { label: t.even, value: 'EVEN' }]
    : [{ label: t.vowel, value: 'VOWEL' }, { label: t.consonant, value: 'CONSONANT' }]);

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.introBody}</p>
          <ExpButton onClick={() => { playSfx?.('click'); startBlock('block1'); }}>{t.start}</ExpButton>
        </>
      )}

      {(phase === 'block1' || phase === 'block2') && trial && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: chrome.muted, marginBottom: 6 }}>
            {phase === 'block1' ? t.block1Label : t.block2Label} — {trialIndex + 1}/{N_TRIALS}
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
          <ExpButton onClick={() => { playSfx?.('click'); startBlock('block2'); }}>{t.continueBtn}</ExpButton>
        </>
      )}

      {phase === 'result' && (() => {
        const singleRT = avgRT(resultsRef.current.block1);
        const switchRT = avgRT(resultsRef.current.block2);
        const cost = Math.round(switchRT - singleRT);
        return (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.sameRule}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 24, color: chrome.text }}>{Math.round(singleRT)}ms</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.switching}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 24, color: chrome.text }}>{Math.round(switchRT)}ms</div>
              </div>
            </div>
            <ExpResult chrome={chrome}>
              {cost > 15
                ? (isAr
                  ? `دفع دماغك ${cost} م.ث إضافية في كل مرة تغيّرت فيها القاعدة — هذه هي "ضريبة التبديل" التي تتحدّث عنها الأبحاث. لم تُفكّر في شيئين معاً فعلياً؛ بل بدّلت بينهما، وكل تبديل له ثمن. إنها نفس الضريبة التي تدفعها عند التنقّل بين الرسائل ومهمة تتطلب تركيزاً، أو الردّ على رسالة نصية أثناء حديث — كل "لمحة سريعة" تكلّف أكثر من الثواني التي تستغرقها.`
                  : <>Your brain paid roughly <strong>{cost}ms</strong> extra every single time the rule changed — that's the real, measurable <strong>switching cost</strong>. You weren't thinking about two things at once; you were flipping between them, and every flip billed you. It's the same tax you pay bouncing between a chat app and deep work, or glancing at a text mid-conversation — each "quick check" costs more than the seconds it takes.</>)
                : (isAr
                  ? 'كانت النتيجتان متقاربتين هذه المرة — التأثير حقيقي إحصائياً (وهو نفسه سبب شعورك بالإرهاق بعد يوم مليء بتبديل النوافذ) لكنه يتفاوت شخصياً من محاولة لأخرى. جرّب مرة أخرى وراقب الفرق.'
                  : "Close race this time — the effect is real on average (it's the same mechanism behind feeling drained after a day of tab-switching) but varies trial to trial. Run it again and watch the gap.")}
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
