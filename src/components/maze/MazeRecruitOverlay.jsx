import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useApp } from '../../context/AppContext';
import { recruit, recordAttempt, markGone, MAX_ATTEMPTS, attemptsUsed } from '../../features/army/armyState';
import { getRecruitSpec, powerStars } from '../../features/campaign/recruitSpec';
import RecruitPuzzle from '../../features/puzzles/recruit/RecruitPuzzle';

/**
 * In-maze recruitment duel — single-screen layout, no scrolling.
 */
export default function MazeRecruitOverlay({ challenge, floorId, onClose, onRefreshFloor }) {
  const { currentLang, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const spec = getRecruitSpec({ soldier: challenge, floorId });
  const [remaining, setRemaining] = useState(spec.timeLimitSec);
  const [phase, setPhase] = useState('play');
  const resolvedRef = useRef(false);

  const att = attemptsUsed(challenge.id);
  const stars = powerStars(challenge.power);

  useEffect(() => {
    if (phase !== 'play') return undefined;
    if (remaining <= 0) {
      setPhase('timeout');
      return undefined;
    }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000);
    return () => clearInterval(id);
  }, [phase, remaining]);

  useEffect(() => {
    if (phase !== 'timeout' || resolvedRef.current) return;
    resolvedRef.current = true;
    playSfx('error');
    const used = recordAttempt(challenge.id);
    if (used >= MAX_ATTEMPTS) markGone(challenge.id);
    const t = setTimeout(onClose, 2200);
    return () => clearTimeout(t);
  }, [phase, challenge.id, playSfx, onClose]);

  const finishWin = () => {
    if (resolvedRef.current || phase !== 'play') return;
    resolvedRef.current = true;
    setPhase('won');
    recruit({ id: challenge.id, name: challenge.name, power: challenge.power });
    playSfx('win');
    setTimeout(() => {
      onRefreshFloor?.();
      onClose();
    }, 1400);
  };

  const giveUp = () => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    playSfx('error');
    const used = recordAttempt(challenge.id);
    if (used >= MAX_ATTEMPTS) markGone(challenge.id);
    onClose();
  };

  const pct = Math.max(0, (remaining / spec.timeLimitSec) * 100);
  const urgent = remaining <= 10 && phase === 'play';

  const statusLine = phase === 'won'
    ? (isAr ? '✓ انضمّ!' : '✓ Recruited!')
    : phase === 'timeout'
      ? (isAr ? '✗ انتهى الوقت!' : '✗ Time\'s up!')
      : spec.targetScore
        ? (isAr ? `الهدف ${spec.targetScore} نقطة` : `Target ${spec.targetScore} pts`)
        : (isAr ? `شبكة ${spec.size}×${spec.size}` : `${spec.size}×${spec.size} grid`);

  return (
    <div className="mz-rec-overlay mz-rec-overlay--fit" role="dialog" aria-modal="true">
      <div className="mz-rec-backdrop" aria-hidden="true" />

      <div className={`mz-rec mz-rec--fit${urgent ? ' mz-rec--urgent' : ''}`} data-puzzle={spec.puzzleKey}>
        <header className="mz-rec-head">
          <div className="mz-rec-head-left">
            <span className="mz-rec-k">{isAr ? '⚔️ تحدي' : '⚔️ DUEL'}</span>
            <span className="mz-rec-name">{challenge.name}</span>
          </div>
          <div className="mz-rec-head-right">
            <span className={`mz-rec-clock${urgent ? ' mz-rec-clock--urgent' : ''}`}>{remaining}s</span>
            <span className="mz-rec-att-inline">{stars} · {att}/{MAX_ATTEMPTS}</span>
          </div>
        </header>

        <div className="mz-rec-timer">
          <div
            className="mz-rec-timer-fill"
            style={{ width: `${pct}%`, background: urgent ? 'linear-gradient(90deg,#ff6a5a,#ffaa40)' : undefined }}
          />
        </div>

        <p className="mz-rec-instr mz-rec-instr--compact">{statusLine}</p>

        <div className="mz-rec-body mz-rec-body--fit">
          <Suspense fallback={<div className="mz-rec-loading">{isAr ? '…' : '…'}</div>}>
            <RecruitPuzzle spec={spec} onSolved={finishWin} frozen={phase !== 'play'} />
          </Suspense>
        </div>

        {phase === 'play' && (
          <footer className="mz-rec-foot">
            <button type="button" className="mz-rec-close mz-rec-close--compact" onClick={giveUp}>
              {isAr ? 'انسحاب' : 'Retreat'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
