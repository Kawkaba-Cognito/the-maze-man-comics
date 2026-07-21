import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import { shapeGeometry } from '../../../../shared/c3dShapes';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import {
  buildLegend,
  pickItem,
  freeLegendSize,
  freeItemPoints,
  bankGainMs,
  TIME_BANK,
} from './speedMatchData';
import '../../../../shared/c3dProto.css';

/*
 * Speed Match · 3D — the REAL 2D free mode (SDMT + adaptive time bank).
 * Persistent symbol→digit key rendered as tiles, probe symbol in the middle,
 * digit tiles to answer. One self-calibrating clock exactly like 2D: the bank
 * drains in real time, a correct match returns bankGainMs(keySize) (less as the
 * key grows), a wrong one costs TIME_BANK.penaltyMs, empty bank ends the run.
 * Key grows with freeLegendSize(correct) and REMAPS when it grows, points are
 * freeItemPoints(combo) — all the 2D free-loop rules, none re-derived.
 */

const UI = {
  en: {
    title: 'Speed Match · 3D',
    tag: 'prototype',
    hint: 'Match the symbol to its digit — fast. The clock only refills when you are right.',
    over: 'Out of time',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    key: 'Key',
  },
  ar: {
    title: 'مطابقة السرعة · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'طابق الرمز مع رقمه — بسرعة. الساعة لا تمتلئ إلا حين تصيب.',
    over: 'نفد الوقت',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    key: 'المفتاح',
  },
};

const INK = '#f0e2c0';
const CARD_BG = '#241d13';
const GOLD = '#e8ac4e';

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Digit tile → CanvasTexture. */
function glyphCard(kind, value) {
  const S = 150;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = CARD_BG;
  roundRectPath(ctx, 5, 5, S - 10, S - 10, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,226,192,0.35)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = kind === 'key' ? GOLD : INK;
  ctx.font = '800 84px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), S / 2, S / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function cardMesh(tex, w, h) {
  const side = matStd(0x1d1811, { metalness: 0.15, roughness: 0.7 });
  const face = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color(0x62b277),
    emissiveIntensity: 0,
    metalness: 0.12,
    roughness: 0.6,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.12), [side, side, side, side, face, side]);
  mesh.userData.faceMat = face;
  mesh.userData.faceTex = tex;
  mesh.userData.flash = 0;
  return mesh;
}

