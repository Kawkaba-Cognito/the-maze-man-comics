import React, { useState } from 'react';
import { Toggle } from 'konsta/react';
import {
  Flame,
  Lightning,
  Trophy,
  Crosshair,
  Brain,
  ChatCircleText,
  PuzzlePiece,
  ArrowsClockwise,
  Crown,
  Sun,
  Moon,
  SpeakerHigh,
  SpeakerSlash,
  Globe,
  Sparkle,
  CheckCircle,
} from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import {
  ASSESS_DOMAINS,
  loadAssessSessions,
} from '../../features/training/assessment/assessmentProfile';
import {
  domainRating,
  ratingBand,
  RATED_GAMES,
  gameRating,
} from '../../features/training/rating';
import { loadWorkout } from '../../features/workout/workoutState';
import { NAYZAK_CAST } from '../../data/nayzakCast';
import NayzakHeader from '../shared/NayzakHeader';
import { assetUrl } from '../../lib/assetUrl';

const XP_PER_LEVEL = 200;

const DOMAIN_DISPLAY = {
  attention: { en: 'Attention', ar: 'انتباه', color: '#FF7800', Icon: Crosshair },
  speed: { en: 'Speed', ar: 'سرعة', color: '#0B63CE', Icon: Lightning },
  memory: { en: 'Memory', ar: 'ذاكرة', color: '#1CB0F6', Icon: Brain },
  language: { en: 'Language', ar: 'لغة', color: '#0D9488', Icon: ChatCircleText },
  reasoning: { en: 'Logic', ar: 'منطق', color: '#4F46E5', Icon: PuzzlePiece },
  flexibility: { en: 'Flexibility', ar: 'مرونة', color: '#DF4E32', Icon: ArrowsClockwise },
};

const RADAR_RINGS = [0.25, 0.5, 0.75, 1];
const RADAR_BASELINE = [0.38, 0.34, 0.4, 0.32, 0.36, 0.35];

