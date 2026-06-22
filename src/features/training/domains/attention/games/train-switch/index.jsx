import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { SURVIVAL_MS, survivalRamp, drawSurvivalBar } from '../../../../shared/survival';

/*
 * Train Switch — Divided Attention & planning (Train-of-Thought style).
 * Trains emerge from the tunnel and wind along a track network laid on a grid.
 * Each branch ends in a colour-matched station scattered across the board. At
 * every FORK the player taps the circled switch to point the rail; you must set
 * the switches BEFORE a train reaches the fork so it reaches its colour station,
 * while several trains share the network. The track is a grid-embedded routing
 * tree, so every train always has exactly one solvable path.
 * Modes: Free (lives) / Levels (100) / Pass n Play (fixed trains, score).
 */

const ATT = '#e8ac4e';
const RAIL = '#7c5a30';
const RAIL_OFF = 'rgba(0,0,0,0.12)';
const PAL = ['#ff5a5a', '#4f9fe0', '#3be086', '#b07aff', '#ff8a3a', '#37c2c2'];
const DIRV = { N: [-1, 0], S: [1, 0], W: [0, -1], E: [0, 1] };
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

const BASE = {
  easy: { R: 5, C: 5, stations: 3, cps: 0.85, spawn: 2600, lives: 5, target: 8, maxTrains: 1 },
  med: { R: 6, C: 6, stations: 4, cps: 1.05, spawn: 2300, lives: 4, target: 12, maxTrains: 2 },
  hard: { R: 7, C: 7, stations: 5, cps: 1.3, spawn: 2000, lives: 3, target: 16, maxTrains: 3 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return { ...b, cps: b.cps + f * 0.65, spawn: Math.max(1400, b.spawn - f * 700), target: b.target + Math.round(f * 12) };
}
const PP_TRAINS = 16;

// build a grid-embedded routing tree (tunnel → forks → scattered stations)
function generate(R, C, desired, rng) {
  const visited = Array.from({ length: R }, () => Array(C).fill(false));
  const mk = (r, c) => ({ r, c, children: [], kind: 'track', sw: 0, parent: null });
  const borders = [];
  for (let c = 0; c < C; c++) { borders.push([0, c, 'S']); borders.push([R - 1, c, 'N']); }
  for (let r = 0; r < R; r++) { borders.push([r, 0, 'E']); borders.push([r, C - 1, 'W']); }
  const [tr, tc, tin] = borders[Math.floor(rng() * borders.length)];
  const root = mk(tr, tc); root.kind = 'tunnel'; root.indir = tin;
  visited[tr][tc] = true;
  const [dr, dc] = DIRV[tin];
  const inner = mk(tr + dr, tc + dc); inner.depth = 1; visited[inner.r][inner.c] = true; inner.parent = root; root.children.push(inner);
  const tips = [inner], forks = [], stations = [], all = [root, inner];
  let sum = 1, guard = 0;
  while (tips.length && guard++ < 400) {
    const t = tips.splice(Math.floor(rng() * tips.length), 1)[0];
    const opts = Object.keys(DIRV).filter((d) => {
      const nr = t.r + DIRV[d][0], nc = t.c + DIRV[d][1];
      return nr >= 0 && nc >= 0 && nr < R && nc < C && !visited[nr][nc];
    });
    if (!opts.length) { t.kind = 'station'; stations.push(t); continue; }
    // forks need a run-up (depth ≥ 2) and never back-to-back, so every
    // switch decision has at least one cell of travel time to make it.
    const parentIsFork = t.parent && t.parent.isFork;
    const canFork = sum < desired && opts.length >= 2 && t.depth >= 2 && !parentIsFork;
    let branch = 1;
    if (canFork) { branch = 2; sum += 1; }
    else if (sum >= desired) {
      const onBorder = t.r === 0 || t.c === 0 || t.r === R - 1 || t.c === C - 1;
      if (onBorder || rng() < 0.32) { t.kind = 'station'; stations.push(t); continue; }
    }
    const chosen = opts.sort(() => rng() - 0.5).slice(0, branch);
    for (const d of chosen) {
      const nr = t.r + DIRV[d][0], nc = t.c + DIRV[d][1];
      const n = mk(nr, nc); n.depth = t.depth + 1; visited[nr][nc] = true; n.parent = t; t.children.push(n); tips.push(n); all.push(n);
    }
    if (branch === 2) { t.isFork = true; forks.push(t); }
  }
  // any leftover childless track → station
  for (const n of all) if (n.kind === 'track' && n.children.length === 0) { n.kind = 'station'; stations.push(n); }
  const colors = [...PAL].sort(() => rng() - 0.5);
  stations.forEach((s, i) => { s.colorHex = colors[i % colors.length]; });
  return { root, all, forks, stations };
}

function TrainSwitchEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppTrains = mode === 'passplay' ? (attempt?.trials || PP_TRAINS) : 0;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const gRef = useRef(null);
  const finishedRef = useRef(false);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [hud, setHud] = useState({ routed: 0, lives: 0 });
  const [msg, setMsg] = useState('');

  const cfg = useMemo(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return levelCfg('med', 1);
    return levelCfg('easy', 1);
  }, [mode, diff, level]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const g = gRef.current;
    if (mode === 'free') { setOver({ score: g.routed }); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.routed >= cfg.target;
      onResult({ won, score: g.routed, summary: isAr ? `وصل ${g.routed}/${cfg.target}` : `Delivered ${g.routed}/${cfg.target}` });
    } else onResult({ score: g.routed });
  }, [mode, cfg.target, onResult, isAr, playSfx]);

  const tapAt = useCallback((clientX, clientY) => {
    const g = gRef.current; if (!g || finishedRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    let best = null, bestD = 1e9;
    for (const j of g.forks) { const d = Math.hypot(x - j.x, y - j.y); if (d < bestD) { bestD = d; best = j; } }
    if (best && bestD < g.cell * 0.6) { best.sw = best.sw ? 0 : 1; playSfx('click'); }
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rng = makeRng(((seed ?? 1) >>> 0) ^ ((runId * 19349663) >>> 0));
    const net = generate(cfg.R, cfg.C, cfg.stations, rng);

    const g = {
      ...net, R: cfg.R, C: cfg.C, cell: 40,
      trains: [], spawnAcc: -1600, spawned: 0, budget: mode === 'passplay' ? ppTrains : Infinity, t0: performance.now(),
      maxTrains: cfg.maxTrains, cps: cfg.cps, spawnEvery: cfg.spawn, nextStation: net.stations[Math.floor(rng() * net.stations.length)],
      routed: 0, lives: cfg.lives,
      W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    gRef.current = g;
    finishedRef.current = false;
    setMsg(isAr ? 'اضغط المفتاح ◯ عند التفرّع قبل وصول القطار · وجّه كل لون لمحطته' : 'Tap ◯ switches before trains arrive · match each colour to its station');

    const layout = () => {
      const pad = 16;
      g.cell = Math.min((g.W - 2 * pad) / g.C, (g.H - 2 * pad) / g.R);
      const ox = (g.W - g.cell * g.C) / 2, oy = (g.H - g.cell * g.R) / 2;
      for (const n of g.all) { n.x = ox + (n.c + 0.5) * g.cell; n.y = oy + (n.r + 0.5) * g.cell; }
    };

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      g.W = r.width; g.H = r.height;
      canvas.width = Math.round(r.width * g.dpr); canvas.height = Math.round(r.height * g.dpr);
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      layout();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrapRef.current);

    const drawEdge = (a, b, active) => {
      ctx.strokeStyle = active ? RAIL : RAIL_OFF;
      ctx.lineWidth = active ? Math.max(5, g.cell * 0.16) : 3;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (active) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x), L = Math.hypot(b.x - a.x, b.y - a.y);
        const px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2), tie = g.cell * 0.13;
        ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 2;
        for (let d = g.cell * 0.25; d < L; d += g.cell * 0.34) {
          const mx = a.x + Math.cos(ang) * d, my = a.y + Math.sin(ang) * d;
          ctx.beginPath(); ctx.moveTo(mx - px * tie, my - py * tie); ctx.lineTo(mx + px * tie, my + py * tie); ctx.stroke();
        }
      }
    };

    let hudCache = { routed: -1, lives: -1 };
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      let survPct = 1;
      if (mode === 'free') {
        const elapsed = now - g.t0;
        if (elapsed >= SURVIVAL_MS) { finish(); return; }
        survPct = 1 - elapsed / SURVIVAL_MS;
      }
      const speed = g.cps * g.cell * (mode === 'free' ? 1 + survivalRamp(now - g.t0) * 0.9 : 1); // px/s

      // spawn (keep tunnel exit clear so the first fork can be pre-set)
      g.spawnAcc += dt * 1000;
      const leadBusy = g.trains.some((t) => t.from === g.root && t.t < 0.5);
      if (g.spawnAcc >= g.spawnEvery && g.spawned < g.budget && g.trains.length < g.maxTrains && !leadBusy) {
        g.spawnAcc = 0; g.spawned += 1;
        const target = g.nextStation.colorHex;
        g.nextStation = g.stations[Math.floor(rng() * g.stations.length)];
        g.trains.push({ from: g.root, to: g.root.children[0], t: 0, target });
      }

      const remaining = [];
      for (const t of g.trains) {
        const len = Math.max(1, Math.hypot(t.to.x - t.from.x, t.to.y - t.from.y));
        t.t += (speed * dt) / len;
        if (t.t >= 1) {
          const at = t.to;
          if (at.kind === 'station' || at.children.length === 0) {
            if (at.colorHex === t.target) { g.routed += 1; awardPoints(1); playSfx('collect'); }
            else { g.lives -= 1; playSfx('error'); }
            if (mode === 'levels' && g.routed >= cfg.target) { finish(); return; }
            if ((mode === 'levels' || mode === 'free') && g.lives <= 0) { finish(); return; }
            continue;
          }
          t.from = at; t.to = at.children.length === 2 ? at.children[at.sw] : at.children[0]; t.t = 0;
        }
        remaining.push(t);
      }
      g.trains = remaining;
      if (g.budget !== Infinity && g.spawned >= g.budget && g.trains.length === 0) { finish(); return; }

      // ── draw ──
      ctx.clearRect(0, 0, g.W, g.H);
      if (mode === 'free') drawSurvivalBar(ctx, g.W, survPct, ATT);
      // rails: inactive first, then active on top
      for (const n of g.all) n.children.forEach((c, i) => { const active = n.children.length < 2 || i === n.sw; if (!active) drawEdge(n, c, false); });
      for (const n of g.all) n.children.forEach((c, i) => { const active = n.children.length < 2 || i === n.sw; if (active) drawEdge(n, c, true); });

      // stations
      const sw = g.cell * 0.62;
      for (const s of g.stations) {
        ctx.fillStyle = s.colorHex;
        ctx.beginPath(); ctx.roundRect(s.x - sw / 2, s.y - sw / 2, sw, sw, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.beginPath(); ctx.roundRect(s.x - sw * 0.28, s.y - sw * 0.28, sw * 0.56, sw * 0.18, 3); ctx.fill();
      }

      // tunnel
      ctx.fillStyle = '#3a3328';
      ctx.beginPath(); ctx.arc(g.root.x, g.root.y, g.cell * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = g.nextStation.colorHex; // next-train preview
      ctx.beginPath(); ctx.arc(g.root.x, g.root.y, g.cell * 0.16, 0, Math.PI * 2); ctx.fill();

      // fork switches (circled, lever toward active branch)
      const kr = g.cell * 0.2;
      for (const j of g.forks) {
        const c = j.children[j.sw];
        const ang = Math.atan2(c.y - j.y, c.x - j.x);
        ctx.strokeStyle = ATT; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(j.x, j.y); ctx.lineTo(j.x + Math.cos(ang) * (kr + 5), j.y + Math.sin(ang) * (kr + 5)); ctx.stroke();
        ctx.fillStyle = '#fffdf8'; ctx.strokeStyle = ATT; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(j.x, j.y, kr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      // trains
      const tw = g.cell * 0.34, tl = g.cell * 0.5;
      for (const t of g.trains) {
        const x = t.from.x + (t.to.x - t.from.x) * t.t, y = t.from.y + (t.to.y - t.from.y) * t.t;
        const ang = Math.atan2(t.to.y - t.from.y, t.to.x - t.from.x);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.fillStyle = t.target;
        ctx.beginPath(); ctx.roundRect(-tl / 2, -tw / 2, tl, tw, 5); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.roundRect(tl * 0.1, -tw * 0.28, tl * 0.28, tw * 0.56, 2); ctx.fill();
        ctx.restore();
      }

      if (g.routed !== hudCache.routed || g.lives !== hudCache.lives) { hudCache = { routed: g.routed, lives: g.lives }; setHud(hudCache); }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, seed]);

  const restart = () => { setOver(null); finishedRef.current = false; setRunId((n) => n + 1); };

  const S = styles;
  const showLives = mode !== 'passplay';
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.routed}/${cfg.target}` : `Lvl ${level} · ${hud.routed}/${cfg.target}`)
    : (isAr ? `وصل ${hud.routed}` : `Delivered ${hud.routed}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'تبديل المسار' : 'Train Switch'}</div>
          <div className="ct-training-play-sub">{head}{showLives ? ` · ${'♥'.repeat(Math.max(0, hud.lives))}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} onPointerDown={(e) => { e.preventDefault(); tapAt(e.clientX, e.clientY); }} style={{ display: 'block', touchAction: 'none' }} />
        {msg && !over && <div style={S.msg}>{msg}</div>}
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `وصل ${over.score}` : `Delivered ${over.score}`}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button style={S.overBtn} onClick={() => { playSfx('click'); restart(); }}>{isAr ? 'العب مجدداً' : 'Play again'}</button>
                <button style={{ ...S.overBtn, background: '#cdbfa6' }} onClick={() => { playSfx('click'); onExit?.(); }}>{isAr ? 'القائمة' : 'Menu'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrainSwitchGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_att_trainswitch"
      scienceId="train-switch"
      title={{ en: 'Train Switch', ar: 'تبديل المسار' }}
      hints={{
        free: { en: 'Route the trains — endless, with lives', ar: 'وجّه القطارات — مفتوح، مع أرواح' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same map for all · pass the device', ar: 'نفس الخريطة للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRAINS, scoreLabel: { en: 'delivered', ar: 'وصل' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <TrainSwitchEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  play: { position: 'relative', flex: 1, overflow: 'hidden' },
  msg: { position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center', fontWeight: 700, color: '#7a5a1e', pointerEvents: 'none', padding: '0 16px' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#7a5a1e' },
  overBtn: { flex: 1, padding: '15px 16px', fontWeight: 900, fontSize: 16, color: '#fff', background: ATT, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
};
