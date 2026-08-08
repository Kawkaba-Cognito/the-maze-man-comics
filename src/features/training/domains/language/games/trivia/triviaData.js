/*
 * Trivia content bank — 31 categories, graded ★ easy · ★★ medium · ★★★ hard ·
 * ★★★★ expert, bilingual (EN/AR), each with a "did you know" fact. Authored in
 * ./data/*.js by theme group.
 *
 * The authored bank is the floor, not the ceiling: categories listed in
 * TABLE_FOR below are also fed by procedural.js, which builds questions
 * combinatorially from structured tables and does not run out.
 *
 * Question shape: { d: 1|2|3|4, en, ar, o: [[en,ar]×4], a: indexOfCorrect, f: {en,ar} }.
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
import { SUPPLEMENT } from './data/supplement';
import { EXPERT } from './data/expert';
import { NEWCATS } from './data/newcats';
import { THOUGHT } from './data/thought';
import { COUNTRIES } from './data/tables/countries';
import { ELEMENTS } from './data/tables/elements';

// Fold one bank of {catId: [...extra questions]} into the merged bank.
function mergeExtra(merged, extra) {
  for (const [id, list] of Object.entries(extra)) {
    merged[id] = [...(merged[id] || []), ...list];
  }
  return merged;
}

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
  { id: 'chem', en: 'Chemistry & Elements', ar: 'الكيمياء والعناصر', emoji: '⚗️' },
  { id: 'arch', en: 'Wonders & Architecture', ar: 'العجائب والعمارة', emoji: '🏰' },
  { id: 'money', en: 'Money & Trade', ar: 'المال والتجارة', emoji: '💰' },
  { id: 'codes', en: 'Codes & Secrets', ar: 'الشيفرات والأسرار', emoji: '🔐' },
  /* 2026-08: added as distinct disciplines.
   *
   * "psychology" is separate from "mind" on purpose. Mind & Psychology is
   * mostly perception and cognition; this one is the FIELD — its experiments,
   * figures and findings. The split adds rather than renames because category
   * ids are keys in the saved seen-map and positions in the Levels rotation, so
   * renaming "mind" would strand every existing player's history. */
  { id: 'philosophy', en: 'Philosophy', ar: 'الفلسفة', emoji: '🤔' },
  { id: 'psychology', en: 'Psychology', ar: 'علم النفس', emoji: '🧩' },
  { id: 'medicine', en: 'Medicine & Health', ar: 'الطب والصحة', emoji: '🩺' },
  { id: 'literature', en: 'Literature', ar: 'الأدب', emoji: '📖' },
  { id: 'cinema', en: 'Cinema & Animation', ar: 'السينما والرسوم', emoji: '🎬' },
  { id: 'economics', en: 'Economics', ar: 'الاقتصاد', emoji: '📈' },
  { id: 'languages', en: 'Languages & Writing', ar: 'اللغات والكتابة', emoji: '🗣️' },
];

/*
 * Structured tables the procedural generator draws from, by category.
 *
 * A category with a table here never runs out: see procedural.js. A category
 * without one falls back to its authored bank alone, which is the correct
 * behaviour — "Words & Stories" has no table of comparable entities and forcing
 * one would produce nonsense questions.
 */
export const TABLE_FOR = {
  geography: COUNTRIES,
  chem: ELEMENTS,
};

// Base banks + supplement + expert (d:4) folded into existing categories,
// then the four brand-new categories.
export const TRIVIA = (() => {
  let merged = { ...NATURE, ...SCIENCE, ...WORLD, ...CULTURE, ...MIND, ...ANCIENT, ...TECH, ...DINO };
  mergeExtra(merged, SUPPLEMENT);
  mergeExtra(merged, EXPERT);
  mergeExtra(merged, NEWCATS);
  mergeExtra(merged, THOUGHT);
  return merged;
})();
