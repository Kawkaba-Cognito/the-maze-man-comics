import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';

const SYNONYM_QUESTIONS = [
  {
    type: 'analogy',
    promptEn: 'Sun : Day :: Moon : ?',
    promptAr: 'الشمس : النهار :: القمر : ؟',
    categoryEn: 'Cosmic Analogy',
    categoryAr: 'قياس كوني',
    optionsEn: ['Night', 'Stars', 'Space', 'Cloud'],
    optionsAr: ['الليل', 'النجوم', 'الفضاء', 'السحاب'],
    correctIndex: 0,
    explanationEn: 'The sun shines in the day, just as the moon shines at night.',
    explanationAr: 'الشمس تميز النهار مثلما يضيء القمر عتمة الليل.',
  },
  {
    type: 'synonym',
    promptEn: 'Choose the closest synonym for "BRAVE":',
    promptAr: 'اختر المرادف الأقرب لكلمة "شُجاع":',
    categoryEn: 'Vocabulary',
    categoryAr: 'مفردات لغوية',
    optionsEn: ['Valiant', 'Cautious', 'Clever', 'Gentle'],
    optionsAr: ['مِقدام', 'حَذِر', 'ذكي', 'ودود'],
    correctIndex: 0,
    explanationEn: 'Valiant and Brave both describe courageous heroism.',
    explanationAr: 'المِقدام والشجاع يعبران عن الجرأة والإقدام.',
  },
  {
    type: 'analogy',
    promptEn: 'Pen : Writing :: Brush : ?',
    promptAr: 'القلم : الكتابة :: الفرشاة : ؟',
    categoryEn: 'Tool & Function',
    categoryAr: 'الأداة والوظيفة',
    optionsEn: ['Painting', 'Reading', 'Sculpting', 'Cutting'],
    optionsAr: ['الرسم', 'القراءة', 'النحت', 'القص'],
    correctIndex: 0,
    explanationEn: 'A pen is used for writing, a brush for painting.',
    explanationAr: 'القلم يُستخدم للكتابة والفرشاة للرسم والتلوين.',
  },
  {
    type: 'relation',
    promptEn: 'What is the core connection between "Mars" and "Jupiter"?',
    promptAr: 'ما الرابط الأساسي بين "المريخ" و "المشتري"؟',
    categoryEn: 'Semantic Link',
    categoryAr: 'الرابط الدلالي',
    optionsEn: [
      'Planets in the Solar System',
      'Twin burning stars',
      'Artificial satellites',
      'Dwarf asteroids',
    ],
    optionsAr: [
      'كواكب تدور في النظام الشمسي',
      'نجوم متوهجة توأم',
      'أقمار صناعية بشرية',
      'كويكبات قزمة',
    ],
    correctIndex: 0,
    explanationEn: 'Both Mars and Jupiter are major planets orbiting our Sun.',
    explanationAr: 'كلاهما كوكبان رئيسيان يدوران في مجموعتنا الشمسية.',
  },
  {
    type: 'synonym',
    promptEn: 'Choose the synonym for "INNOVATION":',
    promptAr: 'اختر المرادف الأقرب لكلمة "ابتكار":',
    categoryEn: 'Cognitive Reasoning',
    categoryAr: 'استدلال فكري',
    optionsEn: ['Invention', 'Repetition', 'Imitation', 'Routine'],
    optionsAr: ['إبداع واختراع', 'تكرار', 'تقليد', 'روتين'],
    correctIndex: 0,
    explanationEn: 'Innovation means inventing something novel and creative.',
    explanationAr: 'الابتكار هو إيجاد أفكار واختراعات غير مسبوقة.',
  },
];

const TOTAL_ROUNDS = 5;

export default function DuolingoSynonyms({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = useMemo(() => {
    return SYNONYM_QUESTIONS[currentIndex % SYNONYM_QUESTIONS.length];
  }, [currentIndex]);

  const options = isAr ? currentQ.optionsAr : currentQ.optionsEn;
  const prompt = isAr ? currentQ.promptAr : currentQ.promptEn;
  const category = isAr ? currentQ.categoryAr : currentQ.categoryEn;

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
          title: isAr ? 'رائع! إجابة دقيقة 🎯' : 'Superb! Spot on 🎯',
          subtitle: isAr ? currentQ.explanationAr : currentQ.explanationEn,
        });
      } else {
        playSfx?.('error');
        setStreak(0);
        setFeedback({
          isCorrect: false,
          title: isAr ? 'إجابة غير صحيحة' : 'Not quite right',
          subtitle: isAr ? currentQ.explanationAr : currentQ.explanationEn,
        });
      }
    },
    [currentQ, feedback, isAr, playSfx]
  );

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
        xpEarned={score + 20}
        accuracy={Math.min(100, Math.round((score / (TOTAL_ROUNDS * 15)) * 100))}
        streak={streak}
        title={isAr ? 'روابط الكلمات مكتملة!' : 'Word Links Mastered!'}
        subtitle={
          isAr
            ? 'قدرة استثنائية على الربط الدلالي والقياس اللفظي.'
            : 'Outstanding verbal reasoning & semantic fluency.'
        }
        onComplete={onBack}
      />
    );
  }

  return (
    <DuolingoGameShell progress={progressPercent} streak={streak} onClose={onBack}>
      <div className="duo-synonyms-container" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Mascot Prompt */}
        <div className="duo-prompt-card">
          <span className="duo-prompt-mascot">🦊</span>
          <div className="duo-prompt-bubble">
            {isAr
              ? `تدريب الدلالة اللغوية (${currentIndex + 1}/${TOTAL_ROUNDS}) · ${category}`
              : `Semantic Links Challenge (${currentIndex + 1}/${TOTAL_ROUNDS}) · ${category}`}
          </div>
        </div>

        {/* Big Word / Prompt Card */}
        <div className="duo-target-word-card">
          <span className="duo-target-word-label">{category}</span>
          <h2 className="duo-target-word-text">{prompt}</h2>
        </div>

        {/* 2x2 Chunky Tactile Cards */}
        <div className="duo-cards-options-grid">
          {options.map((opt, idx) => {
            let stateClass = '';
            if (feedback !== null) {
              if (idx === currentQ.correctIndex) {
                stateClass = 'is-correct';
              } else if (idx === selectedIndex) {
                stateClass = 'is-wrong';
              }
            } else if (idx === selectedIndex) {
              stateClass = 'is-selected';
            }

            return (
              <button
                key={idx}
                type="button"
                className={`duo-choice-card ${stateClass}`}
                onClick={() => handleSelectOption(idx)}
                disabled={feedback !== null}
              >
                <span className="duo-choice-badge">{['A', 'B', 'C', 'D'][idx]}</span>
                <span className="duo-choice-card-text">{opt}</span>
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
