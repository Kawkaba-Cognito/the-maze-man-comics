import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SettingsScreen, { AboutModal } from '../features/settings/SettingsScreen';
import { assetUrl } from '../lib/assetUrl';

const SPLASH_BG = {
  en: {
    mobile: 'Assets/splash-menu-mobile-en.png',
    desktop: 'Assets/splash-menu-desktop-en.png',
  },
  ar: {
    mobile: 'Assets/splash-menu-mobile-ar.png',
    desktop: 'Assets/splash-menu-desktop-ar.png',
  },
};

export default function SplashScreen({ onDone }) {
  const { currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const lang = isAr ? 'ar' : 'en';
  const [ready, setReady] = useState(false);
  const [fading, setFading] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(t);
  }, []);

  function handleStart() { setFading(true); setTimeout(onDone, 700); }
  function handleQuit() { setQuitting(true); setTimeout(() => { try { window.close(); } catch (_) {} }, 400); }

  const bgStyle = {
    '--splash-bg-mobile': `url("${assetUrl(SPLASH_BG[lang].mobile)}")`,
    '--splash-bg-desktop': `url("${assetUrl(SPLASH_BG[lang].desktop)}")`,
  };

  return (
    <div
      className={`splash-screen${fading || quitting ? ' splash-out' : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
      data-lang={lang}
      style={bgStyle}
    >
      <div className="splash-bottom">
        {ready ? (
          <nav className="splash-menu" aria-label={isAr ? 'القائمة الرئيسية' : 'Main menu'}>
            <button type="button" className="splash-start" onClick={handleStart}>
              {isAr ? 'ابدأ' : 'Start'}
            </button>
            {/* Daily Workout now lives inside the 3D world — talk to the Coach in The Gym (green door). */}
            <button type="button" className="splash-menu-btn" onClick={() => setShowSettings(true)}>
              {isAr ? 'الإعدادات' : 'Settings'}
            </button>
            <button type="button" className="splash-menu-btn" onClick={() => setShowAbout(true)}>
              {isAr ? 'عن التطبيق' : 'About'}
            </button>
            <button type="button" className="splash-menu-btn splash-menu-btn--quit" onClick={handleQuit}>
              {isAr ? 'خروج' : 'Quit'}
            </button>
          </nav>
        ) : (
          <p className="splash-loading">loading<span className="splash-ellipsis" /></p>
        )}
      </div>

      {showSettings && <SettingsScreen onClose={() => setShowSettings(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
