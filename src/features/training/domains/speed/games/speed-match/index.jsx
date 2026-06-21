import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid, TrainingModeList } from '../../../../shared/TrainingScreens';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { useCoach } from '../../../../shared/coach/useCoach';
import CoachOverlay from '../../../../shared/coach/CoachOverlay';
import { createTrialLog } from '../../../../shared/trialLog';
import { createStaircase } from '../../../../shared/staircase';
import { loadGameSettings } from '../../../../shared/focusQuestData';
import AssessmentReady from '../../../../assessment/AssessmentReady';
import { buildSpeedCoachSteps } from './tutorialScript';
import {
  SH,
  SM_DIFF_KEYS,
  SM_DM,
  SM_LEVELS_PER_TIER,
  SM_FREE_LIVES,
  specForLevel,
  buildLegend,
  pickItem,
  summarize,
  gradeBlock,
  isLevelUnlocked,
  prepareLevelBlock,
  prepareChallengeSeed,
  prepareChallengeBlock,
  freeLegendSize,
  freeItemMs,
  freeItemPoints,
  mulberry32,
} from './speedMatchData';

const PROFILE_KEY = 'mm_speedmatch_v1';
function loadProfile() {
  try {
    const j = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
    return { done: j.done || {}, bestFree: j.bestFree ?? 0, bestStreak: j.bestStreak ?? 0 };
  } catch {
    return { done: {}, bestFree: 0, bestStreak: 0 };
  }
}
function saveProfile(p) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const UI = {
  en: {
    hub: 'Speed Match',
    tag: 'training',
    title: 'Speed Match',
    replayTutorial: 'Replay tutorial',
    freeMode: 'Survival mode',
    levelMode: 'Level mode',
    challengeMode: 'Pass n Play',
    hubMapAria: 'Modes — choose a path',
    hubNodeFreeHint: 'Endless · 3 lives · speeds up',
    hubNodeLevelsHint: '100 levels per tier · unlock in order',
    hubNodeChallengeHint: 'Same key for all · pick a difficulty',
    freeIntroTitle: 'Survival mode',
    freeIntroBody:
      'Match the symbol to its number as fast as you can. The key grows and the clock per symbol shrinks as you go. You have 3 lives — a wrong tap or running out of time on a symbol costs one. The run ends only when your lives reach zero.',
    freeIntroReady: 'Ready',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Each tier has 100 levels. Unlock them in order.',
    diffDesc: {
      easy: 'Few symbols, gentle pace — learn the matching.',
      medium: 'More symbols, brisker — build speed.',
      hard: 'Up to 9 symbols, fast, and the key remaps.',
    },
    chalPickDiff: 'Difficulty',
    levelsSub: (pop) => `${pop} · ${SM_LEVELS_PER_TIER} levels`,
    challengeTitle: 'Pass n Play',
    challengeSub: 'Same key & symbols for everyone · pick a difficulty · pass the device',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Each player plays once per round · new fair key each round',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same key and symbol order for everyone this round',
    chalBulletPass: 'Tap Start only when the device is with this player',
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start',
    chalMeta: (label, sec) => `${label} · ${sec}s`,
    key: 'Key',
    tapNumber: 'Tap the number that matches the symbol',
    countdown: 'Get ready…',
    go: 'GO!',
    time: 'Time',
    correct: 'Correct',
    combo: 'Combo',
    lives: 'Lives',
    score: 'Score',
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart',
    quitMenu: 'Quit to menu',
    quitQ: 'Quit?',
    quitLose: 'This run will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    levelHeader: (diff, lv) => `${SM_DM[diff]?.label ?? diff} · L${lv}`,
    freeHeader: 'Survival mode',
    challengeHeader: 'Pass n Play',
    targetSub: (n) => `Reach ${n} correct`,
    resultsLevelPass: 'Level passed',
    resultsLevelRetry: 'Try again',
    stars: 'Stars',
    speedScore: 'Speed score',
    ipm: 'Matches / min',
    accuracy: 'Accuracy',
    meanRt: 'Avg match time',
    ms: 'ms',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    freeGameOver: 'Run ended',
    freeCorrect: (n) => `Matches: ${n}`,
    freeBest: (n) => `Best score: ${n}`,
    freePlayAgain: 'Play again',
    resultsChalTitle: 'Pass n Play results',
    chalResDetail: (nr, c, acc, rt) =>
      nr > 1
        ? `${nr}× · ${c} correct avg · ${acc}% · ${rt ?? '—'}ms`
        : `${c} correct · ${acc}% · ${rt ?? '—'}ms`,
    newCh: 'New game',
    perfect: 'Lightning fast!',
    good: 'Quick work',
    tryAgain: 'Keep practicing',
    assessPractice: 'Practice',
    assessPracticeSub: 'Warm-up — get 4 right to begin',
    assessMotor: 'Motor speed',
    assessMotorSub: 'Tap the number you SEE — 25s',
    assessMain: 'Speed Match',
    assessMainSub: '90 seconds — match as many as you can',
    motor: 'motor',
  },
  ar: {
    hub: 'مطابقة سريعة',
    tag: 'تدريب',
    title: 'مطابقة سريعة',
    replayTutorial: 'إعادة الشرح',
    freeMode: 'وضع البقاء',
    levelMode: 'وضع المستويات',
    challengeMode: 'مرّر والعب',
    hubMapAria: 'الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'لا ينتهي · ٣ أرواح · يتسارع',
    hubNodeLevelsHint: '١٠٠ مستوى لكل صعوبة · بالترتيب',
    hubNodeChallengeHint: 'نفس المفتاح للجميع · اختر الصعوبة',
    freeIntroTitle: 'وضع البقاء',
    freeIntroBody:
      'طابق الرمز مع رقمه بأسرع ما يمكن. يكبر المفتاح ويقصر وقت كل رمز كلما تقدمت. لديك ٣ أرواح — النقر الخاطئ أو نفاد وقت الرمز يكلّفك روحاً. تنتهي المحاولة فقط عند نفاد الأرواح.',
    freeIntroReady: 'جاهز',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'كل صعوبة تحتوي ١٠٠ مستوى. افتحها بالترتيب.',
    diffDesc: {
      easy: 'رموز قليلة وإيقاع هادئ — تعلّم المطابقة.',
      medium: 'رموز أكثر وأسرع — ابنِ سرعتك.',
      hard: 'حتى ٩ رموز وسريع والمفتاح يتغيّر.',
    },
    chalPickDiff: 'الصعوبة',
    levelsSub: (pop) => `${pop} · ${SM_LEVELS_PER_TIER} مستوى`,
    challengeTitle: 'مرّر والعب',
    challengeSub: 'نفس المفتاح والرموز للجميع · اختر الصعوبة · مرّر الجهاز',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · مفتاح عادل جديد كل جولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس المفتاح وترتيب الرموز للجميع في هذه الجولة',
    chalBulletPass: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ',
    chalMeta: (label, sec) => `${label} · ${sec}ث`,
    key: 'المفتاح',
    tapNumber: 'اضغط الرقم المطابق للرمز',
    countdown: 'استعد…',
    go: 'انطلق!',
    time: 'الوقت',
    correct: 'صحيح',
    combo: 'تتابع',
    lives: 'الأرواح',
    score: 'نقاط',
    paused: 'متوقف',
    resume: 'متابعة',
    restart: 'إعادة',
    quitMenu: 'الخروج للقائمة',
    quitQ: 'خروج؟',
    quitLose: 'سيُلغى هذا السجل.',
    yesQuit: 'نعم، خروج',
    keep: 'متابعة اللعب',
    levelHeader: (diff, lv) => `${SM_DM[diff]?.label ?? diff} · ${lv}`,
    freeHeader: 'وضع البقاء',
    challengeHeader: 'مرّر والعب',
    targetSub: (n) => `اجمع ${n} صحيحة`,
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetry: 'حاول مجددًا',
    stars: 'نجوم',
    speedScore: 'درجة السرعة',
    ipm: 'مطابقات / دقيقة',
    accuracy: 'الدقة',
    meanRt: 'متوسط زمن المطابقة',
    ms: 'ملث',
    nextLv: 'المستوى التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    freeGameOver: 'انتهت المحاولة',
    freeCorrect: (n) => `مطابقات: ${n}`,
    freeBest: (n) => `أفضل نقاط: ${n}`,
    freePlayAgain: 'العب مجددًا',
    resultsChalTitle: 'نتائج مرّر والعب',
    chalResDetail: (nr, c, acc, rt) =>
      nr > 1
        ? `${nr}× · ${c} صحيحة بالمتوسط · ${acc}% · ${rt ?? '—'}ملث`
        : `${c} صحيحة · ${acc}% · ${rt ?? '—'}ملث`,
    newCh: 'لعبة جديدة',
    perfect: 'سرعة البرق!',
    good: 'عمل سريع',
    tryAgain: 'واصل التدريب',
    assessPractice: 'تجربة',
    assessPracticeSub: 'إحماء — أصب ٤ للبدء',
    assessMotor: 'سرعة الحركة',
    assessMotorSub: 'اضغط الرقم الذي تراه — ٢٥ث',
    assessMain: 'مطابقة سريعة',
    assessMainSub: '٩٠ ثانية — طابق أكبر عدد ممكن',
    motor: 'حركي',
  },
};

