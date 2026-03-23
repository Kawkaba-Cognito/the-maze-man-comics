import React from 'react';
import { useApp } from '../../context/AppContext';

export default function PaywallModal() {
  const { paywallOpen, closePaywall, playSfx } = useApp();

  function subscribe() {
    playSfx('win');
    closePaywall();
    alert('🎉 Redirecting to secure checkout! (Demo mode — payment not implemented yet)');
  }

  return (
    <div id="paywall-modal" className={paywallOpen ? 'show' : ''}>
      <div className="paywall-card">
        <button className="paywall-close" onClick={closePaywall}>✕</button>
        <div className="paywall-icon">⭐</div>
        <div className="paywall-title">GO PREMIUM</div>
        <p style={{fontSize:'0.9em',color:'#555'}}>Unlock the full Maze Man universe</p>
        <ul className="paywall-perks">
          <li>📚 All 8+ Comic Issues (incl. future)</li>
          <li>🎬 Full Video Library + Interviews</li>
          <li>🎮 Exclusive Maze Levels</li>
          <li>🏅 Premium Badges & Avatar Frames</li>
          <li>📥 Monthly Digital Downloads</li>
        </ul>
        <button className="paywall-btn" onClick={subscribe}>⭐ $4.99 / MONTH</button>
        <button className="paywall-btn" style={{background:'#4ecdc4',marginTop:'8px'}} onClick={subscribe}>🔥 $39.99 / YEAR (SAVE 33%)</button>
        <p className="paywall-sub">Cancel anytime. Secure payment via Stripe.</p>
      </div>
    </div>
  );
}
