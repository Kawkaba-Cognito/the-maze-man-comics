import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
  useReducer,
} from 'react';
import { useApp } from '../../context/AppContext';
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
} from './focusQuestData';

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
      };
    }
  } catch {
    /* ignore */
  }
  return { tel: [], done: {}, freeBest: 0 };
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
  found,
  tc,
  errors,
  errorsLabel,
  errorsMax,
  lvlLabel,
  onPause,
  onQuit,
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
  const tlim = tlimRef.current || roundTlim || 1;
  const pctTime =
    playStep !== 'running' ? 1 : Math.max(0, Math.min(1, tlRef.current / tlim));
  const pctFound = tc > 0 ? Math.max(0, Math.min(1, found / tc)) : 0;

  return (
    <>
      <div className="ct-fq-g-top" data-fq-chrome>
        <div className="ct-fq-gs">
          <div className={`ct-fq-gv ${liveAnim && tlRef.current <= 10 ? 'tv' : ''}`}>
            {playStep !== 'running' ? `${roundTlim.toFixed(1)}s` : `${tlRef.current.toFixed(1)}s`}
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
    freeMenuSub: 'Survive with 3 strikes · Difficulty climbs after each clear (easy → deadly)',
    freeStrikes: 'Strikes',
    freeLvlLabel: (tier, lv) => `Free · ${tier} ${lv}`,
    freeGameOver: 'Run ended',
    freeRoundsCleared: (n) => `Rounds cleared: ${n}`,
    freeBest: (n) => `Best: ${n}`,
    freePlayAgain: 'Play again',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    menuHint: 'Visual search training: bind features, suppress distractors, and respond quickly—like lab tasks for attention and cognitive control.',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Every mode has levels 1–20. Unlock in order.',
    levelsSub: (pop, g) => `${pop} · ${g}×${g} grid · Levels 1–20`,
    levelsBack: '← Back',
    challengeTitle: '⚔️ Challenge mode',
    challengeSub: 'Same shape layout for everyone · Extra hard 9×9 · 50s',
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
    freeMenuSub: '٣ أخطاء كحد أقصى · الصعوبة ترتفع بعد كل جولة ناجحة (سهل → قاتل)',
    freeStrikes: 'الأخطاء',
    freeLvlLabel: (tier, lv) => `حر · ${tier} ${lv}`,
    freeGameOver: 'انتهت المحاولة',
    freeRoundsCleared: (n) => `جولات ناجحة: ${n}`,
    freeBest: (n) => `الأفضل: ${n}`,
    freePlayAgain: 'العب مجددًا',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    menuHint: 'تدريب بحث بصري: ربط السمات، كبح المشتتات، والاستجابة بسرعة—كمهام الانتباه في العلوم المعرفية.',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'كل وضع يحتوي على مستويات 1–20. افتحها بالترتيب.',
    levelsSub: (pop, g) => `${pop} · شبكة ${g}×${g} · مستويات 1–20`,
    levelsBack: '← رجوع',
    challengeTitle: '⚔️ وضع التحدي',
    challengeSub: 'نفس تخطيط الأشكال للجميع · صعب جداً 9×9 · 50ث',
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
  const [, bumpFrame] = useReducer((x) => x + 1, 0);

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
  const freeStageRef = useRef(0);
  const freeRoundsWonRef = useRef(0);
  const freeStrikesRef = useRef(0);
  const [freeStrikes, setFreeStrikes] = useState(0);
  const [gridMetrics, setGridMetrics] = useState({ cell: 32, gap: 3, pad: 6 });

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
  }, []);

  const beginFreeRoundAtStage = useCallback(
    async (stageIndex) => {
      setPhase('play');
      setPlayStep('idle');
      setCdShow(false);
      const r = prepareFreeRound(stageIndex);
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
      const s = loadGameSettings();
      if (!s.countdown) {
        setPlayStep('running');
        return;
      }
      setCdShow(true);
      for (let i = 3; i > 0; i--) {
        setCdVal(i);
        playSfx('click');
        await sleep(380);
      }
      setCdVal('GO');
      playSfx('collect');
      await sleep(320);
      setCdShow(false);
      setPlayStep('running');
    },
    [playSfx],
  );

  const startFreeMode = useCallback(() => {
    freeStageRef.current = 0;
    freeRoundsWonRef.current = 0;
    freeStrikesRef.current = 0;
    setFreeStrikes(0);
    void beginFreeRoundAtStage(0);
  }, [beginFreeRoundAtStage]);

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
          freeRoundsWonRef.current += 1;
          freeStageRef.current += 1;
          setPauseOpen(false);
          void beginFreeRoundAtStage(freeStageRef.current);
        } else {
          playSfx('error');
          const rw = freeRoundsWonRef.current;
          setProfile((prev) => {
            const prevB = prev.freeBest ?? 0;
            if (rw <= prevB) return prev;
            const p = { ...prev, freeBest: rw };
            saveProfile(p);
            return p;
          });
          setLastResult({ type: 'free', roundsWon: rw, lastR: r });
          setPhase('freeRes');
          setPlayStep('idle');
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
    if (playStep !== 'running' || pauseOpen) return;
    let id;
    let last = performance.now();
    warned10Ref.current = false;
    runRef.current = true;
    const loop = (ts) => {
      if (!runRef.current || pauseOpen) return;
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
        endRound(false);
        return;
      }
      id = requestAnimationFrame(loop);
    };
    lastTapRef.current = performance.now();
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
    };
  }, [playStep, pauseOpen, endRound, playSfx]);

  useLayoutEffect(() => {
    if (phase !== 'play' || !round) return;
    const wrap = gridWrapRef.current;
    if (!wrap) return;
    const gridN = round.grid;
    const isDeadly = round.diff === 'deadly';
    let raf = 0;
    const measure = () => {
      const vpH = window.visualViewport?.height ?? window.innerHeight;
      const vpW = window.visualViewport?.width ?? window.innerWidth;
      let fixed = 0;
      wrap.querySelectorAll('[data-fq-chrome]').forEach((el) => {
        fixed += el.getBoundingClientRect().height;
      });
      fixed += 28;
      const availW = Math.floor(vpW * 0.95);
      const availRatio = isDeadly ? 0.86 : 0.8;
      const availH = Math.floor(Math.min(vpH * availRatio, vpH - fixed));
      const square = Math.max(Math.min(availW, availH), isDeadly ? 72 : 64);
      const gap = gridN >= 9 ? 2 : 3;
      const INNER_PAD = 6;
      const totalGap = gap * (gridN - 1);
      const minCell = gridN >= 10 ? (isDeadly ? 22 : 16) : 8;
      const cell = Math.max(
        minCell,
        Math.floor((square - totalGap - INNER_PAD * 2) / gridN),
      );
      setGridMetrics({ cell, gap, pad: INNER_PAD });
    };
    measure();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [phase, round, cells.length]);

  const runCountdownThen = async (onDone) => {
    if (!settings.countdown) {
      onDone();
      return;
    }
    setCdShow(true);
    for (let n = 3; n > 0; n--) {
      setCdVal(n);
      playSfx('click');
      await sleep(380);
    }
    setCdVal('GO');
    playSfx('collect');
    await sleep(320);
    setCdShow(false);
    onDone();
  };

  const startLevelGame = async (diff, lv) => {
    setPhase('play');
    setPlayStep('idle');
    setCdShow(false);
    const r = prepareLevelRound(diff, lv);
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
    if (playStep !== 'running' || pauseOpen) return;
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
        if (totalTargets > 0 && tappedTargets === totalTargets) {
          setTimeout(() => endRound(true), 0);
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
        if (ns >= 3) {
          setTimeout(() => endRound(false), 0);
        }
      }
      setShake(true);
      setTimeout(() => setShake(false), 350);
      return prev.map((x, i) =>
        i === idx ? { ...x, tapped: true, feedback: 'bad' } : x,
      );
    });
  }, [playStep, pauseOpen, endRound, playSfx]);

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
    stopTimer();
    roundEndedRef.current = false;
    setPlayStep('idle');
    setRound(null);
    setCells([]);
    setPhase('hub');
  };

  const chromeBtn = {
    background: 'rgba(255, 252, 248, 0.82)',
    border: '1px solid rgba(90, 64, 48, 0.35)',
    padding: '8px 16px',
    borderRadius: 3,
    fontFamily: isAr ? "'Cairo', sans-serif" : "'Nunito', sans-serif",
    fontWeight: 800,
    fontSize: 13,
    color: '#3a2e28',
    cursor: 'pointer',
  };

  return (
    <div
      className="cancellation-task-game ct-fq-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {phase === 'hub' && (
        <div className="ct-fq-screen">
          <header className="ct-fq-topbar">
            <button type="button" style={chromeBtn} onClick={() => { playSfx('click'); onBack(); }}>
              {t.back}
            </button>
            <div style={{ textAlign: 'center' }}>
              <div className="ct-fq-kicker">{t.subtitle}</div>
              <div className="ct-fq-title">{t.title}</div>
            </div>
            <div style={{ width: 72 }} />
          </header>
          <p className="ct-fq-sub">{t.menuHint}</p>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-pri"
            onClick={() => { playSfx('click'); startFreeMode(); }}
          >
            {t.freeMode}
          </button>
          <p className="ct-fq-sub" style={{ fontSize: '0.82rem', marginTop: '-2px', marginBottom: '12px' }}>
            {t.freeMenuSub}
          </p>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-sec"
            onClick={() => { playSfx('click'); setPhase('diff'); }}
          >
            {t.levelMode}
          </button>
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-sec"
            onClick={() => { playSfx('click'); setPhase('chal'); }}
          >
            {t.challengeMode}
          </button>
        </div>
      )}

      {phase === 'diff' && (
        <div className="ct-fq-screen">
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-ghost"
            onClick={() => { playSfx('click'); setPhase('hub'); }}
          >
            {t.back}
          </button>
          <div className="ct-fq-logo">{t.pickDiff}</div>
          <p className="ct-fq-sub">{t.pickDiffSub}</p>
          {Object.entries(DM).map(([k, m]) => (
            <button
              key={k}
              type="button"
              className={`ct-fq-db ct-fq-db-${k}`}
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
          ))}
        </div>
      )}

      {phase === 'levels' && (
        <div className="ct-fq-screen">
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-ghost"
            onClick={() => { playSfx('click'); setPhase('diff'); }}
          >
            {t.levelsBack}
          </button>
          <div className="ct-fq-logo">{DM[diffKey].label}</div>
          <p className="ct-fq-sub">
            {t.levelsSub(DM[diffKey].pop, DM[diffKey].grid)}
          </p>
          <div className="ct-fq-lg">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((lv) => {
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
      )}

      {phase === 'chal' && (
        <div className="ct-fq-screen">
          <button
            type="button"
            className="ct-fq-btn ct-fq-btn-ghost"
            onClick={() => { playSfx('click'); setPhase('hub'); }}
          >
            {t.back}
          </button>
          <div className="ct-fq-logo">{t.challengeTitle}</div>
          <p className="ct-fq-sub">{t.challengeSub}</p>
          <div className="ct-fq-card">
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
                className="ct-fq-apb"
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
                  className={`ct-fq-rrb${chalRoundsTotal === n ? ' ct-fq-rrb-on' : ''}`}
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
            />
            <div className="ct-fq-tb" data-fq-chrome>
              <div className="ct-fq-tb-row">
                <div
                  className={`ct-fq-tb-icon-wrap${round.diff === 'deadly' ? ' ct-fq-tb-icon-deadly' : ''}`}
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
                    size={round.diff === 'deadly' ? 40 : 34}
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
                  width: round.grid * gridMetrics.cell + (round.grid - 1) * gridMetrics.gap + gridMetrics.pad * 2,
                  height: round.grid * gridMetrics.cell + (round.grid - 1) * gridMetrics.gap + gridMetrics.pad * 2,
                }}
              >
                <div
                  className={`ct-fq-sg ${shake ? 'shake' : ''}`}
                  style={{
                    gridTemplateColumns: `repeat(${round.grid}, ${gridMetrics.cell}px)`,
                    gridTemplateRows: `repeat(${round.grid}, ${gridMetrics.cell}px)`,
                    gap: gridMetrics.gap,
                    width: round.grid * gridMetrics.cell + (round.grid - 1) * gridMetrics.gap,
                  }}
                >
                  {cells.map((c, idx) => (
                    <FqGridCell
                      key={c.id}
                      cell={c}
                      idx={idx}
                      size={Math.max(16, gridMetrics.cell - 6)}
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
                    runRef.current = true;
                    bumpFrame();
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
        <div className="ct-fq-screen">
          <div className="ct-fq-logo">{lastResult.stats.won ? 'Level passed' : 'Try again'}</div>
          <div className="ct-fq-sbig">{Math.round(lastResult.stats.ies)}</div>
          <div className="ct-fq-ies-lbl">{t.ies}</div>
          <div className="ct-fq-rm">
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
              onClick={() => { setLastResult(null); setPhase('hub'); }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-screen">
          <div className="ct-fq-logo">{t.freeGameOver}</div>
          <div className="ct-fq-sbig">{lastResult.roundsWon}</div>
          <div className="ct-fq-ies-lbl">{t.freeRoundsCleared(lastResult.roundsWon)}</div>
          <p className="ct-fq-sub">{t.freeBest(profile.freeBest ?? 0)}</p>
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
            onClick={() => { setLastResult(null); setPhase('hub'); }}
          >
            {t.menu}
          </button>
        </div>
      )}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-screen">
          <div className="ct-fq-logo">Challenge results</div>
          {[...lastResult.rows].sort((a, b) => b.ies - a.ies).map((row, i) => (
            <div key={row.nm} className={`ct-fq-lbr ${i === 0 ? 'win' : ''}`}>
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
            onClick={() => { setLastResult(null); setPhase('chal'); setChalSeed(null); }}
          >
            {t.newCh}
          </button>
          <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('hub'); }}>
            {t.menu}
          </button>
        </div>
      )}

      {phase === 'play' && cdShow && (
        <div className="ct-fq-cd">
          <div className="ct-fq-cd-num">{cdVal}</div>
          <div className="ct-fq-cd-lbl">{t.countdownHint}</div>
        </div>
      )}
    </div>
  );
}
