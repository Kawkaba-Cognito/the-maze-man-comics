import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { NumberPad } from '../../shared/GridSizePicker';
import { makeHint } from '../../shared/useHint';
import {
  SUDOKU_SIZES,
  generateSudoku,
  isSudokuSolved,
  setSudokuCell,
  sudokuConflicts,
  hintReveal,
} from './sudokuEngine';

const CONFIG = getPuzzle('sudoku');
const SIZES = [4, 6, 9];

export default function SudokuPuzzle({ onBack }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutorial = usePuzzleTutorial('sudoku', isAr);
  const [size, setSize] = useState(4);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [conflicts, setConflicts] = useState(() => new Set());
  const [selected, setSelected] = useState(null);

  /* Box geometry for the current grid — drives the thicker box separators so a
   * 9×9 reads as nine 3×3 boxes (and 4/6 as their boxes) like a real Sudoku. */
  const box = SUDOKU_SIZES[size];

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateSudoku(n, seed));
    setElapsed(0);
    setSolved(false);
    setConflicts(new Set());
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
      setConflicts(new Set());
      playSfx('win');
    } else {
      setConflicts(sudokuConflicts(state));
    }
  }, [state, playSfx]);

  const hasConflict = conflicts.size > 0;

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
      hintCfg={makeHint({ points, spendPoints, solved, state, setState, hintReveal })}
      onReset={() => setState((s) => ({ ...s, player: s.puzzle.map((row) => row.slice()) }))}
      hint={isAr ? 'املأ كل صف وعمود وصندوق بالأرقام دون تكرار.' : 'Fill every row, column, and box with no repeats.'}
      {...tutorial}
    >
      <div className="ct-puzzle-grid-wrap">
        <div className={`ct-puzzle-grid ct-puzzle-grid--sudoku ct-puzzle-grid--n${size}`} style={{ '--puzzle-grid-n': size }}>
          {state?.player.map((row, r) =>
            row.map((val, c) => {
              const isBoxRight = (c + 1) % box.boxCols === 0 && c !== size - 1;
              const isBoxBottom = (r + 1) % box.boxRows === 0 && r !== size - 1;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num${state.fixed[r][c] ? ' ct-puzzle-cell--fixed' : ''}${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}${conflicts.has(`${r}-${c}`) ? ' ct-puzzle-cell--err-soft' : ''}${isBoxRight ? ' ct-puzzle-cell--box-r' : ''}${isBoxBottom ? ' ct-puzzle-cell--box-b' : ''}`}
                  disabled={state.fixed[r][c] || solved}
                  onClick={() => {
                    playSfx('click');
                    setSelected([r, c]);
                  }}
                >
                  {val || ''}
                </button>
              );
            })
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
      {hasConflict ? <p className="ct-puzzle-error">{isAr ? 'هناك تكرار' : 'There is a repeat'}</p> : null}
    </NumberPuzzleFrame>
  );
}
