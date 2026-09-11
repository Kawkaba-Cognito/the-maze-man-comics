import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Star, CaretRight, CaretLeft } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import BreathePractice from './BreathePractice';
import GroundingPractice from './GroundingPractice';
import PmrPractice from './PmrPractice';
import IkigaiPractice from './IkigaiPractice';
import PersonalityQuiz from './PersonalityQuiz';
import RelationshipQuiz from './RelationshipQuiz';
import SleepSoundsPractice from './SleepSoundsPractice';
import SleepResetPractice from './SleepResetPractice';
import ConnectPractice from './ConnectPractice';
import Who5Practice from './Who5Practice';
import WorksheetRunner, { TIERS } from './worksheetEngine';
import { worksheetById } from './worksheets.js';
import DailyHabits from './DailyHabits';
import { planetTextureLayerStyle } from '../../lib/planetTexture';
import { planetIconUrl, wellbeingPillarArtUrl } from '../../lib/planetIcons';
import { OPEN_DAILY_KEY } from './HabitReminderBanner';
import UniverseStage from '../../components/shared/UniverseStage';
import { RELAX_PRACTICES } from './practices.js';
import SafetyNote, { SAFETY_CSS } from './SafetyNote';
import { NEED_STATES, MEASURED_PRACTICES, getPracticeStats, tierFor } from './practiceLog';
import { loadWellbeingJourney } from './wellbeingJourney';
import { markWellbeingPracticeDone } from './habitState';
import './wellbeing.css';
/* The personalization CONTROLS moved to Home (features/personalization/
 * NeuralPanel) — there is one model, so it now has one surface. What stays here
 * is the RECORDING: choosing a practice is the example the wellbeing model
 * learns from, and that has to happen where the choice is made. */
import { getWellbeingContext, personalizationEnabled } from '../personalization/neuralPersonalization.js';
import { recordWellbeingSelection } from '../personalization/wellbeingRecommendations.js';

/*
 * Wellbeing — 8-Week MBSR Tracker (lives under the Stress & Calm category).
 *
 * A guided, secular Mindfulness-Based Stress Reduction program: a daily practice
 * with a timer, an 8-week calendar, and a reference guide. Restyled to the app's
 * warm paper/gold aesthetic. Non-gamified by design; honest framing. All state
 * persists in localStorage. Styles are scoped under `.rx-root` so they never
 * bleed into the rest of the app.
 *
 * Improvements over the source: finishing the timer plays a soft chime and marks
 * the day done; softened/honest science claims + a "not medical advice" note;
 * tap-anywhere modal dismiss; warm theme matched to the app.
 */

const PHASES = [
  { phase: 'I', label: 'The Body', weeks: [1, 2], technique: 'Body Scan', duration: '20–30 min', color: '#d07a3e', ink: '#7e3b16', inkDark: '#e79a63', icon: '🫁',
    instructions: ['Lie down on your back in a comfortable position.', 'Close your eyes and take three slow breaths to settle in.', 'Bring attention to your LEFT toes — just notice whatever is there. Tingling? Warmth? Numbness? Nothing?', 'Slowly move up: foot → ankle → calf → knee → thigh.', 'Repeat on the RIGHT leg.', 'Continue upward: hips → lower back → abdomen → chest → shoulders.', 'Move down each arm: shoulder → elbow → wrist → fingers.', 'Finally: neck → jaw → face → crown of the head.', "If you fall asleep — that's fine. If your mind wanders — gently return. No judgment."],
    tip: "Don't try to relax each body part. Just notice it, as if you're a curious scientist." },
  { phase: 'II', label: 'The Breath', weeks: [3, 4], technique: 'Mindful Breathing', duration: '20 min', color: '#3f7fc4', ink: '#224c7c', inkDark: '#70a5df', icon: '🌬️',
    instructions: ['Sit upright — on a chair, floor, or cushion. Dignified but not rigid.', 'Eyes closed or softly focused on the floor 3 feet ahead.', 'Choose your anchor: the sensation of air at your NOSTRILS, or the RISE AND FALL of your abdomen.', 'Simply rest attention there. Feel the cool air coming in, the warm air going out.', 'When your mind wanders (it will, within seconds) — that is NORMAL. Gently return.', "Each return is one 'rep.' You are literally training your attention muscle.", 'No counting. No controlling the breath. Just observing.'],
    tip: 'The goal is NOT to have a clear mind. The goal is to notice when it wanders, and return. That noticing IS the practice.' },
  { phase: 'III', label: 'Movement', weeks: [5], technique: 'Mindful Stretching', duration: '20–30 min', color: '#3a9d5d', ink: '#245733', inkDark: '#70c686', icon: '🧘',
    instructions: ['Stand or sit. No special equipment needed.', 'Begin with a slow neck roll — left, forward, right. Move at 10% of normal speed.', 'Raise both arms slowly overhead. Feel every millimeter of the stretch.', 'Shoulder rolls — forward 5 times, backward 5 times. Full attention on the sensation.', 'Gentle forward fold from the waist — feel the pull in your hamstrings.', 'Seated spinal twist — left then right. Notice which side feels different.', 'Throughout all movement: the mind is FULLY in the body. If it wanders, return to sensation.'],
    tip: 'This week bridges mental and physical mindfulness. It also builds body awareness that deepens your future sitting practice.' },
  { phase: 'IV', label: 'Observation', weeks: [6, 7], technique: 'Open Awareness', duration: '20 min', color: '#8b5cc4', ink: '#623d85', inkDark: '#b894df', icon: '🌌',
    instructions: ['Sit as in the breathing practice. Settle with 3 breaths.', 'Instead of focusing on ONE thing — open your awareness to EVERYTHING.', "Notice sounds — near, far, loud, faint. Don't label them, just hear.", 'Notice physical sensations arising and passing — an itch, a heaviness, a tightness.', 'Notice thoughts — watch them appear like bubbles, without grabbing onto them.', 'You are the sky. Thoughts, feelings, sounds are clouds passing through.', 'If you feel lost — return briefly to the breath, then open up again.'],
    tip: 'This phase can feel uncomfortable at first — you have no single anchor. That discomfort IS the training.' },
  { phase: 'V', label: 'Integration', weeks: [8], technique: 'Choiceless Awareness', duration: '20–30 min', color: '#cf5b8f', ink: '#863755', inkDark: '#e58ab4', icon: '✨',
    instructions: ['Sit and begin with 5 minutes of focused breath (Phase II style).', 'Then expand to open awareness (Phase IV style) for 5–10 minutes.', 'Alternate between the two freely — breath when you need grounding, open when you feel stable.', 'After your sitting practice, choose ONE daily chore today: washing dishes, making coffee, walking.', "Do that chore with complete attention — as if you've never done it before.", 'Notice textures, temperatures, sounds, smells. Notice resistance or boredom. Stay anyway.', 'This is where MBSR becomes a way of life, not just a 20-minute session.'],
    tip: "Formal practice ends, but mindfulness doesn't. Every moment of daily life is now an opportunity to practice." },
];

const DOS = [
  { icon: '⏰', title: 'Same Time Daily', text: 'Habit stack — practice right after brushing your teeth or morning coffee.' },
  { icon: '⚓', title: 'Use Your Anchor', text: 'When lost, return to the physical breath sensation as your home base.' },
  { icon: '💪', title: 'Acknowledge Wandering', text: 'Realizing your mind drifted IS the bicep curl. That moment = success.' },
  { icon: '📓', title: 'Keep a Log', text: 'One sentence after each session. What did you notice?' },
];
const DONTS = [
  { icon: '⚔️', title: "Don't Fight Thoughts", text: 'You cannot clear your mind. Just watch thoughts without following them.' },
  { icon: '⚖️', title: "Don't Judge the Session", text: 'Distracted the whole time and stayed? Showing up still counts.' },
  { icon: '😤', title: "Don't Force Relaxation", text: "Note 'tension is present' — chasing calm often makes it harder to find." },
  /* ⚠ This used to read "Don't Skip Days", which contradicted two things at
     once: the non-striving rule three cards above it, and the Habits module in
     this same feature, which deliberately ships grace days and skip reasons
     because guilt is what drives people away from a wellbeing tool. A missed
     day cannot mean one thing in Habits and the opposite here. */
  { icon: '📅', title: "Don't Make Up for Lost Days", text: 'Missed one? Start again today — five minutes counts. A gap is not a debt to repay.' },
];

