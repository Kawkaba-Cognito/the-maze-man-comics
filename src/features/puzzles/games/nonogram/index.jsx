import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../../context/AppContext';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { randomSeed } from '../../shared/rng';
import { NumberPuzzleFrame } from '../../shared/NumberPuzzleFrame';
import { usePuzzlePlayState } from '../../shared/usePuzzlePlayState';
import { makeHint } from '../../shared/useHint';
import { FILLED, MARK, generateNonogram, nonogramLineCluesMatch, setNonogramCell, hintReveal } from './nonogramEngine';

const CONFIG = getPuzzle('nonogram');
const SIZES = [5, 8, 10];

function NonogramBoard({ state, setState, size, solved, mode, setMode, playSfx, isAr }) {
  const { activeState, trialMode, notifyAction } = usePuzzlePlayState(state, setState);
  const active = activeState;
  const gridSize = active?.size ?? size;

  if (!active) return null;

  return (
    <>
      <div className="ct-puzzle-grid-wrap">
        <div className={`ct-nonogram-board ct-nonogram-board--n${gridSize}`} style={{ '--puzzle-grid-n': gridSize }}>
          <div className="ct-nonogram-top">
            <div className="ct-nonogram-corner" aria-hidden="true" />
            <div className="ct-nonogram-col-clues">
              {active.colClues.map((clue, c) => (
                <div key={c} className="ct-nonogram-clue ct-nonogram-clue--col">
                  {(clue.length ? clue : [0]).map((n, i) => (
                    <span key={i} className="ct-nonogram-clue-n">{n}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="ct-nonogram-play">
            <div className="ct-nonogram-row-clues">
              {active.rowClues.map((clue, r) => (
                <div key={r} className="ct-nonogram-clue ct-nonogram-clue--row">
                  {(clue.length ? clue : [0]).map((n, i) => (
                    <span key={i} className="ct-nonogram-clue-n">{n}</span>
                  ))}
                </div>
              ))}
            </div>
            <div className={`ct-puzzle-grid ct-puzzle-grid--nonogram ct-puzzle-grid--n${gridSize}`} style={{ '--puzzle-grid-n': gridSize }}>
              {active.player.map((row, r) =>
                row.map((cell, c) => (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`ct-puzzle-cell ct-puzzle-cell--nono${cell === FILLED ? ' ct-puzzle-cell--filled' : ''}${cell === MARK ? ' ct-puzzle-cell--marked' : ''}`}
                    disabled={solved && !trialMode}
                    onClick={() => {
                      playSfx('click');
                      if (trialMode) notifyAction({ type: 'setCell', r, c, mode });
                      else setState((s) => setNonogramCell(s, r, c, mode));
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
      {!solved || trialMode ? (
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
    </>
  );
}

export default function NonogramPuzzle({ onBack }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const [size, setSize] = useState(5);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const [mode, setMode] = useState('fill');

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
    if (!state) return;
    if (nonogramLineCluesMatch(state)) {
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
      hintCfg={makeHint({ points, spendPoints, solved, state, setState, hintReveal })}
      hintReveal={hintReveal}
      onReset={() => setState((s) => ({ ...s, player: Array.from({ length: s.size }, () => Array(s.size).fill(0)) }))}
      hint={isAr ? 'الأرقام تخبرك بطول الكتل السوداء في كل صف وعمود.' : 'Clues show the lengths of filled blocks in each row and column.'}
    >
      <NonogramBoard
        state={state}
        setState={setState}
        size={size}
        solved={solved}
        mode={mode}
        playSfx={playSfx}
        isAr={isAr}
        setMode={setMode}
      />
    </NumberPuzzleFrame>
  );
}
