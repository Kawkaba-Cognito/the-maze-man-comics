import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { SURVIVAL_MS, survivalRamp, survivalTier, survivalShrink } from '../../../../shared/survival';
import { RELATION } from './data';
import { CATEGORIES } from '../odd-one-out/data';
import { markSeen, pickTrial } from './trialBank';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const Synonyms3DProto = lazyWithRetry(() => import('./Synonyms3DProto'), 'synonyms-3d');

/*
 * Word Links — verbal-reasoning / semantic judgment (bilingual), minimalist.
 *
 * One game, four question types (Similarities + Odd One Out merged):
 *   • similarity — what links two words?
 *   • analogy    — A:B :: C:?
 *   • pair       — tap the two words that go together
 *   • odd        — tap the word that does NOT belong (folded in from Odd One Out)
 *
 * Clean, low-chrome visual style: hairline borders, lots of whitespace, a single
 * restrained accent. Countdown pressure; harder tiers mix trickier formats.
 */

// minimalist palette
const INK = '#2d2a26';
const SUB = '#8a7f6f';
const LINE = '#e7ddcc';
const CARD = '#fffefb';
const ACC = '#b9842f';
const OK = '#3a9d5d';
const BAD = '#cf5b50';

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
  if (tier === 'easy') return ['similarity', 'odd'];
  return ['similarity', 'analogy', 'pair', 'odd'];
}

// Odd-one-out item: 3 words, two share a category, one doesn't.
function genOdd(rng, isAr, tier) {
  const nearProb = tier === 'hard' ? 0.8 : tier === 'med' ? 0.45 : 0.1;
  const near = rng() < nearProb;
  const cat = pickOne(CATEGORIES, rng);
  const members = shuffle(cat.members, rng).slice(0, 2);
  let oddPool = near
    ? CATEGORIES.filter((c) => c.group === cat.group && c.id !== cat.id)
    : CATEGORIES.filter((c) => c.group !== cat.group);
  if (!oddPool.length) oddPool = CATEGORIES.filter((c) => c.id !== cat.id);
  const oddCat = pickOne(oddPool, rng);
  const odd = pickOne(oddCat.members, rng);
  const L = (m) => (isAr ? m.ar : m.en);
  const opts = shuffle([
    { label: L(members[0]), correct: false },
    { label: L(members[1]), correct: false },
    { label: L(odd), correct: true },
  ], rng);
  const id = `proc:odd:${cat.id}:${L(members[0])}:${L(members[1])}:${L(odd)}`;
  return {
    id,
    kind: 'odd',
    rel: { en: 'Odd one out', ar: 'الشاذّ' },
    prompt: isAr ? 'أيّها لا ينتمي؟' : "Which one doesn't belong?",
    options: opts.map((o, i) => ({ key: i, ...o })),
  };
}

