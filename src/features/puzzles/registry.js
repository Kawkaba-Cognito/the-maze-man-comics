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

// ── Group Challenge: pass-and-play party games (not grid puzzles). ──
const imposter = {
  id: 'imposter',
  gameKey: 'imposter',
  name: 'Imposter',
  nameAr: 'الدخيل',
  icon: '🕵️',
  desc: 'Everyone gets the secret word — except the imposter. Find them!',
  descAr: 'الجميع يعرف الكلمة السرية إلا الدخيل. اكتشفوه!',
  accent: '#d46a6a',
  sizes: [],
  loader: () => import('./games/imposter'),
};

const charades = {
  id: 'charades',
  gameKey: 'charades',
  name: 'Charades',
  nameAr: 'تمثيل',
  icon: '🎭',
  desc: 'Act the word out — no talking — before the timer runs out.',
  descAr: 'مثّل الكلمة — بلا كلام — قبل انتهاء الوقت.',
  accent: '#e0954a',
  sizes: [],
  loader: () => import('./games/charades'),
};

const describeit = {
  id: 'describeit',
  gameKey: 'describeit',
  name: 'Describe It',
  nameAr: 'صِفها',
  icon: '💬',
  desc: 'Describe the word in clues without saying it — race the clock.',
  descAr: 'صِف الكلمة بالتلميح دون ذكرها — سابق الوقت.',
  accent: '#5ec6a0',
  sizes: [],
  loader: () => import('./games/describeit'),
};

const wavelength = {
  id: 'wavelength',
  gameKey: 'wavelength',
  name: 'On a Scale',
  nameAr: 'على المقياس',
  icon: '🎯',
  desc: 'One clue for a hidden spot on a spectrum — the group dials it in.',
  descAr: 'دليل واحد لموضع مخفي على مقياس — والمجموعة تخمّنه.',
  accent: '#5a9fd4',
  sizes: [],
  loader: () => import('./games/wavelength'),
};

const gettoknow = {
  id: 'gettoknow',
  gameKey: 'gettoknow',
  name: 'Get to Know',
  nameAr: 'تعارف',
  icon: '💬',
  desc: 'Conversation prompts for couples, friends, family, and groups.',
  descAr: 'أسئلة تعارف للأزواج والأصدقاء والعائلة والمجموعات.',
  accent: '#d46a8a',
  sizes: [],
  loader: () => import('./games/gettoknow'),
};

const groupwar = {
  id: 'groupwar',
  gameKey: 'groupwar',
  name: 'Group War',
  nameAr: 'حرب المجموعات',
  icon: '⚔️',
  desc: 'Teams duel on training games — same challenge, highest points win.',
  descAr: 'فرق تتنافس على ألعاب التدريب — نفس التحدي، أعلى نقاط تفوز.',
  accent: '#c45c26',
  sizes: [],
  loader: () => import('./games/groupwar'),
};

export const PUZZLE_CONFIGS = [sliding, takuzu, hitori, bridges, sudoku, kenken, nonogram, kakuro, crowns, blockburst, flow, tangram, imposter, charades, describeit, wavelength, gettoknow, groupwar];

// ── Categories: every puzzle belongs to exactly one, by core mechanic. ──
const CATEGORY_OF = {
  sudoku: 'numbers', kenken: 'numbers', kakuro: 'numbers', nonogram: 'numbers',
  takuzu: 'logic', hitori: 'logic', crowns: 'logic', bridges: 'logic',
  sliding: 'spatial', blockburst: 'spatial', flow: 'spatial', tangram: 'spatial',
  imposter: 'group', charades: 'group', describeit: 'group', wavelength: 'group', gettoknow: 'group', groupwar: 'group',
};
PUZZLE_CONFIGS.forEach((p) => { p.category = CATEGORY_OF[p.id] || 'logic'; });

export const PUZZLE_CATEGORIES = [
  { id: 'numbers', name: 'Numbers', nameAr: 'الأرقام', icon: '🔢', accent: '#e8ac4e', desc: 'Digits & arithmetic deduction', descAr: 'استنتاج بالأرقام والحساب' },
  { id: 'logic', name: 'Logic', nameAr: 'المنطق', icon: '🧠', accent: '#5ec6b6', desc: 'Shade, place, connect & reveal', descAr: 'تظليل ووضع وربط وكشف' },
  { id: 'spatial', name: 'Spatial', nameAr: 'المكاني', icon: '🧩', accent: '#b696d4', desc: 'Move, draw & fit in space', descAr: 'تحريك ورسم وتركيب في الفراغ' },
  { id: 'group', name: 'Group Challenge', nameAr: 'تحدٍّ جماعي', icon: '👥', accent: '#d46a6a', desc: 'Party games with names — pass the phone', descAr: 'ألعاب جماعية بالأسماء — مرّروا الهاتف' },
];

export const puzzlesInCategory = (cat) => PUZZLE_CONFIGS.filter((p) => p.category === cat);

export const PUZZLES_BY_KEY = Object.fromEntries(
  PUZZLE_CONFIGS.map((p) => [p.gameKey, p])
);

export function getPuzzle(key) {
  return PUZZLES_BY_KEY[key] ?? null;
}
