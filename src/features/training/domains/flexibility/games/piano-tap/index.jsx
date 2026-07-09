import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { SURVIVAL_MS, survivalRamp, GRADE, drawSurvivalBar } from '../../../../shared/survival';
import { startCanvasLoop } from '../../../../shared/canvasLoop';

/*
 * Piano Tap — processing speed + response inhibition (Piano/Magic Tiles style).
 * Tiles fall down 4 lanes; tap each tile's lane as fast as you can — every correct
 * tap plays the next melody note. Tapping an EMPTY lane (inhibition) or letting a
 * tile fall off the bottom costs a life. It speeds up as you go.
 * Modes: Free (lives) / Levels (100) / Pass n Play (fixed tiles, score).
 */

const SPD = '#64b5c2';
const LANES = 4;
const KEYS = ['d', 'f', 'j', 'k'];
const MELODY = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99, 1046.5];

const BASE = {
  easy: { speed: 230, spawn: 720, lives: 5, target: 24 },
  med: { speed: 300, spawn: 600, lives: 4, target: 34 },
  hard: { speed: 380, spawn: 500, lives: 3, target: 44 },
};
function levelCfg(diff, level) {
  const b = BASE[diff] || BASE.med;
  const f = ((level || 1) - 1) / 99;
  return { ...b, speed: b.speed + f * 260, spawn: Math.max(300, b.spawn - f * 280), target: b.target + Math.round(f * 30) };
}
const PP_TILES = 30;

function PianoTapEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const ppTiles = mode === 'passplay' ? (attempt?.trials || PP_TILES) : 0;
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const rafRef = useRef(0);
  const gRef = useRef(null);
  const finishedRef = useRef(false);
  const acRef = useRef(null);
  const noteRef = useRef(0);

  const [runId, setRunId] = useState(0);
  const [over, setOver] = useState(null);
  const [hud, setHud] = useState({ hits: 0, lives: 0, combo: 0, score: 0 });

  const cfg = useMemo(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return levelCfg('med', 1);
    return levelCfg('easy', 1);
  }, [mode, diff, level]);

  const playNote = useCallback(() => {
    try {
      let ac = acRef.current;
      if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); acRef.current = ac; }
      if (ac.state === 'suspended') ac.resume();
      const freq = MELODY[noteRef.current % MELODY.length]; noteRef.current += 1;
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = 'triangle'; o.frequency.value = freq;
      o.connect(gn); gn.connect(ac.destination);
      const t = ac.currentTime;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.start(t); o.stop(t + 0.34);
    } catch { /* ignore */ }
  }, []);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    cancelAnimationFrame(rafRef.current);
    const g = gRef.current;
    if (mode === 'free') { setOver({ score: g.score, tiles: g.hits }); playSfx('error'); return; }
    if (mode === 'levels') {
      const won = g.hits >= cfg.target;
      onResult({ won, score: g.hits, summary: isAr ? `${g.hits}/${cfg.target} نقرة` : `${g.hits}/${cfg.target} tiles` });
    } else onResult({ score: g.hits });
  }, [mode, cfg.target, onResult, isAr, playSfx]);

  const tapLane = useCallback((lane) => {
    const g = gRef.current; if (!g || finishedRef.current) return;
    // hit the lowest unhit tile in this lane that is on screen
    let target = null;
    for (const tile of g.tiles) {
      if (tile.lane === lane && !tile.hit && tile.y > -g.tileH) {
        if (!target || tile.y > target.y) target = tile;
      }
    }
    if (target) {
      target.hit = true; target.fade = 1;
      g.hits += 1; g.combo += 1; if (g.combo > g.bestCombo) g.bestCombo = g.combo;
      awardPoints(1); playNote();
      if (mode === 'free') {
        // Survival: grade by how close the tile was to the hit line (on-beat) and
        // bonus-scale with combo, so faster, tighter play scores more.
        const center = target.y + g.tileH / 2;
        const d = Math.abs((g.H - 10) - center);
        const grade = d <= g.tileH * 0.55 ? 'perfect' : d <= g.tileH * 1.3 ? 'fast' : 'good';
        const gd = GRADE[grade];
        g.score += gd.bonus * (1 + Math.floor(g.combo / 10));
        g.gradeFx = { label: isAr ? gd.ar : gd.en, color: gd.color, until: performance.now() + 480 };
      } else {
        g.speed += 1.5;
      }
      if (mode === 'levels' && g.hits >= cfg.target) { finish(); return; }
    } else {
      // tapped an empty lane → inhibition error
      g.combo = 0; g.lives -= 1; playSfx('error');
      if ((mode === 'levels' || mode === 'free') && g.lives <= 0) finish();
    }
  }, [mode, cfg.target, awardPoints, playNote, playSfx, finish]);

  useEffect(() => {
    const onKey = (e) => { const i = KEYS.indexOf(e.key.toLowerCase()); if (i >= 0) { e.preventDefault(); tapLane(i); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tapLane]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rng = makeRng(((seed ?? 1) >>> 0) ^ ((runId * 22695477) >>> 0));
    noteRef.current = 0;

    const g = {
      tiles: [], spawnAcc: 0, spawned: 0, speed: cfg.speed, spawnEvery: cfg.spawn,
      budget: mode === 'passplay' ? ppTiles : Infinity, lastLane: -1,
      hits: 0, lives: cfg.lives, combo: 0, bestCombo: 0,
      t0: performance.now(), score: 0, gradeFx: null,
      tileH: 0, W: 0, H: 0, dpr: Math.min(window.devicePixelRatio || 1, 2),
    };
    gRef.current = g;
    finishedRef.current = false;

    const resize = () => {
      const r = wrapRef.current.getBoundingClientRect();
      g.W = r.width; g.H = r.height;
      canvas.width = Math.round(r.width * g.dpr); canvas.height = Math.round(r.height * g.dpr);
      canvas.style.width = r.width + 'px'; canvas.style.height = r.height + 'px';
      ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
      g.tileH = Math.min(g.H * 0.22, 150);
    };

    const laneX = (i) => (i / LANES) * g.W;
    const laneW = () => g.W / LANES;

    let hudCache = { hits: -1, lives: -1, combo: -1, score: -1 };
    const frame = (dt, now) => {
      let timePct = 1;
      if (mode === 'free') {
        const elapsed = now - g.t0;
        if (elapsed >= SURVIVAL_MS) { finish(); return false; }
        timePct = 1 - elapsed / SURVIVAL_MS;
        g.speed = cfg.speed * (1 + survivalRamp(elapsed) * 1.3);
      }

      // spawn one tile per interval, never twice the same lane in a row
      g.spawnAcc += dt * 1000;
      if (g.spawnAcc >= g.spawnEvery && g.spawned < g.budget) {
        g.spawnAcc = 0; g.spawned += 1;
        let lane = Math.floor(rng() * LANES);
        if (lane === g.lastLane) lane = (lane + 1 + Math.floor(rng() * (LANES - 1))) % LANES;
        g.lastLane = lane;
        g.tiles.push({ lane, y: -g.tileH, hit: false, fade: 0 });
      }

      const remaining = [];
      for (const tile of g.tiles) {
        if (!tile.hit) tile.y += g.speed * dt;
        if (!tile.hit && tile.y > g.H) {
          // missed a tile
          g.combo = 0; g.lives -= 1; playSfx('error');
          if ((mode === 'levels' || mode === 'free') && g.lives <= 0) { finish(); return false; }
          continue;
        }
        if (tile.hit) { tile.fade -= dt * 3; if (tile.fade <= 0) continue; }
        remaining.push(tile);
      }
      g.tiles = remaining;
      if (g.budget !== Infinity && g.spawned >= g.budget && g.tiles.length === 0) { finish(); return false; }

      // ── draw ──
      ctx.clearRect(0, 0, g.W, g.H);
      for (let i = 1; i < LANES; i++) {
        ctx.strokeStyle = 'rgba(0,0,0,0.06)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(laneX(i), 0); ctx.lineTo(laneX(i), g.H); ctx.stroke();
      }
      const hitLine = g.H - 10;
      ctx.strokeStyle = 'rgba(100,181,194,0.5)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, hitLine); ctx.lineTo(g.W, hitLine); ctx.stroke();
      for (const tile of g.tiles) {
        const x = laneX(tile.lane) + 4;
        if (tile.hit) ctx.fillStyle = `rgba(100,181,194,${Math.max(0, tile.fade) * 0.6})`;
        else ctx.fillStyle = '#2b3a3d';
        ctx.beginPath(); ctx.roundRect(x, tile.y, laneW() - 8, g.tileH - 6, 10); ctx.fill();
      }

      if (mode === 'free') drawSurvivalBar(ctx, g.W, timePct, SPD);
      if (g.gradeFx && now < g.gradeFx.until) {
        ctx.globalAlpha = Math.max(0, (g.gradeFx.until - now) / 480);
        ctx.fillStyle = g.gradeFx.color;
        ctx.font = '900 30px Outfit, system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(g.gradeFx.label, g.W / 2, g.H * 0.28);
        ctx.globalAlpha = 1;
      }

      if (g.hits !== hudCache.hits || g.lives !== hudCache.lives || g.combo !== hudCache.combo || g.score !== hudCache.score) {
        hudCache = { hits: g.hits, lives: g.lives, combo: g.combo, score: g.score }; setHud(hudCache);
      }
      // lane key hints
      ctx.font = '800 13px Outfit, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(90,74,50,0.55)';
      ctx.textAlign = 'center';
      for (let i = 0; i < LANES; i++) {
        ctx.fillText(KEYS[i].toUpperCase(), laneX(i) + laneW() / 2, g.H - 6);
      }
    };
    return startCanvasLoop({ wrap: wrapRef.current, rafRef, resize, frame });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, seed]);

  useEffect(() => () => { try { acRef.current?.close(); } catch { /* ignore */ } }, []);

  const restart = () => { setOver(null); finishedRef.current = false; setRunId((n) => n + 1); };

  const onTap = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    tapLane(Math.floor(((e.clientX - rect.left) / rect.width) * LANES));
  };

  const S = styles;
  const showLives = mode !== 'passplay';
  const head = mode === 'levels'
    ? (isAr ? `مستوى ${level} · ${hud.hits}/${cfg.target}` : `Lvl ${level} · ${hud.hits}/${cfg.target}`)
    : mode === 'free'
      ? (isAr ? `نقاط ${hud.score}` : `Score ${hud.score}`)
      : (isAr ? `نقرات ${hud.hits}` : `Tiles ${hud.hits}`);

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label="Menu" onClick={() => { playSfx('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{isAr ? 'عزف سريع' : 'Piano Tap'}</div>
          <div className="ct-training-play-sub">{head}{showLives ? ` · ${'♥'.repeat(Math.max(0, hud.lives))}` : ''}{hud.combo > 2 ? ` · 🔥${hud.combo}` : ''}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      <div ref={wrapRef} style={S.play}>
        <canvas ref={canvasRef} onPointerDown={onTap} style={{ display: 'block', touchAction: 'none' }} />
        {over && (
          <div style={S.overWrap}>
            <div style={S.overCard}>
              <div style={S.overTitle}>{isAr ? 'انتهت اللعبة' : 'Game Over'}</div>
              <div style={S.overScore}>{isAr ? `النقاط ${over.score} · ${over.tiles} نقرة` : `Score ${over.score} · ${over.tiles} tiles`}</div>
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

export default function PianoTapGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_spd_pianotap"
      scienceId="piano-tap"
      title={{ en: 'Piano Tap', ar: 'عزف سريع' }}
      hints={{
        free: { en: 'Tap the falling tiles fast — endless, with lives', ar: 'انقر البلاطات الساقطة بسرعة — مفتوح، مع أرواح' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same tiles for all · pass the device', ar: 'نفس البلاطات للجميع · مرّر الجهاز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: PP_TILES, scoreLabel: { en: 'tiles', ar: 'نقرات' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <PianoTapEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const styles = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  play: { position: 'relative', flex: 1, overflow: 'hidden' },
  overWrap: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(45,45,45,0.45)' },
  overCard: { background: '#fffdf8', borderRadius: 20, padding: '22px 26px', textAlign: 'center', boxShadow: '6px 6px 0 #1a1208', border: '2px solid #cdbfa6' },
  overTitle: { fontWeight: 900, fontSize: 24, color: '#2d2d2d' },
  overScore: { marginTop: 6, fontWeight: 700, color: '#3a6a72' },
  overBtn: { flex: 1, padding: '15px 16px', fontWeight: 900, fontSize: 16, color: '#fff', background: SPD, border: 'none', borderRadius: 12, boxShadow: '3px 3px 0 #1a1208', cursor: 'pointer', whiteSpace: 'nowrap' },
};
