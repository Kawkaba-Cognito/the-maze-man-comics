import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from '@phosphor-icons/react';

const DIRECTIONS = [
  { id: 'up', labelAr: 'أعلى', labelEn: 'UP', icon: ArrowUp },
  { id: 'down', labelAr: 'أسفل', labelEn: 'DOWN', icon: ArrowDown },
  { id: 'left', labelAr: 'يسار', labelEn: 'LEFT', icon: ArrowLeft },
  { id: 'right', labelAr: 'يمين', labelEn: 'RIGHT', icon: ArrowRight },
];

const TOTAL_ROUNDS = 8;

export default function DuolingoMirrorWorld({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Is this round mirrored (inversion rule)?
  // Rounds 1-3 normal, Rounds 4-8 mirrored or randomized
  const isMirrored = round >= 4;

  const [targetDir, setTargetDir] = useState('up');

  // Pick random target on round change
  useEffect(() => {
    const rand = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)].id;
    setTargetDir(rand);
    setFeedback(null);
  }, [round]);

  const handleChooseDirection = useCallback((chosenId) => {
    // If mirrored, the correct response is the OPPOSITE direction
    let expectedId = targetDir;
    if (isMirrored) {
      if (targetDir === 'up') expectedId = 'down';
      else if (targetDir === 'down') expectedId = 'up';
      else if (targetDir === 'left') expectedId = 'right';
      else if (targetDir === 'right') expectedId = 'left';
    }

    const isCorrect = chosenId === expectedId;

    if (isCorrect) {
      playSfx?.('ding');
      setStreak((s) => s + 1);
      setScore((sc) => sc + 10);
      setFeedback({
        isCorrect: true,
        title: isAr ? 'ممتاز! تكيف عصبي سريع' : 'Great reflex!',
        subtitle: isMirrored
          ? (isAr ? 'عكست الاتجاه ببراعة في عالم المرآة!' : 'Successfully inverted the direction in Mirror World!')
          : (isAr ? 'استجابة صحيحة في الاتجاه المباشر!' : 'Direct match accurate!'),
      });
    } else {
      playSfx?.('error');
      setStreak(0);
      setFeedback({
        isCorrect: false,
        title: isAr ? 'انتبه لقاعدة المرآة!' : 'Watch out for the Mirror Rule!',
        subtitle: isMirrored
          ? (isAr ? `في المرآة: عكس (${targetDir}) هو (${expectedId})` : `Mirrored: opposite of (${targetDir}) is (${expectedId})`)
          : (isAr ? `الاتجاه المباشر كان (${expectedId})` : `Direct direction was (${expectedId})`),
      });
    }
  }, [isMirrored, targetDir, isAr, playSfx]);

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
        accuracy={Math.round((score / (TOTAL_ROUNDS * 10)) * 100) || 80}
        streak={streak}
        title={isAr ? 'أتقنت عالم المرآة!' : 'Mirror World Mastered!'}
        subtitle={isAr ? 'مرونة معرفية وسرعة تكيف فائقة مع تبديل القواعد!' : 'Exceptional cognitive agility and rapid rule inversion!'}
        onComplete={onBack}
      />
    );
  }

  const targetMeta = DIRECTIONS.find((d) => d.id === targetDir) || DIRECTIONS[0];
  const TargetIcon = targetMeta.icon;
  const progressPercent = ((round - 1) / TOTAL_ROUNDS) * 100;

  return (
    <DuolingoGameShell
      progress={progressPercent}
      streak={streak}
      onClose={onBack}
    >
      {/* Duolingo Rule Banner Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: isMirrored ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' : 'linear-gradient(135deg, #2586f7 0%, #1d4ed8 100%)',
          borderRadius: 20,
          padding: '16px 20px',
          color: '#ffffff',
          borderBottom: isMirrored ? '5px solid #be185d' : '5px solid #1e40af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.9 }}>
            {isMirrored ? (isAr ? 'قاعدة المرآة المعكوسة 🪞' : 'MIRROR INVERSION RULE 🪞') : (isAr ? 'القاعدة المباشرة 🧭' : 'DIRECT RULE 🧭')}
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, marginTop: 4 }}>
            {isMirrored ? (isAr ? 'اضغط الاتجاه المعاكس!' : 'Press the OPPOSITE direction!') : (isAr ? 'اضغط نفس الاتجاه الظاهر!' : 'Press the EXACT direction shown!')}
          </div>
        </div>
        <div style={{ fontSize: 32 }}>{isMirrored ? '🪞' : '🧭'}</div>
      </div>

      {/* Target Arrow Display Box */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: 28,
          background: '#ffffff',
          border: '3px solid #e5e5e5',
          borderBottom: '6px solid #e5e5e5',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 32px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.06)',
          position: 'relative',
        }}
      >
        <TargetIcon size={64} weight="bold" color={isMirrored ? '#ec4899' : '#2586f7'} />
        <span style={{ fontSize: 13, fontWeight: 900, color: '#64748b', marginTop: 4 }}>
          {isAr ? targetMeta.labelAr : targetMeta.labelEn}
        </span>
      </div>

      {/* 4-Way Chunky Directional Keypad (Duolingo Style D-Pad) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          width: '100%',
          maxWidth: 320,
          margin: '0 auto',
        }}
      >
        <div />
        {/* UP */}
        <button
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => handleChooseDirection('up')}
          className="duo-action-btn"
          style={{ height: 72, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="UP"
        >
          <ArrowUp size={32} weight="bold" color="#2586f7" />
        </button>
        <div />

        {/* LEFT */}
        <button
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => handleChooseDirection('left')}
          className="duo-action-btn"
          style={{ height: 72, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="LEFT"
        >
          <ArrowLeft size={32} weight="bold" color="#2586f7" />
        </button>

        {/* CENTER ICON */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
          ☄️
        </div>

        {/* RIGHT */}
        <button
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => handleChooseDirection('right')}
          className="duo-action-btn"
          style={{ height: 72, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="RIGHT"
        >
          <ArrowRight size={32} weight="bold" color="#2586f7" />
        </button>

        <div />
        {/* DOWN */}
        <button
          type="button"
          disabled={Boolean(feedback)}
          onClick={() => handleChooseDirection('down')}
          className="duo-action-btn"
          style={{ height: 72, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="DOWN"
        >
          <ArrowDown size={32} weight="bold" color="#2586f7" />
        </button>
        <div />
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
