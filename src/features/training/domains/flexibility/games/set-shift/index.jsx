import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';

/*
 * Intra / Extra-Dimensional Set-Shift (IED) — attentional set-shifting.
 * Two cards differ in SHAPE and COLOR; one feature value is secretly "correct"
 * (infer from feedback). After a streak the rule shifts within the dimension or,
 * harder, to the OTHER dimension (extra-dimensional shift).
 * Modes: Free / Levels (100) / Pass n Play (fixed attempt, score = stages).
 */

const COLORS = ['#ff5a5a', '#ffce4a', '#3be086', '#4f9fe0'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond'];
const BASE = {
  easy: { crit: 4, target: 4, edsP: 0.35, nC: 3, nS: 3 },
  med: { crit: 5, target: 5, edsP: 0.40, nC: 4, nS: 4 },
  hard: { crit: 6, target: 6, edsP: 0.45, nC: 4, nS: 4 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return { crit: b.crit + Math.round(f * 3), target: b.target + Math.round(f * 4), edsP: Math.min(0.6, b.edsP + f * 0.15), nC: b.nC, nS: b.nS };
}
const LEVEL_BUDGET_PER_TARGET = 12;

function Shape({ shape, color, size = 92 }) {
  const props = { viewBox: '0 0 100 100', width: size, height: size, 'aria-hidden': true };
  if (shape === 'circle') return <svg {...props}><circle cx="50" cy="50" r="38" fill={color} /></svg>;
  if (shape === 'square') return <svg {...props}><rect x="16" y="16" width="68" height="68" rx="9" fill={color} /></svg>;
  if (shape === 'triangle') return <svg {...props}><polygon points="50,14 88,86 12,86" fill={color} /></svg>;
  return <svg {...props}><polygon points="50,10 90,50 50,90 10,50" fill={color} /></svg>;
}

function SetShiftEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const rnd = useCallback((n) => Math.floor(rng() * n), [rng]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 18) : 0;
  const cfgRef = useRef({ crit: 5, target: 99, edsP: 0.4, nC: 4, nS: 4 });
  const ruleRef = useRef({ dim: 'color', val: 0 });
  const correctSideRef = useRef(0);
  const consecRef = useRef(0);
  const stagesRef = useRef(0);
  const totalRef = useRef(0);
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  const [trial, setTrial] = useState({ cards: [{ shape: 'circle', color: COLORS[0] }, { shape: 'square', color: COLORS[1] }] });
  const [stages, setStages] = useState(0);
  const [fb, setFb] = useState({ side: -1, ok: false });
  const [msg, setMsg] = useState('');

  const shiftRule = useCallback(() => {
    const c = cfgRef.current, cur = ruleRef.current;
    if (rng() < c.edsP) {
      const dim = cur.dim === 'color' ? 'shape' : 'color';
      ruleRef.current = { dim, val: rnd(dim === 'color' ? c.nC : c.nS) };
    } else {
      const max = cur.dim === 'color' ? c.nC : c.nS;
      let v = rnd(max); if (max > 1) while (v === cur.val) v = rnd(max);
      ruleRef.current = { dim: cur.dim, val: v };
    }
  }, [rng, rnd]);

  const newTrial = useCallback(() => {
    lockRef.current = false;
    setFb({ side: -1, ok: false });
    setMsg(isAr ? 'استنتج القاعدة من النتيجة' : 'Find the rule from the feedback');
    const c = cfgRef.current, rule = ruleRef.current;
    const mk = (relVal) => ({
      color: rule.dim === 'color' ? COLORS[relVal] : COLORS[rnd(c.nC)],
      shape: rule.dim === 'shape' ? SHAPES[relVal] : SHAPES[rnd(c.nS)],
    });
    const maxRel = rule.dim === 'color' ? c.nC : c.nS;
    let wrongVal = rnd(maxRel); if (maxRel > 1) while (wrongVal === rule.val) wrongVal = rnd(maxRel);
    const correctSide = rng() < 0.5 ? 0 : 1;
    correctSideRef.current = correctSide;
    setTrial({ cards: correctSide === 0 ? [mk(rule.val), mk(wrongVal)] : [mk(wrongVal), mk(rule.val)] });
  }, [isAr, rng, rnd]);

  useEffect(() => {
    const c = mode === 'levels' ? levelCfg(diff, level) : { crit: 5, target: 99, edsP: 0.4, nC: 4, nS: 4 };
    cfgRef.current = c;
    ruleRef.current = { dim: rng() < 0.5 ? 'color' : 'shape', val: rnd(c.nC) };
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
    totalRef.current += 1;
    if (consecRef.current >= cfgRef.current.crit) { stagesRef.current += 1; setStages(stagesRef.current); shiftRule(); consecRef.current = 0; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels' && totalRef.current >= cfgRef.current.target * LEVEL_BUDGET_PER_TARGET) {
        onResult({ won: stagesRef.current >= cfgRef.current.target, score: stagesRef.current, summary: isAr ? `${stagesRef.current} مراحل` : `${stagesRef.current} stages cleared` });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) { onResult({ score: stagesRef.current }); return; }
      newTrial();
    }, ok ? 500 : 740);
  }, [awardPoints, isAr, mode, newTrial, onResult, playSfx, ppTrials, shiftRule]);

  const S = styles;
  const hud = mode === 'levels' ? (isAr ? `مستوى ${level} · ${stages}/${cfgRef.current.target}` : `Lvl ${level} · ${stages}/${cfgRef.current.target}`)
    : mode === 'passplay' ? `${totalRef.current}/${ppTrials} · ${stages}`
      : (isAr ? `مراحل ${stages}` : `Stages ${stages}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'تبديل القاعدة' : 'Set Shift'}</div>
          <div className="ct-training-play-sub">{hud}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
      <div style={S.msg}>{msg}</div>
      <div style={S.play}>
        {[0, 1].map((side) => {
          const card = trial.cards[side];
          const showFb = fb.side === side;
          return (
            <button key={side} style={{ ...S.card, boxShadow: showFb ? (fb.ok ? '0 0 0 6px #3be086' : '0 0 0 6px #ff5a5a') : '4px 4px 0 #1a1208' }} onClick={() => pick(side)}>
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
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same rules for all · pass the device', ar: 'نفس القواعد للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 18, scoreLabel: { en: 'stages', ar: 'مراحل' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <SetShiftEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  msg: { textAlign: 'center', padding: '14px 0 4px', fontWeight: 700, color: '#5a4a32', minHeight: 26 },
  play: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 18 },
  card: { flex: 1, maxWidth: 220, height: '52%', maxHeight: 300, background: '#fffdf8', border: '2px solid #cdbfa6', borderRadius: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow .1s' },
};
