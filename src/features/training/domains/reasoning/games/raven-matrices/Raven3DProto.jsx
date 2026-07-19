import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { createStaircase } from '../../../../shared/staircase';
import { generateMatrix } from './ravenEngine';
import '../../../../shared/c3dProto.css';

/*
 * Raven Matrices · 3D — the REAL 2D free mode, rendered as cosmos cards.
 * The full 3×3 matrix is shown (missing bottom-right cell), options are the
 * engine's real options drawn EXACTLY like the 2D Figure component (shape ×
 * count × colour × rotation × fill on the same POS layout), so every distractor
 * is honest. Free loop matches 2D: 2-down/1-up staircase (max 30), 3 lives,
 * score 6 + level×2 per solve, 420/900ms advance timings.
 */

const UI = {
  en: {
    title: 'Raven Matrices · 3D',
    tag: 'prototype',
    hint: 'Which card completes the pattern? Tap it below.',
    over: 'Run over',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    lvl: 'Level',
  },
  ar: {
    title: 'مصفوفات رافين · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'أي بطاقة تكمل النمط؟ المسها في الأسفل.',
    over: 'انتهت المحاولة',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    lvl: 'مستوى',
  },
};

const LIVES = 3;
// Same glyph layout the 2D Figure component uses (100×100 space).
const POS = { 1: [[50, 50]], 2: [[32, 50], [68, 50]], 3: [[50, 33], [33, 66], [67, 66]], 4: [[34, 34], [66, 34], [34, 66], [66, 66]] };

