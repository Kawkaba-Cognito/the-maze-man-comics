import React from 'react';
import { useApp } from '../context/AppContext';
import BottomTabBar, { resolveActiveTabId } from './BottomTabBar';
import PuzzlesScreen from './screens/PuzzlesScreen';
import ProfileScreen from './screens/ProfileScreen';
import HomeScreen from './screens/HomeScreen';
import PaywallModal from './modals/PaywallModal';

/**
 * Streamlined AppShell for Nayzak AI:
 * - Tab 1: Home (Training & Cartoon Room Stage)
 * - Tab 2: Puzzles (Puzzle Studio)
 * - Tab 3: Profile (Stats & Settings)
 * - Paywall Modal (Nayzak PRO Boundaries Shield)
 */
export default function AppShell() {
  const { activeTab, immersive, activeModalGame } = useApp();
  const currentTab = resolveActiveTabId(activeTab);
  // Hide bottom tab bar if immersive OR if any modal game is open
  const showTabBar = !immersive && !activeModalGame;

  return (
    <>
      <div
        id="ui-shell"
        className={showTabBar ? 'ui-shell--tabbed' : undefined}
      >
        {/* 1. Home Screen (Includes Cartoon Nayzak Stage + 18 Cognitive Training Games) */}
        <div
          id="screen-home"
          className={`ui-screen ${currentTab === 'home' ? 'active' : ''}`}
        >
          <HomeScreen />
        </div>

        {/* 2. Puzzle Studio (Wordle, Blockburst, Tangram, Rush Hour, etc.) */}
        <div
          id="screen-puzzles"
          className={`ui-screen ${currentTab === 'puzzles' ? 'active' : ''}`}
        >
          <PuzzlesScreen />
        </div>

        {/* 3. User Profile & Settings */}
        <div
          id="screen-profile"
          className={`ui-screen ${currentTab === 'profile' ? 'active' : ''}`}
        >
          <ProfileScreen />
        </div>
      </div>

      {showTabBar && <BottomTabBar />}
      <PaywallModal />
    </>
  );
}
