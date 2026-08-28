import React, { useEffect, useRef, useState } from 'react';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { paintSky } from '../../../../shared/board2d';
import { assetUrl } from '../../../../../../lib/assetUrl';
import { GAME_COLORS, GAME_INK, GAME_STIMULUS, shadeOf } from '../../../../shared/gamePalette';
import { makeRng } from '../../../../shared/rng';
import { clamp } from '../../../../../../lib/math';
import { genGate, levelCfg, LADDER_LEVELS } from './index';
import '../../../../shared/c3dProto.css';
// nowMs() = performance.now() minus paused time, so the pause menu really
// stops this game's clock. See shared/pauseStore.js.
import { nowMs } from '../../../../shared/pauseStore';

/*
 * MathGatesBoard2D — the lane runner.
 *
 * Replaces MathGates3DProto.jsx. Every rule below is carried over unchanged:
 * the same genGate() with the same skill ramp (gatesPlayed/36 → ladder level),
 * the same constant 3.8s descent with no clock and no speed-up, the same
 * lives/gap config from levelCfg, and the same "the lane you occupy on ARRIVAL
 * is your answer". Only the drawing changed.
 *
 * The runner is Kawkab — the black planet, the same mascot the Training hub
 * puts at its centre, drawn straight onto this canvas from an 86 KB WebP.
 *
 * It used to be a 3.4 MB GLB rendered by DrKawkabLayer in its own WebGL
 * context, justified by a comment claiming he "exists only as that GLB" and
 * that the hub used the same model. Neither survived the hub's move to the 2D
 * planet, so the layer was paying three megabytes and a renderer to draw one
 * small figure that a drawImage call now draws in the correct z-order.
 *
 * The equation is drawn ON the board, large, and BELOW the chrome bar — at
 * 0.055 of the height its top third was hidden under the HUD, which made the
 * question the round is actually asking the least legible thing on screen.
 * The steering hint shows only between runs; during play it just occluded the
 * board.
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
  mode = 'free', level = 1, seed, attempt, onResult,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const cfg = mode === 'levels'
    ? levelCfg(level)
    : mode === 'passplay'
      ? levelCfg(level || 21)
      : levelCfg(1);

  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const apiRef = useRef({});
  /* The runner's artwork — the same black-planet Kawkab the Training hub uses.
   * Loaded once here rather than per frame; the draw loop skips it until
   * `complete`, so a slow load costs a few frames of an empty lane, never a
   * stall. Replaces a 3.4 MB GLB and a second WebGL context. */
  const kawkabImgRef = useRef(null);
  if (kawkabImgRef.current === null && typeof Image !== 'undefined') {
    const img = new Image();
    img.src = assetUrl('Assets/characters/kawkab/kawkab-planet.webp');
    kawkabImgRef.current = img;
  }
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

    const laneCentre = (i) => (i + 0.5) / LANES;   // 0..1 within the play column

    /* The play column, defined ONCE.
     *
     * This used to exist twice: the draw centred a capped column (below), while
     * the pointer handler split the FULL canvas into thirds. Those agree only
     * while the column happens to fill the canvas — i.e. on a phone. On a
     * 1400x760 play area the column is 593px starting at x=403, so the visible
     * lanes are 403-601 / 601-799 / 799-997 while the handler was splitting at
     * 467 and 933: tapping the left or right answer selected the wrong lane
     * about 68% of the time, which reads as a crash you did not earn and, once
     * lives run out, as the game quitting by itself.
     *
     * One function, both callers, so they cannot drift apart again. */
    const column = () => {
      const colW = Math.min(W, Math.max(320, H * 0.78));
      return { colW, colX: (W - colW) / 2, laneW: colW / LANES };
    };

    const spawnGate = () => {
      const f = clamp(s.gatesPlayed / 36, 0, 1);
      // Survival walks the ladder by skill — same depth a Levels player meets.
      const gateCfg = mode === 'free' ? levelCfg(1 + Math.round(f * (LADDER_LEVELS - 1))) : cfg;
      const eq = genGate(gateCfg, mode === 'free' ? f : (cfg.f || 0), rng);
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
      // Canvas CSS px, then the SAME column geometry the gate is drawn with —
      // so the lane you tap is the lane you get, at every window size.
      const x = ((e.clientX - rect.left) / (rect.width || 1)) * W;
      const { colX, laneW } = column();
      setLane(Math.floor((x - colX) / laneW));   // setLane clamps to 0..LANES-1
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
    const RUNNER_LINE = 0.86;

    /* Where the equation banner ends — the gate must start BELOW it.
     *
     * At RUN_TOP 0.06 the gate spawned above the banner and fell straight
     * through it, so for about a second the answer circles sat on top of the
     * equation and neither could be read. Moving the banner clear of the HUD
     * (see the draw below) fixed one occlusion and exposed this one.
     *
     * Derived from the same numbers the banner is drawn with rather than a
     * second hand-tuned constant, so the two can never drift apart. Shortening
     * the descent does not change the timing — the gate's y is a 0..1 fraction
     * over DESCEND_SEC regardless of the distance — it just travels a little
     * slower, which is if anything easier to read. */
    const eqBandBottom = () => {
      const eqSize = Math.round(Math.min(W * 0.085, H * 0.11, 60));
      return (H * 0.125 + eqSize * 1.5) / H;
    };
    const runTop = () => Math.min(0.42, eqBandBottom() + 0.025);

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

      /* The play column.
       *
       * Lanes used to span the full canvas. On a 1366px desktop that made each
       * lane ~455px wide, so the runner had to travel half a screen to switch
       * and the three gate answers sat too far apart to compare at a glance —
       * on a task scored in hundreds of milliseconds. The column is capped and
       * centred, so the game reads the same on a phone and a monitor.
       *
       * From column() — the pointer handler reads the identical numbers. */
      const { colW, colX, laneW } = column();
      const laneX = (i) => colX + i * laneW;
      const runnerY = H * RUNNER_LINE;

      /* The equation, on the board and large.
       *
       * It used to live only in the chrome's hint line — small text in the
       * header. That is the question the whole round asks, and it was the least
       * legible thing on screen. The 3D version had it as a full-width banner
       * for exactly this reason; this is that banner, drawn directly. */
      if (s.gate) {
        const eqTxt = `${s.gate.eq.text} = ?`;
        const eqSize = Math.round(Math.min(W * 0.085, H * 0.11, 60));
        ctx.save();
        ctx.font = `800 ${eqSize}px Outfit, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const tw = ctx.measureText(eqTxt).width;
        const padX = eqSize * 0.55;
        const bx = W / 2 - tw / 2 - padX;
        /*
         * 0.055 -> 0.125 of the height.
         *
         * The chrome bar (.ct-fq-bar, ~48px plus its 8px offset) is a DOM layer
         * ON TOP of this canvas, and at 0.055 the banner started around y=35 —
         * so its top third sat underneath the bar and the equation, the one
         * thing the round is actually asking, was the least readable object on
         * screen. Measured: bar occupies y 8-56, banner ran 35-125.
         *
         * Expressed as a fraction rather than a pixel offset because the canvas
         * is sized in CSS pixels that change with the viewport; 0.125 clears the
         * bar at every height the play area is given, with margin to spare.
         */
        const by = H * 0.125;
        const bh = eqSize * 1.5;
        ctx.fillStyle = 'rgba(242, 236, 228, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bx, by, tw + padX * 2, bh, 16);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = GAME_INK;
        ctx.stroke();
        ctx.fillStyle = GAME_INK;
        ctx.fillText(eqTxt, W / 2, by + bh / 2);
        ctx.restore();
      }

      // Lane strips — the occupied one is brighter, so "which lane am I in"
      // never depends on finding a small runner.
      for (let i = 0; i < LANES; i++) {
        ctx.save();
        ctx.globalAlpha = i === s.lane ? 0.26 : 0.13;
        ctx.fillStyle = LANE_COLORS[i];
        ctx.fillRect(laneX(i) + 4, H * runTop(), laneW - 8, runnerY - H * runTop() + 10);
        ctx.restore();
      }

      /* Kawkab, drawn straight onto this canvas.
       *
       * This used to publish a position for DrKawkabLayer, a three.js layer that
       * loaded Assets/biped-v1.glb — 3.4 MB and a second WebGL context, to draw
       * one small figure over a 2D board. Its own comment justified that by
       * saying he "exists only as the GLB" and that the Training hub used the
       * same model. Both stopped being true when the hub moved to the 2D black
       * planet: there is now a real 2D Kawkab, 86 KB, already in the bundle.
       *
       * So the character is one drawImage call. Same mascot as the hub, ~40x
       * lighter, no WebGL, and it composites in the right order — above the lane
       * strips, below the equation banner — instead of floating in a layer above
       * everything. */
      const rx = colX + s.runnerX * colW;
      const rr = Math.min(laneW * 0.2, 30);
      const kb = kawkabImgRef.current;
      if (kb && kb.complete && kb.naturalWidth) {
        const kh = rr * 3.4;
        const kw = kh * (kb.naturalWidth / kb.naturalHeight);
        ctx.save();
        ctx.translate(rx, runnerY + rr * 0.7);
        // Lean into the turn — the one bit of character the GLB gave for free.
        ctx.rotate(((laneCentre(s.lane) - s.runnerX) * 6 * Math.PI) / 180);
        ctx.drawImage(kb, -kw / 2, -kh, kw, kh);
        ctx.restore();
      }

      // The gate: three answers, one per lane.
      if (s.gate) {
        const gy = H * runTop() + (runnerY - H * runTop()) * s.gate.y;
        const tileR = Math.min(laneW * 0.36, 62);
        s.gate.eq.options.forEach((val, i) => {
          const cx = colX + laneCentre(i) * colW;
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
    let last = nowMs();
    const tick = () => {
      /* nowMs(), NOT the rAF timestamp.
       *
       * nowMs() is performance.now() minus every millisecond spent paused, so
       * dt collapses to 0 while the pause menu is open and the gate genuinely
       * stops. This file already imported it and set `last` from it, then took
       * dt from the raw rAF clock — so the gate kept falling behind the menu,
       * arrived, and resolved against whatever lane the runner was parked in.
       * Lives drained while nobody was playing, and on the last one the run
       * ended on its own. */
      const now = nowMs();
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
      /* Instructions only when the player is NOT playing.
       *
       * The hint is a permanent line under the HUD, so during a run it sat
       * across the top of the board competing with the equation and the falling
       * gate for the same glance. This is a speeded task — once the run starts
       * the player is steering, not reading, and a sentence they have already
       * read is pure occlusion. `banner` is 'go' before the run and 'over'
       * after, null while playing, so it is exactly the right switch. */
      hint={banner ? t.hint : null}
      chip={eqText || '∑'}
      chipStyle={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--game-ink)' }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : null}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? t.overSub(passed) : null}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      canvasChildren={(
        <>
          <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />
        </>
      )}
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
