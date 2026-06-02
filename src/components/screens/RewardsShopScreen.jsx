import React from 'react';
import { useApp } from '../../context/AppContext';

/**
 * Points Shop — spend earned points on characters & skins.
 * Empty placeholder for now (the catalogue + pricing come next).
 */
export default function RewardsShopScreen() {
  const { points, currentLang } = useApp();
  const isAr = currentLang === 'ar';

  return (
    <div className="rewards-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? '🛍️ المتجر' : '🛍️ Shop'}</div>
      <p className="rewards-empty">
        {isAr
          ? 'قريباً — أنفق نقاطك على شخصيات وأزياء جديدة. اربح النقاط بحلّ الألغاز والتدريب.'
          : 'Coming soon — spend your points on new characters & skins. Earn points by solving puzzles and training.'}
      </p>
    </div>
  );
}
