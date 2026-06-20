import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

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
  const lv = (level || 1) - 1;
  return { stim: Math.max(440, b.stim - lv * 15), isi: Math.max(200, b.isi - lv * 10), goP: Math.min(0.9, b.goP + lv * 0.005) };
}
function rampCfg(n) {
  return { stim: Math.max(480, 880 - n * 12), isi: Math.max(220, 480 - n * 8), goP: Math.min(0.88, 0.72 + n * 0.004) };
}

function GoNoGoEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
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
    else if (mode === 'challenge') setHud('❤'.repeat(livesRef.current));
    else setHud(isAr ? `محفّز ${idxRef.current}` : `Stim ${idxRef.current}`);
  }, [mode, level, isAr]);

  // Outcome of a single stimulus → progression. correct true on hit / correct rejection.
  const score1 = useCallback((correct, commission) => {
    if (correct) { correctRef.current += 1; }
    if (mode === 'levels') {
      if (idxRef.current >= STIM_PER_LEVEL) {
        const acc = correctRef.current / STIM_PER_LEVEL;
        onResult({ won: acc >= LEVEL_WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${STIM_PER_LEVEL} (${Math.round(acc * 100)}%)` });
        return true;
      }
    } else if (mode === 'challenge' && commission) {
      livesRef.current -= 1; setLives(livesRef.current);
      if (livesRef.current <= 0) { onResult({ score: scoreRef.current }); return true; }
    }
    return false;
  }, [mode, onResult]);

  const nextStim = useCallback(() => {
    const c = cfg();
    idxRef.current += 1;
    updateHud();
    const go = Math.random() < c.goP;
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
  }, [cfg, playSfx, score1, updateHud]);

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
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'قف / انطلق' : 'Go / No-Go'}</div>
        <div style={S.stats}>{hud} · {score}</div>
      </div>
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
        levels: { en: 'Easy → Hard · 12 levels each', ar: 'سهل → صعب · 12 مستوى لكل' },
        challenge: { en: 'Escalating run · lose a life on a slip', ar: 'جولة تصاعدية · تخسر روحاً عند الخطأ' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      levelCount={12}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <GoNoGoEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: '#0b1018', color: '#fff', fontFamily: "'Outfit', system-ui, sans-serif" },
  bar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 14px', background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  back: { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#dfe9f5', borderRadius: 9, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' },
  title: { fontWeight: 800, letterSpacing: '0.02em', fontSize: 16 },
  stats: { fontVariantNumeric: 'tabular-nums', color: '#9fc6ef', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' },
  legend: { display: 'flex', justifyContent: 'center', gap: 22, padding: '6px 0 2px', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: '#c4d3e6' },
  legItem: { display: 'inline-flex', alignItems: 'center', gap: 7 },
  swatch: { width: 16, height: 16, display: 'inline-block' },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: 'radial-gradient(circle at 50% 45%, #16243a, #0c1320)', overflow: 'hidden', border: '1px solid rgba(90,160,230,0.18)', touchAction: 'none', cursor: 'pointer' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  banner: { position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,14,24,0.82)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '8px 18px', fontWeight: 700, whiteSpace: 'nowrap' },
};
