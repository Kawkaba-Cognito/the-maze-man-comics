/** Outer Gate — compact pre-labyrinth room (two soldiers + door boss). */

export const GATE_ROOM_KEY = 'gate';

export const GATE_SOLDIERS = [
  {
    id: 'gate-ledger',
    name: 'Ledger Finn',
    nameAr: 'فين الدفتر',
    puzzleKey: 'sudoku',
    power: 5,
    color: '#6a9fd8',
    accessory: 'cap',
    scale: 0.55,
    x: -3.6,
    z: 0.5,
  },
  {
    id: 'gate-span',
    name: 'Span Mara',
    nameAr: 'مارا الجسور',
    puzzleKey: 'bridges',
    power: 6,
    color: '#5ec6b6',
    accessory: 'helmet',
    scale: 0.58,
    x: 3.6,
    z: 0.5,
  },
];

export const GATE_BOSS = {
  id: 'gate-warden',
  name: 'The Gate Warden',
  nameAr: 'حارس البوابة',
  color: '#9a68c8',
  accessory: 'horns',
  scale: 1.38,
  girth: 1.12,
  x: 0,
  z: 0, // set at build time from door position
};

export function gateSoldierIds() {
  return GATE_SOLDIERS.map((s) => s.id);
}

export function allGateSoldiersRecruited(statusFn) {
  return GATE_SOLDIERS.every((s) => statusFn(s.id) === 'recruited');
}
