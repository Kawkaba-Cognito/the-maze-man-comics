import React, { useEffect, useRef, useState } from 'react';
import { TrainingMenuBar, TrainingPlayHeader } from '../../training/shared/TrainingChrome';
import GridSizePicker, { PuzzleToolbar } from './GridSizePicker';
import PuzzleOnboardingLayer from './PuzzleOnboardingLayer';
import { PuzzleFrameContext } from './PuzzleFrameContext';
import { usePuzzlePlayState } from './usePuzzlePlayState';
import { TUTORIAL_UI } from './tutorialContent';
import { usePuzzleTutorial } from './usePuzzleTutorial';
import { useApp } from '../../../context/AppContext';
import { puzzleWinPoints } from '../../../lib/points';
import { makeTrialHint } from './useHint';

/** Hub + play shell for non-number puzzles (sliding, bridges, …). */
export default function PuzzleScreenFrame({
  puzzleId,
  config,
  isAr,
  t,
  playSfx,
  onBack,
  sizes,
  size,
  setSize,
  solved,
  elapsed,
  onNewGame,
  onAwardSizes,
  hubExtra,
  playExtra,
  subtitle,
  hintReveal,
  children,
}) {
  const [screen, setScreen] = useState('hub');
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { awardPoints } = useApp();
  const awardedRef = useRef(false);

  const tutorial = usePuzzleTutorial(puzzleId, isAr, {
    onStartGame: (n) => {
      setSize(n);
      onNewGame(n);
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
    if (trialMode || !solved) return;
    if (!awardedRef.current) {
      awardedRef.current = true;
      awardPoints(puzzleWinPoints(size, onAwardSizes ?? sizes));
    }
  }, [solved, size, awardPoints, trialMode, onAwardSizes, sizes]);

  useEffect(() => {
    if (!solved) awardedRef.current = false;
  }, [solved]);

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

  const handlePick = (n) => {
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

  const frameCtx = { onboarding, trialMode };

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
                <GridSizePicker t={t} isAr={isAr} sizes={sizes} onPick={handlePick} playSfx={playSfx} />
                {hubExtra}
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
          subtitle={trialMode ? practiceSub : (subtitle ?? t.gridLabel(size))}
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
          {children}
          {trialMode && practiceHint ? (
            <PuzzleToolbar t={t} playSfx={playSfx} hint={practiceHint} hintOnly />
          ) : null}
          {playExtra}
        </div>
        <PuzzleOnboardingLayer onboarding={onboarding} config={config} steps={steps} isAr={isAr} playSfx={playSfx} />
      </div>
    </PuzzleFrameContext.Provider>
  );
}

export function useBoardPuzzleTrial(state, setState) {
  const { activeState, setActiveState, trialMode, notifyAction } = usePuzzlePlayState(state, setState);
  return {
    trialMode,
    activeState,
    setActiveState,
    notifyAction,
  };
}
