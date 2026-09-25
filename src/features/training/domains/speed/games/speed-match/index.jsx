import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import {
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
} from '../../../../shared/TrainingChrome';
import { IconBack, IconPause } from '../../../../shared/TrainingIcons';
import { freshSurvivalSeed } from '../../../../shared/survival';
import { makeRng } from '../../../../shared/rng';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { createTrialLog } from '../../../../shared/trialLog';
import AssessmentReady from '../../../../assessment/AssessmentReady';
import DomCoach from '../../../../shared/tutorials/coach/DomCoach';
import { SPEED_MATCH_COACH } from '../../../../shared/tutorials/coach/scripts/speed-match';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import {
  SH,
  SM_PP_DEPTHS,
  LADDER,
  LADDER_LEVELS,
  specForLevel,
  buildLegend,
  growLegend,
  pickItem,
  summarize,
  gradeBlock,
  prepareLevelBlock,
  prepareChallengeSeed,
  prepareChallengeBlock,
  freeLegendSize,
  freeItemPoints,
  mulberry32,
  TIME_BANK,
  bankGainMs,
  SPEED_MATCH_BANDS,
  SPEED_MATCH_SECTIONS,
  SPEED_MATCH_HELP,
  speedMatchSublabel,
} from './speedMatchData';
import '../../../attention/games/cancellation/cancelAtlas.css';

export {
  SH,
  SM_PP_DEPTHS,
  LADDER,
  LADDER_LEVELS,
  specForLevel,
  buildLegend,
  growLegend,
  pickItem,
  summarize,
  gradeBlock,
  prepareLevelBlock,
  prepareChallengeSeed,
  prepareChallengeBlock,
  freeLegendSize,
  freeItemPoints,
  mulberry32,
  TIME_BANK,
  bankGainMs,
  SPEED_MATCH_BANDS,
  SPEED_MATCH_SECTIONS,
  SPEED_MATCH_HELP,
  speedMatchSublabel,
};

