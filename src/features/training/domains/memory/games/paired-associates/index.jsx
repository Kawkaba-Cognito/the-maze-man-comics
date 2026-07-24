import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';

const PairedAssociates3DProto = lazyWithRetry(() => import('./PairedAssociates3DProto'), 'pal-3d');

/*
 * Paired Associates (CANTAB PAL-style) — associative / episodic memory.
 *
 * Boxes open one at a time to reveal a symbol hidden inside (study phase). Then
 * a symbol is shown and you tap the box where it lived (recall phase). More
 * pairs are added as you succeed. Trains "what ↔ where" binding — the
 * hippocampus / medial-temporal-lobe facet that span and n-back don't.
 *
 * Procedural Canvas, zero assets. Shared 3-mode flow (Free / Levels / Challenge).
 */

// Exported so the 3D proto studies + recalls the SAME pairs with the same counts,
// timings and adaptive progression as 2D free mode.
export const SYMBOLS = ['★', '▲', '●', '■', '◆', '✚', '✦', '❤', '☀', '☾', '♣', '♠'];
export const STUDY_GAP = 240;
const ROUNDS_PER_LEVEL = 3;
const LEVEL_WIN = 2;   // perfect trials needed
const CHAL_LIVES = 3;

export const BASE = {
  easy: { boxes: 4, pairs: 2, study: 1100 },
  med: { boxes: 6, pairs: 3, study: 950 },
  hard: { boxes: 8, pairs: 4, study: 820 },
};
export function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  const boxes = Math.min(b.boxes + Math.round(f * 4), 12);
  return { boxes, pairs: Math.min(b.pairs + Math.round(f * 4), boxes), study: Math.max(520, Math.round(b.study - f * 500)) };
}

/** Free/Survival config — 6 boxes, pairs grow adaptively, study time shrinks. */
export function palFreeCfg(pairs) {
  return { boxes: 6, pairs: Math.min(pairs, 6), study: Math.max(620, 1050 - pairs * 40) };
}

/**
 * Pure PAL trial generator (same draw order as the 2D engine's newTrial): choose
 * K symbols, K box slots, build the study reveal order + shuffled recall cues.
 */
export function buildPalTrial(cfg, rng) {
  const { boxes: N, pairs: K } = cfg;
  const syms = [...SYMBOLS].sort(() => rng() - 0.5).slice(0, K);
  const boxIdxs = [...Array(N).keys()].sort(() => rng() - 0.5).slice(0, K);
  const boxes = Array.from({ length: N }, () => ({ symbol: null }));
  boxIdxs.forEach((bi, j) => { boxes[bi].symbol = syms[j]; });
  const cueOrder = boxIdxs.map((bi) => ({ boxIdx: bi, symbol: boxes[bi].symbol })).sort(() => rng() - 0.5);
  const studyOrder = [...boxIdxs].sort(() => rng() - 0.5);
  return { boxes, boxIdxs, cueOrder, studyOrder, total: K };
}

