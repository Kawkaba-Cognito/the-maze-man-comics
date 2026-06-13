import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { GOALS, GOALS_BY_ID, SIZES, SIZES_BY_ID } from '../../features/workout/workoutData';
import {
  loadWorkout, ensureToday, savePrefs, markDone, consumeJustCompleted, resetPrefs,
  checkDue, recordCheck, getReminder, saveReminder,
} from '../../features/workout/workoutState';
import { ensureNotifPermission, syncNativeReminder, notifPermission, formatTimeLabel } from '../../features/workout/reminders';
import { getLazyGame } from '../../features/training/lazyGames';
import { hasAssessProfile } from '../../features/training/assessment/assessmentProfile';
import { reliableChangeRaw } from '../../features/training/assessment/assessmentNorms';
import { ANCHORS } from '../../features/training/assessment/paradigmAnchors';
import { gameRatingByGameKey, ratingBand } from '../../features/training/rating';
import ReactionTest from '../../features/workout/ReactionTest';
import WorkoutStats from './WorkoutStats';

/*
 * DAILY WORKOUT — a hands-free guided session.
 *
 * One press runs the whole professional protocol:
 *   baseline reaction test → timed exercise blocks (auto-launched into free
 *   play, auto-advanced when the block clock ends) → post-session reaction
 *   test → summary with the session effect, streak and bonus.
 * Blocks are time-budgeted by the user's goal (workoutPlan), difficulty is
 * adaptive (age + assessment + history), and pre/post results are tracked
 * per day for the progress view.
 */
const COMPLETE_BONUS = 50;
const TRANSITION_SECS = 4;

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

