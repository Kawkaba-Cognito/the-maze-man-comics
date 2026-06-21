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

/**
 * Crisp per-game line glyph (24×24, stroke = currentColor) drawn inside the
 * card banner. Keyed by gameKey / sub.game.
 */
function GameGlyph({ k, size = 48, color = 'currentColor', strokeWidth = 1.8 }) {
  const c = {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  switch (k) {
    case 'speed-match':
      return (<svg {...c}><rect x="3" y="7" width="6" height="10" rx="1.5" /><rect x="15" y="7" width="6" height="10" rx="1.5" /><line x1="9" y1="12" x2="15" y2="12" /></svg>);
    case 'piano-tap':
      return (<svg {...c}><rect x="3" y="5" width="18" height="14" rx="2" /><line x1="9" y1="5" x2="9" y2="19" /><line x1="15" y1="5" x2="15" y2="19" /><rect x="7" y="5" width="4" height="7" rx="1" fill={color} stroke="none" /><rect x="13" y="5" width="4" height="7" rx="1" fill={color} stroke="none" /></svg>);
    case 'trail-making':
      return (<svg {...c}><path d="M6 17 L11 8 L17 14" /><circle cx="6" cy="17" r="2" /><circle cx="11" cy="8" r="2" /><circle cx="17" cy="14" r="2" /></svg>);
    case 'cancel-task':
      return (<svg {...c}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><line x1="12" y1="2" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="22" /><line x1="2" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="22" y2="12" /></svg>);
    case 'mot':
      return (<svg {...c}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.2" fill={color} stroke="none" /><circle cx="17.5" cy="7" r="1.6" fill={color} stroke="none" /><path d="M12 3 A9 9 0 0 1 19 7" /></svg>);
    case 'train-switch':
      return (<svg {...c}><rect x="6" y="4" width="12" height="12" rx="2" /><line x1="9" y1="8" x2="15" y2="8" /><circle cx="9.5" cy="12" r="0.9" fill={color} stroke="none" /><circle cx="14.5" cy="12" r="0.9" fill={color} stroke="none" /><line x1="8" y1="16" x2="6.5" y2="20" /><line x1="16" y1="16" x2="17.5" y2="20" /></svg>);
    case 'memo-span': {
      const on = { 0: 1, 2: 1, 4: 1, 7: 1 };
      return (<svg {...c}>{Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={3 + (i % 3) * 6} y={3 + Math.floor(i / 3) * 6} width="5" height="5" rx="1" fill={on[i] ? color : 'none'} />
      ))}</svg>);
    }
    case 'nback':
      return (<svg {...c}><path d="M20 11.5 A8 8 0 1 0 18 17" /><polyline points="20 6 20 11.5 14.5 11.5" /></svg>);
    case 'paired-associates':
      return (<svg {...c}><rect x="3" y="7" width="9" height="12" rx="1.5" /><rect x="12" y="5" width="9" height="12" rx="1.5" /></svg>);
    case 'rush-hour':
      return (<svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /><rect x="6" y="10" width="6" height="4" rx="1" fill={color} stroke="none" /><path d="M15 12 H21" /><path d="M18.5 9.5 L21 12 L18.5 14.5" /></svg>);
    case 'raven-matrices':
      return (<svg {...c}><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><text x="16.2" y="19.2" fontSize="7" fontFamily="sans-serif" fill={color} stroke="none">?</text></svg>);
    case 'tower-hanoi': // Colour Sort — a test tube with stacked colour bands
      return (<svg {...c}><path d="M8.5 3 V14 a3.5 3.5 0 0 0 7 0 V3" /><line x1="7.3" y1="3" x2="16.7" y2="3" /><path d="M9 12.5 V14 a3 3 0 0 0 6 0 V12.5 Z" fill={color} stroke="none" /><rect x="9" y="9" width="6" height="2.6" rx="1.2" fill={color} stroke="none" /><rect x="9" y="5.4" width="6" height="2.6" rx="1.2" fill={color} stroke="none" /></svg>);
    case 'spatial-stroop':
      return (<svg {...c}><path d="M4 12 H17" /><path d="M13 8 L17 12 L13 16" /></svg>);
    case 'flip':
      return (<svg {...c}><path d="M8 8 V15" /><path d="M5 12 L8 15 L11 12" /><path d="M16 16 V9" /><path d="M13 12 L16 9 L19 12" /></svg>);
    case 'math-gates':
      return (<svg {...c}><line x1="4" y1="12" x2="10" y2="12" /><line x1="7" y1="9" x2="7" y2="15" /><line x1="14" y1="9.5" x2="19" y2="14.5" /><line x1="19" y1="9.5" x2="14" y2="14.5" /></svg>);
    case 'wordle':
      return (<svg {...c}><rect x="2.5" y="9" width="5" height="6" rx="1" /><rect x="9.5" y="9" width="5" height="6" rx="1" fill={color} stroke="none" /><rect x="16.5" y="9" width="5" height="6" rx="1" /></svg>);
    case 'synonyms':
      return (<svg {...c}><circle cx="5.5" cy="12" r="1.4" fill={color} stroke="none" /><circle cx="18.5" cy="12" r="1.4" fill={color} stroke="none" /><path d="M8 12 H16" /><path d="M10 9.5 L8 12 L10 14.5" /><path d="M14 9.5 L16 12 L14 14.5" /></svg>);
    case 'odd-one-out':
      return (<svg {...c}><circle cx="6.5" cy="7.5" r="2.3" /><circle cx="15" cy="7.5" r="2.3" /><circle cx="6.5" cy="16" r="2.3" /><rect x="12.4" y="13.4" width="5.2" height="5.2" rx="0.8" fill={color} stroke="none" /></svg>);
    default:
      return null;
  }
}

