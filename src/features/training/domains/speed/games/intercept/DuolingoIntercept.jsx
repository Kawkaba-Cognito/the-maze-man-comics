import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { RocketLaunch, Crosshair, Sparkle, Warning } from '@phosphor-icons/react';

const TOTAL_ROUNDS = 8;
const GATE_X_PERCENT = 72; // The sweet-spot gate center at 72% of track length

export default function DuolingoIntercept({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null); // { isCorrect: bool, title, subtitle }

  // Target config for the current round
  // 25% chance of being a decoy / no-go target starting round 3
  const isDecoy = useMemo(() => {
    return round >= 3 && (round === 3 || round === 6);
  }, [round]);

  // Motion physics
  const [runnerPos, setRunnerPos] = useState(0); // 0% to 100%
  const [runnerState, setRunnerState] = useState('moving'); // 'moving' | 'intercepted' | 'passed'
  const animFrameRef = useRef(null);
  const speedRef = useRef(0.65 + round * 0.08); // Speed rises with round
  const launchedRef = useRef(false);

  // Initialize trajectory on round change
  const startTrajectory = useCallback(() => {
    launchedRef.current = false;
    setRunnerState('moving');
    setRunnerPos(0);
    setFeedback(null);
    speedRef.current = 0.65 + round * 0.09;
  }, [round]);

  useEffect(() => {
    startTrajectory();
  }, [round, startTrajectory]);

  // Motion update loop
  useEffect(() => {
    if (isCompleted || feedback || runnerState !== 'moving') return;

    let pos = 0;
    const animate = () => {
      pos += speedRef.current;
      setRunnerPos(pos);

      if (pos >= 100) {
        // Runner escaped gate
        if (isDecoy) {
          // Player correctly avoided decoy!
          playSfx?.('ding');
          setStreak((s) => s + 1);
          setScore((sc) => sc + 50);
          setFeedback({
            isCorrect: true,
            title: isAr ? 'تركيز ذكي! تجنبت الفخ المحظور' : 'Smart Inhibition! Decoy Avoided',
            subtitle: isAr ? '+50 نقطة كبح استجابة وتحكم دقيق' : '+50 XP for perfect response inhibition',
          });
        } else {
          // Missed intercepting target
          playSfx?.('error');
          setStreak(0);
          setFeedback({
            isCorrect: false,
            title: isAr ? 'فاتتك الفرصة! عبر الهدف البوابة' : 'Too Late! Target Slipped Past',
            subtitle: isAr ? 'راقب التوقيت بدقة واضغط زر الإطلاق' : 'Watch trajectory and launch inside the ring',
          });
        }
        setRunnerState('passed');
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [round, isCompleted, feedback, runnerState, isDecoy, isAr, playSfx]);

  // Handle Launch Intercept
  const handleLaunch = useCallback(() => {
    if (launchedRef.current || runnerState !== 'moving' || feedback) return;
    launchedRef.current = true;
    cancelAnimationFrame(animFrameRef.current);

    if (isDecoy) {
      // Struck a decoy = commission error
      playSfx?.('error');
      setStreak(0);
      setRunnerState('intercepted');
      setFeedback({
        isCorrect: false,
        title: isAr ? 'تحذير! اعترضت فخاً ممنوعاً' : 'Warning! Struck a Decoy',
        subtitle: isAr ? 'الأهداف الحمراء التحذيرية يجب تركها تمر بسلام' : 'Red hazard decoys must NOT be intercepted',
      });
      return;
    }

    // Delta from gate center
    const delta = Math.abs(runnerPos - GATE_X_PERCENT);

    if (delta <= 6) {
      // Perfect intercept!
      playSfx?.('ding');
      const pts = 80;
      setScore((s) => s + pts);
      setStreak((st) => st + 1);
      setRunnerState('intercepted');
      setFeedback({
        isCorrect: true,
        title: isAr ? '⚡ اعتراض فائق ومثالي!' : '⚡ Perfect Intercept Hit!',
        subtitle: isAr
          ? `توقيت رد فعل لا يُصدق (+${pts} XP)`
          : `Precision timing within ±15ms window (+${pts} XP)`,
      });
    } else if (delta <= 14) {
      // Good hit
      playSfx?.('ding');
      const pts = 50;
      setScore((s) => s + pts);
      setStreak((st) => st + 1);
      setRunnerState('intercepted');
      setFeedback({
        isCorrect: true,
        title: isAr ? '🎯 إصابة ناجحة!' : '🎯 Target Intercepted!',
        subtitle: isAr ? `+${pts} XP في بنك نقاطك` : `+${pts} XP added to your score`,
      });
    } else {
      // Early or late miss
      playSfx?.('error');
      setStreak(0);
      setRunnerState('intercepted');
      const isEarly = runnerPos < GATE_X_PERCENT;
      setFeedback({
        isCorrect: false,
        title: isEarly
          ? (isAr ? 'إطلاق مبكر جداً!' : 'Launched Too Early!')
          : (isAr ? 'إطلاق متأخر!' : 'Launched Too Late!'),
        subtitle: isAr
          ? 'انتظر حتى يدخل الجرم منتصف حلقة الاعتراض الذهبية'
          : 'Wait until the target enters the radiant ring',
      });
    }
  }, [runnerPos, runnerState, feedback, isDecoy, isAr, playSfx]);

  // Keyboard shortcut: Spacebar launches intercept
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (feedback) {
          handleNextRound();
        } else {
          handleLaunch();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleLaunch, feedback]);

  // Next round
  const handleNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      const finalXp = Math.max(score, 50);
      awardPoints?.(finalXp);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
    }
  };

  // Victory Screen
  if (isCompleted) {
    const accuracy = Math.round((score / (TOTAL_ROUNDS * 80)) * 100) || 88;
    return (
      <DuolingoVictoryScreen
        xpEarned={score}
        accuracy={Math.min(100, accuracy)}
        streak={streak}
        title={isAr ? 'دفاع واعتراض حركي خارق!' : 'Coincidence Timing Master!'}
        subtitle={
          isAr
            ? `أثبت سرعة رد فعل وتوقيت كبح استثنائية عبر ${TOTAL_ROUNDS} جولات اعتراض!`
            : `Phenomenal signed reaction time and response inhibition across all ${TOTAL_ROUNDS} trials!`
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
        <div className="duo-prompt-mascot">🎯</div>
        <div className="duo-prompt-bubble">
          {isDecoy
            ? (isAr ? '⚠️ احترس! هذا فخ محظور (Decoy)، لا تعترضه واتركه يمر!' : '⚠️ Beware! Red hazard decoy — DO NOT intercept!')
            : (isAr ? 'اضغط زر الإطلاق بدقة فور دخول الجرم الدائرة الذهبية!' : 'Launch precisely when the target reaches the golden crosshair!')}
        </div>
      </div>

      {/* Main Intercept Arena */}
      <div className="duo-intercept-arena">
        {/* Dynamic Timing Trajectory Viewport */}
        <div className="duo-intercept-viewport">
          {/* Cosmic Background Track */}
          <div className="duo-intercept-rail" />

          {/* Sweet Spot Intercept Gate Zone */}
          <div
            className="duo-intercept-gate-zone"
            style={{ left: `${GATE_X_PERCENT}%` }}
          >
            <div className="duo-intercept-crosshair" />
          </div>

          {/* Moving Kinetic Runner / Projectile */}
          <div
            className="duo-intercept-runner"
            style={{
              left: `${runnerPos}%`,
              background: isDecoy
                ? 'radial-gradient(circle, #ff4b4b 0%, #b91c1c 100%)'
                : 'radial-gradient(circle, #2586f7 0%, #ff7800 100%)',
              border: isDecoy ? '2px solid #fecaca' : '2px solid #ffc21c',
            }}
          >
            {isDecoy ? '⚠️' : '☄️'}
          </div>
        </div>

        {/* Tactile 3D Launch Intercept Button */}
        <button
          type="button"
          className="duo-launch-btn"
          onClick={handleLaunch}
          disabled={runnerState !== 'moving' || !!feedback}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <RocketLaunch size={32} weight="fill" />
            <span>{isAr ? 'اطلق الاعتراض 🚀' : 'LAUNCH INTERCEPT 🚀'}</span>
          </div>
        </button>

        <p style={{ fontSize: 13, fontWeight: 700, color: '#888', margin: '4px 0 0' }}>
          {isAr ? 'يمكنك أيضاً الضغط على زر المسافة (Spacebar)' : 'You can also press Spacebar to launch'}
        </p>
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
