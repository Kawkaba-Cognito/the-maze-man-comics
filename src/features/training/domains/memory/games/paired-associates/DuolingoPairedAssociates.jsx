import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { PAIR_OBJECTS } from './palData.js';

const TOTAL_ROUNDS = 3;

// Icons mapping for pair objects
const OBJECT_ICONS = {
  'pocket-watch': '⏱️',
  'ornate-key': '🗝️',
  'lantern': '🏮',
  'feather': '🪶',
  'hourglass': '⏳',
  'compass': '🧭',
  'seashell': '🐚',
  'storybook': '📖',
  'crown': '👑',
  'teacup': '☕',
  'maple-leaf': '🍁',
  'gemstone': '💎',
};

export default function DuolingoPairedAssociates({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Match-Up selection state
  const [selectedLeft, setSelectedLeft] = useState(null); // id of selected left card
  const [selectedRight, setSelectedRight] = useState(null); // id of selected right card
  const [matchedIds, setMatchedIds] = useState(new Set()); // Set of matched object ids
  const [errorPair, setErrorPair] = useState(null); // { leftId, rightId } during error shake

  // Pairs for this round
  const roundPairs = useMemo(() => {
    // Round 1: 4 pairs, Round 2: 5 pairs, Round 3: 6 pairs
    const count = round === 1 ? 4 : (round === 2 ? 5 : 6);
    const startIdx = ((round - 1) * 3) % PAIR_OBJECTS.length;
    const items = [];
    for (let i = 0; i < count; i++) {
      items.push(PAIR_OBJECTS[(startIdx + i) % PAIR_OBJECTS.length]);
    }
    return items;
  }, [round]);

  // Scrambled left and right columns
  const leftColumn = useMemo(() => {
    return [...roundPairs].sort(() => Math.random() - 0.5);
  }, [roundPairs]);

  const rightColumn = useMemo(() => {
    return [...roundPairs].sort(() => Math.random() - 0.5);
  }, [roundPairs]);

  // Reset when round changes
  useEffect(() => {
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedIds(new Set());
    setErrorPair(null);
    setFeedback(null);
  }, [round]);

  // Execute matching check when both sides are selected
  const checkMatch = useCallback((leftId, rightId) => {
    if (leftId === rightId) {
      // Correct Match!
      playSfx?.('ding');
      setStreak((s) => s + 1);
      setScore((sc) => sc + 10);
      setMatchedIds((prev) => {
        const next = new Set(prev);
        next.add(leftId);
        return next;
      });
      setSelectedLeft(null);
      setSelectedRight(null);
    } else {
      // Mismatch!
      playSfx?.('error');
      setErrorPair({ leftId, rightId });
      setTimeout(() => {
        setErrorPair(null);
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 450);
    }
  }, [playSfx]);

  // Handle tap on Left Card
  const handleTapLeft = useCallback((item) => {
    if (matchedIds.has(item.id) || errorPair) return;
    playSfx?.('tap');

    if (selectedRight) {
      // Right is already selected, test match!
      setSelectedLeft(item.id);
      checkMatch(item.id, selectedRight);
    } else {
      setSelectedLeft(item.id === selectedLeft ? null : item.id);
    }
  }, [matchedIds, errorPair, selectedRight, selectedLeft, checkMatch, playSfx]);

  // Handle tap on Right Card
  const handleTapRight = useCallback((item) => {
    if (matchedIds.has(item.id) || errorPair) return;
    playSfx?.('tap');

    if (selectedLeft) {
      // Left is already selected, test match!
      setSelectedRight(item.id);
      checkMatch(selectedLeft, item.id);
    } else {
      setSelectedRight(item.id === selectedRight ? null : item.id);
    }
  }, [matchedIds, errorPair, selectedLeft, selectedRight, checkMatch, playSfx]);

  // Detect when all pairs are matched
  useEffect(() => {
    if (roundPairs.length > 0 && matchedIds.size === roundPairs.length && !feedback) {
      setFeedback({
        isCorrect: true,
        title: isAr ? 'أحسنت! طابقت جميع الأزواج بنجاح' : 'All Pairs Matched!',
        subtitle: isAr ? `+${roundPairs.length * 10} نقطة خبرة · تركيز وربط ذاكرة رائع 🔥` : `+${roundPairs.length * 10} XP · Exceptional associative pairing!`,
      });
    }
  }, [matchedIds, roundPairs, feedback, isAr]);

  const handleNextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      awardPoints?.(50);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
    }
  }, [round, awardPoints]);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={50}
        accuracy={100}
        streak={streak}
        title={isAr ? 'أتقنت مطابقة الأزواج المترافقة!' : 'Match-Up Master!'}
        subtitle={isAr ? 'قوة ربط ذاكرة واقتران مفاهيم استثنائية!' : 'Outstanding paired associative memory and visual binding!'}
        onComplete={onBack}
      />
    );
  }

  const matchedCount = matchedIds.size;
  const progressPercent = ((round - 1) / TOTAL_ROUNDS) * 100 + (matchedCount / roundPairs.length) * (100 / TOTAL_ROUNDS);

  return (
    <DuolingoGameShell
      progress={progressPercent}
      streak={streak}
      onClose={onBack}
    >
      {/* Duolingo Prompt Card */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">⚡</div>
        <div className="duo-prompt-bubble">
          {isAr ? (
            <>
              المطابقة السريعة: اضغط على كل بطاقة وما يطابقها في العمود المقابل! ({matchedCount}/{roundPairs.length})
            </>
          ) : (
            <>
              Tap matching pairs across the two columns to connect them! ({matchedCount}/{roundPairs.length})
            </>
          )}
        </div>
      </div>

      {/* Match-Up Grid Area */}
      <div className="duo-matchup-container">
        <div className="duo-matchup-grid">
          {/* Column A (Left) */}
          <div className="duo-matchup-col">
            {leftColumn.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedLeft === item.id;
              const isWrong = errorPair?.leftId === item.id;

              return (
                <button
                  key={`left-${item.id}`}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleTapLeft(item)}
                  className={`duo-match-card ${isSelected ? 'is-selected' : ''} ${isMatched ? 'is-matched' : ''} ${isWrong ? 'is-wrong' : ''}`}
                >
                  <span style={{ fontSize: 24 }}>{OBJECT_ICONS[item.id] || '✨'}</span>
                  <span>{isAr ? item.ar : item.en}</span>
                  {isMatched && (
                    <span style={{ position: 'absolute', insetInlineEnd: 10, fontSize: 16 }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Column B (Right) */}
          <div className="duo-matchup-col">
            {rightColumn.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedRight === item.id;
              const isWrong = errorPair?.rightId === item.id;

              return (
                <button
                  key={`right-${item.id}`}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleTapRight(item)}
                  className={`duo-match-card ${isSelected ? 'is-selected' : ''} ${isMatched ? 'is-matched' : ''} ${isWrong ? 'is-wrong' : ''}`}
                >
                  <span>{isAr ? item.en : item.ar}</span>
                  {isMatched && (
                    <span style={{ position: 'absolute', insetInlineEnd: 10, fontSize: 16 }}>
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sliding Feedback Drawer */}
      <DuolingoFeedbackDrawer
        isOpen={Boolean(feedback)}
        isCorrect={feedback?.isCorrect}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        buttonLabel={
          isAr
            ? (round === TOTAL_ROUNDS ? 'عرض النتيجة' : 'المستوى التالي')
            : (round === TOTAL_ROUNDS ? 'View Results' : 'Next Level')
        }
        onContinue={handleNextRound}
      />
    </DuolingoGameShell>
  );
}
