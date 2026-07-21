import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import BreathePractice from './BreathePractice';
import GroundingPractice from './GroundingPractice';
import PmrPractice from './PmrPractice';
import IkigaiPractice from './IkigaiPractice';
import PersonalityQuiz from './PersonalityQuiz';
import RelationshipQuiz from './RelationshipQuiz';
import SleepSoundsPractice from './SleepSoundsPractice';
import DailyHabits from './DailyHabits';
import { planetTextureLayerStyle } from '../../lib/planetTexture';
import { planetIconUrl } from '../../lib/planetIcons';
import { OPEN_DAILY_KEY } from './HabitReminderBanner';
import UniverseStage from '../../components/shared/UniverseStage';

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
  { phase: 'I', label: 'The Body', weeks: [1, 2], technique: 'Body Scan', duration: '20–30 min', color: '#d07a3e', icon: '🫁',
    instructions: ['Lie down on your back in a comfortable position.', 'Close your eyes and take three slow breaths to settle in.', 'Bring attention to your LEFT toes — just notice whatever is there. Tingling? Warmth? Numbness? Nothing?', 'Slowly move up: foot → ankle → calf → knee → thigh.', 'Repeat on the RIGHT leg.', 'Continue upward: hips → lower back → abdomen → chest → shoulders.', 'Move down each arm: shoulder → elbow → wrist → fingers.', 'Finally: neck → jaw → face → crown of the head.', "If you fall asleep — that's fine. If your mind wanders — gently return. No judgment."],
    tip: "Don't try to relax each body part. Just notice it, as if you're a curious scientist." },
  { phase: 'II', label: 'The Breath', weeks: [3, 4], technique: 'Mindful Breathing', duration: '20 min', color: '#3f7fc4', icon: '🌬️',
    instructions: ['Sit upright — on a chair, floor, or cushion. Dignified but not rigid.', 'Eyes closed or softly focused on the floor 3 feet ahead.', 'Choose your anchor: the sensation of air at your NOSTRILS, or the RISE AND FALL of your abdomen.', 'Simply rest attention there. Feel the cool air coming in, the warm air going out.', 'When your mind wanders (it will, within seconds) — that is NORMAL. Gently return.', "Each return is one 'rep.' You are literally training your attention muscle.", 'No counting. No controlling the breath. Just observing.'],
    tip: 'The goal is NOT to have a clear mind. The goal is to notice when it wanders, and return. That noticing IS the practice.' },
  { phase: 'III', label: 'Movement', weeks: [5], technique: 'Mindful Stretching', duration: '20–30 min', color: '#3a9d5d', icon: '🧘',
    instructions: ['Stand or sit. No special equipment needed.', 'Begin with a slow neck roll — left, forward, right. Move at 10% of normal speed.', 'Raise both arms slowly overhead. Feel every millimeter of the stretch.', 'Shoulder rolls — forward 5 times, backward 5 times. Full attention on the sensation.', 'Gentle forward fold from the waist — feel the pull in your hamstrings.', 'Seated spinal twist — left then right. Notice which side feels different.', 'Throughout all movement: the mind is FULLY in the body. If it wanders, return to sensation.'],
    tip: 'This week bridges mental and physical mindfulness. It also builds body awareness that deepens your future sitting practice.' },
  { phase: 'IV', label: 'Observation', weeks: [6, 7], technique: 'Open Awareness', duration: '20 min', color: '#8b5cc4', icon: '🌌',
    instructions: ['Sit as in the breathing practice. Settle with 3 breaths.', 'Instead of focusing on ONE thing — open your awareness to EVERYTHING.', "Notice sounds — near, far, loud, faint. Don't label them, just hear.", 'Notice physical sensations arising and passing — an itch, a heaviness, a tightness.', 'Notice thoughts — watch them appear like bubbles, without grabbing onto them.', 'You are the sky. Thoughts, feelings, sounds are clouds passing through.', 'If you feel lost — return briefly to the breath, then open up again.'],
    tip: 'This phase can feel uncomfortable at first — you have no single anchor. That discomfort IS the training.' },
  { phase: 'V', label: 'Integration', weeks: [8], technique: 'Choiceless Awareness', duration: '20–30 min', color: '#cf5b8f', icon: '✨',
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
  { icon: '📅', title: "Don't Skip Days", text: 'Short on time? Do 5 minutes. Consistency is what builds the habit.' },
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
  const { playSfx } = useApp();
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
      setCompleted((prev) => { if (prev[today]) return prev; const n = { ...prev, [today]: true }; lsSet('mbsr_completed', JSON.stringify(n)); return n; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timerSeconds, timerTarget]);

  const { week: currentWeek, day: currentDay } = getWeekAndDay(startDate);
  const todayPhase = currentWeek ? getPhaseForWeek(currentWeek) : null;
  const streak = computeStreak(completed);
  const totalDone = Object.values(completed).filter(Boolean).length;

  const toggleDay = (key) => { setCompleted((prev) => { const n = { ...prev, [key]: !prev[key] }; lsSet('mbsr_completed', JSON.stringify(n)); return n; }); playSfx?.('click'); };
  const setTarget = (min) => { setTimerActive(false); setTimerSeconds(0); setTimerTarget(min * 60); playSfx?.('click'); };
  const toggleTimer = () => { playSfx?.('click'); setTimerActive((a) => !a); };
  const resetTimer = () => { setTimerActive(false); setTimerSeconds(0); };
  const confirmStart = () => { setStartDate(pickedDate); lsSet('mbsr_startDate', pickedDate); setShowModal(false); playSfx?.('click'); };
  const saveNote = () => { const v = draft.trim(); if (!v) return; setNotes((prev) => { const n = { ...prev, [today]: v }; lsSet('mbsr_notes', JSON.stringify(n)); return n; }); setSavedFlash(true); playSfx?.('click'); };

  const circ = 2 * Math.PI * 54;
  const circOffset = circ * (1 - Math.min(timerSeconds / timerTarget, 1));
  const p = todayPhase;

  return (
    <div className="rx-root" dir="ltr">
      <style>{CSS}</style>
      <div className="rx-app">
        <div className="header">
          <button className="rx-back" onClick={onBack} aria-label="Back">‹</button>
          <div className="header-row">
            <div>
              <div className="header-sub">Mindfulness Protocol</div>
              <div className="header-title serif">8-Week MBSR<br /><em>Tracker</em></div>
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
              <span style={{ color: todayPhase.color, fontWeight: 700 }}>Phase {todayPhase.phase}: {todayPhase.label}</span> · Week {currentWeek}, Day {currentDay}
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
              <div className="empty-emoji">🧘</div>
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
                    <div style={{ fontSize: 11, color: p.color, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4, fontWeight: 800 }}>Today's Practice</div>
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
                    <button className={`begin-btn${timerActive ? ' begin-btn--paused' : ''}`} onClick={toggleTimer} style={timerActive ? undefined : { background: `linear-gradient(135deg,${p.color},${p.color}cc)`, color: '#fff' }}>
                      {timerActive ? '⏸ Pause' : timerSeconds > 0 ? '▶ Resume' : '▶ Begin session'}
                    </button>
                    {timerSeconds > 0 && <button className="reset-btn" onClick={resetTimer}>↺</button>}
                  </div>
                </div>

                <button className="done-btn" onClick={() => toggleDay(today)} style={completed[today] ? { background: `${p.color}26`, borderColor: p.color, color: p.color } : undefined}>
                  {completed[today] ? '✓ Session complete' : 'Mark as done'}
                </button>
              </div>

              <div className="step-list">
                <div className="section-label">Step-by-step instructions</div>
                {p.instructions.map((s, i) => (
                  <div key={i} className="step-item">
                    <div className="step-num" style={{ background: `${p.color}1f`, borderColor: `${p.color}66`, color: p.color }}>{i + 1}</div>
                    <div className="step-text">{s}</div>
                  </div>
                ))}
                <div className="insight-box" style={{ borderLeftColor: p.color, background: `${p.color}10` }}>
                  <div className="insight-label" style={{ color: p.color }}>💡 KEY INSIGHT</div>
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
                  <div key={ph.phase} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8a7f6f' }}>
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
                      <div className="week-label" style={{ color: phase.color }}>Week {week}</div>
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
                            style={{ ...(isToday ? { borderColor: phase.color, borderWidth: 2 } : {}), ...(isDone ? { background: `${phase.color}2e`, color: phase.color, borderColor: `${phase.color}80` } : {}) }}
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
              <div className="legend-box"><span style={{ color: '#2e8b57' }}>✓</span> = done &nbsp;·&nbsp; <span style={{ color: '#b9842f' }}>●</span> dot = has note &nbsp;·&nbsp; tap any past/today day to toggle</div>
            </>
          )}

          {tab === 'guide' && (
            <>
              <div className="serif rx-heading-ink" style={{ fontSize: 22, marginBottom: 6 }}>The full protocol</div>
              <div style={{ fontSize: 13, color: '#8a7f6f', marginBottom: 20 }}>Reference guide — all phases, dos & don'ts.</div>

              <div className="principle-card">
                <div className="section-label" style={{ color: '#b9842f' }}>Core principles</div>
                {[['⚡', 'Minimum effective dose', 'About 20 minutes a day. Short and consistent beats long and rare.'], ['🚫', 'The non-striving rule', 'Don\'t try to "feel relaxed." Just notice what\'s happening — even if it\'s stress.'], ['🧬', 'Practice adds up', 'Several weeks of regular practice is linked, in studies, to better attention and stress regulation — and in some research, measurable brain changes.']].map(([icon, title, text]) => (
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
                      <div className="phase-guide-sub" style={{ color: ph.color }}>Phase {ph.phase} · Week{ph.weeks.length > 1 ? 's' : ''} {ph.weeks.join('–')}</div>
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
                <div className="section-label" style={{ color: '#b9842f' }}>Daily pre-session checklist</div>
                {['Set a timer — use a neutral, calm sound.', 'Posture: upright but not rigid. "Dignified but relaxed."', 'Eyes: closed, or softly focused on the floor 3 feet ahead.', 'Every time distracted → smile inwardly → return to anchor.'].map((item, i) => (
                  <div key={i} className="checklist-item"><div className="check-num">{i + 1}</div>{item}</div>
                ))}
              </div>

              <div className="disclaimer">This is a self-guided practice for calm and focus — not medical treatment. If you're dealing with significant distress, please reach out to a professional.</div>
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

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Outfit', system-ui, sans-serif";
const INK = '#2d2210'; const SUB = '#8a7f6f'; const FAINT = '#b3a288'; const LINE = '#e3d6c4'; const CARD = '#fffdf8'; const GOLD = '#b9842f';
const CSS = `
.rx-root { position:fixed; inset:0; z-index:50; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
.rx-root *, .rx-root *::before, .rx-root *::after { box-sizing:border-box; }
.rx-app { max-width:480px; margin:0 auto; padding-bottom:80px; position:relative; }
.rx-back { position:absolute; top:14px; left:12px; z-index:20; width:36px; height:36px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#141210; font-size:22px; line-height:1; cursor:pointer; }
.rx-root .header { padding:24px 20px 16px; background:linear-gradient(180deg,#fffaf3 0%,var(--color-training-palette-surface,#fff7f2) 100%); }
.rx-root .header-row { display:flex; justify-content:space-between; align-items:flex-start; padding-left:42px; }
.rx-root .header-sub { font-size:11px; letter-spacing:3px; color:${GOLD}; text-transform:uppercase; margin-bottom:4px; font-weight:700; }
.rx-root .header-title { font-family:${SERIF}; font-size:32px; font-weight:600; line-height:1.04; color:${INK}; }
.rx-root .header-title em { font-style:italic; color:${GOLD}; }
.rx-root .header-stats { text-align:right; }
.rx-root .stat-num { font-size:28px; font-weight:700; line-height:1; }
.rx-root .stat-label { font-size:10px; color:${SUB}; letter-spacing:1px; }
.rx-root .phase-bar-row { display:flex; gap:4px; margin-top:16px; }
.rx-root .phase-bar { height:5px; border-radius:3px; transition:opacity .3s; }
.rx-root .phase-info { margin-top:8px; font-size:12px; color:${SUB}; }
.rx-root .tabs { display:flex; border-bottom:2px solid ${LINE}; background:#fffaf3; position:sticky; top:0; z-index:10; }
.rx-root .tab-btn { flex:1; padding:13px 0; background:none; border:none; border-bottom:3px solid transparent; color:${SUB}; font-size:13.5px; font-weight:600; cursor:pointer; font-family:inherit; transition:color .2s; margin-bottom:-2px; }
.rx-root .tab-btn.active { color:${GOLD}; border-bottom-color:${GOLD}; }
.rx-root .content { padding:20px; }
.rx-root .section-label { font-size:11px; color:${SUB}; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; font-weight:700; }
.rx-root .serif { font-family:${SERIF}; font-weight:600; }
.rx-root .technique-card { border-radius:18px; padding:20px; margin-bottom:20px; box-shadow:3px 3px 0 rgba(26,18,8,0.06); }
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
.rx-root .begin-btn { padding:12px 28px; border-radius:12px; border:none; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit; transition:all .15s; box-shadow:2px 2px 0 rgba(26,18,8,0.12); }
.rx-root .reset-btn { padding:12px 16px; border-radius:12px; background:#efe6d6; color:${SUB}; border:none; font-size:14px; cursor:pointer; font-family:inherit; }
.rx-root .done-btn { width:100%; padding:13px; border-radius:12px; border:2px solid ${LINE}; background:#f3ece0; color:${SUB}; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit; transition:all .2s; }
.rx-root .step-list { margin-bottom:20px; }
.rx-root .step-item { display:flex; gap:12px; margin-bottom:12px; }
.rx-root .step-num { min-width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; border:2px solid; flex-shrink:0; }
.rx-root .step-text { font-size:14px; color:#4a3c28; line-height:1.6; }
.rx-root .insight-box { border-radius:10px; padding:12px 14px; margin-top:10px; border-left:4px solid; }
.rx-root .insight-label { font-size:11px; letter-spacing:1px; margin-bottom:4px; font-weight:800; }
.rx-root .insight-text { font-size:13px; color:#6a5a40; line-height:1.6; }
.rx-root .note-area { width:100%; background:${CARD}; border:2px solid ${LINE}; border-radius:12px; padding:12px 14px; color:${INK}; font-size:14px; line-height:1.6; min-height:90px; resize:vertical; font-family:inherit; outline:none; }
.rx-root .save-btn { margin-top:8px; padding:10px 20px; border-radius:10px; background:#efe6d6; border:none; color:#7a5a1e; font-size:13px; font-weight:700; cursor:pointer; font-family:inherit; }
.rx-root .saved-txt { margin-left:10px; font-size:12px; color:#2e8b57; font-weight:700; }
.rx-root .week-row { margin-bottom:14px; }
.rx-root .week-label-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.rx-root .week-label { font-size:11px; font-weight:800; min-width:52px; }
.rx-root .week-technique { font-size:11px; color:${FAINT}; }
.rx-root .day-grid { display:flex; gap:6px; }
.rx-root .day-btn { flex:1; aspect-ratio:1; border-radius:9px; border:2px solid ${LINE}; background:${CARD}; color:${FAINT}; font-size:13px; font-weight:800; cursor:pointer; position:relative; display:flex; align-items:center; justify-content:center; font-family:inherit; transition:all .15s; }
.rx-root .day-btn.future-day { background:#f3ece0; color:#d8cab4; cursor:default; }
.rx-root .day-dot { position:absolute; top:4px; right:4px; width:5px; height:5px; border-radius:50%; }
.rx-root .legend-box { margin-top:16px; padding:14px; background:${CARD}; border-radius:12px; border:2px solid ${LINE}; font-size:13px; color:${SUB}; }
.rx-root .ghost-pill { font-size:11px; color:${SUB}; background:${CARD}; border:2px solid ${LINE}; border-radius:9px; padding:6px 12px; cursor:pointer; font-family:inherit; font-weight:700; }
.rx-root .principle-card { background:${CARD}; border:2px solid ${LINE}; border-radius:16px; padding:16px; margin-bottom:20px; }
.rx-root .principle-item { display:flex; gap:12px; margin-bottom:12px; }
.rx-root .principle-icon { font-size:20px; }
.rx-root .principle-title { font-size:13.5px; font-weight:800; color:${INK}; margin-bottom:2px; }
.rx-root .principle-text { font-size:13px; color:${SUB}; line-height:1.55; }
.rx-root .phase-guide-card { border-radius:16px; padding:16px; margin-bottom:14px; border:2px solid; }
.rx-root .phase-guide-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.rx-root .phase-guide-sub { font-size:11px; letter-spacing:2px; text-transform:uppercase; font-weight:800; }
.rx-root .phase-guide-name { font-family:${SERIF}; font-weight:600; font-size:23px; color:${INK}; margin-top:2px; }
.rx-root .phase-guide-dur { font-size:12px; color:${FAINT}; margin-bottom:10px; }
.rx-root .phase-step { font-size:13px; color:#6a5a40; line-height:1.6; padding-left:16px; position:relative; margin-bottom:6px; }
.rx-root .phase-step::before { content:'▸'; position:absolute; left:0; font-size:11px; color:${GOLD}; }
.rx-root .phase-tip { margin-top:10px; padding:10px 12px; background:#fbf5ec; border-radius:9px; font-size:12px; color:#6a5a40; border-left:4px solid; }
.rx-root .dos-head { font-size:13px; letter-spacing:2px; text-transform:uppercase; margin-bottom:12px; font-weight:800; }
.rx-root .do-card { display:flex; gap:12px; margin-bottom:14px; border-radius:12px; padding:14px; border:2px solid; }
.rx-root .do-icon { font-size:22px; }
.rx-root .do-title { font-size:13.5px; font-weight:800; margin-bottom:3px; }
.rx-root .do-text { font-size:13px; color:#6a5a40; line-height:1.5; }
.rx-root .checklist-item { display:flex; gap:10px; margin-bottom:10px; font-size:13px; color:${SUB}; line-height:1.5; }
.rx-root .check-num { min-width:22px; height:22px; border:2px solid ${LINE}; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:11px; color:${GOLD}; flex-shrink:0; font-weight:800; }
.rx-root .disclaimer { margin-top:18px; font-size:11.5px; color:${FAINT}; line-height:1.5; text-align:center; padding:0 8px; }
.rx-root .modal-overlay { position:fixed; inset:0; background:rgba(26,18,8,0.45); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
.rx-root .modal { background:${CARD}; border:2px solid #1a1208; border-radius:18px; padding:26px; width:100%; max-width:340px; box-shadow:6px 6px 0 rgba(26,18,8,0.18); }
.rx-root .modal-title { font-family:${SERIF}; font-weight:600; font-size:26px; color:${INK}; margin-bottom:8px; }
.rx-root .modal-sub { font-size:13px; color:${SUB}; margin-bottom:20px; line-height:1.6; }
.rx-root .date-input { width:100%; background:#fff; border:2px solid ${LINE}; border-radius:10px; padding:12px 14px; color:${INK}; font-size:15px; font-family:inherit; margin-bottom:16px; outline:none; }
.rx-root .modal-btns { display:flex; gap:10px; }
.rx-root .cancel-btn { flex:1; padding:12px; border-radius:10px; background:#efe6d6; border:none; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.rx-root .confirm-btn { flex:2; padding:12px; border-radius:10px; background:linear-gradient(135deg,#c89a4a,${GOLD}); border:none; color:#fff; font-size:14px; font-weight:800; cursor:pointer; font-family:inherit; }
.rx-root .empty-state { text-align:center; padding:44px 0; }
.rx-root .empty-emoji { font-size:48px; margin-bottom:16px; }
.rx-root .empty-title { font-family:${SERIF}; font-weight:600; font-size:27px; color:${INK}; margin-bottom:8px; }
.rx-root .empty-sub { color:${SUB}; font-size:14px; margin-bottom:24px; line-height:1.6; max-width:320px; margin-left:auto; margin-right:auto; }
.rx-root .start-btn { background:linear-gradient(135deg,#c89a4a,${GOLD}); color:#fff; border:none; border-radius:12px; padding:14px 32px; font-size:15px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:3px 3px 0 #1a1208; }
.rx-root .go-btn { background:#efe6d6; color:#7a5a1e; border:none; border-radius:10px; padding:12px 24px; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.rx-root .rx-heading-ink { color:${INK}; }
.rx-root .begin-btn--paused { background:#efe6d6; color:#7a6a52; }

[data-home-theme='dark'] .rx-root { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .rx-heading-ink { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .begin-btn--paused { background:#332818; color:#c9b384; }
[data-home-theme='dark'] .rx-root .rx-back { background:#241c10; border-color:rgba(212,168,80,0.3); color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .header { background:linear-gradient(180deg,#1f1810 0%,var(--color-training-palette-surface) 100%); }
[data-home-theme='dark'] .rx-root .header-title { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .header-title em { color:#e8ac4e; }
[data-home-theme='dark'] .rx-root .stat-label { color:#c9b384; }
[data-home-theme='dark'] .rx-root .phase-info { color:#c9b384; }
[data-home-theme='dark'] .rx-root .tabs { background:#1f1810; border-color:rgba(212,168,80,0.25); }
[data-home-theme='dark'] .rx-root .tab-btn { color:#c9b384; }
[data-home-theme='dark'] .rx-root .tab-btn.active { color:#e8ac4e; border-bottom-color:#e8ac4e; }
[data-home-theme='dark'] .rx-root .section-label { color:#c9b384; }
[data-home-theme='dark'] .rx-root .technique-name { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .technique-duration { color:#c9b384; }
[data-home-theme='dark'] .rx-root .timer-display { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .timer-target { color:#8f7d58; }
[data-home-theme='dark'] .rx-root .min-btn { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .rx-root .min-btn.active-min { background:color-mix(in srgb, var(--phase-color) 22%, #14100a); }
[data-home-theme='dark'] .rx-root .reset-btn { background:#332818; color:#c9b384; }
[data-home-theme='dark'] .rx-root .done-btn { background:#332818; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .rx-root .step-text { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .insight-text { color:#c9b384; }
[data-home-theme='dark'] .rx-root .note-area { background:#211a10; border-color:rgba(212,168,80,0.25); color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .save-btn { background:#332818; color:#e8ac4e; }
[data-home-theme='dark'] .rx-root .week-technique { color:#8f7d58; }
[data-home-theme='dark'] .rx-root .day-btn { background:#211a10; border-color:rgba(212,168,80,0.25); color:#8f7d58; }
[data-home-theme='dark'] .rx-root .day-btn.future-day { background:#1a140c; color:#4a3c28; }
[data-home-theme='dark'] .rx-root .legend-box { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .rx-root .ghost-pill { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .rx-root .principle-card { background:#211a10; border-color:rgba(212,168,80,0.22); }
[data-home-theme='dark'] .rx-root .principle-title { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .principle-text { color:#c9b384; }
[data-home-theme='dark'] .rx-root .phase-guide-name { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .phase-guide-dur { color:#8f7d58; }
[data-home-theme='dark'] .rx-root .phase-step { color:#c9b384; }
[data-home-theme='dark'] .rx-root .phase-tip { background:#1a140c; color:#c9b384; }
[data-home-theme='dark'] .rx-root .do-text { color:#c9b384; }
[data-home-theme='dark'] .rx-root .checklist-item { color:#c9b384; }
[data-home-theme='dark'] .rx-root .check-num { border-color:rgba(212,168,80,0.3); }
[data-home-theme='dark'] .rx-root .disclaimer { color:#8f7d58; }
[data-home-theme='dark'] .rx-root .modal-overlay { background:rgba(0,0,0,0.6); }
[data-home-theme='dark'] .rx-root .modal { background:#211a10; border-color:rgba(212,168,80,0.35); }
[data-home-theme='dark'] .rx-root .modal-title { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .modal-sub { color:#c9b384; }
[data-home-theme='dark'] .rx-root .date-input { background:#1a140c; border-color:rgba(212,168,80,0.25); color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .cancel-btn { background:#332818; color:#c9b384; }
[data-home-theme='dark'] .rx-root .empty-title { color:#f0e2c0; }
[data-home-theme='dark'] .rx-root .empty-sub { color:#c9b384; }
[data-home-theme='dark'] .rx-root .go-btn { background:#332818; color:#e8ac4e; }
`;

/* ── Wellbeing landing — practices grouped into categories ── */
// The practice registry (each opens a full-screen practice). Categories below
// reference these by id; a practice may appear in more than one category.
const RELAX_PRACTICES = [
  { id: 'mbsr', icon: '🧘', color: '#c47a3e',
    title: '8-Week MBSR', titleAr: 'اليقظة الذهنية — ٨ أسابيع',
    sub: 'Mindfulness-Based Stress Reduction — a guided daily practice with a timer, an 8-week tracker and a full guide.',
    subAr: 'برنامج اليقظة الذهنية للحدّ من التوتر — ممارسة يومية موجّهة مع مؤقّت ومتابعة ٨ أسابيع ودليل كامل.' },
  { id: 'breathe', icon: '🫁', color: '#5aa9c8',
    title: 'Breathe', titleAr: 'تنفّس',
    sub: 'A guided breathing pacer — box, 4-7-8, coherent & physiological-sigh patterns.',
    subAr: 'موجّه تنفّس متحرّك — أنماط الصندوق و٤-٧-٨ والمتناغم والتنهيدة.' },
  { id: 'grounding', icon: '🖐️', color: '#6fae7a',
    title: '5-4-3-2-1 Grounding', titleAr: 'تأريض ٥-٤-٣-٢-١',
    sub: 'Break acute anxiety by walking through your five senses in the moment.',
    subAr: 'اكسر القلق الحاد بالمرور على حواسك الخمس في اللحظة.' },
  { id: 'pmr', icon: '💪', color: '#b07ac8',
    title: 'Muscle Relaxation', titleAr: 'استرخاء العضلات',
    sub: 'Progressive tense-and-release through the body — great for tension and sleep.',
    subAr: 'شدّ وإرخاء تدريجي للجسم — ممتاز للتوتر والنوم.' },
  { id: 'ikigai', icon: '🎯', color: '#c9a24b',
    title: 'Ikigai', titleAr: 'إيكيغاي',
    sub: 'Reflect on what you love, what you\'re good at, what the world needs, and what you can offer — and glimpse your purpose.',
    subAr: 'تأمّل فيما تحبّ وما تجيد وما يحتاجه العالم وما يمكنك تقديمه — ولمح معنى حياتك.' },
  { id: 'personality-quiz', icon: '🧭', color: '#c47a3e',
    title: 'Big Five Personality', titleAr: 'الشخصية — العوامل الخمسة',
    sub: 'A validated 10-question science quiz (TIPI) mapping your Openness, Conscientiousness, Extraversion, Agreeableness & Neuroticism — with the research behind each trait.',
    subAr: 'اختبار علمي موثّق من ١٠ أسئلة (TIPI) يقيس انفتاحك وضميرك الحي وانبساطك وتوافقك واستقرارك العاطفي — مع الأبحاث وراء كل سمة.' },
  { id: 'relationship-quiz', icon: '💞', color: '#c86f8f',
    title: 'Attachment Style', titleAr: 'نمط التعلّق',
    sub: 'A validated 12-question quiz (ECR-S) revealing your attachment style in close relationships, grounded in decades of attachment research.',
    subAr: 'اختبار موثّق من ١٢ سؤالاً (ECR-S) يكشف نمط تعلّقك في العلاقات الحميمة، مبنيّ على عقود من أبحاث نظرية التعلّق.' },
  { id: 'sleep-sounds', icon: '🌧️', color: '#7b86c8',
    title: 'Sleep Sounds', titleAr: 'أصوات النوم',
    sub: 'A looping ambient sound to play while you wind down or drift off.',
    subAr: 'صوت محيطي متكرر لتشغيله أثناء الاسترخاء أو النوم.' },
];

// Five wellbeing categories. `items` lists practice ids; `soon` marks a category
// whose practices are still to come (with a teaser of what's planned).
const CATEGORIES = [
  { id: 'calm', icon: '🌿', color: '#5aa07a',
    title: 'Stress & Calm', titleAr: 'التوتر والهدوء',
    tag: 'Settle your body and mind in the moment.', tagAr: 'هدّئ جسدك وعقلك في اللحظة.',
    items: ['breathe', 'grounding', 'mbsr'] },
  { id: 'sleep', icon: '🌙', color: '#7b86c8',
    title: 'Sleep', titleAr: 'النوم',
    tag: 'Wind down and drift off.', tagAr: 'استرخِ واغفُ بسلام.',
    items: ['pmr', 'breathe', 'sleep-sounds'],
    programSoon: 'A guided wind-down sleep program is coming soon.',
    programSoonAr: 'برنامج نوم موجّه للاسترخاء — قريباً.' },
  { id: 'meaning', icon: '✨', color: '#c9a24b',
    title: 'Meaning', titleAr: 'المعنى',
    tag: 'Values, gratitude and purpose.', tagAr: 'القيم والامتنان والغاية.',
    items: ['ikigai'],
    programSoon: 'A guided values journal and gratitude program are coming soon.',
    programSoonAr: 'دفتر قيم موجّه وبرنامج امتنان — قريباً.' },
  { id: 'relationships', icon: '❤️', color: '#c86f8f',
    title: 'Relationships', titleAr: 'العلاقات',
    tag: 'Kindness and connection.', tagAr: 'اللطف والتواصل.',
    items: ['relationship-quiz'],
    programSoon: 'A loving-kindness meditation and appreciation program is coming soon.',
    programSoonAr: 'تأمّل المحبّة اللطيفة وبرنامج ممارسات التقدير — قريباً.' },
  { id: 'personality', icon: '🧭', color: '#c47a3e',
    title: 'Personality', titleAr: 'الشخصية',
    tag: 'Get to know yourself.', tagAr: 'تعرّف على نفسك.',
    items: ['personality-quiz'],
    programSoon: 'A deeper, guided Big Five program is coming soon.',
    programSoonAr: 'برنامج موجّه أعمق للعوامل الخمسة الكبرى — قريباً.' },
];

// Which practices are structured, multi-session PROGRAMS (vs quick, single-use).
const PROGRAM_IDS = new Set(['mbsr']);

// Loose, hand-placed scatter for the Wellbeing constellation — deliberately
// NOT a hub-and-spoke grid (that's Training's signature) and NOT an orbit
// around a center (that's Home's). Categories here are independent, so
// nothing connects them; each just drifts on its own slow, gentle timer.
// Positions assume the FULL screen is the canvas (not a boxed card) — y
// leaves room for the header above (~0-26%) and the hint text/tab bar
// below (~86-100%).
const CAT_LAYOUT = {
  calm:          { x: 24, y: 32, size: 96, dur: 7.4, delay: 0 },
  sleep:         { x: 74, y: 40, size: 78, dur: 8.6, delay: 1.6 },
  meaning:       { x: 45, y: 55, size: 88, dur: 7.9, delay: 3.1 },
  relationships: { x: 78, y: 68, size: 76, dur: 9.2, delay: 0.8 },
  personality:   { x: 22, y: 78, size: 80, dur: 8.1, delay: 2.3 },
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

function RelaxMenu({ isAr, onHome, onOpen, playSfx }) {
  const { appTheme } = useApp();
  const dark = appTheme !== 'light';
  const [openCat, setOpenCat] = useState(null); // category id, or 'favorites'
  const [group, setGroup] = useState('program'); // 'program' | 'quick'
  const [favs, setFavs] = useState(() => rxLoad(FAV_KEY, []));
  const [orders, setOrders] = useState(() => rxLoad(ORDER_KEY, {}));
  const favSet = useMemo(() => new Set(favs), [favs]);
  const byId = (id) => RELAX_PRACTICES.find((p) => p.id === id);
  const cat = openCat && openCat !== 'favorites' ? CATEGORIES.find((c) => c.id === openCat) : null;

  const toggleFav = (id) => {
    playSfx?.('click');
    setFavs((f) => { const nx = f.includes(id) ? f.filter((x) => x !== id) : [...f, id]; rxSave(FAV_KEY, nx); return nx; });
  };
  const commitOrder = (key, ids) => {
    playSfx?.('click');
    if (key === 'favorites') { setFavs(ids); rxSave(FAV_KEY, ids); return; }
    setOrders((o) => { const nx = { ...o, [key]: ids }; rxSave(ORDER_KEY, nx); return nx; });
  };

  // opening a category picks the first non-empty group (Programs, then Quick)
  const openCategory = (c) => {
    if (c.items) setGroup(c.items.some((id) => PROGRAM_IDS.has(id)) ? 'program' : 'quick');
    setOpenCat(c.id);
  };

  // A practice card: tap opens it, tap the star to (un)favourite. `justDragged`
  // (from ReorderList) swallows the click that lands right after a drag-drop.
  const renderCard = (o, justDragged) => {
    const faved = favSet.has(o.id);
    return (
      <div
        className="rx-menu-card" role="button" tabIndex={0} style={{ borderColor: `${o.color}55` }}
        onClick={() => { if (justDragged && justDragged()) return; onOpen(o.id); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(o.id); } }}
      >
        <span className="rx-menu-ic" style={{ background: `${o.color}1f` }}>{o.icon}</span>
        <span className="rx-menu-body">
          <span className="rx-menu-title">{isAr ? o.titleAr : o.title}</span>
          <span className="rx-menu-sub">{isAr ? o.subAr : o.sub}</span>
        </span>
        <span className="rx-menu-tail">
          <span
            className={`rx-fav${faved ? ' on' : ''}`} role="button" tabIndex={0}
            aria-label={faved ? (isAr ? 'إزالة من المفضّلة' : 'Remove favourite') : (isAr ? 'إضافة إلى المفضّلة' : 'Add favourite')}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); toggleFav(o.id); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleFav(o.id); } }}
          >{faved ? '★' : '☆'}</span>
          <span className="rx-menu-chev" style={{ color: o.color }}>{isAr ? '‹' : '›'}</span>
        </span>
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
  const detailHeader = (icon, color, title, tag, onBack) => (
    <div className="header">
      <button className="rx-back" onClick={onBack} aria-label="Back">‹</button>
      <div style={{ paddingInlineStart: 42 }}>
        <div className="header-sub" style={{ color }}>{isAr ? 'العافية' : 'Wellbeing'}</div>
        <div className="rx-cat-hd">
          <span className="rx-cat-ic rx-cat-ic--hd" style={{ background: `${color}22`, color }}>{icon}</span>
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
      <div className="rx-root" dir={isAr ? 'rtl' : 'ltr'}>
        <style>{MENU_CSS}</style>
        <UniverseStage accent="wellbeing" dark={dark} />
        <div className="rx-app">
          {detailHeader('⭐', FAV_GOLD, isAr ? 'المفضّلة' : 'Favorites', favItems.length ? (isAr ? 'اضغط مطوّلاً لإعادة الترتيب.' : 'Press and hold to reorder.') : (isAr ? 'ممارساتك المفضّلة.' : 'Your go-to practices.'), () => setOpenCat(null))}
          <div className="content">
            {favItems.length
              ? list(favItems, 'favorites')
              : soonState('⭐', '#fdeecb', isAr ? 'لا مفضّلة بعد' : 'No favorites yet', isAr ? 'اضغط على النجمة ☆ في أي ممارسة لإضافتها هنا.' : 'Tap the ☆ star on any practice to add it here.')}
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
    return (
      <div className="rx-root" dir={isAr ? 'rtl' : 'ltr'}>
        <style>{MENU_CSS}</style>
        <UniverseStage accent="wellbeing" dark={dark} />
        <div className="rx-app">
          {detailHeader(cat.icon, cat.color, isAr ? cat.titleAr : cat.title, isAr ? cat.tagAr : cat.tag, () => setOpenCat(null))}
          <div className="content">
            {cat.items ? (
              <>
                <div className="rx-seg" style={{ '--seg': cat.color }}>
                  <button className={`rx-seg-btn${group === 'program' ? ' on' : ''}`} onClick={() => setGroup('program')}>{isAr ? 'برامج' : 'Programs'}</button>
                  <button className={`rx-seg-btn${group === 'quick' ? ' on' : ''}`} onClick={() => setGroup('quick')}>{isAr ? 'سريعة' : 'Quick'}</button>
                </div>
                {activeItems.length
                  ? list(activeItems, listKey)
                  : soonState(group === 'program' ? '🗺️' : '⚡', `${cat.color}1f`, isAr ? 'قريباً' : 'Coming soon', emptyDesc)}
              </>
            ) : soonState(cat.icon, `${cat.color}1f`, isAr ? 'قريباً' : 'Coming soon', isAr ? cat.soonAr : cat.soon)}
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
  const skyText = dark ? '#f4ecd8' : INK;
  const skyTextShadow = dark ? '0 1px 4px rgba(0,0,0,0.8)' : '0 1px 3px rgba(255,255,255,0.85)';
  const skyMuted = dark ? 'rgba(244,236,216,0.7)' : 'rgba(45,34,16,0.65)';
  return (
    <div
      className="rx-root"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ overflow: 'hidden', background: 'transparent' }}
    >
      <style>{MENU_CSS}</style>
      <UniverseStage accent="wellbeing" dark={dark} />

      <button
        type="button"
        onClick={onHome}
        aria-label="Back"
        className="rx-fade"
        style={{
          position: 'absolute', top: 'calc(14px + env(safe-area-inset-top))', insetInlineStart: 14, zIndex: 5,
          width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${dark ? 'rgba(244,236,216,0.28)' : 'rgba(45,34,16,0.22)'}`,
          background: dark ? 'rgba(20,18,14,0.4)' : 'rgba(255,253,248,0.5)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: dark ? '0 4px 16px rgba(0,0,0,0.35)' : '0 4px 14px rgba(120,90,40,0.14)',
          color: skyText, fontSize: 20, cursor: 'pointer',
        }}
      >
        ‹
      </button>
      <div className="rx-fade" style={{
        position: 'absolute', top: 'calc(20px + env(safe-area-inset-top))', left: 0, right: 0, zIndex: 3,
        textAlign: 'center', padding: '0 60px', pointerEvents: 'none',
      }}>
        <div style={{
          fontSize: 10.5, letterSpacing: 4, fontWeight: 800, textTransform: 'uppercase',
          color: dark ? 'rgba(255,224,150,0.8)' : '#96742e',
        }}>
          {isAr ? 'ركن العافية' : 'Wellbeing pillar'}
        </div>
        <div style={{
          fontFamily: isAr ? "'Cairo', sans-serif" : "'Cinzel', 'Cormorant Garamond', serif",
          fontSize: isAr ? 30 : 30, fontWeight: 700, letterSpacing: isAr ? 0 : 1.6,
          textTransform: isAr ? 'none' : 'uppercase',
          color: skyText, textShadow: skyTextShadow, lineHeight: 1.15, marginTop: 3,
        }}>
          {isAr ? 'العافية' : 'Wellbeing'}
        </div>
        <div style={{ fontSize: 12.5, color: skyMuted, marginTop: 3 }}>
          {isAr ? 'اختر مجالاً.' : 'Choose an area.'}
        </div>
      </div>

      <button
        type="button"
        onClick={() => { playSfx?.('click'); setOpenCat('favorites'); }}
        className="rx-fade"
        style={{
          position: 'absolute', top: 'calc(112px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)',
          zIndex: 3, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', maxWidth: 'min(92vw, 420px)',
          borderRadius: 100, border: `1px solid ${dark ? 'rgba(255,214,138,0.4)' : 'rgba(154,116,46,0.4)'}`,
          background: dark ? 'rgba(26,22,16,0.42)' : 'rgba(255,252,246,0.55)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          boxShadow: dark ? '0 6px 20px rgba(0,0,0,0.35)' : '0 6px 18px rgba(120,90,40,0.16)',
          color: dark ? '#ffe9ae' : '#7a5c10',
          cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 15 }}>⭐</span>
        {favs.length
          ? (isAr ? `${favs.length} ممارسة محفوظة` : `${favs.length} saved practice${favs.length > 1 ? 's' : ''}`)
          : (isAr ? 'المفضّلة' : 'Favorites')}
        <span aria-hidden="true" style={{ color: FAV_GOLD }}>{isAr ? '‹' : '›'}</span>
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
              left: `${p.x}%`, top: `${p.y}%`, zIndex: 2,
              animationDuration: `${p.dur}s`, animationDelay: `-${p.delay}s`,
            }}
          >
            <span className="rx-planet-in" style={{ '--i': idx }}>
              <span className="rx-orb-wrap" style={{ width: p.size, height: p.size }}>
                <span aria-hidden="true" className="rx-orb-aura" style={{
                  background: `radial-gradient(circle, ${c.color}5e 0%, ${c.color}1f 48%, transparent 72%)`,
                }} />
                {c.id === 'sleep' && (
                  <span aria-hidden="true" className="rx-orb-ring" style={{ borderColor: c.color }} />
                )}
                <span className="rx-orb" style={{ background: planetIconUrl(c.id) ? `radial-gradient(circle, ${c.color}42 0%, ${c.color}20 55%, transparent 76%)` : c.color }}>
                  {planetIconUrl(c.id) ? (
                    <img
                      src={planetIconUrl(c.id)}
                      alt=""
                      draggable={false}
                      style={{
                        width: '80%', height: '80%', objectFit: 'contain', filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))',
                        pointerEvents: 'none', WebkitUserDrag: 'none', WebkitTouchCallout: 'none', userSelect: 'none',
                      }}
                    />
                  ) : (
                    <>
                      <span aria-hidden="true" className="rx-orb-texture" style={planetTextureLayerStyle(0.4)} />
                      <span aria-hidden="true" className="rx-orb-shade" />
                      <span aria-hidden="true" className="rx-orb-sheen" />
                      <span className="rx-orb-icon" style={{ fontSize: p.size * 0.34 }}>{c.icon}</span>
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
                  background: dark ? 'rgba(255,255,255,0.1)' : 'rgba(45,34,16,0.08)',
                  borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(45,34,16,0.2)',
                }}>
                  {isAr ? 'قريباً' : 'SOON'}
                </span>
              )}
            </span>
          </button>
        );
      })}

      <p className="rx-fade" style={{
        position: 'absolute', bottom: 'calc(94px + env(safe-area-inset-bottom))', left: 0, right: 0,
        textAlign: 'center', fontSize: 12, color: skyMuted, margin: 0, padding: '0 20px', zIndex: 2,
      }}>
        {isAr ? 'المس أي كوكب لاستكشاف مجاله.' : 'Tap any planet to explore that area.'}
      </p>

      <style>{`
        .rx-fade { animation: rxFade .7s ease both; }
        @keyframes rxFade { from { opacity:0; } to { opacity:1; } }
        .rx-planet { position:absolute; background:none; border:none; padding:0; cursor:pointer;
          animation-name: rxFloat; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }
        @keyframes rxFloat { 0%,100% { transform: translate(-50%,-50%) translateY(0); } 50% { transform: translate(-50%,-50%) translateY(-9px); } }
        .rx-planet-in { display:flex; flex-direction:column; align-items:center; gap:7px; width:118px;
          animation: rxPop .7s cubic-bezier(.22,.9,.32,1.28) both; animation-delay: calc(var(--i,0) * 90ms); }
        @keyframes rxPop { from { opacity:0; transform: scale(.65) translateY(12px); } to { opacity:1; transform: none; } }
        .rx-orb-wrap { position:relative; display:flex; align-items:center; justify-content:center; }
        .rx-orb-aura { position:absolute; inset:-30%; border-radius:50%;
          animation: rxBreathe 5.5s ease-in-out infinite; }
        @keyframes rxBreathe { 0%,100% { opacity:.6; transform:scale(1); } 50% { opacity:1; transform:scale(1.1); } }
        .rx-orb { position:relative; width:100%; height:100%; border-radius:50%; overflow:hidden;
          display:flex; align-items:center; justify-content:center;
          box-shadow: 0 12px 30px rgba(8,6,4,.28), inset 0 -8px 18px rgba(0,0,0,.14), inset 0 2px 10px rgba(255,255,255,.28);
          transition: transform .28s cubic-bezier(.3,.9,.4,1.2); }
        .rx-planet:hover .rx-orb { transform: scale(1.06); }
        .rx-planet:active .rx-orb { transform: scale(.95); }
        .rx-orb-shade { position:absolute; inset:0; border-radius:50%;
          background: radial-gradient(circle at 71% 78%, rgba(22,14,6,.4) 0%, rgba(22,14,6,.12) 36%, transparent 58%); }
        .rx-orb-sheen { position:absolute; inset:0; border-radius:50%;
          background: radial-gradient(ellipse 46% 34% at 30% 20%, rgba(255,255,255,.8) 0%, rgba(255,255,255,.14) 52%, transparent 68%); }
        .rx-orb-texture { position:absolute; inset:0; border-radius:50%; pointer-events:none; }
        .rx-orb-icon { position:relative; filter: drop-shadow(0 2px 5px rgba(0,0,0,.4)); }
        .rx-orb-ring { position:absolute; width:156%; height:42%; border:1.5px solid; border-radius:50%;
          transform: rotate(-24deg); opacity:.5; }
        .rx-spark { position:absolute; font-size:11px; color:#ffd98a; line-height:1;
          text-shadow: 0 0 8px rgba(255,200,90,.95); animation: rxTwinkle 2.8s ease-in-out infinite; }
        .rx-spark--b { font-size:8px; animation-delay:1.3s; }
        .rx-planet-name { font-family:Outfit,${SANS}; font-weight:800; font-size:15px;
          letter-spacing:.02em; line-height:1.15; text-align:center; }
        .rx-soon-pill { font-size:9.5px; font-weight:800; letter-spacing:1.4px; border:1px solid;
          border-radius:100px; padding:2.5px 9px; backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); }
        @media (prefers-reduced-motion: reduce) {
          .rx-planet, .rx-planet-in, .rx-orb-aura, .rx-star, .rx-blob, .rx-shoot, .rx-spark, .rx-fade { animation:none !important; }
        }
      `}</style>
    </div>
  );
}

export default function RelaxScreen({ entry = 'menu' } = {}) {
  const { switchTab, playSfx, currentLang, setImmersive } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState(() => {
    if (entry === 'daily') return 'daily';
    try {
      if (sessionStorage.getItem(OPEN_DAILY_KEY) === '1') {
        sessionStorage.removeItem(OPEN_DAILY_KEY);
        return 'daily';
      }
    } catch { /* ignore */ }
    return 'menu';
  });
  const [returnTo, setReturnTo] = useState(entry === 'daily' ? 'daily' : 'menu');
  const back = () => { playSfx?.('click'); setView(returnTo); setReturnTo(entry === 'daily' ? 'daily' : 'menu'); };

  // Hide the bottom tab bar inside a practice — the menu / daily landing are
  // the only "main pages".
  useEffect(() => {
    setImmersive('relax', view !== 'menu' && view !== 'daily');
    return () => setImmersive('relax', false);
  }, [view, setImmersive]);
  const openPractice = (id, from = 'menu') => {
    playSfx?.('click');
    setReturnTo(from);
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
  return (
    <RelaxMenu
      isAr={isAr}
      playSfx={playSfx}
      onHome={() => { playSfx?.('click'); switchTab('habits'); }}
      onOpen={(id) => openPractice(id, 'menu')}
    />
  );
}

const MENU_CSS = `
/* Wellbeing category/detail landings — Home universe cosmos glass */
.rx-root { position:fixed; inset:0; z-index:50; overflow-y:auto; -webkit-overflow-scrolling:touch;
  background:transparent; color:#f0e2c0; font-family:${SANS}; }
.rx-root *, .rx-root *::before, .rx-root *::after { box-sizing:border-box; }
.rx-root .rx-app { max-width:480px; margin:0 auto; padding-bottom:110px; position:relative; z-index:3; }
.rx-root .rx-back { position:absolute; top:max(14px, env(safe-area-inset-top)); left:12px; z-index:20; width:36px; height:36px; border-radius:999px;
  border:1px solid rgba(232,172,78,0.38); background:rgba(14,12,24,0.78); color:#e8d4a8; font-size:22px; line-height:1; cursor:pointer;
  box-shadow:0 4px 14px rgba(0,0,0,0.35); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
.rx-root .header { padding:max(24px, calc(12px + env(safe-area-inset-top))) 20px 18px; background:transparent; }
.rx-root .header-sub { font-size:11px; letter-spacing:3px; color:#e8ac4e; text-transform:uppercase; margin-bottom:4px; font-weight:700; }
.rx-root .header-title { font-family:Outfit,${SANS}; font-size:28px; font-weight:800; line-height:1.1; color:#f0e2c0;
  text-shadow:0 1px 0 rgba(255,220,120,0.2), 0 0 14px rgba(232,172,78,0.3); }
.rx-root .menu-tag { font-size:13px; color:#b9a878; margin-top:6px; }
.rx-root .content { padding:20px; }
.rx-root .rx-menu-card { display:flex; align-items:center; gap:14px; width:100%; text-align:left;
  background:rgba(14,12,24,0.72); border:1px solid rgba(232,172,78,0.34); border-radius:16px; padding:16px; margin-bottom:14px;
  cursor:pointer; font-family:inherit; box-shadow:0 4px 18px rgba(0,0,0,0.35);
  backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); transition:transform .1s, border-color .15s; }
.rx-root .rx-menu-card:active { transform:translateY(1px); }
.rx-root .rx-menu-ic { font-size:30px; flex-shrink:0; width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; }
.rx-root .rx-menu-body { display:flex; flex-direction:column; gap:4px; flex:1; }
.rx-root .rx-menu-title { font-family:Outfit,${SANS}; font-weight:800; font-size:18px; color:#f0e2c0; }
.rx-root .rx-menu-sub { font-size:12.5px; color:#b9a878; line-height:1.5; }
.rx-root .rx-menu-chev { font-size:28px; font-weight:700; flex-shrink:0; color:#e8ac4e; }
.rx-root .rx-menu-more { text-align:center; font-size:12px; color:#8a7a58; margin-top:6px; }
.rx-root .rx-cat-tile { display:flex; align-items:center; gap:14px; width:100%; text-align:start;
  background:rgba(14,12,24,0.72); border:1px solid rgba(232,172,78,0.34); border-radius:16px; padding:16px; margin-bottom:14px;
  cursor:pointer; font-family:inherit; box-shadow:0 4px 18px rgba(0,0,0,0.35); transition:transform .1s; }
.rx-root .rx-cat-tile:active { transform:translateY(1px); }
.rx-root .rx-cat-ic { width:56px; height:56px; border-radius:15px; display:flex; align-items:center; justify-content:center; font-size:30px; flex-shrink:0; }
.rx-root .rx-cat-ic--hd { width:40px; height:40px; border-radius:11px; font-size:22px; }
.rx-root .rx-cat-body { display:flex; flex-direction:column; gap:3px; flex:1; min-width:0; }
.rx-root .rx-cat-title { font-family:Outfit,${SANS}; font-weight:800; font-size:20px; color:#f0e2c0; line-height:1.1; }
.rx-root .rx-cat-tag { font-size:12.5px; color:#b9a878; line-height:1.4; }
.rx-root .rx-cat-meta { display:flex; align-items:center; gap:9px; flex-shrink:0; }
.rx-root .rx-cat-hd { display:flex; align-items:center; gap:11px; }
.rx-root .rx-seg { display:flex; gap:5px; background:rgba(14,12,24,0.55); border:1px solid rgba(232,172,78,0.28); border-radius:13px; padding:4px; margin-bottom:18px; }
.rx-root .rx-seg-btn { flex:1; padding:10px 0; border:none; background:none; border-radius:9px; font-family:inherit; font-size:13.5px; font-weight:800; color:#b9a878; cursor:pointer; transition:all .15s; }
.rx-root .rx-seg-btn.on { background:rgba(232,172,78,0.18); color:#f0e2c0; box-shadow:0 2px 8px rgba(0,0,0,0.25); }
.rx-root .rx-soon-badge { flex-shrink:0; font-size:10.5px; font-weight:800; letter-spacing:1px; text-transform:uppercase; color:#e8ac4e; background:rgba(232,172,78,0.14); border:1px solid rgba(232,172,78,0.4); border-radius:999px; padding:4px 11px; }
.rx-root .rx-soon-empty { text-align:center; padding:40px 16px; }
.rx-root .rx-soon-emoji { width:88px; height:88px; border-radius:24px; display:flex; align-items:center; justify-content:center; font-size:44px; margin:0 auto 18px; }
.rx-root .rx-soon-title { font-family:Outfit,${SANS}; font-weight:800; font-size:24px; color:#f0e2c0; margin-bottom:10px; }
.rx-root .rx-soon-desc { font-size:14px; color:#b9a878; line-height:1.6; max-width:320px; margin:0 auto; }
.rx-root .rx-menu-tail { display:flex; align-items:center; gap:5px; flex-shrink:0; }
.rx-root .rx-fav { width:34px; height:34px; display:flex; align-items:center; justify-content:center; font-size:20px; line-height:1; color:#8a7a58; cursor:pointer; border-radius:9px; user-select:none; -webkit-user-select:none; transition:transform .12s ease, color .12s ease; }
.rx-root .rx-fav:active { transform:scale(0.82); }
.rx-root .rx-fav.on { color:${FAV_GOLD}; }
.rx-root .rx-fav-count { min-width:22px; height:22px; padding:0 6px; border-radius:999px; background:rgba(232,172,78,0.2); color:${FAV_GOLD}; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.rx-root .rx-habit-badge { min-width:22px; height:22px; padding:0 6px; border-radius:999px; background:rgba(90,160,122,0.25); color:#9ed4b0; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center; }
.rx-root .rx-habit-badge--done { background:#5aa07a; color:#fff; }
.rx-root .rx-cat-divider { height:1px; background:rgba(232,172,78,0.22); margin:2px 2px 18px; }
.rx-root .rx-rl { position:relative; }
.rx-root .rx-rl-item { will-change:transform; }
.rx-root .rx-rl-item--drag .rx-menu-card { box-shadow:0 12px 26px rgba(0,0,0,0.45); border-color:#e8ac4e; cursor:grabbing; }
[dir='rtl'] .rx-root .header-title,
[dir='rtl'] .rx-root .rx-menu-title,
[dir='rtl'] .rx-root .rx-cat-title { font-family:Cairo,${SANS}; }
`;
