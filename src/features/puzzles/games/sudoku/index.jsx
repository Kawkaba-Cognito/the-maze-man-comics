import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame, useNumberPuzzleGrid } from '../../shared/NumberPuzzleFrame';
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

function SudokuGrid({ state, setState, size, solved, playSfx, isAr, selected, setSelected }) {
  const grid = useNumberPuzzleGrid(state, setState, setSudokuCell);
  const active = grid.gridState;
  const gridSize = grid.gridSize ?? size;
  const box = SUDOKU_SIZES[gridSize];
  const conflicts = useMemo(
    () => (active && !solved && !grid.trialMode ? sudokuConflicts(active) : new Set()),
    [active, solved, grid.trialMode],
  );

  if (!active) return null;

  return (
    <>
      <div className="ct-puzzle-grid-wrap">
        <div className={`ct-puzzle-grid ct-puzzle-grid--sudoku ct-puzzle-grid--n${gridSize}`} style={{ '--puzzle-grid-n': gridSize }}>
          {active.player.map((row, r) =>
            row.map((val, c) => {
              const isBoxRight = (c + 1) % box.boxCols === 0 && c !== gridSize - 1;
              const isBoxBottom = (r + 1) % box.boxRows === 0 && r !== gridSize - 1;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num${active.fixed[r][c] ? ' ct-puzzle-cell--fixed' : ''}${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}${conflicts.has(`${r}-${c}`) ? ' ct-puzzle-cell--err-soft' : ''}${isBoxRight ? ' ct-puzzle-cell--box-r' : ''}${isBoxBottom ? ' ct-puzzle-cell--box-b' : ''}`}
                  disabled={active.fixed[r][c] || (solved && !grid.trialMode)}
                  onClick={() => {
                    playSfx('click');
                    grid.onCellSelect(r, c, setSelected);
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
        max={gridSize}
        selected={selected}
        isAr={isAr}
        playSfx={playSfx}
        onPick={(n) => grid.onCellValue(n, selected)}
        onClear={() => grid.onCellValue(0, selected)}
      />
      {conflicts.size > 0 ? (
        <p className="ct-puzzle-error">{isAr ? 'هناك تكرار' : 'There is a repeat'}</p>
      ) : null}
    </>
  );
}

export default function SudokuPuzzle({ onBack, onSolved }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const [size, setSize] = useState(4);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState(null);

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateSudoku(n, seed));
    setElapsed(0);
    setSolved(false);
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
      onSolved?.();
      playSfx('win');
    }
  }, [state, playSfx, onSolved]);

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
      hintReveal={hintReveal}
      onReset={() => setState((s) => ({ ...s, player: s.puzzle.map((row) => row.slice()) }))}
      hint={isAr ? 'املأ كل صف وعمود وصندوق بالأرقام دون تكرار.' : 'Fill every row, column, and box with no repeats.'}
    >
      <SudokuGrid
        state={state}
        setState={setState}
        size={size}
        solved={solved}
        isAr={isAr}
        playSfx={playSfx}
        selected={selected}
        setSelected={setSelected}
      />
    </NumberPuzzleFrame>
  );
}
