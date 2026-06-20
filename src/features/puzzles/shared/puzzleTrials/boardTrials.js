import { createSlidingPuzzle, isSlidingSolved, trySlide } from '../../games/sliding/slidingEngine';
import { generateTakuzu, isTakuzuSolved, cycleTakuzuCell } from '../../games/takuzu/takuzuEngine';
import { generateHitori, isHitoriSolved, toggleHitoriCell } from '../../games/hitori/hitoriEngine';
import { generateCrowns, isCrownsSolved, cycleCrownCell } from '../../games/crowns/crownsEngine';
import { generateNonogram, nonogramLineCluesMatch, setNonogramCell } from '../../games/nonogram/nonogramEngine';
import { generateBridges, isBridgesSolved, cycleBridgeByIslands } from '../../games/bridges/bridgesEngine';

const SEED = 8000;

function isNonogramSolved(state) {
  if (!state?.player) return false;
  const filled = state.player.every((row) => row.every((v) => v === 1 || v === -1));
  return filled && nonogramLineCluesMatch(state);
}

/** Multi-step rule lesson ending in a solve gate. */
function lessonSteps(isAr, introSteps, handsOn, finish) {
  const steps = introSteps.map((text) => ({ gate: 'next', text }));
  steps.push(...handsOn);
  steps.push({ gate: 'solved', text: finish });
  return steps;
}

const sliding = {
  trialSize: 3,
  makeCoachedState: () => {
    const s = createSlidingPuzzle(3, SEED);
    const tiles = [1, 2, 3, 4, 5, 6, 7, 0, 8];
    return { ...s, tiles, moves: 0 };
  },
  makeSoloState: () => createSlidingPuzzle(3, SEED + 1),
  isSolved: isSlidingSolved,
  applyAction: (state, action) => {
    if (action.type === 'slide') return trySlide(state, action.index) || state;
    return state;
  },
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'تمرين على أصغر لوحة ٣×٣ — بدون نقاط.',
            'الهدف: ترتيب ١، ٢، ٣ … مع الفراغ في الزاوية.',
            'اضغط لوحاً بجانب الفراغ فينزلق. لوح أبعد في نفس الخط يحرّك الخط كله.',
          ]
        : [
            'Practice on the smallest 3×3 board — no points awarded.',
            'Goal: tiles read 1, 2, 3 … with the gap in the last corner.',
            'Tap a tile next to the gap to slide it. Tap farther along the row to slide the whole line.',
          ],
      [],
      isAr ? 'أكمل الترتيب — حرّك الألواح حتى ١–٨ في مكانها.' : 'Finish the order — slide until 1–8 are in place.',
    ),
};

const takuzu = {
  trialSize: 4,
  makeCoachedState: () => generateTakuzu(4, SEED + 2),
  makeSoloState: () => generateTakuzu(4, SEED + 3),
  isSolved: isTakuzuSolved,
  applyAction: (state, action) => {
    if (action.type === 'toggle') return cycleTakuzuCell(state, action.r, action.c);
    return state;
  },
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'تمرين ٤×٤ — تعلّم القواعد خطوة بخطوة.',
            'املأ كل خلية بـ ٠ أو ١ فقط.',
            'كل صف وكل عمود يحتاج عدداً متساوياً من ٠ و١.',
            'لا ثلاثة متتالية من نفس الرقم في أي خط.',
            'اضغط الخلية للتبديل: فارغ ← ٠ ← ١.',
          ]
        : [
            '4×4 practice — learn every rule step by step.',
            'Fill every cell with 0 or 1 only.',
            'Each row and column needs equal counts of 0s and 1s.',
            'Never three of the same digit in a row.',
            'Tap a cell to cycle: empty → 0 → 1.',
          ],
      [],
      isAr ? 'أكمل الشبكة — طبّق كل القواعد.' : 'Complete the grid — apply every rule.',
    ),
};

const hitori = {
  trialSize: 5,
  makeCoachedState: () => generateHitori(5, SEED + 4),
  makeSoloState: () => generateHitori(5, SEED + 5),
  isSolved: isHitoriSolved,
  applyAction: (state, action) => {
    if (action.type === 'toggle') return toggleHitoriCell(state, action.r, action.c);
    return state;
  },
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'تمرين ٥×٥ — ظلّل الخلايا حسب القواعد.',
            'لا يتكرر رقم بين الخلايا البيضاء في أي صف أو عمود.',
            'الخلايا المظللة لا تتلامس حافة بحافة.',
            'يجب أن تبقى كل الخلايا البيضاء متصلة.',
            'اضغط خلية لتظليلها أو إلغاء التظليل.',
          ]
        : [
            '5×5 practice — shade cells by the rules.',
            'No number repeats among white cells in any row or column.',
            'Shaded cells cannot share an edge.',
            'All white cells must stay connected as one group.',
            'Tap a cell to shade or unshade it.',
          ],
      [],
      isAr ? 'أكمل اللغز — لا تكرار ولا تظليل متجاور.' : 'Finish the puzzle — no repeats and no touching shades.',
    ),
};

