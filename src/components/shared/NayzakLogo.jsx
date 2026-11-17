import React from 'react';
import { assetUrl } from '../../lib/assetUrl';

/**
 * NayzakLogo — Official NAYZAK GAMES Wordmark paired with Captain Nayzak mascot emblem.
 * Derived directly from the canonical Google Drive Snapchat/YouTube brand assets.
 */
export default function NayzakLogo({
  variant = 'compact',
  size = 38,
  showMascot = true,
  className = '',
  style = {},
}) {
  const emblemSize = variant === 'full' ? 52 : variant === 'emblem' ? size : Math.max(34, size);

  if (variant === 'emblem') {
    return (
      <div
        className={`nayzak-logo-lockup nayzak-logo-lockup--emblem ${className}`}
        style={{ display: 'inline-flex', alignItems: 'center', ...style }}
      >
        <span
          className="nayzak-brand-emblem"
          style={{
            width: emblemSize,
            height: emblemSize,
            borderRadius: Math.round(emblemSize * 0.3),
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <img
            src={assetUrl('Assets/brand/cast-2026/nayzak-host.webp')}
            alt="NAYZAK"
            draggable="false"
            style={{ width: '92%', height: '92%', objectFit: 'contain', display: 'block' }}
          />
        </span>
      </div>
    );
  }

  const wordmarkHeight =
    variant === 'full'
      ? Math.max(40, Math.round(size * 0.86))
      : Math.max(26, Math.round(size * 0.78));

  return (
    <div
      className={`nayzak-logo-lockup nayzak-logo-lockup--${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: variant === 'full' ? 10 : 7,
        userSelect: 'none',
        ...style,
      }}
      dir="ltr"
    >
      {showMascot && (
        <span
          className="nayzak-brand-emblem"
          style={{
            width: emblemSize,
            height: emblemSize,
            borderRadius: Math.round(emblemSize * 0.3),
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            overflow: 'hidden',
          }}
          aria-hidden="true"
        >
          <img
            src={assetUrl('Assets/brand/cast-2026/nayzak-host.webp')}
            alt=""
            draggable="false"
            style={{
              width: '92%',
              height: '92%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </span>
      )}

      <img
        src={assetUrl('Assets/brand/nayzak-games-logo.png')}
        alt="NAYZAK GAMES"
        draggable="false"
        className="nayzak-games-wordmark-img"
        style={{
          height: wordmarkHeight,
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </div>
  );
}
