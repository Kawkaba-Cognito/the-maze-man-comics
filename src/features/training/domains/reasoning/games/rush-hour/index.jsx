import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import { tokens } from '../../../../../../styles/tokens';
import { IconBack } from '../../../../shared/TrainingIcons';
import {
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid, TrainingModeList } from '../../../../shared/TrainingScreens';
import HubScienceLink from '../../../../shared/HubScienceLink';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { useCoach } from '../../../../shared/coach/useCoach';
import CoachOverlay from '../../../../shared/coach/CoachOverlay';
import { createTrialLog } from '../../../../shared/trialLog';
import MazeManAvatar from '../../../../shared/MazeManAvatar';
import { getRange, isWon, clonePieces, RUSH_HOUR_BASE_LAYOUTS } from './engine';
import { buildRushCoachSteps } from './tutorialScript';
import {
  DM,
} from '../../../../shared/focusQuestData';
import {
  mergeRhChallengeRow,
  RH_LEVELS_PER_TIER,
  RH_DIFF_KEYS,
  isLevelUnlocked,
  loadRhProgress,
  saveRhProgress,
  rhFreeParPoints,
} from './data';
import RhWorker from './rh-worker.js?worker';
import AssessmentReady from '../../../../assessment/AssessmentReady';

const RH_ASSESS_CAP_SEC = 180; // hard cap so the assessment always terminates

const GAP = 4;
const SAFE_RH_BASE = RUSH_HOUR_BASE_LAYOUTS[0];

function makeSafeRushHourBoard(labelKey, extra = {}) {
  return {
    labelKey,
    grid: SAFE_RH_BASE.grid,
    exitRow: SAFE_RH_BASE.exitRow,
    pieces: clonePieces(SAFE_RH_BASE.pieces),
    par: 4,
    ...extra,
  };
}

const HERO_STYLE = {
  fill: ['#f5c44a', '#e8a830'],
  border: '#c8881e',
  shadow: 'rgba(200,140,30,0.35)',
};

const CAR_STYLES = [
  { fill: ['#a08868', '#8a7050'], border: '#6e5a3e', shadow: 'rgba(110,90,62,0.25)' },
  { fill: ['#7ab090', '#5e9878'], border: '#4a7a5e', shadow: 'rgba(74,122,94,0.25)' },
  { fill: ['#c08060', '#a86848'], border: '#884830', shadow: 'rgba(136,72,48,0.25)' },
  { fill: ['#8888a8', '#707090'], border: '#585878', shadow: 'rgba(88,88,120,0.25)' },
  { fill: ['#a89880', '#907860'], border: '#706048', shadow: 'rgba(112,96,72,0.25)' },
  { fill: ['#8fb8c8', '#6a9aac'], border: '#407090', shadow: 'rgba(64,112,144,0.25)' },
  { fill: ['#c8a0b8', '#a88098'], border: '#805870', shadow: 'rgba(128,88,112,0.25)' },
];

function pieceStyle(pid) {
  if (pid === 'hero') return HERO_STYLE;
  const i = (pid.charCodeAt(0) - 65 + 256) % CAR_STYLES.length;
  return CAR_STYLES[i];
}

