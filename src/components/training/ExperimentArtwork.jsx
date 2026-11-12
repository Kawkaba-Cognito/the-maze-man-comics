import React from 'react';

/**
 * High-Fidelity Scientific Vector Artwork for Nayzak Cognitive Labs
 * Modeled after Google Labs (labs.google) AI experiment directory previews.
 * Features:
 * - 60FPS lightweight hardware-accelerated SVG animations (<animate>, <animateTransform>)
 * - Technical telemetry HUDs, coordinate grids, and precision instrument aesthetics
 * - Unique gradient and filter namespace per visual type to prevent multi-card SVG collisions
 * - Ultra-polished vector graphics for all 18 cognitive experiment paradigms
 */

export default function ExperimentArtwork({ visualType, color = '#38bdf8', title }) {
  const c = color;
  const pfx = `art-${visualType || 'default'}`;

  // Shared HUD Header & Footer overlay for high-tech Google Labs aesthetic
  const renderHUD = (label, statLeft, statRight) => (
    <g className="hud-telemetry" pointerEvents="none">
      {/* Precision corner brackets */}
      <path d="M 12 22 L 12 12 L 22 12" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
      <path d="M 298 12 L 308 12 L 308 22" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
      <path d="M 12 158 L 12 168 L 22 168" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
      <path d="M 298 168 L 308 168 L 308 158" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />

      {/* Micro scale ticks */}
      <line x1="160" y1="10" x2="160" y2="15" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="10" y1="90" x2="15" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="305" y1="90" x2="310" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
      <line x1="160" y1="165" x2="160" y2="170" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Top telemetry banner */}
      <text x="24" y="24" fill="rgba(255,255,255,0.4)" fontSize="7.5" fontFamily="'JetBrains Mono', 'Space Mono', monospace" letterSpacing="0.8">
        {label || 'NAYZAK_LABS // EXP_PREVIEW'}
      </text>
      <text x="296" y="24" textAnchor="end" fill={c} fontSize="7.5" fontFamily="'JetBrains Mono', 'Space Mono', monospace" fontWeight="bold" letterSpacing="0.6">
        {statRight || '60Hz // LIVE'}
      </text>

      {/* Bottom telemetry readout */}
      <text x="24" y="165" fill={c} fontSize="7.5" fontFamily="'JetBrains Mono', 'Space Mono', monospace" letterSpacing="0.5">
        {statLeft || 'SYS_CALIBRATION: ACTIVE'}
      </text>
      <text x="296" y="165" textAnchor="end" fill="rgba(255,255,255,0.35)" fontSize="7" fontFamily="'JetBrains Mono', 'Space Mono', monospace">
        LATENCY 0.8ms
      </text>
    </g>
  );

  switch (visualType) {
    // -------------------------------------------------------------------------
    // 01. GRID SCANNER (Cancellation Task - Attention)
    // -------------------------------------------------------------------------
    case 'grid-scanner':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#080c18" />
              <stop offset="100%" stopColor="#03050c" />
            </linearGradient>
            <radialGradient id={`${pfx}-glow`} cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={c} stopOpacity="0.25" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <linearGradient id={`${pfx}-beam`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity="0" />
              <stop offset="50%" stopColor={c} stopOpacity="0.8" />
              <stop offset="100%" stopColor={c} stopOpacity="0" />
            </linearGradient>
            <filter id={`${pfx}-blur`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />
          <circle cx="160" cy="90" r="85" fill={`url(#${pfx}-glow)`} />

          {/* Precision Dot Matrix Grid */}
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 8 }).map((_, col) => {
              const x = 44 + col * 33;
              const y = 46 + r * 28;
              const isTarget = (r === 1 && col === 2) || (r === 2 && col === 5) || (r === 0 && col === 6) || (r === 3 && col === 1);
              return (
                <g key={`grid-${r}-${col}`}>
                  {isTarget ? (
                    <g filter={`url(#${pfx}-blur)`}>
                      {/* Outer pulsing beacon ring */}
                      <circle cx={x} cy={y} r="13" fill="none" stroke={c} strokeWidth="1.2" strokeDasharray="3 3">
                        <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="6s" repeatCount="indefinite" />
                      </circle>
                      <circle cx={x} cy={y} r="18" fill="none" stroke={c} strokeWidth="0.8" opacity="0.4">
                        <animate attributeName="r" values="10;20;10" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                      {/* Target Diamond Core */}
                      <polygon points={`${x},${y - 6} ${x + 6},${y} ${x},${y + 6} ${x - 6},${y}`} fill={c} />
                      <circle cx={x} cy={y} r="2.2" fill="#ffffff" />
                    </g>
                  ) : (
                    <g opacity="0.35">
                      <circle cx={x} cy={y} r="2.5" fill="rgba(255,255,255,0.4)" />
                      <line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                      <line x1={x} y1={y - 4} x2={x} y2={y + 4} stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* Vertical Sweeping Laser Beam with Wash */}
          <g>
            <rect x="20" y="30" width="280" height="20" fill={`url(#${pfx}-beam)`} opacity="0.45">
              <animate attributeName="y" values="30;130;30" dur="3.2s" repeatCount="indefinite" />
            </rect>
            <line x1="20" y1="40" x2="300" y2="40" stroke={c} strokeWidth="2" filter={`url(#${pfx}-blur)`}>
              <animate attributeName="y1" values="40;140;40" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="y2" values="40;140;40" dur="3.2s" repeatCount="indefinite" />
            </line>
            {/* Beam Laser Emitter Nodes on Margins */}
            <circle cx="20" cy="40" r="3.5" fill="#ffffff" stroke={c} strokeWidth="1.5">
              <animate attributeName="cy" values="40;140;40" dur="3.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="40" r="3.5" fill="#ffffff" stroke={c} strokeWidth="1.5">
              <animate attributeName="cy" values="40;140;40" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </g>

          {renderHUD('MESULAM_ARRAY: 32 NODES', 'SCAN_VELOCITY: 320 px/s', 'ACQUIRED [4/4]')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 02. PARTICLE ORBIT (Target Tracking / MOT - Attention)
    // -------------------------------------------------------------------------
    case 'particle-orbit':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#060914" />
              <stop offset="100%" stopColor="#020308" />
            </linearGradient>
            <radialGradient id={`${pfx}-radar`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={c} stopOpacity="0.22" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />
          <circle cx="160" cy="90" r="80" fill={`url(#${pfx}-radar)`} />

          {/* Telemetry Radar Rings & Azimuth Crosshairs */}
          <g opacity="0.3">
            <circle cx="160" cy="90" r="72" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 6" />
            <circle cx="160" cy="90" r="48" fill="none" stroke={c} strokeWidth="1" strokeDasharray="6 6">
              <animateTransform attributeName="transform" type="rotate" from="0 160 90" to="360 160 90" dur="20s" repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="90" r="26" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <line x1="80" y1="90" x2="240" y2="90" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="160" y1="20" x2="160" y2="160" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          </g>

          {/* Dynamic Inter-Node Vector Beam */}
          <line x1="110" y1="70" x2="210" y2="110" stroke={c} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6">
            <animate attributeName="x1" values="100;220;190;90;100" dur="6s" repeatCount="indefinite" />
            <animate attributeName="y1" values="65;80;125;100;65" dur="6s" repeatCount="indefinite" />
            <animate attributeName="x2" values="220;110;140;230;220" dur="7s" repeatCount="indefinite" />
            <animate attributeName="y2" values="115;110;60;80;115" dur="7s" repeatCount="indefinite" />
            <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="1s" repeatCount="indefinite" />
          </line>

          {/* 4 Cued Active Target Nodes */}
          {/* Target Node 01 */}
          <g filter={`url(#${pfx}-glow)`}>
            <circle cx="100" cy="65" r="7.5" fill={c}>
              <animate attributeName="cx" values="100;220;190;90;100" dur="6s" repeatCount="indefinite" />
              <animate attributeName="cy" values="65;80;125;100;65" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="65" r="3" fill="#ffffff">
              <animate attributeName="cx" values="100;220;190;90;100" dur="6s" repeatCount="indefinite" />
              <animate attributeName="cy" values="65;80;125;100;65" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="65" r="14" fill="none" stroke={c} strokeWidth="1" strokeDasharray="3 3">
              <animate attributeName="cx" values="100;220;190;90;100" dur="6s" repeatCount="indefinite" />
              <animate attributeName="cy" values="65;80;125;100;65" dur="6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Target Node 02 */}
          <g filter={`url(#${pfx}-glow)`}>
            <circle cx="220" cy="115" r="6.5" fill={c}>
              <animate attributeName="cx" values="220;110;140;230;220" dur="7s" repeatCount="indefinite" />
              <animate attributeName="cy" values="115;110;60;80;115" dur="7s" repeatCount="indefinite" />
            </circle>
            <circle cx="220" cy="115" r="2.5" fill="#ffffff">
              <animate attributeName="cx" values="220;110;140;230;220" dur="7s" repeatCount="indefinite" />
              <animate attributeName="cy" values="115;110;60;80;115" dur="7s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Target Node 03 */}
          <circle cx="160" cy="50" r="6" fill={c}>
            <animate attributeName="cx" values="160;195;160;125;160" dur="5s" repeatCount="indefinite" />
            <animate attributeName="cy" values="50;90;130;90;50" dur="5s" repeatCount="indefinite" />
          </circle>

          {/* Target Node 04 */}
          <circle cx="130" cy="120" r="5.5" fill={c} opacity="0.9">
            <animate attributeName="cx" values="130;175;200;140;130" dur="6.5s" repeatCount="indefinite" />
            <animate attributeName="cy" values="120;135;95;65;120" dur="6.5s" repeatCount="indefinite" />
          </circle>

          {/* Neutral Distractor Nodes */}
          <circle cx="85" cy="100" r="4.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="235" cy="70" r="4.5" fill="rgba(255,255,255,0.3)" />
          <circle cx="170" cy="140" r="4" fill="rgba(255,255,255,0.25)" />

          {renderHUD('PYLYSHYN_MOT: 4 CUED TARGETS', 'TRACK_COHERENCE: 98.4%', 'LOCK_ON [4/4]')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 03. DOCKING VECTOR (Spaceship Docking - Attention)
    // -------------------------------------------------------------------------
    case 'docking-vector':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#080c16" />
              <stop offset="100%" stopColor="#020409" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Docking Berths / Bays on the Right */}
          {/* Bay 01 (Amber) */}
          <g transform="translate(244, 30)">
            <rect width="52" height="30" rx="5" fill="rgba(232, 172, 78, 0.12)" stroke="#e8ac4e" strokeWidth="1.5" />
            <rect x="4" y="4" width="8" height="22" rx="2" fill="#e8ac4e" opacity="0.6" />
            <text x="32" y="19" textAnchor="middle" fill="#fde68a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">BAY_01</text>
          </g>

          {/* Bay 02 (Cyan) */}
          <g transform="translate(244, 75)">
            <rect width="52" height="30" rx="5" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" strokeWidth="1.5" filter={`url(#${pfx}-glow)`} />
            <rect x="4" y="4" width="8" height="22" rx="2" fill="#38bdf8" opacity="0.9" />
            <text x="32" y="19" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">BAY_02</text>
          </g>

          {/* Bay 03 (Purple) */}
          <g transform="translate(244, 120)">
            <rect width="52" height="30" rx="5" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" strokeWidth="1.5" />
            <rect x="4" y="4" width="8" height="22" rx="2" fill="#a855f7" opacity="0.6" />
            <text x="32" y="19" textAnchor="middle" fill="#e9d5ff" fontSize="8.5" fontFamily="monospace" fontWeight="bold">BAY_03</text>
          </g>

          {/* Guided Approach Vector Spline Paths */}
          <path d="M 25 45 C 100 20, 160 65, 244 45" fill="none" stroke="#e8ac4e" strokeWidth="1.8" strokeDasharray="6 4" opacity="0.7">
            <animate attributeName="stroke-dashoffset" from="0" to="-40" dur="1.2s" repeatCount="indefinite" />
          </path>

          <path d="M 25 105 C 90 145, 160 60, 244 90" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="8 4" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="stroke-dashoffset" from="0" to="-48" dur="1s" repeatCount="indefinite" />
          </path>

          <path d="M 25 145 C 95 125, 175 155, 244 135" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.6">
            <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="1.5s" repeatCount="indefinite" />
          </path>

          {/* Approaching Cybernetic Vessels */}
          {/* Ship 01 (Amber Dart) */}
          <g transform="translate(110, 42)">
            <polygon points="0,-4 14,0 0,4 2,0" fill="#ffffff" stroke="#e8ac4e" strokeWidth="1.2" />
            <circle cx="-3" cy="0" r="3" fill="#e8ac4e" opacity="0.8">
              <animate attributeName="r" values="2;5;2" dur="0.6s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Ship 02 (Cyan Dart on Bay 02 Route) */}
          <g transform="translate(150, 88)">
            <polygon points="0,-6 18,0 0,6 3,0" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" filter={`url(#${pfx}-glow)`} />
            <polygon points="-6,-3 0,0 -6,3" fill="#38bdf8" />
            {/* Plasma Thruster Jet */}
            <line x1="-6" y1="0" x2="-14" y2="0" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round">
              <animate attributeName="x2" values="-10;-18;-10" dur="0.4s" repeatCount="indefinite" />
            </line>
          </g>

          {renderHUD('POSNER_CUE: SPATIAL VECTOR', 'DOCK_CLEARANCE: AUTH', 'SYNC 0.98s')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 04. CODE MATRIX (Speed Match - Speed)
    // -------------------------------------------------------------------------
    case 'code-matrix':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#070a14" />
              <stop offset="100%" stopColor="#020409" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Top Substitution Key Ribbon */}
          <rect x="22" y="26" width="276" height="42" rx="7" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          {['◆', '▲', '⬢', '◈', '✚'].map((sym, i) => {
            const isMatch = i === 2; // Match symbol '⬢'
            const x = 38 + i * 55;
            return (
              <g key={i}>
                {isMatch && (
                  <rect x={x - 4} y="30" width="46" height="34" rx="5" fill={`${c}22`} stroke={c} strokeWidth="1.2" />
                )}
                <text x={x + 19} y="47" textAnchor="middle" fill={isMatch ? '#ffffff' : c} fontSize="14" fontWeight="bold">
                  {sym}
                </text>
                <text x={x + 19} y="60" textAnchor="middle" fill={isMatch ? c : '#94a3b8'} fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                  {i + 1}
                </text>
                {i < 4 && <line x1={x + 48} y1="32" x2={x + 48} y2="62" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />}
              </g>
            );
          })}

          {/* Laser Link from Center Card to Key Slot 3 */}
          <line x1="160" y1="84" x2="160" y2="68" stroke={c} strokeWidth="1.8" strokeDasharray="3 3">
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.6s" repeatCount="indefinite" />
          </line>

          {/* Central Decoding Specimen Card */}
          <g transform="translate(120, 84)">
            <rect width="80" height="66" rx="10" fill="rgba(56, 189, 248, 0.12)" stroke={c} strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            {/* Corner Tech Brackets */}
            <path d="M 6 14 L 6 6 L 14 6" stroke={c} strokeWidth="1.5" fill="none" />
            <path d="M 74 14 L 74 6 L 66 6" stroke={c} strokeWidth="1.5" fill="none" />
            <path d="M 6 52 L 6 60 L 14 60" stroke={c} strokeWidth="1.5" fill="none" />
            <path d="M 74 52 L 74 60 L 66 60" stroke={c} strokeWidth="1.5" fill="none" />

            {/* Target Symbol */}
            <text x="40" y="40" textAnchor="middle" fill="#ffffff" fontSize="28" fontWeight="bold">⬢</text>
            <text x="40" y="56" textAnchor="middle" fill={c} fontSize="9" fontFamily="monospace" fontWeight="bold">
              TAP [ 3 ]
            </text>

            {/* Laser Scanning Line across Card */}
            <line x1="8" y1="36" x2="72" y2="36" stroke={c} strokeWidth="1.5" opacity="0.8">
              <animate attributeName="y1" values="10;56;10" dur="2s" repeatCount="indefinite" />
              <animate attributeName="y2" values="10;56;10" dur="2s" repeatCount="indefinite" />
            </line>
          </g>

          {/* Flanking Micro Data Columns */}
          <g opacity="0.4" fontSize="7" fontFamily="monospace" fill="#94a3b8">
            <text x="35" y="105">0x7F · MATCH</text>
            <text x="35" y="118">0x3A · VERIF</text>
            <text x="35" y="131">0xC4 · VALID</text>
            <text x="245" y="105">LATENCY: 120ms</text>
            <text x="245" y="118">ERRORS: 0.00%</text>
            <text x="245" y="131">STREAK: 18</text>
          </g>

          {renderHUD('DSST_MATRIX: ACTIVE KEY', 'DECODE_SPEED: 1.4 sym/s', 'MATCHED [3] ✓')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 05. TUNNEL VECTOR (Math Gates - Speed)
    // -------------------------------------------------------------------------
    case 'tunnel-vector':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#040714" />
              <stop offset="100%" stopColor="#020308" />
            </linearGradient>
            <radialGradient id={`${pfx}-horizon`} cx="50%" cy="48%" r="40%">
              <stop offset="0%" stopColor={c} stopOpacity="0.45" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />
          <circle cx="160" cy="86" r="65" fill={`url(#${pfx}-horizon)`} />

          {/* Warp Perspective Rays from Horizon */}
          {[-160, -90, -30, 30, 90, 160].map((dx, i) => (
            <line key={`ray-top-${i}`} x1="160" y1="86" x2={160 + dx * 2} y2="0" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
          ))}
          {[-160, -90, -30, 30, 90, 160].map((dx, i) => (
            <line key={`ray-bot-${i}`} x1="160" y1="86" x2={160 + dx * 2} y2="180" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />
          ))}
          <line x1="0" y1="86" x2="320" y2="86" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="0.8" strokeDasharray="4 4" />

          {/* Rushing Concentric Perspective Tunnel Gates */}
          <rect x="135" y="73" width="50" height="26" fill="none" stroke={c} strokeWidth="1" opacity="0.4" />
          <rect x="100" y="55" width="120" height="62" fill="none" stroke={c} strokeWidth="1.4" opacity="0.6" />
          <rect x="50" y="30" width="220" height="112" fill="none" stroke={c} strokeWidth="2" opacity="0.85" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="stroke-width" values="1.8;2.6;1.8" dur="1.2s" repeatCount="indefinite" />
          </rect>

          {/* Top Arithmetic Challenge HUD */}
          <g transform="translate(160, 32)">
            <rect x="-48" y="-12" width="96" height="22" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.2" />
            <text textAnchor="middle" y="4" fill="#ffffff" fontSize="12" fontWeight="800" letterSpacing="1">
              6 × 7 = ?
            </text>
          </g>

          {/* Left Gate (Valid Answer: 42) */}
          <g transform="translate(70, 88)">
            <rect x="-34" y="-18" width="68" height="36" rx="8" fill="rgba(34, 197, 94, 0.18)" stroke="#22c55e" strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            <text textAnchor="middle" y="6" fill="#22c55e" fontSize="16" fontWeight="900">42 ✓</text>
            {/* Dynamic Steering Chevron */}
            <path d="M 0 24 L 6 30 L -6 30 Z" fill="#22c55e">
              <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Right Gate (Invalid Answer: 36) */}
          <g transform="translate(250, 88)">
            <rect x="-34" y="-18" width="68" height="36" rx="8" fill="rgba(239, 68, 68, 0.12)" stroke="#ef4444" strokeWidth="1.5" opacity="0.75" />
            <text textAnchor="middle" y="6" fill="#ef4444" fontSize="16" fontWeight="900">36 ✗</text>
          </g>

          {renderHUD('ARITHMETIC_TUNNEL: WARP_STEER', 'VELOCITY: 520 KTS', 'STEER: LANE_LEFT')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 06. RADAR STRIKE (Intercept - Speed)
    // -------------------------------------------------------------------------
    case 'radar-strike':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#080c14" />
              <stop offset="100%" stopColor="#020306" />
            </linearGradient>
            <radialGradient id={`${pfx}-radar`} cx="50%" cy="90%" r="70%">
              <stop offset="0%" stopColor={c} stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />
          <circle cx="160" cy="165" r="140" fill={`url(#${pfx}-radar)`} />

          {/* Concentric Radar Range Arcs */}
          {[40, 75, 110, 145].map((r, i) => (
            <circle key={i} cx="160" cy="165" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 6" />
          ))}

          {/* Azimuth Radials */}
          {[-60, -30, 0, 30, 60].map((deg, i) => (
            <line
              key={i}
              x1="160"
              y1="165"
              x2={160 + Math.sin((deg * Math.PI) / 180) * 150}
              y2={165 - Math.cos((deg * Math.PI) / 180) * 150}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="0.8"
            />
          ))}

          {/* Rotating Phosphor Radar Sweep Beam */}
          <g>
            <line x1="160" y1="165" x2="160" y2="20" stroke={c} strokeWidth="2" opacity="0.8">
              <animateTransform attributeName="transform" type="rotate" from="-65 160 165" to="65 160 165" dur="2.4s" repeatCount="indefinite" />
            </line>
          </g>

          {/* Ballistic Target Trajectory & Intercept Line */}
          <path d="M 60 40 Q 140 70 215 65" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="160" y1="165" x2="215" y2="65" stroke="#f59e0b" strokeWidth="2.4" strokeDasharray="8 4" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="0.6s" repeatCount="indefinite" />
          </line>

          {/* Target Impact Reticle & Echo Rings */}
          <g transform="translate(215, 65)">
            <circle r="16" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <animate attributeName="r" values="8;20;8" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.2;1" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <circle r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3">
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle r="4" fill="#ef4444" filter={`url(#${pfx}-glow)`} />
            <text x="18" y="4" fill="#f8fafc" fontSize="8.5" fontFamily="monospace" fontWeight="bold">
              LOCK: 14ms
            </text>
          </g>

          {renderHUD('COINCIDENCE_INTERCEPT: 60Hz', 'AZIMUTH: 042° // RNG: 114M', 'STRIKE_LOCK ✓')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 07. STORY FRAMES (Story Time - Memory)
    // -------------------------------------------------------------------------
    case 'story-frames':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0b0817" />
              <stop offset="100%" stopColor="#030209" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* 3 Chronological Story Memory Film Cells */}
          {[
            { num: '01', title: 'ORIGIN', active: false, x: 26, color: '#94a3b8' },
            { num: '02', title: 'TRANSIT', active: true, x: 122, color: c },
            { num: '03', title: 'ARRIVAL', active: false, x: 218, color: '#94a3b8' },
          ].map((panel, i) => (
            <g key={i} transform={`translate(${panel.x}, 32)`}>
              <rect
                width="76"
                height="92"
                rx="8"
                fill="rgba(255,255,255,0.04)"
                stroke={panel.active ? c : 'rgba(255,255,255,0.15)'}
                strokeWidth={panel.active ? '2' : '1'}
                filter={panel.active ? `url(#${pfx}-glow)` : undefined}
              />
              <text x="10" y="18" fill={panel.color} fontSize="10" fontFamily="monospace" fontWeight="bold">
                {panel.num}
              </text>
              <text x="66" y="18" textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="monospace">
                {panel.title}
              </text>

              {/* Graphic Icon Inside Film Cell */}
              <rect x="10" y="26" width="56" height="42" rx="5" fill="rgba(255,255,255,0.06)" />
              {i === 0 && (
                <circle cx="38" cy="47" r="10" fill="none" stroke="#e8ac4e" strokeWidth="2">
                  <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {i === 1 && (
                <g transform="translate(38, 47)">
                  <polygon points="0,-10 9,6 -9,6" fill={c} />
                  <circle cx="0" cy="2" r="2" fill="#ffffff" />
                </g>
              )}
              {i === 2 && (
                <g transform="translate(38, 47)">
                  <rect x="-8" y="-8" width="16" height="16" rx="3" fill="none" stroke="#22c55e" strokeWidth="2" />
                  <circle cx="0" cy="0" r="3" fill="#22c55e" />
                </g>
              )}

              {/* Film Sprocket Perforations */}
              <line x1="12" y1="78" x2="64" y2="78" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeDasharray="4 4" />
            </g>
          ))}

          {/* Interconnecting Chrono-Waveform Bus */}
          <path d="M 26 142 L 294 142" stroke={c} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
          <path d="M 30 142 Q 75 132 120 142 T 210 142 T 290 142" fill="none" stroke={c} strokeWidth="1.2" opacity="0.4" />

          {/* Traveling Chrono-Cursor Token */}
          <circle cx="40" cy="142" r="4.5" fill="#ffffff" stroke={c} strokeWidth="2" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="cx" values="40;160;280;40" dur="4s" repeatCount="indefinite" />
          </circle>

          {renderHUD('EPISODIC_RECALL: TIMELINE SEQUENCE', 'TEMPORAL_ORDER: 3/3', 'SYNC_LOCKED ✓')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 08. MEMORY STREAM (Keep Track - Memory)
    // -------------------------------------------------------------------------
    case 'memory-stream':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0c0717" />
              <stop offset="100%" stopColor="#040209" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Category Memory Registers */}
          {[
            { label: 'FAUNA', word: 'LEOPARD', color: '#a855f7', x: 24 },
            { label: 'SPECTRUM', word: 'COBALT', color: '#38bdf8', x: 120 },
            { label: 'REALMS', word: 'ICELAND', color: '#22c55e', x: 216 },
          ].map((cat, i) => (
            <g key={i} transform={`translate(${cat.x}, 28)`}>
              <rect width="80" height="34" rx="6" fill="rgba(255,255,255,0.04)" stroke={cat.color} strokeWidth="1.2" />
              <text x="40" y="14" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="7" fontFamily="monospace" fontWeight="bold">
                {cat.label}
              </text>
              <text x="40" y="27" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold" letterSpacing="0.5">
                {cat.word}
              </text>
              {/* Active Register Glow on Category 1 */}
              {i === 0 && (
                <circle cx="72" cy="10" r="3" fill="#22c55e" filter={`url(#${pfx}-glow)`}>
                  <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </g>
          ))}

          {/* Central Active Updating Stream Capsule */}
          <g transform="translate(160, 94)">
            <rect x="-70" y="-18" width="140" height="38" rx="19" fill="#1b1233" stroke={c} strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            <text textAnchor="middle" y="6" fill="#ffffff" fontSize="15" fontWeight="900" letterSpacing="2">
              LEOPARD
            </text>
            <text textAnchor="middle" y="-22" fill={c} fontSize="8" fontFamily="monospace" fontWeight="bold">
              ▲ INCOMING REFRESH TOKEN
            </text>
          </g>

          {/* Data Conduits Feeding the Register */}
          <line x1="64" y1="62" x2="160" y2="76" stroke={c} strokeWidth="1.5" strokeDasharray="4 3">
            <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="0.8s" repeatCount="indefinite" />
          </line>

          {/* Inbound Tokens Queue on Bottom */}
          <g transform="translate(160, 142)" opacity="0.5" fontSize="8" fontFamily="monospace" fill="#cbd5e1" textAnchor="middle">
            <text>QUEUE: [ ORBIT ] → [ EMERALD ] → [ FALCON ]</text>
          </g>

          {renderHUD('YNTEMA_BUFFER: WORKING MEMORY', 'UPDATE_HZ: 0.8s', 'CAPACITY: 3/3')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 09. BOX GRID (Pair Match - Memory / CANTAB PAL)
    // -------------------------------------------------------------------------
    case 'box-grid':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#090614" />
              <stop offset="100%" stopColor="#030208" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Laser Memory Thread Connecting Matching Pods */}
          <line x1="75" y1="58" x2="235" y2="122" stroke={c} strokeWidth="2" strokeDasharray="6 4" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="1s" repeatCount="indefinite" />
          </line>

          {/* Constellation of Spatial Memory Pods */}
          {[
            { cx: 75, cy: 58, sym: '✦', open: true },
            { cx: 160, cy: 44, sym: '', open: false },
            { cx: 245, cy: 58, sym: '', open: false },
            { cx: 95, cy: 122, sym: '', open: false },
            { cx: 170, cy: 130, sym: '', open: false },
            { cx: 235, cy: 122, sym: '✦', open: true },
          ].map((box, i) => (
            <g key={i}>
              <rect
                x={box.cx - 24}
                y={box.cy - 24}
                width="48"
                height="48"
                rx="10"
                fill={box.open ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255,255,255,0.04)'}
                stroke={box.open ? c : 'rgba(255,255,255,0.15)'}
                strokeWidth={box.open ? '2' : '1'}
                filter={box.open ? `url(#${pfx}-glow)` : undefined}
              />
              {box.open ? (
                <>
                  <text x={box.cx} y={box.cy + 7} textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="bold">
                    {box.sym}
                  </text>
                  <circle cx={box.cx} cy={box.cy} r="18" fill="none" stroke={c} strokeWidth="1" opacity="0.6">
                    <animate attributeName="r" values="14;22;14" dur="2s" repeatCount="indefinite" />
                  </circle>
                </>
              ) : (
                <circle cx={box.cx} cy={box.cy} r="3" fill="rgba(255,255,255,0.25)" />
              )}
            </g>
          ))}

          {renderHUD('CANTAB_PAL: SPATIAL PATTERNS', 'LOCATIONS_MATCHED: 2/6', 'RECALL_ACC: 100%')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 10. WORD LATTICE (Word Maze - Language)
    // -------------------------------------------------------------------------
    case 'word-lattice':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#041209" />
              <stop offset="100%" stopColor="#020603" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Trace Vector Circuit Connecting 'P-A-T-H' */}
          <path d="M 65 75 L 125 50 L 195 95 L 255 70" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="stroke-dasharray" values="100 0; 20 20; 100 0" dur="4s" repeatCount="indefinite" />
          </path>

          {/* Letter Capsules */}
          {[
            { char: 'P', x: 65, y: 75, active: true },
            { char: 'A', x: 125, y: 50, active: true },
            { char: 'T', x: 195, y: 95, active: true },
            { char: 'H', x: 255, y: 70, active: true },
            { char: 'R', x: 65, y: 125, active: false },
            { char: 'M', x: 135, y: 125, active: false },
            { char: 'E', x: 200, y: 42, active: false },
            { char: 'O', x: 260, y: 125, active: false },
          ].map((node, i) => (
            <g key={i} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x="-19"
                y="-19"
                width="38"
                height="38"
                rx="8"
                fill={node.active ? 'rgba(34, 197, 94, 0.25)' : 'rgba(255,255,255,0.04)'}
                stroke={node.active ? '#22c55e' : 'rgba(255,255,255,0.15)'}
                strokeWidth={node.active ? '2' : '1'}
                filter={node.active ? `url(#${pfx}-glow)` : undefined}
              />
              <text textAnchor="middle" y="6" fill="#ffffff" fontSize="16" fontWeight="bold">
                {node.char}
              </text>
            </g>
          ))}

          {/* Word Formed Banner */}
          <g transform="translate(160, 142)">
            <rect x="-65" y="-12" width="130" height="24" rx="12" fill="#052e16" stroke="#22c55e" strokeWidth="1.2" />
            <text textAnchor="middle" y="4" fill="#86efac" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
              WORD FOUND: PATH (+180)
            </text>
          </g>

          {renderHUD('LEXICAL_MATRIX: CONTIGUOUS PATH', 'VOCAB_DENSITY: 88%', 'LEXICON: EN')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 11. SYNAPSE NETWORK (Word Links - Language)
    // -------------------------------------------------------------------------
    case 'synapse-network':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#05140b" />
              <stop offset="100%" stopColor="#020603" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Axon Fibers Linking Synaptic Terminals */}
          <path d="M 80 88 C 120 40, 200 40, 240 88" fill="none" stroke="#22c55e" strokeWidth="1.8" opacity="0.6" />
          <path d="M 80 88 C 120 136, 200 136, 240 88" fill="none" stroke="#22c55e" strokeWidth="1.8" opacity="0.6" />
          <line x1="80" y1="88" x2="240" y2="88" stroke="#22c55e" strokeWidth="2.5" filter={`url(#${pfx}-glow)`} />

          {/* Traveling Action Potential Pulse */}
          <circle cx="80" cy="88" r="4.5" fill="#ffffff" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="cx" values="80;240;80" dur="2.4s" repeatCount="indefinite" />
          </circle>

          {/* Central Synaptic Discharge Wave */}
          <circle cx="160" cy="88" r="16" fill="none" stroke="#86efac" strokeWidth="1.2">
            <animate attributeName="r" values="6;28;6" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2s" repeatCount="indefinite" />
          </circle>

          {/* Major Semantic Nodes */}
          <g transform="translate(80, 88)">
            <circle r="25" fill="#052e16" stroke="#22c55e" strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10.5" fontWeight="bold">SWIFT</text>
          </g>

          <g transform="translate(240, 88)">
            <circle r="25" fill="#052e16" stroke="#22c55e" strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            <text textAnchor="middle" y="4" fill="#ffffff" fontSize="10.5" fontWeight="bold">FAST</text>
          </g>

          <g transform="translate(160, 48)">
            <circle r="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <text textAnchor="middle" y="3.5" fill="#94a3b8" fontSize="8" fontWeight="bold">RAPID</text>
          </g>

          <g transform="translate(160, 128)">
            <circle r="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            <text textAnchor="middle" y="3.5" fill="#94a3b8" fontSize="8" fontWeight="bold">QUICK</text>
          </g>

          {renderHUD('SEMANTIC_SYNAPSE: LATENCY DECISION', 'AFFINITY: 99.4% [SYNONYM]', 'ACTION: +120mV')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 12. KNOWLEDGE STAIRS (Knowledge Staircase - Language)
    // -------------------------------------------------------------------------
    case 'knowledge-stairs':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#05120a" />
              <stop offset="100%" stopColor="#020503" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Ascending Quantum Isometric Stairs */}
          {[
            { step: 1, x: 40, y: 136, h: 26 },
            { step: 2, x: 88, y: 114, h: 48 },
            { step: 3, x: 136, y: 92, h: 70 },
            { step: 4, x: 184, y: 70, h: 92 },
            { step: 5, x: 232, y: 48, h: 114 },
          ].map((st, i) => (
            <g key={i}>
              {/* Vertical Platform Body */}
              <rect x={st.x} y={st.y} width="44" height={st.h} fill="rgba(34, 197, 94, 0.12)" stroke="#22c55e" strokeWidth="1.2" />
              {/* Glowing Tread Surface */}
              <rect x={st.x} y={st.y} width="44" height="6" fill="#22c55e" opacity="0.6" />
              <text x={st.x + 22} y={st.y + 20} textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
                L{st.step}
              </text>
            </g>
          ))}

          {/* Ascending Hero Beacon Orb on Step 4 */}
          <g transform="translate(206, 54)">
            <circle r="9" fill="#ffffff" filter={`url(#${pfx}-glow)`}>
              <animate attributeName="cy" values="0;-6;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="15" fill="none" stroke="#22c55e" strokeWidth="1.5">
              <animate attributeName="cy" values="0;-6;0" dur="2s" repeatCount="indefinite" />
              <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Apex Goal Crest on Step 5 */}
          <g transform="translate(254, 34)">
            <polygon points="0,-8 7,0 0,8 -7,0" fill="#fbbf24" filter={`url(#${pfx}-glow)`}>
              <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
            </polygon>
          </g>

          {renderHUD('CRYSTALLIZED_INDEX: KNOWLEDGE ASCENT', 'STREAK: 14 VALIDATED', 'LEVEL 05')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 13. SLIDING BLOCKS (Block Escape - Reasoning / Rush Hour)
    // -------------------------------------------------------------------------
    case 'sliding-blocks':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#140a05" />
              <stop offset="100%" stopColor="#060302" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* 6x6 Coordinate Puzzle Tray */}
          <rect x="65" y="24" width="190" height="132" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" />

          {/* Exit Laser Aperture with Chevrons */}
          <g transform="translate(255, 78)">
            <line x1="0" y1="-16" x2="0" y2="16" stroke="#22c55e" strokeWidth="2.5" />
            <path d="M 6 0 L 18 0 M 12 -6 L 18 0 L 12 6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <animate attributeName="transform" type="translate" values="0,0; 6,0; 0,0" dur="1.2s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Primary Crimson Escape Shuttle */}
          <g filter={`url(#${pfx}-glow)`}>
            <rect x="100" y="72" width="65" height="26" rx="6" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5">
              <animate attributeName="x" values="100;140;100" dur="2.8s" repeatCount="indefinite" />
            </rect>
            {/* Plasma Thruster on Red Vehicle */}
            <circle cx="104" cy="85" r="3" fill="#fbbf24">
              <animate attributeName="cx" values="104;144;104" dur="2.8s" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Obstacle Blocks */}
          <rect x="180" y="32" width="26" height="66" rx="6" fill="rgba(249, 115, 22, 0.4)" stroke="#f97316" strokeWidth="1.2" />
          <rect x="140" y="106" width="66" height="26" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <rect x="75" y="32" width="26" height="66" rx="6" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {renderHUD('SPATIAL_PLANNING: TOWER OF LONDON', 'PATH_STEPS: 12 MOVES', 'EXIT_VECTOR: OPEN')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 14. PORTAL SCANNER (The Gatekeeper - Reasoning)
    // -------------------------------------------------------------------------
    case 'portal-scanner':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#150a04" />
              <stop offset="100%" stopColor="#050201" />
            </linearGradient>
            <radialGradient id={`${pfx}-core`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Biometric Holographic Portal Rings */}
          <circle cx="160" cy="88" r="62" fill={`url(#${pfx}-core)`} />

          {/* Outer Rotating Iris Ring */}
          <circle cx="160" cy="88" r="62" fill="none" stroke="#f97316" strokeWidth="1.8" strokeDasharray="8 6">
            <animateTransform attributeName="transform" type="rotate" from="0 160 88" to="360 160 88" dur="16s" repeatCount="indefinite" />
          </circle>

          {/* Mid Counter-Rotating Ring */}
          <circle cx="160" cy="88" r="44" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="14 8">
            <animateTransform attributeName="transform" type="rotate" from="360 160 88" to="0 160 88" dur="10s" repeatCount="indefinite" />
          </circle>

          {/* Inner Biometric Core */}
          <circle cx="160" cy="88" r="28" fill="rgba(249, 115, 22, 0.2)" stroke="#ffffff" strokeWidth="1.2" />

          {/* Sweeping Vertical Biometric Laser Beam */}
          <line x1="160" y1="28" x2="160" y2="148" stroke="#ffffff" strokeWidth="1.8" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="x1" values="115;205;115" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="x2" values="115;205;115" dur="2.2s" repeatCount="indefinite" />
          </line>

          {/* Target Candidate Outline */}
          <polygon points="160,76 172,96 148,96" fill="none" stroke="#ffffff" strokeWidth="1.5" />

          {renderHUD('INDUCTIVE_LOGIC: RULE DISCOVERY', 'RULE: [SHAPE=TRIANGLE & ODD]', 'ADMIT: GRANTED')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 15. DETECTIVE DOSSIER (Detective Deduction - Reasoning)
    // -------------------------------------------------------------------------
    case 'detective-dossier':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#120c06" />
              <stop offset="100%" stopColor="#050302" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Left Dossier (Truth) */}
          <g transform="translate(36, 28)">
            <rect width="112" height="114" rx="8" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.2" />
            <circle cx="56" cy="38" r="16" fill="rgba(255,255,255,0.08)" />
            <line x1="24" y1="68" x2="88" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="80" x2="72" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
            <rect x="24" y="92" width="64" height="16" rx="4" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1" />
            <text x="56" y="103" textAnchor="middle" fill="#22c55e" fontSize="8.5" fontWeight="bold">TRUTH ✓</text>
          </g>

          {/* Right Dossier (Contradiction / Lie) */}
          <g transform="translate(172, 28)">
            <rect width="112" height="114" rx="8" fill="rgba(239, 68, 68, 0.08)" stroke="#ef4444" strokeWidth="1.8" filter={`url(#${pfx}-glow)`} />
            <circle cx="56" cy="38" r="16" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1" />
            <line x1="24" y1="68" x2="88" y2="68" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
            <line x1="24" y1="80" x2="72" y2="80" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="92" width="76" height="16" rx="4" fill="rgba(239, 68, 68, 0.3)" stroke="#ef4444" strokeWidth="1" />
            <text x="56" y="103" textAnchor="middle" fill="#fca5a5" fontSize="8.5" fontWeight="bold">LIE DETECTED ✗</text>
          </g>

          {/* Oscilloscope Polygraph Wave between dossiers */}
          <path d="M 148 85 Q 160 65 172 85" fill="none" stroke="#f59e0b" strokeWidth="1.8" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="d" values="M 148 85 Q 160 65 172 85; M 148 85 Q 160 105 172 85; M 148 85 Q 160 65 172 85" dur="1.5s" repeatCount="indefinite" />
          </path>

          {renderHUD('KNIGHTS_KNAVES: DEDUCTIVE LOGIC', 'CONTRADICTION: NODE_B', 'STATUS: SOLVED')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 16. MIRROR SPLIT (Mirror World - Flexibility)
    // -------------------------------------------------------------------------
    case 'mirror-split':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#150613" />
              <stop offset="100%" stopColor="#040104" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Central Prismatic Dividing Laser Axis */}
          <line x1="160" y1="0" x2="160" y2="180" stroke="#ec4899" strokeWidth="2" strokeDasharray="5 5" filter={`url(#${pfx}-glow)`}>
            <animate attributeName="stroke-dashoffset" from="0" to="-30" dur="1s" repeatCount="indefinite" />
          </line>

          {/* Normal Input Side (Left) */}
          <g transform="translate(90, 88)">
            <circle r="36" fill="rgba(56, 189, 248, 0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <path d="M -16 0 L 16 0 M 6 -8 L 16 0 L 6 8" stroke="#38bdf8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <animate attributeName="transform" type="translate" values="0,0; 6,0; 0,0" dur="1.8s" repeatCount="indefinite" />
            </path>
            <text y="24" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
              INPUT: RIGHT [→]
            </text>
          </g>

          {/* Inverted Reflection Side (Right) */}
          <g transform="translate(230, 88)">
            <circle r="36" fill="rgba(236, 72, 153, 0.2)" stroke="#ec4899" strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            <path d="M 16 0 L -16 0 M -6 -8 L -16 0 L -6 8" stroke="#ec4899" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <animate attributeName="transform" type="translate" values="0,0; -6,0; 0,0" dur="1.8s" repeatCount="indefinite" />
            </path>
            <text y="24" textAnchor="middle" fill="#ec4899" fontSize="8" fontFamily="monospace" fontWeight="bold">
              MOTOR: LEFT [←]
            </text>
          </g>

          {renderHUD('PRISM_ADAPTATION: MOTOR INVERT', 'COORDINATE_SHIFT: X = -X', 'CALIBRATED')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 17. SWITCH MATRIX (Task Switch - Flexibility)
    // -------------------------------------------------------------------------
    case 'switch-matrix':
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#140614" />
              <stop offset="100%" stopColor="#040104" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* Dual Rule Processors (Top) */}
          {/* Active Rule: Color */}
          <g transform="translate(36, 26)">
            <rect width="114" height="38" rx="8" fill="rgba(236, 72, 153, 0.25)" stroke="#ec4899" strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            <text x="57" y="24" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
              RULE: COLOR
            </text>
            <circle cx="100" cy="14" r="3" fill="#22c55e" />
          </g>

          {/* Standby Rule: Shape */}
          <g transform="translate(170, 26)">
            <rect width="114" height="38" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <text x="57" y="24" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="bold">
              RULE: SHAPE
            </text>
          </g>

          {/* Central Stimulus Test Module */}
          <g transform="translate(120, 78)">
            <rect width="80" height="74" rx="12" fill="#1e1022" stroke={c} strokeWidth="2" filter={`url(#${pfx}-glow)`} />
            {/* Blue Triangle Stimulus Shape */}
            <polygon points="40,16 66,54 14,54" fill="#38bdf8" />
            <text x="40" y="66" textAnchor="middle" fill="#f8fafc" fontSize="8" fontFamily="monospace">
              SORT BY COLOR →
            </text>
          </g>

          {/* Conduits Linking to Processor */}
          <line x1="93" y1="64" x2="135" y2="78" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 3">
            <animate attributeName="stroke-dashoffset" from="0" to="-12" dur="0.8s" repeatCount="indefinite" />
          </line>

          {renderHUD('ROGERS_MONSELL: TASK SWITCH', 'SWITCH_COST_LATENCY: 22ms', 'SET: COLOR')}
        </svg>
      );

    // -------------------------------------------------------------------------
    // 18. 3D MAZE (Puzzle Studio - Puzzles & Spatial Enigmas)
    // -------------------------------------------------------------------------
    case '3d-maze':
    default:
      return (
        <svg viewBox="0 0 320 180" className="exp-art-svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id={`${pfx}-bg`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#120e06" />
              <stop offset="100%" stopColor="#040301" />
            </linearGradient>
            <filter id={`${pfx}-glow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect width="320" height="180" fill={`url(#${pfx}-bg)`} />

          {/* 3D Isometric Labyrinth Structure */}
          <g transform="translate(160, 92)">
            {/* Isometric Base Floor Plane */}
            <polygon points="0,-65 80,-20 0,25 -80,-20" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" strokeWidth="1.5" />
            <polygon points="-80,-20 0,25 0,72 -80,27" fill="rgba(251, 191, 36, 0.25)" stroke="#fbbf24" strokeWidth="1.2" />
            <polygon points="0,25 80,-20 80,27 0,72" fill="rgba(251, 191, 36, 0.35)" stroke="#fbbf24" strokeWidth="1.2" />

            {/* Interior Maze Labyrinth Corridors */}
            <line x1="-40" y1="-2" x2="0" y2="-25" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="0" y1="-25" x2="40" y2="-2" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="0" y1="-25" x2="0" y2="5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

            {/* Navigating Energy Orb Beacon */}
            <g>
              <circle cx="0" cy="-2" r="7.5" fill="#fbbf24" filter={`url(#${pfx}-glow)`}>
                <animate attributeName="cx" values="-35;0;35;0;-35" dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="0;-22;-2;-22;0" dur="4.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="0" cy="-2" r="3" fill="#ffffff">
                <animate attributeName="cx" values="-35;0;35;0;-35" dur="4.5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="0;-22;-2;-22;0" dur="4.5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Apex Waypoint Diamond */}
            <polygon points="0,-54 6,-46 0,-38 -6,-46" fill="#ffffff" filter={`url(#${pfx}-glow)`} />
          </g>

          {renderHUD('SPATIAL_LABYRINTH: 3D TOPOLOGY', 'PATH_SEARCH: 88% SOLVED', 'FREE_PLAY')}
        </svg>
      );
  }
}
