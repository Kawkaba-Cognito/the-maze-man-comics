import React from 'react';
import { useApp } from '../../../../../../context/AppContext';
import C3dEngineShell from '../../../../shared/C3dEngineShell';
import CaseFileEngine from './CaseFileEngine';

/**
 * Detective · 3D — same case-file investigation as 2D Survival,
 * framed in a cosmos WebGL stage.
 */
export default function Detective3DProto({ isAr, playSfx, onBack }) {
  const { awardPoints, awardFreeRun } = useApp();

  return (
    <C3dEngineShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      title={isAr ? 'المحقّق · ثلاثي الأبعاد' : 'Detective · 3D'}
      tag={isAr ? 'نموذج' : 'prototype'}
    >
      <CaseFileEngine
        mode="free"
        diff="med"
        level={1}
        seed={null}
        cosmos
        isAr={isAr}
        playSfx={playSfx}
        awardPoints={awardPoints}
        awardFreeRun={awardFreeRun}
        onResult={() => {}}
        onExit={() => {
          awardFreeRun?.('detective', 0);
          onBack?.();
        }}
      />
    </C3dEngineShell>
  );
}
