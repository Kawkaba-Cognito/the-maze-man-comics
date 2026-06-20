import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

/*
 * Intra / Extra-Dimensional Set-Shift (IED) — attentional set-shifting.
 *
 * Two cards differ in SHAPE and COLOR. One feature value is secretly "correct";
 * you infer it from feedback. After a streak the rule shifts — sometimes to a
 * new value on the SAME dimension (intra), sometimes to the OTHER dimension
 * entirely (extra-dimensional shift — the hard one: drop the whole dimension).
 *
 * Neuroscience: dorsolateral PFC attentional set-shifting (CANTAB IED). Shared
 * 3-mode flow (Free / Levels / Challenge).
 */

const COLORS = ['#ff5a5a', '#ffce4a', '#3be086', '#4f9fe0'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond'];

const BASE = {
  easy: { crit: 4, target: 4, maxPer: 14, edsP: 0.35, nC: 3, nS: 3 },
  med: { crit: 5, target: 5, maxPer: 14, edsP: 0.40, nC: 4, nS: 4 },
  hard: { crit: 6, target: 6, maxPer: 13, edsP: 0.45, nC: 4, nS: 4 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const lv = (level || 1) - 1;
  return { crit: b.crit + Math.floor(lv / 4), target: b.target + Math.floor(lv / 3), maxPer: b.maxPer, edsP: Math.min(0.6, b.edsP + lv * 0.01), nC: b.nC, nS: b.nS };
}
const rnd = (n) => Math.floor(Math.random() * n);

function Shape({ shape, color, size = 92 }) {
  const props = { viewBox: '0 0 100 100', width: size, height: size, 'aria-hidden': true };
  if (shape === 'circle') return <svg {...props}><circle cx="50" cy="50" r="38" fill={color} /></svg>;
  if (shape === 'square') return <svg {...props}><rect x="16" y="16" width="68" height="68" rx="9" fill={color} /></svg>;
  if (shape === 'triangle') return <svg {...props}><polygon points="50,14 88,86 12,86" fill={color} /></svg>;
  return <svg {...props}><polygon points="50,10 90,50 50,90 10,50" fill={color} /></svg>;
}

function SetShiftEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
  const cfgRef = useRef({ crit: 5, target: 99, maxPer: 14, edsP: 0.4, nC: 4, nS: 4 });
  const ruleRef = useRef({ dim: 'color', val: 0 });
  const correctSideRef = useRef(0);
  const consecRef = useRef(0);
  const stagesRef = useRef(0);
  const sinceRef = useRef(0);
  const totalRef = useRef(0);
  const livesRef = useRef(3);
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  const [trial, setTrial] = useState({ cards: [{ shape: 'circle', color: COLORS[0] }, { shape: 'square', color: COLORS[1] }] });
  const [stages, setStages] = useState(0);
  const [lives, setLives] = useState(3);
  const [fb, setFb] = useState({ side: -1, ok: false });
  const [msg, setMsg] = useState('');

  const shiftRule = useCallback(() => {
    const c = cfgRef.current;
    const cur = ruleRef.current;
    const eds = Math.random() < c.edsP;
    if (eds) {
      const dim = cur.dim === 'color' ? 'shape' : 'color';
      ruleRef.current = { dim, val: rnd(dim === 'color' ? c.nC : c.nS) };
    } else {
      const max = cur.dim === 'color' ? c.nC : c.nS;
      let v = rnd(max); if (max > 1) while (v === cur.val) v = rnd(max);
      ruleRef.current = { dim: cur.dim, val: v };
    }
  }, []);

  const newTrial = useCallback(() => {
    lockRef.current = false;
    setFb({ side: -1, ok: false });
    setMsg(isAr ? 'استنتج القاعدة من النتيجة' : 'Find the rule from the feedback');
    const c = cfgRef.current;
    const rule = ruleRef.current;
    // correct card: relevant dim = rule.val; wrong card: relevant dim ≠ rule.val
    const mk = (relVal) => {
      const color = rule.dim === 'color' ? COLORS[relVal] : COLORS[rnd(c.nC)];
      const shape = rule.dim === 'shape' ? SHAPES[relVal] : SHAPES[rnd(c.nS)];
      return { shape, color };
    };
    const maxRel = rule.dim === 'color' ? c.nC : c.nS;
    let wrongVal = rnd(maxRel); if (maxRel > 1) while (wrongVal === rule.val) wrongVal = rnd(maxRel);
    const correctCard = mk(rule.val);
    const wrongCard = mk(wrongVal);
    const correctSide = Math.random() < 0.5 ? 0 : 1;
    correctSideRef.current = correctSide;
    setTrial({ cards: correctSide === 0 ? [correctCard, wrongCard] : [wrongCard, correctCard] });
  }, [isAr]);

  useEffect(() => {
    const c = mode === 'levels' ? levelCfg(diff, level) : { crit: 5, target: 99, maxPer: 14, edsP: 0.4, nC: 4, nS: 4 };
    cfgRef.current = c;
    ruleRef.current = { dim: Math.random() < 0.5 ? 'color' : 'shape', val: rnd(Math.random() < 0.5 ? c.nC : c.nS) };
    newTrial();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback((side) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const ok = side === correctSideRef.current;
    setFb({ side, ok });
    if (ok) { playSfx?.('win'); awardPoints?.(1); setMsg(isAr ? 'صحيح ✓' : 'Correct ✓'); } else { playSfx?.('lose'); setMsg(isAr ? 'خطأ ✕' : 'Wrong ✕'); }

    consecRef.current = ok ? consecRef.current + 1 : 0;
    sinceRef.current += 1; totalRef.current += 1;

    let shifted = false;
    if (consecRef.current >= cfgRef.current.crit) {
      stagesRef.current += 1; setStages(stagesRef.current);
      shiftRule(); consecRef.current = 0; sinceRef.current = 0; shifted = true;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels') {
        const budget = cfgRef.current.target * cfgRef.current.maxPer;
        if (totalRef.current >= budget) {
          onResult({ won: stagesRef.current >= cfgRef.current.target, score: stagesRef.current, summary: isAr ? `${stagesRef.current} مراحل` : `${stagesRef.current} stages cleared` });
          return;
        }
      } else if (mode === 'challenge' && !shifted && sinceRef.current > cfgRef.current.maxPer) {
        livesRef.current -= 1; setLives(livesRef.current); sinceRef.current = 0; playSfx?.('lose');
        if (livesRef.current <= 0) { onResult({ score: stagesRef.current }); return; }
      }
      newTrial();
    }, ok ? 520 : 760);
  }, [awardPoints, isAr, mode, newTrial, onResult, playSfx, shiftRule]);

  const S = styles;
  const hud = mode === 'levels'
    ? (isAr ? `مستوى ${level} · مراحل ${stages}/${cfgRef.current.target}` : `Lvl ${level} · stages ${stages}/${cfgRef.current.target}`)
    : mode === 'challenge'
      ? `${'❤'.repeat(lives)} · ${isAr ? 'مراحل' : 'stages'} ${stages}`
      : (isAr ? `مراحل ${stages}` : `Stages ${stages}`);

  return (
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'تبديل القاعدة' : 'Set Shift'}</div>
        <div style={S.stats}>{hud}</div>
      </div>
      <div style={S.msg}>{msg}</div>
      <div style={S.play}>
        {[0, 1].map((side) => {
          const card = trial.cards[side];
          const showFb = fb.side === side;
          return (
            <button
              key={side}
              style={{ ...S.card, boxShadow: showFb ? (fb.ok ? '0 0 0 6px #3be086' : '0 0 0 6px #ff5a5a') : '0 6px 18px rgba(0,0,0,0.4)' }}
              onClick={() => pick(side)}
            >
              <Shape shape={card.shape} color={card.color} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SetShiftGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_setshift"
      title={{ en: 'Set Shift', ar: 'تبديل القاعدة' }}
      hints={{
        free: { en: 'Endless — the rule keeps shifting', ar: 'مفتوح — القاعدة تتبدّل باستمرار' },
        levels: { en: 'Easy → Hard · 12 levels each', ar: 'سهل → صعب · 12 مستوى لكل' },
        challenge: { en: 'Adapt fast or lose a life · 3 lives', ar: 'تكيّف بسرعة أو تخسر روحاً · 3 أرواح' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      levelCount={12}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <SetShiftEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#0b1018', color: '#fff', fontFamily: "'Outfit', system-ui, sans-serif" },
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  back: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#dfe9f5', borderRadius: 9, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' },
  title: { fontWeight: 800, fontSize: 16 },
  stats: { color: '#9fc6ef', fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' },
  msg: { textAlign: 'center', padding: '12px 0 4px', fontWeight: 700, color: '#c4d3e6', minHeight: 26 },
  play: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 18 },
  card: { flex: 1, maxWidth: 220, height: '52%', maxHeight: 300, background: '#1b2940', border: '2px solid #6fa6df', borderRadius: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow .1s' },
};
