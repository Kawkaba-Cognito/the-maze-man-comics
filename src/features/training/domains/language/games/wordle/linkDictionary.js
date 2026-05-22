import { LINK_WORDS_EN } from './link-words-en';
import { WordTrie, findWordsOnGrid } from './wordTrie';

let trie = null;

export function getLinkTrie() {
  if (!trie) trie = WordTrie.fromWords(LINK_WORDS_EN);
  return trie;
}

/** Build trie during idle time so the first round does not hitch. */
export function prewarmLinkTrie() {
  if (trie) return;
  const run = () => {
    try {
      getLinkTrie();
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
export function computeGridWords(grid, size, minLen) {
  return findWordsOnGrid(grid, size, getLinkTrie(), minLen, 8);
}