function drawGlyph(ctx, shape, cx, cy, r, fill, color) {
  ctx.lineWidth = fill === 'solid' ? 2.5 : 3.2;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  const trace = () => {
    ctx.beginPath();
    if (shape === 'circle') {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else if (shape === 'square') {
      ctx.rect(cx - r, cy - r, r * 2, r * 2);
    } else if (shape === 'triangle') {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.lineTo(cx - r, cy + r);
      ctx.closePath();
    } else if (shape === 'diamond') {
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
    } else { // hexagon
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    }
  };
  if (fill === 'solid') {
    trace();
    ctx.fill();
    ctx.stroke();
  } else if (fill === 'half') {
    ctx.globalAlpha = 0.4;
    trace();
    ctx.fill();
    ctx.globalAlpha = 1;
    trace();
    ctx.stroke();
  } else {
    trace();
    ctx.stroke();
  }
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Card face for one figure (or '?' when fig == null) → CanvasTexture. */
function figureTexture(fig, missing = false) {
  const S = 150;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = missing ? '#2a2115' : '#f4ecdd';
  roundRectPath(ctx, 5, 5, S - 10, S - 10, 18);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = missing ? '#b9842f' : 'rgba(90,70,40,0.3)';
  if (missing) ctx.setLineDash([9, 7]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (missing) {
    ctx.fillStyle = '#e8ac4e';
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', S / 2, S / 2 + 4);
  } else if (!fig || fig.count === 0) {
    // Absent figure — the 2D dashed placeholder square.
    ctx.strokeStyle = '#b9842f';
    ctx.globalAlpha = 0.4;
    ctx.setLineDash([8, 6]);
    roundRectPath(ctx, S * 0.31, S * 0.31, S * 0.38, S * 0.38, 6);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  } else {
    const pts = POS[fig.count] || POS[1];
    const r = fig.count >= 3 ? 13 : fig.count === 2 ? 15 : 19;
    const k = S / 100;
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(((fig.rot || 0) * Math.PI) / 180);
    ctx.translate(-S / 2, -S / 2);
    for (const [x, y] of pts) drawGlyph(ctx, fig.shape, x * k, y * k, r * k, fig.fill, fig.color);
    ctx.restore();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cardMesh(fig, { missing = false, size = 1.0 } = {}) {
  const tex = figureTexture(fig, missing);
  const side = matStd(0x1d1811, { metalness: 0.15, roughness: 0.7 });
  const face = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(0x62b277),
    emissiveIntensity: 0,
    metalness: 0.1,
    roughness: 0.65,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, 0.1), [side, side, side, side, face, side]);
  mesh.userData.faceMat = face;
  mesh.userData.faceTex = tex;
  mesh.userData.flash = 0;
  return mesh;
}

export default function Raven3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | play | over
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [level, setLevel] = useState(0);
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.8, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitHalf, renderer, dispose } = boot;

    let gridMeshes = [];
    let optionMeshes = [];
    const clearAll = () => {
      for (const m of [...gridMeshes, ...optionMeshes]) {
        disposeObject(m);
        m.userData.faceTex?.dispose();
        playRoot.remove(m);
      }
      gridMeshes = [];
      optionMeshes = [];
    };

    // ── Free-mode state (mirrors 2D startFree) ──
    let staircase = createStaircase({ nDown: 2, max: 30 });
    let livesN = LIVES;
    let scoreN = 0;
    let solvedN = 0;
    let puzzle = null;
    let lock = true;
    let finished = false;
    const timers = [];
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };

    const layoutPuzzle = () => {
      clearAll();
      const cell = coarse ? 1.14 : 1.2;
      const gridSize = coarse ? 1.02 : 1.08;
      // 3×3 matrix, missing bottom-right
      for (let r = 0; r < 3; r++) {
        for (let c2 = 0; c2 < 3; c2++) {
          const missing = r === 2 && c2 === 2;
          const mesh = cardMesh(missing ? null : puzzle.grid[r][c2], { missing, size: gridSize });
          mesh.position.set((c2 - 1) * cell, 1.55 + (1 - r) * cell, 0);
          playRoot.add(mesh);
          gridMeshes.push(mesh);
        }
      }
      // Options row(s)
      const n = puzzle.options.length;
      const perRow = n <= 4 ? n : Math.ceil(n / 2);
      const gap = coarse ? 1.18 : 1.25;
      const optSize = coarse ? 1.0 : 1.05;
      puzzle.options.forEach((fig, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowLen = row === 0 ? Math.min(n, perRow) : n - perRow;
        const mesh = cardMesh(fig, { size: optSize });
        mesh.position.set((col - (rowLen - 1) / 2) * gap, -1.75 - row * 1.3, 0.1);
        mesh.userData.optIndex = i;
        playRoot.add(mesh);
        optionMeshes.push(mesh);
      });
      setFitHalf(Math.max(4.6, (Math.max(3 * cell, perRow * gap)) / 2 + 1.9));
    };

    const nextTrial = () => {
      if (finished) return;
      const lvl = staircase.level ?? 0;
      setLevel(lvl + 1);
      puzzle = generateMatrix(lvl, (Math.random() * 1e9) | 0);
      layoutPuzzle();
      lock = false;
    };

    const endFree = () => {
      finished = true;
      setPhase('over');
      setBanner('over');
      playSfxRef.current?.('error');
    };

    const pickOption = (idx) => {
      if (lock || finished || !puzzle) return;
      lock = true;
      const ok = idx === puzzle.correctIndex;
      const chosen = optionMeshes.find((m) => m.userData.optIndex === idx);
      const right = optionMeshes.find((m) => m.userData.optIndex === puzzle.correctIndex);
      if (ok) {
        if (chosen) { chosen.userData.flash = 0.8; chosen.userData.flashHex = 0x62b277; }
        playSfxRef.current?.('collect');
        const lvl = staircase.level ?? 0;
        scoreN += 6 + lvl * 2;
        solvedN += 1;
        setScore(scoreN);
        setSolved(solvedN);
        staircase.success();
        later(nextTrial, 420);
      } else {
        if (chosen) { chosen.userData.flash = 0.8; chosen.userData.flashHex = 0xdd7f7a; }
        if (right) { right.userData.flash = 0.8; right.userData.flashHex = 0x62b277; }
        playSfxRef.current?.('error');
        staircase.failure();
        livesN -= 1;
        setLives(livesN);
        if (livesN <= 0) later(endFree, 750);
        else later(nextTrial, 900);
      }
    };

    // ── Pointer ──
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    const resolve = (cx, cy) => {
      const rect = el.getBoundingClientRect();
      ptr.x = ((cx - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(optionMeshes, false);
      if (hits.length) return hits[0].object.userData.optIndex;
      let best = -1;
      let bestD = coarse ? 0.14 : 0.09;
      for (const m of optionMeshes) {
        tmp.copy(m.position).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best = m.userData.optIndex; }
      }
      return best;
    };
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const idx = resolve(e.clientX, e.clientY);
      if (idx >= 0) pickOption(idx);
    };
    el.addEventListener('pointerup', onUp);

    setTick((dt) => {
      for (const m of [...gridMeshes, ...optionMeshes]) {
        const ud = m.userData;
        if (ud.flash > 0) {
          ud.flash = Math.max(0, ud.flash - dt);
          ud.faceMat.emissive.setHex(ud.flashHex || 0x62b277);
          ud.faceMat.emissiveIntensity = ud.flash;
        } else if (ud.faceMat) {
          ud.faceMat.emissiveIntensity = 0;
        }
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        staircase = createStaircase({ nDown: 2, max: 30 });
        livesN = LIVES;
        scoreN = 0;
        solvedN = 0;
        setLives(LIVES);
        setScore(0);
        setSolved(0);
        setPhase('play');
        nextTrial();
      },
      stop: () => { finished = true; clearTimers(); },
    };

    return () => {
      finished = true;
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      clearAll();
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  const startRun = () => {
    playSfx?.('click');
    setBanner(null);
    apiRef.current.start?.();
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => startRun());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : [
    `${t.lvl} ${level}`,
    `✓ ${solved}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    `${'♥'.repeat(Math.max(0, lives))}${'♡'.repeat(Math.max(0, LIVES - lives))}`,
  ];

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={t.hint}
      chip={`${t.lvl} ${level}`}
      chipStyle={{ fontSize: '0.72rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : null}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? `✓ ${solved} · ${score} ${isAr ? 'نقطة' : 'pts'}` : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={startRun}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    />
  );
}
