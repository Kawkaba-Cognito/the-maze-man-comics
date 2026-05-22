/** Trie for fast prefix lookup (Boggle-style grid word search). */

export class WordTrie {
  constructor() {
    this.root = { c: Object.create(null) };
  }

  insert(word) {
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!node.c[ch]) node.c[ch] = { c: Object.create(null) };
      node = node.c[ch];
    }
    node.w = 1;
  }

  static fromWords(words) {
    const trie = new WordTrie();
    for (let i = 0; i < words.length; i++) trie.insert(words[i]);
    return trie;
  }
}

const DIRS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

/**
 * All dictionary words formable on this grid (adjacent, no reuse per word).
 */
export function findWordsOnGrid(grid, size, trie, minLen, maxLen = 8) {
  const found = new Set();
  const used = new Uint8Array(size * size);
  const n = size * size;

  function dfs(idx, node, wordSoFar) {
    const ch = grid[idx];
    const next = node.c[ch];
    if (!next) return;

    const w = wordSoFar + ch;
    if (next.w && w.length >= minLen) found.add(w);
    if (w.length >= maxLen) return;

    used[idx] = 1;
    const r = (idx / size) | 0;
    const c = idx % size;

    for (let d = 0; d < DIRS.length; d++) {
      const nr = r + DIRS[d][0];
      const nc = c + DIRS[d][1];
      if (nr < 0 || nc < 0 || nr >= size || nc >= size) continue;
      const ni = nr * size + nc;
      if (!used[ni]) dfs(ni, next, w);
    }
    used[idx] = 0;
  }

  for (let i = 0; i < n; i++) dfs(i, trie.root, '');
  return found;
}
