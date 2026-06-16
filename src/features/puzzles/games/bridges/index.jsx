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
import { makeHint } from '../../shared/useHint';
import {
  generateBridges,
  isBridgesSolved,
  resetBridges,
  cycleBridgeByIslands,
  findEdgeIndex,
  hintReveal,
  tierSubtitle,
  BRIDGES_TIER_HINTS,
} from './bridgesEngine';
import BridgesBoard from './BridgesBoard';
import { puzzleWinPoints } from '../../../../lib/points';

const CONFIG = getPuzzle('bridges');
const PUZZLE_ID = 'bridges';

export default function BridgesPuzzle({ onBack }) {
  const { currentLang, playSfx, awardPoints, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { tutorialOpen, steps, openTutorial, closeTutorial, maybeShowTutorial } =
    usePuzzleTutorial(PUZZLE_ID, isAr);

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);

  const newGame = useCallback((tier, seed = randomSeed()) => {
    setState(generateBridges(tier, seed));
    setSelected(null);
    setMoves(0);
    setElapsed(0);
    setSolved(false);
  }, []);

  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, solved]);

  useEffect(() => {
    if (state && !solved && isBridgesSolved(state)) {
      setSolved(true);
      setSelected(null);
      playSfx('win');
      awardPoints(puzzleWinPoints(size, CONFIG.sizes));
    }
  }, [state, solved, size, playSfx, awardPoints]);

  useEffect(() => {
    if (screen === 'play') maybeShowTutorial();
  }, [screen, maybeShowTutorial]);

  const onIslandTap = useCallback(
    (id) => {
      if (solved) return;
      if (selected == null) {
        setSelected(id);
        playSfx('click');
        return;
      }
      if (selected === id) {
        setSelected(null);
        playSfx('click');
        return;
      }
      if (findEdgeIndex(state, selected, id) < 0) {
        // not an orthogonal neighbour — just move the selection
        setSelected(id);
        playSfx('click');
        return;
      }
      const next = cycleBridgeByIslands(state, selected, id);
      setSelected(null);
      if (next === state) {
        playSfx('error'); // blocked by a crossing bridge
        return;
      }
      setState(next);
      setMoves((m) => m + 1);
      playSfx('click');
    },
    [state, selected, solved, playSfx]
  );

  const pickTier = (n) => {
    setSize(n);
    newGame(n);
    setScreen('play');
  };

  const tierHints = BRIDGES_TIER_HINTS[isAr ? 'ar' : 'en'];

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
          <p className="ct-puzzle-hub-sub">
            {isAr
              ? 'صِل كل الجزر في شبكة واحدة — اختر الحجم للبدء.'
              : 'Link every island into one network — pick a size to start.'}
          </p>
          <GridSizePicker
            t={t}
            isAr={isAr}
            sizes={CONFIG.sizes}
            onPick={pickTier}
            playSfx={playSfx}
            hintForSize={(n) => tierHints[n]}
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
        subtitle={state ? tierSubtitle(state, isAr) : t.gridLabel(size)}
        onMenu={() => setScreen('hub')}
        onTutorial={openTutorial}
        tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx}
        menuAriaLabel={t.menu}
      />
      <div className="ct-puzzle-play-body">
        <PuzzleHint>
          {isAr
            ? 'اضغط جزيرة ثم جارتها لإضافة جسر (اضغط ثانيةً لجسرٍ مزدوج). الأرقام = عدد الجسور.'
            : 'Tap an island, then a neighbour to add a bridge (tap again for a double). Numbers = bridge count.'}
        </PuzzleHint>
        {state ? (
          <BridgesBoard state={state} selected={selected} solved={solved} onIslandTap={onIslandTap} />
        ) : null}
        <div className="ct-puzzle-stats">
          <span>{t.moves(moves)}</span>
          <span>{t.time(elapsed)}</span>
        </div>
        {!solved ? (
          <PuzzleToolbar
            t={t}
            playSfx={playSfx}
            onNew={() => newGame(size)}
            onReset={() => { setState((s) => (s ? resetBridges(s) : s)); setSelected(null); setMoves(0); }}
            hint={makeHint({ points, spendPoints, solved, state, setState, hintReveal })}
          />
        ) : (
          <PuzzleWinBanner
            t={t}
            moves={moves}
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
