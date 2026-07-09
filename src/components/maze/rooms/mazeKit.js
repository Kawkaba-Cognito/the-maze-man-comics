/** Shared labyrinth geometry — same look as campaign floors, any map size. */
import { mulberry32 } from '../../../lib/rng';

export { mulberry32 };

export const CELL = 4;
export const WALL_H = 3;

export function wc(g, mapSize) { return (g - mapSize / 2 + 0.5) * CELL; }
export function gAt(w, mapSize) { return Math.floor(w / CELL + mapSize / 2); }

export function generateMaze(mapSize, openChance, seed) {
  const rng = mulberry32(seed);
  const maze = Array.from({ length: mapSize }, () => new Array(mapSize).fill(1));
  (function carve(x, y) {
    maze[y][x] = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => rng() - 0.5);
    for (const [dx, dy] of dirs) {
      const nx = x + dx * 2; const ny = y + dy * 2;
      if (nx > 0 && nx < mapSize - 1 && ny > 0 && ny < mapSize - 1 && maze[ny][nx] === 1) {
        maze[y + dy][x + dx] = 0;
        carve(nx, ny);
      }
    }
  })(1, 1);
  const cc = Math.floor(mapSize / 2);
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const yy = cc + dy; const xx = cc + dx;
    if (xx > 0 && xx < mapSize - 1 && yy > 0 && yy < mapSize - 1) maze[yy][xx] = 0;
  }
  for (let y = 1; y < mapSize - 1; y++) for (let x = 1; x < mapSize - 1; x++) {
    if (maze[y][x] !== 1) continue;
    let o = 0;
    if (maze[y - 1][x] === 0) o++;
    if (maze[y + 1][x] === 0) o++;
    if (maze[y][x - 1] === 0) o++;
    if (maze[y][x + 1] === 0) o++;
    if (o >= 2 && rng() < openChance) maze[y][x] = 0;
  }
  return maze;
}

export function findDeadEnd(maze, mapSize, fromGx, fromGz) {
  const ends = [];
  for (let y = 1; y < mapSize - 1; y++) for (let x = 1; x < mapSize - 1; x++) {
    if (maze[y][x] !== 0) continue;
    let n = 0;
    if (maze[y - 1][x] === 0) n++;
    if (maze[y + 1][x] === 0) n++;
    if (maze[y][x - 1] === 0) n++;
    if (maze[y][x + 1] === 0) n++;
    if (n === 1) ends.push([x, y]);
  }
  if (!ends.length) return [mapSize - 3, mapSize - 3];
  let best = ends[0]; let bd = -1;
  for (const [x, y] of ends) {
    const d = Math.hypot(x - fromGx, y - fromGz);
    if (d > bd) { bd = d; best = [x, y]; }
  }
  return best;
}

/** BFS walkable path between grid cells (includes start & end). */
export function findMazePath(maze, mapSize, [sx, sz], [ex, ez]) {
  if (maze[sz]?.[sx] !== 0 || maze[ez]?.[ex] !== 0) return null;
  const key = (x, y) => `${x},${y}`;
  const q = [[sx, sz]];
  const prev = new Map([[key(sx, sz), null]]);
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === ex && y === ez) {
      const path = [];
      let c = key(ex, ez);
      while (c) {
        const [px, py] = c.split(',').map(Number);
        path.unshift([px, py]);
        c = prev.get(c);
      }
      return path;
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx; const ny = y + dy;
      const k = key(nx, ny);
      if (nx < 0 || nx >= mapSize || ny < 0 || ny >= mapSize) continue;
      if (maze[ny][nx] !== 0 || prev.has(k)) continue;
      prev.set(k, key(x, y));
      q.push([nx, ny]);
    }
  }
  return null;
}

/** Pick N cells spaced along a path (0 = start, 1 = end). */
export function cellsAlongPath(path, fractions) {
  if (!path?.length) return [];
  const last = path.length - 1;
  return fractions.map((f) => path[Math.min(last, Math.max(0, Math.round(last * f)))]);
}

