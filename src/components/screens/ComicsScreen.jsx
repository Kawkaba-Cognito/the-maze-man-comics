import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { COMICS_DATA } from '../../data/comicsData';

export default function ComicsScreen() {
  const { playSfx, incrementComicsRead } = useApp();
  const [activeFilter, setActiveFilter] = useState('all');

  function handleFilter(cat) {
    playSfx('click');
    setActiveFilter(cat);
  }

  function readComic(c) {
    playSfx('click');
    if (c.type === 'game' && c.url) {
      window.location.href = c.url;
      return;
    }
    incrementComicsRead();
  }

  const filtered = activeFilter === 'all' ? COMICS_DATA : COMICS_DATA.filter(c => c.cat === activeFilter);

  return (
    <div>
      <div className="comics-filter">
        {['all', 'social', 'cognitive'].map(f => (
          <button key={f} className={`filter-btn ${activeFilter === f ? 'active' : ''}`} onClick={() => handleFilter(f)}>
            {f === 'all' ? 'ALL' : f === 'social' ? 'SOCIAL' : 'COGNITIVE'}
          </button>
        ))}
      </div>
      <div className="comics-grid">
        {filtered.map(c => {
          const coverStyle = c.cover
            ? { backgroundImage: `url('${c.cover}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: c.bg };
          return (
            <div key={c.id} className="comic-card featured-card" onClick={() => readComic(c)}>
              <div className="comic-card-cover" style={coverStyle}>
                <span className="issue-num">{c.vol}</span>
                <span className="comic-lock" style={{background:'#4455cc',borderColor:'#2233aa',color:'#fff'}}>🎮 GAME</span>
              </div>
              <div className="comic-card-info">
                <div className="comic-card-title">{c.title}</div>
                <span className="comic-card-cat" style={{background: c.bg}}>{c.catLabel}</span>
                <button className="comic-card-btn" style={{background:'#4455cc',color:'#fff',borderColor:'#2233aa'}}>▶ PLAY NOW</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
