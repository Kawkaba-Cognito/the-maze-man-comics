import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { IconBack } from './TrainingIcons';
import MazeManAvatar from './MazeManAvatar';
import { getRange, isWon, clonePieces, RUSH_HOUR_BASE_LAYOUTS } from './rushHourEngine';
import {
  DM,
  freeTimeDrainMultiplier,
  FREE_SESSION_START_SEC,
  FREE_SESSION_CAP_SEC,
} from './focusQuestData';
import {
  getRushHourLevel,
  getRushHourFreeRound,
  buildChallengeRhPuzzle,
  mergeRhChallengeRow,
  RH_LEVELS_PER_TIER,
  RH_DIFF_KEYS,
  isLevelUnlocked,
  loadRhProgress,
  saveRhProgress,
  rhFreeClearBonusSec,
  rhFreeRoundClearPoints,
} from './rushHourLevels';

const GAP = 4;

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

function PaperBackdrop() {
  const uid = React.useId().replace(/:/g, '');
  const pat = `rh-mz-${uid}`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id={pat} width="160" height="160" patternUnits="userSpaceOnUse">
            <path
              d="M 0 40 L 70 40 L 70 110 L 120 110 L 120 0 M 96 40 L 96 160 M 36 72 L 36 160 M 0 124 L 58 124"
              fill="none"
              stroke="rgba(92, 78, 62, 0.09)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${pat})`} />
      </svg>
    </div>
  );
}

const UI_EN = {
  title: 'Rush Hour',
  subtitle: 'Logic parking puzzle — slide cars to free Maze Man.',
  levels: 'Level mode',
  free: 'Free mode',
  challenge: 'Challenge',
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
  freeHint: 'Session clock · curriculum scales like Attention',
  locked: 'Locked',
  training: 'Brain logic',
  pickDiff: 'Choose difficulty',
  pickDiffSub: 'Tiers match Attention · 20 stages each · unlock in order',
  hubNodeFreeHint: 'Session timer · score · streak clears',
  hubNodeLevelsHint: 'Tier grid · unlock 20',
  hubNodeChallengeHint: 'Same parking jam for everyone · pass & play',
  freeIntroTitle: 'Free mode',
  freeIntroBody:
    'One session timer for your whole run. Each solved puzzle adds a little time. Score from clears — streaks boost the bonus. When time hits zero, the run ends.',
  freeIntroReady: 'Ready',
  freeResTitle: 'Run ended',
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
  chalHud: (roundLabel, name, i, n, G) =>
    `${roundLabel}${name} — ${i + 1}/${n} · ${G}×${G}`,
  chalResTitle: 'Challenge results',
  chalResMovesLine: (avgM, avgS) => `${avgM.toFixed(1)} moves avg · ${avgS.toFixed(1)}s avg`,
  newCh: 'New challenge',
  menu: 'Menu',
  challengeTitle: 'Challenge mode',
  levelsSub: (pop) => `${pop} · Stages 1–20 · board 6×6→9×9`,
};

const UI_AR = {
  title: 'طريق الخروج',
  subtitle: 'لغز منطقي — حرّك السيارات لإخراج رجل المتاهة.',
  levels: 'وضع المراحل',
  free: 'وضع حر',
  challenge: 'تحدي',
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
  freeHint: 'عداد جلسة · نفس تدرّج الانتباه',
  locked: 'مقفل',
  training: 'تدريب منطقي',
  pickDiff: 'اختر الصعوبة',
  pickDiffSub: 'مستويات كالانتباه · 20 مرحلة · افتح بالترتيب',
  hubNodeFreeHint: 'وقت الجلسة · نقاط · سلسلة نجاح',
  hubNodeLevelsHint: 'شبكة المراحل · 20',
  hubNodeChallengeHint: 'نفس ازدحام المواقف للجميع · مرّر الجهاز',
  freeIntroTitle: 'وضع حر',
  freeIntroBody:
    'وقت واحد للجلسة. كل لغز تحله يضيف وقتاً. النقاط من الإكمال — السلسلة تزيد المكافأة. عند انتهاء الوقت تنتهي المحاولة.',
  freeIntroReady: 'جاهز',
  freeResTitle: 'انتهت المحاولة',
  freeRoundsCleared: (n) => `ألغاز ناجحة: ${n}`,
  freeBestLine: (n) => `أفضل إكمال: ${n}`,
  freeBestScoreLine: (n) => `أفضل نقاط: ${n}`,
  challengeTitle: 'وضع التحدي',
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
  chalHud: (roundLabel, name, i, n, G) =>
    `${roundLabel}${name} — ${i + 1}/${n} · ${G}×${G}`,
  chalResTitle: 'نتائج التحدي',
  chalResMovesLine: (avgM, avgS) =>
    `${avgM.toFixed(1)} حركة معدل · ${avgS.toFixed(1)}ث معدل`,
  newCh: 'تحدي جديد',
  menu: 'القائمة',
  levelsSub: (pop) => `${pop} · مراحل 1–20 · شبكة 6×6→9×9`,
};

