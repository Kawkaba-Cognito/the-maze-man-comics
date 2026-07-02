import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import PracticeShell, { INK, SUB, FAINT, SERIF } from './PracticeShell';

/*
 * Nature Sounds — rain, ocean, wind and fire, mixable, synthesized live with the
 * Web Audio API (no audio files) from filtered noise. Non-medical.
 *
 * SAFETY: one AudioContext, started only on a tap (Start). Every source/oscillator
 * is stopped and the context closed on Finish / Back / unmount; all audio is
 * wrapped in try/catch so a refusal degrades to silence, never a crash.
 */

const ACCENT = '#5aa07a';

const LAYERS = [
  { id: 'rain', ic: '🌧️', en: 'Rain', ar: 'مطر' },
  { id: 'ocean', ic: '🌊', en: 'Ocean', ar: 'محيط' },
  { id: 'wind', ic: '💨', en: 'Wind', ar: 'رياح' },
  { id: 'fire', ic: '🔥', en: 'Fire', ar: 'نار' },
];
const MINUTES = [10, 20, 30, 0]; // 0 = endless
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function NatureSoundsPractice({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const [active, setActive] = useState(() => new Set(['rain']));
  const [minutes, setMinutes] = useState(20);
  const [volume, setVolume] = useState(0.7);
  const [phase, setPhase] = useState('setup'); // setup | run | done
  const [remaining, setRemaining] = useState(1200);

  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const noiseRef = useRef(null);
  const brownRef = useRef(null);
  const layersRef = useRef({});

  const t = useMemo(() => ({
    title: isAr ? 'أصوات الطبيعة' : 'Nature Sounds',
    pick: isAr ? 'اخلط الأصوات' : 'Mix the sounds',
    dur: isAr ? 'المدة' : 'Duration',
    endless: isAr ? '∞' : '∞',
    vol: isAr ? 'الصوت' : 'Volume',
    start: isAr ? 'ابدأ' : 'Begin',
    stop: isAr ? 'إنهاء' : 'Finish',
    again: isAr ? 'مرة أخرى' : 'Again',
    back: isAr ? 'رجوع' : 'Back',
    tapMix: isAr ? 'اضغط لتشغيل الطبقات وإيقافها' : 'Tap to toggle each layer',
    pickOne: isAr ? 'اختر صوتاً واحداً على الأقل' : 'Pick at least one sound',
    done: isAr ? 'خذ نفَساً' : 'Take a breath',
    doneSub: isAr ? 'دع الهدوء يبقى لحظة.' : 'Let the calm linger a moment.',
    tip: isAr ? 'استخدم سمّاعات إن أمكن.' : 'Use headphones if you can.',
    note: isAr ? 'أجواء للاسترخاء، وليست علاجاً طبياً.' : 'A calming soundscape for relaxation, not medical treatment.',
  }), [isAr]);

  // ── noise buffers ──
  const makeNoise = (ctx) => {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  };
  const makeBrown = (ctx) => {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0); let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    return buf;
  };

  // ── layer builders (each returns { stop() }) ──
  const buildRain = (ctx, master) => {
    const src = ctx.createBufferSource(); src.buffer = noiseRef.current; src.loop = true;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 700;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.value = 0.16;
    src.connect(hp); hp.connect(lp); lp.connect(g); g.connect(master); src.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.5; const lg = ctx.createGain(); lg.gain.value = 0.04;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    return { stop() { try { src.stop(); } catch { /* */ } try { lfo.stop(); } catch { /* */ } } };
  };
  const buildOcean = (ctx, master) => {
    const src = ctx.createBufferSource(); src.buffer = noiseRef.current; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; lp.Q.value = 0.5;
    const g = ctx.createGain(); g.gain.value = 0.18;
    src.connect(lp); lp.connect(g); g.connect(master); src.start();
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.1; const lg = ctx.createGain(); lg.gain.value = 0.16;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    return { stop() { try { src.stop(); } catch { /* */ } try { lfo.stop(); } catch { /* */ } } };
  };
  const buildWind = (ctx, master) => {
    const src = ctx.createBufferSource(); src.buffer = noiseRef.current; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.value = 0.14;
    src.connect(bp); bp.connect(g); g.connect(master); src.start();
    const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07; const lg = ctx.createGain(); lg.gain.value = 350;
    lfo.connect(lg); lg.connect(bp.frequency); lfo.start();
    const gl = ctx.createOscillator(); gl.frequency.value = 0.05; const glg = ctx.createGain(); glg.gain.value = 0.06;
    gl.connect(glg); glg.connect(g.gain); gl.start();
    return { stop() { [src, lfo, gl].forEach((n) => { try { n.stop(); } catch { /* */ } }); } };
  };
  const buildFire = (ctx, master) => {
    const src = ctx.createBufferSource(); src.buffer = brownRef.current; src.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
    const g = ctx.createGain(); g.gain.value = 0.12;
    src.connect(lp); lp.connect(g); g.connect(master); src.start();
    const crackle = () => {
      try {
        const c = ctxRef.current, mst = masterRef.current; if (!c || !mst) return;
        const s = c.createBufferSource(); s.buffer = noiseRef.current;
        const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500 + Math.random() * 2500; bp.Q.value = 6;
        const cg = c.createGain(); const now = c.currentTime;
        cg.gain.setValueAtTime(0.0001, now);
        cg.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.08, now + 0.005);
        cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.06 + Math.random() * 0.09);
        s.connect(bp); bp.connect(cg); cg.connect(mst);
        s.start(now); s.stop(now + 0.25);
      } catch { /* */ }
    };
    const sched = setInterval(() => { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) setTimeout(crackle, Math.random() * 300); }, 420);
    return { stop() { try { src.stop(); } catch { /* */ } clearInterval(sched); } };
  };

  const addLayer = useCallback((id) => {
    const ctx = ctxRef.current, master = masterRef.current;
    if (!ctx || !master || layersRef.current[id]) return;
    const b = id === 'rain' ? buildRain : id === 'ocean' ? buildOcean : id === 'wind' ? buildWind : buildFire;
    layersRef.current[id] = b(ctx, master);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const removeLayer = useCallback((id) => {
    const l = layersRef.current[id]; if (l) { l.stop(); delete layersRef.current[id]; }
  }, []);

  const stopAll = useCallback(() => {
    Object.values(layersRef.current).forEach((l) => { try { l.stop(); } catch { /* */ } });
    layersRef.current = {};
    const ctx = ctxRef.current, master = masterRef.current;
    ctxRef.current = null; masterRef.current = null; noiseRef.current = null; brownRef.current = null;
    if (!ctx) return;
    try { if (master) master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.12); } catch { /* */ }
    setTimeout(() => { try { ctx.close(); } catch { /* */ } }, 420);
  }, []);

  const startEngine = useCallback((vol) => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC(); ctxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain(); master.gain.value = vol * 0.45; master.connect(ctx.destination); masterRef.current = master;
      noiseRef.current = makeNoise(ctx); brownRef.current = makeBrown(ctx);
    } catch { stopAll(); }
  }, [stopAll]);

  const finish = useCallback(() => { stopAll(); setPhase('done'); playSfx?.('collect'); }, [stopAll, playSfx]);

  const start = useCallback(() => {
    if (active.size === 0) return;
    startEngine(volume);
    active.forEach((id) => addLayer(id));
    if (minutes > 0) setRemaining(minutes * 60);
    setPhase('run'); playSfx?.('click');
  }, [active, volume, minutes, startEngine, addLayer, playSfx]);

  const toggle = useCallback((id) => {
    playSfx?.('click');
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); if (phase === 'run') removeLayer(id); }
      else { next.add(id); if (phase === 'run') addLayer(id); }
      return next;
    });
  }, [phase, addLayer, removeLayer, playSfx]);

  // live volume
  useEffect(() => {
    if (phase === 'run' && masterRef.current && ctxRef.current) {
      try { masterRef.current.gain.setTargetAtTime(volume * 0.45, ctxRef.current.currentTime, 0.05); } catch { /* */ }
    }
  }, [volume, phase]);

  // countdown (finite duration only)
  useEffect(() => {
    if (phase !== 'run' || minutes === 0) return undefined;
    const id = setInterval(() => setRemaining((r) => { if (r <= 1) { finish(); return 0; } return r - 1; }), 1000);
    return () => clearInterval(id);
  }, [phase, minutes, finish]);

  // hard safety on unmount
  useEffect(() => () => stopAll(), [stopAll]);

  const LayerGrid = () => (
    <div className="nat-grid">
      {LAYERS.map((l) => {
        const on = active.has(l.id);
        return (
          <button key={l.id} className={`nat-layer${on ? ' on' : ''}`} onClick={() => toggle(l.id)}>
            <span className="nat-ic">{l.ic}</span>
            <span className="nat-lbl">{isAr ? l.ar : l.en}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <PracticeShell title={t.title} accent={ACCENT} isAr={isAr} onBack={() => { stopAll(); onBack?.(); }}>
      <style>{CSS}</style>

      {phase === 'setup' && (
        <div className="rxp-body">
          <div className="rxp-hero">🌿</div>
          <div className="rxp-field">
            <div className="rxp-label">{t.pick}</div>
            <div className="nat-hint">{t.tapMix}</div>
            <LayerGrid />
          </div>
          <div className="rxp-field">
            <div className="rxp-label">{t.dur}</div>
            <div className="rxp-chips">
              {MINUTES.map((m) => (
                <button key={m} className={`rxp-chip${minutes === m ? ' on' : ''}`} onClick={() => { playSfx?.('click'); setMinutes(m); }}>{m === 0 ? t.endless : `${m} ${isAr ? 'د' : 'min'}`}</button>
              ))}
            </div>
          </div>
          <div className="rxp-field">
            <div className="rxp-label">{t.vol}</div>
            <input className="nat-vol" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ accentColor: ACCENT }} />
          </div>
          <button className="rxp-primary" disabled={active.size === 0} style={{ opacity: active.size === 0 ? 0.5 : 1 }} onClick={start}>{active.size === 0 ? t.pickOne : t.start}</button>
          <div className="rxp-tip">{t.tip}</div>
          <div className="rxp-tip">{t.note}</div>
        </div>
      )}

      {phase === 'run' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-remain">{minutes === 0 ? '∞' : fmt(remaining)}</div>
          <div className="nat-hint">{t.tapMix}</div>
          <LayerGrid />
          <input className="nat-vol" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} style={{ accentColor: ACCENT, maxWidth: 300 }} />
          <button className="rxp-ghost" onClick={() => { playSfx?.('click'); finish(); }}>{t.stop}</button>
        </div>
      )}

      {phase === 'done' && (
        <div className="rxp-body rxp-center">
          <div className="rxp-hero">🌙</div>
          <div className="nat-doneT serif">{t.done}</div>
          <div className="nat-doneS">{t.doneSub}</div>
          <button className="rxp-primary" onClick={() => setPhase('setup')}>{t.again}</button>
          <button className="rxp-ghost" onClick={() => { stopAll(); onBack?.(); }}>{t.back}</button>
        </div>
      )}
    </PracticeShell>
  );
}

const CSS = `
.nat-hint { font-size:12.5px; color:${FAINT}; margin-top:-4px; }
.nat-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; width:100%; max-width:340px; margin:0 auto; }
.nat-layer { display:flex; flex-direction:column; align-items:center; gap:6px; padding:18px 10px; border-radius:16px; border:2px solid #dfe6df; background:#fff; cursor:pointer; font-family:inherit; transition:all .15s; }
.nat-layer .nat-ic { font-size:34px; filter:grayscale(0.6); opacity:0.55; transition:all .15s; }
.nat-layer .nat-lbl { font-size:13px; font-weight:800; color:${SUB}; }
.nat-layer.on { border-color:${ACCENT}; background:#eef6f0; box-shadow:0 4px 14px rgba(90,160,122,0.22); }
.nat-layer.on .nat-ic { filter:none; opacity:1; transform:scale(1.08); }
.nat-layer.on .nat-lbl { color:${INK}; }
.nat-vol { width:100%; }
.nat-doneT { font-family:${SERIF}; font-size:30px; font-weight:600; color:${INK}; }
.nat-doneS { font-size:14px; color:${SUB}; max-width:300px; }
`;
