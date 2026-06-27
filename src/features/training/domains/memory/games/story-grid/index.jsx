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
 * Cast: Kawkab, Star, Noor (fox), Ba (male), Ma (female).
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
export const BACKGROUNDS = {
  home: { en: 'Home', ar: 'البيت', chip: '🏠', bg: 'linear-gradient(180deg,#fdeede 0%,#f3d7b6 100%)', ground: '#c9a878', amb: [{ e: '🛋️', s: { top: 12, insetInlineStart: 12, fontSize: 22 } }, { e: '🪟', s: { top: 8, insetInlineEnd: 12, fontSize: 22, opacity: 0.85 } }] },
  street: { en: 'Street', ar: 'الطريق', chip: '🚸', bg: 'linear-gradient(180deg,#cfe9ff 0%,#bfe0c8 100%)', ground: '#9a9488', amb: [{ e: '🏠', s: { top: 10, insetInlineStart: 12, fontSize: 22 } }, { e: '🌳', s: { top: 8, insetInlineEnd: 12, fontSize: 24 } }] },
  school: { en: 'School', ar: 'المدرسة', chip: '🏫', bg: 'linear-gradient(180deg,#dfeffb 0%,#b9dcf3 100%)', ground: '#b7b0a2', amb: [{ e: '🏫', s: { top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 28 } }, { e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 22 } }] },
  classroom: { en: 'Classroom', ar: 'الصف', chip: '📚', bg: 'linear-gradient(180deg,#fbf1dc 0%,#f0dfc0 100%)', ground: '#caa978', amb: [{ e: '🟩', s: { top: 8, insetInlineStart: 10, fontSize: 26 } }, { e: '📚', s: { top: 12, insetInlineEnd: 12, fontSize: 22 } }] },
  kitchen: { en: 'Kitchen', ar: 'مطبخ', chip: '🍽️', bg: 'linear-gradient(180deg,#fff3e0 0%,#ffd9a8 100%)', ground: '#e7b878', amb: [{ e: '🍽️', s: { top: 10, insetInlineStart: 12, fontSize: 22, opacity: 0.85 } }, { e: '🪟', s: { top: 8, insetInlineEnd: 12, fontSize: 22, opacity: 0.8 } }] },
  garden: { en: 'Garden', ar: 'حديقة', chip: '🌳', bg: 'linear-gradient(180deg,#e3f3d6 0%,#bfe3a4 100%)', ground: '#86b865', amb: [{ e: '🌳', s: { top: 10, insetInlineStart: 12, fontSize: 24 } }, { e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 22 } }] },
  park: { en: 'Park', ar: 'منتزه', chip: '⚽', bg: 'linear-gradient(180deg,#cdeafe 0%,#a3d4ff 100%)', ground: '#7ec268', amb: [{ e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 24 } }, { e: '☁️', s: { top: 16, insetInlineStart: 16, fontSize: 20, opacity: 0.9 } }] },
  beach: { en: 'Beach', ar: 'الشاطئ', chip: '🏖️', bg: 'linear-gradient(180deg,#bfe9ff 0%,#ffe9bd 100%)', ground: '#f2dca0', amb: [{ e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 24 } }, { e: '🌴', s: { top: 8, insetInlineStart: 10, fontSize: 24 } }, { e: '🌊', s: { bottom: '22%', insetInlineStart: 14, fontSize: 16, opacity: 0.8 } }] },
  pool: { en: 'Pool', ar: 'المسبح', chip: '🏊', bg: 'linear-gradient(180deg,#bfeefc 0%,#6cc7e8 100%)', ground: '#3aa6cf', amb: [{ e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 22 } }, { e: '💦', s: { top: 24, insetInlineStart: 16, fontSize: 16, animation: 'sg-twinkle 1.8s ease-in-out infinite' } }] },
  museum: { en: 'Museum', ar: 'المتحف', chip: '🖼️', bg: 'linear-gradient(180deg,#efe7f7 0%,#d8c7ec 100%)', ground: '#b6a0cf', amb: [{ e: '🖼️', s: { top: 10, insetInlineStart: 12, fontSize: 22 } }, { e: '🏺', s: { top: 12, insetInlineEnd: 12, fontSize: 20 } }] },
  library: { en: 'Library', ar: 'المكتبة', chip: '📖', bg: 'linear-gradient(180deg,#f6ead6 0%,#e6cfa6 100%)', ground: '#bd9a68', amb: [{ e: '📚', s: { top: 10, insetInlineStart: 12, fontSize: 22 } }, { e: '📚', s: { top: 10, insetInlineEnd: 12, fontSize: 22 } }] },
  space: { en: 'Space', ar: 'الفضاء', chip: '🌌', bg: 'linear-gradient(180deg,#0c1230 0%,#26305e 100%)', ground: '#1a2348', dark: true, amb: [{ e: '⭐', s: { top: 10, insetInlineStart: 16, fontSize: 14, animation: 'sg-twinkle 2s ease-in-out infinite' } }, { e: '🪐', s: { top: 12, insetInlineEnd: 14, fontSize: 22 } }, { e: '✨', s: { top: 34, insetInlineEnd: 40, fontSize: 12, animation: 'sg-twinkle 1.8s ease-in-out 0.6s infinite' } }] },
  stage: { en: 'Stage', ar: 'مسرح', chip: '🪩', bg: 'linear-gradient(180deg,#3a1d52 0%,#7a4aa0 100%)', ground: '#46285f', dark: true, amb: [{ e: '🪩', s: { top: 6, insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 24, animation: 'sg-spin 1.2s linear infinite' } }, { e: '✨', s: { top: 30, insetInlineEnd: 22, fontSize: 14, animation: 'sg-twinkle 1.6s ease-in-out infinite' } }] },
  bedroom: { en: 'Bedroom', ar: 'غرفة النوم', chip: '🛏️', bg: 'linear-gradient(180deg,#e9def5 0%,#c7b6e0 100%)', ground: '#a890c6', amb: [{ e: '🛏️', s: { bottom: '20%', insetInlineEnd: 10, fontSize: 24 } }, { e: '🌙', s: { top: 8, insetInlineStart: 12, fontSize: 20 } }] },
  night: { en: 'Night', ar: 'ليل', chip: '🌙', bg: 'linear-gradient(180deg,#162447 0%,#42598c 100%)', ground: '#2b3a63', dark: true, amb: [{ e: '🌙', s: { top: 10, insetInlineEnd: 14, fontSize: 26 } }, { e: '⭐', s: { top: 22, insetInlineStart: 18, fontSize: 14, animation: 'sg-twinkle 2.2s ease-in-out infinite' } }] },
};
const BG_LIST = Object.keys(BACKGROUNDS);

