import React from 'react';
import C3dEngineShell from '../../../../shared/C3dEngineShell';

export default function Wisconsin3DProto({ isAr, playSfx, onBack, children }) {
  return (
    <C3dEngineShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      title={isAr ? 'فرز البطاقات · ثلاثي الأبعاد' : 'Card Sort · 3D'}
      tag={isAr ? 'نفس اللعبة · بيئة كونية ثلاثية الأبعاد' : 'Same game · cosmos 3D stage'}
    >
      {children}
    </C3dEngineShell>
  );
}
