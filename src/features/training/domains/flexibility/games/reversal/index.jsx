import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';

/*
 * Probabilistic Reversal Learning (PRL) — reward-based cognitive flexibility.
 * Two symbols; one pays out MOST of the time, the other rarely. Learn which is
 * "good", then the payoff silently REVERSES — disengage and switch. Positions
 * shuffle so you track the symbol, not the side.
 * Modes: Free / Levels (100) / Pass n Play (fixed attempt, score = reversals).
 */

const STIMS = [
  { color: '#4f9fe0', symbol: '★' },
  { color: '#ff8a3a', symbol: '●' },
];
const BASE = {
  easy: { p: 0.85, crit: 5, target: 3 },
  med: { p: 0.78, crit: 6, target: 4 },
  hard: { p: 0.70, crit: 6, target: 5 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return { p: Math.max(0.6, b.p - f * 0.2), crit: b.crit + Math.round(f * 3), target: b.target + Math.round(f * 4) };
}
const LEVEL_BUDGET_PER_TARGET = 12;

function ReversalEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 16) : 0;
  const goodRef = useRef(0);
  const pRef = useRef(0.8);
  const critRef = useRef(5);
  const targetRef = useRef(4);
  const consecRef = useRef(0);
  const setsRef = useRef(0);
  const coinsRef = useRef(0);
  const totalRef = useRef(0);
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  const [cards, setCards] = useState([0, 1]);
  const [coins, setCoins] = useState(0);
  const [sets, setSets] = useState(0);
  const [, force] = useState(0);
  const [fb, setFb] = useState({ side: -1, win: false });
  const [msg, setMsg] = useState('');

  const newTrial = useCallback(() => {
    lockRef.current = false;
    setFb({ side: -1, win: false });
    setMsg(isAr ? 'اختر الرمز الرابح' : 'Pick the winning symbol');
    setCards(rng() < 0.5 ? [0, 1] : [1, 0]);
  }, [isAr, rng]);

  useEffect(() => {
    const c = mode === 'levels' ? levelCfg(diff, level) : { p: 0.78, crit: 6, target: 99 };
    pRef.current = c.p; critRef.current = c.crit; targetRef.current = c.target;
    goodRef.current = rng() < 0.5 ? 0 : 1;
    newTrial();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = useCallback((side) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const isGood = cards[side] === goodRef.current;
    const rewarded = Math.random() < (isGood ? pRef.current : 1 - pRef.current);
    if (rewarded) { coinsRef.current += 1; setCoins(coinsRef.current); playSfx?.('win'); awardPoints?.(1); }
    else { playSfx?.('lose'); }
    setFb({ side, win: rewarded });
    setMsg(rewarded ? '+1 🪙' : (isAr ? 'لا شيء' : 'No reward'));
    consecRef.current = isGood ? consecRef.current + 1 : 0;
    totalRef.current += 1;
    if (consecRef.current >= critRef.current) {
      setsRef.current += 1; setSets(setsRef.current);
      goodRef.current = 1 - goodRef.current; consecRef.current = 0;
      if (mode !== 'levels') pRef.current = Math.max(0.6, pRef.current - 0.005);
    }
    force((n) => n + 1);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels' && totalRef.current >= targetRef.current * LEVEL_BUDGET_PER_TARGET) {
        onResult({ won: setsRef.current >= targetRef.current, score: setsRef.current, summary: isAr ? `${setsRef.current} انعكاسات` : `${setsRef.current} reversals learned` });
        return;
      }
      if (mode === 'passplay' && totalRef.current >= ppTrials) { onResult({ score: setsRef.current }); return; }
      newTrial();
    }, 720);
  }, [awardPoints, cards, isAr, mode, newTrial, onResult, playSfx, ppTrials]);

  const S = styles;
  const hud = mode === 'levels' ? (isAr ? `مستوى ${level} · ${sets}/${targetRef.current}` : `Lvl ${level} · ${sets}/${targetRef.current}`)
    : mode === 'passplay' ? `${totalRef.current}/${ppTrials} · ${sets}`
      : (isAr ? `انعكاسات ${sets}` : `Reversals ${sets}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'تعلّم الانعكاس' : 'Reversal'}</div>
          <div className="ct-training-play-sub">{hud} · 🪙{coins}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
      <div style={S.msg}>{msg}</div>
      <div style={S.play}>
        {[0, 1].map((side) => {
          const st = STIMS[cards[side]];
          const showFb = fb.side === side;
          return (
            <button key={side} style={{ ...S.card, background: st.color, boxShadow: showFb ? (fb.win ? '0 0 0 6px #3be086' : '0 0 0 6px #ff5a5a') : '4px 4px 0 #1a1208' }} onClick={() => pick(side)}>
              <span style={S.sym}>{st.symbol}</span>
              {showFb ? <span style={S.fbMark}>{fb.win ? '🪙' : '✕'}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ReversalGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_reversal"
      title={{ en: 'Reversal Learning', ar: 'تعلّم الانعكاس' }}
      hints={{
        free: { en: 'Endless — payouts keep flipping', ar: 'مفتوح — المكافآت تنقلب باستمرار' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same payouts for all · pass the device', ar: 'نفس المكافآت للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 18, scoreLabel: { en: 'reversals', ar: 'انعكاسات' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <ReversalEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  msg: { textAlign: 'center', padding: '14px 0 4px', fontWeight: 700, color: '#5a4a32', minHeight: 26 },
  play: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 18 },
  card: { position: 'relative', flex: 1, maxWidth: 240, height: '62%', maxHeight: 360, border: 'none', borderRadius: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow .1s' },
  sym: { fontSize: 'clamp(48px, 16vw, 110px)', color: 'rgba(0,0,0,0.55)' },
  fbMark: { position: 'absolute', top: 12, right: 14, fontSize: 30 },
};
