import React, { useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult } from './expShared';

/*
 * Divided-attention counting task — the experiential half of the "nobody
 * truly divides attention" myth-bust. Run 1: count only the red dots in a
 * stream. Run 2: a fresh stream, count red AND blue at once. Ground truth is
 * known (we generated the stream), so counting error is an honest accuracy
 * measure — and it usually climbs the moment a second colour is added.
 */

const DOT_MS = 380;
const DOT_COUNT = 20;
const COLORS = {
  red: { hex: '#d55e00', en: 'red', ar: 'أحمر' },
  blue: { hex: '#0072b2', en: 'blue', ar: 'أزرق' },
  green: { hex: '#009e73', en: 'green', ar: 'أخضر' },
};
const KEYS = Object.keys(COLORS);

function buildStream() {
  const seq = Array.from({ length: DOT_COUNT }, () => KEYS[Math.floor(Math.random() * KEYS.length)]);
  const counts = { red: 0, blue: 0, green: 0 };
  seq.forEach((c) => { counts[c] += 1; });
  return { seq, counts };
}

const TEXT = {
  en: {
    introTitle: 'Can you really divide your attention?',
    introBody: "Round 1: watch the dots and count only the RED ones. Round 2: a new stream — count RED and BLUE at the same time. We know the real counts, so this measures how accurate you actually are.",
    start: 'Start round 1',
    watchOnly: (c) => `Count the ${c} dots`,
    watchBoth: 'Count the RED and BLUE dots',
    redGuess: 'How many red dots?',
    redGuessLabel: 'Red count',
    blueGuessLabel: 'Blue count',
    submit: 'Submit',
    transitionBody: "Round 2 — new stream, two colours to track this time.",
    transitionBtn: 'Start round 2',
    again: 'Run it again',
    single: 'Single-task error', divided: 'Divided-task error',
  },
  ar: {
    introTitle: 'هل يمكنك فعلاً تقسيم انتباهك؟',
    introBody: 'الجولة الأولى: شاهد النقاط وعُدّ الحمراء فقط. الجولة الثانية: سلسلة جديدة — عُدّ الأحمر والأزرق معاً. نحن نعرف الأعداد الحقيقية، فهذا يقيس دقتك الفعلية.',
    start: 'ابدأ الجولة الأولى',
    watchOnly: (c) => `عُدّ النقاط ${c}`,
    watchBoth: 'عُدّ النقاط الحمراء والزرقاء',
    redGuess: 'كم عدد النقاط الحمراء؟',
    redGuessLabel: 'عدد الأحمر',
    blueGuessLabel: 'عدد الأزرق',
    submit: 'إرسال',
    transitionBody: 'الجولة الثانية — سلسلة جديدة، لونان لتتبّعهما هذه المرة.',
    transitionBtn: 'ابدأ الجولة الثانية',
    again: 'أعد المحاولة',
    single: 'خطأ المهمة الفردية', divided: 'خطأ المهمة المزدوجة',
  },
};

