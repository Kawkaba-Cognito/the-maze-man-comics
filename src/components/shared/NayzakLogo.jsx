import React from 'react';
import { assetUrl } from '../../lib/assetUrl';

/**
 * NayzakLogo — Official NAYZAK GAMES cartoon wordmark.
 */
export default function NayzakLogo({
  variant = 'compact',
  size = 36,
  className = '',
  style = {},
}) {
  const height = variant === 'full' ? 68 : variant === 'emblem' ? size : Math.max(32, size);

  return (
    <div
      className={`nayzak-logo-lockup nayzak-logo-lockup--${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        lineHeight: 0,
        ...style,
      }}
    >
      <img
        src={assetUrl('Assets/brand/nayzak-games-logo.png')}
        alt="NAYZAK GAMES"
        draggable="false"
        style={{
          height,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 2px 4px rgba(15, 23, 42, 0.1))',
        }}
      />
    </div>
  );
}
