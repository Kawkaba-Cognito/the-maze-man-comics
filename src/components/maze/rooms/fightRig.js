/**
 * Procedural boxing rig — arms, legs, fists for cinematic punch/kick/block poses.
 */
function lerpA(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function zeroRot() { return { x: 0, y: 0, z: 0 }; }

/** Joint rotations (radians) — character faces local +Z. */
export const FIGHT_POSES = {
  guard: {
    torso: { x: 0.06, y: 0, z: 0 },
    head: { x: 0.05, y: 0, z: 0 },
    upperL: { x: -0.55, y: 0.15, z: 0.75 },
    foreL: { x: -1.55, y: 0, z: 0.1 },
    upperR: { x: -0.55, y: -0.15, z: -0.75 },
    foreR: { x: -1.55, y: 0, z: -0.1 },
    thighL: { x: 0.15, y: 0, z: 0.08 },
    shinL: { x: -0.2, y: 0, z: 0 },
    thighR: { x: -0.12, y: 0, z: -0.08 },
    shinR: { x: 0.18, y: 0, z: 0 },
  },
  block: {
    torso: { x: -0.12, y: 0, z: 0 },
    head: { x: -0.08, y: 0, z: 0 },
    upperL: { x: -0.95, y: 0.4, z: 0.55 },
    foreL: { x: -1.1, y: 0.5, z: 0.35 },
    upperR: { x: -0.95, y: -0.4, z: -0.55 },
    foreR: { x: -1.1, y: -0.5, z: -0.35 },
    thighL: { x: 0.25, y: 0, z: 0.12 },
    shinL: { x: -0.35, y: 0, z: 0 },
    thighR: { x: 0.2, y: 0, z: -0.12 },
    shinR: { x: -0.3, y: 0, z: 0 },
  },
  dodge: {
    torso: { x: -0.35, y: 0, z: 0.08 },
    head: { x: -0.2, y: 0.1, z: 0 },
    upperL: { x: -0.35, y: 0.2, z: 1.0 },
    foreL: { x: -1.7, y: 0, z: 0.2 },
    upperR: { x: -0.4, y: -0.1, z: -0.9 },
    foreR: { x: -1.65, y: 0, z: -0.15 },
    thighL: { x: 0.45, y: 0, z: 0.05 },
    shinL: { x: -0.55, y: 0, z: 0 },
    thighR: { x: 0.35, y: 0, z: -0.05 },
    shinR: { x: -0.45, y: 0, z: 0 },
  },
  jabL: {
    torso: { x: 0.1, y: -0.12, z: 0 },
    head: { x: 0.04, y: -0.08, z: 0 },
    upperL: { x: -1.35, y: 0.1, z: 0.45 },
    foreL: { x: -0.25, y: 0, z: 0.05 },
    upperR: { x: -0.65, y: -0.1, z: -0.85 },
    foreR: { x: -1.45, y: 0, z: -0.1 },
    thighL: { x: 0.08, y: 0, z: 0.1 },
    shinL: { x: -0.15, y: 0, z: 0 },
    thighR: { x: -0.05, y: 0, z: -0.1 },
    shinR: { x: 0.12, y: 0, z: 0 },
  },
  crossR: {
    torso: { x: 0.08, y: 0.18, z: 0 },
    head: { x: 0.02, y: 0.12, z: 0 },
    upperL: { x: -0.7, y: 0.1, z: 0.9 },
    foreL: { x: -1.5, y: 0, z: 0.15 },
    upperR: { x: -1.42, y: -0.08, z: -0.35 },
    foreR: { x: -0.18, y: 0, z: -0.05 },
    thighL: { x: 0.05, y: 0, z: 0.12 },
    shinL: { x: -0.12, y: 0, z: 0 },
    thighR: { x: -0.08, y: 0, z: -0.08 },
    shinR: { x: 0.1, y: 0, z: 0 },
  },
  hookL: {
    torso: { x: 0.05, y: -0.22, z: 0.12 },
    head: { x: 0.02, y: -0.15, z: 0.08 },
    upperL: { x: -0.55, y: 0.55, z: 1.35 },
    foreL: { x: -0.85, y: 0.35, z: 0.55 },
    upperR: { x: -0.75, y: -0.1, z: -0.75 },
    foreR: { x: -1.5, y: 0, z: -0.1 },
    thighL: { x: 0.12, y: 0, z: 0.15 },
    shinL: { x: -0.18, y: 0, z: 0 },
    thighR: { x: -0.05, y: 0, z: -0.1 },
    shinR: { x: 0.15, y: 0, z: 0 },
  },
  uppercutR: {
    torso: { x: -0.18, y: 0.08, z: 0 },
    head: { x: -0.1, y: 0.05, z: 0 },
    upperL: { x: -0.5, y: 0.2, z: 0.95 },
    foreL: { x: -1.55, y: 0, z: 0.15 },
    upperR: { x: -1.05, y: -0.05, z: -0.55 },
    foreR: { x: -1.75, y: 0, z: -0.2 },
    thighL: { x: 0.2, y: 0, z: 0.08 },
    shinL: { x: -0.28, y: 0, z: 0 },
    thighR: { x: 0.15, y: 0, z: -0.08 },
    shinR: { x: -0.22, y: 0, z: 0 },
  },
  bossHaymaker: {
    torso: { x: 0.12, y: 0.25, z: 0 },
    head: { x: 0.08, y: 0.18, z: 0 },
    upperL: { x: -0.45, y: 0.35, z: 1.05 },
    foreL: { x: -1.65, y: 0.15, z: 0.25 },
    upperR: { x: -1.55, y: -0.2, z: -0.45 },
    foreR: { x: -0.15, y: 0, z: -0.08 },
    thighL: { x: 0.18, y: 0, z: 0.12 },
    shinL: { x: -0.22, y: 0, z: 0 },
    thighR: { x: -0.15, y: 0, z: -0.1 },
    shinR: { x: 0.2, y: 0, z: 0 },
  },
  bossWindup: {
    torso: { x: -0.08, y: -0.28, z: 0 },
    head: { x: -0.05, y: -0.2, z: 0 },
    upperL: { x: -0.35, y: 0.15, z: 0.85 },
    foreL: { x: -1.75, y: 0, z: 0.2 },
    upperR: { x: 0.35, y: -0.35, z: -1.15 },
    foreR: { x: -1.85, y: 0, z: -0.35 },
    thighL: { x: 0.22, y: 0, z: 0.1 },
    shinL: { x: -0.25, y: 0, z: 0 },
    thighR: { x: -0.18, y: 0, z: -0.12 },
    shinR: { x: 0.28, y: 0, z: 0 },
  },
  bossKick: {
    torso: { x: -0.22, y: 0.15, z: 0 },
    head: { x: -0.12, y: 0.1, z: 0 },
    upperL: { x: -0.55, y: 0.2, z: 0.75 },
    foreL: { x: -1.45, y: 0, z: 0.1 },
    upperR: { x: -0.5, y: -0.15, z: -0.8 },
    foreR: { x: -1.4, y: 0, z: -0.1 },
    thighL: { x: 0.35, y: 0, z: 0.1 },
    shinL: { x: -0.35, y: 0, z: 0 },
    thighR: { x: -1.35, y: 0.05, z: -0.15 },
    shinR: { x: -0.15, y: 0, z: 0.05 },
  },
  bossKickWind: {
    torso: { x: 0.05, y: -0.1, z: 0 },
    head: { x: 0.02, y: -0.06, z: 0 },
    upperL: { x: -0.5, y: 0.15, z: 0.8 },
    foreL: { x: -1.5, y: 0, z: 0.1 },
    upperR: { x: -0.45, y: -0.12, z: -0.75 },
    foreR: { x: -1.45, y: 0, z: -0.1 },
    thighL: { x: 0.15, y: 0, z: 0.08 },
    shinL: { x: -0.2, y: 0, z: 0 },
    thighR: { x: 0.85, y: 0, z: -0.12 },
    shinR: { x: 1.45, y: 0, z: 0 },
  },
  hit: {
    torso: { x: 0.45, y: 0.15, z: 0.1 },
    head: { x: 0.35, y: 0.2, z: 0.12 },
    upperL: { x: 0.15, y: 0.45, z: 0.95 },
    foreL: { x: -0.55, y: 0.3, z: 0.4 },
    upperR: { x: 0.2, y: -0.35, z: -0.85 },
    foreR: { x: -0.45, y: -0.25, z: -0.35 },
    thighL: { x: 0.35, y: 0, z: 0.15 },
    shinL: { x: -0.4, y: 0, z: 0 },
    thighR: { x: 0.25, y: 0, z: -0.1 },
    shinR: { x: -0.35, y: 0, z: 0 },
  },
  ko: {
    torso: { x: 0.85, y: 0.1, z: 0.15 },
    head: { x: 0.55, y: 0.25, z: 0.2 },
    upperL: { x: 0.65, y: 0.35, z: 0.45 },
    foreL: { x: -0.25, y: 0.15, z: 0.2 },
    upperR: { x: 0.55, y: -0.2, z: -0.35 },
    foreR: { x: -0.15, y: -0.1, z: -0.15 },
    thighL: { x: 0.55, y: 0, z: 0.08 },
    shinL: { x: -0.15, y: 0, z: 0 },
    thighR: { x: 0.45, y: 0, z: -0.08 },
    shinR: { x: -0.12, y: 0, z: 0 },
  },
};

const JOINT_KEYS = [
  'torso', 'head', 'upperL', 'foreL', 'upperR', 'foreR',
  'thighL', 'shinL', 'thighR', 'shinR',
];

function mkMat(B, scene, hex, emis = 0.08) {
  const m = new B.StandardMaterial(`fr_${hex}_${Math.random()}`, scene);
  const c = B.Color3.FromHexString(hex);
  m.diffuseColor = c;
  m.emissiveColor = c.scale(emis);
  m.specularColor = new B.Color3(0.08, 0.08, 0.08);
  m.maxSimultaneousLights = 6;
  return m;
}

function mkLimb(B, scene, parent, name, len, rTop, mat) {
  const pivot = new B.TransformNode(`${name}P`, scene);
  pivot.parent = parent;
  const mesh = B.MeshBuilder.CreateCapsule(`${name}M`, {
    height: len, radius: rTop, tessellation: 8, capSubdivisions: 2,
  }, scene);
  mesh.parent = pivot;
  mesh.position.y = -len / 2;
  mesh.material = mat;
  mesh.isPickable = false;
  return pivot;
}

function mkFist(B, scene, parent, mat) {
  const fist = B.MeshBuilder.CreateBox('fist', { width: 0.22, height: 0.22, depth: 0.28 }, scene);
  fist.parent = parent;
  fist.position.y = -0.14;
  fist.material = mat;
  fist.isPickable = false;
  return fist;
}

function mkFoot(B, scene, parent, mat) {
  const foot = B.MeshBuilder.CreateBox('foot', { width: 0.28, height: 0.12, depth: 0.42 }, scene);
  foot.parent = parent;
  foot.position.set(0, -0.12, 0.08);
  foot.material = mat;
  foot.isPickable = false;
  return foot;
}

function setRot(node, r) {
  if (!node || !r) return;
  node.rotation.x = r.x;
  node.rotation.y = r.y;
  node.rotation.z = r.z;
}

export function attachFightRig(B, scene, npcRoot, { color = '#6a9fd8', skin = '#e0b48a', scale = 1 } = {}) {
  const clothMat = mkMat(B, scene, color, 0.06);
  const skinMat = mkMat(B, scene, skin, 0.04);
  const gloveMat = mkMat(B, scene, '#2a2530', 0.02);

  const chest = new B.TransformNode('frChest', scene);
  chest.parent = npcRoot;
  chest.position.y = 0.95 * scale;

  const torsoMesh = B.MeshBuilder.CreateCapsule('frTorso', {
    height: 0.85 * scale, radius: 0.32 * scale, tessellation: 10, capSubdivisions: 3,
  }, scene);
  torsoMesh.parent = chest;
  torsoMesh.position.y = 0.05 * scale;
  torsoMesh.material = clothMat;
  torsoMesh.isPickable = false;

  const headPivot = new B.TransformNode('frHeadP', scene);
  headPivot.parent = chest;
  headPivot.position.y = 0.55 * scale;
  const head = B.MeshBuilder.CreateSphere('frHead', { diameter: 0.62 * scale, segments: 10 }, scene);
  head.parent = headPivot;
  head.material = skinMat;
  head.isPickable = false;

  // Face — white eyes + dark pupils + a brow line, so the rig reads as a person.
  const eyeWhiteMat = mkMat(B, scene, '#f5f1ea', 0.18);
  const pupilMat = mkMat(B, scene, '#1a1410', 0.0);
  [-1, 1].forEach((sgn) => {
    const w = B.MeshBuilder.CreateSphere('frEyeW', { diameter: 0.16 * scale, segments: 8 }, scene);
    w.parent = head; w.position.set(sgn * 0.13 * scale, 0.04 * scale, 0.27 * scale);
    w.scaling.z = 0.6; w.material = eyeWhiteMat; w.isPickable = false;
    const p = B.MeshBuilder.CreateSphere('frEyeP', { diameter: 0.08 * scale, segments: 6 }, scene);
    p.parent = head; p.position.set(sgn * 0.13 * scale, 0.04 * scale, 0.31 * scale);
    p.material = pupilMat; p.isPickable = false;
    const brow = B.MeshBuilder.CreateBox('frBrow', { width: 0.18 * scale, height: 0.035 * scale, depth: 0.04 * scale }, scene);
    brow.parent = head; brow.position.set(sgn * 0.13 * scale, 0.13 * scale, 0.29 * scale);
    brow.rotation.z = sgn * 0.35; brow.material = pupilMat; brow.isPickable = false;
  });

  const shoulderL = new B.TransformNode('frShL', scene);
  shoulderL.parent = chest;
  shoulderL.position.set(-0.38 * scale, 0.42 * scale, 0);
  const shoulderR = new B.TransformNode('frShR', scene);
  shoulderR.parent = chest;
  shoulderR.position.set(0.38 * scale, 0.42 * scale, 0);

  const upperL = mkLimb(B, scene, shoulderL, 'frUpL', 0.38 * scale, 0.1 * scale, clothMat);
  const foreL = mkLimb(B, scene, upperL, 'frFoL', 0.34 * scale, 0.09 * scale, clothMat);
  mkFist(B, scene, foreL, gloveMat);

  const upperR = mkLimb(B, scene, shoulderR, 'frUpR', 0.38 * scale, 0.1 * scale, clothMat);
  const foreR = mkLimb(B, scene, upperR, 'frFoR', 0.34 * scale, 0.09 * scale, clothMat);
  mkFist(B, scene, foreR, gloveMat);

  const hip = new B.TransformNode('frHip', scene);
  hip.parent = chest;
  hip.position.y = -0.08 * scale;

  const thighL = mkLimb(B, scene, hip, 'frThL', 0.42 * scale, 0.12 * scale, clothMat);
  const shinL = mkLimb(B, scene, thighL, 'frShnL', 0.4 * scale, 0.1 * scale, clothMat);
  mkFoot(B, scene, shinL, gloveMat);
  const thighR = mkLimb(B, scene, hip, 'frThR', 0.42 * scale, 0.12 * scale, clothMat);
  const shinR = mkLimb(B, scene, thighR, 'frShnR', 0.4 * scale, 0.1 * scale, clothMat);
  mkFoot(B, scene, shinR, gloveMat);

  const joints = {
    torso: chest, head: headPivot,
    upperL, foreL, upperR, foreR,
    thighL, shinL, thighR, shinR,
  };

  function blendPoses(poseA, poseB, t) {
    const a = FIGHT_POSES[poseA] || FIGHT_POSES.guard;
    const b = FIGHT_POSES[poseB] || a;
    for (const key of JOINT_KEYS) {
      setRot(joints[key], lerpA(a[key] || zeroRot(), b[key] || zeroRot(), t));
    }
  }

  function applyPose(name, amt = 1) {
    const target = FIGHT_POSES[name] || FIGHT_POSES.guard;
    const base = FIGHT_POSES.guard;
    for (const key of JOINT_KEYS) {
      setRot(joints[key], lerpA(base[key], target[key], amt));
    }
  }

  function fistWorld(side) {
    const fore = side === 'L' ? foreL : foreR;
    const pos = fore.getAbsolutePosition().clone();
    pos.y += 0.5;
    pos.z += side === 'L' ? 0.35 : -0.35;
    return pos;
  }

  function footWorld(side) {
    const shin = side === 'L' ? shinL : shinR;
    const pos = shin.getAbsolutePosition().clone();
    pos.y += 0.2;
    return pos;
  }

  return { joints, blendPoses, applyPose, fistWorld, footWorld };
}

export function spawnPunchTrail(B, scene, mat, from, to) {
  const mid = from.add(to).scale(0.5);
  const dir = to.subtract(from);
  const len = dir.length();
  if (len < 0.05) return null;
  const streak = B.MeshBuilder.CreateBox('punchTrail', { width: 0.08, height: 0.08, depth: len }, scene);
  streak.material = mat;
  streak.position.copyFrom(mid);
  const ang = Math.atan2(dir.x, dir.z);
  streak.rotation.y = ang;
  streak.isPickable = false;
  return { mesh: streak, life: 1 };
}

export function spawnImpactSlash(B, scene, mat, pos, size = 2.4) {
  const slash = B.MeshBuilder.CreatePlane('slash', { size }, scene);
  slash.material = mat;
  slash.position.copyFrom(pos);
  slash.billboardMode = B.Mesh.BILLBOARDMODE_Y;
  slash.rotation.z = (Math.random() - 0.5) * 0.9;
  slash.isPickable = false;
  return { mesh: slash, life: 1 };
}
