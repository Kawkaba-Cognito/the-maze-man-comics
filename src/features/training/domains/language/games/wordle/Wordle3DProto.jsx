import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
// SAME game as 2D Survival: real grid generator, dictionary + path rules.
import {
  prepareFreeRound,
  trySubmitWord,
  wordFromPath,
  isAdjacent,
  freeWordPoints,
  WORDLE_FREE_LIVES,
} from './wordleData';
import '../../../../shared/c3dProto.css';

/*
 * Letter Link · 3D prototype
 * The REAL Boggle-style word maze: prepareFreeRound(stage, seed, lang) builds the
 * exact same lettered grid the 2D board uses; you trace a path across adjacent
 * letter tiles (drag or tap) and words are validated with the same dictionary via
 * trySubmitWord. Survival progression mirrors 2D free mode: clear the grid → next
 * (harder) stage, time out → lose a life and step down a stage, 0 lives ends it.
 */

const UI = {
  en: {
    title: 'Letter Link · 3D',
    tag: 'prototype',
    hint: 'Trace adjacent letters to spell words. Submit to lock a word.',
    stage: 'Stage',
    words: 'Words',
    submit: 'Submit',
    clear: 'Clear',
    clearBanner: 'Grid clear',
    next: 'Next grid',
    over: 'Run over',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
  },
  ar: {
    title: 'ربط الحروف · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'صِل الحروف المتجاورة لتكوين كلمات. اضغط تأكيد لتثبيت الكلمة.',
    stage: 'مرحلة',
    words: 'كلمات',
    submit: 'تأكيد',
    clear: 'مسح',
    clearBanner: 'اكتملت اللوحة',
    next: 'لوحة جديدة',
    over: 'انتهت المحاولة',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
  },
};

const TILE_BG = 0x1d1811;
const TILE_ACTIVE = 0xe8ac4e;
const TILE_OK = 0x62b277;
const CREAM = '#f0e2c0';

function randSeed() {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}

