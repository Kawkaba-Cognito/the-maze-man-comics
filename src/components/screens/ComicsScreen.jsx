import React, { useState, useEffect, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import RadialMazeHub from '../training/RadialMazeHub';
import { DOMAINS, DOMAIN_COLOR } from '../training/trainingData';
import { IconBack } from '../../features/training/shared/TrainingIcons';
import { DomainBadge } from '../../features/training/shared/DomainIcon';
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

/** Uniform game-card size on the domain pick screen (phone-first). */
const PICK_CARD_HEIGHT = 112;
const PICK_BANNER_WIDTH = 'clamp(76px, 24%, 108px)';
const PICK_MAX = 560;

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
function CardBanner({ gameKey, accent, side = 'right' }) {
  if (!GAME_GLYPH_KEYS.has(gameKey)) return null;
  const isLeft = side === 'left';
  return (
    <span
      aria-hidden="true"
      style={{
        position: 'absolute', top: 0, [side]: 0, bottom: 0, width: PICK_BANNER_WIDTH, zIndex: 0,
        pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: isLeft ? 0 : 18,
        paddingLeft: isLeft ? 18 : 0,
        opacity: 0.88,
        background: isLeft
          ? `linear-gradient(270deg, transparent 0%, color-mix(in srgb, ${accent} 55%, transparent) 52%, color-mix(in srgb, ${accent} 88%, #fff) 100%)`
          : `linear-gradient(90deg, transparent 0%, color-mix(in srgb, ${accent} 55%, transparent) 52%, color-mix(in srgb, ${accent} 88%, #fff) 100%)`,
        justifyContent: isLeft ? 'flex-start' : 'flex-end',
      }}
    >
      <GameGlyph k={gameKey} size={58} color="#fff" strokeWidth={1.7} />
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
  const domainName = d && isAr && d.nameAr ? d.nameAr : d?.name;
  const domainDesc = d && isAr && d.descAr ? d.descAr : d?.desc;

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
            padding: `max(52px, env(safe-area-inset-top)) 18px max(28px, env(safe-area-inset-bottom))`,
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Soft domain tint wash */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: `
                radial-gradient(ellipse 90% 42% at 50% -8%, color-mix(in srgb, ${accent} 22%, transparent) 0%, transparent 72%),
                radial-gradient(ellipse 55% 35% at 100% 0%, color-mix(in srgb, ${accent} 10%, transparent) 0%, transparent 70%)
              `,
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: PICK_MAX, width: '100%', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 22 }}>
              <button
                type="button"
                onClick={backToHub}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: '1px solid #e6ddd4',
                  background: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(26,18,8,0.06)',
                }}
                aria-label={isAr ? 'رجوع' : 'Back'}
              >
                <IconBack size={18} c={HUB_LIGHT.text} />
              </button>
            </div>

            {/* Domain header card */}
            <header
              style={{
                borderRadius: 22,
                border: '1px solid #ebe3db',
                background: 'linear-gradient(180deg, #ffffff 0%, #faf6f2 100%)',
                boxShadow: '0 8px 28px rgba(26,18,8,0.06)',
                overflow: 'hidden',
                marginBottom: 28,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  height: 4,
                  background: `linear-gradient(90deg, color-mix(in srgb, ${accent} 55%, #fff) 0%, ${accent} 50%, color-mix(in srgb, ${accent} 55%, #fff) 100%)`,
                }}
              />
              <div style={{ padding: '18px 18px 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    minWidth: 0,
                    flexDirection: isAr ? 'row-reverse' : 'row',
                  }}
                >
                  <DomainBadge
                    domainId={activeDomain}
                    color={accent}
                    size={72}
                    short={d.short}
                  />
                  <div style={{ flex: 1, minWidth: 0, textAlign: isAr ? 'right' : 'left' }}>
                    <p
                      style={{
                        margin: '0 0 6px',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.16em',
                        textTransform: 'uppercase',
                        color: accent,
                      }}
                    >
                      {isAr ? 'مجال تدريبي' : 'Training domain'}
                    </p>
                    <h1
                      style={{
                        margin: 0,
                        fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                        fontSize: 'clamp(1.65rem, 6.2vw, 2.15rem)',
                        fontWeight: 800,
                        lineHeight: 1.08,
                        color: HUB_LIGHT.text,
                        overflowWrap: 'anywhere',
                        textWrap: 'balance',
                        letterSpacing: isAr ? 0 : '-0.02em',
                      }}
                    >
                      {domainName}
                    </h1>
                  </div>
                </div>
                {domainDesc && (
                  <p
                    style={{
                      margin: '16px 0 0',
                      paddingTop: 16,
                      borderTop: '1px solid #f0e8e0',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#4a4038',
                      lineHeight: 1.6,
                      textAlign: isAr ? 'right' : 'left',
                    }}
                  >
                    {domainDesc}
                  </p>
                )}
              </div>
            </header>
          </div>

          {/* Exercise list */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              width: '100%',
              paddingBottom: 8,
            }}
          >
            <div style={{ maxWidth: PICK_MAX, width: '100%', margin: '0 auto' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 14,
                  flexDirection: isAr ? 'row-reverse' : 'row',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, #e8dfd6 35%, #e8dfd6 65%, transparent)',
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#6b5f54',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isAr ? 'اختر تمريناً' : 'Select an exercise'}
                </p>
                <span
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, #e8dfd6 35%, #e8dfd6 65%, transparent)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pickList.map((sub) => {
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
                        position: 'relative',
                        overflow: 'hidden',
                        height: PICK_CARD_HEIGHT,
                        minHeight: PICK_CARD_HEIGHT,
                        maxHeight: PICK_CARD_HEIGHT,
                        width: '100%',
                        boxSizing: 'border-box',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        flexDirection: isAr ? 'row-reverse' : 'row',
                        textAlign: isAr ? 'right' : 'left',
                        padding: '12px 14px',
                        borderRadius: 18,
                        border: '1px solid #e6ddd4',
                        background: 'linear-gradient(180deg, #ffffff 0%, #faf7f3 100%)',
                        boxShadow: '0 4px 14px rgba(26,18,8,0.05)',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `color-mix(in srgb, ${accent} 45%, #e6ddd4)`;
                        e.currentTarget.style.boxShadow = `0 8px 22px color-mix(in srgb, ${accent} 14%, rgba(26,18,8,0.08))`;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e6ddd4';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(26,18,8,0.05)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <CardBanner gameKey={sub.game} accent={accent} side={isAr ? 'left' : 'right'} />
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          width: 48,
                          height: 48,
                          flexShrink: 0,
                          borderRadius: 14,
                          background: `color-mix(in srgb, ${accent} 12%, #fff)`,
                          border: `1.5px solid color-mix(in srgb, ${accent} 28%, #e6ddd4)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <GameGlyph k={sub.game} size={26} color={accent} strokeWidth={1.65} />
                      </span>
                      <span
                        style={{
                          position: 'relative',
                          zIndex: 1,
                          flex: '1 1 auto',
                          minWidth: 0,
                          paddingInlineEnd: PICK_BANNER_WIDTH,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: 4,
                          maxHeight: PICK_CARD_HEIGHT - 24,
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                            fontSize: isAr ? 17 : 18,
                            fontWeight: 800,
                            letterSpacing: isAr ? 0 : '-0.01em',
                            color: HUB_LIGHT.text,
                            lineHeight: 1.15,
                          }}
                        >
                          {subName}
                        </span>
                        {subBlurb && (
                          <span
                            style={{
                              fontFamily: isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif",
                              fontSize: 13,
                              fontWeight: 500,
                              color: '#5c534c',
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {subBlurb}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
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