const dateKey = (d) => { const dt = new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`; };
const addDays = (s, n) => { const d = new Date(s); d.setDate(d.getDate() + n); return dateKey(d); };
const getPhaseForWeek = (w) => PHASES.find((p) => p.weeks.includes(w)) || PHASES[0];
function getWeekAndDay(startDate) {
  if (!startDate) return { week: null, day: null };
  const start = new Date(startDate); start.setHours(0, 0, 0, 0);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now - start) / 86400000);
  if (diff < 0 || diff >= 56) return { week: null, day: null };
  return { week: Math.floor(diff / 7) + 1, day: (diff % 7) + 1 };
}
function computeStreak(completed) {
  let s = 0; const d = new Date();
  for (;;) { const k = dateKey(d); if (completed[k]) { s += 1; d.setDate(d.getDate() - 1); } else break; }
  return s;
}
const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

function MbsrTracker({ onBack }) {
  const { playSfx, appTheme } = useApp();
  const phaseInk = (phase) => (appTheme === 'light' ? phase.ink : phase.inkDark);
  const today = dateKey(new Date());

  const [tab, setTab] = useState('today');
  const [startDate, setStartDate] = useState(null);
  const [completed, setCompleted] = useState({});
  const [notes, setNotes] = useState({});
  const [draft, setDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTarget, setTimerTarget] = useState(20 * 60);
  const [showModal, setShowModal] = useState(false);
  const [pickedDate, setPickedDate] = useState(today);

  useEffect(() => {
    const sd = lsGet('mbsr_startDate');
    const cp = lsGet('mbsr_completed');
    const nt = lsGet('mbsr_notes');
    if (sd) setStartDate(sd);
    let n = {};
    if (cp) { try { setCompleted(JSON.parse(cp)); } catch { /* ignore */ } }
    if (nt) { try { n = JSON.parse(nt); setNotes(n); } catch { /* ignore */ } }
    setDraft(n[today] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!timerActive) return undefined;
    const id = setInterval(() => { setTimerSeconds((s) => (s + 1 >= timerTarget ? timerTarget : s + 1)); }, 1000);
    return () => clearInterval(id);
  }, [timerActive, timerTarget]);

  // finishing the timer: soft chime + auto-mark the day done.
  useEffect(() => {
    if (timerActive && timerSeconds >= timerTarget && timerTarget > 0) {
      setTimerActive(false);
      playSfx?.('collect');
      setCompleted((prev) => {
        if (prev[today]) return prev;
        const n = { ...prev, [today]: true };
        lsSet('mbsr_completed', JSON.stringify(n));
        markWellbeingPracticeDone('mbsr');
        return n;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timerSeconds, timerTarget]);

  const { week: currentWeek, day: currentDay } = getWeekAndDay(startDate);
  const todayPhase = currentWeek ? getPhaseForWeek(currentWeek) : null;
  const streak = computeStreak(completed);
  const totalDone = Object.values(completed).filter(Boolean).length;

  const toggleDay = (key) => {
    setCompleted((prev) => {
      const done = !prev[key];
      const n = { ...prev, [key]: done };
      lsSet('mbsr_completed', JSON.stringify(n));
      if (done) markWellbeingPracticeDone('mbsr');
      return n;
    });
    playSfx?.('click');
  };
  const setTarget = (min) => { setTimerActive(false); setTimerSeconds(0); setTimerTarget(min * 60); playSfx?.('click'); };
  const toggleTimer = () => { playSfx?.('click'); setTimerActive((a) => !a); };
  const resetTimer = () => { setTimerActive(false); setTimerSeconds(0); };
  const confirmStart = () => { setStartDate(pickedDate); lsSet('mbsr_startDate', pickedDate); setShowModal(false); playSfx?.('click'); };
  const saveNote = () => { const v = draft.trim(); if (!v) return; setNotes((prev) => { const n = { ...prev, [today]: v }; lsSet('mbsr_notes', JSON.stringify(n)); return n; }); setSavedFlash(true); playSfx?.('click'); };

  const circ = 2 * Math.PI * 54;
  const circOffset = circ * (1 - Math.min(timerSeconds / timerTarget, 1));
  const p = todayPhase;

  return (
    <div className="rx-wb rx-root" dir="ltr">
      <style>{CSS}</style>
      <style>{SAFETY_CSS}</style>
      <div className="rx-app">
        <div className="header">
          <button className="rx-back" onClick={onBack} aria-label="Back">‹</button>
          <div className="header-row">
            <div>
              {/* ⚠ IT IS NOT CALLED "MBSR" ANY MORE (2026-09-07). MBSR is a
                  specific manualised course: eight weekly ~2.5-hour classes
                  with a certified teacher, group inquiry, a day-long silent
                  retreat between weeks 6 and 7, mindful yoga, and the
                  pleasant/unpleasant-events calendars. What ships here is a
                  solo timer and a reading guide — a good self-guided programme,
                  but MBSR's evidence base rests on the TAUGHT format, so
                  wearing the name borrows credibility the format has not
                  earned. "Inspired by" is the honest claim, and it costs
                  nothing: see the guide tab for a pointer to the real course. */}
              <div className="header-sub">Mindfulness Programme</div>
              <div className="header-title serif">8 Weeks of<br /><em>Mindfulness</em></div>
            </div>
            <div className="header-stats">
              <div className="stat-num" style={{ color: '#c47a3e' }}>{streak}</div>
              <div className="stat-label">day streak</div>
              <div className="stat-num" style={{ color: '#2e8b57', fontSize: 20, marginTop: 8 }}>{totalDone}/56</div>
              <div className="stat-label">sessions</div>
            </div>
          </div>
          <div className="phase-bar-row">
            {PHASES.map((ph) => (
              <div key={ph.phase} className="phase-bar" style={{ flex: ph.weeks.length, background: ph.color, opacity: todayPhase?.phase === ph.phase ? 1 : 0.28 }} />
            ))}
          </div>
          {todayPhase && (
            <div className="phase-info">
              <span style={{ color: phaseInk(todayPhase), fontWeight: 700 }}>Phase {todayPhase.phase}: {todayPhase.label}</span> · Week {currentWeek}, Day {currentDay}
            </div>
          )}
        </div>

        <div className="tabs">
          {[['today', 'Today'], ['calendar', 'Calendar'], ['guide', 'Guide']].map(([id, label]) => (
            <button key={id} className={`tab-btn${tab === id ? ' active' : ''}`} onClick={() => { setTab(id); playSfx?.('click'); }}>{label}</button>
          ))}
        </div>

        <div className="content">
          {tab === 'today' && !startDate && (
            <div className="empty-state">
              <img className="empty-art" src={wellbeingPillarArtUrl('calm')} alt="" draggable={false} />
              <div className="empty-title">Ready to begin?</div>
              <div className="empty-sub">Set your start date and we'll guide you through all 8 weeks — daily instructions, a timer, and a session log.</div>
              <button className="start-btn" onClick={() => setShowModal(true)}>Start my program</button>
            </div>
          )}
          {tab === 'today' && startDate && !currentWeek && (
            <div className="empty-state">
              <div className="empty-emoji">🎉</div>
              <div className="empty-title" style={{ color: '#2e8b57' }}>Program complete!</div>
              <div className="empty-sub">You finished all 8 weeks. The practice is yours now — keep going whenever you like.</div>
            </div>
          )}
          {tab === 'today' && startDate && currentWeek && p && (
            <>
              <div className="technique-card" style={{ background: `linear-gradient(135deg, ${p.color}1f, ${p.color}0c)`, border: `1.5px solid ${p.color}55` }}>
                <div className="technique-header">
                  <div>
                    <div style={{ fontSize: 11, color: phaseInk(p), letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontWeight: 800 }}>Today's Practice</div>
                    <div className="technique-name">{p.technique}</div>
                    <div className="technique-duration">{p.duration}</div>
                  </div>
                  <div className="technique-emoji">{p.icon}</div>
                </div>

                <div className="timer-wrap">
                  <svg className="timer-svg" width="124" height="124">
                    <circle cx="62" cy="62" r="54" fill="none" stroke="#ece0cc" strokeWidth="6" />
                    <circle cx="62" cy="62" r="54" fill="none" stroke={p.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circOffset} style={{ transition: 'stroke-dashoffset 1s linear' }} />
                  </svg>
                  <div className="timer-center">
                    <div className="timer-display">{fmt(timerSeconds)}</div>
                    <div className="timer-target">{fmt(timerTarget)}</div>
                  </div>
                  <div className="timer-btns">
                    {[20, 25, 30].map((m) => (
                      <button key={m} className={`min-btn${timerTarget === m * 60 ? ' active-min' : ''}`} style={{ '--phase-color': p.color }} onClick={() => setTarget(m)}>{m}m</button>
                    ))}
                  </div>
                  <div className="action-btns">
                    <button className={`begin-btn${timerActive ? ' begin-btn--paused' : ''}`} onClick={toggleTimer} style={timerActive ? undefined : { background: `linear-gradient(135deg,${p.color},${p.color}cc)`, color: '#201d18' }}>
                      {timerActive ? '⏸ Pause' : timerSeconds > 0 ? '▶ Resume' : '▶ Begin session'}
                    </button>
                    {timerSeconds > 0 && <button className="reset-btn" onClick={resetTimer}>↺</button>}
                  </div>
                </div>

                <button className="done-btn" onClick={() => toggleDay(today)} style={completed[today] ? { background: `${p.color}26`, borderColor: p.color, color: phaseInk(p) } : undefined}>
                  {completed[today] ? '✓ Session complete' : 'Mark as done'}
                </button>
              </div>

              <div className="step-list">
                <div className="section-label">Step-by-step instructions</div>
                {p.instructions.map((s, i) => (
                  <div key={i} className="step-item">
                    <div className="step-num" style={{ background: `${p.color}1f`, borderColor: `${p.color}66`, color: phaseInk(p) }}>{i + 1}</div>
                    <div className="step-text">{s}</div>
                  </div>
                ))}
                <div className="insight-box" style={{ borderLeftColor: p.color, background: `${p.color}10` }}>
                  <div className="insight-label" style={{ color: phaseInk(p) }}>💡 KEY INSIGHT</div>
                  <div className="insight-text">{p.tip}</div>
                </div>
              </div>

              <div>
                <div className="section-label">Session log</div>
                <textarea
                  className="note-area"
                  value={draft}
                  onChange={(e) => { setDraft(e.target.value); setSavedFlash(false); }}
                  placeholder={"What did you notice during practice today?\n(e.g. 'tight shoulders,' 'mind very busy,' 'felt calm after')"}
                />
                <button className="save-btn" onClick={saveNote}>Save note</button>
                {(savedFlash || notes[today]) && <span className="saved-txt">✓ Saved</span>}
              </div>
            </>
          )}

          {tab === 'calendar' && !startDate && (
            <div className="empty-state">
              <div className="empty-sub">Start your program first to see the calendar.</div>
              <button className="go-btn" onClick={() => { setTab('today'); setShowModal(true); }}>Go to Today</button>
            </div>
          )}
          {tab === 'calendar' && startDate && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="serif rx-heading-ink" style={{ fontSize: 22 }}>Your 8 weeks</div>
                <button className="ghost-pill" onClick={() => setShowModal(true)}>Reset date</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                {PHASES.map((ph) => (
                  <div key={ph.phase} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: SUB }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: ph.color }} />Ph.{ph.phase} {ph.label}
                  </div>
                ))}
              </div>
              {Array.from({ length: 8 }).map((_, wi) => {
                const week = wi + 1;
                const phase = getPhaseForWeek(week);
                return (
                  <div key={wi} className="week-row">
                    <div className="week-label-row">
                      <div className="week-label" style={{ color: phaseInk(phase) }}>Week {week}</div>
                      <div className="week-technique">{phase.technique}</div>
                    </div>
                    <div className="day-grid">
                      {Array.from({ length: 7 }).map((__, di) => {
                        const dk = addDays(startDate, wi * 7 + di);
                        const isToday = dk === today;
                        const isDone = !!completed[dk];
                        const isFuture = dk > today;
                        const hasNote = !!notes[dk];
                        return (
                          <button
                            key={di}
                            className={`day-btn${isToday ? ' today-day' : ''}${isFuture ? ' future-day' : ''}`}
                            style={{ ...(isToday ? { borderColor: phase.color, borderWidth: 2 } : {}), ...(isDone ? { background: `${phase.color}2e`, color: phaseInk(phase), borderColor: `${phase.color}80` } : {}) }}
                            onClick={isFuture ? undefined : () => toggleDay(dk)}
                          >
                            {isDone ? '✓' : isFuture ? '·' : di + 1}
                            {hasNote && <div className="day-dot" style={{ background: phase.color }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="legend-box"><span style={{ color: '#2e8b57' }}>✓</span> = done &nbsp;·&nbsp; <span style={{ color: '#6b4d16' }}>●</span> dot = has note &nbsp;·&nbsp; tap any past/today day to toggle</div>
            </>
          )}

          {tab === 'guide' && (
            <>
              <div className="serif rx-heading-ink" style={{ fontSize: 22, marginBottom: 6 }}>The full protocol</div>
              <div style={{ fontSize: 13, color: SUB, marginBottom: 20 }}>Reference guide — all phases, dos & don'ts.</div>

              <div className="principle-card">
                <div className="section-label" style={{ color: '#6b4d16' }}>Core principles</div>
                {/* ⚠ THE "MEASURABLE BRAIN CHANGES" CLAUSE IS GONE (2026-09-07),
                    and it should not come back. It alluded to the 2011
                    hippocampal grey-matter finding, which failed to replicate
                    in a well-powered active-controlled RCT (Kral et al., 2022,
                    Science Advances). It was the weakest sentence on the screen
                    and the only one that could not be defended.

                    What replaced it is stronger BECAUSE it is qualified: the
                    honest comparison — against doing nothing vs. against
                    another active programme — is the interesting part, and it
                    is what stops a reader assuming a bigger effect than the
                    evidence carries (Goyal et al., 2014, JAMA Intern Med). */}
                {[['⚡', 'Minimum effective dose', 'About 20 minutes a day. Short and consistent beats long and rare.'], ['🚫', 'The non-striving rule', 'Don\'t try to "feel relaxed." Just notice what\'s happening — even if it\'s stress.'], ['🧬', 'What the evidence supports', 'Compared with doing nothing, mindfulness programmes show moderate improvements in anxiety and depression. Compared with another active programme, the advantage is smaller (Goyal et al., 2014).']].map(([icon, title, text]) => (
                  <div key={title} className="principle-item">
                    <div className="principle-icon">{icon}</div>
                    <div><div className="principle-title">{title}</div><div className="principle-text">{text}</div></div>
                  </div>
                ))}
              </div>

              {PHASES.map((ph) => (
                <div key={ph.phase} className="phase-guide-card" style={{ background: `${ph.color}0d`, borderColor: `${ph.color}40` }}>
                  <div className="phase-guide-header">
                    <div>
                      <div className="phase-guide-sub" style={{ color: phaseInk(ph) }}>Phase {ph.phase} · Week{ph.weeks.length > 1 ? 's' : ''} {ph.weeks.join('–')}</div>
                      <div className="phase-guide-name">{ph.technique}</div>
                    </div>
                    <div style={{ fontSize: 32 }}>{ph.icon}</div>
                  </div>
                  <div className="phase-guide-dur">{ph.duration}</div>
                  {ph.instructions.map((s, i) => <div key={i} className="phase-step">{s}</div>)}
                  <div className="phase-tip" style={{ borderLeftColor: ph.color }}>{ph.tip}</div>
                </div>
              ))}

              <div className="dos-head" style={{ color: '#2e8b57' }}>✅ The DOs</div>
              {DOS.map((d) => (
                <div key={d.title} className="do-card" style={{ background: '#eef7f0', borderColor: '#bfe0c8' }}>
                  <div className="do-icon">{d.icon}</div>
                  <div><div className="do-title" style={{ color: '#2e8b57' }}>{d.title}</div><div className="do-text">{d.text}</div></div>
                </div>
              ))}

              <div className="dos-head" style={{ color: '#c0564e', marginTop: 8 }}>❌ The DON'Ts</div>
              {DONTS.map((d) => (
                <div key={d.title} className="do-card" style={{ background: '#fdeeec', borderColor: '#ecc9bd' }}>
                  <div className="do-icon">{d.icon}</div>
                  <div><div className="do-title" style={{ color: '#c0564e' }}>{d.title}</div><div className="do-text">{d.text}</div></div>
                </div>
              ))}

              <div className="principle-card" style={{ marginTop: 6 }}>
                <div className="section-label" style={{ color: '#6b4d16' }}>Daily pre-session checklist</div>
                {['Set a timer — use a neutral, calm sound.', 'Posture: upright but not rigid. "Dignified but relaxed."', 'Eyes: closed, or softly focused on the floor 3 feet ahead.', 'Every time distracted → smile inwardly → return to anchor.'].map((item, i) => (
                  <div key={i} className="checklist-item"><div className="check-num">{i + 1}</div>{item}</div>
                ))}
              </div>

              <div className="principle-card" style={{ marginTop: 6 }}>
                <div className="section-label" style={{ color: '#6b4d16' }}>What this is, and what it isn't</div>
                <div className="principle-text">
                  This programme is <b>inspired by MBSR</b> (Mindfulness-Based Stress Reduction), not a copy of it.
                  The real course is taught: eight weekly classes with a certified teacher, group discussion, and a
                  day-long silent retreat — and that taught format is what the research was done on. If you want the
                  original, free online versions of the full curriculum are offered by several universities.
                </div>
              </div>
              {/* ⚠ Meditation is not inert, and an 8-week programme at 20–30
                  minutes a day is a real dose. Distressing memories, feeling
                  detached, or increased anxiety are documented and rise with
                  practice time. One sentence here is the difference between a
                  person pausing and a person concluding they are broken. */}
              <div className="principle-card">
                <div className="section-label" style={{ color: '#6b4d16' }}>If practice starts to feel bad</div>
                <div className="principle-text">
                  Sitting quietly with your attention can bring up difficult memories or feelings, or a sense of being
                  detached from yourself. That is a known effect of meditation, not a sign you are doing it wrong or that
                  something is wrong with you. Stop, open your eyes, move around — and if it keeps happening, talk to
                  someone before continuing.
                </div>
              </div>
              <div className="disclaimer">This is a self-guided practice for calm and focus — not medical treatment.</div>
              {/* The tracker root already carries `rx-wb`, which is what scopes
                  the --rx-* tokens SafetyNote styles itself with. */}
              <SafetyNote isAr={false} />
            </>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">Set start date</div>
              <div className="modal-sub">Choose the day you start Week 1. We'll map all 56 days from there.</div>
              <input type="date" className="date-input" value={pickedDate} onChange={(e) => setPickedDate(e.target.value)} />
              <div className="modal-btns">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="confirm-btn" onClick={confirmStart}>Confirm start</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/*
 * ⚠ THESE SIX CONSTANTS WERE FROZEN HEX, NOT TOKENS — the exact half-migrated
 * pattern `PracticeShell.jsx` already fixed once (see its own comment on
 * INK/SUB/FAINT/LINE/CARD/GOLD there). Every rule below that interpolates one
 * of these emitted a literal no theme could reach, which is why a SECOND,
 * hand-written `[data-home-theme='dark']` block used to follow — ~90 of this
 * file's baselined raw colours, all restating what `--rx-*` already flips on
 * its own. Pointing these six names at the shared tokens deletes that whole
 * block outright rather than maintaining two palettes that can disagree.
 * `GOLD_TEXT` becomes `--rx-meaning-ink` — the text-safe variant of the same
 * gold `GOLD` (`--rx-meaning-core`) already names.
 */
/* ⚠ Fallback stacks matter here too: DailyHabits.jsx (rendered by this same
   screen) roots at plain .rx-root, never .rx-wb, so var(--rx-display) has
   nothing to resolve to there and would silently lose the serif. */
const SERIF = "var(--rx-display, 'Cormorant Garamond', Georgia, serif)";
const SANS = "var(--rx-sans, 'Outfit', 'Cairo', system-ui, sans-serif)";
const INK = 'var(--rx-ink)'; const SUB = 'var(--rx-sub)'; const FAINT = 'var(--rx-faint)'; const LINE = 'var(--rx-hair)'; const CARD = 'var(--rx-card)'; const GOLD = 'var(--rx-meaning-core)'; const GOLD_TEXT = 'var(--rx-meaning-ink)';
const CSS = `
.rx-root { position:fixed; inset:0; z-index:50; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--rx-ground); color:${INK}; font-family:${SANS}; }
.rx-root *, .rx-root *::before, .rx-root *::after { box-sizing:border-box; }
.rx-app { max-width:480px; margin:0 auto; padding-bottom:80px; position:relative; }
.rx-back { position:absolute; top:14px; left:12px; z-index:20; width:36px; height:36px; border-radius:10px; border:1px solid ${LINE}; background:${CARD}; color:${INK}; font-size:22px; line-height:1; cursor:pointer; box-shadow:var(--elev-rest); }
.rx-root .header { padding:24px 20px 16px; background:linear-gradient(180deg, color-mix(in srgb, var(--rx-ground) 88%, white) 0%, var(--rx-ground) 100%); }
.rx-root .header-row { display:flex; justify-content:space-between; align-items:flex-start; padding-left:42px; }
.rx-root .header-sub { font-size:11px; letter-spacing:3px; color:${GOLD_TEXT}; text-transform:uppercase; margin-bottom:4px; font-weight:700; }
.rx-root .header-title { font-family:${SERIF}; font-size:32px; font-weight:600; line-height:1.04; color:${INK}; }
.rx-root .header-title em { font-style:italic; color:${GOLD_TEXT}; }
.rx-root .header-stats { text-align:right; }
.rx-root .stat-num { font-size:28px; font-weight:700; line-height:1; }
.rx-root .stat-label { font-size:10px; color:${SUB}; letter-spacing:1px; }
.rx-root .phase-bar-row { display:flex; gap:4px; margin-top:16px; }
.rx-root .phase-bar { height:5px; border-radius:3px; transition:opacity .3s; }
.rx-root .phase-info { margin-top:8px; font-size:12px; color:${SUB}; }
.rx-root .tabs { display:flex; border-bottom:1px solid ${LINE}; background:color-mix(in srgb, var(--rx-ground) 88%, white); position:sticky; top:0; z-index:10; }
.rx-root .tab-btn { flex:1; padding:13px 0; background:none; border:none; border-bottom:3px solid transparent; color:${SUB}; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:color .2s; margin-bottom:-2px; }
.rx-root .tab-btn.active { color:${GOLD_TEXT}; border-bottom-color:${GOLD}; }
.rx-root .content { padding:20px; }
.rx-root .section-label { font-size:11px; color:${SUB}; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; font-weight:700; }
.rx-root .serif { font-family:${SERIF}; font-weight:600; }
.rx-root .technique-card { border-radius:18px; padding:20px; margin-bottom:20px; box-shadow:var(--elev-rest); }
.rx-root .technique-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
.rx-root .technique-name { font-family:${SERIF}; font-weight:600; font-size:27px; color:${INK}; }
.rx-root .technique-duration { font-size:12px; color:${SUB}; margin-top:2px; }
.rx-root .technique-emoji { font-size:42px; }
.rx-root .timer-wrap { display:flex; flex-direction:column; align-items:center; margin-bottom:16px; }
.rx-root .timer-svg { transform:rotate(-90deg); }
.rx-root .timer-center { position:relative; margin-top:-92px; margin-bottom:68px; text-align:center; }
.rx-root .timer-display { font-size:28px; font-weight:700; color:${INK}; font-variant-numeric:tabular-nums; }
.rx-root .timer-target { font-size:11px; color:${FAINT}; }
.rx-root .timer-btns { display:flex; gap:10px; margin-top:4px; }
.rx-root .min-btn { padding:6px 13px; border-radius:9px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
.rx-root .min-btn.active-min { border-color:var(--phase-color); background:color-mix(in srgb, var(--phase-color) 14%, white); color:var(--phase-color); }
.rx-root .action-btns { display:flex; gap:10px; margin-top:12px; }
.rx-root .begin-btn { padding:12px 28px; border-radius:12px; border:none; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:box-shadow .15s; box-shadow:var(--elev-rest); }
.rx-root .begin-btn:active { box-shadow:var(--elev-press); }
.rx-root .reset-btn { padding:12px 16px; border-radius:12px; background:var(--rx-card-soft); color:${SUB}; border:none; font-size:14px; cursor:pointer; font-family:inherit; }
.rx-root .done-btn { width:100%; padding:13px; border-radius:12px; border:1px solid ${LINE}; background:var(--rx-card-soft); color:${SUB}; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:box-shadow .2s; }
.rx-root .step-list { margin-bottom:20px; }
.rx-root .step-item { display:flex; gap:12px; margin-bottom:12px; }
.rx-root .step-num { min-width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; border:2px solid; flex-shrink:0; }
.rx-root .step-text { font-size:var(--rx-fs-body); color:${INK}; line-height:1.6; }
.rx-root .insight-box { border-radius:10px; padding:12px 14px; margin-top:10px; border-left:4px solid; }
.rx-root .insight-label { font-size:var(--rx-fs-label); letter-spacing:1px; margin-bottom:4px; font-weight:700; }
.rx-root .insight-text { font-size:13px; color:${SUB}; line-height:1.6; }
.rx-root .note-area { width:100%; background:${CARD}; border:1px solid ${LINE}; border-radius:12px; padding:12px 14px; color:${INK}; font-size:var(--rx-fs-body); line-height:1.6; min-height:90px; resize:vertical; font-family:inherit; outline:none; }
.rx-root .save-btn { margin-top:8px; padding:10px 20px; border-radius:10px; background:var(--rx-card-soft); border:none; color:var(--rx-meaning-ink); font-size:13px; font-weight:600; cursor:pointer; font-family:inherit; }
.rx-root .saved-txt { margin-left:10px; font-size:12px; color:var(--rx-success-ink, var(--rx-calm-ink)); font-weight:600; }
.rx-root .week-row { margin-bottom:14px; }
.rx-root .week-label-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.rx-root .week-label { font-size:11px; font-weight:700; min-width:52px; }
.rx-root .week-technique { font-size:11px; color:${FAINT}; }
.rx-root .day-grid { display:flex; gap:6px; }
.rx-root .day-btn { flex:1; aspect-ratio:1; border-radius:9px; border:2px solid ${LINE}; background:${CARD}; color:${FAINT}; font-size:13px; font-weight:700; cursor:pointer; position:relative; display:flex; align-items:center; justify-content:center; font-family:inherit; transition:all .15s; }
.rx-root .day-btn.future-day { background:var(--rx-card-soft); color:${FAINT}; cursor:default; }
.rx-root .day-dot { position:absolute; top:4px; right:4px; width:5px; height:5px; border-radius:50%; }
.rx-root .legend-box { margin-top:16px; padding:14px; background:${CARD}; border-radius:12px; border:2px solid ${LINE}; font-size:13px; color:${SUB}; }
.rx-root .ghost-pill { font-size:11px; color:${SUB}; background:${CARD}; border:2px solid ${LINE}; border-radius:9px; padding:6px 12px; cursor:pointer; font-family:inherit; font-weight:700; }
.rx-root .principle-card { background:${CARD}; border:2px solid ${LINE}; border-radius:16px; padding:16px; margin-bottom:20px; }
.rx-root .principle-item { display:flex; gap:12px; margin-bottom:12px; }
.rx-root .principle-icon { font-size:20px; }
.rx-root .principle-title { font-size:13.5px; font-weight:700; color:${INK}; margin-bottom:2px; }
.rx-root .principle-text { font-size:13px; color:${SUB}; line-height:1.55; }
.rx-root .phase-guide-card { border-radius:16px; padding:16px; margin-bottom:14px; border:2px solid; }
.rx-root .phase-guide-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.rx-root .phase-guide-sub { font-size:11px; letter-spacing:2px; text-transform:uppercase; font-weight:700; }
.rx-root .phase-guide-name { font-family:${SERIF}; font-weight:600; font-size:23px; color:${INK}; margin-top:2px; }
.rx-root .phase-guide-dur { font-size:12px; color:${FAINT}; margin-bottom:10px; }
.rx-root .phase-step { font-size:13px; color:${SUB}; line-height:1.6; padding-left:16px; position:relative; margin-bottom:6px; }
.rx-root .phase-step::before { content:'▸'; position:absolute; left:0; font-size:11px; color:${GOLD_TEXT}; }
.rx-root .phase-tip { margin-top:10px; padding:10px 12px; background:var(--rx-card-soft); border-radius:9px; font-size:12px; color:${SUB}; border-left:4px solid; }
.rx-root .dos-head { font-size:13px; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; font-weight:700; }
.rx-root .do-card { display:flex; gap:12px; margin-bottom:14px; border-radius:12px; padding:14px; border:2px solid; }
.rx-root .do-icon { font-size:22px; }
.rx-root .do-title { font-size:13.5px; font-weight:600; margin-bottom:3px; }
.rx-root .do-text { font-size:13px; color:${SUB}; line-height:1.5; }
.rx-root .checklist-item { display:flex; gap:10px; margin-bottom:10px; font-size:13px; color:${SUB}; line-height:1.5; }
.rx-root .check-num { min-width:22px; height:22px; border:2px solid ${LINE}; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; color:${GOLD_TEXT}; flex-shrink:0; font-weight:700; }
.rx-root .disclaimer { margin-top:18px; font-size:11.5px; color:${FAINT}; line-height:1.5; text-align:center; padding:0 8px; }
.rx-root .modal-overlay { position:fixed; inset:0; background:var(--fx-scrim); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.rx-root .modal { background:${CARD}; border:1px solid color-mix(in srgb, var(--rx-ink) 65%, transparent); border-radius:18px; padding:26px; width:100%; max-width:340px; box-shadow:var(--elev-raise); }
.rx-root .modal-title { font-family:${SERIF}; font-weight:600; font-size:var(--rx-fs-title); color:${INK}; margin-bottom:8px; }
.rx-root .modal-sub { font-size:13px; color:${SUB}; margin-bottom:20px; line-height:1.6; }
.rx-root .date-input { width:100%; background:${CARD}; border:1px solid ${LINE}; border-radius:10px; padding:12px 14px; color:${INK}; font-size:15px; font-family:inherit; margin-bottom:16px; outline:none; }
.rx-root .modal-btns { display:flex; gap:10px; }
.rx-root .cancel-btn { flex:1; padding:12px; border-radius:10px; background:var(--rx-card-soft); border:none; color:${SUB}; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
.rx-root .confirm-btn { flex:2; padding:12px; border-radius:10px; background:linear-gradient(180deg, ${GOLD}, color-mix(in srgb, ${GOLD} 78%, black)); border:none; color:#fff; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
.rx-root .empty-state { text-align:center; padding:44px 0; }
.rx-root .empty-art { width:112px; height:112px; display:block; object-fit:cover; border-radius:50%; margin:0 auto 18px; border:1px solid color-mix(in srgb, var(--rx-calm-lit) 54%, transparent); box-shadow:var(--elev-raise); }
.rx-root .empty-emoji { font-size:48px; margin-bottom:16px; }
.rx-root .empty-title { font-family:${SERIF}; font-weight:600; font-size:var(--rx-fs-title); color:${INK}; margin-bottom:8px; }
.rx-root .empty-sub { color:${SUB}; font-size:14px; margin-bottom:24px; line-height:1.6; max-width:320px; margin-left:auto; margin-right:auto; }
.rx-root .start-btn { background:linear-gradient(180deg, ${GOLD}, color-mix(in srgb, ${GOLD} 78%, black)); color:#fff; border:none; border-radius:12px; padding:14px 32px; font-size:15px; font-weight:600; cursor:pointer; font-family:inherit; box-shadow:var(--elev-raise); }
.rx-root .go-btn { background:var(--rx-card-soft); color:var(--rx-meaning-ink); border:none; border-radius:10px; padding:12px 24px; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; }
.rx-root .rx-heading-ink { color:${INK}; }
.rx-root .begin-btn--paused { background:var(--rx-card-soft); color:${SUB}; }
/* ⚠ THERE IS NO [data-home-theme='dark'] BLOCK ANY MORE, AND ITS ABSENCE IS
   THE POINT — see the comment above the six constants at the top of this
   stylesheet. ~50 lines of hand-written dark overrides used to sit here,
   restating in hex what --rx-* to --universe-* already flips on its own.
   NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
`;

/* ── Wellbeing landing — practices grouped into categories ── */
// Practice registry moved to ./practices.js so NeuralPanel (on Home) can name
// a practice without importing this whole screen.

// Five wellbeing categories. `items` lists practice ids; `soon` marks a category
// whose practices are still to come (with a teaser of what's planned).
const CATEGORIES = [
  { id: 'calm', icon: '🌿', color: '#5aa07a',
    title: 'Stress & Calm', titleAr: 'التوتر والهدوء',
    tag: 'Settle your body and mind in the moment.', tagAr: 'هدّئ جسدك وعقلك في اللحظة.',
    items: ['breathe', 'grounding', 'ws-thought-record', 'ws-worry-window', 'mbsr', 'who5'] },
  { id: 'sleep', icon: '🌙', color: '#7b86c8',
    title: 'Sleep', titleAr: 'النوم',
    tag: 'Wind down and drift off.', tagAr: 'استرخِ واغفُ بسلام.',
    items: ['sleep-reset', 'pmr', 'breathe', 'sleep-sounds'] },
  { id: 'meaning', icon: '✨', color: '#c9a24b',
    title: 'Meaning', titleAr: 'المعنى',
    tag: 'Values, gratitude and purpose.', tagAr: 'القيم والامتنان والغاية.',
    items: ['ws-values-compass', 'ws-activation', 'ikigai'],
    programSoon: 'A guided values journal and gratitude program are coming soon.',
    programSoonAr: 'دفتر قيم موجّه وبرنامج امتنان — قريباً.' },
  { id: 'relationships', icon: '❤️', color: '#c86f8f',
    title: 'Relationships', titleAr: 'العلاقات',
    tag: 'Kindness and connection.', tagAr: 'اللطف والتواصل.',
    items: ['connect', 'ws-repair', 'relationship-quiz'],
    programSoon: 'A loving-kindness meditation program is coming soon.',
    programSoonAr: 'برنامج تأمّل المحبّة اللطيفة — قريباً.' },
  { id: 'personality', icon: '🧭', color: '#c47a3e',
    title: 'Personality', titleAr: 'الشخصية',
    tag: 'Get to know yourself.', tagAr: 'تعرّف على نفسك.',
    items: ['ws-self-compassion', 'personality-quiz', 'who5'],
    programSoon: 'A deeper, guided Big Five program is coming soon.',
    programSoonAr: 'برنامج موجّه أعمق للعوامل الخمسة الكبرى — قريباً.' },
];

// Which practices are structured, multi-session PROGRAMS (vs quick, single-use).
/* ⚠ `sleep-reset` belongs here, not under Quick: it is a multi-night programme
   whose whole value is the accumulating diary. Filed as a one-off "quick"
   practice it would read as something you do once, which is the one way to use
   it that produces nothing. */
const PROGRAM_IDS = new Set(['mbsr', 'sleep-reset']);

// Loose, hand-placed scatter for the Wellbeing constellation — deliberately
// NOT a hub-and-spoke grid (that's Training's signature) and NOT an orbit
// around a center (that's Home's). Categories here are independent, so
// nothing connects them; each just drifts on its own slow, gentle timer.
//
// ⚠ `fy` IS NOT A PERCENTAGE OF THE SCREEN. It is a fraction of the FIELD —
// the band left over once the title stack, the favourites pill, the bottom
// hint and the tab bar have taken their fixed heights (--rx-top / --rx-bot in
// the stylesheet below). It used to be a percentage of the stage, and the
// stage carried `min-height: max(100dvh, 860px)`: on any phone the landing was
// taller than the screen, so a picker of five planets became something you had
// to scroll to see all of. Anchoring to the field is what makes it one screen
// at any height — the planets keep their spread and their clearances instead of
// being measured against a canvas that no longer matches the viewport.
//
// `size` is the orb at full scale; --rx-k shrinks it on short viewports.
const CAT_LAYOUT = {
  calm:          { x: 24, fy: 0.14, size: 96, dur: 7.4, delay: 0 },
  sleep:         { x: 74, fy: 0.31, size: 78, dur: 8.6, delay: 1.6 },
  meaning:       { x: 45, fy: 0.52, size: 88, dur: 7.9, delay: 3.1 },
  relationships: { x: 78, fy: 0.72, size: 76, dur: 9.2, delay: 0.8 },
  personality:   { x: 22, fy: 0.84, size: 80, dur: 8.1, delay: 2.3 },
};

// ── favourites + custom order (persisted) ──────────────────────────────────
const FAV_KEY = 'rx_favorites';   // array of practice ids (also the favourites order)
const ORDER_KEY = 'rx_order';     // { [listKey]: [ids…] } custom order per list
const rxLoad = (k, fallback) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fallback; } catch { return fallback; } };
const rxSave = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
// Order a base id-list by a saved order: saved ids first (still present), then any new ones.
const applyOrder = (baseIds, saved) => {
  if (!saved || !saved.length) return baseIds;
  const present = new Set(baseIds);
  const ordered = saved.filter((id) => present.has(id));
  const seen = new Set(ordered);
  return [...ordered, ...baseIds.filter((id) => !seen.has(id))];
};

/*
 * ReorderList — press-and-hold to lift a card, drag to move it, release to drop.
 * A quick tap passes straight through to the card's own click. Slots are measured
 * at drag start (fixed), so items of slightly different heights still land right.
 * Touch scrolling is preserved until a hold activates a drag.
 */
function ReorderList({ items, disabled, onCommit, children }) {
  const [drag, setDrag] = useState(null); // { origin, target, dy }
  const wrapRef = useRef(null);
  const slots = useRef([]);
  const holdT = useRef(null);
  const startY = useRef(0);
  const pid = useRef(null);
  const draggedRef = useRef(false); // true from a drag's activation until the next press
  const n = items.length;

  // While dragging, block native scrolling regardless of touch-action.
  useEffect(() => {
    if (!drag) return undefined;
    const prevent = (e) => e.preventDefault();
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [drag]);

  // Where a non-dragged item (at origIdx) sits once the dragged item moves origin→target.
  const displayIndex = (origIdx, origin, target) => {
    if (origIdx === origin) return target;
    if (origin < target) return (origIdx > origin && origIdx <= target) ? origIdx - 1 : origIdx;
    return (origIdx >= target && origIdx < origin) ? origIdx + 1 : origIdx;
  };

  const cancelHold = () => { if (holdT.current) { clearTimeout(holdT.current); holdT.current = null; } };

  const onDown = (e, index) => {
    if (disabled || n < 2) return;
    if (e.button != null && e.button !== 0) return;
    draggedRef.current = false;
    startY.current = e.clientY;
    pid.current = e.pointerId;
    cancelHold();
    holdT.current = setTimeout(() => {
      const els = [...wrapRef.current.querySelectorAll('[data-ri]')];
      slots.current = els.map((el) => { const r = el.getBoundingClientRect(); return { top: r.top, center: r.top + r.height / 2 }; });
      draggedRef.current = true;
      setDrag({ origin: index, target: index, dy: 0 });
      try { els[index].setPointerCapture(pid.current); } catch { /* ignore */ }
    }, 230);
  };
  const onMove = (e) => {
    if (!drag) {
      if (holdT.current && Math.abs(e.clientY - startY.current) > 8) cancelHold(); // finger is scrolling
      return;
    }
    const y = e.clientY;
    let cnt = 0;
    for (const s of slots.current) if (s.center < y) cnt += 1;
    const target = Math.max(0, Math.min(n - 1, cnt));
    setDrag((d) => (d ? { ...d, dy: y - startY.current, target } : d));
  };
  const onUp = () => {
    cancelHold();
    setDrag((d) => {
      if (d) {
        const order = items.map((it) => it.id);
        const [m] = order.splice(d.origin, 1);
        order.splice(d.target, 0, m);
        onCommit(order);
      }
      return null;
    });
    // draggedRef stays true so the click that follows a drop is swallowed; the next press resets it.
  };

  return (
    <div ref={wrapRef} className="rx-rl">
      {items.map((it, i) => {
        const isDragged = drag && drag.origin === i;
        let ty = 0;
        if (drag) ty = isDragged ? drag.dy : (slots.current[displayIndex(i, drag.origin, drag.target)].top - slots.current[i].top);
        return (
          <div
            key={it.id}
            data-ri=""
            className={`rx-rl-item${isDragged ? ' rx-rl-item--drag' : ''}`}
            style={{ transform: isDragged ? `translateY(${ty}px) scale(1.03)` : `translateY(${ty}px)`, transition: isDragged ? 'none' : 'transform .18s ease', zIndex: isDragged ? 6 : 1, position: 'relative', touchAction: 'pan-y' }}
            onPointerDown={(e) => onDown(e, i)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {children(it, () => draggedRef.current)}
          </div>
        );
      })}
    </div>
  );
}

const FAV_GOLD = '#d9a520';

/**
 * The one-line record under a practice's name: how many times, and what it
 * usually does for this person. Renders nothing until the practice has been
 * done at least once, and mentions the average drop only once two rated
 * sessions exist — one session is an anecdote, and stating it as "usually"
 * would be the app inventing a pattern out of a single data point.
 */
function PracticeStatLine({ practiceId, isAr, journeyRuns = 0 }) {
  const s = useMemo(() => (MEASURED_PRACTICES.has(practiceId) ? getPracticeStats(practiceId) : null), [practiceId]);
  const count = Math.max(s?.runs || 0, journeyRuns);
  if (!count) return null;
  const tier = s?.tier || tierFor(count);
  const runs = isAr
    ? `${count} ${count === 1 ? 'جلسة' : 'جلسات'}`
    : `${count} ${count === 1 ? 'session' : 'sessions'}`;
  const usually = s?.ratedRuns >= 2 && s.avgDrop > 0
    ? (isAr ? ` · عادةً ${Math.round(s.avgDrop * 10) / 10}− نقطة` : ` · usually −${Math.round(s.avgDrop * 10) / 10}`)
    : '';
  return <span className="rx-menu-stat">{runs}{usually} · {isAr ? tier.ar : tier.en}</span>;
}

function JourneyOrbit({ cat, isAr, journey, byId, onOpen }) {
  const items = (cat.items || []).map(byId).filter(Boolean);
  const explored = items.filter((item) => (journey.practices[item.id]?.count || 0) > 0).length;
  const progress = items.length ? Math.round((explored / items.length) * 100) : 0;

  if (!items.length) return null;
  return (
    <section className="rx-journey" aria-label={isAr ? 'مدار رحلتك' : 'Your journey orbit'}>
      <div className="rx-journey-head">
        <div>
          <div className="rx-journey-kicker">{isAr ? 'مدارك' : 'Your orbit'}</div>
          <div className="rx-journey-title">{isAr ? 'استكشف الأدوات بطريقتك' : 'Explore at your own pace'}</div>
        </div>
        <span className="rx-journey-count">{explored}/{items.length}</span>
      </div>
      <div className="rx-journey-bar" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
      <p className="rx-journey-note">{isAr ? 'كل زيارة تبقى محفوظة. لا سلاسل ولا ضغط.' : 'Every visit stays with you. No streaks, no pressure.'}</p>
      <div className="rx-journey-track">
        {items.map((item, index) => {
          const done = (journey.practices[item.id]?.count || 0) > 0;
          return (
            <button
              key={item.id}
              type="button"
              className={`rx-journey-step${done ? ' done' : ''}`}
              onClick={() => onOpen(item.id)}
              aria-label={`${isAr ? item.titleAr : item.title}${done ? (isAr ? '، تم استكشافها' : ', explored') : ''}`}
            >
              <span className="rx-journey-node" aria-hidden="true">{done ? <Star size={17} weight="fill" /> : index + 1}</span>
              <span>{isAr ? item.titleAr : item.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/*
 * NeedStrip — "not sure which? tell me what's going on."
 *
 * ⚠ IT LIVES INSIDE THE CATEGORY SCREENS, NOT ON THE LANDING (owner's call,
 * 2026-09-07). The landing is out of scope and its markup stays byte-identical;
 * see the note above `detailHeader`. So the strip is scoped to the area you have
 * already opened, and only renders where that area holds at least two distinct
 * answers — in practice Stress & Calm and Sleep, which is where a person arrives
 * needing a decision made for them rather than a menu to browse.
 *
 * ⚠ THE REASON IS THE PAYLOAD, WHICH IS WHY A CHIP DOES NOT OPEN THE PRACTICE
 * DIRECTLY. Tapping reveals WHY that tool suits that state — grounding rather
 * than breathing for panic, because breath-focus mid-panic can amplify the
 * interoceptive cues the panic is feeding on. A router that silently teleports
 * you teaches nothing and has to be re-consulted every time; one that explains
 * itself is teaching you to choose for yourself, which is the actual goal.
 */
function NeedStrip({ cat, isAr, playSfx, onOpen }) {
  const [openId, setOpenId] = useState(null);

  // Only the states this area can actually answer, one chip per practice.
  const states = useMemo(() => {
    const items = new Set(cat.items || []);
    const seen = new Set();
    return NEED_STATES.filter((n) => {
      if (!items.has(n.practice) || seen.has(n.practice)) return false;
      seen.add(n.practice);
      return true;
    });
  }, [cat]);

  if (states.length < 2) return null;
  const open = states.find((s) => s.id === openId);

  return (
    <div className="rx-need">
      <div className="rx-need-q">{isAr ? 'لست متأكداً أيّها تختار؟ ما الذي يحدث الآن؟' : "Not sure which? What's going on right now?"}</div>
      <div className="rx-need-chips">
        {states.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`rx-need-chip${openId === n.id ? ' on' : ''}`}
            onClick={() => { playSfx?.('click'); setOpenId(openId === n.id ? null : n.id); }}
          >
            <span aria-hidden="true">{n.icon}</span> {isAr ? n.ar : n.en}
          </button>
        ))}
      </div>
      {open && (
        <div className="rx-need-why">
          <p>{isAr ? open.whyAr : open.whyEn}</p>
          <button type="button" className="rx-need-go" onClick={() => onOpen(open.practice)}>
            {isAr ? 'افتحها' : 'Open it'} {isAr ? '←' : '→'}
          </button>
        </div>
      )}
    </div>
  );
}

function RelaxMenu({ isAr, onOpen, playSfx, initialCategory = null, initialGroup = 'program' }) {
  const { appTheme, toggleLang } = useApp();
  const dark = appTheme !== 'light';
  const [openCat, setOpenCat] = useState(initialCategory); // category id, or 'favorites'
  const [group, setGroup] = useState(initialGroup); // 'program' | 'quick'
  const [favs, setFavs] = useState(() => rxLoad(FAV_KEY, []));
  const [orders, setOrders] = useState(() => rxLoad(ORDER_KEY, {}));
  const journey = loadWellbeingJourney();
  const favSet = useMemo(() => new Set(favs), [favs]);
  const byId = (id) => RELAX_PRACTICES.find((p) => p.id === id);
  const cat = openCat && openCat !== 'favorites' ? CATEGORIES.find((c) => c.id === openCat) : null;

  /* Recording, not displaying. The panel on Home owns the toggle and the
   * suggestion; this only reports the example. Read live rather than held in
   * state — there is no UI here to keep in sync, and the flag can be flipped
   * from Home while this screen is mounted but hidden. */
  const openPersonalizedPractice = (id) => {
    if (personalizationEnabled()) recordWellbeingSelection(id, getWellbeingContext());
    onOpen(id, cat?.id || null, PROGRAM_IDS.has(id) ? 'program' : 'quick');
  };

  const toggleFav = (id) => {
    playSfx?.('click');
    setFavs((f) => { const nx = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; rxSave(FAV_KEY, nx); return nx; });
  };
  const commitOrder = (key, ids) => {
    playSfx?.('click');
    if (key === 'favorites') { setFavs(ids); rxSave(FAV_KEY, ids); return; }
    setOrders((o) => { const nx = { ...o, [key]: ids }; rxSave(ORDER_KEY, nx); return nx; });
  };

  // Opening a category lands on QUICK when it has any, else Programs.
  const openCategory = (c) => {
    if (c.items) setGroup(c.items.some((id) => !PROGRAM_IDS.has(id)) ? 'quick' : 'program');
    setOpenCat(c.id);
  };

  // A practice card: tap opens it, tap the star to (un)favourite. `justDragged`
  // (from ReorderList) swallows the click that lands right after a drag-drop.
  const renderCard = (o, justDragged) => {
    const faved = favSet.has(o.id);
    const journeyRuns = journey.practices[o.id]?.count || 0;
    return (
      <div
        /* ⚠ A practice without its own `color` inherits the AREA's hue token
           rather than carrying a fresh hex. The older entries still hold literal
           colours (that is what the design ratchet's baseline counts); new ones
           must not add more, and they do not need to — every one of these cards
           is already rendered inside a category screen that sets --rx-hue. A hex
           cannot be swapped for a var here directly, because these were alpha
           suffixes (`${'${color}'}55`) and `var(--x)55` is not a colour; hence
           color-mix. */
        className="rx-menu-card"
        style={{ borderColor: o.color ? `${o.color}55` : 'color-mix(in srgb, var(--rx-hue) 42%, transparent)' }}
      >
        <button
          type="button"
          className="rx-menu-open"
          onClick={() => { if (justDragged && justDragged()) return; openPersonalizedPractice(o.id); }}
        >
          {/* ⚠ THE PILLAR PHOTO DOES NOT BELONG HERE (it stays on the category
              header orb and the practice hero) — every card in a pillar was
              rendering the IDENTICAL thumbnail (six cards in Stress & Calm all
              showed the same calm.webp), so the practice's own distinguishing
              emoji (🫁 🖐️ 💪 …) never appeared anywhere once this was wired.
              Six cards read as six different tools again, all still tinted
              their pillar's hue via .rx-menu-ic's own CSS. */}
          <span className="rx-menu-ic" aria-hidden="true">{o.icon}</span>
          <span className="rx-menu-body">
            <span className="rx-menu-title">{isAr ? o.titleAr : o.title}</span>
            <span className="rx-menu-sub">{isAr ? o.subAr : o.sub}</span>
          {/* ⚠ Shown only once there is something true to say. An empty
              "0 sessions · no data" on every card would turn a menu of
              invitations into a list of things you have failed to do — which is
              precisely the pressure this feature is supposed to be free of. */}
            <PracticeStatLine practiceId={o.id} isAr={isAr} journeyRuns={journeyRuns} />
          {/* ⚠ THE SAME BADGE EVERY PRACTICE CARRIES, NOT JUST WORKSHEETS
              (2026-09-10). Worksheets already printed their evidence tier
              inside worksheetEngine.jsx; a quiz or a breathing pacer said
              nothing about its own evidence basis until you opened it (some
              never said anything at all). `o.tier` is required on every
              RELAX_PRACTICES entry now (see practices.js) so this can never
              silently render nothing for a real practice — it renders
              nothing only for entries with no tier assigned, which audit
              should treat as a bug, not a feature. */}
            {o.tier && TIERS[o.tier] && (
              <span className="rx-menu-tier">{isAr ? TIERS[o.tier].ar : TIERS[o.tier].en}</span>
            )}
          </span>
          <span className="rx-menu-chev" aria-hidden="true">{isAr ? '‹' : '›'}</span>
        </button>
        <button
          type="button"
          className={`rx-fav${faved ? ' on' : ''}`}
          aria-label={faved ? (isAr ? 'إزالة من المفضّلة' : 'Remove favourite') : (isAr ? 'إضافة إلى المفضّلة' : 'Add favourite')}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => toggleFav(o.id)}
        >
          <Star size={20} weight={faved ? 'fill' : 'regular'} aria-hidden="true" />
        </button>
      </div>
    );
  };
  const list = (items, key) => (
    <ReorderList items={items} onCommit={(ids) => commitOrder(key, ids)}>
      {(o, jd) => renderCard(o, jd)}
    </ReorderList>
  );
  const soonState = (emoji, bg, title, desc) => (
    <div className="rx-soon-empty">
      <div className="rx-soon-emoji" style={{ background: bg }}>{emoji}</div>
      <div className="rx-soon-title">{title}</div>
      <div className="rx-soon-desc">{desc}</div>
    </div>
  );
  /*
   * `areaId` names one of the five areas, and when it is given the header wears
   * that area's shaded body (`.rx-body`, wellbeing.css) at 40px.
   *
   * ⚠ It used to be the category's emoji on a `${color}22` chip. 13% alpha of an
   * already-muted hue is a grey square, so the screen you arrived at after
   * tapping a coloured planet opened with a colourless box, and nothing carried
   * the area's identity across the transition.
   *
   * ⚠ THE LANDING ITSELF IS DELIBERATELY UNTOUCHED (2026-09-06, owner's call:
   * "you only have to work inside the planets"). The constellation keeps its
   * original orbs — `.rx-orb` + `.rx-orb-shade`/`-sheen`, tinted inline from
   * `c.color`. So this header is NOT a repeat of what the landing draws, and
   * must not be described as one. `.rx-body` lives inside the planets only:
   * this header and `PracticeHero`.
   */
  const detailHeader = (icon, color, title, tag, onBack, areaId) => (
    <div className="header">
      <button className="rx-back" onClick={onBack} aria-label="Back">‹</button>
      <div style={{ paddingInlineStart: 42 }}>
        <div className="header-sub">{isAr ? 'العافية' : 'Wellbeing'}</div>
        <div className="rx-cat-hd">
          {/* ⚠ THE LANDING'S ORB IS THE OFFICIAL PLANET, AND THIS RENDERS THE
              SAME ONE (owner, 2026-09-07). It used to draw `.rx-body` — the
              shaded sphere tinted from the area's core/lit pair — while the
              constellation drew `.rx-orb`, a disc carrying a radial tint of the
              category's own colour behind the artwork. Same source image, two
              different housings, so tapping Meaning took you to a planet that
              was visibly not the one you had just tapped.

              The classes below are the landing's, unchanged, and `.rx-orb*` is
              already defined in MENU_CSS which this screen renders — so this is
              the same rule set, not a copy that can drift. `--rx-orb` is the
              diameter the wrap reads. */}
          {/* ⚠ `.rx-orb-wrap` ALONE, not also `.rx-cat-planet` — that rule sets
              `display:block` and sits later in MENU_CSS, so it would beat the
              wrap's flex centring and leave the artwork off-centre in its disc.
              (A JSX comment cannot live between `? (` and the element — that is
              a parse error, and it took the whole app down once.) */}
          {areaId ? (
            <span className="rx-cat-planet" aria-hidden="true">
              {/* ⚠ THE ORB'S GEOMETRY IS INLINE HERE ON PURPOSE. `.rx-orb`'s
                  rules live in the LANDING's own <style> block, which only that
                  screen renders — so on a category screen the class matches
                  nothing and the element computed `width:auto`, rendering 32x20
                  inside its 40px box. Measured, not guessed. The tint, artwork
                  and contour below are the landing's values, so the two read as
                  the same planet. */}
              {/* ⚠ WAS `background: color` — the CATEGORIES[].color literal
                  (or FAV_GOLD), NOT the --rx-hue token the ring/glow rules
                  around this orb already read. --rx-hue is set on this
                  screen's own root (see the category-detail return below,
                  and the Favorites root two call sites up) for exactly this
                  reason: one hue, everywhere on the screen it belongs to. */}
              <span
                className="rx-orb rx-cat-orb"
                style={{ background: 'var(--rx-hue)' }}
              >
                {wellbeingPillarArtUrl(areaId) ? (
                  <img src={wellbeingPillarArtUrl(areaId)} alt="" draggable={false} />
                ) : (
                  <>
                    <span aria-hidden="true" className="rx-orb-texture" style={planetTextureLayerStyle(0.4)} />
                    <span aria-hidden="true" className="rx-orb-shade" />
                    <span aria-hidden="true" className="rx-orb-sheen" />
                    <span className="rx-orb-icon">{icon}</span>
                  </>
                )}
              </span>
            </span>
          ) : (
            <span className="rx-cat-ic rx-cat-ic--hd" style={{ background: `${color}22`, color }}>{icon}</span>
          )}
          <span className="header-title serif">{title}</span>
        </div>
        <div className="menu-tag">{tag}</div>
      </div>
    </div>
  );

  // ── favourites ──
  if (openCat === 'favorites') {
    const favItems = favs.map(byId).filter(Boolean);
    return (
      /* ⚠ Wearing the meaning pillar's amber (FAV_GOLD is that same family) —
         without an explicit hue here, this screen was falling back to
         .rx-wb's DEFAULT --rx-hue (jade), and `detailHeader`'s orb went grey
         entirely on its OWN raw-colour fallback. See the note there. */
      <div
        className="rx-wb rx-root"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{ '--rx-hue': 'var(--rx-meaning-core)', '--rx-hue-lit': 'var(--rx-meaning-lit)', '--rx-hue-ink': 'var(--rx-meaning-ink)' }}
      >
        <style>{MENU_CSS}</style>
        <UniverseStage accent="wellbeing" dark={dark} homeDusk />
        <div className="rx-app">
          {detailHeader('⭐', FAV_GOLD, isAr ? 'المفضّلة' : 'Favorites', favItems.length ? (isAr ? 'اضغط مطوّلاً لإعادة الترتيب.' : 'Press and hold to reorder.') : (isAr ? 'ممارساتك المفضّلة.' : 'Your go-to practices.'), () => setOpenCat(null), 'meaning')}
          <div className="content">
            {favItems.length
              ? list(favItems, 'favorites')
              : soonState('⭐', 'color-mix(in srgb, var(--rx-hue) 14%, transparent)', isAr ? 'لا مفضّلة بعد' : 'No favorites yet', isAr ? 'اضغط على النجمة ☆ في أي ممارسة لإضافتها هنا.' : 'Tap the ☆ star on any practice to add it here.')}
          </div>
        </div>
      </div>
    );
  }

  // ── category detail: Programs / Quick toggle over its practices ──
  if (cat) {
    const programs = cat.items ? cat.items.filter((id) => PROGRAM_IDS.has(id)) : [];
    const quick = cat.items ? cat.items.filter((id) => !PROGRAM_IDS.has(id)) : [];
    const listKey = `${cat.id}:${group}`;
    const activeItems = applyOrder(group === 'program' ? programs : quick, orders[listKey]).map(byId).filter(Boolean);
    const emptyDesc = group === 'program'
      ? (isAr ? (cat.programSoonAr || 'برنامج موجّه لهذا المجال — قريباً.') : (cat.programSoon || 'A guided program for this area is coming soon.'))
      : (isAr ? (cat.quickSoonAr || 'ممارسات سريعة — قريباً.') : (cat.quickSoon || 'Quick practices are coming soon.'));
    /* ⚠ The area's hue is set on the ROOT, not on the header, so the planet
       mark, the segmented control, the cards and every hover state on this
       screen all read the same pair. That is what makes a category screen feel
       like the inside of its planet rather than a generic list. */
    return (
      <div
        className="rx-wb rx-root"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          '--rx-hue': `var(--rx-${cat.id}-core)`,
          '--rx-hue-lit': `var(--rx-${cat.id}-lit)`,
          '--rx-hue-ink': `var(--rx-${cat.id}-ink)`,
        }}
      >
        <style>{MENU_CSS}</style>
        <UniverseStage accent="wellbeing" dark={dark} homeDusk />
        <div className="rx-app">
          {detailHeader(cat.icon, cat.color, isAr ? cat.titleAr : cat.title, isAr ? cat.tagAr : cat.tag, () => setOpenCat(null), cat.id)}
          <div className="content">
            {cat.items ? (
              <>
                <JourneyOrbit
                  cat={cat}
                  isAr={isAr}
                  journey={journey}
                  byId={byId}
                  onOpen={openPersonalizedPractice}
                />
                <NeedStrip
                  cat={cat}
                  isAr={isAr}
                  playSfx={playSfx}
                  onOpen={openPersonalizedPractice}
                />
                {/* ⚠ QUICK COMES FIRST, AND IS THE DEFAULT (owner, 2026-09-07).
                    Programs led, so opening Stress & Calm showed one card — the
                    8-week programme — while Breathe, Grounding and the check-in
                    sat behind a tab nobody had a reason to press. That is the
                    wrong way round for the person this area is for: someone
                    opening Wellbeing while wound up wants the two-minute thing,
                    not an eight-week commitment. The long programmes are still
                    one tap away for the person who has decided to commit. */}
                <div className="rx-seg">
                  <button className={`rx-seg-btn${group === 'quick' ? ' on' : ''}`} onClick={() => setGroup('quick')}>{isAr ? 'سريعة' : 'Quick'}</button>
                  <button className={`rx-seg-btn${group === 'program' ? ' on' : ''}`} onClick={() => setGroup('program')}>{isAr ? 'برامج' : 'Programs'}</button>
                </div>
                {activeItems.length
                  ? list(activeItems, listKey)
                  : soonState(group === 'program' ? '🗺️' : '⚡', 'color-mix(in srgb, var(--rx-hue) 12%, transparent)', isAr ? 'قريباً' : 'Coming soon', emptyDesc)}
              </>
            ) : soonState(cat.icon, 'color-mix(in srgb, var(--rx-hue) 12%, transparent)', isAr ? 'قريباً' : 'Coming soon', isAr ? cat.soonAr : cat.soon)}
            {/* ⚠ The crisis route sits on every category screen, which is the
                furthest out it can go while the landing stays out of scope
                (owner, 2026-09-06). Every practice in this feature is reached
                through one of these five screens, so no path into Wellbeing is
                left without it. */}
            <SafetyNote isAr={isAr} />
          </div>
        </div>
      </div>
    );
  }

  // ── top level: the whole screen IS the sky — header, favorites and the
  // planets all float directly on it as overlays (same architecture as
  // Home's "Your Universe"), instead of the sky being boxed into a card
  // sitting inside the app's normal light chrome. ──
  // Same palette family as Training's actual sky photo — sampled off-center
  // (x=8%/92%) from bg-home-{light,dark}-desktop.webp specifically to avoid
  // the illustrated door's own glow, which is a foreground light source, not
  // the ambient sky color (a center sample picks up its bright spike and
  // reads far more saturated than the sky actually is). True ambient sky:
  // light = muted blue-grey → soft cream → muted warm taupe; dark = nearly
  // uniform near-black with only a whisper of warm variation. Wellbeing
  // stays visually distinct via composition (no photo, floating planets,
  // gentle motes), not via a different/clashing color palette.
  /*
   * These three were pinned warm-white, from when this landing only ever had a
   * night sky under it. Beige is the default ground now, so every one of them
   * was near-invisible cream-on-cream — the title, the six planet names, the
   * "Choose an area." line and the bottom hint.
   *
   * Deliberately NOT flipped to black: that just moves the bug to the other
   * theme. They follow --universe-ink / --universe-muted, the tokens Home's
   * heading also reads, so one appearance switch drives both screens and
   * neither can drift from the other again. (Home's "Your universe" TITLE was
   * removed on 2026-08-15; its heading and these tokens are unchanged.)
   *
   * The shadow has to go with them. It is a hard black drop plus an amber glow
   * — legibility scaffolding for light text on a dark sky. Left on dark ink
   * over beige it reads as a smudge, not a glow. Home solves the same problem
   * the same way (`html[data-home-theme='light'] .home-universe-title
   * { text-shadow: none }`).
   */
  const skyText = dark ? '#fff4df' : 'var(--universe-ink)';
  const skyTextShadow = dark
    ? '0 1px 4px rgba(0,0,0,0.8), 0 0 18px rgba(240,182,106,0.2)'
    : 'none';
  const skyMuted = dark ? 'rgba(255,239,216,0.72)' : 'var(--universe-muted)';

  /*
   * Light appearance: every planet gets a drawn contour.
   *
   * On the dark sky the planets are separated by their own glow. On the pale
   * one that glow has nothing to sit against, and the art dissolves into the
   * background — pale herb on pale sky. The fix is an outline, but it has to
   * follow the ARTWORK, not the orb: these icons are herbs, comets and hearts,
   * so a ring drawn on the circle would float around a shape it does not
   * touch. Four 1-pixel drop-shadows trace the actual alpha silhouette (the
   * sticker outline trick) — four passes and no extra DOM. The plain colour
   * discs, which really are circles, take a crisp ring instead.
   */
  /*
   * ⚠ THIS WAS DESCRIBED BUT NEVER IMPLEMENTED. The comment above promised four
   * 1-pixel drop-shadows; the constant underneath it was a single soft one,
   * applied in BOTH appearances. A soft shadow does nothing for contour, so on
   * the pale sky the artwork dissolved exactly as the comment said it would —
   * pale herb on pale sky, with the note explaining the fix sitting directly
   * above the line that did not do it.
   *
   * On the dark sky the glow still does the separating, so the soft shadow is
   * right there and the outline would read as a sticker for no reason.
   */
  const contour = 'var(--universe-ink)';
  const orbArtFilter = dark
    ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.42))'
    : `drop-shadow(1px 0 0 ${contour}) drop-shadow(-1px 0 0 ${contour})`
      + ` drop-shadow(0 1px 0 ${contour}) drop-shadow(0 -1px 0 ${contour})`
      + ' drop-shadow(0 4px 8px rgba(32,29,24,0.28))';

  return (
    <div
      /* ⚠ No `rx-wb` here, unlike the category and favourites roots below. The
         LANDING is deliberately left exactly as it was (owner, 2026-09-06: the
         Wellbeing work belongs inside the planets, not on the constellation),
         so it reads none of the --rx-* tokens and must not claim to. */
      className="rx-root rx-root--landing"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ background: 'transparent' }}
    >
      <style>{MENU_CSS}</style>
      <div className="rx-landing-stage">
      <UniverseStage accent="wellbeing" dark={dark} homeDusk />

      {/* Landing is a top-level tab (nav bar visible) — no back button, matching
          Learn / Other / Training. A lang toggle sits top-right like the others. */}
      <button
        type="button"
        onClick={() => { playSfx?.('click'); toggleLang(); }}
        aria-label={isAr ? 'English' : 'العربية'}
        className="rx-fade rx-landing-lang"
        style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif" }}
      >
        {isAr ? 'EN' : 'عر'}
      </button>
      <div className="rx-fade rx-landing-head">
        <div style={{
          fontSize: 10.5, letterSpacing: 4, fontWeight: 800, textTransform: 'uppercase',
          color: dark ? 'rgba(255,224,170,0.82)' : 'var(--universe-muted)',
        }}>
          {isAr ? 'ركن العافية' : 'Wellbeing pillar'}
        </div>
        {/*
         * Set by `.home-universe-title` in global.css rather than by a local
         * copy of its numbers. It was named for Home's "Your universe" title,
         * which the two once shared; that title was removed on 2026-08-15 and
         * this overlay is now the ONLY user of the class. The name is kept
         * because the rule is unchanged — before they were wired together they
         * had been hand-typed apart (30px / 1.6 letter-spacing here vs 24px /
         * 4px there), which is exactly how they drifted.
         *
         * Nothing about the type may be set inline here. An element's own
         * declaration beats an inherited one at any specificity, so a leftover
         * `fontSize` would silently win over the class and the sizes would
         * stay different while looking wired up. Colour is the one exception:
         * the class deliberately carries none, inheriting it on Home from
         * `.home-universe-heading`, so this overlay supplies its own.
         */}
        <div
          className="home-universe-title"
          style={{ color: skyText, textShadow: skyTextShadow, marginTop: 3 }}
        >
          {isAr ? 'العافية' : 'Wellbeing'}
        </div>
        <div style={{ fontSize: 12.5, color: skyMuted, marginTop: 3 }}>
          {isAr ? 'اختر مجالاً.' : 'Choose an area.'}
        </div>
      </div>

      <button
        type="button"
        onClick={() => { playSfx?.('click'); setOpenCat('favorites'); }}
        className="rx-fade rx-landing-favs"
      >
        <Star size={16} weight="fill" color={FAV_GOLD} aria-hidden="true" />
        {favs.length
          ? (isAr ? `${favs.length} ممارسة محفوظة` : `${favs.length} saved practice${favs.length > 1 ? 's' : ''}`)
          : (isAr ? 'المفضّلة' : 'Favorites')}
        {isAr
          ? <CaretLeft size={13} weight="bold" color={FAV_GOLD} aria-hidden="true" />
          : <CaretRight size={13} weight="bold" color={FAV_GOLD} aria-hidden="true" />}
      </button>


      {CATEGORIES.map((c, idx) => {
        const p = CAT_LAYOUT[c.id];
        const soon = c.soon && !c.items?.length;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => openCategory(c)}
            className="rx-planet"
            aria-label={isAr ? c.titleAr : c.title}
            style={{
              left: `${p.x}%`,
              // Placed inside the field, not on the raw stage — see CAT_LAYOUT.
              top: `calc(var(--rx-top) + (100% - var(--rx-top) - var(--rx-bot)) * ${p.fy})`,
              zIndex: 2,
              animationDuration: `${p.dur}s`, animationDelay: `-${p.delay}s`,
            }}
          >
            <span className="rx-planet-in" style={{ '--i': idx }}>
              <span className="rx-orb-wrap" style={{ '--rx-orb': `${p.size}px` }}>
                <span aria-hidden="true" className="rx-orb-aura" style={{
                  background: `radial-gradient(circle, ${c.color}5e 0%, ${c.color}1f 48%, transparent 72%)`,
                }} />
                {c.id === 'sleep' && (
                  <span aria-hidden="true" className="rx-orb-ring" style={{ borderColor: c.color }} />
                )}
                <span className="rx-orb" style={{
                  background: planetIconUrl(c.id) ? `radial-gradient(circle, ${c.color}42 0%, ${c.color}20 55%, transparent 76%)` : c.color,
                }}>
                  {planetIconUrl(c.id) ? (
                    <img
                      src={planetIconUrl(c.id)}
                      alt=""
                      draggable={false}
                      style={{
                        width: '80%', height: '80%', objectFit: 'contain', filter: orbArtFilter,
                        pointerEvents: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none', userSelect: 'none',
                      }}
                    />
                  ) : (
                    <>
                      <span aria-hidden="true" className="rx-orb-texture" style={planetTextureLayerStyle(0.4)} />
                      <span aria-hidden="true" className="rx-orb-shade" />
                      <span aria-hidden="true" className="rx-orb-sheen" />
                      <span className="rx-orb-icon">{c.icon}</span>
                    </>
                  )}
                </span>
                {c.id === 'meaning' && (
                  <>
                    <span aria-hidden="true" className="rx-spark" style={{ top: '-8%', insetInlineEnd: '-4%' }}>✦</span>
                    <span aria-hidden="true" className="rx-spark rx-spark--b" style={{ bottom: '0%', insetInlineStart: '-12%' }}>✦</span>
                  </>
                )}
              </span>
              <span className="rx-planet-name" style={{ color: skyText, textShadow: skyTextShadow }}>
                {isAr ? c.titleAr : c.title}
              </span>
              {soon && (
                <span className="rx-soon-pill" style={{
                  color: skyText,
                  background: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.22)',
                }}>
                  {isAr ? 'قريباً' : 'SOON'}
                </span>
              )}
            </span>
          </button>
        );
      })}

      <p className="rx-fade rx-landing-hint" style={{ color: skyMuted }}>
        {isAr ? 'المس أي كوكب لاستكشاف مجاله.' : 'Tap any planet to explore that area.'}
      </p>

      <style>{`
        .rx-fade { animation: rxFade .7s ease both; }

        /*
         * ── ONE SCREEN, NO SCROLL ──────────────────────────────────────────
         *
         * This landing is a picker of five things. It used to be
         * \`min-height: max(100dvh, 860px)\` inside .rx-root's own
         * \`overflow-y: auto\` scroller, so on every phone — a viewport of
         * roughly 620–760px once browser chrome is gone — the constellation was
         * taller than the screen and the bottom planets were below the fold.
         * A five-item menu you have to scroll reads as broken, and the drift
         * animation made the scroll feel like the page was sliding on its own.
         *
         * The stage is now exactly the viewport (.rx-root is \`position: fixed;
         * inset: 0\`, so 100% IS the viewport) and cannot scroll. Everything
         * fits by construction rather than by luck:
         *
         *   --rx-top  the chrome above the planets: the title stack, then the
         *             favourites pill under it.
         *   --rx-bot  the chrome below: the "tap any planet" hint, then the
         *             app tab bar (~68px + its own safe-area inset).
         *   FIELD     what is left. Each planet sits at a FRACTION of it
         *             (CAT_LAYOUT.fy), so the spread stretches and squeezes
         *             with the screen instead of running off the end of it.
         *   --rx-k    scales the orbs, labels and the 118px column together,
         *             stepped by viewport HEIGHT. Everything sized in this
         *             block multiplies by it, which is what keeps a shrunken
         *             planet from tearing away from its own name.
         *
         * ⚠ Measured against the VIEWPORT, not the screen — a 1366x768 laptop
         * has a ~577px viewport, and a height breakpoint written for the screen
         * locks out the machines it was meant for (this repo has shipped that
         * bug before, on Pair Match and Target Tracking).
         *
         * ⚠ The bottom clearance a planet needs is NOT half its orb: the name
         * hangs under it (gap 7 + ~18px of line), and the float animation lifts
         * it another 9px at the top of its cycle. \`personality\` (fy .84, the
         * lowest) is the tightest vertically and \`sleep\`/\`meaning\` the tightest
         * horizontally; those two pairs are what set every step below.
         */
        /* Doubled class: .rx-root in MENU_CSS sets overflow-y:auto at the same
           specificity, and relying on source order between two <style> tags is
           how this quietly comes back. */
        .rx-root.rx-root--landing { overflow: hidden; }
        .rx-landing-stage {
          position:relative; height:100%; overflow:hidden;
          --rx-top: calc(162px + env(safe-area-inset-top));
          --rx-bot: calc(120px + env(safe-area-inset-bottom));
          --rx-k: 1;
        }
        /* A tall phone or a desktop window: full size, generous field. */
        @media (max-height: 820px) { .rx-landing-stage { --rx-k: .88; } }
        /* The common phone viewport (~620-760px) and short laptops. */
        @media (max-height: 720px) {
          .rx-landing-stage {
            --rx-k: .78;
            --rx-top: calc(146px + env(safe-area-inset-top));
            --rx-bot: calc(108px + env(safe-area-inset-bottom));
          }
        }
        @media (max-height: 620px) {
          .rx-landing-stage {
            --rx-k: .68;
            --rx-top: calc(134px + env(safe-area-inset-top));
            --rx-bot: calc(100px + env(safe-area-inset-bottom));
          }
        }
        /*
         * ⚠ HEIGHT ALONE IS NOT ENOUGH — the second axis is real.
         * --rx-k also sets the 118px label column, and horizontal crowding is a
         * function of WIDTH. A narrow phone with lots of height (an installed
         * PWA on a 390pt device: ~390x760) keeps a big k from the queries above
         * and \`sleep\` (x 74%) then overlaps \`meaning\` (x 45%) — 29% of 390px is
         * 113px of separation against two 118px columns. Tall does not imply
         * wide. This must come AFTER the height steps to win the cascade.
         */
        @media (max-width: 440px) and (min-height: 721px) { .rx-landing-stage { --rx-k: .82; } }
        @media (max-width: 360px) and (min-height: 721px) { .rx-landing-stage { --rx-k: .72; } }
        /*
         * Below this there is no honest one-screen layout — a phone held in
         * landscape has ~350px of height, and five planets plus two blocks of
         * chrome cannot fit without overlapping. Overlapping planets would be
         * unreadable AND untappable, so scrolling comes back deliberately: a
         * scroll is worse than the default and much better than a broken board.
         */
        @media (max-height: 520px) {
          .rx-root.rx-root--landing { overflow-y: auto; }
          .rx-landing-stage { height:auto; min-height:560px; overflow:visible; }
        }

        @keyframes rxFade { from { opacity:0; } to { opacity:1; } }

        /* ── Chrome, positioned in CSS so the height queries above can move it.
             Only the theme-dependent colours stay inline. ── */
        .rx-landing-lang { position:absolute; top:calc(14px + env(safe-area-inset-top)); inset-inline-end:14px; z-index:5;
          min-width:38px; height:38px; padding:0 12px; border-radius:999px;
          display:flex; align-items:center; justify-content:center;
          border:1px solid rgba(240,182,106,0.34); background:rgba(24,20,34,0.66);
          backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
          box-shadow:0 4px 16px rgba(0,0,0,0.35);
          color:#f0b66a; font-size:13px; font-weight:700; cursor:pointer; }
        .rx-landing-head { position:absolute; top:calc(20px + env(safe-area-inset-top)); left:0; right:0; z-index:3;
          text-align:center; padding:0 60px; pointer-events:none; }
        .rx-landing-favs { position:absolute; top:calc(112px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
          z-index:3; display:flex; align-items:center; gap:8px; padding:9px 18px; max-width:min(92vw, 420px);
          border-radius:100px; border:1px solid rgba(240,182,106,0.4); background:rgba(24,20,34,0.58);
          backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
          box-shadow:0 6px 20px rgba(0,0,0,0.35);
          color:#ffe9ae; cursor:pointer; font-family:inherit; font-weight:700; font-size:13px; white-space:nowrap; }
        .rx-landing-hint { position:absolute; bottom:calc(94px + env(safe-area-inset-bottom)); left:0; right:0;
          text-align:center; font-size:12px; margin:0; padding:0 20px; z-index:2; }
        /* Tightened in step with --rx-top / --rx-bot, or the chrome would sit
           on top of the field it just handed to the planets. */
        @media (max-height: 720px) {
          .rx-landing-head { top:calc(14px + env(safe-area-inset-top)); }
          .rx-landing-favs { top:calc(100px + env(safe-area-inset-top)); padding:7px 15px; font-size:12.5px; }
          .rx-landing-lang { top:calc(10px + env(safe-area-inset-top)); height:34px; min-width:34px; }
          .rx-landing-hint { bottom:calc(84px + env(safe-area-inset-bottom)); font-size:11.5px; }
        }
        @media (max-height: 620px) {
          .rx-landing-head { top:calc(10px + env(safe-area-inset-top)); }
          .rx-landing-favs { top:calc(90px + env(safe-area-inset-top)); }
          .rx-landing-hint { bottom:calc(80px + env(safe-area-inset-bottom)); }
        }

        .rx-planet { position:absolute; background:none; border:none; padding:0; cursor:pointer;
          animation-name: rxFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @keyframes rxFloat { 0%,100% { transform: translate(-50%,-50%) translateY(0); } 50% { transform: translate(-50%,-50%) translateY(-9px); } }
        .rx-planet-in { display:flex; flex-direction:column; align-items:center; gap:calc(7px * var(--rx-k,1)); width:calc(118px * var(--rx-k,1));
          animation: rxPop .7s cubic-bezier(.22,.9,.32,1.28) both; animation-delay: calc(var(--i,0) * 90ms); }
        @keyframes rxPop { from { opacity:0; transform: scale(.65) translateY(12px); } to { opacity:1; transform: none; } }
        /* --rx-orb is the full-size diameter (CAT_LAYOUT.size), set inline per
           planet; --rx-k shrinks it on short viewports. It was a plain inline
           width/height, which no height query could reach. */
        .rx-orb-wrap { position:relative; display:flex; align-items:center; justify-content:center;
          width:calc(var(--rx-orb, 88px) * var(--rx-k,1)); height:calc(var(--rx-orb, 88px) * var(--rx-k,1)); }
        .rx-orb-aura { position:absolute; inset:-30%; border-radius:50%;
          animation: rxBreathe 5.5s ease-in-out infinite; }
        @keyframes rxBreathe { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.1); } }
        .rx-orb { position:relative; width:100%; height:100%; border-radius:50%; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 12px 30px rgba(8,6,4,.28), inset 0 -8px 18px rgba(0,0,0,.14), inset 0 2px 10px rgba(255,255,255,.28);
          transition: transform .28s cubic-bezier(.3,.9,.4,1.2); }
        /* The discs really are circles, so they take the crisp ring the artwork
           cannot — same reason as the contour above: on beige the orb's own
           26%-alpha glow has nothing to sit against and the edge disappears. */
        html[data-home-theme='light'] .rx-orb {
          box-shadow: 0 10px 22px rgba(32,29,24,.20), inset 0 -8px 18px rgba(0,0,0,.14),
                      inset 0 2px 10px rgba(255,255,255,.28), 0 0 0 1.5px rgba(32,29,24,.30); }
        .rx-planet:hover .rx-orb { transform: scale(1.06); }
        .rx-planet:active .rx-orb { transform: scale(.95); }
        .rx-orb-shade { position:absolute; inset:0; border-radius:50%;
          background: radial-gradient(circle at 71% 78%, rgba(22,14,6,.4) 0%, rgba(22,14,6,.12) 36%, transparent 58%); }
        .rx-orb-sheen { position:absolute; inset:0; border-radius:50%;
          background: radial-gradient(ellipse 46% 34% at 30% 20%, rgba(255,255,255,.8) 0%, rgba(255,255,255,.14) 52%, transparent 68%); }
        .rx-orb-texture { position:absolute; inset:0; border-radius:50%; pointer-events:none; }
        /* Was an inline \`fontSize: p.size * 0.34\`. Same ratio, expressed
           against the orb so it follows --rx-k with everything else. */
        .rx-orb-icon { position:relative; font-size:calc(var(--rx-orb, 88px) * .34 * var(--rx-k,1));
          filter: drop-shadow(0 2px 5px rgba(0,0,0,.4)); }
        .rx-orb-ring { position:absolute; width:156%; height:42%; border:1.5px solid; border-radius:50%;
          transform: rotate(-24deg); opacity:.5; }
        .rx-spark { position:absolute; font-size:11px; color:#ffd98a; line-height:1;
          text-shadow: 0 0 8px rgba(255,200,90,.95); animation: rxTwinkle 2.8s ease-in-out infinite; }
        .rx-spark--b { font-size:8px; animation-delay:1.3s; }
        .rx-planet-name { font-family:Outfit,${SANS}; font-weight:700;
          font-size:max(11.5px, calc(15px * var(--rx-k,1)));
          letter-spacing:.02em; line-height:1.15; text-align:center; }
        .rx-soon-pill { font-size:9.5px; font-weight:700; letter-spacing:1.4px; border:1px solid;
          border-radius:100px; padding:2.5px 9px; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        @media (prefers-reduced-motion: reduce) {
          .rx-planet, .rx-planet-in, .rx-orb-aura, .rx-star, .rx-blob, .rx-shoot, .rx-spark, .rx-fade { animation:none !important; }
        }
      `}</style>
      </div>
    </div>
  );
}

