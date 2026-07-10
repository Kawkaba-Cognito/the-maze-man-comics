/** App-wide light/dark theme — same assets & mood as Home. */

export const APP_THEME_KEY = 'mazeman_home_theme';

export function readAppTheme() {
  try {
    return localStorage.getItem(APP_THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
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
