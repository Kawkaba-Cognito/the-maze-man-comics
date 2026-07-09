import React, { useEffect, useRef } from 'react';

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
  --vr-pink:   #ff2d9b;
  --vr-cyan:   #00f5ff;
  --vr-purple: #b44fff;
  --vr-gold:   #ffcc00;
  --vr-dark-bg: #04000f;
  position: fixed; inset: 0; z-index: 60;
  background: var(--vr-dark-bg);
  overflow: hidden;
  font-family: 'Share Tech Mono', monospace;
  color: #fff;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.vr-root * { box-sizing: border-box; }
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap');

.vr-container { position:relative; width:100%; height:100%; }
.vr-root canvas { display:block; position:absolute; top:0; left:0; }

.vr-scanlines { position:absolute; inset:0; pointer-events:none; z-index:5;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px); }
.vr-vignette { position:absolute; inset:0; pointer-events:none; z-index:4;
  background: radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%); transition:opacity 0.3s; }
.vr-speedlines { position:absolute; inset:0; pointer-events:none; z-index:3; opacity:0; transition:opacity 0.3s;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0,245,255,0.04) 60%, rgba(255,45,155,0.08) 100%); }

.vr-hud { position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; align-items:flex-start;
  padding:calc(16px + env(safe-area-inset-top)) 20px 16px; pointer-events:none; z-index:10; }
