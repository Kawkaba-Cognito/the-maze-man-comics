import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { getCuratedRushHourLevel } from './curated-levels';
import { getRange, isWon } from './engine';

const TOTAL_LEVELS = 3;

export default function DuolingoRushHour({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [levelIndex, setLevelIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedPieceId, setSelectedPieceId] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Load level configuration
  const levelData = useMemo(() => {
    const diffs = ['easy', 'easy', 'medium'];
    const lvs = [1, 3, 5];
    const diff = diffs[levelIndex % diffs.length];
    const lv = lvs[levelIndex % lvs.length];
    return getCuratedRushHourLevel(diff, lv) || getCuratedRushHourLevel('easy', 1);
  }, [levelIndex]);

  // Initialize or reset pieces
  const initBoard = useCallback(() => {
    if (levelData?.pieces) {
      setPieces(levelData.pieces.map((p) => ({ ...p })));
      setMoves(0);
      setSelectedPieceId(null);
      setFeedback(null);
    }
  }, [levelData]);

  useEffect(() => {
    initBoard();
  }, [initBoard]);

  // Selected piece
  const selectedPiece = useMemo(() => {
    return pieces.find((p) => p.id === selectedPieceId) || null;
  }, [pieces, selectedPieceId]);

  // Check victory condition
  useEffect(() => {
    if (pieces.length && levelData && !feedback) {
      if (isWon(pieces, levelData.grid, levelData.exitRow)) {
        playSfx?.('ding');
        setStreak((s) => s + 1);
        const earned = Math.max(10, 30 - moves * 2);
        setScore((sc) => sc + earned);
        setFeedback({
          isCorrect: true,
          title: isAr ? 'حرّرت المسار بنجاح! 🚀' : 'Escape route cleared! 🚀',
          subtitle: isAr
            ? `أنهيت المستوى في ${moves} حركات (الهدف المثالي: ${levelData.par})`
            : `Cleared in ${moves} moves (Par: ${levelData.par})`,
        });
      }
    }
  }, [feedback, isAr, levelData, moves, pieces, playSfx]);

  // Move selected piece along its valid axis
  const handleMovePiece = useCallback(
    (delta) => {
      if (!selectedPiece || feedback) return;

      const { lo, hi } = getRange(selectedPiece, pieces, levelData.grid);
      let newCol = selectedPiece.col;
      let newRow = selectedPiece.row;

      if (selectedPiece.dir === 'h') {
        const targetCol = selectedPiece.col + delta;
        if (targetCol >= lo && targetCol <= hi) {
          newCol = targetCol;
        } else {
          playSfx?.('error');
          return;
        }
      } else {
        const targetRow = selectedPiece.row + delta;
        if (targetRow >= lo && targetRow <= hi) {
          newRow = targetRow;
        } else {
          playSfx?.('error');
          return;
        }
      }

      if (newCol !== selectedPiece.col || newRow !== selectedPiece.row) {
        playSfx?.('tap');
        setMoves((m) => m + 1);
        setPieces((prev) =>
          prev.map((p) =>
            p.id === selectedPiece.id ? { ...p, col: newCol, row: newRow } : p
          )
        );
      }
    },
    [feedback, levelData.grid, pieces, playSfx, selectedPiece]
  );

  const handleSelectPiece = (pieceId) => {
    if (feedback) return;
    playSfx?.('tap');
    setSelectedPieceId(pieceId);
  };

  const handleContinue = () => {
    if (levelIndex + 1 >= TOTAL_LEVELS) {
      awardPoints?.(score);
      setIsCompleted(true);
    } else {
      setLevelIndex((prev) => prev + 1);
    }
  };

  const progressPercent = Math.round(((levelIndex + (feedback ? 1 : 0)) / TOTAL_LEVELS) * 100);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={score + 30}
        accuracy={100}
        streak={streak}
        title={isAr ? 'خبير هروب القطع!' : 'Block Escape Master!'}
        subtitle={
          isAr
            ? 'تخطيط مكاني وتنبؤ متسلسل عالي الدقة.'
            : 'Exceptional forward-planning and spatial problem solving.'
        }
        onComplete={onBack}
      />
    );
  }

  const cellSize = 100 / (levelData?.grid || 6);

  return (
    <DuolingoGameShell progress={progressPercent} streak={streak} onClose={onBack}>
      <div className="duo-rushhour-container" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Mascot Prompt */}
        <div className="duo-prompt-card">
          <span className="duo-prompt-mascot">🤖</span>
          <div className="duo-prompt-bubble">
            {isAr
              ? `المستوى (${levelIndex + 1}/${TOTAL_LEVELS}) · حرّك المركبة البرتقالية ⚡ نحو المخرج الأخضر`
              : `Level (${levelIndex + 1}/${TOTAL_LEVELS}) · Clear a path for the hero vehicle ⚡ to exit`}
          </div>
        </div>

        {/* Moves & Level Pill Header */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="duo-level-pill">
            <span>{isAr ? `الحركات: ${moves}` : `Moves: ${moves}`}</span>
          </div>
          <button
            type="button"
            className="duo-level-pill"
            onClick={initBoard}
            style={{ color: '#ff7800' }}
          >
            {isAr ? 'إعادة المحاولة ↺' : 'Reset ↺'}
          </button>
        </div>

        {/* 6x6 3D Vehicle Grid Arena */}
        <div className="duo-rushhour-board-wrap">
          {/* Background Grid Cells */}
          <div className="duo-rushhour-grid-bg">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="duo-rushhour-cell" />
            ))}
          </div>

          {/* Exit Target Marker on Row 2 */}
          <div className="duo-rushhour-exit-marker">
            ➔
          </div>

          {/* 3D Dynamic Vehicles */}
          {pieces.map((p) => {
            const isHero = p.isHero;
            const isSelected = p.id === selectedPieceId;
            const isTruck = p.len === 3;

            const widthPercent = p.dir === 'h' ? p.len * cellSize : cellSize;
            const heightPercent = p.dir === 'v' ? p.len * cellSize : cellSize;
            const topPercent = p.row * cellSize;
            const leftPercent = p.col * cellSize;

            let vehicleTypeClass = isHero
              ? 'is-hero'
              : isTruck
              ? 'is-truck'
              : 'is-car';

            return (
              <div
                key={p.id}
                className={`duo-rushhour-vehicle ${vehicleTypeClass}`}
                onClick={() => handleSelectPiece(p.id)}
                style={{
                  top: `calc(${topPercent}% + 3px)`,
                  left: `calc(${leftPercent}% + 3px)`,
                  width: `calc(${widthPercent}% - 6px)`,
                  height: `calc(${heightPercent}% - 6px)`,
                  outline: isSelected ? '3.5px solid #2586f7' : 'none',
                  outlineOffset: '2px',
                }}
              >
                {!isHero && <div className="duo-rushhour-vehicle-decor" />}
              </div>
            );
          })}
        </div>

        {/* Tactile Direct Movement Controls for Selected Vehicle */}
        {selectedPiece && (
          <div className="duo-rushhour-controls">
            {selectedPiece.dir === 'h' ? (
              <>
                <button
                  type="button"
                  className="duo-3d-btn"
                  style={{
                    background: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderBottom: '4px solid #cbd5e1',
                    padding: '12px 24px',
                    fontSize: 20,
                  }}
                  onClick={() => handleMovePiece(-1)}
                >
                  ◀ {isAr ? 'يسار' : 'Left'}
                </button>
                <button
                  type="button"
                  className="duo-3d-btn"
                  style={{
                    background: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderBottom: '4px solid #cbd5e1',
                    padding: '12px 24px',
                    fontSize: 20,
                  }}
                  onClick={() => handleMovePiece(1)}
                >
                  {isAr ? 'يمين' : 'Right'} ▶
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="duo-3d-btn"
                  style={{
                    background: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderBottom: '4px solid #cbd5e1',
                    padding: '12px 24px',
                    fontSize: 20,
                  }}
                  onClick={() => handleMovePiece(-1)}
                >
                  ▲ {isAr ? 'أعلى' : 'Up'}
                </button>
                <button
                  type="button"
                  className="duo-3d-btn"
                  style={{
                    background: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderBottom: '4px solid #cbd5e1',
                    padding: '12px 24px',
                    fontSize: 20,
                  }}
                  onClick={() => handleMovePiece(1)}
                >
                  ▼ {isAr ? 'أسفل' : 'Down'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Feedback Drawer */}
        <DuolingoFeedbackDrawer
          isOpen={!!feedback}
          isCorrect={feedback?.isCorrect}
          title={feedback?.title}
          subtitle={feedback?.subtitle}
          onContinue={handleContinue}
        />
      </div>
    </DuolingoGameShell>
  );
}
