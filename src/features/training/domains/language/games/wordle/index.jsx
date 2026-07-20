import React, { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import HubScienceLink from '../../../../shared/HubScienceLink';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { createTrialLog } from '../../../../shared/trialLog';
import { seedWithDay } from '../../../../shared/dailySeed';
import { useTrainingTutorialHost } from '../../../../shared/tutorials/useTrainingTutorialHost';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import WordleModes from './WordleModes';

const Wordle3DProto = lazyWithRetry(() => import('./Wordle3DProto'), 'wordle-3d');
import LetterLinkBoard from './LetterLinkBoard';
import WordleLiveHud from './WordleLiveHud';
import {
  WORDLE_LEVELS_PER_TIER,
  WORDLE_DIFF_KEYS,
  WORDLE_DM,
  wordleDiffMeta,
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
import { STR_COMMON } from '../../../../shared/trainingStrings';

const UI = {
  en: {
    ...STR_COMMON.en,
    hubLang: 'Language',
    hubAttentionWord: 'Word Maze',
    hubTrainingTag: 'training',
    title: 'Word Maze',
    subtitle: 'Connect letters to spell words',
    hubNodeFreeHint: 'Endless · 3 lives · grids ramp up',
    hubNodeLevelsHint: '100 levels · connect letters on the grid',
    hubNodeChallengeHint: 'Same grid for all · pick a difficulty',
    pickDiffSub: 'Drag across touching letters (including diagonals) to spell words',
    diffDesc: {
      easy: 'Common words · 3+ letters · 4×4 grid.',
      medium: 'Mixed vocabulary · 3+ letters · 5×5 grid.',
      hard: 'Tougher words · 4+ letters · 5×5 grid.',
    },
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–100`,
    lvl: 'Level',
    resultsLevelRetryTitle: 'Try again',
    freeIntroBody:
      'Endless grids that get harder. Each grid asks for a few words before its timer runs out. You have 3 lives — miss the target in time and you lose one. The run ends only when your lives reach zero.',
    challengeSub: 'Same letter grid for everyone · pick a difficulty · pass the device',
    chalRoundsHint: 'Same grid each round · pass device between players',
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
    foundList: 'Found',
    clearPath: 'Clear',
    restart: 'Restart grid',
    freeLvl: (d, lv) => `Survival · ${d} L${lv}`,
    resultsPass: 'Level complete',
    resultsFail: 'Time up — try again',
    vfs: 'VFS (verbal fluency)',
    wordsFound: 'Words found',
    totalScore: 'Score',
    freeStages: (n) => `Words found: ${n}`,
    freeBest: (n) => `Best words: ${n}`,
    chalRes: (vfs, sc) => `VFS ${vfs} · ${sc} pts`,
    levelHeader: (d, lv) => `${WORDLE_DM[d]?.label ?? d} · L${lv}`,
    levelMeta: (n, min) => `Find ${n} words · ${min}+ letters`,
    minLetters: (n) => `Min ${n} letters`,
    formulaHint: 'Any real word you can connect on the grid counts. Longer words score more.',
  },
  ar: {
    ...STR_COMMON.ar,
    hubLang: 'لغة',
    hubAttentionWord: 'متاهة الكلمات',
    hubTrainingTag: 'تدريب',
    title: 'متاهة الكلمات',
    subtitle: 'وصّل الحروف لتكوين كلمات',
    hubNodeFreeHint: 'لا ينتهي · ٣ أرواح · شبكات تزداد صعوبة',
    hubNodeLevelsHint: '١٠٠ مستوى · وصّل الحروف',
    hubNodeChallengeHint: 'نفس الشبكة للجميع · اختر الصعوبة',
    pickDiffSub: 'اسحب على حروف متجاورة (بما فيها القطر) لتكوين كلمات',
    diffDesc: {
      easy: 'كلمات شائعة · ٣+ أحرف · شبكة ٤×٤.',
      medium: 'مفردات متنوعة · ٣+ أحرف · شبكة ٥×٥.',
      hard: 'كلمات أصعب · ٤+ أحرف · شبكة ٥×٥.',
    },
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–100`,
    lvl: 'مستوى',
    resultsLevelRetryTitle: 'حاول مجددًا',
    freeIntroBody:
      'شبكات لا تنتهي وتزداد صعوبة. كل شبكة تطلب بضع كلمات قبل نفاد مؤقتها. لديك ٣ أرواح — إن لم تبلغ الهدف في الوقت تخسر روحاً. تنتهي المحاولة فقط عند نفاد الأرواح.',
    challengeSub: 'نفس الشبكة للجميع · اختر الصعوبة · مرّر الجهاز',
    chalRoundsHint: 'نفس الشبكة · مرّر الجهاز',
    chalBulletSame: 'نفس شبكة الحروف للجميع',
    chalBulletPass: 'ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
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
    foundList: 'وُجدت',
    clearPath: 'مسح',
    restart: 'إعادة الشبكة',
    freeLvl: (d, lv) => `حر · ${d} ${lv}`,
    resultsPass: 'اكتمل المستوى',
    resultsFail: 'انتهى الوقت — حاول مجددًا',
    vfs: 'VFS',
    wordsFound: 'كلمات',
    totalScore: 'نقاط',
    freeStages: (n) => `كلمات: ${n}`,
    freeBest: (n) => `أفضل: ${n}`,
    chalRes: (vfs, sc) => `VFS ${vfs} · ${sc}`,
    levelHeader: (d, lv) => `${WORDLE_DM[d]?.label ?? d} · ${lv}`,
    levelMeta: (n, min) => `${n} كلمات · ${min}+ أحرف`,
    minLetters: (n) => `الحد ${n} أحرف`,
    formulaHint: 'الكلمات الأطول = نقاط أكثر. الحروف متجاورة دون تكرار.',
  },
};

export default function WordleGame({ onBack, workoutMode = false, cosmosAutoPlay = false, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep, assessmentDomainId = 'language' }) {
  const { playSfx, currentLang, awardTrainingWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const [cosmosEmbed, setCosmosEmbed] = useState(false);
  const isCosmos = cosmosAutoPlay || cosmosEmbed;

  // WORKOUT / cosmos 3D: skip the hub and jump straight into Survival/free.
  const workoutLaunched = useRef(false);
  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) {
      workoutLaunched.current = true;
      startFree();
    }
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
  const { openTutorial, replayHint: tutReplayHint, layer: tutLayer } = useTrainingTutorialHost('wordle', isAr, playSfx);
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
    [profile, doneMap, awardTrainingWin],
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
    [profile, persistLevel, stopRoundTimer, lang, onAssessmentComplete, awardFreeRun],
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
      if (!r.practice) trialLogRef.current?.trial({ ok: false, why: out.reason });
      if (out.reason === 'short') setMsg(t.tooShort(r.minLen));
      else if (out.reason === 'duplicate') setMsg(t.alreadyFound);
      else setMsg(t.notAWord);
      return;
    }

    playSfx('correct');
    setMsg(t.found(out.word, out.pts));
    setRound({ ...r });

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
  }, [finishRound, stopRoundTimer]);

  useEffect(() => {
    if (phase !== 'play' || !round) return undefined;
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

  useEffect(() => () => trialLogRef.current?.discard(), []);

  const confirmQuit = useCallback(() => {
    const mode = roundRef.current?.mode;
    setQuitOpen(false);
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlay();
    if (mode === 'assess') { (onAssessmentExit || onBack)?.(); return; }
    if (cosmosEmbed) { setCosmosEmbed(false); setPhase('hub'); return; }
    if (cosmosAutoPlay) { onBack?.(); return; }
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else setPhase('hub');
  }, [clearPlay, onAssessmentExit, onBack, cosmosAutoPlay]);

  const exitToHub = useCallback(() => {
    clearPlay();
    if (cosmosEmbed) { setCosmosEmbed(false); setPhase('hub'); }
    else if (cosmosAutoPlay) onBack?.();
    else setPhase('hub');
  }, [clearPlay, cosmosAutoPlay, onBack]);

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
      const base = ((diff.charCodeAt(0) * 997 + lv * 7919) ^ 0x5eed) >>> 0;
      const seed = seedWithDay(base);
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

  const wrapCosmos = (content) => isCosmos ? (
    <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
      <Wordle3DProto isAr={isAr} playSfx={playSfx} onBack={() => { workoutLaunched.current = false; clearPlay(); if (cosmosAutoPlay) { onBack?.(); return; } setCosmosEmbed(false); setPhase('hub'); }} />
    </Suspense>
  ) : content;

  if (phase === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <Wordle3DProto isAr={isAr} playSfx={playSfx} onBack={() => setPhase('hub')} />
      </Suspense>
    );
  }

  return wrapCosmos(
    <div
      className={`cancellation-task-game ct-fq-root ct-wordle-root${isCosmos ? ' c3d-embed-root' : ''}`}
      data-c3d-embed={isCosmos || undefined}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'assessStart' && (
        <AssessmentReady
          isAr={isAr}
          label={assessmentLabel}
          step={assessmentStep}
          domainId={assessmentDomainId}
          onStart={startAssessment}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
      )}

      {phase === 'hub' && !isCosmos && (
        <div className="ct-fq-training-shell ct-fq-training-shell--mode-cosmos">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              variant="paper"
              hubSpaced
              onReplayTutorial={openTutorial}
              replayHint={tutReplayHint}
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big">{t.hubAttentionWord}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTrainingTag}</div>
                </div>
              }
            />
            {tutLayer}
            <WordleModes
              t={t}
              isAr={isAr}
              playSfx={playSfx}
              onFree={() => setPhase('freeIntro')}
              onLevels={() => setPhase('diff')}
              onChallenge={() => setPhase('chal')}
              onProto3d={() => setPhase('play3d')}
            />
            <HubScienceLink gameId="wordle" isAr={isAr} playSfx={playSfx} />
          </div>
        </div>
      )}

      {phase === 'freeIntro' && (
        <SurvivalIntro
          isAr={isAr}
          playSfx={playSfx}
          title={t.freeIntroTitle}
          body={t.freeIntroBody}
          onReady={() => { clearPlay(); startFree(); }}
          onBack={() => setPhase('hub')}
        />
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
          title={wordleDiffMeta(diffKey, isAr).label}
          blurb={t.levelsSub(wordleDiffMeta(diffKey, isAr).pop, wordleDiffMeta(diffKey, isAr).grid)}
          count={WORDLE_LEVELS_PER_TIER}
          lvc={wordleDiffMeta(diffKey, isAr).lvc}
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
            />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.challengeSub}
              diffKeys={WORDLE_DIFF_KEYS}
              diffLabels={WORDLE_DM}
              diff={chalDiff}
              onDiffChange={setChalDiff}
              players={chalNames}
              onPlayersChange={setChalNames}
              rounds={chalRoundsTotal}
              onRoundsChange={(n) => {
                setChalRoundsTotal(n);
                chalRoundsTotalRef.current = n;
              }}
              onStart={() => { playSfx('click'); openChallenge(); }}
              labels={{
                difficulty: t.chalPickDiff,
                players: t.players,
                addPlayer: t.addPl,
                rounds: t.chalRounds,
                roundsHint: t.chalRoundsHint,
                start: t.startCh,
              }}
            />
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
            onMenu={isCosmos ? undefined : () => {
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
                ? `${Math.ceil(round.timeLeft)}s · ${'♥'.repeat(freeLives)}${'♡'.repeat(Math.max(0, WORDLE_FREE_LIVES - freeLives))} · ${round.found.length}/${round.targetWords} · ${freeScore}`
                : playHeaderForRound(round).subtitle
            }
            playSfx={playSfx}
            onMenu={isCosmos ? undefined : () => {
              if (pauseOpen) setPauseOpen(false);
              setQuitOpen(true);
            }}
            onPause={handlePauseOpen}
            pauseAriaLabel={t.paused}
          />
          <p className="ct-wordle-connect-hint">{t.connectHint}</p>
          <p className="ct-wordle-min-len">{t.minLetters(round.minLen)}</p>
          {msg && <p className="ct-wordle-msg ct-wordle-msg--ok">{msg}</p>}
          <div className="ct-juice-host" style={{ position: 'relative' }}>
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
                if (isCosmos) startFree();
                else setPhase('freeIntro');
              }}
            >
              {t.freePlayAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-sec"
              onClick={exitToHub}
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
