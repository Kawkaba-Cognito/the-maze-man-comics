import React, { useState } from 'react';
import { UserCircle, ShoppingCart, ChartBar, Medal, MoonStars, Gear, Info, ChatCircleDots, Compass, CastleTurret, Crown } from '@phosphor-icons/react';
import { useApp } from '../../context/AppContext';
import UniverseStage from '../shared/UniverseStage';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import SettingsScreen, { AboutModal } from '../../features/settings/SettingsScreen';
import WorkoutStats from './WorkoutStats';
import { IconBack } from '../../features/training/shared/TrainingIcons';

const MENU = [
  { id: 'profile', icon: <UserCircle size="1.4rem" weight="duotone" />, en: 'Profile', ar: 'الملف', kind: 'tab', tab: 'profile' },
  { id: 'shop', icon: <ShoppingCart size="1.4rem" weight="duotone" />, en: 'Shop', ar: 'المتجر', kind: 'tab', tab: 'pointshop' },
  { id: 'stats', icon: <ChartBar size="1.4rem" weight="duotone" />, en: 'Stats', ar: 'الإحصاءات', kind: 'view', view: 'stats' },
  { id: 'awards', icon: <Medal size="1.4rem" weight="duotone" />, en: 'Awards', ar: 'الجوائز', kind: 'view', view: 'awards' },
  { id: 'appearance', icon: <MoonStars size="1.4rem" weight="duotone" />, en: 'Appearance', ar: 'المظهر', kind: 'view', view: 'appearance' },
  { id: 'settings', icon: <Gear size="1.4rem" weight="duotone" />, en: 'Settings', ar: 'الإعدادات', kind: 'view', view: 'settings' },
  { id: 'about', icon: <Info size="1.4rem" weight="duotone" />, en: 'About', ar: 'عن التطبيق', kind: 'about' },
  { id: 'support', icon: <ChatCircleDots size="1.4rem" weight="duotone" />, en: 'Support', ar: 'الدعم', kind: 'view', view: 'support' },
];

