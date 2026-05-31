import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';

import CardSortModes from './CardSortModes';
import CardSortTutorial, { buildTutorialQueueFor, markTutorialSeen } from './tutorial';
import {
  WCST_REFERENCE_CARDS,
  WCST_LEVELS_PER_TIER,
  WCST_DIFF_KEYS,
  WCST_DM,
  WCST_FREE_LIVES,
  specificationForLevel,
  prepareFreeRunBlock,
  freeSortPoints,
  prepareAssessBlock,
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
  mergeWcstChallengeRow,
  compareChallengeRows,
  feedbackLabel,
  matchingDimensions,
} from './ruleSwitchData';
import { loadWcstProfile, saveWcstProfile } from './ruleSwitchProgress';
import AssessmentReady from '../../../../assessment/AssessmentReady';

const UI = {
  en: {
    hubFlex: 'Flexibility',
    hubTag: 'training',
    title: 'Card Sort',
    replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Free mode',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Pass n Play',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Sort by the rule shown · it keeps switching',
    hubNodeLevelsHint: '100 levels · cued rule switching',
    hubNodeChallengeHint: 'Same deck for all · highest flexibility wins',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Sort each card by the rule shown — the rule switches; adapt fast',
    diffDesc: {
      easy: 'Fewer switches, slower pace — ease in.',
      medium: 'Three rules, quicker switches.',
      hard: 'Rapid switches, tight timing.',
    },
    levelsSub: (pop) => `${pop} · ${WCST_LEVELS_PER_TIER} levels`,
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'Sort each card by the rule shown at the top (colour, shape, or number). After a streak the rule SWITCHES — let go of the old rule and follow the new one fast. This trains cognitive flexibility: adapting when the rule changes.',
    freeIntroReady: 'Ready',
    challengeTitle: '⚔️ Pass n Play',
    challengeSub: 'Same card sequence for everyone · highest flexibility wins',
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
    matchPrompt: 'Match the card — by Color? Shape? or Count?',
    dimLabel: { color: 'Color', shape: 'Shape', count: 'Number' },
    dimReminder: 'tap the matching pile',
    sortByLabel: 'SORT BY',
    cuedHint: 'Tap the pile that matches the card by the rule above.',
    shiftTitle: '⚡ Rule Changed!',
    shiftWas: (rule) => `Was: ${rule}`,
    shiftNow: (rule) => `Now sort by ${rule}`,
    shiftDiscover: 'Now discover the new rule...',
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
    sessionTime: (s) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${String(sec).padStart(2, '0')}`;
    },
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
    freeStages: (n) => `Correct sorts: ${n}`,
    freeBest: (n) => `Best sorts: ${n}`,
    freePlayAgain: 'Play again',
    resultsChalTitle: 'Pass n Play results',
    chalRes: (cfs, pe, cc) => `CFS ${cfs} · PE ${pe}% · CC ${cc}`,
    newCh: 'New game',
    levelHeader: (d, lv) => `${WCST_DM[d]?.label ?? d} · L${lv}`,
    levelMeta: (r, cc) => `switch every ${r} · ${cc} switches`,
    challengeHeader: 'Pass n Play',
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
    challengeMode: '⚔️ مرّر والعب',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'افرز حسب القاعدة المعروضة · وهي تتبدّل',
    hubNodeLevelsHint: '١٠٠ مستوى · تبديل قواعد معلن',
    hubNodeChallengeHint: 'نفس الطابور للجميع · أعلى مرونة يفوز',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'افرز كل بطاقة حسب القاعدة المعروضة — وهي تتبدّل؛ تكيّف بسرعة',
    diffDesc: {
      easy: 'تبديلات أقل وإيقاع أبطأ.',
      medium: '٣ قواعد وتبديلات أسرع.',
      hard: 'تبديلات سريعة وتوقيت ضيق.',
    },
    levelsSub: (pop) => `${pop} · ${WCST_LEVELS_PER_TIER} مستوى`,
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'افرز كل بطاقة حسب القاعدة المعروضة في الأعلى (اللون أو الشكل أو العدد). بعد سلسلة نجاحات تتبدّل القاعدة — اترك القديمة واتبع الجديدة بسرعة. هذا يدرّب المرونة الذهنية: التكيّف عند تغيّر القاعدة.',
    freeIntroReady: 'جاهز',
    challengeTitle: '⚔️ مرّر والعب',
    challengeSub: 'نفس تسلسل البطاقات للجميع · أعلى مرونة يفوز',
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
    matchPrompt: 'طابق البطاقة — بالون؟ بالشكل؟ أو بالعدد؟',
    dimLabel: { color: 'اللون', shape: 'الشكل', count: 'العدد' },
    dimReminder: 'اضغط الكومة المطابقة',
    sortByLabel: 'افرز حسب',
    cuedHint: 'اضغط الكومة التي تطابق البطاقة حسب القاعدة بالأعلى.',
    shiftTitle: '⚡ تغيّرت القاعدة!',
    shiftWas: (rule) => `كانت: ${rule}`,
    shiftNow: (rule) => `الآن افرز حسب ${rule}`,
    shiftDiscover: 'الآن اكتشف القاعدة الجديدة...',
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
    sessionTime: (s) => {
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return `${m}:${String(sec).padStart(2, '0')}`;
    },
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
    freeStages: (n) => `فرز صحيح: ${n}`,
    freeBest: (n) => `أفضل: ${n}`,
    freePlayAgain: 'العب مجددًا',
    resultsChalTitle: 'نتائج مرّر والعب',
    chalRes: (cfs, pe, cc) => `CFS ${cfs} · إصرار ${pe}% · فئات ${cc}`,
    newCh: 'لعبة جديدة',
    levelHeader: (d, lv) => `${WCST_DM[d]?.label ?? d} · ${lv}`,
    levelMeta: (r, cc) => `تبديل كل ${r} · ${cc} تبديلات`,
    challengeHeader: 'مرّر والعب',
    freeHeader: 'وضع حر',
    formulaHint: 'η = صحيح/المجموع · CFS يدمج η والفئات والإصرار',
  },
};

function WcstCardFace({ card, size = 'md' }) {
  const shapes = Array.from({ length: card.count }, (_, i) => i);
  return (
    <div className={`ct-wcst-card-face ct-wcst-card-face--${size}`}>
      <div className="ct-wcst-shapes">
        {shapes.map((i) => (
          <div
            key={i}
            className={`ct-wcst-shape ct-wcst-shape--${card.shape} ct-wcst-shape--${card.color} ct-wcst-shape--${size}`}
          />
        ))}
      </div>
    </div>
  );
}

function ReferencePile({ card, pileIndex, highlight, pressed, label, onPointerDown, onPointerUp }) {
  const hi =
    highlight === 'correct'
      ? ' ct-wcst-pile--correct'
      : highlight === 'wrong'
        ? ' ct-wcst-pile--wrong'
        : highlight === 'timeout'
          ? ' ct-wcst-pile--timeout'
          : '';
  const pr = pressed ? ' ct-wcst-pile--pressed' : '';
  return (
    <button
      type="button"
      className={`ct-wcst-pile${hi}${pr}`}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <WcstCardFace card={card} size="sm" />
      <span className="ct-wcst-pile-num">{pileIndex + 1}</span>
    </button>
  );
}

export default function RuleSwitchGame({ onBack, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  const [profile, setProfile] = useState(() => loadWcstProfile());
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [playStep, setPlayStep] = useState('idle');
  const [feedback, setFeedback] = useState(null);
  const [pickedPile, setPickedPile] = useState(null);
  const [showShift, setShowShift] = useState(false);
  const [feedbackDetail, setFeedbackDetail] = useState(null);
  const [shiftOldRule, setShiftOldRule] = useState(null);
  const [streakDisplay, setStreakDisplay] = useState(0);
  const [catsDisplay, setCatsDisplay] = useState(0);
  const [pressedPile, setPressedPile] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [freeLives, setFreeLives] = useState(WCST_FREE_LIVES);
  const [freeScore, setFreeScore] = useState(0);
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('hard');
  const chalDiffRef = useRef('hard');
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

  const freeStageRef = useRef(0);
  const freeBlocksRef = useRef(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const freeLivesRef = useRef(WCST_FREE_LIVES);
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
  const [frozenProbe, setFrozenProbe] = useState(null);
  const probe = frozenProbe || session?.probe;
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

  const clearPlayState = useCallback(() => {
    clearTimers();
    runIdRef.current += 1;
    blockRef.current = null;
    setPlayStep('idle');
    setPauseOpen(false);
    setQuitOpen(false);
    setShowShift(false);
    setShiftOldRule(null);
    setFeedbackDetail(null);
    setFrozenProbe(null);
    setChalTurnOpen(false);
    bump();
  }, [clearTimers]);

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

    const summary = summarizeWcst(resultsRef.current, b.session);
    const grade = gradeBlock(summary, b.diff, { freeMode: b.mode === 'free' });

    if (b.mode === 'assess') {
      playSfx('win');
      blockRef.current = null;
      onAssessmentComplete?.({ score: grade.cfs, line: `PE ${summary.persevPct}% · CC ${summary.categoriesCompleted}` });
      bump();
      return;
    }

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
          const newSeed = prepareChallengeSeed(chalDiffRef.current);
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
      // Endless cued free: the run only ends when lives reach zero.
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
  }, [clearTimers, persistLevel, playSfx, assessmentMode, onAssessmentComplete]);

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
    setFrozenProbe(null);
    setFeedback(null);
    setFeedbackDetail(null);
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
        setFrozenProbe(s.probe ? { ...s.probe } : null);
        setFeedback('timeout');
        playSfx('error');
        if (b.mode === 'free') {
          freeStreakRef.current = 0;
          freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
          setFreeLives(freeLivesRef.current);
          if (freeLivesRef.current <= 0) {
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
      setShiftOldRule(outcome.rule);
      setShowShift(true);
      setPlayStep('shift');
      playStepRef.current = 'shift';
      timersRef.current.push(
        setTimeout(() => {
          setShowShift(false);
          setShiftOldRule(null);
          setPlayStep('running');
          playStepRef.current = 'running';
          startTrialRef.current();
        }, 2200),
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
      setPressedPile(null);
      if (playStepRef.current !== 'running' || pauseRef.current) return;
      const b = blockRef.current;
      const s = b?.session;
      if (!s?.probe || respondedRef.current) return;

      respondedRef.current = true;
      clearTimers();
      runIdRef.current += 1;

      const currentProbe = { ...s.probe };
      const currentRule = activeRule(s);
      setFrozenProbe(currentProbe);
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

      const chosenRef = WCST_REFERENCE_CARDS[pileIndex];
      const dims = matchingDimensions(currentProbe, chosenRef);
      const frozenCorrectIdx = correctPileIndex(currentProbe, currentRule);
      if (outcome.correct) {
        setFeedbackDetail({ type: 'correct', dims, pileIndex, correctIdx: frozenCorrectIdx });
      } else {
        setFeedbackDetail({ type: 'wrong', dims, pileIndex, correctIdx: frozenCorrectIdx });
      }

      setStreakDisplay(outcome.streak);
      setCatsDisplay(outcome.categoriesCompleted);
      playSfx(outcome.correct ? 'click' : 'error');
      if (b.mode === 'free') {
        if (outcome.correct) {
          freeStreakRef.current += 1;
          freeBlocksRef.current += 1; // total correct sorts this run
          freeScoreRef.current += freeSortPoints(freeStreakRef.current);
          setFreeScore(freeScoreRef.current);
          // Gradual ramp: tighten the response window as the run grows.
          if (b.session && freeBlocksRef.current % 8 === 0) {
            b.session.responseLimitMs = Math.max(2500, b.session.responseLimitMs - 200);
          }
        } else {
          freeStreakRef.current = 0;
          freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
          setFreeLives(freeLivesRef.current);
          if (freeLivesRef.current <= 0) {
            bump();
            finishBlockRef.current();
            return;
          }
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
      startTrialRef.current();
      bump();
    },
    [clearTimers],
  );

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
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    freeLivesRef.current = WCST_FREE_LIVES;
    setFreeLives(WCST_FREE_LIVES);
    setFreeScore(0);
    setPhase('freeIntro');
  }, []);

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginBlock(prepareFreeRunBlock(seed));
  }, [playSfx, beginBlock]);

  const startLevelGame = useCallback(
    (diff, lv) => {
      const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
      beginBlock(prepareLevelBlock(diff, lv, seed));
    },
    [beginBlock],
  );

  const startAssessment = useCallback(() => {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginBlock(prepareAssessBlock(seed));
  }, [beginBlock]);

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      window.alert(t.needTwo);
      return;
    }
    clearPlayState();
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalDiffRef.current = chalDiff;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    const seed = prepareChallengeSeed(chalDiffRef.current);
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
    if (mode === 'assess') { (onAssessmentExit || onBack)?.(); return; }
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else if (mode === 'free') setPhase('hub');
    else setPhase('hub');
  };

  const rule = session ? activeRule(session) : 'color';
  const correctPile = feedbackDetail?.correctIdx ?? (probe ? correctPileIndex(probe, rule) : -1);

  return (
    <div className="ct-rswitch-root ct-wcst-root cancellation-task-game" dir={isAr ? 'rtl' : 'ltr'}>
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
            <div className="ct-fq-diff-body">
              <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
              <div className="ct-fq-diff-cards">
                {WCST_DIFF_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`ct-fq-db ct-fq-db-${k} ct-fq-db-training ct-fq-diffcard`}
                    onClick={() => {
                      playSfx('click');
                      setDiffKey(k);
                      setPhase('levels');
                    }}
                  >
                    <span className="ct-fq-diffcard-main">
                      <span className="ct-fq-diffcard-label">{WCST_DM[k].label}</span>
                      <span className="ct-fq-diffcard-desc">{t.diffDesc[k]}</span>
                    </span>
                    <span className="ct-fq-diffcard-meta">
                      <span className="ct-fq-diffcard-pop">{WCST_DM[k].pop}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
              <h3>{t.pickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.pickDiff}>
                {WCST_DIFF_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalDiff(k); }}
                  >
                    {WCST_DM[k].label}
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
                ? `${'♥'.repeat(Math.max(0, freeLives))}${'♡'.repeat(Math.max(0, WCST_FREE_LIVES - freeLives))} · ${t.score} ${freeScore}`
                : block.mode === 'assess'
                  ? `${t.trial(session.trialNumber, session.maxTrials)} · ${t.streak(streakDisplay, session.streakToSwitch)}`
                  : `${t.trial(session.trialNumber, session.maxTrials)} · ${t.streak(streakDisplay, session.streakToSwitch)} · ${t.categories(catsDisplay, session.categoriesToComplete)}`
            }
            playSfx={playSfx}
            onMenu={() => setQuitOpen(true)}
            onPause={() => setPauseOpen(true)}
            pauseAriaLabel={t.paused}
          />
          <p className="ct-wcst-play-hint">{t.cuedHint}</p>
          {(playStep === 'running' || playStep === 'shift') && probe && (
            <div className="ct-wcst-board">
              <div className={`ct-wcst-rule-banner ct-wcst-rule-banner--${rule}`}>
                <span className="ct-wcst-rule-banner-label">{t.sortByLabel}</span>
                <span className="ct-wcst-rule-banner-rule">{t.dimLabel[rule] || rule}</span>
              </div>
              <p className="ct-wcst-match-prompt">{t.dimReminder}</p>
              <div className="ct-wcst-streak-bar">
                <div
                  className="ct-wcst-streak-fill"
                  style={{ width: `${(streakDisplay / session.streakToSwitch) * 100}%` }}
                />
              </div>
              {session.categoriesToComplete <= 12 && (
                <div className="ct-wcst-hud-cats">
                  {Array.from({ length: session.categoriesToComplete }, (_, i) => (
                    <span
                      key={i}
                      className={`ct-wcst-cat-dot${i < catsDisplay ? ' ct-wcst-cat-dot--done' : ''}`}
                    />
                  ))}
                </div>
              )}
              <div className="ct-wcst-refs">
                {WCST_REFERENCE_CARDS.map((c, i) => {
                  let highlight = null;
                  if (feedback && playStep === 'running') {
                    if (feedback === 'correct' && i === correctPile) highlight = 'correct';
                    if (feedback === 'wrong' || feedback === 'timeout') {
                      if (i === pickedPile) highlight = feedback === 'timeout' ? 'timeout' : 'wrong';
                      if (i === correctPile) highlight = 'correct';
                    }
                  }
                  return (
                    <ReferencePile
                      key={c.id}
                      card={c}
                      pileIndex={i}
                      highlight={highlight}
                      pressed={pressedPile === i}
                      label={isAr ? `كومة ${i + 1}` : `Pile ${i + 1}`}
                      onPointerDown={(e) => {
                        setPressedPile(i);
                        onPickPile(i, e);
                      }}
                      onPointerUp={() => setPressedPile(null)}
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
                        : feedback === 'timeout'
                          ? ' ct-wcst-probe-card--bad'
                          : ''
                  }`}
                >
                  <WcstCardFace card={probe} size="lg" />
                </div>
                {feedback && playStep === 'running' && (
                  <div className="ct-wcst-feedback-wrap" role="status">
                    <p className={`ct-wcst-feedback ct-wcst-feedback--${feedback}`}>
                      {feedbackLabel(feedback === 'correct', isAr, feedback === 'timeout')}
                    </p>
                    {feedbackDetail && feedback !== 'timeout' && (
                      <p className={`ct-wcst-feedback-detail ct-wcst-feedback-detail--${feedback}`}>
                        {feedbackDetail.type === 'correct' && feedbackDetail.dims.length > 0
                          ? (isAr ? 'تطابق حسب ' : 'matched by ') +
                            feedbackDetail.dims.map((d) => t.dimLabel[d]).join(isAr ? ' و' : ' & ')
                          : feedbackDetail.type === 'wrong'
                            ? (isAr ? 'جرّب خاصية مختلفة' : 'try matching by a different property')
                            : null}
                      </p>
                    )}
                    {feedback === 'timeout' && (
                      <p className="ct-wcst-feedback-detail ct-wcst-feedback-detail--timeout">
                        {isAr ? 'أجب بسرعة أكبر' : 'respond faster next time'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {playStep === 'shift' && showShift && (
            <div className="ct-wcst-shift-overlay">
              <p className="ct-wcst-shift-title">{t.shiftTitle}</p>
              {shiftOldRule && (
                <p className="ct-wcst-shift-was">
                  {t.shiftWas(t.dimLabel[shiftOldRule] || shiftOldRule)}
                </p>
              )}
              <p className={`ct-wcst-shift-now ct-wcst-rule-banner--${rule}`}>
                {t.shiftNow(t.dimLabel[rule] || rule)}
              </p>
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
            freeScoreRef.current = 0;
            setFreeScore(0);
            freeStreakRef.current = 0;
            freeBlocksRef.current = 0;
            freeStageRef.current = 0;
            freeLivesRef.current = WCST_FREE_LIVES;
            setFreeLives(WCST_FREE_LIVES);
            const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
            beginBlock(prepareFreeRunBlock(seed));
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
