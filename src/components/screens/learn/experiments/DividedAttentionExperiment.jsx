import React, { useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult, ExpSteps, ExpCountdown } from './expShared';

/*
 * Divided-attention counting — practice stream, then single vs dual scored streams.
 */

const DOT_MS = 360;
const PRACTICE_COUNT = 8;
const SCORED_COUNT = 24;
const COLORS = {
  red: { hex: '#d55e00', en: 'red', ar: 'أحمر' },
  blue: { hex: '#0072b2', en: 'blue', ar: 'أزرق' },
  green: { hex: '#009e73', en: 'green', ar: 'أخضر' },
};
const KEYS = Object.keys(COLORS);

function buildStream(n) {
  const seq = Array.from({ length: n }, () => KEYS[Math.floor(Math.random() * KEYS.length)]);
  const counts = { red: 0, blue: 0, green: 0 };
  seq.forEach((c) => { counts[c] += 1; });
  return { seq, counts };
}

const TEXT = {
  en: {
    introTitle: 'Can you really divide your attention?',
    introBody: 'First a short practice counting red dots. Then Round 1: count red only. Round 2: count red and blue at once. We know the true counts, so error is honest.',
    steps: [
      'Practice: short stream — count red only (not scored).',
      'Round 1: longer stream — count red only.',
      'Round 2: new stream — count red AND blue together.',
    ],
    start: 'Start practice',
    ready: 'Get ready',
    practiceWatch: 'Practice — count RED only',
    watchOnly: (c) => `Count the ${c} dots`,
    watchBoth: 'Count the RED and BLUE dots',
    redGuess: 'How many red dots?',
    redGuessLabel: 'Red count',
    blueGuessLabel: 'Blue count',
    submit: 'Submit',
    practiceDone: 'Nice. Now the scored rounds.',
    continueBtn: 'Start round 1',
    transitionBody: 'Round 2 — new stream. Track two colours this time.',
    transitionBtn: 'Start round 2',
    again: 'Run it again',
    single: 'Single-task error',
    divided: 'Divided-task error',
    trueWas: 'True count was',
  },
  ar: {
    introTitle: 'هل يمكنك فعلاً تقسيم انتباهك؟',
    introBody: 'أولاً تمرين قصير بعدّ الأحمر. ثم الجولة ١: الأحمر فقط. الجولة ٢: الأحمر والأزرق معاً. نحن نعرف الأعداد الحقيقية، فالخطأ صادق.',
    steps: [
      'تمرين: سلسلة قصيرة — عُدّ الأحمر فقط (غير مسجّل).',
      'الجولة ١: سلسلة أطول — الأحمر فقط.',
      'الجولة ٢: سلسلة جديدة — الأحمر والأزرق معاً.',
    ],
    start: 'ابدأ التمرين',
    ready: 'استعد',
    practiceWatch: 'تمرين — عُدّ الأحمر فقط',
    watchOnly: (c) => `عُدّ النقاط ${c}`,
    watchBoth: 'عُدّ النقاط الحمراء والزرقاء',
    redGuess: 'كم عدد النقاط الحمراء؟',
    redGuessLabel: 'عدد الأحمر',
    blueGuessLabel: 'عدد الأزرق',
    submit: 'إرسال',
    practiceDone: 'ممتاز. الآن الجولات المسجّلة.',
    continueBtn: 'ابدأ الجولة ١',
    transitionBody: 'الجولة ٢ — سلسلة جديدة. تتبّع لونين هذه المرة.',
    transitionBtn: 'ابدأ الجولة ٢',
    again: 'أعد المحاولة',
    single: 'خطأ المهمة الفردية',
    divided: 'خطأ المهمة المزدوجة',
    trueWas: 'العدد الحقيقي كان',
  },
};

