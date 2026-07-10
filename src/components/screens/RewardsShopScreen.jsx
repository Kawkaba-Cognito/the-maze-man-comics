import React from 'react';
import { useApp } from '../../context/AppContext';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import AtmosphericBackground from '../shared/AtmosphericBackground';
import { useThemedChrome } from '../../hooks/useThemedChrome';
import { IconBack } from '../../features/training/shared/TrainingIcons';

/**
 * Points Shop — cosmetic storefront. The planet mascot is the only avatar.
 */
export default function RewardsShopScreen() {
  const { points, currentLang, equipped, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const chrome = useThemedChrome(isAr);

  return (
    <div
      className={`rewards-screen shop-screen app-stage app-stage--${chrome.dark ? 'dark' : 'light'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <AtmosphericBackground strength="panel" photo={false} />
      <div className="shop-stage-content">
        <div className="app-chrome-bar" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', maxWidth: 420, marginBottom: 8,
        }}>
          <button
            type="button"
            style={chrome.chromeBtn}
            onClick={() => { playSfx('click'); switchTab('other'); }}
            aria-label={isAr ? 'رجوع' : 'Back'}
          >
            <IconBack size={18} c={chrome.text} />
          </button>
          <div style={{ ...chrome.title, fontSize: isAr ? 22 : 20 }}>{isAr ? 'المتجر' : 'Shop'}</div>
          <div style={{ width: 34 }} />
        </div>

        <div className="rewards-balance">
          ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
        </div>

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
    </div>
  );
}
