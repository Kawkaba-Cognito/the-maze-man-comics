/** Persist campaign progress — outer gate first, then labyrinth floors. */
const KEY = 'mm_campaign_v3';
const LEGACY_KEYS = ['mm_campaign_v2', 'mm_campaign_v1'];
const GATE_FIX_KEY = 'mm_gate_fix_v3';

function migrateAny(raw) {
  if (!raw || typeof raw !== 'object') {
    return { enteredLabyrinth: false, gateBossBeaten: false, floor: 'floor1' };
  }
  const floor = raw.floor && raw.floor !== 'gate' ? raw.floor : 'floor1';
  return {
    enteredLabyrinth: false,
    gateBossBeaten: !!(raw.gateBossBeaten || raw.gateCleared),
    floor,
  };
}

function normalize(s) {
  const out = { enteredLabyrinth: false, gateBossBeaten: false, floor: 'floor1', ...s };
  // Invalid: big labyrinth without clearing the gate boss first.
  if (out.enteredLabyrinth && !out.gateBossBeaten) out.enteredLabyrinth = false;
  return out;
}

function load() {
  try {
    const cur = localStorage.getItem(KEY);
    if (cur) return normalize(JSON.parse(cur) || {});
    for (const legacyKey of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) {
        const migrated = normalize(migrateAny(JSON.parse(legacy)));
        save(migrated);
        return migrated;
      }
    }
    return normalize({});
  } catch {
    return normalize({});
  }
}

function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(normalize(s))); } catch { /* ignore */ }
}

export const DEFAULT_FLOOR = 'gate';

/**
 * One-time fix: old saves skipped the outer gate. Runs once per browser after this update.
 */
export function ensureGateProgress() {
  try {
    if (localStorage.getItem(GATE_FIX_KEY)) return;
    resetToGate();
    localStorage.setItem(GATE_FIX_KEY, '1');
  } catch { /* ignore */ }
}

/** Which 3D room to build when entering the maze. */
export function getCampaignFloor() {
  const s = load();
  if (!s.enteredLabyrinth) return 'gate';
  return s.floor || 'floor1';
}

/** Always the outer gate — for the dedicated home button. */
export function getOuterGateRoom() {
  return 'gate';
}

export function hasEnteredLabyrinth() {
  return !!load().enteredLabyrinth;
}

export function isGateBossBeaten() {
  return !!load().gateBossBeaten;
}

/** @deprecated use isGateBossBeaten */
export function isGateCleared() {
  return isGateBossBeaten();
}

export function setGateBossBeaten(beaten = true) {
  const s = load();
  s.gateBossBeaten = beaten;
  save(s);
}

/** Player stepped through the gate portal into the big labyrinth. */
export function enterLabyrinth(floorId = 'floor1') {
  const s = load();
  s.enteredLabyrinth = true;
  s.gateBossBeaten = true;
  s.floor = floorId;
  save(s);
}

export function setCampaignFloor(floorId) {
  const s = load();
  s.floor = floorId;
  save(s);
}

export function resetCampaign() {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(GATE_FIX_KEY);
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore */ }
}

/** Replay the outer gate (small room) from the start. */
export function resetToGate() {
  const s = load();
  s.enteredLabyrinth = false;
  s.gateBossBeaten = false;
  save(s);
}

/** Home → outer gate button: reset gate chapter and open the small room. */
export function prepareOuterGateEntry() {
  resetToGate();
}
