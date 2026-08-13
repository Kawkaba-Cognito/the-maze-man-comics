import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import {
  TrainingPlayHeader, TrainingPauseModal, TrainingQuitModal,
} from '../../../../shared/TrainingChrome';
import { createProfileStore } from '../../../../../../lib/storage';
import {
  PROFILES, TRIALS_PER_LEVEL,
  buildTrial, levelCfg, levelPassed, pathPoint, positionAt, scoreTap, survivalCfg,
} from './data';
import './intercept.css';

/*
 * Intercept — the speed domain's timing game. Replaces Trail Making.
 *
 * A shape crosses the screen, vanishes behind cover, and you tap the instant it
 * would reach the line. See data.js for why the motion profile is the lever
 * that gives this a hundred levels rather than one repeated trick.
 *
 * ⚠ TIMING IS TAKEN FROM THE EVENT, NOT FROM THE FRAME. The tap is stamped from
 * the pointer event's own timestamp where the browser provides one, because a
 * value read inside a rAF callback is quantised to the frame and would put a
 * floor of ~8-16ms of pure noise under a window that goes down to 62ms.
 */

const UI = {
  en: {
    ...STR_COMMON.en,
    title: 'Intercept',
    tag: 'predictive timing',
    hintFree: 'Endless — it speeds up and hides more of the run',
    hintLevels: '3 difficulties · 100 levels each',
    hintPass: 'Same runs for everyone · pass the device',
    ready: 'Tap the moment it reaches the line',
    early: 'early',
    late: 'late',
    hit: 'Caught it',
    miss: 'Missed',
    tooSlow: 'No tap',
    trialOf: (i, n) => `Run ${i} of ${n}`,
    caught: (c, t) => `${c} of ${t} caught`,
    avgErr: 'Average miss',
    bestErr: 'Closest',
    biasEarly: 'you tap early',
    biasLate: 'you tap late',
    biasNone: 'no consistent bias',
    // Not "you failed" — 12.2. It says what was missing, in the game's terms.
    needHits: `you need 4 of ${TRIALS_PER_LEVEL}`,
    runOver: 'Run ended',
    bestStage: (n) => `You reached round ${n}`,
    meaning: 'The number is how far off your prediction was, in milliseconds.',
    go: 'GO',
    nextRun: 'Next run',
    personalBest: (n) => `Best ever: round ${n}`,
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'الاعتراض',
    tag: 'توقيت تنبّؤي',
    hintFree: 'بلا نهاية — يتسارع ويخفي المزيد من المسار',
    hintLevels: '٣ صعوبات · ١٠٠ مستوى لكل',
    hintPass: 'نفس الجولات للجميع · مرّر الجهاز',
    ready: 'اضغط لحظة وصوله إلى الخط',
    early: 'مبكّر',
    late: 'متأخّر',
    hit: 'أمسكته',
    miss: 'أخطأت',
    tooSlow: 'لم تضغط',
    trialOf: (i, n) => `جولة ${i} من ${n}`,
    caught: (c, t) => `أمسكت ${c} من ${t}`,
    avgErr: 'متوسط الخطأ',
    bestErr: 'الأقرب',
    biasEarly: 'تضغط مبكّراً',
    biasLate: 'تضغط متأخّراً',
    biasNone: 'لا ميل ثابت',
    needHits: `تحتاج ٤ من ${TRIALS_PER_LEVEL}`,
    runOver: 'انتهت المحاولة',
    bestStage: (n) => `وصلت إلى الجولة ${n}`,
    meaning: 'الرقم هو مقدار انحراف توقّعك بالمللي ثانية.',
    go: 'انطلق',
    nextRun: 'الجولة التالية',
    personalBest: (n) => `أفضل نتيجة: الجولة ${n}`,
  },
};

/*
 * ⚠ CANVAS COLOUR COMES FROM CSS, READ AT RUN TIME.
 *
 * A canvas cannot use `var(--game-accent)`, and the tempting shortcut — paste
 * the hex into the draw call, or import it from styles/tokens.js — produces a
 * game that is stuck in one theme forever. That is not hypothetical: a frozen
 * JS colour in a loading state is what made every game launch flash near-white
 * in dark mode.
 *
 * So the six values are read off the live element with getComputedStyle, which
 * means they follow the theme like everything else. They are read once per
 * trial rather than per frame: a theme switch mid-round therefore lands on the
 * next run a few seconds later, which is the right trade against doing style
 * resolution 60 times a second.
 */
