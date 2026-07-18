import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import CosmosCharacter from '../../../../../character/CosmosCharacter';
import FoxCharacter from '../../../../../character/FoxCharacter';
import PersonCharacter from '../../../../../character/PersonCharacter';
import Emoji from '../../../../../../components/shared/Emoji';
import { STORIES } from './stories';
import { lazyWithRetry } from '../../../../../../lib/lazyWithRetry';
import { planetIconUrl } from '../../../../../../lib/planetIcons';

const StoryGrid3DProto = lazyWithRetry(() => import('./StoryGrid3DProto'), 'story-grid-3d');

/*
 * Story Time — temporal-order / episodic memory.
 *
 *   WATCH   — an authored, connected story plays panel by panel (characters go
 *             places, things happen, they react via speech bubbles). A memorize
 *             timer; flip panels with Prev/Next; Done to finish.
 *   REBUILD — press-to-place: tap a PLACE / CHARACTER / ACTION in the board, then
 *             tap a panel to drop it in. Harder rounds add DISTRACTOR pieces.
 *   REVEAL  — each panel scored against the story.
 *
 * Shared 3-mode flow (Survival / Levels / Pass n Play). Seeded → deterministic
 * (Pass-n-Play players rebuild the same story).
 *
 * Cast: Kawkab, Star, Noor (fox), Ramy (boy), Lola (girl).
 * Self-contained: inline styles, CSS keyframes only, no image assets.
 */

export const ANIM_CSS = `
@keyframes sg-bounce {0%,100%{transform:translateY(0)}30%{transform:translateY(-13%)}55%{transform:translateY(0)}}
@keyframes sg-sway {0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes sg-idle {0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes sg-sleep {0%,100%{transform:rotate(9deg) scale(1)}50%{transform:rotate(9deg) scale(1.04)}}
@keyframes sg-eat {0%,100%{transform:translateY(0)}50%{transform:translateY(7%)}}
@keyframes sg-study {0%,100%{transform:rotate(-6deg) translateY(0)}50%{transform:rotate(-3deg) translateY(3%)}}
@keyframes sg-spin {0%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.06)}100%{transform:rotate(-8deg) scale(1)}}
@keyframes sg-pop {0%,100%{transform:scale(1)}50%{transform:scale(1.22)}}
@keyframes sg-float {0%{transform:translateY(20%);opacity:.3}40%{opacity:1}100%{transform:translateY(-75%);opacity:0}}
@keyframes sg-food {0%{transform:translate(26px,40px) scale(1);opacity:0}15%{opacity:1}60%{transform:translate(0,8px) scale(0.62);opacity:1}80%{transform:translate(0,8px) scale(0.12);opacity:0}100%{opacity:0}}
@keyframes sg-seed {0%{transform:translate(-50%,-8px) scale(1);opacity:0}12%{opacity:1}48%{transform:translate(-50%,52px) scale(0.85);opacity:1}58%{opacity:0}100%{opacity:0}}
@keyframes sg-sprout {0%,48%{transform:translateX(-50%) scaleY(0);opacity:0}58%{opacity:1}92%{transform:translateX(-50%) scaleY(1);opacity:1}100%{transform:translateX(-50%) scaleY(1);opacity:0}}
@keyframes sg-note {0%{transform:translate(0,8px) rotate(-12deg);opacity:0}25%{opacity:1}100%{transform:translate(0,-46px) rotate(12deg);opacity:0}}
@keyframes sg-ball {0%,100%{transform:translateX(-50%) translateY(-46px)}50%{transform:translateX(-50%) translateY(-2px)}}
@keyframes sg-twinkle {0%,100%{opacity:0.45}50%{opacity:1}}
@keyframes sg-bubble {0%{transform:scale(0.6);opacity:0}45%{transform:scale(1.05);opacity:1}70%{transform:scale(1)}100%{transform:scale(1);opacity:1}}
@keyframes sg-walk {0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-9%) rotate(4deg)}}
@keyframes sg-rise {0%{transform:translate(0,6px) scale(0.6);opacity:0}30%{opacity:1}100%{transform:translate(0,-40px) scale(1);opacity:0}}
@keyframes sg-fly {0%,100%{transform:translateY(2%) rotate(-3deg)}50%{transform:translateY(-12%) rotate(3deg)}}
@keyframes sg-steam {0%{transform:translateY(0) scale(0.7);opacity:0}30%{opacity:.8}100%{transform:translateY(-30px) scale(1.1);opacity:0}}
`;

