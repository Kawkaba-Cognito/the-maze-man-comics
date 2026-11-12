import React from 'react';
import { CaretLeft, CaretRight, Flame, Lightning } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import NayzakLogo from './NayzakLogo';
import '../../styles/nayzakChrome.css';

/**
 * NayzakHeader — Duolingo-styled Top Bar with Max-Width Centering
 */
export default function NayzakHeader({
  title,
  subtitle,
  onBack,
  backLabel,
  showLogo = true,
  showStats = true,
  showLang = true,
  rightActions,
  style = {},
  className = '',
}) {
  const { currentLang, toggleLang, playSfx, profileData, points } = useApp();
  const isAr = currentLang === 'ar';
  const streak = profileData?.streak || 0;

  return (
    <header className={`nayzak-header duo-styled-header ${className}`} style={style} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="duo-header-inner">
        {/* Brand Slot / Back Button */}
        <div className="nayzak-header-slot nayzak-header-slot--start">
          {onBack ? (
            <button
              type="button"
              className="nayzak-pill-btn nayzak-pill-btn--icon-only"
              onClick={() => {
                playSfx?.('click');
                onBack();
              }}
              aria-label={backLabel || (isAr ? 'رجوع' : 'Back')}
            >
              {isAr ? <CaretRight size={18} weight="bold" /> : <CaretLeft size={18} weight="bold" />}
            </button>
          ) : showLogo ? (
            <div className="duo-header-logo-wrap">
              <NayzakLogo variant="compact" size={38} />
            </div>
          ) : null}

          {title && (
            <div className="duo-header-title-wrap">
              <h1 className="nayzak-header-title">{title}</h1>
              {subtitle && <span className="nayzak-header-subtitle">{subtitle}</span>}
            </div>
          )}
        </div>

        {/* Action / Stats Slot */}
        <div className="nayzak-header-slot nayzak-header-slot--end">
          {rightActions}

          {showStats && (
            <div className="duo-stats-group">
              {/* Streak Counter */}
              <div className="duo-stat-pill duo-stat-pill--streak" title={isAr ? `شعلة الحماسة: ${streak} أيام` : `Streak: ${streak} days`}>
                <Flame size={18} weight="fill" color="#FF7800" />
                <span>{streak}</span>
              </div>

              {/* Energy / Points */}
              <div className="duo-stat-pill duo-stat-pill--energy" title={isAr ? `نقاط الطاقة: ${points}` : `Energy: ${points}`}>
                <Lightning size={18} weight="fill" color="#1CB0F6" />
                <span>{points}</span>
              </div>
            </div>
          )}

          {showLang && (
            <button
              type="button"
              className="duo-lang-pill"
              onClick={() => {
                playSfx?.('tap');
                toggleLang();
              }}
              title={isAr ? 'Switch to English' : 'التحويل للعربية'}
            >
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
