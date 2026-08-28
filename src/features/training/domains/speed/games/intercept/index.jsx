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
  BASE_HP, BLAST_FRAC, KIND, RING_AT, TRAIL,
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
    hintLevels: '60 levels · a new mechanic every 10',
    hintPass: 'Same waves for everyone · pass the device',
    briefTitle: 'Hold the trail',
    brief: 'An army marches to your gate. Tap them while they are inside your tower’s reach.',
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
    hintLevels: '٦٠ مستوى · آلية جديدة كل ١٠',
    hintPass: 'نفس الموجات للجميع · مرّر الجهاز',
    briefTitle: 'احمِ الدرب',
    brief: 'جيش يزحف نحو بوابتك. المسهم وهم داخل مدى برجك.',
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

export function InterceptEngine({
  mode, level, seed, attempt, onResult, onExit, isAr, playSfx, awardFreeRun,
}) {
  const t = isAr ? UI.ar : UI.en;

  const [step, setStep] = useState('brief');       // brief | run | between | over
  const [waveNo, setWaveNo] = useState(1);
  const [hp, setHp] = useState(BASE_HP);
  const [stage, setStage] = useState(0);
  const [combo, setCombo] = useState(1);
  const [over, setOver] = useState(null);
  const [waveStat, setWaveStat] = useState(null);

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
        record({ type: 'hit', rt: Math.round(now - u.enterAt), hidden: false, err: 0, barrel: true });
      }
      if (caught > 1) {
        comboRef.current += caught;
        setCombo(comboRef.current);
        fxRef.current.push({ kind: 'text', at: now, x: p.x, y: p.y, text: t.chain(caught), good: true });
      }
      return;
    }

    // then a marcher, nearest to the finger among those inside the reach
    let best = null;
    for (const u of wave.units) {
      if (u.dead || u.through) continue;
      if (now < u.enterAt || now > u.exitAt) continue;
      const f = (now - u.spawnAt) / u.crossMs;
      const p = posAt(f);
      const d = Math.hypot(nx - p.x, ny - p.y);
      if (d > grab) continue;
      if (!best || d < best.d) best = { u, d, p, f };
    }
    if (!best) return;

    const { u, p } = best;
    const hidden = now >= u.hideAt;

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
    const rt = Math.round(now - u.enterAt);
    /* On a hidden marcher the meaningful number is the signed error against the
       middle of the covered stretch — early or late — not how fast you were. */
    const mid = (u.hideAt + u.exitAt) / 2;
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
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(X(TRAIL[0][0]), Y(TRAIL[0][1]));
      for (let i = 1; i < TRAIL.length; i += 1) ctx.lineTo(X(TRAIL[i][0]), Y(TRAIL[i][1]));
      ctx.strokeStyle = line;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = Math.min(w, h) * 0.072;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = surface;
      ctx.lineWidth = Math.min(w, h) * 0.056;
      ctx.stroke();

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
      strokeStretch(cfg.ringA, cfg.ringB, accent, Math.min(w, h) * 0.060, 0.30, 'butt');

      /* ── the canopy: the reason this is a prediction ─────────────────── */
      if (cfg.hiddenShare > 0) {
        const ink = tok('--game-ink', '#131e28');
        strokeStretch(cfg.hiddenA, cfg.hiddenB, ink, Math.min(w, h) * 0.082, 0.28, 'round');
        strokeStretch(cfg.hiddenA, cfg.hiddenB, ink, Math.min(w, h) * 0.066, 0.97, 'round');
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
        const s = Math.min(w, h) * 0.020;
        ctx.fillStyle = tok('--game-bad', '#854c49');
        ctx.fillRect(X(p.x) - s, Y(p.y) - s, s * 2, s * 2);
        ctx.strokeStyle = tok('--game-ink', '#131e28');
        ctx.lineWidth = 2;
        ctx.strokeRect(X(p.x) - s, Y(p.y) - s, s * 2, s * 2);
        // a stub of fuse, so it reads as explosive rather than as a crate
        ctx.beginPath();
        ctx.moveTo(X(p.x), Y(p.y) - s);
        ctx.lineTo(X(p.x) + s * 0.6, Y(p.y) - s * 1.8);
        ctx.stroke();
      }

      /* ── the tower ───────────────────────────────────────────────────── */
      const tp = posAt(RING_AT);
      const towerY = Y(tp.y) - Math.min(w, h) * 0.072;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X(tp.x), towerY);
      ctx.lineTo(X(tp.x), Y(tp.y));
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(X(tp.x), towerY, Math.min(w, h) * 0.026, 0, 6.2832);
      ctx.fill();

      /* ── the gate ────────────────────────────────────────────────────── */
      const gp = posAt(1);
      const gs = Math.min(w, h) * 0.05;
      ctx.fillStyle = hpRef.current <= 3 ? tok('--game-bad', '#854c49') : accent;
      ctx.beginPath();
      ctx.moveTo(X(gp.x) - gs, Y(gp.y) + gs * 0.7);
      ctx.lineTo(X(gp.x) - gs, Y(gp.y) - gs * 0.25);
      ctx.lineTo(X(gp.x), Y(gp.y) - gs);
      ctx.lineTo(X(gp.x) + gs, Y(gp.y) - gs * 0.25);
      ctx.lineTo(X(gp.x) + gs, Y(gp.y) + gs * 0.7);
      ctx.closePath();
      ctx.fill();

      /* ── the army ────────────────────────────────────────────────────── */
      if (now >= 0) {
        const r = Math.min(w, h) * 0.020;
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
          /* Under the canopy they are simply not there to see. */
          if (cfg.hiddenShare > 0 && f > cfg.hiddenA && f < cfg.hiddenB) continue;
          const p = posAt(f);
          /* Out of reach = out of play. Dimming says so without hiding the
             colour, which the player still needs in order to decide whether
             this is one to leave alone when it does arrive. */
          const inReach = f >= cfg.ringA && f <= cfg.ringB;
          ctx.globalAlpha = inReach ? 1 : 0.42;
          ctx.fillStyle = tok(COLOUR_TOKEN[u.colour] || '--game-item', '#2f5f86');
          ctx.beginPath();
          ctx.arc(X(p.x), Y(p.y), u.kind === KIND.ARMOUR ? r * 1.28 : r, 0, 6.2832);
          ctx.fill();
          ctx.globalAlpha = 1;
          if (u.kind === KIND.ARMOUR) {
            ctx.strokeStyle = tok('--game-ink', '#131e28');
            ctx.globalAlpha = u.hits ? 0.35 : 0.8;
            ctx.lineWidth = 2.4;
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
          ctx.font = '800 14px Outfit, system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(e.text, X(e.x), Y(e.y) - 20 - k * 14);
        } else if (e.kind === 'boom') {
          ctx.globalAlpha = Math.max(0, 0.75 - k);
          ctx.strokeStyle = e.bad ? tok('--game-bad', '#854c49') : accent;
          ctx.lineWidth = e.big ? 4 : 2.5;
          ctx.beginPath();
          ctx.arc(X(e.x), Y(e.y), Math.min(w, h) * (e.big ? 0.09 : 0.05) * k + 4, 0, 6.2832);
          ctx.stroke();
        } else {
          ctx.globalAlpha = Math.max(0, 0.9 - k);
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(X(e.x), Y(e.y), 4, 0, 6.2832);
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
    <div className="ic-root" dir={isAr ? 'rtl' : 'ltr'}>
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
        <div className="ic-status">
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
