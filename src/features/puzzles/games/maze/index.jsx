import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader } from '../../../training/shared/TrainingChrome';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { TUTORIAL_UI } from '../../shared/tutorialContent';
import { randomSeed } from '../../shared/rng';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from '../../shared/GridSizePicker';
import PuzzleTutorial from '../../shared/PuzzleTutorial';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import {
  generateLogicMaze,
  isMazeSolved,
  resetMazePath,
  MAZE_TIER_HINTS,
  tierSubtitle,
} from './mazeEngine';
import MazeCanvas from './MazeCanvas';

const CONFIG = getPuzzle('maze');
const PUZZLE_ID = 'maze';

export default function LogicMazePuzzle({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { tutorialOpen, steps, openTutorial, closeTutorial, maybeShowTutorial } =
    usePuzzleTutorial(PUZZLE_ID, isAr);

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);

  const newGame = useCallback((gridSize, seed = randomSeed()) => {
    setState(generateLogicMaze(gridSize, seed));
    setElapsed(0);
    setSolved(false);
  }, []);

  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, solved]);

  useEffect(() => {
    if (state && isMazeSolved(state)) {
      setSolved(true);
      playSfx('win');
    }
  }, [state, playSfx]);

  useEffect(() => {
    if (screen === 'play') maybeShowTutorial();
  }, [screen, maybeShowTutorial]);

  const mazeHints = MAZE_TIER_HINTS[isAr ? 'ar' : 'en'];
  const mazeHintFor = (n) => mazeHints[n];

  const pickSize = (n) => {
    setSize(n);
    newGame(n);
    setScreen('play');
  };

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div
        className="ct-puzzle-hub-title"
        style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}
      >
        {isAr ? CONFIG.nameAr : CONFIG.name}
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
          <p className="ct-puzzle-hub-sub">{isAr ? 'كل مستوى متاهة أكثر تعقيداً — خطّط قبل أن ترسم.' : 'Each level is a denser labyrinth — plan before you draw.'}</p>
          <GridSizePicker
            t={t}
            isAr={isAr}
            sizes={CONFIG.sizes}
            onPick={pickSize}
            playSfx={playSfx}
            hintForSize={mazeHintFor}
          />
        </div>
        {tutorialOpen ? (
          <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} />
        ) : null}
      </div>
    );
  }

  const pathLen = Math.max(0, state.path.length - 1);

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader
        isAr={isAr}
        title={isAr ? CONFIG.nameAr : CONFIG.name}
        subtitle={state ? tierSubtitle(state, isAr) : t.gridLabel(size)}
        onMenu={() => setScreen('hub')}
        onTutorial={openTutorial}
        tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx}
        menuAriaLabel={t.menu}
      />
      <div className="ct-puzzle-play-body">
        <PuzzleHint>{t.mazeHint}</PuzzleHint>
        <MazeCanvas
          state={state}
          solved={solved}
          onPathChange={setState}
          playSfx={playSfx}
        />
        <div className="ct-puzzle-stats">
          <span>{t.moves(pathLen)}</span>
          <span>{t.time(elapsed)}</span>
        </div>
        {!solved ? (
          <PuzzleToolbar
            t={t}
            playSfx={playSfx}
            onNew={() => newGame(size)}
            onReset={() => setState((s) => resetMazePath(s))}
          />
        ) : (
          <PuzzleWinBanner
            t={t}
            moves={pathLen}
            elapsed={elapsed}
            playSfx={playSfx}
            onPlayAgain={() => newGame(size)}
            onChangeSize={() => setScreen('hub')}
          />
        )}
      </div>
      {tutorialOpen ? (
        <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} />
      ) : null}
    </div>
  );
}
