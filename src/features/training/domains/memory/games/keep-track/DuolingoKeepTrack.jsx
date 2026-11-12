import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { CATEGORIES } from './data.js';

const TOTAL_ROUNDS = 3;

const CATEGORY_ICONS = {
  animals: '🦁',
  colours: '🎨',
  countries: '🌍',
  instruments: '🎸',
  fruits: '🍎',
  shapes: '🔷',
};

export default function DuolingoKeepTrack({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Phases: 'briefing' -> 'stream' -> 'recall'
  const [phase, setPhase] = useState('briefing');
  const [streamIndex, setStreamIndex] = useState(0);
  const [activeCategoryPulse, setActiveCategoryPulse] = useState(null);

  // Category update tallies: { [catId]: number }
  const [tallies, setTallies] = useState({});

  // User recall answers: { [catId]: string }
  const [userAnswers, setUserAnswers] = useState({});

  // Target categories for this round
  const targetCategories = useMemo(() => {
    // Round 1: 2 categories; Round 2: 3 categories; Round 3: 3 categories
    const count = round === 1 ? 2 : 3;
    const offset = (round - 1) * 2;
    const cats = [];
    for (let i = 0; i < count; i++) {
      cats.push(CATEGORIES[(offset + i) % CATEGORIES.length]);
    }
    return cats;
  }, [round]);

  // Construct word stream for this round
  const streamData = useMemo(() => {
    const targetIds = new Set(targetCategories.map((c) => c.id));
    const distractorCategories = CATEGORIES.filter((c) => !targetIds.has(c.id));

    const totalWords = round === 1 ? 6 : (round === 2 ? 8 : 10);
    const words = [];
    const lastWordMap = {};
    const wordsSeenPerCat = {};

    targetCategories.forEach((cat) => {
      wordsSeenPerCat[cat.id] = [];
    });

    for (let i = 0; i < totalWords; i++) {
      // 70% chance target category, 30% chance distractor category
      const isTarget = Math.random() < 0.75 || i >= totalWords - targetCategories.length;
      let cat;
      if (isTarget) {
        cat = targetCategories[Math.floor(Math.random() * targetCategories.length)];
      } else {
        cat = distractorCategories[Math.floor(Math.random() * distractorCategories.length)] || targetCategories[0];
      }

      const langKey = isAr ? 'ar' : 'en';
      const items = cat.items[langKey];
      // Pick random item not equal to the immediate previous in this category
      const available = items.filter((w) => w !== lastWordMap[cat.id]);
      const word = available[Math.floor(Math.random() * available.length)] || items[0];

      if (targetIds.has(cat.id)) {
        lastWordMap[cat.id] = word;
        wordsSeenPerCat[cat.id].push(word);
      }

      words.push({
        word,
        categoryId: cat.id,
        categoryName: cat.name[langKey],
        isTarget: targetIds.has(cat.id),
      });
    }

    // Ensure every target category has at least one appearance
    targetCategories.forEach((cat) => {
      const langKey = isAr ? 'ar' : 'en';
      if (!lastWordMap[cat.id]) {
        const word = cat.items[langKey][0];
        lastWordMap[cat.id] = word;
        wordsSeenPerCat[cat.id].push(word);
        words.push({
          word,
          categoryId: cat.id,
          categoryName: cat.name[langKey],
          isTarget: true,
        });
      }
    });

    return { words, lastWordMap, wordsSeenPerCat };
  }, [round, targetCategories, isAr]);

  // Reset round state
  useEffect(() => {
    setPhase('briefing');
    setStreamIndex(0);
    setUserAnswers({});
    setFeedback(null);
    setActiveCategoryPulse(null);

    const initialTallies = {};
    targetCategories.forEach((c) => {
      initialTallies[c.id] = 0;
    });
    setTallies(initialTallies);
  }, [round, targetCategories]);

  // Handle word stream playback
  useEffect(() => {
    if (phase !== 'stream') return;

    if (streamIndex >= streamData.words.length) {
      // Stream finished, move to recall
      setPhase('recall');
      playSfx?.('ding');
      return;
    }

    const currentItem = streamData.words[streamIndex];
    if (currentItem?.isTarget) {
      playSfx?.('tap');
      setActiveCategoryPulse(currentItem.categoryId);
      setTallies((prev) => ({
        ...prev,
        [currentItem.categoryId]: (prev[currentItem.categoryId] || 0) + 1,
      }));
    }

    const timer = setTimeout(() => {
      setActiveCategoryPulse(null);
      setStreamIndex((idx) => idx + 1);
    }, 1800);

    return () => clearTimeout(timer);
  }, [phase, streamIndex, streamData.words, playSfx]);

  const handleStartStream = useCallback(() => {
    playSfx?.('tap');
    setPhase('stream');
    setStreamIndex(0);
  }, [playSfx]);

  const handleSelectAnswer = useCallback((categoryId, word) => {
    playSfx?.('tap');
    setUserAnswers((prev) => ({
      ...prev,
      [categoryId]: word,
    }));
  }, [playSfx]);

  const handleCheckAnswers = useCallback(() => {
    let correctCount = 0;
    const errors = [];

    targetCategories.forEach((cat) => {
      const expected = streamData.lastWordMap[cat.id];
      const given = userAnswers[cat.id];
      if (given === expected) {
        correctCount++;
      } else {
        errors.push(`${cat.name[isAr ? 'ar' : 'en']}: ${expected}`);
      }
    });

    const isAllCorrect = correctCount === targetCategories.length;

    if (isAllCorrect) {
      playSfx?.('ding');
      setStreak((s) => s + 1);
      setScore((sc) => sc + 30);
      setFeedback({
        isCorrect: true,
        title: isAr ? 'رائع! تذكرت آخر كلمة في كل فئة بدقة' : 'Spot on! All category updates tracked!',
        subtitle: isAr ? '+30 نقاط خبرة · تحديث ذاكرة فوري ⚡' : '+30 XP · Instant working memory update ⚡',
      });
    } else {
      playSfx?.('error');
      setFeedback({
        isCorrect: false,
        title: isAr ? 'فاتك آخر تحديث في بعض الفئات' : 'Missed latest word in some categories',
        subtitle: (isAr ? 'الكلمات الأخيرة كانت: ' : 'Latest words were: ') + errors.join(' · '),
      });
    }
  }, [targetCategories, streamData.lastWordMap, userAnswers, isAr, playSfx]);

  const handleNextRound = useCallback(() => {
    if (feedback?.isCorrect) {
      if (round >= TOTAL_ROUNDS) {
        awardPoints?.(50);
        setIsCompleted(true);
      } else {
        setRound((r) => r + 1);
      }
    } else {
      // Re-run the stream on error
      setPhase('briefing');
      setStreamIndex(0);
      setUserAnswers({});
      setFeedback(null);
    }
  }, [feedback, round, awardPoints]);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={50}
        accuracy={Math.min(100, Math.round((score / (TOTAL_ROUNDS * 30)) * 100) || 88)}
        streak={streak}
        title={isAr ? 'أتقنت تتبّع وتحديث الفئات!' : 'Keep Track Mastered!'}
        subtitle={isAr ? 'قدرة فائقة على تحديث الذاكرة العاملة باستمرار!' : 'Outstanding working-memory updating and retrieval!'}
        onComplete={onBack}
      />
    );
  }

  const currentWordItem = streamData.words[streamIndex];
  const progressPercent = ((round - 1) / TOTAL_ROUNDS) * 100 + (phase === 'recall' ? 25 : 12);

  return (
    <DuolingoGameShell
      progress={progressPercent}
      streak={streak}
      onClose={onBack}
    >
      {/* Duolingo Prompt Card */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">🎯</div>
        <div className="duo-prompt-bubble">
          {phase === 'briefing' && (
            isAr ? (
              <>
                تتبّع هذه الفئات! ركّز على <strong style={{ color: '#ff7800' }}>آخر كلمة</strong> تظهر في كل فئة منها.
              </>
            ) : (
              <>
                Keep track of these categories! Remember the <strong style={{ color: '#ff7800' }}>LAST word</strong> in each.
              </>
            )
          )}
          {phase === 'stream' && (
            isAr ? (
              <>
                تدفّق الكلمات جارٍ... حدّث ذاكرتك مع كل كلمة جديدة! ({streamIndex + 1}/{streamData.words.length})
              </>
            ) : (
              <>
                Words streaming... Update your memory as words appear! ({streamIndex + 1}/{streamData.words.length})
              </>
            )
          )}
          {phase === 'recall' && (
            isAr ? (
              <>
                ما هي <strong style={{ color: '#2586f7' }}>آخر كلمة</strong> رأيتها في كل فئة من الفئات المستهدفة؟
              </>
            ) : (
              <>
                Select the <strong style={{ color: '#2586f7' }}>LAST word</strong> you saw in each category!
              </>
            )
          )}
        </div>
      </div>

      <div className="duo-keeptrack-container">
        {/* Category Tracking Counters Bar */}
        <div className="duo-category-tally-bar">
          {targetCategories.map((cat) => {
            const isPulsing = activeCategoryPulse === cat.id;
            const count = tallies[cat.id] || 0;
            return (
              <div
                key={cat.id}
                className={`duo-category-tally-pill ${isPulsing ? 'is-active-category' : ''}`}
              >
                <div className="duo-category-pill-name">
                  <span style={{ fontSize: 20 }}>{CATEGORY_ICONS[cat.id] || '🏷️'}</span>
                  <span>{cat.name[isAr ? 'ar' : 'en']}</span>
                </div>
                <div className="duo-category-tally-badge">
                  <span>⚡</span>
                  <span>{count}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Phase 1: Briefing View */}
        {phase === 'briefing' && (
          <div style={{ width: '100%', textAlign: 'center', marginTop: 24 }}>
            <div
              style={{
                background: '#f8fafc',
                border: '2px dashed #cbd5e1',
                borderRadius: 24,
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span style={{ fontSize: 48 }}>🧠 🔄</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#1e293b' }}>
                {isAr ? 'استعد لتحديث الذاكرة' : 'Get Ready to Update'}
              </h3>
              <p style={{ margin: 0, fontSize: 14, color: '#64748b', maxWidth: 360 }}>
                {isAr
                  ? 'ستمر كلمات متتالية. عندما ترى كلمة جديدة من إحدى الفئات المستهدفة، استبدل الكلمة القديمة في ذهنك بالجديدة!'
                  : 'Words will stream past. Whenever a new word appears in a tracked category, overwrite the old one in your memory!'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartStream}
              style={{
                width: '100%',
                background: '#58cc02',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: 16,
                borderRadius: 18,
                border: 'none',
                borderBottom: '5px solid #46a302',
                cursor: 'pointer',
                marginTop: 24,
              }}
            >
              {isAr ? 'ابدأ تدفّق الكلمات ⚡' : 'Start Stream ⚡'}
            </button>
          </div>
        )}

        {/* Phase 2: Stream View */}
        {phase === 'stream' && currentWordItem && (
          <div className="duo-word-stream-card">
            <span className="duo-word-category-tag">
              {CATEGORY_ICONS[currentWordItem.categoryId] || '🏷️'} {currentWordItem.categoryName}
            </span>

            <span className="duo-word-stream-text">
              {currentWordItem.word}
            </span>

            <div
              style={{
                position: 'absolute',
                bottom: 12,
                fontSize: 12,
                fontWeight: 800,
                color: '#94a3b8',
              }}
            >
              {streamIndex + 1} / {streamData.words.length}
            </div>
          </div>
        )}

        {/* Phase 3: Recall Stage */}
        {phase === 'recall' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {targetCategories.map((cat) => {
              const langKey = isAr ? 'ar' : 'en';
              const correctWord = streamData.lastWordMap[cat.id];
              const seenInCat = streamData.wordsSeenPerCat[cat.id] || [];

              // Options: seen words in this category + 1 distractor from same cat
              const otherItems = cat.items[langKey].filter((w) => !seenInCat.includes(w));
              const extraFoil = otherItems[0];
              const candidateWords = Array.from(new Set([...seenInCat, extraFoil])).filter(Boolean);
              // Scramble choices
              const shuffledChoices = [...candidateWords].sort();

              const currentChoice = userAnswers[cat.id];

              return (
                <div key={cat.id} className="duo-recall-category-block">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 22 }}>{CATEGORY_ICONS[cat.id] || '🏷️'}</span>
                    <strong style={{ fontSize: 16, color: '#1e293b' }}>
                      {cat.name[langKey]}
                    </strong>
                  </div>

                  <div className="duo-recall-chips-grid">
                    {shuffledChoices.map((word) => {
                      const isSelected = currentChoice === word;
                      return (
                        <button
                          key={word}
                          type="button"
                          onClick={() => handleSelectAnswer(cat.id, word)}
                          className={`duo-recall-chip ${isSelected ? 'is-selected' : ''}`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Check Button */}
            {!feedback && (
              <button
                type="button"
                onClick={handleCheckAnswers}
                disabled={Object.keys(userAnswers).length < targetCategories.length}
                style={{
                  width: '100%',
                  background: Object.keys(userAnswers).length === targetCategories.length ? '#58cc02' : '#e5e5e5',
                  color: Object.keys(userAnswers).length === targetCategories.length ? '#ffffff' : '#afafaf',
                  fontSize: 16,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: 16,
                  borderRadius: 18,
                  border: 'none',
                  borderBottom: Object.keys(userAnswers).length === targetCategories.length ? '5px solid #46a302' : '5px solid #cccccc',
                  cursor: Object.keys(userAnswers).length === targetCategories.length ? 'pointer' : 'not-allowed',
                  transition: 'all 0.1s ease',
                  marginTop: 8,
                }}
              >
                {isAr ? 'تحقق من الإجابة' : 'Check Answers'}
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
            ? (isAr ? (round === TOTAL_ROUNDS ? 'عرض النتيجة' : 'الجولة التالية') : (round === TOTAL_ROUNDS ? 'View Results' : 'Next Round'))
            : (isAr ? 'إعادة التحدي' : 'Try Again')
        }
        onContinue={handleNextRound}
      />
    </DuolingoGameShell>
  );
}
