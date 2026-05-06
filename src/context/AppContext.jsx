import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

const AppContext = createContext(null);

const XP_PER_LEVEL = 200;

const DEFAULT_PROFILE = {
  avatar: '🧠', username: 'MAZE WALKER',
  streak: 1, lastVisit: null,
  videosWatched: 0, fragments: 0, puzzlesSolved: 0,
  badges: { explorer: false, maze: false, master: false }
};

export function AppProvider({ children }) {
  const [globalXP, setGlobalXP] = useState(0);
  const [currentLang, setCurrentLang] = useState('en');
  const [activeTab, setActiveTab] = useState('home');
  const [mazeVisible, setMazeVisible] = useState(false);
  const [mazeEntryPending, setMazeEntryPending] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const audioCtxRef = useRef(null);

  // Load profile on mount
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    try {
      const saved = localStorage.getItem('mazeman_profile');
      if (saved) {
        const parsed = Object.assign({}, DEFAULT_PROFILE, JSON.parse(saved));
        const today = new Date().toDateString();
        if (parsed.lastVisit !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          parsed.streak = parsed.lastVisit === yesterday ? (parsed.streak || 0) + 1 : 1;
          parsed.lastVisit = today;
        }
        setProfileData(parsed);
        localStorage.setItem('mazeman_profile', JSON.stringify(parsed));
      } else {
        const today = new Date().toDateString();
        const initial = { ...DEFAULT_PROFILE, lastVisit: today };
        localStorage.setItem('mazeman_profile', JSON.stringify(initial));
        setProfileData(initial);
      }
    } catch (e) {}
  }, []);

  // RTL toggle
  useEffect(() => {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [currentLang]);

  const initAudio = useCallback(() => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC && !audioCtxRef.current) audioCtxRef.current = new AC();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    } catch (e) {}
  }, []);

  const playTone = useCallback((freq, type, dur, vol = 0.12) => {
    if (!audioCtxRef.current) return;
    try {
      const osc = audioCtxRef.current.createOscillator();
      const g = audioCtxRef.current.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      g.gain.setValueAtTime(vol, audioCtxRef.current.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + dur);
      osc.connect(g); g.connect(audioCtxRef.current.destination);
      osc.start(); osc.stop(audioCtxRef.current.currentTime + dur);
    } catch (e) {}
  }, []);

  const playSfx = useCallback((name) => {
    initAudio();
    if (name === 'click')   playTone(600, 'sine', 0.1);
    if (name === 'collect') { playTone(800, 'sine', 0.1); setTimeout(() => playTone(1200, 'sine', 0.15), 100); }
    if (name === 'error')   playTone(200, 'sawtooth', 0.3);
    if (name === 'win')     { playTone(400, 'square', 0.1); setTimeout(() => playTone(600, 'square', 0.1), 100); setTimeout(() => playTone(800, 'square', 0.3), 200); }
  }, [initAudio, playTone]);

  const stopSpeech = useCallback(() => {
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
  }, []);

  const updateXP = useCallback((amount) => {
    setGlobalXP(prev => prev + amount);
  }, []);

  const toggleLang = useCallback(() => {
    playSfx('click');
    setCurrentLang(prev => prev === 'en' ? 'ar' : 'en');
  }, [playSfx]);

  const switchTab = useCallback((tabId) => {
    playSfx('click');
    stopSpeech();
    setActiveTab(tabId);
  }, [playSfx, stopSpeech]);

  const requestMazeEntry = useCallback(() => {
    playSfx('click');
    stopSpeech();

    // If Babylon already loaded, enter immediately
    if (typeof window.BABYLON !== 'undefined') {
      setMazeEntryPending(true);
      return;
    }

    // Dynamically load Babylon.js only when needed
    setMazeEntryPending(true); // show transition overlay immediately
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/babylonjs@9.3.0/babylon.js';
    script.integrity = 'sha384-njRDUHF4B9J1R9UM37SngP7eFHJLRAgxTwnC1OfT4w10QPKaL4VTUUDZamQYcpQn';
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      // Script loaded — enterMaze will fire after the 4s transition
    };
    script.onerror = () => {
      setMazeEntryPending(false);
      alert('Requires internet connection to load 3D Engine.');
    };
    document.head.appendChild(script);
  }, [playSfx, stopSpeech]);

  const enterMaze = useCallback(() => {
    setMazeEntryPending(false);
    setMazeVisible(true);
  }, []);

  const exitMaze = useCallback(() => {
    playSfx('click');
    setMazeVisible(false);
  }, [playSfx]);

  const saveProfile = useCallback((data, xp) => {
    try {
      const toSave = {
        ...data,
        fragments: xp > 0 ? Math.floor(xp / 10) : 0,
      };
      localStorage.setItem('mazeman_profile', JSON.stringify(toSave));
    } catch (e) {}
  }, []);

  return (
    <AppContext.Provider value={{
      globalXP, currentLang, activeTab, mazeVisible, mazeEntryPending,
      paywallOpen, tipOpen, profileData,
      updateXP, toggleLang, switchTab, requestMazeEntry, enterMaze, exitMaze,
      playSfx, stopSpeech, saveProfile,
      setProfileData,
      openPaywall: () => { playSfx('click'); setPaywallOpen(true); },
      closePaywall: () => setPaywallOpen(false),
      openTip: () => { playSfx('click'); setTipOpen(true); },
      closeTip: () => setTipOpen(false),
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
