import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ExpCard, ExpButton, ExpResult, ExpSteps, ExpCountdown, pct } from './expShared';

/*
 * Sustained vigilance — paced shape stream; tap only on rare targets.
 * Reports hits / misses / false alarms; early vs late half if drift shows.
 */

const STIM_MS = 900;
const TOTAL = 48; // ~43s
const TARGET_RATE = 0.18;
const SHAPES = ['●', '■', '▲', '◆'];
const TARGET = '★';

function buildStream() {
  const seq = [];
  let targets = 0;
  for (let i = 0; i < TOTAL; i++) {
    const isTarget = Math.random() < TARGET_RATE;
    if (isTarget) {
      seq.push({ shape: TARGET, isTarget: true });
      targets += 1;
    } else {
      seq.push({ shape: SHAPES[Math.floor(Math.random() * SHAPES.length)], isTarget: false });
    }
  }
  // Guarantee at least 6 targets
  if (targets < 6) {
    for (let i = 0; targets < 6 && i < TOTAL; i += 7) {
      if (!seq[i].isTarget) {
        seq[i] = { shape: TARGET, isTarget: true };
        targets += 1;
      }
    }
  }
  return seq;
}

const TEXT = {
  en: {
    introTitle: 'Hold the spotlight',
    introBody: 'Shapes appear one by one for about 45 seconds. Tap only when you see a star (★). Do nothing for other shapes. Staying ready without zoning out is the skill.',
    steps: [
      'Watch the stream the whole time — do not look away.',
      'Tap the button only when ★ appears.',
      'Ignore ● ■ ▲ ◆ — tapping those counts as a false alarm.',
    ],
    start: 'Start',
    ready: 'Get ready — tap only for ★',
    tap: 'Tap — I see ★',
    again: 'Run it again',
    hits: 'Hits',
    misses: 'Misses',
    falseAlarms: 'False taps',
    early: 'Early half hits',
    late: 'Late half hits',
  },
  ar: {
    introTitle: 'أبقِ الكشّاف مضيئاً',
    introBody: 'أشكال تظهر واحداً تلو الآخر لنحو ٤٥ ثانية. اضغط فقط حين ترى نجمة (★). لا تفعل شيئاً للأشكال الأخرى. البقاء مستعداً دون شرود هو المهارة.',
    steps: [
      'راقب السلسلة طوال الوقت — لا تُبعد نظرك.',
      'اضغط الزر فقط حين تظهر ★.',
      'تجاهل ● ■ ▲ ◆ — الضغط عليها إنذار كاذب.',
    ],
    start: 'ابدأ',
    ready: 'استعد — اضغط فقط عند ★',
    tap: 'اضغط — رأيت ★',
    again: 'أعد المحاولة',
    hits: 'إصابات',
    misses: 'إفلات',
    falseAlarms: 'ضغطات خاطئة',
    early: 'إصابات النصف الأول',
    late: 'إصابات النصف الثاني',
  },
};

