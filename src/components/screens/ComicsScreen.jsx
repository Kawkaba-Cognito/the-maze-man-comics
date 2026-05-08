import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import RadialMazeHub from '../training/RadialMazeHub';
import CancellationTaskGame from '../training/CancellationTaskGame';
import { DOMAINS } from '../training/trainingData';
import { IconBack } from '../training/TrainingIcons';

const GAME_COMPONENTS = {
  'cancel-task': CancellationTaskGame,
};

/** Match radial training hub — no brown shrine layer. */
const HUB_LIGHT = {
  bg: '#fdf8f5',
  text: '#141210',
  muted: '#5c534c',
  border: '#1a1208',
};

export default function ComicsScreen() {
  const { switchTab, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const [screen, setScreen] = useState('hub');
  const [activeDomain, setActiveDomain] = useState('memory');
  const [activeGame, setActiveGame] = useState(null);
  const [pickList, setPickList] = useState([]);

  const GameView = activeGame ? GAME_COMPONENTS[activeGame] : null;

  const playableSubs = (domainId) => {
    const domain = DOMAINS.find((d) => d.id === domainId);
    return (domain?.subs || []).filter((s) => s.game && GAME_COMPONENTS[s.game]);
  };

  const openDomain = (id) => {
    setActiveDomain(id);
    const playable = playableSubs(id);
    if (playable.length === 1) {
      setActiveGame(playable[0].game);
      setScreen('game');
      return;
    }
    if (playable.length > 1) {
      setPickList(playable);
      setScreen('pick');
      return;
    }
    alert(isAr ? 'هذا القسم قادم قريباً.' : 'This area is coming soon.');
  };

  const exitGame = () => {
    setActiveGame(null);
    setScreen('hub');
  };

  const backToHub = () => {
    setPickList([]);
    setScreen('hub');
  };

  const d = DOMAINS.find((x) => x.id === activeDomain);

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {screen === 'hub' && (
        <RadialMazeHub
          onBack={() => switchTab('home')}
          onOpenDomain={openDomain}
        />
      )}
      {screen === 'pick' && d && (
        <div
          style={{
            minHeight: '100%',
            background: HUB_LIGHT.bg,
            color: HUB_LIGHT.text,
            fontFamily: 'Outfit, system-ui, sans-serif',
            padding: `max(52px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom))`,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              onClick={backToHub}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: `2px solid ${HUB_LIGHT.border}`,
                background: 'linear-gradient(180deg, #ffffff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208, inset 0 1px 0 rgba(255,255,255,0.85)',
              }}
              aria-label={isAr ? 'رجوع' : 'Back'}
            >
              <IconBack size={18} c={HUB_LIGHT.text} />
            </button>
          </div>
          <h1
            style={{
              fontFamily: "'Fredoka One', Bangers, sans-serif",
              fontSize: 'clamp(1.35rem, 5vw, 1.75rem)',
              fontWeight: 400,
              margin: '0 0 8px',
              color: HUB_LIGHT.text,
            }}
          >
            {d.name}
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, color: HUB_LIGHT.muted, lineHeight: 1.5 }}>
            {isAr ? 'اختر نشاطاً' : 'Choose an activity'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pickList.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setActiveGame(sub.game);
                  setPickList([]);
                  setScreen('game');
                }}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: 4,
                  border: '2px solid #1a1208',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f7f1eb 100%)',
                  boxShadow: '4px 4px 0 #1a1208',
                  cursor: 'pointer',
                  fontFamily: "'Bangers', cursive",
                  fontSize: 16,
                  letterSpacing: 1.5,
                  color: HUB_LIGHT.text,
                }}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {screen === 'game' && GameView && (
        <GameView onBack={exitGame} />
      )}
    </div>
  );
}
