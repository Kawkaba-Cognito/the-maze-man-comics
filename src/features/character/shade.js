/**
 * Tiny color helpers so characters can be recolored while keeping correct
 * highlights / shadows. Given one base color we derive a full shading ramp,
 * which is what makes flat vector art read as 3D form.
 */
function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }

function toRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
}

/** Mix a color toward white by amount 0..1. */
export function lighten(hex, amt) {
  const { r, g, b } = toRgb(hex);
  return toHex({ r: r + (255 - r) * amt, g: g + (255 - g) * amt, b: b + (255 - b) * amt });
}

/** Mix a color toward black by amount 0..1. */
export function darken(hex, amt) {
  const { r, g, b } = toRgb(hex);
  return toHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}

/** Linear blend between two colors, t = 0..1. */
export function mix(a, b, t) {
  const x = toRgb(a), y = toRgb(b);
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}

/**
 * Build a fur/cloak shading ramp from one base color.
 * key   = top-lit highlight, core = base, deep = occluded shadow.
 */
export function ramp(base) {
  return {
    spec: lighten(base, 0.55),  // soft specular highlight
    key: lighten(base, 0.26),   // lit top planes
    core: base,                 // mid tone
    deep: darken(base, 0.5),    // form shadow
    occ: darken(base, 0.72),    // ambient occlusion (darkest)
  };
}

/** Gold/metallic ramp for trim & ornaments. */
export function metal(base) {
  return {
    hi: lighten(base, 0.55),
    core: base,
    lo: darken(base, 0.5),
  };
}