const crowns = {
  trialSize: 5,
  makeCoachedState: () => generateCrowns(5, SEED + 6),
  makeSoloState: () => generateCrowns(5, SEED + 7),
  isSolved: isCrownsSolved,
  applyAction: (state, action) => {
    if (action.type === 'cycle') return cycleCrownCell(state, action.r, action.c);
    return state;
  },
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'تمرين ٥×٥ — تاج واحد في كل صف وعمود ومنطقة ملونة.',
            'التيجان لا تتلامس — لا حتى قطرياً.',
            'اضغط للتبديل: فارغ ← × ← 👑.',
            'استخدم × لاستبعاد خلايا قبل وضع التاج.',
          ]
        : [
            '5×5 practice — one crown per row, column, and colored region.',
            'Crowns cannot touch — not even diagonally.',
            'Tap to cycle: empty → × → 👑.',
            'Use × to rule out cells before placing a crown.',
          ],
      [],
      isAr ? 'ضع التيجان حتى يتحقق كل صف وعمود ومنطقة.' : 'Place crowns until every row, column, and region is satisfied.',
    ),
};

const nonogram = {
  trialSize: 5,
  makeCoachedState: () => generateNonogram(5, SEED + 8),
  makeSoloState: () => generateNonogram(5, SEED + 9),
  isSolved: isNonogramSolved,
  applyAction: (state, action) => {
    if (action.type === 'setCell') return setNonogramCell(state, action.r, action.c, action.mode);
    return state;
  },
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'تمرين ٥×٥ — اقرأ الدلائل على الحواف.',
            'كل رقم = طول كتلة خلايا مملوءة في ذلك الخط.',
            '«٢ ١» يعني كتلتان مفصولتان بفراغ.',
            'استخدم التعبئة للسواد و✕ للخلايا الفارغة المؤكدة.',
          ]
        : [
            '5×5 practice — read the clues on the edges.',
            'Each number is a run of filled cells in that line.',
            'A clue like “2 1” means two blocks with a gap between.',
            'Use Fill for black cells and ✕ for cells you know stay empty.',
          ],
      [],
      isAr ? 'عبّئ الشبكة حتى تطابق كل دليل.' : 'Fill the grid until every clue matches.',
    ),
};

const bridges = {
  trialSize: 7,
  makeCoachedState: () => generateBridges(7, SEED + 10),
  makeSoloState: () => generateBridges(7, SEED + 11),
  isSolved: isBridgesSolved,
  applyAction: (state, action) => {
    if (action.type === 'bridge' && action.from != null && action.to != null) {
      const next = cycleBridgeByIslands(state, action.from, action.to);
      return next === state ? state : next;
    }
    return state;
  },
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'تمرين على أصغر شبكة — كل جزيرة لها رقم.',
            'الرقم = عدد الجسور الواجبة لتلك الجزيرة.',
            'اضغط جزيرتين متجاورتين لإضافة جسr. اضغط مرة أخرى لجسر مزدوج.',
            'الجسور لا تتقاطع. يجب أن تصبح كل الجزر شبكة واحدة.',
          ]
        : [
            'Practice on the smallest grid — each island shows a number.',
            'That number is how many bridges that island needs.',
            'Tap two neighbouring islands to add a bridge. Tap again for a double bridge.',
            'Bridges cannot cross. Every island must join one connected network.',
          ],
      [],
      isAr ? 'أكمل الجسور حتى يتحقق كل رقم.' : 'Finish bridging until every island count is satisfied.',
    ),
};

const blockburst = {
  makeCoachedState: () => null,
  makeSoloState: () => null,
  isSolved: () => true,
  applyAction: (state) => state,
  coachSteps: (isAr) =>
    lessonSteps(
      isAr,
      isAr
        ? [
            'اسحب قطع المكعّبات من الدرج إلى شبكة ٨×٨.',
            'املأ صفاً أو عموداً كاملاً لتفجيره وكسب نقاط.',
            'القطع تتوالى — تنتهي اللعبة حين لا تتّسع أي قطعة.',
          ]
        : [
            'Drag block pieces from the tray onto the 8×8 grid.',
            'Complete a full row or column to blast it for points.',
            'Pieces keep coming — game over when nothing fits.',
          ],
      [],
      isAr ? 'جاهز — اختر اللعب بعد الدليل.' : 'Ready — pick play after the tutorial.',
    ),
  skipTrials: true,
};

export const BOARD_PUZZLE_TRIALS = {
  sliding,
  takuzu,
  hitori,
  crowns,
  nonogram,
  bridges,
  blockburst,
};

export function getBoardPuzzleTrial(puzzleId) {
  return BOARD_PUZZLE_TRIALS[puzzleId] ?? null;
}
