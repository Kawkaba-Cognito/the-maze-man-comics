import { generateKenKen, isKenKenSolved, setKenKenCell } from '../../games/kenken/kenkenEngine';
import { generateSudoku, isSudokuSolved, setSudokuCell } from '../../games/sudoku/sudokuEngine';
import { generateKakuro, isKakuroSolved, setKakuroCell } from '../../games/kakuro/kakuroEngine';

const TRIAL_SEED = 9001;

function kenkenTrialState(seed, emptyCells) {
  const base = generateKenKen(3, seed);
  const player = base.solution.map((row) => row.slice());
  emptyCells.forEach(([r, c]) => {
    player[r][c] = 0;
  });
  return { ...base, player };
}

const kenken = {
  trialSize: 3,
  makeCoachedState: () => kenkenTrialState(TRIAL_SEED, [[0, 2], [1, 1]]),
  makeSoloState: () => kenkenTrialState(TRIAL_SEED + 1, [[0, 2], [1, 1], [2, 0]]),
  isSolved: isKenKenSolved,
  applyAction: (state, action) => {
    if (action.type === 'setCell') return setKenKenCell(state, action.r, action.c, action.value);
    return state;
  },
  coachSteps: (isAr) =>
    isAr
      ? [
          { gate: 'next', text: 'تمرين ٣×٣ — بدون نقاط. تعلّم القواعد خطوة بخطوة.' },
          { gate: 'next', text: 'املأ ١–٣ في كل صف وعمود دون تكرار.' },
          { gate: 'next', text: 'الأقفاص السميكة لها هدف وعملية — يجب أن تتحقق.' },
          { gate: 'select', r: 0, c: 2, text: 'اضغط الخلية الفارغة في الصف العلوي.' },
          { gate: 'setCell', r: 0, c: 2, value: 3, text: 'اختر ٣ من لوحة الأرقام.' },
          { gate: 'next', text: 'استمر — احترم الأقفاص وعدم التكرار في الصفوف والأعمدة.' },
          { gate: 'solved', text: 'أكمل بقية اللغz — طبّق كل القواعد.' },
        ]
      : [
          { gate: 'next', text: '3×3 practice — no points. Learn every rule step by step.' },
          { gate: 'next', text: 'Fill 1–3 in each row and column with no repeats.' },
          { gate: 'next', text: 'Thick cages have a target and operation — they must be satisfied.' },
          { gate: 'select', r: 0, c: 2, text: 'Tap the empty cell in the top row.' },
          { gate: 'setCell', r: 0, c: 2, value: 3, text: 'Pick 3 from the number pad.' },
          { gate: 'next', text: 'Keep going — respect cages and no repeats in rows and columns.' },
          { gate: 'solved', text: 'Finish the rest — apply every rule.' },
        ],
};

function sudokuTrialState(seed) {
  const base = generateSudoku(4, seed);
  return { ...base, player: base.puzzle.map((row) => row.slice()) };
}

const sudoku = {
  trialSize: 4,
  makeCoachedState: () => sudokuTrialState(TRIAL_SEED + 10),
  makeSoloState: () => sudokuTrialState(TRIAL_SEED + 11),
  isSolved: isSudokuSolved,
  applyAction: (state, action) => {
    if (action.type === 'setCell') return setSudokuCell(state, action.r, action.c, action.value);
    return state;
  },
  coachSteps: (isAr) =>
    isAr
      ? [
          { gate: 'next', text: 'تمرين ٤×٤ — بدون نقاط.' },
          { gate: 'next', text: 'كل صف يحتوي ١–٤ مرة واحدة.' },
          { gate: 'next', text: 'كل عمود يحتوي ١–٤ مرة واحدة.' },
          { gate: 'next', text: 'كل صندوق ٢×٢ يحتوي ١–٤ مرة واحدة.' },
          { gate: 'next', text: 'الخلايا المعطاة ثابتة — اضغط الفارغة واختر رقماً.' },
          { gate: 'solved', text: 'املأ كل الخلايا الفارغة دون تكرار.' },
        ]
      : [
          { gate: 'next', text: '4×4 practice — no points awarded.' },
          { gate: 'next', text: 'Each row uses 1–4 exactly once.' },
          { gate: 'next', text: 'Each column uses 1–4 exactly once.' },
          { gate: 'next', text: 'Each 2×2 box uses 1–4 exactly once.' },
          { gate: 'next', text: 'Given cells are fixed — tap a blank and pick a number.' },
          { gate: 'solved', text: 'Fill every blank cell with no repeats.' },
        ],
};

const kakuro = {
  trialSize: 6,
  makeCoachedState: () => generateKakuro(6, TRIAL_SEED + 20),
  makeSoloState: () => generateKakuro(6, TRIAL_SEED + 21),
  isSolved: isKakuroSolved,
  applyAction: (state, action) => {
    if (action.type === 'setCell') return setKakuroCell(state, action.r, action.c, action.value);
    return state;
  },
  coachSteps: (isAr) =>
    isAr
      ? [
          { gate: 'next', text: 'تمرين ٦×٦ — أصغر حجم.' },
          { gate: 'next', text: 'كل مسار أبيض يجب أن يساوي مجموع دليله.' },
          { gate: 'next', text: 'لا تكرار للأرقام داخل مسار واحد.' },
          { gate: 'next', text: 'الرقم أعلى-يمين الخلية السوداء = المجموع الأفقي.' },
          { gate: 'next', text: 'الرقم أسفل-يسار = المجموع العمودي. استخدم ١–٩.' },
          { gate: 'solved', text: 'املأ الخلايا البيضاء حتى تتحقق كل المجاميع.' },
        ]
      : [
          { gate: 'next', text: '6×6 practice — smallest grid size.' },
          { gate: 'next', text: 'Each white run must add up to its clue sum.' },
          { gate: 'next', text: 'Digits cannot repeat inside one run.' },
          { gate: 'next', text: 'Top-right on a black clue cell = across sum.' },
          { gate: 'next', text: 'Bottom-left = down sum. Use digits 1–9.' },
          { gate: 'solved', text: 'Fill white cells until every run matches.' },
        ],
};

export const NUMBER_PUZZLE_TRIALS = { kenken, sudoku, kakuro };

export function getNumberPuzzleTrial(puzzleId) {
  return NUMBER_PUZZLE_TRIALS[puzzleId] ?? null;
}
