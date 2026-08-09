import React, { useEffect, useRef } from 'react';
import { releaseGlContext } from '../../../training/shared/c3dViewport';

/*
 * VOID RUNNER — a 3-lane endless space runner (Three.js), ported from a
 * standalone build into a self-contained puzzle-style game screen. Takes
 * only `onBack`, matching the other self-contained games (Flow/Tangram):
 * own chrome, no PuzzleScreenFrame/trial machinery.
 *
 * Everything below is scoped under the `.vr-root` container (ids/classes
 * prefixed `vr-`) so nothing leaks into the rest of the app, which keeps
 * every screen mounted-but-hidden simultaneously. Three.js is lazy-loaded
 * from a CDN with an SRI pin the same way the app's other 3D engine
 * (Babylon) is loaded on-demand in AppContext's beginMazeEntry — so users
 * who never open this game never pay for either 3D engine.
 *
 * Fixes applied versus the original build (see project memory for the
 * full rationale):
 *   1. Obstacle/gem spawn HEIGHT is now centred on the ship's actual Y and
 *      kept within the hit-test radius — previously ~47% of spawns were
 *      geometrically unreachable (ship never moves vertically) so players
 *      could never hit or collect them no matter what they did.
 *   2. Camera FOV is now recomputed from the live aspect ratio so the full
 *      tunnel width stays in frame on narrow/portrait phones instead of
 *      being cropped by a fixed 70° vertical FOV.
 *   3. Phone steering is a single tap-left-half / tap-right-half listener
 *      on the canvas, replacing the old swipe-on-document + separate
 *      thumb-button handlers (which could double-fire on a jittery tap).
 *   4. lowPerf gating (shadows off, capped pixel ratio) on touch devices,
 *      safe-area padding on the top HUD, exitGame() returns to the app
 *      instead of window.close()/itch.io, and full listener/timer/audio
 *      cleanup on unmount.
 */

const THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const THREE_SRI = 'sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==';

function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById('vr-three-cdn');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.THREE));
      existing.addEventListener('error', () => reject(new Error('three-cdn-failed')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'vr-three-cdn';
    script.src = THREE_SRC;
    script.integrity = THREE_SRI;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(window.THREE);
    script.onerror = () => { script.remove(); reject(new Error('three-cdn-failed')); };
    document.head.appendChild(script);
  });
}

const CSS = `
.vr-root {
  /* App palette: Kawkab blue + app amber over dusk indigo. These now match the
     3D scene's VR.* constants, and the raw neon literals that used to bypass
     them (rgba(0,245,255…) / rgba(255,45,155…)) have been folded in. */
  --vr-pink:   #d9924f;
  --vr-cyan:   #8fb8e8;
  --vr-purple: #6f6a9c;
  --vr-gold:   #e8ac4e;
  --vr-dark-bg: #1a1f38;
  position: fixed; inset: 0; z-index: 60;
  background: var(--vr-dark-bg);
  overflow: hidden;
  font-family: 'DM Mono', monospace;
  color: #fff;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.vr-root * { box-sizing: border-box; }

.vr-container { position:relative; width:100%; height:100%; }
/* touch-action on the CANVAS, not only on .vr-root: the property does not
   inherit, and the canvas is the element the swipe listeners are bound to.
   Without it a horizontal drag can be claimed by the browser as a pan/back
   gesture, which fires pointercancel mid-swipe and eats the lane change. */
.vr-root canvas { display:block; position:absolute; top:0; left:0; touch-action:none; }

.vr-scanlines { position:absolute; inset:0; pointer-events:none; z-index:5;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px); }
.vr-vignette { position:absolute; inset:0; pointer-events:none; z-index:4;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%); transition:opacity 0.3s; }
.vr-speedlines { position:absolute; inset:0; pointer-events:none; z-index:3; opacity:0; transition:opacity 0.3s;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(143,184,232,0.04) 60%, rgba(217,146,79,0.08) 100%); }

.vr-hud { position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; align-items:flex-start;
  padding:calc(16px + env(safe-area-inset-top)) 20px 16px; pointer-events:none; z-index:10; }
.vr-hud-block { display:flex; flex-direction:column; align-items:center; gap:2px; }
.vr-hud-label { font-size:9px; letter-spacing:4px; color:rgba(143,184,232,0.5); text-transform:uppercase; }
.vr-hud-val { font-family:'DM Mono',sans-serif; font-size:22px; font-weight:700; color:#fff; text-shadow:0 0 12px var(--vr-cyan); }
.vr-liveshud { display:flex; gap:6px; align-items:center; padding-top:4px; }
.vr-heart { font-size:18px; transition:transform 0.2s, opacity 0.2s; }
.vr-heart.vr-dead { opacity:0.2; transform:scale(0.7); }

.vr-speedbar { position:absolute; top:calc(72px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:none; z-index:10; }
.vr-speedlabel { font-size:9px; letter-spacing:3px; color:rgba(143,184,232,0.4); }
.vr-levellabel { color:rgba(255,255,255,0.55); margin-inline-start:6px; }
.vr-speedtrack { width:120px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; }
.vr-speedfill { height:100%; width:0%; background:linear-gradient(90deg,var(--vr-cyan),var(--vr-pink));
  border-radius:2px; transition:width 0.3s; box-shadow:0 0 8px var(--vr-cyan); }

/* The Pulse charge meter — sits with the speed bar in the top stack, never over
   the play area (this game has form: a mid-screen level banner had to be pulled
   out of the dodging sightline twice). */
.vr-power { position:absolute; top:calc(94px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  display:none; flex-direction:column; align-items:center; gap:4px; pointer-events:none; z-index:10; }
.vr-power-label { font-size:9px; letter-spacing:3px; color:rgba(232,172,78,0.55); text-transform:uppercase; }
.vr-power-track { width:120px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; }
.vr-power-fill { height:100%; width:0%; background:var(--vr-gold); border-radius:2px;
  transition:width 0.25s; box-shadow:0 0 8px var(--vr-gold); }
/* Armed: the label pulses so "you have something to spend" is visible without
   reading. Fires the moment you TAP — swiping still only steers. */
.vr-power.vr-ready .vr-power-label { color:var(--vr-gold); animation:vrPowerReady 1.1s ease-in-out infinite; }
.vr-power.vr-ready .vr-power-fill { box-shadow:0 0 14px var(--vr-gold); }
@keyframes vrPowerReady { 0%,100%{ opacity:0.55; } 50%{ opacity:1; } }
.vr-power.vr-firing .vr-power-label { color:#ffd47e; }
.vr-power.vr-firing .vr-power-fill { background:#ffd47e; box-shadow:0 0 16px #ffd47e; transition:width 0.1s linear; }

.vr-combodisplay { position:absolute; top:calc(126px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  pointer-events:none; z-index:10; text-align:center; opacity:0; transition:opacity 0.3s; }
.vr-combotext { font-family:'DM Mono',sans-serif; font-size:20px; font-weight:900; color:var(--vr-gold);
  text-shadow:0 0 20px var(--vr-gold); letter-spacing:3px; }

.vr-popup { position:absolute; left:50%; top:calc(148px + env(safe-area-inset-top)); transform:translateX(-50%); pointer-events:none; z-index:15; text-align:center;
  font-family:'DM Mono',sans-serif; font-size:18px; font-weight:900; letter-spacing:4px; opacity:0; text-shadow:0 0 20px currentColor; }

.vr-pausebtn { position:absolute; top:calc(16px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  z-index:20; pointer-events:all; background:rgba(0,0,0,0.5); border:1px solid rgba(143,184,232,0.3); border-radius:50%;
  width:38px; height:38px; color:rgba(143,184,232,0.7); font-size:14px; cursor:pointer; display:none;
  align-items:center; justify-content:center; transition:border-color 0.2s, color 0.2s; }
.vr-pausebtn:hover { border-color:var(--vr-cyan); color:var(--vr-cyan); }

/* Steering is a SWIPE, so the controls are a hint, not a target. The two 90px
   thumb circles that used to sit here were pure decoration — pointer-events:none
   the whole time — and a round button that cannot be pressed is worse than no
   button at all. This says what the gesture is, and gets out of the way once
   the player has made it. */
.vr-thumbcontrols { position:absolute; bottom:0; left:0; right:0; display:none; z-index:20; pointer-events:none;
  padding-bottom:max(22px, env(safe-area-inset-bottom)); }
.vr-swipe-hint { display:flex; align-items:center; justify-content:center; gap:14px;
  opacity:0.5; transition:opacity 0.45s ease; }
.vr-swipe-hint.vr-faded { opacity:0; }
.vr-swipe-word { font-size:10px; letter-spacing:4px; text-transform:uppercase; color:rgba(240,226,192,0.75); }
.vr-swipe-arrow { font-size:20px; color:var(--vr-cyan); display:inline-block;
  animation:vrSwipeNudge 2.4s ease-in-out infinite; }
#vr-btnright { animation-delay:1.2s; }
.vr-swipe-arrow.vr-pressed { color:var(--vr-gold); transform:scale(1.35); }
@keyframes vrSwipeNudge { 0%,72%,100%{ transform:translateX(0); opacity:0.55; }
  84%{ transform:translateX(-6px); opacity:1; } }
#vr-btnright { animation-name:vrSwipeNudgeR; }
@keyframes vrSwipeNudgeR { 0%,72%,100%{ transform:translateX(0); opacity:0.55; }
  84%{ transform:translateX(6px); opacity:1; } }

.vr-warningflash { position:absolute; inset:0; pointer-events:none; z-index:6; opacity:0; background:rgba(255,45,0,0.15); transition:opacity 0.1s; }
.vr-hitflash { position:absolute; inset:0; pointer-events:none; z-index:7; opacity:0; background:rgba(255,0,0,0.4); transition:opacity 0.05s; }
.vr-gemflash { position:absolute; inset:0; pointer-events:none; z-index:6; opacity:0; background:rgba(255,204,0,0.12); transition:opacity 0.1s; }

.vr-screen { position:absolute; inset:0; z-index:30; display:flex; flex-direction:column; align-items:center; justify-content:center; }

#vr-menuscreen { background: radial-gradient(ellipse at 50% 30%, rgba(111,106,156,0.15) 0%, rgba(26,31,56,0.92) 70%);
  padding-top: env(safe-area-inset-top); }
/* Base layout only — the engraved-caps treatment lives in the app-theme block
   further down. The gradient wordmark and its pulse animation that used to be
   here are gone rather than overridden, so there is one description of the
   title, not one plus a dead one. */
.vr-game-logo { font-size:clamp(42px,10vw,72px); line-height:1; margin-bottom:4px; text-align:center; }
.vr-tagline { font-size:12px; letter-spacing:6px; color:rgba(143,184,232,0.5); margin-bottom:40px; text-transform:uppercase; }

.vr-best-badge { font-size:11px; letter-spacing:3px; color:var(--vr-gold); margin-bottom:32px; text-shadow:0 0 10px var(--vr-gold); opacity:0; transition:opacity 0.5s; }
.vr-hint-row { font-size:11px; letter-spacing:2px; color:rgba(255,255,255,0.35); }
.vr-hint-row span { color:rgba(143,184,232,0.6); }

.vr-neon-btn { font-family:'DM Mono',sans-serif; font-size:15px; font-weight:700; letter-spacing:5px; padding:16px 48px;
  border-radius:4px; border:none; cursor:pointer; position:relative; overflow:hidden; transition:transform 0.1s, box-shadow 0.2s; text-transform:uppercase; }
.vr-neon-btn-primary { background:linear-gradient(135deg, #1a006b, #3d00c8); color:#fff;
  box-shadow:0 0 30px rgba(61,0,200,0.6), inset 0 0 30px rgba(143,184,232,0.1); border:1px solid rgba(143,184,232,0.4); }
.vr-neon-btn-primary:hover { transform:scale(1.04); box-shadow:0 0 50px rgba(143,184,232,0.5), inset 0 0 30px rgba(143,184,232,0.2); }
.vr-neon-btn-secondary { background:transparent; color:rgba(143,184,232,0.6); border:1px solid rgba(143,184,232,0.3); font-size:12px; padding:10px 32px; letter-spacing:4px; }
.vr-neon-btn-secondary:hover { border-color:var(--vr-cyan); color:var(--vr-cyan); box-shadow:0 0 20px rgba(143,184,232,0.3); }

#vr-pausescreen { background:rgba(26,31,56,0.88); backdrop-filter:blur(6px); }
#vr-pausescreen h2 { font-family:'DM Mono',sans-serif; font-size:36px; letter-spacing:10px; color:var(--vr-cyan);
  text-shadow:0 0 30px var(--vr-cyan); margin-bottom:40px; }
.vr-pause-btns { display:flex; flex-direction:column; gap:16px; align-items:center; }

#vr-gameoverscreen { background: radial-gradient(ellipse at 50% 40%, rgba(255,45,0,0.12) 0%, rgba(26,31,56,0.92) 70%); }
.vr-go-title { font-family:'DM Mono',sans-serif; font-size:clamp(28px,8vw,52px); font-weight:900; letter-spacing:6px; color:#fff;
  text-shadow:0 0 30px var(--vr-pink); margin-bottom:8px; margin-top:0; }
.vr-go-sub { font-size:11px; letter-spacing:4px; color:rgba(217,146,79,0.5); margin-bottom:32px; }
.vr-stats-row { display:flex; gap:12px; margin-bottom:32px; flex-wrap:wrap; justify-content:center; }
.vr-stat-card { display:flex; flex-direction:column; align-items:center; gap:6px; background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:16px 20px; min-width:90px; }
.vr-stat-card .vr-sv { font-family:'DM Mono',sans-serif; font-size:26px; font-weight:700; color:var(--vr-cyan); text-shadow:0 0 10px var(--vr-cyan); }
.vr-stat-card .vr-sl { font-size:9px; letter-spacing:3px; color:rgba(255,255,255,0.35); }
.vr-new-best-badge { font-family:'DM Mono',sans-serif; font-size:13px; letter-spacing:4px; color:var(--vr-gold);
  text-shadow:0 0 15px var(--vr-gold); margin-bottom:24px; opacity:0; animation:vrBadgePop 0.4s 0.3s forwards; }
@keyframes vrBadgePop { from{ opacity:0; transform:scale(0.7); } to{ opacity:1; transform:scale(1); } }
.vr-go-btns { display:flex; flex-direction:column; gap:12px; align-items:center; }

#vr-countdownscreen { background:rgba(26,31,56,0.6); }
.vr-countdownnum { font-family:'DM Mono',sans-serif; font-size:clamp(80px,25vw,140px); font-weight:900; color:var(--vr-cyan);
  text-shadow:0 0 60px var(--vr-cyan); animation:vrCountPulse 1s ease-out; }
@keyframes vrCountPulse { 0%{ transform:scale(1.5); opacity:0; } 100%{ transform:scale(1); opacity:1; } }


.vr-sub-screen { position:absolute; inset:0; z-index:30; display:none; flex-direction:column; align-items:center; justify-content:flex-start;
  padding:calc(40px + env(safe-area-inset-top)) 24px 40px;
  background: radial-gradient(ellipse at 50% 20%, rgba(0,80,120,0.18) 0%, rgba(26,31,56,0.95) 70%); overflow-y:auto; }
.vr-sub-title { font-family:'DM Mono',sans-serif; font-size:24px; font-weight:900; letter-spacing:8px; color:var(--vr-cyan);
  text-shadow:0 0 20px var(--vr-cyan); margin-bottom:32px; margin-top:8px; }
.vr-setting-row { width:100%; max-width:360px; display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid rgba(143,184,232,0.1); padding:14px 0; gap:16px; }
.vr-setting-label { font-size:12px; letter-spacing:3px; color:rgba(255,255,255,0.6); }
.vr-setting-val { font-family:'DM Mono',sans-serif; font-size:14px; color:var(--vr-cyan); }
.vr-root input[type=range] { -webkit-appearance:none; width:130px; height:4px; background:rgba(143,184,232,0.2); border-radius:2px; outline:none; }
.vr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%;
  background:var(--vr-cyan); box-shadow:0 0 8px var(--vr-cyan); cursor:pointer; }
.vr-root input[type=text] { background:rgba(143,184,232,0.07); border:1px solid rgba(143,184,232,0.3); border-radius:4px;
  color:var(--vr-cyan); padding:8px 12px; font-family:'DM Mono',monospace; font-size:14px; width:160px; outline:none; letter-spacing:2px; }
.vr-root input[type=text]:focus { border-color:var(--vr-cyan); }

.vr-toggle-btn { font-family:'DM Mono',sans-serif; font-size:11px; letter-spacing:3px; padding:8px 18px; border-radius:4px; cursor:pointer;
  border:1px solid rgba(143,184,232,0.4); background:rgba(143,184,232,0.1); color:var(--vr-cyan); transition:background 0.2s; }
.vr-toggle-btn.vr-on { background:rgba(143,184,232,0.25); color:#fff; }
.vr-toggle-btn.vr-off { background:transparent; color:rgba(143,184,232,0.4); }

.vr-hs-table { width:100%; max-width:380px; margin-bottom:24px; }
.vr-hs-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.07); }
.vr-hs-rank { font-family:'DM Mono',sans-serif; font-size:18px; font-weight:900; width:36px; text-align:center; }
.vr-hs-rank.vr-gold-rank { color:#ffd700; text-shadow:0 0 10px #ffd700; }
.vr-hs-rank.vr-silver { color:#c0c0c0; text-shadow:0 0 8px #c0c0c0; }
.vr-hs-rank.vr-bronze { color:#cd7f32; text-shadow:0 0 8px #cd7f32; }
.vr-hs-rank.vr-other { color:rgba(255,255,255,0.3); }
.vr-hs-name { flex:1; font-size:13px; letter-spacing:2px; color:rgba(255,255,255,0.7); }
.vr-hs-score { font-family:'DM Mono',sans-serif; font-size:16px; color:var(--vr-cyan); text-shadow:0 0 8px var(--vr-cyan); }
.vr-hs-empty { text-align:center; color:rgba(255,255,255,0.2); font-size:12px; letter-spacing:3px; padding:32px 0; }

.vr-how-row { width:100%; max-width:360px; display:flex; gap:16px; align-items:flex-start; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
.vr-how-icon { font-size:24px; min-width:36px; text-align:center; }
.vr-how-text { font-size:12px; line-height:1.7; color:rgba(255,255,255,0.55); letter-spacing:1px; }
.vr-how-key { display:inline-block; background:rgba(143,184,232,0.15); border:1px solid rgba(143,184,232,0.3); border-radius:3px;
  padding:1px 7px; color:var(--vr-cyan); font-size:11px; letter-spacing:2px; }

/* Puzzle Studio edition: dark cosmic play, restrained Training Hub surfaces. */
.vr-root {
  font-family:'Outfit','DM Mono',sans-serif;
  background:
    radial-gradient(ellipse at 18% 12%, rgba(154,128,200,0.16), transparent 42%),
    radial-gradient(ellipse at 86% 72%, rgba(101,183,176,0.12), transparent 44%),
    var(--vr-dark-bg);
}
.vr-scanlines { opacity:0.2; }
.vr-speedlines {
  background:radial-gradient(ellipse at center, transparent 34%, rgba(101,183,176,0.035) 62%, rgba(154,128,200,0.075) 100%);
}
#vr-menuscreen,
#vr-pausescreen,
#vr-gameoverscreen,
.vr-sub-screen {
  background:
    radial-gradient(ellipse at 50% 22%, rgba(154,128,200,0.17), transparent 46%),
    linear-gradient(180deg, rgba(17,24,42,0.96), rgba(9,13,25,0.985));
}
/* Titles are Cinzel engraved caps — the app's landing-title voice (the Training
   hub, the domain headers). The logo was a DM Mono gradient wordmark, which is
   an arcade convention and the one thing on the menu that still announced this
   as a different product. Same treatment for every screen heading below, so the
   game's four screens read as one family with the rest of the app. */
.vr-game-logo {
  font-family:'Cinzel','Cormorant Garamond',serif;
  font-size:clamp(38px,8.4vw,62px);
  font-weight:700;
  letter-spacing:0.16em;
  color:#f4ead6;
  text-shadow:0 4px 0 rgba(3,7,16,0.92);
}
.vr-sub-title,
.vr-go-title,
#vr-pausescreen h2 {
  font-family:'Cinzel','Cormorant Garamond',serif;
  font-weight:600;
  letter-spacing:0.18em;
}
.vr-tagline,
.vr-hud-label,
.vr-speedlabel,
.vr-sub-title {
  color:#b9bfd0;
  text-shadow:none;
}
.vr-hud-val,
.vr-stat-card .vr-sv,
.vr-hs-score,
.vr-setting-val {
  color:#f7f1e8;
  text-shadow:none;
}
.vr-neon-btn {
  min-width:250px;
  padding:14px 34px;
  border:2px solid #f2e8d6;
  border-radius:13px;
  letter-spacing:0.15em;
  box-shadow:3px 3px 0 #030710;
}
/* The primary action is AMBER, like every "act on me" button in the app
   (.ct-fq-btn-pri: the accent over its own edge, an ink outline, a hard offset
   shadow). It was a lilac #69549b that appears nowhere else in the product. */
.vr-neon-btn-primary {
  color:#2a1c06;
  background:linear-gradient(180deg,var(--vr-gold) 0%,#c98a30 100%);
  border-color:#f2e8d6;
  box-shadow:3px 3px 0 #030710;
}
.vr-neon-btn-primary:hover {
  transform:translateY(-1px);
  background:linear-gradient(180deg,#ffd47e 0%,var(--vr-gold) 100%);
  box-shadow:4px 5px 0 #030710;
}
.vr-neon-btn-secondary {
  color:#e8edf5;
  background:rgba(247,249,252,0.06);
  border-color:rgba(242,232,214,0.56);
  box-shadow:2px 2px 0 #030710;
}
.vr-neon-btn-secondary:hover {
  color:#fff;
  background:rgba(101,183,176,0.16);
  border-color:#f2e8d6;
  box-shadow:3px 3px 0 #030710;
}
.vr-stat-card,
.vr-setting-row,
.vr-how-row,
.vr-hs-row {
  border-color:rgba(242,232,214,0.22);
}
.vr-stat-card {
  background:rgba(247,249,252,0.07);
  border-width:2px;
  border-radius:14px;
  box-shadow:2px 2px 0 rgba(3,7,16,0.9);
}
.vr-root input[type=text],
.vr-toggle-btn {
  color:#f7f1e8;
  background:rgba(247,249,252,0.07);
  border:2px solid rgba(242,232,214,0.45);
  border-radius:10px;
}
.vr-root input[type=range] {
  background:rgba(101,183,176,0.25);
}
.vr-root input[type=range]::-webkit-slider-thumb {
  background:var(--vr-cyan);
  box-shadow:0 0 0 2px #f2e8d6;
}
.vr-pausebtn {
  color:#f7f1e8;
  background:rgba(9,13,25,0.72);
  border:2px solid rgba(242,232,214,0.55);
  box-shadow:2px 2px 0 #030710;
}
.vr-go-title,
#vr-pausescreen h2,
.vr-countdownnum {
  color:#f7f1e8;
  text-shadow:0 4px 0 #030710;
}
.vr-hint-row,
.vr-how-text,
.vr-setting-label,
.vr-hs-name {
  color:#b9bfd0;
}
.vr-hint-row span,
.vr-how-key {
  color:#b8ded9;
}
.vr-how-key {
  background:rgba(101,183,176,0.13);
  border:1px solid rgba(101,183,176,0.46);
  border-radius:6px;
}
`;

