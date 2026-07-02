import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import CosmosCharacter from '../../../../../character/CosmosCharacter';

/*
 * Card Sort — the Wisconsin Card Sorting Test (WCST) as a training game.  [flexibility]
 *
 * Sort each dealt card to one of four reference cards — but by COLOUR, SHAPE or
 * NUMBER? The rule is hidden; you get only right/wrong, infer it, then notice
 * when it SILENTLY switches and shift (Berg, 1948). Kawkab reacts and the card
 * flies onto the chosen pile.
 *
 * Modes (shared ModeShell): Survival (60s) · Levels (100 each × 3 diff) · Pass n Play.
 */

// minimalist app palette (matches Word Links / the training surface)
const INK = '#2d2a26';
const SUB = '#8a7f6f';
const LINE = '#e7ddcc';
const CARD = '#fffefb';
const ACC = '#b84878';   // flexibility deep pink
const OK = '#3a9d5d';
const BAD = '#cf5b50';

const PER_LEVEL = 16;
const WIN_ACC = 0.72;
const PP_TRIALS = 16;

const COLORS = ['#e05a5a', '#3aa564', '#e0a92e', '#4f8fd0']; // red green yellow blue
const SHAPES = ['triangle', 'star', 'cross', 'circle'];
// Reference card i = { color: COLORS[i], shape: SHAPES[i], number: i + 1 }.
const REFERENCE = [0, 1, 2, 3].map((i) => ({ shape: SHAPES[i], color: COLORS[i], number: i + 1 }));

function dealCard(rng) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const [ci, si, ni] = order; // distinct reference index per dimension → every choice is diagnostic
  return { color: COLORS[ci], shape: SHAPES[si], number: ni + 1, match: { color: ci, shape: si, number: ni } };
}

function switchAfter(mode, diff, level, ramp) {
  if (mode === 'free') return Math.max(3, Math.round(6 - (ramp ?? 0) * 3)); // 6 → 3 as it ramps
  if (mode === 'passplay') return 4;
  const base = diff === 'easy' ? 6 : diff === 'hard' ? 4 : 5;
  const f = ((level || 1) - 1) / 99;
  return Math.max(3, Math.round(base - f));
}

function Glyph({ shape, color, size = 22 }) {
  const common = { width: size, height: size, display: 'block' };
  if (shape === 'circle') return <svg viewBox="0 0 24 24" style={common}><circle cx="12" cy="12" r="9" fill={color} /></svg>;
  if (shape === 'triangle') return <svg viewBox="0 0 24 24" style={common}><polygon points="12,3 22,21 2,21" fill={color} /></svg>;
  if (shape === 'cross') return <svg viewBox="0 0 24 24" style={common}><path d="M9 2 h6 v7 h7 v6 h-7 v7 h-6 v-7 h-7 v-6 h7 z" fill={color} /></svg>;
  return <svg viewBox="0 0 24 24" style={common}><polygon points="12,2 15,9 22,9.3 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9.3 9,9" fill={color} /></svg>;
}

function CardFace({ shape, color, number, glyphSize = 22, style }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, padding: '10px 8px', display: 'grid', placeItems: 'center', minHeight: 70, ...style }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', maxWidth: number >= 3 ? 60 : 999 }}>
        {Array.from({ length: number }).map((_, i) => <Glyph key={i} shape={shape} color={color} size={glyphSize} />)}
      </div>
    </div>
  );
}

function WcstEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppTrials = mode === 'passplay' ? (attempt?.trials || PP_TRIALS) : 0;
  const isSurvival = mode === 'free';

  const trialRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const ruleRef = useRef(['color', 'shape', 'number'][Math.floor(makeRng((seed ?? 1) >>> 0)() * 3)]);
  const runRef = useRef(0);
  const prevRuleRef = useRef(null);
  const justSwitchedRef = useRef(false);
  const lockRef = useRef(false);
  const timerRef = useRef(null);
  const rampRef = useRef(0);
  const finishedRef = useRef(false);
  const stats = useRef({ afterN: 0, afterOk: 0, persev: 0, rules: 0 });

  const [runId, setRunId] = useState(0);
  const [card, setCard] = useState(() => dealCard(makeRng(((seed ?? 1) >>> 0) + 7919)));
  const [fly, setFly] = useState(null);   // { choice, ok }
  const [mood, setMood] = useState('focused');
  const [over, setOver] = useState(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [combo, setCombo] = useState(0);

  const finishSurvival = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true; lockRef.current = true;
    clearTimeout(timerRef.current);
    setOver({ score: scoreRef.current, correct: correctRef.current, rules: stats.current.rules });
    playSfx?.('error');
  }, [playSfx]);

  const remaining = useSurvivalCountdown(isSurvival && !over, finishSurvival);
  rampRef.current = isSurvival ? survivalRampFromRemaining(remaining) : 0;

  const nextCard = useCallback(() => {
    trialRef.current += 1;
    const rng = makeRng(((seed ?? 1) >>> 0) + trialRef.current * 7919 + runId * 104729);
    setCard(dealCard(rng));
    setFly(null); setMood('focused'); lockRef.current = false;
  }, [seed, runId]);

  const t = useMemo(() => ({
    prompt: isAr ? 'أين تضع هذه البطاقة؟' : 'Where does this card go?',
    think: isAr ? 'حلّل…' : 'Hmm…',
    yes: isAr ? 'وجدتها!' : 'Got it!',
    no: isAr ? 'ليست هذه' : 'Not that one',
    title: isAr ? 'فرز البطاقات' : 'Card Sort',
    over: isAr ? 'انتهى البقاء' : 'Survival over',
    again: isAr ? 'العب مجدداً' : 'Play again',
    menu: isAr ? 'القائمة' : 'Menu',
    rules: isAr ? 'قواعد' : 'rules',
  }), [isAr]);

  const choose = useCallback((choice) => {
    if (lockRef.current || finishedRef.current) return;
    lockRef.current = true;
    const rule = ruleRef.current;
    const ok = choice === card.match[rule];
    const s = stats.current;
    totalRef.current += 1; setTotal(totalRef.current);
    if (justSwitchedRef.current) {
      s.afterN += 1; if (ok) s.afterOk += 1;
      if (!ok && prevRuleRef.current && choice === card.match[prevRuleRef.current]) s.persev += 1;
      justSwitchedRef.current = false;
    }
    if (ok) {
      const bonus = 10 + Math.min(comboRef.current, 8) * 2;
      scoreRef.current += bonus; correctRef.current += 1; comboRef.current += 1;
      setScore(scoreRef.current); setCorrect(correctRef.current); setCombo(comboRef.current);
      playSfx?.('win'); awardPoints?.(1);
    } else {
      comboRef.current = 0; setCombo(0);
      playSfx?.('lose');
    }
    setFly({ choice, ok }); setMood(ok ? 'proud' : 'tired');

    // update the hidden rule (silent switch after a run of correct sorts)
    let run = ok ? runRef.current + 1 : 0;
    if (run >= switchAfter(mode, diff, level, rampRef.current)) {
      prevRuleRef.current = rule; s.rules += 1;
      const opts = ['color', 'shape', 'number'].filter((x) => x !== rule);
      ruleRef.current = opts[Math.floor(Math.random() * opts.length)];
      run = 0; justSwitchedRef.current = true;
    }
    runRef.current = run;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels' && totalRef.current >= PER_LEVEL) {
        const acc = correctRef.current / PER_LEVEL;
        onResult({ won: acc >= WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${PER_LEVEL} (${Math.round(acc * 100)}%)` });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) { onResult({ score: correctRef.current }); return; }
      if (isSurvival && finishedRef.current) return;
      nextCard();
    }, ok ? 520 : 780);
  }, [card, mode, diff, level, ppTrials, isSurvival, nextCard, onResult, playSfx, awardPoints]);

  const restartSurvival = () => {
    clearTimeout(timerRef.current);
    trialRef.current = 0; correctRef.current = 0; totalRef.current = 0; scoreRef.current = 0; comboRef.current = 0;
    runRef.current = 0; prevRuleRef.current = null; justSwitchedRef.current = false; lockRef.current = false; finishedRef.current = false;
    stats.current = { afterN: 0, afterOk: 0, persev: 0, rules: 0 };
    ruleRef.current = ['color', 'shape', 'number'][Math.floor(Math.random() * 3)];
    setScore(0); setCorrect(0); setTotal(0); setCombo(0); setOver(null); setMood('focused');
    setCard(dealCard(makeRng((Date.now() >>> 0) + 7919))); setFly(null);
    setRunId((n) => n + 1);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const hud = mode === 'levels' ? `${total}/${PER_LEVEL} · ✓${correct}`
    : mode === 'passplay' ? `${total}/${ppTrials} · ✓${correct}`
      : `✓${correct} · ${score}${combo > 1 ? ` · 🔥${combo}` : ''}`;
  const say = fly ? (fly.ok ? t.yes : t.no) : t.think;

  if (over && isSurvival) {
    return (
      <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
        <div style={S.overWrap}>
          <div style={S.overCard}>
            <CosmosCharacter size={72} faceOnly mood="proud" />
            <h2 style={S.overTitle}>{t.over}</h2>
            <p style={S.overSub}>{`✓ ${over.correct} · ${over.score} ${isAr ? 'نقطة' : 'pts'} · ${over.rules} ${t.rules}`}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <button type="button" style={S.btnPri} onClick={() => { playSfx?.('click'); restartSurvival(); }}>{t.again}</button>
              <button type="button" style={S.btnGhost} onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flyTransform = fly
    ? `translateX(${(fly.choice - 1.5) * 23}vw) translateY(-38vh) scale(0.42) rotate(${(fly.choice - 1.5) * 6}deg)`
    : 'none';

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

      <div style={S.body}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <CosmosCharacter size={44} faceOnly mood={mood} />
          <span style={{ ...S.say, color: fly ? (fly.ok ? OK : BAD) : SUB }}>{say}</span>
        </div>
        <div style={S.prompt}>{t.prompt}</div>

        {/* reference piles */}
        <div style={S.refRow}>
          {REFERENCE.map((ref, i) => {
            const isChoice = fly && fly.choice === i;
            const ring = isChoice ? (fly.ok ? OK : BAD) : 'transparent';
            return (
              <button key={i} type="button" onClick={() => choose(i)} disabled={!!fly}
                style={{ ...S.refBtn, borderColor: ring, transform: isChoice ? 'translateY(-4px)' : 'none' }}>
                <CardFace shape={ref.shape} color={ref.color} number={ref.number} glyphSize={15} />
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, minHeight: 12 }} />

        {/* the card to sort */}
        <div style={S.dealWrap}>
          <div key={`${runId}-${trialRef.current}`} style={{
            width: 'min(56%, 190px)', transform: flyTransform, opacity: fly ? 0 : 1,
            transition: fly ? 'transform 500ms cubic-bezier(.5,0,.75,0), opacity 500ms ease-in' : 'none',
            animation: fly ? 'none' : 'wc-deal 300ms ease-out',
          }}>
            <CardFace shape={card.shape} color={card.color} number={card.number} glyphSize={28} style={{ minHeight: 116, borderRadius: 16 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardSortGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_wcst"
      scienceId="wisconsin"
      title={{ en: 'Card Sort', ar: 'فرز البطاقات' }}
      hints={{
        free: { en: '60s survival · rule flips faster as you go', ar: '٦٠ث بقاء · القاعدة تتبدّل أسرع' },
        levels: { en: '3 difficulties · rule switches sooner on hard', ar: '٣ صعوبات · التبديل أبكر في الصعب' },
        pass: { en: 'Same cards for everyone · pass the device', ar: 'نفس البطاقات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRIALS, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <WcstEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const KEYFRAMES = `@keyframes wc-deal { 0%{transform:translateY(46px) scale(0.9); opacity:0} 100%{transform:translateY(0) scale(1); opacity:1} }`;

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: INK, fontFamily: "'Outfit', system-ui, sans-serif" },
  body: { flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '10px 18px calc(24px + env(safe-area-inset-bottom))', maxWidth: 460, width: '100%', margin: '0 auto' },
  say: { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '6px 12px', fontWeight: 700, fontSize: 14 },
  prompt: { fontWeight: 600, fontSize: 'clamp(15px, 4vw, 18px)', textAlign: 'center', color: SUB },
  refRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 },
  refBtn: { border: '3px solid transparent', borderRadius: 14, padding: 3, background: 'transparent', cursor: 'pointer', transition: 'border-color 0.12s, transform 0.12s' },
  dealWrap: { display: 'grid', placeItems: 'center', minHeight: 130 },
  overWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  overCard: { background: CARD, border: `1px solid ${LINE}`, borderRadius: 20, padding: '28px 26px', textAlign: 'center', maxWidth: 340, width: '100%', boxShadow: '0 8px 30px rgba(26,18,8,0.08)' },
  overTitle: { margin: '10px 0 6px', fontWeight: 800, fontSize: 22, color: INK },
  overSub: { margin: 0, fontWeight: 600, color: SUB },
  btnPri: { padding: '12px 22px', borderRadius: 12, border: 'none', background: ACC, color: '#fff', fontWeight: 800, cursor: 'pointer' },
  btnGhost: { padding: '12px 20px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#fff', fontWeight: 700, color: INK, cursor: 'pointer' },
};
