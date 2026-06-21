import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  markOnboardingComplete,
  markOnboardingSkipped,
  shouldRunOnboarding,
} from '../../shared/tutorials/tutorialStorage';
import {
  coachStepMatches,
  getPuzzleTrial,
} from './puzzleTrials';
import { pickCheer } from './puzzleTrials/trialCheers';

/**
 * Puzzle onboarding: carousel → guided practice → ready → hub (size pick).
 * phase: null | 'carousel' | 'coached' | 'ready'
 */
export function usePuzzleOnboarding(puzzleId, isAr, { onOnboardingComplete } = {}) {
  const trial = useMemo(() => getPuzzleTrial(puzzleId), [puzzleId]);
  const [phase, setPhase] = useState(() => (shouldRunOnboarding(puzzleId) ? 'carousel' : null));
  const [rulesOnly, setRulesOnly] = useState(false);
  const [trialState, setTrialState] = useState(null);
  const [coachIndex, setCoachIndex] = useState(0);
  const [selectedCell, setSelectedCell] = useState(null);
  const [reinforcement, setReinforcement] = useState(null);

  const coachSteps = useMemo(() => {
    if (!trial?.coachSteps) return [];
    return trial.coachSteps(isAr);
  }, [trial, isAr]);

  const returnToHub = useCallback(() => {
    setPhase(null);
    setTrialState(null);
    setCoachIndex(0);
    setRulesOnly(false);
    setReinforcement(null);
    onOnboardingComplete?.();
  }, [onOnboardingComplete]);

  const begin = useCallback(() => {
    setRulesOnly(false);
    setReinforcement(null);
    setPhase('carousel');
  }, []);

  const openRules = useCallback(() => {
    setRulesOnly(true);
    setPhase('carousel');
  }, []);

  const skipAll = useCallback(() => {
    if (!rulesOnly) markOnboardingSkipped(puzzleId);
    returnToHub();
  }, [returnToHub, puzzleId, rulesOnly]);

  const startCoachedTrial = useCallback(() => {
    if (!trial || trial.skipTrials) {
      setPhase('ready');
      return false;
    }
    const next = trial.makeCoachedState?.();
    if (!next) {
      setPhase('ready');
      return false;
    }
    setTrialState(next);
    setCoachIndex(0);
    setSelectedCell(null);
    setReinforcement(null);
    setPhase('coached');
    return true;
  }, [trial]);

  const skipTrials = useCallback(() => {
    markOnboardingComplete(puzzleId);
    returnToHub();
  }, [returnToHub, puzzleId]);

  const finishReady = useCallback(() => {
    markOnboardingComplete(puzzleId);
    returnToHub();
  }, [returnToHub, puzzleId]);

  const finishCarousel = useCallback(
    ({ dontShowAgain }) => {
      if (rulesOnly) {
        if (dontShowAgain) markOnboardingSkipped(puzzleId);
        setPhase(null);
        setRulesOnly(false);
        return;
      }
      if (dontShowAgain) {
        markOnboardingSkipped(puzzleId);
        returnToHub();
        return;
      }
      if (!trial || trial.skipTrials) {
        setPhase('ready');
        return;
      }
      startCoachedTrial();
    },
    [puzzleId, returnToHub, rulesOnly, startCoachedTrial, trial],
  );

  const closeRules = useCallback(
    ({ dontShowAgain }) => {
      if (dontShowAgain) markOnboardingSkipped(puzzleId);
      setPhase(null);
      setRulesOnly(false);
    },
    [puzzleId],
  );

  const advanceCoach = useCallback(() => {
    setCoachIndex((i) => {
      const next = Math.min(i + 1, coachSteps.length - 1);
      if (next > i) setReinforcement(pickCheer(isAr, next));
      return next;
    });
  }, [coachSteps.length, isAr]);

  const notifyCoachAction = useCallback(
    (action) => {
      if (phase !== 'coached' || !trial) return;
      const step = coachSteps[coachIndex];
      if (!step) return;
      if (step.gate === 'next') return;
      if (coachStepMatches(step, action, trialState, trial)) {
        if (coachIndex >= coachSteps.length - 1) {
          if (trial.isSolved(trialState)) {
            setReinforcement(isAr ? 'ممتاز! أنت جاهز للعب الحقيقي.' : 'Excellent! You\'re ready for the real game.');
            setPhase('ready');
          }
        } else {
          setCoachIndex((i) => {
            const next = i + 1;
            setReinforcement(pickCheer(isAr, next));
            return next;
          });
        }
      }
    },
    [coachIndex, coachSteps, isAr, phase, trial, trialState],
  );

  const applyTrialAction = useCallback(
    (action) => {
      if (!trial || !trialState) return;
      const next = trial.applyAction?.(trialState, action) ?? trialState;
      if (next !== trialState) setTrialState(next);
      if (action?.type === 'select') setSelectedCell([action.r, action.c]);
      notifyCoachAction(action);
    },
    [notifyCoachAction, trial, trialState],
  );

  // Coached phase: solve the single practice puzzle → ready screen.
  useEffect(() => {
    if (phase !== 'coached' || !trial || !trialState) return;
    const step = coachSteps[coachIndex];
    if (step?.gate === 'solved' && trial.isSolved(trialState)) {
      setReinforcement(isAr ? 'ممتاز! أنت جاهز للعب الحقيقي.' : 'Excellent! You\'re ready for the real game.');
      setPhase('ready');
    }
  }, [phase, trial, trialState, coachSteps, coachIndex, isAr]);

  const currentCoachStep = coachSteps[coachIndex];

  return {
    phase,
    rulesOnly,
    shouldRun: shouldRunOnboarding(puzzleId),
    onboardingOpen: phase != null,
    trialState,
    trialActive: phase === 'coached',
    freeHints: phase === 'coached',
    reinforcement,
    selectedCell,
    setSelectedCell,
    coachIndex,
    coachSteps,
    currentCoachStep,
    begin,
    openRules,
    skipAll,
    finishCarousel,
    closeRules,
    skipTrials,
    startTrials: startCoachedTrial,
    advanceCoach,
    applyTrialAction,
    setTrialState,
    finishReady,
  };
}
