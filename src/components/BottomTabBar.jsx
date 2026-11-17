import React from 'react';
import { Tabbar, TabbarLink, ToolbarPane } from 'konsta/react';
import { House, Compass, PuzzlePiece, ChartPolar, Crown } from '@phosphor-icons/react';
import { useApp } from '../context/AppContext';
import NayzakLogo from './shared/NayzakLogo';
import { assetUrl } from '../lib/assetUrl';

/** 4-Tab Architecture for NAYZAK GAMES: Today, Domains, Puzzles, Insights */
export const APP_TABS = [
  { id: 'home', screen: 'habits', Icon: House, en: 'Today', ar: 'اليوم' },
  { id: 'domains', screen: 'domains', Icon: Compass, en: 'Domains', ar: 'المجالات' },
  { id: 'puzzles', screen: 'puzzles', Icon: PuzzlePiece, en: 'Puzzles', ar: 'الألغاز' },
  { id: 'profile', screen: 'profile', Icon: ChartPolar, en: 'Insights', ar: 'التقدّم' },
];

const TAB_IDS = new Set(APP_TABS.map((t) => t.id));

/** Normalize nested routes onto a primary tab highlight. */
export function resolveActiveTabId(activeTab) {
  if (activeTab === 'domains') return 'domains';
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

/** Persistent Desktop Navigation Sidebar (>=768px) */
export function DesktopNavRail() {
  const { activeTab, switchTab, currentLang, playSfx, isPro, openPaywall } = useApp();
  const isAr = currentLang === 'ar';
  const current = resolveActiveTabId(activeTab);

  function onSelect(tab) {
    playSfx?.('pop');
    if (tab.id === current && activeTab === tab.screen) return;
    switchTab(tab.screen);
  }

  return (
    <aside
      className="nayzak-desktop-rail hidden md:flex"
      aria-label={isAr ? 'التنقّل الرئيسي' : 'Main navigation'}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="nayzak-rail-brand">
        <NayzakLogo variant="compact" size={38} />
      </div>

      <nav className="nayzak-rail-nav">
        {APP_TABS.map((tab) => {
          const active = current === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelect(tab)}
              className={`nayzak-rail-link${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <tab.Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
              <span>{isAr ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </nav>

      <div className="nayzak-rail-footer">
        {isPro ? (
          <div className="nayzak-rail-pro-active">
            <Crown size={16} weight="fill" color="#FFB012" aria-hidden="true" />
            <span>{isAr ? 'عضوية PRO مفعّلة' : 'Nayzak PRO Active'}</span>
          </div>
        ) : (
          <div className="nayzak-rail-pro-card">
            <div className="nayzak-rail-pro-top">
              <img
                src={assetUrl('Assets/cast-2d-minimal-2026/kawkab.webp')}
                alt=""
                draggable="false"
                className="nayzak-rail-mascot"
              />
              <div>
                <div className="nayzak-rail-pro-title">
                  <Crown size={13} weight="fill" color="#FFB012" aria-hidden="true" />
                  <span>{isAr ? 'نيزك PRO' : 'Nayzak PRO'}</span>
                </div>
                <p className="nayzak-rail-pro-sub">
                  {isAr ? 'إحصائيات وتدريبات بلا حدود' : 'Full insights & unlimited training'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="nayzak-rail-pro-btn"
              onClick={() => {
                playSfx?.('pop');
                openPaywall?.();
              }}
            >
              {isAr ? 'ابدأ التجربة' : 'Upgrade to PRO'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
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

  const tabs = isAr ? [...APP_TABS].reverse() : APP_TABS;

  return (
    <Tabbar
      labels
      icons
      className="app-tabbar-konsta left-0 bottom-0 fixed w-full z-[100]"
      innerClassName="max-w-[680px] mx-auto"
      aria-label={isAr ? 'التنقّل الرئيسي' : 'Main navigation'}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <ToolbarPane key={isAr ? 'rtl' : 'ltr'} dir="ltr">
        {tabs.map((tab) => {
          const active = current === tab.id;
          return (
            <TabbarLink
              key={tab.id}
              active={active}
              className={active ? 'is-active' : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(tab)}
              icon={
                <span className="inline-flex items-center justify-center" aria-hidden="true">
                  <tab.Icon
                    size={21}
                    weight={active ? 'fill' : 'regular'}
                  />
                </span>
              }
              label={<span dir={isAr ? 'rtl' : 'ltr'}>{isAr ? tab.ar : tab.en}</span>}
            />
          );
        })}
      </ToolbarPane>
    </Tabbar>
  );
}
