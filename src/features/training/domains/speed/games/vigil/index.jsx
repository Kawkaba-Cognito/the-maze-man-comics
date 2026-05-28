import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { loadGameSettings } from '../../../../shared/focusQuestData';
import VigilModes from './VigilModes';
import {
  VIGIL_LEVELS_PER_TIER,
  VIGIL_DIFF_KEYS,
  VIGIL_DM,
  VIGIL_FREE_SESSION_START_SEC,
  VIGIL_FREE_SESSION_CAP_SEC,
  VIGIL_FREE_MAX_COMMISSIONS,
  specificationForLevel,
  summarizeVigil,
  gradeBlock,
  isVigilLevelUnlocked,
  prepareFreeBlock,
  prepareLevelBlock,
  prepareChallengeSeed,
  prepareChallengeBlock,
  freeClearBonusSec,
  freeHitPoints,
  freeBlockClearPoints,
  mergeVigilChallengeRow,
  compareChallengeRows,
} from './vigilData';
import { loadVigilProfile, saveVigilProfile } from './vigilProgress';
import VigilTutorial, {
  buildTutorialQueueFor,
  markTutorialSeen,
} from './tutorial';
import VigilShape, { VigilShapeRow } from './VigilShape';
import {
  describeBriefing,
  liveCueForTrial,
  hudRuleLines,
  playHintForRule,
} from './vigilRules';

