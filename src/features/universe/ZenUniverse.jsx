import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/*
 * ZenUniverse — the Home screen's living 3D backdrop.
 * Pure black space, twinkling stars, soft dust, occasional shooting stars,
 * a white particle planet at the center that dissolves locally where touched
 * and heals itself, and the user's small note/goal/journal planets as colored
 * particle spheres (positions mirrored from UniversePlanets DOM hit areas).
 *
 * Polish motion: center breathe + halo, small-planet float/pulse, richer
 * meteors. Bloom stays desktop-only; phones use additive glow + uBoost.
 * prefers-reduced-motion freezes motion.
 */

const CENTER_RADIUS = 1.35;
const SMALL_RADIUS = 0.36;
const SMALL_PLANE_Z = 0.8;
const CARD_Z = 3.2;
const PULSE_SECONDS = 3.2;
const MAX_TOUCHES = 6;
const BREATH_PERIOD = 3.6;

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

function makeHaloRingAttributes(count, radius) {
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  const size = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.04;
    const tilt = (Math.random() - 0.5) * 0.22;
    const r = radius * (0.96 + Math.random() * 0.1);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = Math.sin(a) * r * 0.42 + tilt * r;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.18;
    rand[i] = Math.random();
    size[i] = 0.7 + Math.random() * 1.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  return geo;
}

