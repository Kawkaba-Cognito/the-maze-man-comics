import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame, useNumberPuzzleGrid } from '../../shared/NumberPuzzleFrame';
import { NumberPad } from '../../shared/GridSizePicker';
import { makeHint } from '../../shared/useHint';
import { generateKenKen, isKenKenSolved, setKenKenCell, hintReveal, kenKenConflicts } from './kenkenEngine';

const CONFIG = getPuzzle('kenken');
const SIZES = [4, 5, 6, 7];

function KenKenGrid({
  state,
  setState,
  size,
  solved,
  isAr,
  playSfx,
  selected,
  setSelected,
}) {
  const grid = useNumberPuzzleGrid(state, setState, setKenKenCell);
  const active = grid.gridState ?? state;
  const gridSize = grid.gridSize ?? size;
  const cageById = useMemo(() => Object.fromEntries((active?.cages ?? []).map((c) => [c.id, c])), [active]);
  const conflicts = useMemo(
    () => (active && !solved && !grid.trialMode ? kenKenConflicts(active) : new Set()),
    [active, solved, grid.trialMode],
  );

  return (
    <>
      <div className="ct-kenken-legend" dir={isAr ? 'rtl' : 'ltr'}>
        <span><b>+</b> {isAr ? 'جمع' : 'add'}</span>
        <span><b>−</b> {isAr ? 'طرح' : 'subtract'}</span>
        <span><b>×</b> {isAr ? 'ضرب' : 'multiply'}</span>
        <span><b>÷</b> {isAr ? 'قسمة' : 'divide'}</span>
        <span className="ct-kenken-legend__note">{isAr ? 'املأ كل قفص لهدفه' : 'fill each cage to its target'}</span>
      </div>
      <div className="ct-puzzle-grid-wrap">
        <div className="ct-puzzle-grid ct-puzzle-grid--kenken" style={{ '--puzzle-grid-n': gridSize }}>
          {active?.player.map((row, r) =>
            row.map((val, c) => {
              const cageId = active.cageMap[r][c];
              const cage = cageById[cageId];
              const leader = cage?.cells.reduce(
                (best, cell) => (cell[0] < best[0] || (cell[0] === best[0] && cell[1] < best[1]) ? cell : best),
                cage.cells[0],
              );
              const isLeader = leader?.[0] === r && leader?.[1] === c;
              const diff = (rr, cc) => rr < 0 || rr >= gridSize || cc < 0 || cc >= gridSize || active.cageMap[rr][cc] !== cageId;
              const edge = (cond) => (cond ? '2.5px solid #1a1208' : '1px solid rgba(26,18,8,0.16)');
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num ct-puzzle-cell--kenken${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}${conflicts.has(`${r}-${c}`) ? ' ct-puzzle-cell--err-soft' : ''}`}
                  disabled={solved && !grid.trialMode}
                  style={{
                    borderTop: edge(diff(r - 1, c)),
                    borderBottom: edge(diff(r + 1, c)),
                    borderLeft: edge(diff(r, c - 1)),
                    borderRight: edge(diff(r, c + 1)),
                  }}
                  onClick={() => {
                    playSfx('click');
                    grid.onCellSelect(r, c, setSelected);
                  }}
                >
                  {isLeader ? <span className="ct-puzzle-cage-label">{cage.target}{cage.op}</span> : null}
                  <span>{val || ''}</span>
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
    </>
  );
}

export default function KenKenPuzzle({ onBack }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const [size, setSize] = useState(4);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [selected, setSelected] = useState(null);

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateKenKen(n, seed));
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
    if (isKenKenSolved(state)) {
      setSolved(true);
      playSfx('win');
    }
  }, [state, playSfx]);

  return (
    <NumberPuzzleFrame
      config={CONFIG}
      puzzleId="kenken"
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
      onReset={() => setState((s) => ({ ...s, player: Array.from({ length: s.size }, () => Array(s.size).fill(0)) }))}
      hint={isAr ? 'املأ ١ إلى حجم الشبكة دون تكرار، واحترم عمليات الأقفاص.' : 'Fill 1 to grid size with no repeats, and satisfy each cage clue.'}
    >
      <KenKenGrid
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
