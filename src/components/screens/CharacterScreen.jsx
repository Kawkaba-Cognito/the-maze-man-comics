import React from 'react';
import { useApp } from '../../context/AppContext';
import { assetUrl } from '../../lib/assetUrl';

/**
 * Character — choose / manage your character.
 * Empty placeholder for now (skins you unlock in the Shop will appear here).
 */
export default function CharacterScreen() {
  const { points, currentLang } = useApp();
  const isAr = currentLang === 'ar';

  return (
    <div className="rewards-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? '🦊 الشخصية' : '🦊 Character'}</div>
      <img className="rewards-char" src={assetUrl('Assets/guide-fox-3d.png')} alt="fox" />
      <p className="rewards-empty">
        {isAr
          ? 'هذه شخصيتك الحالية. قريباً — افتح شخصيات وأزياء جديدة بنقاطك من المتجر.'
          : 'This is your current character. Coming soon — unlock new characters & skins with your points in the Shop.'}
      </p>
    </div>
  );
}
