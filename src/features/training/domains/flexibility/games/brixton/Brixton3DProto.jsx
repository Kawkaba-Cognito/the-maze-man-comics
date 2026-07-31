import React, { useEffect, useRef, useState } from 'react';
import { GAME_INTS } from '../../../../shared/gamePalette';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
import { survivalRamp, SURVIVAL_MS, freshSurvivalSeed } from '../../../../shared/survival';
import { createDrKawkabInstance, disposeDrKawkabInstance } from '../../../../shared/drKawkabModel';
// SAME hidden-rule game as 2D Survival: identical rules + free-mode config ramp.
import {
  RULES,
  cfgFor,
  BRIXTON_PER_LEVEL,
  BRIXTON_WIN_ACC,
  BRIXTON_PP_TRIALS,
} from './index';
import '../../../../shared/c3dProto.css';

/*
 * Kawkab Hops (Brixton) · 3D prototype
 * The real Brixton Spatial Anticipation Test: a marker hops between 10 nodes
 * along a HIDDEN rule (RULES). You watch a short demo, then continue the rule for
 * a few hops; crack it and the rule SILENTLY changes. Uses the exact 2D rules and
 * free-mode cfgFor() ramp — this is the same game, presented in Three.js.
 */

const UI = {
  en: {
    title: 'Kawkab Hops',
    tag: 'Dr Kawkab',
    watch: 'Watch Dr Kawkab — find the hidden rule',
    your: 'Your turn — choose Dr Kawkab’s next landing pad',
    solved: 'Cracked! New rule…',
    miss: 'Not that one — watch again',
    over: 'Survival over',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    solvedL: 'Cracked',
    loading: 'Loading Dr Kawkab…',
    loadError: 'Dr Kawkab could not load',
  },
  ar: {
    title: 'قفزات كوكب',
    tag: 'د. كوكب',
    watch: 'راقب د. كوكب — اكتشف القاعدة الخفية',
    your: 'دورك — اختر منصة هبوط د. كوكب التالية',
    solved: 'أحسنت! قاعدة جديدة…',
    miss: 'ليست هذه — راقب مجددًا',
    over: 'انتهى البقاء',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    solvedL: 'محلولة',
    loading: 'جارٍ تحميل د. كوكب…',
    loadError: 'تعذّر تحميل د. كوكب',
  },
};

const NODE_BASE = 0x173653;
const NODE_LIT = 0x55d6e8;
const NODE_OK = GAME_INTS.ok.fill;
const NODE_BAD = GAME_INTS.bad.fill;

