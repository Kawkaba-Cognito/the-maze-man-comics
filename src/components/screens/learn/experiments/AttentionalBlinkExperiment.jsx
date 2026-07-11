import React, { useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult } from './expShared';

/*
 * Attentional blink demo — an RSVP letter stream with a gold T1 letter to
 * remember and a fixed second target ('X') planted either inside the blink
 * window (~220ms after T1) or outside it (~770ms after T1). Most people miss
 * the near X and catch the far one — the personal version of the 200–500ms
 * blind spot the surrounding article text describes.
 */

const LETTER_MS = 110;
const SEQ_LEN = 15;
const T1_INDEX = 5;
const NEAR_GAP = 2; // ~220ms after T1 — inside the blink window
const FAR_GAP = 7; // ~770ms after T1 — outside it
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildSequence(gap) {
  const t1Letter = pick(VOWELS);
  const letters = [];
  for (let i = 0; i < SEQ_LEN; i++) {
    if (i === T1_INDEX) letters.push({ letter: t1Letter, isT1: true });
    else if (i === T1_INDEX + gap) letters.push({ letter: 'X', isT2: true });
    else letters.push({ letter: pick(CONSONANTS), isT1: false });
  }
  return { letters, t1Letter };
}

function recallOptions(t1Letter) {
  const distractors = VOWELS.filter((v) => v !== t1Letter);
  const shuffled = [...distractors].sort(() => Math.random() - 0.5).slice(0, 2);
  return [...shuffled, t1Letter].sort(() => Math.random() - 0.5);
}

const TEXT = {
  en: {
    introTitle: 'Catch the second target',
    introBody: "A stream of letters flashes by fast. One letter shows in gold — remember it. Somewhere after it, the letter X will also appear — try to catch that too.",
    start: 'Start round 1',
    transitionBody: 'Round 2 — same task. X shows up later in the stream this time.',
    transitionBtn: 'Start round 2',
    askXTitle: 'Did you see an X flash by?',
    yes: 'Yes', no: 'No',
    askT1Title: 'Which letter was gold?',
    again: 'Run it again',
    near: 'Round 1 (X close after)', far: 'Round 2 (X further after)',
    seen: 'Spotted', missed: 'Missed',
  },
  ar: {
    introTitle: 'التقط الهدف الثاني',
    introBody: 'سلسلة من الحروف ستومض بسرعة. حرف واحد سيظهر بالذهبي — تذكّره. بعده بقليل سيظهر حرف X — حاول التقاطه أيضاً.',
    start: 'ابدأ الجولة الأولى',
    transitionBody: 'الجولة الثانية — نفس المهمة. لكن X سيظهر متأخراً أكثر هذه المرة.',
    transitionBtn: 'ابدأ الجولة الثانية',
    askXTitle: 'هل رأيت حرف X يومض؟',
    yes: 'نعم', no: 'لا',
    askT1Title: 'أي حرف كان ذهبياً؟',
    again: 'أعد المحاولة',
    near: 'الجولة الأولى (X قريب)', far: 'الجولة الثانية (X بعيد)',
    seen: 'تم رصده', missed: 'فات',
  },
};

