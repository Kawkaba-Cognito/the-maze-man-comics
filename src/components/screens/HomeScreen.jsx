import React from 'react';
import { useApp } from '../../context/AppContext';

const DOORS = [
  { tab: 'comics',  enLabel: 'TRAINING', arLabel: 'تدريب', pos: 'left'   },
  { tab: 'profile', enLabel: 'PROFILE',  arLabel: 'ملفي',  pos: 'center' },
  { tab: 'puzzles', enLabel: 'PUZZLES', arLabel: 'ألغاز', pos: 'right'  },
];

export default function HomeScreen() {
  const { requestMazeEntry, playSfx, switchTab, currentLang, points } = useApp();
  const isAr = currentLang === 'ar';

  function handleDoor(tab) {
    playSfx('click');
    switchTab(tab);
  }

  const labelFont = { fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" };

  return (
    <div className="home-screen">
      {/* Points balance — top of the home page */}
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

      {/* Character — under the TRAINING door (left); Shop — under PUZZLES (right) */}
      <button
        className="home-shortcut home-shortcut-left"
        onClick={() => handleDoor('character')}
        style={labelFont}
      >
        <span className="home-shortcut-ic" aria-hidden="true">🦊</span>
        {isAr ? 'الشخصية' : 'CHARACTER'}
      </button>
      <button
        className="home-shortcut home-shortcut-right"
        onClick={() => handleDoor('pointshop')}
        style={labelFont}
      >
        <span className="home-shortcut-ic" aria-hidden="true">🛍️</span>
        {isAr ? 'المتجر' : 'SHOP'}
      </button>

      <button
        className="home-maze-btn"
        style={labelFont}
        onClick={requestMazeEntry}
      >
        {isAr ? 'ادخل المتاهة' : 'ENTER THE MAZE'}
      </button>
    </div>
  );
}
