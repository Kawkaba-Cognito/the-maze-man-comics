import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { INK, SUB, SERIF } from './PracticeShell';

/*
 * Sound Bath — a calming ambient soundscape synthesized live with the Web Audio
 * API (no audio files). A soft drone + gentle singing-bowl tones on a pentatonic
 * scale, with a slow swell. Non-medical.
 *
 * SAFETY: one AudioContext, started only on a user tap (Start). Every oscillator
 * is stopped and the context is closed on Finish / Back / unmount — nothing keeps
 * playing in the background, and all audio calls are wrapped in try/catch so a
 * refusal degrades to silence rather than crashing.
 */

const ACCENT = '#7b86c8';

const MOODS = [
  { id: 'warm', en: 'Warm', ar: 'دافئ', d: { en: 'Low & cosy', ar: 'منخفض ودافئ' }, root: 130.81, cutoff: 900, chimeMs: 5200, scale: [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3] },
  { id: 'airy', en: 'Airy', ar: 'رقيق', d: { en: 'Bright & open', ar: 'مشرق ومنفتح' }, root: 196.00, cutoff: 1600, chimeMs: 4200, scale: [1, 9 / 8, 4 / 3, 3 / 2, 15 / 8] },
  { id: 'deep', en: 'Deep', ar: 'عميق', d: { en: 'Slow & grounding', ar: 'بطيء ومُرسٍّ' }, root: 98.00, cutoff: 620, chimeMs: 6600, scale: [1, 6 / 5, 3 / 2, 9 / 5, 2] },
];
const MINUTES = [3, 5, 10, 15];
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function SoundBathPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [mood, setMood] = useState(MOODS[0]);
  const [minutes, setMinutes] = useState(5);
  const [volume, setVolume] = useState(0.6);
  const [phase, setPhase] = useState('setup'); // setup | run | done
  const [remaining, setRemaining] = useState(300);

  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const droneRef = useRef(null);
  const schedRef = useRef(null);

  const t = useMemo(() => ({
    title: isAr ? 'حمّام صوتي' : 'Sound Bath',
    pick: isAr ? 'اختر الأجواء' : 'Choose a mood',
    dur: isAr ? 'المدة' : 'Duration',
    vol: isAr ? 'الصوت' : 'Volume',
    start: isAr ? 'ابدأ' : 'Begin',
    stop: isAr ? 'إنهاء' : 'Finish',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    playing: isAr ? 'استرخِ وأنصت…' : 'Relax and listen…',
    done: isAr ? 'خذ نفَساً' : 'Take a breath',
    doneSub: isAr ? 'دع السكون يبقى معك لحظة.' : 'Let the stillness linger a moment.',
    tip: isAr ? 'استخدم سمّاعات إن أمكن، واخفض الصوت لمستوى مريح.' : 'Use headphones if you can, and keep the volume gentle.',
    note: isAr ? 'أجواء للاسترخاء، وليست علاجاً طبياً أو «ترددات شفاء».' : 'A calming soundscape for relaxation — not medical treatment or "healing frequencies".',
  }), [isAr]);

  // ── Audio (all wrapped so a failure degrades to silence) ──
  const stopAll = useCallback(() => {
    if (schedRef.current) { clearInterval(schedRef.current); schedRef.current = null; }
    const ctx = ctxRef.current; const master = masterRef.current;
    ctxRef.current = null; masterRef.current = null; droneRef.current = null;
    if (!ctx) return;
    try { if (master) master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12); } catch { /* ignore */ }
    setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 420);
  }, []);

  const startAudio = useCallback((m, vol) => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain(); master.gain.value = vol * 0.55; master.connect(ctx.destination); masterRef.current = master;
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = m.cutoff; filter.Q.value = 0.7;
      const droneBus = ctx.createGain(); droneBus.gain.value = 0.85; droneBus.connect(filter); filter.connect(master);

      const oscs = [];
      [[m.root, 0.10], [m.root * 1.5, 0.05], [m.root * 2, 0.035]].forEach(([f, g]) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.006);
        const og = ctx.createGain(); og.gain.value = g; o.connect(og); og.connect(droneBus); o.start(); oscs.push(o);
      });
      // gentle slow swell
      const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.06;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.22; lfo.connect(lfoGain); lfoGain.connect(droneBus.gain); lfo.start(); oscs.push(lfo);
      droneRef.current = oscs;

      const bowl = () => {
        try {
          const c = ctxRef.current; if (!c) return;
          const ratio = m.scale[Math.floor(Math.random() * m.scale.length)];
          const oct = Math.random() < 0.3 ? 2 : 1;
          const freq = m.root * 2 * oct * ratio;
          const now = c.currentTime, peak = 0.16, dur = 4.8;
          const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = freq;
          const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = freq * 2.01;
          const g = c.createGain(); const g2 = c.createGain(); g2.gain.value = 0.22;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(peak, now + 0.7);
          g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
          o.connect(g); o2.connect(g2); g2.connect(g); g.connect(masterRef.current || c.destination);
          o.start(now); o2.start(now); o.stop(now + dur + 0.1); o2.stop(now + dur + 0.1);
        } catch { /* ignore */ }
      };
      bowl();
      schedRef.current = setInterval(bowl, m.chimeMs);
    } catch { stopAll(); }
  }, [stopAll]);

  const finish = useCallback(() => { stopAll(); setPhase('done'); playSfx?.('collect'); }, [stopAll, playSfx]);

  const start = useCallback(() => {
    setRemaining(minutes * 60);
    startAudio(mood, volume);
    setPhase('run'); playSfx?.('click');
  }, [minutes, mood, volume, startAudio, playSfx]);

  // live volume while playing
  useEffect(() => {
    if (phase === 'run' && masterRef.current && ctxRef.current) {
      try { masterRef.current.gain.setTargetAtTime(volume * 0.55, ctxRef.current.currentTime, 0.05); } catch { /* ignore */ }
    }
  }, [volume, phase]);

  // session countdown
  useEffect(() => {
    if (phase !== 'run') return undefined;
    const id = setInterval(() => setRemaining((r) => { if (r <= 1) { finish(); return 0; } return r - 1; }), 1000);
    return () => clearInterval(id);
  }, [phase, finish]);

  // hard safety: stop + close everything if the component ever unmounts
  useEffect(() => () => stopAll(), [stopAll]);

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={() => { stopAll(); onBack?.(); }}>
      <style>{CSS}</style>

      {phase === 'setup' && (
        <div className="rxp-body">
          <div className="rxp-hero">🔔</div>
          <div className="rxp-field">
            <div className="rxp-label">{t.pick}</div>
            <div className="rxp-chips" style={{ flexDirection: 'column' }}>
              {MOODS.map((m) => (
                <button key={m.id} className={`rxp-chip${mood.id === m.id ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setMood(m); }}>
                  {isAr ? m.ar : m.en}<small>{isAr ? m.d.ar : m.d.en}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="rxp-field">
            <div className="rxp-label">{t.dur}</div>
            <div className="rxp-chips">
              {MINUTES.map((m) => (
                <button key={m} className={`rxp-chip${minutes === m ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setMinutes(m); }}>{m} {isAr ? 'د' : 'min'}</button>
              ))}
            </div>
          </div>
          <div className="rxp-field">
            <div className="rxp-label">{t.vol}</div>
            <input className="sb-vol" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ accentColor: ACCENT }} />
          </div>
          <button className="rxp-primary" onClick={start}>{t.start}</button>
          <div className="rxp-tip">{t.tip}</div>
          <div className="rxp-tip">{t.note}</div>
        </div>
      )}

      {phase === 'run' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-remain">{fmt(remaining)}</div>
          <div className="sb-stage">
            <span className="sb-ring sb-r1" /><span className="sb-ring sb-r2" /><span className="sb-ring sb-r3" />
            <span className="sb-core">🔔</span>
          </div>
          <div className="sb-play">{t.playing}</div>
          <input className="sb-vol" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ accentColor: ACCENT, maxWidth: 260 }} />
          <button className="rxp-ghost" onClick={() => { playSfx?.('click'); finish(); }}>{t.stop}</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">🌙</div>
          <div className="sb-doneT serif">{t.done}</div>
          <div className="sb-doneS">{t.doneSub}</div>
          <button className="rxp-primary" onClick={start}>{t.again}</button>
          <button className="rxp-ghost" onClick={() => { stopAll(); onBack?.(); }}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.sb-stage { position:relative; width:240px; height:240px; display:grid; place-items:center; margin:10px 0; }
.sb-ring { position:absolute; border-radius:50%; border:2px solid rgba(123,134,200,0.5); opacity:0; }
.sb-r1 { width:90px; height:90px; animation:sbPulse 6s ease-out infinite; }
.sb-r2 { width:90px; height:90px; animation:sbPulse 6s ease-out infinite 2s; }
.sb-r3 { width:90px; height:90px; animation:sbPulse 6s ease-out infinite 4s; }
@keyframes sbPulse { 0% { transform:scale(1); opacity:0.55; } 100% { transform:scale(2.6); opacity:0; } }
.sb-core { position:relative; z-index:2; font-size:56px; filter:drop-shadow(0 4px 10px rgba(80,80,140,0.3)); animation:sbBob 5s ease-in-out infinite; }
@keyframes sbBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
.sb-play { font-family:${SERIF}; font-size:22px; font-weight:600; color:${INK}; }
.sb-vol { width:100%; }
.sb-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.sb-doneS { font-size:14px; color:${SUB}; max-width:300px; }
`;
