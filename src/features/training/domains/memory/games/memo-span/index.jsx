import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import {
  TrainingMenuBar,
  TrainingPlayHeader,
  TrainingChallengeHandoff,
} from '../../../../shared/TrainingChrome';
import MemoObject from './MemoObject';
import { objectLabel } from './memoObjects';
import MemoModes from './MemoModes';
import MemoSpanTutorial, {
  buildTutorialQueueFor,
  markTutorialSeen,
} from './tutorial';
import {
  MS_LEVELS_PER_TIER,
  MS_DIFF_KEYS,
  MS_DM,
  specificationForLevel,
  describeBriefing,
  prepareLevelRound,
  prepareFreeRound,
  prepareChallengeSeed,
  prepareChallengeRound,
  gradeSerialRecall,
  starsForSerialRecall,
  isMemoSpanLevelUnlocked,
  mergeMemoChallengeRow,
  compareMemoChallengeRows,
} from './memoSpanData';
import { loadMemoSpanProfile, saveMemoSpanProfile } from './memoSpanProgress';

const UI = {
  en: {
    hubMemory: 'Memory',
    hubTag: 'training',
    replayTutorial: 'Replay tutorial',
    freeMode: '♾️ Free mode',
    levelMode: '🎯 Level mode',
    challengeMode: '⚔️ Challenge',
    hubMapAria: 'Modes',
    hubNodeFreeHint: 'Longer sequences when you pass',
    hubNodeLevelsHint: 'Watch sequence · tap in order · 20 levels',
    hubNodeChallengeHint: 'Same sequence for everyone · pass & play',
    pickDiff: 'Choose difficulty',
    pickDiffSub: 'Watch a sequence of objects, then tap them back in the same order.',
    levelsSub: (pop) => `${pop} · ${MS_LEVELS_PER_TIER} levels`,
    levelHeader: (diff, lv) => `${MS_DM[diff]?.label ?? diff} · L${lv}`,
    levelMeta: (n, p) => `${n} obj · ${p} grid`,
    memorizePhase: 'Memorize the order…',
    studyItem: (n, total, name) => `${name} · ${n} of ${total}`,
    recallPrompt: 'Tap the objects in the order shown',
    recallProgress: (n, total) => `Tapped: ${n} / ${total}`,
    correctSeqLabel: 'Correct sequence:',
    wrongTap: 'Wrong! Sequence ended.',
    testProgress: (n, total) => `Step ${n} / ${total}`,
    feedbackOk: 'Perfect sequence!',
    feedbackBad: 'Sequence broken',
    resultsPass: 'Nice memory!',
    resultsFail: 'Keep practicing',
    stars: 'Stars',
    scoreLabel: 'Score',
    spanLabel: 'Span',
    retry: 'Retry',
    nextLv: 'Next level',
    menu: 'Menu',
    freeTitle: 'Free mode',
    freeSub: 'Sequence gets longer when you nail it, shorter when you slip.',
    freeCount: (n) => `Sequence length: ${n}`,
    freeBest: (n) => `Best span: ${n}`,
    freePlayAgain: 'Play again',
    freeIntroReady: 'Ready',
    readyForTest: 'Get ready to recall…',
    startQuestions: 'Start recall',
    challengeTitle: '⚔️ Challenge mode',
    challengeSub: 'Same sequence for every player · Medium L8',
    players: 'Players (2–10)',
    addPl: '＋ Add player',
    startCh: '⚔️ Start',
    needTwo: 'Add at least 2 players.',
    chalRounds: 'Rounds',
    chalRoundsHint: 'Each player plays once per round',
    roundNofM: (n, m) => `Round ${n}/${m}`,
    chalTurnKicker: 'Your turn',
    chalBulletSame: 'Same sequence this round',
    chalBulletPass: 'Start only when this player has the device',
    handTo: (n) => `Hand the device to ${n}.`,
    goReady: 'Start round',
    chalMeta: 'Medium · L8 · serial recall',
    challengeHeader: 'Challenge',
    resultsChalTitle: 'Challenge results',
    chalResDetail: (pct, c, t) => `${pct}% · ${c}/${t} in order`,
    newCh: 'New challenge',
  },
  ar: {
    hubMemory: 'ذاكرة',
    hubTag: 'تدريب',
    replayTutorial: 'إعادة الشرح',
    freeMode: '♾️ وضع حر',
    levelMode: '🎯 وضع المستويات',
    challengeMode: '⚔️ تحدي',
    hubMapAria: 'الأوضاع',
    hubNodeFreeHint: 'تسلسل أطول عند النجاح',
    hubNodeLevelsHint: 'شاهد التسلسل · اضغط بالترتيب · ٢٠ مستوى',
    hubNodeChallengeHint: 'نفس التسلسل للجميع · تمرير الجهاز',
    pickDiff: 'اختر الصعوبة',
    pickDiffSub: 'شاهد تسلسل أشياء، ثم اضغطها بنفس الترتيب.',
    levelsSub: (pop) => `${pop} · ${MS_LEVELS_PER_TIER} مستوى`,
    levelHeader: (diff, lv) => `${MS_DM[diff]?.label ?? diff} · ${lv}`,
    levelMeta: (n, p) => `${n} أشياء · ${p} شبكة`,
    memorizePhase: 'احفظ الترتيب…',
    studyItem: (n, total, name) => `${name} · ${n} من ${total}`,
    recallPrompt: 'اضغط الأشياء بنفس الترتيب الذي ظهرت به',
    recallProgress: (n, total) => `مضغوط: ${n} / ${total}`,
    correctSeqLabel: 'الترتيب الصحيح:',
    wrongTap: 'خطأ! انتهى التسلسل.',
    testProgress: (n, total) => `الخطوة ${n} / ${total}`,
    feedbackOk: 'تسلسل ممتاز!',
    feedbackBad: 'انكسر التسلسل',
    resultsPass: 'ذاكرة جيدة!',
    resultsFail: 'واصل التدريب',
    stars: 'نجوم',
    scoreLabel: 'النتيجة',
    spanLabel: 'المدى',
    retry: 'إعادة',
    nextLv: 'المستوى التالي',
    menu: 'القائمة',
    freeTitle: 'وضع حر',
    freeSub: 'يطول التسلسل عند النجاح ويقصر عند الخطأ.',
    freeCount: (n) => `طول التسلسل: ${n}`,
    freeBest: (n) => `أفضل مدى: ${n}`,
    freePlayAgain: 'العب مجدداً',
    freeIntroReady: 'جاهز',
    readyForTest: 'استعد للاستدعاء…',
    startQuestions: 'ابدأ الاستدعاء',
    challengeTitle: '⚔️ وضع التحدي',
    challengeSub: 'نفس التسلسل للجميع · متوسط L8',
    players: 'اللاعبون (2–10)',
    addPl: '＋ إضافة لاعب',
    startCh: '⚔️ ابدأ',
    needTwo: 'أضف لاعبين على الأقل.',
    chalRounds: 'الجولات',
    chalRoundsHint: 'كل لاعب يلعب مرة في الجولة',
    roundNofM: (n, m) => `الجولة ${n}/${m}`,
    chalTurnKicker: 'دورك',
    chalBulletSame: 'نفس التسلسل في هذه الجولة',
    chalBulletPass: 'ابدأ فقط عندما يكون الجهاز مع هذا اللاعب',
    handTo: (n) => `سلّم الجهاز إلى ${n}.`,
    goReady: 'ابدأ الجولة',
    chalMeta: 'متوسط · L8 · استدعاء تسلسلي',
    challengeHeader: 'تحدي',
    resultsChalTitle: 'نتائج التحدي',
    chalResDetail: (pct, c, t) => `${pct}% · ${c}/${t} بالترتيب`,
    newCh: 'تحدي جديد',
  },
};

