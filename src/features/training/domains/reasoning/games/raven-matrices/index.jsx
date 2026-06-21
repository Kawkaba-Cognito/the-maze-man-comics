import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader, TrainingQuitModal, TrainingChallengeHandoff } from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import { useJuice } from '../../../../shared/juice/useJuice';
import { JuiceLayer } from '../../../../shared/juice/JuiceLayer';
import { useCoach } from '../../../../shared/coach/useCoach';
import CoachOverlay from '../../../../shared/coach/CoachOverlay';
import { createStaircase } from '../../../../shared/staircase';
import { createTrialLog } from '../../../../shared/trialLog';
import { generateMatrix } from './ravenEngine';
import { RV_DIFF_KEYS, RV_LEVELS_PER_TIER, ravenLevelSpec, ravenChallengeSpec, isRavenLevelUnlocked, gradeRaven } from './ravenData';
import { buildRavenCoachSteps } from './tutorialScript';

const UI = {
  en: {
    hub: 'Reasoning', tag: 'training', title: 'Matrix Reasoning', replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Survival mode', levelMode: '🎯 Level mode', challengeMode: '⚔️ Pass n Play',
    freeHint: 'Endless · 3 lives · adapts to you', levelsHint: '3 tiers · 20 levels each', chalHint: 'Same puzzles · pass the device',
    modesAria: 'Modes — choose a path',
    blurb: 'Find the figure that completes the pattern. Each row and column follows a hidden rule.',
    pickDiff: 'Choose difficulty', pickDiffSub: 'Each tier has 20 levels — unlock them in order.',
    diffEasy: 'Easy', diffMedium: 'Medium', diffHard: 'Hard',
    popEasy: '1 rule · 4 options', popMedium: '2–3 rules · 6 options', popHard: '3–4 rules · 8 options',
    diffDesc: { easy: 'One attribute changes — learn to read a row.', medium: 'Two or three change at once.', hard: 'Up to four, with eight choices.' },
    levelsSub: '20 levels',
    prompt: 'Which piece completes the grid?',
    lives: 'Lives', score: 'Score', solved: 'Solved', correct: 'Correct',
    quitQ: 'Quit?', quitLose: 'This run will be lost.', yesQuit: 'Yes, quit', keep: 'Keep playing',
    over: 'Run ended', best: (n) => `Best: ${n}`, again: 'Play again', menu: 'Menu',
    levelPass: 'Level passed', levelRetry: 'Try again', stars: 'Stars',
    accuracy: 'Accuracy', avgTime: 'Avg time', nextLv: 'Next level', retry: 'Retry',
    perfect: 'Flawless!', good: 'Well reasoned', tryAgain: 'Keep practicing',
    chalTitle: '⚔️ Pass n Play', chalSub: 'Everyone gets the same puzzles · pass the device · highest score wins',
    chalPickDiff: 'Difficulty', players: 'Players (2–10)', addPl: '＋ Add player', startCh: '⚔️ Start', needTwo: 'Add at least 2 players.',
    chalTurnKicker: 'Your turn', chalBullet1: 'Same puzzles & order for everyone', chalBullet2: 'Tap Start only when the device is with this player',
    handTo: (n) => `Hand the device to ${n}.`, goReady: 'Start', chalMeta: (lbl, n) => `${lbl} · ${n} puzzles`,
    chalResTitle: 'Pass n Play results', chalResDetail: (c, t, ms) => `${c}/${t} correct · ${(ms / 1000).toFixed(0)}s`, newCh: 'New game',
  },
  ar: {
    hub: 'تفكير', tag: 'تدريب', title: 'استدلال المصفوفات', replayTutorial: 'إعادة الشرح',
    freeMode: '♾️ وضع البقاء', levelMode: '🎯 وضع المستويات', challengeMode: '⚔️ مرّر والعب',
    freeHint: 'لا ينتهي · ٣ أرواح · يتكيّف معك', levelsHint: '٣ مستويات · ٢٠ مرحلة لكل منها', chalHint: 'نفس الألغاز · مرّر الجهاز',
    modesAria: 'الأوضاع — اختر مسارًا',
    blurb: 'اعثر على الشكل الذي يُكمل النمط. كل صف وعمود يتبع قاعدة خفية.',
    pickDiff: 'اختر الصعوبة', pickDiffSub: 'كل مستوى يحتوي ٢٠ مرحلة — افتحها بالترتيب.',
    diffEasy: 'سهل', diffMedium: 'متوسط', diffHard: 'صعب',
    popEasy: 'قاعدة واحدة · ٤ خيارات', popMedium: '٢-٣ قواعد · ٦ خيارات', popHard: '٣-٤ قواعد · ٨ خيارات',
    diffDesc: { easy: 'سمة واحدة تتغيّر — تعلّم قراءة الصف.', medium: 'سمتان أو ثلاث معًا.', hard: 'حتى أربع، مع ثمانية خيارات.' },
    levelsSub: '٢٠ مرحلة',
    prompt: 'أي قطعة تُكمل الشبكة؟',
    lives: 'الأرواح', score: 'نقاط', solved: 'محلولة', correct: 'صحيحة',
    quitQ: 'خروج؟', quitLose: 'سيُلغى هذا السجل.', yesQuit: 'نعم، خروج', keep: 'متابعة اللعب',
    over: 'انتهت المحاولة', best: (n) => `الأفضل: ${n}`, again: 'العب مجددًا', menu: 'القائمة',
    levelPass: 'اجتُزت المرحلة', levelRetry: 'حاول مجددًا', stars: 'نجوم',
    accuracy: 'الدقة', avgTime: 'متوسط الزمن', nextLv: 'المرحلة التالية', retry: 'إعادة',
    perfect: 'بلا أخطاء!', good: 'استدلال جيّد', tryAgain: 'واصل التدريب',
    chalTitle: '⚔️ مرّر والعب', chalSub: 'الجميع يحصل على نفس الألغاز · مرّر الجهاز · الأعلى نقاطاً يفوز',
    chalPickDiff: 'الصعوبة', players: 'اللاعبون (2–10)', addPl: '＋ إضافة لاعب', startCh: '⚔️ ابدأ', needTwo: 'أضف لاعبين على الأقل.',
    chalTurnKicker: 'دورك', chalBullet1: 'نفس الألغاز والترتيب للجميع', chalBullet2: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`, goReady: 'ابدأ', chalMeta: (lbl, n) => `${lbl} · ${n} ألغاز`,
    chalResTitle: 'نتائج مرّر والعب', chalResDetail: (c, t, ms) => `${c}/${t} صحيحة · ${(ms / 1000).toFixed(0)}ث`, newCh: 'لعبة جديدة',
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
  if (!fig) return null;
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

function ReasoningModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.freeHint, on: onFree, mod: 'ct-fq-attn-mode--free' },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.levelsHint, on: onLevels, mod: 'ct-fq-attn-mode--levels' },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.chalHint, on: onChallenge, mod: 'ct-fq-attn-mode--chal' },
  ];
  return (
    <div className="ct-fq-attn-modes" role="group" aria-label={t.modesAria}>
      {items.map((m) => (
        <button key={m.k} type="button" className={`ct-fq-attn-mode ${m.mod}`} onClick={() => { playSfx('click'); m.on(); }}>
          <span className="ct-fq-attn-mode-ic" aria-hidden="true">{m.ic}</span>
          <span className="ct-fq-attn-mode-body">
            <span className="ct-fq-attn-mode-lb">{m.lb}</span>
            <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>{m.hint}</span>
          </span>
          <span className="ct-fq-attn-mode-chev" aria-hidden="true">›</span>
        </button>
      ))}
    </div>
  );
}

export default function RavenMatricesGame({ onBack, workoutMode = false }) {
  const { playSfx, currentLang, awardFreeRun, awardTrainingWin } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const juice = useJuice();

  const DM = useMemo(() => ({
    easy: { label: t.diffEasy, pop: t.popEasy, lvc: 'fq-lve' },
    medium: { label: t.diffMedium, pop: t.popMedium, lvc: 'fq-lvm' },
    hard: { label: t.diffHard, pop: t.popHard, lvc: 'fq-lvh' },
  }), [t]);

  const [phase, setPhase] = useState('hub');
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

  // Coach
  const [coachActive, setCoachActive] = useState(false);
  const gridRef = useRef(null);
  const optionsRef = useRef(null);
  const coachRef = useRef(null);
  const pendingAfterCoachRef = useRef(null);
  const tutPuzzleRef = useRef(null);

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
  const workoutLaunched = useRef(false);

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

    // Tutorial: gate on the correct option, allow retry, no scoring.
    if (block?.mode === 'tutorial') {
      const ok = idx === puzzle.correctIndex;
      setPicked({ idx, ok });
      if (ok) { playSfx('collect'); juice.hit({}); juice.celebrate(); lockRef.current = true; coachRef.current?.notify('answer', { ok: true }); }
      else { playSfx('error'); juice.miss(); coachRef.current?.notify('answer', { ok: false }); advanceRef.current = setTimeout(() => setPicked(null), 600); }
      return;
    }

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

  /* ── Coach ── */
  const finishCoach = useCallback(() => {
    try { localStorage.setItem('mm_raven_coach_seen', '1'); } catch { /* ignore */ }
    setCoachActive(false);
    clearTimers();
    blockRef.current = null;
    lockRef.current = false;
    const fn = pendingAfterCoachRef.current; pendingAfterCoachRef.current = null;
    if (fn) fn(); else setPhase('hub');
  }, []);
  const coachSteps = useMemo(() => buildRavenCoachSteps(isAr, { gridRef, optionsRef }), [isAr]);
  const coach = useCoach(coachSteps, { active: coachActive, onDone: finishCoach });
  useEffect(() => { coachRef.current = coach; }, [coach]);

  const beginTutorial = useCallback(() => {
    clearTimers();
    const tut = generateMatrix(0, 12345);
    tutPuzzleRef.current = tut;
    blockRef.current = { mode: 'tutorial' };
    setPuzzle(tut);
    setPicked(null);
    lockRef.current = false;
    setPhase('play');
  }, []);
  const startCoach = useCallback((thenFn) => { pendingAfterCoachRef.current = thenFn || null; setCoachActive(true); beginTutorial(); }, [beginTutorial]);
  const maybeCoach = useCallback((fn) => {
    let seen = false; try { seen = !!localStorage.getItem('mm_raven_coach_seen'); } catch { /* ignore */ }
    if (seen) fn(); else startCoach(fn);
  }, [startCoach]);
  const replayTutorial = useCallback(() => startCoach(null), [startCoach]);

  useEffect(() => {
    if (workoutMode && !workoutLaunched.current) { workoutLaunched.current = true; startFree(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutMode]);

  const quitToMenu = useCallback(() => {
    setQuitOpen(false); clearTimers(); trialLogRef.current?.discard(); trialLogRef.current = null;
    const mode = blockRef.current?.mode; blockRef.current = null;
    if (mode === 'level') setPhase('levels');
    else if (mode === 'challenge') setPhase('chal');
    else setPhase('hub');
  }, []);

  const block = blockRef.current;
  const starLabel = lastResult?.grade?.stars === 3 ? t.perfect : lastResult?.grade?.stars === 2 ? t.good : t.tryAgain;

  /* ── Hub ── */
  if (phase === 'hub') {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar onBack={onBack} playSfx={playSfx} hubSpaced variant="paper"
              onReplayTutorial={replayTutorial} replayHint={t.replayTutorial}
              center={<div className="ct-fq-hub-attn-head"><div className="ct-fq-hub-attn-big">{t.hub}</div><div className="ct-fq-hub-attn-sub">{t.tag}</div></div>} />
            <div className="ct-rv-intro">
              <div className="ct-fq-training-title ct-fq-training-title-sm">{t.title}</div>
              <p className="ct-fq-sub ct-fq-training-blurb">{t.blurb}</p>
            </div>
            <ReasoningModes t={t} isAr={isAr} playSfx={playSfx}
              onFree={() => maybeCoach(startFree)}
              onLevels={() => maybeCoach(() => setPhase('diff'))}
              onChallenge={() => maybeCoach(() => setPhase('chal'))} />
          </div>
        </div>
      </div>
    );
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
          title={DM[diffKey].label} blurb={t.levelsSub} count={RV_LEVELS_PER_TIER} lvc={DM[diffKey].lvc}
          isUnlocked={(lv) => isRavenLevelUnlocked(diffKey, lv, profile.done)}
          isDone={(lv) => !!profile.done[`${diffKey}-${lv}`]}
          sublabel={() => `${ravenLevelSpec(diffKey, 1).trials}◆`}
          onPick={(lv) => startLevel(diffKey, lv)} />
      </div>
    );
  }

  if (phase === 'chal') {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.chalTitle}</div></div>} />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.chalSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.chalPickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.chalPickDiff}>
                {RV_DIFF_KEYS.map((k) => (
                  <button key={k} type="button" className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalDiff(k); }}>{DM[k].label}</button>
                ))}
              </div>
              <h3 style={{ marginTop: 14 }}>{t.players}</h3>
              {chalNames.map((nm, i) => (
                <div key={i} className="ct-fq-pr">
                  <input value={nm} maxLength={20} onChange={(e) => { const n = [...chalNames]; n[i] = e.target.value; setChalNames(n); }} />
                  {chalNames.length > 2 && <button type="button" className="ct-fq-prm" onClick={() => setChalNames(chalNames.filter((_, j) => j !== i))}>×</button>}
                </div>
              ))}
              {chalNames.length < 10 && <button type="button" className="ct-fq-apb ct-fq-apb-training" onClick={() => setChalNames([...chalNames, `Player ${chalNames.length + 1}`])}>{t.addPl}</button>}
            </div>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); openChallenge(); }}>{t.startCh}</button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Results: free ── */
  if (phase === 'freeRes' && lastResult?.type === 'free') {
    return (
      <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('hub'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.over}</div></div>} />
            <div className="ct-fq-sbig">{lastResult.score}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <div className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 10, fontWeight: 700 }}>{t.solved}: {lastResult.solved}</div>
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 6 }}>{t.best(profile.best)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startFree(); }}>{t.again}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('hub'); }}>{t.menu}</button>
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
  return (
    <div className="cancellation-task-game ct-rv-root" dir={isAr ? 'rtl' : 'ltr'}>
      <TrainingPlayHeader isAr={isAr} title={block?.mode === 'tutorial' ? (isAr ? 'كيفية اللعب' : 'How to play') : t.title} subtitle="" playSfx={playSfx}
        onMenu={block?.mode === 'tutorial' ? () => coach.skip() : () => setQuitOpen(true)} />
      <div className="ct-rv-play ct-juice-host">
        <JuiceLayer toast={juice.toast} burst={juice.burst} />
        {block?.mode !== 'tutorial' && (
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
        )}

        {puzzle && (
          <div className="ct-rv-grid" ref={gridRef}>
            {puzzle.grid.flat().map((fig, i) => (
              i === 8 ? <div className="ct-rv-cell ct-rv-cell--q" key={i}>?</div> : <div className="ct-rv-cell" key={i}><Figure fig={fig} /></div>
            ))}
          </div>
        )}
        <p className="ct-rv-prompt">{t.prompt}</p>

        {puzzle && (
          <div className={`ct-rv-options ct-rv-options--n${puzzle.optionCount}`} role="group" aria-label={t.prompt} ref={optionsRef}>
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

      {coachActive && coach.step && (
        <CoachOverlay step={coach.step} index={coach.index} total={coach.total} onNext={coach.next} onSkip={coach.skip} isAr={isAr} />
      )}
    </div>
  );
}
