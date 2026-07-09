import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import { homeBgPaths } from '../../lib/appTheme';
import CosmosCharacter from '../../features/character/CosmosCharacter';

function useIsDesktop() {
  const [desktop, setDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setDesktop(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return desktop;
}

export default function HomeScreen() {
  const { currentLang, points, playSfx, appTheme, toggleAppTheme } = useApp();
  const isAr = currentLang === 'ar';
  const isDesktop = useIsDesktop();
  const paths = homeBgPaths(appTheme);
  const bgUrl = assetUrl(isDesktop ? paths.desktop : paths.mobile);

  function toggleTheme() {
    playSfx('click');
    toggleAppTheme();
  }

  return (
    <div className={`home-screen home-screen--${appTheme}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div
        className="home-stage-bg"
        style={{ backgroundImage: `url("${bgUrl}")` }}
      />

      <button
        type="button"
        className="home-theme-toggle"
        onClick={toggleTheme}
        aria-label={appTheme === 'light'
          ? (isAr ? 'التبديل إلى الوضع الداكن' : 'Switch to dark')
          : (isAr ? 'التبديل إلى الوضع الفاتح' : 'Switch to light')}
        title={appTheme === 'light'
          ? (isAr ? 'داكن' : 'Dark')
          : (isAr ? 'فاتح' : 'Light')}
      >
        <span aria-hidden="true">{appTheme === 'light' ? '☾' : '☀'}</span>
        <span className="home-theme-toggle-lbl">
          {appTheme === 'light' ? (isAr ? 'داكن' : 'Dark') : (isAr ? 'فاتح' : 'Light')}
        </span>
      </button>

      <div className="home-points" aria-label={isAr ? 'نقاطك' : 'your points'}>
        <span className="home-points-ic" aria-hidden="true">⚡</span>
        <span className="home-points-num">{points}</span>
      </div>

      <div className="home-stage home-stage--solo">
        <div className="home-character" aria-hidden="true">
          <CosmosCharacter size={isDesktop ? 180 : 172} glow art="kawkab" />
        </div>
      </div>
    </div>
  );
}
