import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult, ExpSteps, ExpCountdown, expStimStyle, avgRT, pct } from './expShared';

/*
 * Eriksen-style flanker — respond to center arrow; ignore sides.
 * Congruent vs incongruent RT/accuracy demonstrates selective-attention cost.
 */

const PRACTICE_N = 2;
const SCORED_N = 16;

function makeTrial(forceCongruent) {
  const centerLeft = Math.random() < 0.5;
  const congruent = forceCongruent != null ? forceCongruent : Math.random() < 0.5;
  const flankLeft = congruent ? centerLeft : !centerLeft;
  const center = centerLeft ? '←' : '→';
  const flank = flankLeft ? '←' : '→';
  return {
    congruent,
    answer: centerLeft ? 'LEFT' : 'RIGHT',
    display: `${flank} ${flank} ${center} ${flank} ${flank}`,
  };
}

function buildScoredTrials() {
  const half = SCORED_N / 2;
  const list = [
    ...Array.from({ length: half }, () => makeTrial(true)),
    ...Array.from({ length: half }, () => makeTrial(false)),
  ];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

const TEXT = {
  en: {
    introTitle: 'Filter the flanks',
    introBody: 'Respond only to the center arrow. The side arrows are distractors — sometimes they match, sometimes they fight you.',
    steps: [
      'Look at the middle arrow only.',
      'Tap Left or Right for that center arrow.',
      'Ignore the arrows on both sides — even when they disagree.',
    ],
    start: 'Start practice',
    ready: 'Get ready',
    practiceLabel: 'Practice',
    scoredLabel: 'Scored',
    left: '← Left',
    right: 'Right →',
    again: 'Run it again',
    congruent: 'Matching flanks',
    incongruent: 'Fighting flanks',
    accuracy: 'Accuracy',
  },
  ar: {
    introTitle: 'صفِّ الجوانب',
    introBody: 'استجب فقط لسهم الوسط. الأسهم الجانبية مشتّتات — أحياناً تتوافق، وأحياناً تعارضك.',
    steps: [
      'انظر إلى سهم الوسط فقط.',
      'اضغط يسار أو يمين حسب سهم الوسط.',
      'تجاهل الأسهم على الجانبين — حتى حين تختلف.',
    ],
    start: 'ابدأ التمرين',
    ready: 'استعد',
    practiceLabel: 'تمرين',
    scoredLabel: 'مسجّل',
    left: '← يسار',
    right: 'يمين →',
    again: 'أعد المحاولة',
    congruent: 'جوانب متوافقة',
    incongruent: 'جوانب متعارضة',
    accuracy: 'الدقة',
  },
};

export default function FlankerExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | countdown | practice | scored | result
  const [trialIndex, setTrialIndex] = useState(0);
  const [trial, setTrial] = useState(null);
  const scoredRef = useRef([]);
  const resultsRef = useRef([]);
  const t0Ref = useRef(0);
  const afterCd = useRef('practice');

  function beginCountdown(next) {
    afterCd.current = next;
    setPhase('countdown');
  }

  const finishCountdown = useCallback(() => {
    const next = afterCd.current;
    if (next === 'practice') {
      resultsRef.current = [];
      setTrialIndex(0);
    } else if (next === 'scored') {
      scoredRef.current = buildScoredTrials();
      resultsRef.current = [];
      setTrialIndex(0);
    }
    setPhase(next);
  }, []);

  useEffect(() => {
    if (phase !== 'practice' && phase !== 'scored') return;
    if (phase === 'practice') setTrial(makeTrial(trialIndex === 0));
    else setTrial(scoredRef.current[trialIndex]);
    t0Ref.current = performance.now();
  }, [phase, trialIndex]);

  function answer(choice) {
    if (!trial) return;
    const rt = performance.now() - t0Ref.current;
    const correct = choice === trial.answer;
    playSfx?.(correct ? 'click' : 'error');

    if (phase === 'practice') {
      const next = trialIndex + 1;
      if (next >= PRACTICE_N) beginCountdown('scored');
      else setTrialIndex(next);
      return;
    }

    resultsRef.current.push({ rt, correct, congruent: trial.congruent });
    const next = trialIndex + 1;
    if (next >= SCORED_N) setPhase('result');
    else setTrialIndex(next);
  }

  function reset() {
    resultsRef.current = [];
    setTrial(null);
    setTrialIndex(0);
    setPhase('intro');
  }

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
        <ExpCountdown key={afterCd.current + trialIndex} chrome={chrome} label={t.ready} onDone={finishCountdown} />
      )}

      {(phase === 'practice' || phase === 'scored') && trial && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: chrome.muted, marginBottom: 6 }}>
            {phase === 'practice'
              ? `${t.practiceLabel} — ${trialIndex + 1}/${PRACTICE_N}`
              : `${t.scoredLabel} — ${trialIndex + 1}/${SCORED_N}`}
          </div>
          <div style={{ ...expStimStyle(chrome), fontSize: 34, letterSpacing: 4, color: chrome.text }}>
            {trial.display}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ExpButton variant="ghost" style={{ flex: 1 }} onClick={() => answer('LEFT')}>{t.left}</ExpButton>
            <ExpButton variant="ghost" style={{ flex: 1 }} onClick={() => answer('RIGHT')}>{t.right}</ExpButton>
          </div>
        </>
      )}

      {phase === 'result' && (() => {
        const cong = resultsRef.current.filter((r) => r.congruent);
        const incon = resultsRef.current.filter((r) => !r.congruent);
        const rtC = avgRT(cong);
        const rtI = avgRT(incon);
        const cost = Math.round(rtI - rtC);
        const accC = pct(cong.filter((r) => r.correct).length, cong.length);
        const accI = pct(incon.filter((r) => r.correct).length, incon.length);
        return (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.congruent}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 24, color: chrome.text }}>{Math.round(rtC)}ms</div>
                <div style={{ fontSize: 11, color: chrome.muted }}>{t.accuracy}: {accC}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.incongruent}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 24, color: chrome.text }}>{Math.round(rtI)}ms</div>
                <div style={{ fontSize: 11, color: chrome.muted }}>{t.accuracy}: {accI}%</div>
              </div>
            </div>
            <ExpResult chrome={chrome}>
              {cost > 25
                ? (isAr
                  ? <>الجوانب المتعارضة كلّفتك نحو <strong>{cost} م.ث</strong> — هذا <strong>تكلفة التداخل</strong> في الانتباه الانتقائي. دماغك ما زال يعالج المشتّتات؛ تصفيتها ليست مجانية. نفس الجهد حين تقرأ وشارات الإشعارات في طرف العين، أو تستمع وسط ضوضاء.</>
                  : <>Fighting flanks cost you about <strong>{cost}ms</strong> — that is <strong>interference</strong> in selective attention. Your brain still processed the distractors; filtering is not free. Same effort when you read with notification badges in the corner, or listen in a noisy room.</>)
                : (isAr
                  ? 'فارق صغير هذه المرة — تأثير الفلانكر حقيقي في المتوسط ويتفاوت. أعد التجربة بعد يوم مشتّت وراقب إن اتّسع الفارق.'
                  : 'Small gap this time — the flanker effect is real on average and varies. Run it again on a noisy day and watch whether the cost grows.')}
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
