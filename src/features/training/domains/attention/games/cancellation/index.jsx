import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import PlayHud, { ShapeSvg } from '../../../../shared/PlayHud';
import PlayResults from '../../../../shared/PlayResults';
import GamePiece from '../../../../shared/GamePiece';
import {
  shapeArtLabel,
  shapeArtSetForRound,
  shapeArtUrl,
  shapesAreArtSafe,
} from '../../../../shared/shapeArt';
import { createStaircase } from './staircase';
import { useApp } from '../../../../../../context/AppContext';
import { loadJson, saveJson } from '../../../../../../lib/storage';
import {
  SH,
  DM,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  prepareFreeRound,
  freeStageToDiffLv,
  computeRoundStats,
  isLevelUnlocked,
  getLvCfg,
  loadGameSettings,
  FREE_LIVES,
  freeRoundErrorCap,
  freeTapPoints,
  freeRoundClearPoints,
  freeWrongTapPenalty,
  PASS_PLAY_CONFIG,
  PLAY_BOARD,
  FQ_DIFF_KEYS,
  FQ_LEVELS_PER_TIER,
  FQ_LADDER_LEVELS,
  ladderToTier,
  ladderLvCfg,
  fqMigrateLadderReached,
} from '../../../../shared/focusQuestData';
import {
  TrainingMenuBar,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import ModePlanetHub from '../../../../shared/ModePlanetHub';
import HubScienceLink from '../../../../shared/HubScienceLink';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { createTrialLog } from '../../../../shared/trialLog';
import { useTrainingTutorial } from '../../../../shared/tutorials/useTrainingTutorial';
import { TUTORIAL_UI } from '../../../../shared/tutorials/tutorialContent';
import CancelTaskCoach from './CancelTaskCoach';
import {
  prepareAssessmentTrial,
  computeAssessmentSummary,
  saveAssessSession,
  loadAssessHistory,
  compositeBand,
  ASSESSMENT_PROTOCOL,
} from './assessmentData';
import { loadAssessProfile } from '../../../../assessment/assessmentProfile';
import AssessmentReady from '../../../../assessment/AssessmentReady';
import { STR_COMMON } from '../../../../shared/trainingStrings';

// The board. 2D since the 3D scene was retired — it drew a flat, face-on board
// through WebGL because this task cannot take perspective without invalidating
// its own metrics. See the header of CancelBoard2D.jsx.
import CancelBoard2D from './CancelBoard2D';

/** Merge one challenge pass into running per-player aggregates (avg IES/time/etc., total errors). */
function mergeChallengePlayerStats(prev, stats, errCount, nm) {
  const snap = { ...stats, errors: errCount };
  const rounds = [...(prev?.rounds || []), snap];
  const n = rounds.length;
  let iesSum = 0;
  let timeSum = 0;
  let accSum = 0;
  let avgRtSum = 0;
  let tpsSum = 0;
  let scoreSum = 0;
  let errSum = 0;
  for (const r of rounds) {
    iesSum += r.ies;
    timeSum += r.timeUsed;
    accSum += r.acc;
    avgRtSum += r.avgRt;
    tpsSum += r.tps;
    scoreSum += r.score;
    errSum += r.errors;
  }
  return {
    nm,
    rounds,
    ies: +(iesSum / n).toFixed(1),
    timeUsed: +(timeSum / n).toFixed(1),
    errors: errSum,
    acc: Math.round(accSum / n),
    avgRt: Math.round(avgRtSum / n),
    tps: +(tpsSum / n).toFixed(3),
    score: +(scoreSum / n).toFixed(1),
  };
}

const PROFILE_KEY = 'mm_cancel_fq_v1';

function loadProfile() {
  const parsed = loadJson(PROFILE_KEY);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return {
      tel: Array.isArray(parsed.tel) ? parsed.tel : [],
      done: parsed.done && typeof parsed.done === 'object' ? parsed.done : {},
      freeBest: parsed.freeBest ?? 0,
      freeBestScore: parsed.freeBestScore ?? 0,
    };
  }
  return { tel: [], done: {}, freeBest: 0, freeBestScore: 0 };
}

function saveProfile(p) {
  // Persistence is optional. A full/blocked localStorage must never strand the
  // player on a cleared board before the result screen can render.
  saveJson(PROFILE_KEY, p);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const PREMIUM_TRAINING_MODES = new Set(['free', 'level', 'challenge']);

/*
 * Two independent conditions, both required.
 *
 * 1. MODE — assessment and adaptive keep the controlled abstract stimuli so
 *    their longitudinal scores stay comparable.
 * 2. READABILITY — the objects actually on this board must be tellable apart.
 *    Derived from the live cells rather than from the pool's tier name, so it
 *    cannot drift when the level data is edited: whatever the curriculum does
 *    next, a board whose shapes collide as illustrations falls back to geometry
 *    automatically. This is what keeps the hard tiers playable, where six of the
 *    near-identical silhouettes all became planets.
 */
function usesPremiumTrainingArt(round, cells) {
  if (!PREMIUM_TRAINING_MODES.has(round?.mode)) return false;
  if (!Array.isArray(cells) || !cells.length) return false;
  return shapesAreArtSafe(new Set(cells.map((cell) => cell.shape)));
}

function CancellationTarget({ round, cells, size, isAr }) {
  const shape = round.target in SH
    ? round.target
    : cells.find((cell) => cell.isT)?.shape || 'circle';
  const color = round.targetCol || cells.find((cell) => cell.isT)?.fill || 'var(--game-ink)';
  const artSet = shapeArtSetForRound(round);
  const artUrl = usesPremiumTrainingArt(round, cells) ? shapeArtUrl(shape, artSet) : null;
  if (artUrl) {
    return (
      <GamePiece
        shape={shape}
        color={color}
        size={size}
        artUrl={artUrl}
        reduced
        ariaLabel={shapeArtLabel(shape, isAr, artSet)}
      />
    );
  }
  return <ShapeSvg shape={shape} color={color} size={size} />;
}

// Parse each shape's SVG markup into a real React element ONCE (cached), so the
// shape is rendered as a React-managed SVG child instead of being injected as an
// HTML string. Injecting markup with `dangerouslySetInnerHTML` on an <svg> node
// is the source of the intermittent "empty square / empty target" bug: setting
// `.innerHTML` on an SVG element during React reconciliation can occasionally
// leave a tile with no rendered shape. Proper React SVG children always render.


/** Universe constellation — 3 main mode planets + small 3D satellite. */
function FqAttentionLightModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  // The game is now 3D everywhere — no separate "3D" tile; each mode is 3D.
  const items = [
    { k: 'free', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree },
    { k: 'levels', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels },
    { k: 'chal', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge },
  ];
  return <ModePlanetHub items={items} isAr={isAr} playSfx={playSfx} />;
}

/**
 * Single consolidated play bar: back · target chip · live stats · pause, then
 * one slim time bar. Replaces the old stacked header + stats row + cue band +
 * two progress bars so the grid (the real task) gets the vertical space.
 * Owns its own rAF tick so the shape grid is not repainted every frame.
 */

/** One metric tile on the assessment results screen, with a colour band chip. */
function AssessMetricTile({ value, label, sub, band, bandLabel }) {
  return (
    <div className={`ct-fq-rmi ct-fq-assess-tile${band ? ` ct-fq-band-${band}` : ''}`}>
      <div className="ct-fq-rv">{value}</div>
      <div className="ct-fq-rl">{label}</div>
      {sub ? <div className="ct-fq-assess-tile-sub">{sub}</div> : null}
      {band ? <span className={`ct-fq-band-chip ct-fq-band-chip-${band}`}>{bandLabel}</span> : null}
    </div>
  );
}

