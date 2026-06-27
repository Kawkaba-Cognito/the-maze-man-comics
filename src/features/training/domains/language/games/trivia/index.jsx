import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import CosmosCharacter from '../../../../../character/CosmosCharacter';
import { TRIVIA, TRIVIA_CATEGORIES } from './triviaData';

/*
 * Trivia — general-knowledge quiz with a STAIRCASE.
 *
 * Kawkab stands at the bottom of a staircase. Each correct answer climbs one
 * step; reach the top and the staircase is cleared. THREE wrong answers and
 * Kawkab is out.
 *   Levels    — one staircase per level; the level's TOPIC is set by the level
 *               (you "learn" a category at a time). Clear it = pass.
 *   Survival  — endless staircases, a RANDOM topic each time; mistakes carry
 *               across the whole run — 3 and you're out.
 *   Pass n Play — one shared staircase per player; score = steps climbed.
 *
 * Self-contained: emoji art, CSS keyframes only, no assets.
 */

const STAIR_CSS = `
@keyframes tv-hop {0%{transform:translateY(0)}40%{transform:translateY(-22%)}100%{transform:translateY(0)}}
@keyframes tv-pop {0%{transform:scale(0.6);opacity:0}55%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes tv-shake {0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
`;

const LIVES = 3;
const STEPS = { easy: 5, med: 6, hard: 7 };
const survivalSteps = (stage) => Math.min(8, 5 + Math.floor(stage / 2));

const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── the staircase visual ──
function Staircase({ total, step }) {
  const W = total >= 8 ? 34 : 38;
  const unit = total > 1 ? Math.min(15, 86 / (total - 1)) : 14;
  const h = (i) => 18 + i * unit;
  const cw = total * W + 30;
  const reached = step >= total;
  const kCol = Math.min(step, total - 1);
  const kLeft = reached ? total * W - 6 : kCol * W + 1;
  const kBottom = reached ? h(total - 1) + 4 : h(kCol) + 2;
  return (
    <div style={{ position: 'relative', width: cw, height: h(total - 1) + 60, margin: '0 auto' }}>
      <div style={{ position: 'absolute', left: 0, bottom: 0, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ width: W - 2, height: h(i), background: i < step ? 'linear-gradient(180deg,#a6e0a4,#7ab87a)' : '#ead9bd', borderRadius: '6px 6px 0 0', border: '1.5px solid #b9a079', borderBottom: 'none' }} />
        ))}
      </div>
      <span style={{ position: 'absolute', left: total * W - 2, bottom: h(total - 1) + 4, fontSize: 24, animation: reached ? 'tv-pop 0.4s ease-out' : 'none' }}>🏁</span>
      <div style={{ position: 'absolute', left: kLeft, bottom: kBottom, transition: 'left 0.45s cubic-bezier(.34,1.4,.5,1), bottom 0.45s cubic-bezier(.34,1.4,.5,1)' }}>
        <div style={{ animation: 'tv-hop 0.45s ease-out' }} key={step}>
          <CosmosCharacter faceOnly size={38} glow mood={reached ? 'proud' : 'ready'} />
        </div>
      </div>
    </div>
  );
}

const T = {
  en: {
    title: 'Trivia', topic: 'Topic', step: (n, m) => `Step ${n}/${m}`,
    correct: 'Correct! ✓', wrong: 'Oops!', cleared: 'You reached the top! 🏁', out: 'Kawkab is out!',
    cont: 'Continue ›', again: 'Play again', menu: 'Menu',
    overTitle: 'Run over!', overSub: (s, p) => `${s} staircases · ${p} pts`,
    summaryWin: (m) => `Climbed all ${m} steps 🏁`, summaryLose: (n, m) => `${n}/${m} steps`,
  },
  ar: {
    title: 'معلومات', topic: 'الموضوع', step: (n, m) => `درجة ${n}/${m}`,
    correct: 'صحيح! ✓', wrong: 'عذراً!', cleared: 'وصلت إلى القمة! 🏁', out: 'خرج كوكب!',
    cont: 'متابعة ›', again: 'العب مجدداً', menu: 'القائمة',
    overTitle: 'انتهت المحاولة!', overSub: (s, p) => `${s} سلالم · ${p} نقطة`,
    summaryWin: (m) => `صعد كل الدرجات ${m} 🏁`, summaryLose: (n, m) => `${n}/${m} درجات`,
  },
};

function TriviaEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);

  // refs that timers/logic read (avoid stale closures)
  const stepRef = useRef(0);
  const mistakesRef = useRef(0);
  const stepsRef = useRef(STEPS.med);
  const queueRef = useRef([]);
  const qIdxRef = useRef(0);
  const stairsRef = useRef(0);   // survival: staircases cleared
  const scoreRef = useRef(0);    // survival: points
  const timerRef = useRef(null);

  const [category, setCategory] = useState(TRIVIA_CATEGORIES[0]);
  const [steps, setSteps] = useState(STEPS.med);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [q, setQ] = useState(null);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [over, setOver] = useState(null);

  const categoryFor = useCallback(() => {
    if (mode === 'levels') return TRIVIA_CATEGORIES[(level - 1) % TRIVIA_CATEGORIES.length];
    return TRIVIA_CATEGORIES[Math.floor(rng() * TRIVIA_CATEGORIES.length)];
  }, [mode, level, rng]);
  const stepsForRound = useCallback(() => {
    if (mode === 'levels') return STEPS[diff] || STEPS.med;
    if (mode === 'passplay') return 6;
    return survivalSteps(stairsRef.current);
  }, [mode, diff]);

  const present = useCallback(() => {
    const item = queueRef.current[qIdxRef.current % queueRef.current.length];
    const opts = shuffleR(item.o.map((pair, i) => ({ en: pair[0], ar: pair[1], correct: i === item.a })), rng);
    setQ(item);
    setOptions(opts);
    setPicked(null);
  }, [rng]);

  const newStaircase = useCallback(() => {
    const cat = categoryFor();
    const n = stepsForRound();
    stepsRef.current = n; setSteps(n);
    setCategory(cat);
    queueRef.current = shuffleR(TRIVIA[cat.id], rng);
    qIdxRef.current = 0;
    stepRef.current = 0; setStep(0);
    present();
  }, [categoryFor, stepsForRound, rng, present]);

  useEffect(() => {
    if (mode === 'free') { stairsRef.current = 0; scoreRef.current = 0; }
    mistakesRef.current = 0; setMistakes(0);
    setOver(null);
    newStaircase();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const finishStaircase = useCallback((reachedTop) => {
    if (mode === 'levels') {
      onResult({ won: reachedTop, score: stepRef.current, summary: reachedTop ? t.summaryWin(stepsRef.current) : t.summaryLose(stepRef.current, stepsRef.current) });
      return;
    }
    if (mode === 'passplay') { onResult({ score: stepRef.current }); return; }
    // survival
    if (reachedTop) {
      stairsRef.current += 1;
      scoreRef.current += stepRef.current * 10 + 25;
      awardPoints?.(3);
      newStaircase();
    } else {
      scoreRef.current += stepRef.current * 10;
      playSfx?.('lose');
      setOver({ stairs: stairsRef.current, score: scoreRef.current });
    }
  }, [mode, onResult, t, awardPoints, newStaircase, playSfx]);

  const nextQuestion = useCallback(() => { qIdxRef.current += 1; present(); }, [present]);

  const answer = (idx) => {
    if (picked != null) return;
    const opt = options[idx];
    setPicked(idx);
    if (opt.correct) {
      playSfx?.('collect');
      const ns = stepRef.current + 1; stepRef.current = ns; setStep(ns);
      if (mode === 'free') { scoreRef.current += 5; }
      timerRef.current = setTimeout(() => { if (ns >= stepsRef.current) finishStaircase(true); else nextQuestion(); }, 850);
    } else {
      playSfx?.('error');
      const nm = mistakesRef.current + 1; mistakesRef.current = nm; setMistakes(nm);
      timerRef.current = setTimeout(() => { if (nm >= LIVES) finishStaircase(false); else nextQuestion(); }, 1000);
    }
  };

  const boot = () => { clearTimeout(timerRef.current); stairsRef.current = 0; scoreRef.current = 0; mistakesRef.current = 0; setMistakes(0); setOver(null); newStaircase(); };

  const hudSub = mode === 'levels'
    ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'passplay'
      ? (isAr ? 'مرّر والعب' : 'Pass n Play')
      : (isAr ? `سلالم ${stairsRef.current} · ${scoreRef.current}` : `Stairs ${stairsRef.current} · ${scoreRef.current}`);

  if (over && mode === 'free') {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{STAIR_CSS}</style>
        <div style={S.overWrap}>
          <div style={{ fontSize: 46 }}>🪐</div>
          <h2 style={S.overTitle}>{t.overTitle}</h2>
          <p style={S.overSub}>{t.overSub(over.stairs, over.score)}</p>
          <div style={S.btnRow}>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); boot(); }}>{t.again}</button>
            <button type="button" style={S.ghost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
          </div>
        </div>
      </div>
    );
  }

  const feedback = picked == null ? '' : (options[picked]?.correct ? t.correct : t.wrong);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{STAIR_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{t.title}</div>
          <div className="ct-training-play-sub">{hudSub}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {/* staircase + lives + topic */}
      <div style={S.stairWrap}>
        <div style={S.livesRow}>
          <span style={S.topicChip}>{category.emoji} {isAr ? category.ar : category.en}</span>
          <span style={S.hearts} aria-label={`${LIVES - mistakes} lives`}>
            {'♥'.repeat(Math.max(0, LIVES - mistakes))}<span style={{ opacity: 0.25 }}>{'♥'.repeat(Math.max(0, mistakes))}</span>
          </span>
        </div>
        <Staircase total={steps} step={step} />
      </div>

      {/* question */}
      {q && (
        <div style={S.qWrap}>
          <div style={{ ...S.feedback, color: picked != null && options[picked]?.correct ? '#2e8b57' : '#d23b3b' }}>{feedback || `${t.step(Math.min(step + 1, steps), steps)}`}</div>
          <div style={S.qCard}>
            <span style={S.qEmoji}>{q.e}</span>
            <span style={S.qText}>{isAr ? q.ar : q.en}</span>
          </div>
          <div style={S.opts}>
            {options.map((o, i) => {
              const isPicked = picked === i;
              const showCorrect = picked != null && o.correct;
              const showWrong = isPicked && !o.correct;
              return (
                <button
                  key={i}
                  type="button"
                  style={{ ...S.opt, ...(showCorrect ? S.optOk : null), ...(showWrong ? S.optBad : null), ...(showWrong ? { animation: 'tv-shake 0.3s' } : null) }}
                  disabled={picked != null}
                  onClick={() => answer(i)}
                >
                  {isAr ? o.ar : o.en}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TriviaGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_language_trivia"
      scienceId="trivia"
      title={{ en: 'Trivia', ar: 'معلومات' }}
      hints={{
        free: { en: 'Endless · random topics · 3 mistakes out', ar: 'لا ينتهي · مواضيع عشوائية · ٣ أخطاء وتخرج' },
        levels: { en: 'A new topic each level · climb the staircase', ar: 'موضوع جديد كل مستوى · اصعد السلّم' },
        pass: { en: 'Same questions for all · climb highest', ar: 'نفس الأسئلة للجميع · من يصعد أعلى' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 1, scoreLabel: { en: 'steps', ar: 'درجات' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <TriviaEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  stairWrap: { flex: '0 0 auto', padding: '8px 14px 4px', display: 'flex', flexDirection: 'column', gap: 4 },
  livesRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 460, width: '100%', margin: '0 auto' },
  topicChip: { fontWeight: 800, fontSize: 13, color: '#7a5a1e', background: '#fff1d8', border: '2px solid #e3c489', borderRadius: 999, padding: '3px 12px' },
  hearts: { fontSize: 16, color: '#d23b3b', letterSpacing: 1 },
  qWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '6px 16px 20px', overflowY: 'auto' },
  feedback: { fontWeight: 900, fontSize: 15, minHeight: 20 },
  qCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 18, padding: '16px 18px', maxWidth: 420, width: '100%', boxShadow: '3px 3px 0 rgba(26,18,8,0.12)' },
  qEmoji: { fontSize: 48, lineHeight: 1 },
  qText: { fontWeight: 800, fontSize: 'clamp(16px, 4.6vw, 20px)', color: '#2d2210', textAlign: 'center', lineHeight: 1.3 },
  opts: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 420 },
  opt: { padding: '14px 18px', borderRadius: 14, border: '2px solid #1a1208', background: '#fffdf8', fontWeight: 800, fontSize: 16, cursor: 'pointer', color: '#2d2210', boxShadow: '2px 2px 0 #1a1208', textAlign: 'center' },
  optOk: { background: '#d4edda', borderColor: '#2e8b57', boxShadow: '2px 2px 0 #2e8b57' },
  optBad: { background: '#fde8e8', borderColor: '#d23b3b', boxShadow: '2px 2px 0 #d23b3b' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' },
  overTitle: { margin: '4px 0 0', fontWeight: 900, fontSize: 24, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
  primary: { padding: '12px 22px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghost: { padding: '12px 18px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
};
