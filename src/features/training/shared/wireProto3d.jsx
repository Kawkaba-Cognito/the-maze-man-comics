import React, { Suspense, useState } from 'react';
import { lazyWithRetry } from '../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../lib/planetIcons';
import { proto3dExtraItem } from './C3dProtoChrome';

/** Suspense fallback for 3D proto chunks. */
export function Proto3dFallback() {
  return (
    <div
      className="c3d-root"
      style={{
        display: 'grid',
        placeItems: 'center',
        color: '#f0e2c0',
        background: '#000',
        minHeight: '100dvh',
      }}
    >
      …
    </div>
  );
}

/**
 * Hook + helpers to add a ModeShell-parallel 3D prototype view.
 * @param {() => Promise<{default: React.ComponentType}>} loader
 * @param {string} chunkKey
 */
export function useProto3dGate(loader, chunkKey) {
  const [view, setView] = useState('shell');
  const Proto = React.useMemo(
    () => lazyWithRetry(loader, chunkKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [chunkKey],
  );
  return {
    view,
    setView,
    open3d: () => setView('play3d'),
    close3d: () => setView('shell'),
    Proto,
    is3d: view === 'play3d',
  };
}

export function Proto3dView({ Proto, isAr, playSfx, onBack }) {
  return (
    <Suspense fallback={<Proto3dFallback />}>
      <Proto isAr={isAr} playSfx={playSfx} onBack={onBack} />
    </Suspense>
  );
}

export function makeProto3dExtra({ isAr, on, hintEn, hintAr, domain = 'flexibility' }) {
  return {
    ...proto3dExtraItem({ isAr, on, hintEn, hintAr }),
    icoImg: planetIconUrl(domain),
  };
}
