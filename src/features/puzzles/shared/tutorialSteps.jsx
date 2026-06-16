import React from 'react';
import { MiniBoard, Captioned, DiagramRow, Arrow, crownsCells } from './TutorialDiagram';

/*
 * Diagram-based tutorials (the "professional, with images" upgrade). Each step
 * carries a code-drawn `diagram` showing the rule and, where it helps, a
 * problem→solution. These override the plain emoji steps in tutorialContent.js.
 */

// cell builders -------------------------------------------------------
const C = (content, opts = {}) => ({ content: content === '' ? '' : String(content), bg: '#fbf6ee', ...opts });
const SH = (content) => C(content, { bg: '#2a241c', fg: '#f3ead9' }); // shaded
const WALL = () => C('', { bg: '#161009' });
const FILL = (col = '#3a6fb0') => C('', { bg: col });
const GAP = () => C('', { bg: '#e6dccb' });

// ── CROWNS ──────────────────────────────────────────────────────────
const RC = ['#e08b7a', '#7fb0d8', '#a7c97e', '#e6c66a'];
const REGION4 = [[0, 0, 1, 1], [0, 0, 1, 1], [2, 2, 3, 1], [2, 2, 3, 3]];
const SOLVED = [[0, 1], [1, 3], [2, 0], [3, 2]];
const grid3 = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

const CROWNS = {
  en: [
    { title: 'The goal', body: 'Place exactly one 👑 in every row, every column, and every colored region.', diagram: <MiniBoard cell={32} cells={crownsCells(REGION4, RC, { crowns: SOLVED })} /> },
    { title: "Crowns can't touch", body: 'No two crowns may sit next to each other — not even diagonally.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="touch"><MiniBoard cell={26} cells={crownsCells(grid3, ['#efe6d6'], { crowns: [[0, 0], [1, 1]], rings: { '0,0': 'bad', '1,1': 'bad' } })} /></Captioned>
        <Captioned kind="good" label="apart"><MiniBoard cell={26} cells={crownsCells(grid3, ['#efe6d6'], { crowns: [[0, 0], [1, 2]], rings: { '0,0': 'good', '1,2': 'good' } })} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'Mark, then place', body: 'Tap a cell to cycle empty → × → 👑. Use × to rule out cells that can’t hold a crown.', diagram: (
      <DiagramRow><MiniBoard cell={34} cells={[[C('')]]} /><Arrow /><MiniBoard cell={34} cells={[[C('×', { fg: 'rgba(26,18,8,0.5)' })]]} /><Arrow /><MiniBoard cell={34} cells={[[C('👑')]]} /></DiagramRow>
    ) },
    { title: 'Solve by deduction', body: 'Each color holds exactly one crown. If × rules out every cell of a region but one, that cell must be the crown.', diagram: <MiniBoard cell={32} cells={crownsCells(REGION4, RC, { marks: [[0, 2], [0, 3], [1, 2], [2, 3]], crowns: [[1, 3]], rings: { '1,3': 'good' } })} /> },
  ],
  ar: [
    { title: 'الهدف', body: 'ضع تاجاً واحداً 👑 في كل صف وكل عمود وكل منطقة ملوّنة.', diagram: <MiniBoard cell={32} cells={crownsCells(REGION4, RC, { crowns: SOLVED })} /> },
    { title: 'التيجان لا تتلامس', body: 'لا يجوز أن يتجاور تاجان — ولا حتى قطرياً.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="تلامس"><MiniBoard cell={26} cells={crownsCells(grid3, ['#efe6d6'], { crowns: [[0, 0], [1, 1]], rings: { '0,0': 'bad', '1,1': 'bad' } })} /></Captioned>
        <Captioned kind="good" label="تباعد"><MiniBoard cell={26} cells={crownsCells(grid3, ['#efe6d6'], { crowns: [[0, 0], [1, 2]], rings: { '0,0': 'good', '1,2': 'good' } })} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'علّم ثم ضع', body: 'اضغط الخلية للتبديل: فارغ ← × ← 👑. استخدم × لاستبعاد الخلايا.', diagram: (
      <DiagramRow><MiniBoard cell={34} cells={[[C('')]]} /><Arrow /><MiniBoard cell={34} cells={[[C('×', { fg: 'rgba(26,18,8,0.5)' })]]} /><Arrow /><MiniBoard cell={34} cells={[[C('👑')]]} /></DiagramRow>
    ) },
    { title: 'الحل بالاستنتاج', body: 'كل لون يحمل تاجاً واحداً. إذا استبعدت × كل خلايا منطقة إلا واحدة، فتلك هي التاج.', diagram: <MiniBoard cell={32} cells={crownsCells(REGION4, RC, { marks: [[0, 2], [0, 3], [1, 2], [2, 3]], crowns: [[1, 3]], rings: { '1,3': 'good' } })} /> },
  ],
};

