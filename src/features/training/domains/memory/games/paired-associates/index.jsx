import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const PairedAssociates3DProto = lazyWithRetry(() => import('./PairedAssociates3DProto'), 'pal-3d');

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

// Exported so the 3D proto studies + recalls the SAME pairs with the same counts,
// timings and adaptive progression as 2D free mode.
export const SYMBOLS = ['★', '▲', '●', '■', '◆', '✚', '✦', '❤', '☀', '☾', '♣', '♠'];
export const STUDY_GAP = 240;
const ROUNDS_PER_LEVEL = 3;
const LEVEL_WIN = 2;   // perfect trials needed
const CHAL_LIVES = 3;

export const BASE = {
  easy: { boxes: 4, pairs: 2, study: 1100 },
  med: { boxes: 6, pairs: 3, study: 950 },
  hard: { boxes: 8, pairs: 4, study: 820 },
};
export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  const boxes = Math.min(b.boxes + Math.round(f * 4), 12);
  return { boxes, pairs: Math.min(b.pairs + Math.round(f * 4), boxes), study: Math.max(520, Math.round(b.study - f * 500)) };
}

/** Free/Survival config — 6 boxes, pairs grow adaptively, study time shrinks. */
export function palFreeCfg(pairs) {
  return { boxes: 6, pairs: Math.min(pairs, 6), study: Math.max(620, 1050 - pairs * 40) };
}

/**
 * Pure PAL trial generator (same draw order as the 2D engine's newTrial): choose
 * K symbols, K box slots, build the study reveal order + shuffled recall cues.
 */
