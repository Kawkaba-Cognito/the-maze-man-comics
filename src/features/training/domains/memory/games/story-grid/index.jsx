import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { makeRng } from '../../../../shared/rng';
import { cast2dUrl } from '../../../../shared/cast2d';
import Emoji from '../../../../../../components/shared/Emoji';
import { useGamePause } from '../../../../shared/useGamePause';
import { TrainingPlayHeader } from '../../../../shared/TrainingChrome';
import { createTrialLog } from '../../../../shared/trialLog';
import { assetUrl } from '../../../../../../lib/assetUrl';
import {
  ACTIONS, BACKGROUNDS, CHARS,
  buildQuestions, LADDER_LEVELS, levelCfg, levelPassed, makeStory, passCfg, survivalCfg,
} from './data.js';

/*
 * Story Time — temporal-order / episodic memory.
 *
 *   WATCH — an authored, connected story plays panel by panel (characters go
 *           places, things happen, they react via speech bubbles). SWIPE (or the
 *           arrows) to move between scenes; a memorize countdown runs behind it,
 *           and swiping past the last scene starts the questions early.
 *   ASK   — Kawkab, the mascot from the middle of the Training hub, asks about
 *           the story: where it began, who was there, what came next, which came
 *           first, how many scenes had company, and one scene that may never
 *           have happened. Pick an answer, then CONFIRM it.
 *   REVEAL— the score, the whole story read back, and its moral.
 *
 * Shared 3-mode flow (Survival / Levels / Pass n Play). Seeded → deterministic,
 * so Pass-n-Play players get the same story AND the same questions.
 *
 * The scene vocabulary, the level curve and the question generator live in
 * `data.js` — see the note there about why. Two shared scene modules still
 * import the vocabulary from this file, so it is re-exported below.
 *
 * Cast: Kawkab, Star, Noor (fox), Ramy (boy), Lola (girl).
 */
export { ACTIONS, BACKGROUNDS, BG_LIST, CHARS, makeStory } from './data.js';

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

const STORY_CAST_ALIASES = { noor: 'mimi', rami: 'ramy' };

export function CharacterArt({ id, size, mood = 'ready' }) {
  const artId = STORY_CAST_ALIASES[id] || id;
  return (
    <img
      src={cast2dUrl(artId)}
      alt=""
      aria-hidden="true"
      draggable="false"
      data-mood={mood}
      style={{
        display: 'block',
        width: size,
        height: size,
        objectFit: 'contain',
        objectPosition: 'center bottom',
        userSelect: 'none',
        filter: 'drop-shadow(0 5px 3px rgba(38,25,10,0.24))',
      }}
    />
  );
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
          <div style={{ position: 'relative', background: 'var(--surface-raised)', border: '2px solid var(--ink-outline)', borderRadius: 13, padding: '5px 12px', fontWeight: 800, fontSize: 14, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.25, boxShadow: '2px 2px 0 rgba(26,18,8,0.18)' }}>
            {say}
            <span style={{ position: 'absolute', bottom: -7, insetInlineStart: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid var(--ink-outline)' }} />
          </div>
        </div>
      )}
    </div>
  );
}


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

// Kawkab from the middle of the Training hub — the same character and the same
// keyed art file the hub centre uses, so the mascot who sets the assessment is
// the one who asks about the story.
const KAWKAB_URL = assetUrl('Assets/characters/kawkab/kawkab-planet.webp');
const KAWKAB_ASPECT = 480 / 546;