export default function SpeedMatch3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | play | over
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [bankSec, setBankSec] = useState(TIME_BANK.startMs / 1000);
  const [keySize, setKeySize] = useState(4);
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);


  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.6, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitBox, renderer, dispose } = boot;

    let keyMeshes = [];
    let digitMeshes = [];
    let probeMesh = null;

    const clearGroup = (arr) => {
      for (const m of arr) {
        m.traverse?.((o) => o.userData?.faceTex?.dispose?.());
        disposeObject(m);
        playRoot.remove(m);
      }
      arr.length = 0;
    };
    const clearProbe = () => {
      if (probeMesh) {
        playRoot.remove(probeMesh);
        probeMesh.material.dispose(); // geometry is the shared shape cache — keep it
        probeMesh = null;
      }
    };

    // ── Game state (mirrors the 2D free loop) ──
    let legend = [];
    let item = null;
    let lastDigit = 0;
    let bank = TIME_BANK.startMs;
    let correctN = 0;
    let comboN = 0;
    let scoreN = 0;
    let finished = true;
    let hudAcc = 0;

    const layoutKey = () => {
      clearGroup(keyMeshes);
      const n = legend.length;
      const gapX = coarse ? 1.02 : 1.08;
      const perRow = n <= 6 ? n : Math.ceil(n / 2);
      legend.forEach((e, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowLen = row === 0 ? Math.min(n, perRow) : n - perRow;
        // Real 3D symbol floating above its digit tile.
        const grp = new THREE.Group();
        const shape = new THREE.Mesh(
          shapeGeometry(e.symbol),
          matStd(0xf0e2c0, { emissive: 0xf0e2c0, emissiveIntensity: 0.22, metalness: 0.3, roughness: 0.5 }),
        );
        shape.scale.setScalar(0.56);
        shape.position.y = 0.36;
        grp.add(shape);
        const digit = cardMesh(glyphCard('key', e.digit), 0.52, 0.52);
        digit.position.y = -0.38;
        grp.add(digit);
        grp.position.set((col - (rowLen - 1) / 2) * gapX, 2.45 - row * 1.5, 0);
        playRoot.add(grp);
        keyMeshes.push(grp);
      });
      // Fit the camera tight to the real content box (key on top, digits below)
      // instead of a fixed 4.2 square — the vertical layout then fills the whole
      // phone screen instead of floating small in a sea of black.
      const digGapX = coarse ? 1.05 : 1.12;
      const digPerRow = n <= 6 ? n : Math.ceil(n / 2);
      const digRows = n <= 6 ? 1 : 2;
      // Vertical: top key symbol (row 0) → bottom digit row.
      const topY = 2.45 + 0.36 + 0.28;                 // key symbol upper edge
      const botY = -1.75 - (digRows - 1) * 1.15 - 0.48; // lowest digit tile edge
      const halfY = Math.max(topY, -botY) + 0.22;
      // Horizontal: widest of the key row and the digit row.
      const keyHalfX = ((Math.min(n, perRow) - 1) * gapX) / 2 + 0.34;
      const digHalfX = ((Math.min(n, digPerRow) - 1) * digGapX) / 2 + 0.55;
      const halfX = Math.max(keyHalfX, digHalfX) + 0.15;
      setFitBox(halfX, halfY);
    };

    const layoutDigits = () => {
      clearGroup(digitMeshes);
      const digits = legend.map((e) => e.digit).sort((a, b) => a - b);
      const gapX = coarse ? 1.05 : 1.12;
      const perRow = digits.length <= 6 ? digits.length : Math.ceil(digits.length / 2);
      digits.forEach((d, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const rowLen = row === 0 ? Math.min(digits.length, perRow) : digits.length - perRow;
        const mesh = cardMesh(glyphCard('digit', d), 0.95, 0.95);
        mesh.position.set((col - (rowLen - 1) / 2) * gapX, -1.75 - row * 1.15, 0);
        mesh.userData.digit = d;
        playRoot.add(mesh);
        digitMeshes.push(mesh);
      });
    };

    const showProbe = () => {
      clearProbe();
      if (!item) return;
      // The probe is the real 3D symbol, big and glowing.
      probeMesh = new THREE.Mesh(
        shapeGeometry(item.symbol),
        matStd(0xf0e2c0, { emissive: 0xe8ac4e, emissiveIntensity: 0.4, metalness: 0.35, roughness: 0.4 }),
      );
      probeMesh.position.set(0, 0.35, 0.25);
      probeMesh.scale.setScalar(0.01);
      probeMesh.userData.enterT = 0;
      probeMesh.userData.baseScale = 1.2;
      playRoot.add(probeMesh);
    };

    const syncLegend = () => {
      // 2D rule: the key REMAPS whenever freeLegendSize(correct) grows.
      const size = freeLegendSize(correctN);
      if (legend.length !== size) {
        legend = buildLegend(size);
        setKeySize(size);
        layoutKey();
        layoutDigits();
      }
    };

    const nextItem = () => {
      syncLegend();
      item = pickItem(legend, Math.random, lastDigit);
      lastDigit = item?.digit ?? 0;
      showProbe();
    };

    const finishRun = () => {
      if (finished) return;
      finished = true;
      setPhase('over');
      setBanner('over');
      playSfxRef.current?.('error');
    };

    const answer = (digit) => {
      if (finished || !item) return;
      const isRight = digit === item.digit;
      const mesh = digitMeshes.find((m) => m.userData.digit === digit);
      if (mesh) { mesh.userData.flash = 0.7; mesh.userData.flashHex = isRight ? 0x62b277 : 0xdd7f7a; }
      if (isRight) {
        playSfxRef.current?.('click');
        correctN += 1;
        comboN += 1;
        bank = Math.min(TIME_BANK.maxMs, bank + bankGainMs(legend.length));
        scoreN += freeItemPoints(comboN);
        setCorrect(correctN);
        setCombo(comboN);
        setScore(scoreN);
        nextItem();
      } else {
        playSfxRef.current?.('error');
        comboN = 0;
        setCombo(0);
        bank -= TIME_BANK.penaltyMs;
        if (bank <= 0) { bank = 0; setBankSec(0); finishRun(); return; }
        nextItem();
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
      const hits = raycaster.intersectObjects(digitMeshes, false);
      if (hits.length) return hits[0].object.userData.digit;
      let best = null;
      let bestD = coarse ? 0.15 : 0.09;
      for (const m of digitMeshes) {
        tmp.copy(m.position).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best = m.userData.digit; }
      }
      return best;
    };
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const d = resolve(e.clientX, e.clientY);
      if (d != null) answer(d);
    };
    el.addEventListener('pointerup', onUp);

    setTick((dt) => {
      // The adaptive bank drains in real time — empty = run over (2D rule).
      if (!finished) {
        bank -= dt * 1000;
        if (bank <= 0) { bank = 0; setBankSec(0); finishRun(); }
        hudAcc += dt;
        if (hudAcc > 0.15) { hudAcc = 0; setBankSec(Math.max(0, bank / 1000)); }
      }
      if (probeMesh) {
        const ud = probeMesh.userData;
        if (ud.enterT < 1) {
          ud.enterT = Math.min(1, ud.enterT + dt * 3.2);
          const e = 1 - (1 - ud.enterT) ** 3;
          probeMesh.scale.setScalar(Math.max(0.01, (ud.baseScale ?? 1) * e));
        }
        probeMesh.rotation.y = Math.sin(performance.now() * 0.0014) * 0.12;
      }
      for (const m of digitMeshes) {
        const ud = m.userData;
        if (ud.flash > 0) {
          ud.flash = Math.max(0, ud.flash - dt);
          ud.faceMat.emissive.setHex(ud.flashHex || 0x62b277);
          ud.faceMat.emissiveIntensity = ud.flash;
        } else {
          ud.faceMat.emissiveIntensity = 0;
        }
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        legend = [];
        item = null;
        lastDigit = 0;
        bank = TIME_BANK.startMs;
        correctN = 0; comboN = 0; scoreN = 0;
        setCorrect(0); setCombo(0); setScore(0);
        setBankSec(TIME_BANK.startMs / 1000);

        setPhase('play');
        nextItem();
      },
      stop: () => { finished = true; },
    };

    return () => {
      finished = true;
      el.removeEventListener('pointerup', onUp);
      clearGroup(keyMeshes);
      clearGroup(digitMeshes);
      clearProbe();
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
    `✓ ${correct}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    combo > 1 ? `🔥${combo}` : `${t.key} ${keySize}`,
    `⏳${bankSec.toFixed(1)}s`,
  ];

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={t.hint}
      chip={`${t.key} ${keySize}`}
      chipStyle={{ fontSize: '0.7rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : null}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? `✓ ${correct} · ${score} ${isAr ? 'نقطة' : 'pts'}` : null}
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
