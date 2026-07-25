import React, { useEffect, useRef, useState } from 'react';

/*
 * Rain, and the occasional storm. Pure atmosphere — it never intercepts input.
 * Honours prefers-reduced-motion by drawing a still, faint drizzle once and
 * skipping both the animation loop and the lightning entirely.
 */
export default function Weather({ onThunder }) {
  const canvasRef = useRef(null);
  const [flash, setFlash] = useState(false);
  const thunderRef = useRef(onThunder);
  thunderRef.current = onThunder;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let drops = [];
    let raf = 0;
    let storm = 0;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(150, rect.width / 8));
      drops = Array.from({ length: n }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        l: 8 + Math.random() * 14,
        v: 7 + Math.random() * 9,
        o: 0.05 + Math.random() * 0.18,
      }));
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      for (const d of drops) {
        ctx.strokeStyle = `rgba(170,190,220,${d.o})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.l * 0.25, d.y + d.l);
        ctx.stroke();
        d.y += d.v;
        d.x += d.v * 0.25;
        if (d.y > height) { d.y = -d.l; d.x = Math.random() * width; }
      }
    };

    const loop = () => { draw(); raf = requestAnimationFrame(loop); };

    const ro = new ResizeObserver(() => { size(); if (reduced) draw(); });
    ro.observe(canvas);
    size();

    if (reduced) {
      draw();
    } else {
      raf = requestAnimationFrame(loop);
      const nextStorm = () => {
        storm = window.setTimeout(() => {
          setFlash(true);
          window.setTimeout(() => setFlash(false), 600);
          window.setTimeout(() => thunderRef.current?.(), 380);
          nextStorm();
        }, 9000 + Math.random() * 15000);
      };
      nextStorm();
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(storm);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="nr-rain" aria-hidden="true" />
      <div className={`nr-flash${flash ? ' on' : ''}`} aria-hidden="true" />
      <div className="nr-vignette" aria-hidden="true" />
    </>
  );
}
