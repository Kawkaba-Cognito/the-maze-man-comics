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

  // ───────── BACK ─────────
  {
    id: 'cape', slot: 'back', layer: 'back', en: 'Hero Cape', ar: 'عباءة البطل', cost: 130, icon: '🦸',
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
    id: 'balloon', slot: 'back', layer: 'front', attach: 'hand', en: 'Party Balloon', ar: 'بالون', cost: 20, icon: '🎈',
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
