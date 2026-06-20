import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';

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
  const lv = (level || 1) - 1;
  return { nLoc: b.nLoc, validityP: Math.max(0.55, b.validityP - lv * 0.01), soaMin: Math.max(90, b.soaMin - lv * 6), soaMax: Math.max(180, b.soaMax - lv * 6) };
}
function rampCfg(n) {
  const nLoc = n < 6 ? 2 : n < 16 ? 4 : 6;
  return { nLoc, validityP: Math.max(0.6, 0.8 - Math.floor(n / 8) * 0.05), soaMin: 150, soaMax: 320 };
}

function PosnerEngine({ mode, diff, level, onResult, onExit, isAr, playSfx, awardPoints }) {
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
      ctx.strokeStyle = '#9fc6ef'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      const cx = w / 2, cy = h / 2, s = 12;
      ctx.beginPath(); ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy); ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s); ctx.stroke();
      for (let i = 0; i < t.nLoc; i++) {
        const p = locPx(i);
        let stroke = 'rgba(159,198,239,0.45)', fill = null, lw = 3;
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
    else if (mode === 'challenge') setHud(`${'❤'.repeat(livesRef.current)}`);
    else setHud(isAr ? `محاولة ${trialNumRef.current + 1}` : `Trial ${trialNumRef.current + 1}`);
  }, [mode, level, isAr]);

  const nextTrial = useCallback(() => {
    fit();
    const cfg = cfgForTrial();
    const cued = Math.floor(Math.random() * cfg.nLoc);
    const valid = Math.random() < cfg.validityP;
    let targetIdx = cued;
    if (!valid) { do { targetIdx = Math.floor(Math.random() * cfg.nLoc); } while (targetIdx === cued); }
    trialRef.current = { nLoc: cfg.nLoc, cued, targetIdx, valid };
    updateHud();
    setMsg(isAr ? 'ركّز على المنتصف…' : 'Focus on the centre…');
    subRef.current = 'fixation';
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      subRef.current = 'cue';
      timerRef.current = setTimeout(() => {
        subRef.current = 'soa';
        const soa = cfg.soaMin + Math.random() * (cfg.soaMax - cfg.soaMin);
        timerRef.current = setTimeout(() => {
          subRef.current = 'target';
          targetOnsetRef.current = performance.now();
          setMsg(isAr ? 'اضغط الهدف!' : 'Tap the target!');
          timerRef.current = setTimeout(() => finish(-1, false, true), TARGET_TIMEOUT);
        }, soa);
      }, CUE_MS);
    }, FIX_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfgForTrial, fit, isAr, updateHud]);

  const advance = useCallback((correct) => {
    if (mode === 'levels') {
      doneRef.current += 1;
      if (correct) correctRef.current += 1;
      if (doneRef.current >= TRIALS_PER_LEVEL) {
        const acc = correctRef.current / TRIALS_PER_LEVEL;
        onResult({ won: acc >= LEVEL_WIN_ACC, score: scoreRef.current, summary: `${correctRef.current}/${TRIALS_PER_LEVEL} (${Math.round(acc * 100)}%)` });
        return;
      }
    } else if (mode === 'challenge') {
      if (correct) { trialNumRef.current += 1; } else {
        livesRef.current -= 1; setLives(livesRef.current);
        if (livesRef.current <= 0) { onResult({ score: scoreRef.current }); return; }
      }
    } else {
      trialNumRef.current += 1;
    }
    nextTrial();
  }, [mode, nextTrial, onResult]);

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
    <div style={S.root}>
      <div style={S.bar}>
        <button style={S.back} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹ {isAr ? 'القائمة' : 'Menu'}</button>
        <div style={S.title}>{isAr ? 'توجيه الانتباه' : 'Attention Cue'}</div>
        <div style={S.stats}>{hud} · {score}{lastRt != null ? ` · ${lastRt}ms` : ''}</div>
      </div>
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
        levels: { en: 'Easy → Hard · 12 levels each', ar: 'سهل → صعب · 12 مستوى لكل' },
        challenge: { en: 'One escalating run · 3 lives', ar: 'جولة تصاعدية · 3 أرواح' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      levelCount={12}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <PosnerEngine key={`${p.mode}-${p.diff}-${p.level}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
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
  play: { position: 'relative', flex: 1, margin: 12, borderRadius: 18, background: 'radial-gradient(circle at 50% 45%, #16243a, #0c1320)', overflow: 'hidden', border: '1px solid rgba(90,160,230,0.18)', touchAction: 'none' },
  canvas: { display: 'block', width: '100%', height: '100%' },
  banner: { position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(8,14,24,0.82)', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 999, padding: '8px 18px', fontWeight: 700, whiteSpace: 'nowrap' },
};
