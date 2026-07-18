import React, { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { startCanvasLoop } from '../../../../shared/canvasLoop';
import { assetUrl } from '../../../../../../lib/assetUrl';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const CarPark3DProto = lazyWithRetry(() => import('./CarPark3DProto'), 'carpark-3d');

const LOT_URL = assetUrl('Assets/attention/carpark-lot.svg');
const GARAGE_URL = assetUrl('Assets/attention/carpark-garage.svg');
const lotImg = typeof Image !== 'undefined' ? new Image() : null;
const garageImg = typeof Image !== 'undefined' ? new Image() : null;
if (lotImg) { lotImg.decoding = 'async'; lotImg.src = LOT_URL; }
if (garageImg) { garageImg.decoding = 'async'; garageImg.src = GARAGE_URL; }

/*
 * Car Park — Divided Attention & planning (Train-of-Thought style, re-themed).
 * Cars drive out of the garage and wind along a road network laid on a grid.
 * Each branch ends in a colour-matched PARKING bay scattered across the board.
 * At every JUNCTION the player taps the circled control to point the road; you
 * must set the junctions BEFORE a car reaches them so it parks in its colour bay,
 * while several cars share the network. The roads are a grid-embedded routing
 * tree, so every car always has exactly one solvable path.
 * Modes: Free (lives) / Levels (100) / Pass n Play (fixed cars, score).
 */

const ATT = '#e8ac4e';
// Parking-bay / car colours — Okabe-Ito (colour-vision-deficiency safe). Ordered
// most-distinct first (blue · amber · green · vermillion · pink · sky), so easy
// rounds use the four that stay clearly separable even under deuteranopia /
// protanopia (worst-case CIELAB ΔE ≈ 18); the two blues only co-appear at the
// hardest 6-colour level.
const PAL = ['#0072B2', '#E69F00', '#009E73', '#D55E00', '#CC79A7', '#56B4E9'];
const DIRV = { N: [-1, 0], S: [1, 0], W: [0, -1], E: [0, 1] };
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

const clampN = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerpN = (a, b, t) => a + (b - a) * t;

/*
 * DIFFICULTY — grounded in the Train-of-Thought / divided-attention literature
 * (Lumosity Train of Thought; the validated construct is DIVIDED ATTENTION —
 * monitoring & routing several moving targets at once). The dominant lever is
 * therefore the number of CONCURRENT cars (`maxC`); secondary levers are SPEED
 * (`cps`, spawn rate), TRACK COMPLEXITY (`forks`) and DISCRIMINATION (number of
 * colours/bays, kept CVD-separable so difficulty is attentional, not colour
 * confusion). Each lever ramps on its own [start,end] track across the 100
 * levels so the curve is readable and concurrency clearly leads.
 */
// Tiers are differentiated mainly by CONCURRENCY (maxC), anchored on the ~4-object
// divided-attention capacity limit (Pylyshyn & Storm 1988): EASY stays below it
// (1–3 cars), MEDIUM rides it (2–4), HARD pushes past it into overload (3–5),
// where accuracy is known to fall sharply. Colour count (discrimination / spatial
// memory of bays) and track forks are the secondary tier markers; speed is a
// modifier kept within reactable bounds (≥~1 s lead time to the first fork).
const LV = {
  easy: { grid: [5, 6], maxC: [1, 3], colors: [3, 4], forks: [2, 4], cps: [0.65, 0.95], spawn: [2200, 1400], target: [6, 16], lives: 5 },
  med:  { grid: [6, 8], maxC: [2, 4], colors: [4, 5], forks: [3, 6], cps: [0.80, 1.15], spawn: [1900, 1150], target: [8, 20], lives: 4 },
  hard: { grid: [7, 9], maxC: [3, 5], colors: [5, 6], forks: [4, 8], cps: [0.95, 1.40], spawn: [1700, 950],  target: [10, 24], lives: 3 },
};
function levelCfg(diff, level) {
  const b = LV[diff] || LV.med;
  // Front-loaded curve (f^0.85): the climb is felt earlier so adjacent levels
  // feel more distinct; level 1 and 100 are unchanged (no cap/balance change).
  const f = Math.pow(clampN(((level || 1) - 1) / 99, 0, 1), 0.85);
  const grid = Math.round(lerpN(b.grid[0], b.grid[1], f));
  return {
    R: grid, C: grid,
    forks: Math.round(lerpN(b.forks[0], b.forks[1], f)),
    colors: Math.round(lerpN(b.colors[0], b.colors[1], f)),
    maxC: Math.round(lerpN(b.maxC[0], b.maxC[1], f)),
    cps: +lerpN(b.cps[0], b.cps[1], f).toFixed(2),
    spawn: Math.round(lerpN(b.spawn[0], b.spawn[1], f)),
    target: Math.round(lerpN(b.target[0], b.target[1], f)),
    lives: b.lives,
    wave: false,
  };
}

// Survival WAVES: endless escalation. Every wave is a FRESH board (no two look
// alike) and is strictly harder: it always adds a car to clear, and concurrency
// — the divided-attention lever — steps up every 2 waves toward and past the
// ~4-object capacity limit. Speed/complexity ramp alongside; speed is capped so
// it stays reactable.
function waveCfg(wave) {
  const w = wave - 1;
  return {
    R: clampN(5 + Math.floor(w / 3), 5, 9),
    C: clampN(5 + Math.floor(w / 3), 5, 9),
    forks: clampN(2 + Math.floor(w / 2), 2, 8),
    colors: clampN(3 + Math.floor(w / 3), 3, 6),
    cars: 4 + w,                                  // cars to clear (always grows each wave)
    maxC: clampN(1 + Math.floor(w / 2), 1, 5),    // concurrency steps every 2 waves, capped at overload (5)
    cps: +Math.min(1.7, 0.7 + w * 0.05).toFixed(2), // capped so it stays reactable
    spawn: Math.max(900, 2100 - w * 100),
    lives: 4,
    wave: true,
  };
}
const PP_TRAINS = 16;

// build a grid-embedded routing tree (garage → junctions → scattered parking bays)
function generate(R, C, desired, rng, colorCount = 6) {
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
  // Limit to `colorCount` distinct, maximally-distinct colours (PAL is ordered).
  const pool = PAL.slice(0, clampN(colorCount, 2, PAL.length));
  const colors = [...pool].sort(() => rng() - 0.5);
  stations.forEach((s, i) => { s.colorHex = colors[i % colors.length]; });
  return { root, all, forks, stations };
}

function TrainSwitchEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun }) {
  const ppTrains = mode === 'passplay' ? (attempt?.trials || PP_TRAINS) : 0;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const boardRef = useRef(null);
  const rafRef = useRef(0);
  const gRef = useRef(null);
  const finishedRef = useRef(false);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [hud, setHud] = useState({ routed: 0, lives: 0, wave: 1 });
  const [msg, setMsg] = useState('');

  const cfg = useMemo(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return levelCfg('med', 30); // representative mid challenge for all players
    return waveCfg(1); // survival starts at wave 1 and escalates in-engine
  }, [mode, diff, level]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const g = gRef.current;
    const total = g.routed + g.wrong;
    const acc = total ? Math.round((100 * g.routed) / total) : 100;
    const peak = g.peakConc;
    const meanLoad = g.concActiveFrames ? +(g.concSum / g.concActiveFrames).toFixed(1) : 0;
    const metrics = { routed: g.routed, acc, peak, meanLoad, wave: g.wave };
    if (mode === 'free') { setOver({ score: g.routed, metrics }); awardFreeRun?.('trainSwitch', g.peakConc || g.routed); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.routed >= cfg.target;
      onResult({
        won,
        score: g.routed,
        summary: isAr
          ? `ركنت ${g.routed}/${cfg.target} · ${acc}% · ذروة ${peak}`
          : `Parked ${g.routed}/${cfg.target} · ${acc}% · peak ${peak}`,
      });
    } else onResult({ score: g.routed });
  }, [mode, cfg.target, onResult, isAr, playSfx, awardFreeRun]);

  const tapAt = useCallback((clientX, clientY) => {
    const g = gRef.current; if (!g || finishedRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left, y = clientY - rect.top;
    let best = null, bestD = 1e9;
    for (const j of g.forks) { const d = Math.hypot(x - j.x, y - j.y); if (d < bestD) { bestD = d; best = j; } }
    if (best && bestD < g.cell * 0.6) {
      best.sw = best.sw ? 0 : 1;
      best.pulse = 0.35; // soft junction feedback
      playSfx('click');
    }
  }, [playSfx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rng = makeRng(((seed ?? 1) >>> 0) ^ ((runId * 19349663) >>> 0));

    const g = {
      cell: 40, trains: [], spawnAcc: -1400,
      spawned: 0, budget: mode === 'passplay' ? ppTrains : Infinity,
      routed: 0, wrong: 0, lives: cfg.lives,
      isWave: !!cfg.wave, wave: 1, waveCars: cfg.cars || 0, waveSpawned: 0, waveResolved: 0,
      // Divided-attention metric capture: peak & mean CONCURRENT load (a tracking-
      // capacity proxy vs the ~4-object limit) and routing accuracy under that load.
      peakConc: 0, concSum: 0, concActiveFrames: 0,
      banner: null, bannerT: 0, queue: [],
      fx: [], // short-lived park/miss flashes
      W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };

    const layout = () => {
      // Fit to the tree's ACTUAL bounding box (not the nominal R×C grid) so the
      // road network always fills the WHOLE board — no empty quadrants when the
      // tree happened to grow in one corner. Spacing is per-axis (cellW × cellH);
      // drawn elements are sized off g.cell = min(cellW, cellH) (capped) so cars
      // and bays stay proportional even on sparse / lopsided boards.
      const pad = Math.max(6, Math.round(Math.min(g.W, g.H) * 0.03));
      if (!g.all || !g.all.length) return;
      let minR = Infinity, maxR = -Infinity, minC = Infinity, maxC = -Infinity;
      for (const n of g.all) {
        if (n.r < minR) minR = n.r; if (n.r > maxR) maxR = n.r;
        if (n.c < minC) minC = n.c; if (n.c > maxC) maxC = n.c;
      }
      const usedC = Math.max(1, maxC - minC + 1);
      const usedR = Math.max(1, maxR - minR + 1);
      const cellW = (g.W - 2 * pad) / usedC;
      const cellH = (g.H - 2 * pad) / usedR;
      g.cellW = cellW; g.cellH = cellH;
      // Cap element scale so a sparse axis can't produce giant cars/roads.
      g.cell = Math.min(cellW, cellH, Math.min(g.W, g.H) * 0.34);
      const ox = (g.W - cellW * usedC) / 2 - minC * cellW;
      const oy = (g.H - cellH * usedR) / 2 - minR * cellH;
      for (const n of g.all) { n.x = ox + (n.c + 0.5) * cellW; n.y = oy + (n.r + 0.5) * cellH; }
    };

    const shuffleArr = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    // BALANCED car colours: deal from a shuffled bag of the distinct bay colours
    // and refill when empty — so every bay gets cars evenly and the stream never
    // clumps on one colour (a plain random pick did both).
    const drawColor = () => {
      if (!g.colorBag || g.colorBag.length === 0) g.colorBag = shuffleArr([...(g.bayColors || [])]);
      return g.colorBag.pop();
    };

    // Build / rebuild the road network for a given config (used at start and on
    // each new survival wave). Resets in-flight cars and refills the colour queue.
    const installNet = (c) => {
      // ONE distinct colour per bay so a car's colour maps to exactly one bay
      // (no ambiguous duplicate-colour bays). Aim the tree at `want` leaves so the
      // bay count == the colour count; pick the candidate closest to that (and,
      // tie-broken, the fullest board so the roads still fill the space).
      const want = clampN(c.colors, 2, PAL.length);
      const desired = Math.max(1, want - 1); // forks → roughly `want` leaves
      const score = (net) => Math.abs(net.stations.length - want) * 1000 - net.all.length;
      let best = generate(c.R, c.C, desired, rng, want);
      for (let tries = 0; tries < 7; tries++) {
        const alt = generate(c.R, c.C, desired, rng, want);
        if (score(alt) < score(best)) best = alt;
      }
      g.root = best.root; g.all = best.all; g.forks = best.forks; g.stations = best.stations;
      // Assign a unique colour per bay (shuffled). Only repeats if a tree somehow
      // overshoots `want` leaves (rare; capped at the 6-colour palette).
      const palette = shuffleArr(PAL.slice(0, want));
      g.stations.forEach((s, i) => { s.colorHex = palette[i % palette.length]; });
      g.bayColors = [...new Set(g.stations.map((s) => s.colorHex))];
      g.colorBag = [];
      g.R = c.R; g.C = c.C; g.cfgForks = c.forks; g.cfgColors = c.colors;
      g.maxC = c.maxC; g.cps = c.cps; g.spawnEvery = c.spawn;
      g.trains = []; g.spawnAcc = -1400;
      g.queue = [drawColor(), drawColor(), drawColor()];
      layout();
    };
    installNet(cfg);
    gRef.current = g;
    finishedRef.current = false;
    setMsg(isAr ? 'اضغط المفترق ◯ قبل وصول السيارة · اركن كل لون في موقفه' : 'Tap ◯ junctions before cars arrive · park each colour in its spot');

    // The board fills the ENTIRE play area (minus a thin margin so the frame
    // breathes). The grid stretches to fit via per-axis cell spacing in layout().
    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      const margin = 12; // 6px play padding each side
      const W = Math.max(140, Math.floor(r.width - margin));
      const H = Math.max(140, Math.floor(r.height - margin));
      g.W = W; g.H = H;
      if (boardRef.current) { boardRef.current.style.width = W + 'px'; boardRef.current.style.height = H + 'px'; }
      canvas.width = Math.round(W * g.dpr); canvas.height = Math.round(H * g.dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      layout();
    };

    const drawEdge = (a, b, active) => {
      // Road: warm asphalt with dashed centre line (inactive = faint).
      ctx.lineCap = 'round';
      if (active) {
        ctx.strokeStyle = 'rgba(20, 14, 8, 0.28)';
        ctx.lineWidth = Math.max(11, g.cell * 0.42);
        ctx.beginPath(); ctx.moveTo(a.x, a.y + 2); ctx.lineTo(b.x, b.y + 2); ctx.stroke();
      }
      ctx.strokeStyle = active ? '#6a6560' : 'rgba(255,255,255,0.10)';
      ctx.lineWidth = active ? Math.max(9, g.cell * 0.36) : 5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      if (active) {
        ctx.strokeStyle = 'rgba(255,236,150,0.95)';
        ctx.lineWidth = Math.max(1.6, g.cell * 0.04);
        ctx.setLineDash([g.cell * 0.16, g.cell * 0.16]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.setLineDash([]);
      }
    };

    let hudCache = { routed: -1, lives: -1, wave: -1 };
    const frame = (dt, now) => {
      if (g.bannerT > 0) g.bannerT -= dt; // wave banner countdown
      const speed = g.cps * g.cell; // px/s (escalation now comes from waves, not a ramp)

      // spawn — keep the garage exit clear so the first junction can be pre-set.
      // Survival is gated per WAVE (g.waveCars); levels/passplay by budget.
      g.spawnAcc += dt * 1000;
      const leadBusy = g.trains.some((t) => t.from === g.root && t.t < 0.5);
      const waveBudgetOk = g.isWave ? g.waveSpawned < g.waveCars : g.spawned < g.budget;
      if (g.bannerT <= 0 && g.spawnAcc >= g.spawnEvery && waveBudgetOk && g.trains.length < g.maxC && !leadBusy) {
        g.spawnAcc = 0; g.spawned += 1; if (g.isWave) g.waveSpawned += 1;
        const target = g.queue.shift(); g.queue.push(drawColor());
        g.trains.push({ from: g.root, to: g.root.children[0], t: 0, target });
      }

      const remaining = [];
      for (const t of g.trains) {
        const len = Math.max(1, Math.hypot(t.to.x - t.from.x, t.to.y - t.from.y));
        t.t += (speed * dt) / len;
        if (t.t >= 1) {
          const at = t.to;
          if (at.kind === 'station' || at.children.length === 0) {
            if (at.colorHex === t.target) {
              g.routed += 1; awardPoints(1); playSfx('collect');
              g.fx.push({ x: at.x, y: at.y, t: 0.45, ok: true, color: t.target });
            } else {
              g.wrong += 1; g.lives -= 1; playSfx('error');
              g.fx.push({ x: at.x, y: at.y, t: 0.45, ok: false, color: t.target });
            }
            if (g.isWave) g.waveResolved += 1;
            if (mode === 'levels' && g.routed >= cfg.target) { finish(); return false; }
            if ((mode === 'levels' || mode === 'free') && g.lives <= 0) { finish(); return false; }
            continue;
          }
          t.from = at; t.to = at.children.length === 2 ? at.children[at.sw] : at.children[0]; t.t = 0;
        }
        remaining.push(t);
      }
      g.trains = remaining;
      // Sample concurrent load for the divided-attention metrics.
      const conc = g.trains.length;
      if (conc > g.peakConc) g.peakConc = conc;
      if (conc > 0) { g.concSum += conc; g.concActiveFrames += 1; }
      // Survival: wave complete → escalate. Every wave gets a FRESH board and a
      // strictly harder config, so no two waves look or feel the same (the wave
      // banner announces the change). installNet resets cars + colour queue.
      if (g.isWave && g.waveResolved >= g.waveCars && g.trains.length === 0 && g.bannerT <= 0) {
        g.wave += 1;
        const wc = waveCfg(g.wave);
        g.waveCars = wc.cars; g.waveSpawned = 0; g.waveResolved = 0;
        installNet(wc); resize();
        g.banner = isAr ? `الموجة ${g.wave}` : `Wave ${g.wave}`; g.bannerT = 1.6;
        playSfx('win');
      }
      if (g.budget !== Infinity && g.spawned >= g.budget && g.trains.length === 0) { finish(); return false; }

      // ── draw ──
      ctx.clearRect(0, 0, g.W, g.H);
      // Premium lot asset (warm asphalt)
      if (lotImg?.complete && lotImg.naturalWidth > 0) {
        ctx.drawImage(lotImg, 0, 0, g.W, g.H);
      } else {
        const plate = ctx.createLinearGradient(0, 0, 0, g.H);
        plate.addColorStop(0, '#3a342c');
        plate.addColorStop(1, '#221c16');
        ctx.fillStyle = plate;
        ctx.fillRect(0, 0, g.W, g.H);
      }
      // roads: inactive first, then active on top
      for (const n of g.all) n.children.forEach((c, i) => { const active = n.children.length < 2 || i === n.sw; if (!active) drawEdge(n, c, false); });
      for (const n of g.all) n.children.forEach((c, i) => { const active = n.children.length < 2 || i === n.sw; if (active) drawEdge(n, c, true); });

      // parking bays (colour-matched spots, white "P" + soft plate)
      const sw = g.cell * 0.66;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const s of g.stations) {
        ctx.fillStyle = 'rgba(20,14,8,0.35)';
        ctx.beginPath(); ctx.roundRect(s.x - sw / 2 - 2, s.y - sw / 2 + 2, sw + 4, sw + 4, 8); ctx.fill();
        ctx.fillStyle = s.colorHex;
        ctx.beginPath(); ctx.roundRect(s.x - sw / 2, s.y - sw / 2, sw, sw, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = Math.max(2, sw * 0.09);
        ctx.beginPath(); ctx.roundRect(s.x - sw / 2, s.y - sw / 2, sw, sw, 7); ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `900 ${Math.round(sw * 0.58)}px system-ui, sans-serif`;
        ctx.fillText('P', s.x, s.y + sw * 0.03);
      }

      // garage portal asset + colour queue
      {
        const gw = g.cell * 0.95;
        const gh = g.cell * 0.72;
        const gx = g.root.x - gw / 2;
        const gy = g.root.y - gh / 2;
        if (garageImg?.complete && garageImg.naturalWidth > 0) {
          ctx.drawImage(garageImg, gx, gy, gw, gh);
        } else {
          ctx.fillStyle = '#1a1510';
          ctx.strokeStyle = ATT;
          ctx.lineWidth = Math.max(2.5, g.cell * 0.055);
          ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 9); ctx.fill(); ctx.stroke();
        }
      }
      const qn = Math.min(3, g.queue.length);
      const qd = g.cell * 0.20, qgap = g.cell * 0.06;
      const qTotal = qn * qd + (qn - 1) * qgap;
      for (let i = 0; i < qn; i++) {
        ctx.fillStyle = g.queue[i];
        const qx = g.root.x - qTotal / 2 + i * (qd + qgap);
        ctx.globalAlpha = i === 0 ? 1 : 0.6 - i * 0.12;
        ctx.beginPath(); ctx.roundRect(qx, g.root.y - qd / 2, qd, qd, 3); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // junction controls — soft glow + pulse on tap
      const kr = g.cell * 0.28;
      for (const j of g.forks) {
        if (j.pulse > 0) j.pulse = Math.max(0, j.pulse - dt);
        const c = j.children[j.sw];
        const ang = Math.atan2(c.y - j.y, c.x - j.x);
        const pulse = j.pulse || 0;
        ctx.beginPath();
        ctx.arc(j.x, j.y, kr + 5 + pulse * 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232,172,78,${0.12 + pulse * 0.35})`;
        ctx.fill();
        ctx.fillStyle = '#fffdf8';
        ctx.strokeStyle = ATT;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(j.x, j.y, kr, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        const ax = j.x + Math.cos(ang) * kr * 0.55, ay = j.y + Math.sin(ang) * kr * 0.55;
        ctx.fillStyle = ATT;
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(kr * 0.42, 0); ctx.lineTo(-kr * 0.22, -kr * 0.34); ctx.lineTo(-kr * 0.22, kr * 0.34); ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      // cars with soft ground shadow
      const cw = g.cell * 0.34, cl = g.cell * 0.56;
      for (const t of g.trains) {
        const x = t.from.x + (t.to.x - t.from.x) * t.t, y = t.from.y + (t.to.y - t.from.y) * t.t;
        const ang = Math.atan2(t.to.y - t.from.y, t.to.x - t.from.x);
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(20,14,8,0.28)';
        ctx.beginPath(); ctx.ellipse(0, cw * 0.55, cl * 0.42, cw * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.roundRect(-cl * 0.30, -cw * 0.64, cl * 0.24, cw * 0.20, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(-cl * 0.30, cw * 0.44, cl * 0.24, cw * 0.20, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(cl * 0.12, -cw * 0.64, cl * 0.24, cw * 0.20, 2); ctx.fill();
        ctx.beginPath(); ctx.roundRect(cl * 0.12, cw * 0.44, cl * 0.24, cw * 0.20, 2); ctx.fill();
        ctx.fillStyle = t.target;
        ctx.beginPath(); ctx.roundRect(-cl / 2, -cw / 2, cl, cw, 6); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = 'rgba(212,236,255,0.92)';
        ctx.beginPath(); ctx.roundRect(cl * 0.05, -cw * 0.32, cl * 0.26, cw * 0.64, 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,246,205,0.95)';
        ctx.beginPath(); ctx.arc(cl * 0.44, -cw * 0.28, cw * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cl * 0.44, cw * 0.28, cw * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // park / miss flashes
      if (g.fx.length) {
        const next = [];
        for (const fx of g.fx) {
          fx.t -= dt;
          if (fx.t <= 0) continue;
          const u = fx.t / 0.45;
          ctx.save();
          ctx.globalAlpha = u;
          ctx.strokeStyle = fx.ok ? '#009E73' : '#D55E00';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, g.cell * 0.45 * (1.15 - u * 0.4), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
          next.push(fx);
        }
        g.fx = next;
      }

      // wave banner (brief, on wave change)
      if (g.bannerT > 0 && g.banner) {
        ctx.globalAlpha = Math.min(1, g.bannerT / 0.4);
        ctx.fillStyle = 'rgba(45,45,45,0.82)';
        ctx.font = `900 ${Math.round(Math.min(g.W, g.H) * 0.10)}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(g.banner, g.W / 2, g.H * 0.42);
        ctx.globalAlpha = 1;
      }

      if (g.routed !== hudCache.routed || g.lives !== hudCache.lives || g.wave !== hudCache.wave || g.waveResolved !== hudCache.waveDone) {
        hudCache = { routed: g.routed, lives: g.lives, wave: g.wave, waveDone: g.waveResolved, waveTot: g.waveCars };
        setHud(hudCache);
      }
    };
    return startCanvasLoop({ wrap: wrapRef.current, rafRef, resize, frame });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, seed]);

  const restart = () => { setOver(null); finishedRef.current = false; setRunId((n) => n + 1); };

  const S = styles;
  const L = isAr
    ? { parked: 'مركونة', acc: 'الدقة', peak: 'ذروة التزامن', mean: 'متوسط الحمل', wave: 'الموجة',
        note: 'سعة الانتباه الموزّع ≈ ٤ أجسام؛ «ذروة التزامن» هي أكبر عدد سيارات أدرتها معاً.' }
    : { parked: 'Parked', acc: 'Accuracy', peak: 'Peak load', mean: 'Avg load', wave: 'Wave',
        note: 'Divided-attention capacity is ≈4 objects; "peak load" is the most cars you juggled at once.' };
  const showLives = mode !== 'passplay';
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.routed}/${cfg.target}` : `Lvl ${level} · ${hud.routed}/${cfg.target}`)
    : mode === 'free'
      ? (isAr ? `موجة ${hud.wave} · ${hud.waveDone ?? 0}/${hud.waveTot ?? 0} · ركنت ${hud.routed}` : `Wave ${hud.wave} · ${hud.waveDone ?? 0}/${hud.waveTot ?? 0} · Parked ${hud.routed}`)
      : (isAr ? `ركنت ${hud.routed}` : `Parked ${hud.routed}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'موقف السيارات' : 'Car Park'}</div>
          <div className="ct-training-play-sub">{head}{showLives ? ` · ${'♥'.repeat(Math.max(0, hud.lives))}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div ref={wrapRef} style={S.play}>
        {msg && !over && <div style={S.msg}>{msg}</div>}
        <div ref={boardRef} style={S.board}>
          <canvas ref={canvasRef} onPointerDown={(e) => { e.preventDefault(); tapAt(e.clientX, e.clientY); }} style={{ display: 'block', touchAction: 'none' }} />
        </div>
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `ركنت ${over.score}` : `Parked ${over.score}`}</div>
              {over.metrics && (
                <>
                  <div className="ct-fq-rm ct-fq-rm-training ct-fq-assess-grid" style={{ marginTop: 14 }}>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.acc}%</div><div className="ct-fq-rl">{L.acc}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.peak}</div><div className="ct-fq-rl">{L.peak}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.meanLoad}</div><div className="ct-fq-rl">{L.mean}</div></div>
                    <div className="ct-fq-rmi"><div className="ct-fq-rv">{over.metrics.wave}</div><div className="ct-fq-rl">{L.wave}</div></div>
                  </div>
                  <p style={S.overNote}>{L.note}</p>
                </>
              )}
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
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <CarPark3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')} />
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_att_trainswitch"
      scienceId="train-switch"
      title={{ en: 'Car Park', ar: 'موقف السيارات' }}
      hints={{
        free: { en: 'Park cars by colour — escalating waves, lives', ar: 'اركن السيارات حسب اللون — موجات متصاعدة، أرواح' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same lot for all · pass the device', ar: 'نفس الموقف للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TRAINS, scoreLabel: { en: 'parked', ar: 'ركنت' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نموذج · بدّل المسار وأركن السفن الفضائية' : 'Prototype · flip the route & dock spaceships',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('flexibility'),
      }]}
      renderEngine={(p) => (
        <TrainSwitchEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)', fontFamily: "'Outfit', system-ui, sans-serif" },
  play: { position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, boxSizing: 'border-box' },
  board: { position: 'relative', flex: '0 0 auto', borderRadius: 20, background: 'linear-gradient(160deg, #3a342c 0%, #231e18 100%)', boxShadow: '0 14px 36px rgba(45, 32, 18, 0.28), inset 0 0 0 1.5px rgba(232, 172, 78, 0.32)', overflow: 'hidden' },
  msg: { position: 'absolute', top: 8, left: 0, right: 0, zIndex: 2, textAlign: 'center', fontWeight: 700, fontSize: 13, color: '#f0e2c0', textShadow: '0 1px 3px rgba(0,0,0,0.45)', pointerEvents: 'none', padding: '0 16px' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '20px 22px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6', width: 'min(92vw, 380px)', maxHeight: '88%', overflowY: 'auto' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#7a5a1e' },
  overNote: { marginTop: 10, fontSize: 12.5, lineHeight: 1.45, color: '#8a8078', textAlign: 'center' },
  overBtn: { flex: 1, padding: '15px 16px', fontWeight: 900, fontSize: 16, color: '#fff', background: ATT, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
};
