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
 *             places, things happen, they react to each other via speech bubbles).
 *             A 30s-ish memorize timer; flip panels with Prev/Next; Done to finish.
 *   REBUILD — grab & place: drag the PLACE + CHARACTER(S) into each panel, tap to
 *             set the ACTION. Harder levels mix DISTRACTOR pieces into the palette.
 *   REVEAL  — each panel scored against the story.
 *
 * Wrapped in the shared 3-mode flow (Survival / Levels / Pass n Play) so it
 * matches the other training games. Stories are seeded → deterministic, so
 * Pass-n-Play players all rebuild the exact same story.
 *
 * Cast: Kawkab, Star, Noor (fox), Ba (male), Ma (female).
 * Self-contained: inline styles, CSS keyframes only, no image assets.
 */

const ANIM_CSS = `
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
`;

// ── CONTENT ──────────────────────────────────────────────────────────────
const BACKGROUNDS = {
  street: { en: 'Street', ar: 'الطريق', chip: '🏠', bg: 'linear-gradient(180deg,#cfe9ff 0%,#bfe0c8 100%)', ground: '#9a9488', amb: [{ e: '🏠', s: { top: 10, insetInlineStart: 12, fontSize: 24 } }, { e: '🌳', s: { top: 8, insetInlineEnd: 12, fontSize: 24 } }] },
  school: { en: 'School', ar: 'المدرسة', chip: '🏫', bg: 'linear-gradient(180deg,#dfeffb 0%,#b9dcf3 100%)', ground: '#b7b0a2', amb: [{ e: '🏫', s: { top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 28 } }, { e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 22 } }] },
  classroom: { en: 'Classroom', ar: 'الصف', chip: '📚', bg: 'linear-gradient(180deg,#fbf1dc 0%,#f0dfc0 100%)', ground: '#caa978', amb: [{ e: '🟩', s: { top: 8, insetInlineStart: 10, fontSize: 26 } }, { e: '📚', s: { top: 12, insetInlineEnd: 12, fontSize: 22 } }] },
  kitchen: { en: 'Kitchen', ar: 'مطبخ', chip: '🍽️', bg: 'linear-gradient(180deg,#fff3e0 0%,#ffd9a8 100%)', ground: '#e7b878', amb: [{ e: '🍽️', s: { top: 10, insetInlineStart: 12, fontSize: 22, opacity: 0.85 } }, { e: '🪟', s: { top: 8, insetInlineEnd: 12, fontSize: 22, opacity: 0.8 } }] },
  garden: { en: 'Garden', ar: 'حديقة', chip: '🌳', bg: 'linear-gradient(180deg,#e3f3d6 0%,#bfe3a4 100%)', ground: '#86b865', amb: [{ e: '🌳', s: { top: 10, insetInlineStart: 12, fontSize: 24 } }, { e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 22 } }] },
  park: { en: 'Park', ar: 'منتزه', chip: '⚽', bg: 'linear-gradient(180deg,#cdeafe 0%,#a3d4ff 100%)', ground: '#7ec268', amb: [{ e: '☀️', s: { top: 8, insetInlineEnd: 12, fontSize: 24 } }, { e: '☁️', s: { top: 16, insetInlineStart: 16, fontSize: 20, opacity: 0.9 } }] },
  stage: { en: 'Stage', ar: 'مسرح', chip: '🪩', bg: 'linear-gradient(180deg,#3a1d52 0%,#7a4aa0 100%)', ground: '#46285f', dark: true, amb: [{ e: '🪩', s: { top: 6, insetInlineStart: '50%', transform: 'translateX(-50%)', fontSize: 24, animation: 'sg-spin 1.2s linear infinite' } }, { e: '✨', s: { top: 30, insetInlineEnd: 22, fontSize: 14, animation: 'sg-twinkle 1.6s ease-in-out infinite' } }] },
  night: { en: 'Night', ar: 'ليل', chip: '🌙', bg: 'linear-gradient(180deg,#162447 0%,#42598c 100%)', ground: '#2b3a63', dark: true, amb: [{ e: '🌙', s: { top: 10, insetInlineEnd: 14, fontSize: 26 } }, { e: '⭐', s: { top: 22, insetInlineStart: 18, fontSize: 14, animation: 'sg-twinkle 2.2s ease-in-out infinite' } }] },
};
const BG_LIST = Object.keys(BACKGROUNDS);

