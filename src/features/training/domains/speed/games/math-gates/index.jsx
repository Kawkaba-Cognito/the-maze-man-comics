import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalTier } from '../../../../shared/survival';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const MathGates3DProto = lazyWithRetry(() => import('./MathGates3DProto'), 'math-gates-3d');

/*
 * Math Gates — endless runner with rule-switching arithmetic (cognitive flexibility).
 * A runner holds LEFT / CENTRE / RIGHT. An equation (e.g. 7 × 9) shows up top and
 * three gates carry numbers — steer into the gate with the correct answer. The
 * OPERATION changes gate to gate (+, −, ×, ÷); harder equations at higher levels.
 * Wrong gate = crash (a life). Exactly one gate is always correct and reachable.
 * Modes: Free (lives, endless) / Levels (100) / Pass n Play (fixed gates, score).
 */

import { drawCosmosRunner, COSMOS_GOLD, COSMOS_LANE_A, COSMOS_LANE_B, COSMOS_STING_BG } from '../../../../shared/drawCosmosCanvas';
import { clamp, lerp } from '../../../../../../lib/math';
import { startCanvasLoop } from '../../../../shared/canvasLoop';

const ACCENT = COSMOS_GOLD;
const LANES = 3;
// Seconds for a gate to drift from the top to the runner line — a relaxed,
// constant pace (no countdown, no speed-up). Generous so it never feels like a
// timer; the only way to lose is steering into the wrong answer.
const DESCEND_SEC = 3.8;

const BASE = {
  easy: { ops: ['+', '-'], gap: 700, lives: 5, target: 8 },
  med: { ops: ['+', '-', '×'], gap: 650, lives: 4, target: 10 },
  hard: { ops: ['+', '-', '×', '÷'], gap: 600, lives: 3, target: 12 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  // Front-loaded curve (^0.85): the climb is felt earlier so levels feel more
  // distinct; level 1 and 100 unchanged.
  const f = Math.pow(((level || 1) - 1) / 99, 0.85);
  return { ...b, gap: Math.max(450, b.gap - f * 180), target: b.target + Math.round(f * 10), f };
}
const PP_GATES = 12;


/*
 * Equation + distractor generation, grounded in numerical-cognition research:
 *  • Problem-size effect — operand magnitude scales with the level/survival ramp,
 *    and the operation hierarchy (+ < − < × < ÷) drives base difficulty (large
 *    facts move from retrieval to procedure; PSE is strongest for ×). [Campbell;
 *    Núñez-Peña].
 *  • Numerical distance effect — the NEAREST wrong answer governs how hard the
 *    choice is. The split shrinks far→near as difficulty rises (easy ≈ ±8,
 *    hard ≈ ±2). [Dehaene; arithmetic-verification distance studies].
 *  • Plausible, parity-matched lures — all deltas are EVEN, so every option
 *    shares the answer's parity; the odd/even shortcut is removed and a real
 *    comparison is forced. For × we also seed a table-confusion operand error
 *    (ans ± a) when it is parity-safe.
 */
function genGate(diff, f, rng) {
  const ops = (BASE[diff] || BASE.med).ops;
  const op = ops[Math.floor(rng() * ops.length)];
  const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  let a, b, ans;
  if (op === '+') {
    const hi = diff === 'easy' ? 9 + Math.round(f * 12) : diff === 'med' ? 20 + Math.round(f * 25) : 40 + Math.round(f * 55);
    a = ri(1, hi); b = ri(1, hi); ans = a + b;
  } else if (op === '-') {
    const hi = diff === 'easy' ? 9 + Math.round(f * 12) : diff === 'med' ? 25 + Math.round(f * 30) : 50 + Math.round(f * 60);
    a = ri(2, hi); b = ri(1, a); ans = a - b;
  } else if (op === '×') {
    const hi = 9 + Math.round(f * (diff === 'med' ? 2 : 4));
    a = ri(2, hi); b = ri(2, hi); ans = a * b;
  } else { // ÷
    const dh = 9 + Math.round(f * 3), qh = 9 + Math.round(f * 3);
    b = ri(2, dh); const q = ri(2, qh); a = b * q; ans = q;
  }

  // Nearest-distractor distance (the discriminability driver): far when easy,
  // down to ±2 when hard. Even, so parity never gives the answer away.
  const nearDelta = clamp(Math.round(lerp(8, 2, f) / 2) * 2, 2, 10);
  const deltas = new Set();
  // Multiplication table-confusion lure (ans ± a), only if it preserves parity.
  if (op === '×' && a % 2 === 0 && a <= 8 && ans - a > 0) {
    deltas.add(rng() < 0.5 ? a : -a);
  }
  let guard = 0;
  while (deltas.size < 2 && guard++ < 80) {
    const step = nearDelta + 2 * Math.floor(rng() * 3); // nearDelta, +2, +4
    const d = step * (rng() < 0.5 ? -1 : 1);
    if (d !== 0 && ans + d >= 0) deltas.add(d);
  }
  const opts = new Set([ans]);
  for (const d of deltas) { if (opts.size < 3) opts.add(ans + d); }
  let g2 = 0;
  while (opts.size < 3 && g2++ < 40) {
    const d = (2 + 2 * Math.floor(rng() * 5)) * (rng() < 0.5 ? -1 : 1);
    if (ans + d >= 0) opts.add(ans + d);
  }
  while (opts.size < 3) opts.add(ans + opts.size * 2 + 2);
  const arr = [...opts];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { text: `${a} ${op} ${b}`, answer: ans, options: arr, correctLane: arr.indexOf(ans), op, a, b, split: nearDelta };
}

/* --- Research-grade metric layer ----------------------------------------- */
const _mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const _sd = (xs, m) => (xs.length < 2 || m == null ? null : Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)));
/** RT outlier trimming (Whelan, 2008): absolute bounds, then iterative ±2.5 SD. */
function _trim(raw) {
  let xs = raw.filter((r) => r != null && r >= 150 && r <= 9000);
  for (let p = 0; p < 3 && xs.length > 3; p++) {
    const m = _mean(xs); const s = _sd(xs, m);
    if (!s) break;
    const lo = m - 2.5 * s; const hi = m + 2.5 * s;
    const n = xs.filter((x) => x >= lo && x <= hi);
    if (n.length === xs.length) break;
    xs = n;
  }
  return xs;
}

