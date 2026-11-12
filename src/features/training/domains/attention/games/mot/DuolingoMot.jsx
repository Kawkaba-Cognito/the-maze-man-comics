import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { SlidersHorizontal, Check, X, Sparkle, Eye, Flame } from '@phosphor-icons/react';

const TOTAL_ROUNDS = 5;

// Difficulty tiers: 3 to 6 targets
const MOT_DIFFICULTIES = [
  {
    targets: 3,
    total: 7,
    speed: 1.2,
    trackDuration: 4000,
    labelEn: '3 Targets (Starter)',
    labelAr: '3 أهداف (مبتدئ)',
    shortLabel: '3 أهداف',
    descAr: 'تتبّع 3 أهداف وسط 7 كرات متحركة. سرعة هادئة لاكتساب المهارة.',
    descEn: 'Track 3 targets among 7 drifting orbs. Steady speed for focus.',
    color: '#58cc02',
  },
  {
    targets: 4,
    total: 10,
    speed: 1.5,
    trackDuration: 4500,
    labelEn: '4 Targets (Standard)',
    labelAr: '4 أهداف (قياسي)',
    shortLabel: '4 أهداف',
    descAr: 'تتبّع 4 أهداف وسط 10 كرات. الحمل الإدراكي النموذجي للانتباه الديناميكي.',
    descEn: 'Track 4 targets among 10 orbs. Standard cognitive tracking load.',
    color: '#ff7800',
  },
  {
    targets: 5,
    total: 13,
    speed: 1.8,
    trackDuration: 5000,
    labelEn: '5 Targets (Advanced)',
    labelAr: '5 أهداف (متقدم)',
    shortLabel: '5 أهداف',
    descAr: 'تتبّع 5 أهداف وسط 13 كرة. كثافة عالية وتداخل مستمر يتطلب يقظة قصوى.',
    descEn: 'Track 5 targets among 13 orbs. Dense encounters demanding high vigilance.',
    color: '#2586f7',
  },
  {
    targets: 6,
    total: 16,
    speed: 2.1,
    trackDuration: 5500,
    labelEn: '6 Targets (Master)',
    labelAr: '6 أهداف (خارق)',
    shortLabel: '6 أهداف',
    descAr: 'تتبّع 6 أهداف وسط 16 كرة. أقصى سعة للانتباه البصري المتعدد.',
    descEn: 'Track 6 targets among 16 orbs. Peak visual tracking capacity.',
    color: '#9333ea',
  },
];