const HTML = `
<div class="vr-container">
  <canvas id="vr-canvas"></canvas>
  <div class="vr-scanlines"></div>
  <div class="vr-vignette"></div>
  <div class="vr-speedlines" id="vr-speedlines"></div>
  <div class="vr-warningflash" id="vr-warningflash"></div>
  <div class="vr-hitflash" id="vr-hitflash"></div>
  <div class="vr-gemflash" id="vr-gemflash"></div>

  <div class="vr-hud" id="vr-hud">
    <div class="vr-hud-block"><span class="vr-hud-label">Score</span><span class="vr-hud-val" id="vr-scorehud">0</span></div>
    <div class="vr-liveshud" id="vr-liveshud">
      <span class="vr-heart" id="vr-h1">&#9829;</span>
      <span class="vr-heart" id="vr-h2">&#9829;</span>
      <span class="vr-heart" id="vr-h3">&#9829;</span>
    </div>
    <div class="vr-hud-block"><span class="vr-hud-label">Best</span><span class="vr-hud-val" id="vr-besthud">0</span></div>
  </div>

  <div class="vr-speedbar" id="vr-speedbar">
    <span class="vr-speedlabel">SPEED<span class="vr-levellabel" id="vr-levelhud">LV 1</span></span>
    <div class="vr-speedtrack"><div class="vr-speedfill" id="vr-speedfill"></div></div>
  </div>

  <div class="vr-power" id="vr-power">
    <span class="vr-power-label" id="vr-powerlabel">PULSE</span>
    <div class="vr-power-track"><div class="vr-power-fill" id="vr-powerfill"></div></div>
  </div>

  <div class="vr-combodisplay" id="vr-combodisplay"><span class="vr-combotext" id="vr-combotext">COMBO x2</span></div>
  <div class="vr-popup" id="vr-popup"></div>

  <button class="vr-pausebtn" id="vr-pausebtn" type="button">&#10074;&#10074;</button>

  <div class="vr-thumbcontrols" id="vr-thumbcontrols">
    <div class="vr-swipe-hint" id="vr-swipehint">
      <span class="vr-swipe-arrow" id="vr-btnleft">&#9664;</span>
      <span class="vr-swipe-word">swipe to steer</span>
      <span class="vr-swipe-arrow" id="vr-btnright">&#9654;</span>
    </div>
  </div>

  <div class="vr-screen" id="vr-menuscreen">
    <div class="vr-game-logo">VOID<br>RUNNER</div>
    <div class="vr-tagline">Survive the Impossible</div>
    <div class="vr-best-badge" id="vr-menubest">&#127942; BEST: 0</div>
    <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnplay" type="button" style="margin-bottom:12px">&#9654; &nbsp;PLAY</button>
    <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnscores" type="button" style="margin-bottom:8px">&#127942; &nbsp;HIGH SCORES</button>
    <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnsettings" type="button" style="margin-bottom:8px">&#9881; &nbsp;SETTINGS</button>
    <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnhow" type="button" style="margin-bottom:8px">? &nbsp;HOW TO PLAY</button>
    <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnexit" type="button" style="opacity:0.5">&#10005; &nbsp;EXIT</button>
  </div>

  <div class="vr-sub-screen" id="vr-highscorescreen">
    <div class="vr-sub-title">HIGH SCORES</div>
    <div class="vr-hs-table" id="vr-hstable"></div>
    <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnclearscores" type="button" style="margin-bottom:12px;font-size:10px;padding:8px 20px;opacity:0.5">CLEAR SCORES</button>
    <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnhsback" type="button">&#9664; &nbsp;BACK</button>
  </div>

  <div class="vr-sub-screen" id="vr-settingsscreen">
    <div class="vr-sub-title">SETTINGS</div>
    <div class="vr-setting-row">
      <span class="vr-setting-label">PLAYER NAME</span>
      <input type="text" id="vr-nameinput" maxlength="12" placeholder="PILOT" value=""/>
    </div>
    <div class="vr-setting-row">
      <span class="vr-setting-label">MUSIC VOLUME</span>
      <input type="range" id="vr-musicvol" min="0" max="100" value="70"/>
    </div>
    <div class="vr-setting-row">
      <span class="vr-setting-label">SFX VOLUME</span>
      <input type="range" id="vr-sfxvol" min="0" max="100" value="80"/>
    </div>
    <div class="vr-setting-row">
      <span class="vr-setting-label">MUSIC</span>
      <button class="vr-toggle-btn vr-on" id="vr-musictoggle" type="button">ON</button>
    </div>
    <div class="vr-setting-row">
      <span class="vr-setting-label">SOUND FX</span>
      <button class="vr-toggle-btn vr-on" id="vr-sfxtoggle" type="button">ON</button>
    </div>
    <div style="height:32px"></div>
    <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnsetback" type="button">&#9664; &nbsp;BACK</button>
  </div>

  <div class="vr-sub-screen" id="vr-howscreen">
    <div class="vr-sub-title">HOW TO PLAY</div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128640;</div>
      <div class="vr-how-text">Your ship flies through the void at increasing speed. <b style="color:#fff">Survive as long as possible.</b></div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#11013;&#65039;&#10145;&#65039;</div>
      <div class="vr-how-text"><b style="color:#fff">Swipe left or right</b> anywhere on the screen to change lane — keep swiping in one drag to cross two lanes. On a keyboard, use <span class="vr-how-key">&#9664; &#9654;</span> or <span class="vr-how-key">A</span> <span class="vr-how-key">D</span>.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128142;</div>
      <div class="vr-how-text">Collect <b style="color:#e8ac4e">golden gems</b> to boost your score. Near misses build your COMBO multiplier for bonus points.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128165;</div>
      <div class="vr-how-text">Eight gems charge the <b style="color:#e8ac4e">PULSE CANNON</b>. Press <span class="vr-how-key">SPACE</span> (or tap the screen on phone) to fire it for seven seconds — bolts destroy any obstacle they hit.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128308;</div>
      <div class="vr-how-text">Obstacles glow red when they enter your lane. Dodge them or lose a life. You have <b style="color:#ff2d9b">3 lives.</b></div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#9889;</div>
      <div class="vr-how-text">Speed increases every level. The faster you go, the higher your score multiplier.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#9208;</div>
      <div class="vr-how-text">Press <span class="vr-how-key">P</span> or <span class="vr-how-key">ESC</span> to pause anytime.</div></div>
    <div style="height:24px"></div>
    <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnhowback" type="button">&#9664; &nbsp;BACK</button>
  </div>

  <div class="vr-screen" id="vr-countdownscreen" style="display:none">
    <div class="vr-countdownnum" id="vr-countdownnum">3</div>
  </div>

  <div class="vr-screen" id="vr-pausescreen" style="display:none">
    <h2>PAUSED</h2>
    <div class="vr-pause-btns">
      <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnresume" type="button">&#9654; &nbsp;RESUME</button>
      <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnpausesettings" type="button">&#9881; &nbsp;SETTINGS</button>
      <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btnpausemenu" type="button">&#9664; &nbsp;MAIN MENU</button>
    </div>
  </div>

  <div class="vr-screen" id="vr-gameoverscreen" style="display:none">
    <div style="font-size:52px;margin-bottom:8px">&#128165;</div>
    <h2 class="vr-go-title">VOID LOST</h2>
    <p class="vr-go-sub">THE VOID CLAIMS ANOTHER RUNNER</p>
    <div class="vr-stats-row">
      <div class="vr-stat-card"><span class="vr-sv" id="vr-goscore">0</span><span class="vr-sl">SCORE</span></div>
      <div class="vr-stat-card"><span class="vr-sv" id="vr-golevel">1</span><span class="vr-sl">LEVEL</span></div>
      <div class="vr-stat-card"><span class="vr-sv" id="vr-gogems">0</span><span class="vr-sl">GEMS</span></div>
      <div class="vr-stat-card"><span class="vr-sv" id="vr-gobest">0</span><span class="vr-sl">BEST</span></div>
    </div>
    <div class="vr-new-best-badge" id="vr-newbestbadge" style="display:none">&#9889; NEW RECORD!</div>
    <div class="vr-go-btns">
      <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnagain" type="button">&#9654; &nbsp;FLY AGAIN</button>
      <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btngoscores" type="button">&#127942; &nbsp;SCORES</button>
      <button class="vr-neon-btn vr-neon-btn-secondary" id="vr-btngomenu" type="button">&#9664; &nbsp;MAIN MENU</button>
    </div>
  </div>
</div>
`;

