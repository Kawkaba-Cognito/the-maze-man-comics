import React, { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../lib/assetUrl';

/**
 * ClayHero3D — Interactive lightweight Three.js 3D Polymer Clay Diorama
 * displaying an animated miniature clay biplane & orbiting clay tokens.
 * Dynamically imports `three` so initial bundle stays lean and falls back
 * gracefully to static `today-hero.webp` if WebGL is unavailable.
 */
export default function ClayHero3D({ doneCount = 0, playSfx }) {
  const hostRef = useRef(null);
  const spinBoostRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el || typeof window === 'undefined') return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (reduced) return undefined;

    let cancelled = false;
    let rafId = null;
    let cleanup = null;

    import('three')
      .then((THREE) => {
        if (cancelled || !hostRef.current) return;

        const w = el.clientWidth || 136;
        const h = el.clientHeight || 136;
        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        } catch {
          return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        el.innerHTML = '';
        el.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 40);
        camera.position.set(0, 2.35, 5.15);
        camera.lookAt(0, 0.35, 0);

        // Soft Overhead Studio Softbox Lighting
        const hemi = new THREE.HemisphereLight(0xFFFDF8, 0xD6C9B4, 1.35);
        scene.add(hemi);
        const key = new THREE.DirectionalLight(0xFFF3DB, 1.15);
        key.position.set(3.5, 6, 4.5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xB8D0EC, 0.45);
        fill.position.set(-4, 2, -2);
        scene.add(fill);

        const matClay = (hex) =>
          new THREE.MeshStandardMaterial({ color: hex, roughness: 0.82, metalness: 0.04 });

        const stage = new THREE.Group();
        scene.add(stage);

        // Stepped Warm Cream Clay Pedestal + Terracotta Ring Trim
        const base = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.52, 0.36, 36), matClay(0xEFEAE0));
        base.position.y = -0.68;
        stage.add(base);
        const trim = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.06, 12, 36), matClay(0xD95A3D));
        trim.rotation.x = Math.PI / 2;
        trim.position.y = -0.51;
        stage.add(trim);

        // Sculpted Miniature 3D Polymer Clay Biplane in Center
        const plane = new THREE.Group();
        plane.position.set(0, 0.36, 0);
        stage.add(plane);

        const fusePts = [
          new THREE.Vector2(0.02, 0.82),
          new THREE.Vector2(0.26, 0.65),
          new THREE.Vector2(0.32, 0.2),
          new THREE.Vector2(0.28, -0.32),
          new THREE.Vector2(0.15, -0.78),
          new THREE.Vector2(0.06, -0.92),
        ];
        const fuseGeo = new THREE.LatheGeometry(fusePts, 20);
        fuseGeo.rotateX(Math.PI / 2);
        const fuse = new THREE.Mesh(fuseGeo, matClay(0x2E5EA8));
        plane.add(fuse);

        const spinner = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), matClay(0xD95A3D));
        spinner.position.set(0, 0, 0.78);
        plane.add(spinner);

        const prop = new THREE.Group();
        prop.position.set(0, 0, 0.99);
        const propGold = matClay(0xE3A12B);
        prop.add(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.76, 0.045), propGold));
        prop.add(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.11, 0.045), propGold));
        plane.add(prop);

        const wingTop = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.11, 0.46), matClay(0xFAF6EE));
        wingTop.position.set(0, 0.48, 0.14);
        plane.add(wingTop);
        const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.125, 0.48), matClay(0xD95A3D));
        wingStripe.position.set(0, 0.485, 0.14);
        plane.add(wingStripe);

        const wingBot = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.11, 0.52), matClay(0xFAF6EE));
        wingBot.position.set(0, 0.02, 0.12);
        plane.add(wingBot);

        for (const sx of [-0.58, 0.58]) {
          const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.44, 10), matClay(0xE3A12B));
          strut.position.set(sx, 0.25, 0.14);
          plane.add(strut);
        }

        const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.20, 14, 12), matClay(0x4E7CB8));
        canopy.scale.set(0.85, 0.72, 1.3);
        canopy.position.set(0, 0.22, 0.04);
        plane.add(canopy);

        const tailH = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.08, 0.30), matClay(0x5E9472));
        tailH.position.set(0, 0.05, -0.72);
        plane.add(tailH);
        const tailV = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.42, 0.32), matClay(0xD95A3D));
        tailV.position.set(0, 0.24, -0.72);
        plane.add(tailV);

        // Orbiting Joyful Clay Geometric Tokens
        const orb1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), matClay(0xE3A12B));
        const orb2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.32), matClay(0x5E9472));
        const orb3 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.075, 10, 22), matClay(0xD95A3D));
        stage.add(orb1, orb2, orb3);

        setReady(true);

        const handleResize = () => {
          if (!hostRef.current) return;
          const nw = hostRef.current.clientWidth || 136;
          const nh = hostRef.current.clientHeight || 136;
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        };
        window.addEventListener('resize', handleResize);

        let t = 0;
        let last = performance.now();
        const animate = (now) => {
          rafId = requestAnimationFrame(animate);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          t += dt;

          prop.rotation.z += dt * (14 + spinBoostRef.current * 18);
          if (spinBoostRef.current > 0) {
            spinBoostRef.current = Math.max(0, spinBoostRef.current - dt * 1.4);
          }

          const doneBoost = 1 + Math.min(3, doneCount) * 0.22;
          stage.rotation.y = Math.sin(t * 0.55) * 0.42 + pointerRef.current.x * 0.5 + spinBoostRef.current * Math.PI * 2;
          stage.rotation.x = pointerRef.current.y * 0.25;

          plane.position.y = 0.36 + Math.sin(t * 2.2) * 0.09 * doneBoost;
          plane.rotation.z = Math.sin(t * 1.5) * 0.14;
          plane.rotation.x = Math.cos(t * 1.9) * 0.07;

          const r = 1.18;
          orb1.position.set(Math.cos(t * 1.1) * r, 0.1 + Math.sin(t * 2.3) * 0.16, Math.sin(t * 1.1) * r);
          orb2.position.set(Math.cos(t * 1.1 + 2.1) * r, 0.2 + Math.cos(t * 2.0) * 0.15, Math.sin(t * 1.1 + 2.1) * r);
          orb2.rotation.x += dt * 1.1;
          orb2.rotation.y += dt * 0.8;
          orb3.position.set(Math.cos(t * 1.1 + 4.2) * r, 0.15 + Math.sin(t * 2.5 + 1) * 0.14, Math.sin(t * 1.1 + 4.2) * r);
          orb3.rotation.x += dt * 1.2;

          renderer.render(scene, camera);
        };
        rafId = requestAnimationFrame(animate);

        cleanup = () => {
          window.removeEventListener('resize', handleResize);
          if (rafId) cancelAnimationFrame(rafId);
          renderer.dispose();
        };
      })
      .catch(() => {
        /* Fallback image stays visible */
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [doneCount]);

  return (
    <div
      className={`clay-hero-3d-wrap${ready ? ' is-live' : ''}`}
      role="img"
      aria-label="Interactive 3D Clay Plane Diorama"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current.x = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 1.1;
        pointerRef.current.y = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 0.8;
      }}
      onPointerLeave={() => {
        pointerRef.current = { x: 0, y: 0 };
      }}
      onClick={() => {
        spinBoostRef.current = 1.0;
        playSfx?.('pop');
      }}
    >
      {!ready && (
        <img
          src={assetUrl('Assets/brand/clay-2026/today-hero.webp')}
          alt=""
          draggable="false"
          className="nayzak-hero-host-img"
        />
      )}
      <div ref={hostRef} className="clay-hero-3d-canvas" aria-hidden="true" />
    </div>
  );
}