const UI = {
  en: {
    ...STR_COMMON.en,
    back: '‹ BACK',
    title: 'CANCELLATION',
    subtitle: 'Selective attention & inhibition',
    freeMenuSub:
      'Endless rounds that ramp up · one life · the run ends if time runs out or you make too many wrong taps · score from taps, clears & streaks',
    freeStrikes: 'Errors',
    freeLvlLabel: (tier, lv) => `Survival · ${tier} ${lv}`,
    freeRoundsCleared: (n) => `Rounds cleared: ${n}`,
    roundsClearedLabel: 'Rounds cleared',
    freeBest: (n) => `Best clears: ${n}`,
    freeBestScoreLine: (n) => `Best score: ${n}`,
    freeIntroBody:
      'Endless practice that keeps getting harder. You have one life. Each round has its own timer — clear every target before it runs out. Run out of time, or make too many wrong taps in a round, and the run is over. Score on correct taps and full clears; streaks of clears multiply the bonus.',
    hubChamberKicker: '⟡ FOCUS QUEST ⟡',
    hubAttentionWord: 'Cancellation task',
    hubTrainingTag: 'training',
    resultsLevelPass: 'Level passed',
    resultsLevelRetryTitle: 'Try again',
    hubMapAria: 'Modes map — choose a path',
    hubNodeFreeHint: 'Endless · one life · ramps up',
    hubNodeLevelsHint: '60 levels · one ladder · unlock in order',
    hubNodeChallengeHint: 'Same board for all · pick a difficulty',
    mode3d: '3D',
    hubNode3dHint: 'Prototype · same task in a 3D arena',
    thresholdMode: 'Threshold test',
    hubNodeThresholdHint: 'Adaptive · finds your level',
    adaptIntroTitle: 'Adaptive threshold',
    adaptIntroBody:
      'The board gets harder after two clean clears and easier after a miss, zeroing in on the hardest level you can reliably handle (~70% success). About 10–14 short rounds, no feedback during a round — just clear every target before time runs out. You get a single threshold score at the end.',
    adaptResTitle: 'Your threshold',
    adaptResLabel: 'Attention threshold',
    adaptResSub: '0–100',
    adaptResLevel: (tier, lv) => `${tier} · level ${lv}`,
    adaptResMeta: (tr, rev) => `${tr} rounds · ${rev} reversals`,
    adaptRoundLabel: (n) => `Round ${n}`,
    adaptAgain: 'Test again',
    menuHint: 'Visual search training: bind features, suppress distractors, and respond quickly—like lab tasks for attention and cognitive control.',
    pickDiff: 'Choose Difficulty',
    pickDiffSub: 'Each tier has 100 levels — unlock them in order.',
    diffDesc: {
      /* These describe the levers that actually escalate, and nothing else.
         They have been wrong twice: they promised "near-identical shapes" after
         the pools were rebuilt motif-distinct, then "match the object and its
         colour" after the colour conjunction was retired (2026-08-09). Colour
         is now interference, never the answer — the target is always an object. */
      easy: 'A few clearly different objects — find the target fast.',
      medium: 'More object types, and some share the target colour.',
      hard: 'A big, crowded grid — more objects and more of them to find.',
    },
    diffTargets: 'targets',
    diffGrid: 'grid',
    levelsSub: (pop, g) => `${pop} · ${g} board · Levels 1–100`,
    levelsBack: '← Back',
    challengeSub: 'Same board for everyone · pick a difficulty · pass the device · best score wins',
    ready: (n) => `Ready — ${n}`,
    goReady: 'Start round',
    chalBulletSame: 'Same grid for every player this round',
    hubMenu: 'Same grid, fair compare.',
    found: 'Found',
    err: 'Errors',
    lvl: 'Level',
    pause: 'Pause',
    quit: 'Quit',
    restart: 'Restart level',
    quitLose: 'Progress on this round will be lost.',
    chalRoundsHint: 'Each player plays once per round · New fair grid each round',
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s avg · ${e} err total · ${a}% · ${tp} t/s`
        : `${t}s · ${e} err · ${a}% · ${tp} t/s`,
    efficiency: 'Efficiency score',
    efficiencyHint: 'Higher is better · combines speed and accuracy',
    targetsFound: 'Targets found',
    accuracy: 'Accuracy',
    timeRanOut: 'Time ran out',
    rt: 'Avg RT',
    countdownHint: 'Get ready…',
    survivalCueTitle: 'Your target',
    survivalCueTask: 'Find every tile showing this object.',
    survivalCueReady: 'READY · START',
    survivalCueHint: 'Take a good look. The timer starts only when you tap.',
    fixHint: 'Focus on the centre…',
    cueShape: 'Tap every tile that shows this object.',
    assessMode: '📊 Assessment',
    hubNodeAssessHint: 'Standardized test · track your attention',
    assessIntroTitle: 'Attention Assessment',
    assessIntroBody:
      'A standardized 4-trial Mesulam-style cancellation test (~4 min). A short unscored practice board comes first. Then each trial shows a fresh 7×7 board — find every matching tile within 50 seconds. Work quickly but accurately; wrong taps and missed targets both count.',
    assessIntroMeasures: 'It measures selective attention, processing speed, response inhibition, and attentional stability (how consistent your reaction times are).',
    assessIntroNote:
      'Self-referenced, not diagnostic. For a fair comparison, avoid immediate repeats and use the same device, posture, lighting, and similar time of day.',
    assessStart: 'Start assessment',
    assessPracticeLabel: 'Practice',
    assessThreshold: '🎚️ Adaptive threshold test',
    assessTrialLabel: (n, m) => `Trial ${n} / ${m}`,
    assessResTitle: 'Your results',
    assessIndex: 'Attention Index',
    assessIndexSub: 'Composite · 0–100',
    mDetection: 'Detection',
    mDetectionSub: 'targets found',
    mPrecision: 'Precision',
    mPrecisionSub: 'taps correct',
    mSpeed: 'Speed',
    mSpeedSub: 'targets/sec',
    mRt: 'Reaction',
    mRtSub: 'avg ms',
    mStability: 'Stability',
    mStabilitySub: 'RT consistency',
    mErrors: 'Errors',
    mErrorsSub: 'miss · false',
    mDPrime: 'Sensitivity',
    mDPrimeSub: 'd′ · signal vs noise',
    mBias: 'Response bias',
    mBiasSub: (lbl) => `criterion c · ${lbl}`,
    biasCautious: 'cautious',
    biasBalanced: 'balanced',
    biasImpulsive: 'impulsive',
    mBalance: 'Spatial balance',
    balanceLeft: 'leftward',
    balanceEven: 'even',
    balanceRight: 'rightward',
    scanL: 'starts L',
    scanR: 'starts R',
    scanMid: 'starts center',
    mBalanceSub: (dir, scan) => `${dir} · ${scan}`,
    mOrg: 'Search order',
    mOrgSub: (r) => `best R ${r}`,
    bandHigh: 'Strong',
    bandMid: 'Typical',
    bandLow: 'Developing',
    assessAgain: 'Test again',
    assessViewHistory: '📈 History',
    assessHistTitle: 'Assessment history',
    assessNoHistory: 'No sessions yet — run an assessment to start tracking.',
    assessHistBest: (n) => `Best index: ${n}`,
    assessHistRecent: 'Recent sessions',
    assessVsPrev: (d) => (d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : '— 0'),
    sciTitle: 'Why this trains your brain',
    sciParas: [
      'This is a cancellation task — one of the most validated attention paradigms in neuropsychology (Mesulam symbol cancellation), used to measure selective and sustained attention, processing speed, and inhibitory control.',
      'Difficulty follows visual-search theory: Easy/Medium are feature search (Treisman & Gelade, 1980); Hard is conjunction search where you must bind shape and colour (Wolfe, Guided Search). Per-level time limits are derived from published search-slope estimates.',
      'Scoring uses real psychometrics: Inverse Efficiency Score (Townsend & Ashby, 1983) and Rate-Correct Score (Woltz & Was, 2006), with reaction-time trimming (Whelan, 2008). Reaction-time variability is included because elevated intra-individual variability is a robust marker of attentional lapses (Castellanos, 2005).',
      'Honest limits: practice reliably improves performance on this task and on visual search; broad "far transfer" to everyday attention is debated in the literature (Simons et al., 2016). Use this to train and track these specific skills — not as a medical test.',
    ],
    sciClose: 'Close',
  },
  ar: {
    ...STR_COMMON.ar,
    back: '‹ رجوع',
    title: 'مهمة الإلغاء',
    subtitle: 'انتباه انتقائي وكبح استجابي',
    freeMenuSub:
      'جولات لا تنتهي وتزداد صعوبة · روح واحدة · تنتهي المحاولة إذا نفد الوقت أو أكثرت النقر الخاطئ في الجولة · النقاط للمسات والإكمال والسلسلة',
    freeStrikes: 'أخطاء',
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    freeRoundsCleared: (n) => `جولات ناجحة: ${n}`,
    roundsClearedLabel: 'جولات مكتملة',
    freeBest: (n) => `أفضل إكمال: ${n}`,
    freeBestScoreLine: (n) => `أفضل نقاط: ${n}`,
    freeIntroBody:
      'تدريب لا ينتهي ويزداد صعوبة باستمرار. لديك روح واحدة. لكل جولة مؤقتها الخاص — أكمل كل الأهداف قبل نفاده. إذا نفد الوقت أو أكثرت النقر الخاطئ في الجولة تنتهي المحاولة. اجمع النقاط باللمسات الصحيحة وإكمال الجولات؛ السلاسل تضاعف المكافأة.',
    hubChamberKicker: '⟡ مهمة التركيز ⟡',
    hubAttentionWord: 'مهمة الشطب',
    hubTrainingTag: 'تدريب',
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetryTitle: 'حاول مجددًا',
    hubMapAria: 'خريطة الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'لا ينتهي · حياة واحدة · يزداد صعوبة',
    hubNodeLevelsHint: '٦٠ مستوى · سلّم واحد · بالترتيب',
    hubNodeChallengeHint: 'نفس اللوحة للجميع · اختر الصعوبة',
    mode3d: 'ثلاثي الأبعاد',
    hubNode3dHint: 'نموذج · نفس المهمة في ساحة ثلاثية الأبعاد',
    thresholdMode: 'اختبار العتبة',
    hubNodeThresholdHint: 'تكيّفي · يحدّد مستواك',
    adaptIntroTitle: 'العتبة التكيّفية',
    adaptIntroBody:
      'تزداد اللوحة صعوبة بعد إكمالين نظيفين وتسهُل بعد أي خطأ، لتستقر عند أصعب مستوى يمكنك إتقانه باستمرار (نجاح ~٧٠٪). نحو ١٠–١٤ جولة قصيرة، بلا تغذية راجعة أثناء الجولة — فقط أكمل كل الأهداف قبل نفاد الوقت. تحصل على درجة عتبة واحدة في النهاية.',
    adaptResTitle: 'عتبتك',
    adaptResLabel: 'عتبة الانتباه',
    adaptResSub: '٠–١٠٠',
    adaptResLevel: (tier, lv) => `${tier} · مستوى ${lv}`,
    adaptResMeta: (tr, rev) => `${tr} جولات · ${rev} انعكاسات`,
    adaptRoundLabel: (n) => `جولة ${n}`,
    adaptAgain: 'أعد الاختبار',
    menuHint: 'تدريب بحث بصري: ربط السمات، كبح المشتتات، والاستجابة بسرعة—كمهام الانتباه في العلوم المعرفية.',
    pickDiffSub: 'كل صعوبة ١٠٠ مستوى · افتحها بالترتيب.',
    diffDesc: {
      easy: 'أجسام قليلة ومختلفة بوضوح — اعثر على الهدف بسرعة.',
      medium: 'أنواع أكثر، وبعضها يشارك الهدف لونه.',
      hard: 'شبكة كبيرة ومزدحمة — أجسام أكثر وأهداف أكثر.',
    },
    diffTargets: 'أهداف',
    diffGrid: 'شبكة',
    levelsSub: (pop, g) => `${pop} · شبكة ${g} · مستويات 1–100`,
    levelsBack: '← رجوع',
    challengeSub: 'نفس اللوحة للجميع · اختر الصعوبة · مرّر الجهاز',
    ready: (n) => `جاهز — ${n}`,
    goReady: 'ابدأ الجولة',
    chalBulletSame: 'نفس الشبكة لكل اللاعبين في هذه الجولة',
    hubMenu: 'شبكة واحدة، مقارنة عادلة.',
    found: 'مُوجَد',
    err: 'أخطاء',
    lvl: 'مستوى',
    pause: 'إيقاف',
    quit: 'خروج',
    restart: 'إعادة المستوى',
    quitMenu: 'خروج للقائمة',
    quitLose: 'ستفقد تقدم هذه الجولة.',
    yesQuit: 'نعم',
    keep: 'إكمال',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · شبكة جديدة عادلة كل جولة',
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s معدل · ${e} أخطاء المجموع · ${a}% · ${tp} هدف/ث`
        : `${t}s · ${e} أخطاء · ${a}% · ${tp} هدف/ث`,
    efficiency: 'درجة الكفاءة',
    efficiencyHint: 'الأعلى أفضل · تجمع السرعة والدقة',
    targetsFound: 'الأهداف الموجودة',
    accuracy: 'الدقة',
    timeRanOut: 'انتهى الوقت',
    rt: 'متوسط زمن الاستجابة',
    countdownHint: 'استعد…',
    survivalCueTitle: 'هدفك',
    survivalCueTask: 'اعثر على كل بطاقة تعرض هذا العنصر.',
    survivalCueReady: 'جاهز · ابدأ',
    survivalCueHint: 'انظر جيدًا. يبدأ المؤقت فقط عند الضغط.',
    fixHint: 'ركّز على المركز…',
    cueShape: 'المس كل مربع يحتوي على هذا الجسم.',
    assessMode: '📊 تقييم',
    hubNodeAssessHint: 'اختبار موحّد · تابع انتباهك',
    assessIntroTitle: 'تقييم الانتباه',
    assessIntroBody:
      'اختبار شطب موحّد من ٤ محاولات على نمط ميسولام (~٤ د). تبدأ بلوحة تدريب قصيرة غير محسوبة. ثم تعرض كل محاولة لوحة 7×7 جديدة — جِد كل المربعات المطابقة خلال ٥٠ ثانية. اعمل بسرعة وبدقة؛ النقر الخاطئ والأهداف المفقودة يُحتسبان.',
    assessIntroMeasures: 'يقيس الانتباه الانتقائي وسرعة المعالجة وكبح الاستجابة واستقرار الانتباه (مدى ثبات زمن استجابتك).',
    assessIntroNote:
      'مرجعي ذاتي وليس تشخيصاً. للمقارنة العادلة، تجنّب الإعادة الفورية واستخدم الجهاز والوضعية والإضاءة نفسها وفي وقت متقارب من اليوم.',
    assessStart: 'ابدأ التقييم',
    assessPracticeLabel: 'تدريب',
    assessThreshold: '🎚️ اختبار العتبة التكيّفي',
    assessTrialLabel: (n, m) => `محاولة ${n} / ${m}`,
    assessResTitle: 'نتائجك',
    assessIndex: 'مؤشر الانتباه',
    assessIndexSub: 'مركّب · ٠–١٠٠',
    mDetection: 'الاكتشاف',
    mDetectionSub: 'الأهداف المُوجَدة',
    mPrecision: 'الدقة',
    mPrecisionSub: 'نقرات صحيحة',
    mSpeed: 'السرعة',
    mSpeedSub: 'هدف/ث',
    mRt: 'زمن الاستجابة',
    mRtSub: 'متوسط مللي ثانية',
    mStability: 'الثبات',
    mStabilitySub: 'ثبات زمن الاستجابة',
    mErrors: 'الأخطاء',
    mErrorsSub: 'فوات · خاطئ',
    mDPrime: 'الحساسية',
    mDPrimeSub: 'd′ · إشارة مقابل ضوضاء',
    mBias: 'انحياز الاستجابة',
    mBiasSub: (lbl) => `المعيار c · ${lbl}`,
    biasCautious: 'متحفّظ',
    biasBalanced: 'متوازن',
    biasImpulsive: 'متهوّر',
    mBalance: 'التوازن المكاني',
    balanceLeft: 'نحو اليسار',
    balanceEven: 'متوازن',
    balanceRight: 'نحو اليمين',
    scanL: 'يبدأ يسارًا',
    scanR: 'يبدأ يمينًا',
    scanMid: 'يبدأ وسطًا',
    mBalanceSub: (dir, scan) => `${dir} · ${scan}`,
    mOrg: 'تنظيم البحث',
    mOrgSub: (r) => `أفضل R ${r}`,
    bandHigh: 'قوي',
    bandMid: 'معتاد',
    bandLow: 'قيد التطوّر',
    assessAgain: 'أعد الاختبار',
    assessViewHistory: '📈 السجل',
    assessHistTitle: 'سجل التقييمات',
    assessNoHistory: 'لا جلسات بعد — شغّل تقييماً لتبدأ المتابعة.',
    assessHistBest: (n) => `أفضل مؤشر: ${n}`,
    assessHistRecent: 'الجلسات الأخيرة',
    assessVsPrev: (d) => (d > 0 ? `▲ +${d}` : d < 0 ? `▼ ${d}` : '— 0'),
    sciTitle: 'لماذا يدرّب دماغك',
    sciParas: [
      'هذه مهمة إلغاء — من أكثر نماذج قياس الانتباه توثيقاً في علم النفس العصبي (مهمة ميسولام)، تُستخدم لقياس الانتباه الانتقائي والمستمر وسرعة المعالجة وكبح الاستجابة.',
      'تتبع الصعوبة نظرية البحث البصري: السهل/المتوسط بحث سمة (Treisman & Gelade, 1980)؛ والصعب بحث اقتران حيث تربط الشكل واللون (Wolfe). حدود الوقت لكل مستوى مشتقة من تقديرات منشورة لميل البحث.',
      'التقييم يستخدم مقاييس نفسية حقيقية: درجة الكفاءة العكسية (Townsend & Ashby, 1983) ودرجة المعدل الصحيح (Woltz & Was, 2006)، مع تشذيب لأزمنة الاستجابة (Whelan, 2008). ويُدرَج تباين زمن الاستجابة لأن ارتفاعه مؤشر قوي على هفوات الانتباه (Castellanos, 2005).',
      'حدود صادقة: التمرين يحسّن الأداء في هذه المهمة وفي البحث البصري بشكل موثوق؛ أما الانتقال الواسع إلى الانتباه اليومي فمختلَف عليه علمياً (Simons et al., 2016). استخدمه لتدريب وتتبّع هذه المهارات تحديداً — لا كاختبار طبي.',
    ],
    sciClose: 'إغلاق',
  },
};

