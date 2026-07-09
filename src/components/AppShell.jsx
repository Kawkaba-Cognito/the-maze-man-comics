import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MazeBackground from './MazeBackground';
import BottomTabBar, { resolveActiveTabId } from './BottomTabBar';
import ComicsScreen from './screens/ComicsScreen';
import PuzzlesScreen from './screens/PuzzlesScreen';
import ProfileScreen from './screens/ProfileScreen';
import ShopScreen from './screens/ShopScreen';
import RewardsShopScreen from './screens/RewardsShopScreen';
import CharacterScreen from './screens/CharacterScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import OtherScreen from './screens/OtherScreen';
import RelaxScreen from '../features/relax/RelaxScreen';
import RoomHost from './maze/RoomHost';
import PaywallModal from './modals/PaywallModal';
import ReminderBanner from '../features/workout/ReminderBanner';
import HabitReminderBanner from '../features/relax/HabitReminderBanner';
import { syncHabitReminders } from '../features/relax/habitReminders';
import { loadHabits } from '../features/relax/habitState';
import { LANG } from '../data/langStrings';

function isRelaxTab(tab) {
  return tab === 'habits' || tab === 'wellbeing' || tab === 'relax';
}

export default function AppShell() {
  const { activeTab, immersive, mazeVisible, mazeEntryPending, enterMaze, switchTab, toggleLang, currentLang } = useApp();
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';
  const isTrainingHome = activeTab === 'comics' || activeTab === 'home';
  // Hide the tab bar on any deep view (game / practice / session) — it shows
  // only on the tab landing pages.
  const showTabBar = !mazeVisible && !mazeEntryPending && !immersive;
  const primaryTab = resolveActiveTabId(activeTab);

  useEffect(() => {
    if (!mazeEntryPending) return;
    const timer = setTimeout(() => enterMaze(), 4000);
    return () => clearTimeout(timer);
  }, [mazeEntryPending, enterMaze]);

  useEffect(() => {
    syncHabitReminders(loadHabits(), currentLang);
  }, [currentLang]);

  return (
    <>
      <canvas id="maze-bg-canvas"></canvas>
      <div id="maze-photo-layer" aria-hidden="true"></div>
      <MazeBackground />

      {!mazeVisible && !isTrainingHome && (
        <>
          <div className="bg-poster" />
          <div className="bg-overlay" />
        </>
      )}

      {mazeEntryPending && <div className="maze-transition-overlay" />}

      <div
        id="ui-shell"
        className={showTabBar ? 'ui-shell--tabbed' : undefined}
        style={{ display: mazeVisible ? 'none' : undefined }}
      >

        <div className="floating-hud">
          {activeTab !== 'comics'
            && activeTab !== 'home'
            && activeTab !== 'puzzles'
            && activeTab !== 'profile'
            && activeTab !== 'workout'
            && activeTab !== 'other'
            && !isRelaxTab(activeTab)
            && activeTab !== 'pointshop' && (
            <button
              id="lang-btn"
              onClick={toggleLang}
              style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}
            >
              {t.btn}
            </button>
          )}
        </div>

        {!primaryTab && activeTab !== 'comics' && activeTab !== 'home' && activeTab !== 'puzzles' && activeTab !== 'profile' && activeTab !== 'workout' && activeTab !== 'other' && !isRelaxTab(activeTab) && (
          <button className="back-btn" onClick={() => switchTab('comics')}>
            ‹ {isAr ? 'رجوع' : 'BACK'}
          </button>
        )}

        <div id="screen-comics" className={`ui-screen ${isTrainingHome ? 'active' : ''}`}><ComicsScreen /></div>
        <div id="screen-puzzles" className={`ui-screen ${activeTab === 'puzzles' ? 'active' : ''}`}><PuzzlesScreen /></div>
        <div id="screen-profile" className={`ui-screen ${activeTab === 'profile' ? 'active' : ''}`}><ProfileScreen /></div>
        <div id="screen-shop" className={`ui-screen ${activeTab === 'shop' ? 'active' : ''}`}><ShopScreen /></div>
        <div id="screen-pointshop" className={`ui-screen ${activeTab === 'pointshop' ? 'active' : ''}`}><RewardsShopScreen /></div>
        <div id="screen-character" className={`ui-screen ${activeTab === 'character' ? 'active' : ''}`}>{activeTab === 'character' && <CharacterScreen />}</div>
        <div id="screen-workout" className={`ui-screen ${activeTab === 'workout' ? 'active' : ''}`}><WorkoutScreen /></div>
        <div id="screen-other" className={`ui-screen ${activeTab === 'other' ? 'active' : ''}`}>
          {activeTab === 'other' && <OtherScreen />}
        </div>
        <div id="screen-relax" className={`ui-screen ${isRelaxTab(activeTab) ? 'active' : ''}`}>
          {isRelaxTab(activeTab) && (
            <RelaxScreen
              key={activeTab === 'habits' ? 'habits' : 'wellbeing'}
              entry={activeTab === 'habits' ? 'daily' : 'menu'}
            />
          )}
        </div>

      </div>

      {showTabBar && <BottomTabBar />}

      {mazeVisible && <RoomHost />}
      {!mazeVisible && <ReminderBanner />}
      {!mazeVisible && <HabitReminderBanner />}
      <PaywallModal />
    </>
  );
}