export default function DuolingoMot({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [targetCount, setTargetCount] = useState(3);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Phases: 'cue' (highlight targets) -> 'track' (drift) -> 'respond' (tap) -> 'feedback'
  const [phase, setPhase] = useState('cue');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const orbsRef = useRef([]);
  const phaseRef = useRef('cue');
  phaseRef.current = phase;

  const currentDiff = useMemo(() => {
    return MOT_DIFFICULTIES.find((d) => d.targets === targetCount) || MOT_DIFFICULTIES[0];
  }, [targetCount]);

  // Initialize orbs for a round
  const setupOrbs = useCallback(() => {
    const width = 480;
    const height = 360;
    const radius = 22;
    const total = currentDiff.total;
    const targets = currentDiff.targets;

    const newOrbs = [];
    const minSpacing = radius * 2.4;

    for (let i = 0; i < total; i++) {
      let x = 0;
      let y = 0;
      let safe = false;
      let attempts = 0;

      while (!safe && attempts < 100) {
        attempts++;
        x = radius + 15 + Math.random() * (width - (radius + 15) * 2);
        y = radius + 15 + Math.random() * (height - (radius + 15) * 2);

        safe = newOrbs.every((o) => {
          const dx = o.x - x;
          const dy = o.y - y;
          return Math.hypot(dx, dy) >= minSpacing;
        });
      }

      // Random drifting velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = currentDiff.speed * (0.85 + Math.random() * 0.3);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      newOrbs.push({
        id: i,
        x,
        y,
        vx,
        vy,
        r: radius,
        isTarget: i < targets,
      });
    }

    orbsRef.current = newOrbs;
    setSelectedIds(new Set());
    setFeedback(null);
    setPhase('cue');
  }, [currentDiff]);

  // Initialize or reset round
  useEffect(() => {
    setupOrbs();
  }, [round, targetCount, setupOrbs]);

  // Handle phase progression timer: cue -> track -> respond
  useEffect(() => {
    let timer;
    if (phase === 'cue') {
      timer = setTimeout(() => {
        setPhase('track');
      }, 2200);
    } else if (phase === 'track') {
      timer = setTimeout(() => {
        setPhase('respond');
        playSfx?.('tap');
      }, currentDiff.trackDuration);
    }
    return () => clearTimeout(timer);
  }, [phase, currentDiff.trackDuration, playSfx]);

  // Physics & Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = 480;
    const height = 360;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Arena background: soft cosmic gradient with rounded corner clip
      ctx.save();
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#edf2f7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle celestial stars / grid dots
      ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
      for (let sx = 20; sx < width; sx += 40) {
        for (let sy = 20; sy < height; sy += 40) {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const orbs = orbsRef.current;
      const currentP = phaseRef.current;

      // Update positions if tracking
      if (currentP === 'track') {
        for (let i = 0; i < orbs.length; i++) {
          const o = orbs[i];
          o.x += o.vx;
          o.y += o.vy;

          // Wall bounces with padding
          if (o.x - o.r < 10) {
            o.x = 10 + o.r;
            o.vx = Math.abs(o.vx);
          } else if (o.x + o.r > width - 10) {
            o.x = width - 10 - o.r;
            o.vx = -Math.abs(o.vx);
          }

          if (o.y - o.r < 10) {
            o.y = 10 + o.r;
            o.vy = Math.abs(o.vy);
          } else if (o.y + o.r > height - 10) {
            o.y = height - 10 - o.r;
            o.vy = -Math.abs(o.vy);
          }
        }
      }

      // Draw each orb
      const now = performance.now();
      orbs.forEach((o) => {
        const isSelected = selectedIds.has(o.id);

        ctx.save();
        ctx.beginPath();

        // Determine appearance based on Phase
        if (currentP === 'cue') {
          if (o.isTarget) {
            // Radiant Solar Orange Pulsing Glow
            const pulse = 1 + Math.sin(now / 150) * 0.12;
            const glowGrad = ctx.createRadialGradient(o.x, o.y, 4, o.x, o.y, o.r * 1.5 * pulse);
            glowGrad.addColorStop(0, 'rgba(255, 120, 0, 0.45)');
            glowGrad.addColorStop(1, 'rgba(255, 120, 0, 0)');
            ctx.fillStyle = glowGrad;
            ctx.arc(o.x, o.y, o.r * 1.5 * pulse, 0, Math.PI * 2);
            ctx.fill();

            // Orb body - Nayzak Solar Orange
            ctx.beginPath();
            const orbGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            orbGrad.addColorStop(0, '#ffaa00');
            orbGrad.addColorStop(0.7, '#ff7800');
            orbGrad.addColorStop(1, '#d95f00');
            ctx.fillStyle = orbGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Target icon / star inside
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', o.x, o.y);
          } else {
            // Idle Cosmic Blue Orb
            const orbGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            orbGrad.addColorStop(0, '#60a5fa');
            orbGrad.addColorStop(0.7, '#2586f7');
            orbGrad.addColorStop(1, '#1d4ed8');
            ctx.fillStyle = orbGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }
        } else if (currentP === 'track') {
          // In Tracking: ALL ORBS LOOK IDENTICAL (Cosmic Blue)
          const orbGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
          orbGrad.addColorStop(0, '#60a5fa');
          orbGrad.addColorStop(0.7, '#2586f7');
          orbGrad.addColorStop(1, '#1d4ed8');
          ctx.fillStyle = orbGrad;
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fill();

          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();

          // Subtle glossy reflection
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.ellipse(o.x - 5, o.y - 7, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentP === 'respond') {
          // Respond phase: Player can select
          if (isSelected) {
            // Selected highlight - Orange Ring + Glow
            ctx.arc(o.x, o.y, o.r + 6, 0, Math.PI * 2);
            ctx.lineWidth = 3.5;
            ctx.strokeStyle = '#ff7800';
            ctx.stroke();

            // Orb body in Gold/Orange
            ctx.beginPath();
            const selGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            selGrad.addColorStop(0, '#ffc21c');
            selGrad.addColorStop(0.7, '#ff7800');
            selGrad.addColorStop(1, '#d95f00');
            ctx.fillStyle = selGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            // Checkmark
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', o.x, o.y);
          } else {
            // Unselected orb
            const orbGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            orbGrad.addColorStop(0, '#94a3b8');
            orbGrad.addColorStop(0.7, '#64748b');
            orbGrad.addColorStop(1, '#475569');
            ctx.fillStyle = orbGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }
        } else if (currentP === 'feedback') {
          // Feedback revelation
          if (o.isTarget && isSelected) {
            // Correct Hit: Emerald Green with check
            const hitGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            hitGrad.addColorStop(0, '#86efac');
            hitGrad.addColorStop(0.7, '#58cc02');
            hitGrad.addColorStop(1, '#16a34a');
            ctx.fillStyle = hitGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', o.x, o.y);
          } else if (o.isTarget && !isSelected) {
            // Missed Target: Radiant Gold Dashed Ring
            ctx.beginPath();
            ctx.arc(o.x, o.y, o.r + 5, 0, Math.PI * 2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffc21c';
            ctx.setLineDash([5, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            const missGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            missGrad.addColorStop(0, '#fef08a');
            missGrad.addColorStop(0.7, '#eab308');
            missGrad.addColorStop(1, '#ca8a04');
            ctx.fillStyle = missGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', o.x, o.y);
          } else if (!o.isTarget && isSelected) {
            // False Alarm: Red with X
            const errGrad = ctx.createRadialGradient(o.x - 5, o.y - 5, 2, o.x, o.y, o.r);
            errGrad.addColorStop(0, '#fca5a5');
            errGrad.addColorStop(0.7, '#ff4b4b');
            errGrad.addColorStop(1, '#dc2626');
            ctx.fillStyle = errGrad;
            ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✕', o.x, o.y);
          } else {
            // Correctly ignored distractor
            ctx.fillStyle = '#cbd5e1';
            ctx.arc(o.x, o.y, o.r * 0.85, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [selectedIds]);

  // Handle canvas clicks during respond phase
  const handleCanvasClick = (e) => {
    if (phase !== 'respond') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 480 / rect.width;
    const scaleY = 360 / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked orb
    const clickedOrb = orbsRef.current.find((o) => {
      const dist = Math.hypot(o.x - clickX, o.y - clickY);
      return dist <= o.r + 10;
    });

    if (clickedOrb) {
      playSfx?.('tap');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(28);
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(clickedOrb.id)) {
          next.delete(clickedOrb.id);
        } else {
          // Optional limit to targetCount
          if (next.size < currentDiff.targets) {
            next.add(clickedOrb.id);
          }
        }
        return next;
      });
    }
  };

  // Check Round Answer
  const handleCheckAnswer = () => {
    if (phase !== 'respond') return;

    let correctHits = 0;
    let falseAlarms = 0;

    orbsRef.current.forEach((o) => {
      if (o.isTarget && selectedIds.has(o.id)) correctHits++;
      if (!o.isTarget && selectedIds.has(o.id)) falseAlarms++;
    });

    const isFlawless = correctHits === currentDiff.targets && falseAlarms === 0;
    setPhase('feedback');

    if (isFlawless) {
      playSfx?.('ding');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([40, 60, 40]);
      }
      setStreak((s) => s + 1);
      setScore((sc) => sc + 10);
      setFeedback({
        isCorrect: true,
        title: isAr ? 'تركيز أسطوري! تم رصد جميع الأهداف 🎯' : 'Spot on! All targets tracked!',
        subtitle: isAr
          ? `+10 نقاط خبرة · سلسلة حماسة ${streak + 1} 🔥`
          : `+10 XP · Streak ${streak + 1} 🔥`,
      });
    } else {
      playSfx?.('error');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }
      setFeedback({
        isCorrect: false,
        title: isAr ? 'أفلتت بعض الأهداف أو حددت كرات خاطئة' : 'Missed targets or clicked distractors',
        subtitle: isAr
          ? `أصبت ${correctHits} من أصل ${currentDiff.targets} أهداف مطلوبة.`
          : `Tracked ${correctHits} of ${currentDiff.targets} required targets.`,
      });
    }
  };

  const handleNextRound = () => {
    if (round >= TOTAL_ROUNDS) {
      const earnedXp = targetCount * 12 + 20;
      awardPoints?.(earnedXp);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
    }
  };

  const handleSelectDifficulty = (targets) => {
    playSfx?.('click');
    setTargetCount(targets);
    setRound(1);
    setStreak(0);
    setScore(0);
    setIsDiffModalOpen(false);
  };

  if (isCompleted) {
    const earnedXp = targetCount * 12 + 20;
    return (
      <DuolingoVictoryScreen
        xpEarned={earnedXp}
        accuracy={Math.round((score / (TOTAL_ROUNDS * 10)) * 100) || 85}
        streak={streak}
        title={isAr ? 'أتقنت تتبّع الأهداف المتعددة!' : 'Multiple Object Tracking Complete!'}
        subtitle={isAr
          ? `قدرة خارقة على تتبّع ${targetCount} أهداف في الفضاء المتغير!`
          : `Spectacular cognitive capacity tracking ${targetCount} dynamic targets!`}
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
      headerSlot={
        <button
          type="button"
          className="duo-level-pill"
          onClick={() => {
            playSfx?.('click');
            setIsDiffModalOpen(true);
          }}
          title={isAr ? 'تغيير عدد الأهداف والصعوبة' : 'Select Target Count'}
        >
          <SlidersHorizontal size={15} weight="bold" />
          <span>{isAr ? currentDiff.shortLabel : `${currentDiff.targets} Targets`}</span>
        </button>
      }
    >
      {/* Duolingo Prompt Card with Mascot Speech */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">
          {phase === 'cue' ? '👁️' : phase === 'track' ? '🛸' : '🎯'}
        </div>
        <div className="duo-prompt-bubble">
          {phase === 'cue' && (
            isAr ? (
              <>
                احفظ الكرات المضيئة <span style={{ color: '#ff7800', fontWeight: 900 }}>({currentDiff.targets} كرات)</span> قبل أن تبدأ بالحركة!
              </>
            ) : (
              <>
                Memorize the glowing orbs <span style={{ color: '#ff7800', fontWeight: 900 }}>({currentDiff.targets} targets)</span> before they move!
              </>
            )
          )}
          {phase === 'track' && (
            isAr ? (
              <>تتبّعها بعينيك بدقة وهي تسبح وتدور في الفضاء...</>
            ) : (
              <>Track them closely with your eyes as they drift and bounce...</>
            )
          )}
          {phase === 'respond' && (
            isAr ? (
              <>
                حدد الكرات التي كانت تضيء! ({selectedIds.size}/{currentDiff.targets})
              </>
            ) : (
              <>
                Tap the orbs that were initially glowing! ({selectedIds.size}/{currentDiff.targets})
              </>
            )
          )}
          {phase === 'feedback' && (
            isAr ? (
              <>راجع مسارات الأهداف أدناه ثم تابع المسار!</>
            ) : (
              <>Review target positions below, then proceed!</>
            )
          )}
        </div>
      </div>

      {/* Dynamic Floating Arena Canvas */}
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          aspectRatio: '480 / 360',
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          border: '3px solid #e5e5e5',
          borderBottom: '6px solid #d5d5d5',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          margin: '0 auto 24px',
          background: '#f8fafc',
          cursor: phase === 'respond' ? 'pointer' : 'default',
        }}
      >
        <canvas
          ref={canvasRef}
          width={480}
          height={360}
          onClick={handleCanvasClick}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />

        {/* Phase Overlay Badge */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(4px)',
            border: '2px solid #e2e8f0',
            borderRadius: 12,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 900,
            color: phase === 'cue' ? '#ff7800' : phase === 'track' ? '#2586f7' : '#58cc02',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {phase === 'cue' && <Sparkle size={14} weight="bold" color="#ff7800" />}
          {phase === 'track' && <Eye size={14} weight="bold" color="#2586f7" />}
          {phase === 'respond' && <Check size={14} weight="bold" color="#58cc02" />}
          <span>
            {phase === 'cue'
              ? isAr ? 'رصد الأهداف' : 'CUE'
              : phase === 'track'
              ? isAr ? 'تتبّع الحركة' : 'TRACKING'
              : phase === 'respond'
              ? isAr ? 'حدد الأهداف' : 'TAP TARGETS'
              : isAr ? 'النتيجة' : 'RESULT'}
          </span>
        </div>
      </div>

      {/* Floating Bottom Verification CTA when drawer is closed */}
      {!feedback && (
        <button
          type="button"
          onClick={handleCheckAnswer}
          disabled={phase !== 'respond' || selectedIds.size === 0}
          style={{
            width: '100%',
            maxWidth: 420,
            background: phase === 'respond' && selectedIds.size > 0 ? '#58cc02' : '#e5e5e5',
            color: phase === 'respond' && selectedIds.size > 0 ? '#ffffff' : '#afafaf',
            fontSize: 16,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: 16,
            borderRadius: 18,
            border: 'none',
            borderBottom:
              phase === 'respond' && selectedIds.size > 0
                ? '5px solid #46a302'
                : '5px solid #cccccc',
            cursor: phase === 'respond' && selectedIds.size > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.1s ease',
          }}
        >
          {phase === 'cue'
            ? isAr ? 'استعد للتركيز...' : 'Get Ready...'
            : phase === 'track'
            ? isAr ? 'جاري التتبّع...' : 'Tracking In Progress...'
            : isAr ? `تحقق من الإجابة (${selectedIds.size}/${currentDiff.targets})` : `Check (${selectedIds.size}/${currentDiff.targets})`}
        </button>
      )}

      {/* Sliding Feedback Drawer */}
      <DuolingoFeedbackDrawer
        isOpen={Boolean(feedback)}
        isCorrect={feedback?.isCorrect}
        title={feedback?.title}
        subtitle={feedback?.subtitle}
        buttonLabel={
          isAr
            ? round === TOTAL_ROUNDS
              ? 'عرض النتيجة النهائية'
              : 'السؤال التالي'
            : round === TOTAL_ROUNDS
            ? 'View Results'
            : 'Next Question'
        }
        onContinue={handleNextRound}
      />

      {/* Difficulty Selector Modal (3 to 6 targets) */}
      {isDiffModalOpen && (
        <div className="duo-modal-overlay" onClick={() => setIsDiffModalOpen(false)}>
          <div className="duo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="duo-modal-header">
              <h2 className="duo-modal-title">
                <SlidersHorizontal size={22} weight="bold" color="#ff7800" />
                <span>{isAr ? 'اختيار عدد الأهداف' : 'Select Target Load'}</span>
              </h2>
              <button
                type="button"
                className="duo-modal-close"
                onClick={() => setIsDiffModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.4 }}>
              {isAr
                ? 'اختر عدد الكرات المطلوب تتبّعها في وقت واحد لاختبار سعة انتباهك البصري.'
                : 'Select the number of simultaneous targets to track.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {MOT_DIFFICULTIES.map((d) => {
                const isActive = targetCount === d.targets;
                return (
                  <button
                    key={d.targets}
                    type="button"
                    onClick={() => handleSelectDifficulty(d.targets)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 16px',
                      borderRadius: 16,
                      background: isActive ? '#fff7ed' : '#ffffff',
                      border: isActive ? '3px solid #ff7800' : '2px solid #e5e5e5',
                      borderBottom: isActive ? '5px solid #d95f00' : '4px solid #d9d9d9',
                      cursor: 'pointer',
                      textAlign: isAr ? 'right' : 'left',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 900, color: isActive ? '#ff7800' : '#1e293b' }}>
                        {isAr ? d.labelAr : d.labelEn}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
                        {isAr ? d.descAr : d.descEn}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: isActive ? '#ff7800' : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 16,
                        flexShrink: 0,
                      }}
                    >
                      {d.targets}★
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </DuolingoGameShell>
  );
}
