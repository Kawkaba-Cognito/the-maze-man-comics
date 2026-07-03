import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import CosmosCharacter from '../../../../../character/CosmosCharacter';
import FoxCharacter from '../../../../../character/FoxCharacter';
import PersonCharacter from '../../../../../character/PersonCharacter';

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
 * Cast: Kawkab, Star, Noor (fox), Rami (boy), Lola (girl).
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
  { id: 'rami', en: 'Rami', ar: 'رامي' },
  { id: 'lola', en: 'Lola', ar: 'لولا' },
];

export const ACTIONS = [
  { id: 'walk', e: '🚶', en: 'walks', ar: 'يمشي' },
  { id: 'greet', e: '👋', en: 'meets', ar: 'يقابل' },
  { id: 'hug', e: '🤗', en: 'hugs', ar: 'يعانق' },
  { id: 'idea', e: '💡', en: 'gets an idea', ar: 'تخطر له فكرة' },
  { id: 'tell', e: '💬', en: 'tells', ar: 'يخبر' },
  { id: 'find', e: '🔍', en: 'discovers', ar: 'يكتشف' },
  { id: 'help', e: '🤝', en: 'helps', ar: 'يساعد' },
  { id: 'build', e: '🔨', en: 'builds', ar: 'يبني' },
  { id: 'eat', e: '🍔', en: 'eats', ar: 'يأكل' },
  { id: 'cook', e: '🍳', en: 'cooks', ar: 'يطبخ' },
  { id: 'study', e: '📖', en: 'studies', ar: 'يدرس' },
  { id: 'read', e: '📕', en: 'reads', ar: 'يقرأ' },
  { id: 'ace', e: '💯', en: 'aces the test', ar: 'يتفوّق' },
  { id: 'paint', e: '🎨', en: 'paints', ar: 'يرسم' },
  { id: 'plant', e: '🌱', en: 'plants', ar: 'يزرع' },
  { id: 'play', e: '⚽', en: 'plays', ar: 'يلعب' },
  { id: 'swim', e: '🏊', en: 'swims', ar: 'يسبح' },
  { id: 'sing', e: '🎤', en: 'sings', ar: 'يغنّي' },
  { id: 'dance', e: '🪩', en: 'dances', ar: 'يرقص' },
  { id: 'fly', e: '🚀', en: 'blasts off', ar: 'ينطلق' },
  { id: 'win', e: '🏆', en: 'wins', ar: 'يفوز' },
  { id: 'gift', e: '🎁', en: 'gives a gift', ar: 'يُهدي' },
  { id: 'cheer', e: '🎉', en: 'celebrates', ar: 'يحتفل' },
  { id: 'sleep', e: '😴', en: 'sleeps', ar: 'ينام' },
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
      <span style={{ position: 'absolute', top: 3, insetInlineStart: 5, fontSize: 16 }}>{cfg.chip}</span>
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
        <span key={i} style={{ position: 'absolute', lineHeight: 1, pointerEvents: 'none', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.18))', ...scaleStyle({ position: 'absolute', lineHeight: 1, ...a.s }, k) }}>{a.e}</span>
      ))}
      {panel.item && (() => {
        const it = typeof panel.item === 'string' ? { e: panel.item } : panel.item;
        const fs = (it.big ? 0.26 : 0.19) * size;
        const pos = it.sky
          ? { top: '14%', insetInlineEnd: '15%' }
          : { bottom: `${Math.max(2, floorPct * 0.28)}%`, insetInlineStart: '13%' };
        return (
          <span style={{ position: 'absolute', ...pos, fontSize: fs, lineHeight: 1, pointerEvents: 'none', filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.22))', animation: it.sky ? 'sg-twinkle 2s ease-in-out infinite' : 'sg-idle 2.6s ease-in-out infinite', transformOrigin: 'center bottom', zIndex: 2 }}>{it.e}</span>
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

// ── AUTHORED STORIES — real little tales with a plot (cause → effect → payoff).
// Roles 'H' (hero) / 'F' (friend) are cast with real characters at runtime;
// {H}/{F} in `narr` (the narration sentence) and `say` (dialogue) resolve to
// names. The `action`/`bg`/`who` are what the player rebuilds; `narr` is the
// story it tells while watching. Themes: friendship, learning, kindness,
// courage, creativity, sharing. No religion, nothing harmful, all ages.
// Each story is ONE flowing tale (title + beginning→middle→end). The `narr`
// lines are written to read as a continuous paragraph when played in order —
// connectives ("So… Then… But… In the end…") carry you from panel to panel, so
// it never feels like disconnected words. {H}=hero, {F}=friend (cast at runtime).
const STORIES = [
  // ── 3 acts (survival warm-up) ──
  { id: 'star-soup', fixed: true, title: { en: 'A Star in the Soup', ar: 'نجمة في الحساء' }, beats: [
    { bg: 'kitchen', who: ['lola', 'rami'], action: 'cook', item: '⭐', narr: { en: '{L} was stirring the dinner soup when — PLOP! — a tiny star fell in through the window and landed right in the pot.', ar: 'كانت {L} تُحرّك حساء العشاء حين — بلوب! — سقطت نجمة صغيرة من النافذة في القِدر مباشرةً.' }, say: { en: 'Did the soup just twinkle?', ar: 'هل تلألأ الحساء للتوّ؟' } },
    { bg: 'kitchen', who: ['rami', 'noor'], action: 'find', item: '⭐', narr: { en: 'In poked {N} the fox, counting on her paws — one of her little sky-stars had slipped out for a warm swim!', ar: 'أطلّت {N} الثعلبة برأسها تعدّ على أصابعها — لقد تسلّلت إحدى نجومها الصغيرة لتسبح في الدفء!' }, say: { en: 'There you are, cheeky thing!', ar: 'ها أنتِ ذي أيتها المشاغبة!' } },
    { bg: 'night', who: ['lola', 'rami', 'noor'], action: 'cheer', item: { e: '⭐', sky: true }, narr: { en: 'They fished it out with a ladle, and {N} flicked it back up into the sky, where it winked a warm, soup-scented wink.', ar: 'أخرجاها بالمغرفة، فأعادتها {N} إلى السماء برمية، فغمزت غمزةً دافئة تفوح منها رائحة الحساء.' }, say: { en: 'It smells like dinner now!', ar: 'صارت رائحتها كالعشاء!' } },
  ] },
  { id: 'new-puppy', title: { en: 'The New Puppy', ar: 'الجرو الجديد' }, beats: [
    { bg: 'home', who: ['H'], action: 'gift', item: '🐶', narr: { en: 'On {H}’s birthday, a wriggly little puppy popped its head right out of a big wrapped box!', ar: 'في عيد ميلاد {H}، أطلّ جروٌ صغير مرِح برأسه من صندوق كبير ملفوف بالهدايا!' }, say: { en: 'A puppy — for me?', ar: 'جرو — لي أنا؟' } },
    { bg: 'park', who: ['H', 'F'], action: 'play', item: '🐶', narr: { en: '{H} and {F} took the puppy to the park, where it chased its own tail in happy little circles.', ar: 'أخذ {H} و{F} الجرو إلى المنتزه، فراح يطارد ذيله في دوائر صغيرة سعيدة.' } },
    { bg: 'home', who: ['H'], action: 'sleep', item: '🐶', narr: { en: 'Worn out from all the fun, the puppy curled up in {H}’s lap and fell fast asleep.', ar: 'وقد أنهكه اللعب، تكوّر الجرو في حضن {H} وغفا سريعاً.' }, say: { en: 'Goodnight, little one.', ar: 'تصبح على خير يا صغيري.' } },
  ] },
  { id: 'sleepy-sun', fixed: true, title: { en: 'The Sleepy Sun', ar: 'الشمس النعسانة' }, beats: [
    { bg: 'bedroom', who: ['lola', 'rami'], action: 'find', item: '☁️', narr: { en: 'One morning the sky stayed dark far too long — {L} and {R} peeked out to find the sun still fast asleep behind a cloud!', ar: 'ذات صباح بقيت السماء مظلمة وقتاً طويلاً — أطلّ {L} و{R} فوجدا الشمس لا تزال نائمة خلف غيمة!' }, say: { en: 'Wake up, sun!', ar: 'استيقظي يا شمس!' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'tell', item: '⏰', narr: { en: '{N} yawned in holding a tiny alarm clock — she’d quite forgotten to wind the sun up the night before.', ar: 'جاءت {N} متثائبةً تحمل منبّهاً صغيراً — لقد نسيت تماماً أن تُدير الشمس في الليلة السابقة.' }, say: { en: 'It does love a lie-in.', ar: 'إنها تحبّ النوم كثيراً.' } },
    { bg: 'garden', who: ['lola', 'rami', 'noor'], action: 'sing', item: { e: '☀️', sky: true }, narr: { en: 'So the three sang the brightest, silliest wake-up song they knew, until the sun giggled and rose, warm and golden.', ar: 'فغنّى الثلاثة أبهج وأطرف أغنية إيقاظ يعرفونها، حتى ضحكت الشمس وأشرقت دافئةً ذهبية.' }, say: { en: 'Good morning, sunshine!', ar: 'صباح الخير يا شمس!' } },
  ] },
  { id: 'lost-kitten', title: { en: 'The Lost Kitten', ar: 'القطة التائهة' }, beats: [
    { bg: 'street', who: ['H'], action: 'find', item: '🐱', narr: { en: 'One quiet evening, {H} heard a tiny "meow" and stopped to look. Peeking under a parked car, {H} found a little kitten, all alone and shivering.', ar: 'في مساءٍ هادئ، سمع {H} مواءً خافتاً فتوقّف لينظر. وحين نظر تحت سيارة متوقّفة، وجد قطة صغيرة وحيدة ترتجف.' }, say: { en: 'Are you lost, little one?', ar: 'هل أنتِ تائهة يا صغيرة؟' } },
    { bg: 'street', who: ['H', 'F'], action: 'help', item: '🐱', narr: { en: 'The kitten was far too scared to move, so {F} crouched down and held out a gentle hand until, slowly, it crept out.', ar: 'كانت القطة خائفة جداً لا تتحرّك، فجلس {F} وأمدّ يده بلطف حتى خرجت ببطء.' } },
    { bg: 'home', who: ['H', 'F'], action: 'hug', item: '🐱', narr: { en: 'They carried it home and wrapped it snugly in a warm towel. At last it stopped shaking — and began to purr happily in their arms.', ar: 'حملاها إلى البيت ولفّاها بمنشفة دافئة. وأخيراً توقّفت عن الارتجاف وبدأت تخرخر بسعادة بين ذراعيهما.' }, say: { en: 'You’re safe now!', ar: 'أنتِ بأمان الآن!' } },
  ] },
  { id: 'pancake-tower', title: { en: 'Breakfast Surprise', ar: 'مفاجأة الفطور' }, beats: [
    { bg: 'kitchen', who: ['H'], action: 'cook', narr: { en: 'Early one morning, {H} crept into the quiet kitchen and flipped fluffy pancakes into a tall, golden, wobbly tower.', ar: 'في صباح باكر، تسلّل {H} إلى المطبخ الهادئ وقلَب فطائر هشّة حتى صار برجٌ ذهبيّ عالٍ يتمايل.' }, say: { en: 'One more on top!', ar: 'واحدة أخرى في الأعلى!' } },
    { bg: 'home', who: ['H', 'F'], action: 'gift', narr: { en: 'Then, balancing the plate carefully, {H} tiptoed over to surprise {F}, who was still curled up and half-asleep.', ar: 'ثم حمَل الطبق بحذر وتسلّل على أطراف أصابعه ليفاجئ {F} الذي كان لا يزال نصف نائم.' }, say: { en: 'I made these for you!', ar: 'حضّرتها لك!' } },
    { bg: 'home', who: ['H', 'F'], action: 'eat', narr: { en: 'Side by side, the two friends ate every last bite, laughing as they licked the sweet syrup off their forks.', ar: 'وجنباً إلى جنب، أكل الصديقان كل لقمة وهما يضحكان ويلعقان الشراب الحلو عن الشوكتين.' } },
  ] },
  { id: 'winning-goal', title: { en: 'The Winning Goal', ar: 'هدف الفوز' }, beats: [
    { bg: 'park', who: ['H', 'F'], action: 'play', narr: { en: 'It was the big match, and the crowd roared as {H} and {F} passed the ball swiftly back and forth across the grass.', ar: 'كانت المباراة الكبيرة، وضجّ الجمهور بينما تبادل {H} و{F} الكرة بسرعة فوق العشب.' } },
    { bg: 'park', who: ['H'], action: 'win', narr: { en: 'Then, in the very last minute, {H} swung one huge kick and blasted the ball into the net for the winning goal!', ar: 'ثم، في الدقيقة الأخيرة تماماً، سدّد {H} ركلة قوية أطلقت الكرة إلى الشباك محرزاً هدف الفوز!' }, say: { en: 'Goooal!', ar: 'هدف!' } },
    { bg: 'park', who: ['H', 'F'], action: 'cheer', narr: { en: 'The whole team came sprinting over, lifting {H} high onto their shoulders, cheering and laughing together.', ar: 'فجاء الفريق كله راكضاً يرفع {H} عالياً على الأكتاف، يهتفون ويضحكون معاً.' } },
  ] },

  // ── 4 acts (easy) ──
  { id: 'runaway-wind', fixed: true, title: { en: 'The Runaway Wind', ar: 'الريح الهاربة' }, beats: [
    { bg: 'garden', who: ['lola', 'rami'], action: 'play', item: '🪁', narr: { en: 'It was the perfect day to fly a kite — but the air was still as a held breath, and {R}’s kite just flopped onto the grass.', ar: 'كان يوماً مثالياً لتطيير الطائرة الورقية — لكن الهواء كان ساكناً كنفَسٍ محبوس، فسقطت طائرة {R} على العشب.' }, say: { en: 'Fly, please?', ar: 'طِيري، أرجوك؟' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'tell', item: '🪁', narr: { en: '{N} padded up, looking sheepish — she’d let the wind slip out of her tail again, and now it was hiding somewhere in town.', ar: 'تهادت {N} نحوهما وهي محرجة — لقد أفلتت الريح من ذيلها من جديد، وها هي تختبئ في مكانٍ ما في البلدة.' }, say: { en: 'It loves hide-and-seek!', ar: 'إنها تعشق الغميضة!' } },
    { bg: 'street', who: ['lola', 'rami', 'noor'], action: 'find', narr: { en: 'So they chased the giggling breeze past flapping laundry and spinning weather-vanes, until {L} finally cornered it in a chimney.', ar: 'فطاردوا النسيم الضاحك بين الغسيل المرفرف ودوّارات الرياح، حتى حاصرته {L} أخيراً في مدخنة.' }, say: { en: 'Gotcha, sneaky draft!', ar: 'أمسكتك أيها النسيم المتسلّل!' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'cheer', item: { e: '🪁', sky: true }, narr: { en: '{N} coaxed the wind back home, and — whoosh! — {R}’s kite leapt up and danced high above the rooftops.', ar: 'أعادت {N} الريح إلى بيتها، و— هووش! — قفزت طائرة {R} عالياً ترقص فوق السطوح.' }, say: { en: 'Best day ever!', ar: 'أفضل يوم على الإطلاق!' } },
  ] },
  { id: 'runaway-shadow', fixed: true, title: { en: 'Rami’s Runaway Shadow', ar: 'ظلّ رامي الهارب' }, beats: [
    { bg: 'park', who: ['lola', 'rami'], action: 'play', narr: { en: 'On a bright afternoon, {R} watched his own shadow yawn, stretch, then peel right off the ground and scamper away!', ar: 'في عصرٍ مشرق، شاهد {R} ظلّه يتثاءب، ويتمطّى، ثم ينسلخ عن الأرض ويهرب راكضاً!' }, say: { en: 'Hey — come back!', ar: 'مهلاً — عُد إلى هنا!' } },
    { bg: 'park', who: ['rami', 'noor'], action: 'greet', narr: { en: '{N} trotted over, quite unsurprised — bored shadows wander off all the time, she said, especially the playful ones.', ar: 'جاءت {N} مهرولةً غير مندهشة — فالظلال المملّة تهيم كثيراً، كما قالت، خاصةً المرحة منها.' }, say: { en: 'Yours is a real trickster!', ar: 'ظلّك مشاغبٌ حقيقي!' } },
    { bg: 'street', who: ['lola', 'rami', 'noor'], action: 'find', narr: { en: 'They chased its dark, dancing shape as it slid up walls and swung from lampposts, having the time of its life.', ar: 'طاردوا شكله الداكن الراقص وهو ينزلق على الجدران ويتأرجح من الأعمدة، مستمتعاً بوقته.' }, say: { en: 'It’s faster than you, {R}!', ar: 'إنه أسرع منك يا {R}!' } },
    { bg: 'park', who: ['lola', 'rami'], action: 'dance', narr: { en: 'At last they caught it mid-twirl, and {R} promised to take it dancing more often — so it stitched itself back to his heels.', ar: 'وأخيراً أمسكاه في منتصف دورانه، فوعده {R} بأن يأخذه للرقص أكثر — فالتصق من جديد بكعبيه.' }, say: { en: 'Deal, shadow. Deal.', ar: 'اتفقنا أيها الظلّ. اتفقنا.' } },
  ] },
  { id: 'surprise-party', title: { en: 'The Surprise Party', ar: 'حفلة المفاجأة' }, beats: [
    { bg: 'kitchen', who: ['H'], action: 'cook', item: '🎂', narr: { en: '{H} wanted to throw {F} the best surprise ever, so first {H} secretly baked a giant chocolate cake.', ar: 'أراد {H} أن يقيم ل{F} أجمل مفاجأة، فبدأ سرّاً بخبز كعكة شوكولاتة عملاقة.' }, say: { en: 'Don’t tell {F}!', ar: 'لا تخبروا {F}!' } },
    { bg: 'home', who: ['H'], action: 'build', item: '🎈', narr: { en: 'Then {H} hung balloons and streamers everywhere and quickly hid behind the sofa, giggling.', ar: 'ثم علّق {H} البالونات والأشرطة في كل مكان واختبأ بسرعة خلف الأريكة يضحك.' } },
    { bg: 'home', who: ['H', 'F'], action: 'cheer', narr: { en: 'The moment {F} opened the door — SURPRISE! — everyone jumped out laughing and cheering.', ar: 'وما إن فتح {F} الباب — مفاجأة! — حتى قفز الجميع ضاحكين هاتفين.' }, say: { en: 'Happy birthday, {F}!', ar: 'عيد ميلاد سعيد يا {F}!' } },
    { bg: 'home', who: ['H', 'F'], action: 'gift', narr: { en: '{F} was overjoyed, and hugged {H} tight for planning the whole wonderful surprise.', ar: 'غمر الفرحُ {F}، فعانق {H} بقوة لأنه دبّر كل هذه المفاجأة الرائعة.' }, say: { en: 'You did all this?', ar: 'أنت دبّرت كل هذا؟' } },
  ] },
  { id: 'shy-rain', fixed: true, title: { en: 'The Shy Little Rain', ar: 'المطر الخجول' }, beats: [
    { bg: 'garden', who: ['lola', 'rami'], action: 'plant', item: '🌱', narr: { en: 'The garden was thirsty and droopy — the little seeds {L} and {R} had planted just wouldn’t grow without rain.', ar: 'كانت الحديقة عطشى ذابلة — والبذور الصغيرة التي زرعها {L} و{R} لم تكن لتنمو دون مطر.' }, say: { en: 'Please rain soon!', ar: 'لينزل المطر قريباً!' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'tell', item: '☁️', narr: { en: '{N} drifted up tugging a grumbly grey cloud on a leash — the little rain inside was simply too shy to fall.', ar: 'جاءت {N} تجرّ غيمة رمادية عابسة برباط — فالمطر الصغير في داخلها كان خجولاً جداً لا يجرؤ على النزول.' }, say: { en: 'Come on, don’t be shy!', ar: 'هيا، لا تخجل!' } },
    { bg: 'garden', who: ['lola', 'rami', 'noor'], action: 'dance', item: { e: '🌧️', sky: true }, narr: { en: 'So they clapped and stomped a happy puddle-dance until the shy cloud finally laughed — and let the rain tumble down!', ar: 'فصفّقوا ورقصوا رقصة البِرَك المرحة حتى ضحكت الغيمة الخجولة أخيراً — وأطلقت المطر يتساقط!' } },
    { bg: 'garden', who: ['lola', 'rami'], action: 'cheer', item: { e: '🌈', sky: true }, narr: { en: 'By morning the garden had burst green and bright, and {R} splashed happily in every single puddle.', ar: 'ومع الصباح تفتّحت الحديقة خضراء زاهية، وراح {R} يقفز فرحاً في كل بِركة.' }, say: { en: 'Best puddles ever!', ar: 'أروع البِرَك على الإطلاق!' } },
  ] },
  { id: 'summer-snow', fixed: true, title: { en: 'Snow in Summer', ar: 'ثلجٌ في الصيف' }, beats: [
    { bg: 'park', who: ['lola', 'rami'], action: 'play', item: '❄️', narr: { en: 'It was the hottest day of summer when {R} felt something cold land on his nose — a snowflake, in July!', ar: 'كان أحرّ أيام الصيف حين شعر {R} بشيء بارد يحطّ على أنفه — ندفة ثلج، في تمّوز!' }, say: { en: 'Is that… snow?', ar: 'هل هذا… ثلج؟' } },
    { bg: 'park', who: ['rami', 'noor'], action: 'greet', item: '❄️', narr: { en: '{N} trotted up sneezing sparkly snowflakes — she’d caught a tickly little winter cold right in the middle of summer.', ar: 'جاءت {N} مهرولةً تعطس ندفاتٍ لامعة — فقد أصابها زكام شتويّ صغير في عزّ الصيف.' }, say: { en: 'Ah… ah… achoo!', ar: 'آه… آه… أبتشي!' } },
    { bg: 'park', who: ['lola', 'rami', 'noor'], action: 'build', item: '⛄', narr: { en: 'Delighted, the three scooped up the fluffy summer snow and built the roundest, coolest snowman on the whole street.', ar: 'وفي فرح، جمع الثلاثة الثلج الصيفيّ الناعم وبنوا أبرد وأكمل رجل ثلج في الشارع كله.' } },
    { bg: 'park', who: ['lola', 'rami', 'noor'], action: 'cheer', item: '⛄', narr: { en: 'Then, with one last happy sneeze from {N}, the snow melted into a giggling puddle, and warm summer returned.', ar: 'ثم، بعطسة سعيدة أخيرة من {N}، ذاب الثلج إلى بِركة ضاحكة، وعاد الصيف الدافئ.' }, say: { en: 'Bless you, {N}!', ar: 'رحمكِ الله يا {N}!' } },
  ] },
  { id: 'spelling-bee', title: { en: 'The Spelling Bee', ar: 'مسابقة الإملاء' }, beats: [
    { bg: 'bedroom', who: ['H'], action: 'read', narr: { en: 'The class spelling bee was tomorrow, so {H} practised the trickiest, longest words late into the night.', ar: 'مسابقة الإملاء غداً، فتدرّب {H} على أصعب الكلمات وأطولها حتى وقت متأخر من الليل.' }, say: { en: 'Just one more word…', ar: 'كلمة أخيرة فقط…' } },
    { bg: 'home', who: ['H', 'F'], action: 'help', narr: { en: '{F} quizzed {H} word after word, cheering happily at every single one they got right.', ar: 'راح {F} يختبر {H} كلمةً بعد كلمة، ويهتف فرحاً مع كل إجابة صحيحة.' } },
    { bg: 'classroom', who: ['H'], action: 'tell', narr: { en: 'On the big day, {H} stood up in front of everyone, took a slow breath, and spelled the hardest word perfectly.', ar: 'وفي اليوم الكبير، وقف {H} أمام الجميع، وأخذ نفساً هادئاً، وتهجّى أصعب كلمة بإتقان.' }, say: { en: '…correct!', ar: '…صحيح!' } },
    { bg: 'classroom', who: ['H', 'F'], action: 'win', narr: { en: 'The teacher rang the little bell — {H} had won the spelling bee, and {F} cheered the very loudest!', ar: 'قرع المعلّم الجرس الصغير — لقد فاز {H} بالمسابقة، وهتف {F} بأعلى صوت!' } },
  ] },
  { id: 'lemonade-stand', title: { en: 'The Lemonade Stand', ar: 'كشك الليمون' }, beats: [
    { bg: 'kitchen', who: ['H'], action: 'cook', narr: { en: 'On a scorching summer day, {H} stood in the kitchen and squeezed a big jug of icy, sweet lemonade.', ar: 'في يوم صيفيّ حارق، وقف {H} في المطبخ وعصر إبريقاً كبيراً من عصير الليمون المثلّج الحلو.' }, say: { en: 'Cold and sweet!', ar: 'بارد وحلو!' } },
    { bg: 'street', who: ['H', 'F'], action: 'build', narr: { en: 'To sell it, {H} and {F} carried everything outside and hammered together a bright little stand right by the road.', ar: 'ولبيعه، حمل {H} و{F} كل شيء إلى الخارج وبنيا كشكاً صغيراً زاهياً عند الطريق تماماً.' } },
    { bg: 'street', who: ['H', 'F'], action: 'greet', narr: { en: 'Soon a line of thirsty neighbours formed, and {H} cheerfully poured out cup after frosty cup.', ar: 'وسرعان ما اصطفّ طابور من الجيران العطاش، وراح {H} يصبّ كوباً بارداً بعد كوب بفرح.' }, say: { en: 'One for you!', ar: 'واحد لك!' } },
    { bg: 'park', who: ['H', 'F'], action: 'cheer', narr: { en: 'By sunset every last cup was gone, and the two friends sat counting their coins, giggling with pride.', ar: 'ومع الغروب نفد آخر كوب، فجلس الصديقان يعدّان نقودهما ويضحكان بفخر.' } },
  ] },
  { id: 'science-fair', title: { en: 'The Science Fair', ar: 'معرض العلوم' }, beats: [
    { bg: 'library', who: ['H'], action: 'read', narr: { en: 'The science fair was only days away, so {H} sat in the library reading three fat books to find the perfect idea.', ar: 'لم يبقَ على معرض العلوم سوى أيام، فجلس {H} في المكتبة يقرأ ثلاثة كتب ضخمة بحثاً عن الفكرة المثالية.' }, say: { en: 'A volcano!', ar: 'بركان!' } },
    { bg: 'classroom', who: ['H', 'F'], action: 'build', item: '🌋', narr: { en: 'Back at school, {H} and {F} rolled up their sleeves and shaped a big, bumpy volcano out of grey clay.', ar: 'وفي المدرسة، شمّر {H} و{F} عن ساعديهما وشكّلا بركاناً كبيراً مبعثراً من الصلصال الرماديّ.' } },
    { bg: 'classroom', who: ['H', 'F'], action: 'find', item: '🌋', narr: { en: 'Then they carefully poured in the secret potion — and with a loud whoosh, it foamed and bubbled everywhere!', ar: 'ثم صبّا الخليط السرّي بعناية — وبصوتٍ عالٍ فار ورغا وغلى في كل مكان!' }, say: { en: 'It erupts!', ar: 'إنه يثور!' } },
    { bg: 'school', who: ['H', 'F'], action: 'win', narr: { en: 'The judges were amazed, and proudly pinned a shiny blue first-place ribbon on each of their chests.', ar: 'أُعجب الحكّام كثيراً، وعلّقوا بفخر شريطاً أزرق لامعاً للمركز الأول على صدر كلٍّ منهما.' } },
  ] },
  { id: 'rainy-fort', title: { en: 'The Pillow Fort', ar: 'قلعة الوسائد' }, beats: [
    { bg: 'home', who: ['H'], action: 'idea', narr: { en: 'Rain drummed on the windows all day long, and stuck inside with nothing to do, {H} suddenly had a cozy idea.', ar: 'قرَع المطر النوافذ طوال اليوم، وبينما كان {H} حبيس البيت بلا شيء يفعله، خطرت له فجأةً فكرة دافئة.' }, say: { en: 'Let’s build a fort!', ar: 'لنبنِ قلعة!' } },
    { bg: 'home', who: ['H', 'F'], action: 'build', narr: { en: 'So {H} and {F} grabbed every pillow in the house and draped blankets over the chairs to build one giant fort.', ar: 'فأخذ {H} و{F} كل وسادة في البيت وفرشا الأغطية فوق الكراسي ليبنيا قلعة عملاقة واحدة.' } },
    { bg: 'home', who: ['H', 'F'], action: 'read', narr: { en: 'Deep inside, by the glow of a flashlight, {H} read {F} a thrilling story about brave pirates and buried gold.', ar: 'وفي الأعماق، على ضوء مصباح صغير، قرأ {H} ل{F} قصة مثيرة عن قراصنة شجعان وكنوز مدفونة.' } },
    { bg: 'bedroom', who: ['H', 'F'], action: 'sleep', narr: { en: 'And when the storm finally faded to a whisper, the two drifted off to sleep, warm inside their little castle.', ar: 'وحين خفتت العاصفة أخيراً إلى همس، غفا الصديقان دافئين داخل قلعتهما الصغيرة.' } },
  ] },
  { id: 'first-swim', title: { en: 'Learning to Swim', ar: 'تعلّم السباحة' }, beats: [
    { bg: 'home', who: ['H'], action: 'tell', narr: { en: 'It was the day of {H}’s very first swimming lesson, and just thinking about the water made {H}’s tummy flutter with nerves.', ar: 'كان يوم درس السباحة الأول ل{H}، ومجرّد التفكير في الماء جعل معدته ترتجف من التوتر.' }, say: { en: 'The water’s so deep…', ar: 'الماء عميق جداً…' } },
    { bg: 'pool', who: ['H', 'F'], action: 'help', narr: { en: 'At the pool, {F} gently held {H}’s hands and, bit by bit, showed them how to lie back and float.', ar: 'عند المسبح، أمسك {F} بيدي {H} بلطف، وشيئاً فشيئاً علّمه كيف يستلقي ويطفو.' } },
    { bg: 'pool', who: ['H'], action: 'swim', narr: { en: 'Then, little by little, {H} began to kick and paddle — until suddenly they were swimming all on their own!', ar: 'ثم، قليلاً قليلاً، بدأ {H} يركل ويجدّف — حتى وجد نفسه فجأةً يسبح وحده تماماً!' }, say: { en: 'I’m swimming!', ar: 'أنا أسبح!' } },
    { bg: 'pool', who: ['H', 'F'], action: 'cheer', narr: { en: 'At the far end, the two friends threw up a giant splash and cheered together at how far {H} had come.', ar: 'وعند الطرف الآخر، أطلق الصديقان رذاذاً كبيراً وهتفا معاً فرحين بما أنجزه {H}.' } },
  ] },
  { id: 'birthday-painting', title: { en: 'The Birthday Gift', ar: 'هدية العيد' }, beats: [
    { bg: 'bedroom', who: ['H'], action: 'idea', narr: { en: 'Tomorrow was {F}’s birthday, and lying awake in bed, {H} was determined to make the most perfect present.', ar: 'غداً عيد ميلاد {F}، وبينما كان {H} مستلقياً في سريره، عقد العزم على تحضير أجمل هدية.' }, say: { en: 'I’ll paint them a picture!', ar: 'سأرسم له لوحة!' } },
    { bg: 'home', who: ['H'], action: 'paint', narr: { en: 'So all evening long, {H} sat and painted a picture of {F} beaming happily beneath a sky full of shining stars.', ar: 'فطوال المساء، جلس {H} يرسم لوحةً ل{F} مبتسماً بسعادة تحت سماء مليئة بالنجوم اللامعة.' } },
    { bg: 'home', who: ['H', 'F'], action: 'gift', narr: { en: 'At the party the next day, {H} shyly handed over the canvas, wrapped up neatly with a bright ribbon.', ar: 'وفي الحفلة في اليوم التالي، سلّمه {H} بخجل اللوحة ملفوفةً بعناية بشريط زاهٍ.' }, say: { en: 'Happy birthday, {F}!', ar: 'عيد ميلاد سعيد يا {F}!' } },
    { bg: 'home', who: ['H', 'F'], action: 'hug', narr: { en: '{F} loved it so much that they threw their arms around {H}, and the two spun around, laughing with joy.', ar: 'أحبّها {F} كثيراً حتى طوّق {H} بذراعيه، ودار الاثنان معاً يضحكان من الفرح.' } },
  ] },

  // ── 5 acts (medium) ──
  { id: 'colour-thief', fixed: true, title: { en: 'The Colour Thief', ar: 'لصّ الألوان' }, beats: [
    { bg: 'bedroom', who: ['lola', 'rami'], action: 'find', narr: { en: '{L} woke up and rubbed her eyes — the whole world had turned a dull, sleepy grey, even her favourite red socks!', ar: 'استيقظت {L} وفركت عينيها — فقد صار العالم كله رمادياً باهتاً ناعساً، حتى جواربها الحمراء المفضّلة!' }, say: { en: 'Where did all the colour go?', ar: 'أين ذهبت كل الألوان؟' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'tell', narr: { en: '{N} shuffled up, her paintbrush tail drooping and colourless — her colours had run off in the night, looking for adventure.', ar: 'تهادت {N} نحوهما، وذيلها الفرشاة متدلٍّ بلا لون — لقد هربت ألوانها في الليل بحثاً عن مغامرة.' }, say: { en: 'They can be such drama.', ar: 'إنها كثيرة الدلال.' } },
    { bg: 'museum', who: ['lola', 'rami', 'noor'], action: 'find', narr: { en: 'A trail of stray colour led them to the museum, where the missing reds and blues were splashed all over the paintings, giggling.', ar: 'قاد أثرٌ من الألوان الشاردة إلى المتحف، حيث تناثرت الحُمر والزُرق فوق اللوحات وهي تضحك.' }, say: { en: 'They’re hiding in the pictures!', ar: 'إنها مختبئة في الصور!' } },
    { bg: 'museum', who: ['rami', 'noor'], action: 'paint', narr: { en: 'One by one, {N} swished her tail and gently painted each runaway colour back to exactly where it belonged.', ar: 'واحداً تلو الآخر، لوّحت {N} بذيلها وأعادت كل لونٍ هارب بلطف إلى مكانه تماماً.' } },
    { bg: 'garden', who: ['lola', 'rami', 'noor'], action: 'cheer', item: { e: '🌈', sky: true }, narr: { en: 'And with one happy POP, the whole world burst back into colour — brighter and bolder than ever before!', ar: 'وبفرقعةٍ سعيدة واحدة، انفجر العالم كله بالألوان من جديد — أزهى وأجرأ من أي وقتٍ مضى!' }, say: { en: 'Okay… that was magical.', ar: 'حسناً… كان ذلك ساحراً.' } },
  ] },
  { id: 'camping-trip', title: { en: 'The Camping Trip', ar: 'رحلة التخييم' }, beats: [
    { bg: 'home', who: ['H', 'F'], action: 'build', item: '🎒', narr: { en: '{H} and {F} stuffed their backpacks and rolled up a big stripy tent, ready for a weekend of camping.', ar: 'حشا {H} و{F} حقيبتيهما ولفّا خيمة كبيرة مخطّطة، استعداداً لعطلة تخييم.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'build', item: '⛺', narr: { en: 'In a leafy green clearing, they pitched the tent and hammered the pegs firmly into the soft ground.', ar: 'وفي فسحة خضراء وارفة، نصبا الخيمة وثبّتا الأوتاد في الأرض الليّنة.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'cook', item: '🔥', narr: { en: 'As the sky grew dark, they toasted gooey marshmallows over a small, crackling campfire.', ar: 'ومع حلول الظلام، حمّصا حلوى المارشمالو فوق نارٍ صغيرة تتطاير شراراتها.' }, say: { en: 'Two for me!', ar: 'اثنتان لي!' } },
    { bg: 'night', who: ['H', 'F'], action: 'find', item: { e: '⭐', sky: true }, narr: { en: 'Lying back on the grass, they gazed up and tried to count a thousand twinkling silver stars.', ar: 'واستلقيا على العشب، يرفعان بصريهما محاولَين عدّ ألف نجمة فضية متلألئة.' }, say: { en: 'Make a wish!', ar: 'تمنَّ أمنية!' } },
    { bg: 'night', who: ['H', 'F'], action: 'sleep', item: '⛺', narr: { en: 'Snug and warm inside their sleeping bags, the two drifted off to the gentle song of the crickets.', ar: 'ودافئَين مرتاحَين داخل كيسي النوم، غفا الاثنان على نغمة الصراصير الهادئة.' } },
  ] },
  { id: 'star-ladder', fixed: true, title: { en: 'The Star Ladder', ar: 'سلّم النجوم' }, beats: [
    { bg: 'bedroom', who: ['lola', 'rami'], action: 'find', item: { e: '⭐', sky: true }, narr: { en: '{R} just couldn’t sleep — one little star outside his window looked so lonely, all on its own.', ar: 'لم يستطع {R} النوم — فنجمة صغيرة خارج نافذته بدت وحيدة جداً بمفردها.' }, say: { en: 'I wish I could reach it.', ar: 'ليتني أصل إليها.' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'idea', item: '🪜', narr: { en: '{N} appeared with a wink and unrolled a shimmering ladder woven from pure moonlight.', ar: 'ظهرت {N} بغمزة، ونشرت سلّماً متلألئاً منسوجاً من ضوء القمر.' }, say: { en: 'After you, brave one!', ar: 'تفضّل يا شجاع!' } },
    { bg: 'space', who: ['lola', 'rami', 'noor'], action: 'walk', item: { e: '✨', sky: true }, narr: { en: 'Up and up they climbed, past the rooftops and the clouds, until they stepped out right among the stars.', ar: 'صعدوا أعلى فأعلى، فوق السطوح والغيوم، حتى خرجوا بين النجوم.' } },
    { bg: 'space', who: ['rami', 'noor'], action: 'greet', item: { e: '⭐', sky: true }, narr: { en: '{R} found the lonely little star and gently introduced it to all its twinkly new neighbours.', ar: 'وجد {R} النجمة الوحيدة وعرّفها بلطف على جيرانها المتلألئين الجدد.' }, say: { en: 'Now you have friends!', ar: 'صار لك أصدقاء الآن!' } },
    { bg: 'bedroom', who: ['lola', 'rami'], action: 'sleep', item: { e: '⭐', sky: true }, narr: { en: 'Climbing safely back home, {R} finally fell asleep, a warm and happy glow still on his cheeks.', ar: 'وبعد العودة بأمان، نام {R} أخيراً، وعلى وجنتيه توهّج دافئ سعيد.' } },
  ] },
  { id: 'whispering-shell', fixed: true, title: { en: 'The Whispering Seashell', ar: 'الصدفة الهامسة' }, beats: [
    { bg: 'beach', who: ['lola', 'rami'], action: 'find', item: '🐚', narr: { en: 'Digging in the warm sand, {R} pulled out a big curly seashell that was very, very quietly… humming a tune.', ar: 'وبينما ينبش في الرمل الدافئ، أخرج {R} صدفة كبيرة ملتوية كانت تدندن بهدوء شديد… لحناً.' }, say: { en: 'It’s singing!', ar: 'إنها تغنّي!' } },
    { bg: 'beach', who: ['rami', 'noor'], action: 'tell', item: '🐚', narr: { en: '{N} pricked up her ears — that shell was holding a lost lullaby the sea had misplaced long, long ago.', ar: 'نصبت {N} أذنيها — فتلك الصدفة تحمل تهويدة ضائعة أضاعها البحر منذ زمن بعيد.' }, say: { en: 'The sea’s been looking for that!', ar: 'البحر يبحث عنها منذ زمن!' } },
    { bg: 'beach', who: ['lola', 'rami', 'noor'], action: 'sing', item: '🌊', narr: { en: 'So they held the shell up to the waves and sang along, gently teaching the sea its forgotten song.', ar: 'فرفعوا الصدفة نحو الأمواج وغنّوا معها، يعلّمون البحر بلطف أغنيته المنسيّة.' } },
    { bg: 'beach', who: ['lola', 'rami', 'noor'], action: 'dance', item: '🐬', narr: { en: 'The happy ocean sang right back, and dolphins leapt and danced all along the shimmering shore.', ar: 'فأجاب المحيط السعيد بالغناء، وقفزت الدلافين ورقصت على طول الشاطئ المتلألئ.' } },
    { bg: 'night', who: ['lola', 'rami'], action: 'sleep', item: '🐚', narr: { en: 'That night, the gentle sea-song drifted in through the window, and the two fell asleep smiling.', ar: 'وفي تلك الليلة، تسلّلت أغنية البحر الهادئة عبر النافذة، فنام الاثنان مبتسمَين.' } },
  ] },
  { id: 'treasure-map', title: { en: 'The Treasure Map', ar: 'خريطة الكنز' }, beats: [
    { bg: 'bedroom', who: ['H'], action: 'find', item: '🗺️', narr: { en: 'One rainy afternoon, {H} was flipping through an old library book when a crinkly, folded treasure map tumbled out.', ar: 'في عصرٍ ماطر، كان {H} يتصفّح كتاباً قديماً من المكتبة حين سقطت منه خريطة كنز مطويّة متجعّدة.' }, say: { en: 'X marks the spot!', ar: 'العلامة X هنا!' } },
    { bg: 'street', who: ['H', 'F'], action: 'walk', narr: { en: 'Bursting with excitement, {H} and {F} set off together, following its winding dotted path all across town.', ar: 'وقد امتلأ {H} و{F} حماساً، فانطلقا معاً يتبعان مسارها المنقّط المتعرّج عبر المدينة كلها.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'find', item: '📦', narr: { en: 'The trail led them to the biggest tree in the garden, where they knelt down and dug up a small, rusty iron box.', ar: 'قادهما الأثر إلى أكبر شجرة في الحديقة، حيث ركعا ونبشا صندوقاً حديدياً صغيراً صدئاً.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'idea', narr: { en: 'Inside they found a handful of seeds and a note that read: "Plant these, and grow something wonderful."', ar: 'بداخله وجدا حفنة من البذور وورقة مكتوباً عليها: «ازرعها، وأنبت شيئاً رائعاً».' }, say: { en: 'What a gift!', ar: 'يا لها من هدية!' } },
    { bg: 'garden', who: ['H', 'F'], action: 'plant', narr: { en: 'So right there in the soft earth, they planted every single seed and watered them, grinning at each other.', ar: 'فهناك في التراب الليّن، زرعا كل بذرة وسقياها وهما يتبادلان الابتسامات.' } },
  ] },
  { id: 'talent-show', title: { en: 'The Talent Show', ar: 'عرض المواهب' }, beats: [
    { bg: 'bedroom', who: ['H'], action: 'tell', narr: { en: '{H} bravely signed up to sing in the talent show — but the moment their name went on the list, the jitters crept in.', ar: 'سجّل {H} بشجاعة ليغنّي في عرض المواهب — لكن ما إن كُتب اسمه حتى تسلّل إليه التوتر.' }, say: { en: 'What if I freeze?', ar: 'ماذا لو تجمّدت؟' } },
    { bg: 'home', who: ['H', 'F'], action: 'help', narr: { en: 'So every single day that week, {F} sat with {H} and practised the song over and over until they knew it by heart.', ar: 'فكل يوم من ذلك الأسبوع، جلس {F} مع {H} وتدرّبا على الأغنية مراراً حتى حفظاها عن ظهر قلب.' } },
    { bg: 'street', who: ['H', 'F'], action: 'walk', narr: { en: 'At last the big night arrived, and the two friends walked side by side to the bright, buzzing theatre.', ar: 'وأخيراً جاءت الليلة الكبيرة، فمشى الصديقان جنباً إلى جنب إلى المسرح المضيء الصاخب.' } },
    { bg: 'stage', who: ['H'], action: 'sing', narr: { en: 'Under the dazzling lights, {H} closed their eyes, took one deep breath, and sang out clear, warm, and strong.', ar: 'وتحت الأضواء الباهرة، أغمض {H} عينيه، وأخذ نفساً عميقاً، وغنّى بصوت صافٍ دافئ قويّ.' } },
    { bg: 'stage', who: ['H', 'F'], action: 'cheer', narr: { en: 'The whole crowd leapt up cheering, and {F} raced onto the stage to wrap {H} in a huge, proud hug.', ar: 'وثب الجمهور كله مصفّقاً، وركض {F} إلى المسرح ليطوّق {H} بعناق كبير مفعم بالفخر.' }, say: { en: 'You did it!', ar: 'لقد نجحت!' } },
  ] },
  { id: 'space-trip', title: { en: 'A Trip to the Stars', ar: 'رحلة إلى النجوم' }, beats: [
    { bg: 'library', who: ['H'], action: 'read', narr: { en: 'One night, {H} read all about a glowing planet ringed with ice, and simply couldn’t stop dreaming about it.', ar: 'ذات ليلة، قرأ {H} كل شيء عن كوكب متوهّج تحيط به حلقات من الجليد، فلم يستطع التوقف عن الحلم به.' }, say: { en: 'I want to see it!', ar: 'أريد أن أراه!' } },
    { bg: 'home', who: ['H', 'F'], action: 'build', narr: { en: 'So the next day, {H} and {F} gathered boxes and tape and built a tall cardboard rocket right in the living room.', ar: 'وفي اليوم التالي، جمع {H} و{F} الصناديق والشريط اللاصق وبنيا صاروخاً طويلاً من الكرتون في غرفة الجلوس.' } },
    { bg: 'space', who: ['H', 'F'], action: 'fly', narr: { en: 'Three… two… one — with a mighty roar they blasted off, soaring higher and higher past the twinkling stars!', ar: 'ثلاثة… اثنان… واحد — وبزئير هائل انطلقا محلّقين أعلى فأعلى عبر النجوم المتلألئة!' } },
    { bg: 'space', who: ['H', 'F'], action: 'find', narr: { en: 'Far out in the dark, they finally saw the ringed planet up close, and a bright comet went whooshing right by.', ar: 'وفي الظلام البعيد، رأيا أخيراً الكوكب ذا الحلقات عن قرب، ومرّ بجانبهما مذنّب لامع مسرعاً.' }, say: { en: 'There it is!', ar: 'ها هو ذا!' } },
    { bg: 'bedroom', who: ['H'], action: 'sleep', narr: { en: 'Back home and tucked in bed at last, {H} fell fast asleep, dreaming of the whole sparkling galaxy.', ar: 'وعند العودة إلى السرير أخيراً، نام {H} نوماً عميقاً يحلم بالمجرّة المتلألئة كلها.' } },
  ] },
  { id: 'garden-feast', title: { en: 'From Seed to Feast', ar: 'من البذرة إلى الوليمة' }, beats: [
    { bg: 'garden', who: ['H'], action: 'plant', narr: { en: 'When spring arrived, {H} knelt in the garden and planted long, neat rows of tiny seeds, watering them every single day.', ar: 'حين جاء الربيع، ركع {H} في الحديقة وزرع صفوفاً طويلة منظّمة من البذور الصغيرة، وسقاها كل يوم.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'help', narr: { en: 'Each morning {F} came by to help pull the stubborn weeds, and together the two friends waited and waited.', ar: 'وكل صباح كان يأتي {F} ليساعد في نزع الأعشاب العنيدة، وانتظر الصديقان معاً وانتظرا.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'find', item: '🍅', narr: { en: 'Then one bright morning they gasped — fat red tomatoes and crisp green beans had finally appeared on the vines!', ar: 'ثم في صباحٍ مشرق، لهثا دهشةً — فقد ظهرت أخيراً طماطم حمراء ممتلئة وفاصولياء خضراء مقرمشة!' }, say: { en: 'They’re ready!', ar: 'لقد نضجت!' } },
    { bg: 'kitchen', who: ['H', 'F'], action: 'cook', narr: { en: 'They gathered the whole harvest into baskets, carried it inside, and cooked it into a big, bubbling pot of stew.', ar: 'جمعا المحصول كله في السلال، وحملاه إلى الداخل، وطبخاه في قدر كبير من اليخنة يغلي.' } },
    { bg: 'home', who: ['H', 'F'], action: 'eat', narr: { en: 'At the table they shared their delicious feast, feeling proud of every single bite they had grown themselves.', ar: 'وعلى المائدة تقاسما وليمتهما اللذيذة، فخورَين بكل لقمة زرعاها بأيديهما.' }, say: { en: 'We grew this!', ar: 'نحن زرعنا هذا!' } },
  ] },
  { id: 'kind-neighbour', title: { en: 'The Secret Helpers', ar: 'المساعدان السرّيان' }, beats: [
    { bg: 'street', who: ['H'], action: 'walk', narr: { en: 'Every day on the way to school, {H} walked past a kind old neighbour’s garden, now sadly messy, weedy, and overgrown.', ar: 'كل يوم في طريقه إلى المدرسة، كان {H} يمرّ بحديقة جار عجوز طيّب، صارت للأسف مهملة متشابكة كثيرة الأعشاب.' } },
    { bg: 'street', who: ['H', 'F'], action: 'tell', narr: { en: 'So {H} hurried to find {F}, and together the two whispered up a secret plan to fix it as a surprise.', ar: 'فأسرع {H} ليجد {F}، وهمس الاثنان معاً بخطة سرّية لإصلاحها كمفاجأة.' }, say: { en: 'Let’s surprise them!', ar: 'لنفاجئهم!' } },
    { bg: 'garden', who: ['H', 'F'], action: 'build', narr: { en: 'All Saturday long they raked up the fallen leaves, pulled out the weeds, and carefully mended the little broken fence.', ar: 'وطوال السبت جمعا الأوراق المتساقطة، ونزعا الأعشاب، وأصلحا بعناية السياج الصغير المكسور.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'plant', narr: { en: 'Then, all along the tidy new path, they planted a row of bright, cheerful flowers in every colour they could find.', ar: 'ثم على طول الممرّ الجديد النظيف، زرعا صفاً من الأزهار الزاهية المبهجة بكل لون وجداه.' } },
    { bg: 'home', who: ['H', 'F'], action: 'gift', narr: { en: 'The next morning, the delighted neighbour baked the two friends a plate of warm cookies to say a big thank you.', ar: 'وفي صباح اليوم التالي، خبز الجار المسرور للصديقين طبقاً من الكعك الدافئ ليشكرهما شكراً كبيراً.' }, say: { en: 'For my little helpers!', ar: 'لمساعدَيّ الصغيرين!' } },
  ] },

  // ── 6 acts (hard) ──
  // Fixed cast: Lola (girl), her little brother Rami (boy), and Noor (magical fox).
  { id: 'lost-moon', fixed: true, title: { en: 'The Lost Moon', ar: 'القمر الضائع' }, beats: [
    { bg: 'garden', who: ['lola', 'rami'], action: 'find', item: '🌿', narr: { en: 'In the garden, {L} caught her little brother {R} whispering secrets to a bush — and the bush sneezed!', ar: 'في الحديقة، ضبطت {L} أخاها الصغير {R} يهمس بأسرارٍ لشجيرة — فعطست الشجيرة!' }, say: { en: 'It’s not what it looks like…', ar: 'الأمر ليس كما يبدو…' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'greet', narr: { en: 'Out stepped {N}, a fox with a paintbrush tail, who had lost the little moon she keeps inside it.', ar: 'فخرجت {N}، ثعلبةٌ بذيلٍ كالفرشاة، وقد أضاعت القمر الصغير الذي تحمله في ذيلها.' }, say: { en: 'Night won’t start without it!', ar: 'لن يبدأ الليل بدونه!' } },
    { bg: 'home', who: ['lola', 'rami', 'noor'], action: 'find', item: '🐱', narr: { en: 'So the three friends hunted everywhere — under the stairs, up by the roof — but found only a grumpy cat and a missing sock.', ar: 'فبحث الأصدقاء الثلاثة في كل مكان — تحت الدرج وفوق السطح — فلم يجدوا سوى قطة غاضبة وجورباً مفقوداً.' }, say: { en: 'Still no moon!', ar: 'لا قمر بعد!' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'find', item: '🌕', narr: { en: 'Then, deep in {R}’s pocket — past bottle caps and half a biscuit — something glowed: one little marble.', ar: 'ثم، في عمق جيب {R} — بين أغطية الزجاجات ونصف بسكويتة — تألّق شيء: كرة زجاجية صغيرة.' }, say: { en: 'That marble…', ar: 'تلك الكرة…' } },
    { bg: 'garden', who: ['lola', 'rami'], action: 'tell', item: '🌕', narr: { en: '“{R}, you put the MOON in your POCKET!” gasped {L}. {R} just shrugged.', ar: '«{R}، لقد وضعتَ القمر في جيبك!» صاحت {L}. أما {R} فاكتفى بهزّ كتفيه.' }, say: { en: 'It was very moon-shaped!', ar: 'كان شكله كالقمر تماماً!' } },
    { bg: 'night', who: ['lola', 'rami', 'noor'], action: 'cheer', item: { e: '🌟', sky: true }, narr: { en: '{N} tucked the little moon back into her tail, and the sky lit up — gold, pink, deep blue — as the first star switched on.', ar: 'أعادت {N} القمر الصغير إلى ذيلها، فأضاءت السماء — ذهبيةً ووردية وزرقاء عميقة — وأُضيء أول نجم.' }, say: { en: 'Same time next Tuesday?', ar: 'نلتقي الثلاثاء المقبل؟' } },
  ] },
  { id: 'backwards-day', fixed: true, title: { en: 'The Backwards Day', ar: 'اليوم المقلوب' }, beats: [
    { bg: 'home', who: ['lola', 'rami'], action: 'eat', item: '🍮', narr: { en: 'It began very strangely — {L} and {R} were served wobbly pudding for breakfast, and the clock was ticking backwards!', ar: 'بدأ اليوم غريباً جداً — قُدّم ل{L} و{R} حلوى على الفطور، والساعة تدقّ إلى الوراء!' }, say: { en: 'Why is everything backwards?', ar: 'لماذا كل شيء مقلوب؟' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'tell', item: '⏰', narr: { en: '{N} slunk over, tail drooping — she’d flicked it the wrong way and accidentally stirred the whole day back to front.', ar: 'تسلّلت {N} وذيلها متدلٍّ — لقد لوّحت به في الاتجاه الخطأ فقلبت اليوم كله رأساً على عقب.' }, say: { en: 'Whoops. Wrong flick.', ar: 'آسفة. تلويحة خاطئة.' } },
    { bg: 'street', who: ['lola', 'rami', 'noor'], action: 'walk', narr: { en: 'So they walked to school in reverse, saying goodbye to say hello, while everyone around them hopped backwards!', ar: 'فمشوا إلى المدرسة إلى الوراء، يقولون «وداعاً» بدل «مرحباً»، والجميع من حولهم يقفزون إلى الخلف!' } },
    { bg: 'park', who: ['lola', 'rami', 'noor'], action: 'play', narr: { en: 'It was actually rather fun — they laughed and played every game inside-out and completely upside-down.', ar: 'وكان الأمر ممتعاً في الواقع — ضحكوا ولعبوا كل لعبة بالمقلوب ورأساً على عقب.' } },
    { bg: 'garden', who: ['rami', 'noor'], action: 'idea', item: '✨', narr: { en: 'But by dinner they missed the normal way of things, so {N} gave her magic tail one slow, careful flick forward.', ar: 'لكن مع العشاء اشتاقوا إلى الأمور الطبيعية، فلوّحت {N} بذيلها السحريّ تلويحة بطيئة حذرة إلى الأمام.' }, say: { en: 'Let’s try that again!', ar: 'لنحاول من جديد!' } },
    { bg: 'home', who: ['lola', 'rami', 'noor'], action: 'cheer', item: '🍮', narr: { en: 'TICK — the day spun right way round again, everyone cheered… then happily ate their pudding, on purpose this time.', ar: 'تِك — دار اليوم إلى وضعه الصحيح، فهتف الجميع… ثم أكلوا الحلوى بسعادة، عن قصدٍ هذه المرة.' }, say: { en: 'Dessert first — genius!', ar: 'الحلوى أولاً — عبقريّ!' } },
  ] },
  { id: 'class-play', title: { en: 'The Class Play', ar: 'مسرحية الصف' }, beats: [
    { bg: 'classroom', who: ['H'], action: 'tell', item: '🦁', narr: { en: '{H}’s class was putting on a play, and {H} was chosen to be the brave, roaring lion.', ar: 'كان صفّ {H} يحضّر مسرحية، واختير {H} ليكون الأسد الشجاع المزمجر.' }, say: { en: 'Me? The lion?', ar: 'أنا؟ الأسد؟' } },
    { bg: 'home', who: ['H', 'F'], action: 'help', narr: { en: 'Every single evening, {F} helped {H} practise the lines and the biggest, bravest roar.', ar: 'وكل مساء، ساعد {F} {H} على حفظ دوره وعلى أقوى زئير وأشجعه.' } },
    { bg: 'home', who: ['H', 'F'], action: 'paint', item: '🎭', narr: { en: 'Together they painted a golden mane and cut out a truly splendid cardboard lion mask.', ar: 'وصنعا معاً لبدةً ذهبية وقصّا قناع أسد رائعاً من الكرتون.' } },
    { bg: 'stage', who: ['H'], action: 'tell', narr: { en: 'On show night, the bright lights went up, and {H} stepped out in front of the whole excited school.', ar: 'وفي ليلة العرض، أضيئت الأنوار، وخرج {H} أمام المدرسة كلها المتحمّسة.' }, say: { en: '…gulp.', ar: '…ابتلع ريقه.' } },
    { bg: 'stage', who: ['H'], action: 'sing', narr: { en: 'Then {H} let out a ROAR so grand and mighty that the whole audience burst into delighted applause.', ar: 'ثم أطلق {H} زئيراً مهيباً عظيماً حتى انفجر الجمهور كله بالتصفيق المبهج.' } },
    { bg: 'stage', who: ['H', 'F'], action: 'cheer', item: '💐', narr: { en: 'As the curtain fell, {F} rushed on stage with a bunch of flowers — the play was a roaring success!', ar: 'ومع إسدال الستار، اندفع {F} إلى المسرح بباقة ورد — كانت المسرحية نجاحاً مدوّياً!' }, say: { en: 'You were amazing!', ar: 'كنت رائعاً!' } },
  ] },
  { id: 'treehouse', title: { en: 'The Treehouse', ar: 'بيت الشجرة' }, beats: [
    { bg: 'garden', who: ['H'], action: 'idea', narr: { en: '{H} gazed up at the big old oak tree and imagined the perfect secret treehouse hidden in its branches.', ar: 'حدّق {H} في شجرة البلّوط الكبيرة العتيقة وتخيّل بيت شجرة سرّياً مثالياً بين أغصانها.' }, say: { en: 'Right up there!', ar: 'هناك في الأعلى تماماً!' } },
    { bg: 'street', who: ['H', 'F'], action: 'walk', item: '🪵', narr: { en: '{H} and {F} borrowed a wobbly little cart and hauled planks and nails all the way across town.', ar: 'استعار {H} و{F} عربة صغيرة مهتزّة، وجرّا الألواح والمسامير عبر المدينة كلها.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'build', narr: { en: 'Piece by piece, hammering and sawing all day, they built it snugly high up among the branches.', ar: 'قطعةً قطعة، وبالطرق والنشر طوال اليوم، بنياه مريحاً عالياً بين الأغصان.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'paint', narr: { en: 'They painted it a bright cheerful red and hung a swinging rope ladder down the trunk.', ar: 'وطلياه بأحمر زاهٍ مبهج، وعلّقا سلّم حبل متأرجحاً على الجذع.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'read', narr: { en: 'Inside their cosy new hideout, they read comics side by side and shared a secret midnight snack.', ar: 'وفي مخبئهما الجديد الدافئ، قرآ القصص المصوّرة جنباً إلى جنب وتقاسما وجبة سرّية.' } },
    { bg: 'night', who: ['H', 'F'], action: 'cheer', item: '🏮', narr: { en: 'As the stars came out, they hung a little glowing lantern and declared it the best clubhouse ever.', ar: 'ومع ظهور النجوم، علّقا فانوساً صغيراً متوهّجاً وأعلناه أفضل نادٍ على الإطلاق.' }, say: { en: 'Members only!', ar: 'للأعضاء فقط!' } },
  ] },
  { id: 'bakery-dream', title: { en: 'The Little Bakery', ar: 'المخبز الصغير' }, beats: [
    { bg: 'bedroom', who: ['H'], action: 'idea', narr: { en: 'Ever since {H} could remember, they had one big dream: to open a tiny bakery and fill the whole street with the smell of warm bread.', ar: 'منذ أن يتذكّر {H}، كان له حلم كبير واحد: أن يفتح مخبزاً صغيراً ويملأ الشارع كله برائحة الخبز الدافئ.' }, say: { en: 'Warm bread for everyone!', ar: 'خبز دافئ للجميع!' } },
    { bg: 'library', who: ['H'], action: 'read', narr: { en: 'To learn the secret, {H} stayed up late, poring over a dusty old recipe book by the light of one small lamp.', ar: 'ولكي يتعلّم السرّ، سهر {H} حتى وقت متأخر يتصفّح كتاب وصفات قديماً مغبرّاً على ضوء مصباح صغير.' } },
    { bg: 'kitchen', who: ['H', 'F'], action: 'cook', narr: { en: 'The very next day {F} rolled up their sleeves to help, and together they kneaded the sticky dough until their arms ached.', ar: 'وفي اليوم التالي شمّر {F} عن ساعديه ليساعد، فعجَنا معاً العجين اللزج حتى تعبت أذرعهما.' } },
    { bg: 'street', who: ['H', 'F'], action: 'build', narr: { en: 'Before sunrise, the two friends carried out their tables and set up a cheerful little stall on the busy corner.', ar: 'وقبل شروق الشمس، حمل الصديقان طاولاتهما ونصبا كشكاً صغيراً مبهجاً عند الزاوية المزدحمة.' } },
    { bg: 'street', who: ['H', 'F'], action: 'gift', narr: { en: 'A long line quickly formed, and beaming with pride, {H} handed a soft, warm roll to every single neighbour.', ar: 'وسرعان ما تشكّل طابور طويل، فراح {H} متألّقاً بالفخر يعطي كل جار رغيفاً طرياً دافئاً.' }, say: { en: 'Fresh and free today!', ar: 'طازج ومجاني اليوم!' } },
    { bg: 'park', who: ['H', 'F'], action: 'cheer', narr: { en: 'And when the very last roll was finally gone, they flopped down together on the grass, tired and cheering.', ar: 'وحين نفد آخر رغيف أخيراً، ارتميا معاً على العشب، متعبَين وهاتفَين بالفرح.' } },
  ] },
  { id: 'big-race', title: { en: 'The Big Race', ar: 'السباق الكبير' }, beats: [
    { bg: 'kitchen', who: ['H'], action: 'eat', narr: { en: 'On the morning of the big race, {H} sat down and gobbled up a hearty, healthy breakfast to fill up on energy.', ar: 'في صباح السباق الكبير، جلس {H} والتهم فطوراً صحياً دسِماً ليملأ نفسه بالطاقة.' }, say: { en: 'Fuel for the race!', ar: 'طاقة للسباق!' } },
    { bg: 'street', who: ['H', 'F'], action: 'greet', narr: { en: 'Down at the crowded start line, {H} turned to {F} with a big grin and wished them the very best of luck.', ar: 'وعند خط البداية المزدحم، التفت {H} إلى {F} بابتسامة عريضة وتمنّى له أفضل حظّ.' } },
    { bg: 'park', who: ['H', 'F'], action: 'play', narr: { en: 'The whistle shrieked, and the two shot off, sprinting neck and neck around the slippery, muddy, twisting track —', ar: 'أُطلقت الصافرة، فانطلق الاثنان جنباً إلى جنب حول المضمار الزلق الموحل المتعرّج —' } },
    { bg: 'park', who: ['H', 'F'], action: 'help', narr: { en: '— but then {F} suddenly tripped and tumbled down, so without a second thought {H} stopped and pulled them back up.', ar: '— لكن {F} تعثّر فجأةً وسقط، فتوقّف {H} دون تردّد ورفعه واقفاً من جديد.' }, say: { en: 'I’ve got you!', ar: 'أنا معك!' } },
    { bg: 'park', who: ['H', 'F'], action: 'walk', narr: { en: 'Side by side and matching each other stride for stride, the two friends jogged the very last stretch together.', ar: 'وكتفاً إلى كتف، متساويَين في كل خطوة، ركض الصديقان المسافة الأخيرة معاً.' } },
    { bg: 'park', who: ['H', 'F'], action: 'cheer', narr: { en: 'And in the end they crossed the finish line hand in hand, laughing — two very happy, very muddy winners!', ar: 'وفي النهاية عبَرا خط النهاية يداً بيد وهما يضحكان — فائزَين سعيدَين مغطّيَين بالطين!' } },
  ] },
  { id: 'art-museum', title: { en: 'The Young Artist', ar: 'الفنان الصغير' }, beats: [
    { bg: 'home', who: ['H'], action: 'paint', narr: { en: 'For weeks and weeks, {H} worked on a huge, colourful painting of a jungle, hiding a secret animal on every leafy branch.', ar: 'لأسابيع وأسابيع، عمل {H} على لوحة ضخمة ملوّنة لغابة، يخبّئ حيواناً سرّياً على كل غصن مورق.' }, say: { en: 'Almost done!', ar: 'كدت أنتهي!' } },
    { bg: 'street', who: ['H', 'F'], action: 'walk', narr: { en: 'When at last it was finished, {H} and {F} lifted the giant canvas together and carried it carefully across town.', ar: 'وحين اكتملت أخيراً، رفع {H} و{F} اللوحة العملاقة معاً وحملاها بعناية عبر المدينة.' } },
    { bg: 'museum', who: ['H', 'F'], action: 'help', narr: { en: 'At the museum, {F} climbed a little ladder and helped hang the painting just right on the tall white wall.', ar: 'وفي المتحف، صعد {F} سلّماً صغيراً وساعد في تعليق اللوحة في مكانها الصحيح على الجدار الأبيض العالي.' } },
    { bg: 'museum', who: ['H', 'F'], action: 'find', narr: { en: 'Soon a whole crowd gathered around it, pointing and giggling as they hunted for every hidden animal.', ar: 'وسرعان ما تجمّعت حولها حشدٌ كامل، يشيرون ويضحكون وهم يبحثون عن كل حيوان مخبّأ.' }, say: { en: 'Look, a tiger!', ar: 'انظر، نمر!' } },
    { bg: 'museum', who: ['H'], action: 'win', narr: { en: 'The museum curator was so impressed that she stepped forward and pinned a shiny "Young Artist" medal on {H}.', ar: 'أُعجب أمين المتحف كثيراً حتى تقدّم وعلّق ميدالية «الفنان الصغير» اللامعة على {H}.' } },
    { bg: 'home', who: ['H', 'F'], action: 'cheer', narr: { en: 'And back home that evening, the two friends threw a joyful, messy, paint-splattered party to celebrate.', ar: 'وفي البيت ذلك المساء، أقام الصديقان حفلة مبهجة فوضوية مليئة برذاذ الألوان احتفالاً.' } },
  ] },
  { id: 'beach-day', title: { en: 'A Day at the Beach', ar: 'يوم على الشاطئ' }, beats: [
    { bg: 'street', who: ['H', 'F'], action: 'walk', narr: { en: 'One bright and sunny morning, {H} and {F} slung their bags over their shoulders and set off happily for the beach.', ar: 'في صباحٍ مشرق مشمس، حمل {H} و{F} حقيبتيهما على كتفيهما وانطلقا بسعادة إلى الشاطئ.' } },
    { bg: 'beach', who: ['H', 'F'], action: 'build', narr: { en: 'The moment they arrived, they got to work building a towering sandcastle, with tiny windows made of shimmering shells.', ar: 'وما إن وصلا حتى شرعا في بناء قلعة رملية شاهقة، بنوافذ صغيرة من الأصداف اللامعة.' }, say: { en: 'Add a tower here!', ar: 'أضف برجاً هنا!' } },
    { bg: 'pool', who: ['H'], action: 'swim', narr: { en: 'Then {H} dashed down and dove straight into the cool blue waves, riding them all the way back to the shore.', ar: 'ثم اندفع {H} وغطس مباشرةً في الأمواج الزرقاء الباردة، وركبها عائداً حتى الشاطئ.' } },
    { bg: 'beach', who: ['H', 'F'], action: 'eat', narr: { en: 'When their tummies started to rumble, the two spread out a picnic and shared sandwiches and slices of juicy watermelon.', ar: 'وحين بدأت بطونهما تقرقر، فرشا نزهة وتقاسما الشطائر وشرائح البطيخ العصير.' } },
    { bg: 'beach', who: ['H', 'F'], action: 'sing', narr: { en: 'As the sun sank low and turned the sky orange, the friends sang silly songs around a small, crackling fire.', ar: 'ومع انخفاض الشمس وتحوّل السماء إلى برتقاليّ، غنّى الصديقان أغانيَ مرحة حول نار صغيرة تتقافز.' } },
    { bg: 'night', who: ['H', 'F'], action: 'sleep', narr: { en: 'And at last, under a wide sky bursting with stars, they curled up close together and fell fast asleep.', ar: 'وأخيراً، تحت سماء واسعة تعجّ بالنجوم، تكوّرا متقاربَين وناما بعمق.' } },
  ] },
];

const EMPTY = { bg: null, chars: [], action: null };
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function makeStory(n, rng, distract) {
  const pool = STORIES.filter((s) => s.beats.length === n);
  const src = pool.length ? pool : STORIES;
  const script = src[Math.floor(rng() * src.length)];
  // Fixed-cast stories name real characters in `who`; generic ones cast H/F at random.
  const fixed = !!script.fixed;
  const cast = shuffleR(CHARS.map((c) => c.id), rng);
  const roleChar = fixed ? {} : { H: cast[0], F: cast[1] };
  const target = script.beats.map((b) => ({ bg: b.bg, chars: fixed ? [...b.who] : b.who.map((r) => roleChar[r]), action: b.action, say: b.say || null, item: b.item || null }));
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
    title: script.title || null,
    roleChar,
    target,
    paletteBgs: shuffleR(BG_LIST.filter((b) => palBg.has(b)), rng),
    paletteChars: shuffleR(CHARS.map((c) => c.id).filter((c) => palChar.has(c)), rng),
    paletteActions: shuffleR(ACTIONS.filter((a) => palAct.has(a.id)).map((a) => a.id), rng),
  };
}

// ── difficulty ──
// len = number of acts (panels). Each difficulty tells a longer story; distractor
// pieces and the memorize countdown ramp across the 100 levels.
const LEVEL_BASE = {
  easy: { len: 4, d0: 0, d1: 2, m0: 42, m1: 34 },
  med: { len: 5, d0: 1, d1: 3, m0: 44, m1: 34 },
  hard: { len: 6, d0: 2, d1: 4, m0: 46, m1: 34 },
};
function levelCfg(diff, level) {
  const b = LEVEL_BASE[diff] || LEVEL_BASE.med;
  const f = (((level || 1) - 1) / 99);
  return { len: b.len, distract: Math.round(b.d0 + (b.d1 - b.d0) * f), memo: Math.round(b.m0 + (b.m1 - b.m0) * f) };
}
function survivalCfg(stage) {
  return { len: Math.min(6, 3 + Math.floor(stage / 2)), distract: Math.min(5, Math.floor(stage / 1.5)), memo: Math.max(22, Math.round(42 - stage * 1.3)) };
}
function passCfgFor() { return { len: 5, distract: 2, memo: 36 }; }

// Fewer columns on phones → bigger, clearer panels (5–6 panel stories go 2-wide).
const gridCols = (n) => {
  const narrow = typeof window !== 'undefined' && window.innerWidth < 460;
  if (n <= 3) return Math.min(n, 3);
  if (n === 4) return 2;
  return narrow ? 2 : 3;
};
// Fit rebuild panels to the viewport: bigger cells, fewer columns → larger panels.
function frameSize(cols) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 400;
  const avail = Math.min(w, 600) - 24;
  const cell = (avail - 12 * (cols - 1)) / cols;
  return Math.max(108, Math.min(230, Math.floor(cell)));
}
// WATCH panel: as big as the phone allows, reserving room for title/caption/controls.
const bigSize = () => {
  if (typeof window === 'undefined') return 320;
  const byW = window.innerWidth - 26;
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

function StoryEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 5) : 0;
  const nameOf = (id) => { const c = CHARS.find((x) => x.id === id); return c ? (isAr ? c.ar : c.en) : ''; };
  const actWord = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? (isAr ? a.ar : a.en) : ''; };
  const actEmoji = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? a.e : ''; };

  const stageRef = useRef(0);
  const roundsRef = useRef(0);
  const bestRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppCorrectRef = useRef(0);

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
    setStory(makeStory(cfg.len, rng, cfg.distract));
    setPanels(Array(cfg.len).fill(EMPTY));
    setWatchIdx(0);
    setTimeLeft(cfg.memo);
    setResult({ n: 0, m: 0 });
    setSel(null);
    setHint('');
    setPhase('watch');
  }, [cfgFor, rng]);

  useEffect(() => { newRound(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

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
    return `${names.join(t.and)} ${actWord(beat.action)}`;
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

  if (!story) return <div style={S.root} dir={isAr ? 'rtl' : 'ltr'} />;
  const fsz = frameSize(gridCols(len));
  const storyTitle = story.title ? (isAr ? story.title.ar : story.title.en) : '';
  const reveal = phase === 'reveal';
  const selLabel = sel ? (sel.kind === 'erase' ? t.erase : sel.kind === 'bg' ? (isAr ? BACKGROUNDS[sel.id].ar : BACKGROUNDS[sel.id].en) : sel.kind === 'char' ? nameOf(sel.id) : `${actEmoji(sel.id)} ${actWord(sel.id)}`) : '';
  const isSel = (kind, id) => sel && sel.kind === kind && sel.id === id;

  return (
    <div style={S.root} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{ANIM_CSS}</style>
      <header className="ct-training-play-header">
        <button className="ct-training-chrome-btn" aria-label={t.menu} onClick={() => { playSfx?.('click'); onExit?.(); }}>‹</button>
        <div className="ct-training-play-header-body">
          <div className="ct-training-play-title">{t.title}</div>
          <div className="ct-training-play-sub">{hudSub}</div>
        </div>
        <div className="ct-training-chrome-spacer" aria-hidden="true" />
      </header>

      {/* WATCH */}
      {phase === 'watch' && (() => {
        const g = story.target[watchIdx];
        return (
          <div style={S.center}>
            {storyTitle && <div style={S.storyTitle}>📖 {storyTitle}</div>}
            <div style={{ ...S.timerChip, ...(timeLeft <= 5 ? S.timerLow : null) }}>⏱ {timeLeft}s · {t.watchTag}</div>
            <div style={{ position: 'relative' }}>
              <span style={S.badge}>{watchIdx + 1}</span>
              <PanelStage panel={g} size={bigSize()} say={resolveSay(g)} />
            </div>
            <div key={watchIdx} style={S.watchCap}>{resolveNarr(g) || `${t.seq(watchIdx, len)} ${narrate(g)}`}</div>
            <div style={S.watchNav}>
              <button type="button" aria-label={t.prev} style={{ ...S.navArrow, ...(watchIdx === 0 ? S.navOff : null) }} disabled={watchIdx === 0} onClick={() => { playSfx?.('click'); setWatchIdx((w) => Math.max(0, w - 1)); }}>‹</button>
              <div style={S.dots}>{story.target.map((_, i) => (
                <button key={i} type="button" aria-label={`${i + 1}`} style={{ ...S.dot, ...(i === watchIdx ? S.dotOn : null) }} onClick={() => { playSfx?.('click'); setWatchIdx(i); }} />
              ))}</div>
              <button type="button" aria-label={t.next} style={{ ...S.navArrow, ...(watchIdx >= len - 1 ? S.navOff : null) }} disabled={watchIdx >= len - 1} onClick={() => { playSfx?.('click'); setWatchIdx((w) => Math.min(len - 1, w + 1)); }}>›</button>
            </div>
            <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); setPhase('rebuild'); }}>{t.doneMemo}</button>
          </div>
        );
      })()}

      {/* REBUILD / REVEAL */}
      {(phase === 'rebuild' || phase === 'reveal') && (
        <div style={S.gameBody}>
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

          {reveal && (() => {
            const refSize = Math.round(fsz * 0.74);
            return (
              <>
                <div style={S.storyWas}>{t.storyWas}{storyTitle ? ` “${storyTitle}”` : ''}</div>
                <div style={{ ...S.grid, rowGap: 6, gridTemplateColumns: `repeat(${gridCols(len)}, max-content)` }}>
                  {story.target.map((g, i) => (
                    <div key={i} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: refSize }}>
                      <div style={{ position: 'relative' }}>
                        <span style={{ ...S.badge, background: '#2e8b57' }}>{i + 1}</span>
                        <PanelStage panel={g} size={refSize} />
                      </div>
                      <div style={S.refCap}>{resolveNarr(g) || `${t.seq(i, len)} ${narrate(g)}`}</div>
                    </div>
                  ))}
                </div>
                <button type="button" style={S.primary} onClick={advanceRound}>{t.cont}</button>
              </>
            );
          })()}
        </div>
      )}

      {/* press-to-place board (rebuild only) */}
      {phase === 'rebuild' && (
        <div style={S.dock}>
          <div style={S.dockHandle} aria-hidden="true" />
          <div style={S.dockRow}>
            <span style={S.dockLabel}><span style={S.dockIcon} aria-hidden="true">📍</span>{t.places}</span>
            <div style={S.dockChips}>
              {story.paletteBgs.map((id) => (
                <button key={id} type="button" style={{ ...S.bgChip, ...(isSel('bg', id) ? S.chipSel : null) }} onClick={() => pickSel('bg', id)}>
                  <BgSwatch bgId={id} size={54} />
                </button>
              ))}
            </div>
          </div>
          <div style={S.dockRow}>
            <span style={S.dockLabel}><span style={S.dockIcon} aria-hidden="true">🙂</span>{t.characters}</span>
            <div style={S.dockChips}>
              {story.paletteChars.map((id) => (
                <button key={id} type="button" style={{ ...S.charChip, ...(isSel('char', id) ? S.chipSel : null) }} onClick={() => pickSel('char', id)}>
                  <div style={S.charChipArt}><CharacterArt id={id} size={48} /></div>
                  <span style={S.chipName}>{nameOf(id)}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={S.dockRow}>
            <span style={S.dockLabel}><span style={S.dockIcon} aria-hidden="true">⚡</span>{t.actions}</span>
            <div style={S.dockChips}>
              {story.paletteActions.map((id) => (
                <button key={id} type="button" style={{ ...S.actChip, ...(isSel('action', id) ? S.chipSel : null) }} onClick={() => pickSel('action', id)}>
                  <span style={{ fontSize: 24, lineHeight: 1 }}>{actEmoji(id)}</span>
                  <span style={S.chipName}>{actWord(id)}</span>
                </button>
              ))}
              <button type="button" style={{ ...S.eraseChip, ...(isSel('erase', 'x') ? S.chipSel : null) }} onClick={() => pickSel('erase', 'x')}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🧽</span>
                <span style={S.chipName}>{t.erase}</span>
              </button>
            </div>
          </div>
          <button type="button" style={{ ...S.checkBtn, ...(allFilled ? null : S.primaryOff) }} disabled={!allFilled} onClick={check}>
            {allFilled ? t.check : `${t.check} · ${filledCount}/${len}`}
          </button>
        </div>
      )}
    </div>
  );
}

export default function StoryGridGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardPoints } = useApp();
  const isAr = currentLang === 'ar';
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
      renderEngine={(p) => (
        <StoryEngine key={`${p.mode}-${p.diff}-${p.level}-${p.seed}`} {...p} isAr={isAr} playSfx={playSfx} awardPoints={awardPoints} />
      )}
    />
  );
}

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--color-training-palette-surface, #fff7f2)', color: '#2d2d2d', fontFamily: "'Outfit', system-ui, sans-serif" },
  center: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 12, padding: '14px 18px 28px', overflowY: 'auto' },
  storyTitle: { fontFamily: "'Bangers', 'Outfit', system-ui, sans-serif", fontSize: 24, letterSpacing: 0.5, color: '#3a2c18', textAlign: 'center', lineHeight: 1.1, padding: '0 8px', textShadow: '1px 1px 0 rgba(255,255,255,0.6)' },
  watchCap: { fontWeight: 700, fontSize: 15, color: '#4a3c28', textAlign: 'center', animation: 'sg-bubble 0.4s ease-out', minHeight: 44, width: '100%', maxWidth: 380, lineHeight: 1.42, padding: '0 8px', overflowWrap: 'break-word', flexShrink: 0 },
  timerChip: { fontWeight: 900, fontSize: 14, color: '#7a5a1e', background: '#fff1d8', border: '2px solid #e3c489', borderRadius: 999, padding: '4px 14px' },
  timerLow: { color: '#b53b2f', background: '#ffe2dc', borderColor: '#e8a89c' },
  watchNav: { display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  navArrow: { width: 44, height: 44, borderRadius: '50%', border: '2px solid #1a1208', background: '#fffdf8', fontWeight: 900, fontSize: 24, lineHeight: 1, cursor: 'pointer', color: '#2d2210', boxShadow: '2px 2px 0 #1a1208', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navOff: { opacity: 0.32, boxShadow: 'none', cursor: 'default' },
  dots: { display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 220 },
  dot: { width: 11, height: 11, borderRadius: '50%', border: 'none', background: '#d8cab4', cursor: 'pointer', padding: 0, transition: 'transform 0.12s, background 0.12s' },
  dotOn: { background: '#b9842f', transform: 'scale(1.4)' },
  gameBody: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 10, padding: '10px 14px 16px', overflowY: 'auto' },
  instr: { fontWeight: 800, fontSize: 13.5, color: '#5a4a32', textAlign: 'center', padding: '7px 16px', background: '#fffdf8', border: '2px solid #ece2d2', borderRadius: 999, boxShadow: '2px 2px 0 rgba(26,18,8,0.07)', maxWidth: '94%' },
  grid: { display: 'grid', gap: 14, justifyContent: 'center', justifyItems: 'center' },
  refCap: { fontSize: 10.5, fontWeight: 700, color: '#6a5a40', textAlign: 'center', lineHeight: 1.25, marginTop: 3, padding: '0 2px', overflowWrap: 'break-word' },
  badge: { position: 'absolute', top: -8, insetInlineStart: -8, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8' },
  tapPlus: { position: 'absolute', bottom: 4, insetInlineEnd: 4, width: 22, height: 22, borderRadius: '50%', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8', pointerEvents: 'none' },
  storyWas: { fontWeight: 800, fontSize: 13, color: '#2e8b57', marginTop: 6 },
  // press-to-place board (builder tray)
  dock: { flex: '0 0 auto', background: 'linear-gradient(180deg,#fffdf8 0%,#fff6ea 100%)', borderTop: '2px solid #e3d6c4', borderRadius: '20px 20px 0 0', padding: '6px 14px max(12px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 9, boxShadow: '0 -6px 20px rgba(26,18,8,0.1)' },
  dockHandle: { width: 44, height: 5, borderRadius: 999, background: '#e3d6c4', margin: '0 auto 2px' },
  dockRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dockLabel: { flex: '0 0 66px', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, fontWeight: 900, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.4 },
  dockIcon: { fontSize: 14, lineHeight: 1 },
  dockChips: { display: 'flex', gap: 7, flexWrap: 'nowrap', overflowX: 'auto', flex: 1, paddingBottom: 3, scrollbarWidth: 'none' },
  dockDivider: { height: 1, background: '#ece2d2' },
  bgChip: { flex: '0 0 auto', padding: 4, borderRadius: 13, border: '2px solid #e3d6c4', background: '#fff', cursor: 'pointer', lineHeight: 0 },
  charChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '3px 7px 4px', borderRadius: 13, border: '2px solid #e3d6c4', background: '#fff', cursor: 'pointer' },
  charChipArt: { width: 50, height: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' },
  actChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 10px', borderRadius: 13, border: '2px solid #e3d6c4', background: '#fff', cursor: 'pointer', minWidth: 58 },
  eraseChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '7px 10px', borderRadius: 13, border: '2px solid #d8c4c0', background: '#fff6f4', cursor: 'pointer', minWidth: 58 },
  chipName: { fontSize: 10.5, fontWeight: 800, color: '#5a4a32', whiteSpace: 'nowrap' },
  chipSel: { borderColor: '#b9842f', background: '#fff1d8', boxShadow: '0 0 0 3px rgba(185,132,47,0.32)', transform: 'translateY(-2px)' },
  checkBtn: { alignSelf: 'stretch', marginTop: 3, padding: '13px 20px', borderRadius: 15, border: '3px solid #1a1208', background: 'linear-gradient(180deg,#38a866,#2e8b57)', color: '#fff', fontWeight: 900, fontSize: 16, letterSpacing: 0.5, cursor: 'pointer', boxShadow: '4px 4px 0 #1a1208' },
  primary: { padding: '11px 22px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  primaryOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default' },
};
