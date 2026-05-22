import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import VigilShape from '../../../speed/games/vigil/VigilShape';
import CardSortModes from './CardSortModes';
import CardSortTutorial, { buildTutorialQueueFor, markTutorialSeen } from './tutorial';
import {
  WCST_REFERENCE_CARDS,
  WCST_LEVELS_PER_TIER,
  WCST_DIFF_KEYS,
  WCST_DM,
  WCST_FREE_SESSION_START_SEC,
  WCST_FREE_SESSION_CAP_SEC,
  WCST_FREE_MAX_ERRORS,
  specificationForLevel,
  prepareFreeBlock,
  prepareLevelBlock,
  prepareChallengeSeed,
  prepareChallengeBlock,
  startWcstProbe,
  applyWcstAnswer,
  applyWcstTimeout,
  correctPileIndex,
  activeRule,
  summarizeWcst,
  gradeBlock,
  isWcstLevelUnlocked,
  freeClearBonusSec,
  freeBlockPoints,
  mergeWcstChallengeRow,
  compareChallengeRows,
  feedbackLabel,
  playHint,
} from './ruleSwitchData';
import { loadWcstProfile, saveWcstProfile } from './ruleSwitchProgress';

const UI = {
  en: {
    hubFlex: 'Flexibility',
    hubTag: 'training',
    title: 'Card Sort',
    replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Free mode',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Session timer · adapt as rules shift',
    hubNodeLevelsHint: '20 levels · WCST neuroscience metrics',
    hubNodeChallengeHint: 'Same deck · highest CFS wins',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Wisconsin-style sorting · hidden rules · feedback only',
    levelsSub: (pop) => `${pop} · ${WCST_LEVELS_PER_TIER} levels`,
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'Discover hidden sort rules from feedback alone. Pass blocks to earn time and score. Too many errors ends the run.',
    freeIntroReady: 'Ready',
    challengeTitle: '⚔️ Challenge',
    challengeSub: 'Hard L12 · identical sequence · Cognitive Flexibility Score (CFS)',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Fair seed each round · pass device between players',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same card order for every player this round',
    chalBulletPass: 'Start only when this player holds the device',
    handTo: (n) => `Hand device to ${n}.`,
    goReady: 'Start sorting',
    chalMeta: 'Hard · L12 · WCST block',
    matchPrompt: 'Which pile matches?',
    shiftTitle: 'Category shift',
    shiftBody: 'The sorting rule has changed. Discover it from feedback.',
    trial: (n, max) => `Card ${n} / ${max}`,
    streak: (s, r) => `Streak ${s}/${r}`,
    categories: (c, t) => `Categories ${c}/${t}`,
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart block',
    quitMenu: 'Quit to menu',
    quitQ: 'Quit?',
    quitLose: 'This run will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    sessionTime: (s) => `Session ${s}s`,
    freeErrors: (n, max) => `Errors ${n}/${max}`,
    freeLvl: (d, lv) => `Free · ${d} L${lv}`,
    resultsPass: 'Level passed',
    resultsFail: 'Try again',
    stars: 'Stars',
    cfs: 'CFS (flexibility)',
    efficiency: 'Efficiency η',
    persev: 'Perseverative %',
    cc: 'Categories completed',
    tfc: 'Trials to 1st category',
    fms: 'Failures to maintain set',
    meanRt: 'Mean RT',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    freeGameOver: 'Run ended',
    score: 'Score',
    freeStages: (n) => `Blocks cleared: ${n}`,
    freeBest: (n) => `Best blocks: ${n}`,
    freePlayAgain: 'Play again',
    resultsChalTitle: 'Challenge results',
    chalRes: (cfs, pe, cc) => `CFS ${cfs} · PE ${pe}% · CC ${cc}`,
    newCh: 'New challenge',
    levelHeader: (d, lv) => `${WCST_DM[d]?.label ?? d} · L${lv}`,
    levelMeta: (r, cc) => `R=${r} consecutive · ${cc} categories`,
    challengeHeader: 'Challenge',
    freeHeader: 'Free mode',
    formulaHint: 'η = correct/total · CFS blends η, CC, and perseveration',
  },
  ar: {
    hubFlex: 'مرونة',
    hubTag: 'تدريب',
    title: 'فرز البطاقات',
    replayTutorial: 'إعادة الشرح',
    freeMode: '♾️ وضع حر',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'مؤقت جلسة · قواعد متغيرة',
    hubNodeLevelsHint: '٢٠ مستوى · مقاييس WCST',
    hubNodeChallengeHint: 'نفس الطابور · أعلى CFS',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'فرز بأسلوب ويسكونسن · قواعد مخفية · تغذية راجعة فقط',
    levelsSub: (pop) => `${pop} · ${WCST_LEVELS_PER_TIER} مستوى`,
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'اكتشف قواعد الفرز من التغذية الراجعة. اجتز الكتل لربح وقت ونقاط. أخطاء كثيرة تنهي المحاولة.',
    freeIntroReady: 'جاهز',
    challengeTitle: '⚔️ تحدي',
    challengeSub: 'صعب L12 · نفس التسلسل · درجة المرونة (CFS)',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات',
    chalRoundsHint: 'بذرة عادلة · تمرير الجهاز',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس ترتيب البطاقات',
    chalBulletPass: 'ابدأ عندما يكون الجهاز معك',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الفرز',
    chalMeta: 'صعب · L12 · كتلة WCST',
    matchPrompt: 'أي كومة تطابق؟',
    shiftTitle: 'تبديل الفئة',
    shiftBody: 'تغيّرت قاعدة الفرز. اكتشفها من التغذية الراجعة.',
    trial: (n, max) => `بطاقة ${n} / ${max}`,
    streak: (s, r) => `متتالية ${s}/${r}`,
    categories: (c, t) => `فئات ${c}/${t}`,
    paused: 'متوقف',
    resume: 'متابعة',
    restart: 'إعادة الكتلة',
    quitMenu: 'خروج للقائمة',
    quitQ: 'خروج؟',
    quitLose: 'سيُلغى هذا السجل.',
    yesQuit: 'نعم',
    keep: 'متابعة',
    sessionTime: (s) => `الجلسة ${s}ث`,
    freeErrors: (n, max) => `أخطاء ${n}/${max}`,
    freeLvl: (d, lv) => `حر · ${d} ${lv}`,
    resultsPass: 'اجتزت المستوى',
    resultsFail: 'حاول مجددًا',
    stars: 'نجوم',
    cfs: 'CFS (مرونة)',
    efficiency: 'كفاءة η',
    persev: 'إصرار %',
    cc: 'فئات مكتملة',
    tfc: 'محاولات لأول فئة',
    fms: 'فشل الحفاظ على المجموعة',
    meanRt: 'متوسط زمن الاستجابة',
    nextLv: 'التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    freeGameOver: 'انتهت المحاولة',
    score: 'نقاط',
    freeStages: (n) => `كتل: ${n}`,
    freeBest: (n) => `أفضل كتل: ${n}`,
    freePlayAgain: 'العب مجددًا',
    resultsChalTitle: 'نتائج التحدي',
    chalRes: (cfs, pe, cc) => `CFS ${cfs} · إصرار ${pe}% · فئات ${cc}`,
    newCh: 'تحدي جديد',
    levelHeader: (d, lv) => `${WCST_DM[d]?.label ?? d} · ${lv}`,
    levelMeta: (r, cc) => `R=${r} متتالية · ${cc} فئات`,
    challengeHeader: 'تحدي',
    freeHeader: 'وضع حر',
    formulaHint: 'η = صحيح/المجموع · CFS يدمج η والفئات والإصرار',
  },
};

