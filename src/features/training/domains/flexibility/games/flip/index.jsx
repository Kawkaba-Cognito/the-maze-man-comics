import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { SURVIVAL_MS, survivalRamp, drawSurvivalBar } from '../../../../shared/survival';

/*
 * Flip — rule-following under reversal (cognitive flexibility).
 * A hopper must CATCH one colour and AVOID another by moving LEFT / RIGHT. The
 * rule (catch X, avoid Y) changes; and at higher levels the CONTROLS invert
 * (right sends you left). Balls fall one-at-a-time with enough drop time, so the
 * game is always winnable with good play — you only lose a life by *catching* an
 * "avoid" ball. Trains rule-switching + perseveration-breaking, distinct from the
 * cued switching in Arrow Rush.
 * Modes: Free (lives, endless) / Levels (100) / Pass n Play (fixed balls, score).
 */

const FLX = '#e07aaa';
const PALETTE = [
  { k: 'red', c: '#ff5a5a' },
  { k: 'blue', c: '#4f9fe0' },
  { k: 'green', c: '#3be086' },
  { k: 'yellow', c: '#ffce4a' },
];
const TAKE_RATIO = 0.55;

const BASE = {
  easy: { lanes: 3, fall: 125, spawn: 720, ruleEvery: 5, invert: true, flipEvery: 8, warn: true, cued: true, lives: 5, budget: 22 },
  med: { lanes: 3, fall: 160, spawn: 660, ruleEvery: 4, invert: true, flipEvery: 6, warn: true, cued: false, lives: 4, budget: 28 },
  hard: { lanes: 4, fall: 195, spawn: 600, ruleEvery: 4, invert: true, flipEvery: 5, warn: false, cued: false, lives: 3, budget: 34 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return {
    ...b,
    fall: b.fall + f * 90,
    spawn: Math.max(460, b.spawn - f * 180),
    ruleEvery: Math.max(3, Math.round(b.ruleEvery - f * 1)),
    flipEvery: Math.max(3, Math.round(b.flipEvery - f * 3)),
    budget: b.budget + Math.round(f * 14),
  };
}

function FlipEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppBudget = mode === 'passplay' ? (attempt?.trials ?? 24) : 0;

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const stateRef = useRef(null);
  const finishedRef = useRef(false);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);    // free-mode game over { score }
  const [hud, setHud] = useState({ caught: 0, lives: 0, combo: 0, resolved: 0 });
  const [rule, setRule] = useState({ take: 0, avoid: 1 });
  const [sting, setSting] = useState(null);
  const [msg, setMsg] = useState('');

  const cfg = useMemo(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return { ...BASE.med, budget: ppBudget };
    return { ...BASE.easy, budget: Infinity }; // free
  }, [mode, diff, level, ppBudget]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const g = stateRef.current;
    if (mode === 'free') { setOver({ score: g.caught }); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.lives > 0; // survive the whole wave
      onResult({ won, score: g.caught, summary: isAr ? `أمسكت ${g.caught} · ${won ? 'نجوت' : 'سقطت'}` : `Caught ${g.caught} · ${won ? 'survived' : 'out of lives'}` });
    } else onResult({ score: g.caught });
  }, [mode, onResult, isAr, playSfx]);

  const move = useCallback((btnDir) => {
    const g = stateRef.current;
    if (!g || finishedRef.current) return;
    const eff = g.mirror ? -btnDir : btnDir;
    const next = Math.max(0, Math.min(g.lanes - 1, g.lane + eff));
    if (next !== g.lane) {
      if (g.justFlipped && btnDir === g.preFlipLast) g.persev += 1;
      g.lane = next; g.hopT = 0; g.justFlipped = false; g.lastBtn = btnDir;
      playSfx('click');
    }
  }, [playSfx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [move]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rngLocal = makeRng((seed != null ? seed : 12345) ^ (runId * 2654435761) >>> 0);
    const pick = (n) => Math.floor(rngLocal() * n);

    const g = {
      lanes: cfg.lanes, lane: Math.floor(cfg.lanes / 2),
      balls: [], spawnAcc: 0, fall: cfg.fall, spawnEvery: cfg.spawn, t0: performance.now(),
      mirror: false, cued: cfg.cued, warn: cfg.warn, invert: cfg.invert, flipEvery: cfg.flipEvery,
      ruleEvery: cfg.ruleEvery, take: 0, avoid: 1,
      caught: 0, combo: 0, bestCombo: 0, resolved: 0, persev: 0, spawned: 0,
      lives: cfg.lives, budget: cfg.budget,
      sinceRule: 0, sinceFlip: 0, justFlipped: false, preFlipLast: 0, lastBtn: 0, flipsSeen: 0,
      hopT: 1, charX: 0,
      W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    stateRef.current = g;
    finishedRef.current = false;

    const newRule = () => {
      const t = pick(PALETTE.length);
      let a = pick(PALETTE.length); let guard = 0;
      while (a === t && guard++ < 8) a = pick(PALETTE.length);
      g.take = t; g.avoid = a; g.sinceRule = 0;
      setRule({ take: t, avoid: a });
    };
    newRule();

    const flip = () => {
      g.mirror = !g.mirror; g.justFlipped = true; g.preFlipLast = g.lastBtn; g.flipsSeen += 1;
      if (g.warn || g.flipsSeen <= 2) setSting({ id: Date.now(), text: isAr ? '🔄 انقلاب!' : '🔄 FLIPPED!' });
      playSfx('win');
    };

    setMsg(isAr ? 'أمسك اللون المطلوب وتجنّب الآخر' : 'Catch the target colour, avoid the other');

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      g.W = r.width; g.H = r.height;
      canvas.width = Math.round(r.width * g.dpr); canvas.height = Math.round(r.height * g.dpr);
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      if (!g.charX) g.charX = (g.lane + 0.5) * (g.W / g.lanes);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapRef.current);

    const laneX = (i) => (i + 0.5) * (g.W / g.lanes);
    const ballR = () => Math.min(g.W / g.lanes, g.H) * 0.12;

    let hudCache = { caught: -1, lives: -1, combo: -1, resolved: -1 };
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const r = ballR();
      const catchY = g.H - r - 18;

      // staggered spawn: only one ball near the top at a time → always reactable
      g.spawnAcc += dt * 1000;
      const topY = g.balls.length ? Math.min(...g.balls.map((b) => b.y)) : Infinity;
      if (g.spawnAcc >= g.spawnEvery && g.spawned < g.budget && topY > g.H * 0.52) {
        g.spawnAcc = 0; g.spawned += 1;
        const isTake = rngLocal() < TAKE_RATIO;
        g.balls.push({ lane: pick(g.lanes), y: -r, take: isTake, color: PALETTE[isTake ? g.take : g.avoid].c });
      }
      let survPct = 1;
      if (mode === 'free') {
        const elapsed = now - g.t0;
        if (elapsed >= SURVIVAL_MS) { finish(); return; }
        survPct = 1 - elapsed / SURVIVAL_MS;
        g.fall = cfg.fall * (1 + survivalRamp(elapsed) * 1.1);
      }

      for (const b of g.balls) b.y += g.fall * dt;

      const remaining = [];
      for (const b of g.balls) {
        if (b.y >= catchY) {
          g.resolved += 1; g.sinceFlip += 1;
          const inLane = b.lane === g.lane;
          if (b.take) {
            if (inLane) {
              g.caught += 1; g.combo += 1; if (g.combo > g.bestCombo) g.bestCombo = g.combo;
              g.sinceRule += 1; awardPoints(1); playSfx('collect');
              if (g.sinceRule >= g.ruleEvery) newRule();
            } else {
              // missed a ball you had to catch
              g.combo = 0; g.lives -= 1; playSfx('error');
              setSting({ id: Date.now(), text: isAr ? '💔 فاتتك!' : '💔 Missed!' });
              if (g.lives <= 0) { g.balls = []; finish(); return; }
            }
          } else if (inLane) {
            // caught a ball you had to avoid
            g.combo = 0; g.lives -= 1; playSfx('error');
            setSting({ id: Date.now(), text: isAr ? '💔 خطأ!' : '💔 Wrong!' });
            if (g.lives <= 0) { g.balls = []; finish(); return; }
          }
          // control flip cadence
          if (g.invert && g.sinceFlip >= g.flipEvery) { g.sinceFlip = 0; flip(); }
        } else remaining.push(b);
      }
      g.balls = remaining;

      // budget exhausted
      if (g.budget !== Infinity && g.spawned >= g.budget && g.balls.length === 0) { finish(); return; }

      // hop
      if (g.hopT < 1) g.hopT = Math.min(1, g.hopT + dt * 7);
      const targetX = laneX(g.lane);
      g.charX += (targetX - g.charX) * Math.min(1, dt * 16);
      const hopY = Math.sin(g.hopT * Math.PI) * (r * 0.9);

      // draw
      ctx.clearRect(0, 0, g.W, g.H);
      if (mode === 'free') drawSurvivalBar(ctx, g.W, survPct, FLX);
      for (let i = 0; i < g.lanes; i++) {
        ctx.fillStyle = i % 2 ? 'rgba(224,122,170,0.05)' : 'rgba(224,122,170,0.02)';
        ctx.fillRect((i / g.lanes) * g.W, 0, g.W / g.lanes, g.H);
      }
      if (g.cued) { ctx.lineWidth = 8; ctx.strokeStyle = g.mirror ? '#ff6aa0' : '#4f9fe0'; ctx.strokeRect(4, 4, g.W - 8, g.H - 8); }
      ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, catchY); ctx.lineTo(g.W, catchY); ctx.stroke();

      for (const b of g.balls) {
        const x = laneX(b.lane);
        ctx.save(); ctx.translate(x, b.y);
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.3, r * 0.28, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      const cx = g.charX, cy = catchY - hopY;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(g.mirror ? -1 : 1, 1);
      ctx.fillStyle = FLX;
      ctx.beginPath(); ctx.arc(0, 0, r * 1.05, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.15, r * 0.26, 0, Math.PI * 2); ctx.arc(r * 0.32, -r * 0.15, r * 0.26, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2d2d2d';
      ctx.beginPath(); ctx.arc(-r * 0.26, -r * 0.13, r * 0.12, 0, Math.PI * 2); ctx.arc(r * 0.38, -r * 0.13, r * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      if (g.caught !== hudCache.caught || g.lives !== hudCache.lives || g.combo !== hudCache.combo || g.resolved !== hudCache.resolved) {
        hudCache = { caught: g.caught, lives: g.lives, combo: g.combo, resolved: g.resolved };
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

  const S = styles;
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.resolved}/${cfg.budget} · 💎${hud.caught}` : `Lvl ${level} · ${hud.resolved}/${cfg.budget} · 💎${hud.caught}`)
    : mode === 'passplay' ? `${hud.resolved}/${cfg.budget} · 💎${hud.caught}`
      : (isAr ? `💎 ${hud.caught}` : `💎 ${hud.caught}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'انقلاب' : 'Flip'}</div>
          <div className="ct-training-play-sub">{head} · {'♥'.repeat(Math.max(0, hud.lives))}{hud.combo > 1 ? ` · 🔥${hud.combo}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div style={S.bannerWrap}>
        <span style={S.tag}>{isAr ? 'أمسك' : 'CATCH'}</span>
        <span style={{ ...S.dot, background: PALETTE[rule.take].c }} />
        <span style={S.sep}>·</span>
        <span style={S.tag}>{isAr ? 'تجنّب' : 'AVOID'}</span>
        <span style={{ ...S.dot, background: PALETTE[rule.avoid].c, position: 'relative' }}><span style={S.dotX}>✕</span></span>
      </div>

      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} style={{ display: 'block', touchAction: 'none' }} />
        {sting && <div key={sting.id} style={S.sting}><div style={S.stingInner}>{sting.text}</div></div>}
        {msg && hud.resolved < 2 && !over && <div style={S.msg}>{msg}</div>}
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `أمسكت ${over.score}` : `Caught ${over.score}`}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button style={S.overBtn} onClick={() => { playSfx('click'); restart(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
                <button style={{ ...S.overBtn, background: '#cdbfa6' }} onClick={() => { playSfx('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={S.controls}>
        <button style={S.ctrlBtn} aria-label={isAr ? 'يسار' : 'Left'} onPointerDown={(e) => { e.preventDefault(); move(-1); }}>◀</button>
        <button style={S.ctrlBtn} aria-label={isAr ? 'يمين' : 'Right'} onPointerDown={(e) => { e.preventDefault(); move(1); }}>▶</button>
      </div>
    </div>
  );
}

export default function FlipGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_flx_flip"
      scienceId="flip"
      title={{ en: 'Flip', ar: 'انقلاب' }}
      hints={{
        free: { en: 'Catch the colour, avoid the other — lives!', ar: 'أمسك اللون وتجنّب الآخر — أرواح!' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same balls for all · pass the device', ar: 'نفس الكرات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 26, scoreLabel: { en: 'caught', ar: 'أمسكت' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <FlipEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  bannerWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0 4px', minHeight: 34 },
  tag: { fontWeight: 900, letterSpacing: 1, color: '#5a4a32', fontSize: 14 },
  dot: { width: 26, height: 26, borderRadius: '50%', boxShadow: '2px 2px 0 #1a1208', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  dotX: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.55)', fontWeight: 900, fontSize: 16 },
  sep: { color: '#cdbfa6', fontWeight: 900 },
  play: { position: 'relative', flex: 1, overflow: 'hidden' },
  msg: { position: 'absolute', top: 12, left: 0, right: 0, textAlign: 'center', fontWeight: 700, color: '#5a4a32', pointerEvents: 'none', padding: '0 16px' },
  sting: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  stingInner: { fontSize: 'clamp(26px, 8vw, 56px)', fontWeight: 900, color: '#fff', background: 'rgba(224,122,170,0.92)', padding: '10px 24px', borderRadius: 16, boxShadow: '4px 4px 0 #1a1208', animation: 'flipStingPop .8s ease-out' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#5a4a32' },
  overBtn: { flex: 1, padding: '15px 16px', fontWeight: 900, fontSize: 16, color: '#fff', background: FLX, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
  controls: { display: 'flex', gap: 14, padding: '14px 18px calc(14px + env(safe-area-inset-bottom))' },
  ctrlBtn: { flex: 1, height: 84, fontSize: 38, fontWeight: 900, color: '#fff', background: FLX, border: 'none', borderRadius: 20, boxShadow: '4px 4px 0 #1a1208', cursor: 'pointer', touchAction: 'none', userSelect: 'none' },
};