// ── CONTENT ──────────────────────────────────────────────────────────────
// Each background is a little SCENE: sky/wall gradient + a floor band + a few
// anchored props (in the sky, along the far edges, or resting on the floor) so
// the place reads at a glance and never blurs into another. Props hug the sides
// and top so the centre-bottom stays clear for the characters. `floor` sets how
// tall the ground band is (indoor rooms get a taller floor). `fenceless` keeps
// the sky→ground edge soft. Numeric positions/sizes scale with the panel.
export const BACKGROUNDS = {
  home: { en: 'Home', ar: 'البيت', chip: '🏠', bg: 'linear-gradient(180deg,#fbe6cf 0%,#f4d3ab 100%)', ground: '#c69a67', floor: 30, amb: [
    { e: '🖼️', s: { top: 12, insetInlineStart: 14, fontSize: 20 } },
    { e: '🪟', s: { top: 10, insetInlineEnd: 14, fontSize: 24, opacity: 0.95 } },
    { e: '🛋️', s: { bottom: '20%', insetInlineStart: 8, fontSize: 30 } },
    { e: '🪴', s: { bottom: '22%', insetInlineEnd: 10, fontSize: 22 } },
  ] },
  street: { en: 'Street', ar: 'الطريق', chip: '🚸', bg: 'linear-gradient(180deg,#bfe3ff 0%,#e9f4ce 100%)', ground: '#9a948a', floor: 24, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '☁️', s: { top: 16, insetInlineStart: 18, fontSize: 18, opacity: 0.9, animation: 'sg-float 6s ease-in-out infinite' } },
    { e: '🏠', s: { bottom: '20%', insetInlineStart: 6, fontSize: 30 } },
    { e: '🌳', s: { bottom: '20%', insetInlineEnd: 8, fontSize: 28 } },
    { e: '🚦', s: { bottom: '22%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 16, opacity: 0.85 } },
  ] },
  school: { en: 'School', ar: 'المدرسة', chip: '🏫', bg: 'linear-gradient(180deg,#d3ecff 0%,#c7ecd0 100%)', ground: '#8fbf72', floor: 22, amb: [
    { e: '🏫', s: { bottom: '18%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 40 } },
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '🚩', s: { top: 8, insetInlineStart: 16, fontSize: 18 } },
    { e: '🌳', s: { bottom: '18%', insetInlineEnd: 8, fontSize: 24 } },
  ] },
  classroom: { en: 'Classroom', ar: 'الصف', chip: '📚', bg: 'linear-gradient(180deg,#f3e7cd 0%,#ead6ae 100%)', ground: '#b98e58', floor: 30, amb: [
    { e: '🟩', s: { top: 12, insetInlineStart: 14, fontSize: 34 } },
    { e: '🕐', s: { top: 12, insetInlineEnd: 14, fontSize: 18 } },
    { e: '📚', s: { bottom: '22%', insetInlineEnd: 10, fontSize: 22 } },
    { e: '🪑', s: { bottom: '20%', insetInlineStart: 10, fontSize: 22 } },
  ] },
  kitchen: { en: 'Kitchen', ar: 'مطبخ', chip: '🍳', bg: 'linear-gradient(180deg,#fff1dc 0%,#ffdcae 100%)', ground: '#d79f63', floor: 32, amb: [
    { e: '🪟', s: { top: 10, insetInlineEnd: 14, fontSize: 22, opacity: 0.9 } },
    { e: '🍎', s: { top: 14, insetInlineStart: 16, fontSize: 18 } },
    { e: '🔥', s: { bottom: '24%', insetInlineStart: 12, fontSize: 22 } },
    { e: '🧺', s: { bottom: '22%', insetInlineEnd: 12, fontSize: 22 } },
  ] },
  garden: { en: 'Garden', ar: 'حديقة', chip: '🌷', bg: 'linear-gradient(180deg,#d7f0ff 0%,#cdeeae 100%)', ground: '#7fb85c', floor: 26, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '🦋', s: { top: 26, insetInlineStart: 22, fontSize: 16, animation: 'sg-fly 3s ease-in-out infinite' } },
    { e: '🌳', s: { bottom: '20%', insetInlineStart: 4, fontSize: 34 } },
    { e: '🌷', s: { bottom: '20%', insetInlineEnd: 8, fontSize: 20 } },
    { e: '🌻', s: { bottom: '20%', insetInlineEnd: 30, fontSize: 18 } },
  ] },
  park: { en: 'Park', ar: 'منتزه', chip: '⚽', bg: 'linear-gradient(180deg,#c6e8ff 0%,#a9dbf7 100%)', ground: '#78bd5f', floor: 26, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 24 } },
    { e: '☁️', s: { top: 16, insetInlineStart: 16, fontSize: 18, opacity: 0.9, animation: 'sg-float 7s ease-in-out infinite' } },
    { e: '🌳', s: { bottom: '20%', insetInlineStart: 6, fontSize: 32 } },
    { e: '🪑', s: { bottom: '20%', insetInlineEnd: 8, fontSize: 22 } },
  ] },
  beach: { en: 'Beach', ar: 'الشاطئ', chip: '🏖️', bg: 'linear-gradient(180deg,#aee2ff 0%,#ffe9bd 100%)', ground: '#f0d79a', floor: 30, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 24 } },
    { e: '🌴', s: { bottom: '24%', insetInlineStart: 6, fontSize: 32 } },
    { e: '⛱️', s: { bottom: '24%', insetInlineEnd: 8, fontSize: 26 } },
    { e: '🌊', s: { bottom: '26%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 18, opacity: 0.85, animation: 'sg-sway 2.4s ease-in-out infinite' } },
  ] },
  pool: { en: 'Pool', ar: 'المسبح', chip: '🏊', bg: 'linear-gradient(180deg,#cdeeff 0%,#79cbe8 100%)', ground: '#39a6cf', floor: 40, amb: [
    { e: '☀️', s: { top: 10, insetInlineEnd: 14, fontSize: 22 } },
    { e: '🏖️', s: { top: 12, insetInlineStart: 14, fontSize: 18, opacity: 0.9 } },
    { e: '🛟', s: { bottom: '30%', insetInlineEnd: 10, fontSize: 24 } },
    { e: '💦', s: { bottom: '30%', insetInlineStart: 14, fontSize: 16, animation: 'sg-twinkle 1.8s ease-in-out infinite' } },
  ] },
  museum: { en: 'Museum', ar: 'المتحف', chip: '🖼️', bg: 'linear-gradient(180deg,#f0e8f8 0%,#dbccec 100%)', ground: '#a98ec6', floor: 28, amb: [
    { e: '🖼️', s: { top: 14, insetInlineStart: 14, fontSize: 24 } },
    { e: '🖼️', s: { top: 14, insetInlineEnd: 14, fontSize: 20 } },
    { e: '🏺', s: { bottom: '22%', insetInlineStart: 12, fontSize: 22 } },
    { e: '🗿', s: { bottom: '22%', insetInlineEnd: 12, fontSize: 24 } },
  ] },
  library: { en: 'Library', ar: 'المكتبة', chip: '📖', bg: 'linear-gradient(180deg,#f7ecd8 0%,#e6cfa2 100%)', ground: '#b58f5c', floor: 30, amb: [
    { e: '📚', s: { bottom: '22%', insetInlineStart: 6, fontSize: 30 } },
    { e: '📚', s: { bottom: '22%', insetInlineEnd: 6, fontSize: 30 } },
    { e: '🪔', s: { top: 12, insetInlineEnd: 16, fontSize: 18 } },
    { e: '🪜', s: { bottom: '22%', insetInlineStart: 34, fontSize: 22, opacity: 0.85 } },
  ] },
  space: { en: 'Space', ar: 'الفضاء', chip: '🌌', bg: 'linear-gradient(180deg,#080d24 0%,#232c56 100%)', ground: '#171f42', floor: 18, dark: true, amb: [
    { e: '🪐', s: { top: 12, insetInlineEnd: 14, fontSize: 26 } },
    { e: '⭐', s: { top: 12, insetInlineStart: 16, fontSize: 14, animation: 'sg-twinkle 2s ease-in-out infinite' } },
    { e: '✨', s: { top: 34, insetInlineEnd: 42, fontSize: 12, animation: 'sg-twinkle 1.8s ease-in-out 0.6s infinite' } },
    { e: '🌙', s: { bottom: '20%', insetInlineStart: 10, fontSize: 24 } },
    { e: '☄️', s: { top: 46, insetInlineStart: 30, fontSize: 16, animation: 'sg-fly 4s ease-in-out infinite' } },
  ] },
  stage: { en: 'Stage', ar: 'مسرح', chip: '🎤', bg: 'linear-gradient(180deg,#341a4c 0%,#7a4aa0 100%)', ground: '#3f2357', floor: 24, dark: true, amb: [
    { e: '🪩', s: { top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 26, animation: 'sg-spin 1.2s linear infinite' } },
    { e: '✨', s: { top: 30, insetInlineEnd: 22, fontSize: 14, animation: 'sg-twinkle 1.6s ease-in-out infinite' } },
    { e: '🎶', s: { top: 34, insetInlineStart: 20, fontSize: 16, animation: 'sg-note 2.2s ease-in-out infinite' } },
    { e: '🔦', s: { bottom: '22%', insetInlineStart: 10, fontSize: 20, opacity: 0.8 } },
    { e: '🔦', s: { bottom: '22%', insetInlineEnd: 10, fontSize: 20, opacity: 0.8, transform: 'scaleX(-1)' } },
  ] },
  bedroom: { en: 'Bedroom', ar: 'غرفة النوم', chip: '🛏️', bg: 'linear-gradient(180deg,#ede2f8 0%,#cdbce6 100%)', ground: '#a48cc4', floor: 32, amb: [
    { e: '🌙', s: { top: 12, insetInlineStart: 14, fontSize: 20 } },
    { e: '🖼️', s: { top: 12, insetInlineEnd: 16, fontSize: 16 } },
    { e: '🛏️', s: { bottom: '22%', insetInlineEnd: 6, fontSize: 34 } },
    { e: '🧸', s: { bottom: '22%', insetInlineStart: 12, fontSize: 22 } },
  ] },
  night: { en: 'Night', ar: 'ليل', chip: '🌙', bg: 'linear-gradient(180deg,#101d3f 0%,#3a5080 100%)', ground: '#25335a', floor: 24, dark: true, amb: [
    { e: '🌙', s: { top: 12, insetInlineEnd: 16, fontSize: 26 } },
    { e: '⭐', s: { top: 20, insetInlineStart: 18, fontSize: 14, animation: 'sg-twinkle 2.2s ease-in-out infinite' } },
    { e: '✨', s: { top: 40, insetInlineEnd: 46, fontSize: 12, animation: 'sg-twinkle 1.9s ease-in-out 0.5s infinite' } },
    { e: '🏘️', s: { bottom: '20%', insetInlineStart: 8, fontSize: 26, opacity: 0.92 } },
    { e: '🌳', s: { bottom: '20%', insetInlineEnd: 10, fontSize: 22, opacity: 0.9 } },
  ] },
};
const BG_LIST = Object.keys(BACKGROUNDS);

export const CHARS = [
  { id: 'kawkab', en: 'Kawkab', ar: 'كوكب' },
  { id: 'star', en: 'Star', ar: 'ستار' },
  { id: 'noor', en: 'Noor', ar: 'نور' },
  { id: 'rami', en: 'Ramy', ar: 'رامي' },
  { id: 'lola', en: 'Lola', ar: 'لولا' },
];

