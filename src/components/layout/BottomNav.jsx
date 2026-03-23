import React from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';

const NAV_ITEMS = [
  { id: 'home',    icon: '🏠' },
  { id: 'comics',  icon: '📚' },
  { id: 'videos',  icon: '🎬' },
  { id: 'profile', icon: '👤' },
  { id: 'shop',    icon: '🛒' },
];

export default function BottomNav() {
  const { activeTab, switchTab, currentLang } = useApp();
  const labels = LANG[currentLang].nav;
  const isAr = currentLang === 'ar';

  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => switchTab(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
