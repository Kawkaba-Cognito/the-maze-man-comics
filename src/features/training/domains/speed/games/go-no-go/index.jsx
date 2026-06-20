import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';

/*
 * Go / No-Go — response speed + inhibitory control.
 *
 * A stream of stimuli flashes one at a time. Tap fast on the frequent GO signal
 * (blue circle); WITHHOLD on the rare NO-GO signal (orange diamond). Yields
 * speed (RT), impulsivity (commission errors on no-go) and lapses (omissions).
 * Wrapped in the shared 3-mode flow (Free / Levels / Challenge).
 *
 * Neuroscience: the "brake" is right inferior frontal gyrus / pre-SMA; speed is
 * fronto-parietal. It's the engine of the clinical Continuous Performance Test.
 */

const STIM_PER_LEVEL = 26;
const LEVEL_WIN_ACC = 0.8;
const CHAL_LIVES = 3;

const BASE = {
  easy: { stim: 900, isi: 520, goP: 0.7 },
  med: { stim: 760, isi: 410, goP: 0.78 },
  hard: { stim: 620, isi: 320, goP: 0.85 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return { stim: Math.max(430, b.stim - f * 420), isi: Math.max(190, b.isi - f * 300), goP: Math.min(0.92, b.goP + f * 0.12) };
}
function rampCfg(n) {
  return { stim: Math.max(480, 880 - n * 12), isi: Math.max(220, 480 - n * 8), goP: Math.min(0.88, 0.72 + n * 0.004) };
}

function GoNoGoEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 20) : 0;
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const subRef = useRef('isi');            // 'stim' | 'isi'
  const stimRef = useRef({ go: true });
  const respondedRef = useRef(false);
  const stimOnsetRef = useRef(0);
  const fbRef = useRef({ kind: '', until: 0 });
  const timerRef = useRef(null);
  const rafRef = useRef(0);
  // progression
  const idxRef = useRef(0);                 // stimuli shown (free/challenge ramp + levels count)
  const correctRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const scoreRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [hud, setHud] = useState('');
  const [msg, setMsg] = useState('');

  const fit = useCallback(() => {
    const c = canvasRef.current, wrap = wrapRef.current;
    if (!c || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth, h = wrap.clientHeight;
    sizeRef.current = { w, h };
    c.width = w * dpr; c.height = h * dpr; c.style.width = `${w}px`; c.style.height = `${h}px`;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const draw = useCallback(() => {
    const c = canvasRef.current;
    if (c) {
      const ctx = c.getContext('2d');
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.16;
      const now = performance.now();
      const fb = fbRef.current;
      if (now < fb.until) {
        ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
        ctx.lineWidth = 8; ctx.strokeStyle = fb.kind === 'good' ? '#3be086' : '#ff5a5a'; ctx.stroke();
      }
      if (subRef.current === 'stim') {
        if (stimRef.current.go) {
          ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fillStyle = '#3aa0ff'; ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(cx, cy - R); ctx.lineTo(cx + R, cy); ctx.lineTo(cx, cy + R); ctx.lineTo(cx - R, cy); ctx.closePath();
          ctx.fillStyle = '#ff8a3a'; ctx.fill();
        }
      }
    }
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  const cfg = useCallback(() => (mode === 'levels' ? levelCfg(diff, level) : rampCfg(idxRef.current)), [mode, diff, level]);

  const updateHud = useCallback(() => {
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · ${idxRef.current}/${STIM_PER_LEVEL} · ✓${correctRef.current}` : `Lvl ${level} · ${idxRef.current}/${STIM_PER_LEVEL} · ✓${correctRef.current}`);
    else if (mode === 'passplay') setHud(isAr ? `${idxRef.current}/${ppTrials} · ✓${correctRef.current}` : `${idxRef.current}/${ppTrials} · ✓${correctRef.current}`);
    else setHud(isAr ? `محفّز ${idxRef.current}` : `Stim ${idxRef.current}`);
  }, [mode, level, isAr, ppTrials]);

  // Outcome of a single stimulus → progression. correct true on hit / correct rejection.
  const score1 = useCallback((correct) => {
    if (correct) { correctRef.current += 1; }
    if (mode === 'levels' && idxRef.current >= STIM_PER_LEVEL) {
      const acc = correctRef.current / STIM_PER_LEVEL;
      onResult({ won: acc >= LEVEL_WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${STIM_PER_LEVEL} (${Math.round(acc * 100)}%)` });
      return true;
    }
    if (mode === 'passplay' && idxRef.current >= ppTrials) { onResult({ score: correctRef.current }); return true; }
    return false;
  }, [mode, onResult, ppTrials]);

  const nextStim = useCallback(() => {
    const c = cfg();
    idxRef.current += 1;
    updateHud();
    const go = rng() < c.goP;
    stimRef.current = { go };
    respondedRef.current = false;
    subRef.current = 'stim';
    stimOnsetRef.current = performance.now();
    setMsg('');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // stimulus window elapsed
      subRef.current = 'isi';
      if (go && !respondedRef.current) {
        // omission (missed a GO)
        playSfx?.('lose');
        fbRef.current = { kind: 'bad', until: performance.now() + 300 };
        if (score1(false, false)) return;
      } else if (!go && !respondedRef.current) {
        // correct rejection (withheld on NO-GO)
        scoreRef.current += 3; setScore(scoreRef.current);
        if (score1(true, false)) return;
      }
      timerRef.current = setTimeout(nextStim, c.isi);
    }, c.stim);
  }, [cfg, playSfx, score1, updateHud, rng]);

  const onPointer = useCallback(() => {
    if (subRef.current !== 'stim' || respondedRef.current) return;
    respondedRef.current = true;
    const go = stimRef.current.go;
    if (go) {
      const rt = Math.round(performance.now() - stimOnsetRef.current);
      playSfx?.('win');
      scoreRef.current += 5 + Math.min(Math.max(0, Math.round((600 - rt) / 50)), 6);
      setScore(scoreRef.current); awardPoints?.(1);
      fbRef.current = { kind: 'good', until: performance.now() + 220 };
      if (score1(true, false)) return;
    } else {
      // commission error — tapped a NO-GO
      playSfx?.('lose');
      scoreRef.current = Math.max(0, scoreRef.current - 3); setScore(scoreRef.current);
      fbRef.current = { kind: 'bad', until: performance.now() + 320 };
      setMsg(isAr ? 'كان عليك التوقّف!' : 'Should have held!');
      if (score1(false, true)) return;
    }
  }, [awardPoints, isAr, playSfx, score1]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);
    setMsg(isAr ? 'استعد…' : 'Get ready…');
    timerRef.current = setTimeout(nextStim, 700);
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafRef.current); clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = styles;
  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'قف / انطلق' : 'Go / No-Go'}</div>
          <div className="ct-training-play-sub">{hud} · {score}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
      <div style={S.legend}>
        <span style={S.legItem}><span style={{ ...S.swatch, background: '#3aa0ff', borderRadius: '50%' }} /> {isAr ? 'اضغط' : 'TAP'}</span>
        <span style={S.legItem}><span style={{ ...S.swatch, background: '#ff8a3a', transform: 'rotate(45deg)' }} /> {isAr ? 'توقّف' : 'HOLD'}</span>
      </div>
      <div ref={wrapRef} style={S.play} onPointerDown={onPointer}>
        <canvas ref={canvasRef} style={S.canvas} />
        {msg ? <div style={S.banner}>{msg}</div> : null}
      </div>
    </div>
  );
}

export default function GoNoGoGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_speed_gng"
      title={{ en: 'Go / No-Go', ar: 'قف / انطلق' }}
      hints={{
        free: { en: 'Endless practice — no fail', ar: 'تدريب مفتوح — بلا خسارة' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same stream for all · pass the device', ar: 'نفس التسلسل للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 20, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <GoNoGoEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  legend: { display: 'flex', justifyContent: 'center', gap: 22, padding: '8px 0 2px', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: '#5a4a32' },
  legItem: { display: 'inline-flex', alignItems: 'center', gap: 7 },
  swatch: { width: 16, height: 16, display: 'inline-block' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: '#fffdf8', overflow: 'hidden', border: '1.5px solid #e3d6c4', boxShadow: 'inset 0 2px 10px rgba(120,90,40,0.06)', touchAction: 'none', cursor: 'pointer' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  banner: { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#fffdf8', border: '1.5px solid #d8c8ac', color: '#3a2c12', borderRadius: 999, padding: '8px 18px', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(120,90,40,0.12)' },
};
