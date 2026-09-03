import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { createTrialLog } from '../../../../shared/trialLog';
import { useGamePause } from '../../../../shared/useGamePause';
import { TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import { startCanvasLoop } from '../../../../shared/canvasLoop';
import {
  BASE_HP, BLAST_FRAC, KIND, RING_AT, TOWER_AT, TRAIL,
  buildWave, LADDER_LEVELS, levelCfg, levelPassed, passCfg, posAt, summarise, survivalCfg,
} from './data.js';
import './intercept.css';

/*
 * INTERCEPT — Rift Defense.  [speed]
 *
 * A trail crosses the field to your gate; an army walks down it in waves. Your
 * tower reaches one stretch of trail — tap a marcher inside that stretch to cut
 * them down. Anyone who walks the whole way takes a bite out of the gate.
 *
 * Three layered measures (see data.js for why each one is load-bearing):
 *   reaction time · response inhibition (the no-go colour) · prediction (canopy)
 *
 * ⚠ THE HOT LOOP READS REFS, NEVER REACT STATE. A canvas game that re-renders
 * to animate drops frames on the phones this has to run on, and a dropped frame
 * in a game measuring milliseconds is a measurement error, not a cosmetic one.
 * React state here is only for things that change between waves.
 *
 * ⚠ Colours are pulled off the live element with getComputedStyle at draw time.
 * A canvas cannot read CSS variables, so hard-coding them freezes the game in
 * one theme — the mistake project_consistency_audit records.
 */

const UI = {
  en: {
    ...STR_COMMON.en,
    title: 'Intercept',
    hintFree: 'Rift Defense — endless waves, the army keeps coming',
    hintLevels: '100 levels · a new mechanic every 10',
    hintPass: 'Same waves for everyone · pass the device',
    briefTitle: 'Hold the trail',
    brief: 'An army marches to your gate. Tap them while they are inside a tower’s reach.',
    briefNogo: 'Leave the {c} ones alone — they are not the enemy.',
    briefCanopy: 'Part of your reach is under the trees. Strike where you believe they are.',
    briefBarrel: 'Tap a barrel to blow up everything near it.',
    begin: 'Hold the trail',
    nextWave: 'Next wave ›',
    waveCleared: 'Wave held',
    waveLeaked: 'They got past you',
    wave: (n) => `Wave ${n}`,
    waveOf: (n, m) => `Wave ${n} of ${m}`,
    base: 'Gate',
    dontHit: 'DON’T HIT',
    hit: 'HIT',
    perfect: 'PERFECT',
    through: 'THROUGH',
    early: 'EARLY',
    late: 'LATE',
    chain: (n) => `×${n}`,
    tapHint: 'Tap a marcher inside the ring',
    safeIs: 'Don’t hit',
    // results
    resKills: 'cut down',
    resThrough: 'got through',
    resHeld: 'held back',
    resRt: 'reaction',
    resBias: 'hidden strikes',
    resSteady: 'consistency',
    biasEarly: (n) => `${n}ms early`,
    biasLate: (n) => `${n}ms late`,
    biasEven: 'dead on',
    held: 'The gate held.',
    fell: 'The gate fell.',
    noteRt: 'How fast you struck what you could see.',
    noteNogo: (a, b) => `You held back on ${a} of ${b} you were meant to leave alone.`,
    noteHidden: 'Your timing on the ones you could not see.',
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'الاعتراض',
    hintFree: 'دفاع الشق — موجات بلا نهاية، والجيش لا يتوقف',
    hintLevels: '١٠٠ مستوى · آلية جديدة كل ١٠',
    hintPass: 'نفس الموجات للجميع · مرّر الجهاز',
    briefTitle: 'احمِ الدرب',
    brief: 'جيش يزحف نحو بوابتك. المسهم وهم داخل مدى أحد الأبراج.',
    briefNogo: 'اترك ذوي اللون {c} — ليسوا أعداءً.',
    briefCanopy: 'جزء من مداك تحت الأشجار. اضرب حيث تظنّهم.',
    briefBarrel: 'المس برميلاً لتفجير كل من حوله.',
    begin: 'احمِ الدرب',
    nextWave: 'الموجة التالية ›',
    waveCleared: 'صُدّت الموجة',
    waveLeaked: 'تسلّلوا من أمامك',
    wave: (n) => `الموجة ${n}`,
    waveOf: (n, m) => `الموجة ${n} من ${m}`,
    base: 'البوابة',
    dontHit: 'لا تضرب',
    hit: 'إصابة',
    perfect: 'مثالي',
    through: 'عبر',
    early: 'مبكر',
    late: 'متأخر',
    chain: (n) => `×${n}`,
    tapHint: 'المس زاحفاً داخل الدائرة',
    safeIs: 'لا تضرب',
    resKills: 'أُسقطوا',
    resThrough: 'عبروا',
    resHeld: 'امتنعت',
    resRt: 'رد الفعل',
    resBias: 'الضربات المخفية',
    resSteady: 'الثبات',
    biasEarly: (n) => `${n}م.ث مبكراً`,
    biasLate: (n) => `${n}م.ث متأخراً`,
    biasEven: 'في الصميم',
    held: 'صمدت البوابة.',
    fell: 'سقطت البوابة.',
    noteRt: 'سرعتك في ضرب ما تراه.',
    noteNogo: (a, b) => `امتنعت عن ${a} من ${b} كان عليك تركهم.`,
    noteHidden: 'دقّة توقيتك مع من لا تراهم.',
  },
};

/* Marcher colours. Names are shared with data.js; the values are read from the
   play-surface tokens so both themes work. */
const COLOUR_TOKEN = {
  steel: '--game-item',
  rust: '--game-bad',
  moss: '--game-ok',
  bone: '--game-muted',
};

/* Each tower gets its own hue, and a bound marcher wears a ring in it — that
   ring is the ONLY thing telling a player which tower can take it, so the hues
   are information rather than decoration. Defined in intercept.css and read
   back off the element, like every other colour here; the literals are only
   the fallbacks for the moment before styles resolve. */
const TOWER_TOKEN = [
  ['--game-tower-a', '#e0a33a'],
  ['--game-tower-b', '#5fb3d4'],
  ['--game-tower-c', '#c77ad4'],
];

/** The reach a marcher is standing in right now, or null if it is between them. */
const windowAt = (u, now) => (u.windows || []).find(
  (w) => now >= w.enterAt && now <= w.exitAt,
) || null;

import DomCoach from '../../../../shared/tutorials/coach/DomCoach';
import { INTERCEPT_COACH } from '../../../../shared/tutorials/coach/scripts/intercept';

export function InterceptEngine({
  mode, level, seed, attempt, onResult, onExit, isAr, playSfx, awardFreeRun, coach,
}) {
  /*
   * The live-board coach (COACH-PLAN.md Phase 3). Survival only. The wave is
   * held while the lesson is open — see the frame guard below.
   */
  const coachRootRef = useRef(null);
  const coachOpen = coach?.open || false;
  const coachOpenRef = coach?.openRef || { current: false };
  const t = isAr ? UI.ar : UI.en;

  const [step, setStep] = useState('brief');       // brief | run | between | over
  const [waveNo, setWaveNo] = useState(1);
  const [hp, setHp] = useState(BASE_HP);
  const [stage, setStage] = useState(0);
  const [combo, setCombo] = useState(1);
  const [over, setOver] = useState(null);
  const [waveStat, setWaveStat] = useState(null);

  /* ⚠ The coach effects live BELOW `const pause = useGamePause(...)`, not here.
     A dependency array is evaluated DURING RENDER, so `[..., pause.open]` above
     the declaration is a temporal dead zone ReferenceError that crashes the game
     on mount — for every player, not only inside the tutorial. It shipped that
     way on 2026-09-03 and was reported as "Intercept says an error occurred".
     Neither lint nor the build can see it. */

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const waveRef = useRef(null);
  const t0Ref = useRef(0);
  const hpRef = useRef(BASE_HP);
  const comboRef = useRef(1);
  const logRef = useRef([]);          // the whole run
  const waveLogRef = useRef([]);      // this wave
  const fxRef = useRef([]);
  const trialLogRef = useRef(null);
  const pausedRef = useRef(false);
  const overRef = useRef(false);
  const sizeRef = useRef({ w: 0, h: 0 });

  const cfg = useMemo(
    () => (mode === 'free' ? survivalCfg(stage)
      : mode === 'passplay' ? (level ? levelCfg(level) : passCfg())
        : levelCfg(level)),
    [mode, stage, level],
  );

  /* Survival runs forever; a level is a fixed handful of waves. */
  const totalWaves = mode === 'free' ? Infinity : 3;

  const rng = useMemo(
    () => makeRng(`${seed}-${mode}-${level}-${stage}-${waveNo}-${attempt}`),
    [seed, mode, level, stage, waveNo, attempt],
  );

  const handleExit = useCallback(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    onExit?.();
  }, [onExit]);

  const pause = useGamePause({
    isAr,
    playSfx,
    onQuit: handleExit,
    onPause: () => { pausedRef.current = true; },
    onResume: () => { pausedRef.current = false; },
  });

  useEffect(() => {
    trialLogRef.current = createTrialLog({ game: 'intercept', mode, meta: { level } });
    return () => { trialLogRef.current?.discard(); trialLogRef.current = null; };
  }, [mode, level]);

  /* Open the lesson once a Survival wave is actually running, so the field it
     points at exists — the brief screen has no trail on it. Must stay below
     `pause`; see the note where these effects used to sit. */
  useEffect(() => {
    if (!coach?.armed || coach.open || mode !== 'free') return;
    if (step !== 'run' || over || pause.open) return;
    coach.begin();
  }, [coach, mode, step, over, pause.open]);

  // Never strand it off the field — it would freeze the wave.
  useEffect(() => {
    if (coachOpen && (step !== 'run' || over)) coach?.end();
  }, [coachOpen, step, over, coach]);

  /* ── wave control ─────────────────────────────────────────────────────── */
  const startWave = useCallback(() => {
    waveRef.current = buildWave(rng, cfg, waveNo);
    waveLogRef.current = [];
    fxRef.current = [];
    t0Ref.current = performance.now();
    setStep('run');
  }, [rng, cfg, waveNo]);

  /*
   * ⚠ ONE-WAY LATCH, and it is not optional. The frame that marks the last
   * marcher "through" can also be the frame that finds the wave empty, so
   * endRun() would set step='over' and the wave-complete branch would then set
   * step='between' in the SAME call — React batches and the later write wins.
   * The previous version shipped exactly that: the gate falling on the final
   * ship rendered as "Wave cleared" with every heart spent.
   */
  const endRun = useCallback((survived) => {
    if (overRef.current) return;
    overRef.current = true;
    cancelAnimationFrame(rafRef.current);
    setOver({ survived, ...summarise(logRef.current) });
    setStep('over');
    if (mode === 'free') awardFreeRun?.('intercept', stage);
  }, [mode, stage, awardFreeRun]);

  const record = useCallback((entry) => {
    logRef.current.push(entry);
    waveLogRef.current.push(entry);
    trialLogRef.current?.trial({
      ok: entry.type === 'hit' || entry.type === 'withheld',
      kind: entry.type,
      rt: entry.rt ?? null,
      err: entry.err ?? null,
      hidden: Boolean(entry.hidden),
    });
  }, []);

  const damage = useCallback((n) => {
    hpRef.current = Math.max(0, hpRef.current - n);
    setHp(hpRef.current);
    comboRef.current = 1;
    setCombo(1);
    if (hpRef.current <= 0) endRun(false);
  }, [endRun]);

  /* ── the strike ───────────────────────────────────────────────────────── */
  const strike = useCallback((nx, ny) => {
    if (step !== 'run' || pausedRef.current || !waveRef.current) return;
    const now = performance.now() - t0Ref.current;
    const wave = waveRef.current;
    const { w, h } = sizeRef.current;
    if (!w || !h) return;

    /* Tap radius in normalised units. Generous on purpose: this measures WHEN
       you strike, and a fiddly target would turn it into a test of aim. */
    const grab = 0.075;

    // barrels first — they are the deliberate, planned action
    for (const b of wave.barrels) {
      if (b.spent) continue;
      const p = posAt(b.at);
      if (Math.hypot(nx - p.x, ny - p.y) > grab) continue;
      b.spent = true;
      playSfx?.('win');
      fxRef.current.push({ kind: 'boom', at: now, x: p.x, y: p.y, big: true });
      let caught = 0;
      for (const u of wave.units) {
        if (u.dead || u.through || u.kind === KIND.NOGO) continue;
        const f = (now - u.spawnAt) / u.crossMs;
        if (f < 0 || f > 1) continue;
        if (Math.abs(f - b.at) > BLAST_FRAC) continue;
        u.dead = true;
        caught += 1;
        const q = posAt(f);
        fxRef.current.push({ kind: 'boom', at: now, x: q.x, y: q.y });
        const bw = windowAt(u, now);
        record({
          type: 'hit',
          rt: Math.round(now - (bw ? bw.enterAt : u.enterAt)),
          hidden: false, err: 0, barrel: true,
        });
      }
      if (caught > 1) {
        comboRef.current += caught;
        setCombo(comboRef.current);
        fxRef.current.push({ kind: 'text', at: now, x: p.x, y: p.y, text: t.chain(caught), good: true });
      }
      return;
    }

    // then a marcher, nearest to the finger among those inside SOME reach
    let best = null;
    for (const u of wave.units) {
      if (u.dead || u.through) continue;
      /* ⚠ A marcher may answer to several towers now, and a bound one to
         exactly one — so "is it strikeable" is a question about which window it
         is standing in, not about a single pair of times. */
      const win = windowAt(u, now);
      if (!win) continue;
      const f = (now - u.spawnAt) / u.crossMs;
      const p = posAt(f);
      const d = Math.hypot(nx - p.x, ny - p.y);
      if (d > grab) continue;
      if (!best || d < best.d) best = { u, d, p, f, win };
    }
    if (!best) return;

    const { u, p, win } = best;
    const hidden = now >= win.hideAt;

    if (u.kind === KIND.NOGO) {
      /* A commission error — the whole point of the no-go colour. It costs the
         chain and is recorded, but it does NOT damage the gate: hitting a
         friendly is the player's mistake, not the army's success. */
      u.dead = true;
      record({ type: 'commission' });
      comboRef.current = 1;
      setCombo(1);
      playSfx?.('error');
      fxRef.current.push({ kind: 'text', at: now, x: p.x, y: p.y, text: t.dontHit, good: false });
      fxRef.current.push({ kind: 'boom', at: now, x: p.x, y: p.y, bad: true });
      return;
    }

    u.hits = (u.hits || 0) + 1;
    if (u.hits < u.taps) {
      playSfx?.('click');
      fxRef.current.push({ kind: 'spark', at: now, x: p.x, y: p.y });
      return;
    }

    u.dead = true;
    /* Measured from the window they were actually struck in. Against the FIRST
       window it would read as several seconds of dithering whenever a marcher
       was taken at the second or third tower. */
    const rt = Math.round(now - win.enterAt);
    /* On a hidden marcher the meaningful number is the signed error against the
       middle of the covered stretch — early or late — not how fast you were. */
    const mid = (win.hideAt + win.exitAt) / 2;
    record({ type: 'hit', rt, hidden, err: hidden ? Math.round(now - mid) : 0 });
    comboRef.current += 1;
    setCombo(comboRef.current);
    playSfx?.('win');
    fxRef.current.push({ kind: 'boom', at: now, x: p.x, y: p.y });
    const label = hidden
      ? (Math.abs(now - mid) < cfg.tolMs ? t.perfect : (now < mid ? t.early : t.late))
      : t.hit;
    fxRef.current.push({ kind: 'text', at: now, x: p.x, y: p.y, text: label, good: true });
  }, [step, t, playSfx, record, cfg.tolMs]);

  /* ── the loop ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'run') return undefined;
    const wrap = wrapRef.current;
    const cv = canvasRef.current;
    if (!wrap || !cv) return undefined;
    const ctx = cv.getContext('2d');

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w, h };
    };

    const frame = () => {
      if (step !== 'run' || overRef.current) return false;
      /* Hold the whole wave while the lesson is up — no marching, no strikes,
         no gate damage. Returning TRUE keeps the loop alive; false would stop it
         permanently (shared/canvasLoop.js). */
      if (coachOpenRef.current) return true;
      const { w, h } = sizeRef.current;
      if (!w || !h) return true;
      const wave = waveRef.current;
      if (!wave) return true;
      const now = pausedRef.current ? -1 : performance.now() - t0Ref.current;

      const cs = getComputedStyle(cv);
      const tok = (n, f) => (cs.getPropertyValue(n) || '').trim() || f;
      const X = (nx) => nx * w;
      const Y = (ny) => ny * h;

      ctx.clearRect(0, 0, w, h);

      /* ── the trail ───────────────────────────────────────────────────── */
      const line = tok('--line', '#a3957c');
      const surface = tok('--surface', '#e8e1d2');
      /* ⚠ EVERY SIZE ON THIS BOARD IS A FRACTION OF min(w, h), AND THEY WERE
         ALL RAISED TOGETHER (2026-08-29) because the game was unreadable on a
         phone: the trail was 0.056 and a marcher 0.020, which on a 390px screen
         is a 22px path carrying 8px dots. The tap radius (`grab`) was NOT
         raised with them — it was already 0.075, far larger than the marcher it
         selects, so the old art was promising a smaller target than the game
         actually accepted. Enlarging the art closes that gap rather than
         changing difficulty, which is why no timing gate moved. */
      const S = Math.min(w, h);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      const tracePath = () => {
        ctx.beginPath();
        ctx.moveTo(X(TRAIL[0][0]), Y(TRAIL[0][1]));
        for (let i = 1; i < TRAIL.length; i += 1) ctx.lineTo(X(TRAIL[i][0]), Y(TRAIL[i][1]));
      };
      // the packed earth either side of the road
      tracePath();
      ctx.strokeStyle = line;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = S * 0.118;
      ctx.stroke();
      // the road itself
      ctx.globalAlpha = 1;
      tracePath();
      ctx.strokeStyle = surface;
      ctx.lineWidth = S * 0.092;
      ctx.stroke();
      // a worn centre line, so the road reads as a road and not as a pipe
      tracePath();
      ctx.strokeStyle = line;
      ctx.globalAlpha = 0.30;
      ctx.lineWidth = Math.max(1.5, S * 0.007);
      ctx.setLineDash([S * 0.022, S * 0.030]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      /* ── the tower's reach ───────────────────────────────────────────── */
      const accent = tok('--game-accent', '#d4952f');
      /*
       * ⚠ THE TWO STRETCHES WANT DIFFERENT CAPS, and it is not cosmetic.
       * The reach is a claim about WHERE you can strike, so it takes butt caps
       * and ends exactly at ringA/ringB — a round cap would draw reach the
       * player does not have. The canopy is scenery hiding the trail, so it
       * takes round caps and joins: with butt caps it rendered as a hard black
       * wedge at the elbow that read as a rendering glitch rather than trees.
       */
      const strokeStretch = (a, b, colour, width, alpha, cap) => {
        ctx.beginPath();
        const steps = 28;
        for (let i = 0; i <= steps; i += 1) {
          const p = posAt(a + (b - a) * (i / steps));
          if (i) ctx.lineTo(X(p.x), Y(p.y)); else ctx.moveTo(X(p.x), Y(p.y));
        }
        ctx.strokeStyle = colour;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.lineCap = cap;
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
      };
      /* One reach per tower, each in its own hue — the hue is what tells a
         player which tower a BOUND marcher (ringed in the same colour) belongs
         to, so reach and ring must be drawn from the same array. */
      const towers = cfg.towers && cfg.towers.length ? cfg.towers : [{
        at: RING_AT, a: cfg.ringA, b: cfg.ringB,
        hiddenA: cfg.hiddenA, hiddenB: cfg.hiddenB,
      }];
      const hueOf = (tw) => {
        const spec = TOWER_TOKEN[Math.max(0, TOWER_AT.indexOf(tw.at))];
        return spec ? tok(spec[0], spec[1]) : accent;
      };

      towers.forEach((tw) => {
        strokeStretch(tw.a, tw.b, hueOf(tw), S * 0.100, 0.26, 'butt');
      });

      /* ── the canopy: the reason this is a prediction ─────────────────── */
      /* ⚠ Drawn for EVERY tower. The model hides a stretch of each reach so the
         prediction measure cannot be dodged by waiting for a clear tower; if
         only the first were drawn, the others would hide marchers with nothing
         on screen explaining where they went. */
      if (cfg.hiddenShare > 0) {
        const ink = tok('--game-ink', '#131e28');
        towers.forEach((tw) => {
          if (!(tw.hiddenB > tw.hiddenA)) return;
          strokeStretch(tw.hiddenA, tw.hiddenB, ink, S * 0.126, 0.26, 'round');
          strokeStretch(tw.hiddenA, tw.hiddenB, ink, S * 0.104, 0.97, 'round');
          // a scatter of crowns so it reads as forest rather than as a black bar
          for (let i = 0; i <= 5; i += 1) {
            const p = posAt(tw.hiddenA + (tw.hiddenB - tw.hiddenA) * (i / 5));
            const wob = ((i * 37) % 11) / 11 - 0.5;
            ctx.fillStyle = ink;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(X(p.x) + wob * S * 0.03, Y(p.y) - S * 0.035 + wob * S * 0.02,
              S * (0.030 + Math.abs(wob) * 0.014), 0, 6.2832);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        });
      }

      /* ── barrels ─────────────────────────────────────────────────────── */
      /* ⚠ SQUARE, not a circle. Barrels were drawn as --game-bad discs and the
         rust marcher colour is also --game-bad, so on any wave where rust was
         in play the two were indistinguishable — and one of them must be tapped
         while the other must not. Shape carries the difference now, so it
         survives both themes and colour-blindness. */
      for (const b of wave.barrels) {
        if (b.spent) continue;
        const p = posAt(b.at);
        const s = S * 0.032;
        const ink = tok('--game-ink', '#131e28');
        ctx.fillStyle = tok('--game-bad', '#854c49');
        ctx.fillRect(X(p.x) - s, Y(p.y) - s, s * 2, s * 2);
        // two hoops, so the square reads as a drum seen side-on
        ctx.strokeStyle = ink;
        ctx.globalAlpha = 0.45;
        ctx.lineWidth = Math.max(1.5, s * 0.16);
        ctx.beginPath();
        ctx.moveTo(X(p.x) - s, Y(p.y) - s * 0.35); ctx.lineTo(X(p.x) + s, Y(p.y) - s * 0.35);
        ctx.moveTo(X(p.x) - s, Y(p.y) + s * 0.35); ctx.lineTo(X(p.x) + s, Y(p.y) + s * 0.35);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = Math.max(2, s * 0.20);
        ctx.strokeRect(X(p.x) - s, Y(p.y) - s, s * 2, s * 2);
        // a stub of fuse, so it reads as explosive rather than as a crate
        ctx.beginPath();
        ctx.moveTo(X(p.x), Y(p.y) - s);
        ctx.lineTo(X(p.x) + s * 0.6, Y(p.y) - s * 1.8);
        ctx.stroke();
      }

      /* ── the tower ───────────────────────────────────────────────────── */
      towers.forEach((tw) => {
        const tp = posAt(tw.at);
        const hue = hueOf(tw);
        const topY = Y(tp.y) - S * 0.105;
        // mast
        ctx.strokeStyle = hue;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = Math.max(2, S * 0.011);
        ctx.beginPath();
        ctx.moveTo(X(tp.x), topY);
        ctx.lineTo(X(tp.x), Y(tp.y));
        ctx.stroke();
        ctx.globalAlpha = 1;
        // head
        ctx.fillStyle = hue;
        ctx.beginPath();
        ctx.arc(X(tp.x), topY, S * 0.038, 0, 6.2832);
        ctx.fill();
        ctx.strokeStyle = tok('--game-ink', '#131e28');
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = Math.max(1.5, S * 0.006);
        ctx.stroke();
        ctx.globalAlpha = 1;
        // a slow pulse outward, so a tower reads as live rather than as scenery
        const pulse = ((now >= 0 ? now : 0) % 1600) / 1600;
        ctx.strokeStyle = hue;
        ctx.globalAlpha = 0.34 * (1 - pulse);
        ctx.lineWidth = Math.max(1.5, S * 0.007);
        ctx.beginPath();
        ctx.arc(X(tp.x), topY, S * (0.038 + pulse * 0.055), 0, 6.2832);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      /* ── the gate ────────────────────────────────────────────────────── */
      const gp = posAt(1);
      const gs = S * 0.076;
      const hurt = hpRef.current <= 3;
      ctx.fillStyle = hurt ? tok('--game-bad', '#854c49') : accent;
      ctx.beginPath();
      ctx.moveTo(X(gp.x) - gs, Y(gp.y) + gs * 0.7);
      ctx.lineTo(X(gp.x) - gs, Y(gp.y) - gs * 0.25);
      ctx.lineTo(X(gp.x), Y(gp.y) - gs);
      ctx.lineTo(X(gp.x) + gs, Y(gp.y) - gs * 0.25);
      ctx.lineTo(X(gp.x) + gs, Y(gp.y) + gs * 0.7);
      ctx.closePath();
      ctx.fill();
      // battlements, and a doorway — a keep rather than a pentagon
      ctx.fillStyle = tok('--game-ink', '#131e28');
      ctx.globalAlpha = 0.30;
      for (let i = -1; i <= 1; i += 1) {
        ctx.fillRect(X(gp.x) + i * gs * 0.62 - gs * 0.17, Y(gp.y) - gs * 0.22, gs * 0.34, gs * 0.30);
      }
      ctx.globalAlpha = 0.45;
      ctx.fillRect(X(gp.x) - gs * 0.26, Y(gp.y) + gs * 0.12, gs * 0.52, gs * 0.58);
      ctx.globalAlpha = 1;
      /* HP as pips under the gate. The number lived only in the HUD strip
         before, which is the far corner of the screen from the thing losing it.
         ⚠ Capped at 10 columns so a survival run cannot draw pips off-screen. */
      const pips = Math.max(0, Math.min(BASE_HP, hpRef.current));
      for (let i = 0; i < BASE_HP; i += 1) {
        ctx.fillStyle = i < pips
          ? (hurt ? tok('--game-bad', '#854c49') : tok('--game-ok', '#386544'))
          : tok('--line', '#a3957c');
        ctx.globalAlpha = i < pips ? 1 : 0.30;
        ctx.beginPath();
        ctx.arc(X(gp.x) + (i - (BASE_HP - 1) / 2) * S * 0.028,
          Y(gp.y) + gs * 1.06, S * 0.009, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* ── the army ────────────────────────────────────────────────────── */
      if (now >= 0) {
        const r = S * 0.034;
        for (const u of wave.units) {
          if (u.dead) continue;
          const f = (now - u.spawnAt) / u.crossMs;
          if (f < 0) continue;
          if (f >= 1) {
            if (!u.through) {
              u.through = true;
              /* A no-go marcher was never a threat — letting it walk through is
                 the CORRECT play, and is scored as a successful withholding. */
              if (u.kind === KIND.NOGO) {
                record({ type: 'withheld' });
              } else {
                record({ type: 'miss' });
                fxRef.current.push({ kind: 'text', at: now, x: gp.x, y: gp.y, text: t.through, good: false });
                fxRef.current.push({ kind: 'boom', at: now, x: gp.x, y: gp.y, bad: true });
                playSfx?.('error');
                damage(1);
              }
            }
            continue;
          }
          /* Under the canopy they are simply not there to see — and that is
             true of EVERY tower's canopy, not just the first one's. */
          if (cfg.hiddenShare > 0
            && towers.some((tw) => tw.hiddenB > tw.hiddenA && f > tw.hiddenA && f < tw.hiddenB)) continue;
          const p = posAt(f);
          /* Out of reach = out of play. Dimming says so without hiding the
             colour, which the player still needs in order to decide whether
             this is one to leave alone when it does arrive. */
          const mine = u.towerIdx >= 0 && towers[u.towerIdx] ? [towers[u.towerIdx]] : towers;
          const inReach = mine.some((tw) => f >= tw.a && f <= tw.b);
          const rad = u.kind === KIND.ARMOUR ? r * 1.26 : r;

          /* A sprinter gets a streak, because "that one is faster" has to be
             readable BEFORE it matters — a marcher you only recognise as fast
             once it is past you is not a mechanic, it is a surprise. */
          if (u.sprint) {
            const back = posAt(Math.max(0, f - 0.045));
            ctx.strokeStyle = tok(COLOUR_TOKEN[u.colour] || '--game-item', '#2f5f86');
            ctx.globalAlpha = inReach ? 0.34 : 0.16;
            ctx.lineCap = 'round';
            ctx.lineWidth = rad * 1.1;
            ctx.beginPath();
            ctx.moveTo(X(back.x), Y(back.y));
            ctx.lineTo(X(p.x), Y(p.y));
            ctx.stroke();
            ctx.globalAlpha = 1;
          }

          ctx.globalAlpha = inReach ? 1 : 0.42;
          ctx.fillStyle = tok(COLOUR_TOKEN[u.colour] || '--game-item', '#2f5f86');
          ctx.beginPath();
          ctx.arc(X(p.x), Y(p.y), rad, 0, 6.2832);
          ctx.fill();
          ctx.globalAlpha = 1;
          if (u.kind === KIND.ARMOUR) {
            ctx.strokeStyle = tok('--game-ink', '#131e28');
            ctx.globalAlpha = u.hits ? 0.35 : 0.8;
            ctx.lineWidth = Math.max(2.4, rad * 0.22);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          /* A bound marcher wears a ring in ITS tower's hue — the only thing on
             screen saying which reach can take it. Drawn outside the body so it
             survives the armour stroke sitting on the body's edge. */
          if (u.towerIdx >= 0 && towers[u.towerIdx]) {
            ctx.strokeStyle = hueOf(towers[u.towerIdx]);
            ctx.globalAlpha = inReach ? 0.95 : 0.5;
            ctx.lineWidth = Math.max(2, rad * 0.20);
            ctx.beginPath();
            ctx.arc(X(p.x), Y(p.y), rad * 1.55, 0, 6.2832);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      /* ── effects ─────────────────────────────────────────────────────── */
      fxRef.current = fxRef.current.filter((e) => now - e.at < 640);
      for (const e of fxRef.current) {
        const k = (now - e.at) / 640;
        if (e.kind === 'text') {
          ctx.globalAlpha = Math.max(0, 1 - k);
          ctx.fillStyle = e.good ? tok('--game-ok', '#386544') : tok('--game-bad', '#854c49');
          ctx.font = `800 ${Math.round(Math.max(15, S * 0.052))}px Outfit, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(e.text, X(e.x), Y(e.y) - S * 0.062 - k * S * 0.038);
        } else if (e.kind === 'boom') {
          ctx.globalAlpha = Math.max(0, 0.75 - k);
          ctx.strokeStyle = e.bad ? tok('--game-bad', '#854c49') : accent;
          ctx.lineWidth = Math.max(2.5, S * (e.big ? 0.013 : 0.008));
          ctx.beginPath();
          ctx.arc(X(e.x), Y(e.y), S * (e.big ? 0.13 : 0.075) * k + S * 0.014, 0, 6.2832);
          ctx.stroke();
        } else {
          ctx.globalAlpha = Math.max(0, 0.9 - k);
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(X(e.x), Y(e.y), S * 0.012, 0, 6.2832);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      /* ── wave over? (never past the latch — see endRun) ──────────────── */
      if (now >= 0 && !overRef.current) {
        const live = wave.units.some((u) => !u.dead && !u.through);
        const lastGate = wave.units.reduce((mx, u) => Math.max(mx, u.gateAt), 0);
        if (!live && now > lastGate + 300) {
          setWaveStat(summarise(waveLogRef.current));
          if (mode === 'free') {
            setStage((v) => v + 1);
            setWaveNo((v) => v + 1);
            setStep('between');
          } else if (waveNo >= totalWaves) {
            endRun(true);
          } else {
            setWaveNo((v) => v + 1);
            setStep('between');
          }
          return false;
        }
      }
      return true;
    };

    const stop = startCanvasLoop({ wrap, rafRef, resize, frame });
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, waveNo, cfg, mode, totalWaves]);

  /* ── pointer ──────────────────────────────────────────────────────────── */
  const onPointer = useCallback((ev) => {
    ev.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    strike((ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
  }, [strike]);

  /* ── finish ───────────────────────────────────────────────────────────── */
  const finish = useCallback(() => {
    playSfx?.('click');
    const s = summarise(logRef.current);
    if (mode === 'levels') {
      const won = levelPassed(hpRef.current);
      trialLogRef.current?.finish({ won, score: s.kills, level });
      trialLogRef.current = null;
      onResult?.({ won, score: s.kills, summary: `${s.kills} · ${hpRef.current}/${BASE_HP}` });
      return;
    }
    if (mode === 'passplay') {
      trialLogRef.current?.finish({ score: s.kills });
      trialLogRef.current = null;
      onResult?.({ score: s.kills });
      return;
    }
    trialLogRef.current?.finish({ best: stage, kills: s.kills });
    trialLogRef.current = null;
    onExit?.();
  }, [mode, level, onResult, onExit, playSfx, stage]);

  const biasText = (b) => (Math.abs(b) <= 12 ? t.biasEven : b < 0 ? t.biasEarly(Math.abs(b)) : t.biasLate(b));

  const hudSub = mode === 'levels'
    ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'free' ? t.wave(waveNo) : t.waveOf(Math.min(waveNo, totalWaves), totalWaves);

  const wave = waveRef.current;

  return (
    /* `.ic-root` is `position: fixed; inset: 0`, and it is the only element that
       contains BOTH the status bar and the field — so it is the box the coach's
       anchors are measured in. */
    <div className="ic-root" dir={isAr ? 'rtl' : 'ltr'} ref={coachRootRef}>
      {coachOpen && (
        <DomCoach
          isAr={isAr}
          playSfx={playSfx}
          stageRef={coachRootRef}
          pack={INTERCEPT_COACH}
          onFinish={() => coach?.end()}
          onSkip={() => coach?.end()}
        />
      )}
      <TrainingPlayHeader
        isAr={isAr}
        playSfx={playSfx}
        title={t.title}
        subtitle={hudSub}
        onMenu={pause.requestQuit}
        menuAriaLabel={t.menu}
        onPause={step === 'run' && !pause.open ? pause.start : undefined}
        pauseAriaLabel={t.paused}
      />
      {pause.modal}

      {(step === 'run' || step === 'between') && (
        <div className="ic-status" data-coach="hud">
          <div className="ic-hp" aria-label={`${t.base} ${hp}/${BASE_HP}`}>
            <span className="ic-hp-label">{t.base}</span>
            <span className="ic-hp-track">
              <span
                className={`ic-hp-fill${hp <= 3 ? ' ic-hp-fill--low' : ''}`}
                style={{ width: `${(hp / BASE_HP) * 100}%` }}
              />
            </span>
          </div>
          {combo > 1 && <span className="ic-combo">{t.chain(combo)}</span>}
          {/* ⚠ The swatch shows the FORBIDDEN colour, not the target one. The
              first version showed the go colour under the label "safe colour",
              which is precisely inverted: it told the player the thing they are
              meant to strike is the thing to leave alone. The rule the player
              has to hold is a prohibition, so show the prohibition. */}
          {step === 'run' && cfg.nogoShare > 0 && wave && (
            <span className="ic-safe">
              <i className="ic-swatch" style={{ background: `var(${COLOUR_TOKEN[wave.nogoColour]})` }} />
              {t.safeIs}
            </span>
          )}
        </div>
      )}

      {step === 'brief' && (
        <div className="ic-panel">
          <h3>{t.briefTitle}</h3>
          <p className="ic-brief">{t.brief}</p>
          <ul className="ic-rules">
            {cfg.nogoShare > 0 && <li>{t.briefNogo.replace('{c}', isAr ? 'الآخر' : 'other-coloured')}</li>}
            {cfg.hiddenShare > 0 && <li>{t.briefCanopy}</li>}
            {cfg.barrels > 0 && <li>{t.briefBarrel}</li>}
          </ul>
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); startWave(); }}>
            {t.begin}
          </button>
        </div>
      )}

      {step === 'run' && (
        <div
          className="ic-field"
          ref={wrapRef}
          data-coach="field"
          onPointerDown={onPointer}
          role="application"
          aria-label={t.tapHint}
        >
          <canvas ref={canvasRef} className="ic-canvas" />
          <div className="ic-taphint">{t.tapHint}</div>
        </div>
      )}

      {step === 'between' && (
        <div className="ic-panel">
          {/* "Wave held" on a wave where six walked through is a lie the
              player can see. The panel names what happened. */}
          <h3>{waveStat && waveStat.misses > 0 ? t.waveLeaked : t.waveCleared}</h3>
          {waveStat && (
            <div className="ic-stats">
              <div><b>{waveStat.kills}</b><small>{t.resKills}</small></div>
              <div><b>{waveStat.misses}</b><small>{t.resThrough}</small></div>
              {waveStat.nogoTotal > 0 && (
                <div><b>{waveStat.withheld}/{waveStat.nogoTotal}</b><small>{t.resHeld}</small></div>
              )}
            </div>
          )}
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); startWave(); }}>
            {t.nextWave}
          </button>
        </div>
      )}

      {step === 'over' && over && (
        <div className="ic-panel">
          <h3>{over.survived ? t.held : t.fell}</h3>
          <div className="ic-stats">
            <div><b>{over.kills}</b><small>{t.resKills}</small></div>
            <div><b>{over.misses}</b><small>{t.resThrough}</small></div>
            <div><b>{over.rt}ms</b><small>{t.resRt}</small></div>
          </div>
          <p className="ic-note">{t.noteRt}</p>

          {/* The two measures that make this game worth having. Shown only when
              the level actually contained them, so neither ever reads as a
              perfect score on a level that never tested it. */}
          {over.nogoTotal > 0 && (
            <p className="ic-note ic-note--score">{t.noteNogo(over.withheld, over.nogoTotal)}</p>
          )}
          {over.hidden > 0 && (
            <div className="ic-stats">
              <div><b>{biasText(over.bias)}</b><small>{t.resBias}</small></div>
              <div><b>±{over.spread}ms</b><small>{t.resSteady}</small></div>
            </div>
          )}
          {over.hidden > 0 && <p className="ic-note">{t.noteHidden}</p>}

          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={finish}>
            {t.cont}
          </button>
        </div>
      )}
    </div>
  );
}

export default function InterceptGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_speed_intercept_v3"
      scienceId="intercept"
      title={{ en: 'Intercept', ar: 'الاعتراض' }}
      hints={{
        free: { en: UI.en.hintFree, ar: UI.ar.hintFree },
        levels: { en: UI.en.hintLevels, ar: UI.ar.hintLevels },
        pass: { en: UI.en.hintPass, ar: UI.ar.hintPass },
      }}
      /* ONE LADDER — no easy/med/hard. See data.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: 1, scoreLabel: { en: 'cut down', ar: 'أُسقطوا' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <InterceptEngine
          key={`${p.mode}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}
