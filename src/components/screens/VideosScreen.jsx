import React from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';
import VideoPlayer from '../video/VideoPlayer';

export default function VideosScreen() {
  const { currentLang } = useApp();
  const t = LANG[currentLang];
  const isAr = currentLang === 'ar';

  return (
    <div className="content-card" style={{background:'#ff9aa2'}}>
      <h2 style={{fontFamily: isAr ? "'Cairo',sans-serif" : "'Bangers',cursive", fontSize:'2.5em', marginBottom:'15px'}}>
        {t.vidTitle}
      </h2>
      <VideoPlayer />
      <p style={{fontSize:'1.1em', fontWeight:'bold', marginTop:'14px'}}>{t.vidSub}</p>
    </div>
  );
}
