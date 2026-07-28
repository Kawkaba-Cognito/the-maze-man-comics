import React, { Suspense, useCallback, useRef } from 'react';
import LearningUniverse, { useLearnedBodies } from '../../features/universe/LearningUniverse';
import { KAWNERA_BOOKS } from '../../features/kawnera/books';
import { setPendingChapter } from '../../features/kawnera/pendingChapter';
import { useApp } from '../../context/AppContext';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

// Keep the Three.js world out of the entry bundle.
const ZenUniverse = lazyWithRetry(
  () => import('../../features/universe/ZenUniverse'),
  'zen-universe',
);

/*
 * Home is the universe, and only the universe.
 *
 * Kawnera used to be a second page of this same scroll. It now lives in the
 * Learn tab, so this screen is a single sky again: no scroll gateway, no second
 * WebGL world stacked behind it. Tapping a body still opens its chapter — the
 * request is parked in pendingChapter and Learn picks it up when it mounts.
 */
export default function HomeScreen() {
  const { currentLang, switchTab } = useApp();
  const isAr = currentLang === 'ar';
  const bodies = useLearnedBodies(KAWNERA_BOOKS);
  const cooling = bodies.filter((b) => b.warmth < 0.5).length;
  const zenRef = useRef(null);

  const openChapter = useCallback((bookId, chapterIndex) => {
    setPendingChapter({ bookId, chapterIndex });
    switchTab('learn');
  }, [switchTab]);

  return (
    <div className="home-universe-scroll" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="home-universe-stage">
        <Suspense
          fallback={<div style={{ position: 'absolute', inset: 0, background: '#000' }} />}
        >
          <ZenUniverse ref={zenRef} planets={bodies} />
        </Suspense>
      </div>

      <section
        className="home-universe-page home-universe-page--hero"
        aria-label={isAr ? 'كونك' : 'Your universe'}
      >
        <div className="home-universe-heading">
          <div className="home-universe-title">{isAr ? 'كونك' : 'Your universe'}</div>
          {bodies.length > 0 && (
            <div className="home-universe-sub">
              {bodies.length} {bodies.length === 1 ? 'chapter' : 'chapters'} learned
              {cooling > 0 && ` · ${cooling} cooling`}
            </div>
          )}
        </div>

        {/* The sky's contents: one body per chapter worked through, dimming as
            it cools. See learningStore.js for why the schedule is drawn rather
            than queued. */}
        <div className="home-universe-bodies">
          <LearningUniverse bodies={bodies} onOpen={openChapter} />
        </div>
      </section>
    </div>
  );
}
