import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  SH,
  DM,
  prepareLevelRound,
  prepareChallengeSeed,
  prepareChallengePlayState,
  prepareFreeRound,
  computeRoundStats,
  isLevelUnlocked,
  getLvCfg,
  loadGameSettings,
  FREE_SESSION_START_SEC,
  FREE_SESSION_CAP_SEC,
  freeClearBonusSec,
  freeTimeDrainMultiplier,
  freeTapPoints,
  freeRoundClearPoints,
  freeWrongTapPenalty,
  FQ_DIFF_KEYS,
  FQ_LEVELS_PER_TIER,
} from '../../../../shared/focusQuestData';
import { PALETTE } from '../../../../shared/palette';
import { tokens } from '../../../../../../styles/tokens';
import { IconBack } from '../../../../shared/TrainingIcons';
import FocusQuestTutorial, {
  buildTutorialQueueFor,
  markTutorialSeen,
} from './tutorial';

const TR = PALETTE;

function fqTrainingChromeBtn() {
  return {
    width: 34,
    height: 34,
    borderRadius: 11,
    border: `1px solid ${TR.accent}33`,
    background: `linear-gradient(180deg, ${TR.card} 0%, ${TR.cardDeep} 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: TR.text,
    cursor: 'pointer',
    boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px ${TR.accent}11 inset`,
    flexShrink: 0,
  };
}

/** Menu chrome for attention hub on cream paper background */
function fqTrainingChromeBtnPaper() {
  return {
    width: 34,
    height: 34,
    borderRadius: 11,
    border: '1px solid rgba(107, 90, 72, 0.38)',
    background: `linear-gradient(180deg, ${tokens.trainingPaletteSurface} 0%, #f3e7df 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#3a3228',
    cursor: 'pointer',
    boxShadow:
      '0 2px 10px rgba(45, 45, 40, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.65) inset',
    flexShrink: 0,
  };
}

function FqTrainingMenuBar({
  onBack,
  playSfx,
  center,
  hubSpaced = false,
  onReplayTutorial,
  replayHint,
  paperChrome = false,
}) {
  const chrome = paperChrome ? fqTrainingChromeBtnPaper : fqTrainingChromeBtn;
  const iconC = paperChrome ? '#3a3228' : TR.text;
  return (
    <div
      className={`ct-fq-training-menubar${hubSpaced ? ' ct-fq-training-menubar--hub' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: 'max(52px, env(safe-area-inset-top))',
        paddingLeft: hubSpaced ? undefined : 18,
        paddingRight: hubSpaced ? undefined : 18,
        paddingBottom: hubSpaced ? 22 : 10,
        position: 'relative',
        zIndex: 5,
        boxSizing: 'border-box',
      }}
    >
      <button
        type="button"
        style={chrome()}
        onClick={() => {
          playSfx('click');
          onBack();
        }}
        aria-label="Back"
      >
        <IconBack size={18} c={iconC} />
      </button>
      <div
        className="ct-fq-training-menubar-center"
        style={{ flex: 1, minWidth: 0, padding: '0 8px' }}
        role="presentation"
      >
        {center}
      </div>
      {onReplayTutorial ? (
        <button
          type="button"
          style={{
            ...chrome(),
            fontFamily: "'Cormorant Garamond', 'Cinzel', serif",
            fontSize: 18,
            fontWeight: 700,
            color: paperChrome ? '#8a5a18' : TR.accent,
          }}
          onClick={() => {
            playSfx('click');
            onReplayTutorial();
          }}
          aria-label={replayHint || 'Replay tutorial'}
          title={replayHint || 'Replay tutorial'}
        >
          ?
        </button>
      ) : (
        <div style={{ width: 34, flexShrink: 0 }} aria-hidden="true" />
      )}
    </div>
  );
}

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

