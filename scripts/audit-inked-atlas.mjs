import fs from 'fs';
import path from 'path';

const GAMES = [
  // Attention
  { id: 'cancel-task', domain: 'attention', files: ['src/features/training/domains/attention/games/cancellation/index.jsx'] },
  { id: 'mot', domain: 'attention', files: ['src/features/training/domains/attention/games/mot/index.jsx'] },
  { id: 'train-switch', domain: 'attention', files: ['src/features/training/domains/attention/games/train-switch/index.jsx', 'src/features/training/domains/attention/games/train-switch/CarPark3DProto.jsx'] },
  // Speed
  { id: 'speed-match', domain: 'speed', files: ['src/features/training/domains/speed/games/speed-match/index.jsx'] },
  { id: 'math-gates', domain: 'speed', files: ['src/features/training/domains/speed/games/math-gates/index.jsx', 'src/features/training/domains/speed/games/math-gates/MathGatesBoard2D.jsx'] },
  { id: 'intercept', domain: 'speed', files: ['src/features/training/domains/speed/games/intercept/index.jsx'] },
  // Memory
  { id: 'keep-track', domain: 'memory', files: ['src/features/training/domains/memory/games/keep-track/index.jsx'] },
  { id: 'story-grid', domain: 'memory', files: ['src/features/training/domains/memory/games/story-grid/index.jsx'] },
  { id: 'paired-associates', domain: 'memory', files: ['src/features/training/domains/memory/games/paired-associates/index.jsx', 'src/features/training/domains/memory/games/paired-associates/PairedAssociates3DProto.jsx'] },
  // Flexibility
  { id: 'task-switch', domain: 'flexibility', files: ['src/features/training/domains/flexibility/games/task-switch/index.jsx'] },
  { id: 'mirror-world', domain: 'flexibility', files: ['src/features/training/domains/flexibility/games/mirror-world/index.jsx'] },
  { id: 'sort-shift', domain: 'flexibility', files: ['src/features/training/domains/flexibility/games/sort-shift/index.jsx'] },
  // Reasoning
  { id: 'gatekeeper', domain: 'reasoning', files: ['src/features/training/domains/reasoning/games/gatekeeper/index.jsx'] },
  { id: 'detective', domain: 'reasoning', files: ['src/features/training/domains/reasoning/games/detective/index.jsx'] },
  { id: 'rush-hour', domain: 'reasoning', files: ['src/features/training/domains/reasoning/games/rush-hour/index.jsx'] },
  // Language
  { id: 'synonyms', domain: 'language', files: ['src/features/training/domains/language/games/synonyms/index.jsx'] },
  { id: 'trivia', domain: 'language', files: ['src/features/training/domains/language/games/trivia/index.jsx'] },
  { id: 'wordle', domain: 'language', files: ['src/features/training/domains/language/games/wordle/index.jsx'] },
];

const cssPath = 'src/features/training/domains/attention/games/cancellation/cancelAtlas.css';
const atlasCss = fs.readFileSync(cssPath, 'utf8');

console.log('=== AUDITING INKED ATLAS CONFORMANCE FOR ALL 18 GAMES ===\n');

const results = [];

for (const g of GAMES) {
  let combinedJsx = '';
  for (const f of g.files) {
    if (fs.existsSync(f)) {
      combinedJsx += '\n' + fs.readFileSync(f, 'utf8');
    }
  }

  // 1. Check cx-atlas in JSX
  const hasAtlasClass = combinedJsx.includes('cx-atlas');

  // 2. Check css frieze rule
  // We search for selectors targeting this game in cancelAtlas.css
  const cssHasSelector = atlasCss.includes(g.id) ||
    (g.id === 'cancel-task' && atlasCss.includes('.cancellation-task-game')) ||
    (g.id === 'mot' && atlasCss.includes('ct-mot-play')) ||
    (g.id === 'train-switch' && (atlasCss.includes('ct-spaceport') || atlasCss.includes('c3d-root'))) ||
    (g.id === 'speed-match' && atlasCss.includes('ct-sm-play')) ||
    (g.id === 'math-gates' && (atlasCss.includes('math-gates') || atlasCss.includes('c3d-root'))) ||
    (g.id === 'intercept' && atlasCss.includes('ic-root')) ||
    (g.id === 'keep-track' && atlasCss.includes('ct-kt-root')) ||
    (g.id === 'story-grid' && atlasCss.includes('ct-sg-root')) ||
    (g.id === 'paired-associates' && (atlasCss.includes('paired') || atlasCss.includes('c3d-root'))) ||
    (g.id === 'task-switch' && atlasCss.includes('ct-ts-root')) ||
    (g.id === 'mirror-world' && atlasCss.includes('ct-mw-root')) ||
    (g.id === 'sort-shift' && atlasCss.includes('ct-ss-root')) ||
    (g.id === 'gatekeeper' && atlasCss.includes('gk-root')) ||
    (g.id === 'detective' && atlasCss.includes('ct-det-root')) ||
    (g.id === 'rush-hour' && atlasCss.includes('rh-atlas-root')) ||
    (g.id === 'synonyms' && atlasCss.includes('synonyms-root')) ||
    (g.id === 'trivia' && atlasCss.includes('trivia-root')) ||
    (g.id === 'wordle' && atlasCss.includes('ct-wordle-root'));

  // 3. Check for old backgrounds (hardcoded legacy hex colors or old background paths in JSX)
  const legacyBgs = [];
  const bgMatches = combinedJsx.matchAll(/background(?:Color)?\s*:\s*['"`]([^'"`]+)['"`]/gi);
  for (const m of bgMatches) {
    const val = m[1].trim();
    // Flag if it's a hardcoded hex or rgb or url that isn't a token
    if (val.startsWith('#') || val.startsWith('rgb(') || val.includes('cyber') || val.includes('neon') || val.includes('minimal')) {
      legacyBgs.push(val);
    }
  }

  results.push({
    id: g.id,
    domain: g.domain,
    hasAtlasClass,
    cssHasSelector,
    legacyBgs,
  });
}

console.log(
  'Game'.padEnd(20) +
  'Domain'.padEnd(14) +
  'JSX cx-atlas'.padEnd(16) +
  'Atlas CSS'.padEnd(14) +
  'Suspicious Bgs'
);
console.log('-'.repeat(80));

for (const r of results) {
  console.log(
    r.id.padEnd(20) +
    r.domain.padEnd(14) +
    (r.hasAtlasClass ? '✓ YES' : '✗ NO ').padEnd(16) +
    (r.cssHasSelector ? '✓ YES' : '✗ NO ').padEnd(14) +
    (r.legacyBgs.length ? r.legacyBgs.slice(0, 3).join(', ') : 'none (clean)')
  );
}
