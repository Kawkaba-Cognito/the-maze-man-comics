import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{N as t,T as n,w as r}from"./index-DoYDP8sS.js";import{r as i}from"./c3dViewport-D3K1ZAxX.js";var a=e(t()),o=n(),s=`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`,c=`sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==`;function l(){return window.THREE?Promise.resolve(window.THREE):new Promise((e,t)=>{let n=document.getElementById(`vr-three-cdn`);if(n){n.addEventListener(`load`,()=>e(window.THREE)),n.addEventListener(`error`,()=>t(Error(`three-cdn-failed`)));return}let r=document.createElement(`script`);r.id=`vr-three-cdn`,r.src=s,r.integrity=c,r.crossOrigin=`anonymous`,r.onload=()=>e(window.THREE),r.onerror=()=>{r.remove(),t(Error(`three-cdn-failed`))},document.head.appendChild(r)})}var u=`
.vr-root {
  --vr-pink:   #D95A3D;
  --vr-cyan:   #2E5EA8;
  --vr-purple: #5E9472;
  --vr-gold:   #E3A12B;
  --vr-dark-bg: #EFE9DD;
  position: fixed; inset: 0; z-index: 60;
  background: var(--vr-dark-bg);
  overflow: hidden;
  font-family: 'Inter', 'Cairo', system-ui, sans-serif;
  color: #1B1F24;
  touch-action: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.vr-root * { box-sizing: border-box; }

.vr-container { position:relative; width:100%; height:100%; }
.vr-root canvas { display:block; position:absolute; top:0; left:0; touch-action:none; }

.vr-scanlines { display:none; }
.vr-vignette { position:absolute; inset:0; pointer-events:none; z-index:4;
  background: radial-gradient(ellipse at center, transparent 62%, rgba(27,31,36,0.14) 100%); transition:opacity 0.3s; }
.vr-speedlines { position:absolute; inset:0; pointer-events:none; z-index:3; opacity:0; transition:opacity 0.3s;
  background: radial-gradient(ellipse at center, transparent 42%, rgba(46,94,168,0.06) 70%, rgba(217,90,61,0.12) 100%); }

.vr-hud { position:absolute; top:0; left:0; right:0; display:flex; justify-content:space-between; align-items:flex-start;
  padding:calc(14px + env(safe-area-inset-top)) 18px 14px; pointer-events:none; z-index:10; }
.vr-hud-block,
.vr-liveshud { min-width:86px; min-height:54px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;
  padding:8px 14px; background:linear-gradient(180deg,#FCFBF8 0%,#F1ECE2 100%); border:1.5px solid rgba(255,255,255,0.92); border-radius:18px;
  box-shadow:0 8px 18px rgba(27,31,36,0.12), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -3px 5px rgba(176,165,146,0.22); }
.vr-hud-label { font-size:9px; font-weight:800; letter-spacing:2px; color:#5C6066; text-transform:uppercase; }
.vr-hud-val { font-family:'Archivo Black', 'Cairo', system-ui, sans-serif; font-size:20px; font-weight:400; color:#1B1F24; }
.vr-liveshud { flex-direction:row; gap:6px; color:#D95A3D; }
.vr-heart { font-size:19px; transition:transform 0.2s, opacity 0.2s; filter:drop-shadow(0 2px 2px rgba(217,90,61,0.22)); }
.vr-heart.vr-dead { opacity:0.22; transform:scale(0.7); filter:none; }

.vr-speedbar { position:absolute; top:calc(74px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:none; z-index:10; }
.vr-speedlabel { font-size:9px; font-weight:800; letter-spacing:2px; color:#2F4A6D; }
.vr-levellabel { color:#D95A3D; margin-inline-start:6px; }
.vr-speedtrack { width:128px; height:7px; background:rgba(27,31,36,0.12); border-radius:999px; overflow:hidden; box-shadow:inset 0 2px 3px rgba(0,0,0,0.14); }
.vr-speedfill { height:100%; width:0%; background:linear-gradient(90deg,#2E5EA8,#5E9472,#E3A12B);
  border-radius:999px; transition:width 0.3s; }

.vr-power { position:absolute; top:calc(98px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  display:none; flex-direction:column; align-items:center; gap:4px; pointer-events:none; z-index:10; }
.vr-power-label { font-size:9px; font-weight:800; letter-spacing:2px; color:#B37714; text-transform:uppercase; }
.vr-power-track { width:128px; height:7px; background:rgba(27,31,36,0.12); border-radius:999px; overflow:hidden; box-shadow:inset 0 2px 3px rgba(0,0,0,0.14); }
.vr-power-fill { height:100%; width:0%; background:linear-gradient(90deg,#E3A12B,#D95A3D); border-radius:999px; transition:width 0.25s; }
.vr-power.vr-ready .vr-power-label { color:#D95A3D; animation:vrPowerReady 0.9s ease-in-out infinite; }
@keyframes vrPowerReady { 0%,100%{ opacity:0.65; } 50%{ opacity:1; } }
.vr-power.vr-firing .vr-power-label { color:#2E5EA8; }
.vr-power.vr-firing .vr-power-fill { background:#2E5EA8; transition:width 0.1s linear; }

.vr-combodisplay { position:absolute; top:calc(128px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  pointer-events:none; z-index:10; text-align:center; opacity:0; transition:opacity 0.25s; }
.vr-combotext { font-family:'Archivo Black',system-ui,sans-serif; font-size:20px; color:#D95A3D;
  background:#FAF8F4; padding:4px 14px; border-radius:999px; box-shadow:0 6px 16px rgba(27,31,36,0.15); letter-spacing:1.5px; }

.vr-popup { position:absolute; left:50%; top:calc(152px + env(safe-area-inset-top)); transform:translateX(-50%); pointer-events:none; z-index:15; text-align:center;
  font-family:'Archivo Black',system-ui,sans-serif; font-size:18px; letter-spacing:2px; opacity:0; text-shadow:0 2px 6px rgba(255,255,255,0.85); }

.vr-pausebtn { position:absolute; top:calc(20px + env(safe-area-inset-top)); left:calc(50% + 60px); transform:none;
  z-index:20; pointer-events:all; background:linear-gradient(180deg,#FCFBF8 0%,#EDE7DA 100%); border:1.5px solid rgba(255,255,255,0.92); border-radius:50%;
  width:42px; height:42px; color:#1B1F24; font-size:14px; cursor:pointer; display:none;
  align-items:center; justify-content:center; box-shadow:0 6px 14px rgba(27,31,36,0.14), inset 0 -2px 4px rgba(0,0,0,0.1); }
.vr-pausebtn:hover { transform:translateY(-1px); }

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

.vr-root {
  font-family:'Inter','Cairo',system-ui,sans-serif;
  background-color: #EFE9DD;
  background-image: none;
}
.vr-scanlines { display:none; }
.vr-speedlines {
  background:radial-gradient(ellipse at center, transparent 42%, rgba(46,94,168,0.06) 72%, rgba(217,90,61,0.12) 100%);
}
#vr-menuscreen,
#vr-pausescreen,
#vr-gameoverscreen,
.vr-sub-screen {
  background: radial-gradient(circle at 50% 24%, rgba(255,253,248,0.72), rgba(239,233,221,0.88));
  backdrop-filter: blur(8px);
}
.vr-game-logo {
  font-family:'Archivo Black', 'Cairo', system-ui, sans-serif;
  font-size:clamp(38px,8.4vw,60px);
  font-weight:400;
  letter-spacing:0.04em;
  color:#1B1F24;
  text-shadow:0 4px 0 rgba(255,255,255,0.85), 0 10px 24px rgba(47,74,109,0.18);
}
.vr-sub-title,
.vr-go-title,
#vr-pausescreen h2 {
  font-family:'Archivo Black', 'Cairo', system-ui, sans-serif;
  font-weight:400;
  letter-spacing:0.04em;
  color:#1B1F24;
  text-shadow:none;
}
.vr-tagline,
.vr-hud-label,
.vr-speedlabel,
.vr-sub-title {
  color:#5C6066;
  text-shadow:none;
}
.vr-menu-eyebrow {
  background:#2E5EA8;
  color:#FAF8F4;
  padding:5px 14px;
  border-radius:999px;
  font-weight:800;
  box-shadow:0 6px 14px rgba(46,94,168,0.22), inset 0 2px 2px rgba(255,255,255,0.25);
}
.vr-menu-meta span {
  background:linear-gradient(180deg,#FCFBF8 0%,#EDE7DA 100%);
  border:1px solid rgba(255,255,255,0.92);
  color:#1B1F24;
  font-weight:700;
  box-shadow:0 4px 10px rgba(27,31,36,0.08);
}
.vr-best-badge {
  color:#D95A3D;
  font-weight:800;
  text-shadow:none;
}
.vr-hud-val,
.vr-stat-card .vr-sv,
.vr-hs-score,
.vr-setting-val {
  color:#1B1F24;
  text-shadow:none;
}
.vr-neon-btn {
  min-width:248px;
  padding:15px 32px;
  border:none;
  border-radius:999px;
  font-family:'Inter',system-ui,sans-serif;
  font-weight:800;
  letter-spacing:0.08em;
}
.vr-neon-btn-primary {
  color:#FAF8F4;
  background:linear-gradient(180deg,#3D70BF 0%,#2E5EA8 100%);
  box-shadow:0 8px 20px rgba(46,94,168,0.28), inset 0 2px 3px rgba(255,255,255,0.32), inset 0 -4px 6px rgba(15,34,64,0.36);
}
.vr-neon-btn-primary:hover {
  transform:translateY(-2px);
  box-shadow:0 12px 24px rgba(46,94,168,0.32), inset 0 2px 3px rgba(255,255,255,0.38), inset 0 -4px 6px rgba(15,34,64,0.36);
}
.vr-neon-btn-primary:active {
  transform:translateY(2px);
}
.vr-neon-btn-secondary {
  color:#1B1F24;
  background:linear-gradient(180deg,#FCFBF8 0%,#ECE6D9 100%);
  border:1.5px solid rgba(255,255,255,0.9);
  box-shadow:0 5px 12px rgba(27,31,36,0.09), inset 0 2px 2px rgba(255,255,255,0.9), inset 0 -3px 5px rgba(176,165,146,0.22);
}
.vr-neon-btn-secondary:hover {
  color:#2E5EA8;
  transform:translateY(-1px);
}
.vr-stat-card,
.vr-setting-row,
.vr-how-row,
.vr-hs-row {
  border-color:rgba(27,31,36,0.12);
}
.vr-stat-card {
  background:linear-gradient(180deg,#FCFBF8 0%,#EFE9DD 100%);
  border:1.5px solid rgba(255,255,255,0.92);
  border-radius:18px;
  box-shadow:0 8px 18px rgba(27,31,36,0.09), inset 0 2px 3px rgba(255,255,255,0.95), inset 0 -3px 5px rgba(176,165,146,0.18);
}
.vr-stat-card .vr-sl { color:#5C6066; font-weight:700; }
.vr-root input[type=text],
.vr-toggle-btn {
  color:#1B1F24;
  background:#FCFBF8;
  border:1.5px solid rgba(27,31,36,0.16);
  border-radius:12px;
}
.vr-toggle-btn.vr-on { background:#2E5EA8; color:#FAF8F4; border-color:#2E5EA8; }
.vr-toggle-btn.vr-off { background:#EFE9DD; color:#5C6066; }
.vr-root input[type=range] {
  background:rgba(46,94,168,0.22);
}
.vr-root input[type=range]::-webkit-slider-thumb {
  background:#2E5EA8;
  box-shadow:0 2px 6px rgba(46,94,168,0.35);
}
.vr-pausebtn {
  color:#1B1F24;
  background:linear-gradient(180deg,#FCFBF8 0%,#EDE7DA 100%);
  border:1.5px solid rgba(255,255,255,0.92);
  box-shadow:0 6px 14px rgba(27,31,36,0.14);
}
.vr-lane-indicator {
  background:rgba(250,248,244,0.88);
  border:1.5px solid rgba(255,255,255,0.92);
  box-shadow:0 6px 14px rgba(27,31,36,0.12);
}
.vr-lane-dot { background:rgba(47,74,109,0.22); border-color:transparent; }
.vr-lane-dot.vr-active { background:#D95A3D; border-color:#FAF8F4; box-shadow:0 0 0 2px rgba(217,90,61,0.28); }
.vr-countdownnum {
  font-family:'Archivo Black',system-ui,sans-serif;
  color:#2E5EA8;
  text-shadow:0 6px 0 rgba(255,255,255,0.9), 0 12px 26px rgba(46,94,168,0.24);
}
.vr-hint-row,
.vr-how-text,
.vr-setting-label,
.vr-hs-name {
  color:#4A5058;
}
.vr-swipe-word { color:#2F4A6D; font-weight:800; }
.vr-swipe-arrow { color:#D95A3D; }
.vr-how-key {
  background:#E3ECF7;
  border:1px solid rgba(46,94,168,0.28);
  color:#2E5EA8;
  border-radius:8px;
}
.vr-copy-strong { color:#1B1F24; font-weight:800; }
.vr-copy-gold { color:#B37714; font-weight:800; }
.vr-copy-bad { color:#D95A3D; font-weight:800; }
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
`,d=`
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
    <div class="vr-menu-eyebrow">Clay Studio &middot; Sky Flight</div>
    <div class="vr-game-logo">CLAY<br>PLANE</div>
    <div class="vr-tagline">Glide Through Sunlit Clay Canyons</div>
    <div class="vr-menu-meta"><span>3 Sky Lanes</span><span>Clay Star Burst</span><span>Endless</span></div>
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
    <h2 class="vr-go-title">FLIGHT OVER</h2>
    <p class="vr-go-sub">YOUR CLAY PLANE TOUCHED DOWN IN THE CANYON</p>
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
`;function ee(e,t,{onBack:n,isAppSfxOn:r,isAppMusicOn:a}){let o=typeof navigator<`u`&&(navigator.maxTouchPoints>0||`ontouchstart`in window),s=t=>e.querySelector(t),c=s(`#vr-canvas`),l=window.AudioContext||window.webkitAudioContext,u=null;function d(){u||=new l,u.state===`suspended`&&u.resume()}let ee=()=>r?.()!==!1,f=()=>a?.()!==!1;function p(e,t,n,r,i=0){if(!u||!ee())return;let a=u.createOscillator(),o=u.createGain();a.connect(o),o.connect(u.destination),a.type=t,a.frequency.setValueAtTime(e,u.currentTime+i),o.gain.setValueAtTime(r,u.currentTime+i),o.gain.exponentialRampToValueAtTime(.001,u.currentTime+i+n),a.start(u.currentTime+i),a.stop(u.currentTime+i+n+.05)}function te(){if(!u)return;let e=u.createOscillator(),t=u.createGain();e.connect(t),t.connect(u.destination),e.type=`sawtooth`,e.frequency.setValueAtTime(800,u.currentTime),e.frequency.exponentialRampToValueAtTime(200,u.currentTime+.15),t.gain.setValueAtTime(.12,u.currentTime),t.gain.exponentialRampToValueAtTime(.001,u.currentTime+.15),e.start(),e.stop(u.currentTime+.2)}function ne(){[523,659,784,1047].forEach((e,t)=>p(e,`sine`,.12,.08,t*.05))}function re(){u&&[60,80,100,120].forEach(e=>{let t=u.createBuffer(1,u.sampleRate*.5,u.sampleRate),n=t.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=(Math.random()*2-1)*(1-e/n.length);let r=u.createBufferSource(),i=u.createGain(),a=u.createBiquadFilter();r.buffer=t,a.type=`lowpass`,a.frequency.value=e*30,r.connect(a),a.connect(i),i.connect(u.destination),i.gain.setValueAtTime(.3,u.currentTime),i.gain.exponentialRampToValueAtTime(.001,u.currentTime+.6),r.start()})}function ie(){[400,500,600,800,1e3].forEach((e,t)=>p(e,`square`,.1,.06,t*.08))}function ae(){p(120,`sawtooth`,.3,.15),p(80,`square`,.4,.1,.05)}function m(){J&&u&&p(440,`sine`,.08,.06*Y)}function oe(){J&&p(880,`square`,.05,.035*Y)}function se(){J&&(p(220,`sawtooth`,.1,.07*Y),p(140,`square`,.12,.05*Y,.02))}function ce(){J&&[660,880,1320].forEach((e,t)=>p(e,`triangle`,.12,.07*Y,t*.06))}let le=!1,ue=null,h=null,de=[[220,261.63,329.63],[174.61,220,261.63],[130.81,164.81,196],[196,246.94,293.66]],fe=[[440,523,659,523,440,392,440,523],[349,440,523,440,349,330,349,440],[262,330,392,330,262,247,262,330],[392,494,587,494,392,370,392,494]],pe=60/128,me=pe*4;function he(e,t){let n=e.createOscillator(),r=e.createGain();n.connect(r),r.connect(h),n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(40,t+.08),r.gain.setValueAtTime(.55,t),r.gain.exponentialRampToValueAtTime(.001,t+.18),n.start(t),n.stop(t+.2)}function ge(e,t){let n=e.createBuffer(1,e.sampleRate*.12,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<r.length;e++)r[e]=Math.random()*2-1;let i=e.createBufferSource(),a=e.createBiquadFilter(),o=e.createGain();i.buffer=n,a.type=`bandpass`,a.frequency.value=2400,a.Q.value=.8,i.connect(a),a.connect(o),o.connect(h),o.gain.setValueAtTime(.22,t),o.gain.exponentialRampToValueAtTime(.001,t+.14),i.start(t)}function _e(e,t,n=!1){let r=e.createBuffer(1,e.sampleRate*(n?.18:.04),e.sampleRate),i=r.getChannelData(0);for(let e=0;e<i.length;e++)i[e]=Math.random()*2-1;let a=e.createBufferSource(),o=e.createBiquadFilter(),s=e.createGain();a.buffer=r,o.type=`highpass`,o.frequency.value=9e3,a.connect(o),o.connect(s),s.connect(h),s.gain.setValueAtTime(n?.1:.07,t),s.gain.exponentialRampToValueAtTime(.001,t+(n?.18:.04)),a.start(t)}function ve(e,t,n,r){let i=e.createOscillator(),a=e.createGain(),o=e.createBiquadFilter();i.type=`sawtooth`,i.frequency.value=t/2,o.type=`lowpass`,o.frequency.value=600,o.Q.value=3,i.connect(o),o.connect(a),a.connect(h),a.gain.setValueAtTime(.18,n),a.gain.setValueAtTime(.14,n+r*.7),a.gain.exponentialRampToValueAtTime(.001,n+r),i.start(n),i.stop(n+r+.05)}function ye(e,t,n,r){let i=e.createOscillator(),a=e.createGain();i.type=`square`,i.frequency.value=t,i.connect(a),a.connect(h),a.gain.setValueAtTime(.06,n),a.gain.exponentialRampToValueAtTime(.001,n+r*.9),i.start(n),i.stop(n+r)}function be(e,t,n,r){t.forEach(t=>{let i=e.createOscillator(),a=e.createGain();i.type=`sine`,i.frequency.value=t,i.connect(a),a.connect(h),a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.04,n+.3),a.gain.setValueAtTime(.04,n+r-.3),a.gain.linearRampToValueAtTime(0,n+r),i.start(n),i.stop(n+r+.1)})}function xe(e,t,n){if(!le)return;let r=de[n%de.length],i=fe[n%fe.length];be(e,r,t,me),ve(e,r[0],t,me/2),ve(e,r[0],t+me/2,me/2);for(let n=0;n<4;n++){let r=t+n*pe;(n===0||n===2)&&he(e,r),(n===1||n===3)&&ge(e,r),_e(e,r,!1),_e(e,r+pe/2,n===1)}i.forEach((n,r)=>{ye(e,n,t+r*pe/2,pe/2*.85)}),ue=setTimeout(()=>{xe(e,t+me,n+1)},1775)}let g=null;function Se(){if(!u||g)return;let e=u.createOscillator(),t=u.createGain();e.type=`sawtooth`,e.frequency.value=60,t.gain.value=.018,e.connect(t),t.connect(u.destination),e.start(),g={osc1:e,gain:t}}function Ce(e){if(!g)return;let t=60+e*80;g.osc1.frequency.setTargetAtTime(t,u.currentTime,.4),g.gain.gain.setTargetAtTime(.018+e*.012,u.currentTime,.4)}function we(){u&&!le&&q&&f()&&(le=!0,h=u.createGain(),h.gain.value=an*.55,h.connect(u.destination),xe(u,u.currentTime+.05,0))}function Te(){le=!1,clearTimeout(ue),h&&(h.gain.setTargetAtTime(0,u.currentTime,.2),setTimeout(()=>{h=null},500))}function Ee(){g&&(g.gain.gain.setTargetAtTime(0,u.currentTime,.15),setTimeout(()=>{try{g.osc1.stop()}catch{}g=null},400))}let _={skyTop:`#C5DFEE`,skyMid:`#EBE7DD`,skyLow:`#E7D8C3`,fog:15394007,ambient:16775146,keyLight:16774364,warmAccent:14244413,coolAccent:3038888,floor:14800838,laneLine:10069426,arch:15723232,gem:14917931,hull:3038888,hullEmissive:1453652,stripe:16447214,glass:16447214,glassEmissive:5143736,nacelle:14244413,thrust:16447214,invincible:14917931,hazardBurst:14244413,cssGold:`#D95A3D`},De=Number.isFinite(navigator.hardwareConcurrency)&&navigator.hardwareConcurrency<=4,Oe=window.matchMedia?.(`(prefers-reduced-motion: reduce)`).matches??!1,v=new t.WebGLRenderer({canvas:c,antialias:!(o||De),powerPreference:`high-performance`}),ke=o||De?1:1.35,y=Math.min(window.devicePixelRatio||1,ke);v.setPixelRatio(y),e.dataset.renderScale=y.toFixed(2),v.shadowMap.enabled=!1,v.setSize(window.innerWidth,window.innerHeight);let b=new t.Scene;function Ae(){let e=document.createElement(`canvas`);e.width=2,e.height=256;let n=e.getContext(`2d`),r=n.createLinearGradient(0,0,0,256),i=`#${_.floor.toString(16).padStart(6,`0`)}`;return r.addColorStop(0,_.skyTop),r.addColorStop(.4,_.skyMid),r.addColorStop(.54,_.skyLow),r.addColorStop(.7,i),r.addColorStop(1,i),n.fillStyle=r,n.fillRect(0,0,2,256),new t.CanvasTexture(e)}b.background=Ae(),b.fog=new t.FogExp2(_.fog,.019);let x=new t.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.1,300);x.position.set(0,2.8,9),x.lookAt(0,.5,0);let je=x.position.z-6;function Me(){let e=x.aspect,t=2*Math.atan(11/(2*je)),n=2*Math.atan(Math.tan(t/2)/e)*(180/Math.PI);n=Math.max(70,Math.min(100,n)),x.fov=n,x.updateProjectionMatrix()}Me();function Ne(){x.aspect=window.innerWidth/window.innerHeight,Me(),v.setSize(window.innerWidth,window.innerHeight)}window.addEventListener(`resize`,Ne);function S(e){let n={roughness:.85,metalness:.04,...e};if(!o)return new t.MeshStandardMaterial(n);let{roughness:r,metalness:i,...a}=n;return new t.MeshLambertMaterial(a)}let Pe=new t.HemisphereLight(16776696,13812652,1.35);b.add(Pe);let Fe=new t.AmbientLight(_.ambient,1.05);b.add(Fe);let Ie=new t.DirectionalLight(_.keyLight,1.15);Ie.position.set(6,14,9),b.add(Ie);let Le=new t.PointLight(_.warmAccent,.9,28);Le.position.set(-6,3,2),b.add(Le);let C=new t.Color(_.warmAccent),Re=new t.Color(_.coolAccent),w=new t.PointLight(_.coolAccent,.75,10);b.add(w);let ze=new t.Group,Be=new t.MeshLambertMaterial({color:16447472}),Ve=new t.SphereGeometry(1,10,8),He=o||De?26:42;for(let e=0;e<He;e++){let e=(Math.random()-.5)*140,n=6+Math.random()*24,r=-Math.random()*220-12;for(let i=0;i<3;i++){let a=new t.Mesh(Ve,Be),o=1.6+Math.random()*2.2;a.scale.set(o*1.25,o*.72,o*.95),a.position.set(e+(i-1)*o*.95,n+(i===1?.55:0),r),ze.add(a)}}let Ue=ze;b.add(Ue);let We=new t.Group,Ge=new t.Mesh(new t.IcosahedronGeometry(10,1),new t.MeshBasicMaterial({color:11631183,transparent:!0,opacity:.34,fog:!1,depthWrite:!1}));Ge.position.set(-24,15,-128);let Ke=new t.Mesh(new t.IcosahedronGeometry(5.5,1),new t.MeshBasicMaterial({color:9418984,transparent:!0,opacity:.22,fog:!1,depthWrite:!1}));Ke.position.set(22,7,-102);let qe=new t.Mesh(new t.TorusGeometry(11.8,.14,5,48),new t.MeshBasicMaterial({color:_.warmAccent,transparent:!0,opacity:.36,fog:!1,depthWrite:!1}));qe.position.copy(Ge.position),qe.rotation.x=Math.PI*.32,We.add(Ge,Ke,qe),Ge.visible=!1,Ke.visible=!1,qe.visible=!1,b.add(We);let Je=6.5,T=o||De?20:26,Ye=new Float32Array(T);for(let e=0;e<T;e++)Ye[e]=-e*5;let E=new t.Group;b.add(E);let Xe=new t.PlaneGeometry(9,5,8,1);Xe.rotateX(-Math.PI/2);let Ze=S({color:_.floor,roughness:.92,metalness:.02,emissive:0}),Qe=new t.InstancedMesh(Xe,Ze,T);E.add(Qe);let $e=new t.BoxGeometry(.06,.03,5),et=new t.MeshLambertMaterial({color:_.laneLine,transparent:!0,opacity:.5}),tt=new t.InstancedMesh($e,et,T*9);E.add(tt);let nt=new t.BoxGeometry(.18,.14,5),rt=S({color:14244413}),it=S({color:6198386}),at=new t.InstancedMesh(nt,rt,T),ot=new t.InstancedMesh(nt,it,T);E.add(at,ot);let st=S({color:16777215,roughness:.85}),ct=new t.CylinderGeometry(.18,.22,Je,10),D=new t.InstancedMesh(ct,st,T*2);E.add(D);let lt=new t.BoxGeometry(9.35,.28,.28),ut=new t.InstancedMesh(lt,st,T);E.add(ut);let dt=new t.Matrix4,ft=new t.Vector3,pt=new t.Quaternion,mt=new t.Vector3(1,1,1);function O(e,t,n,r,i){ft.set(n,r,i),dt.compose(ft,pt,mt),e.setMatrixAt(t,dt)}function ht(){for(let e=0;e<T;e++){let n=Ye[e];O(Qe,e,0,-1.1,n);for(let t=0;t<9;t++)O(tt,e*9+t,t-4,-1.09,n);O(at,e,-9/2,-1.05,n),O(ot,e,9/2,-1.05,n);let r=n-5/2;O(D,e*2,-9/2,Je/2-1.1,r),O(D,e*2+1,9/2,Je/2-1.1,r),O(ut,e,0,5.4,r);let i=new t.Color(e%6==0?_.warmAccent:_.arch);D.setColorAt(e*2,i),D.setColorAt(e*2+1,i),ut.setColorAt(e,i)}Qe.instanceMatrix.needsUpdate=!0,tt.instanceMatrix.needsUpdate=!0,at.instanceMatrix.needsUpdate=!0,ot.instanceMatrix.needsUpdate=!0,D.instanceMatrix.needsUpdate=!0,ut.instanceMatrix.needsUpdate=!0,D.instanceColor.needsUpdate=!0,ut.instanceColor.needsUpdate=!0}ht(),Qe.instanceMatrix.setUsage(t.StaticDrawUsage),tt.instanceMatrix.setUsage(t.StaticDrawUsage),at.instanceMatrix.setUsage(t.StaticDrawUsage),ot.instanceMatrix.setUsage(t.StaticDrawUsage),D.instanceMatrix.setUsage(t.StaticDrawUsage),ut.instanceMatrix.setUsage(t.StaticDrawUsage);function gt(){let e=new t.Group,n=1.35,r=[new t.Vector2(.02,1.05),new t.Vector2(.28,.85),new t.Vector2(.36,.35),new t.Vector2(.33,-.35),new t.Vector2(.2,-.88),new t.Vector2(.08,-1.12)],i=new t.LatheGeometry(r,18);i.rotateX(Math.PI/2),i.rotateY(Math.PI);let a=new t.Mesh(i,S({color:_.hull,roughness:.82,metalness:.04}));a.scale.setScalar(n),e.add(a);let o=new t.Mesh(new t.SphereGeometry(.26*n,16,12),S({color:14244413,roughness:.8}));o.scale.set(1,1,1.25),o.position.set(0,0,-.96*n),e.add(o);let s=new t.Group;s.position.set(0,0,-1.26*n);let c=S({color:14917931,roughness:.74}),l=new t.Mesh(new t.SphereGeometry(.11*n,12,10),S({color:16447214}));s.add(l);let u=new t.Mesh(new t.BoxGeometry(.12*n,.92*n,.05*n),c),d=new t.Mesh(new t.BoxGeometry(.92*n,.12*n,.05*n),c);s.add(u,d),e.add(s);let ee=S({color:_.stripe,roughness:.84}),f=new t.Mesh(new t.BoxGeometry(2.55*n,.14*n,.68*n),ee);f.position.set(0,.06*n,-.14*n),e.add(f);let p=new t.Mesh(new t.BoxGeometry(2.35*n,.13*n,.56*n),ee);p.position.set(0,.62*n,-.22*n),e.add(p);let te=new t.Mesh(new t.BoxGeometry(.75*n,.15*n,.58*n),S({color:14244413,roughness:.82}));te.position.set(0,.625*n,-.22*n),e.add(te);let ne=new t.CylinderGeometry(.045*n,.045*n,.54*n,8),re=S({color:14917931});for(let r of[-.72*n,.72*n]){let i=new t.Mesh(ne,re);i.position.set(r,.34*n,-.18*n),e.add(i)}for(let r of[-1,1]){let i=new t.Mesh(new t.SphereGeometry(.17*n,12,10),S({color:14244413,roughness:.84}));i.scale.set(1.1,.55,1.9),i.position.set(r*1.28*n,.06*n,-.14*n),e.add(i)}let ie=new t.Mesh(new t.BoxGeometry(.95*n,.09*n,.36*n),S({color:6198386,roughness:.85}));ie.position.set(0,.08*n,.88*n),e.add(ie);let ae=new t.Mesh(new t.BoxGeometry(.1*n,.52*n,.4*n),S({color:14244413,roughness:.84}));ae.position.set(0,.32*n,.88*n),e.add(ae);let m=new t.Mesh(new t.SphereGeometry(.24*n,14,12),S({color:5143736,emissive:3038888,emissiveIntensity:.15,roughness:.35}));m.scale.set(.85,.75,1.35),m.position.set(0,.24*n,-.02*n),e.add(m);let oe=[];for(let r of[-1,1]){let i=new t.Mesh(new t.SphereGeometry(.11*n,8,8),new t.MeshBasicMaterial({color:16447472,transparent:!0,opacity:.65,depthWrite:!1}));i.scale.set(1,.85,1.8),i.position.set(r*.24*n,.02*n,1.18*n),e.add(i),oe.push(i)}let se=new t.Mesh(new t.CircleGeometry(1.15*n,20),new t.MeshBasicMaterial({color:11773326,transparent:!0,opacity:.38,depthWrite:!1}));se.rotation.x=-Math.PI/2,se.position.y=-.82*n,e.add(se);let ce=new t.Mesh(new t.SphereGeometry(.16*n,10,8),S({color:_.coolAccent,emissive:_.coolAccent,emissiveIntensity:.5,transparent:!0,opacity:.9}));return ce.position.set(0,.16*n,1.05*n),e.add(ce),e.userData.cockpit=m,e.userData.glow=ce,e.userData.thrusters=oe,e.userData.propeller=s,e}let _t=.36,k=gt();k.scale.setScalar(.72);let vt=k.userData.cockpit,yt=k.userData.glow,bt=k.userData.thrusters,A=k.userData.propeller;k.position.set(0,_t,6),k.frustumCulled=!1,k.traverse(e=>{e.frustumCulled=!1}),b.add(k);let xt=[],j=[],St=[S({color:14244413,roughness:.85,metalness:.04}),S({color:3038888,roughness:.85,metalness:.04}),S({color:9198206,roughness:.85,metalness:.04})],Ct=[new t.BoxGeometry(1.25,1.25,1.25),new t.CylinderGeometry(.62,.74,1.35,14),new t.SphereGeometry(.76,14,12),new t.IcosahedronGeometry(.75,1),new t.TorusGeometry(.62,.24,10,18)];function wt(){if(xt.length>0){let e=xt.pop();return e.group.visible=!0,e}let e=Math.floor(Math.random()*Ct.length),n=Math.floor(Math.random()*St.length),r=new t.Mesh(Ct[e],St[n]),i=S({color:St[n].color,emissive:St[n].color,emissiveIntensity:3,transparent:!0,opacity:.8}),a=new t.Mesh(new t.TorusGeometry(1,.04,4,20),i);a.name=`ring`;let o=new t.Group;return o.add(r),o.add(a),b.add(o),{group:o,mesh:r,ring:a}}function Tt(e){e.group.visible=!1,b.remove(e.group),xt.push(e)}for(let e=0;e<20;e++)Tt(wt());let Et=[],M=[],Dt=S({color:_.gem,emissive:13008144,emissiveIntensity:.35,roughness:.55,metalness:.08}),Ot=new t.CylinderGeometry(.42,.42,.14,16);Ot.rotateX(Math.PI/2);function kt(){if(Et.length>0){let e=Et.pop();return e.visible=!0,b.add(e),e}let e=new t.Mesh(Ot,Dt);return b.add(e),e}function At(e){e.visible=!1,b.remove(e),Et.push(e)}let jt=o||De?{spark:40,gem:24}:{spark:56,gem:32},Mt=new t.SphereGeometry(.12,4,4),Nt=new t.OctahedronGeometry(.06),N=[],Pt={spark:[],gem:[]};function Ft(e){let n=new t.Mesh(e===`gem`?Nt:Mt,new t.MeshBasicMaterial({color:e===`gem`?_.gem:_.hazardBurst,transparent:!0,opacity:1,depthWrite:!1}));return n.visible=!1,n.frustumCulled=!1,b.add(n),n}for(let e=0;e<jt.spark;e++)Pt.spark.push(Ft(`spark`));for(let e=0;e<jt.gem;e++)Pt.gem.push(Ft(`gem`));function It(e){let t=Pt[e];if(t.length)return t.pop();for(let t=0;t<N.length;t++)if(N[t].kind===e){let e=N[t].mesh;return N.splice(t,1),e}return null}function Lt(e,t,n,r,i,a,o,s,c){let l=It(e);l&&(l.position.set(t,n,r),l.scale.setScalar(c),l.material.opacity=1,l.visible=!0,N.push({kind:e,mesh:l,vx:i,vy:a,vz:o,life:1,decay:s}))}function Rt(e,t,n){for(let r=0;r<18;r++){let r=Math.random()*Math.PI*2,i=Math.random()*Math.PI,a=Math.random()*.35+.1;Lt(`spark`,e,t,n,Math.sin(i)*Math.cos(r)*a,Math.sin(i)*Math.sin(r)*a,Math.cos(i)*a,.025+Math.random()*.02,.65+Math.random()*1.15)}}function zt(e,t,n){for(let r=0;r<10;r++){let r=Math.random()*Math.PI*2;Lt(`gem`,e,t,n,Math.cos(r)*.18,.15+Math.random()*.1,Math.sin(r)*.18,.04,1)}}function Bt(e){for(let t=N.length-1;t>=0;t--){let n=N[t];n.mesh.position.x+=n.vx*e,n.mesh.position.y+=n.vy*e,n.mesh.position.z+=n.vz*e,n.vy-=.008*e,n.life-=n.decay*e,n.life<=0?(n.mesh.visible=!1,Pt[n.kind].push(n.mesh),N.splice(t,1)):(n.mesh.material.opacity=Math.max(0,n.life),n.mesh.scale.setScalar(n.life))}}let P={};function Vt(e,t,n=700){let r=s(`#vr-popup`);r.textContent=e,r.style.color=t,r.style.opacity=`1`,r.style.transform=`translateX(-50%) scale(1)`,clearTimeout(P.popup),P.popup=setTimeout(()=>{r.style.opacity=`0`,r.style.transform=`translateX(-50%) scale(0.8)`},n)}function Ht(e,t=150){let n=s(`#${e}`);n.style.opacity=`1`;let r=`flash-${e}`;clearTimeout(P[r]),P[r]=setTimeout(()=>{n.style.opacity=`0`},t)}let Ut=7e3,Wt=new t.SphereGeometry(.24,10,8),Gt=S({color:3038888,emissive:1983096,emissiveIntensity:.35}),Kt=[],F=[];for(let e=0;e<16;e++){let e=new t.Mesh(Wt,Gt);e.visible=!1,e.frustumCulled=!1,b.add(e),Kt.push(e)}let I=0,L=0,qt=0;function Jt(e){let t=Kt.pop();t&&(t.position.set(e,_t,k.position.z-1.6),t.visible=!0,F.push(t))}function Yt(e){let t=F[e];t.visible=!1,F.splice(e,1),Kt.push(t)}function Xt(){for(let e=F.length-1;e>=0;e--)Yt(e)}function Zt(e){let t=Math.round(e===`firing`?L/Ut*100:I/8*100);t!==z.power&&(R.powerFill.style.width=`${t}%`,z.power=t),e!==z.powerState&&(R.power.classList.toggle(`vr-ready`,e===`ready`),R.power.classList.toggle(`vr-firing`,e===`firing`),R.powerLabel.textContent=e===`firing`?`FIRING`:e===`ready`?o?`TAP TO FIRE`:`SPACE TO FIRE`:`PULSE`,z.powerState=e)}function Qt(){V===`playing`&&(L>0||I<8||(L=Ut,qt=0,Zt(`firing`),Vt(`PULSE CANNON`,_.cssGold,900),ce()))}let R={score:s(`#vr-scorehud`),level:s(`#vr-levelhud`),speedFill:s(`#vr-speedfill`),speedLines:s(`#vr-speedlines`),warnFlash:s(`#vr-warningflash`),combo:s(`#vr-combodisplay`),comboText:s(`#vr-combotext`),power:s(`#vr-power`),powerFill:s(`#vr-powerfill`),powerLabel:s(`#vr-powerlabel`)},z={speedPct:-1,score:-1,lines:-1,warn:-1,power:-1,powerState:``},B=[-3.2,0,3.2],V=`menu`,H=0,U=parseInt(localStorage.getItem(`vrBest`)||`0`,10),$t=3,W=1,en=0,G=0,tn=.32,nn=0,K=0,rn=0,q=!0,J=!0,an=.7,Y=.8,on=localStorage.getItem(`vrName`)||`PILOT`;function sn(){try{return JSON.parse(localStorage.getItem(`vrScores`)||`[]`)}catch{return[]}}function cn(e,t,n,r){let i=sn();i.push({name:e.toUpperCase().slice(0,10),score:t,level:n,gems:r,date:new Date().toLocaleDateString()}),i.sort((e,t)=>t.score-e.score),i.splice(5),localStorage.setItem(`vrScores`,JSON.stringify(i))}function ln(){window.confirm(`Clear all high scores?`)&&(localStorage.removeItem(`vrScores`),un(),m())}function un(){let e=sn(),t=s(`#vr-hstable`);if(!e.length){t.innerHTML=`<div class="vr-hs-empty">NO SCORES YET<br>BE THE FIRST PILOT!</div>`;return}let n=[`vr-gold-rank`,`vr-silver`,`vr-bronze`,`vr-other`,`vr-other`],r=[`1ST`,`2ND`,`3RD`,`4TH`,`5TH`];t.innerHTML=e.map((e,t)=>`
      <div class="vr-hs-row">
        <div class="vr-hs-rank ${n[t]}">${r[t]}</div>
        <div class="vr-hs-name">${e.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px">LV${e.level}</div>
        <div class="vr-hs-score">${e.score}</div>
      </div>`).join(``)}let dn=[`vr-menuscreen`,`vr-highscorescreen`,`vr-settingsscreen`,`vr-howscreen`,`vr-countdownscreen`,`vr-pausescreen`,`vr-gameoverscreen`];function X(e){m(),dn.forEach(e=>{let t=s(`#${e}`);t&&(t.style.display=`none`)});let t=s(`#${e}`);t&&(t.style.display=`flex`),e===`vr-highscorescreen`&&un(),e===`vr-settingsscreen`&&(s(`#vr-nameinput`).value=on,s(`#vr-musicvol`).value=Math.round(an*100),s(`#vr-sfxvol`).value=Math.round(Y*100),s(`#vr-musictoggle`).textContent=q?`ON`:`OFF`,s(`#vr-musictoggle`).className=`vr-toggle-btn `+(q?`vr-on`:`vr-off`),s(`#vr-sfxtoggle`).textContent=J?`ON`:`OFF`,s(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(J?`vr-on`:`vr-off`))}function fn(){on=s(`#vr-nameinput`).value||`PILOT`,localStorage.setItem(`vrName`,on)}function pn(e){an=e/100,h&&h.gain.setTargetAtTime(an*.55,u.currentTime,.1)}function mn(e){Y=e/100}function hn(){q=!q,s(`#vr-musictoggle`).textContent=q?`ON`:`OFF`,s(`#vr-musictoggle`).className=`vr-toggle-btn `+(q?`vr-on`:`vr-off`),q?V===`playing`&&(d(),we()):Te()}function gn(){J=!J,s(`#vr-sfxtoggle`).textContent=J?`ON`:`OFF`,s(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(J?`vr-on`:`vr-off`)}function _n(){m(),n?.()}let vn=!1,yn=0,Z=0,Q=0,bn=0,$=0,xn=0,Sn=0,Cn=0,wn=1,Tn=0,En=1,Dn={left:!1,right:!1};s(`#vr-besthud`).textContent=U,s(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${U}`,U>0&&(s(`#vr-menubest`).style.opacity=`1`);function On(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Dn.left=!0),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Dn.right=!0),e.key!==`p`&&e.key!==`P`&&e.key!==`Escape`||V!==`playing`&&V!==`paused`||dr(),e.key===` `&&V===`playing`?(e.preventDefault(),Qt()):e.key!==` `&&e.key!==`Enter`||V!==`gameover`&&V!==`menu`||(e.preventDefault(),lr())}function kn(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Dn.left=!1),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Dn.right=!1)}document.addEventListener(`keydown`,On),document.addEventListener(`keyup`,kn);let An=1,jn=!1,Mn=Array.from(e.querySelectorAll(`.vr-lane-dot`));function Nn(){Mn.forEach((e,t)=>e.classList.toggle(`vr-active`,t===An))}function Pn(e){if(jn)return;let t=An+(e===`left`?-1:1);t<0||t>=B.length||(An=t,nn=B[An],Nn(),jn=!0,J&&u&&p(e===`left`?300:340,`sine`,.04,.03*Y),In(e))}let Fn={};function In(e){let t=s(e===`left`?`#vr-btnleft`:`#vr-btnright`);t&&(t.classList.add(`vr-pressed`),clearTimeout(Fn[e]),Fn[e]=setTimeout(()=>t.classList.remove(`vr-pressed`),140))}let Ln=()=>Math.max(44,(c.clientWidth||window.innerWidth)*.07),Rn=null,zn=0,Bn=0,Vn=!1,Hn=0,Un=0,Wn=0,Gn=!1;function Kn(){Gn||(Gn=!0,s(`#vr-swipehint`)?.classList.add(`vr-faded`))}function qn(e){if(d(),V===`playing`&&Rn===null){Rn=e.pointerId,zn=e.clientX,Bn=e.clientY,Hn=e.clientX,Un=e.clientY,Wn=performance.now(),Vn=!1;try{c.setPointerCapture(e.pointerId)}catch{}}}function Jn(e){if(e.pointerId!==Rn||V!==`playing`)return;let t=e.clientX-zn,n=Ln();Math.abs(t)<n||Math.abs(e.clientY-Bn)>Math.abs(t)*1.2||(Pn(t<0?`left`:`right`),Vn=!0,Kn(),zn=e.clientX,Bn=e.clientY)}function Yn(e){if(e.pointerId!==Rn)return;try{c.releasePointerCapture(e.pointerId)}catch{}if(Rn=null,e.type!==`pointerup`)return;let t=Math.hypot(e.clientX-Hn,e.clientY-Un);!Vn&&t<16&&performance.now()-Wn<320&&Qt()}c.addEventListener(`pointerdown`,qn),c.addEventListener(`pointermove`,Jn),c.addEventListener(`pointerup`,Yn),c.addEventListener(`pointercancel`,Yn);function Xn(e=Math.floor(Math.random()*B.length),n=-90){let r=wt(),i=B[e],a=_t+(Math.random()-.5)*.8;r.group.position.set(i,a,n),r.group.visible=!0,b.add(r.group),r.mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0),r.ring.rotation.x=Math.random(),r.rotSpd=new t.Vector3((Math.random()-.5)*.06,(Math.random()-.5)*.06,(Math.random()-.5)*.04),r.lane=e,r.warned=!1,j.push(r)}function Zn(e=Math.floor(Math.random()*B.length),t=-95){let n=kt();n.position.set(B[e],_t+(Math.random()-.5)*.7,t),n.rotation.set(0,0,0),M.push(n)}function Qn(){let e=Math.max(0,wn-1),t=Math.min(B.length-1,wn+1),n=e+Math.floor(Math.random()*(t-e+1));return wn=n,n}function $n(){let e=Qn(),t=[0,1,2].filter(t=>t!==e);Math.random()<.14+G*.46?(Xn(t[0]),Xn(t[1])):Xn(t[Math.floor(Math.random()*t.length)]),Math.random()<.76&&Zn(e,-94)}function er(){for(let e=1;e<=3;e++)s(`#vr-h${e}`).classList.toggle(`vr-dead`,e>$t)}let tr=0,nr=null,rr=0,ir=0;function ar(t){if(V!==`playing`||t>=50||y<=.85||(rr+=t,ir++,ir<180))return;let n=rr/ir;rr=0,ir=0,n<=21||(y=Math.max(.85,y-.15),v.setPixelRatio(y),v.setSize(window.innerWidth,window.innerHeight),e.dataset.renderScale=y.toFixed(2))}function or(e){nr=requestAnimationFrame(or);let t=Math.min(Math.max(e-tr,0),50),n=t/16.667;if(tr=e,$+=n/60,ar(t),Ue.rotation.y+=8e-5*n,Oe||(We.rotation.y=Math.sin($*.08)*.035,qe.rotation.z+=15e-5*n),V===`playing`&&(Tn=(Tn+tn*n)%5,E.position.z=Tn),V===`menu`||V===`gameover`){A&&(A.rotation.z+=.38*n),k.position.y=_t+Math.sin($*1.4)*.12,k.rotation.z=Math.sin($*.9)*.08,k.rotation.y=Math.sin($*.4)*.16,x.position.x=Math.sin($*.25)*1.1,x.lookAt(0,.5,0),w.position.copy(k.position),Bt(n),v.render(b,x);return}if(V===`paused`||V===`countdown`){A&&V===`countdown`&&(A.rotation.z+=.52*n),v.render(b,x);return}A&&(A.rotation.z+=(.55+G*.35)*n),xn+=n/60,Dn.left&&Pn(`left`),Dn.right&&Pn(`right`);let r=n/60,i=1-Math.exp(-16*r),a=K;K+=i*(nn-K),K=Math.max(-3.2,Math.min(3.2,K)),jn&&Math.abs(K-nn)<.12&&(jn=!1);let o=-((K-a)/r)*.01;rn+=(o-rn)*i*1.2,k.position.x=K,k.position.y=_t+Math.sin($*2)*.04,k.rotation.z=Math.max(-.45,Math.min(.45,rn)),k.rotation.y=rn*.12,yt.material.emissiveIntensity=3.2+Math.sin($*25)*.8;for(let e=0;e<bt.length;e++){let t=bt[e];t.scale.z=.85+Math.sin($*22+e*1.7)*.22,t.material.opacity=.7+Math.sin($*19+e)*.15}if(w.position.copy(k.position),w.position.z+=1,vn){yn-=n;let e=.5+.5*Math.sin(yn*.4);vt.material.emissive.setHex(_.invincible),vt.material.emissiveIntensity=2+e*3,yt.material.emissive.setHex(_.invincible),yt.material.emissiveIntensity=4+e*4,w.color.setHex(_.invincible),w.intensity=4+e*3,yn<=0&&(vn=!1,vt.material.emissive.setHex(_.glassEmissive),vt.material.emissiveIntensity=.15,yt.material.emissive.setHex(_.coolAccent),yt.material.emissiveIntensity=.5,w.color.setHex(_.coolAccent),w.intensity=.75)}tn=Math.min(.85,.32+xn*.006),G=(tn-.32)/.53,H=Math.floor(xn*15+en*8+Sn),W=Math.min(10,Math.floor(G*9)+1),W!==En&&(ie(),R.level.textContent=`LV ${W}`,En=W);let s=Math.round(G*100);s!==z.speedPct&&(R.speedFill.style.width=`${s}%`,z.speedPct=s),H!==z.score&&(R.score.textContent=H,z.score=H);let c=G>.5?Math.round((G-.5)*80)/100:0;c!==z.lines&&(R.speedLines.style.opacity=String(c),z.lines=c);let l=Math.sin($*.4);Le.position.x=l*5.5;let u=.5+.5*Math.cos($*.3);Le.color.setRGB(C.r+(Re.r-C.r)*u,C.g+(Re.g-C.g)*u,C.b+(Re.b-C.b)*u),Le.intensity=2.2+Math.sin($*2)*.55,bn>0&&(bn-=n,bn<=0&&(Q=0,R.combo.style.opacity=`0`));let d=Math.max(48,82-W*3.2);Cn-=n,Cn<=0&&($n(),Cn=d);let ee=!1;for(let e=j.length-1;e>=0;e--){let t=j[e];if(t.group.position.z+=(tn+.28)*n,t.mesh.rotation.x+=t.rotSpd.x*n,t.mesh.rotation.y+=t.rotSpd.y*n,t.ring.rotation.z+=.04*n,t.group.position.z>-30&&t.group.position.z<-8){let e=.4+Math.sin($*12)*.3;t.ring.material.emissiveIntensity=2+e*3,Math.abs(t.group.position.x-K)<1.5&&(ee=!0)}else t.ring.material.emissiveIntensity=1;if(t.group.position.z>14)Tt(t),j.splice(e,1);else if(!vn&&t.group.position.z>4&&t.group.position.z<9){let n=Math.abs(t.group.position.x-k.position.x),r=Math.abs(t.group.position.y-k.position.y);if(n<.78&&r<.72){if(Rt(t.group.position.x,t.group.position.y,t.group.position.z),Tt(t),j.splice(e,1),$t--,er(),ae(),Ht(`vr-hitflash`,200),Z=20,Q=0,R.combo.style.opacity=`0`,vn=!0,yn=100,$t<=0){ur();return}continue}n<1.8&&r<1.8&&!t.warned&&(t.warned=!0,te(),Q++,bn=120,Q>=2&&(R.comboText.textContent=`COMBO x${Q}`,R.combo.style.opacity=`1`,Sn+=Q*5))}}let f=ee?Math.round((.4+Math.sin($*15)*.3)*20)/20:0;f!==z.warn&&(R.warnFlash.style.opacity=String(f),z.warn=f);let p=1e3/60*n;L>0&&(L=Math.max(0,L-p),qt-=p,qt<=0&&(qt=130,Jt(K),oe()),Zt(L>0?`firing`:`idle`),L===0&&(I=0));for(let e=F.length-1;e>=0;e--){let t=F[e],r=t.position.z;if(t.position.z-=1.15*n,t.position.z<-96){Yt(e);continue}let i=!1;for(let e=j.length-1;e>=0;e--){let n=j[e],a=n.group.position.z;if(!(a>r+1.1||a<t.position.z-1.1)&&!(Math.abs(n.group.position.x-t.position.x)>1.25)){Rt(n.group.position.x,n.group.position.y,n.group.position.z),Tt(n),j.splice(e,1),Sn+=20,se(),i=!0;break}}i&&Yt(e)}for(let e=M.length-1;e>=0;e--){let t=M[e];if(t.position.z+=(tn+.15)*n,t.rotation.y+=.06*n,t.rotation.x+=.04*n,t.position.z>14)At(t),M.splice(e,1);else if(t.position.z>4&&t.position.z<9){let n=Math.abs(t.position.x-k.position.x),r=Math.abs(t.position.y-k.position.y);if(n<.9&&r<.86){ne(),zt(t.position.x,t.position.y,t.position.z),Ht(`vr-gemflash`,120),en++,L===0&&I<8&&(I++,Zt(I>=8?`ready`:`idle`),I===8&&(ce(),Vt(`PULSE READY`,_.cssGold,900)));let n=25*Math.max(1,Math.floor(Q/2)+1);Sn+=n,Vt(`+${n}`,_.cssGold,600),At(t),M.splice(e,1)}}}Bt(n);let re=K*.45;x.position.x+=(re-x.position.x)*.08*n,x.position.y+=(2.8-x.position.y)*.04*n,Z>0&&(x.position.x+=Math.sin($*60)*(Z*.018),x.position.y+=Math.cos($*55)*(Z*.012),Z-=n*1.8,Z<0&&(Z=0)),x.position.z=9,x.lookAt(K*.5,.8,0),Ce(G),v.render(b,x)}function sr(){j.forEach(e=>Tt(e)),j.length=0,M.forEach(e=>At(e)),M.length=0,Xt(),N.forEach(e=>{e.mesh.visible=!1,Pt[e.kind].push(e.mesh)}),N.length=0}let cr=null;function lr(){d(),m(),[`vr-menuscreen`,`vr-gameoverscreen`,`vr-pausescreen`].forEach(e=>{s(`#${e}`).style.display=`none`}),s(`#vr-countdownscreen`).style.display=`flex`,s(`#vr-hud`).style.display=`none`,s(`#vr-speedbar`).style.display=`none`,s(`#vr-power`).style.display=`none`,s(`#vr-pausebtn`).style.display=`none`,s(`#vr-thumbcontrols`).style.display=`none`,s(`#vr-laneindicator`).style.display=`none`,sr(),H=0,$t=3,en=0,W=1,En=1,I=0,L=0,qt=0,z.power=-1,z.powerState=``,Zt(`idle`),s(`#vr-levelhud`).textContent=`LV 1`,xn=0,Sn=0,tn=.32,G=0,Tn=0,E.position.z=0,nn=0,K=0,rn=0,An=1,jn=!1,Nn(),vn=!1,k.visible=!0,Q=0,bn=0,Z=0,Cn=82,wn=1,er(),R.combo.style.opacity=`0`,s(`#vr-warningflash`).style.opacity=`0`,s(`#vr-speedlines`).style.opacity=`0`,V=`countdown`;let e=3,t=s(`#vr-countdownnum`);function n(){t.textContent=e>0?String(e):`GO!`,t.style.animation=`none`,t.offsetHeight,t.style.animation=`vrCountPulse 0.9s ease-out`,e>0?p(440,`square`,.1,.1):p(880,`square`,.15,.15),e--,cr=setTimeout(e>=0?n:()=>{s(`#vr-countdownscreen`).style.display=`none`,s(`#vr-hud`).style.display=`flex`,s(`#vr-speedbar`).style.display=`flex`,s(`#vr-power`).style.display=`flex`,s(`#vr-pausebtn`).style.display=`flex`,s(`#vr-laneindicator`).style.display=`flex`,o&&(s(`#vr-thumbcontrols`).style.display=`block`,Gn=!1,s(`#vr-swipehint`)?.classList.remove(`vr-faded`)),V=`playing`,Se(),we()},950)}n()}function ur(){V=`gameover`,re(),Ee(),Te(),Rt(k.position.x,k.position.y,k.position.z),Rt(k.position.x,k.position.y,k.position.z),k.visible=!1,Z=35;let e=H>U;e&&(U=H,localStorage.setItem(`vrBest`,String(U)),s(`#vr-besthud`).textContent=U,s(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${U}`),cn(on,H,W,en),s(`#vr-goscore`).textContent=H,s(`#vr-golevel`).textContent=W,s(`#vr-gogems`).textContent=en,s(`#vr-gobest`).textContent=U,s(`#vr-newbestbadge`).style.display=e?`block`:`none`,P.gameover=setTimeout(()=>{s(`#vr-thumbcontrols`).style.display=`none`,s(`#vr-laneindicator`).style.display=`none`,s(`#vr-pausebtn`).style.display=`none`,s(`#vr-hud`).style.display=`none`,s(`#vr-speedbar`).style.display=`none`,s(`#vr-power`).style.display=`none`,s(`#vr-gameoverscreen`).style.display=`flex`},600)}function dr(){V===`playing`?(V=`paused`,m(),Ee(),Te(),s(`#vr-pausescreen`).style.display=`flex`,s(`#vr-pausebtn`).textContent=`▶`):V===`paused`&&(V=`playing`,m(),d(),Se(),we(),s(`#vr-pausescreen`).style.display=`none`,s(`#vr-pausebtn`).textContent=`⏸️`)}function fr(){V=`menu`,Ee(),Te(),sr(),k.visible=!0,s(`#vr-hud`).style.display=`none`,s(`#vr-speedbar`).style.display=`none`,s(`#vr-power`).style.display=`none`,s(`#vr-pausebtn`).style.display=`none`,s(`#vr-thumbcontrols`).style.display=`none`,s(`#vr-laneindicator`).style.display=`none`,s(`#vr-warningflash`).style.opacity=`0`,s(`#vr-speedlines`).style.opacity=`0`,s(`#vr-menubest`).style.opacity=U>0?`1`:`0`,s(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${U}`,X(`vr-menuscreen`)}let pr=[[`#vr-btnplay`,`click`,lr],[`#vr-btnscores`,`click`,()=>X(`vr-highscorescreen`)],[`#vr-btnsettings`,`click`,()=>X(`vr-settingsscreen`)],[`#vr-btnhow`,`click`,()=>X(`vr-howscreen`)],[`#vr-btnexit`,`click`,_n],[`#vr-btnclearscores`,`click`,ln],[`#vr-btnhsback`,`click`,()=>X(`vr-menuscreen`)],[`#vr-btnsetback`,`click`,()=>X(`vr-menuscreen`)],[`#vr-btnhowback`,`click`,()=>X(`vr-menuscreen`)],[`#vr-btnresume`,`click`,dr],[`#vr-btnpausesettings`,`click`,()=>{X(`vr-settingsscreen`),V=`menu`}],[`#vr-btnpausemenu`,`click`,fr],[`#vr-btnagain`,`click`,lr],[`#vr-btngoscores`,`click`,()=>X(`vr-highscorescreen`)],[`#vr-btngomenu`,`click`,fr],[`#vr-pausebtn`,`click`,dr]];return pr.forEach(([e,t,n])=>s(e)?.addEventListener(t,n)),s(`#vr-nameinput`)?.addEventListener(`input`,fn),s(`#vr-musicvol`)?.addEventListener(`input`,e=>pn(e.target.value)),s(`#vr-sfxvol`)?.addEventListener(`input`,e=>mn(e.target.value)),s(`#vr-musictoggle`)?.addEventListener(`click`,hn),s(`#vr-sfxtoggle`)?.addEventListener(`click`,gn),tr=performance.now(),nr=requestAnimationFrame(or),{syncAppAudio(){f()?q&&we():Te()},dispose(){if(cancelAnimationFrame(nr),window.removeEventListener(`resize`,Ne),document.removeEventListener(`keydown`,On),document.removeEventListener(`keyup`,kn),c.removeEventListener(`pointerdown`,qn),c.removeEventListener(`pointermove`,Jn),c.removeEventListener(`pointerup`,Yn),c.removeEventListener(`pointercancel`,Yn),pr.forEach(([e,t,n])=>s(e)?.removeEventListener(t,n)),Object.values(P).forEach(e=>clearTimeout(e)),Object.values(Fn).forEach(e=>clearTimeout(e)),clearTimeout(ue),clearTimeout(cr),Te(),Ee(),u)try{u.close()}catch{}b.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())}),v.dispose(),i(v)}}}function f({onBack:e}){let t=(0,a.useRef)(null),n=(0,a.useRef)(e);n.current=e;let{sfxEnabled:i}=r(),s=(0,a.useRef)(null),c=(0,a.useRef)(i);return c.current=i,(0,a.useEffect)(()=>{let e=t.current;if(!e)return;let r=!1;return e.innerHTML=d,l().then(t=>{!r&&e.isConnected&&(s.current=ee(e,t,{onBack:()=>n.current?.(),isAppSfxOn:()=>c.current,isAppMusicOn:()=>!0}))}).catch(()=>{r||(e.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffe6b0;font-family:sans-serif">Requires an internet connection to load Void Runner.</div>`)}),()=>{r=!0,s.current?.dispose(),s.current=null,e.innerHTML=``}},[]),(0,a.useEffect)(()=>{s.current?.syncAppAudio?.()},[i]),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(`style`,{children:u}),(0,o.jsx)(`div`,{className:`vr-root mode-void`,ref:t})]})}export{f as default};