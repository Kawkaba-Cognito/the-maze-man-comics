import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { SORT_COLORS, makeSolved, canMove, applyMove, isSolved, generateColourSort, moveRejectReason } from './colourSortEngine';
import { CS_DIFF_KEYS, CS_LEVELS_PER_TIER, colourSortLevelSpec, colourSortChallengeSpec, colourSortFreeSpec, isColourSortLevelUnlocked, gradeColourSort, colourSortChallengeScore } from './colourSortData';
const UI = {
  en: {
    hub: 'Reasoning', tag: 'training', title: 'Colour Sort', replayTutorial: 'Replay tutorial',
    freeMode: 'Survival mode', levelMode: 'Level mode', challengeMode: 'Pass n Play',
    freeHint: 'Endless · 3 skips · grows', levelsHint: '3 tiers · 100 levels each', chalHint: 'Same board · pass the device',
    modesAria: 'Modes — choose a path',
    blurb: 'Gather each colour onto its own peg. Stack only the same colour, never a bigger disk on a smaller one.',
    pickDiff: 'Choose Difficulty', pickDiffSub: 'Each tier has 100 levels · unlock them in order.',
    diffEasy: 'Easy', diffMedium: 'Medium', diffHard: 'Hard',
    popEasy: '2 colours · 4 pegs', popMedium: '3 colours · 5 pegs', popHard: '4 colours · 5 pegs',
    diffDesc: { easy: 'Few colours, room to spare.', medium: 'More colours to juggle.', hard: 'More colours, taller stacks, tight space.' },
    levelsSub: (pop) => `${pop} · 100 levels`,
    prompt: 'Tap a peg to lift its top disk, then tap where to place it.',
    moves: 'Moves', par: 'Par', score: 'Score', lives: 'Skips', undo: '↶ Undo', reset: '↺ Reset', skip: '⤼ Skip',
    quitQ: 'Quit?', quitLose: 'This run will be lost.', yesQuit: 'Yes, quit', keep: 'Keep playing',
    over: 'Run ended', best: (n) => `Best: ${n}`, again: 'Play again', menu: 'Menu',
    levelPass: 'Solved!', stars: 'Stars', nextLv: 'Next level', retry: 'Retry',
    perfect: 'Masterful!', good: 'Tidy', tryAgain: 'Solved',
    chalTitle: 'Pass n Play', chalSub: 'Everyone sorts the same board · pass the device · fewest moves wins',
    chalPickDiff: 'Difficulty', players: 'Players (2–10)', addPl: '＋ Add player', startCh: '⚔️ Start', needTwo: 'Add at least 2 players.',
    chalTurnKicker: 'Your turn', chalBullet1: 'Same board for everyone — fewest moves wins', chalBullet2: 'Tap Start only when the device is with this player',
    handTo: (n) => `Hand the device to ${n}.`, goReady: 'Start', chalMeta: (lbl, c) => `${lbl} · ${c} colours`,
    chalResTitle: 'Pass n Play results', chalResDetail: (m, solv) => (solv ? `${m} moves` : 'unsolved'), newCh: 'New game',
  },
  ar: {
    hub: 'تفكير', tag: 'تدريب', title: 'فرز الألوان', replayTutorial: 'إعادة الشرح',
    freeMode: 'وضع البقاء', levelMode: 'وضع المستويات', challengeMode: 'مرّر والعب',
    freeHint: 'لا ينتهي · ٣ تخطّيات · يكبر', levelsHint: '٣ مستويات · ١٠٠ مرحلة لكل منها', chalHint: 'نفس اللوح · مرّر الجهاز',
    modesAria: 'الأوضاع — اختر مسارًا',
    blurb: 'اجمع كل لون على عموده الخاص. كدّس نفس اللون فقط، ولا تضع قرصاً أكبر فوق أصغر.',
    pickDiff: 'اختر الصعوبة', pickDiffSub: 'كل صعوبة ١٠٠ مستوى · افتحها بالترتيب.',
    diffEasy: 'سهل', diffMedium: 'متوسط', diffHard: 'صعب',
    popEasy: 'لونان · ٤ أعمدة', popMedium: '٣ ألوان · ٥ أعمدة', popHard: '٤ ألوان · ٥ أعمدة',
    diffDesc: { easy: 'ألوان قليلة ومساحة وفيرة.', medium: 'ألوان أكثر للمناورة.', hard: 'ألوان أكثر وأكوام أعلى ومساحة ضيّقة.' },
    levelsSub: (pop) => `${pop} · ١٠٠ مستوى`,
    prompt: 'اضغط عموداً لرفع قرصه العلوي، ثم اضغط مكان وضعه.',
    moves: 'الحركات', par: 'المعيار', score: 'نقاط', lives: 'تخطّيات', undo: '↶ تراجع', reset: '↺ إعادة', skip: '⤼ تخطٍّ',
    quitQ: 'خروج؟', quitLose: 'سيُلغى هذا السجل.', yesQuit: 'نعم، خروج', keep: 'متابعة اللعب',
    over: 'انتهت المحاولة', best: (n) => `الأفضل: ${n}`, again: 'العب مجددًا', menu: 'القائمة',
    levelPass: 'حُلّت!', stars: 'نجوم', nextLv: 'المرحلة التالية', retry: 'إعادة',
    perfect: 'إتقان!', good: 'مرتّب', tryAgain: 'حُلّت',
    chalTitle: 'مرّر والعب', chalSub: 'الجميع يفرز نفس اللوح · مرّر الجهاز · الأقل حركات يفوز',
    chalPickDiff: 'الصعوبة', players: 'اللاعبون (2–10)', addPl: '＋ إضافة لاعب', startCh: '⚔️ ابدأ', needTwo: 'أضف لاعبين على الأقل.',
    chalTurnKicker: 'دورك', chalBullet1: 'نفس اللوح للجميع — الأقل حركات يفوز', chalBullet2: 'اضغط ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`, goReady: 'ابدأ', chalMeta: (lbl, c) => `${lbl} · ${c} ألوان`,
    chalResTitle: 'نتائج مرّر والعب', chalResDetail: (m, solv) => (solv ? `${m} حركة` : 'لم يُحل'), newCh: 'لعبة جديدة',
  },
};