export default function VigilanceExperiment({ isAr, chrome, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | countdown | run | result
  const [pos, setPos] = useState(-1);
  const seqRef = useRef([]);
  const tappedRef = useRef(new Set()); // indices tapped
  const [tick, setTick] = useState(0); // force re-render on tap feedback

  const finishCountdown = useCallback(() => {
    seqRef.current = buildStream();
    tappedRef.current = new Set();
    setPos(-1);
    setPhase('run');
  }, []);

  useEffect(() => {
    if (phase !== 'run') return undefined;
    let i = -1;
    let timer;
    const step = () => {
      i += 1;
      if (i >= TOTAL) {
        setPhase('result');
        return;
      }
      setPos(i);
      timer = setTimeout(step, STIM_MS);
    };
    timer = setTimeout(step, 200);
    return () => clearTimeout(timer);
  }, [phase]);

  function onTap() {
    if (phase !== 'run' || pos < 0) return;
    if (tappedRef.current.has(pos)) return;
    tappedRef.current.add(pos);
    const item = seqRef.current[pos];
    playSfx?.(item?.isTarget ? 'click' : 'error');
    setTick((x) => x + 1);
  }

  function reset() {
    tappedRef.current = new Set();
    setPos(-1);
    setPhase('intro');
  }

  const current = pos >= 0 && pos < TOTAL ? seqRef.current[pos] : null;

  return (
    <ExpCard isAr={isAr} chrome={chrome}>
      {phase === 'intro' && (
        <>
          <div style={{ fontWeight: 800, fontSize: 15.5, color: chrome.text, marginBottom: 6 }}>{t.introTitle}</div>
          <p style={{ fontSize: 14, lineHeight: 1.55, color: chrome.text, margin: '0 0 10px' }}>{t.introBody}</p>
          <ExpSteps chrome={chrome} steps={t.steps} />
          <ExpButton onClick={() => { playSfx?.('click'); setPhase('countdown'); }}>{t.start}</ExpButton>
        </>
      )}

      {phase === 'countdown' && (
        <ExpCountdown chrome={chrome} label={t.ready} onDone={finishCountdown} />
      )}

      {phase === 'run' && (
        <>
          <div style={{ fontSize: 12, fontWeight: 700, color: chrome.muted, marginBottom: 6 }}>
            {pos + 1}/{TOTAL}
          </div>
          <div style={{
            width: '100%', height: 120, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: chrome.dark ? 'rgba(0,0,0,0.32)' : 'rgba(255,255,255,0.55)',
            border: chrome.dark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(170,140,80,0.18)',
            marginBottom: 12,
            fontSize: 52,
            color: current?.isTarget ? chrome.accent : chrome.text,
          }}>
            {current?.shape || ''}
          </div>
          <ExpButton style={{ width: '100%' }} onClick={onTap}>{t.tap}</ExpButton>
          {/* tick keeps tapped feedback path alive for eslint */}
          <span style={{ display: 'none' }}>{tick}</span>
        </>
      )}

      {phase === 'result' && (() => {
        const seq = seqRef.current;
        const mid = Math.floor(TOTAL / 2);
        let hits = 0; let misses = 0; let fa = 0;
        let earlyHits = 0; let earlyTargets = 0;
        let lateHits = 0; let lateTargets = 0;
        seq.forEach((item, i) => {
          const tapped = tappedRef.current.has(i);
          if (item.isTarget) {
            if (tapped) hits += 1; else misses += 1;
            if (i < mid) { earlyTargets += 1; if (tapped) earlyHits += 1; }
            else { lateTargets += 1; if (tapped) lateHits += 1; }
          } else if (tapped) {
            fa += 1;
          }
        });
        const earlyPct = pct(earlyHits, earlyTargets);
        const latePct = pct(lateHits, lateTargets);
        const drifted = earlyTargets > 0 && lateTargets > 0 && earlyPct - latePct >= 20;
        const hitRate = pct(hits, hits + misses);
        return (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 4 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.hits}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 22, color: '#4a9d6f' }}>{hits} ({hitRate}%)</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.misses}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 22, color: '#c96b4e' }}>{misses}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.falseAlarms}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 22, color: chrome.text }}>{fa}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 18, marginBottom: 4, marginTop: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.early}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 18, color: chrome.text }}>{earlyPct}%</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: chrome.muted, fontWeight: 700 }}>{t.late}</div>
                <div style={{ fontFamily: "'Fredoka One','Outfit',sans-serif", fontSize: 18, color: chrome.text }}>{latePct}%</div>
              </div>
            </div>
            <ExpResult chrome={chrome}>
              {drifted
                ? (isAr
                  ? <>إصاباتك انخفضت في النصف الثاني — هذا <strong>انزلاق اليقظة</strong>. الانتباه المستمر يتعب مع الوقت؛ الملل ليس فشلاً أخلاقياً بل حالة معرفية. خطّط لاستراحات قصيرة عند الدراسة أو المراقبة أو القيادة الطويلة — لا تعتمد على «سأواصل التحديق فقط».</>
                  : <>Your hits dropped in the second half — that is <strong>vigilance drift</strong>. Sustained attention tires with time-on-task; boredom is a cognitive state, not a moral failure. Plan short breaks for studying, monitoring, or long drives — do not trust “I’ll just keep staring.”</>)
                : hitRate >= 80 && fa <= 2
                  ? (isAr
                    ? 'يقظة قوية هذه الجلسة. حتى الانتباه الجيد يتعب لاحقاً في اليوم — أعد التجربة بعد إرهاق وراقب إن ظهرت الإفلاتات أو الضغطات الخاطئة.'
                    : 'Strong vigilance this session. Even good attention fades later in the day — run it again when tired and watch whether misses or false taps rise.')
                  : (isAr
                    ? <>رصدت <strong>{hitRate}%</strong> من النجوم مع <strong>{fa}</strong> ضغطات خاطئة. الانتباه المستمر مزيج من الإبقاء على الهدف وتجنّب الردود الزائدة. الاستراحات وإخفاء المشتّتات يساعدان أكثر من «المحاولة بقوة».</>
                    : <>You caught <strong>{hitRate}%</strong> of stars with <strong>{fa}</strong> false taps. Sustained attention is both holding the target and avoiding over-responding. Breaks and fewer distractors help more than “trying harder.”</>)}
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
