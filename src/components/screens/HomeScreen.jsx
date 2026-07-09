import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import HomeTodayPanel from '../../features/relax/HomeTodayPanel';
import { OPEN_DAILY_KEY } from '../../features/relax/HabitReminderBanner';

const HOME_THEME_KEY = 'mazeman_home_theme';

const DOORS = [
  { tab: 'pointshop', enLabel: 'Shop', arLabel: 'المتجر', pos: 'left' },
  { tab: 'profile', enLabel: 'Profile', arLabel: 'ملفي', pos: 'center' },
  { tab: 'puzzles', enLabel: 'Puzzles', arLabel: 'ألغاز', pos: 'right' },
];

function loadHomeTheme() {
  try {
    const v = localStorage.getItem(HOME_THEME_KEY);
    return v === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

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
  const { playSfx, switchTab, currentLang, points } = useApp();
  const isAr = currentLang === 'ar';
  const isDesktop = useIsDesktop();
  const [theme, setTheme] = useState(loadHomeTheme);

  useEffect(() => {
    try {
      localStorage.setItem(HOME_THEME_KEY, theme);
    } catch { /* ignore */ }
    document.documentElement.dataset.homeTheme = theme;
    return () => {
      delete document.documentElement.dataset.homeTheme;
    };
  }, [theme]);

  const bgUrl = assetUrl(
    isDesktop
      ? `Assets/bg-home-${theme}-desktop.webp`
      : `Assets/bg-home-${theme}-mobile.webp`,
  );

  function handleDoor(tab) {
    playSfx('click');
    switchTab(tab);
  }

  function toggleTheme() {
    playSfx('click');
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }

  function openDailyHabits() {
    playSfx('click');
    try { sessionStorage.setItem(OPEN_DAILY_KEY, '1'); } catch { /* ignore */ }
    switchTab('relax');
  }

  return (
    <div className={`home-screen home-screen--${theme}`} dir={isAr ? 'rtl' : 'ltr'}>
      <div
        className="home-stage-bg"
        style={{ backgroundImage: `url("${bgUrl}")` }}
      />

      <button
        type="button"
        className="home-theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === 'light'
          ? (isAr ? 'التبديل إلى الوضع الداكن' : 'Switch to dark')
          : (isAr ? 'التبديل إلى الوضع الفاتح' : 'Switch to light')}
        title={theme === 'light'
          ? (isAr ? 'داكن' : 'Dark')
          : (isAr ? 'فاتح' : 'Light')}
      >
        <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
        <span className="home-theme-toggle-lbl">
          {theme === 'light' ? (isAr ? 'داكن' : 'Dark') : (isAr ? 'فاتح' : 'Light')}
        </span>
      </button>

      <div className="home-points" aria-label={isAr ? 'نقاطك' : 'your points'}>
        <span className="home-points-ic" aria-hidden="true">⚡</span>
        <span className="home-points-num">{points}</span>
      </div>

      <nav className="home-portals" aria-label={isAr ? 'التنقّل' : 'Navigation'}>
        {DOORS.map((d) => (
          <button
            key={d.tab}
            type="button"
            className={`home-portal home-portal--${d.pos}`}
            onClick={() => handleDoor(d.tab)}
          >
            {isAr ? d.arLabel : d.enLabel}
          </button>
        ))}
      </nav>

      {/* Pedestal stage: Kawkab on the circle, Training left · Wellbeing right */}
      <div className="home-stage">
        <button
          type="button"
          className="home-chip home-chip--left"
          onClick={() => handleDoor('comics')}
        >
          <span className="home-chip-ic" aria-hidden="true">🧠</span>
          <span>{isAr ? 'تدريب' : 'Training'}</span>
        </button>

        <div className="home-character" aria-hidden="true">
          <CosmosCharacter size={isDesktop ? 168 : 162} glow art="kawkab" />
        </div>

        <button
          type="button"
          className="home-chip home-chip--right"
          onClick={() => handleDoor('relax')}
        >
          <span className="home-chip-ic" aria-hidden="true">🌿</span>
          <span>{isAr ? 'العافية' : 'Wellbeing'}</span>
        </button>
      </div>

      <div className="home-bottom">
        <HomeTodayPanel isAr={isAr} playSfx={playSfx} switchTab={switchTab} />
        <button
          type="button"
          className="home-cta"
          onClick={openDailyHabits}
        >
          {isAr ? 'العادات اليومية' : 'Daily Habits'}
        </button>
      </div>
    </div>
  );
}
