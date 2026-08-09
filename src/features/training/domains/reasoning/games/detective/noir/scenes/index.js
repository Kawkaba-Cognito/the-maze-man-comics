/*
 * Premium searchable rooms, keyed by case id.
 *
 * The raster art is deliberately separate from the hotspots: it can be
 * upgraded without changing case logic, while this manifest remains the one
 * source of truth for tap targets. `npm run validate:noir` verifies that every
 * authored hotspot has an anchor and every anchor belongs to the case.
 */
const ROOT = 'Assets/training/detective-premium-2026';

export const DETECTIVE_ASSETS = {
  dossier: `${ROOT}/case-dossier.webp`,
  interrogation: `${ROOT}/interrogation-room.webp`,
};

export const SCENES = {
  observatory: {
    image: `${ROOT}/observatory.webp`,
    anchors: {
      booth: { x: 8, y: 25 },
      desk: { x: 17, y: 78 },
      charts: { x: 32, y: 34 },
      clamp: { x: 30, y: 53 },
      mount: { x: 50, y: 52 },
      camera: { x: 75, y: 42 },
      clock: { x: 39, y: 22 },
      archive: { x: 91, y: 35 },
      floor: { x: 64, y: 74 },
      kettle: { x: 8, y: 77 },
    },
  },
  encore: {
    image: `${ROOT}/theatre.webp`,
    anchors: {
      poster: { x: 82, y: 14 },
      roommic: { x: 70, y: 18 },
      ladder: { x: 37, y: 39 },
      wings: { x: 17, y: 45 },
      dressing: { x: 91, y: 47 },
      bucket: { x: 55, y: 83 },
      office: { x: 66, y: 72 },
      machine: { x: 45, y: 52 },
      hooks: { x: 9, y: 35 },
    },
  },
  'long-rain': {
    image: `${ROOT}/museum.webp`,
    anchors: {
      whale: { x: 16, y: 16 },
      clockcase: { x: 84, y: 16 },
      stairs: { x: 19, y: 34 },
      vitrine: { x: 48, y: 43 },
      plinth: { x: 65, y: 55 },
      lab: { x: 85, y: 41 },
      files: { x: 25, y: 65 },
      refusal: { x: 78, y: 76 },
      bay: { x: 7, y: 57 },
    },
  },
};

export const sceneFor = (caseId) => SCENES[caseId] || null;