const LIVES = 3;
const PROFILE_KEY = 'mm_hanoi_v1';
function loadProfile() { try { const j = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}'); return { done: j.done || {}, best: j.best || 0 }; } catch { return { done: {}, best: 0 }; } }
function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch { /* ignore */ } }
const clonePegs = (pegs) => pegs.map((p) => p.slice());

function ReasoningModes({ t, isAr, onFree, onLevels, onChallenge, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.freeHint, on: onFree, mod: 'ct-fq-attn-mode--free' },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.levelsHint, on: onLevels, mod: 'ct-fq-attn-mode--levels' },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.chalHint, on: onChallenge, mod: 'ct-fq-attn-mode--chal' },
  ];
  return <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />;
}

/** A tube holding uniform-width colour+number tokens (Ball-Sort style). */
function Peg({ pegIdx, disks, cap, sel, bad, onTap }) {
  const slots = Math.max(cap, disks.length);
  return (
    <button type="button" className={`ct-cs-peg${sel ? ' ct-cs-peg--sel' : ''}${bad ? ' ct-cs-peg--bad' : ''}`}
      onPointerDown={(e) => { e.preventDefault(); onTap(pegIdx); }} aria-label={`tube ${pegIdx + 1}`}
      style={{ '--cs-slots': slots }}>
      <span className="ct-cs-tube">
        {disks.map((d, i) => {
          const isTop = i === disks.length - 1;
          return (
            <span key={i} className={`ct-cs-tok${sel && isTop ? ' ct-cs-tok--lift' : ''}`}
              style={{ background: SORT_COLORS[d.c % SORT_COLORS.length] }}>{d.s}</span>
          );
        })}
      </span>
    </button>
  );
}