/*
 * The whole game as a factory: createVoidRunner(root, THREE, { onBack, isAr })
 * returns { dispose }. Kept as one imperative unit (mirrors the original
 * standalone build) rather than converted to React state — the animated
 * HUD updates 60x/second and is cheaper and simpler driven directly, same
 * pattern already used by the Babylon rooms' overlayEl.innerHTML HUDs.
 */
function createVoidRunner(root, THREE, { onBack }) {
  const isTouch = typeof navigator !== 'undefined' && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
  const q = (sel) => root.querySelector(sel);
  const canvas = q('#vr-canvas');

  // ── AUDIO ENGINE ──
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  function initAudio() {
    if (!audioCtx) audioCtx = new AudioCtx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function playTone(freq, type, dur, vol, delay = 0) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + dur);
    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + dur + 0.05);
  }
  function sfxDodge() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(); osc.stop(audioCtx.currentTime + 0.2);
  }
  function sfxGem() { [523, 659, 784, 1047].forEach((f, i) => playTone(f, 'sine', 0.12, 0.08, i * 0.05)); }
  function sfxDeath() {
    if (!audioCtx) return;
    [60, 80, 100, 120].forEach((f) => {
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = audioCtx.createBufferSource();
      const gain = audioCtx.createGain();
      const filt = audioCtx.createBiquadFilter();
      src.buffer = buf;
      filt.type = 'lowpass'; filt.frequency.value = f * 30;
      src.connect(filt); filt.connect(gain); gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      src.start();
    });
  }
  function sfxLevelUp() { [400, 500, 600, 800, 1000].forEach((f, i) => playTone(f, 'square', 0.1, 0.06, i * 0.08)); }
  function sfxHit() { playTone(120, 'sawtooth', 0.3, 0.15); playTone(80, 'square', 0.4, 0.1, 0.05); }
  function sfxMenuClick() { if (sfxEnabled && audioCtx) playTone(440, 'sine', 0.08, 0.06 * sfxVolume); }
  /* Pulse cannon. Deliberately short and quiet — it fires ~8 times a second for
   * seven seconds, so anything with a tail would smear into a drone. */
  function sfxPulse() { if (sfxEnabled) playTone(880, 'square', 0.05, 0.035 * sfxVolume); }
  function sfxPulseHit() { if (sfxEnabled) { playTone(220, 'sawtooth', 0.1, 0.07 * sfxVolume); playTone(140, 'square', 0.12, 0.05 * sfxVolume, 0.02); } }
  function sfxPulseArm() { if (sfxEnabled) [660, 880, 1320].forEach((f, i) => playTone(f, 'triangle', 0.12, 0.07 * sfxVolume, i * 0.06)); }

  // ── SYNTHWAVE SOUNDTRACK ──
  let musicRunning = false;
  let musicTimeout = null;
  let masterGain = null;
  const CHORDS = [[220.00, 261.63, 329.63], [174.61, 220.00, 261.63], [130.81, 164.81, 196.00], [196.00, 246.94, 293.66]];
  const ARP_NOTES = [
    [440, 523, 659, 523, 440, 392, 440, 523],
    [349, 440, 523, 440, 349, 330, 349, 440],
    [262, 330, 392, 330, 262, 247, 262, 330],
    [392, 494, 587, 494, 392, 370, 392, 494],
  ];
  const BPM = 128;
  const BEAT = 60 / BPM;
  const BAR = BEAT * 4;

  function makeKick(ctx, when) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.connect(gain); gain.connect(masterGain);
    osc.frequency.setValueAtTime(180, when);
    osc.frequency.exponentialRampToValueAtTime(40, when + 0.08);
    gain.gain.setValueAtTime(0.55, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    osc.start(when); osc.stop(when + 0.2);
  }
  function makeSnare(ctx, when) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); const filt = ctx.createBiquadFilter(); const gain = ctx.createGain();
    src.buffer = buf;
    filt.type = 'bandpass'; filt.frequency.value = 2400; filt.Q.value = 0.8;
    src.connect(filt); filt.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(0.22, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.14);
    src.start(when);
  }
  function makeHihat(ctx, when, open = false) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * (open ? 0.18 : 0.04), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); const filt = ctx.createBiquadFilter(); const gain = ctx.createGain();
    src.buffer = buf;
    filt.type = 'highpass'; filt.frequency.value = 9000;
    src.connect(filt); filt.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(open ? 0.1 : 0.07, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + (open ? 0.18 : 0.04));
    src.start(when);
  }
  function makeBass(ctx, freq, when, dur) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain(); const filt = ctx.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.value = freq / 2;
    filt.type = 'lowpass'; filt.frequency.value = 600; filt.Q.value = 3;
    osc.connect(filt); filt.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(0.18, when);
    gain.gain.setValueAtTime(0.14, when + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.start(when); osc.stop(when + dur + 0.05);
  }
  function makeArp(ctx, freq, when, dur) {
    const osc = ctx.createOscillator(); const gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = freq;
    osc.connect(gain); gain.connect(masterGain);
    gain.gain.setValueAtTime(0.06, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + dur * 0.9);
    osc.start(when); osc.stop(when + dur);
  }
  function makePad(ctx, freqs, when, dur) {
    freqs.forEach((f) => {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = f;
      osc.connect(gain); gain.connect(masterGain);
      gain.gain.setValueAtTime(0.0, when);
      gain.gain.linearRampToValueAtTime(0.04, when + 0.3);
      gain.gain.setValueAtTime(0.04, when + dur - 0.3);
      gain.gain.linearRampToValueAtTime(0.0, when + dur);
      osc.start(when); osc.stop(when + dur + 0.1);
    });
  }
  function scheduleBar(ctx, barStart, chordIdx) {
    if (!musicRunning) return;
    const chord = CHORDS[chordIdx % CHORDS.length];
    const arps = ARP_NOTES[chordIdx % ARP_NOTES.length];
    makePad(ctx, chord, barStart, BAR);
    makeBass(ctx, chord[0], barStart, BAR / 2);
    makeBass(ctx, chord[0], barStart + BAR / 2, BAR / 2);
    for (let b = 0; b < 4; b++) {
      const t = barStart + b * BEAT;
      if (b === 0 || b === 2) makeKick(ctx, t);
      if (b === 1 || b === 3) makeSnare(ctx, t);
      makeHihat(ctx, t, false);
      makeHihat(ctx, t + BEAT / 2, b === 1);
    }
    arps.forEach((note, i) => { makeArp(ctx, note, barStart + i * BEAT / 2, BEAT / 2 * 0.85); });
    musicTimeout = setTimeout(() => { scheduleBar(ctx, barStart + BAR, chordIdx + 1); }, (BAR - 0.1) * 1000);
  }
  let engineNodes = null;
  function startEngine() {
    if (!audioCtx || engineNodes) return;
    const osc1 = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    osc1.type = 'sawtooth'; osc1.frequency.value = 60;
    gain.gain.value = 0.018;
    osc1.connect(gain); gain.connect(audioCtx.destination);
    osc1.start();
    engineNodes = { osc1, gain };
  }
  function updateEngine(speed) {
    if (!engineNodes) return;
    const f = 60 + speed * 80;
    engineNodes.osc1.frequency.setTargetAtTime(f, audioCtx.currentTime, 0.4);
    engineNodes.gain.gain.setTargetAtTime(0.018 + speed * 0.012, audioCtx.currentTime, 0.4);
  }
  function startMusic() {
    if (!audioCtx || musicRunning || !musicEnabled) return;
    musicRunning = true;
    masterGain = audioCtx.createGain();
    masterGain.gain.value = musicVolume * 0.55;
    masterGain.connect(audioCtx.destination);
    scheduleBar(audioCtx, audioCtx.currentTime + 0.05, 0);
  }
  function stopMusic() {
    musicRunning = false;
    clearTimeout(musicTimeout);
    if (masterGain) {
      masterGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.2);
      setTimeout(() => { masterGain = null; }, 500);
    }
  }
  function stopEngine() {
    if (!engineNodes) return;
    engineNodes.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.15);
    setTimeout(() => { try { engineNodes.osc1.stop(); } catch { /* already stopped */ } engineNodes = null; }, 400);
  }

  /*
   * ── PALETTE ──
   *
   * A WebGL scene cannot read the app's CSS tokens, so the app's dusk palette
   * is mirrored here by hand. Keep these named — the scene used to be a scatter
   * of neon literals (0xff2d9b / 0x00f5ff on a near-black 0x04000f void) which
   * belonged to a synthwave arcade, not to this app.
   *
   * Values track the dusk gradient the rest of the app sits on: deep indigo
   * overhead, mauve at mid-height, warm sand at the horizon, with Kawkab's blue
   * and the app amber as the two accents.
   */
  const VR = {
    skyTop: '#252a46',      // dusk zenith
    skyMid: '#5d4a5c',      // mauve band
    skyLow: '#9c7156',      // warm horizon
    fog: 0x6a5560,          // sits between mid and horizon so distance recedes
    ambient: 0x2b2f4d,
    keyLight: 0xffd9a8,     // warm sun, replaces the violet key
    warmAccent: 0xd9924f,   // app amber, replaces the hot pink
    coolAccent: 0x8fb8e8,   // Kawkab blue, replaces the electric cyan
    floor: 0x1b2140,
    laneLine: 0x4a4f7d,
    arch: 0x39406b,
    gem: 0xe8ac4e,
    /* The ship, as one named group rather than seven raw hexes inline.
     * These mirror the Spaceship game's palette (train-switch/CarPark3DProto)
     * so the two craft read as the same fleet: pale steel hull, cream spine,
     * dark glass canopy, warm nacelles and amber thrust. */
    hull: 0xc3d3e6,
    hullEmissive: 0x2f4763,
    stripe: 0xeaf4ff,
    glass: 0x0e1a22,
    glassEmissive: 0x6bb3c8,
    nacelle: 0x2a241a,
    thrust: 0xffd27a,
    invincible: 0x8fe8e0,   // the shield tell — cool, but no longer arcade cyan
    hazardBurst: 0xd9662f,  // debris from a destroyed obstacle
    cssGold: '#e8ac4e',     // same amber as --vr-gold, for the DOM-side popups
  };

  // ── THREE.JS SETUP ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch });
  /*
   * Pixel ratio capped at 1.5 everywhere, was 2 on desktop.
   *
   * This is the cheapest large win available: fragment cost scales with the
   * SQUARE of the ratio, so a retina/4K desktop was shading 1.78x the pixels
   * of a 1.5 cap for a full-screen tunnel where every pixel is lit and fogged.
   * At this scene's contrast — emissive neon on a soft dusk gradient — the
   * difference is close to invisible and the frame time is not.
   */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  /*
   * Shadows OFF, on every device.
   *
   * A PCFSoftShadowMap means a second full render pass of every caster, every
   * frame, plus a soft multi-tap lookup in the fragment shader of every
   * receiver. What it bought here was a faint blob under a ship that flies over
   * an emissive grid inside a fog bank — the floor is barely lit by the
   * directional light in the first place. The pass costs far more than the
   * effect reads.
   */
  renderer.shadowMap.enabled = false;
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();

  /*
   * The sky was a flat near-black clear colour, which is what made the game
   * read as a void rather than as a place. A three-stop vertical gradient on a
   * 2x256 canvas costs one texture and no geometry, and gives the runner the
   * same dusk horizon the rest of the app sits under.
   */
  function makeSky() {
    const c = document.createElement('canvas');
    c.width = 2; c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, VR.skyTop);
    grad.addColorStop(0.58, VR.skyMid);
    grad.addColorStop(1, VR.skyLow);
    g.fillStyle = grad;
    g.fillRect(0, 0, 2, 256);
    /*
     * Deliberately no colour-space/encoding set. This game pins three.js r128
     * from CDN, which predates the `colorSpace` API entirely, and the scene
     * sets no `outputEncoding` — every other colour here is raw unmanaged hex.
     * Tagging just this texture would make the sky the only colour-managed
     * surface and put it out of step with the palette it has to match.
     */
    return new THREE.CanvasTexture(c);
  }
  scene.background = makeSky();

  /*
   * Fog now sits between the mid and horizon stops rather than at near-black:
   * distance recedes INTO the sky instead of into a hole. Density is down from
   * 0.028 because a lighter fog colour at the old density hazed the near lanes.
   */
  scene.fog = new THREE.FogExp2(VR.fog, 0.019);

  const BASE_VFOV = 70;
  const camera = new THREE.PerspectiveCamera(BASE_VFOV, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(0, 2.8, 9);
  camera.lookAt(0, 0.5, 0);

  const TUNNEL_W = 9;
  const VISIBLE_WIDTH = TUNNEL_W + 2; // margin so the walls stay in frame too
  const REF_DIST = camera.position.z - 6; // depth where lane judgement matters most

  // Keep the full tunnel width in frame at any aspect ratio (fixes cropped
  // outer lanes on narrow/portrait phones — a fixed vertical FOV alone
  // starves horizontal FOV as aspect narrows).
  function fitCameraFov() {
    const aspect = camera.aspect;
    const desiredHFov = 2 * Math.atan(VISIBLE_WIDTH / (2 * REF_DIST));
    let vfov = 2 * Math.atan(Math.tan(desiredHFov / 2) / aspect) * (180 / Math.PI);
    vfov = Math.max(BASE_VFOV, Math.min(100, vfov));
    camera.fov = vfov;
    camera.updateProjectionMatrix();
  }
  fitCameraFov();

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    fitCameraFov();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // Touch devices get MeshLambertMaterial instead of MeshStandardMaterial —
  // same color/emissive/emissiveIntensity/transparent/opacity (Lambert
  // supports all of those), just without the roughness/metalness PBR
  // specular calculation, which is the single most expensive part of the
  // fragment shader once 5 dynamic lights are hitting every lit surface
  // (ship, obstacles, gems, tunnel). This is the cost that scales with how
  // much is on screen and lit — i.e. exactly the obstacle-dodging moments —
  // not the draw-call count fixed above. Desktop is untouched.
  function neonMat(opts) {
    if (!isTouch) return new THREE.MeshStandardMaterial(opts);
    const { roughness, metalness, ...rest } = opts;
    return new THREE.MeshLambertMaterial(rest);
  }

  // ── LIGHTING ──
  /*
   * Lit like dusk, not like a nightclub. The ambient is raised well above the
   * old 0x0a0020 so surfaces read without needing emissive neon to carry them —
   * this is most of what makes the scene "lighter".
   */
  const ambient = new THREE.AmbientLight(VR.ambient, 2.9);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(VR.keyLight, 2.2);
  dirLight.position.set(5, 12, 8);
  scene.add(dirLight);
  /*
   * ONE sweeping accent light, not two.
   *
   * There used to be a warm one and a cool one crossing the tunnel in opposite
   * directions. Every point light adds a full lighting evaluation per fragment
   * of every lit surface, and in a tunnel the camera is looking down a corridor
   * of overdraw — this is the fragment cost that scales with how much is on
   * screen, i.e. exactly the busy moments. Dropping from three point lights to
   * two removes a third of that math.
   *
   * The colour play survives because this one light cycles warm <-> cool as it
   * sweeps (see the run loop), which is what the crossing pair was there to
   * produce in the first place. `setRGB` into the existing Color allocates
   * nothing per frame.
   */
  const sweepLight = new THREE.PointLight(VR.warmAccent, 2.9, 26);
  sweepLight.position.set(-6, 3, 2);
  scene.add(sweepLight);
  const sweepWarm = new THREE.Color(VR.warmAccent);
  const sweepCool = new THREE.Color(VR.coolAccent);
  const shipLight = new THREE.PointLight(VR.coolAccent, 2.4, 10);
  scene.add(shipLight);

  // ── STAR FIELD ──
  const starGeo = new THREE.BufferGeometry();
  const SC = isTouch ? 1800 : 3000;
  const sp = new Float32Array(SC * 3);
  const scArr = new Float32Array(SC * 3);
  for (let i = 0; i < SC; i++) {
    sp[i * 3] = (Math.random() - 0.5) * 500;
    sp[i * 3 + 1] = (Math.random() - 0.5) * 200;
    sp[i * 3 + 2] = (Math.random() - 0.5) * 500 - 100;
    const t = Math.random();
    scArr[i * 3] = t > 0.7 ? 0 : 1;
    scArr[i * 3 + 1] = t > 0.7 ? 1 : t > 0.4 ? 0 : 0.5;
    scArr[i * 3 + 2] = t > 0.7 ? 1 : 1;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(scArr, 3));
  const starMat = new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.85 });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // ── NEON GRID TUNNEL ──
  // Instanced instead of 15 separate meshes x 30 segments (~450 draw calls,
  // the dominant cost on mobile GPUs where per-draw-call overhead dominates
  // over geometry complexity). Same geometry/materials/positions as before —
  // this only changes HOW it's drawn, not how it looks. Segment count is cut
  // for touch since fog (density 0.028) already hides the tunnel well before
  // either segment count's draw distance, so the difference is invisible.
  const TUNNEL_H = 6.5; const SEG_DEPTH = 5; const NUM_SEGS = isTouch ? 20 : 30;
  const LINES_PER_SEG = 9; // i = -4..4
  const segZ = new Float32Array(NUM_SEGS);
  for (let i = 0; i < NUM_SEGS; i++) segZ[i] = -i * SEG_DEPTH;

  const floorGeo = new THREE.PlaneGeometry(TUNNEL_W, SEG_DEPTH, 8, 1);
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = neonMat({ color: VR.floor, roughness: 1, metalness: 0, emissive: 0x0d1128 });
  const floorMesh = new THREE.InstancedMesh(floorGeo, floorMat, NUM_SEGS);
  // (shadowMap is disabled — see the renderer setup; these flags are inert)
  scene.add(floorMesh);

  const lineGeo = new THREE.BoxGeometry(0.04, 0.02, SEG_DEPTH);
  const lineMat = neonMat({ color: VR.laneLine, emissive: VR.laneLine, emissiveIntensity: 1.15 });
  const lineMesh = new THREE.InstancedMesh(lineGeo, lineMat, NUM_SEGS * LINES_PER_SEG);
  scene.add(lineMesh);

  const stripGeo = new THREE.BoxGeometry(0.06, 0.06, SEG_DEPTH);
  const leftStripMat = neonMat({ color: VR.warmAccent, emissive: VR.warmAccent, emissiveIntensity: 1.1 });
  const rightStripMat = neonMat({ color: VR.coolAccent, emissive: VR.coolAccent, emissiveIntensity: 1.1 });
  const leftStripMesh = new THREE.InstancedMesh(stripGeo, leftStripMat, NUM_SEGS);
  const rightStripMesh = new THREE.InstancedMesh(stripGeo, rightStripMat, NUM_SEGS);
  scene.add(leftStripMesh); scene.add(rightStripMesh);

  const archMat = neonMat({ color: VR.arch, emissive: VR.arch, emissiveIntensity: 0.8 });
  const sideArchGeo = new THREE.BoxGeometry(0.1, TUNNEL_H, 0.1);
  const sideArchMesh = new THREE.InstancedMesh(sideArchGeo, archMat, NUM_SEGS * 2); // left+right
  scene.add(sideArchMesh);
  const topArchGeo = new THREE.BoxGeometry(TUNNEL_W, 0.1, 0.1);
  const topArchMesh = new THREE.InstancedMesh(topArchGeo, archMat, NUM_SEGS);
  scene.add(topArchMesh);

  const _tm = new THREE.Matrix4();
  const _tpos = new THREE.Vector3();
  const _tquat = new THREE.Quaternion();
  const _tscale = new THREE.Vector3(1, 1, 1);
  function setInstance(mesh, idx, x, y, z) {
    _tpos.set(x, y, z);
    _tm.compose(_tpos, _tquat, _tscale);
    mesh.setMatrixAt(idx, _tm);
  }
  function updateTunnelInstances() {
    for (let i = 0; i < NUM_SEGS; i++) {
      const z = segZ[i];
      setInstance(floorMesh, i, 0, -1.1, z);
      for (let li = 0; li < LINES_PER_SEG; li++) setInstance(lineMesh, i * LINES_PER_SEG + li, li - 4, -1.09, z);
      setInstance(leftStripMesh, i, -TUNNEL_W / 2, -1.05, z);
      setInstance(rightStripMesh, i, TUNNEL_W / 2, -1.05, z);
      const archZ = z - SEG_DEPTH / 2;
      setInstance(sideArchMesh, i * 2, -TUNNEL_W / 2, TUNNEL_H / 2 - 1.1, archZ);
      setInstance(sideArchMesh, i * 2 + 1, TUNNEL_W / 2, TUNNEL_H / 2 - 1.1, archZ);
      setInstance(topArchMesh, i, 0, TUNNEL_H - 1.1, archZ);
    }
    floorMesh.instanceMatrix.needsUpdate = true;
    lineMesh.instanceMatrix.needsUpdate = true;
    leftStripMesh.instanceMatrix.needsUpdate = true;
    rightStripMesh.instanceMatrix.needsUpdate = true;
    sideArchMesh.instanceMatrix.needsUpdate = true;
    topArchMesh.instanceMatrix.needsUpdate = true;
  }
  updateTunnelInstances();

  // ── SHIP ──
  /*
   * The same craft the Spaceship game flies (attention/train-switch,
   * CarPark3DProto) — an extruded hull silhouette rather than a cone with a box
   * through it, so the two games read as one fleet. Parts, in build order:
   * hull, cream dorsal stripe, glass canopy, twin nacelles + thrust flames,
   * under-glow halo, engine core, trail.
   *
   * ⚠ Nothing outside here may address these parts by child INDEX. The original
   * flashed `children[3]` "// cockpit" when index 3 was a wing tip, and this
   * rebuild would have silently broken the corrected index too. Named handles
   * on `userData` cannot drift when a part is added or reordered.
   */
  function hullGeometry() {
    const s = new THREE.Shape();
    // Right half (y >= 0), nose at +X — mirrored below for the left side.
    s.moveTo(0.52, 0);
    s.quadraticCurveTo(0.42, 0.1, 0.2, 0.13);      // nose -> shoulder
    s.lineTo(0.06, 0.15);                           // body side
    s.lineTo(-0.12, 0.42);                          // wing leading edge
    s.lineTo(-0.26, 0.44);                          // wing tip
    s.lineTo(-0.2, 0.15);                           // wing trailing edge
    s.lineTo(-0.34, 0.13);                          // rear body
    s.lineTo(-0.46, 0.2);                           // tail fin
    s.lineTo(-0.4, 0.06);                           // tail notch
    s.lineTo(-0.4, -0.06);
    s.lineTo(-0.46, -0.2);
    s.lineTo(-0.34, -0.13);
    s.lineTo(-0.2, -0.15);
    s.lineTo(-0.26, -0.44);
    s.lineTo(-0.12, -0.42);
    s.lineTo(0.06, -0.15);
    s.lineTo(0.2, -0.13);
    s.quadraticCurveTo(0.42, -0.1, 0.52, 0);
    const geo = new THREE.ExtrudeGeometry(s, {
      depth: 0.09,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 2,
      curveSegments: 8,
    });
    /* The silhouette is authored flat in XY with the nose at +X (it is drawn
     * top-down in the Spaceship game). Void Runner flies down -Z with the
     * camera behind, so the geometry is baked into that frame ONCE here —
     * nose -> -Z, wingspan -> +/-X, extrusion depth -> +Y — instead of paying
     * two mesh rotations every frame. */
    geo.rotateX(-Math.PI / 2);
    geo.rotateY(Math.PI / 2);
    geo.center();
    return geo;
  }

  function buildShip() {
    const g = new THREE.Group();
    const S = 2.3;   // hull is ~1.04 long in shape units -> ~2.4 world units

    const hull = new THREE.Mesh(
      hullGeometry(),
      neonMat({ color: VR.hull, emissive: VR.hullEmissive, emissiveIntensity: 0.55, roughness: 0.3, metalness: 0.6 }),
    );
    hull.scale.setScalar(S);
    
    g.add(hull);

    // Cream dorsal stripe down the spine.
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(S * 0.05, 0.012, S * 0.66),
      neonMat({ color: VR.stripe, emissive: VR.stripe, emissiveIntensity: 0.45, roughness: 0.4, metalness: 0.3 }),
    );
    stripe.position.set(0, S * 0.055, -S * 0.02);
    g.add(stripe);

    // Glass canopy.
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(S * 0.13, 14, 10),
      neonMat({ color: VR.glass, emissive: VR.glassEmissive, emissiveIntensity: 0.5, roughness: 0.15, metalness: 0.7 }),
    );
    cockpit.scale.set(1, 0.62, 1.7);
    cockpit.position.set(0, S * 0.06, -S * 0.18);
    g.add(cockpit);

    // Twin nacelles + thrust flames.
    const thrusters = [];
    for (const side of [-1, 1]) {
      const nac = new THREE.Mesh(
        new THREE.CylinderGeometry(S * 0.055, S * 0.075, S * 0.3, 10),
        neonMat({ color: VR.nacelle, emissive: VR.warmAccent, emissiveIntensity: 0.2, roughness: 0.35, metalness: 0.6 }),
      );
      nac.rotation.x = Math.PI / 2;
      nac.position.set(side * S * 0.19, S * 0.02, S * 0.28);
      g.add(nac);
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(S * 0.055, S * 0.3, 8),
        new THREE.MeshBasicMaterial({
          color: VR.thrust,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      /* Apex +Z, i.e. tapering AWAY behind the ship: a cone's apex is +Y, and
       * +PI/2 about X maps +Y to +Z. (-PI/2 points it forward, which buries the
       * wide end of the flame inside the hull.) Positioned so the base sits at
       * the tail — the hull's half-length is 1.21 at this scale and the cone is
       * 0.69 long, so 0.68*S puts the base on the transom, not through it. */
      flame.rotation.x = Math.PI / 2;
      flame.position.set(side * S * 0.19, S * 0.02, S * 0.68);
      g.add(flame);
      thrusters.push(flame);
    }

    // Under-glow halo, so the ship sits ON the lane rather than floating over it.
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(S * 0.55, 20),
      new THREE.MeshBasicMaterial({
        color: VR.coolAccent,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -S * 0.09;
    g.add(halo);

    // Engine core — the part the run loop pulses, and the invincibility tell.
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      neonMat({ color: VR.coolAccent, emissive: VR.coolAccent, emissiveIntensity: 2.8, transparent: true, opacity: 0.85 }),
    );
    glow.position.set(0, S * 0.02, S * 0.42);
    g.add(glow);

    const trail = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 1.0, 8),
      neonMat({ color: VR.coolAccent, emissive: VR.coolAccent, emissiveIntensity: 2.4, transparent: true, opacity: 0.45 }),
    );
    trail.rotation.x = -Math.PI / 2;
    trail.position.set(0, S * 0.02, S * 0.72);
    g.add(trail);

    // Named handles — see the warning above. Never index into g.children.
    g.userData.cockpit = cockpit;
    g.userData.glow = glow;
    g.userData.thrusters = thrusters;
    return g;
  }
  const SHIP_BASE_Y = 0.3;
  const ship = buildShip();
  const shipCockpit = ship.userData.cockpit;
  const shipGlow = ship.userData.glow;
  const shipThrusters = ship.userData.thrusters;
  ship.position.set(0, SHIP_BASE_Y, 6);
  ship.frustumCulled = false;
  ship.traverse((child) => { child.frustumCulled = false; });
  scene.add(ship);

  // ── OBSTACLE POOL ──
  const POOL_SIZE = 20;
  const obstaclePool = [];
  const activeObstacles = [];
  const obsMats = [
    neonMat({ color: 0xff2d2d, emissive: 0x660000, roughness: 0.3, metalness: 0.7 }),
    neonMat({ color: 0xff6600, emissive: 0x552200, roughness: 0.3, metalness: 0.7 }),
    neonMat({ color: 0xcc00ff, emissive: 0x440066, roughness: 0.3, metalness: 0.7 }),
    neonMat({ color: 0xff0066, emissive: 0x550022, roughness: 0.3, metalness: 0.7 }),
    neonMat({ color: 0xff4400, emissive: 0x661100, roughness: 0.3, metalness: 0.7 }),
  ];
  const obsGeos = [
    new THREE.BoxGeometry(1.3, 1.3, 1.3),
    new THREE.OctahedronGeometry(0.85),
    new THREE.TetrahedronGeometry(1.0),
    new THREE.IcosahedronGeometry(0.75),
    new THREE.TorusGeometry(0.65, 0.22, 8, 14),
  ];
  function getObstacleFromPool() {
    if (obstaclePool.length > 0) {
      const obj = obstaclePool.pop();
      obj.group.visible = true;
      return obj;
    }
    const geoIdx = Math.floor(Math.random() * obsGeos.length);
    const matIdx = Math.floor(Math.random() * obsMats.length);
    const mesh = new THREE.Mesh(obsGeos[geoIdx], obsMats[matIdx]);
    
    const ringM = neonMat({ color: obsMats[matIdx].color, emissive: obsMats[matIdx].color, emissiveIntensity: 3, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.04, 4, 20), ringM);
    ring.name = 'ring';
    const grp = new THREE.Group();
    grp.add(mesh); grp.add(ring);
    scene.add(grp);
    return { group: grp, mesh, ring };
  }
  function returnObstacleToPool(obj) {
    obj.group.visible = false;
    scene.remove(obj.group);
    obstaclePool.push(obj);
  }
  for (let i = 0; i < POOL_SIZE; i++) { returnObstacleToPool(getObstacleFromPool()); }

  // ── GEM POOL ──
  const gemPool = [];
  const activeGems = [];
  const gemMat = neonMat({ color: VR.gem, emissive: 0xc98a30, emissiveIntensity: 1.8, roughness: 0.1, metalness: 0.8 });
  function getGem() {
    if (gemPool.length > 0) { const g = gemPool.pop(); g.visible = true; scene.add(g); return g; }
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.38), gemMat);
    
    scene.add(m);
    return m;
  }
  function returnGem(g) { g.visible = false; scene.remove(g); gemPool.push(g); }

  // ── PARTICLES ──
  /*
   * ── Particles are POOLED, and that is a frame-time fix, not tidiness ──
   *
   * Every explosion used to allocate 18 Meshes, 18 SphereGeometries and 18
   * materials, and every gem 10 more — then dispose each geometry as the
   * particle died. That is ~28 object allocations plus 28 GPU buffer
   * uploads and deletions at the exact instants the game is busiest: taking a
   * hit, or grabbing a gem mid-dodge. It is a textbook GC hitch, and it lines
   * up precisely with "it lags when I go left and right", because that is when
   * these fire. (The materials were never disposed at all — a real leak: one
   * per particle, forever.)
   *
   * The pool is built ONCE. Geometry is shared across every particle of a kind;
   * each pooled mesh keeps its own material because opacity fades per particle,
   * but those materials are created once at boot and reused for the whole
   * session. Running out of pool just means the oldest particle is recycled —
   * far better than a stutter.
   */
  const PARTICLE_POOL = { spark: 72, gem: 40 };
  const sparkGeo = new THREE.SphereGeometry(0.12, 4, 4);
  const gemShardGeo = new THREE.OctahedronGeometry(0.06);
  const particles = [];      // live
  const particlePool = { spark: [], gem: [] };
  function makeParticle(kind) {
    const mesh = new THREE.Mesh(
      kind === 'gem' ? gemShardGeo : sparkGeo,
      neonMat({
        color: kind === 'gem' ? VR.gem : VR.hazardBurst,
        emissive: kind === 'gem' ? VR.gem : VR.hazardBurst,
        emissiveIntensity: kind === 'gem' ? 4 : 3,
        transparent: true,
        opacity: 1,
      }),
    );
    mesh.visible = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
    return mesh;
  }
  for (let i = 0; i < PARTICLE_POOL.spark; i++) particlePool.spark.push(makeParticle('spark'));
  for (let i = 0; i < PARTICLE_POOL.gem; i++) particlePool.gem.push(makeParticle('gem'));

  function takeParticle(kind) {
    const pool = particlePool[kind];
    if (pool.length) return pool.pop();
    // Pool exhausted: steal the oldest live particle of this kind rather than
    // allocate. A recycled spark is invisible; a dropped frame is not.
    for (let i = 0; i < particles.length; i++) {
      if (particles[i].kind === kind) {
        const stolen = particles[i].mesh;
        particles.splice(i, 1);
        return stolen;
      }
    }
    return null;
  }
  function emit(kind, x, y, z, vx, vy, vz, decay, scale) {
    const mesh = takeParticle(kind);
    if (!mesh) return;
    mesh.position.set(x, y, z);
    mesh.scale.setScalar(scale);
    mesh.material.opacity = 1;
    mesh.visible = true;
    particles.push({ kind, mesh, vx, vy, vz, life: 1, decay });
  }
  function spawnExplosion(x, y, z) {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2; const b = Math.random() * Math.PI;
      const spd = Math.random() * 0.35 + 0.1;
      emit('spark', x, y, z,
        Math.sin(b) * Math.cos(a) * spd, Math.sin(b) * Math.sin(a) * spd, Math.cos(b) * spd,
        0.025 + Math.random() * 0.02, 0.65 + Math.random() * 1.15);
    }
  }
  function spawnGemParticles(x, y, z) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      emit('gem', x, y, z, Math.cos(a) * 0.18, 0.15 + Math.random() * 0.1, Math.sin(a) * 0.18, 0.04, 1);
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.mesh.position.x += p.vx * dt;
      p.mesh.position.y += p.vy * dt;
      p.mesh.position.z += p.vz * dt;
      p.vy -= 0.008 * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        p.mesh.visible = false;
        particlePool[p.kind].push(p.mesh);
        particles.splice(i, 1);
        continue;
      }
      p.mesh.material.opacity = Math.max(0, p.life);
      p.mesh.scale.setScalar(p.life);
    }
  }

  // ── CSS-DRIVEN FEEDBACK ──
  const popupTimers = {};
  function showPopup(text, color, duration = 700) {
    const el = q('#vr-popup');
    el.textContent = text;
    el.style.color = color;
    el.style.opacity = '1';
    el.style.transform = 'translateX(-50%) scale(1)';
    clearTimeout(popupTimers.popup);
    popupTimers.popup = setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(-50%) scale(0.8)'; }, duration);
  }
  function flashScreen(id, dur = 150) {
    const el = q(`#${id}`);
    el.style.opacity = '1';
    const key = `flash-${id}`;
    clearTimeout(popupTimers[key]);
    popupTimers[key] = setTimeout(() => { el.style.opacity = '0'; }, dur);
  }

  /* ── PULSE CANNON ────────────────────────────────────────────────────────
   *
   * Gems charge a weapon instead of only scoring. Collect PULSE_NEED of them
   * and the cannon arms; TAP to spend it for PULSE_MS of auto-fire that
   * destroys obstacles outright.
   *
   * Tap is the right verb here precisely because steering became a swipe —
   * the gesture is free, it needs no new on-screen button competing with the
   * board, and it cannot be confused with steering (a tap that moves far enough
   * to change lane is a swipe, and is not a fire).
   *
   * Bolts are pooled for the same reason the particles are: firing is a burst
   * of activity at the busiest moment of a run, and that is the worst possible
   * time to allocate.
   */
  const PULSE_NEED = 8;        // gems to arm
  const PULSE_MS = 7000;       // active window
  const PULSE_INTERVAL = 130;  // ms between bolts
  const PULSE_SPEED = 1.15;    // world units per frame-unit, away from camera
  const BOLT_POOL = 16;
  const boltGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.5, 6);
  boltGeo.rotateX(Math.PI / 2);   // baked: axis along Z, the direction of travel
  const boltMat = new THREE.MeshBasicMaterial({
    color: VR.thrust, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const boltPool = [];
  const activeBolts = [];
  for (let i = 0; i < BOLT_POOL; i++) {
    const b = new THREE.Mesh(boltGeo, boltMat);
    b.visible = false;
    b.frustumCulled = false;
    scene.add(b);
    boltPool.push(b);
  }
  let pulseCharge = 0;      // gems banked toward the next cannon
  let pulseTimer = 0;       // ms of fire left
  let pulseCooldown = 0;    // ms until the next bolt

  function fireBolt(x) {
    const b = boltPool.pop();
    if (!b) return;
    b.position.set(x, SHIP_BASE_Y, ship.position.z - 1.6);
    b.visible = true;
    activeBolts.push(b);
  }
  function retireBolt(idx) {
    const b = activeBolts[idx];
    b.visible = false;
    activeBolts.splice(idx, 1);
    boltPool.push(b);
  }
  function clearBolts() {
    for (let i = activeBolts.length - 1; i >= 0; i--) retireBolt(i);
  }

  /* One place that owns the meter, so the three states cannot disagree.
   * Dirty-checked like the rest of the HUD — this runs every frame while
   * firing. */
  function setPulseHud(mode) {
    const pct = mode === 'firing'
      ? Math.round((pulseTimer / PULSE_MS) * 100)
      : Math.round((pulseCharge / PULSE_NEED) * 100);
    if (pct !== hudCache.power) {
      hud.powerFill.style.width = `${pct}%`;
      hudCache.power = pct;
    }
    if (mode !== hudCache.powerState) {
      hud.power.classList.toggle('vr-ready', mode === 'ready');
      hud.power.classList.toggle('vr-firing', mode === 'firing');
      // Name the gesture the player actually has. `isTouch` is the same probe
      // the renderer uses to pick its quality tier.
      hud.powerLabel.textContent = mode === 'firing'
        ? 'FIRING'
        : mode === 'ready' ? (isTouch ? 'TAP TO FIRE' : 'SPACE TO FIRE') : 'PULSE';
      hudCache.powerState = mode;
    }
  }

  /** A tap (not a swipe) spends a charged cannon. */
  function tryFirePulse() {
    if (state !== 'playing') return;
    if (pulseTimer > 0) return;                 // already firing
    if (pulseCharge < PULSE_NEED) return;       // not charged yet
    pulseTimer = PULSE_MS;
    pulseCooldown = 0;
    setPulseHud('firing');
    showPopup('PULSE CANNON', VR.cssGold, 900);
    sfxPulseArm();
  }

  /* Elements the run loop touches, resolved ONCE. `q` is a querySelector, and
   * these were being re-queried on every frame. */
  const hud = {
    score: q('#vr-scorehud'),
    level: q('#vr-levelhud'),
    speedFill: q('#vr-speedfill'),
    speedLines: q('#vr-speedlines'),
    warnFlash: q('#vr-warningflash'),
    combo: q('#vr-combodisplay'),
    comboText: q('#vr-combotext'),
    power: q('#vr-power'),
    powerFill: q('#vr-powerfill'),
    powerLabel: q('#vr-powerlabel'),
  };
  const hudCache = { speedPct: -1, score: -1, lines: -1, warn: -1, power: -1, powerState: '' };

  // ── GAME STATE ──
  const LANES = [-3.2, 0, 3.2];
  let state = 'menu'; // menu | countdown | playing | paused | gameover
  let score = 0;
  let bestScore = parseInt(localStorage.getItem('vrBest') || '0', 10);
  let lives = 3; let level = 1; let gemsCollected = 0;
  let gameSpeed = 0;
  let rawSpeed = 0.32;
  const MAX_RAW_SPEED = 0.85;
  let shipTargetX = 0; let shipCurrentX = 0; let shipTiltZ = 0;
  const MOVE_K = 16;

  let musicEnabled = true; let sfxEnabled = true;
  let musicVolume = 0.7; let sfxVolume = 0.8;
  let playerName = localStorage.getItem('vrName') || 'PILOT';

  function loadScores() { try { return JSON.parse(localStorage.getItem('vrScores') || '[]'); } catch { return []; } }
  function saveScore(name, sc, lv, gm) {
    const scores = loadScores();
    scores.push({ name: name.toUpperCase().slice(0, 10), score: sc, level: lv, gems: gm, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores.splice(5);
    localStorage.setItem('vrScores', JSON.stringify(scores));
  }
  function clearScores() {
    if (window.confirm('Clear all high scores?')) {
      localStorage.removeItem('vrScores');
      renderHighScores();
      sfxMenuClick();
    }
  }
  function renderHighScores() {
    const scores = loadScores();
    const tbl = q('#vr-hstable');
    if (!scores.length) { tbl.innerHTML = '<div class="vr-hs-empty">NO SCORES YET<br>BE THE FIRST PILOT!</div>'; return; }
    const rankClass = ['vr-gold-rank', 'vr-silver', 'vr-bronze', 'vr-other', 'vr-other'];
    const rankLabel = ['1ST', '2ND', '3RD', '4TH', '5TH'];
    tbl.innerHTML = scores.map((s, i) => `
      <div class="vr-hs-row">
        <div class="vr-hs-rank ${rankClass[i]}">${rankLabel[i]}</div>
        <div class="vr-hs-name">${s.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px">LV${s.level}</div>
        <div class="vr-hs-score">${s.score}</div>
      </div>`).join('');
  }

  // ── SCREEN MANAGER ──
  const ALL_SCREENS = ['vr-menuscreen', 'vr-highscorescreen', 'vr-settingsscreen', 'vr-howscreen', 'vr-countdownscreen', 'vr-pausescreen', 'vr-gameoverscreen'];
  function showScreen(id) {
    sfxMenuClick();
    ALL_SCREENS.forEach((s) => { const el = q(`#${s}`); if (el) el.style.display = 'none'; });
    const target = q(`#${id}`);
    if (target) target.style.display = 'flex';
    if (id === 'vr-highscorescreen') renderHighScores();
    if (id === 'vr-settingsscreen') {
      q('#vr-nameinput').value = playerName;
      q('#vr-musicvol').value = Math.round(musicVolume * 100);
      q('#vr-sfxvol').value = Math.round(sfxVolume * 100);
      q('#vr-musictoggle').textContent = musicEnabled ? 'ON' : 'OFF';
      q('#vr-musictoggle').className = 'vr-toggle-btn ' + (musicEnabled ? 'vr-on' : 'vr-off');
      q('#vr-sfxtoggle').textContent = sfxEnabled ? 'ON' : 'OFF';
      q('#vr-sfxtoggle').className = 'vr-toggle-btn ' + (sfxEnabled ? 'vr-on' : 'vr-off');
    }
  }

  function saveName() { playerName = q('#vr-nameinput').value || 'PILOT'; localStorage.setItem('vrName', playerName); }
  function updateMusicVolFromInput(v) {
    musicVolume = v / 100;
    if (masterGain) masterGain.gain.setTargetAtTime(musicVolume * 0.55, audioCtx.currentTime, 0.1);
  }
  function updateSfxVolFromInput(v) { sfxVolume = v / 100; }
  function toggleMusic() {
    musicEnabled = !musicEnabled;
    q('#vr-musictoggle').textContent = musicEnabled ? 'ON' : 'OFF';
    q('#vr-musictoggle').className = 'vr-toggle-btn ' + (musicEnabled ? 'vr-on' : 'vr-off');
    if (!musicEnabled) stopMusic();
    else if (state === 'playing') { initAudio(); startMusic(); }
  }
  function toggleSfx() {
    sfxEnabled = !sfxEnabled;
    q('#vr-sfxtoggle').textContent = sfxEnabled ? 'ON' : 'OFF';
    q('#vr-sfxtoggle').className = 'vr-toggle-btn ' + (sfxEnabled ? 'vr-on' : 'vr-off');
  }
  function exitGame() {
    sfxMenuClick();
    onBack?.();
  }

  let invincible = false; let invincibleTimer = 0;
  let camShake = 0;
  let combo = 0; let comboTimer = 0;
  let time = 0;
  let obsCooldown = 0; let gemCooldown = 0;
  let totalFrames = 0;
  let prevLevel = 1;

  const keys = { left: false, right: false };

  q('#vr-besthud').textContent = bestScore;
  q('#vr-menubest').textContent = `\u{1F3C6} BEST: ${bestScore}`;
  if (bestScore > 0) q('#vr-menubest').style.opacity = '1';

  // ── INPUT: keyboard ──
  function onKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (state === 'playing' || state === 'paused') togglePause();
    }
    /* SPACE is the desktop trigger for the Pulse Cannon — the keyboard
     * counterpart of the tap, and free for it because steering is on the arrow
     * keys. It keeps its existing job of starting a run, which cannot collide:
     * the two uses are gated on mutually exclusive states.
     *
     * preventDefault because Space scrolls, and because a Space press that
     * arrives while a menu button still holds focus would otherwise re-trigger
     * that button as a click.
     */
    if (e.key === ' ' && state === 'playing') { e.preventDefault(); tryFirePulse(); return; }
    if ((e.key === ' ' || e.key === 'Enter') && (state === 'gameover' || state === 'menu')) {
      e.preventDefault();
      startCountdown();
    }
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // ── INPUT: SWIPE left/right to change lane.
  //
  // One pointer path for both touch and mouse (Pointer Events), attached to the
  // canvas specifically — never to `document` — so the pause button, HUD and
  // menu buttons, which are sibling elements layered above, cannot also reach
  // it. That single path is load-bearing: an earlier version ran swipe
  // detection on `document` AND separate touch handlers on the thumb buttons,
  // and a jittery tap could fire both, moving two lanes at once.
  //
  // A swipe is measured in a fraction of the viewport rather than raw pixels so
  // the gesture feels the same on a phone and a tablet, and the origin RESETS
  // after each step, so one long drag can walk left-to-right across all three
  // lanes without lifting a finger. ──
  let currentLaneIdx = 1;
  let laneLock = false;
  function moveLane(dir) {
    if (laneLock) return;
    const next = currentLaneIdx + (dir === 'left' ? -1 : 1);
    if (next < 0 || next >= LANES.length) return;
    currentLaneIdx = next;
    shipTargetX = LANES[currentLaneIdx];
    laneLock = true;
    if (sfxEnabled && audioCtx) playTone(dir === 'left' ? 300 : 340, 'sine', 0.04, 0.03 * sfxVolume);
    pulseSide(dir);
  }
  let pulseTimers = {};
  function pulseSide(dir) {
    const el = q(dir === 'left' ? '#vr-btnleft' : '#vr-btnright');
    if (!el) return;
    el.classList.add('vr-pressed');
    clearTimeout(pulseTimers[dir]);
    pulseTimers[dir] = setTimeout(() => el.classList.remove('vr-pressed'), 140);
  }
  /* A swipe must clear 7% of the viewport width, with a 44px floor so it is
   * never shorter than a fingertip's own jitter. Deliberately generous: a
   * missed lane change at speed costs a life. */
  const swipeStep = () => Math.max(44, (canvas.clientWidth || window.innerWidth) * 0.07);
  let swipePointerId = null;
  let swipeOriginX = 0;
  let swipeOriginY = 0;
  // A gesture is a TAP only if it never steered, stayed put, and was brief —
  // so the cannon can share the canvas with steering without either stealing
  // the other's input.
  let swipeSteered = false;
  let tapStartX = 0;
  let tapStartY = 0;
  let tapStartT = 0;

  /* The hint has done its job the moment the player swipes once. Fades rather
   * than disappears, so it never reads as something breaking mid-run. */
  let swipeHintHidden = false;
  function hideSwipeHint() {
    if (swipeHintHidden) return;
    swipeHintHidden = true;
    q('#vr-swipehint')?.classList.add('vr-faded');
  }

  function onPointerDown(e) {
    initAudio();
    if (state !== 'playing') return;
    if (swipePointerId !== null) return;   // ignore a second finger mid-gesture
    swipePointerId = e.pointerId;
    swipeOriginX = e.clientX;
    swipeOriginY = e.clientY;
    tapStartX = e.clientX;
    tapStartY = e.clientY;
    tapStartT = performance.now();
    swipeSteered = false;
    /* Capture, so a swipe that runs off the edge of the canvas keeps
     * delivering moves instead of dying halfway — the lanes are 3.2 apart and
     * the outer ones are reached by swiping toward the edge of the screen,
     * which is exactly where an uncaptured pointer stops reporting. */
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not fatal */ }
  }
  function onPointerMove(e) {
    if (e.pointerId !== swipePointerId || state !== 'playing') return;
    const dx = e.clientX - swipeOriginX;
    const step = swipeStep();
    if (Math.abs(dx) < step) return;
    /* Vertical drags are not lane changes. Checked only once the horizontal
     * threshold is already met, so a diagonal flick still counts — this
     * rejects a scroll-like drag, not an imperfect swipe. */
    if (Math.abs(e.clientY - swipeOriginY) > Math.abs(dx) * 1.2) return;
    moveLane(dx < 0 ? 'left' : 'right');
    swipeSteered = true;
    hideSwipeHint();
    // Re-origin so a continued drag can step again, one lane per step.
    swipeOriginX = e.clientX;
    swipeOriginY = e.clientY;
  }
  function endSwipe(e) {
    if (e.pointerId !== swipePointerId) return;
    try { canvas.releasePointerCapture(e.pointerId); } catch { /* already gone */ }
    swipePointerId = null;
    if (e.type !== 'pointerup') return;   // a cancel is never a tap
    const moved = Math.hypot(e.clientX - tapStartX, e.clientY - tapStartY);
    if (!swipeSteered && moved < 16 && performance.now() - tapStartT < 320) tryFirePulse();
  }
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endSwipe);
  canvas.addEventListener('pointercancel', endSwipe);

  // ── SPAWN ──
  function spawnObstacle() {
    const obj = getObstacleFromPool();
    const laneIdx = Math.floor(Math.random() * LANES.length);
    const lane = LANES[laneIdx];
    // Height is centred on the ship's fixed cruise Y (it never moves
    // vertically) and kept within the 0.95 hit-test radius with margin —
    // previously this ranged 0.3..2.1 while only ~-0.65..1.25 was ever
    // reachable, so roughly half of everything spawned could never be hit.
    const height = SHIP_BASE_Y + (Math.random() - 0.5) * 1.5;
    obj.group.position.set(lane, height, -90);
    obj.group.visible = true;
    scene.add(obj.group);
    obj.mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    obj.ring.rotation.x = Math.random();
    obj.rotSpd = new THREE.Vector3((Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.06, (Math.random() - 0.5) * 0.04);
    obj.lane = laneIdx;
    obj.warned = false;
    activeObstacles.push(obj);
  }
  function spawnGem() {
    const g = getGem();
    const laneIdx = Math.floor(Math.random() * LANES.length);
    // Same reachability fix as obstacles, sized to the gem hit radius (1.1).
    g.position.set(LANES[laneIdx], SHIP_BASE_Y + (Math.random() - 0.5) * 1.7, -95);
    g.rotation.set(0, 0, 0);
    activeGems.push(g);
  }

  function updateLivesHud() {
    for (let i = 1; i <= 3; i++) q(`#vr-h${i}`).classList.toggle('vr-dead', i > lives);
  }

  // ── MAIN LOOP ──
  let lastTS = 0;
  let rafId = null;
  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    const rawDt = Math.min((ts - lastTS) / 16.667, 3.0);
    lastTS = ts;
    totalFrames++;
    time = totalFrames / 60;

    stars.rotation.y += 0.00008 * rawDt;

    if (state === 'playing') {
      for (let i = 0; i < NUM_SEGS; i++) {
        segZ[i] += rawSpeed * rawDt;
        if (segZ[i] > 12) segZ[i] -= NUM_SEGS * SEG_DEPTH;
      }
      updateTunnelInstances();
    }

    if (state === 'menu' || state === 'gameover') {
      ship.position.y = SHIP_BASE_Y + Math.sin(time * 1.2) * 0.2;
      ship.rotation.y = Math.sin(time * 0.4) * 0.25;
      camera.position.x = Math.sin(time * 0.2) * 1.5;
      camera.lookAt(0, 0.5, 0);
      shipLight.position.copy(ship.position);
      updateParticles(rawDt);
      renderer.render(scene, camera);
      return;
    }
    if (state === 'paused' || state === 'countdown') { renderer.render(scene, camera); return; }

    // ═══ PLAYING ═══
    if (keys.left) moveLane('left');
    if (keys.right) moveLane('right');

    const dt_s = rawDt / 60;
    const alpha = 1 - Math.exp(-MOVE_K * dt_s);
    const prevX = shipCurrentX;
    shipCurrentX += alpha * (shipTargetX - shipCurrentX);
    shipCurrentX = Math.max(-3.2, Math.min(3.2, shipCurrentX));
    if (laneLock && Math.abs(shipCurrentX - shipTargetX) < 0.12) laneLock = false;

    const velX = (shipCurrentX - prevX) / dt_s;
    const tiltTgt = -velX * 0.010;
    shipTiltZ += (tiltTgt - shipTiltZ) * alpha * 1.2;

    ship.position.x = shipCurrentX;
    ship.position.y = SHIP_BASE_Y + Math.sin(time * 2) * 0.04;
    ship.rotation.z = Math.max(-0.45, Math.min(0.45, shipTiltZ));
    ship.rotation.y = shipTiltZ * 0.12;
    shipGlow.material.emissiveIntensity = 3.5 + Math.sin(time * 25) * 1.0;
    // Thrust flicker — the same idle the Spaceship game gives its craft.
    for (let i = 0; i < shipThrusters.length; i++) {
      const f = shipThrusters[i];
      f.scale.z = 0.85 + Math.sin(time * 22 + i * 1.7) * 0.22;
      f.material.opacity = 0.7 + Math.sin(time * 19 + i) * 0.15;
    }

    shipLight.position.copy(ship.position);
    shipLight.position.z += 1;

    if (invincible) {
      invincibleTimer -= rawDt;
      const pulse = 0.5 + 0.5 * Math.sin(invincibleTimer * 0.4);
      // Named handles, never child indices: this used to reach for
      // `children[3] // cockpit` when index 3 was a wing tip, and the corrected
      // index would have broken again the moment the ship was rebuilt.
      shipCockpit.material.emissive.setHex(VR.invincible);
      shipCockpit.material.emissiveIntensity = 2 + pulse * 3;
      shipGlow.material.emissive.setHex(VR.invincible);
      shipGlow.material.emissiveIntensity = 4 + pulse * 4;
      shipLight.color.setHex(VR.invincible);
      shipLight.intensity = 4 + pulse * 3;
      if (invincibleTimer <= 0) {
        invincible = false;
        shipCockpit.material.emissive.setHex(VR.glassEmissive);
        shipCockpit.material.emissiveIntensity = 0.5;
        shipGlow.material.emissive.setHex(VR.coolAccent);
        shipGlow.material.emissiveIntensity = 4;
        shipLight.color.setHex(VR.coolAccent);
        shipLight.intensity = 3;
      }
    }

    rawSpeed = Math.min(MAX_RAW_SPEED, 0.32 + time * 0.006);
    gameSpeed = (rawSpeed - 0.32) / (MAX_RAW_SPEED - 0.32);
    score = Math.floor(time * 15 + gemsCollected * 8);

    level = Math.min(10, Math.floor(gameSpeed * 9) + 1);
    if (level !== prevLevel) { sfxLevelUp(); hud.level.textContent = `LV ${level}`; prevLevel = level; }

    /*
     * ── HUD writes are cached and dirty-checked ──
     *
     * This block used to run four querySelector calls per frame and then write
     * to all four elements unconditionally. Two of those writes are worse than
     * they look: `.vr-speedfill` carries `transition:width 0.3s`, so setting
     * width every frame restarted a CSS transition 60 times a second, and
     * `textContent` on the score forced a text layout every frame. That is
     * main-thread work competing with the rAF callback itself — it shows up as
     * stutter, not as a lower GPU frame rate, which is why it survived two
     * rounds of render-side optimisation.
     *
     * Values are quantised so a write only happens when the pixel result would
     * actually differ.
     */
    const speedPct = Math.round(gameSpeed * 100);
    if (speedPct !== hudCache.speedPct) { hud.speedFill.style.width = `${speedPct}%`; hudCache.speedPct = speedPct; }
    if (score !== hudCache.score) { hud.score.textContent = score; hudCache.score = score; }
    const lines = gameSpeed > 0.5 ? Math.round((gameSpeed - 0.5) * 80) / 100 : 0;
    if (lines !== hudCache.lines) { hud.speedLines.style.opacity = String(lines); hudCache.lines = lines; }

    // One light doing both jobs: sweeps across, and crossfades warm <-> cool.
    const sweep = Math.sin(time * 0.4);
    sweepLight.position.x = sweep * 5.5;
    const mix = 0.5 + 0.5 * Math.cos(time * 0.3);
    sweepLight.color.setRGB(
      sweepWarm.r + (sweepCool.r - sweepWarm.r) * mix,
      sweepWarm.g + (sweepCool.g - sweepWarm.g) * mix,
      sweepWarm.b + (sweepCool.b - sweepWarm.b) * mix,
    );
    sweepLight.intensity = 3.1 + Math.sin(time * 2) * 0.8;

    if (comboTimer > 0) {
      comboTimer -= rawDt;
      if (comboTimer <= 0) { combo = 0; hud.combo.style.opacity = '0'; }
    }

    const spawnRate = Math.max(28, 75 - level * 5);
    obsCooldown -= rawDt;
    if (obsCooldown <= 0) { spawnObstacle(); obsCooldown = spawnRate; }
    gemCooldown -= rawDt;
    if (gemCooldown <= 0) { spawnGem(); gemCooldown = 65 + Math.random() * 40; }

    let warningThisFrame = false;
    for (let i = activeObstacles.length - 1; i >= 0; i--) {
      const o = activeObstacles[i];
      o.group.position.z += (rawSpeed + 0.28) * rawDt;
      o.mesh.rotation.x += o.rotSpd.x * rawDt;
      o.mesh.rotation.y += o.rotSpd.y * rawDt;
      o.ring.rotation.z += 0.04 * rawDt;

      if (o.group.position.z > -30 && o.group.position.z < -8) {
        const a = 0.4 + Math.sin(time * 12) * 0.3;
        o.ring.material.emissiveIntensity = 2 + a * 3;
        if (Math.abs(o.group.position.x - shipCurrentX) < 1.5) warningThisFrame = true;
      } else {
        o.ring.material.emissiveIntensity = 1;
      }

      if (o.group.position.z > 14) { returnObstacleToPool(o); activeObstacles.splice(i, 1); continue; }

      if (!invincible && o.group.position.z > 4 && o.group.position.z < 9) {
        const dx = Math.abs(o.group.position.x - ship.position.x);
        const dy = Math.abs(o.group.position.y - ship.position.y);
        if (dx < 0.95 && dy < 0.95) {
          spawnExplosion(o.group.position.x, o.group.position.y, o.group.position.z);
          returnObstacleToPool(o);
          activeObstacles.splice(i, 1);
          lives--;
          updateLivesHud();
          sfxHit();
          flashScreen('vr-hitflash', 200);
          camShake = 20;
          combo = 0;
          hud.combo.style.opacity = '0';
          invincible = true;
          invincibleTimer = 100;
          if (lives <= 0) { endGame(); return; }
          continue;
        }
        if (dx < 1.8 && dy < 1.8 && !o.warned) {
          o.warned = true;
          sfxDodge();
          combo++;
          comboTimer = 120;
          if (combo >= 2) {
            hud.comboText.textContent = `COMBO x${combo}`;
            hud.combo.style.opacity = '1';
            score += combo * 5;
          }
        }
      }
    }
    // Same dirty-check: this one also drives a CSS transition (opacity 0.1s).
    const warn = warningThisFrame ? Math.round((0.4 + Math.sin(time * 15) * 0.3) * 20) / 20 : 0;
    if (warn !== hudCache.warn) { hud.warnFlash.style.opacity = String(warn); hudCache.warn = warn; }

    // ── PULSE CANNON: fire, fly, hit ──
    const msDt = rawDt * (1000 / 60);
    if (pulseTimer > 0) {
      pulseTimer = Math.max(0, pulseTimer - msDt);
      pulseCooldown -= msDt;
      if (pulseCooldown <= 0) {
        pulseCooldown = PULSE_INTERVAL;
        fireBolt(shipCurrentX);
        sfxPulse();
      }
      // Dirty-checked inside, so running it every frame costs a comparison and
      // gives the meter a real countdown instead of a bar that jumps to empty.
      setPulseHud(pulseTimer > 0 ? 'firing' : 'idle');
      if (pulseTimer === 0) pulseCharge = 0;
    }
    for (let i = activeBolts.length - 1; i >= 0; i--) {
      const b = activeBolts[i];
      const fromZ = b.position.z;
      b.position.z -= PULSE_SPEED * rawDt;
      // Obstacles spawn at z = -90, so a bolt is spent once it is past them.
      if (b.position.z < -96) { retireBolt(i); continue; }
      let hitSomething = false;
      for (let j = activeObstacles.length - 1; j >= 0; j--) {
        const o = activeObstacles[j];
        /* SWEPT along z, not a proximity test at the sampled position. A bolt
         * covers 1.15 units per frame and an obstacle closes at up to 1.13 the
         * other way, so at top speed they approach 2.3 units in one step — a
         * fixed +/-1.4 window lets them pass straight through each other on
         * alternate frames, and the shot silently misses. Testing the whole
         * segment the bolt swept cannot tunnel at any speed. */
        const oz = o.group.position.z;
        if (oz > fromZ + 1.1 || oz < b.position.z - 1.1) continue;
        if (Math.abs(o.group.position.x - b.position.x) > 1.25) continue;
        spawnExplosion(o.group.position.x, o.group.position.y, o.group.position.z);
        returnObstacleToPool(o);
        activeObstacles.splice(j, 1);
        score += 20;
        sfxPulseHit();
        hitSomething = true;
        break;
      }
      if (hitSomething) retireBolt(i);
    }

    for (let i = activeGems.length - 1; i >= 0; i--) {
      const g = activeGems[i];
      g.position.z += (rawSpeed + 0.15) * rawDt;
      g.rotation.y += 0.06 * rawDt;
      g.rotation.x += 0.04 * rawDt;
      if (g.position.z > 14) { returnGem(g); activeGems.splice(i, 1); continue; }
      if (g.position.z > 4 && g.position.z < 9) {
        const dx = Math.abs(g.position.x - ship.position.x);
        const dy = Math.abs(g.position.y - ship.position.y);
        if (dx < 1.1 && dy < 1.1) {
          sfxGem();
          spawnGemParticles(g.position.x, g.position.y, g.position.z);
          flashScreen('vr-gemflash', 120);
          gemsCollected++;
          // Gems now do two jobs: score, and charge the cannon.
          if (pulseTimer === 0 && pulseCharge < PULSE_NEED) {
            pulseCharge++;
            setPulseHud(pulseCharge >= PULSE_NEED ? 'ready' : 'idle');
            if (pulseCharge === PULSE_NEED) { sfxPulseArm(); showPopup('PULSE READY', VR.cssGold, 900); }
          }
          const gain = 25 * Math.max(1, Math.floor(combo / 2) + 1);
          score += gain;
          showPopup(`+${gain}`, VR.cssGold, 600);
          returnGem(g);
          activeGems.splice(i, 1);
        }
      }
    }

    updateParticles(rawDt);

    const camTargetX = shipCurrentX * 0.45;
    camera.position.x += (camTargetX - camera.position.x) * 0.08 * rawDt;
    camera.position.y += (2.8 - camera.position.y) * 0.04 * rawDt;
    if (camShake > 0) {
      camera.position.x += Math.sin(time * 60) * (camShake * 0.018);
      camera.position.y += Math.cos(time * 55) * (camShake * 0.012);
      camShake -= rawDt * 1.8;
      if (camShake < 0) camShake = 0;
    }
    camera.position.z = 9;
    camera.lookAt(shipCurrentX * 0.5, 0.8, 0);

    updateEngine(gameSpeed);
    renderer.render(scene, camera);
  }

  function clearGameObjects() {
    activeObstacles.forEach((o) => returnObstacleToPool(o));
    activeObstacles.length = 0;
    activeGems.forEach((g) => returnGem(g));
    activeGems.length = 0;
    clearBolts();
    // Pooled: hide and return, never remove from the scene (they are reused).
    particles.forEach((p) => { p.mesh.visible = false; particlePool[p.kind].push(p.mesh); });
    particles.length = 0;
  }

  let countdownTimeout = null;
  function startCountdown() {
    initAudio();
    sfxMenuClick();
    ['vr-menuscreen', 'vr-gameoverscreen', 'vr-pausescreen'].forEach((id) => { q(`#${id}`).style.display = 'none'; });
    q('#vr-countdownscreen').style.display = 'flex';
    q('#vr-hud').style.display = 'none';
    q('#vr-speedbar').style.display = 'none';
    q('#vr-power').style.display = 'none';
    q('#vr-pausebtn').style.display = 'none';
    q('#vr-thumbcontrols').style.display = 'none';

    clearGameObjects();
    score = 0; lives = 3; gemsCollected = 0; level = 1; prevLevel = 1;
    // The cannon does not carry over between runs.
    pulseCharge = 0; pulseTimer = 0; pulseCooldown = 0;
    hudCache.power = -1; hudCache.powerState = '';
    setPulseHud('idle');
    q('#vr-levelhud').textContent = 'LV 1';
    time = 0; totalFrames = 0; rawSpeed = 0.32; gameSpeed = 0;
    shipTargetX = 0; shipCurrentX = 0; shipTiltZ = 0;
    currentLaneIdx = 1; laneLock = false;
    invincible = false; ship.visible = true;
    combo = 0; comboTimer = 0; camShake = 0;
    obsCooldown = 80; gemCooldown = 100;
    updateLivesHud();
    hud.combo.style.opacity = '0';
    q('#vr-warningflash').style.opacity = '0';
    q('#vr-speedlines').style.opacity = '0';

    state = 'countdown';
    let count = 3;
    const el = q('#vr-countdownnum');
    function tick() {
      el.textContent = count > 0 ? String(count) : 'GO!';
      el.style.animation = 'none';
      void el.offsetHeight;
      el.style.animation = 'vrCountPulse 0.9s ease-out';
      if (count > 0) playTone(440, 'square', 0.1, 0.1); else playTone(880, 'square', 0.15, 0.15);
      count--;
      if (count >= 0) {
        countdownTimeout = setTimeout(tick, 950);
      } else {
        countdownTimeout = setTimeout(() => {
          q('#vr-countdownscreen').style.display = 'none';
          q('#vr-hud').style.display = 'flex';
          q('#vr-speedbar').style.display = 'flex';
          q('#vr-power').style.display = 'flex';
          q('#vr-pausebtn').style.display = 'flex';
          if (isTouch) {
            q('#vr-thumbcontrols').style.display = 'block';
            // Re-show the swipe hint each run; it fades again on the first swipe.
            swipeHintHidden = false;
            q('#vr-swipehint')?.classList.remove('vr-faded');
          }
          state = 'playing';
          startEngine();
          startMusic();
        }, 950);
      }
    }
    tick();
  }

  function endGame() {
    state = 'gameover';
    sfxDeath();
    stopEngine();
    stopMusic();
    spawnExplosion(ship.position.x, ship.position.y, ship.position.z);
    spawnExplosion(ship.position.x, ship.position.y, ship.position.z);
    ship.visible = false;
    camShake = 35;

    const isNewBest = score > bestScore;
    if (isNewBest) {
      bestScore = score;
      localStorage.setItem('vrBest', String(bestScore));
      q('#vr-besthud').textContent = bestScore;
      q('#vr-menubest').textContent = `\u{1F3C6} BEST: ${bestScore}`;
    }
    saveScore(playerName, score, level, gemsCollected);

    q('#vr-goscore').textContent = score;
    q('#vr-golevel').textContent = level;
    q('#vr-gogems').textContent = gemsCollected;
    q('#vr-gobest').textContent = bestScore;
    q('#vr-newbestbadge').style.display = isNewBest ? 'block' : 'none';

    popupTimers.gameover = setTimeout(() => {
      q('#vr-thumbcontrols').style.display = 'none';
      q('#vr-pausebtn').style.display = 'none';
      q('#vr-hud').style.display = 'none';
      q('#vr-speedbar').style.display = 'none';
      q('#vr-power').style.display = 'none';
      q('#vr-gameoverscreen').style.display = 'flex';
    }, 600);
  }

  function togglePause() {
    if (state === 'playing') {
      state = 'paused';
      sfxMenuClick();
      stopEngine();
      stopMusic();
      q('#vr-pausescreen').style.display = 'flex';
      q('#vr-pausebtn').textContent = '▶';
    } else if (state === 'paused') {
      state = 'playing';
      sfxMenuClick();
      initAudio();
      startEngine();
      startMusic();
      q('#vr-pausescreen').style.display = 'none';
      q('#vr-pausebtn').textContent = '⏸️';
    }
  }

  function goMenu() {
    state = 'menu';
    stopEngine();
    stopMusic();
    clearGameObjects();
    ship.visible = true;
    q('#vr-hud').style.display = 'none';
    q('#vr-speedbar').style.display = 'none';
    q('#vr-power').style.display = 'none';
    q('#vr-pausebtn').style.display = 'none';
    q('#vr-thumbcontrols').style.display = 'none';
    q('#vr-warningflash').style.opacity = '0';
    q('#vr-speedlines').style.opacity = '0';
    q('#vr-menubest').style.opacity = bestScore > 0 ? '1' : '0';
    q('#vr-menubest').textContent = `\u{1F3C6} BEST: ${bestScore}`;
    showScreen('vr-menuscreen');
  }

  // ── UI wiring ──
  const uiHandlers = [
    ['#vr-btnplay', 'click', startCountdown],
    ['#vr-btnscores', 'click', () => showScreen('vr-highscorescreen')],
    ['#vr-btnsettings', 'click', () => showScreen('vr-settingsscreen')],
    ['#vr-btnhow', 'click', () => showScreen('vr-howscreen')],
    ['#vr-btnexit', 'click', exitGame],
    ['#vr-btnclearscores', 'click', clearScores],
    ['#vr-btnhsback', 'click', () => showScreen('vr-menuscreen')],
    ['#vr-btnsetback', 'click', () => showScreen('vr-menuscreen')],
    ['#vr-btnhowback', 'click', () => showScreen('vr-menuscreen')],
    ['#vr-btnresume', 'click', togglePause],
    ['#vr-btnpausesettings', 'click', () => { showScreen('vr-settingsscreen'); state = 'menu'; }],
    ['#vr-btnpausemenu', 'click', goMenu],
    ['#vr-btnagain', 'click', startCountdown],
    ['#vr-btngoscores', 'click', () => showScreen('vr-highscorescreen')],
    ['#vr-btngomenu', 'click', goMenu],
    ['#vr-pausebtn', 'click', togglePause],
  ];
  uiHandlers.forEach(([sel, ev, fn]) => q(sel)?.addEventListener(ev, fn));
  q('#vr-nameinput')?.addEventListener('input', saveName);
  q('#vr-musicvol')?.addEventListener('input', (e) => updateMusicVolFromInput(e.target.value));
  q('#vr-sfxvol')?.addEventListener('input', (e) => updateSfxVolFromInput(e.target.value));
  q('#vr-musictoggle')?.addEventListener('click', toggleMusic);
  q('#vr-sfxtoggle')?.addEventListener('click', toggleSfx);

  lastTS = performance.now();
  rafId = requestAnimationFrame(loop);

  return {
    dispose() {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endSwipe);
      canvas.removeEventListener('pointercancel', endSwipe);
      uiHandlers.forEach(([sel, ev, fn]) => q(sel)?.removeEventListener(ev, fn));
      Object.values(popupTimers).forEach((t) => clearTimeout(t));
      Object.values(pulseTimers).forEach((t) => clearTimeout(t));
      clearTimeout(musicTimeout);
      clearTimeout(countdownTimeout);
      stopMusic();
      stopEngine();
      if (audioCtx) { try { audioCtx.close(); } catch { /* already closed */ } }
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      releaseGlContext(renderer);
    },
  };
}

export default function VoidRunnerGame({ onBack }) {
  const rootRef = useRef(null);
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let instance = null;
    let cancelled = false;

    root.innerHTML = HTML;

    loadThree()
      .then((THREE) => {
        if (cancelled || !root.isConnected) return;
        instance = createVoidRunner(root, THREE, { onBack: () => onBackRef.current?.() });
      })
      .catch(() => {
        if (cancelled) return;
        root.innerHTML = '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffe6b0;font-family:sans-serif">Requires an internet connection to load Void Runner.</div>';
      });

    return () => {
      cancelled = true;
      instance?.dispose();
      root.innerHTML = '';
    };
  }, []);

  // The <style> tag must NOT be a child of the ref'd div — the mount effect
  // does `root.innerHTML = HTML` to build the game DOM (matching the
  // Babylon rooms' overlayEl.innerHTML pattern), which would wipe out a
  // React-rendered child sitting inside the same element.
  return (
    <>
      <style>{CSS}</style>
      <div className="vr-root" ref={rootRef} />
    </>
  );
}
