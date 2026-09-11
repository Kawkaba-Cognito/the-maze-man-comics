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
  // Attention in-play premium surfaces (not hub/picker cards)
  set('--asset-attn-cancel-playfield', 'Assets/attention/cancel-playfield.svg');
  // Survival's pre-round "ready" card (training.css .ct-fq-cd--ready) — one
  // piece of this game's own hand-inked cosmic atlas as a soft backdrop,
  // replacing a generated photo (Round 4) that broke the atlas's own
  // written art direction. Same atlas the live-board stimuli and the
  // level-select nodes draw from (shapeArt.js / CancelPlanetPath.jsx).
  set('--asset-attn-cancel-atlas-galaxy', 'Assets/training/cancel-cosmic-atlas-2026/galaxy.webp');
  // Results-screen marks (Master Prompt Step 7d) — CSS over the shared
  // PlayResults.jsx's own `.ct-play-results-mark`, one atlas piece per tone.
  // 'neutral' (PlayResults' own default, used by Survival's game-over screen,
  // which never passes a tone) needs its own piece too, or the mark renders
  // as an empty box once its text glyph is hidden.
  set('--asset-attn-cancel-atlas-supernova', 'Assets/training/cancel-cosmic-atlas-2026/supernova.webp');
  set('--asset-attn-cancel-atlas-comet', 'Assets/training/cancel-cosmic-atlas-2026/comet.webp');
  set('--asset-attn-cancel-atlas-moon', 'Assets/training/cancel-cosmic-atlas-2026/moon.webp');
  set('--asset-attn-mot-arena', 'Assets/attention/mot-arena-plate.svg');
  set('--asset-attn-carpark-lot', 'Assets/attention/carpark-lot.svg');
  set('--asset-attn-carpark-garage', 'Assets/attention/carpark-garage.svg');
}
