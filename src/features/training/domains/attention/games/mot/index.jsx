import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

/*
 * Multiple Object Tracking (MOT) — dynamic attention.
 *
 * A few dots flash as TARGETS, then all dots drift/bounce for a few seconds
 * (targets stop flashing — track them with your eyes); when they freeze you tap
 * the ones you tracked. Wrapped in the shared 3-mode flow (Free / Levels /
 * Challenge) via ModeShell.
 */

const CUE_MS = 1500;
const ROUNDS_PER_LEVEL = 5;
const LEVEL_WIN = 3;     // perfect rounds needed to clear a level
const CHAL_LIVES = 3;

function freeConfig(r) {
  const targets = Math.min(2 + Math.floor(r / 2), 5);
  return { targets, total: targets + Math.min(4 + r, 11), speed: 95 + r * 16, trackMs: 4000 + Math.min(r * 250, 2600) };
}
const BASE = {
  easy: { t: 2, d: 3, sp: 78, tr: 3400 },
  med: { t: 3, d: 5, sp: 108, tr: 4200 },
  hard: { t: 4, d: 6, sp: 140, tr: 4800 },
};
function levelConfig(diff, level) {
  const b = BASE[diff] || BASE.med;
  const lv = (level || 1) - 1;
  const targets = Math.min(b.t + Math.floor(lv / 6), 5);
  return { targets, total: targets + b.d + Math.floor(lv / 3), speed: b.sp + lv * 6, trackMs: b.tr + lv * 60 };
}

function MotEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const phaseRef = useRef('cue');
  const cfgRef = useRef(freeConfig(0));
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const timerRef = useRef(null);
  // progression
  const freeRoundRef = useRef(0);
  const chalRoundRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const roundIdxRef = useRef(0);
  const wonRef = useRef(0);
  const scoreRef = useRef(0);

  const [phase, setPhase] = useState('cue');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [picksLeft, setPicksLeft] = useState(0);
  const [hud, setHud] = useState('');
  const [msg, setMsg] = useState('');

  const setPhaseBoth = useCallback((p) => { phaseRef.current = p; setPhase(p); }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const { w, h } = sizeRef.current;
    ctx.clearRect(0, 0, w, h);
    const ph = phaseRef.current;
    for (const d of dotsRef.current) {
      let fill = '#4f9fe0';
      if (ph === 'cue' && d.target) fill = '#ffce4a';
      if (ph === 'result') fill = d.target ? '#3be086' : (d.selected ? '#ff5a5a' : '#3a4a63');
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
      if (ph === 'cue' && d.target) { ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.stroke(); }
      if ((ph === 'respond' || ph === 'result') && d.selected) {
        ctx.lineWidth = 5; ctx.strokeStyle = ph === 'result' && !d.target ? '#ff8a8a' : '#fff'; ctx.stroke();
      }
    }
  }, []);

  const frame = useCallback((ts) => {
    const dt = lastTsRef.current ? Math.min((ts - lastTsRef.current) / 1000, 0.05) : 0;
    lastTsRef.current = ts;
    if (phaseRef.current === 'track') {
      const { w, h } = sizeRef.current;
      for (const d of dotsRef.current) {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.x < d.r) { d.x = d.r; d.vx = Math.abs(d.vx); }
        if (d.x > w - d.r) { d.x = w - d.r; d.vx = -Math.abs(d.vx); }
        if (d.y < d.r) { d.y = d.r; d.vy = Math.abs(d.vy); }
        if (d.y > h - d.r) { d.y = h - d.r; d.vy = -Math.abs(d.vy); }
      }
    }
    draw();
    rafRef.current = requestAnimationFrame(frame);
  }, [draw]);

  const fit = useCallback(() => {
    const c = canvasRef.current, wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    sizeRef.current = { w, h };
    c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const nextParams = useCallback(() => {
    if (mode === 'levels') return levelConfig(diff, level);
    if (mode === 'challenge') return freeConfig(chalRoundRef.current);
    return freeConfig(freeRoundRef.current);
  }, [mode, diff, level]);

  const updateHud = useCallback(() => {
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · جولة ${roundIdxRef.current}/${ROUNDS_PER_LEVEL} · ✓${wonRef.current}` : `Lvl ${level} · Round ${roundIdxRef.current}/${ROUNDS_PER_LEVEL} · ✓${wonRef.current}`);
    else if (mode === 'challenge') setHud(isAr ? `جولة ${chalRoundRef.current + 1}` : `Round ${chalRoundRef.current + 1}`);
    else setHud(isAr ? `جولة ${freeRoundRef.current + 1}` : `Round ${freeRoundRef.current + 1}`);
  }, [mode, level, isAr]);

  const startRound = useCallback(() => {
    fit();
    const cfg = nextParams(); cfgRef.current = cfg;
    const { w, h } = sizeRef.current;
    const R = Math.max(13, Math.min(w, h) * 0.034);
    const dots = [];
    for (let i = 0; i < cfg.total; i++) {
      let x, y, tries = 0;
      do { x = R + Math.random() * (w - 2 * R); y = R + Math.random() * (h - 2 * R); tries += 1; }
      while (tries < 40 && dots.some((o) => Math.hypot(o.x - x, o.y - y) < R * 2.5));
      const a = Math.random() * Math.PI * 2;
      dots.push({ x, y, vx: Math.cos(a) * cfg.speed, vy: Math.sin(a) * cfg.speed, r: R, target: false, selected: false });
    }
    [...dots.keys()].sort(() => Math.random() - 0.5).slice(0, cfg.targets).forEach((i) => { dots[i].target = true; });
    dotsRef.current = dots;
    setPicksLeft(cfg.targets);
    updateHud();
    setMsg(isAr ? `راقب ${cfg.targets} أهداف` : `Watch the ${cfg.targets} targets…`);
    setPhaseBoth('cue');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setMsg(isAr ? 'تابعها بعينيك…' : 'Track them…');
      setPhaseBoth('track');
      timerRef.current = setTimeout(() => {
        setMsg(isAr ? `اضغط الأهداف (${cfg.targets})` : `Tap the ${cfg.targets} targets`);
        setPhaseBoth('respond');
      }, cfg.trackMs);
    }, CUE_MS);
  }, [fit, isAr, nextParams, setPhaseBoth, updateHud]);

  const evaluate = useCallback(() => {
    const k = cfgRef.current.targets;
    const correct = dotsRef.current.filter((d) => d.target && d.selected).length;
    const perfect = correct === k;
    setPhaseBoth('result');
    if (perfect) { playSfx?.('win'); scoreRef.current += 10; setScore(scoreRef.current); awardPoints?.(3); setMsg(isAr ? 'ممتاز ✓' : 'Perfect ✓'); }
    else { playSfx?.('lose'); setMsg(isAr ? `${correct}/${k} صحيحة` : `${correct}/${k} correct`); }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels') {
        roundIdxRef.current += 1;
        if (perfect) wonRef.current += 1;
        if (roundIdxRef.current >= ROUNDS_PER_LEVEL) {
          onResult({ won: wonRef.current >= LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات مثالية` : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect rounds` });
          return;
        }
      } else if (mode === 'challenge') {
        if (perfect) { chalRoundRef.current += 1; } else {
          livesRef.current -= 1; setLives(livesRef.current);
          if (livesRef.current <= 0) { onResult({ score: scoreRef.current }); return; }
        }
      } else {
        freeRoundRef.current += 1; // free ramps forever
      }
      startRound();
    }, 1300);
  }, [awardPoints, isAr, mode, onResult, playSfx, setPhaseBoth, startRound]);

  const onPointer = useCallback((e) => {
    if (phaseRef.current !== 'respond') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    let hit = null, best = Infinity;
    for (const d of dotsRef.current) { const dist = Math.hypot(d.x - x, d.y - y); if (dist < d.r * 1.5 && dist < best) { best = dist; hit = d; } }
    if (!hit) return;
    if (hit.selected) { hit.selected = false; setPicksLeft((p) => p + 1); playSfx?.('click'); return; }
    const sel = dotsRef.current.filter((d) => d.selected).length;
    if (sel >= cfgRef.current.targets) return;
    hit.selected = true; playSfx?.('click');
    const left = cfgRef.current.targets - (sel + 1);
    setPicksLeft(left);
    if (left === 0) { clearTimeout(timerRef.current); timerRef.current = setTimeout(evaluate, 280); }
  }, [evaluate, playSfx]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(frame);
    startRound();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafRef.current); clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = styles;
  return (
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'تتبّع الأهداف' : 'Target Tracking'}</div>
        <div style={S.stats}>{mode === 'challenge' ? '❤'.repeat(lives) : hud} · {score}</div>
      </div>
      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={S.canvas} onPointerDown={onPointer} />
        {(phase === 'cue' || phase === 'track' || phase === 'respond') && (
          <div style={S.banner}>
            <span style={{ ...S.dot, background: phase === 'respond' ? '#fff' : '#ffce4a' }} />
            {msg} {phase === 'respond' && <b style={{ marginInlineStart: 6 }}>· {picksLeft}</b>}
          </div>
        )}
        {phase === 'result' && <div style={S.banner}>{msg}</div>}
      </div>
    </div>
  );
}

export default function MotGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_attn_mot"
      title={{ en: 'Target Tracking', ar: 'تتبّع الأهداف' }}
      hints={{
        free: { en: 'Endless practice — no fail', ar: 'تدريب مفتوح — بلا خسارة' },
        levels: { en: 'Easy → Hard · 12 levels each', ar: 'سهل → صعب · 12 مستوى لكل' },
        challenge: { en: 'One escalating run · 3 lives', ar: 'جولة تصاعدية · 3 أرواح' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      levelCount={12}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <MotEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#0b1018', color: '#fff', fontFamily: "'Outfit', system-ui, sans-serif" },
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  back: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#dfe9f5', borderRadius: 9, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' },
  title: { fontWeight: 800, letterSpacing: '0.02em', fontSize: 16 },
  stats: { fontVariantNumeric: 'tabular-nums', color: '#9fc6ef', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: 'radial-gradient(circle at 50% 40%, #16243a, #0c1320)', overflow: 'hidden', border: '1px solid rgba(90,160,230,0.18)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  banner: { position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(8,14,24,0.82)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '8px 16px', fontWeight: 700, whiteSpace: 'nowrap' },
  dot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
};
