import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
// SAME game as 2D free mode: real pair generation, counts, timings + adaptive ramp.
import { palFreeCfg, buildPalTrial, STUDY_GAP } from './index';
import '../../../../shared/c3dProto.css';

/*
 * Pair Match (Paired Associates / CANTAB PAL) · 3D prototype
 * Study phase: boxes open one at a time to reveal the symbol hidden inside.
 * Recall phase: a cue symbol floats above and you tap the box where it lived.
 * Uses the exact 2D palFreeCfg + buildPalTrial (same pair counts, study times and
 * adaptive pairs-grow-on-perfect progression).
 */

const UI = {
  en: {
    title: 'Pair Match · 3D',
    tag: 'prototype',
    memorize: 'Memorize the locations…',
    where: 'Where was this symbol?',
    perfect: 'Perfect ✓',
    partial: (c, n) => `${c}/${n} correct`,
    go: 'ENGAGE',
    hub: 'Back to modes',
    pairs: 'Pairs',
    best: 'best',
  },
  ar: {
    title: 'مطابقة الأزواج · ثلاثي الأبعاد',
    tag: 'نموذج',
    memorize: 'احفظ المواقع…',
    where: 'أين كان هذا الرمز؟',
    perfect: 'ممتاز ✓',
    partial: (c, n) => `${c}/${n} صحيحة`,
    go: 'انطلق',
    hub: 'العودة للأوضاع',
    pairs: 'أزواج',
    best: 'أفضل',
  },
};

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Card face showing a glyph (symbol / ? / ✕) → CanvasTexture. */
function glyphTexture(txt, fg, bg) {
  const S = 160;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bg;
  roundRectPath(ctx, 8, 8, S - 16, S - 16, 20);
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(90,70,40,0.32)';
  ctx.stroke();
  ctx.fillStyle = fg;
  ctx.font = '84px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, S / 2, S / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function PairedAssociates3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | study | recall | feedback
  const [instr, setInstr] = useState('');
  const [pairs, setPairs] = useState(2);
  const [best, setBest] = useState(2);
  const [trialProg, setTrialProg] = useState('');
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.2, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitBox, renderer, dispose } = boot;

    // Texture cache
    const texCache = new Map();
    const getTex = (key, txt, fg, bg) => {
      if (!texCache.has(key)) texCache.set(key, glyphTexture(txt, fg, bg));
      return texCache.get(key);
    };
    const qTex = getTex('q', '?', '#e8ac4e', '#241d13');

    // 6 boxes on a 3×2 grid (free mode is always 6 boxes) — chunky treasure
    // chests you memorise. The number badge on each helps recall spatially.
    const N = 6;
    const cols = 3;
    const rows = 2;
    const BOX = coarse ? 1.28 : 1.34;
    const gapX = BOX + (coarse ? 0.42 : 0.5);
    const gapY = BOX + (coarse ? 0.5 : 0.58);
    const boxes = [];
    for (let i = 0; i < N; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const g = new THREE.Group();
      const side = matStd(0x3a2f1e, { emissive: 0x241a0c, emissiveIntensity: 0.25, metalness: 0.35, roughness: 0.55 });
      const face = new THREE.MeshStandardMaterial({
        map: qTex, emissive: new THREE.Color(0xe8ac4e), emissiveIntensity: 0.2, metalness: 0.2, roughness: 0.55,
      });
      const box = new THREE.Mesh(new THREE.BoxGeometry(BOX, BOX, 0.42), [side, side, side, side, face, side]);
      g.add(box);
      // Glow pad behind each box → reads as a placed slot on the deck.
      const pad = new THREE.Mesh(
        new THREE.CircleGeometry(BOX * 0.78, 28),
        new THREE.MeshBasicMaterial({ color: 0xe8ac4e, transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      pad.position.z = -0.24;
      g.add(pad);
      const homeY = ((rows - 1) / 2 - row) * gapY - 0.2;
      g.position.set((col - (cols - 1) / 2) * gapX, homeY, 0);
      g.userData.idx = i;
      g.userData.faceMat = face;
      g.userData.box = box;
      g.userData.flash = 0;
      g.userData.reveal = 0; // 0 = closed, →1 = lifted/open
      g.userData.homeY = homeY;
      g.userData.symbol = null;
      playRoot.add(g);
      boxes.push(g);
    }

    // Floating cue card (recall phase) above the grid.
    const cueSide = matStd(0x1d1811, { metalness: 0.2, roughness: 0.6 });
    const cueFace = new THREE.MeshStandardMaterial({ map: qTex, emissive: new THREE.Color(0xe8ac4e), emissiveIntensity: 0.4, metalness: 0.15, roughness: 0.5 });
    const cueCard = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.26), [cueSide, cueSide, cueSide, cueSide, cueFace, cueSide]);
    const cueY = (rows / 2) * gapY + 0.5;
    cueCard.position.set(0, cueY, 0.4);
    cueCard.visible = false;
    playRoot.add(cueCard);

    // Fit width to the 3-wide grid, height to include the recall cue on top.
    const halfX = (cols - 1) / 2 * gapX + BOX * 0.7 + 0.3;
    const halfY = cueY + 0.9;
    setFitBox(halfX, halfY);

    const symTex = (sym) => getTex(`s${sym}`, sym, '#3a2c18', '#fff6df');

    // ── Game state (mirrors 2D free) ──
    let rngSeed = (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
    let pairsN = 2;
    let bestN = 2;
    let trial = null;
    let cueIdx = 0;
    let correctT = 0;
    let totalT = 0;
    let gamePhase = 'study';
    let finished = false;
    const timers = [];
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };

    const setFace = (mesh, tex) => { mesh.userData.faceMat.map = tex; mesh.userData.faceMat.needsUpdate = true; };
    const resetFaces = () => boxes.forEach((m) => { setFace(m, qTex); m.userData.revealing = false; });

    const finishTrial = () => {
      const perfect = correctT === totalT;
      gamePhase = 'feedback';
      setPhase('feedback');
      if (perfect) { playSfxRef.current?.('win'); setInstr(t.perfect); }
      else { playSfxRef.current?.('lose'); setInstr(t.partial(correctT, totalT)); }
      // 2D free rule: pairs +1 on perfect / −1 (min 2) otherwise; palFreeCfg
      // caps the effective count at 6. No score in free mode — best pairs only.
      pairsN = perfect ? pairsN + 1 : Math.max(2, pairsN - 1);
      later(() => { if (!finished) newTrial(); }, 1300);
    };

    const presentCue = () => {
      if (cueIdx >= trial.cueOrder.length) { finishTrial(); return; }
      gamePhase = 'recall';
      setPhase('recall');
      const cur = trial.cueOrder[cueIdx];
      setFace(cueCard, symTex(cur.symbol));
      cueCard.visible = true;
      setInstr(t.where);
      setTrialProg(`${cueIdx + 1}/${totalT}`);
    };

    function newTrial() {
      clearTimers();
      resetFaces();
      cueCard.visible = false;
      const cfg = palFreeCfg(pairsN);
      bestN = Math.max(bestN, cfg.pairs);
      setPairs(cfg.pairs);
      setBest(bestN);
      const rng = makeRng((rngSeed += 7919) >>> 0);
      trial = buildPalTrial({ boxes: N, pairs: cfg.pairs }, rng);
      boxes.forEach((m, i) => { m.userData.symbol = trial.boxes[i].symbol; });
      cueIdx = 0; correctT = 0; totalT = trial.total;
      gamePhase = 'study';
      setPhase('study');
      setInstr(t.memorize);
      setTrialProg('');
      // Reveal each item-box one at a time.
      const studyOrder = trial.studyOrder;
      const step = (k) => {
        if (finished) return;
        if (k >= studyOrder.length) { later(presentCue, 320); return; }
        const bi = studyOrder[k];
        const m = boxes[bi];
        // Open: reveal the symbol, lift the lid toward you, glow gold.
        setFace(m, symTex(m.userData.symbol));
        m.userData.revealing = true;
        m.userData.flash = 0.6;
        m.userData.flashHex = 0xe8ac4e;
        later(() => {
          setFace(m, qTex);
          m.userData.revealing = false;
          later(() => step(k + 1), STUDY_GAP);
        }, cfg.study);
      };
      later(() => step(0), 500);
    }

    const tap = (idx) => {
      if (gamePhase !== 'recall' || finished) return;
      const cur = trial.cueOrder[cueIdx];
      const ok = idx === cur.boxIdx;
      const m = boxes[idx];
      if (ok) {
        correctT += 1;
        setFace(m, symTex(cur.symbol));
        m.userData.revealing = true;
        m.userData.flash = 0.6; m.userData.flashHex = 0x62b277;
        playSfxRef.current?.('correct');
      } else {
        const correctMesh = boxes[cur.boxIdx];
        setFace(correctMesh, symTex(cur.symbol));
        correctMesh.userData.revealing = true;
        correctMesh.userData.flash = 0.6; correctMesh.userData.flashHex = 0x62b277;
        m.userData.revealing = true;
        m.userData.flash = 0.6; m.userData.flashHex = 0xd23b3b;
        playSfxRef.current?.('wrong');
      }
      cueIdx += 1;
      cueCard.visible = false;
      gamePhase = 'feedback';
      setPhase('feedback');
      later(() => { resetFaces(); presentCue(); }, ok ? 480 : 850);
    };

    // Pointer
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    const resolve = (cx, cy) => {
      const rect = el.getBoundingClientRect();
      ptr.x = ((cx - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(boxes, true);
      if (hits.length) {
        let o = hits[0].object;
        while (o && o.userData.idx === undefined && o.parent) o = o.parent;
        if (o && o.userData.idx !== undefined) return o.userData.idx;
      }
      let best2 = -1;
      let bestD = coarse ? 0.16 : 0.1;
      for (const m of boxes) {
        tmp.copy(m.position).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best2 = m.userData.idx; }
      }
      return best2;
    };
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const idx = resolve(e.clientX, e.clientY);
      if (idx >= 0) tap(idx);
    };
    el.addEventListener('pointerup', onUp);

    setTick((dt, now) => {
      cueCard.rotation.y = Math.sin(now * 0.0018) * 0.18;
      cueCard.position.y = cueY + Math.sin(now * 0.0022) * 0.06;
      for (const m of boxes) {
        const ud = m.userData;
        // Lift/scale the box when open (study reveal / recall feedback).
        const target = ud.revealing ? 1 : 0;
        ud.reveal += (target - ud.reveal) * Math.min(1, dt * 11);
        ud.box.position.z = ud.reveal * 0.6;
        ud.box.scale.setScalar(1 + ud.reveal * 0.14);
        if (ud.flash > 0) {
          ud.flash = Math.max(0, ud.flash - dt);
          ud.faceMat.emissive.setHex(ud.flashHex || 0xe8ac4e);
          ud.faceMat.emissiveIntensity = 0.2 + ud.flash;
        } else {
          ud.faceMat.emissiveIntensity = ud.reveal > 0.02 ? 0.15 : 0.2;
        }
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        pairsN = 2; bestN = 2;
        setPairs(2); setBest(2);
        setRunning(true);
        newTrial();
      },
      stop: () => { finished = true; clearTimers(); },
    };

    return () => {
      finished = true;
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      boxes.forEach((m) => { disposeObject(m); playRoot.remove(m); });
      disposeObject(cueCard);
      playRoot.remove(cueCard);
      texCache.forEach((tx) => tx.dispose());
      texCache.clear();
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
    `${t.pairs} ${pairs}`,
    `${t.best} ${best}`,
    trialProg,
  ].filter(Boolean);

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={running ? instr : t.memorize}
      chip={phase === 'recall' ? (isAr ? 'استرجاع' : 'Recall') : (isAr ? 'حفظ' : 'Study')}
      chipStyle={{ fontSize: '0.7rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'go' ? t.go : null}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
    />
  );
}
