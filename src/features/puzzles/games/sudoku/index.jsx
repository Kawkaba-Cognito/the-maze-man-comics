import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { NumberPad } from '../../shared/GridSizePicker';
import { generateSudoku, isSudokuSolved, setSudokuCell, sudokuHasConflict } from './sudokuEngine';

const CONFIG = getPuzzle('sudoku');
const SIZES = [4, 6, 9];

export default function SudokuPuzzle({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutorial = usePuzzleTutorial('sudoku', isAr);
  const [size, setSize] = useState(4);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateSudoku(n, seed));
    setElapsed(0);
    setSolved(false);
    setError(false);
    setSelected(null);
  }, []);

  useEffect(() => {
    if (!state || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [state, solved]);

  useEffect(() => {
    if (!state) return;
    if (isSudokuSolved(state)) {
      setSolved(true);
      setError(false);
      playSfx('win');
    } else {
      setError(sudokuHasConflict(state));
    }
  }, [state, playSfx]);

  return (
    <NumberPuzzleFrame
      config={CONFIG}
      puzzleId="sudoku"
      isAr={isAr}
      t={t}
      playSfx={playSfx}
      onBack={onBack}
      sizes={SIZES}
      size={size}
      setSize={setSize}
      state={state}
      solved={solved}
      elapsed={elapsed}
      newGame={newGame}
      onReset={() => setState((s) => ({ ...s, player: s.puzzle.map((row) => row.slice()) }))}
      hint={isAr ? 'املأ كل صف وعمود وصندوق بالأرقام دون تكرار.' : 'Fill every row, column, and box with no repeats.'}
      {...tutorial}
    >
      <div className="ct-puzzle-grid-wrap">
        <div className={`ct-puzzle-grid ct-puzzle-grid--sudoku ct-puzzle-grid--n${size}`} style={{ '--puzzle-grid-n': size }}>
          {state?.player.map((row, r) =>
            row.map((val, c) => (
              <button
                key={`${r}-${c}`}
                type="button"
                className={`ct-puzzle-cell ct-puzzle-cell--num${state.fixed[r][c] ? ' ct-puzzle-cell--fixed' : ''}${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}${error ? ' ct-puzzle-cell--err-soft' : ''}`}
                disabled={state.fixed[r][c] || solved}
                onClick={() => {
                  playSfx('click');
                  setSelected([r, c]);
                }}
              >
                {val || ''}
              </button>
            ))
          )}
        </div>
      </div>
      <NumberPad
        max={size}
        selected={selected}
        isAr={isAr}
        playSfx={playSfx}
        onPick={(n) => setState((s) => setSudokuCell(s, selected[0], selected[1], n))}
        onClear={() => setState((s) => setSudokuCell(s, selected[0], selected[1], 0))}
      />
      {error ? <p className="ct-puzzle-error">{isAr ? 'هناك تكرار' : 'There is a repeat'}</p> : null}
    </NumberPuzzleFrame>
  );
}