const UI = {
  en: {
    ...STR_COMMON.en,
    hub: 'Speed Match',
    title: 'Speed Match',
    key: 'Key',
    tapNumber: 'Tap the number that matches the symbol',
    countdown: 'Get ready…',
    go: 'GO!',
    correct: 'Correct',
    combo: 'Combo',
    restart: 'Restart',
    levelHeader: (lv) => `L${lv}`,
    targetSub: (n) => `Reach ${n} correct`,
    speedScore: 'Speed score',
    ipm: 'Matches / min',
    accuracy: 'Accuracy',
    meanRt: 'Avg match time',
    rtVar: 'RT variability',
    ies: 'Efficiency',
    iesHint: 'IES · lower is better',
    ms: 'ms',
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
    key: 'المفتاح',
    tapNumber: 'اضغط الرقم المطابق للرمز',
    countdown: 'استعد…',
    go: 'انطلق!',
    correct: 'صحيح',
    combo: 'تتابع',
    restart: 'إعادة',
    levelHeader: (lv) => `مستوى ${lv}`,
    targetSub: (n) => `اجمع ${n} صحيحة`,
    speedScore: 'درجة السرعة',
    ipm: 'مطابقات / دقيقة',
    accuracy: 'الدقة',
    meanRt: 'متوسط زمن المطابقة',
    rtVar: 'تغيّر زمن الاستجابة',
    ies: 'الكفاءة',
    iesHint: 'IES · الأقل أفضل',
    ms: 'ملث',
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

const FALLBACK_SHAPE_EL = <circle cx="50" cy="50" r="38" fill="currentColor" />;
const shapeElCache = Object.create(null);
function getShapeEl(shape) {
  const key = shape in SH ? shape : 'circle';
  if (key in shapeElCache) return shapeElCache[key];
  const markup = SH[key] || SH.circle;
  let el = null;
  if (typeof DOMParser !== 'undefined') {
    try {
      const doc = new DOMParser().parseFromString(
        `<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`,
        'image/svg+xml',
      );
      const node = doc.documentElement && doc.documentElement.firstElementChild;
      if (node && !doc.querySelector('parsererror')) {
        const props = {};
        for (const attr of node.attributes) props[attr.name] = attr.value;
        el = React.createElement(node.nodeName, props);
      }
    } catch {
      el = null;
    }
  }
  if (!el) el = FALLBACK_SHAPE_EL;
  shapeElCache[key] = el;
  return el;
}

function SmSymbol({ shape, size = 48, color = 'var(--game-ink)', className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{ color, display: 'block' }}
    >
      {getShapeEl(shape)}
    </svg>
  );
}

function LegendBar({ legend, t }) {
  return (
    <div className="ct-sm-legend" aria-label={t.key}>
      {legend.map((p) => (
        <div className="ct-sm-legend-pair" key={p.digit}>
          <SmSymbol shape={p.symbol} size={28} />
          <span className="ct-sm-legend-digit">{p.digit}</span>
        </div>
      ))}
    </div>
  );
}

export function SpeedMatchEngine({
  mode = 'free',
  level = 1,
  seed = null,
  attempt = null,
  onResult,
  onExit,
  isAr = false,
  playSfx,
  awardFreeRun,
  awardLadderWin,
  coach,
  assessmentMode = false,
}) {
  const t = isAr ? UI.ar : UI.en;
  const stageRef = useRef(null);
  const juice = useJuice();
  const juiceRef = useRef(juice);
  juiceRef.current = juice;
  const rLabels = ratingLabels(isAr);

  const [playStep, setPlayStep] = useState('countdown');
  const [cdVal, setCdVal] = useState(3);
  const [legend, setLegend] = useState([]);
  const [item, setItem] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pressedKey, setPressedKey] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);

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
  const blockEndAtRef = useRef(0);
  const itemStartRef = useRef(0);
  const bankRef = useRef(TIME_BANK.startMs);
  const bankMaxRef = useRef(TIME_BANK.maxMs);
  const runStartRef = useRef(0);
  const rafRef = useRef(0);
  const runIdRef = useRef(0);
  const endedRef = useRef(false);
  const trialLogRef = useRef(null);
  const assessMotorRef = useRef(null);
  const playStepRef = useRef('countdown');
  const pauseRef = useRef(false);
  const fbTimerRef = useRef(0);

  const coachOpenRef = coach?.openRef;

  useEffect(() => { playStepRef.current = playStep; }, [playStep]);
  useEffect(() => { pauseRef.current = pauseOpen; }, [pauseOpen]);

  const stopLoop = useCallback(() => {
    runIdRef.current += 1;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const flash = useCallback((kind) => {
    if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
    setFeedback(kind);
    fbTimerRef.current = setTimeout(() => setFeedback(null), 260);
  }, []);

  const nextItem = useCallback((now) => {
    const block = blockRef.current;
    if (!block) return;
    if (block.mode === 'free') {
      const size = freeLegendSize(correctRef.current);
      if (block.legend.length < size) {
        block.legend = growLegend(block.legend, size, rngRef.current);
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

  const finishBlock = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    const block = blockRef.current;
    if (!block) { endedRef.current = false; return; }

    const elapsedSec = block.assessStage
      ? block.spec.durationSec
      : Math.max(1, (performance.now() - runStartRef.current) / 1000);
    const summary = summarize(eventsRef.current, elapsedSec);
    const grade = gradeBlock(summary, block.spec, { freeMode: false });

    if (assessmentMode) {
      const stage = block.assessStage || 'main';
      if (stage === 'practice') {
        trialLogRef.current?.discard();
        trialLogRef.current = null;
        beginMotorBlock();
        return;
      }
      if (stage === 'motor') {
        trialLogRef.current?.discard();
        trialLogRef.current = null;
        assessMotorRef.current = summary;
        playSfx?.('win');
        beginMainAssess();
        return;
      }
      const motorIpm = assessMotorRef.current?.itemsPerMin || null;
      const ratio = motorIpm ? Math.min(1, summary.itemsPerMin / motorIpm) : null;
      const speedScore = Math.min(1, summary.itemsPerMin / 46);
      const finalScore = Math.round(100 * (ratio != null
        ? 0.55 * speedScore + 0.15 * Math.min(1, ratio / 0.6) + 0.3 * summary.accuracy
        : 0.7 * speedScore + 0.3 * summary.accuracy));
      trialLogRef.current?.finish({
        score: finalScore,
        motorIpm,
        ipm: summary.itemsPerMin,
        acc: summary.accuracyPct,
      });
      trialLogRef.current = null;
      playSfx?.('win');
      const line = `${summary.itemsPerMin}/min · ${summary.accuracyPct}%${motorIpm ? ` · ${t.motor} ${motorIpm}/min` : ''}`;
      blockRef.current = null;
      onResult?.({ score: finalScore, line });
      return;
    }

    trialLogRef.current?.finish({ score: grade.score, won: grade.won });
    trialLogRef.current = null;

    if (block.mode === 'passplay') {
      playSfx?.('win');
      onResult?.({ score: grade.score, correct: summary.correct });
      return;
    }

    if (grade.won) {
      playSfx?.('win');
      awardLadderWin?.('speed-match', block.lv, LADDER_LEVELS);
    } else {
      playSfx?.('error');
    }
    onResult?.({ won: grade.won, score: grade.score, summary, grade });
  }, [stopLoop, playSfx, assessmentMode, t.motor, awardLadderWin, onResult]);

  const finishFreeRun = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopLoop();
    playSfx?.('error');
    const runScore = scoreRef.current;
    const c = correctRef.current;
    const elapsedSec = Math.max(1, (performance.now() - runStartRef.current) / 1000);
    const summary = summarize(eventsRef.current, elapsedSec);

    trialLogRef.current?.finish({ correct: c, score: runScore, level: Math.floor(c / 5) });
    trialLogRef.current = null;
    awardFreeRun?.('speed', Math.floor(c / 5));
    onResult?.({ score: runScore, correct: c, summary });
  }, [stopLoop, playSfx, awardFreeRun, onResult]);

  const startLoop = useCallback(() => {
    stopLoop();
    const myRun = runIdRef.current;
    let last = performance.now();
    const loop = (ts) => {
      if (runIdRef.current !== myRun) return;
      if (coachOpenRef?.current || pauseRef.current) {
        last = ts;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const dt = Math.min(100, ts - last);
      last = ts;
      const b = blockRef.current;
      if (!b) return;

      if (b.assessStage) {
        if (ts >= blockEndAtRef.current) {
          finishBlock();
          return;
        }
      } else {
        bankRef.current -= dt;
        if (bankRef.current <= 0) {
          bankRef.current = 0;
          if (b.mode === 'free') finishFreeRun();
          else finishBlock();
          return;
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [stopLoop, finishFreeRun, finishBlock, coachOpenRef]);

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

    const bankMode = !block.assessStage;
    if (isRight) {
      playSfx?.('click');
      juiceRef.current?.hit({ rtMs: rt, limitMs: 1600 });
      correctRef.current += 1;
      comboRef.current += 1;
      setCorrect(correctRef.current);
      setCombo(comboRef.current);
      if (bankMode) {
        bankRef.current = Math.min(bankMaxRef.current, bankRef.current + bankGainMs(block.legend.length));
        scoreRef.current += freeItemPoints(comboRef.current);
        setScore(scoreRef.current);
      }
      if (block.assessStage === 'practice' && correctRef.current >= 4) {
        playSfx?.('win');
        beginMotorBlock();
        return;
      }
      if (bankMode && block.mode === 'level' && correctRef.current >= block.spec.targetCorrect) {
        flash('hit');
        finishBlock();
        return;
      }
      flash('hit');
      nextItem(now);
    } else {
      playSfx?.('error');
      juiceRef.current?.miss();
      wrongRef.current += 1;
      comboRef.current = 0;
      setCombo(0);
      flash('miss');
      if (bankMode) {
        bankRef.current -= TIME_BANK.penaltyMs;
        if (bankRef.current <= 0) {
          bankRef.current = 0;
          if (block.mode === 'free') finishFreeRun(); else finishBlock();
          return;
        }
      }
      nextItem(now);
    }
  }, [playSfx, flash, finishFreeRun, finishBlock, nextItem]);

  const initBlock = useCallback((block, rng) => {
    stopLoop();
    runIdRef.current += 1;
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
    juiceRef.current?.reset();
    setLegend(block.legend);
    setItem(null);
    setScore(0);
    setCombo(0);
    setCorrect(0);
    setFeedback(null);
    setPauseOpen(false);
    setQuitOpen(false);
    setCdVal(3);
    setPlayStep('countdown');
  }, [stopLoop, assessmentMode]);

  const beginMotorBlock = useCallback(() => {
    const spec = { diff: 'medium', lv: 0, pairCount: 6, durationSec: 25, targetCorrect: 999, minAcc: 0, remapEvery: 0, itemMs: 0 };
    const lg = Array.from({ length: 6 }, (_, i) => ({ digit: i + 1, symbol: null }));
    initBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend: lg, assessStage: 'motor' }, Math.random);
  }, [initBlock]);

  const beginMainAssess = useCallback(() => {
    const spec = { diff: 'medium', lv: 0, pairCount: 6, durationSec: 120, targetCorrect: 999, minAcc: 0.8, remapEvery: 0, itemMs: 0 };
    initBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend: buildLegend(6), assessStage: 'main' }, Math.random);
  }, [initBlock]);

  const startAssessment = useCallback(() => {
    assessMotorRef.current = null;
    const spec = { diff: 'medium', lv: 0, pairCount: 4, durationSec: 60, targetCorrect: 4, minAcc: 0, remapEvery: 0, itemMs: 0 };
    initBlock({ mode: 'level', diff: 'medium', lv: 0, spec, legend: buildLegend(4), assessStage: 'practice' }, Math.random);
  }, [initBlock]);

  // Keyboard navigation for desktop: keys 1..9
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (playStepRef.current !== 'running' || pauseRef.current) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        answer(num);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [answer]);

  // Countdown timer
  useEffect(() => {
    if (playStep !== 'countdown') return undefined;
    if (cdVal <= 0) {
      const now = performance.now();
      const block = blockRef.current;
      runStartRef.current = now;
      if (block && block.assessStage) {
        blockEndAtRef.current = now + block.spec.durationSec * 1000;
      } else if (block) {
        bankRef.current = TIME_BANK.startMs;
      }
      setPlayStep('running');
      playStepRef.current = 'running';
      nextItem(now);
      startLoop();
      return undefined;
    }
    const id = setTimeout(() => setCdVal((c) => c - 1), 650);
    return () => clearTimeout(id);
  }, [playStep, cdVal, startLoop, nextItem]);

  // Initial mount: load round based on mode
  useEffect(() => {
    if (assessmentMode) {
      startAssessment();
      return;
    }
    if (mode === 'levels') {
      initBlock(prepareLevelBlock(level), makeRng(seed || Date.now()));
    } else if (mode === 'passplay') {
      const cSeed = prepareChallengeSeed('mid');
      if (seed) cSeed.seed = seed;
      initBlock(prepareChallengeBlock(cSeed), mulberry32(cSeed.seed));
    } else {
      // free / survival
      const blk = {
        mode: 'free',
        diff: 'free',
        lv: 0,
        spec: { durationSec: 0, remapEvery: 0, pairCount: 4 },
        legend: buildLegend(4),
      };
      initBlock(blk, makeRng(seed || freshSurvivalSeed()));
    }
    return () => {
      stopLoop();
      if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
      trialLogRef.current?.discard();
    };
  }, [mode, level, seed, assessmentMode, initBlock, startAssessment, stopLoop]);

  // Live coach hookup
  useEffect(() => {
    if (!coach?.armed || coach?.open) return;
    if (playStep !== 'running') return;
    if (blockRef.current?.mode !== 'free' || pauseOpen || quitOpen) return;
    coach.begin();
  }, [coach, playStep, pauseOpen, quitOpen]);

  useEffect(() => {
    if (!coach?.open) return;
    if (playStep !== 'running') coach.end();
  }, [coach, playStep]);

  const onPause = () => {
    if (playStepRef.current !== 'running') return;
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
    itemStartRef.current = now;
    pauseRef.current = false;
    setPauseOpen(false);
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    stopLoop();
    onExit?.();
  };

  const block = blockRef.current;
  const isAssess = !!block?.assessStage;
  const now = performance.now();
  const blockTimeLeft = isAssess && playStep === 'running'
    ? Math.max(0, Math.ceil((blockEndAtRef.current - now) / 1000))
    : isAssess ? block?.spec?.durationSec || 0 : 0;
  const bankSec = block && !isAssess ? Math.max(0, bankRef.current / 1000) : 0;
  const bankPct = block && !isAssess ? Math.max(0, Math.min(1, bankRef.current / (bankMaxRef.current || 1))) : 0;

  const header = (() => {
    if (!block) return { title: t.title, subtitle: '' };
    if (block.assessStage === 'practice') return { title: t.assessPractice, subtitle: t.assessPracticeSub };
    if (block.assessStage === 'motor') return { title: t.assessMotor, subtitle: t.assessMotorSub };
    if (block.assessStage === 'main') return { title: t.assessMain, subtitle: t.assessMainSub };
    if (block.mode === 'free') return { title: t.title, subtitle: isAr ? 'البقاء' : 'Survival' };
    if (block.mode === 'passplay') return { title: t.title, subtitle: isAr ? 'مرّر والعب' : 'Pass & Play' };
    return { title: t.levelHeader(block.lv), subtitle: t.targetSub(block.spec.targetCorrect) };
  })();

  return (
    <div className="cx-atlas ct-sm-play" data-gameplay-active="true" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button
          type="button"
          className="ct-training-chrome-btn"
          aria-label={isAr ? 'خروج' : 'Exit'}
          onClick={() => { playSfx?.('click'); setQuitOpen(true); }}
        >
          <IconBack size={18} c="currentColor" />
        </button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{header.title}</div>
          <div className="ct-training-play-sub">{header.subtitle}</div>
        </div>
        <button
          type="button"
          className="ct-training-chrome-btn"
          aria-label={isAr ? 'إيقاف' : 'Pause'}
          onClick={() => { playSfx?.('click'); onPause(); }}
        >
          <IconPause size={18} c="currentColor" />
        </button>
      </header>

      <div
        className={`ct-sm-stage ct-juice-host${feedback === 'hit' ? ' ct-sm-stage--hit' : feedback === 'miss' ? ' ct-sm-stage--miss' : ''}${juice.shake ? ' ct-juice-shake' : ''}`}
        ref={stageRef}
      >
        {playStep === 'countdown' && (
          <div className="c3d-countdown-wrap ct-countdown-overlay">
            <div className="c3d-countdown-ring" />
            <div className="c3d-countdown-val">{cdVal > 0 ? cdVal : (isAr ? 'ابدأ' : 'GO')}</div>
          </div>
        )}

        <JuiceLayer
          combo={juice.combo}
          particle={juice.particle}
          rtFx={juice.rtFx}
          toast={juice.toast}
          burst={juice.burst}
          ratingLabels={rLabels}
          showCombo={false}
        />

        {block?.assessStage !== 'motor' && legend.length > 0 && (
          <div className="ct-sm-legend-wrap" data-fq-chrome data-coach="legend">
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
              <span className="ct-sm-hud-stat">{t.correct} {correct}{block?.mode === 'level' ? `/${block.spec.targetCorrect}` : ''}</span>
              <span className="ct-sm-hud-stat">{t.combo} ×{combo}</span>
              {block?.mode === 'free' && <span className="ct-sm-hud-stat">{t.score} {score}</span>}
            </>
          )}
        </div>

        {!isAssess && (
          <div className="ct-sm-itembar" data-fq-chrome aria-hidden="true" data-coach="bank">
            <div
              className="ct-sm-itembar-fill"
              style={{
                width: `${bankPct * 100}%`,
                background: bankPct > 0.4
                  ? 'linear-gradient(90deg, var(--color-amber), var(--color-amber-bright))'
                  : 'linear-gradient(90deg, var(--game-accent), var(--game-bad))',
              }}
            />
          </div>
        )}

        <div className="ct-sm-card" aria-live="polite" data-coach="card">
          {item ? (
            block?.assessStage === 'motor'
              ? <div className="ct-sm-countdown">{item.digit}</div>
              : <SmSymbol shape={item.symbol} className="ct-sm-symbol" size={110} />
          ) : null}
        </div>

        <div className="ct-sm-pad" role="group" aria-label={t.tapNumber} data-coach="pad">
          {legend.map((p) => (
            <button
              key={p.digit}
              type="button"
              className={`ct-sm-key${pressedKey === p.digit ? ' ct-sm-key--press' : ''}`}
              disabled={playStep !== 'running'}
              onClick={() => answer(p.digit)}
            >
              {p.digit}
            </button>
          ))}
        </div>

        {coach?.open && (
          <DomCoach
            isAr={isAr}
            playSfx={playSfx}
            stageRef={stageRef}
            pack={SPEED_MATCH_COACH}
            satisfiedFor={() => correct > 0}
            onFinish={() => coach.end()}
            onSkip={() => coach.end()}
          />
        )}
      </div>

      <TrainingPauseModal
        open={pauseOpen}
        labels={{ paused: t.paused, resume: t.resume, restart: t.restart, quitMenu: t.quitMenu }}
        showRestart={false}
        onResume={onResume}
        onQuit={confirmQuit}
      />

      <TrainingQuitModal
        open={quitOpen}
        labels={{ quitTitle: t.quitTitle, quitMessage: t.quitMessage, stay: t.stay, quitConfirm: t.quitConfirm }}
        onCancel={() => setQuitOpen(false)}
        onConfirm={confirmQuit}
      />
    </div>
  );
}

