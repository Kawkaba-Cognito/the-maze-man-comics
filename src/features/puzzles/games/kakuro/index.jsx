import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame, useNumberPuzzleGrid } from '../../shared/NumberPuzzleFrame';
import { NumberPad } from '../../shared/GridSizePicker';
import { makeHint } from '../../shared/useHint';
import { generateKakuro, isKakuroSolved, resetKakuro, setKakuroCell, hintReveal } from './kakuroEngine';

const CONFIG = getPuzzle('kakuro');
const SIZES = [6, 7];

function KakuroGrid({ state, setState, size, solved, playSfx, isAr, selected, setSelected }) {
  const grid = useNumberPuzzleGrid(state, setState, setKakuroCell);
  const active = grid.gridState;
  const gridSize = active?.size ?? size;

  if (!active) return null;

  return (
    <>
      <div className="ct-puzzle-grid-wrap">
        <div className="ct-puzzle-grid ct-puzzle-grid--kakuro" style={{ '--puzzle-grid-n': gridSize }}>
          {active.board.map((row, r) =>
            row.map((cell, c) => {
              if (cell.block) {
                return (
                  <div key={`${r}-${c}`} className="ct-puzzle-cell ct-puzzle-cell--kakuro-block">
                    {(cell.down || cell.across) ? (
                      <span className="ct-kakuro-clue">
                        {cell.across ? <b>{cell.across}</b> : null}
                        {cell.down ? <i>{cell.down}</i> : null}
                      </span>
                    ) : null}
                  </div>
                );
              }
              const fixed = active.fixed[r][c];
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num ct-puzzle-cell--kakuro${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}${fixed ? ' ct-puzzle-cell--kakuro-given' : ''}`}
                  disabled={(solved && !grid.trialMode) || fixed}
                  onClick={() => {
                    playSfx('click');
                    grid.onCellSelect(r, c, setSelected);
                  }}
                >
                  {active.player[r][c] || ''}
                </button>
              );
            })
          )}
        </div>
      </div>
      <NumberPad
        max={9}
        selected={selected}
        isAr={isAr}
        playSfx={playSfx}
        onPick={(n) => grid.onCellValue(n, selected)}
        onClear={() => grid.onCellValue(0, selected)}
      />
    </>
  );
}

export default function KakuroPuzzle({ onBack, onSolved }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const [size, setSize] = useState(6);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState(null);

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateKakuro(n, seed));
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
    if (isKakuroSolved(state)) {
      setSolved(true);
      onSolved?.();
      playSfx('win');
    }
  }, [state, playSfx, onSolved]);

  return (
    <NumberPuzzleFrame
      config={CONFIG}
      puzzleId="kakuro"
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
      onReset={() => setState((s) => resetKakuro(s))}
      hint={isAr ? 'املأ ١-٩. مجموع كل مسار يطابق الرقم ولا تكرار داخله.' : 'Fill 1-9. Each run must match its clue sum with no repeats.'}
    >
      <KakuroGrid
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
