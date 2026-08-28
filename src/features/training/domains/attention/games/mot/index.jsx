import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import PlayHud from '../../../../shared/PlayHud';
import PlayResults from '../../../../shared/PlayResults';
import { TrainingStatusStrip } from '../../../../shared/TrainingChrome';
import { useGamePause } from '../../../../shared/useGamePause';
import { getTrainingPaused } from '../../../../shared/pauseStore';
import { GAME_COLORS } from '../../../../shared/gamePalette';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import { summarizeMot } from './motMetrics';
import { createSpeedStaircase } from './speedStaircase';
import { saveMotAssess, motAssessReport, speedIndex } from './motAssessStore';
import { clamp, lerp } from '../../../../../../lib/math';

// The arena. 2D since the 3D scene was retired — this game's look is the
// platform palette's reference, so the 2D board reproduces it directly.
import MotBoard2D from './MotBoard2D';
import './mot.css';

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
export { MOT_CAP, LADDER, LADDER_LEVELS, levelConfig } from './motData.js';
import { MOT_CAP, LADDER_LEVELS, levelConfig } from './motData.js';

// Survival/free + pass-n-play: r = escalation index. Reaches peak by ~r=16.
export function freeConfig(r) {
  const u = clamp(r / 16, 0, 1);
  const targets = clamp(Math.round(lerp(2, MOT_CAP, u)), 2, MOT_CAP);
  /* Endpoints match the Levels curve (easy L1 -> hard L100) so Survival and
   * Levels agree about what "hardest" means. `total` tops out at 24 rather than
   * 26 for the same reason as BASE above: 26 is the runtime clamp, so asking for
   * it exactly meant the last few escalations changed nothing on screen. */
  return {
    targets,
    total: Math.round(lerp(5, 12, u)),
    speedFrac: lerp(0.09, 0.33, u),
    trackMs: Math.round(lerp(3000, 9000, u)),
  };
}

// Per-tier endpoints: [t0,t1] targets, [n0,n1] TOTAL objects in the arena (density),
// [s0,s1] speedFrac, [tr0,tr1] track ms — interpolated across the 100 levels.
// Hard = a packed arena (close encounters everywhere) at moderate speed, not fast.
/*
 * ── Tier endpoints CHAIN: every tier starts exactly where the last one ended ──
 *
 * They did not, and the curve ran backwards at both seams. Measured on the old
 * table: easy level 100 ran at speed 0.20 for 5000ms, and medium level 1 then
 * dropped to 0.12 for 4000ms. Worse at the next seam — medium 100 was 4 targets
 * among 21 objects at 0.27, and hard level 1 dropped to 19 objects at 0.14.
 * Starting Hard was EASIER than finishing Medium on three of the four levers,
 * which is exactly what "the difficulty grading is not good" feels like from
 * inside the game.
 *
 * Chaining is now the invariant: n1/s1/tr1/t1 of each tier equal n0/s0/tr0/t0 of
 * the next. scripts/audit-mot-curve.mjs enforces it.
 *
 * ── Object counts came down ──
 * The top end asked for 30 objects while startRound() clamps the live count to
 * 26, so hard levels ~75-100 all rendered the SAME density — the last quarter of
 * the hardest tier stopped getting harder on the lever this design calls the
 * primary one. Rather than raise the clamp, the ceiling comes down to 24: a
 * standard MOT display is 8-16 objects (Pylyshyn & Storm 1988 used 10 with 5
 * targets), so 30 was far outside the paradigm and read as a swarm. 24 with 5
 * targets still leaves 19 distractors — dense enough for the constant close
 * encounters the difficulty model is built on, and now actually reachable.
 */
/*
 * `n` is the count BEFORE the density rescale in startRound(), which multiplies
 * it by roughly 1.25 with the arena aspect capped. So these read on screen as
 * about: easy 6->9, med 9->11, hard 11->15.
 *
 * Deliberately inside the classic MOT display range — Pylyshyn & Storm (1988)
 * used 10 objects with 5 targets, and the literature mostly sits at 8-16. The
 * game shipped with 26 on screen at nearly every level, which is not a harder
 * version of that paradigm so much as a different, more cluttered task.
 *
 * Fewer objects means less density, and density is this model's primary lever —
 * so the difficulty it gives up has to come from somewhere. It comes from the
 * two continuous levers, which now do more of the work: speed 0.09 -> 0.33 and
 * tracking duration 3s -> 9s across the curve. Both produce close encounters,
 * which is what actually causes tracking errors (Franconeri 2008; Feria 2012).
 */