const UI = {
  en: {
    hubSpeed: 'Speed',
    hubTag: 'training',
    title: 'Vigil Test',
    replayTutorial: 'Replay tutorial',
    tapTarget: 'Square → tap the button',
    withhold: 'Circle → do not tap',
    tapPad: 'TAP',
    tapNow: 'TAP NOW!',
    hold: 'HOLD',
    watchCenter: 'Watch here',
    playHint: 'Tap when you see the target shape.',
    cueSquare: '■ Square — tap the button!',
    cueCircle: '● Circle — hands off the button',
    cueWait: 'Next shape coming…',
    trial: (n, total) => `${n} / ${total}`,
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart block',
    quitMenu: 'Quit to menu',
    quitQ: 'Quit?',
    quitLose: 'This run will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    countdown: 'Get ready…',
    ms: 'ms',
    freeMode: '♾️ Free mode',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    hubMapAria: 'Modes — choose a path',
    hubNodeFreeHint: 'Session timer · 3 false taps end run',
    hubNodeLevelsHint: '20 levels per tier · unlock in order',
    hubNodeChallengeHint: 'Same trials · pass & play',
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'Each block shows your task before you start (which shape to tap, which to ignore). One session clock for the whole run — three false taps end the run.',
    freeIntroReady: 'Ready',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Each tier has levels 1–20. Unlock in order.',
    levelsSub: (pop) => `${pop} · ${VIGIL_LEVELS_PER_TIER} levels`,
    challengeTitle: '⚔️ Challenge mode',
    challengeSub: 'Same trial sequence for everyone · Hard L12',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Each player plays once per round · New fair seed each round',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same trial order for every player this round',
    chalBulletPass: 'Tap Start only when the device is with this player',
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start block',
    chalMeta: 'Hard · L12 · trial block',
    sessionTime: (s) => `Session ${s}s`,
    freeCommissions: (n, max) => `False taps ${n}/${max}`,
    freeLvlLabel: (tier, lv) => `Free · ${tier} L${lv}`,
    resultsLevelPass: 'Level passed',
    resultsLevelRetry: 'Try again',
    stars: 'Stars',
    vs: 'Vigil score (VS)',
    ve: 'Vigil efficiency (VE)',
    veNA: '—',
    hits: 'Hits',
    misses: 'Misses (omissions)',
    commissions: 'False taps',
    correctReject: 'Correct withholds',
    meanRt: 'Mean RT',
    rtVar: 'RT variability',
    omissionRate: 'Omission rate',
    commissionRate: 'Commission rate',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    freeGameOver: 'Run ended',
    score: 'Score',
    freeStagesCleared: (n) => `Blocks cleared: ${n}`,
    freeBest: (n) => `Best blocks: ${n}`,
    freeBestScore: (n) => `Best score: ${n}`,
    freePlayAgain: 'Play again',
    resultsChalTitle: 'Challenge results',
    chalResDetail: (nr, vs, comm, hit, ve) =>
      nr > 1
        ? `${nr}× · VS ${vs} · ${comm} comm total · ${hit}% hits · VE ${ve ?? '—'}`
        : `VS ${vs} · ${comm} comm · ${hit}% hits · VE ${ve ?? '—'}`,
    newCh: 'New challenge',
    levelHeader: (diff, lv) => `${VIGIL_DM[diff]?.label ?? diff} · L${lv}`,
    levelPlaySub: (n, pct) => `${n} trials · ${pct}% ■`,
    challengeHeader: 'Challenge',
    freeHeader: 'Free mode',
    perfect: 'Perfect vigil!',
    good: 'Solid focus',
    tryLower: 'Keep practicing',
  },
  ar: {
    hubSpeed: 'سرعة',
    hubTag: 'تدريب',
    title: 'اختبار اليقظة',
    replayTutorial: 'إعادة الشرح',
    tapTarget: 'مربع ← اضغط الزر',
    withhold: 'دائرة ← لا تضغط',
    tapPad: 'اضغط',
    tapNow: 'اضغط الآن!',
    hold: 'توقّف',
    watchCenter: 'راقب هنا',
    playHint: 'اضغط عند ظهور الشكل المطلوب.',
    cueSquare: '■ مربع — اضغط الزر!',
    cueCircle: '● دائرة — لا تلمس الزر',
    cueWait: 'الشكل التالي قريباً…',
    trial: (n, total) => `${n} / ${total}`,
    paused: 'متوقف',
    resume: 'متابعة',
    restart: 'إعادة الكتلة',
    quitMenu: 'الخروج للقائمة',
    quitQ: 'خروج؟',
    quitLose: 'سيُلغى هذا السجل.',
    yesQuit: 'نعم، خروج',
    keep: 'متابعة اللعب',
    countdown: 'استعد…',
    ms: 'ملث',
    freeMode: '♾️ وضع حر',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    hubMapAria: 'الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'مؤقت جلسة · ٣ ضغطات خاطئة تنهي المحاولة',
    hubNodeLevelsHint: '٢٠ مستوى لكل صعوبة · بالترتيب',
    hubNodeChallengeHint: 'نفس المحاولات · تمرير الجهاز',
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'كل كتلة تعرض مهمتك قبل البدء (أي شكل تضغط وأي شكل تتجاهل). مؤقت واحد للجلسة — ثلاث ضغطات خاطئة تنهي المحاولة.',
    freeIntroReady: 'جاهز',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'كل مستوى يحتوي ٢٠ مرحلة. افتحها بالترتيب.',
    levelsSub: (pop) => `${pop} · ${VIGIL_LEVELS_PER_TIER} مستوى`,
    challengeTitle: '⚔️ وضع التحدي',
    challengeSub: 'نفس تسلسل المحاولات للجميع · صعب L12',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · بذرة عادلة جديدة كل جولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس ترتيب المحاولات لكل اللاعبين في هذه الجولة',
    chalBulletPass: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الكتلة',
    chalMeta: 'صعب · L12 · كتلة محاولات',
    sessionTime: (s) => `الجلسة ${s}ث`,
    freeCommissions: (n, max) => `ضغط خاطئ ${n}/${max}`,
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetry: 'حاول مجددًا',
    stars: 'نجوم',
    vs: 'درجة اليقظة (VS)',
    ve: 'كفاءة اليقظة (VE)',
    veNA: '—',
    hits: 'إصابات',
    misses: 'فوائت (إهمال)',
    commissions: 'ضغط خاطئ',
    correctReject: 'امتناع صحيح',
    meanRt: 'متوسط زمن الاستجابة',
    rtVar: 'تشتت الزمن',
    omissionRate: 'نسبة الإهمال',
    commissionRate: 'نسبة الاندفاع',
    nextLv: 'المستوى التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    freeGameOver: 'انتهت المحاولة',
    score: 'نقاط',
    freeStagesCleared: (n) => `كتل ناجحة: ${n}`,
    freeBest: (n) => `أفضل كتل: ${n}`,
    freeBestScore: (n) => `أفضل نقاط: ${n}`,
    freePlayAgain: 'العب مجددًا',
    resultsChalTitle: 'نتائج التحدي',
    chalResDetail: (nr, vs, comm, hit, ve) =>
      nr > 1
        ? `${nr}× · VS ${vs} · ${comm} اندفاع · ${hit}% إصابة · VE ${ve ?? '—'}`
        : `VS ${vs} · ${comm} اندفاع · ${hit}% إصابة · VE ${ve ?? '—'}`,
    newCh: 'تحدي جديد',
    levelHeader: (diff, lv) => `${VIGIL_DM[diff]?.label ?? diff} · ${lv}`,
    levelPlaySub: (n, pct) => `${n} محاولة · ${pct}% ■`,
    challengeHeader: 'تحدي',
    freeHeader: 'وضع حر',
    perfect: 'يقظة ممتازة!',
    good: 'تركيز جيد',
    tryLower: 'واصل التدريب',
  },
};

