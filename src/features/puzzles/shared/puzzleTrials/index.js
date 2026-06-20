import { getNumberPuzzleTrial } from './numberTrials';
import { getBoardPuzzleTrial } from './boardTrials';

export function getPuzzleTrial(puzzleId) {
  return getNumberPuzzleTrial(puzzleId) || getBoardPuzzleTrial(puzzleId);
}

export function puzzleTrialSize(puzzleId) {
  const t = getPuzzleTrial(puzzleId);
  return t?.trialSize ?? null;
}

/** Advance coach step when player action matches gated step. */
export function coachStepMatches(step, action, state, trial) {
  if (!step) return false;
  if (step.gate === 'next') return false;
  if (step.gate === 'solved') return trial.isSolved(state);
  if (step.gate === 'select') {
    return action?.type === 'select' && action.r === step.r && action.c === step.c;
  }
  if (step.gate === 'setCell') {
    return (
      action?.type === 'setCell'
      && action.r === step.r
      && action.c === step.c
      && action.value === step.value
    );
  }
  if (step.gate === 'slide') {
    return action?.type === 'slide' && action.index === step.index;
  }
  if (step.gate === 'toggle') {
    return action?.type === 'toggle' && action.r === step.r && action.c === step.c;
  }
  if (step.gate === 'cycle') {
    return action?.type === 'cycle' && action.r === step.r && action.c === step.c;
  }
  return false;
}

export function soloStep(isAr) {
  return {
    text: isAr
      ? 'حلّ اللغز بنفسك. استخدم التلميح المجاني إذا احتجت — ثم أكمل اللغز.'
      : 'Solve the puzzle yourself. Use the free hint button if you need help — then finish the grid.',
    gate: 'solved',
  };
}
