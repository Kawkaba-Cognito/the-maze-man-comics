import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

/*
 * Trail Making A — visuomotor scanning speed.
 *
 * Tap the numbered circles in order 1 → 2 → 3 … as fast as you can, beating the
 * clock. A classic clinical processing-speed / visual-scanning measure (the
 * "A" form; the "B" alternating form lives in Flexibility). Wrapped in the
 * shared 3-mode flow (Free / Levels / Challenge).
 */

const LEVEL_WIN = true; // completing the board in time clears the level
const CHAL_LIVES = 3;

const BASE = {
  easy: { n: 8, time: 30000 },
  med: { n: 14, time: 34000 },
  hard: { n: 20, time: 38000 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const lv = (level || 1) - 1;
  return { n: Math.min(b.n + lv, 30), time: Math.max(12000, b.time - lv * 900) };
}
function rampCfg(boardIdx) {
  return { n: Math.min(8 + boardIdx * 2, 30), time: Math.max(14000, 32000 - boardIdx * 1500) };
}
const fmt = (ms) => `${Math.max(0, ms / 1000).toFixed(1)}s`;

function TrailEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const itemsRef = useRef([]);      // { n, fx, fy }
  const mapRef = useRef([]);        // number -> item
  const nextRef = useRef(1);
  const errRef = useRef(0);
  const flashRef = useRef({ x: 0, y: 0, until: 0 });
  const deadlineRef = useRef(Infinity);
  const startRef = useRef(0);
  const endedRef = useRef(false);
  const boardIdxRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const scoreRef = useRef(0);
  const cfgRef = useRef({ n: 8, time: 30000 });
  const rafRef = useRef(0);
  const clockRef = useRef(null);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(0);
  const [prog, setProg] = useState(0);
  const [boards, setBoards] = useState(0);

  const timed = mode !== 'free';

  const fit = useCallback(() => {
    const c = canvasRef.current, wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    sizeRef.current = { w, h };
    c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const itemR = useCallback(() => {
    const { w, h } = sizeRef.current;
    const n = cfgRef.current.n;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    return Math.max(15, Math.min(w / cols, h / rows) * 0.36);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext('2d');
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      const r = itemR();
      const map = mapRef.current;
      // trail lines between consecutive completed numbers
      ctx.strokeStyle = 'rgba(110,235,170,0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let m = 1; m <= nextRef.current - 2; m++) {
        const a = map[m], b = map[m + 1];
        if (!a || !b) continue;
        ctx.beginPath(); ctx.moveTo(a.fx * w, a.fy * h); ctx.lineTo(b.fx * w, b.fy * h); ctx.stroke();
      }
      for (const it of itemsRef.current) {
        const x = it.fx * w, y = it.fy * h;
        const done = it.n < nextRef.current;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = done ? '#1f5e44' : '#1b2940';
        ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = done ? '#3be086' : '#6fa6df'; ctx.stroke();
        ctx.fillStyle = done ? '#bdf5d8' : '#eaf3ff';
        ctx.font = `700 ${Math.round(r * 0.9)}px Outfit, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(it.n), x, y + 1);
      }
      if (performance.now() < flashRef.current.until) {
        ctx.beginPath(); ctx.arc(flashRef.current.x, flashRef.current.y, r * 1.3, 0, Math.PI * 2);
        ctx.lineWidth = 5; ctx.strokeStyle = '#ff5a5a'; ctx.stroke();
      }
    }
    rafRef.current = requestAnimationFrame(draw);
  }, [itemR]);

  const newBoard = useCallback(() => {
    fit();
    const c = mode === 'levels' ? levelCfg(diff, level) : rampCfg(boardIdxRef.current);
    cfgRef.current = c;
    const n = c.n;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    const cells = [];
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) cells.push([cc, rr]);
    cells.sort(() => Math.random() - 0.5);
    const items = [];
    const map = [];
    for (let i = 0; i < n; i++) {
      const [cc, rr] = cells[i];
      const it = { n: i + 1, fx: (cc + 0.5 + (Math.random() - 0.5) * 0.5) / cols, fy: (rr + 0.5 + (Math.random() - 0.5) * 0.5) / rows };
      items.push(it); map[i + 1] = it;
    }
    itemsRef.current = items; mapRef.current = map;
    nextRef.current = 1; errRef.current = 0;
    setProg(0);
    startRef.current = performance.now();
    deadlineRef.current = timed ? performance.now() + c.time : Infinity;
    if (timed) setTimeLeft(c.time);
  }, [diff, fit, level, mode, timed]);

  const onComplete = useCallback(() => {
    if (endedRef.current) return;
    const used = performance.now() - startRef.current;
    playSfx?.('win');
    if (mode === 'levels') {
      endedRef.current = true;
      scoreRef.current += Math.max(20, 200 - Math.round(used / 100));
      onResult({ won: LEVEL_WIN, score: scoreRef.current, summary: `${cfgRef.current.n} · ${fmt(used)} · ${errRef.current} ${isAr ? 'أخطاء' : 'errors'}` });
      return;
    }
    awardPoints?.(3);
    const bonus = timed ? Math.max(0, Math.round((deadlineRef.current - performance.now()) / 1000)) : 0;
    scoreRef.current += 20 + bonus; setScore(scoreRef.current);
    boardIdxRef.current += 1; setBoards(boardIdxRef.current);
    newBoard();
  }, [awardPoints, isAr, mode, newBoard, onResult, playSfx, timed]);

  const onTimeout = useCallback(() => {
    if (endedRef.current) return;
    playSfx?.('lose');
    if (mode === 'levels') {
      endedRef.current = true;
      onResult({ won: false, score: scoreRef.current, summary: isAr ? `وصلت إلى ${nextRef.current - 1}/${cfgRef.current.n}` : `Reached ${nextRef.current - 1}/${cfgRef.current.n}` });
      return;
    }
    // challenge
    livesRef.current -= 1; setLives(livesRef.current);
    if (livesRef.current <= 0) { endedRef.current = true; onResult({ score: scoreRef.current }); return; }
    newBoard();
  }, [isAr, mode, newBoard, onResult, playSfx]);

  const onPointer = useCallback((e) => {
    if (endedRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const r = itemR();
    let hit = null, best = Infinity;
    for (const it of itemsRef.current) {
      if (it.n < nextRef.current) continue;
      const d = Math.hypot(it.fx * w - x, it.fy * h - y);
      if (d < r * 1.25 && d < best) { best = d; hit = it; }
    }
    if (!hit) return;
    if (hit.n === nextRef.current) {
      nextRef.current += 1; setProg(nextRef.current - 1); playSfx?.('click');
      if (nextRef.current > cfgRef.current.n) onComplete();
    } else {
      errRef.current += 1;
      flashRef.current = { x: hit.fx * w, y: hit.fy * h, until: performance.now() + 350 };
      playSfx?.('lose');
    }
  }, [itemR, onComplete, playSfx]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);
    newBoard();
    if (timed) {
      clockRef.current = setInterval(() => {
        const left = deadlineRef.current - performance.now();
        setTimeLeft(left);
        if (left <= 0) onTimeout();
      }, 100);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      clearInterval(clockRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = styles;
  const total = cfgRef.current.n;
  return (
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'صل الأرقام' : 'Trail Making'}</div>
        <div style={S.stats}>
          {mode === 'challenge' ? `${'❤'.repeat(lives)} · ${score}` : mode === 'free' ? `${isAr ? 'لوحات' : 'Boards'} ${boards}` : `${isAr ? 'مستوى' : 'Lvl'} ${level}`}
        </div>
      </div>
      <div style={S.sub}>
        <span>{isAr ? 'التالي' : 'Next'}: <b style={{ color: '#9be85a' }}>{Math.min(prog + 1, total)}</b> / {total}</span>
        {timed ? <span style={{ color: timeLeft < 6000 ? '#ff7a7a' : '#ffd98a' }}>⏱ {fmt(timeLeft)}</span> : null}
      </div>
      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={S.canvas} onPointerDown={onPointer} />
      </div>
    </div>
  );
}

export default function TrailMakingGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_speed_trail"
      title={{ en: 'Trail Making', ar: 'صل الأرقام' }}
      hints={{
        free: { en: 'Endless practice — no clock', ar: 'تدريب مفتوح — بلا وقت' },
        levels: { en: 'Easy → Hard · 12 levels each', ar: 'سهل → صعب · 12 مستوى لكل' },
        challenge: { en: 'Escalating boards · beat the clock · 3 lives', ar: 'لوحات تصاعدية · اسبق الوقت · 3 أرواح' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      levelCount={12}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <TrailEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
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
  sub: { display: 'flex', justifyContent: 'space-between', padding: '4px 16px 0', fontSize: 14, fontWeight: 700, color: '#c4d3e6' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: 'radial-gradient(circle at 50% 45%, #16243a, #0c1320)', overflow: 'hidden', border: '1px solid rgba(90,160,230,0.18)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
};
