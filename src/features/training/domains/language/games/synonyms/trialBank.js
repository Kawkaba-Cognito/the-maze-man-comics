import { TRIALS } from './data';
import { genProcedural } from './procedural';

const SEEN_KEY = 'mm_wordlinks_seen_v1';

export const AUTHORED = TRIALS.map((t, i) => ({ ...t, id: `auth:${i}` }));

export function loadSeen() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveSeen(map) {
  try {
    const entries = Object.entries(map);
    if (entries.length > 1200) {
      entries.sort((a, b) => a[1] - b[1]);
      for (const [k] of entries.slice(0, entries.length - 900)) delete map[k];
    }
    localStorage.setItem(SEEN_KEY, JSON.stringify(map));
  } catch { /* storage blocked */ }
}

export function markSeen(id, persist) {
  if (!persist || !id) return;
  const seen = loadSeen();
  seen[id] = Date.now();
  saveSeen(seen);
}

function shuffle(a, rng) {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickFromPool(pool, rng, seen, persist) {
  if (!pool.length) return null;
  const unseen = persist ? pool.filter((t) => !seen[t.id]) : pool;
  const ordered = unseen.length ? shuffle(unseen, rng) : shuffle(pool, rng).sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
  return ordered[0] ?? pool[Math.floor(rng() * pool.length)];
}

/** Pick an authored or procedural trial, preferring unseen items. */
export function pickTrial({ kind, tier, rng, persist = true, preferProcedural = true }) {
  const seen = persist ? loadSeen() : {};
  const authored = AUTHORED.filter((t) => t.kind === kind && t.tier === tier);
  let fallbackAuth = AUTHORED.filter((t) => t.kind === kind);
  if (!fallbackAuth.length) fallbackAuth = AUTHORED.filter((t) => t.kind === 'similarity');

  if (preferProcedural && kind !== 'odd') {
    for (let attempt = 0; attempt < 24; attempt++) {
      const proc = genProcedural(kind, rng, tier);
      if (proc && (!persist || !seen[proc.id])) return proc;
    }
    const proc = genProcedural(kind, rng, tier);
    if (proc) return proc;
  }

  return pickFromPool(authored, rng, seen, persist)
    || pickFromPool(fallbackAuth, rng, seen, persist)
    || pickFromPool(AUTHORED, rng, seen, persist);
}

export function bankStats() {
  const byKind = { similarity: 0, analogy: 0, pair: 0 };
  for (const t of AUTHORED) byKind[t.kind] = (byKind[t.kind] || 0) + 1;
  return { authored: AUTHORED.length, byKind };
}
