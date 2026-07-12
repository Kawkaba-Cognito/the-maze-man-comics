import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import { TrainingMenuBar, TrainingPlayHeader, TrainingChallengeHandoff } from '../../../../shared/TrainingChrome';
import { TrainingDifficultySelect, TrainingLevelGrid } from '../../../../shared/TrainingScreens';
import SurvivalIntro from '../../../../shared/SurvivalIntro';
import PassPlaySetup from '../../../../shared/PassPlaySetup';
import { useTrainingTutorialHost } from '../../../../shared/tutorials/useTrainingTutorialHost';
import { createTrialLog } from '../../../../shared/trialLog';
import AssessmentReady from '../../../../assessment/AssessmentReady';
import MemoObject from '../memo-span/MemoObject';
import { memoTip } from '../memo-span/MemoSciencePanel';
import NBackModes from './NBackModes';
import {
  NB_LEVELS_PER_TIER, NB_DIFF_KEYS, NB_DM, NB_GRID, NB_PASS_ACC,
  specForLevel, prepareLevelBlock, prepareFreeBlock, prepareAssessBlock, prepareChallengeSeed, prepareChallengeBlock,
  gradeBlock, starsForNBack, adaptiveNextN, isNbackLevelUnlocked, nbLevelKey,
  nbStreams, emptyNbStats, nbBestN, nbSetBestN,
  loadNbackProfile, saveNbackProfile, mergeNbackChallengeRow, compareNbackChallengeRows,
} from './nbackData';

const ASSESS_MAX_BLOCKS = 5;

