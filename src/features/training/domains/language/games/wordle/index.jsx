import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import WordleModes from './WordleModes';
import WordleTutorial, { buildTutorialQueueFor, markTutorialSeen } from './tutorial';
import LetterLinkBoard from './LetterLinkBoard';
import WordleLiveHud from './WordleLiveHud';
import {
  WORDLE_LEVELS_PER_TIER,
  WORDLE_DIFF_KEYS,
  WORDLE_DM,
  WORDLE_FREE_SESSION_START_SEC,
  WORDLE_FREE_SESSION_CAP_SEC,
  specificationForLevel,
  prepareFreeRound,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengeRound,
  trySubmitWord,
  wordFromPath,
  gradeRound,
  isWordleLevelUnlocked,
  freeClearBonusSec,
  freeWordPoints,
  mergeWordleChallengeRow,
  compareWordleChallengeRows,
} from './wordleData';
import { loadWordleProfile, saveWordleProfile } from './wordleProgress';
import { prewarmLinkTrie } from './linkDictionary';

const UI = {
  en: {
    hubLang: 'Language',
    hubTag: 'training',
    hubAttentionWord: 'Language',
    hubTrainingTag: 'training',
    title: 'Word Maze',
    subtitle: 'Connect letters to spell words',
    replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Free mode',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Session timer · find as many words as you can',
    hubNodeLevelsHint: '20 levels · connect letters on the grid',
    hubNodeChallengeHint: 'Same grid · highest score wins',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Drag across touching letters (including diagonals) to spell words',
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–20`,
    time: 'Time',
    found: 'Words',
    lvl: 'Level',
    resultsLevelRetryTitle: 'Try again',
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'Connect adjacent letters to form words (minimum length shown in the header). Find as many valid words as you can before time runs out.',
    freeIntroReady: 'Ready',
    challengeTitle: '⚔️ Challenge',
    challengeSub: 'Medium L10 · identical letter grid · highest score wins',
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
    chalMeta: 'Medium · L10 · 90s',
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
    freeLvl: (d, lv) => `Free · ${d} L${lv}`,
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
    resultsChalTitle: 'Challenge results',
    chalRes: (vfs, sc) => `VFS ${vfs} · ${sc} pts`,
    newCh: 'New challenge',
    levelHeader: (d, lv) => `${WORDLE_DM[d]?.label ?? d} · L${lv}`,
    levelMeta: (n, min) => `Find ${n} words · ${min}+ letters`,
    challengeHeader: 'Challenge',
    freeHeader: 'Free mode',
    minLetters: (n) => `Min ${n} letters`,
    formulaHint: 'Any real word you can connect on the grid counts. Longer words score more.',
  },
  ar: {
    hubLang: 'لغة',
    hubTag: 'تدريب',
    hubAttentionWord: 'لغة',
    hubTrainingTag: 'تدريب',
    title: 'متاهة الكلمات',
    subtitle: 'وصّل الحروف لتكوين كلمات',
    replayTutorial: 'إعادة الشرح',
    freeMode: '♾️ وضع حر',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'مؤقت جلسة · أكبر عدد من الكلمات',
    hubNodeLevelsHint: '٢٠ مستوى · وصّل الحروف',
    hubNodeChallengeHint: 'نفس الشبكة · أعلى نقاط',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'اسحب على حروف متجاورة (بما فيها القطر) لتكوين كلمات',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–20`,
    time: 'الوقت',
    found: 'كلمات',
    lvl: 'مستوى',
    resultsLevelRetryTitle: 'حاول مجددًا',
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'وصّل الحروف المتجاورة لتكوين كلمات. ابحث عن أكبر عدد قبل انتهاء الوقت.',
    freeIntroReady: 'جاهز',
    challengeTitle: '⚔️ تحدي',
    challengeSub: 'متوسط L10 · نفس الشبكة · أعلى نقاط',
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
    chalMeta: 'متوسط · L10 · ٩٠ث',
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
    resultsChalTitle: 'نتائج التحدي',
    chalRes: (vfs, sc) => `VFS ${vfs} · ${sc}`,
    newCh: 'تحدي جديد',
    levelHeader: (d, lv) => `${WORDLE_DM[d]?.label ?? d} · ${lv}`,
    levelMeta: (n, min) => `${n} كلمات · ${min}+ أحرف`,
    challengeHeader: 'تحدي',
    freeHeader: 'وضع حر',
    minLetters: (n) => `الحد ${n} أحرف`,
    formulaHint: 'الكلمات الأطول = نقاط أكثر. الحروف متجاورة دون تكرار.',
  },
};

