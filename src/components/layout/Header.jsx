import React from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';

export default function Header() {
  const { globalXP, currentLang } = useApp();
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';

  return (
    <header className="comic-header">
      <div
        className="comic-logo"
        style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", fontSize: isAr ? '1.5em' : '2em' }}
      >
        {t.logo}
      </div>
      <div className="xp-pill">⚡ {globalXP} XP</div>
    </header>
  );
}
