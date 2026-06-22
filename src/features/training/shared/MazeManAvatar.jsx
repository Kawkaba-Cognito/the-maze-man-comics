import React from 'react';

const BASE = import.meta.env.BASE_URL;

/**
 * Guide fox avatar — uses a pre-cut transparent PNG.
 * Floating + glow keyframes live in global.css (`mmFloat`, `mmPulse`).
 */
export default React.memo(function MazeManAvatar({ size = 140, mood = 'ready', glow = true }) {
  const glowColor = {
    ready:   '#f5a623',
    focused: '#8fb84a',
    proud:   '#ffd85a',
    tired:   '#c9a15a',
  }[mood] || '#f5a623';

  const src = `${BASE}Assets/guide-fox-sprite.webp`;

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
          src={src}
          alt=""
          width={size}
          height={size}
          draggable={false}
          style={{
            objectFit: 'contain',
            display: 'block',
            filter: glow
              ? `drop-shadow(0 0 ${size * 0.08}px ${glowColor}cc) drop-shadow(0 0 ${size * 0.14}px ${glowColor}66)`
              : 'none',
          }}
        />
      </div>
    </div>
  );
});