/** Light attention hub — three mode rows (no circular maze). */
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
  onPause,
  onQuit,
  freeScore,
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
        {freeScore != null && (
          <div className="ct-fq-gs">
            <div className="ct-fq-gv">{freeScore}</div>
            <div className="ct-fq-gl">{t.score}</div>
          </div>
        )}
        <div className="ct-fq-g-actions">
          <button type="button" className="ct-fq-mini" onClick={onPause}>
            {t.pause}
          </button>
          <button type="button" className="ct-fq-mini ct-fq-mini-warn" onClick={onQuit}>
            {t.quit}
          </button>
        </div>
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

const UI = {
  en: {
    back: '‹ BACK',
    title: 'CANCELLATION',
    subtitle: 'Selective attention & inhibition',
    freeMode: '♾️ Free mode',
    freeMenuSub:
      'One session clock · small time refill each clear · 3 strikes end the run · score from taps, clears & streaks',
    freeStrikes: 'Strikes',
    freeLvlLabel: (tier, lv) => `Free · ${tier} ${lv}`,
    freeGameOver: 'Run ended',
    freeRoundsCleared: (n) => `Rounds cleared: ${n}`,
    freeBest: (n) => `Best clears: ${n}`,
    freeBestScoreLine: (n) => `Best score: ${n}`,
    freePlayAgain: 'Play again',
    freeIntroTitle: 'Free mode',
    freeIntroBody:
      'One session timer for your whole run. Clear rounds to earn a little extra time. Score from correct taps and full clears — streaks boost the clear bonus. Three wrong taps end the run.',
    freeIntroReady: 'Ready',
    score: 'Score',
    hubChamberKicker: '⟡ FOCUS QUEST ⟡',
    hubAttentionWord: 'Attention',
    hubTrainingTag: 'training',
    resultsLevelPass: 'Level passed',
    resultsLevelRetryTitle: 'Try again',
    resultsChalTitle: 'Challenge results',
    hubMapAria: 'Modes map — choose a path',
    hubNodeFreeHint: 'Tight timer · score · streak clears',
    hubNodeLevelsHint: 'Tier grid · unlock 20',
    hubNodeChallengeHint: 'Same maze · pass & play',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    menuHint: 'Visual search training: bind features, suppress distractors, and respond quickly—like lab tasks for attention and cognitive control.',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Every mode has levels 1–20. Unlock in order.',
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–20`,
    levelsBack: '← Back',
    challengeTitle: '⚔️ Challenge mode',
    challengeSub: 'Same shape layout for everyone · Hard 9×9 · 50s',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    ready: (n) => `Ready — ${n}`,
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start round',
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
    newCh: 'New challenge',
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
  },
  ar: {
    back: '‹ رجوع',
    title: 'مهمة الإلغاء',
    subtitle: 'انتباه انتقائي وكبح استجابي',
    freeMode: '♾️ وضع حر',
    freeMenuSub:
      'مؤقت واحد للجولة · وقت قليل جداً بعد كل إكمال · ٣ أخطاء تنهي المحاولة · النقاط للمسات الصحيحة والسلسلة',
    freeStrikes: 'الأخطاء',
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    freeGameOver: 'انتهت المحاولة',
    freeRoundsCleared: (n) => `جولات ناجحة: ${n}`,
    freeBest: (n) => `أفضل إكمال: ${n}`,
    freeBestScoreLine: (n) => `أفضل نقاط: ${n}`,
    freePlayAgain: 'العب مجددًا',
    freeIntroTitle: 'وضع حر',
    freeIntroBody:
      'مؤقت واحد يدوّر معك طوال المحاولة. أكمل الجولات لتربح وقتاً إضافياً قليلاً. اجمع النقاط باللمسات الصحيحة وعند إكمال الجولة — السلسلة ترفع مكافأة الإكمال. ثلاثة أخطاء تنهي المحاولة.',
    freeIntroReady: 'جاهز',
    score: 'نقاط',
    hubChamberKicker: '⟡ مهمة التركيز ⟡',
    hubAttentionWord: 'الانتباه',
    hubTrainingTag: 'تدريب',
    resultsLevelPass: 'المستوى اجتُاز',
    resultsLevelRetryTitle: 'حاول مجددًا',
    resultsChalTitle: 'نتائج التحدي',
    hubMapAria: 'خريطة الأوضاع — اختر مسارًا',
    hubNodeFreeHint: 'مؤقت ضيق · نقاط · سلسلة الإكمال',
    hubNodeLevelsHint: 'شبكة · ٢٠ مستوى',
    hubNodeChallengeHint: 'نفس المتاهة · مع الأصدقاء',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    menuHint: 'تدريب بحث بصري: ربط السمات، كبح المشتتات، والاستجابة بسرعة—كمهام الانتباه في العلوم المعرفية.',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'كل وضع يحتوي على مستويات 1–20. افتحها بالترتيب.',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–20`,
    levelsBack: '← رجوع',
    challengeTitle: '⚔️ وضع التحدي',
    challengeSub: 'نفس تخطيط الأشكال للجميع · صعب 9×9 · 50ث',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    ready: (n) => `جاهز — ${n}`,
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الجولة',
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
    newCh: 'تحدي جديد',
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
  },
};

