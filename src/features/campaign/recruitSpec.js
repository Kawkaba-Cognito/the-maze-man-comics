/** Timed recruitment specs — harder puzzles & shorter clocks for stronger soldiers. */

function seedFor(floorId, soldierId) {
  let h = 0;
  const s = `${floorId}:${soldierId}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/**
 * @returns {{ puzzleKey, size, seed, timeLimitSec, targetScore?, power }}
 */
export function getRecruitSpec({ soldier, floorId }) {
  const power = soldier.power || 8;
  const seed = seedFor(floorId, soldier.id);
  const timeLimitSec = Math.max(38, 128 - power * 6);

  const base = { puzzleKey: soldier.puzzleKey, seed, timeLimitSec, power };

  switch (soldier.puzzleKey) {
    case 'sudoku':
      return { ...base, size: power <= 6 ? 4 : power >= 10 ? 6 : 4, timeLimitSec: Math.max(55, 140 - power * 8) };
    case 'takuzu':
      return { ...base, size: power >= 12 ? 8 : power >= 10 ? 6 : 6 };
    case 'kenken':
      return { ...base, size: power >= 14 ? 6 : power >= 10 ? 5 : 4 };
    case 'hitori':
      return { ...base, size: power >= 12 ? 7 : power >= 10 ? 6 : 5 };
    case 'bridges':
      return { ...base, size: power >= 14 ? 11 : power >= 12 ? 9 : 7 };
    case 'blockburst':
      return { ...base, size: 8, targetScore: 30 + power * 8 };
    default:
      return { ...base, size: 6 };
  }
}

/** Render ★ string for soldier power (1–3 stars by tier). */
export function powerStars(power) {
  const n = power >= 14 ? 3 : power >= 10 ? 2 : 1;
  return '★'.repeat(n) + '☆'.repeat(3 - n);
}
