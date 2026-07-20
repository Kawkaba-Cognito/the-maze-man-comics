import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader, TrainingQuitModal, TrainingChallengeHandoff } from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid, TrainingModeList } from '../../../../shared/TrainingScreens';
import HubScienceLink from '../../../../shared/HubScienceLink';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { useTrainingTutorialHost } from '../../../../shared/tutorials/useTrainingTutorialHost';
import { createStaircase } from '../../../../shared/staircase';
import { createTrialLog } from '../../../../shared/trialLog';
import { generateMatrix } from './ravenEngine';
import { RV_DIFF_KEYS, RV_LEVELS_PER_TIER, RV_TRIALS_PER_LEVEL, ravenLevelSpec, ravenChallengeSpec, isRavenLevelUnlocked, gradeRaven } from './ravenData';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { planetIconUrl } from '../../../../../../lib/planetIcons';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';

const Raven3DProto = lazyWithRetry(() => import('./Raven3DProto'), 'raven-3d');
const C3D_FALLBACK = (
  <div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>
);

const UI = {
  en: {
    ...STR_COMMON.en,
    hub: 'Reasoning', title: 'Matrix Reasoning',
    freeHint: 'Endless · 3 lives · adapts to you', levelsHint: '3 tiers · 100 levels each', chalHint: 'Same puzzles · pass the device',
    modesAria: 'Modes — choose a path',
    blurb: 'Find the figure that completes the pattern. Each row and column follows a hidden rule.',
    pickDiff: 'Choose Difficulty', pickDiffSub: 'Each tier has 100 levels · unlock them in order.',
    diffEasy: 'Easy', diffMedium: 'Medium', diffHard: 'Hard',
    popEasy: '1–2 rules · 4 options', popMedium: '2–4 rules · 6 options', popHard: '3–5 rules · 8 options',
    diffDesc: {
      easy: 'One or two rules — constant rows, steps, and distributions.',
      medium: 'Mix distribution-of-two with progressions.',
      hard: 'Up to five rules including figure addition.',
    },
    levelsSub: (pop) => `${pop} · 100 levels`,
    prompt: 'Which piece completes the grid?',
    solved: 'Solved', correct: 'Correct',
    over: 'Run ended', best: (n) => `Best: ${n}`, again: 'Play again',
    levelPass: 'Level passed', levelRetry: 'Try again',
    accuracy: 'Accuracy', avgTime: 'Avg time',
    perfect: 'Flawless!', good: 'Well reasoned', tryAgain: 'Keep practicing',
    chalTitle: 'Pass n Play', chalSub: 'Everyone gets the same puzzles · pass the device · highest score wins',
    chalBullet1: 'Same puzzles & order for everyone', chalBullet2: 'Tap Start only when the device is with this player',
    chalMeta: (lbl, n) => `${lbl} · ${n} puzzles`,
    chalResDetail: (c, t, ms) => `${c}/${t} correct · ${(ms / 1000).toFixed(0)}s`,
  },
  ar: {
    ...STR_COMMON.ar,
    hub: 'تفكير', title: 'استدلال المصفوفات',
    freeHint: 'لا ينتهي · ٣ أرواح · يتكيّف معك', levelsHint: '٣ مستويات · ١٠٠ مرحلة لكل منها', chalHint: 'نفس الألغاز · مرّر الجهاز',
    modesAria: 'الأوضاع — اختر مسارًا',
    blurb: 'اعثر على الشكل الذي يُكمل النمط. كل صف وعمود يتبع قاعدة خفية.',
    pickDiffSub: 'كل صعوبة ١٠٠ مستوى · افتحها بالترتيب.',
    diffEasy: 'سهل', diffMedium: 'متوسط', diffHard: 'صعب',
    popEasy: '١-٢ قواعد · ٤ خيارات', popMedium: '٢-٤ قواعد · ٦ خيارات', popHard: '٣-٥ قواعد · ٨ خيارات',
    diffDesc: {
      easy: 'قاعدة أو قاعدتان — ثبات الصف، التدرّج، والتوزيع.',
      medium: 'مزج توزيع-اثنين مع التدرّجات.',
      hard: 'حتى خمس قواعد بما فيها جمع الأشكال.',
    },
    levelsSub: (pop) => `${pop} · ١٠٠ مستوى`,
    prompt: 'أي قطعة تُكمل الشبكة؟',
    solved: 'محلولة', correct: 'صحيحة',
    over: 'انتهت المحاولة', best: (n) => `الأفضل: ${n}`, again: 'العب مجددًا',
    levelPass: 'اجتُزت المرحلة', levelRetry: 'حاول مجددًا',
    accuracy: 'الدقة', avgTime: 'متوسط الزمن', nextLv: 'المرحلة التالية',
    perfect: 'بلا أخطاء!', good: 'استدلال جيّد', tryAgain: 'واصل التدريب',
    chalTitle: 'مرّر والعب', chalSub: 'الجميع يحصل على نفس الألغاز · مرّر الجهاز · الأعلى نقاطاً يفوز',
    chalBullet1: 'نفس الألغاز والترتيب للجميع', chalBullet2: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    chalMeta: (lbl, n) => `${lbl} · ${n} ألغاز`,
    chalResDetail: (c, t, ms) => `${c}/${t} صحيحة · ${(ms / 1000).toFixed(0)}ث`,
  },
};

