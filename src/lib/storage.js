/**
 * localStorage JSON helpers — the one place that owns the try/catch dance.
 * Reads fail soft (privacy mode, corrupt JSON); writes fail soft (quota).
 * Losing persistence must never break gameplay.
 */

export function loadJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / privacy mode */
  }
}

/**
 * createProfileStore(key, defaults) → { load, save }
 *
 * The standard per-game profile store: load() returns the stored object with
 * `defaults` filling any missing/null fields (never returns null); save(obj)
 * persists it whole. Field-level merge matches the old per-game stores'
 * `p.field ?? default` semantics.
 */
export function createProfileStore(key, defaults = {}) {
  return {
    load() {
      const p = loadJson(key);
      const out = { ...defaults };
      if (p && typeof p === 'object' && !Array.isArray(p)) {
        for (const k of Object.keys(p)) if (p[k] != null) out[k] = p[k];
      }
      return out;
    },
    save(profile) {
      saveJson(key, profile || {});
    },
  };
}