export default function DividedAttentionExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | stream1 | ask1 | transition | stream2 | ask2 | result
  const [pos, setPos] = useState(-1);
  const stream1Ref = useRef(null);
  const stream2Ref = useRef(null);
  const [redGuess1, setRedGuess1] = useState('');
  const [redGuess2, setRedGuess2] = useState('');
  const [blueGuess2, setBlueGuess2] = useState('');

  function launch(which) {
    if (which === 1) stream1Ref.current = buildStream();
    else stream2Ref.current = buildStream();
    setPos(-1);
    setPhase(which === 1 ? 'stream1' : 'stream2');
  }

  useEffect(() => {
    if (phase !== 'stream1' && phase !== 'stream2') return undefined;
    const seq = (phase === 'stream1' ? stream1Ref.current : stream2Ref.current).seq;
    let i = -1;
    let timer;
    const step = () => {
      i += 1;
      if (i >= seq.length) { setPhase(phase === 'stream1' ? 'ask1' : 'ask2'); return; }
      setPos(i);
      timer = setTimeout(step, DOT_MS);
    };
    timer = setTimeout(step, DOT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  function submitAsk1() {
    playSfx?.('click');
    setPhase('transition');
  }

  function submitAsk2() {
    playSfx?.('click');
    setPhase('result');
  }

  function reset() {
    setRedGuess1(''); setRedGuess2(''); setBlueGuess2('');
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

  const activeSeq = phase === 'stream1' ? stream1Ref.current?.seq : phase === 'stream2' ? stream2Ref.current?.seq : null;
  const activeColor = activeSeq && pos >= 0 && pos < activeSeq.length ? COLORS[activeSeq[pos]] : null;

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.introBody}</p>
          <ExpButton onClick={() => { playSfx?.('click'); launch(1); }}>{t.start}</ExpButton>
        </>
      )}

      {(phase === 'stream1' || phase === 'stream2') && (
        <>
          <div style={{ fontSize: 13, fontWeight: 700, color: chrome.accent, marginBottom: 4 }}>
            {phase === 'stream1' ? t.watchOnly(isAr ? COLORS.red.ar : COLORS.red.en) : t.watchBoth}
          </div>
          <div style={dotStyle}>
            {activeColor && <span style={{ width: 46, height: 46, borderRadius: '50%', background: activeColor.hex, display: 'block' }} />}
          </div>
        </>
      )}

      {phase === 'ask1' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15, color: chrome.text, marginBottom: 12 }}>{t.redGuess}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <input
              type="number" min="0" inputMode="numeric" style={numInputStyle}
              value={redGuess1} onChange={(e) => setRedGuess1(e.target.value)}
            />
            <ExpButton onClick={submitAsk1}>{t.submit}</ExpButton>
          </div>
        </>
      )}

      {phase === 'transition' && (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.transitionBody}</p>
          <ExpButton onClick={() => { playSfx?.('click'); launch(2); }}>{t.transitionBtn}</ExpButton>
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
          <ExpButton onClick={submitAsk2}>{t.submit}</ExpButton>
        </>
      )}

      {phase === 'result' && (() => {
        const trueSingle = stream1Ref.current.counts.red;
        const trueDivRed = stream2Ref.current.counts.red;
        const trueDivBlue = stream2Ref.current.counts.blue;
        const error1 = Math.abs((Number(redGuess1) || 0) - trueSingle);
        const error2 = (Math.abs((Number(redGuess2) || 0) - trueDivRed) + Math.abs((Number(blueGuess2) || 0) - trueDivBlue)) / 2;
        const worse = error2 > error1;
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
                  ? 'خطؤك تضاعف تقريباً بمجرد إضافة لون ثانٍ لتتبّعه — هذا هو ثمن "الانتباه المُقسَّم" الحقيقي. دماغك لم يراقب لونين بالتوازي حقاً؛ كان يتنقّل بينهما ويُفلت بعض النقاط في الطريق. هذا بالضبط ما يحدث مع القيادة والرسائل النصية معاً، أو GPS + طريق + بودكاست — وهو أيضاً سبب أن التفوّق في لعبة تدريب واحدة لا "ينتقل" تلقائياً لمهارات أخرى: مهارة واحدة تتحسّن، والانتباه لا يتعلّم سرّاً كيف ينقسم إلى اثنين.'
                  : <>Your error grew the moment a second colour entered the picture — that's the real cost of <strong>divided attention</strong>. Your brain wasn't truly tracking two colours in parallel; it was hopping between them, and some dots slipped through in the gaps. That's exactly what's happening when you text while driving, or run GPS + traffic + a podcast at once — and it's also why acing one training game doesn't magically "transfer" to other skills: one skill sharpens, attention doesn't secretly learn to split in two.</>)
                : (isAr
                  ? 'نتيجتان متقاربتان هذه المرة — التباين الفردي وارد. لكن في المتوسط عبر آلاف المشاركين، إضافة مهمة ثانية ترفع الخطأ بشكل ثابت — تماماً كما في القيادة أثناء الرسائل النصية. جرّب مرة أخرى.'
                  : "Close result this time — individual variation happens. But averaged across people, adding a second thing to track reliably raises error. Try again and see if the gap shows up.")}
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