function polarPoint(cx, cy, radius, angleRad) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function CognitiveRadarChart({ values, isAr, isDark, hasAnyRating }) {
  const width = 340;
  const height = 276;
  const cx = width / 2;
  const cy = height / 2 + 2;
  const maxR = 82;

  const axes = ASSESS_DOMAINS.map((domain, idx) => {
    const angle = -Math.PI / 2 + (idx * 2 * Math.PI) / ASSESS_DOMAINS.length;
    const raw = values[domain];
    const numeric = typeof raw === 'number' ? Math.max(0, Math.min(1000, raw)) : null;
    const norm = numeric != null ? Math.max(0.06, numeric / 1000) : 0;
    const vertex = polarPoint(cx, cy, maxR * norm, angle);
    const outer = polarPoint(cx, cy, maxR, angle);
    const labelPt = polarPoint(cx, cy, maxR + 22, angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let anchor = 'middle';
    let dx = 0;
    let dy = 0;
    if (cos > 0.25) {
      anchor = 'start';
      dx = 4;
    } else if (cos < -0.25) {
      anchor = 'end';
      dx = -4;
    }
    if (sin < -0.7) {
      dy = -8;
    } else if (sin > 0.7) {
      dy = 12;
    }

    return {
      domain,
      meta: DOMAIN_DISPLAY[domain],
      angle,
      numeric,
      vertex,
      outer,
      lx: labelPt.x + dx,
      ly: labelPt.y + dy,
      anchor,
    };
  });

  const ringPolygons = RADAR_RINGS.map((ratio) =>
    axes
      .map((a) => {
        const pt = polarPoint(cx, cy, maxR * ratio, a.angle);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ')
  );

  const dataPoints = axes
    .map((a) => `${a.vertex.x.toFixed(1)},${a.vertex.y.toFixed(1)}`)
    .join(' ');

  const baselinePoints = axes
    .map((a, idx) => {
      const pt = polarPoint(cx, cy, maxR * RADAR_BASELINE[idx], a.angle);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    })
    .join(' ');

  const gridStroke = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(15, 30, 51, 0.12)';
  const outerStroke = isDark ? 'rgba(148, 163, 184, 0.36)' : 'rgba(15, 30, 51, 0.22)';
  const labelColor = isDark ? '#E2E8F0' : '#0F1E33';
  const scoreColor = isDark ? '#94A3B8' : '#475569';
  const dotStroke = isDark ? '#0F1E33' : '#FFFFFF';

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0 12px' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', maxWidth: 340, height: 'auto', display: 'block', direction: 'ltr' }}
        role="img"
        aria-label={isAr ? 'مخطط الرادار الإدراكي ذو المحاور الستة' : '6-Axis Cognitive Radar Chart'}
      >
        {/* Concentric Hexagonal Grid Rings (25%, 50%, 75%, 100%) */}
        {ringPolygons.map((pts, idx) => (
          <polygon
            key={RADAR_RINGS[idx]}
            points={pts}
            fill={idx === ringPolygons.length - 1 ? (isDark ? 'rgba(15, 30, 51, 0.35)' : 'rgba(11, 99, 206, 0.03)') : 'none'}
            stroke={idx === ringPolygons.length - 1 ? outerStroke : gridStroke}
            strokeWidth={idx === ringPolygons.length - 1 ? '1.5' : '1'}
          />
        ))}

        {/* 6 Spokes */}
        {axes.map((a) => (
          <line
            key={`spoke-${a.domain}`}
            x1={cx}
            y1={cy}
            x2={a.outer.x.toFixed(1)}
            y2={a.outer.y.toFixed(1)}
            stroke={gridStroke}
            strokeWidth="1"
          />
        ))}

        {/* Data Polygon or Subtle Baseline Outline */}
        {hasAnyRating ? (
          <>
            <polygon
              points={dataPoints}
              fill="rgba(11, 99, 206, 0.22)"
              stroke="#0B63CE"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {axes.map((a) =>
              a.numeric != null ? (
                <circle
                  key={`dot-${a.domain}`}
                  cx={a.vertex.x.toFixed(1)}
                  cy={a.vertex.y.toFixed(1)}
                  r="4.5"
                  fill="#FF7800"
                  stroke={dotStroke}
                  strokeWidth="2"
                />
              ) : null
            )}
          </>
        ) : (
          <polygon
            points={baselinePoints}
            fill={isDark ? 'rgba(11, 99, 206, 0.08)' : 'rgba(11, 99, 206, 0.06)'}
            stroke={isDark ? 'rgba(28, 176, 246, 0.42)' : 'rgba(11, 99, 206, 0.35)'}
            strokeWidth="1.75"
            strokeDasharray="5 4"
            strokeLinejoin="round"
          />
        )}

        {/* Axis Labels + Numeric Values (0-1000) */}
        {axes.map((a) => (
          <g key={`lbl-${a.domain}`}>
            <text
              x={a.lx.toFixed(1)}
              y={a.ly.toFixed(1)}
              textAnchor={a.anchor}
              fill={labelColor}
              fontSize="11.5"
              fontWeight="800"
              fontFamily="Outfit, Cairo, system-ui, sans-serif"
            >
              {isAr ? a.meta.ar : a.meta.en}
            </text>
            <text
              x={a.lx.toFixed(1)}
              y={(a.ly + 13).toFixed(1)}
              textAnchor={a.anchor}
              fill={a.numeric != null ? '#0B63CE' : scoreColor}
              fontSize="10.5"
              fontWeight="900"
              fontFamily="Outfit, Cairo, system-ui, sans-serif"
            >
              {a.numeric != null ? a.numeric : '—'}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const getLevel = (xp) => Math.floor(xp / XP_PER_LEVEL) + 1;
const xpToNext = (xp) => XP_PER_LEVEL - (xp % XP_PER_LEVEL);

export default function ProfileScreen() {
  const {
    globalXP,
    profileData,
    setProfileData,
    saveProfile,
    playSfx,
    toggleLang,
    currentLang,
    openPaywall,
    isPro,
    proPlan,
    appTheme,
    setAppTheme,
    sfxEnabled,
    setSfxEnabled,
  } = useApp();

  const isAr = currentLang === 'ar';
  const isDark = appTheme === 'dark';
  const [showPicker, setShowPicker] = useState(false);

  const lv = getLevel(globalXP);
  const pct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  const sessions = loadAssessSessions();
  const latest = sessions.length ? sessions[sessions.length - 1] : null;
  const assessScores = latest?.scores ?? {};
  const workoutSt = loadWorkout();

  const liveDomainRatings = Object.fromEntries(
    ASSESS_DOMAINS.map((d) => [d, domainRating(d)])
  );
  const radarValues = Object.fromEntries(
    ASSESS_DOMAINS.map((d) => {
      const liveVal = liveDomainRatings[d];
      const fallbackVal = typeof assessScores[d] === 'number' ? assessScores[d] * 10 : null;
      return [d, liveVal ?? fallbackVal];
    })
  );
  const hasAnyRating = ASSESS_DOMAINS.some((d) => typeof radarValues[d] === 'number');

  const ratedEntries = ASSESS_DOMAINS
    .map((d) => ({ id: d, val: liveDomainRatings[d] }))
    .filter((x) => typeof x.val === 'number');

  const liveIndex = ratedEntries.length
    ? Math.round(ratedEntries.reduce((a, x) => a + x.val, 0) / ratedEntries.length)
    : null;
  const liveBand = liveIndex != null ? ratingBand(liveIndex) : null;

  const sortedRated = [...ratedEntries].sort((a, b) => b.val - a.val);
  const strongestDomain = sortedRated.length >= 2 ? sortedRated[0] : null;
  const focusDomain = sortedRated.length >= 2 ? sortedRated[sortedRated.length - 1] : null;

  const totalRatedRuns = Object.keys(RATED_GAMES).reduce(
    (sum, k) => sum + (gameRating(k)?.n || 0),
    0
  );
  const totalSessionsCount = Math.max(sessions.length, totalRatedRuns);
  const displayStreak = Math.max(profileData.streak ?? 0, workoutSt?.streak ?? 0);

  function setAvatar(avatarUrl) {
    playSfx?.('pop');
    const updated = { ...profileData, avatar: avatarUrl };
    setProfileData(updated);
    saveProfile(updated, globalXP);
    setShowPicker(false);
  }

  const resolvedAvatar =
    profileData.avatar &&
    (profileData.avatar.includes('/') || profileData.avatar.includes('.')) &&
    !profileData.avatar.includes('nayzak_unified_leader')
      ? assetUrl(profileData.avatar)
      : assetUrl('Assets/cast-2d-minimal-2026/kawkab.webp');

  const StrongestIcon = strongestDomain ? DOMAIN_DISPLAY[strongestDomain.id].Icon : null;
  const FocusIcon = focusDomain ? DOMAIN_DISPLAY[focusDomain.id].Icon : null;

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-profile-container">
        <section className="lum-catalog-header">
          <div className="lum-top-copy">
            <span className="lum-date-label">
              {isAr ? 'الملف المعرفي والإحصائيات' : 'COGNITIVE PROFILE'}
            </span>
            <h1 className="lum-screen-title">
              {isAr ? 'التقدّم والإعدادات' : 'Insights'}
            </h1>
          </div>
        </section>

        {/* Identity & Level Card */}
        <section className="duo-identity-card">
          <div
            className="duo-avatar-wrapper"
            role="button"
            tabIndex={0}
            onClick={() => {
              playSfx?.('tap');
              setShowPicker((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playSfx?.('tap');
                setShowPicker((v) => !v);
              }
            }}
            title={isAr ? 'انقر لتغيير الشخصية' : 'Click to change avatar'}
          >
            <div className="duo-avatar-circle">
              <img
                src={resolvedAvatar}
                alt={profileData.username}
                draggable="false"
                onError={(e) => {
                  const fallback = assetUrl('Assets/cast-2d-minimal-2026/kawkab.webp');
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
            </div>
            <span className="duo-level-badge">
              {isAr ? `مستوى ${lv}` : `LVL ${lv}`}
            </span>
          </div>

          <h2 className="duo-profile-name">{profileData.username}</h2>

          {/* XP Progress Bar */}
          <div className="duo-xp-container">
            <div className="duo-xp-track">
              <div className="duo-xp-fill" style={{ width: `${Math.max(6, pct)}%` }} />
            </div>
            <div className="duo-xp-label">
              {globalXP % XP_PER_LEVEL} / {XP_PER_LEVEL} XP · {xpToNext(globalXP)} {isAr ? 'للمستوى التالي' : 'to next level'}
            </div>
          </div>

          {/* Avatar Cast Picker */}
          {showPicker && (
            <div className="duo-pose-picker">
              {NAYZAK_CAST.map((c) => {
                const selected = resolvedAvatar === assetUrl(c.avatarUrl);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`duo-pose-btn ${selected ? 'is-selected' : ''}`}
                    onClick={() => setAvatar(c.avatarUrl)}
                    title={isAr ? c.nameAr : c.nameEn}
                  >
                    <img src={assetUrl(c.avatarUrl)} alt={isAr ? c.nameAr : c.nameEn} draggable="false" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 3 Stat Cards */}
        <section className="duo-stats-grid">
          <div className="duo-stat-card">
            <span className="duo-stat-card-val" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Flame size={20} weight="fill" color="#FF7800" aria-hidden="true" />
              <span>{displayStreak}</span>
            </span>
            <span className="duo-stat-card-lbl">{isAr ? 'الأيام' : 'Streak'}</span>
          </div>
          <div className="duo-stat-card">
            <span className="duo-stat-card-val" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Lightning size={20} weight="fill" color="#0B63CE" aria-hidden="true" />
              <span>{globalXP}</span>
            </span>
            <span className="duo-stat-card-lbl">{isAr ? 'النقاط' : 'Total XP'}</span>
          </div>
          <div className="duo-stat-card">
            <span className="duo-stat-card-val" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={20} weight="fill" color="#FFB012" aria-hidden="true" />
              <span>{totalSessionsCount}</span>
            </span>
            <span className="duo-stat-card-lbl">{isAr ? 'التدريبات' : 'Sessions'}</span>
          </div>
        </section>

        {/* Cognitive Profile Section (Lumosity LPI-style Live Ratings + 6-Axis Radar) */}
        <section className="duo-section-card">
          <div className="duo-card-header">
            <div>
              <h3 className="duo-card-title">{isAr ? 'المؤشر الإدراكي' : 'Cognitive Index'}</h3>
              <span className="duo-cog-subtitle">
                {isAr ? 'مقياس المهارات عبر المجالات الستة (٠–١٠٠٠)' : 'Skill rating across all 6 cognitive domains (0–1000)'}
              </span>
            </div>
            {liveIndex != null && liveBand ? (
              <span className="duo-tag" style={{ borderColor: liveBand.color, color: liveBand.color }}>
                {liveIndex} · {isAr ? liveBand.ar : liveBand.en}
              </span>
            ) : latest?.overall != null ? (
              <span className="duo-tag">{latest.overall} / 100</span>
            ) : null}
          </div>

          <CognitiveRadarChart
            values={radarValues}
            isAr={isAr}
            isDark={isDark}
            hasAnyRating={hasAnyRating}
          />

          {strongestDomain && focusDomain && StrongestIcon && FocusIcon && (
            <div className="duo-cog-insights">
              <div className="duo-cog-insight-pill is-best">
                <StrongestIcon size={15} weight="duotone" aria-hidden="true" />
                <span>
                  {isAr ? 'نقطة القوة: ' : 'Strongest: '}
                  <strong>{isAr ? DOMAIN_DISPLAY[strongestDomain.id].ar : DOMAIN_DISPLAY[strongestDomain.id].en}</strong>
                </span>
              </div>
              <div className="duo-cog-insight-pill is-focus">
                <FocusIcon size={15} weight="duotone" aria-hidden="true" />
                <span>
                  {isAr ? 'ركّز على: ' : 'Focus Next: '}
                  <strong>{isAr ? DOMAIN_DISPLAY[focusDomain.id].ar : DOMAIN_DISPLAY[focusDomain.id].en}</strong>
                </span>
              </div>
            </div>
          )}

          {liveIndex != null || latest ? (
            <div className="duo-cog-list">
              {ASSESS_DOMAINS.map((d) => {
                const liveVal = liveDomainRatings[d];
                const fallbackVal = typeof assessScores[d] === 'number' ? assessScores[d] * 10 : null;
                const displayVal = liveVal ?? fallbackVal;
                const barPct = typeof displayVal === 'number' ? Math.min(100, Math.round(displayVal / 10)) : 0;
                const col = DOMAIN_DISPLAY[d]?.color ?? '#0B63CE';
                const DomainIcon = DOMAIN_DISPLAY[d].Icon;
                return (
                  <div key={d} className="duo-cog-row">
                    <span className="duo-cog-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 92 }}>
                      <DomainIcon size={15} weight="duotone" color={col} aria-hidden="true" />
                      <span>{isAr ? DOMAIN_DISPLAY[d].ar : DOMAIN_DISPLAY[d].en}</span>
                    </span>
                    <div className="duo-xp-track duo-cog-track">
                      <div className="duo-cog-fill" style={{ width: `${barPct}%`, background: col }} />
                    </div>
                    <span className="duo-cog-score">
                      {liveVal ?? (typeof assessScores[d] === 'number' ? assessScores[d] : '—')}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="duo-empty-note">
              {isAr
                ? 'أكمل تمرين اليوم أو أي لعبة لبناء رادار مؤشرك الإدراكي عبر المجالات الستة!'
                : "Complete Today's Workout or any game to chart your Cognitive Index across all 6 domains."}
            </p>
          )}
        </section>

        {/* Settings Card */}
        <section className="duo-section-card">
          <h3 className="duo-card-title" style={{ marginBottom: 12 }}>{isAr ? 'الإعدادات' : 'Settings'}</h3>

          <div className="duo-row-item">
            <span className="duo-row-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
              <span className="lum-tile-icon lum-tile-icon--xs" style={{ backgroundColor: '#0B63CE' }} aria-hidden="true">
                <Globe size={16} weight="fill" color="#FFFFFF" />
              </span>
              <span>{isAr ? 'اللغة' : 'Language'}</span>
            </span>
            <button
              type="button"
              className="duo-action-btn"
              onClick={() => {
                playSfx?.('click');
                toggleLang?.();
              }}
            >
              {isAr ? 'العربية → English' : 'English → العربية'}
            </button>
          </div>

          <div className="duo-row-item">
            <span className="duo-row-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
              <span
                className="lum-tile-icon lum-tile-icon--xs"
                style={{ backgroundColor: sfxEnabled ? '#1CB0F6' : '#64748B' }}
                aria-hidden="true"
              >
                {sfxEnabled ? (
                  <SpeakerHigh size={16} weight="fill" color="#FFFFFF" />
                ) : (
                  <SpeakerSlash size={16} weight="fill" color="#FFFFFF" />
                )}
              </span>
              <span>{isAr ? 'الأصوات التفاعلية' : 'Sound Effects'}</span>
            </span>
            <Toggle
              checked={sfxEnabled}
              aria-label={isAr ? 'الأصوات التفاعلية' : 'Sound Effects'}
              onChange={() => {
                playSfx?.('click');
                setSfxEnabled(!sfxEnabled);
              }}
            />
          </div>

          <div className="duo-row-item">
            <span className="duo-row-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 11 }}>
              <span
                className="lum-tile-icon lum-tile-icon--xs"
                style={{ backgroundColor: isDark ? '#4F46E5' : '#FF7800' }}
                aria-hidden="true"
              >
                {isDark ? (
                  <Moon size={16} weight="fill" color="#FFFFFF" />
                ) : (
                  <Sun size={16} weight="fill" color="#FFFFFF" />
                )}
              </span>
              <span>{isAr ? 'المظهر الداكن' : 'Dark Mode'}</span>
            </span>
            <Toggle
              checked={isDark}
              aria-label={isAr ? 'المظهر الداكن' : 'Dark Mode'}
              onChange={() => {
                playSfx?.('click');
                setAppTheme(isDark ? 'light' : 'dark');
              }}
            />
          </div>
        </section>

        {/* Mobile-only Nayzak PRO Card (Desktop shows PRO inside Left Rail) */}
        <section className="ed-pro-card md:hidden">
          <div className="ed-pro-copy">
            <div className="ed-pro-head">
              <Crown size={16} weight="fill" color="#FFB012" aria-hidden="true" />
              <h3>
                {isPro
                  ? isAr
                    ? 'Nayzak PRO مفعّل'
                    : 'Nayzak PRO Active'
                  : isAr
                    ? 'نيزك PRO'
                    : 'Nayzak PRO'}
              </h3>
              {isPro && <CheckCircle size={15} weight="fill" color="#1CB0F6" aria-hidden="true" />}
            </div>
            <p>
              {isPro
                ? isAr
                  ? `جميع التمارين والألغاز وتحليلات الرادار الإدراكي مفتوحة${proPlan === 'monthly' ? ' (الباقة الشهرية)' : proPlan === 'annual' ? ' (الباقة السنوية)' : ''}.`
                  : `All 18 drills, 19 puzzles, and full 6-domain NPI insights unlocked${proPlan === 'monthly' ? ' (Monthly plan)' : proPlan === 'annual' ? ' (Annual plan)' : ''}.`
                : isAr
                  ? 'افتح جميع التمارين الإكلينيكية الـ 18 و19 لغزاً وتقارير الرادار الكاملة.'
                  : 'Unlock all 18 drills, 19 mind puzzles & full Cognitive Radar insights.'}
            </p>
          </div>
          <button
            type="button"
            className="ed-pro-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => {
              playSfx?.('ding');
              openPaywall?.();
            }}
          >
            <Sparkle size={14} weight="fill" aria-hidden="true" />
            <span>
              {isPro
                ? isAr
                  ? 'إدارة المعاينة'
                  : 'Manage'
                : isAr
                  ? 'ترقية'
                  : 'Upgrade'}
            </span>
          </button>
        </section>
      </main>
    </div>
  );
}
