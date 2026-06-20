import React from 'react';
import { MiniBoard, Captioned, DiagramRow, Arrow, ProblemAnswer, crownsCells } from './TutorialDiagram';

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

const PRACTICE_NOTE = {
  en: 'Next you will try a short practice puzzle — first with hints, then on your own.',
  ar: 'بعد ذلك ستجرب لغزاً قصيراً — أولاً مع تلميحات، ثم بنفسك.',
};

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
    { title: 'Solve by deduction', body: 'Each color holds exactly one crown. If × rules out every cell of a region but one, that cell must be the crown.', diagram: <MiniBoard cell={32} cells={crownsCells(REGION4, RC, { marks: [[0, 2], [0, 3], [1, 2], [2, 3]], crowns: [[1, 3]], rings: { '1,3': 'good' } })} />, note: PRACTICE_NOTE.en },
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
    { title: 'الحل بالاستنتاج', body: 'كل لون يحمل تاجاً واحداً. إذا استبعدت × كل خلايا منطقة إلا واحدة، فتلك هي التاج.', diagram: <MiniBoard cell={32} cells={crownsCells(REGION4, RC, { marks: [[0, 2], [0, 3], [1, 2], [2, 3]], crowns: [[1, 3]], rings: { '1,3': 'good' } })} />, note: PRACTICE_NOTE.ar },
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
    { title: 'Fewer moves win', body: 'Pick 3×3 for a quick game or up to 6×6 for a challenge. Fewer moves and faster time = bragging rights.', diagram: <MiniBoard cell={30} cells={slidGoal} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    { title: 'الألواح المنزلقة', body: 'حرّك الألواح حتى تصبح ١، ٢، ٣ … مع الفراغ في الزاوية الأخيرة.', diagram: <MiniBoard cell={30} cells={slidGoal} /> },
    { title: 'اضغط للتحريك', body: 'اضغط لوحاً بجانب الفراغ فينزلق. اضغط لوحاً أبعد في نفس الخط فينزلق الخط كله.', diagram: (
      <DiagramRow><MiniBoard cell={30} cells={[[C(4), GAP(), C(6)]]} /><Arrow /><MiniBoard cell={30} cells={[[C(4), C(6), GAP()]]} /></DiagramRow>
    ) },
    { title: 'حركات أقل تفوز', body: '٣×٣ سريع أو حتى ٦×٦ للتحدّي. حركات أقل ووقت أسرع = فخر.', diagram: <MiniBoard cell={30} cells={slidGoal} />, note: PRACTICE_NOTE.ar },
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
    { title: 'Balance the line', body: 'Tap a cell to cycle empty → 0 → 1. Each row and column ends with the same number of 0s and 1s.', diagram: <MiniBoard cell={30} cells={[[C(1), C(1), C(0), C(0)]]} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    { title: 'تاكوزو', body: 'املأ كل خلية بـ ٠ أو ١. كل صف وعمود يحتاج عدداً متساوياً من كلٍّ.', diagram: <MiniBoard cell={30} cells={[[C(1), C(0), C(1), C(0)], [C(0), C(1), C(0), C(1)]]} /> },
    { title: 'لا ثلاثة متتالية', body: 'لا يجوز ثلاثة أرقام متماثلة في خط — صحّح بتبديل واحد.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="ثلاثة"><MiniBoard cell={28} cells={[[C(1, { ring: 'bad' }), C(1, { ring: 'bad' }), C(1, { ring: 'bad' })]]} /></Captioned>
        <Captioned kind="good" label="صحيح"><MiniBoard cell={28} cells={[[C(1), C(1), C(0, { ring: 'good' })]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'وازِن الخط', body: 'اضغط للتبديل: فارغ ← ٠ ← ١. كل صف وعمود ينتهي بعدد متساوٍ من ٠ و١.', diagram: <MiniBoard cell={30} cells={[[C(1), C(1), C(0), C(0)]]} />, note: PRACTICE_NOTE.ar },
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
    { title: 'Stay connected', body: 'All unshaded (white) cells must stay joined as one group — never fence one off.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    { title: 'هيتوري', body: 'ظلّل خلايا حتى لا يتكرر رقم بين الخلايا البيضاء في أي صف أو عمود.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} /> },
    { title: 'لا تظليل متجاور', body: 'لا تتلامس خليتان مظللتان حافة بحافة (الزوايا القطرية مسموحة).', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="تلامس"><MiniBoard cell={28} cells={[[SH(2), SH(2)], [C(1), C(3)]]} /></Captioned>
        <Captioned kind="good" label="صحيح"><MiniBoard cell={28} cells={[[SH(2), C(2)], [C(1), SH(3)]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'ابقَ متصلاً', body: 'يجب أن تبقى كل الخلايا البيضاء متصلة كمجموعة واحدة — لا تعزل أي خلية.', diagram: <MiniBoard cell={30} cells={[[C(2), SH(3), C(1)], [C(3), C(1), SH(3)], [SH(1), C(2), C(3)]]} />, note: PRACTICE_NOTE.ar },
  ],
};

// ── SUDOKU ──────────────────────────────────────────────────────────
const sudokuProblem = [
  [C(1), C(2), C(''), C('')],
  [C(''), C(''), C(1), C(2)],
  [C(2), C(''), C(''), C(1)],
  [C(''), C(1), C(2), C('')],
];
const sudokuAnswer = [
  [C(1), C(2), C(3, { answer: true, fg: '#c0392b' }), C(4, { answer: true, fg: '#c0392b' })],
  [C(3, { answer: true, fg: '#c0392b' }), C(4, { answer: true, fg: '#c0392b' }), C(1), C(2)],
  [C(2), C(3, { answer: true, fg: '#c0392b' }), C(4, { answer: true, fg: '#c0392b' }), C(1)],
  [C(4, { answer: true, fg: '#c0392b' }), C(1), C(2), C(3, { answer: true, fg: '#c0392b' })],
];
const SUDOKU = {
  en: [
    {
      title: 'Fill the grid',
      body: 'Every row, column, and box must contain each number exactly once. In 4×4 use 1–4; in 9×9 use 1–9.',
      diagram: (
        <ProblemAnswer
          isAr={false}
          problem={<MiniBoard cell={26} cells={sudokuProblem} />}
          answer={<MiniBoard cell={26} cells={sudokuAnswer} />}
        />
      ),
    },
    { title: 'No repeats in a line', body: 'A number can’t appear twice in the same row, column, or box.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="two 3s"><MiniBoard cell={28} cells={[[C(3, { ring: 'bad' }), C(1), C(3, { ring: 'bad' }), C(2)]]} /></Captioned>
        <Captioned kind="good" label="ok"><MiniBoard cell={28} cells={[[C(3), C(1), C(4, { ring: 'good' }), C(2)]]} /></Captioned>
      </DiagramRow>
    ) },
    {
      title: 'How to play',
      body: 'Tap a blank cell and choose a number. Given cells are fixed and cannot be changed.',
      diagram: <MiniBoard cell={28} cells={sudokuAnswer} />,
      note: 'Next you will try a short practice puzzle — first with hints, then on your own.',
    },
  ],
  ar: [
    {
      title: 'املأ الشبكة',
      body: 'كل صف وعمود وصندوق يحتوي كل رقم مرة واحدة. في ٤×٤ استخدم ١–٤؛ في ٩×٩ استخدم ١–٩.',
      diagram: (
        <ProblemAnswer
          isAr
          problem={<MiniBoard cell={26} cells={sudokuProblem} />}
          answer={<MiniBoard cell={26} cells={sudokuAnswer} />}
        />
      ),
    },
    { title: 'لا تكرار في الخط', body: 'لا يظهر رقم مرتين في نفس الصف أو العمود أو الصندوق.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="٣ مكرر"><MiniBoard cell={28} cells={[[C(3, { ring: 'bad' }), C(1), C(3, { ring: 'bad' }), C(2)]]} /></Captioned>
        <Captioned kind="good" label="صحيح"><MiniBoard cell={28} cells={[[C(3), C(1), C(4, { ring: 'good' }), C(2)]]} /></Captioned>
      </DiagramRow>
    ) },
    {
      title: 'كيف تلعب',
      body: 'اضغط خلية فارغة واختر رقماً. الخلايا المعطاة ثابتة ولا يمكن تغييرها.',
      diagram: <MiniBoard cell={28} cells={sudokuAnswer} />,
      note: 'بعد ذلك ستجرب لغزاً قصيراً — أولاً مع تلميحات، ثم بنفسك.',
    },
  ],
};

// ── KENKEN ──────────────────────────────────────────────────────────
const kkProblem = [
  [C('2-', { fg: '#7a4a10', bg: '#fff4dd' }), C('', { bg: '#fffdf8' }), C('6×', { fg: '#7a4a10', bg: '#fff4dd' })],
  [C(''), C('12×', { fg: '#7a4a10', bg: '#fff4dd' }), C('')],
  [C('3÷', { fg: '#7a4a10', bg: '#fff4dd' }), C(''), C('')],
];
const kkAnswer = [
  [C('2', { answer: true, fg: '#c0392b' }), C('3', { answer: true, fg: '#c0392b' }), C('1', { answer: true, fg: '#c0392b' })],
  [C('1', { answer: true, fg: '#c0392b' }), C('3', { answer: true, fg: '#c0392b' }), C('2', { answer: true, fg: '#c0392b' })],
  [C('3', { answer: true, fg: '#c0392b' }), C('2', { answer: true, fg: '#c0392b' }), C('1', { answer: true, fg: '#c0392b' })],
];
const KENKEN = {
  en: [
    {
      title: 'Fill the grid',
      body: 'Fill each square with a number. In a 3×3 puzzle use 1–3; in 4×4 use 1–4, and so on. No number repeats in any row or column.',
      diagram: (
        <ProblemAnswer
          isAr={false}
          problem={<MiniBoard cell={34} cells={kkProblem} />}
          answer={<MiniBoard cell={34} cells={kkAnswer} />}
        />
      ),
      pills: ['In 3×3 use numbers 1–3', 'In 4×4 use numbers 1–4', 'In 5×5 use numbers 1–5'],
    },
    {
      title: 'Cages must work',
      body: 'Thick outlines are cages. The small label is a target and operation — for example “2−” means the two cells in that cage must subtract to 2.',
      diagram: (
        <DiagramRow>
          <Captioned label="2− cage"><MiniBoard cell={32} cells={[[C('2', { answer: true, fg: '#c0392b' }), C('3', { answer: true, fg: '#c0392b' })]]} /></Captioned>
          <Arrow />
          <span className="mm-tut-inline-eq">|2 − 3| = 1 ✓</span>
        </DiagramRow>
      ),
    },
    {
      title: 'How to play',
      body: 'Tap a cell, then pick a number from the pad. Every row, column, and cage must be satisfied. There is exactly one correct solution.',
      diagram: <MiniBoard cell={32} cells={kkAnswer} />,
      note: 'Next you will try a short practice puzzle — first with hints, then on your own.',
    },
  ],
  ar: [
    {
      title: 'املأ الشبكة',
      body: 'املأ كل مربع برقم. في لغز ٣×٣ استخدم ١–٣؛ في ٤×٤ استخدم ١–٤، وهكذا. لا يتكرر رقم في أي صف أو عمود.',
      diagram: (
        <ProblemAnswer
          isAr
          problem={<MiniBoard cell={34} cells={kkProblem} />}
          answer={<MiniBoard cell={34} cells={kkAnswer} />}
        />
      ),
      pills: ['في ٣×٣ استخدم ١–٣', 'في ٤×٤ استخدم ١–٤', 'في ٥×٥ استخدم ١–٥'],
    },
    {
      title: 'الأقفاص يجب أن تتحقق',
      body: 'الخطوط السميكة هي أقفاص. العلامة الصغيرة هدف وعملية — مثل «2−» تعني أن الخليتين في القفص يجب أن يكون فرقهما ٢.',
      diagram: (
        <DiagramRow>
          <Captioned label="قفص 2−"><MiniBoard cell={32} cells={[[C('2', { answer: true, fg: '#c0392b' }), C('3', { answer: true, fg: '#c0392b' })]]} /></Captioned>
          <Arrow />
          <span className="mm-tut-inline-eq">|٢ − ٣| = ١ ✓</span>
        </DiagramRow>
      ),
    },
    {
      title: 'كيف تلعب',
      body: 'اضغط خلية ثم اختر رقماً من اللوحة. كل صف وعمود وقفص يجب أن يتحقق. هناك حل واحد فقط.',
      diagram: <MiniBoard cell={32} cells={kkAnswer} />,
      note: 'بعد ذلك ستجرب لغزاً قصيراً — أولاً مع تلميحات، ثم بنفسك.',
    },
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
    { title: 'Fill or mark', body: 'Use Fill to blacken a cell, or Mark to put ✕ where you know it’s empty. Match every clue.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    { title: 'نونوغرام', body: 'الدلائل الرقمية تخبرك بعدد الخلايا المملوءة في كل صف وعمود.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} /> },
    { title: 'اقرأ الكتل', body: 'دليل مثل «٢ ١» يعني كتلة من خليتين، فراغ، ثم خلية واحدة.', diagram: (
      <DiagramRow><div className="ct-tut-tag ct-tut-tag--good" style={{ background: '#e9e1d0', color: '#1a1208' }}>٢ ١</div><Arrow /><MiniBoard cell={28} cells={nonoRun} /></DiagramRow>
    ) },
    { title: 'تعبئة أو علامة', body: 'استخدم التعبئة لتسويد خلية، أو العلامة ✕ للخلايا الفارغة المؤكدة. طابق كل الدلائل.', diagram: <MiniBoard cell={28} cells={[[FILL(), GAP(), FILL(), FILL()], [GAP(), FILL(), FILL(), GAP()]]} />, note: PRACTICE_NOTE.ar },
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
    { title: 'Read the clue cell', body: 'The black cell’s top-right number is the across sum; the bottom-left is the down sum. Purple cells are fixed.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    { title: 'كاكورو', body: 'كلمات متقاطعة رقمية: كل مسار أبيض يجب أن يساوي مجموعه بأرقام ١–٩.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} /> },
    { title: 'لا تكرار في المسار', body: 'لا تتكرر الأرقام داخل مسار واحد. هنا ٤ = ١ + ٣.', diagram: (
      <DiagramRow>
        <Captioned kind="bad" label="٢ + ٢"><MiniBoard cell={28} cells={[[{ content: '4', bg: '#141210', fg: '#fff7f2' }, C(2, { ring: 'bad' }), C(2, { ring: 'bad' })]]} /></Captioned>
        <Captioned kind="good" label="١ + ٣"><MiniBoard cell={28} cells={[[{ content: '4', bg: '#141210', fg: '#fff7f2' }, C(1, { ring: 'good' }), C(3, { ring: 'good' })]]} /></Captioned>
      </DiagramRow>
    ) },
    { title: 'اقرأ خلية الدليل', body: 'الرقم أعلى-يمين الخلية السوداء هو المجموع الأفقي، وأسفل-يسار هو العمودي. الخلايا البنفسجية ثابتة.', diagram: <MiniBoard cell={30} cells={[[kakClue, C(1), C(3)]]} />, note: PRACTICE_NOTE.ar },
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
    { title: 'Last as long as you can', body: 'New pieces keep coming. It’s game over when none of your pieces fit. Beat your best score!', diagram: <MiniBoard cell={22} cells={[[FILL('#e6bd55'), FILL('#e6bd55'), FILL('#e6bd55')], [GAP(), FILL('#e6bd55'), GAP()]]} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    { title: 'انفجار المكعّبات', body: 'اسحب قطع المكعّبات من الدرج إلى شبكة ٨×٨.', diagram: <MiniBoard cell={22} cells={[[FILL('#5fa9d8'), FILL('#5fa9d8')], [FILL('#5fa9d8'), GAP()]]} /> },
    { title: 'املأ خطاً لتفجيره', body: 'أكمل صفاً أو عموداً كاملاً فينفجر وتكسب نقاطاً — والتركيبات تمسح عدة خطوط دفعة.', diagram: (
      <DiagramRow><MiniBoard cell={20} cells={bbRowAlmost} /><Arrow /><MiniBoard cell={20} cells={bbRowCleared} /></DiagramRow>
    ) },
    { title: 'اصمد أطول فترة', body: 'القطع تتوالى. تنتهي اللعبة حين لا تتّسع أي قطعة. تجاوز أفضل نتيجة لك!', diagram: <MiniBoard cell={22} cells={[[FILL('#e6bd55'), FILL('#e6bd55'), FILL('#e6bd55')], [GAP(), FILL('#e6bd55'), GAP()]]} />, note: PRACTICE_NOTE.ar },
  ],
};

