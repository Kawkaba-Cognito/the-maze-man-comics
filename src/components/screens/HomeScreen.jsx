import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';
import { PSYCH_FACTS, FACT_CAT_COLORS } from '../../data/psychFacts';
import ComicReader from '../comics/ComicReader';
import { INLINE_COMICS } from '../../data/comicsData';

const AVATARS = ['🧠', '🕵️', '🦊', '🌀', '🔮', '👁️'];
const initialFactIdx = Math.floor(Math.random() * PSYCH_FACTS.length);

export default function HomeScreen() {
  const { enterMaze, playSfx, updateXP, currentLang, toggleLang, profileData, setProfileData, saveProfile, globalXP, comicsRead } = useApp();
  const [factIdx, setFactIdx] = useState(initialFactIdx);
  const [openComic, setOpenComic] = useState(null);
  const [comicPage, setComicPage] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
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

  function setAvatar(emoji) {
    playSfx('click');
    const updated = { ...profileData, avatar: emoji };
    setProfileData(updated);
    saveProfile(updated, globalXP, comicsRead);
  }

  function openSettings() {
    playSfx('click');
    setShowSettings(true);
  }

  function closeSettings() {
    playSfx('click');
    setShowSettings(false);
  }

  function handleQuit() {
    playSfx('click');
    window.close();
  }

  const comicTitles = isAr
    ? ['علم النفس<br>الاجتماعي', 'عن<br>الصفحة', 'علم النفس<br>المعرفي']
    : ['SOCIAL<br>PSYCHOLOGY', 'ABOUT<br>THE PAGE', 'PROBLEM<br>SOLVING'];

  return (
    <div className="hero-section">

      {/* Settings Overlay */}
      {showSettings && (
        <div className="settings-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeSettings(); }}>
          <div className="settings-panel">
            <button className="settings-close" onClick={closeSettings}>✕</button>
            <div className="settings-panel-title">⚙️ {t.settingsTitle}</div>

            <div className="settings-section-heading">👤 {t.accountSection}</div>
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
              <div className="profile-avatar-ring" style={{ margin: '0 auto 8px', cursor: 'default', width: '72px', height: '72px', fontSize: '2.4em' }}>
                {profileData.avatar}
              </div>
              <div style={{ fontFamily: "'Bangers',cursive", fontSize: '1.1em', color: '#333', letterSpacing: '1px' }}>
                {profileData.username}
              </div>
            </div>
            <div className="settings-label">{t.chooseAvatar}</div>
            <div className="avatar-picker" style={{ justifyContent: 'center' }}>
              {AVATARS.map(e => (
                <span
                  key={e}
                  className={`avatar-opt ${profileData.avatar === e ? 'selected' : ''}`}
                  onClick={() => setAvatar(e)}
                >{e}</span>
              ))}
            </div>

            <div className="settings-section-heading" style={{ marginTop: '22px' }}>🌐 {t.languageSection}</div>
            <button className="settings-lang-btn" onClick={toggleLang}>
              {t.switchLang}
            </button>
          </div>
        </div>
      )}

      {/* Character */}
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

      {/* Title */}
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

      {/* Game Menu */}
      <div className="game-menu">
        <div className="btn-wrapper" style={{ marginBottom: 0 }}>
          <div className="btn-ripple"></div>
          <button className="comic-btn" onClick={enterMaze}>
            {t.start} <span style={{ fontSize: '0.8em' }}>➡️</span>
          </button>
        </div>
        <button className="menu-btn" onClick={openSettings}>
          ⚙️ {t.settings}
        </button>
        <button className="menu-btn quit-btn" onClick={handleQuit}>
          🚪 {t.quitGame}
        </button>
      </div>

      {/* Comics Showcase */}
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
        <div className="comic-square cognitive" onClick={() => { window.location.href = '/episode-1-problem-solving.html'; }}>
          <div className="issue-badge">EP.01</div>
          <div className="comic-cover-art" style={{backgroundImage:"url('/Assets/cover_art.jpg')",backgroundSize:'cover',backgroundPosition:'center'}}></div>
          <span className="comic-cover-title" dangerouslySetInnerHTML={{__html: comicTitles[2]}} />
          <div className="comic-barcode"></div>
        </div>
      </div>

      {/* Psych Fact */}
      <div className="fact-card" style={{ marginTop: '30px' }}>
        <div className="fact-badge">🧠 PSYCH FACT</div>
        <p className="fact-text">{fact.text}</p>
        <div className="fact-meta">
          <span className="fact-cat" style={{ background: FACT_CAT_COLORS[fact.cat] || '#4ecdc4' }}>{fact.cat}</span>
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
