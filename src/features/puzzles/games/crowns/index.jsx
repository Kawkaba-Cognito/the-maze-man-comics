import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  generateCrowns, cycleCrownCell, resetCrowns, isCrownsSolved, crownConflicts, REGION_COLORS, hintReveal,
} from './crownsEngine';
import { puzzleWinPoints } from '../../../../lib/points';

const CONFIG = getPuzzle('crowns');
const PUZZLE_ID = 'crowns';

const SIZE_HINTS = {
  en: { 5: 'Warm-up', 6: 'Classic', 7: 'Tricky', 8: 'Expert' },
  ar: { 5: 'إحماء', 6: 'كلاسيكي', 7: 'صعب', 8: 'خبير' },
};

export default function CrownsPuzzle({ onBack }) {
  const { currentLang, playSfx, awardPoints, points, spendPoints } = useApp();
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

  const newGame = useCallback((n, seed = randomSeed()) => {
    setState(generateCrowns(n, seed));
    setElapsed(0);
    setSolved(false);
  }, []);

  useEffect(() => {
    if (screen !== 'play' || solved) return undefined;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [screen, solved]);

  useEffect(() => {
    if (trialMode || !state || solved || !isCrownsSolved(state)) return;
    setSolved(true);
    playSfx('win');
    awardPoints(puzzleWinPoints(size, CONFIG.sizes));
  }, [state, solved, size, playSfx, awardPoints, trialMode]);

  useEffect(() => {
    if (onboarding.phase === 'coached') setScreen('play');
    else if (onboarding.phase === 'ready') setScreen('hub');
  }, [onboarding.phase]);

  const conflicts = useMemo(() => (displayState ? crownConflicts(displayState) : new Set()), [displayState]);

  const pickSize = (n) => {
    setSize(n);
    startGame(n);
  };

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div className="ct-puzzle-hub-title" style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}>
        {isAr ? CONFIG.nameAr : CONFIG.name}
      </div>
    </>
  );

  if (view === 'hub') {
    return (
      <div className="ct-puzzle-screen ct-puzzle-screen--hub">
        <TrainingMenuBar onBack={onBack} playSfx={playSfx} center={hubCenter} hubSpaced variant="paper"
          onReplayTutorial={openTutorial} replayHint={tutLabels.replayTutorial} />
        <div className="ct-puzzle-hub-body">
          {onboarding.shouldRun || onboarding.phase === 'ready' ? (
            <p className="ct-puzzle-hub-sub">
              {isAr ? 'أكمل الدليل والتمرين لاختيار حجم الشبكة.' : 'Complete the tutorial and practice to choose your grid size.'}
            </p>
          ) : (
            <>
              <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
              <GridSizePicker t={t} isAr={isAr} sizes={CONFIG.sizes} onPick={pickSize} playSfx={playSfx}
                hintForSize={(n) => SIZE_HINTS[isAr ? 'ar' : 'en'][n]} />
            </>
          )}
        </div>
        <PuzzleOnboardingLayer onboarding={onboarding} config={CONFIG} steps={steps} isAr={isAr} playSfx={playSfx} />
      </div>
    );
  }

  const practiceSub = isAr ? 'تمرين موجّه — تلميحات مجانية' : 'Guided practice — free hints';
  const n = displayState?.n ?? size;

  return (
    <div className={`ct-puzzle-screen ct-puzzle-screen--play${trialMode ? ' ct-puzzle-screen--trial' : ''}`}>
      <TrainingPlayHeader isAr={isAr} title={isAr ? CONFIG.nameAr : CONFIG.name}
        subtitle={trialMode ? practiceSub : t.gridLabel(size)}
        onMenu={() => { if (trialMode) onboarding.skipTrials(); else setScreen('hub'); }} onTutorial={openTutorial} tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx} menuAriaLabel={t.menu} />
      <div className="ct-puzzle-play-body">
        {!trialMode ? (
          <PuzzleHint>
            {isAr
              ? 'اضغط للتبديل: فارغ ← × ← 👑. تاجٌ واحد لكل صف وعمود ولون، ولا تاجان متجاوران.'
              : 'Tap to cycle: empty → × → 👑. One crown per row, column & color — and no two crowns touch.'}
          </PuzzleHint>
        ) : null}
        {displayState ? (
          <div className="ct-crowns-wrap">
            <div className="ct-crowns-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
              {displayState.player.map((row, r) =>
                row.map((val, c) => {
                  const reg = displayState.region[r][c];
                  const diff = (rr, cc) => rr < 0 || rr >= n || cc < 0 || cc >= n || displayState.region[rr][cc] !== reg;
                  const bw = (cond) => (cond ? '2.5px' : '1px');
                  const bc = (cond) => (cond ? '#1a1208' : 'rgba(26,18,8,0.18)');
                  const isBad = conflicts.has(`${r},${c}`);
                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      className="ct-crowns-cell"
                      disabled={solved && !trialMode}
                      onClick={() => {
                        playSfx('click');
                        if (trialMode) onboarding.applyTrialAction({ type: 'cycle', r, c });
                        else setState((s) => cycleCrownCell(s, r, c));
                      }}
                      style={{
                        background: REGION_COLORS[reg % REGION_COLORS.length],
                        borderTop: `${bw(diff(r - 1, c))} solid ${bc(diff(r - 1, c))}`,
                        borderBottom: `${bw(diff(r + 1, c))} solid ${bc(diff(r + 1, c))}`,
                        borderLeft: `${bw(diff(r, c - 1))} solid ${bc(diff(r, c - 1))}`,
                        borderRight: `${bw(diff(r, c + 1))} solid ${bc(diff(r, c + 1))}`,
                      }}
                    >
                      {val === 2 ? (
                        <span className={`ct-crowns-mark ct-crowns-crown${isBad ? ' is-bad' : ''}`}>👑</span>
                      ) : val === 1 ? (
                        <span className="ct-crowns-mark ct-crowns-x">×</span>
                      ) : ''}
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
            <div className="ct-puzzle-stats"><span>{t.time(elapsed)}</span></div>
            {!solved ? (
              <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(size)} onReset={() => setState((s) => resetCrowns(s))}
                hint={makeHint({ points, spendPoints, solved, state, setState, hintReveal })} />
            ) : (
              <PuzzleWinBanner t={t} elapsed={elapsed} playSfx={playSfx}
                onPlayAgain={() => newGame(size)} onChangeSize={() => setScreen('hub')} />
            )}
          </>
        ) : null}
      </div>
      <PuzzleOnboardingLayer onboarding={onboarding} config={CONFIG} steps={steps} isAr={isAr} playSfx={playSfx} />
    </div>
  );
}
