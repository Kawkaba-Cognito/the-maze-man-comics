import React from 'react';
import { TrainingModeList } from '../../../../shared/TrainingScreens';
import HubScienceLink from '../../../../shared/HubScienceLink';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

export default function NBackModes({ t, isAr, onFree, onLevels, onChallenge, onProto3d, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge },
    {
      k: 'proto3d',
      lb: isAr ? 'ثلاثي الأبعاد' : '3D',
      hint: isAr ? 'نفس اللعبة · مسرح كوني ثلاثي الأبعاد' : 'Same game · cosmos 3D stage',
      on: onProto3d,
      icoImg: planetIconUrl('memory'),
      mod: 'ct-fq-attn-mode--proto3d',
    },
  ];
  return (
    <>
      <p className="ct-nb-dual-note">{t.dualNote}</p>
      <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />
      <HubScienceLink gameId="nback" isAr={isAr} playSfx={playSfx} />
    </>
  );
}
