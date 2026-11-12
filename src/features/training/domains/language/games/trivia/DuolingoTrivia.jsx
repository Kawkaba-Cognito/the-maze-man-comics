import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';

const TRIVIA_BANK = [
  {
    categoryEn: 'Space & Cosmos 🪐',
    categoryAr: 'الفضاء والكون 🪐',
    questionEn: 'What is the closest planet to the Sun?',
    questionAr: 'ما هو أقرب كوكب إلى الشمس في مجموعتنا الشمسية؟',
    optionsEn: ['Mercury', 'Venus', 'Earth', 'Mars'],
    optionsAr: ['عطارد', 'الزهرة', 'الأرض', 'المريخ'],
    correctIndex: 0,
    factEn: 'Did you know? Mercury orbits the Sun in just 88 Earth days!',
    factAr: 'هل تعلم؟ عطارد يكمل دورته الكاملة حول الشمس في ٨٨ يوماً أرضياً فقط!',
  },
  {
    categoryEn: 'Human Biology 🫀',
    categoryAr: 'جسم الإنسان والعلوم 🫀',
    questionEn: 'Which organ produces insulin in the human body?',
    questionAr: 'ما هو العضو المسؤول عن إفراز هرمون الأنسولين في جسم الإنسان؟',
    optionsEn: ['Pancreas', 'Liver', 'Kidneys', 'Heart'],
    optionsAr: ['البنكرياس', 'الكبد', 'الكلى', 'القلب'],
    correctIndex: 0,
    factEn: 'Did you know? Insulin allows your body cells to absorb glucose for energy.',
    factAr: 'هل تعلم؟ ينظم البنكرياس نسبة السكر في الدم بدقة متناهية لإنتاج الطاقة.',
  },
  {
    categoryEn: 'Physics & Nature ⚡',
    categoryAr: 'الفيزياء والطبيعة ⚡',
    questionEn: 'What is the fastest phenomenon in the universe?',
    questionAr: 'ما هو الشيء الأسرع على الإطلاق في الكون المعروف؟',
    optionsEn: [
      'Light in vacuum',
      'Sound in solid steel',
      'Solar wind particles',
      'Ocean tsunamis',
    ],
    optionsAr: [
      'الضوء في الفراغ',
      'الصوت في الفولاذ',
      'جسيمات الرياح الشمسية',
      'موجات التسونامي البحرية',
    ],
    correctIndex: 0,
    factEn: 'Did you know? Light travels at approximately 300,000 kilometers per second!',
    factAr: 'هل تعلم؟ سرعة الضوء في الفراغ تصل إلى ٣٠٠ ألف كيلومتر في الثانية الواحدة!',
  },
  {
    categoryEn: 'Earth & Oceans 🌊',
    categoryAr: 'كوكب الأرض والمحيطات 🌊',
    questionEn: 'What is the largest ocean on Earth by surface area?',
    questionAr: 'ما هو أكبر محيط على كوكب الأرض من حيث المساحة؟',
    optionsEn: [
      'Pacific Ocean',
      'Atlantic Ocean',
      'Indian Ocean',
      'Arctic Ocean',
    ],
    optionsAr: [
      'المحيط الهادئ',
      'المحيط الأطلسي',
      'المحيط الهندي',
      'المحيط المتجمد الشمالي',
    ],
    correctIndex: 0,
    factEn: 'Did you know? The Pacific Ocean covers more area than all Earth land combined!',
    factAr: 'هل تعلم؟ مساحة المحيط الهادئ تفوق مساحة جميع قارات ويابسة الأرض مجتمعة!',
  },
  {
    categoryEn: 'Science & Discovery 💡',
    categoryAr: 'العلماء والاكتشافات 💡',
    questionEn: 'Who developed the theory of General Relativity?',
    questionAr: 'من هو العالم الفيزيائي الذي وضع النظرية النسبية العامة؟',
    optionsEn: [
      'Albert Einstein',
      'Isaac Newton',
      'Nikola Tesla',
      'Galileo Galilei',
    ],
    optionsAr: [
      'ألبرت أينشتاين',
      'إسحاق نيوتن',
      'نيكولا تسلا',
      'غاليليو غاليلي',
    ],
    correctIndex: 0,
    factEn: 'Did you know? General Relativity revealed that gravity curves spacetime.',
    factAr: 'هل تعلم؟ أثبتت النسبية العامة أن الجاذبية تنتج عن انحناء نسيج الزمكان!',
  },
];

