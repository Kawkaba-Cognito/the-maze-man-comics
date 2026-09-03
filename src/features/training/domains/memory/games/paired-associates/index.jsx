import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import DomCoach from '../../../../shared/tutorials/coach/DomCoach';
import { PAIRED_ASSOCIATES_COACH } from '../../../../shared/tutorials/coach/scripts/paired-associates';

const PairedAssociates3DProto = lazyWithRetry(() => import('./PairedAssociates3DProto'), 'pal-3d');

/*
 * Paired Associates (CANTAB PAL-style) — associative / episodic memory.
 *
 * Boxes open one at a time to reveal a symbol hidden inside (study phase). Then
 * a symbol is shown and you tap the box where it lived (recall phase). More
 * pairs are added as you succeed. Trains "what ↔ where" binding — the
 * hippocampus / medial-temporal-lobe facet that span and n-back don't.
 *
 * The 3D cards use a local illustrated object deck. Shared 3-mode flow
 * (Free / Levels / Challenge) and trial generation remain unchanged.
 */

/*
 * Config + trial generation live in palData.js (a .js module, so the pacing
 * gate can import them — plain Node cannot parse .jsx). Re-exported here so
 * the 3D proto and Group War keep importing from the game entry as before.
 */
export {
  SYMBOLS, STUDY_GAP, PAL_MIN_STUDY, LADDER, LADDER_LEVELS, levelCfg, palFreeCfg, buildPalTrial,
} from './palData.js';
import { SYMBOLS, STUDY_GAP, PAL_MIN_STUDY, LADDER_LEVELS, levelCfg, palFreeCfg, buildPalTrial } from './palData.js';

const ROUNDS_PER_LEVEL = 3;
const LEVEL_WIN = 2; // perfect trials needed

