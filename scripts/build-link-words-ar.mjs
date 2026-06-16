/**
 * Normalises an Arabic word source into the skeleton form Word Maze expects, and
 * validates the bundled list. Two uses:
 *
 *   node scripts/build-link-words-ar.mjs                 → validate the current list
 *   node scripts/build-link-words-ar.mjs src.txt [cap]   → rebuild from a corpus
 *
 * The bundled link-words-ar.js was generated from the MIT-licensed frequency list:
 *   https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ar/ar_full.txt
 * capped to the 60,000 most-frequent words. Source lines may be "word" or
 * "word count"; we take the first token and keep input (frequency) order so the
 * cap retains common words.
 *
 * SECURITY: only word DATA is emitted (a string array — no code). Every entry is
 * passed through a strict whitelist (the 28 Arabic letters + ة, length 3–6), so
 * nothing but clean Arabic words can enter the bundle.
 *
 * Normalisation (must match the letters the grid can produce):
 *   strip tatweel + harakat; أ إ آ → ا ; ؤ → و ; ئ ى → ي ; drop ء ; keep ة.
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'src/features/training/domains/language/games/wordle/link-words-ar.js');

const ALLOWED = new Set('ابتثجحخدذرزسشصضطظعغفقكلمنهوية'.split(''));

export function normalizeArabic(raw) {
  return raw
    .replace(/[ـ]/g, '')               // tatweel
    .replace(/[ً-ْٰ]/g, '')   // harakat
    .replace(/[أإآ]/g, 'ا') // أ إ آ → ا
    .replace(/ؤ/g, 'و')            // ؤ → و
    .replace(/[ئى]/g, 'ي')    // ئ ى → ي
    .replace(/ء/g, '')                  // drop standalone ء
    .trim();
}

// Keep the most-frequent CAP words. Source lines may be "word" or "word count"
// (frequency lists) — we take the first token and preserve input order (highest
// frequency first), so the cap keeps common words, then sort for output.
export function cleanList(lines, cap = Infinity) {
  const out = new Set();
  for (const line of lines) {
    const tok = line.trim().split(/\s+/)[0] || '';
    const w = normalizeArabic(tok);
    if (w.length < 3 || w.length > 6) continue;
    if (![...w].every((ch) => ALLOWED.has(ch))) continue;
    out.add(w);
    if (out.size >= cap) break;
  }
  return [...out].sort();
}

// ── rebuild from a raw corpus file, if given ──
const srcArg = process.argv[2];
if (srcArg) {
  const cap = Number(process.argv[3]) || 60000;
  const raw = readFileSync(join(root, srcArg), 'utf8').split(/\r?\n/);
  const list = cleanList(raw, cap);
  const body = `/** Auto-generated from ${srcArg} — normalised 3–6 letter Arabic skeletons for Word Maze */\nexport const LINK_WORDS_AR = ${JSON.stringify(list)};\n`;
  writeFileSync(outFile, body, 'utf8');
  console.log(`wrote ${list.length} words → ${outFile}`);
} else {
  // ── validate the bundled list ──
  const mod = await import('../src/features/training/domains/language/games/wordle/link-words-ar.js');
  const list = mod.LINK_WORDS_AR;
  let bad = 0;
  const seen = new Set();
  for (const w of list) {
    const norm = normalizeArabic(w);
    if (norm !== w) { bad++; console.error('NOT NORMALISED:', JSON.stringify(w), '→', JSON.stringify(norm)); }
    else if (w.length < 3 || w.length > 6) { bad++; console.error('BAD LENGTH:', w, w.length); }
    else if (![...w].every((ch) => ALLOWED.has(ch))) { bad++; console.error('BAD CHAR:', w); }
    if (seen.has(w)) console.warn('dup:', w);
    seen.add(w);
  }
  console.log(`AR list: ${list.length} words, ${seen.size} unique, ${bad} invalid`);
  process.exit(bad ? 1 : 0);
}