function readPalette(node) {
  const cs = getComputedStyle(node);
  const pick = (name, fallback) => (cs.getPropertyValue(name) || '').trim() || fallback;
  return {
    rail: pick('--game-muted-edge', '#3c4249'),
    cover: pick('--game-muted', '#545c66'),
    goal: pick('--game-accent', '#d4952f'),
    mover: pick('--game-accent', '#d4952f'),
    spent: pick('--game-muted-edge', '#3c4249'),
  };
}

/* Survival's personal best. ModeShell owns the LEVEL progress under
   mm_spd_intercept; this is the one number it has no slot for, so it lives
   beside it under the same prefix and goes through lib/storage like everything
   else. */
const PROFILE = createProfileStore('mm_spd_intercept_profile_v1', { bestStage: 0 });

const SHAPE_PATH = {
  steady: (c, s) => { c.beginPath(); c.arc(0, 0, s, 0, Math.PI * 2); },
  accel: (c, s) => {
    c.beginPath();
    c.moveTo(s * 1.15, 0);
    c.lineTo(-s * 0.8, s * 0.9);
    c.lineTo(-s * 0.35, 0);
    c.lineTo(-s * 0.8, -s * 0.9);
    c.closePath();
  },
  decel: (c, s) => {
    c.beginPath();
    c.moveTo(0, -s * 1.1);
    c.lineTo(s * 1.1, 0);
    c.lineTo(0, s * 1.1);
    c.lineTo(-s * 1.1, 0);
    c.closePath();
  },
};

/*
 * Paint the whole scene at time `ms`.
 *
 * Module-level, and taking the clock as an argument, because it is drawn from
 * TWO places: the running frame, and the countdown, which paints the same scene
 * frozen at ms=0. That matters — the countdown used to leave the stage empty,
 * so the route, the cover and the goal line all appeared for the first time on
 * the same frame the shape started moving, and the first run of every level was
 * spent finding out where the line was. Now GO lands on a board you have
 * already read (checklist 8.3), which is the only reason a countdown helps.
 */
function paintScene(ctx, W, H, pal, trial, ms, claimed) {
  const pad = 26;
  ctx.clearRect(0, 0, W, H);

  /* Normalised path point → canvas, with a perpendicular offset so two movers
     sharing a path run parallel instead of on top of each other. */
  const toXY = (s, offset) => {
    const [nx, ny] = pathPoint(trial.path, s);
    let px = pad + nx * (W - pad * 2);
    let py = pad + ny * (H - pad * 2);
    if (offset) {
      const [ax, ay] = pathPoint(trial.path, Math.max(0, s - 0.02));
      const [bx, by] = pathPoint(trial.path, Math.min(1, s + 0.02));
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      px += (-dy / len) * 30 * offset;
      py += (dx / len) * 30 * offset;
    }
    return [px, py];
  };
  const stroke = (from, to, width, colour, offset) => {
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const [px, py] = toXY(from + ((to - from) * i) / steps, offset);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };

  /* The whole route, then the hidden stretch drawn over it as a tunnel.
     One cover per mover at its OWN hideAt, so each shape is visible for the
     same LENGTH OF TIME whatever its profile — a shared cover would give the
     accelerating shape a much shorter look than the slowing one, which is
     difficulty by accident rather than by design. */
  for (const m of trial.movers) stroke(0, 1, 2, pal.rail, m.offset);
  for (const m of trial.movers) stroke(m.hideAt, 1, 40, pal.cover, m.offset);

  // the goal, at the end of the route
  for (const m of trial.movers) {
    const [gx, gy] = toXY(1, m.offset);
    const [bx, by] = toXY(0.97, m.offset);
    const dx = gx - bx;
    const dy = gy - by;
    const len = Math.hypot(dx, dy) || 1;
    ctx.strokeStyle = pal.goal;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(gx - (-dy / len) * 26, gy - (dx / len) * 26);
    ctx.lineTo(gx + (-dy / len) * 26, gy + (dx / len) * 26);
    ctx.stroke();
  }

  for (const m of trial.movers) {
    const s = positionAt(m, ms);
    const isClaimed = claimed?.has(m.lane);
    if (s >= m.hideAt && !isClaimed) continue;      // inside its tunnel
    const [px, py] = toXY(s, m.offset);
    const [ax, ay] = toXY(Math.max(0, s - 0.02), m.offset);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(py - ay, px - ax));       // nose points along travel
    ctx.fillStyle = isClaimed ? pal.spent : pal.mover;
    (SHAPE_PATH[m.profile] || SHAPE_PATH.steady)(ctx, 13);
    ctx.fill();
    ctx.restore();
  }
}

