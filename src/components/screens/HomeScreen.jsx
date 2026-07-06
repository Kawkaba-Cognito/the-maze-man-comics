import React from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import HomeTodayPanel from '../../features/relax/HomeTodayPanel';
import { OPEN_DAILY_KEY } from '../../features/relax/HabitReminderBanner';

const DOORS = [
  { tab: 'pointshop', enLabel: 'SHOP',    arLabel: 'متجر',  pos: 'left'   },
  { tab: 'profile',   enLabel: 'PROFILE', arLabel: 'ملفي',  pos: 'center' },
  { tab: 'puzzles',   enLabel: 'PUZZLES', arLabel: 'ألغاز', pos: 'right'  },
];

export default function HomeScreen() {
  const { playSfx, switchTab, currentLang, points, equipped } = useApp();
  const isAr = currentLang === 'ar';

  function handleDoor(tab) {
    playSfx('click');
    switchTab(tab);
  }

  function openDailyHabits() {
    playSfx('click');
    try { sessionStorage.setItem(OPEN_DAILY_KEY, '1'); } catch { /* ignore */ }
    switchTab('relax');
  }

  const labelFont = { fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" };

  return (
    <div className="home-screen">
      <div
        className="home-stage-bg"
        style={{ backgroundImage: `url("${assetUrl('Assets/bg-training-mobile.webp')}")` }}
      />
      <div className="home-character" aria-hidden="true">
        <CosmosCharacter size={200} float glow equipped={equipped} />
      </div>

      <div className="home-points" aria-label={isAr ? 'نقاطك' : 'your points'}>
        ⚡ <span className="home-points-num">{points}</span>
      </div>

      {DOORS.map((d) => (
        <button
          key={d.tab}
          className={`maze-door-btn maze-door-${d.pos}`}
          onClick={() => handleDoor(d.tab)}
          style={labelFont}
        >
          {isAr ? d.arLabel : d.enLabel}
        </button>
      ))}

      <button
        className="home-shortcut home-shortcut-left"
        onClick={() => handleDoor('comics')}
        style={labelFont}
      >
        <span className="home-shortcut-ic" aria-hidden="true">🧠</span>
        {isAr ? 'تدريب' : 'TRAINING'}
      </button>

      <button
        className="home-shortcut home-shortcut-right"
        onClick={() => handleDoor('relax')}
        style={labelFont}
      >
        <span className="home-shortcut-ic" aria-hidden="true">🌿</span>
        {isAr ? 'العافية' : 'WELLBEING'}
      </button>

      <div className="home-maze-actions">
        <HomeTodayPanel isAr={isAr} playSfx={playSfx} switchTab={switchTab} labelFont={labelFont} />
        <button
          type="button"
          className="home-maze-btn home-maze-btn--gate"
          style={labelFont}
          onClick={openDailyHabits}
        >
          {isAr ? '📋 العادات' : '📋 HABITS'}
        </button>
      </div>
    </div>
  );
}
