export const UNIVERSE_GRID_SIZE = 51;

export const UNIVERSE_ZONES = Object.freeze([
  {
    id: 'landing',
    label: 'Landing Zone',
    labelAr: 'منطقة الهبوط',
    center: { x: 7, y: 7 },
    halfWidth: 4,
    halfHeight: 4,
    state: 'empty',
    buildSlots: 2,
  },
  {
    id: 'north-expanse',
    label: 'Northern Expanse',
    labelAr: 'الامتداد الشمالي',
    center: { x: 25, y: 8 },
    halfWidth: 7,
    halfHeight: 4,
    state: 'empty',
    buildSlots: 4,
  },
  {
    id: 'west-frontier',
    label: 'Western Frontier',
    labelAr: 'الحدود الغربية',
    center: { x: 9, y: 25 },
    halfWidth: 5,
    halfHeight: 7,
    state: 'empty',
    buildSlots: 3,
  },
  {
    id: 'origin-basin',
    label: 'Origin Basin',
    labelAr: 'حوض البداية',
    center: { x: 25, y: 25 },
    halfWidth: 7,
    halfHeight: 7,
    state: 'empty',
    buildSlots: 6,
  },
  {
    id: 'east-reach',
    label: 'Eastern Reach',
    labelAr: 'الامتداد الشرقي',
    center: { x: 41, y: 25 },
    halfWidth: 5,
    halfHeight: 7,
    state: 'empty',
    buildSlots: 3,
  },
  {
    id: 'south-drift',
    label: 'Southern Drift',
    labelAr: 'الانجراف الجنوبي',
    center: { x: 25, y: 42 },
    halfWidth: 7,
    halfHeight: 5,
    state: 'empty',
    buildSlots: 4,
  },
  {
    id: 'far-frontier',
    label: 'Far Frontier',
    labelAr: 'الحدود البعيدة',
    center: { x: 43, y: 43 },
    halfWidth: 4,
    halfHeight: 4,
    state: 'empty',
    buildSlots: 2,
  },
]);

const ZONE_LINKS = Object.freeze([
  ['landing', 'north-expanse'],
  ['landing', 'west-frontier'],
  ['north-expanse', 'origin-basin'],
  ['west-frontier', 'origin-basin'],
  ['origin-basin', 'east-reach'],
  ['origin-basin', 'south-drift'],
  ['east-reach', 'far-frontier'],
  ['south-drift', 'far-frontier'],
]);

const zoneById = new Map(UNIVERSE_ZONES.map((zone) => [zone.id, zone]));

function carveRectangle(grid, center, halfWidth, halfHeight) {
  for (let y = center.y - halfHeight; y <= center.y + halfHeight; y += 1) {
    for (let x = center.x - halfWidth; x <= center.x + halfWidth; x += 1) {
      if (grid[y]?.[x] !== undefined) grid[y][x] = 0;
    }
  }
}

function carvePath(grid, from, to, width = 2) {
  const carveCell = (x, y) => {
    for (let offset = -width; offset <= width; offset += 1) {
      if (grid[y + offset]?.[x] !== undefined) grid[y + offset][x] = 0;
      if (grid[y]?.[x + offset] !== undefined) grid[y][x + offset] = 0;
    }
  };

  const xDirection = Math.sign(to.x - from.x);
  const yDirection = Math.sign(to.y - from.y);
  for (let x = from.x; x !== to.x; x += xDirection) carveCell(x, from.y);
  for (let y = from.y; y !== to.y; y += yDirection) carveCell(to.x, y);
  carveCell(to.x, to.y);
}

export function generateUniverseMaze(size = UNIVERSE_GRID_SIZE, random = Math.random) {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));

  const carveMaze = (x, y) => {
    grid[y][x] = 0;
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].sort(() => random() - 0.5);

    directions.forEach(([dx, dy]) => {
      const nextX = x + dx * 2;
      const nextY = y + dy * 2;
      if (
        nextX > 0 &&
        nextX < size - 1 &&
        nextY > 0 &&
        nextY < size - 1 &&
        grid[nextY][nextX] === 1
      ) {
        grid[y + dy][x + dx] = 0;
        carveMaze(nextX, nextY);
      }
    });
  };

  carveMaze(1, 1);

  UNIVERSE_ZONES.forEach((zone) => {
    carveRectangle(grid, zone.center, zone.halfWidth, zone.halfHeight);
  });

  ZONE_LINKS.forEach(([fromId, toId]) => {
    carvePath(grid, zoneById.get(fromId).center, zoneById.get(toId).center);
  });

  // The universe starts mostly unbuilt. Removing a stable portion of the
  // remaining interior walls creates broad, connected expanses while keeping
  // enough ancient structure to guide exploration.
  for (let y = 1; y < size - 1; y += 1) {
    for (let x = 1; x < size - 1; x += 1) {
      if (grid[y][x] === 1 && ((x * 17 + y * 29 + x * y) % 7) < 3) grid[y][x] = 0;
    }
  }

  return grid;
}

export function getUniverseZone(zoneId) {
  return zoneById.get(zoneId) || null;
}

export function findUniverseZoneAtWorldPosition(position, cellSize, size = UNIVERSE_GRID_SIZE) {
  const offset = (size * cellSize) / 2;
  const gridX = Math.round((position.x + offset) / cellSize);
  const gridY = Math.round((position.z + offset) / cellSize);

  return (
    UNIVERSE_ZONES.find(
      (zone) =>
        Math.abs(gridX - zone.center.x) <= zone.halfWidth &&
        Math.abs(gridY - zone.center.y) <= zone.halfHeight,
    ) || null
  );
}