export function buildTrial({ mode, diff, level, trialNum, rng, isAr, ramp = 0 }) {
  const tier = tierFor(mode, diff, trialNum, level, ramp);
  const kinds = allowedKinds(tier);
  const kind = pickOne(kinds, rng);
  const L = (o) => (isAr ? o.ar : o.en);
  let timeMs = TIME_MS[tier] ?? TIME_MS.med;
  if (mode === 'free') timeMs = survivalShrink(timeMs, ramp, 0.5);
  else if (mode === 'levels') {
    const f = ((level || 1) - 1) / 99;
    timeMs = Math.max(2800, Math.round(timeMs * (1 - f * 0.38)));
  }

  if (kind === 'odd') {
    const trial = { ...genOdd(rng, isAr, tier), tier, timeMs };
    markSeen(trial.id, mode !== 'passplay');
    return trial;
  }

  const persist = mode !== 'passplay';
  const raw = pickTrial({ kind, tier, rng, persist, preferProcedural: true });
  const rel = RELATION[raw.rel] || RELATION.abstract;

  if (raw.kind === 'similarity') {
    const opts = shuffle(
      [{ label: L(raw.correct), correct: true }, ...shuffle(raw.wrong, rng).map((w) => ({ label: L(w), correct: false }))],
      rng,
    );
    markSeen(raw.id, persist);
    return { kind: 'similarity', tier, timeMs, rel, prompt: isAr ? 'ما وجه الشبه؟' : 'What is the best link?', left: L(raw.a), right: L(raw.b), options: opts.map((o, i) => ({ key: i, ...o })) };
  }
  if (raw.kind === 'analogy') {
    const [a, b, c] = raw.stem;
    const opts = shuffle(
      [{ label: L(raw.correct), correct: true }, ...shuffle(raw.wrong, rng).map((w) => ({ label: L(w), correct: false }))],
      rng,
    );
    markSeen(raw.id, persist);
    return { kind: 'analogy', tier, timeMs, rel, prompt: isAr ? 'أكمل القياس' : 'Complete the analogy', stem: [L(a), L(b), L(c)], options: opts.map((o, i) => ({ key: i, ...o })) };
  }
  const words = raw.words.map((w, i) => ({ key: i, label: L(w) }));
  markSeen(raw.id, persist);
  return { kind: 'pair', tier, timeMs, rel, prompt: isAr ? 'اختر الزوجين المتطابقين' : 'Tap the matching pair', words: shuffle(words, rng), pair: raw.pair, rule: L(raw.rule) };
}

