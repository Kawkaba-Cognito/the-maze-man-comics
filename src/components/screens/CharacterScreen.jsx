import React from 'react';
import { useApp } from '../../context/AppContext';
import { CHARACTERS, getCharacter } from '../../features/character/registry';
import { ITEMS, SHOP_SLOTS, ItemArt } from '../../features/character/items';

const SLOT_LABEL = {
  hat: { en: 'Hat', ar: 'قبعة' },
  face: { en: 'Face', ar: 'وجه' },
  neck: { en: 'Neck', ar: 'رقبة' },
  back: { en: 'Back', ar: 'ظهر' },
};

/**
 * Character — pick a character (male / female / fox) and equip the items you
 * own. Selection + equipped gear are saved and appear on the home pedestal AND
 * inside the 3D world. Buy more in the Shop.
 */
export default function CharacterScreen() {
  const { points, currentLang, character, setCharacter, owned, equipped, equipItem, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const active = getCharacter(character);
  const Hero = active.Component;
  const ownedItems = ITEMS.filter((it) => owned[it.id]);

  function pick(id) { playSfx('click'); setCharacter(id); }
  function equip(slot, id) { playSfx('click'); equipItem(slot, id); }
  function clearSlot(slot) { if (equipped[slot]) { playSfx('click'); equipItem(slot, equipped[slot]); } }

  return (
    <div className="rewards-screen char-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? 'الشخصية' : 'Character'}</div>

      {/* Hero stage */}
      <div className="char-stage">
        <div className="char-preview">
          <Hero size={190} equipped={equipped} float glow />
        </div>
      </div>

      {/* Choose character — avatar cards */}
      <section className="char-section">
        <h3 className="char-section-title">{isAr ? 'اختر شخصيتك' : 'Choose your character'}</h3>
        <div className="char-pick-grid">
          {CHARACTERS.map((c) => {
            const Mini = getCharacter(c.id).Component;
            const on = character === c.id;
            return (
              <button key={c.id} className={`char-card${on ? ' is-on' : ''}`} onClick={() => pick(c.id)}>
                <span className="char-card-art"><Mini size={72} /></span>
                <span className="char-card-name">{isAr ? c.ar : c.en}</span>
                {on && <span className="char-card-badge">✓</span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Wardrobe — owned items grouped by slot */}
      <section className="char-section">
        <h3 className="char-section-title">{isAr ? 'الملابس والإكسسوارات' : 'Wardrobe'}</h3>
        {ownedItems.length === 0 ? (
          <p className="rewards-empty">
            {isAr
              ? 'لا تملك أغراضاً بعد. اذهب إلى المتجر واشترِ أشياء ممتعة لتلبسها!'
              : 'You don’t own any gear yet. Head to the Shop and grab some fun items to wear!'}
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
                      <span className="char-item-art">∅</span>
                      <span className="char-item-name">{isAr ? 'بدون' : 'None'}</span>
                    </button>
                    {inSlot.map((it) => (
                      <button
                        key={it.id}
                        className={`char-item${equipped[slot] === it.id ? ' is-on' : ''}`}
                        onClick={() => equip(slot, it.id)}
                      >
                        <span className="char-item-art"><ItemArt it={it} size={36} /></span>
                        <span className="char-item-name">{isAr ? it.ar : it.en}</span>
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
        🛍️ {isAr ? 'إلى المتجر' : 'Go to Shop'}
      </button>
    </div>
  );
}
