import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { trainingWinPoints } from '../lib/points';
import { updateRating } from '../features/training/rating';
import { recruit as armyRecruit, recordAttempt as armyRecordAttempt, markGone as armyMarkGone, MAX_ATTEMPTS } from '../features/army/armyState';

const AppContext = createContext(null);

const SFX_KEY = 'mazeman_sfx_enabled';

function readSfxEnabled() {
  try {
    return localStorage.getItem(SFX_KEY) !== '0';
  } catch {
    return true;
  }
}

const DEFAULT_PROFILE = {
  avatar: '🧠', username: 'MAZE WALKER',
  streak: 1, lastVisit: null,
  videosWatched: 0, fragments: 0, puzzlesSolved: 0,
  badges: { explorer: false, maze: false, master: false }
};

const POINTS_KEY = 'mazeman_points';
const CHAR_KEY = 'mazeman_character';
const OWNED_KEY = 'mazeman_owned';
const EQUIP_KEY = 'mazeman_equipped';

function readCharacter() {
  try { return localStorage.getItem(CHAR_KEY) || 'fox'; } catch { return 'fox'; }
}
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
}

export function AppProvider({ children }) {
  const [globalXP, setGlobalXP] = useState(0);
  const [points, setPoints] = useState(0);
  const pointsRef = useRef(0);
  const [character, setCharacterState] = useState(readCharacter);
  const [owned, setOwned] = useState(() => readJSON(OWNED_KEY, {}));
  const [equipped, setEquipped] = useState(() => readJSON(EQUIP_KEY, {}));
  const [currentLang, setCurrentLang] = useState('en');
  const [activeTab, setActiveTab] = useState('home');
  const [assessmentRequested, setAssessmentRequested] = useState(false);
  const [mazeVisible, setMazeVisible] = useState(false);
  const [mazeEntryPending, setMazeEntryPending] = useState(false);
  const [mazeStartRoom, setMazeStartRoom] = useState('hall'); // initial room for RoomHost
  const [workoutReturnRoom, setWorkoutReturnRoom] = useState(null); // re-enter 3D here after a workout
  const [challenge, setChallenge] = useState(null); // recruitment puzzle: { puzzleKey, id, name, power, returnRoom }
  const challengeRef = useRef(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const audioCtxRef = useRef(null);
  const sfxEnabledRef = useRef(readSfxEnabled());
  const [sfxEnabled, setSfxEnabledState] = useState(() => readSfxEnabled());

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

  const setSfxEnabled = useCallback((on) => {
    sfxEnabledRef.current = on;
    setSfxEnabledState(on);
    try {
      localStorage.setItem(SFX_KEY, on ? '1' : '0');
    } catch (e) {}
  }, []);

  const playSfx = useCallback((name) => {
    if (!sfxEnabledRef.current) return;
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

  // ----- Points economy (spendable currency for characters / skins / world) -----
  useEffect(() => {
    try {
      const p = parseInt(localStorage.getItem(POINTS_KEY) || '0', 10);
      if (Number.isFinite(p)) { pointsRef.current = p; setPoints(p); }
    } catch (e) { /* ignore */ }
  }, []);

  const awardPoints = useCallback((amount) => {
    const a = Number(amount) || 0;
    if (a <= 0) return;
    const next = Math.max(0, pointsRef.current + a);
    pointsRef.current = next;
    setPoints(next);
    try { localStorage.setItem(POINTS_KEY, String(next)); } catch (e) { /* ignore */ }
  }, []);

  const setCharacter = useCallback((id) => {
    setCharacterState(id);
    try { localStorage.setItem(CHAR_KEY, id); } catch (e) { /* ignore */ }
  }, []);

  // ----- Shop: own (buy) + equip cosmetic items -----
  const buyItem = useCallback((id, cost) => {
    if (pointsRef.current < cost) return false;
    const next = pointsRef.current - cost;
    pointsRef.current = next; setPoints(next);
    try { localStorage.setItem(POINTS_KEY, String(next)); } catch (e) { /* ignore */ }
    setOwned((o) => {
      const n = { ...o, [id]: 1 };
      try { localStorage.setItem(OWNED_KEY, JSON.stringify(n)); } catch (e) { /* ignore */ }
      return n;
    });
    return true;
  }, []);

  const equipItem = useCallback((slot, id) => {
    setEquipped((e) => {
      const n = { ...e };
      if (n[slot] === id) delete n[slot]; else n[slot] = id;
      try { localStorage.setItem(EQUIP_KEY, JSON.stringify(n)); } catch (err) { /* ignore */ }
      return n;
    });
  }, []);

  const spendPoints = useCallback((amount) => {
    const a = Number(amount) || 0;
    if (a <= 0 || pointsRef.current < a) return false;
    const next = pointsRef.current - a;
    pointsRef.current = next;
    setPoints(next);
    try { localStorage.setItem(POINTS_KEY, String(next)); } catch (e) { /* ignore */ }
    return true;
  }, []);

  /**
   * Award points for a TRAINING level win — but only the FIRST time that exact
   * level is cleared (a persisted ledger keyed by game:diff:level prevents
   * farming the same level). Returns the points granted (0 if already claimed).
   */
  const awardTrainingWin = useCallback((gameKey, diff, level, levelsPerTier = 100) => {
    const key = `${gameKey}:${diff}:${level}`;
    let claimed = {};
    try { claimed = JSON.parse(localStorage.getItem('mazeman_claimed_wins') || '{}') || {}; } catch (e) { /* ignore */ }
    if (claimed[key]) return 0;
    claimed[key] = 1;
    try { localStorage.setItem('mazeman_claimed_wins', JSON.stringify(claimed)); } catch (e) { /* ignore */ }
    const gained = trainingWinPoints(diff, level, levelsPerTier);
    awardPoints(gained);
    return gained;
  }, [awardPoints]);

  /**
   * Award points for a FREE-mode run — gradual & farm-proof. Each free LEVEL you
   * reach is worth its level number (level 1 → 1pt, level 2 → 2pts, …), and each
   * level pays only the FIRST time it's reached (persisted ledger keyed by
   * game:level). So points climb gradually as you go deeper, pushing further keeps
   * adding, but replaying shallow runs earns nothing. Returns points granted.
   */
  const awardFreeRun = useCallback((gameKey, levelsReached) => {
    const L = Math.max(0, Math.floor(Number(levelsReached) || 0));
    if (L <= 0) return 0;
    // every completed free run feeds the clinical training rating (EWMA),
    // regardless of whether it pays new points
    updateRating(gameKey, L);
    let claimed = {};
    try { claimed = JSON.parse(localStorage.getItem('mazeman_claimed_free') || '{}') || {}; } catch (e) { /* ignore */ }
    let gained = 0;
    let changed = false;
    for (let k = 1; k <= L; k++) {
      const key = `${gameKey}:${k}`;
      if (!claimed[key]) { claimed[key] = 1; gained += k; changed = true; } // level k → k points
    }
    if (changed) {
      try { localStorage.setItem('mazeman_claimed_free', JSON.stringify(claimed)); } catch (e) { /* ignore */ }
      awardPoints(gained);
    }
    return gained;
  }, [awardPoints]);

  const toggleLang = useCallback(() => {
    playSfx('click');
    setCurrentLang(prev => prev === 'en' ? 'ar' : 'en');
  }, [playSfx]);

  const switchTab = useCallback((tabId) => {
    playSfx('click');
    stopSpeech();
    setActiveTab(tabId);
  }, [playSfx, stopSpeech]);

  // Deep-link into the cognitive assessment (e.g. from the Daily Workout nudge).
  const openAssessment = useCallback(() => {
    playSfx('click');
    stopSpeech();
    setAssessmentRequested(true);
    setActiveTab('comics');
  }, [playSfx, stopSpeech]);
  const consumeAssessmentRequest = useCallback(() => setAssessmentRequested(false), []);

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

  // Launch the Daily Workout from a 3D room (the Gym coach). `returnRoom` is
  // where we drop the player back after they finish/leave the session.
  const openWorkout = useCallback((returnRoom = null) => {
    setWorkoutReturnRoom(returnRoom);
    setActiveTab('workout');
    setMazeVisible(false);
  }, []);

  // Recruitment: launch a soldier's puzzle full-screen (from the maze).
  const openPuzzleChallenge = useCallback((c) => {
    challengeRef.current = c;
    setChallenge(c);
    setMazeVisible(false);
  }, []);
  // Resolve a challenge: write the result to the army, then drop back into the
  // maze (where recruited soldiers respawn as followers). Guarded so it runs once.
  const finishChallenge = useCallback((success) => {
    const c = challengeRef.current;
    if (!c) return;
    challengeRef.current = null;
    if (success) armyRecruit({ id: c.id, name: c.name, power: c.power });
    else if (armyRecordAttempt(c.id) >= MAX_ATTEMPTS) armyMarkGone(c.id);
    setChallenge(null);
    setMazeStartRoom(c.returnRoom || 'maze');
    setActiveTab('home');
    setMazeVisible(true);
  }, []);

  // Leaving the workout: if we came from a 3D room, re-enter the world there;
  // otherwise just go home. (Also resets activeTab so a later 3D-quit lands home.)
  const leaveWorkout = useCallback(() => {
    if (workoutReturnRoom) {
      setMazeStartRoom(workoutReturnRoom);
      setWorkoutReturnRoom(null);
      setActiveTab('home');
      setMazeEntryPending(false);
      setMazeVisible(true);
    } else {
      switchTab('home');
    }
  }, [workoutReturnRoom, switchTab]);

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
      globalXP, points, currentLang, activeTab, mazeVisible, mazeEntryPending,
      paywallOpen, tipOpen, profileData,
      character, setCharacter,
      owned, equipped, buyItem, equipItem,
      sfxEnabled, setSfxEnabled,
      assessmentRequested, openAssessment, consumeAssessmentRequest,
      mazeStartRoom, setMazeStartRoom, openWorkout, leaveWorkout,
      challenge, openPuzzleChallenge, finishChallenge,
      updateXP, awardPoints, spendPoints, awardTrainingWin, awardFreeRun, toggleLang, switchTab, requestMazeEntry, enterMaze, exitMaze,
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
