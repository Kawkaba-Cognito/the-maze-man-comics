import React from 'react';
import { useApp } from '../../context/AppContext';
import CosmosCharacter from '../../features/character/CosmosCharacter';

/**
 * Points Shop — cosmetic storefront. The planet mascot is the only avatar.
 */
export default function RewardsShopScreen() {
  const { points, currentLang, equipped } = useApp();
  const isAr = currentLang === 'ar';

  return (
    <div className="rewards-screen shop-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? 'المتجر' : 'Shop'}</div>

      <div className="char-preview shop-preview">
        <CosmosCharacter
          size={150}
          equipped={equipped}
          glow
          float
          art={Object.values(equipped || {}).some(Boolean) ? 'legacy' : 'kawkab'}
        />
      </div>

      <div className="shop-empty">
        <div className="shop-empty-icon">🛍️</div>
        <p className="shop-empty-title">{isAr ? 'المتجر فارغ' : 'The shop is empty'}</p>
        <p className="shop-empty-sub">{isAr ? 'أغراض جديدة قريباً!' : 'New gear coming soon!'}</p>
      </div>
    </div>
  );
}