export function buildPalTrial(cfg, rng) {
  const { boxes: N, pairs: K } = cfg;
  const syms = [...SYMBOLS].sort(() => rng() - 0.5).slice(0, K);
  const boxIdxs = [...Array(N).keys()].sort(() => rng() - 0.5).slice(0, K);
  const boxes = Array.from({ length: N }, () => ({ symbol: null }));
  boxIdxs.forEach((bi, j) => { boxes[bi].symbol = syms[j]; });
  const cueOrder = boxIdxs.map((bi) => ({ boxIdx: bi, symbol: boxes[bi].symbol })).sort(() => rng() - 0.5);
  const studyOrder = [...boxIdxs].sort(() => rng() - 0.5);
  return { boxes, boxIdxs, cueOrder, studyOrder, total: K };
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

function drawSym(ctx, sym, x, y, sz, color) {
  ctx.fillStyle = color;
  ctx.font = `${Math.round(sz * 0.5)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sym, x, y + 1);
}

export function PalEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 3) : 0;
  const ppCorrectRef = useRef(0);
  const ppDoneRef = useRef(0);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const boxesRef = useRef([]);        // { fx, fy, symbol|null }
  const cueOrderRef = useRef([]);     // [{ boxIdx, symbol }] shuffled for recall
  const cueIdxRef = useRef(0);
  const openRef = useRef(-1);         // box open during study
  const flashRef = useRef({ until: 0, correctIdx: -1, wrongIdx: -1, symbol: '' });
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
      const flashing = now < fb.until;
      const sub = subRef.current;
      boxesRef.current.forEach((b, i) => {
        const x = b.fx * w, y = b.fy * h;
        const open = sub === 'study' && openRef.current === i;
        const isCorrect = flashing && fb.correctIdx === i;
        const isWrong = flashing && fb.wrongIdx === i;
        const active = open || isCorrect || isWrong;
        const sz = s * (active ? 1.07 : 1);
        const half = sz / 2;
        // chunky drop shadow (matches the app's board look)
        rr(ctx, x - half + 4, y - half + 5, sz, sz, 13);
        ctx.fillStyle = 'rgba(26,18,8,0.9)';
        ctx.fill();
        // face
        let fill = '#f2e6cf';                 // closed = paper
        if (open) fill = '#fff6df';           // revealing = warm glow
        if (isCorrect) fill = '#d7f2e0';
        if (isWrong) fill = '#f8ddd9';
        rr(ctx, x - half, y - half, sz, sz, 13);
        ctx.fillStyle = fill;
        ctx.fill();
        // border
        let border = '#1a1208'; let lw = 3;
        if (open) { border = '#c8971f'; lw = 4; }
        if (isCorrect) { border = '#2e8b57'; lw = 5; }
        if (isWrong) { border = '#d23b3b'; lw = 5; }
        ctx.lineWidth = lw; ctx.strokeStyle = border; ctx.stroke();
        // contents
        if (open && b.symbol) drawSym(ctx, b.symbol, x, y, sz, '#3a2c18');
        else if (isCorrect && fb.symbol) drawSym(ctx, fb.symbol, x, y, sz, '#2e8b57');
        else if (isWrong) drawSym(ctx, '✕', x, y, sz, '#d23b3b');
        else if (sub !== 'study') { ctx.fillStyle = 'rgba(90,74,50,0.4)'; ctx.font = `${Math.round(sz * 0.42)}px Outfit, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x, y + 1); }
      });
    }
    rafRef.current = requestAnimationFrame(draw);
  }, [boxSize]);

  const cfg = useCallback(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return { boxes: 8, pairs: 4, study: 900 };
    return palFreeCfg(pairsRef.current);
  }, [mode, diff, level]);

  const updateHud = useCallback(() => {
    bestRef.current = Math.max(bestRef.current, cfgRef.current.pairs);
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · جولة ${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}` : `Lvl ${level} · Trial ${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}`);
    else if (mode === 'passplay') setHud(isAr ? `جولة ${ppDoneRef.current + 1}/${ppTrials} · ✓${ppCorrectRef.current}` : `Trial ${ppDoneRef.current + 1}/${ppTrials} · ✓${ppCorrectRef.current}`);
    else setHud(isAr ? `أزواج ${cfgRef.current.pairs} · أفضل ${bestRef.current}` : `Pairs ${cfgRef.current.pairs} · best ${bestRef.current}`);
  }, [mode, level, isAr, ppTrials]);

  const advance = useCallback((perfect) => {
    if (mode === 'levels') {
      trialIdxRef.current += 1;
      if (perfect) wonRef.current += 1;
      if (trialIdxRef.current >= ROUNDS_PER_LEVEL) {
        onResult({ won: wonRef.current >= LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات كاملة` : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect trials` });
        return true;
      }
    } else if (mode === 'passplay') {
      ppCorrectRef.current += correctRef.current;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppCorrectRef.current }); return true; }
    } else {
      pairsRef.current = perfect ? pairsRef.current + 1 : Math.max(2, pairsRef.current - 1);
    }
    return false;
  }, [isAr, mode, onResult, ppTrials]);

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
    cells.sort(() => rng() - 0.5);
    const boxes = [];
    for (let i = 0; i < N; i++) {
      const [cc, rr2] = cells[i];
      boxes.push({ fx: (cc + 0.5 + (rng() - 0.5) * 0.4) / cols, fy: (rr2 + 0.5 + (rng() - 0.5) * 0.4) / rows, symbol: null });
    }
    const trial = buildPalTrial({ boxes: N, pairs: K }, rng);
    trial.boxIdxs.forEach((bi) => { boxes[bi].symbol = trial.boxes[bi].symbol; });
    boxesRef.current = boxes;
    cueOrderRef.current = trial.cueOrder;
    cueIdxRef.current = 0; correctRef.current = 0; totalRef.current = K;
    updateHud();
    setCue('');
    setMsg(isAr ? 'احفظ المواقع…' : 'Memorize the locations…');
    subRef.current = 'study';
    // reveal item-boxes one at a time
    const studyOrder = trial.studyOrder;
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
  }, [cfg, fit, isAr, presentCue, updateHud, rng]);

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
    if (ok) { correctRef.current += 1; playSfx?.('correct'); flashRef.current = { until: performance.now() + 500, correctIdx: hit, wrongIdx: -1, symbol: cur.symbol }; }
    else { playSfx?.('wrong'); flashRef.current = { until: performance.now() + 800, correctIdx: cur.boxIdx, wrongIdx: hit, symbol: cur.symbol }; }
    cueIdxRef.current += 1;
    subRef.current = 'feedback';
    setCue('');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(presentCue, ok ? 450 : 850);
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
  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  return (
    <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
        {!cosmos && (
          <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); if (mode === 'free') awardFreeRun?.('pairedAssoc', bestRef.current); onExit?.(); }}>‹</button>
        )}
        {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{isAr ? 'مطابقة الأزواج' : 'Pair Match'}</div>
          <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>{hud}{mode === 'levels' ? ` · ${score}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
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
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <PairedAssociates3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_mem_pal"
      scienceId="paired-associates"
      title={{ en: 'Pair Match', ar: 'مطابقة الأزواج' }}
      hints={{
        free: { en: 'Endless practice — pairs grow', ar: 'تدريب مفتوح — تزداد الأزواج' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same pairs for all · pass the device', ar: 'نفس الأزواج للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 3, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('memory'),
      }]}
      renderEngine={(p) => (
        <PalEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)', fontFamily: "'Outfit', system-ui, sans-serif" },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  cueRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '12px 0 4px', fontSize: 15, fontWeight: 800, color: '#5a4a32', minHeight: 44 },
  cueSym: { fontSize: 30, lineHeight: 1, color: '#3a2c18', width: 54, height: 54, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#fff6df', border: '2.5px solid #1a1208', borderRadius: 13, boxShadow: '3px 3px 0 #1a1208' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 20, background: 'linear-gradient(180deg,#fffdf8,#fbf3e6)', overflow: 'hidden', border: '2px solid #e3d6c4', boxShadow: 'inset 0 2px 12px rgba(120,90,40,0.07)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
};
