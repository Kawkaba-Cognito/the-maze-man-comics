import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';
import { PSYCH_FACTS, FACT_CAT_COLORS } from '../../data/psychFacts';
import ComicReader from '../comics/ComicReader';
import { INLINE_COMICS } from '../../data/comicsData';

const initialFactIdx = Math.floor(Math.random() * PSYCH_FACTS.length);

export default function HomeScreen() {
  const { enterMaze, playSfx, updateXP, currentLang } = useApp();
  const [factIdx, setFactIdx] = useState(initialFactIdx);
  const [openComic, setOpenComic] = useState(null);
  const [comicPage, setComicPage] = useState(0);
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';
  const fact = PSYCH_FACTS[factIdx];

  function nextFact() {
    playSfx('click');
    setFactIdx(i => (i + 1) % PSYCH_FACTS.length);
    updateXP(2);
  }

  function handleOpenComic(type) {
    playSfx('click');
    setOpenComic(INLINE_COMICS[type]);
    setComicPage(0);
  }

  const comicTitles = isAr
    ? ['علم النفس<br>الاجتماعي', 'عن<br>الصفحة', 'علم النفس<br>المعرفي']
    : ['SOCIAL<br>PSYCHOLOGY', 'ABOUT<br>THE PAGE', 'PROBLEM<br>SOLVING'];

  return (
    <div className="hero-section">
      <div className="character-container">
        <div className="hero-portal"></div>
        <div className="css-maze-man">
          <div className="cmm-foot left"></div><div className="cmm-foot right"></div>
          <div className="cmm-cloak-bg"></div>
          <div className="cmm-arm left"></div><div className="cmm-arm right"></div>
          <div className="cmm-hood">
            <div className="cmm-face">
              <div className="cmm-eye left"></div><div className="cmm-eye right"></div>
              <div className="cmm-mask"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="title-card">
        <h1 className="main-title" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", fontSize: isAr ? '2.4em' : '3.2em' }}>
          {isAr ? 'رجل المتاهة' : 'THE MAZE MAN'}
        </h1>
        <div className="colorful-comics" style={{ fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", fontSize: isAr ? '2em' : '2.8em' }}>
          {isAr
            ? <><span style={{color:'#ff6b6b'}}>ك</span><span style={{color:'#4ecdc4'}}>و</span><span style={{color:'#ffe66d'}}>م</span><span style={{color:'#a8e6cf'}}>ي</span><span style={{color:'#ff9aa2'}}>ك</span><span style={{color:'#b8c0ff'}}>س</span></>
            : <><span style={{color:'#ff6b6b'}}>C</span><span style={{color:'#4ecdc4'}}>O</span><span style={{color:'#ffe66d'}}>M</span><span style={{color:'#a8e6cf'}}>I</span><span style={{color:'#ff9aa2'}}>C</span><span style={{color:'#b8c0ff'}}>S</span></>
          }
        </div>
      </div>

      <div className="btn-wrapper">
        <div className="btn-ripple"></div>
        <button className="comic-btn" onClick={enterMaze}>
          {t.enterMaze} <span style={{fontSize:'0.8em'}}>➡️</span>
        </button>
      </div>

      <div className="comics-showcase">
        <div className="comic-square social" onClick={() => handleOpenComic('social')}>
          <div className="issue-badge">VOL 1</div>
          <div className="comic-cover-art"><span className="comic-icon">👥</span></div>
          <span className="comic-cover-title" dangerouslySetInnerHTML={{__html: comicTitles[0]}} />
          <div className="comic-barcode"></div>
        </div>
        <div className="comic-square center" onClick={() => handleOpenComic('about')}>
          <div className="issue-badge">INFO</div>
          <div className="comic-cover-art"><span className="comic-icon">ℹ️</span></div>
          <span className="comic-cover-title" dangerouslySetInnerHTML={{__html: comicTitles[1]}} />
          <div className="comic-barcode"></div>
        </div>
        <div
          className="comic-square cognitive"
          onClick={() => {
            window.location.href = `${import.meta.env.BASE_URL}episode-1-problem-solving.html`;
          }}
        >
          <div className="issue-badge">EP.01</div>
          <div
            className="comic-cover-art"
            style={{
              backgroundImage: `url('${import.meta.env.BASE_URL}Assets/cover_art.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <span className="comic-cover-title" dangerouslySetInnerHTML={{__html: comicTitles[2]}} />
          <div className="comic-barcode"></div>
        </div>
      </div>

      <div className="fact-card" style={{marginTop:'30px'}}>
        <div className="fact-badge">🧠 PSYCH FACT</div>
        <p className="fact-text">{fact.text}</p>
        <div className="fact-meta">
          <span className="fact-cat" style={{background: FACT_CAT_COLORS[fact.cat] || '#4ecdc4'}}>{fact.cat}</span>
          <button className="fact-next" onClick={nextFact}>Next ➡</button>
        </div>
      </div>

      {openComic && (
        <ComicReader
          comic={openComic}
          page={comicPage}
          onPageChange={setComicPage}
          onClose={() => setOpenComic(null)}
        />
      )}
    </div>
  );
}