const TOTAL_ROUNDS = 5;

export default function DuolingoTrivia({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = useMemo(() => {
    return TRIVIA_BANK[currentIndex % TRIVIA_BANK.length];
  }, [currentIndex]);

  const category = isAr ? currentQ.categoryAr : currentQ.categoryEn;
  const question = isAr ? currentQ.questionAr : currentQ.questionEn;
  const options = isAr ? currentQ.optionsAr : currentQ.optionsEn;

  const handleSelectOption = useCallback(
    (index) => {
      if (feedback !== null) return;
      playSfx?.('tap');
      setSelectedIndex(index);

      const isCorrect = index === currentQ.correctIndex;

      if (isCorrect) {
        playSfx?.('ding');
        setStreak((s) => s + 1);
        setScore((sc) => sc + 15);
        setFeedback({
          isCorrect: true,
          title: isAr ? 'معلومة صحيحة تماماً! 🌟' : 'Spot on! Correct! 🌟',
          subtitle: isAr ? currentQ.factAr : currentQ.factEn,
        });
      } else {
        playSfx?.('error');
        setStreak(0);
        setFeedback({
          isCorrect: false,
          title: isAr ? 'إجابة خاطئة!' : 'Incorrect answer!',
          subtitle: isAr ? currentQ.factAr : currentQ.factEn,
        });
      }
    },
    [currentQ, feedback, isAr, playSfx]
  );

  // Keyboard shortcut listener for 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < options.length) {
          handleSelectOption(idx);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOption, options.length]);

  const handleContinue = () => {
    if (currentIndex + 1 >= TOTAL_ROUNDS) {
      awardPoints?.(score);
      setIsCompleted(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedIndex(null);
      setFeedback(null);
    }
  };

  const progressPercent = Math.round(((currentIndex + (feedback ? 1 : 0)) / TOTAL_ROUNDS) * 100);

  if (isCompleted) {
    return (
      <DuolingoVictoryScreen
        xpEarned={score + 25}
        accuracy={Math.min(100, Math.round((score / (TOTAL_ROUNDS * 15)) * 100))}
        streak={streak}
        title={isAr ? 'ارتقيت سلّم المعرفة!' : 'Knowledge Staircase Climbed!'}
        subtitle={
          isAr
            ? 'مخزون معرفي عام وعلمي متميز.'
            : 'Outstanding crystallized intelligence and rapid factual recall.'
        }
        onComplete={onBack}
      />
    );
  }

  return (
    <DuolingoGameShell progress={progressPercent} streak={streak} onClose={onBack}>
      <div className="duo-trivia-container" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Mascot Prompt */}
        <div className="duo-prompt-card">
          <span className="duo-prompt-mascot">🦁</span>
          <div className="duo-prompt-bubble">
            {isAr
              ? `تحدي سلّم المعرفة (${currentIndex + 1}/${TOTAL_ROUNDS}) · استخدم الأرقام 1-4 أو اضغط مباشرة`
              : `Knowledge Staircase (${currentIndex + 1}/${TOTAL_ROUNDS}) · Use keys 1-4 or tap directly`}
          </div>
        </div>

        {/* Question Card */}
        <div className="duo-trivia-question-card">
          <div className="duo-trivia-category-pill">{category}</div>
          <h2 className="duo-trivia-question-text">{question}</h2>
        </div>

        {/* 4 Stacked Chunky Choice Cards */}
        <div className="duo-trivia-stack">
          {options.map((opt, idx) => {
            let stateClass = '';
            if (feedback !== null) {
              if (idx === currentQ.correctIndex) {
                stateClass = 'correct';
              } else if (idx === selectedIndex) {
                stateClass = 'wrong';
              }
            } else if (idx === selectedIndex) {
              stateClass = 'selected';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`duo-trivia-option-btn ${stateClass}`}
                onClick={() => handleSelectOption(idx)}
                disabled={feedback !== null}
              >
                <div className="duo-trivia-key-badge">{idx + 1}</div>
                <span className="duo-trivia-option-text">{opt}</span>
              </button>
            );
          })}
        </div>

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
