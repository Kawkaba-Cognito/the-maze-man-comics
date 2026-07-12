import React from 'react';
import { House, Target, BookOpen, Leaf, DotsThreeOutline } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';

/** Primary app destinations — the daily habits check-in is Home; Training is its own tab. */
export const APP_TABS = [
  { id: 'home', screen: 'habits', Icon: House, en: 'Home', ar: 'الرئيسية' },
  { id: 'training', screen: 'comics', Icon: Target, en: 'Training', ar: 'تدريب' },
  { id: 'learn', screen: 'learn', Icon: BookOpen, en: 'Learn', ar: 'تعلّم' },
  { id: 'wellbeing', screen: 'wellbeing', Icon: Leaf, en: 'Wellbeing', ar: 'عافية' },
  { id: 'other', screen: 'other', Icon: DotsThreeOutline, en: 'Other', ar: 'المزيد' },
];

const TAB_IDS = new Set(APP_TABS.map((t) => t.id));

/** Normalize nested routes onto a primary tab highlight. */
export function resolveActiveTabId(activeTab) {
  if (activeTab === 'habits') return 'home';
  // Puzzles no longer has its own tab — it's reached from inside Training,
  // so the tab bar keeps Training highlighted while browsing it.
  if (activeTab === 'comics' || activeTab === 'home' || activeTab === 'workout' || activeTab === 'puzzles') return 'training';
  if (activeTab === 'relax') return 'wellbeing';
  if (
    activeTab === 'profile'
    || activeTab === 'pointshop'
    || activeTab === 'shop'
    || activeTab === 'character'
    || activeTab === 'other'
  ) return 'other';
  if (TAB_IDS.has(activeTab)) return activeTab;
  return null;
}

export default function BottomTabBar() {
  const { activeTab, switchTab, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const current = resolveActiveTabId(activeTab);

  function onSelect(tab) {
    if (tab.id === current && activeTab === tab.screen) return;
    if (tab.id === 'training' && (activeTab === 'comics' || activeTab === 'workout')) return;
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
            <span className="app-tab-ic" aria-hidden="true">
              <tab.Icon size="1.28em" weight={active ? 'duotone' : 'regular'} />
            </span>
            <span className="app-tab-lbl">{isAr ? tab.ar : tab.en}</span>
          </button>
        );
      })}
    </nav>
  );
}
