import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import { summarizeMot } from './motMetrics';
import { createSpeedStaircase } from './speedStaircase';
import { saveMotAssess, motAssessReport, speedIndex } from './motAssessStore';
import { clamp, lerp } from '../../../../../../lib/math';
import { assetUrl } from '../../../../../../lib/assetUrl';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const Mot3DProto = lazyWithRetry(() => import('./Mot3DProto'), 'mot-3d');

const MOT_ARENA_URL = assetUrl('Assets/attention/mot-arena-plate.svg');
const motArenaImg = typeof Image !== 'undefined' ? new Image() : null;
if (motArenaImg) {
  motArenaImg.decoding = 'async';
  motArenaImg.src = MOT_ARENA_URL;
}

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
const SURVIVAL_LIVES = 3; // survival ends after this many imperfect rounds (no clock)

// Assessment: fixed load (track 4 of 12), fixed track duration; only SPEED is
// adapted by the staircase → the canonical MOT speed-threshold measure.
const ASSESS_TARGETS = 4;
const ASSESS_TOTAL = 12;
const ASSESS_TRACK_MS = 6000;

// ── Difficulty model — OBJECT SPACING / DENSITY first ──────────────────────
// Franconeri, Alvarez & Enns (2010, Psychological Science): "Tracking multiple
// objects is limited ONLY by object spacing, not by speed, time, or capacity."
// Errors come from CLOSE ENCOUNTERS — a target passing near a distractor and
// being swapped (Franconeri 2008; Feria 2012). So the primary difficulty lever
// is DENSITY: more objects packed into a fixed square arena → smaller spacing →
// constant close encounters → genuinely hard. Speed is kept MODERATE (it matters
// only via how many encounters it produces). All play happens in a bounded
// square arena (see startRound) so density is device-independent and meaningful;
// a big sparse field is why this used to be trivially easy.
//
// `total` = objects in the arena (the density knob); `targets` = load.
export const MOT_CAP = 5; // max simultaneously trackable targets (capacity ceiling)

// Survival/free + pass-n-play: r = escalation index. Reaches peak by ~r=16.
export function freeConfig(r) {
  const u = clamp(r / 16, 0, 1);
  const targets = clamp(Math.round(lerp(2, MOT_CAP, u)), 2, MOT_CAP);
  return { targets, total: Math.round(lerp(8, 26, u)), speedFrac: lerp(0.10, 0.30, u), trackMs: Math.round(lerp(3500, 9000, u)) };
}

// Per-tier endpoints: [t0,t1] targets, [n0,n1] TOTAL objects in the arena (density),
// [s0,s1] speedFrac, [tr0,tr1] track ms — interpolated across the 100 levels.
// Hard = a packed arena (close encounters everywhere) at moderate speed, not fast.
const BASE = {
  easy: { t0: 2, t1: 3, n0: 7,  n1: 13, s0: 0.09, s1: 0.20, tr0: 3000, tr1: 5000 },
  med:  { t0: 3, t1: 4, n0: 13, n1: 21, s0: 0.12, s1: 0.27, tr0: 4000, tr1: 7000 },
  hard: { t0: 4, t1: 5, n0: 19, n1: 30, s0: 0.14, s1: 0.32, tr0: 5500, tr1: 9500 },
};
function levelConfig(diff, level) {
  const b = BASE[diff] || BASE.med;
  // Front-loaded curve (^0.85): difficulty is felt climbing earlier (more distinct
  // levels where players actually are); endpoints (level 1 / 100) are unchanged.
  const u = Math.pow(clamp(((level || 1) - 1) / 99, 0, 1), 0.85);
  const targets = clamp(Math.round(lerp(b.t0, b.t1, u)), 1, MOT_CAP);
  return { targets, total: Math.round(lerp(b.n0, b.n1, u)), speedFrac: lerp(b.s0, b.s1, u), trackMs: Math.round(lerp(b.tr0, b.tr1, u)) };
}

