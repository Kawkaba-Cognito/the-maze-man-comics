import React from 'react';
import C3dEngineShell from '../../../../shared/C3dEngineShell';

export default function StoryGrid3DProto({ isAr, playSfx, onBack, children }) {
  return (
    <C3dEngineShell
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      title={isAr ? 'وقت القصة · ثلاثي الأبعاد' : 'Story Time · 3D'}
      tag={isAr ? 'نفس القصة · بيئة كونية ثلاثية الأبعاد' : 'Same story · cosmos 3D stage'}
    >
      {children}
    </C3dEngineShell>
  );
}
