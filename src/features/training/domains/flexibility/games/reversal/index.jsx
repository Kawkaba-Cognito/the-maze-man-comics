import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

/*
 * Probabilistic Reversal Learning (PRL) — reward-based cognitive flexibility.
 *
 * Two symbols; one pays out MOST of the time (e.g. 80%), the other rarely. Learn
 * which is "good" and stick with it despite the odd misleading loss — then the
 * payoff silently REVERSES and you must disengage and switch. Positions shuffle
 * so you track the symbol, not the side.
 *
 * Neuroscience: orbitofrontal cortex + striatum / dopamine; "disengage from the
 * previously rewarded option" is the core flexibility act. Validated clinical
 * outcome measure. Shared 3-mode flow (Free / Levels / Challenge).
 */

const STIMS = [
  { color: '#4f9fe0', symbol: '★' },
  { color: '#ff8a3a', symbol: '●' },
];

const BASE = {
  easy: { p: 0.85, crit: 5, target: 3, maxPer: 12 },
  med: { p: 0.78, crit: 6, target: 4, maxPer: 12 },
  hard: { p: 0.70, crit: 6, target: 5, maxPer: 11 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const lv = (level || 1) - 1;
  return { p: Math.max(0.62, b.p - lv * 0.01), crit: b.crit + Math.floor(lv / 4), target: b.target + Math.floor(lv / 3), maxPer: b.maxPer };
}

function ReversalEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
  const goodRef = useRef(0);
  const pRef = useRef(0.8);
  const critRef = useRef(5);
  const targetRef = useRef(4);
  const maxPerRef = useRef(12);
  const consecRef = useRef(0);
  const setsRef = useRef(0);
  const coinsRef = useRef(0);
  const sinceRef = useRef(0);
  const totalRef = useRef(0);
  const livesRef = useRef(3);
  const lockRef = useRef(false);
  const timerRef = useRef(null);

  const [cards, setCards] = useState([0, 1]);   // stim id at [left, right]
  const [coins, setCoins] = useState(0);
  const [sets, setSets] = useState(0);
  const [lives, setLives] = useState(3);
  const [fb, setFb] = useState({ side: -1, win: false });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const c = mode === 'levels' ? levelCfg(diff, level) : { p: 0.8, crit: 5, target: 99, maxPer: 12 };
    pRef.current = c.p; critRef.current = c.crit; targetRef.current = c.target; maxPerRef.current = c.maxPer;
    goodRef.current = Math.random() < 0.5 ? 0 : 1;
    newTrial();
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const newTrial = useCallback(() => {
    lockRef.current = false;
    setFb({ side: -1, win: false });
    setMsg(isAr ? 'اختر الرمز الرابح' : 'Pick the winning symbol');
    setCards(Math.random() < 0.5 ? [0, 1] : [1, 0]);
  }, [isAr]);

  const pick = useCallback((side) => {
    if (lockRef.current) return;
    lockRef.current = true;
    const stimId = cards[side];
    const isGood = stimId === goodRef.current;
    const rewarded = Math.random() < (isGood ? pRef.current : 1 - pRef.current);
    if (rewarded) { coinsRef.current += 1; setCoins(coinsRef.current); playSfx?.('win'); awardPoints?.(1); }
    else { playSfx?.('lose'); }
    setFb({ side, win: rewarded });
    setMsg(rewarded ? (isAr ? '+1 🪙' : '+1 🪙') : (isAr ? 'لا شيء' : 'No reward'));

    consecRef.current = isGood ? consecRef.current + 1 : 0;
    sinceRef.current += 1;
    totalRef.current += 1;

    let reversed = false;
    if (consecRef.current >= critRef.current) {
      setsRef.current += 1; setSets(setsRef.current);
      goodRef.current = 1 - goodRef.current; consecRef.current = 0; sinceRef.current = 0; reversed = true;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (mode === 'levels') {
        const budget = targetRef.current * maxPerRef.current;
        if (totalRef.current >= budget) {
          onResult({ won: setsRef.current >= targetRef.current, score: coinsRef.current, summary: isAr ? `${setsRef.current} انعكاسات تعلّمتها` : `${setsRef.current} reversals learned` });
          return;
        }
      } else if (mode === 'challenge') {
        if (!reversed && sinceRef.current > maxPerRef.current) {
          livesRef.current -= 1; setLives(livesRef.current); sinceRef.current = 0; playSfx?.('lose');
          if (livesRef.current <= 0) { onResult({ score: setsRef.current }); return; }
        }
        // ramp the noise a touch each reversal
        if (reversed) pRef.current = Math.max(0.62, pRef.current - 0.01);
      }
      newTrial();
    }, 760);
  }, [awardPoints, cards, isAr, mode, newTrial, onResult, playSfx]);

  const S = styles;
  const hud = mode === 'levels'
    ? (isAr ? `مستوى ${level} · انعكاسات ${sets}/${targetRef.current}` : `Lvl ${level} · rev ${sets}/${targetRef.current}`)
    : mode === 'challenge'
      ? `${'❤'.repeat(lives)} · ${isAr ? 'انعكاسات' : 'rev'} ${sets}`
      : (isAr ? `انعكاسات ${sets}` : `Reversals ${sets}`);

  return (
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'تعلّم الانعكاس' : 'Reversal'}</div>
        <div style={S.stats}>{hud} · 🪙{coins}</div>
      </div>
      <div style={S.msg}>{msg}</div>
      <div style={S.play}>
        {[0, 1].map((side) => {
          const st = STIMS[cards[side]];
          const showFb = fb.side === side;
          return (
            <button
              key={side}
              style={{ ...S.card, background: st.color, boxShadow: showFb ? (fb.win ? '0 0 0 6px #3be086' : '0 0 0 6px #ff5a5a') : '0 6px 18px rgba(0,0,0,0.4)' }}
              onClick={() => pick(side)}
            >
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
        <ReversalEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
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
  card: { position: 'relative', flex: 1, maxWidth: 240, height: '62%', maxHeight: 360, border: 'none', borderRadius: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'box-shadow .1s' },
  sym: { fontSize: 'clamp(48px, 16vw, 110px)', color: 'rgba(0,0,0,0.55)' },
  fbMark: { position: 'absolute', top: 12, right: 14, fontSize: 30 },
};
