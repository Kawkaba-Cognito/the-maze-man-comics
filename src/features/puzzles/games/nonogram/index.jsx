import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { generateNonogram, nonogramLineCluesMatch, toggleNonogramCell } from './nonogramEngine';

const CONFIG = getPuzzle('nonogram');
const SIZES = [5, 10, 15];

export default function NonogramPuzzle({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutorial = usePuzzleTutorial('nonogram', isAr);
  const [size, setSize] = useState(5);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateNonogram(n, seed));
    setElapsed(0);
    setSolved(false);
  }, []);

  useEffect(() => {
    if (!state || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [state, solved]);

  useEffect(() => {
    if (state && nonogramLineCluesMatch(state)) {
      setSolved(true);
      playSfx('win');
    }
  }, [state, playSfx]);

  return (
    <NumberPuzzleFrame
      config={CONFIG}
      puzzleId="nonogram"
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
      onReset={() => setState((s) => ({ ...s, player: Array.from({ length: s.size }, () => Array(s.size).fill(false)) }))}
      hint={isAr ? 'الأرقام تخبرك بطول الكتل السوداء في كل صف وعمود.' : 'Clues show the lengths of filled blocks in each row and column.'}
      {...tutorial}
    >
      <div className="ct-nonogram-wrap" style={{ '--puzzle-grid-n': size }}>
        <div className="ct-nonogram-col-clues">
          {state?.colClues.map((clue, c) => <div key={c} className="ct-nonogram-clue ct-nonogram-clue--col">{clue.join(' ')}</div>)}
        </div>
        <div className="ct-nonogram-body">
          <div className="ct-nonogram-row-clues">
            {state?.rowClues.map((clue, r) => <div key={r} className="ct-nonogram-clue ct-nonogram-clue--row">{clue.join(' ')}</div>)}
          </div>
          <div className="ct-puzzle-grid ct-puzzle-grid--nonogram" style={{ '--puzzle-grid-n': size }}>
            {state?.player.map((row, r) =>
              row.map((filled, c) => (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={`ct-puzzle-cell ct-puzzle-cell--nono${filled ? ' ct-puzzle-cell--filled' : ''}`}
                  disabled={solved}
                  onClick={() => {
                    playSfx('click');
                    setState((s) => toggleNonogramCell(s, r, c));
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </NumberPuzzleFrame>
  );
}
