import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { clamp } from '../../../../../../lib/math';
import {
  perspectiveFitDistance,
  hudCenterNudge,
  isCoarsePointer,
  isDesktopLayout,
} from '../../../../shared/c3dViewport';
// Same Survival config + round rules as the 2D game — never re-derive them here.
import { freeConfig } from './index';
import '../../../../shared/c3dProto.css';

/*
 * Target Tracking · 3D — the REAL 2D Survival round loop in the cosmos:
 * cue time scales with targets (800+450·k ms, clamped 1500–3000), track for
 * cfg.trackMs, then SELECT exactly k dots (tap to toggle, capped at k) and the
 * round is judged as a whole — perfect = +10 pts, imperfect costs a life and
 * shows your hits; 3 lives, no clock, ramp by round via freeConfig. Motion is
 * the 2D physics: constant speed with per-dot two-sinusoid heading drift,
 * wall bounces, and position-only de-overlap (velocities untouched) so close
 * encounters — the real difficulty — still happen.
 */

const UI = {
  en: {
    title: 'Target Tracking · 3D',
    tag: 'prototype',
    cue: (k) => `Watch the ${k} targets…`,
    track: (k) => `Track ${k} targets with your eyes…`,
    respond: (k) => `Tap the ${k} targets`,
    perfect: 'Perfect ✓',
    partial: (c, k) => `${c}/${k} correct`,
    over: 'Run over',
    overSub: (r, s) => `${r} rounds · ${s} pts`,
    retry: 'Try again',
    hub: 'Back to modes',
    go: 'ENGAGE',
    round: 'Round',
    lives: 'Lives',
  },
  ar: {
    title: 'تتبّع الأهداف · ثلاثي الأبعاد',
    tag: 'نموذج',
    cue: (k) => `راقب ${k} أهداف…`,
    track: (k) => `تابع ${k} أهداف بعينيك…`,
    respond: (k) => `المس الأهداف (${k})`,
    perfect: 'ممتاز ✓',
    partial: (c, k) => `${c}/${k} صحيحة`,
    over: 'انتهت المحاولة',
    overSub: (r, s) => `${r} جولات · ${s} نقطة`,
    retry: 'حاول مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
    round: 'جولة',
    lives: 'أرواح',
  },
};

const SURVIVAL_LIVES = 3; // same as 2D: ends after 3 imperfect rounds, no clock
const CUE_MS = 1500;

const COL_DOT = 0xc4b49a;
const COL_TARGET = 0xe8ac4e;
const COL_OK = 0x62b277;
const COL_BAD = 0xdd7f7a;
const COL_SEL = 0xf0e2c0;

