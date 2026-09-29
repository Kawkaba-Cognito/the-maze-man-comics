import fs from 'fs';

const css = fs.readFileSync('src/features/training/domains/attention/games/cancellation/cancelAtlas.css', 'utf8');

const TARGETS = [
  { id: 'cancel-task', cls: 'cancellation-task-game' },
  { id: 'mot', cls: 'ct-mot-root' },
  { id: 'train-switch', cls: 'c3d-root' },
  { id: 'speed-match', cls: 'ct-sm-play' },
  { id: 'math-gates', cls: 'c3d-root' },
  { id: 'intercept', cls: 'ic-root' },
  { id: 'keep-track', cls: 'ct-kt-root' },
  { id: 'story-grid', cls: 'ct-sg-root' },
  { id: 'paired-associates', cls: 'ct-pal3d-root' },
  { id: 'task-switch', cls: 'ct-ts-root' },
  { id: 'mirror-world', cls: 'ct-mw-root' },
  { id: 'sort-shift', cls: 'ct-ss-root' },
  { id: 'gatekeeper', cls: 'gk-root' },
  { id: 'detective', cls: 'ct-det-root' },
  { id: 'rush-hour', cls: 'rh-atlas-root' },
  { id: 'synonyms', cls: 'synonyms-root' },
  { id: 'trivia', cls: 'trivia-root' },
  { id: 'wordle', cls: 'ct-wordle-root' },
];

console.log('=== CHECKING FRIEZE & CLEARANCE RULES FOR ALL 18 GAMES ===\n');

for (const t of TARGETS) {
  // Check if cls::before has starchart-band
  const regexFrieze = new RegExp(`\\.${t.cls}[^{,]*::before`, 'g');
  const hasFrieze = regexFrieze.test(css) || (t.cls === 'c3d-root' && css.includes('.c3d-root::before'));

  // Check dark
  const hasDark = css.includes(t.cls) && (css.includes(`html[data-home-theme='dark']`) && css.includes(`${t.cls}::before`));

  // Check header clearance
  const hasHeaderClearance = css.includes(`${t.cls} .ct-training-play-header`) ||
                             css.includes(`${t.cls} .c3d-ui--overlay`) ||
                             (t.cls === 'c3d-root') ||
                             (t.cls === 'cancellation-task-game');

  console.log(
    t.id.padEnd(20) +
    ('class: ' + t.cls).padEnd(26) +
    (hasFrieze ? 'Frieze: YES  ' : 'Frieze: NO   ') +
    (hasHeaderClearance ? 'Clearance: YES' : 'Clearance: NO ')
  );
}
