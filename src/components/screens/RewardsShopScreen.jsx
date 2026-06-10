import React from 'react';
import { useApp } from '../../context/AppContext';
import { getCharacter } from '../../features/character/registry';
import { ITEMS, SHOP_SLOTS } from '../../features/character/items';

/**
 * Points Shop — spend earned points on fun cosmetic gear. Buying adds the item
 * to your wardrobe; equip it here or on the Character screen. Equipped gear
 * shows on the home pedestal AND in the 3D world. A live preview at the top
 * wears whatever you have on; cards show the item's real vector art.
 */
const SLOT_BOX = { hat: '-26 -42 52 52', face: '-24 -16 48 42', neck: '-22 -8 44 46', back: '-26 -2 52 92' };
const SLOT_TITLES = {
  hat: ['🎩 Hats', '🎩 قبعات'],
  face: ['🧐 Face', '🧐 الوجه'],
  neck: ['🧣 Neck', '🧣 الرقبة'],
  back: ['🎒 Back', '🎒 الظهر'],
};

function ItemArt({ it }) {
  return (
    <span className="shop-card-art" aria-hidden="true">
      <svg viewBox={it.iconBox || SLOT_BOX[it.slot]} width="46" height="46" style={{ overflow: 'visible' }}>
        {it.render2d({ accent: '#f5c542', gold: '#e8b53a' })}
      </svg>
    </span>
  );
}

export default function RewardsShopScreen() {
  const { points, currentLang, character, owned, equipped, buyItem, equipItem, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const Hero = getCharacter(character).Component;

  function handleBuy(it) {
    if (owned[it.id]) {
      equipItem(it.slot, it.id); // equipItem toggles: tap to wear / take off
      playSfx('click');
      return;
    }
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
        <Hero size={150} equipped={equipped} glow float />
      </div>
      <p className="shop-hint">
        {isAr ? 'اشترِ أغراضاً ممتعة — تظهر هنا وفي العالم ثلاثي الأبعاد!' : 'Buy fun gear — it shows here and inside the 3D world!'}
      </p>

      {SHOP_SLOTS.map((slot) => (
        <section key={slot} className="shop-section">
          <h3 className="shop-section-title">{SLOT_TITLES[slot][isAr ? 1 : 0]}</h3>
          <div className="shop-grid">
            {ITEMS.filter((it) => it.slot === slot).map((it) => {
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
                  <ItemArt it={it} />
                  <span className="shop-card-name">{isAr ? it.ar : it.en}</span>
                  <span className="shop-card-cost">
                    {isOwned
                      ? (isOn ? (isAr ? '✓ مُلبَس' : '✓ Worn') : (isAr ? 'إلباس' : 'Wear'))
                      : `⚡ ${it.cost}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
