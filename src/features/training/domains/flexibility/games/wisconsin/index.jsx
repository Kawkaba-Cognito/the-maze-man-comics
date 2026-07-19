import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { survivalRampFromRemaining } from '../../../../shared/survival';
import { useSurvivalCountdown, SurvivalCountdownBar } from '../../../../shared/SurvivalCountdown';
import CosmosCharacter from '../../../../../character/CosmosCharacter';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const Wisconsin3DProto = lazyWithRetry(() => import('./Wisconsin3DProto'), 'wisconsin-3d');

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
const SUB = '#8a7f6f';
const ACC = '#b84878';   // flexibility deep pink
const OK = '#3a9d5d';
const BAD = '#cf5b50';

const PER_LEVEL = 16;
const WIN_ACC = 0.72;
const PP_TRIALS = 16;

// Card feature banks + the hidden-rule state machine helpers. Exported so the 3D
// proto plays the EXACT same WCST (same cards, same silent rule switches).
export const COLORS = ['#e05a5a', '#3aa564', '#e0a92e', '#4f8fd0']; // red green yellow blue
export const SHAPES = ['triangle', 'star', 'cross', 'circle'];
// Reference card i = { color: COLORS[i], shape: SHAPES[i], number: i + 1 }.
export const REFERENCE = [0, 1, 2, 3].map((i) => ({ shape: SHAPES[i], color: COLORS[i], number: i + 1 }));

export const RULES = ['color', 'shape', 'number'];

export function pickRule(rng, exclude) {
  const opts = RULES.filter((x) => x !== exclude);
  return opts[Math.floor(rng() * opts.length)];
}

export function dealCard(rng) {
  const order = [0, 1, 2, 3];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const [ci, si, ni] = order; // distinct reference index per dimension → every choice is diagnostic
  return { color: COLORS[ci], shape: SHAPES[si], number: ni + 1, match: { color: ci, shape: si, number: ni } };
}