// ── SLIDING ─────────────────────────────────────────────────────────
const slidGoal = [[C(1), C(2), C(3)], [C(4), C(5), C(6)], [C(7), C(8), GAP()]];
const SLIDING = {
  en: [
    { title: 'Sliding Puzzle', body: 'Slide the tiles until they read 1, 2, 3 … with the empty space in the last corner.', diagram: <MiniBoard cell={30} cells={slidGoal} /> },
    { title: 'Tap to slide', body: 'Tap a tile next to the gap and it slides in. Tap one further along the same line and the whole line slides.', diagram: (
      <DiagramRow><MiniBoard cell={30} cells={[[C(4), GAP(), C(6)]]} /><Arrow /><MiniBoard cell={30} cells={[[C(4), C(6), GAP()]]} /></DiagramRow>
    ) },
    { title: 'Fewer moves win', body: 'Pick 3×3 for a quick game or up to 6×6 for a challenge. Fewer moves and faster time = bragging rights.', diagram: <MiniBoard cell={30} cells={slidGoal} /> },
  ],
  ar: [
    { title: 'الألواح المنزلقة', body: 'حرّك الألواح حتى تصبح ١، ٢، ٣ … مع الفراغ في الزاوية الأخيرة.', diagram: <MiniBoard cell={30} cells={slidGoal} /> },
    { title: 'اضغط للتحريك', body: 'اضغط لوحاً بجانب الفراغ فينزلق. اضغط لوحاً أبعد في نفس الخط فينزلق الخط كله.', diagram: (
      <DiagramRow><MiniBoard cell={30} cells={[[C(4), GAP(), C(6)]]} /><Arrow /><MiniBoard cell={30} cells={[[C(4), C(6), GAP()]]} /></DiagramRow>
    ) },
    { title: 'حركات أقل تفوز', body: '٣×٣ سريع أو حتى ٦×٦ للتحدّي. حركات أقل ووقت أسرع = فخر.', diagram: <MiniBoard cell={30} cells={slidGoal} /> },
  ],
};

