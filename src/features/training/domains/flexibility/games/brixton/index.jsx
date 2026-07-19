import React, { useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import CosmosCharacter from '../../../../../character/CosmosCharacter';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const Brixton3DProto = lazyWithRetry(() => import('./Brixton3DProto'), 'brixton-3d');

/*
 * Kawkab Hops — the Brixton Spatial Anticipation Test as a training game.  [flexibility]
 *
 * Kawkab hops between nodes along a HIDDEN rule; you continue the pattern for a
 * few hops. Crack it and the rule SILENTLY changes — you must drop the old
 * pattern and read the new one (Burgess & Shallice, 1997). Miss and he repeats
 * the same pattern. "Continue" (not "copy his path") keeps it rule-inference.
 *
 * Modes (shared ModeShell): Survival (60s) · Levels (100 each × 3 diff) · Pass n Play.
 */

const ACC = '#b84878';
const OK = '#3a9d5d';
const BAD = '#cf5b50';

const COLS = 5;
const PER_LEVEL = 8;
const WIN_ACC = 0.625;
const PP_TRIALS = 8;

// The 10-node Brixton anticipation rules (2 rows of 5). Shared with the 3D proto
// so it plays the EXACT same hidden-rule game.
export const RULES = [
  (i) => (i + 1) % 10,   // 0: +1
  (i) => (i + 9) % 10,   // 1: -1
  (i) => (i + 2) % 10,   // 2: +2
  (i) => 9 - i,          // 3: mirror
  (i) => (i + 5) % 10,   // 4: other row
];

export const RULE_META = [
  { en: '+1 step', ar: '+١ خطوة' },
  { en: '−1 step', ar: '−١ خطوة' },
  { en: '+2 skip', ar: '+٢ تخطّي' },
  { en: 'Mirror', ar: 'مرآة' },
  { en: 'Flip row', ar: 'صفّ معاكس' },
];

export function cfgFor(mode, diff, level, ramp) {
  if (mode === 'free') {
    const r = ramp ?? 0;
    const rules = r < 0.28 ? [0, 1] : r < 0.55 ? [0, 1, 2] : r < 0.78 ? [0, 1, 2, 3] : [0, 1, 2, 3, 4];
    return {
      rules,
      demo: r < 0.4 ? 2 : r < 0.7 ? 3 : 4,
      tries: r < 0.45 ? 2 : 3,
      demoMs: Math.round(520 - r * 180),
      animMs: Math.round(360 - r * 100),
    };
  }
  if (mode === 'passplay') return { rules: [0, 1, 2, 3, 4], demo: 3, tries: 3, demoMs: 460, animMs: 320 };
  const f = ((level || 1) - 1) / 99;
  const rules = diff === 'easy'
    ? (f < 0.55 ? [0, 1] : [0, 1, 2])
    : diff === 'hard'
      ? [0, 1, 2, 3, 4]
      : (f < 0.45 ? [0, 1, 2] : [0, 1, 2, 3, 4]);
  return {
    rules,
    demo: diff === 'easy' ? 2 : diff === 'hard' && f > 0.55 ? 4 : 3,
    tries: diff === 'easy' ? 2 : (diff === 'hard' && f > 0.55 ? 4 : 3),
    demoMs: Math.round((diff === 'easy' ? 580 : 500) - f * 140),
    animMs: diff === 'hard' ? 300 : 340,
  };
}

function DemoTrail({ centers, path, revealCount }) {
  if (!centers.length || path.length < 2 || revealCount < 1) return null;
  const slice = path.slice(0, revealCount + 1);
  const pts = slice.map((i) => centers[i]).filter(Boolean);
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <svg className="ct-bx-trail" aria-hidden="true">
      <path className="ct-bx-trail-path" d={d} />
      {pts.slice(1).map((p, i) => (
        <circle key={i} className="ct-bx-trail-hop" cx={p.x} cy={p.y} r="4" />
      ))}
    </svg>
  );
}

