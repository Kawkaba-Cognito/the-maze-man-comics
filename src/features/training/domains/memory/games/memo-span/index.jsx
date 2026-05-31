import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import MemoObject from './MemoObject';
import MemoModes from './MemoModes';
import MemoSpanTutorial, {
  buildTutorialQueueFor,
  markTutorialSeen,
} from './tutorial';
import {
  MS_LEVELS_PER_TIER,
  MS_DIFF_KEYS,
  MS_DM,
  MS_FREE_LIVES,
  specForLevel,
  describeBriefing,
  prepareLevelRound,
  prepareFreeRound,
  prepareChallengeSeed,
  prepareChallengeRound,
  gradeRecall,
  starsForRecall,
  isMemoSpanLevelUnlocked,
  mergeMemoChallengeRow,
  compareMemoChallengeRows,
} from './memoSpanData';
import { loadMemoSpanProfile, saveMemoSpanProfile } from './memoSpanProgress';
import AssessmentReady from '../../../../assessment/AssessmentReady';

const UI = {
  en: {
    hubMemory: 'Memory', hubTag: 'training', replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Free mode', levelMode: '🎯 Level mode', challengeMode: '⚔️ Pass n Play',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Endless · 3 lives · sequence grows',
    hubNodeLevelsHint: 'Watch · tap back · 100 levels',
    hubNodeChallengeHint: 'Same sequence for all · pick a difficulty',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Cells light up in a sequence — tap them back. Reverse order = working memory.',
    diffDesc: {
      easy: 'Small grid, short — forward then reverse.',
      medium: 'Bigger grid, reverse recall, faster.',
      hard: 'Large grid, long reverse sequences.',
    },
    chalPickDiff: 'Difficulty',
    levelsSub: (pop) => `${pop} · ${MS_LEVELS_PER_TIER} levels`,
    levelHeader: (diff, lv) => `${MS_DM[diff]?.label ?? diff} · L${lv}`,
    levelMeta: (n, dir) => `${n} ${dir}`,
    fwd: '→', rev: '⤺',
    watchPhase: 'Watch the order…',
    recallSame: 'Tap the cells in the SAME order',
    recallRev: 'Tap the cells in REVERSE order',
    recallProgress: (n, total) => `${n} / ${total}`,
    correctSeqLabel: 'Correct order:',
    wrongTap: 'Wrong — sequence broken',
    feedbackOk: 'Perfect!',
    dirForward: 'TAP IN ORDER', dirReverse: 'TAP IN REVERSE',
    watchForward: 'Watch — then tap in ORDER', watchReverse: 'Watch — then tap in REVERSE',
    yourTurn: 'Your turn',
    resultsPass: 'Nice memory!', resultsFail: 'Keep practicing',
    stars: 'Stars', spanLabel: 'Span', score: 'Score', lives: 'Lives',
    retry: 'Retry', nextLv: 'Next level', menu: 'Menu',
    freeTitle: 'Free mode',
    freeBest: (n) => `Best span: ${n}`,
    freeScoreLine: (n) => `Score: ${n}`,
    freePlayAgain: 'Play again',
    freeGameOver: 'Run ended',
    startRound: 'Start',
    challengeTitle: '⚔️ Pass n Play',
    challengeSub: 'Same sequence for everyone · pick a difficulty · pass the device',
    players: 'Players (2–10)', addPl: '＋ Add player', startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds', chalRoundsHint: 'Each player plays once per round',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same sequence this round',
    chalBulletPass: 'Start only when this player has the device',
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start round',
    chalMeta: (label, span, rev) => `${label} · span ${span}${rev ? ' · reverse' : ''}`,
    challengeHeader: 'Pass n Play',
    resultsChalTitle: 'Pass n Play results',
    chalResDetail: (pct, c, tot) => `${pct}% · ${c}/${tot} in order`,
    newCh: 'New game',
  },
  ar: {
    hubMemory: 'ذاكرة', hubTag: 'تدريب', replayTutorial: 'إعادة الشرح',
    freeMode: '♾️ وضع حر', levelMode: '🎯 وضع المستويات', challengeMode: '⚔️ مرّر والعب',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'لا ينتهي · ٣ أرواح · يطول التسلسل',
    hubNodeLevelsHint: 'شاهد · أعد التسلسل · ١٠٠ مستوى',
    hubNodeChallengeHint: 'نفس التسلسل للجميع · اختر الصعوبة',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'تضيء الخلايا بتسلسل — أعدها. الترتيب المعكوس = ذاكرة عاملة.',
    diffDesc: {
      easy: 'شبكة صغيرة وقصيرة — مباشر ثم معكوس.',
      medium: 'شبكة أكبر، استدعاء معكوس، أسرع.',
      hard: 'شبكة كبيرة، تسلسلات معكوسة طويلة.',
    },
    chalPickDiff: 'الصعوبة',
    levelsSub: (pop) => `${pop} · ${MS_LEVELS_PER_TIER} مستوى`,
    levelHeader: (diff, lv) => `${MS_DM[diff]?.label ?? diff} · ${lv}`,
    levelMeta: (n, dir) => `${n} ${dir}`,
    fwd: '→', rev: '⤺',
    watchPhase: 'راقب الترتيب…',
    recallSame: 'اضغط الخلايا بنفس الترتيب',
    recallRev: 'اضغط الخلايا بترتيب معكوس',
    recallProgress: (n, total) => `${n} / ${total}`,
    correctSeqLabel: 'الترتيب الصحيح:',
    wrongTap: 'خطأ — انكسر التسلسل',
    feedbackOk: 'ممتاز!',
    dirForward: 'اضغط بالترتيب', dirReverse: 'اضغط بالعكس',
    watchForward: 'راقب — ثم اضغط بالترتيب', watchReverse: 'راقب — ثم اضغط بالعكس',
    yourTurn: 'دورك',
    resultsPass: 'ذاكرة جيدة!', resultsFail: 'واصل التدريب',
    stars: 'نجوم', spanLabel: 'المدى', score: 'نقاط', lives: 'الأرواح',
    retry: 'إعادة', nextLv: 'المستوى التالي', menu: 'القائمة',
    freeTitle: 'وضع حر',
    freeBest: (n) => `أفضل مدى: ${n}`,
    freeScoreLine: (n) => `نقاط: ${n}`,
    freePlayAgain: 'العب مجدداً',
    freeGameOver: 'انتهت المحاولة',
    startRound: 'ابدأ',
    challengeTitle: '⚔️ مرّر والعب',
    challengeSub: 'نفس التسلسل للجميع · اختر الصعوبة · مرّر الجهاز',
    players: 'اللاعبون (2–10)', addPl: '＋ إضافة لاعب', startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات', chalRoundsHint: 'كل لاعب يلعب مرة في الجولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس التسلسل في هذه الجولة',
    chalBulletPass: 'ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الجولة',
    chalMeta: (label, span, rev) => `${label} · مدى ${span}${rev ? ' · معكوس' : ''}`,
    challengeHeader: 'مرّر والعب',
    resultsChalTitle: 'نتائج مرّر والعب',
    chalResDetail: (pct, c, tot) => `${pct}% · ${c}/${tot} بالترتيب`,
    newCh: 'لعبة جديدة',
  },
};

