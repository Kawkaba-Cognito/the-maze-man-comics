import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';

/*
 * Math Gates — endless runner with rule-switching arithmetic (cognitive flexibility).
 * A runner holds LEFT / CENTRE / RIGHT. An equation (e.g. 7 × 9) shows up top and
 * three gates carry numbers — steer into the gate with the correct answer. The
 * OPERATION changes gate to gate (+, −, ×, ÷); harder equations at higher levels.
 * Wrong gate = crash (a life). Exactly one gate is always correct and reachable.
 * Modes: Free (lives, endless) / Levels (100) / Pass n Play (fixed gates, score).
 */

const FLX = '#e07aaa';
const LANES = 3;

const BASE = {
  easy: { ops: ['+', '-'], gap: 700, lives: 5, target: 8 },
  med: { ops: ['+', '-', '×'], gap: 650, lives: 4, target: 10 },
  hard: { ops: ['+', '-', '×', '÷'], gap: 600, lives: 3, target: 12 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return { ...b, gap: Math.max(450, b.gap - f * 180), target: b.target + Math.round(f * 10), f };
}
const PP_GATES = 12;

function genGate(diff, f, rng) {
  const ops = (BASE[diff] || BASE.med).ops;
  const op = ops[Math.floor(rng() * ops.length)];
  const ri = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  let a, b, ans;
  if (op === '+') {
    const hi = diff === 'easy' ? 9 + Math.round(f * 12) : diff === 'med' ? 20 + Math.round(f * 25) : 40 + Math.round(f * 55);
    a = ri(1, hi); b = ri(1, hi); ans = a + b;
  } else if (op === '-') {
    const hi = diff === 'easy' ? 9 + Math.round(f * 12) : diff === 'med' ? 25 + Math.round(f * 30) : 50 + Math.round(f * 60);
    a = ri(2, hi); b = ri(1, a); ans = a - b;
  } else if (op === '×') {
    const hi = diff === 'med' ? 9 : 9 + Math.round(f * 4);
    a = ri(2, hi); b = ri(2, hi); ans = a * b;
  } else { // ÷
    const dh = 9 + Math.round(f * 3), qh = 9 + Math.round(f * 3);
    b = ri(2, dh); const q = ri(2, qh); a = b * q; ans = q;
  }
  const opts = new Set([ans]);
  const span = Math.max(3, Math.round(Math.abs(ans) * 0.25) + 2);
  let guard = 0;
  while (opts.size < 3 && guard++ < 60) {
    const cand = ans + ri(1, span) * (rng() < 0.5 ? -1 : 1);
    if (cand >= 0) opts.add(cand);
  }
  while (opts.size < 3) opts.add(ans + opts.size + 1);
  const arr = [...opts];
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return { text: `${a} ${op} ${b}`, answer: ans, options: arr, correctLane: arr.indexOf(ans), op, a, b };
}

// Harder equations get a longer runway (more thinking time) — scales with the
// operation and the size of the numbers, so a tough sum is never a time-trap.
function gateTime(eq) {
  let t = 2.6;
  t += eq.op === '-' ? 0.5 : eq.op === '×' ? 1.5 : eq.op === '÷' ? 2.2 : 0.2;
  const mag = String(Math.abs(eq.a)).length + String(Math.abs(eq.b)).length - 2;
  t += mag * 0.45;
  t += Math.max(0, String(Math.abs(eq.answer)).length - 1) * 0.4;
  return Math.min(8, t);
}

function MathGatesEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppGates = mode === 'passplay' ? (attempt?.trials || PP_GATES) : 0;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const finishedRef = useRef(false);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [hud, setHud] = useState({ passed: 0, lives: 0, combo: 0 });
  const [eq, setEq] = useState('');
  const [sting, setSting] = useState(null);

  const cfg = useMemo(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return { ...levelCfg('med', 1) };
    return { ...levelCfg('easy', 1) };
  }, [mode, diff, level]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const g = stateRef.current;
    if (mode === 'free') { setOver({ score: g.passed }); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.passed >= cfg.target;
      onResult({ won, score: g.passed, summary: isAr ? `${g.passed}/${cfg.target} صحيح` : `${g.passed}/${cfg.target} correct` });
    } else onResult({ score: g.passed });
  }, [mode, cfg.target, onResult, isAr, playSfx]);

  const setLane = useCallback((ln) => {
    const g = stateRef.current; if (!g || finishedRef.current) return;
    const next = Math.max(0, Math.min(LANES - 1, ln));
    if (next !== g.lane) { g.lane = next; playSfx('click'); }
  }, [playSfx]);
  const moveBy = useCallback((d) => { const g = stateRef.current; if (g) setLane(g.lane + d); }, [setLane]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); moveBy(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveBy(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moveBy]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dkey = mode === 'levels' ? diff : mode === 'passplay' ? 'med' : 'easy';
    const rng = makeRng((seed != null ? seed : 98765) ^ ((runId * 40503) >>> 0));

    const g = {
      lane: 1, gate: null, gapTimer: cfg.gap,
      passed: 0, lives: cfg.lives, combo: 0, bestCombo: 0, gatesPlayed: 0,
      flash: null, charX: 0,
      W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    stateRef.current = g;
    finishedRef.current = false;

    const spawnGate = () => {
      const eqObj = genGate(dkey, cfg.f, rng);
      const bandH = Math.min(g.H * 0.16, 96);
      g.gate = { y: -bandH, eq: eqObj, t: gateTime(eqObj), speed: null };
      setEq(eqObj.text);
    };

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      g.W = r.width; g.H = r.height;
      canvas.width = Math.round(r.width * g.dpr); canvas.height = Math.round(r.height * g.dpr);
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      if (!g.charX) g.charX = (g.lane + 0.5) * (g.W / LANES);
      if (g.gate && g.gate.y < 0) g.gate.y = -g.H * 0.18;
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrapRef.current);
    spawnGate();

    const laneX = (i) => (i + 0.5) * (g.W / LANES);

    let hudCache = { passed: -1, lives: -1, combo: -1 };
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const bandH = Math.min(g.H * 0.16, 96);
      const charY = g.H - 64;
      const catchY = charY - bandH * 0.3;

      if (g.gate) {
        if (g.gate.speed == null) {
          // set a constant speed so the gate takes `t` seconds to reach the player;
          // a gentle global ramp speeds later gates a touch (floored, stays fair).
          const pace = Math.max(0.78, 1 - g.passed * 0.012);
          g.gate.speed = (catchY - g.gate.y) / Math.max(0.4, g.gate.t * pace);
        }
        g.gate.y += g.gate.speed * dt;
        if (g.gate.y >= catchY) {
          g.gatesPlayed += 1;
          const ok = g.lane === g.gate.eq.correctLane;
          if (ok) {
            g.passed += 1; g.combo += 1; if (g.combo > g.bestCombo) g.bestCombo = g.combo;
            awardPoints(1); playSfx('collect');
            g.flash = { ok: true, until: now + 350 };
            if (mode === 'levels' && g.passed >= cfg.target) { finish(); return; }
          } else {
            g.combo = 0; playSfx('error');
            g.flash = { ok: false, until: now + 450, lane: g.gate.eq.correctLane };
            if (mode === 'levels' || mode === 'free') { g.lives -= 1; if (g.lives <= 0) { finish(); return; } }
          }
          if (mode === 'passplay' && g.gatesPlayed >= ppGates) { g.gate = null; finish(); return; }
          g.gate = null; g.gapTimer = cfg.gap;
        }
      } else {
        g.gapTimer -= dt * 1000;
        if (g.gapTimer <= 0) { spawnGate(); }
      }

      const targetX = laneX(g.lane);
      g.charX += (targetX - g.charX) * Math.min(1, dt * 18);

      // draw
      ctx.clearRect(0, 0, g.W, g.H);
      // road lanes
      for (let i = 0; i < LANES; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(224,122,170,0.05)' : 'rgba(224,122,170,0.02)';
        ctx.fillRect((i / LANES) * g.W, 0, g.W / LANES, g.H);
      }
      for (let i = 1; i < LANES; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo((i / LANES) * g.W, 0); ctx.lineTo((i / LANES) * g.W, g.H); ctx.stroke();
      }
      // gate band
      if (g.gate) {
        const y = g.gate.y;
        for (let i = 0; i < LANES; i++) {
          const x = (i / LANES) * g.W;
          ctx.fillStyle = '#fffdf8';
          ctx.strokeStyle = FLX; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.roundRect(x + 6, y - bandH / 2, g.W / LANES - 12, bandH, 12); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#2d2d2d';
          ctx.font = `900 ${Math.round(bandH * 0.42)}px Outfit, system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(g.gate.eq.options[i]), x + (g.W / LANES) / 2, y);
        }
      }
      // catch line
      ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, charY); ctx.lineTo(g.W, charY); ctx.stroke();
      // flash feedback on lanes
      if (g.flash && now < g.flash.until) {
        if (g.flash.ok) { ctx.fillStyle = 'rgba(59,224,134,0.18)'; ctx.fillRect(laneX(g.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H); }
        else {
          ctx.fillStyle = 'rgba(255,90,90,0.16)'; ctx.fillRect(laneX(g.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
          ctx.fillStyle = 'rgba(59,224,134,0.22)'; ctx.fillRect(laneX(g.flash.lane) - g.W / (2 * LANES), 0, g.W / LANES, g.H);
        }
      }
      // runner
      const cx = g.charX, cy = charY;
      const rr = Math.min(g.W / LANES, 90) * 0.3;
      ctx.save(); ctx.translate(cx, cy);
      ctx.fillStyle = FLX;
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-rr * 0.32, -rr * 0.15, rr * 0.26, 0, Math.PI * 2); ctx.arc(rr * 0.32, -rr * 0.15, rr * 0.26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d2d2d';
      ctx.beginPath(); ctx.arc(-rr * 0.28, -rr * 0.13, rr * 0.12, 0, Math.PI * 2); ctx.arc(rr * 0.36, -rr * 0.13, rr * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      if (g.passed !== hudCache.passed || g.lives !== hudCache.lives || g.combo !== hudCache.combo) {
        hudCache = { passed: g.passed, lives: g.lives, combo: g.combo };
        setHud(hudCache);
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  useEffect(() => { if (!sting) return; const id = setTimeout(() => setSting(null), 800); return () => clearTimeout(id); }, [sting]);

  const restart = () => { setOver(null); finishedRef.current = false; setRunId((n) => n + 1); };

  const onCanvasTap = (e) => {
    const g = stateRef.current; if (!g) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLane(Math.floor(((e.clientX - rect.left) / rect.width) * LANES));
  };

  const S = styles;
  const showLives = mode !== 'passplay';
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.passed}/${cfg.target}` : `Lvl ${level} · ${hud.passed}/${cfg.target}`)
    : mode === 'passplay' ? (isAr ? `صحيح ${hud.passed}` : `Correct ${hud.passed}`)
      : (isAr ? `صحيح ${hud.passed}` : `Correct ${hud.passed}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'بوابات الحساب' : 'Math Gates'}</div>
          <div className="ct-training-play-sub">{head}{showLives ? ` · ${'♥'.repeat(Math.max(0, hud.lives))}` : ''}{hud.combo > 1 ? ` · 🔥${hud.combo}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={S.eqWrap}><span style={S.eq}>{eq}</span><span style={S.eqQ}>= ?</span></div>

      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} onPointerDown={onCanvasTap} style={{ display: 'block', touchAction: 'none' }} />
        {sting && <div key={sting.id} style={S.sting}><div style={S.stingInner}>{sting.text}</div></div>}
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `صحيح ${over.score}` : `${over.score} correct`}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button style={S.overBtn} onClick={() => { playSfx('click'); restart(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
                <button style={{ ...S.overBtn, background: '#cdbfa6' }} onClick={() => { playSfx('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={S.controls}>
        <button style={S.ctrlBtn} aria-label={isAr ? 'يسار' : 'Left'} onPointerDown={(e) => { e.preventDefault(); moveBy(-1); }}>◀</button>
        <button style={S.ctrlBtn} aria-label={isAr ? 'يمين' : 'Right'} onPointerDown={(e) => { e.preventDefault(); moveBy(1); }}>▶</button>
      </div>
    </div>
  );
}

export default function MathGatesGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_mathgates"
      title={{ en: 'Math Gates', ar: 'بوابات الحساب' }}
      hints={{
        free: { en: 'Run the right gate — operations keep changing', ar: 'اعبُر البوابة الصحيحة — العمليات تتغيّر' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same equations for all · pass the device', ar: 'نفس المعادلات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_GATES, scoreLabel: { en: 'correct', ar: 'صحيح' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <MathGatesEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  eqWrap: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10, padding: '8px 0 4px', minHeight: 44 },
  eq: { fontWeight: 900, fontSize: 'clamp(28px, 8vw, 44px)', color: '#2d2d2d', letterSpacing: 1 },
  eqQ: { fontWeight: 900, fontSize: 'clamp(20px, 6vw, 30px)', color: FLX },
  play: { position: 'relative', flex: 1, overflow: 'hidden' },
  sting: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  stingInner: { fontSize: 'clamp(26px, 8vw, 56px)', fontWeight: 900, color: '#fff', background: 'rgba(224,122,170,0.92)', padding: '10px 24px', borderRadius: 16, boxShadow: '4px 4px 0 #1a1208', animation: 'flipStingPop .8s ease-out' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#5a4a32' },
  overBtn: { flex: 1, padding: '12px 16px', fontWeight: 800, color: '#fff', background: FLX, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
  controls: { display: 'flex', gap: 14, padding: '14px 18px calc(14px + env(safe-area-inset-bottom))' },
  ctrlBtn: { flex: 1, height: 84, fontSize: 38, fontWeight: 900, color: '#fff', background: FLX, border: 'none', borderRadius: 20, boxShadow: '4px 4px 0 #1a1208', cursor: 'pointer', touchAction: 'none', userSelect: 'none' },
};