export default function WordleGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  const [profile, setProfile] = useState(() => loadWordleProfile());
  const [phase, setPhase] = useState('hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [round, setRound] = useState(null);
  const [path, setPath] = useState([]);
  const [msg, setMsg] = useState('');
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastGrade, setLastGrade] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const [sessionSec, setSessionSec] = useState(WORDLE_FREE_SESSION_START_SEC);
  const [freeScore, setFreeScore] = useState(0);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);

  const roundRef = useRef(null);
  const pathRef = useRef([]);
  const tlRef = useRef(WORDLE_FREE_SESSION_START_SEC);
  const tlimRef = useRef(WORDLE_FREE_SESSION_START_SEC);
  const timerRunIdRef = useRef(0);
  const runRef = useRef(false);
  const roundTimerIdRef = useRef(0);
  const freeStageRef = useRef(0);
  const freeWordsRef = useRef(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const sessionTimedOutRef = useRef(false);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);

  const [tutorialQueue, setTutorialQueue] = useState([]);
  const pendingTutorialActionRef = useRef(null);
  const pauseRef = useRef(false);

  const doneMap = profile.done || {};

  useEffect(() => {
    pauseRef.current = pauseOpen;
  }, [pauseOpen]);

  useEffect(() => {
    prewarmLinkTrie();
  }, []);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  const stopSessionTimer = useCallback(() => {
    runRef.current = false;
    timerRunIdRef.current += 1;
  }, []);

  const stopRoundTimer = useCallback(() => {
    roundTimerIdRef.current += 1;
  }, []);

  const startSessionTimer = useCallback(() => {
    runRef.current = true;
    const rid = ++timerRunIdRef.current;
    const tick = () => {
      if (!runRef.current || timerRunIdRef.current !== rid) return;
      tlRef.current -= 1;
      setSessionSec(Math.max(0, Math.ceil(tlRef.current)));
      if (tlRef.current <= 0) {
        sessionTimedOutRef.current = true;
        runRef.current = false;
        return;
      }
      setTimeout(tick, 1000);
    };
    setTimeout(tick, 1000);
  }, []);

  const clearPlay = useCallback(() => {
    stopSessionTimer();
    stopRoundTimer();
    roundRef.current = null;
    setRound(null);
    setPath([]);
    setMsg('');
    setPauseOpen(false);
    setQuitOpen(false);
    setChalTurnOpen(false);
  }, [stopSessionTimer, stopRoundTimer]);

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

      if (r.mode === 'level') {
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
        stopSessionTimer();
        const p = {
          ...profile,
          bestStages: Math.max(profile.bestStages ?? 0, freeWordsRef.current),
          bestFreeScore: Math.max(profile.bestFreeScore ?? 0, freeScoreRef.current),
          bestFree: Math.max(profile.bestFree ?? 0, freeWordsRef.current),
        };
        saveWordleProfile(p);
        setProfile(p);
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
          const seed = prepareChallengeSeed();
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
    [profile, persistLevel, stopSessionTimer, stopRoundTimer],
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
      if (out.reason === 'short') setMsg(t.tooShort(r.minLen));
      else if (out.reason === 'duplicate') setMsg(t.alreadyFound);
      else setMsg(t.notAWord);
      return;
    }

    playSfx('correct');
    setMsg(t.found(out.word, out.pts));
    setRound({ ...r });

    if (r.mode === 'free') {
      freeWordsRef.current += 1;
      freeStreakRef.current += 1;
      const pts = freeWordPoints(out.pts, freeStreakRef.current);
      freeScoreRef.current += pts;
      setFreeScore(freeScoreRef.current);
      tlRef.current = Math.min(
        WORDLE_FREE_SESSION_CAP_SEC,
        tlRef.current + freeClearBonusSec(freeStageRef.current),
      );
      setSessionSec(Math.ceil(tlRef.current));
      freeStageRef.current += 1;
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
      if (r.mode === 'free') return;
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
    if (round.mode === 'free') return undefined;
    startRoundTimer();
    return () => stopRoundTimer();
  }, [phase, round?.seed, round?.mode, startRoundTimer, stopRoundTimer]);

  useEffect(() => {
    if (phase !== 'play' || round?.mode !== 'free') return undefined;
    const id = setInterval(() => {
      if (sessionTimedOutRef.current) finishRound(roundRef.current);
    }, 400);
    return () => clearInterval(id);
  }, [phase, round, finishRound]);

  const beginRound = useCallback(
    (r) => {
      roundRef.current = r;
      setRound(r);
      setPath([]);
      setMsg('');
      setLastGrade(null);
      setLastResult(null);
      setPhase('play');
      if (r.mode === 'free') {
        tlRef.current = WORDLE_FREE_SESSION_START_SEC;
        tlimRef.current = WORDLE_FREE_SESSION_START_SEC;
        startSessionTimer();
      } else if (r.mode === 'level' || r.mode === 'challenge') {
        tlRef.current = r.timeLeft;
        tlimRef.current = r.timeSec ?? r.timeLeft;
      }
    },
    [startSessionTimer],
  );

  const gateWithTutorial = useCallback((action, modeKind) => {
    const q = buildTutorialQueueFor(modeKind);
    if (q.length === 0) {
      action();
      return;
    }
    pendingTutorialActionRef.current = action;
    setTutorialQueue(q);
  }, []);

  const advanceTutorial = useCallback(() => {
    setTutorialQueue((prev) => {
      const finished = prev[0];
      if (finished) {
        const sk =
          finished.kind === 'main'
            ? 'main'
            : finished.kind === 'free-tip'
              ? 'free'
              : 'challenge';
        markTutorialSeen(sk);
      }
      const remaining = prev.slice(1);
      if (remaining.length === 0 && pendingTutorialActionRef.current) {
        const action = pendingTutorialActionRef.current;
        pendingTutorialActionRef.current = null;
        queueMicrotask(action);
      }
      return remaining;
    });
  }, []);

  const replayTutorial = useCallback(() => {
    pendingTutorialActionRef.current = null;
    setTutorialQueue([{ kind: 'main' }]);
  }, []);

  const confirmQuit = useCallback(() => {
    const mode = roundRef.current?.mode;
    setQuitOpen(false);
    clearPlay();
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else setPhase('hub');
  }, [clearPlay]);

  const handlePauseOpen = useCallback(() => {
    const mode = roundRef.current?.mode;
    if (mode === 'free') stopSessionTimer();
    else if (mode === 'level' || mode === 'challenge') stopRoundTimer();
    setPauseOpen(true);
  }, [stopSessionTimer, stopRoundTimer]);

  const handlePauseResume = useCallback(() => {
    setPauseOpen(false);
    const r = roundRef.current;
    if (!r) return;
    if (r.mode === 'free' && !sessionTimedOutRef.current) {
      startSessionTimer();
    } else if (r.mode === 'level' || r.mode === 'challenge') {
      startRoundTimer();
    }
  }, [startSessionTimer, startRoundTimer]);

  const handlePauseRestart = useCallback(() => {
    setPauseOpen(false);
    const r = roundRef.current;
    if (!r) return;
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    if (r.mode === 'free') {
      const nr = prepareFreeRound(r.freeStage ?? freeStageRef.current, seed);
      roundRef.current = nr;
      setRound(nr);
      setPath([]);
      setMsg('');
      if (!sessionTimedOutRef.current) startSessionTimer();
      return;
    }
    if (r.mode === 'level') beginRound(prepareLevelRound(r.diff, r.lv, seed));
    else if (chalSeed) beginRound(prepareChallengeRound(chalSeed));
  }, [beginRound, chalSeed, startSessionTimer]);

  const startFree = useCallback(() => {
    sessionTimedOutRef.current = false;
    freeStageRef.current = 0;
    freeWordsRef.current = 0;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    setFreeScore(0);
    tlRef.current = WORDLE_FREE_SESSION_START_SEC;
    setSessionSec(WORDLE_FREE_SESSION_START_SEC);
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginRound(prepareFreeRound(0, seed));
  }, [beginRound]);

  const startLevelGame = useCallback(
    (diff, lv) => {
      const seed = ((diff.charCodeAt(0) * 997 + lv * 7919) ^ 0x5eed) >>> 0;
      beginRound(prepareLevelRound(diff, lv, seed));
    },
    [beginRound],
  );

  const openChallenge = useCallback(() => {
    if (chalNames.length < 2) return;
    const seed = prepareChallengeSeed();
    setChalSeed(seed);
    chalScoresRef.current = chalNames.map((nm) => ({ nm, rounds: [] }));
    setChalScores(chalScoresRef.current);
    chalIdxRef.current = 0;
    chalCycleRef.current = 0;
    setChalIdx(0);
    setChalRoundIdx(0);
    setChalTurnOpen(true);
    setPhase('play');
  }, [chalNames]);

  const startChallengeBlock = useCallback(() => {
    setChalTurnOpen(false);
    if (!chalSeed) return;
    beginRound(prepareChallengeRound(chalSeed));
  }, [beginRound, chalSeed]);

  const currentWord =
    round && path.length > 0 ? wordFromPath(path, round.grid) : '';

  const playHeaderForRound = (r) => {
    if (!r) return { title: '', subtitle: '' };
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
      {tutorialQueue[0] && (
        <WordleTutorial
          kind={tutorialQueue[0].kind}
          isAr={isAr}
          playSfx={playSfx}
          onClose={advanceTutorial}
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
              onFree={() =>
                gateWithTutorial(() => setPhase('freeIntro'), 'free')
              }
              onLevels={() => gateWithTutorial(() => setPhase('diff'), 'levels')}
              onChallenge={() =>
                gateWithTutorial(() => setPhase('chal'), 'challenge')
              }
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
                    {t.pickDiff}
                  </div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
            {WORDLE_DIFF_KEYS.map((k) => {
              const m = WORDLE_DM[k];
              return (
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
                  <span>{m.label}</span>
                  <span className="ct-fq-dbg">
                    {m.pop} · {m.grid}×{m.grid}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'levels' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => setPhase('diff')}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {WORDLE_DM[diffKey].label}
                  </div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">
              {t.levelsSub(WORDLE_DM[diffKey].pop, WORDLE_DM[diffKey].grid)}
            </p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: WORDLE_LEVELS_PER_TIER }, (_, i) => i + 1).map(
                (lv) => {
                  const un = isWordleLevelUnlocked(diffKey, lv, doneMap);
                  const dn = !!doneMap[`${diffKey}-${lv}`];
                  const spec = specificationForLevel(diffKey, lv);
                  const cls = `ct-fq-lb ${un ? `ct-${WORDLE_DM[diffKey].lvc}` : 'ct-lvk'}`;
                  return (
                    <button
                      key={lv}
                      type="button"
                      className={cls}
                      disabled={!un}
                      onClick={() => {
                        if (!un) return;
                        playSfx('click');
                        startLevelGame(diffKey, lv);
                      }}
                    >
                      <span className="ct-ln">{dn ? '✓' : lv}</span>
                      <span className="ct-ls">
                        {un ? `${spec.targetWords}w·${spec.timeSec}s` : '🔒'}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
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
          metaLine={t.chalMeta}
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
            title={playHeaderForRound(round).title}
            subtitle={
              round.mode === 'free'
                ? `${t.sessionTime(sessionSec)} · ${t.score} ${freeScore}`
                : playHeaderForRound(round).subtitle
            }
            playSfx={playSfx}
            onMenu={() => {
              if (pauseOpen) setPauseOpen(false);
              setQuitOpen(true);
            }}
            onPause={handlePauseOpen}
            pauseAriaLabel={t.paused}
          />
          <p className="ct-wordle-connect-hint">{t.connectHint}</p>
          <p className="ct-wordle-min-len">{t.minLetters(round.minLen)}</p>
          {msg && <p className="ct-wordle-msg ct-wordle-msg--ok">{msg}</p>}
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
          if (
            roundRef.current?.mode === 'free' &&
            !sessionTimedOutRef.current &&
            !runRef.current
          ) {
            startSessionTimer();
          }
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