export function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

export function createMazeMaterials(B, scene, floorHex, wallHex) {
  const pix = (name, draw, n = 16) => {
    const t = new B.DynamicTexture(name, { width: n, height: n }, scene, false);
    draw(t.getContext(), n); t.update();
    t.updateSamplingMode(B.Texture.NEAREST_SAMPLINGMODE);
    t.wrapU = t.wrapV = B.Texture.WRAP_ADDRESSMODE;
    return t;
  };
  const speck = (c, base, cols, n = 16) => {
    c.fillStyle = base; c.fillRect(0, 0, n, n);
    for (let i = 0; i < n * n * 0.25; i++) {
      c.fillStyle = cols[(Math.random() * cols.length) | 0];
      c.fillRect((Math.random() * n) | 0, (Math.random() * n) | 0, 1, 1);
    }
  };
  const toon = (name, hex, tex, glow = 0.1) => {
    const m = new B.StandardMaterial(name, scene);
    const col = B.Color3.FromHexString(hex);
    if (tex) m.diffuseTexture = tex; else m.diffuseColor = col;
    m.emissiveColor = col.scale(glow);
    m.specularColor = new B.Color3(0, 0, 0);
    m.ambientColor = new B.Color3(1, 1, 1);
    m.maxSimultaneousLights = 2;
    return m;
  };

  const floorTex = pix('mzFloor', (c) => {
    speck(c, floorHex, ['#bdb6a6', '#d8d2c4', '#c2bbab']);
    c.fillStyle = 'rgba(90,82,68,0.45)'; c.fillRect(0, 0, 16, 1); c.fillRect(0, 0, 1, 16);
  });
  const wallTex = pix('mzWall', (c) => {
    speck(c, wallHex, ['#6f8cc4', '#90abdc', '#6986bc']);
    c.fillStyle = 'rgba(38,48,78,0.55)';
    for (let y = 0; y < 16; y += 4) c.fillRect(0, y, 16, 1);
    for (let x = 0; x < 16; x += 8) c.fillRect(x, 0, 1, 16);
  });

  return { toon, floorTex, wallTex };
}

export function buildMazeMeshes(B, scene, maze, mapSize, { toon, floorTex, wallTex, floorHex, wallHex }) {
  floorTex.uScale = floorTex.vScale = mapSize;

  const floorMat = toon('mzFloorMat', floorHex, floorTex, 0.05);
  const floorMesh = B.MeshBuilder.CreateBox('mzFloor', { width: mapSize * CELL, height: 0.4, depth: mapSize * CELL }, scene);
  floorMesh.position.y = -0.2;
  floorMesh.material = floorMat;
  floorMesh.freezeWorldMatrix();

  const wall = B.MeshBuilder.CreateBox('mzWalls', { width: CELL, height: WALL_H, depth: CELL }, scene);
  wall.material = toon('mzWallMat', wallHex, wallTex, 0.08);
  wall.isPickable = false;
  const trim = B.MeshBuilder.CreateBox('mzTrim', { width: CELL, height: 0.25, depth: CELL }, scene);
  trim.material = toon('mzTrimMat', '#ffce4a', null, 0.3);
  trim.isPickable = false;

  const wMats = [];
  const tMats = [];
  for (let gz = 0; gz < mapSize; gz++) for (let gx = 0; gx < mapSize; gx++) if (maze[gz][gx] === 1) {
    wMats.push(B.Matrix.Translation(wc(gx, mapSize), WALL_H / 2, wc(gz, mapSize)));
    tMats.push(B.Matrix.Translation(wc(gx, mapSize), WALL_H + 0.12, wc(gz, mapSize)));
  }
  wall.thinInstanceAdd(wMats);
  trim.thinInstanceAdd(tMats);
  wall.freezeWorldMatrix();
  trim.freezeWorldMatrix();

  return { floorMesh, wall, trim };
}

