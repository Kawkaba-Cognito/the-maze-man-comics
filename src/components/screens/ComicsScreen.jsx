import React, { useState, useEffect, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import RadialMazeHub from '../training/RadialMazeHub';
import { DOMAINS } from '../training/trainingData';
import { TrainingScreenShell } from '../../features/training/shared/TrainingScreens';
import DomainAboutLink from '../../features/training/shared/DomainAboutLink';
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
    case 'story-grid': // a 3-panel comic strip with a play arrow (watch → rebuild)
      return (<svg {...c}><rect x="3" y="6" width="18" height="12" rx="2" /><line x1="9" y1="6" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="18" /><path d="M5 9.5 L7.2 12 L5 14.5 Z" fill={color} stroke="none" /></svg>);
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
    case 'wisconsin': // Card Sort — two cards holding different symbols
      return (<svg {...c}><rect x="3" y="6" width="8.5" height="12" rx="1.5" /><rect x="12.5" y="6" width="8.5" height="12" rx="1.5" /><polygon points="7.25,9.5 9,13 5.5,13" fill={color} stroke="none" /><circle cx="16.75" cy="12" r="2" fill={color} stroke="none" /></svg>);
    case 'brixton': // Kawkab Hops — a dot hopping across nodes
      return (<svg {...c}><circle cx="5" cy="17" r="1.7" /><circle cx="12" cy="17" r="1.7" /><circle cx="19" cy="17" r="1.7" /><path d="M5 15.5 Q8.5 6 12 15.5" /><circle cx="12" cy="17" r="1.7" fill={color} stroke="none" /></svg>);
    case 'math-gates':
      return (<svg {...c}><line x1="4" y1="12" x2="10" y2="12" /><line x1="7" y1="9" x2="7" y2="15" /><line x1="14" y1="9.5" x2="19" y2="14.5" /><line x1="19" y1="9.5" x2="14" y2="14.5" /></svg>);
    case 'wordle':
      return (<svg {...c}><rect x="2.5" y="9" width="5" height="6" rx="1" /><rect x="9.5" y="9" width="5" height="6" rx="1" fill={color} stroke="none" /><rect x="16.5" y="9" width="5" height="6" rx="1" /></svg>);
    case 'synonyms':
      return (<svg {...c}><circle cx="5.5" cy="12" r="1.4" fill={color} stroke="none" /><circle cx="18.5" cy="12" r="1.4" fill={color} stroke="none" /><path d="M8 12 H16" /><path d="M10 9.5 L8 12 L10 14.5" /><path d="M14 9.5 L16 12 L14 14.5" /></svg>);
    case 'odd-one-out':
      return (<svg {...c}><circle cx="6.5" cy="7.5" r="2.3" /><circle cx="15" cy="7.5" r="2.3" /><circle cx="6.5" cy="16" r="2.3" /><rect x="12.4" y="13.4" width="5.2" height="5.2" rx="0.8" fill={color} stroke="none" /></svg>);
    case 'trivia': // a staircase (climb to answer) with a flag at the top
      return (<svg {...c}><path d="M3 20 H8 V16 H13 V12 H18 V8" /><line x1="18" y1="8" x2="18" y2="4" /><path d="M18 4 H21 V6 H18" fill={color} stroke="none" /></svg>);
    case 'detective': // a magnifying glass (deduction)
      return (<svg {...c}><circle cx="10.5" cy="10.5" r="6.5" /><line x1="15.2" y1="15.2" x2="20.5" y2="20.5" /></svg>);
    default:
      return null;
  }
}

/** gameKeys that GameGlyph can draw — used to decide whether to show a banner. */
const GAME_GLYPH_KEYS = new Set([
  'speed-match', 'math-gates', 'trail-making',
  'cancel-task', 'mot', 'train-switch',
  'memo-span', 'nback', 'paired-associates', 'story-grid',
  'rush-hour', 'raven-matrices', 'tower-hanoi', 'detective',
  'spatial-stroop', 'wisconsin', 'brixton',
  'wordle', 'synonyms', 'odd-one-out', 'trivia',
]);

/** Side banner with white game glyph — domain accent only on the card edge. */
function CardBanner({ gameKey, side = 'right' }) {
  if (!GAME_GLYPH_KEYS.has(gameKey)) return null;
  return (
    <span
      aria-hidden="true"
      className={`ct-domain-pick-banner ct-domain-pick-banner--${side}`}
    >
      <GameGlyph k={gameKey} size={58} color="#fff" strokeWidth={1.7} />
    </span>
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
  const domainDesc = d && isAr && d.descAr ? d.descAr : d?.desc;
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
              backgroundColor: tokens.trainingPaletteSurface,
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
        <AssessmentFlow onBack={backToHub} />
      )}
      {screen === 'pick' && d && (
        <TrainingScreenShell
          hub
          isAr={isAr}
          playSfx={playSfx}
          onBack={backToHub}
          title={domainName}
          tag={domainTag}
          shellClassName={`ct-domain-pick ct-domain-pick--${activeDomain}`}
        >
          <div className="ct-domain-pick-body">
            {domainDesc ? (
              <p className="ct-domain-pick-desc">{domainDesc}</p>
            ) : null}

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

              <div className="ct-domain-pick-list" role="group" aria-label={isAr ? 'تمارين المجال' : 'Domain exercises'}>
                {pickList.map((sub, idx) => {
                  const subName = (isAr && sub.nameAr) ? sub.nameAr : sub.name;
                  const subBlurb = isAr ? sub.blurbAr : sub.blurb;
                  const bannerSide = isAr ? 'left' : 'right';
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      className={`ct-fq-attn-mode ct-domain-pick-card ct-domain-pick-card--${idx}`}
                      onClick={() => {
                        playSfx?.('click');
                        setActiveGame(sub.game);
                        setPickList([]);
                        setScreen('game');
                      }}
                    >
                      <CardBanner gameKey={sub.game} side={bannerSide} />
                      <span className="ct-fq-attn-mode-body">
                        <span className="ct-fq-attn-mode-lb">{subName}</span>
                        {subBlurb ? (
                          <span className={`ct-fq-attn-mode-hint ct-domain-pick-card-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
                            {subBlurb}
                          </span>
                        ) : null}
                      </span>
                      <span className="ct-fq-attn-mode-chev ct-domain-pick-card-chev" aria-hidden="true">›</span>
                    </button>
                  );
                })}
              </div>
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
