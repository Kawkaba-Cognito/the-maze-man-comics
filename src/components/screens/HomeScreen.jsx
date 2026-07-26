import React, { Suspense, useCallback, useRef, useState } from 'react';
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
  const [showKawnera, setShowKawnera] = useState(false);
  const [kawneraActive, setKawneraActive] = useState(false);
  const [showUniverse, setShowUniverse] = useState(true);

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
    setShowUniverse((current) => {
      const next = progress < 0.99;
      return current === next ? current : next;
    });
  }, []);

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
      <div className="home-universe-stage" aria-hidden={!showUniverse}>
        {showUniverse && (
          <Suspense
            fallback={<div style={{ position: 'absolute', inset: 0, background: '#000' }} />}
          >
            <ZenUniverse planets={[]} />
          </Suspense>
        )}
      </div>

      <section
        className="home-universe-page home-universe-page--hero"
        aria-label={isAr ? 'كونك' : 'Your universe'}
      >
        <div className="home-universe-heading">
          <div className="home-universe-title">{isAr ? 'كونك' : 'Your universe'}</div>
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
