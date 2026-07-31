import React, { useEffect, useRef, useState } from 'react';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { paintSky } from '../../../../shared/board2d';
import { GAME_COLORS, GAME_INK, GAME_STIMULUS, shadeOf } from '../../../../shared/gamePalette';
import { makeRng } from '../../../../shared/rng';
import { survivalTier } from '../../../../shared/survival';
import { clamp } from '../../../../../../lib/math';
import { genGate, levelCfg } from './index';
import '../../../../shared/c3dProto.css';

/*
 * MathGatesBoard2D — the lane runner.
 *
 * Replaces MathGates3DProto.jsx. Every rule below is carried over unchanged:
 * the same genGate() with the same skill ramp (gatesPlayed/36 → survivalTier),
 * the same constant 3.8s descent with no clock and no speed-up, the same
 * lives/gap config from levelCfg, and the same "the lane you occupy on ARRIVAL
 * is your answer". Only the drawing changed.
 *
 * The 3D version also loaded a ~1MB rigged GLB robot for the runner. That is
 * gone: it was a lane marker that had to be legible at a glance while numbers
 * fell toward it, and a shape reads faster than a character does.
 */

const UI = {
  en: {
    hint: 'Tap a lane (or ← →) to steer. Your lane when the gate arrives is your answer.',
    over: 'Run over',
    overSub: (n) => `${n} gates passed`,
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    passed: 'Gates',
  },
  ar: {
    hint: 'المس حارة (أو ← →) للتوجيه. حارتك عند وصول البوابة هي إجابتك.',
    over: 'انتهت المحاولة',
    overSub: (n) => `${n} بوابات`,
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    passed: 'بوابات',
  },
};

const LANES = 3;
const DESCEND_SEC = 3.8;

/* Lane tint. Colour here is a positional cue, not the answer — the numbers are
   the task — so these come from the stimulus set purely to keep the three lanes
   telling themselves apart at speed. */
const LANE_COLORS = [GAME_STIMULUS[0], GAME_STIMULUS[1], GAME_STIMULUS[3]];