/** Centered glyph (✓ / ✕) inside a dot — redundant, colour-blind-safe coding. */
function drawGlyph(ctx, d, ch, color) {
  ctx.fillStyle = color;
  ctx.font = `800 ${Math.round(d.r * 1.2)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ch, d.x, d.y + 1);
}

const hexToRgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixCh = (c, t, tgt) => Math.round(c + (tgt - c) * t);
/**
 * Soft glass-bubble fill: fixed top-left specular + rim shade. Same recipe for
 * every dot so objects stay IDENTICAL while reading as polished 3-D orbs.
 */
function sphereFill(ctx, d, base) {
  const [r, g, b] = hexToRgb(base);
  const hi = `rgb(${mixCh(r, 0.72, 255)},${mixCh(g, 0.72, 255)},${mixCh(b, 0.72, 255)})`;
  const mid = `rgb(${mixCh(r, 0.12, 255)},${mixCh(g, 0.12, 255)},${mixCh(b, 0.12, 255)})`;
  const lo = `rgb(${mixCh(r, 0.38, 0)},${mixCh(g, 0.38, 0)},${mixCh(b, 0.38, 0)})`;
  const grad = ctx.createRadialGradient(
    d.x - d.r * 0.38, d.y - d.r * 0.42, d.r * 0.06,
    d.x + d.r * 0.1, d.y + d.r * 0.15, d.r * 1.05,
  );
  grad.addColorStop(0, hi);
  grad.addColorStop(0.35, mid);
  grad.addColorStop(0.78, base);
  grad.addColorStop(1, lo);
  return grad;
}

export function MotEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 6) : 0;
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const dotsRef = useRef([]);
  const phaseRef = useRef('cue');
  const cfgRef = useRef(freeConfig(0));
  const sizeRef = useRef({ w: 0, h: 0 });
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const motTRef = useRef(0); // elapsed tracking time → deterministic heading drift
  const fieldRef = useRef({ x0: 0, y0: 0, w: 0, h: 0 }); // bounded rectangular tracking arena
  const timerRef = useRef(null);
  // progression
  const freeRoundRef = useRef(0);
  const chalRoundRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const roundIdxRef = useRef(0);
  const wonRef = useRef(0);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  // Phase-2 data capture: per-trial log + close-encounter detection (the main
  // MOT error driver — target↔distractor near-passes; Franconeri et al.).
  const trialLogRef = useRef(null);
  const encountersRef = useRef(0);
  const encActiveRef = useRef(new Set());
  const staircaseRef = useRef(null); // assessment speed-threshold staircase

  const finishLog = useCallback((extra) => {
    const session = trialLogRef.current?.finish(extra) || null;
    trialLogRef.current = null;
    return session;
  }, []);

  const isSurvival = mode === 'free';
  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);

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
    const f = fieldRef.current;
    const now = performance.now();

    // Soft parchment surround
    {
      const wash = ctx.createRadialGradient(w * 0.5, h * 0.42, Math.min(w, h) * 0.15, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
      wash.addColorStop(0, '#f3ebe0');
      wash.addColorStop(0.55, '#ebe1d2');
      wash.addColorStop(1, '#ddd2c0');
      ctx.fillStyle = wash;
      ctx.fillRect(0, 0, w, h);
    }

    // Premium arena plate asset (or flat fallback)
    if (f.w > 0) {
      ctx.save();
      if (motArenaImg?.complete && motArenaImg.naturalWidth > 0) {
        ctx.drawImage(motArenaImg, f.x0 - 4, f.y0 - 4, f.w + 8, f.h + 8);
      } else {
        ctx.fillStyle = '#fffdf9';
        ctx.strokeStyle = 'rgba(232,172,78,0.55)';
        ctx.lineWidth = 2.25;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(f.x0, f.y0, f.w, f.h, 16);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(f.x0, f.y0, f.w, f.h);
          ctx.strokeRect(f.x0, f.y0, f.w, f.h);
        }
      }
      ctx.restore();
    }

    for (const d of dotsRef.current) {
      // During tracking all dots are identical blue (identity must be held by
      // attention, not read off a feature). Cue + result use CVD-safe hues
      // (Okabe-Ito) reinforced with symbols so the feedback never relies on
      // red/green alone.
      let fill = '#4f9fe0';
      if (ph === 'cue' && d.target) fill = '#E69F00';                       // amber cue
      if (ph === 'result') fill = d.target ? '#009E73' : (d.selected ? '#D55E00' : '#33415a');

      // soft contact shadow (same for every sphere)
      ctx.beginPath();
      ctx.ellipse(d.x, d.y + d.r * 0.72, d.r * 0.72, d.r * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(40, 28, 14, 0.14)';
      ctx.fill();

      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fillStyle = sphereFill(ctx, d, fill); ctx.fill();
      // glass rim
      ctx.lineWidth = Math.max(1.25, d.r * 0.08);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.stroke();
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.10)';
      ctx.stroke();

      const ring = Math.max(4, d.r * 0.34);
      if (ph === 'cue' && d.target) {
        // pulsing white ring — BrainHQ-style “remember these”
        const pulse = 0.55 + 0.45 * Math.sin(now / 180);
        ctx.lineWidth = ring * pulse;
        ctx.strokeStyle = `rgba(255,255,255,${0.55 + 0.4 * pulse})`;
        ctx.stroke();
      }
      if (ph === 'respond' && d.selected) {
        ctx.lineWidth = ring;
        ctx.strokeStyle = '#1a1208';
        ctx.stroke();
        // soft amber halo for selected pick
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(232,172,78,0.55)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      if (ph === 'result') {
        if (d.target && d.selected) drawGlyph(ctx, d, '✓', '#fff');
        else if (d.target) { ctx.setLineDash([5, 4]); ctx.lineWidth = Math.max(3, d.r * 0.28); ctx.strokeStyle = '#fff'; ctx.stroke(); ctx.setLineDash([]); }
        else if (d.selected) drawGlyph(ctx, d, '✕', '#fff');
      }
    }
  }, []);

  const frame = useCallback((ts) => {
    const dt = lastTsRef.current ? Math.min((ts - lastTsRef.current) / 1000, 0.05) : 0;
    lastTsRef.current = ts;
    if (phaseRef.current === 'track') {
      const dots = dotsRef.current;
      const f = fieldRef.current;
      motTRef.current += dt;
      const tm = motTRef.current;
      // 1) HEADING DRIFT — constant speed, but each object's direction does a slow
      //    smooth random walk (deterministic per-dot sinusoids seeded at spawn, no
      //    per-frame RNG → Pass-n-Play stays fair). Unpredictable paths force
      //    continuous tracking instead of extrapolation. Bounce inside the ARENA.
      for (const d of dots) {
        const wob = d.wob;
        if (wob) {
          const omega = wob[0].a * Math.sin(tm * wob[0].f + wob[0].p) + wob[1].a * Math.sin(tm * wob[1].f + wob[1].p);
          const ang = Math.atan2(d.vy, d.vx) + omega * dt;
          d.vx = Math.cos(ang) * d.sp; d.vy = Math.sin(ang) * d.sp;
        }
        d.x += d.vx * dt; d.y += d.vy * dt;
        const minX = f.x0 + d.r; const maxX = f.x0 + f.w - d.r;
        const minY = f.y0 + d.r; const maxY = f.y0 + f.h - d.r;
        if (d.x < minX) { d.x = minX; d.vx = Math.abs(d.vx); }
        if (d.x > maxX) { d.x = maxX; d.vx = -Math.abs(d.vx); }
        if (d.y < minY) { d.y = minY; d.vy = Math.abs(d.vy); }
        if (d.y > maxY) { d.y = maxY; d.vy = -Math.abs(d.vy); }
      }
      // 2) Position-only DE-OVERLAP: objects are ALLOWED to graze each other (that
      //    is the close encounter — the real difficulty; Franconeri). We only push
      //    a touching pair apart to edge-contact so they never render perfectly
      //    concentric; velocities are untouched, so there is NO spreading-apart that
      //    would erase close encounters (the old repulsion's mistake).
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i]; const b = dots[j];
          const dx = b.x - a.x; const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.001;
          const minSep = a.r + b.r;
          if (dist >= minSep) continue;
          const nx = dx / dist; const ny = dy / dist;
          const push = (minSep - dist) / 2;
          a.x -= nx * push; a.y -= ny * push;
          b.x += nx * push; b.y += ny * push;
        }
      }
      // (no renormalise needed — velocities are never altered by de-overlap)
      for (const d of dots) {
        const m = Math.hypot(d.vx, d.vy);
        if (m > 0 && Math.abs(m - d.sp) > 0.5) { d.vx = (d.vx / m) * d.sp; d.vy = (d.vy / m) * d.sp; }
      }
      // Count distinct target↔distractor close encounters (counted once on
      // entry, cleared on separation). Only target↔distractor pairs cause
      // tracking errors (a target↔target swap still lands on two targets).
      const thr = (dots[0]?.r || 14) * 3.0;
      const active = encActiveRef.current;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          if (dots[i].target === dots[j].target) continue;
          const key = `${i}-${j}`;
          const close = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y) < thr;
          if (close) { if (!active.has(key)) { active.add(key); encountersRef.current += 1; } }
          else if (active.has(key)) active.delete(key);
        }
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
    if (mode === 'passplay') return freeConfig(2 + roundIdxRef.current);
    if (mode === 'assess') {
      return { targets: ASSESS_TARGETS, total: ASSESS_TOTAL, speedFrac: staircaseRef.current?.speed ?? 0.26, trackMs: ASSESS_TRACK_MS };
    }
    // Survival ramps by ROUND (no clock — it ends on lives, see evaluate).
    return freeConfig(freeRoundRef.current);
  }, [mode, diff, level]);

  const updateHud = useCallback(() => {
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · جولة ${roundIdxRef.current}/${ROUNDS_PER_LEVEL} · ✓${wonRef.current}` : `Lvl ${level} · Round ${roundIdxRef.current}/${ROUNDS_PER_LEVEL} · ✓${wonRef.current}`);
    else if (mode === 'assess') setHud(isAr ? `تقييم · جولة ${(staircaseRef.current?.trialCount ?? 0) + 1}` : `Assessment · round ${(staircaseRef.current?.trialCount ?? 0) + 1}`);
    else if (mode === 'passplay') setHud(isAr ? `جولة ${roundIdxRef.current + 1}/${ppTrials} · ✓${wonRef.current}` : `Round ${roundIdxRef.current + 1}/${ppTrials} · ✓${wonRef.current}`);
    else setHud(isAr
      ? `جولة ${freeRoundRef.current + 1} · ${'♥'.repeat(Math.max(0, livesRef.current))}`
      : `Round ${freeRoundRef.current + 1} · ${'♥'.repeat(Math.max(0, livesRef.current))}`);
  }, [mode, level, isAr, ppTrials]);

  const startRound = useCallback(() => {
    fit();
    const cfg = nextParams(); cfgRef.current = cfg;
    const { w, h } = sizeRef.current;
    const minDim = Math.min(w, h);
    // Element size + speed are relative to the SHORT side, so dots look and move
    // consistently regardless of arena shape / device.
    const R = Math.max(13, minDim * 0.042);
    const pxSpeed = cfg.speedFrac * minDim;
    // Arena. ASSESSMENT uses a fixed standardised square (short side) so the
    // measure is comparable. TRAINING fills the WHOLE play area as a rectangle
    // and SCALES the object count to PRESERVE DENSITY (objects per area) — the
    // real difficulty driver (Franconeri: spacing). So the dots roam the entire
    // screen with no wasted space, while difficulty stays device-independent.
    const margin = 6;
    let arenaW, arenaH, total;
    if (mode === 'assess') {
      arenaW = minDim * 0.98; arenaH = minDim * 0.98;
      total = cfg.total;
    } else {
      arenaW = w - 2 * margin; arenaH = h - 2 * margin;
      const density = cfg.total / (minDim * minDim); // intended objects per px²
      total = clamp(Math.round(density * arenaW * arenaH), cfg.targets + 2, 44);
    }
    cfg.total = total; // keep HUD / per-trial logging in sync with the real count
    const x0 = (w - arenaW) / 2;
    const y0 = (h - arenaH) / 2;
    fieldRef.current = { x0, y0, w: arenaW, h: arenaH };
    const dots = [];
    for (let i = 0; i < total; i++) {
      let x, y, tries = 0;
      // Spawn inside the arena; relaxed min-gap so dense rounds can pack in.
      do { x = x0 + R + rng() * (arenaW - 2 * R); y = y0 + R + rng() * (arenaH - 2 * R); tries += 1; }
      while (tries < 60 && dots.some((o) => Math.hypot(o.x - x, o.y - y) < R * 2.05));
      const a = rng() * Math.PI * 2;
      dots.push({
        x, y,
        vx: Math.cos(a) * pxSpeed, vy: Math.sin(a) * pxSpeed,
        r: R, sp: pxSpeed, target: false, selected: false,
        // Per-dot heading-drift params (two sinusoids), drawn from the SEEDED rng
        // so motion is reproducible for Pass-n-Play. Sum → an angular velocity that
        // wanders smoothly, making the path unpredictable (see frame loop).
        wob: [
          { a: 0.28 + rng() * 0.38, f: 0.45 + rng() * 0.9, p: rng() * Math.PI * 2 },
          { a: 0.20 + rng() * 0.32, f: 0.9 + rng() * 1.3, p: rng() * Math.PI * 2 },
        ],
      });
    }
    [...dots.keys()].sort(() => rng() - 0.5).slice(0, cfg.targets).forEach((i) => { dots[i].target = true; });
    dotsRef.current = dots;
    motTRef.current = 0;
    encountersRef.current = 0;
    encActiveRef.current = new Set();
    setPicksLeft(cfg.targets);
    updateHud();
    setMsg(isAr ? `راقب ${cfg.targets} أهداف` : `Watch the ${cfg.targets} targets…`);
    setPhaseBoth('cue');
    clearTimeout(timerRef.current);
    // Encoding time scales with the number of targets to remember (~0.45s each)
    // so more targets get a fair chance to be encoded before tracking starts.
    const cueMs = clamp(800 + cfg.targets * 450, CUE_MS, 3000);
    timerRef.current = setTimeout(() => {
      setMsg(isAr ? `تابع ${cfg.targets} أهداف بعينيك…` : `Track ${cfg.targets} targets with your eyes…`);
      setPhaseBoth('track');
      timerRef.current = setTimeout(() => {
        setMsg(isAr ? `اضغط الأهداف (${cfg.targets})` : `Tap the ${cfg.targets} targets`);
        setPhaseBoth('respond');
      }, cfg.trackMs);
    }, cueMs);
  }, [fit, isAr, mode, nextParams, setPhaseBoth, updateHud, rng]);

  const evaluate = useCallback(() => {
    const cfg = cfgRef.current;
    const k = cfg.targets;
    const dots = dotsRef.current;
    const w = sizeRef.current.w || 1;
    const correct = dots.filter((d) => d.target && d.selected).length;
    const fa = dots.filter((d) => !d.target && d.selected).length;
    const perfect = correct === k;
    // Hemifield split by each target's freeze position (Alvarez & Cavanagh 2005
    // — left/right fields have independent tracking resources).
    let leftT = 0; let rightT = 0; let leftHit = 0; let rightHit = 0;
    for (const d of dots) {
      if (!d.target) continue;
      if (d.x < w / 2) { leftT += 1; if (d.selected) leftHit += 1; }
      else { rightT += 1; if (d.selected) rightHit += 1; }
    }
    trialLogRef.current?.trial({
      ok: perfect,
      k,
      dots: cfg.total,
      speedFrac: +cfg.speedFrac.toFixed(3),
      trackMs: cfg.trackMs,
      hits: correct,
      fa,
      acc: +(k > 0 ? correct / k : 0).toFixed(3),
      enc: encountersRef.current,
      leftT,
      rightT,
      leftHit,
      rightHit,
    });
    setPhaseBoth('result');
    if (perfect) { playSfx?.('win'); scoreRef.current += 10; setScore(scoreRef.current); awardPoints?.(3); setMsg(isAr ? 'ممتاز ✓' : 'Perfect ✓'); }
    else { playSfx?.('lose'); setMsg(isAr ? `${correct}/${k} صحيحة` : `${correct}/${k} correct`); }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'assess') {
        const sc = staircaseRef.current;
        sc?.record(perfect);
        if (sc && sc.done) {
          const stats = sc.thresholdStats();
          finishLog({ threshold: stats.mean, reversals: sc.reversalCount });
          const sessions = saveMotAssess({ stats, trials: sc.trialCount, reversals: sc.reversalCount });
          setOver({ assess: true, threshold: stats.mean, trials: sc.trialCount, reversals: sc.reversalCount, report: motAssessReport(sessions) });
          return;
        }
        startRound();
        return;
      }
      if (mode === 'levels') {
        roundIdxRef.current += 1;
        if (perfect) wonRef.current += 1;
        if (roundIdxRef.current >= ROUNDS_PER_LEVEL) {
          finishLog({ won: wonRef.current >= LEVEL_WIN, level, diff });
          onResult({ won: wonRef.current >= LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات مثالية` : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect rounds` });
          return;
        }
      } else if (mode === 'passplay') {
        roundIdxRef.current += 1;
        if (perfect) wonRef.current += 1;
        if (roundIdxRef.current >= ppTrials) { finishLog({ score: wonRef.current }); onResult({ score: wonRef.current }); return; }
      } else {
        // Survival: no clock — an imperfect round costs a life; out of lives ends it.
        if (!perfect) { livesRef.current -= 1; setLives(livesRef.current); }
        if (livesRef.current <= 0) {
          finishedRef.current = true;
          const session = finishLog({ rounds: freeRoundRef.current, score: scoreRef.current });
          const capacity = session ? summarizeMot(session.trials).capacity : null;
          setOver({ score: scoreRef.current, rounds: freeRoundRef.current, capacity });
          awardFreeRun?.('mot', capacity ?? freeRoundRef.current);
          return;
        }
        freeRoundRef.current += 1;
      }
      startRound();
    }, 1300);
  }, [awardFreeRun, awardPoints, isAr, mode, onResult, playSfx, ppTrials, setPhaseBoth, startRound, finishLog, level, diff]);

  const onPointer = useCallback((e) => {
    if (phaseRef.current !== 'respond') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    // Generous touch slop (≥24px or 2× radius) so taps are reliable on dense
    // boards — small hit targets would otherwise inflate the false-alarm rate.
    let hit = null, best = Infinity;
    for (const d of dotsRef.current) { const dist = Math.hypot(d.x - x, d.y - y); const slop = Math.max(d.r * 2.0, 24); if (dist < slop && dist < best) { best = dist; hit = d; } }
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
    if (isSurvival) {
      finishedRef.current = false;
      freeRoundRef.current = 0;
      livesRef.current = SURVIVAL_LIVES;
      setLives(SURVIVAL_LIVES);
      scoreRef.current = 0;
      setScore(0);
      setOver(null);
    }
    if (mode === 'assess') {
      staircaseRef.current = createSpeedStaircase();
      setOver(null);
    }
    // Fresh trial log per run (a survival run, a level attempt, a pass-n-play set).
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'mot', mode, meta: { diff, level } });
    startRound();
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
      trialLogRef.current?.discard();
      trialLogRef.current = null;
    };
  }, [seed, runId]);

  const S = styles;

  if (over && over.assess) {
    const thr = over.threshold || 0;
    const idx = speedIndex(thr);
    const crossSec = thr > 0 ? 1 / thr : 0;
    const rep = over.report;
    const series = rep?.series || [];
    const sparkPts = series.length > 1
      ? series.map((v, i) => `${((i / (series.length - 1)) * 200).toFixed(1)},${(40 - (Math.max(0, Math.min(100, v)) / 100) * 40).toFixed(1)}`).join(' ')
      : null;
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <header className="ct-training-play-header">
          <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
          <div className="ct-training-play-header-body">
            <div className="ct-training-play-title">{isAr ? 'تقييم التتبّع' : 'Tracking assessment'}</div>
          </div>
          <div className="ct-training-chrome-spacer" aria-hidden="true" />
        </header>
        <div style={S.overWrap}>
          <div style={S.capNum}>{idx}</div>
          <div style={S.capLbl}>{isAr ? 'مؤشر سرعة التتبّع · ٠–١٠٠' : 'Tracking speed index · 0–100'}</div>
          <p style={S.overSub}>{isAr ? `العتبة: تتبّع ٤ أهداف تعبر الشاشة في ${crossSec.toFixed(1)} ث` : `Threshold: 4 targets crossing the screen in ${crossSec.toFixed(1)}s`}</p>
          {rep && (
            <p style={S.overSub}>
              {isAr ? `أفضل ${rep.best}` : `Best ${rep.best}`}
              {rep.n > 1 ? ` · ${rep.reliable
                ? (rep.delta > 0 ? (isAr ? `▲ +${rep.delta} تحسّن موثوق` : `▲ +${rep.delta} reliable gain`) : (isAr ? `▼ ${rep.delta} تراجع موثوق` : `▼ ${rep.delta} reliable decline`))
                : (isAr ? `±${Math.abs(rep.delta)} ضمن التغيّر الطبيعي` : `±${Math.abs(rep.delta)} within normal variation`)}` : ''}
            </p>
          )}
          {sparkPts && (
            <svg viewBox="0 0 200 40" width="200" height="40" preserveAspectRatio="none" aria-hidden="true" style={{ margin: '2px 0' }}>
              <polyline points={sparkPts} fill="none" stroke="#4f9fe0" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          )}
          <p style={{ ...S.overSub, fontSize: 12, color: '#8a7a62', maxWidth: 300 }}>
            {isAr ? 'درجة مرجعية ذاتية — لتتبّع تغيّرك مع الوقت، لا للمقارنة بالآخرين.' : 'Self-referenced — tracks your own change over time, not a comparison to others.'}
          </p>
          <button type="button" style={S.overBtn} onClick={() => { playSfx?.('click'); setRunId((n) => n + 1); }}>{isAr ? 'أعد الاختبار' : 'Test again'}</button>
          <button type="button" style={S.overBtnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
        </div>
      </div>
    );
  }

  if (over && isSurvival) {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <h2 style={S.overTitle}>{isAr ? 'انتهى البقاء!' : 'Survival over!'}</h2>
          <p style={S.overSub}>{isAr ? `${over.rounds} جولات · ${over.score} نقطة` : `${over.rounds} rounds · ${over.score} pts`}</p>
          {over.capacity != null && (
            <div style={S.capWrap}>
              <div style={S.capNum}>{over.capacity.toFixed(1)}</div>
              <div style={S.capLbl}>{isAr ? 'سعة التتبّع (أهداف)' : 'Tracking capacity (objects)'}</div>
            </div>
          )}
          <button type="button" style={S.overBtn} onClick={() => { playSfx?.('click'); setRunId((n) => n + 1); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
          <button type="button" style={S.overBtnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
        </div>
      </div>
    );
  }

  const phaseDot = phase === 'respond' ? '#1a1208' : phase === 'result' ? null : '#E69F00';
  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'تتبّع الأهداف' : 'Target Tracking'}</div>
          <div className="ct-training-play-sub">{hud} · {score}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
      {/* Instruction lives in its OWN strip above the field, so it never covers
          a dot (the in-canvas banner used to overlap targets near the top). */}
      <div style={S.instr}>
        {phaseDot && <span style={{ ...S.dot, background: phaseDot }} />}
        <span>{msg}</span>
        {(phase === 'cue' || phase === 'track') && cfgRef.current?.targets ? (
          <b style={{ marginInlineStart: 4 }}>· 🎯×{cfgRef.current.targets}</b>
        ) : null}
        {phase === 'respond' ? <b style={{ marginInlineStart: 4 }}>· {picksLeft}</b> : null}
      </div>
      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={S.canvas} onPointerDown={onPointer} />
      </div>
    </div>
  );
}