// `en` is the third-person-singular form ("helps"); `enPl` is the bare/plural
// form used when two or more characters share the action ("help") — English
// verbs need to drop the -s for a plural subject ("Lola & Kawkab help").
export const ACTIONS = [
  { id: 'walk', e: '🚶', en: 'walks', enPl: 'walk', ar: 'يمشي' },
  { id: 'greet', e: '👋', en: 'meets', enPl: 'meet', ar: 'يقابل' },
  { id: 'hug', e: '🤗', en: 'hugs', enPl: 'hug', ar: 'يعانق' },
  { id: 'idea', e: '💡', en: 'gets an idea', enPl: 'get an idea', ar: 'تخطر له فكرة' },
  { id: 'tell', e: '💬', en: 'tells', enPl: 'tell', ar: 'يخبر' },
  { id: 'find', e: '🔍', en: 'discovers', enPl: 'discover', ar: 'يكتشف' },
  { id: 'help', e: '🤝', en: 'helps', enPl: 'help', ar: 'يساعد' },
  { id: 'build', e: '🔨', en: 'builds', enPl: 'build', ar: 'يبني' },
  { id: 'eat', e: '🍔', en: 'eats', enPl: 'eat', ar: 'يأكل' },
  { id: 'cook', e: '🍳', en: 'cooks', enPl: 'cook', ar: 'يطبخ' },
  { id: 'study', e: '📖', en: 'studies', enPl: 'study', ar: 'يدرس' },
  { id: 'read', e: '📕', en: 'reads', enPl: 'read', ar: 'يقرأ' },
  { id: 'ace', e: '💯', en: 'aces the test', enPl: 'ace the test', ar: 'يتفوّق' },
  { id: 'paint', e: '🎨', en: 'paints', enPl: 'paint', ar: 'يرسم' },
  { id: 'plant', e: '🌱', en: 'plants', enPl: 'plant', ar: 'يزرع' },
  { id: 'play', e: '⚽', en: 'plays', enPl: 'play', ar: 'يلعب' },
  { id: 'swim', e: '🏊', en: 'swims', enPl: 'swim', ar: 'يسبح' },
  { id: 'sing', e: '🎤', en: 'sings', enPl: 'sing', ar: 'يغنّي' },
  { id: 'dance', e: '🪩', en: 'dances', enPl: 'dance', ar: 'يرقص' },
  { id: 'fly', e: '🚀', en: 'blasts off', enPl: 'blast off', ar: 'ينطلق' },
  { id: 'win', e: '🏆', en: 'wins', enPl: 'win', ar: 'يفوز' },
  { id: 'gift', e: '🎁', en: 'gives a gift', enPl: 'give a gift', ar: 'يُهدي' },
  { id: 'cheer', e: '🎉', en: 'celebrates', enPl: 'celebrate', ar: 'يحتفل' },
  { id: 'sleep', e: '😴', en: 'sleeps', enPl: 'sleep', ar: 'ينام' },
];

function actionCharAnim(action) {
  return ({
    walk: 'sg-walk 0.5s ease-in-out infinite',
    greet: 'sg-idle 1.1s ease-in-out infinite',
    hug: 'sg-idle 1.4s ease-in-out infinite',
    idea: 'sg-bounce 0.9s ease-in-out infinite',
    tell: 'sg-idle 1.1s ease-in-out infinite',
    find: 'sg-study 1.4s ease-in-out infinite',
    help: 'sg-idle 1.3s ease-in-out infinite',
    build: 'sg-study 1.3s ease-in-out infinite',
    eat: 'sg-eat 0.55s ease-in-out infinite',
    cook: 'sg-study 1.5s ease-in-out infinite',
    study: 'sg-study 1.6s ease-in-out infinite',
    read: 'sg-study 1.8s ease-in-out infinite',
    ace: 'sg-bounce 0.55s ease-in-out infinite',
    paint: 'sg-study 1.4s ease-in-out infinite',
    plant: 'sg-study 1.8s ease-in-out infinite',
    play: 'sg-bounce 0.7s ease-in-out infinite',
    swim: 'sg-sway 0.8s ease-in-out infinite',
    sing: 'sg-bounce 0.6s ease-in-out infinite',
    dance: 'sg-sway 0.9s ease-in-out infinite',
    fly: 'sg-fly 1.3s ease-in-out infinite',
    win: 'sg-bounce 0.55s ease-in-out infinite',
    gift: 'sg-bounce 0.6s ease-in-out infinite',
    cheer: 'sg-bounce 0.5s ease-in-out infinite',
    sleep: 'sg-sleep 2.6s ease-in-out infinite',
  })[action] || 'sg-idle 2.6s ease-in-out infinite';
}
const moodFor = (action) => (action === 'sleep' ? 'tired' : ['dance', 'ace', 'cheer', 'win', 'sing', 'fly', 'gift', 'idea'].includes(action) ? 'proud' : ['study', 'plant', 'read', 'paint', 'cook', 'find', 'build'].includes(action) ? 'focused' : 'ready');

function PropLayer({ action }) {
  const el = (emoji, st, key) => (
    <span key={key} style={{ position: 'absolute', fontSize: 24, lineHeight: 1, pointerEvents: 'none', ...st }}>{emoji}</span>
  );
  switch (action) {
    case 'walk': return el('💨', { insetInlineStart: 0, bottom: 0, fontSize: 16, animation: 'sg-float 1s ease-in-out infinite' });
    case 'greet': return el('👋', { insetInlineEnd: 0, top: 6, animation: 'sg-pop 0.9s ease-in-out infinite' });
    case 'hug': return el('💕', { insetInlineStart: '50%', top: 4, animation: 'sg-rise 1.6s ease-in-out infinite' });
    case 'idea': return [el('💡', { insetInlineStart: '50%', top: -4, transform: 'translateX(-50%)', animation: 'sg-pop 0.8s ease-in-out infinite' }, 'a'), el('✨', { insetInlineEnd: 2, top: 8, fontSize: 14, animation: 'sg-twinkle 1.1s ease-in-out infinite' }, 'b')];
    case 'tell': return el('💬', { insetInlineEnd: 0, top: 4, animation: 'sg-pop 0.9s ease-in-out infinite' });
    case 'find': return [el('🔍', { insetInlineEnd: 0, top: 6, fontSize: 22, animation: 'sg-pop 1s ease-in-out infinite' }, 'a'), el('❗', { insetInlineStart: 2, top: 6, fontSize: 14, animation: 'sg-twinkle 1s ease-in-out infinite' }, 'b')];
    case 'help': return el('🤝', { insetInlineStart: '50%', top: 2, transform: 'translateX(-50%)', animation: 'sg-pop 1s ease-in-out infinite' });
    case 'build': return [el('🔨', { insetInlineEnd: 0, top: 4, animation: 'sg-pop 0.6s ease-in-out infinite' }, 'a'), el('🧱', { insetInlineStart: '50%', bottom: -2, transform: 'translateX(-50%)', fontSize: 18 }, 'b')];
    case 'eat': return el('🍔', { insetInlineEnd: 2, bottom: 2, animation: 'sg-food 0.95s ease-in-out infinite' });
    case 'cook': return [el('🍳', { insetInlineStart: '50%', bottom: -2, transform: 'translateX(-50%)', fontSize: 22 }, 'a'), el('♨️', { insetInlineStart: '50%', top: 8, fontSize: 16, animation: 'sg-steam 1.6s ease-in-out infinite' }, 'b')];
    case 'study': return el('📖', { insetInlineStart: '50%', bottom: -2, transform: 'translateX(-50%)', fontSize: 22 });
    case 'read': return el('📕', { insetInlineStart: '50%', bottom: -2, transform: 'translateX(-50%)', fontSize: 22 });
    case 'ace': return [el('💯', { insetInlineStart: '50%', top: -2, transform: 'translateX(-50%)', animation: 'sg-pop 0.7s ease-in-out infinite' }, 'a'), el('✨', { insetInlineEnd: 2, top: 8, fontSize: 16, animation: 'sg-twinkle 1.2s ease-in-out infinite' }, 'b')];
    case 'paint': return [el('🎨', { insetInlineStart: 0, bottom: 2, fontSize: 22 }, 'a'), el('🖼️', { insetInlineEnd: 0, top: 4, fontSize: 18 }, 'b')];
    case 'plant': return [el('🌰', { insetInlineStart: '50%', top: 4, animation: 'sg-seed 2.2s ease-in-out infinite' }, 'a'), el('🌱', { insetInlineStart: '50%', bottom: -2, transformOrigin: 'bottom center', animation: 'sg-sprout 2.2s ease-in-out infinite' }, 'b')];
    case 'play': return el('⚽', { insetInlineStart: '50%', top: -2, animation: 'sg-ball 0.7s ease-in-out infinite' });
    case 'swim': return [el('🌊', { insetInlineStart: '50%', bottom: -2, transform: 'translateX(-50%)', fontSize: 24 }, 'a'), el('💦', { insetInlineEnd: 2, top: 6, fontSize: 16, animation: 'sg-twinkle 1.1s ease-in-out infinite' }, 'b')];
    case 'sing': return [el('🎤', { insetInlineEnd: 2, bottom: 4, fontSize: 20 }, 'a'), el('🎵', { insetInlineStart: 0, bottom: 16, animation: 'sg-note 1.4s ease-in-out infinite' }, 'b')];
    case 'dance': return [el('🎵', { insetInlineStart: 0, bottom: 18, animation: 'sg-note 1.4s ease-in-out infinite' }, 'a'), el('🎶', { insetInlineEnd: 0, bottom: 12, animation: 'sg-note 1.4s ease-in-out 0.7s infinite' }, 'b')];
    case 'fly': return [el('🚀', { insetInlineEnd: 2, bottom: 2, fontSize: 22, animation: 'sg-fly 1.3s ease-in-out infinite' }, 'a'), el('✨', { insetInlineStart: 2, top: 8, fontSize: 14, animation: 'sg-twinkle 1.2s ease-in-out infinite' }, 'b')];
    case 'win': return el('🏆', { insetInlineStart: '50%', top: -2, transform: 'translateX(-50%)', animation: 'sg-pop 0.8s ease-in-out infinite' });
    case 'gift': return [el('🎁', { insetInlineStart: '50%', top: 0, transform: 'translateX(-50%)', animation: 'sg-pop 0.7s ease-in-out infinite' }, 'a'), el('✨', { insetInlineEnd: 2, top: 10, fontSize: 14, animation: 'sg-twinkle 1.2s ease-in-out infinite' }, 'b')];
    case 'cheer': return [el('🎉', { insetInlineStart: 0, bottom: 14, animation: 'sg-rise 1.3s ease-in-out infinite' }, 'a'), el('🎊', { insetInlineEnd: 0, bottom: 10, animation: 'sg-rise 1.3s ease-in-out 0.6s infinite' }, 'b')];
    case 'sleep': return [el('💤', { insetInlineEnd: 6, top: 2, animation: 'sg-float 2.4s ease-in-out infinite' }, 'a'), el('💤', { insetInlineEnd: 20, top: 10, fontSize: 18, animation: 'sg-float 2.4s ease-in-out 1.1s infinite' }, 'b')];
    default: return null;
  }
}