export default function CancellationTaskGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentExit, onAssessmentComplete, assessmentLabel, assessmentStep, assessmentDomainId = 'attention' }) {
  const { playSfx, currentLang, awardLadderWin, awardFreeRun } = useApp();
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

  const [profile, setProfile] = useState(() => loadProfile());
  // When launched as an assessment (from the training-page fox), skip the game
  // hub and go straight into the standardized assessment intro.
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');

  const [round, setRound] = useState(null);
  const [cells, setCells] = useState([]);
  const [playStep, setPlayStep] = useState('idle');
  const [cdShow, setCdShow] = useState(false);
  const [cdVal, setCdVal] = useState(3);
  // Central fixation cue shown before each assessment grid — controls the start
  // gaze so Center-of-Cancellation, scan laterality and RT have a clean origin.
  const [fixShow, setFixShow] = useState(false);
  // "Here's your target" cue. Levels use it as a brief automatic flash when
  // countdown is disabled; Survival keeps it open until the player explicitly
  // taps Ready, so studying the object never consumes round time.
  const [cueShow, setCueShow] = useState(false);
  const [found, setFound] = useState(0);
  const [errors, setErrors] = useState(0);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('hard');
  const chalDiffRef = useRef('hard');

  const tlRef = useRef(0);
  const tlimRef = useRef(0);
  const runRef = useRef(false);
  const timerRunIdRef = useRef(0);
  const pendingPenaltyRef = useRef(0);
  const lastTapRef = useRef(0);
  // Which cell the last accepted tap landed on — the debounce in onCellTap is
  // scoped to a repeat of THAT cell, never to the next tap anywhere.
  const lastTapIdxRef = useRef(-1);
  const tapsRef = useRef([]);
  const warned10Ref = useRef(false);
  const roundRef = useRef(null);
  const gridWrapRef = useRef(null);
  const talliesRef = useRef({ found: 0, errors: 0 });
  // Phase-1 per-response capture (feeds spatial / search-organization / SDT
  // metrics). cellsRef mirrors the cells array so tap handling can run its side
  // effects OUTSIDE the setCells updater (StrictMode double-invokes updaters in
  // dev, which would double-log). roundOrdRef = response rank within the round;
  // foundIdxRef = set of found target indices (for omission positions);
  // gridOnsetRef = perf timestamp when the grid became interactive (for tOn).
  const cellsRef = useRef([]);
  const roundOrdRef = useRef(0);
  const foundIdxRef = useRef(new Set());
  // Ordered list of found-target positions {idx,row,col} in tap order — needed
  // for Center-of-Cancellation and "which side did you scan first" laterality.
  const roundFoundSeqRef = useRef([]);
  const gridOnsetRef = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const roundEndedRef = useRef(false);
  const endRoundRef = useRef((_won) => {});
  const trialLogRef = useRef(null);
  const freeStageRef = useRef(0);
  const freeRoundsWonRef = useRef(0);
  const freeLivesRef = useRef(FREE_LIVES);
  const [freeLives, setFreeLives] = useState(FREE_LIVES);
  const [freeScore, setFreeScore] = useState(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const assessTrialsRef = useRef([]);
  const assessTapsRef = useRef([]);
  const assessIdxRef = useRef(0);
  const assessPracticeAttemptsRef = useRef(0);
  const staircaseRef = useRef(null); // adaptive 2-down/1-up threshold engine
  const [assessResult, setAssessResult] = useState(null);
  const [assessHistory, setAssessHistory] = useState(() => loadAssessHistory());

  const juice = useJuice();
  const rLabels = ratingLabels(isAr);
  // Cancel-task teaches INSIDE the live Survival round (CancelTaskCoach) rather
  // than in a modal over a mock grid: Dr Kawkab and the pointing hand sit on the
  // real board and the player clears a real target. `coachOpen` holds the round
  // clock while that happens — see the timer effect — so reading costs no time.
  /*
   * ⚠ VERSIONED ON PURPOSE — `'cancel-task@coach1'`, not `'cancel-task'`.
   *
   * `shouldRunOnboarding` keys off this id in `mm_tutorial_prefs_v2`, and the
   * RETIRED three-slide carousel wrote that same `'cancel-task'` flag. So every
   * player who had opened this game before the 2026-08-28 rewrite already had
   * `{skipped:true}` or `{completed:true}` stored — meaning `coachArmed` began
   * `false` and the new lesson (the one that teaches decoys, the thing this
   * game actually measures) would never auto-run for them. It would have
   * reached fresh installs only, silently, with no gate able to see it.
   *
   * Bumping the suffix gives the new lesson its own flag so it runs once for
   * everybody. Bump it again if the lesson materially changes.
   *
   * The id is ALSO the key for `getTrainingDiagramSteps`, which returns [] for
   * an unknown id — harmless here, because this game never renders the rules
   * carousel (it teaches on the live board) and uses only `shouldRun`/`skipAll`
   * from this hook. `getTrainingTrial` is guarded for unknown ids too.
   */
  const tutorial = useTrainingTutorial('cancel-task@coach1', isAr);
  const tutLabels = TUTORIAL_UI[isAr ? 'ar' : 'en'];
  const tutReplayHint = tutLabels.replayTutorial;
  // `armed` = a coach run is owed (first ever visit, or the player asked to
  // replay). It becomes `open` once a Survival round is actually on screen.
  const [coachOpen, setCoachOpen] = useState(false);
  /* Read inside `onCellTap`, which is a stable callback and would otherwise
     close over a stale `coachOpen`. */
  const coachOpenRef = useRef(false);
  useEffect(() => { coachOpenRef.current = coachOpen; }, [coachOpen]);
  const [coachArmed, setCoachArmed] = useState(() => tutorial.onboarding.shouldRun);
  const boardApiRef = useRef(null);
  const startFreeModeRef = useRef(null);
  const markTutorialDone = tutorial.onboarding.skipAll;

  const openTutorial = useCallback(() => {
    // The hub's "?" replays the lesson — but the lesson now lives on a live
    // board, so arm it and drop straight into Survival.
    setCoachArmed(true);
    startFreeModeRef.current?.();
  }, []);

  const endCoach = useCallback(() => {
    setCoachOpen(false);
    setCoachArmed(false);
    markTutorialDone?.();
    /*
     * ⚠ Hand the round back. While the coach is open the auto-win is suppressed
     * (see `onCellTap`), so a player who cleared every target during the lesson
     * would otherwise be left sitting on an empty board with a running clock
     * and nothing to tap. Resolve it here, once, on the way out.
     */
    const cleared = (cellsRef.current || []).length > 0
      && !cellsRef.current.some((cell) => cell?.isT && !cell.tapped);
    if (cleared) endRoundRef.current?.(true);
  }, [markTutorialDone]);

  useEffect(() => () => {
  }, []);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  // Reset per-response capture whenever a new round's board appears. Declared
  // BEFORE the timer effect so, in the same commit (challenge mode sets round +
  // running together), gridOnsetRef is zeroed here first and then stamped by the
  // timer effect — never the reverse.
  useEffect(() => {
    if (!round) return;
    cellsRef.current = round.cells;
    roundOrdRef.current = 0;
    foundIdxRef.current = new Set();
    roundFoundSeqRef.current = [];
    gridOnsetRef.current = 0;
  }, [round]);

  const doneMap = useMemo(() => profile.done || {}, [profile.done]);
  /* One-time conversion of the old per-tier record into a ladder position.
     Unlocked, not ticked — a ✓ on a level nobody played is a lie. */
  const ladderReached = useMemo(() => fqMigrateLadderReached(doneMap), [doneMap]);

  const persistLevel = useCallback(
    (r, stats, f, e) => {
      const p = { ...profile, tel: [...(profile.tel || [])], done: { ...doneMap } };
      p.tel.push({
        lv: r.lv,
        diff: r.diff,
        won: stats.won,
        timeUsed: stats.timeUsed,
        errors: e,
        found: f,
        tc: r.tc,
        acc: stats.acc,
        score: stats.score,
        ies: stats.ies,
        tps: stats.tps,
        avgRt: stats.avgRt,
        ts: new Date().toISOString(),
      });
      if (stats.won && r.mode === 'level') {
        p.done[`lad-${r.ladderLv ?? r.lv}`] = true;
      }
      saveProfile(p);
      setProfile(p);
    },
    [profile, doneMap],
  );

  const stopTimer = useCallback(() => {
    runRef.current = false;
    timerRunIdRef.current += 1;
  }, []);

  /** Drop any in-progress round so hub / challenge / diff never see a stale `round`. */
  const clearPlayRoundState = useCallback(() => {
    stopTimer();
    roundEndedRef.current = false;
    roundRef.current = null;
    setRound(null);
    setCells([]);
    setPlayStep('idle');
    setPauseOpen(false);
    setQuitOpen(false);
    setCdShow(false);
    setFixShow(false);
    setCueShow(false);
  }, [stopTimer]);

  /** Brief target-cue card before a round (used when there's no 3-2-1 countdown). */
  const flashCue = useCallback(async () => {
    setCueShow(true);
    playSfx('click');
    await sleep(720);
    setCueShow(false);
  }, [playSfx]);

  const beginFreeRoundAtStage = useCallback(
    async (stageIndex) => {
      try {
        setPhase('play');
        setCdShow(false);
        let r;
        try {
          r = prepareFreeRound(stageIndex);
        } catch (err) {
          console.error('[Focus Quest] prepareFreeRound failed', stageIndex, err);
          clearPlayRoundState();
          setPhase('hub');
          return;
        }
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        // Every free round has its own timer (from the level curve); the run is
        // bounded by lives, not by one global session clock.
        tlRef.current = r.tlim;
        tlimRef.current = r.tlim;
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        // Survival is player-paced at the boundary between rounds. Show the
        // exact illustrated target and keep the clock stopped until Ready is
        // tapped; countdown preferences continue to apply to Levels only.
        setPlayStep('idle');
        setCueShow(true);
        playSfx('click');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState],
  );

  const confirmSurvivalTarget = useCallback(() => {
    if (roundRef.current?.mode !== 'free' || !cueShow) return;
    playSfx('collect');
    setCueShow(false);
    setPlayStep('running');
  }, [cueShow, playSfx]);

  /*
   * DEV-ONLY: ?survivalStage=N starts Survival at that stage.
   *
   * Survival runs on one life, so the tiers past the first are ~9 clean rounds
   * away — which makes the hard board impossible to eyeball while tuning it.
   * Gated on import.meta.env.DEV so it is dead code in any build; production
   * always starts at 0.
   */
  const devStartStage = useCallback(() => {
    if (!import.meta.env?.DEV) return 0;
    try {
      const n = Number(new URLSearchParams(window.location.search).get('survivalStage'));
      return Number.isFinite(n) && n > 0 ? Math.min(14, Math.floor(n)) : 0;
    } catch {
      return 0;
    }
  }, []);

  const startFreeMode = useCallback(() => {
    freeStageRef.current = 0;
    freeRoundsWonRef.current = 0;
    freeLivesRef.current = FREE_LIVES;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    setFreeLives(FREE_LIVES);
    setFreeScore(0);
    setPhase('freeIntro');
  }, []);
  startFreeModeRef.current = startFreeMode;

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'free' });
    const start = devStartStage();
    freeStageRef.current = start;
    void beginFreeRoundAtStage(start);
  }, [playSfx, beginFreeRoundAtStage, devStartStage]);

  const beginAssessmentTrial = useCallback(
    async (idx) => {
      try {
        setPhase('play');
        setCdShow(false);
        let r;
        try {
          // idx -1 = unscored instructional practice using the protocol's
          // smaller practice board and explicit readiness criterion.
          r = prepareAssessmentTrial(Math.max(0, idx), { practice: idx < 0 });
        } catch (err) {
          console.error('[Assessment] prepareAssessmentTrial failed', idx, err);
          clearPlayRoundState();
          setPhase('hub');
          return;
        }
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        tlRef.current = r.tlim;
        tlimRef.current = r.tlim;
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        // Assessment uses a central fixation cue (not the 3-2-1 count): a "+"
        // over a covered grid so the eye starts at centre, giving CoC / scan
        // laterality / RT a clean origin. idle is committed before the await, so
        // the later idle→running transition re-runs the timer effect.
        setPlayStep('idle');
        setCdShow(false);
        setFixShow(true);
        playSfx('click');
        await sleep(680);
        setFixShow(false);
        setPlayStep('running');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState],
  );

  const beginAdaptiveTrial = useCallback(
    async () => {
      try {
        setPhase('play');
        setCdShow(false);
        const sc = staircaseRef.current;
        if (!sc) {
          setPhase('hub');
          return;
        }
        let r;
        try {
          const { diff, lv } = freeStageToDiffLv(sc.level);
          r = { ...prepareLevelRound(diff, lv), mode: 'adaptive', adaptLevel: sc.level };
        } catch (err) {
          console.error('[Adaptive] prepare failed', err);
          clearPlayRoundState();
          setPhase('hub');
          return;
        }
        roundRef.current = r;
        setRound(r);
        setCells(r.cells);
        setFound(0);
        setErrors(0);
        talliesRef.current = { found: 0, errors: 0 };
        tlRef.current = r.tlim;
        tlimRef.current = r.tlim;
        tapsRef.current = [];
        pendingPenaltyRef.current = 0;
        // Same fixation cue + feedback-free play as the assessment.
        setPlayStep('idle');
        setFixShow(true);
        playSfx('click');
        await sleep(680);
        setFixShow(false);
        setPlayStep('running');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState],
  );

  const startThreshold = useCallback(() => {
    setPhase('adaptIntro');
  }, []);

  const onAdaptIntroReady = useCallback(() => {
    playSfx('click');
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'adaptive' });
    staircaseRef.current = createStaircase();
    void beginAdaptiveTrial();
  }, [playSfx, beginAdaptiveTrial]);

  const startAssessment = useCallback(() => {
    assessTrialsRef.current = [];
    assessTapsRef.current = [];
    assessIdxRef.current = 0;
    assessPracticeAttemptsRef.current = 0;
    setAssessResult(null);
    setPhase('assessIntro');
  }, []);

  const beginBatteryAssessment = useCallback(() => {
    playSfx('click');
    assessTrialsRef.current = [];
    assessTapsRef.current = [];
    assessIdxRef.current = 0;
    assessPracticeAttemptsRef.current = 0;
    setAssessResult(null);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'assess' });
    void beginAssessmentTrial(-1);
  }, [playSfx, beginAssessmentTrial]);

  const onAssessIntroReady = useCallback(() => {
    playSfx('click');
    assessPracticeAttemptsRef.current = 0;
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'assess' });
    void beginAssessmentTrial(-1); // practice grid first, unscored
  }, [playSfx, beginAssessmentTrial]);

  const endRound = useCallback(
    (won) => {
      if (roundEndedRef.current) return;
      roundEndedRef.current = true;
      stopTimer();
      const r = roundRef.current;
      if (!r) {
        roundEndedRef.current = false;
        return;
      }
      const { found: f, errors: e } = talliesRef.current;
      const tl = tlRef.current;
      const tlim = tlimRef.current;
      const targetTc = Array.isArray(r.cells)
        ? r.cells.filter((c) => c.isT).length
        : r.tc;
      const stats = computeRoundStats({
        tlim,
        tl,
        found: f,
        errors: e,
        tc: targetTc || r.tc,
        taps: [...tapsRef.current],
        diff: r.diff,
        won,
      });
      // Per-target positions for spatial analysis. `foundSeq` is in tap order
      // (drives scan-laterality); `omitPos` are targets never tapped, so they
      // must be reconstructed here (an omission generates no tap event).
      const foundSeq = roundFoundSeqRef.current.slice();
      const omitPos = [];
      if (Array.isArray(r.cells)) {
        r.cells.forEach((cell, i) => {
          if (cell.isT && !foundIdxRef.current.has(i)) {
            // Boards are cols×rows (Survival deals portrait rectangles), so
            // row/col come off the COLUMN count — `r.grid` is that count on
            // every board, square or not.
            const nCols = r.cols || r.grid;
            omitPos.push({ idx: i, row: Math.floor(i / nCols), col: i % nCols });
          }
        });
      }
      // Round marker — clinical per-round counts + positions, self-contained for
      // Center-of-Cancellation and spatial-omission analysis. No `ok`/`rt`, so
      // shared RT metrics skip it.
      if (!r.assessPractice) {
        trialLogRef.current?.trial({
          kind: 'round',
          found: f,
          errors: e,
          omissions: Math.max(0, (targetTc || r.tc) - f),
          timeUsed: stats.timeUsed,
          won,
          grid: r.grid,
          // Board shape travels with the round so a CoC read on stored history
          // can tell a 7×9 from a 9×9 rather than assuming grid².
          cols: r.cols || r.grid,
          rows: r.rows || r.grid,
          foundPos: foundSeq,
          omitPos,
        });
      }
      if (r.mode === 'challenge') {
        const idx = chalIdxRef.current;
        const names = chalNamesRef.current;
        const base = [...chalScoresRef.current];
        const prevRow = base[idx];
        base[idx] = mergeChallengePlayerStats(prevRow, stats, e, names[idx]);
        chalScoresRef.current = base;
        if (won) playSfx('win');
        else playSfx('error');
        const nextIdx = idx + 1;
        if (nextIdx < names.length) {
          setChalIdx(nextIdx);
          setChalTurnOpen(true);
          setPhase('play');
          setPlayStep('idle');
          setRound(null);
          setCells([]);
          roundEndedRef.current = false;
        } else {
          const cycle = chalCycleRef.current;
          const totalR = chalRoundsTotalRef.current;
          if (cycle + 1 < totalR) {
            chalCycleRef.current = cycle + 1;
            setChalRoundIdx(chalCycleRef.current);
            const newSeed = prepareChallengeSeed(chalDiffRef.current);
            setChalSeed(newSeed);
            setChalIdx(0);
            chalIdxRef.current = 0;
            setChalTurnOpen(true);
            setPhase('play');
            setPlayStep('idle');
            setRound(null);
            setCells([]);
            roundEndedRef.current = false;
          } else {
            setLastResult({ type: 'challenge', rows: base });
            setPhase('chalRes');
          }
        }
        return;
      }
      if (r.mode === 'free') {
        if (won) {
          // Cleared the round — bank the clear bonus and ramp to a harder stage.
          playSfx('win');
          freeStreakRef.current += 1;
          const clearPts = freeRoundClearPoints(r.tlim, freeStreakRef.current);
          freeScoreRef.current += clearPts;
          setFreeScore(freeScoreRef.current);
          freeRoundsWonRef.current += 1;
          freeStageRef.current += 1;
          setPauseOpen(false);
          void beginFreeRoundAtStage(freeStageRef.current);
          return;
        }
        // Round failed (timed out or too many wrong taps): lose a life.
        freeStreakRef.current = 0;
        freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
        setFreeLives(freeLivesRef.current);
        if (freeLivesRef.current > 0) {
          // Lives left — step DOWN one stage (adaptive staircase: clear → +1,
          // fail → −1, so the stage converges on the player's threshold).
          playSfx('error');
          setPauseOpen(false);
          freeStageRef.current = Math.max(0, freeStageRef.current - 1);
          void beginFreeRoundAtStage(freeStageRef.current);
          return;
        }
        // Out of lives — the run is over.
        playSfx('error');
        const rw = freeRoundsWonRef.current;
        const runScore = freeScoreRef.current;
        setProfile((prev) => {
          let next = { ...prev };
          let changed = false;
          if (runScore > (prev.freeBestScore ?? 0)) {
            next = { ...next, freeBestScore: runScore };
            changed = true;
          }
          if (rw > (prev.freeBest ?? 0)) {
            next = { ...next, freeBest: rw };
            changed = true;
          }
          if (changed) saveProfile(next);
          return changed ? next : prev;
        });
        trialLogRef.current?.finish({ roundsWon: rw, score: runScore });
        trialLogRef.current = null;
        awardFreeRun('cancel', rw);
        setLastResult({ type: 'free', roundsWon: rw, score: runScore, lastR: r });
        setPhase('freeRes');
        setPlayStep('idle');
        setPauseOpen(false);
        setQuitOpen(false);
        setCdShow(false);
        setRound(null);
        setCells([]);
        return;
      }
      if (r.mode === 'assess') {
        if (r.assessPractice) {
          // Practice is instructional and unscored. Require a clean-enough
          // completion before measurement; repeat twice at most so a player is
          // never trapped by the gate. No practice data enters the battery.
          const attempt = assessPracticeAttemptsRef.current + 1;
          assessPracticeAttemptsRef.current = attempt;
          const practiceReady = !!won && e <= (r.practiceMaxFalseAlarms ?? 1);
          const maxAttempts = r.practiceMaxAttempts ?? 3;
          playSfx(practiceReady ? 'win' : 'error');
          setPauseOpen(false);
          if (practiceReady || attempt >= maxAttempts) {
            void beginAssessmentTrial(0);
          } else {
            void beginAssessmentTrial(-1);
          }
          return;
        }
        // Record this trial (hits, false taps, time, efficiency) + its taps.
        // `distractors` (= non-target cells) is the SDT "noise" count needed for
        // the false-alarm rate in the d′/criterion computation.
        {
          const tcTrial = targetTc || r.tc;
          const totalCells = (r.grid || 0) * (r.grid || 0);
          assessTrialsRef.current.push({
            tc: tcTrial,
            distractors: Math.max(0, totalCells - tcTrial),
            found: f,
            errors: e,
            timeUsed: stats.timeUsed,
            ies: stats.ies,
            grid: r.grid,
            foundSeq, // tap-ordered found positions → CoC + scan laterality
            omitPos, // missed targets → CoC extent + omission map
          });
        }
        assessTapsRef.current.push(...tapsRef.current);
        const total = r.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials;
        const nextIdx = assessIdxRef.current + 1;
        if (nextIdx < total) {
          playSfx(won ? 'win' : 'click');
          assessIdxRef.current = nextIdx;
          setPauseOpen(false);
          void beginAssessmentTrial(nextIdx);
          return;
        }
        // Battery complete — compute the standardized summary and persist it.
        playSfx('win');
        const summary = computeAssessmentSummary(
          assessTrialsRef.current,
          assessTapsRef.current,
          { age: loadAssessProfile().age },
        );
        setAssessHistory(saveAssessSession(summary));
        trialLogRef.current?.finish({
          composite: summary.composite,
          detection: summary.detection,
          meanRT: summary.meanRT,
          rtCV: summary.rtCV,
          speed: summary.speed,
        });
        trialLogRef.current = null;
        setPlayStep('idle');
        setPauseOpen(false);
        setQuitOpen(false);
        setCdShow(false);
        setRound(null);
        setCells([]);
        if (onAssessmentComplete) {
          const line = `${Math.round(summary.detection * 100)}% · ${summary.meanRT != null ? `${summary.meanRT}ms` : '—'}`;
          onAssessmentComplete({ score: summary.composite, line });
          return;
        }
        setAssessResult(summary);
        setPhase('assessRes');
        return;
      }
      if (r.mode === 'adaptive') {
        const sc = staircaseRef.current;
        // Pass = cleared the board in time with few false taps. This binary
        // outcome drives the 2-down/1-up staircase toward the player's threshold.
        const pass = !!won && e <= 2;
        sc?.record(pass);
        playSfx('click'); // neutral between-trial sound (no pass/fail tell)
        if (sc && !sc.done) {
          setPauseOpen(false);
          void beginAdaptiveTrial();
          return;
        }
        const threshold = sc ? sc.threshold() : 0;
        trialLogRef.current?.finish({ threshold, reversals: sc?.reversalCount ?? 0 });
        trialLogRef.current = null;
        setPlayStep('idle');
        setPauseOpen(false);
        setQuitOpen(false);
        setCdShow(false);
        setRound(null);
        setCells([]);
        setLastResult({
          type: 'adaptive',
          threshold,
          trials: sc?.trialCount ?? 0,
          reversals: sc?.reversalCount ?? 0,
        });
        setPhase('adaptRes');
        return;
      }
      if (won) playSfx('win');
      else playSfx('error');
      trialLogRef.current?.finish({ won });
      trialLogRef.current = null;
      if (won) awardLadderWin('cancel', r.ladderLv ?? r.lv, FQ_LADDER_LEVELS);
      persistLevel(r, stats, f, e);
      setLastResult({ type: 'level', stats, r, won, found: f, errors: e });
      setPhase('res');
    },
    [stopTimer, persistLevel, playSfx, beginFreeRoundAtStage, beginAssessmentTrial, beginAdaptiveTrial, onAssessmentComplete, awardFreeRun, awardLadderWin],
  );

  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

  // The rendered board is the final authority on completion. The event handler
  // normally ends the round immediately, but this catches any future count/ref
  // drift: if every target the player can see has been marked, play must move on.
  useEffect(() => {
    if (phase !== 'play' || playStep !== 'running' || !round || roundEndedRef.current) return;
    const targets = cells.filter((cell) => cell.isT);
    if (targets.length > 0 && targets.every((cell) => cell.tapped)) {
      endRoundRef.current(true);
    }
  }, [phase, playStep, round, cells]);

  useEffect(() => () => trialLogRef.current?.discard(), []);

  useEffect(() => {
    // The coach holds the clock exactly like the pause menu does — a first-time
    // player must never lose Survival time to reading Dr Kawkab.
    if (playStep !== 'running' || pauseOpen || coachOpen) return;
    let id;
    let last = performance.now();
    const runId = timerRunIdRef.current + 1;
    timerRunIdRef.current = runId;
    warned10Ref.current = false;
    runRef.current = true;
    const loop = (ts) => {
      if (!runRef.current || pauseOpen || coachOpen || timerRunIdRef.current !== runId) return;
      const dt = (ts - last) / 1000;
      last = ts;
      tlRef.current = Math.max(
        0,
        tlRef.current - dt - pendingPenaltyRef.current,
      );
      pendingPenaltyRef.current = 0;
      if (!warned10Ref.current && tlRef.current <= 10) {
        warned10Ref.current = true;
        playSfx('click');
      }
      if (tlRef.current <= 0) {
        endRoundRef.current(false);
        return;
      }
      id = requestAnimationFrame(loop);
    };
    // Stamp the grid-onset time once per round (the first 'running' frame).
    // Guarded so resuming from pause doesn't reset it — tOn stays round-relative.
    if (!gridOnsetRef.current) gridOnsetRef.current = performance.now();
    lastTapRef.current = performance.now();
    lastTapIdxRef.current = -1;
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      if (timerRunIdRef.current === runId) runRef.current = false;
    };
  }, [playStep, pauseOpen, coachOpen, playSfx]);

  // Open the coach once a Survival round is actually on screen, so Dr Kawkab
  // can point at real shapes. Survival only — Levels and Pass n Play are
  // untouched for now.
  useEffect(() => {
    if (!coachArmed || coachOpen) return;
    if (round?.mode !== 'free' || playStep !== 'running' || cdShow || pauseOpen) return;
    setCoachOpen(true);
  }, [coachArmed, coachOpen, round, playStep, cdShow, pauseOpen]);

  // Never strand the coach on a screen that has no board (round ended, quit,
  // paused out) — it would hold the clock forever. Closing this way also ends
  // onboarding: a player who cleared the whole board mid-lesson has plainly got
  // it, and re-opening the coach every round would nag them.
  useEffect(() => {
    if (!coachOpen) return;
    if (phase !== 'play' || playStep !== 'running') endCoach();
  }, [coachOpen, phase, playStep, endCoach]);

  /*
   * The board's top reserve is the HUD's MEASURED height, published as a CSS
   * variable the stylesheet reads.
   *
   * ── Why this exists, and what it replaces ──
   * .cb2d-wrap used to reserve clamp(56px, 12vh, 104px) for a HUD that actually
   * stacks to ~83px (bar 60 + 4 + clock 11 + progress 8). 12vh only reaches 83px
   * on a viewport taller than ~692px, so on anything shorter — a phone in
   * landscape, a small window, any aspect ratio that missed the tall-phone media
   * query — the bar's near-opaque card sat ON TOP of the first row of tiles. And
   * because .ct-fq-scene2d-overlay is pointer-events:none, those tiles stayed
   * live underneath it: invisible, tappable, and never tapped. A target hiding
   * there cannot be found, so the round cannot be cleared — the reported
   * "I cancel all the shapes and still I do not win".
   *
   * This is the same measurement the old layout pass did — visualViewport,
   * [data-fq-chrome], the lot — but that pass wrote to a `gridMetrics` state
   * that NOTHING read. It was orphaned when the board went 2D and CancelBoard2D
   * brought its own clientWidth/clientHeight fit, which knows nothing about the
   * HUD: ninety lines of correct measurement, disconnected from the layout.
   *
   * Only IN-FLOW chrome counts. In the wide-screen layout the bar is absolutely
   * positioned into a side rail and the clock is pinned beside the board;
   * neither sits above the grid, and both would otherwise report a huge bottom
   * edge and shove the board off screen.
   */
  useLayoutEffect(() => {
    if (phase !== 'play' || !round) return undefined;
    const wrap = gridWrapRef.current;
    if (!wrap) return undefined;
    let raf = 0;
    const measure = () => {
      const top = wrap.getBoundingClientRect().top;
      let bottom = 0;
      wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => {
        if (window.getComputedStyle(el).position === 'absolute') return;
        const r = el.getBoundingClientRect();
        if (r.height > 0) bottom = Math.max(bottom, r.bottom - top);
      });
      // +8px so the top row clears the bar rather than touching it. The
      // fallback covers the frame before the HUD has painted.
      const reserve = bottom > 0 ? Math.ceil(bottom) + 8 : 96;
      wrap.style.setProperty('--fq-hud-reserve', reserve + 'px');
    };
    measure();
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => ro.observe(el));
    window.visualViewport?.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.visualViewport?.removeEventListener('resize', schedule);
      ro.disconnect();
    };
  }, [phase, round]);

  const runCountdownThen = async (onDone) => {
    if (!settings.countdown) {
      await flashCue();
      onDone();
      return;
    }
    setCdShow(true);
    try {
      for (let n = 3; n > 0; n--) {
        setCdVal(n);
        playSfx('click');
        await sleep(380);
      }
      setCdVal('GO');
      playSfx('collect');
      await sleep(320);
    } finally {
      setCdShow(false);
    }
    onDone();
  };

  const startLevelGame = async (lv) => {
    const { diff, li } = ladderToTier(lv);
    setPhase('play');
    setPlayStep('idle');
    setCdShow(false);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'level', meta: { lv, diff, li } });
    let r;
    try {
      r = prepareLevelRound(diff, li);
    } catch (err) {
      console.error('[Focus Quest] prepareLevelRound failed', diff, li, err);
      clearPlayRoundState();
      setPhase('levels');
      return;
    }
    // Tag the round with WHERE ON THE LADDER it came from. The round itself
    // still carries the authored (diff, lv) it was built from — everything
    // downstream (scoring, telemetry, the results screen) reads those — but
    // progress, unlocking and points are all ladder-positioned.
    r.ladderLv = Math.min(FQ_LADDER_LEVELS, Math.max(1, Math.round(Number(lv) || 1)));
    roundRef.current = r;
    setRound(r);
    setCells(r.cells);
    setFound(0);
    setErrors(0);
    talliesRef.current = { found: 0, errors: 0 };
    tlRef.current = r.tlim;
    tlimRef.current = r.tlim;
    tapsRef.current = [];
    pendingPenaltyRef.current = 0;
    roundEndedRef.current = false;
    await runCountdownThen(() => {
      setPlayStep('running');
    });
  };

  const onCellTap = useCallback((idx) => {
    if (playStep !== 'running' || pauseOpen || cdShow) return;
    const r = roundRef.current;
    if (!r) return;
    // Source of truth is cellsRef (kept in sync), so all side effects run ONCE
    // here in the event handler — not inside the setCells updater, which
    // StrictMode double-invokes in dev (would double-log every response).
    const c = cellsRef.current[idx];
    if (!c || c.tapped) return;

    const now = performance.now();
    /*
     * Debounce sub-70ms repeats OF THE SAME CELL. The window is scoped to one
     * cell on purpose, and that scoping is the whole point.
     *
     * What it still catches: a hardware/synthetic double-fire — touchstart and
     * click both landing, or a palm bounce. Those always hit the SAME index, and
     * the `c.tapped` guard above cannot catch them alone, because cellsRef is
     * refreshed inside the setCells updater and React runs that at render — two
     * events dispatched in one tick therefore both still read tapped === false.
     *
     * ⚠ Why it must NOT be global (the bug this replaces). The old form compared
     * against the last tap ANYWHERE and dropped anything inside 70ms, so a fast,
     * entirely genuine tap on a DIFFERENT tile was swallowed — silently: no
     * sound, no mark, no penalty, the tile left looking exactly like one never
     * visited. The round clears only on `tappedTargets >= r.tc`, so each
     * swallowed target is one the player must somehow notice and re-tap. On a
     * 9x9 board with 17 targets a rapid scanner drops several, and gets the
     * reported "I cancel every shape and still I do not win".
     *
     * The premise was wrong too: the old comment claimed intentional taps are
     * ≥100ms apart, but practised serial tapping runs 6-8/s and bursts faster,
     * so on a dense grid the window was inside the range of real responses.
     */
    if (lastTapIdxRef.current === idx && now - lastTapRef.current < 70) return;
    const itt = lastTapRef.current ? now - lastTapRef.current : null;
    if (lastTapRef.current) tapsRef.current.push(now - lastTapRef.current);
    lastTapRef.current = now;
    lastTapIdxRef.current = idx;

    // Per-response record: grid position (idx/row/col), target flag, response
    // rank, round-onset latency (tOn), and `lead` marking the first response so
    // its latency (search-onset RT) can be separated from later inter-response
    // times. Feeds Center-of-Cancellation, search-organization, and SDT metrics.
    const ord = (roundOrdRef.current += 1);
    const tOn = gridOnsetRef.current ? Math.round(now - gridOnsetRef.current) : null;
    const tapCols = r.cols || r.grid;
    const posFields = {
      idx,
      row: Math.floor(idx / tapCols),
      col: idx % tapCols,
      isT: !!c.isT,
      ord,
      ...(ord === 1 ? { lead: true } : {}),
      ...(tOn != null ? { tOn } : {}),
    };

    // Scored assessment is feedback-free: same neutral tap sound for hits and
    // false alarms, a neutral mark, and no time penalty. The short unscored
    // practice remains instructional so the player can learn the rule first.
    const isAssess = (r.mode === 'assess' || r.mode === 'adaptive') && !r.assessPractice;
    if (c.isT) {
      if (!r.assessPractice) {
        /* ⚠ Not while the coach is open — see the note on the false-alarm
           write below. A guided tap is not a measurement. */
        if (!coachOpenRef.current) {
          trialLogRef.current?.trial({ ...(itt != null ? { rt: Math.round(itt) } : {}), ok: true, ...posFields });
        }
      }
      foundIdxRef.current.add(idx);
      roundFoundSeqRef.current.push({ idx, row: posFields.row, col: posFields.col });
      playSfx(isAssess ? 'click' : 'collect');
      if (!isAssess) juice.hit({});
      talliesRef.current.found += 1;
      const tappedTargets = talliesRef.current.found;
      setFound(tappedTargets);
      // Claim the cell synchronously. Waiting for React's state updater left a
      // small window where a second event could still observe the old board.
      const nextCells = cellsRef.current.map((x, i) => (
        i === idx ? { ...x, tapped: true, feedback: isAssess ? 'mark' : 'ok' } : x
      ));
      cellsRef.current = nextCells;
      setCells(nextCells);
      if (r.mode === 'free') {
        const add = freeTapPoints(r.diff, r.freeStage ?? 0);
        freeScoreRef.current += add;
        setFreeScore(freeScoreRef.current);
      }
      const hasRemainingTarget = nextCells.some((cell) => cell.isT && !cell.tapped);
      /*
       * ⚠ CLEARING THE BOARD MUST NOT END THE LESSON EITHER. The tutorial board
       * has three targets; step 2 has the player clear one. The natural next
       * move — the hand just said "tap it" — is to tap the other two, which won
       * the round, closed the coach and marked onboarding complete at step 2 of
       * 4. The player never met the decoy step, which is the entire reason this
       * lesson exists, and then met decoys by being punished for tapping one.
       *
       * So while the coach is open the round simply stays open. The coach ends
       * it (`onFinish`/`onSkip` → `endCoach`), and the round resolves after.
       */
      if (!hasRemainingTarget && !coachOpenRef.current) {
        // No green solve-pulse here on purpose — the win screen is enough.
        endRoundRef.current(true);
      }
      return;
    }

    if (!r.assessPractice) {
      /*
       * ⚠ TUTORIAL TAPS ARE NOT DATA.
       *
       * The trial log is created before the coach opens and `performance.now()`
       * keeps running while it holds the clock, so a tap made during the lesson
       * — with a hand pointing at the answer and unlimited time to read — was
       * being written into `mm_trials_cancel-task_v1` as a genuine hit or false
       * alarm, carrying however many seconds the player spent reading. That
       * contaminates search-onset RT, inter-response times and Center-of-
       * Cancellation for that round, in the player's own history. This app is
       * built by a psychologist; a demonstration must not enter the record.
       */
      if (!coachOpenRef.current) {
        trialLogRef.current?.trial({ ...(itt != null ? { rt: Math.round(itt) } : {}), ok: false, ...posFields });
      }
    }
    playSfx(isAssess ? 'click' : 'error');
    /*
     * ⚠ A MISTAKE MADE DURING THE LESSON COSTS NO TIME.
     *
     * The coach holds the clock while it is open, but the wrong-tap penalty is
     * BANKED (`pendingPenaltyRef`) and spends itself the moment the clock
     * restarts. So a first-time player who tapped a decoy while Dr Kawkab was
     * explaining decoys used to walk into the round already three seconds down,
     * with nothing on screen connecting the loss to the tap. Trying the wrong
     * thing is the point of a tutorial; it must be free.
     */
    if (!isAssess && !coachOpenRef.current) pendingPenaltyRef.current += 3;
    if (!coachOpenRef.current) {
      talliesRef.current.errors += 1;
      setErrors(talliesRef.current.errors);
    }
    const nextCells = cellsRef.current.map((x, i) => (
      i === idx ? { ...x, tapped: true, feedback: isAssess ? 'mark' : 'bad' } : x
    ));
    cellsRef.current = nextCells;
    setCells(nextCells);
    /*
     * ⚠ THE LESSON MUST NOT BE LOSABLE. The three lines above/below are the
     * three consequences of a wrong tap, and guarding only the CLOCK left the
     * other two live — which was worse than not guarding at all:
     *
     * Survival has ONE life (FREE_LIVES) and the tutorial board carries three
     * targets, so `freeRoundErrorCap(3)` is 2. Dr Kawkab points a crossed-out
     * hand at a decoy and says it is not your shape; the player taps it to see
     * what happens — which this coach's own header calls the point of a
     * tutorial — and that is error 1 of 2. One more slip anywhere on a 20-cell
     * board failed the round, spent the only life, and dropped them on a
     * results screen mid-sentence. Worse, ANY round end closes the coach
     * (`endCoach` → `markOnboardingSkipped`), so the lesson was then marked
     * permanently complete having never shown steps 3 and 4.
     *
     * The red 'bad' feedback above still fires, because seeing the mistake IS
     * the lesson. Only the punishment is suspended.
     */
    if (r.mode === 'free' && !coachOpenRef.current) {
      const pen = freeWrongTapPenalty(r.diff);
      freeScoreRef.current = Math.max(0, freeScoreRef.current - pen);
      setFreeScore(freeScoreRef.current);
      // Too many wrong taps this round → fail the round (ends the run; 1 life).
      if (talliesRef.current.errors >= freeRoundErrorCap(r.tc)) {
        endRoundRef.current(false);
        return;
      }
    }
  }, [playStep, pauseOpen, cdShow, playSfx, juice]);

  const onHudPause = useCallback(() => {
    if (playStep !== 'running') return;
    stopTimer();
    setPauseOpen(true);
  }, [playStep, stopTimer]);

  const onHudQuit = useCallback(() => {
    if (playStep === 'running') stopTimer();
    setQuitOpen(true);
  }, [playStep, stopTimer]);

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      alert(t.needTwo);
      return;
    }
    clearPlayRoundState();
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
    setChalTurnOpen(true);
    setPhase('play');
  };

  const startChallengeRound = () => {
    if (!chalSeed) return;
    setChalTurnOpen(false);
    roundEndedRef.current = false;
    const r = prepareChallengePlayState(chalSeed);
    roundRef.current = r;
    setRound(r);
    setCells(r.cells);
    setFound(0);
    setErrors(0);
    talliesRef.current = { found: 0, errors: 0 };
    tlRef.current = r.tlim;
    tlimRef.current = r.tlim;
    tapsRef.current = [];
    pendingPenaltyRef.current = 0;
    setPlayStep('running');
    playSfx('click');
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    const mode = roundRef.current?.mode;
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlayRoundState();
    if (mode === 'challenge') setPhase('chal');
    else if (mode === 'level') setPhase('levels');
    else if (mode === 'assess') {
      if (assessmentMode && onAssessmentExit) onAssessmentExit();
      else setPhase('hub');
    } else setPhase('hub');
  };

  const bandLbl = (b) => (b === 'high' ? t.bandHigh : b === 'mid' ? t.bandMid : t.bandLow);

  /** Leave the assessment: back to the global assessment flow when launched from
   *  the training-page fox, otherwise back to the game hub. */
  const exitAssess = useCallback(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = null;
    clearPlayRoundState();
    if (assessmentMode && onAssessmentExit) onAssessmentExit();
    else setPhase('hub');
  }, [assessmentMode, onAssessmentExit, clearPlayRoundState]);

  const pauseLabels = {
    paused: t.paused,
    resume: t.resume,
    restart: t.restart,
    quitMenu: t.quitMenu,
  };
  const quitLabels = {
    quitQ: t.quitQ,
    quitLose: t.quitLose,
    yesQuit: t.yesQuit,
    keep: t.keep,
  };

  return (
    <div
      className="cancellation-task-game ct-fq-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <>
          <div className="ct-fq-training-shell ct-fq-training-shell--mode-cosmos">
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
                    <div className="ct-fq-hub-attn-big">{t.hubAttentionWord}</div>
                    <div className="ct-fq-hub-attn-sub">{t.hubTrainingTag}</div>
                  </div>
                }
              />
              <FqAttentionLightModes
                t={t}
                isAr={isAr}
                playSfx={playSfx}
                onFree={startFreeMode}
                onLevels={() => setPhase('levels')}
                onChallenge={() => setPhase('chal')}
              />
              <HubScienceLink gameId="cancel-task" isAr={isAr} playSfx={playSfx} />
            </div>
          </div>
        </>
      )}

      {phase === 'freeIntro' && (
        <SurvivalIntro
          isAr={isAr}
          playSfx={playSfx}
          title={t.freeIntroTitle}
          body={t.freeIntroBody}
          onReady={onFreeIntroReady}
          onBack={() => {
            clearPlayRoundState();
            setPhase('hub');
          }}
        />
      )}

      {phase === 'adaptIntro' && (
        <SurvivalIntro
          isAr={isAr}
          playSfx={playSfx}
          title={t.adaptIntroTitle}
          body={t.adaptIntroBody}
          onReady={onAdaptIntroReady}
          onBack={() => {
            clearPlayRoundState();
            setPhase('assessIntro');
          }}
        />
      )}

      {/* ⚠ The `diff` phase is gone (2026-08-28, the ladder). Level mode goes
          straight from the hub to ONE grid — no Easy/Medium/Hard screen. */}
      {phase === 'levels' && (
        <TrainingLevelGrid
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => setPhase('hub')}
          title={t.title}
          blurb={t.ladderBlurb(FQ_LADDER_LEVELS.toLocaleString(isAr ? 'ar-EG' : 'en-US'))}
          count={FQ_LADDER_LEVELS}
          isUnlocked={(lv) => (lv === 1 || lv <= ladderReached + 1
            || !!doneMap[`lad-${lv - 1}`] || !!doneMap[`lad-${lv}`])}
          isDone={(lv) => !!doneMap[`lad-${lv}`]}
          sublabel={(lv) => {
            const cfg = ladderLvCfg(lv);
            return `${cfg.tc}t·${cfg.time}s`;
          }}
          onPick={(lv) => startLevelGame(lv)}
        />
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
            />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.challengeSub}
              diffKeys={FQ_DIFF_KEYS}
              diffLabels={DM}
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

      {phase === 'play' && chalTurnOpen && !round && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr}
          kicker={t.chalTurnKicker}
          playerName={chalNames[chalIdx]}
          roundLine={
            chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null
          }
          metaLine={`${DM[chalDiff]?.label ?? ''} · ${PASS_PLAY_CONFIG[chalDiff]?.cols ?? 7}×${PASS_PLAY_CONFIG[chalDiff]?.rows ?? 9} · ${PASS_PLAY_CONFIG[chalDiff]?.tlim ?? 50}s`}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeRound}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && round && (
        <>
          <div className="ct-fq-play">
          <div className={`ct-fq-g-wrap ct-fq-g-wrap--scene2d ct-juice-host${juice.shake ? ' ct-juice-shake' : ''}`} ref={gridWrapRef}>
            <CancelBoard2D
              cells={cells}
              round={round}
              interactive={playStep === 'running' && !pauseOpen && !cdShow}
              onTapCell={onCellTap}
              isAr={isAr}
              boardApiRef={boardApiRef}
              /* Premium flat object art for all training play. Assessment and
                 Adaptive keep the controlled abstract stimulus set. */
              useArt={usesPremiumTrainingArt(round, cells)}
            />

            {/* Dr Kawkab teaches on this exact board. Sibling of the board and
                also inset:0, so the hand's screen fractions line up with it. */}
            {coachOpen && (
              <CancelTaskCoach
                isAr={isAr}
                playSfx={playSfx}
                cells={cells}
                boardApiRef={boardApiRef}
                onFinish={endCoach}
                onSkip={endCoach}
              />
            )}
            <div className="ct-fq-scene2d-overlay">
            <JuiceLayer
              combo={juice.combo}
              particle={juice.particle}
              rtFx={juice.rtFx}
              toast={juice.toast}
              burst={juice.burst}
              ratingLabels={rLabels}
              showCombo={false}
            />
            <PlayHud
              t={t}
              playStep={playStep}
              pauseOpen={pauseOpen}
              tlRef={tlRef}
              tlimRef={tlimRef}
              roundTlim={round.tlim}
              useSessionTimer={false}
              found={found}
              tc={cells.filter((c) => c.isT).length}
              errors={errors}
              errorsLabel={round.mode === 'free' ? t.freeStrikes : undefined}
              errorsMax={round.mode === 'free' ? freeRoundErrorCap(round.tc) : undefined}
              hideErrors={(round.mode === 'assess' && !round.assessPractice) || round.mode === 'adaptive'}
              lvlLabel={
                round.mode === 'free'
                  ? null
                  : round.mode === 'assess'
                    ? round.assessPractice
                      ? t.assessPracticeLabel
                      : `${(round.assessTrial ?? 0) + 1}/${round.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials}`
                    : round.mode === 'adaptive'
                      ? `R${(staircaseRef.current?.trialCount ?? 0) + 1}`
                      : round.lv === 'CH'
                        ? 'CH'
                        : `L${round.lv}`
              }
              freeScore={round.mode === 'free' ? freeScore : undefined}
              freeLives={round.mode === 'free' ? freeLives : undefined}
              freeLivesMax={FREE_LIVES}
              targetShape={
                round.target in SH
                  ? round.target
                  : cells.find((c) => c.isT)?.shape || 'circle'
              }
              targetColor={
                round.targetCol || cells.find((c) => c.isT)?.fill || 'var(--game-ink)'
              }
              targetVisual={usesPremiumTrainingArt(round, cells)
                ? <CancellationTarget round={round} cells={cells} size={38} isAr={isAr} />
                : undefined}
              onMenu={onHudQuit}
              onPause={onHudPause}
              menuAriaLabel={t.menu}
              pauseAriaLabel={t.pause}
              playSfx={playSfx}
            />
            </div>
          </div>
          </div>

          <TrainingPauseModal
            open={pauseOpen}
            labels={pauseLabels}
            showRestart={round.mode !== 'assess'}
            onResume={() => {
              setPauseOpen(false);
              if (playStep === 'running') runRef.current = true;
            }}
            onRestart={() => {
              setPauseOpen(false);
              if (round.mode === 'level') startLevelGame(round.ladderLv ?? 1);
              else if (round.mode === 'free') void beginFreeRoundAtStage(round.freeStage ?? 0);
              else if (round.mode === 'challenge') startChallengeRound();
            }}
            onQuitMenu={() => {
              setPauseOpen(false);
              setQuitOpen(true);
            }}
          />
          <TrainingQuitModal
            open={quitOpen}
            labels={quitLabels}
            onConfirmQuit={confirmQuit}
            onKeepPlaying={() => {
              setQuitOpen(false);
              if (playStep === 'running') runRef.current = true;
            }}
          />

        </>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (() => {
        const targetCount = Array.isArray(lastResult.r.cells)
          ? lastResult.r.cells.filter((cell) => cell.isT).length
          : lastResult.r.tc;
        const leaveResults = () => {
          setLastResult(null);
          clearPlayRoundState();
          setPhase('hub');
        };
        return (
          <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
            <PlayResults
              isAr={isAr}
              title={lastResult.stats.won ? t.resultsLevelPass : t.timeRanOut}
              tone={lastResult.stats.won ? 'success' : 'retry'}
              headline={{ value: `${lastResult.found}/${targetCount}`, label: t.targetsFound }}
              stats={[
                { value: Math.round(lastResult.stats.ies), label: t.efficiency },
                { value: `${lastResult.stats.timeUsed}s`, label: t.time },
                { value: `${lastResult.stats.acc}%`, label: t.accuracy },
                { value: lastResult.errors, label: t.err },
                { value: `${lastResult.stats.avgRt}ms`, label: t.rt },
              ]}
              notes={[t.efficiencyHint]}
              actions={[
                lastResult.stats.won && lastResult.r.lv < FQ_LEVELS_PER_TIER ? {
                  key: 'next',
                  label: t.nextLv,
                  onClick: () => {
                    setPhase('play');
                    setLastResult(null);
                    startLevelGame((lastResult.r.ladderLv ?? 1) + 1);
                  },
                } : null,
                {
                  key: 'retry',
                  label: lastResult.stats.won ? t.replay : t.retry,
                  variant: lastResult.stats.won ? 'ghost' : 'primary',
                  onClick: () => {
                    setLastResult(null);
                    startLevelGame(lastResult.r.ladderLv ?? 1);
                  },
                },
                { key: 'menu', label: t.menu, variant: 'ghost', onClick: leaveResults },
              ]}
              onMenu={leaveResults}
              playSfx={playSfx}
            />
          </div>
        );
      })()}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <PlayResults
            isAr={isAr}
            title={t.freeGameOver}
            headline={{ value: lastResult.score ?? 0, label: t.score }}
            stats={[{ value: lastResult.roundsWon, label: t.roundsClearedLabel }]}
            notes={[`${t.freeBest(profile.freeBest ?? 0)} · ${t.freeBestScoreLine(profile.freeBestScore ?? 0)}`]}
            onAgain={() => {
              setLastResult(null);
              startFreeMode();
            }}
            onMenu={() => {
              setLastResult(null);
              clearPlayRoundState();
              setPhase('hub');
            }}
            playSfx={playSfx}
          />
        </div>
      )}

      {phase === 'adaptRes' && lastResult?.type === 'adaptive' && (() => {
        const thr = lastResult.threshold ?? 0;
        const { diff, lv } = freeStageToDiffLv(thr);
        const tierLabel = DM[diff]?.label ?? '';
        const norm = Math.round((thr / 299) * 100);
        return (
          <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
            <div className="ct-fq-screen ct-fq-training-screen">
              <TrainingMenuBar
                onBack={() => {
                  setLastResult(null);
                  clearPlayRoundState();
                  setPhase('assessIntro');
                }}
                playSfx={playSfx}
                variant="paper"
                center={
                  <div style={{ textAlign: 'center' }}>
                    <div className="ct-fq-training-title ct-fq-training-title-sm">{t.adaptResTitle}</div>
                  </div>
                }
              />
              <div className="ct-fq-sbig">{norm}</div>
              <div className="ct-fq-ies-lbl">{t.adaptResLabel} · {t.adaptResSub}</div>
              <div
                className="ct-fq-sub ct-fq-training-blurb"
                style={{ marginTop: 10, fontWeight: 700, fontSize: '0.92rem' }}
              >
                {t.adaptResLevel(tierLabel, lv)}
              </div>
              <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>
                {t.adaptResMeta(lastResult.trials, lastResult.reversals)}
              </p>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                onClick={() => {
                  playSfx('click');
                  setLastResult(null);
                  startThreshold();
                }}
              >
                {t.adaptAgain}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  setLastResult(null);
                  clearPlayRoundState();
                  setPhase('assessIntro');
                }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        );
      })()}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div>
                </div>
              }
            />
            {[...lastResult.rows].sort((a, b) => b.ies - a.ies).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">
                    {t.chalResDetail(
                      row.rounds?.length || 1,
                      row.timeUsed,
                      row.errors,
                      row.acc,
                      row.tps,
                    )}
                  </div>
                </div>
                <div className="ct-fq-lbsc">{Math.round(row.ies)}</div>
              </div>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                clearPlayRoundState();
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
                clearPlayRoundState();
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'assessStart' && (
        <AssessmentReady
          isAr={isAr}
          label={assessmentLabel}
          step={assessmentStep}
          domainId={assessmentDomainId}
          onStart={beginBatteryAssessment}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
      )}

      {phase === 'assessIntro' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={exitAssess}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.assessIntroTitle}</div>
                </div>
              }
            />
            <div className="ct-fq-diff-body">
              <div className="ct-fq-assess-intro">
                <p className="ct-fq-sub ct-fq-training-blurb">{t.assessIntroBody}</p>
                <p className="ct-fq-sub ct-fq-training-blurb">{t.assessIntroMeasures}</p>
                <p className="ct-fq-assess-note">{t.assessIntroNote}</p>
              </div>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                style={{ width: '100%', maxWidth: 320 }}
                onClick={onAssessIntroReady}
              >
                {t.assessStart}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                style={{ width: '100%', maxWidth: 320 }}
                onClick={() => {
                  playSfx('click');
                  startThreshold();
                }}
              >
                {t.assessThreshold}
              </button>
              {assessHistory.length > 0 && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  style={{ width: '100%', maxWidth: 320 }}
                  onClick={() => {
                    playSfx('click');
                    setPhase('assessHistory');
                  }}
                >
                  {t.assessViewHistory}
                </button>
              )}
              <HubScienceLink gameId="cancel-task" isAr={isAr} playSfx={playSfx} />
            </div>
          </div>
        </div>
      )}

      {phase === 'assessRes' && assessResult && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={exitAssess}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.assessResTitle}</div>
                </div>
              }
            />
            <div className={`ct-fq-sbig ct-fq-band-text-${assessResult.bands.composite}`}>
              {assessResult.composite}
            </div>
            <div className="ct-fq-ies-lbl">{t.assessIndex} · {t.assessIndexSub}</div>
            <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid">
              <AssessMetricTile
                value={`${Math.round(assessResult.detection * 100)}%`}
                label={t.mDetection}
                sub={t.mDetectionSub}
                band={assessResult.bands.detection}
                bandLabel={bandLbl(assessResult.bands.detection)}
              />
              <AssessMetricTile
                value={`${Math.round(assessResult.precision * 100)}%`}
                label={t.mPrecision}
                sub={t.mPrecisionSub}
                band={assessResult.bands.precision}
                bandLabel={bandLbl(assessResult.bands.precision)}
              />
              <AssessMetricTile
                value={assessResult.speed.toFixed(2)}
                label={t.mSpeed}
                sub={t.mSpeedSub}
                band={assessResult.bands.speed}
                bandLabel={bandLbl(assessResult.bands.speed)}
              />
              <AssessMetricTile
                value={assessResult.meanRT != null ? `${assessResult.meanRT}` : '—'}
                label={t.mRt}
                sub={t.mRtSub}
              />
              <AssessMetricTile
                value={assessResult.rtCV != null ? assessResult.rtCV.toFixed(2) : '—'}
                label={t.mStability}
                sub={t.mStabilitySub}
                band={assessResult.bands.rtcv}
                bandLabel={bandLbl(assessResult.bands.rtcv)}
              />
              <AssessMetricTile
                value={`${assessResult.totalOmissions}·${assessResult.totalCommissions}`}
                label={t.mErrors}
                sub={t.mErrorsSub}
              />
              <AssessMetricTile
                value={assessResult.dPrime != null ? assessResult.dPrime.toFixed(2) : '—'}
                label={t.mDPrime}
                sub={t.mDPrimeSub}
                band={assessResult.bands.dprime}
                bandLabel={bandLbl(assessResult.bands.dprime)}
              />
              <AssessMetricTile
                value={
                  assessResult.criterion != null
                    ? `${assessResult.criterion > 0 ? '+' : ''}${assessResult.criterion.toFixed(2)}`
                    : '—'
                }
                label={t.mBias}
                sub={t.mBiasSub(
                  assessResult.bands.criterion === 'cautious'
                    ? t.biasCautious
                    : assessResult.bands.criterion === 'impulsive'
                      ? t.biasImpulsive
                      : t.biasBalanced,
                )}
              />
              <AssessMetricTile
                value={
                  assessResult.cocH != null
                    ? `${assessResult.cocH > 0 ? '+' : ''}${assessResult.cocH.toFixed(2)}`
                    : '—'
                }
                label={t.mBalance}
                sub={t.mBalanceSub(
                  assessResult.cocH == null || Math.abs(assessResult.cocH) <= 0.1
                    ? t.balanceEven
                    : assessResult.cocH < 0
                      ? t.balanceLeft
                      : t.balanceRight,
                  assessResult.scanLat == null || Math.abs(assessResult.scanLat) <= 0.15
                    ? t.scanMid
                    : assessResult.scanLat < 0
                      ? t.scanL
                      : t.scanR,
                )}
                band={assessResult.bands.spatial}
                bandLabel={bandLbl(assessResult.bands.spatial)}
              />
              <AssessMetricTile
                value={assessResult.orgScore != null ? `${Math.round(assessResult.orgScore * 100)}` : '—'}
                label={t.mOrg}
                sub={t.mOrgSub(assessResult.bestR != null ? assessResult.bestR.toFixed(2) : '—')}
                band={assessResult.bands.organization}
                bandLabel={bandLbl(assessResult.bands.organization)}
              />
            </div>
            <div className="ct-fq-row">
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-pri"
                onClick={() => {
                  playSfx('click');
                  startAssessment();
                }}
              >
                {t.assessAgain}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={() => {
                  playSfx('click');
                  setPhase('assessHistory');
                }}
              >
                {t.assessViewHistory}
              </button>
              <button
                type="button"
                className="ct-fq-btn ct-fq-btn-ghost"
                onClick={exitAssess}
              >
                {t.menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'assessHistory' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                if (assessResult) setPhase('assessRes');
                else exitAssess();
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.assessHistTitle}</div>
                </div>
              }
            />
            {assessHistory.length === 0 ? (
              <p className="ct-fq-sub ct-fq-training-blurb">{t.assessNoHistory}</p>
            ) : (
              <>
                {(() => {
                  const best = Math.max(...assessHistory.map((s) => s.composite));
                  const comps = assessHistory.map((s) => s.composite);
                  const lo = Math.min(...comps);
                  const hi = Math.max(...comps);
                  const span = hi - lo || 1;
                  const W = 280;
                  const H = 56;
                  const n = comps.length;
                  const pts = comps
                    .map((c, i) => {
                      const x = n === 1 ? W / 2 : (i / (n - 1)) * W;
                      const y = H - ((c - lo) / span) * H;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');
                  return (
                    <>
                      <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginBottom: 6 }}>
                        {t.assessHistBest(best)}
                      </p>
                      {n > 1 && (
                        <svg
                          className="ct-fq-spark"
                          viewBox={`0 0 ${W} ${H}`}
                          preserveAspectRatio="none"
                          aria-hidden="true"
                        >
                          <polyline points={pts} fill="none" stroke="#b87220" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                        </svg>
                      )}
                    </>
                  );
                })()}
                <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 4, marginBottom: 8, fontWeight: 700 }}>
                  {t.assessHistRecent}
                </p>
                {[...assessHistory]
                  .map((s, i) => ({ s, i }))
                  .reverse()
                  .map(({ s, i }) => {
                    const prev = i > 0 ? assessHistory[i - 1].composite : null;
                    const delta = prev != null ? s.composite - prev : 0;
                    const d = new Date(s.ts);
                    const when = `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    return (
                      <div key={s.ts} className="ct-fq-lbr ct-fq-lbr-training">
                        <div className={`ct-fq-lbrk ct-fq-band-text-${compositeBand(s.composite)}`}>
                          {s.composite}
                        </div>
                        <div>
                          <div className="ct-fq-lbnm">{when}</div>
                          <div className="ct-fq-lbdt">
                            {Math.round(s.detection * 100)}% · {s.speed.toFixed(2)}/s · {s.meanRT ?? '—'}ms · CV {s.rtCV ?? '—'}
                          </div>
                        </div>
                        <div className="ct-fq-lbsc" style={{ fontSize: '0.9rem' }}>
                          {prev != null ? t.assessVsPrev(delta) : ''}
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                startAssessment();
              }}
            >
              {t.assessAgain}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={exitAssess}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {/* Countdown / quick-flash carry the target cue card (level · free ·
          challenge). Assessment & adaptive use the bare centred "+" fixation so
          the gaze origin stays clean for Center-of-Cancellation; their target
          chip lives in the top bar and the rule is given in the intro. */}
      {phase === 'play' && (cdShow || cueShow) && round && (
        <div
          className={`ct-fq-cd${round.mode === 'free' && cueShow ? ' ct-fq-cd--ready' : ''}`}
          role={round.mode === 'free' && cueShow ? 'dialog' : undefined}
          aria-modal={round.mode === 'free' && cueShow ? 'true' : undefined}
          aria-label={round.mode === 'free' && cueShow ? t.survivalCueTitle : undefined}
        >
          {cdShow && <div className="ct-fq-cd-num">{cdVal}</div>}
          {round.mode === 'free' && cueShow && (
            <div className="ct-fq-cue-kicker">{t.survivalCueTitle}</div>
          )}
          <button
            type="button"
            className={`ct-fq-cue-card${round.mode === 'free' && cueShow ? ' ct-fq-cue-card--ready' : ''}`}
            onClick={round.mode === 'free' && cueShow ? confirmSurvivalTarget : undefined}
            disabled={!(round.mode === 'free' && cueShow)}
            aria-label={round.mode === 'free' && cueShow ? t.survivalCueReady : undefined}
          >
            <div className="ct-fq-cue-chip">
              <CancellationTarget
                round={round}
                cells={cells}
                size={round.mode === 'free' ? 78 : 52}
                isAr={isAr}
              />
            </div>
            {/* No "looks exactly like this" branch any more: `identity` boards
                are gone, so the instruction is always about the OBJECT. Saying
                "exactly" when colour no longer counts would teach the wrong
                rule and produce the false alarms it used to describe. */}
            <div className="ct-fq-cue-text">
              {round.mode === 'free' ? t.survivalCueTask : t.cueShape}
            </div>
            {round.mode === 'free' && cueShow && (
              <span className="ct-fq-cue-ready-label">{t.survivalCueReady}</span>
            )}
          </button>
          {round.mode === 'free' && cueShow && (
            <div className="ct-fq-cue-ready-hint">{t.survivalCueHint}</div>
          )}
          {cdShow && <div className="ct-fq-cd-lbl">{t.countdownHint}</div>}
        </div>
      )}

      {phase === 'play' && fixShow && (
        <div className="ct-fq-cd" aria-hidden="true">
          <div className="ct-fq-fix-cross">+</div>
          <div className="ct-fq-cd-lbl">{t.fixHint}</div>
        </div>
      )}

    </div>
  );
}
