import React, { useEffect, useRef } from 'react';
import { bootC3dScene } from './c3dBoot';
import './c3dProto.css';

/**
 * Cosmos WebGL backdrop + overlay slot for a REAL training engine.
 * Use this when 3D mode must keep the same game loop — only the environment changes.
 */
export default function C3dEngineShell({
  isAr,
  onBack,
  playSfx,
  title,
  tag,
  children,
  fitHalf = 5.5,
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const boot = bootC3dScene(wrap, { fov: 50, fitHalf, bloom: true });
    if (boot.error) return () => boot.dispose();
    boot.setTick(() => {});
    return () => boot.dispose();
  }, [fitHalf]);

  return (
    <div className="c3d-root c3d-engine-shell" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="c3d-canvas" ref={wrapRef} aria-hidden="true" />
      <div className="c3d-engine-chrome">
        <header className="c3d-top">
          <button
            type="button"
            className="c3d-icon-btn"
            onClick={() => { playSfx?.('click'); onBack?.(); }}
            aria-label={isAr ? 'العودة' : 'Back'}
          >
            {isAr ? '›' : '‹'}
          </button>
          <div className="c3d-titles">
            {title ? <div className="c3d-title">{title}</div> : null}
            {tag ? <div className="c3d-tag">{tag}</div> : null}
          </div>
          <div className="c3d-target-chip" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#e8ac4e' }}>
            3D
          </div>
        </header>
      </div>
      <div className="c3d-engine-layer">
        {children}
      </div>
    </div>
  );
}