/** Crisp SVG glyph from the shared SH set. */
function SmSymbol({ shape, size = 48, color = '#2d2d2d' }) {
  const inner = SH[shape] || SH.circle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ color, display: 'block' }}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

function LegendBar({ legend, t }) {
  return (
    <div className="ct-sm-legend" aria-label={t.key}>
      {legend.map((p) => (
        <div className="ct-sm-legend-pair" key={p.digit}>
          <SmSymbol shape={p.symbol} size={26} />
          <span className="ct-sm-legend-digit">{p.digit}</span>
        </div>
      ))}
    </div>
  );
}

/** Light hub mode list (shared visual with the other games). */
function SpeedModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree, mod: 'ct-fq-attn-mode--free' },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels, mod: 'ct-fq-attn-mode--levels' },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge, mod: 'ct-fq-attn-mode--chal' },
  ];
  return <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />;
}

export default function SpeedMatchGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep }) {
  const { playSfx, currentLang, awardTrainingWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  // WORKOUT MODE: launched from the Daily Workout — skip the hub and jump
  // straight into free play; the workout shell owns timing and exit.
  const workoutLaunched = useRef(false);
  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) { workoutLaunched.current = true; startFreeMode(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode]);
  const settings = loadGameSettings();

  const juice = useJuice();
  const rLabels = ratingLabels(isAr);
  const legendRef = useRef(null);
  const cardRef = useRef(null);
  const padRef = useRef(null);
  const [coachActive, setCoachActive] = useState(false);
  const pendingAfterCoachRef = useRef(null);
  const coachRef = useRef(null);
  const tutScriptRef = useRef(0);
  const tutorialData = useMemo(() => {
    const lg = buildLegend(3, mulberry32(7));
    return { legend: lg, items: [lg[1] || lg[0], lg[2] || lg[0]] };
  }, []);

  const [profile, setProfile] = useState(() => loadProfile());
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');

  const [playStep, setPlayStep] = useState('idle');
  const [cdVal, setCdVal] = useState(3);
  const [legend, setLegend] = useState([]);
  const [item, setItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  // Live display values (repainted from the loop / answer handler).
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(SM_FREE_LIVES);
  const [, setTick] = useState(0);

  // Challenge / pass-n-play
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('hard');
  const chalDiffRef = useRef('hard');
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);

  const blockRef = useRef(null);
  const rngRef = useRef(Math.random);
  const eventsRef = useRef([]);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const comboRef = useRef(0);
  const scoreRef = useRef(0);
  const livesRef = useRef(SM_FREE_LIVES);
  const lastDigitRef = useRef(0);
  const itemRef = useRef(null);
  const answeredRef = useRef(false);
  const blockEndAtRef = useRef(0);
  const itemStartRef = useRef(0);
  const itemEndAtRef = useRef(Infinity);
  const itemMsRef = useRef(2600);
  const rafRef = useRef(0);
  const runIdRef = useRef(0);
  const endedRef = useRef(false);
  const trialLogRef = useRef(null);
  const staircaseRef = useRef(null);
  const assessMotorRef = useRef(null);
  const beginMotorBlockRef = useRef(() => {});
  const beginMainAssessRef = useRef(() => {});
  const playStepRef = useRef('idle');
  const pauseRef = useRef(false);
  const fbTimerRef = useRef(0);

  const doneMap = profile.done || {};

  const finishBlockRef = useRef(() => {});
  const nextItemRef = useRef(() => {});

  useEffect(() => { playStepRef.current = playStep; }, [playStep]);
  useEffect(() => { pauseRef.current = pauseOpen; }, [pauseOpen]);
  useEffect(() => { chalIdxRef.current = chalIdx; }, [chalIdx]);
  useEffect(() => { chalNamesRef.current = chalNames; }, [chalNames]);

  const stopLoop = useCallback(() => {
    runIdRef.current += 1;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const clearPlay = useCallback(() => {
    stopLoop();
    if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
    blockRef.current = null;
    endedRef.current = false;
    setPlayStep('idle');
    playStepRef.current = 'idle';
    setPauseOpen(false);
    setQuitOpen(false);
    setItem(null);
    setFeedback(null);
    setChalTurnOpen(false);
  }, [stopLoop]);

  useEffect(() => () => {
    stopLoop();
    if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
    trialLogRef.current?.discard();
  }, [stopLoop]);

  const flash = useCallback((kind) => {
    if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
    setFeedback(kind);
    fbTimerRef.current = setTimeout(() => setFeedback(null), 260);
  }, []);

  const nextItem = useCallback((now) => {
    const block = blockRef.current;
    if (!block) return;
    if (block.mode === 'free') {
      // Staircase level → the same ramp curves, via virtual progress (×2 so
      // perfect play climbs at the old pace; failures now ease difficulty).
      const v = (staircaseRef.current?.level ?? 0) * 2;
      const size = freeLegendSize(v);
      if (block.legend.length !== size) {
        block.legend = buildLegend(size);
        setLegend(block.legend);
      }
      itemMsRef.current = freeItemMs(v);
      itemEndAtRef.current = now + itemMsRef.current;
    } else {
      const remap = block.spec.remapEvery;
      if (remap > 0 && correctRef.current > 0 && correctRef.current % remap === 0) {
        block.legend = buildLegend(block.spec.pairCount, rngRef.current);
        setLegend(block.legend);
      }
      itemEndAtRef.current = Infinity;
    }
    const it = pickItem(block.legend, rngRef.current, lastDigitRef.current);
    lastDigitRef.current = it?.digit ?? 0;
    itemRef.current = it;
    answeredRef.current = false;
    itemStartRef.current = now;
    setItem(it);
  }, []);
  useEffect(() => { nextItemRef.current = nextItem; }, [nextItem]);

  const persistLevelDone = useCallback((diff, lv) => {
    setProfile((prev) => {
      const next = { ...prev, done: { ...prev.done, [`${diff}-${lv}`]: true } };
      saveProfile(next);
      return next;
    });
  }, []);

  const finishBlock = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    const block = blockRef.current;
    if (!block) { endedRef.current = false; return; }
    const summary = summarize(eventsRef.current, block.spec.durationSec);
    const grade = gradeBlock(summary, block.spec, { freeMode: false });

    if (assessmentMode) {
      const stage = block.assessStage || 'main';
      if (stage === 'practice') {
        // Practice timer lapsed without 4 correct — proceed anyway.
        trialLogRef.current?.discard();
        trialLogRef.current = null;
        beginMotorBlockRef.current();
        return;
      }
      if (stage === 'motor') {
        trialLogRef.current?.discard();
        trialLogRef.current = null;
        assessMotorRef.current = summary;
        playSfx('win');
        beginMainAssessRef.current();
        return;
      }
      // Main 90s block: score the cognitive component. The motor ratio
      // (substitution rate / pure tapping rate) isolates lookup speed from
      // finger speed — the reason clinical DSST runs a copy condition.
      const motorIpm = assessMotorRef.current?.itemsPerMin || null;
      const ratio = motorIpm ? Math.min(1, summary.itemsPerMin / motorIpm) : null;
      const speed = Math.min(1, summary.itemsPerMin / 46);
      const score = Math.round(100 * (ratio != null
        ? 0.55 * speed + 0.15 * Math.min(1, ratio / 0.6) + 0.3 * summary.accuracy
        : 0.7 * speed + 0.3 * summary.accuracy));
      trialLogRef.current?.finish({
        score,
        motorIpm,
        ipm: summary.itemsPerMin,
        acc: summary.accuracyPct,
      });
      trialLogRef.current = null;
      playSfx('win');
      const line = `${summary.itemsPerMin}/min · ${summary.accuracyPct}%${motorIpm ? ` · ${t.motor} ${motorIpm}/min` : ''}`;
      blockRef.current = null;
      onAssessmentComplete?.({ score, line });
      return;
    }

    trialLogRef.current?.finish({ score: grade.score, won: grade.won });
    trialLogRef.current = null;

    if (block.mode === 'challenge') {
      const idx = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      const snap = { correct: summary.correct, accuracyPct: summary.accuracyPct, meanRt: summary.meanRt, score: grade.score };
      const prev = base[idx];
      const rounds = [...(prev?.rounds || []), snap];
      const avgCorrect = Math.round(rounds.reduce((s, r) => s + r.correct, 0) / rounds.length);
      base[idx] = { nm: names[idx], rounds, correct: avgCorrect, last: snap };
      chalScoresRef.current = base;
      setChalScores(base);
      playSfx('win');
      const nextIdx = idx + 1;
      if (nextIdx < names.length) {
        setChalIdx(nextIdx);
        setChalTurnOpen(true);
        setPhase('play');
        setPlayStep('idle');
        blockRef.current = null;
        endedRef.current = false;
      } else {
        const cycle = chalCycleRef.current;
        if (cycle + 1 < chalRoundsTotalRef.current) {
          chalCycleRef.current = cycle + 1;
          setChalRoundIdx(chalCycleRef.current);
          setChalSeed(prepareChallengeSeed(chalDiffRef.current));
          setChalIdx(0);
          chalIdxRef.current = 0;
          setChalTurnOpen(true);
          setPhase('play');
          setPlayStep('idle');
          blockRef.current = null;
          endedRef.current = false;
        } else {
          setLastResult({ type: 'challenge', rows: base });
          setPhase('chalRes');
          setPlayStep('idle');
          blockRef.current = null;
        }
      }
      return;
    }

    // level
    if (grade.won) { playSfx('win'); persistLevelDone(block.diff, block.lv); awardTrainingWin('speed', block.diff, block.lv, SM_LEVELS_PER_TIER); }
    else playSfx('error');
    setLastResult({ type: 'level', block, summary, grade });
    setPhase('res');
    setPlayStep('idle');
    blockRef.current = null;
  }, [stopLoop, playSfx, persistLevelDone, assessmentMode, onAssessmentComplete, t.motor]);
  useEffect(() => { finishBlockRef.current = finishBlock; }, [finishBlock]);

  const finishFreeRun = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    playSfx('error');
    const runScore = scoreRef.current;
    const c = correctRef.current;
    setProfile((prev) => {
      let next = { ...prev };
      let changed = false;
      if (runScore > (prev.bestFree ?? 0)) { next = { ...next, bestFree: runScore }; changed = true; }
      if (c > (prev.bestStreak ?? 0)) { next = { ...next, bestStreak: c }; changed = true; }
      if (changed) saveProfile(next);
      return changed ? next : prev;
    });
    trialLogRef.current?.finish({ correct: c, score: runScore, level: Math.floor(c / 5) });
    trialLogRef.current = null;
    awardFreeRun('speed', Math.floor(c / 5));
    setLastResult({ type: 'free', score: runScore, correct: c });
    setPhase('freeRes');
    setPlayStep('idle');
    blockRef.current = null;
  }, [stopLoop, playSfx]);

  const startLoop = useCallback(() => {
    stopLoop();
    const myRun = runIdRef.current;
    let last = performance.now();
    const loop = (ts) => {
      if (runIdRef.current !== myRun) return;
      if (pauseRef.current) { rafRef.current = requestAnimationFrame(loop); last = ts; return; }
      const block = blockRef.current;
      if (!block) return;
      last = ts;
      if (block.mode === 'free') {
        if (ts >= itemEndAtRef.current) {
          // Item timed out → miss → lose a life.
          eventsRef.current.push({ correct: false, rtMs: null });
          trialLogRef.current?.trial({ ok: false, timeout: true, key: block.legend.length });
          staircaseRef.current?.failure();
          wrongRef.current += 1;
          comboRef.current = 0;
          setCombo(0);
          flash('miss');
          livesRef.current = Math.max(0, livesRef.current - 1);
          setLives(livesRef.current);
          if (livesRef.current <= 0) { finishFreeRun(); return; }
          nextItemRef.current(ts);
        }
      } else if (ts >= blockEndAtRef.current) {
        finishBlockRef.current();
        return;
      }
      setTick((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop, flash, finishFreeRun]);

  const answer = useCallback((digit) => {
    if (playStepRef.current !== 'running' || pauseRef.current) return;
    const block = blockRef.current;
    const it = itemRef.current;
    if (!block || !it) return;

    // Coached tutorial: gate on the correct digit, let the player retry, no scoring.
    if (block.mode === 'tutorial') {
      const ok = digit === it.digit;
      setPressedKey(digit);
      setTimeout(() => setPressedKey(null), 120);
      if (ok) {
        playSfx('click');
        juice.hit({});
        flash('hit');
        coachRef.current?.notify('answer', { digit });
        const nextIdx = tutScriptRef.current + 1;
        tutScriptRef.current = nextIdx;
        const nx = tutorialData.items[nextIdx];
        if (nx) {
          itemRef.current = nx;
          setItem(nx);
        }
      } else {
        playSfx('error');
        juice.miss();
        flash('miss');
      }
      return;
    }

    if (answeredRef.current) return;
    answeredRef.current = true;
    const now = performance.now();
    const rt = Math.round(now - itemStartRef.current);
    const isRight = digit === it.digit;
    eventsRef.current.push({ correct: isRight, rtMs: isRight ? rt : null });
    trialLogRef.current?.trial({ rt, ok: isRight, key: block.legend.length });
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 120);
    if (isRight) {
      playSfx('click');
      juice.hit({ rtMs: rt, limitMs: block.mode === 'free' ? itemMsRef.current : 1600 });
      correctRef.current += 1;
      comboRef.current += 1;
      setCorrect(correctRef.current);
      setCombo(comboRef.current);
      if (block.mode === 'free') {
        staircaseRef.current?.success();
        scoreRef.current += freeItemPoints(comboRef.current);
        setScore(scoreRef.current);
      }
      // Assessment practice ends once the player shows they get it (4 correct).
      if (block.assessStage === 'practice' && correctRef.current >= 4) {
        playSfx('win');
        beginMotorBlockRef.current();
        return;
      }
      flash('hit');
      nextItemRef.current(now);
    } else {
      playSfx('error');
      juice.miss();
      wrongRef.current += 1;
      comboRef.current = 0;
      setCombo(0);
      flash('miss');
      if (block.mode === 'free') {
        staircaseRef.current?.failure();
        livesRef.current = Math.max(0, livesRef.current - 1);
        setLives(livesRef.current);
        if (livesRef.current <= 0) { finishFreeRun(); return; }
      }
      nextItemRef.current(now);
    }
  }, [playSfx, flash, finishFreeRun, juice, tutorialData]);

  // Countdown → running.
  useEffect(() => {
    if (phase !== 'play' || playStep !== 'countdown') return undefined;
    if (cdVal <= 0) {
      const now = performance.now();
      const block = blockRef.current;
      if (block && block.mode !== 'free') {
        blockEndAtRef.current = now + block.spec.durationSec * 1000;
      }
      setPlayStep('running');
      playStepRef.current = 'running';
      nextItemRef.current(now);
      startLoop();
      return undefined;
    }
    const id = setTimeout(() => setCdVal((c) => c - 1), 650);
    return () => clearTimeout(id);
  }, [phase, playStep, cdVal, startLoop]);

  const beginBlock = useCallback((block, rng) => {
    stopLoop();
    runIdRef.current += 1;
    // Per-trial science log — free / level / assessment runs only (challenge
    // is hot-seat party play; tutorial never reaches beginBlock).
    trialLogRef.current?.discard();
    trialLogRef.current = block.mode === 'free' || block.mode === 'level'
      ? createTrialLog({
          game: 'speed-match',
          mode: assessmentMode ? 'assess' : block.mode,
          meta: block.mode === 'level' ? { diff: block.diff, lv: block.lv } : undefined,
        })
      : null;
    blockRef.current = block;
    rngRef.current = rng || Math.random;
    eventsRef.current = [];
    correctRef.current = 0;
    wrongRef.current = 0;
    comboRef.current = 0;
    scoreRef.current = 0;
    lastDigitRef.current = 0;
    endedRef.current = false;
    juice.reset();
    setLegend(block.legend);
    setItem(null);
    setScore(0);
    setCombo(0);
    setCorrect(0);
    setFeedback(null);
    setPhase('play');
    setPauseOpen(false);
    setQuitOpen(false);
    setCdVal(3);
    setPlayStep('countdown');
  }, [stopLoop, assessmentMode]);

  const startFreeMode = useCallback(() => {
    livesRef.current = SM_FREE_LIVES;
    setLives(SM_FREE_LIVES);
    staircaseRef.current = createStaircase({ nDown: 2 });
    const block = { mode: 'free', diff: 'free', lv: 0, spec: { durationSec: 0, remapEvery: 0, pairCount: 4 }, legend: buildLegend(4) };
    beginBlock(block, Math.random);
  }, [beginBlock]);

  const startLevel = useCallback((diff, lv) => {
    beginBlock(prepareLevelBlock(diff, lv), Math.random);
  }, [beginBlock]);

  /* --- Standardized assessment: practice → motor baseline → 90s DSST ------
   * Follows the clinical DSST protocol: a short unscored practice (first-
   * exposure noise), a copy-only motor block (tap the digit you SEE — no
   * symbol lookup) so pure finger speed can be separated out, then the
   * fixed 90-second substitution block that is actually scored. */
  const beginMotorBlock = useCallback(() => {
    const spec = { diff: 'medium', lv: 0, pairCount: 6, durationSec: 25, targetCorrect: 999, minAcc: 0, remapEvery: 0, itemMs: 0 };
    const legend = Array.from({ length: 6 }, (_, i) => ({ digit: i + 1, symbol: null }));
    beginBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend, assessStage: 'motor' }, Math.random);
  }, [beginBlock]);
  useEffect(() => { beginMotorBlockRef.current = beginMotorBlock; }, [beginMotorBlock]);

  const beginMainAssess = useCallback(() => {
    const spec = { diff: 'medium', lv: 0, pairCount: 6, durationSec: 90, targetCorrect: 999, minAcc: 0.8, remapEvery: 0, itemMs: 0 };
    beginBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend: buildLegend(6), assessStage: 'main' }, Math.random);
  }, [beginBlock]);
  useEffect(() => { beginMainAssessRef.current = beginMainAssess; }, [beginMainAssess]);

  const startAssessment = useCallback(() => {
    assessMotorRef.current = null;
    const spec = { diff: 'medium', lv: 0, pairCount: 4, durationSec: 60, targetCorrect: 4, minAcc: 0, remapEvery: 0, itemMs: 0 };
    beginBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend: buildLegend(4), assessStage: 'practice' }, Math.random);
  }, [beginBlock]);

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) { window.alert(t.needTwo); return; }
    clearPlay();
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalDiffRef.current = chalDiff;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    setChalSeed(prepareChallengeSeed(chalDiffRef.current));
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
    beginBlock(prepareChallengeBlock(chalSeed), mulberry32(chalSeed.seed));
    playSfx('click');
  };

  const onPause = () => {
    if (playStepRef.current !== 'running') return;
    // Halt the loop synchronously BEFORE rewriting deadlines, so a stray frame
    // can't read a "remaining" value as an absolute time and misfire.
    pauseRef.current = true;
    const now = performance.now();
    if (blockRef.current) blockRef.current.__blockRem = blockEndAtRef.current - now;
    itemEndAtRef.current = itemEndAtRef.current === Infinity ? Infinity : itemEndAtRef.current - now;
    setPauseOpen(true);
  };
  const onResume = () => {
    const now = performance.now();
    if (blockRef.current && blockRef.current.__blockRem != null) {
      blockEndAtRef.current = now + blockRef.current.__blockRem;
      blockRef.current.__blockRem = null;
    }
    itemEndAtRef.current = itemEndAtRef.current === Infinity ? Infinity : now + itemEndAtRef.current;
    itemStartRef.current = now;
    pauseRef.current = false;
    setPauseOpen(false);
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    const mode = blockRef.current?.mode;
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlay();
    if (assessmentMode) { (onAssessmentExit || onBack)?.(); return; }
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else setPhase('hub');
  };

  /* --- Coached interactive tutorial --- */
  const beginTutorial = useCallback(() => {
    stopLoop();
    runIdRef.current += 1;
    tutScriptRef.current = 0;
    blockRef.current = {
      mode: 'tutorial',
      diff: 'tutorial',
      lv: 0,
      spec: { durationSec: 0, remapEvery: 0, pairCount: 3 },
      legend: tutorialData.legend,
    };
    eventsRef.current = [];
    endedRef.current = false;
    answeredRef.current = false;
    juice.reset();
    setLegend(tutorialData.legend);
    itemRef.current = tutorialData.items[0];
    setItem(tutorialData.items[0]);
    setFeedback(null);
    setPauseOpen(false);
    setQuitOpen(false);
    setPhase('play');
    setPlayStep('running');
    playStepRef.current = 'running';
  }, [stopLoop, tutorialData, juice]);

  const finishCoach = useCallback(() => {
    try {
      localStorage.setItem('mm_speedmatch_coach_seen', '1');
    } catch {
      /* ignore */
    }
    setCoachActive(false);
    clearPlay();
    const fn = pendingAfterCoachRef.current;
    pendingAfterCoachRef.current = null;
    if (fn) fn();
    else setPhase('hub');
  }, [clearPlay]);

  const coachSteps = useMemo(
    () =>
      buildSpeedCoachSteps(
        isAr,
        { legendRef, cardRef, padRef },
        [tutorialData.items[0]?.digit, tutorialData.items[1]?.digit],
      ),
    [isAr, tutorialData],
  );
  const coach = useCoach(coachSteps, { active: coachActive, onDone: finishCoach });
  useEffect(() => {
    coachRef.current = coach;
  }, [coach]);

  const startCoach = useCallback(
    (thenFn) => {
      pendingAfterCoachRef.current = thenFn || null;
      setCoachActive(true);
      beginTutorial();
    },
    [beginTutorial],
  );
  const maybeCoach = useCallback(
    (fn) => {
      let seen = false;
      try {
        seen = !!localStorage.getItem('mm_speedmatch_coach_seen');
      } catch {
        /* ignore */
      }
      if (seen) fn();
      else startCoach(fn);
    },
    [startCoach],
  );
  const replayTutorial = useCallback(() => startCoach(null), [startCoach]);

  const block = blockRef.current;
  const survivalRemaining = useSurvivalCountdown(phase === 'play' && block?.mode === 'free', finishFreeRun);
  const now = performance.now();
  const blockTimeLeft = block && block.mode !== 'free' && playStep === 'running'
    ? Math.max(0, Math.ceil((blockEndAtRef.current - now) / 1000))
    : block && block.mode !== 'free' ? block.spec.durationSec : 0;
  const itemPct = block?.mode === 'free' && playStep === 'running' && itemEndAtRef.current !== Infinity
    ? Math.max(0, Math.min(1, (itemEndAtRef.current - now) / (itemMsRef.current || 1)))
    : 1;

  const header = (() => {
    if (!block) return { title: t.title, subtitle: '' };
    if (block.assessStage === 'practice') return { title: t.assessPractice, subtitle: t.assessPracticeSub };
    if (block.assessStage === 'motor') return { title: t.assessMotor, subtitle: t.assessMotorSub };
    if (block.assessStage === 'main') return { title: t.assessMain, subtitle: t.assessMainSub };
    if (block.mode === 'free') return { title: t.freeHeader, subtitle: '' };
    if (block.mode === 'challenge') {
      return {
        title: t.challengeHeader,
        subtitle: chalRoundsTotal > 1 ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ${chalNames[chalIdx] ?? ''}` : (chalNames[chalIdx] ?? ''),
      };
    }
    return { title: t.levelHeader(block.diff, block.lv), subtitle: t.targetSub(block.spec.targetCorrect) };
  })();

  const starLabel = lastResult?.grade?.stars === 3 ? t.perfect : lastResult?.grade?.stars === 2 ? t.good : t.tryAgain;

  return (
    <div className="cancellation-task-game ct-sm-root" dir={isAr ? 'rtl' : 'ltr'}>
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
              hubSpaced
              variant="paper"
              onReplayTutorial={replayTutorial}
              replayHint={t.replayTutorial}
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big">{t.hub}</div>
                  <div className="ct-fq-hub-attn-sub">{t.tag}</div>
                </div>
              }
            />
            <SpeedModes
              t={t}
              isAr={isAr}
              playSfx={playSfx}
              onFree={() => maybeCoach(startFreeMode)}
              onLevels={() => maybeCoach(() => setPhase('diff'))}
              onChallenge={() => maybeCoach(() => setPhase('chal'))}
            />
          </div>
        </div>
      )}

      {phase === 'freeIntro' && null}

      {phase === 'diff' && (
        <TrainingDifficultySelect
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => setPhase('hub')}
          title={t.pickDiff}
          blurb={t.pickDiffSub}
          diffKeys={SM_DIFF_KEYS}
          dm={SM_DM}
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
          title={SM_DM[diffKey].label}
          blurb={t.levelsSub(SM_DM[diffKey].pop)}
          count={SM_LEVELS_PER_TIER}
          lvc={SM_DM[diffKey].lvc}
          isUnlocked={(lv) => isLevelUnlocked(diffKey, lv, doneMap)}
          isDone={(lv) => !!doneMap[`${diffKey}-${lv}`]}
          sublabel={(lv) => {
            const spec = specForLevel(diffKey, lv);
            return `${spec.pairCount}◆·${spec.targetCorrect}`;
          }}
          onPick={(lv) => startLevel(diffKey, lv)}
        />
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => { clearPlay(); setPhase('hub'); }}
              playSfx={playSfx}
              variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div></div>}
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.chalPickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.chalPickDiff}>
                {SM_DIFF_KEYS.map((k) => (
                  <button key={k} type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalDiff(k); }}>
                    {SM_DM[k].label}
                  </button>
                ))}
              </div>
              <h3 style={{ marginTop: 14 }}>{t.players}</h3>
              {chalNames.map((nm, i) => (
                <div key={i} className="ct-fq-pr">
                  <input value={nm} maxLength={20} onChange={(e) => { const n = [...chalNames]; n[i] = e.target.value; setChalNames(n); }} />
                  {chalNames.length > 2 && (
                    <button type="button" className="ct-fq-prm" onClick={() => setChalNames(chalNames.filter((_, j) => j !== i))}>×</button>
                  )}
                </div>
              ))}
              {chalNames.length < 10 && (
                <button type="button" className="ct-fq-apb ct-fq-apb-training" onClick={() => setChalNames([...chalNames, `Player ${chalNames.length + 1}`])}>{t.addPl}</button>
              )}
              <h3 style={{ marginTop: 14 }}>{t.chalRounds}</h3>
              <p className="ct-fq-sub" style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}>{t.chalRoundsHint}</p>
              <div className="ct-fq-rr" role="group" aria-label={t.chalRounds}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button"
                    className={`ct-fq-rrb${chalRoundsTotal === n ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalRoundsTotal(n); }}>{n}</button>
                ))}
              </div>
            </div>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); openChallenge(); }}>{t.startCh}</button>
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={t.chalMeta(SM_DM[chalDiff]?.label ?? '', chalSeed?.spec?.durationSec ?? 45)}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeBlock}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && block && (
        <div className="ct-sm-play">
          <TrainingPlayHeader
            isAr={isAr}
            title={block.mode === 'tutorial' ? (isAr ? 'كيفية اللعب' : 'How to play') : header.title}
            subtitle={block.mode === 'tutorial' ? '' : header.subtitle}
            playSfx={playSfx}
            onMenu={block.mode === 'tutorial' ? () => coach.skip() : () => setQuitOpen(true)}
            onPause={block.mode === 'tutorial' ? undefined : onPause}
            pauseAriaLabel={t.paused}
          />
          {block.mode === 'free' && <SurvivalCountdownBar remaining={survivalRemaining} color="#64b5c2" />}
          <div className={`ct-sm-stage ct-juice-host${feedback === 'hit' ? ' ct-sm-stage--hit' : feedback === 'miss' ? ' ct-sm-stage--miss' : ''}${juice.shake ? ' ct-juice-shake' : ''}`}>
            <JuiceLayer
              combo={juice.combo}
              particle={juice.particle}
              rtFx={juice.rtFx}
              toast={juice.toast}
              burst={juice.burst}
              ratingLabels={rLabels}
              showCombo={false}
            />
            {block.assessStage !== 'motor' && (
              <div className="ct-sm-legend-wrap" data-fq-chrome ref={legendRef}>
                <div className="ct-sm-legend-label">{t.key}</div>
                <LegendBar legend={legend} t={t} />
              </div>
            )}

            <div className="ct-sm-hud" data-fq-chrome>
              {block.mode === 'free' ? (
                <>
                  <span className="ct-sm-hud-stat ct-fq-lives" aria-label={`${lives} lives`}>
                    {'♥'.repeat(Math.max(0, lives))}<span className="ct-fq-lives-spent">{'♥'.repeat(Math.max(0, SM_FREE_LIVES - lives))}</span>
                  </span>
                  <span className="ct-sm-hud-stat">{t.score} {score}</span>
                  <span className="ct-sm-hud-stat">{t.combo} ×{combo}</span>
                </>
              ) : (
                <>
                  <span className="ct-sm-hud-stat ct-sm-hud-time">{blockTimeLeft}s</span>
                  <span className="ct-sm-hud-stat">{t.correct} {correct}{block.assessStage ? '' : `/${block.spec.targetCorrect}`}</span>
                  <span className="ct-sm-hud-stat">×{combo}</span>
                </>
              )}
            </div>

            {block.mode === 'free' && (
              <div className="ct-sm-itembar" data-fq-chrome aria-hidden="true">
                <div className="ct-sm-itembar-fill" style={{ width: `${itemPct * 100}%`, background: itemPct > 0.4 ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)' : 'linear-gradient(90deg,#e8a07a,#c97a7a)' }} />
              </div>
            )}

            <div className="ct-sm-card" aria-live="polite" ref={cardRef}>
              {playStep === 'countdown' ? (
                <div className="ct-sm-countdown">{cdVal > 0 ? cdVal : t.go}</div>
              ) : item ? (
                block.assessStage === 'motor'
                  ? <div className="ct-sm-countdown">{item.digit}</div>
                  : <SmSymbol shape={item.symbol} size={92} />
              ) : null}
            </div>
            <p className="ct-sm-prompt">{t.tapNumber}</p>

            <div className="ct-sm-pad" role="group" aria-label={t.tapNumber} ref={padRef}>
              {legend.map((p) => (
                <button
                  key={p.digit}
                  type="button"
                  className={`ct-sm-key${pressedKey === p.digit ? ' ct-sm-key--press' : ''}`}
                  disabled={playStep !== 'running'}
                  onPointerDown={(e) => { e.preventDefault(); answer(p.digit); }}
                >
                  {p.digit}
                </button>
              ))}
            </div>
          </div>

          <TrainingPauseModal
            open={pauseOpen}
            labels={{ paused: t.paused, resume: t.resume, restart: t.restart, quitMenu: t.quitMenu }}
            showRestart
            onResume={onResume}
            onRestart={() => {
              setPauseOpen(false);
              const b = blockRef.current;
              if (!b) return;
              if (b.mode === 'level') startLevel(b.diff, b.lv);
              else if (b.mode === 'free') startFreeMode();
              else startChallengeBlock();
            }}
            onQuitMenu={() => { setPauseOpen(false); setQuitOpen(true); }}
          />
          <TrainingQuitModal
            open={quitOpen}
            labels={{ quitQ: t.quitQ, quitLose: t.quitLose, yesQuit: t.yesQuit, keep: t.keep }}
            onConfirmQuit={confirmQuit}
            onKeepPlaying={() => setQuitOpen(false)}
          />
        </div>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => { setLastResult(null); clearPlay(); setPhase('levels'); }}
              playSfx={playSfx}
              variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{lastResult.grade.won ? t.resultsLevelPass : t.resultsLevelRetry}</div></div>}
            />
            {lastResult.grade.won && (
              <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#e8ac4e', marginTop: 8, fontWeight: 700 }}>
                {'★'.repeat(lastResult.grade.stars)} <span style={{ fontSize: '0.85rem', color: '#5c534c' }}>{starLabel}</span>
              </div>
            )}
            <div className={`ct-fq-sbig ct-fq-band-text-${lastResult.grade.score >= 75 ? 'high' : lastResult.grade.score >= 50 ? 'mid' : 'low'}`}>{lastResult.grade.score}</div>
            <div className="ct-fq-ies-lbl">{t.speedScore}</div>
            <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid">
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.itemsPerMin}</div><div className="ct-fq-rl">{t.ipm}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.accuracyPct}%</div><div className="ct-fq-rl">{t.accuracy}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.meanRt != null ? lastResult.summary.meanRt : '—'}</div><div className="ct-fq-rl">{t.meanRt}</div></div>
            </div>
            <div className="ct-fq-row">
              {lastResult.grade.won && lastResult.block.lv < SM_LEVELS_PER_TIER && (
                <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startLevel(lastResult.block.diff, lastResult.block.lv + 1); }}>{t.nextLv}</button>
              )}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { playSfx('click'); setLastResult(null); startLevel(lastResult.block.diff, lastResult.block.lv); }}>{t.retry}</button>
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); clearPlay(); setPhase('levels'); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => { setLastResult(null); clearPlay(); setPhase('hub'); }}
              playSfx={playSfx}
              variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.freeGameOver}</div></div>}
            />
            <div className="ct-fq-sbig">{lastResult.score ?? 0}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <div className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 10, fontWeight: 700 }}>{t.freeCorrect(lastResult.correct)}</div>
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>{t.freeBest(profile.bestFree ?? 0)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startFreeMode(); }}>{t.freePlayAgain}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); clearPlay(); setPhase('hub'); }}>{t.menu}</button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => { setLastResult(null); clearPlay(); setPhase('hub'); }}
              playSfx={playSfx}
              variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div></div>}
            />
            {[...lastResult.rows].sort((a, b) => b.correct - a.correct).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">{t.chalResDetail(row.rounds?.length || 1, row.correct, row.last?.accuracyPct ?? 0, row.last?.meanRt)}</div>
                </div>
                <div className="ct-fq-lbsc">{row.correct}</div>
              </div>
            ))}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { setLastResult(null); clearPlay(); setPhase('chal'); setChalSeed(null); }}>{t.newCh}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); clearPlay(); setPhase('hub'); }}>{t.menu}</button>
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
