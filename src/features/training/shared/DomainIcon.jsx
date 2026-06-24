import React from 'react';

/**
 * Line-art iconography for each cognitive domain — shared by the training hub
 * portals and the domain pick screen badge.
 */
export function DomainIconArt({ domainId, color = 'currentColor', strokeWidth = 1.65 }) {
  const sw = strokeWidth;
  const fillSoft = `${color}22`;
  const fillMid = `${color}3a`;

  switch (domainId) {
    case 'attention':
      return (
        <>
          <circle r="14" fill="none" stroke={color} strokeWidth={sw} opacity="0.45" />
          <circle r="8.5" fill="none" stroke={color} strokeWidth={sw} opacity="0.7" />
          <circle r="3.2" fill={color} opacity="0.95" />
          <line x1="-16" y1="0" x2="16" y2="0" stroke={color} strokeWidth={0.9} opacity="0.35" />
          <line x1="0" y1="-16" x2="0" y2="16" stroke={color} strokeWidth={0.9} opacity="0.35" />
        </>
      );
    case 'speed':
      return (
        <>
          <path
            d="M -10 -14 L -2 -4 L -6 -2 L 4 10 L 1 8 L 10 16 L 2 2 L 6 0 Z"
            fill={fillMid}
            stroke={color}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path d="M -14 -6 L -18 -2 M 12 4 L 16 2" stroke={color} strokeWidth={1.1} strokeLinecap="round" opacity="0.55" />
        </>
      );
    case 'memory':
      return [0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((coln) => {
          const cx = (coln - 1) * 7;
          const cy = (row - 1) * 7;
          const on = row === 1 && coln === 1;
          return (
            <rect
              key={`${row}-${coln}`}
              x={cx - 2.8}
              y={cy - 2.8}
              width={5.6}
              height={5.6}
              rx={0.9}
              fill={on ? color : fillSoft}
              opacity={on ? 0.95 : 0.5}
              stroke={color}
              strokeWidth={0.85}
            />
          );
        }),
      );
    case 'language':
      return (
        <>
          <path
            d="M -8 12 L 0 -12 L 8 12 M -5 4 L 5 4"
            fill="none"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M -12 -6 Q -14 -10 -10 -12 M 12 -6 Q 14 -10 10 -12"
            fill="none"
            stroke={color}
            strokeWidth={1}
            strokeLinecap="round"
            opacity="0.45"
          />
        </>
      );
    case 'reasoning':
      return (
        <>
          <circle cx="-10" cy={8} r="3.2" fill={fillMid} stroke={color} strokeWidth={sw} />
          <circle cx={10} cy={8} r="3.2" fill={fillMid} stroke={color} strokeWidth={sw} />
          <circle cx="0" cy={-10} r="3.2" fill={color} stroke={color} strokeWidth={sw} opacity="0.95" />
          <path d="M -10 8 L 0 -10 L 10 8" fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" opacity="0.75" />
        </>
      );
    case 'flexibility':
      return (
        <>
          <path d="M -12 -4 C -4 -12 4 -4 12 -4" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <path d="M 12 4 C 4 12 -4 4 -12 4" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          <path d="M 8 -6 L 12 -4 L 8 -2" fill="none" stroke={color} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M -8 6 L -12 4 L -8 2" fill="none" stroke={color} strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
    default:
      return null;
  }
}

/** Compact badge for the domain pick screen header. */
export function DomainBadge({ domainId, color, size = 72, short }) {
  const iconSize = Math.round(size * 0.52);
  return (
    <div
      aria-hidden="true"
      className="ct-domain-badge"
      style={{
        '--badge-size': `${size}px`,
        '--badge-radius': `${Math.round(size * 0.28)}px`,
        '--badge-color': color,
      }}
    >
      <span className="ct-domain-badge-shine" />
      <svg
        className="ct-domain-badge-icon"
        width={iconSize}
        height={iconSize}
        viewBox="-20 -20 40 40"
        fill="none"
      >
        <DomainIconArt domainId={domainId} color="#fff" strokeWidth={1.7} />
      </svg>
      {short ? <span className="ct-domain-badge-code">{short}</span> : null}
    </div>
  );
}