const CHARS = [
  { id: 'kawkab', en: 'Kawkab', ar: 'كوكب' },
  { id: 'star', en: 'Star', ar: 'ستار' },
  { id: 'noor', en: 'Noor', ar: 'نور' },
  { id: 'ba', en: 'Ba', ar: 'با' },
  { id: 'ma', en: 'Ma', ar: 'ما' },
];

const ACTIONS = [
  { id: 'walk', e: '🚶', en: 'walks', ar: 'يمشي' },
  { id: 'greet', e: '👋', en: 'meets', ar: 'يقابل' },
  { id: 'eat', e: '🍔', en: 'eats', ar: 'يأكل' },
  { id: 'study', e: '📖', en: 'studies', ar: 'يدرس' },
  { id: 'ace', e: '💯', en: 'aces the test', ar: 'يتفوّق' },
  { id: 'plant', e: '🌱', en: 'plants', ar: 'يزرع' },
  { id: 'play', e: '⚽', en: 'plays', ar: 'يلعب' },
  { id: 'dance', e: '🪩', en: 'dances', ar: 'يرقص' },
  { id: 'cheer', e: '🎉', en: 'celebrates', ar: 'يحتفل' },
  { id: 'sleep', e: '😴', en: 'sleeps', ar: 'ينام' },
];

function actionCharAnim(action) {
  return ({
    walk: 'sg-walk 0.5s ease-in-out infinite',
    greet: 'sg-idle 1.1s ease-in-out infinite',
    eat: 'sg-eat 0.55s ease-in-out infinite',
    study: 'sg-study 1.6s ease-in-out infinite',
    ace: 'sg-bounce 0.55s ease-in-out infinite',
    plant: 'sg-study 1.8s ease-in-out infinite',
    play: 'sg-bounce 0.7s ease-in-out infinite',
    dance: 'sg-sway 0.9s ease-in-out infinite',
    cheer: 'sg-bounce 0.5s ease-in-out infinite',
    sleep: 'sg-sleep 2.6s ease-in-out infinite',
  })[action] || 'sg-idle 2.6s ease-in-out infinite';
}
const moodFor = (action) => (action === 'sleep' ? 'tired' : action === 'dance' || action === 'ace' || action === 'cheer' ? 'proud' : action === 'study' || action === 'plant' ? 'focused' : 'ready');

function PropLayer({ action }) {
  const el = (emoji, st, key) => (
    <span key={key} style={{ position: 'absolute', fontSize: 24, lineHeight: 1, pointerEvents: 'none', ...st }}>{emoji}</span>
  );
  switch (action) {
    case 'walk': return el('💨', { insetInlineStart: 0, bottom: 0, fontSize: 16, animation: 'sg-float 1s ease-in-out infinite' });
    case 'greet': return el('👋', { insetInlineEnd: 0, top: 6, animation: 'sg-pop 0.9s ease-in-out infinite' });
    case 'eat': return el('🍔', { insetInlineEnd: 2, bottom: 2, animation: 'sg-food 0.95s ease-in-out infinite' });
    case 'study': return el('📖', { insetInlineStart: '50%', bottom: -2, transform: 'translateX(-50%)', fontSize: 22 });
    case 'ace': return [el('💯', { insetInlineStart: '50%', top: -2, transform: 'translateX(-50%)', animation: 'sg-pop 0.7s ease-in-out infinite' }, 'a'), el('✨', { insetInlineEnd: 2, top: 8, fontSize: 16, animation: 'sg-twinkle 1.2s ease-in-out infinite' }, 'b')];
    case 'plant': return [el('🌰', { insetInlineStart: '50%', top: 4, animation: 'sg-seed 2.2s ease-in-out infinite' }, 'a'), el('🌱', { insetInlineStart: '50%', bottom: -2, transformOrigin: 'bottom center', animation: 'sg-sprout 2.2s ease-in-out infinite' }, 'b')];
    case 'play': return el('⚽', { insetInlineStart: '50%', top: -2, animation: 'sg-ball 0.7s ease-in-out infinite' });
    case 'dance': return [el('🎵', { insetInlineStart: 0, bottom: 18, animation: 'sg-note 1.4s ease-in-out infinite' }, 'a'), el('🎶', { insetInlineEnd: 0, bottom: 12, animation: 'sg-note 1.4s ease-in-out 0.7s infinite' }, 'b')];
    case 'cheer': return [el('🎉', { insetInlineStart: 0, bottom: 14, animation: 'sg-rise 1.3s ease-in-out infinite' }, 'a'), el('🎊', { insetInlineEnd: 0, bottom: 10, animation: 'sg-rise 1.3s ease-in-out 0.6s infinite' }, 'b')];
    case 'sleep': return [el('💤', { insetInlineEnd: 6, top: 2, animation: 'sg-float 2.4s ease-in-out infinite' }, 'a'), el('💤', { insetInlineEnd: 20, top: 10, fontSize: 18, animation: 'sg-float 2.4s ease-in-out 1.1s infinite' }, 'b')];
    default: return null;
  }
}

