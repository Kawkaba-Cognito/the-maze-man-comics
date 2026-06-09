import React from 'react';
import { useApp } from '../../context/AppContext';
import { CHARACTERS, getCharacter } from '../../features/character/registry';
import { ITEMS, SHOP_SLOTS } from '../../features/character/items';

const SLOT_LABEL = {
  hat: { en: 'Hat', ar: 'قبعة' },
  face: { en: 'Face', ar: 'وجه' },
  neck: { en: 'Neck', ar: 'رقبة' },
  back: { en: 'Back', ar: 'ظهر' },
};

/**
 * Character — pick a character (male / female / fox) and equip the items you
 * own. Selection + equipped gear are saved and appear on the home pedestal AND
 * inside the 3D maze. Buy more in the Shop.
 */
export default function CharacterScreen() {
  const { points, currentLang, character, setCharacter, owned, equipped, equipItem, switchTab, playSfx } = useApp();
  const isAr = currentLang === 'ar';

  const active = getCharacter(character);
  const Hero = active.Component;
  const ownedItems = ITEMS.filter((it) => owned[it.id]);

  function pick(id) { playSfx('click'); setCharacter(id); }

  return (
    <div className="rewards-screen char-screen" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="rewards-balance">
        ⚡ <span>{points}</span> {isAr ? 'نقطة' : 'points'}
      </div>
      <div className="rewards-title">{isAr ? '🦊 الشخصية' : '🦊 Character'}</div>

      <div className="char-preview">
        <Hero size={190} equipped={equipped} float glow />
      </div>

      {/* Choose character */}
      <div className="char-row">
        <span className="char-row-label">{isAr ? 'الشخصية' : 'Who'}</span>
        <div className="char-chips">
          {CHARACTERS.map((c) => (
            <button key={c.id} className={`char-chip${character === c.id ? ' is-on' : ''}`} onClick={() => pick(c.id)}>
              {isAr ? c.ar : c.en}
            </button>
          ))}
        </div>
      </div>

      {/* Equip owned items, grouped by slot */}
      {ownedItems.length === 0 ? (
        <p className="rewards-empty">
          {isAr
            ? 'لا تملك أغراضاً بعد. اذهب إلى المتجر واشترِ أشياء ممتعة لتلبسها!'
            : 'You don’t own any items yet. Head to the Shop and grab some fun gear to wear!'}
        </p>
      ) : (
        SHOP_SLOTS.map((slot) => {
          const inSlot = ownedItems.filter((it) => it.slot === slot);
          if (inSlot.length === 0) return null;
          return (
            <div className="char-row" key={slot}>
              <span className="char-row-label">{isAr ? SLOT_LABEL[slot].ar : SLOT_LABEL[slot].en}</span>
              <div className="char-chips">
                {inSlot.map((it) => (
                  <button
                    key={it.id}
                    className={`char-chip${equipped[slot] === it.id ? ' is-on' : ''}`}
                    onClick={() => { playSfx('click'); equipItem(slot, it.id); }}
                  >
                    <span aria-hidden="true">{it.icon}</span> {isAr ? it.ar : it.en}
                  </button>
                ))}
              </div>
            </div>
          );
        })
      )}

      <button className="char-shop-link" onClick={() => { playSfx('click'); switchTab('pointshop'); }}>
        🛍️ {isAr ? 'إلى المتجر' : 'Go to Shop'}
      </button>
    </div>
  );
}
