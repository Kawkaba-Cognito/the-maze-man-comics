import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import { SURVIVAL_MS } from '../../../../shared/survival';
import { clamp, lerp } from '../../../../../../lib/math';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const TrailMaking3DProto = lazyWithRetry(() => import('./TrailMaking3DProto'), 'trail-making-3d');

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

// Difficulty = SET SIZE (number of circles to scan) + the par time (deadline).
// The Trail Making Test is a visual-search / processing-speed measure, so more
// circles = a longer scan path = harder, and a tighter par adds speed pressure.
// Per-tier [n0,n1] / [t0,t1] endpoints stay DISTINCT across the 100 levels (they
// used to all converge on 30 circles / 11 s, erasing the tiers at high levels).
const BASE = {
  easy: { n0: 8,  n1: 18, t0: 32000, t1: 16000 },
  med:  { n0: 14, n1: 26, t0: 34000, t1: 14000 },
  hard: { n0: 20, n1: 34, t0: 36000, t1: 12000 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  // Front-loaded curve (^0.85): the climb is felt earlier so levels feel more
  // distinct; level 1 and 100 unchanged.
  const f = Math.pow(clamp(((level || 1) - 1) / 99, 0, 1), 0.85);
  return { n: Math.round(lerp(b.n0, b.n1, f)), time: Math.round(lerp(b.t0, b.t1, f)) };
}
function rampCfg(boardIdx) {
  return { n: Math.min(8 + boardIdx * 2, 30), time: Math.max(14000, 32000 - boardIdx * 1500) };
}
const fmt = (ms) => `${Math.max(0, ms / 1000).toFixed(1)}s`;

// Two CVD-safe colours for the Color Trails (CTT-2) variant — blue / amber.
const CTT_COLORS = ['#0072B2', '#E69F00'];

/*
 * Trail VARIANTS (all language-free, so they work in EN + AR):
 *   forward — connect 1→n (CTT-1 / TMT-A): processing speed + visual scanning.
 *   color   — Color Trails (CTT-2, D'Elia): each number appears in BOTH colours
 *             and you alternate colours as you ascend, so the same number in the
 *             wrong colour is a built-in lure → cognitive flexibility / set-shift.
 * Plus an optional `decoys` count — distractor circles to ignore (CTMT, Reynolds)
 * → selective attention / inhibition.
 *
 * Rollout (rotate everywhere): survival cycles for variety; levels introduce the
 * executive layers by tier — easy = pure speed, medium adds set-shifting, hard
 * adds inhibition. So the tiers map onto a real skill progression.
 */
function boardSpecLevel(diff, level) {
  const f = clamp(((level || 1) - 1) / 99, 0, 1);
  if (diff === 'easy') return { variant: 'forward', decoys: f > 0.6 ? 2 : 0 };
  const band = Math.floor((level - 1) / 4); // the rule changes every 4 levels, not every level
  if (diff === 'med') return { variant: band % 2 === 1 ? 'color' : 'forward', decoys: f > 0.5 ? 2 : 0 };
  return { variant: band % 2 === 1 ? 'color' : 'forward', decoys: 2 + Math.round(f * 3) }; // hard
}
// Survival teaches one rule at a time: a fixed sequence of 3-board PHASES so each
// rule stays consistent for a stretch before a clearly-announced change.
const SURV_PHASES = [
  { variant: 'forward', decoys: 0 }, // learn the basic trail
  { variant: 'color', decoys: 0 },   // add set-shifting
  { variant: 'forward', decoys: 2 }, // add inhibition
  { variant: 'color', decoys: 2 },   // combine
];
function boardSpecSurvival(boardIdx) {
  const phase = Math.floor(boardIdx / 3); // 3 boards per rule
  if (phase < SURV_PHASES.length) return SURV_PHASES[phase];
  // Beyond the intro: alternate forward/colour, decoys creep up slowly.
  const variant = phase % 2 === 0 ? 'forward' : 'color';
  return { variant, decoys: Math.min(2 + Math.floor((phase - SURV_PHASES.length) / 2), 6) };
}

/**
 * Pure, render-free ordered node sequence for one Survival board — the same
 * n / variant / colour-alternation `newBoard()` builds, minus canvas layout.
 * Numbers 1..n in ascending order (TMT-A forward rule); the Color-Trails
 * variant alternates the EXPECTED colour each step (CTT-2). Used by the 3D
 * prototype so its sequence order + colour rule match the 2D game exactly.
 */
export function prepareTrailRound(stage, seed) {
  const rng = makeRng((seed ?? 1) >>> 0);
  const boardIdx = Math.max(0, stage | 0);
  const base = rampCfg(boardIdx);
  const spec = boardSpecSurvival(boardIdx);
  const n = base.n;
  const startColor = rng() < 0.5 ? 0 : 1;
  const nodes = [];
  for (let k = 1; k <= n; k++) {
    const colorIndex = spec.variant === 'color' ? (startColor + (k - 1)) % 2 : 0;
    nodes.push({ label: String(k), colorIndex });
  }
  return { n, variant: spec.variant, decoys: spec.decoys || 0, startColor, timeMs: base.time, nodes, colors: CTT_COLORS };
}

export function TrailEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 1) : 0;
  const ppTimeRef = useRef(0);
  const ppDoneRef = useRef(0);
  const [ppBoard, setPpBoard] = useState(1);
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
  const cfgRef = useRef({ n: 8, time: 30000, variant: 'forward', decoys: 0, startColor: 0, totalCircles: 8 });
  const rafRef = useRef(0);
  const clockRef = useRef(null);
  const survT0Ref = useRef(performance.now());
  const finishedRef = useRef(false);
  // Metric capture (assess + train): per-board completion-time / errors via the
  // shared trial log, plus running survival totals for the scanning-rate readout.
  const trialLogRef = useRef(null);
  const sumUsedRef = useRef(0);
  const sumErrRef = useRef(0);
  const sumItemsRef = useRef(0);
  const tapTimesRef = useRef([]); // per-board correct-tap timestamps → segment timing
  // "Ready" banner: announce the rule (only when it CHANGES) so a run feels
  // consistent — same-rule boards flow on without interruption.
  const readyRef = useRef(false);
  const prevRuleRef = useRef(null);
  const readyTimerRef = useRef(null);
  const [readyInfo, setReadyInfo] = useState(null);
  // Per-variant survival totals → interference cost (Color time − plain time).
  const sumFwdRef = useRef(0);
  const cntFwdRef = useRef(0);
  const sumColorRef = useRef(0);
  const cntColorRef = useRef(0);

  const isSurvival = mode === 'free';
  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [survPct, setSurvPct] = useState(1);
  const [survLeft, setSurvLeft] = useState(SURVIVAL_MS);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(0);
  const [prog, setProg] = useState(0);
  const [boards, setBoards] = useState(0);

  const timed = mode === 'levels' || isSurvival;

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    endedRef.current = true;
    clearInterval(clockRef.current);
    const boards = boardIdxRef.current;
    const avgMs = boards > 0 ? Math.round(sumUsedRef.current / boards) : 0;
    const ipm = sumUsedRef.current > 0 ? Math.round(sumItemsRef.current / (sumUsedRef.current / 60000)) : 0;
    // Interference cost (Color Trails − plain), the CTT executive marker.
    const avgF = cntFwdRef.current ? sumFwdRef.current / cntFwdRef.current : 0;
    const avgC = cntColorRef.current ? sumColorRef.current / cntColorRef.current : 0;
    const interferenceMs = avgF > 0 && avgC > 0 ? Math.round(avgC - avgF) : null;
    trialLogRef.current?.finish({ boards, score: scoreRef.current, interferenceMs });
    setOver({ score: scoreRef.current, boards, avgMs, ipm, errors: sumErrRef.current, interferenceMs });
    awardFreeRun?.('trailMaking', boards);
    playSfx?.('error');
  }, [playSfx, awardFreeRun]);

  const restartSurvival = () => {
    finishedRef.current = false;
    endedRef.current = false;
    boardIdxRef.current = 0;
    scoreRef.current = 0;
    survT0Ref.current = performance.now();
    setScore(0);
    setBoards(0);
    setOver(null);
    setSurvPct(1);
    setSurvLeft(SURVIVAL_MS);
    setRunId((n) => n + 1);
  };

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
    const total = cfgRef.current.totalCircles || cfgRef.current.n;
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    return Math.max(14, Math.min(w / cols, h / rows) * 0.36);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext('2d');
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      const r = itemR();
      const map = mapRef.current;
      const cfg = cfgRef.current;
      const isColor = cfg.variant === 'color';
      // Trail line along the correct path (map holds the right-colour item per number).
      ctx.strokeStyle = isColor ? 'rgba(120,90,40,0.55)' : 'rgba(46,139,87,0.85)';
      ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let m = 1; m <= nextRef.current - 2; m++) {
        const a = map[m], b = map[m + 1];
        if (!a || !b) continue;
        ctx.beginPath(); ctx.moveTo(a.fx * w, a.fy * h); ctx.lineTo(b.fx * w, b.fy * h); ctx.stroke();
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.round(r * 0.9)}px Outfit, sans-serif`;
      for (const it of itemsRef.current) {
        const x = it.fx * w, y = it.fy * h;
        if (it.isDecoy) {
          // Distractor to IGNORE — muted hollow circle with an ✕.
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = '#eef1f4'; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#9aa6b2'; ctx.stroke();
          const q = r * 0.34; ctx.lineWidth = Math.max(2, r * 0.16); ctx.strokeStyle = '#9aa6b2';
          ctx.beginPath(); ctx.moveTo(x - q, y - q); ctx.lineTo(x + q, y + q); ctx.moveTo(x + q, y - q); ctx.lineTo(x - q, y + q); ctx.stroke();
          continue;
        }
        const done = it.n < nextRef.current;
        let fill; let edge; let txt;
        if (isColor) {
          fill = done ? '#cfd8e0' : CTT_COLORS[it.color];
          edge = done ? '#aab4bd' : 'rgba(0,0,0,0.20)';
          txt = done ? '#8a96a0' : '#fff';
        } else {
          fill = done ? '#1f5e44' : '#1b2940';
          edge = done ? '#3be086' : '#6fa6df';
          txt = done ? '#bdf5d8' : '#eaf3ff';
        }
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = fill; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = edge; ctx.stroke();
        ctx.fillStyle = txt;
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
    let base; let spec;
    if (mode === 'levels') { base = levelCfg(diff, level); spec = boardSpecLevel(diff, level); }
    else if (mode === 'passplay') { base = { n: 15, time: Infinity }; spec = { variant: 'forward', decoys: 0 }; }
    else {
      // Survival difficulty ramps by SKILL — boards cleared — not the wall-clock,
      // so it scales with how far you actually get, not how long you take.
      base = rampCfg(boardIdxRef.current);
      spec = boardSpecSurvival(boardIdxRef.current);
    }
    const n = base.n;
    const variant = spec.variant;
    const decoys = spec.decoys || 0;
    const startColor = rng() < 0.5 ? 0 : 1;
    // Build the circle list. Color Trails: each number appears in BOTH colours;
    // map[k] = the correct-colour copy (the path) and the other copy is a lure.
    const list = [];
    const map = [];
    if (variant === 'color') {
      for (let k = 1; k <= n; k++) {
        const exp = (startColor + (k - 1)) % 2;
        const a = { n: k, color: 0, isDecoy: false };
        const b = { n: k, color: 1, isDecoy: false };
        list.push(a, b);
        map[k] = exp === 0 ? a : b;
      }
    } else {
      for (let k = 1; k <= n; k++) { const it = { n: k, color: 0, isDecoy: false }; list.push(it); map[k] = it; }
    }
    for (let d = 0; d < decoys; d++) list.push({ n: null, color: 0, isDecoy: true });
    // Scatter all circles on a jittered grid (TMT-like, not a neat grid),
    // clamped to a safe margin so nothing clips the field edge.
    const total = list.length;
    const cols = Math.ceil(Math.sqrt(total));
    const rows = Math.ceil(total / cols);
    const cells = [];
    for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) cells.push([cc, rr]);
    cells.sort(() => rng() - 0.5);
    const mx = 0.62 / cols;
    const my = 0.62 / rows;
    for (let i = 0; i < total; i++) {
      const [cc, rr] = cells[i];
      list[i].fx = clamp((cc + 0.5 + (rng() - 0.5) * 0.44) / cols, mx, 1 - mx);
      list[i].fy = clamp((rr + 0.5 + (rng() - 0.5) * 0.44) / rows, my, 1 - my);
    }
    cfgRef.current = { n, time: base.time, variant, decoys, startColor, totalCircles: total };
    itemsRef.current = list; mapRef.current = map;
    nextRef.current = 1; errRef.current = 0;
    tapTimesRef.current = [];
    setProg(0);
    if (timed) setTimeLeft(base.time);
    // Announce the rule ONLY when it changes (or the first board) — keeps a run
    // consistent and the rules clear. While the banner shows, the clock is paused
    // and taps are ignored; then the board begins.
    const ruleKey = `${variant}|${decoys > 0}`;
    const begin = () => {
      readyRef.current = false;
      startRef.current = performance.now();
      deadlineRef.current = timed ? performance.now() + base.time : Infinity;
    };
    clearTimeout(readyTimerRef.current);
    if (ruleKey !== prevRuleRef.current) {
      prevRuleRef.current = ruleKey;
      readyRef.current = true;
      deadlineRef.current = Infinity; // clock paused during the banner
      setReadyInfo({ variant, decoys, startColor, first: boardIdxRef.current === 0 });
      const t0 = performance.now();
      readyTimerRef.current = setTimeout(() => {
        setReadyInfo(null);
        survT0Ref.current += performance.now() - t0; // don't let the banner eat the survival clock
        begin();
      }, 1900);
    } else {
      setReadyInfo(null);
      begin();
    }
  }, [diff, fit, level, mode, timed, rng]);

  const onComplete = useCallback(() => {
    if (endedRef.current) return;
    const used = performance.now() - startRef.current;
    const cfg = cfgRef.current;
    const n = cfg.n;
    const errs = errRef.current;
    // Scanning rate (circles/min) — the canonical TMT speed metric (∝ 1/time).
    const ipm = used > 0 ? Math.round(n / (used / 60000)) : 0;
    // Per-segment timing → within-trial CONSISTENCY (CV = SD/mean of tap-to-tap
    // times); high variability is an attentional-lapse marker.
    const taps = tapTimesRef.current;
    const segs = []; let prev = startRef.current;
    for (const tpt of taps) { segs.push(tpt - prev); prev = tpt; }
    const segMean = segs.length ? segs.reduce((a, b) => a + b, 0) / segs.length : 0;
    const segSd = segs.length > 1 ? Math.sqrt(segs.reduce((s, v) => s + (v - segMean) ** 2, 0) / (segs.length - 1)) : 0;
    const cv = segMean > 0 ? +(segSd / segMean).toFixed(2) : 0;
    playSfx?.('win');
    trialLogRef.current?.trial({ n, timeMs: Math.round(used), errors: errs, ipm, variant: cfg.variant, decoys: cfg.decoys, cv });
    if (mode === 'levels') {
      endedRef.current = true;
      scoreRef.current += Math.max(20, 200 - Math.round(used / 100));
      trialLogRef.current?.finish({ won: LEVEL_WIN, level, diff });
      onResult({ won: LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${n} دائرة · ${fmt(used)} · ${errs} خطأ · ${ipm}/د` : `${n} circles · ${fmt(used)} · ${errs} err · ${ipm}/min` });
      return;
    }
    if (mode === 'passplay') {
      ppTimeRef.current += used; ppDoneRef.current += 1; setPpBoard(ppDoneRef.current + 1);
      if (ppDoneRef.current >= ppTrials) { endedRef.current = true; trialLogRef.current?.finish({}); onResult({ score: Math.round(ppTimeRef.current) }); return; }
      newBoard(); return;
    }
    awardPoints?.(3);
    const bonus = timed ? Math.max(0, Math.round((deadlineRef.current - performance.now()) / 1000)) : 0;
    scoreRef.current += 20 + bonus; setScore(scoreRef.current);
    boardIdxRef.current += 1; setBoards(boardIdxRef.current);
    sumUsedRef.current += used; sumErrRef.current += errs; sumItemsRef.current += n;
    if (cfg.variant === 'color') { sumColorRef.current += used; cntColorRef.current += 1; }
    else { sumFwdRef.current += used; cntFwdRef.current += 1; }
    if (isSurvival && performance.now() - survT0Ref.current >= SURVIVAL_MS) {
      finishSurvival();
      return;
    }
    newBoard();
  }, [awardPoints, finishSurvival, isAr, isSurvival, mode, newBoard, onResult, playSfx, timed, ppTrials, level, diff]);

  const onTimeout = useCallback(() => {
    if (endedRef.current) return;
    // In SURVIVAL, running out of time on a board ends the survival RUN — show the
    // "Survival over!" summary. It must NOT go through onResult(): that is the
    // shared level-result handler, which in free mode has no diff/level and lands
    // on a level modal whose "Levels" button then crashes (dm[null].label).
    if (isSurvival) { finishSurvival(); return; }
    playSfx?.('lose'); endedRef.current = true;
    trialLogRef.current?.finish({ won: false, reached: nextRef.current - 1 });
    onResult({ won: false, score: scoreRef.current, summary: isAr ? `وصلت إلى ${nextRef.current - 1}/${cfgRef.current.n}` : `Reached ${nextRef.current - 1}/${cfgRef.current.n}` });
  }, [isAr, onResult, playSfx, isSurvival, finishSurvival]);

  const onPointer = useCallback((e) => {
    if (endedRef.current || readyRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const r = itemR();
    const cfg = cfgRef.current;
    const next = nextRef.current;
    let hit = null, best = Infinity;
    for (const it of itemsRef.current) {
      // Completed numbers (both colour copies) are inert; decoys stay tappable
      // (so tapping one registers as an inhibition error).
      if (!it.isDecoy && it.n != null && it.n < next) continue;
      const d = Math.hypot(it.fx * w - x, it.fy * h - y);
      if (d < r * 1.25 && d < best) { best = d; hit = it; }
    }
    if (!hit) return;
    const expColor = (cfg.startColor + (next - 1)) % 2;
    const correct = !hit.isDecoy && hit.n === next && (cfg.variant !== 'color' || hit.color === expColor);
    if (correct) {
      nextRef.current += 1; setProg(nextRef.current - 1); playSfx?.('click');
      tapTimesRef.current.push(performance.now());
      if (nextRef.current > cfg.n) onComplete();
    } else {
      errRef.current += 1;
      if (timed && deadlineRef.current !== Infinity) deadlineRef.current -= 2000;
      flashRef.current = { x: hit.fx * w, y: hit.fy * h, until: performance.now() + 350 };
      playSfx?.('lose');
    }
  }, [itemR, onComplete, playSfx, timed]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);
    if (isSurvival) {
      survT0Ref.current = performance.now();
      finishedRef.current = false;
      endedRef.current = false;
      boardIdxRef.current = 0;
      scoreRef.current = 0;
    }
    sumUsedRef.current = 0; sumErrRef.current = 0; sumItemsRef.current = 0;
    sumFwdRef.current = 0; cntFwdRef.current = 0; sumColorRef.current = 0; cntColorRef.current = 0;
    prevRuleRef.current = null; readyRef.current = false; setReadyInfo(null);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'trail-making', mode, meta: { diff, level } });
    newBoard();
    if (timed) {
      clockRef.current = setInterval(() => {
        if (readyRef.current) return; // clock paused while the rule banner shows
        if (isSurvival) {
          const sLeft = SURVIVAL_MS - (performance.now() - survT0Ref.current);
          setSurvPct(Math.max(0, sLeft / SURVIVAL_MS));
          setSurvLeft(Math.max(0, sLeft));
          if (sLeft <= 0) { finishSurvival(); return; }
        }
        const left = deadlineRef.current - performance.now();
        setTimeLeft(left);
        if (left <= 0) onTimeout();
      }, 100);
    }
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      clearInterval(clockRef.current);
      clearTimeout(readyTimerRef.current);
      trialLogRef.current?.discard();
      trialLogRef.current = null;
    };
  }, [runId, seed]);

  const S = styles;
  const total = cfgRef.current.n;
  const cfgNow = cfgRef.current;
  const expColor = ((cfgNow.startColor || 0) + prog) % 2; // expected colour for the next number
  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  const embedCls = cosmos ? 'c3d-embed-root' : undefined;

  if (over && isSurvival) {
    return (
      <div style={rootStyle} className={embedCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <h2 style={S.overTitle}>{isAr ? 'انتهى البقاء!' : 'Survival over!'}</h2>
          <p style={S.overSub}>{isAr ? `${over.boards} لوحات · ${over.score} نقطة` : `${over.boards} boards · ${over.score} pts`}</p>
          <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid" style={{ maxWidth: 380, marginBottom: 14 }}>
            <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.ipm ?? 0}</div><div className="ct-fq-rl">{isAr ? 'دائرة/دقيقة' : 'circles/min'}</div></div>
            <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.avgMs ? fmt(over.avgMs) : '—'}</div><div className="ct-fq-rl">{isAr ? 'زمن اللوحة' : 'avg/board'}</div></div>
            <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.errors ?? 0}</div><div className="ct-fq-rl">{isAr ? 'أخطاء' : 'errors'}</div></div>
            {over.interferenceMs != null && (
              <div className="ct-fq-rmi"><div className="ct-fq-rv">+{(over.interferenceMs / 1000).toFixed(1)}s</div><div className="ct-fq-rl">{isAr ? 'كلفة الألوان' : 'colour cost'}</div></div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button type="button" style={S.overBtn} onClick={() => { playSfx?.('click'); restartSurvival(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
            <button type="button" style={S.overBtnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={rootStyle} className={embedCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      {isSurvival && (
        <div style={S.survTrack}>
          <div style={{ ...S.survFill, width: `${survPct * 100}%`, background: survPct < 0.2 ? '#d23b3b' : '#b9842f' }} />
        </div>
      )}
      <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
        {!cosmos && (
          <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        )}
        {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{isAr ? 'صل الأرقام' : 'Trail Making'}</div>
          <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>
            {mode === 'passplay' ? `${isAr ? 'لوحة' : 'Board'} ${ppBoard}/${ppTrials}` : mode === 'free' ? `${isAr ? 'لوحات' : 'Boards'} ${boards}` : `${isAr ? 'مستوى' : 'Lvl'} ${level}`}
          </div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
      <div style={S.sub}>
        <span>{isAr ? 'التالي' : 'Next'}: <b style={{ color: '#2e8b57' }}>{Math.min(prog + 1, total)}</b> / {total}</span>
        {cfgNow.variant === 'color' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {isAr ? 'اللون' : 'Colour'}
            <span style={{ width: 13, height: 13, borderRadius: '50%', background: CTT_COLORS[expColor], display: 'inline-block', border: '1px solid rgba(0,0,0,0.25)' }} />
          </span>
        ) : null}
        {cfgNow.decoys > 0 ? <span style={{ color: '#8a96a0' }}>{isAr ? 'تجاهل ✕' : 'Ignore ✕'}</span> : null}
        {timed ? <span style={{ color: timeLeft < 6000 ? '#d23b3b' : '#b9842f' }}>⏱ {fmt(timeLeft)}</span> : null}
        {isSurvival ? <span style={{ color: survLeft < 10000 ? '#d23b3b' : '#5a4a32' }}>{isAr ? 'بقاء' : 'Survival'} {fmt(survLeft)}</span> : null}
      </div>
      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={S.canvas} onPointerDown={onPointer} />
        {readyInfo && (
          <div style={S.ready}>
            <div style={S.readyCard}>
              <div style={S.readyKicker}>
                {readyInfo.first
                  ? (isAr ? 'استعدّ' : 'Get ready')
                  : (isAr ? '⚡ قاعدة جديدة' : '⚡ New rule')}
              </div>
              <div style={S.readyTitle}>
                {readyInfo.variant === 'color'
                  ? (isAr ? 'بدّل اللون مع كل رقم!' : 'Alternate the colour each step!')
                  : (isAr ? 'صِل الأرقام بالترتيب ١→٢→٣' : 'Connect 1 → 2 → 3 in order')}
              </div>
              {readyInfo.variant === 'color' && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', margin: '10px 0 2px' }}>
                  <span style={{ ...S.readyDot, background: CTT_COLORS[readyInfo.startColor] }}>1</span>
                  <b style={{ color: '#5a4a32' }}>→</b>
                  <span style={{ ...S.readyDot, background: CTT_COLORS[(readyInfo.startColor + 1) % 2] }}>2</span>
                  <b style={{ color: '#5a4a32' }}>→</b>
                  <span style={{ ...S.readyDot, background: CTT_COLORS[readyInfo.startColor], opacity: 0.85 }}>3</span>
                </div>
              )}
              {readyInfo.decoys > 0 && (
                <div style={S.readySub}>{isAr ? 'وتجاهل دوائر ✕ — إنها فخاخ' : 'Ignore the ✕ circles — they are traps'}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrailMakingGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <TrailMaking3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_speed_trail"
      scienceId="trail-making"
      title={{ en: 'Trail Making', ar: 'صل الأرقام' }}
      hints={{
        free: { en: '60s survival · boards ramp fast', ar: '٦٠ ث بقاء · لوحات أصعب مع الوقت' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same board for all · fastest wins', ar: 'نفس اللوحة للجميع · الأسرع يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 1, scoreLabel: { en: 'ms', ar: 'م.ث' }, lowerBetter: true, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('speed'),
      }]}
      renderEngine={(p) => (
        <TrailEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)', fontFamily: "'Outfit', system-ui, sans-serif" },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  sub: { display: 'flex', justifyContent: 'space-between', padding: '6px 16px 0', fontSize: 14, fontWeight: 700, color: '#5a4a32' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: '#fffdf8', overflow: 'hidden', border: '1.5px solid #e3d6c4', boxShadow: 'inset 0 2px 10px rgba(120,90,40,0.06)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  survTrack: { height: 6, background: 'rgba(0,0,0,0.08)' },
  survFill: { height: '100%' },
  ready: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,253,248,0.78)', zIndex: 3, pointerEvents: 'none' },
  readyCard: { background: '#fffdf8', border: '2px solid #cdbfa6', borderRadius: 16, padding: '16px 22px', textAlign: 'center', boxShadow: '4px 4px 0 #1a1208', maxWidth: '82%' },
  readyKicker: { display: 'inline-block', marginBottom: 6, padding: '2px 12px', borderRadius: 999, background: '#7a5a1e', color: '#fff7e6', fontWeight: 900, fontSize: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  readyTitle: { fontWeight: 900, fontSize: 18, color: '#2d2d2d' },
  readyDot: { width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, border: '2px solid rgba(0,0,0,0.25)' },
  readySub: { marginTop: 8, fontWeight: 800, fontSize: 13, color: '#7a5a1e' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' },
  overTitle: { margin: '0 0 8px', fontWeight: 900, fontSize: 24 },
  overSub: { margin: '0 0 20px', fontWeight: 700, color: '#5a4a32' },
  overBtn: { padding: '12px 20px', borderRadius: 12, border: '2px solid #1a1208', background: '#b9842f', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  overBtnGhost: { padding: '12px 20px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, cursor: 'pointer' },
};
