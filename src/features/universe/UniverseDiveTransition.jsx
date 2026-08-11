import React, { useEffect, useRef, useState } from 'react';
import './universe-dive-transition.css';

const WARP_PALETTE = [
  'rgba(38, 44, 60, 0.82)',
  'rgba(99, 80, 79, 0.74)',
  'rgba(138, 101, 83, 0.78)',
];

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

function hasLimitedGraphicsBudget() {
  return (
    window.innerWidth <= 760 ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4)
  );
}

function createStar() {
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.06 + Math.pow(Math.random(), 0.62) * 1.08;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    z: 0.16 + Math.random() * 0.92,
    color: Math.floor(Math.random() * WARP_PALETTE.length),
  };
}

export default function UniverseDiveTransition({ isAr = false, ready = false, failed = false, onComplete }) {
  const canvasRef = useRef(null);
  const [minimumJourneyDone, setMinimumJourneyDone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !context) return undefined;

    const reducedMotion = prefersReducedMotion();
    const lowPower = hasLimitedGraphicsBudget();
    const starCount = reducedMotion ? 54 : lowPower ? 82 : 142;
    const stars = Array.from({ length: starCount }, createStar);
    let width = 1;
    let height = 1;
    let dpr = 1;
    let background;
    let animationFrame = 0;
    let startedAt = 0;
    let previousTime = 0;
    let hidden = document.hidden;

    const resize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.25);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      background = context.createRadialGradient(
        width * 0.5,
        height * 0.48,
        0,
        width * 0.5,
        height * 0.48,
        Math.max(width, height) * 0.76,
      );
      background.addColorStop(0, '#eee8dc');
      background.addColorStop(0.32, '#d9cfbd');
      background.addColorStop(1, '#b9aa91');
    };

    const resetStar = (star) => {
      Object.assign(star, createStar(), { z: 0.82 + Math.random() * 0.24 });
    };

    const draw = (time = 0) => {
      if (!startedAt) startedAt = time;
      if (!previousTime) previousTime = time;
      const deltaSeconds = Math.min((time - previousTime) / 1000, 0.034);
      const elapsed = Math.max(0, time - startedAt);
      previousTime = time;

      context.fillStyle = background;
      context.fillRect(0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.47;
      const focalLength = Math.min(width, height) * 0.48;
      const acceleration = Math.min(1, elapsed / 1050);
      const easedAcceleration = acceleration * acceleration * (3 - 2 * acceleration);
      const speed = reducedMotion ? 0 : 0.22 + easedAcceleration * 1.38;
      const travel = Math.max(0.0015, speed * deltaSeconds);

      stars.forEach((star) => {
        const previousZ = star.z + travel * (2.8 + easedAcceleration * 3.8);
        star.z -= travel;
        if (star.z <= 0.035) {
          resetStar(star);
          star.visible = false;
          return;
        }

        const x = centerX + (star.x / star.z) * focalLength;
        const y = centerY + (star.y / star.z) * focalLength;
        const previousX = centerX + (star.x / previousZ) * focalLength;
        const previousY = centerY + (star.y / previousZ) * focalLength;

        if (x < -120 || x > width + 120 || y < -120 || y > height + 120) {
          resetStar(star);
          star.visible = false;
          return;
        }

        star.visible = true;
        star.xNow = x;
        star.yNow = y;
        star.xPrevious = previousX;
        star.yPrevious = previousY;
      });

      context.lineCap = 'round';
      WARP_PALETTE.forEach((color, index) => {
        context.beginPath();
        stars.forEach((star) => {
          if (!star.visible || star.color !== index) return;
          context.moveTo(star.xPrevious, star.yPrevious);
          context.lineTo(star.xNow, star.yNow);
        });
        context.strokeStyle = color;
        context.lineWidth = index === 0 ? 1.45 : 1.05;
        context.stroke();
      });

      const coreRadius = 5 + easedAcceleration * 12;
      context.beginPath();
      context.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      context.fillStyle = `rgba(31, 79, 133, ${0.13 + easedAcceleration * 0.17})`;
      context.fill();

      if (!reducedMotion && !hidden) animationFrame = window.requestAnimationFrame(draw);
    };

    const handleVisibility = () => {
      hidden = document.hidden;
      if (!hidden && !reducedMotion) {
        previousTime = performance.now();
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    const handleResize = () => {
      resize();
      if (reducedMotion) draw(performance.now());
    };

    resize();
    draw(performance.now());
    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setMinimumJourneyDone(true),
      prefersReducedMotion() ? 160 : 1900,
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minimumJourneyDone || (!ready && !failed)) return undefined;
    setLeaving(true);
    const timer = window.setTimeout(onComplete, prefersReducedMotion() ? 80 : 400);
    return () => window.clearTimeout(timer);
  }, [failed, minimumJourneyDone, onComplete, ready]);

  const waiting = minimumJourneyDone && !ready && !failed;

  return (
    <div
      className={`universe-dive${waiting ? ' is-waiting' : ''}${leaving ? ' is-leaving' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={isAr ? 'الانتقال عبر الفضاء إلى عالمك' : 'Travelling through space to your universe'}
    >
      <canvas ref={canvasRef} className="universe-dive__canvas" aria-hidden="true" />
      <div className="universe-dive__gate" aria-hidden="true"><i /></div>

      <div className="universe-dive__copy">
        <span>{isAr ? 'عبور فضائي' : 'Space transit'}</span>
        <strong>
          {waiting
            ? isAr
              ? 'جارٍ تحديد منطقة الهبوط'
              : 'Mapping the landing zone'
            : isAr
              ? 'الانطلاق إلى عالمك'
              : 'Entering your universe'}
        </strong>
        <i aria-hidden="true" />
      </div>
    </div>
  );
}
