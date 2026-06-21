import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader } from '../../../training/shared/TrainingChrome';
import { getPuzzle } from '../../registry';
import { PUZZLE_UI } from '../../shared/puzzleStrings';
import { TUTORIAL_UI } from '../../shared/tutorialContent';
import { randomSeed } from '../../shared/rng';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from '../../shared/GridSizePicker';
import PuzzleOnboardingLayer from '../../shared/PuzzleOnboardingLayer';
import { usePuzzleTutorial } from '../../shared/usePuzzleTutorial';
import { useOnboardingPlayState } from '../../shared/useOnboardingPlayState';
import { makeHint, makeTrialHint } from '../../shared/useHint';
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

export default function BridgesPuzzle({ onBack, onSolved }) {
  const { currentLang, playSfx, awardPoints, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { steps, onboarding, startGame, openTutorial } = usePuzzleTutorial(PUZZLE_ID, isAr, {
    onStartGame: (n) => {
      setSize(n);
      newGame(n);
      setScreen('play');
    },
    onOnboardingComplete: () => setScreen('hub'),
  });

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
  const [selected, setSelected] = useState(null);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);
  const { trialMode, displayState } = useOnboardingPlayState(state, setState, onboarding);
  const view =
    onboarding.phase === 'coached'
      ? 'play'
      : onboarding.phase === 'ready'
        ? 'hub'
        : screen;
  const practiceHint = trialMode
    ? makeTrialHint({
        trialState: onboarding.trialState,
        setTrialState: onboarding.setTrialState,
        hintReveal,
        solved: false,
        isAr,
      })
    : null;

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
    if (trialMode || !state || solved || !isBridgesSolved(state)) return;
    setSolved(true);
    onSolved?.();
    setSelected(null);
    playSfx('win');
    awardPoints(puzzleWinPoints(size, CONFIG.sizes));
  }, [state, solved, size, playSfx, awardPoints, trialMode, onSolved]);

  useEffect(() => {
    if (onboarding.phase === 'coached') {
      setScreen('play');
    } else if (onboarding.phase === 'ready') {
      setScreen('hub');
    }
  }, [onboarding.phase]);

  const onIslandTap = useCallback(
    (id) => {
      if (solved || !displayState) return;
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
      if (findEdgeIndex(displayState, selected, id) < 0) {
        setSelected(id);
        playSfx('click');
        return;
      }
      if (trialMode) {
        onboarding.applyTrialAction({ type: 'bridge', from: selected, to: id });
        setSelected(null);
        playSfx('click');
        return;
      }
      const next = cycleBridgeByIslands(displayState, selected, id);
      setSelected(null);
      if (next === displayState) {
        playSfx('error');
        return;
      }
      setState(next);
      setMoves((m) => m + 1);
      playSfx('click');
    },
    [displayState, selected, solved, playSfx, trialMode, onboarding],
  );

  const pickTier = (n) => {
    setSize(n);
    startGame(n);
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

  if (view === 'hub') {
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
          {onboarding.shouldRun || onboarding.phase === 'ready' ? (
            <p className="ct-puzzle-hub-sub">
              {isAr ? 'أكمل الدليل والتمرين لاختيار حجم الشبكة.' : 'Complete the tutorial and practice to choose your grid size.'}
            </p>
          ) : (
            <>
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
            </>
          )}
        </div>
        <PuzzleOnboardingLayer onboarding={onboarding} config={CONFIG} steps={steps} isAr={isAr} playSfx={playSfx} />
      </div>
    );
  }

  const practiceSub = isAr ? 'تمرين موجّه — تلميحات مجانية' : 'Guided practice — free hints';

  return (
    <div className={`ct-puzzle-screen ct-puzzle-screen--play${trialMode ? ' ct-puzzle-screen--trial' : ''}`}>
      <TrainingPlayHeader
        isAr={isAr}
        title={isAr ? CONFIG.nameAr : CONFIG.name}
        subtitle={trialMode ? practiceSub : (displayState ? tierSubtitle(displayState, isAr) : t.gridLabel(size))}
        onMenu={() => {
          if (trialMode) onboarding.skipTrials();
          else setScreen('hub');
        }}
        onTutorial={openTutorial}
        tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx}
        menuAriaLabel={t.menu}
      />
      <div className="ct-puzzle-play-body">
        {!trialMode ? (
          <PuzzleHint>
            {isAr
              ? 'اضغط جزيرة ثم جارتها لإضافة جسر (اضغط ثانيةً لجسرٍ مزدوج). الأرقام = عدد الجسور.'
              : 'Tap an island, then a neighbour to add a bridge (tap again for a double). Numbers = bridge count.'}
          </PuzzleHint>
        ) : null}
        {displayState ? (
          <BridgesBoard state={displayState} selected={selected} solved={solved && !trialMode} onIslandTap={onIslandTap} />
        ) : null}
        {trialMode && practiceHint ? (
          <PuzzleToolbar t={t} playSfx={playSfx} hint={practiceHint} hintOnly />
        ) : null}
        {!trialMode ? (
          <>
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
          </>
        ) : null}
      </div>
      <PuzzleOnboardingLayer onboarding={onboarding} config={CONFIG} steps={steps} isAr={isAr} playSfx={playSfx} />
    </div>
  );
}
