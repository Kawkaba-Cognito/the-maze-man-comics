/**
 * Camera framing for Attention 3D prototypes.
 * Portrait phones need side-fit; desktop needs optical centering under the HUD.
 */

/** Distance for a perspective camera to fit a square of half-extent `half`. */
export function perspectiveFitDistance(camera, half, aspect, pad = 1.2) {
  const a = Math.max(0.2, aspect || 1);
  const h = Math.max(0.5, half) * pad;
  const vFov = (camera.fov * Math.PI) / 180;
  const tan = Math.tan(vFov / 2);
  const distH = h / tan;
  const distW = h / (tan * a);
  return Math.max(distH, distW);
}

/**
 * Fit orthographic camera to a world rect (±halfW × ±halfH).
 * On very wide desktops, cap horizontal zoom-out so the playfield stays large
 * (extra sides show stars/deck instead of shrinking the whole lot).
 */
export function fitOrthographic(camera, halfW, halfH, aspect, pad = 1.12, opts = {}) {
  const a = Math.max(0.2, aspect || 1);
  let w = Math.max(0.5, halfW) * pad;
  let h = Math.max(0.5, halfH) * pad;
  if (w / h < a) w = h * a;
  else h = w / a;

  const maxAspect = opts.maxAspect ?? 1.45;
  if (a > maxAspect) {
    // Limit pillarbox zoom-out: keep height from content, width from maxAspect
    h = Math.max(0.5, halfH) * pad;
    w = h * maxAspect;
  }

  camera.left = -w;
  camera.right = w;
  camera.top = h;
  camera.bottom = -h;
  camera.updateProjectionMatrix();
  return { w, h };
}

/**
 * World-space downward nudge so the playfield sits under a floating top HUD.
 * Returns a positive value to subtract from Y (perspective) or apply to lookAt.
 */
export function hudCenterNudge(viewportH, contentHalf, opts = {}) {
  const hudPx = opts.hudPx ?? Math.min(132, Math.max(64, viewportH * 0.125));
  const frac = hudPx / Math.max(1, viewportH);
  return contentHalf * frac * (opts.strength ?? 1.05);
}

/** True when the primary input is touch / coarse (phones & tablets). */
export function isCoarsePointer() {
  try {
    return window.matchMedia('(pointer: coarse)').matches
      || window.matchMedia('(hover: none)').matches;
  } catch {
    return false;
  }
}

/** Desktop-ish landscape viewport (wide enough to treat as desk). */
export function isDesktopLayout(width, height) {
  return width >= 900 || (width / Math.max(1, height) >= 1.2 && width >= 700);
}
