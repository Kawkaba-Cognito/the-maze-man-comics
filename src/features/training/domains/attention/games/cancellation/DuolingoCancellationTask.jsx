import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { Sparkle, SlidersHorizontal, Check, X, Star } from '@phosphor-icons/react';

// Distinct Cosmic/Symbol Tokens for Cancellation Scan
const ALL_SYMBOLS = ['⭐', '⚡', '☄️', '🚀', '💎', '🎯', '🔥', '🌀', '🔮', '🛡️', '🪐', '👾'];

const TOTAL_ROUNDS = 5;

// Difficulty configurations
const DIFFICULTY_CONFIG = {
  easy: {
    gridSize: 3,
    totalCells: 9,
    minTargets: 2,
    maxTargets: 3,
    labelEn: 'Easy',
    labelAr: 'سهل',
    badge: '3×3',
    descriptionAr: 'شبكة 3×3 مصغرة للبحث السريع وتنشيط الانتباه الأولي.',
    descriptionEn: '3x3 quick scan grid for fast target acquisition.',
    color: '#58cc02',
    accent: '#46a302',
  },
  medium: {
    gridSize: 4,
    totalCells: 16,
    minTargets: 3,
    maxTargets: 5,
    labelEn: 'Medium',
    labelAr: 'متوسط',
    badge: '4×4',
    descriptionAr: 'شبكة 4×4 قياسية لاختبار الانتباه الانتقائي وكبح المشتتات.',
    descriptionEn: '4x4 standard grid for selective visual attention.',
    color: '#ff7800',
    accent: '#d95f00',
  },
  hard: {
    gridSize: 5,
    totalCells: 25,
    minTargets: 5,
    maxTargets: 8,
    labelEn: 'Hard',
    labelAr: 'متقدم',
    badge: '5×5',
    descriptionAr: 'شبكة 5×5 كثيفة تتطلب تركيزاً بصرياً عالياً وتثبيطاً دقيقاً.',
    descriptionEn: '5x5 dense grid demanding intense visual search & suppression.',
    color: '#2586f7',
    accent: '#106ad6',
  },
};