export function PalEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 3) : 0;
  const ppCorrectRef = useRef(0);
  const ppDoneRef = useRef(0);
  const boxesRef = useRef([]);        // { fx, fy, symbol|null }
  const cueOrderRef = useRef([]);     // [{ boxIdx, symbol }] shuffled for recall
  const cueIdxRef = useRef(0);
  const openRef = useRef(-1);         // box open during study
  const flashRef = useRef({ until: 0, correctIdx: -1, wrongIdx: -1, symbol: '' });
  const subRef = useRef('study');     // study | recall | feedback
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const timerRef = useRef(null);
  // progression
  const pairsRef = useRef(2);         // free/challenge adaptive
  const trialIdxRef = useRef(0);
  const wonRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const scoreRef = useRef(0);
  const bestRef = useRef(0);
  const cfgRef = useRef({ boxes: 6, pairs: 3, study: 950 });

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [hud, setHud] = useState('');
  const [msg, setMsg] = useState('');
  const [cue, setCue] = useState('');
  const [sceneBoxes, setSceneBoxes] = useState([]);
  const [sceneOpen, setSceneOpen] = useState(-1);
  const [sceneFeedback, setSceneFeedback] = useState(null);
  const [scenePhase, setScenePhase] = useState('study');

  const cfg = useCallback(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return { boxes: 8, pairs: 4, study: 900 };
    return palFreeCfg(pairsRef.current);
  }, [mode, diff, level]);

  const updateHud = useCallback(() => {
    bestRef.current = Math.max(bestRef.current, cfgRef.current.pairs);
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · جولة ${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}` : `Lvl ${level} · Trial ${trialIdxRef.current + 1}/${ROUNDS_PER_LEVEL}`);
    else if (mode === 'passplay') setHud(isAr ? `جولة ${ppDoneRef.current + 1}/${ppTrials} · ✓${ppCorrectRef.current}` : `Trial ${ppDoneRef.current + 1}/${ppTrials} · ✓${ppCorrectRef.current}`);
    else setHud(isAr ? `أزواج ${cfgRef.current.pairs} · أفضل ${bestRef.current}` : `Pairs ${cfgRef.current.pairs} · best ${bestRef.current}`);
  }, [mode, level, isAr, ppTrials]);

  const advance = useCallback((perfect) => {
    if (mode === 'levels') {
      trialIdxRef.current += 1;
      if (perfect) wonRef.current += 1;
      if (trialIdxRef.current >= ROUNDS_PER_LEVEL) {
        onResult({ won: wonRef.current >= LEVEL_WIN, score: scoreRef.current, summary: isAr ? `${wonRef.current}/${ROUNDS_PER_LEVEL} جولات كاملة` : `${wonRef.current}/${ROUNDS_PER_LEVEL} perfect trials` });
        return true;
      }
    } else if (mode === 'passplay') {
      ppCorrectRef.current += correctRef.current;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppCorrectRef.current }); return true; }
    } else {
      pairsRef.current = perfect ? pairsRef.current + 1 : Math.max(2, pairsRef.current - 1);
    }
    return false;
  }, [isAr, mode, onResult, ppTrials]);

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
      if (perfect) { playSfx?.('win'); setMsg(isAr ? 'ممتاز ✓' : 'Perfect ✓'); }
      else { playSfx?.('lose'); setMsg(isAr ? `${correctRef.current}/${totalRef.current} صحيحة` : `${correctRef.current}/${totalRef.current} correct`); }
      clearTimeout(timerRef.current);
      // eslint-disable-next-line no-use-before-define
      timerRef.current = setTimeout(() => { if (!advance(perfect)) newTrial(); }, 1300);
      return;
    }
    subRef.current = 'recall';
    setScenePhase('recall');
    setSceneOpen(-1);
    setSceneFeedback(null);
    const cur = order[cueIdxRef.current];
    setCue(cur.symbol);
    setMsg(isAr ? 'أين كان هذا؟' : 'Where was this?');
    // eslint-disable-next-line no-use-before-define
  }, [advance, isAr, playSfx]);

  const newTrial = useCallback(() => {
    const c = cfg(); cfgRef.current = c;
    const { boxes: N, pairs: K, study: studyMs } = c;
    const cols = Math.ceil(Math.sqrt(N));
    const rows = Math.ceil(N / cols);
    const cells = [];
    for (let rr2 = 0; rr2 < rows; rr2++) for (let cc = 0; cc < cols; cc++) cells.push([cc, rr2]);
    cells.sort(() => rng() - 0.5);
    const boxes = [];
    for (let i = 0; i < N; i++) {
      const [cc, rr2] = cells[i];
      boxes.push({ fx: (cc + 0.5 + (rng() - 0.5) * 0.4) / cols, fy: (rr2 + 0.5 + (rng() - 0.5) * 0.4) / rows, symbol: null });
    }
    const trial = buildPalTrial({ boxes: N, pairs: K }, rng);
    trial.boxIdxs.forEach((bi) => { boxes[bi].symbol = trial.boxes[bi].symbol; });
    boxesRef.current = boxes;
    setSceneBoxes(boxes);
    setSceneOpen(-1);
    setSceneFeedback(null);
    setScenePhase('study');
    cueOrderRef.current = trial.cueOrder;
    cueIdxRef.current = 0; correctRef.current = 0; totalRef.current = K;
    updateHud();
    setCue('');
    setMsg(isAr ? 'احفظ المواقع…' : 'Memorize the locations…');
    subRef.current = 'study';
    // reveal item-boxes one at a time
    const studyOrder = trial.studyOrder;
    const step = (k) => {
      if (k >= studyOrder.length) { openRef.current = -1; setSceneOpen(-1); presentCue(); return; }
      openRef.current = studyOrder[k];
      setSceneOpen(studyOrder[k]);
      timerRef.current = setTimeout(() => {
        openRef.current = -1;
        setSceneOpen(-1);
        timerRef.current = setTimeout(() => step(k + 1), STUDY_GAP);
      }, studyMs);
    };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => step(0), 500);
  }, [cfg, isAr, presentCue, updateHud, rng]);

  const onPick = useCallback((hit) => {
    if (subRef.current !== 'recall') return;
    const cur = cueOrderRef.current[cueIdxRef.current];
    if (!cur) return;
    const ok = hit === cur.boxIdx;
    if (ok) { correctRef.current += 1; playSfx?.('correct'); flashRef.current = { until: performance.now() + 500, correctIdx: hit, wrongIdx: -1, symbol: cur.symbol }; }
    else { playSfx?.('wrong'); flashRef.current = { until: performance.now() + 800, correctIdx: cur.boxIdx, wrongIdx: hit, symbol: cur.symbol }; }
    setSceneFeedback({ correctIdx: cur.boxIdx, wrongIdx: ok ? -1 : hit, symbol: cur.symbol });
    setScenePhase('feedback');
    cueIdxRef.current += 1;
    subRef.current = 'feedback';
    setCue('');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(presentCue, ok ? 450 : 850);
  }, [playSfx, presentCue]);

  useEffect(() => {
    newTrial();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exitGame = () => {
    if (mode === 'free') awardFreeRun?.('pairedAssoc', bestRef.current);
    onExit?.();
  };

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
        hud={`${hud}${mode === 'levels' ? ` · ${score}` : ''}`}
        interactive={scenePhase === 'recall'}
        onPick={onPick}
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
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same pairs for all · pass the device', ar: 'نفس الأزواج للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 3, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <PalEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}
