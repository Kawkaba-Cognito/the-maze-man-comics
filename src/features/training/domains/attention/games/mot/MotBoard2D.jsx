import React, { useEffect, useRef } from 'react';
import { startCanvasLoop } from '../../../../shared/canvasLoop';
import { drawPiece, paintSky } from '../../../../shared/board2d';
import { GAME_COLORS } from '../../../../shared/gamePalette';

/*
 * MotBoard2D — the Target Tracking arena.
 *
 * Replaces Mot3DProto.jsx. This is the game whose look became the platform
 * palette, so the job here is to reproduce it exactly, not to reinterpret it —
 * the only intended difference is that the dots are now the palette's declared
 * colours rather than those colours accidentally darkened 35% by an unlit
 * metalness value (see the derivation note in gamePalette.js).
 *
 * CONTROLLED view: it owns no game logic. MotEngine in ./index.jsx runs the dot
 * physics, phases, scoring, trialLog and XP, and passes refs:
 *   - dotsRef   live dots [{ x, y, r, target, selected }] in field pixels
 *   - fieldRef  the arena rect { x0, y0, w, h } those pixels live in
 *   - phaseRef  'cue' | 'track' | 'respond' | 'result'
 *   - interactive  whether taps select dots (respond phase)
 *   - onPickDot(index)
 *
 * Field pixels are CSS pixels inside this wrapper (index.jsx computes x0/y0
 * from the same box), so no projection is needed — only a DPR scale.
 */

/**
 * dot + phase → shared piece state.
 *
 * During `track` every dot MUST look identical: the whole task is holding the
 * targets' identity in attention, so any mark on a target would give the answer
 * away. Only `cue` marks them.
 */
function stateOf(d, phase) {
  if (phase === 'cue') return d.target ? 'cued' : 'idle';
  if (phase === 'respond') return d.selected ? 'selected' : 'idle';
  if (phase === 'result') {
    if (d.target && d.selected) return 'correct';   // tracked it
    if (d.target) return 'cued';                    // missed — this is what you should have held
    if (d.selected) return 'wrong';                 // false alarm
    return 'spent';                                 // correctly ignored
  }
  return 'idle';
}

export default function MotBoard2D({ dotsRef, fieldRef, phaseRef, phase, interactive, onPickDot, isAr }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const onPickRef = useRef(onPickDot);
  onPickRef.current = onPickDot;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let dpr = 1;
    let w = 1;
    let h = 1;

    // A sparse, fixed speckle field — the light-key echo of the 3D scene's
    // starfield. Generated once in normalised space so it doesn't crawl on
    // resize, and drawn under everything.
    const specks = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 0.9,
    }));

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth || 1;
      h = wrap.clientHeight || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    const frame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintSky(ctx, w, h);

      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      for (const s of specks) {
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const f = fieldRef.current;
      const dots = dotsRef.current;
      if (!f || !f.w || !Array.isArray(dots)) return true;

      // Arena bounds — the dots bounce off this, so it has to be visible or the
      // bounces look arbitrary.
      ctx.save();
      ctx.strokeStyle = GAME_COLORS.accent.fill;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 2;
      const rad = 14;
      ctx.beginPath();
      ctx.roundRect(f.x0, f.y0, f.w, f.h, rad);
      ctx.stroke();
      ctx.restore();

      const phase = phaseRef.current;
      for (const d of dots) {
        drawPiece(ctx, { x: d.x, y: d.y, r: d.r, state: stateOf(d, phase) });
      }
      return true;
    };

    // Nearest-dot pick rather than strict hit test: these are small moving
    // targets and a thumb is not precise. Matches the 3D's generous raycast.
    const onPointerUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!interactiveRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const dots = dotsRef.current || [];
      let best = null;
      let bestD = Infinity;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dist = Math.hypot(d.x - px, d.y - py);
        // within the dot, or within a forgiving ring around it
        if (dist < Math.max(d.r * 2.2, 28) && dist < bestD) { bestD = dist; best = i; }
      }
      if (best != null) onPickRef.current?.(best);
    };
    canvas.addEventListener('pointerup', onPointerUp);

    const stop = startCanvasLoop({ wrap, rafRef, resize, frame });
    return () => {
      canvas.removeEventListener('pointerup', onPointerUp);
      stop();
    };
  }, [dotsRef, fieldRef, phaseRef]);

  const dots = Array.isArray(dotsRef.current) ? dotsRef.current : [];
  const targetIds = dots.flatMap((dot, index) => (dot.target ? [index + 1] : []));
  const status = phase === 'cue'
    ? (isAr ? `احفظ الأهداف: الأجسام ${targetIds.join('، ')}` : `Remember targets: objects ${targetIds.join(', ')}`)
    : phase === 'track'
      ? (isAr ? 'تتبّع الأهداف أثناء حركتها' : 'Track the target objects while they move')
      : phase === 'respond'
        ? (isAr ? 'اختر الأجسام التي كانت أهدافاً' : 'Select the objects that were targets')
        : (isAr ? 'نتيجة الجولة' : 'Round result');

  return (
    <div
      ref={wrapRef}
      style={{ position: 'absolute', inset: 0 }}
      role="group"
      aria-label={isAr ? 'ساحة تتبّع الأهداف' : 'Target tracking arena'}
    >
      <p className="ct-visually-hidden" aria-live="polite" aria-atomic="true">{status}</p>
      <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} aria-hidden="true" />
      {interactive && dots.map((dot, index) => (
        <button
          key={index}
          type="button"
          className="ct-mot-access-target"
          style={{
            left: dot.x,
            top: dot.y,
            width: Math.max(dot.r * 4.4, 56),
            height: Math.max(dot.r * 4.4, 56),
          }}
          aria-label={isAr ? `الجسم ${index + 1}` : `Object ${index + 1}`}
          aria-pressed={Boolean(dot.selected)}
          onClick={() => onPickRef.current?.(index)}
        />
      ))}
    </div>
  );
}