export function CharacterArt({ id, size, mood = 'ready' }) {
  if (id === 'star') {
    return (
      <span style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
        <CosmosCharacter size={size} mood={mood} glow fur="#3a1430" accent="#ff8fc6" />
        <span style={{ position: 'absolute', top: '12%', insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: size * 0.2, pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }}>⭐</span>
      </span>
    );
  }
  if (id === 'noor') return <FoxCharacter size={size} mood={mood} glow />;
  if (id === 'rami') return <PersonCharacter variant="male" size={size} mood={mood} />;
  if (id === 'lola') return <PersonCharacter variant="female" size={size} mood={mood} />;
  return <CosmosCharacter size={size} mood={mood} glow />;
}

function BgSwatch({ bgId, size = 50 }) {
  const cfg = BACKGROUNDS[bgId];
  return (
    <div style={{ position: 'relative', width: size, height: size * 0.82, borderRadius: 9, overflow: 'hidden', background: cfg.bg, border: '2px solid #cdbfa6' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '24%', background: cfg.ground, opacity: 0.9 }} />
      <span style={{ position: 'absolute', top: 3, insetInlineStart: 5, fontSize: 16 }}><Emoji char={cfg.chip} /></span>
    </div>
  );
}

// Scale a prop's numeric position/size props so a scene reads the same at any
// panel size (px offsets and font sizes shrink together; % offsets pass through).
const SCALE_KEYS = ['top', 'bottom', 'left', 'right', 'insetInlineStart', 'insetInlineEnd', 'fontSize'];
function scaleStyle(s, k) {
  if (k >= 0.999) return s;
  const out = {};
  for (const key in s) {
    const v = s[key];
    out[key] = (typeof v === 'number' && SCALE_KEYS.includes(key)) ? v * k : v;
  }
  return out;
}

export function PanelStage({ panel, size, say }) {
  const cfg = panel.bg ? BACKGROUNDS[panel.bg] : null;
  const big = size > 150;
  const k = Math.max(0.6, Math.min(1, size / 280));
  const chars = panel.chars || [];
  const empty = !panel.bg && chars.length === 0;
  const nC = chars.length;
  const charSize = nC >= 3 ? size * 0.3 : nC === 2 ? size * 0.4 : size * 0.5;
  const charGap = nC >= 3 ? size * 0.012 : nC === 2 ? size * 0.03 : 0;
  const floorPct = cfg ? (cfg.floor || 22) : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size * 0.82, borderRadius: big ? 18 : 13, overflow: 'hidden', background: cfg ? cfg.bg : 'repeating-linear-gradient(45deg,#fbf5ec,#fbf5ec 8px,#f4ecdd 8px,#f4ecdd 16px)', border: `${big ? 3 : 2}px ${empty ? 'dashed' : 'solid'} ${cfg && cfg.dark ? '#3a2c5a' : '#cdbfa6'}`, boxShadow: big ? '5px 5px 0 rgba(26,18,8,0.22)' : '2px 2px 0 rgba(26,18,8,0.16)' }}>
      {cfg && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${floorPct}%`, background: cfg.ground, boxShadow: `inset 0 ${Math.max(2, 3 * k)}px 0 rgba(255,255,255,0.18), inset 0 -40px 40px -30px rgba(0,0,0,0.25)` }} />
      )}
      {cfg && cfg.amb.map((a, i) => (
        <span key={i} style={{ position: 'absolute', lineHeight: 1, pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.18))', ...scaleStyle({ position: 'absolute', lineHeight: 1, ...a.s }, k) }}><Emoji char={a.e} /></span>
      ))}
      {panel.item && (() => {
        const it = typeof panel.item === 'string' ? { e: panel.item } : panel.item;
        const fs = (it.big ? 0.26 : 0.19) * size;
        const pos = it.sky
          ? { top: '14%', insetInlineEnd: '15%' }
          : { bottom: `${Math.max(2, floorPct * 0.28)}%`, insetInlineStart: '13%' };
        return (
          <span style={{ position: 'absolute', ...pos, fontSize: fs, lineHeight: 1, pointerEvents: 'none', filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.22))', animation: it.sky ? 'sg-twinkle 2s ease-in-out infinite' : 'sg-idle 2.6s ease-in-out infinite', transformOrigin: 'center bottom', zIndex: 2 }}><Emoji char={it.e} /></span>
        );
      })()}
      {chars.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${Math.max(1, floorPct * 0.28)}%`, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: charGap, pointerEvents: 'none' }}>
          {chars.map((id, idx) => (
            <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ animation: actionCharAnim(panel.action), transformOrigin: 'center bottom' }}>
                <CharacterArt id={id} size={charSize} mood={moodFor(panel.action)} />
              </div>
              <div style={{ width: charSize * 0.5, height: charSize * 0.09, marginTop: -charSize * 0.03, borderRadius: '50%', background: 'rgba(0,0,0,0.16)', filter: 'blur(1px)' }} />
            </div>
          ))}
        </div>
      )}
      {chars.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: `${Math.max(1, floorPct * 0.28)}%`, height: size * 0.5, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: size * 0.5, height: '100%' }}><PropLayer action={panel.action} /></div>
        </div>
      )}
      {say && big && (
        <div style={{ position: 'absolute', top: 10, insetInlineStart: '50%', transform: 'translateX(-50%)', maxWidth: '90%', animation: 'sg-bubble 0.45s ease-out', zIndex: 3 }}>
          <div style={{ position: 'relative', background: '#fffdf8', border: '2px solid #1a1208', borderRadius: 13, padding: '5px 12px', fontWeight: 800, fontSize: 14, color: '#3a2c18', textAlign: 'center', lineHeight: 1.25, boxShadow: '2px 2px 0 rgba(26,18,8,0.18)' }}>
            {say}
            <span style={{ position: 'absolute', bottom: -7, insetInlineStart: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #1a1208' }} />
          </div>
        </div>
      )}
    </div>
  );
}

