/**
 * Builds link-words-en.js from words_alpha.txt (3–8 letter lowercase words).
 * Run: node scripts/build-link-words.mjs
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'scripts', 'words_alpha.txt');
const out = join(
  root,
  'src/features/training/domains/language/games/wordle/link-words-en.js',
);

const raw = readFileSync(src, 'utf8');
const words = raw
  .split(/\r?\n/)
  .map((w) => w.trim().toLowerCase())
  .filter((w) => /^[a-z]{3,8}$/.test(w));

const unique = [...new Set(words)].sort();
console.log(`link dictionary: ${unique.length} words (fig=${unique.includes('fig')})`);

const body = `/** Auto-generated — 3–8 letter English words for Word Maze linking */\nexport const LINK_WORDS_EN = ${JSON.stringify(unique)};\n`;
writeFileSync(out, body, 'utf8');
console.log('wrote', out);