export function BrixtonEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
  const ppTrials = mode === 'passplay' ? (attempt?.trials || PP_TRIALS) : 0;
  const isSurvival = mode === 'free';

  const posRef = useRef(0);
  const ruleRef = useRef(0);
  const startRef = useRef(0);
  const cfgRef = useRef(cfgFor(mode, diff, level, 0));
  const demoPathRef = useRef([]);
  const patternIdxRef = useRef(-1);
  const phaseRef = useRef('demo');
  const tryCountRef = useRef(0);
  const timerRef = useRef(0);
  const attemptsRef = useRef(0);
  const solvedRef = useRef(0);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const rampRef = useRef(0);
  const finishedRef = useRef(false);
  const stats = useRef({ best: 0, cracked: 0 });

  const [runId, setRunId] = useState(0);
  const [kwPos, setKwPos] = useState(0);
  const [hopKey, setHopKey] = useState(0);
  const [phase, setPhase] = useState('demo');
  const [demoPath, setDemoPath] = useState([]);
  const [demoReveal, setDemoReveal] = useState(0);
  const [playerSteps, setPlayerSteps] = useState([]);
  const [outcome, setOutcome] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [shiftToast, setShiftToast] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(null);
  const [centers, setCenters] = useState([]);

  const wrapRef = useRef(null);
  const cellRefs = useRef([]);

  const t = useMemo(() => ({
    watch: isAr ? 'راقب النمط — اكتشف القاعدة الخفية' : 'Watch the hops — find the hidden rule',
    your: isAr ? 'دورك — أكمل القاعدة (لا تنسخ المسار فقط)' : 'Your turn — continue the rule (don’t just copy)',
    yes: isAr ? 'أحسنت! قاعدة جديدة…' : 'Cracked! New rule coming…',
    no: isAr ? 'ليست هذه — راقب العرض مجدداً' : 'Not that one — watch the demo again',
    noLevel: isAr ? 'خطأ — نمط جديد' : 'Miss — next pattern',
    shift: isAr ? 'قاعدة جديدة — راقب القفزات' : 'New rule — watch the hops',
    ruleNote: isAr ? 'قاعدة خفية واحدة — أيّ نوع من هذه؟' : 'One hidden rule — which type is it?',
    rowTop: isAr ? 'صف علوي' : 'Top row',
    rowBot: isAr ? 'صف سفلي' : 'Bottom row',
    title: isAr ? 'قفزات كوكب' : 'Kawkab Hops',
    over: isAr ? 'انتهى البقاء' : 'Survival over',
    again: isAr ? 'العب مجدداً' : 'Play again',
    menu: isAr ? 'القائمة' : 'Menu',
    cracked: isAr ? 'محلولة' : 'cracked',
    best: isAr ? 'أفضل سلسلة' : 'best streak',
    node: (n) => (isAr ? `عقدة ${n}` : `Node ${n}`),
  }), [isAr]);

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimeout(timerRef.current);
    setOver({ solved: solvedRef.current, score: scoreRef.current, best: stats.current.best, cracked: stats.current.cracked });
    awardFreeRun?.('brixton', stats.current.best || solvedRef.current);
    playSfx?.('error');
  }, [playSfx, awardFreeRun]);

  const remaining = useSurvivalCountdown(isSurvival && !over, finishSurvival);
  rampRef.current = isSurvival ? survivalRampFromRemaining(remaining) : 0;

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wr = wrap.getBoundingClientRect();
    setCenters(cellRefs.current.map((el) => {
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return { x: r.left - wr.left + r.width / 2, y: r.top - wr.top + r.height / 2 };
    }));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [measure, over, demoPath, phase]);

  const move = useCallback((to) => {
    posRef.current = to;
    setKwPos(to);
    setHopKey((k) => k + 1);
  }, []);

  const genPattern = useCallback(() => {
    patternIdxRef.current += 1;
    const rng = isSurvival
      ? makeRng((runId + 1) * 104729 + patternIdxRef.current * 7919 + ((seed ?? 1) >>> 0))
      : makeRng(((seed ?? 1) >>> 0) + patternIdxRef.current * 7919 + runId * 104729);
    const cfg = isSurvival ? cfgFor(mode, diff, level, rampRef.current) : cfgFor(mode, diff, level, 0);
    const rule = cfg.rules[Math.floor(rng() * cfg.rules.length)];
    const start = Math.floor(rng() * 10);
    cfgRef.current = cfg;
    ruleRef.current = rule;
    startRef.current = start;
    const path = [start];
    let p = start;
    for (let k = 0; k < cfg.demo; k++) {
      p = RULES[rule](p);
      path.push(p);
    }
    demoPathRef.current = path;
    setDemoPath(path);
    setDemoReveal(0);
  }, [isSurvival, mode, diff, level, seed, runId]);

  const playDemo = useCallback(() => {
    clearTimeout(timerRef.current);
    if (finishedRef.current) return;
    const path = demoPathRef.current;
    const { demoMs, animMs } = cfgRef.current;
    setPlayerSteps([]);
    setWrong(null);
    setOutcome(null);
    setShiftToast(false);
    setDemoReveal(0);
    phaseRef.current = 'demo';
    setPhase('demo');
    let step = 0;
    const hopNext = () => {
      if (finishedRef.current) return;
      if (step >= path.length) {
        timerRef.current = setTimeout(() => {
          if (finishedRef.current) return;
          tryCountRef.current = 0;
          phaseRef.current = 'your';
          setPhase('your');
        }, 420);
        return;
      }
      playSfx?.('click');
      move(path[step]);
      setDemoReveal(step);
      step += 1;
      timerRef.current = setTimeout(hopNext, animMs + demoMs);
    };
    timerRef.current = setTimeout(hopNext, 280);
  }, [move, playSfx]);

  const nextPattern = useCallback((fresh) => {
    if (mode === 'levels' && attemptsRef.current >= PER_LEVEL) {
      const acc = solvedRef.current / PER_LEVEL;
      onResult({
        won: acc >= WIN_ACC,
        score: scoreRef.current,
        summary: `${solvedRef.current}/${PER_LEVEL} ${t.cracked} · ${Math.round(acc * 100)}% · ${t.best} ${stats.current.best}`,
      });
      return;
    }
    if (mode === 'passplay' && attemptsRef.current >= ppTrials) {
      onResult({ score: solvedRef.current });
      return;
    }
    if (finishedRef.current) return;
    if (fresh) genPattern();
    playDemo();
  }, [mode, ppTrials, onResult, genPattern, playDemo, t.cracked, t.best]);

  const tap = useCallback((idx) => {
    if (phaseRef.current !== 'your' || finishedRef.current) return;
    const expect = RULES[ruleRef.current](posRef.current);
    if (idx === expect) {
      playSfx?.('click');
      move(expect);
      setPlayerSteps((prev) => [...prev, expect]);
      tryCountRef.current += 1;
      scoreRef.current += 6;
      setScore(scoreRef.current);
      if (tryCountRef.current >= cfgRef.current.tries) {
        clearTimeout(timerRef.current);
        attemptsRef.current += 1;
        setAttempts(attemptsRef.current);
        solvedRef.current += 1;
        setSolved(solvedRef.current);
        streakRef.current += 1;
        stats.current.best = Math.max(stats.current.best, streakRef.current);
        stats.current.cracked += 1;
        setStreak(streakRef.current);
        scoreRef.current += 18 + Math.min(streakRef.current, 10) * 3;
        setScore(scoreRef.current);
        awardPoints?.(1);
        phaseRef.current = 'reveal';
        setPhase('reveal');
        setOutcome('solved');
        setShiftToast(true);
        playSfx?.('win');
        timerRef.current = setTimeout(() => nextPattern(true), 1100);
      }
    } else {
      clearTimeout(timerRef.current);
      attemptsRef.current += 1;
      setAttempts(attemptsRef.current);
      streakRef.current = 0;
      setStreak(0);
      setWrong({ pick: idx, correct: expect });
      move(expect);
      playSfx?.('lose');
      phaseRef.current = 'reveal';
      setPhase('reveal');
      setOutcome('failed');
      const fresh = !isSurvival;
      timerRef.current = setTimeout(() => nextPattern(fresh), 1000);
    }
  }, [move, playSfx, awardPoints, nextPattern, isSurvival]);

  const restartSurvival = () => {
    clearTimeout(timerRef.current);
    attemptsRef.current = 0;
    solvedRef.current = 0;
    streakRef.current = 0;
    scoreRef.current = 0;
    patternIdxRef.current = -1;
    finishedRef.current = false;
    stats.current = { best: 0, cracked: 0 };
    setAttempts(0);
    setSolved(0);
    setStreak(0);
    setScore(0);
    setOver(null);
    setShiftToast(false);
    setRunId((n) => n + 1);
  };

  useEffect(() => {
    finishedRef.current = false;
    attemptsRef.current = 0;
    solvedRef.current = 0;
    streakRef.current = 0;
    scoreRef.current = 0;
    patternIdxRef.current = -1;
    stats.current = { best: 0, cracked: 0 };
    genPattern();
    move(startRef.current);
    playDemo();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const hud = mode === 'levels'
    ? `${attempts}/${PER_LEVEL} · ✓${solved} · ${t.best} ${streak}`
    : mode === 'passplay'
      ? `${attempts}/${ppTrials} · ✓${solved}`
      : `✓${solved} · ${score} · ${stats.current.cracked} ${t.cracked}${streak > 1 ? ` · 🔥${streak}` : ''}`;

  const phaseBanner = outcome === 'solved'
    ? t.yes
    : outcome === 'failed'
      ? (isSurvival ? t.no : t.noLevel)
      : phase === 'your'
        ? t.your
        : t.watch;

  const phaseCls = outcome === 'solved'
    ? 'ct-bx-phase-banner--ok'
    : outcome === 'failed'
      ? 'ct-bx-phase-banner--bad'
      : phase === 'your'
        ? 'ct-bx-phase-banner--your'
        : 'ct-bx-phase-banner--watch';

  const rootCls = `ct-bx-root${cosmos ? ' c3d-embed-root' : ''}`;

  if (over && isSurvival) {
    return (
      <div className={rootCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-bx-over-wrap">
          <div className="ct-bx-over-card">
            <CosmosCharacter size={72} mood="proud" glow pose="cheer" />
            <h2 className="ct-bx-over-title">{t.over}</h2>
            <p className="ct-bx-over-sub">
              {`✓ ${over.solved} ${t.cracked} · ${over.score} ${isAr ? 'نقطة' : 'pts'} · ${t.best} ${over.best}`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <button type="button" className="ct-bx-btn-pri" onClick={() => { playSfx?.('click'); restartSurvival(); }}>{t.again}</button>
              <button type="button" className="ct-bx-btn-ghost" onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isYour = phase === 'your';
  const demoHopIndex = Object.fromEntries(demoPath.map((node, i) => [node, i]));
  const playerSet = new Set(playerSteps);
  const kw = centers[kwPos];
  const animMs = cfgRef.current.animMs;

  return (
    <div className={rootCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      {isSurvival && <SurvivalCountdownBar remaining={remaining} color={ACC} />}

      <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
        {!cosmos && (
          <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        )}
        {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{t.title}</div>
          <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div className="ct-bx-body">
        <p className={`ct-bx-phase-banner ${phaseCls}`} role="status">{phaseBanner}</p>

        <div className="ct-bx-try-dots">
          {isYour && Array.from({ length: cfgRef.current.tries }).map((_, i) => (
            <span key={i} className={`ct-bx-try-dot${i < playerSteps.length ? ' ct-bx-try-dot--done' : ''}`} />
          ))}
        </div>

        <p className="ct-bx-rule-note">{t.ruleNote}</p>
        <div className="ct-bx-rule-strip" aria-hidden="true">
          {RULE_META.map((m, i) => (
            <span key={i} className="ct-bx-rule-pill">{isAr ? m.ar : m.en}</span>
          ))}
        </div>

        {shiftToast && outcome === 'solved' && (
          <p className="ct-bx-shift-toast" role="status">{t.shift}</p>
        )}

        <div className="ct-bx-stage-wrap">
          <div ref={wrapRef} className="ct-bx-board">
            <DemoTrail centers={centers} path={demoPath} revealCount={demoReveal} />

            <div className="ct-bx-row-labels" aria-hidden="true">
              <span className="ct-bx-row-label">{t.rowTop}</span>
            </div>

            <div className="ct-bx-grid">
              {Array.from({ length: 10 }).map((_, i) => {
                const hopN = demoHopIndex[i];
                const inDemo = hopN != null;
                const inPlayer = playerSet.has(i);
                const isCorrectReveal = outcome === 'failed' && wrong && i === wrong.correct;
                const isWrongPick = outcome === 'failed' && wrong && i === wrong.pick && wrong.pick !== wrong.correct;
                const cls = [
                  'ct-bx-node',
                  inDemo && !inPlayer ? 'ct-bx-node--demo' : '',
                  inPlayer ? 'ct-bx-node--player' : '',
                  isYour ? 'ct-bx-node--live' : '',
                  isCorrectReveal ? 'ct-bx-node--reveal-ok' : '',
                  isWrongPick ? 'ct-bx-node--reveal-bad' : '',
                ].filter(Boolean).join(' ');
                return (
                  <button
                    key={i}
                    ref={(el) => { cellRefs.current[i] = el; }}
                    type="button"
                    className={cls}
                    onClick={() => tap(i)}
                    disabled={!isYour}
                    aria-label={t.node(i + 1)}
                  >
                    {inDemo && hopN > 0 && !inPlayer && (
                      <span className="ct-bx-node-hop">{hopN}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="ct-bx-row-labels" aria-hidden="true" style={{ marginTop: 4, marginBottom: 0 }}>
              <span className="ct-bx-row-label">{t.rowBot}</span>
            </div>

            {kw && (
              <div
                className="ct-bx-kw"
                style={{
                  transform: `translate(${kw.x}px, ${kw.y}px)`,
                  transition: `transform ${animMs}ms cubic-bezier(.4,0,.2,1)`,
                }}
              >
                <div className="ct-bx-kw-inner">
                  <div key={hopKey} style={{ animation: `bx-hop ${animMs}ms ease-out` }}>
                    <CosmosCharacter
                      size={52}
                      faceOnly
                      mood={outcome === 'solved' ? 'proud' : outcome === 'failed' ? 'tired' : 'focused'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KawkabHopsGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <Brixton3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_flx_brixton"
      scienceId="brixton"
      title={{ en: 'Kawkab Hops', ar: 'قفزات كوكب' }}
      hints={{
        free: { en: '60s survival · rules stack up · patterns speed up', ar: '٦٠ث بقاء · القواعد تتراكم · الأنماط تتسارع' },
        levels: { en: '8 patterns/level · longer demos on hard', ar: '٨ أنماط/مرحلة · عروض أطول في الصعب' },
        pass: { en: 'Same patterns for everyone · pass the device', ar: 'نفس الأنماط للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRIALS, scoreLabel: { en: 'cracked', ar: 'محلول' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('flexibility'),
      }]}
      renderEngine={(p) => (
        <BrixtonEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}
