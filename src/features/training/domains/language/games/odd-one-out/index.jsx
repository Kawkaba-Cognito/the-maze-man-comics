import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { SURVIVAL_MS, survivalRamp, survivalTier, drawSurvivalBar } from '../../../../shared/survival';
import { drawCosmosRunner, COSMOS_GOLD, COSMOS_LANE_A, COSMOS_LANE_B, COSMOS_STING_BG } from '../../../../shared/drawCosmosCanvas';
import { CATEGORIES } from './data';
import { startCanvasLoop } from '../../../../shared/canvasLoop';

/*
 * Odd One Out — 3-lane runner (language / semantic categories, bilingual).
 * Three words appear instantly at the top. You have THINK_SEC seconds to pick
 * the odd word while the planet walks up toward them. Modes: Free / Levels / Pass n Play.
 */

const ACCENT = COSMOS_GOLD;
const LANES = 3;
const THINK_SEC = 7;
const PP_GATES = 10;

const BASE = {
  easy: { gap: 500, lives: 5, target: 8, nearProb: 0.08 },
  med: { gap: 450, lives: 4, target: 10, nearProb: 0.45 },
  hard: { gap: 400, lives: 3, target: 12, nearProb: 0.82 },
};

function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return {
    ...b,
    gap: Math.max(350, b.gap - f * 80),
    target: b.target + Math.round(f * 8),
    nearProb: Math.min(1, b.nearProb + f * 0.12),
    f,
  };
}

const pickOne = (a, rng) => a[Math.floor(rng() * a.length)];
function shuffle(a, rng) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function genTrial(diff, f, nearProb, rng, isAr) {
  const near = rng() < nearProb;
  const cat = pickOne(CATEGORIES, rng);
  const members = shuffle(cat.members, rng).slice(0, 2);
  let oddPool = near
    ? CATEGORIES.filter((c) => c.group === cat.group && c.id !== cat.id)
    : CATEGORIES.filter((c) => c.group !== cat.group);
  if (!oddPool.length) oddPool = CATEGORIES.filter((c) => c.id !== cat.id);
  const oddCat = pickOne(oddPool, rng);
  const odd = pickOne(oddCat.members, rng);
  const label = (m) => (isAr ? m.ar : m.en);
  const opts = shuffle([
    { text: label(members[0]), correct: false },
    { text: label(members[1]), correct: false },
    { text: label(odd), correct: true },
  ], rng);
  return {
    options: opts.map((o) => o.text),
    correctLane: opts.findIndex((o) => o.correct),
  };
}

function fitWordFont(ctx, text, maxW, maxH, family) {
  let size = Math.round(maxH * 0.38);
  while (size > 11) {
    ctx.font = `900 ${size}px ${family}`;
    if (ctx.measureText(text).width <= maxW - 10) return size;
    size -= 1;
  }
  return 11;
}

function OddOneOutEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppGates = mode === 'passplay' ? (attempt?.trials || PP_GATES) : 0;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const finishedRef = useRef(false);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [hud, setHud] = useState({ passed: 0, lives: 0, combo: 0, secs: 0 });
  const fontFamily = isAr ? 'Cairo, sans-serif' : 'Outfit, system-ui, sans-serif';

  const cfg = useMemo(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return { ...levelCfg('med', 1) };
    return { ...levelCfg('easy', 1) };
  }, [mode, diff, level]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const g = stateRef.current;
    if (mode === 'free') { setOver({ score: g.passed }); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.passed >= cfg.target;
      onResult({
        won,
        score: g.passed,
        summary: isAr ? `${g.passed}/${cfg.target} صحيح` : `${g.passed}/${cfg.target} correct`,
      });
    } else onResult({ score: g.passed });
  }, [mode, cfg.target, onResult, isAr, playSfx]);

  const setLane = useCallback((ln) => {
    const g = stateRef.current; if (!g || finishedRef.current) return;
    const next = Math.max(0, Math.min(LANES - 1, ln));
    if (next !== g.lane) { g.lane = next; playSfx('click'); }
  }, [playSfx]);
  const moveBy = useCallback((d) => { const g = stateRef.current; if (g) setLane(g.lane + d); }, [setLane]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); moveBy(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveBy(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveBy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dkey = mode === 'levels' ? diff : mode === 'passplay' ? 'med' : 'easy';
    const rng = makeRng(((seed ?? 1) >>> 0) ^ ((runId * 40503) >>> 0));

    const g = {
      lane: 1, gate: null, gapTimer: cfg.gap, t0: performance.now(),
      passed: 0, lives: cfg.lives, combo: 0, bestCombo: 0, gatesPlayed: 0,
      flash: null, charX: 0,
      W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    stateRef.current = g;
    finishedRef.current = false;

    const bandH = () => Math.min(g.H * 0.14, 88);
    const wordY = () => bandH() * 0.65 + 10;

    const spawnGate = () => {
      const f = mode === 'free' ? survivalRamp(performance.now() - g.t0) : cfg.f;
      const dk = mode === 'free' ? survivalTier(f) : dkey;
      const nearProb = mode === 'free'
        ? (dk === 'easy' ? 0.1 : dk === 'med' ? 0.45 : 0.75) + f * 0.15
        : cfg.nearProb;
      const trial = genTrial(dk, f, nearProb, rng, isAr);
      g.gate = { trial, t0: performance.now(), y: wordY() };
    };

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      g.W = r.width; g.H = r.height;
      canvas.width = Math.round(r.width * g.dpr); canvas.height = Math.round(r.height * g.dpr);
      canvas.style.width = `${r.width}px`; canvas.style.height = `${r.height}px`;
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      if (!g.charX) g.charX = (g.lane + 0.5) * (g.W / LANES);
      if (g.gate) g.gate.y = wordY();
    };
    spawnGate();

    const laneX = (i) => (i + 0.5) * (g.W / LANES);
    let hudCache = { passed: -1, lives: -1, combo: -1, secs: -1 };

    const frame = (dt, now) => {
      const bh = bandH();
      const baseCharY = g.H - 64;
      let secsLeft = 0;
      let runnerFeetY = baseCharY;
      let progress = 0;

      if (g.gate) {
        const elapsed = (now - g.gate.t0) / 1000;
        progress = Math.min(1, elapsed / THINK_SEC);
        secsLeft = Math.max(0, Math.ceil(THINK_SEC - elapsed));
        const reachY = g.gate.y + bh * 0.75;
        runnerFeetY = baseCharY - progress * (baseCharY - reachY);

        if (progress >= 1) {
          g.gatesPlayed += 1;
          const ok = g.lane === g.gate.trial.correctLane;
          if (ok) {
            g.passed += 1;
            g.combo += 1;
            if (g.combo > g.bestCombo) g.bestCombo = g.combo;
            awardPoints(1);
            playSfx('collect');
            g.flash = { ok: true, until: now + 350 };
            if (mode === 'levels' && g.passed >= cfg.target) { finish(); return false; }
          } else {
            g.combo = 0;
            playSfx('error');
            g.flash = { ok: false, until: now + 450, lane: g.gate.trial.correctLane };
            if (mode === 'levels' || mode === 'free') {
              g.lives -= 1;
              if (g.lives <= 0) { finish(); return false; }
            }
          }
          if (mode === 'passplay' && g.gatesPlayed >= ppGates) { g.gate = null; finish(); return false; }
          g.gate = null;
          g.gapTimer = cfg.gap;
        }
      } else {
        g.gapTimer -= dt * 1000;
        if (g.gapTimer <= 0) spawnGate();
      }

      const targetX = laneX(g.lane);
      g.charX += (targetX - g.charX) * Math.min(1, dt * 18);

      let survPct = 1;
      if (mode === 'free') {
        const elapsed = now - g.t0;
        if (elapsed >= SURVIVAL_MS) { finish(); return false; }
        survPct = 1 - elapsed / SURVIVAL_MS;
      }

      ctx.clearRect(0, 0, g.W, g.H);
      if (mode === 'free') drawSurvivalBar(ctx, g.W, survPct, ACCENT);

      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = i % 2 ? COSMOS_LANE_A : COSMOS_LANE_B;
        ctx.fillRect((i / LANES) * g.W, 0, g.W / LANES, g.H);
      }
      for (let i = 1; i < LANES; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo((i / LANES) * g.W, 0);
        ctx.lineTo((i / LANES) * g.W, g.H);
        ctx.stroke();
      }

      if (g.gate) {
        const y = g.gate.y;
        const laneW = g.W / LANES;

        for (let i = 0; i < LANES; i++) {
          const x = i * laneW;
          const word = g.gate.trial.options[i];
          const boxW = laneW - 12;
          const selected = i === g.lane;
          ctx.fillStyle = selected ? '#fff8ec' : '#fffdf8';
          ctx.strokeStyle = selected ? '#a87228' : ACCENT;
          ctx.lineWidth = selected ? 4 : 3;
          ctx.beginPath();
          ctx.roundRect(x + 6, y - bh / 2, boxW, bh, 12);
          ctx.fill();
          ctx.stroke();
          const fs = fitWordFont(ctx, word, boxW, bh, fontFamily);
          ctx.fillStyle = '#2d2d2d';
          ctx.font = `900 ${fs}px ${fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(word, x + laneW / 2, y);
        }

        // Progress track between words and runner
        const trackTop = y + bh * 0.55;
        const trackBot = runnerFeetY - bh * 0.2;
        if (trackBot > trackTop + 8) {
          ctx.strokeStyle = 'rgba(0,0,0,0.08)';
          ctx.lineWidth = 3;
          ctx.setLineDash([6, 8]);
          ctx.beginPath();
          ctx.moveTo(g.charX, trackBot);
          ctx.lineTo(g.charX, trackTop);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, baseCharY);
      ctx.lineTo(g.W, baseCharY);
      ctx.stroke();

      if (g.flash && now < g.flash.until) {
        if (g.flash.ok) {
          ctx.fillStyle = 'rgba(59,224,134,0.18)';
          ctx.fillRect(laneX(g.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
        } else {
          ctx.fillStyle = 'rgba(255,90,90,0.16)';
          ctx.fillRect(laneX(g.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
          ctx.fillStyle = 'rgba(59,224,134,0.22)';
          ctx.fillRect(laneX(g.flash.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
        }
      }

      const rr = Math.min(g.W / LANES, 90) * 0.32;
      drawCosmosRunner(ctx, g.charX, runnerFeetY, rr, { eyeLook: 'forward' });

      if (
        g.passed !== hudCache.passed
        || g.lives !== hudCache.lives
        || g.combo !== hudCache.combo
        || secsLeft !== hudCache.secs
      ) {
        hudCache = { passed: g.passed, lives: g.lives, combo: g.combo, secs: secsLeft };
        setHud(hudCache);
      }
    };
    return startCanvasLoop({ wrap: wrapRef.current, rafRef, resize, frame });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, seed, isAr]);

  const restart = () => { setOver(null); finishedRef.current = false; setRunId((n) => n + 1); };

  const onCanvasTap = (e) => {
    const g = stateRef.current; if (!g) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLane(Math.floor(((e.clientX - rect.left) / rect.width) * LANES));
  };

  const S = styles;
  const showLives = mode !== 'passplay';
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.passed}/${cfg.target}` : `Lvl ${level} · ${hud.passed}/${cfg.target}`)
    : mode === 'passplay'
      ? (isAr ? `صحيح ${hud.passed}` : `Correct ${hud.passed}`)
      : (isAr ? `صحيح ${hud.passed}` : `Correct ${hud.passed}`);
  const prompt = isAr ? 'أيّها لا ينتمي؟' : "Which one doesn't belong?";

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'الشاذّ' : 'Odd One Out'}</div>
          <div className="ct-training-play-sub">
            {head}
            {showLives ? ` · ${'♥'.repeat(Math.max(0, hud.lives))}` : ''}
            {hud.combo > 1 ? ` · 🔥${hud.combo}` : ''}
          </div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={S.promptWrap}>
        <span style={S.prompt}>{prompt}</span>
        {hud.secs > 0 && (
          <span style={S.timer}>{isAr ? `${hud.secs} ث` : `${hud.secs}s`}</span>
        )}
      </div>

      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} onPointerDown={onCanvasTap} style={{ display: 'block', touchAction: 'none' }} />
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `صحيح ${over.score}` : `${over.score} correct`}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button style={S.overBtn} onClick={() => { playSfx('click'); restart(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
                <button style={{ ...S.overBtn, background: '#cdbfa6' }} onClick={() => { playSfx('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={S.controls}>
        <button style={S.ctrlBtn} aria-label={isAr ? 'يسار' : 'Left'} onPointerDown={(e) => { e.preventDefault(); moveBy(-1); }}>◀</button>
        <button style={S.ctrlBtn} aria-label={isAr ? 'يمين' : 'Right'} onPointerDown={(e) => { e.preventDefault(); moveBy(1); }}>▶</button>
      </div>
    </div>
  );
}

export default function OddOneOutGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_lang_oddone"
      scienceId="odd-one-out"
      title={{ en: 'Odd One Out', ar: 'الشاذّ' }}
      hints={{
        free: { en: 'Words show instantly — 7s to pick the odd one', ar: 'الكلمات فوراً — ٧ ثوانٍ لاختيار الشاذّ' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same words for all · pass the device', ar: 'نفس الكلمات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_GATES, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <OddOneOutEngine
          key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
        />
      )}
    />
  );
}

const styles = {
  root: {
    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
    background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)',
    fontFamily: "'Outfit', system-ui, sans-serif",
  },
  promptWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    padding: '8px 12px 4px', minHeight: 44, flexWrap: 'wrap',
  },
  prompt: { fontWeight: 900, fontSize: 'clamp(16px, 4.5vw, 22px)', color: 'var(--color-training-ink, #2d2d2d)', textAlign: 'center' },
  timer: {
    fontWeight: 900, fontSize: 'clamp(14px, 4vw, 18px)', color: '#fff',
    background: COSMOS_STING_BG, padding: '4px 12px', borderRadius: 999,
    boxShadow: '2px 2px 0 #1a1208', minWidth: 44, textAlign: 'center',
  },
  play: { position: 'relative', flex: 1, overflow: 'hidden' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#5a4a32' },
  overBtn: { flex: 1, padding: '15px 16px', fontWeight: 900, fontSize: 16, color: '#fff', background: ACCENT, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
  controls: { display: 'flex', gap: 14, padding: '14px 18px calc(14px + env(safe-area-inset-bottom))' },
  ctrlBtn: { flex: 1, height: 84, fontSize: 38, fontWeight: 900, color: '#fff', background: ACCENT, border: 'none', borderRadius: 20, boxShadow: '4px 4px 0 #1a1208', cursor: 'pointer', touchAction: 'none', userSelect: 'none' },
};
