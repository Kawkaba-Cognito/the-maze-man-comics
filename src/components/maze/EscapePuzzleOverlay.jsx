import React, { useRef, useState, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import RecruitPuzzle from '../../features/puzzles/recruit/RecruitPuzzle';

/**
 * Escape-room lock puzzle. Renders one of the puzzle games (via RecruitPuzzle)
 * and, on solve, fires onSolved back into the room so it can open the lock.
 * Deliberately separate from MazeRecruitOverlay — no army / attempts / timer,
 * just "solve it or retreat" (on-brand: no fail-clock).
 */
export default function EscapePuzzleOverlay({ spec, title, onSolved, onClose }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const [phase, setPhase] = useState('play');
  const resolvedRef = useRef(false);

  const finishWin = () => {
    if (resolvedRef.current || phase !== 'play') return;
    resolvedRef.current = true;
    setPhase('won');
    playSfx('win');
    setTimeout(() => { onSolved?.(); onClose?.(); }, 1000);
  };

  const retreat = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    playSfx('click');
    onClose?.();
  };

  return (
    <div className="mz-rec-overlay mz-rec-overlay--fit" role="dialog" aria-modal="true">
      <div className="mz-rec-backdrop" aria-hidden="true" />

      <div className="mz-rec mz-rec--fit" data-puzzle={spec.puzzleKey}>
        <header className="mz-rec-head">
          <div className="mz-rec-head-left">
            <span className="mz-rec-k">{isAr ? '🔒 قفل' : '🔒 LOCK'}</span>
            <span className="mz-rec-name">{title}</span>
          </div>
        </header>

        <p className="mz-rec-instr mz-rec-instr--compact">
          {phase === 'won'
            ? (isAr ? '✓ فُتح القفل!' : '✓ Lock opened!')
            : (isAr ? 'حلّ اللغز لفتح القفل' : 'Solve the puzzle to open the lock')}
        </p>

        <div className="mz-rec-body mz-rec-body--fit">
          <Suspense fallback={<div className="mz-rec-loading">…</div>}>
            <RecruitPuzzle spec={spec} onSolved={finishWin} frozen={phase !== 'play'} />
          </Suspense>
        </div>

        {phase === 'play' && (
          <footer className="mz-rec-foot">
            <button type="button" className="mz-rec-close mz-rec-close--compact" onClick={retreat}>
              {isAr ? 'تراجع' : 'Retreat'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
