import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import LearningUniverse, { useLearnedBodies } from '../../features/universe/LearningUniverse';
import { KAWNERA_BOOKS } from '../../features/kawnera/books';
import { setPendingChapter } from '../../features/kawnera/pendingChapter';
import { useApp } from '../../context/AppContext';
import { lazyWithRetry } from '../../lib/lazyWithRetry';
import UniverseDiveTransition from '../../features/universe/UniverseDiveTransition';
import NeuralPanel from '../../features/personalization/NeuralPanel';

// Keep the Three.js world out of the entry bundle.
const ZenUniverse = lazyWithRetry(
  () => import('../../features/universe/ZenUniverse'),
  'zen-universe',
);
/*
 * The planet replaced MartianMaze on 2026-08-14. That was Babylon pulled from a
 * CDN to draw a flat, face-on grid; this is an isometric canvas world with no
 * engine, no network and no WebGL context, and it is a PLANET rather than a
 * labyrinth. MartianMaze.jsx is left in the tree for now, unreferenced.
 */
const PlanetSurface = lazyWithRetry(
  () => import('../../features/universe/PlanetSurface'),
  'planet-surface',
);

/*
 * Home opens in the user's living universe. Swiping upward crosses an invisible
 * threshold and lands Dr Kawkab on the planet he arrived at.
 */
