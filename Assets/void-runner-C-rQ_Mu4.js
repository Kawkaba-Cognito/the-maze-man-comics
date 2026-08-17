import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{Bt as r}from"./index-DLTJLm1C.js";import{r as i}from"./c3dViewport-D3K1ZAxX.js";var a=e(t()),o=n(),s=`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`,c=`sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==`;function l(){return window.THREE?Promise.resolve(window.THREE):new Promise((e,t)=>{let n=document.getElementById(`vr-three-cdn`);if(n){n.addEventListener(`load`,()=>e(window.THREE)),n.addEventListener(`error`,()=>t(Error(`three-cdn-failed`)));return}let r=document.createElement(`script`);r.id=`vr-three-cdn`,r.src=s,r.integrity=c,r.crossOrigin=`anonymous`,r.onload=()=>e(window.THREE),r.onerror=()=>{r.remove(),t(Error(`three-cdn-failed`))},document.head.appendChild(r)})}var u=`
.vr-root {
  /* App palette: Kawkab blue + app amber over dusk indigo. These now match the
     3D scene's VR.* constants, and the raw neon literals that used to bypass
     them (rgba(0,245,255…) / rgba(255,45,155…)) have been folded in. */
  --vr-pink:   var(--game-bad, #854c49);
  --vr-cyan:   var(--game-accent, #8fb8e8);
  --vr-purple: #6f6a9c;
  --vr-gold:   var(--color-amber, #e8ac4e);
  --vr-dark-bg: var(--play-surface-deep-flat, #121826);
  position: fixed; inset: 0; z-index: 60;
  background: var(--vr-dark-bg);
  overflow: hidden;
  font-family: 'DM Mono', monospace;
  color: var(--play-ink-deep, #ece0c8);
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
.vr-hud-block,
.vr-liveshud { min-width:82px; min-height:52px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  padding:7px 10px; background:rgba(18,24,38,0.8); border:1px solid rgba(236,224,200,0.32); border-radius:12px;
  box-shadow:3px 3px 0 var(--fx-shadow-drop, rgba(3,7,16,0.88)); backdrop-filter:blur(5px); }
.vr-hud-label { font-size:9px; letter-spacing:3px; color:var(--play-ink-deep-dim, #b9bfd0); text-transform:uppercase; }
.vr-hud-val { font-family:'DM Mono',sans-serif; font-size:20px; font-weight:700; color:var(--play-ink-deep, #ece0c8); text-shadow:none; }
.vr-liveshud { flex-direction:row; gap:6px; }
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

.vr-pausebtn { position:absolute; top:calc(22px + env(safe-area-inset-top)); left:calc(50% + 58px); transform:none;
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

.vr-lane-indicator { position:absolute; left:50%; bottom:max(56px, calc(34px + env(safe-area-inset-bottom)));
  transform:translateX(-50%); display:none; align-items:center; gap:10px; z-index:14; pointer-events:none;
  padding:8px 12px; border:1px solid rgba(236,224,200,0.28); border-radius:999px;
  background:rgba(18,24,38,0.76); box-shadow:2px 2px 0 rgba(3,7,16,0.78); }
.vr-lane-dot { width:8px; height:8px; border-radius:50%; background:rgba(184,222,217,0.34); border:1px solid rgba(184,222,217,0.56);
  transition:transform 0.16s ease, background 0.16s ease, box-shadow 0.16s ease; }
.vr-lane-dot.vr-active { transform:scale(1.35); background:var(--vr-gold); border-color:#f4ead6; box-shadow:0 0 10px rgba(232,172,78,0.72); }

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
.vr-menu-eyebrow { margin-bottom:14px; font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--vr-gold); }
.vr-tagline { font-size:12px; letter-spacing:6px; color:rgba(143,184,232,0.5); margin-bottom:14px; text-transform:uppercase; }
.vr-menu-meta { display:flex; gap:8px; margin-bottom:28px; flex-wrap:wrap; justify-content:center; }
.vr-menu-meta span { padding:5px 9px; border:1px solid rgba(236,224,200,0.25); border-radius:999px; background:rgba(18,24,38,0.66);
  color:var(--play-ink-deep-dim, #b9bfd0); font-size:9px; letter-spacing:0.12em; text-transform:uppercase; }

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
    var(--play-surface-deep, var(--vr-dark-bg));
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
    linear-gradient(180deg, rgba(17,24,42,0.88), rgba(9,13,25,0.94));
}
.vr-sub-screen {
  background:
    radial-gradient(ellipse at 50% 18%, rgba(154,128,200,0.14), transparent 42%),
    linear-gradient(180deg, rgba(17,24,42,0.97), rgba(9,13,25,0.985));
  backdrop-filter:blur(7px);
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
.vr-copy-strong { color:var(--play-ink-deep, #ece0c8); font-weight:700; }
.vr-copy-gold { color:var(--vr-gold); font-weight:700; }
.vr-copy-bad { color:#e4a09b; font-weight:700; }
.vr-root button:focus-visible,
.vr-root input:focus-visible { outline:3px solid var(--game-selected, #b8ded9); outline-offset:3px; }
@media (max-width:520px) {
  .vr-hud { padding-inline:10px; }
  .vr-hud-block, .vr-liveshud { min-width:70px; min-height:48px; padding:6px 8px; }
  .vr-hud-val { font-size:18px; }
  .vr-menu-meta { max-width:300px; }
}
@media (prefers-reduced-motion:reduce) {
  .vr-root *, .vr-root *::before, .vr-root *::after { animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; }
}
`,ee=`
<div class="vr-container">
  <canvas id="vr-canvas"></canvas>
  <div class="vr-scanlines"></div>
  <div class="vr-vignette"></div>
  <div class="vr-speedlines" id="vr-speedlines"></div>
  <div class="vr-warningflash" id="vr-warningflash"></div>
  <div class="vr-hitflash" id="vr-hitflash"></div>
  <div class="vr-gemflash" id="vr-gemflash"></div>

  <div class="vr-hud" id="vr-hud" style="display:none">
    <div class="vr-hud-block"><span class="vr-hud-label">Score</span><span class="vr-hud-val" id="vr-scorehud">0</span></div>
    <div class="vr-liveshud" id="vr-liveshud">
      <span class="vr-heart" id="vr-h1">&#9829;</span>
      <span class="vr-heart" id="vr-h2">&#9829;</span>
      <span class="vr-heart" id="vr-h3">&#9829;</span>
    </div>
    <div class="vr-hud-block"><span class="vr-hud-label">Best</span><span class="vr-hud-val" id="vr-besthud">0</span></div>
  </div>

  <div class="vr-speedbar" id="vr-speedbar" style="display:none">
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

  <div class="vr-lane-indicator" id="vr-laneindicator" aria-hidden="true">
    <span class="vr-lane-dot" data-lane="0"></span>
    <span class="vr-lane-dot vr-active" data-lane="1"></span>
    <span class="vr-lane-dot" data-lane="2"></span>
  </div>

  <div class="vr-screen" id="vr-menuscreen">
    <div class="vr-menu-eyebrow">Puzzle Studio &middot; Flight Run</div>
    <div class="vr-game-logo">VOID<br>RUNNER</div>
    <div class="vr-tagline">Survive the Impossible</div>
    <div class="vr-menu-meta"><span>3 lanes</span><span>Pulse cannon</span><span>Endless</span></div>
    <div class="vr-best-badge" id="vr-menubest">&#127942; BEST: 0</div>
    <button class="vr-neon-btn vr-neon-btn-primary" id="vr-btnplay" type="button" style="margin-bottom:12px">&#9654; &nbsp;START RUN</button>
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
      <div class="vr-how-text">Your ship flies through the void at increasing speed. <b class="vr-copy-strong">Survive as long as possible.</b></div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#11013;&#65039;&#10145;&#65039;</div>
      <div class="vr-how-text"><b class="vr-copy-strong">Swipe left or right</b> anywhere on the screen to change lane — keep swiping in one drag to cross two lanes. On a keyboard, use <span class="vr-how-key">&#9664; &#9654;</span> or <span class="vr-how-key">A</span> <span class="vr-how-key">D</span>.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128142;</div>
      <div class="vr-how-text">Collect <b class="vr-copy-gold">golden gems</b> to boost your score. Near misses build your COMBO multiplier for bonus points.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128165;</div>
      <div class="vr-how-text">Eight gems charge the <b class="vr-copy-gold">PULSE CANNON</b>. Press <span class="vr-how-key">SPACE</span> (or tap the screen on phone) to fire it for seven seconds — bolts destroy any obstacle they hit.</div></div>
    <div class="vr-how-row"><div class="vr-how-icon">&#128308;</div>
      <div class="vr-how-text">Obstacles glow red when they enter your lane. Dodge them or lose a life. You have <b class="vr-copy-bad">3 lives.</b></div></div>
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
`;function te(e,t,{onBack:n,isAppSfxOn:r,isAppMusicOn:a}){let o=typeof navigator<`u`&&(navigator.maxTouchPoints>0||`ontouchstart`in window),s=t=>e.querySelector(t),c=s(`#vr-canvas`),l=window.AudioContext||window.webkitAudioContext,u=null;function ee(){u||=new l,u.state===`suspended`&&u.resume()}let te=()=>r?.()!==!1,d=()=>a?.()!==!1;function f(e,t,n,r,i=0){if(!u||!te())return;let a=u.createOscillator(),o=u.createGain();a.connect(o),o.connect(u.destination),a.type=t,a.frequency.setValueAtTime(e,u.currentTime+i),o.gain.setValueAtTime(r,u.currentTime+i),o.gain.exponentialRampToValueAtTime(.001,u.currentTime+i+n),a.start(u.currentTime+i),a.stop(u.currentTime+i+n+.05)}function ne(){if(!u)return;let e=u.createOscillator(),t=u.createGain();e.connect(t),t.connect(u.destination),e.type=`sawtooth`,e.frequency.setValueAtTime(800,u.currentTime),e.frequency.exponentialRampToValueAtTime(200,u.currentTime+.15),t.gain.setValueAtTime(.12,u.currentTime),t.gain.exponentialRampToValueAtTime(.001,u.currentTime+.15),e.start(),e.stop(u.currentTime+.2)}function re(){[523,659,784,1047].forEach((e,t)=>f(e,`sine`,.12,.08,t*.05))}function ie(){u&&[60,80,100,120].forEach(e=>{let t=u.createBuffer(1,u.sampleRate*.5,u.sampleRate),n=t.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=(Math.random()*2-1)*(1-e/n.length);let r=u.createBufferSource(),i=u.createGain(),a=u.createBiquadFilter();r.buffer=t,a.type=`lowpass`,a.frequency.value=e*30,r.connect(a),a.connect(i),i.connect(u.destination),i.gain.setValueAtTime(.3,u.currentTime),i.gain.exponentialRampToValueAtTime(.001,u.currentTime+.6),r.start()})}function ae(){[400,500,600,800,1e3].forEach((e,t)=>f(e,`square`,.1,.06,t*.08))}function oe(){f(120,`sawtooth`,.3,.15),f(80,`square`,.4,.1,.05)}function se(){J&&u&&f(440,`sine`,.08,.06*Y)}function ce(){J&&f(880,`square`,.05,.035*Y)}function le(){J&&(f(220,`sawtooth`,.1,.07*Y),f(140,`square`,.12,.05*Y,.02))}function ue(){J&&[660,880,1320].forEach((e,t)=>f(e,`triangle`,.12,.07*Y,t*.06))}let de=!1,fe=null,p=null,pe=[[220,261.63,329.63],[174.61,220,261.63],[130.81,164.81,196],[196,246.94,293.66]],me=[[440,523,659,523,440,392,440,523],[349,440,523,440,349,330,349,440],[262,330,392,330,262,247,262,330],[392,494,587,494,392,370,392,494]],he=60/128,m=he*4;function ge(e,t){let n=e.createOscillator(),r=e.createGain();n.connect(r),r.connect(p),n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(40,t+.08),r.gain.setValueAtTime(.55,t),r.gain.exponentialRampToValueAtTime(.001,t+.18),n.start(t),n.stop(t+.2)}function _e(e,t){let n=e.createBuffer(1,e.sampleRate*.12,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<r.length;e++)r[e]=Math.random()*2-1;let i=e.createBufferSource(),a=e.createBiquadFilter(),o=e.createGain();i.buffer=n,a.type=`bandpass`,a.frequency.value=2400,a.Q.value=.8,i.connect(a),a.connect(o),o.connect(p),o.gain.setValueAtTime(.22,t),o.gain.exponentialRampToValueAtTime(.001,t+.14),i.start(t)}function ve(e,t,n=!1){let r=e.createBuffer(1,e.sampleRate*(n?.18:.04),e.sampleRate),i=r.getChannelData(0);for(let e=0;e<i.length;e++)i[e]=Math.random()*2-1;let a=e.createBufferSource(),o=e.createBiquadFilter(),s=e.createGain();a.buffer=r,o.type=`highpass`,o.frequency.value=9e3,a.connect(o),o.connect(s),s.connect(p),s.gain.setValueAtTime(n?.1:.07,t),s.gain.exponentialRampToValueAtTime(.001,t+(n?.18:.04)),a.start(t)}function ye(e,t,n,r){let i=e.createOscillator(),a=e.createGain(),o=e.createBiquadFilter();i.type=`sawtooth`,i.frequency.value=t/2,o.type=`lowpass`,o.frequency.value=600,o.Q.value=3,i.connect(o),o.connect(a),a.connect(p),a.gain.setValueAtTime(.18,n),a.gain.setValueAtTime(.14,n+r*.7),a.gain.exponentialRampToValueAtTime(.001,n+r),i.start(n),i.stop(n+r+.05)}function be(e,t,n,r){let i=e.createOscillator(),a=e.createGain();i.type=`square`,i.frequency.value=t,i.connect(a),a.connect(p),a.gain.setValueAtTime(.06,n),a.gain.exponentialRampToValueAtTime(.001,n+r*.9),i.start(n),i.stop(n+r)}function xe(e,t,n,r){t.forEach(t=>{let i=e.createOscillator(),a=e.createGain();i.type=`sine`,i.frequency.value=t,i.connect(a),a.connect(p),a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.04,n+.3),a.gain.setValueAtTime(.04,n+r-.3),a.gain.linearRampToValueAtTime(0,n+r),i.start(n),i.stop(n+r+.1)})}function Se(e,t,n){if(!de)return;let r=pe[n%pe.length],i=me[n%me.length];xe(e,r,t,m),ye(e,r[0],t,m/2),ye(e,r[0],t+m/2,m/2);for(let n=0;n<4;n++){let r=t+n*he;(n===0||n===2)&&ge(e,r),(n===1||n===3)&&_e(e,r),ve(e,r,!1),ve(e,r+he/2,n===1)}i.forEach((n,r)=>{be(e,n,t+r*he/2,he/2*.85)}),fe=setTimeout(()=>{Se(e,t+m,n+1)},(m-.1)*1e3)}let h=null;function Ce(){if(!u||h)return;let e=u.createOscillator(),t=u.createGain();e.type=`sawtooth`,e.frequency.value=60,t.gain.value=.018,e.connect(t),t.connect(u.destination),e.start(),h={osc1:e,gain:t}}function we(e){if(!h)return;let t=60+e*80;h.osc1.frequency.setTargetAtTime(t,u.currentTime,.4),h.gain.gain.setTargetAtTime(.018+e*.012,u.currentTime,.4)}function Te(){!u||de||!q||!d()||(de=!0,p=u.createGain(),p.gain.value=an*.55,p.connect(u.destination),Se(u,u.currentTime+.05,0))}function g(){de=!1,clearTimeout(fe),p&&(p.gain.setTargetAtTime(0,u.currentTime,.2),setTimeout(()=>{p=null},500))}function Ee(){h&&(h.gain.gain.setTargetAtTime(0,u.currentTime,.15),setTimeout(()=>{try{h.osc1.stop()}catch{}h=null},400))}let _={skyTop:`#101725`,skyMid:`#28304a`,skyLow:`#5d4a4f`,fog:3422542,ambient:3159628,keyLight:16767400,warmAccent:14258767,coolAccent:9418984,floor:1383469,laneLine:5399160,arch:4608618,gem:15248462,hull:12833766,hullEmissive:3098467,stripe:15398143,glass:924194,glassEmissive:7058376,nacelle:2761754,thrust:16765562,invincible:9431264,hazardBurst:14247471,cssGold:`#e8ac4e`},De=Number.isFinite(navigator.hardwareConcurrency)&&navigator.hardwareConcurrency<=4,Oe=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1,v=new t.WebGLRenderer({canvas:c,antialias:!(o||De),powerPreference:`high-performance`}),ke=o||De?1:1.35,y=Math.min(window.devicePixelRatio||1,ke);v.setPixelRatio(y),e.dataset.renderScale=y.toFixed(2),v.shadowMap.enabled=!1,v.setSize(window.innerWidth,window.innerHeight);let b=new t.Scene;function Ae(){let e=document.createElement(`canvas`);e.width=2,e.height=256;let n=e.getContext(`2d`),r=n.createLinearGradient(0,0,0,256);return r.addColorStop(0,_.skyTop),r.addColorStop(.58,_.skyMid),r.addColorStop(1,_.skyLow),n.fillStyle=r,n.fillRect(0,0,2,256),new t.CanvasTexture(e)}b.background=Ae(),b.fog=new t.FogExp2(_.fog,.019);let x=new t.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.1,300);x.position.set(0,2.8,9),x.lookAt(0,.5,0);let je=x.position.z-6;function Me(){let e=x.aspect,t=2*Math.atan(11/(2*je)),n=2*Math.atan(Math.tan(t/2)/e)*(180/Math.PI);n=Math.max(70,Math.min(100,n)),x.fov=n,x.updateProjectionMatrix()}Me();function Ne(){x.aspect=window.innerWidth/window.innerHeight,Me(),v.setSize(window.innerWidth,window.innerHeight)}window.addEventListener(`resize`,Ne);function S(e){if(!o)return new t.MeshStandardMaterial(e);let{roughness:n,metalness:r,...i}=e;return new t.MeshLambertMaterial(i)}let Pe=new t.AmbientLight(_.ambient,2);b.add(Pe);let Fe=new t.DirectionalLight(_.keyLight,1.45);Fe.position.set(5,12,8),b.add(Fe);let Ie=new t.PointLight(_.warmAccent,2.2,24);Ie.position.set(-6,3,2),b.add(Ie);let C=new t.Color(_.warmAccent),Le=new t.Color(_.coolAccent),w=new t.PointLight(_.coolAccent,1.8,9);b.add(w);let Re=new t.BufferGeometry,ze=o||De?1100:1900,Be=new Float32Array(ze*3),Ve=new Float32Array(ze*3);for(let e=0;e<ze;e++){Be[e*3]=(Math.random()-.5)*500,Be[e*3+1]=(Math.random()-.5)*200,Be[e*3+2]=(Math.random()-.5)*500-100;let t=Math.random();Ve[e*3]=t>.7?0:1,Ve[e*3+1]=t>.7?1:t>.4?0:.5,Ve[e*3+2]=1}Re.setAttribute(`position`,new t.BufferAttribute(Be,3)),Re.setAttribute(`color`,new t.BufferAttribute(Ve,3));let He=new t.PointsMaterial({size:.5,vertexColors:!0,transparent:!0,opacity:.85}),Ue=new t.Points(Re,He);b.add(Ue);let We=new t.Group,Ge=new t.Mesh(new t.IcosahedronGeometry(10,1),new t.MeshBasicMaterial({color:11631183,transparent:!0,opacity:.34,fog:!1,depthWrite:!1}));Ge.position.set(-24,15,-128);let Ke=new t.Mesh(new t.IcosahedronGeometry(5.5,1),new t.MeshBasicMaterial({color:9418984,transparent:!0,opacity:.22,fog:!1,depthWrite:!1}));Ke.position.set(22,7,-102);let qe=new t.Mesh(new t.TorusGeometry(11.8,.14,5,48),new t.MeshBasicMaterial({color:_.warmAccent,transparent:!0,opacity:.36,fog:!1,depthWrite:!1}));qe.position.copy(Ge.position),qe.rotation.x=Math.PI*.32,We.add(Ge,Ke,qe),b.add(We);let Je=6.5,T=o||De?20:26,Ye=new Float32Array(T);for(let e=0;e<T;e++)Ye[e]=-e*5;let E=new t.Group;b.add(E);let Xe=new t.PlaneGeometry(9,5,8,1);Xe.rotateX(-Math.PI/2);let Ze=S({color:_.floor,roughness:1,metalness:0,emissive:856360}),Qe=new t.InstancedMesh(Xe,Ze,T);E.add(Qe);let $e=new t.BoxGeometry(.04,.02,5),et=new t.MeshBasicMaterial({color:_.laneLine,transparent:!0,opacity:.76}),tt=new t.InstancedMesh($e,et,T*9);E.add(tt);let nt=new t.BoxGeometry(.06,.06,5),rt=new t.MeshBasicMaterial({color:_.warmAccent}),it=new t.MeshBasicMaterial({color:_.coolAccent}),at=new t.InstancedMesh(nt,rt,T),ot=new t.InstancedMesh(nt,it,T);E.add(at,ot);let st=new t.MeshBasicMaterial({color:16777215,transparent:!0,opacity:.68}),ct=new t.BoxGeometry(.1,Je,.1),D=new t.InstancedMesh(ct,st,T*2);E.add(D);let lt=new t.BoxGeometry(9,.1,.1),ut=new t.InstancedMesh(lt,st,T);E.add(ut);let dt=new t.Matrix4,ft=new t.Vector3,pt=new t.Quaternion,mt=new t.Vector3(1,1,1);function O(e,t,n,r,i){ft.set(n,r,i),dt.compose(ft,pt,mt),e.setMatrixAt(t,dt)}function ht(){for(let e=0;e<T;e++){let n=Ye[e];O(Qe,e,0,-1.1,n);for(let t=0;t<9;t++)O(tt,e*9+t,t-4,-1.09,n);O(at,e,-9/2,-1.05,n),O(ot,e,9/2,-1.05,n);let r=n-5/2;O(D,e*2,-9/2,Je/2-1.1,r),O(D,e*2+1,9/2,Je/2-1.1,r),O(ut,e,0,Je-1.1,r);let i=new t.Color(e%6==0?_.warmAccent:_.arch);D.setColorAt(e*2,i),D.setColorAt(e*2+1,i),ut.setColorAt(e,i)}Qe.instanceMatrix.needsUpdate=!0,tt.instanceMatrix.needsUpdate=!0,at.instanceMatrix.needsUpdate=!0,ot.instanceMatrix.needsUpdate=!0,D.instanceMatrix.needsUpdate=!0,ut.instanceMatrix.needsUpdate=!0,D.instanceColor.needsUpdate=!0,ut.instanceColor.needsUpdate=!0}ht(),Qe.instanceMatrix.setUsage(t.StaticDrawUsage),tt.instanceMatrix.setUsage(t.StaticDrawUsage),at.instanceMatrix.setUsage(t.StaticDrawUsage),ot.instanceMatrix.setUsage(t.StaticDrawUsage),D.instanceMatrix.setUsage(t.StaticDrawUsage),ut.instanceMatrix.setUsage(t.StaticDrawUsage);function gt(){let e=new t.Shape;e.moveTo(.52,0),e.quadraticCurveTo(.42,.1,.2,.13),e.lineTo(.06,.15),e.lineTo(-.12,.42),e.lineTo(-.26,.44),e.lineTo(-.2,.15),e.lineTo(-.34,.13),e.lineTo(-.46,.2),e.lineTo(-.4,.06),e.lineTo(-.4,-.06),e.lineTo(-.46,-.2),e.lineTo(-.34,-.13),e.lineTo(-.2,-.15),e.lineTo(-.26,-.44),e.lineTo(-.12,-.42),e.lineTo(.06,-.15),e.lineTo(.2,-.13),e.quadraticCurveTo(.42,-.1,.52,0);let n=new t.ExtrudeGeometry(e,{depth:.09,bevelEnabled:!0,bevelThickness:.035,bevelSize:.03,bevelSegments:2,curveSegments:8});return n.rotateX(-Math.PI/2),n.rotateY(Math.PI/2),n.center(),n}function _t(){let e=new t.Group,n=2.3,r=new t.Mesh(gt(),S({color:_.hull,emissive:_.hullEmissive,emissiveIntensity:.55,roughness:.3,metalness:.6}));r.scale.setScalar(n),e.add(r);let i=new t.Mesh(new t.BoxGeometry(n*.05,.012,n*.66),S({color:_.stripe,emissive:_.stripe,emissiveIntensity:.45,roughness:.4,metalness:.3}));i.position.set(0,n*.055,-2.3*.02),e.add(i);let a=new t.Mesh(new t.SphereGeometry(n*.13,14,10),S({color:_.glass,emissive:_.glassEmissive,emissiveIntensity:.5,roughness:.15,metalness:.7}));a.scale.set(1,.62,1.7),a.position.set(0,n*.06,-2.3*.18),e.add(a);let o=[];for(let r of[-1,1]){let i=new t.Mesh(new t.CylinderGeometry(n*.055,n*.075,n*.3,10),S({color:_.nacelle,emissive:_.warmAccent,emissiveIntensity:.2,roughness:.35,metalness:.6}));i.rotation.x=Math.PI/2,i.position.set(r*n*.19,n*.02,n*.28),e.add(i);let a=new t.Mesh(new t.ConeGeometry(n*.055,n*.3,8),new t.MeshBasicMaterial({color:_.thrust,transparent:!0,opacity:.85,blending:t.AdditiveBlending,depthWrite:!1}));a.rotation.x=Math.PI/2,a.position.set(r*n*.19,n*.02,n*.68),e.add(a),o.push(a)}let s=new t.Mesh(new t.CircleGeometry(n*.55,20),new t.MeshBasicMaterial({color:_.coolAccent,transparent:!0,opacity:.2,blending:t.AdditiveBlending,depthWrite:!1}));s.rotation.x=-Math.PI/2,s.position.y=-2.3*.09,e.add(s);let c=new t.Mesh(new t.SphereGeometry(.22,8,8),S({color:_.coolAccent,emissive:_.coolAccent,emissiveIntensity:2.8,transparent:!0,opacity:.85}));c.position.set(0,n*.02,n*.42),e.add(c);let l=new t.Mesh(new t.ConeGeometry(.2,1,8),S({color:_.coolAccent,emissive:_.coolAccent,emissiveIntensity:2.4,transparent:!0,opacity:.45}));return l.rotation.x=-Math.PI/2,l.position.set(0,n*.02,n*.72),e.add(l),e.userData.cockpit=a,e.userData.glow=c,e.userData.thrusters=o,e}let k=.3,A=_t();A.scale.setScalar(.68);let vt=A.userData.cockpit,yt=A.userData.glow,bt=A.userData.thrusters;A.position.set(0,k,6),A.frustumCulled=!1,A.traverse(e=>{e.frustumCulled=!1}),b.add(A);let xt=[],j=[],St=[S({color:10178377,emissive:4134677,roughness:.45,metalness:.45}),S({color:11692850,emissive:4596493,roughness:.45,metalness:.45}),S({color:7621479,emissive:2889511,roughness:.45,metalness:.45})],Ct=[new t.BoxGeometry(1.3,1.3,1.3),new t.OctahedronGeometry(.85),new t.TetrahedronGeometry(1),new t.IcosahedronGeometry(.75),new t.TorusGeometry(.65,.22,8,14)];function wt(){if(xt.length>0){let e=xt.pop();return e.group.visible=!0,e}let e=Math.floor(Math.random()*Ct.length),n=Math.floor(Math.random()*St.length),r=new t.Mesh(Ct[e],St[n]),i=S({color:St[n].color,emissive:St[n].color,emissiveIntensity:3,transparent:!0,opacity:.8}),a=new t.Mesh(new t.TorusGeometry(1,.04,4,20),i);a.name=`ring`;let o=new t.Group;return o.add(r),o.add(a),b.add(o),{group:o,mesh:r,ring:a}}function Tt(e){e.group.visible=!1,b.remove(e.group),xt.push(e)}for(let e=0;e<20;e++)Tt(wt());let Et=[],M=[],Dt=S({color:_.gem,emissive:13208112,emissiveIntensity:1.8,roughness:.1,metalness:.8});function Ot(){if(Et.length>0){let e=Et.pop();return e.visible=!0,b.add(e),e}let e=new t.Mesh(new t.OctahedronGeometry(.38),Dt);return b.add(e),e}function kt(e){e.visible=!1,b.remove(e),Et.push(e)}let At=o||De?{spark:40,gem:24}:{spark:56,gem:32},jt=new t.SphereGeometry(.12,4,4),Mt=new t.OctahedronGeometry(.06),N=[],Nt={spark:[],gem:[]};function Pt(e){let n=new t.Mesh(e===`gem`?Mt:jt,new t.MeshBasicMaterial({color:e===`gem`?_.gem:_.hazardBurst,transparent:!0,opacity:1,depthWrite:!1}));return n.visible=!1,n.frustumCulled=!1,b.add(n),n}for(let e=0;e<At.spark;e++)Nt.spark.push(Pt(`spark`));for(let e=0;e<At.gem;e++)Nt.gem.push(Pt(`gem`));function Ft(e){let t=Nt[e];if(t.length)return t.pop();for(let t=0;t<N.length;t++)if(N[t].kind===e){let e=N[t].mesh;return N.splice(t,1),e}return null}function It(e,t,n,r,i,a,o,s,c){let l=Ft(e);l&&(l.position.set(t,n,r),l.scale.setScalar(c),l.material.opacity=1,l.visible=!0,N.push({kind:e,mesh:l,vx:i,vy:a,vz:o,life:1,decay:s}))}function Lt(e,t,n){for(let r=0;r<18;r++){let r=Math.random()*Math.PI*2,i=Math.random()*Math.PI,a=Math.random()*.35+.1;It(`spark`,e,t,n,Math.sin(i)*Math.cos(r)*a,Math.sin(i)*Math.sin(r)*a,Math.cos(i)*a,.025+Math.random()*.02,.65+Math.random()*1.15)}}function Rt(e,t,n){for(let r=0;r<10;r++){let r=Math.random()*Math.PI*2;It(`gem`,e,t,n,Math.cos(r)*.18,.15+Math.random()*.1,Math.sin(r)*.18,.04,1)}}function zt(e){for(let t=N.length-1;t>=0;t--){let n=N[t];if(n.mesh.position.x+=n.vx*e,n.mesh.position.y+=n.vy*e,n.mesh.position.z+=n.vz*e,n.vy-=.008*e,n.life-=n.decay*e,n.life<=0){n.mesh.visible=!1,Nt[n.kind].push(n.mesh),N.splice(t,1);continue}n.mesh.material.opacity=Math.max(0,n.life),n.mesh.scale.setScalar(n.life)}}let P={};function Bt(e,t,n=700){let r=s(`#vr-popup`);r.textContent=e,r.style.color=t,r.style.opacity=`1`,r.style.transform=`translateX(-50%) scale(1)`,clearTimeout(P.popup),P.popup=setTimeout(()=>{r.style.opacity=`0`,r.style.transform=`translateX(-50%) scale(0.8)`},n)}function Vt(e,t=150){let n=s(`#${e}`);n.style.opacity=`1`;let r=`flash-${e}`;clearTimeout(P[r]),P[r]=setTimeout(()=>{n.style.opacity=`0`},t)}let Ht=7e3,Ut=new t.CylinderGeometry(.09,.09,1.5,6);Ut.rotateX(Math.PI/2);let Wt=new t.MeshBasicMaterial({color:_.thrust,transparent:!0,opacity:.9,blending:t.AdditiveBlending,depthWrite:!1}),Gt=[],F=[];for(let e=0;e<16;e++){let e=new t.Mesh(Ut,Wt);e.visible=!1,e.frustumCulled=!1,b.add(e),Gt.push(e)}let I=0,L=0,Kt=0;function qt(e){let t=Gt.pop();t&&(t.position.set(e,k,A.position.z-1.6),t.visible=!0,F.push(t))}function Jt(e){let t=F[e];t.visible=!1,F.splice(e,1),Gt.push(t)}function Yt(){for(let e=F.length-1;e>=0;e--)Jt(e)}function Xt(e){let t=Math.round(e===`firing`?L/Ht*100:I/8*100);t!==z.power&&(R.powerFill.style.width=`${t}%`,z.power=t),e!==z.powerState&&(R.power.classList.toggle(`vr-ready`,e===`ready`),R.power.classList.toggle(`vr-firing`,e===`firing`),R.powerLabel.textContent=e===`firing`?`FIRING`:e===`ready`?o?`TAP TO FIRE`:`SPACE TO FIRE`:`PULSE`,z.powerState=e)}function Zt(){V===`playing`&&(L>0||I<8||(L=Ht,Kt=0,Xt(`firing`),Bt(`PULSE CANNON`,_.cssGold,900),ue()))}let R={score:s(`#vr-scorehud`),level:s(`#vr-levelhud`),speedFill:s(`#vr-speedfill`),speedLines:s(`#vr-speedlines`),warnFlash:s(`#vr-warningflash`),combo:s(`#vr-combodisplay`),comboText:s(`#vr-combotext`),power:s(`#vr-power`),powerFill:s(`#vr-powerfill`),powerLabel:s(`#vr-powerlabel`)},z={speedPct:-1,score:-1,lines:-1,warn:-1,power:-1,powerState:``},B=[-3.2,0,3.2],V=`menu`,H=0,U=parseInt(localStorage.getItem(`vrBest`)||`0`,10),Qt=3,W=1,$t=0,G=0,en=.32,tn=.85,nn=0,K=0,rn=0,q=!0,J=!0,an=.7,Y=.8,on=localStorage.getItem(`vrName`)||`PILOT`;function sn(){try{return JSON.parse(localStorage.getItem(`vrScores`)||`[]`)}catch{return[]}}function cn(e,t,n,r){let i=sn();i.push({name:e.toUpperCase().slice(0,10),score:t,level:n,gems:r,date:new Date().toLocaleDateString()}),i.sort((e,t)=>t.score-e.score),i.splice(5),localStorage.setItem(`vrScores`,JSON.stringify(i))}function ln(){window.confirm(`Clear all high scores?`)&&(localStorage.removeItem(`vrScores`),un(),se())}function un(){let e=sn(),t=s(`#vr-hstable`);if(!e.length){t.innerHTML=`<div class="vr-hs-empty">NO SCORES YET<br>BE THE FIRST PILOT!</div>`;return}let n=[`vr-gold-rank`,`vr-silver`,`vr-bronze`,`vr-other`,`vr-other`],r=[`1ST`,`2ND`,`3RD`,`4TH`,`5TH`];t.innerHTML=e.map((e,t)=>`
      <div class="vr-hs-row">
        <div class="vr-hs-rank ${n[t]}">${r[t]}</div>
        <div class="vr-hs-name">${e.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px">LV${e.level}</div>
        <div class="vr-hs-score">${e.score}</div>
      </div>`).join(``)}let dn=[`vr-menuscreen`,`vr-highscorescreen`,`vr-settingsscreen`,`vr-howscreen`,`vr-countdownscreen`,`vr-pausescreen`,`vr-gameoverscreen`];function X(e){se(),dn.forEach(e=>{let t=s(`#${e}`);t&&(t.style.display=`none`)});let t=s(`#${e}`);t&&(t.style.display=`flex`),e===`vr-highscorescreen`&&un(),e===`vr-settingsscreen`&&(s(`#vr-nameinput`).value=on,s(`#vr-musicvol`).value=Math.round(an*100),s(`#vr-sfxvol`).value=Math.round(Y*100),s(`#vr-musictoggle`).textContent=q?`ON`:`OFF`,s(`#vr-musictoggle`).className=`vr-toggle-btn `+(q?`vr-on`:`vr-off`),s(`#vr-sfxtoggle`).textContent=J?`ON`:`OFF`,s(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(J?`vr-on`:`vr-off`))}function fn(){on=s(`#vr-nameinput`).value||`PILOT`,localStorage.setItem(`vrName`,on)}function pn(e){an=e/100,p&&p.gain.setTargetAtTime(an*.55,u.currentTime,.1)}function mn(e){Y=e/100}function hn(){q=!q,s(`#vr-musictoggle`).textContent=q?`ON`:`OFF`,s(`#vr-musictoggle`).className=`vr-toggle-btn `+(q?`vr-on`:`vr-off`),q?V===`playing`&&(ee(),Te()):g()}function gn(){J=!J,s(`#vr-sfxtoggle`).textContent=J?`ON`:`OFF`,s(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(J?`vr-on`:`vr-off`)}function _n(){se(),n?.()}let vn=!1,yn=0,Z=0,Q=0,bn=0,$=0,xn=0,Sn=0,Cn=0,wn=1,Tn=0,En=1,Dn={left:!1,right:!1};s(`#vr-besthud`).textContent=U,s(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${U}`,U>0&&(s(`#vr-menubest`).style.opacity=`1`);function On(e){if((e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Dn.left=!0),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Dn.right=!0),(e.key===`p`||e.key===`P`||e.key===`Escape`)&&(V===`playing`||V===`paused`)&&dr(),e.key===` `&&V===`playing`){e.preventDefault(),Zt();return}(e.key===` `||e.key===`Enter`)&&(V===`gameover`||V===`menu`)&&(e.preventDefault(),lr())}function kn(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Dn.left=!1),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Dn.right=!1)}document.addEventListener(`keydown`,On),document.addEventListener(`keyup`,kn);let An=1,jn=!1,Mn=Array.from(e.querySelectorAll(`.vr-lane-dot`));function Nn(){Mn.forEach((e,t)=>e.classList.toggle(`vr-active`,t===An))}function Pn(e){if(jn)return;let t=An+(e===`left`?-1:1);t<0||t>=B.length||(An=t,nn=B[An],Nn(),jn=!0,J&&u&&f(e===`left`?300:340,`sine`,.04,.03*Y),In(e))}let Fn={};function In(e){let t=s(e===`left`?`#vr-btnleft`:`#vr-btnright`);t&&(t.classList.add(`vr-pressed`),clearTimeout(Fn[e]),Fn[e]=setTimeout(()=>t.classList.remove(`vr-pressed`),140))}let Ln=()=>Math.max(44,(c.clientWidth||window.innerWidth)*.07),Rn=null,zn=0,Bn=0,Vn=!1,Hn=0,Un=0,Wn=0,Gn=!1;function Kn(){Gn||(Gn=!0,s(`#vr-swipehint`)?.classList.add(`vr-faded`))}function qn(e){if(ee(),V===`playing`&&Rn===null){Rn=e.pointerId,zn=e.clientX,Bn=e.clientY,Hn=e.clientX,Un=e.clientY,Wn=performance.now(),Vn=!1;try{c.setPointerCapture(e.pointerId)}catch{}}}function Jn(e){if(e.pointerId!==Rn||V!==`playing`)return;let t=e.clientX-zn,n=Ln();Math.abs(t)<n||Math.abs(e.clientY-Bn)>Math.abs(t)*1.2||(Pn(t<0?`left`:`right`),Vn=!0,Kn(),zn=e.clientX,Bn=e.clientY)}function Yn(e){if(e.pointerId!==Rn)return;try{c.releasePointerCapture(e.pointerId)}catch{}if(Rn=null,e.type!==`pointerup`)return;let t=Math.hypot(e.clientX-Hn,e.clientY-Un);!Vn&&t<16&&performance.now()-Wn<320&&Zt()}c.addEventListener(`pointerdown`,qn),c.addEventListener(`pointermove`,Jn),c.addEventListener(`pointerup`,Yn),c.addEventListener(`pointercancel`,Yn);function Xn(e=Math.floor(Math.random()*B.length),n=-90){let r=wt(),i=B[e],a=k+(Math.random()-.5)*.8;r.group.position.set(i,a,n),r.group.visible=!0,b.add(r.group),r.mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0),r.ring.rotation.x=Math.random(),r.rotSpd=new t.Vector3((Math.random()-.5)*.06,(Math.random()-.5)*.06,(Math.random()-.5)*.04),r.lane=e,r.warned=!1,j.push(r)}function Zn(e=Math.floor(Math.random()*B.length),t=-95){let n=Ot();n.position.set(B[e],k+(Math.random()-.5)*.7,t),n.rotation.set(0,0,0),M.push(n)}function Qn(){let e=Math.max(0,wn-1),t=Math.min(B.length-1,wn+1),n=e+Math.floor(Math.random()*(t-e+1));return wn=n,n}function $n(){let e=Qn(),t=[0,1,2].filter(t=>t!==e);Math.random()<.14+G*.46?(Xn(t[0]),Xn(t[1])):Xn(t[Math.floor(Math.random()*t.length)]),Math.random()<.76&&Zn(e,-94)}function er(){for(let e=1;e<=3;e++)s(`#vr-h${e}`).classList.toggle(`vr-dead`,e>Qt)}let tr=0,nr=null,rr=0,ir=0;function ar(t){if(V!==`playing`||t>=50||y<=.85||(rr+=t,ir++,ir<180))return;let n=rr/ir;rr=0,ir=0,!(n<=21)&&(y=Math.max(.85,y-.15),v.setPixelRatio(y),v.setSize(window.innerWidth,window.innerHeight),e.dataset.renderScale=y.toFixed(2))}function or(e){nr=requestAnimationFrame(or);let t=Math.min(Math.max(e-tr,0),50),n=t/16.667;if(tr=e,$+=n/60,ar(t),Ue.rotation.y+=8e-5*n,Oe||(We.rotation.y=Math.sin($*.08)*.035,qe.rotation.z+=15e-5*n),V===`playing`&&(Tn=(Tn+en*n)%5,E.position.z=Tn),V===`menu`||V===`gameover`){A.position.y=k+Math.sin($*1.2)*.12,A.rotation.y=Math.sin($*.4)*.18,x.position.x=Math.sin($*.2)*1.2,x.lookAt(0,.5,0),w.position.copy(A.position),zt(n),v.render(b,x);return}if(V===`paused`||V===`countdown`){v.render(b,x);return}xn+=n/60,Dn.left&&Pn(`left`),Dn.right&&Pn(`right`);let r=n/60,i=1-Math.exp(-16*r),a=K;K+=i*(nn-K),K=Math.max(-3.2,Math.min(3.2,K)),jn&&Math.abs(K-nn)<.12&&(jn=!1);let o=-((K-a)/r)*.01;rn+=(o-rn)*i*1.2,A.position.x=K,A.position.y=k+Math.sin($*2)*.04,A.rotation.z=Math.max(-.45,Math.min(.45,rn)),A.rotation.y=rn*.12,yt.material.emissiveIntensity=3.2+Math.sin($*25)*.8;for(let e=0;e<bt.length;e++){let t=bt[e];t.scale.z=.85+Math.sin($*22+e*1.7)*.22,t.material.opacity=.7+Math.sin($*19+e)*.15}if(w.position.copy(A.position),w.position.z+=1,vn){yn-=n;let e=.5+.5*Math.sin(yn*.4);vt.material.emissive.setHex(_.invincible),vt.material.emissiveIntensity=2+e*3,yt.material.emissive.setHex(_.invincible),yt.material.emissiveIntensity=4+e*4,w.color.setHex(_.invincible),w.intensity=4+e*3,yn<=0&&(vn=!1,vt.material.emissive.setHex(_.glassEmissive),vt.material.emissiveIntensity=.5,yt.material.emissive.setHex(_.coolAccent),yt.material.emissiveIntensity=4,w.color.setHex(_.coolAccent),w.intensity=3)}en=Math.min(tn,.32+xn*.006),G=(en-.32)/(tn-.32),H=Math.floor(xn*15+$t*8+Sn),W=Math.min(10,Math.floor(G*9)+1),W!==En&&(ae(),R.level.textContent=`LV ${W}`,En=W);let s=Math.round(G*100);s!==z.speedPct&&(R.speedFill.style.width=`${s}%`,z.speedPct=s),H!==z.score&&(R.score.textContent=H,z.score=H);let c=G>.5?Math.round((G-.5)*80)/100:0;c!==z.lines&&(R.speedLines.style.opacity=String(c),z.lines=c);let l=Math.sin($*.4);Ie.position.x=l*5.5;let u=.5+.5*Math.cos($*.3);Ie.color.setRGB(C.r+(Le.r-C.r)*u,C.g+(Le.g-C.g)*u,C.b+(Le.b-C.b)*u),Ie.intensity=2.2+Math.sin($*2)*.55,bn>0&&(bn-=n,bn<=0&&(Q=0,R.combo.style.opacity=`0`));let ee=Math.max(48,82-W*3.2);Cn-=n,Cn<=0&&($n(),Cn=ee);let te=!1;for(let e=j.length-1;e>=0;e--){let t=j[e];if(t.group.position.z+=(en+.28)*n,t.mesh.rotation.x+=t.rotSpd.x*n,t.mesh.rotation.y+=t.rotSpd.y*n,t.ring.rotation.z+=.04*n,t.group.position.z>-30&&t.group.position.z<-8){let e=.4+Math.sin($*12)*.3;t.ring.material.emissiveIntensity=2+e*3,Math.abs(t.group.position.x-K)<1.5&&(te=!0)}else t.ring.material.emissiveIntensity=1;if(t.group.position.z>14){Tt(t),j.splice(e,1);continue}if(!vn&&t.group.position.z>4&&t.group.position.z<9){let n=Math.abs(t.group.position.x-A.position.x),r=Math.abs(t.group.position.y-A.position.y);if(n<.78&&r<.72){if(Lt(t.group.position.x,t.group.position.y,t.group.position.z),Tt(t),j.splice(e,1),Qt--,er(),oe(),Vt(`vr-hitflash`,200),Z=20,Q=0,R.combo.style.opacity=`0`,vn=!0,yn=100,Qt<=0){ur();return}continue}n<1.8&&r<1.8&&!t.warned&&(t.warned=!0,ne(),Q++,bn=120,Q>=2&&(R.comboText.textContent=`COMBO x${Q}`,R.combo.style.opacity=`1`,Sn+=Q*5))}}let d=te?Math.round((.4+Math.sin($*15)*.3)*20)/20:0;d!==z.warn&&(R.warnFlash.style.opacity=String(d),z.warn=d);let f=1e3/60*n;L>0&&(L=Math.max(0,L-f),Kt-=f,Kt<=0&&(Kt=130,qt(K),ce()),Xt(L>0?`firing`:`idle`),L===0&&(I=0));for(let e=F.length-1;e>=0;e--){let t=F[e],r=t.position.z;if(t.position.z-=1.15*n,t.position.z<-96){Jt(e);continue}let i=!1;for(let e=j.length-1;e>=0;e--){let n=j[e],a=n.group.position.z;if(!(a>r+1.1||a<t.position.z-1.1)&&!(Math.abs(n.group.position.x-t.position.x)>1.25)){Lt(n.group.position.x,n.group.position.y,n.group.position.z),Tt(n),j.splice(e,1),Sn+=20,le(),i=!0;break}}i&&Jt(e)}for(let e=M.length-1;e>=0;e--){let t=M[e];if(t.position.z+=(en+.15)*n,t.rotation.y+=.06*n,t.rotation.x+=.04*n,t.position.z>14){kt(t),M.splice(e,1);continue}if(t.position.z>4&&t.position.z<9){let n=Math.abs(t.position.x-A.position.x),r=Math.abs(t.position.y-A.position.y);if(n<.9&&r<.86){re(),Rt(t.position.x,t.position.y,t.position.z),Vt(`vr-gemflash`,120),$t++,L===0&&I<8&&(I++,Xt(I>=8?`ready`:`idle`),I===8&&(ue(),Bt(`PULSE READY`,_.cssGold,900)));let n=25*Math.max(1,Math.floor(Q/2)+1);Sn+=n,Bt(`+${n}`,_.cssGold,600),kt(t),M.splice(e,1)}}}zt(n);let ie=K*.45;x.position.x+=(ie-x.position.x)*.08*n,x.position.y+=(2.8-x.position.y)*.04*n,Z>0&&(x.position.x+=Math.sin($*60)*(Z*.018),x.position.y+=Math.cos($*55)*(Z*.012),Z-=n*1.8,Z<0&&(Z=0)),x.position.z=9,x.lookAt(K*.5,.8,0),we(G),v.render(b,x)}function sr(){j.forEach(e=>Tt(e)),j.length=0,M.forEach(e=>kt(e)),M.length=0,Yt(),N.forEach(e=>{e.mesh.visible=!1,Nt[e.kind].push(e.mesh)}),N.length=0}let cr=null;function lr(){ee(),se(),[`vr-menuscreen`,`vr-gameoverscreen`,`vr-pausescreen`].forEach(e=>{s(`#${e}`).style.display=`none`}),s(`#vr-countdownscreen`).style.display=`flex`,s(`#vr-hud`).style.display=`none`,s(`#vr-speedbar`).style.display=`none`,s(`#vr-power`).style.display=`none`,s(`#vr-pausebtn`).style.display=`none`,s(`#vr-thumbcontrols`).style.display=`none`,s(`#vr-laneindicator`).style.display=`none`,sr(),H=0,Qt=3,$t=0,W=1,En=1,I=0,L=0,Kt=0,z.power=-1,z.powerState=``,Xt(`idle`),s(`#vr-levelhud`).textContent=`LV 1`,xn=0,Sn=0,en=.32,G=0,Tn=0,E.position.z=0,nn=0,K=0,rn=0,An=1,jn=!1,Nn(),vn=!1,A.visible=!0,Q=0,bn=0,Z=0,Cn=82,wn=1,er(),R.combo.style.opacity=`0`,s(`#vr-warningflash`).style.opacity=`0`,s(`#vr-speedlines`).style.opacity=`0`,V=`countdown`;let e=3,t=s(`#vr-countdownnum`);function n(){t.textContent=e>0?String(e):`GO!`,t.style.animation=`none`,t.offsetHeight,t.style.animation=`vrCountPulse 0.9s ease-out`,e>0?f(440,`square`,.1,.1):f(880,`square`,.15,.15),e--,cr=setTimeout(e>=0?n:()=>{s(`#vr-countdownscreen`).style.display=`none`,s(`#vr-hud`).style.display=`flex`,s(`#vr-speedbar`).style.display=`flex`,s(`#vr-power`).style.display=`flex`,s(`#vr-pausebtn`).style.display=`flex`,s(`#vr-laneindicator`).style.display=`flex`,o&&(s(`#vr-thumbcontrols`).style.display=`block`,Gn=!1,s(`#vr-swipehint`)?.classList.remove(`vr-faded`)),V=`playing`,Ce(),Te()},950)}n()}function ur(){V=`gameover`,ie(),Ee(),g(),Lt(A.position.x,A.position.y,A.position.z),Lt(A.position.x,A.position.y,A.position.z),A.visible=!1,Z=35;let e=H>U;e&&(U=H,localStorage.setItem(`vrBest`,String(U)),s(`#vr-besthud`).textContent=U,s(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${U}`),cn(on,H,W,$t),s(`#vr-goscore`).textContent=H,s(`#vr-golevel`).textContent=W,s(`#vr-gogems`).textContent=$t,s(`#vr-gobest`).textContent=U,s(`#vr-newbestbadge`).style.display=e?`block`:`none`,P.gameover=setTimeout(()=>{s(`#vr-thumbcontrols`).style.display=`none`,s(`#vr-laneindicator`).style.display=`none`,s(`#vr-pausebtn`).style.display=`none`,s(`#vr-hud`).style.display=`none`,s(`#vr-speedbar`).style.display=`none`,s(`#vr-power`).style.display=`none`,s(`#vr-gameoverscreen`).style.display=`flex`},600)}function dr(){V===`playing`?(V=`paused`,se(),Ee(),g(),s(`#vr-pausescreen`).style.display=`flex`,s(`#vr-pausebtn`).textContent=`▶`):V===`paused`&&(V=`playing`,se(),ee(),Ce(),Te(),s(`#vr-pausescreen`).style.display=`none`,s(`#vr-pausebtn`).textContent=`⏸️`)}function fr(){V=`menu`,Ee(),g(),sr(),A.visible=!0,s(`#vr-hud`).style.display=`none`,s(`#vr-speedbar`).style.display=`none`,s(`#vr-power`).style.display=`none`,s(`#vr-pausebtn`).style.display=`none`,s(`#vr-thumbcontrols`).style.display=`none`,s(`#vr-laneindicator`).style.display=`none`,s(`#vr-warningflash`).style.opacity=`0`,s(`#vr-speedlines`).style.opacity=`0`,s(`#vr-menubest`).style.opacity=U>0?`1`:`0`,s(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${U}`,X(`vr-menuscreen`)}let pr=[[`#vr-btnplay`,`click`,lr],[`#vr-btnscores`,`click`,()=>X(`vr-highscorescreen`)],[`#vr-btnsettings`,`click`,()=>X(`vr-settingsscreen`)],[`#vr-btnhow`,`click`,()=>X(`vr-howscreen`)],[`#vr-btnexit`,`click`,_n],[`#vr-btnclearscores`,`click`,ln],[`#vr-btnhsback`,`click`,()=>X(`vr-menuscreen`)],[`#vr-btnsetback`,`click`,()=>X(`vr-menuscreen`)],[`#vr-btnhowback`,`click`,()=>X(`vr-menuscreen`)],[`#vr-btnresume`,`click`,dr],[`#vr-btnpausesettings`,`click`,()=>{X(`vr-settingsscreen`),V=`menu`}],[`#vr-btnpausemenu`,`click`,fr],[`#vr-btnagain`,`click`,lr],[`#vr-btngoscores`,`click`,()=>X(`vr-highscorescreen`)],[`#vr-btngomenu`,`click`,fr],[`#vr-pausebtn`,`click`,dr]];return pr.forEach(([e,t,n])=>s(e)?.addEventListener(t,n)),s(`#vr-nameinput`)?.addEventListener(`input`,fn),s(`#vr-musicvol`)?.addEventListener(`input`,e=>pn(e.target.value)),s(`#vr-sfxvol`)?.addEventListener(`input`,e=>mn(e.target.value)),s(`#vr-musictoggle`)?.addEventListener(`click`,hn),s(`#vr-sfxtoggle`)?.addEventListener(`click`,gn),tr=performance.now(),nr=requestAnimationFrame(or),{syncAppAudio(){d()?q&&Te():g()},dispose(){if(cancelAnimationFrame(nr),window.removeEventListener(`resize`,Ne),document.removeEventListener(`keydown`,On),document.removeEventListener(`keyup`,kn),c.removeEventListener(`pointerdown`,qn),c.removeEventListener(`pointermove`,Jn),c.removeEventListener(`pointerup`,Yn),c.removeEventListener(`pointercancel`,Yn),pr.forEach(([e,t,n])=>s(e)?.removeEventListener(t,n)),Object.values(P).forEach(e=>clearTimeout(e)),Object.values(Fn).forEach(e=>clearTimeout(e)),clearTimeout(fe),clearTimeout(cr),g(),Ee(),u)try{u.close()}catch{}b.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())}),v.dispose(),i(v)}}}function d({onBack:e}){let t=(0,a.useRef)(null),n=(0,a.useRef)(e);n.current=e;let{sfxEnabled:i,musicEnabled:s}=r(),c=(0,a.useRef)(null),d=(0,a.useRef)(i),f=(0,a.useRef)(s);return d.current=i,f.current=s,(0,a.useEffect)(()=>{let e=t.current;if(!e)return;let r=!1;return e.innerHTML=ee,l().then(t=>{r||!e.isConnected||(c.current=te(e,t,{onBack:()=>n.current?.(),isAppSfxOn:()=>d.current,isAppMusicOn:()=>f.current}))}).catch(()=>{r||(e.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffe6b0;font-family:sans-serif">Requires an internet connection to load Void Runner.</div>`)}),()=>{r=!0,c.current?.dispose(),c.current=null,e.innerHTML=``}},[]),(0,a.useEffect)(()=>{c.current?.syncAppAudio?.()},[i,s]),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(`style`,{children:u}),(0,o.jsx)(`div`,{className:`vr-root mode-void`,ref:t})]})}export{d as default};