/** Root-relative asset URL — works for GitHub Pages and Capacitor (base `./`). */
export function assetUrl(path) {
  const clean = String(path).replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${clean}`;
}

/** Inject CSS custom properties for background images (CSS cannot use import.meta.env). */
export function applyAssetCssVars() {
  const root = document.documentElement;
  const set = (name, path) => root.style.setProperty(name, `url("${assetUrl(path)}")`);

  set('--asset-bg-mobile', 'Assets/bg-mobile.webp');
  set('--asset-bg-desktop', 'Assets/bg-desktop.webp');
  set('--asset-splash-mobile', 'Assets/splash-mobile.png');
  set('--asset-splash-desktop', 'Assets/splash-desktop.png');
  set('--asset-settings-mobile', 'Assets/cancel-task-bg-mobile.png');
  set('--asset-settings-desktop', 'Assets/cancel-task-bg-desktop.png');
}
