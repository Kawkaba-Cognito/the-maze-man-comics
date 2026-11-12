import React from 'react';
import { House, PuzzlePiece, UserCircle } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

/** Streamlined 3-Tab Architecture for Nayzak AI: Home (Training included), Puzzles, Profile */
export const APP_TABS = [
  { id: 'home', screen: 'habits', Icon: House, en: 'Home', ar: 'الرئيسية' },
  { id: 'puzzles', screen: 'puzzles', Icon: PuzzlePiece, en: 'Puzzles', ar: 'الألغاز' },
  { id: 'profile', screen: 'profile', Icon: UserCircle, en: 'Profile', ar: 'ملفي' },
];

const TAB_IDS = new Set(APP_TABS.map((t) => t.id));

/** Normalize nested routes onto a primary tab highlight. */
export function resolveActiveTabId(activeTab) {
  if (
    activeTab === 'habits'
    || activeTab === 'home'
    || activeTab === 'comics'
    || activeTab === 'games'
    || activeTab === 'training'
    || activeTab === 'workout'
    || activeTab === 'relax'
    || activeTab === 'wellbeing'
    || activeTab === 'learn'
  ) return 'home';
  if (activeTab === 'puzzles') return 'puzzles';
  if (
    activeTab === 'profile'
    || activeTab === 'pointshop'
    || activeTab === 'shop'
    || activeTab === 'character'
    || activeTab === 'other'
  ) return 'profile';
  if (TAB_IDS.has(activeTab)) return activeTab;
  return 'home';
}

export default function BottomTabBar() {
  const { activeTab, switchTab, currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const current = resolveActiveTabId(activeTab);

  function onSelect(tab) {
    playSfx?.('pop');
    if (tab.id === current && activeTab === tab.screen) return;
    switchTab(tab.screen);
  }

  return (
    <nav className="app-tabbar app-tabbar--3" aria-label={isAr ? 'التنقّل الرئيسي' : 'Main navigation'} dir={isAr ? 'rtl' : 'ltr'}>
      {APP_TABS.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`app-tab${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(tab)}
          >
            <span className="app-tab-ic" aria-hidden="true">
              <tab.Icon
                size="1.4em"
                weight={active ? 'fill' : 'regular'}
              />
            </span>
            <span className="app-tab-lbl">{isAr ? tab.ar : tab.en}</span>
            {active && <span className="app-tab-pip" aria-hidden="true" />}
          </button>
        );
      })}
    </nav>
  );
}
