/**
 * NPC kit — cheap, scalable standing characters for the rooms (the future
 * army-recruitment people). Built perf-correct per the PERFORMANCE strategy so
 * the army never gets heavy:
 *   • SHARED geometry: every NPC body/head/eye is an INSTANCE of one source mesh
 *     → a handful of draw calls no matter how many NPCs (per-NPC tint via the
 *     built-in instanced "color" buffer, so no per-NPC materials/textures).
 *   • BLOB SHADOWS: a flat dark disc under each NPC instead of real shadow
 *     casters (real casters scale terribly with count).
 *   • GRID-BUCKET proximity: "is the player near an NPC" is an O(1) lookup in a
 *     spatial hash, not a loop over every NPC each frame.
 *   • DISTANCE-THROTTLED idle: only NPCs near the player animate; the rest are
 *     left static.
 *
 * createNpcKit(B, scene, { cell }) → { spawn(opts), update(playerPos, t), dispose() }
 */
export function createNpcKit(B, scene, { cell = 4, animateDist = 26, interactDist = 3.4 } = {}) {
  // ── Shared materials (one each, reused by all instances) ──
  const bodyMat = new B.StandardMaterial('npcBodyMat', scene);
  bodyMat.diffuseColor = new B.Color3(1, 1, 1); // tinted per-instance via color buffer
  bodyMat.specularColor = new B.Color3(0.05, 0.05, 0.05);
  bodyMat.maxSimultaneousLights = 6;
  const skinMat = new B.StandardMaterial('npcSkinMat', scene);
  skinMat.diffuseColor = B.Color3.FromHexString('#e0b48a');
  skinMat.specularColor = new B.Color3(0.05, 0.05, 0.05);
  skinMat.maxSimultaneousLights = 6;
  const eyeMat = new B.StandardMaterial('npcEyeMat', scene);
  eyeMat.diffuseColor = B.Color3.FromHexString('#1a1410'); eyeMat.specularColor = new B.Color3(0, 0, 0);
  const blobMat = new B.StandardMaterial('npcBlobMat', scene);
  blobMat.diffuseColor = B.Color3.Black(); blobMat.specularColor = B.Color3.Black();
  blobMat.disableLighting = true; blobMat.alpha = 0.32;

  // ── Source meshes (hidden; only their instances render) ──
  const bodySrc = B.MeshBuilder.CreateCapsule('npcBodySrc', { height: 1.0, radius: 0.34, tessellation: 8, capSubdivisions: 3 }, scene);
  bodySrc.material = bodyMat; bodySrc.isVisible = false;
  bodySrc.registerInstancedBuffer('color', 4);
  bodySrc.instancedBuffers.color = new B.Color4(1, 1, 1, 1);
  // Arms — shared instanced capsule, tinted per-NPC to the body colour.
  const armSrc = B.MeshBuilder.CreateCapsule('npcArmSrc', { height: 0.62, radius: 0.11, tessellation: 6, capSubdivisions: 2 }, scene);
  armSrc.material = bodyMat; armSrc.isVisible = false;
  armSrc.registerInstancedBuffer('color', 4);
  armSrc.instancedBuffers.color = new B.Color4(1, 1, 1, 1);
  // Hands — shared instanced sphere in skin tone.
  const handSrc = B.MeshBuilder.CreateSphere('npcHandSrc', { diameter: 0.2, segments: 6 }, scene);
  handSrc.material = skinMat; handSrc.isVisible = false;
  const headSrc = B.MeshBuilder.CreateSphere('npcHeadSrc', { diameter: 0.72, segments: 8 }, scene);
  headSrc.material = skinMat; headSrc.isVisible = false;
  const eyeSrc = B.MeshBuilder.CreateSphere('npcEyeSrc', { diameter: 0.12, segments: 6 }, scene);
  eyeSrc.material = eyeMat; eyeSrc.isVisible = false;
  const blobSrc = B.MeshBuilder.CreateDisc('npcBlobSrc', { radius: 0.6, tessellation: 16 }, scene);
  blobSrc.material = blobMat; blobSrc.isVisible = false;

  const npcs = [];
  const buckets = new Map();
  const bkey = (gx, gz) => gx + ',' + gz;

  // Distinct headgear per soldier so they read as different characters.
  function addAccessory(root, type, hex) {
    const mat = (h, emis) => {
      const m = new B.StandardMaterial('npcAcc', scene);
      m.diffuseColor = B.Color3.FromHexString(h);
      m.specularColor = new B.Color3(0.1, 0.1, 0.1);
      if (emis) m.emissiveColor = B.Color3.FromHexString(emis);
      m.maxSimultaneousLights = 6;
      return m;
    };
    const metal = mat('#9aa3b0'), dark = mat('#2a2530'), col = mat(hex);
    const add = (mesh, m, x, y, z) => { mesh.material = m; mesh.parent = root; mesh.position.set(x, y, z); return mesh; };
    if (type === 'helmet') {
      add(B.MeshBuilder.CreateCylinder('h', { diameterTop: 0.66, diameterBottom: 0.82, height: 0.42, tessellation: 10 }, scene), metal, 0, 1.74, 0);
      add(B.MeshBuilder.CreateBox('hf', { width: 0.1, height: 0.46, depth: 0.5 }, scene), metal, 0, 2.0, 0); // crest
    } else if (type === 'wizard') {
      add(B.MeshBuilder.CreateCylinder('wz', { diameterTop: 0.02, diameterBottom: 0.74, height: 1.0, tessellation: 12 }, scene), col, 0, 2.1, 0);
      add(B.MeshBuilder.CreateTorus('wb', { diameter: 0.92, thickness: 0.12, tessellation: 12 }, scene), col, 0, 1.66, 0);
    } else if (type === 'cap') {
      const dome = add(B.MeshBuilder.CreateSphere('cp', { diameter: 0.8, segments: 10 }, scene), col, 0, 1.74, 0); dome.scaling.y = 0.55;
      add(B.MeshBuilder.CreateBox('vis', { width: 0.6, height: 0.08, depth: 0.32 }, scene), dark, 0, 1.66, 0.32); // visor
    } else if (type === 'topknot') {
      add(B.MeshBuilder.CreateSphere('tk', { diameter: 0.34, segments: 8 }, scene), dark, 0, 2.0, 0);
      add(B.MeshBuilder.CreateTorus('hb', { diameter: 0.84, thickness: 0.08, tessellation: 12 }, scene), col, 0, 1.64, 0);
    } else if (type === 'horns') {
      add(B.MeshBuilder.CreateCylinder('hl', { diameterTop: 0, diameterBottom: 0.18, height: 0.5, tessellation: 8 }, scene), metal, -0.3, 1.96, 0).rotation.z = 0.5;
      add(B.MeshBuilder.CreateCylinder('hr', { diameterTop: 0, diameterBottom: 0.18, height: 0.5, tessellation: 8 }, scene), metal, 0.3, 1.96, 0).rotation.z = -0.5;
      add(B.MeshBuilder.CreateCylinder('hbn', { diameter: 0.8, height: 0.16, tessellation: 12 }, scene), dark, 0, 1.74, 0);
    }
  }

  function spawn({ x, z, color, name, role, scale = 1, girth = 1, accessory = null }) {
    const root = new B.TransformNode('npc_' + name, scene);
    root.position.set(x, 0, z);
    root.rotation.y = Math.atan2(-x, -z); // face roughly toward the maze centre
    root.scaling.setAll(scale); // tougher soldiers are bigger

    const bodyCol = B.Color3.FromHexString(color).toColor4(1);
    const body = bodySrc.createInstance('npcBody'); body.parent = root; body.position.y = 0.62;
    body.scaling.x = body.scaling.z = girth; // wider = more muscle
    body.instancedBuffers.color = bodyCol;
    // Arms hanging at the sides, angled slightly outward + a hand at each end.
    const armX = 0.34 * girth + 0.12;
    [-1, 1].forEach((sgn) => {
      const arm = armSrc.createInstance('npcArm'); arm.parent = root;
      arm.position.set(sgn * armX, 0.78, 0);
      arm.rotation.z = sgn * 0.22;
      arm.instancedBuffers.color = bodyCol;
      const hand = handSrc.createInstance('npcHand'); hand.parent = root;
      hand.position.set(sgn * (armX + 0.06), 0.4, 0.02);
    });
    const head = headSrc.createInstance('npcHead'); head.parent = root; head.position.y = 1.42;
    const eL = eyeSrc.createInstance('npcEyeL'); eL.parent = root; eL.position.set(-0.15, 1.47, 0.3);
    const eR = eyeSrc.createInstance('npcEyeR'); eR.parent = root; eR.position.set(0.15, 1.47, 0.3);
    if (accessory) addAccessory(root, accessory, color);

    // blob shadow — independent of the root so the idle sway never tilts it
    const blob = blobSrc.createInstance('npcBlob');
    blob.position.set(x, 0.03, z); blob.rotation.x = Math.PI / 2; blob.isPickable = false;
    blob.scaling.x = blob.scaling.y = scale * girth; // shadow matches footprint

    const npc = { root, blob, body, x, z, name, role, phase: Math.random() * 6.28 };
    npcs.push(npc);
    const k = bkey(Math.floor(x / cell), Math.floor(z / cell));
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(npc);
    return npc;
  }

  // Returns the nearest NPC within interactDist (or null) + animates near ones.
  function update(p, t) {
    const pgx = Math.floor(p.x / cell), pgz = Math.floor(p.z / cell);
    let nearest = null, nd = interactDist;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const arr = buckets.get(bkey(pgx + dx, pgz + dz));
      if (!arr) continue;
      for (const n of arr) { const d = Math.hypot(p.x - n.x, p.z - n.z); if (d < nd) { nd = d; nearest = n; } }
    }
    for (const n of npcs) {
      if (Math.hypot(p.x - n.x, p.z - n.z) > animateDist) continue; // far → stay static
      n.root.position.y = Math.sin(t * 1.6 + n.phase) * 0.05;
      n.root.rotation.z = Math.sin(t * 1.2 + n.phase) * 0.04;
    }
    return nearest;
  }

  function dispose() {
    // scene.dispose() (called by the room) frees everything; nothing extra needed.
    npcs.length = 0; buckets.clear();
  }

  return { spawn, update, dispose };
}
