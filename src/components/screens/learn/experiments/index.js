import SwitchCostExperiment from './SwitchCostExperiment';
import AttentionalBlinkExperiment from './AttentionalBlinkExperiment';
import DividedAttentionExperiment from './DividedAttentionExperiment';

export const EXPERIMENTS = {
  'switch-cost': SwitchCostExperiment,
  blink: AttentionalBlinkExperiment,
  'divided-attention': DividedAttentionExperiment,
};