export default function MotGame({ onBack, workoutMode = false, assessmentOnly = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  // The speed-threshold ASSESSMENT lives in the Assessment flow, not as a play
  // mode. When launched from there, render only the assessment engine.
  if (assessmentOnly) {
    return (
      <MotEngine
        key="mot-assess"
        mode="assess"
        diff="med"
        level={1}
        seed={null}
        onResult={onBack}
        onExit={onBack}
        isAr={isAr}
        playSfx={playSfx}
        awardPoints={awardPoints}
      />
    );
  }
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <Mot3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_attn_mot"
      scienceId="mot"
      title={{ en: 'Target Tracking', ar: 'تتبّع الأهداف' }}
      hints={{
        free: { en: '3 lives · gets harder each round', ar: '٣ أرواح · يزداد صعوبة كل جولة' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same dots for all · pass the device', ar: 'نفس النقاط للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 6, scoreLabel: { en: 'perfect', ar: 'مثالية' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج · تتبّع كرات في ساحة كونية' : 'Prototype · track spheres in a cosmos arena',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('flexibility'),
      }]}
      renderEngine={(p) => (
        <MotEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)', fontFamily: "'Outfit', system-ui, sans-serif" },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 20, background: 'linear-gradient(165deg, #f4ebe0 0%, #e8dccb 100%)', overflow: 'hidden', border: '1.5px solid rgba(200,170,120,0.45)', boxShadow: '0 10px 28px rgba(60,40,20,0.10), inset 0 1px 0 rgba(255,255,255,0.7)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  instr: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 40, margin: '0 12px', padding: '8px 16px', background: 'linear-gradient(180deg, #fffdf9 0%, #f7efe4 100%)', border: '1.5px solid rgba(232,172,78,0.35)', color: '#3a2c12', borderRadius: 14, fontWeight: 700, fontSize: 14, textAlign: 'center', boxShadow: '0 4px 12px rgba(60,40,20,0.06)' },
  dot: { width: 11, height: 11, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, textAlign: 'center' },
  overTitle: { margin: 0, fontWeight: 900, fontSize: 24 },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  capWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, margin: '4px 0 6px' },
  capNum: { fontWeight: 900, fontSize: 42, lineHeight: 1, color: '#4f9fe0' },
  capLbl: { fontWeight: 700, fontSize: 13, color: '#7a6a52' },
  overBtn: { padding: '12px 20px', borderRadius: 12, border: '2px solid #1a1208', background: '#4f9fe0', color: '#fff', fontWeight: 900, cursor: 'pointer' },
  overBtnGhost: { padding: '12px 20px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, cursor: 'pointer' },
};
