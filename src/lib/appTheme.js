/** App-wide light/dark theme — same assets & mood as Home. */

export const APP_THEME_KEY = 'mazeman_home_theme';

/*
 * Light is the default (2026-07-27, was dark).
 *
 * The training games are drawn light — 37 cream/white panel fills against 8
 * dark — and their play surface is now pinned light regardless of theme,
 * because background luminance is a measurement parameter for timed tasks
 * rather than a preference. A dark default meant the chrome around those games
 * fought them. Kawnera is cream paper too. Only the Home universe is properly
 * dark, and it ignores this setting entirely.
 *
 * An explicit choice still wins: anyone who picked dark keeps dark.
 */
export function readAppTheme() {
  try {
    return localStorage.getItem(APP_THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function writeAppTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  try {
    localStorage.setItem(APP_THEME_KEY, next);
  } catch { /* ignore */ }
  return next;
}

export function applyThemeToDocument(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.homeTheme = next;
  return next;
}

/** Home one-door backgrounds for the active theme. */
export function homeBgPaths(theme) {
  const t = theme === 'dark' ? 'dark' : 'light';
  return {
    mobile: `Assets/bg-home-${t}-mobile.webp`,
    desktop: `Assets/bg-home-${t}-desktop.webp`,
  };
}
