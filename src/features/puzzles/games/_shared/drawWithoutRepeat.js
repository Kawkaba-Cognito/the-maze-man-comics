import { loadJson, saveJson } from '../../../../lib/storage';
import { rnd, shuffle } from './groupTheme';

/**
 * Draw items without recent repeats (session + persistent deque).
 * Enough history that daily play for a year rarely loops the same prompt.
 */
export function createDrawer(storageKey, { maxRecent = 400 } = {}) {
  const sessionSeen = new Set();

  const loadRecent = () => {
    const raw = loadJson(storageKey, []);
    return Array.isArray(raw) ? raw.map(String) : [];
  };

  const pushRecent = (id) => {
    const prev = loadRecent().filter((x) => x !== id);
    prev.push(id);
    while (prev.length > maxRecent) prev.shift();
    saveJson(storageKey, prev);
  };

  /**
   * @param {Array<{ id?: string }|string>} items
   * @param {(item: any) => string} [getId]
   */
  function draw(items, getId = (it) => String(it?.id ?? it)) {
    if (!items?.length) return null;
    const recent = new Set(loadRecent());
    const fresh = items.filter((it) => {
      const id = getId(it);
      return !sessionSeen.has(id) && !recent.has(id);
    });
    const pool = fresh.length ? fresh : items.filter((it) => !sessionSeen.has(getId(it)));
    const pickFrom = pool.length ? pool : items;
    const item = pickFrom[rnd(pickFrom.length)];
    const id = getId(item);
    sessionSeen.add(id);
    pushRecent(id);
    return item;
  }

  /** Shuffle a pack into a queue, preferring unseen items first. */
  function makeQueue(items, getId = (it) => String(it?.id ?? it)) {
    const recent = new Set(loadRecent());
    const a = [];
    const b = [];
    for (const it of items) {
      const id = getId(it);
      if (sessionSeen.has(id) || recent.has(id)) b.push(it);
      else a.push(it);
    }
    return [...shuffle(a), ...shuffle(b)];
  }

  function mark(id) {
    const s = String(id);
    sessionSeen.add(s);
    pushRecent(s);
  }

  return { draw, makeQueue, mark, sessionSeen };
}
