import React, { useEffect, useRef, useState } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { makeRng } from '../../../../shared/rng';
import { survivalRamp, SURVIVAL_MS, freshSurvivalSeed } from '../../../../shared/survival';
// SAME hidden-rule game as 2D Survival: identical rules + free-mode config ramp.
import { RULES, cfgFor } from './index';
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
    title: 'Kawkab Hops · 3D',
    tag: 'prototype',
    watch: 'Watch the hops — find the hidden rule',
    your: 'Your turn — continue the rule',
    solved: 'Cracked! New rule…',
    miss: 'Not that one — watch again',
    over: 'Survival over',
    retry: 'Play again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    solvedL: 'Cracked',
  },
  ar: {
    title: 'قفزات كوكب · ثلاثي الأبعاد',
    tag: 'نموذج',
    watch: 'راقب القفزات — اكتشف القاعدة الخفية',
    your: 'دورك — أكمل القاعدة',
    solved: 'أحسنت! قاعدة جديدة…',
    miss: 'ليست هذه — راقب مجددًا',
    over: 'انتهى البقاء',
    retry: 'العب مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    solvedL: 'محلولة',
  },
};

const NODE_BASE = 0x8a7a5c;
const NODE_LIT = 0xe8ac4e;
const NODE_OK = 0x62b277;
const NODE_BAD = 0xdd7f7a;

export default function Brixton3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | demo | your | reveal | over
  const [instr, setInstr] = useState('');
  const [solved, setSolved] = useState(0);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.round(SURVIVAL_MS / 1000));
  const [banner, setBanner] = useState('go');
  const [bootError, setBootError] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 3.8, bloom: true });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }
    const { camera, playRoot, coarse, setTick, setFitHalf, renderer, dispose } = boot;

    // ── Build 10 nodes: 2 rows × 5 cols (matches the 2D board layout) ──
    const gap = coarse ? 1.42 : 1.55;
    const rowGap = coarse ? 1.7 : 1.85;
    const nodes = [];
    for (let i = 0; i < 10; i++) {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.46, 0.46, 0.22, 30),
        matStd(NODE_BASE, { emissive: NODE_LIT, emissiveIntensity: 0.06, metalness: 0.3, roughness: 0.5 }),
      );
      mesh.rotation.x = Math.PI / 2;
      mesh.position.set((col - 2) * gap, (0.5 - row) * rowGap, 0);
      mesh.userData.idx = i;
      mesh.userData.flash = 0;
      mesh.userData.flashHex = NODE_OK;
      playRoot.add(mesh);
      nodes.push(mesh);
    }
    const boardHalf = Math.max(2 * gap + 0.6, rowGap + 0.8);
    setFitHalf(boardHalf + 0.4);

    // Kawkab marker
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 18),
      matStd(0xf0c860, { emissive: 0xf0c860, emissiveIntensity: 0.7, metalness: 0.3, roughness: 0.3 }),
    );
    marker.position.set(nodes[0].position.x, nodes[0].position.y, 0.5);
    playRoot.add(marker);
    const markerTarget = marker.position.clone();

    // ── Game state ──
    const seed = freshSurvivalSeed();
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
    let finished = false;
    let runStart = performance.now();
    const timers = [];
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers.length = 0; };
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };

    const rampNow = () => survivalRamp(performance.now() - runStart);

    const setNode = (mesh, hex, emissive) => {
      mesh.material.color.setHex(hex);
      mesh.material.emissive.setHex(hex);
      mesh.material.emissiveIntensity = emissive;
    };
    const resetNodes = () => nodes.forEach((m) => setNode(m, NODE_BASE, 0.06));

    const buildPattern = () => {
      patternIdx += 1;
      const rng = makeRng((seed + patternIdx * 7919) >>> 0);
      cfg = cfgFor('free', 'med', 1, rampNow());
      rule = cfg.rules[Math.floor(rng() * cfg.rules.length)];
      let p = Math.floor(rng() * 10);
      pos = p;
      demoPath = [p];
      for (let k = 0; k < cfg.demo; k++) { p = RULES[rule](p); demoPath.push(p); }
    };

    const moveMarker = (idx) => {
      pos = idx;
      markerTarget.set(nodes[idx].position.x, nodes[idx].position.y, 0.5);
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

    const flash = (idx, hex) => {
      const m = nodes[idx];
      m.userData.flash = 0.6;
      m.userData.flashHex = hex;
    };

    const onSolved = () => {
      solvedN += 1;
      streakN += 1;
      scoreN += 18 + Math.min(streakN, 10) * 3;
      setSolved(solvedN);
      setStreak(streakN);
      setScore(scoreN);
      gamePhase = 'reveal';
      setPhase('reveal');
      setBanner('solved');
      setInstr(t.solved);
      playSfxRef.current?.('win');
      later(nextPattern, 1100);
    };

    const onMiss = (pickIdx, correctIdx) => {
      streakN = 0;
      setStreak(0);
      flash(correctIdx, NODE_OK);
      if (pickIdx !== correctIdx) flash(pickIdx, NODE_BAD);
      moveMarker(correctIdx);
      gamePhase = 'reveal';
      setPhase('reveal');
      setInstr(t.miss);
      playSfxRef.current?.('lose');
      // 2D survival rule: a miss REPLAYS the same pattern (nextPattern(false)),
      // it does not deal a fresh one — you get to watch and try again.
      later(() => { if (!finished) playDemo(); }, 1000);
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
      marker.position.lerp(markerTarget, Math.min(1, dt * 9));
      marker.material.emissiveIntensity = 0.55 + Math.sin(now * 0.006) * 0.2;
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
        solvedN = 0; streakN = 0; scoreN = 0;
        setSolved(0); setStreak(0); setScore(0);
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
      clearTimers();
      el.removeEventListener('pointerup', onUp);
      nodes.forEach((m) => { disposeObject(m); playRoot.remove(m); });
      disposeObject(marker);
      playRoot.remove(marker);
      dispose();
      apiRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  // Survival 60s countdown → over
  useEffect(() => {
    if (!running) return undefined;
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
        playSfxRef.current?.('error');
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

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

  const stats = phase === 'boot' ? [] : [
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
      tag={t.tag}
      hint={running ? instr : t.watch}
      chip={isAr ? 'قاعدة خفية' : 'Hidden rule'}
      chipStyle={{ fontSize: '0.7rem', fontWeight: 800, color: '#e8ac4e' }}
      stats={stats}
      banner={banner === 'solved' ? null : bannerText}
      bannerOver={banner === 'over'}
      bannerMeta={banner === 'over' ? `${isAr ? 'محلولة' : 'Cracked'} ${solved} · ${score} ${isAr ? 'نقطة' : 'pts'}` : null}
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