const T = {
  en: {
    title: 'Story Time',
    watchTag: 'Watch & remember',
    swipeHint: 'Swipe to move between scenes',
    swipeLast: 'Swipe on for Kawkab\'s questions',
    askTag: 'Kawkab asks',
    qOf: (n, total) => `Question ${n} of ${total}`,
    pick: 'Pick an answer, then confirm it.',
    confirm: '✓ Confirm', confirmOff: 'Pick an answer',
    yes: 'Yes, I saw it', no: 'No, that never happened',
    scenes: (n) => (n === 1 ? '1 scene' : `${n} scenes`),
    perfect: 'Every answer right! ✓',
    score: (n, m) => `${n}/${m} questions right`,
    storyWas: 'The story was:',
    next: 'Next ›', prev: '‹ Prev', toQuestions: 'Kawkab\'s questions ›', cont: 'Continue ›',
    seq: (i, m) => (i === 0 ? 'First,' : i === m - 1 ? 'Finally,' : 'Then,'),
    meets: 'meets', congrats: 'congratulates', hugs: 'hugs', and: ' & ', menu: 'Menu',
  },
  ar: {
    title: 'وقت القصة',
    watchTag: 'شاهد وتذكّر',
    swipeHint: 'اسحب للتنقّل بين المشاهد',
    swipeLast: 'اسحب للمتابعة إلى أسئلة كوكب',
    askTag: 'كوكب يسأل',
    qOf: (n, total) => `السؤال ${n} من ${total}`,
    pick: 'اختر جواباً ثم أكّده.',
    confirm: '✓ تأكيد', confirmOff: 'اختر جواباً',
    yes: 'نعم، رأيته', no: 'لا، لم يحدث أبداً',
    scenes: (n) => (n === 1 ? 'مشهد واحد' : `${n} مشاهد`),
    perfect: 'كل الأجوبة صحيحة! ✓',
    score: (n, m) => `${n}/${m} أجوبة صحيحة`,
    storyWas: 'كانت القصة:',
    next: 'التالي ›', prev: '‹ السابق', toQuestions: 'أسئلة كوكب ›', cont: 'متابعة ›',
    seq: (i, m) => (i === 0 ? 'أولاً،' : i === m - 1 ? 'أخيراً،' : 'ثم،'),
    meets: 'يقابل', congrats: 'يهنّئ', hugs: 'يعانق', and: ' و ', menu: 'القائمة',
  },
};

/**
 * Swipe between scenes. Pointer events, so a mouse drag works the same as a
 * thumb; the arrows and dots stay as the accessible route, because a control
 * that is the ONLY way through is a control that locks somebody out.
 *
 * Direction is reading-relative: in English you swipe left to go on, in Arabic
 * you swipe right, matching the way the panels themselves are laid out.
 */
function useSwipe({ onNext, onPrev, isAr, enabled = true }) {
  const from = useRef(null);
  if (!enabled) return {};
  const THRESHOLD = 42;
  return {
    onPointerDown: (e) => { from.current = { x: e.clientX, y: e.clientY }; },
    onPointerUp: (e) => {
      const start = from.current;
      from.current = null;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;
      const forward = isAr ? dx > 0 : dx < 0;
      if (forward) onNext(); else onPrev();
    },
    onPointerCancel: () => { from.current = null; },
  };
}

