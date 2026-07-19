import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
import { survivalTier } from '../../../../shared/survival';
import { clamp } from '../../../../../../lib/math';
import { genGate, BASE } from './index';
import '../../../../shared/c3dProto.css';

/*
 * Math Gates · 3D — the REAL 2D free mode: a lane runner in the cosmos.
 * A gate of three answers drifts down at the same relaxed constant pace
 * (3.8s travel, no clock, no speed-up); steer the runner into a lane and the
 * lane you occupy on ARRIVAL is your answer. Equations come from the same
 * genGate() with the same ramp (skill-based: gatesPlayed/36 → survivalTier)
 * and the same free config (easy base ops, 700ms gap, 5 lives). You lose only
 * by steering wrong; out of lives ends the run — exactly the 2D rules.
 */

const UI = {
  en: {
    title: 'Math Gates · 3D',
    tag: 'prototype',
    hint: 'Tap a lane (or ← →) to steer. Your lane when the gate arrives is your answer.',
    over: 'Run over',
    overSub: (n) => `${n} gates passed`,
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    passed: 'Gates',
    lives: 'Lives',
  },
  ar: {
    title: 'بوابات الحساب · ثلاثي الأبعاد',
    tag: 'نموذج',
    hint: 'المس حارة (أو ← →) للتوجيه. حارتك عند وصول البوابة هي إجابتك.',
    over: 'انتهت المحاولة',
    overSub: (n) => `${n} بوابات`,
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    passed: 'بوابات',
    lives: 'أرواح',
  },
};

const LANES = 3;
const DESCEND_SEC = 3.8; // same constant pace as 2D
const LANE_X = [-1.85, 0, 1.85];
const GATE_TOP_Y = 3.55; // gates spawn below the equation panel
const RUNNER_Y = -2.1;
const EQ_Y = 4.3; // big equation panel sits above the play field
const LANE_COLORS = [0x6bb3c8, 0xe8ac4e, 0xc47bb0];

/** Big glowing equation banner → CanvasTexture (readable on any screen). */
function equationTexture(text) {
  const W = 512;
  const H = 150;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgba(20,15,8,0.92)';
  roundRectPath(ctx, 6, 6, W - 12, H - 12, 26);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,172,78,0.75)';
  ctx.lineWidth = 6;
  roundRectPath(ctx, 6, 6, W - 12, H - 12, 26);
  ctx.stroke();
  ctx.fillStyle = '#f0e2c0';
  ctx.font = '800 92px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
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

