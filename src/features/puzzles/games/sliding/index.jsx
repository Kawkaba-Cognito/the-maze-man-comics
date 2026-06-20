import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from '../../shared/GridSizePicker';
import PuzzleScreenFrame, { useBoardPuzzleTrial } from '../../shared/PuzzleScreenFrame';
import { puzzleWinPoints } from '../../../../lib/points';
import { makeHint } from '../../shared/useHint';
import {
  createSlidingPuzzle,
  trySlide,
  isSlidingSolved,
  hintReveal,
} from './slidingEngine';

const CONFIG = getPuzzle('sliding');
const PUZZLE_ID = 'sliding';

function SlidingBoard({ state, setState, size, solved, playSfx }) {
  const trial = useBoardPuzzleTrial(state, setState);
  const active = trial.activeState ?? state;
  const gridSize = active?.size ?? size;

  if (!active) return null;

  return (
    <div className="ct-puzzle-grid-wrap">
      <div className="ct-slide-board" style={{ '--slide-n': gridSize }}>
        {Array.from({ length: gridSize * gridSize - 1 }, (_, i) => i + 1).map((val) => {
          const idx = active.tiles.indexOf(val);
          const r = Math.floor(idx / gridSize);
          const c = idx % gridSize;
          return (
            <button
              key={val}
              type="button"
              className="ct-slide-tile"
              style={{ transform: `translate(${c * 100}%, ${r * 100}%)` }}
              disabled={solved && !trial.trialMode}
              onClick={() => {
                playSfx('click');
                if (trial.trialMode) {
                  trial.notifyAction({ type: 'slide', index: idx });
                } else {
                  setState((s) => trySlide(s, idx));
                }
              }}
            >
              {val}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SlidingPuzzle({ onBack, onSolved }) {
  const { currentLang, playSfx, awardPoints, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];

  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [trialActive, setTrialActive] = useState(false);

  const newGame = useCallback((gridSize, seed = randomSeed()) => {
    setState(createSlidingPuzzle(gridSize, seed));
    setElapsed(0);
    setSolved(false);
  }, []);

  useEffect(() => {
    if (trialActive || !state || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [state, solved, trialActive]);

  useEffect(() => {
    if (trialActive) return;
    if (state && !solved && isSlidingSolved(state)) {
      setSolved(true);
      onSolved?.();
      playSfx('win');
      awardPoints(puzzleWinPoints(size, CONFIG.sizes));
    }
  }, [state, solved, size, playSfx, awardPoints, onSolved, trialActive]);

  return (
    <PuzzleScreenFrame
      puzzleId={PUZZLE_ID}
      config={CONFIG}
      isAr={isAr}
      t={t}
      playSfx={playSfx}
      onBack={onBack}
      sizes={CONFIG.sizes}
      size={size}
      setSize={setSize}
      solved={solved}
      elapsed={elapsed}
      onNewGame={newGame}
      onAwardSizes={CONFIG.sizes}
      hintReveal={hintReveal}
      subtitle={size ? t.gridLabel(size) : ''}
    >
      <TrialWatcher onTrialChange={setTrialActive} />
      <PuzzleHint>{t.slidingHint}</PuzzleHint>
      <SlidingBoard state={state} setState={setState} size={size} solved={solved} playSfx={playSfx} />
      {!trialActive ? (
        <div className="ct-puzzle-stats">
          <span>{t.moves(state?.moves ?? 0)}</span>
          <span>{t.time(elapsed)}</span>
        </div>
      ) : null}
      {!trialActive && !solved ? (
        <PuzzleToolbar
          t={t}
          playSfx={playSfx}
          onNew={() => newGame(size)}
          onReset={() => newGame(size, state?.seed)}
          hint={makeHint({ points, spendPoints, solved, state, setState, hintReveal })}
        />
      ) : null}
      {!trialActive && solved ? (
        <PuzzleWinBanner
          t={t}
          moves={state.moves}
          elapsed={elapsed}
          playSfx={playSfx}
          onPlayAgain={() => newGame(size)}
          onChangeSize={() => {}}
        />
      ) : null}
    </PuzzleScreenFrame>
  );
}

function TrialWatcher({ onTrialChange }) {
  const trial = useBoardPuzzleTrial(null, () => {});
  useEffect(() => {
    onTrialChange(trial.trialMode);
  }, [trial.trialMode, onTrialChange]);
  return null;
}
