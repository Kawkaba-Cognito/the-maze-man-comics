const PREFS_KEY = 'mm_tutorial_prefs_v2';

/** @typedef {{ skipped?: boolean, completed?: boolean }} TutorialPrefs */

export function loadTutorialPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function getTutorialPrefs(gameId) {
  return loadTutorialPrefs()[gameId] || {};
}

export function saveTutorialPrefs(gameId, patch) {
  try {
    const map = loadTutorialPrefs();
    map[gameId] = { ...map[gameId], ...patch };
    localStorage.setItem(PREFS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/** Auto onboarding (carousel + trials) should run. */
export function shouldRunOnboarding(gameId) {
  const p = getTutorialPrefs(gameId);
  return !p.skipped && !p.completed;
}

export function markOnboardingSkipped(gameId) {
  saveTutorialPrefs(gameId, { skipped: true });
}

export function markOnboardingComplete(gameId) {
  saveTutorialPrefs(gameId, { completed: true });
}
