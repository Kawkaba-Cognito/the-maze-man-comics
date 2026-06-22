import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { SURVIVAL_MS, survivalRamp, survivalTier, survivalShrink } from '../../../../shared/survival';
import { COSMOS_GOLD, COSMOS_STING_BG } from '../../../../shared/drawCosmosCanvas';
import { TRIALS, RELATION } from './data';

/*
 * Similarities — timed IQ verbal reasoning (bilingual).
 * Rotates three challenge types: shared rule, analogy completion, pair matching.
 * Countdown pressure + streak; med/hard mix trickier formats.
 */

const ACCENT = COSMOS_GOLD;
const PER_LEVEL = 10;
const WIN_ACC = 0.72;
const PP_TRIALS = 10;

const TIME_MS = { easy: 9000, med: 6500, hard: 4500 };

const pickOne = (a, rng) => a[Math.floor(rng() * a.length)];
function shuffle(a, rng) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function tierFor(mode, diff, trialNum, level, ramp) {
  if (mode === 'free') return survivalTier(ramp ?? 0);
  if (mode === 'levels') {
    const f = ((level || 1) - 1) / 99;
    if (diff === 'easy') return f < 0.68 ? 'easy' : 'med';
    if (diff === 'hard') return f < 0.28 ? 'med' : 'hard';
    return f < 0.32 ? 'easy' : f < 0.72 ? 'med' : 'hard';
  }
  if (mode === 'passplay') return 'hard';
  if (trialNum < 4) return 'easy';
  if (trialNum < 10) return 'med';
  return 'hard';
}

function allowedKinds(tier) {
  if (tier === 'easy') return ['similarity'];
  if (tier === 'med') return ['similarity', 'analogy', 'pair'];
  return ['similarity', 'analogy', 'pair'];
}

function buildTrial({ mode, diff, level, trialNum, rng, isAr, ramp = 0 }) {
  const tier = tierFor(mode, diff, trialNum, level, ramp);
  const kinds = allowedKinds(tier);
  let pool = TRIALS.filter((t) => t.tier === tier && kinds.includes(t.kind));
  if (!pool.length) pool = TRIALS.filter((t) => kinds.includes(t.kind));
  const raw = pickOne(pool, rng);
  const L = (o) => (isAr ? o.ar : o.en);
  const rel = RELATION[raw.rel] || RELATION.abstract;
  let timeMs = TIME_MS[tier] ?? TIME_MS.med;
  if (mode === 'free') timeMs = survivalShrink(timeMs, ramp, 0.5);
  else if (mode === 'levels') {
    const f = ((level || 1) - 1) / 99;
    timeMs = Math.max(2800, Math.round(timeMs * (1 - f * 0.38)));
  }

  if (raw.kind === 'similarity') {
    const opts = shuffle(
      [{ label: L(raw.correct), correct: true }, ...shuffle(raw.wrong, rng).map((w) => ({ label: L(w), correct: false }))],
      rng,
    );
    return {
      kind: 'similarity',
      tier,
      timeMs,
      rel,
      prompt: isAr ? 'ما وجه شبههما؟' : 'What is the best link?',
      left: L(raw.a),
      right: L(raw.b),
      options: opts.map((o, i) => ({ key: i, ...o })),
    };
  }

  if (raw.kind === 'analogy') {
    const [a, b, c] = raw.stem;
    const opts = shuffle(
      [{ label: L(raw.correct), correct: true }, ...shuffle(raw.wrong, rng).map((w) => ({ label: L(w), correct: false }))],
      rng,
    );
    return {
      kind: 'analogy',
      tier,
      timeMs,
      rel,
      prompt: isAr ? 'أكمل القياس' : 'Complete the analogy',
      stem: [L(a), L(b), L(c)],
      options: opts.map((o, i) => ({ key: i, ...o })),
    };
  }

  const words = raw.words.map((w, i) => ({ key: i, label: L(w) }));
  return {
    kind: 'pair',
    tier,
    timeMs,
    rel,
    prompt: isAr ? 'اختر الزوجين المتطابقين' : 'Tap the matching pair',
    words: shuffle(words, rng),
    pair: raw.pair,
    rule: L(raw.rule),
  };
}

function SimilaritiesEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppTrials = mode === 'passplay' ? (attempt?.trials || PP_TRIALS) : 0;
  const font = isAr ? "'Cairo', sans-serif" : "'Outfit', system-ui, sans-serif";
  const isSurvival = mode === 'free';

  const trialNumRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const scoreRef = useRef(0);
  const lockRef = useRef(false);
  const timerRef = useRef(null);
  const deadlineRef = useRef(0);
  const comboRef = useRef(0);
  const trialRef = useRef(null);
  const survT0Ref = useRef(performance.now());
  const finishedRef = useRef(false);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [survPct, setSurvPct] = useState(1);
  const [trial, setTrial] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timePct, setTimePct] = useState(1);
  const [secs, setSecs] = useState(0);
  const [fb, setFb] = useState(null);
  const [picked, setPicked] = useState([]);

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    lockRef.current = true;
    clearTimeout(timerRef.current);
    setOver({ score: scoreRef.current, correct: correctRef.current });
    playSfx?.('error');
  }, [playSfx]);

  const restartSurvival = () => {
    trialNumRef.current = 0;
    correctRef.current = 0;
    totalRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    finishedRef.current = false;
    lockRef.current = false;
    survT0Ref.current = performance.now();
    setScore(0);
    setCorrect(0);
    setCombo(0);
    setOver(null);
    setSurvPct(1);
    setRunId((n) => n + 1);
  };

  const loadTrial = useCallback(() => {
    if (finishedRef.current) return;
    lockRef.current = false;
    setFb(null);
    setPicked([]);
    const n = trialNumRef.current;
    const ramp = isSurvival ? survivalRamp(performance.now() - survT0Ref.current) : 0;
    const rng = makeRng(((seed ?? 1) >>> 0) + n * 7919 + runId * 104729);
    const t = buildTrial({ mode, diff, level, trialNum: n, rng, isAr, ramp });
    deadlineRef.current = performance.now() + t.timeMs;
    trialRef.current = t;
    setTrial(t);
    setTimePct(1);
    setSecs(Math.ceil(t.timeMs / 1000));
  }, [mode, diff, level, seed, isAr, isSurvival, runId]);

  useEffect(() => {
    if (!isSurvival) return undefined;
    survT0Ref.current = performance.now();
    finishedRef.current = false;
    trialNumRef.current = 0;
    correctRef.current = 0;
    totalRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    setScore(0);
    setCorrect(0);
    setCombo(0);
    setOver(null);
    setSurvPct(1);
  }, [isSurvival, seed, runId]);

  useEffect(() => {
    loadTrial();
    return () => clearTimeout(timerRef.current);
  }, [loadTrial]);

  const resolve = useCallback((ok, reason) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setFb({ ok, reason });
    totalRef.current += 1;
    trialNumRef.current += 1;
    if (ok) {
      const bonus = 10 + Math.min(comboRef.current, 8) * 2;
      scoreRef.current += bonus;
      correctRef.current += 1;
      comboRef.current += 1;
      setScore(scoreRef.current);
      setCorrect(correctRef.current);
      setCombo(comboRef.current);
      playSfx?.('win');
      awardPoints?.(1);
    } else {
      comboRef.current = 0;
      setCombo(0);
      playSfx?.(reason === 'timeout' ? 'error' : 'lose');
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels' && totalRef.current >= PER_LEVEL) {
        const acc = correctRef.current / PER_LEVEL;
        onResult({
          won: acc >= WIN_ACC,
          score: scoreRef.current,
          summary: `${correctRef.current}/${PER_LEVEL} (${Math.round(acc * 100)}%)`,
        });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) {
        onResult({ score: correctRef.current });
        return;
      }
      if (isSurvival && performance.now() - survT0Ref.current >= SURVIVAL_MS) {
        finishSurvival();
        return;
      }
      loadTrial();
    }, ok ? 520 : 780);
  }, [awardPoints, finishSurvival, isSurvival, loadTrial, mode, onResult, playSfx, ppTrials]);

  useEffect(() => {
    if (!trial || lockRef.current || finishedRef.current) return undefined;
    let raf = 0;
    const tick = () => {
      if (lockRef.current || finishedRef.current) return;
      const now = performance.now();
      if (isSurvival) {
        const left = SURVIVAL_MS - (now - survT0Ref.current);
        setSurvPct(Math.max(0, left / SURVIVAL_MS));
        if (left <= 0) { finishSurvival(); return; }
      }
      const left = deadlineRef.current - now;
      const t = trialRef.current;
      if (!t) return;
      setTimePct(Math.max(0, left / t.timeMs));
      setSecs(Math.max(0, Math.ceil(left / 1000)));
      if (left <= 0) resolve(false, 'timeout');
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [trial, resolve, isSurvival, finishSurvival]);

  const pickOption = (opt) => {
    if (lockRef.current || trialRef.current?.kind === 'pair') return;
    resolve(!!opt.correct);
  };

  const togglePair = (key) => {
    if (lockRef.current || trialRef.current?.kind !== 'pair') return;
    setPicked((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      const next = prev.length >= 2 ? [key] : [...prev, key];
      if (next.length === 2) {
        const t = trialRef.current;
        const ok = next.includes(t.pair[0]) && next.includes(t.pair[1]);
        setTimeout(() => resolve(ok), 100);
      }
      return next;
    });
  };

  const hud = mode === 'levels'
    ? (isAr ? `${totalRef.current}/${PER_LEVEL} · ✓${correct}` : `${totalRef.current}/${PER_LEVEL} · ✓${correct}`)
    : mode === 'passplay'
      ? (isAr ? `${totalRef.current}/${ppTrials} · ✓${correct}` : `${totalRef.current}/${ppTrials} · ✓${correct}`)
      : (isAr ? `✓${correct} · ${score}${combo > 1 ? ` · 🔥${combo}` : ''}` : `✓${correct} · ${score}${combo > 1 ? ` · 🔥${combo}` : ''}`);

  const relLabel = trial ? (isAr ? trial.rel.ar : trial.rel.en) : '';

  if (over && isSurvival) {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <div style={S.overCard}>
            <h2 style={S.overTitle}>{isAr ? 'انتهى البقاء!' : 'Survival over!'}</h2>
            <p style={S.overSub}>{isAr ? `✓ ${over.correct} · ${over.score} نقطة` : `✓ ${over.correct} · ${over.score} pts`}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" style={S.overBtn} onClick={() => { playSfx?.('click'); restartSurvival(); }}>
                {isAr ? 'العب مجدداً' : 'Play again'}
              </button>
              <button type="button" style={S.overBtnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>
                {isAr ? 'القائمة' : 'Menu'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      {isSurvival && (
        <div style={S.survTrack}>
          <div style={{ ...S.survFill, width: `${survPct * 100}%`, background: survPct < 0.2 ? '#e0594a' : ACCENT }} />
        </div>
      )}
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'وجه الشبه' : 'Similarities'}</div>
          <div className="ct-training-play-sub">{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {trial && (
        <div style={S.body}>
          <div style={S.timerTrack}>
            <div style={{ ...S.timerFill, width: `${timePct * 100}%`, background: timePct < 0.25 ? '#e0594a' : ACCENT }} />
          </div>
          <div style={S.metaRow}>
            <span style={S.badge}>{relLabel}</span>
            {secs > 0 && <span style={S.timerPill}>{isAr ? `${secs} ث` : `${secs}s`}</span>}
          </div>

          <div style={S.prompt}>{trial.prompt}</div>

          {trial.kind === 'similarity' && (
            <div style={S.pairRow}>
              <div style={S.wordCard}>{trial.left}</div>
              <div style={S.linkDot} aria-hidden="true">↔</div>
              <div style={S.wordCard}>{trial.right}</div>
            </div>
          )}

          {trial.kind === 'analogy' && (
            <div style={S.analogyRow}>
              <span style={S.anWord}>{trial.stem[0]}</span>
              <span style={S.anSep}>:</span>
              <span style={S.anWord}>{trial.stem[1]}</span>
              <span style={S.anSep}>::</span>
              <span style={S.anWord}>{trial.stem[2]}</span>
              <span style={S.anSep}>:</span>
              <span style={S.anQ}>?</span>
            </div>
          )}

          {trial.kind === 'pair' && (
            <div style={S.pairGrid}>
              {trial.words.map((w) => {
                const on = picked.includes(w.key);
                return (
                  <button
                    key={w.key}
                    type="button"
                    style={{ ...S.pairTile, ...(on ? S.pairTileOn : {}) }}
                    onClick={() => togglePair(w.key)}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          )}

          {trial.kind !== 'pair' && (
            <div style={S.options}>
              {trial.options.map((o) => {
                const reveal = fb && !fb.ok && o.correct;
                let bg = '#fffdf8';
                let border = '#cdbfa6';
                if (fb && o.correct && fb.ok) { bg = '#dff7e6'; border = '#4caf6e'; }
                else if (reveal) { bg = '#eafaef'; border = '#4caf6e'; }
                else if (fb && !fb.ok) { /* keep neutral unless reveal */ }
                return (
                  <button
                    key={o.key}
                    type="button"
                    style={{ ...S.opt, background: bg, borderColor: border, fontFamily: font }}
                    onClick={() => pickOption(o)}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          )}

          {fb && (
            <div style={{ ...S.feedback, color: fb.ok ? '#2d6a3e' : '#a83228' }}>
              {fb.ok
                ? (isAr ? '✓ صحيح' : '✓ Correct')
                : fb.reason === 'timeout'
                  ? (isAr ? '⏱ انتهى الوقت' : '⏱ Time up')
                  : (isAr ? '✗ ليس الأفضل' : '✗ Not the best link')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SynonymsGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';

  return (
    <ModeShell
      storageKey="mm_lang_syn"
      scienceId="synonyms"
      title={{ en: 'Similarities', ar: 'وجه الشبه' }}
      hints={{
        free: { en: '60s survival · fresh questions · ramps fast', ar: '٦٠ ث بقاء · أسئلة جديدة · صعوبة تصاعدية' },
        levels: { en: '3 difficulties · tighter timers on hard', ar: '٣ صعوبات · وقت أقصر في الصعب' },
        pass: { en: 'Hard mix for everyone · pass the device', ar: 'مزيج صعب للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRIALS, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'hard' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <SimilaritiesEngine
          key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
        />
      )}
    />
  );
}

const S = {
  root: {
    position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column',
    background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d',
    fontFamily: "'Outfit', system-ui, sans-serif",
  },
  body: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: 16,
    padding: '12px 16px calc(20px + env(safe-area-inset-bottom))',
    maxWidth: 520, width: '100%', margin: '0 auto', overflowY: 'auto',
  },
  timerTrack: { height: 6, borderRadius: 999, background: 'rgba(0,0,0,0.08)', overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 999, transition: 'width 0.08s linear' },
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: {
    fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
    color: '#5a4a32', background: 'rgba(200,148,62,0.14)', padding: '4px 10px', borderRadius: 999,
  },
  timerPill: {
    fontWeight: 900, fontSize: 14, color: '#fff', background: COSMOS_STING_BG,
    padding: '4px 12px', borderRadius: 999, boxShadow: '2px 2px 0 #1a1208', minWidth: 44, textAlign: 'center',
  },
  prompt: { fontWeight: 900, fontSize: 'clamp(17px, 4.5vw, 22px)', textAlign: 'center', color: '#2d2d2d' },
  pairRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap' },
  wordCard: {
    flex: '1 1 120px', maxWidth: 200, padding: '16px 12px', textAlign: 'center',
    fontWeight: 900, fontSize: 'clamp(18px, 5vw, 26px)',
    background: '#fffdf8', border: `3px solid ${ACCENT}`, borderRadius: 16,
    boxShadow: '3px 3px 0 #1a1208',
  },
  linkDot: { fontSize: 22, color: ACCENT, fontWeight: 900 },
  analogyRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, rowGap: 8 },
  anWord: {
    padding: '10px 12px', fontWeight: 900, fontSize: 'clamp(15px, 4vw, 20px)',
    background: '#fffdf8', border: `2px solid ${ACCENT}`, borderRadius: 12,
  },
  anSep: { fontWeight: 900, color: ACCENT, fontSize: 18 },
  anQ: { fontWeight: 900, fontSize: 28, color: '#2d2d2d', padding: '0 6px' },
  pairGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  pairTile: {
    padding: '20px 10px', fontWeight: 900, fontSize: 'clamp(15px, 4vw, 18px)',
    background: '#fffdf8', border: '3px solid #cdbfa6', borderRadius: 14,
    cursor: 'pointer', boxShadow: '2px 2px 0 rgba(26,18,8,0.12)',
  },
  pairTileOn: { borderColor: ACCENT, background: '#fff8ec', boxShadow: '3px 3px 0 #1a1208' },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  opt: {
    padding: '16px 14px', borderRadius: 14, border: '2px solid',
    fontWeight: 700, fontSize: 'clamp(14px, 3.8vw, 17px)', textAlign: 'start',
    cursor: 'pointer', boxShadow: '2px 2px 0 rgba(26,18,8,0.1)', lineHeight: 1.35,
  },
  feedback: { textAlign: 'center', fontWeight: 900, fontSize: 15, minHeight: 22 },
  survTrack: { height: 6, background: 'rgba(0,0,0,0.08)', flexShrink: 0 },
  survFill: { height: '100%', transition: 'width 0.08s linear' },
  overWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overCard: {
    background: '#fffdf8', border: '3px solid #1a1208', borderRadius: 20, padding: '28px 24px',
    textAlign: 'center', maxWidth: 360, width: '100%', boxShadow: '6px 6px 0 #1a1208',
  },
  overTitle: { margin: '0 0 8px', fontWeight: 900, fontSize: 24 },
  overSub: { margin: '0 0 20px', fontWeight: 700, color: '#5a4a32' },
  overBtn: {
    padding: '12px 20px', borderRadius: 12, border: '2px solid #1a1208', background: ACCENT,
    color: '#fff', fontWeight: 900, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208',
  },
  overBtnGhost: {
    padding: '12px 20px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff',
    fontWeight: 800, cursor: 'pointer',
  },
};
