import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/*
 * ZenUniverse — the Home screen's living 3D backdrop (2026-07-16 redesign).
 * Pure black space, twinkling stars (a third of them fade fully in and out),
 * occasional shooting stars, a white particle planet at the center that
 * dissolves locally where touched and heals itself, and the user's small
 * note/goal/journal planets rendered as colored particle spheres whose
 * positions mirror the DOM layer's stored % coordinates (UniversePlanets
 * keeps owning all pointer interaction — this component only draws).
 *
 * Everything is procedural: no textures, no models, one bundled dependency
 * (three). Bloom runs only on fine-pointer (desktop) devices; phones get the
 * raw additive glow, which stays comfortably cheap.
 */

const CENTER_RADIUS = 1.35;
const SMALL_RADIUS = 0.36;          // "a bit bigger" than the old 40px DOM orbs
const SMALL_PLANE_Z = 0.8;          // user planets float slightly in front of center
const CARD_Z = 3.2;                 // the "paper" the particles assemble on, close to the camera
const PULSE_SECONDS = 3.2;          // center touch: dissolve out + heal, one sine pulse
const MAX_TOUCHES = 6;

function makeSphereAttributes(count, radius) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const a = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = radius * (0.9 + 0.1 * Math.random());
    pos[i * 3] = s * Math.cos(a) * r;
    pos[i * 3 + 1] = u * r;
    pos[i * 3 + 2] = s * Math.sin(a) * r;
    rand[i] = Math.random();
    size[i] = 0.6 + Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  return geo;
}

