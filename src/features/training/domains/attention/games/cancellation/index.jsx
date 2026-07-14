import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
  useSyncExternalStore,
} from 'react';
import {
  getShapeScale,
  subscribeShapeNorm,
  getShapeNormVersion,
} from '../../../../shared/shapeNorm';
import { createStaircase } from './staircase';
import { useApp } from '../../../../../../context/AppContext';
import {
  SH,
  DM,
  TC,
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
  FQ_DIFF_KEYS,
  FQ_LEVELS_PER_TIER,
} from '../../../../shared/focusQuestData';
import {
  TrainingMenuBar,
  TrainingChromeBtn,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { IconBack, IconPause } from '../../../../shared/TrainingIcons';
import { TrainingDifficultySelect, TrainingLevelGrid, TrainingModeList } from '../../../../shared/TrainingScreens';
import HubScienceLink from '../../../../shared/HubScienceLink';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { createTrialLog } from '../../../../shared/trialLog';
import { useTrainingTutorialHost } from '../../../../shared/tutorials/useTrainingTutorialHost';
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
  try {
    const j = localStorage.getItem(PROFILE_KEY);
    if (j) {
      const parsed = JSON.parse(j);
      return {
        tel: parsed.tel || [],
        done: parsed.done || {},
        freeBest: parsed.freeBest ?? 0,
        freeBestScore: parsed.freeBestScore ?? 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { tel: [], done: {}, freeBest: 0, freeBestScore: 0 };
}

function saveProfile(p) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Parse each shape's SVG markup into a real React element ONCE (cached), so the
// shape is rendered as a React-managed SVG child instead of being injected as an
// HTML string. Injecting markup with `dangerouslySetInnerHTML` on an <svg> node
// is the source of the intermittent "empty square / empty target" bug: setting
// `.innerHTML` on an SVG element during React reconciliation can occasionally
// leave a tile with no rendered shape. Proper React SVG children always render.
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
  // Guaranteed fallback — a tile is never blank even if parsing failed.
  if (!el) el = FALLBACK_SHAPE_EL;
  shapeElCache[key] = el;
  return el;
}

const ShapeSvg = React.memo(function ShapeSvg({ shape, color, size = 40 }) {
  // Re-render once filled-area measurement completes (memo only blocks
  // prop-driven updates, not this external-store subscription).
  useSyncExternalStore(subscribeShapeNorm, getShapeNormVersion, getShapeNormVersion);
  const scale = getShapeScale(shape);
  // Apply the area-normalization scale through the VIEWBOX, not a CSS transform.
  // A CSS `transform: scale()` with `transform-origin: center` on an SVG that is
  // also CSS-sized (the cell sets svg width/height to 90%) is browser-flaky and
  // could intermittently push the shape off-canvas → a blank cell. Widening the
  // viewBox around the centre (50,50) shrinks the drawn shape with pure
  // coordinates — no transform, no origin, always renders.
  let viewBox = '0 0 100 100';
  if (scale > 0 && scale < 1) {
    const span = 100 / scale;
    const off = (span - 100) / 2;
    viewBox = `${-off.toFixed(2)} ${-off.toFixed(2)} ${span.toFixed(2)} ${span.toFixed(2)}`;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      style={{ color: color || '#2d2d2d', display: 'block' }}
    >
      {getShapeEl(shape)}
    </svg>
  );
});

/** Light attention hub — mode rows (no circular maze). */
function FqAttentionLightModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    {
      k: 'free',
      ic: '♾️',
      lb: t.freeMode,
      hint: t.hubNodeFreeHint,
      on: onFree,
      mod: 'ct-fq-attn-mode--free',
    },
    {
      k: 'levels',
      ic: '🎯',
      lb: t.levelMode,
      hint: t.hubNodeLevelsHint,
      on: onLevels,
      mod: 'ct-fq-attn-mode--levels',
    },
    {
      k: 'chal',
      ic: '⚔️',
      lb: t.challengeMode,
      hint: t.hubNodeChallengeHint,
      on: onChallenge,
      mod: 'ct-fq-attn-mode--chal',
    },
  ];
  return <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />;
}

