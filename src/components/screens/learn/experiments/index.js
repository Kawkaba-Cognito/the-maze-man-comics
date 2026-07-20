import SwitchCostExperiment from './SwitchCostExperiment';
import AttentionalBlinkExperiment from './AttentionalBlinkExperiment';
import DividedAttentionExperiment from './DividedAttentionExperiment';
import FlankerExperiment from './FlankerExperiment';
import VigilanceExperiment from './VigilanceExperiment';

export const EXPERIMENTS = {
  'switch-cost': SwitchCostExperiment,
  flanker: FlankerExperiment,
  blink: AttentionalBlinkExperiment,
  vigilance: VigilanceExperiment,
  'divided-attention': DividedAttentionExperiment,
};
