import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { useCoach } from '../../../../shared/coach/useCoach';
import CoachOverlay from '../../../../shared/coach/CoachOverlay';
import { createTrialLog } from '../../../../shared/trialLog';
import WordleModes from './WordleModes';
import { buildWordleCoachSteps } from './tutorialScript';
import LetterLinkBoard from './LetterLinkBoard';
import WordleLiveHud from './WordleLiveHud';
import {
  WORDLE_LEVELS_PER_TIER,
  WORDLE_DIFF_KEYS,
  WORDLE_DM,
  WORDLE_FREE_LIVES,
  specificationForLevel,
  prepareFreeRound,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengeRound,
  prepareAssessRound,
  trySubmitWord,
  wordFromPath,
  gradeRound,
  isWordleLevelUnlocked,
  freeWordPoints,
  mergeWordleChallengeRow,
  compareWordleChallengeRows,
} from './wordleData';
import { loadWordleProfile, saveWordleProfile } from './wordleProgress';
import { prewarmLinkTrie } from './linkDictionary';
import AssessmentReady from '../../../../assessment/AssessmentReady';

const UI = {
  en: {
    hubLang: 'Language',
    hubTag: 'training',
    hubAttentionWord: 'Word Maze',
    hubTrainingTag: 'training',
    title: 'Word Maze',
    subtitle: 'Connect letters to spell words',
    replayTutorial: 'Replay tutorial',
    freeMode: 'Survival mode',
    levelMode: 'Level mode',
    challengeMode: 'Pass n Play',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Endless · 3 lives · grids ramp up',
    hubNodeLevelsHint: '100 levels · connect letters on the grid',
    hubNodeChallengeHint: 'Same grid for all · pick a difficulty',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Drag across touching letters (including diagonals) to spell words',
    diffDesc: {
      easy: 'Common words · 3+ letters · 4×4 grid.',
      medium: 'Mixed vocabulary · 3+ letters · 5×5 grid.',
      hard: 'Tougher words · 4+ letters · 5×5 grid.',
    },
    chalPickDiff: 'Difficulty',
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–100`,
    time: 'Time',
    lvl: 'Level',
    resultsLevelRetryTitle: 'Try again',
    freeIntroTitle: 'Survival mode',
    freeIntroBody:
      'Endless grids that get harder. Each grid asks for a few words before its timer runs out. You have 3 lives — miss the target in time and you lose one. The run ends only when your lives reach zero.',
    freeIntroReady: 'Ready',
    challengeTitle: 'Pass n Play',
    challengeSub: 'Same letter grid for everyone · pick a difficulty · pass the device',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Same grid each round · pass device between players',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same letter grid for every player this round',
    chalBulletPass: 'Start only when this player holds the device',
    handTo: (n) => `Hand device to ${n}.`,
    goReady: 'Start linking',
    chalMeta: (label) => `${label} · 90s`,
    connectHint: 'Drag through touching letters · lift finger to submit',
    tooShort: (n) => `Need at least ${n} letters`,
    notAWord: "Can't spell that on this grid",
    alreadyFound: 'Already found',
    found: (w, pts) => `+${pts} ${w.toUpperCase()}`,
    wordsProgress: (n, target) => `Words ${n}/${target}`,
    timeLeft: (s) => `Time ${s}s`,
    sessionTime: (s) => `Session ${s}s`,
    score: 'Score',
    foundList: 'Found',
    clearPath: 'Clear',
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart grid',
    quitMenu: 'Quit to menu',
    quitQ: 'Quit?',
    quitLose: 'This run will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    freeLvl: (d, lv) => `Survival · ${d} L${lv}`,
    resultsPass: 'Level complete',
    resultsFail: 'Time up — try again',
    stars: 'Stars',
    vfs: 'VFS (verbal fluency)',
    wordsFound: 'Words found',
    totalScore: 'Score',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    freeGameOver: 'Run ended',
    freeStages: (n) => `Words found: ${n}`,
    freeBest: (n) => `Best words: ${n}`,
    freePlayAgain: 'Play again',
    resultsChalTitle: 'Pass n Play results',
    chalRes: (vfs, sc) => `VFS ${vfs} · ${sc} pts`,
    newCh: 'New game',
    levelHeader: (d, lv) => `${WORDLE_DM[d]?.label ?? d} · L${lv}`,
    levelMeta: (n, min) => `Find ${n} words · ${min}+ letters`,
    challengeHeader: 'Pass n Play',
    freeHeader: 'Survival mode',
    minLetters: (n) => `Min ${n} letters`,
    formulaHint: 'Any real word you can connect on the grid counts. Longer words score more.',
  },
  ar: {
    hubLang: 'لغة',
    hubTag: 'تدريب',
    hubAttentionWord: 'متاهة الكلمات',
    hubTrainingTag: 'تدريب',
    title: 'متاهة الكلمات',
    subtitle: 'وصّل الحروف لتكوين كلمات',
    replayTutorial: 'إعادة الشرح',
    freeMode: 'وضع البقاء',
    levelMode: 'وضع المستويات',
    challengeMode: 'مرّر والعب',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'لا ينتهي · ٣ أرواح · شبكات تزداد صعوبة',
    hubNodeLevelsHint: '١٠٠ مستوى · وصّل الحروف',
    hubNodeChallengeHint: 'نفس الشبكة للجميع · اختر الصعوبة',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'اسحب على حروف متجاورة (بما فيها القطر) لتكوين كلمات',
    diffDesc: {
      easy: 'كلمات شائعة · ٣+ أحرف · شبكة ٤×٤.',
      medium: 'مفردات متنوعة · ٣+ أحرف · شبكة ٥×٥.',
      hard: 'كلمات أصعب · ٤+ أحرف · شبكة ٥×٥.',
    },
    chalPickDiff: 'الصعوبة',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–100`,
    time: 'الوقت',
    lvl: 'مستوى',
    resultsLevelRetryTitle: 'حاول مجددًا',
    freeIntroTitle: 'وضع البقاء',
    freeIntroBody:
      'شبكات لا تنتهي وتزداد صعوبة. كل شبكة تطلب بضع كلمات قبل نفاد مؤقتها. لديك ٣ أرواح — إن لم تبلغ الهدف في الوقت تخسر روحاً. تنتهي المحاولة فقط عند نفاد الأرواح.',
    freeIntroReady: 'جاهز',
    challengeTitle: 'مرّر والعب',
    challengeSub: 'نفس الشبكة للجميع · اختر الصعوبة · مرّر الجهاز',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات',
    chalRoundsHint: 'نفس الشبكة · مرّر الجهاز',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس شبكة الحروف للجميع',
    chalBulletPass: 'ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الوصل',
    chalMeta: (label) => `${label} · ٩٠ث`,
    connectHint: 'اسحب على حروف متلامسة · ارفع الإصبع للإرسال',
    tooShort: (n) => `يلزم ${n} أحرف على الأقل`,
    notAWord: 'لا يمكن تكوينها على هذه الشبكة',
    alreadyFound: 'وُجدت مسبقًا',
    found: (w, pts) => `+${pts} ${w.toUpperCase()}`,
    wordsProgress: (n, target) => `كلمات ${n}/${target}`,
    timeLeft: (s) => `الوقت ${s}ث`,
    sessionTime: (s) => `الجلسة ${s}ث`,
    score: 'نقاط',
    foundList: 'وُجدت',
    clearPath: 'مسح',
    paused: 'متوقف',
    resume: 'متابعة',
    restart: 'إعادة الشبكة',
    quitMenu: 'الخروج للقائمة',
    quitQ: 'خروج؟',
    quitLose: 'سيُلغى هذا السجل.',
    yesQuit: 'نعم، خروج',
    keep: 'متابعة اللعب',
    freeLvl: (d, lv) => `حر · ${d} ${lv}`,
    resultsPass: 'اكتمل المستوى',
    resultsFail: 'انتهى الوقت — حاول مجددًا',
    stars: 'نجوم',
    vfs: 'VFS',
    wordsFound: 'كلمات',
    totalScore: 'نقاط',
    nextLv: 'المستوى التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    freeGameOver: 'انتهت المحاولة',
    freeStages: (n) => `كلمات: ${n}`,
    freeBest: (n) => `أفضل: ${n}`,
    freePlayAgain: 'العب مجددًا',
    resultsChalTitle: 'نتائج مرّر والعب',
    chalRes: (vfs, sc) => `VFS ${vfs} · ${sc}`,
    newCh: 'لعبة جديدة',
    levelHeader: (d, lv) => `${WORDLE_DM[d]?.label ?? d} · ${lv}`,
    levelMeta: (n, min) => `${n} كلمات · ${min}+ أحرف`,
    challengeHeader: 'مرّر والعب',
    freeHeader: 'وضع البقاء',
    minLetters: (n) => `الحد ${n} أحرف`,
    formulaHint: 'الكلمات الأطول = نقاط أكثر. الحروف متجاورة دون تكرار.',
  },
};

