import React, { useState, useEffect, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import RadialMazeHub from '../training/RadialMazeHub';
import { DOMAINS } from '../training/trainingData';
import { TrainingScreenShell } from '../../features/training/shared/TrainingScreens';
import DomainAboutLink from '../../features/training/shared/DomainAboutLink';
import { getLazyGame, hasGame } from '../../features/training/lazyGames';
/* ⚠ The real battery is a DEMO — unfinished content AND unfinished flow — but it
 * renders percentiles, standard scores and a "Cognitive Index" with nothing marking
 * any of it provisional. Swapping this import back is all it takes to restore it,
 * and should happen only once its numbers can be trusted.
 * See assessment/AssessmentComingSoon.jsx. */
import AssessmentComingSoon from '../../features/training/assessment/AssessmentComingSoon';
import GamePlanetScene from '../../features/training/shared/GamePlanetTile';
import { GlassBevel } from '../../features/training/shared/AttentionHeaderProtos';

/*
 * The loading state every game passes through, shown while its bundle is fetched.
 *
 * ⚠ It must read the LIVE theme, never a JS colour constant. This used to be
 * `background: tokens.trainingPaletteSurface` — a JavaScript value frozen at a
 * near-white literal. A JS token cannot follow a CSS theme, so in dark mode
 * every game launch flashed a full-screen pale panel before the game painted;
 * the game's own inner Suspense then flashed `.c3d-root` blue on top. That
 * white-then-blue stutter is the reported "palette that appears before the game
 * as a bug", and it was on the path to all 18 games.
 *
 * A loading screen has one job: look like the thing that is about to arrive.
 */
function GameLoading({ isAr }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--play-surface)', color: 'var(--game-ink)',
      fontFamily: "'Outfit', system-ui, sans-serif",
      fontSize: 14, letterSpacing: 1.5,
    }}>
      {isAr ? 'جارِ التحميل…' : 'Loading…'}
    </div>
  );
}

export default function ComicsScreen() {
  const { currentLang, assessmentRequested, consumeAssessmentRequest, playSfx, setImmersive } = useApp();
  const isAr = currentLang === 'ar';
  const [screen, setScreen] = useState('hub');

  // Hide the bottom tab bar on any view below the radial hub (picker, game, assessment).
  useEffect(() => {
    setImmersive('comics', screen !== 'hub');
    return () => setImmersive('comics', false);
  }, [screen, setImmersive]);

  // Deep-link from the Daily Workout nudge → open the assessment directly.
  useEffect(() => {
    if (assessmentRequested) {
      setScreen('assessment');
      consumeAssessmentRequest();
    }
  }, [assessmentRequested, consumeAssessmentRequest]);
  const [activeDomain, setActiveDomain] = useState('memory');
  const [activeGame, setActiveGame] = useState(null);
  const [pickList, setPickList] = useState([]);

  const GameView = activeGame ? getLazyGame(activeGame) : null;

  const playableSubs = (domainId) => {
    const domain = DOMAINS.find((d) => d.id === domainId);
    return (domain?.subs || []).filter((s) => s.game && hasGame(s.game));
  };

  const openDomain = (id) => {
    setActiveDomain(id);
    const playable = playableSubs(id);
    // Always show the game picker (even for a single game) so every domain
    // opens to the same consistent "choose a game" screen.
    if (playable.length >= 1) {
      setPickList(playable);
      setScreen('pick');
      return;
    }
    alert(isAr ? 'هذا القسم قادم قريباً.' : 'This area is coming soon.');
  };

  const exitGame = () => {
    // Back from a game returns to that domain's game list (the 'pick' screen),
    // not the main radial hub — so e.g. an Attention game lands on Attention.
    setActiveGame(null);
    const playable = playableSubs(activeDomain);
    if (playable.length) {
      setPickList(playable);
      setScreen('pick');
    } else {
      setScreen('hub');
    }
  };

  const backToHub = () => {
    setPickList([]);
    setScreen('hub');
  };

  const d = DOMAINS.find((x) => x.id === activeDomain);
  const domainName = d && isAr && d.nameAr ? d.nameAr : d?.name;
  const domainTag = isAr ? 'مجال تدريبي' : 'Training domain';

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 'min(100vh, 100dvh)',
        ...(screen === 'game'
          ? {
              // Mode hubs paint their own cosmos void (#07060b); keep the
              // wrapper transparent so domain cream/purple never bleeds through.
              backgroundColor: 'transparent',
              isolation: 'isolate',
            }
          : {}),
      }}
    >
      {screen === 'hub' && (
        <RadialMazeHub
          onOpenDomain={openDomain}
          onOpenAssessment={() => setScreen('assessment')}
        />
      )}
      {screen === 'assessment' && (
        <AssessmentComingSoon onBack={backToHub} isAr={isAr} playSfx={playSfx} />
      )}
      {screen === 'pick' && d && (
        <TrainingScreenShell
          hub={false}
          isAr={isAr}
          playSfx={playSfx}
          onBack={backToHub}
          shellClassName={`ct-domain-pick ct-domain-pick--${activeDomain}`}
        >
          <div className="ct-domain-pick-body">
            <GlassBevel domainName={domainName} domainTag={domainTag} />

            <section
              className="ct-domain-pick-section"
              aria-labelledby="domain-pick-heading"
            >
              <div className="ct-domain-pick-section-divider">
                <span className="ct-domain-pick-section-line" aria-hidden="true" />
                <h2 id="domain-pick-heading" className="ct-domain-pick-section-title">
                  {isAr ? 'اختر تمريناً' : 'Select an exercise'}
                </h2>
                <span className="ct-domain-pick-section-line" aria-hidden="true" />
              </div>

              <GamePlanetScene
                subs={pickList.map((sub) => ({
                  ...sub,
                  name: (isAr && sub.nameAr) ? sub.nameAr : sub.name,
                  blurb: isAr ? sub.blurbAr : sub.blurb,
                }))}
                onOpen={(sub) => {
                  playSfx?.('click');
                  setActiveGame(sub.game);
                  setPickList([]);
                  setScreen('game');
                }}
              />
            </section>

            <DomainAboutLink
              domainId={activeDomain}
              isAr={isAr}
              playSfx={playSfx}
            />
          </div>
        </TrainingScreenShell>
      )}
      {screen === 'game' && GameView && (
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <GameView onBack={exitGame} />
        </Suspense>
      )}
    </div>
  );
}
