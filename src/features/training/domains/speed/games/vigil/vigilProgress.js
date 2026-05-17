const PROFILE_KEY = 'mm_vigil_v1';

export function loadVigilProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { done: {}, tel: [], bestFree: 0, bestStages: 0 };
    const p = JSON.parse(raw);
    return {
      done: p.done && typeof p.done === 'object' ? p.done : {},
      tel: Array.isArray(p.tel) ? p.tel : [],
      bestFree: Number(p.bestFree) || 0,
      bestStages: Number(p.bestStages) || 0,
    };
  } catch {
    return { done: {}, tel: [], bestFree: 0, bestStages: 0 };
  }
}

export function saveVigilProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* quota */
  }
}