export default function MemoSpanGame({ onBack }) {
  const { playSfx, currentLang } = useApp();
  const isAr = currentLang === 'ar';
  const t = isAr ? UI.ar : UI.en;

  const [profile, setProfile] = useState(() => loadMemoSpanProfile());
  const [phase, setPhase] = useState('hub');
  const [diffKey, setDiffKey] = useState('easy');
  const [round, setRound] = useState(null);
  const [playStep, setPlayStep] = useState('idle');
  const [studyIdx, setStudyIdx] = useState(0);
  const [tapsSoFar, setTapsSoFar] = useState([]);
  const [showCorrectSequence, setShowCorrectSequence] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [freeStudyCount, setFreeStudyCount] = useState(3);
  const [tutorialQueue, setTutorialQueue] = useState([]);
  const [chalNames, setChalNames] = useState(['Player 1', 'Player 2']);
  const [chalSeed, setChalSeed] = useState(null);
  const [chalIdx, setChalIdx] = useState(0);
  const [chalScores, setChalScores] = useState([]);
  const [chalTurnOpen, setChalTurnOpen] = useState(false);
  const [chalRoundsTotal, setChalRoundsTotal] = useState(1);
  const [chalRoundIdx, setChalRoundIdx] = useState(0);

  const timersRef = useRef([]);
  const studySeqRef = useRef(null);
  const readySeqRef = useRef(null);
  const roundRef = useRef(null);
  const tapsRef = useRef([]);
  const pendingTutorialActionRef = useRef(null);
  const chalIdxRef = useRef(0);
  const chalNamesRef = useRef(chalNames);
  const chalScoresRef = useRef([]);
  const chalRoundsTotalRef = useRef(1);
  const chalCycleRef = useRef(0);

  const doneMap = profile.done || {};

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
    if (studySeqRef.current) {
      clearTimeout(studySeqRef.current);
      studySeqRef.current = null;
    }
    if (readySeqRef.current) {
      clearTimeout(readySeqRef.current);
      readySeqRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    roundRef.current = round;
  }, [round]);

  useEffect(() => {
    tapsRef.current = tapsSoFar;
  }, [tapsSoFar]);

  useEffect(() => {
    chalIdxRef.current = chalIdx;
  }, [chalIdx]);
  useEffect(() => {
    chalNamesRef.current = chalNames;
  }, [chalNames]);

  const finishRound = useCallback(
    (taps) => {
      const r = roundRef.current;
      if (!r) return;
      clearTimers();
      const grade = gradeSerialRecall(r.studyItems, taps);
      const won = grade.correctSequence || grade.pct >= r.spec.passPct;
      const stars = starsForSerialRecall(grade, r.spec);
      playSfx(won ? 'win' : 'error');

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
          setRound(null);
          setPlayStep('idle');
          setFeedback(null);
          setShowCorrectSequence(false);
          setTapsSoFar([]);
          tapsRef.current = [];
          return;
        }

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
          setRound(null);
          setPlayStep('idle');
          setFeedback(null);
          setShowCorrectSequence(false);
          setTapsSoFar([]);
          tapsRef.current = [];
          return;
        }

        const sorted = [...base].sort(compareMemoChallengeRows);
        setLastResult({ type: 'challenge', rows: sorted });
        setPhase('chalRes');
        setRound(null);
        setPlayStep('idle');
        setFeedback(null);
        setShowCorrectSequence(false);
        setTapsSoFar([]);
        tapsRef.current = [];
        return;
      }

      if (r.mode === 'level') {
        if (won) {
          const key = `${r.diff}-${r.lv}`;
          setProfile((prev) => {
            const next = { ...prev, done: { ...(prev.done || {}), [key]: true } };
            saveMemoSpanProfile(next);
            return next;
          });
        }
        setLastResult({ type: 'level', won, stars, grade, round: r });
        setPhase('res');
      } else if (r.mode === 'free') {
        if (grade.correctSequence) {
          setFreeStudyCount((c) => Math.min(8, c + 1));
          setProfile((prev) => {
            const next = {
              ...prev,
              bestStudy: Math.max(prev.bestStudy ?? 3, r.spec.studyCount),
            };
            saveMemoSpanProfile(next);
            return next;
          });
        } else {
          setFreeStudyCount((c) => Math.max(3, c - 1));
        }
        setLastResult({ type: 'free', won, grade, round: r });
        setPhase('freeRes');
      }
      setPlayStep('idle');
      setRound(null);
      setFeedback(null);
      setShowCorrectSequence(false);
      setTapsSoFar([]);
      tapsRef.current = [];
    },
    [playSfx, clearTimers],
  );

  const beginTestPhase = useCallback(() => {
    if (readySeqRef.current) {
      clearTimeout(readySeqRef.current);
      readySeqRef.current = null;
    }
    setTapsSoFar([]);
    tapsRef.current = [];
    setShowCorrectSequence(false);
    setFeedback(null);
    setPlayStep('test');
  }, []);

  const beginReadyPhase = useCallback(() => {
    setPlayStep('ready');
    if (readySeqRef.current) clearTimeout(readySeqRef.current);
    readySeqRef.current = setTimeout(() => {
      readySeqRef.current = null;
      beginTestPhase();
    }, 1200);
  }, [beginTestPhase]);

  const runStudySequence = useCallback(
    (idx) => {
      const r = roundRef.current;
      if (!r) return;
      if (idx >= r.studyItems.length) {
        beginReadyPhase();
        return;
      }
      setStudyIdx(idx);
      setPlayStep('study');
      if (studySeqRef.current) clearTimeout(studySeqRef.current);
      studySeqRef.current = setTimeout(() => {
        studySeqRef.current = null;
        runStudySequence(idx + 1);
      }, r.spec.flashMs + r.spec.gapMs);
    },
    [beginReadyPhase],
  );

  const startStudy = useCallback(() => {
    if (studySeqRef.current) clearTimeout(studySeqRef.current);
    if (readySeqRef.current) clearTimeout(readySeqRef.current);
    studySeqRef.current = null;
    readySeqRef.current = null;
    setStudyIdx(0);
    setTapsSoFar([]);
    tapsRef.current = [];
    setShowCorrectSequence(false);
    setFeedback(null);
    runStudySequence(0);
  }, [runStudySequence]);

  const confirmBriefing = useCallback(() => {
    playSfx('click');
    startStudy();
  }, [playSfx, startStudy]);

  const beginRound = useCallback(
    (r) => {
      clearTimers();
      setRound(r);
      setStudyIdx(0);
      setTapsSoFar([]);
      tapsRef.current = [];
      setShowCorrectSequence(false);
      setFeedback(null);
      setPhase('play');
      setPlayStep('briefing');
    },
    [clearTimers],
  );

  const onRecallTap = useCallback(
    (objectId) => {
      if (playStep !== 'test' || !round || feedback) return;
      const expectedIdx = tapsRef.current.length;
      const expected = round.studyItems[expectedIdx]?.objectId;
      const correct = objectId === expected;

      const newTaps = [...tapsRef.current, objectId];
      tapsRef.current = newTaps;
      setTapsSoFar(newTaps);

      if (!correct) {
        playSfx('error');
        setFeedback('bad');
        setShowCorrectSequence(true);
        timersRef.current.push(
          setTimeout(() => {
            finishRound(newTaps);
          }, 2000),
        );
        return;
      }

      playSfx('click');
      if (newTaps.length === round.studyItems.length) {
        setFeedback('ok');
        timersRef.current.push(
          setTimeout(() => {
            finishRound(newTaps);
          }, 600),
        );
      }
    },
    [playStep, round, feedback, playSfx, finishRound],
  );

  const startLevel = (diff, lv) => {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginRound(prepareLevelRound(diff, lv, seed));
  };

  const startFree = () => {
    const seed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    beginRound(prepareFreeRound(freeStudyCount, seed));
  };

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

  const openChallenge = () => {
    const names = chalNames.map((s, i) => s.trim() || `Player ${i + 1}`);
    if (names.length < 2) {
      window.alert(t.needTwo);
      return;
    }
    clearTimers();
    setChalNames(names);
    chalRoundsTotalRef.current = chalRoundsTotal;
    chalCycleRef.current = 0;
    setChalRoundIdx(0);
    const seed = prepareChallengeSeed();
    setChalSeed(seed);
    setChalIdx(0);
    chalIdxRef.current = 0;
    const initial = names.map((nm) => ({ nm, rounds: [], avgPct: 0, fullCount: 0 }));
    chalScoresRef.current = initial;
    setChalScores(initial);
    setChalTurnOpen(true);
    setRound(null);
    setPlayStep('idle');
    setStudyIdx(0);
    setTapsSoFar([]);
    tapsRef.current = [];
    setShowCorrectSequence(false);
    setFeedback(null);
    setPhase('play');
  };

  const startChallengeRound = () => {
    if (!chalSeed) return;
    setChalTurnOpen(false);
    beginRound(prepareChallengeRound(chalSeed));
    playSfx('click');
  };

  const briefing = round?.spec ? describeBriefing(round.spec, isAr) : null;
  const studyItem =
    round && playStep === 'study' && studyIdx < round.studyItems.length
      ? round.studyItems[studyIdx]
      : null;

  const headerSubtitle = () => {
    if (!round) return '';
    if (playStep === 'study' && studyItem) {
      return t.studyItem(
        studyIdx + 1,
        round.studyItems.length,
        objectLabel(studyItem.objectId, isAr),
      );
    }
    if (round.mode === 'challenge') {
      return chalRoundsTotal > 1
        ? `${t.roundNofM(chalRoundIdx + 1, chalRoundsTotal)} · ${chalNames[chalIdx] ?? ''}`
        : chalNames[chalIdx] ?? '';
    }
    if (playStep === 'ready') return t.readyForTest;
    if (playStep === 'test') {
      return t.testProgress(tapsSoFar.length, round.studyItems.length);
    }
    return briefing?.headline ?? '';
  };

  return (
    <div className="cancellation-task-game ct-ms-root" dir={isAr ? 'rtl' : 'ltr'}>
      {phase === 'hub' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen ct-fq-training-screen--hub">
            <TrainingMenuBar
              onBack={onBack}
              playSfx={playSfx}
              hubSpaced
              variant="paper"
              onReplayTutorial={replayTutorial}
              replayHint={t.replayTutorial}
              center={
                <div className="ct-fq-hub-attn-head">
                  <div className="ct-fq-hub-attn-big ct-ms-hub-title">{t.hubMemory}</div>
                  <div className="ct-fq-hub-attn-sub">{t.hubTag}</div>
                </div>
              }
            />
            <MemoModes
              t={t}
              isAr={isAr}
              playSfx={playSfx}
              onFree={() => gateWithTutorial(() => setPhase('freeIntro'), 'free')}
              onLevels={() => gateWithTutorial(() => setPhase('diff'), 'levels')}
              onChallenge={() => gateWithTutorial(() => setPhase('chal'), 'challenge')}
            />
          </div>
        </div>
      )}

      {phase === 'freeIntro' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center', padding: 24 }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('hub')} center={null} />
            <h2 className="ct-ms-free-title">{t.freeTitle}</h2>
            <p className="ct-ms-free-body">{t.freeSub}</p>
            <p className="ct-ms-free-body">{t.freeCount(freeStudyCount)}</p>
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={startFree}>
              {t.freeIntroReady}
            </button>
          </div>
        </div>
      )}

      {phase === 'diff' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              variant="paper"
              playSfx={playSfx}
              onBack={() => setPhase('hub')}
              center={<div className="ct-fq-training-title ct-fq-training-title-sm">{t.pickDiff}</div>}
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.pickDiffSub}</p>
            {MS_DIFF_KEYS.map((k) => (
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
                <span>{MS_DM[k].label}</span>
                <span className="ct-fq-dbg">{MS_DM[k].pop}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'levels' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              variant="paper"
              playSfx={playSfx}
              onBack={() => setPhase('diff')}
              center={
                <div className="ct-fq-training-title ct-fq-training-title-sm">{MS_DM[diffKey].label}</div>
              }
            />
            <p className="ct-fq-sub ct-fq-training-blurb">{t.levelsSub(MS_DM[diffKey].pop)}</p>
            <div className="ct-fq-lg ct-fq-lg-training">
              {Array.from({ length: MS_LEVELS_PER_TIER }, (_, i) => i + 1).map((lv) => {
                const un = isMemoSpanLevelUnlocked(diffKey, lv, doneMap);
                const dn = !!doneMap[`${diffKey}-${lv}`];
                const spec = specificationForLevel(diffKey, lv);
                return (
                  <button
                    key={lv}
                    type="button"
                    className={`ct-fq-lb ${un ? `ct-${MS_DM[diffKey].lvc}` : 'ct-lvk'}`}
                    disabled={!un}
                    onClick={() => {
                      if (!un) return;
                      playSfx('click');
                      startLevel(diffKey, lv);
                    }}
                  >
                    {lv}
                    {dn && <span className="ct-fq-lb-dn">★</span>}
                    {lv === 1 && diffKey === 'easy' && (
                      <span className="ct-ms-lv-badge">{isAr ? 'مقدمة' : 'Intro'}</span>
                    )}
                    <span className="ct-ms-lv-meta">
                      {t.levelMeta(spec.studyCount, spec.poolCount)}
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
            <TrainingMenuBar
              onBack={() => setPhase('hub')}
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
                      onClick={() => setChalNames(chalNames.filter((_, j) => j !== i))}
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
              onClick={() => {
                playSfx('click');
                openChallenge();
              }}
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
          roundLine={chalRoundsTotal > 1 ? t.roundNofM(chalRoundIdx + 1, chalRoundsTotal) : null}
          metaLine={t.chalMeta}
          instruction={t.handTo(chalNames[chalIdx])}
          bullets={[t.chalBulletSame, t.chalBulletPass]}
          startLabel={t.goReady}
          onStart={startChallengeRound}
          playSfx={playSfx}
        />
      )}

      {phase === 'play' && round && (
        <div className="ct-ms-play-wrap">
          <TrainingPlayHeader
            isAr={isAr}
            title={
              round.mode === 'level'
                ? t.levelHeader(round.diff, round.lv)
                : round.mode === 'challenge'
                  ? t.challengeHeader
                  : t.freeTitle
            }
            subtitle={headerSubtitle()}
            playSfx={playSfx}
            onMenu={() => {
              clearTimers();
              setRound(null);
              setPhase(
                round.mode === 'free' ? 'hub' : round.mode === 'challenge' ? 'chal' : 'levels',
              );
            }}
            onPause={null}
          />
          <div className="ct-ms-panel">
            {playStep === 'briefing' && briefing && (
              <div className="ct-ms-briefing">
                <h2 className="ct-ms-briefing-title">{briefing.headline}</h2>
                <p className="ct-ms-briefing-line">{briefing.watchLine}</p>
                <p className="ct-ms-briefing-line">{briefing.tapLine}</p>
                <p className="ct-ms-briefing-meta">{briefing.detailLine}</p>
                <button type="button" className="ct-ms-briefing-start" onClick={confirmBriefing}>
                  {briefing.startLabel}
                </button>
              </div>
            )}
            {playStep === 'study' && studyItem && (
              <>
                <p className="ct-ms-phase-label">{t.memorizePhase}</p>
                <div className="ct-ms-stim-wrap">
                  <MemoObject objectId={studyItem.objectId} isAr={isAr} size="lg" showName />
                </div>
              </>
            )}
            {playStep === 'ready' && (
              <div className="ct-ms-ready-block">
                <p className="ct-ms-phase-label">{t.readyForTest}</p>
                <button
                  type="button"
                  className="ct-ms-briefing-start"
                  onClick={() => {
                    playSfx('click');
                    beginTestPhase();
                  }}
                >
                  {t.startQuestions}
                </button>
              </div>
            )}
            {playStep === 'test' && round && (
              <div className="ct-ms-recall">
                <h3>{t.recallPrompt}</h3>
                <div className="ct-ms-recall-progress">
                  {t.recallProgress(tapsSoFar.length, round.studyItems.length)}
                </div>
                <div className="ct-ms-recall-grid">
                  {round.recallPool.map((objId, i) => {
                    const tappedAt = tapsSoFar.indexOf(objId);
                    const isTapped = tappedAt >= 0;
                    return (
                      <button
                        key={`${objId}-${i}`}
                        type="button"
                        className={`ct-ms-recall-item${isTapped ? ' ct-ms-recall-item--tapped' : ''}`}
                        disabled={isTapped || !!feedback}
                        onPointerDown={() => onRecallTap(objId)}
                      >
                        <MemoObject objectId={objId} isAr={isAr} size="md" />
                        {isTapped && <span className="ct-ms-recall-num">{tappedAt + 1}</span>}
                      </button>
                    );
                  })}
                </div>
                {feedback && (
                  <p className={`ct-ms-feedback ct-ms-feedback--${feedback}`}>
                    {feedback === 'ok' ? t.feedbackOk : t.wrongTap}
                  </p>
                )}
                {showCorrectSequence && (
                  <div className="ct-ms-correct-seq">
                    <p>{t.correctSeqLabel}</p>
                    <div className="ct-ms-correct-seq-row">
                      {round.studyItems.map((item, i) => (
                        <div key={i} className="ct-ms-correct-seq-item">
                          <span className="ct-ms-correct-seq-num">{i + 1}</span>
                          <MemoObject objectId={item.objectId} isAr={isAr} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'res' && lastResult?.type === 'level' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('levels')} center={null} />
            <p className="ct-ms-result-kicker">{lastResult.won ? t.resultsPass : t.resultsFail}</p>
            <p className="ct-ms-result-stars">
              {t.stars}: {'★'.repeat(lastResult.stars)}{'☆'.repeat(3 - lastResult.stars)}
            </p>
            <p className="ct-ms-result-meta">
              {t.scoreLabel}: {lastResult.grade.pct}% ({lastResult.grade.correctCount}/{lastResult.grade.total})
            </p>
            <p className="ct-ms-result-meta">
              {t.spanLabel}: {lastResult.grade.correctCount}
            </p>
            <div className="ct-ms-result-actions">
              {!lastResult.won && (
                <button
                  type="button"
                  className="ct-fq-btn ct-fq-btn-pri"
                  onClick={() => startLevel(lastResult.round.diff, lastResult.round.lv)}
                >
                  {t.retry}
                </button>
              )}
              {lastResult.won &&
                lastResult.round.lv < MS_LEVELS_PER_TIER &&
                isMemoSpanLevelUnlocked(
                  lastResult.round.diff,
                  lastResult.round.lv + 1,
                  { ...doneMap, [`${lastResult.round.diff}-${lastResult.round.lv}`]: true },
                ) && (
                  <button
                    type="button"
                    className="ct-fq-btn ct-fq-btn-pri"
                    onClick={() => startLevel(lastResult.round.diff, lastResult.round.lv + 1)}
                  >
                    {t.nextLv}
                  </button>
                )}
              <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('levels')}>
                {t.menu}
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'freeRes' && lastResult?.type === 'free' && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen" style={{ textAlign: 'center' }}>
            <TrainingMenuBar variant="paper" playSfx={playSfx} onBack={() => setPhase('hub')} center={null} />
            <p className="ct-ms-result-kicker">{lastResult.won ? t.resultsPass : t.resultsFail}</p>
            <p className="ct-ms-result-meta">
              {t.scoreLabel}: {lastResult.grade.pct}% ({lastResult.grade.correctCount}/{lastResult.grade.total})
            </p>
            <p className="ct-ms-result-meta">{t.freeCount(freeStudyCount)}</p>
            {profile.bestStudy != null && (
              <p className="ct-ms-result-meta">{t.freeBest(profile.bestStudy)}</p>
            )}
            <button type="button" className="ct-fq-btn ct-fq-btn-pri" onClick={startFree}>
              {t.freePlayAgain}
            </button>
            <button type="button" className="ct-fq-btn ct-fq-btn-ghost" onClick={() => setPhase('hub')}>
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {phase === 'chalRes' && lastResult?.type === 'challenge' && lastResult.rows && (
        <div className="ct-fq-training-shell ct-fq-training-shell--hub-light ct-ms-shell">
          <div className="ct-fq-screen ct-fq-training-screen">
            <TrainingMenuBar
              onBack={() => {
                setLastResult(null);
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
            {[...lastResult.rows].sort(compareMemoChallengeRows).map((row, i) => (
              <div key={row.nm} className={`ct-fq-lbr ct-fq-lbr-training ${i === 0 ? 'win' : ''}`}>
                <div className="ct-fq-lbrk">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div>
                  <div className="ct-fq-lbnm">{row.nm}</div>
                  <div className="ct-fq-lbdt">
                    {t.chalResDetail(
                      row.avgPct,
                      row.last?.correct ?? 0,
                      row.last?.total ?? 0,
                    )}
                  </div>
                </div>
                <div className="ct-fq-lbsc">{row.avgPct}%</div>
              </div>
            ))}
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-pri"
              onClick={() => {
                setLastResult(null);
                setChalSeed(null);
                setChalTurnOpen(false);
                setPhase('chal');
              }}
            >
              {t.newCh}
            </button>
            <button
              type="button"
              className="ct-fq-btn ct-fq-btn-ghost"
              onClick={() => {
                setLastResult(null);
                setPhase('hub');
              }}
            >
              {t.menu}
            </button>
          </div>
        </div>
      )}

      {tutorialQueue.length > 0 && (
        <MemoSpanTutorial
          kind={tutorialQueue[0].kind}
          isAr={isAr}
          playSfx={playSfx}
          onClose={advanceTutorial}
        />
      )}
    </div>
  );
}
