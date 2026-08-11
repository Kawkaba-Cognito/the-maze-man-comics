import assert from 'node:assert/strict';
import {
  generateUniverseMaze,
  UNIVERSE_GRID_SIZE,
  UNIVERSE_ZONES,
} from '../src/features/universe/universeZones.mjs';

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const maze = generateUniverseMaze(UNIVERSE_GRID_SIZE, seededRandom(20260811));
const size = UNIVERSE_GRID_SIZE;

assert.equal(maze.length, size, 'Universe grid height changed unexpectedly.');
assert.ok(maze.every((row) => row.length === size), 'Universe rows must have equal width.');

for (let index = 0; index < size; index += 1) {
  assert.equal(maze[0][index], 1, 'The northern world boundary must remain closed.');
  assert.equal(maze[size - 1][index], 1, 'The southern world boundary must remain closed.');
  assert.equal(maze[index][0], 1, 'The western world boundary must remain closed.');
  assert.equal(maze[index][size - 1], 1, 'The eastern world boundary must remain closed.');
}

assert.equal(
  new Set(UNIVERSE_ZONES.map((zone) => zone.id)).size,
  UNIVERSE_ZONES.length,
  'Universe zone IDs must be unique.',
);

UNIVERSE_ZONES.forEach((zone) => {
  for (let y = zone.center.y - zone.halfHeight; y <= zone.center.y + zone.halfHeight; y += 1) {
    for (let x = zone.center.x - zone.halfWidth; x <= zone.center.x + zone.halfWidth; x += 1) {
      assert.equal(maze[y][x], 0, `${zone.id} contains an unexpected wall at ${x},${y}.`);
    }
  }
});

const landing = UNIVERSE_ZONES.find((zone) => zone.id === 'landing');
const queue = [[landing.center.x, landing.center.y]];
const visited = new Set(queue.map(([x, y]) => `${x},${y}`));

for (let cursor = 0; cursor < queue.length; cursor += 1) {
  const [x, y] = queue[cursor];
  [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ].forEach(([nextX, nextY]) => {
    const key = `${nextX},${nextY}`;
    if (maze[nextY]?.[nextX] === 0 && !visited.has(key)) {
      visited.add(key);
      queue.push([nextX, nextY]);
    }
  });
}

const openCells = maze.flat().filter((cell) => cell === 0).length;
const openRatio = openCells / (size * size);
assert.equal(visited.size, openCells, 'Every walkable cell must connect to the landing zone.');
assert.ok(openRatio >= 0.68, `The unbuilt universe should be at least 68% open; found ${openRatio}.`);

console.log(
  `Universe zones valid: ${UNIVERSE_ZONES.length} zones, ${(openRatio * 100).toFixed(1)}% open, ${openCells} connected cells.`,
);