function numberTexture(value) {
  const S = 150;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#241d13';
  roundRectPath(ctx, 5, 5, S - 10, S - 10, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(232,172,78,0.5)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = '#f0e2c0';
  ctx.font = `800 ${value.length > 3 ? 52 : 66}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, S / 2, S / 2 + 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export default function MathGates3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | run | over
  const [passed, setPassed] = useState(0);
  const [lives, setLives] = useState(BASE.easy.lives);
  const [combo, setCombo] = useState(0);
  const [eqText, setEqText] = useState('');
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
    const { playRoot, setTick, setFitHalf, renderer, dispose } = boot;
    setFitHalf(4.9);

    // ── Big equation banner (the 2D equation header, made unmissable) ──
    let eqTex = null;
    const eqPanel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 1.14),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false }),
    );
    eqPanel.position.set(0, EQ_Y, -0.2);
    eqPanel.visible = false;
    playRoot.add(eqPanel);
    const setEquation = (text) => {
      eqTex?.dispose();
      eqTex = equationTexture(text);
      eqPanel.material.map = eqTex;
      eqPanel.material.needsUpdate = true;
      eqPanel.visible = true;
    };

    // ── Track: three lane strips ──
    const laneStrips = LANE_X.map((x, i) => {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(1.55, GATE_TOP_Y - RUNNER_Y + 1.6),
        matStd(0x14100c, { emissive: LANE_COLORS[i], emissiveIntensity: 0.05, metalness: 0.2, roughness: 0.9, transparent: true, opacity: 0.85 }),
      );
      strip.position.set(x, (GATE_TOP_Y + RUNNER_Y) / 2, -0.3);
      playRoot.add(strip);
      return strip;
    });

    // ── Runner (glowing comet) ──
    const runner = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 18),
      matStd(0xf0c860, { emissive: 0xf0c860, emissiveIntensity: 0.75, metalness: 0.3, roughness: 0.3 }),
    );
    runner.position.set(LANE_X[1], RUNNER_Y, 0.2);
    playRoot.add(runner);
    let runnerTargetX = LANE_X[1];

    // ── Gate (three answer tiles on a bar) ──
    const gateGroup = new THREE.Group();
    playRoot.add(gateGroup);
    let gateTiles = [];
    const clearGate = () => {
      for (const g of gateTiles) { disposeObject(g.mesh); g.tex?.dispose(); gateGroup.remove(g.mesh); }
      gateTiles = [];
      gateGroup.visible = false;
    };
    const buildGate = (eq) => {
      clearGate();
      eq.options.forEach((val, i) => {
        const tex = numberTexture(String(val));
        const side = matStd(0x1d1811, { metalness: 0.2, roughness: 0.6 });
        const face = new THREE.MeshStandardMaterial({ map: tex, emissive: new THREE.Color(0x62b277), emissiveIntensity: 0, metalness: 0.15, roughness: 0.55 });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.15, 0.2), [side, side, side, side, face, side]);
        mesh.position.set(LANE_X[i], 0, 0);
        mesh.userData.faceMat = face;
        mesh.userData.flash = 0;
        gateGroup.add(mesh);
        gateTiles.push({ mesh, tex });
      });
      gateGroup.position.y = GATE_TOP_Y;
      gateGroup.visible = true;
    };

    // ── Game state (mirrors the 2D free loop) ──
    const cfg = { ...BASE.easy }; // free mode = levelCfg('easy', 1): +/- ops, gap 700, 5 lives
    const rng = makeRng((Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0);
    let lane = 1;
    let gate = null; // { eq }
    let gapTimer = cfg.gap;
    let gatesPlayed = 0;
    let passedN = 0;
    let livesN = cfg.lives;
    let comboN = 0;
    let finished = true;

    const spawnGate = () => {
      // Same skill ramp as 2D: gates played / 36 → survivalTier picks the ops tier.
      const f = clamp(gatesPlayed / 36, 0, 1);
      const dk = survivalTier(f);
      const eq = genGate(dk, f, rng);
      gate = { eq };
      buildGate(eq);
      setEqText(`${eq.text} = ?`);
      setEquation(`${eq.text} = ?`);
    };

    const resolveGate = () => {
      if (finished || !gate) return;
      const eq = gate.eq;
      gatesPlayed += 1;
      const ok = lane === eq.correctLane;
      if (ok) {
        passedN += 1;
        comboN += 1;
        setPassed(passedN);
        setCombo(comboN);
        playSfxRef.current?.('collect');
        const tile = gateTiles[lane];
        if (tile) { tile.mesh.userData.flash = 0.7; tile.mesh.userData.flashHex = 0x62b277; }
      } else {
        comboN = 0;
        setCombo(0);
        playSfxRef.current?.('error');
        const right = gateTiles[eq.correctLane];
        const picked = gateTiles[lane];
        if (right) { right.mesh.userData.flash = 0.8; right.mesh.userData.flashHex = 0x62b277; }
        if (picked) { picked.mesh.userData.flash = 0.8; picked.mesh.userData.flashHex = 0xdd7f7a; }
        livesN -= 1;
        setLives(livesN);
        if (livesN <= 0) {
          finished = true;
          setPhase('over');
          setBanner('over');
          return;
        }
      }
      gate = null;
      gapTimer = cfg.gap;
      window.setTimeout(() => { if (!finished) clearGate(); }, 380);
    };

    const setLane = (ln) => {
      if (finished) return;
      const next = Math.max(0, Math.min(LANES - 1, ln));
      if (next !== lane) {
        lane = next;
        runnerTargetX = LANE_X[lane];
        playSfxRef.current?.('click');
      }
    };

    // ── Input: tap a lane (screen thirds), or arrow keys (same as 2D) ──
    const el = renderer.domElement;
    const onDown = (e) => {
      if (finished) return;
      const rect = el.getBoundingClientRect();
      const third = (e.clientX - rect.left) / rect.width;
      setLane(third < 1 / 3 ? 0 : third < 2 / 3 ? 1 : 2);
    };
    el.addEventListener('pointerdown', onDown);
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      if (e.key === 'ArrowLeft' || k === 'a') { e.preventDefault(); setLane(lane + (isAr ? 1 : -1)); }
      else if (e.key === 'ArrowRight' || k === 'd') { e.preventDefault(); setLane(lane + (isAr ? -1 : 1)); }
      else if (e.key === '1') { e.preventDefault(); setLane(isAr ? 2 : 0); }
      else if (e.key === '2') { e.preventDefault(); setLane(1); }
      else if (e.key === '3') { e.preventDefault(); setLane(isAr ? 0 : 2); }
    };
    window.addEventListener('keydown', onKey);

    setTick((dt, now) => {
      if (!finished) {
        if (gate) {
          // Constant descent, exactly DESCEND_SEC top→runner (2D pace).
          const speed = (GATE_TOP_Y - RUNNER_Y) / DESCEND_SEC;
          gateGroup.position.y -= speed * dt;
          if (gateGroup.position.y <= RUNNER_Y) {
            gateGroup.position.y = RUNNER_Y;
            resolveGate();
          }
        } else {
          gapTimer -= dt * 1000;
          if (gapTimer <= 0) spawnGate();
        }
      }
      runner.position.x += (runnerTargetX - runner.position.x) * Math.min(1, dt * 12);
      runner.material.emissiveIntensity = 0.6 + Math.sin(now * 0.006) * 0.2;
      laneStrips.forEach((s, i) => {
        s.material.emissiveIntensity = i === lane ? 0.14 : 0.05;
      });
      for (const g of gateTiles) {
        const ud = g.mesh.userData;
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
        lane = 1;
        runnerTargetX = LANE_X[1];
        gate = null;
        gapTimer = cfg.gap;
        gatesPlayed = 0; passedN = 0; comboN = 0;
        livesN = cfg.lives;
        setPassed(0); setCombo(0); setLives(cfg.lives);
        setPhase('run');
        setBanner(null);
        clearGate();
        spawnGate();
      },
      stop: () => { finished = true; },
    };

    return () => {
      finished = true;
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
      clearGate();
      laneStrips.forEach((s) => { disposeObject(s); playRoot.remove(s); });
      disposeObject(runner);
      playRoot.remove(runner);
      eqTex?.dispose();
      disposeObject(eqPanel);
      playRoot.remove(eqPanel);
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  const startRun = () => {
    playSfx?.('click');
    apiRef.current.start?.();
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => startRun());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : [
    `${t.passed} ${passed}`,
    `${'♥'.repeat(Math.max(0, lives))}`,
    combo > 1 ? `🔥${combo}` : '',
  ].filter(Boolean);

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={t.tag}
      hint={phase === 'run' ? (eqText || t.hint) : t.hint}
      chip={eqText || '∑'}
      chipStyle={{ fontSize: '0.85rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'go' ? t.go : banner === 'over' ? t.over : null}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? t.overSub(passed) : null}
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
