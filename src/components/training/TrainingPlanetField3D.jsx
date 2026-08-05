import '../../styles/trainingHubReal3D.css';
import '../../styles/trainingHubAssetPlanets.css';

/*
 * The domain artwork is already rendered as premium 3D planets. At the hub's
 * 62-76px display size, replacing that art with another live sphere removes
 * detail and makes the dark material swatches dominate. Keep this lazy bridge
 * so the hub's isolated styles retain their existing loading boundary, but let
 * the authored planet renders remain the visible surface.
 */
export default function TrainingPlanetField3D() {
  return null;
}