const EMPTY = { bg: null, chars: [], action: null };
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function makeStory(n, rng, distract, exclude = []) {
  const byLen = STORIES.filter((s) => s.beats.length === n);
  const pool0 = byLen.length ? byLen : STORIES;
  // Anti-repeat: skip recently played stories when the pool allows it, so a
  // survival / pass-n-play session never replays the same tale back to back.
  const fresh = pool0.filter((s) => !exclude.includes(s.id));
  const src = fresh.length ? fresh : pool0;
  const script = src[Math.floor(rng() * src.length)];
  // Fixed-cast stories name real characters in `who`; generic ones cast H/F at random.
  const fixed = !!script.fixed;
  const cast = shuffleR(CHARS.map((c) => c.id), rng);
  const roleChar = fixed ? {} : { H: cast[0], F: cast[1] };
  // `narr` rides along so the watch captions and reveal recap can tell the
  // actual authored story, not a reconstructed verb phrase.
  const target = script.beats.map((b) => ({ bg: b.bg, chars: fixed ? [...b.who] : b.who.map((r) => roleChar[r]), action: b.action, say: b.say || null, item: b.item || null, narr: b.narr || null }));
  const usedChar = new Set(target.flatMap((p) => p.chars));
  const usedBg = new Set(target.map((p) => p.bg));
  const usedAct = new Set(target.map((p) => p.action));
  const dC = shuffleR(CHARS.map((c) => c.id).filter((c) => !usedChar.has(c)), rng).slice(0, distract);
  const dB = shuffleR(BG_LIST.filter((b) => !usedBg.has(b)), rng).slice(0, distract);
  const dA = shuffleR(ACTIONS.map((a) => a.id).filter((a) => !usedAct.has(a)), rng).slice(0, distract);
  const palChar = new Set([...usedChar, ...dC]);
  const palBg = new Set([...usedBg, ...dB]);
  const palAct = new Set([...usedAct, ...dA]);
  return {
    id: script.id,
    title: script.title || null,
    moral: script.moral || null,
    roleChar,
    target,
    paletteBgs: shuffleR(BG_LIST.filter((b) => palBg.has(b)), rng),
    paletteChars: shuffleR(CHARS.map((c) => c.id).filter((c) => palChar.has(c)), rng),
    paletteActions: shuffleR(ACTIONS.filter((a) => palAct.has(a.id)).map((a) => a.id), rng),
  };
}

// ── difficulty ──
// len = number of acts (panels). Each difficulty tells a longer story; distractor
// pieces and the memorize countdown ramp across the 100 levels. Memo budgets
// assume the player actually READS the narration (~8s a panel) on top of
// memorizing the scenes — the countdown is a ceiling, "Done" skips it early.
const LEVEL_BASE = {
  easy: { len: 4, d0: 0, d1: 2, m0: 55, m1: 44 },
  med: { len: 5, d0: 1, d1: 3, m0: 62, m1: 48 },
  hard: { len: 6, d0: 2, d1: 4, m0: 70, m1: 52 },
};
function levelCfg(diff, level) {
  const b = LEVEL_BASE[diff] || LEVEL_BASE.med;
  const f = (((level || 1) - 1) / 99);
  return { len: b.len, distract: Math.round(b.d0 + (b.d1 - b.d0) * f), memo: Math.round(b.m0 + (b.m1 - b.m0) * f) };
}
function survivalCfg(stage) {
  return { len: Math.min(6, 3 + Math.floor(stage / 2)), distract: Math.min(5, Math.floor(stage / 1.5)), memo: Math.max(30, Math.round(52 - stage * 1.1)) };
}
function passCfgFor() { return { len: 5, distract: 2, memo: 48 }; }

// Fewer columns on phones → bigger, clearer panels (narrow screens go 2-wide from
// 3 panels up — a single row of 3 no longer fits once the rebuildCard's own chrome
// is reserved, see frameSize below).
const gridCols = (n) => {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 460;
  if (n <= 2) return n;
  if (n === 3) return narrow ? 2 : 3;
  if (n === 4) return 2;
  return narrow ? 2 : 3;
};
// Fit rebuild panels to the viewport: bigger cells, fewer columns → larger panels.
// -28 = S.gameBody's own horizontal padding (14px×2, absorbed into its 100% width);
// -28 = rebuildCard's padding+border (10px×2 + 2px×2 — NOT absorbed, since the card
// has no set width, so its chrome adds on top of whatever space gameBody gives it);
// a few extra px of safety margin round out the reservation.
function frameSize(cols) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const avail = Math.min(w, 600) - 28 - 28 - 6;
  const cell = (avail - 12 * (cols - 1)) / cols;
  return Math.max(108, Math.min(230, Math.floor(cell)));
}
// WATCH panel: as big as the phone allows, reserving room for title/caption/controls.
// -36 = S.center's own horizontal padding (18px×2); -44 = watchCard's padding+border
// (20px×2 + 2px×2), same reasoning as frameSize above, plus a few px of safety margin.
const bigSize = () => {
  if (typeof window === 'undefined') return 320;
  const byW = window.innerWidth - 36 - 44 - 6;
  const byH = (window.innerHeight - 356) / 0.82;
  return Math.round(Math.max(220, Math.min(380, byW, byH)));
};

const T = {
  en: {
    title: 'Story Time',
    watchTag: 'Watch & remember', rebuildTag: 'Rebuild the story',
    places: 'Places', characters: 'Characters', actions: 'Actions',
    selectHint: 'Tap a piece, then tap a panel', placing: (x) => `Placing: ${x} — tap a panel`, erasing: 'Eraser — tap a panel to clear',
    needChar: 'Put a character in the panel first', erase: 'Erase',
    check: '✓ Check', perfect: 'Perfect! ✓', score: (n, m) => `${n}/${m} panels correct`, storyWas: 'The story was:',
    next: 'Next ›', prev: '‹ Prev', doneMemo: '✓ Done — rebuild it', cont: 'Continue ›',
    seq: (i, m) => (i === 0 ? 'First,' : i === m - 1 ? 'Finally,' : 'Then,'),
    meets: 'meets', congrats: 'congratulates', hugs: 'hugs', and: ' & ', menu: 'Menu',
  },
  ar: {
    title: 'وقت القصة',
    watchTag: 'شاهد وتذكّر', rebuildTag: 'أعد بناء القصة',
    places: 'الأماكن', characters: 'الشخصيات', actions: 'الأفعال',
    selectHint: 'اختر قطعة ثم اضغط لوحة', placing: (x) => `وضع: ${x} — اضغط لوحة`, erasing: 'ممحاة — اضغط لوحة لمسحها',
    needChar: 'ضع شخصية في اللوحة أولاً', erase: 'مسح',
    check: '✓ تحقّق', perfect: 'ممتاز! ✓', score: (n, m) => `${n}/${m} لوحات صحيحة`, storyWas: 'كانت القصة:',
    next: 'التالي ›', prev: '‹ السابق', doneMemo: '✓ تم — أعد البناء', cont: 'متابعة ›',
    seq: (i, m) => (i === 0 ? 'أولاً،' : i === m - 1 ? 'أخيراً،' : 'ثم،'),
    meets: 'يقابل', congrats: 'يهنّئ', hugs: 'يعانق', and: ' و ', menu: 'القائمة',
  },
};

