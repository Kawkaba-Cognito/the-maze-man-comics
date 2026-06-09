import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { NumberPad } from '../../shared/GridSizePicker';
import { makeHint } from '../../shared/useHint';
import { generateKenKen, isKenKenSolved, setKenKenCell, hintReveal } from './kenkenEngine';

const CONFIG = getPuzzle('kenken');
const SIZES = [4, 5, 6, 7];

export default function KenKenPuzzle({ onBack }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutorial = usePuzzleTutorial('kenken', isAr);
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

  // Win silently when the grid is complete and correct — no live feedback.
  useEffect(() => {
    if (state && isKenKenSolved(state)) {
      setSolved(true);
      playSfx('win');
    }
  }, [state, playSfx]);

  const cageById = useMemo(() => Object.fromEntries((state?.cages ?? []).map((c) => [c.id, c])), [state]);

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
      onReset={() => setState((s) => ({ ...s, player: Array.from({ length: s.size }, () => Array(s.size).fill(0)) }))}
      hint={isAr ? 'املأ ١ إلى حجم الشبكة دون تكرار، واحترم عمليات الأقفاص.' : 'Fill 1 to grid size with no repeats, and satisfy each cage clue.'}
      {...tutorial}
    >
      <div className="ct-puzzle-grid-wrap">
        <div className="ct-puzzle-grid ct-puzzle-grid--kenken" style={{ '--puzzle-grid-n': size }}>
          {state?.player.map((row, r) =>
            row.map((val, c) => {
              const cageId = state.cageMap[r][c];
              const cage = cageById[cageId];
              const leader = cage?.cells.reduce(
                (best, cell) => (cell[0] < best[0] || (cell[0] === best[0] && cell[1] < best[1]) ? cell : best),
                cage.cells[0],
              );
              const isLeader = leader?.[0] === r && leader?.[1] === c;
              const diff = (rr, cc) => rr < 0 || rr >= size || cc < 0 || cc >= size || state.cageMap[rr][cc] !== cageId;
              const edge = (cond) => (cond ? '2.5px solid #1a1208' : '1px solid rgba(26,18,8,0.16)');
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num ct-puzzle-cell--kenken${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}`}
                  disabled={solved}
                  style={{
                    borderTop: edge(diff(r - 1, c)),
                    borderBottom: edge(diff(r + 1, c)),
                    borderLeft: edge(diff(r, c - 1)),
                    borderRight: edge(diff(r, c + 1)),
                  }}
                  onClick={() => {
                    playSfx('click');
                    setSelected([r, c]);
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
        max={size}
        selected={selected}
        isAr={isAr}
        playSfx={playSfx}
        onPick={(n) => setState((s) => setKenKenCell(s, selected[0], selected[1], n))}
        onClear={() => setState((s) => setKenKenCell(s, selected[0], selected[1], 0))}
      />
    </NumberPuzzleFrame>
  );
}