function CharacterArt({ id, size, mood = 'ready' }) {
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

function BgSwatch({ bgId, size = 54 }) {
  const cfg = BACKGROUNDS[bgId];
  return (
    <div style={{ position: 'relative', width: size, height: size * 0.82, borderRadius: 10, overflow: 'hidden', background: cfg.bg, border: '2px solid #cdbfa6' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '24%', background: cfg.ground, opacity: 0.9 }} />
      <span style={{ position: 'absolute', top: 4, insetInlineStart: 6, fontSize: 18 }}>{cfg.chip}</span>
    </div>
  );
}

function PanelStage({ panel, size, say }) {
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
        <div style={{ position: 'absolute', top: 8, insetInlineStart: '50%', transform: 'translateX(-50%)', maxWidth: '90%', animation: 'sg-bubble 0.45s ease-out' }}>
          <div style={{ background: '#fffdf8', border: '2px solid #1a1208', borderRadius: 12, padding: '4px 11px', fontWeight: 800, fontSize: 13.5, color: '#3a2c18', textAlign: 'center', whiteSpace: 'nowrap', boxShadow: '2px 2px 0 rgba(26,18,8,0.18)' }}>{say}</div>
        </div>
      )}
    </div>
  );
}

// ── AUTHORED STORIES (roles H/F cast at runtime; {H}/{F} in `say` resolved to names) ──
const STORIES = [
  { id: 'school', beats: [
    { bg: 'street', who: ['H'], action: 'walk', say: { en: 'Off to school!', ar: 'إلى المدرسة!' } },
    { bg: 'school', who: ['H', 'F'], action: 'greet', say: { en: 'Hi {F}!', ar: 'أهلاً {F}!' } },
    { bg: 'classroom', who: ['F'], action: 'ace', say: { en: 'I got an A! 💯', ar: 'حصلت على امتياز! 💯' } },
    { bg: 'school', who: ['H', 'F'], action: 'cheer', say: { en: 'Well done {F}!', ar: 'أحسنت {F}!' } },
  ] },
  { id: 'friends-day', beats: [
    { bg: 'street', who: ['H'], action: 'walk', say: { en: 'A new day!', ar: 'يوم جديد!' } },
    { bg: 'school', who: ['H', 'F'], action: 'greet', say: { en: 'Hi {H}!', ar: 'أهلاً {H}!' } },
    { bg: 'classroom', who: ['H', 'F'], action: 'study' },
    { bg: 'park', who: ['H', 'F'], action: 'play', say: { en: 'We win!', ar: 'فزنا!' } },
    { bg: 'night', who: ['H'], action: 'sleep' },
  ] },
  { id: 'garden', beats: [
    { bg: 'garden', who: ['H'], action: 'plant' },
    { bg: 'garden', who: ['H', 'F'], action: 'plant', say: { en: 'It grew!', ar: 'لقد نمت!' } },
    { bg: 'stage', who: ['H', 'F'], action: 'dance', say: { en: 'Let’s celebrate!', ar: 'لنحتفل!' } },
    { bg: 'night', who: ['H'], action: 'sleep' },
  ] },
  { id: 'good-day', beats: [
    { bg: 'kitchen', who: ['H'], action: 'eat' },
    { bg: 'park', who: ['H'], action: 'play' },
    { bg: 'night', who: ['H'], action: 'sleep' },
  ] },
  { id: 'match', beats: [
    { bg: 'kitchen', who: ['H'], action: 'eat', say: { en: 'Game day!', ar: 'يوم المباراة!' } },
    { bg: 'park', who: ['H', 'F'], action: 'play' },
    { bg: 'park', who: ['H'], action: 'cheer', say: { en: 'We did it!', ar: 'نجحنا!' } },
  ] },
];