export default function WordleGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep }) {
  const { playSfx, currentLang, awardTrainingWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  // WORKOUT MODE: launched from the Daily Workout — skip the hub and jump
  // straight into free play; the workout shell owns timing and exit.
  const workoutLaunched = useRef(false);
  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) { workoutLaunched.current = true; startFree(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode]);
  const lang = isAr ? 'ar' : 'en';

  const [profile, setProfile] = useState(() => loadWordleProfile());
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [round, setRound] = useState(null);
  const [path, setPath] = useState([]);
  const [msg, setMsg] = useState('');
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastGrade, setLastGrade] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const [freeLives, setFreeLives] = useState(WORDLE_FREE_LIVES);
  const [freeScore, setFreeScore] = useState(0);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('medium');
  const chalDiffRef = useRef('medium');

  const roundRef = useRef(null);
  const pathRef = useRef([]);
  const trialLogRef = useRef(null);
  const tlRef = useRef(60);
  const tlimRef = useRef(60);
  const roundTimerIdRef = useRef(0);
  const freeStageRef = useRef(0);
  const freeWordsRef = useRef(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const freeLivesRef = useRef(WORDLE_FREE_LIVES);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);

  const juice = useJuice();
  const [coachActive, setCoachActive] = useState(false);
  const coachActiveRef = useRef(false);
  const coachRef = useRef(null);
  const pendingAfterCoachRef = useRef(null);
  const boardRef = useRef(null);
  useEffect(() => {
    coachActiveRef.current = coachActive;
  }, [coachActive]);
  const pauseRef = useRef(false);

  const doneMap = profile.done || {};

  useEffect(() => {
    pauseRef.current = pauseOpen;
  }, [pauseOpen]);

  useEffect(() => {
    prewarmLinkTrie(lang);
  }, [lang]);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  const stopRoundTimer = useCallback(() => {
    roundTimerIdRef.current += 1;
  }, []);

  const clearPlay = useCallback(() => {
    stopRoundTimer();
    roundRef.current = null;
    setRound(null);
    setPath([]);
    setMsg('');
    setPauseOpen(false);
    setQuitOpen(false);
    setChalTurnOpen(false);
  }, [stopRoundTimer]);

  const persistLevel = useCallback(
    (r, grade) => {
      const p = {
        ...profile,
        tel: [...(profile.tel || [])],
        done: { ...doneMap },
      };
      p.tel.push({
        diff: r.diff,
        lv: r.lv,
        won: grade.won,
        vfs: grade.vfs,
        words: r.found.length,
        ts: new Date().toISOString(),
      });
      if (grade.won && r.mode === 'level') {
        p.done[`${r.diff}-${r.lv}`] = true;
        awardTrainingWin('wordle', r.diff, r.lv, WORDLE_LEVELS_PER_TIER);
      }
      saveWordleProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const finishRound = useCallback(
    (r, timedOut = false) => {
      if (timedOut && r.mode === 'level') r.failed = true;
      const grade = gradeRound(r);
      setLastGrade(grade);
      roundRef.current = r;
      setRound({ ...r });

      if (r.mode === 'assess') {
        stopRoundTimer();
        if (r.practice) {
          // Practice over — swap in the measured 90s grid (same newGrid pattern
          // as survival mode; the round timer restarts via the round.seed effect).
          const seed2 = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
          const nr = prepareAssessRound(seed2, lang);
          roundRef.current = nr;
          setRound(nr);
          setPath([]);
          setMsg('');
          tlRef.current = nr.timeLeft;
          tlimRef.current = nr.timeSec;
          return;
        }
        const avgLen = r.found.length ? (r.found.reduce((s, w) => s + w.length, 0) / r.found.length) : 0;
        trialLogRef.current?.finish({ score: grade.vfs, words: r.found.length });
        trialLogRef.current = null;
        onAssessmentComplete?.({ score: grade.vfs, line: `${r.found.length} words · ⌀${avgLen.toFixed(1)}` });
        return;
      }

      if (r.mode === 'level') {
        trialLogRef.current?.finish({ won: grade.won, vfs: grade.vfs, words: r.found.length });
        trialLogRef.current = null;
        setLastResult({
          type: 'level',
          r: { diff: r.diff, lv: r.lv },
          stats: {
            won: grade.won,
            vfs: grade.vfs,
            stars: grade.stars,
            timeUsed: Math.max(0, (r.timeSec || 75) - r.timeLeft),
            words: r.found.length,
            score: r.score,
          },
        });
        persistLevel(r, grade);
        setPhase('res');
        return;
      }

      if (r.mode === 'free') {
        stopRoundTimer();
        // Stage boundary marker (no ok/rt → excluded from shared RT metrics).
        trialLogRef.current?.trial({ kind: 'round', won: !!r.complete, stage: freeStageRef.current });
        const newGrid = (stage) => {
          const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
          const nr = prepareFreeRound(stage, seed, lang);
          roundRef.current = nr;
          setRound(nr);
          setPath([]);
          setMsg('');
          tlRef.current = nr.timeLeft;
          tlimRef.current = nr.timeSec;
        };
        if (r.complete) {
          // Reached the target → ramp to a harder grid (lives unchanged).
          freeStageRef.current += 1;
          newGrid(freeStageRef.current);
          return;
        }
        // Timed out before the target → lose a life and step DOWN one stage
        // (adaptive staircase: complete → +1, fail → −1).
        freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
        setFreeLives(freeLivesRef.current);
        if (freeLivesRef.current > 0) {
          freeStageRef.current = Math.max(0, freeStageRef.current - 1);
          newGrid(freeStageRef.current);
          return;
        }
        const p = {
          ...profile,
          bestStages: Math.max(profile.bestStages ?? 0, freeWordsRef.current),
          bestFreeScore: Math.max(profile.bestFreeScore ?? 0, freeScoreRef.current),
          bestFree: Math.max(profile.bestFree ?? 0, freeWordsRef.current),
        };
        saveWordleProfile(p);
        setProfile(p);
        trialLogRef.current?.finish({
          words: freeWordsRef.current,
          score: freeScoreRef.current,
          level: Math.floor(freeWordsRef.current / 3),
        });
        trialLogRef.current = null;
        awardFreeRun('wordle', Math.floor(freeWordsRef.current / 3));
        setPhase('freeRes');
        return;
      }

      if (r.mode === 'challenge') {
        const nm = chalNamesRef.current[chalIdxRef.current] || 'Player';
        const row = mergeWordleChallengeRow(
          chalScoresRef.current[chalIdxRef.current],
          grade,
          r,
          nm,
        );
        const scores = [...chalScoresRef.current];
        scores[chalIdxRef.current] = row;
        chalScoresRef.current = scores;
        setChalScores(scores);
        stopRoundTimer();

        if (chalIdxRef.current + 1 < chalNamesRef.current.length) {
          setChalIdx(chalIdxRef.current + 1);
          roundRef.current = null;
          setRound(null);
          setPath([]);
          setChalTurnOpen(true);
          setPhase('play');
          return;
        }

        const cycle = chalCycleRef.current + 1;
        chalCycleRef.current = cycle;
        if (cycle < chalRoundsTotalRef.current) {
          chalIdxRef.current = 0;
          setChalIdx(0);
          setChalRoundIdx(cycle);
          const seed = prepareChallengeSeed(chalDiffRef.current, lang);
          setChalSeed(seed);
          roundRef.current = null;
          setRound(null);
          setPath([]);
          setChalTurnOpen(true);
          setPhase('play');
          return;
        }
        setPhase('chalRes');
        return;
      }

      setPhase('res');
    },
    [profile, persistLevel, stopRoundTimer, lang, onAssessmentComplete],
  );

  const commitPath = useCallback(() => {
    const r = roundRef.current;
    if (!r || pauseOpen) return;
    const p = pathRef.current;
    if (p.length === 0) return;

    const out = trySubmitWord(r, p);
    setPath([]);

    if (!out.ok) {
      playSfx('wrong');
      if (r.mode !== 'tutorial' && !r.practice) trialLogRef.current?.trial({ ok: false, why: out.reason });
      if (out.reason === 'short') setMsg(t.tooShort(r.minLen));
      else if (out.reason === 'duplicate') setMsg(t.alreadyFound);
      else setMsg(t.notAWord);
      return;
    }

    playSfx('correct');
    setMsg(t.found(out.word, out.pts));
    setRound({ ...r });

    if (r.mode === 'tutorial') {
      juice.celebrate();
      coachRef.current?.notify('word');
      return;
    }
    // Word + timestamp offset (the log adds `t`) → enables fluency
    // clustering/switching analysis later. Practice words stay unlogged.
    if (!r.practice) trialLogRef.current?.trial({ ok: true, w: out.word, len: out.word.length, pts: out.pts });

    if (r.mode === 'free') {
      freeWordsRef.current += 1;
      freeStreakRef.current += 1;
      freeScoreRef.current += freeWordPoints(out.pts, freeStreakRef.current);
      setFreeScore(freeScoreRef.current);
    }

    if (r.complete) {
      finishRound(r);
    }
  }, [pauseOpen, finishRound, playSfx, t]);

  const startRoundTimer = useCallback(() => {
    stopRoundTimer();
    const rid = ++roundTimerIdRef.current;
    const tick = () => {
      const r = roundRef.current;
      if (!r || roundTimerIdRef.current !== rid || pauseRef.current) return;
      r.timeLeft -= 1;
      tlRef.current = r.timeLeft;
      setRound({ ...r });
      if (r.timeLeft <= 0) {
        finishRound(r, true);
        return;
      }
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }, [pauseOpen, finishRound, stopRoundTimer]);

  useEffect(() => {
    if (phase !== 'play' || !round) return undefined;
    if (coachActiveRef.current) return undefined; // tutorial: no timer
    startRoundTimer();
    return () => stopRoundTimer();
  }, [phase, round?.seed, round?.mode, startRoundTimer, stopRoundTimer]);

  const beginRound = useCallback(
    (r) => {
      roundRef.current = r;
      setRound(r);
      setPath([]);
      setMsg('');
      setLastGrade(null);
      setLastResult(null);
      setPhase('play');
      tlRef.current = r.timeLeft;
      tlimRef.current = r.timeSec ?? r.timeLeft;
    },
    [],
  );

  /* --- Coached interactive tutorial --- */
  const beginTutorial = useCallback(() => {
    const seed = 0x5eed >>> 0;
    const r = { ...prepareLevelRound('easy', 1, seed, lang), mode: 'tutorial' };
    juice.reset();
    beginRound(r);
  }, [beginRound, lang, juice]);

  const finishCoach = useCallback(() => {
    try {
      localStorage.setItem('mm_wordle_coach_seen', '1');
    } catch {
      /* ignore */
    }
    setCoachActive(false);
    coachActiveRef.current = false;
    clearPlay();
    const fn = pendingAfterCoachRef.current;
    pendingAfterCoachRef.current = null;
    if (fn) fn();
    else setPhase('hub');
  }, [clearPlay]);

  useEffect(() => () => trialLogRef.current?.discard(), []);

  const coachSteps = useMemo(() => buildWordleCoachSteps(isAr, { boardRef }), [isAr]);
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
        seen = !!localStorage.getItem('mm_wordle_coach_seen');
      } catch {
        /* ignore */
      }
      if (seen) fn();
      else startCoach(fn);
    },
    [startCoach],
  );
  const replayTutorial = useCallback(() => startCoach(null), [startCoach]);

  const confirmQuit = useCallback(() => {
    const mode = roundRef.current?.mode;
    setQuitOpen(false);
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlay();
    if (mode === 'assess') { (onAssessmentExit || onBack)?.(); return; }
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else setPhase('hub');
  }, [clearPlay, onAssessmentExit, onBack]);

  const handlePauseOpen = useCallback(() => {
    stopRoundTimer();
    setPauseOpen(true);
  }, [stopRoundTimer]);

  const handlePauseResume = useCallback(() => {
    setPauseOpen(false);
    if (roundRef.current) startRoundTimer();
  }, [startRoundTimer]);

  const handlePauseRestart = useCallback(() => {
    setPauseOpen(false);
    const r = roundRef.current;
    if (!r) return;
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    if (r.mode === 'free') beginRound(prepareFreeRound(r.freeStage ?? freeStageRef.current, seed, lang));
    else if (r.mode === 'level') beginRound(prepareLevelRound(r.diff, r.lv, seed, lang));
    else if (chalSeed) beginRound(prepareChallengeRound(chalSeed));
  }, [beginRound, chalSeed, lang]);

  const startAssessment = useCallback(() => {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'wordle', mode: 'assess', meta: { lang } });
    // Short unscored practice grid first — absorbs first-exposure noise so the
    // measured 90s fluency block starts from a warmed-up state.
    const pr = prepareAssessRound(seed, lang);
    pr.practice = true;
    pr.timeSec = 25;
    pr.timeLeft = 25;
    beginRound(pr);
  }, [beginRound, lang]);

  const startFree = useCallback(() => {
    freeStageRef.current = 0;
    freeWordsRef.current = 0;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    freeLivesRef.current = WORDLE_FREE_LIVES;
    setFreeScore(0);
    setFreeLives(WORDLE_FREE_LIVES);
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'wordle', mode: 'free', meta: { lang } });
    beginRound(prepareFreeRound(0, seed, lang));
  }, [beginRound, lang]);

  const startLevelGame = useCallback(
    (diff, lv) => {
      const seed = ((diff.charCodeAt(0) * 997 + lv * 7919) ^ 0x5eed) >>> 0;
      trialLogRef.current?.discard();
      trialLogRef.current = createTrialLog({ game: 'wordle', mode: 'level', meta: { diff, lv, lang } });
      beginRound(prepareLevelRound(diff, lv, seed, lang));
    },
    [beginRound, lang],
  );

  const openChallenge = useCallback(() => {
    if (chalNames.length < 2) return;
    chalDiffRef.current = chalDiff;
    const seed = prepareChallengeSeed(chalDiffRef.current, lang);
    setChalSeed(seed);
    chalScoresRef.current = chalNames.map((nm) => ({ nm, rounds: [] }));
    setChalScores(chalScoresRef.current);
    chalIdxRef.current = 0;
    chalCycleRef.current = 0;
    setChalIdx(0);
    setChalRoundIdx(0);
    setChalTurnOpen(true);
    setPhase('play');
  }, [chalNames, chalDiff, lang]);

  const startChallengeBlock = useCallback(() => {
    setChalTurnOpen(false);
    if (!chalSeed) return;
    beginRound(prepareChallengeRound(chalSeed));
  }, [beginRound, chalSeed]);

  const currentWord =
    round && path.length > 0 ? wordFromPath(path, round.grid) : '';

  const playHeaderForRound = (r) => {
    if (!r) return { title: '', subtitle: '' };
    if (r.mode === 'assess') {
      return {
        title: r.practice
          ? (isAr ? 'تجربة — غير محتسبة' : 'Practice — not scored')
          : (assessmentLabel || t.title),
        subtitle: `${Number(r.timeLeft).toFixed(0)}s · ${r.found.length} ${t.foundList}`,
      };
    }
    if (r.mode === 'free') {
      return {
        title: t.freeHeader,
        subtitle: t.freeLvl(r.diff, r.lv),
      };
    }
    if (r.mode === 'challenge') {
      return {
        title: t.challengeHeader,
        subtitle: `${WORDLE_DM[r.diff]?.grid ?? 5}×${WORDLE_DM[r.diff]?.grid ?? 5} · ${Number(r.timeLeft).toFixed(0)}s`,
      };
    }
    return {
      title: `${WORDLE_DM[r.diff]?.label ?? r.diff} · L${r.lv}`,
      subtitle: `${WORDLE_DM[r.diff]?.grid ?? 4}×${WORDLE_DM[r.diff]?.grid ?? 4} · ${r.targetWords} words · ${Number(r.timeSec || r.timeLeft).toFixed(0)}s`,
    };
  };

  return (
    <div className="cancellation-task-game ct-fq-root ct-wordle-root" dir={isAr ? 'rtl' : 'ltr'}>
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

      {phase === 'assessStart' && (
        <AssessmentReady
          isAr={isAr}
          label={assessmentLabel}
          step={assessmentStep}
          onStart={startAssessment}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
      )}

      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              variant="paper"
              hubSpaced
              onReplayTutorial={replayTutorial}
              replayHint={t.replayTutorial}
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big">{t.hubAttentionWord}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTrainingTag}</div>
                </div>
              }
            />
            <WordleModes
              t={t}
              isAr={isAr}
              playSfx={playSfx}
              onFree={() => maybeCoach(() => setPhase('freeIntro'))}
              onLevels={() => maybeCoach(() => setPhase('diff'))}
              onChallenge={() => maybeCoach(() => setPhase('chal'))}
            />
          </div>
        </div>
      )}

      {phase === 'freeIntro' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => setPhase('hub')}
              playSfx={playSfx}
              variant="paper"
            />
            <h2 className="ct-fq-training-title">{t.freeIntroTitle}</h2>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.freeIntroBody}</p>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                clearPlay();
                startFree();
              }}
            >
              {t.freeIntroReady}
            </button>
          </div>
        </div>
      )}

      {phase === 'diff' && (
        <TrainingDifficultySelect
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => {
            clearPlay();
            setPhase('hub');
          }}
          title={t.pickDiff}
          blurb={t.pickDiffSub}
          diffKeys={WORDLE_DIFF_KEYS}
          dm={WORDLE_DM}
          descs={t.diffDesc}
          onPick={(k) => {
            setDiffKey(k);
            setPhase('levels');
          }}
        />
      )}

      {phase === 'levels' && (
        <TrainingLevelGrid
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => setPhase('diff')}
          title={WORDLE_DM[diffKey].label}
          blurb={t.levelsSub(WORDLE_DM[diffKey].pop, WORDLE_DM[diffKey].grid)}
          count={WORDLE_LEVELS_PER_TIER}
          lvc={WORDLE_DM[diffKey].lvc}
          isUnlocked={(lv) => isWordleLevelUnlocked(diffKey, lv, doneMap)}
          isDone={(lv) => !!doneMap[`${diffKey}-${lv}`]}
          sublabel={(lv) => {
            const spec = specificationForLevel(diffKey, lv);
            return `${spec.targetWords}w·${spec.timeSec}s`;
          }}
          onPick={(lv) => startLevelGame(diffKey, lv)}
        />
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                clearPlay();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {t.challengeTitle}
                  </div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.chalPickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.chalPickDiff}>
                {WORDLE_DIFF_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => {
                      playSfx('click');
                      setChalDiff(k);
                    }}
                  >
                    {WORDLE_DM[k].label}
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
                      onClick={() =>
                        setChalNames(chalNames.filter((_, j) => j !== i))
                      }
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
              <p
                className="ct-fq-sub"
                style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}
              >
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
                      chalRoundsTotalRef.current = n;
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                if (chalNames.length < 2) return;
                openChallenge();
              }}
            >
              {t.startCh}
            </button>
            {chalNames.length < 2 && (
              <p className="ct-fq-sub" style={{ marginTop: 8 }}>
                {t.needTwo}
              </p>
            )}
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !round && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={
            chalRoundsTotal > 1
              ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)
              : null
          }
          metaLine={t.chalMeta(WORDLE_DM[chalDiff]?.label ?? '')}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeBlock}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && round && round.mode === 'level' && (
        <>
          <TrainingPlayHeader
            isAr={isAr}
            title={playHeaderForRound(round).title}
            subtitle={playHeaderForRound(round).subtitle}
            playSfx={playSfx}
            menuAriaLabel={t.menu}
            pauseAriaLabel={t.paused}
            onMenu={() => {
              if (pauseOpen) setPauseOpen(false);
              setQuitOpen(true);
            }}
            onPause={handlePauseOpen}
          />
          <div className="ct-fq-g-wrap">
            <WordleLiveHud
              t={t}
              pauseOpen={pauseOpen}
              tlRef={tlRef}
              tlimRef={tlimRef}
              roundTlim={round.timeSec ?? round.timeLeft}
              found={round.found.length}
              target={round.targetWords}
              lvlLabel={`L${round.lv}`}
              score={round.score}
            />
            <div className="ct-fq-tb" data-fq-chrome>
              <div className="ct-fq-tb-row">
                <span className="ct-fq-tb-cue">{t.connectHint}</span>
              </div>
              <div className="ct-fq-tb-row">
                <span className="ct-fq-tb-cue" style={{ fontSize: '0.72rem', opacity: 0.85 }}>
                  {t.minLetters(round.minLen)}
                </span>
              </div>
            </div>
            {msg && (
              <p className="ct-wordle-msg ct-wordle-msg--ok" style={{ margin: '4px 0' }}>
                {msg}
              </p>
            )}
            <div className="ct-wordle-in-fq">
              <LetterLinkBoard
                grid={round.grid}
                size={round.size}
                path={path}
                setPath={setPath}
                disabled={pauseOpen || round.complete}
                currentWord={currentWord}
                onCommit={commitPath}
              />
              <div className="ct-wordle-link-actions">
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost ct-wordle-clear-btn"
                  disabled={path.length === 0}
                  onClick={() => {
                    playSfx('click');
                    setPath([]);
                    setMsg('');
                  }}
                >
                  {t.clearPath}
                </button>
              </div>
              {round.found.length > 0 && (
                <div className="ct-wordle-found-panel">
                  <span className="ct-wordle-found-label">{t.foundList}</span>
                  <div className="ct-wordle-found-chips">
                    {round.found.map((w) => (
                      <span key={w} className="ct-wordle-found-chip">
                        {w.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {phase === 'play' && round && round.mode !== 'level' && (
        <div className="ct-wordle-play-wrap">
          <TrainingPlayHeader
            isAr={isAr}
            title={round.mode === 'tutorial' ? (isAr ? 'كيفية اللعب' : 'How to play') : playHeaderForRound(round).title}
            subtitle={
              round.mode === 'tutorial'
                ? ''
                : round.mode === 'free'
                  ? `${Math.ceil(round.timeLeft)}s · ${'♥'.repeat(freeLives)}${'♡'.repeat(Math.max(0, WORDLE_FREE_LIVES - freeLives))} · ${round.found.length}/${round.targetWords} · ${freeScore}`
                  : playHeaderForRound(round).subtitle
            }
            playSfx={playSfx}
            onMenu={round.mode === 'tutorial' ? () => coach.skip() : () => {
              if (pauseOpen) setPauseOpen(false);
              setQuitOpen(true);
            }}
            onPause={round.mode === 'tutorial' ? undefined : handlePauseOpen}
            pauseAriaLabel={t.paused}
          />
          <p className="ct-wordle-connect-hint">{t.connectHint}</p>
          <p className="ct-wordle-min-len">{t.minLetters(round.minLen)}</p>
          {msg && <p className="ct-wordle-msg ct-wordle-msg--ok">{msg}</p>}
          <div className="ct-juice-host" ref={boardRef} style={{ position: 'relative' }}>
            <JuiceLayer
              combo={juice.combo}
              particle={juice.particle}
              rtFx={juice.rtFx}
              toast={juice.toast}
              burst={juice.burst}
              showCombo={false}
            />
            <LetterLinkBoard
              grid={round.grid}
              size={round.size}
              path={path}
              setPath={setPath}
              disabled={pauseOpen || round.complete}
              currentWord={currentWord}
              onCommit={commitPath}
            />
          </div>
          <div className="ct-wordle-link-actions">
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-sec ct-wordle-clear-btn"
              disabled={path.length === 0}
              onClick={() => {
                playSfx('click');
                setPath([]);
                setMsg('');
              }}
            >
              {t.clearPath}
            </button>
          </div>
          {round.found.length > 0 && (
            <div className="ct-wordle-found-panel">
              <span className="ct-wordle-found-label">{t.foundList}</span>
              <div className="ct-wordle-found-chips">
                {round.found.map((w) => (
                  <span key={w} className="ct-wordle-found-chip">
                    {w.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="ct-wordle-formula-hint">{t.formulaHint}</p>
        </div>
      )}

      <TrainingPauseModal
        open={pauseOpen && phase === 'play' && !!round}
        labels={{
          paused: t.paused,
          resume: t.resume,
          restart: t.restart,
          quitMenu: t.quitMenu,
        }}
        showRestart
        onResume={handlePauseResume}
        onRestart={handlePauseRestart}
        onQuitMenu={() => {
          setPauseOpen(false);
          setQuitOpen(true);
        }}
      />

      <TrainingQuitModal
        open={quitOpen}
        labels={{
          quitQ: t.quitQ,
          quitLose: t.quitLose,
          yesQuit: t.yesQuit,
          keep: t.keep,
        }}
        onConfirmQuit={confirmQuit}
        onKeepPlaying={() => {
          setQuitOpen(false);
          if (roundRef.current) startRoundTimer();
        }}
      />

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlay();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {lastResult.stats.won ? t.resultsPass : t.resultsLevelRetryTitle}
                  </div>
                </div>
              }
            />
            <div className="ct-fq-sbig">{lastResult.stats.vfs}</div>
            <div className="ct-fq-ies-lbl">{t.vfs}</div>
            <div className="ct-fq-rm ct-fq-rm-training">
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.timeUsed}s</div>
                <div className="ct-fq-rl">{t.time}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.words}</div>
                <div className="ct-fq-rl">{t.wordsFound}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.score}</div>
                <div className="ct-fq-rl">{t.totalScore}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">
                  {'★'.repeat(lastResult.stats.stars)}
                  {'☆'.repeat(3 - lastResult.stats.stars)}
                </div>
                <div className="ct-fq-rl">{t.stars}</div>
              </div>
            </div>
            <div className="ct-fq-row">
              {lastResult.stats.won && lastResult.r.lv < WORDLE_LEVELS_PER_TIER && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => {
                    playSfx('click');
                    setLastResult(null);
                    startLevelGame(lastResult.r.diff, lastResult.r.lv + 1);
                  }}
                >
                  {t.nextLv}
                </button>
              )}
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  playSfx('click');
                  setLastResult(null);
                  startLevelGame(lastResult.r.diff, lastResult.r.lv);
                }}
              >
                {t.retry}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  setLastResult(null);
                  clearPlay();
                  setPhase('levels');
                }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-res-screen">
            <h2>{t.freeGameOver}</h2>
            <p className="ct-fq-sub">{t.freeStages(freeWordsRef.current)}</p>
            <p className="ct-fq-sub">
              {t.score}: {freeScore}
            </p>
            <p className="ct-fq-sub">{t.freeBest(profile.bestStages ?? 0)}</p>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                clearPlay();
                setPhase('freeIntro');
              }}
            >
              {t.freePlayAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-sec"
              onClick={() => {
                clearPlay();
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-res-screen">
            <h2>{t.resultsChalTitle}</h2>
            <ul className="ct-fq-chal-list">
              {[...chalScores]
                .sort(compareWordleChallengeRows)
                .map((row, i) => (
                  <li key={row.nm + i} className="ct-fq-chal-row">
                    <span className="ct-fq-chal-rank">{i + 1}</span>
                    <span className="ct-fq-chal-nm">{row.nm}</span>
                    <span className="ct-fq-chal-det">
                      {t.chalRes(row.vfs ?? 0, row.totalScore ?? 0)}
                    </span>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                clearPlay();
                setPhase('chal');
              }}
            >
              {t.newCh}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-sec"
              onClick={() => {
                clearPlay();
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
