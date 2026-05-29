import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader } from '../../../training/shared/TrainingChrome';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { TUTORIAL_UI } from '../../shared/tutorialContent';
import { randomSeed } from '../../shared/rng';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from '../../shared/GridSizePicker';
import PuzzleTutorial from '../../shared/PuzzleTutorial';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import {
  generateTakuzu,
  cycleTakuzuCell,
  isTakuzuSolved,
  resetTakuzu,
} from './takuzuEngine';

const CONFIG = getPuzzle('takuzu');
const PUZZLE_ID = 'takuzu';

const SIZE_HINTS = {
  en: { 4: 'Quick & cozy', 6: 'Classic', 8: 'Big board', 10: 'Marathon' },
  ar: { 4: 'سريع ومريح', 6: 'كلاسيكي', 8: 'لوحة كبيرة', 10: 'ماراثون' },
};

export default function TakuzuPuzzle({ onBack }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { tutorialOpen, steps, openTutorial, closeTutorial, maybeShowTutorial } =
    usePuzzleTutorial(PUZZLE_ID, isAr);

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);

  const newGame = useCallback((gridSize, seed = randomSeed()) => {
    setState(generateTakuzu(gridSize, seed));
    setElapsed(0);
    setSolved(false);
  }, []);

  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, solved]);

  // Win silently when the board is complete and correct — no live right/wrong
  // feedback while the player is filling cells.
  useEffect(() => {
    if (state && isTakuzuSolved(state)) {
      setSolved(true);
      playSfx('win');
    }
  }, [state, playSfx]);

  useEffect(() => {
    if (screen === 'play') maybeShowTutorial();
  }, [screen, maybeShowTutorial]);

  const pickSize = (n) => {
    setSize(n);
    newGame(n);
    setScreen('play');
  };

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div
        className="ct-puzzle-hub-title"
        style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}
      >
        {isAr ? CONFIG.nameAr : CONFIG.name}
      </div>
    </>
  );

  if (screen === 'hub') {
    return (
      <div className="ct-puzzle-screen ct-puzzle-screen--hub">
        <TrainingMenuBar
          onBack={onBack}
          playSfx={playSfx}
          center={hubCenter}
          hubSpaced
          variant="paper"
          onReplayTutorial={openTutorial}
          replayHint={tutLabels.replayTutorial}
        />
        <div className="ct-puzzle-hub-body">
          <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
          <GridSizePicker
            t={t}
            isAr={isAr}
            sizes={CONFIG.sizes}
            onPick={pickSize}
            playSfx={playSfx}
            hintForSize={(n) => SIZE_HINTS[isAr ? 'ar' : 'en'][n]}
          />
        </div>
        {tutorialOpen ? (
          <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader
        isAr={isAr}
        title={isAr ? CONFIG.nameAr : CONFIG.name}
        subtitle={t.gridLabel(size)}
        onMenu={() => setScreen('hub')}
        onTutorial={openTutorial}
        tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx}
        menuAriaLabel={t.menu}
      />
      <div className="ct-puzzle-play-body">
        <PuzzleHint>{t.takuzuHint}</PuzzleHint>
        <div className="ct-puzzle-grid-wrap">
          <div className={`ct-puzzle-grid ct-puzzle-grid--takuzu ct-puzzle-grid--n${size}`} style={{ '--puzzle-grid-n': size }}>
            {state.player.map((row, r) =>
              row.map((val, c) => {
                const fixed = state.fixed[r][c];
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className={`ct-puzzle-cell ct-puzzle-cell--takuzu${
                      val === 0 ? ' ct-puzzle-cell--t0' : val === 1 ? ' ct-puzzle-cell--t1' : ''
                    }${fixed ? ' ct-puzzle-cell--takuzu-fixed' : ''}`}
                    disabled={solved || fixed}
                    onClick={() => {
                      playSfx('click');
                      setState((s) => cycleTakuzuCell(s, r, c));
                    }}
                  >
                    {val == null ? '' : val}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <div className="ct-puzzle-stats">
          <span>{t.time(elapsed)}</span>
        </div>
        {!solved ? (
          <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(size)} onReset={() => setState((s) => resetTakuzu(s))} />
        ) : (
          <PuzzleWinBanner
            t={t}
            elapsed={elapsed}
            playSfx={playSfx}
            onPlayAgain={() => newGame(size)}
            onChangeSize={() => setScreen('hub')}
          />
        )}
      </div>
      {tutorialOpen ? (
        <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} />
      ) : null}
    </div>
  );
}
