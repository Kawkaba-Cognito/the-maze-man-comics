import '../../styles/trainingHubReal3D.css';
import '../../styles/trainingHubAssetPlanets.css';

/*
 * The hub uses authored category drawings instead of live 3D spheres. Keep
 * this lazy bridge so the hub-specific CSS retains its existing loading
 * boundary without restoring the heavier WebGL planet field.
 */
export default function TrainingPlanetField3D() {
  return null;
}
