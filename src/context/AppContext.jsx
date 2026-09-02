import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { trainingWinPoints, ladderWinPoints } from '../lib/points';
import { updateRating } from '../features/training/rating';
import { recruit as armyRecruit, recordAttempt as armyRecordAttempt, markGone as armyMarkGone, MAX_ATTEMPTS } from '../features/army/armyState';
import { getCampaignFloor, DEFAULT_FLOOR, hasEnteredLabyrinth, prepareOuterGateEntry, ensureGateProgress } from '../features/campaign/campaignProgress';
import { readAppTheme, writeAppTheme, applyThemeToDocument } from '../lib/appTheme';
import { applyThemeAssetCssVars } from '../lib/assetUrl';
import { playCue } from '../lib/sfx';

const AppContext = createContext(null);

const SFX_KEY = 'mazeman_sfx_enabled';

/*
 * There is no background soundtrack. A CC0 loop (Assets/sounds/heavenly-loop.ogg,
 * 1.2 MB) used to start on the first pointer gesture anywhere and run for the
 * whole session, with a Music row in Settings to stop it. It was removed
 * deliberately — this is a training and wellbeing app, and a bed of music under
 * a timed attention task is a competing stimulus, not atmosphere.
 *
 * `mazeman_music_enabled` is left unread rather than migrated: it is one stale
 * boolean, and nothing reads it now that the toggle is gone. SFX (the short
 * synthesized tones in playSfx below) are unaffected and keep their setting.
 */

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
  try {
    const id = localStorage.getItem(CHAR_KEY);
    if (id && id !== 'cosmos') localStorage.setItem(CHAR_KEY, 'cosmos');
  } catch { /* ignore */ }
  return 'cosmos';
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
  // App opens on the Home universe ('habits' tab hosts HomeScreen), not Training.
  const [activeTab, setActiveTab] = useState('habits');
  // Screens register here when they drill into a game / practice / session, so
  // the bottom tab bar hides on any deep view and shows only on tab landings.
  const [immersiveMap, setImmersiveMap] = useState({});
  const [assessmentRequested, setAssessmentRequested] = useState(false);
  const [mazeVisible, setMazeVisible] = useState(false);
  const [mazeEntryPending, setMazeEntryPending] = useState(false);
  const [mazeStartRoom, setMazeStartRoom] = useState(DEFAULT_FLOOR);
  const [challenge, setChallenge] = useState(null); // recruitment puzzle: { puzzleKey, id, name, power, returnRoom }
  const challengeRef = useRef(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [profileData, setProfileData] = useState(DEFAULT_PROFILE);
  const audioCtxRef = useRef(null);
  const sfxEnabledRef = useRef(readSfxEnabled());
  const [sfxEnabled, setSfxEnabledState] = useState(() => readSfxEnabled());
  const [appTheme, setAppThemeState] = useState(readAppTheme);

  // Load profile on mount
  useEffect(() => { ensureGateProgress(); }, []);

  useEffect(() => {
    applyThemeToDocument(appTheme);
    applyThemeAssetCssVars(appTheme);
  }, [appTheme]);

  const setAppTheme = useCallback((themeOrFn) => {
    setAppThemeState((prev) => {
      const nextRaw = typeof themeOrFn === 'function' ? themeOrFn(prev) : themeOrFn;
      return writeAppTheme(nextRaw);
    });
  }, []);

  const toggleAppTheme = useCallback(() => {
    setAppTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, [setAppTheme]);
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
      // Cues are synthesized on demand, so there is nothing to preload.
      if (AC && !audioCtxRef.current) audioCtxRef.current = new AC();
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    } catch (e) {}
  }, []);

  /*
   * `playTone` used to live here — a bare oscillator with no filter and no
   * attack ramp, driven at 600-1200 Hz on square and sawtooth waves. The whole
   * palette now lives in lib/sfx.js, which states each cue's frequency,
   * waveform, filter and envelope in one readable table.
   */

  const setSfxEnabled = useCallback((on) => {
    sfxEnabledRef.current = on;
    setSfxEnabledState(on);
    try {
      localStorage.setItem(SFX_KEY, on ? '1' : '0');
    } catch (e) {}
  }, []);

  /*
   * ⚠ `correct` and `wrong` were MISSING from the old chain of ifs, and Word
   * Maze calls both (index.jsx:427, :435). Neither matched a branch, so the
   * function ran to the end and made no sound at all: two silent buttons, no
   * error, no warning. Same shape as the results button that rendered
   * `{t.cont}` with `cont` declared nowhere. CUES in lib/sfx.js is a lookup
   * rather than a chain of ifs precisely so a name cannot go missing like that
   * again — an unknown name is now one place to check, not six branches.
   */
  const playSfx = useCallback((name) => {
    if (!sfxEnabledRef.current) return;
    initAudio();
    playCue(audioCtxRef.current, name);
  }, [initAudio]);

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

  const setCharacter = useCallback((_id) => {
    setCharacterState('cosmos');
    try { localStorage.setItem(CHAR_KEY, 'cosmos'); } catch (e) { /* ignore */ }
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
   * The same, for a game on THE LADDER (2026-08-28) — one climb, no tier.
   *
   * ⚠ The claim key keeps a `lad` segment where the tier name used to sit, so a
   * player who cleared `speed-match:hard:40` before the migration can still
   * claim `speed-match:lad:40`. Reusing the old key shape would have made every
   * migrated level look already-farmed and silently pay nothing.
   */
  const awardLadderWin = useCallback((gameKey, level, levels = 50) => {
    const key = `${gameKey}:lad:${level}`;
    let claimed = {};
    try { claimed = JSON.parse(localStorage.getItem('mazeman_claimed_wins') || '{}') || {}; } catch (e) { /* ignore */ }
    if (claimed[key]) return 0;
    claimed[key] = 1;
    try { localStorage.setItem('mazeman_claimed_wins', JSON.stringify(claimed)); } catch (e) { /* ignore */ }
    const gained = ladderWinPoints(level, levels);
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

  // A screen flags itself immersive (deep view) or not, keyed by screen. Only
  // the ACTIVE screen's flag counts — always-mounted screens (e.g. Workout,
  // which auto-starts a session in the background) must not hide the tab bar
  // while another tab is showing.
  const setImmersive = useCallback((key, on) => {
    setImmersiveMap((m) => {
      if (!!m[key] === !!on) return m;
      const next = { ...m };
      if (on) next[key] = true; else delete next[key];
      return next;
    });
  }, []);
  const activeImmersiveKey =
    activeTab === 'comics' || activeTab === 'home' ? 'comics'
    : activeTab === 'puzzles' ? 'puzzles'
    : activeTab === 'workout' ? 'workout'
    : activeTab === 'habits' || activeTab === 'wellbeing' || activeTab === 'relax' ? 'relax'
    : null;
  const immersive = activeImmersiveKey ? !!immersiveMap[activeImmersiveKey] : false;

  const switchTab = useCallback((tabId) => {
    playSfx('click');
    stopSpeech();
    // Legacy "home" now lands on Habits (the Home tab).
    let next = tabId === 'home' ? 'habits' : tabId;
    // Home uses the legacy "habits" id. Daily Habits opens through the
    // internal "relax" route so the one-time view flag reaches RelaxScreen.
    if (next === 'habits') {
      try { sessionStorage.setItem('rx_open_daily', '1'); } catch { /* ignore */ }
    } else if (next === 'wellbeing') {
      try { sessionStorage.removeItem('rx_open_daily'); } catch { /* ignore */ }
    }
    setActiveTab(next);
  }, [playSfx, stopSpeech]);

  // Deep-link into the cognitive assessment (e.g. from the Daily Workout nudge).
  const openAssessment = useCallback(() => {
    playSfx('click');
    stopSpeech();
    setAssessmentRequested(true);
    setActiveTab('comics');
  }, [playSfx, stopSpeech]);
  const consumeAssessmentRequest = useCallback(() => setAssessmentRequested(false), []);

  const beginMazeEntry = useCallback((roomKey) => {
    playSfx('click');
    stopSpeech();
    setMazeStartRoom(roomKey);

    if (typeof window.BABYLON !== 'undefined') {
      setMazeEntryPending(true);
      return;
    }

    setMazeEntryPending(true);
    if (document.getElementById('babylon-cdn')) return;
    const script = document.createElement('script');
    script.id = 'babylon-cdn';
    script.src = 'https://cdn.babylonjs.com/v9.11.0/babylon.js';
    script.integrity = 'sha384-uXkmKN+2jmCGDEGble8eNhnYoDGtzLMPhnublKtjvBUzerIVkBQIcJhOeW/hjVuF';
    script.crossOrigin = 'anonymous';
    script.onerror = () => {
      script.remove();
      setMazeEntryPending(false);
      alert('Requires internet connection to load 3D Engine.');
    };
    document.head.appendChild(script);
  }, [playSfx, stopSpeech]);

  /** Small outer gate room — always starts here until portal entered. */
  const requestOuterGate = useCallback(() => {
    prepareOuterGateEntry();
    beginMazeEntry('gate');
  }, [beginMazeEntry]);

  /** Resume the big labyrinth (floor 1+) after clearing the outer gate. */
  const requestContinueMaze = useCallback(() => {
    beginMazeEntry(getCampaignFloor());
  }, [beginMazeEntry]);

  const requestMazeEntry = requestOuterGate;

  /** Escape Room — the standalone 3D escape experience (no boss / no army). */
  const requestEscapeRoom = useCallback(() => {
    beginMazeEntry('escape');
  }, [beginMazeEntry]);

  const enterMaze = useCallback(() => {
    // Babylon loads on demand now, so the maze can only mount once it's ready.
    // If the transition finished before the engine arrived (slow network), keep
    // the overlay up and poll until BABYLON is available.
    if (typeof window.BABYLON === 'undefined') {
      setTimeout(enterMaze, 150);
      return;
    }
    setMazeEntryPending(false);
    setMazeVisible(true);
  }, []);

  const exitMaze = useCallback(() => {
    playSfx('click');
    setMazeVisible(false);
  }, [playSfx]);

  const openWorkout = useCallback(() => {
    playSfx('click');
    stopSpeech();
    setMazeVisible(false);
    setActiveTab('workout');
  }, [playSfx, stopSpeech]);

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
    setMazeStartRoom(hasEnteredLabyrinth() ? (c.returnRoom || getCampaignFloor()) : 'gate');
    setMazeVisible(true);
  }, []);

  const leaveWorkout = useCallback(() => {
    switchTab('comics');
  }, [switchTab]);

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
      globalXP, points, currentLang, activeTab, immersive, setImmersive, mazeVisible, mazeEntryPending,
      paywallOpen, tipOpen, profileData,
      character, setCharacter,
      owned, equipped, buyItem, equipItem,
      sfxEnabled, setSfxEnabled,
      appTheme, setAppTheme, toggleAppTheme,
      assessmentRequested, openAssessment, consumeAssessmentRequest,
      mazeStartRoom, setMazeStartRoom, openWorkout, leaveWorkout,
      challenge, openPuzzleChallenge, finishChallenge,
      updateXP, awardPoints, spendPoints, awardTrainingWin, awardLadderWin, awardFreeRun, toggleLang, switchTab,
      requestMazeEntry, requestOuterGate, requestContinueMaze, requestEscapeRoom, enterMaze, exitMaze,
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