function CountDots({ count }) {
  return (
    <div className="ct-wcst-count" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="ct-wcst-count-dot" />
      ))}
    </div>
  );
}

function WcstCardFace({ card, size = 'md' }) {
  return (
    <div className={`ct-wcst-card-face ct-wcst-card-face--${size}`}>
      <VigilShape shape={card.shape} size={size === 'lg' ? 'lg' : 'md'} />
      <CountDots count={card.count} />
      <span className={`ct-wcst-color-bar ct-wcst-color-bar--${card.color}`} />
    </div>
  );
}

function ReferencePile({ card, pileIndex, highlight, label, onPointerDown }) {
  const hi =
    highlight === 'correct'
      ? ' ct-wcst-pile--correct'
      : highlight === 'wrong'
        ? ' ct-wcst-pile--wrong'
        : '';
  return (
    <button
      type="button"
      className={`ct-wcst-pile${hi}`}
      aria-label={label}
      onPointerDown={onPointerDown}
    >
      <WcstCardFace card={card} size="sm" />
      <span className="ct-wcst-pile-num">{pileIndex + 1}</span>
    </button>
  );
}

export default function RuleSwitchGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  const [profile, setProfile] = useState(() => loadWcstProfile());
  const [phase, setPhase] = useState('hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [playStep, setPlayStep] = useState('idle');
  const [feedback, setFeedback] = useState(null);
  const [pickedPile, setPickedPile] = useState(null);
  const [showShift, setShowShift] = useState(false);
  const [streakDisplay, setStreakDisplay] = useState(0);
  const [catsDisplay, setCatsDisplay] = useState(0);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [sessionSec, setSessionSec] = useState(WCST_FREE_SESSION_START_SEC);
  const [freeScore, setFreeScore] = useState(0);
  const [freeErrDisplay, setFreeErrDisplay] = useState(0);
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [tutorialQueue, setTutorialQueue] = useState([]);
  const [, tick] = useState(0);

  const blockRef = useRef(null);
  const resultsRef = useRef([]);
  const respondedRef = useRef(false);
  const stimOnRef = useRef(0);
  const timersRef = useRef([]);
  const runIdRef = useRef(0);
  const playStepRef = useRef('idle');
  const pauseRef = useRef(false);
  const finishBlockRef = useRef(() => {});
  const startTrialRef = useRef(() => {});

  const tlRef = useRef(WCST_FREE_SESSION_START_SEC);
  const tlimRef = useRef(WCST_FREE_SESSION_START_SEC);
  const timerRunIdRef = useRef(0);
  const runRef = useRef(false);
  const freeStageRef = useRef(0);
  const freeBlocksRef = useRef(0);
  const freeErrRef = useRef(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const pendingTutorialActionRef = useRef(null);

  const doneMap = profile.done || {};
  const bump = () => tick((n) => n + 1);

  const block = blockRef.current;
  const session = block?.session;
  const probe = session?.probe;
  const spec = block?.spec;

  useEffect(() => {
    pauseRef.current = pauseOpen;
  }, [pauseOpen]);
  useEffect(() => {
    playStepRef.current = playStep;
  }, [playStep]);
  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const stopSessionTimer = useCallback(() => {
    runRef.current = false;
    timerRunIdRef.current += 1;
  }, []);

  const clearPlayState = useCallback(() => {
    clearTimers();
    stopSessionTimer();
    runIdRef.current += 1;
    blockRef.current = null;
    setPlayStep('idle');
    setPauseOpen(false);
    setQuitOpen(false);
    setShowShift(false);
    setChalTurnOpen(false);
    bump();
  }, [clearTimers, stopSessionTimer]);

  const persistLevel = useCallback(
    (b, summary, grade) => {
      const p = { ...profile, tel: [...(profile.tel || [])], done: { ...doneMap } };
      p.tel.push({
        diff: b.diff,
        lv: b.lv,
        won: grade.won,
        cfs: grade.cfs,
        efficiencyPct: summary.efficiencyPct,
        persevPct: summary.persevPct,
        categoriesCompleted: summary.categoriesCompleted,
        ts: new Date().toISOString(),
      });
      if (grade.won) p.done[`${b.diff}-${b.lv}`] = true;
      saveWcstProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const finishBlock = useCallback(() => {
    const b = blockRef.current;
    if (!b?.session) return;
    clearTimers();
    stopSessionTimer();

    const summary = summarizeWcst(resultsRef.current, b.session);
    const grade = gradeBlock(summary, b.diff, { freeMode: b.mode === 'free' });

    if (b.mode === 'challenge') {
      const idx = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      base[idx] = mergeWcstChallengeRow(base[idx], grade, summary, names[idx]);
      chalScoresRef.current = base;
      setChalScores(base);
      playSfx(grade.won ? 'win' : 'error');
      const nextIdx = idx + 1;
      if (nextIdx < names.length) {
        setChalIdx(nextIdx);
        setChalTurnOpen(true);
        setPhase('play');
        setPlayStep('idle');
        blockRef.current = null;
      } else {
        const cycle = chalCycleRef.current;
        if (cycle + 1 < chalRoundsTotalRef.current) {
          chalCycleRef.current = cycle + 1;
          setChalRoundIdx(chalCycleRef.current);
          const newSeed = prepareChallengeSeed();
          setChalSeed(newSeed);
          setChalIdx(0);
          chalIdxRef.current = 0;
          setChalTurnOpen(true);
          setPhase('play');
          setPlayStep('idle');
          blockRef.current = null;
        } else {
          setLastResult({ type: 'challenge', rows: base });
          setPhase('chalRes');
          blockRef.current = null;
        }
      }
      bump();
      return;
    }

    if (b.mode === 'free') {
      if (grade.won) {
        playSfx('win');
        freeStreakRef.current += 1;
        freeScoreRef.current += freeBlockPoints(b.spec, freeStreakRef.current);
        setFreeScore(freeScoreRef.current);
        const bonus = freeClearBonusSec(freeBlocksRef.current, b.spec.maxTrials);
        tlRef.current = Math.min(WCST_FREE_SESSION_CAP_SEC, tlRef.current + bonus);
        tlimRef.current = Math.max(tlimRef.current, tlRef.current);
        setSessionSec(Math.ceil(tlRef.current));
        freeBlocksRef.current += 1;
        freeStageRef.current += 1;
        const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
        blockRef.current = prepareFreeBlock(freeStageRef.current, seed);
        resultsRef.current = [];
        startWcstProbe(blockRef.current.session);
        setStreakDisplay(0);
        setCatsDisplay(0);
        setPlayStep('running');
        playStepRef.current = 'running';
        startTrial();
        bump();
        return;
      }

      playSfx('error');
      setProfile((prev) => {
        let next = { ...prev };
        let changed = false;
        if (freeScoreRef.current > (prev.bestFree ?? 0)) {
          next = { ...next, bestFree: freeScoreRef.current };
          changed = true;
        }
        if (freeBlocksRef.current > (prev.bestStages ?? 0)) {
          next = { ...next, bestStages: freeBlocksRef.current };
          changed = true;
        }
        if (changed) saveWcstProfile(next);
        return changed ? next : prev;
      });
      setLastResult({
        type: 'free',
        blocksWon: freeBlocksRef.current,
        score: freeScoreRef.current,
        reason: 'block',
        summary,
        grade,
      });
      setPhase('freeRes');
      blockRef.current = null;
      bump();
      return;
    }

    playSfx(grade.won ? 'win' : 'error');
    persistLevel(b, summary, grade);
    setLastResult({ type: 'level', block: b, summary, grade });
    setPhase('res');
    blockRef.current = null;
    bump();
  }, [clearTimers, stopSessionTimer, persistLevel, playSfx]);

  useEffect(() => {
    finishBlockRef.current = finishBlock;
  }, [finishBlock]);

  const startTrial = useCallback(() => {
    const b = blockRef.current;
    const s = b?.session;
    if (!s || s.finished) {
      finishBlockRef.current();
      return;
    }
    if (pauseRef.current) return;

    respondedRef.current = false;
    setFeedback(null);
    setPickedPile(null);
    setPlayStep('running');
    playStepRef.current = 'running';
    stimOnRef.current = performance.now();
    setStreakDisplay(s.streak);
    setCatsDisplay(s.categoriesCompleted);
    bump();

    const runId = runIdRef.current;
    timersRef.current.push(
      setTimeout(() => {
        if (runIdRef.current !== runId || respondedRef.current || pauseRef.current) return;
        const rule = activeRule(s);
        resultsRef.current.push({
          kind: 'answer',
          correct: false,
          timeout: true,
          rule,
        });
        setFeedback('wrong');
        playSfx('error');
        if (b.mode === 'free') {
          freeErrRef.current += 1;
          setFreeErrDisplay(freeErrRef.current);
          if (freeErrRef.current >= WCST_FREE_MAX_ERRORS) {
            finishBlockRef.current();
            return;
          }
        }
        const outcome = applyWcstTimeout(s);
        setStreakDisplay(0);
        bump();
        advanceAfterFeedback(outcome);
      }, s.responseLimitMs),
    );
  }, [playSfx]);

  useEffect(() => {
    startTrialRef.current = startTrial;
  }, [startTrial]);

  const advanceAfterFeedback = useCallback((outcome) => {
    const b = blockRef.current;
    if (!b) return;
    if (outcome.finished) {
      timersRef.current.push(setTimeout(() => finishBlockRef.current(), b.spec.feedbackMs));
      return;
    }
    if (outcome.categoryShift) {
      setShowShift(true);
      setPlayStep('shift');
      playStepRef.current = 'shift';
      timersRef.current.push(
        setTimeout(() => {
          setShowShift(false);
          setPlayStep('running');
          playStepRef.current = 'running';
          startTrialRef.current();
        }, 1400),
      );
      return;
    }
    timersRef.current.push(setTimeout(() => startTrialRef.current(), b.spec.feedbackMs));
  }, []);

  const onPickPile = useCallback(
    (pileIndex, e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (playStepRef.current !== 'running' || pauseRef.current) return;
      const b = blockRef.current;
      const s = b?.session;
      if (!s?.probe || respondedRef.current) return;

      respondedRef.current = true;
      clearTimers();
      runIdRef.current += 1;

      const rtMs = Math.max(0, Math.round(performance.now() - stimOnRef.current));
      const outcome = applyWcstAnswer(s, pileIndex);
      resultsRef.current.push({
        kind: 'answer',
        correct: outcome.correct,
        rule: outcome.rule,
        perseverative: outcome.perseverative,
        rtMs,
        chosenPile: pileIndex,
      });

      setPickedPile(pileIndex);
      setFeedback(outcome.correct ? 'correct' : 'wrong');
      setStreakDisplay(outcome.streak);
      setCatsDisplay(outcome.categoriesCompleted);
      playSfx(outcome.correct ? 'click' : 'error');
      if (!outcome.correct && b.mode === 'free') {
        freeErrRef.current += 1;
        setFreeErrDisplay(freeErrRef.current);
        if (freeErrRef.current >= WCST_FREE_MAX_ERRORS) {
          bump();
          finishBlockRef.current();
          return;
        }
      }
      bump();
      advanceAfterFeedback(outcome);
    },
    [clearTimers, playSfx, advanceAfterFeedback],
  );

  const beginBlock = useCallback(
    (b) => {
      clearTimers();
      runIdRef.current += 1;
      blockRef.current = b;
      resultsRef.current = [];
      startWcstProbe(b.session);
      setPauseOpen(false);
      setQuitOpen(false);
      setFeedback(null);
      setShowShift(false);
      setStreakDisplay(0);
      setCatsDisplay(0);
      setPhase('play');
      setPlayStep('running');
      playStepRef.current = 'running';
      startTrial();
      bump();
    },
    [clearTimers, startTrial],
  );

  useEffect(() => {
    if (phase !== 'play' || playStep !== 'running' || blockRef.current?.mode !== 'free') {
      return undefined;
    }
    let id;
    let last = performance.now();
    const runId = timerRunIdRef.current + 1;
    timerRunIdRef.current = runId;
    runRef.current = true;
    const loop = (ts) => {
      if (!runRef.current || pauseRef.current || timerRunIdRef.current !== runId) return;
      const dt = (ts - last) / 1000;
      last = ts;
      tlRef.current = Math.max(0, tlRef.current - dt);
      setSessionSec(Math.ceil(tlRef.current));
      if (tlRef.current <= 0) {
        finishBlockRef.current();
        return;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      if (timerRunIdRef.current === runId) runRef.current = false;
    };
  }, [phase, playStep, pauseOpen]);

  const gateWithTutorial = useCallback((action, kind) => {
    const q = buildTutorialQueueFor(kind);
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
        const act = pendingTutorialActionRef.current;
        pendingTutorialActionRef.current = null;
        queueMicrotask(act);
      }
      return remaining;
    });
  }, []);

  const startFreeMode = useCallback(() => {
    freeStageRef.current = 0;
    freeBlocksRef.current = 0;
    freeErrRef.current = 0;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    tlRef.current = WCST_FREE_SESSION_START_SEC;
    tlimRef.current = WCST_FREE_SESSION_START_SEC;
    setSessionSec(WCST_FREE_SESSION_START_SEC);
    setFreeScore(0);
    setFreeErrDisplay(0);
    setPhase('freeIntro');
  }, []);

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginBlock(prepareFreeBlock(0, seed));
  }, [playSfx, beginBlock]);

  const startLevelGame = useCallback(
    (diff, lv) => {
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      beginBlock(prepareLevelBlock(diff, lv, seed));
    },
    [beginBlock],
  );

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      window.alert(t.needTwo);
      return;
    }
    clearPlayState();
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    const seed = prepareChallengeSeed();
    setChalSeed(seed);
    setChalIdx(0);
    chalIdxRef.current = 0;
    const initial = names.map((nm) => ({ nm, rounds: [] }));
    chalScoresRef.current = initial;
    setChalScores(initial);
    setChalTurnOpen(true);
    setPhase('play');
  };

  const startChallengeBlock = () => {
    if (!chalSeed) return;
    setChalTurnOpen(false);
    beginBlock(prepareChallengeBlock(chalSeed));
    playSfx('click');
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    const mode = blockRef.current?.mode;
    clearPlayState();
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else if (mode === 'free') setPhase('hub');
    else setPhase('hub');
  };

  const rule = session ? activeRule(session) : 'color';
  const correctPile = probe ? correctPileIndex(probe, rule) : -1;

  return (
    <div className="ct-rswitch-root ct-wcst-root cancellation-task-game" dir={isAr ? 'rtl' : 'ltr'}>
      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              hubSpaced
              variant="paper"
              onReplayTutorial={() => {
                pendingTutorialActionRef.current = null;
                setTutorialQueue([{ kind: 'main' }]);
              }}
              replayHint={t.replayTutorial}
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big">{t.hubFlex}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTag}</div>
                </div>
              }
            />
            <CardSortModes
              t={t}
              isAr={isAr}
              playSfx={playSfx}
              onFree={() => gateWithTutorial(startFreeMode, 'free')}
              onLevels={() => gateWithTutorial(() => setPhase('diff'), 'levels')}
              onChallenge={() => gateWithTutorial(() => setPhase('chal'), 'challenge')}
            />
          </div>
        </div>
      )}

      {phase === 'diff' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => setPhase('hub')}
              playSfx={playSfx}
              variant="paper"
              center={
                <div className="ct-fq-training-title ct-fq-training-title-sm">{t.pickDiff}</div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
            {WCST_DIFF_KEYS.map((k) => (
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
                <span>{WCST_DM[k].label}</span>
                <span className="ct-fq-dbg">{WCST_DM[k].pop}</span>
              </button>
            ))}
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
                <div className="ct-fq-training-title ct-fq-training-title-sm">
                  {WCST_DM[diffKey].label}
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.levelsSub(WCST_DM[diffKey].pop)}</p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: WCST_LEVELS_PER_TIER }, (_, i) => i + 1).map((lv) => {
                const un = isWcstLevelUnlocked(diffKey, lv, doneMap);
                const dn = !!doneMap[`${diffKey}-${lv}`];
                const sp = specificationForLevel(diffKey, lv);
                const cls = `ct-fq-lb ${un ? `ct-${WCST_DM[diffKey].lvc}` : 'ct-lvk'}`;
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
                      {un
                        ? `R${sp.streakToSwitch} · ${sp.categoriesToComplete}cat`
                        : '🔒'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                clearPlayState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div className="ct-fq-training-title ct-fq-training-title-sm">
                  {t.challengeTitle}
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
                      onClick={() => setChalNames(chalNames.filter((_, j) => j !== i))}
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
              <p className="ct-fq-sub" style={{ fontSize: '0.78rem', marginBottom: 8 }}>
                {t.chalRoundsHint}
              </p>
              <div className="ct-fq-rr">
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
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={openChallenge}>
              {t.startCh}
            </button>
          </div>
        </div>
      )}

      {phase === 'freeIntro' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div
            className="ct-fq-screen ct-fq-training-screen"
            style={{ textAlign: 'center', paddingTop: 48 }}
          >
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper" />
            <h2 style={{ fontFamily: isAr ? 'Cairo' : 'Fredoka One', marginTop: 24 }}>
              {t.freeIntroTitle}
            </h2>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.freeIntroBody}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={onFreeIntroReady}>
              {t.freeIntroReady}
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={
            chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null
          }
          metaLine={t.chalMeta}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeBlock}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && block && session && !chalTurnOpen && (
        <div className="ct-rswitch-play-wrap ct-wcst-play-wrap">
          <TrainingPlayHeader
            isAr={isAr}
            title={
              block.mode === 'free'
                ? t.freeHeader
                : block.mode === 'challenge'
                  ? t.challengeHeader
                  : t.levelHeader(block.diff, block.lv)
            }
            subtitle={
              block.mode === 'free'
                ? `${t.sessionTime(sessionSec)} · ${t.freeErrors(freeErrDisplay, WCST_FREE_MAX_ERRORS)} · ${t.freeLvl(WCST_DM[block.diff]?.label, block.lv)}`
                : `${t.trial(session.trialNumber, session.maxTrials)} · ${t.streak(streakDisplay, session.streakToSwitch)} · ${t.categories(catsDisplay, session.categoriesToComplete)}`
            }
            playSfx={playSfx}
            onMenu={() => setQuitOpen(true)}
            onPause={() => setPauseOpen(true)}
            pauseAriaLabel={t.paused}
          />
          <p className="ct-wcst-play-hint">{playHint(isAr)}</p>
          <p className="ct-wcst-formula-hint">{t.formulaHint}</p>
          {(playStep === 'running' || playStep === 'shift') && probe && (
            <div className="ct-wcst-board">
              <p className="ct-wcst-match-prompt">{t.matchPrompt}</p>
              <div className="ct-wcst-refs">
                {WCST_REFERENCE_CARDS.map((c, i) => {
                  let highlight = null;
                  if (feedback && playStep === 'running') {
                    if (feedback === 'correct' && i === correctPile) highlight = 'correct';
                    if (feedback === 'wrong') {
                      if (i === pickedPile) highlight = 'wrong';
                      if (i === correctPile) highlight = 'correct';
                    }
                  }
                  return (
                    <ReferencePile
                      key={c.id}
                      card={c}
                      pileIndex={i}
                      highlight={highlight}
                      label={isAr ? `كومة ${i + 1}` : `Pile ${i + 1}`}
                      onPointerDown={(e) => onPickPile(i, e)}
                    />
                  );
                })}
              </div>
              <div className="ct-wcst-probe-zone">
                <div
                  className={`ct-wcst-probe-card${
                    feedback === 'correct'
                      ? ' ct-wcst-probe-card--ok'
                      : feedback === 'wrong'
                        ? ' ct-wcst-probe-card--bad'
                        : ''
                  }`}
                >
                  <WcstCardFace card={probe} size="lg" />
                </div>
                {feedback && playStep === 'running' && (
                  <p
                    className={`ct-wcst-feedback ct-wcst-feedback--${feedback}`}
                    role="status"
                  >
                    {feedbackLabel(feedback === 'correct', isAr)}
                  </p>
                )}
              </div>
            </div>
          )}
          {playStep === 'shift' && showShift && (
            <div className="ct-wcst-shift-overlay">
              <p className="ct-wcst-shift-title">{t.shiftTitle}</p>
              <p>{t.shiftBody}</p>
            </div>
          )}
        </div>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div className="ct-fq-training-title ct-fq-training-title-sm">
                  {lastResult.grade.won ? t.resultsPass : t.resultsFail}
                </div>
              }
            />
            {lastResult.grade.won && (
              <div style={{ textAlign: 'center', color: '#e8ac4e', marginTop: 8 }}>
                {'★'.repeat(lastResult.grade.stars)} {t.stars}
              </div>
            )}
            <div className="ct-wcst-results-grid">
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">{lastResult.grade.cfs}</div>
                <div className="ct-vigil-stat-l">{t.cfs}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">{lastResult.summary.efficiencyPct}%</div>
                <div className="ct-vigil-stat-l">{t.efficiency}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">{lastResult.summary.persevPct}%</div>
                <div className="ct-vigil-stat-l">{t.persev}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.categoriesCompleted}/
                  {lastResult.summary.categoriesTarget}
                </div>
                <div className="ct-vigil-stat-l">{t.cc}</div>
              </div>
              <div className="ct-vigil-stat ct-vigil-stat--wide">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.trialsToFirstCategory ?? '—'}
                </div>
                <div className="ct-vigil-stat-l">{t.tfc}</div>
              </div>
              <div className="ct-vigil-stat ct-vigil-stat--wide">
                <div className="ct-vigil-stat-n">{lastResult.summary.failureToMaintainSet}</div>
                <div className="ct-vigil-stat-l">{t.fms}</div>
              </div>
              <div className="ct-vigil-stat ct-vigil-stat--wide">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.meanRt != null
                    ? `${lastResult.summary.meanRt} ms`
                    : '—'}
                </div>
                <div className="ct-vigil-stat-l">{t.meanRt}</div>
              </div>
            </div>
            <div className="ct-fq-row">
              {lastResult.grade.won && lastResult.block.lv < WCST_LEVELS_PER_TIER && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => {
                    playSfx('click');
                    setLastResult(null);
                    startLevelGame(lastResult.block.diff, lastResult.block.lv + 1);
                  }}
                >
                  {t.nextLv}
                </button>
              )}
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  setLastResult(null);
                  startLevelGame(lastResult.block.diff, lastResult.block.lv);
                }}
              >
                {t.retry}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  setLastResult(null);
                  clearPlayState();
                  setPhase('levels');
                }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div className="ct-fq-training-title ct-fq-training-title-sm">
                  {t.freeGameOver}
                </div>
              }
            />
            <div className="ct-fq-sbig">{lastResult.score ?? 0}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.freeStages(lastResult.blocksWon)}</p>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.freeBest(profile.bestStages ?? 0)}</p>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                startFreeMode();
              }}
            >
              {t.freePlayAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={() => {
                setLastResult(null);
                clearPlayState();
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div className="ct-fq-training-title ct-fq-training-title-sm">
                  {t.resultsChalTitle}
                </div>
              }
            />
            {[...lastResult.rows].sort(compareChallengeRows).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">
                    {t.chalRes(
                      row.cfs,
                      row.persevPct,
                      row.last?.categoriesCompleted ?? 0,
                    )}
                  </div>
                </div>
                <div className="ct-fq-lbsc">{row.cfs}</div>
              </div>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                clearPlayState();
                setPhase('chal');
              }}
            >
              {t.newCh}
            </button>
          </div>
        </div>
      )}

      <TrainingPauseModal
        open={pauseOpen && phase === 'play' && !!block}
        labels={{
          paused: t.paused,
          resume: t.resume,
          restart: t.restart,
          quitMenu: t.quitMenu,
        }}
        showRestart
        onResume={() => {
          setPauseOpen(false);
          if (playStep === 'running') startTrial();
        }}
        onRestart={() => {
          setPauseOpen(false);
          const b = blockRef.current;
          if (!b) return;
          if (b.mode === 'level') startLevelGame(b.diff, b.lv);
          else if (b.mode === 'free') {
            const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
            beginBlock(prepareFreeBlock(b.freeStage ?? 0, seed));
          } else if (chalSeed) startChallengeBlock();
        }}
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
        onKeepPlaying={() => setQuitOpen(false)}
      />

      {tutorialQueue.length > 0 && (
        <CardSortTutorial
          kind={tutorialQueue[0].kind}
          isAr={isAr}
          onClose={advanceTutorial}
          playSfx={playSfx}
        />
      )}
    </div>
  );
}