export default function RushHourGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI_AR : UI_EN;

  const [phase, setPhase] = useState('hub');
  const [progress, setProgress] = useState(() => loadRhProgress());
  const [diffKey, setDiffKey] = useState('easy');
  const [levelIndex, setLevelIndex] = useState(1);
  const [playMode, setPlayMode] = useState('levels');
  const [chalFrozenDef, setChalFrozenDef] = useState(null);
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
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
  const [freeResSnapshot, setFreeResSnapshot] = useState({ rounds: 0, score: 0 });

  const freeStageRef = useRef(0);
  const freeStreakRef = useRef(0);
  const freeRoundsWonRef = useRef(0);
  const freeScoreRef = useRef(0);
  const tlRef = useRef(FREE_SESSION_START_SEC);
  const tlimRef = useRef(FREE_SESSION_START_SEC);
  const freeTimerEndedRef = useRef(false);

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

  useEffect(() => {
    if (playMode === 'challenge' && chalFrozenDef) {
      setLevelDef(chalFrozenDef);
      setGenerating(false);
      return;
    }
    setGenerating(true);
    const id = setTimeout(() => {
      const def = playMode === 'free'
        ? getRushHourFreeRound(freeStage, freeSessionNonce)
        : getRushHourLevel(diffKey, levelIndex);
      setLevelDef(def);
      setGenerating(false);
    }, 16);
    return () => clearTimeout(id);
  }, [playMode, diffKey, levelIndex, freeStage, freeSessionNonce, chalFrozenDef]);

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

  playModeRef.current = playMode;
  levelIndexRef.current = levelIndex;
  diffKeyRef.current = diffKey;
  piecesRef.current = pieces;

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
  }, [levelDef, phase, playMode, chalIdx, chalRoundIdx, chalFrozenDef]);

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
    setChalTurnOpen(true);
    setPlayMode('challenge');
    setPhase('play');
    setTimeout(() => {
      const board = buildChallengeRhPuzzle(
        (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0,
        0,
        chalRoundsTotal,
      );
      setChalFrozenDef(board);
    }, 16);
  }, [chalNames, chalRoundsTotal, isAr, playSfx, t.needTwo]);

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
          setTimeout(() => {
            const board = buildChallengeRhPuzzle(
              (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0,
              chalCycleRef.current,
              totalR,
            );
            setChalFrozenDef(board);
            setChalTurnOpen(true);
            setGenerating(false);
          }, 16);
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
    if (playMode === 'free') freeStreakRef.current = 0;
  }, [levelDef, playMode]);

  const startFreeRun = useCallback(() => {
    freeTimerEndedRef.current = false;
    tlRef.current = FREE_SESSION_START_SEC;
    tlimRef.current = FREE_SESSION_START_SEC;
    freeStageRef.current = 0;
    freeStreakRef.current = 0;
    freeRoundsWonRef.current = 0;
    freeScoreRef.current = 0;
    setFreeStage(0);
    setFreeScore(0);
    setFreeRoundsWon(0);
    setFreeSessionNonce((Math.imul(Date.now(), 1103515245) + 12345) >>> 0);
    setPlayMode('free');
    setPhase('play');
  }, []);

  const handleDown = useCallback(
    (e, pid) => {
      if (wonRef.current || phase !== 'play') return;
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
    [grid, phase, playMode, chalTurnOpen],
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
            setTimeout(() => {
              playSfx('win');
              setWon(true);
              const dk = diffKeyRef.current;
              if (mode === 'levels') syncProgressWin(dk, lv, nextM);
              if (mode === 'free') {
                const st = freeStageRef.current;
                const bonus = rhFreeClearBonusSec(st, parMoves);
                tlRef.current = Math.min(FREE_SESSION_CAP_SEC, tlRef.current + bonus);
                tlimRef.current = Math.max(tlimRef.current, tlRef.current);
                freeStreakRef.current += 1;
                const pts = rhFreeRoundClearPoints(parMoves, freeStreakRef.current);
                freeScoreRef.current += pts;
                setFreeScore(freeScoreRef.current);
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

  const freeTimeEl = useRef(null);
  const freeBarEl = useRef(null);

  useEffect(() => {
    if (phase !== 'play' || playMode !== 'free') return undefined;
    const id = setInterval(() => {
      const drain = freeTimeDrainMultiplier(freeStageRef.current);
      tlRef.current = Math.max(0, tlRef.current - 0.25 * drain);
      /* Direct DOM update — avoids full React re-render every 250ms */
      if (freeTimeEl.current) {
        freeTimeEl.current.textContent = `${Math.max(0, Math.ceil(tlRef.current))}s`;
      }
      if (freeBarEl.current) {
        freeBarEl.current.style.width = `${Math.min(100, (tlRef.current / Math.max(tlimRef.current, 1)) * 100)}%`;
        freeBarEl.current.style.background = tlRef.current > 10
          ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)'
          : 'linear-gradient(90deg,#e8a07a,#c97a7a)';
      }
      if (tlRef.current <= 0 && !freeTimerEndedRef.current) {
        freeTimerEndedRef.current = true;
        setFreeResSnapshot({
          rounds: freeRoundsWonRef.current,
          score: freeScoreRef.current,
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
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, playMode]);

  const exitTop = exitRow * cellSize;
  const exitBot = (exitRow + 1) * cellSize;

  const stars =
    moves <= parMoves ? 3 : moves <= parMoves + 2 ? 2 : 1;

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
        <PaperBackdrop />
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
                  fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
                  fontSize: isAr ? 21 : 24,
                  fontWeight: isAr ? 900 : 400,
                  letterSpacing: isAr ? 0 : 1,
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
            <div style={{ width: 34 }} />
          </div>

          <div className="ct-fq-attn-modes" style={{ maxWidth: 400 }} role="group">
            <button
              type="button"
              className="ct-fq-attn-mode ct-fq-attn-mode--free"
              onClick={() => {
                playSfx('click');
                setPhase('freeIntro');
              }}
            >
              <span className="ct-fq-attn-mode-ic" aria-hidden="true">
                ♾️
              </span>
              <span className="ct-fq-attn-mode-body">
                <span className="ct-fq-attn-mode-lb">{t.free}</span>
                <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
                  {t.hubNodeFreeHint}
                </span>
              </span>
              <span className="ct-fq-attn-mode-chev" aria-hidden="true">
                ›
              </span>
            </button>
            <button
              type="button"
              className="ct-fq-attn-mode ct-fq-attn-mode--levels"
              onClick={() => {
                playSfx('click');
                setPlayMode('levels');
                setPhase('pickDiff');
              }}
            >
              <span className="ct-fq-attn-mode-ic" aria-hidden="true">
                🎯
              </span>
              <span className="ct-fq-attn-mode-body">
                <span className="ct-fq-attn-mode-lb">{t.levels}</span>
                <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
                  {t.hubNodeLevelsHint}
                </span>
              </span>
              <span className="ct-fq-attn-mode-chev" aria-hidden="true">
                ›
              </span>
            </button>
            <button
              type="button"
              className="ct-fq-attn-mode ct-fq-attn-mode--chal"
              onClick={() => {
                playSfx('click');
                setPhase('chal');
              }}
            >
              <span className="ct-fq-attn-mode-ic" aria-hidden="true">
                ⚔️
              </span>
              <span className="ct-fq-attn-mode-body">
                <span className="ct-fq-attn-mode-lb">{t.challenge}</span>
                <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
                  {t.hubNodeChallengeHint}
                </span>
              </span>
              <span className="ct-fq-attn-mode-chev" aria-hidden="true">
                ›
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'pickDiff') {
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
        <PaperBackdrop />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 440, margin: '0 auto' }}>
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
            <div
              style={{
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
                fontSize: 20,
                fontWeight: isAr ? 800 : 400,
              }}
            >
              {t.pickDiff}
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              color: '#5c534c',
              margin: '0 0 16px',
              lineHeight: 1.45,
            }}
          >
            {t.pickDiffSub}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {RH_DIFF_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={`ct-fq-db ct-fq-db-${k} ct-fq-db-training`}
                onClick={() => {
                  playSfx('click');
                  setDiffKey(k);
                  setPhase('levels');
                }}
              >
                <span>{DM[k].label}</span>
                <span className="ct-fq-dbg">{t.levelsSub(DM[k].pop)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
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
        }}
      >
        <PaperBackdrop />
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
            <div className="ct-fq-training-title ct-fq-training-title-sm">{t.freeIntroTitle}</div>
          </div>
          <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 4, lineHeight: 1.5 }}>
            {t.freeIntroBody}
          </p>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-pri"
            style={{ marginTop: 20, width: '100%' }}
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
        <PaperBackdrop />
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
            <h3>{t.players}</h3>
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
        <PaperBackdrop />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div className="ct-fq-training-title ct-fq-training-title-sm" style={{ marginBottom: 12 }}>
            {t.freeResTitle}
          </div>
          <p style={{ color: '#5c534c', fontWeight: 700 }}>{t.freeRoundsCleared(freeResSnapshot.rounds)}</p>
          <p style={{ color: '#5c534c', fontWeight: 600, marginTop: 6 }}>
            {isAr ? 'النقاط' : 'Score'}: {freeResSnapshot.score}
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
        <PaperBackdrop />
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
    return (
      <div
        className="cancellation-task-game ct-fq-training-shell ct-fq-training-shell--hub-light"
        dir={isAr ? 'rtl' : 'ltr'}
        style={{
          minHeight: '100%',
          position: 'relative',
          overflowX: 'hidden',
          padding:
            'max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))',
        }}
      >
        <PaperBackdrop />
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 440, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                setPhase('pickDiff');
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
            <div
              style={{
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
                fontSize: 20,
                fontWeight: isAr ? 800 : 400,
              }}
            >
              {DM[diffKey]?.label ?? diffKey}
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#5c534c', margin: '0 0 12px', lineHeight: 1.4 }}>
            {t.levelsSub(DM[diffKey]?.pop ?? '')}
          </p>
          <div className="ct-fq-lg" style={{ maxWidth: '100%' }}>
            {Array.from({ length: RH_LEVELS_PER_TIER }, (_, i) => {
              const lv = i + 1;
              const doneMap = progress.done || {};
              const unlocked = isLevelUnlocked(diffKey, lv, doneMap);
              const bk = `${diffKey}-${lv}`;
              const best = progress.best?.[bk];
              const cls = `ct-fq-lb ${unlocked ? `ct-${DM[diffKey]?.lvc ?? 'lvi'}` : 'ct-lvk'}`;
              return (
                <button
                  key={bk}
                  type="button"
                  disabled={!unlocked}
                  className={cls}
                  onClick={() => {
                    if (!unlocked) return;
                    playSfx('click');
                    setLevelIndex(lv);
                    setPlayMode('levels');
                    setPhase('play');
                  }}
                >
                  <span className="ct-ln">{lv}</span>
                  <span className="ct-ls">
                    {unlocked ? (best != null ? `★ ${best}` : '—') : t.locked}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
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
          background: '#fdf8f5',
          color: '#141210',
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
        background: '#fdf8f5',
        color: '#141210',
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
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.65) 0%, transparent 42%),
            radial-gradient(ellipse 110% 55% at 50% 0%, rgba(182,150,212,0.09) 0%, transparent 52%)
          `,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          maxWidth: 400,
          padding:
            'max(52px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) 0 max(14px, env(safe-area-inset-left))',
          position: 'relative',
          zIndex: 5,
          boxSizing: 'border-box',
        }}
      >
        <button
          type="button"
          onClick={() => {
            playSfx('click');
            if (playMode === 'free') setPhase('hub');
            else if (playMode === 'challenge') {
              setChalFrozenDef(null);
              setChalTurnOpen(false);
              setPhase('chal');
            } else setPhase('levels');
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
            boxShadow: '3px 3px 0 #1a1208, inset 0 1px 0 rgba(255,255,255,0.85)',
          }}
        >
          <IconBack size={18} c="#141210" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
              fontSize: isAr ? 19 : 22,
              fontWeight: isAr ? 900 : 400,
              letterSpacing: isAr ? 0 : 1,
            }}
          >
            {playMode === 'free' && t.free}
            {playMode === 'challenge' && t.challenge}
            {playMode === 'levels' &&
              `${DM[diffKey]?.label ?? ''} · ${t.level} ${levelIndex}`}
          </div>
          {playMode === 'free' && levelDef?.diff != null && (
            <div style={{ fontSize: 10, color: '#8a7868', marginTop: 2, fontWeight: 700 }}>
              {DM[levelDef.diff]?.label} · {isAr ? 'جولة' : 'Round'} {freeStage + 1}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#5c534c', marginTop: 3, fontWeight: 600 }}>
            {t.optimal}: {parMoves} · {t.moves}: {moves}
            {playMode === 'free' && (
              <>
                {' · '}
                {t.score}: {freeScore}
              </>
            )}
          </div>
        </div>
        <div style={{ width: 34 }} />
      </div>

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
              marginBottom: 4,
            }}
          >
            <span>
              {t.time}: <span ref={freeTimeEl}>{Math.max(0, Math.ceil(tlRef.current))}s</span>
            </span>
            <span>
              {isAr ? 'نجح' : 'Cleared'}: {freeRoundsWon}
            </span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: 'rgba(26,18,8,0.1)',
              overflow: 'hidden',
              border: '1px solid rgba(26,18,8,0.12)',
            }}
          >
            <div
              ref={freeBarEl}
              style={{
                width: `${Math.min(100, (tlRef.current / Math.max(tlimRef.current, 1)) * 100)}%`,
                height: '100%',
                background:
                  tlRef.current > 10
                    ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)'
                    : 'linear-gradient(90deg,#e8a07a,#c97a7a)',
                transition: 'width 0.2s linear',
              }}
            />
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

      <div style={{ position: 'relative', zIndex: 2 }}>
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

      <div
        style={{
          marginTop: 22,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          padding: '0 12px',
        }}
      >
        <button
          type="button"
          onClick={() => {
            playSfx('click');
            resetRound();
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: '2px solid #1a1208',
            background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
            fontFamily: "'Bangers', cursive",
            fontSize: 14,
            letterSpacing: 1.2,
            cursor: 'pointer',
            boxShadow: '3px 3px 0 #1a1208',
            color: '#141210',
          }}
        >
          {t.reset}
        </button>
        {playMode === 'free' && (
          <button
            type="button"
            onClick={() => {
              playSfx('click');
              tlRef.current = Math.max(0, tlRef.current - 5);
              freeStreakRef.current = 0;
              setFreeSessionNonce((Math.imul(Date.now(), 1103515245) + 12345) >>> 0);
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '2px solid #1a1208',
              background: 'linear-gradient(180deg, #f5c44a, #e8a830)',
              fontFamily: "'Bangers', cursive",
              fontSize: 14,
              letterSpacing: 1.2,
              cursor: 'pointer',
              boxShadow: '3px 3px 0 #1a1208',
              color: '#1a1208',
            }}
          >
            {isAr ? 'لغز آخر' : 'New layout'}
          </button>
        )}
      </div>

      {phase === 'play' && playMode === 'challenge' && chalTurnOpen && chalNames[chalIdx] && (
        <div className="ct-fq-ov">
          <div className="ct-fq-box">
            {chalRoundsTotal > 1 && (
              <p className="ct-fq-cpb" style={{ marginBottom: 10 }}>
                {t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)}
              </p>
            )}
            <p className="ct-fq-cpb" style={{ marginBottom: 8, fontSize: '0.85rem', opacity: 0.92 }}>
              {grid}×{grid}
            </p>
            <h2>{t.ready(chalNames[chalIdx])}</h2>
            <p>{t.handTo(chalNames[chalIdx])}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={startRhChallengeRound}>
              {t.goReady}
            </button>
          </div>
        </div>
      )}

      {won && (
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
                      if (playMode === 'free') setPhase('hub');
                      else setPhase('levels');
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
