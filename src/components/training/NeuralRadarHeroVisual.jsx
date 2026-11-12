import React from 'react';
import { assetUrl } from '../../lib/assetUrl';

/**
 * High-Fidelity 6-Pillar Neural Radar Hero Visual
 * Inspired by Google Labs (labs.google) scientific telemetry and precision instruments.
 *
 * Features:
 * - 6-axis concentric hexagonal calibrated distance grid (20%, 40%, 60%, 80%, 100%)
 * - 6 radial axes with degree indicators (000°, 060°, 120°, 180°, 240°, 300°)
 * - Bilingual labels at each vertex (Memory, Attention, Speed, Reasoning, Flexibility, Language)
 * - 60FPS lightweight SVG <animate> for a subtle organic breathing neural profile
 * - High-contrast obsidian/slate viewport suitable for both light and dark backgrounds
 * - Rotating radar scanning ray and expanding core echo ripples
 * - Dignified scientific director badge integration for Coach Nayzak
 */
export default function NeuralRadarHeroVisual({ isAr = false, coach, onLaunch, onOpenFamily }) {
  // Pre-calculated Hexagonal distance rings for cx=180, cy=158, R=86
  const rings = [
    { pct: '100%', points: '180,72 254.48,115 254.48,201 180,244 105.52,201 105.52,115', stroke: 'rgba(245, 158, 11, 0.35)', strokeWidth: 1.2, dash: 'none' },
    { pct: '80%',  points: '180,89.2 239.58,123.6 239.58,192.4 180,226.8 120.42,192.4 120.42,123.6', stroke: 'rgba(148, 163, 184, 0.22)', strokeWidth: 1, dash: '3 3' },
    { pct: '60%',  points: '180,106.4 224.69,132.2 224.69,183.8 180,209.6 135.31,183.8 135.31,132.2', stroke: 'rgba(148, 163, 184, 0.18)', strokeWidth: 1, dash: 'none' },
    { pct: '40%',  points: '180,123.6 209.79,140.8 209.79,175.2 180,192.4 150.21,175.2 150.21,140.8', stroke: 'rgba(148, 163, 184, 0.15)', strokeWidth: 1, dash: '3 3' },
    { pct: '20%',  points: '180,140.8 194.9,149.4 194.9,166.6 180,175.2 165.1,166.6 165.1,149.4', stroke: 'rgba(148, 163, 184, 0.12)', strokeWidth: 1, dash: 'none' },
  ];

  // 6 Radial axes endpoints from center (180, 158) to outer ring (R=86)
  const axes = [
    { deg: '000°', x2: 180, y2: 72 },
    { deg: '060°', x2: 254.48, y2: 115 },
    { deg: '120°', x2: 254.48, y2: 201 },
    { deg: '180°', x2: 180, y2: 244 },
    { deg: '240°', x2: 105.52, y2: 201 },
    { deg: '300°', x2: 105.52, y2: 115 },
  ];

  // Breathing Neural Profile Morph States (60FPS native SVG animate)
  const ptsA = '180,82.32 250.01,117.58 247.03,196.70 180,237.12 115.95,194.98 109.25,117.15';
  const ptsB = '180,77.16 245.54,120.16 251.50,199.28 180,231.96 111.48,197.56 113.72,119.73';
  const ptsC = '180,80.60 251.50,116.72 245.54,195.84 180,239.70 114.46,195.84 110.00,117.58';

  // 6 Cognitive Pillars with Nayzak Family Guardians
  const pillars = [
    {
      id: 'memory',
      en: 'Memory',
      ar: 'الذاكرة',
      guardianEn: 'Sami',
      guardianAr: 'سامي',
      color: '#a855f7',
      score: '92%',
      x: 180,
      y: 42,
      anchor: 'middle',
      nodeX: 180,
      nodeY: 82.32,
    },
    {
      id: 'attention',
      en: 'Focus',
      ar: 'الانتباه',
      guardianEn: 'Zayd',
      guardianAr: 'زيد',
      color: '#f59e0b',
      score: '94%',
      x: 272,
      y: 108,
      anchor: 'start',
      nodeX: 250.01,
      nodeY: 117.58,
    },
    {
      id: 'speed',
      en: 'Speed',
      ar: 'السرعة',
      guardianEn: 'Rima',
      guardianAr: 'ريما',
      color: '#0284c7',
      score: '90%',
      x: 272,
      y: 208,
      anchor: 'start',
      nodeX: 247.03,
      nodeY: 196.70,
    },
    {
      id: 'reasoning',
      en: 'Reasoning',
      ar: 'الاستدلال',
      guardianEn: 'Hakim',
      guardianAr: 'حكيم',
      color: '#f97316',
      score: '92%',
      x: 180,
      y: 276,
      anchor: 'middle',
      nodeX: 180,
      nodeY: 237.12,
    },
    {
      id: 'flexibility',
      en: 'Flexibility',
      ar: 'المرونة',
      guardianEn: 'Yasmin',
      guardianAr: 'ياسمين',
      color: '#ec4899',
      score: '88%',
      x: 88,
      y: 208,
      anchor: 'end',
      nodeX: 115.95,
      nodeY: 194.98,
    },
    {
      id: 'language',
      en: 'Language',
      ar: 'اللغة',
      guardianEn: 'Layan',
      guardianAr: 'ليان',
      color: '#16a34a',
      score: '95%',
      x: 88,
      y: 108,
      anchor: 'end',
      nodeX: 109.25,
      nodeY: 117.15,
    },
  ];

  return (
    <div className="neural-radar-hero-wrap" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Precision Instrument Shell */}
      <div
        className="neural-radar-shell"
        onClick={() => onLaunch?.()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onLaunch?.();
          }
        }}
        title={isAr ? 'اضغط لبدء التقييم الشامل لمقياس نيزك' : 'Click to launch Nayzak Core Cognitive Assessment'}
      >
        <svg
          className="neural-radar-svg"
          viewBox="0 0 360 320"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            {/* Obsidian Viewport Gradient */}
            <linearGradient id="nrhBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b1120" />
              <stop offset="50%" stopColor="#070c18" />
              <stop offset="100%" stopColor="#03060d" />
            </linearGradient>

            {/* Neural Polygon Harmonic Gradient */}
            <linearGradient id="nrhPolyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#6366f1" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.40" />
            </linearGradient>

            {/* Core Ambient Glow */}
            <radialGradient id="nrhCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.10" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Neon Glow Filter */}
            <filter id="nrhGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Precision Dark Instrument Canvas */}
          <rect width="360" height="320" rx="20" fill="url(#nrhBgGrad)" stroke="rgba(245, 158, 11, 0.28)" strokeWidth="1.2" />

          {/* Ambient Core Radial Halo */}
          <circle cx="180" cy="158" r="95" fill="url(#nrhCoreGlow)" />

          {/* Corner Framing Brackets */}
          <path d="M 14 26 L 14 14 L 26 14" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
          <path d="M 346 26 L 346 14 L 334 14" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
          <path d="M 14 294 L 14 306 L 26 306" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />
          <path d="M 346 294 L 346 306 L 334 306" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" />

          {/* Header Telemetry Readouts */}
          <text x="24" y="24" fill="rgba(255,255,255,0.4)" fontSize="7" fontFamily="'JetBrains Mono', 'Space Mono', monospace" letterSpacing="0.8">
            NAYZAK_INDEX // 6_AXIS_BENCHMARK
          </text>
          <text x="336" y="24" textAnchor="end" fill="#f59e0b" fontSize="7" fontFamily="'JetBrains Mono', 'Space Mono', monospace" fontWeight="bold">
            STATUS: ACTIVE // 60Hz
          </text>

          {/* Concentric Hexagonal Calibrated Distance Grid Rings */}
          {rings.map((r, i) => (
            <g key={i}>
              <polygon
                points={r.points}
                fill="none"
                stroke={r.stroke}
                strokeWidth={r.strokeWidth}
                strokeDasharray={r.dash !== 'none' ? r.dash : undefined}
              />
              {/* Scale Ticks on Vertical Axis */}
              <text
                x="184"
                y={72 + i * 17.2 + 8}
                fill="rgba(255,255,255,0.3)"
                fontSize="6"
                fontFamily="monospace"
              >
                {r.pct}
              </text>
            </g>
          ))}

          {/* 6 Radial Axes Lines & Degree Indicators */}
          {axes.map((ax, i) => (
            <g key={i}>
              <line
                x1="180"
                y1="158"
                x2={ax.x2}
                y2={ax.y2}
                stroke="rgba(245, 158, 11, 0.28)"
                strokeWidth="1"
              />
              {/* Outer Degree Mark */}
              <circle cx={ax.x2} cy={ax.y2} r="1.8" fill="#f59e0b" />
            </g>
          ))}

          {/* Animated 360° Radar Scanning Ray */}
          <g>
            <line
              x1="180"
              y1="158"
              x2="180"
              y2="72"
              stroke="#0284c7"
              strokeWidth="1.5"
              opacity="0.6"
              filter="url(#nrhGlow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 180 158"
                to="360 180 158"
                dur="8s"
                repeatCount="indefinite"
              />
            </line>
          </g>

          {/* Smooth Breathing Calibrated Neural Profile Polygon */}
          <polygon
            points={ptsA}
            fill="url(#nrhPolyGrad)"
            stroke="#0284c7"
            strokeWidth="2.2"
            filter="url(#nrhGlow)"
          >
            <animate
              attributeName="points"
              values={`${ptsA}; ${ptsB}; ${ptsC}; ${ptsA}`}
              dur="6s"
              repeatCount="indefinite"
            />
          </polygon>

          {/* Expanding Core Pulse Rings */}
          <circle cx="180" cy="158" r="6" fill="none" stroke="#0284c7" strokeWidth="1.2">
            <animate attributeName="r" values="6;46" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="180" cy="158" r="6" fill="none" stroke="#f59e0b" strokeWidth="1">
            <animate attributeName="r" values="6;46" dur="3s" begin="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="3s" begin="1.5s" repeatCount="indefinite" />
          </circle>

          {/* Center Core Node */}
          <circle cx="180" cy="158" r="7.5" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.8" />
          <circle cx="180" cy="158" r="3.2" fill="#38bdf8" />

          {/* 6 Node Vertex Points with Dynamic Micro-Pulses */}
          {pillars.map((p, i) => (
            <g key={i}>
              <circle cx={p.nodeX} cy={p.nodeY} r="4.2" fill={p.color} filter="url(#nrhGlow)">
                <animate attributeName="r" values="3.6;5.2;3.6" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx={p.nodeX} cy={p.nodeY} r="1.8" fill="#ffffff" />
            </g>
          ))}

          {/* Bilingual Pillar Labels at Vertices */}
          {pillars.map((p, i) => {
            const labelPrimary = isAr ? p.ar : p.en;
            const labelSub = isAr ? p.en : p.ar;
            return (
              <g key={`lbl-${i}`} transform={`translate(${p.x}, ${p.y})`}>
                {/* Degree indicator pill */}
                <text
                  x="0"
                  y="-10"
                  textAnchor={p.anchor}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="6.5"
                  fontFamily="'JetBrains Mono', 'Space Mono', monospace"
                >
                  {axes[i].deg}
                </text>
                {/* Primary pillar name with Guardian */}
                <text
                  x="0"
                  y="2"
                  textAnchor={p.anchor}
                  fill="#ffffff"
                  fontSize="9.2"
                  fontWeight="bold"
                  letterSpacing="0.3"
                >
                  {labelPrimary} {isAr ? `• ${p.guardianAr}` : `• ${p.guardianEn}`}
                </text>
                {/* Secondary sub-name & benchmark score */}
                <text
                  x="0"
                  y="12"
                  textAnchor={p.anchor}
                  fill={p.color}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {labelSub} • {p.score}
                </text>
              </g>
            );
          })}

          {/* Bottom Telemetry Readout */}
          <text x="24" y="306" fill="rgba(255,255,255,0.4)" fontSize="6.8" fontFamily="'JetBrains Mono', 'Space Mono', monospace">
            STANDARDIZED: N=10,000+ // CC0 VALIDATED
          </text>
          <text x="336" y="306" textAnchor="end" fill="#38bdf8" fontSize="7.2" fontFamily="'JetBrains Mono', 'Space Mono', monospace" fontWeight="bold">
            COMPOSITE SCORE: 92.4 / 100
          </text>
        </svg>

        {/* Hover/Tap Launch Prompt Banner */}
        <div className="neural-radar-action-hint">
          <span className="neural-radar-hint-dot" />
          <span>{isAr ? 'اضغط للمعايرة الكاملة للركائز الستة' : 'Click to run 6-Pillar Neural Calibration'}</span>
          <span className="neural-radar-hint-arrow">{isAr ? '←' : '→'}</span>
        </div>
      </div>

      {/* Dignified Coach Nayzak Director Badge Integration with Cartoon Aesthetic */}
      {coach && (
        <div
          className="neural-radar-coach-card"
          onClick={onOpenFamily}
          role={onOpenFamily ? 'button' : undefined}
          tabIndex={onOpenFamily ? 0 : undefined}
          title={isAr ? 'اضغط لعرض قصة نيزك وعائلته وحراس العقل' : 'Click to explore Nayzak Lore'}
          style={{ cursor: onOpenFamily ? 'pointer' : 'default' }}
        >
          {/* Cartoon Nayzak Presenter Figure */}
          <div className="neural-coach-avatar-ring">
            <img
              src={assetUrl('Assets/cartoon/nayzak_unified_presenter.png')}
              alt={isAr ? 'الكابتن نيزك' : 'Captain Nayzak'}
              className="neural-coach-cartoon-img"
            />
            <span className="neural-coach-status-beacon" />
          </div>

          <div className="neural-coach-meta">
            {/* Tilted Dashed Comic Stamp from the Video */}
            <div className="bendia-comic-stamp bendia-comic-stamp-sm">
              <span className="bendia-stamp-main">SCIENTIFIC BENCHMARK</span>
              <span className="bendia-stamp-sub">
                {isAr ? 'بروتوكول علمي معتمد' : 'Verified Clinical Standard'}
              </span>
            </div>

            <div className="neural-coach-header-row">
              <div className="neural-coach-name">
                {isAr ? coach.nameAr : coach.nameEn}
              </div>
              <span className="neural-coach-role-pill">
                {isAr ? coach.roleAr : coach.roleEn}
              </span>
            </div>
            {coach.quoteEn && (
              <p className="neural-coach-quote" title={isAr ? coach.quoteAr : coach.quoteEn}>
                "{isAr ? coach.quoteAr : coach.quoteEn}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