function BlockDecor({ dir }) {
  const light = 'rgba(255,255,255,0.35)';
  if (dir === 'h') {
    return (
      <svg viewBox="0 0 40 20" style={{ width: '60%', height: '50%', opacity: 0.6 }}>
        <line x1="8" y1="5" x2="8" y2="15" stroke={light} strokeWidth="2" strokeLinecap="round" />
        <line x1="15" y1="3" x2="15" y2="17" stroke={light} strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="5" x2="22" y2="15" stroke={light} strokeWidth="2" strokeLinecap="round" />
        <line x1="29" y1="3" x2="29" y2="17" stroke={light} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 40" style={{ width: '50%', height: '60%', opacity: 0.6 }}>
      <line x1="5" y1="8" x2="15" y2="8" stroke={light} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="15" x2="17" y2="15" stroke={light} strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="22" x2="15" y2="22" stroke={light} strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="29" x2="17" y2="29" stroke={light} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const UI_EN = {
  title: 'Logical Deduction',
  subtitle: 'Logic parking puzzle — slide cars to free Maze Man.',
  levels: 'Level mode',
  free: 'Survival mode',
  challenge: 'Pass n Play',
  level: 'Level',
  optimal: 'Par',
  moves: 'Moves',
  time: 'Time',
  score: 'Score',
  back: 'Back',
  reset: 'Reset',
  hub: 'Menu',
  next: 'Next level',
  nextRound: 'Continue',
  playAgain: 'Play again',
  escaped: 'Escaped!',
  perfect: 'Perfect',
  good: 'Nice solve',
  tryLower: 'Try fewer moves',
  freeHint: 'Endless · 3 lives · a timer on each puzzle',
  locked: 'Locked',
  training: 'Brain logic',
  pickDiff: 'Choose difficulty',
  pickDiffSub: '3 difficulties · 100 verified stages each · unlock in order',
  diffDesc: {
    easy: 'Smaller jams, gentle par — learn to plan ahead.',
    medium: 'Busier boards, tighter par.',
    hard: 'Dense expert jams, long solutions.',
  },
  hubNodeFreeHint: 'Endless · 3 lives · solve before the timer',
  hubNodeLevelsHint: '3 tiers · 100 levels each',
  hubNodeChallengeHint: 'Same parking jam for everyone · pass the device',
  freeIntroTitle: 'Survival mode',
  freeIntroBody:
    'Endless puzzles that get harder. Each puzzle has its own timer — solve it before time runs out. You have 3 lives; run out of time on a puzzle and you lose one. Fewer moves = more points, and streaks multiply your score. The run ends only when your lives reach zero.',
  freeIntroReady: 'Ready',
  freeResTitle: 'Run complete',
  freeRoundsCleared: (n) => `Puzzles cleared: ${n}`,
  freeBestLine: (n) => `Best clears: ${n}`,
  freeBestScoreLine: (n) => `Best score: ${n}`,
  challengeSub:
    'Everyone plays the identical larger-grid puzzle. Add players, pick rounds, pass the device — lowest average moves wins.',
  startCh: '⚔️ Start',
  needTwo: 'Add at least 2 players.',
  players: 'Players (2–10)',
  addPl: '＋ Add player',
  chalRounds: 'Rounds',
  chalRoundsHint: 'Each player plays once per round · New fair board each round',
  roundNofM: (n, m) => `Round ${n}/${m}`,
  ready: (n) => `Ready — ${n}`,
  handTo: (n) => `Hand the device to ${n}.`,
  goReady: 'Start round',
  chalTurnKicker: 'Your turn',
  chalBulletSame: 'Same parking puzzle for every player this round',
  chalBulletPass: 'Tap Start only when the device is with this player',
  paused: 'Paused',
  resume: 'Resume',
  restart: 'Restart puzzle',
  quitMenu: 'Quit to menu',
  quitQ: 'Leave game?',
  quitLose: 'Progress on this puzzle will be lost.',
  yesQuit: 'Yes, leave',
  keep: 'Keep playing',
  chalHud: (roundLabel, name, i, n, G) =>
    `${roundLabel}${name} — ${i + 1}/${n} · ${G}×${G}`,
  chalResTitle: 'Pass n Play results',
  chalResMovesLine: (avgM, avgS) => `${avgM.toFixed(1)} moves avg · ${avgS.toFixed(1)}s avg`,
  newCh: 'New game',
  menu: 'Menu',
  challengeTitle: 'Pass n Play',
  levelsSub: (pop) => `${pop} · Stages 1–100 · board 6×6→9×9`,
};

const UI_AR = {
  title: 'الاستنتاج المنطقي',
  subtitle: 'لغز منطقي — حرّك السيارات لإخراج رجل المتاهة.',
  levels: 'وضع المراحل',
  free: 'وضع البقاء',
  challenge: 'مرّر والعب',
  level: 'مستوى',
  optimal: 'الهدف',
  moves: 'الحركات',
  time: 'الوقت',
  score: 'النقاط',
  back: 'رجوع',
  reset: 'إعادة',
  hub: 'القائمة',
  next: 'المستوى التالي',
  nextRound: 'متابعة',
  playAgain: 'أعد اللعب',
  escaped: 'أحسنت!',
  perfect: 'تصويب مثالي',
  good: 'حل جيد',
  tryLower: 'حاول بحركات أقل',
  freeHint: 'لا ينتهي · ٣ أرواح · مؤقت لكل لغز',
  locked: 'مقفل',
  training: 'تدريب منطقي',
  pickDiff: 'اختر الصعوبة',
  pickDiffSub: '٣ صعوبات · ١٠٠ مرحلة مؤكدة لكل صعوبة · افتح بالترتيب',
  diffDesc: {
    easy: 'ازدحام أصغر وهدف سهل — تعلّم التخطيط.',
    medium: 'لوحات أكثر ازدحاماً وهدف أضيق.',
    hard: 'ازدحام خبير كثيف وحلول طويلة.',
  },
  hubNodeFreeHint: 'لا ينتهي · ٣ أرواح · حل قبل المؤقت',
  hubNodeLevelsHint: '٣ صعوبات · ١٠٠ مرحلة لكل صعوبة',
  hubNodeChallengeHint: 'نفس ازدحام المواقف للجميع · مرّر الجهاز',
  freeIntroTitle: 'وضع البقاء',
  freeIntroBody:
    'ألغاز لا تنتهي وتزداد صعوبة. لكل لغز مؤقته الخاص — حلّه قبل نفاد الوقت. لديك ٣ أرواح؛ إذا نفد وقت لغز تخسر روحاً. حركات أقل = نقاط أكثر، والسلسلة تضاعف النقاط. تنتهي المحاولة فقط عند نفاد الأرواح.',
  freeIntroReady: 'جاهز',
  freeResTitle: 'اكتملت المحاولة',
  freeRoundsCleared: (n) => `ألغاز ناجحة: ${n}`,
  freeBestLine: (n) => `أفضل إكمال: ${n}`,
  freeBestScoreLine: (n) => `أفضل نقاط: ${n}`,
  challengeTitle: 'مرّر والعب',
  challengeSub:
    'الجميع يلعبون نفس اللغز على شبكة أكبر. أضف لاعبين، اختر الجولات، مرّر الجهاز — أقل متوسط حركات يفوز.',
  startCh: '⚔️ ابدأ',
  needTwo: 'أضف لاعبين على الأقل.',
  players: 'اللاعبون (2–10)',
  addPl: '＋ إضافة لاعب',
  chalRounds: 'الجولات',
  chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · لوحة جديدة عادلة كل جولة',
  roundNofM: (n, m) => `الجولة ${n}/${m}`,
  ready: (n) => `جاهز — ${n}`,
  handTo: (n) => `سلّم الجهاز إلى ${n}.`,
  goReady: 'ابدأ الجولة',
  chalTurnKicker: 'دورك',
  chalBulletSame: 'نفس لغز المواقف لكل اللاعبين في هذه الجولة',
  chalBulletPass: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
  paused: 'متوقف',
  resume: 'متابعة',
  restart: 'إعادة اللغز',
  quitMenu: 'الخروج للقائمة',
  quitQ: 'مغادرة اللعبة؟',
  quitLose: 'سيتم فقدان تقدم هذا اللغز.',
  yesQuit: 'نعم، اخرج',
  keep: 'تابع اللعب',
  chalHud: (roundLabel, name, i, n, G) =>
    `${roundLabel}${name} — ${i + 1}/${n} · ${G}×${G}`,
  chalResTitle: 'نتائج مرّر والعب',
  chalResMovesLine: (avgM, avgS) =>
    `${avgM.toFixed(1)} حركة معدل · ${avgS.toFixed(1)}ث معدل`,
  newCh: 'لعبة جديدة',
  menu: 'القائمة',
  levelsSub: (pop) => `${pop} · مراحل 1–100 · شبكة 6×6→9×9`,
};

export default function RushHourGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep }) {
  const { playSfx, currentLang, awardTrainingWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI_AR : UI_EN;

  // WORKOUT MODE: launched from the Daily Workout — skip the hub and jump
  // straight into free play; the workout shell owns timing and exit.
  const workoutLaunched = useRef(false);
  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) { workoutLaunched.current = true; startFreeRun(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode]);

  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [progress, setProgress] = useState(() => loadRhProgress());
  const [diffKey, setDiffKey] = useState('easy');
  const [levelIndex, setLevelIndex] = useState(1);
  const [playMode, setPlayMode] = useState('levels');
  const [chalFrozenDef, setChalFrozenDef] = useState(null);
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('medium');
  const chalDiffRef = useRef('medium');
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [chalScores, setChalScores] = useState([]);
  const [lastRhChalRows, setLastRhChalRows] = useState(null);

  const chalStartRef = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const [freeStage, setFreeStage] = useState(0);
  const [freeSessionNonce, setFreeSessionNonce] = useState(0);
  const [freeScore, setFreeScore] = useState(0);
  const [freeRoundsWon, setFreeRoundsWon] = useState(0);
  const [freeStreak, setFreeStreak] = useState(0);
  const [freeResSnapshot, setFreeResSnapshot] = useState({ rounds: 0, score: 0, bestStreak: 0 });

  const freeStageRef = useRef(0);
  const freeStreakRef = useRef(0);
  const freeRoundsWonRef = useRef(0);
  const freeScoreRef = useRef(0);
  const freeBestStreakRef = useRef(0);
  const freeTimeRef = useRef(60);
  const freeTimerEndedRef = useRef(false);
  const freeTimeEl = useRef(null);
  const freeLivesRef = useRef(3);
  const [freeLives, setFreeLives] = useState(3);

  // Assessment: an unscored warm-up jam first (first-exposure practice), then
  // one fixed standardized puzzle scored by efficiency + solve time.
  const assessStartRef = useRef(0);
  const assessEndedRef = useRef(false);
  const assessWarmupRef = useRef(false);
  const [assessWarmup, setAssessWarmup] = useState(false);

  // juice + coached tutorial (functions defined after board state below)
  const juice = useJuice();
  const [coachActive, setCoachActive] = useState(false);
  const coachActiveRef = useRef(false);
  const coachRef = useRef(null);
  const pendingAfterCoachRef = useRef(null);
  const boardRef = useRef(null);
  useEffect(() => {
    coachActiveRef.current = coachActive;
  }, [coachActive]);

  useEffect(() => () => trialLogRef.current?.discard(), []);

  const pauseLabels = {
    paused: t.paused,
    resume: t.resume,
    restart: t.restart,
    quitMenu: t.quitMenu,
  };
  const quitLabels = {
    quitQ: t.quitQ,
    quitLose: t.quitLose,
    yesQuit: t.yesQuit,
    keep: t.keep,
  };

  const endFreeRun = useCallback(() => {
    // Quit-to-menu also lands here: a free run banks whatever it reached.
    trialLogRef.current?.finish({
      roundsWon: freeRoundsWonRef.current,
      score: freeScoreRef.current,
    });
    trialLogRef.current = null;
    awardFreeRun('rush', freeRoundsWonRef.current);
    setFreeResSnapshot({
      rounds: freeRoundsWonRef.current,
      score: freeScoreRef.current,
      bestStreak: freeBestStreakRef.current,
    });
    setProgress((prev) => {
      const n = {
        ...prev,
        freeBest: Math.max(prev.freeBest, freeRoundsWonRef.current),
        freeBestScore: Math.max(prev.freeBestScore, freeScoreRef.current),
        lastFreeSeed: Date.now(),
      };
      saveRhProgress(n);
      return n;
    });
    wonRef.current = false;
    setWon(false);
    setPhase('freeRes');
  }, []);

  const confirmRhQuit = useCallback(() => {
    setQuitOpen(false);
    setPauseOpen(false);
    setWon(false);
    wonRef.current = false;
    if (playMode === 'assess') {
      trialLogRef.current?.discard();
      trialLogRef.current = null;
      (onAssessmentExit || onBack)?.();
    } else if (playMode === 'free') {
      endFreeRun();
    } else if (playMode === 'challenge') {
      setChalFrozenDef(null);
      setChalTurnOpen(false);
      setPhase('chal');
    } else {
      trialLogRef.current?.discard();
      trialLogRef.current = null;
      setPhase('levels');
    }
  }, [playMode, endFreeRun, onAssessmentExit, onBack]);

  const onRhMenu = useCallback(() => {
    playSfx('click');
    setQuitOpen(true);
  }, [playSfx]);

  const onRhPause = useCallback(() => {
    playSfx('click');
    setPauseOpen(true);
  }, [playSfx]);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  useEffect(() => {
    freeStageRef.current = freeStage;
  }, [freeStage]);

  const [levelDef, setLevelDef] = useState(null);
  const [generating, setGenerating] = useState(false);
  const workerRef = useRef(null);
  const workerMsgIdRef = useRef(0);

  useEffect(() => {
    try {
      const w = new RhWorker();
      workerRef.current = w;
      w.addEventListener('error', () => {
        w.terminate();
        workerRef.current = null;
      });
      return () => { w.terminate(); workerRef.current = null; };
    } catch (_) {
      workerRef.current = null;
    }
  }, []);

  /* Only resolve a board when actually in play — avoids wiring Free/Level generators
   * while the user is on hub/lobby (and fixes Challenge briefly loading the wrong tier). */
  useEffect(() => {
    if (phase !== 'play') return undefined;
    if (playMode === 'challenge') {
      if (chalFrozenDef) {
        setLevelDef(chalFrozenDef);
        setGenerating(false);
      } else {
        setGenerating(true);
      }
      return undefined;
    }
    setGenerating(true);
    setLevelDef(null);

    const msgId = ++workerMsgIdRef.current;
    const w = workerRef.current;

    const runFallbackSync = () => {
      if (msgId !== workerMsgIdRef.current) return;
      const def = playMode === 'free'
        ? makeSafeRushHourBoard('free', { freeStage, diff: diffKey, lv: levelIndex })
        : makeSafeRushHourBoard('level', { level: levelIndex, diff: diffKey });
      setLevelDef(def);
      setGenerating(false);
    };

    if (w) {
      let responded = false;
      let timeout = setTimeout(() => {
        if (!responded && msgId === workerMsgIdRef.current) {
          responded = true;
          runFallbackSync();
        }
      }, 1800);

      const handler = (e) => {
        if (e.data.id !== msgId) return;
        if (responded) return;
        responded = true;
        clearTimeout(timeout);
        w.removeEventListener('message', handler);
        if (msgId !== workerMsgIdRef.current) return;
        if (e.data.error || !e.data.result) {
          runFallbackSync();
          return;
        }
        setLevelDef(e.data.result);
        setGenerating(false);
      };

      const errHandler = () => {
        if (!responded && msgId === workerMsgIdRef.current) {
          responded = true;
          clearTimeout(timeout);
          runFallbackSync();
        }
      };

      w.addEventListener('message', handler);
      w.addEventListener('error', errHandler);

      if (playMode === 'free') {
        w.postMessage({
          type: 'generateFree',
          id: msgId,
          payload: { stageIndex: freeStage, sessionNonce: freeSessionNonce },
        });
      } else {
        w.postMessage({
          type: 'generateLevel',
          id: msgId,
          payload: { diffKey, levelIndex },
        });
      }
      return () => {
        clearTimeout(timeout);
        w.removeEventListener('message', handler);
        w.removeEventListener('error', errHandler);
      };
    }

    /* Fallback if worker not available (e.g. SSR or old browser) */
    const id = setTimeout(runFallbackSync, 16);
    return () => clearTimeout(id);
  }, [
    phase,
    playMode,
    diffKey,
    levelIndex,
    freeStage,
    freeSessionNonce,
    chalFrozenDef,
  ]);

  const grid = levelDef?.grid ?? 6;
  const exitRow = levelDef?.exitRow ?? 2;
  const parMoves = levelDef?.par ?? 4;

  /* Initial board only — real layout always applied in `useEffect` below so we never
   * depend on `useMemo(levelDef)` inside a lazy `useState` init (React Compiler–safe). */
  const [pieces, setPieces] = useState(() =>
    clonePieces(RUSH_HOUR_BASE_LAYOUTS[0].pieces),
  );
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);
  const [cellSize, setCellSize] = useState(56);

  const playModeRef = useRef(playMode);
  const levelIndexRef = useRef(levelIndex);
  const diffKeyRef = useRef(diffKey);
  const piecesRef = useRef(pieces);
  const wonRef = useRef(false);
  const pieceEls = useRef({});
  const dragRef = useRef(null);
  const movesRef = useRef(0);
  const trialLogRef = useRef(null);
  const puzzleStartRef = useRef(0);
  const firstMoveAtRef = useRef(0);

  playModeRef.current = playMode;
  levelIndexRef.current = levelIndex;
  diffKeyRef.current = diffKey;
  piecesRef.current = pieces;
  movesRef.current = moves;

  const startAssessment = useCallback(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'rush-hour', mode: 'assess' });
    assessEndedRef.current = false;
    assessWarmupRef.current = true;
    setAssessWarmup(true);
    setDiffKey('easy');
    setLevelIndex(3); // trivial warm-up jam, unscored
    setMoves(0);
    setWon(false);
    wonRef.current = false;
    setPlayMode('assess');
    setPhase('play');
  }, []);

  // Start the clock when the standardized board is ready.
  useEffect(() => {
    if (phase !== 'play' || playMode !== 'assess' || !levelDef) return;
    assessStartRef.current = Date.now();
    assessEndedRef.current = false;
  }, [levelDef, phase, playMode]);

  // Solved → score by move efficiency + solve time, then report back.
  useEffect(() => {
    if (playMode !== 'assess' || !won || assessEndedRef.current) return;
    if (assessWarmupRef.current) {
      // Warm-up solved — swap in the real standardized puzzle, nothing scored.
      assessWarmupRef.current = false;
      setAssessWarmup(false);
      setWon(false);
      wonRef.current = false;
      setMoves(0);
      setDiffKey('medium');
      setLevelIndex(50);
      return;
    }
    assessEndedRef.current = true;
    const solveSec = Math.max(1, Math.round((Date.now() - assessStartRef.current) / 1000));
    const eff = Math.max(0, Math.min(1, parMoves / Math.max(1, moves)));
    const ideal = Math.max(20, parMoves * 4);
    const timeFactor = Math.max(0.1, Math.min(1, 1 - (solveSec - ideal) / (RH_ASSESS_CAP_SEC - ideal)));
    const score = Math.round((0.6 * eff + 0.4 * timeFactor) * 100);
    trialLogRef.current?.finish({ score });
    trialLogRef.current = null;
    onAssessmentComplete?.({ score, line: `${moves} moves · ${solveSec}s` });
  }, [won, playMode, moves, parMoves, onAssessmentComplete]);

  // Hard time cap so the assessment always terminates even if unsolved.
  useEffect(() => {
    if (phase !== 'play' || playMode !== 'assess' || pauseOpen || quitOpen) return undefined;
    const id = setInterval(() => {
      if (wonRef.current || assessEndedRef.current || !assessStartRef.current) return;
      if (assessWarmupRef.current) return; // warm-up is untimed
      if (Date.now() - assessStartRef.current >= RH_ASSESS_CAP_SEC * 1000) {
        assessEndedRef.current = true;
        clearInterval(id);
        trialLogRef.current?.trial({ ok: false, timeout: true, moves: movesRef.current });
        trialLogRef.current?.finish({ score: 12, timeout: true });
        trialLogRef.current = null;
        onAssessmentComplete?.({ score: 12, line: isAr ? 'انتهى الوقت' : 'time out' });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, playMode, pauseOpen, quitOpen, onAssessmentComplete, isAr]);

  useEffect(() => {
    if (!levelDef) return;
    const pcs = levelDef.pieces;
    const safe =
      Array.isArray(pcs) && pcs.length > 0
        ? pcs
        : RUSH_HOUR_BASE_LAYOUTS[0].pieces;
    setPieces(clonePieces(safe));
    setMoves(0);
    setWon(false);
    wonRef.current = false;
    // Each fresh board marks t0 for solve time + first-move (planning) latency.
    puzzleStartRef.current = performance.now();
    firstMoveAtRef.current = 0;
    // Levels are one puzzle each → one trial-log session per level attempt.
    if (phase === 'play' && playMode === 'levels') {
      trialLogRef.current?.discard();
      trialLogRef.current = createTrialLog({
        game: 'rush-hour',
        mode: 'level',
        meta: { diff: diffKeyRef.current, lv: levelIndexRef.current },
      });
    }
  }, [levelDef, phase, playMode, chalIdx, chalRoundIdx, chalFrozenDef]);

  /* --- Coached interactive tutorial --- */
  const tutorialDef = useMemo(() => {
    const base = RUSH_HOUR_BASE_LAYOUTS[0];
    return { ...base, diff: 'tutorial', par: base.par ?? 6, pieces: clonePieces(base.pieces) };
  }, []);
  const beginTutorial = useCallback(() => {
    juice.reset();
    setGenerating(false);
    setPlayMode('tutorial');
    setLevelDef(tutorialDef);
    setWon(false);
    wonRef.current = false;
    setPhase('play');
  }, [juice, tutorialDef]);
  const finishCoach = useCallback(() => {
    try {
      localStorage.setItem('mm_rushhour_coach_seen', '1');
    } catch {
      /* ignore */
    }
    setCoachActive(false);
    coachActiveRef.current = false;
    setWon(false);
    wonRef.current = false;
    const fn = pendingAfterCoachRef.current;
    pendingAfterCoachRef.current = null;
    if (fn) fn();
    else {
      setPlayMode('levels');
      setPhase('hub');
    }
  }, []);
  const coachSteps = useMemo(() => buildRushCoachSteps(isAr, { boardRef }), [isAr]);
  const coach = useCoach(coachSteps, { active: coachActive, onDone: finishCoach });
  useEffect(() => {
    coachRef.current = coach;
  }, [coach]);
  const startCoach = useCallback(
    (thenFn) => {
      pendingAfterCoachRef.current = thenFn || null;
      coachActiveRef.current = true;
      setCoachActive(true);
      beginTutorial();
    },
    [beginTutorial],
  );
  const maybeCoach = useCallback(
    (fn) => {
      let seen = false;
      try {
        seen = !!localStorage.getItem('mm_rushhour_coach_seen');
      } catch {
        /* ignore */
      }
      if (seen) fn();
      else startCoach(fn);
    },
    [startCoach],
  );
  const replayTutorial = useCallback(() => startCoach(null), [startCoach]);

  useEffect(() => {
    const measure = () => {
      const w = Math.max(grid * 8, Math.min(window.innerWidth - 48, 380));
      setCellSize(Math.floor(w / grid));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [grid]);

  const boardPx = cellSize * grid;

  const syncProgressWin = useCallback(
    (dk, lv, mv) => {
      if (playMode !== 'levels') return;
      const doneKey = `${dk}-${lv}`;
      const next = {
        ...progress,
        done: { ...progress.done, [doneKey]: true },
        best: { ...progress.best },
      };
      const prev = next.best[doneKey];
      if (prev == null || mv < prev) next.best[doneKey] = mv;
      setProgress(next);
      saveRhProgress(next);
    },
    [playMode, progress],
  );

  const openRhChallenge = useCallback(() => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      alert(isAr ? 'أضف لاعبين على الأقل.' : t.needTwo);
      return;
    }
    playSfx('click');
    setChalNames(names);
    chalNamesRef.current = names;
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalDiffRef.current = chalDiff;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    setChalIdx(0);
    chalIdxRef.current = 0;
    const initial = names.map((nm) => ({
      nm,
      rounds: [],
      avgMoves: 0,
      avgSec: 0,
      rankScore: Number.MAX_SAFE_INTEGER,
    }));
    chalScoresRef.current = initial;
    setChalScores(initial);
    setPlayMode('challenge');
    setPhase('play');
    setGenerating(true);
    setChalFrozenDef(null);

    const w = workerRef.current;
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    if (w) {
      const msgId = ++workerMsgIdRef.current;
      let done = false;
      const fallback = () => {
        if (done) return;
        done = true;
        const board = makeSafeRushHourBoard('challenge', { seed });
        setChalFrozenDef(board);
        setChalTurnOpen(true);
        setGenerating(false);
      };
      const timer = setTimeout(fallback, 1800);
      const handler = (e) => {
        if (e.data.id !== msgId) return;
        if (done) return;
        clearTimeout(timer);
        done = true;
        w.removeEventListener('message', handler);
        if (msgId !== workerMsgIdRef.current) return;
        const board = (e.data.error || !e.data.result)
          ? makeSafeRushHourBoard('challenge', { seed })
          : e.data.result;
        setChalFrozenDef(board);
        setChalTurnOpen(true);
        setGenerating(false);
      };
      w.addEventListener('message', handler);
      w.postMessage({
        type: 'generateChallenge',
        id: msgId,
        payload: { seed, cycleIndex: 0, totalRounds: chalRoundsTotal, diff: chalDiffRef.current },
      });
    } else {
      const board = makeSafeRushHourBoard('challenge', { seed });
      setChalFrozenDef(board);
      setChalTurnOpen(true);
      setGenerating(false);
    }
  }, [chalNames, chalRoundsTotal, chalDiff, isAr, playSfx, t.needTwo]);

  const startRhChallengeRound = useCallback(() => {
    chalStartRef.current = performance.now();
    setChalTurnOpen(false);
    playSfx('click');
    const def =
      playMode === 'challenge' && chalFrozenDef ? chalFrozenDef : levelDef;
    const pcs = def?.pieces;
    const safe =
      Array.isArray(pcs) && pcs.length > 0
        ? pcs
        : RUSH_HOUR_BASE_LAYOUTS[0].pieces;
    setPieces(clonePieces(safe));
    setMoves(0);
    setWon(false);
    wonRef.current = false;
  }, [playSfx, playMode, chalFrozenDef, levelDef]);

  const advanceRhChallengeAfterWin = useCallback(
    (moveCount) => {
      const sec = (performance.now() - chalStartRef.current) / 1000;
      const idx = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      const prevRow = base[idx] || { nm: names[idx], rounds: [] };
      const snap = { moves: moveCount, sec, won: true };
      base[idx] = mergeRhChallengeRow(prevRow, snap, names[idx]);
      chalScoresRef.current = base;
      setChalScores(base);
      setWon(false);
      wonRef.current = false;
      playSfx('click');
      const nextIdx = idx + 1;
      if (nextIdx < names.length) {
        chalIdxRef.current = nextIdx;
        setChalIdx(nextIdx);
        setChalTurnOpen(true);
      } else {
        const cycle = chalCycleRef.current;
        const totalR = chalRoundsTotalRef.current;
        if (cycle + 1 < totalR) {
          chalCycleRef.current = cycle + 1;
          setChalRoundIdx(chalCycleRef.current);
          chalIdxRef.current = 0;
          setChalIdx(0);
          setGenerating(true);
          setChalFrozenDef(null);

          const w = workerRef.current;
          const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
          if (w) {
            const msgId = ++workerMsgIdRef.current;
            let done = false;
            const fallback = () => {
              if (done) return;
              done = true;
              const board = makeSafeRushHourBoard('challenge', { seed });
              setChalFrozenDef(board);
              setChalTurnOpen(true);
              setGenerating(false);
            };
            const timer = setTimeout(fallback, 1800);
            const handler = (e) => {
              if (e.data.id !== msgId) return;
              if (done) return;
              clearTimeout(timer);
              done = true;
              w.removeEventListener('message', handler);
              if (msgId !== workerMsgIdRef.current) return;
              const board = (e.data.error || !e.data.result)
                ? makeSafeRushHourBoard('challenge', { seed })
                : e.data.result;
              setChalFrozenDef(board);
              setChalTurnOpen(true);
              setGenerating(false);
            };
            w.addEventListener('message', handler);
            w.postMessage({
              type: 'generateChallenge',
              id: msgId,
              payload: { seed, cycleIndex: chalCycleRef.current, totalRounds: totalR, diff: chalDiffRef.current },
            });
          } else {
            const board = makeSafeRushHourBoard('challenge', { seed });
            setChalFrozenDef(board);
            setChalTurnOpen(true);
            setGenerating(false);
          }
        } else {
          setLastRhChalRows(base);
          setPhase('chalRes');
        }
      }
    },
    [playSfx],
  );

  const resetRound = useCallback(() => {
    if (!levelDef) return;
    const pcs = levelDef.pieces;
    const safe =
      Array.isArray(pcs) && pcs.length > 0
        ? pcs
        : RUSH_HOUR_BASE_LAYOUTS[0].pieces;
    setPieces(clonePieces(safe));
    setMoves(0);
    setWon(false);
    wonRef.current = false;
    puzzleStartRef.current = performance.now();
    firstMoveAtRef.current = 0;
    // Restarting a level is a fresh attempt → fresh trial-log session.
    if (playMode === 'levels') {
      trialLogRef.current?.discard();
      trialLogRef.current = createTrialLog({
        game: 'rush-hour',
        mode: 'level',
        meta: { diff: diffKeyRef.current, lv: levelIndexRef.current },
      });
    }
    if (playMode === 'free') {
      freeStreakRef.current = 0;
      setFreeStreak(0);
    }
  }, [levelDef, playMode]);

  const startFreeRun = useCallback(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'rush-hour', mode: 'free' });
    freeTimerEndedRef.current = false;
    freeTimeRef.current = 60; // real per-puzzle limit set when each board loads
    freeStageRef.current = 0;
    freeStreakRef.current = 0;
    freeBestStreakRef.current = 0;
    freeRoundsWonRef.current = 0;
    freeScoreRef.current = 0;
    freeLivesRef.current = 3;
    setFreeLives(3);
    setFreeStage(0);
    setFreeScore(0);
    setFreeStreak(0);
    setFreeRoundsWon(0);
    setFreeSessionNonce((Math.imul(Date.now(), 1103515245) + 12345) >>> 0);
    setPlayMode('free');
    setPhase('play');
  }, []);

  const handleDown = useCallback(
    (e, pid) => {
      if (wonRef.current || phase !== 'play' || pauseOpen || quitOpen) return;
      if (playMode === 'challenge' && chalTurnOpen) return;
      e.preventDefault();
      const p = piecesRef.current.find((x) => x.id === pid);
      if (!p) return;
      const range = getRange(p, piecesRef.current, grid);
      const isH = p.dir === 'h';
      const el = pieceEls.current[pid];
      if (el) {
        el.style.zIndex = '10';
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
        el.style.transition = 'none';
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      dragRef.current = {
        pid,
        isH,
        el,
        pointerId: e.pointerId,
        startPos: isH ? e.clientX : e.clientY,
        startGrid: isH ? p.col : p.row,
        range,
        moved: false,
        lastDx: 0,
      };
    },
    [grid, phase, playMode, chalTurnOpen, pauseOpen, quitOpen],
  );

  useEffect(() => {
    const onMove = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      e.preventDefault();
      const cur = d.isH ? e.clientX : e.clientY;
      let dx = cur - d.startPos;
      const minPx = (d.range.lo - d.startGrid) * cellSize;
      const maxPx = (d.range.hi - d.startGrid) * cellSize;
      dx = Math.max(minPx, Math.min(maxPx, dx));
      d.lastDx = dx;
      if (Math.abs(dx) > 3) d.moved = true;
      if (d.el) {
        d.el.style.transform = d.isH ? `translateX(${dx}px)` : `translateY(${dx}px)`;
      }
    };

    const cleanupPointer = (d) => {
      if (d.el && d.pointerId != null) {
        try {
          d.el.releasePointerCapture(d.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const onUp = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      cleanupPointer(d);
      if (d.el) {
        d.el.style.transform = '';
        d.el.style.zIndex = '';
        d.el.style.boxShadow = '';
        d.el.style.transition = '';
      }
      if (!d.moved) return;
      const dg = Math.round(d.lastDx / cellSize);
      if (dg === 0) return;
      playSfx('click');
      if (!firstMoveAtRef.current) firstMoveAtRef.current = performance.now();
      setMoves((m) => {
        const nextM = m + 1;
        setPieces((prev) => {
          const next = prev.map((p) => {
            if (p.id !== d.pid) return p;
            return d.isH ? { ...p, col: d.startGrid + dg } : { ...p, row: d.startGrid + dg };
          });
          if (isWon(next, grid, exitRow)) {
            wonRef.current = true;
            const lv = levelIndexRef.current;
            const mode = playModeRef.current;
            const solveMs = Math.round(performance.now() - puzzleStartRef.current);
            const planMs = firstMoveAtRef.current
              ? Math.round(firstMoveAtRef.current - puzzleStartRef.current)
              : null;
            setTimeout(() => {
              playSfx('win');
              setWon(true);
              if (mode === 'tutorial') {
                juice.celebrate();
                coachRef.current?.notify('solve');
                return;
              }
              // One puzzle = one trial; rt = solve time, plan = first-move latency.
              // The assessment warm-up jam is practice — not logged.
              if (!(mode === 'assess' && assessWarmupRef.current)) {
                trialLogRef.current?.trial({
                  rt: solveMs,
                  ok: true,
                  moves: nextM,
                  par: parMoves,
                  ...(planMs != null ? { plan: planMs } : {}),
                });
              }
              const dk = diffKeyRef.current;
              if (mode === 'levels') { syncProgressWin(dk, lv, nextM); awardTrainingWin('rush', dk, lv, RH_LEVELS_PER_TIER); }
              if (mode === 'levels') {
                trialLogRef.current?.finish({ won: true, moves: nextM, par: parMoves });
                trialLogRef.current = null;
              }
              if (mode === 'free') {
                freeStreakRef.current += 1;
                if (freeStreakRef.current > freeBestStreakRef.current) {
                  freeBestStreakRef.current = freeStreakRef.current;
                }
                const pts = rhFreeParPoints(parMoves, nextM, freeStreakRef.current);
                freeScoreRef.current += pts;
                setFreeScore(freeScoreRef.current);
                setFreeStreak(freeStreakRef.current);
                freeRoundsWonRef.current += 1;
                setFreeRoundsWon(freeRoundsWonRef.current);
              }
            }, 280);
          }
          return next;
        });
        return nextM;
      });
    };

    const onCancel = (e) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      dragRef.current = null;
      cleanupPointer(d);
      if (d.el) {
        d.el.style.transform = '';
        d.el.style.zIndex = '';
        d.el.style.boxShadow = '';
        d.el.style.transition = '';
      }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [cellSize, playSfx, grid, exitRow, parMoves, syncProgressWin]);

  // Per-puzzle clock for survival mode: each board gets its own time based on par.
  useEffect(() => {
    if (phase !== 'play' || playMode !== 'free' || !levelDef || wonRef.current) return;
    const secs = Math.max(30, Math.min(120, (levelDef.par ?? 6) * 5 + 25));
    freeTimeRef.current = secs;
    freeTimerEndedRef.current = false;
    if (freeTimeEl.current) {
      freeTimeEl.current.textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    }
  }, [levelDef, phase, playMode]);

  useEffect(() => {
    if (phase !== 'play' || playMode !== 'free' || pauseOpen || quitOpen) return undefined;
    const id = setInterval(() => {
      if (wonRef.current) return; // solved board: clock pauses until the next puzzle
      freeTimeRef.current = Math.max(0, freeTimeRef.current - 1);
      if (freeTimeEl.current) {
        const m = Math.floor(freeTimeRef.current / 60);
        const s = freeTimeRef.current % 60;
        freeTimeEl.current.textContent = `${m}:${String(s).padStart(2, '0')}`;
      }
      if (freeTimeRef.current <= 0 && !freeTimerEndedRef.current) {
        // Ran out of time on this puzzle → lose a life.
        freeTimerEndedRef.current = true;
        trialLogRef.current?.trial({ ok: false, timeout: true, moves: movesRef.current });
        freeStreakRef.current = 0;
        setFreeStreak(0);
        freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
        setFreeLives(freeLivesRef.current);
        if (freeLivesRef.current <= 0) {
          endFreeRun();
        } else {
          // Staircase: timing out steps the stage DOWN one (solve steps it up),
          // so puzzle difficulty converges on the player's threshold.
          setFreeStage((s) => Math.max(0, s - 1));
          setFreeSessionNonce((n) => (n + 1) >>> 0);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, playMode, pauseOpen, quitOpen]);

  const exitTop = exitRow * cellSize;
  const exitBot = (exitRow + 1) * cellSize;

  const stars =
    moves <= parMoves ? 3 : moves <= parMoves + 2 ? 2 : 1;

  /* ─── Assessment intro ─── */
  if (phase === 'assessStart') {
    return (
      <AssessmentReady
        isAr={isAr}
        label={assessmentLabel}
        step={assessmentStep}
        onStart={startAssessment}
        onBack={onAssessmentExit || onBack}
        playSfx={playSfx}
      />
    );
  }

  /* ─── Hub ─── */
  if (phase === 'hub') {
    return (
      <div
        className="cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100%',
          position: 'relative',
          color: '#141210',
          fontFamily: "'Outfit', system-ui, sans-serif",
          overflowX: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              maxWidth: 440,
              margin: '0 auto',
              padding:
                'max(52px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) 12px max(14px, env(safe-area-inset-left))',
            }}
          >
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                onBack();
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: '2px solid #1a1208',
                background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208',
              }}
            >
              <IconBack size={18} c="#141210" />
            </button>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 8px' }}>
              <div
                style={{
                  fontFamily: isAr ? "'Cairo', 'Outfit', sans-serif" : "'Outfit', system-ui, sans-serif",
                  fontSize: 'clamp(2rem, 8.2vw, 3.4rem)',
                  fontWeight: isAr ? 900 : 800,
                  letterSpacing: isAr ? 0 : '-0.03em',
                  lineHeight: 1.08,
                  color: '#141a17',
                }}
              >
                {t.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: '#5c534c',
                  marginTop: 4,
                  maxWidth: 280,
                  marginInline: 'auto',
                  lineHeight: 1.35,
                }}
              >
                {t.subtitle}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { playSfx('click'); replayTutorial(); }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: '2px solid #1a1208',
                background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208',
                fontFamily: "'Bangers', cursive",
                fontSize: 16,
                color: '#141210',
              }}
              aria-label={isAr ? 'إعادة الشرح' : 'Replay tutorial'}
              title={isAr ? 'إعادة الشرح' : 'Replay tutorial'}
            >
              ?
            </button>
          </div>

          <TrainingModeList
            isAr={isAr}
            playSfx={playSfx}
            items={[
              { k: 'free', ic: '♾️', lb: t.free, hint: t.hubNodeFreeHint, on: () => maybeCoach(() => setPhase('freeIntro')) },
              { k: 'levels', ic: '🎯', lb: t.levels, hint: t.hubNodeLevelsHint, on: () => maybeCoach(() => { setPlayMode('levels'); setPhase('pickDiff'); }) },
              { k: 'chal', ic: '⚔️', lb: t.challenge, hint: t.hubNodeChallengeHint, on: () => maybeCoach(() => setPhase('chal')) },
            ]}
          />
          <HubScienceLink gameId="rush-hour" isAr={isAr} playSfx={playSfx} />
        </div>

      </div>
    );
  }

  if (phase === 'pickDiff') {
    return (
      <TrainingDifficultySelect
        isAr={isAr}
        playSfx={playSfx}
        onBack={() => setPhase('hub')}
        title={t.pickDiff}
        blurb={t.pickDiffSub}
        diffKeys={RH_DIFF_KEYS}
        dm={DM}
        descs={t.diffDesc}
        onPick={(k) => {
          setDiffKey(k);
          setPhase('levels');
        }}
      />
    );
  }

  if (phase === 'freeIntro') {
    const pad = `max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))`;
    return (
      <div
        className="cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100%',
          position: 'relative',
          color: '#141210',
          fontFamily: "'Outfit', system-ui, sans-serif",
          overflowX: 'hidden',
          padding: pad,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 420, width: '100%', margin: '0 auto', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => {
              playSfx('click');
              setPhase('hub');
            }}
            style={{
              position: 'absolute',
              top: 0,
              [isAr ? 'right' : 'left']: 0,
              width: 34,
              height: 34,
              borderRadius: 12,
              border: '2px solid #1a1208',
              background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '3px 3px 0 #1a1208',
            }}
          >
            <IconBack size={18} c="#141210" />
          </button>
          <div
            style={{
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
              fontSize: isAr ? 26 : 28,
              fontWeight: isAr ? 900 : 400,
              letterSpacing: isAr ? 0 : 1.5,
              marginBottom: 20,
              marginTop: 8,
            }}
          >
            {t.freeIntroTitle}
          </div>
          <p
            style={{
              fontSize: isAr ? 16 : 15,
              color: '#4a4540',
              lineHeight: 1.7,
              maxWidth: 360,
              margin: '0 auto 28px',
              fontWeight: 500,
              padding: '0 8px',
            }}
          >
            {t.freeIntroBody}
          </p>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-pri"
            style={{ width: '100%', maxWidth: 280, margin: '0 auto', fontSize: 16, padding: '14px 24px' }}
            onClick={() => {
              playSfx('click');
              startFreeRun();
            }}
          >
            {t.freeIntroReady}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'chal') {
    const pad = `max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))`;
    return (
      <div
        className="cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100%',
          position: 'relative',
          color: '#141210',
          fontFamily: "'Outfit', system-ui, sans-serif",
          overflowX: 'hidden',
          padding: pad,
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 400, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setPhase('hub');
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: '2px solid #1a1208',
                background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208',
              }}
            >
              <IconBack size={18} c="#141210" />
            </button>
            <div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div>
          </div>
          <p className="ct-fq-sub ct-fq-training-blurb" style={{ lineHeight: 1.5 }}>
            {t.challengeSub}
          </p>
          <div className="ct-fq-card ct-fq-card-training">
            <h3>{t.pickDiff}</h3>
            <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.pickDiff}>
              {RH_DIFF_KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                  onClick={() => { playSfx('click'); setChalDiff(k); }}
                >
                  {DM[k].label}
                </button>
              ))}
            </div>
            <h3 style={{ marginTop: 14 }}>{t.players}</h3>
            {chalNames.map((nm, i) => (
              <div key={i} className="ct-fq-pr">
                <input
                  value={nm}
                  maxLength={20}
                  onChange={(e) => {
                    const next = [...chalNames];
                    next[i] = e.target.value;
                    setChalNames(next);
                  }}
                />
                {chalNames.length > 2 && (
                  <button
                    type="button"
                    className="ct-fq-prm"
                    onClick={() => {
                      setChalNames(chalNames.filter((_, j) => j !== i));
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {chalNames.length < 10 && (
              <button
                type="button"
                className="ct-fq-apb ct-fq-apb-training"
                onClick={() =>
                  setChalNames([...chalNames, `Player ${chalNames.length + 1}`])
                }
              >
                {t.addPl}
              </button>
            )}
            <h3 style={{ marginTop: 14 }}>{t.chalRounds}</h3>
            <p className="ct-fq-sub" style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}>
              {t.chalRoundsHint}
            </p>
            <div className="ct-fq-rr" role="group" aria-label={t.chalRounds}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`ct-fq-rrb${chalRoundsTotal === n ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                  onClick={() => {
                    playSfx('click');
                    setChalRoundsTotal(n);
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="ct-fq-btn ct-fq-btn-pri" style={{ marginTop: 18 }} onClick={openRhChallenge}>
            {t.startCh}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'freeRes') {
    const pad = `max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))`;
    return (
      <div
        className="cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100%',
          position: 'relative',
          color: '#141210',
          fontFamily: "'Outfit', system-ui, sans-serif",
          overflowX: 'hidden',
          padding: pad,
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div className="ct-fq-training-title ct-fq-training-title-sm" style={{ marginBottom: 12 }}>
            {t.freeResTitle}
          </div>
          <p style={{ color: '#5c534c', fontWeight: 700 }}>{t.freeRoundsCleared(freeResSnapshot.rounds)}</p>
          <p style={{ color: '#5c534c', fontWeight: 600, marginTop: 6 }}>
            {isAr ? 'النقاط' : 'Score'}: {freeResSnapshot.score}
          </p>
          <p style={{ color: '#5c534c', fontWeight: 600, marginTop: 4 }}>
            {isAr ? 'أفضل سلسلة' : 'Best streak'}: {freeResSnapshot.bestStreak}
          </p>
          <p style={{ fontSize: 12, color: '#8a7868', marginTop: 12 }}>
            {t.freeBestLine(progress.freeBest)}
          </p>
          <p style={{ fontSize: 12, color: '#8a7868' }}>{t.freeBestScoreLine(progress.freeBestScore)}</p>
          <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                setPhase('freeIntro');
              }}
            >
              {t.playAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={() => {
                playSfx('click');
                setPhase('hub');
              }}
            >
              {t.hub}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'chalRes' && lastRhChalRows) {
    const pad = `max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))`;
    const sorted = [...lastRhChalRows].sort((a, b) => a.rankScore - b.rankScore);
    return (
      <div
        className="cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100%',
          position: 'relative',
          color: '#141210',
          fontFamily: "'Outfit', system-ui, sans-serif",
          overflowX: 'hidden',
          padding: pad,
        }}
      >
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 420, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setLastRhChalRows(null);
                setPhase('hub');
                setChalFrozenDef(null);
                setPlayMode('levels');
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                border: '2px solid #1a1208',
                background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208',
              }}
            >
              <IconBack size={18} c="#141210" />
            </button>
            <div className="ct-fq-training-title ct-fq-training-title-sm">{t.chalResTitle}</div>
          </div>
          <p className="ct-fq-sub" style={{ marginBottom: 12, fontSize: 12 }}>
            {isAr ? 'أقل درجة مرتبة أفضل (حركات + وقت).' : 'Lower rank score wins (moves + time).'}
          </p>
          {sorted.map((row, i) => (
            <div
              key={row.nm}
              className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}
            >
              <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
              <div>
                <div className="ct-fq-lbnm">{row.nm}</div>
                <div className="ct-fq-lbdt">{t.chalResMovesLine(row.avgMoves, row.avgSec)}</div>
              </div>
              <div className="ct-fq-lbsc">{Math.round(row.rankScore)}</div>
            </div>
          ))}
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-pri"
            style={{ marginTop: 18, width: '100%' }}
            onClick={() => {
              playSfx('click');
              setLastRhChalRows(null);
              setChalFrozenDef(null);
              setPhase('chal');
            }}
          >
            {t.newCh}
          </button>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-ghost"
            style={{ marginTop: 8, width: '100%' }}
            onClick={() => {
              playSfx('click');
              setLastRhChalRows(null);
              setChalFrozenDef(null);
              setPhase('hub');
              setPlayMode('levels');
            }}
          >
            {t.menu}
          </button>
        </div>
      </div>
    );
  }

  /* ─── Level pick ─── */
  if (phase === 'levels') {
    const doneMap = progress.done || {};
    return (
      <TrainingLevelGrid
        isAr={isAr}
        playSfx={playSfx}
        onBack={() => setPhase('pickDiff')}
        title={DM[diffKey]?.label ?? diffKey}
        blurb={t.levelsSub(DM[diffKey]?.pop ?? '')}
        count={RH_LEVELS_PER_TIER}
        lvc={DM[diffKey]?.lvc ?? 'lvi'}
        isUnlocked={(lv) => isLevelUnlocked(diffKey, lv, doneMap)}
        isDone={() => false}
        sublabel={(lv) => {
          const best = progress.best?.[`${diffKey}-${lv}`];
          return best != null ? `★ ${best}` : '—';
        }}
        onPick={(lv) => {
          setLevelIndex(lv);
          setPlayMode('levels');
          setPhase('play');
        }}
      />
    );
  }

  /* ─── Play + win overlay ─── */
  if ((generating || !levelDef) && !(playMode === 'challenge' && chalTurnOpen)) {
    return (
      <div
        className="cancellation-task-game"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100vh',
          color: tokens.textDark,
          fontFamily: "'Outfit', system-ui, sans-serif",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, border: '3px solid #e8dfd0',
            borderTopColor: '#e8ac4e', borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 14px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: 14, color: '#5c534c', fontWeight: 600 }}>
            {isAr ? 'جارٍ إنشاء اللغز…' : 'Generating puzzle…'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cancellation-task-game"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100vh',
        color: tokens.textDark,
        fontFamily: "'Outfit', system-ui, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        .rh-piece { will-change: transform; }
        .rh-piece:active { cursor: grabbing !important; }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 38%)',
        }}
      />

      <TrainingPlayHeader
        isAr={isAr}
        title={
          playMode === 'tutorial'
            ? (isAr ? 'كيفية اللعب' : 'How to play')
            : playMode === 'assess'
              ? (assessWarmup ? (isAr ? 'إحماء — غير محتسب' : 'Warm-up — not scored') : (assessmentLabel || t.title))
              : playMode === 'free'
                ? t.free
                : playMode === 'challenge'
                  ? t.challenge
                  : `${DM[diffKey]?.label ?? ''} · ${t.level} ${levelIndex}`
        }
        subtitle={
          playMode === 'tutorial'
            ? ''
            : playMode === 'free' && levelDef?.diff != null
              ? `${DM[levelDef.diff]?.label} · ${isAr ? 'جولة' : 'Round'} ${freeStage + 1} · ${t.moves}: ${moves} · ${t.optimal}: ${parMoves}`
              : `${t.optimal}: ${parMoves} · ${t.moves}: ${moves}${playMode === 'free' ? ` · ${t.score}: ${freeScore}` : ''}`
        }
        playSfx={playSfx}
        menuAriaLabel={t.menu}
        pauseAriaLabel={t.paused}
        onMenu={playMode === 'tutorial' ? () => coach.skip() : onRhMenu}
        onPause={playMode === 'tutorial' ? undefined : onRhPause}
      />

      {playMode === 'free' && (
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            padding: '4px 16px 8px',
            zIndex: 5,
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 11,
              fontWeight: 800,
              color: '#5c534c',
            }}
          >
            <span className="ct-fq-lives" aria-label={`${freeLives} lives`} style={{ fontSize: 13 }}>
              {'♥'.repeat(Math.max(0, freeLives))}
              <span className="ct-fq-lives-spent">{'♥'.repeat(Math.max(0, 3 - freeLives))}</span>
            </span>
            <span ref={freeTimeEl} style={{ color: freeTimeRef.current <= 15 ? '#c97a7a' : '#5c534c' }}>
              {`${Math.floor(freeTimeRef.current / 60)}:${String(freeTimeRef.current % 60).padStart(2, '0')}`}
            </span>
            <span>
              {isAr ? 'نجح' : 'Solved'}: {freeRoundsWon}
            </span>
            <span>
              {t.score}: {freeScore}
            </span>
          </div>
        </div>
      )}

      {playMode === 'challenge' && !chalTurnOpen && (
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            padding: '2px 16px 6px',
            zIndex: 5,
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          <div
            className="ct-fq-cpb"
            style={{ marginBottom: 0, textAlign: 'center', fontSize: '0.82rem' }}
          >
            {chalRoundsTotal > 1 ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ` : ''}
            {chalNames[chalIdx] ?? ''} · {chalIdx + 1}/{chalNames.length} · {grid}×{grid}
          </div>
        </div>
      )}

      <p
        style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#5c534c',
          margin: '10px 16px 12px',
          fontWeight: 600,
          position: 'relative',
          zIndex: 2,
          maxWidth: 340,
          lineHeight: 1.4,
        }}
      >
        {isAr ? 'اسحب القطع على صفها — هدفك إيصال رجل المتاهة إلى المخرج' : 'Slide cars on their rails — get Maze Man to the exit'}
      </p>

      <div ref={boardRef} className="ct-juice-host" style={{ position: 'relative', zIndex: 2 }}>
        <JuiceLayer
          combo={juice.combo}
          particle={juice.particle}
          rtFx={juice.rtFx}
          toast={juice.toast}
          burst={juice.burst}
          showCombo={false}
        />
        <svg
          width={boardPx + 28}
          height={boardPx + 8}
          viewBox={`-4 -4 ${boardPx + 28} ${boardPx + 8}`}
          style={{
            position: 'absolute',
            top: -4,
            left: -4,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <defs>
            <pattern id="rh-grid-cell" width={cellSize} height={cellSize} patternUnits="userSpaceOnUse">
              <rect x={2} y={2} width={cellSize - 4} height={cellSize - 4} rx={4} fill="rgba(255,252,245,0.5)" />
            </pattern>
          </defs>
          <rect x={0} y={0} width={boardPx} height={boardPx} rx={8} fill="#e8dfd0" />
          <rect x={0} y={0} width={boardPx} height={boardPx} fill="url(#rh-grid-cell)" />
          <path
            d={`M 8 0 L ${boardPx - 8} 0 Q ${boardPx} 0 ${boardPx} 8 L ${boardPx} ${exitTop - 1} M ${boardPx} ${exitBot + 1} L ${boardPx} ${boardPx - 8} Q ${boardPx} ${boardPx} ${boardPx - 8} ${boardPx} L 8 ${boardPx} Q 0 ${boardPx} 0 ${boardPx - 8} L 0 8 Q 0 0 8 0`}
            fill="none"
            stroke="#b0a490"
            strokeWidth={3}
          />
          <rect
            x={boardPx - 1}
            y={exitTop + 3}
            width={20}
            height={cellSize - 6}
            rx={4}
            fill="#f5eee0"
            stroke="#c8b898"
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <g transform={`translate(${boardPx + 10}, ${exitTop + cellSize / 2})`}>
            <path
              d="M -3 -7 L 7 0 L -3 7"
              fill="#e8ac4e"
              stroke="#c8881e"
              strokeWidth={1}
              strokeLinejoin="round"
            />
          </g>
          <text
            x={boardPx + 10}
            y={exitTop - 5}
            fill="#b696d4"
            fontSize={8}
            fontWeight={800}
            letterSpacing={2}
            textAnchor="middle"
            fontFamily="'Outfit', sans-serif"
          >
            EXIT
          </text>
        </svg>

        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: boardPx,
            height: boardPx,
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {pieces.map((p) => {
            const w = (p.dir === 'h' ? p.len : 1) * cellSize - GAP * 2;
            const h = (p.dir === 'v' ? p.len : 1) * cellSize - GAP * 2;
            const x = p.col * cellSize + GAP;
            const y = p.row * cellSize + GAP;
            const st = pieceStyle(p.id);
            return (
              <div
                key={p.id}
                ref={(el) => {
                  if (el) pieceEls.current[p.id] = el;
                }}
                className="rh-piece"
                onPointerDown={(e) => handleDown(e, p.id)}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width: w,
                  height: h,
                  borderRadius: 10,
                  background: `linear-gradient(160deg, ${st.fill[0]}, ${st.fill[1]})`,
                  border: `2.5px solid ${st.border}`,
                  boxShadow: `0 3px 8px ${st.shadow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                  cursor: won ? 'default' : 'grab',
                  touchAction: 'none',
                  userSelect: 'none',
                  zIndex: p.isHero ? 5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                  transition: 'left 0.12s ease, top 0.12s ease',
                }}
              >
                {p.isHero ? (
                  <div
                    style={{
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                    }}
                  >
                    <MazeManAvatar
                      size={Math.max(36, Math.round(Math.min(w, h) * 1.02))}
                      mood="focused"
                      glow={false}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        right: isAr ? 'auto' : -2,
                        left: isAr ? -2 : 'auto',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 14,
                        color: '#fff',
                        fontWeight: 900,
                        opacity: 0.65,
                        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                      }}
                    >
                      {isAr ? '◂' : '▸'}
                    </div>
                  </div>
                ) : (
                  <BlockDecor dir={p.dir} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ct-training-play-actions">
        <button
          type="button"
          className="ct-training-btn ct-training-btn--ghost"
          onClick={() => {
            playSfx('click');
            resetRound();
          }}
        >
          {t.reset}
        </button>
        {playMode === 'free' && (
          <button
            type="button"
            className="ct-training-btn ct-training-btn--pri"
            style={{ maxWidth: 200 }}
            onClick={() => {
              playSfx('click');
              freeStreakRef.current = 0;
              setFreeStreak(0);
              setFreeSessionNonce((Math.imul(Date.now(), 1103515245) + 12345) >>> 0);
            }}
          >
            {isAr ? 'لغز آخر' : 'Skip puzzle'}
          </button>
        )}
        {playMode === 'free' && (
          <button
            type="button"
            className="ct-training-btn ct-training-btn--ghost"
            style={{ maxWidth: 200 }}
            onClick={() => {
              playSfx('click');
              endFreeRun();
            }}
          >
            {isAr ? 'إنهاء المحاولة' : 'End run'}
          </button>
        )}
      </div>

      {phase === 'play' && playMode === 'challenge' && chalTurnOpen && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={
            chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null
          }
          metaLine={`${grid}×${grid} · ${isAr ? 'نفس اللغز للجميع' : 'Same puzzle for all'}`}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startRhChallengeRound}
          playSfx={playSfx}
        />
      )}

      <TrainingPauseModal
        open={pauseOpen}
        labels={pauseLabels}
        onResume={() => setPauseOpen(false)}
        onRestart={() => {
          setPauseOpen(false);
          resetRound();
        }}
        onQuitMenu={() => {
          setPauseOpen(false);
          setQuitOpen(true);
        }}
      />
      <TrainingQuitModal
        open={quitOpen}
        labels={quitLabels}
        onConfirmQuit={confirmRhQuit}
        onKeepPlaying={() => setQuitOpen(false)}
      />

      {won && playMode !== 'assess' && playMode !== 'tutorial' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20,18,16,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, #fffefb, #f5efe8)',
              borderRadius: 18,
              border: '2.5px solid #1a1208',
              boxShadow: '6px 6px 0 #1a1208',
              padding: '26px 28px',
              textAlign: 'center',
              maxWidth: 320,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <MazeManAvatar size={108} mood="proud" glow />
            </div>
            <div
              style={{
                fontFamily: "'Fredoka One', 'Bangers', cursive",
                fontSize: 28,
                fontWeight: 400,
                color: '#e8ac4e',
                marginTop: 12,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {t.escaped}
            </div>
            <div style={{ fontSize: 15, color: '#5c534c', marginTop: 8, fontWeight: 700 }}>
              {moves} {isAr ? 'حركة' : 'moves'} · {t.optimal} {parMoves}
            </div>
            {playMode !== 'challenge' && (
              <div style={{ fontSize: 13, color: '#b696d4', marginTop: 6, fontWeight: 700 }}>
                {'★'.repeat(stars)} {stars === 3 ? t.perfect : stars === 2 ? t.good : t.tryLower}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {playMode === 'challenge' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      advanceRhChallengeAfterWin(moves);
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '2px solid #1a1208',
                      background: 'linear-gradient(180deg, #6b9e7a, #5a8a68)',
                      fontFamily: "'Bangers', cursive",
                      fontSize: 15,
                      letterSpacing: 1.2,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0 #1a1208',
                      color: '#fffefb',
                    }}
                  >
                    {t.nextRound}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setWon(false);
                      wonRef.current = false;
                      resetRound();
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '2px solid #1a1208',
                      background: 'linear-gradient(180deg, #f5c44a, #e8a830)',
                      fontFamily: "'Bangers', cursive",
                      fontSize: 15,
                      letterSpacing: 1.2,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0 #1a1208',
                      color: '#1a1208',
                    }}
                  >
                    {t.playAgain}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setWon(false);
                      wonRef.current = false;
                      setChalFrozenDef(null);
                      setChalTurnOpen(false);
                      setPhase('chal');
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '2px solid #1a1208',
                      background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                      fontFamily: "'Bangers', cursive",
                      fontSize: 15,
                      letterSpacing: 1.2,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0 #1a1208',
                      color: '#141210',
                    }}
                  >
                    {t.hub}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      resetRound();
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '2px solid #1a1208',
                      background: 'linear-gradient(180deg, #f5c44a, #e8a830)',
                      fontFamily: "'Bangers', cursive",
                      fontSize: 15,
                      letterSpacing: 1.2,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0 #1a1208',
                      color: '#1a1208',
                    }}
                  >
                    {t.playAgain}
                  </button>
                  {playMode === 'levels' && levelIndex < RH_LEVELS_PER_TIER && (
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setWon(false);
                        wonRef.current = false;
                        setLevelIndex((n) => n + 1);
                        setPhase('play');
                      }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '2px solid #1a1208',
                        background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                        fontFamily: "'Bangers', cursive",
                        fontSize: 15,
                        letterSpacing: 1.2,
                        cursor: 'pointer',
                        boxShadow: '3px 3px 0 #1a1208',
                        color: '#141210',
                      }}
                    >
                      {t.next}
                    </button>
                  )}
                  {playMode === 'free' && (
                    <button
                      type="button"
                      onClick={() => {
                        playSfx('click');
                        setWon(false);
                        wonRef.current = false;
                        setFreeStage((s) => s + 1);
                      }}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '2px solid #1a1208',
                        background: 'linear-gradient(180deg, #6b9e7a, #5a8a68)',
                        fontFamily: "'Bangers', cursive",
                        fontSize: 15,
                        letterSpacing: 1.2,
                        cursor: 'pointer',
                        boxShadow: '3px 3px 0 #1a1208',
                        color: '#fffefb',
                      }}
                    >
                      {t.nextRound}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      playSfx('click');
                      setWon(false);
                      wonRef.current = false;
                      if (playMode === 'free') {
                        endFreeRun();
                      } else {
                        setPhase('levels');
                      }
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 10,
                      border: '2px solid #1a1208',
                      background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                      fontFamily: "'Bangers', cursive",
                      fontSize: 15,
                      letterSpacing: 1.2,
                      cursor: 'pointer',
                      boxShadow: '3px 3px 0 #1a1208',
                      color: '#141210',
                    }}
                  >
                    {playMode === 'free' ? (isAr ? 'إنهاء المحاولة' : 'End run') : t.hub}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {coachActive && coach.step && (
        <CoachOverlay
          step={coach.step}
          index={coach.index}
          total={coach.total}
          onNext={coach.next}
          onSkip={coach.skip}
          isAr={isAr}
        />
      )}
    </div>
  );
}
