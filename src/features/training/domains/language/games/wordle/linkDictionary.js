import { LINK_WORDS_EN } from './link-words-en';
import { LINK_WORDS_AR } from './link-words-ar';
import { LINK_WORDS_AR_COMMON } from './link-words-ar-common';
import { WordTrie, findWordsOnGrid } from './wordTrie';

const tries = {};

// Arabic validation = the full corpus PLUS the curated common list (guarantees
// everyday/modern words are always accepted even if missing from the corpus).
function wordsFor(lang) {
  return lang === 'ar' ? LINK_WORDS_AR.concat(LINK_WORDS_AR_COMMON) : LINK_WORDS_EN;
}

export function getLinkTrie(lang = 'en') {
  const key = lang === 'ar' ? 'ar' : 'en';
  if (!tries[key]) tries[key] = WordTrie.fromWords(wordsFor(key));
  return tries[key];
}

/** Build the trie during idle time so the first round does not hitch. */
export function prewarmLinkTrie(lang = 'en') {
  const key = lang === 'ar' ? 'ar' : 'en';
  if (tries[key]) return;
  const run = () => {
    try {
      getLinkTrie(key);
    } catch {
      /* ignore */
    }
  };
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 0);
  }
}

/** Every valid word that can be spelled on this letter grid. */
export function computeGridWords(grid, size, minLen, lang = 'en') {
  return findWordsOnGrid(grid, size, getLinkTrie(lang), minLen, 6);
}
