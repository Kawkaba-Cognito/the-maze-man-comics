import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { THREE } from './c3dBoot';
import { SH } from './focusQuestData';

/*
 * Shared 3D shape geometry for the cosmos protos.
 * Geometry is built from the EXACT SVG definitions the 2D boards render
 * (SH in focusQuestData) — parsed with SVGLoader and extruded — so every
 * shape key has the same silhouette in 3D as in 2D (circle vs almostCircle,
 * moon vs semicircle, lightning, hearts…). Cached per shape name.
 */

const cache = new Map();
const loader = new SVGLoader();

export function shapeGeometry(name) {
  if (cache.has(name)) return cache.get(name);
  const markup = (SH[name] || SH.circle).replace(/currentColor/g, '#ffffff');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${markup}</svg>`;
  let geo;
  try {
    const parsed = loader.parse(svg);
    const shapes = [];
    for (const path of parsed.paths) shapes.push(...SVGLoader.createShapes(path));
    geo = new THREE.ExtrudeGeometry(shapes, {
      depth: 26,
      bevelEnabled: true,
      bevelThickness: 3,
      bevelSize: 2.6,
      bevelSegments: 2,
      curveSegments: 10,
    });
    geo.center();
    // SVG space is y-down and 100 units wide → flip Y, scale to ~1 world unit.
    geo.scale(0.0112, -0.0112, 0.0112);
  } catch {
    geo = new THREE.SphereGeometry(0.45, 22, 16);
  }
  cache.set(name, geo);
  return geo;
}
