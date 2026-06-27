import React from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';
import { getCharacter, NO_CHARACTER } from '../../features/character/registry';
import CosmosCharacter from '../../features/character/CosmosCharacter';

const DOORS = [
  { tab: 'comics',  enLabel: 'TRAINING', arLabel: 'تدريب', pos: 'left'   },
  { tab: 'profile', enLabel: 'PROFILE',  arLabel: 'ملفي',  pos: 'center' },
  { tab: 'puzzles', enLabel: 'PUZZLES', arLabel: 'ألغاز', pos: 'right'  },
];

export default function HomeScreen() {
  const { playSfx, switchTab, currentLang, points, character, equipped } = useApp();
  const isAr = currentLang === 'ar';
  const noChar = character === NO_CHARACTER;
  const Hero = noChar ? null : getCharacter(character).Component;

  function handleDoor(tab) {
    playSfx('click');
    switchTab(tab);
  }

  const labelFont = { fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive" };

  return (
    <div className="home-screen">
      <div
        className="home-stage-bg"
        style={{ backgroundImage: `url("${assetUrl('Assets/bg-training-mobile.webp')}")` }}
      />
      <button
        className="home-character"
        onClick={() => handleDoor('character')}
        aria-label={isAr ? 'الشخصية' : 'character'}
      >
        {noChar ? (
          <div style={{
            width: 150, height: 150, borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 13, padding: 12, ...labelFont,
          }}>
            {isAr ? 'بلا شخصية' : 'No character'}
          </div>
        ) : (
          <Hero size={200} float glow equipped={equipped} />
        )}
      </button>

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
        onClick={() => handleDoor('character')}
        style={labelFont}
      >
        <span className="home-shortcut-ic home-shortcut-planet" aria-hidden="true">
          <CosmosCharacter size={18} glow={false} faceOnly />
        </span>
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

      {/* The outer slot — Relaxation (MBSR). The 3D world now lives in Puzzles. */}
      <div className="home-maze-actions">
        <button
          type="button"
          className="home-maze-btn home-maze-btn--gate"
          style={labelFont}
          onClick={() => handleDoor('relax')}
        >
          {isAr ? '🌿 الاسترخاء' : '🌿 RELAXATION'}
        </button>
      </div>
    </div>
  );
}
