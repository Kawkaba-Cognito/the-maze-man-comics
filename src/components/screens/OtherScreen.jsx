import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import SettingsScreen, { AboutModal } from '../../features/settings/SettingsScreen';
import WorkoutStats from './WorkoutStats';
import { IconBack } from '../../features/training/shared/TrainingIcons';

const MENU = [
  { id: 'profile', icon: '👤', en: 'Profile', ar: 'الملف', kind: 'tab', tab: 'profile' },
  { id: 'shop', icon: '🛒', en: 'Shop', ar: 'المتجر', kind: 'tab', tab: 'pointshop' },
  { id: 'stats', icon: '📊', en: 'Stats', ar: 'الإحصاءات', kind: 'view', view: 'stats' },
  { id: 'awards', icon: '🏅', en: 'Awards', ar: 'الجوائز', kind: 'view', view: 'awards' },
  { id: 'settings', icon: '⚙️', en: 'Settings', ar: 'الإعدادات', kind: 'view', view: 'settings' },
  { id: 'about', icon: 'ℹ️', en: 'About', ar: 'عن التطبيق', kind: 'about' },
  { id: 'support', icon: '💬', en: 'Support', ar: 'الدعم', kind: 'view', view: 'support' },
];

function AwardsPanel({ isAr, chrome, profileData, onBack }) {
  const badges = [
    { id: 'explorer', icon: '🧭', en: 'Explorer', ar: 'مستكشف', unlocked: !!profileData.badges?.explorer },
    { id: 'maze', icon: '🏰', en: 'Maze Walker', ar: 'سائر المتاهة', unlocked: !!profileData.badges?.maze },
    { id: 'master', icon: '👑', en: 'Master', ar: 'متمرّس', unlocked: !!profileData.badges?.master },
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
  const { switchTab, currentLang, playSfx, profileData, toggleLang } = useApp();
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
        <AtmosphericBackground strength="panel" photo={false} />
        <AwardsPanel
          isAr={isAr}
          chrome={chrome}
          profileData={profileData}
          onBack={() => { playSfx('click'); setView('menu'); }}
        />
      </div>
    );
  }
  if (view === 'support') {
    return (
      <div className={`other-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}>
        <AtmosphericBackground strength="panel" photo={false} />
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
      <AtmosphericBackground strength="panel" photo={false} />
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
