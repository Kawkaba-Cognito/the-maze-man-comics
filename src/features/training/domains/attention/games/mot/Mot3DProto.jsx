import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { clamp, lerp } from '../../../../../../lib/math';
import {
  perspectiveFitDistance,
  hudCenterNudge,
  isCoarsePointer,
  isDesktopLayout,
} from '../../../../shared/c3dViewport';
import '../../../../shared/c3dProto.css';

/*
 * Target Tracking · 3D prototype — same MOT loop (cue → track → respond)
 * with Three.js spheres in a black cosmos. Parallel to ModeShell modes only.
 */

const UI = {
  en: {
    title: 'Target Tracking · 3D',
    tag: 'prototype',
    cue: 'Remember the glowing targets…',
    track: 'Track them with your eyes…',
    respond: 'Tap every target you tracked',
    lives: 'Lives',
    round: 'Round',
    perfect: 'Perfect!',
    miss: 'Missed',
    over: 'Run over',
    next: 'Next round',
    retry: 'Try again',
    hub: 'Back to modes',
    go: 'ENGAGE',
  },
  ar: {
    title: 'تتبّع الأهداف · ثلاثي الأبعاد',
    tag: 'نموذج',
    cue: 'تذكّر الأهداف المتوهّجة…',
    track: 'تتبّعها بعينيك…',
    respond: 'المس كل هدف تتبّعته',
    lives: 'أرواح',
    round: 'جولة',
    perfect: 'ممتاز!',
    miss: 'أخطأت',
    over: 'انتهت المحاولة',
    next: 'الجولة التالية',
    retry: 'حاول مجددًا',
    hub: 'العودة للأوضاع',
    go: 'انطلق',
  },
};

const CUE_MS = 1500;
const LIVES = 3;
const MOT_CAP = 5;

function freeConfig(r) {
  const u = clamp(r / 16, 0, 1);
  const targets = clamp(Math.round(lerp(2, MOT_CAP, u)), 2, MOT_CAP);
  return {
    targets,
    total: Math.round(lerp(8, 20, u)),
    speed: lerp(1.1, 2.4, u),
    trackMs: Math.round(lerp(3500, 7000, u)),
  };
}

const COL_DOT = 0xc4b49a;
const COL_TARGET = 0xe8ac4e;
const COL_OK = 0x62b277;
const COL_BAD = 0xdd7f7a;

