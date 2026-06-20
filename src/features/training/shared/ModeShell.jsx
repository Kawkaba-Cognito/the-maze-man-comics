import React, { useCallback, useMemo, useState } from 'react';
import { TrainingScreenShell, TrainingDifficultySelect, TrainingLevelGrid } from './TrainingScreens';

/*
 * ModeShell — the standard 3-mode flow shared by the newer Attention games
 * (Target Tracking, Attention Cue). It reproduces the structure the other
 * training games use without each game re-implementing it:
 *
 *   menu  → Free · Levels · Challenge
 *   Free      → endless practice, no fail (also what Daily Workout runs)
 *   Levels    → Easy/Medium/Hard difficulty → a grid of levels (unlock + ✓)
 *   Challenge → one escalating run with lives → best score is saved
 *
 * The game supplies a `renderEngine({ mode, diff, level, onResult, onExit })`
 * that draws/owns the actual play surface and reports back:
 *   • Levels:    onResult({ won, score })
 *   • Challenge: onResult({ score })
 *   • Free:      never resolves (player exits via the in-game back button → onExit)
 *
 * Progress (cleared levels per difficulty + best challenge score) is persisted
 * in localStorage under `storageKey`.
 */

const DIFF_KEYS = ['easy', 'med', 'hard'];

function loadProg(key) {
  try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; }
}
function saveProg(key, st) {
  try { localStorage.setItem(key, JSON.stringify(st)); } catch { /* ignore */ }
}

