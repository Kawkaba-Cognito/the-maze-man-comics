import React, { useState, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../styles/tokens';
import { TrainingMenuBar } from '../../features/training/shared/TrainingChrome';
import { PUZZLE_CONFIGS } from '../../features/puzzles/registry';
import { getLazyPuzzle } from '../../features/puzzles/lazyGames';
import { PUZZLE_UI } from '../../features/puzzles/shared/puzzleStrings';

function GameLoading({ isAr }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: tokens.trainingPaletteSurface,
        color: '#5c534c',
        fontFamily: "'Outfit', system-ui, sans-serif",
        fontSize: 14,
        letterSpacing: 1.5,
      }}
    >
      {isAr ? 'جارِ التحميل…' : 'Loading…'}
    </div>
  );
}

export default function PuzzlesScreen() {
  const { switchTab, currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];

  const [activeGame, setActiveGame] = useState(null);
  const GameView = activeGame ? getLazyPuzzle(activeGame) : null;

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div
        className="ct-puzzle-hub-title"
        style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}
      >
        {t.hubTitle}
      </div>
    </>
  );

  if (activeGame && GameView) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          minHeight: 'min(100vh, 100dvh)',
          backgroundColor: tokens.trainingPaletteSurface,
          isolation: 'isolate',
        }}
      >
        <Suspense fallback={<GameLoading isAr={isAr} />}>
          <GameView onBack={() => setActiveGame(null)} />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--hub">
      <TrainingMenuBar
        onBack={() => switchTab('home')}
        playSfx={playSfx}
        center={hubCenter}
        hubSpaced
        variant="paper"
      />
      <div className="ct-puzzle-hub-body">
        <p className="ct-puzzle-hub-sub">{t.hubSub}</p>
        <div className="ct-puzzle-list" role="list">
          {PUZZLE_CONFIGS.map((puzzle) => (
            <button
              key={puzzle.id}
              type="button"
              className="ct-puzzle-list-item"
              style={{ '--puzzle-accent': puzzle.accent }}
              onClick={() => {
                playSfx('click');
                setActiveGame(puzzle.gameKey);
              }}
            >
              <span className="ct-puzzle-list-ic" aria-hidden="true">
                {puzzle.icon}
              </span>
              <span className="ct-puzzle-list-body">
                <span className="ct-puzzle-list-lb">{isAr ? puzzle.nameAr : puzzle.name}</span>
                <span className={`ct-puzzle-list-hint${isAr ? ' ct-puzzle-list-hint-ar' : ''}`}>
                  {isAr ? puzzle.descAr : puzzle.desc}
                </span>
              </span>
              <span className="ct-puzzle-list-chev" aria-hidden="true">
                ›
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