const UI = {
  en: {
    hub: 'N-Back', tag: 'working memory', replayTutorial: 'How to play',
    freeMode: 'Survival mode', levelMode: 'Level mode', challengeMode: 'Pass n Play',
    scienceLink: '🔬 Why this trains your brain', hubMapAria: 'Modes',
    hubNodeFreeHint: 'Adaptive — N rises with your accuracy',
    hubNodeLevelsHint: '100 levels · fixed N, faster pace',
    hubNodeChallengeHint: 'Same stream for all · pick a difficulty',
    pickDiff: 'Choose difficulty', pickDiffSub: 'Tap PLACE or OBJECT when that stream repeats from N steps back.',
    diffDesc: { easy: '1–2 back · slower pace.', medium: '2–3 back · medium pace.', hard: '3–4 back · fast pace.' },
    levelsSub: (pop) => `${pop} · ${NB_LEVELS_PER_TIER} levels`,
    levelHeader: (diff, lv) => `${NB_DM[diff]?.label ?? diff} · L${lv}`,
    nBadge: (n) => `${n}-back`,
    matchObj: 'OBJECT', matchPos: 'PLACE', promptDual: 'Repeat from N back?',
    dualNote: 'Dual N-Back — track the place AND the object at the same time.',
    dprimeObj: 'd′ object', dprimePos: 'd′ place',
    getReady: 'Get ready…', trial: (i, tot) => `${i} / ${tot}`,
    resultsPass: 'Level passed!', resultsFail: 'Not quite — try again',
    accuracy: 'Accuracy', dprime: 'd′', hits: 'Hits', misses: 'Misses', false: 'False taps', stars: 'Stars',
    nextLv: 'Next level', retry: 'Retry', menu: 'Menu', again: 'Play again',
    freeTitle: 'Survival mode', blockDone: 'Block complete', nextN: (n) => `Continue · ${n}-back ›`,
    best: (n) => `Best: ${n}-back`,
    readyN: (n) => `${n}-back`,
    popKick: { up: 'Level up!', down: 'Easing off', hold: 'Next round' },
    popSub: { up: 'You aced it — one step harder.', down: 'Let’s drop back a step.', hold: 'Keep your streak going.' },
    popAcc: (a) => `Last round: ${a}%`, popCont: (n) => `Continue · ${n}-back ›`, popEnd: 'End run',
    challengeTitle: 'Pass n Play', challengeSub: 'Same object stream for everyone · pass the device',
    chalPickDiff: 'Difficulty', players: 'Players (2–10)', addPl: '＋ Add player', startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.', chalRounds: 'Rounds', chalRoundsHint: 'Each player plays once per round',
    roundNofM: (n, m) => `Round ${n}/${m}`, chalTurnKicker: 'Your turn', chalBulletSame: 'Same stream this round',
    chalBulletPass: 'Start only when this player has the device', handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start', chalMeta: (label, n) => `${label} · ${n}-back`, resultsChalTitle: 'Pass n Play results',
    chalResDetail: (acc, d) => `${acc}% · d′ ${d}`, newCh: 'New game',
  },
  ar: {
    hub: 'العودة-N', tag: 'ذاكرة عاملة', replayTutorial: 'كيف ألعب',
    freeMode: 'وضع البقاء', levelMode: 'وضع المستويات', challengeMode: 'مرّر والعب',
    scienceLink: '🔬 لماذا يدرّب دماغك', hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'تكيّفي — يرتفع N مع دقّتك',
    hubNodeLevelsHint: '١٠٠ مستوى · N ثابت وإيقاع أسرع',
    hubNodeChallengeHint: 'نفس التدفّق للجميع · اختر الصعوبة',
    pickDiff: 'اختر الصعوبة', pickDiffSub: 'اضغط «المكان» أو «الشيء» عندما يتكرّر ذلك التدفّق من قبل N خطوات.',
    diffDesc: { easy: '١–٢ عودة · إيقاع أبطأ.', medium: '٢–٣ عودة · إيقاع متوسط.', hard: '٣–٤ عودة · إيقاع سريع.' },
    levelsSub: (pop) => `${pop} · ${NB_LEVELS_PER_TIER} مستوى`,
    levelHeader: (diff, lv) => `${NB_DM[diff]?.label ?? diff} · ${lv}`,
    nBadge: (n) => `${n}-عودة`,
    matchObj: 'الشيء', matchPos: 'المكان', promptDual: 'تكرّر قبل N؟',
    dualNote: 'العودة-N المزدوجة — تابع المكان والشيء في آنٍ واحد.',
    dprimeObj: 'd′ شيء', dprimePos: 'd′ مكان',
    getReady: 'استعد…', trial: (i, tot) => `${i} / ${tot}`,
    resultsPass: 'اجتزت المستوى!', resultsFail: 'ليس بعد — حاول مجدداً',
    accuracy: 'الدقّة', dprime: 'd′', hits: 'إصابات', misses: 'فوات', false: 'ضغطات خاطئة', stars: 'نجوم',
    nextLv: 'المستوى التالي', retry: 'إعادة', menu: 'القائمة', again: 'العب مجدداً',
    freeTitle: 'وضع البقاء', blockDone: 'انتهت الجولة', nextN: (n) => `متابعة · ${n}-عودة ›`,
    best: (n) => `الأفضل: ${n}-عودة`,
    readyN: (n) => `${n}-عودة`,
    popKick: { up: 'ترقية!', down: 'تخفيف', hold: 'الجولة التالية' },
    popSub: { up: 'أتقنتها — درجة أصعب.', down: 'لنعُد خطوة إلى الوراء.', hold: 'واصل سلسلتك.' },
    popAcc: (a) => `الجولة السابقة: ${a}%`, popCont: (n) => `متابعة · ${n}-عودة ›`, popEnd: 'إنهاء',
    challengeTitle: 'مرّر والعب', challengeSub: 'نفس التدفّق للجميع · مرّر الجهاز',
    chalPickDiff: 'الصعوبة', players: 'اللاعبون (2–10)', addPl: '＋ إضافة لاعب', startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.', chalRounds: 'الجولات', chalRoundsHint: 'كل لاعب يلعب مرة في الجولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`, chalTurnKicker: 'دورك', chalBulletSame: 'نفس التدفّق في هذه الجولة',
    chalBulletPass: 'ابدأ فقط عندما يكون الجهاز مع هذا اللاعب', handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ', chalMeta: (label, n) => `${label} · ${n}-عودة`, resultsChalTitle: 'نتائج مرّر والعب',
    chalResDetail: (acc, d) => `${acc}% · d′ ${d}`, newCh: 'لعبة جديدة',
  },
};

const STEP_GET_READY_MS = 800;
const rngSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

export default function NBackGame({
  onBack, assessmentMode = false, onAssessmentComplete, onAssessmentExit,
  assessmentLabel, assessmentStep, assessmentDomainId = 'memory',
}) {
  const { playSfx, currentLang, awardTrainingWin, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;
  const { openTutorial, replayHint: tutReplayHint, layer: tutLayer } = useTrainingTutorialHost('nback', isAr, playSfx);

  const [profile, setProfile] = useState(() => loadNbackProfile());
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const variant = 'dual'; // single professional game: dual n-back (position + object)
  const [diffKey, setDiffKey] = useState('easy');
  const [block, setBlock] = useState(null);
  const [playStep, setPlayStep] = useState('idle'); // 'ready' | 'run'
  const [cur, setCur] = useState(null); // { obj, pos }
  const [showStim, setShowStim] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [resp, setResp] = useState({ obj: false, pos: false });
  const [feedback, setFeedback] = useState({ obj: null, pos: null });
  const [result, setResult] = useState(null);
  const [levelInfo, setLevelInfo] = useState(null); // survival between-block popup: { dir, prevN, nextN, acc }

  // challenge
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('medium');

  const blockRef = useRef(null);
  const idxRef = useRef(-1);
  const respRef = useRef({ obj: false, pos: false });
  const statsRef = useRef(emptyNbStats());
  const timersRef = useRef([]);
  const trialLogRef = useRef(null);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalCycleRef = useRef(0);
  const chalRoundsTotalRef = useRef(1);
  const chalDiffRef = useRef('medium');
  const beginBlockRef = useRef(null);
  // Assessment run state: a short, fixed-length series of blocks that adapts N
  // the same way Survival does, tracking the highest N cleared at NB_PASS_ACC.
  const assessRef = useRef(null);

  const doneMap = profile.done || {};

  const clearTimers = useCallback(() => { timersRef.current.forEach((id) => clearTimeout(id)); timersRef.current = []; }, []);
  useEffect(() => () => { clearTimers(); trialLogRef.current?.discard(); }, [clearTimers]);
  useEffect(() => { chalIdxRef.current = chalIdx; }, [chalIdx]);
  useEffect(() => { chalNamesRef.current = chalNames; }, [chalNames]);

  const scoreTrial = useCallback((i) => {
    const b = blockRef.current; if (!b) return;
    const n = b.spec.n;
    if (i < n) return;
    const streams = nbStreams(b.spec.variant);
    const s = statsRef.current;
    const r = respRef.current;
    const step = b.seq[i]; const prior = b.seq[i - n];
    const log = { n, variant: b.spec.variant };
    streams.forEach((k) => {
      const isTarget = step[k] === prior[k];
      const did = r[k];
      const ss = s[k];
      if (isTarget) (did ? ss.hit++ : ss.miss++); else (did ? ss.fa++ : ss.cr++);
      log[k] = { target: isTarget, resp: did, ok: isTarget === did };
    });
    trialLogRef.current?.trial(log);
  }, []);

  const finishBlock = useCallback(() => {
    clearTimers();
    const b = blockRef.current; if (!b) return;
    const grade = gradeBlock(statsRef.current, b.spec.variant);
    const n = b.spec.n;
    const vr = b.spec.variant;

    if (b.mode === 'assess') {
      const a = assessRef.current;
      if (!a) return;
      if (grade.acc >= NB_PASS_ACC) a.bestGoodN = Math.max(a.bestGoodN, n);
      a.blocksRun += 1;
      const nextN = adaptiveNextN(n, grade.acc);
      if (a.blocksRun < ASSESS_MAX_BLOCKS) {
        setBlock(null); blockRef.current = null; setPlayStep('idle');
        beginBlockRef.current(prepareAssessBlock(nextN, rngSeed(), variant));
        return;
      }
      const score = Math.round(Math.max(0, Math.min(1, (a.bestGoodN - 1) / 5)) * 100);
      const line = a.bestGoodN > 0
        ? (isAr ? `أعلى مستوى موثوق: ${t.nBadge(a.bestGoodN)}` : `sustained ${t.nBadge(a.bestGoodN)} reliably`)
        : (isAr ? `دون ١-عودة بدقّة موثوقة` : `below 1-back reliably`);
      trialLogRef.current?.finish({ score, bestN: a.bestGoodN }); trialLogRef.current = null;
      setBlock(null); blockRef.current = null; setPlayStep('idle');
      onAssessmentComplete?.({ score, line });
      return;
    }

    if (b.mode === 'challenge') {
      const i = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      base[i] = mergeNbackChallengeRow(base[i], grade, names[i]);
      chalScoresRef.current = base; setChalScores(base);
      trialLogRef.current?.finish({ score: grade.acc, n }); trialLogRef.current = null;
      setBlock(null); blockRef.current = null; setPlayStep('idle');
      if (i + 1 < names.length) { setChalIdx(i + 1); chalIdxRef.current = i + 1; setChalTurnOpen(true); return; }
      const cycle = chalCycleRef.current;
      if (cycle + 1 < chalRoundsTotalRef.current) {
        chalCycleRef.current = cycle + 1; setChalRoundIdx(cycle + 1);
        setChalSeed(prepareChallengeSeed(chalDiffRef.current, vr));
        setChalIdx(0); chalIdxRef.current = 0; setChalTurnOpen(true); return;
      }
      setResult({ type: 'challenge', rows: [...base].sort(compareNbackChallengeRows) });
      setPhase('chalRes'); return;
    }

    if (b.mode === 'free') {
      trialLogRef.current?.finish({ score: grade.acc, n }); trialLogRef.current = null;
      awardFreeRun?.('nback', Math.max(0, n - 1));
      const nextN = adaptiveNextN(n, grade.acc);
      playSfx?.(nextN > n ? 'win' : 'click');
      if (grade.acc >= 70) setProfile((prev) => {
        const cur = nbBestN(prev, vr);
        if (n <= cur) return prev;
        const nx = { ...prev, bestN: nbSetBestN(prev, vr, n) }; saveNbackProfile(nx); return nx;
      });
      setBlock(null); blockRef.current = null; setPlayStep('idle');
      setLevelInfo({ dir: nextN > n ? 'up' : nextN < n ? 'down' : 'hold', prevN: n, nextN, acc: grade.acc });
      return;
    }

    // level
    const won = grade.acc >= NB_PASS_ACC;
    const stars = starsForNBack(grade.acc);
    trialLogRef.current?.finish({ won, score: grade.acc, n }); trialLogRef.current = null;
    if (won) {
      awardTrainingWin('nback', b.spec.diff, b.spec.lv, NB_LEVELS_PER_TIER);
      setProfile((prev) => { const nx = { ...prev, done: { ...(prev.done || {}), [nbLevelKey(vr, b.spec.diff, b.spec.lv)]: true } }; saveNbackProfile(nx); return nx; });
    }
    setResult({ type: 'level', won, stars, ...grade, n, diff: b.spec.diff, lv: b.spec.lv });
    setBlock(null); blockRef.current = null; setPlayStep('idle'); setPhase('res');
  }, [awardFreeRun, awardTrainingWin, clearTimers, playSfx, onAssessmentComplete, isAr, t, variant]);

  const runTrial = useCallback((i) => {
    const b = blockRef.current; if (!b) return;
    if (i >= b.seq.length) { finishBlock(); return; }
    idxRef.current = i; setIdx(i);
    respRef.current = { obj: false, pos: false }; setResp({ obj: false, pos: false }); setFeedback({ obj: null, pos: null });
    setCur(b.seq[i]); setShowStim(true);
    timersRef.current.push(setTimeout(() => setShowStim(false), b.spec.stimMs));
    timersRef.current.push(setTimeout(() => { scoreTrial(i); runTrial(i + 1); }, b.spec.stimMs + b.spec.isiMs));
  }, [finishBlock, scoreTrial]);

  const beginBlock = useCallback((b) => {
    clearTimers();
    blockRef.current = b; setBlock(b);
    statsRef.current = emptyNbStats();
    idxRef.current = -1; setIdx(-1); setCur(null); setShowStim(false);
    respRef.current = { obj: false, pos: false }; setResp({ obj: false, pos: false }); setFeedback({ obj: null, pos: null });
    // Assessment blocks share ONE trialLog across the whole adaptive run
    // (created once in startAssessment) so all blocks' trials are kept, not
    // just the last one — every other mode logs one block at a time.
    if (b.mode !== 'assess') {
      trialLogRef.current?.discard();
      trialLogRef.current = createTrialLog({ game: 'nback', mode: b.mode, meta: { n: b.spec.n, diff: b.spec.diff, lv: b.spec.lv, variant: b.spec.variant } });
    }
    setResult(null); setPhase('play'); setPlayStep('ready');
    timersRef.current.push(setTimeout(() => { setPlayStep('run'); runTrial(0); }, STEP_GET_READY_MS));
  }, [clearTimers, runTrial]);
  useEffect(() => { beginBlockRef.current = beginBlock; }, [beginBlock]);

  const onRespond = useCallback((stream) => {
    if (playStep !== 'run' || idxRef.current < 0) return;
    const b = blockRef.current; if (!b) return;
    if (!nbStreams(b.spec.variant).includes(stream)) return;
    if (respRef.current[stream]) return;
    respRef.current = { ...respRef.current, [stream]: true };
    setResp((p) => ({ ...p, [stream]: true }));
    const i = idxRef.current; const n = b.spec.n;
    const isTarget = i >= n && b.seq[i][stream] === b.seq[i - n][stream];
    setFeedback((p) => ({ ...p, [stream]: isTarget ? 'good' : 'bad' }));
    playSfx(isTarget ? 'correct' : 'wrong');
  }, [playStep, playSfx]);

  const quitPlay = useCallback(() => {
    const mode = blockRef.current?.mode; // capture before clearing the ref
    clearTimers(); trialLogRef.current?.discard(); trialLogRef.current = null;
    setBlock(null); blockRef.current = null; setPlayStep('idle');
    if (mode === 'assess') { (onAssessmentExit || onBack)?.(); return; }
    if (mode === 'challenge') setPhase('chal'); else if (mode === 'level') setPhase('levels'); else setPhase('hub');
  }, [clearTimers, onAssessmentExit, onBack]);

  const startLevel = (diff, lv) => beginBlock(prepareLevelBlock(diff, lv, rngSeed(), variant));
  const startFree = (n) => beginBlock(prepareFreeBlock(n, rngSeed(), variant));
  const startAssessment = () => {
    assessRef.current = { blocksRun: 0, bestGoodN: 0 };
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'nback', mode: 'assess' });
    beginBlock(prepareAssessBlock(1, rngSeed(), variant));
  };

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) { window.alert(t.needTwo); return; }
    setChalNames(names); chalNamesRef.current = names;
    chalRoundsTotalRef.current = chalRoundsTotal; chalDiffRef.current = chalDiff; chalCycleRef.current = 0;
    setChalRoundIdx(0); setChalSeed(prepareChallengeSeed(chalDiff, variant)); setChalIdx(0); chalIdxRef.current = 0;
    chalScoresRef.current = names.map((nm) => ({ nm, rounds: [], avgAcc: 0 })); setChalScores(chalScoresRef.current);
    setChalTurnOpen(true); setPhase('play'); setPlayStep('idle'); setBlock(null);
  };
  const startChallengeBlock = () => { if (!chalSeed) return; setChalTurnOpen(false); beginBlock(prepareChallengeBlock(chalSeed)); };

  const headerSub = () => {
    if (!block) return '';
    if (block.mode === 'challenge') return `${t.nBadge(block.spec.n)} · ${chalNames[chalIdx] ?? ''}`;
    return `${t.nBadge(block.spec.n)} · ${t.trial(Math.max(0, idx + 1), block.seq.length)}`;
  };

  return (
    <div className="cancellation-task-game ct-ms-root" dir={isAr ? 'rtl' : 'ltr'}>
      {phase === 'assessStart' && (
        <AssessmentReady
          isAr={isAr}
          label={assessmentLabel}
          step={assessmentStep}
          domainId={assessmentDomainId}
          onStart={startAssessment}
          onBack={onAssessmentExit || onBack}
          playSfx={playSfx}
        />
      )}
      {phase === 'hub' && (
        <>
          <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
            <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
              <TrainingMenuBar onBack={onBack} playSfx={playSfx} hubSpaced variant="paper"
                onReplayTutorial={openTutorial} replayHint={tutReplayHint}
                center={<div className="ct-fq-hub-attn-head"><div className="ct-fq-hub-attn-big ct-ms-hub-title">{t.hub}</div><div className="ct-fq-hub-attn-sub">{t.tag}</div></div>} />
              <NBackModes t={t} isAr={isAr} playSfx={playSfx}
                onFree={() => setPhase('freeIntro')}
                onLevels={() => setPhase('diff')}
                onChallenge={() => setPhase('chal')} />
            </div>
          </div>
          {tutLayer}
        </>
      )}

      {phase === 'freeIntro' && (
        <SurvivalIntro isAr={isAr} playSfx={playSfx} onReady={() => startFree(1)} onBack={() => setPhase('hub')} />
      )}

      {phase === 'diff' && (
        <TrainingDifficultySelect isAr={isAr} playSfx={playSfx} onBack={() => setPhase('hub')}
          title={t.pickDiff} blurb={t.pickDiffSub} diffKeys={NB_DIFF_KEYS} dm={NB_DM} descs={t.diffDesc}
          onPick={(k) => { setDiffKey(k); setPhase('levels'); }} />
      )}

      {phase === 'levels' && (
        <TrainingLevelGrid isAr={isAr} playSfx={playSfx} onBack={() => setPhase('diff')}
          title={NB_DM[diffKey].label} blurb={t.levelsSub(NB_DM[diffKey].pop)} count={NB_LEVELS_PER_TIER} lvc={NB_DM[diffKey].lvc}
          isUnlocked={(lv) => isNbackLevelUnlocked(variant, diffKey, lv, doneMap)}
          isDone={(lv) => !!doneMap[nbLevelKey(variant, diffKey, lv)]}
          sublabel={(lv) => `${specForLevel(diffKey, lv, variant).n}-back`}
          onPick={(lv) => startLevel(diffKey, lv)} />
      )}

      {phase === 'chal' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper" />
            <PassPlaySetup
              isAr={isAr}
              playSfx={playSfx}
              subtitle={t.challengeSub}
              diffKeys={NB_DIFF_KEYS}
              diffLabels={NB_DM}
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

      {phase === 'play' && chalTurnOpen && !block && chalNames[chalIdx] && (
        <TrainingChallengeHandoff isAr={isAr} kicker={t.chalTurnKicker} playerName={chalNames[chalIdx]}
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={t.chalMeta(NB_DM[chalDiff]?.label ?? '', chalSeed?.spec?.n ?? 3)}
          instruction={t.handTo(chalNames[chalIdx])} bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady} onStart={startChallengeBlock} playSfx={playSfx} />
      )}

      {phase === 'play' && block && (
        <div className="ct-ms-play">
          <TrainingPlayHeader isAr={isAr} title={t.hub} subtitle={headerSub()} playSfx={playSfx} onMenu={quitPlay} onPause={null} />
          <div className="ct-nb-stage ct-nb-stage--dual">
            <div className="ct-nb-grid" aria-hidden="true">
              {Array.from({ length: NB_GRID }).map((_, ci) => {
                const on = playStep === 'run' && showStim && cur && cur.pos === ci;
                return (
                  <div key={ci} className={`ct-nb-cell${on ? ' ct-nb-cell--on' : ''}`}>
                    {on && cur ? <MemoObject objectId={cur.obj} isAr={isAr} size="sm" /> : null}
                  </div>
                );
              })}
            </div>
            <p className="ct-nb-prompt">{playStep === 'ready' ? `${t.readyN(block.spec.n)} · ${t.getReady}` : t.promptDual}</p>
            <div className="ct-nb-btnrow">
              <button type="button" className={`ct-nb-match ct-nb-match--pos${resp.pos ? ' ct-nb-match--done' : ''}${feedback.pos ? ` ct-nb-match--${feedback.pos}` : ''}`} onPointerDown={() => onRespond('pos')} disabled={resp.pos || playStep !== 'run'}>
                <span className="ct-nb-match-ic" aria-hidden="true">▦</span>{t.matchPos}
              </button>
              <button type="button" className={`ct-nb-match ct-nb-match--obj${resp.obj ? ' ct-nb-match--done' : ''}${feedback.obj ? ` ct-nb-match--${feedback.obj}` : ''}`} onPointerDown={() => onRespond('obj')} disabled={resp.obj || playStep !== 'run'}>
                <span className="ct-nb-match-ic" aria-hidden="true">◆</span>{t.matchObj}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'res' && result?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('levels')}
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{result.won ? t.resultsPass : t.resultsFail}</div></div>} />
            <div className="ct-fq-sbig">{result.acc}%</div>
            <div className="ct-fq-ies-lbl">{t.accuracy} · {t.nBadge(result.n)}</div>
            <div className="ct-fq-rm ct-fq-rm-training">
              {result.variant === 'dual' ? (
                <>
                  <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.dPrimeObj}</div><div className="ct-fq-rl">{t.dprimeObj}</div></div>
                  <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.dPrimePos}</div><div className="ct-fq-rl">{t.dprimePos}</div></div>
                </>
              ) : (
                <>
                  <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.dPrime}</div><div className="ct-fq-rl">{t.dprime}</div></div>
                  <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.miss}</div><div className="ct-fq-rl">{t.misses}</div></div>
                </>
              )}
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{result.hit}</div><div className="ct-fq-rl">{t.hits}</div></div>
              <div className="ct-fq-rmi"><div className="ct-fq-rv">{'★'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}</div><div className="ct-fq-rl">{t.stars}</div></div>
            </div>
            <p className="ct-ms-result-tip">{memoTip(isAr, result.stars + result.acc)}</p>
            <div className="ct-ms-result-actions">
              {!result.won && <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startLevel(result.diff, result.lv)}>{t.retry}</button>}
              {result.won && result.lv < NB_LEVELS_PER_TIER && <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startLevel(result.diff, result.lv + 1)}>{t.nextLv}</button>}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('levels')}>{t.menu}</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'chalRes' && result?.type === 'challenge' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div></div>} />
            {result.rows.map((row, i) => (
              <div key={row.nm + i} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div><div className="ct-fq-lbnm">{row.nm}</div><div className="ct-fq-lbdt">{t.chalResDetail(row.avgAcc, row.last?.dPrime ?? 0)}</div></div>
                <div className="ct-fq-lbsc">{row.avgAcc}%</div>
              </div>
            ))}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { setChalSeed(null); setChalTurnOpen(false); setPhase('chal'); }}>{t.newCh}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('hub')}>{t.menu}</button>
          </div>
        </div>
      )}

      {levelInfo && (
        <div className="ct-nb-popup-backdrop">
          <div className="ct-nb-popup">
            <div className={`ct-nb-popup-kicker ct-nb-popup-kicker--${levelInfo.dir}`}>{t.popKick[levelInfo.dir]}</div>
            <div className="ct-nb-popup-n">{t.nBadge(levelInfo.nextN)}</div>
            <div className="ct-nb-popup-sub">{t.popSub[levelInfo.dir]}</div>
            <div className="ct-nb-popup-acc">{t.popAcc(levelInfo.acc)}</div>
            <button type="button" className="ct-nb-popup-btn" onClick={() => { playSfx?.('click'); const nx = levelInfo.nextN; setLevelInfo(null); startFree(nx); }}>{t.popCont(levelInfo.nextN)}</button>
            <button type="button" className="ct-nb-popup-end" onClick={() => { playSfx?.('click'); setLevelInfo(null); setPhase('hub'); }}>{t.popEnd}</button>
          </div>
        </div>
      )}

    </div>
  );
}
