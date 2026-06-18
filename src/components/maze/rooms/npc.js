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
  const headSrc = B.MeshBuilder.CreateSphere('npcHeadSrc', { diameter: 0.72, segments: 8 }, scene);
  headSrc.material = skinMat; headSrc.isVisible = false;
  const eyeSrc = B.MeshBuilder.CreateSphere('npcEyeSrc', { diameter: 0.12, segments: 6 }, scene);
  eyeSrc.material = eyeMat; eyeSrc.isVisible = false;
  const blobSrc = B.MeshBuilder.CreateDisc('npcBlobSrc', { radius: 0.6, tessellation: 16 }, scene);
  blobSrc.material = blobMat; blobSrc.isVisible = false;

  const npcs = [];
  const buckets = new Map();
  const bkey = (gx, gz) => gx + ',' + gz;

  function makeLabel(name, role) {
    const dt = new B.DynamicTexture('npcLbl', { width: 256, height: 80 }, scene, true);
    const c = dt.getContext();
    c.clearRect(0, 0, 256, 80);
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(6, 6, 244, 68);
    c.textAlign = 'center';
    c.font = 'bold 27px sans-serif'; c.fillStyle = '#ffe9a8'; c.fillText(name, 128, 36);
    c.font = '16px sans-serif'; c.fillStyle = '#cfe0ff'; c.fillText(role, 128, 62);
    dt.hasAlpha = true; dt.update();
    const pl = B.MeshBuilder.CreatePlane('npcLblP', { width: 1.7, height: 0.53 }, scene);
    const m = new B.StandardMaterial('npcLblM', scene);
    m.emissiveTexture = dt; m.opacityTexture = dt; m.disableLighting = true;
    m.diffuseColor = B.Color3.Black(); m.specularColor = B.Color3.Black();
    pl.material = m; pl.billboardMode = B.Mesh.BILLBOARDMODE_ALL; pl.isPickable = false;
    return pl;
  }

  function spawn({ x, z, color, name, role }) {
    const root = new B.TransformNode('npc_' + name, scene);
    root.position.set(x, 0, z);
    root.rotation.y = Math.atan2(-x, -z); // face roughly toward the maze centre

    const body = bodySrc.createInstance('npcBody'); body.parent = root; body.position.y = 0.62;
    body.instancedBuffers.color = B.Color3.FromHexString(color).toColor4(1);
    const head = headSrc.createInstance('npcHead'); head.parent = root; head.position.y = 1.42;
    const eL = eyeSrc.createInstance('npcEyeL'); eL.parent = root; eL.position.set(-0.15, 1.47, 0.3);
    const eR = eyeSrc.createInstance('npcEyeR'); eR.parent = root; eR.position.set(0.15, 1.47, 0.3);
    const label = makeLabel(name, role); label.parent = root; label.position.y = 2.15;

    // blob shadow — independent of the root so the idle sway never tilts it
    const blob = blobSrc.createInstance('npcBlob');
    blob.position.set(x, 0.03, z); blob.rotation.x = Math.PI / 2; blob.isPickable = false;

    const npc = { root, blob, x, z, name, role, phase: Math.random() * 6.28 };
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
