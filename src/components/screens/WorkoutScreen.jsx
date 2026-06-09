import React, { useState, useEffect, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { GOALS, GOALS_BY_ID, SIZES, SIZES_BY_ID } from '../../features/workout/workoutData';
import { loadWorkout, ensureToday, savePrefs, markDone, consumeJustCompleted, resetPrefs } from '../../features/workout/workoutState';
import { getLazyGame } from '../../features/training/lazyGames';
import { hasAssessProfile } from '../../features/training/assessment/assessmentProfile';
import WorkoutStats from './WorkoutStats';

const COMPLETE_BONUS = 50;
const TRANSITION_SECS = 4;

export default function WorkoutScreen() {
  const { currentLang, switchTab, playSfx, awardPoints, openAssessment } = useApp();
  const isAr = currentLang === 'ar';
  const needsAssessment = !hasAssessProfile();

  const [st, setSt] = useState(() => ensureToday(loadWorkout()));
  const [view, setView] = useState(st.prefs ? 'plan' : 'setup');
  const [activeIdx, setActiveIdx] = useState(null);
  const [celebrate, setCelebrate] = useState(false);

  // Guided-session state
  const [sessionMode, setSessionMode] = useState(false);
  const [transitionIdx, setTransitionIdx] = useState(null);
  const [count, setCount] = useState(TRANSITION_SECS);

  // Setup form state
  const [goal, setGoal] = useState(st.prefs?.goal || 'weak');
  const [size, setSize] = useState(st.prefs?.size || 'standard');

  // Auto-advance countdown on the "up next" card.
  useEffect(() => {
    if (view !== 'transition' || transitionIdx == null) return undefined;
    setCount(TRANSITION_SECS);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) { clearInterval(id); setActiveIdx(transitionIdx); setView('game'); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [view, transitionIdx]);

  function confirmSetup() {
    playSfx('click');
    setSt(savePrefs(goal, size));
    setView('plan');
  }

  function goToTransition(idx) { setTransitionIdx(idx); setView('transition'); }
  function launchNow(idx) { playSfx('click'); setActiveIdx(idx); setView('game'); }

  // Start (or resume) the whole guided session from the first undone exercise.
  function startSession() {
    playSfx('click');
    const first = (st.today?.done || []).findIndex((d) => !d);
    if (first < 0) return;
    setSessionMode(true);
    goToTransition(first);
  }

  function endSession() { playSfx('click'); setSessionMode(false); setTransitionIdx(null); setView('plan'); }

  // Single exercise (tapping one in the list) — not a guided run.
  function startExercise(idx) {
    playSfx('click');
    setSessionMode(false);
    setActiveIdx(idx);
    setView('game');
  }

  function finishExercise() {
    let updated = st;
    if (activeIdx != null) {
      updated = markDone(activeIdx);
      setSt(updated);
      if (consumeJustCompleted()) { awardPoints(COMPLETE_BONUS); playSfx('win'); setCelebrate(true); }
      else playSfx('collect');
    }
    setActiveIdx(null);
    if (sessionMode) {
      const doneArr = updated.today?.done || [];
      const next = doneArr.findIndex((d) => !d);
      if (next >= 0) { goToTransition(next); return; }
      setSessionMode(false); // session complete
    }
    setView('plan');
  }

  // ── Progress & stats ──
  if (view === 'stats') {
    return <WorkoutStats onBack={() => setView('plan')} />;
  }

  // ── Hosting a game ──
  if (view === 'game' && activeIdx != null) {
    const ex = st.today?.exercises[activeIdx];
    const GameView = ex ? getLazyGame(ex.gameKey) : null;
    if (!GameView) { finishExercise(); return null; }
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={<div className="workout-loading">{isAr ? 'جارِ التحميل…' : 'Loading…'}</div>}>
          <GameView onBack={finishExercise} />
        </Suspense>
      </div>
    );
  }

  // ── "Up next" transition card (guided session) ──
  if (view === 'transition' && transitionIdx != null && st.today) {
    const ex = st.today.exercises[transitionIdx];
    const total = st.today.exercises.length;
    const position = (st.today.done || []).filter(Boolean).length + 1;
    return (
      <div className="workout-screen wk-trans" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="wk-trans-card">
          <div className="wk-trans-step">{isAr ? `تمرين ${position} من ${total}` : `Exercise ${position} of ${total}`}</div>
          <div className="wk-trans-glyph" style={{ color: ex.color }} aria-hidden="true">{ex.glyph}</div>
          <div className="wk-trans-name">{ex.gameName}</div>
          <div className="wk-trans-meta">{isAr ? ex.domainNameAr : ex.domainName} · {isAr ? ex.levelAr : ex.levelEn}</div>
          <div className="wk-trans-count">{isAr ? `يبدأ خلال ${count}…` : `Starting in ${count}…`}</div>
          <button className="workout-cta" onClick={() => launchNow(transitionIdx)}>{isAr ? 'ابدأ الآن' : 'Start now'}</button>
          <button className="wk-trans-end" onClick={endSession}>{isAr ? 'إنهاء الجلسة' : 'End session'}</button>
        </div>
      </div>
    );
  }

  // Nudge first-timers to take the assessment (sets age + finds weak spots).
  const assessNudge = needsAssessment ? (
    <div className="workout-nudge">
      <span className="workout-nudge-ic" aria-hidden="true">🧠</span>
      <div className="workout-nudge-body">
        <div className="workout-nudge-title">{isAr ? 'لتخصيص كامل، ابدأ بالتقييم' : 'Take the assessment for a fully personalized workout'}</div>
        <div className="workout-nudge-sub">{isAr ? 'يحدّد عمرك ويكشف نقاط ضعفك لضبط الصعوبة واختيار التمارين.' : 'It sets your age and finds your weak spots to tune difficulty & pick exercises.'}</div>
      </div>
      <button className="workout-nudge-btn" onClick={openAssessment}>{isAr ? 'ابدأ' : 'Take it'}</button>
    </div>
  ) : null;

  // ── Setup ──
  if (view === 'setup') {
    return (
      <div className="workout-screen" dir={isAr ? 'rtl' : 'ltr'}>
        <button className="workout-back" onClick={() => switchTab('home')}>‹ {isAr ? 'رجوع' : 'BACK'}</button>
        <div className="workout-title">💪 {isAr ? 'تمرين يومي' : 'Daily Workout'}</div>
        <p className="workout-sub">{isAr ? 'صمّم تمرينك: اختر هدفك ومدّتك.' : 'Build your workout — pick your goal and how long.'}</p>

        {assessNudge}

        <div className="workout-section-label">{isAr ? 'الهدف' : 'Your goal'}</div>
        <div className="workout-goals">
          {GOALS.map((g) => (
            <button key={g.id} className={`workout-goal${goal === g.id ? ' is-on' : ''}`} onClick={() => { setGoal(g.id); playSfx('click'); }}>
              <span className="workout-goal-ic" aria-hidden="true">{g.icon}</span>
              <span className="workout-goal-name">{isAr ? g.ar : g.en}</span>
              <span className="workout-goal-desc">{isAr ? g.descAr : g.descEn}</span>
            </button>
          ))}
        </div>

        <div className="workout-section-label">{isAr ? 'المدّة اليومية' : 'Daily time'}</div>
        <div className="workout-sizes">
          {SIZES.map((s) => (
            <button key={s.id} className={`workout-size${size === s.id ? ' is-on' : ''}`} onClick={() => { setSize(s.id); playSfx('click'); }}>
              <span className="workout-size-name">{isAr ? s.ar : s.en}</span>
              <span className="workout-size-min">~{s.minutes} {isAr ? 'دقيقة' : 'min'}</span>
              <span className="workout-size-sub">{s.count} {isAr ? 'تمارين' : 'exercises'}</span>
            </button>
          ))}
        </div>

        <button className="workout-cta" onClick={confirmSetup}>{isAr ? 'احفظ التمرين' : 'Save my workout'}</button>
      </div>
    );
  }

  // ── Today's plan ──
  const today = st.today;
  const exercises = today?.exercises || [];
  const done = today?.done || [];
  const doneCount = done.filter(Boolean).length;
  const allDone = exercises.length > 0 && doneCount === exercises.length;
  const goalDef = GOALS_BY_ID[today?.goal];
  const sizeDef = SIZES_BY_ID[today?.size];
  const startedSome = doneCount > 0 && !allDone;

  return (
    <div className="workout-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <button className="workout-back" onClick={() => switchTab('home')}>‹ {isAr ? 'رجوع' : 'BACK'}</button>
      <div className="workout-header">
        <div className="workout-title">💪 {isAr ? 'تمرين اليوم' : "Today's Workout"}</div>
        <div className="workout-streak" title={isAr ? 'سلسلة الأيام' : 'day streak'}>🔥 {st.streak || 0}</div>
      </div>
      <p className="workout-sub">
        {goalDef && <>{goalDef.icon} {isAr ? goalDef.ar : goalDef.en}</>}
        {sizeDef && <> · ~{sizeDef.minutes} {isAr ? 'دقيقة' : 'min'}</>}
        <button className="workout-edit" onClick={() => { playSfx('click'); setGoal(today.goal); setSize(today.size); resetPrefs(); setView('setup'); }}>⚙</button>
      </p>

      <div className="workout-progress">
        <div className="workout-progress-bar" style={{ width: `${exercises.length ? (doneCount / exercises.length) * 100 : 0}%` }} />
      </div>
      <div className="workout-progress-text">
        {doneCount}/{exercises.length} {isAr ? 'مكتمل' : 'done'}
        <button className="workout-progress-link" onClick={() => { playSfx('click'); setView('stats'); }}>
          📊 {isAr ? 'التقدّم' : 'Progress'}
        </button>
      </div>

      {assessNudge}

      {/* Primary action: run the whole personalized session hands-free */}
      {!allDone && (
        <button className="workout-cta workout-start" onClick={startSession}>
          ▶ {startedSome ? (isAr ? 'متابعة التمرين' : 'Continue Workout') : (isAr ? 'ابدأ التمرين' : 'Start Workout')}
        </button>
      )}

      {celebrate && allDone && (
        <div className="workout-celebrate">
          🎉 {isAr ? `أحسنت! +${COMPLETE_BONUS} نقطة · سلسلة ${st.streak} يوم` : `Nice! +${COMPLETE_BONUS} pts · ${st.streak}-day streak`}
        </div>
      )}

      <div className="workout-section-label workout-plan-label">{isAr ? 'خطة اليوم' : "Today's plan"}</div>
      <div className="workout-list">
        {exercises.map((ex, i) => (
          <button
            key={i}
            className={`workout-item${done[i] ? ' is-done' : ''}`}
            onClick={() => !done[i] && startExercise(i)}
            disabled={done[i]}
          >
            <span className="workout-item-num">{i + 1}</span>
            <span className="workout-item-glyph" style={{ color: ex.color }} aria-hidden="true">{ex.glyph}</span>
            <span className="workout-item-main">
              <span className="workout-item-name">{ex.gameName}</span>
              <span className="workout-item-meta">
                {isAr ? ex.domainNameAr : ex.domainName} · {isAr ? ex.levelAr : ex.levelEn}
              </span>
            </span>
            <span className="workout-item-action">{done[i] ? '✓' : '▶'}</span>
          </button>
        ))}
      </div>

      {allDone && (
        <p className="workout-alldone">{isAr ? 'اكتمل تمرين اليوم! عُد غداً للحفاظ على سلسلتك.' : "Today's workout complete! Come back tomorrow to keep your streak."}</p>
      )}
    </div>
  );
}
