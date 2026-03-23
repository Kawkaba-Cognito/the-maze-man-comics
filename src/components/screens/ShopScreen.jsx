import React from 'react';
import { useApp } from '../../context/AppContext';

const MERCH = [
  { emoji: '👕', bg: '#ffe66d', name: 'MAZE MAN TEE',      price: '$24.99' },
  { emoji: '🧥', bg: '#b8c0ff', name: 'LABYRINTH HOODIE',  price: '$49.99' },
  { emoji: '🪧', bg: '#ff9aa2', name: 'STICKER PACK',      price: '$8.99'  },
  { emoji: '🖼️', bg: '#a8e6cf', name: 'POSTER PRINT',      price: '$19.99' },
];
const DIGITAL = [
  { emoji: '📚', bg: '#4ecdc4', name: 'COMIC BUNDLE PDF', price: '$9.99',  btn: 'BUY NOW' },
  { emoji: '🖼️', bg: '#1a0b2e', name: 'WALLPAPER PACK',  price: '$4.99',  btn: 'BUY NOW' },
  { emoji: '🧠', bg: '#ffe66d', name: 'PSYCH WORKBOOK',   price: '$14.99', btn: 'COMING SOON', soon: true },
  { emoji: '🎨', bg: '#ff6b6b', name: 'ART PRINTS NFT',   price: 'TBD',   btn: 'COMING SOON', soon: true },
];

export default function ShopScreen() {
  const { playSfx } = useApp();

  function shopClick(name) {
    playSfx('collect');
    alert(`🛒 ${name} added to cart! (Demo — connect your Shopify/Gumroad store here)`);
  }

  return (
    <div>
      <div className="shop-banner">
        <div className="shop-banner-title">🛒 MAZE STORE</div>
        <div className="shop-banner-sub">Support the creator · Wear the mind</div>
      </div>
      <div className="ad-banner">📢 <span>SPONSORED</span> — Promote your brand here · ads@mazeman.com</div>

      <div className="shop-section-title">👕 MERCH</div>
      <div className="shop-grid">
        {MERCH.map(item => (
          <div key={item.name} className="shop-item">
            <div className="shop-item-img" style={{background: item.bg}}>{item.emoji}</div>
            <div className="shop-item-info">
              <div className="shop-item-name">{item.name}</div>
              <div className="shop-item-price">{item.price}</div>
              <button className="shop-btn" onClick={() => shopClick(item.name)}>ADD TO CART</button>
            </div>
          </div>
        ))}
      </div>

      <div className="shop-section-title">📥 DIGITAL</div>
      <div className="shop-grid">
        {DIGITAL.map(item => (
          <div key={item.name} className="shop-item">
            <div className="shop-item-img" style={{background: item.bg}}>{item.emoji}</div>
            <div className="shop-item-info">
              <div className="shop-item-name">{item.name}</div>
              <div className="shop-item-price">{item.price}</div>
              <button className={`shop-btn ${item.soon ? 'coming-soon' : ''}`} onClick={item.soon ? undefined : () => shopClick(item.name)}>
                {item.btn}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div style={{height:'10px'}}></div>
    </div>
  );
}
