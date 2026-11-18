import React from 'react';
import { assetUrl } from '../../lib/assetUrl';

/**
 * NayzakLogo — Official NAYZAK MIND Light Clay Studio wordmark & sculpted emblem.
 */
export default function NayzakLogo({
  variant = 'compact',
  size = 38,
  showMascot = true,
  className = '',
  style = {},
}) {
  const emblemSize = variant === 'full' ? 52 : variant === 'emblem' ? size : Math.max(36, size);

  if (variant === 'emblem') {
    return (
      <div
        className={`nayzak-logo-lockup nayzak-logo-lockup--emblem ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', ...style }}
      >
        <span
          className="nayzak-brand-emblem nayzak-clay-emblem"
          style={{ width: emblemSize, height: emblemSize }}
        >
          <img
            src={assetUrl('Assets/brand/clay-2026/brand-emblem.webp')}
            alt="NAYZAK MIND"
            draggable="false"
            className="nayzak-clay-emblem-img"
          />
        </span>
      </div>
    );
  }

  return (
    <div
      className={`nayzak-logo-lockup nayzak-logo-lockup--${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: variant === 'full' ? 12 : 9,
        userSelect: 'none',
        ...style,
      }}
      dir="ltr"
    >
      {showMascot && (
        <span
          className="nayzak-brand-emblem nayzak-clay-emblem"
          style={{ width: emblemSize, height: emblemSize }}
          aria-hidden="true"
        >
          <img
            src={assetUrl('Assets/brand/clay-2026/brand-emblem.webp')}
            alt=""
            draggable="false"
            className="nayzak-clay-emblem-img"
          />
        </span>
      )}

      <span className="nayzak-brand-wordmark">
        <span
          className="nayzak-brand-title"
          style={variant === 'full' ? { fontSize: 22 } : undefined}
        >
          NAYZAK
        </span>
        <span className="nayzak-brand-sub">MIND · CLAY STUDIO</span>
      </span>
    </div>
  );
}
