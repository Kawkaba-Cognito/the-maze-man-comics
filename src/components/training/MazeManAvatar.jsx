import React, { useEffect, useState } from 'react';

const BASE = import.meta.env.BASE_URL;

/* Background-removal pass for the white-canvas Maze Man PNG. Soft alpha edge
 * around brightness 170–210. Heavy on large images, so we run it lazily —
 * `useTransparentBg` returns null until the work finishes, and the avatar
 * shows the raw image in the meantime. Errors (e.g. tainted canvas under
 * unusual hosting) fall through to the raw image too. */
function useTransparentBg(src) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        const HARD = 210;
        const SOFT = 170;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness >= HARD) {
            d[i + 3] = 0;
          } else if (brightness >= SOFT) {
            const t = (brightness - SOFT) / (HARD - SOFT);
            d[i + 3] = Math.round(d[i + 3] * (1 - t));
          }
        }
        ctx.putImageData(imageData, 0, 0);
        if (!cancelled) setDataUrl(canvas.toDataURL('image/png'));
      } catch {
        // Tainted canvas / OOM — fall back to the raw src silently.
      }
    };
    img.onerror = () => { /* keep dataUrl null; raw src takes over */ };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);
  return dataUrl;
}

/**
 * Maze Man character avatar. Always renders the image and animates from the
 * first paint — the transparent-background processing is an enhancement that
 * swaps in once it's ready. Floating + glow keyframes live in global.css
 * (`mmFloat`, `mmPulse`) so the animation cannot be lost to React's style-tag
 * hoisting behaviour or strict-mode double-mounts.
 */
export default function MazeManAvatar({ size = 140, mood = 'ready', glow = true }) {
  const glowColor = {
    ready:   '#f5a623',
    focused: '#8fb84a',
    proud:   '#ffd85a',
    tired:   '#c9a15a',
  }[mood] || '#f5a623';

  const src = `${BASE}Assets/maze-man-3d.png`;
  const processedSrc = useTransparentBg(src);
  const displaySrc = processedSrc || src;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glow && (
        <div
          className="mm-glow-ring"
          style={{
            position: 'absolute',
            inset: -size * 0.18,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor}44 0%, ${glowColor}11 45%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <div
        className="mm-shadow"
        style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.55,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          filter: 'blur(6px)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="mm-float"
        style={{ position: 'relative', zIndex: 2 }}
      >
        <img
          src={displaySrc}
          alt="Maze Man"
          width={size}
          height={size}
          draggable={false}
          style={{
            objectFit: 'contain',
            display: 'block',
            mixBlendMode: processedSrc ? 'normal' : 'screen',
            filter: glow
              ? `drop-shadow(0 0 ${size * 0.08}px ${glowColor}cc) drop-shadow(0 0 ${size * 0.14}px ${glowColor}66)`
              : 'none',
          }}
        />
      </div>
    </div>
  );
}
