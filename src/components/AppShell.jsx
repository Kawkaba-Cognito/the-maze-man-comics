import React, { useEffect, useMemo, Suspense } from 'react';
import { useApp } from '../context/AppContext';
import { getPuzzle } from '../features/puzzles/registry';
import MazeBackground from './MazeBackground';
import HomeScreen from './screens/HomeScreen';
import ComicsScreen from './screens/ComicsScreen';
import PuzzlesScreen from './screens/PuzzlesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import RewardsShopScreen from './screens/RewardsShopScreen';
import CharacterScreen from './screens/CharacterScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import RoomHost from './maze/RoomHost';
import PaywallModal from './modals/PaywallModal';
import TipJarModal from './modals/TipJarModal';
import TipButton from './shared/TipButton';
import ReminderBanner from '../features/workout/ReminderBanner';
import { LANG } from '../data/langStrings';

/** Recruitment challenge — mounts one of the player's puzzles full-screen.
 *  Solving it calls onSolved (recruit); the puzzle's own Back = onGiveUp. */
function ChallengeLayer({ challenge, onSolved, onGiveUp, isAr }) {
  const Game = useMemo(() => {
    const p = getPuzzle(challenge.puzzleKey);
    return p ? React.lazy(p.loader) : null;
  }, [challenge.puzzleKey]);
  return (
    <div className="challenge-shell">
      {Game ? (
        <Suspense fallback={<div className="challenge-load">{isAr ? 'جارِ التحميل…' : 'Loading…'}</div>}>
          <Game onBack={onGiveUp} onSolved={onSolved} />
        </Suspense>
      ) : (
        <button className="challenge-load" onClick={onGiveUp}>{isAr ? 'رجوع' : 'Back'}</button>
      )}
      <div className="challenge-banner">⚔️ {isAr ? 'اهزم اللغز لتجنيد' : 'Solve to recruit'} <b>{challenge.name}</b></div>
    </div>
  );
}

export default function AppShell({ onBackToMenu }) {
  const { activeTab, mazeVisible, mazeEntryPending, enterMaze, switchTab, toggleLang, currentLang, challenge, finishChallenge } = useApp();
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
          {/* Lang toggle hidden on screens that render their own chrome */}
          {activeTab !== 'comics' && activeTab !== 'puzzles' && activeTab !== 'profile' && activeTab !== 'workout' && (
            <button
              id="lang-btn"
              onClick={toggleLang}
              style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", marginLeft: 'auto' }}
            >
              {t.btn}
            </button>
          )}
        </div>

        {/* Back button — visible on non-home screens that don't render their own chrome */}
        {!isHome && activeTab !== 'comics' && activeTab !== 'puzzles' && activeTab !== 'profile' && activeTab !== 'workout' && (
          <button className="back-btn" onClick={() => switchTab('home')}>
            ‹ {isAr ? 'رجوع' : 'BACK'}
          </button>
        )}

        {/* Screens */}
        <div id="screen-home"    className={`ui-screen ${activeTab === 'home'    ? 'active' : ''}`}><HomeScreen /></div>
        <div id="screen-comics"  className={`ui-screen ${activeTab === 'comics'  ? 'active' : ''}`}><ComicsScreen /></div>
        <div id="screen-puzzles" className={`ui-screen ${activeTab === 'puzzles' ? 'active' : ''}`}><PuzzlesScreen /></div>
        <div id="screen-profile" className={`ui-screen ${activeTab === 'profile' ? 'active' : ''}`}><ProfileScreen /></div>
        <div id="screen-shop"    className={`ui-screen ${activeTab === 'shop'    ? 'active' : ''}`}><ShopScreen /></div>
        <div id="screen-pointshop" className={`ui-screen ${activeTab === 'pointshop' ? 'active' : ''}`}><RewardsShopScreen /></div>
        <div id="screen-character" className={`ui-screen ${activeTab === 'character' ? 'active' : ''}`}><CharacterScreen /></div>
        <div id="screen-workout"   className={`ui-screen ${activeTab === 'workout'   ? 'active' : ''}`}><WorkoutScreen /></div>

      </div>

      {mazeVisible && <RoomHost />}
      {challenge && (
        <ChallengeLayer
          challenge={challenge}
          onSolved={() => finishChallenge(true)}
          onGiveUp={() => finishChallenge(false)}
          isAr={isAr}
        />
      )}
      {!mazeVisible && <ReminderBanner />}
      <PaywallModal />
      <TipJarModal />
      {isHome && <TipButton />}
    </>
  );
}
