import React, { useRef, useState, useEffect, useCallback } from 'react';
import { makeRng } from '../../../../shared/rng';

/*
 * QuizEngine — shared word-recognition engine for the bilingual Language games
 * (Odd One Out, Synonyms & Antonyms). A trial is a prompt + a few tappable word
 * options, one correct. Works in EN and AR (RTL via `isAr`). Plugs into ModeShell.
 *
 * Game supplies makeTrial({ mode, diff, level, trialNum, rng }) => { prompt:{text,sub}, options:[{key,label,correct}] }.
 * Modes: free (endless), levels (PER_LEVEL trials, win on accuracy), passplay
 * (fixed attempt.trials, reports score for ranking). `seed` makes passplay/levels
 * deterministic so every Pass n Play player gets identical questions.
 */

const PER_LEVEL = 10;
const WIN_ACC = 0.7;

export default function QuizEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, makeTrial, titleEn, titleAr }) {
  const makeRef = useRef(makeTrial);
  makeRef.current = makeTrial;
  const trialNumRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const scoreRef = useRef(0);
  const lockRef = useRef(false);
  const timerRef = useRef(null);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 8) : 0;

  const [trial, setTrial] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [fb, setFb] = useState({ key: null, ok: false });

  const next = useCallback(() => {
    lockRef.current = false;
    setFb({ key: null, ok: false });
    const n = trialNumRef.current;
    const rng = seed != null ? makeRng((seed >>> 0) + n * 7919) : Math.random;
    setTrial(makeRef.current({ mode, diff, level, trialNum: n, rng }));
  }, [mode, diff, level, seed]);

  useEffect(() => {
    next();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback((opt) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const ok = !!opt.correct;
    setFb({ key: opt.key, ok });
    if (ok) { scoreRef.current += 10; setScore(scoreRef.current); correctRef.current += 1; setCorrect(correctRef.current); playSfx?.('win'); awardPoints?.(1); }
    else { playSfx?.('lose'); }
    totalRef.current += 1; trialNumRef.current += 1;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels' && totalRef.current >= PER_LEVEL) {
        const acc = correctRef.current / PER_LEVEL;
        onResult({ won: acc >= WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${PER_LEVEL} (${Math.round(acc * 100)}%)` });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) {
        onResult({ score: correctRef.current });
        return;
      }
      next();
    }, ok ? 520 : 880);
  }, [awardPoints, mode, next, onResult, playSfx, ppTrials]);

  const S = styles;
  const hud = mode === 'levels' ? `${trialNumRef.current}/${PER_LEVEL} · ✓${correct}`
    : mode === 'passplay' ? `${trialNumRef.current}/${ppTrials} · ✓${correct}`
      : (isAr ? `نقاط ${score}` : `Score ${score}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? titleAr : titleEn}</div>
          <div className="ct-training-play-sub">{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {trial ? (
        <div style={S.body}>
          <div style={S.promptWrap}>
            {trial.prompt.sub ? <div style={S.promptSub}>{trial.prompt.sub}</div> : null}
            <div style={{ ...S.promptText, fontFamily: isAr ? "'Cairo', sans-serif" : S.promptText.fontFamily }}>{trial.prompt.text}</div>
          </div>
          <div style={S.options}>
            {trial.options.map((o) => {
              const showFb = fb.key === o.key;
              const reveal = fb.key !== null && o.correct;
              let bg = '#fffdf8', border = '#cdbfa6', col = '#2a2218';
              if (showFb) { bg = fb.ok ? '#dff7e6' : '#fdeae8'; border = fb.ok ? '#4caf6e' : '#e0594a'; }
              else if (reveal) { border = '#4caf6e'; bg = '#eafaef'; }
              return (
                <button key={o.key} style={{ ...S.opt, background: bg, borderColor: border, color: col, fontFamily: isAr ? "'Cairo', sans-serif" : S.opt.fontFamily }} onClick={() => pick(o)}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#f6efe4,#efe6d6)', color: '#2a2218', fontFamily: "'Outfit', system-ui, sans-serif" },
  body: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28, padding: '18px 18px 28px', maxWidth: 560, width: '100%', margin: '0 auto' },
  promptWrap: { textAlign: 'center' },
  promptSub: { fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8a6a3a', marginBottom: 10 },
  promptText: { fontSize: 'clamp(30px, 8vw, 48px)', fontWeight: 800, color: '#2a2218', fontFamily: "'Fredoka One', cursive" },
  options: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
  opt: { padding: '18px 14px', borderRadius: 14, border: '2px solid', font: '700 17px Outfit, sans-serif', cursor: 'pointer', transition: 'all .1s', minHeight: 60, boxShadow: '2px 2px 0 rgba(26,18,8,0.12)' },
};