const LIVES = 3;
const PROFILE_KEY = 'mm_raven_v1';
function loadProfile() { try { const j = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); return { done: j.done || {}, best: j.best || 0 }; } catch { return { done: {}, best: 0 }; } }
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ } }

/* ── Figure renderer ── */
const POS = { 1: [[50, 50]], 2: [[32, 50], [68, 50]], 3: [[50, 33], [33, 66], [67, 66]], 4: [[34, 34], [66, 34], [34, 66], [66, 66]] };
function Glyph({ shape, cx, cy, r, fill, color }) {
  const style = fill === 'solid' ? { fill: color, stroke: color, strokeWidth: 2 }
    : fill === 'half' ? { fill: color, fillOpacity: 0.4, stroke: color, strokeWidth: 2.5 }
      : { fill: 'none', stroke: color, strokeWidth: 2.5 };
  if (shape === 'circle') return <circle cx={cx} cy={cy} r={r} {...style} />;
  if (shape === 'square') return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={2} {...style} />;
  const poly = (pts) => <polygon points={pts.map(([x, y]) => `${x},${y}`).join(' ')} strokeLinejoin="round" {...style} />;
  if (shape === 'triangle') return poly([[cx, cy - r], [cx + r, cy + r], [cx - r, cy + r]]);
  if (shape === 'diamond') return poly([[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]]);
  return poly(Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }));
}
function Figure({ fig, size = 72 }) {
  if (!fig || fig.count === 0) {
    return (
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block', opacity: 0.35 }}>
        <rect x="28" y="28" width="44" height="44" rx="6" fill="none" stroke="#b9842f" strokeWidth="2" strokeDasharray="6 4" />
      </svg>
    );
  }
  const pts = POS[fig.count] || POS[1];
  const r = fig.count >= 3 ? 13 : fig.count === 2 ? 15 : 19;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'block' }}>
      <g transform={`rotate(${fig.rot} 50 50)`}>
        {pts.map(([x, y], i) => <Glyph key={i} shape={fig.shape} cx={x} cy={y} r={r} fill={fig.fill} color={fig.color} />)}
      </g>
    </svg>
  );
}

function ReasoningModes({ t, isAr, onFree, onLevels, onChallenge, onProto3d, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.freeHint, on: onFree, mod: 'ct-fq-attn-mode--free' },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.levelsHint, on: onLevels, mod: 'ct-fq-attn-mode--levels' },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.chalHint, on: onChallenge, mod: 'ct-fq-attn-mode--chal' },
    {
      k: 'proto3d',
      lb: isAr ? 'ثلاثي الأبعاد' : '3D',
      hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
      on: onProto3d,
      icoImg: planetIconUrl('reasoning'),
      mod: 'ct-fq-attn-mode--proto3d',
    },
  ];
  return <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />;
}

