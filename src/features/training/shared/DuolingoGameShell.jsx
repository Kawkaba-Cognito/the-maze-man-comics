import React from 'react';
import { X, Flame } from '@phosphor-icons/react';
import { useApp } from '../../../context/AppContext';

/**
 * DuolingoGameShell
 * Unified full-screen game harness featuring:
 * - Duolingo close button (✕)
 * - Capsule animated progress bar
 * - Streak/Combo flame metric
 */
export default function DuolingoGameShell({
  progress = 0, // 0 to 100
  streak = 0,
  headerSlot = null,
  onClose,
  children,
}) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  return (
    <div className="duo-game-screen" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Game Bar */}
      <header className="duo-game-top-bar">
        <button
          type="button"
          className="duo-game-close-btn"
          onClick={() => {
            playSfx?.('click');
            onClose?.();
          }}
          aria-label={isAr ? 'خروج' : 'Close'}
        >
          <X size={20} weight="bold" />
        </button>

        {/* Thick Duolingo Progress Capsule */}
        <div className="duo-game-progress-track">
          <div
            className="duo-game-progress-fill"
            style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
          />
        </div>

        {headerSlot}

        {/* Streak Flame Pill */}
        <div className="duo-game-metric-pill" title={isAr ? `الحماسة: ${streak}` : `Streak: ${streak}`}>
          <Flame size={18} weight="fill" color="#FF7800" />
          <span>{streak}</span>
        </div>
      </header>

      {/* Main Interactive Play Area */}
      <main className="duo-game-main-area">
        {children}
      </main>
    </div>
  );
}
