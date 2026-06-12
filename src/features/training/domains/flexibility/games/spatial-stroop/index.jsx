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
import { useCoach } from '../../../../shared/coach/useCoach';
import CoachOverlay from '../../../../shared/coach/CoachOverlay';
import { createTrialLog } from '../../../../shared/trialLog';
import { createStaircase } from '../../../../shared/staircase';

import StroopModes, { StroopTarget } from './StroopModes';
import { buildStroopCoachSteps } from './tutorialScript';
import {
  STROOP_LEVELS_PER_TIER,
  STROOP_DIFF_KEYS,
  STROOP_DM,
  STROOP_FREE_LIVES,
  STROOP_POWERUP_KEYS,
  BLITZ_EVERY_SWITCHES,
  COLOR_SIDE,
  specificationForLevel,
  prepareFreeRunBlock,
  freePoints,
  prepareAssessBlock,
  prepareLevelBlock,
  prepareChallengeSeed,
  prepareChallengeBlock,
  startStroopProbe,
  startBlitz,
  prepareTutorialBlock,
  advanceTutorialProbe,
  applyStroopAnswer,
  applyStroopTimeout,
  answerFor,
  isCongruent,
  activeRule,
  rtRating,
  summarizeStroop,
  gradeBlock,
  isStroopLevelUnlocked,
  mergeStroopChallengeRow,
  compareChallengeRows,
  feedbackLabel,
} from './spatialStroopData';
import { loadStroopProfile, saveStroopProfile } from './spatialStroopProgress';
import AssessmentReady from '../../../../assessment/AssessmentReady';

const POWERUP_ICON = { shield: '🛡️', slowmo: '⏱️', x2: '✨', freeze: '❄️' };
const POWERUP_LABEL = {
  en: { shield: 'Shield', slowmo: 'Slow-mo', x2: 'Double points', freeze: 'Freeze' },
  ar: { shield: 'درع', slowmo: 'إبطاء', x2: 'نقاط مضاعفة', freeze: 'تجميد' },
};

// First-time-per-rule "stop and learn" lessons when the rule switches.
const RULE_LESSON_KEY = 'mm_stroop_rule_lessons';
function loadTaughtRules() {
  try { return new Set(JSON.parse(localStorage.getItem(RULE_LESSON_KEY) || '[]')); } catch { return new Set(); }
}
function saveTaughtRules(set) {
  try { localStorage.setItem(RULE_LESSON_KEY, JSON.stringify([...set])); } catch { /* ignore */ }
}