const EMPTY = { bg: null, chars: [], action: null };
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const shuffleR = (arr, rng) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

// Build a seeded story of `n` panels + a palette padded with `distract` decoy
// pieces (so harder rounds offer wrong places/characters/actions to resist).
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
  const usedChars = CHARS.map((c) => c.id).filter((c) => usedChar.has(c));
  const usedBgs = BG_LIST.filter((b) => usedBg.has(b));
  const usedActs = ACTIONS.map((a) => a.id).filter((a) => usedAct.has(a));
  const dC = shuffleR(CHARS.map((c) => c.id).filter((c) => !usedChar.has(c)), rng).slice(0, distract);
  const dB = shuffleR(BG_LIST.filter((b) => !usedBg.has(b)), rng).slice(0, distract);
  const dA = shuffleR(ACTIONS.map((a) => a.id).filter((a) => !usedAct.has(a)), rng).slice(0, distract);
  const palChar = new Set([...usedChars, ...dC]);
  const palBg = new Set([...usedBgs, ...dB]);
  const palAct = new Set([...usedActs, ...dA]);
  return {
    roleChar,
    target,
    paletteBgs: shuffleR(BG_LIST.filter((b) => palBg.has(b)), rng),
    paletteChars: shuffleR(CHARS.map((c) => c.id).filter((c) => palChar.has(c)), rng),
    paletteActions: ACTIONS.filter((a) => palAct.has(a.id)).map((a) => a.id),
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
const frameSize = () => (typeof window !== 'undefined' && window.innerWidth < 380 ? 92 : 106);
const bigSize = () => Math.min(280, typeof window !== 'undefined' ? window.innerWidth - 40 : 280);

const T = {
  en: {
    title: 'Story Time',
    watchTag: '📖 Watch & remember…', rebuildTag: '🧩 Rebuild the story in order',
    backgrounds: 'Places', characters: 'Characters', hintEmpty: 'drag here', check: '✓ Check',
    perfect: 'Perfect! ✓', score: (n, m) => `${n}/${m} panels correct`, storyWas: 'The story was:',
    next: 'Next ›', prev: '‹ Prev', doneMemo: '✓ Done — rebuild it', cont: 'Continue ›',
    seq: (i, m) => (i === 0 ? 'First,' : i === m - 1 ? 'Finally,' : 'Then,'),
    meets: 'meets', congrats: 'congratulates', and: ' & ',
    sheetTitle: (n) => `Panel ${n}`, chooseAction: 'What happens here?', needChar: 'Drag a character into this panel first.',
    clearPanel: 'Clear panel', done: 'Done', menu: 'Menu',
  },
  ar: {
    title: 'وقت القصة',
    watchTag: '📖 شاهد وتذكّر…', rebuildTag: '🧩 أعد بناء القصة بالترتيب',
    backgrounds: 'الأماكن', characters: 'الشخصيات', hintEmpty: 'اسحب هنا', check: '✓ تحقّق',
    perfect: 'ممتاز! ✓', score: (n, m) => `${n}/${m} لوحات صحيحة`, storyWas: 'كانت القصة:',
    next: 'التالي ›', prev: '‹ السابق', doneMemo: '✓ تم — أعد البناء', cont: 'متابعة ›',
    seq: (i, m) => (i === 0 ? 'أولاً،' : i === m - 1 ? 'أخيراً،' : 'ثم،'),
    meets: 'يقابل', congrats: 'يهنّئ', and: ' و ',
    sheetTitle: (n) => `لوحة ${n}`, chooseAction: 'ماذا يحدث هنا؟', needChar: 'اسحب شخصية إلى هذه اللوحة أولاً.',
    clearPanel: 'امسح اللوحة', done: 'تم', menu: 'القائمة',
  },
};

function StoryEngine({ mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 5) : 0;
  const nameOf = (id) => { const c = CHARS.find((x) => x.id === id); return c ? (isAr ? c.ar : c.en) : ''; };
  const actWord = (id) => { const a = ACTIONS.find((x) => x.id === id); return a ? (isAr ? a.ar : a.en) : ''; };

  const stageRef = useRef(0);     // survival difficulty stage
  const roundsRef = useRef(0);    // survival rounds played
  const bestRef = useRef(0);      // survival best stage reached
  const ppDoneRef = useRef(0);
  const ppCorrectRef = useRef(0);

  const [phase, setPhase] = useState('watch'); // watch · rebuild · reveal
  const [story, setStory] = useState(null);
  const [watchIdx, setWatchIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [panels, setPanels] = useState([]);
  const [sheetK, setSheetK] = useState(null);
  const [result, setResult] = useState({ n: 0, m: 0 });

  const [drag, setDrag] = useState(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hoverSlot, setHoverSlot] = useState(-1);
  const dragRef = useRef(null);
  const slotRefs = useRef([]);

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
    setSheetK(null);
    setPhase('watch');
  }, [cfgFor, rng]);

  useEffect(() => { newRound(); /* one round on mount */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // memorize countdown (no auto-advance of panels; ends the watch phase at 0)
  useEffect(() => {
    if (phase !== 'watch') return undefined;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);
  useEffect(() => { if (phase === 'watch' && timeLeft === 0) setPhase('rebuild'); }, [phase, timeLeft]);

  const resolveSay = useCallback((beat) => {
    if (!beat.say || !story) return null;
    const raw = isAr ? beat.say.ar : beat.say.en;
    return raw.replace('{H}', nameOf(story.roleChar.H)).replace('{F}', nameOf(story.roleChar.F));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, isAr]);
  const narrate = useCallback((beat) => {
    const names = beat.chars.map(nameOf);
    if (beat.action === 'greet' && names.length === 2) return `${names[0]} ${t.meets} ${names[1]}`;
    if (beat.action === 'cheer' && names.length === 2) return `${names[0]} ${t.congrats} ${names[1]}`;
    return `${names.join(t.and)} ${actWord(beat.action)}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, isAr]);

  // drag plumbing
  const slotAt = useCallback((x, y) => {
    for (let i = 0; i < len; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return -1;
  }, [len]);
  const beginDrag = (e, kind, id) => {
    if (phase !== 'rebuild') return;
    e.preventDefault?.();
    dragRef.current = { kind, id };
    setDrag({ kind, id });
    setPos({ x: e.clientX, y: e.clientY });
  };
  const resolveDrop = useCallback((x, y) => {
    const d = dragRef.current;
    dragRef.current = null; setDrag(null); setHoverSlot(-1);
    if (!d) return;
    const k = slotAt(x, y);
    if (k < 0) return;
    setPanels((ps) => ps.map((p, i) => {
      if (i !== k) return p;
      if (d.kind === 'bg') return { ...p, bg: d.id };
      if (p.chars.includes(d.id)) return p;
      return { ...p, chars: [...p.chars, d.id].slice(-2) };
    }));
    playSfx?.('click');
  }, [slotAt, playSfx]);
  useEffect(() => {
    if (!drag) return undefined;
    const move = (e) => { setPos({ x: e.clientX, y: e.clientY }); setHoverSlot(slotAt(e.clientX, e.clientY)); };
    const up = (e) => resolveDrop(e.clientX, e.clientY);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
  }, [drag, slotAt, resolveDrop]);

  const setAction = (k, action) => { setPanels((ps) => ps.map((p, i) => (i === k ? { ...p, action } : p))); setSheetK(null); playSfx?.('click'); };
  const clearPanel = (k) => { setPanels((ps) => ps.map((p, i) => (i === k ? EMPTY : p))); setSheetK(null); playSfx?.('click'); };

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

  // advance after the player reviews the reveal
  const advanceRound = useCallback(() => {
    playSfx?.('click');
    const perfect = result.n === result.m && result.m > 0;
    if (mode === 'levels') {
      onResult({ won: perfect, score: result.n, summary: t.score(result.n, result.m) });
      return;
    }
    if (mode === 'passplay') {
      ppCorrectRef.current += result.n;
      ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) { onResult({ score: ppCorrectRef.current }); return; }
      newRound();
      return;
    }
    // survival — endless, difficulty adapts ±1 stage
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
  const sheetActions = ACTIONS.filter((a) => story.paletteActions.includes(a.id));
  const reveal = phase === 'reveal';

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
            <div key={watchIdx} style={S.watchCap}>{`${t.seq(watchIdx, len)} ${narrate(g)}`}</div>
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
          <div style={S.instr}>{reveal ? (result.n === result.m ? t.perfect : t.score(result.n, result.m)) : t.rebuildTag}</div>
          <div style={{ ...S.grid, gridTemplateColumns: `repeat(${gridCols(len)}, max-content)` }}>
            {panels.map((p, i) => {
              const g = story.target[i];
              const ok = reveal && p.bg === g.bg && p.action === g.action && sameSet(p.chars, g.chars);
              const bad = reveal && !ok;
              const isHover = drag && hoverSlot === i;
              return (
                <div key={i} ref={(el) => { slotRefs.current[i] = el; }} style={{ position: 'relative' }} onClick={() => { if (!reveal) { playSfx?.('click'); setSheetK(i); } }}>
                  <span style={{ ...S.badge, ...(reveal ? { background: ok ? '#2e8b57' : '#d23b3b' } : null) }}>{i + 1}</span>
                  <div style={{ borderRadius: 14, outline: isHover ? '3px solid #b9842f' : ok ? '3px solid #2e8b57' : bad ? '3px solid #d23b3b' : 'none', outlineOffset: 2 }}>
                    <PanelStage panel={p} size={fsz} />
                  </div>
                  {!reveal && p.bg && p.chars.length === 0 && <span style={S.dropHint}>{t.hintEmpty}</span>}
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

      {/* palette dock (rebuild only) */}
      {phase === 'rebuild' && (
        <div style={S.dock}>
          <div style={S.dockRow}>
            <span style={S.dockLabel}>{t.backgrounds}</span>
            <div style={S.dockChips}>
              {story.paletteBgs.map((id) => (
                <div key={id} onPointerDown={(e) => beginDrag(e, 'bg', id)} style={{ ...S.bgChip, opacity: drag && drag.kind === 'bg' && drag.id === id ? 0.3 : 1 }}>
                  <BgSwatch bgId={id} size={52} />
                </div>
              ))}
            </div>
          </div>
          <div style={S.dockDivider} />
          <div style={S.dockRow}>
            <span style={S.dockLabel}>{t.characters}</span>
            <div style={S.dockChips}>
              {story.paletteChars.map((id) => (
                <div key={id} onPointerDown={(e) => beginDrag(e, 'char', id)} style={{ ...S.charChip, opacity: drag && drag.kind === 'char' && drag.id === id ? 0.3 : 1 }}>
                  <div style={S.charChipArt}><CharacterArt id={id} size={48} /></div>
                  <span style={S.charChipName}>{nameOf(id)}</span>
                </div>
              ))}
            </div>
          </div>
          <button type="button" style={{ ...S.checkBtn, ...(allFilled ? null : S.primaryOff) }} disabled={!allFilled} onClick={check}>{t.check}</button>
        </div>
      )}

      {sheetK != null && phase === 'rebuild' && (
        <div style={S.sheetWrap} onClick={() => setSheetK(null)}>
          <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={S.sheetTitle}>{t.sheetTitle(sheetK + 1)}</div>
            {panels[sheetK].chars.length > 0 ? (
              <>
                <div style={S.sheetSub}>{t.chooseAction}</div>
                <div style={S.actionGrid}>
                  {sheetActions.map((a) => (
                    <button key={a.id} type="button" style={{ ...S.actionBtn, ...(panels[sheetK].action === a.id ? S.actionOn : null) }} onClick={() => setAction(sheetK, a.id)}>
                      <span style={{ fontSize: 24 }}>{a.e}</span>
                      <span style={S.actionLbl}>{isAr ? a.ar : a.en}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={S.sheetSub}>{t.needChar}</div>
            )}
            <div style={S.btnRow}>
              <button type="button" style={S.ghost} onClick={() => clearPanel(sheetK)}>{t.clearPanel}</button>
              <button type="button" style={S.primary} onClick={() => { playSfx?.('click'); setSheetK(null); }}>{t.done}</button>
            </div>
          </div>
        </div>
      )}

      {drag && (
        <div style={{ position: 'fixed', left: pos.x, top: pos.y, transform: 'translate(-50%,-50%) scale(1.05) rotate(-3deg)', pointerEvents: 'none', zIndex: 1000, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.32))' }}>
          {drag.kind === 'bg' ? <BgSwatch bgId={drag.id} size={52} /> : <div style={S.charChipArt}><CharacterArt id={drag.id} size={48} /></div>}
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
  watchCap: { fontWeight: 800, fontSize: 16, color: '#4a3c28', textAlign: 'center', animation: 'sg-bubble 0.4s ease-out', minHeight: 22 },
  timerChip: { fontWeight: 900, fontSize: 14, color: '#7a5a1e', background: '#fff1d8', border: '2px solid #e3c489', borderRadius: 999, padding: '4px 14px' },
  timerLow: { color: '#b53b2f', background: '#ffe2dc', borderColor: '#e8a89c' },
  navRow: { display: 'flex', gap: 10, justifyContent: 'center' },
  navBtn: { padding: '10px 22px', borderRadius: 12, border: '2px solid #1a1208', background: '#fffdf8', fontWeight: 900, fontSize: 15, cursor: 'pointer', color: '#2d2210', boxShadow: '2px 2px 0 #1a1208', minWidth: 96 },
  navOff: { opacity: 0.4, boxShadow: 'none', cursor: 'default' },
  dots: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  dot: { width: 24, height: 24, borderRadius: '50%', border: '2px solid #d8cab4', background: '#fff', color: '#b3a288', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  dotOn: { background: '#b9842f', color: '#fff', borderColor: '#b9842f' },
  gameBody: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '10px 14px 14px', overflowY: 'auto' },
  instr: { fontWeight: 800, fontSize: 14, color: '#5a4a32', textAlign: 'center' },
  grid: { display: 'grid', gap: 12, justifyContent: 'center', justifyItems: 'center' },
  badge: { position: 'absolute', top: -8, insetInlineStart: -8, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: '#b9842f', color: '#fff', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8' },
  dropHint: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b3a288', fontSize: 10, fontWeight: 700, pointerEvents: 'none' },
  tapPlus: { position: 'absolute', bottom: 4, insetInlineEnd: 4, width: 22, height: 22, borderRadius: '50%', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fffdf8', pointerEvents: 'none' },
  storyWas: { fontWeight: 800, fontSize: 13, color: '#2e8b57', marginTop: 6 },
  btnRow: { display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 },
  dock: { flex: '0 0 auto', background: '#fffaf3', borderTop: '2px solid #e3d6c4', padding: '10px 14px max(14px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 -4px 14px rgba(26,18,8,0.07)' },
  dockRow: { display: 'flex', alignItems: 'center', gap: 10 },
  dockLabel: { flex: '0 0 64px', fontSize: 11, fontWeight: 900, color: '#7a6a52', textTransform: 'uppercase', letterSpacing: 0.8 },
  dockChips: { display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 },
  dockDivider: { height: 1, background: '#ece2d2', margin: '1px 0' },
  bgChip: { borderRadius: 10, touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' },
  charChip: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, padding: '2px 4px', borderRadius: 10, touchAction: 'none', cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none' },
  charChipArt: { width: 50, height: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden' },
  charChipName: { fontSize: 10.5, fontWeight: 800, color: '#5a4a32' },
  checkBtn: { alignSelf: 'center', marginTop: 2, padding: '11px 30px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  primary: { padding: '11px 22px', borderRadius: 14, border: '2px solid #1a1208', background: '#2e8b57', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 #1a1208' },
  primaryOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default' },
  ghost: { padding: '11px 18px', borderRadius: 14, border: '2px solid #cdbfa6', background: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: '#4a3c28' },
  sheetWrap: { position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(26,18,8,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  sheet: { width: '100%', maxWidth: 480, background: '#fffdf8', borderTopLeftRadius: 22, borderTopRightRadius: 22, border: '2px solid #1a1208', borderBottom: 'none', padding: '16px 16px max(20px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 10 },
  sheetTitle: { fontWeight: 900, fontSize: 16, color: '#2d2210', textAlign: 'center' },
  sheetSub: { fontWeight: 700, fontSize: 13.5, color: '#6a5a40', textAlign: 'center' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  actionBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 4px', borderRadius: 12, border: '2px solid #cdbfa6', background: '#fff', cursor: 'pointer' },
  actionOn: { borderColor: '#b9842f', background: '#fff1d8', boxShadow: '0 0 0 2px rgba(185,132,47,0.3)' },
  actionLbl: { fontSize: 11.5, fontWeight: 800, color: '#4a3c28' },
};
