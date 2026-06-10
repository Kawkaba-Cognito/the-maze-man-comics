import React, { useEffect, useRef, useState } from 'react';

/*
 * ReactionTest — a 60-second psychomotor vigilance task (PVT-style) used as
 * the pre/post bookends of the Daily Workout. 5 valid trials: wait a random
 * 1–2.4s, the disc turns gold → tap as fast as you can. False starts repeat
 * the trial. Reports the MEDIAN reaction time (robust to outliers), the
 * standard summary statistic for short PVT batteries.
 */
const TRIALS = 5;

const TEXT = {
  en: {
    preTitle: '🧪 Baseline check',
    postTitle: '🧪 Post-workout check',
    weekTitle: '🧪 Weekly check-in',
    preBody: 'Quick reaction test before you train — it captures today\'s baseline so we can measure your session.',
    postBody: 'Same test as before the workout — let\'s see how your reaction time compares.',
    weekBody: 'A 30-second reaction test, once a week. Comparing weeks shows how your brain is responding to training.',
    how: 'When the disc turns GOLD, tap it as fast as you can. 5 rounds.',
    start: "I'm ready",
    skip: 'Skip test',
    wait: 'Wait for gold…',
    go: 'TAP!',
    tooSoon: 'Too soon! Wait for gold.',
    ms: 'ms',
    trial: (n) => `Round ${n} of ${TRIALS}`,
  },
  ar: {
    preTitle: '🧪 قياس الأساس',
    postTitle: '🧪 قياس ما بعد التمرين',
    weekTitle: '🧪 قياس الأسبوع',
    preBody: 'اختبار سريع لرد الفعل قبل التمرين — يسجّل خط الأساس اليوم لنقيس أثر الجلسة.',
    postBody: 'الاختبار نفسه كما قبل التمرين — لنرَ كيف تغيّر زمن رد فعلك.',
    weekBody: 'اختبار رد فعل لمدة 30 ثانية، مرة في الأسبوع. مقارنة الأسابيع تُظهر استجابة دماغك للتدريب.',
    how: 'عندما يتحوّل القرص إلى الذهبي، اضغطه بأسرع ما يمكن. 5 جولات.',
    start: 'أنا جاهز',
    skip: 'تخطَّ الاختبار',
    wait: 'انتظر اللون الذهبي…',
    go: 'اضغط!',
    tooSoon: 'مبكر جداً! انتظر الذهبي.',
    ms: 'م.ث',
    trial: (n) => `جولة ${n} من ${TRIALS}`,
  },
};

export default function ReactionTest({ isAr, kind = 'week', onDone, onSkip, playSfx }) {
  const t = isAr ? TEXT.ar : TEXT.en;
  const [phase, setPhase] = useState('intro'); // intro | wait | go | msg
  const [trial, setTrial] = useState(1);
  const [msg, setMsg] = useState(null);
  const timesRef = useRef([]);
  const t0Ref = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function armTrial() {
    setPhase('wait');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      t0Ref.current = performance.now();
      setPhase('go');
    }, 1000 + Math.random() * 1400);
  }

  function finish() {
    const xs = [...timesRef.current].sort((a, b) => a - b);
    const median = xs.length % 2 ? xs[(xs.length - 1) / 2] : (xs[xs.length / 2 - 1] + xs[xs.length / 2]) / 2;
    onDone(median);
  }

  function handleTap() {
    if (phase === 'wait') {
      // false start: cancel the pending go, scold gently, repeat the trial
      clearTimeout(timerRef.current);
      if (playSfx) playSfx('error');
      setMsg(t.tooSoon);
      setPhase('msg');
      timerRef.current = setTimeout(() => { setMsg(null); armTrial(); }, 900);
      return;
    }
    if (phase === 'go') {
      const rt = performance.now() - t0Ref.current;
      timesRef.current.push(rt);
      if (playSfx) playSfx('collect');
      setMsg(`${Math.round(rt)} ${t.ms}`);
      setPhase('msg');
      timerRef.current = setTimeout(() => {
        setMsg(null);
        if (timesRef.current.length >= TRIALS) finish();
        else { setTrial(timesRef.current.length + 1); armTrial(); }
      }, 700);
    }
  }

  if (phase === 'intro') {
    return (
      <div className="wk-test" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="wk-test-card">
          <div className="wk-test-title">{kind === 'week' ? t.weekTitle : kind === 'pre' ? t.preTitle : t.postTitle}</div>
          <p className="wk-test-body">{kind === 'week' ? t.weekBody : kind === 'pre' ? t.preBody : t.postBody}</p>
          <p className="wk-test-how">{t.how}</p>
          <button className="workout-cta" onClick={() => { if (playSfx) playSfx('click'); armTrial(); }}>{t.start}</button>
          {onSkip && <button className="wk-test-skip" onClick={onSkip}>{t.skip}</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="wk-test" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="wk-test-step">{t.trial(trial)}</div>
      <button
        type="button"
        className={`wk-stim${phase === 'go' ? ' is-go' : ''}`}
        onPointerDown={handleTap}
        aria-label={phase === 'go' ? t.go : t.wait}
      >
        {phase === 'go' ? t.go : (msg || t.wait)}
      </button>
      <div className="wk-test-dots">
        {Array.from({ length: TRIALS }, (_, i) => (
          <span key={i} className={`wk-test-dot${i < timesRef.current.length ? ' is-done' : ''}`} />
        ))}
      </div>
    </div>
  );
}
