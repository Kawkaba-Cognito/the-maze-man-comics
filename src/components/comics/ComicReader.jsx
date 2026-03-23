import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ComicReader({ comic, page, onPageChange, onClose }) {
  const { playSfx } = useApp();
  if (!comic) return null;

  function turnPage(dir) {
    playSfx('click');
    onPageChange(p => Math.max(0, Math.min(comic.pages.length - 1, p + dir)));
  }

  return (
    <div id="comic-reader" style={{display:'flex'}}>
      <div className="reader-panel">
        <button className="reader-close" onClick={() => { playSfx('click'); onClose(); }}>X</button>
        <h2 style={{fontFamily:'Bangers', fontSize:'2em', marginBottom:'20px'}}>{comic.title}</h2>
        <div id="comic-page-text">{comic.pages[page]}</div>
        <div className="reader-controls">
          <button className="reader-btn" onClick={() => turnPage(-1)}>⬅️ PREV</button>
          <button className="reader-btn" onClick={() => turnPage(1)}>NEXT ➡️</button>
        </div>
      </div>
    </div>
  );
}