.vr-hud-block { display:flex; flex-direction:column; align-items:center; gap:2px; }
.vr-hud-label { font-size:9px; letter-spacing:4px; color:rgba(0,245,255,0.5); text-transform:uppercase; }
.vr-hud-val { font-family:'Orbitron',sans-serif; font-size:22px; font-weight:700; color:#fff; text-shadow:0 0 12px var(--vr-cyan); }
.vr-liveshud { display:flex; gap:6px; align-items:center; padding-top:4px; }
.vr-heart { font-size:18px; transition:transform 0.2s, opacity 0.2s; }
.vr-heart.vr-dead { opacity:0.2; transform:scale(0.7); }

.vr-speedbar { position:absolute; top:calc(72px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:none; z-index:10; }
.vr-speedlabel { font-size:9px; letter-spacing:3px; color:rgba(0,245,255,0.4); }
.vr-speedtrack { width:120px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; }
.vr-speedfill { height:100%; width:0%; background:linear-gradient(90deg,var(--vr-cyan),var(--vr-pink));
  border-radius:2px; transition:width 0.3s; box-shadow:0 0 8px var(--vr-cyan); }

.vr-combodisplay { position:absolute; top:calc(110px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  pointer-events:none; z-index:10; text-align:center; opacity:0; transition:opacity 0.3s; }
.vr-combotext { font-family:'Orbitron',sans-serif; font-size:20px; font-weight:900; color:var(--vr-gold);
  text-shadow:0 0 20px var(--vr-gold); letter-spacing:3px; }

.vr-popup { position:absolute; left:50%; top:40%; transform:translateX(-50%); pointer-events:none; z-index:15; text-align:center;
  font-family:'Orbitron',sans-serif; font-size:26px; font-weight:900; letter-spacing:6px; opacity:0; text-shadow:0 0 30px currentColor; }

.vr-pausebtn { position:absolute; top:calc(16px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  z-index:20; pointer-events:all; background:rgba(0,0,0,0.5); border:1px solid rgba(0,245,255,0.3); border-radius:50%;
  width:38px; height:38px; color:rgba(0,245,255,0.7); font-size:14px; cursor:pointer; display:none;
  align-items:center; justify-content:center; transition:border-color 0.2s, color 0.2s; }
.vr-pausebtn:hover { border-color:var(--vr-cyan); color:var(--vr-cyan); }

.vr-thumbcontrols { position:absolute; bottom:0; left:0; right:0; display:none; z-index:20; pointer-events:none;
  padding-bottom:max(20px, env(safe-area-inset-bottom)); }
.vr-thumb-btn { position:absolute; bottom:24px; width:90px; height:90px; border-radius:50%;
  border:2px solid rgba(0,245,255,0.4); background:rgba(0,20,40,0.6); display:flex; align-items:center; justify-content:center;
  font-size:30px; pointer-events:none; backdrop-filter:blur(4px);
  box-shadow:0 0 20px rgba(0,245,255,0.2), inset 0 0 20px rgba(0,0,0,0.5); transition:background 0.1s, border-color 0.1s, transform 0.1s; }
.vr-thumb-btn.vr-pressed { background:rgba(0,245,255,0.2); border-color:var(--vr-cyan); transform:scale(0.92);
  box-shadow:0 0 30px rgba(0,245,255,0.5); }
#vr-btnleft { left:24px; } #vr-btnright { right:24px; }

.vr-warningflash { position:absolute; inset:0; pointer-events:none; z-index:6; opacity:0; background:rgba(255,45,0,0.15); transition:opacity 0.1s; }
.vr-hitflash { position:absolute; inset:0; pointer-events:none; z-index:7; opacity:0; background:rgba(255,0,0,0.4); transition:opacity 0.05s; }
.vr-gemflash { position:absolute; inset:0; pointer-events:none; z-index:6; opacity:0; background:rgba(255,204,0,0.12); transition:opacity 0.1s; }

.vr-screen { position:absolute; inset:0; z-index:30; display:flex; flex-direction:column; align-items:center; justify-content:center; }

#vr-menuscreen { background: radial-gradient(ellipse at 50% 30%, rgba(180,79,255,0.15) 0%, rgba(0,0,10,0.92) 70%);
  padding-top: env(safe-area-inset-top); }
.vr-game-logo { font-family:'Orbitron',sans-serif; font-size:clamp(42px,10vw,72px); font-weight:900; letter-spacing:8px; line-height:1;
  background:linear-gradient(135deg,var(--vr-cyan) 0%,var(--vr-pink) 50%,var(--vr-purple) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 20px rgba(0,245,255,0.5)); animation:vrLogoPulse 3s ease-in-out infinite; margin-bottom:4px; text-align: center; }
.vr-tagline { font-size:12px; letter-spacing:6px; color:rgba(0,245,255,0.5); margin-bottom:40px; text-transform:uppercase; }
@keyframes vrLogoPulse { 0%,100%{ filter:drop-shadow(0 0 15px rgba(0,245,255,0.4)); } 50%{ filter:drop-shadow(0 0 35px rgba(255,45,155,0.6)); } }

.vr-best-badge { font-size:11px; letter-spacing:3px; color:var(--vr-gold); margin-bottom:32px; text-shadow:0 0 10px var(--vr-gold); opacity:0; transition:opacity 0.5s; }
.vr-controls-hint { margin-bottom:32px; text-align:center; display:flex; flex-direction:column; gap:8px; }
.vr-hint-row { font-size:11px; letter-spacing:2px; color:rgba(255,255,255,0.35); }
.vr-hint-row span { color:rgba(0,245,255,0.6); }

.vr-neon-btn { font-family:'Orbitron',sans-serif; font-size:15px; font-weight:700; letter-spacing:5px; padding:16px 48px;
  border-radius:4px; border:none; cursor:pointer; position:relative; overflow:hidden; transition:transform 0.1s, box-shadow 0.2s; text-transform:uppercase; }
.vr-neon-btn-primary { background:linear-gradient(135deg, #1a006b, #3d00c8); color:#fff;
  box-shadow:0 0 30px rgba(61,0,200,0.6), inset 0 0 30px rgba(0,245,255,0.1); border:1px solid rgba(0,245,255,0.4); }
.vr-neon-btn-primary:hover { transform:scale(1.04); box-shadow:0 0 50px rgba(0,245,255,0.5), inset 0 0 30px rgba(0,245,255,0.2); }
.vr-neon-btn-secondary { background:transparent; color:rgba(0,245,255,0.6); border:1px solid rgba(0,245,255,0.3); font-size:12px; padding:10px 32px; letter-spacing:4px; }
.vr-neon-btn-secondary:hover { border-color:var(--vr-cyan); color:var(--vr-cyan); box-shadow:0 0 20px rgba(0,245,255,0.3); }

#vr-pausescreen { background:rgba(0,0,10,0.88); backdrop-filter:blur(6px); }
#vr-pausescreen h2 { font-family:'Orbitron',sans-serif; font-size:36px; letter-spacing:10px; color:var(--vr-cyan);
  text-shadow:0 0 30px var(--vr-cyan); margin-bottom:40px; }
.vr-pause-btns { display:flex; flex-direction:column; gap:16px; align-items:center; }

#vr-gameoverscreen { background: radial-gradient(ellipse at 50% 40%, rgba(255,45,0,0.12) 0%, rgba(0,0,10,0.92) 70%); }
.vr-go-title { font-family:'Orbitron',sans-serif; font-size:clamp(28px,8vw,52px); font-weight:900; letter-spacing:6px; color:#fff;
  text-shadow:0 0 30px var(--vr-pink); margin-bottom:8px; margin-top:0; }
.vr-go-sub { font-size:11px; letter-spacing:4px; color:rgba(255,45,155,0.5); margin-bottom:32px; }
.vr-stats-row { display:flex; gap:12px; margin-bottom:32px; flex-wrap:wrap; justify-content:center; }
.vr-stat-card { display:flex; flex-direction:column; align-items:center; gap:6px; background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:16px 20px; min-width:90px; }
.vr-stat-card .vr-sv { font-family:'Orbitron',sans-serif; font-size:26px; font-weight:700; color:var(--vr-cyan); text-shadow:0 0 10px var(--vr-cyan); }
.vr-stat-card .vr-sl { font-size:9px; letter-spacing:3px; color:rgba(255,255,255,0.35); }
.vr-new-best-badge { font-family:'Orbitron',sans-serif; font-size:13px; letter-spacing:4px; color:var(--vr-gold);
  text-shadow:0 0 15px var(--vr-gold); margin-bottom:24px; opacity:0; animation:vrBadgePop 0.4s 0.3s forwards; }
@keyframes vrBadgePop { from{ opacity:0; transform:scale(0.7); } to{ opacity:1; transform:scale(1); } }
.vr-go-btns { display:flex; flex-direction:column; gap:12px; align-items:center; }

#vr-countdownscreen { background:rgba(0,0,10,0.6); }
.vr-countdownnum { font-family:'Orbitron',sans-serif; font-size:clamp(80px,25vw,140px); font-weight:900; color:var(--vr-cyan);
  text-shadow:0 0 60px var(--vr-cyan); animation:vrCountPulse 1s ease-out; }
@keyframes vrCountPulse { 0%{ transform:scale(1.5); opacity:0; } 100%{ transform:scale(1); opacity:1; } }

.vr-levelbanner { position:absolute; left:0; right:0; top:35%; pointer-events:none; z-index:15; text-align:center; opacity:0; }
.vr-levelbannertext { font-family:'Orbitron',sans-serif; font-size:28px; font-weight:900; letter-spacing:8px; color:var(--vr-purple); text-shadow:0 0 30px var(--vr-purple); }

.vr-nearmiss { position:absolute; left:50%; top:30%; transform:translateX(-50%); pointer-events:none; z-index:15;
  font-family:'Orbitron',sans-serif; font-size:18px; font-weight:700; letter-spacing:5px; color:var(--vr-gold);
  text-shadow:0 0 20px var(--vr-gold); opacity:0; white-space:nowrap; }

.vr-sub-screen { position:absolute; inset:0; z-index:30; display:none; flex-direction:column; align-items:center; justify-content:flex-start;
  padding:calc(40px + env(safe-area-inset-top)) 24px 40px;
  background: radial-gradient(ellipse at 50% 20%, rgba(0,80,120,0.18) 0%, rgba(0,0,10,0.95) 70%); overflow-y:auto; }
.vr-sub-title { font-family:'Orbitron',sans-serif; font-size:24px; font-weight:900; letter-spacing:8px; color:var(--vr-cyan);
  text-shadow:0 0 20px var(--vr-cyan); margin-bottom:32px; margin-top:8px; }
.vr-setting-row { width:100%; max-width:360px; display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid rgba(0,245,255,0.1); padding:14px 0; gap:16px; }
.vr-setting-label { font-size:12px; letter-spacing:3px; color:rgba(255,255,255,0.6); }
.vr-setting-val { font-family:'Orbitron',sans-serif; font-size:14px; color:var(--vr-cyan); }
.vr-root input[type=range] { -webkit-appearance:none; width:130px; height:4px; background:rgba(0,245,255,0.2); border-radius:2px; outline:none; }
.vr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%;
  background:var(--vr-cyan); box-shadow:0 0 8px var(--vr-cyan); cursor:pointer; }
.vr-root input[type=text] { background:rgba(0,245,255,0.07); border:1px solid rgba(0,245,255,0.3); border-radius:4px;
  color:var(--vr-cyan); padding:8px 12px; font-family:'Share Tech Mono',monospace; font-size:14px; width:160px; outline:none; letter-spacing:2px; }
.vr-root input[type=text]:focus { border-color:var(--vr-cyan); }

.vr-toggle-btn { font-family:'Orbitron',sans-serif; font-size:11px; letter-spacing:3px; padding:8px 18px; border-radius:4px; cursor:pointer;
  border:1px solid rgba(0,245,255,0.4); background:rgba(0,245,255,0.1); color:var(--vr-cyan); transition:background 0.2s; }
.vr-toggle-btn.vr-on { background:rgba(0,245,255,0.25); color:#fff; }
.vr-toggle-btn.vr-off { background:transparent; color:rgba(0,245,255,0.4); }

.vr-hs-table { width:100%; max-width:380px; margin-bottom:24px; }
.vr-hs-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.07); }
.vr-hs-rank { font-family:'Orbitron',sans-serif; font-size:18px; font-weight:900; width:36px; text-align:center; }
.vr-hs-rank.vr-gold-rank { color:#ffd700; text-shadow:0 0 10px #ffd700; }
.vr-hs-rank.vr-silver { color:#c0c0c0; text-shadow:0 0 8px #c0c0c0; }
.vr-hs-rank.vr-bronze { color:#cd7f32; text-shadow:0 0 8px #cd7f32; }
.vr-hs-rank.vr-other { color:rgba(255,255,255,0.3); }
.vr-hs-name { flex:1; font-size:13px; letter-spacing:2px; color:rgba(255,255,255,0.7); }
.vr-hs-score { font-family:'Orbitron',sans-serif; font-size:16px; color:var(--vr-cyan); text-shadow:0 0 8px var(--vr-cyan); }
.vr-hs-empty { text-align:center; color:rgba(255,255,255,0.2); font-size:12px; letter-spacing:3px; padding:32px 0; }

.vr-how-row { width:100%; max-width:360px; display:flex; gap:16px; align-items:flex-start; padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
.vr-how-icon { font-size:24px; min-width:36px; text-align:center; }
.vr-how-text { font-size:12px; line-height:1.7; color:rgba(255,255,255,0.55); letter-spacing:1px; }
.vr-how-key { display:inline-block; background:rgba(0,245,255,0.15); border:1px solid rgba(0,245,255,0.3); border-radius:3px;
  padding:1px 7px; color:var(--vr-cyan); font-size:11px; letter-spacing:2px; }
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
    <span class="vr-speedlabel">SPEED</span>
    <div class="vr-speedtrack"><div class="vr-speedfill" id="vr-speedfill"></div></div>
  </div>

  <div class="vr-combodisplay" id="vr-combodisplay"><span class="vr-combotext" id="vr-combotext">COMBO x2</span></div>
  <div class="vr-popup" id="vr-popup"></div>
  <div class="vr-nearmiss" id="vr-nearmiss">NEAR MISS!</div>
  <div class="vr-levelbanner" id="vr-levelbanner"><span class="vr-levelbannertext" id="vr-levelbannertext">LEVEL 2</span></div>

  <button class="vr-pausebtn" id="vr-pausebtn" type="button">&#10074;&#10074;</button>

  <div class="vr-thumbcontrols" id="vr-thumbcontrols">
    <button class="vr-thumb-btn" id="vr-btnleft" type="button" tabindex="-1">&#9664;</button>
    <button class="vr-thumb-btn" id="vr-btnright" type="button" tabindex="-1">&#9654;</button>
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
      <div class="vr-how-text">Move left and right using <span class="vr-how-key">&#9664; &#9654;</span> arrow keys, <span class="vr-how-key">A</span> <span class="vr-how-key">D</span> keys, or tap the left/right half of the screen on phone.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128142;</div>
      <div class="vr-how-text">Collect <b style="color:#ffcc00">golden gems</b> to boost your score. Near misses build your COMBO multiplier for bonus points.</div></div>
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

  // ── THREE.JS SETUP ──
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isTouch });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isTouch ? 1.5 : 2));
  renderer.shadowMap.enabled = !isTouch;
  if (!isTouch) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x04000f);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080010, 0.028);

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

  // ── LIGHTING ──
  const ambient = new THREE.AmbientLight(0x0a0020, 2);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0x9933ff, 2.5);
  dirLight.position.set(5, 12, 8);
  dirLight.castShadow = !isTouch;
  scene.add(dirLight);
  const pinkLight = new THREE.PointLight(0xff2d9b, 4, 25);
  pinkLight.position.set(-6, 3, 2);
  scene.add(pinkLight);
  const cyanLight = new THREE.PointLight(0x00f5ff, 4, 25);
  cyanLight.position.set(6, 3, 2);
  scene.add(cyanLight);
  const shipLight = new THREE.PointLight(0x00f5ff, 3, 10);
  scene.add(shipLight);

  // ── STAR FIELD ──
  const starGeo = new THREE.BufferGeometry();
  const SC = 3000;
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
  const TUNNEL_H = 6.5; const SEG_DEPTH = 5; const NUM_SEGS = 30;
  const tunnelSegs = [];
  function buildTunnelSeg(z) {
    const g = new THREE.Group();
    const floorG = new THREE.PlaneGeometry(TUNNEL_W, SEG_DEPTH, 8, 1);
    const floorM = new THREE.MeshStandardMaterial({ color: 0x050018, roughness: 1, metalness: 0, emissive: 0x050018 });
    const floor = new THREE.Mesh(floorG, floorM);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.1;
    floor.receiveShadow = !isTouch;
    g.add(floor);
    const lineMat = new THREE.MeshStandardMaterial({ color: 0x4400cc, emissive: 0x4400cc, emissiveIntensity: 2 });
    for (let i = -4; i <= 4; i++) {
      const lG = new THREE.BoxGeometry(0.04, 0.02, SEG_DEPTH);
      const l = new THREE.Mesh(lG, lineMat);
      l.position.set(i, -1.09, 0);
      g.add(l);
    }
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xff2d9b, emissive: 0xff2d9b, emissiveIntensity: 1.5 });
    const leftStrip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, SEG_DEPTH), wallMat);
    leftStrip.position.set(-TUNNEL_W / 2, -1.05, 0);
    g.add(leftStrip);
    const rightStrip = leftStrip.clone();
    rightStrip.position.set(TUNNEL_W / 2, -1.05, 0);
    rightStrip.material = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 1.5 });
    g.add(rightStrip);
    const archMat = new THREE.MeshStandardMaterial({ color: 0x220066, emissive: 0x220066, emissiveIntensity: 1 });
    const archGeo = new THREE.BoxGeometry(0.1, TUNNEL_H, 0.1);
    const leftArch = new THREE.Mesh(archGeo, archMat);
    leftArch.position.set(-TUNNEL_W / 2, TUNNEL_H / 2 - 1.1, -SEG_DEPTH / 2);
    g.add(leftArch);
    const rightArch = leftArch.clone();
    rightArch.position.set(TUNNEL_W / 2, TUNNEL_H / 2 - 1.1, -SEG_DEPTH / 2);
    g.add(rightArch);
    const topArch = new THREE.Mesh(new THREE.BoxGeometry(TUNNEL_W, 0.1, 0.1), archMat);
    topArch.position.set(0, TUNNEL_H - 1.1, -SEG_DEPTH / 2);
    g.add(topArch);
    g.position.z = z;
    scene.add(g);
    tunnelSegs.push(g);
    return g;
  }
  for (let i = 0; i < NUM_SEGS; i++) buildTunnelSeg(-i * SEG_DEPTH);

  // ── SHIP ──
  function buildShip() {
    const g = new THREE.Group();
    const bodyM = new THREE.MeshStandardMaterial({ color: 0xd0eeff, emissive: 0x224466, roughness: 0.2, metalness: 0.9 });
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.8, 8), bodyM);
    body.rotation.x = Math.PI / 2;
    body.castShadow = !isTouch;
    g.add(body);
    const wingM = new THREE.MeshStandardMaterial({ color: 0x3366aa, emissive: 0x112244, roughness: 0.3, metalness: 0.9 });
    const wings = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.7), wingM);
    wings.position.z = 0.35;
    wings.castShadow = !isTouch;
    g.add(wings);
    const tipM = new THREE.MeshStandardMaterial({ color: 0xff2d9b, emissive: 0xff2d9b, emissiveIntensity: 3 });
    [-1.1, 1.1].forEach((x) => {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), tipM);
      tip.position.set(x, 0, 0.35);
      g.add(tip);
    });
    const cockM = new THREE.MeshStandardMaterial({ color: 0x88ddff, emissive: 0x003355, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.75 });
    const cock = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), cockM);
    cock.scale.z = 1.6;
    cock.position.z = -0.45;
    g.add(cock);
    const glowM = new THREE.MeshStandardMaterial({ color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 4, transparent: true, opacity: 0.85 });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), glowM);
    glow.position.z = 1.0;
    g.add(glow);
    const trailM = new THREE.MeshStandardMaterial({ color: 0x0088ff, emissive: 0x0044ff, emissiveIntensity: 3, transparent: true, opacity: 0.5 });
    const trail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.0, 8), trailM);
    trail.rotation.x = -Math.PI / 2;
    trail.position.z = 1.55;
    g.add(trail);
    return g;
  }
  const SHIP_BASE_Y = 0.3;
  const ship = buildShip();
  ship.position.set(0, SHIP_BASE_Y, 6);
  ship.frustumCulled = false;
  ship.traverse((child) => { child.frustumCulled = false; });
  scene.add(ship);

  // ── OBSTACLE POOL ──
  const POOL_SIZE = 20;
  const obstaclePool = [];
  const activeObstacles = [];
  const obsMats = [
    new THREE.MeshStandardMaterial({ color: 0xff2d2d, emissive: 0x660000, roughness: 0.3, metalness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x552200, roughness: 0.3, metalness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0xcc00ff, emissive: 0x440066, roughness: 0.3, metalness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0xff0066, emissive: 0x550022, roughness: 0.3, metalness: 0.7 }),
    new THREE.MeshStandardMaterial({ color: 0xff4400, emissive: 0x661100, roughness: 0.3, metalness: 0.7 }),
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
    mesh.castShadow = !isTouch;
    const ringM = new THREE.MeshStandardMaterial({ color: obsMats[matIdx].color, emissive: obsMats[matIdx].color, emissiveIntensity: 3, transparent: true, opacity: 0.8 });
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
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xff8800, emissiveIntensity: 2.5, roughness: 0.1, metalness: 0.8 });
  function getGem() {
    if (gemPool.length > 0) { const g = gemPool.pop(); g.visible = true; scene.add(g); return g; }
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.38), gemMat);
    m.castShadow = !isTouch;
    scene.add(m);
    return m;
  }
  function returnGem(g) { g.visible = false; scene.remove(g); gemPool.push(g); }

  // ── PARTICLES ──
  const particles = [];
  function spawnExplosion(x, y, z, col = 0xff4400) {
    for (let i = 0; i < 18; i++) {
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(0.08 + Math.random() * 0.14, 4, 4),
        new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 3, transparent: true, opacity: 1 }),
      );
      m.position.set(x, y, z);
      scene.add(m);
      const a = Math.random() * Math.PI * 2; const b = Math.random() * Math.PI;
      const spd = Math.random() * 0.35 + 0.1;
      particles.push({ mesh: m, vx: Math.sin(b) * Math.cos(a) * spd, vy: Math.sin(b) * Math.sin(a) * spd, vz: Math.cos(b) * spd, life: 1, decay: 0.025 + Math.random() * 0.02 });
    }
  }
  function spawnGemParticles(x, y, z) {
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.06),
        new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffaa00, emissiveIntensity: 4, transparent: true, opacity: 1 }),
      );
      m.position.set(x, y, z);
      scene.add(m);
      const a = Math.random() * Math.PI * 2;
      particles.push({ mesh: m, vx: Math.cos(a) * 0.18, vy: 0.15 + Math.random() * 0.1, vz: Math.sin(a) * 0.18, life: 1, decay: 0.04 });
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
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
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
  function showNearMiss() {
    const el = q('#vr-nearmiss');
    el.style.opacity = '1';
    clearTimeout(popupTimers.nearmiss);
    popupTimers.nearmiss = setTimeout(() => { el.style.opacity = '0'; }, 800);
  }
  function flashScreen(id, dur = 150) {
    const el = q(`#${id}`);
    el.style.opacity = '1';
    const key = `flash-${id}`;
    clearTimeout(popupTimers[key]);
    popupTimers[key] = setTimeout(() => { el.style.opacity = '0'; }, dur);
  }
  function showLevelBanner(lvl) {
    const banner = q('#vr-levelbanner');
    q('#vr-levelbannertext').textContent = `LEVEL ${lvl} — FASTER!`;
    banner.style.opacity = '1';
    banner.style.transition = 'opacity 0.2s';
    clearTimeout(popupTimers.levelbanner);
    popupTimers.levelbanner = setTimeout(() => { banner.style.transition = 'opacity 1s'; banner.style.opacity = '0'; }, 1800);
  }

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
    if ((e.key === ' ' || e.key === 'Enter') && (state === 'gameover' || state === 'menu')) startCountdown();
  }
  function onKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // ── INPUT: phone — tap the left/right HALF of the screen to steer.
  // Attached to the canvas specifically (not document), so taps on the
  // pause button / HUD / menu buttons — separate sibling elements layered
  // on top — never reach this handler; there's exactly one input path, so
  // it can never double-fire the way swipe-vs-button used to. ──
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
  function handleTapSteer(clientX) {
    if (state !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const half = rect.left + rect.width / 2;
    moveLane(clientX < half ? 'left' : 'right');
  }
  function onCanvasTouchStart(e) {
    initAudio();
    if (!e.touches || !e.touches.length) return;
    handleTapSteer(e.touches[0].clientX);
  }
  function onCanvasMouseDown(e) { initAudio(); handleTapSteer(e.clientX); }
  canvas.addEventListener('touchstart', onCanvasTouchStart, { passive: true });
  canvas.addEventListener('mousedown', onCanvasMouseDown);

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
      tunnelSegs.forEach((seg) => {
        seg.position.z += rawSpeed * rawDt;
        if (seg.position.z > 12) seg.position.z -= NUM_SEGS * SEG_DEPTH;
      });
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
    ship.children[5].material.emissiveIntensity = 3.5 + Math.sin(time * 25) * 1.0;

    shipLight.position.copy(ship.position);
    shipLight.position.z += 1;

    if (invincible) {
      invincibleTimer -= rawDt;
      const pulse = 0.5 + 0.5 * Math.sin(invincibleTimer * 0.4);
      // children[4] is the cockpit (0:body 1:wings 2-3:wing tips 4:cockpit
      // 5:engine glow 6:trail) — the original build pulsed children[3] (a
      // wing tip) here by mistake; fixed so the cockpit actually flashes.
      ship.children[4].material.emissive.setHex(0x00ffff);
      ship.children[4].material.emissiveIntensity = 2 + pulse * 3;
      ship.children[5].material.emissive.setHex(0x00ffff);
      ship.children[5].material.emissiveIntensity = 4 + pulse * 4;
      shipLight.color.setHex(0x00ffff);
      shipLight.intensity = 4 + pulse * 3;
      if (invincibleTimer <= 0) {
        invincible = false;
        ship.children[4].material.emissive.setHex(0x003355);
        ship.children[4].material.emissiveIntensity = 1;
        ship.children[5].material.emissive.setHex(0x00f5ff);
        ship.children[5].material.emissiveIntensity = 4;
        shipLight.color.setHex(0x00f5ff);
        shipLight.intensity = 3;
      }
    }

    rawSpeed = Math.min(MAX_RAW_SPEED, 0.32 + time * 0.006);
    gameSpeed = (rawSpeed - 0.32) / (MAX_RAW_SPEED - 0.32);
    score = Math.floor(time * 15 + gemsCollected * 8);

    level = Math.min(10, Math.floor(gameSpeed * 9) + 1);
    if (level !== prevLevel) { sfxLevelUp(); showLevelBanner(level); prevLevel = level; }

    q('#vr-speedfill').style.width = `${gameSpeed * 100}%`;
    q('#vr-scorehud').textContent = score;
    q('#vr-speedlines').style.opacity = gameSpeed > 0.5 ? String((gameSpeed - 0.5) * 0.8) : '0';

    pinkLight.position.x = Math.sin(time * 0.4) * 5;
    cyanLight.position.x = Math.cos(time * 0.3) * 5;
    pinkLight.intensity = 3 + Math.sin(time * 2) * 0.8;
    cyanLight.intensity = 3 + Math.cos(time * 2.3) * 0.8;

    if (comboTimer > 0) {
      comboTimer -= rawDt;
      if (comboTimer <= 0) { combo = 0; q('#vr-combodisplay').style.opacity = '0'; }
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
          q('#vr-combodisplay').style.opacity = '0';
          invincible = true;
          invincibleTimer = 100;
          if (lives <= 0) { endGame(); return; }
          continue;
        }
        if (dx < 1.8 && dy < 1.8 && !o.warned) {
          o.warned = true;
          sfxDodge();
          showNearMiss();
          combo++;
          comboTimer = 120;
          if (combo >= 2) {
            q('#vr-combotext').textContent = `COMBO x${combo}`;
            q('#vr-combodisplay').style.opacity = '1';
            score += combo * 5;
          }
        }
      }
    }
    q('#vr-warningflash').style.opacity = warningThisFrame ? String(0.4 + Math.sin(time * 15) * 0.3) : '0';

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
          const gain = 25 * Math.max(1, Math.floor(combo / 2) + 1);
          score += gain;
          showPopup(`+${gain}`, '#ffcc00', 600);
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
    particles.forEach((p) => { scene.remove(p.mesh); });
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
    q('#vr-pausebtn').style.display = 'none';
    q('#vr-thumbcontrols').style.display = 'none';

    clearGameObjects();
    score = 0; lives = 3; gemsCollected = 0; level = 1; prevLevel = 1;
    time = 0; totalFrames = 0; rawSpeed = 0.32; gameSpeed = 0;
    shipTargetX = 0; shipCurrentX = 0; shipTiltZ = 0;
    currentLaneIdx = 1; laneLock = false;
    invincible = false; ship.visible = true;
    combo = 0; comboTimer = 0; camShake = 0;
    obsCooldown = 80; gemCooldown = 100;
    updateLivesHud();
    q('#vr-combodisplay').style.opacity = '0';
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
          q('#vr-pausebtn').style.display = 'flex';
          if (isTouch) q('#vr-thumbcontrols').style.display = 'block';
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
    spawnExplosion(ship.position.x, ship.position.y, ship.position.z, 0xff4400);
    spawnExplosion(ship.position.x, ship.position.y, ship.position.z, 0xff2d9b);
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
      canvas.removeEventListener('touchstart', onCanvasTouchStart);
      canvas.removeEventListener('mousedown', onCanvasMouseDown);
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
