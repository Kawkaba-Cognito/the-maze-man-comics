import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import RadialMazeHub from '../training/RadialMazeHub';
import ShrinePage from '../training/ShrinePage';
import CancellationTaskGame from '../training/CancellationTaskGame';
import { DOMAINS } from '../training/trainingData';

const GAME_COMPONENTS = {
  'cancel-task': CancellationTaskGame,
};

function attentionGameId() {
  const d = DOMAINS.find((x) => x.id === 'attention');
  return d?.subs?.find((s) => s.game)?.game ?? null;
}

export default function ComicsScreen() {
  const { switchTab } = useApp();
  const [screen, setScreen] = useState('hub');
  const [activeDomain, setActiveDomain] = useState('memory');
  const [activeGame, setActiveGame] = useState(null);

  const GameView = activeGame ? GAME_COMPONENTS[activeGame] : null;

  const openDomain = (id) => {
    if (id === 'attention') {
      const gid = attentionGameId();
      if (gid && GAME_COMPONENTS[gid]) {
        setActiveDomain(id);
        setActiveGame(gid);
        setScreen('game');
        return;
      }
    }
    setActiveDomain(id);
    setScreen('shrine');
  };

  const exitGame = () => {
    setActiveGame(null);
    setScreen(activeDomain === 'attention' ? 'hub' : 'shrine');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {screen === 'hub' && (
        <RadialMazeHub
          onBack={() => switchTab('home')}
          onOpenDomain={openDomain}
        />
      )}
      {screen === 'shrine' && (
        <ShrinePage
          domainId={activeDomain}
          onBack={() => setScreen('hub')}
          onOpenGame={(gameId) => { setActiveGame(gameId); setScreen('game'); }}
        />
      )}
      {screen === 'game' && GameView && (
        <GameView onBack={exitGame} />
      )}
    </div>
  );
}
