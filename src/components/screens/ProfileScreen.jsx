import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DOMAINS_BY_ID } from '../../features/training/registry';
import {
  ASSESS_DOMAINS,
  loadAssessSessions,
} from '../../features/training/assessment/assessmentProfile';
import { NAYZAK_CAST } from '../../data/nayzakCast';
import NayzakHeader from '../shared/NayzakHeader';
import { assetUrl } from '../../lib/assetUrl';

const XP_PER_LEVEL = 200;

const DOMAIN_DISPLAY = {
  attention: { en: 'Attention', ar: 'انتباه' },
  speed: { en: 'Speed', ar: 'سرعة' },
  memory: { en: 'Memory', ar: 'ذاكرة' },
  language: { en: 'Language', ar: 'لغة' },
  reasoning: { en: 'Logic', ar: 'منطق' },
  flexibility: { en: 'Flexibility', ar: 'مرونة' },
};

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
    appTheme,
    setAppTheme,
    sfxEnabled,
    setSfxEnabled,
  } = useApp();

  const isAr = currentLang === 'ar';
  const [showPicker, setShowPicker] = useState(false);

  const lv = getLevel(globalXP);
  const pct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  const sessions = loadAssessSessions();
  const latest = sessions.length ? sessions[sessions.length - 1] : null;
  const scores = latest?.scores ?? {};
  const index = latest?.overall ?? null;

  function setAvatar(avatarUrl) {
    playSfx?.('pop');
    const updated = { ...profileData, avatar: avatarUrl };
    setProfileData(updated);
    saveProfile(updated, globalXP);
    setShowPicker(false);
  }

  const resolvedAvatar =
    profileData.avatar && (profileData.avatar.includes('/') || profileData.avatar.includes('.'))
      ? assetUrl(profileData.avatar)
      : assetUrl('Assets/cartoon/nayzak_unified_leader.png');

  return (
    <div className="nayzak-page" dir={isAr ? 'rtl' : 'ltr'}>
      <NayzakHeader showLogo showStats showLang />

      <main className="duo-profile-container">
        {/* Duolingo Identity & Level Card */}
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
                  const fallback = assetUrl('Assets/cartoon/nayzak_unified_leader.png');
                  if (e.currentTarget.src !== fallback) e.currentTarget.src = fallback;
                }}
              />
            </div>
            <span className="duo-level-badge">
              {isAr ? `مستوى ${lv}` : `LVL ${lv}`}
            </span>
          </div>

          <h2 className="duo-profile-name">{profileData.username}</h2>

          {/* Duolingo XP Progress Bar */}
          <div className="duo-xp-container">
            <div className="duo-xp-track">
              <div className="duo-xp-fill" style={{ width: `${Math.max(6, pct)}%` }} />
            </div>
            <div className="duo-xp-label">
              {globalXP % XP_PER_LEVEL} / {XP_PER_LEVEL} XP · {xpToNext(globalXP)} {isAr ? `للمستوى التالي` : `to next level`}
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

        {/* 3 Duolingo Stat Cards */}
        <section className="duo-stats-grid">
          <div className="duo-stat-card">
            <span className="duo-stat-card-val">🔥 {profileData.streak ?? 0}</span>
            <span className="duo-stat-card-lbl">{isAr ? 'الأيام' : 'Streak'}</span>
          </div>
          <div className="duo-stat-card">
            <span className="duo-stat-card-val">⚡ {globalXP}</span>
            <span className="duo-stat-card-lbl">{isAr ? 'النقاط' : 'Total XP'}</span>
          </div>
          <div className="duo-stat-card">
            <span className="duo-stat-card-val">🎮 {sessions.length}</span>
            <span className="duo-stat-card-lbl">{isAr ? 'التدريبات' : 'Sessions'}</span>
          </div>
        </section>

        {/* Cognitive Profile Section */}
        <section className="duo-section-card">
          <div className="duo-card-header">
            <h3 className="duo-card-title">{isAr ? 'المؤشر الإدراكي' : 'Cognitive Index'}</h3>
            {index != null && <span className="duo-tag">{index} / 100</span>}
          </div>

          {latest ? (
            <div className="duo-cog-list">
              {ASSESS_DOMAINS.map((d) => {
                const v = typeof scores[d] === 'number' ? scores[d] : 0;
                const col = DOMAINS_BY_ID[d]?.color ?? '#2586F7';
                return (
                  <div key={d} className="duo-cog-row">
                    <span className="duo-cog-label">
                      {isAr ? DOMAIN_DISPLAY[d].ar : DOMAIN_DISPLAY[d].en}
                    </span>
                    <div className="duo-xp-track duo-cog-track">
                      <div className="duo-cog-fill" style={{ width: `${v}%`, background: col }} />
                    </div>
                    <span className="duo-cog-score">
                      {scores[d] ?? '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="duo-empty-note">
              {isAr
                ? 'العب من مسار التدريب لبناء مؤشرك الإدراكي!'
                : 'Complete stages on your learning path to build your cognitive profile!'}
            </p>
          )}
        </section>

        {/* Settings Card */}
        <section className="duo-section-card">
          <h3 className="duo-card-title" style={{ marginBottom: 12 }}>{isAr ? 'الإعدادات' : 'Settings'}</h3>

          <div className="duo-row-item">
            <span className="duo-row-label">{isAr ? 'اللغة' : 'Language'}</span>
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
            <span className="duo-row-label">{isAr ? 'الأصوات التفاعلية' : 'Sound Effects'}</span>
            <button
              type="button"
              className={`duo-action-btn ${sfxEnabled ? 'is-active' : ''}`}
              onClick={() => {
                playSfx?.('click');
                setSfxEnabled(!sfxEnabled);
              }}
            >
              {sfxEnabled ? (isAr ? 'مفعل 🔊' : 'On 🔊') : (isAr ? 'صامت 🔇' : 'Muted 🔇')}
            </button>
          </div>

          <div className="duo-row-item">
            <span className="duo-row-label">{isAr ? 'المظهر' : 'Theme'}</span>
            <button
              type="button"
              className="duo-action-btn"
              onClick={() => {
                playSfx?.('click');
                setAppTheme(appTheme === 'dark' ? 'light' : 'dark');
              }}
            >
              {appTheme === 'dark' ? (isAr ? '🌙 داكن' : '🌙 Dark') : (isAr ? '☀️ فاتح' : '☀️ Light')}
            </button>
          </div>
        </section>

        {/* Super Nayzak PRO Upgrade Card */}
        <section className="duo-pro-banner">
          <div className="duo-pro-copy">
            <h3>{isAr ? 'عضوية NAYZAK PRO ⭐' : 'NAYZAK PRO PASS ⭐'}</h3>
            <p>
              {isAr
                ? 'افتح جميع ألعاب التدريب، الألغاز وتقارير الذكاء.'
                : 'Unlock all cognitive training, secret puzzles & stats.'}
            </p>
          </div>
          <button
            type="button"
            className="duo-pro-btn"
            onClick={() => {
              playSfx?.('ding');
              openPaywall?.();
            }}
          >
            {isAr ? 'ترقية' : 'Upgrade'}
          </button>
        </section>
      </main>
    </div>
  );
}