export default function ModeShell({
  storageKey,
  title,             // { en, ar }
  hints,             // { free:{en,ar}, levels:{...}, challenge:{...} }
  diffLabels,        // { easy:{en,ar}, med:{...}, hard:{...} }
  levelCount = 12,
  isAr,
  playSfx,
  onBack,            // exit the whole game (back to the hub)
  workoutMode = false,
  renderEngine,
}) {
  const [prog, setProg] = useState(() => {
    const p = loadProg(storageKey);
    return { done: { easy: [], med: [], hard: [], ...(p.done || {}) }, best: p.best || 0 };
  });
  const [phase, setPhase] = useState(workoutMode ? 'play' : 'menu');
  const [mode, setMode] = useState(workoutMode ? 'free' : null);
  const [diff, setDiff] = useState(null);
  const [level, setLevel] = useState(null);
  const [result, setResult] = useState(null);

  const dm = useMemo(() => ({
    easy: { label: isAr ? diffLabels.easy.ar : diffLabels.easy.en },
    med: { label: isAr ? diffLabels.med.ar : diffLabels.med.en },
    hard: { label: isAr ? diffLabels.hard.ar : diffLabels.hard.en },
  }), [diffLabels, isAr]);

  const isUnlocked = useCallback((lv) => lv === 1 || (prog.done[diff] || []).includes(lv - 1), [prog, diff]);
  const isDone = useCallback((lv) => (prog.done[diff] || []).includes(lv), [prog, diff]);

  const onResult = useCallback((res) => {
    if (mode === 'levels' && res.won) {
      setProg((p) => {
        const cur = new Set(p.done[diff] || []);
        cur.add(level);
        const next = { ...p, done: { ...p.done, [diff]: [...cur] } };
        saveProg(storageKey, next);
        return next;
      });
    }
    if (mode === 'challenge' && (res.score || 0) > prog.best) {
      setProg((p) => {
        const next = { ...p, best: res.score };
        saveProg(storageKey, next);
        return next;
      });
    }
    setResult({ ...res, mode, diff, level });
    setPhase('result');
  }, [mode, diff, level, prog.best, storageKey]);

  const goMenu = useCallback(() => { setPhase('menu'); setMode(null); setResult(null); }, []);

  const startMode = (m) => {
    playSfx?.('click');
    setMode(m);
    if (m === 'free' || m === 'challenge') setPhase('play');
    else setPhase('diff');
  };

  const T = isAr ? title.ar : title.en;
  const L = {
    free: isAr ? 'حر' : 'Free Play',
    levels: isAr ? 'مستويات' : 'Levels',
    challenge: isAr ? 'تحدٍّ' : 'Challenge',
  };

  // ── Play (engine owns the surface) ──
  if (phase === 'play') {
    return renderEngine({ mode, diff, level, onResult, onExit: workoutMode ? onBack : goMenu, isLevel: mode === 'levels' });
  }

  // ── Mode menu ──
  if (phase === 'menu') {
    const cards = [
      { k: 'free', ic: '♾️', lb: L.free, hint: hints?.free, mod: 'ct-fq-attn-mode--free' },
      { k: 'levels', ic: '🎯', lb: L.levels, hint: hints?.levels, mod: 'ct-fq-attn-mode--levels' },
      { k: 'challenge', ic: '⚔️', lb: L.challenge, hint: hints?.challenge, mod: 'ct-fq-attn-mode--chal' },
    ];
    return (
      <TrainingScreenShell isAr={isAr} playSfx={playSfx} onBack={onBack} title={T} hub>
        <div className="ct-fq-attn-modes" role="group">
          {cards.map((m) => (
            <button key={m.k} type="button" className={`ct-fq-attn-mode ${m.mod}`} onClick={() => startMode(m.k)}>
              <span className="ct-fq-attn-mode-ic" aria-hidden="true">{m.ic}</span>
              <span className="ct-fq-attn-mode-body">
                <span className="ct-fq-attn-mode-lb">{m.lb}</span>
                {m.hint ? <span className={`ct-fq-attn-mode-hint${isAr ? ' ct-fq-attn-mode-hint-ar' : ''}`}>{isAr ? m.hint.ar : m.hint.en}</span> : null}
              </span>
              <span className="ct-fq-attn-mode-chev" aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      </TrainingScreenShell>
    );
  }

  // ── Difficulty (Levels mode) ──
  if (phase === 'diff') {
    return (
      <TrainingDifficultySelect
        isAr={isAr} playSfx={playSfx} onBack={goMenu} title={T}
        blurb={isAr ? 'اختر الصعوبة' : 'Choose a difficulty'}
        diffKeys={DIFF_KEYS} dm={dm}
        onPick={(k) => { setDiff(k); setPhase('levels'); }}
      />
    );
  }

  // ── Level grid (Levels mode) ──
  if (phase === 'levels') {
    return (
      <TrainingLevelGrid
        isAr={isAr} playSfx={playSfx} onBack={() => setPhase('diff')} title={`${T} · ${dm[diff].label}`}
        count={levelCount} isUnlocked={isUnlocked} isDone={isDone}
        sublabel={(lv) => `L${lv}`}
        onPick={(lv) => { setLevel(lv); setPhase('play'); }}
      />
    );
  }

  // ── Result ──
  if (phase === 'result' && result) {
    const won = result.won;
    const isLast = result.mode === 'levels' && result.level >= levelCount;
    return (
      <div className="ct-training-ov" role="dialog" aria-modal="true">
        <div className="ct-training-modal" style={{ textAlign: 'center' }}>
          <h2 className="ct-training-modal-title">
            {result.mode === 'challenge'
              ? (isAr ? 'انتهى التحدّي' : 'Run over')
              : won ? (isAr ? 'أحسنت! ✓' : 'Level cleared! ✓') : (isAr ? 'حاول مجدداً' : 'Not quite')}
          </h2>
          {result.summary ? <p className="ct-training-modal-text">{result.summary}</p> : null}
          {result.mode === 'challenge' ? (
            <p className="ct-training-modal-text">
              {isAr ? 'النتيجة' : 'Score'}: <b>{result.score}</b> · {isAr ? 'الأفضل' : 'Best'}: <b>{Math.max(prog.best, result.score || 0)}</b>
            </p>
          ) : null}
          <div className="ct-training-modal-actions">
            {result.mode === 'levels' && won && !isLast && (
              <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); setLevel(result.level + 1); setResult(null); setPhase('play'); }}>
                {isAr ? 'المستوى التالي' : 'Next level'}
              </button>
            )}
            {result.mode !== 'free' && (
              <button type="button" className="ct-training-btn ct-training-btn--pri" onClick={() => { playSfx?.('click'); setResult(null); setPhase('play'); }}>
                {result.mode === 'challenge' ? (isAr ? 'العب مجدداً' : 'Play again') : won ? (isAr ? 'إعادة' : 'Replay') : (isAr ? 'حاول مجدداً' : 'Retry')}
              </button>
            )}
            <button type="button" className="ct-training-btn ct-training-btn--ghost" onClick={() => { playSfx?.('click'); goMenu(); }}>
              {isAr ? 'القائمة' : 'Menu'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