export function WordLinksEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
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
    awardFreeRun?.('synonyms', correctRef.current);
    playSfx?.('error');
  }, [playSfx, awardFreeRun]);

  const restartSurvival = () => {
    trialNumRef.current = 0; correctRef.current = 0; totalRef.current = 0; scoreRef.current = 0; comboRef.current = 0;
    finishedRef.current = false; lockRef.current = false; survT0Ref.current = performance.now();
    setScore(0); setCorrect(0); setCombo(0); setOver(null); setSurvPct(1); setRunId((n) => n + 1);
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
    survT0Ref.current = performance.now(); finishedRef.current = false;
    trialNumRef.current = 0; correctRef.current = 0; totalRef.current = 0; scoreRef.current = 0; comboRef.current = 0;
    setScore(0); setCorrect(0); setCombo(0); setOver(null); setSurvPct(1);
  }, [isSurvival, seed, runId]);

  useEffect(() => { loadTrial(); return () => clearTimeout(timerRef.current); }, [loadTrial]);

  const resolve = useCallback((ok, reason) => {
    if (lockRef.current) return;
    lockRef.current = true;
    setFb({ ok, reason });
    totalRef.current += 1;
    trialNumRef.current += 1;
    if (ok) {
      const bonus = 10 + Math.min(comboRef.current, 8) * 2;
      scoreRef.current += bonus; correctRef.current += 1; comboRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current); setCombo(comboRef.current);
      playSfx?.('win'); awardPoints?.(1);
    } else {
      comboRef.current = 0; setCombo(0);
      playSfx?.(reason === 'timeout' ? 'error' : 'lose');
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels' && totalRef.current >= PER_LEVEL) {
        const acc = correctRef.current / PER_LEVEL;
        onResult({ won: acc >= WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${PER_LEVEL} (${Math.round(acc * 100)}%)` });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) { onResult({ score: correctRef.current }); return; }
      if (isSurvival && performance.now() - survT0Ref.current >= SURVIVAL_MS) { finishSurvival(); return; }
      loadTrial();
    }, ok ? 520 : 820);
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
    ? `${totalRef.current}/${PER_LEVEL} · ✓${correct}`
    : mode === 'passplay'
      ? `${totalRef.current}/${ppTrials} · ✓${correct}`
      : `✓${correct} · ${score}${combo > 1 ? ` · 🔥${combo}` : ''}`;

  const relLabel = trial ? (isAr ? trial.rel.ar : trial.rel.en) : '';
  const title = isAr ? 'روابط الكلمات' : 'Word Links';

  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  const embedCls = cosmos ? 'c3d-embed-root' : undefined;

  if (over && isSurvival) {
    return (
      <div style={rootStyle} className={embedCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <div style={S.overCard}>
            <h2 style={S.overTitle}>{isAr ? 'انتهى البقاء' : 'Survival over'}</h2>
            <p style={S.overSub}>{isAr ? `✓ ${over.correct} · ${over.score} نقطة` : `✓ ${over.correct} · ${over.score} pts`}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <button type="button" style={S.btnPri} onClick={() => { playSfx?.('click'); restartSurvival(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
              <button type="button" style={S.btnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const optState = (o) => {
    if (!fb) return {};
    if (o.correct) return { borderColor: OK, background: '#eef7f0', color: INK };
    return { opacity: 0.55 };
  };

  return (
    <div style={rootStyle} className={embedCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      {isSurvival && (
        <div style={S.survTrack}><div style={{ ...S.survFill, width: `${survPct * 100}%`, background: survPct < 0.2 ? BAD : ACC }} /></div>
      )}
      <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
        {!cosmos && (
          <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        )}
        {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{title}</div>
          <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {trial && (
        <div style={S.body}>
          <div style={S.timerTrack}><div style={{ ...S.timerFill, width: `${timePct * 100}%`, background: timePct < 0.25 ? BAD : ACC }} /></div>
          <div style={S.metaRow}>
            <span style={S.badge}>{relLabel}</span>
            {secs > 0 && <span style={S.secs}>{isAr ? `${secs} ث` : `${secs}s`}</span>}
          </div>

          <div style={{ ...S.prompt, fontFamily: font }}>{trial.prompt}</div>

          {trial.kind === 'similarity' && (
            <div style={S.pairRow}>
              <div style={{ ...S.wordCard, fontFamily: font }}>{trial.left}</div>
              <span style={S.linkDot} aria-hidden="true">↔</span>
              <div style={{ ...S.wordCard, fontFamily: font }}>{trial.right}</div>
            </div>
          )}

          {trial.kind === 'analogy' && (
            <div style={{ ...S.analogyRow, fontFamily: font }}>
              <span style={S.anWord}>{trial.stem[0]}</span><span style={S.anSep}>:</span>
              <span style={S.anWord}>{trial.stem[1]}</span><span style={S.anSep}>::</span>
              <span style={S.anWord}>{trial.stem[2]}</span><span style={S.anSep}>:</span>
              <span style={S.anQ}>?</span>
            </div>
          )}

          {trial.kind === 'pair' && (
            <div style={S.pairGrid}>
              {trial.words.map((w) => {
                const on = picked.includes(w.key);
                return (
                  <button key={w.key} type="button" style={{ ...S.pairTile, ...(on ? S.pairTileOn : {}), fontFamily: font }} onClick={() => togglePair(w.key)}>{w.label}</button>
                );
              })}
            </div>
          )}

          {trial.kind !== 'pair' && (
            <div style={S.options}>
              {trial.options.map((o) => (
                <button key={o.key} type="button" style={{ ...S.opt, ...optState(o), fontFamily: font }} onClick={() => pickOption(o)}>{o.label}</button>
              ))}
            </div>
          )}

          {fb && (
            <div style={{ ...S.feedback, color: fb.ok ? OK : BAD }}>
              {fb.ok ? (isAr ? '✓ صحيح' : '✓ Correct') : fb.reason === 'timeout' ? (isAr ? '⏱ انتهى الوقت' : '⏱ Time up') : (isAr ? '✗ ليست الأفضل' : '✗ Not quite')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WordLinksGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <Synonyms3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_lang_syn"
      scienceId="synonyms"
      title={{ en: 'Word Links', ar: 'روابط الكلمات' }}
      hints={{
        free: { en: '60s survival · synonyms, analogies & odd-one-out', ar: '٦٠ث بقاء · مرادفات وقياسات وشاذّ' },
        levels: { en: '3 difficulties · tighter timers on hard', ar: '٣ صعوبات · وقت أقصر في الصعب' },
        pass: { en: 'Hard mix for everyone · pass the device', ar: 'مزيج صعب للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRIALS, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'hard' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('language'),
      }]}
      renderEngine={(p) => (
        <WordLinksEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: INK, fontFamily: "'Outfit', system-ui, sans-serif" },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  body: { flex: 1, display: 'flex', flexDirection: 'column', gap: 20, padding: '16px 18px calc(24px + env(safe-area-inset-bottom))', maxWidth: 440, width: '100%', margin: '0 auto', overflowY: 'auto' },
  timerTrack: { height: 3, borderRadius: 999, background: '#efe8db', overflow: 'hidden' },
  timerFill: { height: '100%', borderRadius: 999, transition: 'width 0.08s linear' },
  metaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: -8 },
  badge: { fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: SUB },
  secs: { fontSize: 13, fontWeight: 700, color: SUB, fontVariantNumeric: 'tabular-nums' },
  prompt: { fontWeight: 600, fontSize: 'clamp(16px, 4.4vw, 20px)', textAlign: 'center', color: INK, margin: '4px 0 2px' },
  pairRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' },
  wordCard: { padding: '14px 20px', textAlign: 'center', fontWeight: 700, fontSize: 'clamp(18px, 5vw, 24px)', color: INK, background: CARD, border: `1px solid ${LINE}`, borderRadius: 14 },
  linkDot: { fontSize: 18, color: SUB },
  analogyRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 7, rowGap: 8 },
  anWord: { padding: '9px 13px', fontWeight: 700, fontSize: 'clamp(15px, 4vw, 19px)', color: INK, background: CARD, border: `1px solid ${LINE}`, borderRadius: 11 },
  anSep: { fontWeight: 700, color: SUB, fontSize: 17 },
  anQ: { fontWeight: 800, fontSize: 26, color: ACC, padding: '0 4px' },
  pairGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  pairTile: { padding: '20px 10px', fontWeight: 700, fontSize: 'clamp(15px, 4vw, 18px)', color: INK, background: CARD, borderWidth: 1, borderStyle: 'solid', borderColor: LINE, borderRadius: 14, cursor: 'pointer', transition: 'border-color 0.1s, background 0.1s' },
  pairTileOn: { borderColor: ACC, background: '#fdf6ea' },
  options: { display: 'flex', flexDirection: 'column', gap: 10 },
  opt: { padding: '15px 16px', borderRadius: 13, borderWidth: 1, borderStyle: 'solid', borderColor: LINE, background: CARD, fontWeight: 600, fontSize: 'clamp(15px, 4vw, 17px)', color: INK, textAlign: 'start', cursor: 'pointer', lineHeight: 1.35, transition: 'border-color 0.1s, background 0.1s, opacity 0.1s' },
  feedback: { textAlign: 'center', fontWeight: 700, fontSize: 14, minHeight: 20 },
  survTrack: { height: 3, background: '#efe8db', flexShrink: 0 },
  survFill: { height: '100%', transition: 'width 0.08s linear' },
  overWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overCard: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, padding: '32px 28px', textAlign: 'center', maxWidth: 340, width: '100%', boxShadow: '0 8px 30px rgba(26,18,8,0.08)' },
  overTitle: { margin: '0 0 6px', fontWeight: 800, fontSize: 22, color: INK },
  overSub: { margin: 0, fontWeight: 600, color: SUB },
  btnPri: { padding: '12px 22px', borderRadius: 12, border: 'none', background: ACC, color: '#fff', fontWeight: 800, cursor: 'pointer' },
  btnGhost: { padding: '12px 20px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#fff', fontWeight: 700, color: INK, cursor: 'pointer' },
};
