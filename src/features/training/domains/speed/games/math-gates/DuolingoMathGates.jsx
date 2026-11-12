import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { Backspace, Check, Flame } from '@phosphor-icons/react';

const TOTAL_ROUNDS = 10;

// Generator for progressive mental math challenges
function generateMathFormula(round) {
  let a, b, op, expected;

  if (round <= 3) {
    // Basic Add / Sub
    op = Math.random() < 0.6 ? '+' : '-';
    if (op === '+') {
      a = Math.floor(Math.random() * 18) + 6;
      b = Math.floor(Math.random() * 15) + 5;
      expected = a + b;
    } else {
      expected = Math.floor(Math.random() * 20) + 5;
      b = Math.floor(Math.random() * 15) + 4;
      a = expected + b;
    }
  } else if (round <= 7) {
    // Multiplication or double-digit addition
    const pickOp = Math.random();
    if (pickOp < 0.55) {
      op = '×';
      a = Math.floor(Math.random() * 8) + 3; // 3 to 10
      b = Math.floor(Math.random() * 8) + 3; // 3 to 10
      expected = a * b;
    } else {
      op = Math.random() < 0.5 ? '+' : '-';
      if (op === '+') {
        a = Math.floor(Math.random() * 35) + 15;
        b = Math.floor(Math.random() * 30) + 12;
        expected = a + b;
      } else {
        expected = Math.floor(Math.random() * 30) + 10;
        b = Math.floor(Math.random() * 25) + 8;
        a = expected + b;
      }
    }
  } else {
    // Advanced: Division or fast multiplication
    const pickOp = Math.random();
    if (pickOp < 0.5) {
      op = '÷';
      b = Math.floor(Math.random() * 7) + 3; // divisor 3 to 9
      expected = Math.floor(Math.random() * 8) + 2; // quotient 2 to 9
      a = b * expected;
    } else {
      op = '×';
      a = Math.floor(Math.random() * 9) + 4;
      b = Math.floor(Math.random() * 9) + 4;
      expected = a * b;
    }
  }

  return { a, b, op, expected };
}