export function makeExitPortal(B, scene, toon, gx, gz, mapSize, color = '#16d39a') {
  const exitPos = new B.Vector3(wc(gx, mapSize), 0.6, wc(gz, mapSize));
  const exitPad = B.MeshBuilder.CreateCylinder('exitPad', { diameter: 2.8, height: 0.35, tessellation: 16 }, scene);
  exitPad.position = exitPos;
  exitPad.material = toon('exitMat', color, null, 0.55);
  const exitBeacon = B.MeshBuilder.CreateSphere('exitBeacon', { diameter: 1.2, segments: 10 }, scene);
  exitBeacon.position = new B.Vector3(wc(gx, mapSize), 1.5, wc(gz, mapSize));
  exitBeacon.material = toon('exitBeaconMat', color, null, 0.85);
  return { exitPos, exitPad, exitBeacon };
}

/** Decorative gate arch for boss / exit (faces +Z — toward approaching player). */
export function makeBossGate(B, scene, toon, gx, gz, mapSize) {
  const x = wc(gx, mapSize);
  const z = wc(gz, mapSize);
  const root = new B.TransformNode('bossGate', scene);
  root.position.set(x, 0, z);
  const pillarMat = toon('gatePillar', '#5a5898', null, 0.15);
  const lintelMat = toon('gateLintel', '#9a68c8', null, 0.45);
  const glowMat = toon('gateGlow', '#c8a0ff', null, 0.75);
  const mk = (name, mesh, mat, px, py, pz, sx = 1, sy = 1, sz = 1) => {
    mesh.name = name;
    mesh.material = mat;
    mesh.parent = root;
    mesh.position.set(px, py, pz);
    mesh.scaling.set(sx, sy, sz);
    mesh.isPickable = false;
    return mesh;
  };
  mk('gpL', B.MeshBuilder.CreateBox('gpL', { width: 0.9, height: 4.2, depth: 0.9 }, scene), pillarMat, -2.2, 2.1, 0);
  mk('gpR', B.MeshBuilder.CreateBox('gpR', { width: 0.9, height: 4.2, depth: 0.9 }, scene), pillarMat, 2.2, 2.1, 0);
  mk('gpTop', B.MeshBuilder.CreateBox('gpTop', { width: 5.4, height: 0.7, depth: 1.1 }, scene), lintelMat, 0, 4.35, 0);
  mk('gpOrb', B.MeshBuilder.CreateSphere('gpOrb', { diameter: 1.4, segments: 10 }, scene), glowMat, 0, 3.2, 0.2);
  return root;
}

export function makeGridCollider(maze, mapSize) {
  return (x, z) => {
    const r = 0.7;
    const hit = (px, pz) => {
      const a = gAt(px, mapSize);
      const b = gAt(pz, mapSize);
      return a < 0 || a >= mapSize || b < 0 || b >= mapSize || maze[b][a] === 1;
    };
    return hit(x - r, z - r) || hit(x + r, z - r) || hit(x - r, z + r) || hit(x + r, z + r);
  };
}

export function setupMazeSky(B, scene) {
  const sky = B.Color3.FromHexString('#8fc6ef');
  scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new B.Color3(0.6, 0.6, 0.66);
}

export function setupMazeLights(B, scene, keyLight) {
  keyLight.intensity = 0.85;
  keyLight.direction = new B.Vector3(-0.4, -1, 0.5);
  const hemi = new B.HemisphericLight('mzHemi', new B.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7;
  hemi.diffuse = new B.Color3(1, 1, 1);
  hemi.groundColor = new B.Color3(0.55, 0.56, 0.62);
  hemi.specular = new B.Color3(0, 0, 0);
}

export const GATE_MAZE_STYLE = {
  mapSize: 9,
  openChance: 0.55,
  wallHex: '#8a7ec8',
  floorHex: '#d4c4a8',
  seed: 90210,
};

export function setupGateSky(B, scene) {
  const sky = B.Color3.FromHexString('#4a2868');
  scene.clearColor = new B.Color4(sky.r, sky.g, sky.b, 1);
  scene.ambientColor = new B.Color3(0.55, 0.48, 0.62);
}
