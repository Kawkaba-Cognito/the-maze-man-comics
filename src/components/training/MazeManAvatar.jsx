import React, { useEffect, useRef, useState } from 'react';

const BASE = import.meta.env.BASE_URL;

function useTransparentBg(src) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const HARD = 210;   // above this → fully transparent
      const SOFT = 170;   // SOFT–HARD range → blend to 0
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const brightness = (r + g + b) / 3;
        if (brightness >= HARD) {
          d[i + 3] = 0;
        } else if (brightness >= SOFT) {
          // soft edge: fade alpha
          const t = (brightness - SOFT) / (HARD - SOFT);
          d[i + 3] = Math.round(d[i + 3] * (1 - t));
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setDataUrl(canvas.toDataURL('image/png'));
    };
    img.src = src;
  }, [src]);
  return dataUrl;
}

export default function MazeManAvatar({ size = 140, mood = 'ready', glow = true }) {
  const glowColor = {
    ready:   '#f5a623',
    focused: '#8fb84a',
    proud:   '#ffd85a',
    tired:   '#c9a15a',
  }[mood] || '#f5a623';

  const src = `${BASE}Assets/maze-man-3d.png`;
  const processedSrc = useTransparentBg(src);

  const floatStyle = {
    animation: 'mmFloat 3.4s ease-in-out infinite',
  };

  return (
    <>
      <style>{`
        @keyframes mmFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes mmPulse {
          0%, 100% { opacity: 0.55; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.08); }
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>

        {/* Outer ambient glow ring */}
        {glow && (
          <div style={{
            position: 'absolute',
            inset: -size * 0.18,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor}44 0%, ${glowColor}11 45%, transparent 70%)`,
            animation: 'mmPulse 2.8s ease-in-out infinite',
            pointerEvents: 'none',
          }}/>
        )}

        {/* Ground shadow */}
        <div style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: size * 0.55,
          height: 10,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.45)',
          filter: 'blur(6px)',
          animation: 'mmFloat 3.4s ease-in-out infinite',
          animationDelay: '0.1s',
          pointerEvents: 'none',
        }}/>

        {/* Character image */}
        <div style={{ ...floatStyle, position: 'relative', zIndex: 2 }}>
          {processedSrc ? (
            <img
              src={processedSrc}
              alt="Maze Man"
              width={size}
              height={size}
              style={{
                objectFit: 'contain',
                display: 'block',
                filter: glow
                  ? `drop-shadow(0 0 ${size * 0.08}px ${glowColor}cc) drop-shadow(0 0 ${size * 0.14}px ${glowColor}66)`
                  : 'none',
              }}
            />
          ) : (
            // Placeholder while canvas processes
            <div style={{
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${glowColor}22 0%, transparent 70%)`,
            }}/>
          )}
        </div>
      </div>
    </>
  );
}