const ZenUniverse = forwardRef(function ZenUniverse({ planets }, ref) {
  const wrapRef = useRef(null);
  const apiRef = useRef({ syncPlanets: () => {}, dissolvePlanet: () => {}, reformPlanet: () => {}, pulseCenter: () => {} });

  useImperativeHandle(ref, () => ({
    dissolvePlanet: (id) => apiRef.current.dissolvePlanet(id),
    reformPlanet: (id) => apiRef.current.reformPlanet(id),
    pulseCenter: () => apiRef.current.pulseCenter(),
  }), []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, finePointer ? 1.5 : 1.25));
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.display = 'block';
    wrap.appendChild(renderer.domElement);

    // ---------- Central white particle planet with touch-ripple dissolve ----------
    const centerGeo = makeSphereAttributes(finePointer ? 22000 : 14000, CENTER_RADIUS);
    const touchPoints = [];
    const touchStarts = [];
    for (let i = 0; i < MAX_TOUCHES; i++) { touchPoints.push(new THREE.Vector3()); touchStarts.push(-99); }
    const centerMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uNow: { value: 0 }, uDim: { value: 0 }, uTouches: { value: touchPoints }, uStarts: { value: touchStarts } },
      vertexShader: `
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform vec3 uTouches[${MAX_TOUCHES}];
        uniform float uStarts[${MAX_TOUCHES}];
        varying float vFade;
        void main() {
          vec3 p = position;
          vec3 dir = normalize(position);
          p += dir * sin(uNow * 1.1 + aRand * 40.0) * 0.02;
          float fade = 0.0;
          for (int i = 0; i < ${MAX_TOUCHES}; i++) {
            float age = uNow - uStarts[i];
            if (age < 0.0 || age > ${PULSE_SECONDS.toFixed(1)}) continue;
            float pulse = sin(clamp(age / ${PULSE_SECONDS.toFixed(1)}, 0.0, 1.0) * 3.14159);
            float d = distance(position, uTouches[i]);
            float infl = smoothstep(0.95, 0.0, d) * pulse;
            vec3 rnd = vec3(
              fract(sin(aRand * 127.1) * 43758.5) - 0.5,
              fract(sin(aRand * 311.7) * 43758.5) - 0.5,
              fract(sin(aRand * 74.7)  * 43758.5) - 0.5);
            p += (dir * 1.0 + rnd * 1.3) * infl * (0.8 + aRand * 0.5);
            fade += infl;
          }
          vFade = clamp(fade, 0.0, 1.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * 17.0 / -mv.z * (1.0 + vFade * 0.9);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uDim;
        varying float vFade;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.08, d) * 0.23 * (1.0 - vFade * 0.7) * (1.0 - uDim * 0.96);
          gl_FragColor = vec4(vec3(1.0), alpha);
        }
      `,
    });
    const centerPlanet = new THREE.Points(centerGeo, centerMat);
    scene.add(centerPlanet);

    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(CENTER_RADIUS * 1.12, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(hitSphere);

    // ---------- Distant stars: some shimmer, some fade fully in and out ----------
    const S_COUNT = finePointer ? 1300 : 900;
    const sPos = new Float32Array(S_COUNT * 3);
    const sPhase = new Float32Array(S_COUNT);
    const sSpeed = new Float32Array(S_COUNT);
    const sDepth = new Float32Array(S_COUNT);
    const sSize = new Float32Array(S_COUNT);
    for (let i = 0; i < S_COUNT; i++) {
      const u = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const r = 25 + Math.random() * 45;
      sPos[i * 3] = s * Math.cos(a) * r;
      sPos[i * 3 + 1] = u * r;
      sPos[i * 3 + 2] = s * Math.sin(a) * r;
      sPhase[i] = Math.random() * Math.PI * 2;
      sSpeed[i] = 0.2 + Math.random() * 1.8;
      sDepth[i] = Math.random() < 0.35 ? 1.0 : 0.25 + Math.random() * 0.4;
      sSize[i] = 0.5 + Math.random() * 1.3;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(sPhase, 1));
    starGeo.setAttribute('aSpeed', new THREE.BufferAttribute(sSpeed, 1));
    starGeo.setAttribute('aDepth', new THREE.BufferAttribute(sDepth, 1));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uNow: { value: 0 }, uDim: { value: 0 } },
      vertexShader: `
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aDepth;
        attribute float aSize;
        uniform float uNow;
        varying float vAlpha;
        void main() {
          float tw = 0.5 + 0.5 * sin(uNow * aSpeed + aPhase);
          tw = tw * tw;
          vAlpha = (1.0 - aDepth) + aDepth * tw;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 120.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uDim;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha * 0.9 * (1.0 - uDim * 0.85);
          gl_FragColor = vec4(vec3(1.0), alpha);
        }
      `,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ---------- Shooting stars ----------
    const meteors = [];
    for (let i = 0; i < 4; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
      const mat = new THREE.LineBasicMaterial({
        transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, vertexColors: true, depthWrite: false,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      scene.add(line);
      meteors.push({
        line, active: false, nextAt: 2 + Math.random() * 6,
        start: new THREE.Vector3(), dir: new THREE.Vector3(), speed: 0, t0: 0, dur: 0,
      });
    }
    function spawnMeteor(m, tNow) {
      const u = Math.random() * 1.6 - 0.8;
      const a = Math.random() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      m.start.set(s * Math.cos(a), u, s * Math.sin(a)).multiplyScalar(11 + Math.random() * 8);
      m.dir.set(Math.random() - 0.5, -(0.2 + Math.random() * 0.6), Math.random() - 0.5).normalize();
      m.speed = 10 + Math.random() * 10;
      m.dur = 1.0 + Math.random() * 1.2;
      m.t0 = tNow;
      m.active = true;
    }
    function updateMeteors(tNow) {
      for (const m of meteors) {
        if (!m.active) {
          if (tNow > m.nextAt) spawnMeteor(m, tNow);
          continue;
        }
        const k = (tNow - m.t0) / m.dur;
        if (k >= 1) {
          m.active = false;
          m.line.material.opacity = 0;
          m.nextAt = tNow + 2 + Math.random() * 7;
          continue;
        }
        const head = m.start.clone().addScaledVector(m.dir, m.speed * (tNow - m.t0));
        const tail = head.clone().addScaledVector(m.dir, -(1.2 + m.speed * 0.09));
        const arr = m.line.geometry.attributes.position.array;
        arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
        arr[3] = tail.x; arr[4] = tail.y; arr[5] = tail.z;
        m.line.geometry.attributes.position.needsUpdate = true;
        m.line.material.opacity = Math.sin(k * Math.PI) * 0.9;
      }
    }

    // ---------- Small user planets: one particle sphere per note/goal/journal ----------
    // All share one geometry; each gets its own material (color + dissolve state).
    const SMALL_COUNT = 1300;
    const smallGeo = makeSphereAttributes(SMALL_COUNT, SMALL_RADIUS);
    // aPaper: per-particle target on the "paper" card (object-space). Filled in
    // right before a morph starts; only one planet morphs at a time, so the
    // shared geometry is safe.
    smallGeo.setAttribute('aPaper', new THREE.BufferAttribute(new Float32Array(SMALL_COUNT * 3), 3));
    const smallVertex = `
      attribute float aRand;
      attribute float aSize;
      attribute vec3 aPaper;
      uniform float uNow;
      uniform float uDissolve;
      uniform float uMorph;
      varying float vFade;
      varying float vPaper;
      void main() {
        vec3 p = position;
        vec3 dir = normalize(position);
        p += dir * sin(uNow * 1.3 + aRand * 40.0) * 0.012;
        vec3 rnd = vec3(
          fract(sin(aRand * 127.1) * 43758.5) - 0.5,
          fract(sin(aRand * 311.7) * 43758.5) - 0.5,
          fract(sin(aRand * 74.7)  * 43758.5) - 0.5);

        /* dissolve (delete / spawn condense): scatter to stardust */
        float delay = aRand * 0.4;
        float k = clamp((uDissolve * 1.4 - delay) / (1.0 - delay), 0.0, 1.0);
        k = k * k * (3.0 - 2.0 * k);
        p += (dir * 0.8 + rnd * 1.3) * k * 0.9;

        /* morph: fly to the camera and assemble into the paper, as a
           staggered swarm with a curved mid-flight arc */
        float md = aRand * 0.45;
        float me = clamp((uMorph - md) / (1.0 - md), 0.0, 1.0);
        me = me * me * (3.0 - 2.0 * me);
        p = mix(p, aPaper, me) + rnd * sin(me * 3.14159) * 1.1;

        vFade = k;
        vPaper = me;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (1.0 + k * 0.6) * (1.0 - me * 0.25) * 13.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `;
    const smallFragment = `
      uniform vec3 uColor;
      uniform float uDim;
      varying float vFade;
      varying float vPaper;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.1, d) * 0.42 * (1.0 - vFade * 0.85) * (1.0 - uDim * 0.85);
        alpha *= (1.0 - vPaper * 0.3);
        /* particles flash brighter mid-flight, settle back to the planet color */
        float flight = sin(vPaper * 3.14159) * 0.35;
        vec3 col = mix(uColor, vec3(1.0), min(1.0, vFade * 0.55 + flight));
        gl_FragColor = vec4(col, alpha);
      }
    `;
    const smallPlanets = new Map(); // id -> { points, mat, xPct, yPct, dissolve, target, removing }
    function makeSmallPlanet(color) {
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uNow: { value: 0 },
          uDissolve: { value: 0 },
          uMorph: { value: 0 },
          uDim: { value: 0 },
          uColor: { value: new THREE.Color(color) },
        },
        vertexShader: smallVertex,
        fragmentShader: smallFragment,
      });
      const points = new THREE.Points(smallGeo, mat);
      scene.add(points);
      return { points, mat };
    }

    /* Fill aPaper with the tapped planet's flight targets: a soft rectangle
       ("the paper") facing the camera — a third of the particles trace its
       border, the rest fill the sheet. Computed in the planet's object space
       (rotation frozen during the morph) so the card lands axis-aligned. */
    function fillPaperTargets(entry) {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      const viewH = 2 * (camera.position.z - CARD_Z) * Math.tan((camera.fov * Math.PI) / 360);
      const worldPerPx = viewH / h;
      const cardW = Math.min(0.9 * w, 560) * worldPerPx;
      const cardH = Math.min(0.68 * h, 620) * worldPerPx;
      const attr = smallGeo.getAttribute('aPaper');
      const pos = entry.points.position;
      const rot = entry.frozenRot;
      const v = new THREE.Vector3();
      const yAxis = new THREE.Vector3(0, 1, 0);
      for (let i = 0; i < SMALL_COUNT; i++) {
        let x;
        let y;
        if (i % 3 === 0) {
          // border: walk the perimeter
          const t = Math.random() * 2 * (cardW + cardH);
          if (t < cardW) { x = t - cardW / 2; y = -cardH / 2; }
          else if (t < cardW + cardH) { x = cardW / 2; y = (t - cardW) - cardH / 2; }
          else if (t < 2 * cardW + cardH) { x = (t - cardW - cardH) - cardW / 2; y = cardH / 2; }
          else { x = -cardW / 2; y = (t - 2 * cardW - cardH) - cardH / 2; }
        } else {
          x = (Math.random() - 0.5) * cardW;
          y = (Math.random() - 0.5) * cardH;
        }
        // world target -> object space (undo the frozen rotation + position)
        v.set(x, y, CARD_Z + (Math.random() - 0.5) * 0.06).sub(pos).applyAxisAngle(yAxis, -rot);
        attr.setXYZ(i, v.x, v.y, v.z);
      }
      attr.needsUpdate = true;
    }

    // % <-> world mapping on the small-planet plane (same linear mapping the
    // DOM layer uses, so hit areas and particles stay perfectly aligned).
    function planeSize() {
      const dist = camera.position.z - SMALL_PLANE_Z;
      const h = 2 * dist * Math.tan((camera.fov * Math.PI) / 360);
      return { w: h * camera.aspect, h };
    }
    function pctToWorld(xPct, yPct) {
      const { w, h } = planeSize();
      return { x: (xPct / 100 - 0.5) * w, y: (0.5 - yPct / 100) * h };
    }

    // ---------- Imperative API (driven by HomeScreen / UniversePlanets) ----------
    let lastCenterPulse = -99;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let now = 0;
    let touchSlot = 0;
    const clock = new THREE.Clock();

    function ripple(localPoint) {
      touchPoints[touchSlot].copy(localPoint);
      touchStarts[touchSlot] = clock.getElapsedTime();
      touchSlot = (touchSlot + 1) % MAX_TOUCHES;
    }

    apiRef.current = {
      syncPlanets(list) {
        const seen = new Set();
        for (const p of list) {
          seen.add(p.id);
          let entry = smallPlanets.get(p.id);
          if (!entry) {
            entry = { ...makeSmallPlanet(p.color), dissolve: 0, target: 0, morph: 0, morphTarget: 0, frozenRot: 0, removing: false };
            // spawn: condense from stardust — start dissolved, heal in
            entry.dissolve = 1;
            entry.mat.uniforms.uDissolve.value = 1;
            smallPlanets.set(p.id, entry);
          }
          entry.xPct = p.x;
          entry.yPct = p.y;
          entry.mat.uniforms.uColor.value.set(p.color);
        }
        for (const [id, entry] of smallPlanets) {
          if (!seen.has(id) && !entry.removing) {
            entry.removing = true;
            entry.target = 1; // scatter to stardust, then removed in the frame loop
          }
        }
      },
      // "dissolve" = the tap gesture: the planet's particles fly to the
      // camera and assemble into the paper the reveal text sits on.
      dissolvePlanet(id) {
        const entry = smallPlanets.get(id);
        if (!entry) return;
        entry.frozenRot = entry.points.rotation.y;
        fillPaperTargets(entry);
        entry.morphTarget = 1;
      },
      reformPlanet(id) {
        const entry = smallPlanets.get(id);
        if (entry) entry.morphTarget = 0;
      },
      pulseCenter() {
        const t = clock.getElapsedTime();
        if (t - lastCenterPulse < 1.4) return;
        lastCenterPulse = t;
        // ripple at a random point on the camera-facing hemisphere
        const p = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0.6 + Math.random())
          .normalize().multiplyScalar(CENTER_RADIUS);
        ripple(centerPlanet.worldToLocal(p));
      },
    };

    // Touch the central planet (empty-space taps reach the canvas; the DOM
    // planet buttons above intercept their own).
    function onPointerDown(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(hitSphere)[0];
      if (!hit) return;
      ripple(centerPlanet.worldToLocal(hit.point.clone()).normalize().multiplyScalar(CENTER_RADIUS));
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // ---------- Bloom (desktop only) ----------
    let composer = null;
    let bloomPass = null;
    if (finePointer && !reducedMotion) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.55, 0.8, 0.25);
      composer.addPass(bloomPass);
    }

    // ---------- Sizing (container-driven; works for phone + desktop) ----------
    function resize() {
      const w = wrap.clientWidth || 1;
      const h = wrap.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer?.setSize(w, h);
      bloomPass?.resolution.set(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // ---------- Frame loop (paused while the tab/app is hidden) ----------
    let raf = 0;
    let running = true;
    let lastNow = 0;
    let sceneDim = 0;
    function frame() {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      now = clock.getElapsedTime();
      const dt = Math.min(now - lastNow, 0.05);
      lastNow = now;

      centerMat.uniforms.uNow.value = reducedMotion ? 0 : now;
      starMat.uniforms.uNow.value = reducedMotion ? 0 : now;
      if (!reducedMotion) {
        centerPlanet.rotation.y = now * 0.05;
        updateMeteors(now);
      }

      // While any planet has flown up into its paper, the rest of the
      // universe dims so the particle card carries the scene.
      let anyMorph = false;
      for (const [, entry] of smallPlanets) if (entry.morphTarget > 0.5) anyMorph = true;
      const dimStep = 2.0 * dt;
      sceneDim += Math.max(-dimStep, Math.min(dimStep, (anyMorph ? 1 : 0) - sceneDim));
      centerMat.uniforms.uDim.value = sceneDim;
      starMat.uniforms.uDim.value = sceneDim;
      for (const m of meteors) m.line.material.opacity *= (1 - sceneDim * 0.85);

      for (const [id, entry] of smallPlanets) {
        // ease dissolve + morph toward their targets
        const speed = entry.target > entry.dissolve ? 1.6 : 0.8; // dissolve faster than heal
        const step = speed * dt;
        entry.dissolve += Math.max(-step, Math.min(step, entry.target - entry.dissolve));
        const mSpeed = entry.morphTarget > entry.morph ? 1.15 : 0.95;
        const mStep = mSpeed * dt;
        entry.morph += Math.max(-mStep, Math.min(mStep, entry.morphTarget - entry.morph));
        entry.mat.uniforms.uDissolve.value = entry.dissolve;
        entry.mat.uniforms.uMorph.value = entry.morph;
        entry.mat.uniforms.uNow.value = reducedMotion ? 0 : now;
        entry.mat.uniforms.uDim.value = (entry.morphTarget > 0.5 || entry.morph > 0.01) ? 0 : sceneDim;
        const { x, y } = pctToWorld(entry.xPct, entry.yPct);
        entry.points.position.set(x, y, SMALL_PLANE_Z);
        if (entry.morphTarget > 0.5 || entry.morph > 0.01) {
          entry.points.rotation.y = entry.frozenRot; // card must land axis-aligned
        } else if (!reducedMotion) {
          entry.points.rotation.y = now * 0.12;
        }
        if (entry.removing && entry.dissolve > 0.98) {
          scene.remove(entry.points);
          entry.mat.dispose();
          smallPlanets.delete(id);
        }
      }

      if (composer) composer.render();
      else renderer.render(scene, camera);
    }
    frame();

    function onVisibility() {
      const visible = document.visibilityState === 'visible';
      if (visible && !running) { running = true; clock.getElapsedTime(); frame(); }
      else if (!visible) { running = false; cancelAnimationFrame(raf); }
    }
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      ro.disconnect();
      for (const [, entry] of smallPlanets) { scene.remove(entry.points); entry.mat.dispose(); }
      smallPlanets.clear();
      centerGeo.dispose(); centerMat.dispose();
      starGeo.dispose(); starMat.dispose();
      smallGeo.dispose();
      for (const m of meteors) { m.line.geometry.dispose(); m.line.material.dispose(); }
      hitSphere.geometry.dispose(); hitSphere.material.dispose();
      composer?.dispose();
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
  }, []);

  // Declarative sync: runs after the scene effect on mount (effects fire in
  // declaration order), and again whenever the planet list changes — so a
  // lazily-mounted scene never misses the initial list.
  useEffect(() => {
    apiRef.current.syncPlanets(planets || []);
  }, [planets]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}
    />
  );
});

export default ZenUniverse;