export function StoryEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, awardFreeRun, cosmos = false }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 5) : 0;
  const nameOf = (id) => { const c = CHARS.find((x) => x.id === id); return c ? (isAr ? c.ar : c.en) : ''; };
  const actWord = (id, plural) => { const a = ACTIONS.find((x) => x.id === id); return a ? (isAr ? a.ar : (plural ? a.enPl : a.en)) : ''; };
  const actEmoji = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? a.e : ''; };

  const stageRef = useRef(0);
  const roundsRef = useRef(0);
  const bestRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppCorrectRef = useRef(0);
  const usedIdsRef = useRef([]); // last few story ids — keeps sessions repeat-free

  const [phase, setPhase] = useState('watch');
  const [story, setStory] = useState(null);
  const [watchIdx, setWatchIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [panels, setPanels] = useState([]);
  const [sel, setSel] = useState(null); // { kind:'bg'|'char'|'action'|'erase', id }
  const [hint, setHint] = useState('');
  const [result, setResult] = useState({ n: 0, m: 0 });

  const len = story ? story.target.length : 0;

  const cfgFor = useCallback(() => {
    if (mode === 'levels') return levelCfg(diff, level);
    if (mode === 'passplay') return passCfgFor();
    return survivalCfg(stageRef.current);
  }, [mode, diff, level]);

  const newRound = useCallback(() => {
    const cfg = cfgFor();
    const st = makeStory(cfg.len, rng, cfg.distract, usedIdsRef.current);
    usedIdsRef.current = [...usedIdsRef.current, st.id].slice(-4);
    setStory(st);
    setPanels(Array(cfg.len).fill(EMPTY));
    setWatchIdx(0);
    setTimeLeft(cfg.memo);
    setResult({ n: 0, m: 0 });
    setSel(null);
    setHint('');
    setPhase('watch');
  }, [cfgFor, rng]);

  useEffect(() => {
    newRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount only
  }, []);

  useEffect(() => {
    if (phase !== 'watch') return undefined;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => { if (phase === 'watch' && timeLeft === 0) setPhase('rebuild'); }, [phase, timeLeft]);

  const fill = useCallback((s) => {
    if (!story) return s;
    const rc = story.roleChar || {};
    return s
      .replace(/\{H\}/g, nameOf(rc.H)).replace(/\{F\}/g, nameOf(rc.F))
      .replace(/\{L\}/g, nameOf('lola')).replace(/\{R\}/g, nameOf('rami')).replace(/\{N\}/g, nameOf('noor'));
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [story, isAr]);
  const resolveSay = useCallback((beat) => (beat.say ? fill(isAr ? beat.say.ar : beat.say.en) : null), [fill, isAr]);
  // The authored story sentence for a beat (falls back to an auto verb phrase).
  const resolveNarr = useCallback((beat) => (beat.narr ? fill(isAr ? beat.narr.ar : beat.narr.en) : null), [fill, isAr]);
  const narrate = useCallback((beat) => {
    const names = beat.chars.map(nameOf);
    if (beat.action === 'greet' && names.length === 2) return `${names[0]} ${t.meets} ${names[1]}`;
    if (beat.action === 'hug' && names.length === 2) return `${names[0]} ${t.hugs} ${names[1]}`;
    if (beat.action === 'cheer' && names.length === 2) return `${names[0]} ${t.congrats} ${names[1]}`;
    return `${names.join(t.and)} ${actWord(beat.action, names.length > 1)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, isAr]);

  // ── press-to-place ──
  const pickSel = (kind, id) => {
    playSfx?.('click');
    setHint('');
    setSel((cur) => (cur && cur.kind === kind && cur.id === id ? null : { kind, id }));
  };
  const applyToPanel = (i) => {
    if (!sel) { setHint(t.selectHint); return; }
    if (sel.kind === 'erase') { setPanels((ps) => ps.map((p, k) => (k === i ? EMPTY : p))); playSfx?.('click'); return; }
    if (sel.kind === 'bg') { setPanels((ps) => ps.map((p, k) => (k === i ? { ...p, bg: sel.id } : p))); playSfx?.('click'); return; }
    if (sel.kind === 'char') {
      setPanels((ps) => ps.map((p, k) => {
        if (k !== i) return p;
        if (p.chars.includes(sel.id)) return { ...p, chars: p.chars.filter((x) => x !== sel.id) }; // toggle off
        return { ...p, chars: [...p.chars, sel.id].slice(-3) };
      }));
      playSfx?.('click');
      return;
    }
    if (sel.kind === 'action') {
      if (panels[i].chars.length === 0) { setHint(t.needChar); return; }
      setPanels((ps) => ps.map((p, k) => (k === i ? { ...p, action: sel.id } : p)));
      playSfx?.('click');
    }
  };

  const filledCount = panels.filter((p) => p.bg && p.chars.length > 0 && p.action).length;
  const allFilled = panels.length === len && filledCount === len;
  const check = () => {
    if (!allFilled) return;
    let n = 0;
    for (let i = 0; i < len; i++) {
      const p = panels[i]; const g = story.target[i];
      if (p.bg === g.bg && p.action === g.action && sameSet(p.chars, g.chars)) n += 1;
    }
    setResult({ n, m: len });
    playSfx?.(n === len ? 'win' : 'error');
    setPhase('reveal');
  };

  const advanceRound = useCallback(() => {
    playSfx?.('click');
    const perfect = result.n === result.m && result.m > 0;
    if (mode === 'levels') { onResult({ won: perfect, score: result.n, summary: t.score(result.n, result.m) }); return; }
    if (mode === 'passplay') {
      ppCorrectRef.current += result.n; ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppCorrectRef.current }); return; }
      newRound(); return;
    }
    roundsRef.current += 1;
    stageRef.current = perfect ? stageRef.current + 1 : Math.max(0, stageRef.current - 1);
    bestRef.current = Math.max(bestRef.current, stageRef.current);
    if (perfect) awardPoints?.(3);
    newRound();
  }, [mode, result, onResult, ppTrials, newRound, t, playSfx, awardPoints]);

  const hudSub = mode === 'levels'
    ? (isAr ? `مستوى ${level}` : `Level ${level}`)
    : mode === 'passplay'
      ? (isAr ? `قصة ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials} · ✓${ppCorrectRef.current}` : `Story ${Math.min(ppDoneRef.current + 1, ppTrials)}/${ppTrials} · ✓${ppCorrectRef.current}`)
      : (isAr ? `قصة ${roundsRef.current + 1} · أفضل ${bestRef.current}` : `Story ${roundsRef.current + 1} · best ${bestRef.current}`);

  if (!story) return <div style={cosmos ? { ...S.root, ...S.cosmosRoot } : S.root} className={cosmos ? 'c3d-embed-root' : undefined} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'} />;
  const fsz = frameSize(gridCols(len));
  const refSize = Math.round(fsz * 0.74);
  const storyTitle = story.title ? (isAr ? story.title.ar : story.title.en) : '';
  const reveal = phase === 'reveal';
  const selLabel = sel ? (sel.kind === 'erase' ? t.erase : sel.kind === 'bg' ? (isAr ? BACKGROUNDS[sel.id].ar : BACKGROUNDS[sel.id].en) : sel.kind === 'char' ? nameOf(sel.id) : `${actEmoji(sel.id)} ${actWord(sel.id)}`) : '';
  const isSel = (kind, id) => sel && sel.kind === kind && sel.id === id;
  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  const cardStyle = cosmos ? { ...S.watchCard, ...S.cosmosCard } : S.watchCard;
  const rebuildStyle = cosmos ? { ...S.rebuildCard, ...S.cosmosCard } : S.rebuildCard;
  const dockStyle = cosmos ? { ...S.dock, ...S.cosmosDock } : S.dock;
  const titleStyle = cosmos ? { ...S.storyTitle, color: '#f0e2c0', textShadow: '0 0 18px rgba(232,172,78,0.45)' } : S.storyTitle;
  const capStyle = cosmos ? { ...S.watchCap, color: 'rgba(240,226,192,0.9)' } : S.watchCap;

  return (
    <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{ANIM_CSS}</style>
      <header className="ct-training-play-header" style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}>
        {!cosmos && (
          <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); if (mode === 'free') awardFreeRun?.('storyGrid', bestRef.current); onExit?.(); }}>‹</button>
        )}
        {cosmos && <div className="ct-training-chrome-spacer" aria-hidden="true" />}
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title" style={cosmos ? { color: '#f0e2c0' } : undefined}>{t.title}</div>
          <div className="ct-training-play-sub" style={cosmos ? { color: 'rgba(240,226,192,0.75)' } : undefined}>{hudSub}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {/* WATCH */}
      {phase === 'watch' && (() => {
        const g = story.target[watchIdx];
        return (
          <div style={S.center}>
            <div style={{ ...cardStyle, ...(cosmos ? { transform: 'perspective(900px) rotateX(3deg)', transformOrigin: 'center top' } : null) }}>
              {storyTitle && <div style={titleStyle}>📖 {storyTitle}</div>}
              <div style={{ ...S.timerChip, ...(timeLeft <= 5 ? S.timerLow : null) }}>⏱ {timeLeft}s · {t.watchTag}</div>
              <div style={{ position: 'relative' }}>
                <span style={S.badge}>{watchIdx + 1}</span>
                <PanelStage panel={g} size={bigSize()} say={resolveSay(g)} />
              </div>
              <div key={watchIdx} style={capStyle}>{resolveNarr(g) || `${t.seq(watchIdx, len)} ${narrate(g)}`}</div>
              <div style={S.watchNav}>
                <button type="button" aria-label={t.prev} style={{ ...S.navArrow, ...(watchIdx === 0 ? S.navOff : null) }} disabled={watchIdx === 0} onClick={() => { playSfx?.('click'); setWatchIdx((w) => Math.max(0, w - 1)); }}>‹</button>
                <div style={S.dots}>{story.target.map((_, i) => (
                  <button key={i} type="button" aria-label={`${i + 1}`} style={{ ...S.dot, ...(i === watchIdx ? S.dotOn : null) }} onClick={() => { playSfx?.('click'); setWatchIdx(i); }} />
                ))}</div>
                <button type="button" aria-label={t.next} style={{ ...S.navArrow, ...(watchIdx >= len - 1 ? S.navOff : null) }} disabled={watchIdx >= len - 1} onClick={() => { playSfx?.('click'); setWatchIdx((w) => Math.min(len - 1, w + 1)); }}>›</button>
              </div>
            </div>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); setPhase('rebuild'); }}>{t.doneMemo}</button>
          </div>
        );
      })()}

      {/* REBUILD / REVEAL */}
      {(phase === 'rebuild' || phase === 'reveal') && (
        <div style={S.gameBody}>
          <div style={rebuildStyle}>
            <div style={S.instr}>{reveal ? (result.n === result.m ? t.perfect : t.score(result.n, result.m)) : (hint || (sel ? (sel.kind === 'erase' ? t.erasing : t.placing(selLabel)) : t.selectHint))}</div>
            <div style={{ ...S.grid, gridTemplateColumns: `repeat(${gridCols(len)}, max-content)` }}>
              {panels.map((p, i) => {
                const g = story.target[i];
                const ok = reveal && p.bg === g.bg && p.action === g.action && sameSet(p.chars, g.chars);
                const bad = reveal && !ok;
                return (
                  <div key={i} style={{ position: 'relative' }} onClick={() => { if (!reveal) applyToPanel(i); }}>
                    <span style={{ ...S.badge, ...(reveal ? { background: ok ? '#2e8b57' : '#d23b3b' } : null) }}>{i + 1}</span>
                    <div style={{ borderRadius: 16, outline: !reveal && sel ? '3px dashed #b9842f' : ok ? '3px solid #2e8b57' : bad ? '3px solid #d23b3b' : 'none', outlineOffset: 2, cursor: !reveal ? 'pointer' : 'default' }}>
                      <PanelStage panel={p} size={fsz} />
                    </div>
                    {!reveal && p.chars.length > 0 && !p.action && <span style={S.tapPlus}>＋</span>}
                  </div>
                );
              })}
            </div>

            {reveal && (
              <>
                <div style={S.storyWas}>{t.storyWas}{storyTitle ? ` “${storyTitle}”` : ''}</div>
                <div style={{ ...S.grid, rowGap: 6, gridTemplateColumns: `repeat(${gridCols(len)}, max-content)` }}>
                  {story.target.map((g, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                      <span style={{ ...S.badge, background: '#2e8b57' }}>{i + 1}</span>
                      <PanelStage panel={g} size={refSize} />
                    </div>
                  ))}
                </div>
                {/* The story read back as prose — full sentences, not fragments. */}
                <div style={S.recap}>
                  {story.target.map((g, i) => (
                    <div key={i} style={S.recapLine}>
                      <span style={S.recapNum}>{i + 1}</span>
                      <span style={S.recapText}>{resolveNarr(g) || `${t.seq(i, len)} ${narrate(g)}`}</span>
                    </div>
                  ))}
                </div>
                {story.moral && <div style={S.moral}>✨ {isAr ? story.moral.ar : story.moral.en}</div>}
              </>
            )}
          </div>
          {reveal && <button type="button" style={S.primary} onClick={advanceRound}>{t.cont}</button>}
        </div>
      )}

      {/* press-to-place board (rebuild only) */}
      {phase === 'rebuild' && (
        <div style={dockStyle}>
          <div style={S.dockHandle} aria-hidden="true" />
          <div style={S.dockInner}>
            <div style={S.dockRow}>
              <span style={S.dockLabel}><span style={S.dockIcon} aria-hidden="true"><Emoji char="📍" /></span>{t.places}</span>
              <div style={S.dockChips}>
                {story.paletteBgs.map((id) => (
                  <button key={id} type="button" style={{ ...S.bgChip, ...(isSel('bg', id) ? S.chipSel : null) }} onClick={() => pickSel('bg', id)}>
                    <BgSwatch bgId={id} size={54} />
                  </button>
                ))}
              </div>
            </div>
            <div style={S.dockDivider} aria-hidden="true" />
            <div style={S.dockRow}>
              <span style={S.dockLabel}><span style={S.dockIcon} aria-hidden="true"><Emoji char="🙂" /></span>{t.characters}</span>
              <div style={S.dockChips}>
                {story.paletteChars.map((id) => (
                  <button key={id} type="button" style={{ ...S.charChip, ...(isSel('char', id) ? S.chipSel : null) }} onClick={() => pickSel('char', id)}>
                    <div style={S.charChipArt}><CharacterArt id={id} size={48} /></div>
                    <span style={S.chipName}>{nameOf(id)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={S.dockDivider} aria-hidden="true" />
            <div style={S.dockRow}>
              <span style={S.dockLabel}><span style={S.dockIcon} aria-hidden="true"><Emoji char="⚡" /></span>{t.actions}</span>
              <div style={S.dockChips}>
                {story.paletteActions.map((id) => (
                  <button key={id} type="button" style={{ ...S.actChip, ...(isSel('action', id) ? S.chipSel : null) }} onClick={() => pickSel('action', id)}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}><Emoji char={actEmoji(id)} /></span>
                    <span style={S.chipName}>{actWord(id)}</span>
                  </button>
                ))}
                <button type="button" style={{ ...S.eraseChip, ...(isSel('erase', 'x') ? S.chipSel : null) }} onClick={() => pickSel('erase', 'x')}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}><Emoji char="🧽" /></span>
                  <span style={S.chipName}>{t.erase}</span>
                </button>
              </div>
            </div>
            <button type="button" style={{ ...S.checkBtn, ...(allFilled ? null : S.primaryOff) }} disabled={!allFilled} onClick={check}>
              {allFilled ? t.check : `${t.check} · ${filledCount}/${len}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoryGridGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  const [view, setView] = useState('shell');
  if (view === 'play3d') {
    return (
      <Suspense fallback={<div className="c3d-root" style={{ display: 'grid', placeItems: 'center', color: '#f0e2c0', background: '#000', minHeight: '100dvh' }}>…</div>}>
        <StoryGrid3DProto isAr={isAr} playSfx={playSfx} onBack={() => setView('shell')}>
          <StoryEngine
            mode="free"
            diff="med"
            level={1}
            seed={null}
            cosmos
            isAr={isAr}
            playSfx={playSfx}
            awardPoints={awardPoints}
            awardFreeRun={awardFreeRun}
            onResult={() => {}}
            onExit={() => {
              awardFreeRun?.('storyGrid', 0);
              setView('shell');
            }}
          />
        </StoryGrid3DProto>
      </Suspense>
    );
  }
  return (
    <ModeShell
      storageKey="mm_memory_storytime"
      scienceId="story-grid"
      title={{ en: 'Story Time', ar: 'وقت القصة' }}
      hints={{
        free: { en: 'Endless · stories grow harder', ar: 'لا ينتهي · قصص أصعب' },
        levels: { en: '3 difficulties · 100 levels each', ar: '٣ صعوبات · ١٠٠ مستوى لكل' },
        pass: { en: 'Same story for all · most panels right wins', ar: 'نفس القصة للجميع · الأكثر صحة يفوز' },
      }}
      diffLabels={{ easy: { en: 'Easy', ar: 'سهل' }, med: { en: 'Medium', ar: 'متوسط' }, hard: { en: 'Hard', ar: 'صعب' } }}
      pass={{ trials: 3, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false, diff: 'med' }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      extraItems={[{
        k: 'proto3d',
        lb: isAr ? 'ثلاثي الأبعاد' : '3D',
        hint: isAr ? 'نفس القصة · بيئة كونية ثلاثية الأبعاد' : 'Same story · cosmos 3D stage',
        on: () => setView('play3d'),
        icoImg: planetIconUrl('memory'),
      }]}
      renderEngine={(p) => (
        <StoryEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} awardFreeRun={awardFreeRun} />
      )}
    />
  );
}

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: 'var(--color-training-ink, #2d2d2d)', fontFamily: "'Outfit', system-ui, sans-serif" },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  cosmosCard: {
    background: 'rgba(12,10,8,0.72)',
    border: '1px solid rgba(232,172,78,0.4)',
    boxShadow: '0 0 28px rgba(232,172,78,0.18), 0 12px 32px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  cosmosDock: {
    background: 'linear-gradient(180deg, rgba(18,14,10,0.92), rgba(8,6,4,0.96))',
    borderTop: '1px solid rgba(232,172,78,0.35)',
    boxShadow: '0 -8px 28px rgba(0,0,0,0.45)',
  },
  center: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 14, padding: '10px 18px 24px', overflowY: 'auto' },
  watchCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 22, padding: '18px 20px 20px', maxWidth: '100%', boxShadow: '4px 4px 0 rgba(26,18,8,0.1)' },
  storyTitle: { fontFamily: "'Bangers', 'Outfit', system-ui, sans-serif", fontSize: 24, letterSpacing: 0.5, color: '#3a2c18', textAlign: 'center', lineHeight: 1.1, padding: '0 8px', textShadow: '1px 1px 0 rgba(255,255,255,0.6)' },
  watchCap: { fontWeight: 600, fontSize: 15, color: '#4a3c28', textAlign: 'center', animation: 'sg-bubble 0.4s ease-out', minHeight: 66, width: '100%', maxWidth: 440, lineHeight: 1.5, padding: '0 8px', overflowWrap: 'break-word', flexShrink: 0 },
  timerChip: { fontWeight: 900, fontSize: 14, color: '#7a5a1e', background: '#fff1d8', borderWidth: 2, borderStyle: 'solid', borderColor: '#e3c489', borderRadius: 999, padding: '4px 14px' },
  timerLow: { color: '#b53b2f', background: '#ffe2dc', borderColor: '#e8a89c' },
  watchNav: { display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  navArrow: { width: 44, height: 44, borderRadius: '50%', border: '2px solid #1a1208', background: '#fffdf8', fontWeight: 900, fontSize: 24, lineHeight: 1, cursor: 'pointer', color: '#2d2210', boxShadow: '2px 2px 0 #1a1208', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navOff: { opacity: 0.32, boxShadow: 'none', cursor: 'default' },
  dots: { display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 220 },
  dot: { width: 11, height: 11, borderRadius: '50%', border: 'none', background: '#d8cab4', cursor: 'pointer', padding: 0, transition: 'transform 0.12s, background 0.12s' },
  dotOn: { background: '#b9842f', transform: 'scale(1.4)' },
  gameBody: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 12, padding: '10px 14px 16px', overflowY: 'auto' },
  rebuildCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: '#fffdf8', border: '2px solid #e3d6c4', borderRadius: 22, padding: '16px 10px 18px', maxWidth: '100%', boxShadow: '4px 4px 0 rgba(26,18,8,0.1)' },
  instr: { fontWeight: 800, fontSize: 13.5, color: '#5a4a32', textAlign: 'center', padding: '7px 16px', background: '#fff8ec', border: '2px solid #e3c489', borderRadius: 999, maxWidth: '94%' },
  grid: { display: 'grid', gap: 14, justifyContent: 'center', justifyItems: 'center' },
  recap: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480, textAlign: 'start', padding: '0 6px' },
  recapLine: { display: 'flex', gap: 9, alignItems: 'flex-start' },
  recapNum: { flex: '0 0 auto', width: 20, height: 20, borderRadius: '50%', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  recapText: { fontSize: 12.5, fontWeight: 600, color: '#4a3c28', lineHeight: 1.55, overflowWrap: 'break-word', minWidth: 0 },
  moral: { fontWeight: 800, fontSize: 13.5, color: '#7a5a1e', background: '#fff8ec', border: '2px solid #e3c489', borderRadius: 14, padding: '9px 16px', textAlign: 'center', maxWidth: '96%', lineHeight: 1.55, marginTop: 2 },
  badge: { position: 'absolute', top: -8, insetInlineStart: -8, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8' },
  tapPlus: { position: 'absolute', bottom: 4, insetInlineEnd: 4, width: 22, height: 22, borderRadius: '50%', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8', pointerEvents: 'none' },
  storyWas: { fontWeight: 800, fontSize: 13, color: '#2e8b57', marginTop: 6 },
  // press-to-place board (builder tray)
  dock: { flex: '0 0 auto', background: 'linear-gradient(180deg,#fffdf8 0%,#fff6ea 100%)', borderTop: '2px solid #e3d6c4', borderRadius: '20px 20px 0 0', padding: '6px 14px max(12px, env(safe-area-inset-bottom))', boxShadow: '0 -6px 20px rgba(26,18,8,0.1)' },
  dockHandle: { width: 44, height: 5, borderRadius: 999, background: '#e3d6c4', margin: '0 auto 2px' },
  dockInner: { width: '100%', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 9 },
  dockRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dockLabel: { flex: '0 0 66px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 900, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.4 },
  dockIcon: { fontSize: 14, lineHeight: 1 },
  dockChips: { display: 'flex', gap: 7, flexWrap: 'nowrap', overflowX: 'auto', flex: 1, paddingBottom: 3, scrollbarWidth: 'none' },
  dockDivider: { height: 1, background: '#ece2d2' },
  bgChip: { flex: '0 0 auto', padding: 4, borderRadius: 13, borderWidth: 2, borderStyle: 'solid', borderColor: '#e3d6c4', background: '#fff', cursor: 'pointer', lineHeight: 0 },
  charChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '3px 7px 4px', borderRadius: 13, borderWidth: 2, borderStyle: 'solid', borderColor: '#e3d6c4', background: '#fff', cursor: 'pointer' },
  charChipArt: { width: 50, height: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' },
  actChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 10px', borderRadius: 13, borderWidth: 2, borderStyle: 'solid', borderColor: '#e3d6c4', background: '#fff', cursor: 'pointer', minWidth: 58 },
  eraseChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 10px', borderRadius: 13, borderWidth: 2, borderStyle: 'solid', borderColor: '#d8c4c0', background: '#fff6f4', cursor: 'pointer', minWidth: 58 },
  chipName: { fontSize: 10.5, fontWeight: 800, color: '#5a4a32', whiteSpace: 'nowrap' },
  chipSel: { borderColor: '#b9842f', background: '#fff1d8', boxShadow: '0 0 0 3px rgba(185,132,47,0.32)', transform: 'translateY(-2px)' },
  checkBtn: { alignSelf: 'stretch', marginTop: 3, padding: '13px 20px', borderRadius: 15, borderWidth: 3, borderStyle: 'solid', borderColor: '#1a1208', background: 'linear-gradient(180deg,#38a866,#2e8b57)', color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 0.5, cursor: 'pointer', boxShadow: '4px 4px 0 #1a1208' },
  primary: { padding: '11px 22px', borderRadius: 14, borderWidth: 2, borderStyle: 'solid', borderColor: '#1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  primaryOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default' },
};
