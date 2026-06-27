import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';

/*
 * Relaxation — 8-Week MBSR Tracker (the app's calm pillar).
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

export default function RelaxScreen() {
  const { switchTab, playSfx } = useApp();
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
          <button className="rx-back" onClick={() => switchTab('home')} aria-label="Back">‹</button>
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
                    <button className="begin-btn" onClick={toggleTimer} style={{ background: timerActive ? '#efe6d6' : `linear-gradient(135deg,${p.color},${p.color}cc)`, color: timerActive ? '#7a6a52' : '#fff' }}>
                      {timerActive ? '⏸ Pause' : timerSeconds > 0 ? '▶ Resume' : '▶ Begin session'}
                    </button>
                    {timerSeconds > 0 && <button className="reset-btn" onClick={resetTimer}>↺</button>}
                  </div>
                </div>

                <button className="done-btn" onClick={() => toggleDay(today)} style={{ background: completed[today] ? `${p.color}26` : '#f3ece0', borderColor: completed[today] ? p.color : '#e3d6c4', color: completed[today] ? p.color : '#8a7f6f' }}>
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
                <div className="serif" style={{ fontSize: 22, color: '#2d2210' }}>Your 8 weeks</div>
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
              <div className="serif" style={{ fontSize: 22, color: '#2d2210', marginBottom: 6 }}>The full protocol</div>
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
.rx-root { position:absolute; inset:0; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
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
`;
