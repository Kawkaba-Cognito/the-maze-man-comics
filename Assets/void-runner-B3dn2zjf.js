import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{r}from"./c3dViewport-D3K1ZAxX.js";var i=e(t()),a=n(),o=`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`,s=`sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==`;function c(){return window.THREE?Promise.resolve(window.THREE):new Promise((e,t)=>{let n=document.getElementById(`vr-three-cdn`);if(n){n.addEventListener(`load`,()=>e(window.THREE)),n.addEventListener(`error`,()=>t(Error(`three-cdn-failed`)));return}let r=document.createElement(`script`);r.id=`vr-three-cdn`,r.src=o,r.integrity=s,r.crossOrigin=`anonymous`,r.onload=()=>e(window.THREE),r.onerror=()=>{r.remove(),t(Error(`three-cdn-failed`))},document.head.appendChild(r)})}var l=`
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
`,u=`
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
`;function ee(e,t,{onBack:n}){let i=typeof navigator<`u`&&(navigator.maxTouchPoints>0||`ontouchstart`in window),a=t=>e.querySelector(t),o=a(`#vr-canvas`),s=window.AudioContext||window.webkitAudioContext,c=null;function l(){c||=new s,c.state===`suspended`&&c.resume()}function u(e,t,n,r,i=0){if(!c)return;let a=c.createOscillator(),o=c.createGain();a.connect(o),o.connect(c.destination),a.type=t,a.frequency.setValueAtTime(e,c.currentTime+i),o.gain.setValueAtTime(r,c.currentTime+i),o.gain.exponentialRampToValueAtTime(.001,c.currentTime+i+n),a.start(c.currentTime+i),a.stop(c.currentTime+i+n+.05)}function ee(){if(!c)return;let e=c.createOscillator(),t=c.createGain();e.connect(t),t.connect(c.destination),e.type=`sawtooth`,e.frequency.setValueAtTime(800,c.currentTime),e.frequency.exponentialRampToValueAtTime(200,c.currentTime+.15),t.gain.setValueAtTime(.12,c.currentTime),t.gain.exponentialRampToValueAtTime(.001,c.currentTime+.15),e.start(),e.stop(c.currentTime+.2)}function te(){[523,659,784,1047].forEach((e,t)=>u(e,`sine`,.12,.08,t*.05))}function ne(){c&&[60,80,100,120].forEach(e=>{let t=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),n=t.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=(Math.random()*2-1)*(1-e/n.length);let r=c.createBufferSource(),i=c.createGain(),a=c.createBiquadFilter();r.buffer=t,a.type=`lowpass`,a.frequency.value=e*30,r.connect(a),a.connect(i),i.connect(c.destination),i.gain.setValueAtTime(.3,c.currentTime),i.gain.exponentialRampToValueAtTime(.001,c.currentTime+.6),r.start()})}function re(){[400,500,600,800,1e3].forEach((e,t)=>u(e,`square`,.1,.06,t*.08))}function ie(){u(120,`sawtooth`,.3,.15),u(80,`square`,.4,.1,.05)}function d(){q&&c&&u(440,`sine`,.08,.06*J)}function ae(){q&&u(880,`square`,.05,.035*J)}function oe(){q&&(u(220,`sawtooth`,.1,.07*J),u(140,`square`,.12,.05*J,.02))}function se(){q&&[660,880,1320].forEach((e,t)=>u(e,`triangle`,.12,.07*J,t*.06))}let f=!1,ce=null,p=null,le=[[220,261.63,329.63],[174.61,220,261.63],[130.81,164.81,196],[196,246.94,293.66]],ue=[[440,523,659,523,440,392,440,523],[349,440,523,440,349,330,349,440],[262,330,392,330,262,247,262,330],[392,494,587,494,392,370,392,494]],m=60/128,h=m*4;function de(e,t){let n=e.createOscillator(),r=e.createGain();n.connect(r),r.connect(p),n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(40,t+.08),r.gain.setValueAtTime(.55,t),r.gain.exponentialRampToValueAtTime(.001,t+.18),n.start(t),n.stop(t+.2)}function fe(e,t){let n=e.createBuffer(1,e.sampleRate*.12,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<r.length;e++)r[e]=Math.random()*2-1;let i=e.createBufferSource(),a=e.createBiquadFilter(),o=e.createGain();i.buffer=n,a.type=`bandpass`,a.frequency.value=2400,a.Q.value=.8,i.connect(a),a.connect(o),o.connect(p),o.gain.setValueAtTime(.22,t),o.gain.exponentialRampToValueAtTime(.001,t+.14),i.start(t)}function pe(e,t,n=!1){let r=e.createBuffer(1,e.sampleRate*(n?.18:.04),e.sampleRate),i=r.getChannelData(0);for(let e=0;e<i.length;e++)i[e]=Math.random()*2-1;let a=e.createBufferSource(),o=e.createBiquadFilter(),s=e.createGain();a.buffer=r,o.type=`highpass`,o.frequency.value=9e3,a.connect(o),o.connect(s),s.connect(p),s.gain.setValueAtTime(n?.1:.07,t),s.gain.exponentialRampToValueAtTime(.001,t+(n?.18:.04)),a.start(t)}function me(e,t,n,r){let i=e.createOscillator(),a=e.createGain(),o=e.createBiquadFilter();i.type=`sawtooth`,i.frequency.value=t/2,o.type=`lowpass`,o.frequency.value=600,o.Q.value=3,i.connect(o),o.connect(a),a.connect(p),a.gain.setValueAtTime(.18,n),a.gain.setValueAtTime(.14,n+r*.7),a.gain.exponentialRampToValueAtTime(.001,n+r),i.start(n),i.stop(n+r+.05)}function he(e,t,n,r){let i=e.createOscillator(),a=e.createGain();i.type=`square`,i.frequency.value=t,i.connect(a),a.connect(p),a.gain.setValueAtTime(.06,n),a.gain.exponentialRampToValueAtTime(.001,n+r*.9),i.start(n),i.stop(n+r)}function ge(e,t,n,r){t.forEach(t=>{let i=e.createOscillator(),a=e.createGain();i.type=`sine`,i.frequency.value=t,i.connect(a),a.connect(p),a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.04,n+.3),a.gain.setValueAtTime(.04,n+r-.3),a.gain.linearRampToValueAtTime(0,n+r),i.start(n),i.stop(n+r+.1)})}function _e(e,t,n){if(!f)return;let r=le[n%le.length],i=ue[n%ue.length];ge(e,r,t,h),me(e,r[0],t,h/2),me(e,r[0],t+h/2,h/2);for(let n=0;n<4;n++){let r=t+n*m;(n===0||n===2)&&de(e,r),(n===1||n===3)&&fe(e,r),pe(e,r,!1),pe(e,r+m/2,n===1)}i.forEach((n,r)=>{he(e,n,t+r*m/2,m/2*.85)}),ce=setTimeout(()=>{_e(e,t+h,n+1)},(h-.1)*1e3)}let g=null;function ve(){if(!c||g)return;let e=c.createOscillator(),t=c.createGain();e.type=`sawtooth`,e.frequency.value=60,t.gain.value=.018,e.connect(t),t.connect(c.destination),e.start(),g={osc1:e,gain:t}}function ye(e){if(!g)return;let t=60+e*80;g.osc1.frequency.setTargetAtTime(t,c.currentTime,.4),g.gain.gain.setTargetAtTime(.018+e*.012,c.currentTime,.4)}function be(){!c||f||!K||(f=!0,p=c.createGain(),p.gain.value=Kt*.55,p.connect(c.destination),_e(c,c.currentTime+.05,0))}function xe(){f=!1,clearTimeout(ce),p&&(p.gain.setTargetAtTime(0,c.currentTime,.2),setTimeout(()=>{p=null},500))}function Se(){g&&(g.gain.gain.setTargetAtTime(0,c.currentTime,.15),setTimeout(()=>{try{g.osc1.stop()}catch{}g=null},400))}let _={skyTop:`#252a46`,skyMid:`#5d4a5c`,skyLow:`#9c7156`,fog:6968672,ambient:2830157,keyLight:16767400,warmAccent:14258767,coolAccent:9418984,floor:1777984,laneLine:4870013,arch:3752043,gem:15248462,hull:12833766,hullEmissive:3098467,stripe:15398143,glass:924194,glassEmissive:7058376,nacelle:2761754,thrust:16765562,invincible:9431264,hazardBurst:14247471,cssGold:`#e8ac4e`},v=new t.WebGLRenderer({canvas:o,antialias:!i});v.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5)),v.shadowMap.enabled=!1,v.setSize(window.innerWidth,window.innerHeight);let y=new t.Scene;function Ce(){let e=document.createElement(`canvas`);e.width=2,e.height=256;let n=e.getContext(`2d`),r=n.createLinearGradient(0,0,0,256);return r.addColorStop(0,_.skyTop),r.addColorStop(.58,_.skyMid),r.addColorStop(1,_.skyLow),n.fillStyle=r,n.fillRect(0,0,2,256),new t.CanvasTexture(e)}y.background=Ce(),y.fog=new t.FogExp2(_.fog,.019);let b=new t.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.1,300);b.position.set(0,2.8,9),b.lookAt(0,.5,0);let we=b.position.z-6;function Te(){let e=b.aspect,t=2*Math.atan(11/(2*we)),n=2*Math.atan(Math.tan(t/2)/e)*(180/Math.PI);n=Math.max(70,Math.min(100,n)),b.fov=n,b.updateProjectionMatrix()}Te();function Ee(){b.aspect=window.innerWidth/window.innerHeight,Te(),v.setSize(window.innerWidth,window.innerHeight)}window.addEventListener(`resize`,Ee);function x(e){if(!i)return new t.MeshStandardMaterial(e);let{roughness:n,metalness:r,...a}=e;return new t.MeshLambertMaterial(a)}let De=new t.AmbientLight(_.ambient,2.9);y.add(De);let Oe=new t.DirectionalLight(_.keyLight,2.2);Oe.position.set(5,12,8),y.add(Oe);let ke=new t.PointLight(_.warmAccent,2.9,26);ke.position.set(-6,3,2),y.add(ke);let S=new t.Color(_.warmAccent),Ae=new t.Color(_.coolAccent),C=new t.PointLight(_.coolAccent,2.4,10);y.add(C);let je=new t.BufferGeometry,Me=i?1800:3e3,Ne=new Float32Array(Me*3),Pe=new Float32Array(Me*3);for(let e=0;e<Me;e++){Ne[e*3]=(Math.random()-.5)*500,Ne[e*3+1]=(Math.random()-.5)*200,Ne[e*3+2]=(Math.random()-.5)*500-100;let t=Math.random();Pe[e*3]=t>.7?0:1,Pe[e*3+1]=t>.7?1:t>.4?0:.5,Pe[e*3+2]=1}je.setAttribute(`position`,new t.BufferAttribute(Ne,3)),je.setAttribute(`color`,new t.BufferAttribute(Pe,3));let Fe=new t.PointsMaterial({size:.5,vertexColors:!0,transparent:!0,opacity:.85}),Ie=new t.Points(je,Fe);y.add(Ie);let Le=6.5,w=i?20:30,Re=new Float32Array(w);for(let e=0;e<w;e++)Re[e]=-e*5;let ze=new t.PlaneGeometry(9,5,8,1);ze.rotateX(-Math.PI/2);let Be=x({color:_.floor,roughness:1,metalness:0,emissive:856360}),Ve=new t.InstancedMesh(ze,Be,w);y.add(Ve);let He=new t.BoxGeometry(.04,.02,5),Ue=x({color:_.laneLine,emissive:_.laneLine,emissiveIntensity:1.15}),We=new t.InstancedMesh(He,Ue,w*9);y.add(We);let Ge=new t.BoxGeometry(.06,.06,5),Ke=x({color:_.warmAccent,emissive:_.warmAccent,emissiveIntensity:1.1}),qe=x({color:_.coolAccent,emissive:_.coolAccent,emissiveIntensity:1.1}),Je=new t.InstancedMesh(Ge,Ke,w),Ye=new t.InstancedMesh(Ge,qe,w);y.add(Je),y.add(Ye);let Xe=x({color:_.arch,emissive:_.arch,emissiveIntensity:.8}),Ze=new t.BoxGeometry(.1,Le,.1),Qe=new t.InstancedMesh(Ze,Xe,w*2);y.add(Qe);let $e=new t.BoxGeometry(9,.1,.1),et=new t.InstancedMesh($e,Xe,w);y.add(et);let tt=new t.Matrix4,nt=new t.Vector3,rt=new t.Quaternion,it=new t.Vector3(1,1,1);function T(e,t,n,r,i){nt.set(n,r,i),tt.compose(nt,rt,it),e.setMatrixAt(t,tt)}function at(){for(let e=0;e<w;e++){let t=Re[e];T(Ve,e,0,-1.1,t);for(let n=0;n<9;n++)T(We,e*9+n,n-4,-1.09,t);T(Je,e,-9/2,-1.05,t),T(Ye,e,9/2,-1.05,t);let n=t-5/2;T(Qe,e*2,-9/2,Le/2-1.1,n),T(Qe,e*2+1,9/2,Le/2-1.1,n),T(et,e,0,Le-1.1,n)}Ve.instanceMatrix.needsUpdate=!0,We.instanceMatrix.needsUpdate=!0,Je.instanceMatrix.needsUpdate=!0,Ye.instanceMatrix.needsUpdate=!0,Qe.instanceMatrix.needsUpdate=!0,et.instanceMatrix.needsUpdate=!0}at();function ot(){let e=new t.Shape;e.moveTo(.52,0),e.quadraticCurveTo(.42,.1,.2,.13),e.lineTo(.06,.15),e.lineTo(-.12,.42),e.lineTo(-.26,.44),e.lineTo(-.2,.15),e.lineTo(-.34,.13),e.lineTo(-.46,.2),e.lineTo(-.4,.06),e.lineTo(-.4,-.06),e.lineTo(-.46,-.2),e.lineTo(-.34,-.13),e.lineTo(-.2,-.15),e.lineTo(-.26,-.44),e.lineTo(-.12,-.42),e.lineTo(.06,-.15),e.lineTo(.2,-.13),e.quadraticCurveTo(.42,-.1,.52,0);let n=new t.ExtrudeGeometry(e,{depth:.09,bevelEnabled:!0,bevelThickness:.035,bevelSize:.03,bevelSegments:2,curveSegments:8});return n.rotateX(-Math.PI/2),n.rotateY(Math.PI/2),n.center(),n}function st(){let e=new t.Group,n=2.3,r=new t.Mesh(ot(),x({color:_.hull,emissive:_.hullEmissive,emissiveIntensity:.55,roughness:.3,metalness:.6}));r.scale.setScalar(n),e.add(r);let i=new t.Mesh(new t.BoxGeometry(n*.05,.012,n*.66),x({color:_.stripe,emissive:_.stripe,emissiveIntensity:.45,roughness:.4,metalness:.3}));i.position.set(0,n*.055,-2.3*.02),e.add(i);let a=new t.Mesh(new t.SphereGeometry(n*.13,14,10),x({color:_.glass,emissive:_.glassEmissive,emissiveIntensity:.5,roughness:.15,metalness:.7}));a.scale.set(1,.62,1.7),a.position.set(0,n*.06,-2.3*.18),e.add(a);let o=[];for(let r of[-1,1]){let i=new t.Mesh(new t.CylinderGeometry(n*.055,n*.075,n*.3,10),x({color:_.nacelle,emissive:_.warmAccent,emissiveIntensity:.2,roughness:.35,metalness:.6}));i.rotation.x=Math.PI/2,i.position.set(r*n*.19,n*.02,n*.28),e.add(i);let a=new t.Mesh(new t.ConeGeometry(n*.055,n*.3,8),new t.MeshBasicMaterial({color:_.thrust,transparent:!0,opacity:.85,blending:t.AdditiveBlending,depthWrite:!1}));a.rotation.x=Math.PI/2,a.position.set(r*n*.19,n*.02,n*.68),e.add(a),o.push(a)}let s=new t.Mesh(new t.CircleGeometry(n*.55,20),new t.MeshBasicMaterial({color:_.coolAccent,transparent:!0,opacity:.2,blending:t.AdditiveBlending,depthWrite:!1}));s.rotation.x=-Math.PI/2,s.position.y=-2.3*.09,e.add(s);let c=new t.Mesh(new t.SphereGeometry(.22,8,8),x({color:_.coolAccent,emissive:_.coolAccent,emissiveIntensity:2.8,transparent:!0,opacity:.85}));c.position.set(0,n*.02,n*.42),e.add(c);let l=new t.Mesh(new t.ConeGeometry(.2,1,8),x({color:_.coolAccent,emissive:_.coolAccent,emissiveIntensity:2.4,transparent:!0,opacity:.45}));return l.rotation.x=-Math.PI/2,l.position.set(0,n*.02,n*.72),e.add(l),e.userData.cockpit=a,e.userData.glow=c,e.userData.thrusters=o,e}let E=.3,D=st(),ct=D.userData.cockpit,lt=D.userData.glow,ut=D.userData.thrusters;D.position.set(0,E,6),D.frustumCulled=!1,D.traverse(e=>{e.frustumCulled=!1}),y.add(D);let dt=[],O=[],ft=[x({color:16723245,emissive:6684672,roughness:.3,metalness:.7}),x({color:16737792,emissive:5579264,roughness:.3,metalness:.7}),x({color:13369599,emissive:4456550,roughness:.3,metalness:.7}),x({color:16711782,emissive:5570594,roughness:.3,metalness:.7}),x({color:16729088,emissive:6689024,roughness:.3,metalness:.7})],pt=[new t.BoxGeometry(1.3,1.3,1.3),new t.OctahedronGeometry(.85),new t.TetrahedronGeometry(1),new t.IcosahedronGeometry(.75),new t.TorusGeometry(.65,.22,8,14)];function mt(){if(dt.length>0){let e=dt.pop();return e.group.visible=!0,e}let e=Math.floor(Math.random()*pt.length),n=Math.floor(Math.random()*ft.length),r=new t.Mesh(pt[e],ft[n]),i=x({color:ft[n].color,emissive:ft[n].color,emissiveIntensity:3,transparent:!0,opacity:.8}),a=new t.Mesh(new t.TorusGeometry(1,.04,4,20),i);a.name=`ring`;let o=new t.Group;return o.add(r),o.add(a),y.add(o),{group:o,mesh:r,ring:a}}function ht(e){e.group.visible=!1,y.remove(e.group),dt.push(e)}for(let e=0;e<20;e++)ht(mt());let gt=[],k=[],_t=x({color:_.gem,emissive:13208112,emissiveIntensity:1.8,roughness:.1,metalness:.8});function vt(){if(gt.length>0){let e=gt.pop();return e.visible=!0,y.add(e),e}let e=new t.Mesh(new t.OctahedronGeometry(.38),_t);return y.add(e),e}function yt(e){e.visible=!1,y.remove(e),gt.push(e)}let bt={spark:72,gem:40},xt=new t.SphereGeometry(.12,4,4),St=new t.OctahedronGeometry(.06),A=[],j={spark:[],gem:[]};function Ct(e){let n=new t.Mesh(e===`gem`?St:xt,x({color:e===`gem`?_.gem:_.hazardBurst,emissive:e===`gem`?_.gem:_.hazardBurst,emissiveIntensity:e===`gem`?4:3,transparent:!0,opacity:1}));return n.visible=!1,n.frustumCulled=!1,y.add(n),n}for(let e=0;e<bt.spark;e++)j.spark.push(Ct(`spark`));for(let e=0;e<bt.gem;e++)j.gem.push(Ct(`gem`));function wt(e){let t=j[e];if(t.length)return t.pop();for(let t=0;t<A.length;t++)if(A[t].kind===e){let e=A[t].mesh;return A.splice(t,1),e}return null}function Tt(e,t,n,r,i,a,o,s,c){let l=wt(e);l&&(l.position.set(t,n,r),l.scale.setScalar(c),l.material.opacity=1,l.visible=!0,A.push({kind:e,mesh:l,vx:i,vy:a,vz:o,life:1,decay:s}))}function Et(e,t,n){for(let r=0;r<18;r++){let r=Math.random()*Math.PI*2,i=Math.random()*Math.PI,a=Math.random()*.35+.1;Tt(`spark`,e,t,n,Math.sin(i)*Math.cos(r)*a,Math.sin(i)*Math.sin(r)*a,Math.cos(i)*a,.025+Math.random()*.02,.65+Math.random()*1.15)}}function Dt(e,t,n){for(let r=0;r<10;r++){let r=Math.random()*Math.PI*2;Tt(`gem`,e,t,n,Math.cos(r)*.18,.15+Math.random()*.1,Math.sin(r)*.18,.04,1)}}function Ot(e){for(let t=A.length-1;t>=0;t--){let n=A[t];if(n.mesh.position.x+=n.vx*e,n.mesh.position.y+=n.vy*e,n.mesh.position.z+=n.vz*e,n.vy-=.008*e,n.life-=n.decay*e,n.life<=0){n.mesh.visible=!1,j[n.kind].push(n.mesh),A.splice(t,1);continue}n.mesh.material.opacity=Math.max(0,n.life),n.mesh.scale.setScalar(n.life)}}let M={};function kt(e,t,n=700){let r=a(`#vr-popup`);r.textContent=e,r.style.color=t,r.style.opacity=`1`,r.style.transform=`translateX(-50%) scale(1)`,clearTimeout(M.popup),M.popup=setTimeout(()=>{r.style.opacity=`0`,r.style.transform=`translateX(-50%) scale(0.8)`},n)}function At(e,t=150){let n=a(`#${e}`);n.style.opacity=`1`;let r=`flash-${e}`;clearTimeout(M[r]),M[r]=setTimeout(()=>{n.style.opacity=`0`},t)}let jt=7e3,Mt=new t.CylinderGeometry(.09,.09,1.5,6);Mt.rotateX(Math.PI/2);let Nt=new t.MeshBasicMaterial({color:_.thrust,transparent:!0,opacity:.9,blending:t.AdditiveBlending,depthWrite:!1}),Pt=[],N=[];for(let e=0;e<16;e++){let e=new t.Mesh(Mt,Nt);e.visible=!1,e.frustumCulled=!1,y.add(e),Pt.push(e)}let P=0,F=0,Ft=0;function It(e){let t=Pt.pop();t&&(t.position.set(e,E,D.position.z-1.6),t.visible=!0,N.push(t))}function Lt(e){let t=N[e];t.visible=!1,N.splice(e,1),Pt.push(t)}function Rt(){for(let e=N.length-1;e>=0;e--)Lt(e)}function zt(e){let t=Math.round(e===`firing`?F/jt*100:P/8*100);t!==L.power&&(I.powerFill.style.width=`${t}%`,L.power=t),e!==L.powerState&&(I.power.classList.toggle(`vr-ready`,e===`ready`),I.power.classList.toggle(`vr-firing`,e===`firing`),I.powerLabel.textContent=e===`firing`?`FIRING`:e===`ready`?i?`TAP TO FIRE`:`SPACE TO FIRE`:`PULSE`,L.powerState=e)}function Bt(){z===`playing`&&(F>0||P<8||(F=jt,Ft=0,zt(`firing`),kt(`PULSE CANNON`,_.cssGold,900),se()))}let I={score:a(`#vr-scorehud`),level:a(`#vr-levelhud`),speedFill:a(`#vr-speedfill`),speedLines:a(`#vr-speedlines`),warnFlash:a(`#vr-warningflash`),combo:a(`#vr-combodisplay`),comboText:a(`#vr-combotext`),power:a(`#vr-power`),powerFill:a(`#vr-powerfill`),powerLabel:a(`#vr-powerlabel`)},L={speedPct:-1,score:-1,lines:-1,warn:-1,power:-1,powerState:``},R=[-3.2,0,3.2],z=`menu`,B=0,V=parseInt(localStorage.getItem(`vrBest`)||`0`,10),Vt=3,H=1,Ht=0,U=0,W=.32,Ut=.85,Wt=0,G=0,Gt=0,K=!0,q=!0,Kt=.7,J=.8,qt=localStorage.getItem(`vrName`)||`PILOT`;function Jt(){try{return JSON.parse(localStorage.getItem(`vrScores`)||`[]`)}catch{return[]}}function Yt(e,t,n,r){let i=Jt();i.push({name:e.toUpperCase().slice(0,10),score:t,level:n,gems:r,date:new Date().toLocaleDateString()}),i.sort((e,t)=>t.score-e.score),i.splice(5),localStorage.setItem(`vrScores`,JSON.stringify(i))}function Xt(){window.confirm(`Clear all high scores?`)&&(localStorage.removeItem(`vrScores`),Zt(),d())}function Zt(){let e=Jt(),t=a(`#vr-hstable`);if(!e.length){t.innerHTML=`<div class="vr-hs-empty">NO SCORES YET<br>BE THE FIRST PILOT!</div>`;return}let n=[`vr-gold-rank`,`vr-silver`,`vr-bronze`,`vr-other`,`vr-other`],r=[`1ST`,`2ND`,`3RD`,`4TH`,`5TH`];t.innerHTML=e.map((e,t)=>`
      <div class="vr-hs-row">
        <div class="vr-hs-rank ${n[t]}">${r[t]}</div>
        <div class="vr-hs-name">${e.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px">LV${e.level}</div>
        <div class="vr-hs-score">${e.score}</div>
      </div>`).join(``)}let Qt=[`vr-menuscreen`,`vr-highscorescreen`,`vr-settingsscreen`,`vr-howscreen`,`vr-countdownscreen`,`vr-pausescreen`,`vr-gameoverscreen`];function Y(e){d(),Qt.forEach(e=>{let t=a(`#${e}`);t&&(t.style.display=`none`)});let t=a(`#${e}`);t&&(t.style.display=`flex`),e===`vr-highscorescreen`&&Zt(),e===`vr-settingsscreen`&&(a(`#vr-nameinput`).value=qt,a(`#vr-musicvol`).value=Math.round(Kt*100),a(`#vr-sfxvol`).value=Math.round(J*100),a(`#vr-musictoggle`).textContent=K?`ON`:`OFF`,a(`#vr-musictoggle`).className=`vr-toggle-btn `+(K?`vr-on`:`vr-off`),a(`#vr-sfxtoggle`).textContent=q?`ON`:`OFF`,a(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(q?`vr-on`:`vr-off`))}function $t(){qt=a(`#vr-nameinput`).value||`PILOT`,localStorage.setItem(`vrName`,qt)}function en(e){Kt=e/100,p&&p.gain.setTargetAtTime(Kt*.55,c.currentTime,.1)}function tn(e){J=e/100}function nn(){K=!K,a(`#vr-musictoggle`).textContent=K?`ON`:`OFF`,a(`#vr-musictoggle`).className=`vr-toggle-btn `+(K?`vr-on`:`vr-off`),K?z===`playing`&&(l(),be()):xe()}function rn(){q=!q,a(`#vr-sfxtoggle`).textContent=q?`ON`:`OFF`,a(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(q?`vr-on`:`vr-off`)}function an(){d(),n?.()}let on=!1,sn=0,X=0,Z=0,cn=0,Q=0,ln=0,un=0,dn=0,fn=1,$={left:!1,right:!1};a(`#vr-besthud`).textContent=V,a(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${V}`,V>0&&(a(`#vr-menubest`).style.opacity=`1`);function pn(e){if((e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&($.left=!0),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&($.right=!0),(e.key===`p`||e.key===`P`||e.key===`Escape`)&&(z===`playing`||z===`paused`)&&Un(),e.key===` `&&z===`playing`){e.preventDefault(),Bt();return}(e.key===` `||e.key===`Enter`)&&(z===`gameover`||z===`menu`)&&(e.preventDefault(),Vn())}function mn(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&($.left=!1),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&($.right=!1)}document.addEventListener(`keydown`,pn),document.addEventListener(`keyup`,mn);let hn=1,gn=!1;function _n(e){if(gn)return;let t=hn+(e===`left`?-1:1);t<0||t>=R.length||(hn=t,Wt=R[hn],gn=!0,q&&c&&u(e===`left`?300:340,`sine`,.04,.03*J),yn(e))}let vn={};function yn(e){let t=a(e===`left`?`#vr-btnleft`:`#vr-btnright`);t&&(t.classList.add(`vr-pressed`),clearTimeout(vn[e]),vn[e]=setTimeout(()=>t.classList.remove(`vr-pressed`),140))}let bn=()=>Math.max(44,(o.clientWidth||window.innerWidth)*.07),xn=null,Sn=0,Cn=0,wn=!1,Tn=0,En=0,Dn=0,On=!1;function kn(){On||(On=!0,a(`#vr-swipehint`)?.classList.add(`vr-faded`))}function An(e){if(l(),z===`playing`&&xn===null){xn=e.pointerId,Sn=e.clientX,Cn=e.clientY,Tn=e.clientX,En=e.clientY,Dn=performance.now(),wn=!1;try{o.setPointerCapture(e.pointerId)}catch{}}}function jn(e){if(e.pointerId!==xn||z!==`playing`)return;let t=e.clientX-Sn,n=bn();Math.abs(t)<n||Math.abs(e.clientY-Cn)>Math.abs(t)*1.2||(_n(t<0?`left`:`right`),wn=!0,kn(),Sn=e.clientX,Cn=e.clientY)}function Mn(e){if(e.pointerId!==xn)return;try{o.releasePointerCapture(e.pointerId)}catch{}if(xn=null,e.type!==`pointerup`)return;let t=Math.hypot(e.clientX-Tn,e.clientY-En);!wn&&t<16&&performance.now()-Dn<320&&Bt()}o.addEventListener(`pointerdown`,An),o.addEventListener(`pointermove`,jn),o.addEventListener(`pointerup`,Mn),o.addEventListener(`pointercancel`,Mn);function Nn(){let e=mt(),n=Math.floor(Math.random()*R.length),r=R[n],i=E+(Math.random()-.5)*1.5;e.group.position.set(r,i,-90),e.group.visible=!0,y.add(e.group),e.mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0),e.ring.rotation.x=Math.random(),e.rotSpd=new t.Vector3((Math.random()-.5)*.06,(Math.random()-.5)*.06,(Math.random()-.5)*.04),e.lane=n,e.warned=!1,O.push(e)}function Pn(){let e=vt(),t=Math.floor(Math.random()*R.length);e.position.set(R[t],E+(Math.random()-.5)*1.7,-95),e.rotation.set(0,0,0),k.push(e)}function Fn(){for(let e=1;e<=3;e++)a(`#vr-h${e}`).classList.toggle(`vr-dead`,e>Vt)}let In=0,Ln=null;function Rn(e){Ln=requestAnimationFrame(Rn);let t=Math.min((e-In)/16.667,3);if(In=e,dn++,Q=dn/60,Ie.rotation.y+=8e-5*t,z===`playing`){for(let e=0;e<w;e++)Re[e]+=W*t,Re[e]>12&&(Re[e]-=w*5);at()}if(z===`menu`||z===`gameover`){D.position.y=E+Math.sin(Q*1.2)*.2,D.rotation.y=Math.sin(Q*.4)*.25,b.position.x=Math.sin(Q*.2)*1.5,b.lookAt(0,.5,0),C.position.copy(D.position),Ot(t),v.render(y,b);return}if(z===`paused`||z===`countdown`){v.render(y,b);return}$.left&&_n(`left`),$.right&&_n(`right`);let n=t/60,r=1-Math.exp(-16*n),i=G;G+=r*(Wt-G),G=Math.max(-3.2,Math.min(3.2,G)),gn&&Math.abs(G-Wt)<.12&&(gn=!1);let a=-((G-i)/n)*.01;Gt+=(a-Gt)*r*1.2,D.position.x=G,D.position.y=E+Math.sin(Q*2)*.04,D.rotation.z=Math.max(-.45,Math.min(.45,Gt)),D.rotation.y=Gt*.12,lt.material.emissiveIntensity=3.5+Math.sin(Q*25)*1;for(let e=0;e<ut.length;e++){let t=ut[e];t.scale.z=.85+Math.sin(Q*22+e*1.7)*.22,t.material.opacity=.7+Math.sin(Q*19+e)*.15}if(C.position.copy(D.position),C.position.z+=1,on){sn-=t;let e=.5+.5*Math.sin(sn*.4);ct.material.emissive.setHex(_.invincible),ct.material.emissiveIntensity=2+e*3,lt.material.emissive.setHex(_.invincible),lt.material.emissiveIntensity=4+e*4,C.color.setHex(_.invincible),C.intensity=4+e*3,sn<=0&&(on=!1,ct.material.emissive.setHex(_.glassEmissive),ct.material.emissiveIntensity=.5,lt.material.emissive.setHex(_.coolAccent),lt.material.emissiveIntensity=4,C.color.setHex(_.coolAccent),C.intensity=3)}W=Math.min(Ut,.32+Q*.006),U=(W-.32)/(Ut-.32),B=Math.floor(Q*15+Ht*8),H=Math.min(10,Math.floor(U*9)+1),H!==fn&&(re(),I.level.textContent=`LV ${H}`,fn=H);let o=Math.round(U*100);o!==L.speedPct&&(I.speedFill.style.width=`${o}%`,L.speedPct=o),B!==L.score&&(I.score.textContent=B,L.score=B);let s=U>.5?Math.round((U-.5)*80)/100:0;s!==L.lines&&(I.speedLines.style.opacity=String(s),L.lines=s);let c=Math.sin(Q*.4);ke.position.x=c*5.5;let l=.5+.5*Math.cos(Q*.3);ke.color.setRGB(S.r+(Ae.r-S.r)*l,S.g+(Ae.g-S.g)*l,S.b+(Ae.b-S.b)*l),ke.intensity=3.1+Math.sin(Q*2)*.8,cn>0&&(cn-=t,cn<=0&&(Z=0,I.combo.style.opacity=`0`));let u=Math.max(28,75-H*5);ln-=t,ln<=0&&(Nn(),ln=u),un-=t,un<=0&&(Pn(),un=65+Math.random()*40);let ne=!1;for(let e=O.length-1;e>=0;e--){let n=O[e];if(n.group.position.z+=(W+.28)*t,n.mesh.rotation.x+=n.rotSpd.x*t,n.mesh.rotation.y+=n.rotSpd.y*t,n.ring.rotation.z+=.04*t,n.group.position.z>-30&&n.group.position.z<-8){let e=.4+Math.sin(Q*12)*.3;n.ring.material.emissiveIntensity=2+e*3,Math.abs(n.group.position.x-G)<1.5&&(ne=!0)}else n.ring.material.emissiveIntensity=1;if(n.group.position.z>14){ht(n),O.splice(e,1);continue}if(!on&&n.group.position.z>4&&n.group.position.z<9){let t=Math.abs(n.group.position.x-D.position.x),r=Math.abs(n.group.position.y-D.position.y);if(t<.95&&r<.95){if(Et(n.group.position.x,n.group.position.y,n.group.position.z),ht(n),O.splice(e,1),Vt--,Fn(),ie(),At(`vr-hitflash`,200),X=20,Z=0,I.combo.style.opacity=`0`,on=!0,sn=100,Vt<=0){Hn();return}continue}t<1.8&&r<1.8&&!n.warned&&(n.warned=!0,ee(),Z++,cn=120,Z>=2&&(I.comboText.textContent=`COMBO x${Z}`,I.combo.style.opacity=`1`,B+=Z*5))}}let d=ne?Math.round((.4+Math.sin(Q*15)*.3)*20)/20:0;d!==L.warn&&(I.warnFlash.style.opacity=String(d),L.warn=d);let f=1e3/60*t;F>0&&(F=Math.max(0,F-f),Ft-=f,Ft<=0&&(Ft=130,It(G),ae()),zt(F>0?`firing`:`idle`),F===0&&(P=0));for(let e=N.length-1;e>=0;e--){let n=N[e],r=n.position.z;if(n.position.z-=1.15*t,n.position.z<-96){Lt(e);continue}let i=!1;for(let e=O.length-1;e>=0;e--){let t=O[e],a=t.group.position.z;if(!(a>r+1.1||a<n.position.z-1.1)&&!(Math.abs(t.group.position.x-n.position.x)>1.25)){Et(t.group.position.x,t.group.position.y,t.group.position.z),ht(t),O.splice(e,1),B+=20,oe(),i=!0;break}}i&&Lt(e)}for(let e=k.length-1;e>=0;e--){let n=k[e];if(n.position.z+=(W+.15)*t,n.rotation.y+=.06*t,n.rotation.x+=.04*t,n.position.z>14){yt(n),k.splice(e,1);continue}if(n.position.z>4&&n.position.z<9){let t=Math.abs(n.position.x-D.position.x),r=Math.abs(n.position.y-D.position.y);if(t<1.1&&r<1.1){te(),Dt(n.position.x,n.position.y,n.position.z),At(`vr-gemflash`,120),Ht++,F===0&&P<8&&(P++,zt(P>=8?`ready`:`idle`),P===8&&(se(),kt(`PULSE READY`,_.cssGold,900)));let t=25*Math.max(1,Math.floor(Z/2)+1);B+=t,kt(`+${t}`,_.cssGold,600),yt(n),k.splice(e,1)}}}Ot(t);let ce=G*.45;b.position.x+=(ce-b.position.x)*.08*t,b.position.y+=(2.8-b.position.y)*.04*t,X>0&&(b.position.x+=Math.sin(Q*60)*(X*.018),b.position.y+=Math.cos(Q*55)*(X*.012),X-=t*1.8,X<0&&(X=0)),b.position.z=9,b.lookAt(G*.5,.8,0),ye(U),v.render(y,b)}function zn(){O.forEach(e=>ht(e)),O.length=0,k.forEach(e=>yt(e)),k.length=0,Rt(),A.forEach(e=>{e.mesh.visible=!1,j[e.kind].push(e.mesh)}),A.length=0}let Bn=null;function Vn(){l(),d(),[`vr-menuscreen`,`vr-gameoverscreen`,`vr-pausescreen`].forEach(e=>{a(`#${e}`).style.display=`none`}),a(`#vr-countdownscreen`).style.display=`flex`,a(`#vr-hud`).style.display=`none`,a(`#vr-speedbar`).style.display=`none`,a(`#vr-power`).style.display=`none`,a(`#vr-pausebtn`).style.display=`none`,a(`#vr-thumbcontrols`).style.display=`none`,zn(),B=0,Vt=3,Ht=0,H=1,fn=1,P=0,F=0,Ft=0,L.power=-1,L.powerState=``,zt(`idle`),a(`#vr-levelhud`).textContent=`LV 1`,Q=0,dn=0,W=.32,U=0,Wt=0,G=0,Gt=0,hn=1,gn=!1,on=!1,D.visible=!0,Z=0,cn=0,X=0,ln=80,un=100,Fn(),I.combo.style.opacity=`0`,a(`#vr-warningflash`).style.opacity=`0`,a(`#vr-speedlines`).style.opacity=`0`,z=`countdown`;let e=3,t=a(`#vr-countdownnum`);function n(){t.textContent=e>0?String(e):`GO!`,t.style.animation=`none`,t.offsetHeight,t.style.animation=`vrCountPulse 0.9s ease-out`,e>0?u(440,`square`,.1,.1):u(880,`square`,.15,.15),e--,Bn=setTimeout(e>=0?n:()=>{a(`#vr-countdownscreen`).style.display=`none`,a(`#vr-hud`).style.display=`flex`,a(`#vr-speedbar`).style.display=`flex`,a(`#vr-power`).style.display=`flex`,a(`#vr-pausebtn`).style.display=`flex`,i&&(a(`#vr-thumbcontrols`).style.display=`block`,On=!1,a(`#vr-swipehint`)?.classList.remove(`vr-faded`)),z=`playing`,ve(),be()},950)}n()}function Hn(){z=`gameover`,ne(),Se(),xe(),Et(D.position.x,D.position.y,D.position.z),Et(D.position.x,D.position.y,D.position.z),D.visible=!1,X=35;let e=B>V;e&&(V=B,localStorage.setItem(`vrBest`,String(V)),a(`#vr-besthud`).textContent=V,a(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${V}`),Yt(qt,B,H,Ht),a(`#vr-goscore`).textContent=B,a(`#vr-golevel`).textContent=H,a(`#vr-gogems`).textContent=Ht,a(`#vr-gobest`).textContent=V,a(`#vr-newbestbadge`).style.display=e?`block`:`none`,M.gameover=setTimeout(()=>{a(`#vr-thumbcontrols`).style.display=`none`,a(`#vr-pausebtn`).style.display=`none`,a(`#vr-hud`).style.display=`none`,a(`#vr-speedbar`).style.display=`none`,a(`#vr-power`).style.display=`none`,a(`#vr-gameoverscreen`).style.display=`flex`},600)}function Un(){z===`playing`?(z=`paused`,d(),Se(),xe(),a(`#vr-pausescreen`).style.display=`flex`,a(`#vr-pausebtn`).textContent=`▶`):z===`paused`&&(z=`playing`,d(),l(),ve(),be(),a(`#vr-pausescreen`).style.display=`none`,a(`#vr-pausebtn`).textContent=`⏸️`)}function Wn(){z=`menu`,Se(),xe(),zn(),D.visible=!0,a(`#vr-hud`).style.display=`none`,a(`#vr-speedbar`).style.display=`none`,a(`#vr-power`).style.display=`none`,a(`#vr-pausebtn`).style.display=`none`,a(`#vr-thumbcontrols`).style.display=`none`,a(`#vr-warningflash`).style.opacity=`0`,a(`#vr-speedlines`).style.opacity=`0`,a(`#vr-menubest`).style.opacity=V>0?`1`:`0`,a(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${V}`,Y(`vr-menuscreen`)}let Gn=[[`#vr-btnplay`,`click`,Vn],[`#vr-btnscores`,`click`,()=>Y(`vr-highscorescreen`)],[`#vr-btnsettings`,`click`,()=>Y(`vr-settingsscreen`)],[`#vr-btnhow`,`click`,()=>Y(`vr-howscreen`)],[`#vr-btnexit`,`click`,an],[`#vr-btnclearscores`,`click`,Xt],[`#vr-btnhsback`,`click`,()=>Y(`vr-menuscreen`)],[`#vr-btnsetback`,`click`,()=>Y(`vr-menuscreen`)],[`#vr-btnhowback`,`click`,()=>Y(`vr-menuscreen`)],[`#vr-btnresume`,`click`,Un],[`#vr-btnpausesettings`,`click`,()=>{Y(`vr-settingsscreen`),z=`menu`}],[`#vr-btnpausemenu`,`click`,Wn],[`#vr-btnagain`,`click`,Vn],[`#vr-btngoscores`,`click`,()=>Y(`vr-highscorescreen`)],[`#vr-btngomenu`,`click`,Wn],[`#vr-pausebtn`,`click`,Un]];return Gn.forEach(([e,t,n])=>a(e)?.addEventListener(t,n)),a(`#vr-nameinput`)?.addEventListener(`input`,$t),a(`#vr-musicvol`)?.addEventListener(`input`,e=>en(e.target.value)),a(`#vr-sfxvol`)?.addEventListener(`input`,e=>tn(e.target.value)),a(`#vr-musictoggle`)?.addEventListener(`click`,nn),a(`#vr-sfxtoggle`)?.addEventListener(`click`,rn),In=performance.now(),Ln=requestAnimationFrame(Rn),{dispose(){if(cancelAnimationFrame(Ln),window.removeEventListener(`resize`,Ee),document.removeEventListener(`keydown`,pn),document.removeEventListener(`keyup`,mn),o.removeEventListener(`pointerdown`,An),o.removeEventListener(`pointermove`,jn),o.removeEventListener(`pointerup`,Mn),o.removeEventListener(`pointercancel`,Mn),Gn.forEach(([e,t,n])=>a(e)?.removeEventListener(t,n)),Object.values(M).forEach(e=>clearTimeout(e)),Object.values(vn).forEach(e=>clearTimeout(e)),clearTimeout(ce),clearTimeout(Bn),xe(),Se(),c)try{c.close()}catch{}y.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())}),v.dispose(),r(v)}}}function te({onBack:e}){let t=(0,i.useRef)(null),n=(0,i.useRef)(e);return n.current=e,(0,i.useEffect)(()=>{let e=t.current;if(!e)return;let r=null,i=!1;return e.innerHTML=u,c().then(t=>{i||!e.isConnected||(r=ee(e,t,{onBack:()=>n.current?.()}))}).catch(()=>{i||(e.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffe6b0;font-family:sans-serif">Requires an internet connection to load Void Runner.</div>`)}),()=>{i=!0,r?.dispose(),e.innerHTML=``}},[]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(`style`,{children:l}),(0,a.jsx)(`div`,{className:`vr-root`,ref:t})]})}export{te as default};