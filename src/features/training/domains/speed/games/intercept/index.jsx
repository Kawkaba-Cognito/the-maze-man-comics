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
    brief: 'An army marches to your gate. Press a weapon to fire on its own stretch of trail — you never touch the marchers.',
    briefNogo: 'Leave the {c} ones alone — they are not the enemy.',
    briefCanopy: 'Part of your reach is under the trees. Fire where you believe they are.',
    briefBarrel: 'A barrel in your stretch goes up with everything near it.',
    briefMissile: 'The missile flies. Fire it before they arrive, not as they pass.',
    briefMortar: 'The mortar throws past its own stretch and takes armour in one.',
    /* Weapon names. Short on purpose — they sit on a button that must stay
       readable at 320px with three of them side by side. */
    wTurret: 'Turret',
    wMissile: 'Missile',
    wMortar: 'Mortar',
    wReady: 'ready',
    wReloading: 'reloading',
    wInstant: 'instant',
    wFlies: (s) => `flies ${s}s`,
    wasted: 'NOTHING THERE',
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
    tapHint: 'Fire the weapon whose stretch they are crossing',
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
    brief: 'جيش يزحف نحو بوابتك. اضغط سلاحاً ليطلق على مداه — لا تلمس الزاحفين أبداً.',
    briefNogo: 'اترك ذوي اللون {c} — ليسوا أعداءً.',
    briefCanopy: 'جزء من مداك تحت الأشجار. أطلق حيث تظنّهم.',
    briefBarrel: 'البرميل داخل مداك ينفجر بكل من حوله.',
    briefMissile: 'الصاروخ يطير. أطلقه قبل وصولهم، لا عند مرورهم.',
    briefMortar: 'الهاون يرمي خارج مداه ويسقط المدرّع بضربة واحدة.',
    wTurret: 'المدفع',
    wMissile: 'الصاروخ',
    wMortar: 'الهاون',
    wReady: 'جاهز',
    wReloading: 'يعيد التذخير',
    wInstant: 'فوري',
    wFlies: (s) => `يطير ${s}ث`,
    wasted: 'لا شيء هناك',
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
    tapHint: 'أطلق السلاح الذي يعبرون مداه',
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

/** Is this marcher inside a stretch that weapon can actually reach right now?
 *  ⚠ The BLAST counts. The mortar throws past the ends of its own stretch, so a
 *  marcher standing in that margin is killable — and drawing it dimmed, as the
 *  plain a/b test did, told the player it was out of play when it was not. */
