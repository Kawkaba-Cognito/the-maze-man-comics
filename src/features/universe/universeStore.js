import { loadJson, saveJson } from '../../lib/storage';

/** Home Universe — user-created small planets (notes / goals / journal). */

const KEY = 'mm_universe_planets_v1';

// Space-metal palette (2026-07-16 zen-universe redesign): warm colors only —
// gold / ember red / copper. Deliberately no blues or violets.
export const PLANET_TYPES = {
  note: {
    icon: '📝',
    color: '#e8b84b',
    en: 'Note', ar: 'ملاحظة',
    promptEn: 'What do you want to remember?', promptAr: 'ما الذي تريد تذكّره؟',
  },
  goal: {
    icon: '🎯',
    color: '#d96a4f',
    en: 'Goal', ar: 'هدف',
    promptEn: 'What are you working toward?', promptAr: 'ما الذي تسعى إليه؟',
  },
  journal: {
    icon: '💭',
    color: '#b08150',
    en: 'Journal', ar: 'يوميات',
    promptEn: "What's on your mind?", promptAr: 'بم تفكّر الآن؟',
  },
};

export const JOURNAL_MOODS = ['😊', '😌', '😐', '😢', '😠', '😰', '🥳'];

export function loadPlanets() {
  const p = loadJson(KEY, []);
  return Array.isArray(p) ? p : [];
}

export function savePlanets(planets) {
  saveJson(KEY, planets);
}

function randPos(existing) {
  // Free positions in a safe band (avoid the top caption, the bottom tab
  // bar, and a dead-center circle reserved for Kawkab), nudged away from
  // planets already there so fresh spawns don't stack exactly on top.
  for (let attempt = 0; attempt < 12; attempt++) {
    const x = 12 + Math.random() * 76;
    const y = 20 + Math.random() * 58;
    const dCenter = Math.hypot(x - 50, y - 50);
    if (dCenter < 14) continue;
    const tooClose = existing.some((p) => Math.hypot(p.x - x, p.y - y) < 12);
    if (!tooClose) return { x, y };
  }
  return { x: 12 + Math.random() * 76, y: 20 + Math.random() * 58 };
}

export function createPlanet(type, fields, existing) {
  const { x, y } = randPos(existing);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    x, y,
    title: fields.title || '',
    body: fields.body || '',
    done: !!fields.done,
    mood: fields.mood || null,
    createdAt: Date.now(),
  };
}
