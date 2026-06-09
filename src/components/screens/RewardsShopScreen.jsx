import React from 'react';
import { useApp } from '../../context/AppContext';
import { getCharacter } from '../../features/character/registry';
import { ITEMS } from '../../features/character/items';

/**
 * Points Shop — spend earned points on fun cosmetic gear. Buying adds the item
 * to your wardrobe; equip it here or on the Character screen. Equipped gear
 * shows on the home pedestal AND in the 3D maze. A live preview at the top
 * wears whatever you have on.
 */
export default function RewardsShopScreen() {
  const { points, currentLang, character, owned, equipped, buyItem, equipItem, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const Hero = getCharacter(character).Component;

  function handleBuy(it) {
    if (owned[it.id]) { equipItem(it.slot, it.id); playSfx('click'); return; }
    if (buyItem(it.id, it.cost)) { playSfx('collect'); equipItem(it.slot, it.id); }
    else playSfx('error');
  }

  return (
    <div className="rewards-screen shop-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? '🛍️ المتجر' : '🛍️ Shop'}</div>

      <div className="char-preview shop-preview">
        <Hero size={150} equipped={equipped} glow />
      </div>
      <p className="shop-hint">
        {isAr ? 'اشترِ أغراضاً ممتعة — تظهر هنا وفي المتاهة!' : 'Buy fun gear — it shows here and inside the maze!'}
      </p>

      <div className="shop-grid">
        {ITEMS.map((it) => {
          const isOwned = !!owned[it.id];
          const isOn = equipped[it.slot] === it.id;
          const afford = points >= it.cost;
          return (
            <button
              key={it.id}
              className={`shop-card${isOn ? ' is-on' : ''}${!isOwned && !afford ? ' is-locked' : ''}`}
              onClick={() => handleBuy(it)}
              disabled={!isOwned && !afford}
            >
              <span className="shop-card-ic" aria-hidden="true">{it.icon}</span>
              <span className="shop-card-name">{isAr ? it.ar : it.en}</span>
              <span className="shop-card-cost">
                {isOwned ? (isOn ? (isAr ? '✓ مُلبَس' : '✓ Worn') : (isAr ? 'إلباس' : 'Wear')) : `⚡ ${it.cost}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
