import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  SH,
  DM,
  TC,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  prepareFreeRound,
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
  TrainingPlayHeader,
  TrainingPauseModal,
  TrainingQuitModal,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { ratingLabels } from '../../../../shared/juice/juiceUtils';
import { useCoach } from '../../../../shared/coach/useCoach';
import CoachOverlay from '../../../../shared/coach/CoachOverlay';
import { buildCancelCoachSteps } from './tutorialScript';
import {
  prepareAssessmentTrial,
  computeAssessmentSummary,
  saveAssessSession,
  loadAssessHistory,
  compositeBand,
  ASSESSMENT_PROTOCOL,
} from './assessmentData';
import { loadAssessProfile } from '../../../../assessment/assessmentProfile';


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

const ShapeSvg = React.memo(function ShapeSvg({ shape, color, size = 40 }) {
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
  return (
    <div className="ct-fq-attn-modes" role="group" aria-label={t.hubMapAria}>
      {items.map((m) => (
        <button
          key={m.k}
          type="button"
          className={`ct-fq-attn-mode ${m.mod}`}
          onClick={() => {
            playSfx('click');
            m.on();
          }}
        >
          <span className="ct-fq-attn-mode-ic" aria-hidden="true">
            {m.ic}
          </span>
          <span className="ct-fq-attn-mode-body">
            <span className="ct-fq-attn-mode-lb">{m.lb}</span>
            <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>
              {m.hint}
            </span>
          </span>
          <span className="ct-fq-attn-mode-chev" aria-hidden="true">
            ›
          </span>
        </button>
      ))}
    </div>
  );
}

const FqGridCell = React.memo(function FqGridCell({ cell, idx, size, running, onTap }) {
  return (
    <button
      type="button"
      className={`ct-fq-sc ${cell.feedback === 'ok' ? 'ok' : ''} ${cell.feedback === 'bad' ? 'bad' : ''}`}
      disabled={cell.tapped || !running}
      onClick={() => onTap(idx)}
    >
      <ShapeSvg shape={cell.shape} color={cell.fill} size={size} />
      {cell.feedback === 'ok' && <span className="ct-fq-ck">✓</span>}
      {cell.feedback === 'bad' && <span className="ct-fq-pi">-1s</span>}
    </button>
  );
});

/** Top stats + timer bars only; own rAF tick so the shape grid is not repainted every frame. */
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
  lvlLabel,
  freeScore,
  freeLives,
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

  const pctFound = tc > 0 ? Math.max(0, Math.min(1, found / tc)) : 0;

  return (
    <>
      <div className="ct-fq-g-top" data-fq-chrome>
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
        <div className="ct-fq-gs">
          <div className="ct-fq-gv ac2">
            {errorsMax != null ? `${errors}/${errorsMax}` : errors}
          </div>
          <div className="ct-fq-gl">{errorsLabel ?? t.err}</div>
        </div>
        <div className="ct-fq-gs">
          <div className="ct-fq-gv sm">{lvlLabel}</div>
          <div className="ct-fq-gl">{t.lvl}</div>
        </div>
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
      <div className="ct-fq-pbw" data-fq-chrome>
        <div className="ct-fq-pb" style={{ width: `${pctFound * 100}%` }} />
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
    back: '‹ BACK',
    title: 'CANCELLATION',
    subtitle: 'Selective attention & inhibition',
    freeMode: '♾️ Free mode',
    freeMenuSub:
      'Endless rounds that ramp up · 3 lives · a round costs a life if time runs out or you make too many wrong taps · score from taps, clears & streaks',
    freeStrikes: 'Errors',
    lives: 'Lives',
    freeLvlLabel: (tier, lv) => `Free · ${tier} ${lv}`,
    freeGameOver: 'Run ended',
    freeRoundsCleared: (n) => `Rounds cleared: ${n}`,
    freeBest: (n) => `Best clears: ${n}`,
    freeBestScoreLine: (n) => `Best score: ${n}`,
    freePlayAgain: 'Play again',
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'Endless practice that keeps getting harder. You have 3 lives. Each round has its own timer — clear every target before it runs out. Run out of time, or make too many wrong taps in a round, and you lose a life. Score on correct taps and full clears; streaks of clears multiply the bonus. The run only ends when your lives reach zero.',
    freeIntroReady: 'Ready',
    score: 'Score',
    hubChamberKicker: '⟡ FOCUS QUEST ⟡',
    hubAttentionWord: 'Attention',
    hubTrainingTag: 'training',
    resultsLevelPass: 'Level passed',
    resultsLevelRetryTitle: 'Try again',
    resultsChalTitle: 'Pass n Play results',
    hubMapAria: 'Modes map — choose a path',
    hubNodeFreeHint: 'Endless · 3 lives · ramps up',
    hubNodeLevelsHint: '100 levels per tier · unlock in order',
    hubNodeChallengeHint: 'Same board for all · pick a difficulty',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Pass n Play',
    menuHint: 'Visual search training: bind features, suppress distractors, and respond quickly—like lab tasks for attention and cognitive control.',
    pickDiff: 'Choose difficulty',
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
    challengeTitle: '⚔️ Pass n Play',
    challengeSub: 'Same board for everyone · pick a difficulty · pass the device',
    chalPickDiff: 'Difficulty',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    ready: (n) => `Ready — ${n}`,
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start round',
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same grid for every player this round',
    chalBulletPass: 'Tap Start only when the device is with this player',
    hubMenu: 'Same grid, fair compare.',
    time: 'Time',
    found: 'Found',
    err: 'Errors',
    lvl: 'Level',
    pause: 'Pause',
    quit: 'Quit',
    resume: 'Resume',
    restart: 'Restart level',
    quitMenu: 'Quit to menu',
    paused: 'Paused',
    quitQ: 'Quit?',
    quitLose: 'Progress on this round will be lost.',
    yesQuit: 'Yes, quit',
    keep: 'Keep playing',
    nextLv: 'Next level',
    retry: 'Retry',
    menu: 'Menu',
    newCh: 'New game',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Each player plays once per round · New fair grid each round',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s avg · ${e} err total · ${a}% · ${tp} t/s`
        : `${t}s · ${e} err · ${a}% · ${tp} t/s`,
    ies: 'IES score',
    rt: 'Avg RT',
    countdownHint: 'Get ready…',
    cueExact: 'Tap every tile that looks exactly like this.',
    cueShape: 'Tap every tile that shows this shape.',
    assessMode: '📊 Assessment',
    hubNodeAssessHint: 'Standardized test · track your attention',
    assessIntroTitle: 'Attention Assessment',
    assessIntroBody:
      'A standardized 3-trial test. Each trial shows the same kind of board — find every matching tile before the timer runs out. Work quickly but accurately; wrong taps and missed targets both count.',
    assessIntroMeasures: 'It measures selective attention, processing speed, response inhibition, and attentional stability (how consistent your reaction times are).',
    assessIntroNote:
      'Self-referenced: best used to track your own change over time. These are guideline scores, not a clinical diagnosis.',
    assessStart: 'Start assessment',
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
    sciTitle: 'About the science',
    sciParas: [
      'This is a cancellation task — one of the most validated attention paradigms in neuropsychology (Mesulam symbol cancellation), used to measure selective and sustained attention, processing speed, and inhibitory control.',
      'Difficulty follows visual-search theory: Easy/Medium are feature search (Treisman & Gelade, 1980); Hard is conjunction search where you must bind shape and colour (Wolfe, Guided Search). Per-level time limits are derived from published search-slope estimates.',
      'Scoring uses real psychometrics: Inverse Efficiency Score (Townsend & Ashby, 1983) and Rate-Correct Score (Woltz & Was, 2006), with reaction-time trimming (Whelan, 2008). Reaction-time variability is included because elevated intra-individual variability is a robust marker of attentional lapses (Castellanos, 2005).',
      'Honest limits: practice reliably improves performance on this task and on visual search; broad "far transfer" to everyday attention is debated in the literature (Simons et al., 2016). Use this to train and track these specific skills — not as a medical test.',
    ],
    sciClose: 'Close',
  },
  ar: {
    back: '‹ رجوع',
    title: 'مهمة الإلغاء',
    subtitle: 'انتباه انتقائي وكبح استجابي',
    freeMode: '♾️ وضع حر',
    freeMenuSub:
      'جولات لا تنتهي وتزداد صعوبة · ٣ أرواح · تخسر روحاً إذا نفد الوقت أو أكثرت النقر الخاطئ في الجولة · النقاط للمسات والإكمال والسلسلة',
    freeStrikes: 'أخطاء',
    lives: 'الأرواح',
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    freeGameOver: 'انتهت المحاولة',
    freeRoundsCleared: (n) => `جولات ناجحة: ${n}`,
    freeBest: (n) => `أفضل إكمال: ${n}`,
    freeBestScoreLine: (n) => `أفضل نقاط: ${n}`,
    freePlayAgain: 'العب مجددًا',
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'تدريب لا ينتهي ويزداد صعوبة باستمرار. لديك ٣ أرواح. لكل جولة مؤقتها الخاص — أكمل كل الأهداف قبل نفاده. إذا نفد الوقت أو أكثرت النقر الخاطئ في الجولة تخسر روحاً. اجمع النقاط باللمسات الصحيحة وإكمال الجولات؛ السلاسل تضاعف المكافأة. تنتهي المحاولة فقط عند نفاد الأرواح.',
    freeIntroReady: 'جاهز',
    score: 'نقاط',
    hubChamberKicker: '⟡ مهمة التركيز ⟡',
    hubAttentionWord: 'الانتباه',
    hubTrainingTag: 'تدريب',
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetryTitle: 'حاول مجددًا',
    resultsChalTitle: 'نتائج مرّر والعب',
    hubMapAria: 'خريطة الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'لا ينتهي · ٣ أرواح · يزداد صعوبة',
    hubNodeLevelsHint: '١٠٠ مستوى لكل صعوبة · بالترتيب',
    hubNodeChallengeHint: 'نفس اللوحة للجميع · اختر الصعوبة',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ مرّر والعب',
    menuHint: 'تدريب بحث بصري: ربط السمات، كبح المشتتات، والاستجابة بسرعة—كمهام الانتباه في العلوم المعرفية.',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'كل صعوبة تحتوي على ١٠٠ مستوى — افتحها بالترتيب.',
    diffDesc: {
      easy: 'أشكال مختلفة — اكتشف المختلف بسرعة.',
      medium: 'أشكال وألوان متشابهة — دقّق أكثر.',
      hard: 'أشكال شبه متطابقة — طابق الشكل واللون.',
    },
    diffTargets: 'أهداف',
    diffGrid: 'شبكة',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–100`,
    levelsBack: '← رجوع',
    challengeTitle: '⚔️ مرّر والعب',
    challengeSub: 'نفس اللوحة للجميع · اختر الصعوبة · مرّر الجهاز',
    chalPickDiff: 'الصعوبة',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    ready: (n) => `جاهز — ${n}`,
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الجولة',
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس الشبكة لكل اللاعبين في هذه الجولة',
    chalBulletPass: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    hubMenu: 'شبكة واحدة، مقارنة عادلة.',
    time: 'الوقت',
    found: 'مُوجَد',
    err: 'أخطاء',
    lvl: 'مستوى',
    pause: 'إيقاف',
    quit: 'خروج',
    resume: 'متابعة',
    restart: 'إعادة المستوى',
    quitMenu: 'خروج للقائمة',
    paused: 'متوقف',
    quitQ: 'خروج؟',
    quitLose: 'ستفقد تقدم هذه الجولة.',
    yesQuit: 'نعم',
    keep: 'إكمال',
    nextLv: 'المستوى التالي',
    retry: 'إعادة',
    menu: 'القائمة',
    newCh: 'لعبة جديدة',
    chalRounds: 'الجولات',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة · شبكة جديدة عادلة كل جولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalResDetail: (nr, t, e, a, tp) =>
      nr > 1
        ? `${nr}× · ${t}s معدل · ${e} أخطاء المجموع · ${a}% · ${tp} هدف/ث`
        : `${t}s · ${e} أخطاء · ${a}% · ${tp} هدف/ث`,
    ies: 'درجة IES',
    rt: 'متوسط زمن الاستجابة',
    countdownHint: 'استعد…',
    cueExact: 'المس كل مربع يطابق هذا الرمز تمامًا.',
    cueShape: 'المس كل مربع يحتوي على هذا الشكل.',
    assessMode: '📊 تقييم',
    hubNodeAssessHint: 'اختبار موحّد · تابع انتباهك',
    assessIntroTitle: 'تقييم الانتباه',
    assessIntroBody:
      'اختبار موحّد من ٣ محاولات. كل محاولة تعرض نفس نوع اللوحة — جِد كل المربعات المطابقة قبل نفاد الوقت. اعمل بسرعة وبدقة؛ النقر الخاطئ والأهداف المفقودة كلاهما يُحتسب.',
    assessIntroMeasures: 'يقيس الانتباه الانتقائي وسرعة المعالجة وكبح الاستجابة واستقرار الانتباه (مدى ثبات زمن استجابتك).',
    assessIntroNote:
      'مرجعي ذاتي: الأفضل لتتبّع تغيّرك مع الوقت. هذه درجات إرشادية وليست تشخيصاً سريرياً.',
    assessStart: 'ابدأ التقييم',
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
    sciTitle: 'عن العِلم',
    sciParas: [
      'هذه مهمة إلغاء — من أكثر نماذج قياس الانتباه توثيقاً في علم النفس العصبي (مهمة ميسولام)، تُستخدم لقياس الانتباه الانتقائي والمستمر وسرعة المعالجة وكبح الاستجابة.',
      'تتبع الصعوبة نظرية البحث البصري: السهل/المتوسط بحث سمة (Treisman & Gelade, 1980)؛ والصعب بحث اقتران حيث تربط الشكل واللون (Wolfe). حدود الوقت لكل مستوى مشتقة من تقديرات منشورة لميل البحث.',
      'التقييم يستخدم مقاييس نفسية حقيقية: درجة الكفاءة العكسية (Townsend & Ashby, 1983) ودرجة المعدل الصحيح (Woltz & Was, 2006)، مع تشذيب لأزمنة الاستجابة (Whelan, 2008). ويُدرَج تباين زمن الاستجابة لأن ارتفاعه مؤشر قوي على هفوات الانتباه (Castellanos, 2005).',
      'حدود صادقة: التمرين يحسّن الأداء في هذه المهمة وفي البحث البصري بشكل موثوق؛ أما الانتقال الواسع إلى الانتباه اليومي فمختلَف عليه علمياً (Simons et al., 2016). استخدمه لتدريب وتتبّع هذه المهارات تحديداً — لا كاختبار طبي.',
    ],
    sciClose: 'إغلاق',
  },
};

export default function CancellationTaskGame({ onBack, workoutMode = false, assessmentMode = false, onAssessmentExit, onAssessmentComplete, assessmentLabel, assessmentStep }) {
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
  const [phase, setPhase] = useState(assessmentMode ? 'assessIntro' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');

  const [round, setRound] = useState(null);
  const [cells, setCells] = useState([]);
  const [playStep, setPlayStep] = useState('idle');
  const [cdShow, setCdShow] = useState(false);
  const [cdVal, setCdVal] = useState(3);
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
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);
  const roundEndedRef = useRef(false);
  const endRoundRef = useRef((_won) => {});
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
  const [assessResult, setAssessResult] = useState(null);
  const [assessHistory, setAssessHistory] = useState(() => loadAssessHistory());
  const [sciOpen, setSciOpen] = useState(false);
  const [gridMetrics, setGridMetrics] = useState({
    cellW: 32,
    cellH: 32,
    gap: 3,
    pad: 6,
  });
  const shakeTimerRef = useRef(0);

  // juice + coached tutorial
  const juice = useJuice();
  const rLabels = ratingLabels(isAr);
  const [coachActive, setCoachActive] = useState(false);
  const coachActiveRef = useRef(false);
  const coachRef = useRef(null);
  const pendingAfterCoachRef = useRef(null);
  const targetBarRef = useRef(null);
  useEffect(() => {
    coachActiveRef.current = coachActive;
  }, [coachActive]);

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

  const doneMap = profile.done || {};

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
  }, [stopTimer]);

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
          // Must not set idle→running in the same sync turn: React batches to a
          // no-op while playStep stays 'running', so the timer effect never
          // re-runs after stopTimer() cleared runRef (frozen clock on round 2+).
          setPlayStep('idle');
          queueMicrotask(() => setPlayStep('running'));
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
    [playSfx, clearPlayRoundState],
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
    void beginFreeRoundAtStage(0);
  }, [playSfx, beginFreeRoundAtStage]);

  const beginAssessmentTrial = useCallback(
    async (idx) => {
      try {
        setPhase('play');
        setCdShow(false);
        let r;
        try {
          r = prepareAssessmentTrial(idx);
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
        const s = loadGameSettings();
        if (!s.countdown) {
          setPlayStep('idle');
          queueMicrotask(() => setPlayStep('running'));
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
    [playSfx, clearPlayRoundState],
  );

  const startAssessment = useCallback(() => {
    assessTrialsRef.current = [];
    assessTapsRef.current = [];
    assessIdxRef.current = 0;
    setAssessResult(null);
    setPhase('assessIntro');
  }, []);

  const onAssessIntroReady = useCallback(() => {
    playSfx('click');
    void beginAssessmentTrial(0);
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
          // Lives left — replay the SAME stage so the ramp never spikes.
          playSfx('error');
          setPauseOpen(false);
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
        // Record this trial (hits, false taps, time, efficiency) + its taps.
        assessTrialsRef.current.push({
          tc: targetTc || r.tc,
          found: f,
          errors: e,
          timeUsed: stats.timeUsed,
          ies: stats.ies,
        });
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
      if (won) playSfx('win');
      else playSfx('error');
      if (won) awardTrainingWin('cancel', r.diff, r.lv, FQ_LEVELS_PER_TIER);
      persistLevel(r, stats, f, e);
      setLastResult({ type: 'level', stats, r, won, found: f, errors: e });
      setPhase('res');
    },
    [stopTimer, persistLevel, playSfx, beginFreeRoundAtStage, beginAssessmentTrial, onAssessmentComplete],
  );

  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

  useEffect(() => {
    if (playStep !== 'running' || pauseOpen) return;
    if (coachActiveRef.current) return; // tutorial: no countdown
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
      fixed += 12;
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
      const verticalReserve = 6;
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
      const INNER_PAD = 4;
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
      setGridMetrics({ cellW: cell, cellH: cell, gap, pad: INNER_PAD });
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
    setCells((prev) => {
      const c = prev[idx];
      if (!c || c.tapped) return prev;
      const now = performance.now();
      if (lastTapRef.current) tapsRef.current.push(now - lastTapRef.current);
      lastTapRef.current = now;
        if (c.isT) {
        playSfx('collect');
        const nextCells = prev.map((x, i) =>
          i === idx ? { ...x, tapped: true, feedback: 'ok' } : x,
        );
        const totalTargets = nextCells.filter((x) => x.isT).length;
        const tappedTargets = nextCells.filter((x) => x.isT && x.tapped).length;
        talliesRef.current.found = tappedTargets;
        setFound(tappedTargets);
        queueMicrotask(() => {
          juice.hit({});
          if (coachActiveRef.current) coachRef.current?.notify('tap');
        });
        if (r.mode === 'free') {
          const add = freeTapPoints(r.diff, r.freeStage ?? 0);
          freeScoreRef.current += add;
          queueMicrotask(() => setFreeScore(freeScoreRef.current));
        }
        if (totalTargets > 0 && tappedTargets === totalTargets) {
          if (coachActiveRef.current) {
            queueMicrotask(() => coachRef.current?.notify('allfound'));
          } else {
            queueMicrotask(() => {
              juice.celebrate();
              endRoundRef.current(true);
            });
          }
        }
        return nextCells;
      }
      playSfx('error');
      pendingPenaltyRef.current += 1;
      talliesRef.current.errors += 1;
      setErrors(talliesRef.current.errors);
      if (r.mode === 'free') {
        const pen = freeWrongTapPenalty(r.diff);
        freeScoreRef.current = Math.max(0, freeScoreRef.current - pen);
        queueMicrotask(() => setFreeScore(freeScoreRef.current));
        // Too many wrong taps this round → fail the round (costs one life).
        if (talliesRef.current.errors >= freeRoundErrorCap(r.tc)) {
          queueMicrotask(() => endRoundRef.current(false));
        }
      }
      setShake(true);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => {
        setShake(false);
        shakeTimerRef.current = 0;
      }, 350);
      return prev.map((x, i) =>
        i === idx ? { ...x, tapped: true, feedback: 'bad' } : x,
      );
    });
  }, [playStep, pauseOpen, cdShow, playSfx]);

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

  const playHeaderForRound = (r) => {
    if (!r) return { title: '', subtitle: '' };
    if (r.mode === 'free') {
      return {
        title: isAr ? 'وضع حر' : 'Free mode',
        subtitle: t.freeLvlLabel(DM[r.diff]?.label ?? '', r.lv),
      };
    }
    if (r.mode === 'challenge') {
      return {
        title: isAr ? 'مرّر والعب' : 'Pass n Play',
        subtitle:
          chalRoundsTotal > 1
            ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ${chalNames[chalIdx] ?? ''}`
            : chalNames[chalIdx] ?? '',
      };
    }
    if (r.mode === 'assess') {
      return {
        title: t.assessIntroTitle,
        subtitle: t.assessTrialLabel(
          (r.assessTrial ?? 0) + 1,
          r.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials,
        ),
      };
    }
    return {
      title: `${DM[r.diff]?.label ?? ''} · L${r.lv}`,
      subtitle: `${r.grid}×${r.grid} · ${Number(r.tlim).toFixed(0)}s`,
    };
  };

  /* --- Coached interactive tutorial --- */
  const beginTutorial = useCallback(() => {
    setPhase('play');
    setCdShow(false);
    let r;
    try {
      r = prepareLevelRound('easy', 1);
    } catch {
      return;
    }
    r = { ...r, mode: 'tutorial' };
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
    juice.reset();
    setPlayStep('running');
  }, [juice]);

  const finishCoach = useCallback(() => {
    try {
      localStorage.setItem('mm_cancel_coach_seen', '1');
    } catch {
      /* ignore */
    }
    setCoachActive(false);
    coachActiveRef.current = false;
    clearPlayRoundState();
    const fn = pendingAfterCoachRef.current;
    pendingAfterCoachRef.current = null;
    if (fn) fn();
    else setPhase('hub');
  }, [clearPlayRoundState]);

  const coachSteps = useMemo(
    () => buildCancelCoachSteps(isAr, { targetRef: targetBarRef, gridRef: gridWrapRef }),
    [isAr],
  );
  const coach = useCoach(coachSteps, { active: coachActive, onDone: finishCoach });
  useEffect(() => {
    coachRef.current = coach;
  }, [coach]);

  const startCoach = useCallback(
    (thenFn) => {
      pendingAfterCoachRef.current = thenFn || null;
      coachActiveRef.current = true;
      setCoachActive(true);
      beginTutorial();
    },
    [beginTutorial],
  );
  const maybeCoach = useCallback(
    (fn) => {
      let seen = false;
      try {
        seen = !!localStorage.getItem('mm_cancel_coach_seen');
      } catch {
        /* ignore */
      }
      if (seen) fn();
      else startCoach(fn);
    },
    [startCoach],
  );
  const replayTutorial = useCallback(() => startCoach(null), [startCoach]);

  return (
    <div
      className="cancellation-task-game ct-fq-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              hubSpaced
              variant="paper"
              onReplayTutorial={replayTutorial}
              replayHint={isAr ? 'إعادة الشرح' : 'Replay tutorial'}
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
              onFree={() => maybeCoach(startFreeMode)}
              onLevels={() => maybeCoach(() => setPhase('diff'))}
              onChallenge={() => maybeCoach(() => setPhase('chal'))}
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
              padding: 'max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))',
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
                onBack={() => {
                  clearPlayRoundState();
                  setPhase('hub');
                }}
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
                fontStyle: 'normal',
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
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.chalPickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.chalPickDiff}>
                {FQ_DIFF_KEYS.map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => {
                      playSfx('click');
                      setChalDiff(k);
                    }}
                  >
                    {DM[k].label}
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
                      onClick={() => {
                        setChalNames(chalNames.filter((_, j) => j !== i));
                      }}
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
              <p className="ct-fq-sub" style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}>
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
              onClick={() => { playSfx('click'); openChallenge(); }}
            >
              {t.startCh}
            </button>
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
          <TrainingPlayHeader
            isAr={isAr}
            title={round.mode === 'tutorial' ? (isAr ? 'كيفية اللعب' : 'How to play') : playHeaderForRound(round).title}
            subtitle={round.mode === 'tutorial' ? '' : playHeaderForRound(round).subtitle}
            playSfx={playSfx}
            menuAriaLabel={t.menu}
            pauseAriaLabel={t.pause}
            onMenu={round.mode === 'tutorial' ? () => coach.skip() : onHudQuit}
            onPause={round.mode === 'tutorial' ? undefined : onHudPause}
          />
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
              lvlLabel={
                round.mode === 'free'
                  ? t.freeLvlLabel(DM[round.diff]?.label ?? '', round.lv)
                  : round.mode === 'assess'
                    ? `${(round.assessTrial ?? 0) + 1}/${round.assessTrialsTotal ?? ASSESSMENT_PROTOCOL.trials}`
                    : round.lv === 'CH'
                      ? 'CH'
                      : `L${round.lv}`
              }
              freeScore={round.mode === 'free' ? freeScore : undefined}
              freeLives={round.mode === 'free' ? freeLives : undefined}
            />
            <div className="ct-fq-tb" data-fq-chrome ref={targetBarRef}>
              <div className="ct-fq-tb-row">
                <div
                  className={`ct-fq-tb-icon-wrap${round.diff === 'hard' ? ' ct-fq-tb-icon-deadly' : ''}`}
                  aria-hidden="true"
                >
                  <ShapeSvg
                    shape={
                      round.target in SH
                        ? round.target
                        : cells.find((c) => c.isT)?.shape || 'circle'
                    }
                    color={
                      round.targetCol ||
                      cells.find((c) => c.isT)?.fill ||
                      '#2d2d2d'
                    }
                    size={round.diff === 'hard' ? 40 : 34}
                  />
                </div>
                <span className="ct-fq-tb-cue">
                  {round.searchMode === 'identity' ? t.cueExact : t.cueShape}
                </span>
              </div>
            </div>
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
              <button
                type="button"
                className="ct-fq-sci-link"
                onClick={() => {
                  playSfx('click');
                  setSciOpen(true);
                }}
              >
                {`ⓘ ${t.sciTitle}`}
              </button>
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

      {sciOpen && (
        <div
          className="ct-fq-sci-ov"
          role="dialog"
          aria-modal="true"
          dir={isAr ? 'rtl' : 'ltr'}
          onClick={() => setSciOpen(false)}
        >
          <div className="ct-fq-sci-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="ct-fq-sci-title">{t.sciTitle}</h2>
            {t.sciParas.map((p, i) => (
              <p key={i} className="ct-fq-sci-para">{p}</p>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                playSfx('click');
                setSciOpen(false);
              }}
            >
              {t.sciClose}
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && cdShow && (
        <div className="ct-fq-cd">
          <div className="ct-fq-cd-num">{cdVal}</div>
          <div className="ct-fq-cd-lbl">{t.countdownHint}</div>
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
