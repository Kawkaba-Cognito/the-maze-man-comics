import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

/*
 * Paired Associates (CANTAB PAL-style) — associative / episodic memory.
 *
 * Boxes open one at a time to reveal a symbol hidden inside (study phase). Then
 * a symbol is shown and you tap the box where it lived (recall phase). More
 * pairs are added as you succeed. Trains "what ↔ where" binding — the
 * hippocampus / medial-temporal-lobe facet that span and n-back don't.
 *
 * Procedural Canvas, zero assets. Shared 3-mode flow (Free / Levels / Challenge).
 */

const SYMBOLS = ['★', '▲', '●', '■', '◆', '✚', '✦', '❤', '☀', '☾', '♣', '♠'];
const ROUNDS_PER_LEVEL = 3;
const LEVEL_WIN = 2;   // perfect trials needed
const CHAL_LIVES = 3;
const STUDY_GAP = 240;

const BASE = {
  easy: { boxes: 4, pairs: 2, study: 1100 },
  med: { boxes: 6, pairs: 3, study: 950 },
  hard: { boxes: 8, pairs: 4, study: 820 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const lv = (level || 1) - 1;
  const boxes = Math.min(b.boxes + Math.floor(lv / 4), 10);
  return { boxes, pairs: Math.min(b.pairs + Math.floor(lv / 3), boxes), study: Math.max(560, b.study - lv * 30) };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function PalEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const boxesRef = useRef([]);        // { fx, fy, symbol|null }
  const cueOrderRef = useRef([]);     // [{ boxIdx, symbol }] shuffled for recall
  const cueIdxRef = useRef(0);
  const openRef = useRef(-1);         // box open during study
  const flashRef = useRef({ idx: -1, kind: '', until: 0 });
  const subRef = useRef('study');     // study | recall | feedback
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const timerRef = useRef(null);
  const rafRef = useRef(0);
  // progression
  const pairsRef = useRef(2);         // free/challenge adaptive
  const trialIdxRef = useRef(0);
  const wonRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const cfgRef = useRef({ boxes: 6, pairs: 3, study: 950 });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [hud, setHud] = useState('');
  const [msg, setMsg] = useState('');
  const [cue, setCue] = useState('');

  const fit = useCallback(() => {
    const c = canvasRef.current, wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    sizeRef.current = { w, h };
    c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const boxSize = useCallback(() => {
    const { w, h } = sizeRef.current;
    const n = cfgRef.current.boxes;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    return Math.max(34, Math.min(w / cols, h / rows) * 0.62);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext('2d');
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      const s = boxSize();
      const now = performance.now();
      const fb = flashRef.current;
      const sub = subRef.current;
      boxesRef.current.forEach((b, i) => {
        const x = b.fx * w, y = b.fy * h;
        const open = sub === 'study' && openRef.current === i;
        rr(ctx, x - s / 2, y - s / 2, s, s, 12);
        ctx.fillStyle = open ? '#e9f3ff' : '#1b2940';
        ctx.fill();
        let border = open ? '#ffce4a' : '#6fa6df';
        let lw = open ? 5 : 3;
        if (now < fb.until && fb.idx === i) { border = fb.kind === 'good' ? '#3be086' : '#ff5a5a'; lw = 6; }
        ctx.lineWidth = lw; ctx.strokeStyle = border; ctx.stroke();
        // contents
        if (open && b.symbol) { ctx.fillStyle = '#1b2940'; ctx.font = `${Math.round(s * 0.5)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.symbol, x, y + 1); }
        else if (now < fb.until && fb.idx === i && fb.symbol) { ctx.fillStyle = fb.kind === 'good' ? '#3be086' : '#ff8a8a'; ctx.font = `${Math.round(s * 0.5)}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(fb.symbol, x, y + 1); }
        else if (sub !== 'study') { ctx.fillStyle = 'rgba(159,198,239,0.5)'; ctx.font = `${Math.round(s * 0.42)}px Outfit, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, y + 1); }
      });
    }
    rafRef.current = requestAnimationFrame(draw);
  }, [boxSize]);

  const cfg = useCallback(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    const boxes = mode === 'challenge' ? Math.min(4 + pairsRef.current, 10) : 6;
    return { boxes, pairs: Math.min(pairsRef.current, boxes), study: Math.max(620, 1050 - pairsRef.current * 40) };
  }, [mode, diff, level]);

  const updateHud = useCallback(() => {
    bestRef.current = Math.max(bestRef.current, cfgRef.current.pairs);
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · جولة ${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}` : `Lvl ${level} · Trial ${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}`);
    else if (mode === 'challenge') setHud(`${'❤'.repeat(livesRef.current)} · ${isAr ? 'أزواج' : 'pairs'} ${cfgRef.current.pairs}`);
    else setHud(isAr ? `أزواج ${cfgRef.current.pairs} · أفضل ${bestRef.current}` : `Pairs ${cfgRef.current.pairs} · best ${bestRef.current}`);
  }, [mode, level, isAr]);

  const advance = useCallback((perfect) => {
    if (mode === 'levels') {
      trialIdxRef.current += 1;
      if (perfect) wonRef.current += 1;
      if (trialIdxRef.current >= ROUNDS_PER_LEVEL) {
        onResult({ won: wonRef.current >= LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات كاملة` : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect trials` });
        return true;
      }
    } else if (mode === 'challenge') {
      if (perfect) { pairsRef.current += 1; scoreRef.current += cfgRef.current.pairs * 8; setScore(scoreRef.current); awardPoints?.(3); }
      else { livesRef.current -= 1; setLives(livesRef.current); if (livesRef.current <= 0) { onResult({ score: scoreRef.current }); return true; } }
    } else {
      pairsRef.current = perfect ? pairsRef.current + 1 : Math.max(2, pairsRef.current - 1);
    }
    return false;
  }, [awardPoints, isAr, mode, onResult]);

  const presentCue = useCallback(() => {
    const order = cueOrderRef.current;
    if (cueIdxRef.current >= order.length) {
      // trial finished
      const perfect = correctRef.current === totalRef.current;
      subRef.current = 'feedback';
      setCue('');
      if (perfect) { playSfx?.('win'); setMsg(isAr ? 'ممتاز ✓' : 'Perfect ✓'); }
      else { playSfx?.('lose'); setMsg(isAr ? `${correctRef.current}/${totalRef.current} صحيحة` : `${correctRef.current}/${totalRef.current} correct`); }
      clearTimeout(timerRef.current);
      // eslint-disable-next-line no-use-before-define
      timerRef.current = setTimeout(() => { if (!advance(perfect)) newTrial(); }, 1300);
      return;
    }
    subRef.current = 'recall';
    const cur = order[cueIdxRef.current];
    setCue(cur.symbol);
    setMsg(isAr ? 'أين كان هذا؟' : 'Where was this?');
    // eslint-disable-next-line no-use-before-define
  }, [advance, isAr, playSfx]);

  const newTrial = useCallback(() => {
    fit();
    const c = cfg(); cfgRef.current = c;
    const { boxes: N, pairs: K, study: studyMs } = c;
    const cols = Math.ceil(Math.sqrt(N));
    const rows = Math.ceil(N / cols);
    const cells = [];
    for (let rr2 = 0; rr2 < rows; rr2++) for (let cc = 0; cc < cols; cc++) cells.push([cc, rr2]);
    cells.sort(() => Math.random() - 0.5);
    const boxes = [];
    for (let i = 0; i < N; i++) {
      const [cc, rr2] = cells[i];
      boxes.push({ fx: (cc + 0.5 + (Math.random() - 0.5) * 0.4) / cols, fy: (rr2 + 0.5 + (Math.random() - 0.5) * 0.4) / rows, symbol: null });
    }
    const syms = [...SYMBOLS].sort(() => Math.random() - 0.5).slice(0, K);
    const boxIdxs = [...boxes.keys()].sort(() => Math.random() - 0.5).slice(0, K);
    boxIdxs.forEach((bi, j) => { boxes[bi].symbol = syms[j]; });
    boxesRef.current = boxes;
    cueOrderRef.current = boxIdxs.map((bi) => ({ boxIdx: bi, symbol: boxes[bi].symbol })).sort(() => Math.random() - 0.5);
    cueIdxRef.current = 0; correctRef.current = 0; totalRef.current = K;
    updateHud();
    setCue('');
    setMsg(isAr ? 'احفظ المواقع…' : 'Memorize the locations…');
    subRef.current = 'study';
    // reveal item-boxes one at a time
    const studyOrder = [...boxIdxs].sort(() => Math.random() - 0.5);
    const step = (k) => {
      if (k >= studyOrder.length) { openRef.current = -1; presentCue(); return; }
      openRef.current = studyOrder[k];
      timerRef.current = setTimeout(() => {
        openRef.current = -1;
        timerRef.current = setTimeout(() => step(k + 1), STUDY_GAP);
      }, studyMs);
    };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => step(0), 500);
  }, [cfg, fit, isAr, presentCue, updateHud]);

  const onPointer = useCallback((e) => {
    if (subRef.current !== 'recall') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const s = boxSize();
    let hit = -1, best = Infinity;
    boxesRef.current.forEach((b, i) => { const d = Math.hypot(b.fx * w - x, b.fy * h - y); if (d < s * 0.7 && d < best) { best = d; hit = i; } });
    if (hit < 0) return;
    const cur = cueOrderRef.current[cueIdxRef.current];
    const ok = hit === cur.boxIdx;
    if (ok) { correctRef.current += 1; playSfx?.('click'); flashRef.current = { idx: hit, kind: 'good', symbol: cur.symbol, until: performance.now() + 450 }; }
    else { playSfx?.('lose'); flashRef.current = { idx: cur.boxIdx, kind: 'good', symbol: cur.symbol, until: performance.now() + 600 }; }
    cueIdxRef.current += 1;
    subRef.current = 'feedback';
    setCue('');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(presentCue, ok ? 380 : 650);
  }, [boxSize, playSfx, presentCue]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);
    newTrial();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafRef.current); clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = styles;
  return (
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'الأزواج المترابطة' : 'Paired Associates'}</div>
        <div style={S.stats}>{hud}{mode !== 'free' ? ` · ${score}` : ''}</div>
      </div>
      <div style={S.cueRow}>
        <span>{msg}</span>
        {cue ? <span style={S.cueSym}>{cue}</span> : null}
      </div>
      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={S.canvas} onPointerDown={onPointer} />
      </div>
    </div>
  );
}

export default function PairedAssociatesGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_mem_pal"
      title={{ en: 'Paired Associates', ar: 'الأزواج المترابطة' }}
      hints={{
        free: { en: 'Endless practice — pairs grow', ar: 'تدريب مفتوح — تزداد الأزواج' },
        levels: { en: 'Easy → Hard · 12 levels each', ar: 'سهل → صعب · 12 مستوى لكل' },
        challenge: { en: 'More pairs each round · 3 lives', ar: 'أزواج أكثر كل جولة · 3 أرواح' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      levelCount={12}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <PalEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#0b1018', color: '#fff', fontFamily: "'Outfit', system-ui, sans-serif" },
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  back: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#dfe9f5', borderRadius: 9, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' },
  title: { fontWeight: 800, letterSpacing: '0.02em', fontSize: 15 },
  stats: { fontVariantNumeric: 'tabular-nums', color: '#9fc6ef', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' },
  cueRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '8px 0 2px', fontSize: 15, fontWeight: 700, color: '#c4d3e6', minHeight: 40 },
  cueSym: { fontSize: 30, lineHeight: 1, color: '#ffce4a' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: 'radial-gradient(circle at 50% 45%, #16243a, #0c1320)', overflow: 'hidden', border: '1px solid rgba(90,160,230,0.18)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
};