const reaches = (tw, f) => f >= tw.a - (tw.blast || 0) && f <= tw.b + (tw.blast || 0);

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
  /* ⚠ Memoised. `coach?.openRef || { current: false }` builds a FRESH object on
     every render when there is no coach, and `fire` closes over it — so the
     fallback would change identity every frame and rebuild the callback that
     the weapon buttons are bound to. */
  const coachOpenRef = useMemo(() => coach?.openRef || { current: false }, [coach]);
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
  /** kind → { readyAt, coolMs, flightMs, at, heavy } — the weapon timelines. */
  const gunsRef = useRef({});
  /** Shells in the air: { weapon, firedAt, landsAt, at }. */
  const shotsRef = useRef([]);
  /*
   * ⚠ THE WAVE CLOCK MUST STOP WHEN THE WAVE DOES.
   * `now` was `performance.now() - t0Ref.current`, which keeps running while the
   * game is paused or the coach is open — so the frame loop froze the picture
   * while the model kept marching, and everyone TELEPORTED forward the moment
   * play resumed. Invisible in a screenshot and fatal to a game measuring
   * milliseconds: a marcher could cross its whole window during a tutorial step
   * and be recorded as missed. Held time is accumulated here and subtracted.
   */
  const holdRef = useRef({ since: 0, total: 0 });
  const [guns, setGuns] = useState([]);   // for the buttons only, not the loop

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
    const wave = buildWave(rng, cfg, waveNo);
    waveRef.current = wave;
    waveLogRef.current = [];
    fxRef.current = [];
    shotsRef.current = [];
    /* One timeline per weapon. Built from the wave's own towers so a level that
       has not unlocked the missile yet simply has no missile button — there is
       no separate list of what the player owns that could drift out of step. */
    const g = {};
    (wave.towers || cfg.towers || []).forEach((tw) => {
      g[tw.weapon] = {
        tower: tw,
        coolMs: tw.coolMs,
        flightMs: tw.flightMs,
        heavy: !!tw.heavy,
        blast: tw.blast || 0,
        readyAt: 0,
      };
    });
    gunsRef.current = g;
    /* Trail order, so the buttons sit left-to-right the way the stretches do —
       the mapping a player has to learn is easier when it is spatial. */
    setGuns((wave.towers || cfg.towers || []).map((tw) => tw.weapon));
    holdRef.current = { since: 0, total: 0 };
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

  /* The wave clock, with paused and coached time taken out. See `holdRef`. */
  const nowMs = useCallback(() => {
    const h = holdRef.current;
    const held = h.total + (h.since ? performance.now() - h.since : 0);
    return performance.now() - t0Ref.current - held;
  }, []);

  /* Start and stop the hold whenever play stops for a reason that is not the
     game's fault. Both branches write to the same accumulator on purpose. */
  useEffect(() => {
    const stopped = pause.open || coachOpen;
    const h = holdRef.current;
    if (stopped && !h.since) h.since = performance.now();
    else if (!stopped && h.since) { h.total += performance.now() - h.since; h.since = 0; }
  }, [pause.open, coachOpen]);

  /*
   * ── THE SHOT ────────────────────────────────────────────────────────────
   *
   * 2026-09-05: the player fires WEAPONS, and never touches a marcher.
   *
   * `fire` only presses the button. What the press does is decided when the
   * shell LANDS — instantly for the turret, `flightMs` later for the missile and
   * the mortar. That split is the whole prediction measure: with a flying weapon
   * you are aiming at where you believe they will be, on every shot, not only
   * under the canopy.
   */
  const landShot = useCallback((shot, now) => {
    const wave = waveRef.current;
    if (!wave) return;
    const gun = gunsRef.current[shot.weapon];
    if (!gun) return;
    const tw = gun.tower;
    const lo = tw.a - (tw.blast || 0);
    const hi = tw.b + (tw.blast || 0);
    const centre = posAt(tw.at);

    fxRef.current.push({ kind: 'boom', at: now, x: centre.x, y: centre.y, big: gun.blast > 0 });

    let killed = 0;
    let commissions = 0;
    let touched = false;

    /* Barrels in the stretch go up, and take their own neighbourhood with them.
       Resolved BEFORE the marchers so a chained kill is not double-counted. */
    const chained = new Set();
    for (const b of wave.barrels) {
      if (b.spent) continue;
      if (b.at < lo || b.at > hi) continue;
      b.spent = true;
      touched = true;
      const bp = posAt(b.at);
      fxRef.current.push({ kind: 'boom', at: now, x: bp.x, y: bp.y, big: true });
      for (const u of wave.units) {
        if (u.dead || u.through || u.kind === KIND.NOGO) continue;
        const f = (now - u.spawnAt) / u.crossMs;
        if (f < 0 || f > 1) continue;
        if (Math.abs(f - b.at) > BLAST_FRAC) continue;
        chained.add(u.id);
      }
    }

    for (const u of wave.units) {
      if (u.dead || u.through) continue;
      const f = (now - u.spawnAt) / u.crossMs;
      if (f < 0 || f > 1) continue;
      const chain = chained.has(u.id);
      /* ⚠ The marcher must be in a window belonging to THIS weapon. A bound one
         has a single window, which is what makes "marked for one weapon" mean
         anything at all — without this check every press would serve everybody
         and the mechanic would be announced in the UI while changing nothing. */
      const win = chain ? null : (u.windows || []).find(
        (x) => x.weapon === shot.weapon && now >= x.enterAt && now <= x.exitAt,
      );
      if (!chain && !win) continue;
      touched = true;
      const p = posAt(f);

      if (u.kind === KIND.NOGO) {
        /* A commission error — the whole point of the no-go colour. It costs the
           chain and is recorded, but it does NOT damage the gate: hitting a
           friendly is the player's mistake, not the army's success. */
        u.dead = true;
        commissions += 1;
        record({ type: 'commission' });
        fxRef.current.push({ kind: 'text', at: now, x: p.x, y: p.y, text: t.dontHit, good: false });
        fxRef.current.push({ kind: 'boom', at: now, x: p.x, y: p.y, bad: true });
        continue;
      }

      /* A heavy shell takes armour outright; the turret has to go twice. */
      u.hits = (u.hits || 0) + (chain || gun.heavy ? (u.taps || 1) : 1);
      if (u.hits < (u.taps || 1)) {
        fxRef.current.push({ kind: 'spark', at: now, x: p.x, y: p.y });
        continue;
      }

      u.dead = true;
      killed += 1;
      if (chain) {
        record({ type: 'hit', rt: Math.round(now - u.enterAt), hidden: false, err: 0, barrel: true });
        fxRef.current.push({ kind: 'boom', at: now, x: p.x, y: p.y });
        continue;
      }
      const hidden = now >= win.hideAt;
      /* Measured from the window they were actually struck in. Against the FIRST
         window it would read as several seconds of dithering whenever a marcher
         was taken at the second or third weapon. */
      const rt = Math.round(now - win.enterAt);
      /* On a hidden marcher the meaningful number is the signed error against the
         middle of the covered stretch — early or late — not how fast you were. */
      const mid = (win.hideAt + win.exitAt) / 2;
      record({ type: 'hit', rt, hidden, err: hidden ? Math.round(now - mid) : 0 });
      fxRef.current.push({ kind: 'boom', at: now, x: p.x, y: p.y });
      const label = hidden
        ? (Math.abs(now - mid) < cfg.tolMs ? t.perfect : (now < mid ? t.early : t.late))
        : t.hit;
      fxRef.current.push({ kind: 'text', at: now, x: p.x, y: p.y, text: label, good: true });
    }

    if (commissions > 0) {
      comboRef.current = 1;
      setCombo(1);
      playSfx?.('error');
    } else if (killed > 0) {
      comboRef.current += killed;
      setCombo(comboRef.current);
      playSfx?.('win');
      if (killed > 1) {
        fxRef.current.push({ kind: 'text', at: now, x: centre.x, y: centre.y, text: t.chain(killed), good: true });
      }
    } else if (!touched) {
      /*
       * A wasted shot. It costs nothing but the reload — which is the whole
       * cost, because that weapon is now unavailable for the marcher that did
       * need it. Deliberately NOT gate damage: a mistimed press doing the
       * enemy's job reads as unfair on a fast wave, and every wave in this game
       * is guaranteed clearable by a perfect player.
       */
      fxRef.current.push({ kind: 'text', at: now, x: centre.x, y: centre.y, text: t.wasted, good: false });
    }
  }, [t, playSfx, record, cfg.tolMs]);

  const fire = useCallback((kind) => {
    if (step !== 'run' || pausedRef.current || !waveRef.current) return;
    /* ⚠ Guarded like every other consequence while the lesson is open. A guided
       press with unlimited reading time is not a measurement, and a round that
       ends under the coach marks the lesson permanently done having shown two
       steps — the cancellation lesson learned that the hard way. */
    if (coachOpenRef.current) return;
    const gun = gunsRef.current[kind];
    if (!gun) return;
    const now = nowMs();
    if (now < gun.readyAt) return;
    gun.readyAt = now + gun.coolMs;
    playSfx?.('click');
    if (gun.flightMs > 0) {
      shotsRef.current.push({ weapon: kind, firedAt: now, landsAt: now + gun.flightMs, at: gun.tower.at });
    } else {
      landShot({ weapon: kind, at: gun.tower.at }, now);
    }
  }, [step, playSfx, nowMs, landShot, coachOpenRef]);

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
      const now = pausedRef.current ? -1 : nowMs();

      /* ── shells landing ──────────────────────────────────────────────── */
      /* Resolved at the TOP of the frame, before anything moves, so a shell
         lands against the positions it was aimed at rather than one frame on. */
      if (now >= 0 && shotsRef.current.length) {
        const still = [];
        for (const sh of shotsRef.current) {
          if (now >= sh.landsAt) landShot(sh, now); else still.push(sh);
        }
        shotsRef.current = still;
      }

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
      /*
       * ⚠ A ROAD IS FOUR STROKES, NOT ONE. The old trail was a fat line, a
       * thinner line and a dashed centre — which reads as a pipe, and was
       * reported as such. What makes it a road is the SHOULDER: a soft, wider
       * band of trodden earth under a harder bed, with the bed's own edge drawn
       * on top so the two meet at a line rather than a blur. The ruts are what
       * give it direction of travel.
       *
       * All four are the same traced path at different widths, so they can never
       * drift apart, and every colour is a token so both themes work.
       */
      const ink = tok('--game-ink', '#131e28');
      // 1. trodden earth, soft-edged, wider than the road
      tracePath();
      ctx.strokeStyle = line;
      ctx.globalAlpha = 0.28;
      ctx.lineWidth = S * 0.150;
      ctx.stroke();
      // 2. the packed shoulder
      tracePath();
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = S * 0.114;
      ctx.stroke();
      // 3. the road bed
      ctx.globalAlpha = 1;
      tracePath();
      ctx.strokeStyle = surface;
      ctx.lineWidth = S * 0.092;
      ctx.stroke();
      // 4. two cart ruts, offset from the centre — direction of travel
      ctx.strokeStyle = ink;
      ctx.globalAlpha = 0.13;
      ctx.lineWidth = Math.max(1.5, S * 0.010);
      ctx.setLineDash([S * 0.045, S * 0.028]);
      for (const off of [-S * 0.021, S * 0.021]) {
        ctx.save();
        ctx.translate(0, off);
        tracePath();
        ctx.stroke();
        ctx.restore();
      }
      ctx.setLineDash([]);
      // loose stones, deterministic so they do not crawl between frames
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.16;
      for (let i = 0; i < 26; i += 1) {
        const p = posAt((i * 0.0384 + 0.012) % 1);
        const j = ((i * 53) % 17) / 17 - 0.5;
        const k = ((i * 31) % 13) / 13 - 0.5;
        ctx.beginPath();
        ctx.arc(X(p.x) + j * S * 0.055, Y(p.y) + k * S * 0.052, S * (0.004 + Math.abs(j) * 0.004), 0, 6.2832);
        ctx.fill();
      }
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
        /*
         * ⚠ IT HAS TO HIDE THEM, AND IT HAS TO LOOK LIKE TREES.
         *
         * The first build drew this in `--game-ink` at alpha 0.97 with six fat
         * crowns per weapon. It hid marchers perfectly and, with three weapons
         * on screen at L85, rendered as three black ink blots swallowing most of
         * the board — the same failure as the barrel that was a `--game-bad`
         * disc beside a `--game-bad` marcher: technically correct, unreadable.
         *
         * Now: a moss canopy, opaque (it must genuinely conceal — the prediction
         * measure depends on it), with a scatter of small crowns and a darker
         * underside so it reads as a treeline rather than a hole in the page.
         * Twice as many crowns at half the radius is what makes a mass look
         * like foliage.
         */
        const moss = tok('--game-ok', '#386544');
        towers.forEach((tw) => {
          if (!(tw.hiddenB > tw.hiddenA)) return;
          // the shadow the wood casts on the road
          strokeStretch(tw.hiddenA, tw.hiddenB, ink, S * 0.128, 0.20, 'round');
          // the canopy body — opaque, so a marcher under it is genuinely gone
          strokeStretch(tw.hiddenA, tw.hiddenB, moss, S * 0.100, 1, 'round');
          const n = 11;
          for (let i = 0; i <= n; i += 1) {
            const p = posAt(tw.hiddenA + (tw.hiddenB - tw.hiddenA) * (i / n));
            const wob = ((i * 37) % 11) / 11 - 0.5;
            const wob2 = ((i * 53) % 7) / 7 - 0.5;
            const r = S * (0.017 + Math.abs(wob) * 0.010);
            const cxp = X(p.x) + wob * S * 0.036;
            const cyp = Y(p.y) + wob2 * S * 0.030;
            // a darker underside first, then the lit crown offset up-left
            ctx.fillStyle = ink;
            ctx.globalAlpha = 0.30;
            ctx.beginPath(); ctx.arc(cxp, cyp + r * 0.30, r, 0, 6.2832); ctx.fill();
            ctx.fillStyle = moss;
            ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.arc(cxp, cyp, r, 0, 6.2832); ctx.fill();
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

      /* ── the weapons ─────────────────────────────────────────────────────
       *
       * ⚠ THREE DIFFERENT SILHOUETTES, NOT THREE TINTS OF ONE.
       *
       * They used to be identical masts in three hues, which put the entire
       * burden of "which weapon is this" on colour — unreadable for a
       * colour-blind player and, more basically, a lie: they now behave
       * completely differently. A turret is a squat body with a long flat
       * barrel; a missile is a raked rail carrying visible warheads; a mortar is
       * a short fat tube pointing nearly straight up on a bipod. Those read at a
       * glance, at 24px, in either theme, and they say what the weapon does
       * before the player has fired it once.
       *
       * Everything is drawn in the weapon's own local frame — translate to the
       * emplacement, then draw upright — so a change to where a weapon stands on
       * the trail cannot skew its art.
       */
      const drawWeapon = (tw, hue, ready, charge) => {
        const tp = posAt(tw.at);
        const cxp = X(tp.x);
        const cyp = Y(tp.y);
        const u = S * 0.042;                        // one "unit" of weapon
        ctx.save();
        ctx.translate(cxp, cyp);

        // a footing on the ground, so the weapon stands rather than floats
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.ellipse(0, u * 0.15, u * 1.35, u * 0.42, 0, 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;

        const body = () => {
          ctx.fillStyle = hue;
          ctx.strokeStyle = ink;
          ctx.lineWidth = Math.max(1.4, u * 0.13);
          ctx.globalAlpha = ready ? 1 : 0.5;
        };
        const outline = () => {
          ctx.globalAlpha = ready ? 0.65 : 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1;
        };

        if (tw.weapon === 'missile') {
          // a raked launch rail on a low carriage, three warheads showing
          body();
          ctx.beginPath();
          ctx.moveTo(-u * 1.1, 0); ctx.lineTo(u * 1.1, 0);
          ctx.lineTo(u * 0.8, -u * 0.62); ctx.lineTo(-u * 0.85, -u * 0.62);
          ctx.closePath(); ctx.fill(); outline();
          ctx.save();
          ctx.translate(0, -u * 0.62);
          ctx.rotate(-0.62);                       // the rake
          ctx.beginPath();
          ctx.roundRect(-u * 1.25, -u * 0.34, u * 2.5, u * 0.68, u * 0.16);
          ctx.fill(); outline();
          // warheads poking out of the front of the rail
          ctx.globalAlpha = ready ? 1 : 0.5;
          for (const k of [-1, 0, 1]) {
            const yy = k * u * 0.22;
            ctx.beginPath();
            ctx.moveTo(u * 1.25, yy - u * 0.12);
            ctx.lineTo(u * 1.85, yy);
            ctx.lineTo(u * 1.25, yy + u * 0.12);
            ctx.closePath();
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.restore();
        } else if (tw.weapon === 'mortar') {
          // a bipod under a short fat tube, aimed steeply up
          ctx.strokeStyle = ink;
          ctx.globalAlpha = ready ? 0.7 : 0.35;
          ctx.lineWidth = Math.max(1.6, u * 0.16);
          ctx.beginPath();
          ctx.moveTo(-u * 0.75, 0); ctx.lineTo(0, -u * 0.95);
          ctx.moveTo(u * 0.75, 0); ctx.lineTo(0, -u * 0.95);
          ctx.stroke();
          ctx.globalAlpha = 1;
          // baseplate
          body();
          ctx.beginPath();
          ctx.roundRect(-u * 1.15, -u * 0.22, u * 2.3, u * 0.44, u * 0.14);
          ctx.fill(); outline();
          // the tube
          ctx.save();
          ctx.rotate(-0.36);
          ctx.globalAlpha = ready ? 1 : 0.5;
          ctx.fillStyle = hue;
          ctx.beginPath();
          ctx.roundRect(-u * 0.34, -u * 2.05, u * 0.68, u * 1.9, u * 0.2);
          ctx.fill(); outline();
          // a fat muzzle ring — this is the wide one
          ctx.globalAlpha = ready ? 0.8 : 0.4;
          ctx.lineWidth = Math.max(1.8, u * 0.2);
          ctx.beginPath();
          ctx.ellipse(0, -u * 2.02, u * 0.44, u * 0.16, 0, 0, 6.2832);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.restore();
        } else {
          // turret: squat body, long flat barrel down the trail
          body();
          ctx.beginPath();
          ctx.moveTo(-u * 1.05, 0); ctx.lineTo(u * 1.05, 0);
          ctx.lineTo(u * 0.72, -u * 0.72); ctx.lineTo(-u * 0.72, -u * 0.72);
          ctx.closePath(); ctx.fill(); outline();
          // the head
          ctx.globalAlpha = ready ? 1 : 0.5;
          ctx.beginPath();
          ctx.arc(0, -u * 0.72, u * 0.62, Math.PI, 0);
          ctx.fill(); outline();
          // the barrel, laid along the trail
          ctx.globalAlpha = ready ? 1 : 0.5;
          ctx.fillStyle = hue;
          ctx.beginPath();
          ctx.roundRect(u * 0.2, -u * 1.12, u * 1.75, u * 0.4, u * 0.14);
          ctx.fill(); outline();
          ctx.globalAlpha = 1;
        }

        /*
         * The reload, drawn ON the weapon as well as on its button. A player
         * watching the trail should not have to look away to find out whether
         * the thing they are about to press will do anything.
         */
        if (charge < 1) {
          ctx.strokeStyle = ink;
          ctx.globalAlpha = 0.22;
          ctx.lineWidth = Math.max(2, u * 0.22);
          ctx.beginPath();
          ctx.arc(0, 0, u * 1.6, -Math.PI / 2, -Math.PI / 2 + 6.2832);
          ctx.stroke();
          ctx.strokeStyle = hue;
          ctx.globalAlpha = 0.95;
          ctx.beginPath();
          ctx.arc(0, 0, u * 1.6, -Math.PI / 2, -Math.PI / 2 + 6.2832 * charge);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      };

      towers.forEach((tw) => {
        const gun = gunsRef.current[tw.weapon];
        const left = gun ? Math.max(0, gun.readyAt - Math.max(0, now)) : 0;
        const charge = gun && gun.coolMs > 0 ? Math.min(1, 1 - left / gun.coolMs) : 1;
        drawWeapon(tw, hueOf(tw), charge >= 1, charge);
      });

      /* ── shells in the air ───────────────────────────────────────────────
       * The reticle is the honest part: it closes on the impact point over the
       * flight, so a player can SEE that a flying weapon commits early and can
       * learn the lead rather than guessing at it. */
      for (const sh of shotsRef.current) {
        if (now < 0) break;
        const gun = gunsRef.current[sh.weapon];
        if (!gun) continue;
        const from = posAt(sh.at);
        const to = posAt(sh.at);
        const k = Math.min(1, Math.max(0, (now - sh.firedAt) / Math.max(1, gun.flightMs)));
        const hue = hueOf(gun.tower);
        // the shell arcs up out of the emplacement and back down onto the trail
        const lift = S * (gun.blast > 0 ? 0.30 : 0.20) * Math.sin(Math.PI * k);
        const sx = X(from.x) + (X(to.x) - X(from.x)) * k;
        const sy = Y(from.y) + (Y(to.y) - Y(from.y)) * k - lift;
        ctx.fillStyle = hue;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.arc(sx, sy, S * (gun.blast > 0 ? 0.017 : 0.013), 0, 6.2832);
        ctx.fill();
        // closing reticle over the ground it will land on
        ctx.strokeStyle = hue;
        ctx.globalAlpha = 0.30 + 0.5 * k;
        ctx.lineWidth = Math.max(1.5, S * 0.008);
        const rr = S * (0.11 - 0.062 * k);
        ctx.beginPath();
        ctx.arc(X(to.x), Y(to.y), rr, 0, 6.2832);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

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
          const inReach = mine.some((tw) => reaches(tw, f));
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
  }, [step, waveNo, cfg, mode, totalWaves, nowMs, landShot]);

  /* ── the weapon bar ───────────────────────────────────────────────────── */
  const WEAPON_KEYS = ['a', 's', 'd'];
  const btnRefs = useRef({});

  /*
   * ⚠ THE RELOAD BAR IS WRITTEN STRAIGHT TO THE DOM, NOT HELD IN STATE.
   * Three cooldowns ticking at 60fps through React would re-render the whole
   * board every frame — the exact thing the header of this file forbids, and in
   * a game measuring milliseconds a dropped frame is a measurement error.
   */
  useEffect(() => {
    if (step !== 'run') return undefined;
    let id = 0;
    const tick = () => {
      const now = nowMs();
      for (const kind of Object.keys(btnRefs.current)) {
        const node = btnRefs.current[kind];
        const gun = gunsRef.current[kind];
        if (!node || !gun) continue;
        const left = Math.max(0, gun.readyAt - now);
        const charge = gun.coolMs > 0 ? Math.min(1, 1 - left / gun.coolMs) : 1;
        if (node.fill) node.fill.style.width = `${charge * 100}%`;
        if (node.el) node.el.classList.toggle('ic-weapon--cooling', charge < 1);
        if (node.st) {
          const want = left > 0
            ? t.wReloading
            : (gun.flightMs > 0 ? t.wFlies((gun.flightMs / 1000).toFixed(1)) : t.wReady);
          if (node.st.textContent !== want) node.st.textContent = want;
        }
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [step, nowMs, t]);

  useEffect(() => {
    if (step !== 'run') return undefined;
    const onKey = (ev) => {
      if (ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const i = WEAPON_KEYS.indexOf(ev.key.toLowerCase());
      const kind = i >= 0 ? guns[i] : null;
      if (!kind) return;
      ev.preventDefault();
      fire(kind);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, guns, fire]);

  const weaponLabel = (kind) => (kind === 'missile' ? t.wMissile : kind === 'mortar' ? t.wMortar : t.wTurret);

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
            {cfg.nTowers >= 2 && <li>{t.briefMissile}</li>}
            {cfg.nTowers >= 3 && <li>{t.briefMortar}</li>}
            {cfg.hiddenShare > 0 && <li>{t.briefCanopy}</li>}
            {cfg.barrels > 0 && <li>{t.briefBarrel}</li>}
          </ul>
          <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); startWave(); }}>
            {t.begin}
          </button>
        </div>
      )}

      {step === 'run' && (
        <>
          <div
            className="ic-field"
            ref={wrapRef}
            data-coach="field"
            role="img"
            aria-label={t.tapHint}
          >
            <canvas ref={canvasRef} className="ic-canvas" />
          </div>
          {/* ⚠ Real <button>s, not canvas hit areas. This is now the ONLY input
              the game has, so it has to be reachable by a keyboard and legible
              to a screen reader — the Mirror World lockout was an accessible
              control that rendered, took taps and could not reach the win
              state. Each one also carries its shortcut. */}
          <div className="ic-weapons" data-coach="weapons">
            {guns.map((kind, i) => (
              <button
                key={kind}
                type="button"
                className={`ic-weapon ic-weapon--${kind}`}
                data-coach={`weapon-${kind}`}
                ref={(el) => {
                  if (!el) { delete btnRefs.current[kind]; return; }
                  btnRefs.current[kind] = {
                    el,
                    fill: el.querySelector('.ic-weapon-fill'),
                    st: el.querySelector('.ic-weapon-state'),
                  };
                }}
                onPointerDown={(ev) => { ev.preventDefault(); fire(kind); }}
                aria-label={`${weaponLabel(kind)} — ${WEAPON_KEYS[i]}`}
              >
                <span className="ic-weapon-key" aria-hidden="true">{WEAPON_KEYS[i]}</span>
                <span className="ic-weapon-name">{weaponLabel(kind)}</span>
                <span className="ic-weapon-state">{t.wReady}</span>
                <span className="ic-weapon-cool" aria-hidden="true">
                  <span className="ic-weapon-fill" />
                </span>
              </button>
            ))}
          </div>
        </>
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
