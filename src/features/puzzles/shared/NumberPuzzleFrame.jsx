import React, { useEffect, useRef, useState } from 'react';
import { TrainingMenuBar, TrainingPlayHeader } from '../../training/shared/TrainingChrome';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from './GridSizePicker';
import PuzzleTutorial from './PuzzleTutorial';
import { TUTORIAL_UI } from './tutorialContent';
import { useApp } from '../../../context/AppContext';
import { puzzleWinPoints } from '../../../lib/points';

export function NumberPuzzleFrame({
  config,
  puzzleId,
  isAr,
  t,
  playSfx,
  onBack,
  sizes,
  size,
  setSize,
  state,
  solved,
  elapsed,
  newGame,
  tutorialOpen,
  steps,
  openTutorial,
  closeTutorial,
  maybeShowTutorial,
  hint,
  hintCfg,
  children,
  onReset,
}) {
  const [screen, setScreen] = useState('hub');
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { awardPoints } = useApp();
  const awardedRef = useRef(false);

  useEffect(() => {
    if (screen === 'play') maybeShowTutorial();
  }, [screen, maybeShowTutorial]);

  // Award points once per solve (puzzle difficulty ≈ grid size).
  useEffect(() => {
    if (solved && !awardedRef.current) {
      awardedRef.current = true;
      awardPoints(puzzleWinPoints(size, sizes));
    } else if (!solved) {
      awardedRef.current = false;
    }
  }, [solved, size, awardPoints]);

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div
        className="ct-puzzle-hub-title"
        style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}
      >
        {isAr ? config.nameAr : config.name}
      </div>
    </>
  );

  if (screen === 'hub') {
    return (
      <div className="ct-puzzle-screen ct-puzzle-screen--hub">
        <TrainingMenuBar
          onBack={onBack}
          playSfx={playSfx}
          center={hubCenter}
          hubSpaced
          variant="paper"
          onReplayTutorial={openTutorial}
          replayHint={tutLabels.replayTutorial}
        />
        <div className="ct-puzzle-hub-body">
          <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
          <GridSizePicker
            t={t}
            isAr={isAr}
            sizes={sizes}
            onPick={(n) => {
              setSize(n);
              newGame(n);
              setScreen('play');
            }}
            playSfx={playSfx}
          />
        </div>
        {tutorialOpen ? <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} /> : null}
      </div>
    );
  }

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader
        isAr={isAr}
        title={isAr ? config.nameAr : config.name}
        subtitle={t.gridLabel(size)}
        onMenu={() => setScreen('hub')}
        onTutorial={openTutorial}
        tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx}
        menuAriaLabel={t.menu}
      />
      <div className="ct-puzzle-play-body">
        <PuzzleHint>{hint}</PuzzleHint>
        {children}
        <div className="ct-puzzle-stats">
          <span>{t.time(elapsed)}</span>
        </div>
        {!solved ? (
          <PuzzleToolbar
            t={t}
            playSfx={playSfx}
            onNew={() => newGame(size)}
            onReset={onReset}
            hint={hintCfg}
          />
        ) : (
          <PuzzleWinBanner
            t={t}
            elapsed={elapsed}
            playSfx={playSfx}
            onPlayAgain={() => newGame(size)}
            onChangeSize={() => setScreen('hub')}
          />
        )}
      </div>
      {tutorialOpen ? <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} /> : null}
    </div>
  );
}