function nodeNumberTexture(value) {
  const c = document.createElement('canvas');
  c.width = 192;
  c.height = 192;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#eefcff';
  ctx.font = '800 92px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), 96, 101);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function Brixton3DProto({
  mode = 'free',
  diff = 'med',
  level = 1,
  seed,
  attempt,
  onResult,
  onExit,
  isAr,
  playSfx,
  awardPoints,
  awardFreeRun,
  onBack,
}) {
  const t = UI[isAr ? 'ar' : 'en'];
  const isSurvival = mode === 'free';
  const ppTrials = mode === 'passplay' ? (attempt?.trials || BRIXTON_PP_TRIALS) : 0;
  const exit = onExit || onBack;
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const awardMetricRef = useRef(0);
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | demo | your | reveal | over
  const [instr, setInstr] = useState('');
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.round(SURVIVAL_MS / 1000));
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);
  const [running, setRunning] = useState(false);
  const [robotStatus, setRobotStatus] = useState('loading');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, {
      fov: 52,
      fitHalf: 3.8,
      bloom: false,
      hudReserveFrac: 0.22,
    });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitBox, renderer, dispose } = boot;

    // Ten bright landing pads keep the original 2 x 5 Brixton board readable.
    const gap = coarse ? 1.5 : 1.65;
    const rowGap = coarse ? 1.75 : 1.95;
    const nodes = [];
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const x = (col - 2) * gap;
      const y = (0.5 - row) * rowGap;
      const mesh = new THREE.Mesh(
        new THREE.CircleGeometry(0.48, 40),
        matStd(NODE_BASE, { emissive: NODE_LIT, emissiveIntensity: 0.1, metalness: 0.05, roughness: 0.82 }),
      );
      mesh.position.set(x, y, 0);
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.53, 0.055, 12, 40),
        matStd(NODE_LIT, { emissive: NODE_LIT, emissiveIntensity: 0.55, metalness: 0.05, roughness: 0.5 }),
      );
      rim.position.z = 0.025;
      mesh.add(rim);
      const numberTex = nodeNumberTexture(i + 1);
      const number = new THREE.Mesh(
        new THREE.PlaneGeometry(0.48, 0.48),
        new THREE.MeshBasicMaterial({ map: numberTex, transparent: true, depthWrite: false, toneMapped: false }),
      );
      number.position.z = 0.05;
      mesh.add(number);
      mesh.userData.idx = i;
      mesh.userData.flash = 0;
      mesh.userData.flashHex = NODE_OK;
      mesh.userData.rim = rim;
      mesh.userData.numberTex = numberTex;
      playRoot.add(mesh);
      nodes.push(mesh);
    }
    setFitBox(2 * gap + 0.9, rowGap + 1.0);

    // Dr Kawkab. A small luminous marker remains as a loading fallback.
    const marker = new THREE.Group();
    const markerCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 24, 18),
      matStd(0xf4c95d, { emissive: 0xf4c95d, emissiveIntensity: 0.55, metalness: 0.05, roughness: 0.55 }),
    );
    markerCore.position.y = 0.3;
    marker.add(markerCore);
    const markerHalo = new THREE.Mesh(
      new THREE.CircleGeometry(0.38, 28),
      new THREE.MeshBasicMaterial({ color: 0x55d6e8, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    markerHalo.position.set(0, 0.05, 0.08);
    marker.add(markerHalo);
    marker.position.set(nodes[0].position.x, nodes[0].position.y, 0.25);
    playRoot.add(marker);
    const markerTarget = marker.position.clone();
    const markerFrom = marker.position.clone();
    let hopProgress = 1;
    let robotHolder = null;
    let robotMixer = null;
    let robotAction = null;
    let robotAlive = true;
    let robotModel = null;
    createDrKawkabInstance().then((gltf) => {
      if (!robotAlive) {
        disposeDrKawkabInstance(gltf.scene);
        return;
      }
      const model = gltf.scene;
      robotModel = model;
      model.scale.set(1, 1, 1);
      model.position.set(0, 0, 0);
      const { size, center, min } = gltf.bounds;
      const robotHeight = wrap.clientWidth < 600 ? 2 : 1.5;
      const scale = robotHeight / Math.max(0.0001, size.y);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -min.y * scale, -center.z * scale);
      model.traverse((node) => {
        if (!node.isMesh) return;
        node.frustumCulled = false;
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.forEach((material) => {
          if (!material) return;
          material.metalness = 0;
          material.roughness = 0.7;
          if ('emissiveIntensity' in material) material.emissiveIntensity = 0.18;
          material.transparent = false;
          material.depthWrite = true;
          material.needsUpdate = true;
        });
      });
      robotHolder = new THREE.Group();
      robotHolder.add(model);
      robotHolder.position.set(0, 0.04, 0.42);
      marker.add(robotHolder);
      markerCore.visible = false;
      markerHalo.material.opacity = 0.1;
      setRobotStatus('ready');
      const clips = gltf.animations || [];
      const clip = clips.find((entry) => entry.name === 'Walking')
        || clips.find((entry) => entry.name === 'Running')
        || clips.find((entry) => entry.name === 'Idle_02')
        || clips[0];
      if (clip) {
        robotMixer = new THREE.AnimationMixer(model);
        robotAction = robotMixer.clipAction(clip);
        robotAction.timeScale = clip.name === 'Running' ? 0.65 : 0.9;
        robotAction.play();
      }
    }).catch(() => {
      if (robotAlive) setRobotStatus('error');
    });

    // ── Game state ──
    const gameSeed = (seed ?? freshSurvivalSeed()) >>> 0;
    let patternIdx = -1;
    let rule = 0;
    let cfg = cfgFor('free', 'med', 1, 0);
    let demoPath = [];
    let pos = 0;
    let tryCount = 0;
    let gamePhase = 'demo';
    let solvedN = 0;
    let streakN = 0;
    let scoreN = 0;
    let attemptsN = 0;
    let bestN = 0;
    let finished = false;
    let runStart = performance.now();
    const timers = [];
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };

    const rampNow = () => (isSurvival ? survivalRamp(performance.now() - runStart) : 0);

    const setNode = (mesh, hex, emissive) => {
      mesh.material.color.setHex(hex);
      mesh.material.emissive.setHex(hex);
      mesh.material.emissiveIntensity = emissive;
      mesh.userData.rim.material.color.setHex(hex === NODE_BASE ? NODE_LIT : hex);
      mesh.userData.rim.material.emissive.setHex(hex === NODE_BASE ? NODE_LIT : hex);
      mesh.userData.rim.material.emissiveIntensity = hex === NODE_BASE ? 0.55 : Math.max(0.7, emissive);
    };
    const resetNodes = () => nodes.forEach((m) => setNode(m, NODE_BASE, 0.06));

    const buildPattern = () => {
      patternIdx += 1;
      const rng = makeRng((gameSeed + patternIdx * 7919) >>> 0);
      cfg = cfgFor(mode, diff, level, rampNow());
      rule = cfg.rules[Math.floor(rng() * cfg.rules.length)];
      let p = Math.floor(rng() * 10);
      pos = p;
      demoPath = [p];
      for (let k = 0; k < cfg.demo; k++) { p = RULES[rule](p); demoPath.push(p); }
    };

    const moveMarker = (idx) => {
      pos = idx;
      markerFrom.copy(marker.position);
      markerTarget.set(nodes[idx].position.x, nodes[idx].position.y, 0.25);
      hopProgress = 0;
      if (robotHolder) {
        const dx = markerTarget.x - markerFrom.x;
        robotHolder.rotation.y = Math.abs(dx) < 0.02 ? 0 : (dx < 0 ? -0.32 : 0.32);
      }
    };

    const playDemo = () => {
      if (finished) return;
      clearTimers();
      resetNodes();
      tryCount = 0;
      gamePhase = 'demo';
      setPhase('demo');
      setBanner(null);
      setInstr(t.watch);
      const { demoMs, animMs } = cfg;
      // Snap to the first node, then hop through the pattern.
      moveMarker(demoPath[0]);
      setNode(nodes[demoPath[0]], NODE_LIT, 0.7);
      let step = 1;
      const hopNext = () => {
        if (finished) return;
        if (step >= demoPath.length) {
          later(() => {
            if (finished) return;
            gamePhase = 'your';
            setPhase('your');
            setInstr(t.your);
          }, 420);
          return;
        }
        playSfxRef.current?.('click');
        const node = demoPath[step];
        moveMarker(node);
        setNode(nodes[node], NODE_LIT, 0.7);
        step += 1;
        later(hopNext, animMs + demoMs);
      };
      later(hopNext, 320);
    };

    const nextPattern = () => {
      if (finished) return;
      buildPattern();
      playDemo();
    };

    const continueAfterAttempt = (fresh) => {
      if (finished) return;
      if (mode === 'levels' && attemptsN >= BRIXTON_PER_LEVEL) {
        finished = true;
        clearTimers();
        const acc = solvedN / BRIXTON_PER_LEVEL;
        onResult?.({
          won: acc >= BRIXTON_WIN_ACC,
          score: scoreN,
          summary: `${solvedN}/${BRIXTON_PER_LEVEL} ${t.solvedL.toLowerCase()} · ${Math.round(acc * 100)}% · ${isAr ? 'أفضل سلسلة' : 'best streak'} ${bestN}`,
        });
        return;
      }
      if (mode === 'passplay' && attemptsN >= ppTrials) {
        finished = true;
        clearTimers();
        onResult?.({ score: solvedN });
        return;
      }
      if (fresh) nextPattern();
      else playDemo();
    };

    const flash = (idx, hex) => {
      const m = nodes[idx];
      m.userData.flash = 0.6;
      m.userData.flashHex = hex;
    };

    const onSolved = () => {
      solvedN += 1;
      streakN += 1;
      attemptsN += 1;
      bestN = Math.max(bestN, streakN);
      awardMetricRef.current = bestN || solvedN;
      scoreN += 18 + Math.min(streakN, 10) * 3;
      setSolved(solvedN);
      setAttempts(attemptsN);
      setStreak(streakN);
      setScore(scoreN);
      gamePhase = 'reveal';
      setPhase('reveal');
      setBanner('solved');
      setInstr(t.solved);
      playSfxRef.current?.('win');
      awardPoints?.(1);
      later(() => continueAfterAttempt(true), 1100);
    };

    const onMiss = (pickIdx, correctIdx) => {
      streakN = 0;
      attemptsN += 1;
      setAttempts(attemptsN);
      setStreak(0);
      flash(correctIdx, NODE_OK);
      if (pickIdx !== correctIdx) flash(pickIdx, NODE_BAD);
      moveMarker(correctIdx);
      gamePhase = 'reveal';
      setPhase('reveal');
      setInstr(t.miss);
      playSfxRef.current?.('lose');
      // Survival replays the same rule; finite modes advance to a fresh pattern.
      later(() => continueAfterAttempt(!isSurvival), 1000);
    };

    const tap = (idx) => {
      if (gamePhase !== 'your' || finished) return;
      const expect = RULES[rule](pos);
      if (idx === expect) {
        playSfxRef.current?.('click');
        moveMarker(expect);
        flash(expect, NODE_OK);
        tryCount += 1;
        scoreN += 6;
        setScore(scoreN);
        if (tryCount >= cfg.tries) onSolved();
      } else {
        onMiss(idx, expect);
      }
    };

    // ── Pointer picking ──
    const raycaster = new THREE.Raycaster();
    const ptr = new THREE.Vector2();
    const tmp = new THREE.Vector3();
    const el = renderer.domElement;
    const resolve = (cx, cy) => {
      const rect = el.getBoundingClientRect();
      ptr.x = ((cx - rect.left) / rect.width) * 2 - 1;
      ptr.y = -((cy - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ptr, camera);
      const hits = raycaster.intersectObjects(nodes, false);
      if (hits.length) return hits[0].object.userData.idx;
      let best = -1;
      let bestD = coarse ? 0.13 : 0.08;
      for (const m of nodes) {
        tmp.copy(m.position).add(playRoot.position).project(camera);
        const d = Math.hypot(tmp.x - ptr.x, tmp.y - ptr.y);
        if (d < bestD) { bestD = d; best = m.userData.idx; }
      }
      return best;
    };
    const onUp = (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const idx = resolve(e.clientX, e.clientY);
      if (idx >= 0) tap(idx);
    };
    el.addEventListener('pointerup', onUp);

    // ── Animate ──
    setTick((dt, now) => {
      if (hopProgress < 1) {
        hopProgress = Math.min(1, hopProgress + dt * 4.2);
        const eased = hopProgress * hopProgress * (3 - 2 * hopProgress);
        marker.position.lerpVectors(markerFrom, markerTarget, eased);
        marker.position.y += Math.sin(hopProgress * Math.PI) * 0.36;
      }
      robotMixer?.update(dt);
      if (robotAction) robotAction.timeScale = hopProgress < 1 ? 1.2 : 0.55;
      markerCore.material.emissiveIntensity = 0.6 + Math.sin(now * 0.006) * 0.2;
      markerHalo.material.opacity = 0.2 + Math.sin(now * 0.006) * 0.08;
      for (const m of nodes) {
        if (m.userData.flash > 0) {
          m.userData.flash = Math.max(0, m.userData.flash - dt);
          setNode(m, m.userData.flashHex, 0.3 + m.userData.flash);
          if (m.userData.flash === 0) setNode(m, NODE_BASE, 0.06);
        } else if (gamePhase === 'your') {
          m.material.emissiveIntensity = 0.1 + Math.sin(now * 0.005 + m.userData.idx) * 0.06;
        }
      }
    });

    apiRef.current = {
      start: () => {
        finished = false;
        patternIdx = -1;
        solvedN = 0; streakN = 0; scoreN = 0; attemptsN = 0; bestN = 0;
        awardMetricRef.current = 0;
        setSolved(0); setAttempts(0); setStreak(0); setScore(0);
        runStart = performance.now();
        setRunning(true);
        buildPattern();
        moveMarker(demoPath[0]);
        playDemo();
      },
      stop: () => { finished = true; clearTimers(); },
    };

    return () => {
      finished = true;
      robotAlive = false;
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      nodes.forEach((m) => {
        m.userData.numberTex?.dispose();
        disposeObject(m);
        playRoot.remove(m);
      });
      if (robotHolder) marker.remove(robotHolder);
      if (robotModel) disposeDrKawkabInstance(robotModel);
      disposeObject(marker);
      playRoot.remove(marker);
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr, mode, diff, level, seed, ppTrials, onResult, awardPoints, isSurvival, t.solved, t.solvedL, t.watch, t.your, t.miss]);

  // Survival 60s countdown → over
  useEffect(() => {
    if (!running || !isSurvival) return undefined;
    const start = performance.now();
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((SURVIVAL_MS - (performance.now() - start)) / 1000));
      setTimeLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        apiRef.current.stop?.();
        setRunning(false);
        setPhase('over');
        setBanner('over');
        awardFreeRun?.('brixton', awardMetricRef.current);
        playSfxRef.current?.('error');
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running, isSurvival, awardFreeRun]);

  const startRun = () => {
    playSfx?.('click');
    setTimeLeft(Math.round(SURVIVAL_MS / 1000));
    setBanner(null);
    apiRef.current.start?.();
  };

  useEffect(() => {
    const id = requestAnimationFrame(() => startRun());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = phase === 'boot' ? [] : mode === 'levels' ? [
    `${attempts}/${BRIXTON_PER_LEVEL}`,
    `${isAr ? 'محلولة' : 'Cracked'} ${solved}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    streak > 1 ? `🔥${streak}` : `${isAr ? 'سلسلة' : 'Streak'} ${streak}`,
  ] : mode === 'passplay' ? [
    `${attempts}/${ppTrials}`,
    `${isAr ? 'محلولة' : 'Cracked'} ${solved}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
  ] : [
    `${isAr ? 'محلولة' : 'Cracked'} ${solved}`,
    `${score} ${isAr ? 'نقطة' : 'pts'}`,
    streak > 1 ? `🔥${streak}` : `${isAr ? 'سلسلة' : 'Streak'} ${streak}`,
    `${timeLeft}s`,
  ];

  const bannerText = banner === 'go' ? t.go
    : banner === 'solved' ? t.solved
      : banner === 'over' ? t.over
        : null;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={t.title}
      tag={robotStatus === 'ready' ? t.tag : robotStatus === 'error' ? t.loadError : t.loading}
      question={running ? instr : t.watch}
      chip={isAr ? 'قاعدة خفية' : 'Hidden rule'}
      chipStyle={{ fontSize: '0.7rem', fontWeight: 800, color: '#55d6e8' }}
      stats={stats}
      banner={banner === 'solved' ? null : bannerText}
      bannerOver={isSurvival && banner === 'over'}
      bannerMeta={banner === 'over' ? `${isAr ? 'محلولة' : 'Cracked'} ${solved} · ${score} ${isAr ? 'نقطة' : 'pts'}` : null}
      bootError={bootError}
      onBack={exit}
      playSfx={playSfx}
      canvasRef={wrapRef}
      bannerActions={
        isSurvival && banner === 'over' ? (
          <div className="c3d-banner-actions">
            <button type="button" className="c3d-cta" onClick={startRun}>{t.retry}</button>
            <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); exit?.(); }}>{t.hub}</button>
          </div>
        ) : null
      }
    />
  );
}