export default function SpeedMatchGame({
  onBack,
  workoutMode = false,
  assessmentMode = false,
  onAssessmentComplete,
  onAssessmentExit,
  assessmentLabel,
  assessmentStep,
  assessmentDomainId = 'speed',
}) {
  const { playSfx, currentLang, awardLadderWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';

  if (assessmentMode) {
    return (
      <div className="cx-atlas" style={{ display: 'contents' }}>
        <AssessmentReady
          isAr={isAr}
          label={assessmentLabel}
          step={assessmentStep}
          domainId={assessmentDomainId}
          onStart={() => {}}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
        <SpeedMatchEngine
          mode="assess"
          level={1}
          seed={null}
          attempt={null}
          onResult={onAssessmentComplete}
          onExit={onAssessmentExit || onBack}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
          awardLadderWin={awardLadderWin}
          assessmentMode={true}
        />
      </div>
    );
  }

  return (
    <ModeShell
      storageKey="mm_speedmatch_v1"
      scienceId="speed-match"
      gameId="speed-match"
      title={{ en: 'Speed Match', ar: 'مطابقة سريعة' }}
      hints={{
        free: { en: 'Match symbols to numbers · keep the time bank full', ar: 'طابق الرموز بالأرقام · حافظ على خزان الوقت ممتلئاً' },
        levels: { en: '60 levels · one more symbol every 10', ar: '٦٠ مستوى · رمز إضافي كل ١٠ مستويات' },
        pass: { en: 'Same symbols for all · pass the device', ar: 'نفس الرموز للجميع · مرّر الجهاز' },
      }}
      ladder={{
        levels: LADDER_LEVELS,
        planetPath: true,
        bands: SPEED_MATCH_BANDS(isAr),
        sections: SPEED_MATCH_SECTIONS,
        help: SPEED_MATCH_HELP(isAr),
        sublabel: (lv) => speedMatchSublabel(lv, isAr),
      }}
      pass={{ trials: 1, scoreLabel: { en: 'matches', ar: 'مطابقة' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <SpeedMatchEngine
          key={`speed-match-${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
          awardLadderWin={awardLadderWin}
        />
      )}
    />
  );
}
