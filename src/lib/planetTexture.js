/*
 * A tiny, reusable "planet surface" noise texture — procedurally generated
 * via an SVG feTurbulence filter rather than a downloaded image. Purely
 * additive: layer it on top of any existing colored sphere via
 * `mix-blend-mode: overlay` and it adds craterey/rocky depth without
 * touching the color/tint underneath. Zero license concerns, zero file
 * weight (it's a few hundred bytes of inline SVG, not a bitmap), and it
 * tiles perfectly since fractal noise has no seams.
 */
const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='7' stitchTiles='stitch' result='noise'/>
    <feColorMatrix in='noise' type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.85 0 0 0 0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;

export const PLANET_NOISE_URL = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`;

/** Spread this into a style object for a full-bleed texture layer (e.g. an absolutely-positioned span sibling to the color layer). */
export const planetTextureLayerStyle = (opacity = 0.5) => ({
  backgroundImage: PLANET_NOISE_URL,
  backgroundSize: '120px 120px',
  mixBlendMode: 'overlay',
  opacity,
});
