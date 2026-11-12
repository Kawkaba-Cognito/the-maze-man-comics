import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import DuolingoGameShell from '../../../../shared/DuolingoGameShell';
import DuolingoFeedbackDrawer from '../../../../shared/DuolingoFeedbackDrawer';
import DuolingoVictoryScreen from '../../../../shared/DuolingoVictoryScreen';
import { SlidersHorizontal, ArrowLeft, ArrowRight, Rocket, Check, X, Sparkle } from '@phosphor-icons/react';

const TOTAL_ROUNDS = 5;

// Color bays configuration aligned with Nayzak brand palette
const DOCKING_BAYS = [
  { id: 'orange', nameAr: 'المرفأ البرتقالي', nameEn: 'Solar Orange Bay', color: '#ff7800', border: '#d95f00', icon: '🪐' },
  { id: 'blue', nameAr: 'المرفأ الأزرق', nameEn: 'Cosmic Blue Bay', color: '#2586f7', border: '#106ad6', icon: '🌌' },
  { id: 'gold', nameAr: 'المرفأ الذهبي', nameEn: 'Radiant Gold Bay', color: '#ffc21c', border: '#e0a300', icon: '⭐' },
  { id: 'green', nameAr: 'المرفأ الأخضر', nameEn: 'Emerald Bay', color: '#58cc02', border: '#46a302', icon: '🍀' },
];

const LEVELS = [
  {
    level: 1,
    titleEn: 'Level 1: Orbital Binary',
    titleAr: 'المستوى 1: التبديل الثنائي',
    descAr: 'مرفآن ومفتاح تحويل واحد. مقدمة للتحكم في مسارات الملاحة.',
    descEn: '2 docking bays and 1 junction switch.',
    baysCount: 2,
    switchesCount: 1,
    speed: 1.0,
  },
  {
    level: 2,
    titleEn: 'Level 2: Triple Nexus',
    titleAr: 'المستوى 2: الملتقى الثلاثي',
    descAr: '3 مرافئ ومفتاحا تحويل. يتطلب تخطيطاً سريعاً ومتابعة متزامنة.',
    descEn: '3 docking bays and 2 junction switches.',
    baysCount: 3,
    switchesCount: 2,
    speed: 1.2,
  },
  {
    level: 3,
    titleEn: 'Level 3: Quad Fleet',
    titleAr: 'المستوى 3: شبكة الأسطول الرباعي',
    descAr: '4 مرافئ و3 مفاتيح شبكية. تبديل الانتباه المعقد وكبح الأخطاء.',
    descEn: '4 docking bays with 3 binary routing switches.',
    baysCount: 4,
    switchesCount: 3,
    speed: 1.4,
  },
  {
    level: 4,
    titleEn: 'Level 4: Hyper Navigator',
    titleAr: 'المستوى 4: الملاحة الفائقة',
    descAr: '4 مرافئ بسرعة إطلاق أعلى وتحدي مستمر للانتباه التنفيذي.',
    descEn: 'High speed 4-bay routing with rapid attention switching.',
    baysCount: 4,
    switchesCount: 3,
    speed: 1.8,
  },
  {
    level: 5,
    titleEn: 'Level 5: Cosmic Commander',
    titleAr: 'المستوى 5: قائد المجرة الخارق',
    descAr: 'أقصى تحدٍ لانتباه التبديل وتحديد المسارات الفضائية الدقيقة.',
    descEn: 'Peak divided attention and cognitive routing accuracy.',
    baysCount: 4,
    switchesCount: 3,
    speed: 2.2,
  },
];

