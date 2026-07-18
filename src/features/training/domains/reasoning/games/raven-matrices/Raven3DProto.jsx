import React from 'react';
import C3dEngineShell from '../../../../shared/C3dEngineShell';

export default function Raven3DProto({ isAr, playSfx, onBack, children }) {
  return (
    <C3dEngineShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      title={isAr ? 'مصفوفات رافين · ثلاثي الأبعاد' : 'Raven Matrices · 3D'}
      tag={isAr ? 'نفس اللعبة · مسرح كوني ثلاثي الأبعاد' : 'Same game · cosmos 3D stage'}
    >
      {children}
    </C3dEngineShell>
  );
}