/** Tiny diagram for a rule lesson: shows the stimulus and which side to tap. */
function RuleLessonArt({ rule }) {
  const cfg = {
    point: { left: null, right: '▶', correct: 'right', color: '#f3ead9' },
    side: { left: '▶', right: null, correct: 'left', color: '#f3ead9' },
    color: { left: '▶', right: null, correct: 'left', color: '#e0795f' },
  }[rule] || { correct: 'left' };
  const Zone = ({ side, arrow }) => {
    const ok = cfg.correct === side;
    return (
      <div style={{
        position: 'relative', flex: 1, height: 66, margin: 4, borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: ok ? '3px solid #36c46a' : '2px solid rgba(255,255,255,0.18)',
        background: ok ? 'rgba(54,196,106,0.16)' : 'rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: 36, color: arrow ? cfg.color : 'transparent', lineHeight: 1 }}>{arrow || '·'}</span>
        {ok && <span style={{ position: 'absolute', top: 3, insetInlineEnd: 6, fontSize: 14 }}>👆</span>}
      </div>
    );
  };
  return (
    <div style={{ display: 'flex', width: 'min(78vw, 300px)' }}>
      <Zone side="left" arrow={cfg.left} />
      <Zone side="right" arrow={cfg.right} />
    </div>
  );
}

const UI = {
  en: {
    hubFlex: 'Flexibility',
    hubTag: 'training',
    replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Free mode',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Pass n Play',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Power-ups · Blitz rounds · it speeds up',
    hubNodeLevelsHint: '100 levels · colour rule, flankers & reverses',
    hubNodeChallengeHint: 'Same arrows for all · highest flexibility wins',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Tap left or right by the rule shown — the rule flips; suppress the pull and adapt fast',
    diffDesc: {
      easy: 'Point/Sit only, slower — ease in.',
      medium: 'Adds the colour rule + flanker distractors.',
      hard: 'Adds reverse trials, rapid flips, heavy conflict.',
    },
    levelsSub: (pop) => `${pop} · ${STROOP_LEVELS_PER_TIER} levels`,
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'Tap LEFT or RIGHT by the rule on the banner — POINTS, SITS, or COLOUR. The rule keeps flipping. Build combos, grab power-ups, and survive Blitz bursts. Three misses ends the run.',
    freeIntroReady: 'Ready',
    challengeTitle: '⚔️ Pass n Play',
    challengeSub: 'Same arrow sequence for everyone · highest flexibility wins',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Fair seed each round · pass device between players',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same arrow order for every player this round',
    chalBulletPass: 'Start only when this player holds the device',
    handTo: (n) => `Hand device to ${n}.`,
    goReady: 'Start',
    chalMeta: 'Hard · L12 · interference block',
    tapByLabel: 'TAP BY',
    ruleLabel: { point: 'WHERE IT POINTS', side: 'WHERE IT SITS', color: 'MATCH THE COLOUR' },
    ruleShort: { point: 'POINTS', side: 'SITS', color: 'COLOUR' },
    cuedHint: 'Tap the side the rule asks for — ignore the other attributes.',
    reverseBadge: '⟳ REVERSE — tap the OPPOSITE',
    ansLeft: 'Left',
    ansRight: 'Right',
    rating: { perfect: 'PERFECT!', fast: 'FAST!', good: '' },
    blitzTitle: '⚡ BLITZ!',
    blitzSub: 'All conflict · double points',
    blitzTag: (n) => `⚡ BLITZ ×2 · ${n} left`,
    powerLabel: { shield: 'Shield', slowmo: 'Slow-mo', x2: 'Double', freeze: 'Freeze' },
    shieldSaved: '🛡️ Saved!',
    shiftTitle: '⚡ Rule Changed!',
    shiftWas: (rule) => `Was: ${rule}`,
    shiftNow: (rule) => `Now: ${rule}`,
    lessonContinue: 'Got it — continue',
    ruleLessons: {
      point: { title: 'New rule: WHERE IT POINTS', body: 'Tap the side the arrow POINTS to. Ignore where it sits and its colour.' },
      side: { title: 'New rule: WHERE IT SITS', body: 'Tap the side the arrow is ON — its position. Ignore the way it points.' },
      color: { title: 'New rule: MATCH THE COLOUR', body: 'Tap by colour: red → LEFT, green → RIGHT. Ignore where it points or sits.' },
    },
    trial: (n, max) => `Trial ${n} / ${max}`,
    streak: (s, r) => `Streak ${s}/${r}`,
    categories: (c, t) => `Switches ${c}/${t}`,
    paused: 'Paused',
    resume: 'Resume',
    restart: 'Restart block',
    quitMenu: 'Quit to menu',
    quitQ: 'Quit?',
    quitLose: 'This run will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    resultsPass: 'Level passed',
    resultsFail: 'Try again',
    stars: 'Stars',
    cfs: 'CFS (flexibility)',
    efficiency: 'Accuracy',
    interf: 'Interference',
    switchCost: 'Switch cost',
    persev: 'Perseverative %',
    cc: 'Switches done',
    meanRt: 'Mean RT',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    freeGameOver: 'Run ended',
    score: 'Score',
    freeStages: (n) => `Correct taps: ${n}`,
    freeBest: (n) => `Best taps: ${n}`,
    bestCombo: (n) => `Best combo: x${n}`,
    freePlayAgain: 'Play again',
    resultsChalTitle: 'Pass n Play results',
    chalRes: (cfs, pe, cc) => `CFS ${cfs} · PE ${pe}% · ${cc} switches`,
    newCh: 'New game',
    levelHeader: (d, lv) => `${STROOP_DM[d]?.label ?? d} · L${lv}`,
    challengeHeader: 'Pass n Play',
    freeHeader: 'Free mode',
  },
  ar: {
    hubFlex: 'مرونة',
    hubTag: 'تدريب',
    replayTutorial: 'إعادة الشرح',
    freeMode: '♾️ وضع حر',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ مرّر والعب',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'قدرات · جولات خاطفة · يتسارع',
    hubNodeLevelsHint: '١٠٠ مستوى · قاعدة اللون والمشتتات والعكس',
    hubNodeChallengeHint: 'نفس الأسهم للجميع · أعلى مرونة يفوز',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'اضغط يسار أو يمين حسب القاعدة — وهي تنقلب؛ اكبح الجذب وتكيّف بسرعة',
    diffDesc: {
      easy: 'الإشارة/المكان فقط، أبطأ.',
      medium: 'يضيف قاعدة اللون + مشتتات.',
      hard: 'يضيف محاولات معكوسة وانقلابات سريعة وتعارض قوي.',
    },
    levelsSub: (pop) => `${pop} · ${STROOP_LEVELS_PER_TIER} مستوى`,
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'اضغط يسار أو يمين حسب القاعدة على الشارة — الإشارة أو المكان أو اللون. القاعدة تنقلب باستمرار. اجمع السلاسل، التقط القدرات، وانجُ من الجولات الخاطفة. ثلاثة أخطاء تنهي المحاولة.',
    freeIntroReady: 'جاهز',
    challengeTitle: '⚔️ مرّر والعب',
    challengeSub: 'نفس تسلسل الأسهم للجميع · أعلى مرونة يفوز',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات',
    chalRoundsHint: 'بذرة عادلة · تمرير الجهاز',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس ترتيب الأسهم',
    chalBulletPass: 'ابدأ عندما يكون الجهاز معك',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ',
    chalMeta: 'صعب · L12 · كتلة تداخل',
    tapByLabel: 'اضغط حسب',
    ruleLabel: { point: 'جهة الإشارة', side: 'مكان الجلوس', color: 'طابق اللون' },
    ruleShort: { point: 'الإشارة', side: 'المكان', color: 'اللون' },
    cuedHint: 'اضغط الجانب الذي تطلبه القاعدة — وتجاهل بقية الخصائص.',
    reverseBadge: '⟳ عكس — اضغط العكس',
    ansLeft: 'يسار',
    ansRight: 'يمين',
    rating: { perfect: 'ممتاز!', fast: 'سريع!', good: '' },
    blitzTitle: '⚡ خاطفة!',
    blitzSub: 'كله تعارض · نقاط مضاعفة',
    blitzTag: (n) => `⚡ خاطفة ×2 · بقي ${n}`,
    powerLabel: { shield: 'درع', slowmo: 'إبطاء', x2: 'مضاعفة', freeze: 'تجميد' },
    shieldSaved: '🛡️ نجوت!',
    shiftTitle: '⚡ تغيّرت القاعدة!',
    shiftWas: (rule) => `كانت: ${rule}`,
    shiftNow: (rule) => `الآن: ${rule}`,
    lessonContinue: 'فهمت — متابعة',
    ruleLessons: {
      point: { title: 'قاعدة جديدة: جهة الإشارة', body: 'اضغط الجانب الذي يشير إليه السهم. تجاهل مكانه ولونه.' },
      side: { title: 'قاعدة جديدة: مكان الجلوس', body: 'اضغط الجانب الذي يوجد فيه السهم — موضعه. تجاهل اتجاه إشارته.' },
      color: { title: 'قاعدة جديدة: طابق اللون', body: 'اضغط حسب اللون: أحمر → يسار، أخضر → يمين. تجاهل اتجاهه وموضعه.' },
    },
    trial: (n, max) => `محاولة ${n} / ${max}`,
    streak: (s, r) => `متتالية ${s}/${r}`,
    categories: (c, t) => `تبديلات ${c}/${t}`,
    paused: 'متوقف',
    resume: 'متابعة',
    restart: 'إعادة الكتلة',
    quitMenu: 'خروج للقائمة',
    quitQ: 'خروج؟',
    quitLose: 'سيُلغى هذا السجل.',
    yesQuit: 'نعم',
    keep: 'متابعة',
    resultsPass: 'اجتزت المستوى',
    resultsFail: 'حاول مجددًا',
    stars: 'نجوم',
    cfs: 'CFS (مرونة)',
    efficiency: 'الدقة',
    interf: 'التداخل',
    switchCost: 'كلفة التبديل',
    persev: 'إصرار %',
    cc: 'تبديلات',
    meanRt: 'متوسط زمن الاستجابة',
    nextLv: 'التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    freeGameOver: 'انتهت المحاولة',
    score: 'نقاط',
    freeStages: (n) => `ضغطات صحيحة: ${n}`,
    freeBest: (n) => `أفضل: ${n}`,
    bestCombo: (n) => `أفضل سلسلة: ×${n}`,
    freePlayAgain: 'العب مجددًا',
    resultsChalTitle: 'نتائج مرّر والعب',
    chalRes: (cfs, pe, cc) => `CFS ${cfs} · إصرار ${pe}% · ${cc} تبديل`,
    newCh: 'لعبة جديدة',
    levelHeader: (d, lv) => `${STROOP_DM[d]?.label ?? d} · ${lv}`,
    challengeHeader: 'مرّر والعب',
    freeHeader: 'وضع حر',
  },
};

function AnswerButton({ side, label, glyph, colorCue, highlight, pressed, innerRef, onPointerDown, onPointerUp }) {
  const hi =
    highlight === 'correct'
      ? ' ct-stroop-ans--correct'
      : highlight === 'wrong'
        ? ' ct-stroop-ans--wrong'
        : highlight === 'timeout'
          ? ' ct-stroop-ans--timeout'
          : '';
  const pr = pressed ? ' ct-stroop-ans--pressed' : '';
  const cc = colorCue ? ` ct-stroop-ans--cue-${colorCue}` : '';
  return (
    <button
      ref={innerRef}
      type="button"
      className={`ct-stroop-ans ct-stroop-ans--${side}${hi}${pr}${cc}`}
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span className="ct-stroop-ans-glyph" aria-hidden="true">
        {glyph}
      </span>
    </button>
  );
}

function DeadlineRing({ ms, k }) {
  const R = 80;
  const C = 2 * Math.PI * R;
  return (
    <svg key={k} className="ct-stroop-ring" width="184" height="184" viewBox="0 0 184 184" aria-hidden="true">
      <circle className="ct-stroop-ring-track" cx="92" cy="92" r={R} />
      <circle
        className="ct-stroop-ring-fill"
        cx="92"
        cy="92"
        r={R}
        style={{
          strokeDasharray: C,
          strokeDashoffset: 0,
          ['--ring-c']: C,
          animation: `stroopRing ${ms}ms linear forwards`,
        }}
      />
    </svg>
  );
}

export default function SpatialStroopGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep }) {
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

  const [profile, setProfile] = useState(() => loadStroopProfile());
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [playStep, setPlayStep] = useState('idle');
  const [feedback, setFeedback] = useState(null);
  const [pickedSide, setPickedSide] = useState(null);
  const [showShift, setShowShift] = useState(false);
  const [ruleLesson, setRuleLesson] = useState(null); // {rule} when a first-time rule lesson is showing
  const taughtRulesRef = useRef(loadTaughtRules());
  const [showBlitz, setShowBlitz] = useState(false);
  const [feedbackDetail, setFeedbackDetail] = useState(null);
  const [shiftOldRule, setShiftOldRule] = useState(null);
  const [streakDisplay, setStreakDisplay] = useState(0);
  const [catsDisplay, setCatsDisplay] = useState(0);
  const [pressedSide, setPressedSide] = useState(null);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [freeLives, setFreeLives] = useState(STROOP_FREE_LIVES);
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
  const [coachActive, setCoachActive] = useState(false);
  const [, tick] = useState(0);

  // coach tutorial anchors
  const bannerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const pendingAfterCoachRef = useRef(null);

  // juice + power-up state
  const [combo, setCombo] = useState(0);
  const [ringMs, setRingMs] = useState(0);
  const [trialKey, setTrialKey] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [mods, setMods] = useState({ shield: false, slowmo: 0, x2: 0 });
  const [toast, setToast] = useState(null);

  const blockRef = useRef(null);
  const resultsRef = useRef([]);
  const trialLogRef = useRef(null);
  const respondedRef = useRef(false);
  const stimOnRef = useRef(0);
  const timersRef = useRef([]);
  const runIdRef = useRef(0);
  const playStepRef = useRef('idle');
  const pauseRef = useRef(false);
  const finishBlockRef = useRef(() => {});
  const startTrialRef = useRef(() => {});
  const currentLimitRef = useRef(2000);

  const freeBlocksRef = useRef(0);
  const freeScoreRef = useRef(0);
  const staircaseRef = useRef(null);
  const freeBaseLimitRef = useRef(2000);
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const freeLivesRef = useRef(STROOP_FREE_LIVES);
  const correctSinceRef = useRef(0);
  const inventoryRef = useRef([]);
  const shieldRef = useRef(false);
  const slowMoRef = useRef(0);
  const x2Ref = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);

  const doneMap = profile.done || {};
  const bump = () => tick((n) => n + 1);

  const block = blockRef.current;
  const session = block?.session;
  const [frozenProbe, setFrozenProbe] = useState(null);
  const probe = frozenProbe || session?.probe;
  const blitzActive = !!session?.blitzActive;

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

  useEffect(() => () => {
    clearTimers();
    trialLogRef.current?.discard();
  }, [clearTimers]);

  const resetJuice = useCallback(() => {
    comboRef.current = 0;
    bestComboRef.current = 0;
    correctSinceRef.current = 0;
    shieldRef.current = false;
    slowMoRef.current = 0;
    x2Ref.current = 0;
    inventoryRef.current = [];
    setCombo(0);
    setInventory([]);
    setMods({ shield: false, slowmo: 0, x2: 0 });
    setToast(null);
  }, []);

  const clearPlayState = useCallback(() => {
    clearTimers();
    runIdRef.current += 1;
    blockRef.current = null;
    setPlayStep('idle');
    setPauseOpen(false);
    setQuitOpen(false);
    setShowShift(false);
    setShowBlitz(false);
    setShiftOldRule(null);
    setRuleLesson(null);
    setFeedbackDetail(null);
    setFrozenProbe(null);
    setChalTurnOpen(false);
    bump();
  }, [clearTimers]);

  const flashToast = useCallback((text) => {
    setToast({ text, id: Date.now() });
    timersRef.current.push(setTimeout(() => setToast(null), 1100));
  }, []);

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
        congruencyEffect: summary.congruencyEffect,
        categoriesCompleted: summary.categoriesCompleted,
        ts: new Date().toISOString(),
      });
      if (grade.won) p.done[`${b.diff}-${b.lv}`] = true;
      saveStroopProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const finishBlock = useCallback(() => {
    const b = blockRef.current;
    if (!b?.session) return;
    clearTimers();

    const summary = summarizeStroop(resultsRef.current, b.session);
    const grade = gradeBlock(summary, b.diff, { freeMode: b.mode === 'free' });
    trialLogRef.current?.finish(
      b.mode === 'free'
        ? { blocksWon: freeBlocksRef.current, score: freeScoreRef.current, cfs: grade.cfs }
        : b.mode === 'assess'
          ? {
              cfs: grade.cfs,
              congruencyEffect: summary.congruencyEffect ?? null,
              switchCost: summary.switchCost ?? null,
              persevPct: summary.persevPct ?? null,
            }
          : { cfs: grade.cfs, won: grade.won },
    );
    trialLogRef.current = null;

    if (b.mode === 'assess') {
      playSfx('win');
      blockRef.current = null;
      onAssessmentComplete?.({
        score: grade.cfs,
        line: `Interference ${summary.congruencyEffect ?? '—'}ms · PE ${summary.persevPct}%`,
      });
      bump();
      return;
    }

    if (b.mode === 'challenge') {
      const idx = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      base[idx] = mergeStroopChallengeRow(base[idx], grade, summary, names[idx]);
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
        if (bestComboRef.current > (prev.bestCombo ?? 0)) {
          next = { ...next, bestCombo: bestComboRef.current };
          changed = true;
        }
        if (changed) saveStroopProfile(next);
        return changed ? next : prev;
      });
      awardFreeRun('stroop', Math.floor(freeBlocksRef.current / 5));
      setLastResult({
        type: 'free',
        blocksWon: freeBlocksRef.current,
        score: freeScoreRef.current,
        bestCombo: bestComboRef.current,
        summary,
        grade,
      });
      setPhase('freeRes');
      blockRef.current = null;
      bump();
      return;
    }

    playSfx(grade.won ? 'win' : 'error');
    if (grade.won) awardTrainingWin('stroop', b.diff, b.lv, STROOP_LEVELS_PER_TIER);
    persistLevel(b, summary, grade);
    setLastResult({ type: 'level', block: b, summary, grade });
    setPhase('res');
    blockRef.current = null;
    bump();
  }, [clearTimers, persistLevel, playSfx, onAssessmentComplete]);

  useEffect(() => {
    finishBlockRef.current = finishBlock;
  }, [finishBlock]);

  const advanceAfterFeedback = useCallback((outcome) => {
    const b = blockRef.current;
    if (!b) return;
    if (outcome.finished) {
      timersRef.current.push(setTimeout(() => finishBlockRef.current(), b.spec.feedbackMs));
      return;
    }
    // Free-mode Blitz trigger: every N switches, launch a forced-conflict burst.
    if (
      b.mode === 'free' &&
      outcome.categoryShift &&
      outcome.categoriesCompleted % BLITZ_EVERY_SWITCHES === 0
    ) {
      setShowBlitz(true);
      setPlayStep('shift');
      playStepRef.current = 'shift';
      playSfx('win');
      timersRef.current.push(
        setTimeout(() => {
          setShowBlitz(false);
          startBlitz(b.session);
          setPlayStep('running');
          playStepRef.current = 'running';
          startTrialRef.current();
        }, 1500),
      );
      return;
    }
    if (outcome.categoryShift) {
      const newRule = activeRule(b.session);
      const teach =
        (b.mode === 'free' || b.mode === 'level' || b.mode === 'challenge') &&
        !taughtRulesRef.current.has(newRule);
      setShiftOldRule(outcome.rule);
      setShowShift(true);
      setPlayStep('shift');
      playStepRef.current = 'shift';
      if (teach) {
        // Stop and teach the new rule; player resumes by acknowledging.
        setRuleLesson({ rule: newRule });
        playSfx('win');
        return;
      }
      timersRef.current.push(
        setTimeout(() => {
          setShowShift(false);
          setShiftOldRule(null);
          setPlayStep('running');
          playStepRef.current = 'running';
          startTrialRef.current();
        }, 1600),
      );
      return;
    }
    // Jittered ITI (assessment): a fixed rhythm lets players anticipate the
    // next onset; jitter keeps each RT stimulus-driven.
    const iti = b.spec.feedbackMs
      + (b.spec.itiJitterMs ? Math.floor(Math.random() * b.spec.itiJitterMs) : 0);
    timersRef.current.push(setTimeout(() => startTrialRef.current(), iti));
  }, [playSfx]);

  const loseLifeOrShield = useCallback(
    (b) => {
      // returns true if the run should end
      if (b.mode === 'free' && shieldRef.current) {
        shieldRef.current = false;
        setMods((m) => ({ ...m, shield: false }));
        flashToast(t.shieldSaved);
        return false; // shield preserves combo + life
      }
      comboRef.current = 0;
      setCombo(0);
      if (b.mode !== 'free') return false;
      freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
      setFreeLives(freeLivesRef.current);
      return freeLivesRef.current <= 0;
    },
    [flashToast, t.shieldSaved],
  );

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
    setPickedSide(null);
    setPlayStep('running');
    playStepRef.current = 'running';
    stimOnRef.current = performance.now();
    setStreakDisplay(s.streak);
    setCatsDisplay(s.categoriesCompleted);

    // effective deadline: blitz shortens, slow-mo lengthens (free mode)
    let limit = s.responseLimitMs;
    if (b.mode === 'free') {
      if (s.blitzActive) limit = Math.round(limit * 0.7);
      if (slowMoRef.current > 0) {
        limit = Math.round(limit * 1.6);
        slowMoRef.current -= 1;
        setMods((m) => ({ ...m, slowmo: slowMoRef.current }));
      }
    }
    currentLimitRef.current = limit;
    setRingMs(limit);
    setTrialKey((k) => k + 1);
    bump();

    if (b.mode === 'tutorial') return; // coach drives the tutorial; no deadline

    const runId = runIdRef.current;
    timersRef.current.push(
      setTimeout(() => {
        if (runIdRef.current !== runId || respondedRef.current || pauseRef.current) return;
        const rule = activeRule(s);
        const probeSnap = s.probe ? { ...s.probe } : null;
        const isPractice = b.mode === 'assess' && s.trialNumber < (s.practiceTrials || 0);
        if (!isPractice) {
          resultsRef.current.push({
            kind: 'answer',
            correct: false,
            timeout: true,
            rule,
            congruent: probeSnap ? isCongruent(probeSnap, rule) : undefined,
            isSwitchTrial: !!s.switchPending,
          });
          trialLogRef.current?.trial({
            ok: false,
            timeout: true,
            rule,
            cong: probeSnap ? isCongruent(probeSnap, rule) : undefined,
            sw: !!s.switchPending,
          });
        }
        setFrozenProbe(probeSnap);
        setFeedback('timeout');
        setFeedbackDetail({ correctSide: probeSnap ? answerFor(probeSnap, rule) : null, pickedSide: null });
        playSfx('error');
        if (b.mode === 'free') {
          const L = staircaseRef.current?.failure() ?? 0;
          s.responseLimitMs = Math.max(1150, freeBaseLimitRef.current - L * 28);
        }
        const end = loseLifeOrShield(b);
        if (end) {
          finishBlockRef.current();
          return;
        }
        const outcome = applyStroopTimeout(s);
        setStreakDisplay(0);
        bump();
        advanceAfterFeedback(outcome);
      }, limit),
    );
  }, [playSfx, advanceAfterFeedback, loseLifeOrShield]);

  useEffect(() => {
    startTrialRef.current = startTrial;
  }, [startTrial]);

  const onPickAnswer = useCallback(
    (side, e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      setPressedSide(null);
      if (playStepRef.current !== 'running' || pauseRef.current) return;
      const b = blockRef.current;
      const s = b?.session;
      if (!s?.probe) return;

      // Coached tutorial: gate on the correct side, let the player retry, no scoring.
      if (b.mode === 'tutorial') {
        if (respondedRef.current) return;
        respondedRef.current = true;
        clearTimers();
        const curProbe = { ...s.probe };
        const curRule = activeRule(s);
        const ok = answerFor(curProbe, curRule) === side;
        setPickedSide(side);
        setFeedbackDetail({ correctSide: answerFor(curProbe, curRule), pickedSide: side });
        setFeedback(ok ? 'correct' : 'wrong');
        playSfx(ok ? 'click' : 'error');
        if (ok) {
          coach.notify('answer', { side });
          timersRef.current.push(
            setTimeout(() => {
              advanceTutorialProbe(s);
              respondedRef.current = false;
              setFeedback(null);
              setFeedbackDetail(null);
              setPickedSide(null);
              bump();
            }, 650),
          );
        } else {
          timersRef.current.push(
            setTimeout(() => {
              respondedRef.current = false;
              setFeedback(null);
              setFeedbackDetail(null);
              setPickedSide(null);
              bump();
            }, 750),
          );
        }
        bump();
        return;
      }

      if (respondedRef.current) return;
      respondedRef.current = true;
      clearTimers();
      runIdRef.current += 1;

      const currentProbe = { ...s.probe };
      const wasBlitz = !!s.blitzActive;
      // Assessment opens with unscored practice trials — keep them out of the
      // results and the trial log so first-exposure noise can't move the score.
      const isPractice = b.mode === 'assess' && s.trialNumber < (s.practiceTrials || 0);
      setFrozenProbe(currentProbe);
      const rtMs = Math.max(0, Math.round(performance.now() - stimOnRef.current));
      const outcome = applyStroopAnswer(s, side);
      if (!isPractice) {
        resultsRef.current.push({
          kind: 'answer',
          correct: outcome.correct,
          rule: outcome.rule,
          perseverative: outcome.perseverative,
          congruent: outcome.congruent,
          isSwitchTrial: outcome.isSwitchTrial,
          rtMs,
          choice: side,
        });
        trialLogRef.current?.trial({
          rt: rtMs,
          ok: outcome.correct,
          rule: outcome.rule,
          cong: outcome.congruent,
          sw: outcome.isSwitchTrial,
          ...(outcome.perseverative ? { persev: true } : {}),
        });
      } else if (s.trialNumber >= (s.practiceTrials || 0)) {
        flashToast(isAr ? 'يبدأ الاحتساب الآن' : 'Scoring starts now');
      }

      setPickedSide(side);
      setFeedback(outcome.correct ? 'correct' : 'wrong');
      setFeedbackDetail({ correctSide: outcome.correctAns, pickedSide: side });
      setStreakDisplay(outcome.streak);
      setCatsDisplay(outcome.categoriesCompleted);

      if (outcome.correct) {
        comboRef.current += 1;
        if (comboRef.current > bestComboRef.current) bestComboRef.current = comboRef.current;
        setCombo(comboRef.current);
        const rating = rtRating(rtMs, currentLimitRef.current);
        playSfx('click');

        if (b.mode === 'free') {
          freeBlocksRef.current += 1;
          let pts = freePoints(comboRef.current) + rating.bonus;
          if (x2Ref.current > 0) {
            pts *= 2;
            x2Ref.current -= 1;
            setMods((m) => ({ ...m, x2: x2Ref.current }));
          }
          if (wasBlitz) pts *= 2;
          freeScoreRef.current += pts;
          setFreeScore(freeScoreRef.current);
          // 1-up-2-down staircase: deadline tightens after 2 straight correct,
          // relaxes after any miss → play converges on ~71% success.
          const L = staircaseRef.current?.success() ?? 0;
          s.responseLimitMs = Math.max(1150, freeBaseLimitRef.current - L * 28);
          // award a power-up periodically (not during blitz)
          if (!wasBlitz) {
            correctSinceRef.current += 1;
            if (correctSinceRef.current >= 6 && inventoryRef.current.length < 3) {
              correctSinceRef.current = 0;
              const pick = STROOP_POWERUP_KEYS[Math.floor(Math.random() * STROOP_POWERUP_KEYS.length)];
              inventoryRef.current = [...inventoryRef.current, pick];
              setInventory(inventoryRef.current);
              flashToast(`${(isAr ? POWERUP_LABEL.ar : POWERUP_LABEL.en)[pick]} +1`);
            }
          }
        }
      } else {
        playSfx('error');
        if (b.mode === 'free') {
          const L = staircaseRef.current?.failure() ?? 0;
          s.responseLimitMs = Math.max(1150, freeBaseLimitRef.current - L * 28);
        }
        const end = loseLifeOrShield(b);
        if (end) {
          bump();
          finishBlockRef.current();
          return;
        }
      }
      bump();
      advanceAfterFeedback(outcome);
    },
    [clearTimers, playSfx, advanceAfterFeedback, loseLifeOrShield, flashToast, isAr],
  );

  const activatePowerup = useCallback(
    (idx) => {
      if (playStepRef.current !== 'running' && playStepRef.current !== 'shift') return;
      const key = inventoryRef.current[idx];
      if (!key) return;
      playSfx('click');
      if (key === 'shield') {
        shieldRef.current = true;
        setMods((m) => ({ ...m, shield: true }));
      } else if (key === 'slowmo') {
        slowMoRef.current += 3;
        setMods((m) => ({ ...m, slowmo: slowMoRef.current }));
      } else if (key === 'x2') {
        x2Ref.current += 5;
        setMods((m) => ({ ...m, x2: x2Ref.current }));
      } else if (key === 'freeze') {
        clearTimers(); // remove the running deadline for the current trial
        flashToast(isAr ? POWERUP_LABEL.ar.freeze : POWERUP_LABEL.en.freeze);
      }
      inventoryRef.current = inventoryRef.current.filter((_, i) => i !== idx);
      setInventory(inventoryRef.current);
    },
    [playSfx, clearTimers, flashToast],
  );

  const beginBlock = useCallback(
    (b) => {
      clearTimers();
      runIdRef.current += 1;
      blockRef.current = b;
      resultsRef.current = [];
      trialLogRef.current?.discard();
      trialLogRef.current = b.mode === 'free' || b.mode === 'level' || b.mode === 'assess'
        ? createTrialLog({
            game: 'spatial-stroop',
            mode: b.mode,
            meta: b.mode === 'level' ? { diff: b.diff, lv: b.lv } : undefined,
          })
        : null;
      if (b.mode === 'free') {
        staircaseRef.current = createStaircase({ nDown: 2 });
        freeBaseLimitRef.current = b.session?.responseLimitMs ?? 2000;
      }
      startStroopProbe(b.session);
      setPauseOpen(false);
      setQuitOpen(false);
      setFeedback(null);
      setShowShift(false);
      setShowBlitz(false);
      setStreakDisplay(0);
      setCatsDisplay(0);
      comboRef.current = 0;
      bestComboRef.current = 0;
      correctSinceRef.current = 0;
      setCombo(0);
      setPhase('play');
      setPlayStep('running');
      playStepRef.current = 'running';
      startTrialRef.current();
      bump();
    },
    [clearTimers],
  );

  const coachSteps = useMemo(
    () => buildStroopCoachSteps(isAr, { bannerRef, leftRef, rightRef }),
    [isAr],
  );
  const finishCoach = useCallback(() => {
    try {
      localStorage.setItem('mm_stroop_coach_seen', '1');
    } catch {
      /* ignore */
    }
    setCoachActive(false);
    clearPlayState();
    const fn = pendingAfterCoachRef.current;
    pendingAfterCoachRef.current = null;
    if (fn) fn();
    else setPhase('hub');
  }, [clearPlayState]);
  const coach = useCoach(coachSteps, { active: coachActive, onDone: finishCoach });

  const startCoach = useCallback(
    (thenFn) => {
      pendingAfterCoachRef.current = thenFn || null;
      setCoachActive(true);
      beginBlock(prepareTutorialBlock());
    },
    [beginBlock],
  );
  const maybeCoach = useCallback(
    (fn) => {
      let seen = false;
      try {
        seen = !!localStorage.getItem('mm_stroop_coach_seen');
      } catch {
        /* ignore */
      }
      if (seen) fn();
      else startCoach(fn);
    },
    [startCoach],
  );

  const startFreeMode = useCallback(() => {
    freeBlocksRef.current = 0;
    freeScoreRef.current = 0;
    freeLivesRef.current = STROOP_FREE_LIVES;
    setFreeLives(STROOP_FREE_LIVES);
    setFreeScore(0);
    resetJuice();
    setPhase('freeIntro');
  }, [resetJuice]);

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    resetJuice();
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginBlock(prepareFreeRunBlock(seed));
  }, [playSfx, beginBlock, resetJuice]);

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
    flashToast(isAr ? 'تجربة أولاً — بدون احتساب' : 'Practice first — not scored');
  }, [beginBlock, flashToast, isAr]);

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
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlayState();
    if (mode === 'assess') {
      (onAssessmentExit || onBack)?.();
      return;
    }
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else setPhase('hub');
  };

  const rule = session ? activeRule(session) : 'point';
  const correctSide = feedbackDetail?.correctSide ?? (probe ? answerFor(probe, rule) : null);
  const awaitingAnswer =
    playStep === 'running' && !feedback && !showShift && !showBlitz && block?.mode !== 'tutorial';

  const sideHighlight = (sd) => {
    if (!feedback || playStep !== 'running') return null;
    if (feedback === 'correct') return sd === correctSide ? 'correct' : null;
    if (sd === correctSide) return 'correct';
    if (sd === pickedSide) return feedback === 'timeout' ? 'timeout' : 'wrong';
    return null;
  };
  const colorCueFor = (sd) => (rule === 'color' ? (sd === COLOR_SIDE.red ? 'red' : 'green') : null);

  return (
    <div className="ct-stroop-root cancellation-task-game" dir={isAr ? 'rtl' : 'ltr'}>
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
              onReplayTutorial={() => startCoach(null)}
              replayHint={t.replayTutorial}
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big">{t.hubFlex}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTag}</div>
                </div>
              }
            />
            <StroopModes
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

      {phase === 'diff' && (
        <TrainingDifficultySelect
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => setPhase('hub')}
          title={t.pickDiff}
          blurb={t.pickDiffSub}
          diffKeys={STROOP_DIFF_KEYS}
          dm={STROOP_DM}
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
          title={STROOP_DM[diffKey].label}
          blurb={t.levelsSub(STROOP_DM[diffKey].pop)}
          count={STROOP_LEVELS_PER_TIER}
          lvc={STROOP_DM[diffKey].lvc}
          isUnlocked={(lv) => isStroopLevelUnlocked(diffKey, lv, doneMap)}
          isDone={(lv) => !!doneMap[`${diffKey}-${lv}`]}
          sublabel={(lv) => {
            const sp = specificationForLevel(diffKey, lv);
            return `R${sp.streakToSwitch} · ${sp.categoriesToComplete}sw`;
          }}
          onPick={(lv) => startLevelGame(diffKey, lv)}
        />
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
              center={<div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div>}
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.pickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.pickDiff}>
                {STROOP_DIFF_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => {
                      playSfx('click');
                      setChalDiff(k);
                    }}
                  >
                    {STROOP_DM[k].label}
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
                  onClick={() => setChalNames([...chalNames, `Player ${chalNames.length + 1}`])}
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
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center', paddingTop: 48 }}>
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper" />
            <h2 style={{ fontFamily: isAr ? 'Cairo' : 'Fredoka One', marginTop: 24 }}>{t.freeIntroTitle}</h2>
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
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={t.chalMeta}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeBlock}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && block && session && !chalTurnOpen && (
        <div className={`ct-stroop-play-wrap${blitzActive ? ' ct-stroop-blitz-on' : ''}`}>
          <TrainingPlayHeader
            isAr={isAr}
            title={
              block.mode === 'tutorial'
                ? isAr ? 'كيفية اللعب' : 'How to play'
                : block.mode === 'free'
                  ? t.freeHeader
                  : block.mode === 'challenge'
                    ? t.challengeHeader
                    : t.levelHeader(block.diff, block.lv)
            }
            subtitle={
              block.mode === 'tutorial'
                ? ''
                : block.mode === 'free'
                ? `${'♥'.repeat(Math.max(0, freeLives))}${'♡'.repeat(Math.max(0, STROOP_FREE_LIVES - freeLives))} · ${t.score} ${freeScore}${blitzActive ? ` · ${t.blitzTag(session.blitzRemaining)}` : ''}`
                : block.mode === 'assess'
                  ? `${t.trial(session.trialNumber, session.maxTrials)} · ${t.streak(streakDisplay, session.streakToSwitch)}`
                  : `${t.trial(session.trialNumber, session.maxTrials)} · ${t.streak(streakDisplay, session.streakToSwitch)} · ${t.categories(catsDisplay, session.categoriesToComplete)}`
            }
            playSfx={playSfx}
            onMenu={block.mode === 'tutorial' ? () => coach.skip() : () => setQuitOpen(true)}
            onPause={block.mode === 'tutorial' ? undefined : () => setPauseOpen(true)}
            pauseAriaLabel={t.paused}
          />
          {(playStep === 'running' || playStep === 'shift') && probe && (
            <div className="ct-stroop-board">
              <div ref={bannerRef} className={`ct-stroop-rule-banner ct-stroop-rule--${rule}${probe.reverse ? ' ct-stroop-rule--reverse' : ''}`}>
                <span className="ct-stroop-rule-label">{t.tapByLabel}</span>
                <span className="ct-stroop-rule-rule">
                  {t.ruleLabel[rule]}
                  {rule === 'color' && (
                    <span className="ct-stroop-rule-colorkey">
                      <span className="ct-stroop-ckey ct-stroop-ckey--red">◀</span>
                      <span className="ct-stroop-ckey ct-stroop-ckey--green">▶</span>
                    </span>
                  )}
                </span>
                {probe.reverse && <span className="ct-stroop-reverse-badge">{t.reverseBadge}</span>}
              </div>
              <p className="ct-stroop-hint">{t.cuedHint}</p>
              <div className="ct-stroop-streak-bar">
                <div
                  className="ct-stroop-streak-fill"
                  style={{ width: `${Math.min(100, (streakDisplay / session.streakToSwitch) * 100)}%` }}
                />
              </div>
              {session.categoriesToComplete <= 12 && (
                <div className="ct-stroop-hud-cats">
                  {Array.from({ length: session.categoriesToComplete }, (_, i) => (
                    <span key={i} className={`ct-stroop-cat-dot${i < catsDisplay ? ' ct-stroop-cat-dot--done' : ''}`} />
                  ))}
                </div>
              )}
              <div className="ct-stroop-stage">
                <div className={`ct-stroop-zone ct-stroop-zone--left${probe.pos === 'left' ? ' is-here' : ''}`}>
                  {probe.pos === 'left' && (
                    <div className="ct-stroop-target-wrap">
                      {awaitingAnswer && <DeadlineRing ms={ringMs} k={trialKey} />}
                      <StroopTarget
                        probe={probe}
                        useColor={!!session.useColor}
                        state={feedback === 'correct' ? 'ok' : feedback === 'wrong' || feedback === 'timeout' ? 'bad' : ''}
                      />
                    </div>
                  )}
                </div>
                <div className="ct-stroop-zone-divider" aria-hidden="true" />
                <div className={`ct-stroop-zone ct-stroop-zone--right${probe.pos === 'right' ? ' is-here' : ''}`}>
                  {probe.pos === 'right' && (
                    <div className="ct-stroop-target-wrap">
                      {awaitingAnswer && <DeadlineRing ms={ringMs} k={trialKey} />}
                      <StroopTarget
                        probe={probe}
                        useColor={!!session.useColor}
                        state={feedback === 'correct' ? 'ok' : feedback === 'wrong' || feedback === 'timeout' ? 'bad' : ''}
                      />
                    </div>
                  )}
                </div>
              </div>
              {feedback && playStep === 'running' && (
                <div className="ct-stroop-feedback-wrap" role="status">
                  <p className={`ct-stroop-feedback ct-stroop-feedback--${feedback}`}>
                    {feedbackLabel(feedback === 'correct', isAr, feedback === 'timeout')}
                  </p>
                </div>
              )}
              <div className="ct-stroop-answers">
                <AnswerButton
                  side="left"
                  label={t.ansLeft}
                  glyph="◀"
                  innerRef={leftRef}
                  colorCue={colorCueFor('left')}
                  highlight={sideHighlight('left')}
                  pressed={pressedSide === 'left'}
                  onPointerDown={(e) => {
                    setPressedSide('left');
                    onPickAnswer('left', e);
                  }}
                  onPointerUp={() => setPressedSide(null)}
                />
                <AnswerButton
                  side="right"
                  label={t.ansRight}
                  glyph="▶"
                  innerRef={rightRef}
                  colorCue={colorCueFor('right')}
                  highlight={sideHighlight('right')}
                  pressed={pressedSide === 'right'}
                  onPointerDown={(e) => {
                    setPressedSide('right');
                    onPickAnswer('right', e);
                  }}
                  onPointerUp={() => setPressedSide(null)}
                />
              </div>
              {block.mode === 'free' && (
                <div className="ct-stroop-powerbar">
                  <div className="ct-stroop-powerslots">
                    {[0, 1, 2].map((i) => {
                      const key = inventory[i];
                      return (
                        <button
                          key={i}
                          type="button"
                          className={`ct-stroop-powerslot${key ? ' is-filled' : ''}`}
                          disabled={!key}
                          aria-label={key ? t.powerLabel[key] : 'empty'}
                          onClick={() => activatePowerup(i)}
                        >
                          {key ? POWERUP_ICON[key] : ''}
                        </button>
                      );
                    })}
                  </div>
                  <div className="ct-stroop-mods">
                    {mods.shield && <span className="ct-stroop-mod">🛡️</span>}
                    {mods.x2 > 0 && <span className="ct-stroop-mod">✨×{mods.x2}</span>}
                    {mods.slowmo > 0 && <span className="ct-stroop-mod">⏱️×{mods.slowmo}</span>}
                  </div>
                </div>
              )}
              {toast && <div key={toast.id} className="ct-stroop-toast">{toast.text}</div>}
            </div>
          )}
          {playStep === 'shift' && showShift && !ruleLesson && (
            <div className="ct-stroop-shift-overlay">
              <p className="ct-stroop-shift-title">{t.shiftTitle}</p>
              {shiftOldRule && <p className="ct-stroop-shift-was">{t.shiftWas(t.ruleShort[shiftOldRule] || shiftOldRule)}</p>}
              <p className={`ct-stroop-shift-now ct-stroop-rule--${rule}`}>{t.shiftNow(t.ruleShort[rule] || rule)}</p>
            </div>
          )}
          {playStep === 'shift' && ruleLesson && (
            <div className="ct-stroop-shift-overlay" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 22px' }}>
              <p className="ct-stroop-shift-title">{t.shiftTitle}</p>
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff2cf', textAlign: 'center', margin: 0 }}>
                {t.ruleLessons[ruleLesson.rule]?.title}
              </p>
              <RuleLessonArt rule={ruleLesson.rule} />
              <p style={{ fontSize: '0.9rem', color: '#e8dcc6', textAlign: 'center', maxWidth: 300, margin: 0, lineHeight: 1.45 }}>
                {t.ruleLessons[ruleLesson.rule]?.body}
              </p>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                onClick={() => {
                  playSfx('click');
                  const r = ruleLesson.rule;
                  taughtRulesRef.current.add(r);
                  saveTaughtRules(taughtRulesRef.current);
                  setRuleLesson(null);
                  setShowShift(false);
                  setShiftOldRule(null);
                  setPlayStep('running');
                  playStepRef.current = 'running';
                  startTrialRef.current();
                }}
              >
                {t.lessonContinue}
              </button>
            </div>
          )}
          {playStep === 'shift' && showBlitz && (
            <div className="ct-stroop-shift-overlay ct-stroop-blitz-overlay">
              <p className="ct-stroop-blitz-title">{t.blitzTitle}</p>
              <p className="ct-stroop-blitz-sub">{t.blitzSub}</p>
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
            <div className="ct-stroop-results-grid">
              <div className="ct-stroop-stat">
                <div className="ct-stroop-stat-n">{lastResult.grade.cfs}</div>
                <div className="ct-stroop-stat-l">{t.cfs}</div>
              </div>
              <div className="ct-stroop-stat">
                <div className="ct-stroop-stat-n">{lastResult.summary.efficiencyPct}%</div>
                <div className="ct-stroop-stat-l">{t.efficiency}</div>
              </div>
              <div className="ct-stroop-stat">
                <div className="ct-stroop-stat-n">
                  {lastResult.summary.congruencyEffect != null ? `${lastResult.summary.congruencyEffect}ms` : '—'}
                </div>
                <div className="ct-stroop-stat-l">{t.interf}</div>
              </div>
              <div className="ct-stroop-stat">
                <div className="ct-stroop-stat-n">
                  {lastResult.summary.switchCost != null ? `${lastResult.summary.switchCost}ms` : '—'}
                </div>
                <div className="ct-stroop-stat-l">{t.switchCost}</div>
              </div>
              <div className="ct-stroop-stat">
                <div className="ct-stroop-stat-n">{lastResult.summary.persevPct}%</div>
                <div className="ct-stroop-stat-l">{t.persev}</div>
              </div>
              <div className="ct-stroop-stat">
                <div className="ct-stroop-stat-n">
                  {lastResult.summary.categoriesCompleted}/{lastResult.summary.categoriesTarget}
                </div>
                <div className="ct-stroop-stat-l">{t.cc}</div>
              </div>
              <div className="ct-stroop-stat ct-stroop-stat--wide">
                <div className="ct-stroop-stat-n">
                  {lastResult.summary.meanRt != null ? `${lastResult.summary.meanRt} ms` : '—'}
                </div>
                <div className="ct-stroop-stat-l">{t.meanRt}</div>
              </div>
            </div>
            <div className="ct-fq-row">
              {lastResult.grade.won && lastResult.block.lv < STROOP_LEVELS_PER_TIER && (
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
              center={<div className="ct-fq-training-title ct-fq-training-title-sm">{t.freeGameOver}</div>}
            />
            <div className="ct-fq-sbig">{lastResult.score ?? 0}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.freeStages(lastResult.blocksWon)}</p>
            <p className="ct-fq-sub ct-fq-training-blurb">{t.bestCombo(Math.max(lastResult.bestCombo || 0, profile.bestCombo || 0))}</p>
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
              center={<div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div>}
            />
            {[...lastResult.rows].sort(compareChallengeRows).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">{t.chalRes(row.cfs, row.persevPct, row.last?.categoriesCompleted ?? 0)}</div>
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
        labels={{ paused: t.paused, resume: t.resume, restart: t.restart, quitMenu: t.quitMenu }}
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
            freeBlocksRef.current = 0;
            freeLivesRef.current = STROOP_FREE_LIVES;
            setFreeLives(STROOP_FREE_LIVES);
            resetJuice();
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
        labels={{ quitQ: t.quitQ, quitLose: t.quitLose, yesQuit: t.yesQuit, keep: t.keep }}
        onConfirmQuit={confirmQuit}
        onKeepPlaying={() => setQuitOpen(false)}
      />

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