/** Apple-Fitness-style circular progress ring. `frac` 0..1. */
function ProgressRing({ frac, done, total, allDone }) {
  const R = 52, SW = 11, C = 2 * Math.PI * R;
  const off = C * (1 - Math.max(0, Math.min(1, frac)));
  return (
    <div className="wk-ring">
      <svg viewBox="0 0 128 128" width="128" height="128" aria-hidden="true">
        <circle cx="64" cy="64" r={R} fill="none" stroke="#2a1606" strokeWidth={SW} />
        <circle
          cx="64" cy="64" r={R} fill="none"
          stroke={allDone ? '#9be85a' : 'url(#wkRingGrad)'} strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off}
          transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset .5s ease' }}
        />
        <defs>
          <linearGradient id="wkRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffd574" />
            <stop offset="100%" stopColor="#9be85a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="wk-ring-center">
        {allDone ? (
          <span className="wk-ring-check">✓</span>
        ) : (
          <><b className="wk-ring-frac">{done}<span>/{total}</span></b></>
        )}
      </div>
    </div>
  );
}

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
  const [secsLeft, setSecsLeft] = useState(null);
  const autoStarted = useRef(false);
  const ratingsBefore = useRef({});

  // Setup form state
  const [goal, setGoal] = useState(st.prefs?.goal || 'weak');
  const [size, setSize] = useState(st.prefs?.size || 'standard');

  // Reminder editor state
  const [rem, setRem] = useState(() => getReminder(st));
  const [remOpen, setRemOpen] = useState(false);
  const [remPerm, setRemPerm] = useState(() => notifPermission());

  async function applyReminder(next) {
    playSfx('click');
    if (next.enabled) { await ensureNotifPermission(); setRemPerm(notifPermission()); }
    setRem(next);
    setSt(saveReminder(next));
    syncNativeReminder(next, isAr ? 'ar' : 'en');
  }

  // ONE-PRESS WORKOUT: opening this screen with a saved plan and unfinished
  // exercises drops you straight into the guided session.
  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    const undone = (st.today?.done || []).findIndex((d) => !d);
    if (st.prefs && undone >= 0) startSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // BLOCK CLOCK: while a session game is on screen, count down its time
  // budget; at zero the block completes and the session advances itself.
  useEffect(() => {
    if (view !== 'game' || !sessionMode || activeIdx == null) { setSecsLeft(null); return undefined; }
    const ex = st.today?.exercises[activeIdx];
    let s = ex?.seconds || 180;
    setSecsLeft(s);
    const id = setInterval(() => {
      s -= 1;
      setSecsLeft(s);
      if (s <= 0) { clearInterval(id); playSfx('win'); finishExercise(); }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, sessionMode, activeIdx]);

  function confirmSetup() {
    playSfx('click');
    setSt(savePrefs(goal, size));
    setView('plan');
  }

  function goToTransition(idx) { setTransitionIdx(idx); setView('transition'); }
  function launchNow(idx) { playSfx('click'); setActiveIdx(idx); setView('game'); }

  // Start (or resume) the whole guided session. About once a week the session
  // opens with the reaction check-in; otherwise straight into the first block.
  function startSession() {
    const doneArr = st.today?.done || [];
    const first = doneArr.findIndex((d) => !d);
    if (first < 0) return;
    setSessionMode(true);
    // snapshot ratings so the summary can show what this session changed
    ratingsBefore.current = {};
    (st.today?.exercises || []).forEach((ex) => {
      ratingsBefore.current[ex.gameKey] = gameRatingByGameKey(ex.gameKey)?.rating ?? null;
    });
    if (doneArr.every((d) => !d) && checkDue(st).due) setView('pretest');
    else goToTransition(first);
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
      if (consumeJustCompleted()) { awardPoints(COMPLETE_BONUS); setCelebrate(true); }
      else playSfx('collect');
    }
    setActiveIdx(null);
    if (sessionMode) {
      const doneArr = updated.today?.done || [];
      const next = doneArr.findIndex((d) => !d);
      if (next >= 0) { goToTransition(next); return; }
      setSessionMode(false);
      setView('summary'); // all blocks done
      return;
    }
    setView('plan');
  }

  // ── Weekly reaction check-in (runs at session start when due) ──
  if (view === 'pretest') {
    return (
      <ReactionTest
        isAr={isAr} kind="week" playSfx={playSfx}
        onDone={(ms) => { setSt(recordCheck(ms)); const first = (st.today?.done || []).findIndex((d) => !d); goToTransition(Math.max(first, 0)); }}
        onSkip={() => { const first = (st.today?.done || []).findIndex((d) => !d); goToTransition(Math.max(first, 0)); }}
      />
    );
  }

  // ── Session summary ──
  if (view === 'summary') {
    const exs = st.today?.exercises || [];
    const doneArr = st.today?.done || [];
    const minutes = Math.round(exs.reduce((a, e, i) => a + (doneArr[i] ? (e.seconds || 180) : 0), 0) / 60);
    const domains = [...new Set(exs.filter((_, i) => doneArr[i]).map((e) => (isAr ? e.domainNameAr : e.domainName)))];
    // rating movement this session (only games that banked a completed run)
    const ratingRows = exs.filter((_, i) => doneArr[i]).map((ex) => {
      const now = gameRatingByGameKey(ex.gameKey);
      if (!now || now.status === 'provisional') return null;
      const before = ratingsBefore.current[ex.gameKey];
      const d = before != null ? now.rating - before : null;
      return { name: ex.gameName, rating: now.rating, delta: d, band: ratingBand(now.rating), calibrating: now.status === 'calibrating' };
    }).filter(Boolean);
    // weekly check trend (last vs previous)
    const { last, prev } = checkDue(st);
    const wkDelta = last && prev ? last.ms - prev.ms : null;
    return (
      <div className="workout-screen wk-trans" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="wk-summary-card">
          <div className="wk-summary-title">🏁 {isAr ? 'اكتملت جلسة اليوم!' : 'Session complete!'}</div>
          {celebrate && (
            <div className="workout-celebrate">🎉 {isAr ? `+${COMPLETE_BONUS} نقطة · سلسلة ${st.streak} يوم` : `+${COMPLETE_BONUS} pts · ${st.streak}-day streak`}</div>
          )}
          <div className="wk-summary-rows">
            <div className="wk-summary-row"><span>⏱ {isAr ? 'وقت التدريب' : 'Time trained'}</span><b>{minutes} {isAr ? 'دقيقة' : 'min'}</b></div>
            <div className="wk-summary-row"><span>🧩 {isAr ? 'التمارين' : 'Exercises'}</span><b>{doneArr.filter(Boolean).length}/{exs.length}</b></div>
            <div className="wk-summary-row"><span>🧠 {isAr ? 'المجالات' : 'Domains'}</span><b>{domains.join(' · ')}</b></div>
            {ratingRows.map((r) => (
              <div className="wk-summary-row" key={r.name}>
                <span>📈 {r.name}</span>
                <b style={{ color: r.band.color }}>
                  {r.rating}
                  {r.delta != null && r.delta !== 0 && (
                    <span className={`wk-rating-delta${r.delta > 0 ? ' is-up' : ''}`}> {r.delta > 0 ? '▲' : '▼'}{Math.abs(r.delta)}</span>
                  )}
                  {r.calibrating && <span className="wk-rating-cal"> {isAr ? '· معايرة' : '· calibrating'}</span>}
                </b>
              </div>
            ))}
            {last && (
              <div className="wk-summary-row">
                <span>🧪 {isAr ? 'فحص الأسبوع' : 'Weekly check'}</span>
                <b>
                  {last.ms} ms
                  {wkDelta != null && wkDelta !== 0 && (
                    <span className={`wk-rating-delta${wkDelta < 0 ? ' is-up' : ''}`}> {wkDelta < 0 ? '▼' : '▲'}{Math.abs(wkDelta)}</span>
                  )}
                </b>
              </div>
            )}
          </div>
          {wkDelta != null && (() => {
            // Only claim "the training is working" when the change clears the
            // reliable-change threshold — smaller swings are measurement noise.
            const rc = reliableChangeRaw(wkDelta, ANCHORS.pvtMedianMs.sd, 0.8);
            if (!rc?.reliable) {
              return (
                <div className="wk-summary-effect">
                  {isAr
                    ? `التغيّر ${wkDelta > 0 ? '+' : ''}${wkDelta} م.ث عن الأسبوع الماضي — ضمن هامش التقلّب الطبيعي؛ الاتجاه عبر عدة أسابيع هو المهم.`
                    : `${wkDelta > 0 ? '+' : ''}${wkDelta} ms vs last week — within normal week-to-week noise; the multi-week trend is what counts.`}
                </div>
              );
            }
            return (
              <div className={`wk-summary-effect${wkDelta <= 0 ? ' is-up' : ''}`}>
                {wkDelta <= 0
                  ? (isAr ? `⚡ رد فعلك أسرع بـ${Math.abs(wkDelta)} م.ث من الأسبوع الماضي — تغيّر موثوق، التدريب يعمل!` : `⚡ ${Math.abs(wkDelta)} ms faster than last week's check — a reliable change; the training is working!`)
                  : (isAr ? `💤 أبطأ بـ${wkDelta} م.ث من الأسبوع الماضي — النوم والإجهاد يؤثران؛ واصل التدريب.` : `💤 ${wkDelta} ms slower than last week — sleep & stress matter; keep training.`)}
              </div>
            );
          })()}
          <button className="workout-cta" onClick={() => { playSfx('click'); setCelebrate(false); setView('plan'); }}>
            {isAr ? 'تم' : 'Done'}
          </button>
          <button className="wk-trans-end" onClick={() => { playSfx('click'); setCelebrate(false); setView('stats'); }}>
            📊 {isAr ? 'عرض التقدّم' : 'View progress'}
          </button>
        </div>
      </div>
    );
  }

  // ── Progress & stats ──
  if (view === 'stats') {
    return <WorkoutStats onBack={() => setView('plan')} />;
  }

  // ── Hosting a game (with the session HUD overlaid during guided runs) ──
  if (view === 'game' && activeIdx != null) {
    const ex = st.today?.exercises[activeIdx];
    const GameView = ex ? getLazyGame(ex.gameKey) : null;
    if (!GameView) { finishExercise(); return null; }
    const total = st.today?.exercises.length || 0;
    const pos = (st.today?.done || []).filter(Boolean).length + 1;
    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <Suspense fallback={<div className="workout-loading">{isAr ? 'جارِ التحميل…' : 'Loading…'}</div>}>
          <GameView onBack={finishExercise} workoutMode={sessionMode} />
        </Suspense>
        {sessionMode && secsLeft != null && (
          <div className="wk-hud" dir={isAr ? 'rtl' : 'ltr'}>
            <span className="wk-hud-step">{pos}/{total}</span>
            <span className={`wk-hud-time${secsLeft <= 15 ? ' is-low' : ''}`}>⏱ {fmt(secsLeft)}</span>
            <button className="wk-hud-btn" onClick={() => { playSfx('click'); finishExercise(); }}>{isAr ? 'التالي ↦' : 'Next ↦'}</button>
          </div>
        )}
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
          <div className="wk-trans-meta">
            {isAr ? ex.domainNameAr : ex.domainName} · {isAr ? ex.levelAr : ex.levelEn} · ⏱ {fmt(ex.seconds || 180)}
          </div>
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

  const minutes = sizeDef?.minutes ?? Math.round(exercises.reduce((a, e) => a + (e.seconds || 180), 0) / 60);

  return (
    <div className="workout-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <button className="workout-back" onClick={() => switchTab('home')}>‹ {isAr ? 'رجوع' : 'BACK'}</button>

      {/* Progress-ring hero */}
      <div className="wk-hero">
        <div className="wk-hero-top">
          <div className="workout-title">{isAr ? 'تمرين اليوم' : "Today's Workout"}</div>
          <div className="workout-streak" title={isAr ? 'سلسلة الأيام' : 'day streak'}>🔥 {st.streak || 0}</div>
        </div>
        <div className="wk-hero-main">
          <ProgressRing frac={exercises.length ? doneCount / exercises.length : 0} done={doneCount} total={exercises.length} allDone={allDone} />
          <div className="wk-hero-chips">
            <div className="wk-chip">⏱ ~{minutes} {isAr ? 'دقيقة' : 'min'}</div>
            {goalDef && <div className="wk-chip">{goalDef.icon} {isAr ? goalDef.ar : goalDef.en}</div>}
            <button className="wk-chip wk-chip-btn" onClick={() => { playSfx('click'); setGoal(today.goal); setSize(today.size); resetPrefs(); setView('setup'); }}>
              ⚙ {isAr ? 'تعديل' : 'Edit'}
            </button>
            <button className="wk-chip wk-chip-btn" onClick={() => { playSfx('click'); setView('stats'); }}>
              📊 {isAr ? 'التقدّم' : 'Progress'}
            </button>
          </div>
        </div>

        {!allDone ? (
          <button className="workout-cta workout-start" onClick={() => { playSfx('click'); startSession(); }}>
            ▶ {startedSome ? (isAr ? 'متابعة التمرين' : 'Continue Workout') : (isAr ? 'ابدأ التمرين' : 'Start Workout')}
          </button>
        ) : (
          <div className="wk-hero-done">✓ {isAr ? 'اكتمل تمرين اليوم — إلى الغد!' : 'Done for today — see you tomorrow!'}</div>
        )}
      </div>

      {assessNudge}

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
                {isAr ? ex.domainNameAr : ex.domainName} · {isAr ? ex.levelAr : ex.levelEn} · ⏱ {fmt(ex.seconds || 180)}
              </span>
            </span>
            <span className="workout-item-action">{done[i] ? '✓' : '▶'}</span>
          </button>
        ))}
      </div>

      {allDone && (
        <p className="workout-alldone">{isAr ? 'اكتمل تمرين اليوم! عُد غداً للحفاظ على سلسلتك.' : "Today's workout complete! Come back tomorrow to keep your streak."}</p>
      )}

      {/* Daily reminder */}
      <div className={`wk-remind${remOpen ? ' is-open' : ''}`}>
        <button className="wk-remind-head" onClick={() => { playSfx('click'); setRemOpen((o) => !o); }}>
          <span className="wk-remind-ic" aria-hidden="true">⏰</span>
          <span className="wk-remind-label">{isAr ? 'تذكير يومي' : 'Daily reminder'}</span>
          <span className="wk-remind-value">{rem.enabled ? formatTimeLabel(rem.time, isAr) : (isAr ? 'متوقف' : 'Off')}</span>
          <span className="wk-remind-chev" aria-hidden="true">{remOpen ? '▾' : '›'}</span>
        </button>
        {remOpen && (
          <div className="wk-remind-body">
            <label className="wk-remind-toggle">
              <input
                type="checkbox"
                checked={rem.enabled}
                onChange={(e) => applyReminder({ ...rem, enabled: e.target.checked })}
              />
              <span>{isAr ? 'ذكّرني كل يوم' : 'Remind me every day'}</span>
            </label>
            <div className="wk-remind-time-row">
              <span>{isAr ? 'الوقت' : 'Time'}</span>
              <input
                type="time"
                className="wk-remind-time"
                value={rem.time}
                onChange={(e) => applyReminder({ ...rem, time: e.target.value, enabled: true })}
              />
            </div>
            {rem.enabled && remPerm === 'denied' && (
              <p className="wk-remind-note">{isAr ? '🔕 إشعارات المتصفح محظورة — سنذكّرك داخل التطبيق عند فتحه. فعّل الإشعارات من إعدادات المتصفح لتنبيه النظام.' : '🔕 Browser notifications are blocked — we’ll still nudge you inside the app. Enable notifications in your browser settings for a system alert.'}</p>
            )}
            {rem.enabled && (remPerm === 'granted' || remPerm === 'native') && (
              <p className="wk-remind-note is-ok">{isAr ? '🔔 سيصلك تنبيه يومي في الوقت المحدد.' : '🔔 You’ll get a daily alert at the set time.'}</p>
            )}
            {rem.enabled && remPerm === 'default' && (
              <p className="wk-remind-note">{isAr ? 'اسمح بالإشعارات لتلقّي تنبيه النظام (وإلا سنذكّرك داخل التطبيق).' : 'Allow notifications for a system alert (otherwise we’ll nudge you in-app).'}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
