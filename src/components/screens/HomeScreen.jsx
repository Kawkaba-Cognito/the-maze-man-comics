import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
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
const MartianMaze = lazyWithRetry(
  () => import('../../features/universe/MartianMaze'),
  'martian-maze',
);

/*
 * Home opens in the user's living universe. Swiping upward crosses an invisible
 * threshold and immediately launches the standalone Martian labyrinth.
 */
export default function HomeScreen() {
  const { currentLang, setImmersive, switchTab, activeTab } = useApp();
  const isAr = currentLang === 'ar';
  const bodies = useLearnedBodies(KAWNERA_BOOKS);
  const cooling = bodies.filter((b) => b.warmth < 0.5).length;
  const zenRef = useRef(null);
  const scrollRef = useRef(null);
  const entryTriggeredRef = useRef(false);
  const [mazeOpen, setMazeOpen] = useState(false);

  const openChapter = useCallback(
    (bookId, chapterIndex) => {
      setPendingChapter({ bookId, chapterIndex });
      switchTab('learn');
    },
    [switchTab],
  );

  const exitMartianMaze = useCallback(() => {
    setMazeOpen(false);
    requestAnimationFrame(() => {
      const scroller = scrollRef.current;
      if (!scroller) return;
      scroller.scrollTo({ top: 0, behavior: 'auto' });
      scroller.style.setProperty('--kawnera-progress', '0');
      requestAnimationFrame(() => {
        entryTriggeredRef.current = false;
      });
    });
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return undefined;

    let frame = 0;
    const updateDepth = () => {
      frame = 0;
      const distance = Math.max(1, scroller.clientHeight * 0.9);
      const progress = Math.min(1, Math.max(0, scroller.scrollTop / distance));
      scroller.style.setProperty('--kawnera-progress', progress.toFixed(3));

      if (progress > 0.18 && !entryTriggeredRef.current && !mazeOpen) {
        entryTriggeredRef.current = true;
        setMazeOpen(true);
      } else if (progress < 0.04 && !mazeOpen) {
        entryTriggeredRef.current = false;
      }
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(updateDepth);
    };

    updateDepth();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [mazeOpen]);

  useEffect(() => {
    setImmersive('relax', mazeOpen);
    return () => setImmersive('relax', false);
  }, [mazeOpen, setImmersive]);

  /*
   * Idle the particle universe whenever Home is not the visible tab.
   *
   * AppShell keeps every tab mounted and hides the inactive ones with
   * `display: none`, and ZenUniverse's own guard is `visibilitychange` — which
   * fires for the BROWSER tab, not for an app screen being hidden. So without
   * this the scene kept drawing thousands of particles at full rate the whole
   * time the user was on Training, Puzzles, Learn, Wellbeing or Other: the
   * cause of tab switches feeling laggy, and of the Training hub dropping its
   * first frames on entry.
   *
   * setRunning idles rather than unmounts, which is what ZenUniverse asks for —
   * a remount rebuilds every particle, recompiles shaders and takes a fresh
   * WebGL context.
   */
  useEffect(() => {
    zenRef.current?.setRunning(activeTab === 'home' && !mazeOpen);
  }, [activeTab, mazeOpen]);

  return (
    <div
      ref={scrollRef}
      className={`home-universe-scroll${mazeOpen ? ' maze-is-open' : ''}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="home-universe-stage">
        <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#000' }} />}>
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
          <span>{isAr ? 'اسحب للأعلى وادخل المتاهة' : 'Swipe up to enter the maze'}</span>
          <span>⌄</span>
        </div>
      </section>

      <div className="home-maze-swipe-zone" aria-hidden="true" />

      {mazeOpen && (
        <Suspense
          fallback={
            <div className="home-maze-transition" role="status">
              <div className="home-maze-transition-aperture" aria-hidden="true">
                <i />
                <i />
              </div>
              <small>{isAr ? 'عبور القطاع' : 'Sector transfer'}</small>
              <strong>{isAr ? 'الهبوط إلى المتاهة' : 'Descending into the labyrinth'}</strong>
            </div>
          }
        >
          <MartianMaze isAr={isAr} onExit={exitMartianMaze} />
        </Suspense>
      )}
    </div>
  );
}