export default function DuolingoCancellationTask({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [difficulty, setDifficulty] = useState('medium');
  const [level, setLevel] = useState(1);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [checkedRound, setCheckedRound] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: bool, title: string, subtitle: string }

  const currentCfg = DIFFICULTY_CONFIG[difficulty];

  // Target symbol for the current round
  const targetSymbol = useMemo(() => {
    const symbolOffset = (level - 1) * 2 + (round - 1);
    return ALL_SYMBOLS[symbolOffset % ALL_SYMBOLS.length];
  }, [level, round]);

  // Generate grid cells based on selected difficulty & level
  const gridCells = useMemo(() => {
    const distractors = ALL_SYMBOLS.filter((s) => s !== targetSymbol);
    const countRange = currentCfg.maxTargets - currentCfg.minTargets + 1;
    const targetCount = currentCfg.minTargets + ((round + level) % countRange);
    const cells = [];

    for (let i = 0; i < targetCount; i++) {
      cells.push({ id: `t-${i}`, symbol: targetSymbol, isTarget: true });
    }
    for (let i = targetCount; i < currentCfg.totalCells; i++) {
      const randDistractor = distractors[Math.floor(Math.random() * distractors.length)];
      cells.push({ id: `d-${i}`, symbol: randDistractor, isTarget: false });
    }

    // Shuffle
    return cells.sort(() => Math.random() - 0.5);
  }, [currentCfg, level, round, targetSymbol]);

  // Reset selections when round changes
  useEffect(() => {
    setSelectedIndices(new Set());
    setCheckedRound(false);
    setFeedback(null);
  }, [round, difficulty, level]);

  const handleToggleCell = useCallback((index) => {
    if (checkedRound) return; // Prevent change after checking

    // Tactile sound & device haptic
    playSfx?.('tap');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, [checkedRound, playSfx]);

  // Check the answer when user presses "Check" button
  const handleCheckRound = useCallback(() => {
    if (checkedRound) return;
    setCheckedRound(true);

    const targetIndices = new Set();
    gridCells.forEach((c, idx) => {
      if (c.isTarget) targetIndices.add(idx);
    });

    let correctCount = 0;
    let falseAlarms = 0;

    selectedIndices.forEach((idx) => {
      if (targetIndices.has(idx)) {
        correctCount++;
      } else {
        falseAlarms++;
      }
    });

    const isFlawless = correctCount === targetIndices.size && falseAlarms === 0;

    if (isFlawless) {
      playSfx?.('ding');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
      setStreak((s) => s + 1);
      setScore((sc) => sc + 10);
      setFeedback({
        isCorrect: true,
        title: isAr ? 'ممتاز! عثرت على جميع الأهداف' : 'Spot on! All targets found!',
        subtitle: isAr ? `+10 نقاط خبرة · سلسلة حماسة ${streak + 1} 🔥` : `+10 XP · Streak ${streak + 1} 🔥`,
      });
    } else {
      playSfx?.('error');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
      setFeedback({
        isCorrect: false,
        title: isAr ? 'فاتك بعض الرموز أو حددت مشتتات' : 'Missed targets or clicked distractors',
        subtitle: isAr ? `المستهدف كان (${targetSymbol}) فقط` : `Target was (${targetSymbol}) only`,
      });
    }
  }, [checkedRound, gridCells, isAr, playSfx, selectedIndices, streak, targetSymbol]);

  const handleNextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      const earnedXp = difficulty === 'hard' ? 75 : difficulty === 'medium' ? 50 : 35;
      awardPoints?.(earnedXp);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
    }
  }, [round, difficulty, awardPoints]);

  const handleSelectDifficulty = (newDiff) => {
    playSfx?.('click');
    setDifficulty(newDiff);
    setLevel(1);
    setRound(1);
    setStreak(0);
    setScore(0);
    setIsLevelModalOpen(false);
  };

  const handleSelectLevel = (newLevel) => {
    playSfx?.('click');
    setLevel(newLevel);
    setRound(1);
    setScore(0);
    setIsLevelModalOpen(false);
  };

  if (isCompleted) {
    const baseXp = difficulty === 'hard' ? 75 : difficulty === 'medium' ? 50 : 35;
    return (
      <DuolingoVictoryScreen
        xpEarned={baseXp}
        accuracy={Math.round((score / (TOTAL_ROUNDS * 10)) * 100) || 90}
        streak={streak}
        title={isAr ? 'أتقنت مهمة الإلغاء والشطب!' : 'Cancellation Task Mastered!'}
        subtitle={isAr ? `أداء استثنائي في المستوى ${level} (${currentCfg.labelAr})!` : `Outstanding performance on Level ${level} (${currentCfg.labelEn})!`}
        onComplete={onBack}
      />
    );
  }

  const progressPercent = ((round - 1) / TOTAL_ROUNDS) * 100;

  return (
    <DuolingoGameShell
      progress={progressPercent}
      streak={streak}
      onClose={onBack}
      headerSlot={
        <button
          type="button"
          className="duo-level-pill"
          onClick={() => {
            playSfx?.('click');
            setIsLevelModalOpen(true);
          }}
          title={isAr ? 'تغيير المستوى والصعوبة' : 'Select Level & Difficulty'}
        >
          <SlidersHorizontal size={15} weight="bold" />
          <span>
            {isAr ? `${currentCfg.labelAr} · م${level}` : `${currentCfg.labelEn} · L${level}`}
          </span>
        </button>
      }
    >
      {/* Duolingo Prompt Card with Mascot Speech */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">🎯</div>
        <div className="duo-prompt-bubble">
          {isAr ? (
            <>
              حدد جميع رموز <span style={{ fontSize: 24, color: '#ff7800', margin: '0 4px', fontWeight: 900 }}>{targetSymbol}</span> في الشبكة ثم اضغط تحقق!
            </>
          ) : (
            <>
              Tap every <span style={{ fontSize: 24, color: '#ff7800', margin: '0 4px', fontWeight: 900 }}>{targetSymbol}</span> in the grid, then verify!
            </>
          )}
        </div>
      </div>

      {/* Tactile Stamp Grid with Responsive Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${currentCfg.gridSize}, 1fr)`,
          gap: currentCfg.gridSize === 5 ? 8 : 12,
          width: '100%',
          maxWidth: currentCfg.gridSize === 5 ? 440 : 380,
          margin: '0 auto 28px',
        }}
      >
        {gridCells.map((cell, idx) => {
          const isSelected = selectedIndices.has(idx);

          // Tactile state colors
          let borderColor = '#e5e5e5';
          let borderBottomColor = '#d0d0d0';
          let bgColor = '#ffffff';
          let shadow = 'none';

          if (isSelected) {
            borderColor = '#ff7800';
            borderBottomColor = '#d95f00';
            bgColor = '#fff7ed';
            shadow = '0 6px 16px rgba(255, 120, 0, 0.22)';
          }

          // In checked feedback state: highlight correct / mistake
          if (checkedRound) {
            if (cell.isTarget && isSelected) {
              borderColor = '#58cc02';
              borderBottomColor = '#46a302';
              bgColor = '#f0fff4';
            } else if (cell.isTarget && !isSelected) {
              // Missed target
              borderColor = '#ffc21c';
              borderBottomColor = '#e0a300';
              bgColor = '#fffbeb';
            } else if (!cell.isTarget && isSelected) {
              // False alarm
              borderColor = '#ff4b4b';
              borderBottomColor = '#ea2b2b';
              bgColor = '#fff1f2';
            }
          }

          return (
            <button
              key={`${difficulty}-${level}-${round}-${idx}`}
              type="button"
              onClick={() => handleToggleCell(idx)}
              style={{
                aspectRatio: '1 / 1',
                borderRadius: currentCfg.gridSize === 5 ? 14 : 18,
                background: bgColor,
                border: `3px solid ${borderColor}`,
                borderBottom: `5px solid ${borderBottomColor}`,
                boxShadow: shadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: currentCfg.gridSize === 5 ? 26 : 34,
                cursor: checkedRound ? 'default' : 'pointer',
                userSelect: 'none',
                position: 'relative',
                transform: isSelected ? 'translateY(2px)' : 'none',
                transition: 'all 0.08s ease',
              }}
            >
              {cell.symbol}

              {/* Status Indicator Icon on Checked */}
              {checkedRound && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background:
                      cell.isTarget && isSelected
                        ? '#58cc02'
                        : !cell.isTarget && isSelected
                        ? '#ff4b4b'
                        : cell.isTarget && !isSelected
                        ? '#ffc21c'
                        : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cell.isTarget && isSelected && <Check size={12} weight="bold" color="#fff" />}
                  {!cell.isTarget && isSelected && <X size={12} weight="bold" color="#fff" />}
                  {cell.isTarget && !isSelected && <Sparkle size={12} weight="bold" color="#fff" />}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Floating Bottom Verification CTA when drawer is closed */}
      {!feedback && (
        <button
          type="button"
          onClick={handleCheckRound}
          disabled={selectedIndices.size === 0}
          style={{
            width: '100%',
            maxWidth: 420,
            background: selectedIndices.size > 0 ? '#58cc02' : '#e5e5e5',
            color: selectedIndices.size > 0 ? '#ffffff' : '#afafaf',
            fontSize: 16,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: 16,
            borderRadius: 18,
            border: 'none',
            borderBottom: selectedIndices.size > 0 ? '5px solid #46a302' : '5px solid #cccccc',
            cursor: selectedIndices.size > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.1s ease',
          }}
        >
          {isAr ? 'تحقق من الإجابة' : 'Check'}
        </button>
      )}

      {/* Sliding Feedback Drawer */}
      <DuolingoFeedbackDrawer
        isOpen={Boolean(feedback)}
        isCorrect={feedback?.isCorrect}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        buttonLabel={
          isAr
            ? round === TOTAL_ROUNDS
              ? 'عرض النتيجة النهائية'
              : 'السؤال التالي'
            : round === TOTAL_ROUNDS
            ? 'View Results'
            : 'Next Question'
        }
        onContinue={handleNextRound}
      />

      {/* Level & Difficulty Selector Modal */}
      {isLevelModalOpen && (
        <div className="duo-modal-overlay" onClick={() => setIsLevelModalOpen(false)}>
          <div className="duo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="duo-modal-header">
              <h2 className="duo-modal-title">
                <SlidersHorizontal size={22} weight="bold" color="#ff7800" />
                <span>{isAr ? 'اختيار المستوى والصعوبة' : 'Select Level & Mode'}</span>
              </h2>
              <button
                type="button"
                className="duo-modal-close"
                onClick={() => setIsLevelModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Difficulty Tabs */}
            <div className="duo-difficulty-tabs">
              {['easy', 'medium', 'hard'].map((key) => {
                const cfg = DIFFICULTY_CONFIG[key];
                const active = difficulty === key;
                return (
                  <button
                    key={key}
                    type="button"
                    className={`duo-difficulty-tab ${active ? 'is-active' : ''}`}
                    onClick={() => handleSelectDifficulty(key)}
                  >
                    <div>{isAr ? cfg.labelAr : cfg.labelEn}</div>
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{cfg.badge}</div>
                  </button>
                );
              })}
            </div>

            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666', lineHeight: 1.4 }}>
              {isAr ? currentCfg.descriptionAr : currentCfg.descriptionEn}
            </p>

            {/* Level Selector 1 to 5 */}
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: '#2a1a16',
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{isAr ? 'اختر المرحلة:' : 'Select Stage:'}</span>
                <span style={{ color: currentCfg.color, fontWeight: 900 }}>
                  {isAr ? `${currentCfg.labelAr} (مرحلة ${level}/5)` : `${currentCfg.labelEn} (Stage ${level}/5)`}
                </span>
              </div>

              <div className="duo-level-grid">
                {[1, 2, 3, 4, 5].map((lvl) => {
                  const isActive = level === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      className={`duo-level-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleSelectLevel(lvl)}
                    >
                      <span>{lvl}</span>
                      <div className="duo-level-stars">
                        {'★'.repeat(Math.min(3, lvl))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </DuolingoGameShell>
  );
}
