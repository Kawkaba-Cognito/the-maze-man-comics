import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';

// Curated 5-letter words with helpful hints in AR & EN
const WORD_BANK = [
  {
    wordEn: 'ORBIT',
    hintEn: 'Curved path of a celestial object',
    wordAr: 'كواكب',
    hintAr: 'أجرام سماوية تدور حول النجوم',
  },
  {
    wordEn: 'COMET',
    hintEn: 'Cosmic snowball of frozen gases and rock',
    wordAr: 'نايزك',
    hintAr: 'أحجار فضائية تضيء سماء الليل',
  },
  {
    wordEn: 'SOLAR',
    hintEn: 'Radiant energy relating to the sun',
    wordAr: 'طاقات',
    hintAr: 'القدرة على بذل الشغل والتأثير',
  },
  {
    wordEn: 'BRAIN',
    hintEn: 'The neural powerhouse of thought',
    wordAr: 'معرفة',
    hintAr: 'إدراك الحقائق والمعلومات والعلوم',
  },
  {
    wordEn: 'LOGIC',
    hintEn: 'Reasoning conducted according to strict principles',
    wordAr: 'شجاعة',
    hintAr: 'الإقدام والثبات عند مواجهة التحديات',
  },
  {
    wordEn: 'SMART',
    hintEn: 'Having or showing quick intelligence',
    wordAr: 'ابتكر',
    hintAr: 'أوجد شيئاً جديداً بذكاء وإبداع',
  },
];

const MAX_GUESSES = 6;
const WORD_LENGTH = 5;

// Standard QWERTY & Arabic Layouts
const KEYBOARD_EN = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

const KEYBOARD_AR = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ENTER', 'ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'DEL'],
];

