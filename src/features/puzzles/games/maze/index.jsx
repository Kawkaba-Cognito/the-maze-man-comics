import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  moveMaze,
  MAZE_TIER_HINTS,
  tierSubtitle,
} from './mazeEngine';
import MazeCanvas from './MazeCanvas';
import MazeJoystick from './MazeJoystick';
import { puzzleWinPoints } from '../../../../lib/points';

const STEP_MS = 135; // auto-step cadence while a direction is held
const KEY_DIRS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', s: 'down', a: 'left', d: 'right',
  W: 'up', S: 'down', A: 'left', D: 'right',
};

const CONFIG = getPuzzle('maze');
const PUZZLE_ID = 'maze';

export default function LogicMazePuzzle({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
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
  const dirRef = useRef(null);

  const newGame = useCallback((gridSize, seed = randomSeed()) => {
    setState(generateLogicMaze(gridSize, seed));
    setElapsed(0);
    setSolved(false);
    dirRef.current = null;
  }, []);

  const step = useCallback((dir) => {
    setState((s) => (s ? moveMaze(s, dir) : s));
  }, []);

  /* Joystick reports the held direction (or null on release). Step once
   * immediately for snappy response, then the hold-loop keeps stepping. */
  const handleDirection = useCallback((dir) => {
    dirRef.current = dir;
    if (dir) step(dir);
  }, [step]);

  // Hold-to-move: auto-step every STEP_MS while a direction is held.
  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => {
      if (dirRef.current) step(dirRef.current);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [screen, solved, step]);

  // Keyboard (arrows / WASD) as a desktop alternative to the joystick.
  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const onKey = (e) => {
      const dir = KEY_DIRS[e.key];
      if (!dir) return;
      e.preventDefault();
      step(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, solved, step]);

  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, solved]);

  useEffect(() => {
    if (state && !solved && isMazeSolved(state)) {
      setSolved(true);
      playSfx('win');
      awardPoints(puzzleWinPoints(size, CONFIG.sizes));
    }
  }, [state, solved, size, playSfx, awardPoints]);

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
        <PuzzleHint>
          {isAr
            ? 'حرّك الكرة من البداية إلى الهدف باستخدام عصا التحكم.'
            : 'Move your token from START to GOAL with the joystick.'}
        </PuzzleHint>
        <MazeCanvas state={state} solved={solved} />
        <div className="ct-puzzle-stats">
          <span>{t.moves(pathLen)}</span>
          <span>{t.time(elapsed)}</span>
        </div>
        {!solved ? (
          <>
            <MazeJoystick
              onDirection={handleDirection}
              disabled={solved}
              ariaLabel={isAr ? 'عصا التحكم' : 'Movement joystick'}
            />
            <PuzzleToolbar
              t={t}
              playSfx={playSfx}
              onNew={() => newGame(size)}
              onReset={() => setState((s) => resetMazePath(s))}
            />
          </>
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
