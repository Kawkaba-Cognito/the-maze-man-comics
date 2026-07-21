import React, { Suspense, useCallback, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import UniversePlanets from '../../features/universe/UniversePlanets';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

// Code-split: ZenUniverse pulls in the whole three.js runtime (~600 KB min),
// which must not live in the main bundle.
const ZenUniverse = lazyWithRetry(() => import('../../features/universe/ZenUniverse'), 'zen-universe');

/*
 * Home — "Your Universe" (2026-07-16 zen redesign). A living 3D scene:
 * extremely black space, twinkling stars, occasional shooting stars, and a
 * white particle planet at the center that dissolves where touched and heals
 * itself (replaces Kawkab as the Home centerpiece — the character still
 * lives everywhere else in the app). The user's small note/goal/journal
 * planets are colored particle spheres drawn by the same 3D layer;
 * UniversePlanets keeps owning all their interaction (drag, tap-to-reveal,
 * add/search/edit sheets) through invisible DOM hit areas above the canvas.
 */

export default function HomeScreen() {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const zenRef = useRef(null);

  // UniversePlanets mirrors its planet positions/colors into the 3D layer
  // via state (not the ref) so the lazily-loaded scene picks up the list
  // whenever it finishes mounting.
  const [planetList, setPlanetList] = useState([]);
  const handlePlanetsChange = useCallback((list) => setPlanetList(list), []);
  const handleDissolve = useCallback((id) => zenRef.current?.dissolvePlanet(id), []);
  const handleReform = useCallback((id) => zenRef.current?.reformPlanet(id), []);
  // Dragging a small planet near the center makes the big planet ripple —
  // the same "gravity well" feedback Kawkab used to give.
  const handleDragProximity = useCallback((close) => {
    if (close) zenRef.current?.pulseCenter();
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#000' }} />}>
        <ZenUniverse ref={zenRef} planets={planetList} />
      </Suspense>

      <div style={{
        position: 'absolute', top: 'calc(58px + env(safe-area-inset-top))', left: 0, right: 0,
        textAlign: 'center', color: '#e8dcc0', padding: '0 20px', pointerEvents: 'none', zIndex: 4,
      }}>
        <div style={{
          fontFamily: isAr ? "'Cairo', sans-serif" : "'Cinzel', 'Cormorant Garamond', serif",
          fontSize: isAr ? 22 : 24, letterSpacing: isAr ? 1 : 4, opacity: 0.95,
          textTransform: 'uppercase', fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 22px rgba(232,172,78,0.5)',
        }}>
          {isAr ? 'كونك' : 'Your universe'}
        </div>
        <div style={{ fontFamily: "'Fredoka One', 'Nunito', sans-serif", fontSize: 15, opacity: 0.8, marginTop: 2 }}>
          {isAr ? 'المس الكوكب ليتنفّس، أو المس كوكباً صغيراً لقراءته' : 'Touch the planet to see it breathe, or a small one to read it'}
        </div>
      </div>

      <UniversePlanets
        isAr={isAr}
        playSfx={playSfx}
        onDragProximity={handleDragProximity}
        onPlanetsChange={handlePlanetsChange}
        onDissolve={handleDissolve}
        onReform={handleReform}
      />
    </div>
  );
}
