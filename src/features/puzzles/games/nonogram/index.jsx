import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { FILLED, MARK, generateNonogram, nonogramLineCluesMatch, setNonogramCell } from './nonogramEngine';

const CONFIG = getPuzzle('nonogram');
const SIZES = [5, 8, 10];

export default function NonogramPuzzle({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutorial = usePuzzleTutorial('nonogram', isAr);
  const [size, setSize] = useState(5);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [mode, setMode] = useState('fill'); // 'fill' | 'mark'

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateNonogram(n, seed));
    setElapsed(0);
    setSolved(false);
    setMode('fill');
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
      onReset={() => setState((s) => ({ ...s, player: Array.from({ length: s.size }, () => Array(s.size).fill(0)) }))}
      hint={isAr ? 'الأرقام تخبرك بطول الكتل السوداء في كل صف وعمود.' : 'Clues show the lengths of filled blocks in each row and column.'}
      {...tutorial}
    >
      <div className="ct-puzzle-grid-wrap">
        <div className={`ct-nonogram-board ct-nonogram-board--n${size}`} style={{ '--puzzle-grid-n': size }}>
          <div className="ct-nonogram-top">
            <div className="ct-nonogram-corner" aria-hidden="true" />
            <div className="ct-nonogram-col-clues">
              {state?.colClues.map((clue, c) => (
                <div key={c} className="ct-nonogram-clue ct-nonogram-clue--col">{clue.join(' ')}</div>
              ))}
            </div>
          </div>
          <div className="ct-nonogram-play">
            <div className="ct-nonogram-row-clues">
              {state?.rowClues.map((clue, r) => (
                <div key={r} className="ct-nonogram-clue ct-nonogram-clue--row">{clue.join(' ')}</div>
              ))}
            </div>
            <div className={`ct-puzzle-grid ct-puzzle-grid--nonogram ct-puzzle-grid--n${size}`} style={{ '--puzzle-grid-n': size }}>
              {state?.player.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`ct-puzzle-cell ct-puzzle-cell--nono${cell === FILLED ? ' ct-puzzle-cell--filled' : ''}${cell === MARK ? ' ct-puzzle-cell--marked' : ''}`}
                    disabled={solved}
                    onClick={() => {
                      playSfx('click');
                      setState((s) => setNonogramCell(s, r, c, mode));
                    }}
                  >
                    {cell === MARK ? '✕' : ''}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {!solved ? (
        <div className="ct-nonogram-tools" role="group" aria-label={isAr ? 'الأداة' : 'Tool'}>
          <button
            type="button"
            className={`ct-puzzle-numkey ct-nonogram-tool${mode === 'fill' ? ' ct-nonogram-tool--active' : ''}`}
            onClick={() => { playSfx('click'); setMode('fill'); }}
          >
            <span className="ct-nonogram-tool-ic ct-nonogram-tool-ic--fill" aria-hidden="true" />
            {isAr ? 'تعبئة' : 'Fill'}
          </button>
          <button
            type="button"
            className={`ct-puzzle-numkey ct-nonogram-tool${mode === 'mark' ? ' ct-nonogram-tool--active' : ''}`}
            onClick={() => { playSfx('click'); setMode('mark'); }}
          >
            <span className="ct-nonogram-tool-ic ct-nonogram-tool-ic--mark" aria-hidden="true">✕</span>
            {isAr ? 'علامة' : 'Mark'}
          </button>
        </div>
      ) : null}
    </NumberPuzzleFrame>
  );
}