// ── BRIDGES ─────────────────────────────────────────────────────────
const bridgeProblem = [
  [C('3'), C(''), C('2')],
  [C(''), C('4'), C('')],
  [C('2'), C(''), C('3')],
];
const bridgeAnswer = [
  [C('3', { ring: 'good' }), C('═', { fg: '#2a6fb0', bg: '#e8f2fb' }), C('2', { ring: 'good' })],
  [C('║', { fg: '#2a6fb0', bg: '#e8f2fb' }), C('4', { ring: 'good' }), C('║', { fg: '#2a6fb0', bg: '#e8f2fb' })],
  [C('2', { ring: 'good' }), C('═', { fg: '#2a6fb0', bg: '#e8f2fb' }), C('3', { ring: 'good' })],
];
const BRIDGES = {
  en: [
    {
      title: 'Connect the islands',
      body: 'Each numbered island needs that many bridges. Connect every island into one network.',
      diagram: (
        <ProblemAnswer
          isAr={false}
          problem={<MiniBoard cell={28} cells={bridgeProblem} />}
          answer={<MiniBoard cell={28} cells={bridgeAnswer} />}
        />
      ),
    },
    { title: 'Tap two neighbours', body: 'Tap one island, then an adjacent island to add a bridge. Tap again on the same pair for a double bridge.', diagram: (
      <DiagramRow><MiniBoard cell={28} cells={[[C('2'), C(''), C('3')]]} /><Arrow /><MiniBoard cell={28} cells={[[C('2'), C('─', { fg: '#2a6fb0' }), C('3')]]} /></DiagramRow>
    ) },
    { title: 'No crossings', body: 'Bridges cannot cross each other. Plan paths so every island’s count is satisfied.', diagram: <MiniBoard cell={28} cells={bridgeAnswer} />, note: PRACTICE_NOTE.en },
  ],
  ar: [
    {
      title: 'وصّل الجزر',
      body: 'كل جزيرة مرقّمة تحتاج ذلك العدد من الجسور. اربط كل الجزر في شبكة واحدة.',
      diagram: (
        <ProblemAnswer
          isAr
          problem={<MiniBoard cell={28} cells={bridgeProblem} />}
          answer={<MiniBoard cell={28} cells={bridgeAnswer} />}
        />
      ),
    },
    { title: 'اضغط جارتين', body: 'اضغط جزيرة ثم جارتها لإضافة جسر. اضغط نفس الزوج مرة أخرى لجسر مزدوج.', diagram: (
      <DiagramRow><MiniBoard cell={28} cells={[[C('2'), C(''), C('3')]]} /><Arrow /><MiniBoard cell={28} cells={[[C('2'), C('─', { fg: '#2a6fb0' }), C('3')]]} /></DiagramRow>
    ) },
    { title: 'لا تقاطع', body: 'لا يجوز أن تتقاطع الجسور. خطّط المسارات حتى يتحقق عدد كل جزيرة.', diagram: <MiniBoard cell={28} cells={bridgeAnswer} />, note: PRACTICE_NOTE.ar },
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
  bridges: BRIDGES,
};

export function getDiagramSteps(puzzleId, isAr) {
  const pack = DIAGRAM_TUTORIALS[puzzleId];
  if (!pack) return null;
  return isAr ? pack.ar : pack.en;
}
