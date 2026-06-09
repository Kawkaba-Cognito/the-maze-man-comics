import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  generateCrowns, cycleCrownCell, resetCrowns, isCrownsSolved, crownConflicts, REGION_COLORS, hintReveal,
} from './crownsEngine';

const CONFIG = getPuzzle('crowns');
const PUZZLE_ID = 'crowns';
const SOLVE_POINTS = 20;

const SIZE_HINTS = {
  en: { 5: 'Warm-up', 6: 'Classic', 7: 'Tricky', 8: 'Expert' },
  ar: { 5: 'إحماء', 6: 'كلاسيكي', 7: 'صعب', 8: 'خبير' },
};

export default function CrownsPuzzle({ onBack }) {
  const { currentLang, playSfx, awardPoints, points, spendPoints } = useApp();
  const isAr = currentLang === 'ar';
  const t = PUZZLE_UI[isAr ? 'ar' : 'en'];
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const { tutorialOpen, steps, openTutorial, closeTutorial, maybeShowTutorial } = usePuzzleTutorial(PUZZLE_ID, isAr);

  const [screen, setScreen] = useState('hub');
  const [size, setSize] = useState(null);
  const [state, setState] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [solved, setSolved] = useState(false);

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
    if (state && !solved && isCrownsSolved(state)) {
      setSolved(true);
      playSfx('win');
      awardPoints(SOLVE_POINTS);
    }
  }, [state, solved, playSfx, awardPoints]);

  useEffect(() => { if (screen === 'play') maybeShowTutorial(); }, [screen, maybeShowTutorial]);

  const conflicts = useMemo(() => (state ? crownConflicts(state) : new Set()), [state]);

  const pickSize = (n) => { setSize(n); newGame(n); setScreen('play'); };

  const hubCenter = (
    <>
      <div className="ct-puzzle-hub-kicker">{t.hubTag}</div>
      <div className="ct-puzzle-hub-title" style={{ fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive" }}>
        {isAr ? CONFIG.nameAr : CONFIG.name}
      </div>
    </>
  );

  if (screen === 'hub') {
    return (
      <div className="ct-puzzle-screen ct-puzzle-screen--hub">
        <TrainingMenuBar onBack={onBack} playSfx={playSfx} center={hubCenter} hubSpaced variant="paper"
          onReplayTutorial={openTutorial} replayHint={tutLabels.replayTutorial} />
        <div className="ct-puzzle-hub-body">
          <p className="ct-puzzle-hub-sub">{t.pickGridSub}</p>
          <GridSizePicker t={t} isAr={isAr} sizes={CONFIG.sizes} onPick={pickSize} playSfx={playSfx}
            hintForSize={(n) => SIZE_HINTS[isAr ? 'ar' : 'en'][n]} />
        </div>
        {tutorialOpen ? <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} /> : null}
      </div>
    );
  }

  const n = state.n;
  return (
    <div className="ct-puzzle-screen ct-puzzle-screen--play">
      <TrainingPlayHeader isAr={isAr} title={isAr ? CONFIG.nameAr : CONFIG.name} subtitle={t.gridLabel(size)}
        onMenu={() => setScreen('hub')} onTutorial={openTutorial} tutorialAriaLabel={tutLabels.howToPlay}
        playSfx={playSfx} menuAriaLabel={t.menu} />
      <div className="ct-puzzle-play-body">
        <PuzzleHint>
          {isAr
            ? 'اضغط للتبديل: فارغ ← × ← 👑. تاجٌ واحد لكل صف وعمود ولون، ولا تاجان متجاوران.'
            : 'Tap to cycle: empty → × → 👑. One crown per row, column & color — and no two crowns touch.'}
        </PuzzleHint>
        <div className="ct-crowns-wrap">
          <div className="ct-crowns-grid" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
            {state.player.map((row, r) =>
              row.map((val, c) => {
                const reg = state.region[r][c];
                const diff = (rr, cc) => rr < 0 || rr >= n || cc < 0 || cc >= n || state.region[rr][cc] !== reg;
                const bw = (cond) => (cond ? '2.5px' : '1px');
                const bc = (cond) => (cond ? '#1a1208' : 'rgba(26,18,8,0.18)');
                const isBad = conflicts.has(`${r},${c}`);
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    className="ct-crowns-cell"
                    disabled={solved}
                    onClick={() => { playSfx('click'); setState((s) => cycleCrownCell(s, r, c)); }}
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
        <div className="ct-puzzle-stats"><span>{t.time(elapsed)}</span></div>
        {!solved ? (
          <PuzzleToolbar t={t} playSfx={playSfx} onNew={() => newGame(size)} onReset={() => setState((s) => resetCrowns(s))}
            hint={makeHint({ points, spendPoints, solved, state, setState, hintReveal })} />
        ) : (
          <PuzzleWinBanner t={t} elapsed={elapsed} playSfx={playSfx}
            onPlayAgain={() => newGame(size)} onChangeSize={() => setScreen('hub')} />
        )}
      </div>
      {tutorialOpen ? <PuzzleTutorial steps={steps} isAr={isAr} onClose={closeTutorial} playSfx={playSfx} /> : null}
    </div>
  );
}