/**
 * Summarize a run of gate events into research-grade processing-speed metrics:
 *  • correct/min — the standard arithmetic-fluency score (correct RPM).
 *  • accuracy, mean decision RT, RT variability (ICV = SD/mean).
 *  • switch cost — mean RT on operation-SWITCH gates minus operation-REPEAT
 *    gates: the cognitive-flexibility signature (Rubinsten; task-switching).
 *  • per-operation accuracy breakdown (+ − × ÷).
 */
function summarizeGates(events, elapsedSec) {
  let correct = 0;
  const rtsAll = []; const rtsSwitch = []; const rtsRepeat = [];
  const perOp = {};
  for (const e of events) {
    if (e.correct) correct++;
    (perOp[e.op] ||= { c: 0, n: 0 }).n++;
    if (e.correct) perOp[e.op].c++;
    if (e.correct && e.rtMs != null) {
      rtsAll.push(e.rtMs);
      if (e.isSwitch === true) rtsSwitch.push(e.rtMs);
      else if (e.isSwitch === false) rtsRepeat.push(e.rtMs);
    }
  }
  const total = events.length;
  const accuracy = total ? correct / total : 1;
  const dur = Math.max(1, elapsedSec || 1);
  const correctPerMin = +(correct / (dur / 60)).toFixed(1);
  const rts = _trim(rtsAll);
  const m = _mean(rts);
  const meanRt = m != null ? Math.round(m) : null;
  const s = _sd(rts, m);
  const icv = m && s != null ? +(s / m).toFixed(2) : null;
  const ms = _mean(_trim(rtsSwitch)); const mr = _mean(_trim(rtsRepeat));
  const switchCost = ms != null && mr != null && rtsSwitch.length >= 3 && rtsRepeat.length >= 3
    ? Math.round(ms - mr) : null;
  return { correct, total, accuracy, accuracyPct: Math.round(accuracy * 100), correctPerMin, meanRt, icv, switchCost, perOp };
}