function AppearancePanel({ isAr, chrome, appTheme, setAppTheme, playSfx, onBack }) {
  const options = [
    {
      id: 'dark',
      swatch: 'other-theme-swatch--dark',
      en: 'Dark', ar: 'داكن',
      descEn: 'The default look — night sky, easy on the eyes.',
      descAr: 'المظهر الافتراضي — سماء ليلية مريحة للعين.',
    },
    {
      id: 'light',
      swatch: 'other-theme-swatch--light',
      en: 'Light', ar: 'فاتح',
      descEn: 'Warm parchment tones, bright rooms.',
      descAr: 'ألوان دافئة تشبه الرَق، مناسبة للغرف المضيئة.',
    },
  ];
  return (
    <div className="other-sub" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="app-chrome-bar other-sub-bar">
        <button type="button" style={chrome.chromeBtn} onClick={onBack} aria-label={isAr ? 'رجوع' : 'Back'}>
          <IconBack size={18} c={chrome.text} />
        </button>
        <div style={chrome.title}>{isAr ? 'المظهر' : 'Appearance'}</div>
        <div style={{ width: 34 }} />
      </div>
      <div className="other-awards">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`other-theme-card${appTheme === o.id ? ' sel' : ''}`}
            onClick={() => { playSfx('click'); setAppTheme(o.id); }}
          >
            <span className={`other-theme-swatch ${o.swatch}`} aria-hidden="true" />
            <span>
              <div className="other-theme-name">{isAr ? o.ar : o.en}</div>
              <div className="other-theme-desc">{isAr ? o.descAr : o.descEn}</div>
            </span>
            <span className="other-theme-check" aria-hidden="true">{appTheme === o.id ? '✓' : ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AwardsPanel({ isAr, chrome, profileData, onBack }) {
  const badges = [
    { id: 'explorer', icon: <Compass size="1.5rem" weight="duotone" />, en: 'Explorer', ar: 'مستكشف', unlocked: !!profileData.badges?.explorer },
    { id: 'maze', icon: <CastleTurret size="1.5rem" weight="duotone" />, en: 'Maze Walker', ar: 'سائر المتاهة', unlocked: !!profileData.badges?.maze },
    { id: 'master', icon: <Crown size="1.5rem" weight="duotone" />, en: 'Master', ar: 'متمرّس', unlocked: !!profileData.badges?.master },
  ];
  return (
    <div className="other-sub" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="app-chrome-bar other-sub-bar">
        <button type="button" style={chrome.chromeBtn} onClick={onBack} aria-label={isAr ? 'رجوع' : 'Back'}>
          <IconBack size={18} c={chrome.text} />
        </button>
        <div style={chrome.title}>{isAr ? 'الجوائز' : 'Awards'}</div>
        <div style={{ width: 34 }} />
      </div>
      <div className="other-awards">
        {badges.map((b) => (
          <div key={b.id} className={`other-award${b.unlocked ? ' is-on' : ''}`}>
            <span className="other-award-ic" aria-hidden="true">{b.icon}</span>
            <div>
              <div className="other-award-title">{isAr ? b.ar : b.en}</div>
              <div className="other-award-sub">
                {b.unlocked
                  ? (isAr ? 'مفتوح' : 'Unlocked')
                  : (isAr ? 'مقفل — تابع التقدّم' : 'Locked — keep going')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupportPanel({ isAr, chrome, onBack, playSfx }) {
  return (
    <div className="other-sub" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="app-chrome-bar other-sub-bar">
        <button type="button" style={chrome.chromeBtn} onClick={onBack} aria-label={isAr ? 'رجوع' : 'Back'}>
          <IconBack size={18} c={chrome.text} />
        </button>
        <div style={chrome.title}>{isAr ? 'الدعم' : 'Support'}</div>
        <div style={{ width: 34 }} />
      </div>
      <div className="other-support">
        <p className="other-support-text">
          {isAr
            ? 'نحب أن نسمع منك. راسلنا لأي مساعدة أو ملاحظات.'
            : 'We’d love to hear from you. Reach out for help or feedback.'}
        </p>
        <a
          className="other-support-link"
          href="mailto:support@mazeman.app"
          onClick={() => playSfx?.('click')}
        >
          support@mazeman.app
        </a>
      </div>
    </div>
  );
}

export default function OtherScreen() {
  const { switchTab, currentLang, playSfx, profileData, toggleLang, appTheme, setAppTheme } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);
  const [view, setView] = useState('menu');
  const [showAbout, setShowAbout] = useState(false);

  if (view === 'settings') {
    return <SettingsScreen onClose={() => setView('menu')} />;
  }
  if (view === 'stats') {
    return <WorkoutStats onBack={() => setView('menu')} />;
  }
  if (view === 'awards') {
    return (
      <div className={`other-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}>
        <UniverseStage accent="other" dark={chrome.dark} />
        <AwardsPanel
          isAr={isAr}
          chrome={chrome}
          profileData={profileData}
          onBack={() => { playSfx('click'); setView('menu'); }}
        />
      </div>
    );
  }
  if (view === 'appearance') {
    return (
      <div className={`other-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}>
        <UniverseStage accent="other" dark={chrome.dark} />
        <AppearancePanel
          isAr={isAr}
          chrome={chrome}
          appTheme={appTheme}
          setAppTheme={setAppTheme}
          playSfx={playSfx}
          onBack={() => { playSfx('click'); setView('menu'); }}
        />
      </div>
    );
  }
  if (view === 'support') {
    return (
      <div className={`other-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}>
        <UniverseStage accent="other" dark={chrome.dark} />
        <SupportPanel
          isAr={isAr}
          chrome={chrome}
          playSfx={playSfx}
          onBack={() => { playSfx('click'); setView('menu'); }}
        />
      </div>
    );
  }

  function onItem(item) {
    playSfx('click');
    if (item.kind === 'tab') switchTab(item.tab);
    else if (item.kind === 'view') setView(item.view);
    else if (item.kind === 'about') setShowAbout(true);
  }

  return (
    <div
      className={`other-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <UniverseStage accent="other" dark={chrome.dark} />
      <div className="other-content">
        <div className="app-chrome-bar other-top">
          <div style={{ width: 34 }} />
          <div style={{ ...chrome.title, fontSize: isAr ? 24 : 22 }}>
            {isAr ? 'المزيد' : 'Other'}
          </div>
          <button type="button" style={chrome.langBtn} onClick={toggleLang}>
            {isAr ? 'EN' : 'عر'}
          </button>
        </div>

        <div className="other-menu">
          {MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className="other-menu-item"
              onClick={() => onItem(item)}
            >
              <span className="other-menu-ic" aria-hidden="true">{item.icon}</span>
              <span className="other-menu-lbl">{isAr ? item.ar : item.en}</span>
              <span className="other-menu-chev" aria-hidden="true">{isAr ? '‹' : '›'}</span>
            </button>
          ))}
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
