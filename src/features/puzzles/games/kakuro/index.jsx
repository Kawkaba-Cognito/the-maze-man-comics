import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { NumberPad } from '../../shared/GridSizePicker';
import { generateKakuro, isKakuroSolved, kakuroHasConflict, setKakuroCell } from './kakuroEngine';

const CONFIG = getPuzzle('kakuro');
const SIZES = [7, 9];

export default function KakuroPuzzle({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutorial = usePuzzleTutorial('kakuro', isAr);
  const [size, setSize] = useState(7);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState(null);

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateKakuro(n, seed));
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
    if (isKakuroSolved(state)) {
      setSolved(true);
      setError(false);
      playSfx('win');
    } else {
      setError(kakuroHasConflict(state));
    }
  }, [state, playSfx]);

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
      onReset={() => setState((s) => ({ ...s, player: s.board.map((row) => row.map((cell) => (cell.block ? null : 0))) }))}
      hint={isAr ? 'املأ ١-٩. مجموع كل مسار يطابق الرقم ولا تكرار داخله.' : 'Fill 1-9. Each run must match its clue sum with no repeats.'}
      {...tutorial}
    >
      <div className="ct-puzzle-grid-wrap">
        <div className="ct-puzzle-grid ct-puzzle-grid--kakuro" style={{ '--puzzle-grid-n': size }}>
          {state?.board.map((row, r) =>
            row.map((cell, c) => {
              if (cell.block) {
                return (
                  <div key={`${r}-${c}`} className="ct-puzzle-cell ct-puzzle-cell--kakuro-block">
                    {(cell.down || cell.across) ? (
                      <span className="ct-kakuro-clue">
                        {cell.down ? <b>{cell.down}</b> : null}
                        {cell.across ? <i>{cell.across}</i> : null}
                      </span>
                    ) : null}
                  </div>
                );
              }
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--num ct-puzzle-cell--kakuro${selected?.[0] === r && selected?.[1] === c ? ' ct-puzzle-cell--selected' : ''}${error ? ' ct-puzzle-cell--err-soft' : ''}`}
                  disabled={solved}
                  onClick={() => {
                    playSfx('click');
                    setSelected([r, c]);
                  }}
                >
                  {state.player[r][c] || ''}
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
        onPick={(n) => setState((s) => setKakuroCell(s, selected[0], selected[1], n))}
        onClear={() => setState((s) => setKakuroCell(s, selected[0], selected[1], 0))}
      />
      {error ? <p className="ct-puzzle-error">{isAr ? 'يوجد تكرار في مسار' : 'A run has a repeat'}</p> : null}
    </NumberPuzzleFrame>
  );
}
