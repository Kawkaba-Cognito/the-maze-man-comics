import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';

// Task Switch stimulus: Numbers 1-9 (excluding 5) in Red or Blue
// Rule 1: MAGNITUDE (Is number > 5?)
// Rule 2: PARITY (Is number EVEN or ODD?)
const NUMBERS = [1, 2, 3, 4, 6, 7, 8, 9];

const TOTAL_ROUNDS = 10;

export default function DuolingoTaskSwitch({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Switch rule: alternating or random
  // Top half: MAGNITUDE (Blue)
  // Bottom half: PARITY (Orange)
  const isMagnitudeRule = round % 2 === 1;

  const [currentNum, setCurrentNum] = useState(7);

  useEffect(() => {
    const rand = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
    setCurrentNum(rand);
    setFeedback(null);
  }, [round]);

  const handleAnswer = useCallback((chosenOption) => {
    let expectedOption = '';

    if (isMagnitudeRule) {
      // Greater than 5 vs Less than 5
      expectedOption = currentNum > 5 ? 'greater' : 'less';
    } else {
      // Even vs Odd
      expectedOption = currentNum % 2 === 0 ? 'even' : 'odd';
    }

    const isCorrect = chosenOption === expectedOption;

    if (isCorrect) {
      playSfx?.('ding');
      setStreak((s) => s + 1);
      setScore((sc) => sc + 10);
      setFeedback({
        isCorrect: true,
        title: isAr ? 'أحسنت! تبديل ذهني متقن' : 'Great switch!',
        subtitle: isMagnitudeRule
          ? (isAr ? `الرقم ${currentNum} هو ${expectedOption === 'greater' ? 'أكبر من 5' : 'أصغر من 5'}` : `${currentNum} is ${expectedOption === 'greater' ? '> 5' : '< 5'}`)
          : (isAr ? `الرقم ${currentNum} هو عدد ${expectedOption === 'even' ? 'زوجي' : 'فردي'}` : `${currentNum} is ${expectedOption.toUpperCase()}`),
      });
    } else {
      playSfx?.('error');
      setStreak(0);
      setFeedback({
        isCorrect: false,
        title: isAr ? 'انتبه لقاعدة المهمة الحالية!' : 'Check current active rule!',
        subtitle: isMagnitudeRule
          ? (isAr ? 'المطلوب كان تحديد: أكبر أم أصغر من 5؟' : 'Active task was: > 5 or < 5?')
          : (isAr ? 'المطلوب كان تحديد: زوجي أم فردي؟' : 'Active task was: Even or Odd?'),
      });
    }
  }, [currentNum, isMagnitudeRule, isAr, playSfx]);

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
        accuracy={Math.round((score / (TOTAL_ROUNDS * 10)) * 100) || 85}
        streak={streak}
        title={isAr ? 'أتقنت تبديل المهام!' : 'Task Switch Mastered!'}
        subtitle={isAr ? 'مرونة معرفية مذهلة في التبديل بين القواعد الحسابية!' : 'Incredible cognitive control and mental switching!'}
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
    >
      {/* Duolingo Rule Indicator */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: isMagnitudeRule ? '#2586f7' : '#ff7800',
          borderRadius: 22,
          padding: '16px 20px',
          color: '#ffffff',
          borderBottom: isMagnitudeRule ? '5px solid #1d4ed8' : '5px solid #d95f00',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
            {isMagnitudeRule ? (isAr ? 'المهمة 1: الحجم والمقدار' : 'TASK 1: MAGNITUDE') : (isAr ? 'المهمة 2: الفردي والزوجي' : 'TASK 2: PARITY')}
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, marginTop: 4 }}>
            {isMagnitudeRule ? (isAr ? 'هل الرقم أكبر أم أصغر من 5؟' : 'Is it Greater or Less than 5?') : (isAr ? 'هل الرقم زوجي أم فردي؟' : 'Is it Even or Odd?')}
          </div>
        </div>
        <div style={{ fontSize: 32 }}>{isMagnitudeRule ? '⚖️' : '🔢'}</div>
      </div>

      {/* Target Stimulus Card */}
      <div
        style={{
          width: 150,
          height: 150,
          borderRadius: 30,
          background: '#ffffff',
          border: '3px solid #e5e5e5',
          borderBottom: '6px solid #e5e5e5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 72,
          fontWeight: 900,
          color: isMagnitudeRule ? '#2586f7' : '#ff7800',
          margin: '0 auto 36px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
        }}
      >
        {currentNum}
      </div>

      {/* Chunky 2-Option Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
          width: '100%',
          maxWidth: 420,
          margin: '0 auto',
        }}
      >
        {isMagnitudeRule ? (
          <>
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => handleAnswer('less')}
              className="duo-action-btn"
              style={{
                height: 64,
                fontSize: 16,
                fontWeight: 900,
                color: '#2586f7',
                borderColor: '#bfdbfe',
                borderBottomColor: '#93c5fd',
              }}
            >
              {isAr ? 'أصغر من 5 ( < 5 )' : 'Less than 5 ( < 5 )'}
            </button>
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => handleAnswer('greater')}
              className="duo-action-btn"
              style={{
                height: 64,
                fontSize: 16,
                fontWeight: 900,
                color: '#2586f7',
                borderColor: '#bfdbfe',
                borderBottomColor: '#93c5fd',
              }}
            >
              {isAr ? 'أكبر من 5 ( > 5 )' : 'Greater than 5 ( > 5 )'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => handleAnswer('even')}
              className="duo-action-btn"
              style={{
                height: 64,
                fontSize: 16,
                fontWeight: 900,
                color: '#ff7800',
                borderColor: '#fed7aa',
                borderBottomColor: '#fdba74',
              }}
            >
              {isAr ? 'عدد زوجي (Even)' : 'Even Number'}
            </button>
            <button
              type="button"
              disabled={Boolean(feedback)}
              onClick={() => handleAnswer('odd')}
              className="duo-action-btn"
              style={{
                height: 64,
                fontSize: 16,
                fontWeight: 900,
                color: '#ff7800',
                borderColor: '#fed7aa',
                borderBottomColor: '#fdba74',
              }}
            >
              {isAr ? 'عدد فردي (Odd)' : 'Odd Number'}
            </button>
          </>
        )}
      </div>

      {/* Sliding Feedback Drawer */}
      <DuolingoFeedbackDrawer
        isOpen={Boolean(feedback)}
        isCorrect={feedback?.isCorrect}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        buttonLabel={isAr ? (round === TOTAL_ROUNDS ? 'عرض النتيجة' : 'المرحلة التالية') : (round === TOTAL_ROUNDS ? 'View Results' : 'Next Stage')}
        onContinue={handleNextRound}
      />
    </DuolingoGameShell>
  );
}