export default function RelaxScreen({ entry = 'menu' } = {}) {
  const { switchTab, playSfx, currentLang, setImmersive } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState(() => {
    if (entry === 'daily') return 'daily';
    try {
      if (sessionStorage.getItem(OPEN_DAILY_KEY) === '1') return 'daily';
    } catch { /* ignore */ }
    return 'menu';
  });
  const [returnTo, setReturnTo] = useState(entry === 'daily' ? 'daily' : 'menu');
  const [resumeCategory, setResumeCategory] = useState(null);
  const [resumeGroup, setResumeGroup] = useState('program');
  const back = () => { playSfx?.('click'); setView(returnTo); setReturnTo(entry === 'daily' ? 'daily' : 'menu'); };

  // Hide the bottom tab bar inside a practice — the menu / daily landing are
  // the only "main pages".
  useEffect(() => {
    setImmersive('relax', view !== 'menu' && view !== 'daily');
    return () => setImmersive('relax', false);
  }, [view, setImmersive]);
  useEffect(() => {
    if (view !== 'daily') return;
    try { sessionStorage.removeItem(OPEN_DAILY_KEY); } catch { /* ignore */ }
  }, [view]);
  const openPractice = (id, from = 'menu', categoryId = null, categoryGroup = 'program') => {
    playSfx?.('click');
    setReturnTo(from);
    setResumeCategory(from === 'menu' ? categoryId : null);
    if (from === 'menu') setResumeGroup(categoryGroup);
    setView(id);
  };

  if (view === 'daily') {
    return (
      <DailyHabits
        isAr={isAr}
        playSfx={playSfx}
        onBack={entry === 'daily' ? undefined : back}
        onOpenPractice={(id) => openPractice(id, 'daily')}
      />
    );
  }
  if (view === 'mbsr') return <MbsrTracker onBack={back} />;
  if (view === 'breathe') return <BreathePractice onBack={back} />;
  if (view === 'grounding') return <GroundingPractice onBack={back} />;
  if (view === 'pmr') return <PmrPractice onBack={back} />;
  if (view === 'ikigai') return <IkigaiPractice onBack={back} />;
  if (view === 'personality-quiz') return <PersonalityQuiz onBack={back} />;
  if (view === 'relationship-quiz') return <RelationshipQuiz onBack={back} />;
  if (view === 'sleep-sounds') return <SleepSoundsPractice onBack={back} />;
  if (view === 'sleep-reset') return <SleepResetPractice onBack={back} />;
  if (view === 'connect') return <ConnectPractice onBack={back} />;
  if (view === 'who5') return <Who5Practice onBack={back} />;
  /* ⚠ ONE ROUTE FOR EVERY WORKSHEET. A worksheet is data, so it needs no line
     here of its own — authoring it in worksheets.js is enough. Adding a `if
     (view === 'ws-…')` for a new sheet means the engine has been bypassed. */
  if (view.startsWith('ws-')) {
    const sheet = worksheetById(view);
    if (sheet) return <WorksheetRunner sheet={sheet} onBack={back} />;
  }
  return (
    <RelaxMenu
      isAr={isAr}
      playSfx={playSfx}
      initialCategory={resumeCategory}
      initialGroup={resumeGroup}
      onHome={() => { playSfx?.('click'); switchTab('habits'); }}
      onOpen={(id, categoryId, categoryGroup) => openPractice(id, 'menu', categoryId, categoryGroup)}
    />
  );
}

