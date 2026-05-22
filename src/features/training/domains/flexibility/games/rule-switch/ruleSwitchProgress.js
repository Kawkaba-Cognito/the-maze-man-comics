const KEY = 'mm_wcst_profile_v1';

export function loadWcstProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        tel: p.tel || [],
        done: p.done || {},
        bestFree: p.bestFree ?? 0,
        bestStages: p.bestStages ?? 0,
      };
    }
  } catch {
    /* ignore */
  }
  return { tel: [], done: {}, bestFree: 0, bestStages: 0 };
}

export function saveWcstProfile(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}