export default function CancellationTaskGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const settings = loadGameSettings();

  const [profile, setProfile] = useState(() => loadProfile());
  const [phase, setPhase] = useState('hub');
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
  const freeStrikesRef = useRef(0);
  const [freeStrikes, setFreeStrikes] = useState(0);
  const [freeScore, setFreeScore] = useState(0);
  const freeScoreRef = useRef(0);
  const freeStreakRef = useRef(0);
  const [gridMetrics, setGridMetrics] = useState({
    cellW: 32,
    cellH: 32,
    gap: 3,
    pad: 6,
  });
  const shakeTimerRef = useRef(0);
  const [tutorialQueue, setTutorialQueue] = useState([]);
  const pendingTutorialActionRef = useRef(null);

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
        if (stageIndex === 0 && freeRoundsWonRef.current === 0) {
          tlRef.current = FREE_SESSION_START_SEC;
          tlimRef.current = FREE_SESSION_START_SEC;
        }
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
    freeStrikesRef.current = 0;
    freeScoreRef.current = 0;
    freeStreakRef.current = 0;
    setFreeStrikes(0);
    setFreeScore(0);
    setPhase('freeIntro');
  }, []);

  const onFreeIntroReady = useCallback(() => {
    playSfx('click');
    void beginFreeRoundAtStage(0);
  }, [playSfx, beginFreeRoundAtStage]);

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
            const newSeed = prepareChallengeSeed();
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
          playSfx('win');
          const completed = r.freeStage ?? 0;
          freeStreakRef.current += 1;
          const clearPts = freeRoundClearPoints(r.tlim, freeStreakRef.current);
          freeScoreRef.current += clearPts;
          setFreeScore(freeScoreRef.current);
          const bonus = freeClearBonusSec(completed, r.tlim);
          tlRef.current = Math.min(FREE_SESSION_CAP_SEC, tlRef.current + bonus);
          tlimRef.current = Math.max(tlimRef.current, tlRef.current);
          freeRoundsWonRef.current += 1;
          freeStageRef.current += 1;
          setPauseOpen(false);
          void beginFreeRoundAtStage(freeStageRef.current);
        } else {
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
          setLastResult({ type: 'free', roundsWon: rw, score: runScore, lastR: r });
          setPhase('freeRes');
          setPlayStep('idle');
          setPauseOpen(false);
          setQuitOpen(false);
          setCdShow(false);
          setRound(null);
          setCells([]);
        }
        return;
      }
      if (won) playSfx('win');
      else playSfx('error');
      persistLevel(r, stats, f, e);
      setLastResult({ type: 'level', stats, r, won, found: f, errors: e });
      setPhase('res');
    },
    [stopTimer, persistLevel, playSfx, beginFreeRoundAtStage],
  );

  useEffect(() => {
    endRoundRef.current = endRound;
  }, [endRound]);

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
      const rr = roundRef.current;
      const drainMult =
        rr?.mode === 'free' ? freeTimeDrainMultiplier(rr.freeStage ?? 0) : 1;
      tlRef.current = Math.max(
        0,
        tlRef.current - dt * drainMult - pendingPenaltyRef.current,
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
      // Use width and height independently so portrait phones fill the screen
      // instead of a small square with empty vertical space.
      const innerBudgetW = Math.max(40, availW - INNER_PAD * 2);
      const innerBudgetH = Math.max(40, availH - INNER_PAD * 2);
      let cellW = Math.floor((innerBudgetW - totalGap) / gridN);
      let cellH = Math.floor((innerBudgetH - totalGap) / gridN);
      cellW = Math.max(minCell, cellW);
      cellH = Math.max(minCell, cellH);
      const needW = cellW * gridN + totalGap + INNER_PAD * 2;
      const needH = cellH * gridN + totalGap + INNER_PAD * 2;
      if (needW > availW) {
        cellW = Math.max(8, Math.floor((availW - totalGap - INNER_PAD * 2) / gridN));
      }
      if (needH > availH) {
        cellH = Math.max(8, Math.floor((availH - totalGap - INNER_PAD * 2) / gridN));
      }
      setGridMetrics({ cellW, cellH, gap, pad: INNER_PAD });
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
        if (r.mode === 'free') {
          const add = freeTapPoints(r.diff, r.freeStage ?? 0);
          freeScoreRef.current += add;
          queueMicrotask(() => setFreeScore(freeScoreRef.current));
        }
        if (totalTargets > 0 && tappedTargets === totalTargets) {
          queueMicrotask(() => endRoundRef.current(true));
        }
        return nextCells;
      }
      playSfx('error');
      pendingPenaltyRef.current += 1;
      talliesRef.current.errors += 1;
      setErrors(talliesRef.current.errors);
      if (r.mode === 'free') {
        const ns = freeStrikesRef.current + 1;
        freeStrikesRef.current = ns;
        setFreeStrikes(ns);
        const pen = freeWrongTapPenalty(r.diff);
        freeScoreRef.current = Math.max(0, freeScoreRef.current - pen);
        queueMicrotask(() => setFreeScore(freeScoreRef.current));
        if (ns >= 3) {
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
    clearPlayRoundState();
    setPhase('hub');
  };

  /* --- Tutorial gating ------------------------------------------------------
   * gateWithTutorial(action, modeKind) wraps the user's intent (start free,
   * open levels, open challenge). If any tutorial step is unseen, we queue it
   * and stash the action; tutorials run in sequence (main → mode-tip), then
   * the original action fires after a microtask so the overlay finishes
   * unmounting cleanly. */
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

  return (
    <div
      className="cancellation-task-game ct-fq-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <FqTrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              hubSpaced
              paperChrome
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
              padding: 'max(48px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(28px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left))',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => {
                playSfx('click');
                clearPlayRoundState();
                setPhase('hub');
              }}
              style={{
                position: 'absolute',
                top: 'max(52px, env(safe-area-inset-top))',
                [isAr ? 'right' : 'left']: 'max(14px, env(safe-area-inset-left))',
                width: 34,
                height: 34,
                borderRadius: 12,
                border: '2px solid #1a1208',
                background: 'linear-gradient(180deg, #fff 0%, #f3ebe4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '3px 3px 0 #1a1208',
                zIndex: 10,
              }}
            >
              <IconBack size={18} c="#141210" />
            </button>
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
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => {
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              paperChrome
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.pickDiff}</div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
            {FQ_DIFF_KEYS.map((k) => {
              const m = DM[k];
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
                <span className="ct-fq-dbg">
                  {m.pop} · {m.grid}×{m.grid}
                </span>
              </button>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'levels' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => setPhase('diff')}
              playSfx={playSfx}
              paperChrome
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{DM[diffKey].label}</div>
                </div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">
              {t.levelsSub(DM[diffKey].pop, DM[diffKey].grid)}
            </p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: FQ_LEVELS_PER_TIER }, (_, i) => i + 1).map((lv) => {
                const un = isLevelUnlocked(diffKey, lv, doneMap);
                const dn = !!doneMap[`${diffKey}-${lv}`];
                const cfg = getLvCfg(diffKey, lv - 1);
                const cls = `ct-fq-lb ${un ? `ct-${DM[diffKey].lvc}` : 'ct-lvk'}`;
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
                      {un ? `${cfg.tc}t·${cfg.time}s` : '🔒'}
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
            <FqTrainingMenuBar
              onBack={() => {
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              paperChrome
              center={
                <div style={{ textAlign: 'center' }}>
                  <div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div>
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
        <div className="ct-fq-ov">
          <div className="ct-fq-box">
            {chalRoundsTotal > 1 && (
              <p className="ct-fq-cpb" style={{ marginBottom: 10 }}>
                {t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)}
              </p>
            )}
            <h2>{t.ready(chalNames[chalIdx])}</h2>
            <p>{t.handTo(chalNames[chalIdx])}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={startChallengeRound}>
              {t.goReady}
            </button>
          </div>
        </div>
      )}

      {phase === 'play' && round && (
        <>
          <div className="ct-fq-g-wrap" ref={gridWrapRef}>
            {round.mode === 'challenge' && (
              <div className="ct-fq-cpb" data-fq-chrome>
                {chalRoundsTotal > 1 ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ` : ''}
                {chalNames[chalIdx]} — {chalIdx + 1}/{chalNames.length}
              </div>
            )}
            <CtLiveHud
              t={t}
              playStep={playStep}
              pauseOpen={pauseOpen}
              tlRef={tlRef}
              tlimRef={tlimRef}
              roundTlim={round.tlim}
              useSessionTimer={round.mode === 'free'}
              found={found}
              tc={cells.filter((c) => c.isT).length}
              errors={round.mode === 'free' ? freeStrikes : errors}
              errorsLabel={round.mode === 'free' ? t.freeStrikes : undefined}
              errorsMax={round.mode === 'free' ? 3 : undefined}
              lvlLabel={
                round.mode === 'free'
                  ? t.freeLvlLabel(DM[round.diff].label, round.lv)
                  : round.lv === 'CH'
                    ? 'CH'
                    : `L${round.lv}`
              }
              onPause={onHudPause}
              onQuit={onHudQuit}
              freeScore={round.mode === 'free' ? freeScore : undefined}
            />
            <div className="ct-fq-tb" data-fq-chrome>
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

          {pauseOpen && (
            <div className="ct-fq-ov">
              <div className="ct-fq-box">
                <h2>{t.paused}</h2>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => {
                    setPauseOpen(false);
                  }}
                >
                  {t.resume}
                </button>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  onClick={() => {
                    setPauseOpen(false);
                    if (round.mode === 'level') startLevelGame(round.diff, round.lv);
                    else if (round.mode === 'free') void beginFreeRoundAtStage(round.freeStage ?? 0);
                    else startChallengeRound();
                  }}
                >
                  {t.restart}
                </button>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  onClick={() => { setPauseOpen(false); setQuitOpen(true); }}
                >
                  {t.quitMenu}
                </button>
              </div>
            </div>
          )}

          {quitOpen && (
            <div className="ct-fq-ov">
              <div className="ct-fq-box">
                <h2>{t.quitQ}</h2>
                <p>{t.quitLose}</p>
                <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={confirmQuit}>
                  {t.yesQuit}
                </button>
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-ghost"
                  onClick={() => {
                    setQuitOpen(false);
                    if (playStep === 'running') runRef.current = true;
                  }}
                >
                  {t.keep}
                </button>
              </div>
            </div>
          )}

        </>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <FqTrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              paperChrome
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
            <FqTrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              paperChrome
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
            <FqTrainingMenuBar
              onBack={() => {
                setLastResult(null);
                clearPlayRoundState();
                setPhase('hub');
              }}
              playSfx={playSfx}
              paperChrome
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

      {phase === 'play' && cdShow && (
        <div className="ct-fq-cd">
          <div className="ct-fq-cd-num">{cdVal}</div>
          <div className="ct-fq-cd-lbl">{t.countdownHint}</div>
        </div>
      )}

      {tutorialQueue.length > 0 && (
        <FocusQuestTutorial
          kind={tutorialQueue[0].kind}
          isAr={isAr}
          onClose={advanceTutorial}
          playSfx={playSfx}
        />
      )}
    </div>
  );
}