const MENU_CSS = `
/* Wellbeing category/detail landings — Home universe cosmos glass */
/*
 * ⚠️ This used to be \`background: transparent\`, on the assumption that the
 * Wellbeing LANDING's cosmos would show through. It does not: a category or
 * detail view replaces the landing, so there is nothing behind this but the app
 * shell — which in light appearance is cream paper. Every colour below is tuned
 * for a dark sky, so the result was var(--universe-ink) text on #f5f2e9 paper: the "Stress
 * & Calm" heading was very nearly invisible, and its cards were dark slabs on
 * white. Painting the dusk here is what makes the whole section legible, and it
 * matches Home, Training, Kawnera and Puzzle Studio.
 *
 * No \`background-attachment: fixed\` here, unlike Kawnera and Puzzle Studio.
 * This element is ALREADY \`position: fixed; inset: 0\` and scrolls its own
 * content, so the gradient maps to the viewport without help — and asking for
 * fixed attachment as well made Chrome drop the paint entirely (the computed
 * style still reported the gradient; the pixels stayed the page's cream).
 */
.rx-root { position:fixed; inset:0; z-index:50; min-height:0; overflow-x:hidden; overflow-y:auto;
  overscroll-behavior-y:contain; -webkit-overflow-scrolling:touch; scrollbar-gutter:stable;
  scrollbar-width:thin; scrollbar-color:var(--universe-line) transparent;
  background:var(--universe-dusk);
  --rx-favorite-ink:#6b4d16;
  --rx-success-ink:#285d3d;
  color:var(--universe-ink); font-family:${SANS}; }
.rx-root::-webkit-scrollbar { width:9px; }
.rx-root::-webkit-scrollbar-track { background:transparent; }
.rx-root::-webkit-scrollbar-thumb { background:var(--universe-line); border:2px solid transparent; border-radius:999px; background-clip:padding-box; }
.rx-root *, .rx-root *::before, .rx-root *::after { box-sizing:border-box; }
.rx-root .rx-app { max-width:480px; margin:0 auto; padding-bottom:110px; position:relative; z-index:3; }
.rx-root .rx-back { position:absolute; top:max(14px, env(safe-area-inset-top)); left:12px; z-index:20; width:36px; height:36px; border-radius:999px;
  border:1px solid var(--universe-line); background:var(--universe-glass-strong); color:var(--universe-ink); font-size:22px; line-height:1; cursor:pointer;
  box-shadow:0 4px 14px rgba(0,0,0,0.35); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
.rx-root .header { padding:max(24px, calc(12px + env(safe-area-inset-top))) 20px 18px; background:transparent; }
.rx-root .header-sub { font-size:11px; letter-spacing:3px; color:var(--universe-accent); text-transform:uppercase; margin-bottom:4px; font-weight:700; }
/* ⚠ WAS Outfit/28px/700 WITH AN AMBER GLOW HARD-CODED. Three screens deep —
   landing (Cinzel) → category (this) → practice (Cormorant, PracticeShell's
   .rxp-title) — used three different display faces for the same role; this
   now matches the practice screen's face and scale so the type does not
   visibly change the moment you go one level in or out. The glow was a
   leftover from when every category shared one accent; a Sleep or Calm
   title (indigo, jade) glowed gold regardless of its own hue. The [dir='rtl']
   rule below still swaps this to Cairo - Cormorant has no Arabic glyphs at
   all. NO BACKTICKS IN THIS COMMENT: it is inside a template literal. */
.rx-root .header-title { font-family:${SERIF}; font-size:var(--rx-fs-display); font-weight:600; line-height:1.12; color:var(--universe-ink); }
.rx-root .menu-tag { font-size:13px; color:var(--universe-muted); margin-top:6px; }
.rx-root .content { padding:20px; }
.rx-root .rx-menu-card { display:flex; align-items:center; gap:4px; width:100%; text-align:left;
  background:var(--universe-glass); border:1px solid var(--universe-line); border-radius:20px; padding:6px; margin-bottom:14px;
  font-family:inherit; box-shadow:0 10px 28px color-mix(in srgb, var(--universe-ink) 32%, transparent);
  backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); overflow:hidden; transition:transform .15s, border-color .15s, box-shadow .15s; }
.rx-root .rx-menu-card:hover { transform:translateY(-2px); box-shadow:0 14px 34px color-mix(in srgb, var(--universe-ink) 38%, transparent); }
.rx-root .rx-menu-open { flex:1; min-width:0; display:flex; align-items:center; gap:14px; padding:10px; border:0; border-radius:15px; background:transparent; color:inherit; text-align:start; font:inherit; cursor:pointer; }
.rx-root .rx-menu-open:active { transform:translateY(1px); }
.rx-root .rx-menu-open:focus-visible, .rx-root .rx-fav:focus-visible, .rx-root .rx-journey-step:focus-visible, .rx-root .rx-seg-btn:focus-visible, .rx-root .rx-need-chip:focus-visible, .rx-root .rx-need-go:focus-visible { outline:3px solid color-mix(in srgb, var(--rx-hue-lit, var(--universe-accent)) 72%, transparent); outline-offset:2px; }
/* ⚠ 56px on a hue-tinted ground, not a 70px opaque photo tile — see the JSX
   comment above where this renders. The pillar's own hue does the tinting so
   six cards in one pillar still read as belonging together. */
.rx-root .rx-menu-ic { font-size:26px; flex-shrink:0; width:56px; height:56px; border-radius:16px; display:flex; align-items:center; justify-content:center;
  background:radial-gradient(circle at 34% 28%, color-mix(in srgb, var(--rx-hue-lit, var(--universe-accent)) 34%, transparent), color-mix(in srgb, var(--rx-hue, var(--universe-accent)) 20%, transparent));
  border:1px solid color-mix(in srgb, var(--rx-hue, var(--universe-accent)) 34%, transparent); box-shadow:var(--elev-rest); }
.rx-root .rx-menu-body { display:flex; flex-direction:column; gap:4px; flex:1; }
.rx-root .rx-menu-title { font-family:Outfit,${SANS}; font-weight:600; font-size:var(--rx-fs-head); color:var(--universe-ink); }
.rx-root .rx-menu-sub { font-size:var(--rx-fs-small); color:var(--universe-muted); line-height:1.5; }
/* ⚠ WAS var(--rx-hue-lit) — fails contrast as TEXT in light theme; see the
   note on --rx-hue-ink in wellbeing.css. */
.rx-root .rx-menu-stat { display:block; margin-top:5px; font-size:var(--rx-fs-label); font-weight:700; letter-spacing:0.3px;
  color:var(--rx-hue-ink, var(--universe-accent)); }
/* Same recipe as worksheetEngine.jsx's .ws-tier class (same --rx-hue tokens,
   same pill shape) so a practice's evidence tier reads identically whether
   you see it on the menu card or inside the practice itself. Kept as its own
   rule rather than sharing one class name across two CSS-in-JS template
   strings that only one of the two screens ever has mounted at once — and
   note this comment lives INSIDE a template literal, so it must never
   contain a backtick character or it silently truncates the string. */
.rx-root .rx-menu-tier { display:inline-block; margin-top:6px; font-size:10.5px; font-weight:700;
  padding:3px 10px; border-radius:999px; letter-spacing:0.1px;
  color:var(--rx-hue-ink, var(--universe-accent));
  background:color-mix(in srgb, var(--rx-hue, var(--universe-accent)) 14%, transparent);
  border:1px solid color-mix(in srgb, var(--rx-hue, var(--universe-accent)) 34%, transparent); }

.rx-root .rx-journey { margin-bottom:16px; padding:16px; border-radius:20px; border:1px solid color-mix(in srgb, var(--rx-hue-lit) 38%, var(--universe-line)); background:linear-gradient(145deg, color-mix(in srgb, var(--rx-hue) 15%, var(--universe-glass-strong)), var(--universe-glass)); box-shadow:0 12px 30px color-mix(in srgb, var(--universe-ink) 30%, transparent); backdrop-filter:blur(15px); -webkit-backdrop-filter:blur(15px); }
.rx-root .rx-journey-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.rx-root .rx-journey-kicker { margin-bottom:3px; color:var(--rx-hue-ink, var(--universe-accent)); font-size:var(--rx-fs-label); font-weight:700; letter-spacing:2px; text-transform:uppercase; }
.rx-root .rx-journey-title { color:var(--universe-ink); font-family:Outfit,${SANS}; font-size:var(--rx-fs-head); font-weight:600; }
.rx-root .rx-journey-count { min-width:48px; height:30px; padding:0 10px; border-radius:999px; display:flex; align-items:center; justify-content:center; color:var(--universe-ink); background:color-mix(in srgb, var(--rx-hue) 22%, transparent); border:1px solid color-mix(in srgb, var(--rx-hue-lit) 38%, transparent); font-size:12px; font-weight:700; font-variant-numeric:tabular-nums; }
.rx-root .rx-journey-bar { height:5px; margin:13px 0 9px; overflow:hidden; border-radius:999px; background:color-mix(in srgb, var(--universe-line) 75%, transparent); }
.rx-root .rx-journey-bar span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg, var(--rx-hue), var(--rx-hue-lit)); box-shadow:0 0 12px color-mix(in srgb, var(--rx-hue-lit) 54%, transparent); transition:width .35s ease; }
.rx-root .rx-journey-note { margin:0 0 12px; color:var(--universe-muted); font-size:11.5px; line-height:1.45; }
.rx-root .rx-journey-track { display:grid; grid-auto-flow:column; grid-auto-columns:minmax(78px, 1fr); gap:7px; overflow-x:auto; padding:2px 1px 5px; scrollbar-width:none; }
.rx-root .rx-journey-track::-webkit-scrollbar { display:none; }
.rx-root .rx-journey-step { min-height:76px; padding:7px 4px; border:0; border-radius:13px; display:flex; flex-direction:column; align-items:center; gap:7px; background:transparent; color:var(--universe-muted); font:700 10.5px/1.2 ${SANS}; text-align:center; cursor:pointer; }
.rx-root .rx-journey-step:hover { background:color-mix(in srgb, var(--rx-hue) 10%, transparent); color:var(--universe-ink); }
.rx-root .rx-journey-node { width:38px; height:38px; flex:0 0 38px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--universe-muted); border:1px solid var(--universe-line); background:var(--universe-glass-strong); box-shadow:var(--elev-rest); font-size:12px; }
.rx-root .rx-journey-step.done { color:var(--universe-ink); }
.rx-root .rx-journey-step.done .rx-journey-node { color:var(--rx-hue-ink, var(--rx-hue-lit)); border-color:color-mix(in srgb, var(--rx-hue-lit) 62%, transparent); background:color-mix(in srgb, var(--rx-hue) 22%, var(--universe-glass-strong)); box-shadow:0 0 18px color-mix(in srgb, var(--rx-hue) 30%, transparent); }

/* ── the "what's going on right now?" router (category screens only) ── */
.rx-root .rx-need { margin-bottom:14px; padding:13px 14px; border-radius:15px;
  border:1px solid var(--rx-hair); background:var(--rx-card); box-shadow:var(--elev-rest); }
.rx-root .rx-need-q { font-size:12.5px; font-weight:700; color:var(--rx-ink); margin-bottom:9px; line-height:1.45; }
.rx-root .rx-need-chips { display:flex; flex-wrap:wrap; gap:7px; }
.rx-root .rx-need-chip { padding:8px 13px; border-radius:999px; border:1px solid var(--rx-hair);
  background:transparent; color:var(--rx-sub); font-size:12.5px; font-weight:700; cursor:pointer;
  font-family:inherit; transition:border-color .15s, background .15s, color .15s; }
.rx-root .rx-need-chip.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 16%, transparent); color:var(--rx-ink); }
.rx-root .rx-need-why { margin-top:11px; padding-top:11px; border-top:1px dashed var(--rx-hair); }
.rx-root .rx-need-why p { margin:0 0 9px; font-size:12.5px; color:var(--rx-sub); line-height:1.6; }
.rx-root .rx-need-go { padding:9px 16px; border-radius:11px; border:1px solid color-mix(in srgb, var(--rx-hue) 55%, transparent);
  background:var(--rx-hue); color:#fff; font-size:13px; font-weight:600; cursor:pointer; font-family:inherit;
  box-shadow:var(--elev-rest); }
.rx-root .rx-need-go:active { box-shadow:var(--elev-press); }
.rx-root .rx-menu-chev { font-size:28px; font-weight:700; flex-shrink:0; color:var(--universe-accent); }
.rx-root .rx-menu-more { text-align:center; font-size:12px; color:var(--universe-muted); margin-top:6px; }
.rx-root .rx-cat-tile { display:flex; align-items:center; gap:14px; width:100%; text-align:start;
  background:var(--universe-glass); border:1px solid var(--universe-line); border-radius:16px; padding:16px; margin-bottom:14px;
  cursor:pointer; font-family:inherit; box-shadow:0 4px 18px rgba(0,0,0,0.35); transition:transform .1s; }
.rx-root .rx-cat-tile:active { transform:translateY(1px); }
.rx-root .rx-cat-ic { width:56px; height:56px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }
.rx-root .rx-cat-ic--hd { width:40px; height:40px; border-radius:11px; font-size:22px; }
.rx-root .rx-cat-body { display:flex; flex-direction:column; gap:3px; flex:1; min-width:0; }
.rx-root .rx-cat-title { font-family:Outfit,${SANS}; font-weight:700; font-size:20px; color:var(--universe-ink); line-height:1.1; }
.rx-root .rx-cat-tag { font-size:12.5px; color:var(--universe-muted); line-height:1.4; }
.rx-root .rx-cat-meta { display:flex; align-items:center; gap:9px; flex-shrink:0; }
.rx-root .rx-cat-hd { display:flex; align-items:center; gap:11px; }
.rx-root .rx-seg { display:flex; gap:5px; background:var(--universe-glass-strong); border:1px solid var(--universe-line); border-radius:13px; padding:4px; margin-bottom:18px; }
.rx-root .rx-seg-btn { flex:1; padding:10px 0; border:none; background:none; border-radius:9px; font-family:inherit; font-size:13.5px; font-weight:700; color:var(--universe-muted); cursor:pointer; transition:all .15s; }
/* The selected tab wears the AREA's hue, not the one global accent. Five
   categories that all highlight in the same blue is the same failure as five
   planets that all render grey. */
.rx-root .rx-seg-btn.on { background:color-mix(in srgb, var(--rx-hue, var(--universe-accent)) 18%, var(--universe-glass-strong)); color:var(--universe-ink); box-shadow:var(--elev-rest); }
/* The area's planet, repeated at header size — see detailHeader.
   ⚠ display:block is load-bearing. This is a <span>, so it is inline by
   default, width/height are ignored on an inline box, and the .rx-body inside
   it sizes at 100% OF NOTHING. It reserved its 40px of layout (the title was
   indented by it) and painted zero pixels — a gap where a planet should be,
   with a perfectly correct gradient in getComputedStyle. */
/* ⚠ WAS 40px — these are 640x640 paintings with real filigree (Meaning's
   armillary, Personality's mirror); at 40px the detail that makes them read
   as paintings rather than icons was lost. */
.rx-root .rx-cat-planet { display:block; position:relative; width:52px; height:52px; flex-shrink:0; }
.rx-root .rx-soon-badge { flex-shrink:0; font-size:10.5px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--universe-accent); background:rgba(232,172,78,0.14); border:1px solid var(--universe-line); border-radius:999px; padding:4px 11px; }
.rx-root .rx-soon-empty { text-align:center; padding:40px 16px; }
.rx-root .rx-soon-emoji { width:88px; height:88px; border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:44px; margin:0 auto 18px; }
.rx-root .rx-soon-title { font-family:${SERIF}; font-weight:600; font-size:var(--rx-fs-title); color:var(--universe-ink); margin-bottom:10px; }
.rx-root .rx-soon-desc { font-size:14px; color:var(--universe-muted); line-height:1.6; max-width:320px; margin:0 auto; }
.rx-root .rx-fav { width:44px; height:44px; flex:0 0 44px; padding:0; border:0; background:transparent; display:flex; align-items:center; justify-content:center; line-height:1; color:var(--universe-muted); cursor:pointer; border-radius:12px; user-select:none; -webkit-user-select:none; transition:transform .12s ease, color .12s ease, background .12s ease; }
.rx-root .rx-fav:hover { background:color-mix(in srgb, var(--rx-hue) 12%, transparent); }
.rx-root .rx-fav:active { transform:scale(0.82); }
.rx-root .rx-fav.on { color:var(--rx-favorite-ink); }
.rx-root .rx-fav-count { min-width:22px; height:22px; padding:0 6px; border-radius:999px; background:rgba(232,172,78,0.2); color:var(--rx-favorite-ink); font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.rx-root .rx-habit-badge { min-width:22px; height:22px; padding:0 6px; border-radius:999px; background:rgba(90,160,122,0.25); color:var(--rx-success-ink); font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.rx-root .rx-habit-badge--done { background:#5aa07a; color:#201d18; }
.rx-root .rx-cat-divider { height:1px; background:rgba(232,172,78,0.22); margin:2px 2px 18px; }
.rx-root .rx-rl { position:relative; }
.rx-root .rx-rl-item { will-change:transform; }
.rx-root .rx-rl-item--drag .rx-menu-card { box-shadow:0 12px 26px rgba(0,0,0,0.45); border-color:var(--universe-accent); cursor:grabbing; }
[dir='rtl'] .rx-root .header-title,
[dir='rtl'] .rx-root .rx-menu-title,
[dir='rtl'] .rx-root .rx-cat-title { font-family:Cairo,${SANS}; font-weight:700; }
html[data-home-theme='dark'] .rx-root { --rx-favorite-ink:#f3c65f; --rx-success-ink:#9fd4a3; }
`;