export default function DuolingoTrainSwitch({ onBack }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Switch states: map of switchId -> 'left' | 'right'
  const [switchStates, setSwitchStates] = useState({ 0: 'left', 1: 'left', 2: 'right' });

  // Ship animation state: null | { progress: 0..1, path: [{x, y}], targetDock: index, isCorrect: bool }
  const [flyingShip, setFlyingShip] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const levelCfg = useMemo(() => {
    return LEVELS.find((l) => l.level === currentLevel) || LEVELS[0];
  }, [currentLevel]);

  const activeBays = useMemo(() => {
    return DOCKING_BAYS.slice(0, levelCfg.baysCount);
  }, [levelCfg.baysCount]);

  // Target bay for current round
  const targetBayIndex = useMemo(() => {
    return (round * 3 + currentLevel) % activeBays.length;
  }, [round, currentLevel, activeBays.length]);

  const currentShip = activeBays[targetBayIndex];

  // Reset switches or round feedback
  useEffect(() => {
    setFeedback(null);
    setFlyingShip(null);
  }, [round, currentLevel]);

  // Toggle a switch node
  const handleToggleSwitch = useCallback((switchId) => {
    if (flyingShip) return; // Prevent changing during flight

    playSfx?.('tap');
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    setSwitchStates((prev) => ({
      ...prev,
      [switchId]: prev[switchId] === 'left' ? 'right' : 'left',
    }));
  }, [flyingShip, playSfx]);

  // Compute destination bay index based on current switchStates
  const destinationBayIndex = useMemo(() => {
    if (levelCfg.baysCount === 2) {
      // 1 switch (0) -> left: bay 0, right: bay 1
      return switchStates[0] === 'left' ? 0 : 1;
    } else if (levelCfg.baysCount === 3) {
      // Switch 0 splits to Left (Bay 0) or Right (Goes to Switch 1)
      // Switch 1 splits to Left (Bay 1) or Right (Bay 2)
      if (switchStates[0] === 'left') {
        return 0;
      } else {
        return switchStates[1] === 'left' ? 1 : 2;
      }
    } else {
      // 4 bays with 3 binary switches:
      // Root Switch 0:
      // - Left -> Switch 1 (Left: Bay 0, Right: Bay 1)
      // - Right -> Switch 2 (Left: Bay 2, Right: Bay 3)
      if (switchStates[0] === 'left') {
        return switchStates[1] === 'left' ? 0 : 1;
      } else {
        return switchStates[2] === 'left' ? 2 : 3;
      }
    }
  }, [levelCfg.baysCount, switchStates]);

  // Launch spaceship down the tracks
  const handleLaunchShip = useCallback(() => {
    if (flyingShip || feedback) return;

    playSfx?.('tap');
    const isCorrect = destinationBayIndex === targetBayIndex;

    // Start flying animation
    setFlyingShip({
      progress: 0,
      destinationBay: destinationBayIndex,
      isCorrect,
    });
  }, [flyingShip, feedback, destinationBayIndex, targetBayIndex, playSfx]);

  // Animation frame effect for flying spaceship
  useEffect(() => {
    if (!flyingShip) return;

    let startTime = null;
    const duration = 1400 / levelCfg.speed;
    let animId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);

      setFlyingShip((prev) => (prev ? { ...prev, progress } : null));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        // Arrived at dock!
        if (flyingShip.isCorrect) {
          playSfx?.('ding');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
          }
          setStreak((s) => s + 1);
          setScore((sc) => sc + 10);
          setFeedback({
            isCorrect: true,
            title: isAr ? 'إرساء ممتاز! مسار ملاحة متقن 🚀' : 'Flawless Docking! Perfect routing!',
            subtitle: isAr
              ? `رسَت السفينة في ${currentShip.nameAr} بنجاح · +10 نقاط خبرة 🔥`
              : `Successfully docked at ${currentShip.nameEn} · +10 XP 🔥`,
          });
        } else {
          playSfx?.('error');
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(80);
          }
          setFeedback({
            isCorrect: false,
            title: isAr ? 'هبوط في المرفأ الخاطئ!' : 'Docked at Wrong Bay!',
            subtitle: isAr
              ? `المستهدف كان ${currentShip.nameAr}، لكن السفينة وصلت إلى ${activeBays[flyingShip.destinationBay]?.nameAr}.`
              : `Target was ${currentShip.nameEn}, but the ship arrived at ${activeBays[flyingShip.destinationBay]?.nameEn}.`,
          });
        }
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [flyingShip?.destinationBay, flyingShip?.isCorrect, levelCfg.speed, playSfx, isAr, currentShip, activeBays]);

  const handleNextRound = useCallback(() => {
    if (round >= TOTAL_ROUNDS) {
      const earnedXp = currentLevel * 10 + 30;
      awardPoints?.(earnedXp);
      setIsCompleted(true);
    } else {
      setRound((r) => r + 1);
      setFlyingShip(null);
      setFeedback(null);
    }
  }, [round, currentLevel, awardPoints]);

  const handleSelectLevel = (newLevel) => {
    playSfx?.('click');
    setCurrentLevel(newLevel);
    setRound(1);
    setStreak(0);
    setScore(0);
    setFlyingShip(null);
    setFeedback(null);
    setIsLevelModalOpen(false);
  };

  if (isCompleted) {
    const earnedXp = currentLevel * 10 + 30;
    return (
      <DuolingoVictoryScreen
        xpEarned={earnedXp}
        accuracy={Math.round((score / (TOTAL_ROUNDS * 10)) * 100) || 85}
        streak={streak}
        title={isAr ? 'أتقنت توجيه السفن الفضائية!' : 'Spaceship Docking Mastered!'}
        subtitle={isAr
          ? `أداء تكتيكي مبهر في ${levelCfg.titleAr}!`
          : `Spectacular tactical switching performance on ${levelCfg.titleEn}!`}
        onComplete={onBack}
      />
    );
  }

  const progressPercent = ((round - 1) / TOTAL_ROUNDS) * 100;

  // Track coordinates calculation for SVG
  const width = 440;
  const height = 340;

  // Nodes positions
  const startX = width / 2;
  const startY = 30;

  // Dynamic coordinates based on level mode
  let switchNodes = [];
  let trackPaths = [];

  if (levelCfg.baysCount === 2) {
    // 1 Switch at (220, 130)
    // Bay 0 at (110, 310), Bay 1 at (330, 310)
    switchNodes = [{ id: 0, x: 220, y: 130, dir: switchStates[0] }];
    trackPaths = [
      { d: `M 220 30 L 220 130`, active: true },
      { d: `M 220 130 Q 160 210 110 305`, active: switchStates[0] === 'left' },
      { d: `M 220 130 Q 280 210 330 305`, active: switchStates[0] === 'right' },
    ];
  } else if (levelCfg.baysCount === 3) {
    // Switch 0 at (220, 95)
    // Switch 1 at (300, 195)
    // Bay 0 at (90, 310), Bay 1 at (230, 310), Bay 2 at (360, 310)
    switchNodes = [
      { id: 0, x: 220, y: 95, dir: switchStates[0] },
      { id: 1, x: 300, y: 195, dir: switchStates[1] },
    ];
    trackPaths = [
      { d: `M 220 30 L 220 95`, active: true },
      { d: `M 220 95 Q 150 180 90 305`, active: switchStates[0] === 'left' },
      { d: `M 220 95 Q 260 145 300 195`, active: switchStates[0] === 'right' },
      { d: `M 300 195 Q 260 250 230 305`, active: switchStates[0] === 'right' && switchStates[1] === 'left' },
      { d: `M 300 195 Q 330 250 360 305`, active: switchStates[0] === 'right' && switchStates[1] === 'right' },
    ];
  } else {
    // 4 Bays: Root Switch 0 at (220, 85)
    // Left Switch 1 at (140, 185)
    // Right Switch 2 at (300, 185)
    // Bays at 60, 160, 280, 380
    switchNodes = [
      { id: 0, x: 220, y: 85, dir: switchStates[0] },
      { id: 1, x: 140, y: 185, dir: switchStates[1] },
      { id: 2, x: 300, y: 185, dir: switchStates[2] },
    ];
    trackPaths = [
      { d: `M 220 30 L 220 85`, active: true },
      { d: `M 220 85 Q 170 130 140 185`, active: switchStates[0] === 'left' },
      { d: `M 220 85 Q 270 130 300 185`, active: switchStates[0] === 'right' },
      // Sub branches
      { d: `M 140 185 Q 100 245 60 305`, active: switchStates[0] === 'left' && switchStates[1] === 'left' },
      { d: `M 140 185 Q 150 245 160 305`, active: switchStates[0] === 'left' && switchStates[1] === 'right' },
      { d: `M 300 185 Q 290 245 280 305`, active: switchStates[0] === 'right' && switchStates[2] === 'left' },
      { d: `M 300 185 Q 340 245 380 305`, active: switchStates[0] === 'right' && switchStates[2] === 'right' },
    ];
  }

  // Calculate current ship coordinates along the path when flying
  let shipCurrentPos = { x: startX, y: startY };
  if (flyingShip) {
    const p = flyingShip.progress;
    // Simple interpolation from start (220, 30) down to active destination bay
    const baySpacing = width / (activeBays.length + 1);
    const destX = baySpacing * (flyingShip.destinationBay + 1);
    const destY = 305;

    // Curved interpolation
    const midY = 160;
    const inv = 1 - p;
    shipCurrentPos = {
      x: inv * inv * startX + 2 * inv * p * ((startX + destX) / 2) + p * p * destX,
      y: inv * inv * startY + 2 * inv * p * midY + p * p * destY,
    };
  }

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
            setIsLevelModalOpen(true);
          }}
          title={isAr ? 'تغيير المستوى' : 'Select Level'}
        >
          <SlidersHorizontal size={15} weight="bold" />
          <span>{isAr ? `المستوى ${currentLevel}` : `Level ${currentLevel}`}</span>
        </button>
      }
    >
      {/* Duolingo Prompt Card with Mascot Speech */}
      <div className="duo-prompt-card">
        <div className="duo-prompt-mascot">🚀</div>
        <div className="duo-prompt-bubble">
          {isAr ? (
            <>
              اضبط المفاتيح لتوجيه السفينة إلى{' '}
              <span style={{ color: currentShip.color, fontWeight: 900 }}>
                {currentShip.nameAr}
              </span>{' '}
              ثم أطلق السفينة!
            </>
          ) : (
            <>
              Toggle switches to guide the ship to{' '}
              <span style={{ color: currentShip.color, fontWeight: 900 }}>
                {currentShip.nameEn}
              </span>
              , then launch!
            </>
          )}
        </div>
      </div>

      {/* Interactive Orbital Track Arena */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          aspectRatio: '440 / 340',
          position: 'relative',
          borderRadius: 24,
          overflow: 'hidden',
          border: '3px solid #e5e5e5',
          borderBottom: '6px solid #d5d5d5',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
          margin: '0 auto 20px',
          background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)',
          userSelect: 'none',
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* Glow Filter */}
            <filter id="trackGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Starfield particles */}
          {Array.from({ length: 28 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 37) % width}
              cy={(i * 29) % (height - 60)}
              r={(i % 3) * 0.7 + 0.8}
              fill="rgba(148, 163, 184, 0.4)"
            />
          ))}

          {/* Background Rails (inactive) */}
          {trackPaths.map((tp, idx) => (
            <path
              key={`bg-${idx}`}
              d={tp.d}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="10"
              strokeLinecap="round"
            />
          ))}

          {/* Active Highlighted Rails */}
          {trackPaths.map((tp, idx) => (
            <path
              key={`fg-${idx}`}
              d={tp.d}
              fill="none"
              stroke={tp.active ? currentShip.color : '#cbd5e1'}
              strokeWidth={tp.active ? '6' : '3'}
              strokeLinecap="round"
              filter={tp.active ? 'url(#trackGlow)' : 'none'}
              style={{
                transition: 'stroke 0.25s ease, stroke-width 0.25s ease',
              }}
            />
          ))}

          {/* Hangar Launchpad (Top) */}
          <g transform={`translate(${startX - 28}, 8)`}>
            <rect
              width="56"
              height="36"
              rx="12"
              fill="#ffffff"
              stroke="#e5e5e5"
              strokeWidth="3"
            />
            <circle cx="28" cy="18" r="14" fill={currentShip.color} />
            <text
              x="28"
              y="22"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="12"
              fontWeight="900"
            >
              🚀
            </text>
          </g>

          {/* Switch Node Junctions (Clickable) */}
          {switchNodes.map((node) => {
            const isLeft = node.dir === 'left';
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleToggleSwitch(node.id)}
                style={{ cursor: flyingShip ? 'default' : 'pointer' }}
              >
                {/* Outer Switch Dial */}
                <circle
                  r="22"
                  fill="#ffffff"
                  stroke="#e2e8f0"
                  strokeWidth="3"
                  filter="drop-shadow(0 3px 6px rgba(0,0,0,0.1))"
                />
                {/* Direction Indicator Pill */}
                <circle
                  r="16"
                  fill={isLeft ? '#ff7800' : '#2586f7'}
                  style={{ transition: 'fill 0.2s ease' }}
                />
                {/* Arrow Icon */}
                <text
                  x="0"
                  y="5"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="14"
                  fontWeight="900"
                >
                  {isLeft ? '◀' : '▶'}
                </text>
              </g>
            );
          })}

          {/* Docking Bays (Bottom) */}
          {activeBays.map((bay, idx) => {
            const baySpacing = width / (activeBays.length + 1);
            const bx = baySpacing * (idx + 1);
            const by = 295;
            const isTarget = idx === targetBayIndex;
            const isDestination = idx === destinationBayIndex;

            return (
              <g key={bay.id} transform={`translate(${bx - 26}, ${by})`}>
                {/* Dock platform */}
                <rect
                  width="52"
                  height="36"
                  rx="10"
                  fill={isDestination ? '#ffffff' : '#f8fafc'}
                  stroke={bay.color}
                  strokeWidth={isDestination ? '4' : '2'}
                  filter={isDestination ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.15))' : 'none'}
                />
                <circle cx="26" cy="18" r="10" fill={bay.color} />
                <text
                  x="26"
                  y="22"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="900"
                >
                  {bay.icon}
                </text>

                {/* Target Pin Marker */}
                {isTarget && (
                  <g transform="translate(16, -14)">
                    <circle r="7" fill="#ff7800" />
                    <text
                      x="0"
                      y="3"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="900"
                    >
                      ★
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Flying Spaceship when active */}
          {flyingShip && (
            <g
              transform={`translate(${shipCurrentPos.x}, ${shipCurrentPos.y})`}
              filter="drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
            >
              <circle r="16" fill={currentShip.color} stroke="#ffffff" strokeWidth="2.5" />
              <text
                x="0"
                y="5"
                textAnchor="middle"
                fill="#ffffff"
                fontSize="13"
                fontWeight="900"
              >
                🚀
              </text>
            </g>
          )}
        </svg>

        {/* Current Destination Status Pill */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(6px)',
            borderRadius: 12,
            padding: '6px 12px',
            border: '2px solid #e2e8f0',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{isAr ? 'المسار متصل بـ:' : 'Routing to:'}</span>
            <span style={{ color: activeBays[destinationBayIndex]?.color, fontWeight: 900 }}>
              {isAr ? activeBays[destinationBayIndex]?.nameAr : activeBays[destinationBayIndex]?.nameEn}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{isAr ? 'المطلوب:' : 'Target:'}</span>
            <span style={{ color: currentShip.color, fontWeight: 900 }}>
              {isAr ? currentShip.nameAr : currentShip.nameEn}
            </span>
          </div>
        </div>
      </div>

      {/* Floating Bottom Verification / Launch CTA */}
      {!feedback && (
        <button
          type="button"
          onClick={handleLaunchShip}
          disabled={Boolean(flyingShip)}
          style={{
            width: '100%',
            maxWidth: 420,
            background: flyingShip ? '#e5e5e5' : '#58cc02',
            color: flyingShip ? '#afafaf' : '#ffffff',
            fontSize: 16,
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: 16,
            borderRadius: 18,
            border: 'none',
            borderBottom: flyingShip ? '5px solid #cccccc' : '5px solid #46a302',
            cursor: flyingShip ? 'not-allowed' : 'pointer',
            transition: 'all 0.1s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Rocket size={20} weight="bold" />
          <span>{isAr ? 'إطلاق السفينة والتأكيد' : 'Launch Spaceship & Verify'}</span>
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

      {/* Level Selector Modal */}
      {isLevelModalOpen && (
        <div className="duo-modal-overlay" onClick={() => setIsLevelModalOpen(false)}>
          <div className="duo-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="duo-modal-header">
              <h2 className="duo-modal-title">
                <SlidersHorizontal size={22} weight="bold" color="#ff7800" />
                <span>{isAr ? 'اختيار مستوى مسار السفن' : 'Select Flight Level'}</span>
              </h2>
              <button
                type="button"
                className="duo-modal-close"
                onClick={() => setIsLevelModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.4 }}>
              {isAr
                ? 'اختر مستوى تعقيد شبكة الملاحة وعدد مفاتيح التحويل لاختبار انتباه التبديل.'
                : 'Select the navigation complexity level to challenge attention switching.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {LEVELS.map((lvl) => {
                const isActive = currentLevel === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => handleSelectLevel(lvl.level)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
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
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 900,
                          color: isActive ? '#ff7800' : '#1e293b',
                        }}
                      >
                        {isAr ? lvl.titleAr : lvl.titleEn}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {isAr ? lvl.descAr : lvl.descEn}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '4px 10px',
                        borderRadius: 10,
                        background: isActive ? '#ff7800' : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#64748b',
                        fontWeight: 900,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {lvl.baysCount} {isAr ? 'مرافئ' : 'Bays'}
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