export default function AttentionalBlinkExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | streaming | askX | askT1 | transition | result
  const [runIndex, setRunIndex] = useState(0); // 0 = near, 1 = far
  const [streamPos, setStreamPos] = useState(-1);
  const seqRef = useRef(null);
  const runResultsRef = useRef([]);

  function launchRun(idx) {
    seqRef.current = buildSequence(idx === 0 ? NEAR_GAP : FAR_GAP);
    setStreamPos(-1);
    setPhase('streaming');
  }

  useEffect(() => {
    if (phase !== 'streaming') return undefined;
    let pos = -1;
    let timer;
    const step = () => {
      pos += 1;
      if (pos >= SEQ_LEN) { setPhase('askX'); return; }
      setStreamPos(pos);
      timer = setTimeout(step, LETTER_MS);
    };
    timer = setTimeout(step, LETTER_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  function answerX(saw) {
    playSfx?.('click');
    runResultsRef.current[runIndex] = { sawX: saw };
    setPhase('askT1');
  }

  function answerT1(letter) {
    const correct = letter === seqRef.current.t1Letter;
    playSfx?.(correct ? 'click' : 'error');
    runResultsRef.current[runIndex].t1Correct = correct;
    if (runIndex === 0) { setRunIndex(1); setPhase('transition'); }
    else setPhase('result');
  }

  function reset() {
    runResultsRef.current = [];
    setRunIndex(0);
    setPhase('intro');
  }

  const current = seqRef.current;
  const letterShown = current && streamPos >= 0 && streamPos < SEQ_LEN ? current.letters[streamPos] : null;

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.introBody}</p>
          <ExpButton onClick={() => { playSfx?.('click'); launchRun(0); }}>{t.start}</ExpButton>
        </>
      )}

      {phase === 'streaming' && (
        <div style={{
          width: '100%', height: 110, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: chrome.dark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.55)',
          border: chrome.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(170,140,80,0.18)',
        }}>
          <span style={{
            fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 48, fontWeight: 800,
            color: letterShown?.isT1 ? chrome.accent : chrome.text,
          }}>
            {letterShown ? letterShown.letter : ''}
          </span>
        </div>
      )}

      {phase === 'askX' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15, color: chrome.text, marginBottom: 12 }}>{t.askXTitle}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <ExpButton variant="ghost" style={{ flex: 1 }} onClick={() => answerX(true)}>{t.yes}</ExpButton>
            <ExpButton variant="ghost" style={{ flex: 1 }} onClick={() => answerX(false)}>{t.no}</ExpButton>
          </div>
        </>
      )}

      {phase === 'askT1' && current && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15, color: chrome.text, marginBottom: 12 }}>{t.askT1Title}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {recallOptions(current.t1Letter).map((letter) => (
              <ExpButton key={letter} variant="ghost" style={{ flex: 1 }} onClick={() => answerT1(letter)}>{letter}</ExpButton>
            ))}
          </div>
        </>
      )}

      {phase === 'transition' && (
        <>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 14px' }}>{t.transitionBody}</p>
          <ExpButton onClick={() => { playSfx?.('click'); launchRun(1); }}>{t.transitionBtn}</ExpButton>
        </>
      )}

      {phase === 'result' && (() => {
        const near = runResultsRef.current[0];
        const far = runResultsRef.current[1];
        let msgEn; let msgAr;
        if (!near.sawX && far.sawX) {
          msgEn = <>Textbook <strong>attentional blink</strong>: a real <strong>200–500ms</strong> blind spot right after your brain locks onto a target. When X landed inside that window, it slipped straight past you — the same X, arriving later, was easy to catch. Same brain, same eyes, same letter; only the timing changed. It's why you miss the second warning light after reacting to the first, or lose the back half of a sentence right after the word that grabbed you.</>;
          msgAr = 'انطباع كلاسيكي لظاهرة "الوميض الانتباهي": فجوة عمياء حقيقية تمتد 200-500 م.ث مباشرة بعد أن يقفل دماغك على هدف. عندما ظهر X داخل هذه النافذة، مرّ دون أن تلاحظه — لكن نفس الحرف، عندما ظهر لاحقاً، كان سهل الالتقاط. نفس الدماغ، نفس العينين؛ الشيء الوحيد الذي تغيّر هو التوقيت. لهذا تفوتك إشارة التحذير الثانية بعد ردّ فعلك على الأولى، أو يضيع نصف الجملة الثاني مباشرة بعد الكلمة التي شدّت انتباهك.';
        } else if (near.sawX && far.sawX) {
          msgEn = "You caught X both times — nicely sharp today. The blink (a 200–500ms blind spot right after any target) is probabilistic, not universal; run it again and the gap tends to show up, especially when you're tired, hot, or hungry.";
          msgAr = 'التقطت X في المرتين — تركيز جيد اليوم. "الوميض" (فجوة عمياء تمتد 200-500 م.ث بعد أي هدف) احتمالي وليس مضموناً دائماً؛ جرّب مرة أخرى وقد تلاحظ الفرق، خاصة عند التعب أو الحرّ أو الجوع.';
        } else if (!near.sawX && !far.sawX) {
          msgEn = 'You missed X both times — the near miss fits the 200–500ms blink window perfectly; the far miss is more about a fast stream than the blink itself. Try again and watch for it a little later in the sequence.';
          msgAr = 'فاتك X في المرتين — الحالة القريبة تناسب نافذة الوميض (200-500 م.ث) تماماً؛ أما البعيدة فسببها الأرجح سرعة السلسلة لا الوميض نفسه. جرّب مرة أخرى وانتبه له في وقت لاحق قليلاً من السلسلة.';
        } else {
          msgEn = "Caught the near one, missed the far one — happens. Attention has moment-to-moment noise on top of the average 200–500ms blink effect.";
          msgAr = 'التقطت القريب وفاتك البعيد — يحدث هذا أحياناً. للانتباه تذبذب لحظي فوق متوسط تأثير الوميض (200-500 م.ث).';
        }
        return (
          <>
            <div style={{ display: 'flex', gap: 24, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.near}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 20, color: near.sawX ? '#4a9d6f' : '#c96b4e' }}>
                  {near.sawX ? t.seen : t.missed}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.far}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 20, color: far.sawX ? '#4a9d6f' : '#c96b4e' }}>
                  {far.sawX ? t.seen : t.missed}
                </div>
              </div>
            </div>
            <ExpResult chrome={chrome}>{isAr ? msgAr : msgEn}</ExpResult>
            <div style={{ marginTop: 12 }}>
              <ExpButton variant="ghost" onClick={() => { playSfx?.('click'); reset(); }}>{t.again}</ExpButton>
            </div>
          </>
        );
      })()}
    </ExpCard>
  );
}
