/*
 * Trivia content bank — 20 categories, up to 72 questions each (easy ★ · medium ★★ · hard ★★★),
 * bilingual (EN/AR), each with a "did you know" fact. Authored in ./data/*.js by theme group.
 *
 * Question shape: { d: 1|2|3, en, ar, o: [[en,ar]×4], a: indexOfCorrect, f: {en,ar} }.
 * The engine shuffles option order at runtime, so `a` is just the author key.
 * Rules: accurate, timeless, culturally neutral. No religion, no politics.
 */
import { NATURE } from './data/nature';
import { SCIENCE } from './data/science';
import { WORLD } from './data/world';
import { CULTURE } from './data/culture';
import { MIND } from './data/mind';
import { ANCIENT } from './data/ancient';
import { TECH } from './data/tech';
import { DINO } from './data/dino';

export const TRIVIA_CATEGORIES = [
  { id: 'animals', en: 'Animals', ar: 'الحيوانات', emoji: '🦁' },
  { id: 'ocean', en: 'Ocean Life', ar: 'المحيط', emoji: '🐙' },
  { id: 'plants', en: 'Plants & Nature', ar: 'النباتات والطبيعة', emoji: '🌿' },
  { id: 'weather', en: 'Weather & Earth', ar: 'الطقس والأرض', emoji: '🌦️' },
  { id: 'space', en: 'Space', ar: 'الفضاء', emoji: '🪐' },
  { id: 'body', en: 'Human Body', ar: 'جسم الإنسان', emoji: '🫀' },
  { id: 'science', en: 'Science', ar: 'العلوم', emoji: '🔬' },
  { id: 'everyday', en: 'How Things Work', ar: 'كيف تعمل الأشياء', emoji: '⚙️' },
  { id: 'geography', en: 'World Geography', ar: 'جغرافيا العالم', emoji: '🗺️' },
  { id: 'history', en: 'History', ar: 'التاريخ', emoji: '🏛️' },
  { id: 'inventions', en: 'Inventions & Tech', ar: 'الاختراعات والتقنية', emoji: '💡' },
  { id: 'food', en: 'Food', ar: 'الطعام', emoji: '🍎' },
  { id: 'sports', en: 'Sports', ar: 'الرياضة', emoji: '⚽' },
  { id: 'math', en: 'Numbers & Math', ar: 'الأرقام والرياضيات', emoji: '🔢' },
  { id: 'arts', en: 'Art & Music', ar: 'الفنون والموسيقى', emoji: '🎨' },
  { id: 'words', en: 'Words & Stories', ar: 'الكلمات والقصص', emoji: '📚' },
  { id: 'mind', en: 'Mind & Psychology', ar: 'العقل وعلم النفس', emoji: '🧠' },
  { id: 'ancient', en: 'Ancient Worlds & Myths', ar: 'العوالم القديمة والأساطير', emoji: '🏺' },
  { id: 'tech', en: 'Technology & Computers', ar: 'التقنية والحواسيب', emoji: '💻' },
  { id: 'dino', en: 'Dinosaurs & Prehistory', ar: 'الديناصورات وما قبل التاريخ', emoji: '🦕' },
];

export const TRIVIA = { ...NATURE, ...SCIENCE, ...WORLD, ...CULTURE, ...MIND, ...ANCIENT, ...TECH, ...DINO };