export function MotEngine({ mode, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 6) : 0;
  const wrapRef = useRef(null);
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
  const [picksLeft, setPicksLeft] = useState(0);
  const [hudStats, setHudStats] = useState([]);
  const pause = useGamePause({ isAr, playSfx, onQuit: onExit });
  const [msg, setMsg] = useState('');

  const setPhaseBoth = useCallback((p) => { phaseRef.current = p; setPhase(p); }, []);

  const frame = useCallback((ts) => {
    /* Paused: keep the loop alive so the field stays drawn behind the menu, but
     * advance nothing. Resetting lastTs is the important half — without it the
     * first frame after resume would see a dt of however long the menu was open
     * and teleport every dot across the field. dt is clamped to 0.05 anyway,
     * but a 50ms jump is still a visible skip in a tracking task. */
    if (getTrainingPaused()) {
      lastTsRef.current = ts;
      rafRef.current = requestAnimationFrame(frame);
      return;
    }
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
    // Rendering is the 3D scene's job now (it reads dotsRef every frame); the
    // engine loop only advances the physics.
    rafRef.current = requestAnimationFrame(frame);
  }, []);

  const fit = useCallback(() => {
    // The 3D scene fills wrapRef now; the engine only needs the play-area size so
    // its (renderer-agnostic) dot physics has a field to run in.
    const wrap = wrapRef.current;
    if (!wrap) return;
    sizeRef.current = { w: wrap.clientWidth, h: wrap.clientHeight };
  }, []);

  const nextParams = useCallback(() => {
    if (mode === 'levels') return levelConfig(level);
    if (mode === 'passplay') return freeConfig(2 + roundIdxRef.current);
    if (mode === 'assess') {
      return { targets: ASSESS_TARGETS, total: ASSESS_TOTAL, speedFrac: staircaseRef.current?.speed ?? 0.26, trackMs: ASSESS_TRACK_MS };
    }
    // Survival ramps by ROUND (no clock — it ends on lives, see evaluate).
    return freeConfig(freeRoundRef.current);
  }, [mode, level]);

  const updateHud = useCallback(() => {
    if (mode === 'levels') {
      setHudStats([
        { value: level, label: isAr ? 'المستوى' : 'Level' },
        { value: `${roundIdxRef.current + 1}/${ROUNDS_PER_LEVEL}`, label: isAr ? 'المحاولة' : 'Trial' },
        { value: wonRef.current, label: isAr ? 'مثالية' : 'Perfect' },
      ]);
    } else if (mode === 'assess') {
      setHudStats([
        { value: (staircaseRef.current?.trialCount ?? 0) + 1, label: isAr ? 'محاولة التقييم' : 'Assessment trial' },
      ]);
    } else if (mode === 'passplay') {
      setHudStats([
        { value: `${roundIdxRef.current + 1}/${ppTrials}`, label: isAr ? 'المحاولة' : 'Trial' },
        { value: wonRef.current, label: isAr ? 'مثالية' : 'Perfect' },
      ]);
    } else {
      setHudStats([
        { value: freeRoundRef.current + 1, label: isAr ? 'الجولة' : 'Round' },
        { value: '♥'.repeat(Math.max(0, livesRef.current)), label: isAr ? 'أرواح' : 'Lives' },
      ]);
    }
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
      /*
       * ── The arena's ASPECT is bounded, and that is what fixes the swarm ──
       *
       * Preserving density across devices is right (Franconeri: spacing is the
       * driver), but it was applied to an arena that filled the whole screen, so
       * the count was multiplied by the arena's area relative to a minDim
       * square: measured at 1.8x on a 412x900 phone and 3.1x on a 1366x577
       * laptop. Every level above easy then saturated the object clamp — 8 of 9
       * sampled laptop levels rendered an IDENTICAL 26 objects.
       *
       * That broke difficulty twice over. It looked like a swarm at every level,
       * and density — the primary lever this whole model is built on — was
       * pinned at the ceiling, so it stopped grading anything at all. The
       * authored curve never reached the screen.
       *
       * Capping the aspect keeps the arena roomy without letting its area run
       * away: the rescale can now reach at most 1.3x instead of 3.1x, so the
       * count follows the curve as written and the clamp below never binds.
       * A slightly letterboxed arena is a fair price for a difficulty lever that
       * actually works.
       */
      const MAX_ARENA_AR = 1.3;
      arenaW = w - 2 * margin;
      arenaH = h - 2 * margin;
      if (arenaW / arenaH > MAX_ARENA_AR) arenaW = arenaH * MAX_ARENA_AR;
      else if (arenaH / arenaW > MAX_ARENA_AR) arenaH = arenaW * MAX_ARENA_AR;

      const density = cfg.total / (minDim * minDim); // intended objects per px²
      /* Ceiling raised 26 -> 30 deliberately: it is now a SAFETY rail, not a
       * shaping tool. With the aspect capped the curve tops out near 21, so this
       * should never bind — and if it ever does, that is a bug worth noticing
       * rather than a silent flattening of the hardest levels. */
      total = clamp(Math.round(density * arenaW * arenaH), cfg.targets + 2, 30);
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
          finishLog({ won: wonRef.current >= LEVEL_WIN, level });
          onResult({ won: wonRef.current >= LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات مثالية` : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect rounds` });
          return;
        }
      } else if (mode === 'passplay') {
        roundIdxRef.current += 1;
        if (perfect) wonRef.current += 1;
        if (roundIdxRef.current >= ppTrials) { finishLog({ score: wonRef.current }); onResult({ score: wonRef.current }); return; }
      } else {
        // Survival: no clock — an imperfect round costs a life; out of lives ends it.
        if (!perfect) livesRef.current -= 1;
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
  }, [awardFreeRun, awardPoints, isAr, mode, onResult, playSfx, ppTrials, setPhaseBoth, startRound, finishLog, level]);

  // The 3D scene raycasts the tap and hands us the dot index; selection logic is
  // unchanged (toggle, cap at cfg.targets, auto-evaluate when the last pick lands).
  const pickDot = useCallback((idx) => {
    if (phaseRef.current !== 'respond') return;
    const hit = dotsRef.current[idx];
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
    trialLogRef.current = createTrialLog({ game: 'mot', mode, meta: { level } });
    startRound();
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      clearTimeout(timerRef.current);
      trialLogRef.current?.discard();
      trialLogRef.current = null;
    };
  }, [fit, frame, isSurvival, level, mode, runId, seed, startRound]);

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
      <div className="ct-mot-root" dir={isAr ? 'rtl' : 'ltr'}>
        <PlayResults
          isAr={isAr}
          title={isAr ? 'تقييم التتبّع' : 'Tracking assessment'}
          headline={{ value: idx, label: isAr ? 'مؤشر سرعة التتبّع · ٠–١٠٠' : 'Tracking speed index · 0–100' }}
          stats={[
            { value: `${crossSec.toFixed(1)}s`, label: isAr ? 'عبور ٤ أهداف' : '4-target crossing' },
            rep ? { value: rep.best, label: isAr ? 'الأفضل' : 'Personal best' } : null,
            { value: over.trials, label: isAr ? 'محاولات' : 'Trials' },
          ]}
          notes={[
            rep?.n > 1 ? (rep.reliable
              ? (rep.delta > 0
                ? (isAr ? `▲ +${rep.delta} تحسّن موثوق` : `▲ +${rep.delta} reliable gain`)
                : (isAr ? `▼ ${rep.delta} تراجع موثوق` : `▼ ${rep.delta} reliable decline`))
              : (isAr ? `±${Math.abs(rep.delta)} ضمن التغيّر الطبيعي` : `±${Math.abs(rep.delta)} within normal variation`)) : null,
            isAr
              ? 'درجة مرجعية ذاتية — لتتبّع تغيّرك مع الوقت، لا للمقارنة بالآخرين.'
              : 'Self-referenced — tracks your own change over time, not a comparison to others.',
          ]}
          extra={sparkPts ? (
            <svg className="ct-mot-spark" viewBox="0 0 200 40" width="200" height="40" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={sparkPts} fill="none" stroke={GAME_COLORS.item.fill} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          ) : null}
          onAgain={() => setRunId((n) => n + 1)}
          againLabel={isAr ? 'أعد الاختبار' : 'Test again'}
          onMenu={() => onExit?.()}
          playSfx={playSfx}
        />
      </div>
    );
  }

  if (over && isSurvival) {
    return (
      <div className="ct-mot-root" dir={isAr ? 'rtl' : 'ltr'}>
        <PlayResults
          isAr={isAr}
          title={isAr ? 'انتهى البقاء!' : 'Survival over!'}
          headline={{ value: over.score, label: isAr ? 'نقاط' : 'Score' }}
          stats={[
            { value: over.rounds, label: isAr ? 'جولات مكتملة' : 'Rounds cleared' },
            over.capacity != null ? {
              value: over.capacity.toFixed(1),
              label: isAr ? 'سعة التتبّع' : 'Tracking capacity',
            } : null,
          ]}
          onAgain={() => setRunId((n) => n + 1)}
          onMenu={() => onExit?.()}
          playSfx={playSfx}
        />
      </div>
    );
  }

  const statusMeta = phase === 'respond'
    ? (isAr ? `${picksLeft} متبقية` : `${picksLeft} left`)
    : (phase === 'cue' || phase === 'track') && cfgRef.current?.targets
      ? (isAr ? `${cfgRef.current.targets} أهداف` : `${cfgRef.current.targets} targets`)
      : null;
  return (
    <div className="ct-mot-root" dir={isAr ? 'rtl' : 'ltr'}>
      <PlayHud
        t={{}}
        playStep="running"
        showTimer={false}
        showTimeBar={false}
        stats={[...hudStats, { value: score, label: isAr ? 'نقاط' : 'Score' }]}
        pauseOpen={pause.open}
        onMenu={pause.requestQuit}
        onPause={pause.start}
        menuAriaLabel={isAr ? 'القائمة' : 'Menu'}
        pauseAriaLabel={pause.labels.paused}
        playSfx={playSfx}
      />
      {pause.modal}
      <div className="ct-mot-workspace">
        <TrainingStatusStrip className="ct-mot-instruction" meta={statusMeta}>
          {msg}
        </TrainingStatusStrip>
        <div ref={wrapRef} className="ct-mot-play">
          <MotBoard2D
            dotsRef={dotsRef}
            fieldRef={fieldRef}
            phaseRef={phaseRef}
            phase={phase}
            interactive={phase === 'respond'}
            onPickDot={pickDot}
            isAr={isAr}
          />
        </div>
      </div>
    </div>
  );
}

export default function MotGame({ onBack, workoutMode = false, assessmentOnly = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  // The speed-threshold ASSESSMENT lives in the Assessment flow, not as a play
  // mode. When launched from there, render only the assessment engine.
  if (assessmentOnly) {
    return (
      <MotEngine
        key="mot-assess"
        mode="assess"
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
  return (
    <ModeShell
      storageKey="mm_attn_mot"
      scienceId="mot"
      title={{ en: 'Target Tracking', ar: 'تتبّع الأهداف' }}
      hints={{
        free: { en: '3 lives · gets harder each round', ar: '٣ أرواح · يزداد صعوبة كل جولة' },
        levels: { en: '40 levels · one more to hold every 10', ar: '٤٠ مستوى · واحد إضافي كل ١٠' },
        pass: { en: 'Same dots for all · pass the device', ar: 'نفس النقاط للجميع · مرّر الجهاز' },
      }}
      /* ONE LADDER — no easy/med/hard. See motData.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: 6, scoreLabel: { en: 'perfect', ar: 'مثالية' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <MotEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}
