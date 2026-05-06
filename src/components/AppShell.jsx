import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MazeBackground from './MazeBackground';
import HomeScreen from './screens/HomeScreen';
import ComicsScreen from './screens/ComicsScreen';
import VideosScreen from './screens/VideosScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import MazeOverlay from './maze/MazeOverlay';
import PaywallModal from './modals/PaywallModal';
import TipJarModal from './modals/TipJarModal';
import TipButton from './shared/TipButton';
import { LANG } from '../data/langStrings';

export default function AppShell({ onBackToMenu }) {
  const { activeTab, mazeVisible, mazeEntryPending, enterMaze, switchTab, toggleLang, currentLang } = useApp();
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';
  const isHome = activeTab === 'home';

  useEffect(() => {
    if (!mazeEntryPending) return;
    const timer = setTimeout(() => enterMaze(), 4000);
    return () => clearTimeout(timer);
  }, [mazeEntryPending, enterMaze]);

  return (
    <>
      <canvas id="maze-bg-canvas"></canvas>
      <div id="maze-photo-layer" aria-hidden="true"></div>
      <MazeBackground />

      {!mazeVisible && (
        <>
          <div className="bg-poster" />
          <div className="bg-overlay" />
        </>
      )}

      {mazeEntryPending && <div className="maze-transition-overlay" />}

      <div id="ui-shell" style={{ display: mazeVisible ? 'none' : undefined }}>

        {/* Floating HUD — top bar with no background */}
        <div className="floating-hud">
          {isHome && (
            <button className="back-to-menu-btn" onClick={onBackToMenu}>
              {isAr ? '‹ القائمة' : '‹ MENU'}
            </button>
          )}
          {/* Lang toggle hidden on comics/training (it has its own) */}
          {activeTab !== 'comics' && (
            <button
              id="lang-btn"
              onClick={toggleLang}
              style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", marginLeft: 'auto' }}
            >
              {t.btn}
            </button>
          )}
        </div>

        {/* Back button — visible on non-home screens except comics (training has its own) */}
        {!isHome && activeTab !== 'comics' && (
          <button className="back-btn" onClick={() => switchTab('home')}>
            ‹ {isAr ? 'رجوع' : 'BACK'}
          </button>
        )}

        {/* Screens */}
        <div id="screen-home"    className={`ui-screen ${activeTab === 'home'    ? 'active' : ''}`}><HomeScreen /></div>
        <div id="screen-comics"  className={`ui-screen ${activeTab === 'comics'  ? 'active' : ''}`}><ComicsScreen /></div>
        <div id="screen-videos"  className={`ui-screen ${activeTab === 'videos'  ? 'active' : ''}`}><VideosScreen /></div>
        <div id="screen-profile" className={`ui-screen ${activeTab === 'profile' ? 'active' : ''}`}><ProfileScreen /></div>
        <div id="screen-shop"    className={`ui-screen ${activeTab === 'shop'    ? 'active' : ''}`}><ShopScreen /></div>

      </div>

      {mazeVisible && <MazeOverlay />}
      <PaywallModal />
      <TipJarModal />
      {isHome && <TipButton />}
    </>
  );
}
