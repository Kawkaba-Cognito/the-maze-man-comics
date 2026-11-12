import React from 'react';
import { useApp } from '../../../context/AppContext';

/**
 * DuolingoVictoryScreen
 * Celebratory summary overlay when a game session is completed:
 * - Wiggling trophy / mascot
 * - Animated XP reward badge
 * - Accuracy & session stats
 * - Chunky Duolingo green Continue CTA
 */
export default function DuolingoVictoryScreen({
  xpEarned = 25,
  accuracy = 100,
  streak = 1,
  title,
  subtitle,
  onComplete,
}) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  return (
    <div className="duo-victory-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="duo-victory-trophy">🏆</div>

      <h1 className="duo-victory-title">
        {title || (isAr ? 'اكتمل التدريب بنجاح!' : 'Practice Complete!')}
      </h1>

      <p className="duo-victory-subtitle">
        {subtitle || (isAr ? 'أداء رائع! أضفت نقاطاً جديدة إلى رصيدك المعرفي.' : 'Great job! You added new cognitive XP.')}
      </p>

      <div className="duo-victory-stats-grid">
        <div className="duo-victory-stat-box">
          <span className="duo-victory-stat-val">+{xpEarned} ⚡</span>
          <span className="duo-victory-stat-lbl">{isAr ? 'نقاط الخبرة' : 'Total XP'}</span>
        </div>

        <div className="duo-victory-stat-box">
          <span className="duo-victory-stat-val">{accuracy}%</span>
          <span className="duo-victory-stat-lbl">{isAr ? 'الدقة' : 'Accuracy'}</span>
        </div>
      </div>

      <button
        type="button"
        className="duo-victory-action-btn"
        onClick={() => {
          playSfx?.('ding');
          onComplete?.();
        }}
      >
        {isAr ? 'متابعة المسار' : 'Continue'}
      </button>
    </div>
  );
}
