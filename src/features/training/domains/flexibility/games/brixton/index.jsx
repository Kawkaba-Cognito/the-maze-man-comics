import React, { useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import CosmosCharacter from '../../../../../character/CosmosCharacter';

/*
 * Kawkab Hops — the Brixton Spatial Anticipation Test as a training game.  [flexibility]
 *
 * Kawkab hops between nodes along a HIDDEN rule; you continue the pattern for a
 * few hops. Crack it and the rule SILENTLY changes — you must drop the old
 * pattern and read the new one (Burgess & Shallice, 1997). Miss and he repeats
 * the same pattern. "Continue" (not "copy his path") keeps it rule-inference, so
 * it stays flexibility rather than memory.
 *
 * Modes (shared ModeShell): Survival (60s) · Levels (100 each × 3 diff) · Pass n Play.
 */

const INK = '#2d2a26';
const SUB = '#8a7f6f';
const LINE = '#e7ddcc';
const CARD = '#fffefb';
const ACC = '#b84878';   // flexibility deep pink
const OK = '#3a9d5d';
const BAD = '#cf5b50';

const COLS = 5;
const PER_LEVEL = 6;     // patterns per level
const WIN_ACC = 0.6;
const PP_TRIALS = 6;

// Rules over the linear index 0..9 (top row 0-4, bottom row 5-9).
const RULES = [
  (i) => (i + 1) % 10,   // 0: +1
  (i) => (i + 9) % 10,   // 1: -1
  (i) => (i + 2) % 10,   // 2: +2
  (i) => 9 - i,          // 3: mirror
  (i) => (i + 5) % 10,   // 4: other row
];

function cfgFor(mode, diff, level, ramp) {
  if (mode === 'free') {
    const r = ramp ?? 0;
    const rules = r < 0.33 ? [0, 1] : r < 0.66 ? [0, 1, 2] : [0, 1, 2, 3, 4];
    return { rules, demo: r < 0.5 ? 2 : 3, tries: r < 0.5 ? 2 : 3, demoMs: Math.round(560 - r * 200), animMs: Math.round(380 - r * 120) };
  }
  if (mode === 'passplay') return { rules: [0, 1, 2, 3, 4], demo: 3, tries: 3, demoMs: 480, animMs: 340 };
  const f = ((level || 1) - 1) / 99;
  const rules = diff === 'easy' ? (f < 0.6 ? [0, 1] : [0, 1, 2])
    : diff === 'hard' ? [0, 1, 2, 3, 4]
      : (f < 0.5 ? [0, 1, 2] : [0, 1, 2, 3, 4]);
  return {
    rules,
    demo: diff === 'easy' ? 2 : 3,
    tries: diff === 'easy' ? 2 : (diff === 'hard' && f > 0.5 ? 4 : 3),
    demoMs: Math.round((diff === 'easy' ? 600 : 520) - f * 160),
    animMs: 360,
  };
}

function BrixtonEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppTrials = mode === 'passplay' ? (attempt?.trials || PP_TRIALS) : 0;
  const isSurvival = mode === 'free';

  // logic in refs (timer driven)
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
  const stats = useRef({ best: 0 });

  const [runId, setRunId] = useState(0);
  const [kwPos, setKwPos] = useState(0);
  const [hopKey, setHopKey] = useState(0);
  const [phase, setPhase] = useState('demo');   // demo | your | reveal
  const [demoPath, setDemoPath] = useState([]);
  const [playerSteps, setPlayerSteps] = useState([]);
  const [outcome, setOutcome] = useState(null);  // solved | failed
  const [wrong, setWrong] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(null);
  const [centers, setCenters] = useState([]);

  const wrapRef = useRef(null);
  const cellRefs = useRef([]);

  const t = useMemo(() => ({
    watch: isAr ? 'راقب النمط…' : 'Watch the pattern…',
    your: isAr ? 'دورك — أكمل النمط' : 'Your turn — continue it',
    yes: isAr ? 'ممتاز!' : 'Perfect!',
    no: isAr ? 'ليس تماماً — راقب مجدداً' : 'Not quite — watch again',
    title: isAr ? 'قفزات كوكب' : 'Kawkab Hops',
    over: isAr ? 'انتهى البقاء' : 'Survival over',
    again: isAr ? 'العب مجدداً' : 'Play again',
    menu: isAr ? 'القائمة' : 'Menu',
    cracked: isAr ? 'محلولة' : 'cracked',
  }), [isAr]);

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearTimeout(timerRef.current);
    setOver({ solved: solvedRef.current, score: scoreRef.current, best: stats.current.best });
    playSfx?.('error');
  }, [playSfx]);

  const remaining = useSurvivalCountdown(isSurvival && !over, finishSurvival);
  rampRef.current = isSurvival ? survivalRampFromRemaining(remaining) : 0;

  // measure node centres
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
  }, [measure, over]);

  const move = useCallback((to) => {
    posRef.current = to;
    setKwPos(to);
    setHopKey((k) => k + 1);
  }, []);

  // choose a new pattern (seeded for graded modes, random for survival)
  const genPattern = useCallback(() => {
    let rule, start, cfg;
    if (isSurvival) {
      cfg = cfgFor(mode, diff, level, rampRef.current);
      rule = cfg.rules[Math.floor(Math.random() * cfg.rules.length)];
      start = Math.floor(Math.random() * 10);
    } else {
      patternIdxRef.current += 1;
      const rng = makeRng(((seed ?? 1) >>> 0) + patternIdxRef.current * 7919 + runId * 104729);
      cfg = cfgFor(mode, diff, level, 0);
      rule = cfg.rules[Math.floor(rng() * cfg.rules.length)];
      start = Math.floor(rng() * 10);
    }
    cfgRef.current = cfg; ruleRef.current = rule; startRef.current = start;
    const path = [start]; let p = start;
    for (let k = 0; k < cfg.demo; k++) { p = RULES[rule](p); path.push(p); }
    demoPathRef.current = path;
    setDemoPath(path);
  }, [isSurvival, mode, diff, level, seed, runId]);

  const playDemo = useCallback(() => {
    clearTimeout(timerRef.current);
    if (finishedRef.current) return;
    const path = demoPathRef.current;
    const { demoMs, animMs } = cfgRef.current;
    setPlayerSteps([]); setWrong(null); setOutcome(null);
    phaseRef.current = 'demo'; setPhase('demo');
    let step = 0;
    const hopNext = () => {
      if (finishedRef.current) return;
      if (step >= path.length) {
        timerRef.current = setTimeout(() => {
          if (finishedRef.current) return;
          tryCountRef.current = 0;
          phaseRef.current = 'your'; setPhase('your');
        }, 440);
        return;
      }
      playSfx?.('click');
      move(path[step]); step += 1;
      timerRef.current = setTimeout(hopNext, animMs + demoMs);
    };
    timerRef.current = setTimeout(hopNext, 300);
  }, [move, playSfx]);

  const nextPattern = useCallback((fresh) => {
    if (mode === 'levels' && attemptsRef.current >= PER_LEVEL) {
      const acc = solvedRef.current / PER_LEVEL;
      onResult({ won: acc >= WIN_ACC, score: scoreRef.current, summary: `${solvedRef.current}/${PER_LEVEL} ${isAr ? 'محلول' : 'cracked'}` });
      return;
    }
    if (mode === 'passplay' && attemptsRef.current >= ppTrials) { onResult({ score: solvedRef.current }); return; }
    if (finishedRef.current) return;
    if (fresh) genPattern();
    playDemo();
  }, [mode, ppTrials, isAr, onResult, genPattern, playDemo]);

  const tap = useCallback((idx) => {
    if (phaseRef.current !== 'your' || finishedRef.current) return;
    const expect = RULES[ruleRef.current](posRef.current);
    if (idx === expect) {
      playSfx?.('click');
      move(expect);
      setPlayerSteps((prev) => [...prev, expect]);
      tryCountRef.current += 1;
      scoreRef.current += 5; setScore(scoreRef.current);
      if (tryCountRef.current >= cfgRef.current.tries) {
        clearTimeout(timerRef.current);
        attemptsRef.current += 1; setAttempts(attemptsRef.current);
        solvedRef.current += 1; setSolved(solvedRef.current);
        streakRef.current += 1; stats.current.best = Math.max(stats.current.best, streakRef.current); setStreak(streakRef.current);
        scoreRef.current += 15 + Math.min(streakRef.current, 8) * 2; setScore(scoreRef.current);
        awardPoints?.(1);
        phaseRef.current = 'reveal'; setPhase('reveal'); setOutcome('solved');
        timerRef.current = setTimeout(() => nextPattern(true), 900);
      }
    } else {
      clearTimeout(timerRef.current);
      attemptsRef.current += 1; setAttempts(attemptsRef.current);
      streakRef.current = 0; setStreak(0);
      setWrong({ pick: idx, correct: expect });
      move(expect);
      playSfx?.('lose');
      phaseRef.current = 'reveal'; setPhase('reveal'); setOutcome('failed');
      // graded modes advance to the next pattern; survival repeats the same one
      const fresh = !isSurvival;
      timerRef.current = setTimeout(() => nextPattern(fresh), 900);
    }
  }, [move, playSfx, awardPoints, nextPattern, isSurvival]);

  const restartSurvival = () => {
    clearTimeout(timerRef.current);
    attemptsRef.current = 0; solvedRef.current = 0; streakRef.current = 0; scoreRef.current = 0;
    patternIdxRef.current = -1; finishedRef.current = false;
    stats.current = { best: 0 };
    setAttempts(0); setSolved(0); setStreak(0); setScore(0); setOver(null);
    setRunId((n) => n + 1);
  };

  // start / restart: build first pattern and play it
  useEffect(() => {
    finishedRef.current = false;
    attemptsRef.current = 0; solvedRef.current = 0; streakRef.current = 0; scoreRef.current = 0;
    patternIdxRef.current = -1;
    genPattern();
    move(startRef.current);
    playDemo();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  const hud = mode === 'levels' ? `${attempts}/${PER_LEVEL} · ✓${solved}`
    : mode === 'passplay' ? `${attempts}/${ppTrials} · ✓${solved}`
      : `✓${solved} · ${score}${streak > 1 ? ` · 🔥${streak}` : ''}`;

  if (over && isSurvival) {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <div style={S.overCard}>
            <CosmosCharacter size={72} faceOnly mood="proud" />
            <h2 style={S.overTitle}>{t.over}</h2>
            <p style={S.overSub}>{`✓ ${over.solved} ${t.cracked} · ${over.score} ${isAr ? 'نقطة' : 'pts'}`}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <button type="button" style={S.btnPri} onClick={() => { playSfx?.('click'); restartSurvival(); }}>{t.again}</button>
              <button type="button" style={S.btnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isYour = phase === 'your';
  const prompt = outcome === 'solved' ? t.yes : outcome === 'failed' ? t.no : isYour ? t.your : t.watch;
  const promptColor = outcome === 'solved' ? OK : outcome === 'failed' ? BAD : isYour ? ACC : SUB;
  const kw = centers[kwPos];
  const demoSet = new Set(demoPath);
  const playerSet = new Set(playerSteps);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{KEYFRAMES}</style>
      {isSurvival && <SurvivalCountdownBar remaining={remaining} color={ACC} />}

      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{t.title}</div>
          <div className="ct-training-play-sub">{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={{ padding: '8px 16px 0', textAlign: 'center', fontWeight: 700, fontSize: 16, minHeight: 24, color: promptColor }}>{prompt}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, height: 12, marginTop: 4 }}>
        {isYour && Array.from({ length: cfgRef.current.tries }).map((_, i) => (
          <span key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < playerSteps.length ? ACC : '#e3d8c8' }} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 16 }}>
        <div ref={wrapRef} style={{ position: 'relative', width: 'min(92%, 440px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 'clamp(10px, 4vw, 24px)' }}>
            {Array.from({ length: 10 }).map((_, i) => {
              const inDemo = demoSet.has(i);
              const inPlayer = playerSet.has(i);
              const isCorrectReveal = outcome === 'failed' && wrong && i === wrong.correct;
              const isWrongPick = outcome === 'failed' && wrong && i === wrong.pick && wrong.pick !== wrong.correct;
              let border = `1px solid ${LINE}`; let bg = '#fff'; let glow = 'none';
              if (inDemo) border = '1px solid rgba(184,72,120,0.4)';
              if (inPlayer) { border = `2px solid ${ACC}`; bg = 'rgba(184,72,120,0.10)'; }
              if (isCorrectReveal) { border = `2px solid ${OK}`; bg = 'rgba(58,157,93,0.12)'; glow = `0 0 14px rgba(58,157,93,0.35)`; }
              if (isWrongPick) { border = `2px solid ${BAD}`; bg = 'rgba(207,91,80,0.10)'; }
              const tappable = isYour;
              return (
                <button
                  key={i}
                  ref={(el) => { cellRefs.current[i] = el; }}
                  onClick={() => tap(i)}
                  disabled={!tappable}
                  aria-label={`node ${i + 1}`}
                  className={tappable ? 'bx-node-live' : undefined}
                  style={{
                    aspectRatio: '1 / 1', borderRadius: '50%', background: bg, border, boxShadow: glow,
                    cursor: tappable ? 'pointer' : 'default',
                    transition: 'border-color 160ms, box-shadow 160ms, background 160ms',
                    display: 'grid', placeItems: 'center',
                  }}
                >
                  {inDemo && !inPlayer && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(184,72,120,0.5)' }} />}
                </button>
              );
            })}
          </div>

          {kw && (
            <div style={{
              position: 'absolute', left: 0, top: 0, pointerEvents: 'none',
              transform: `translate(${kw.x}px, ${kw.y}px)`,
              transition: `transform ${cfgRef.current.animMs}ms cubic-bezier(.4,0,.2,1)`, zIndex: 5,
            }}>
              <div style={{ transform: 'translate(-50%, -58%)' }}>
                <div key={hopKey} style={{ animation: `bx-hop ${cfgRef.current.animMs}ms ease-out` }}>
                  <CosmosCharacter size={50} faceOnly mood={outcome === 'solved' ? 'proud' : outcome === 'failed' ? 'tired' : 'focused'} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 'calc(12px + env(safe-area-inset-bottom))' }} />
    </div>
  );
}

export default function KawkabHopsGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_brixton"
      scienceId="brixton"
      title={{ en: 'Kawkab Hops', ar: 'قفزات كوكب' }}
      hints={{
        free: { en: '60s survival · patterns speed up and get trickier', ar: '٦٠ث بقاء · الأنماط تتسارع وتصعب' },
        levels: { en: '3 difficulties · more rules & longer patterns on hard', ar: '٣ صعوبات · قواعد أكثر وأنماط أطول' },
        pass: { en: 'Same patterns for everyone · pass the device', ar: 'نفس الأنماط للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRIALS, scoreLabel: { en: 'cracked', ar: 'محلول' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <BrixtonEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const KEYFRAMES = `
@keyframes bx-hop { 0%{transform:translateY(0)} 50%{transform:translateY(-32px)} 100%{transform:translateY(0)} }
@keyframes bx-live { 0%,100%{box-shadow:0 0 0 0 rgba(184,72,120,0)} 50%{box-shadow:0 0 0 3px rgba(184,72,120,0.28)} }
.bx-node-live { animation: bx-live 1.5s ease-in-out infinite; }
`;

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: INK, fontFamily: "'Outfit', system-ui, sans-serif" },
  overWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overCard: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, padding: '28px 26px', textAlign: 'center', maxWidth: 340, width: '100%', boxShadow: '0 8px 30px rgba(26,18,8,0.08)' },
  overTitle: { margin: '10px 0 6px', fontWeight: 800, fontSize: 22, color: INK },
  overSub: { margin: 0, fontWeight: 600, color: SUB },
  btnPri: { padding: '12px 22px', borderRadius: 12, border: 'none', background: ACC, color: '#fff', fontWeight: 800, cursor: 'pointer' },
  btnGhost: { padding: '12px 20px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#fff', fontWeight: 700, color: INK, cursor: 'pointer' },
};
