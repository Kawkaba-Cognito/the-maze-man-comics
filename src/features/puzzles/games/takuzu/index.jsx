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
  generateTakuzu,
  cycleTakuzuCell,
  isTakuzuSolved,
  resetTakuzu,
  hintReveal,
} from './takuzuEngine';

const CONFIG = getPuzzle('takuzu');
const PUZZLE_ID = 'takuzu';

const SIZE_HINTS = {
  en: { 4: 'Quick & cozy', 6: 'Classic', 8: 'Big board', 10: 'Marathon' },
  ar: { 4: 'سريع ومريح', 6: 'كلاسيكي', 8: 'لوحة كبيرة', 10: 'ماراثون' },
};

export default function TakuzuPuzzle({ onBack, onSolved }) {
  const { currentLang, playSfx, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { steps, onboarding, startGame, openTutorial } = usePuzzleTutorial(PUZZLE_ID, isAr, {
    onStartGame: (n) => { setSize(n); newGame(n); setScreen('play'); },
    onOnboardingComplete: () => setScreen('hub'),
  });

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
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
    ? makeTrialHint({ trialState: onboarding.trialState, setTrialState: onboarding.setTrialState, hintReveal, solved: false, isAr })
    : null;

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
    if (trialMode || !state || !isTakuzuSolved(state)) return;
    setSolved(true);
    onSolved?.();
    playSfx('win');
  }, [state, playSfx, onSolved, trialMode]);

  useEffect(() => {
    if (onboarding.phase === 'coached') setScreen('play');
    else if (onboarding.phase === 'ready') setScreen('hub');
  }, [onboarding.phase]);

  const pickSize = (n) => {
    setSize(n);
    startGame(n);
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
              <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
              <GridSizePicker
                t={t}
                isAr={isAr}
                sizes={CONFIG.sizes}
                onPick={pickSize}
                playSfx={playSfx}
                hintForSize={(n) => SIZE_HINTS[isAr ? 'ar' : 'en'][n]}
              />
            </>
          )}
        </div>
        <PuzzleOnboardingLayer onboarding={onboarding} config={CONFIG} steps={steps} isAr={isAr} playSfx={playSfx} />
      </div>
    );
  }

  const practiceSub = isAr ? 'تمرين موجّه — تلميحات مجانية' : 'Guided practice — free hints';
  const gridSize = displayState?.size ?? size;

  return (
    <div className={`ct-puzzle-screen ct-puzzle-screen--play${trialMode ? ' ct-puzzle-screen--trial' : ''}`}>
      <TrainingPlayHeader
        isAr={isAr}
        title={isAr ? CONFIG.nameAr : CONFIG.name}
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
        {!trialMode ? <PuzzleHint>{t.takuzuHint}</PuzzleHint> : null}
        {displayState ? (
          <div className="ct-puzzle-grid-wrap">
            <div className={`ct-puzzle-grid ct-puzzle-grid--takuzu ct-puzzle-grid--n${gridSize}`} style={{ '--puzzle-grid-n': gridSize }}>
              {displayState.player.map((row, r) =>
                row.map((val, c) => {
                  const fixed = displayState.fixed[r][c];
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className={`ct-puzzle-cell ct-puzzle-cell--takuzu${
                        val === 0 ? ' ct-puzzle-cell--t0' : val === 1 ? ' ct-puzzle-cell--t1' : ''
                      }${fixed ? ' ct-puzzle-cell--takuzu-fixed' : ''}`}
                      disabled={(solved && !trialMode) || fixed}
                      onClick={() => {
                        playSfx('click');
                        if (trialMode) onboarding.applyTrialAction({ type: 'toggle', r, c });
                        else setState((s) => cycleTakuzuCell(s, r, c));
                      }}
                    >
                      {val == null ? '' : val}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
        {trialMode && practiceHint ? (
          <PuzzleToolbar t={t} playSfx={playSfx} hint={practiceHint} hintOnly />
        ) : null}
        {!trialMode ? (
          <>
            <div className="ct-puzzle-stats">
              <span>{t.time(elapsed)}</span>
            </div>
            {!solved ? (
              <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(size)} onReset={() => setState((s) => resetTakuzu(s))}
                hint={makeHint({ points, spendPoints, solved, state, setState, hintReveal })} />
            ) : (
              <PuzzleWinBanner
                t={t}
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
