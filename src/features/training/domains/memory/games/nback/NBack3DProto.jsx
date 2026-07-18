import React from 'react';
import C3dEngineShell from '../../../../shared/C3dEngineShell';

export default function NBack3DProto({ isAr, playSfx, onBack, children }) {
  return (
    <C3dEngineShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      title={isAr ? 'إن-باك · ثلاثي الأبعاد' : 'N-Back · 3D'}
      tag={isAr ? 'نفس اللعبة · مسرح كوني ثلاثي الأبعاد' : 'Same game · cosmos 3D stage'}
    >
      {children}
    </C3dEngineShell>
  );
}
