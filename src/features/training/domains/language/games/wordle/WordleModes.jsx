import React from 'react';
import { TrainingModeList } from '../../../../shared/TrainingScreens';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

export default function WordleModes({ t, isAr, onFree, onLevels, onChallenge, onProto3d, playSfx }) {
  const items = [
    { k: 'free', ic: '♾️', lb: t.freeMode, hint: t.hubNodeFreeHint, on: onFree },
    { k: 'levels', ic: '🎯', lb: t.levelMode, hint: t.hubNodeLevelsHint, on: onLevels },
    { k: 'chal', ic: '⚔️', lb: t.challengeMode, hint: t.hubNodeChallengeHint, on: onChallenge },
    {
      k: 'proto3d',
      lb: isAr ? 'ثلاثي الأبعاد' : '3D',
      hint: isAr ? 'نفس اللعبة · مسرح كوني ثلاثي الأبعاد' : 'Same game · cosmos 3D stage',
      on: onProto3d,
      icoImg: planetIconUrl('language'),
      mod: 'ct-fq-attn-mode--proto3d',
    },
  ];
  return <TrainingModeList items={items} isAr={isAr} playSfx={playSfx} />;
}