export function switchAfter(mode, diff, level, ramp) {
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

function CardFace({ shape, color, number, glyphSize = 22, deal = false }) {
  return (
    <div className={`ct-wcst-card-face${deal ? ' ct-wcst-card-face--deal' : ''}`}>
      <div className={`ct-wcst-glyphs${number >= 3 ? ' ct-wcst-glyphs--tight' : ''}`}>
        {Array.from({ length: number }).map((_, i) => (
          <Glyph key={i} shape={shape} color={color} size={glyphSize} />
        ))}
      </div>
    </div>
  );
}

export function WcstEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
  const ppTrials = mode === 'passplay' ? (attempt?.trials || PP_TRIALS) : 0;
  const isSurvival = mode === 'free';

  const trialRef = useRef(0);
  const correctRef = useRef(0);
  const totalRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const ruleRef = useRef(pickRule(makeRng((seed ?? 1) >>> 0), null));
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
  const [shiftToast, setShiftToast] = useState(false);
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
    awardFreeRun?.('wisconsin', correctRef.current);
    playSfx?.('error');
  }, [playSfx, awardFreeRun]);

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
    tryOther: isAr ? 'جرّب مطابقة مختلفة — لون أو شكل أو عدد' : 'Try a different match — colour, shape, or count',
    shift: isAr ? 'تبدّلت القاعدة — ابحث عن الجديدة' : 'Rule shifted — find the new one',
    dimColor: isAr ? 'لون' : 'Colour',
    dimShape: isAr ? 'شكل' : 'Shape',
    dimNumber: isAr ? 'عدد' : 'Count',
    oneRule: isAr ? 'قاعدة واحدة نشطة — لون أو شكل أو عدد' : 'One active rule — colour, shape, or count',
    title: isAr ? 'فرز البطاقات' : 'Card Sort',
    over: isAr ? 'انتهى البقاء' : 'Survival over',
    again: isAr ? 'العب مجدداً' : 'Play again',
    menu: isAr ? 'القائمة' : 'Menu',
    rules: isAr ? 'قواعد' : 'rules',
    refAria: (i) => (isAr ? `البطاقة المرجعية ${i + 1}` : `Reference card ${i + 1}`),
  }), [isAr]);

  const choose = useCallback((choice) => {
    if (lockRef.current || finishedRef.current) return;
    lockRef.current = true;
    const rule = ruleRef.current;
    const postSwitchTrial = justSwitchedRef.current;
    const ok = choice === card.match[rule];
    const s = stats.current;
    totalRef.current += 1; setTotal(totalRef.current);
    if (postSwitchTrial) {
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
    setFly({ choice, ok, hintTryOther: !ok && (postSwitchTrial || (prevRuleRef.current && choice === card.match[prevRuleRef.current])) });
    setMood(ok ? 'proud' : 'tired');
    let run = ok ? runRef.current + 1 : 0;
    if (run >= switchAfter(mode, diff, level, rampRef.current)) {
      prevRuleRef.current = rule; s.rules += 1;
      const switchRng = makeRng(((seed ?? 1) >>> 0) + totalRef.current * 104729 + s.rules * 9176);
      ruleRef.current = pickRule(switchRng, rule);
      run = 0; justSwitchedRef.current = true;
      setShiftToast(true);
    }
    runRef.current = run;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShiftToast(false);
      if (mode === 'levels' && totalRef.current >= PER_LEVEL) {
        const acc = correctRef.current / PER_LEVEL;
        const postAcc = s.afterN ? Math.round((s.afterOk / s.afterN) * 100) : null;
        onResult({
          won: acc >= WIN_ACC,
          score: scoreRef.current,
          summary: `${correctRef.current}/${PER_LEVEL} (${Math.round(acc * 100)}%) · ${s.rules} ${t.rules}${postAcc != null ? ` · post-switch ${postAcc}%` : ''}`,
        });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) { onResult({ score: correctRef.current }); return; }
      if (isSurvival && finishedRef.current) return;
      nextCard();
    }, ok ? 520 : 780);
  }, [card, mode, diff, level, ppTrials, isSurvival, nextCard, onResult, playSfx, awardPoints, seed, t.rules]);

  const restartSurvival = () => {
    clearTimeout(timerRef.current);
    trialRef.current = 0; correctRef.current = 0; totalRef.current = 0; scoreRef.current = 0; comboRef.current = 0;
    runRef.current = 0; prevRuleRef.current = null; justSwitchedRef.current = false; lockRef.current = false; finishedRef.current = false;
    stats.current = { afterN: 0, afterOk: 0, persev: 0, rules: 0 };
    ruleRef.current = pickRule(makeRng((Date.now() >>> 0) + 7919), null);
    setScore(0); setCorrect(0); setTotal(0); setCombo(0); setOver(null); setMood('focused');
    setShiftToast(false);
    setCard(dealCard(makeRng((Date.now() >>> 0) + 7919))); setFly(null);
    setRunId((n) => n + 1);
  };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const hud = mode === 'levels' ? `${total}/${PER_LEVEL} · ✓${correct} · ${stats.current.rules} ${t.rules}`
    : mode === 'passplay' ? `${total}/${ppTrials} · ✓${correct}`
      : `✓${correct} · ${score} · ${stats.current.rules} ${t.rules}${combo > 1 ? ` · 🔥${combo}` : ''}`;
  const say = fly
    ? (fly.ok ? t.yes : (fly.hintTryOther ? t.tryOther : t.no))
    : t.think;

  const rootCls = `ct-wcst-root${cosmos ? ' c3d-embed-root' : ''}`;

  if (over && isSurvival) {
    return (
      <div className={rootCls} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ct-wcst-over-wrap">
          <div className="ct-wcst-over-card">
            <CosmosCharacter size={72} mood="proud" glow pose="cheer" />
            <h2 className="ct-wcst-over-title">{t.over}</h2>
            <p className="ct-wcst-over-sub">{`✓ ${over.correct} · ${over.score} ${isAr ? 'نقطة' : 'pts'} · ${over.rules} ${t.rules}`}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
              <button type="button" className="ct-wcst-btn-pri" onClick={() => { playSfx?.('click'); restartSurvival(); }}>{t.again}</button>
              <button type="button" className="ct-wcst-btn-ghost" onClick={() => { playSfx?.('click'); onExit?.(); }}>{t.menu}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flyX = fly ? (isAr ? (1.5 - fly.choice) : (fly.choice - 1.5)) * 23 : 0;
  const flyTransform = fly
    ? `translateX(${flyX}vw) translateY(-22vh) scale(0.42) rotate(${flyX * 0.26}deg)`
    : 'none';

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

      <div className="ct-wcst-body">
        <div className="ct-wcst-react">
          <CosmosCharacter size={44} faceOnly mood={mood} />
          <span className="ct-wcst-say" style={{ color: fly ? (fly.ok ? OK : BAD) : SUB }}>{say}</span>
        </div>
        <p className="ct-wcst-prompt">{t.prompt}</p>
        <p className="ct-wcst-dim-strip" style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: SUB, textAlign: 'center' }}>{t.oneRule}</p>
        <div className="ct-wcst-dim-strip" aria-hidden="true">
          <span className="ct-wcst-dim-pill">{t.dimColor}</span>
          <span className="ct-wcst-dim-pill">{t.dimShape}</span>
          <span className="ct-wcst-dim-pill">{t.dimNumber}</span>
        </div>
        {shiftToast && <p className="ct-wcst-shift-toast" role="status">{t.shift}</p>}

        <div className="ct-wcst-stage">
          <div className="ct-wcst-ref-row">
            {REFERENCE.map((ref, i) => {
              const isChoice = fly && fly.choice === i;
              const pickCls = isChoice ? (fly.ok ? 'ct-wcst-ref-btn--pick-ok' : 'ct-wcst-ref-btn--pick-bad') : '';
              return (
                <button
                  key={i}
                  type="button"
                  className={`ct-wcst-ref-btn ${pickCls}`}
                  aria-label={t.refAria(i)}
                  onClick={() => choose(i)}
                  disabled={!!fly}
                >
                  <CardFace shape={ref.shape} color={ref.color} number={ref.number} glyphSize={15} />
                </button>
              );
            })}
          </div>

          <div className="ct-wcst-deal-wrap">
            <div
              key={`${runId}-${trialRef.current}`}
              className={`ct-wcst-deal-card${fly ? ' ct-wcst-deal-card--fly' : ' ct-wcst-deal-card--enter'}`}
              style={{ transform: flyTransform }}
            >
              <CardFace shape={card.shape} color={card.color} number={card.number} glyphSize={28} deal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CardSortGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <Wisconsin3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
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
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج ثلاثي الأبعاد قابل للّعب' : 'Playable 3D prototype',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('flexibility'),
      }]}
      renderEngine={(p) => (
        <WcstEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}
