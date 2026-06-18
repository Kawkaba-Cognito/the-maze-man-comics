import React from 'react';
import { useApp } from '../../context/AppContext';
import { getCharacter } from '../../features/character/registry';

/**
 * Points Shop — currently empty. The cosmetic catalog (ITEMS) is intentionally
 * kept in features/character/items so equipped gear still renders on the home
 * pedestal and in the 3D world; only the buyable storefront is cleared here.
 */
export default function RewardsShopScreen() {
  const { points, currentLang, character, equipped } = useApp();
  const isAr = currentLang === 'ar';
  const Hero = getCharacter(character).Component;

  return (
    <div className="rewards-screen shop-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? 'المتجر' : 'Shop'}</div>

      <div className="char-preview shop-preview">
        <Hero size={150} equipped={equipped} glow float />
      </div>

      <div className="shop-empty">
        <div className="shop-empty-icon">🛍️</div>
        <p className="shop-empty-title">{isAr ? 'المتجر فارغ' : 'The shop is empty'}</p>
        <p className="shop-empty-sub">{isAr ? 'أغراض جديدة قريباً!' : 'New gear coming soon!'}</p>
      </div>
    </div>
  );
}