export const CHARS = [
  { id: 'kawkab', en: 'Kawkab', ar: 'كوكب' },
  { id: 'star', en: 'Star', ar: 'ستار' },
  { id: 'noor', en: 'Noor', ar: 'نور' },
  { id: 'ba', en: 'Ba', ar: 'با' },
  { id: 'ma', en: 'Ma', ar: 'ما' },
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
  if (id === 'ba') return <PersonCharacter variant="male" size={size} mood={mood} />;
  if (id === 'ma') return <PersonCharacter variant="female" size={size} mood={mood} />;
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

export function PanelStage({ panel, size, say }) {
  const cfg = panel.bg ? BACKGROUNDS[panel.bg] : null;
  const big = size > 140;
  const chars = panel.chars || [];
  const empty = !panel.bg && chars.length === 0;
  const two = chars.length >= 2;
  const charSize = two ? size * 0.42 : size * 0.5;
  return (
    <div style={{ position: 'relative', width: size, height: size * 0.82, borderRadius: big ? 16 : 12, overflow: 'hidden', background: cfg ? cfg.bg : '#fbf5ec', border: `2px ${empty ? 'dashed' : 'solid'} #cdbfa6`, boxShadow: big ? '4px 4px 0 rgba(26,18,8,0.2)' : '2px 2px 0 rgba(26,18,8,0.16)' }}>
      {cfg && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '22%', background: cfg.ground, opacity: 0.9 }} />}
      {cfg && cfg.amb.map((a, i) => (
        <span key={i} style={{ position: 'absolute', lineHeight: 1, pointerEvents: 'none', ...(big ? a.s : { ...a.s, fontSize: (a.s.fontSize || 18) * 0.62 }) }}>{a.e}</span>
      ))}
      {chars.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '1%', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: two ? size * 0.04 : 0 }}>
          {chars.map((id, idx) => (
            <div key={idx} style={{ animation: actionCharAnim(panel.action), transformOrigin: 'center bottom' }}>
              <CharacterArt id={id} size={charSize} mood={moodFor(panel.action)} />
            </div>
          ))}
        </div>
      )}
      {chars.length > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '1%', height: size * 0.5, pointerEvents: 'none', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: size * 0.5, height: '100%' }}><PropLayer action={panel.action} /></div>
        </div>
      )}
      {say && big && (
        <div style={{ position: 'absolute', top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)', maxWidth: '92%', animation: 'sg-bubble 0.45s ease-out' }}>
          <div style={{ background: '#fffdf8', border: '2px solid #1a1208', borderRadius: 12, padding: '4px 11px', fontWeight: 800, fontSize: 13.5, color: '#3a2c18', textAlign: 'center', lineHeight: 1.25, boxShadow: '2px 2px 0 rgba(26,18,8,0.18)' }}>{say}</div>
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
const STORIES = [
  { id: 'big-idea', beats: [
    { bg: 'library', who: ['H'], action: 'read', narr: { en: '{H} found an amazing book about turning a tiny shop into a big one.', ar: 'وجد {H} كتاباً مدهشاً عن تحويل متجر صغير إلى متجر كبير.' }, say: { en: 'Wow, what an idea!', ar: 'واو، يا لها من فكرة!' } },
    { bg: 'street', who: ['H'], action: 'walk', narr: { en: 'Bursting with the idea, {H} hurried across town to find {F}.', ar: 'وقد ملأته الفكرة، أسرع {H} عبر المدينة بحثاً عن {F}.' } },
    { bg: 'home', who: ['H', 'F'], action: 'tell', narr: { en: '{H} told {F} all about the clever plan in the book.', ar: 'أخبر {H} {F} بكل ما في الكتاب من خطة ذكية.' }, say: { en: 'You have to read this, {F}!', ar: 'عليك أن تقرأ هذا يا {F}!' } },
    { bg: 'home', who: ['F'], action: 'read', narr: { en: '{F} started reading, eyes wide with new ideas.', ar: 'بدأ {F} القراءة وعيناه تتسعان بالأفكار الجديدة.' } },
    { bg: 'park', who: ['H', 'F'], action: 'build', narr: { en: 'Together they built their very first little stand.', ar: 'وبنيا معاً أوّل كشك صغير لهما.' }, say: { en: 'Let’s build it together!', ar: 'لنبنِه معاً!' } },
  ] },
  { id: 'race-day', beats: [
    { bg: 'kitchen', who: ['H'], action: 'eat', narr: { en: '{H} ate a good breakfast before the big race.', ar: 'تناول {H} فطوراً جيداً قبل السباق الكبير.' } },
    { bg: 'street', who: ['H', 'F'], action: 'greet', narr: { en: 'At the start line, {H} wished {F} good luck.', ar: 'عند خط البداية، تمنّى {H} ل{F} التوفيق.' }, say: { en: 'Good luck, {F}!', ar: 'حظاً موفقاً يا {F}!' } },
    { bg: 'park', who: ['H', 'F'], action: 'play', narr: { en: 'They raced hard — until {F} tripped and fell.', ar: 'تسابقا بقوة — حتى تعثّر {F} ووقع.' } },
    { bg: 'park', who: ['H', 'F'], action: 'help', narr: { en: '{H} stopped to help {F} back onto their feet.', ar: 'توقّف {H} ليساعد {F} على النهوض.' }, say: { en: 'I’ve got you!', ar: 'أنا معك!' } },
    { bg: 'park', who: ['H', 'F'], action: 'cheer', narr: { en: 'They crossed the line together — true friends both win.', ar: 'عبَرا الخط معاً — والأصدقاء الحقيقيون يفوزون معاً.' } },
  ] },
  { id: 'garden-share', beats: [
    { bg: 'garden', who: ['H'], action: 'plant', narr: { en: '{H} planted tiny seeds and watered them every day.', ar: 'زرع {H} بذوراً صغيرة وسقاها كل يوم.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'help', narr: { en: '{F} came by and helped pull the weeds while they waited.', ar: 'مرّ {F} وساعد في نزع الأعشاب وهما ينتظران.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'find', narr: { en: 'Weeks later, ripe vegetables had appeared!', ar: 'وبعد أسابيع، ظهرت خضروات ناضجة!' }, say: { en: 'They grew!', ar: 'لقد نمت!' } },
    { bg: 'kitchen', who: ['H', 'F'], action: 'cook', narr: { en: 'They cooked a big meal from their own harvest.', ar: 'طبخا وجبة كبيرة من محصولهما.' } },
    { bg: 'home', who: ['H', 'F'], action: 'eat', narr: { en: 'And shared it proudly at the table.', ar: 'وتشاركاها بفخر على المائدة.' }, say: { en: 'We grew this!', ar: 'نحن زرعنا هذا!' } },
  ] },
  { id: 'stage-fright', beats: [
    { bg: 'bedroom', who: ['H'], action: 'read', narr: { en: '{H} practiced lines, but felt nervous about tonight’s show.', ar: 'تدرّب {H} على دوره لكنه شعر بالتوتر من عرض الليلة.' }, say: { en: 'What if I forget?', ar: 'ماذا لو نسيت؟' } },
    { bg: 'street', who: ['H', 'F'], action: 'tell', narr: { en: '{F} walked with {H} and cheered them on.', ar: 'مشى {F} مع {H} وشجّعه.' }, say: { en: 'You can do it, {H}!', ar: 'تستطيع يا {H}!' } },
    { bg: 'stage', who: ['H'], action: 'sing', narr: { en: 'On stage, {H} took a breath and sang beautifully.', ar: 'على المسرح، أخذ {H} نفساً وغنّى ببراعة.' } },
    { bg: 'stage', who: ['H', 'F'], action: 'cheer', narr: { en: 'The crowd cheered — courage paid off!', ar: 'هتف الجمهور — وأثمرت الشجاعة!' }, say: { en: 'Bravo {H}!', ar: 'أحسنت {H}!' } },
  ] },
  { id: 'inventor', beats: [
    { bg: 'home', who: ['H'], action: 'idea', narr: { en: '{H} dreamed up a machine to water the whole garden.', ar: 'تخيّل {H} آلة تسقي الحديقة كلها.' }, say: { en: 'I’ve got it!', ar: 'وجدتها!' } },
    { bg: 'garden', who: ['H'], action: 'build', narr: { en: 'All afternoon, {H} built it piece by piece.', ar: 'طوال العصر، بنى {H} الآلة قطعةً قطعة.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'help', narr: { en: '{F} came over and helped connect the last pipe.', ar: 'جاء {F} وساعد في وصل آخر أنبوب.' } },
    { bg: 'garden', who: ['H', 'F'], action: 'cheer', narr: { en: 'It worked — water sprayed everywhere, and they laughed!', ar: 'نجحت — وتطاير الماء في كل مكان، فضحكا!' } },
  ] },
  { id: 'recipe', beats: [
    { bg: 'library', who: ['H'], action: 'read', narr: { en: '{H} learned a special soup recipe from an old cookbook.', ar: 'تعلّم {H} وصفة حساء خاصة من كتاب طبخ قديم.' } },
    { bg: 'kitchen', who: ['H'], action: 'cook', narr: { en: 'In the kitchen, {H} cooked it carefully for a friend.', ar: 'في المطبخ، طبخها {H} بعناية لأجل صديق.' }, say: { en: 'A little of this…', ar: 'قليل من هذا…' } },
    { bg: 'home', who: ['H', 'F'], action: 'eat', narr: { en: '{H} surprised {F}, who hadn’t been feeling well.', ar: 'فاجأ {H} {F} الذي لم يكن على ما يرام.' }, say: { en: 'This is for you, {F}!', ar: 'هذا لك يا {F}!' } },
    { bg: 'home', who: ['H', 'F'], action: 'hug', narr: { en: 'Warmed by the kindness, {F} felt much better.', ar: 'وبفضل اللطف، شعر {F} بتحسّن كبير.' } },
  ] },
  { id: 'star-map', beats: [
    { bg: 'library', who: ['H'], action: 'read', narr: { en: '{H} read about far-off stars and couldn’t stop wondering.', ar: 'قرأ {H} عن نجوم بعيدة ولم يتوقف عن التساؤل.' } },
    { bg: 'space', who: ['H', 'F'], action: 'fly', narr: { en: '{H} and {F} blasted off to see them up close.', ar: 'انطلق {H} و{F} ليرياها عن قرب.' }, say: { en: 'Come see, {F}!', ar: 'تعال لترى يا {F}!' } },
    { bg: 'space', who: ['H', 'F'], action: 'find', narr: { en: 'They discovered a comet streaking past.', ar: 'اكتشفا مذنّباً يمرّ مسرعاً.' }, say: { en: 'Look at that one!', ar: 'انظر إلى تلك!' } },
    { bg: 'bedroom', who: ['H'], action: 'sleep', narr: { en: 'Home again, {H} fell asleep dreaming of galaxies.', ar: 'وعند العودة، نام {H} يحلم بالمجرّات.' } },
  ] },
  { id: 'good-deed', beats: [
    { bg: 'street', who: ['H', 'F'], action: 'find', narr: { en: '{H} noticed {F} drop a whole bag of books on the street.', ar: 'لاحظ {H} أن {F} أسقط حقيبة كتب كاملة في الطريق.' }, say: { en: 'You dropped these!', ar: 'لقد أسقطت هذه!' } },
    { bg: 'street', who: ['H', 'F'], action: 'help', narr: { en: '{H} kindly helped gather every last one.', ar: 'ساعد {H} بلطف في جمعها واحدةً واحدة.' } },
    { bg: 'home', who: ['H', 'F'], action: 'read', narr: { en: 'Grateful, {F} invited {H} to read together.', ar: 'وامتناناً، دعا {F} {H} ليقرآ معاً.' }, say: { en: 'Read with me?', ar: 'تقرأ معي؟' } },
  ] },
  { id: 'first-painting', beats: [
    { bg: 'home', who: ['H'], action: 'idea', narr: { en: '{H} dreamed of painting the ocean at sunset.', ar: 'حلم {H} برسم المحيط عند الغروب.' }, say: { en: 'I’ll paint the sea!', ar: 'سأرسم البحر!' } },
    { bg: 'beach', who: ['H'], action: 'paint', narr: { en: 'At the beach, {H} painted the waves all day long.', ar: 'على الشاطئ، رسم {H} الأمواج طوال اليوم.' } },
    { bg: 'museum', who: ['H', 'F'], action: 'cheer', narr: { en: '{F} hung it proudly in the little museum.', ar: 'علّقها {F} بفخر في المتحف الصغير.' }, say: { en: 'It’s beautiful, {H}!', ar: 'إنها جميلة يا {H}!' } },
  ] },
  { id: 'bedtime-explorer', beats: [
    { bg: 'kitchen', who: ['H'], action: 'eat', narr: { en: 'After a warm dinner, {H} got ready for bed.', ar: 'بعد عشاء دافئ، استعدّ {H} للنوم.' } },
    { bg: 'bedroom', who: ['H'], action: 'read', narr: { en: '{H} read one more page about brave explorers.', ar: 'قرأ {H} صفحة أخيرة عن مستكشفين شجعان.' }, say: { en: 'Just one more!', ar: 'صفحة أخيرة فقط!' } },
    { bg: 'bedroom', who: ['H'], action: 'sleep', narr: { en: '{H} drifted off to dream of far-away adventures.', ar: 'وغفا {H} ليحلم بمغامرات بعيدة.' } },
  ] },
];

const EMPTY = { bg: null, chars: [], action: null };
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function makeStory(n, rng, distract) {
  const pool = STORIES.filter((s) => s.beats.length === n);
  const src = pool.length ? pool : STORIES;
  const script = src[Math.floor(rng() * src.length)];
  const cast = shuffleR(CHARS.map((c) => c.id), rng);
  const roleChar = { H: cast[0], F: cast[1] };
  const target = script.beats.map((b) => ({ bg: b.bg, chars: b.who.map((r) => roleChar[r]), action: b.action, say: b.say || null }));
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
    roleChar,
    target,
    paletteBgs: shuffleR(BG_LIST.filter((b) => palBg.has(b)), rng),
    paletteChars: shuffleR(CHARS.map((c) => c.id).filter((c) => palChar.has(c)), rng),
    paletteActions: shuffleR(ACTIONS.filter((a) => palAct.has(a.id)).map((a) => a.id), rng),
  };
}

// ── difficulty ──
const LEVEL_BASE = {
  easy: { len: 3, d0: 0, d1: 1, m0: 30, m1: 26 },
  med: { len: 4, d0: 1, d1: 3, m0: 28, m1: 22 },
  hard: { len: 5, d0: 2, d1: 4, m0: 24, m1: 18 },
};
function levelCfg(diff, level) {
  const b = LEVEL_BASE[diff] || LEVEL_BASE.med;
  const f = (((level || 1) - 1) / 99);
  return { len: b.len, distract: Math.round(b.d0 + (b.d1 - b.d0) * f), memo: Math.round(b.m0 + (b.m1 - b.m0) * f) };
}
function survivalCfg(stage) {
  return { len: Math.min(5, 3 + Math.floor(stage / 2)), distract: Math.min(5, Math.floor(stage / 1.5)), memo: Math.max(16, Math.round(30 - stage * 1.4)) };
}
function passCfgFor() { return { len: 4, distract: 2, memo: 26 }; }

const gridCols = (n) => (n === 4 ? 2 : Math.min(n, 3));
const frameSize = () => (typeof window !== 'undefined' && window.innerWidth < 380 ? 90 : 104);
const bigSize = () => Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 40 : 280);

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

  const fill = useCallback((s) => (story ? s.replace(/\{H\}/g, nameOf(story.roleChar.H)).replace(/\{F\}/g, nameOf(story.roleChar.F)) : s),
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
        return { ...p, chars: [...p.chars, sel.id].slice(-2) };
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

  const allFilled = panels.length === len && panels.every((p) => p.bg && p.chars.length > 0 && p.action);
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
  const fsz = frameSize();
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
            <div style={{ ...S.timerChip, ...(timeLeft <= 5 ? S.timerLow : null) }}>⏱ {timeLeft}s · {t.watchTag}</div>
            <div style={{ position: 'relative' }}>
              <span style={S.badge}>{watchIdx + 1}</span>
              <PanelStage panel={g} size={bigSize()} say={resolveSay(g)} />
            </div>
            <div key={watchIdx} style={S.watchCap}>{resolveNarr(g) || `${t.seq(watchIdx, len)} ${narrate(g)}`}</div>
            <div style={S.dots}>{story.target.map((_, i) => (
              <button key={i} type="button" style={{ ...S.dot, ...(i === watchIdx ? S.dotOn : null) }} onClick={() => { playSfx?.('click'); setWatchIdx(i); }}>{i + 1}</button>
            ))}</div>
            <div style={S.navRow}>
              <button type="button" style={{ ...S.navBtn, ...(watchIdx === 0 ? S.navOff : null) }} disabled={watchIdx === 0} onClick={() => { playSfx?.('click'); setWatchIdx((w) => Math.max(0, w - 1)); }}>{t.prev}</button>
              <button type="button" style={{ ...S.navBtn, ...(watchIdx >= len - 1 ? S.navOff : null) }} disabled={watchIdx >= len - 1} onClick={() => { playSfx?.('click'); setWatchIdx((w) => Math.min(len - 1, w + 1)); }}>{t.next}</button>
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
                  <div style={{ borderRadius: 14, outline: !reveal && sel ? '2px dashed #b9842f' : ok ? '3px solid #2e8b57' : bad ? '3px solid #d23b3b' : 'none', outlineOffset: 2, cursor: !reveal ? 'pointer' : 'default' }}>
                    <PanelStage panel={p} size={fsz} />
                  </div>
                  {!reveal && p.chars.length > 0 && !p.action && <span style={S.tapPlus}>＋</span>}
                </div>
              );
            })}
          </div>

          {reveal && (
            <>
              <div style={S.storyWas}>{t.storyWas}</div>
              <div style={{ ...S.grid, gridTemplateColumns: `repeat(${gridCols(len)}, max-content)` }}>
                {story.target.map((g, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <span style={{ ...S.badge, background: '#2e8b57' }}>{i + 1}</span>
                    <PanelStage panel={g} size={fsz} />
                  </div>
                ))}
              </div>
              <button type="button" style={S.primary} onClick={advanceRound}>{t.cont}</button>
            </>
          )}
        </div>
      )}

      {/* press-to-place board (rebuild only) */}
      {phase === 'rebuild' && (
        <div style={S.dock}>
          <div style={S.dockRow}>
            <span style={S.dockLabel}>{t.places}</span>
            <div style={S.dockChips}>
              {story.paletteBgs.map((id) => (
                <button key={id} type="button" style={{ ...S.bgChip, ...(isSel('bg', id) ? S.chipSel : null) }} onClick={() => pickSel('bg', id)}>
                  <BgSwatch bgId={id} size={48} />
                </button>
              ))}
            </div>
          </div>
          <div style={S.dockDivider} />
          <div style={S.dockRow}>
            <span style={S.dockLabel}>{t.characters}</span>
            <div style={S.dockChips}>
              {story.paletteChars.map((id) => (
                <button key={id} type="button" style={{ ...S.charChip, ...(isSel('char', id) ? S.chipSel : null) }} onClick={() => pickSel('char', id)}>
                  <div style={S.charChipArt}><CharacterArt id={id} size={44} /></div>
                  <span style={S.chipName}>{nameOf(id)}</span>
                </button>
              ))}
            </div>
          </div>
          <div style={S.dockDivider} />
          <div style={S.dockRow}>
            <span style={S.dockLabel}>{t.actions}</span>
            <div style={S.dockChips}>
              {story.paletteActions.map((id) => (
                <button key={id} type="button" style={{ ...S.actChip, ...(isSel('action', id) ? S.chipSel : null) }} onClick={() => pickSel('action', id)}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>{actEmoji(id)}</span>
                  <span style={S.chipName}>{actWord(id)}</span>
                </button>
              ))}
              <button type="button" style={{ ...S.eraseChip, ...(isSel('erase', 'x') ? S.chipSel : null) }} onClick={() => pickSel('erase', 'x')}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>🧽</span>
                <span style={S.chipName}>{t.erase}</span>
              </button>
            </div>
          </div>
          <button type="button" style={{ ...S.checkBtn, ...(allFilled ? null : S.primaryOff) }} disabled={!allFilled} onClick={check}>{t.check}</button>
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
  center: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '12px 18px 24px', overflowY: 'auto' },
  watchCap: { fontWeight: 700, fontSize: 15, color: '#4a3c28', textAlign: 'center', animation: 'sg-bubble 0.4s ease-out', minHeight: 40, maxWidth: 340, lineHeight: 1.35, padding: '0 6px' },
  timerChip: { fontWeight: 900, fontSize: 14, color: '#7a5a1e', background: '#fff1d8', border: '2px solid #e3c489', borderRadius: 999, padding: '4px 14px' },
  timerLow: { color: '#b53b2f', background: '#ffe2dc', borderColor: '#e8a89c' },
  navRow: { display: 'flex', gap: 10, justifyContent: 'center' },
  navBtn: { padding: '10px 22px', borderRadius: 12, border: '2px solid #1a1208', background: '#fffdf8', fontWeight: 900, fontSize: 15, cursor: 'pointer', color: '#2d2210', boxShadow: '2px 2px 0 #1a1208', minWidth: 96 },
  navOff: { opacity: 0.4, boxShadow: 'none', cursor: 'default' },
  dots: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 24, height: 24, borderRadius: '50%', border: '2px solid #d8cab4', background: '#fff', color: '#b3a288', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  dotOn: { background: '#b9842f', color: '#fff', borderColor: '#b9842f' },
  gameBody: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '8px 14px 10px', overflowY: 'auto' },
  instr: { fontWeight: 800, fontSize: 14, color: '#5a4a32', textAlign: 'center', minHeight: 20, padding: '0 8px' },
  grid: { display: 'grid', gap: 12, justifyContent: 'center', justifyItems: 'center' },
  badge: { position: 'absolute', top: -8, insetInlineStart: -8, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8' },
  tapPlus: { position: 'absolute', bottom: 4, insetInlineEnd: 4, width: 22, height: 22, borderRadius: '50%', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8', pointerEvents: 'none' },
  storyWas: { fontWeight: 800, fontSize: 13, color: '#2e8b57', marginTop: 6 },
  // press-to-place board
  dock: { flex: '0 0 auto', background: '#fffaf3', borderTop: '2px solid #e3d6c4', padding: '8px 12px max(12px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 6, boxShadow: '0 -4px 14px rgba(26,18,8,0.07)' },
  dockRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dockLabel: { flex: '0 0 56px', fontSize: 10.5, fontWeight: 900, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.6 },
  dockChips: { display: 'flex', gap: 6, flexWrap: 'nowrap', overflowX: 'auto', flex: 1, paddingBottom: 2 },
  dockDivider: { height: 1, background: '#ece2d2' },
  bgChip: { flex: '0 0 auto', padding: 3, borderRadius: 11, border: '2px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer', lineHeight: 0 },
  charChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, padding: '2px 6px 3px', borderRadius: 11, border: '2px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer' },
  charChipArt: { width: 46, height: 46, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' },
  actChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '6px 9px', borderRadius: 11, border: '2px solid #e3d6c4', background: '#fffdf8', cursor: 'pointer', minWidth: 52 },
  eraseChip: { flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '6px 9px', borderRadius: 11, border: '2px solid #d8c4c0', background: '#fff6f4', cursor: 'pointer', minWidth: 52 },
  chipName: { fontSize: 10, fontWeight: 800, color: '#5a4a32', whiteSpace: 'nowrap' },
  chipSel: { borderColor: '#b9842f', background: '#fff1d8', boxShadow: '0 0 0 3px rgba(185,132,47,0.3)', transform: 'translateY(-2px)' },
  checkBtn: { alignSelf: 'center', marginTop: 2, padding: '10px 30px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  primary: { padding: '11px 22px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  primaryOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default' },
};