/** DPR-correct canvas sizing, shared by the countdown and the run. */
function sizeCanvas(canvas, wrap, ctx) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [W, H];
}

/* ── The engine: watch → tap → feedback, TRIALS_PER_LEVEL times ───────────── */
function InterceptEngine({
  mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardFreeRun,
}) {
  const t = isAr ? UI.ar : UI.en;

  const [stage, setStage] = useState(0);
  const [trialIdx, setTrialIdx] = useState(0);
  /* 'count' first, so the clock never starts while the player is still reading
     the screen — checklist 8.1/8.2. The countdown runs once per SET, not once
     per trial: a 3-2-1 before every six-second run would be most of the game. */
  const [step, setStep] = useState('count');        // count | run | feedback | over
  const [count, setCount] = useState(3);
  const [feedback, setFeedback] = useState(null);
  const [paused, setPaused] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [lives, setLives] = useState(3);
  const [best, setBest] = useState(() => PROFILE.load().bestStage || 0);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const trialLogRef = useRef(null);
  const stateRef = useRef({ tapped: false });
  const pausedRef = useRef(false);
  /* The quit dialog freezes the run too. It is a modal over a live clock: if it
     only stopped taps, a player who opened it and changed their mind would come
     back to a shape that had already crossed the line. */
  useEffect(() => { pausedRef.current = paused || quitOpen; }, [paused, quitOpen]);

  const cfg = useMemo(
    () => (mode === 'free' ? survivalCfg(stage) : levelCfg(diff, level)),
    [mode, stage, diff, level],
  );

  const rng = useMemo(
    () => makeRng(`${seed}-${mode}-${diff}-${level}-${stage}-${trialIdx}-${attempt}`),
    [seed, mode, diff, level, stage, trialIdx, attempt],
  );

  const trial = useMemo(() => buildTrial(cfg, rng), [cfg, rng]);

  useEffect(() => {
    trialLogRef.current = createTrialLog({ game: 'intercept', mode, meta: { diff, level } });
    return () => trialLogRef.current?.flush?.();
  }, [mode, diff, level]);

  /* ── countdown ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'count') return undefined;
    if (count <= 0) { setStep('run'); return undefined; }
    const id = window.setTimeout(() => {
      playSfx?.('click');
      setCount((c) => c - 1);
    }, 620);
    return () => window.clearTimeout(id);
  }, [step, count, playSfx]);

  /* The board behind the countdown, frozen at t=0 — route, cover and goal line
     all readable before anything moves. */
  useEffect(() => {
    if (step !== 'count') return undefined;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');
    const pal = readPalette(wrap);
    const draw = () => {
      const [W, H] = sizeCanvas(canvas, wrap, ctx);
      paintScene(ctx, W, H, pal, trial, 0, null);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [step, trial]);

  /* ── the run ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'run') return undefined;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');

    let raf = 0;
    let W = 0;
    let H = 0;
    const st = { tapped: false, taps: [], done: false };
    stateRef.current = st;

    const resize = () => { [W, H] = sizeCanvas(canvas, wrap, ctx); };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const pal = readPalette(wrap);
    const t0 = performance.now();
    let pauseAt = 0;
    let lost = 0;

    const finish = () => {
      if (st.done) return;
      st.done = true;
      const scored = trial.movers.map((m) => {
        const tap = st.taps.find((x) => x.lane === m.lane);
        if (!tap) return { err: null, hit: false, points: 0, profile: m.profile };
        const s = scoreTap(m, tap.ms, trial.tol);
        return { ...s, profile: m.profile };
      });
      const hit = scored.every((s) => s.hit);
      scored.forEach((s, i) => {
        trialLogRef.current?.trial({
          ok: s.hit,
          rt: s.err == null ? null : Math.round(Math.abs(s.err)),
          err: s.err == null ? null : Math.round(s.err),
          profile: s.profile,
          tol: trial.tol,
          lane: i,
        });
      });
      playSfx?.(hit ? 'correct' : 'wrong');
      setFeedback({ scored, hit });
      setStep('feedback');
    };

    const onTap = (e) => {
      if (pausedRef.current || st.done) return;
      const now = (e && typeof e.timeStamp === 'number' && e.timeStamp > 0)
        ? e.timeStamp
        : performance.now();
      const ms = now - t0 - lost;
      // Each mover can be claimed once, by the tap nearest its arrival.
      const open = trial.movers.filter((m) => !st.taps.some((x) => x.lane === m.lane));
      if (!open.length) return;
      let best = open[0];
      for (const m of open) {
        if (Math.abs(ms - m.arriveAt) < Math.abs(ms - best.arriveAt)) best = m;
      }
      st.taps.push({ lane: best.lane, ms });
      if (st.taps.length >= trial.movers.length) finish();
    };
    canvas.addEventListener('pointerdown', onTap);

    const frame = (now) => {
      if (pausedRef.current) {
        if (!pauseAt) pauseAt = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      if (pauseAt) { lost += now - pauseAt; pauseAt = 0; }
      const ms = now - t0 - lost;

      paintScene(ctx, W, H, pal, trial, ms, new Set(st.taps.map((tp) => tp.lane)));

      // Everything is answered, or the last mover is well past the line.
      const latest = Math.max(...trial.movers.map((m) => m.arriveAt));
      if (!st.done && ms > latest + trial.tol + 260) finish();
      if (!st.done) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onTap);
    };
  }, [step, trial, playSfx]);

  /* ── advancing ───────────────────────────────────────────────────────── */

  /*
   * The LEVELS end screen is ModeShell's, not this game's.
   *
   * It already renders "Level cleared ✓" / "Not quite" with Next level, Replay
   * or Retry, and Levels — the wording from STR_COMMON and the same three
   * actions as every other game. Rendering a local one would fork the chrome
   * for one game and, worse, would never be seen: calling onResult moves
   * ModeShell to its result phase and unmounts this engine. So the metrics
   * travel as `summary`, one line, which is what that screen takes.
   *
   * SURVIVAL keeps a local screen, exactly as keep-track does, because
   * ModeShell's result screen is built for a level — its actions are Next level
   * and Levels, and neither means anything after an endless run. The local one
   * offers Play again and Menu, and shows the round reached against the
   * personal best.
   */
  const summarise = useCallback((rows) => {
    const hitCount = rows.filter((r) => r.hit).length;
    const errs = rows.flatMap((r) => r.scored)
      .filter((s) => s.err != null).map((s) => s.err);
    if (!errs.length) return t.caught(hitCount, rows.length);
    const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
    /* Signed mean, not absolute: which SIDE you err on is the coachable thing
       here. A consistent early tap is a fixable habit; a scattered one is not
       the same problem and should not read as one. */
    const lean = Math.abs(mean) < 25 ? t.biasNone : (mean < 0 ? t.biasEarly : t.biasLate);
    const closest = Math.round(Math.min(...errs.map((e) => Math.abs(e))));
    return `${t.caught(hitCount, rows.length)} · ${t.avgErr} ${Math.abs(Math.round(mean))}ms`
      + ` · ${t.bestErr} ${closest}ms · ${lean}`;
  }, [t]);

  const advance = useCallback(() => {
    playSfx?.('click');
    const row = feedback;
    const nextResults = [...results, row];
    setFeedback(null);

    if (mode === 'free') {
      if (!row.hit) {
        const left = lives - 1;
        setLives(left);
        if (left <= 0) {
          const reached = stage + 1;
          awardFreeRun?.('intercept', reached);
          if (reached > best) {
            setBest(reached);
            PROFILE.save({ ...PROFILE.load(), bestStage: reached });
          }
          setResults(nextResults);
          setStep('over');
          return;
        }
      } else {
        setStage((s) => s + 1);
      }
      setResults(nextResults);
      setTrialIdx((i) => i + 1);
      setStep('run');
      return;
    }

    if (nextResults.length >= TRIALS_PER_LEVEL) {
      const hits = nextResults.filter((r) => r.hit).length;
      const won = levelPassed(hits);
      onResult?.({
        won,
        score: hits,
        // A fail screen has to say WHY, not only that you did — 12.1.
        summary: won ? summarise(nextResults) : `${summarise(nextResults)} — ${t.needHits}`,
      });
      return;
    }
    setResults(nextResults);
    setTrialIdx((i) => i + 1);
    setStep('run');
  }, [feedback, results, mode, lives, stage, best, awardFreeRun, onResult, playSfx, summarise, t]);

  /* The header carries mode, progress and lives — the same three facts every
     other game puts there, through the shared TrainingPlayHeader rather than a
     hand-rolled bar, so back / title / pause sit where players expect them. */
  const headerTitle = mode === 'free'
    ? `${t.freeHeader} · ${stage + 1}`
    : mode === 'passplay'
      ? `${t.challengeHeader} · ${Math.min(results.length + 1, TRIALS_PER_LEVEL)}/${TRIALS_PER_LEVEL}`
      : `${t.levelMode} · L${level}`;
  const headerSub = mode === 'free'
    ? `${t.lives}: ${'●'.repeat(Math.max(0, lives))}${'○'.repeat(Math.max(0, 3 - lives))}`
    : t.trialOf(Math.min(results.length + 1, TRIALS_PER_LEVEL), TRIALS_PER_LEVEL);

  return (
    <div className="ct-training-root ic-root" dir={isAr ? 'rtl' : 'ltr'}>
      <TrainingPlayHeader
        isAr={isAr}
        title={headerTitle}
        subtitle={headerSub}
        playSfx={playSfx}
        onMenu={() => setQuitOpen(true)}
        onPause={step === 'run' ? () => setPaused(true) : undefined}
        pauseAriaLabel={t.paused}
        menuAriaLabel={t.menu}
      />

      <div className="ic-stage-wrap">
        {(step === 'count' || step === 'run') && (
          <div className="ic-stage" ref={wrapRef}>
            <canvas ref={canvasRef} className="ic-canvas" />
            {/* The cue is up before the first response is possible — 8.3. */}
            <p className="ic-cue">{t.ready}</p>
            {step === 'count' && (
              <div className="ic-count" aria-live="assertive">{count > 0 ? count : t.go}</div>
            )}
          </div>
        )}

        {step === 'feedback' && feedback && (
          <div className="ic-panel">
            <h3 className={feedback.hit ? 'ic-ok' : 'ic-no'}>
              {feedback.hit ? t.hit : (feedback.scored.some((s) => s.err == null) ? t.tooSlow : t.miss)}
            </h3>
            {feedback.scored.map((s, i) => (
              <p className="ic-err" key={`${s.profile}-${i}`}>
                <span className="ic-profile">{PROFILES[s.profile]?.name[isAr ? 'ar' : 'en']}</span>
                {s.err == null
                  ? ` — ${t.tooSlow}`
                  : ` — ${Math.abs(Math.round(s.err))}ms ${s.err < 0 ? t.early : t.late}`}
              </p>
            ))}
            <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={advance}>
              {t.nextRun}
            </button>
          </div>
        )}

        {step === 'over' && (
          <div className="ic-panel">
            <h3>{t.runOver}</h3>
            <p className="ic-sum">{t.bestStage(stage + 1)}</p>
            <p className="ic-sum">{t.personalBest(Math.max(best, stage + 1))}</p>
            <p className="ic-sum">{summarise(results)}</p>
            <p className="ic-meaning">{t.meaning}</p>
            <div className="ic-actions">
              <button
                type="button"
                className="ct-training-btn ct-training-btn--pri"
                onClick={() => {
                  playSfx?.('click');
                  setStage(0); setLives(3); setResults([]); setFeedback(null);
                  setTrialIdx((i) => i + 1);
                  setCount(3); setStep('count');
                }}
              >
                {t.freePlayAgain}
              </button>
              <button
                type="button"
                className="ct-training-btn ct-training-btn--ghost"
                onClick={() => { playSfx?.('click'); onExit?.(); }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        )}
      </div>

      <TrainingPauseModal
        open={paused}
        showRestart={false}
        labels={{ paused: t.paused, resume: t.resume, quitMenu: t.quitMenu }}
        onResume={() => { setPaused(false); playSfx?.('click'); }}
        onQuitMenu={() => { playSfx?.('click'); onExit?.(); }}
      />
      <TrainingQuitModal
        open={quitOpen}
        labels={{ quitQ: t.quitQ, quitLose: t.quitLose, yesQuit: t.yesQuit, keep: t.keep }}
        onConfirmQuit={() => { playSfx?.('click'); onExit?.(); }}
        onKeepPlaying={() => { playSfx?.('click'); setQuitOpen(false); }}
      />
    </div>
  );
}

export default function InterceptGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_spd_intercept"
      gameId="intercept"
      scienceId="intercept"
      title={{ en: UI.en.title, ar: UI.ar.title }}
      hints={{
        free: { en: UI.en.hintFree, ar: UI.ar.hintFree },
        levels: { en: UI.en.hintLevels, ar: UI.ar.hintLevels },
        pass: { en: UI.en.hintPass, ar: UI.ar.hintPass },
      }}
      diffLabels={{
        easy: { en: 'Easy', ar: 'سهل' },
        med: { en: 'Medium', ar: 'متوسط' },
        hard: { en: 'Hard', ar: 'صعب' },
      }}
      levelCount={100}
      pass={{
        trials: TRIALS_PER_LEVEL,
        scoreLabel: { en: 'caught', ar: 'أمسك' },
        lowerBetter: false,
        diff: 'med',
      }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <InterceptEngine
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}

export { UI as INTERCEPT_UI };