export default function DividedAttentionExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  // intro | countdown | practiceStream | practiceAsk | practiceDone | stream1 | ask1 | transition | stream2 | ask2 | result
  const [phase, setPhase] = useState('intro');
  const [pos, setPos] = useState(-1);
  const afterCd = useRef('practiceStream');
  const practiceRef = useRef(null);
  const stream1Ref = useRef(null);
  const stream2Ref = useRef(null);
  const [redGuessP, setRedGuessP] = useState('');
  const [redGuess1, setRedGuess1] = useState('');
  const [redGuess2, setRedGuess2] = useState('');
  const [blueGuess2, setBlueGuess2] = useState('');

  function beginCountdown(next) {
    afterCd.current = next;
    setPhase('countdown');
  }

  function finishCountdown() {
    const next = afterCd.current;
    if (next === 'practiceStream') practiceRef.current = buildStream(PRACTICE_COUNT);
    else if (next === 'stream1') stream1Ref.current = buildStream(SCORED_COUNT);
    else stream2Ref.current = buildStream(SCORED_COUNT);
    setPos(-1);
    setPhase(next);
  }

  useEffect(() => {
    if (phase !== 'practiceStream' && phase !== 'stream1' && phase !== 'stream2') return undefined;
    const seq = (phase === 'practiceStream' ? practiceRef.current
      : phase === 'stream1' ? stream1Ref.current : stream2Ref.current).seq;
    let i = -1;
    let timer;
    const step = () => {
      i += 1;
      if (i >= seq.length) {
        setPhase(phase === 'practiceStream' ? 'practiceAsk' : phase === 'stream1' ? 'ask1' : 'ask2');
        return;
      }
      setPos(i);
      timer = setTimeout(step, DOT_MS);
    };
    timer = setTimeout(step, DOT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  function reset() {
    setRedGuessP(''); setRedGuess1(''); setRedGuess2(''); setBlueGuess2('');
    setPhase('intro');
  }

  const dotStyle = {
    width: '100%', height: 110, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: chrome.dark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.55)',
    border: chrome.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(170,140,80,0.18)',
    margin: '10px 0 14px',
  };
  const numInputStyle = {
    width: 72, padding: '10px 12px', borderRadius: 10, fontSize: 16, fontWeight: 800, textAlign: 'center',
    border: `2px solid ${chrome.accent}66`, background: chrome.dark ? 'rgba(0,0,0,0.25)' : '#fff', color: chrome.text,
  };

  const activeSeq = phase === 'practiceStream' ? practiceRef.current?.seq
    : phase === 'stream1' ? stream1Ref.current?.seq
      : phase === 'stream2' ? stream2Ref.current?.seq : null;
  const activeColor = activeSeq && pos >= 0 && pos < activeSeq.length ? COLORS[activeSeq[pos]] : null;

  const watchLabel = phase === 'practiceStream' ? t.practiceWatch
    : phase === 'stream1' ? t.watchOnly(isAr ? COLORS.red.ar : COLORS.red.en)
      : t.watchBoth;

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 10px' }}>{t.introBody}</p>
          <ExpSteps chrome={chrome} steps={t.steps} />
          <ExpButton onClick={() => { playSfx?.('click'); beginCountdown('practiceStream'); }}>{t.start}</ExpButton>
        </>
      )}

      {phase === 'countdown' && (
        <ExpCountdown key={afterCd.current} chrome={chrome} label={t.ready} onDone={finishCountdown} />
      )}

      {(phase === 'practiceStream' || phase === 'stream1' || phase === 'stream2') && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: chrome.accent, marginBottom: 4 }}>{watchLabel}</div>
          <div style={dotStyle}>
            {activeColor && <span style={{ width: 46, height: 46, borderRadius: '50%', background: activeColor.hex, display: 'block' }} />}
          </div>
        </>
      )}

      {phase === 'practiceAsk' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15, color: chrome.text, marginBottom: 12 }}>{t.redGuess}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <input type="number" min="0" inputMode="numeric" style={numInputStyle} value={redGuessP} onChange={(e) => setRedGuessP(e.target.value)} />
            <ExpButton onClick={() => { playSfx?.('click'); setPhase('practiceDone'); }}>{t.submit}</ExpButton>
          </div>
        </>
      )}

      {phase === 'practiceDone' && (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 8px' }}>{t.practiceDone}</p>
          <p style={{ fontSize: 13, color: chrome.muted, margin: '0 0 14px' }}>
            {t.trueWas}: {practiceRef.current?.counts.red}
            {redGuessP !== '' ? ` · ${isAr ? 'تخمينك' : 'Your guess'}: ${redGuessP}` : ''}
          </p>
          <ExpButton onClick={() => { playSfx?.('click'); beginCountdown('stream1'); }}>{t.continueBtn}</ExpButton>
        </>
      )}

      {phase === 'ask1' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15, color: chrome.text, marginBottom: 12 }}>{t.redGuess}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <input type="number" min="0" inputMode="numeric" style={numInputStyle} value={redGuess1} onChange={(e) => setRedGuess1(e.target.value)} />
            <ExpButton onClick={() => { playSfx?.('click'); setPhase('transition'); }}>{t.submit}</ExpButton>
          </div>
        </>
      )}

      {phase === 'transition' && (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.transitionBody}</p>
          <ExpButton onClick={() => { playSfx?.('click'); beginCountdown('stream2'); }}>{t.transitionBtn}</ExpButton>
        </>
      )}

      {phase === 'ask2' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5, fontWeight: 700, color: chrome.text }}>
              {t.redGuessLabel}
              <input type="number" min="0" inputMode="numeric" style={numInputStyle} value={redGuess2} onChange={(e) => setRedGuess2(e.target.value)} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13.5, fontWeight: 700, color: chrome.text }}>
              {t.blueGuessLabel}
              <input type="number" min="0" inputMode="numeric" style={numInputStyle} value={blueGuess2} onChange={(e) => setBlueGuess2(e.target.value)} />
            </label>
          </div>
          <ExpButton onClick={() => { playSfx?.('click'); setPhase('result'); }}>{t.submit}</ExpButton>
        </>
      )}

      {phase === 'result' && (() => {
        const trueSingle = stream1Ref.current.counts.red;
        const trueDivRed = stream2Ref.current.counts.red;
        const trueDivBlue = stream2Ref.current.counts.blue;
        const error1 = Math.abs((Number(redGuess1) || 0) - trueSingle);
        const errRed2 = Math.abs((Number(redGuess2) || 0) - trueDivRed);
        const errBlue2 = Math.abs((Number(blueGuess2) || 0) - trueDivBlue);
        const error2 = (errRed2 + errBlue2) / 2;
        const worse = error2 > error1 + 0.25;
        return (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.single}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 24, color: chrome.text }}>{error1.toFixed(1)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.divided}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 24, color: chrome.text }}>{error2.toFixed(1)}</div>
              </div>
            </div>
            <ExpResult chrome={chrome}>
              {worse
                ? (isAr
                  ? <>خطؤك ارتفع حين أُضيف لون ثانٍ — هذا ثمن <strong>الانتباه المقسّم</strong>. دماغك لم يراقب لونين بالتوازي حقاً؛ كان يتنقّل ويفلت نقاطاً. الانتباه يُشارك لا يُستنسخ — نفس الآلية خلف القيادة مع الرسائل.</>
                  : <>Your error rose when a second colour was added — that is the cost of <strong>divided attention</strong>. Your brain was not truly tracking two colours in parallel; it hopped, and dots slipped through. Attention is shared, not cloned — the same mechanism behind texting while driving.</>)
                : (isAr
                  ? 'نتيجتان متقاربتان هذه المرة — التباين وارد. في المتوسط، إضافة مهمة ثانية ترفع الخطأ. أعد التجربة وراقب إن اتّسع الفارق.'
                  : 'Close result this time — variation happens. On average, adding a second track raises error. Try again and see if the gap widens.')}
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
