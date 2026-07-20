import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult, ExpSteps, ExpCountdown, pct } from './expShared';

/*
 * Attentional blink — multiple near vs far lag trials for a clearer personal demo.
 */

const LETTER_MS = 110;
const SEQ_LEN = 15;
const T1_INDEX = 5;
const NEAR_GAP = 2; // ~220ms
const FAR_GAP = 7; // ~770ms
const TRIALS_PER_LAG = 3;
const VOWELS = ['A', 'E', 'I', 'O', 'U'];
const CONSONANTS = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function buildSequence(gap) {
  const t1Letter = pick(VOWELS);
  const letters = [];
  for (let i = 0; i < SEQ_LEN; i++) {
    if (i === T1_INDEX) letters.push({ letter: t1Letter, isT1: true });
    else if (i === T1_INDEX + gap) letters.push({ letter: 'X', isT2: true });
    else {
      let L = pick(CONSONANTS);
      while (L === 'X') L = pick(CONSONANTS);
      letters.push({ letter: L, isT1: false });
    }
  }
  return { letters, t1Letter, gap };
}

function recallOptions(t1Letter) {
  const distractors = VOWELS.filter((v) => v !== t1Letter);
  const shuffled = [...distractors].sort(() => Math.random() - 0.5).slice(0, 2);
  return [...shuffled, t1Letter].sort(() => Math.random() - 0.5);
}