function StimulusShape({ trial, visible }) {
  if (!visible || !trial) {
    return <div className="ct-vigil-stim ct-vigil-stim--blank" aria-hidden="true" />;
  }
  return (
    <div
      className={`ct-vigil-stim${trial.isTarget ? ' ct-vigil-stim--target' : ' ct-vigil-stim--nontarget'}`}
      aria-hidden="true"
    >
      <VigilShape shape={trial.shape} size="lg" />
    </div>
  );
}

export default function VigilTestGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const settings = loadGameSettings();

  const [profile, setProfile] = useState(() => loadVigilProfile());
  const [phase, setPhase] = useState('hub');
  const [diffKey, setDiffKey] = useState('easy');

  const [playStep, setPlayStep] = useState('idle');
  const [trialIdx, setTrialIdx] = useState(0);
  const [stimVisible, setStimVisible] = useState(false);
  const [cdVal, setCdVal] = useState(3);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [sessionSec, setSessionSec] = useState(VIGIL_FREE_SESSION_START_SEC);
  const [freeScore, setFreeScore] = useState(0);
  const [freeCommDisplay, setFreeCommDisplay] = useState(0);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);

  const blockRef = useRef(null);
  const trialsRef = useRef([]);
  const resultsRef = useRef([]);
  const respondedRef = useRef(false);
  const rtRef = useRef(null);
  const stimOnRef = useRef(0);
  const responseWindowRef = useRef(false);
  const timersRef = useRef([]);
  const runIdRef = useRef(0);
  const blockEndedRef = useRef(false);

  const tlRef = useRef(VIGIL_FREE_SESSION_START_SEC);
  const tlimRef = useRef(VIGIL_FREE_SESSION_START_SEC);
  const timerRunIdRef = useRef(0);
  const runRef = useRef(false);

  const freeStageRef = useRef(0);
  const freeBlocksWonRef = useRef(0);
  const freeCommissionsRef = useRef(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);

  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const sessionTimedOutRef = useRef(false);

  const finishBlockRef = useRef(() => {});
  const pauseRef = useRef(false);
  const playStepRef = useRef('idle');
  const stimVisibleRef = useRef(false);
  const currentTrialRef = useRef(null);
  const trialIdxRef = useRef(0);

  const doneMap = profile.done || {};

  const [tapPressed, setTapPressed] = useState(false);
  const [tapFeedback, setTapFeedback] = useState(null);
  const tapFeedbackTimer = useRef(null);

  const [tutorialQueue, setTutorialQueue] = useState([]);
  const pendingTutorialActionRef = useRef(null);

  useEffect(() => {
    pauseRef.current = pauseOpen;
  }, [pauseOpen]);

  useEffect(() => {
    playStepRef.current = playStep;
  }, [playStep]);

  useEffect(() => {
    stimVisibleRef.current = stimVisible;
  }, [stimVisible]);

  useEffect(() => {
    trialIdxRef.current = trialIdx;
  }, [trialIdx]);

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
    blockEndedRef.current = false;
    setPlayStep('idle');
    playStepRef.current = 'idle';
    setPauseOpen(false);
    setQuitOpen(false);
    stimVisibleRef.current = false;
    responseWindowRef.current = false;
    setStimVisible(false);
    currentTrialRef.current = null;
    setChalTurnOpen(false);
  }, [clearTimers, stopSessionTimer]);

  const persistLevel = useCallback(
    (block, summary, grade) => {
      const p = {
        ...profile,
        tel: [...(profile.tel || [])],
        done: { ...doneMap },
      };
      p.tel.push({
        diff: block.diff,
        lv: block.lv,
        won: grade.won,
        vigilScore: grade.vigilScore,
        ve: grade.ve,
        hitRatePct: summary.hitRatePct,
        commissionPct: summary.commissionPct,
        ts: new Date().toISOString(),
      });
      if (grade.won && block.mode === 'level') {
        p.done[`${block.diff}-${block.lv}`] = true;
      }
      saveVigilProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const finishTrial = useCallback((trial) => {
    resultsRef.current.push({
      isTarget: trial.isTarget,
      responded: respondedRef.current,
      rtMs: respondedRef.current ? rtRef.current : null,
    });
  }, []);

  const scheduleNext = useCallback(
    (idx) => {
      const trials = trialsRef.current;
      const block = blockRef.current;
      if (!block) return;

      if (idx >= trials.length) {
        setPlayStep('done');
        setStimVisible(false);
        finishBlockRef.current();
        return;
      }

      const trial = trials[idx];
      const { spec } = block;
      const runId = runIdRef.current;
      respondedRef.current = false;
      rtRef.current = null;
      currentTrialRef.current = trial;
      responseWindowRef.current = false;
      setTrialIdx(idx);
      stimVisibleRef.current = false;
      setStimVisible(false);

      const add = (fn, ms) => {
        const id = setTimeout(() => {
          if (runIdRef.current !== runId || pauseRef.current) return;
          fn();
        }, ms);
        timersRef.current.push(id);
      };

      add(() => {
        stimVisibleRef.current = true;
        responseWindowRef.current = true;
        stimOnRef.current = performance.now();
        setStimVisible(true);
      }, spec.fixationMs);

      add(() => {
        stimVisibleRef.current = false;
        setStimVisible(false);
      }, spec.fixationMs + spec.stimulusMs);

      add(() => {
        responseWindowRef.current = false;
        finishTrial(trial);
        setTrialIdx(idx + 1);
        scheduleNext(idx + 1);
      }, spec.fixationMs + trial.isiMs);
    },
    [finishTrial],
  );

  const showTapFeedback = useCallback((kind) => {
    if (tapFeedbackTimer.current) clearTimeout(tapFeedbackTimer.current);
    setTapFeedback(kind);
    tapFeedbackTimer.current = setTimeout(() => setTapFeedback(null), 320);
  }, []);

  const recordResponse = useCallback(() => {
    if (playStepRef.current !== 'running' || pauseRef.current) return;
    if (!currentTrialRef.current) return;

    if (!responseWindowRef.current) {
      resultsRef.current.push({
        earlyTap: true,
        isTarget: false,
        responded: true,
      });
      playSfx('error');
      showTapFeedback('miss');
      return;
    }

    if (respondedRef.current) return;
    respondedRef.current = true;
    rtRef.current = Math.max(0, Math.round(performance.now() - stimOnRef.current));
    const trial = currentTrialRef.current;
    if (trial?.isTarget) {
      playSfx('click');
      showTapFeedback('hit');
    } else {
      playSfx('error');
      showTapFeedback('miss');
    }
  }, [playSfx, showTapFeedback]);

  const handleTapPointerDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setTapPressed(true);
      recordResponse();
    },
    [recordResponse],
  );

  const handleTapPointerUp = useCallback((e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setTapPressed(false);
  }, []);

  const handleTapPointerCancel = useCallback((e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    setTapPressed(false);
  }, []);

  const finishBlock = useCallback(() => {
    if (blockEndedRef.current) return;
    blockEndedRef.current = true;
    clearTimers();
    stopSessionTimer();

    const block = blockRef.current;
    if (!block) {
      blockEndedRef.current = false;
      return;
    }

    const { spec } = block;
    const summary = summarizeVigil(resultsRef.current, spec);
    const grade = gradeBlock(summary, block.diff, {
      freeMode: block.mode === 'free',
    });

    if (block.mode === 'challenge') {
      const idx = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      const prevRow = base[idx];
      base[idx] = mergeVigilChallengeRow(prevRow, grade, summary, names[idx]);
      chalScoresRef.current = base;
      setChalScores(base);
      if (grade.won) playSfx('win');
      else playSfx('error');

      const nextIdx = idx + 1;
      if (nextIdx < names.length) {
        setChalIdx(nextIdx);
        setChalTurnOpen(true);
        setPhase('play');
        setPlayStep('idle');
        blockRef.current = null;
        blockEndedRef.current = false;
      } else {
        const cycle = chalCycleRef.current;
        const totalR = chalRoundsTotalRef.current;
        if (cycle + 1 < totalR) {
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
          blockEndedRef.current = false;
        } else {
          setLastResult({ type: 'challenge', rows: base });
          setPhase('chalRes');
          setPlayStep('idle');
          blockRef.current = null;
        }
      }
      return;
    }

    if (block.mode === 'free') {
      freeCommissionsRef.current += summary.commissions;
      setFreeCommDisplay(freeCommissionsRef.current);

      if (freeCommissionsRef.current >= VIGIL_FREE_MAX_COMMISSIONS) {
        playSfx('error');
        const blocksWon = freeBlocksWonRef.current;
        const runScore = freeScoreRef.current;
        setProfile((prev) => {
          let next = { ...prev };
          let changed = false;
          if (runScore > (prev.bestFree ?? 0)) {
            next = { ...next, bestFree: runScore };
            changed = true;
          }
          if (blocksWon > (prev.bestStages ?? 0)) {
            next = { ...next, bestStages: blocksWon };
            changed = true;
          }
          if (changed) saveVigilProfile(next);
          return changed ? next : prev;
        });
        sessionTimedOutRef.current = false;
        setLastResult({
          type: 'free',
          blocksWon,
          score: runScore,
          reason: 'commissions',
        });
        setPhase('freeRes');
        setPlayStep('idle');
        blockRef.current = null;
        return;
      }

      if (grade.won && !sessionTimedOutRef.current) {
        playSfx('win');
        const completed = block.freeStage ?? 0;
        freeStreakRef.current += 1;
        const clearPts = freeBlockClearPoints(spec, freeStreakRef.current);
        const hitPts = freeHitPoints(block.diff, completed);
        freeScoreRef.current += clearPts + hitPts;
        setFreeScore(freeScoreRef.current);

        const bonus = freeClearBonusSec(completed, spec.trialCount);
        tlRef.current = Math.min(VIGIL_FREE_SESSION_CAP_SEC, tlRef.current + bonus);
        tlimRef.current = Math.max(tlimRef.current, tlRef.current);
        setSessionSec(Math.ceil(tlRef.current));

        freeBlocksWonRef.current += 1;
        freeStageRef.current += 1;
        blockEndedRef.current = false;
        const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
        const nextBlock = prepareFreeBlock(freeStageRef.current, seed);
        blockRef.current = nextBlock;
        trialsRef.current = nextBlock.trials;
        resultsRef.current = [];
        setTrialIdx(0);
        setStimVisible(false);
        respondedRef.current = false;
        setPlayStep('briefing');
        setCdVal(3);
        return;
      }

      playSfx('error');
      const blocksWon = freeBlocksWonRef.current;
      const runScore = freeScoreRef.current;
      const reason = sessionTimedOutRef.current
        ? 'time'
        : 'threshold';
      setProfile((prev) => {
        let next = { ...prev };
        let changed = false;
        if (runScore > (prev.bestFree ?? 0)) {
          next = { ...next, bestFree: runScore };
          changed = true;
        }
        if (blocksWon > (prev.bestStages ?? 0)) {
          next = { ...next, bestStages: blocksWon };
          changed = true;
        }
        if (changed) saveVigilProfile(next);
        return changed ? next : prev;
      });
      sessionTimedOutRef.current = false;
      setLastResult({
        type: 'free',
        blocksWon,
        score: runScore,
        reason,
        lastSummary: summary,
        lastGrade: grade,
      });
      setPhase('freeRes');
      setPlayStep('idle');
      blockRef.current = null;
      return;
    }

    if (grade.won) playSfx('win');
    else playSfx('error');
    persistLevel(block, summary, grade);
    setLastResult({
      type: 'level',
      block,
      summary,
      grade,
    });
    setPhase('res');
    setPlayStep('idle');
    blockRef.current = null;
  }, [
    clearTimers,
    stopSessionTimer,
    persistLevel,
    playSfx,
    scheduleNext,
  ]);

  useEffect(() => {
    finishBlockRef.current = finishBlock;
  }, [finishBlock]);

  const startBlockAfterBriefing = useCallback(() => {
    if (!settings.countdown) {
      playStepRef.current = 'running';
      setPlayStep('running');
      scheduleNext(0);
      return;
    }
    playStepRef.current = 'countdown';
    setPlayStep('countdown');
    setCdVal(3);
  }, [scheduleNext, settings.countdown]);

  const confirmBriefing = useCallback(() => {
    playSfx('click');
    startBlockAfterBriefing();
  }, [playSfx, startBlockAfterBriefing]);

  const beginBlock = useCallback(
    (block) => {
      clearTimers();
      runIdRef.current += 1;
      blockRef.current = block;
      trialsRef.current = block.trials;
      resultsRef.current = [];
      blockEndedRef.current = false;
      setPhase('play');
      setPauseOpen(false);
      setQuitOpen(false);
      setTrialIdx(0);
      stimVisibleRef.current = false;
      setStimVisible(false);
      currentTrialRef.current = null;
      respondedRef.current = false;

      if (block.mode === 'free' && freeStageRef.current === 0 && freeBlocksWonRef.current === 0) {
        tlRef.current = VIGIL_FREE_SESSION_START_SEC;
        tlimRef.current = VIGIL_FREE_SESSION_START_SEC;
        setSessionSec(VIGIL_FREE_SESSION_START_SEC);
      }

      setPlayStep('briefing');
      setCdVal(3);
    },
    [clearTimers],
  );

  useEffect(() => {
    if (phase !== 'play' || playStep !== 'countdown') return undefined;
    if (cdVal <= 0) {
      playStepRef.current = 'running';
      setPlayStep('running');
      scheduleNext(0);
      return undefined;
    }
    const id = setTimeout(() => setCdVal((c) => c - 1), 700);
    return () => clearTimeout(id);
  }, [phase, playStep, cdVal, scheduleNext]);

  useEffect(() => {
    const block = blockRef.current;
    if (playStep !== 'running' || pauseOpen || block?.mode !== 'free') return undefined;

    let id;
    let last = performance.now();
    const runId = timerRunIdRef.current + 1;
    timerRunIdRef.current = runId;
    runRef.current = true;

    const loop = (ts) => {
      if (!runRef.current || pauseOpen || timerRunIdRef.current !== runId) return;
      const dt = (ts - last) / 1000;
      last = ts;
      tlRef.current = Math.max(0, tlRef.current - dt);
      setSessionSec(Math.ceil(tlRef.current));
      if (tlRef.current <= 0) {
        sessionTimedOutRef.current = true;
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
  }, [playStep, pauseOpen, phase]);

  const startFreeMode = useCallback(() => {
    freeStageRef.current = 0;
    freeBlocksWonRef.current = 0;
    freeCommissionsRef.current = 0;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    sessionTimedOutRef.current = false;
    setFreeScore(0);
    setFreeCommDisplay(0);
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

  const confirmQuit = () => {
    setQuitOpen(false);
    const mode = blockRef.current?.mode;
    clearPlayState();
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else if (mode === 'free') setPhase('hub');
    else setPhase('hub');
  };

  const block = blockRef.current;
  const trial = trialsRef.current[trialIdx];
  const total = block?.spec?.trialCount ?? trialsRef.current.length;

  const playHeader = () => {
    if (!block) return { title: t.title, subtitle: '' };
    if (block.mode === 'free') {
      return {
        title: t.freeHeader,
        subtitle: `${t.sessionTime(sessionSec)} · ${t.freeCommissions(freeCommDisplay, VIGIL_FREE_MAX_COMMISSIONS)} · ${t.freeLvlLabel(VIGIL_DM[block.diff]?.label ?? '', block.lv)}`,
      };
    }
    if (block.mode === 'challenge') {
      return {
        title: t.challengeHeader,
        subtitle:
          chalRoundsTotal > 1
            ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ${chalNames[chalIdx] ?? ''}`
            : chalNames[chalIdx] ?? '',
      };
    }
    const pct = Math.round((block.spec?.targetRate ?? 0) * 100);
    return {
      title: t.levelHeader(block.diff, block.lv),
      subtitle:
        playStep === 'running' && trial
          ? t.trial(trial.index, total)
          : t.levelPlaySub(block.spec?.trialCount ?? total, pct),
    };
  };

  const header = playHeader();
  const blockBriefing =
    block?.rule && block?.spec ? describeBriefing(block.rule, block.spec, isAr) : null;
  const hudRules = block?.rule ? hudRuleLines(block.rule, isAr) : null;
  const playHintText = block?.rule ? playHintForRule(block.rule, isAr) : t.playHint;
  const starLabel =
    lastResult?.grade?.stars === 3
      ? t.perfect
      : lastResult?.grade?.stars === 2
        ? t.good
        : t.tryLower;

  return (
    <div
      className="cancellation-task-game ct-vigil-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-vigil-shell">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              hubSpaced
              variant="paper"
              onReplayTutorial={replayTutorial}
              replayHint={t.replayTutorial}
              center={
                <div className="ct-fq-hub-attn-head ct-vigil-hub-head">
                  <div className="ct-fq-hub-attn-big">{t.hubSpeed}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTag}</div>
                </div>
              }
            />
            <VigilModes
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

      {phase === 'freeIntro' && (
        <div
          className="ct-fq-training-shell ct-fq-training-shell--hub-light"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'min(100vh, 100dvh)',
          }}
        >
          <div
            className="ct-fq-screen ct-fq-training-screen"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'min(100vh, 100dvh)',
              padding:
                'max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 'max(48px, env(safe-area-inset-top))',
                left: 0,
                right: 0,
                zIndex: 10,
              }}
            >
              <TrainingMenuBar
                variant="paper"
                playSfx={playSfx}
                onBack={() => setPhase('hub')}
                center={null}
              />
            </div>
            <div
              style={{
                fontFamily: isAr ? "'Cairo', sans-serif" : "'Fredoka One', cursive",
                fontSize: isAr ? 26 : 28,
                fontWeight: isAr ? 900 : 400,
                letterSpacing: isAr ? 0 : 1.5,
                marginBottom: 20,
                color: '#141210',
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
              style={{ width: '100%', maxWidth: 280, fontSize: 16, padding: '14px 24px' }}
              onClick={onFreeIntroReady}
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
              onBack={() => setPhase('hub')}
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
            {VIGIL_DIFF_KEYS.map((k) => {
              const m = VIGIL_DM[k];
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
                  <span className="ct-fq-dbg">{m.pop}</span>
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
                    {VIGIL_DM[diffKey].label}
                  </div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">
              {t.levelsSub(VIGIL_DM[diffKey].pop)}
            </p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: VIGIL_LEVELS_PER_TIER }, (_, i) => i + 1).map((lv) => {
                const un = isVigilLevelUnlocked(diffKey, lv, doneMap);
                const dn = !!doneMap[`${diffKey}-${lv}`];
                const spec = specificationForLevel(diffKey, lv);
                const pct = Math.round(spec.targetRate * 100);
                const cls = `ct-fq-lb ${un ? `ct-${VIGIL_DM[diffKey].lvc}` : 'ct-lvk'}`;
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
                      {un ? `${spec.trialCount}t · ${pct}% ■` : '🔒'}
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
                openChallenge();
              }}
            >
              {t.startCh}
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

      {phase === 'play' && block && (
        <div className="ct-vigil-play-wrap">
          <TrainingPlayHeader
            isAr={isAr}
            title={header.title}
            subtitle={header.subtitle}
            playSfx={playSfx}
            onMenu={() => setQuitOpen(true)}
            onPause={() => setPauseOpen(true)}
            pauseAriaLabel={t.paused}
          />
          {playStep !== 'running' && (
            <div className="ct-vigil-stimulus-panel" aria-live="polite">
              {playStep === 'briefing' && blockBriefing && (
                <div className="ct-vigil-briefing" role="region" aria-labelledby="vigil-brief-title">
                  <h2 id="vigil-brief-title" className="ct-vigil-briefing-title">
                    {blockBriefing.headline}
                  </h2>
                  <div className="ct-vigil-briefing-rule ct-vigil-briefing-rule--tap">
                    <p className="ct-vigil-briefing-line">{blockBriefing.tapLine}</p>
                    <VigilShapeRow shapes={blockBriefing.tapShapes} size="md" />
                  </div>
                  <div className="ct-vigil-briefing-rule ct-vigil-briefing-rule--avoid">
                    <p className="ct-vigil-briefing-line">{blockBriefing.avoidLine}</p>
                    <VigilShapeRow shapes={blockBriefing.avoidShapes} size="md" />
                  </div>
                  <p className="ct-vigil-briefing-meta">{blockBriefing.detailLine}</p>
                  <button
                    type="button"
                    className="ct-vigil-briefing-start"
                    onClick={confirmBriefing}
                  >
                    {blockBriefing.startLabel}
                  </button>
                </div>
              )}
              {playStep === 'countdown' && (
                <div className="ct-vigil-countdown">
                  <p className="ct-vigil-countdown-hint">{t.countdown}</p>
                  <div className="ct-vigil-countdown-n">{cdVal || 'Go!'}</div>
                </div>
              )}
              <div className="ct-vigil-stage">
              </div>
            </div>
          )}
          {playStep === 'running' && (
            <div
              className={`ct-vigil-stimulus-panel ct-vigil-stimulus-panel--play${
                tapPressed ? ' ct-vigil-stimulus-panel--active' : ''
              }${
                tapFeedback === 'hit'
                  ? ' ct-vigil-stimulus-panel--fb-hit'
                  : tapFeedback === 'miss'
                    ? ' ct-vigil-stimulus-panel--fb-miss'
                    : ''
              }`}
              aria-live="polite"
              role="button"
              tabIndex={0}
              aria-label={stimVisible && trial?.isTarget ? t.tapNow : t.tapPad}
              onPointerDown={handleTapPointerDown}
              onPointerUp={handleTapPointerUp}
              onPointerCancel={handleTapPointerCancel}
            >
              <p
                className={`ct-vigil-live-cue${
                  stimVisible && trial?.isTarget
                    ? ' ct-vigil-live-cue--go'
                    : stimVisible && trial
                      ? ' ct-vigil-live-cue--nogo'
                      : ''
                }`}
              >
                {stimVisible && trial && block?.rule
                  ? liveCueForTrial(block.rule, trial, isAr, t)
                  : t.cueWait}
              </p>
              <div className="ct-vigil-stage">
                {trial && (
                  <StimulusShape trial={trial} visible={stimVisible} />
                )}
                {!stimVisible && (
                  <div className="ct-vigil-fixation" aria-hidden="true" />
                )}
              </div>
              <p className="ct-vigil-tap-instruction">{playHintText}</p>
            </div>
          )}
          {tapFeedback && (
            <div
              className={`ct-vigil-screen-flash ct-vigil-screen-flash--${tapFeedback}`}
              aria-hidden="true"
            />
          )}
          <div className="ct-vigil-hud" data-fq-chrome>
            {hudRules && (
              <>
                <span className="ct-vigil-hud-rule">{hudRules.tapLine}</span>
                <span className="ct-vigil-hud-sep">·</span>
                <span className="ct-vigil-hud-rule">{hudRules.avoidLine}</span>
              </>
            )}
            {block.mode === 'free' && (
              <>
                <span className="ct-vigil-hud-sep">·</span>
                <span className="ct-vigil-hud-rule">{t.score}: {freeScore}</span>
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-vigil-shell">
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
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {lastResult.grade.won ? t.resultsLevelPass : t.resultsLevelRetry}
                  </div>
                </div>
              }
            />
            {lastResult.grade.won && (
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  color: '#e8ac4e',
                  marginTop: 8,
                  fontWeight: 700,
                }}
              >
                {'★'.repeat(lastResult.grade.stars)}{' '}
                <span style={{ fontSize: '0.85rem', color: '#5c534c' }}>{starLabel}</span>
              </div>
            )}
            <div className="ct-vigil-results-grid">
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">{lastResult.grade.vigilScore}</div>
                <div className="ct-vigil-stat-l">{t.vs}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">
                  {lastResult.grade.veValid && lastResult.grade.ve != null
                    ? lastResult.grade.ve
                    : t.veNA}
                </div>
                <div className="ct-vigil-stat-l">{t.ve}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">{lastResult.summary.hits}</div>
                <div className="ct-vigil-stat-l">{t.hits}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n ct-vigil-stat-n--warn">
                  {lastResult.summary.misses}
                </div>
                <div className="ct-vigil-stat-l">{t.misses}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n ct-vigil-stat-n--warn">
                  {lastResult.summary.commissions}
                </div>
                <div className="ct-vigil-stat-l">{t.commissions}</div>
              </div>
              <div className="ct-vigil-stat">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.correctRejections}
                </div>
                <div className="ct-vigil-stat-l">{t.correctReject}</div>
              </div>
              <div className="ct-vigil-stat ct-vigil-stat--wide">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.meanRt != null
                    ? `${lastResult.summary.meanRt} ${t.ms}`
                    : '—'}
                </div>
                <div className="ct-vigil-stat-l">{t.meanRt}</div>
              </div>
              <div className="ct-vigil-stat ct-vigil-stat--wide">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.omissionPct}%
                </div>
                <div className="ct-vigil-stat-l">{t.omissionRate}</div>
              </div>
              <div className="ct-vigil-stat ct-vigil-stat--wide">
                <div className="ct-vigil-stat-n">
                  {lastResult.summary.commissionPct}%
                </div>
                <div className="ct-vigil-stat-l">{t.commissionRate}</div>
              </div>
            </div>
            <div className="ct-fq-row">
              {lastResult.grade.won && lastResult.block.lv < VIGIL_LEVELS_PER_TIER && (
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
                  playSfx('click');
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
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-vigil-shell">
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
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {t.freeGameOver}
                  </div>
                </div>
              }
            />
            <div className="ct-fq-sbig">{lastResult.score ?? 0}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <div
              className="ct-fq-sub ct-fq-training-blurb"
              style={{ marginTop: 10, fontWeight: 700, fontSize: '0.92rem' }}
            >
              {t.freeStagesCleared(lastResult.blocksWon)}
            </div>
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>
              {t.freeBest(profile.bestStages ?? 0)} · {t.freeBestScore(profile.bestFree ?? 0)}
            </p>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
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
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {t.resultsChalTitle}
                  </div>
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
                    {t.chalResDetail(
                      row.rounds?.length || 1,
                      row.vigilScore,
                      row.commissions,
                      row.last?.hitRatePct ?? 0,
                      row.last?.veValid ? row.last.ve : null,
                    )}
                  </div>
                </div>
                <div className="ct-fq-lbsc">{row.vigilScore}</div>
              </div>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                clearPlayState();
                setPhase('chal');
                setChalSeed(null);
              }}
            >
              {t.newCh}
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
          if (playStep === 'running' && blockRef.current) {
            clearTimers();
            runIdRef.current += 1;
            scheduleNext(trialIdxRef.current);
          }
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
        <VigilTutorial
          kind={tutorialQueue[0].kind}
          isAr={isAr}
          onClose={advanceTutorial}
          playSfx={playSfx}
        />
      )}
    </div>
  );
}