export function MathGatesEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
  const ppGates = mode === 'passplay' ? (attempt?.trials || PP_GATES) : 0;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const finishedRef = useRef(false);
  const resolveRef = useRef(() => {}); // commit an answer (set inside the loop effect)

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [hud, setHud] = useState({ passed: 0, lives: 0, combo: 0 });
  const [eqParts, setEqParts] = useState(null);
  const [sting, setSting] = useState(null);

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
    const elapsedSec = (performance.now() - g.t0) / 1000;
    const summary = summarizeGates(g.events, elapsedSec);
    if (mode === 'free') { setOver({ score: g.passed, metrics: summary }); awardFreeRun?.('mathGates', g.passed); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.passed >= cfg.target;
      const sw = summary.switchCost != null
        ? (isAr ? ` · تبديل +${summary.switchCost}مث` : ` · switch +${summary.switchCost}ms`) : '';
      const rt = summary.meanRt != null ? `${summary.meanRt}${isAr ? 'مث' : 'ms'}` : '—';
      onResult({ won, score: g.passed, summary: `${g.passed}/${cfg.target} · ${summary.accuracyPct}% · ${rt}${sw}` });
    } else onResult({ score: g.passed });
  }, [mode, cfg.target, onResult, isAr, playSfx, awardFreeRun]);

  // Steer the runner between lanes — the lane you're in when the gate arrives is
  // your answer. `lastMoveAt` records when you last steered (for decision time).
  const setLane = useCallback((ln) => {
    const g = stateRef.current; if (!g || finishedRef.current) return;
    const next = Math.max(0, Math.min(LANES - 1, ln));
    if (next !== g.lane) { g.lane = next; g.lastMoveAt = performance.now(); playSfx('click'); }
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
      events: [], prevOp: null, lastMoveAt: null, // per-gate science capture
      W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    stateRef.current = g;
    finishedRef.current = false;

    const spawnGate = () => {
      // Survival escalates the equation TIER and magnitude by SKILL — how many
      // gates you've cleared — not the wall-clock, so a slower (accurate) player
      // isn't punished and a fast one can't out-run the ramp. Reaches peak ≈36 gates.
      const f = mode === 'free' ? clamp(g.gatesPlayed / 36, 0, 1) : cfg.f;
      const dk = mode === 'free' ? survivalTier(f) : dkey;
      const eqObj = genGate(dk, f, rng);
      const bandH = Math.min(g.H * 0.16, 96);
      g.gate = { y: -bandH, eq: eqObj, shownAt: performance.now() };
      g.lastMoveAt = null; // decision time is measured from this gate's onset
      const switched = g.prevOp != null && eqObj.op !== g.prevOp;
      setEqParts({ a: eqObj.a, op: eqObj.op, b: eqObj.b, switched });
    };

    // Resolve the gate by the lane the runner is in when it ARRIVES (called from
    // the frame loop on arrival). There is no clock/time-bank — the gate just
    // drifts down at a relaxed, constant pace; you lose only by steering wrong,
    // and only multiple wrong answers (lives) end the run.
    resolveRef.current = (lane) => {
      if (finishedRef.current || !g.gate) return;
      const eqo = g.gate.eq;
      const now = performance.now();
      g.gatesPlayed += 1;
      const ok = lane === eqo.correctLane;
      const isSwitch = g.prevOp == null ? null : eqo.op !== g.prevOp;
      // Decision time = onset → last steer (null if the runner never moved).
      const rtMs = g.lastMoveAt != null ? Math.round(g.lastMoveAt - g.gate.shownAt) : null;
      g.events.push({ op: eqo.op, a: eqo.a, b: eqo.b, answer: eqo.answer, chosen: eqo.options[lane], correct: ok, rtMs, isSwitch, split: eqo.split });
      g.prevOp = eqo.op;
      if (ok) {
        g.passed += 1; g.combo += 1; if (g.combo > g.bestCombo) g.bestCombo = g.combo;
        awardPoints(1); playSfx('collect');
        g.flash = { ok: true, until: now + 350, lane };
        if (mode === 'levels' && g.passed >= cfg.target) { finish(); return; }
      } else {
        g.combo = 0; playSfx('error');
        g.flash = { ok: false, until: now + 450, lane: eqo.correctLane, picked: lane };
        if (mode === 'levels' || mode === 'free') { g.lives -= 1; if (g.lives <= 0) { finish(); return; } }
      }
      if (mode === 'passplay' && g.gatesPlayed >= ppGates) { g.gate = null; finish(); return; }
      g.gate = null; g.gapTimer = cfg.gap;
    };

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      g.W = r.width; g.H = r.height;
      canvas.width = Math.round(r.width * g.dpr); canvas.height = Math.round(r.height * g.dpr);
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      if (!g.charX) g.charX = (g.lane + 0.5) * (g.W / LANES);
      if (g.gate && g.gate.y < 0) g.gate.y = -g.H * 0.18;
    };
    spawnGate();

    const laneX = (i) => (i + 0.5) * (g.W / LANES);

    let hudCache = { passed: -1, lives: -1, combo: -1 };
    const frame = (dt, now) => {
      const bandH = Math.min(g.H * 0.16, 96);
      const charY = g.H - 64;
      const catchY = charY - bandH * 0.3;

      if (g.gate) {
        // The gate drifts down at a relaxed, CONSTANT pace (no clock, no speed-up).
        // Steer the runner under the correct answer before it arrives; on arrival
        // the current lane is your answer. Generous travel time so it's not a
        // time trap — you lose only by choosing wrong.
        const descendPx = (catchY + bandH) / DESCEND_SEC;
        g.gate.y += descendPx * dt;
        if (g.gate.y >= catchY) {
          g.gate.y = catchY;
          resolveRef.current(g.lane);
          if (finishedRef.current) return false;
        }
      } else {
        g.gapTimer -= dt * 1000;
        if (g.gapTimer <= 0) { spawnGate(); }
      }

      const targetX = laneX(g.lane);
      g.charX += (targetX - g.charX) * Math.min(1, dt * 18);

      // draw
      ctx.clearRect(0, 0, g.W, g.H);
      // road lanes
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = i % 2 ? COSMOS_LANE_A : COSMOS_LANE_B;
        ctx.fillRect((i / LANES) * g.W, 0, g.W / LANES, g.H);
      }
      for (let i = 1; i < LANES; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo((i / LANES) * g.W, 0); ctx.lineTo((i / LANES) * g.W, g.H); ctx.stroke();
      }
      // gate band
      if (g.gate) {
        const y = g.gate.y;
        for (let i = 0; i < LANES; i++) {
          const x = (i / LANES) * g.W;
          ctx.fillStyle = '#fffdf8';
          ctx.strokeStyle = ACCENT; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(x + 6, y - bandH / 2, g.W / LANES - 12, bandH, 12); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#2d2d2d';
          ctx.font = `900 ${Math.round(bandH * 0.42)}px Outfit, system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(g.gate.eq.options[i]), x + (g.W / LANES) / 2, y);
        }
      }
      // catch line
      ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, charY); ctx.lineTo(g.W, charY); ctx.stroke();
      // flash feedback on lanes (uses the captured picked/correct lanes so it
      // stays correct even if the next gate has already spawned)
      if (g.flash && now < g.flash.until) {
        if (g.flash.ok) { ctx.fillStyle = 'rgba(59,224,134,0.18)'; ctx.fillRect(laneX(g.flash.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H); }
        else {
          ctx.fillStyle = 'rgba(255,90,90,0.16)'; ctx.fillRect(laneX(g.flash.picked) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
          ctx.fillStyle = 'rgba(59,224,134,0.22)'; ctx.fillRect(laneX(g.flash.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
        }
      }
      // runner
      const cx = g.charX, cy = charY;
      const rr = Math.min(g.W / LANES, 90) * 0.34;
      drawCosmosRunner(ctx, cx, cy, rr, { ring: false });

      if (g.passed !== hudCache.passed || g.lives !== hudCache.lives || g.combo !== hudCache.combo) {
        hudCache = { passed: g.passed, lives: g.lives, combo: g.combo };
        setHud(hudCache);
      }
    };
    return startCanvasLoop({ wrap: wrapRef.current, rafRef, resize, frame });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, seed]);

  useEffect(() => { if (!sting) return; const id = setTimeout(() => setSting(null), 800); return () => clearTimeout(id); }, [sting]);

  const restart = () => { setOver(null); finishedRef.current = false; setRunId((n) => n + 1); };

  // Tapping a lane STEERS the runner there (your answer is whichever lane you're
  // in when the gate arrives).
  const onCanvasTap = (e) => {
    const g = stateRef.current; if (!g) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLane(Math.floor(((e.clientX - rect.left) / rect.width) * LANES));
  };

  const S = styles;
  const L = isAr
    ? { perMin: 'صحيح/دقيقة', acc: 'الدقة', rt: 'زمن القرار', rtVar: 'تغيّر الزمن', sw: 'كلفة التبديل',
        note: 'صحيح/دقيقة هي طلاقتك الحسابية. «كلفة التبديل» هي بطؤك عندما تتغيّر العملية.' }
    : { perMin: 'Correct/min', acc: 'Accuracy', rt: 'Decision time', rtVar: 'RT variability', sw: 'Switch cost',
        note: 'Correct/min is your arithmetic fluency. Switch cost is how much the changing operation slows you.' };
  const showLives = mode !== 'passplay';
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.passed}/${cfg.target}` : `Lvl ${level} · ${hud.passed}/${cfg.target}`)
    : mode === 'passplay' ? (isAr ? `صحيح ${hud.passed}` : `Correct ${hud.passed}`)
      : (isAr ? `صحيح ${hud.passed}` : `Correct ${hud.passed}`);

  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;

  return (
    <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
        {!cosmos && (
          <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        )}
        {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{isAr ? 'بوابات الحساب' : 'Math Gates'}</div>
          <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>{head}{showLives ? ` · ${'♥'.repeat(Math.max(0, hud.lives))}` : ''}{hud.combo > 1 ? ` · 🔥${hud.combo}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={S.eqWrap}>
        <span style={S.eqNum}>{eqParts?.a}</span>
        <span
          key={`${eqParts?.op}-${eqParts?.a}-${eqParts?.b}`}
          className={`mg-op${eqParts?.switched ? ' mg-op--switch' : ''}`}
        >
          {eqParts?.op}
        </span>
        <span style={S.eqNum}>{eqParts?.b}</span>
        <span style={S.eqQ}>= ?</span>
      </div>

      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} onPointerDown={onCanvasTap} style={{ display: 'block', touchAction: 'none' }} />
        {sting && <div key={sting.id} style={S.sting}><div style={S.stingInner}>{sting.text}</div></div>}
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `صحيح ${over.score}` : `${over.score} correct`}</div>
              {over.metrics && (
                <>
                  <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid" style={{ marginTop: 14 }}>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.correctPerMin}</div><div className="ct-fq-rl">{L.perMin}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.accuracyPct}%</div><div className="ct-fq-rl">{L.acc}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.meanRt != null ? `${over.metrics.meanRt}${isAr ? 'مث' : 'ms'}` : '—'}</div><div className="ct-fq-rl">{L.rt}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.icv != null ? `${Math.round(over.metrics.icv * 100)}%` : '—'}</div><div className="ct-fq-rl">{L.rtVar}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.switchCost != null ? `+${over.metrics.switchCost}${isAr ? 'مث' : 'ms'}` : '—'}</div><div className="ct-fq-rl">{L.sw}</div></div>
                  </div>
                  <p style={S.overNote}>{L.note}</p>
                </>
              )}
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

export default function MathGatesGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <MathGates3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')}>
          <MathGatesEngine mode="free" diff="med" level={1} seed={null} cosmos isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} onResult={() => {}} onExit={() => {
            awardFreeRun?.('mathGates', 0);
            setView('shell');
          }} />
        </MathGates3DProto>
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_flx_mathgates"
      scienceId="math-gates"
      title={{ en: 'Math Gates', ar: 'بوابات الحساب' }}
      hints={{
        free: { en: 'Run the right gate — operations keep changing', ar: 'اعبُر البوابة الصحيحة — العمليات تتغيّر' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same equations for all · pass the device', ar: 'نفس المعادلات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_GATES, scoreLabel: { en: 'correct', ar: 'صحيح' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نفس اللعبة · بيئة كونية ثلاثية الأبعاد' : 'Same game · cosmos 3D stage',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('speed'),
      }]}
      renderEngine={(p) => (
        <MathGatesEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)', fontFamily: "'Outfit', system-ui, sans-serif" },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  eqWrap: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 12, padding: '8px 0 4px', minHeight: 48 },
  eqNum: { fontWeight: 900, fontSize: 'clamp(30px, 9vw, 48px)', color: 'var(--color-training-ink, #2d2d2d)', letterSpacing: 1 },
  eqQ: { fontWeight: 900, fontSize: 'clamp(20px, 6vw, 30px)', color: ACCENT },
  play: { position: 'relative', flex: 1, overflow: 'hidden', margin: '0 8px 8px', borderRadius: 16, border: '1px solid rgba(58,51,40,0.10)', boxShadow: '0 10px 28px rgba(45,40,30,0.12), inset 0 0 0 1px rgba(255,255,255,0.4)' },
  sting: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  stingInner: { fontSize: 'clamp(26px, 8vw, 56px)', fontWeight: 900, color: '#fff', background: COSMOS_STING_BG, padding: '10px 24px', borderRadius: 16, boxShadow: '4px 4px 0 #1a1208', animation: 'flipStingPop .8s ease-out' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '20px 22px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6', width: 'min(92vw, 380px)', maxHeight: '88%', overflowY: 'auto' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#5a4a32' },
  overNote: { marginTop: 10, fontSize: 12.5, lineHeight: 1.45, color: '#8a8078', textAlign: 'center' },
  overBtn: { flex: 1, padding: '15px 16px', fontWeight: 900, fontSize: 16, color: '#fff', background: ACCENT, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
  controls: { display: 'flex', gap: 14, padding: '14px 18px calc(14px + env(safe-area-inset-bottom))' },
  ctrlBtn: { flex: 1, height: 84, fontSize: 38, fontWeight: 900, color: '#fff', background: ACCENT, border: 'none', borderRadius: 20, boxShadow: '4px 4px 0 #1a1208', cursor: 'pointer', touchAction: 'none', userSelect: 'none' },
};
