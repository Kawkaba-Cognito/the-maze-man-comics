import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import RadialMazeHub from '../training/RadialMazeHub';
import ShrinePage from '../training/ShrinePage';

export default function ComicsScreen() {
  const { switchTab } = useApp();
  const [screen, setScreen] = useState('hub');
  const [activeDomain, setActiveDomain] = useState('memory');

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {screen === 'hub' && (
        <RadialMazeHub
          onBack={() => switchTab('home')}
          onOpenDomain={(id) => { setActiveDomain(id); setScreen('shrine'); }}
        />
      )}
      {screen === 'shrine' && (
        <ShrinePage
          domainId={activeDomain}
          onBack={() => setScreen('hub')}
        />
      )}
    </div>
  );
}
