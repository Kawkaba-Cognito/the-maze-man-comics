import React from 'react';
import { useApp } from '../../context/AppContext';

const DOORS = [
  { tab: 'comics',  enLabel: 'TRAINING', arLabel: 'تدريب', pos: 'left'   },
  { tab: 'profile', enLabel: 'PROFILE',  arLabel: 'ملفي',  pos: 'center' },
  { tab: 'videos',  enLabel: 'LEARN',    arLabel: 'تعلم',  pos: 'right'  },
];

export default function HomeScreen() {
  const { requestMazeEntry, playSfx, switchTab, currentLang } = useApp();
  const isAr = currentLang === 'ar';

  function handleDoor(tab) {
    playSfx('click');
    switchTab(tab);
  }

  return (
    <div className="home-screen">
      {DOORS.map(d => (
        <button
          key={d.tab}
          className={`maze-door-btn maze-door-${d.pos}`}
          onClick={() => handleDoor(d.tab)}
          style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}
        >
          {isAr ? d.arLabel : d.enLabel}
        </button>
      ))}

      <button
        className="home-maze-btn"
        style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" }}
        onClick={requestMazeEntry}
      >
        {isAr ? 'ادخل المتاهة' : 'ENTER THE MAZE'}
      </button>
    </div>
  );
}
