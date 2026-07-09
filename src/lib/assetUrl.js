import { homeBgPaths, readAppTheme } from './appTheme';

/** Root-relative asset URL — works for GitHub Pages and Capacitor (base `./`). */
export function assetUrl(path) {
  const clean = String(path).replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}

/** Point global .bg-poster at the active home light/dark stage. */
export function applyThemeAssetCssVars(theme = readAppTheme()) {
  const root = document.documentElement;
  const paths = homeBgPaths(theme);
  root.style.setProperty('--asset-bg-mobile', `url("${assetUrl(paths.mobile)}")`);
  root.style.setProperty('--asset-bg-desktop', `url("${assetUrl(paths.desktop)}")`);
}

/** Inject CSS custom properties for background images (CSS cannot use import.meta.env). */
export function applyAssetCssVars() {
  const root = document.documentElement;
  const set = (name, path) => root.style.setProperty(name, `url("${assetUrl(path)}")`);

  applyThemeAssetCssVars(readAppTheme());
  set('--asset-splash-mobile', 'Assets/splash-menu-mobile-en.webp');
  set('--asset-splash-desktop', 'Assets/splash-menu-desktop-en.webp');
  set('--asset-settings-mobile', 'Assets/cancel-task-bg-mobile.png');
  set('--asset-settings-desktop', 'Assets/cancel-task-bg-desktop.png');
}