/** Draw a single letter on a rounded parchment tile → CanvasTexture. */
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function letterTexture(ch) {
  const S = 200;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  // Parchment tile with a soft radial glow so letters pop.
  const grad = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S * 0.7);
  grad.addColorStop(0, '#33291a');
  grad.addColorStop(1, '#1c150d');
  ctx.fillStyle = grad;
  rrect(ctx, 6, 6, S - 12, S - 12, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,172,78,0.85)';
  ctx.lineWidth = 8;
  rrect(ctx, 6, 6, S - 12, S - 12, 26);
  ctx.stroke();
  // big, crisp letter with a subtle shadow
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 128px "Outfit", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText((ch || '').toUpperCase(), S / 2 + 3, S / 2 + 7);
  ctx.fillStyle = CREAM;
  ctx.fillText((ch || '').toUpperCase(), S / 2, S / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function Wordle3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const lang = isAr ? 'ar' : 'en';
  const wrapRef = useRef(null);
  const apiRef = useRef({ loadStage: () => {}, setInteractive: () => {} });

  const [stage, setStage] = useState(0);
  const [lives, setLives] = useState(WORDLE_FREE_LIVES);
  const [foundN, setFoundN] = useState(0);
  const [target, setTarget] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [score, setScore] = useState(0);
  const [draft, setDraft] = useState('');
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);
  const [running, setRunning] = useState(false);

  const roundRef = useRef(null);
  const stageRef = useRef(0);
  const livesRef = useRef(WORDLE_FREE_LIVES);
  const streakRef = useRef(0);
  const scoreRef = useRef(0);
  const timeRef = useRef(60);
  const runningRef = useRef(false);
  const bannerRef = useRef('go');
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;
  const langRef = useRef(lang);
  langRef.current = lang;

  // ── Three.js scene ────────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 50, fitHalf: 4.4, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitHalf, frame, renderer, dispose } = boot;

    let tiles = [];
    let size = 4;
    const textures = [];
    let interactive = false;
    const pathRef = { cur: [] };

    // Path connector line
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(64 * 3), 3));
    const line = new THREE.Line(
      lineGeo,
      new THREE.LineBasicMaterial({ color: TILE_ACTIVE, transparent: true, opacity: 0.9, depthTest: false }),
    );
    line.renderOrder = 5;
    playRoot.add(line);

    const clearTiles = () => {
      for (const tl of tiles) {
        disposeObject(tl.mesh);
        playRoot.remove(tl.mesh);
      }
      tiles = [];
      textures.forEach((tx) => tx.dispose());
      textures.length = 0;
    };

    const loadStage = (round) => {
      clearTiles();
      pathRef.cur = [];
      roundRef.current = round;
      size = round.size;
      const gap = (size <= 4 ? 1.55 : 1.3) * (coarse ? 0.95 : 1);
      const tileScale = (size <= 4 ? 1.16 : 0.98) * (coarse ? 1.04 : 1);
      const origin = -((size - 1) * gap) / 2;
      const boardHalf = Math.abs(origin) + gap * 0.6;

      round.grid.forEach((ch, i) => {
        const col = i % size;
        const row = Math.floor(i / size);
        const faceTex = letterTexture(ch);
        textures.push(faceTex);
        const sideMat = matStd(TILE_BG, { emissive: 0x1a1206, emissiveIntensity: 0.12, metalness: 0.3, roughness: 0.6 });
        const faceMat = new THREE.MeshStandardMaterial({
          map: faceTex,
          emissive: new THREE.Color(TILE_ACTIVE),
          emissiveIntensity: 0,
          metalness: 0.25,
          roughness: 0.55,
        });
        // Box material order: [px, nx, py, ny, pz(front), nz]
        const mats = [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat];
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.92, 0.34), mats);
        mesh.position.set(origin + col * gap, -origin - row * gap, 0);
        mesh.scale.setScalar(0.01);
        mesh.userData.idx = i;
        mesh.userData.faceMat = faceMat;
        mesh.userData.enterT = 0;
        mesh.userData.flash = 0;
        mesh.userData.baseScale = tileScale;
        playRoot.add(mesh);
        tiles.push({ mesh, idx: i, home: mesh.position.clone() });
      });
      setFitHalf(boardHalf);
      frame();
    };

    const setInteractive = (v) => { interactive = v; };

    // ── Pointer path tracing ────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    let dragging = false;
    let moved = false;
    let downIdx = -1;

    const resolveIdx = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      ptr.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(tiles.map((tl) => tl.mesh), false);
      if (hits.length) return hits[0].object.userData.idx;
      // Soft pick — nearest projected tile centre (helps thumbs / drag)
      let best = -1;
      let bestD = coarse ? 0.14 : 0.09;
      for (const tl of tiles) {
        tmp.copy(tl.home).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best = tl.idx; }
      }
      return best;
    };

    const syncDraft = () => setDraft(wordFromPath(pathRef.cur, roundRef.current?.grid || []).toUpperCase());

    const extendPath = (idx, viaDrag) => {
      if (idx < 0) return;
      const prev = pathRef.cur;
      if (prev.length === 0) { pathRef.cur = [idx]; syncDraft(); return; }
      if (prev.includes(idx)) {
        if (prev.length >= 2 && prev[prev.length - 2] === idx) {
          pathRef.cur = prev.slice(0, -1); // backtrack
          syncDraft();
        }
        return;
      }
      const last = prev[prev.length - 1];
      if (isAdjacent(last, idx, size)) {
        pathRef.cur = [...prev, idx];
        playSfxRef.current?.('click');
        syncDraft();
      } else if (!viaDrag) {
        pathRef.cur = [idx]; // tap far away → start a new word
        syncDraft();
      }
    };

    const commit = () => {
      const round = roundRef.current;
      if (!round || pathRef.cur.length === 0) return;
      const out = trySubmitWord(round, pathRef.cur);
      const cells = pathRef.cur.slice();
      pathRef.cur = [];
      syncDraft();
      if (out.ok) {
        for (const ci of cells) {
          const tl = tiles.find((x) => x.idx === ci);
          if (tl) tl.mesh.userData.flash = 0.6;
        }
        streakRef.current += 1;
        scoreRef.current += freeWordPoints(out.pts, streakRef.current);
        setScore(scoreRef.current);
        setFoundN(round.found.length);
        playSfxRef.current?.('collect');
        if (round.complete) apiRef.current.onClear?.();
      } else {
        playSfxRef.current?.('error');
      }
    };
    apiRef.current.commit = commit;
    apiRef.current.clearPath = () => { pathRef.cur = []; syncDraft(); };

    const onDown = (e) => {
      if (!interactive || bannerRef.current) return;
      const idx = resolveIdx(e.clientX, e.clientY);
      if (idx < 0) return;
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      dragging = true;
      moved = false;
      downIdx = idx;
      extendPath(idx, false);
    };
    const onMove = (e) => {
      if (!dragging || !interactive) return;
      const idx = resolveIdx(e.clientX, e.clientY);
      if (idx < 0) return;
      if (idx !== downIdx) moved = true;
      extendPath(idx, true);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      if (moved) commit(); // a drag gesture auto-submits; taps wait for the button
    };
    el.addEventListener('pointerdown', onDown, { passive: false });
    el.addEventListener('pointermove', onMove, { passive: false });
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    // ── Per-frame: enter anim, path highlight, connector line ────────
    setTick((dt) => {
      for (const tl of tiles) {
        const m = tl.mesh;
        const ud = m.userData;
        if (ud.enterT < 1) {
          ud.enterT = Math.min(1, ud.enterT + dt * 2.2);
          const e = 1 - (1 - ud.enterT) ** 3;
          m.scale.setScalar(Math.max(0.01, ud.baseScale * e));
        } else {
          m.scale.setScalar(ud.baseScale);
        }
        const inPath = pathRef.cur.includes(tl.idx);
        if (ud.flash > 0) {
          ud.flash = Math.max(0, ud.flash - dt);
          ud.faceMat.emissive.setHex(TILE_OK);
          ud.faceMat.emissiveIntensity = 0.35 + ud.flash;
        } else {
          ud.faceMat.emissive.setHex(TILE_ACTIVE);
          ud.faceMat.emissiveIntensity = inPath ? 0.75 : 0;
        }
      }
      // Connector line through the current path
      const pos = lineGeo.attributes.position;
      const n = pathRef.cur.length;
      for (let i = 0; i < n && i < 64; i++) {
        const tl = tiles.find((x) => x.idx === pathRef.cur[i]);
        if (tl) pos.setXYZ(i, tl.home.x, tl.home.y, tl.home.z + 0.3);
      }
      lineGeo.setDrawRange(0, n);
      pos.needsUpdate = true;
    });

    apiRef.current.loadStage = loadStage;
    apiRef.current.setInteractive = setInteractive;
    apiRef.current.ready = true;
    if (roundRef.current) loadStage(roundRef.current);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      clearTiles();
      lineGeo.dispose();
      line.material.dispose();
      dispose();
      apiRef.current = { loadStage: () => {}, setInteractive: () => {}, ready: false };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  // ── Round timer (1s ticks, mirrors 2D free mode) ──────────────────
  useEffect(() => {
    if (!running) return undefined;
    const id = window.setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(Math.max(0, timeRef.current));
      if (timeRef.current <= 0) finishRound(false);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // 2D free rule: grids swap in IMMEDIATELY (no ready gate, no "next" button);
  // only the very first run shows the ENGAGE beat. Streak persists across grids.
  const startStage = (stageIndex, { initial = false } = {}) => {
    const round = prepareFreeRound(stageIndex, randSeed(), langRef.current);
    roundRef.current = round;
    stageRef.current = stageIndex;
    timeRef.current = round.timeLeft;
    setStage(stageIndex);
    setTarget(round.targetWords);
    setFoundN(0);
    setTimeLeft(round.timeLeft);
    setDraft('');
    apiRef.current.loadStage(round);
    apiRef.current.clearPath?.();
    playSfxRef.current?.('click');
    if (initial) {
      bannerRef.current = 'go';
      setBanner('go');
      runningRef.current = false;
      setRunning(false);
      apiRef.current.setInteractive(false);
      window.setTimeout(() => {
        bannerRef.current = null;
        setBanner(null);
        runningRef.current = true;
        setRunning(true);
        apiRef.current.setInteractive(true);
      }, 850);
    } else {
      bannerRef.current = null;
      setBanner(null);
      runningRef.current = true;
      setRunning(true);
      apiRef.current.setInteractive(true);
    }
  };

  // Clear (reached target) → ramp straight into the next harder grid (2D rule).
  apiRef.current.onClear = () => {
    playSfxRef.current?.('collect');
    startStage(stageRef.current + 1);
  };

  // Timed out → lose a life, step down a stage; 0 lives ends the run.
  function finishRound(complete) {
    runningRef.current = false;
    setRunning(false);
    apiRef.current.setInteractive(false);
    if (complete) {
      apiRef.current.onClear();
      return;
    }
    livesRef.current = Math.max(0, livesRef.current - 1);
    setLives(livesRef.current);
    playSfxRef.current?.('error');
    if (livesRef.current > 0) {
      const next = Math.max(0, stageRef.current - 1);
      startStage(next);
    } else {
      bannerRef.current = 'over';
      setBanner('over');
    }
  }

  const retry = () => {
    livesRef.current = WORDLE_FREE_LIVES;
    scoreRef.current = 0;
    streakRef.current = 0;
    setLives(WORDLE_FREE_LIVES);
    setScore(0);
    startStage(0, { initial: true });
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => startStage(0, { initial: true }));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = [
    `${t.stage} ${stage + 1}`,
    `${t.words} ${foundN}/${target}`,
    `${Math.ceil(timeLeft)}s`,
    `${'♥'.repeat(lives)}${'♡'.repeat(Math.max(0, WORDLE_FREE_LIVES - lives))}`,
  ];

  const bannerText = banner === 'go' ? t.go
    : banner === 'clear' ? t.clearBanner
      : banner === 'over' ? t.over
        : null;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={t.hint}
      chip={draft || '—'}
      chipStyle={{ fontSize: '0.85rem', fontWeight: 800, color: '#e8ac4e', letterSpacing: '0.08em' }}
      stats={banner === 'go' ? [] : stats}
      banner={bannerText}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? `${score} ${isAr ? 'نقطة' : 'pts'}` : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); retry(); }}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    >
      {running && !banner && (
        <div className="c3d-overlay-actions">
          <button type="button" className="c3d-choice-btn" onClick={() => { playSfx?.('click'); apiRef.current.clearPath?.(); }}>
            {t.clear}
          </button>
          <button type="button" className="c3d-choice-btn" onClick={() => { playSfx?.('click'); apiRef.current.commit?.(); }}>
            {t.submit}
          </button>
        </div>
      )}
    </C3dProtoChrome>
  );
}