// ── TAKUZU ──────────────────────────────────────────────────────────
const TAKUZU = {
  en: [
    { title: 'Takuzu', body: 'Fill every cell with 0 or 1. Each row and column needs equal counts of each.', diagram: <MiniBoard cell={30} cells={[[C(1), C(0), C(1), C(0)], [C(0), C(1), C(0), C(1)]]} /> },
    { title: 'No three in a row', body: 'You can never have three of the same digit in a line — fix it by switching one.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="three 1s"><MiniBoard cell={28} cells={[[C(1, { ring: 'bad' }), C(1, { ring: 'bad' }), C(1, { ring: 'bad' })]]} /></Captioned>
        <Captioned kind="good" label="ok"><MiniBoard cell={28} cells={[[C(1), C(1), C(0, { ring: 'good' })]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'Balance the line', body: 'Tap a cell to cycle empty → 0 → 1. Each row and column ends with the same number of 0s and 1s.', diagram: <MiniBoard cell={30} cells={[[C(1), C(1), C(0), C(0)]]} /> },
  ],
  ar: [
    { title: 'تاكوزو', body: 'املأ كل خلية بـ ٠ أو ١. كل صف وعمود يحتاج عدداً متساوياً من كلٍّ.', diagram: <MiniBoard cell={30} cells={[[C(1), C(0), C(1), C(0)], [C(0), C(1), C(0), C(1)]]} /> },
    { title: 'لا ثلاثة متتالية', body: 'لا يجوز ثلاثة أرقام متماثلة في خط — صحّح بتبديل واحد.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="ثلاثة"><MiniBoard cell={28} cells={[[C(1, { ring: 'bad' }), C(1, { ring: 'bad' }), C(1, { ring: 'bad' })]]} /></Captioned>
        <Captioned kind="good" label="صحيح"><MiniBoard cell={28} cells={[[C(1), C(1), C(0, { ring: 'good' })]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'وازِن الخط', body: 'اضغط للتبديل: فارغ ← ٠ ← ١. كل صف وعمود ينتهي بعدد متساوٍ من ٠ و١.', diagram: <MiniBoard cell={30} cells={[[C(1), C(1), C(0), C(0)]]} /> },
  ],
};

// ── HITORI ──────────────────────────────────────────────────────────
const HITORI = {
  en: [
    { title: 'Hitori', body: 'Shade cells so no number repeats among the unshaded cells of any row or column.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} /> },
    { title: 'Shades can’t touch', body: 'Two shaded cells may not share an edge (diagonal corners are fine).', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="touch"><MiniBoard cell={28} cells={[[SH(2), SH(2)], [C(1), C(3)]]} /></Captioned>
        <Captioned kind="good" label="ok"><MiniBoard cell={28} cells={[[SH(2), C(2)], [C(1), SH(3)]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'Stay connected', body: 'All unshaded (white) cells must stay joined as one group — never fence one off.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} /> },
  ],
  ar: [
    { title: 'هيتوري', body: 'ظلّل خلايا حتى لا يتكرر رقم بين الخلايا البيضاء في أي صف أو عمود.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} /> },
    { title: 'لا تظليل متجاور', body: 'لا تتلامس خليتان مظللتان حافة بحافة (الزوايا القطرية مسموحة).', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="تلامس"><MiniBoard cell={28} cells={[[SH(2), SH(2)], [C(1), C(3)]]} /></Captioned>
        <Captioned kind="good" label="صحيح"><MiniBoard cell={28} cells={[[SH(2), C(2)], [C(1), SH(3)]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'ابقَ متصلاً', body: 'يجب أن تبقى كل الخلايا البيضاء متصلة كمجموعة واحدة — لا تعزل أي خلية.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} /> },
  ],
};

// ── SUDOKU ──────────────────────────────────────────────────────────
const SUDOKU = {
  en: [
    { title: 'Sudoku', body: 'Every row, column, and box must contain each number exactly once.', diagram: <MiniBoard cell={28} cells={[[C(1), C(2), C(3), C(4)], [C(3), C(4), C(1), C(2)]]} /> },
    { title: 'No repeats in a line', body: 'A number can’t appear twice in the same row, column, or box.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="two 3s"><MiniBoard cell={28} cells={[[C(3, { ring: 'bad' }), C(1), C(3, { ring: 'bad' }), C(2)]]} /></Captioned>
        <Captioned kind="good" label="ok"><MiniBoard cell={28} cells={[[C(3), C(1), C(4, { ring: 'good' }), C(2)]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'Tap to enter', body: 'Tap a blank cell and choose a number. Given cells are fixed. Sizes 4×4, 6×6, 9×9.', diagram: <MiniBoard cell={28} cells={[[C(1), C(2), C(3), C(4)], [C(3), C(4), C(1), C(2)]]} /> },
  ],
  ar: [
    { title: 'سودوكو', body: 'كل صف وعمود وصندوق يحتوي كل رقم مرة واحدة بالضبط.', diagram: <MiniBoard cell={28} cells={[[C(1), C(2), C(3), C(4)], [C(3), C(4), C(1), C(2)]]} /> },
    { title: 'لا تكرار في الخط', body: 'لا يظهر رقم مرتين في نفس الصف أو العمود أو الصندوق.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="٣ مكرر"><MiniBoard cell={28} cells={[[C(3, { ring: 'bad' }), C(1), C(3, { ring: 'bad' }), C(2)]]} /></Captioned>
        <Captioned kind="good" label="صحيح"><MiniBoard cell={28} cells={[[C(3), C(1), C(4, { ring: 'good' }), C(2)]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'اضغط للإدخال', body: 'اضغط خلية فارغة واختر رقماً. الخلايا المعطاة ثابتة. الأحجام ٤×٤ و٦×٦ و٩×٩.', diagram: <MiniBoard cell={28} cells={[[C(1), C(2), C(3), C(4)], [C(3), C(4), C(1), C(2)]]} /> },
  ],
};

// ── KENKEN ──────────────────────────────────────────────────────────
const kkCage = [
  [C('3+', { fg: '#7a4a10', bg: '#fff4dd' }), C(2)],
  [C(2), C(1)],
];
const KENKEN = {
  en: [
    { title: 'KenKen', body: 'Fill 1 up to the grid size in every row and column, with no repeats.', diagram: <MiniBoard cell={30} cells={[[C(1), C(2), C(3)], [C(2), C(3), C(1)], [C(3), C(1), C(2)]]} /> },
    { title: 'Cages', body: 'A small label shows a target and operation. “3+” means the cage’s numbers must add to 3.', diagram: (
      <DiagramRow><div className="ct-tut-tag" style={{ background: '#fff4dd', color: '#7a4a10', fontWeight: 800 }}>3+</div><Arrow /><MiniBoard cell={30} cells={[[C(1), C(2)]]} /></DiagramRow>
    ) },
    { title: 'Tap to enter', body: 'Tap a cell, pick a number. Rows, columns, and cage math must all work. Sizes 4×4 to 7×7.', diagram: <MiniBoard cell={30} cells={kkCage} /> },
  ],
  ar: [
    { title: 'كين كين', body: 'املأ من ١ إلى حجم الشبكة في كل صف وعمود دون تكرار.', diagram: <MiniBoard cell={30} cells={[[C(1), C(2), C(3)], [C(2), C(3), C(1)], [C(3), C(1), C(2)]]} /> },
    { title: 'الأقفاص', body: 'علامة صغيرة تعرض هدفاً وعملية. «3+» تعني أن أرقام القفص تجمع إلى ٣.', diagram: (
      <DiagramRow><div className="ct-tut-tag" style={{ background: '#fff4dd', color: '#7a4a10', fontWeight: 800 }}>3+</div><Arrow /><MiniBoard cell={30} cells={[[C(1), C(2)]]} /></DiagramRow>
    ) },
    { title: 'اضغط للإدخال', body: 'اضغط خلية واختر رقماً. الصفوف والأعمدة وحساب القفص يجب أن تتحقق. الأحجام ٤×٤ حتى ٧×٧.', diagram: <MiniBoard cell={30} cells={kkCage} /> },
  ],
};

// ── NONOGRAM ────────────────────────────────────────────────────────
const nonoRun = [[FILL(), FILL(), GAP(), FILL()]];
const NONOGRAM = {
  en: [
    { title: 'Nonogram', body: 'Number clues tell you how many cells are filled in each row and column.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} /> },
    { title: 'Read the runs', body: 'A clue like “2 1” means a run of two filled cells, a gap, then one filled cell.', diagram: (
      <DiagramRow><div className="ct-tut-tag ct-tut-tag--good" style={{ background: '#e9e1d0', color: '#1a1208' }}>2 1</div><Arrow /><MiniBoard cell={28} cells={nonoRun} /></DiagramRow>
    ) },
    { title: 'Fill or mark', body: 'Use Fill to blacken a cell, or Mark to put ✕ where you know it’s empty. Match every clue.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} /> },
  ],
  ar: [
    { title: 'نونوغرام', body: 'الدلائل الرقمية تخبرك بعدد الخلايا المملوءة في كل صف وعمود.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} /> },
    { title: 'اقرأ الكتل', body: 'دليل مثل «٢ ١» يعني كتلة من خليتين، فراغ، ثم خلية واحدة.', diagram: (
      <DiagramRow><div className="ct-tut-tag ct-tut-tag--good" style={{ background: '#e9e1d0', color: '#1a1208' }}>٢ ١</div><Arrow /><MiniBoard cell={28} cells={nonoRun} /></DiagramRow>
    ) },
    { title: 'تعبئة أو علامة', body: 'استخدم التعبئة لتسويد خلية، أو العلامة ✕ للخلايا الفارغة المؤكدة. طابق كل الدلائل.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} /> },
  ],
};

// ── KAKURO ──────────────────────────────────────────────────────────
const kakClue = { content: '4', bg: '#141210', fg: '#fff7f2' };
const KAKURO = {
  en: [
    { title: 'Kakuro', body: 'A number crossword: each white run must add up to its clue, using digits 1–9.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} /> },
    { title: 'No repeats in a run', body: 'Digits can’t repeat inside one across or down run. Here 4 = 1 + 3.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="2 + 2"><MiniBoard cell={28} cells={[[{ content: '4', bg: '#141210', fg: '#fff7f2' }, C(2, { ring: 'bad' }), C(2, { ring: 'bad' })]]} /></Captioned>
        <Captioned kind="good" label="1 + 3"><MiniBoard cell={28} cells={[[{ content: '4', bg: '#141210', fg: '#fff7f2' }, C(1, { ring: 'good' }), C(3, { ring: 'good' })]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'Read the clue cell', body: 'The black cell’s top-right number is the across sum; the bottom-left is the down sum. Purple cells are fixed.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} /> },
  ],
  ar: [
    { title: 'كاكورو', body: 'كلمات متقاطعة رقمية: كل مسار أبيض يجب أن يساوي مجموعه بأرقام ١–٩.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} /> },
    { title: 'لا تكرار في المسار', body: 'لا تتكرر الأرقام داخل مسار واحد. هنا ٤ = ١ + ٣.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="٢ + ٢"><MiniBoard cell={28} cells={[[{ content: '4', bg: '#141210', fg: '#fff7f2' }, C(2, { ring: 'bad' }), C(2, { ring: 'bad' })]]} /></Captioned>
        <Captioned kind="good" label="١ + ٣"><MiniBoard cell={28} cells={[[{ content: '4', bg: '#141210', fg: '#fff7f2' }, C(1, { ring: 'good' }), C(3, { ring: 'good' })]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'اقرأ خلية الدليل', body: 'الرقم أعلى-يمين الخلية السوداء هو المجموع الأفقي، وأسفل-يسار هو العمودي. الخلايا البنفسجية ثابتة.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} /> },
  ],
};

// ── BLOCK BURST ─────────────────────────────────────────────────────
const bbRowAlmost = [[FILL('#e0795f'), FILL('#5fa9d8'), FILL('#8cc06a'), FILL('#e6bd55'), FILL('#a98fd6'), FILL('#5ec6b6'), FILL('#e0795f'), GAP()]];
const bbRowCleared = [[GAP(), GAP(), GAP(), GAP(), GAP(), GAP(), GAP(), GAP()]];
const BLOCKBURST = {
  en: [
    { title: 'Block Burst', body: 'Drag the block pieces from the tray onto the 8×8 grid.', diagram: <MiniBoard cell={22} cells={[[FILL('#5fa9d8'), FILL('#5fa9d8')], [FILL('#5fa9d8'), GAP()]]} /> },
    { title: 'Fill a line to blast it', body: 'Complete a full row or column and it clears for points — combos clear several at once.', diagram: (
      <DiagramRow><MiniBoard cell={20} cells={bbRowAlmost} /><Arrow /><MiniBoard cell={20} cells={bbRowCleared} /></DiagramRow>
    ) },
    { title: 'Last as long as you can', body: 'New pieces keep coming. It’s game over when none of your pieces fit. Beat your best score!', diagram: <MiniBoard cell={22} cells={[[FILL('#e6bd55'), FILL('#e6bd55'), FILL('#e6bd55')], [GAP(), FILL('#e6bd55'), GAP()]]} /> },
  ],
  ar: [
    { title: 'انفجار المكعّبات', body: 'اسحب قطع المكعّبات من الدرج إلى شبكة ٨×٨.', diagram: <MiniBoard cell={22} cells={[[FILL('#5fa9d8'), FILL('#5fa9d8')], [FILL('#5fa9d8'), GAP()]]} /> },
    { title: 'املأ خطاً لتفجيره', body: 'أكمل صفاً أو عموداً كاملاً فينفجر وتكسب نقاطاً — والتركيبات تمسح عدة خطوط دفعة.', diagram: (
      <DiagramRow><MiniBoard cell={20} cells={bbRowAlmost} /><Arrow /><MiniBoard cell={20} cells={bbRowCleared} /></DiagramRow>
    ) },
    { title: 'اصمد أطول فترة', body: 'القطع تتوالى. تنتهي اللعبة حين لا تتّسع أي قطعة. تجاوز أفضل نتيجة لك!', diagram: <MiniBoard cell={22} cells={[[FILL('#e6bd55'), FILL('#e6bd55'), FILL('#e6bd55')], [GAP(), FILL('#e6bd55'), GAP()]]} /> },
  ],
};

export const DIAGRAM_TUTORIALS = {
  crowns: CROWNS,
  sliding: SLIDING,
  takuzu: TAKUZU,
  hitori: HITORI,
  sudoku: SUDOKU,
  kenken: KENKEN,
  nonogram: NONOGRAM,
  kakuro: KAKURO,
  blockburst: BLOCKBURST,
};

export function getDiagramSteps(puzzleId, isAr) {
  const pack = DIAGRAM_TUTORIALS[puzzleId];
  if (!pack) return null;
  return isAr ? pack.ar : pack.en;
}