export default function DuolingoMathGates({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Current problem
  const currentFormula = useMemo(() => {
    return generateMathFormula(round);
  }, [round]);

  // Reset answer when round changes
  useEffect(() => {
    setUserAnswer('');
    setFeedback(null);
  }, [round]);

  // Handle number pad button clicks
  const handleDigit = useCallback((digit) => {
    playSfx?.('tap');
    setUserAnswer((prev) => {
      if (prev.length >= 4) return prev;
      return prev + digit;
    });
  }, [playSfx]);

  const handleDelete = useCallback(() => {
    playSfx?.('click');
    setUserAnswer((prev) => prev.slice(0, -1));
  }, [playSfx]);

  // Check the answer
  const handleSubmit = useCallback(() => {
    if (!userAnswer || feedback) return;

    const parsed = parseInt(userAnswer, 10);
    const isCorrect = parsed === currentFormula.expected;

    if (isCorrect) {
      playSfx?.('ding');
      const bonus = streak >= 3 ? 20 : 15;
      setScore((s) => s + bonus);
      setStreak((st) => st + 1);
      setFeedback({
        isCorrect: true,
        title: isAr ? 'حساب ذهني بارع! إجابة صحيحة' : 'Brilliant calculation! Correct',
        subtitle: isAr
          ? `${currentFormula.a} ${currentFormula.op} ${currentFormula.b} = ${currentFormula.expected} (+${bonus} XP)`
          : `${currentFormula.a} ${currentFormula.op} ${currentFormula.b} = ${currentFormula.expected} (+${bonus} XP)`,
      });
    } else {
      playSfx?.('error');
      setStreak(0);
      setFeedback({
        isCorrect: false,
        title: isAr ? 'ليست الإجابة الدقيقة' : 'Not quite right',
        subtitle: isAr
          ? `الناتج الصحيح: ${currentFormula.a} ${currentFormula.op} ${currentFormula.b} = ${currentFormula.expected}`
          : `Correct answer: ${currentFormula.a} ${currentFormula.op} ${currentFormula.b} = ${currentFormula.expected}`,
      });
    }
  }, [userAnswer, feedback, currentFormula, isAr, playSfx, streak]);

  // Keyboard support for desktop
  useEffect(() => {
    const onKeyDown = (e) => {
      if (feedback) {
        if (e.key === 'Enter') handleNextRound();
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [feedback, handleDigit, handleDelete, handleSubmit]);

  // Continue to next round from feedback drawer
  const handleNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      const finalXp = Math.max(score, 40);
      awardPoints?.(finalXp);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
    }
  };

  // Victory screen on finish
  if (isCompleted) {
    const accuracy = Math.round((score / (TOTAL_ROUNDS * 20)) * 100) || 85;
    return (
      <DuolingoVictoryScreen
        xpEarned={score}
        accuracy={Math.min(100, accuracy)}
        streak={streak}
        title={isAr ? 'عقل حاسوبي فائق!' : 'Mental Math Mastered!'}
        subtitle={
          isAr
            ? `اجتزت جميع بوابات الحساب السريع بدقة استثنائية!`
            : 'Super fast numeric processing under time pressure!'
        }
        onComplete={onBack}
      />
    );
  }

  const progress = (round / TOTAL_ROUNDS) * 100;

  return (
    <DuolingoGameShell
      progress={progress}
      streak={streak}
      onClose={onBack}
    >
      {/* Duolingo Prompt Card */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">🚀</div>
        <div className="duo-prompt-bubble">
          {isAr
            ? `المستوى ${round} من ${TOTAL_ROUNDS}: احسب النتيجة وافتح البوابة!`
            : `Round ${round} of ${TOTAL_ROUNDS}: Solve the formula to open the gate!`}
        </div>
      </div>

      {/* Main Math Gate Challenge Area */}
      <div className="duo-math-arena">
        {/* Math Formula Challenge Card */}
        <div className="duo-math-card">
          <div className="duo-math-expression" dir="ltr">
            {currentFormula.a} {currentFormula.op} {currentFormula.b} = ?
          </div>

          <div className={`duo-math-answer-box ${userAnswer ? 'has-val' : ''}`}>
            {userAnswer ? (
              <span>{userAnswer}</span>
            ) : (
              <span style={{ color: '#94a3b8', fontSize: 24 }}>
                {isAr ? 'أدخل النتيجة' : 'Type answer'}
              </span>
            )}
          </div>
        </div>

        {/* Chunky 3D Numeric Keypad */}
        <div className="duo-keypad-grid" dir="ltr">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              className="duo-keypad-btn"
              onClick={() => handleDigit(String(digit))}
              disabled={!!feedback}
            >
              {digit}
            </button>
          ))}

          {/* Delete Action */}
          <button
            type="button"
            className="duo-keypad-btn action-delete"
            onClick={handleDelete}
            disabled={!!feedback}
            aria-label={isAr ? 'حذف' : 'Delete'}
          >
            <Backspace size={26} weight="bold" />
          </button>

          {/* Zero */}
          <button
            type="button"
            className="duo-keypad-btn"
            onClick={() => handleDigit('0')}
            disabled={!!feedback}
          >
            0
          </button>

          {/* Submit Action */}
          <button
            type="button"
            className="duo-keypad-btn action-submit"
            onClick={handleSubmit}
            disabled={!!feedback || !userAnswer}
            aria-label={isAr ? 'تحقق' : 'Check'}
          >
            <Check size={26} weight="bold" />
          </button>
        </div>
      </div>

      {/* Instant Duolingo Feedback Drawer */}
      <DuolingoFeedbackDrawer
        isOpen={!!feedback}
        isCorrect={feedback?.isCorrect ?? false}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        onContinue={handleNextRound}
      />
    </DuolingoGameShell>
  );
}
