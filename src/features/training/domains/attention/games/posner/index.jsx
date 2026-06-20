import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';

/*
 * Posner Spatial Cueing — orienting of attention.
 *
 * Fixate the centre. A location flashes (cue); after a gap the target appears —
 * tap it fast. Most cues are VALID, some INVALID (forces disengage + re-orient).
 * Wrapped in the shared 3-mode flow (Free / Levels / Challenge) via ModeShell.
 *
 * Neuroscience: Posner & Petersen orienting network (superior parietal cortex,
 * frontal eye fields, temporo-parietal junction "circuit-breaker").
 */

const FIX_MS = 520;
const CUE_MS = 120;
const TARGET_TIMEOUT = 2200;
const TRIALS_PER_LEVEL = 12;
const LEVEL_WIN_ACC = 0.7;
const CHAL_LIVES = 3;

const PBASE = {
  easy: { nLoc: 2, validityP: 0.8, soaMin: 180, soaMax: 340 },
  med: { nLoc: 4, validityP: 0.72, soaMin: 150, soaMax: 300 },
  hard: { nLoc: 6, validityP: 0.65, soaMin: 120, soaMax: 260 },
};
function levelCfg(diff, level) {
  const b = PBASE[diff] || PBASE.med;
  const f = ((level || 1) - 1) / 99;
  return { nLoc: b.nLoc, validityP: Math.max(0.55, b.validityP - f * 0.12), soaMin: Math.max(90, b.soaMin - f * 90), soaMax: Math.max(180, b.soaMax - f * 90) };
}
function rampCfg(n) {
  const nLoc = n < 6 ? 2 : n < 16 ? 4 : 6;
  return { nLoc, validityP: Math.max(0.6, 0.8 - Math.floor(n / 8) * 0.05), soaMin: 150, soaMax: 320 };
}

function PosnerEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 12) : 0;
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const subRef = useRef('fixation');
  const trialRef = useRef({ nLoc: 2, cued: 0, targetIdx: 0, valid: true });
  const targetOnsetRef = useRef(0);
  const fbRef = useRef({ tapped: -1, correct: false, until: 0, showTarget: false });
  const timerRef = useRef(null);
  const rafRef = useRef(0);
  // progression
  const trialNumRef = useRef(0);      // free/challenge ramp
  const doneRef = useRef(0);          // levels: trials done
  const correctRef = useRef(0);
  const livesRef = useRef(CHAL_LIVES);
  const scoreRef = useRef(0);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(CHAL_LIVES);
  const [lastRt, setLastRt] = useState(null);
  const [hud, setHud] = useState('');
  const [msg, setMsg] = useState('');

  const angles = useCallback((n) => (n === 2 ? [0, Math.PI] : Array.from({ length: n }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n)), []);
  const locPx = useCallback((i) => {
    const { w, h } = sizeRef.current;
    const R = Math.min(w, h) * 0.34;
    const a = angles(trialRef.current.nLoc)[i];
    return { x: w / 2 + Math.cos(a) * R, y: h / 2 + Math.sin(a) * R };
  }, [angles]);
  const boxR = useCallback(() => Math.max(22, Math.min(sizeRef.current.w, sizeRef.current.h) * 0.085), []);

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
      const sub = subRef.current, t = trialRef.current, r = boxR(), now = performance.now(), fb = fbRef.current, fbOn = now < fb.until;
      ctx.strokeStyle = '#5f6f82'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const cx = w / 2, cy = h / 2, s = 12;
      ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); ctx.stroke();
      for (let i = 0; i < t.nLoc; i++) {
        const p = locPx(i);
        let stroke = '#9aa7b8', fill = null, lw = 3;
        if (sub === 'cue' && i === t.cued) { stroke = '#ffce4a'; lw = 6; fill = 'rgba(255,206,74,0.22)'; }
        if (sub === 'target' && i === t.targetIdx) { fill = '#3aa0ff'; stroke = '#cfe6ff'; lw = 4; }
        if (fbOn) {
          if (i === fb.tapped) { stroke = fb.correct ? '#3be086' : '#ff5a5a'; lw = 6; fill = fb.correct ? 'rgba(59,224,134,0.25)' : 'rgba(255,90,90,0.25)'; }
          else if (fb.showTarget && i === t.targetIdx) { stroke = '#3be086'; lw = 5; }
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke();
        if (sub === 'target' && i === t.targetIdx) { ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); }
      }
    }
    rafRef.current = requestAnimationFrame(draw);
  }, [boxR, locPx]);

  const cfgForTrial = useCallback(() => (mode === 'levels' ? levelCfg(diff, level) : rampCfg(trialNumRef.current)), [mode, diff, level]);

  const updateHud = useCallback(() => {
    if (mode === 'levels') setHud(isAr ? `مستوى ${level} · ${doneRef.current}/${TRIALS_PER_LEVEL} · ✓${correctRef.current}` : `Lvl ${level} · ${doneRef.current}/${TRIALS_PER_LEVEL} · ✓${correctRef.current}`);
    else if (mode === 'passplay') setHud(isAr ? `محاولة ${doneRef.current}/${ppTrials} · ✓${correctRef.current}` : `Trial ${doneRef.current}/${ppTrials} · ✓${correctRef.current}`);
    else setHud(isAr ? `محاولة ${trialNumRef.current + 1}` : `Trial ${trialNumRef.current + 1}`);
  }, [mode, level, isAr, ppTrials]);

  const nextTrial = useCallback(() => {
    fit();
    const cfg = cfgForTrial();
    const cued = Math.floor(rng() * cfg.nLoc);
    const valid = rng() < cfg.validityP;
    let targetIdx = cued;
    if (!valid) { do { targetIdx = Math.floor(rng() * cfg.nLoc); } while (targetIdx === cued); }
    trialRef.current = { nLoc: cfg.nLoc, cued, targetIdx, valid };
    updateHud();
    setMsg(isAr ? 'ركّز على المنتصف…' : 'Focus on the centre…');
    subRef.current = 'fixation';
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      subRef.current = 'cue';
      timerRef.current = setTimeout(() => {
        subRef.current = 'soa';
        const soa = cfg.soaMin + rng() * (cfg.soaMax - cfg.soaMin);
        timerRef.current = setTimeout(() => {
          subRef.current = 'target';
          targetOnsetRef.current = performance.now();
          setMsg(isAr ? 'اضغط الهدف!' : 'Tap the target!');
          timerRef.current = setTimeout(() => finish(-1, false, true), TARGET_TIMEOUT);
        }, soa);
      }, CUE_MS);
    }, FIX_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgForTrial, fit, isAr, updateHud, rng]);

  const advance = useCallback((correct) => {
    doneRef.current += 1;
    if (correct) correctRef.current += 1;
    if (mode === 'levels') {
      if (doneRef.current >= TRIALS_PER_LEVEL) {
        const acc = correctRef.current / TRIALS_PER_LEVEL;
        onResult({ won: acc >= LEVEL_WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${TRIALS_PER_LEVEL} (${Math.round(acc * 100)}%)` });
        return;
      }
    } else if (mode === 'passplay') {
      if (doneRef.current >= ppTrials) { onResult({ score: correctRef.current }); return; }
    } else {
      trialNumRef.current += 1;
    }
    nextTrial();
  }, [mode, nextTrial, onResult, ppTrials]);

  const finish = useCallback((tappedIdx, correct, miss = false) => {
    clearTimeout(timerRef.current);
    const t = trialRef.current;
    const rt = miss ? null : Math.round(performance.now() - targetOnsetRef.current);
    fbRef.current = { tapped: tappedIdx, correct, until: performance.now() + 600, showTarget: !correct };
    subRef.current = 'feedback';
    if (miss) { playSfx?.('lose'); setMsg(isAr ? 'بطيء جداً' : 'Too slow'); }
    else if (correct) {
      playSfx?.('win');
      scoreRef.current += 6 + Math.min(Math.max(0, Math.round((1200 - rt) / 110)), 9);
      setScore(scoreRef.current); awardPoints?.(2); setLastRt(rt);
      setMsg(t.valid ? (isAr ? 'صحيح ✓' : 'Hit ✓') : (isAr ? 'أعدت التوجيه ✓' : 'Re-oriented ✓'));
    } else { playSfx?.('lose'); setMsg(isAr ? 'الموقع الخاطئ' : 'Wrong spot'); }
    timerRef.current = setTimeout(() => advance(correct && !miss), 680);
  }, [advance, awardPoints, isAr, playSfx]);

  const onPointer = useCallback((e) => {
    const sub = subRef.current;
    if (sub === 'feedback') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (sub !== 'target') {
      clearTimeout(timerRef.current);
      playSfx?.('lose');
      setMsg(isAr ? 'انتظر ظهور الهدف!' : 'Wait for the target!');
      fbRef.current = { tapped: -1, correct: false, until: performance.now() + 450, showTarget: false };
      subRef.current = 'feedback';
      timerRef.current = setTimeout(nextTrial, 650); // anticipation: re-run trial, not counted
      return;
    }
    const r = boxR();
    let hit = -1, best = Infinity;
    for (let i = 0; i < trialRef.current.nLoc; i++) { const p = locPx(i); const d = Math.hypot(p.x - x, p.y - y); if (d < r * 1.4 && d < best) { best = d; hit = i; } }
    if (hit < 0) return;
    finish(hit, hit === trialRef.current.targetIdx);
  }, [boxR, finish, isAr, locPx, nextTrial, playSfx]);

  useEffect(() => {
    fit();
    const onResize = () => fit();
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(draw);
    nextTrial();
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(rafRef.current); clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = styles;
  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'توجيه الانتباه' : 'Attention Cue'}</div>
          <div className="ct-training-play-sub">{hud} · {score}{lastRt != null ? ` · ${lastRt}ms` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>
      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={S.canvas} onPointerDown={onPointer} />
        <div style={S.banner}>{msg}</div>
      </div>
    </div>
  );
}

export default function PosnerGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_attn_posner"
      title={{ en: 'Attention Cue', ar: 'توجيه الانتباه' }}
      hints={{
        free: { en: 'Endless practice — no fail', ar: 'تدريب مفتوح — بلا خسارة' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same cues for all · pass the device', ar: 'نفس الإشارات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 12, scoreLabel: { en: 'hits', ar: 'إصابات' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <PosnerEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: '#fffdf8', overflow: 'hidden', border: '1.5px solid #e3d6c4', boxShadow: 'inset 0 2px 10px rgba(120,90,40,0.06)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  banner: { position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: '#fffdf8', border: '1.5px solid #d8c8ac', color: '#3a2c12', borderRadius: 999, padding: '8px 18px', fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(120,90,40,0.12)' },
};
