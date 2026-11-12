import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { STORIES } from './stories.js';
import { BACKGROUNDS, CHARS } from './data.js';

const TOTAL_ROUNDS = 3;

// Map character ids to expressive avatar emojis
const CHAR_EMOJIS = {
  kawkab: '🧑‍🚀',
  star: '⭐',
  noor: '🦊',
  rami: '👦',
  lola: '👧',
  H: '🦸',
  F: '🧝',
};

function resolveText(template, lang, roleChar = {}) {
  if (!template) return '';
  let str = template[lang] || template.en || '';
  const map = {
    '{H}': lang === 'ar' ? 'البطل' : 'Hero',
    '{F}': lang === 'ar' ? 'الصديق' : 'Friend',
    '{L}': lang === 'ar' ? 'لولا' : 'Lola',
    '{R}': lang === 'ar' ? 'رامي' : 'Ramy',
    '{N}': lang === 'ar' ? 'نور' : 'Noor',
  };
  Object.entries(map).forEach(([token, val]) => {
    str = str.replaceAll(token, val);
  });
  return str;
}

export default function DuolingoStoryGrid({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: bool, title: string, subtitle: string }

  // Game Stage: 'watch' (panel by panel reading) or 'order' (rebuild sequence)
  const [stage, setStage] = useState('watch');
  const [currentWatchIdx, setCurrentWatchIdx] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  // Reorder stage state
  const [placedIndices, setPlacedIndices] = useState([]); // Array of beat indices in order chosen by player

  // Pick a fresh story for each round
  const currentStory = useMemo(() => {
    // Round 1: 3 acts, Round 2: 3 acts, Round 3: 4 acts
    const actCount = round >= 3 ? 4 : 3;
    const candidates = STORIES.filter((s) => s.beats.length === actCount);
    const chosen = candidates[(round - 1) % candidates.length] || STORIES[0];
    return chosen;
  }, [round]);

  const beats = useMemo(() => {
    return currentStory?.beats || [];
  }, [currentStory]);

  // Shuffled indices for the tray
  const shuffledBeatIndices = useMemo(() => {
    const indices = beats.map((_, idx) => idx);
    // Deterministic pseudo-shuffle based on round
    return [...indices].sort((a, b) => ((a * 7 + round * 13) % 11) - ((b * 7 + round * 13) % 11));
  }, [beats, round]);

  // Reset when round changes
  useEffect(() => {
    setStage('watch');
    setCurrentWatchIdx(0);
    setPlacedIndices([]);
    setFeedback(null);
    setIsFlipping(false);
  }, [round]);

  // Card Flip Transition in Watch Mode
  const handleNextWatch = useCallback(() => {
    playSfx?.('tap');
    setIsFlipping(true);
    setTimeout(() => {
      if (currentWatchIdx + 1 < beats.length) {
        setCurrentWatchIdx((idx) => idx + 1);
      } else {
        setStage('order');
      }
      setIsFlipping(false);
    }, 200);
  }, [currentWatchIdx, beats.length, playSfx]);

  const handlePrevWatch = useCallback(() => {
    if (currentWatchIdx > 0) {
      playSfx?.('tap');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentWatchIdx((idx) => idx - 1);
        setIsFlipping(false);
      }, 200);
    }
  }, [currentWatchIdx, playSfx]);

  // Place a card into next slot
  const handleSelectTrayCard = useCallback((beatIdx) => {
    if (placedIndices.includes(beatIdx)) return;
    playSfx?.('tap');
    setPlacedIndices((prev) => [...prev, beatIdx]);
  }, [placedIndices, playSfx]);

  // Remove a placed card back to tray
  const handleRemovePlacedCard = useCallback((slotIdx) => {
    playSfx?.('tap');
    setPlacedIndices((prev) => prev.filter((_, idx) => idx !== slotIdx));
  }, [playSfx]);

  // Reset all placed cards
  const handleResetOrder = useCallback(() => {
    playSfx?.('click');
    setPlacedIndices([]);
  }, [playSfx]);

  // Check the player's order
  const handleCheckOrder = useCallback(() => {
    // Check if placedIndices matches [0, 1, 2, ... beats.length - 1]
    const isExact = placedIndices.length === beats.length &&
      placedIndices.every((val, idx) => val === idx);

    if (isExact) {
      playSfx?.('ding');
      setStreak((s) => s + 1);
      setScore((sc) => sc + 25);
      const moralText = resolveText(currentStory?.moral, isAr ? 'ar' : 'en');
      setFeedback({
        isCorrect: true,
        title: isAr ? 'ممتاز! تسلسل أحداث متقن' : 'Splendid! Chronological story master!',
        subtitle: moralText ? `🌟 ${moralText}` : (isAr ? '+25 نقطة خبرة' : '+25 XP'),
      });
    } else {
      playSfx?.('error');
      setFeedback({
        isCorrect: false,
        title: isAr ? 'ليست بالترتيب الصحيح تماماً' : 'Not quite in the right order',
        subtitle: isAr ? 'حاول تذكّر بداية القصة ووسطها ونهايتها!' : 'Remember how the story started, developed, and ended!',
      });
    }
  }, [placedIndices, beats.length, currentStory, isAr, playSfx]);

  const handleNextRound = useCallback(() => {
    if (feedback?.isCorrect) {
      if (round >= TOTAL_ROUNDS) {
        awardPoints?.(50);
        setIsCompleted(true);
      } else {
        setRound((r) => r + 1);
      }
    } else {
      // Allow retry
      setFeedback(null);
      setPlacedIndices([]);
    }
  }, [feedback, round, awardPoints]);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={50}
        accuracy={Math.min(100, Math.round((score / (TOTAL_ROUNDS * 25)) * 100) || 90)}
        streak={streak}
        title={isAr ? 'أتقنت بناء وتسلسل القصص!' : 'Story Grid Champion!'}
        subtitle={isAr ? 'ذاكرة أحداث متسلسلة خارقة اليوم يا بطل!' : 'Superb temporal order and narrative recall!'}
        onComplete={onBack}
      />
    );
  }

  const currentBeat = beats[currentWatchIdx] || beats[0];
  const bgData = BACKGROUNDS[currentBeat?.bg] || BACKGROUNDS.home;
  const progressPercent = ((round - 1) / TOTAL_ROUNDS) * 100 + (stage === 'order' ? 20 : 10);

  return (
    <DuolingoGameShell
      progress={progressPercent}
      streak={streak}
      onClose={onBack}
    >
      {/* Duolingo Prompt Card */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">📖</div>
        <div className="duo-prompt-bubble">
          {stage === 'watch' ? (
            isAr ? (
              <>
                شاهد القصة: <strong style={{ color: '#ff7800' }}>{resolveText(currentStory?.title, 'ar')}</strong> (المشهد {currentWatchIdx + 1} من {beats.length})
              </>
            ) : (
              <>
                Story Time: <strong style={{ color: '#ff7800' }}>{resolveText(currentStory?.title, 'en')}</strong> (Scene {currentWatchIdx + 1} of {beats.length})
              </>
            )
          ) : (
            isAr ? (
              <>
                رتّب بطاقات المشاهد حسب تسلسل حدوثها في القصة من البداية إلى النهاية!
              </>
            ) : (
              <>
                Tap the scenes in the exact chronological order they happened!
              </>
            )
          )}
        </div>
      </div>

      {/* Main Play Area */}
      <div className="duo-story-container">
        {stage === 'watch' ? (
          /* Stage 1: Watch Card with Flip Animation */
          <div className="duo-story-card-wrapper">
            <div className={`duo-story-flip-card ${isFlipping ? 'is-flipped' : ''}`}>
              <div className="duo-story-act-badge">
                {isAr ? `المشهد ${currentWatchIdx + 1}` : `Act ${currentWatchIdx + 1}`}
              </div>

              {/* Comic Scene Box */}
              <div
                className="duo-story-panel-scene"
                style={{
                  background: bgData?.bg || 'linear-gradient(180deg,#fbe6cf 0%,#f4d3ab 100%)',
                }}
              >
                {/* Ambient props */}
                <div className="duo-story-props">
                  {bgData?.amb?.slice(0, 3).map((item, i) => (
                    <span
                      key={i}
                      style={{
                        position: 'absolute',
                        ...item.s,
                      }}
                    >
                      {item.e}
                    </span>
                  ))}
                </div>

                {/* Character Actors */}
                <div className="duo-story-actors">
                  {currentBeat?.who?.map((charId, idx) => (
                    <div key={idx} className="duo-story-actor">
                      <span>{CHAR_EMOJIS[charId] || '🧑‍🚀'}</span>
                    </div>
                  ))}
                  {currentBeat?.item && typeof currentBeat.item === 'string' && (
                    <span style={{ fontSize: 28 }}>{currentBeat.item}</span>
                  )}
                </div>
              </div>

              {/* Speech bubble or narration */}
              {currentBeat?.say && (
                <div
                  style={{
                    background: '#ffffff',
                    border: '2px solid #ff7800',
                    borderRadius: 12,
                    padding: '6px 12px',
                    fontSize: 13,
                    fontWeight: 900,
                    color: '#ff7800',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(255, 120, 0, 0.15)',
                  }}
                >
                  💬 {resolveText(currentBeat.say, isAr ? 'ar' : 'en')}
                </div>
              )}

              {/* Story Narration Text */}
              <div className="duo-story-caption">
                {resolveText(currentBeat?.narr, isAr ? 'ar' : 'en')}
              </div>

              {/* Navigation Controls */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                {currentWatchIdx > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevWatch}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 14,
                      border: '2px solid #e5e5e5',
                      borderBottom: '4px solid #d5d5d5',
                      background: '#ffffff',
                      color: '#666',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'المشهد السابق' : 'Previous'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNextWatch}
                  style={{
                    flex: 2,
                    padding: 12,
                    borderRadius: 14,
                    border: 'none',
                    borderBottom: '4px solid #106ad6',
                    background: '#2586f7',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  {currentWatchIdx + 1 < beats.length
                    ? (isAr ? 'المشهد التالي ←' : 'Next Scene →')
                    : (isAr ? 'جاهز لترتيب القصة! 🚀' : 'Ready to Order! 🚀')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Stage 2: Rebuild Order Stage */
          <div className="duo-order-stage">
            {/* Numbered Slots */}
            <div className="duo-order-slots-row">
              {beats.map((_, slotIdx) => {
                const placedBeatIdx = placedIndices[slotIdx];
                const hasItem = placedBeatIdx !== undefined;
                const placedBeat = hasItem ? beats[placedBeatIdx] : null;

                return (
                  <div
                    key={slotIdx}
                    className={`duo-order-slot ${hasItem ? 'is-filled' : ''}`}
                    onClick={() => hasItem && handleRemovePlacedCard(slotIdx)}
                    style={{ cursor: hasItem ? 'pointer' : 'default' }}
                    title={hasItem ? (isAr ? 'اضغط للإلغاء' : 'Tap to remove') : ''}
                  >
                    <span className="duo-order-slot-num">
                      {isAr ? `خطوة ${slotIdx + 1}` : `Step ${slotIdx + 1}`}
                    </span>
                    {hasItem ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                        <span style={{ fontSize: 24 }}>
                          {CHAR_EMOJIS[placedBeat?.who?.[0]] || '🎬'}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#2586f7', textAlign: 'center' }}>
                          {resolveText(placedBeat?.say, isAr ? 'ar' : 'en') ||
                            (isAr ? `مشهد ${placedBeatIdx + 1}` : `Scene ${placedBeatIdx + 1}`)}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 20, color: '#cbd5e1' }}>+</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Tray of Scrambled Scenes */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="duo-order-tray-title">
                {isAr ? 'اختر المشاهد بالترتيب الصحيح:' : 'Select scenes in chronological order:'}
              </span>
              {placedIndices.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetOrder}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#ff4b4b',
                    fontSize: 12,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  {isAr ? 'إعادة ضبط ↺' : 'Reset ↺'}
                </button>
              )}
            </div>

            <div className="duo-order-tray-grid">
              {shuffledBeatIndices.map((beatIdx) => {
                const beat = beats[beatIdx];
                const isPlaced = placedIndices.includes(beatIdx);
                const bg = BACKGROUNDS[beat?.bg];

                return (
                  <button
                    key={beatIdx}
                    type="button"
                    disabled={isPlaced}
                    onClick={() => handleSelectTrayCard(beatIdx)}
                    className="duo-order-tile"
                    style={{
                      background: bg?.bg || '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 6, fontSize: 22 }}>
                      {beat?.who?.map((c, i) => (
                        <span key={i}>{CHAR_EMOJIS[c] || '🧑‍🚀'}</span>
                      ))}
                      {beat?.item && typeof beat.item === 'string' && (
                        <span>{beat.item}</span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#1e293b',
                        background: 'rgba(255, 255, 255, 0.92)',
                        padding: '4px 8px',
                        borderRadius: 8,
                        lineHeight: 1.3,
                      }}
                    >
                      {resolveText(beat?.say, isAr ? 'ar' : 'en') ||
                        (resolveText(beat?.narr, isAr ? 'ar' : 'en').slice(0, 36) + '...')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Check Button */}
            {!feedback && (
              <button
                type="button"
                onClick={handleCheckOrder}
                disabled={placedIndices.length < beats.length}
                style={{
                  width: '100%',
                  background: placedIndices.length === beats.length ? '#58cc02' : '#e5e5e5',
                  color: placedIndices.length === beats.length ? '#ffffff' : '#afafaf',
                  fontSize: 16,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: 16,
                  borderRadius: 18,
                  border: 'none',
                  borderBottom: placedIndices.length === beats.length ? '5px solid #46a302' : '5px solid #cccccc',
                  cursor: placedIndices.length === beats.length ? 'pointer' : 'not-allowed',
                  transition: 'all 0.1s ease',
                  marginTop: 12,
                }}
              >
                {isAr ? 'تحقق من الترتيب' : 'Check Story Order'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sliding Feedback Drawer */}
      <DuolingoFeedbackDrawer
        isOpen={Boolean(feedback)}
        isCorrect={feedback?.isCorrect}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        buttonLabel={
          feedback?.isCorrect
            ? (isAr ? (round === TOTAL_ROUNDS ? 'عرض النتيجة' : 'القصة التالية') : (round === TOTAL_ROUNDS ? 'View Results' : 'Next Story'))
            : (isAr ? 'إعادة المحاولة' : 'Try Again')
        }
        onContinue={handleNextRound}
      />
    </DuolingoGameShell>
  );
}
