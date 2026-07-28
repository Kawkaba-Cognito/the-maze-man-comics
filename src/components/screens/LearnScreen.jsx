import React, { Suspense, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import { takePendingChapter } from '../../features/kawnera/pendingChapter';

/**
 * Learn IS Kawnera — the psychology & cognition library, with Dr. Kawkab as
 * the study companion. It used to be a hub of standalone articles and Kawnera
 * lived under Home's universe; the library is the real Learn content, so it
 * moved here and Home went back to being the sky alone.
 *
 * The tab router only mounts this screen while Learn is active, which is what
 * keeps Dr. Kawkab's WebGL context from stacking on top of the universe's.
 */
const KawneraExperience = lazyWithRetry(
  () => import('../../features/kawnera/KawneraExperience'),
  'kawnera-experience',
);

export default function LearnScreen() {
  const { currentLang } = useApp();
  const isAr = currentLang === 'ar';

  // A body tapped in Home's sky parks its chapter here; claim it once, on the
  // mount that the tab switch caused. Read during render (not in an effect) so
  // the library opens straight onto the chapter rather than flashing the shelf.
  const jumpTo = useMemo(() => takePendingChapter(), []);

  // Kawnera's own "back to top" — #ui-shell is the scroller for every tab.
  const navigateTop = useCallback((behavior = 'auto') => {
    const shell = document.getElementById('ui-shell');
    if (!shell) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    shell.scrollTo({ top: 0, behavior: reduced ? 'auto' : behavior });
  }, []);

  return (
    <Suspense
      fallback={
        <div className="home-kawnera-loading" role="status">
          <span />
          <b>KAWNERA</b>
          <small>{isAr ? 'يتم تحضير مكتبتك…' : 'Preparing your library…'}</small>
        </div>
      }
    >
      <KawneraExperience
        isAr={isAr}
        isActive
        onNavigateTop={navigateTop}
        jumpTo={jumpTo}
      />
    </Suspense>
  );
}