export function StoryEngine({ mode, level, seed, attempt, onResult, onExit, isAr, playSfx, awardPoints, cosmos = false }) {
  const t = isAr ? T.ar : T.en;
  const rng = useMemo(() => (seed != null ? makeRng(seed) : Math.random), [seed]);
  const ppTrials = mode === 'passplay' ? (attempt?.trials ?? 5) : 0;
  const nameOf = (id) => { const c = CHARS.find((x) => x.id === id); return c ? (isAr ? c.ar : c.en) : ''; };
  const actWord = (id, plural) => { const a = ACTIONS.find((x) => x.id === id); return a ? (isAr ? a.ar : (plural ? a.enPl : a.en)) : ''; };

  const stageRef = useRef(0);
  const roundsRef = useRef(0);
  const bestRef = useRef(0);
  const ppDoneRef = useRef(0);
  const ppCorrectRef = useRef(0);
  const usedIdsRef = useRef([]); // last few story ids — keeps sessions repeat-free
  const askedAtRef = useRef(0);
  const trialLogRef = useRef(null);

  const [phase, setPhase] = useState('watch');
  const [story, setStory] = useState(null);
  const [watchIdx, setWatchIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [choice, setChoice] = useState(null);   // selected option index, before confirming
  const [judged, setJudged] = useState(null);   // { ok } once confirmed — freezes the row
  const [marks, setMarks] = useState([]);       // one boolean per answered question
  const [result, setResult] = useState({ n: 0, m: 0 });
  const [timerPaused, setTimerPaused] = useState(false);
  const handleExit = useCallback(() => {
    if (mode === 'free') {
      trialLogRef.current?.finish({ rounds: roundsRef.current, best: bestRef.current });
      trialLogRef.current = null;
    }
    onExit();
  }, [mode, onExit]);
  const pause = useGamePause({
    isAr,
    playSfx,
    onQuit: handleExit,
    onPause: () => setTimerPaused(true),
    onResume: () => setTimerPaused(false),
  });

  const len = story ? story.target.length : 0;

  const cfgFor = useCallback(() => {
    if (mode === 'levels') return levelCfg(level);
    // Pass n Play takes a ladder level so ModeShell's depth picker reaches the
    // engine; Group War launches passplay with `level: null` and gets L25,
    // which is the 5-scene / 5-question band its fixed config used to be.
    if (mode === 'passplay') return level ? levelCfg(level) : passCfg();
    return survivalCfg(stageRef.current);
  }, [mode, level]);

  const newRound = useCallback(() => {
    const cfg = cfgFor();
    const st = makeStory(cfg.len, rng, usedIdsRef.current);
    usedIdsRef.current = [...usedIdsRef.current, st.id].slice(-4);
    setStory(st);
    // Questions are drawn from the SAME seeded rng as the story, so a Pass n Play
    // round asks every player the same things in the same order.
    setQuestions(buildQuestions(st, rng, cfg));
    setQIdx(0);
    setChoice(null);
    setJudged(null);
    setMarks([]);
    setWatchIdx(0);
    setTimeLeft(cfg.memo);
    setResult({ n: 0, m: 0 });
    setPhase('watch');
  }, [cfgFor, rng]);

  useEffect(() => {
    newRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: run once on mount only
  }, []);

  useEffect(() => {
    trialLogRef.current?.discard();
    trialLogRef.current = createTrialLog({ game: 'story-grid', mode, meta: { level } });
    return () => {
      trialLogRef.current?.discard();
      trialLogRef.current = null;
    };
  }, [mode, level]);

  useEffect(() => {
    if (phase !== 'watch' || timerPaused) return undefined;
    const id = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [phase, timerPaused]);
  useEffect(() => { if (phase === 'watch' && timeLeft === 0) setPhase('ask'); }, [phase, timeLeft]);
  // Reaction time is per QUESTION, measured from the moment it appears to the
  // moment it is confirmed — the one clean number the old all-at-once rebuild
  // could never produce.
  useEffect(() => {
    if (phase === 'ask') askedAtRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }, [phase, qIdx]);

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

  // ── watching ──
  // Swiping forward on the LAST scene is how a player who is ready leaves the
  // watch phase early. There is no skip button: a story is not a cutscene to be
  // dismissed, it is the material, so the only way out is through the end of it.
  const goNextScene = useCallback(() => {
    if (phase !== 'watch') return;
    playSfx?.('click');
    setWatchIdx((w) => {
      if (w >= (story ? story.target.length : 1) - 1) { setPhase('ask'); return w; }
      return w + 1;
    });
  }, [phase, story, playSfx]);
  const goPrevScene = useCallback(() => {
    if (phase !== 'watch') return;
    playSfx?.('click');
    setWatchIdx((w) => Math.max(0, w - 1));
  }, [phase, playSfx]);
  const swipe = useSwipe({ onNext: goNextScene, onPrev: goPrevScene, isAr, enabled: phase === 'watch' });

  // ── answering ──
  // Two taps on purpose: pick, then confirm. A single tap that commits turns a
  // mis-tap into a wrong answer, and the pause before confirming is where the
  // player actually checks the memory against the option.
  const question = questions[qIdx] || null;
  const pickOption = (i) => {
    if (judged) return;
    playSfx?.('click');
    setChoice(i);
  };
  const confirmAnswer = () => {
    if (!question || choice == null || judged) return;
    const ok = choice === question.answer;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    trialLogRef.current?.trial({
      ok,
      kind: question.kind,
      story: story.id,
      opts: question.options.length,
      rt: Math.max(0, Math.round(now - askedAtRef.current)),
    });
    setJudged({ ok });
    setMarks((m) => [...m, ok]);
    playSfx?.(ok ? 'win' : 'error');
  };
  const nextQuestion = () => {
    playSfx?.('click');
    if (qIdx >= questions.length - 1) {
      setResult({ n: marks.filter(Boolean).length, m: questions.length });
      setPhase('reveal');
      return;
    }
    setQIdx(qIdx + 1);
    setChoice(null);
    setJudged(null);
  };

  const advanceRound = useCallback(() => {
    playSfx?.('click');
    const { n, m } = result;
    const won = m > 0 && levelPassed(n, m);
    if (mode === 'levels') {
      trialLogRef.current?.finish({ won, score: n, level });
      trialLogRef.current = null;
      onResult({ won, score: n, summary: t.score(n, m) });
      return;
    }
    if (mode === 'passplay') {
      ppCorrectRef.current += n; ppDoneRef.current += 1;
      if (ppDoneRef.current >= ppTrials) {
        trialLogRef.current?.finish({ score: ppCorrectRef.current, stories: ppDoneRef.current });
        trialLogRef.current = null;
        onResult({ score: ppCorrectRef.current });
        return;
      }
      newRound(); return;
    }
    // Survival ladder with a dead band: perfect climbs, two or more misses drops,
    // exactly one miss holds the stage. A 1-up/1-down ladder over six questions
    // would send everyone back down on a single slip.
    roundsRef.current += 1;
    if (n === m) stageRef.current += 1;
    else if (n <= m - 2) stageRef.current = Math.max(0, stageRef.current - 1);
    bestRef.current = Math.max(bestRef.current, stageRef.current);
    if (n === m) awardPoints?.(3);
    newRound();
  }, [mode, result, onResult, ppTrials, newRound, t, playSfx, awardPoints, level]);

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
  const rootStyle = cosmos ? { ...S.root, ...S.cosmosRoot } : S.root;
  const cardStyle = cosmos ? { ...S.watchCard, ...S.cosmosCard } : S.watchCard;
  const rebuildStyle = cosmos ? { ...S.rebuildCard, ...S.cosmosCard } : S.rebuildCard;
  const titleStyle = cosmos ? { ...S.storyTitle, color: '#f0e2c0', textShadow: '0 0 18px rgba(232,172,78,0.45)' } : S.storyTitle;
  const capStyle = cosmos ? { ...S.watchCap, color: 'rgba(240,226,192,0.9)' } : S.watchCap;
  // Panel-shaped options sit UNDER a reference panel on order questions, so they
  // are kept smaller than it — both must fit on a phone screen without scrolling.
  const optSize = Math.round(fsz * (question && question.ref ? 0.78 : 0.92));

  return (
    <div style={rootStyle} className={cosmos ? 'c3d-embed-root' : undefined} data-c3d-embed={cosmos || undefined} dir={isAr ? 'rtl' : 'ltr'}>
      <style>{ANIM_CSS}</style>
      {/* The shared header. This used to hand-write the same markup with TEXT
          glyphs (‹ and ⏸) while every game built on TrainingChromeBtn drew
          IconBack/IconPause — same frame, different glyph shapes. */}
      <TrainingPlayHeader
        isAr={isAr}
        playSfx={playSfx}
        title={t.title}
        subtitle={hudSub}
        onMenu={cosmos ? undefined : pause.requestQuit}
        menuAriaLabel={t.menu}
        onPause={pause.open ? undefined : pause.start}
        pauseAriaLabel={pause.labels.paused}
        style={cosmos ? { background: 'transparent', paddingTop: 52 } : undefined}
      />
      {pause.modal}

      {/* WATCH — swipe (or the arrows) through the scenes; no skip button */}
      {phase === 'watch' && (() => {
        const g = story.target[watchIdx];
        const last = watchIdx >= len - 1;
        return (
          <div style={S.center}>
            <div
              style={{ ...cardStyle, touchAction: 'pan-y', ...(cosmos ? { transform: 'perspective(900px) rotateX(3deg)', transformOrigin: 'center top' } : null) }}
              {...swipe}
            >
              {storyTitle && <div style={titleStyle}>📖 {storyTitle}</div>}
              <div style={{ ...S.timerChip, ...(timeLeft <= 5 ? S.timerLow : null) }}>⏱ {timeLeft}s · {t.watchTag}</div>
              <div style={{ position: 'relative' }}>
                <span style={S.badge}>{watchIdx + 1}</span>
                <PanelStage key={watchIdx} panel={g} size={bigSize()} say={resolveSay(g)} />
              </div>
              <div key={watchIdx} style={capStyle}>{resolveNarr(g) || `${t.seq(watchIdx, len)} ${narrate(g)}`}</div>
              <div style={S.watchNav}>
                <button type="button" aria-label={t.prev} style={{ ...S.navArrow, ...(watchIdx === 0 ? S.navOff : null) }} disabled={watchIdx === 0} onClick={goPrevScene}>‹</button>
                <div style={S.dots}>{story.target.map((_, i) => (
                  <button key={i} type="button" aria-label={`${i + 1}`} style={{ ...S.dot, ...(i === watchIdx ? S.dotOn : null) }} onClick={() => { playSfx?.('click'); setWatchIdx(i); }} />
                ))}</div>
                {/* On the last scene the forward arrow becomes the way into the
                    questions, so swiping and tapping agree about what "on" means. */}
                <button type="button" aria-label={last ? t.toQuestions : t.next} style={S.navArrow} onClick={goNextScene}>{last ? '✦' : '›'}</button>
              </div>
              <div style={S.swipeHint}>{last ? t.swipeLast : t.swipeHint}</div>
            </div>
          </div>
        );
      })()}

      {/* ASK — Kawkab's questions: pick, then confirm */}
      {phase === 'ask' && question && (
        <div style={S.gameBody}>
          <div style={rebuildStyle}>
            <div style={S.askHead}>
              <img src={KAWKAB_URL} alt="" aria-hidden="true" style={{ ...S.mascot, height: Math.round(80 / KAWKAB_ASPECT) }} />
              <div style={S.askHeadText}>
                <div style={S.askTag}>{t.askTag}</div>
                <div style={S.qCount}>{t.qOf(qIdx + 1, questions.length)}</div>
              </div>
              <div style={S.marks}>
                {questions.map((_, i) => (
                  <span
                    key={i}
                    style={{
                      ...S.mark,
                      ...(marks[i] === true ? S.markOk : null),
                      ...(marks[i] === false ? S.markBad : null),
                      ...(i === qIdx && marks[i] == null ? S.markNow : null),
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={cosmos ? { ...S.qText, color: '#f0e2c0' } : S.qText}>
              {isAr ? question.prompt.ar : question.prompt.en}
            </div>

            {/* The scene being asked about. Deliberately larger than the option
                panels but small enough that both fit above the fold on a phone —
                a reference you have to scroll away from to see the answers is
                not a reference. */}
            {question.ref && (
              <div style={{ position: 'relative' }}>
                <PanelStage panel={question.ref} size={Math.min(bigSize(), 172)} />
              </div>
            )}

            {/* Four panel options read as a 2×2 block rather than a 3-and-1 row,
                which is what plain wrapping gives you at this width. */}
            <div
              style={{
                ...S.optRow,
                ...(question.options[0].kind === 'panel' ? { gap: 12 } : null),
                /* optSize + 14 is one option's own chrome (5px padding + 2px
                   border, both sides), + 12 for the gap between the pair. */
                ...(question.options[0].kind === 'panel' && question.options.length === 4
                  ? { maxWidth: (optSize + 14) * 2 + 14 }
                  : null),
              }}
            >
              {question.options.map((o, i) => {
                const picked = choice === i;
                const isAnswer = i === question.answer;
                const showOk = judged && isAnswer;
                const showBad = judged && picked && !isAnswer;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={picked}
                    disabled={!!judged}
                    onClick={() => pickOption(i)}
                    style={{
                      ...S.opt,
                      ...(o.kind === 'panel' ? S.optPanel : null),
                      ...(picked ? S.optSel : null),
                      ...(showOk ? S.optOk : null),
                      ...(showBad ? S.optBad : null),
                    }}
                  >
                    {o.kind === 'place' && (
                      <>
                        <BgSwatch bgId={o.value} size={54} />
                        <span style={S.optLabel}>{isAr ? BACKGROUNDS[o.value].ar : BACKGROUNDS[o.value].en}</span>
                      </>
                    )}
                    {o.kind === 'face' && (
                      <>
                        <span style={S.faceRow}>
                          {o.value.map((id) => <CharacterArt key={id} id={id} size={o.value.length > 1 ? 40 : 52} />)}
                        </span>
                        <span style={S.optLabel}>{o.value.map(nameOf).join(t.and)}</span>
                      </>
                    )}
                    {o.kind === 'panel' && <PanelStage panel={o.panel} size={optSize} />}
                    {o.kind === 'num' && <span style={S.optNum}>{o.value}</span>}
                    {o.kind === 'bool' && <span style={S.optLabel}>{o.value ? t.yes : t.no}</span>}
                  </button>
                );
              })}
            </div>

            {judged
              ? <button type="button" style={S.primary} onClick={nextQuestion}>{qIdx >= questions.length - 1 ? t.cont : t.next}</button>
              : (
                <button
                  type="button"
                  style={{ ...S.primary, ...(choice == null ? S.primaryOff : null) }}
                  disabled={choice == null}
                  onClick={confirmAnswer}
                >
                  {choice == null ? t.confirmOff : t.confirm}
                </button>
              )}
            {!judged && <div style={S.swipeHint}>{t.pick}</div>}
          </div>
        </div>
      )}

      {/* REVEAL — the score, the story read back, and its moral */}
      {reveal && (
        <div style={S.gameBody}>
          <div style={rebuildStyle}>
            <div style={S.instr}>{result.n === result.m ? t.perfect : t.score(result.n, result.m)}</div>
            <div style={S.marks}>
              {marks.map((ok, i) => (
                <span key={i} style={{ ...S.mark, ...(ok ? S.markOk : S.markBad) }} />
              ))}
            </div>
            <div style={S.storyWas}>{t.storyWas}{storyTitle ? ` “${storyTitle}”` : ''}</div>
            <div style={{ ...S.grid, rowGap: 6, gridTemplateColumns: `repeat(${gridCols(len)}, max-content)` }}>
              {story.target.map((g, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <span style={{ ...S.badge, background: 'var(--success)' }}>{i + 1}</span>
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
          </div>
          <button type="button" style={S.primary} onClick={advanceRound}>{t.cont}</button>
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
        levels: { en: '60 levels · a new twist every 10', ar: '٦٠ مستوى · جديد كل ١٠' },
        pass: { en: 'Same story and questions for all · most right wins', ar: 'نفس القصة والأسئلة للجميع · الأكثر صحة يفوز' },
      }}
      /* ONE LADDER — no easy/med/hard. See data.js LADDER. */
      ladder={{ levels: LADDER_LEVELS }}
      pass={{ trials: 3, scoreLabel: { en: 'correct', ar: 'صحيحة' }, lowerBetter: false }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <StoryEngine
          key={`${p.mode}-${p.level}-${p.seed}`}
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardPoints={awardPoints}
        />
      )}
    />
  );
}

const S = {
  root: { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', background: 'var(--play-surface)', color: 'var(--play-ink)', fontFamily: "'Outfit', system-ui, sans-serif" },
  cosmosRoot: { background: 'transparent', color: '#f0e2c0', zIndex: 81 },
  cosmosCard: {
    background: 'rgba(12,10,8,0.72)',
    border: '1px solid rgba(232,172,78,0.4)',
    boxShadow: '0 0 28px rgba(232,172,78,0.18), 0 12px 32px rgba(0,0,0,0.45)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  center: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 14, padding: '10px 18px 24px', overflowY: 'auto' },
  watchCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, background: 'var(--surface-raised)', border: '2px solid var(--line)', borderRadius: 22, padding: '18px 20px 20px', maxWidth: '100%', boxShadow: '4px 4px 0 rgba(26,18,8,0.1)' },
  storyTitle: { fontFamily: "'Outfit', system-ui, sans-serif", fontSize: 24, letterSpacing: 0.5, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.1, padding: '0 8px', textShadow: '1px 1px 0 rgba(255,255,255,0.6)' },
  watchCap: { fontWeight: 600, fontSize: 15, color: '#4a3c28', textAlign: 'center', animation: 'sg-bubble 0.4s ease-out', minHeight: 66, width: '100%', maxWidth: 440, lineHeight: 1.5, padding: '0 8px', overflowWrap: 'break-word', flexShrink: 0 },
  timerChip: { fontWeight: 900, fontSize: 14, color: 'var(--ink-dim)', background: '#fff1d8', borderWidth: 2, borderStyle: 'solid', borderColor: '#e3c489', borderRadius: 999, padding: '4px 14px' },
  timerLow: { color: '#b53b2f', background: '#ffe2dc', borderColor: '#e8a89c' },
  watchNav: { display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', flexWrap: 'wrap' },
  navArrow: { width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--ink-outline)', background: 'var(--surface-raised)', fontWeight: 900, fontSize: 24, lineHeight: 1, cursor: 'pointer', color: 'var(--ink)', boxShadow: '2px 2px 0 var(--ink-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navOff: { opacity: 0.32, boxShadow: 'none', cursor: 'default' },
  dots: { display: 'flex', gap: 7, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 220 },
  dot: { width: 11, height: 11, borderRadius: '50%', border: 'none', background: '#d8cab4', cursor: 'pointer', padding: 0, transition: 'transform 0.12s, background 0.12s' },
  dotOn: { background: 'var(--accent)', transform: 'scale(1.4)' },
  gameBody: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 12, padding: '10px 14px 16px', overflowY: 'auto' },
  rebuildCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, background: 'var(--surface-raised)', border: '2px solid var(--line)', borderRadius: 22, padding: '16px 10px 18px', maxWidth: '100%', boxShadow: '4px 4px 0 rgba(26,18,8,0.1)' },
  instr: { fontWeight: 800, fontSize: 13.5, color: 'var(--ink-dim)', textAlign: 'center', padding: '7px 16px', background: 'var(--surface-raised)', border: '2px solid #e3c489', borderRadius: 999, maxWidth: '94%' },
  grid: { display: 'grid', gap: 14, justifyContent: 'center', justifyItems: 'center' },
  // ── watch ──
  swipeHint: { fontSize: 12, fontWeight: 700, color: 'var(--ink-dim)', opacity: 0.8, textAlign: 'center', letterSpacing: 0.2 },
  // ── ask: Kawkab and the question ──
  askHead: { width: 'min(100%, 540px)', display: 'flex', alignItems: 'center', gap: 10, padding: '2px 8px' },
  mascot: { width: 80, objectFit: 'contain', objectPosition: 'center bottom', flex: '0 0 auto', animation: 'sg-idle 4.5s ease-in-out infinite', transformOrigin: 'center bottom', filter: 'drop-shadow(0 6px 5px rgba(38,25,10,0.22))' },
  askHeadText: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  askTag: { fontWeight: 900, fontSize: 15, color: 'var(--ink)' },
  qCount: { fontWeight: 700, fontSize: 12, color: 'var(--ink-dim)', letterSpacing: 0.3 },
  marks: { display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center' },
  mark: { width: 9, height: 9, borderRadius: '50%', background: 'var(--line)' },
  markNow: { background: 'var(--accent)', transform: 'scale(1.3)' },
  markOk: { background: 'var(--success)' },
  markBad: { background: 'var(--danger)' },
  qText: { fontWeight: 800, fontSize: 17, lineHeight: 1.4, color: 'var(--ink)', textAlign: 'center', maxWidth: 440, padding: '0 6px', textWrap: 'balance' },
  optRow: { display: 'flex', flexWrap: 'wrap', gap: 9, justifyContent: 'center', width: '100%', maxWidth: 540 },
  opt: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '9px 12px', minWidth: 96, minHeight: 74, borderRadius: 16, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--line)', background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', transition: 'transform 0.14s ease, border-color 0.14s ease' },
  optPanel: { padding: 5, minWidth: 0, minHeight: 0, lineHeight: 0 },
  optSel: { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 16%, var(--surface))', boxShadow: '0 0 0 3px color-mix(in srgb, var(--accent) 34%, transparent)', transform: 'translateY(-2px)' },
  optOk: { borderColor: 'var(--success)', background: 'color-mix(in srgb, var(--success) 18%, var(--surface))', boxShadow: '0 0 0 3px color-mix(in srgb, var(--success) 30%, transparent)' },
  optBad: { borderColor: 'var(--danger)', background: 'color-mix(in srgb, var(--danger) 14%, var(--surface))' },
  optLabel: { fontSize: 12.5, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', lineHeight: 1.25 },
  optNum: { fontSize: 26, fontWeight: 900, color: 'var(--ink)', lineHeight: 1.1 },
  faceRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  recap: { display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480, textAlign: 'start', padding: '0 6px' },
  recapLine: { display: 'flex', gap: 9, alignItems: 'flex-start' },
  recapNum: { flex: '0 0 auto', width: 20, height: 20, borderRadius: '50%', background: 'var(--success)', color: '#fff', fontWeight: 900, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  recapText: { fontSize: 12.5, fontWeight: 600, color: '#4a3c28', lineHeight: 1.55, overflowWrap: 'break-word', minWidth: 0 },
  moral: { fontWeight: 800, fontSize: 13.5, color: 'var(--ink-dim)', background: 'var(--surface-raised)', border: '2px solid #e3c489', borderRadius: 14, padding: '9px 16px', textAlign: 'center', maxWidth: '96%', lineHeight: 1.55, marginTop: 2 },
  badge: { position: 'absolute', top: -8, insetInlineStart: -8, zIndex: 2, width: 22, height: 22, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontWeight: 900, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--surface-raised)' },
  storyWas: { fontWeight: 800, fontSize: 13, color: 'var(--success)', marginTop: 6 },
  // press-to-place board (builder tray)
  primary: { padding: '11px 22px', borderRadius: 14, borderWidth: 2, borderStyle: 'solid', borderColor: 'var(--ink-outline)', background: 'var(--success)', color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer', boxShadow: '3px 3px 0 var(--ink-outline)' },
  primaryOff: { background: '#c9bfae', borderColor: '#a89a82', boxShadow: 'none', cursor: 'default' },
};
