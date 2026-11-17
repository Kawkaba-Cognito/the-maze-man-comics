import React from 'react';
import { KonstaProvider } from 'konsta/react';
import { useApp } from '../context/AppContext';
import BottomTabBar, { DesktopNavRail, resolveActiveTabId } from './BottomTabBar';
import HomeScreen from './screens/HomeScreen';
import DomainsScreen from './screens/DomainsScreen';
import PuzzlesScreen from './screens/PuzzlesScreen';
import ProfileScreen from './screens/ProfileScreen';
import PaywallModal from './modals/PaywallModal';

/**
 * 4-Tab Lumosity-style AppShell for Nayzak AI (powered by Konsta UI iOS primitives):
 * - Tab 1: Today (Home / Daily Session & Stage)
 * - Tab 2: Domains (Cognitive Training Domains)
 * - Tab 3: Puzzles (Puzzle Studio)
 * - Tab 4: Insights (Stats, Progress & Settings)
 * - Paywall Modal (Nayzak PRO Subscription)
 */
export default function AppShell() {
  const { activeTab, immersive, activeModalGame, appTheme, currentLang } = useApp();
  const currentTab = resolveActiveTabId(activeTab);
  const isDark = appTheme === 'dark';
  const isAr = currentLang === 'ar';
  // Hide navigation chrome if immersive OR if any modal game is open
  const showTabBar = !immersive && !activeModalGame;

  return (
    <KonstaProvider theme="ios" dark={isDark}>
      <div className={`k-ios${isDark ? ' dark' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
        {showTabBar && <DesktopNavRail />}
        <div
          id="ui-shell"
          className={
            showTabBar
              ? 'ui-shell--tabbed ui-shell--desktop-rail'
              : undefined
          }
        >
          {/* 1. Today / Home Screen */}
          <div
            id="screen-home"
            className={`ui-screen ${currentTab === 'home' ? 'active' : ''}`}
          >
            <HomeScreen />
          </div>

          {/* 2. Cognitive Domains Screen */}
          <div
            id="screen-domains"
            className={`ui-screen ${currentTab === 'domains' ? 'active' : ''}`}
          >
            <DomainsScreen />
          </div>

          {/* 3. Puzzle Studio (Wordle, Blockburst, Tangram, Rush Hour, etc.) */}
          <div
            id="screen-puzzles"
            className={`ui-screen ${currentTab === 'puzzles' ? 'active' : ''}`}
          >
            <PuzzlesScreen />
          </div>

          {/* 4. Insights & Settings */}
          <div
            id="screen-profile"
            className={`ui-screen ${currentTab === 'profile' ? 'active' : ''}`}
          >
            <ProfileScreen />
          </div>
        </div>

        {showTabBar && <BottomTabBar />}
        <PaywallModal />
      </div>
    </KonstaProvider>
  );
}