export default function Mot3DProto({ isAr, playSfx, onBack }) {
  const t = UI[isAr ? 'ar' : 'en'];
  const wrapRef = useRef(null);
  const apiRef = useRef({ startRound: () => {} });

  const [phase, setPhase] = useState('boot'); // boot | cue | track | respond | clear | over
  const [round, setRound] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [picked, setPicked] = useState(0);
  const [need, setNeed] = useState(2);
  const [banner, setBanner] = useState('go');

  const phaseRef = useRef('boot');
  const livesRef = useRef(LIVES);
  const roundRef = useRef(0);
  const playSfxRef = useRef(playSfx);
  playSfxRef.current = playSfx;

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
    const dots = [];
    const group = new THREE.Group();
    scene.add(group);

    const geo = new THREE.SphereGeometry(coarse ? 0.34 : 0.28, coarse ? 16 : 22, coarse ? 12 : 16);
    let cfg = freeConfig(0);
    let targetIds = new Set();
    let pickedIds = new Set();
    let timers = [];

    const clearTimers = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
    };

    const setMatColor = (mesh, hex, emissive = 0.2) => {
      mesh.material.color.setHex(hex);
      mesh.material.emissive.setHex(hex);
      mesh.material.emissiveIntensity = emissive;
    };

    const rebuild = (stage) => {
      clearTimers();
      while (group.children.length) {
        const c = group.children.pop();
        c.geometry?.dispose?.();
        c.material?.dispose?.();
      }
      dots.length = 0;
      pickedIds = new Set();
      cfg = freeConfig(stage);
      setNeed(cfg.targets);
      setPicked(0);

      const ids = Array.from({ length: cfg.total }, (_, i) => i);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      targetIds = new Set(ids.slice(0, cfg.targets));

      for (let i = 0; i < cfg.total; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: COL_DOT,
          emissive: new THREE.Color(COL_DOT),
          emissiveIntensity: 0.15,
          metalness: 0.35,
          roughness: 0.35,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.dotIndex = i;
        mesh.position.set(
          (Math.random() - 0.5) * arena * 1.6,
          (Math.random() - 0.5) * arena * 1.6,
          0,
        );
        mesh.userData.vx = (Math.random() - 0.5) * cfg.speed;
        mesh.userData.vy = (Math.random() - 0.5) * cfg.speed;
        group.add(mesh);
        dots.push(mesh);
      }
    };

    const paintCue = (on) => {
      for (const d of dots) {
        if (targetIds.has(d.userData.dotIndex)) {
          setMatColor(d, on ? COL_TARGET : COL_DOT, on ? 0.55 : 0.15);
          d.scale.setScalar(on ? 1.15 : 1);
        } else {
          setMatColor(d, COL_DOT, 0.15);
          d.scale.setScalar(1);
        }
      }
    };

    const beginRound = (stage) => {
      roundRef.current = stage;
      setRound(stage);
      rebuild(stage);
      phaseRef.current = 'cue';
      setPhase('cue');
      setBanner(null);
      paintCue(true);
      playSfxRef.current?.('click');
      timers.push(window.setTimeout(() => {
        paintCue(false);
        phaseRef.current = 'track';
        setPhase('track');
        timers.push(window.setTimeout(() => {
          phaseRef.current = 'respond';
          setPhase('respond');
          playSfxRef.current?.('collect');
        }, cfg.trackMs));
      }, CUE_MS));
    };

    const finishRound = (perfect) => {
      clearTimers();
      phaseRef.current = perfect ? 'clear' : 'miss';
      if (perfect) {
        setBanner('clear');
        playSfxRef.current?.('collect');
      } else {
        livesRef.current -= 1;
        setLives(livesRef.current);
        playSfxRef.current?.('error');
        if (livesRef.current <= 0) {
          setBanner('over');
          setPhase('over');
          phaseRef.current = 'over';
          return;
        }
        setBanner('miss');
      }
      setPhase(perfect ? 'clear' : 'miss');
    };

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
      // Soft pick for thumbs — nearest projected sphere within a generous radius
      if (!coarse) return null;
      let best = null;
      let bestD = 0.22; // NDC units
      for (const d of dots) {
        d.getWorldPosition(tmpProj).project(camera);
        const dx = tmpProj.x - pointer.x;
        const dy = tmpProj.y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < bestD) {
          bestD = dist;
          best = d;
        }
      }
      return best;
    };

    const onPointer = (e) => {
      if (phaseRef.current !== 'respond') return;
      const mesh = pickDot(e.clientX, e.clientY);
      if (!mesh) return;
      const id = mesh.userData.dotIndex;
      if (pickedIds.has(id)) return;
      pickedIds.add(id);

      if (targetIds.has(id)) {
        setMatColor(mesh, COL_OK, 0.5);
        mesh.scale.setScalar(1.2);
        playSfxRef.current?.('collect');
        const n = pickedIds.size;
        // count only correct picks toward need
        let correct = 0;
        for (const pid of pickedIds) if (targetIds.has(pid)) correct += 1;
        setPicked(correct);
        if (correct >= cfg.targets) finishRound(true);
      } else {
        setMatColor(mesh, COL_BAD, 0.55);
        playSfxRef.current?.('error');
        finishRound(false);
      }
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

      if (phaseRef.current === 'track' || phaseRef.current === 'cue') {
        const move = phaseRef.current === 'track';
        for (const d of dots) {
          if (move) {
            d.position.x += d.userData.vx * dt;
            d.position.y += d.userData.vy * dt;
            const lim = arena;
            if (d.position.x < -lim || d.position.x > lim) d.userData.vx *= -1;
            if (d.position.y < -lim || d.position.y > lim) d.userData.vy *= -1;
            d.position.x = clamp(d.position.x, -lim, lim);
            d.position.y = clamp(d.position.y, -lim, lim);
          }
          if (phaseRef.current === 'cue' && targetIds.has(d.userData.dotIndex)) {
            const pulse = 1.08 + Math.sin(now * 0.01) * 0.08;
            d.scale.setScalar(pulse);
          }
        }
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    apiRef.current = {
      startRound: beginRound,
      next: () => beginRound(roundRef.current + 1),
      retry: () => {
        livesRef.current = LIVES;
        setLives(LIVES);
        beginRound(0);
      },
    };

    // Boot
    window.setTimeout(() => {
      setBanner(null);
      beginRound(0);
    }, 800);

    return () => {
      cancelAnimationFrame(raf);
      clearTimers();
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerup', onPointer);
      geo.dispose();
      starGeo.dispose();
      composer?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, []);

  const instr =
    phase === 'cue' ? t.cue
      : phase === 'track' ? t.track
        : phase === 'respond' ? t.respond
          : '';

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
            {picked}/{need}
          </div>
        </header>
        <p className="c3d-hint">{instr || ' '}</p>
        <div className="c3d-stats">
          <span>{t.round} {round + 1}</span>
          <span>{t.lives} {lives}</span>
        </div>
      </div>

      {banner && (
        <div className={`c3d-banner c3d-banner--${banner === 'over' || banner === 'miss' ? 'over' : banner}`}>
          {banner === 'go' && <span>{t.go}</span>}
          {banner === 'clear' && (
            <>
              <span>{t.perfect}</span>
              <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); setBanner(null); apiRef.current.next(); }}>
                {t.next}
              </button>
            </>
          )}
          {banner === 'miss' && (
            <>
              <span>{t.miss}</span>
              <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); setBanner(null); apiRef.current.startRound(roundRef.current); }}>
                {t.next}
              </button>
            </>
          )}
          {banner === 'over' && (
            <>
              <span>{t.over}</span>
              <div className="c3d-banner-actions">
                <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); setBanner(null); apiRef.current.retry(); }}>
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
