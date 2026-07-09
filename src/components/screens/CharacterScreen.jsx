import React from 'react';
import { useApp } from '../../context/AppContext';
import CosmosCharacter from '../../features/character/CosmosCharacter';
import { ITEMS, SHOP_SLOTS, ItemArt } from '../../features/character/items';

const SLOT_LABEL = {
  hat: { en: 'Hat', ar: 'قبعة' },
  face: { en: 'Face', ar: 'وجه' },
  neck: { en: 'Neck', ar: 'رقبة' },
  back: { en: 'Back', ar: 'ظهر' },
};

/** Planet wardrobe — equip owned gear on the cosmos mascot. */
export default function CharacterScreen() {
  const { points, currentLang, owned, equipped, equipItem, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';
  const ownedItems = ITEMS.filter((it) => owned[it.id]);

  function equip(slot, id) { playSfx('click'); equipItem(slot, id); }
  function clearSlot(slot) { if (equipped[slot]) { playSfx('click'); equipItem(slot, equipped[slot]); } }

  return (
    <div className="rewards-screen char-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? 'كوكب' : 'Kawkab'}</div>

      <div className="char-stage">
        <div className="char-preview">
          {/* New art when bare; SVG only while trying on gear (anchor points). */}
          <CosmosCharacter
            size={190}
            equipped={equipped}
            float
            glow
            art={Object.values(equipped || {}).some(Boolean) ? 'legacy' : 'kawkab'}
          />
        </div>
      </div>

      <section className="char-section">
        <h3 className="char-section-title">{isAr ? 'الملابس والإكسسوارات' : 'Wardrobe'}</h3>
        {ownedItems.length === 0 ? (
          <p className="rewards-empty">
            {isAr
              ? 'لا تملك أغراضاً بعد. اذهب إلى المتجر واشترِ أشياء ممتعة!'
              : 'You don’t own any gear yet. Head to the Shop and grab some fun items!'}
          </p>
        ) : (
          <div className="char-equip">
            {SHOP_SLOTS.map((slot) => {
              const inSlot = ownedItems.filter((it) => it.slot === slot);
              if (inSlot.length === 0) return null;
              return (
                <div className="char-slot" key={slot}>
                  <div className="char-slot-label">{isAr ? SLOT_LABEL[slot].ar : SLOT_LABEL[slot].en}</div>
                  <div className="char-item-grid">
                    <button
                      className={`char-item char-item--none${!equipped[slot] ? ' is-on' : ''}`}
                      onClick={() => clearSlot(slot)}
                    >
                      ∅
                    </button>
                    {inSlot.map((it) => (
                      <button
                        key={it.id}
                        className={`char-item${equipped[slot] === it.id ? ' is-on' : ''}`}
                        onClick={() => equip(slot, it.id)}
                      >
                        <ItemArt it={it} size={36} />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <button className="char-shop-link" onClick={() => { playSfx('click'); switchTab('pointshop'); }}>
        {isAr ? '← المتجر' : '← Shop'}
      </button>
    </div>
  );
}
