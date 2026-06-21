import React from 'react';
import { TrainingModeList } from '../../../../shared/TrainingScreens';

export default function NBackModes({ t, isAr, onFree, onLevels, onChallenge, onScience, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge },
  ];
  return (
    <>
      <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />
      {onScience && (
        <button type="button" className="ct-fq-sci-link" onClick={() => { playSfx('click'); onScience(); }}>{t.scienceLink}</button>
      )}
    </>
  );
}
