import React from 'react';
import { useApp } from '../../context/AppContext';

export default function TipJarModal() {
  const { tipOpen, closeTip, playSfx } = useApp();

  function tipAmount(amt) { playSfx('collect'); closeTip(); alert(`☕ Thank you for the $${amt} tip! Redirecting to payment... (Demo mode)`); }
  function tipPlatform(p) { playSfx('collect'); closeTip(); alert(`🎉 Opening ${p}... (Demo — link your ${p} URL here)`); }

  return (
    <div id="tip-modal" className={tipOpen ? 'show' : ''}>
      <div className="tip-card">
        <button className="tip-card-close" onClick={closeTip}>✕</button>
        <div style={{fontSize:'2.5em',marginBottom:'8px'}}>☕</div>
        <div style={{fontFamily:"'Bangers',cursive",fontSize:'1.8em',letterSpacing:'2px',marginBottom:'6px'}}>SUPPORT MAZE MAN</div>
        <p style={{fontSize:'0.9em',color:'#555',marginBottom:'4px'}}>Buy a coffee to keep The Maze Man running!</p>
        <div className="tip-amounts">
          <div className="tip-amount" onClick={() => tipAmount(2)}>☕ $2</div>
          <div className="tip-amount" onClick={() => tipAmount(5)}>🧃 $5</div>
          <div className="tip-amount" onClick={() => tipAmount(10)}>🍕 $10</div>
        </div>
        <div className="tip-platforms">
          <button className="tip-platform-btn" style={{background:'#ffe66d'}} onClick={() => tipPlatform('Ko-fi')}>☕ Ko-fi</button>
          <button className="tip-platform-btn" style={{background:'#ff6b6b',color:'#fff'}} onClick={() => tipPlatform('Patreon')}>🎨 Patreon</button>
          <button className="tip-platform-btn" style={{background:'#4ecdc4'}} onClick={() => tipPlatform('Buy Me a Coffee')}>☕ Buy Me a Coffee</button>
        </div>
      </div>
    </div>
  );
}
