import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import SettingsScreen, { AboutModal } from '../features/settings/SettingsScreen';

/** Real brain photo — transparent PNG, lateral (side) view. */
function SplashBrainSide({ className }) {
  return (
    <img
      className={className}
      src="/the-maze-man-comics/Assets/brain-side.png"
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}

export default function SplashScreen({ onDone }) {
  const { currentLang } = useApp();
  const isAr = currentLang === 'ar';
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

  /** Inline so layout never depends on cached CSS (column stack, full-width rows). */
  const splashStackStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    width: '100%',
    maxWidth: 'min(400px, 94vw)',
    marginLeft: 'auto',
    marginRight: 'auto',
    gap: 'clamp(9px, 2.2vw, 12px)',
    boxSizing: 'border-box',
  };
  const splashRowBtn = {
    display: 'block',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    flexShrink: 0,
  };

  return (
    <div className={`splash-screen${fading || quitting ? ' splash-out' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>

      <header className="splash-header">
        <div className="splash-hero-inner">
          <h1 className="splash-title" data-title={isAr ? 'رجل المتاهة' : 'Maze Man'}>
            {isAr ? 'رجل المتاهة' : 'Maze Man'}
          </h1>
          <div className="splash-subbrand">
            <p className="splash-subbrand-title">
              <span className="splash-subbrand-label" dir={isAr ? 'rtl' : 'ltr'}>
                <span>{isAr ? 'لعبة' : 'Brain'}</span>
                <span className="splash-subbrand-visual">
                  <SplashBrainSide className="splash-brain-side" />
                </span>
                <span>{isAr ? 'العقل' : 'Games'}</span>
              </span>
            </p>
          </div>
        </div>
      </header>

      <div className="splash-bottom">
        {ready ? (
          <nav
            className="splash-menu"
            style={splashStackStyle}
            aria-label={isAr ? 'القائمة الرئيسية' : 'Main menu'}
          >
            <button type="button" className="splash-start" style={splashRowBtn} onClick={handleStart}>
              {isAr ? 'ابدأ' : 'Start'}
            </button>
            <button type="button" className="splash-menu-btn" style={splashRowBtn} onClick={() => setShowSettings(true)}>
              {isAr ? 'الإعدادات' : 'Settings'}
            </button>
            <button type="button" className="splash-menu-btn" style={splashRowBtn} onClick={() => setShowAbout(true)}>
              {isAr ? 'عن التطبيق' : 'About'}
            </button>
            <button type="button" className="splash-menu-btn splash-menu-btn--quit" style={splashRowBtn} onClick={handleQuit}>
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