const ASSESS_TRIALS = 10; // fixed standardized span ladder

export default function MemoSpanGame({ onBack, assessmentMode = false, onAssessmentComplete, onAssessmentExit, assessmentLabel, assessmentStep }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  const [profile, setProfile] = useState(() => loadMemoSpanProfile());
  const [phase, setPhase] = useState(assessmentMode ? 'assessStart' : 'hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [round, setRound] = useState(null);
  const [playStep, setPlayStep] = useState('idle');
  const [litCell, setLitCell] = useState(-1);
  const [taps, setTaps] = useState([]);
  const [showCorrect, setShowCorrect] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  // Free mode
  const [freeLives, setFreeLives] = useState(MS_FREE_LIVES);
  const [freeScore, setFreeScore] = useState(0);
  const freeLivesRef = useRef(MS_FREE_LIVES);
  const freeScoreRef = useRef(0);
  const freeSpanRef = useRef(2);

  // Challenge
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);
  const [chalDiff, setChalDiff] = useState('medium');
  const chalDiffRef = useRef('medium');
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);

  const [tutorialQueue, setTutorialQueue] = useState([]);
  const pendingTutorialActionRef = useRef(null);

  const timersRef = useRef([]);
  const roundRef = useRef(null);
  const tapsRef = useRef([]);
  const recallStartRef = useRef(0);

  // Assessment (standardized span ladder)
  const assessTotalRef = useRef(0);
  const assessCorrectRef = useRef(0);
  const assessMaxRef = useRef(0);
  const assessSpanRef = useRef(3);

  const doneMap = profile.done || {};

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);
  useEffect(() => { roundRef.current = round; }, [round]);
  useEffect(() => { chalIdxRef.current = chalIdx; }, [chalIdx]);
  useEffect(() => { chalNamesRef.current = chalNames; }, [chalNames]);

  const resetPlayState = () => {
    setLitCell(-1);
    setTaps([]);
    tapsRef.current = [];
    setShowCorrect(false);
    setFeedback(null);
  };

  const finishRound = useCallback((finalTaps) => {
    const r = roundRef.current;
    if (!r) return;
    clearTimers();
    const grade = gradeRecall(r.expected, finalTaps);
    const recallMs = performance.now() - recallStartRef.current;
    const won = grade.correctSequence;
    const stars = starsForRecall(grade, recallMs, r.spec.span);
    playSfx(won ? 'win' : 'error');

    const goNext = (nextPhase) => {
      setRound(null);
      setPlayStep('idle');
      resetPlayState();
      setPhase(nextPhase);
    };

    if (r.mode === 'assess') {
      assessTotalRef.current += 1;
      if (won) {
        assessCorrectRef.current += 1;
        assessMaxRef.current = Math.max(assessMaxRef.current, r.spec.span);
        assessSpanRef.current = Math.min(9, r.spec.span + 1);
      } else {
        assessSpanRef.current = Math.max(2, r.spec.span - 1);
      }
      if (assessTotalRef.current < ASSESS_TRIALS) {
        beginRoundRef.current({ ...prepareFreeRound(assessSpanRef.current, rngSeed()), mode: 'assess' });
        return;
      }
      const maxSpan = assessMaxRef.current;
      const acc = assessTotalRef.current ? assessCorrectRef.current / assessTotalRef.current : 0;
      const spanScore = Math.max(0, Math.min(1, (maxSpan - 2) / 6)) * 100; // span 2→0, span 8→100
      const score = Math.round(0.7 * spanScore + 0.3 * acc * 100);
      setRound(null); setPlayStep('idle'); resetPlayState();
      onAssessmentComplete?.({ score, line: `span ${maxSpan} · ${Math.round(acc * 100)}%` });
      return;
    }

    if (r.mode === 'challenge') {
      const idx = chalIdxRef.current;
      const names = chalNamesRef.current;
      const base = [...chalScoresRef.current];
      base[idx] = mergeMemoChallengeRow(base[idx], grade, names[idx]);
      chalScoresRef.current = base;
      setChalScores(base);
      const nextIdx = idx + 1;
      if (nextIdx < names.length) {
        setChalIdx(nextIdx);
        chalIdxRef.current = nextIdx;
        setChalTurnOpen(true);
        setRound(null); setPlayStep('idle'); resetPlayState();
        return;
      }
      const cycle = chalCycleRef.current;
      if (cycle + 1 < chalRoundsTotalRef.current) {
        chalCycleRef.current = cycle + 1;
        setChalRoundIdx(chalCycleRef.current);
        setChalSeed(prepareChallengeSeed(chalDiffRef.current));
        setChalIdx(0); chalIdxRef.current = 0;
        setChalTurnOpen(true);
        setRound(null); setPlayStep('idle'); resetPlayState();
        return;
      }
      setLastResult({ type: 'challenge', rows: [...base].sort(compareMemoChallengeRows) });
      goNext('chalRes');
      return;
    }

    if (r.mode === 'free') {
      const span = r.spec.span;
      if (won) {
        freeScoreRef.current += span * 10;
        setFreeScore(freeScoreRef.current);
        freeSpanRef.current = Math.min(9, span + 1);
        setProfile((prev) => {
          const best = Math.max(prev.bestStudy ?? 2, span);
          if (best === (prev.bestStudy ?? 2)) return prev;
          const next = { ...prev, bestStudy: best };
          saveMemoSpanProfile(next);
          return next;
        });
        beginRoundRef.current(prepareFreeRound(freeSpanRef.current, rngSeed()));
        return;
      }
      freeLivesRef.current = Math.max(0, freeLivesRef.current - 1);
      setFreeLives(freeLivesRef.current);
      freeSpanRef.current = Math.max(2, span - 1);
      if (freeLivesRef.current > 0) {
        beginRoundRef.current(prepareFreeRound(freeSpanRef.current, rngSeed()));
        return;
      }
      setLastResult({ type: 'free', score: freeScoreRef.current, bestSpan: profile.bestStudy ?? span });
      goNext('freeRes');
      return;
    }

    // level
    if (won) {
      const key = `${r.diff}-${r.lv}`;
      setProfile((prev) => {
        const next = { ...prev, done: { ...(prev.done || {}), [key]: true } };
        saveMemoSpanProfile(next);
        return next;
      });
    }
    setLastResult({ type: 'level', won, stars, grade, round: r });
    goNext('res');
  }, [clearTimers, playSfx, profile.bestStudy, onAssessmentComplete]);

  function rngSeed() {
    return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
  }

  const runStudy = useCallback((i) => {
    const r = roundRef.current;
    if (!r) return;
    if (i >= r.sequence.length) {
      setLitCell(-1);
      recallStartRef.current = performance.now();
      setPlayStep('recall');
      return;
    }
    setLitCell(r.sequence[i]);
    const onMs = r.spec.flashMs;
    const offMs = r.spec.gapMs;
    timersRef.current.push(setTimeout(() => {
      setLitCell(-1);
      timersRef.current.push(setTimeout(() => runStudy(i + 1), offMs));
    }, onMs));
  }, []);

  const startStudy = useCallback(() => {
    clearTimers();
    resetPlayState();
    setPlayStep('study');
    // small beat before the first flash
    timersRef.current.push(setTimeout(() => runStudy(0), 450));
  }, [clearTimers, runStudy]);

  const beginRound = useCallback((r) => {
    clearTimers();
    setRound(r);
    roundRef.current = r;
    resetPlayState();
    setPhase('play');
    setPlayStep('briefing');
  }, [clearTimers]);
  const beginRoundRef = useRef(beginRound);
  useEffect(() => { beginRoundRef.current = beginRound; }, [beginRound]);

  const onCellTap = useCallback((cellIdx) => {
    if (playStep !== 'recall' || feedback) return;
    const r = roundRef.current;
    if (!r) return;
    if (tapsRef.current.includes(cellIdx)) return; // each cell once
    const pos = tapsRef.current.length;
    const correct = cellIdx === r.expected[pos];
    const newTaps = [...tapsRef.current, cellIdx];
    tapsRef.current = newTaps;
    setTaps(newTaps);
    if (!correct) {
      playSfx('error');
      setFeedback('bad');
      setShowCorrect(true);
      timersRef.current.push(setTimeout(() => finishRound(newTaps), 1900));
      return;
    }
    playSfx('click');
    if (newTaps.length === r.expected.length) {
      setFeedback('ok');
      timersRef.current.push(setTimeout(() => finishRound(newTaps), 550));
    }
  }, [playStep, feedback, playSfx, finishRound]);

  const startLevel = (diff, lv) => beginRound(prepareLevelRound(diff, lv, rngSeed()));
  const startAssessment = () => {
    assessTotalRef.current = 0;
    assessCorrectRef.current = 0;
    assessMaxRef.current = 0;
    assessSpanRef.current = 3;
    beginRound({ ...prepareFreeRound(3, rngSeed()), mode: 'assess' });
  };
  const startFree = () => {
    freeLivesRef.current = MS_FREE_LIVES;
    freeScoreRef.current = 0;
    freeSpanRef.current = 2;
    setFreeLives(MS_FREE_LIVES);
    setFreeScore(0);
    beginRound(prepareFreeRound(2, rngSeed()));
  };

  const gateWithTutorial = useCallback((action, modeKind) => {
    const q = buildTutorialQueueFor(modeKind);
    if (q.length === 0) { action(); return; }
    pendingTutorialActionRef.current = action;
    setTutorialQueue(q);
  }, []);
  const advanceTutorial = useCallback(() => {
    setTutorialQueue((prev) => {
      const finished = prev[0];
      if (finished) markTutorialSeen(finished.kind === 'main' ? 'main' : finished.kind === 'free-tip' ? 'free' : 'challenge');
      const rem = prev.slice(1);
      if (rem.length === 0 && pendingTutorialActionRef.current) {
        const a = pendingTutorialActionRef.current;
        pendingTutorialActionRef.current = null;
        queueMicrotask(a);
      }
      return rem;
    });
  }, []);
  const replayTutorial = useCallback(() => {
    pendingTutorialActionRef.current = null;
    setTutorialQueue([{ kind: 'main' }]);
  }, []);

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) { window.alert(t.needTwo); return; }
    clearTimers();
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalDiffRef.current = chalDiff;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    setChalSeed(prepareChallengeSeed(chalDiffRef.current));
    setChalIdx(0); chalIdxRef.current = 0;
    const initial = names.map((nm) => ({ nm, rounds: [], avgPct: 0, fullCount: 0 }));
    chalScoresRef.current = initial;
    setChalScores(initial);
    setChalTurnOpen(true);
    setRound(null); setPlayStep('idle'); resetPlayState();
    setPhase('play');
  };
  const startChallengeRound = () => {
    if (!chalSeed) return;
    setChalTurnOpen(false);
    beginRound(prepareChallengeRound(chalSeed));
    playSfx('click');
  };

  const briefing = round?.spec ? describeBriefing(round.spec, isAr) : null;

  const headerTitle = () => {
    if (!round) return t.hubMemory;
    if (round.mode === 'free') return t.freeTitle;
    if (round.mode === 'challenge') return t.challengeHeader;
    return t.levelHeader(round.diff, round.lv);
  };
  const headerSub = () => {
    if (!round) return '';
    if (playStep === 'study') return t.watchPhase;
    if (playStep === 'recall') return `${round.spec.backward ? t.dirReverse : t.dirForward} · ${taps.length}/${round.expected.length}`;
    if (round.mode === 'challenge') {
      return chalRoundsTotal > 1 ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ${chalNames[chalIdx] ?? ''}` : (chalNames[chalIdx] ?? '');
    }
    return briefing?.headline ?? '';
  };

  const gridStyle = round ? { gridTemplateColumns: `repeat(${round.spec.cols}, 1fr)` } : undefined;

  return (
    <div className="cancellation-task-game ct-ms-root" dir={isAr ? 'rtl' : 'ltr'}>
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
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar
              onBack={onBack} playSfx={playSfx} hubSpaced variant="paper"
              onReplayTutorial={replayTutorial} replayHint={t.replayTutorial}
              center={<div className="ct-fq-hub-attn-head"><div className="ct-fq-hub-attn-big ct-ms-hub-title">{t.hubMemory}</div><div className="ct-fq-hub-attn-sub">{t.hubTag}</div></div>}
            />
            <MemoModes
              t={t} isAr={isAr} playSfx={playSfx}
              onFree={() => gateWithTutorial(startFree, 'free')}
              onLevels={() => gateWithTutorial(() => setPhase('diff'), 'levels')}
              onChallenge={() => gateWithTutorial(() => setPhase('chal'), 'challenge')}
            />
          </div>
        </div>
      )}

      {phase === 'diff' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('hub')}
              center={<div className="ct-fq-training-title ct-fq-training-title-sm">{t.pickDiff}</div>} />
            <div className="ct-fq-diff-body">
              <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
              <div className="ct-fq-diff-cards">
                {MS_DIFF_KEYS.map((k) => (
                  <button key={k} type="button" className={`ct-fq-db ct-fq-db-${k} ct-fq-db-training ct-fq-diffcard`}
                    onClick={() => { playSfx('click'); setDiffKey(k); setPhase('levels'); }}>
                    <span className="ct-fq-diffcard-main">
                      <span className="ct-fq-diffcard-label">{MS_DM[k].label}</span>
                      <span className="ct-fq-diffcard-desc">{t.diffDesc[k]}</span>
                    </span>
                    <span className="ct-fq-diffcard-meta"><span className="ct-fq-diffcard-pop">{MS_DM[k].pop}</span></span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'levels' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('diff')}
              center={<div className="ct-fq-training-title ct-fq-training-title-sm">{MS_DM[diffKey].label}</div>} />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.levelsSub(MS_DM[diffKey].pop)}</p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: MS_LEVELS_PER_TIER }, (_, i) => i + 1).map((lv) => {
                const un = isMemoSpanLevelUnlocked(diffKey, lv, doneMap);
                const dn = !!doneMap[`${diffKey}-${lv}`];
                const spec = specForLevel(diffKey, lv);
                return (
                  <button key={lv} type="button" className={`ct-fq-lb ${un ? `ct-${MS_DM[diffKey].lvc}` : 'ct-lvk'}`} disabled={!un}
                    onClick={() => { if (!un) return; playSfx('click'); startLevel(diffKey, lv); }}>
                    <span className="ct-ln">{dn ? '★' : lv}</span>
                    <span className="ct-ls">{un ? t.levelMeta(spec.span, spec.backward ? t.rev : t.fwd) : '🔒'}</span>
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
            <TrainingMenuBar onBack={() => setPhase('hub')} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.challengeTitle}</div></div>} />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.challengeSub}</p>
            <div className="ct-fq-card ct-fq-card-training">
              <h3>{t.chalPickDiff}</h3>
              <div className="ct-fq-rr ct-fq-rr-diff" role="group" aria-label={t.chalPickDiff}>
                {MS_DIFF_KEYS.map((k) => (
                  <button key={k} type="button"
                    className={`ct-fq-rrb ct-fq-rrb-diff${chalDiff === k ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalDiff(k); }}>{MS_DM[k].label}</button>
                ))}
              </div>
              <h3 style={{ marginTop: 14 }}>{t.players}</h3>
              {chalNames.map((nm, i) => (
                <div key={i} className="ct-fq-pr">
                  <input value={nm} maxLength={20} onChange={(e) => { const n = [...chalNames]; n[i] = e.target.value; setChalNames(n); }} />
                  {chalNames.length > 2 && (<button type="button" className="ct-fq-prm" onClick={() => setChalNames(chalNames.filter((_, j) => j !== i))}>×</button>)}
                </div>
              ))}
              {chalNames.length < 10 && (<button type="button" className="ct-fq-apb ct-fq-apb-training" onClick={() => setChalNames([...chalNames, `Player ${chalNames.length + 1}`])}>{t.addPl}</button>)}
              <h3 style={{ marginTop: 14 }}>{t.chalRounds}</h3>
              <p className="ct-fq-sub" style={{ marginTop: 2, marginBottom: 8, fontSize: '0.78rem' }}>{t.chalRoundsHint}</p>
              <div className="ct-fq-rr" role="group" aria-label={t.chalRounds}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={`ct-fq-rrb${chalRoundsTotal === n ? ' ct-fq-rrb-on ct-fq-rrb-on-training' : ''} ct-fq-rrb-training`}
                    onClick={() => { playSfx('click'); setChalRoundsTotal(n); }}>{n}</button>
                ))}
              </div>
            </div>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { playSfx('click'); openChallenge(); }}>{t.startCh}</button>
          </div>
        </div>
      )}

      {phase === 'play' && chalTurnOpen && !round && chalNames[chalIdx] && (
        <TrainingChallengeHandoff
          isAr={isAr} kicker={t.chalTurnKicker} playerName={chalNames[chalIdx]}
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={t.chalMeta(MS_DM[chalDiff]?.label ?? '', chalSeed?.spec?.span ?? 5, chalSeed?.spec?.backward)}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady} onStart={startChallengeRound} playSfx={playSfx}
        />
      )}

      {phase === 'play' && round && (
        <div className="ct-ms-play">
          <TrainingPlayHeader
            isAr={isAr} title={headerTitle()} subtitle={headerSub()} playSfx={playSfx}
            onMenu={() => { clearTimers(); setRound(null); resetPlayState(); if (round.mode === 'assess') { (onAssessmentExit || onBack)?.(); return; } setPhase(round.mode === 'free' ? 'hub' : round.mode === 'challenge' ? 'chal' : 'levels'); }}
            onPause={null}
          />
          <div className="ct-ms-stage">
            {playStep === 'briefing' && briefing && (
              <div className="ct-ms-briefing">
                <span className={`ct-ms-dir-badge${round.spec.backward ? ' ct-ms-dir-badge--rev' : ''}`}>
                  {round.spec.backward ? t.dirReverse : t.dirForward}
                </span>
                <h2 className="ct-ms-briefing-title">{briefing.headline}</h2>
                <p className="ct-ms-briefing-line">{briefing.watchLine}</p>
                <p className="ct-ms-briefing-line">{briefing.tapLine}</p>
                <p className="ct-ms-briefing-meta">{briefing.detailLine}</p>
                <button type="button" className="ct-ms-briefing-start" onClick={() => { playSfx('click'); startStudy(); }}>
                  {briefing.startLabel}
                </button>
              </div>
            )}

            {(playStep === 'study' || playStep === 'recall') && (
              <>
                <div className="ct-ms-stage-top">
                  <div
                    className={`ct-ms-dir-banner${round.spec.backward ? ' ct-ms-dir-banner--rev' : ' ct-ms-dir-banner--fwd'}${playStep === 'recall' ? ' ct-ms-dir-banner--live' : ''}`}
                  >
                    <span className="ct-ms-dir-banner-icon" aria-hidden="true">
                      {round.spec.backward ? '⤺' : '→'}
                    </span>
                    <span className="ct-ms-dir-banner-text">
                      {playStep === 'study'
                        ? (round.spec.backward ? t.watchReverse : t.watchForward)
                        : (round.spec.backward ? t.dirReverse : t.dirForward)}
                    </span>
                  </div>
                  {round.mode === 'free' && (
                    <span className="ct-ms-lives ct-fq-lives" aria-label={`${freeLives} lives`}>
                      {'♥'.repeat(Math.max(0, freeLives))}<span className="ct-fq-lives-spent">{'♥'.repeat(Math.max(0, MS_FREE_LIVES - freeLives))}</span>
                    </span>
                  )}
                </div>
                {playStep === 'recall' && (
                  <span className="ct-ms-substatus">
                    {t.yourTurn} · {t.recallProgress(taps.length, round.expected.length)}
                  </span>
                )}

                <div className={`ct-ms-grid${feedback === 'bad' ? ' ct-ms-grid--shake' : ''}`} style={gridStyle}>
                  {round.gridObjects.map((objId, ci) => {
                    const tappedAt = taps.indexOf(ci);
                    const isTapped = tappedAt >= 0;
                    const correctOrder = showCorrect ? round.expected.indexOf(ci) : -1;
                    const lit = playStep === 'study' && litCell === ci;
                    return (
                      <button
                        key={ci}
                        type="button"
                        className={`ct-ms-cell${lit ? ' ct-ms-cell--lit' : ''}${isTapped ? ' ct-ms-cell--tapped' : ''}${showCorrect && correctOrder >= 0 ? ' ct-ms-cell--correct' : ''}`}
                        disabled={playStep !== 'recall' || isTapped || !!feedback}
                        onPointerDown={() => onCellTap(ci)}
                      >
                        <MemoObject objectId={objId} isAr={isAr} size="md" />
                        {isTapped && <span className="ct-ms-cell-num">{tappedAt + 1}</span>}
                        {showCorrect && correctOrder >= 0 && !isTapped && <span className="ct-ms-cell-num ct-ms-cell-num--correct">{correctOrder + 1}</span>}
                      </button>
                    );
                  })}
                </div>

                {feedback && (
                  <p className={`ct-ms-feedback ct-ms-feedback--${feedback}`}>{feedback === 'ok' ? t.feedbackOk : t.wrongTap}</p>
                )}
                {round.mode === 'free' && (
                  <p className="ct-ms-free-score">{t.score}: {freeScore}</p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('levels')} center={null} />
            <p className="ct-ms-result-kicker">{lastResult.won ? t.resultsPass : t.resultsFail}</p>
            <p className="ct-ms-result-stars">{t.stars}: {'★'.repeat(lastResult.stars)}{'☆'.repeat(3 - lastResult.stars)}</p>
            <p className="ct-ms-result-meta">{t.spanLabel}: {lastResult.grade.correctCount}/{lastResult.grade.total}</p>
            <div className="ct-ms-result-actions">
              {!lastResult.won && (<button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startLevel(lastResult.round.diff, lastResult.round.lv)}>{t.retry}</button>)}
              {lastResult.won && lastResult.round.lv < MS_LEVELS_PER_TIER && (
                <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => startLevel(lastResult.round.diff, lastResult.round.lv + 1)}>{t.nextLv}</button>
              )}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('levels')}>{t.menu}</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('hub')} center={null} />
            <div className="ct-fq-sbig">{lastResult.score ?? 0}</div>
            <div className="ct-fq-ies-lbl">{t.score}</div>
            <p className="ct-ms-result-meta">{t.freeBest(profile.bestStudy ?? 2)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={startFree}>{t.freePlayAgain}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('hub')}>{t.menu}</button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar onBack={() => { setLastResult(null); setPhase('hub'); }} playSfx={playSfx} variant="paper"
              center={<div style={{ textAlign: 'center' }}><div className="ct-fq-training-title ct-fq-training-title-sm">{t.resultsChalTitle}</div></div>} />
            {[...lastResult.rows].sort(compareMemoChallengeRows).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">{t.chalResDetail(row.avgPct, row.last?.correct ?? 0, row.last?.total ?? 0)}</div>
                </div>
                <div className="ct-fq-lbsc">{row.avgPct}%</div>
              </div>
            ))}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={() => { setLastResult(null); setChalSeed(null); setChalTurnOpen(false); setPhase('chal'); }}>{t.newCh}</button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => { setLastResult(null); setPhase('hub'); }}>{t.menu}</button>
          </div>
        </div>
      )}

      {tutorialQueue.length > 0 && (
        <MemoSpanTutorial kind={tutorialQueue[0].kind} isAr={isAr} playSfx={playSfx} onClose={advanceTutorial} />
      )}
    </div>
  );
}
