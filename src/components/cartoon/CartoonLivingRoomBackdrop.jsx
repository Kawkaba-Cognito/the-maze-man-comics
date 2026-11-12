import React from 'react';

/**
 * Cartoon Living Room Backdrop — Faithfully recreated from
 * "agreeable_people_pleaser_bendia.mp4" (Scene 1: Nayzak's Home Haven).
 *
 * Visual Elements:
 * - Warm cream/peach comic wallpaper with crown molding
 * - Hanging brass lamp with warm volumetric golden light cone
 * - Cartoon window looking out onto cheerful blue sky, sun, and fluffy white cloud
 * - Cozy wooden bookshelf with colorful cartoon books
 * - Honey parquet wood floorboards
 */
export default function CartoonLivingRoomBackdrop() {
  return (
    <div className="cartoon-room-backdrop" aria-hidden="true">
      <svg
        className="cartoon-room-svg"
        viewBox="0 0 1080 720"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <defs>
          {/* Wall Wallpaper Gradient */}
          <linearGradient id="roomWallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFBEB" stopOpacity="0.95" />
          </linearGradient>

          {/* Honey Parquet Wood Floor */}
          <linearGradient id="roomFloorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Sun Glow */}
          <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FACC15" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ── 1. WALL BACKGROUND ── */}
        <rect x="0" y="0" width="1080" height="540" fill="url(#roomWallGrad)" />

        {/* ── 2. CEILING CROWN MOLDING ── */}
        <rect x="0" y="0" width="1080" height="34" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
        <line x1="0" y1="34" x2="1080" y2="34" stroke="#0F172A" strokeWidth="3" />

        {/* ── 3. WARM PENDANT BRASS LAMP ── */}
        <line x1="540" y1="34" x2="540" y2="110" stroke="#0F172A" strokeWidth="3.5" />
        {/* Brass Lamp Shade */}
        <path d="M 480 160 Q 540 100 600 160 Z" fill="#F59E0B" stroke="#0F172A" strokeWidth="4" />
        <ellipse cx="540" cy="160" rx="60" ry="14" fill="#FEF08A" stroke="#0F172A" strokeWidth="2.5" />
        {/* Soft Volumetric Warm Glow Cone */}
        <polygon
          points="540,160 300,540 780,540"
          fill="rgba(254, 240, 138, 0.22)"
          className="cartoon-lamp-glow"
        />

        {/* ── 4. APARTMENT WINDOW (Sunny Blue Sky & Cloud Outside) ── */}
        <g transform="translate(60, 90)">
          {/* Blue Sky */}
          <rect x="0" y="0" width="190" height="280" rx="10" fill="#38BDF8" stroke="#0F172A" strokeWidth="4" />
          {/* Warm Sun with Glow */}
          <circle cx="140" cy="55" r="32" fill="url(#sunGlow)" />
          <circle cx="140" cy="55" r="22" fill="#FACC15" stroke="#F59E0B" strokeWidth="2" />
          {/* Fluffy White Cloud */}
          <path
            d="M 30 75 Q 55 45 90 65 Q 125 35 150 70 Q 165 95 130 105 Q 20 105 30 75 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="2.5"
          />
          {/* Window Panes Grid */}
          <line x1="95" y1="0" x2="95" y2="280" stroke="#0F172A" strokeWidth="3.5" />
          <line x1="0" y1="140" x2="190" y2="140" stroke="#0F172A" strokeWidth="3.5" />
          {/* Window Sill */}
          <rect x="-12" y="276" width="214" height="16" rx="4" fill="#E2E8F0" stroke="#0F172A" strokeWidth="3" />
          {/* Navy Curtains with Tiebacks */}
          <path d="M -8 -4 Q 40 130 10 276 L -8 276 Z" fill="#1E3A8A" stroke="#0F172A" strokeWidth="2.5" />
          <path d="M 198 -4 Q 150 130 180 276 L 198 276 Z" fill="#1E3A8A" stroke="#0F172A" strokeWidth="2.5" />
        </g>

        {/* ── 5. COZY WALL BOOKSHELF ── */}
        <g transform="translate(820, 110)">
          {/* Shelf Bracket */}
          <rect x="0" y="110" width="200" height="14" rx="4" fill="#78350F" stroke="#0F172A" strokeWidth="3.5" />
          {/* Books */}
          <rect x="15" y="25" width="24" height="85" rx="2" fill="#EF4444" stroke="#0F172A" strokeWidth="2" />
          <rect x="43" y="40" width="20" height="70" rx="2" fill="#0284C7" stroke="#0F172A" strokeWidth="2" />
          <rect x="67" y="15" width="28" height="95" rx="2" fill="#10B981" stroke="#0F172A" strokeWidth="2" />
          <rect x="99" y="32" width="22" height="78" rx="2" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
          <rect x="125" y="20" width="26" height="90" rx="2" fill="#8B5CF6" stroke="#0F172A" strokeWidth="2" />
          {/* Small Potted Plant on Shelf */}
          <path d="M 160 95 L 185 95 L 180 110 L 165 110 Z" fill="#D97706" stroke="#0F172A" strokeWidth="2" />
          <ellipse cx="172" cy="85" rx="10" ry="12" fill="#22C55E" stroke="#0F172A" strokeWidth="2" />
        </g>

        {/* ── 6. PICTURE FRAME: NAYZAK LAUREL WREATH ── */}
        <g transform="translate(500, 240)">
          <rect x="0" y="0" width="80" height="95" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="3" />
          <rect x="6" y="6" width="68" height="83" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="18" fill="#F59E0B" stroke="#0F172A" strokeWidth="1.5" />
          <text x="40" y="47" textAnchor="middle" fontSize="20">👑</text>
          <text x="40" y="74" textAnchor="middle" fontFamily="'Arial Black', sans-serif" fontSize="7" fill="#0F172A" fontWeight="900">
            SOVEREIGN
          </text>
        </g>

        {/* ── 7. HONEY PARQUET WOOD FLOOR ── */}
        <rect x="0" y="530" width="1080" height="190" fill="url(#roomFloorGrad)" />
        <line x1="0" y1="530" x2="1080" y2="530" stroke="#0F172A" strokeWidth="4" />
        {/* Parquet Floorboard Planks */}
        <line x1="0" y1="580" x2="1080" y2="580" stroke="#B45309" strokeWidth="2" strokeDasharray="140 20" />
        <line x1="0" y1="630" x2="1080" y2="630" stroke="#B45309" strokeWidth="2" strokeDasharray="90 30" />
        <line x1="0" y1="680" x2="1080" y2="680" stroke="#B45309" strokeWidth="2" strokeDasharray="160 25" />
      </svg>
    </div>
  );
}
