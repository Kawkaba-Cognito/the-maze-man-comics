import React, { useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { LANG } from '../../data/langStrings';

export default function VideoPlayer() {
  const { currentLang, playSfx, stopSpeech } = useApp();
  const t = LANG[currentLang];

  const canvasRef     = useRef(null);
  const fsCanvasRef   = useRef(null);
  const overlayRef    = useRef(null);
  const playBtnRef    = useRef(null);
  const fsPlayBtnRef  = useRef(null);
  const barRef        = useRef(null);
  const thumbRef      = useRef(null);
  const timeRef       = useRef(null);
  const fsBarRef      = useRef(null);
  const fsThumbRef    = useRef(null);
  const fsTimeRef     = useRef(null);
  const muteBtnRef    = useRef(null);
  const fsContRef     = useRef(null);

  const vidPlaying   = useRef(false);
  const vidMuted     = useRef(false);
  const vidVolume    = useRef(1);
  const vidStart     = useRef(0);
  const vidDuration  = useRef(0);
  const vidElapsed   = useRef(0);
  const vidPauseAt   = useRef(0);
  const vidAnimFrame = useRef(null);
  const vidIsFS      = useRef(false);
  const vidSpeechUtt = useRef(null);
  const langRef      = useRef(currentLang);

  useEffect(() => { langRef.current = currentLang; }, [currentLang]);

  const getCanvas = useCallback(() =>
    vidIsFS.current ? fsCanvasRef.current : canvasRef.current, []);

  const vidDraw = useCallback((time) => {
    const canvas = getCanvas();
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    ctx.fillStyle = '#0d0520'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.025)';
    for (let r = 0; r < H; r += 10) for (let c = 0; c < W; c += 10) { ctx.beginPath(); ctx.arc(c, r, 1, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath(); ctx.ellipse(cx, H - 12, 65, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#252530'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(cx - 75, H - 15); ctx.lineTo(cx + 75, H - 15); ctx.lineTo(cx + 55, cy + 15); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx - 55, cy + 15); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#424252'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx - 55, cy + 15); ctx.lineTo(cx - 75, H - 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 55, cy + 15); ctx.lineTo(cx + 75, H - 15); ctx.stroke();
    ctx.fillStyle = '#1a1a28'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(cx - 78, cy + 50, 13, 10, .3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + 78, cy + 50, 13, 10, -.3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#111'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(cx - 32, H - 14, 22, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + 32, H - 14, 22, 9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1a1a28'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx, cy - 28, 65, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#222230'; ctx.beginPath(); ctx.arc(cx, cy - 20, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#04040a'; ctx.beginPath(); ctx.arc(cx, cy - 16, 42, 0, Math.PI * 2); ctx.fill();
    const glow = 8 + Math.sin(time * 2) * 5;
    ctx.fillStyle = '#ffe66d'; ctx.shadowColor = '#ffe66d'; ctx.shadowBlur = glow;
    ctx.save(); ctx.translate(cx - 18, cy - 26); ctx.rotate(Math.PI / 8); ctx.beginPath(); ctx.ellipse(0, 0, 13, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(cx + 18, cy - 26); ctx.rotate(-Math.PI / 8); ctx.beginPath(); ctx.ellipse(0, 0, 13, 5.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#1e1e2a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy - 4, 32, Math.PI, 0, true); ctx.fill(); ctx.stroke();
    const mOpen = Math.abs(Math.sin(time * 4.5)) * 14;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 13, mOpen + 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#363646'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy - 28, 65, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    const isAr = langRef.current === 'ar';
    ctx.fillStyle = 'rgba(255,230,109,.9)';
    ctx.font = `bold ${Math.round(W * .032)}px Bangers,cursive`; ctx.textAlign = 'center';
    ctx.fillText(isAr ? 'الحلقة ١ — التحية' : 'EP.01 — THE GREETING', cx, 20);
    ctx.font = `${Math.round(W * .025)}px Comic Neue,cursive`; ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.fillText(isAr ? '...رجل المتاهة يتحدث إليك' : 'The Maze Man speaks to you...', cx, 36);
  }, [getCanvas]);

  const updateProgress = useCallback((elapsed, total) => {
    const pct = total > 0 ? Math.min(100, elapsed / total * 100) : 0;
    const fmt = n => { const s = Math.floor(n / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    const timeStr = fmt(elapsed) + ' / ' + fmt(total);
    if (barRef.current)   barRef.current.style.width   = pct + '%';
    if (thumbRef.current) thumbRef.current.style.left  = pct + '%';
    if (timeRef.current)  timeRef.current.textContent  = timeStr;
    if (fsBarRef.current)   fsBarRef.current.style.width   = pct + '%';
    if (fsThumbRef.current) fsThumbRef.current.style.left  = pct + '%';
    if (fsTimeRef.current)  fsTimeRef.current.textContent  = timeStr;
  }, []);

  const vidAnimLoop = useCallback(() => {
    if (!vidPlaying.current) return;
    const now = Date.now();
    vidElapsed.current = vidPauseAt.current + (now - vidStart.current);
    const t = vidElapsed.current / 1000;
    vidDraw(t);
    updateProgress(vidElapsed.current, vidDuration.current);
    if (vidElapsed.current < vidDuration.current) {
      vidAnimFrame.current = requestAnimationFrame(vidAnimLoop);
    } else { vidEnd(); }
  }, [vidDraw, updateProgress]);

  const vidSpeakGreeting = useCallback(() => {
    if (!('speechSynthesis' in window) || vidMuted.current) return;
    window.speechSynthesis.cancel();
    const isAr = langRef.current === 'ar';
    const text = LANG[langRef.current].speech;
    vidSpeechUtt.current = new SpeechSynthesisUtterance(text);
    vidSpeechUtt.current.lang   = isAr ? 'ar-SA' : 'en-US';
    vidSpeechUtt.current.pitch  = 0.4;
    vidSpeechUtt.current.rate   = 0.85;
    vidSpeechUtt.current.volume = vidMuted.current ? 0 : vidVolume.current;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      const v = isAr
        ? voices.find(v => v.lang && v.lang.startsWith('ar'))
        : voices.find(v => v.lang && v.lang.startsWith('en') && /daniel|alex|google uk|google us|fred|thomas/i.test(v.name))
          || voices.find(v => v.lang && v.lang.startsWith('en'));
      if (v) vidSpeechUtt.current.voice = v;
    }
    window.speechSynthesis.speak(vidSpeechUtt.current);
  }, []);

  function vidEnd() {
    vidPlaying.current = false;
    cancelAnimationFrame(vidAnimFrame.current);
    stopSpeech();
    if (overlayRef.current) overlayRef.current.style.display = 'flex';
    if (playBtnRef.current) playBtnRef.current.textContent = '▶';
    if (fsPlayBtnRef.current) fsPlayBtnRef.current.textContent = '▶';
    updateProgress(0, 0);
  }

  function vidPlay() {
    playSfx('click');
    if (overlayRef.current) overlayRef.current.style.display = 'none';
    const charCount = LANG[langRef.current].speech.length;
    vidDuration.current = Math.max(9000, charCount * 68);
    vidElapsed.current  = 0;
    vidPauseAt.current  = 0;
    vidPlaying.current  = true;
    vidStart.current    = Date.now();
    if (playBtnRef.current) playBtnRef.current.textContent = '⏸';
    if (fsPlayBtnRef.current) fsPlayBtnRef.current.textContent = '⏸';
    vidSpeakGreeting();
    vidAnimFrame.current = requestAnimationFrame(vidAnimLoop);
  }

  function vidTogglePlay() {
    if (!vidPlaying.current) {
      if (vidElapsed.current >= vidDuration.current && vidDuration.current > 0) vidElapsed.current = 0;
      vidPauseAt.current = vidElapsed.current;
      vidPlaying.current = true;
      vidStart.current   = Date.now();
      vidSpeakGreeting();
      vidAnimFrame.current = requestAnimationFrame(vidAnimLoop);
      if (playBtnRef.current) playBtnRef.current.textContent = '⏸';
      if (fsPlayBtnRef.current) fsPlayBtnRef.current.textContent = '⏸';
    } else {
      vidPlaying.current = false;
      vidPauseAt.current = vidElapsed.current;
      cancelAnimationFrame(vidAnimFrame.current);
      stopSpeech();
      if (playBtnRef.current) playBtnRef.current.textContent = '▶';
      if (fsPlayBtnRef.current) fsPlayBtnRef.current.textContent = '▶';
    }
  }

  function vidToggleMute() {
    vidMuted.current = !vidMuted.current;
    if (muteBtnRef.current) muteBtnRef.current.textContent = vidMuted.current ? '🔇' : '🔊';
    if (vidSpeechUtt.current) vidSpeechUtt.current.volume = vidMuted.current ? 0 : vidVolume.current;
    if (vidMuted.current) stopSpeech();
    else if (vidPlaying.current) vidSpeakGreeting();
  }

  function vidSetVolume(v) {
    vidVolume.current = parseFloat(v);
    if (vidSpeechUtt.current) vidSpeechUtt.current.volume = vidMuted.current ? 0 : vidVolume.current;
  }

  function vidSeek(e) {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    vidElapsed.current  = pct * vidDuration.current;
    vidPauseAt.current  = vidElapsed.current;
    if (vidPlaying.current) { vidStart.current = Date.now(); stopSpeech(); vidSpeakGreeting(); }
    vidDraw(vidElapsed.current / 1000);
    updateProgress(vidElapsed.current, vidDuration.current);
  }

  function vidFullscreen() {
    if (fsContRef.current) fsContRef.current.classList.add('on');
    vidIsFS.current = true;
    if (fsCanvasRef.current) {
      fsCanvasRef.current.width  = window.innerWidth;
      fsCanvasRef.current.height = window.innerHeight - 60;
    }
    if (vidPlaying.current) vidDraw(vidElapsed.current / 1000);
  }

  function vidExitFullscreen() {
    if (fsContRef.current) fsContRef.current.classList.remove('on');
    vidIsFS.current = false;
  }

  useEffect(() => {
    const c = canvasRef.current;
    if (c) { const ctx = c.getContext('2d'); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, c.width, c.height); }
    return () => {
      cancelAnimationFrame(vidAnimFrame.current);
      stopSpeech();
    };
  }, [stopSpeech]);

  return (
    <>
      <div className="video-player-wrap">
        <canvas ref={canvasRef} id="vid-canvas" width="420" height="200" onClick={vidTogglePlay}></canvas>
        <div className="vid-overlay" ref={overlayRef}>
          <div className="vid-overlay-title">{t.epTitle}</div>
          <button className="vid-big-play" onClick={vidPlay}>▶</button>
        </div>
        <div className="vid-controls">
          <div className="vid-prog-row">
            <span className="vid-time" ref={timeRef}>0:00 / 0:00</span>
            <div className="vid-bar-outer" onClick={vidSeek}>
              <div className="vid-bar-inner" ref={barRef}></div>
              <div className="vid-thumb" ref={thumbRef}></div>
            </div>
          </div>
          <div className="vid-btn-row">
            <div className="vid-left-btns">
              <button className="vid-play-btn" ref={playBtnRef} onClick={vidTogglePlay}>▶</button>
              <button className="vid-ic-btn" ref={muteBtnRef} onClick={vidToggleMute}>🔊</button>
              <input type="range" className="vid-vol-slider" min="0" max="1" step="0.05" defaultValue="1" onInput={e => vidSetVolume(e.target.value)} />
            </div>
            <div className="vid-right-btns">
              <button className="vid-ic-btn" onClick={() => { stopSpeech(); vidElapsed.current = 0; vidPauseAt.current = 0; vidPlay(); }}>↺</button>
              <button className="vid-ic-btn" onClick={vidFullscreen}>⛶</button>
            </div>
          </div>
        </div>
      </div>

      <div id="vid-fullscreen" ref={fsContRef}>
        <canvas ref={fsCanvasRef} id="vid-fs-canvas" width="420" height="200" onClick={vidTogglePlay}></canvas>
        <div className="vid-fs-bar">
          <button className="vid-fs-close" onClick={vidExitFullscreen}>✕</button>
          <button className="vid-play-btn" ref={fsPlayBtnRef} onClick={vidTogglePlay}>▶</button>
          <div className="vid-bar-outer" style={{flex:1}} onClick={vidSeek}>
            <div className="vid-bar-inner" ref={fsBarRef}></div>
            <div className="vid-thumb" ref={fsThumbRef}></div>
          </div>
          <span className="vid-time" ref={fsTimeRef} style={{color:'#ccc',fontFamily:"'DM Mono',monospace",fontSize:'.68em'}}>0:00 / 0:00</span>
          <button className="vid-ic-btn" onClick={vidToggleMute} style={{color:'#ccc'}}>🔊</button>
        </div>
      </div>
    </>
  );
}
