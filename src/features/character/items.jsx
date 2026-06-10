/**
 * Dress-up catalog. Each item knows how to draw itself in BOTH renderers:
 *   render2d({ accent, gold }) → SVG drawn around a LOCAL origin (0,0) that the
 *      character maps to the right spot via its slot anchors. Conventions:
 *        hat  → bottom-centre at (0,0), grows up (−y)
 *        face → centred on the eye line at (0,0)
 *        neck → top-centre at (0,0), grows down (+y)
 *        back → top-centre at (0,0) (cape grows down, balloon grows up)
 *   build3d({ BABYLON, s, root, anchor, mats, shadow }) → adds Babylon meshes
 *      at the character's 3D anchor so equipped gear shows in the maze too.
 *
 * Items are data, so the Shop just maps over them. Add fun = add an entry here.
 */
import React from 'react';

export const SHOP_SLOTS = ['hat', 'face', 'neck', 'back'];
// Global draw order (later = on top); each pass filters by its layer.
const DRAW_ORDER = ['back', 'neck', 'face', 'hat'];

export const ITEMS = [
  // ───────── HATS ─────────
  {
    id: 'crown', slot: 'hat', layer: 'front', en: 'Golden Crown', ar: 'تاج ذهبي', cost: 150, icon: '👑',
    render2d: ({ gold, accent }) => (
      <g>
        <path d="M-18,1 L-14,-15 L-6,-5 L0,-19 L6,-5 L14,-15 L18,1 Z" fill={gold || accent} stroke="#7a5408" strokeWidth="1" />
        <rect x="-18" y="-1" width="36" height="5" rx="2" fill={gold || accent} />
        <circle cx="0" cy="-17" r="2.6" fill="#ff5d73" /><circle cx="-14" cy="-14" r="2" fill="#5ad1ff" /><circle cx="14" cy="-14" r="2" fill="#5ad1ff" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const ring = BABYLON.MeshBuilder.CreateCylinder('crown', { diameterTop: 0.95, diameterBottom: 0.85, height: 0.45, tessellation: 8 }, s);
      ring.material = mats.gold; ring.parent = parent; ring.position.set(0, 0.42, 0); shadow.addShadowCaster(ring);
      for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; const sp = BABYLON.MeshBuilder.CreateSphere('cj', { diameter: 0.18 }, s); sp.material = mats.gold; sp.parent = parent; sp.position.set(Math.cos(a) * 0.42, 0.67, Math.sin(a) * 0.42); }
    },
  },
  {
    id: 'tophat', slot: 'hat', layer: 'front', en: 'Top Hat', ar: 'قبعة عالية', cost: 80, icon: '🎩',
    render2d: ({ gold, accent }) => (
      <g>
        <ellipse cx="0" cy="1" rx="20" ry="5" fill="#15151c" />
        <rect x="-12" y="-26" width="24" height="27" rx="2" fill="#1d1d26" />
        <rect x="-12" y="-9" width="24" height="5" fill={gold || accent} />
        <ellipse cx="-4" cy="-19" rx="2.6" ry="8" fill="#fff" opacity="0.08" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const brim = BABYLON.MeshBuilder.CreateCylinder('thb', { diameter: 1.5, height: 0.1 }, s); brim.material = mats.black; brim.parent = parent; brim.position.set(0, 0.45, 0); shadow.addShadowCaster(brim);
      const top = BABYLON.MeshBuilder.CreateCylinder('tht', { diameter: 0.95, height: 1.0 }, s); top.material = mats.black; top.parent = parent; top.position.set(0, 0.98, 0); shadow.addShadowCaster(top);
      const band = BABYLON.MeshBuilder.CreateTorus('thn', { diameter: 0.98, thickness: 0.12, tessellation: 16 }, s); band.material = mats.gold; band.parent = parent; band.position.set(0, 0.63, 0);
    },
  },
  {
    id: 'wizard', slot: 'hat', layer: 'front', en: 'Wizard Hat', ar: 'قبعة ساحر', cost: 90, icon: '🧙',
    render2d: ({ gold, accent }) => (
      <g>
        <ellipse cx="0" cy="1" rx="18" ry="5" fill="#3c2870" />
        <path d="M0,-40 L14,1 L-14,1 Z" fill="#5b3aa6" />
        <path d="M0,-40 L4,1 L-3,1 Z" fill="#7b54cf" opacity="0.7" />
        <rect x="-14" y="-4" width="28" height="6" rx="3" fill={gold || accent} />
        <path d="M0,-30 l1.6,3.4 3.6,.4 -2.7,2.4 .8,3.6 -3.3,-1.9 -3.3,1.9 .8,-3.6 -2.7,-2.4 3.6,-.4 Z" fill={accent} />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const mk = mats.make(0.36, 0.23, 0.65);
      const cone = BABYLON.MeshBuilder.CreateCylinder('wz', { diameterTop: 0, diameterBottom: 1.0, height: 1.7, tessellation: 16 }, s); cone.material = mk; cone.parent = parent; cone.position.set(0, 1.2, 0); shadow.addShadowCaster(cone);
      const brim = BABYLON.MeshBuilder.CreateCylinder('wzb', { diameter: 1.5, height: 0.08 }, s); brim.material = mk; brim.parent = parent; brim.position.set(0, 0.42, 0);
      const band = BABYLON.MeshBuilder.CreateTorus('wzn', { diameter: 0.85, thickness: 0.1 }, s); band.material = mats.gold; band.parent = parent; band.position.set(0, 0.62, 0);
    },
  },
  {
    id: 'party', slot: 'hat', layer: 'front', en: 'Party Hat', ar: 'قبعة حفلة', cost: 30, icon: '🎉',
    render2d: () => (
      <g>
        <path d="M0,-34 L12,2 L-12,2 Z" fill="#ff5d73" />
        <path d="M-8,-12 L8,-12 M-10,-4 L10,-4" stroke="#ffe14a" strokeWidth="2.5" />
        <path d="M0,-22 L6,-10 L-6,-10 Z" fill="#5ad1ff" opacity="0.8" />
        <circle cx="0" cy="-34" r="3.2" fill="#9be85a" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const cone = BABYLON.MeshBuilder.CreateCylinder('pty', { diameterTop: 0, diameterBottom: 0.85, height: 1.2, tessellation: 16 }, s); cone.material = mats.make(1, 0.36, 0.45); cone.parent = parent; cone.position.set(0, 0.95, 0); shadow.addShadowCaster(cone);
      const pom = BABYLON.MeshBuilder.CreateSphere('ptp', { diameter: 0.3 }, s); pom.material = mats.make(0.6, 0.9, 0.35); pom.parent = parent; pom.position.set(0, 1.6, 0);
    },
  },

  {
    id: 'halo', slot: 'hat', layer: 'front', en: 'Angel Halo', ar: 'هالة ملاك', cost: 110, icon: '😇',
    render2d: ({ gold, accent }) => (
      <g>
        <ellipse cx="0" cy="-14" rx="14" ry="4.5" fill="none" stroke={gold || accent} strokeWidth="3.5" />
        <ellipse cx="0" cy="-15" rx="14" ry="4.5" fill="none" stroke="#fff7d8" strokeWidth="1.2" opacity="0.7" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const halo = BABYLON.MeshBuilder.CreateTorus('halo', { diameter: 0.85, thickness: 0.09, tessellation: 24 }, s);
      halo.material = mats.make(1, 0.88, 0.45, [0.9, 0.7, 0.3]);
      halo.parent = parent; halo.position.set(0, 0.95, 0); halo.rotation.x = 0.12;
      if (mats.glow) mats.glow(halo);
    },
  },

  {
    id: 'propeller', slot: 'hat', layer: 'front', en: 'Propeller Cap', ar: 'قبعة مروحة', cost: 55, icon: '🚁',
    render2d: ({ gold, accent }) => (
      <g>
        <path d="M-14,1 A14,14 0 0 1 14,1 Z" fill="#e8453c" />
        <path d="M-14,1 A14,14 0 0 1 -4.6,-12.2 L-4.6,1 Z" fill="#3b7fe0" />
        <path d="M14,1 A14,14 0 0 0 4.6,-12.2 L4.6,1 Z" fill="#f5b32e" />
        <rect x="-15" y="-1" width="30" height="3.5" rx="1.7" fill="#c93830" />
        <rect x="-1.2" y="-18" width="2.4" height="5" fill="#888" />
        <g className="mmv-spin">
          <ellipse cx="0" cy="-19" rx="16" ry="3" fill={gold || accent} stroke="#7a5408" strokeWidth="0.8" />
        </g>
        <circle cx="0" cy="-19" r="2" fill="#c93830" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const dome = BABYLON.MeshBuilder.CreateSphere('prc', { diameter: 0.9, segments: 12 }, s);
      dome.scaling = new BABYLON.Vector3(1, 0.55, 1);
      dome.material = mats.make(0.85, 0.25, 0.2); dome.parent = parent; dome.position.set(0, 0.42, 0); shadow.addShadowCaster(dome);
      const stem = BABYLON.MeshBuilder.CreateCylinder('prs', { diameter: 0.08, height: 0.3 }, s);
      stem.material = mats.make(0.5, 0.5, 0.55); stem.parent = parent; stem.position.set(0, 0.74, 0);
      [0, Math.PI / 2].forEach((a, i) => {
        const blade = BABYLON.MeshBuilder.CreateBox('prb' + i, { width: 1.1, height: 0.03, depth: 0.14 }, s);
        blade.material = mats.gold; blade.parent = parent; blade.position.set(0, 0.9, 0); blade.rotation.y = a;
      });
    },
  },
  {
    id: 'pirate', slot: 'hat', layer: 'front', en: 'Pirate Hat', ar: 'قبعة قرصان', cost: 95, icon: '🏴‍☠️',
    render2d: ({ gold, accent }) => (
      <g>
        <path d="M-22,-4 C-14,-22 14,-22 22,-4 C24,0 20,2 16,0 C8,4 -8,4 -16,0 C-20,2 -24,0 -22,-4 Z" fill="#15151c" />
        <path d="M-22,-4 C-14,-22 14,-22 22,-4" fill="none" stroke={gold || accent} strokeWidth="1.6" />
        <circle cx="0" cy="-9" r="3.4" fill="#f4efe6" />
        <circle cx="-1.2" cy="-9.8" r="0.8" fill="#15151c" /><circle cx="1.2" cy="-9.8" r="0.8" fill="#15151c" />
        <path d="M-3,-6.5 L3,-6.5 M-2.5,-5 L2.5,-5" stroke="#f4efe6" strokeWidth="1.1" strokeLinecap="round" />
        <path d="M-4.5,-13 L4.5,-5 M4.5,-13 L-4.5,-5" stroke="#f4efe6" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const brim = BABYLON.MeshBuilder.CreateSphere('pir', { diameter: 1.5, segments: 12 }, s);
      brim.scaling = new BABYLON.Vector3(1, 0.34, 0.78);
      brim.material = mats.black; brim.parent = parent; brim.position.set(0, 0.55, 0); shadow.addShadowCaster(brim);
      const crown = BABYLON.MeshBuilder.CreateSphere('pic', { diameter: 0.85, segments: 10 }, s);
      crown.scaling = new BABYLON.Vector3(1, 0.6, 0.85);
      crown.material = mats.black; crown.parent = parent; crown.position.set(0, 0.62, 0);
      const band = BABYLON.MeshBuilder.CreateTorus('pib', { diameter: 1.45, thickness: 0.06, tessellation: 20 }, s);
      band.material = mats.gold; band.parent = parent; band.position.set(0, 0.56, 0); band.scaling.z = 0.78;
      const skull = BABYLON.MeshBuilder.CreateSphere('pis', { diameter: 0.22 }, s);
      skull.material = mats.make(0.93, 0.91, 0.86); skull.parent = parent; skull.position.set(0, 0.62, 0.6);
    },
  },

  // ───────── FACE ─────────
  {
    id: 'shades', slot: 'face', layer: 'front', en: 'Cool Shades', ar: 'نظارات شمسية', cost: 60, icon: '😎',
    render2d: ({ gold, accent }) => (
      <g>
        <rect x="-15" y="-4" width="12" height="8" rx="3" fill="#0a0a0d" />
        <rect x="3" y="-4" width="12" height="8" rx="3" fill="#0a0a0d" />
        <rect x="-3" y="-2.5" width="6" height="2" rx="1" fill={gold || accent} />
        <path d="M-15,-2 L-21,-3 M15,-2 L21,-3" stroke="#0a0a0d" strokeWidth="2" strokeLinecap="round" />
        <path d="M-13,-2 L-6,-2 M5,-2 L12,-2" stroke="#fff" strokeWidth="1.2" opacity="0.35" strokeLinecap="round" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const bar = BABYLON.MeshBuilder.CreateBox('shd', { width: 0.62, height: 0.16, depth: 0.1 }, s); bar.material = mats.black; bar.parent = parent; bar.position.set(0, 0.05, 0.46);
    },
  },
  {
    id: 'stache', slot: 'face', layer: 'front', en: 'Fancy Stache', ar: 'شارب مضحك', cost: 25, icon: '🥸',
    render2d: () => (
      <g>
        <path d="M0,7 C-3,4 -7,4 -12,7 C-9,11 -3,11 0,8 C3,11 9,11 12,7 C7,4 3,4 0,7 Z" fill="#2a1d12" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const m = BABYLON.MeshBuilder.CreateBox('stc', { width: 0.34, height: 0.08, depth: 0.08 }, s); m.material = mats.make(0.16, 0.11, 0.07); m.parent = parent; m.position.set(0, -0.16, 0.47);
    },
  },

  {
    id: 'monocle', slot: 'face', layer: 'front', en: 'Fancy Monocle', ar: 'نظارة أحادية', cost: 70, icon: '🧐',
    render2d: ({ gold, accent }) => (
      <g>
        <circle cx="8" cy="0" r="7" fill="rgba(180,220,255,0.18)" stroke={gold || accent} strokeWidth="2" />
        <path d="M8,7 C9,14 12,18 11,24" fill="none" stroke={gold || accent} strokeWidth="1" strokeDasharray="2 1.6" />
        <path d="M4,-3 A5,5 0 0 1 11,-4" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.5" strokeLinecap="round" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const ring = BABYLON.MeshBuilder.CreateTorus('mnc', { diameter: 0.26, thickness: 0.035, tessellation: 18 }, s);
      ring.rotation.x = Math.PI / 2;
      ring.material = mats.gold; ring.parent = parent; ring.position.set(0.18, 0.05, 0.48);
      const chain = BABYLON.MeshBuilder.CreateCylinder('mnch', { diameter: 0.018, height: 0.4 }, s);
      chain.material = mats.gold; chain.parent = parent; chain.position.set(0.26, -0.18, 0.44); chain.rotation.z = 0.25;
    },
  },
  {
    id: 'clownnose', slot: 'face', layer: 'front', en: 'Clown Nose', ar: 'أنف مهرج', cost: 15, icon: '🤡',
    render2d: () => (
      <g>
        <circle cx="0" cy="5" r="6.5" fill="#e8453c" />
        <circle cx="-2" cy="3" r="2.2" fill="#ff8a80" opacity="0.85" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const nose = BABYLON.MeshBuilder.CreateSphere('cln', { diameter: 0.26, segments: 10 }, s);
      nose.material = mats.make(0.9, 0.22, 0.18, [0.25, 0.04, 0.03]);
      nose.parent = parent; nose.position.set(0, -0.06, 0.52);
    },
  },

  // ───────── NECK ─────────
  {
    id: 'scarf', slot: 'neck', layer: 'front', en: 'Red Scarf', ar: 'وشاح أحمر', cost: 40, icon: '🧣',
    render2d: () => (
      <g>
        <path d="M-16,-2 C-8,8 8,8 16,-2 C18,8 10,15 0,16 C-10,15 -18,8 -16,-2 Z" fill="#c0392b" />
        <path d="M6,11 L14,33 L4,33 L0,13 Z" fill="#a83024" />
        <path d="M6,11 L14,33 L9,33 L4,12 Z" fill="#d9503f" opacity="0.7" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const mk = mats.make(0.75, 0.22, 0.17);
      const ring = BABYLON.MeshBuilder.CreateTorus('scf', { diameter: 0.62, thickness: 0.16, tessellation: 16 }, s); ring.rotation.x = Math.PI / 2; ring.material = mk; ring.parent = parent; ring.position.set(0, 0, 0); shadow.addShadowCaster(ring);
      const tail = BABYLON.MeshBuilder.CreateBox('sct', { width: 0.24, height: 0.7, depth: 0.1 }, s); tail.material = mk; tail.parent = parent; tail.position.set(0.18, -0.42, 0.28);
    },
  },
  {
    id: 'bling', slot: 'neck', layer: 'front', en: 'Gold Bling', ar: 'سلسلة ذهب', cost: 120, icon: '📿',
    render2d: ({ gold, accent }) => (
      <g>
        <path d="M-14,-3 Q0,16 14,-3" fill="none" stroke={gold || accent} strokeWidth="2.6" />
        <path d="M0,11 L5,16 L0,22 L-5,16 Z" fill={gold || accent} stroke="#7a5408" strokeWidth="0.6" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const ch = BABYLON.MeshBuilder.CreateTorus('bl', { diameter: 0.58, thickness: 0.07, tessellation: 18 }, s); ch.rotation.x = Math.PI / 2; ch.material = mats.gold; ch.parent = parent; ch.position.set(0, 0, 0);
      const med = BABYLON.MeshBuilder.CreatePolyhedron('blm', { type: 1, size: 0.16 }, s); med.material = mats.gold; med.parent = parent; med.position.set(0, -0.28, 0.26);
    },
  },

  {
    id: 'bowtie', slot: 'neck', layer: 'front', en: 'Dapper Bow Tie', ar: 'ربطة عنق أنيقة', cost: 35, icon: '🎀',
    render2d: ({ gold, accent }) => (
      <g>
        <path d="M-2,4 L-15,-2 C-17,-1 -17,9 -15,10 L-2,6 Z" fill="#c0392b" />
        <path d="M2,4 L15,-2 C17,-1 17,9 15,10 L2,6 Z" fill="#c0392b" />
        <path d="M-13,0 L-4,4 M-13,8 L-4,5.5 M13,0 L4,4 M13,8 L4,5.5" stroke="#8e2a20" strokeWidth="1" opacity="0.7" />
        <rect x="-3" y="1.5" width="6" height="6.5" rx="1.6" fill={gold || accent} />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats }) => {
      const red = mats.make(0.75, 0.22, 0.17);
      [-1, 1].forEach((sgn) => {
        const wing = BABYLON.MeshBuilder.CreateCylinder('bt', { diameterTop: 0.28, diameterBottom: 0.06, height: 0.32, tessellation: 8 }, s);
        wing.material = red; wing.parent = parent;
        wing.rotation.z = sgn * Math.PI / 2;
        wing.position.set(sgn * 0.18, -0.02, 0.3);
      });
      const knot = BABYLON.MeshBuilder.CreateSphere('btk', { diameter: 0.14 }, s);
      knot.material = mats.gold; knot.parent = parent; knot.position.set(0, -0.02, 0.32);
    },
  },

  // ───────── BACK ─────────
  {
    id: 'jetpack', slot: 'back', layer: 'back', en: 'Rocket Jetpack', ar: 'حقيبة صاروخية', cost: 200, icon: '🚀', iconBox: '-20 -2 40 46',
    render2d: ({ gold, accent }) => (
      <g>
        <rect x="-16" y="2" width="13" height="26" rx="6" fill="#3a3f4d" />
        <rect x="3" y="2" width="13" height="26" rx="6" fill="#4a505f" />
        <rect x="-16" y="6" width="13" height="4" fill={gold || accent} />
        <rect x="3" y="6" width="13" height="4" fill={gold || accent} />
        <path d="M-13,28 L-9.5,40 L-6,28 Z" fill="#ff9f2e" />
        <path d="M-12,28 L-9.5,35 L-7,28 Z" fill="#ffe14a" />
        <path d="M6,28 L9.5,40 L13,28 Z" fill="#ff9f2e" />
        <path d="M7,28 L9.5,35 L12,28 Z" fill="#ffe14a" />
        <ellipse cx="-12" cy="8" rx="1.6" ry="6" fill="#fff" opacity="0.18" />
        <ellipse cx="7" cy="8" rx="1.6" ry="6" fill="#fff" opacity="0.18" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const metal = mats.make(0.28, 0.3, 0.36);
      const flameM = mats.make(1, 0.62, 0.15, [0.9, 0.45, 0.08]);
      [-1, 1].forEach((sgn) => {
        const tank = BABYLON.MeshBuilder.CreateCylinder('jpt', { diameter: 0.34, height: 0.95, tessellation: 12 }, s);
        tank.material = metal; tank.parent = parent; tank.position.set(sgn * 0.24, -0.25, -0.22); shadow.addShadowCaster(tank);
        const cap = BABYLON.MeshBuilder.CreateSphere('jpc', { diameter: 0.34, segments: 8 }, s);
        cap.material = metal; cap.parent = parent; cap.position.set(sgn * 0.24, 0.24, -0.22);
        const band = BABYLON.MeshBuilder.CreateTorus('jpb', { diameter: 0.34, thickness: 0.04, tessellation: 12 }, s);
        band.material = mats.gold; band.parent = parent; band.position.set(sgn * 0.24, 0.05, -0.22);
        const flame = BABYLON.MeshBuilder.CreateCylinder('jpf', { diameterTop: 0.18, diameterBottom: 0, height: 0.4, tessellation: 8 }, s);
        flame.material = flameM; flame.parent = parent; flame.position.set(sgn * 0.24, -0.92, -0.22);
        if (mats.glow) mats.glow(flame);
      });
    },
  },
  {
    id: 'cape', slot: 'back', layer: 'back', en: 'Hero Cape', ar: 'عباءة البطل', cost: 130, icon: '🦸', iconBox: '-28 -4 56 94',
    render2d: () => (
      <g>
        <path d="M-15,0 C-24,28 -22,66 -17,86 L17,86 C22,66 24,28 15,0 C8,8 -8,8 -15,0 Z" fill="#7a1f2b" />
        <path d="M0,4 C-3,30 -3,60 0,84 C3,60 3,30 0,4 Z" fill="#5a1620" opacity="0.6" />
        <path d="M-15,0 C-20,24 -19,56 -15,80" fill="none" stroke="#9a3140" strokeWidth="2" opacity="0.5" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const cape = BABYLON.MeshBuilder.CreateBox('cap', { width: 1.1, height: 1.7, depth: 0.06 }, s); cape.material = mats.make(0.48, 0.12, 0.17); cape.parent = parent; cape.rotation.x = -0.12; cape.position.set(0, -0.8, -0.12); shadow.addShadowCaster(cape);
    },
  },
  {
    id: 'wings', slot: 'back', layer: 'back', en: 'Hero Wings', ar: 'أجنحة البطل', cost: 160, icon: '🪽', iconBox: '-50 -14 100 32',
    render2d: ({ gold, accent }) => (
      <g>
        <path d="M-4,4 C-22,-8 -38,-10 -46,-2 C-38,2 -34,6 -30,12 C-24,8 -14,8 -4,10 Z" fill="#f4e8c8" stroke={gold || accent} strokeWidth="1.5" />
        <path d="M4,4 C22,-8 38,-10 46,-2 C38,2 34,6 30,12 C24,8 14,8 4,10 Z" fill="#f4e8c8" stroke={gold || accent} strokeWidth="1.5" />
        <path d="M-10,2 C-20,-3 -30,-4 -38,-1 M10,2 C20,-3 30,-4 38,-1" fill="none" stroke={gold || accent} strokeWidth="1" opacity="0.6" />
      </g>
    ),
    build3d: ({ BABYLON, s, parent, mats, shadow }) => {
      const feather = mats.make(0.95, 0.91, 0.78, [0.18, 0.16, 0.1]);
      [-1, 1].forEach((sgn) => {
        const main = BABYLON.MeshBuilder.CreateSphere('wing', { diameter: 1.1, segments: 10 }, s);
        main.scaling = new BABYLON.Vector3(1.25, 0.42, 0.16);
        main.material = feather; main.parent = parent;
        main.position.set(sgn * 0.78, 0.22, -0.06);
        main.rotation.z = sgn * 0.55; main.rotation.y = sgn * -0.25;
        shadow.addShadowCaster(main);
        const tip = BABYLON.MeshBuilder.CreateSphere('wingTip', { diameter: 0.7, segments: 8 }, s);
        tip.scaling = new BABYLON.Vector3(1.1, 0.3, 0.14);
        tip.material = feather; tip.parent = parent;
        tip.position.set(sgn * 1.28, -0.12, -0.08);
        tip.rotation.z = sgn * 0.95; tip.rotation.y = sgn * -0.25;
      });
    },
  },
  {
    id: 'balloon', slot: 'back', layer: 'front', attach: 'hand', en: 'Party Balloon', ar: 'بالون', cost: 20, icon: '🎈', iconBox: '-2 -84 36 92',
    render2d: () => (
      <g>
        <path d="M2,2 C8,-16 14,-34 17,-54" fill="none" stroke="#ccc" strokeWidth="1" />
        <ellipse cx="17" cy="-64" rx="11" ry="14" fill="#ff5d73" />
        <path d="M17,-50 l-2.5,3.5 5,0 Z" fill="#ff5d73" />
        <ellipse cx="13" cy="-68" rx="3.4" ry="5" fill="#fff" opacity="0.42" />
      </g>
    ),
    // Held in the hand: string rises from the hand to a floating balloon.
    build3d: ({ BABYLON, s, parent, mats }) => {
      const str = BABYLON.MeshBuilder.CreateCylinder('bls', { diameter: 0.025, height: 1.5 }, s); str.material = mats.make(0.75, 0.75, 0.75); str.parent = parent; str.position.set(0.05, 0.75, 0);
      const b = BABYLON.MeshBuilder.CreateSphere('blb', { diameter: 0.85, segments: 12 }, s); b.scaling = new BABYLON.Vector3(1, 1.2, 1); b.material = mats.make(1, 0.36, 0.45); b.parent = parent; b.position.set(0.1, 1.65, 0);
    },
  },
];

export const ITEMS_BY_ID = Object.fromEntries(ITEMS.map((it) => [it.id, it]));

/** Render the equipped items for one draw layer ('front' | 'back'). */
export function equipped2d(equipped, anchors, layer, props) {
  if (!equipped) return null;
  return DRAW_ORDER.map((slot) => {
    const it = ITEMS_BY_ID[equipped[slot]];
    const a = anchors[slot];
    if (!it || it.layer !== layer || !a) return null;
    return (
      <g key={slot} transform={`translate(${a.x} ${a.y}) scale(${a.s})`}>
        {it.render2d(props)}
      </g>
    );
  });
}

// ── FUR COLORS (recolor preview, no extra art) ──
export const FUR_COLORS = [
  { id: 'shadow', en: 'Shadow', ar: 'ظل', fur: '#0e0e16', cost: 0 },
  { id: 'gold', en: 'Golden', ar: 'ذهبي', fur: '#caa23c', cost: 150 },
  { id: 'frost', en: 'Frost', ar: 'صقيع', fur: '#33506b', cost: 150 },
];