export default function ColourSortGame({ onBack, workoutMode = false }) {
  const { playSfx, currentLang, awardFreeRun, awardTrainingWin } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const juice = useJuice();
  const { openTutorial, replayHint: tutReplayHint, layer: tutLayer } = useTrainingTutorialHost('tower-hanoi', isAr, playSfx);

  const DM = useMemo(() => ({
    easy: { label: t.diffEasy, pop: t.popEasy, lvc: 'fq-lve' },
    medium: { label: t.diffMedium, pop: t.popMedium, lvc: 'fq-lvm' },
    hard: { label: t.diffHard, pop: t.popHard, lvc: 'fq-lvh' },
  }), [t]);

  const [phase, setPhase] = useState('hub');
  const [puz, setPuz] = useState(null); // { pegs, moves, C, M, P, par }
  const [sel, setSel] = useState(null);
  const [bad, setBad] = useState(null);
  const [badHint, setBadHint] = useState('');
  const [diffKey, setDiffKey] = useState('easy');
  const [profile, setProfile] = useState(() => loadProfile());

  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [quitOpen, setQuitOpen] = useState(false);

  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalDiff, setChalDiff] = useState('medium');

  const blockRef = useRef(null);
  const puzRef = useRef(null);
  const initialRef = useRef(null);
  const parRef = useRef(0);
  const historyRef = useRef([]);
  const livesRef = useRef(LIVES);
  const scoreRef = useRef(0);
  const solvedRef = useRef(0);
  const peakRef = useRef(0);
  const staircaseRef = useRef(null);
  const trialLogRef = useRef(null);
  const lockRef = useRef(false);
  const advanceRef = useRef(0);
  const badTimer = useRef(0);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalSeedRef = useRef(0);
  const workoutLaunched = useRef(false);

  const clearTimers = () => { if (advanceRef.current) clearTimeout(advanceRef.current); advanceRef.current = 0; if (badTimer.current) clearTimeout(badTimer.current); };
  useEffect(() => () => { clearTimers(); trialLogRef.current?.discard(); }, []);
  useEffect(() => { chalNamesRef.current = chalNames; }, [chalNames]);

  const persistDone = useCallback((diff, lv) => {
    setProfile((prev) => { const next = { ...prev, done: { ...prev.done, [`${diff}-${lv}`]: true } }; saveProfile(next); return next; });
  }, []);
  const flashBad = useCallback((peg, reason) => {
    setBad(peg);
    const hints = isAr ? {
      full: 'الأنبوب ممتلئ', colour: 'نفس اللون فقط', size: 'قرص أصغر فوق أكبر', empty: 'لا يوجد قرص', same: '',
    } : {
      full: 'Tube is full', colour: 'Same colour only', size: 'Smaller disk on larger', empty: 'No disk to move', same: '',
    };
    setBadHint(hints[reason] || '');
    if (badTimer.current) clearTimeout(badTimer.current);
    badTimer.current = setTimeout(() => { setBad(null); setBadHint(''); }, 1200);
  }, [isAr]);

  const loadPuzzle = useCallback((gen) => {
    puzRef.current = gen; setPuz(gen);
    initialRef.current = clonePegs(gen.initial); parRef.current = gen.par;
    historyRef.current = []; setSel(null); lockRef.current = false;
  }, []);

  /* ── run enders ── */
  const endFree = useCallback(() => {
    clearTimers(); playSfx('error');
    trialLogRef.current?.finish({ score: scoreRef.current, solved: solvedRef.current, level: peakRef.current });
    trialLogRef.current = null;
    awardFreeRun('hanoi', peakRef.current);
    setProfile((prev) => { if (scoreRef.current <= (prev.best || 0)) return prev; const next = { ...prev, best: scoreRef.current }; saveProfile(next); return next; });
    setLastResult({ type: 'free', score: scoreRef.current, solved: solvedRef.current });
    blockRef.current = null; setPhase('freeRes');
  }, [playSfx, awardFreeRun]);

  const finishLevel = useCallback((p) => {
    const block = blockRef.current;
    const grade = gradeColourSort(p.moves, parRef.current, true);
    trialLogRef.current?.trial({ ok: true, moves: p.moves, par: parRef.current });
    trialLogRef.current?.finish({ score: grade.score, won: true, moves: p.moves });
    trialLogRef.current = null;
    playSfx('win'); persistDone(block.diff, block.lv); awardTrainingWin('hanoi', block.diff, block.lv, CS_LEVELS_PER_TIER);
    setLastResult({ type: 'level', block, grade });
    blockRef.current = null; setPhase('res');
  }, [playSfx, persistDone, awardTrainingWin]);

  const finishChallenge = useCallback((p) => {
    const idx = chalIdxRef.current; const names = chalNamesRef.current;
    const base = [...chalScoresRef.current];
    base[idx] = { nm: names[idx], moves: p.moves, solved: true, score: colourSortChallengeScore(p.moves, parRef.current, true) };
    chalScoresRef.current = base; setChalScores(base);
    playSfx('win');
    const nextIdx = idx + 1; blockRef.current = null;
    if (nextIdx < names.length) { setChalIdx(nextIdx); chalIdxRef.current = nextIdx; setChalTurnOpen(true); setPhase('play'); }
    else { setLastResult({ type: 'challenge', rows: base }); setPhase('chalRes'); }
  }, [playSfx]);

  const onSolve = useCallback((p) => {
    lockRef.current = true;
    const mode = blockRef.current?.mode;
    juice.hit({}); juice.celebrate();
    if (mode === 'free') {
      playSfx('win');
      scoreRef.current += Math.max(5, colourSortChallengeScore(p.moves, parRef.current, true)); setScore(scoreRef.current);
      solvedRef.current += 1; setSolved(solvedRef.current);
      trialLogRef.current?.trial({ ok: true, moves: p.moves, par: parRef.current });
      staircaseRef.current?.success();
      peakRef.current = Math.max(peakRef.current, (staircaseRef.current?.level ?? 0) + 1);
      advanceRef.current = setTimeout(() => loadPuzzle(generateColourSort(colourSortFreeSpec(staircaseRef.current?.level ?? 0))), 700);
      return;
    }
    if (mode === 'level') { advanceRef.current = setTimeout(() => finishLevel(p), 600); return; }
    if (mode === 'challenge') { advanceRef.current = setTimeout(() => finishChallenge(p), 600); }
  }, [juice, playSfx, loadPuzzle, finishLevel, finishChallenge]);

  /* ── interactions ── */
  const onPeg = useCallback((p) => {
    if (lockRef.current || !puz) return;
    if (sel == null) { if (puz.pegs[p].length) { setSel(p); playSfx('click'); } return; }
    if (p === sel) { setSel(null); return; }
    if (!canMove(puz.pegs, sel, p, puz.cap)) { playSfx('error'); juice.miss(); flashBad(p, moveRejectReason(puz.pegs, sel, p, puz.cap)); setSel(null); return; }
    historyRef.current.push({ pegs: clonePegs(puz.pegs), moves: puz.moves });
    const res = applyMove(puz, sel, p);
    puzRef.current = res.state; setPuz(res.state); setSel(null); playSfx('click');
    if (isSolved(res.state.pegs)) onSolve(res.state);
  }, [puz, sel, playSfx, juice, flashBad, onSolve]);

  const undo = useCallback(() => {
    if (lockRef.current || !historyRef.current.length) return;
    const prev = historyRef.current.pop();
    const next = { ...puzRef.current, pegs: prev.pegs, moves: prev.moves };
    puzRef.current = next; setPuz(next); setSel(null); playSfx('click');
  }, [playSfx]);

  const resetPuzzle = useCallback(() => {
    if (lockRef.current) return;
    const next = { ...puzRef.current, pegs: clonePegs(initialRef.current), moves: 0 };
    puzRef.current = next; setPuz(next); historyRef.current = []; setSel(null); playSfx('click');
  }, [playSfx]);

  const skipPuzzle = useCallback(() => {
    if (lockRef.current || blockRef.current?.mode !== 'free') return;
    playSfx('error'); juice.miss();
    staircaseRef.current?.failure();
    livesRef.current -= 1; setLives(livesRef.current);
    if (livesRef.current <= 0) { endFree(); return; }
    loadPuzzle(generateColourSort(colourSortFreeSpec(staircaseRef.current?.level ?? 0)));
  }, [playSfx, juice, endFree, loadPuzzle]);

  /* ── starters ── */
  const startFree = useCallback(() => {
    clearTimers();
    staircaseRef.current = createStaircase({ nDown: 2, max: 20 });
    peakRef.current = 0; livesRef.current = LIVES; scoreRef.current = 0; solvedRef.current = 0;
    setLives(LIVES); setScore(0); setSolved(0);
    juice.reset();
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'tower-hanoi', mode: workoutMode ? 'workout' : 'free' });
    blockRef.current = { mode: 'free' };
    setPhase('play'); loadPuzzle(generateColourSort(colourSortFreeSpec(0)));
  }, [juice, workoutMode, loadPuzzle]);

  const startLevel = useCallback((diff, lv) => {
    clearTimers();
    const spec = colourSortLevelSpec(diff, lv);
    juice.reset();
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'tower-hanoi', mode: workoutMode ? 'workout' : 'level', meta: { diff, lv } });
    blockRef.current = { mode: 'level', diff, lv, spec };
    setPhase('play'); loadPuzzle(generateColourSort({ ...spec, seed: (Math.random() * 1e9) | 0 }));
  }, [juice, workoutMode, loadPuzzle]);

  const startChallengeBlock = useCallback(() => {
    clearTimers(); setChalTurnOpen(false);
    const spec = colourSortChallengeSpec(chalDiff);
    juice.reset();
    trialLogRef.current?.discard(); trialLogRef.current = null;
    blockRef.current = { mode: 'challenge', diff: chalDiff, spec };
    setPhase('play'); loadPuzzle(generateColourSort({ ...spec, seed: chalSeedRef.current }));
  }, [juice, chalDiff, loadPuzzle]);

  const openChallenge = useCallback(() => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) { window.alert(t.needTwo); return; }
    setChalNames(names); chalNamesRef.current = names;
    chalScoresRef.current = []; setChalScores([]);
    chalIdxRef.current = 0; setChalIdx(0);
    chalSeedRef.current = (Math.random() * 1e9) | 0;
    setChalTurnOpen(true); setPhase('play');
  }, [chalNames, t.needTwo]);

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
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar onBack={onBack} playSfx={playSfx} hubSpaced variant="paper"
              onReplayTutorial={openTutorial} replayHint={tutReplayHint}
              center={<div className="ct-fq-hub-attn-head"><div className="ct-fq-hub-attn-big">{t.title}</div><div className="ct-fq-hub-attn-sub">{t.tag}</div></div>} />
            <ReasoningModes t={t} isAr={isAr} playSfx={playSfx}
              onFree={() => setPhase('freeIntro')}
              onLevels={() => setPhase('diff')}
              onChallenge={() => setPhase('chal')} />
            <HubScienceLink gameId="tower-hanoi" isAr={isAr} playSfx={playSfx} />
          </div>
        </div>
        {tutLayer}
      </div>
    );
  }

  if (phase === 'freeIntro') {
    return <SurvivalIntro isAr={isAr} playSfx={playSfx} onReady={startFree} onBack={() => setPhase('hub')} />;
  }

  if (phase === 'diff') {
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <TrainingDifficultySelect isAr={isAr} playSfx={playSfx} onBack={() => setPhase('hub')}
          title={t.pickDiff} blurb={t.pickDiffSub} diffKeys={CS_DIFF_KEYS} dm={DM} descs={t.diffDesc}
          onPick={(k) => { setDiffKey(k); setPhase('levels'); }} />
      </div>
    );
  }

  if (phase === 'levels') {
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <TrainingLevelGrid isAr={isAr} playSfx={playSfx} onBack={() => setPhase('diff')}
          title={DM[diffKey].label} blurb={t.levelsSub(DM[diffKey].pop)} count={CS_LEVELS_PER_TIER} lvc={DM[diffKey].lvc}
          isUnlocked={(lv) => isColourSortLevelUnlocked(diffKey, lv, profile.done)}
          isDone={(lv) => !!profile.done[`${diffKey}-${lv}`]}
          sublabel={(lv) => `${colourSortLevelSpec(diffKey, lv).colours}🎨`}
          onPick={(lv) => startLevel(diffKey, lv)} />
      </div>
    );
  }

  if (phase === 'chal') {
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper" />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.chalSub}
              diffKeys={CS_DIFF_KEYS}
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

  if (phase === 'freeRes' && lastResult?.type === 'free') {
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('hub'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.over}</div></div>} />
            <div className="ct-fq-sbig">{lastResult.score}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <p className="ct-fq-sub ct-fq-training-blurb" style={{ marginTop: 8 }}>{t.best(profile.best)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startFree(); }}>{t.again}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('hub'); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'res' && lastResult?.type === 'level') {
    const { block: lb, grade } = lastResult;
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('levels'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.levelPass}</div></div>} />
            <div style={{ textAlign: 'center', fontSize: '1.5rem', color: '#e8ac4e', marginTop: 8, fontWeight: 700 }}>{'★'.repeat(grade.stars)}{'☆'.repeat(3 - grade.stars)} <span style={{ fontSize: '0.85rem', color: '#5c534c' }}>{starLabel}</span></div>
            <div className={`ct-fq-sbig ct-fq-band-text-${grade.score >= 75 ? 'high' : grade.score >= 50 ? 'mid' : 'low'}`}>{grade.score}</div>
            <div className="ct-fq-ies-lbl">{t.moves}: {grade.moves} · {t.par} {grade.par}</div>
            <div className="ct-fq-row" style={{ marginTop: 12 }}>
              {lb.lv < CS_LEVELS_PER_TIER && <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); setLastResult(null); startLevel(lb.diff, lb.lv + 1); }}>{t.nextLv}</button>}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { playSfx('click'); setLastResult(null); startLevel(lb.diff, lb.lv); }}>{t.retry}</button>
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('levels'); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'chalRes' && lastResult?.type === 'challenge') {
    const rows = [...lastResult.rows].sort((a, b) => (b.score - a.score) || (a.moves - b.moves));
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('hub'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.chalResTitle}</div></div>} />
            {rows.map((row, i) => (
              <div key={row.nm + i} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div><div className="ct-fq-lbnm">{row.nm}</div><div className="ct-fq-lbdt">{t.chalResDetail(row.moves, row.solved)}</div></div>
                <div className="ct-fq-lbsc">{row.score}</div>
              </div>
            ))}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { setLastResult(null); setPhase('chal'); }}>{t.newCh}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('hub'); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx]) {
    return (
      <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
        <TrainingChallengeHandoff isAr={isAr} kicker={t.chalTurnKicker} playerName={chalNames[chalIdx]}
          metaLine={t.chalMeta(DM[chalDiff].label, colourSortChallengeSpec(chalDiff).colours)}
          instruction={t.handTo(chalNames[chalIdx])} bullets={[t.chalBullet1, t.chalBullet2]}
          startLabel={t.goReady} onStart={startChallengeBlock} playSfx={playSfx} />
      </div>
    );
  }

  /* ── Play ── */
  const P = puz?.P || 4;
  return (
    <div className="cancellation-task-game ct-th-root" dir={isAr ? 'rtl' : 'ltr'}>
      <TrainingPlayHeader isAr={isAr} title={t.title} subtitle="" playSfx={playSfx}
        onMenu={() => setQuitOpen(true)} />
      <div className="ct-cs-play ct-juice-host">
        <JuiceLayer toast={juice.toast} burst={juice.burst} />
        <div className="ct-cs-hud">
          {block?.mode === 'free' && <span className="ct-cs-hud-stat ct-fq-lives" aria-label={`${lives} ${t.lives}`}>{'♥'.repeat(Math.max(0, lives))}<span className="ct-fq-lives-spent">{'♥'.repeat(Math.max(0, LIVES - lives))}</span></span>}
          <span className="ct-cs-hud-stat">{t.moves} {puz?.moves ?? 0}</span>
          {parRef.current > 0 && <span className="ct-cs-hud-stat">{t.par} {parRef.current}</span>}
          {block?.mode === 'free' && <span className="ct-cs-hud-stat">{t.score} {score}</span>}
        </div>

        <div className={`ct-cs-board ct-cs-board--p${P}`} style={{ gridTemplateColumns: `repeat(${P}, 1fr)` }}>
          {puz?.pegs.map((disks, p) => (
            <Peg key={p} pegIdx={p} disks={disks} cap={puz.cap} sel={sel === p} bad={bad === p} onTap={onPeg} />
          ))}
        </div>

        <div className="ct-cs-tools">
          <button type="button" className="ct-cs-tool" disabled={!historyRef.current.length} onClick={undo}>{t.undo}</button>
          <button type="button" className="ct-cs-tool" onClick={resetPuzzle}>{t.reset}</button>
          {block?.mode === 'free' && <button type="button" className="ct-cs-tool ct-cs-tool--warn" onClick={skipPuzzle}>{t.skip}</button>}
        </div>
        <p className="ct-cs-prompt">{badHint || t.prompt}</p>
      </div>

      <TrainingQuitModal open={quitOpen} labels={{ quitQ: t.quitQ, quitLose: t.quitLose, yesQuit: t.yesQuit, keep: t.keep }}
        onConfirmQuit={quitToMenu} onKeepPlaying={() => setQuitOpen(false)} />
    </div>
  );
}