function hashPhase(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
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
    // Phones skip bloom — raise particle alpha / size so planets stay readable outdoors.
    const mobileBoost = finePointer ? 1 : 1.45;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, finePointer ? 1.5 : 1.35));
    renderer.setClearColor(0x000000, 1);
    renderer.domElement.style.display = 'block';
    wrap.appendChild(renderer.domElement);

    // ---------- Central white particle planet with touch-ripple dissolve ----------
    const centerGeo = makeSphereAttributes(finePointer ? 22000 : 16000, CENTER_RADIUS);
    const touchPoints = [];
    const touchStarts = [];
    for (let i = 0; i < MAX_TOUCHES; i++) { touchPoints.push(new THREE.Vector3()); touchStarts.push(-99); }
    const centerMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uNow: { value: 0 },
        uDim: { value: 0 },
        uBoost: { value: mobileBoost },
        uBreath: { value: 1 },
        uTouches: { value: touchPoints },
        uStarts: { value: touchStarts },
      },
      vertexShader: `
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        uniform vec3 uTouches[${MAX_TOUCHES}];
        uniform float uStarts[${MAX_TOUCHES}];
        varying float vFade;
        void main() {
          vec3 p = position;
          vec3 dir = normalize(position);
          /* idle surface shimmer — a bit livelier */
          p += dir * sin(uNow * 1.25 + aRand * 40.0) * (0.028 + uBreath * 0.008);
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
            p += (dir * 1.0 + rnd * 1.3) * infl * (0.85 + aRand * 0.55);
            fade += infl;
          }
          vFade = clamp(fade, 0.0, 1.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (19.0 * uBoost * uBreath) / -mv.z * (1.0 + vFade * 1.15);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uDim;
        uniform float uBoost;
        uniform float uBreath;
        varying float vFade;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.06, d) * 0.36 * uBoost * uBreath
            * (1.0 - vFade * 0.55) * (1.0 - uDim * 0.96);
          gl_FragColor = vec4(vec3(1.0), clamp(alpha, 0.0, 1.0));
        }
      `,
    });
    const centerPlanet = new THREE.Points(centerGeo, centerMat);
    scene.add(centerPlanet);

    // Soft additive halo — readable glow on phones without bloom
    const HALO_COUNT = finePointer ? 720 : 480;
    const haloGeo = makeHaloRingAttributes(HALO_COUNT, CENTER_RADIUS * 1.38);
    const haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uNow: { value: 0 },
        uDim: { value: 0 },
        uBoost: { value: mobileBoost },
        uBreath: { value: 1 },
      },
      vertexShader: `
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float spin = uNow * 0.18 + aRand * 6.28;
          float c = cos(spin * 0.15); float s = sin(spin * 0.15);
          p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
          p *= (0.97 + uBreath * 0.06);
          vAlpha = 0.35 + 0.45 * (0.5 + 0.5 * sin(uNow * 1.4 + aRand * 20.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (22.0 * uBoost * uBreath) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uDim;
        uniform float uBoost;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha * 0.22 * uBoost * (1.0 - uDim * 0.9);
          gl_FragColor = vec4(0.92, 0.96, 1.0, clamp(alpha, 0.0, 1.0));
        }
      `,
    });
    const halo = new THREE.Points(haloGeo, haloMat);
    scene.add(halo);

    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(CENTER_RADIUS * 1.12, 16, 16),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    scene.add(hitSphere);

    // ---------- Distant stars ----------
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

    // ---------- Soft cosmic dust (fills the void, very cheap) ----------
    const DUST_COUNT = finePointer ? 600 : 350;
    const dPos = new Float32Array(DUST_COUNT * 3);
    const dRand = new Float32Array(DUST_COUNT);
    const dSize = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      dPos[i * 3] = (Math.random() - 0.5) * 28;
      dPos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      dPos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 2;
      dRand[i] = Math.random();
      dSize[i] = 1.2 + Math.random() * 2.8;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
    dustGeo.setAttribute('aRand', new THREE.BufferAttribute(dRand, 1));
    dustGeo.setAttribute('aSize', new THREE.BufferAttribute(dSize, 1));
    const dustMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uNow: { value: 0 }, uDim: { value: 0 } },
      vertexShader: `
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uNow * 0.07 + aRand * 12.0) * 0.35;
          p.y += cos(uNow * 0.09 + aRand * 9.0) * 0.28;
          vAlpha = 0.25 + 0.35 * (0.5 + 0.5 * sin(uNow * 0.4 + aRand * 8.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * 90.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uDim;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha * 0.08 * (1.0 - uDim * 0.9);
          gl_FragColor = vec4(0.75, 0.85, 1.0, clamp(alpha, 0.0, 1.0));
        }
      `,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ---------- Shooting stars (richer trails, up to 2 active) ----------
    const METEOR_POOL = 6;
    const meteors = [];
    for (let i = 0; i < METEOR_POOL; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
      const mat = new THREE.LineBasicMaterial({
        transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, vertexColors: true, depthWrite: false,
        linewidth: 1,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      scene.add(line);
      meteors.push({
        line, active: false, nextAt: 1.5 + Math.random() * 5 + i * 1.2,
        start: new THREE.Vector3(), dir: new THREE.Vector3(),
        speed: 0, t0: 0, dur: 0, bright: 1,
      });
    }
    function activeMeteorCount() {
      let n = 0;
      for (const m of meteors) if (m.active) n++;
      return n;
    }
    function spawnMeteor(m, tNow) {
      if (activeMeteorCount() >= 2) {
        m.nextAt = tNow + 0.8 + Math.random() * 1.5;
        return;
      }
      const u = Math.random() * 1.6 - 0.8;
      const a = Math.random() * Math.PI * 2;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      m.start.set(s * Math.cos(a), u, s * Math.sin(a)).multiplyScalar(11 + Math.random() * 8);
      m.dir.set(Math.random() - 0.5, -(0.25 + Math.random() * 0.55), Math.random() - 0.5).normalize();
      m.speed = 11 + Math.random() * 12;
      m.dur = 1.1 + Math.random() * 1.4;
      m.bright = Math.random() < 0.35 ? 1.35 : 1.0;
      m.t0 = tNow;
      m.active = true;
      const col = m.line.geometry.attributes.color.array;
      col[0] = 1; col[1] = 1; col[2] = 1;
      col[3] = 0.35; col[4] = 0.45; col[5] = 0.75;
      m.line.geometry.attributes.color.needsUpdate = true;
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
          m.nextAt = tNow + 2.2 + Math.random() * 6;
          continue;
        }
        const head = m.start.clone().addScaledVector(m.dir, m.speed * (tNow - m.t0));
        const trailLen = -(1.8 + m.speed * 0.12) * (0.7 + m.bright * 0.25);
        const tail = head.clone().addScaledVector(m.dir, trailLen);
        const arr = m.line.geometry.attributes.position.array;
        arr[0] = head.x; arr[1] = head.y; arr[2] = head.z;
        arr[3] = tail.x; arr[4] = tail.y; arr[5] = tail.z;
        m.line.geometry.attributes.position.needsUpdate = true;
        m.line.material.opacity = Math.sin(k * Math.PI) * 0.95 * m.bright;
      }
    }

    // ---------- Small user planets ----------
    const SMALL_COUNT = 1300;
    const smallGeo = makeSphereAttributes(SMALL_COUNT, SMALL_RADIUS);
    smallGeo.setAttribute('aPaper', new THREE.BufferAttribute(new Float32Array(SMALL_COUNT * 3), 3));
    const smallVertex = `
      attribute float aRand;
      attribute float aSize;
      attribute vec3 aPaper;
      uniform float uNow;
      uniform float uDissolve;
      uniform float uMorph;
      uniform float uBoost;
      uniform float uPulse;
      varying float vFade;
      varying float vPaper;
      void main() {
        vec3 p = position;
        vec3 dir = normalize(position);
        p += dir * sin(uNow * 1.3 + aRand * 40.0) * 0.014;
        vec3 rnd = vec3(
          fract(sin(aRand * 127.1) * 43758.5) - 0.5,
          fract(sin(aRand * 311.7) * 43758.5) - 0.5,
          fract(sin(aRand * 74.7)  * 43758.5) - 0.5);

        float delay = aRand * 0.4;
        float k = clamp((uDissolve * 1.4 - delay) / (1.0 - delay), 0.0, 1.0);
        k = k * k * (3.0 - 2.0 * k);
        p += (dir * 0.8 + rnd * 1.3) * k * 0.9;

        float md = aRand * 0.45;
        float me = clamp((uMorph - md) / (1.0 - md), 0.0, 1.0);
        me = me * me * (3.0 - 2.0 * me);
        p = mix(p, aPaper, me) + rnd * sin(me * 3.14159) * 1.1;

        vFade = k;
        vPaper = me;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (1.0 + k * 0.6) * (1.0 - me * 0.25) * (15.0 * uBoost * uPulse) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `;
    const smallFragment = `
      uniform vec3 uColor;
      uniform float uDim;
      uniform float uBoost;
      uniform float uPulse;
      varying float vFade;
      varying float vPaper;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.08, d) * 0.62 * uBoost * uPulse
          * (1.0 - vFade * 0.85) * (1.0 - uDim * 0.85);
        alpha *= (1.0 - vPaper * 0.3);
        float flight = sin(vPaper * 3.14159) * 0.35;
        vec3 col = mix(uColor, vec3(1.0), min(1.0, 0.22 + vFade * 0.55 + flight));
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `;
    const smallPlanets = new Map();
    function makeSmallPlanet(color, phase) {
      const mat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uNow: { value: 0 },
          uDissolve: { value: 0 },
          uMorph: { value: 0 },
          uDim: { value: 0 },
          uBoost: { value: mobileBoost },
          uPulse: { value: 1 },
          uColor: { value: new THREE.Color(color) },
        },
        vertexShader: smallVertex,
        fragmentShader: smallFragment,
      });
      const points = new THREE.Points(smallGeo, mat);
      scene.add(points);
      return { points, mat, phase };
    }

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
          const t = Math.random() * 2 * (cardW + cardH);
          if (t < cardW) { x = t - cardW / 2; y = -cardH / 2; }
          else if (t < cardW + cardH) { x = cardW / 2; y = (t - cardW) - cardH / 2; }
          else if (t < 2 * cardW + cardH) { x = (t - cardW - cardH) - cardW / 2; y = cardH / 2; }
          else { x = -cardW / 2; y = (t - 2 * cardW - cardH) - cardH / 2; }
        } else {
          x = (Math.random() - 0.5) * cardW;
          y = (Math.random() - 0.5) * cardH;
        }
        v.set(x, y, CARD_Z + (Math.random() - 0.5) * 0.06).sub(pos).applyAxisAngle(yAxis, -rot);
        attr.setXYZ(i, v.x, v.y, v.z);
      }
      attr.needsUpdate = true;
    }

    function planeSize() {
      const dist = camera.position.z - SMALL_PLANE_Z;
      const h = 2 * dist * Math.tan((camera.fov * Math.PI) / 360);
      return { w: h * camera.aspect, h };
    }
    function pctToWorld(xPct, yPct) {
      const { w, h } = planeSize();
      return { x: (xPct / 100 - 0.5) * w, y: (0.5 - yPct / 100) * h };
    }

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
            const phase = hashPhase(String(p.id));
            entry = {
              ...makeSmallPlanet(p.color, phase),
              dissolve: 0, target: 0, morph: 0, morphTarget: 0,
              frozenRot: 0, removing: false, phase,
            };
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
            entry.target = 1;
          }
        }
      },
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
        const p = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, 0.6 + Math.random())
          .normalize().multiplyScalar(CENTER_RADIUS);
        ripple(centerPlanet.worldToLocal(p));
      },
    };

    function onPointerDown(e) {
      const r = renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObject(hitSphere)[0];
      if (!hit) return;
      ripple(centerPlanet.worldToLocal(hit.point.clone()).normalize().multiplyScalar(CENTER_RADIUS));
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // Bloom — desktop only (plan: no UnrealBloom on phones)
    let composer = null;
    let bloomPass = null;
    if (finePointer && !reducedMotion) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.85, 0.22);
      composer.addPass(bloomPass);
    }

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

      const tAnim = reducedMotion ? 0 : now;
      const breath = reducedMotion
        ? 1
        : 1 + 0.045 * Math.sin((now * Math.PI * 2) / BREATH_PERIOD);

      centerMat.uniforms.uNow.value = tAnim;
      centerMat.uniforms.uBreath.value = breath;
      haloMat.uniforms.uNow.value = tAnim;
      haloMat.uniforms.uBreath.value = breath;
      starMat.uniforms.uNow.value = tAnim;
      dustMat.uniforms.uNow.value = tAnim;

      if (!reducedMotion) {
        centerPlanet.rotation.y = now * 0.05;
        halo.rotation.y = now * 0.08;
        centerPlanet.scale.setScalar(breath);
        halo.scale.setScalar(breath);
        hitSphere.scale.setScalar(breath);
        updateMeteors(now);
        // gentle camera sway
        camera.position.x = Math.sin(now * 0.07) * 0.08;
        camera.position.y = Math.cos(now * 0.09) * 0.05;
        camera.lookAt(0, 0, 0);
      } else {
        centerPlanet.scale.setScalar(1);
        halo.scale.setScalar(1);
        hitSphere.scale.setScalar(1);
        camera.position.set(0, 0, 7);
        camera.lookAt(0, 0, 0);
      }

      let anyMorph = false;
      for (const [, entry] of smallPlanets) if (entry.morphTarget > 0.5) anyMorph = true;
      const dimStep = 2.0 * dt;
      sceneDim += Math.max(-dimStep, Math.min(dimStep, (anyMorph ? 1 : 0) - sceneDim));
      centerMat.uniforms.uDim.value = sceneDim;
      haloMat.uniforms.uDim.value = sceneDim;
      starMat.uniforms.uDim.value = sceneDim;
      dustMat.uniforms.uDim.value = sceneDim;
      for (const m of meteors) {
        if (m.active) m.line.material.opacity *= (1 - sceneDim * 0.85);
      }

      for (const [id, entry] of smallPlanets) {
        const speed = entry.target > entry.dissolve ? 1.6 : 0.8;
        const step = speed * dt;
        entry.dissolve += Math.max(-step, Math.min(step, entry.target - entry.dissolve));
        const mSpeed = entry.morphTarget > entry.morph ? 1.15 : 0.95;
        const mStep = mSpeed * dt;
        entry.morph += Math.max(-mStep, Math.min(mStep, entry.morphTarget - entry.morph));
        entry.mat.uniforms.uDissolve.value = entry.dissolve;
        entry.mat.uniforms.uMorph.value = entry.morph;
        entry.mat.uniforms.uNow.value = tAnim;
        entry.mat.uniforms.uDim.value = (entry.morphTarget > 0.5 || entry.morph > 0.01) ? 0 : sceneDim;

        const pulse = reducedMotion
          ? 1
          : 1 + 0.06 * Math.sin(now * 1.1 + entry.phase * 6.28);
        entry.mat.uniforms.uPulse.value = pulse;

        const { x, y } = pctToWorld(entry.xPct, entry.yPct);
        if (entry.morphTarget > 0.5 || entry.morph > 0.01) {
          entry.points.position.set(x, y, SMALL_PLANE_Z);
          entry.points.rotation.y = entry.frozenRot;
          entry.points.scale.setScalar(1);
        } else if (!reducedMotion) {
          const bob = Math.sin(now * 0.85 + entry.phase * 6.28) * 0.07;
          const drift = Math.cos(now * 0.55 + entry.phase * 4.2) * 0.04;
          entry.points.position.set(x + drift, y + bob, SMALL_PLANE_Z);
          entry.points.rotation.y = now * 0.12 + entry.phase;
          entry.points.scale.setScalar(pulse);
        } else {
          entry.points.position.set(x, y, SMALL_PLANE_Z);
          entry.points.scale.setScalar(1);
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
      haloGeo.dispose(); haloMat.dispose();
      starGeo.dispose(); starMat.dispose();
      dustGeo.dispose(); dustMat.dispose();
      smallGeo.dispose();
      for (const m of meteors) { m.line.geometry.dispose(); m.line.material.dispose(); }
      hitSphere.geometry.dispose(); hitSphere.material.dispose();
      composer?.dispose();
      renderer.dispose();
      wrap.removeChild(renderer.domElement);
    };
  }, []);

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