export function PalEngine({
  mode,
  // No `diff` — on the ladder, every mode is addressed by level. Group War
  // still passes one (catalog.js), and it is correctly ignored.
  level,
  seed,
  attempt,
  onResult,
  onExit,
  isAr,
  playSfx,
  awardPoints,
  awardFreeRun,
  coach,
}) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 3) : 0;
  const ppCorrectRef = useRef(0);
  const ppDoneRef = useRef(0);
  const boxesRef = useRef([]); // { fx, fy, symbol|null }
  const cueOrderRef = useRef([]); // [{ boxIdx, symbol }] shuffled for recall
  const cueIdxRef = useRef(0);
  const openRef = useRef(-1); // box open during study
  const flashRef = useRef({ until: 0, correctIdx: -1, wrongIdx: -1, symbol: '' });
  const subRef = useRef('study'); // study | recall | feedback
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const timerRef = useRef(null);
  const newTrialRef = useRef(null);
  // progression
  const pairsRef = useRef(2); // free/challenge adaptive
  const trialIdxRef = useRef(0);
  const wonRef = useRef(0);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const cfgRef = useRef({ boxes: 6, pairs: 3, study: 950 });

  /*
   * ── The live-board coach (COACH-PLAN.md) ──
   * Survival only. The study phase is a self-rescheduling `setTimeout` chain
   * that opens each box for `studyMs`, so a lesson running over it would spend
   * the very pairs it is telling the player how to memorise. The chain is
   * therefore HELD rather than the timers being guarded one by one — the same
   * choice as task-switch, and for the same reason.
   *
   * ⚠ The board is a three.js scene inside `.c3d-root` (`position: fixed;
   * inset: 0`). That element is the only correct box to measure anchors
   * against — a wrapper around the proto would measure 0×0, because everything
   * inside is out of flow. Hence `rootRef`/`coachSlot` on C3dProtoChrome.
   */
  const stageRef = useRef(null);
  const startStudyRef = useRef(null);
  const coachOpen = coach?.open || false;
  const coachHoldRef = useRef(Boolean(coach?.enabled && coach?.armed && mode === 'free'));

  const [hudStats, setHudStats] = useState([]);
  const [msg, setMsg] = useState('');
  const [cue, setCue] = useState('');
  const [sceneBoxes, setSceneBoxes] = useState([]);
  const [sceneOpen, setSceneOpen] = useState(-1);
  const [sceneFeedback, setSceneFeedback] = useState(null);
  const [scenePhase, setScenePhase] = useState('study');

  const cfg = useCallback(() => {
    if (mode === 'levels') return levelCfg(level);
    /* Pass n Play takes a LADDER LEVEL now, so ModeShell's depth picker actually
       reaches the engine. Group War still launches this in passplay with
       `level: null` (catalog.js `hardMode: 'passplay'`), and L25 is band 3 —
       8 boxes / 4 pairs, which is what its hard-coded config used to be. */
    if (mode === 'passplay') return levelCfg(level || 25);
    return palFreeCfg(pairsRef.current);
  }, [mode, level]);

  const updateHud = useCallback(() => {
    bestRef.current = Math.max(bestRef.current, cfgRef.current.pairs);
    if (mode === 'levels') {
      setHudStats([
        { value: level, label: isAr ? 'المستوى' : 'Level' },
        {
          value: `${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}`,
          label: isAr ? 'الجولة' : 'Trial',
        },
      ]);
    } else if (mode === 'passplay') {
      setHudStats([
        {
          value: `${ppDoneRef.current + 1}/${ppTrials}`,
          label: isAr ? 'الجولة' : 'Trial',
        },
        { value: ppCorrectRef.current, label: isAr ? 'صحيح' : 'Correct' },
      ]);
    } else {
      setHudStats([
        { value: cfgRef.current.pairs, label: isAr ? 'الأزواج' : 'Pairs' },
        { value: bestRef.current, label: isAr ? 'الأفضل' : 'Best' },
      ]);
    }
  }, [mode, level, isAr, ppTrials]);

  const advance = useCallback(
    (perfect) => {
      if (mode === 'levels') {
        trialIdxRef.current += 1;
        if (perfect) wonRef.current += 1;
        if (trialIdxRef.current >= ROUNDS_PER_LEVEL) {
          onResult({
            won: wonRef.current >= LEVEL_WIN,
            score: scoreRef.current,
            summary: isAr
              ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات كاملة`
              : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect trials`,
          });
          return true;
        }
      } else if (mode === 'passplay') {
        ppCorrectRef.current += correctRef.current;
        ppDoneRef.current += 1;
        if (ppDoneRef.current >= ppTrials) {
          onResult({ score: ppCorrectRef.current });
          return true;
        }
      } else {
        pairsRef.current = perfect ? pairsRef.current + 1 : Math.max(2, pairsRef.current - 1);
      }
      return false;
    },
    [isAr, mode, onResult, ppTrials],
  );

  const presentCue = useCallback(() => {
    const order = cueOrderRef.current;
    if (cueIdxRef.current >= order.length) {
      // trial finished
      const perfect = correctRef.current === totalRef.current;
      subRef.current = 'feedback';
      setScenePhase('feedback');
      setSceneOpen(-1);
      setSceneFeedback(null);
      setCue('');
      if (perfect) {
        playSfx?.('win');
        setMsg(isAr ? 'ممتاز ✓' : 'Perfect ✓');
      } else {
        playSfx?.('lose');
        setMsg(
          isAr
            ? `${correctRef.current}/${totalRef.current} صحيحة`
            : `${correctRef.current}/${totalRef.current} correct`,
        );
      }
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!advance(perfect)) newTrialRef.current?.();
      }, 1300);
      return;
    }
    subRef.current = 'recall';
    setScenePhase('recall');
    setSceneOpen(-1);
    setSceneFeedback(null);
    const cur = order[cueIdxRef.current];
    setCue(cur.symbol);
    setMsg(isAr ? 'أين كان هذا؟' : 'Where was this?');
  }, [advance, isAr, playSfx]);

  const newTrial = useCallback(() => {
    const c = cfg();
    cfgRef.current = c;
    const { boxes: N, pairs: K, study: studyMs } = c;
    const cols = Math.ceil(Math.sqrt(N));
    const rows = Math.ceil(N / cols);
    const cells = [];
    for (let rr2 = 0; rr2 < rows; rr2++) for (let cc = 0; cc < cols; cc++) cells.push([cc, rr2]);
    cells.sort(() => rng() - 0.5);
    const boxes = [];
    for (let i = 0; i < N; i++) {
      const [cc, rr2] = cells[i];
      boxes.push({ fx: (cc + 0.5) / cols, fy: (rr2 + 0.5) / rows, symbol: null });
    }
    const trial = buildPalTrial({ boxes: N, pairs: K }, rng);
    trial.boxIdxs.forEach((bi) => {
      boxes[bi].symbol = trial.boxes[bi].symbol;
    });
    boxesRef.current = boxes;
    setSceneBoxes(boxes);
    setSceneOpen(-1);
    setSceneFeedback(null);
    setScenePhase('study');
    cueOrderRef.current = trial.cueOrder;
    cueIdxRef.current = 0;
    correctRef.current = 0;
    totalRef.current = K;
    updateHud();
    setCue('');
    setMsg(isAr ? 'احفظ المواقع…' : 'Memorize the locations…');
    subRef.current = 'study';
    // reveal item-boxes one at a time
    const studyOrder = trial.studyOrder;
    const step = (k) => {
      if (k >= studyOrder.length) {
        openRef.current = -1;
        setSceneOpen(-1);
        presentCue();
        return;
      }
      openRef.current = studyOrder[k];
      setSceneOpen(studyOrder[k]);
      timerRef.current = setTimeout(() => {
        openRef.current = -1;
        setSceneOpen(-1);
        timerRef.current = setTimeout(() => step(k + 1), STUDY_GAP);
      }, studyMs);
    };
    clearTimeout(timerRef.current);
    /* A ready beat before the first box opens. At 500ms the first symbol had
       come and gone before the player had finished looking at the board — the
       "starts very fast" half of the 2026-08-15 report. The study time fix
       alone does not help if the sequence begins before you are watching. */
    startStudyRef.current = () => step(0);
    /* Held while the lesson is up — see the coach block above. */
    if (coachHoldRef.current) return;
    timerRef.current = setTimeout(() => step(0), 1100);
  }, [cfg, isAr, presentCue, updateHud, rng]);
  newTrialRef.current = newTrial;

  const onPick = useCallback(
    (hit) => {
      if (subRef.current !== 'recall') return;
      const cur = cueOrderRef.current[cueIdxRef.current];
      if (!cur) return;
      const ok = hit === cur.boxIdx;
      if (ok) {
        correctRef.current += 1;
        playSfx?.('correct');
        flashRef.current = {
          until: performance.now() + 500,
          correctIdx: hit,
          wrongIdx: -1,
          symbol: cur.symbol,
        };
      } else {
        playSfx?.('wrong');
        flashRef.current = {
          until: performance.now() + 800,
          correctIdx: cur.boxIdx,
          wrongIdx: hit,
          symbol: cur.symbol,
        };
      }
      setSceneFeedback({ correctIdx: cur.boxIdx, wrongIdx: ok ? -1 : hit, symbol: cur.symbol });
      setScenePhase('feedback');
      cueIdxRef.current += 1;
      subRef.current = 'feedback';
      setCue('');
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(presentCue, ok ? 450 : 850);
    },
    [playSfx, presentCue],
  );

  useEffect(() => {
    newTrial();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitGame = () => {
    if (mode === 'free') awardFreeRun?.('pairedAssoc', bestRef.current);
    onExit?.();
  };

  // Open the lesson at the top of a Survival run, before the first box opens.
  useEffect(() => {
    if (!coach?.armed || coach.open || mode !== 'free') return;
    coach.begin();
  }, [coach, mode]);

  /* Release the study chain. One place, so finishing, skipping and Escape all
     resume the game identically. */
  const endCoach = useCallback(() => {
    coachHoldRef.current = false;
    coach?.end();
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => startStudyRef.current?.(), 500);
  }, [coach]);

  return (
    <Suspense fallback={<div className="c3d-root" />}>
      <PairedAssociates3DProto
        isAr={isAr}
        playSfx={playSfx}
        onBack={exitGame}
        boxes={sceneBoxes}
        openIndex={sceneOpen}
        feedback={sceneFeedback}
        cue={cue}
        phase={scenePhase}
        question={msg}
        stats={hudStats}
        interactive={scenePhase === 'recall'}
        onPick={onPick}
        rootRef={stageRef}
        coachSlot={coachOpen ? (
          <DomCoach
            isAr={isAr}
            playSfx={playSfx}
            stageRef={stageRef}
            pack={PAIRED_ASSOCIATES_COACH}
            onFinish={endCoach}
            onSkip={endCoach}
          />
        ) : null}
      />
    </Suspense>
  );
}

export default function PairedAssociatesGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_mem_pal"
      scienceId="paired-associates"
      title={{ en: 'Pair Match', ar: 'مطابقة الأزواج' }}
      hints={{
        free: { en: 'Endless practice — pairs grow', ar: 'تدريب مفتوح — تزداد الأزواج' },
        levels: { en: '70 levels · a new twist every 10', ar: '٧٠ مستوى · جديد كل ١٠' },
        pass: {
          en: 'Same pairs for all · pass the device',
          ar: 'نفس الأزواج للجميع · مرّر الجهاز',
        },
      }}
      /* ONE LADDER — no easy/med/hard. See palData.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{
        trials: 3,
        scoreLabel: { en: 'correct', ar: 'صحيحة' },
        lowerBetter: false,
      }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <PalEngine
          key={`${p.mode}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}