const FqGridCell = React.memo(function FqGridCell({ cell, idx, size, running, onTap }) {
  return (
    <button
      type="button"
      className={`ct-fq-sc ${cell.feedback === 'ok' ? 'ok' : ''} ${cell.feedback === 'bad' ? 'bad' : ''} ${cell.feedback === 'mark' ? 'mark' : ''}`}
      disabled={cell.tapped || !running}
      onClick={() => onTap(idx)}
    >
      <ShapeSvg shape={cell.shape} color={cell.fill} size={size} />
      {cell.feedback === 'ok' && <span className="ct-fq-ck">✓</span>}
      {cell.feedback === 'bad' && <span className="ct-fq-pi">-3s</span>}
    </button>
  );
});

/**
 * Single consolidated play bar: back · target chip · live stats · pause, then
 * one slim time bar. Replaces the old stacked header + stats row + cue band +
 * two progress bars so the grid (the real task) gets the vertical space.
 * Owns its own rAF tick so the shape grid is not repainted every frame.
 */
function CtLiveHud({
  t,
  playStep,
  pauseOpen,
  tlRef,
  tlimRef,
  roundTlim,
  useSessionTimer,
  found,
  tc,
  errors,
  errorsLabel,
  errorsMax,
  hideErrors,
  lvlLabel,
  freeScore,
  freeLives,
  targetShape,
  targetColor,
  onMenu,
  onPause,
  menuAriaLabel,
  pauseAriaLabel,
  playSfx,
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (playStep !== 'running' || pauseOpen) return undefined;
    let id = 0;
    const step = () => {
      setTick((n) => (n + 1) % 1_000_000);
      id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [playStep, pauseOpen]);

  const liveAnim = playStep === 'running' && !pauseOpen;
  const denom = (() => {
    if (useSessionTimer) return tlimRef.current || 1;
    return tlimRef.current || roundTlim || 1;
  })();
  const displaySeconds = useSessionTimer
    ? tlRef.current
    : playStep === 'running'
      ? tlRef.current
      : roundTlim;
  const pctTime = useSessionTimer
    ? Math.max(0, Math.min(1, tlRef.current / denom))
    : playStep !== 'running'
      ? 1
      : Math.max(0, Math.min(1, tlRef.current / denom));

  return (
    <>
      <div className="ct-fq-bar" data-fq-chrome>
        <TrainingChromeBtn
          ariaLabel={menuAriaLabel}
          onClick={() => {
            playSfx('click');
            onMenu();
          }}
        >
          <IconBack size={18} c="#141210" />
        </TrainingChromeBtn>
        <div className="ct-fq-bar-chip" aria-hidden="true">
          <ShapeSvg shape={targetShape} color={targetColor} size={30} />
        </div>
        <div className="ct-fq-bar-stats">
          <div className="ct-fq-gs">
            <div className={`ct-fq-gv ${liveAnim && tlRef.current <= 10 ? 'tv' : ''}`}>
              {`${Number(displaySeconds).toFixed(1)}s`}
            </div>
            <div className="ct-fq-gl">{t.time}</div>
          </div>
          <div className="ct-fq-gs">
            <div className="ct-fq-gv">
              {found}/{tc}
            </div>
            <div className="ct-fq-gl">{t.found}</div>
          </div>
          {!hideErrors && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv ac2">
                {errorsMax != null ? `${errors}/${errorsMax}` : errors}
              </div>
              <div className="ct-fq-gl">{errorsLabel ?? t.err}</div>
            </div>
          )}
          {lvlLabel != null && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv sm">{lvlLabel}</div>
              <div className="ct-fq-gl">{t.lvl}</div>
            </div>
          )}
          {freeLives != null && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv ct-fq-lives" aria-label={`${freeLives} lives`}>
                {'♥'.repeat(Math.max(0, freeLives))}
                <span className="ct-fq-lives-spent">
                  {'♥'.repeat(Math.max(0, FREE_LIVES - freeLives))}
                </span>
              </div>
              <div className="ct-fq-gl">{t.lives}</div>
            </div>
          )}
          {freeScore != null && (
            <div className="ct-fq-gs">
              <div className="ct-fq-gv">{freeScore}</div>
              <div className="ct-fq-gl">{t.score}</div>
            </div>
          )}
        </div>
        {onPause && (
          <TrainingChromeBtn
            ariaLabel={pauseAriaLabel}
            onClick={() => {
              playSfx('click');
              onPause();
            }}
          >
            <IconPause size={17} c="#141210" />
          </TrainingChromeBtn>
        )}
      </div>
      <div className="ct-fq-cbw" data-fq-chrome>
        <div
          className="ct-fq-cb"
          style={{
            width: `${pctTime * 100}%`,
            background:
              pctTime > 0.5
                ? 'linear-gradient(90deg,#6b9e7a,#7ab87a)'
                : pctTime > 0.2
                  ? 'linear-gradient(90deg,#e8c47a,#e8a07a)'
                  : 'linear-gradient(90deg,#e8a07a,#c97a7a)',
          }}
        />
      </div>
    </>
  );
}

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
    hubNodeLevelsHint: '100 levels per tier · unlock in order',
    hubNodeChallengeHint: 'Same board for all · pick a difficulty',
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
      easy: 'Distinct shapes — spot the odd one out fast.',
      medium: 'Similar shapes & colours — look more carefully.',
      hard: 'Near-identical shapes — match shape and colour.',
    },
    diffTargets: 'targets',
    diffGrid: 'grid',
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–100`,
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
    ies: 'IES score',
    rt: 'Avg RT',
    countdownHint: 'Get ready…',
    fixHint: 'Focus on the centre…',
    cueExact: 'Tap every tile that looks exactly like this.',
    cueShape: 'Tap every tile that shows this shape.',
    assessMode: '📊 Assessment',
    hubNodeAssessHint: 'Standardized test · track your attention',
    assessIntroTitle: 'Attention Assessment',
    assessIntroBody:
      'A standardized 4-trial Mesulam-style cancellation test (~4 min). Each trial shows a fresh 7×7 board — find every matching tile within 50 seconds. Work quickly but accurately; wrong taps and missed targets both count.',
    assessIntroMeasures: 'It measures selective attention, processing speed, response inhibition, and attentional stability (how consistent your reaction times are).',
    assessIntroNote:
      'Self-referenced: best used to track your own change over time. These are guideline scores, not a clinical diagnosis.',
    assessStart: 'Start assessment',
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
    hubNodeLevelsHint: '١٠٠ مستوى لكل صعوبة · بالترتيب',
    hubNodeChallengeHint: 'نفس اللوحة للجميع · اختر الصعوبة',
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
      easy: 'أشكال مختلفة — اكتشف المختلف بسرعة.',
      medium: 'أشكال وألوان متشابهة — دقّق أكثر.',
      hard: 'أشكال شبه متطابقة — طابق الشكل واللون.',
    },
    diffTargets: 'أهداف',
    diffGrid: 'شبكة',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–100`,
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
    ies: 'درجة IES',
    rt: 'متوسط زمن الاستجابة',
    countdownHint: 'استعد…',
    fixHint: 'ركّز على المركز…',
    cueExact: 'المس كل مربع يطابق هذا الرمز تمامًا.',
    cueShape: 'المس كل مربع يحتوي على هذا الشكل.',
    assessMode: '📊 تقييم',
    hubNodeAssessHint: 'اختبار موحّد · تابع انتباهك',
    assessIntroTitle: 'تقييم الانتباه',
    assessIntroBody:
      'اختبار شطب موحّد من ٤ محاولات على نمط ميسولام (~٤ د). كل محاولة لوحة 7×7 جديدة — جِد كل المربعات المطابقة خلال ٥٠ ثانية. اعمل بسرعة وبدقة؛ النقر الخاطئ والأهداف المفقودة يُحتسبان.',
    assessIntroMeasures: 'يقيس الانتباه الانتقائي وسرعة المعالجة وكبح الاستجابة واستقرار الانتباه (مدى ثبات زمن استجابتك).',
    assessIntroNote:
      'مرجعي ذاتي: الأفضل لتتبّع تغيّرك مع الوقت. هذه درجات إرشادية وليست تشخيصاً سريرياً.',
    assessStart: 'ابدأ التقييم',
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

  const [profile, setProfile] = useState(() => loadProfile());
  // When launched as an assessment (from the training-page fox), skip the game
  // hub and go straight into the standardized assessment intro.
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');

  const [round, setRound] = useState(null);
  const [cells, setCells] = useState([]);
  const [playStep, setPlayStep] = useState('idle');
  const [cdShow, setCdShow] = useState(false);
  const [cdVal, setCdVal] = useState(3);
  // Central fixation cue shown before each assessment grid — controls the start
  // gaze so Center-of-Cancellation, scan laterality and RT have a clean origin.
  const [fixShow, setFixShow] = useState(false);
  // Brief "here's your target" cue card shown before a round starts (replaces the
  // old always-on cue band). For countdown-off level/free rounds it's the only
  // pre-round beat; countdown / fixation overlays carry the same cue otherwise.
  const [cueShow, setCueShow] = useState(false);
  const [found, setFound] = useState(0);
  const [errors, setErrors] = useState(0);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
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
  const staircaseRef = useRef(null); // adaptive 2-down/1-up threshold engine
  const [assessResult, setAssessResult] = useState(null);
  const [assessHistory, setAssessHistory] = useState(() => loadAssessHistory());
  const [gridMetrics, setGridMetrics] = useState({
    cellW: 32,
    cellH: 32,
    gap: 3,
    pad: 6,
  });
  const shakeTimerRef = useRef(0);

  const juice = useJuice();
  const rLabels = ratingLabels(isAr);
  const { openTutorial, replayHint: tutReplayHint, layer: tutLayer } = useTrainingTutorialHost('cancel-task', isAr, playSfx);

  useEffect(() => () => {
    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = 0;
    }
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
        p.done[`${r.diff}-${r.lv}`] = true;
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
        const s = loadGameSettings();
        if (!s.countdown) {
          // No 3-2-1: show a brief target cue card instead. The await also keeps
          // idle and running in separate turns — React would otherwise batch
          // idle→running to a no-op (frozen clock on round 2+).
          setPlayStep('idle');
          await flashCue();
          setPlayStep('running');
          return;
        }
        setPlayStep('idle');
        setCdShow(true);
        try {
          for (let i = 3; i > 0; i--) {
            setCdVal(i);
            playSfx('click');
            await sleep(380);
          }
          setCdVal('GO');
          playSfx('collect');
          await sleep(320);
        } finally {
          setCdShow(false);
        }
        setPlayStep('running');
      } finally {
        roundEndedRef.current = false;
      }
    },
    [playSfx, clearPlayRoundState, flashCue],
  );

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

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'free' });
    void beginFreeRoundAtStage(0);
  }, [playSfx, beginFreeRoundAtStage]);

  const beginAssessmentTrial = useCallback(
    async (idx) => {
      try {
        setPhase('play');
        setCdShow(false);
        let r;
        try {
          // idx -1 = unscored practice grid: same protocol, shorter clock.
          r = prepareAssessmentTrial(Math.max(0, idx));
          if (idx < 0) {
            r.assessPractice = true;
            r.tlim = 20;
          }
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
    setAssessResult(null);
    setPhase('assessIntro');
  }, []);

  const beginBatteryAssessment = useCallback(() => {
    playSfx('click');
    assessTrialsRef.current = [];
    assessTapsRef.current = [];
    assessIdxRef.current = 0;
    setAssessResult(null);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'assess' });
    void beginAssessmentTrial(-1);
  }, [playSfx, beginAssessmentTrial]);

  const onAssessIntroReady = useCallback(() => {
    playSfx('click');
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
            omitPos.push({ idx: i, row: Math.floor(i / r.grid), col: i % r.grid });
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
        setChalScores(base);
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
          // Practice grid done — start the measured battery, nothing recorded.
          playSfx('win');
          setPauseOpen(false);
          void beginAssessmentTrial(0);
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
      if (won) awardTrainingWin('cancel', r.diff, r.lv, FQ_LEVELS_PER_TIER);
      persistLevel(r, stats, f, e);
      setLastResult({ type: 'level', stats, r, won, found: f, errors: e });
      setPhase('res');
    },
    [stopTimer, persistLevel, playSfx, beginFreeRoundAtStage, beginAssessmentTrial, beginAdaptiveTrial, onAssessmentComplete, awardFreeRun, awardTrainingWin],
  );

  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

  useEffect(() => () => trialLogRef.current?.discard(), []);

  useEffect(() => {
    if (playStep !== 'running' || pauseOpen) return;
    let id;
    let last = performance.now();
    const runId = timerRunIdRef.current + 1;
    timerRunIdRef.current = runId;
    warned10Ref.current = false;
    runRef.current = true;
    const loop = (ts) => {
      if (!runRef.current || pauseOpen || timerRunIdRef.current !== runId) return;
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
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      if (timerRunIdRef.current === runId) runRef.current = false;
    };
  }, [playStep, pauseOpen, playSfx]);

  useLayoutEffect(() => {
    if (phase !== 'play' || !round) return;
    const wrap = gridWrapRef.current;
    if (!wrap) return;
    const gridN = round.grid;
    const isDenseHard = round.diff === 'hard' && gridN >= 9;
    let raf = 0;
    const measure = () => {
      const vv = window.visualViewport;
      const vpH = vv?.height ?? window.innerHeight;
      const vpW = vv?.width ?? window.innerWidth;
      let fixed = 0;
      wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => {
        fixed += el.getBoundingClientRect().height;
      });
      // Cushion for grid wrapper padding / rounding — keep small so cells use real space.
      fixed += 6;
      const cs = window.getComputedStyle(wrap);
      const wrapPadX =
        (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      const wrapBoundW = wrap.getBoundingClientRect().width || vpW;
      const GRID_OUTER_INNER_OVERHEAD = 8;
      const availFromWrap = Math.max(
        120,
        Math.floor(wrapBoundW - wrapPadX - GRID_OUTER_INNER_OVERHEAD),
      );
      const availW = Math.min(availFromWrap, Math.floor(vpW * 0.995));
      // Use almost all space below measured HUD (visualViewport already omits mobile browser chrome).
      const verticalReserve = 3;
      let availHCalc = Math.max(
        isDenseHard ? 72 : 64,
        Math.min(
          Math.floor(vpH - fixed - verticalReserve),
          Math.floor(vpH * 0.99),
        ),
      );
      const outerEl = wrap.querySelector('.ct-fq-grid-outer');
      const outerRectH =
        outerEl &&
        typeof outerEl.getBoundingClientRect === 'function'
          ? Math.floor(outerEl.getBoundingClientRect().height)
          : 0;
      // Prefer the real flex slot height so the grid matches the phone layout below the HUD.
      const availH =
        outerRectH > 80
          ? Math.max(isDenseHard ? 72 : 64, outerRectH - 10)
          : availHCalc;
      const gap = gridN >= 7 ? 2 : 3;
      const INNER_PAD = 3;
      const totalGap = gap * (gridN - 1);
      const minCell = gridN >= 10 ? 16 : 8;
      // SQUARE cells: shapes in a cancellation task must stay recognisable, so
      // the cell is sized to the smaller of the width-fit and height-fit. The
      // grid then fits both axes (no scrolling) and is centred by .ct-fq-grid-outer.
      const innerBudgetW = Math.max(40, availW - INNER_PAD * 2);
      const innerBudgetH = Math.max(40, availH - INNER_PAD * 2);
      const fitW = Math.floor((innerBudgetW - totalGap) / gridN);
      const fitH = Math.floor((innerBudgetH - totalGap) / gridN);
      let cell = Math.max(minCell, Math.min(fitW, fitH));
      // Guard against either axis overflowing if min-cell forced an oversize.
      const needSide = cell * gridN + totalGap + INNER_PAD * 2;
      if (needSide > availW || needSide > availH) {
        cell = Math.max(
          8,
          Math.floor((Math.min(availW, availH) - totalGap - INNER_PAD * 2) / gridN),
        );
      }
      // Square cells leave vertical slack on tall phones (board looks empty).
      // The shape is sized by the SMALLER dimension, so we make cells TALLER to
      // fill the height without distorting shapes (the shape stays centred with
      // even spacing) — this exploits the phone's spare vertical space and gives
      // bigger, more comfortable tap targets. Capped so cells never look stretched.
      const cellH = Math.max(cell, Math.min(fitH, Math.round(cell * 1.85)));
      setGridMetrics({ cellW: cell, cellH, gap, pad: INNER_PAD });
    };
    measure();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(wrap);
    const onVv = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.visualViewport?.addEventListener('resize', onVv);
    window.visualViewport?.addEventListener('scroll', onVv);
    return () => {
      cancelAnimationFrame(raf);
      window.visualViewport?.removeEventListener('resize', onVv);
      window.visualViewport?.removeEventListener('scroll', onVv);
      ro.disconnect();
    };
  }, [phase, round, cells.length]);

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

  const startLevelGame = async (diff, lv) => {
    setPhase('play');
    setPlayStep('idle');
    setCdShow(false);
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'cancel-task', mode: 'level', meta: { diff, lv } });
    let r;
    try {
      r = prepareLevelRound(diff, lv);
    } catch (err) {
      console.error('[Focus Quest] prepareLevelRound failed', diff, lv, err);
      clearPlayRoundState();
      setPhase('levels');
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
    // Debounce sub-70ms repeats: two intentional taps are physically ≥100ms
    // apart, so anything faster is a double-fire / palm-bounce artifact that
    // would corrupt RT and false-alarm counts. Drop it silently.
    if (lastTapRef.current && now - lastTapRef.current < 70) return;
    const itt = lastTapRef.current ? now - lastTapRef.current : null;
    if (lastTapRef.current) tapsRef.current.push(now - lastTapRef.current);
    lastTapRef.current = now;

    // Per-response record: grid position (idx/row/col), target flag, response
    // rank, round-onset latency (tOn), and `lead` marking the first response so
    // its latency (search-onset RT) can be separated from later inter-response
    // times. Feeds Center-of-Cancellation, search-organization, and SDT metrics.
    const ord = (roundOrdRef.current += 1);
    const tOn = gridOnsetRef.current ? Math.round(now - gridOnsetRef.current) : null;
    const posFields = {
      idx,
      row: Math.floor(idx / r.grid),
      col: idx % r.grid,
      isT: !!c.isT,
      ord,
      ...(ord === 1 ? { lead: true } : {}),
      ...(tOn != null ? { tOn } : {}),
    };

    // Assessment is feedback-free (clinical cancellation gives no correctness
    // cue): same neutral tap sound for hits/false-alarms, a neutral 'mark' (no
    // green/red, no ✓/−3s, no shake), and no time penalty — so the player can't
    // infer correctness and adjust strategy mid-test.
    const isAssess = r.mode === 'assess' || r.mode === 'adaptive';
    if (c.isT) {
      if (!r.assessPractice) {
        trialLogRef.current?.trial({ ...(itt != null ? { rt: Math.round(itt) } : {}), ok: true, ...posFields });
      }
      foundIdxRef.current.add(idx);
      roundFoundSeqRef.current.push({ idx, row: posFields.row, col: posFields.col });
      playSfx(isAssess ? 'click' : 'collect');
      if (!isAssess) juice.hit({});
      talliesRef.current.found += 1;
      const tappedTargets = talliesRef.current.found;
      setFound(tappedTargets);
      setCells((prev) => {
        const next = prev.map((x, i) => (i === idx ? { ...x, tapped: true, feedback: isAssess ? 'mark' : 'ok' } : x));
        cellsRef.current = next;
        return next;
      });
      if (r.mode === 'free') {
        const add = freeTapPoints(r.diff, r.freeStage ?? 0);
        freeScoreRef.current += add;
        setFreeScore(freeScoreRef.current);
      }
      if (r.tc > 0 && tappedTargets >= r.tc) {
        // No green solve-pulse here on purpose — the win screen is enough.
        endRoundRef.current(true);
      }
      return;
    }

    if (!r.assessPractice) {
      trialLogRef.current?.trial({ ...(itt != null ? { rt: Math.round(itt) } : {}), ok: false, ...posFields });
    }
    playSfx(isAssess ? 'click' : 'error');
    if (!isAssess) pendingPenaltyRef.current += 3;
    talliesRef.current.errors += 1;
    setErrors(talliesRef.current.errors);
    setCells((prev) => {
      const next = prev.map((x, i) => (i === idx ? { ...x, tapped: true, feedback: isAssess ? 'mark' : 'bad' } : x));
      cellsRef.current = next;
      return next;
    });
    if (r.mode === 'free') {
      const pen = freeWrongTapPenalty(r.diff);
      freeScoreRef.current = Math.max(0, freeScoreRef.current - pen);
      setFreeScore(freeScoreRef.current);
      // Too many wrong taps this round → fail the round (ends the run; 1 life).
      if (talliesRef.current.errors >= freeRoundErrorCap(r.tc)) {
        endRoundRef.current(false);
        return;
      }
    }
    if (!isAssess) {
      setShake(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setShake(false);
        shakeTimerRef.current = 0;
      }, 350);
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
    setChalScores(initial);
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
                onLevels={() => setPhase('diff')}
                onChallenge={() => setPhase('chal')}
              />
              <HubScienceLink gameId="cancel-task" isAr={isAr} playSfx={playSfx} />
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

      {phase === 'diff' && (
        <TrainingDifficultySelect
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => {
            clearPlayRoundState();
            setPhase('hub');
          }}
          title={t.pickDiff}
          blurb={t.pickDiffSub}
          diffKeys={FQ_DIFF_KEYS}
          dm={DM}
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
          title={DM[diffKey].label}
          blurb={t.levelsSub(DM[diffKey].pop, DM[diffKey].grid)}
          count={FQ_LEVELS_PER_TIER}
          lvc={DM[diffKey].lvc}
          isUnlocked={(lv) => isLevelUnlocked(diffKey, lv, doneMap)}
          isDone={(lv) => !!doneMap[`${diffKey}-${lv}`]}
          sublabel={(lv) => {
            const cfg = getLvCfg(diffKey, lv - 1);
            return `${cfg.tc}t·${cfg.time}s`;
          }}
          onPick={(lv) => startLevelGame(diffKey, lv)}
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
          metaLine={`${DM[chalDiff]?.label ?? ''} · ${PASS_PLAY_CONFIG[chalDiff]?.grid ?? 9}×${PASS_PLAY_CONFIG[chalDiff]?.grid ?? 9} · ${PASS_PLAY_CONFIG[chalDiff]?.tlim ?? 50}s`}
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
          <div className={`ct-fq-g-wrap ct-juice-host${juice.shake ? ' ct-juice-shake' : ''}`} ref={gridWrapRef}>
            <JuiceLayer
              combo={juice.combo}
              particle={juice.particle}
              rtFx={juice.rtFx}
              toast={juice.toast}
              burst={juice.burst}
              ratingLabels={rLabels}
              showCombo={false}
            />
            <CtLiveHud
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
              hideErrors={round.mode === 'assess' || round.mode === 'adaptive'}
              lvlLabel={
                round.mode === 'free'
                  ? null
                  : round.mode === 'assess'
                    ? `${(round.assessTrial ?? 0) + 1}/${round.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials}`
                    : round.mode === 'adaptive'
                      ? `R${(staircaseRef.current?.trialCount ?? 0) + 1}`
                      : round.lv === 'CH'
                        ? 'CH'
                        : `L${round.lv}`
              }
              freeScore={round.mode === 'free' ? freeScore : undefined}
              freeLives={round.mode === 'free' ? freeLives : undefined}
              targetShape={
                round.target in SH
                  ? round.target
                  : cells.find((c) => c.isT)?.shape || 'circle'
              }
              targetColor={
                round.targetCol || cells.find((c) => c.isT)?.fill || '#2d2d2d'
              }
              onMenu={onHudQuit}
              onPause={onHudPause}
              menuAriaLabel={t.menu}
              pauseAriaLabel={t.pause}
              playSfx={playSfx}
            />
            <div className="ct-fq-grid-outer">
              <div
                className="ct-fq-grid-inner"
                style={{
                  width:
                    round.grid * gridMetrics.cellW +
                    (round.grid - 1) * gridMetrics.gap +
                    gridMetrics.pad * 2,
                  height:
                    round.grid * gridMetrics.cellH +
                    (round.grid - 1) * gridMetrics.gap +
                    gridMetrics.pad * 2,
                }}
              >
                <div
                  className={`ct-fq-sg ${shake ? 'shake' : ''}`}
                  style={{
                    gridTemplateColumns: `repeat(${round.grid}, ${gridMetrics.cellW}px)`,
                    gridTemplateRows: `repeat(${round.grid}, ${gridMetrics.cellH}px)`,
                    gap: gridMetrics.gap,
                    width:
                      round.grid * gridMetrics.cellW +
                      (round.grid - 1) * gridMetrics.gap,
                    height:
                      round.grid * gridMetrics.cellH +
                      (round.grid - 1) * gridMetrics.gap,
                  }}
                >
                  {cells.map((c, idx) => (
                    <FqGridCell
                      key={c.id}
                      cell={c}
                      idx={idx}
                      size={Math.max(
                        16,
                        Math.min(gridMetrics.cellW, gridMetrics.cellH) - 6,
                      )}
                      running={playStep === 'running' && !pauseOpen}
                      onTap={onCellTap}
                    />
                  ))}
                </div>
              </div>
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
              if (round.mode === 'level') startLevelGame(round.diff, round.lv);
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

      {phase === 'res' && lastResult?.type === 'level' && (
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
                  <div className="ct-fq-training-title ct-fq-training-title-sm">
                    {lastResult.stats.won ? t.resultsLevelPass : t.resultsLevelRetryTitle}
                  </div>
                </div>
              }
            />
            <div className="ct-fq-sbig">{Math.round(lastResult.stats.ies)}</div>
            <div className="ct-fq-ies-lbl">{t.ies}</div>
            <div className="ct-fq-rm ct-fq-rm-training">
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.timeUsed}s</div>
                <div className="ct-fq-rl">{t.time}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.errors}</div>
                <div className="ct-fq-rl">{t.err}</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.acc}%</div>
                <div className="ct-fq-rl">Acc</div>
              </div>
              <div className="ct-fq-rmi">
                <div className="ct-fq-rv">{lastResult.stats.avgRt}ms</div>
                <div className="ct-fq-rl">{t.rt}</div>
              </div>
            </div>
            <div className="ct-fq-row">
              {lastResult.stats.won && lastResult.r.lv < 20 && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => {
                    playSfx('click');
                    setPhase('play');
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
                  clearPlayRoundState();
                  setPhase('hub');
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
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              variant="paper"
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.freeGameOver}</div>
                </div>
              }
            />
            <div className="ct-fq-sbig">{lastResult.score ?? 0}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <div
              className="ct-fq-sub ct-fq-training-blurb"
              style={{ marginTop: 10, fontWeight: 700, fontSize: '0.92rem' }}
            >
              {t.freeRoundsCleared(lastResult.roundsWon)}
            </div>
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>
              {t.freeBest(profile.freeBest ?? 0)} · {t.freeBestScoreLine(profile.freeBestScore ?? 0)}
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
                clearPlayRoundState();
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
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
        <div className="ct-fq-cd">
          {cdShow && <div className="ct-fq-cd-num">{cdVal}</div>}
          <div className="ct-fq-cue-card">
            <div className="ct-fq-cue-chip">
              <ShapeSvg
                shape={
                  round.target in SH
                    ? round.target
                    : cells.find((c) => c.isT)?.shape || 'circle'
                }
                color={
                  round.targetCol || cells.find((c) => c.isT)?.fill || '#2d2d2d'
                }
                size={52}
              />
            </div>
            <div className="ct-fq-cue-text">
              {round.searchMode === 'identity' ? t.cueExact : t.cueShape}
            </div>
          </div>
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
