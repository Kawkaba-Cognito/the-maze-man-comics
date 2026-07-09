/*
 * canvasLoop.js — the standard glue shared by the canvas engine games
 * (Flip, Piano Tap, Odd One Out, Math Gates, Car Park): DPR-aware sizing
 * kept fresh by a ResizeObserver + a requestAnimationFrame loop with
 * delta-time clamping. Call inside the run effect and return its cleanup:
 *
 *   const frame = (dt, now) => {
 *     ...one tick...            // dt in seconds, clamped to maxDt
 *     if (gameOver) { finish(); return false; }   // false stops the loop
 *   };
 *   return startCanvasLoop({ wrap: wrapRef.current, rafRef, resize, frame });
 *
 * The pending raf id lives in `rafRef` so the game's finish() can cancel a
 * scheduled tick from outside the loop (timers, pointer handlers).
 */
export function startCanvasLoop({ wrap, rafRef, resize, frame, maxDt = 0.05 }) {
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  let last = performance.now();
  const tick = (now) => {
    const dt = Math.min(maxDt, (now - last) / 1000);
    last = now;
    if (frame(dt, now) === false) return;
    rafRef.current = requestAnimationFrame(tick);
  };
  rafRef.current = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(rafRef.current);
    ro.disconnect();
  };
}
