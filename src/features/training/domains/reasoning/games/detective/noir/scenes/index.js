import ObservatoryScene, { ANCHORS as OBSERVATORY_ANCHORS } from './ObservatoryScene';
import TheatreScene, { ANCHORS as THEATRE_ANCHORS } from './TheatreScene';
import MuseumScene, { ANCHORS as MUSEUM_ANCHORS } from './MuseumScene';

/*
 * Crime-scene rooms, keyed by case id.
 *
 * The art owns the hotspot positions (its ANCHORS export) so a prop and its
 * hotspot can never drift apart — move the desk in the SVG, move the anchor,
 * done. `npm run validate:noir` fails if a case has a hotspot with no anchor.
 */
export const SCENES = {
  observatory: { Art: ObservatoryScene, anchors: OBSERVATORY_ANCHORS },
  encore: { Art: TheatreScene, anchors: THEATRE_ANCHORS },
  'long-rain': { Art: MuseumScene, anchors: MUSEUM_ANCHORS },
};

export const sceneFor = (caseId) => SCENES[caseId] || null;