export default function RavenMatricesGame({ onBack, workoutMode = false, cosmosAutoPlay = false }) {
  const { playSfx, currentLang, awardFreeRun, awardTrainingWin } = useApp();
  const isAr = currentLang === 'ar';
  const [cosmosEmbed, setCosmosEmbed] = useState(false);
  const isCosmos = cosmosAutoPlay || cosmosEmbed;
  const t = isAr ? UI.ar : UI.en;
  const juice = useJuice();
  const { openTutorial, replayHint: tutReplayHint, layer: tutLayer } = useTrainingTutorialHost('raven-matrices', isAr, playSfx);
  const workoutLaunched = useRef(false);

  const DM = useMemo(() => ({
    easy: { label: t.diffEasy, pop: t.popEasy, lvc: 'fq-lve' },
    medium: { label: t.diffMedium, pop: t.popMedium, lvc: 'fq-lvm' },
    hard: { label: t.diffHard, pop: t.popHard, lvc: 'fq-lvh' },
  }), [t]);

  const [phase, setPhase] = useState('hub');

  const exitCosmos = useCallback(() => {
    workoutLaunched.current = false;
    setCosmosEmbed(false);
    setPhase('hub');
  }, []);

  const withCosmos = useCallback((node) => (
    isCosmos ? (
      <Suspense fallback={C3D_FALLBACK}>
        <Raven3DProto
          isAr={isAr}
          playSfx={playSfx}
          onBack={() => {
            if (cosmosAutoPlay) onBack?.();
            else exitCosmos();
          }}
        />
      </Suspense>
    ) : node
  ), [isCosmos, isAr, playSfx, cosmosAutoPlay, onBack, exitCosmos]);
  const [puzzle, setPuzzle] = useState(null);
  const [picked, setPicked] = useState(null);
  const [diffKey, setDiffKey] = useState('easy');
  const [profile, setProfile] = useState(() => loadProfile());

  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [trialIdx, setTrialIdx] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [quitOpen, setQuitOpen] = useState(false);

  // Pass n Play
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalDiff, setChalDiff] = useState('medium');

  const blockRef = useRef(null);
  const trialIdxRef = useRef(0);
  const correctRef = useRef(0);
  const rtSumRef = useRef(0);
  const scoreRef = useRef(0);
  const solvedRef = useRef(0);
  const livesRef = useRef(LIVES);
  const peakRef = useRef(0);
  const staircaseRef = useRef(null);
  const trialLogRef = useRef(null);
  const startTimeRef = useRef(0);
  const trialStartRef = useRef(0);
  const lockRef = useRef(false);
  const advanceRef = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalSeedRef = useRef(0);

  const clearTimers = () => { if (advanceRef.current) clearTimeout(advanceRef.current); advanceRef.current = 0; };
  useEffect(() => () => { clearTimers(); trialLogRef.current?.discard(); }, []);
  useEffect(() => { chalNamesRef.current = chalNames; }, [chalNames]);

  const persistDone = useCallback((diff, lv) => {
    setProfile((prev) => { const next = { ...prev, done: { ...prev.done, [`${diff}-${lv}`]: true } }; saveProfile(next); return next; });
  }, []);

  const nextTrial = useCallback(() => {
    const block = blockRef.current;
    if (!block) return;
    const p = block.mode === 'free'
      ? generateMatrix(staircaseRef.current?.level ?? 0)
      : generateMatrix(block.spec.genLevel, block.seed + trialIdxRef.current);
    setPuzzle(p);
    setPicked(null);
    lockRef.current = false;
    trialStartRef.current = performance.now();
  }, []);

  const endFree = useCallback(() => {
    clearTimers();
    playSfx('error');
    trialLogRef.current?.finish({ score: scoreRef.current, solved: solvedRef.current, level: peakRef.current });
    trialLogRef.current = null;
    awardFreeRun('raven', peakRef.current);
    setProfile((prev) => { if (scoreRef.current <= (prev.best || 0)) return prev; const next = { ...prev, best: scoreRef.current }; saveProfile(next); return next; });
    setLastResult({ type: 'free', score: scoreRef.current, solved: solvedRef.current });
    blockRef.current = null;
    setPhase('freeRes');
  }, [playSfx, awardFreeRun]);

  const finishBlock = useCallback(() => {
    const block = blockRef.current;
    if (!block) return;
    if (block.mode === 'level') {
      const meanRt = correctRef.current ? Math.round(rtSumRef.current / correctRef.current) : null;
      const grade = gradeRaven(correctRef.current, block.spec.trials, meanRt);
      trialLogRef.current?.finish({ score: grade.score, won: grade.won, correct: correctRef.current, meanRt });
      trialLogRef.current = null;
      if (grade.won) { playSfx('win'); persistDone(block.diff, block.lv); awardTrainingWin('raven', block.diff, block.lv, RV_LEVELS_PER_TIER); }
      else playSfx('error');
      setLastResult({ type: 'level', block, grade });
      blockRef.current = null;
      setPhase('res');
      return;
    }
    // challenge
    const ms = Math.round(performance.now() - startTimeRef.current);
    const idx = chalIdxRef.current;
    const names = chalNamesRef.current;
    const base = [...chalScoresRef.current];
    base[idx] = { nm: names[idx], correct: correctRef.current, total: block.spec.trials, ms };
    chalScoresRef.current = base;
    setChalScores(base);
    playSfx('win');
    const nextIdx = idx + 1;
    blockRef.current = null;
    if (nextIdx < names.length) { setChalIdx(nextIdx); chalIdxRef.current = nextIdx; setChalTurnOpen(true); setPhase('play'); }
    else { setLastResult({ type: 'challenge', rows: base }); setPhase('chalRes'); }
  }, [playSfx, persistDone, awardTrainingWin]);

  const onPick = useCallback((idx) => {
    if (lockRef.current || !puzzle) return;
    const block = blockRef.current;
    if (!block) return;
    lockRef.current = true;
    const ok = idx === puzzle.correctIndex;
    const rt = Math.round(performance.now() - trialStartRef.current);
    trialLogRef.current?.trial({ rt, ok, d: puzzle.d, mode: block.mode });
    setPicked({ idx, ok });
    if (ok) { playSfx('collect'); juice.hit({ rtMs: rt }); juice.celebrate(); correctRef.current += 1; setCorrect(correctRef.current); rtSumRef.current += rt; }
    else { playSfx('error'); juice.miss(); }

    if (block.mode === 'free') {
      if (ok) {
        const lvl = staircaseRef.current?.level ?? 0;
        scoreRef.current += 6 + lvl * 2; setScore(scoreRef.current);
        solvedRef.current += 1; setSolved(solvedRef.current);
        staircaseRef.current?.success();
        peakRef.current = Math.max(peakRef.current, (staircaseRef.current?.level ?? 0) + 1);
        advanceRef.current = setTimeout(nextTrial, 420);
      } else {
        staircaseRef.current?.failure();
        livesRef.current -= 1; setLives(livesRef.current);
        if (livesRef.current <= 0) advanceRef.current = setTimeout(endFree, 750);
        else advanceRef.current = setTimeout(nextTrial, 900);
      }
      return;
    }
    // level / challenge: fixed number of trials
    trialIdxRef.current += 1; setTrialIdx(trialIdxRef.current);
    const done = trialIdxRef.current >= block.spec.trials;
    advanceRef.current = setTimeout(() => { if (done) finishBlock(); else nextTrial(); }, ok ? 450 : 700);
  }, [puzzle, playSfx, juice, nextTrial, endFree, finishBlock]);

  /* ── block starters ── */
  const beginBlock = useCallback((block) => {
    clearTimers();
    blockRef.current = block;
    trialIdxRef.current = 0; setTrialIdx(0);
    correctRef.current = 0; setCorrect(0);
    rtSumRef.current = 0;
    juice.reset();
    setPicked(null);
    trialLogRef.current?.discard();
    trialLogRef.current = (block.mode === 'free' || block.mode === 'level')
      ? createTrialLog({ game: 'raven-matrices', mode: workoutMode ? 'workout' : block.mode, meta: block.mode === 'level' ? { diff: block.diff, lv: block.lv } : undefined })
      : null;
    startTimeRef.current = performance.now();
    setPhase('play');
    // first puzzle
    const first = block.mode === 'free'
      ? generateMatrix(staircaseRef.current?.level ?? 0)
      : generateMatrix(block.spec.genLevel, block.seed + 0);
    setPuzzle(first);
    lockRef.current = false;
    trialStartRef.current = performance.now();
  }, [juice, workoutMode]);

  const startFree = useCallback(() => {
    staircaseRef.current = createStaircase({ nDown: 2, max: 30 });
    peakRef.current = 0; livesRef.current = LIVES; scoreRef.current = 0; solvedRef.current = 0;
    setLives(LIVES); setScore(0); setSolved(0);
    beginBlock({ mode: 'free' });
  }, [beginBlock]);

  const startLevel = useCallback((diff, lv) => {
    beginBlock({ mode: 'level', diff, lv, spec: ravenLevelSpec(diff, lv), seed: ((Math.random() * 1e9) | 0) });
  }, [beginBlock]);

  const startChallengeBlock = useCallback(() => {
    setChalTurnOpen(false);
    beginBlock({ mode: 'challenge', diff: chalDiff, spec: ravenChallengeSpec(chalDiff), seed: chalSeedRef.current });
  }, [beginBlock, chalDiff]);

  const openChallenge = useCallback(() => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) { window.alert(t.needTwo); return; }
    setChalNames(names); chalNamesRef.current = names;
    chalScoresRef.current = []; setChalScores([]);
    chalIdxRef.current = 0; setChalIdx(0);
    chalSeedRef.current = (Math.random() * 1e9) | 0;
    setChalTurnOpen(true);
    setPhase('play');
  }, [chalNames, t.needTwo]);

  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) {
      workoutLaunched.current = true;
      startFree();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode]);

  const quitToMenu = useCallback(() => {
    setQuitOpen(false); clearTimers(); trialLogRef.current?.discard(); trialLogRef.current = null;
    const mode = blockRef.current?.mode; blockRef.current = null;
    if (cosmosEmbed) { setCosmosEmbed(false); setPhase('hub'); return; }
    if (cosmosAutoPlay) { onBack?.(); return; }
    if (mode === 'level') setPhase('levels');
    else if (mode === 'challenge') setPhase('chal');
    else setPhase('hub');
  }, [cosmosAutoPlay, cosmosEmbed, onBack]);

  const exitToHub = useCallback(() => {
    setLastResult(null);
    if (cosmosEmbed) { setCosmosEmbed(false); setPhase('hub'); }
    else if (cosmosAutoPlay) onBack?.();
    else setPhase('hub');
  }, [cosmosAutoPlay, cosmosEmbed, onBack]);

  const block = blockRef.current;
  const starLabel = lastResult?.grade?.stars === 3 ? t.perfect : lastResult?.grade?.stars === 2 ? t.good : t.tryAgain;

  /* ── Standalone 3D prototype ── */
  if (phase === 'play3d') {
    return (
      <Suspense fallback={C3D_FALLBACK}>
        <Raven3DProto isAr={isAr} playSfx={playSfx} onBack={() => setPhase('hub')} />
      </Suspense>
    );
  }

  /* ── Hub ── */
  if (phase === 'hub' && !isCosmos) {
    return (
      <>
        <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="ct-fq-training-shell ct-fq-training-shell--mode-cosmos">
            <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
              <TrainingMenuBar onBack={onBack} playSfx={playSfx} hubSpaced variant="paper"
                onReplayTutorial={openTutorial} replayHint={tutReplayHint}
                center={<div className="ct-fq-hub-attn-head"><div className="ct-fq-hub-attn-big">{t.title}</div><div className="ct-fq-hub-attn-sub">{t.tag}</div></div>} />
              <div className="ct-rv-intro">
                <p className="ct-fq-sub ct-fq-training-blurb">{t.blurb}</p>
              </div>
              <ReasoningModes t={t} isAr={isAr} playSfx={playSfx}
                onFree={() => setPhase('freeIntro')}
                onLevels={() => setPhase('diff')}
                onChallenge={() => setPhase('chal')}
                onProto3d={() => setPhase('play3d')} />
              <HubScienceLink gameId="raven-matrices" isAr={isAr} playSfx={playSfx} />
            </div>
          </div>
        </div>
        {tutLayer}
      </>
    );
  }

  if (phase === 'hub' && isCosmos) {
    return null;
  }

  if (phase === 'freeIntro') {
    return <SurvivalIntro isAr={isAr} playSfx={playSfx} onReady={startFree} onBack={() => setPhase('hub')} />;
  }

  if (phase === 'diff') {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <TrainingDifficultySelect isAr={isAr} playSfx={playSfx} onBack={() => setPhase('hub')}
          title={t.pickDiff} blurb={t.pickDiffSub} diffKeys={RV_DIFF_KEYS} dm={DM} descs={t.diffDesc}
          onPick={(k) => { setDiffKey(k); setPhase('levels'); }} />
      </div>
    );
  }

  if (phase === 'levels') {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <TrainingLevelGrid isAr={isAr} playSfx={playSfx} onBack={() => setPhase('diff')}
          title={DM[diffKey].label} blurb={t.levelsSub(DM[diffKey].pop)} count={RV_LEVELS_PER_TIER} lvc={DM[diffKey].lvc}
          isUnlocked={(lv) => isRavenLevelUnlocked(diffKey, lv, profile.done)}
          isDone={(lv) => !!profile.done[`${diffKey}-${lv}`]}
          sublabel={() => `${RV_TRIALS_PER_LEVEL}◆`}
          onPick={(lv) => startLevel(diffKey, lv)} />
      </div>
    );
  }

  if (phase === 'chal') {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper" />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.chalSub}
              diffKeys={RV_DIFF_KEYS}
              diffLabels={DM}
              diff={chalDiff}
              onDiffChange={setChalDiff}
              players={chalNames}
              onPlayersChange={setChalNames}
              rounds={1}
              onRoundsChange={() => {}}
              roundOptions={[1]}
              onStart={() => { playSfx('click'); openChallenge(); }}
              labels={{
                difficulty: t.chalPickDiff,
                players: t.players,
                addPlayer: t.addPl,
                start: t.startCh,
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  /* ── Results: free ── */
  if (phase === 'freeRes' && lastResult?.type === 'free') {
    return withCosmos(
      <div
        className={`cancellation-task-game ct-rv-root${isCosmos ? ' c3d-embed-root' : ''}`}
        data-c3d-embed={isCosmos || undefined}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={exitToHub} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.over}</div></div>} />
            <div className="ct-fq-sbig">{lastResult.score}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <div className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 10, fontWeight: 700 }}>{t.solved}: {lastResult.solved}</div>
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>{t.best(profile.best)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startFree(); }}>{t.again}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={exitToHub}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Results: level ── */
  if (phase === 'res' && lastResult?.type === 'level') {
    const { block: lb, grade } = lastResult;
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('levels'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{grade.won ? t.levelPass : t.levelRetry}</div></div>} />
            {grade.won && <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#e8ac4e', marginTop: 8, fontWeight: 700 }}>{'★'.repeat(grade.stars)} <span style={{ fontSize: '0.85rem', color: '#5c534c' }}>{starLabel}</span></div>}
            <div className={`ct-fq-sbig ct-fq-band-text-${grade.score >= 75 ? 'high' : grade.score >= 50 ? 'mid' : 'low'}`}>{grade.score}</div>
            <div className="ct-fq-ies-lbl">{t.accuracy}</div>
            <div className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 8, fontWeight: 700 }}>
              {t.correct}: {grade.correct}/{grade.trials}{grade.meanRtMs != null ? ` · ${t.avgTime} ${(grade.meanRtMs / 1000).toFixed(1)}s` : ''}
            </div>
            <div className="ct-fq-row" style={{ marginTop: 12 }}>
              {grade.won && lb.lv < RV_LEVELS_PER_TIER && <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startLevel(lb.diff, lb.lv + 1); }}>{t.nextLv}</button>}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { playSfx('click'); setLastResult(null); startLevel(lb.diff, lb.lv); }}>{t.retry}</button>
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('levels'); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Results: challenge ── */
  if (phase === 'chalRes' && lastResult?.type === 'challenge') {
    const rows = [...lastResult.rows].sort((a, b) => b.correct - a.correct || a.ms - b.ms);
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('hub'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.chalResTitle}</div></div>} />
            {rows.map((row, i) => (
              <div key={row.nm + i} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div><div className="ct-fq-lbnm">{row.nm}</div><div className="ct-fq-lbdt">{t.chalResDetail(row.correct, row.total, row.ms)}</div></div>
                <div className="ct-fq-lbsc">{row.correct}</div>
              </div>
            ))}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { setLastResult(null); setPhase('chal'); }}>{t.newCh}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('hub'); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Pass-n-play handoff ── */
  if (phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx]) {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <TrainingChallengeHandoff isAr={isAr} kicker={t.chalTurnKicker} playerName={chalNames[chalIdx]}
          metaLine={t.chalMeta(DM[chalDiff].label, ravenChallengeSpec(chalDiff).trials)}
          instruction={t.handTo(chalNames[chalIdx])} bullets={[t.chalBullet1, t.chalBullet2]}
          startLabel={t.goReady} onStart={startChallengeBlock} playSfx={playSfx} />
      </div>
    );
  }

  /* ── Play ── */
  const total = block?.spec?.trials ?? 0;
  return withCosmos(
    <div
      className={`cancellation-task-game ct-rv-root${isCosmos ? ' c3d-embed-root' : ''}`}
      data-c3d-embed={isCosmos || undefined}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <TrainingPlayHeader isAr={isAr} title={t.title} subtitle="" playSfx={playSfx}
        onMenu={isCosmos ? undefined : () => setQuitOpen(true)} />
      <div className="ct-rv-play ct-juice-host">
        <JuiceLayer toast={juice.toast} burst={juice.burst} />
        <div className="ct-rv-hud">
          {block?.mode === 'free' ? (
            <>
              <span className="ct-rv-hud-stat ct-fq-lives" aria-label={`${lives} ${t.lives}`}>{'♥'.repeat(Math.max(0, lives))}<span className="ct-fq-lives-spent">{'♥'.repeat(Math.max(0, LIVES - lives))}</span></span>
              <span className="ct-rv-hud-stat">{t.score} {score}</span>
              <span className="ct-rv-hud-stat">{t.solved} {solved}</span>
            </>
          ) : (
            <>
              <span className="ct-rv-hud-stat">{Math.min(trialIdx + 1, total)}/{total}</span>
              <span className="ct-rv-hud-stat">{t.correct} {correct}</span>
            </>
          )}
        </div>

        {puzzle && (
          <div className="ct-rv-grid">
            {puzzle.grid.flat().map((fig, i) => (
              i === 8 ? <div className="ct-rv-cell ct-rv-cell--q" key={i}>?</div> : <div className="ct-rv-cell" key={i}><Figure fig={fig} /></div>
            ))}
          </div>
        )}
        <p className="ct-rv-prompt">{t.prompt}</p>

        {puzzle && (
          <div className={`ct-rv-options ct-rv-options--n${puzzle.optionCount}`} role="group" aria-label={t.prompt}>
            {puzzle.options.map((fig, i) => {
              const cls = picked ? (i === puzzle.correctIndex ? ' ct-rv-opt--correct' : i === picked.idx ? ' ct-rv-opt--wrong' : ' ct-rv-opt--dim') : '';
              return (
                <button key={i} type="button" className={`ct-rv-opt${cls}`} disabled={!!picked && picked.ok}
                  onPointerDown={(e) => { e.preventDefault(); onPick(i); }}>
                  <Figure fig={fig} size={58} />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <TrainingQuitModal open={quitOpen} labels={{ quitQ: t.quitQ, quitLose: t.quitLose, yesQuit: t.yesQuit, keep: t.keep }}
        onConfirmQuit={quitToMenu} onKeepPlaying={() => setQuitOpen(false)} />
    </div>
  );
}
