import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import CosmosCharacter from '../../../../../character/CosmosCharacter';
import { TRIVIA, TRIVIA_CATEGORIES } from './triviaData';

/*
 * Trivia — general-knowledge quiz with a STAIRCASE. 16 categories × 24 graded
 * questions (★/★★/★★★), bilingual, each with a "did you know" fact.
 *
 * Kawkab climbs one step per correct answer; reach the top to clear the
 * staircase. THREE wrong answers and Kawkab is out.
 *   Levels    — topic cycles with the level; difficulty setting picks the
 *               question tier (★ easy / ★★ medium / ★★★ hard).
 *   Survival  — endless staircases; after each clear YOU choose the next topic
 *               from three cards; question difficulty ramps as you go.
 *   Pass n Play — same seeded questions for every player; score = steps.
 *
 * Anti-repeat: seen questions are remembered in localStorage across sessions —
 * unseen questions always come first, so daily play stays fresh.
 * No hints on the card give the answer away; after answering you get the fact.
 */

const STAIR_CSS = `
@keyframes tv-hop {0%{transform:translateY(0)}40%{transform:translateY(-22%)}100%{transform:translateY(0)}}
@keyframes tv-pop {0%{transform:scale(0.6);opacity:0}55%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes tv-shake {0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes tv-fact {0%{transform:translateY(8px);opacity:0}100%{transform:translateY(0);opacity:1}}
`;

const LIVES = 3;
const STEPS = { easy: 5, med: 6, hard: 7 };
const survivalSteps = (stage) => Math.min(8, 5 + Math.floor(stage / 2));
// Survival ramps harder, sooner: pure easy only at the very start, hard by mid-run.
const survivalTiers = (stage) => (stage < 1 ? [1] : stage < 3 ? [1, 2] : stage < 5 ? [2] : stage < 7 ? [2, 3] : [3]);
// Levels mix tiers so even "Easy" isn't trivial and "Hard" is genuinely hard.
const levelTiers = { easy: [1, 2], med: [2, 3], hard: [3] };

const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ── persistent “seen questions” memory (across sessions) ──
const SEEN_KEY = 'mm_trivia_seen_v2';
const loadSeen = () => { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch { return {}; } };
const saveSeen = (m) => {
  try {
    const e = Object.entries(m);
    if (e.length > 900) { e.sort((x, y) => x[1] - y[1]); for (const [k] of e.slice(0, e.length - 700)) delete m[k]; }
    localStorage.setItem(SEEN_KEY, JSON.stringify(m));
  } catch { /* storage full/blocked — play continues without memory */ }
};

// Build a question queue for one staircase: target difficulty tier first,
// unseen before seen, least-recently-seen first among the seen.
function buildQueue(catId, tiers, rng, usePersistence) {
  const qs = TRIVIA[catId] || [];
  const tag = qs.map((q, i) => ({ q, id: `${catId}:${i}` }));
  let pool = tag.filter((x) => tiers.includes(x.q.d));
  if (pool.length < 8) pool = tag;
  const seen = usePersistence ? loadSeen() : {};
  const unseen = shuffleR(pool.filter((x) => !seen[x.id]), rng);
  const old = shuffleR(pool.filter((x) => seen[x.id]), rng).sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
  return [...unseen, ...old];
}

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
    title: 'Trivia', step: (n, m) => `Step ${n}/${m}`,
    correct: 'Correct! ✓', wrong: 'Not quite…', didYouKnow: 'Did you know?',
    next: 'Next ›', finish: 'Finish ›',
    pickTopic: 'Staircase cleared! 🏁', pickSub: 'Choose your next topic',
    cont: 'Continue ›', again: 'Play again', menu: 'Menu',
    overTitle: 'Run over!', overSub: (s, p) => `${s} staircases · ${p} pts`,
    summaryWin: (m) => `Climbed all ${m} steps 🏁`, summaryLose: (n, m) => `${n}/${m} steps`,
  },
  ar: {
    title: 'معلومات', step: (n, m) => `درجة ${n}/${m}`,
    correct: 'صحيح! ✓', wrong: 'ليس تماماً…', didYouKnow: 'هل تعلم؟',
    next: 'التالي ›', finish: 'إنهاء ›',
    pickTopic: 'أكملت السلّم! 🏁', pickSub: 'اختر موضوعك التالي',
    cont: 'متابعة ›', again: 'العب مجدداً', menu: 'القائمة',
    overTitle: 'انتهت المحاولة!', overSub: (s, p) => `${s} سلالم · ${p} نقطة`,
    summaryWin: (m) => `صعد كل الدرجات ${m} 🏁`, summaryLose: (n, m) => `${n}/${m} درجات`,
  },
};

function TriviaEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const persist = mode !== 'passplay'; // pass n play must stay seed-deterministic

  const stepRef = useRef(0);
  const mistakesRef = useRef(0);
  const stepsRef = useRef(STEPS.med);
  const queueRef = useRef([]);
  const qIdxRef = useRef(0);
  const stairsRef = useRef(0);   // survival: staircases cleared
  const scoreRef = useRef(0);    // survival: points

  const [category, setCategory] = useState(TRIVIA_CATEGORIES[0]);
  const [steps, setSteps] = useState(STEPS.med);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [q, setQ] = useState(null);
  const [options, setOptions] = useState([]);
  const [picked, setPicked] = useState(null);
  const [pickCats, setPickCats] = useState(null); // survival topic choice
  const [over, setOver] = useState(null);

  const tiersFor = useCallback(() => {
    if (mode === 'levels') return levelTiers[diff] || [2];
    if (mode === 'passplay') return [2];
    return survivalTiers(stairsRef.current);
  }, [mode, diff]);
  const stepsForRound = useCallback(() => {
    if (mode === 'levels') return STEPS[diff] || STEPS.med;
    if (mode === 'passplay') return 6;
    return survivalSteps(stairsRef.current);
  }, [mode, diff]);

  const present = useCallback(() => {
    const item = queueRef.current[qIdxRef.current % queueRef.current.length];
    const opts = shuffleR(item.q.o.map((pair, i) => ({ en: pair[0], ar: pair[1], correct: i === item.q.a })), rng);
    setQ(item);
    setOptions(opts);
    setPicked(null);
  }, [rng]);

  const newStaircase = useCallback((forcedCat) => {
    const cat = forcedCat
      || (mode === 'levels'
        ? TRIVIA_CATEGORIES[(level - 1) % TRIVIA_CATEGORIES.length]
        : TRIVIA_CATEGORIES[Math.floor(rng() * TRIVIA_CATEGORIES.length)]);
    const n = stepsForRound();
    stepsRef.current = n; setSteps(n);
    setCategory(cat);
    queueRef.current = buildQueue(cat.id, tiersFor(), rng, persist);
    qIdxRef.current = 0;
    stepRef.current = 0; setStep(0);
    setPickCats(null);
    present();
  }, [mode, level, rng, stepsForRound, tiersFor, persist, present]);

  useEffect(() => {
    if (mode === 'free') { stairsRef.current = 0; scoreRef.current = 0; }
    mistakesRef.current = 0; setMistakes(0);
    setOver(null);
    newStaircase();
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
      // let the player choose the next topic from three cards
      const others = shuffleR(TRIVIA_CATEGORIES.filter((c) => c.id !== category.id), rng).slice(0, 3);
      setPickCats(others);
      playSfx?.('win');
    } else {
      scoreRef.current += stepRef.current * 10;
      playSfx?.('lose');
      setOver({ stairs: stairsRef.current, score: scoreRef.current });
    }
  }, [mode, onResult, t, awardPoints, category, rng, playSfx]);

  const answer = (idx) => {
    if (picked != null) return;
    const opt = options[idx];
    setPicked(idx);
    if (persist && q) { const seen = loadSeen(); seen[q.id] = Date.now(); saveSeen(seen); }
    if (opt.correct) {
      playSfx?.('collect');
      stepRef.current += 1; setStep(stepRef.current);
      if (mode === 'free') scoreRef.current += 5;
    } else {
      playSfx?.('error');
      mistakesRef.current += 1; setMistakes(mistakesRef.current);
    }
  };

  const proceed = () => {
    playSfx?.('click');
    if (mistakesRef.current >= LIVES) { finishStaircase(false); return; }
    if (stepRef.current >= stepsRef.current) { finishStaircase(true); return; }
    qIdxRef.current += 1;
    present();
  };

  const boot = () => { stairsRef.current = 0; scoreRef.current = 0; mistakesRef.current = 0; setMistakes(0); setOver(null); newStaircase(); };

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

  // ── survival: pick the next topic ──
  if (pickCats) {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <style>{STAIR_CSS}</style>
        <div style={S.overWrap}>
          <div style={{ fontSize: 42 }}>🏁</div>
          <h2 style={S.overTitle}>{t.pickTopic}</h2>
          <p style={S.overSub}>+25 · {t.pickSub}</p>
          <div style={S.pickRow}>
            {pickCats.map((c) => (
              <button key={c.id} type="button" style={S.pickCard} onClick={() => { playSfx?.('click'); newStaircase(c); }}>
                <span style={{ fontSize: 34 }}>{c.emoji}</span>
                <span style={S.pickName}>{isAr ? c.ar : c.en}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const answered = picked != null;
  const wasCorrect = answered && options[picked]?.correct;
  const feedback = answered ? (wasCorrect ? t.correct : t.wrong) : '';
  const atTop = stepRef.current >= stepsRef.current;
  const outOfLives = mistakesRef.current >= LIVES;

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
          <div style={{ ...S.feedback, color: wasCorrect ? '#2e8b57' : '#d23b3b' }}>{feedback || t.step(Math.min(step + 1, steps), steps)}</div>
          <div style={S.qCard}>
            <span style={S.qStars}>{'★'.repeat(q.q.d)}</span>
            <span style={S.qText}>{isAr ? q.q.ar : q.q.en}</span>
          </div>
          <div style={S.opts}>
            {options.map((o, i) => {
              const isPicked = picked === i;
              const showCorrect = answered && o.correct;
              const showWrong = isPicked && !o.correct;
              return (
                <button
                  key={i}
                  type="button"
                  style={{ ...S.opt, ...(showCorrect ? S.optOk : null), ...(showWrong ? S.optBad : null), ...(showWrong ? { animation: 'tv-shake 0.3s' } : null), ...(answered && !showCorrect && !showWrong ? { opacity: 0.55 } : null) }}
                  disabled={answered}
                  onClick={() => answer(i)}
                >
                  {isAr ? o.ar : o.en}
                </button>
              );
            })}
          </div>
          {answered && (
            <div style={S.afterWrap}>
              {q.q.f && (
                <div style={S.factBox}>
                  <span style={S.factHead}>💡 {t.didYouKnow}</span>
                  <span style={S.factTxt}>{isAr ? q.q.f.ar : q.q.f.en}</span>
                </div>
              )}
              <button type="button" style={S.primary} onClick={proceed}>{(atTop || outOfLives) ? t.finish : t.next}</button>
            </div>
          )}
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
        free: { en: '20 topics · pick your path · 3 mistakes out', ar: '٢٠ موضوعاً · اختر طريقك · ٣ أخطاء وتخرج' },
        levels: { en: 'A new topic each level · ★ by difficulty', ar: 'موضوع جديد كل مستوى · النجوم بحسب الصعوبة' },
        pass: { en: 'Same questions for all · climb highest', ar: 'نفس الأسئلة للجميع · من يصعد أعلى' },
      }}
      diffLabels={{ easy: { en: 'Easy ★–★★', ar: 'سهل ★–★★' }, med: { en: 'Medium ★★–★★★', ar: 'متوسط ★★–★★★' }, hard: { en: 'Hard ★★★', ar: 'صعب ★★★' } }}
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
  qWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 10, padding: '6px 16px calc(20px + env(safe-area-inset-bottom))', overflowY: 'auto' },
  feedback: { fontWeight: 900, fontSize: 15, minHeight: 20 },
  qCard: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 18, padding: '14px 18px', maxWidth: 430, width: '100%', boxShadow: '3px 3px 0 rgba(26,18,8,0.12)' },
  qStars: { fontSize: 11, fontWeight: 900, color: '#c9a24b', letterSpacing: 2 },
  qText: { fontWeight: 800, fontSize: 'clamp(15.5px, 4.4vw, 19px)', color: '#2d2210', textAlign: 'center', lineHeight: 1.35 },
  opts: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 430 },
  opt: { padding: '12px 16px', borderRadius: 13, border: '2px solid #1a1208', background: '#fffdf8', fontWeight: 800, fontSize: 15, cursor: 'pointer', color: '#2d2210', boxShadow: '2px 2px 0 #1a1208', textAlign: 'center', lineHeight: 1.3 },
  optOk: { background: '#d4edda', borderColor: '#2e8b57', boxShadow: '2px 2px 0 #2e8b57' },
  optBad: { background: '#fde8e8', borderColor: '#d23b3b', boxShadow: '2px 2px 0 #d23b3b' },
  afterWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%', maxWidth: 430, animation: 'tv-fact 0.3s ease-out' },
  factBox: { width: '100%', background: '#fff8ec', border: '1.5px solid #e3c489', borderRadius: 13, padding: '9px 13px', display: 'flex', flexDirection: 'column', gap: 3 },
  factHead: { fontSize: 11, fontWeight: 900, color: '#a37b2f', textTransform: 'uppercase', letterSpacing: 0.6 },
  factTxt: { fontWeight: 700, fontSize: 13.5, color: '#5a4a32', lineHeight: 1.45 },
  pickRow: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 },
  pickCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 16px', minWidth: 104, borderRadius: 16, border: '2px solid #1a1208', background: '#fffdf8', cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208', animation: 'tv-pop 0.3s ease-out' },
  pickName: { fontWeight: 800, fontSize: 12.5, color: '#2d2210', textAlign: 'center' },
  overWrap: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, textAlign: 'center' },
  overTitle: { margin: '4px 0 0', fontWeight: 900, fontSize: 24, color: '#2d2210' },
  overSub: { margin: 0, fontWeight: 700, color: '#5a4a32' },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
  primary: { padding: '12px 26px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  ghost: { padding: '12px 18px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
};
