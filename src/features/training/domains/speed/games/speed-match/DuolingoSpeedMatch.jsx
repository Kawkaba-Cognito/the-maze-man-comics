import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { Check, X, Lightning, Fire, Sparkle, FastForward } from '@phosphor-icons/react';

// Curated high-contrast cosmic symbols for high-speed perceptual matching
const SYMBOLS = ['⚡', '☄️', '⭐', '🚀', '💎', '🔥', '🌀', '🎯', '🪐', '🛡️'];

const TOTAL_ROUNDS = 15;

export default function DuolingoSpeedMatch({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  // Game setup
  const [levelMode, setLevelMode] = useState(null); // 'normal' | 'extreme'
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: bool, title: string, subtitle: string }

  // Stream of symbols for the game session
  const [symbolHistory, setSymbolHistory] = useState([]);
  const [currentSymbol, setCurrentSymbol] = useState(null);
  const [isMatchWithPrevious, setIsMatchWithPrevious] = useState(false);

  // Rapid countdown timer state
  const timeLimitMs = levelMode === 'extreme' ? 1300 : 2500;
  const [timeLeftMs, setTimeLeftMs] = useState(timeLimitMs);
  const timerRef = useRef(null);
  const roundStartTimeRef = useRef(Date.now());
  const answeredRef = useRef(false);

  // Multiplier calculated from streak
  const multiplier = useMemo(() => {
    if (streak >= 9) return 5;
    if (streak >= 5) return 3;
    if (streak >= 2) return 2;
    return 1;
  }, [streak]);

  // Start a new round
  const generateNextTrial = useCallback((prevSym) => {
    answeredRef.current = false;
    const shouldMatch = Math.random() < 0.5;
    let nextSym;
    if (shouldMatch && prevSym) {
      nextSym = prevSym;
    } else {
      const pool = SYMBOLS.filter((s) => s !== prevSym);
      nextSym = pool[Math.floor(Math.random() * pool.length)];
    }

    setCurrentSymbol(nextSym);
    setIsMatchWithPrevious(shouldMatch && !!prevSym);
    setTimeLeftMs(timeLimitMs);
    roundStartTimeRef.current = Date.now();
  }, [timeLimitMs]);

  // Begin game with selected mode
  const handleSelectMode = (mode) => {
    playSfx?.('select');
    setLevelMode(mode);
    const firstSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    setCurrentSymbol(firstSym);
    setSymbolHistory([firstSym]);
    setRound(1);
    setStreak(0);
    setScore(0);
    setCorrectCount(0);
    setTimeLeftMs(mode === 'extreme' ? 1300 : 2500);
    roundStartTimeRef.current = Date.now();
    answeredRef.current = false;
  };

  // Timer loop
  useEffect(() => {
    if (!levelMode || isCompleted || feedback) return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - roundStartTimeRef.current;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0 && !answeredRef.current) {
        clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 30);

    return () => clearInterval(timerRef.current);
  }, [levelMode, round, isCompleted, feedback, timeLimitMs]);

  // Handle Timeout
  const handleTimeout = () => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    playSfx?.('error');
    setStreak(0);

    setFeedback({
      isCorrect: false,
      title: isAr ? 'انتهى الوقت!' : 'Time Out!',
      subtitle: isAr ? 'تحتاج إلى قرار أسرع تحت الضغط' : 'Speed up your reflex decision',
    });
  };

  // Handle User Choice: Match or Different
  const handleAnswer = (userClaimedMatch) => {
    if (answeredRef.current || !levelMode || feedback) return;
    answeredRef.current = true;
    clearInterval(timerRef.current);

    // Round 1 is the memory anchor
    if (round === 1) {
      advanceNextRound(currentSymbol);
      return;
    }

    const isCorrect = userClaimedMatch === isMatchWithPrevious;

    if (isCorrect) {
      playSfx?.('ding');
      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak((m) => Math.max(m, newStreak));
      const addedXp = (levelMode === 'extreme' ? 20 : 10) * multiplier;
      setScore((s) => s + addedXp);
      setCorrectCount((c) => c + 1);

      // Brief flash feedback before advancing
      advanceNextRound(currentSymbol);
    } else {
      playSfx?.('error');
      setStreak(0);
      setFeedback({
        isCorrect: false,
        title: isAr ? 'إجابة غير صحيحة' : 'Incorrect Choice',
        subtitle: isMatchWithPrevious
          ? (isAr ? 'الرمزان كانا متطابقين تماماً' : 'The symbols actually matched')
          : (isAr ? 'الرمزان كانا مختلفين' : 'The symbols were different'),
      });
    }
  };

  // Advance to next round or finish
  const advanceNextRound = (lastSymbol) => {
    if (round >= TOTAL_ROUNDS) {
      const finalXp = Math.max(score, 30);
      awardPoints?.(finalXp);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
      setSymbolHistory((h) => [...h, lastSymbol]);
      generateNextTrial(lastSymbol);
    }
  };

  // Close feedback drawer and advance
  const handleFeedbackContinue = () => {
    setFeedback(null);
    advanceNextRound(currentSymbol);
  };

  // Victory screen
  if (isCompleted) {
    const accuracy = Math.round((correctCount / Math.max(1, TOTAL_ROUNDS - 1)) * 100);
    return (
      <DuolingoVictoryScreen
        xpEarned={score}
        accuracy={accuracy}
        streak={maxStreak}
        title={isAr ? 'سرعة استجابة مذهلة!' : 'Lightning Match Completed!'}
        subtitle={
          isAr
            ? `أنهيت نمط ${levelMode === 'extreme' ? 'السرعة القصوى' : 'السرعة العادية'} بدقة ${accuracy}%!`
            : `Completed ${levelMode === 'extreme' ? 'Extreme Speed' : 'Normal Speed'} with ${accuracy}% accuracy!`
        }
        onComplete={onBack}
      />
    );
  }

  // Pre-game Mode Selection Modal
  if (!levelMode) {
    return (
      <div className="duo-game-screen" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="duo-modal-overlay">
          <div className="duo-modal-card">
            <div style={{ fontSize: 48, marginBottom: 8 }}>⚡</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#ff7800', margin: '0 0 6px' }}>
              {isAr ? 'مطابقة السرعة الذهنية' : 'Speed Match'}
            </h2>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#666', margin: 0 }}>
              {isAr
                ? 'قارن الرمز الحالي بالرمز الذي سبقه مباشرة بأقصى سرعة ممكنة'
                : 'Decide if the current symbol matches the previous one in record time'}
            </p>

            <div className="duo-mode-select-grid">
              <button
                type="button"
                className="duo-mode-card"
                onClick={() => handleSelectMode('normal')}
              >
                <div className="duo-mode-icon">⚡</div>
                <div className="duo-mode-info">
                  <h4 className="duo-mode-title">{isAr ? 'السرعة العادية' : 'Normal Speed'}</h4>
                  <p className="duo-mode-desc">
                    {isAr ? '2.5 ثانية لكل رمز · مناسب للتركيز المستمر' : '2.5s per card · Great for focus'}
                  </p>
                </div>
              </button>

              <button
                type="button"
                className="duo-mode-card is-selected"
                onClick={() => handleSelectMode('extreme')}
              >
                <div className="duo-mode-icon">🔥</div>
                <div className="duo-mode-info">
                  <h4 className="duo-mode-title" style={{ color: '#ff7800' }}>
                    {isAr ? 'سرعة نيزكية فائقة' : 'Extreme Speed'}
                  </h4>
                  <p className="duo-mode-desc">
                    {isAr ? '1.3 ثانية لكل رمز · مضاعف نقاط X5' : '1.3s per card · Up to 5X combo bonus'}
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              className="duo-3d-btn"
              onClick={onBack}
              style={{
                background: '#f1f5f9',
                color: '#64748b',
                borderBottom: '4px solid #cbd5e1',
                padding: '12px 28px',
                width: '100%',
              }}
            >
              {isAr ? 'رجوع' : 'Back'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const timerRatio = Math.max(0, Math.min(100, (timeLeftMs / timeLimitMs) * 100));
  const progressRatio = (round / TOTAL_ROUNDS) * 100;

  return (
    <DuolingoGameShell
      progress={progressRatio}
      streak={streak}
      onClose={onBack}
    >
      {/* Prompt Card */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">
          {levelMode === 'extreme' ? '☄️' : '🦊'}
        </div>
        <div className="duo-prompt-bubble">
          {round === 1
            ? (isAr ? 'احفظ هذا الرمز الأول واضغط "ابدأ التحدي"!' : 'Remember this first symbol and tap "Start"!')
            : (isAr ? 'هل يطابق هذا الرمز الرمز الذي سبقه مباشرة؟' : 'Does this match the symbol immediately before?')}
        </div>
      </div>

      {/* Main Speed Match Arena */}
      <div className="duo-speed-match-arena">
        {/* Top Indicators: Rapid Timer & Streak Multiplier */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="duo-rapid-timer-track">
            <div
              className={`duo-rapid-timer-fill ${timerRatio < 30 ? 'danger' : ''}`}
              style={{ width: `${timerRatio}%` }}
            />
          </div>

          <div
            className={`duo-streak-multiplier ${
              multiplier >= 5 ? 'mult-super' : multiplier >= 3 ? 'mult-3' : multiplier >= 2 ? 'mult-2' : 'mult-1'
            }`}
          >
            <Lightning size={16} weight="fill" />
            <span>{multiplier}X {isAr ? 'مضاعف' : 'COMBO'}</span>
          </div>
        </div>

        {/* Central Symbol Display Card */}
        <div
          className="duo-symbol-display-card"
          key={round} // triggers CSS pop animation on change
        >
          <span className="duo-symbol-glyph">{currentSymbol}</span>
        </div>

        {/* Previous Symbol Preview for Round > 1 */}
        {round > 1 && symbolHistory.length > 0 && (
          <div className="duo-prev-preview-card">
            <span>{isAr ? 'الرمز السابق:' : 'Previous symbol:'}</span>
            <span style={{ fontSize: 20 }}>{symbolHistory[symbolHistory.length - 1]}</span>
          </div>
        )}

        {/* Action Controls */}
        {round === 1 ? (
          <button
            type="button"
            className="duo-3d-btn duo-btn-match"
            style={{ width: '100%', maxWidth: 360, padding: 18 }}
            onClick={() => handleAnswer(false)}
          >
            <span>{isAr ? 'ابدأ المطابقة السريعة ⚡' : 'Start Matching ⚡'}</span>
          </button>
        ) : (
          <div className="duo-match-actions-grid">
            <button
              type="button"
              className="duo-3d-btn duo-btn-match"
              onClick={() => handleAnswer(true)}
              disabled={!!feedback}
            >
              <Check size={28} weight="bold" />
              <span>{isAr ? 'مطابق' : 'MATCH'}</span>
            </button>

            <button
              type="button"
              className="duo-3d-btn duo-btn-different"
              onClick={() => handleAnswer(false)}
              disabled={!!feedback}
            >
              <X size={28} weight="bold" />
              <span>{isAr ? 'مختلف' : 'DIFFERENT'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Instant Feedback Drawer on Mistake/Timeout */}
      <DuolingoFeedbackDrawer
        isOpen={!!feedback}
        isCorrect={feedback?.isCorrect ?? false}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        onContinue={handleFeedbackContinue}
      />
    </DuolingoGameShell>
  );
}