export default function HomeScreen() {
  const { currentLang, setImmersive, switchTab, activeTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const bodies = useLearnedBodies(KAWNERA_BOOKS);
  const cooling = bodies.filter((b) => b.warmth < 0.5).length;
  const zenRef = useRef(null);
  const scrollRef = useRef(null);
  const entryTriggeredRef = useRef(false);
  const [mazeOpen, setMazeOpen] = useState(false);
  const [mazeReady, setMazeReady] = useState(false);
  const [mazeFailed, setMazeFailed] = useState(false);
  const [entryComplete, setEntryComplete] = useState(false);

  const openChapter = useCallback(
    (bookId, chapterIndex) => {
      setPendingChapter({ bookId, chapterIndex });
      switchTab('learn');
    },
    [switchTab],
  );

  /* Tapping a suggestion goes to that TAB, not to the specific domain or
   * practice. Kawnera is the only feature with a pending-target seam
   * (pendingChapter.js); training and wellbeing have none, and inventing two
   * more here would be a bigger change than this one. Landing on the right
   * screen with the suggestion still on Home is the honest middle. */
  const openTrainingDomain = useCallback(() => switchTab('comics'), [switchTab]);
  const openWellbeingPractice = useCallback(() => switchTab('relax'), [switchTab]);

  const exitMartianMaze = useCallback(() => {
    setMazeOpen(false);
    setMazeReady(false);
    setMazeFailed(false);
    setEntryComplete(false);
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

  const startMazeEntry = useCallback(() => {
    setMazeReady(false);
    setMazeFailed(false);
    setEntryComplete(false);
    setMazeOpen(true);
  }, []);

  const finishMazeEntry = useCallback(() => {
    setEntryComplete(true);
  }, []);

  const handleMazeReady = useCallback(() => {
    setMazeReady(true);
  }, []);

  /*
   * `mazeFailed` used to be raised when the Babylon CDN script failed. The
   * planet has nothing to download — it is generated from maths — so the only
   * remaining failure is the lazy chunk itself, and lazyWithRetry owns that.
   * The state stays because UniverseDiveTransition takes the prop; it simply
   * never becomes true now.
   */

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
        startMazeEntry();
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
  }, [mazeOpen, startMazeEntry]);

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
   * this the scene would keep drawing thousands of particles at full rate the
   * whole time the user is on Training, Puzzles, Learn, Wellbeing or Other.
   *
   * ⚠️ The tab value to compare against is `'habits'`, NOT `'home'`. 'home' is
   * the tab bar's BUTTON id; the screen it switches to is called 'habits' (see
   * APP_TABS in BottomTabBar, and #screen-home in AppShell). Comparing against
   * 'home' can never be true while this screen is mounted, so the universe was
   * idled the instant it mounted and never woke — the reported freeze. It only
   * looked alive on a cold load because ZenUniverse is lazy: the chunk had not
   * resolved yet, so zenRef was still null when this ran and the call no-opped.
   * Every later return to Home mounted it synchronously and killed it.
   *
   * setRunning idles rather than unmounts, which is what ZenUniverse asks for —
   * a remount rebuilds every particle, recompiles shaders and takes a fresh
   * WebGL context.
   */
  useEffect(() => {
    zenRef.current?.setRunning(activeTab === 'habits' && !mazeOpen);
  }, [activeTab, mazeOpen]);

  return (
    <div
      ref={scrollRef}
      className={`home-universe-scroll${mazeOpen ? ' maze-is-open' : ''}${
        mazeOpen && !entryComplete ? ' maze-entry-active' : ''
      }`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="home-universe-stage">
        {/* The fallback follows the theme. It was a frozen `#000`, so every
            cold load of Home flashed a full-screen black rectangle under a warm
            beige app while the Three.js chunk arrived — the same frozen-colour
            class as the layers removed on 2026-08-15, just in a loading state
            nobody screenshots. --universe-dusk is the ground both themes
            already use (#cfc4b0 light / #0a0a0b dark), so dark keeps its void. */}
        <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: 'var(--universe-dusk)' }} />}>
          <ZenUniverse ref={zenRef} planets={bodies} />
        </Suspense>
      </div>

      <section
        className="home-universe-page home-universe-page--hero"
        aria-label={isAr ? 'كونك' : 'Your universe'}
      >
        {/* The one personalization surface, above the universe. It used to be
            two panels — one in the Training hub, one in Wellbeing — sharing a
            single global on/off flag, so switching it on in one place silently
            switched it on in the other. Home is where the whole app is in view,
            which is the only place a model that spans training, wellbeing and
            reading belongs. */}
        {/* One absolutely-positioned column owns the top of the hero. The
            heading used to position itself (top: 58px); it now sits in this
            wrapper's flow so the panel can push it down instead of landing on
            top of it. Its dive opacity/transform are untouched. */}
        <div className="home-universe-top">
          <NeuralPanel
            isAr={isAr}
            playSfx={playSfx}
            onOpenDomain={openTrainingDomain}
            onOpenPractice={openWellbeingPractice}
          />

          {/* The "Your universe" title was removed on 2026-08-15 — the screen
              says what it is. The heading now renders ONLY when there is a
              count to show; an always-present empty div would still take the
              column's 12px gap and push the sky down for nothing.

              `.home-universe-title` itself stays in global.css: Wellbeing's
              overlay title uses that exact class on purpose, so the two cannot
              drift apart again. The section keeps its aria-label, which is the
              region's accessible name rather than a visible word. */}
          {bodies.length > 0 && (
            <div className="home-universe-heading">
              <div className="home-universe-sub">
                {bodies.length} {bodies.length === 1 ? 'chapter' : 'chapters'} learned
                {cooling > 0 && ` · ${cooling} cooling`}
              </div>
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
          {/* "Down", not "up". The finger moves up, but you are diving DOWN out
              of the universe onto the planet — which is what the chevron below
              says, what UniverseDiveTransition is named for, and how this reads
              to anyone using it. Describe the destination, not the gesture. */}
          <span>{isAr ? 'انزل إلى الكوكب' : 'Dive down to the planet'}</span>
          <span>⌄</span>
        </div>
      </section>

      <div className="home-maze-swipe-zone" aria-hidden="true" />

      {mazeOpen && (
        <Suspense fallback={null}>
          <PlanetSurface
            isAr={isAr}
            onExit={exitMartianMaze}
            onReady={handleMazeReady}
            entryCovered={!entryComplete}
          />
        </Suspense>
      )}

      {mazeOpen && !entryComplete && (
        <UniverseDiveTransition
          isAr={isAr}
          ready={mazeReady}
          failed={mazeFailed}
          onComplete={finishMazeEntry}
        />
      )}
    </div>
  );
}
