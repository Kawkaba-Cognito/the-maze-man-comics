import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import LearningUniverse, { useLearnedBodies } from '../../features/universe/LearningUniverse';
import { KAWNERA_BOOKS } from '../../features/kawnera/books';
import { useApp } from '../../context/AppContext';
import { lazyWithRetry } from '../../lib/lazyWithRetry';

// Keep both Three.js worlds out of the entry bundle. Kawnera only downloads
// after the reader begins the downward journey from the Home universe.
const ZenUniverse = lazyWithRetry(
  () => import('../../features/universe/ZenUniverse'),
  'zen-universe',
);
const KawneraExperience = lazyWithRetry(
  () => import('../../features/kawnera/KawneraExperience'),
  'kawnera-experience',
);

export default function HomeScreen() {
  const { currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const scrollRef = useRef(null);
  // Bumped when a chapter is finished, to recompute the sky without a reload.
  const [skyTick, setSkyTick] = useState(0);
  const [jumpTo, setJumpTo] = useState(null);
  const bodies = useLearnedBodies(KAWNERA_BOOKS, skyTick);
  const cooling = bodies.filter((b) => b.warmth < 0.5).length;

  // Tapping a cooled body scrolls down into Kawnera and opens that chapter.
  const openChapter = useCallback((bookId, chapterIndex) => {
    setJumpTo({ bookId, chapterIndex, at: Date.now() });
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollTo({ top: scroller.clientHeight, behavior: 'smooth' });
  }, []);
  const [showKawnera, setShowKawnera] = useState(false);
  const [kawneraActive, setKawneraActive] = useState(false);
  const [universeAwake, setUniverseAwake] = useState(true);
  const zenRef = useRef(null);

  const handleScroll = useCallback((event) => {
    const scroller = event.currentTarget;
    const viewport = Math.max(1, scroller.clientHeight || window.innerHeight);
    const progress = Math.min(1, Math.max(0, scroller.scrollTop / viewport));
    scroller.style.setProperty('--kawnera-progress', progress.toFixed(3));
    setShowKawnera((current) => current || progress > 0.06);
    setKawneraActive((current) => {
      const next = progress > 0.72;
      return current === next ? current : next;
    });
    // Idle the universe once Kawnera fills the screen — but NEVER unmount it.
    //
    // This used to be `showUniverse = progress < 0.99`, which unmounted the
    // whole 3D scene. With no hysteresis, momentum scrolling oscillates across
    // that single threshold and each crossing tore down and rebuilt thousands
    // of particles, recompiled the shaders and took a new WebGL context. On a
    // phone that exhausts the GPU and the universe dies. Now the scene stays
    // mounted and simply stops rendering, and the two thresholds are far apart
    // so a wobble at the boundary cannot flip it repeatedly.
    setUniverseAwake((current) => {
      if (current && progress > 0.98) return false; // fully covered → idle
      if (!current && progress < 0.88) return true; // coming back into view
      return current;
    });
  }, []);

  // Drive the scene's render loop from the scroll state. The ref is only
  // populated once the lazy chunk has mounted, hence the optional call.
  useEffect(() => { zenRef.current?.setRunning?.(universeAwake); }, [universeAwake]);

  const navigateKawneraTop = useCallback((behavior = 'auto') => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    scroller.scrollTo({
      top: scroller.clientHeight,
      behavior: reduced ? 'auto' : behavior,
    });
  }, []);

  return (
    <div
      ref={scrollRef}
      className={kawneraActive ? 'home-universe-scroll kawnera-is-active' : 'home-universe-scroll'}
      dir={isAr ? 'rtl' : 'ltr'}
      onScroll={handleScroll}
      style={{ '--kawnera-progress': 0 }}
    >
      <div className="home-universe-stage" aria-hidden={!universeAwake}>
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

        <div className="home-slide-hint" aria-hidden="true">
          <span>{isAr ? 'اسحب للأسفل' : 'Slide down'}</span>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </section>

      <section
        className="home-kawnera-page"
        aria-label={
          isAr ? 'كاونيرا، مكتبة علم النفس والإدراك' : 'Kawnera psychology and cognition library'
        }
      >
        <div className="home-kawnera-gateway" aria-hidden="true">
          <span className="home-kawnera-orbit home-kawnera-orbit--one" />
          <span className="home-kawnera-orbit home-kawnera-orbit--two" />
          <span className="home-kawnera-orbit home-kawnera-orbit--three" />
          <span className="home-kawnera-gateway-core" />
          <div className="home-kawnera-gateway-name">
            <b>KAWNERA</b>
            <small>{isAr ? 'علم النفس والإدراك' : 'Psychology & cognition'}</small>
          </div>
        </div>

        <div className="home-kawnera-content">
          {showKawnera ? (
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
                isActive={kawneraActive}
                onNavigateTop={navigateKawneraTop}
                jumpTo={jumpTo}
                onChapterDone={() => setSkyTick((t) => t + 1)}
              />
            </Suspense>
          ) : (
            <div className="home-kawnera-loading" aria-hidden="true">
              <span />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
