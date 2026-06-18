import React, { useState, useEffect, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import RadialMazeHub from '../training/RadialMazeHub';
import { DOMAINS, DOMAIN_COLOR } from '../training/trainingData';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import { getLazyGame, hasGame } from '../../features/training/lazyGames';
import AssessmentFlow from '../../features/training/assessment/AssessmentFlow';

/** Tiny fallback shown while a game's bundle is being fetched the first time. */
function GameLoading({ isAr }) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: tokens.trainingPaletteSurface, color: '#5c534c',
      fontFamily: "'Outfit', system-ui, sans-serif",
      fontSize: 14, letterSpacing: 1.5,
    }}>
      {isAr ? 'جارِ التحميل…' : 'Loading…'}
    </div>
  );
}

/** Pick-a-sub-activity screen — same paper as splash / training games. */
const HUB_LIGHT = {
  bg: tokens.trainingPaletteSurface,
  text: '#141210',
  muted: '#5c534c',
  border: '#1a1208',
};

export default function ComicsScreen() {
  const { switchTab, currentLang, assessmentRequested, consumeAssessmentRequest } = useApp();
  const isAr = currentLang === 'ar';
  const [screen, setScreen] = useState('hub');

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
    setActiveGame(null);
    setScreen('hub');
  };

  const backToHub = () => {
    setPickList([]);
    setScreen('hub');
  };

  const d = DOMAINS.find((x) => x.id === activeDomain);
  const accent = DOMAIN_COLOR[activeDomain] || '#8a7868';

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
              backgroundColor: tokens.trainingPaletteSurface,
              isolation: 'isolate',
            }
          : {}),
      }}
    >
      {screen === 'hub' && (
        <RadialMazeHub
          onBack={() => switchTab('home')}
          onOpenDomain={openDomain}
          onOpenAssessment={() => setScreen('assessment')}
        />
      )}
      {screen === 'assessment' && (
        <AssessmentFlow onBack={backToHub} />
      )}
      {screen === 'pick' && d && (
        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: HUB_LIGHT.bg,
            color: HUB_LIGHT.text,
            fontFamily: 'Outfit, system-ui, sans-serif',
            padding: `max(52px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom))`,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
            <button
              type="button"
              onClick={backToHub}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: `2px solid ${HUB_LIGHT.border}`,
                background: 'linear-gradient(180deg, #ffffff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208, inset 0 1px 0 rgba(255,255,255,0.85)',
              }}
              aria-label={isAr ? 'رجوع' : 'Back'}
            >
              <IconBack size={18} c={HUB_LIGHT.text} />
            </button>
          </div>
          {/* Domain header — big name + colored glyph badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, maxWidth: 520, width: '100%', margin: '0 auto' }}>
            <span
              aria-hidden="true"
              style={{
                width: 'clamp(58px, 16vw, 76px)', height: 'clamp(58px, 16vw, 76px)', flexShrink: 0,
                borderRadius: 20, background: accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'clamp(30px, 8vw, 40px)', fontFamily: "'Fredoka One', sans-serif",
                boxShadow: '4px 4px 0 #1a1208',
              }}
            >
              {d.glyph}
            </span>
            <div style={{ textAlign: isAr ? 'right' : 'left' }}>
              <h1
                style={{
                  fontFamily: "'Fredoka One', Bangers, sans-serif",
                  fontSize: 'clamp(2rem, 9vw, 3rem)', fontWeight: 400,
                  margin: 0, lineHeight: 1, color: HUB_LIGHT.text,
                }}
              >
                {d.name}
              </h1>
              {d.desc && <p style={{ margin: '7px 0 0', fontSize: 13, color: HUB_LIGHT.muted, lineHeight: 1.4 }}>{d.desc}</p>}
            </div>
          </div>

          <p style={{ maxWidth: 520, width: '100%', margin: '20px auto 12px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: HUB_LIGHT.muted, textAlign: isAr ? 'right' : 'left' }}>
            {isAr ? 'اختر لعبة' : 'Choose a game'}
          </p>

          {/* Game cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520, width: '100%', margin: '0 auto' }}>
            {pickList.map((sub, i) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setActiveGame(sub.game);
                  setPickList([]);
                  setScreen('game');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  textAlign: isAr ? 'right' : 'left',
                  padding: '18px 20px', borderRadius: 16,
                  border: '2px solid #1a1208',
                  background: 'linear-gradient(180deg, #ffffff 0%, #f7f1eb 100%)',
                  boxShadow: '4px 4px 0 #1a1208',
                  cursor: 'pointer',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 46, height: 46, flexShrink: 0, borderRadius: 12,
                    background: accent, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontFamily: "'Fredoka One', sans-serif",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontFamily: "'Bangers', cursive", fontSize: 22, letterSpacing: 1.2, color: HUB_LIGHT.text }}>
                  {sub.name}
                </span>
                <span aria-hidden="true" style={{ fontSize: 26, color: accent, transform: isAr ? 'scaleX(-1)' : 'none' }}>
                  ›
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {screen === 'game' && GameView && (
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <GameView onBack={exitGame} />
        </Suspense>
      )}
    </div>
  );
}