export default function MathGatesBoard2D({
  isAr, playSfx, onBack, awardFreeRun,
  mode = 'free', diff = 'med', level = 1, seed, attempt, onResult,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const cfg = mode === 'levels'
    ? levelCfg(diff, level)
    : mode === 'passplay'
      ? levelCfg(diff || 'med', 1)
      : levelCfg('easy', 1);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  const resultRef = useRef(onResult);
  const awardRef = useRef(awardFreeRun);
  playSfxRef.current = playSfx;
  resultRef.current = onResult;
  awardRef.current = awardFreeRun;

  const [phase, setPhase] = useState('boot');
  const [passed, setPassed] = useState(0);
  const [lives, setLives] = useState(cfg.lives);
  const [combo, setCombo] = useState(0);
  const [eqText, setEqText] = useState('');
  const [banner, setBanner] = useState('go');

  /*
   * The live run, in a ref rather than in the draw effect's closure.
   *
   * This is load-bearing. The draw effect depends on [isAr], but the run used to
   * be started from a separate effect with [] deps. So whenever the draw effect
   * re-ran — StrictMode's double-invoke in dev, or `isAr` resolving a tick after
   * mount — it rebuilt a fresh closure with `finished = true`, and the one-shot
   * start effect never fired again to clear it. The result was a game that drew
   * its lanes and runner and reported phase 'run' (that state survived from the
   * dead closure) while silently never spawning a gate, because every tick fell
   * straight through `if (!finished)`.
   *
   * Keeping it here means a re-run rebuilds only the drawing and input; the run
   * itself carries on untouched.
   */
  const runRef = useRef(null);
  if (runRef.current === null) {
    runRef.current = {
      started: false,
      finished: true,
      lane: 1,
      runnerX: 0.5,
      gate: null,
      gapTimer: cfg.gap,
      gatesPlayed: 0,
      passedN: 0,
      livesN: cfg.lives,
      comboN: 0,
      flash: null,
    };
  }

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');

    let dpr = 1;
    let W = 1;
    let H = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = wrap.clientWidth || 1;
      H = wrap.clientHeight || 1;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };

    const rng = makeRng((seed ?? (Date.now() ^ Math.floor(Math.random() * 0x7fffffff))) >>> 0);
    const gateBudget = mode === 'passplay' ? (attempt?.trials || 12) : Infinity;

    const s = runRef.current;   // the live run — survives effect re-runs

    const laneCentre = (i) => (i + 0.5) / LANES;

    const spawnGate = () => {
      const f = clamp(s.gatesPlayed / 36, 0, 1);
      const gateDiff = mode === 'free' ? survivalTier(f) : (diff || 'med');
      const eq = genGate(gateDiff, mode === 'free' ? f : (cfg.f || 0), rng);
      s.gate = { eq, y: 0 };
      setEqText(`${eq.text} = ?`);
    };

    const finishRun = (won = false) => {
      if (s.finished) return;
      s.finished = true;
      if (mode === 'levels') {
        resultRef.current?.({ won, score: s.passedN, summary: `${s.passedN}/${cfg.target}` });
        return;
      }
      if (mode === 'passplay') {
        resultRef.current?.({ score: s.passedN });
        return;
      }
      awardRef.current?.('mathGates', s.passedN);
      setPhase('over');
      setBanner('over');
    };

    const resolveGate = () => {
      if (s.finished || !s.gate) return;
      const eq = s.gate.eq;
      s.gatesPlayed += 1;
      const ok = s.lane === eq.correctLane;
      if (ok) {
        s.passedN += 1;
        s.comboN += 1;
        setPassed(s.passedN);
        setCombo(s.comboN);
        playSfxRef.current?.('collect');
        s.flash = { lane: s.lane, kind: 'ok', t: 0.7 };
      } else {
        s.comboN = 0;
        setCombo(0);
        playSfxRef.current?.('error');
        // Show BOTH: the lane they took and the one that was right. Showing only
        // the error teaches nothing on a task the player is meant to get faster at.
        s.flash = { lane: s.lane, kind: 'bad', t: 0.8, rightLane: eq.correctLane };
        if (mode !== 'passplay') {
          s.livesN -= 1;
          setLives(s.livesN);
          if (s.livesN <= 0) { finishRun(false); return; }
        }
      }
      if (mode === 'levels' && s.passedN >= cfg.target) { finishRun(true); return; }
      if (mode === 'passplay' && s.gatesPlayed >= gateBudget) { finishRun(); return; }
      s.gate = null;
      s.gapTimer = cfg.gap;
    };

    const setLane = (ln) => {
      if (s.finished) return;
      const next = Math.max(0, Math.min(LANES - 1, ln));
      if (next !== s.lane) {
        s.lane = next;
        playSfxRef.current?.('click');
      }
    };

    const onDown = (e) => {
      if (s.finished) return;
      const rect = canvas.getBoundingClientRect();
      const third = (e.clientX - rect.left) / rect.width;
      setLane(third < 1 / 3 ? 0 : third < 2 / 3 ? 1 : 2);
    };
    canvas.addEventListener('pointerdown', onDown);

    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || k === 'a') { e.preventDefault(); setLane(s.lane + (isAr ? 1 : -1)); }
      else if (e.key === 'ArrowRight' || k === 'd') { e.preventDefault(); setLane(s.lane + (isAr ? -1 : 1)); }
      else if (e.key === '1') { e.preventDefault(); setLane(isAr ? 2 : 0); }
      else if (e.key === '2') { e.preventDefault(); setLane(1); }
      else if (e.key === '3') { e.preventDefault(); setLane(isAr ? 0 : 2); }
    };
    window.addEventListener('keydown', onKey);

    /* Geometry, as fractions of the board: the gate falls from the top of the
     * run area to the runner line, and that travel takes DESCEND_SEC. */
    const RUN_TOP = 0.06;
    const RUNNER_LINE = 0.86;

    const frame = (dt) => {
      if (!s.finished) {
        if (s.gate) {
          s.gate.y += dt / DESCEND_SEC;
          if (s.gate.y >= 1) { s.gate.y = 1; resolveGate(); }
        } else {
          s.gapTimer -= dt * 1000;
          if (s.gapTimer <= 0) spawnGate();
        }
      }
      s.runnerX += (laneCentre(s.lane) - s.runnerX) * Math.min(1, dt * 12);
      if (s.flash) { s.flash.t -= dt; if (s.flash.t <= 0) s.flash = null; }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSky(ctx, W, H);

      const laneW = W / LANES;
      const runnerY = H * RUNNER_LINE;

      // Lane strips — the occupied one is brighter, so "which lane am I in"
      // never depends on finding a small runner.
      for (let i = 0; i < LANES; i++) {
        ctx.save();
        ctx.globalAlpha = i === s.lane ? 0.26 : 0.13;
        ctx.fillStyle = LANE_COLORS[i];
        ctx.fillRect(i * laneW + 4, H * RUN_TOP, laneW - 8, runnerY - H * RUN_TOP + 10);
        ctx.restore();
      }

      // The runner: a wedge pointing at the incoming gate.
      const rx = s.runnerX * W;
      const rr = Math.min(laneW * 0.22, 34);
      ctx.save();
      ctx.fillStyle = shadeOf(GAME_COLORS.accent.fill);
      ctx.beginPath();
      ctx.moveTo(rx, runnerY - rr);
      ctx.lineTo(rx + rr * 0.9, runnerY + rr * 0.7);
      ctx.lineTo(rx - rr * 0.9, runnerY + rr * 0.7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = GAME_COLORS.accent.fill;
      ctx.beginPath();
      ctx.moveTo(rx, runnerY - rr * 0.86);
      ctx.lineTo(rx + rr * 0.78, runnerY + rr * 0.6);
      ctx.lineTo(rx - rr * 0.78, runnerY + rr * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = GAME_INK;
      ctx.stroke();
      ctx.restore();

      // The gate: three answers, one per lane.
      if (s.gate) {
        const gy = H * RUN_TOP + (runnerY - H * RUN_TOP) * s.gate.y;
        const tileR = Math.min(laneW * 0.36, 62);
        s.gate.eq.options.forEach((val, i) => {
          const cx = laneCentre(i) * W;
          let fill = LANE_COLORS[i];
          if (s.flash && s.flash.t > 0) {
            if (s.flash.kind === 'ok' && i === s.flash.lane) fill = GAME_COLORS.ok.fill;
            else if (s.flash.kind === 'bad' && i === s.flash.rightLane) fill = GAME_COLORS.ok.fill;
            else if (s.flash.kind === 'bad' && i === s.flash.lane) fill = GAME_COLORS.bad.fill;
          }
          ctx.save();
          ctx.fillStyle = shadeOf(fill);
          ctx.beginPath();
          ctx.arc(cx, gy + tileR * 0.08, tileR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.arc(cx, gy, tileR, 0, Math.PI * 2);
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = GAME_INK;
          ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.font = `800 ${Math.round(tileR * 0.78)}px Outfit, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 4;
          ctx.strokeStyle = GAME_INK;
          ctx.strokeText(String(val), cx, gy);
          ctx.fillText(String(val), cx, gy);
          ctx.restore();
        });
      }
      return true;
    };

    /*
     * Own rAF loop rather than the shared startCanvasLoop.
     *
     * That helper takes the raf id in a `rafRef` owned by the component, and its
     * cleanup cancels whatever that ref currently points at. With StrictMode's
     * mount/unmount/mount, and this effect's [isAr] dependency on top, two loop
     * instances end up writing the same ref, and one instance's cleanup can
     * cancel the OTHER instance's scheduled frame — leaving the canvas painted
     * exactly once and then frozen. Measured: the frame counter stopped at 1 and
     * stayed there for 30s while the game reported itself running.
     *
     * The id is a local here, so a cleanup can only ever cancel its own frame.
     */
    let rafId = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(dt, now);
      rafId = requestAnimationFrame(tick);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    rafId = requestAnimationFrame(tick);
    const stop = () => { cancelAnimationFrame(rafId); ro.disconnect(); };

    const start = () => {
      s.started = true;
      s.finished = false;
      s.lane = 1;
      s.runnerX = laneCentre(1);
      s.gate = null;
      s.gapTimer = cfg.gap;
      s.gatesPlayed = 0; s.passedN = 0; s.comboN = 0;
      s.livesN = cfg.lives;
      s.flash = null;
      setPassed(0); setCombo(0); setLives(cfg.lives);
      setEqText('');
      setPhase('run');
      setBanner(null);
    };
    apiRef.current = { start, stop: () => { s.finished = true; } };

    // Kick the run off HERE rather than from a separate one-shot effect. That
    // separation was the bug: this effect re-runs on [isAr] (and twice under
    // StrictMode), and a [] effect cannot re-start the run it just invalidated.
    if (!s.started) start();

    return () => {
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      stop();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  const startRun = () => {
    playSfx?.('click');
    apiRef.current.start?.();
  };

  const stats = phase === 'boot' ? [] : [
    `${t.passed} ${passed}`,
    `${'♥'.repeat(Math.max(0, lives))}`,
    combo > 1 ? `🔥${combo}` : '',
  ].filter(Boolean);

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={isAr ? 'بوابات الحساب' : 'Math Gates'}
      tag={isAr ? 'تدريب' : 'training'}
      hint={phase === 'run' ? (eqText || t.hint) : t.hint}
      chip={eqText || '∑'}
      chipStyle={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--game-ink)' }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : null}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? t.overSub(passed) : null}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      canvasChildren={<canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />}
      bannerActions={
        banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={startRun}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    />
  );
}
