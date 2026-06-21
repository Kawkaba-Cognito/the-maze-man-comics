import React, { useEffect, useRef, useState } from 'react';
import { TrainingMenuBar, TrainingPlayHeader } from '../../training/shared/TrainingChrome';
import GridSizePicker, { PuzzleHint, PuzzleWinBanner, PuzzleToolbar } from './GridSizePicker';
import PuzzleOnboardingLayer from './PuzzleOnboardingLayer';
import { PuzzleFrameContext } from './PuzzleFrameContext';
import { usePuzzlePlayState } from './usePuzzlePlayState';
import { TUTORIAL_UI } from './tutorialContent';
import { usePuzzleTutorial } from './usePuzzleTutorial';
import { useApp } from '../../../context/AppContext';
import { puzzleWinPoints } from '../../../lib/points';
import { makeHint, makeTrialHint } from './useHint';

export function NumberPuzzleFrame({
  config,
  puzzleId,
  isAr,
  t,
  playSfx,
  onBack,
  sizes,
  size,
  setSize,
  state,
  solved,
  elapsed,
  newGame,
  hint,
  hintCfg,
  hintReveal,
  children,
  onReset,
}) {
  const [screen, setScreen] = useState('hub');
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { awardPoints, points, spendPoints } = useApp();
  const awardedRef = useRef(false);

  const tutorial = usePuzzleTutorial(puzzleId, isAr, {
    onStartGame: (n) => {
      setSize(n);
      newGame(n);
      setScreen('play');
    },
    onOnboardingComplete: () => setScreen('hub'),
  });

  const { steps, onboarding, startGame, openTutorial } = tutorial;
  const trialMode = onboarding.trialActive;

  const view =
    onboarding.phase === 'coached'
      ? 'play'
      : onboarding.phase === 'ready'
        ? 'hub'
        : screen;

  useEffect(() => {
    if (onboarding.phase === 'coached') {
      setScreen('play');
    } else if (onboarding.phase === 'ready') {
      setScreen('hub');
    }
  }, [onboarding.phase]);

  useEffect(() => {
    if (trialMode) return;
    if (solved && !awardedRef.current) {
      awardedRef.current = true;
      awardPoints(puzzleWinPoints(size, sizes));
    } else if (!solved) {
      awardedRef.current = false;
    }
  }, [solved, size, awardPoints, trialMode, sizes]);

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div
        className="ct-puzzle-hub-title"
        style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}
      >
        {isAr ? config.nameAr : config.name}
      </div>
    </>
  );

  const handlePickSize = (n) => {
    setSize(n);
    startGame(n);
  };

  const practiceHint = trialMode && hintReveal
    ? makeTrialHint({
        trialState: onboarding.trialState,
        setTrialState: onboarding.setTrialState,
        hintReveal,
        solved: false,
        isAr,
      })
    : null;

  const frameCtx = { onboarding, trialMode, applyCell: null };

  if (view === 'hub') {
    return (
      <PuzzleFrameContext.Provider value={frameCtx}>
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
                <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
                <GridSizePicker t={t} isAr={isAr} sizes={sizes} onPick={handlePickSize} playSfx={playSfx} />
              </>
            )}
          </div>
          <PuzzleOnboardingLayer onboarding={onboarding} config={config} steps={steps} isAr={isAr} playSfx={playSfx} />
        </div>
      </PuzzleFrameContext.Provider>
    );
  }

  const practiceSub = isAr ? 'تمرين موجّه — تلميحات مجانية' : 'Guided practice — free hints';

  return (
    <PuzzleFrameContext.Provider value={frameCtx}>
      <div className={`ct-puzzle-screen ct-puzzle-screen--play${trialMode ? ' ct-puzzle-screen--trial' : ''}`}>
        <TrainingPlayHeader
          isAr={isAr}
          title={isAr ? config.nameAr : config.name}
          subtitle={trialMode ? practiceSub : t.gridLabel(size)}
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
          {!trialMode ? <PuzzleHint>{hint}</PuzzleHint> : null}
          {children}
          {!trialMode ? (
            <div className="ct-puzzle-stats">
              <span>{t.time(elapsed)}</span>
            </div>
          ) : null}
          {trialMode && practiceHint ? (
            <PuzzleToolbar t={t} playSfx={playSfx} hint={practiceHint} hintOnly />
          ) : null}
          {!trialMode && !solved ? (
            <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(size)} onReset={onReset} hint={hintCfg} />
          ) : null}
          {!trialMode && solved ? (
            <PuzzleWinBanner
              t={t}
              elapsed={elapsed}
              playSfx={playSfx}
              onPlayAgain={() => newGame(size)}
              onChangeSize={() => setScreen('hub')}
            />
          ) : null}
        </div>
        <PuzzleOnboardingLayer onboarding={onboarding} config={config} steps={steps} isAr={isAr} playSfx={playSfx} />
      </div>
    </PuzzleFrameContext.Provider>
  );
}

/** Read trial grid state / handlers from NumberPuzzleFrame context. */
export function useNumberPuzzleGrid(state, setState, applyCell) {
  const { activeState, setActiveState, trialMode, notifyAction } = usePuzzlePlayState(state, setState);

  return {
    trialMode,
    gridState: activeState,
    gridSize: trialMode ? (activeState?.size ?? state?.size) : state?.size,
    onCellSelect(r, c, setSelected) {
      setSelected([r, c]);
      if (trialMode) notifyAction({ type: 'select', r, c });
    },
    onCellValue(n, selected) {
      if (!selected) return;
      const [r, c] = selected;
      if (trialMode) {
        notifyAction({ type: 'setCell', r, c, value: n });
      } else {
        setActiveState((s) => applyCell(s, r, c, n));
      }
    },
  };
}