export default function DuolingoWordle({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [roundIndex, setRoundIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [rowShaking, setRowShaking] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRoundWon, setIsRoundWon] = useState(false);

  const currentItem = useMemo(() => {
    return WORD_BANK[roundIndex % WORD_BANK.length];
  }, [roundIndex]);

  const targetWord = useMemo(() => {
    return (isAr ? currentItem.wordAr : currentItem.wordEn).toUpperCase();
  }, [currentItem, isAr]);

  const hint = useMemo(() => {
    return isAr ? currentItem.hintAr : currentItem.hintEn;
  }, [currentItem, isAr]);

  // Compute status for keys (correct > present > absent)
  const keyStatuses = useMemo(() => {
    const statuses = {};
    guesses.forEach((guess) => {
      guess.split('').forEach((letter, idx) => {
        if (targetWord[idx] === letter) {
          statuses[letter] = 'key-correct';
        } else if (targetWord.includes(letter) && statuses[letter] !== 'key-correct') {
          statuses[letter] = 'key-present';
        } else if (!targetWord.includes(letter) && !statuses[letter]) {
          statuses[letter] = 'key-absent';
        }
      });
    });
    return statuses;
  }, [guesses, targetWord]);

  // Reset for next round
  const resetRound = useCallback(() => {
    setGuesses([]);
    setCurrentGuess('');
    setFeedback(null);
    setIsRoundWon(false);
  }, []);

  const handleKeyPress = useCallback(
    (key) => {
      if (feedback || isRoundWon) return;

      if (key === 'DEL' || key === 'BACKSPACE') {
        playSfx?.('tap');
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (key === 'ENTER') {
        if (currentGuess.length !== WORD_LENGTH) {
          playSfx?.('error');
          setRowShaking(true);
          setTimeout(() => setRowShaking(false), 500);
          return;
        }

        const nextGuesses = [...guesses, currentGuess];
        setGuesses(nextGuesses);
        playSfx?.('click');

        if (currentGuess === targetWord) {
          // Won Round
          playSfx?.('ding');
          setStreak((s) => s + 1);
          setScore((sc) => sc + 20);
          setIsRoundWon(true);
          setFeedback({
            isCorrect: true,
            title: isAr ? 'أحسنت! خمنت الكلمة بنجاح 🌟' : 'Brilliant! You cracked the word! 🌟',
            subtitle: `${isAr ? 'المعنى:' : 'Meaning:'} ${hint}`,
          });
        } else if (nextGuesses.length >= MAX_GUESSES) {
          // Lost Round
          playSfx?.('error');
          setStreak(0);
          setFeedback({
            isCorrect: false,
            title: isAr ? 'انتهت المحاولات!' : 'Out of attempts!',
            subtitle: `${isAr ? 'الكلمة الصحيحة كانت:' : 'The word was:'} ${targetWord}`,
          });
        }

        setCurrentGuess('');
        return;
      }

      // Normal letter key
      if (currentGuess.length < WORD_LENGTH) {
        playSfx?.('tap');
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, feedback, guesses, hint, isAr, isRoundWon, playSfx, targetWord]
  );

  // Physical keyboard listener
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Backspace') {
        handleKeyPress('DEL');
      } else if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key.length === 1) {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  const handleContinueRound = () => {
    if (roundIndex + 1 >= 3) {
      awardPoints?.(score);
      setIsCompleted(true);
    } else {
      setRoundIndex((r) => r + 1);
      resetRound();
    }
  };

  const keyboardRows = isAr ? KEYBOARD_AR : KEYBOARD_EN;
  const progressPercent = Math.round(((roundIndex + (isRoundWon ? 1 : 0)) / 3) * 100);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={score + 15}
        accuracy={Math.min(100, Math.round((score / 60) * 100))}
        streak={streak}
        title={isAr ? 'أتقنت متاهة الكلمات!' : 'Wordle Mastery Achieved!'}
        subtitle={isAr ? 'قوة لغوية ومعجمية مذهلة.' : 'Outstanding vocabulary retrieval & reasoning.'}
        onComplete={onBack}
      />
    );
  }

  return (
    <DuolingoGameShell progress={progressPercent} streak={streak} onClose={onBack}>
      <div className="duo-wordle-container" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Mascot Prompt */}
        <div className="duo-prompt-card">
          <span className="duo-prompt-mascot">🦉</span>
          <div className="duo-prompt-bubble">
            {isAr
              ? `خمّن الكلمة المكونة من ٥ حروف (${roundIndex + 1}/3) · تلميح: ${hint}`
              : `Guess the 5-letter word (${roundIndex + 1}/3) · Clue: ${hint}`}
          </div>
        </div>

        {/* 6x5 Wordle Tiles Grid */}
        <div className="duo-wordle-grid">
          {Array.from({ length: MAX_GUESSES }).map((_, rIdx) => {
            const isCurrentRow = rIdx === guesses.length;
            const rowWord = guesses[rIdx] || (isCurrentRow ? currentGuess : '');
            const isSubmitted = rIdx < guesses.length;

            return (
              <div
                key={rIdx}
                className={`duo-wordle-row ${isCurrentRow && rowShaking ? 'shake' : ''}`}
              >
                {Array.from({ length: WORD_LENGTH }).map((__, cIdx) => {
                  const letter = rowWord[cIdx] || '';
                  let tileClass = '';

                  if (isSubmitted && letter) {
                    if (targetWord[cIdx] === letter) {
                      tileClass = 'tile-correct flip';
                    } else if (targetWord.includes(letter)) {
                      tileClass = 'tile-present flip';
                    } else {
                      tileClass = 'tile-absent flip';
                    }
                  } else if (isCurrentRow && letter) {
                    tileClass = 'pop';
                  }

                  return (
                    <div
                      key={cIdx}
                      className={`duo-wordle-tile ${tileClass}`}
                      style={{ animationDelay: isSubmitted ? `${cIdx * 90}ms` : '0ms' }}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Tactile On-Screen Keyboard */}
        <div className="duo-wordle-keyboard">
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} className="duo-keyboard-row">
              {row.map((k) => {
                const isAction = k === 'ENTER' || k === 'DEL';
                const statusClass = keyStatuses[k] || '';
                const displayLabel = k === 'DEL' ? '⌫' : k === 'ENTER' ? (isAr ? 'إدخال' : 'ENTER') : k;

                return (
                  <button
                    key={k}
                    type="button"
                    className={`duo-key-btn ${isAction ? 'action-key' : ''} ${statusClass}`}
                    onClick={() => handleKeyPress(k)}
                  >
                    {displayLabel}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Duolingo Feedback Drawer */}
        <DuolingoFeedbackDrawer
          isOpen={!!feedback}
          isCorrect={feedback?.isCorrect}
          title={feedback?.title}
          subtitle={feedback?.subtitle}
          onContinue={handleContinueRound}
        />
      </div>
    </DuolingoGameShell>
  );
}
