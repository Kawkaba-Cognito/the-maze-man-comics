import React from 'react';
import { useApp } from '../context/AppContext';

/** Primary app destinations. */
export const APP_TABS = [
  { id: 'home', screen: 'home', icon: '🏠', en: 'Home', ar: 'الرئيسية' },
  { id: 'comics', screen: 'comics', icon: '🧠', en: 'Training', ar: 'تدريب' },
  { id: 'wellbeing', screen: 'wellbeing', icon: '🌿', en: 'Wellbeing', ar: 'عافية' },
  { id: 'habits', screen: 'habits', icon: '📋', en: 'Habits', ar: 'عادات' },
  { id: 'puzzles', screen: 'puzzles', icon: '🧩', en: 'Puzzles', ar: 'ألغاز' },
  { id: 'other', screen: 'other', icon: '⋯', en: 'Other', ar: 'المزيد' },
];

const TAB_IDS = new Set(APP_TABS.map((t) => t.id));

/** Normalize nested routes onto a primary tab highlight. */
export function resolveActiveTabId(activeTab) {
  if (activeTab === 'relax') return 'wellbeing';
  if (
    activeTab === 'profile'
    || activeTab === 'pointshop'
    || activeTab === 'shop'
    || activeTab === 'character'
    || activeTab === 'other'
  ) return 'other';
  if (activeTab === 'workout') return 'comics';
  if (TAB_IDS.has(activeTab)) return activeTab;
  return null;
}

export default function BottomTabBar() {
  const { activeTab, switchTab, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const current = resolveActiveTabId(activeTab);

  function onSelect(tab) {
    if (tab.id === current && activeTab === tab.screen) return;
    switchTab(tab.screen);
  }

  return (
    <nav className="app-tabbar" aria-label={isAr ? 'التنقّل' : 'Main navigation'} dir="ltr">
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
            <span className="app-tab-ic" aria-hidden="true">{tab.icon}</span>
            <span className="app-tab-lbl">{isAr ? tab.ar : tab.en}</span>
          </button>
        );
      })}
    </nav>
  );
}
