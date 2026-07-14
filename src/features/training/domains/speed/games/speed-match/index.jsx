import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid, TrainingModeList } from '../../../../shared/TrainingScreens';
import HubScienceLink from '../../../../shared/HubScienceLink';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { freshSurvivalSeed } from '../../../../shared/survival';
import { makeRng } from '../../../../shared/rng';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { createTrialLog } from '../../../../shared/trialLog';
import { loadGameSettings } from '../../../../shared/focusQuestData';
import AssessmentReady from '../../../../assessment/AssessmentReady';
import { useTrainingTutorialHost } from '../../../../shared/tutorials/useTrainingTutorialHost';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import {
  SH,
  SM_DIFF_KEYS,
  SM_DM,
  SM_LEVELS_PER_TIER,
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
  freeItemPoints,
  mulberry32,
  TIME_BANK,
  bankGainMs,
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
    ...STR_COMMON.en,
    hub: 'Speed Match',
    title: 'Speed Match',
    hubMapAria: 'Modes — choose a path',
    hubNodeFreeHint: 'Endless · time bank · gets faster',
    hubNodeLevelsHint: '100 levels per tier · unlock in order',
    hubNodeChallengeHint: 'Same key for all · pick a difficulty',
    freeIntroBody:
      'Match the symbol to its number. You have one time bank that keeps ticking down — every correct match adds time, a wrong tap subtracts it. As you go, the key grows and each correct match returns less time, so you must get faster to stay alive. The run ends when the time bank empties.',
    pickDiffSub: 'Each tier has 100 levels. Unlock them in order.',
    diffDesc: {
      easy: 'Few symbols, gentle pace — learn the matching.',
      medium: 'More symbols, brisker — build speed.',
      hard: 'Up to 9 symbols (the full key), fast and demanding.',
    },
    levelsSub: (pop) => `${pop} · ${SM_LEVELS_PER_TIER} levels`,
    challengeSub: 'Same key & symbols for everyone · pick a difficulty · pass the device',
    chalRoundsHint: 'Each player plays once per round · new fair key each round',
    chalBulletSame: 'Same key and symbol order for everyone this round',
    chalMeta: (label, sec) => `${label} · ${sec}s`,
    key: 'Key',
    tapNumber: 'Tap the number that matches the symbol',
    countdown: 'Get ready…',
    go: 'GO!',
    correct: 'Correct',
    combo: 'Combo',
    restart: 'Restart',
    levelHeader: (diff, lv) => `${SM_DM[diff]?.label ?? diff} · L${lv}`,
    targetSub: (n) => `Reach ${n} correct`,
    resultsLevelPass: 'Level passed',
    resultsLevelRetry: 'Try again',
    speedScore: 'Speed score',
    ipm: 'Matches / min',
    accuracy: 'Accuracy',
    meanRt: 'Avg match time',
    rtVar: 'RT variability',
    ies: 'Efficiency',
    iesHint: 'IES · lower is better',
    metricsNote: 'Matches/min is your processing-speed score. RT variability tracks how steady you are; efficiency (IES) blends speed and accuracy.',
    ms: 'ms',
    freeCorrect: (n) => `Matches: ${n}`,
    freeBest: (n) => `Best score: ${n}`,
    chalResDetail: (nr, c, acc, rt) =>
      nr > 1
        ? `${nr}× · ${c} correct avg · ${acc}% · ${rt ?? '—'}ms`
        : `${c} correct · ${acc}% · ${rt ?? '—'}ms`,
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
    ...STR_COMMON.ar,
    hub: 'مطابقة سريعة',
    title: 'مطابقة سريعة',
    hubMapAria: 'الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'لا ينتهي · بنك وقت · يتسارع',
    hubNodeLevelsHint: '١٠٠ مستوى لكل صعوبة · بالترتيب',
    hubNodeChallengeHint: 'نفس المفتاح للجميع · اختر الصعوبة',
    freeIntroBody:
      'طابق الرمز مع رقمه. لديك بنك وقت واحد يتناقص باستمرار — كل مطابقة صحيحة تضيف وقتاً والنقر الخاطئ يخصم منه. كلما تقدمت يكبر المفتاح وتعيد كل مطابقة وقتاً أقل، فعليك أن تتسارع لتبقى. تنتهي المحاولة عند نفاد بنك الوقت.',
    pickDiffSub: 'كل صعوبة تحتوي ١٠٠ مستوى. افتحها بالترتيب.',
    diffDesc: {
      easy: 'رموز قليلة وإيقاع هادئ — تعلّم المطابقة.',
      medium: 'رموز أكثر وأسرع — ابنِ سرعتك.',
      hard: 'حتى ٩ رموز (المفتاح الكامل)، سريع ومُجهِد.',
    },
    levelsSub: (pop) => `${pop} · ${SM_LEVELS_PER_TIER} مستوى`,
    challengeSub: 'نفس المفتاح والرموز للجميع · اختر الصعوبة · مرّر الجهاز',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · مفتاح عادل جديد كل جولة',
    chalBulletSame: 'نفس المفتاح وترتيب الرموز للجميع في هذه الجولة',
    chalMeta: (label, sec) => `${label} · ${sec}ث`,
    key: 'المفتاح',
    tapNumber: 'اضغط الرقم المطابق للرمز',
    countdown: 'استعد…',
    go: 'انطلق!',
    correct: 'صحيح',
    combo: 'تتابع',
    restart: 'إعادة',
    levelHeader: (diff, lv) => `${SM_DM[diff]?.label ?? diff} · ${lv}`,
    targetSub: (n) => `اجمع ${n} صحيحة`,
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetry: 'حاول مجددًا',
    speedScore: 'درجة السرعة',
    ipm: 'مطابقات / دقيقة',
    accuracy: 'الدقة',
    meanRt: 'متوسط زمن المطابقة',
    rtVar: 'تغيّر زمن الاستجابة',
    ies: 'الكفاءة',
    iesHint: 'IES · الأقل أفضل',
    metricsNote: 'المطابقات/دقيقة هي درجة سرعة معالجتك. تغيّر زمن الاستجابة يقيس ثباتك؛ والكفاءة (IES) تمزج السرعة والدقة.',
    ms: 'ملث',
    freeCorrect: (n) => `مطابقات: ${n}`,
    freeBest: (n) => `أفضل نقاط: ${n}`,
    chalResDetail: (nr, c, acc, rt) =>
      nr > 1
        ? `${nr}× · ${c} صحيحة بالمتوسط · ${acc}% · ${rt ?? '—'}ملث`
        : `${c} صحيحة · ${acc}% · ${rt ?? '—'}ملث`,
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
function SmSymbol({ shape, size = 48, color = '#2d2d2d', className }) {
  const inner = SH[shape] || SH.circle;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
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

export default function SpeedMatchGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep, assessmentDomainId = 'speed' }) {
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
  const { openTutorial, replayHint: tutReplayHint, layer: tutLayer } = useTrainingTutorialHost('speed-match', isAr, playSfx);

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
  const lastDigitRef = useRef(0);
  const itemRef = useRef(null);
  const answeredRef = useRef(false);
  const blockEndAtRef = useRef(0); // assessment only (fixed-window SDMT)
  const itemStartRef = useRef(0);
  // Adaptive time bank (training modes): bankRef ms remaining, capped at bankMax.
  const bankRef = useRef(TIME_BANK.startMs);
  const bankMaxRef = useRef(TIME_BANK.maxMs);
  const runStartRef = useRef(0); // when 'running' began (for elapsed/throughput)
  const rafRef = useRef(0);
  const runIdRef = useRef(0);
  const endedRef = useRef(false);
  const trialLogRef = useRef(null);
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
    // Survival grows the key as you progress (more symbols = harder scan); the
    // adaptive time bank supplies the speed pressure. No per-item deadline.
    if (block.mode === 'free') {
      const size = freeLegendSize(correctRef.current);
      if (block.legend.length !== size) {
        block.legend = buildLegend(size);
        setLegend(block.legend);
      }
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
    // Assessment uses its fixed window; training is self-paced under the time
    // bank, so throughput is measured over the actual elapsed play time.
    const elapsedSec = block.assessStage
      ? block.spec.durationSec
      : Math.max(1, (performance.now() - runStartRef.current) / 1000);
    const summary = summarize(eventsRef.current, elapsedSec);
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
      // finger speed — the reason clinical SDMT/DSST use a copy/baseline condition.
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
  }, [stopLoop, playSfx, persistLevelDone, assessmentMode, onAssessmentComplete, t.motor, awardTrainingWin]);
  useEffect(() => { finishBlockRef.current = finishBlock; }, [finishBlock]);

  const finishFreeRun = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    playSfx('error');
    const runScore = scoreRef.current;
    const c = correctRef.current;
    // Summarize the whole run over actual elapsed play time (research-grade
    // metrics: matches/min, accuracy, RT variability, IES).
    const elapsedSec = Math.max(1, (performance.now() - runStartRef.current) / 1000);
    const summary = summarize(eventsRef.current, elapsedSec);
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
    setLastResult({ type: 'free', score: runScore, correct: c, summary });
    setPhase('freeRes');
    setPlayStep('idle');
    blockRef.current = null;
  }, [stopLoop, playSfx, awardFreeRun]);

  const startLoop = useCallback(() => {
    stopLoop();
    const myRun = runIdRef.current;
    let last = performance.now();
    const loop = (ts) => {
      if (runIdRef.current !== myRun) return;
      if (pauseRef.current) { rafRef.current = requestAnimationFrame(loop); last = ts; return; }
      const block = blockRef.current;
      if (!block) return;
      const dt = ts - last;
      last = ts;
      if (block.assessStage) {
        // Standardized assessment: fixed-window SDMT.
        if (ts >= blockEndAtRef.current) { finishBlockRef.current(); return; }
      } else {
        // Training: the adaptive time bank drains in real time; empty = run over.
        bankRef.current -= dt;
        if (bankRef.current <= 0) {
          bankRef.current = 0;
          if (block.mode === 'free') finishFreeRun(); else finishBlockRef.current();
          return;
        }
      }
      setTick((n) => (n + 1) % 1000000);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop, finishFreeRun]);

  const answer = useCallback((digit) => {
    if (playStepRef.current !== 'running' || pauseRef.current) return;
    const block = blockRef.current;
    const it = itemRef.current;
    if (!block || !it) return;

    if (answeredRef.current) return;
    answeredRef.current = true;
    const now = performance.now();
    const rt = Math.round(now - itemStartRef.current);
    const isRight = digit === it.digit;
    eventsRef.current.push({ correct: isRight, rtMs: isRight ? rt : null });
    trialLogRef.current?.trial({ rt, ok: isRight, key: block.legend.length });
    setPressedKey(digit);
    setTimeout(() => setPressedKey(null), 120);
    const bankMode = !block.assessStage; // free / level / challenge use the time bank
    if (isRight) {
      playSfx('click');
      juice.hit({ rtMs: rt, limitMs: 1600 });
      correctRef.current += 1;
      comboRef.current += 1;
      setCorrect(correctRef.current);
      setCombo(comboRef.current);
      if (bankMode) {
        // Reward time (less as the key grows) + score points.
        bankRef.current = Math.min(bankMaxRef.current, bankRef.current + bankGainMs(block.legend.length));
        scoreRef.current += freeItemPoints(comboRef.current);
        setScore(scoreRef.current);
      }
      // Assessment practice ends once the player shows they get it (4 correct).
      if (block.assessStage === 'practice' && correctRef.current >= 4) {
        playSfx('win');
        beginMotorBlockRef.current();
        return;
      }
      // Levels clear by reaching the target (before the bank empties).
      if (bankMode && block.mode === 'level' && correctRef.current >= block.spec.targetCorrect) {
        flash('hit');
        finishBlock();
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
      if (bankMode) {
        // A wrong match costs time; if it empties the bank, the run is over.
        bankRef.current -= TIME_BANK.penaltyMs;
        if (bankRef.current <= 0) {
          bankRef.current = 0;
          if (block.mode === 'free') finishFreeRun(); else finishBlock();
          return;
        }
      }
      nextItemRef.current(now);
    }
  }, [playSfx, flash, finishFreeRun, finishBlock, juice]);

  // Countdown → running.
  useEffect(() => {
    if (phase !== 'play' || playStep !== 'countdown') return undefined;
    if (cdVal <= 0) {
      const now = performance.now();
      const block = blockRef.current;
      runStartRef.current = now;
      if (block && block.assessStage) {
        blockEndAtRef.current = now + block.spec.durationSec * 1000;
      } else if (block) {
        bankRef.current = TIME_BANK.startMs; // fresh adaptive time bank
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
  }, [stopLoop, assessmentMode, juice]);

  const startFreeMode = useCallback(() => {
    const block = { mode: 'free', diff: 'free', lv: 0, spec: { durationSec: 0, remapEvery: 0, pairCount: 4 }, legend: buildLegend(4) };
    beginBlock(block, makeRng(freshSurvivalSeed()));
  }, [beginBlock]);

  const startLevel = useCallback((diff, lv) => {
    beginBlock(prepareLevelBlock(diff, lv), Math.random);
  }, [beginBlock]);

  /* --- Standardized assessment: practice → motor baseline → 120s SDMT ------
   * Clinical SDMT uses 90–120 s; we use 120 s for stronger test–retest reliability
   * in a digital battery (Smith 1982; Jaeger 2018). */
  const beginMotorBlock = useCallback(() => {
    const spec = { diff: 'medium', lv: 0, pairCount: 6, durationSec: 25, targetCorrect: 999, minAcc: 0, remapEvery: 0, itemMs: 0 };
    const legend = Array.from({ length: 6 }, (_, i) => ({ digit: i + 1, symbol: null }));
    beginBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend, assessStage: 'motor' }, Math.random);
  }, [beginBlock]);
  useEffect(() => { beginMotorBlockRef.current = beginMotorBlock; }, [beginMotorBlock]);

  const beginMainAssess = useCallback(() => {
    const spec = { diff: 'medium', lv: 0, pairCount: 6, durationSec: 120, targetCorrect: 999, minAcc: 0.8, remapEvery: 0, itemMs: 0 };
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
    // Halt the loop first. The time bank pauses naturally (the loop stops
    // draining it); only the assessment's fixed window needs its deadline saved.
    pauseRef.current = true;
    const now = performance.now();
    if (blockRef.current?.assessStage) blockRef.current.__blockRem = blockEndAtRef.current - now;
    setPauseOpen(true);
  };
  const onResume = () => {
    const now = performance.now();
    if (blockRef.current?.assessStage && blockRef.current.__blockRem != null) {
      blockEndAtRef.current = now + blockRef.current.__blockRem;
      blockRef.current.__blockRem = null;
    }
    itemStartRef.current = now; // don't count paused time against this item's RT
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

  const block = blockRef.current;
  const isAssess = !!block?.assessStage;
  const now = performance.now();
  // Assessment: fixed-window countdown. Training: the adaptive time bank.
  const blockTimeLeft = isAssess && playStep === 'running'
    ? Math.max(0, Math.ceil((blockEndAtRef.current - now) / 1000))
    : isAssess ? block.spec.durationSec : 0;
  const bankSec = block && !isAssess ? Math.max(0, bankRef.current / 1000) : 0;
  const bankPct = block && !isAssess ? Math.max(0, Math.min(1, bankRef.current / (bankMaxRef.current || 1))) : 0;

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
          domainId={assessmentDomainId}
          onStart={startAssessment}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
      )}
      {phase === 'hub' && (
        <>
          <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
            <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
              <TrainingMenuBar
                onBack={onBack}
                playSfx={playSfx}
                hubSpaced
                variant="paper"
                onReplayTutorial={openTutorial}
                replayHint={tutReplayHint}
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
                onFree={() => setPhase('freeIntro')}
                onLevels={() => setPhase('diff')}
                onChallenge={() => setPhase('chal')}
              />
              <HubScienceLink gameId="speed-match" isAr={isAr} playSfx={playSfx} />
            </div>
          </div>
          {tutLayer}
        </>
      )}

      {phase === 'freeIntro' && (
        <SurvivalIntro
          isAr={isAr}
          playSfx={playSfx}
          title={t.freeIntroTitle}
          body={t.freeIntroBody}
          onReady={startFreeMode}
          onBack={() => setPhase('hub')}
        />
      )}

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
            />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.challengeSub}
              diffKeys={SM_DIFF_KEYS}
              diffLabels={SM_DM}
              diff={chalDiff}
              onDiffChange={setChalDiff}
              players={chalNames}
              onPlayersChange={setChalNames}
              rounds={chalRoundsTotal}
              onRoundsChange={setChalRoundsTotal}
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

      {phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={`${SM_DM[chalDiff]?.label ?? ''} · ${chalSeed?.spec?.pairCount ?? 6} ${isAr ? 'رموز' : 'symbols'}`}
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
            title={header.title}
            subtitle={header.subtitle}
            playSfx={playSfx}
            onMenu={() => setQuitOpen(true)}
            onPause={onPause}
            pauseAriaLabel={t.paused}
          />
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
              <div className="ct-sm-legend-wrap" data-fq-chrome>
                <div className="ct-sm-legend-label">{t.key}</div>
                <LegendBar legend={legend} t={t} />
              </div>
            )}

            <div className="ct-sm-hud" data-fq-chrome>
              {isAssess ? (
                <>
                  <span className="ct-sm-hud-stat ct-sm-hud-time">{blockTimeLeft}s</span>
                  <span className="ct-sm-hud-stat">{t.correct} {correct}</span>
                  <span className="ct-sm-hud-stat">×{combo}</span>
                </>
              ) : (
                <>
                  <span className="ct-sm-hud-stat ct-sm-hud-time">{bankSec.toFixed(1)}s</span>
                  <span className="ct-sm-hud-stat">{t.correct} {correct}{block.mode === 'level' ? `/${block.spec.targetCorrect}` : ''}</span>
                  <span className="ct-sm-hud-stat">{t.combo} ×{combo}</span>
                  {block.mode === 'free' && <span className="ct-sm-hud-stat">{t.score} {score}</span>}
                </>
              )}
            </div>

            {!isAssess && (
              <div className="ct-sm-itembar" data-fq-chrome aria-hidden="true">
                <div className="ct-sm-itembar-fill" style={{ width: `${bankPct * 100}%`, background: bankPct > 0.4 ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)' : 'linear-gradient(90deg,#e8a07a,#c97a7a)' }} />
              </div>
            )}

            <div className="ct-sm-card" aria-live="polite">
              {playStep === 'countdown' ? (
                <div className="ct-sm-countdown">{cdVal > 0 ? cdVal : t.go}</div>
              ) : item ? (
                block.assessStage === 'motor'
                  ? <div className="ct-sm-countdown">{item.digit}</div>
                  : <SmSymbol shape={item.symbol} className="ct-sm-symbol" />
              ) : null}
            </div>

            <div className="ct-sm-pad" role="group" aria-label={t.tapNumber}>
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
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.meanRt != null ? `${lastResult.summary.meanRt}${t.ms}` : '—'}</div><div className="ct-fq-rl">{t.meanRt}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.icv != null ? `${Math.round(lastResult.summary.icv * 100)}%` : '—'}</div><div className="ct-fq-rl">{t.rtVar}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.ies != null ? lastResult.summary.ies : '—'}</div><div className="ct-fq-rl">{t.ies}<span className="ct-sm-rl-hint"> · {t.iesHint}</span></div></div>
            </div>
            <p className="ct-sm-metrics-note">{t.metricsNote}</p>
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
            {lastResult.summary && (
              <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid" style={{ marginTop: 12 }}>
                <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.itemsPerMin}</div><div className="ct-fq-rl">{t.ipm}</div></div>
                <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.accuracyPct}%</div><div className="ct-fq-rl">{t.accuracy}</div></div>
                <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.meanRt != null ? `${lastResult.summary.meanRt}${t.ms}` : '—'}</div><div className="ct-fq-rl">{t.meanRt}</div></div>
                <div className="ct-fq-rmi"><div className="ct-fq-rv">{lastResult.summary.icv != null ? `${Math.round(lastResult.summary.icv * 100)}%` : '—'}</div><div className="ct-fq-rl">{t.rtVar}</div></div>
              </div>
            )}
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 10 }}>{t.freeBest(profile.bestFree ?? 0)}</p>
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

    </div>
  );
}