export default function Mot3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

  const [phase, setPhase] = useState('boot'); // boot | cue | track | respond | result | over
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(SURVIVAL_LIVES);
  const [score, setScore] = useState(0);
  const [picksLeft, setPicksLeft] = useState(0);
  const [msg, setMsg] = useState('');
  const [banner, setBanner] = useState('go');

  const phaseRef = useRef('boot');

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const fine = window.matchMedia('(pointer: fine)').matches;
    const coarse = isCoarsePointer();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(coarse ? 56 : 50, 1, 0.1, 80);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: !coarse });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.35 : fine ? 1.5 : 1.25));
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none';
    wrap.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xb8a88a, 0.6));
    const key = new THREE.DirectionalLight(0xfff0d8, 1.1);
    key.position.set(2, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xe8ac4e, 1.1, 30);
    rim.position.set(-3, 2, 4);
    scene.add(rim);

    // Stars
    const starN = fine ? 1200 : 800;
    const starPos = new Float32Array(starN * 3);
    for (let i = 0; i < starN; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 34;
      starPos[i * 3 + 2] = -6 - Math.random() * 30;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xf0e2c0, size: 0.045, transparent: true, opacity: 0.8,
      depthWrite: false, blending: THREE.AdditiveBlending,
    })));

    let composer = null;
    if (fine) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.35, 0.5, 0.8));
    }

    // Smaller playfield on phones so dots stay on-screen in portrait
    const arena = coarse ? 3.55 : 4.6;
    const dotR = coarse ? 0.34 : 0.28;
    const dots = [];
    const group = new THREE.Group();
    scene.add(group);
    const geo = new THREE.SphereGeometry(dotR, coarse ? 18 : 26, coarse ? 14 : 20);
    const ringGeo = new THREE.TorusGeometry(dotR * 1.65, dotR * 0.14, 10, 26);

    // Visible arena frame — so wall bounces read as physical, not arbitrary.
    const frameMat = new THREE.LineBasicMaterial({
      color: 0xe8ac4e,
      transparent: true,
      opacity: 0.35,
    });
    const fr = arena + dotR * 0.5;
    const framePts = new Float32Array([
      -fr, -fr, 0, fr, -fr, 0, fr, fr, 0, -fr, fr, 0, -fr, -fr, 0,
    ]);
    const frameGeo = new THREE.BufferGeometry();
    frameGeo.setAttribute('position', new THREE.BufferAttribute(framePts, 3));
    const arenaFrame = new THREE.Line(frameGeo, frameMat);
    group.add(arenaFrame);
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0xe8ac4e, transparent: true, opacity: 0.55 });
    const cornerGeo = new THREE.SphereGeometry(0.06, 10, 8);
    for (const [cx, cy] of [[-fr, -fr], [fr, -fr], [fr, fr], [-fr, fr]]) {
      const cnr = new THREE.Mesh(cornerGeo, cornerMat);
      cnr.position.set(cx, cy, 0);
      group.add(cnr);
    }

    // ── Round state (mirrors 2D survival) ──
    let cfg = freeConfig(0);
    let roundN = 0;
    let livesN = SURVIVAL_LIVES;
    let scoreN = 0;
    let motT = 0;
    let finished = false;
    let timers = [];
    const later = (fn, ms) => { const id = window.setTimeout(fn, ms); timers.push(id); return id; };
    const clearTimers = () => { timers.forEach((id) => window.clearTimeout(id)); timers = []; };

    const setPhaseBoth = (p) => { phaseRef.current = p; setPhase(p); };

    const setMatColor = (mesh, hex, emissive = 0.2) => {
      mesh.material.color.setHex(hex);
      mesh.material.emissive.setHex(hex);
      mesh.material.emissiveIntensity = emissive;
    };

    const paintPhase = () => {
      const ph = phaseRef.current;
      for (const m of dots) {
        const d = m.userData;
        if (ph === 'cue' && d.target) {
          setMatColor(m, COL_TARGET, 0.55);
          m.scale.setScalar(1.15);
          d.ring.visible = true;
          d.ring.material.color.setHex(COL_TARGET);
          continue;
        }
        if (ph === 'respond' && d.selected) {
          setMatColor(m, COL_SEL, 0.5);
          m.scale.setScalar(1.15);
          d.ring.visible = true;
          d.ring.material.color.setHex(COL_SEL);
          continue;
        }
        setMatColor(m, COL_DOT, 0.15);
        m.scale.setScalar(1);
        d.ring.visible = false;
      }
    };

    const dotGroup = new THREE.Group();
    group.add(dotGroup);

    const rebuild = () => {
      for (const d of dots) {
        d.material?.dispose?.();
        d.userData.ring?.material?.dispose?.();
      }
      while (dotGroup.children.length) dotGroup.children.pop();
      dots.length = 0;
      cfg = freeConfig(roundN);
      // 2D expresses speed as a fraction of the field's short side per second;
      // this square world arena spans 2×arena units.
      const worldSpeed = cfg.speedFrac * arena * 2;
      motT = 0;

      for (let i = 0; i < cfg.total; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: COL_DOT,
          emissive: new THREE.Color(COL_DOT),
          emissiveIntensity: 0.15,
          metalness: 0.35,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(geo, mat);
        // Spawn with a relaxed min-gap, like the 2D board.
        let x = 0; let y = 0; let tries = 0;
        do {
          x = (Math.random() - 0.5) * (arena - dotR) * 2;
          y = (Math.random() - 0.5) * (arena - dotR) * 2;
          tries += 1;
        } while (tries < 60 && dots.some((o) => Math.hypot(o.position.x - x, o.position.y - y) < dotR * 2.05));
        mesh.position.set(x, y, 0);
        const a = Math.random() * Math.PI * 2;
        // Halo ring child — used for the cue, selection and reveal states.
        const ring = new THREE.Mesh(
          ringGeo,
          new THREE.MeshBasicMaterial({ color: COL_TARGET, transparent: true, opacity: 0.9 }),
        );
        ring.visible = false;
        mesh.add(ring);
        mesh.userData = {
          dotIndex: i,
          target: false,
          selected: false,
          ring,
          vx: Math.cos(a) * worldSpeed,
          vy: Math.sin(a) * worldSpeed,
          sp: worldSpeed,
          // Two-sinusoid heading drift, exactly the 2D motion model.
          wob: [
            { a: 0.28 + Math.random() * 0.38, f: 0.45 + Math.random() * 0.9, p: Math.random() * Math.PI * 2 },
            { a: 0.20 + Math.random() * 0.32, f: 0.9 + Math.random() * 1.3, p: Math.random() * Math.PI * 2 },
          ],
        };
        dotGroup.add(mesh);
        dots.push(mesh);
      }
      const ids = dots.map((_, i) => i);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      ids.slice(0, cfg.targets).forEach((i) => { dots[i].userData.target = true; });
      setPicksLeft(cfg.targets);
    };

    const startRound = () => {
      if (finished) return;
      clearTimers();
      rebuild();
      setRound(roundN + 1);
      setBanner(null);
      setMsg(t.cue(cfg.targets));
      setPhaseBoth('cue');
      paintPhase();
      playSfxRef.current?.('click');
      // Encoding time scales with targets, same clamp as 2D.
      const cueMs = clamp(800 + cfg.targets * 450, CUE_MS, 3000);
      later(() => {
        setMsg(t.track(cfg.targets));
        setPhaseBoth('track');
        paintPhase();
        later(() => {
          setMsg(t.respond(cfg.targets));
          setPhaseBoth('respond');
          paintPhase();
          playSfxRef.current?.('collect');
        }, cfg.trackMs);
      }, cueMs);
    };

    const evaluate = () => {
      if (finished) return;
      const k = cfg.targets;
      const correct = dots.filter((m) => m.userData.target && m.userData.selected).length;
      const perfect = correct === k;
      setPhaseBoth('result');
      // Reveal: targets green (hit) / gold (missed), wrong picks red.
      for (const m of dots) {
        const d = m.userData;
        if (d.target) {
          setMatColor(m, d.selected ? COL_OK : COL_TARGET, 0.55);
          d.ring.visible = true;
          d.ring.material.color.setHex(d.selected ? COL_OK : COL_TARGET);
        } else if (d.selected) {
          setMatColor(m, COL_BAD, 0.55);
          d.ring.visible = true;
          d.ring.material.color.setHex(COL_BAD);
        } else {
          setMatColor(m, COL_DOT, 0.1);
          d.ring.visible = false;
        }
      }
      if (perfect) {
        playSfxRef.current?.('win');
        scoreN += 10;
        setScore(scoreN);
        setMsg(t.perfect);
      } else {
        playSfxRef.current?.('lose');
        setMsg(t.partial(correct, k));
      }
      later(() => {
        if (finished) return;
        // Survival: no clock — an imperfect round costs a life (2D rule).
        if (!perfect) {
          livesN -= 1;
          setLives(livesN);
          if (livesN <= 0) {
            finished = true;
            setPhaseBoth('over');
            setBanner('over');
            return;
          }
        }
        roundN += 1;
        startRound();
      }, 1300);
    };

    // ── Pointer: toggle-select up to k, auto-evaluate at k (2D respond rule) ──
    const tmpProj = new THREE.Vector3();
    const pickDot = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(dots, false);
      if (hits.length) return hits[0].object;
      // Generous soft pick, like the 2D ≥24px slop.
      let best = null;
      let bestD = coarse ? 0.22 : 0.12;
      for (const d of dots) {
        d.getWorldPosition(tmpProj).project(camera);
        const dist = Math.hypot(tmpProj.x - pointer.x, tmpProj.y - pointer.y);
        if (dist < bestD) { bestD = dist; best = d; }
      }
      return best;
    };

    const onPointer = (e) => {
      if (phaseRef.current !== 'respond') return;
      const mesh = pickDot(e.clientX, e.clientY);
      if (!mesh) return;
      const d = mesh.userData;
      if (d.selected) {
        d.selected = false;
        setPicksLeft((p) => p + 1);
        playSfxRef.current?.('click');
        paintPhase();
        return;
      }
      const sel = dots.filter((m) => m.userData.selected).length;
      if (sel >= cfg.targets) return;
      d.selected = true;
      playSfxRef.current?.('click');
      paintPhase();
      const left = cfg.targets - (sel + 1);
      setPicksLeft(left);
      if (left === 0) later(evaluate, 280);
    };
    renderer.domElement.addEventListener('pointerup', onPointer);

    const resize = () => {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const aspect = w / Math.max(1, h);
      const desk = isDesktopLayout(w, h);
      camera.aspect = aspect;
      camera.fov = coarse ? 56 : desk ? 48 : 50;
      const pad = coarse ? 1.22 : desk ? 1.12 : 1.16;
      const dist = perspectiveFitDistance(camera, arena, aspect, pad);
      const nudge = hudCenterNudge(h, arena, { strength: desk ? 0.9 : 1.05 });
      group.position.set(0, -nudge, 0);
      camera.position.set(0, -nudge * 0.1, dist);
      camera.lookAt(0, -nudge, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.visualViewport?.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      const moving = phaseRef.current === 'track';
      if (moving) {
        // Fixed substeps: identical motion statistics at any frame rate, no
        // tunneling through walls or popping de-overlaps on slow frames.
        const lim = arena - dotR;
        let rem = dt;
        while (rem > 0.0001) {
          const h = Math.min(1 / 120, rem);
          rem -= h;
          motT += h;
          // 1) Heading drift at constant speed + wall bounce (2D model).
          for (const m of dots) {
            const d = m.userData;
            const omega = d.wob[0].a * Math.sin(motT * d.wob[0].f + d.wob[0].p)
              + d.wob[1].a * Math.sin(motT * d.wob[1].f + d.wob[1].p);
            const ang = Math.atan2(d.vy, d.vx) + omega * h;
            d.vx = Math.cos(ang) * d.sp;
            d.vy = Math.sin(ang) * d.sp;
            m.position.x += d.vx * h;
            m.position.y += d.vy * h;
            if (m.position.x < -lim) { m.position.x = -lim; d.vx = Math.abs(d.vx); }
            if (m.position.x > lim) { m.position.x = lim; d.vx = -Math.abs(d.vx); }
            if (m.position.y < -lim) { m.position.y = -lim; d.vy = Math.abs(d.vy); }
            if (m.position.y > lim) { m.position.y = lim; d.vy = -Math.abs(d.vy); }
          }
          // 2) Position-only de-overlap — grazing stays possible (close
          //    encounters are the difficulty); velocities untouched.
          for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
              const a = dots[i].position;
              const b = dots[j].position;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const dist = Math.hypot(dx, dy) || 0.001;
              const minSep = dotR * 2;
              if (dist >= minSep) continue;
              const nx = dx / dist;
              const ny = dy / dist;
              const push = (minSep - dist) / 2;
              a.x -= nx * push; a.y -= ny * push;
              b.x += nx * push; b.y += ny * push;
            }
          }
        }
        for (const m of dots) {
          const d = m.userData;
          const sm = Math.hypot(d.vx, d.vy);
          if (sm > 0 && Math.abs(sm - d.sp) > 0.02) {
            d.vx = (d.vx / sm) * d.sp;
            d.vy = (d.vy / sm) * d.sp;
          }
        }
      }
      // Halo rings gently breathe; arena frame shimmers subtly.
      const pulse = 1 + Math.sin(now * 0.006) * 0.06;
      for (const m of dots) {
        if (m.userData.ring?.visible) m.userData.ring.scale.setScalar(pulse);
      }
      frameMat.opacity = 0.28 + Math.sin(now * 0.0018) * 0.08;
      if (phaseRef.current === 'cue') {
        const pulse = 1.08 + Math.sin(now * 0.01) * 0.08;
        for (const m of dots) if (m.userData.target) m.scale.setScalar(pulse);
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    apiRef.current = {
      start: () => {
        finished = false;
        roundN = 0;
        livesN = SURVIVAL_LIVES;
        scoreN = 0;
        setLives(SURVIVAL_LIVES);
        setScore(0);
        setBanner(null);
        startRound();
      },
      stop: () => { finished = true; clearTimers(); },
    };

    // Boot
    later(() => { setBanner(null); apiRef.current.start(); }, 800);

    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      clearTimers();
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerup', onPointer);
      geo.dispose();
      ringGeo.dispose();
      frameGeo.dispose();
      cornerGeo.dispose();
      starGeo.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  return (
    <div className="c3d-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="c3d-canvas" ref={wrapRef} aria-hidden="true" />
      <div className="c3d-ui c3d-ui--overlay">
        <header className="c3d-top">
          <button type="button" className="c3d-icon-btn" onClick={() => { playSfx?.('click'); onBack(); }}>
            {isAr ? '›' : '‹'}
          </button>
          <div className="c3d-titles">
            <div className="c3d-title">{t.title}</div>
            <div className="c3d-tag">{t.tag}</div>
          </div>
          <div className="c3d-target-chip" style={{ fontSize: '0.75rem', fontWeight: 800, color: '#e8ac4e' }}>
            {phase === 'respond' ? picksLeft : ''}
          </div>
        </header>
        <p className="c3d-hint">{msg || ' '}</p>
        <div className="c3d-stats">
          <span>{t.round} {round}</span>
          <span>{score} {isAr ? 'نقطة' : 'pts'}</span>
          <span>{t.lives} {lives}</span>
        </div>
      </div>

      {banner && (
        <div className={`c3d-banner c3d-banner--${banner === 'over' ? 'over' : banner}`}>
          {banner === 'go' && <span>{t.go}</span>}
          {banner === 'over' && (
            <>
              <span>{t.over}</span>
              <span className="c3d-banner-meta">{t.overSub(round, score)}</span>
              <div className="c3d-banner-actions">
                <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); setBanner(null); apiRef.current.start?.(); }}>
                  {t.retry}
                </button>
                <button type="button" className="c3d-cta c3d-cta--ghost" onClick={() => { playSfx?.('click'); onBack(); }}>
                  {t.hub}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