/** Build schedule: 3 near + 3 far, shuffled but balanced. */
function buildSchedule() {
  const near = Array.from({ length: TRIALS_PER_LAG }, () => 'near');
  const far = Array.from({ length: TRIALS_PER_LAG }, () => 'far');
  const all = [...near, ...far];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

const TEXT = {
  en: {
    introTitle: 'Catch the second target',
    introBody: 'Letters flash quickly. Remember the gold letter. Also notice whether an X appears after it. You will do 6 short streams — some with X soon after gold, some later.',
    steps: [
      'Watch the stream. One letter is gold — remember it.',
      'Also try to spot whether X appeared after the gold letter.',
      'After each stream: Did you see X? Which letter was gold?',
    ],
    start: 'Start',
    ready: 'Get ready',
    progress: (n, total) => `Stream ${n} of ${total}`,
    askXTitle: 'Did you see an X flash by?',
    yes: 'Yes', no: 'No',
    askT1Title: 'Which letter was gold?',
    again: 'Run it again',
    near: 'X soon after (blink window)',
    far: 'X later (outside blink)',
    detected: 'Detected',
  },
  ar: {
    introTitle: 'التقط الهدف الثاني',
    introBody: 'الحروف تومض بسرعة. تذكّر الحرف الذهبي. ولاحظ أيضاً هل ظهر X بعده. ستمرّ ٦ سلاسل قصيرة — بعضها X قريب من الذهبي، وبعضها أبعد.',
    steps: [
      'شاهد السلسلة. حرف واحد ذهبي — تذكّره.',
      'حاول أيضاً رصد هل ظهر X بعد الذهبي.',
      'بعد كل سلسلة: هل رأيت X؟ أي حرف كان ذهبياً؟',
    ],
    start: 'ابدأ',
    ready: 'استعد',
    progress: (n, total) => `السلسلة ${n} من ${total}`,
    askXTitle: 'هل رأيت حرف X يومض؟',
    yes: 'نعم', no: 'لا',
    askT1Title: 'أي حرف كان ذهبياً؟',
    again: 'أعد المحاولة',
    near: 'X قريب (نافذة الوميض)',
    far: 'X لاحق (خارج الوميض)',
    detected: 'رُصد',
  },
};

export default function AttentionalBlinkExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | countdown | streaming | askX | askT1 | result
  const [streamPos, setStreamPos] = useState(-1);
  const scheduleRef = useRef([]);
  const trialIdxRef = useRef(0);
  const seqRef = useRef(null);
  const resultsRef = useRef([]); // { lag: 'near'|'far', sawX, t1Correct }
  const pendingSawX = useRef(false);

  const total = TRIALS_PER_LAG * 2;

  const launchNext = useCallback(() => {
    const lag = scheduleRef.current[trialIdxRef.current];
    seqRef.current = buildSequence(lag === 'near' ? NEAR_GAP : FAR_GAP);
    setStreamPos(-1);
    setPhase('streaming');
  }, []);

  const finishCountdown = useCallback(() => {
    launchNext();
  }, [launchNext]);

  function start() {
    scheduleRef.current = buildSchedule();
    trialIdxRef.current = 0;
    resultsRef.current = [];
    setPhase('countdown');
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
    pendingSawX.current = saw;
    setPhase('askT1');
  }

  function answerT1(letter) {
    const lag = scheduleRef.current[trialIdxRef.current];
    const correct = letter === seqRef.current.t1Letter;
    playSfx?.(correct ? 'click' : 'error');
    resultsRef.current.push({ lag, sawX: pendingSawX.current, t1Correct: correct });
    trialIdxRef.current += 1;
    if (trialIdxRef.current >= total) setPhase('result');
    else setPhase('countdown');
  }

  function reset() {
    resultsRef.current = [];
    trialIdxRef.current = 0;
    setPhase('intro');
  }

  const current = seqRef.current;
  const letterShown = current && streamPos >= 0 && streamPos < SEQ_LEN ? current.letters[streamPos] : null;

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 10px' }}>{t.introBody}</p>
          <ExpSteps chrome={chrome} steps={t.steps} />
          <ExpButton onClick={() => { playSfx?.('click'); start(); }}>{t.start}</ExpButton>
        </>
      )}

      {phase === 'countdown' && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: chrome.muted, marginBottom: 8 }}>
            {t.progress(trialIdxRef.current + 1, total)}
          </div>
          <ExpCountdown key={trialIdxRef.current} chrome={chrome} label={t.ready} onDone={finishCountdown} />
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

      {phase === 'result' && (() => {
        const near = resultsRef.current.filter((r) => r.lag === 'near');
        const far = resultsRef.current.filter((r) => r.lag === 'far');
        const nearRate = pct(near.filter((r) => r.sawX).length, near.length);
        const farRate = pct(far.filter((r) => r.sawX).length, far.length);
        const blinkShown = farRate - nearRate >= 20;
        return (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.near}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 22, color: chrome.text }}>
                  {t.detected} {nearRate}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.far}</div>
                <div style={{ fontFamily: "'Fredoka One','Nunito',sans-serif", fontSize: 22, color: chrome.text }}>
                  {t.detected} {farRate}%
                </div>
              </div>
            </div>
            <ExpResult chrome={chrome}>
              {blinkShown
                ? (isAr
                  ? <>هذا يشبه <strong>الوميض الانتباهي</strong>: فجوة عمياء نحو <strong>٢٠٠–٥٠٠ م.ث</strong> بعد أن يقفل دماغك على الهدف الذهبي. حين وقع X داخل النافذة رصدته أقل؛ وحين جاء لاحقاً كان أسهل. نفس العينين — التوقيت فقط تغيّر. لهذا تفوتك إشارة ثانية بعد الأولى، أو يضيع نصف جملة بعد كلمة شدّت انتباهك.</>
                  : <>That is a classic <strong>attentional blink</strong>: a roughly <strong>200–500ms</strong> blind spot after your brain locks onto the gold target. You spotted X less often when it landed in that window, and more often when it arrived later. Same eyes — only timing changed. That is why a second warning can vanish after the first, or why you lose the back half of a sentence right after the word that grabbed you.</>)
                : (isAr
                  ? 'لم يظهر فرق كبير هذه الجلسة — الوميض احتمالي ويتفاوت مع التعب والسرعة. أعد التجربة وراقب إن انخفض رصد X القريب مقارنة بالبعيد.'
                  : 'No big gap this session — the blink is probabilistic and varies with fatigue and pace. Run it again and watch whether near-X detection drops below far-X.')}
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
