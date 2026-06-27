/*
 * PUZZLE REGISTRY — single source of truth for puzzle types.
 * Each puzzle declares supported grid sizes and a lazy loader.
 */

const sliding = {
  id: 'sliding',
  gameKey: 'sliding',
  name: 'Sliding Puzzle',
  nameAr: 'الألواح المنزلقة',
  icon: '🧩',
  desc: 'Slide tiles into place — one empty slot.',
  descAr: 'حرّك الألواح إلى مكانها — خانة فارغة واحدة.',
  accent: '#64b5c2',
  sizes: [3, 4, 5, 6],
  loader: () => import('./games/sliding'),
};

const takuzu = {
  id: 'takuzu',
  gameKey: 'takuzu',
  name: 'Takuzu',
  nameAr: 'تاكوزو',
  icon: '⚫',
  desc: 'Fill with 0 and 1 — balance each row and column.',
  descAr: 'املأ بالصفر والواحد — وازِن كل صف وعمود.',
  accent: '#b696d4',
  sizes: [4, 6, 8, 10],
  loader: () => import('./games/takuzu'),
};

const hitori = {
  id: 'hitori',
  gameKey: 'hitori',
  name: 'Hitori',
  nameAr: 'هيتوري',
  icon: '⬛',
  desc: 'Shade duplicates — no adjacent shaded cells.',
  descAr: 'ظلّل المكررات — لا خلايا متظللة متجاورة.',
  accent: '#e07aaa',
  sizes: [5, 6, 7, 8],
  loader: () => import('./games/hitori'),
};

const bridges = {
  id: 'bridges',
  gameKey: 'bridges',
  name: 'Bridges',
  nameAr: 'الجسور',
  icon: '🌉',
  desc: 'Connect the islands — bridge counts must match, and none may cross.',
  descAr: 'صِل الجزر — عدد الجسور يطابق الرقم، ولا تتقاطع.',
  accent: '#5ec6b6',
  sizes: [7, 9, 11, 13],
  loader: () => import('./games/bridges'),
};

const sudoku = {
  id: 'sudoku',
  gameKey: 'sudoku',
  name: 'Sudoku',
  nameAr: 'سودوكو',
  icon: '🔢',
  desc: 'Rows, columns, and boxes — no repeated numbers.',
  descAr: 'صفوف وأعمدة وصناديق — بلا أرقام مكررة.',
  accent: '#e8ac4e',
  sizes: [4, 6, 9],
  loader: () => import('./games/sudoku'),
};

const kenken = {
  id: 'kenken',
  gameKey: 'kenken',
  name: 'KenKen',
  nameAr: 'كين كين',
  icon: '✳️',
  desc: 'Math cages plus Latin-square logic.',
  descAr: 'أقفاص حسابية مع منطق الصفوف والأعمدة.',
  accent: '#d47a4a',
  sizes: [4, 5, 6],
  loader: () => import('./games/kenken'),
};

const nonogram = {
  id: 'nonogram',
  gameKey: 'nonogram',
  name: 'Nonogram',
  nameAr: 'نونوغرام',
  icon: '▦',
  desc: 'Use row and column clues to reveal the picture.',
  descAr: 'استخدم دلائل الصفوف والأعمدة لكشف الصورة.',
  accent: '#64b5c2',
  sizes: [5, 8, 10],
  loader: () => import('./games/nonogram'),
};

const kakuro = {
  id: 'kakuro',
  gameKey: 'kakuro',
  name: 'Kakuro',
  nameAr: 'كاكورو',
  icon: 'Σ',
  desc: 'Crossword sums with digits 1-9.',
  descAr: 'كلمات متقاطعة حسابية بالأرقام ١-٩.',
  accent: '#b696d4',
  sizes: [6, 7],
  loader: () => import('./games/kakuro'),
};

const crowns = {
  id: 'crowns',
  gameKey: 'crowns',
  name: 'Crowns',
  nameAr: 'تيجان',
  icon: '👑',
  desc: 'One crown per row, column & color — none may touch.',
  descAr: 'تاج واحد لكل صف وعمود ولون — ولا يتلامسان.',
  accent: '#e6c66a',
  sizes: [5, 6, 7, 8],
  loader: () => import('./games/crowns'),
};

const blockburst = {
  id: 'blockburst',
  gameKey: 'blockburst',
  name: 'Block Burst',
  nameAr: 'انفجار المكعّبات',
  icon: '🧱',
  desc: 'Drop blocks, fill rows & columns to blast them. Endless!',
  descAr: 'أسقِط المكعّبات، واملأ الصفوف والأعمدة لتفجيرها. بلا نهاية!',
  accent: '#5fa9d8',
  sizes: [8],
  loader: () => import('./games/blockburst'),
};

const flow = {
  id: 'flow',
  gameKey: 'flow',
  name: 'Flow',
  nameAr: 'تدفّق',
  icon: '🔗',
  desc: 'Connect each colour pair without crossing — fill every cell.',
  descAr: 'صِل كل لونين دون تقاطع — واملأ كل الخانات.',
  accent: '#57bd72',
  sizes: [5, 6, 7, 8],
  loader: () => import('./games/flow'),
};

const tangram = {
  id: 'tangram',
  gameKey: 'tangram',
  name: 'Tangram',
  nameAr: 'تانغرام',
  icon: '🧩',
  desc: 'Rotate and place the pieces to fill the board.',
  descAr: 'دوّر القطع وضعها لتملأ اللوحة.',
  accent: '#e07ab0',
  sizes: [4, 5, 6],
  loader: () => import('./games/tangram'),
};

export const PUZZLE_CONFIGS = [sliding, takuzu, hitori, bridges, sudoku, kenken, nonogram, kakuro, crowns, blockburst, flow, tangram];

export const PUZZLES_BY_KEY = Object.fromEntries(
  PUZZLE_CONFIGS.map((p) => [p.gameKey, p])
);

export function getPuzzle(key) {
  return PUZZLES_BY_KEY[key] ?? null;
}