/** gameKeys that GameGlyph can draw — used to decide whether to show a banner. */
const GAME_GLYPH_KEYS = new Set([
  'speed-match', 'piano-tap', 'trail-making',
  'cancel-task', 'mot', 'train-switch',
  'memo-span', 'nback', 'paired-associates',
  'rush-hour', 'raven-matrices', 'tower-hanoi',
  'spatial-stroop', 'flip', 'math-gates',
  'wordle', 'synonyms', 'odd-one-out',
]);

/**
 * Card banner — a solid accent panel on the right edge of the card with a
 * white game glyph (the "Speed style" we picked). Applied to every domain.
 * Returns null for games that have no glyph yet (keeps the plain card).
 */
function CardBanner({ gameKey, accent }) {
  if (!GAME_GLYPH_KEYS.has(gameKey)) return null;
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: '44%', zIndex: 0,
        pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 20,
        background: `linear-gradient(90deg, transparent 0%, ${accent}cc 55%, ${accent} 100%)`,
      }}
    >
      <GameGlyph k={gameKey} size={64} color="#fff" strokeWidth={1.7} />
    </span>
  );
}

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

          {/* Cards centered in the remaining space → 1–3 games still look intentional */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%', paddingBottom: 12 }}>
            <p style={{ maxWidth: 520, width: '100%', margin: '0 auto 12px', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: HUB_LIGHT.muted, textAlign: isAr ? 'right' : 'left' }}>
              {isAr ? 'اختر لعبة' : 'Choose a game'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 520, width: '100%', margin: '0 auto' }}>
              {pickList.map((sub, i) => {
                const subName = (isAr && sub.nameAr) ? sub.nameAr : sub.name;
                const subBlurb = isAr ? sub.blurbAr : sub.blurb;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setActiveGame(sub.game);
                      setPickList([]);
                      setScreen('game');
                    }}
                    style={{
                      position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', gap: 16,
                      textAlign: isAr ? 'right' : 'left',
                      padding: '18px 20px', borderRadius: 18,
                      border: '2px solid #1a1208',
                      background: 'linear-gradient(180deg, #ffffff 0%, #f7f1eb 100%)',
                      boxShadow: '4px 4px 0 #1a1208',
                      cursor: 'pointer',
                    }}
                  >
                    <CardBanner gameKey={sub.game} accent={accent} />
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'relative', zIndex: 1,
                        width: 50, height: 50, flexShrink: 0, borderRadius: 14,
                        background: accent, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontFamily: "'Fredoka One', sans-serif",
                        boxShadow: '2px 2px 0 #1a1208',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontFamily: "'Bangers', cursive", fontSize: 23, letterSpacing: 1.2, color: HUB_LIGHT.text, lineHeight: 1.05 }}>
                        {subName}
                      </span>
                      {subBlurb && (
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 13, color: HUB_LIGHT.muted, lineHeight: 1.35 }}>
                          {subBlurb}
                        </span>
                      )}
                    </span>
                    <span aria-hidden="true" style={{ position: 'relative', zIndex: 1, fontSize: 26, color: accent, transform: isAr ? 'scaleX(-1)' : 'none', flexShrink: 0 }}>
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
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
