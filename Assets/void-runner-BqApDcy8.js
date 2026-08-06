import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{r}from"./c3dViewport-D3K1ZAxX.js";var i=e(t()),a=n(),o=`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`,s=`sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==`;function c(){return window.THREE?Promise.resolve(window.THREE):new Promise((e,t)=>{let n=document.getElementById(`vr-three-cdn`);if(n){n.addEventListener(`load`,()=>e(window.THREE)),n.addEventListener(`error`,()=>t(Error(`three-cdn-failed`)));return}let r=document.createElement(`script`);r.id=`vr-three-cdn`,r.src=o,r.integrity=s,r.crossOrigin=`anonymous`,r.onload=()=>e(window.THREE),r.onerror=()=>{r.remove(),t(Error(`three-cdn-failed`))},document.head.appendChild(r)})}var l=`
.vr-root {
  --vr-pink:   #c96f63;
  --vr-cyan:   #65b7b0;
  --vr-purple: #9a80c8;
  --vr-gold:   #d8a541;
  --vr-dark-bg: #090d19;
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
.vr-hud-val { font-family:'DM Mono',sans-serif; font-size:22px; font-weight:700; color:#fff; text-shadow:0 0 12px var(--vr-cyan); }
.vr-liveshud { display:flex; gap:6px; align-items:center; padding-top:4px; }
.vr-heart { font-size:18px; transition:transform 0.2s, opacity 0.2s; }
.vr-heart.vr-dead { opacity:0.2; transform:scale(0.7); }

.vr-speedbar { position:absolute; top:calc(72px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:4px; pointer-events:none; z-index:10; }
.vr-speedlabel { font-size:9px; letter-spacing:3px; color:rgba(0,245,255,0.4); }
.vr-levellabel { color:rgba(255,255,255,0.55); margin-inline-start:6px; }
.vr-speedtrack { width:120px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; }
.vr-speedfill { height:100%; width:0%; background:linear-gradient(90deg,var(--vr-cyan),var(--vr-pink));
  border-radius:2px; transition:width 0.3s; box-shadow:0 0 8px var(--vr-cyan); }

.vr-combodisplay { position:absolute; top:calc(110px + env(safe-area-inset-top)); left:50%; transform:translateX(-50%);
  pointer-events:none; z-index:10; text-align:center; opacity:0; transition:opacity 0.3s; }
.vr-combotext { font-family:'DM Mono',sans-serif; font-size:20px; font-weight:900; color:var(--vr-gold);
  text-shadow:0 0 20px var(--vr-gold); letter-spacing:3px; }

.vr-popup { position:absolute; left:50%; top:calc(148px + env(safe-area-inset-top)); transform:translateX(-50%); pointer-events:none; z-index:15; text-align:center;
  font-family:'DM Mono',sans-serif; font-size:18px; font-weight:900; letter-spacing:4px; opacity:0; text-shadow:0 0 20px currentColor; }

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
.vr-game-logo { font-family:'DM Mono',sans-serif; font-size:clamp(42px,10vw,72px); font-weight:900; letter-spacing:8px; line-height:1;
  background:linear-gradient(135deg,var(--vr-cyan) 0%,var(--vr-pink) 50%,var(--vr-purple) 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  filter:drop-shadow(0 0 20px rgba(0,245,255,0.5)); animation:vrLogoPulse 3s ease-in-out infinite; margin-bottom:4px; text-align: center; }
.vr-tagline { font-size:12px; letter-spacing:6px; color:rgba(0,245,255,0.5); margin-bottom:40px; text-transform:uppercase; }
@keyframes vrLogoPulse { 0%,100%{ filter:drop-shadow(0 0 15px rgba(0,245,255,0.4)); } 50%{ filter:drop-shadow(0 0 35px rgba(255,45,155,0.6)); } }

.vr-best-badge { font-size:11px; letter-spacing:3px; color:var(--vr-gold); margin-bottom:32px; text-shadow:0 0 10px var(--vr-gold); opacity:0; transition:opacity 0.5s; }
.vr-controls-hint { margin-bottom:32px; text-align:center; display:flex; flex-direction:column; gap:8px; }
.vr-hint-row { font-size:11px; letter-spacing:2px; color:rgba(255,255,255,0.35); }
.vr-hint-row span { color:rgba(0,245,255,0.6); }

.vr-neon-btn { font-family:'DM Mono',sans-serif; font-size:15px; font-weight:700; letter-spacing:5px; padding:16px 48px;
  border-radius:4px; border:none; cursor:pointer; position:relative; overflow:hidden; transition:transform 0.1s, box-shadow 0.2s; text-transform:uppercase; }
.vr-neon-btn-primary { background:linear-gradient(135deg, #1a006b, #3d00c8); color:#fff;
  box-shadow:0 0 30px rgba(61,0,200,0.6), inset 0 0 30px rgba(0,245,255,0.1); border:1px solid rgba(0,245,255,0.4); }
.vr-neon-btn-primary:hover { transform:scale(1.04); box-shadow:0 0 50px rgba(0,245,255,0.5), inset 0 0 30px rgba(0,245,255,0.2); }
.vr-neon-btn-secondary { background:transparent; color:rgba(0,245,255,0.6); border:1px solid rgba(0,245,255,0.3); font-size:12px; padding:10px 32px; letter-spacing:4px; }
.vr-neon-btn-secondary:hover { border-color:var(--vr-cyan); color:var(--vr-cyan); box-shadow:0 0 20px rgba(0,245,255,0.3); }

#vr-pausescreen { background:rgba(0,0,10,0.88); backdrop-filter:blur(6px); }
#vr-pausescreen h2 { font-family:'DM Mono',sans-serif; font-size:36px; letter-spacing:10px; color:var(--vr-cyan);
  text-shadow:0 0 30px var(--vr-cyan); margin-bottom:40px; }
.vr-pause-btns { display:flex; flex-direction:column; gap:16px; align-items:center; }

#vr-gameoverscreen { background: radial-gradient(ellipse at 50% 40%, rgba(255,45,0,0.12) 0%, rgba(0,0,10,0.92) 70%); }
.vr-go-title { font-family:'DM Mono',sans-serif; font-size:clamp(28px,8vw,52px); font-weight:900; letter-spacing:6px; color:#fff;
  text-shadow:0 0 30px var(--vr-pink); margin-bottom:8px; margin-top:0; }
.vr-go-sub { font-size:11px; letter-spacing:4px; color:rgba(255,45,155,0.5); margin-bottom:32px; }
.vr-stats-row { display:flex; gap:12px; margin-bottom:32px; flex-wrap:wrap; justify-content:center; }
.vr-stat-card { display:flex; flex-direction:column; align-items:center; gap:6px; background:rgba(255,255,255,0.05);
  border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:16px 20px; min-width:90px; }
.vr-stat-card .vr-sv { font-family:'DM Mono',sans-serif; font-size:26px; font-weight:700; color:var(--vr-cyan); text-shadow:0 0 10px var(--vr-cyan); }
.vr-stat-card .vr-sl { font-size:9px; letter-spacing:3px; color:rgba(255,255,255,0.35); }
.vr-new-best-badge { font-family:'DM Mono',sans-serif; font-size:13px; letter-spacing:4px; color:var(--vr-gold);
  text-shadow:0 0 15px var(--vr-gold); margin-bottom:24px; opacity:0; animation:vrBadgePop 0.4s 0.3s forwards; }
@keyframes vrBadgePop { from{ opacity:0; transform:scale(0.7); } to{ opacity:1; transform:scale(1); } }
.vr-go-btns { display:flex; flex-direction:column; gap:12px; align-items:center; }

#vr-countdownscreen { background:rgba(0,0,10,0.6); }
.vr-countdownnum { font-family:'DM Mono',sans-serif; font-size:clamp(80px,25vw,140px); font-weight:900; color:var(--vr-cyan);
  text-shadow:0 0 60px var(--vr-cyan); animation:vrCountPulse 1s ease-out; }
@keyframes vrCountPulse { 0%{ transform:scale(1.5); opacity:0; } 100%{ transform:scale(1); opacity:1; } }


.vr-sub-screen { position:absolute; inset:0; z-index:30; display:none; flex-direction:column; align-items:center; justify-content:flex-start;
  padding:calc(40px + env(safe-area-inset-top)) 24px 40px;
  background: radial-gradient(ellipse at 50% 20%, rgba(0,80,120,0.18) 0%, rgba(0,0,10,0.95) 70%); overflow-y:auto; }
.vr-sub-title { font-family:'DM Mono',sans-serif; font-size:24px; font-weight:900; letter-spacing:8px; color:var(--vr-cyan);
  text-shadow:0 0 20px var(--vr-cyan); margin-bottom:32px; margin-top:8px; }
.vr-setting-row { width:100%; max-width:360px; display:flex; align-items:center; justify-content:space-between;
  border-bottom:1px solid rgba(0,245,255,0.1); padding:14px 0; gap:16px; }
.vr-setting-label { font-size:12px; letter-spacing:3px; color:rgba(255,255,255,0.6); }
.vr-setting-val { font-family:'DM Mono',sans-serif; font-size:14px; color:var(--vr-cyan); }
.vr-root input[type=range] { -webkit-appearance:none; width:130px; height:4px; background:rgba(0,245,255,0.2); border-radius:2px; outline:none; }
.vr-root input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:16px; height:16px; border-radius:50%;
  background:var(--vr-cyan); box-shadow:0 0 8px var(--vr-cyan); cursor:pointer; }
.vr-root input[type=text] { background:rgba(0,245,255,0.07); border:1px solid rgba(0,245,255,0.3); border-radius:4px;
  color:var(--vr-cyan); padding:8px 12px; font-family:'DM Mono',monospace; font-size:14px; width:160px; outline:none; letter-spacing:2px; }
.vr-root input[type=text]:focus { border-color:var(--vr-cyan); }

.vr-toggle-btn { font-family:'DM Mono',sans-serif; font-size:11px; letter-spacing:3px; padding:8px 18px; border-radius:4px; cursor:pointer;
  border:1px solid rgba(0,245,255,0.4); background:rgba(0,245,255,0.1); color:var(--vr-cyan); transition:background 0.2s; }
.vr-toggle-btn.vr-on { background:rgba(0,245,255,0.25); color:#fff; }
.vr-toggle-btn.vr-off { background:transparent; color:rgba(0,245,255,0.4); }

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
.vr-how-key { display:inline-block; background:rgba(0,245,255,0.15); border:1px solid rgba(0,245,255,0.3); border-radius:3px;
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
.vr-game-logo {
  font-family:'Outfit','DM Mono',sans-serif;
  font-size:clamp(40px,9vw,68px);
  letter-spacing:0.08em;
  background:linear-gradient(115deg,#f0dfad 0%,var(--vr-cyan) 48%,#c7b4e5 100%);
  -webkit-background-clip:text;
  -webkit-text-fill-color:transparent;
  filter:drop-shadow(0 5px 0 rgba(3,7,16,0.9));
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
.vr-neon-btn-primary {
  color:#fff;
  background:#69549b;
  border-color:#f2e8d6;
  box-shadow:3px 3px 0 #030710;
}
.vr-neon-btn-primary:hover {
  transform:translateY(-1px);
  background:#7560a7;
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

  <div class="vr-combodisplay" id="vr-combodisplay"><span class="vr-combotext" id="vr-combotext">COMBO x2</span></div>
  <div class="vr-popup" id="vr-popup"></div>

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
`;function ee(e,t,{onBack:n}){let i=typeof navigator<`u`&&(navigator.maxTouchPoints>0||`ontouchstart`in window),a=t=>e.querySelector(t),o=a(`#vr-canvas`),s=window.AudioContext||window.webkitAudioContext,c=null;function l(){c||=new s,c.state===`suspended`&&c.resume()}function u(e,t,n,r,i=0){if(!c)return;let a=c.createOscillator(),o=c.createGain();a.connect(o),o.connect(c.destination),a.type=t,a.frequency.setValueAtTime(e,c.currentTime+i),o.gain.setValueAtTime(r,c.currentTime+i),o.gain.exponentialRampToValueAtTime(.001,c.currentTime+i+n),a.start(c.currentTime+i),a.stop(c.currentTime+i+n+.05)}function ee(){if(!c)return;let e=c.createOscillator(),t=c.createGain();e.connect(t),t.connect(c.destination),e.type=`sawtooth`,e.frequency.setValueAtTime(800,c.currentTime),e.frequency.exponentialRampToValueAtTime(200,c.currentTime+.15),t.gain.setValueAtTime(.12,c.currentTime),t.gain.exponentialRampToValueAtTime(.001,c.currentTime+.15),e.start(),e.stop(c.currentTime+.2)}function te(){[523,659,784,1047].forEach((e,t)=>u(e,`sine`,.12,.08,t*.05))}function d(){c&&[60,80,100,120].forEach(e=>{let t=c.createBuffer(1,c.sampleRate*.5,c.sampleRate),n=t.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=(Math.random()*2-1)*(1-e/n.length);let r=c.createBufferSource(),i=c.createGain(),a=c.createBiquadFilter();r.buffer=t,a.type=`lowpass`,a.frequency.value=e*30,r.connect(a),a.connect(i),i.connect(c.destination),i.gain.setValueAtTime(.3,c.currentTime),i.gain.exponentialRampToValueAtTime(.001,c.currentTime+.6),r.start()})}function ne(){[400,500,600,800,1e3].forEach((e,t)=>u(e,`square`,.1,.06,t*.08))}function re(){u(120,`sawtooth`,.3,.15),u(80,`square`,.4,.1,.05)}function f(){G&&c&&u(440,`sine`,.08,.06*_t)}let ie=!1,ae=null,p=null,oe=[[220,261.63,329.63],[174.61,220,261.63],[130.81,164.81,196],[196,246.94,293.66]],se=[[440,523,659,523,440,392,440,523],[349,440,523,440,349,330,349,440],[262,330,392,330,262,247,262,330],[392,494,587,494,392,370,392,494]],m=60/128,h=m*4;function ce(e,t){let n=e.createOscillator(),r=e.createGain();n.connect(r),r.connect(p),n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(40,t+.08),r.gain.setValueAtTime(.55,t),r.gain.exponentialRampToValueAtTime(.001,t+.18),n.start(t),n.stop(t+.2)}function le(e,t){let n=e.createBuffer(1,e.sampleRate*.12,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<r.length;e++)r[e]=Math.random()*2-1;let i=e.createBufferSource(),a=e.createBiquadFilter(),o=e.createGain();i.buffer=n,a.type=`bandpass`,a.frequency.value=2400,a.Q.value=.8,i.connect(a),a.connect(o),o.connect(p),o.gain.setValueAtTime(.22,t),o.gain.exponentialRampToValueAtTime(.001,t+.14),i.start(t)}function ue(e,t,n=!1){let r=e.createBuffer(1,e.sampleRate*(n?.18:.04),e.sampleRate),i=r.getChannelData(0);for(let e=0;e<i.length;e++)i[e]=Math.random()*2-1;let a=e.createBufferSource(),o=e.createBiquadFilter(),s=e.createGain();a.buffer=r,o.type=`highpass`,o.frequency.value=9e3,a.connect(o),o.connect(s),s.connect(p),s.gain.setValueAtTime(n?.1:.07,t),s.gain.exponentialRampToValueAtTime(.001,t+(n?.18:.04)),a.start(t)}function de(e,t,n,r){let i=e.createOscillator(),a=e.createGain(),o=e.createBiquadFilter();i.type=`sawtooth`,i.frequency.value=t/2,o.type=`lowpass`,o.frequency.value=600,o.Q.value=3,i.connect(o),o.connect(a),a.connect(p),a.gain.setValueAtTime(.18,n),a.gain.setValueAtTime(.14,n+r*.7),a.gain.exponentialRampToValueAtTime(.001,n+r),i.start(n),i.stop(n+r+.05)}function fe(e,t,n,r){let i=e.createOscillator(),a=e.createGain();i.type=`square`,i.frequency.value=t,i.connect(a),a.connect(p),a.gain.setValueAtTime(.06,n),a.gain.exponentialRampToValueAtTime(.001,n+r*.9),i.start(n),i.stop(n+r)}function pe(e,t,n,r){t.forEach(t=>{let i=e.createOscillator(),a=e.createGain();i.type=`sine`,i.frequency.value=t,i.connect(a),a.connect(p),a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.04,n+.3),a.gain.setValueAtTime(.04,n+r-.3),a.gain.linearRampToValueAtTime(0,n+r),i.start(n),i.stop(n+r+.1)})}function me(e,t,n){if(!ie)return;let r=oe[n%oe.length],i=se[n%se.length];pe(e,r,t,h),de(e,r[0],t,h/2),de(e,r[0],t+h/2,h/2);for(let n=0;n<4;n++){let r=t+n*m;(n===0||n===2)&&ce(e,r),(n===1||n===3)&&le(e,r),ue(e,r,!1),ue(e,r+m/2,n===1)}i.forEach((n,r)=>{fe(e,n,t+r*m/2,m/2*.85)}),ae=setTimeout(()=>{me(e,t+h,n+1)},(h-.1)*1e3)}let g=null;function he(){if(!c||g)return;let e=c.createOscillator(),t=c.createGain();e.type=`sawtooth`,e.frequency.value=60,t.gain.value=.018,e.connect(t),t.connect(c.destination),e.start(),g={osc1:e,gain:t}}function ge(e){if(!g)return;let t=60+e*80;g.osc1.frequency.setTargetAtTime(t,c.currentTime,.4),g.gain.gain.setTargetAtTime(.018+e*.012,c.currentTime,.4)}function _e(){!c||ie||!W||(ie=!0,p=c.createGain(),p.gain.value=gt*.55,p.connect(c.destination),me(c,c.currentTime+.05,0))}function _(){ie=!1,clearTimeout(ae),p&&(p.gain.setTargetAtTime(0,c.currentTime,.2),setTimeout(()=>{p=null},500))}function ve(){g&&(g.gain.gain.setTargetAtTime(0,c.currentTime,.15),setTimeout(()=>{try{g.osc1.stop()}catch{}g=null},400))}let v=new t.WebGLRenderer({canvas:o,antialias:!i});v.setPixelRatio(Math.min(window.devicePixelRatio||1,i?1.5:2)),v.shadowMap.enabled=!i,i||(v.shadowMap.type=t.PCFSoftShadowMap),v.setSize(window.innerWidth,window.innerHeight),v.setClearColor(262159);let y=new t.Scene;y.fog=new t.FogExp2(524304,.028);let b=new t.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.1,300);b.position.set(0,2.8,9),b.lookAt(0,.5,0);let ye=b.position.z-6;function be(){let e=b.aspect,t=2*Math.atan(11/(2*ye)),n=2*Math.atan(Math.tan(t/2)/e)*(180/Math.PI);n=Math.max(70,Math.min(100,n)),b.fov=n,b.updateProjectionMatrix()}be();function xe(){b.aspect=window.innerWidth/window.innerHeight,be(),v.setSize(window.innerWidth,window.innerHeight)}window.addEventListener(`resize`,xe);function x(e){if(!i)return new t.MeshStandardMaterial(e);let{roughness:n,metalness:r,...a}=e;return new t.MeshLambertMaterial(a)}let Se=new t.AmbientLight(655392,2);y.add(Se);let Ce=new t.DirectionalLight(10040319,2.5);Ce.position.set(5,12,8),Ce.castShadow=!i,y.add(Ce);let we=new t.PointLight(16723355,4,25);we.position.set(-6,3,2),y.add(we);let Te=new t.PointLight(62975,4,25);Te.position.set(6,3,2),y.add(Te);let S=new t.PointLight(62975,3,10);y.add(S);let Ee=new t.BufferGeometry,De=i?1800:3e3,Oe=new Float32Array(De*3),ke=new Float32Array(De*3);for(let e=0;e<De;e++){Oe[e*3]=(Math.random()-.5)*500,Oe[e*3+1]=(Math.random()-.5)*200,Oe[e*3+2]=(Math.random()-.5)*500-100;let t=Math.random();ke[e*3]=t>.7?0:1,ke[e*3+1]=t>.7?1:t>.4?0:.5,ke[e*3+2]=1}Ee.setAttribute(`position`,new t.BufferAttribute(Oe,3)),Ee.setAttribute(`color`,new t.BufferAttribute(ke,3));let Ae=new t.PointsMaterial({size:.5,vertexColors:!0,transparent:!0,opacity:.85}),je=new t.Points(Ee,Ae);y.add(je);let C=6.5,w=i?20:30,T=new Float32Array(w);for(let e=0;e<w;e++)T[e]=-e*5;let Me=new t.PlaneGeometry(9,5,8,1);Me.rotateX(-Math.PI/2);let Ne=x({color:327704,roughness:1,metalness:0,emissive:327704}),Pe=new t.InstancedMesh(Me,Ne,w);Pe.receiveShadow=!i,y.add(Pe);let Fe=new t.BoxGeometry(.04,.02,5),Ie=x({color:4456652,emissive:4456652,emissiveIntensity:2}),Le=new t.InstancedMesh(Fe,Ie,w*9);y.add(Le);let Re=new t.BoxGeometry(.06,.06,5),ze=x({color:16723355,emissive:16723355,emissiveIntensity:1.5}),Be=x({color:62975,emissive:62975,emissiveIntensity:1.5}),Ve=new t.InstancedMesh(Re,ze,w),He=new t.InstancedMesh(Re,Be,w);y.add(Ve),y.add(He);let Ue=x({color:2228326,emissive:2228326,emissiveIntensity:1}),We=new t.BoxGeometry(.1,C,.1),Ge=new t.InstancedMesh(We,Ue,w*2);y.add(Ge);let Ke=new t.BoxGeometry(9,.1,.1),qe=new t.InstancedMesh(Ke,Ue,w);y.add(qe);let Je=new t.Matrix4,Ye=new t.Vector3,Xe=new t.Quaternion,Ze=new t.Vector3(1,1,1);function E(e,t,n,r,i){Ye.set(n,r,i),Je.compose(Ye,Xe,Ze),e.setMatrixAt(t,Je)}function Qe(){for(let e=0;e<w;e++){let t=T[e];E(Pe,e,0,-1.1,t);for(let n=0;n<9;n++)E(Le,e*9+n,n-4,-1.09,t);E(Ve,e,-9/2,-1.05,t),E(He,e,9/2,-1.05,t);let n=t-5/2;E(Ge,e*2,-9/2,C/2-1.1,n),E(Ge,e*2+1,9/2,C/2-1.1,n),E(qe,e,0,C-1.1,n)}Pe.instanceMatrix.needsUpdate=!0,Le.instanceMatrix.needsUpdate=!0,Ve.instanceMatrix.needsUpdate=!0,He.instanceMatrix.needsUpdate=!0,Ge.instanceMatrix.needsUpdate=!0,qe.instanceMatrix.needsUpdate=!0}Qe();function $e(){let e=new t.Group,n=x({color:13692671,emissive:2245734,roughness:.2,metalness:.9}),r=new t.Mesh(new t.ConeGeometry(.42,1.8,8),n);r.rotation.x=Math.PI/2,r.castShadow=!i,e.add(r);let a=x({color:3368618,emissive:1122884,roughness:.3,metalness:.9}),o=new t.Mesh(new t.BoxGeometry(2.2,.08,.7),a);o.position.z=.35,o.castShadow=!i,e.add(o);let s=x({color:16723355,emissive:16723355,emissiveIntensity:3});[-1.1,1.1].forEach(n=>{let r=new t.Mesh(new t.BoxGeometry(.08,.08,.6),s);r.position.set(n,0,.35),e.add(r)});let c=x({color:8969727,emissive:13141,roughness:.1,metalness:.2,transparent:!0,opacity:.75}),l=new t.Mesh(new t.SphereGeometry(.24,8,6),c);l.scale.z=1.6,l.position.z=-.45,e.add(l);let u=x({color:62975,emissive:62975,emissiveIntensity:4,transparent:!0,opacity:.85}),ee=new t.Mesh(new t.SphereGeometry(.22,8,8),u);ee.position.z=1,e.add(ee);let te=x({color:35071,emissive:17663,emissiveIntensity:3,transparent:!0,opacity:.5}),d=new t.Mesh(new t.ConeGeometry(.2,1,8),te);return d.rotation.x=-Math.PI/2,d.position.z=1.55,e.add(d),e}let D=.3,O=$e();O.position.set(0,D,6),O.frustumCulled=!1,O.traverse(e=>{e.frustumCulled=!1}),y.add(O);let et=[],k=[],tt=[x({color:16723245,emissive:6684672,roughness:.3,metalness:.7}),x({color:16737792,emissive:5579264,roughness:.3,metalness:.7}),x({color:13369599,emissive:4456550,roughness:.3,metalness:.7}),x({color:16711782,emissive:5570594,roughness:.3,metalness:.7}),x({color:16729088,emissive:6689024,roughness:.3,metalness:.7})],nt=[new t.BoxGeometry(1.3,1.3,1.3),new t.OctahedronGeometry(.85),new t.TetrahedronGeometry(1),new t.IcosahedronGeometry(.75),new t.TorusGeometry(.65,.22,8,14)];function rt(){if(et.length>0){let e=et.pop();return e.group.visible=!0,e}let e=Math.floor(Math.random()*nt.length),n=Math.floor(Math.random()*tt.length),r=new t.Mesh(nt[e],tt[n]);r.castShadow=!i;let a=x({color:tt[n].color,emissive:tt[n].color,emissiveIntensity:3,transparent:!0,opacity:.8}),o=new t.Mesh(new t.TorusGeometry(1,.04,4,20),a);o.name=`ring`;let s=new t.Group;return s.add(r),s.add(o),y.add(s),{group:s,mesh:r,ring:o}}function A(e){e.group.visible=!1,y.remove(e.group),et.push(e)}for(let e=0;e<20;e++)A(rt());let it=[],j=[],at=x({color:16763904,emissive:16746496,emissiveIntensity:2.5,roughness:.1,metalness:.8});function ot(){if(it.length>0){let e=it.pop();return e.visible=!0,y.add(e),e}let e=new t.Mesh(new t.OctahedronGeometry(.38),at);return e.castShadow=!i,y.add(e),e}function st(e){e.visible=!1,y.remove(e),it.push(e)}let M=[];function ct(e,n,r,i=16729088){for(let a=0;a<18;a++){let a=new t.Mesh(new t.SphereGeometry(.08+Math.random()*.14,4,4),x({color:i,emissive:i,emissiveIntensity:3,transparent:!0,opacity:1}));a.position.set(e,n,r),y.add(a);let o=Math.random()*Math.PI*2,s=Math.random()*Math.PI,c=Math.random()*.35+.1;M.push({mesh:a,vx:Math.sin(s)*Math.cos(o)*c,vy:Math.sin(s)*Math.sin(o)*c,vz:Math.cos(s)*c,life:1,decay:.025+Math.random()*.02})}}function lt(e,n,r){for(let i=0;i<10;i++){let i=new t.Mesh(new t.OctahedronGeometry(.06),x({color:16763904,emissive:16755200,emissiveIntensity:4,transparent:!0,opacity:1}));i.position.set(e,n,r),y.add(i);let a=Math.random()*Math.PI*2;M.push({mesh:i,vx:Math.cos(a)*.18,vy:.15+Math.random()*.1,vz:Math.sin(a)*.18,life:1,decay:.04})}}function ut(e){for(let t=M.length-1;t>=0;t--){let n=M[t];if(n.mesh.position.x+=n.vx*e,n.mesh.position.y+=n.vy*e,n.mesh.position.z+=n.vz*e,n.vy-=.008*e,n.life-=n.decay*e,n.life<=0){y.remove(n.mesh),n.mesh.geometry.dispose(),M.splice(t,1);continue}n.mesh.material.opacity=Math.max(0,n.life),n.mesh.scale.setScalar(n.life)}}let N={};function dt(e,t,n=700){let r=a(`#vr-popup`);r.textContent=e,r.style.color=t,r.style.opacity=`1`,r.style.transform=`translateX(-50%) scale(1)`,clearTimeout(N.popup),N.popup=setTimeout(()=>{r.style.opacity=`0`,r.style.transform=`translateX(-50%) scale(0.8)`},n)}function ft(e,t=150){let n=a(`#${e}`);n.style.opacity=`1`;let r=`flash-${e}`;clearTimeout(N[r]),N[r]=setTimeout(()=>{n.style.opacity=`0`},t)}let P=[-3.2,0,3.2],F=`menu`,I=0,L=parseInt(localStorage.getItem(`vrBest`)||`0`,10),pt=3,R=1,z=0,B=0,V=.32,mt=.85,ht=0,H=0,U=0,W=!0,G=!0,gt=.7,_t=.8,vt=localStorage.getItem(`vrName`)||`PILOT`;function yt(){try{return JSON.parse(localStorage.getItem(`vrScores`)||`[]`)}catch{return[]}}function bt(e,t,n,r){let i=yt();i.push({name:e.toUpperCase().slice(0,10),score:t,level:n,gems:r,date:new Date().toLocaleDateString()}),i.sort((e,t)=>t.score-e.score),i.splice(5),localStorage.setItem(`vrScores`,JSON.stringify(i))}function xt(){window.confirm(`Clear all high scores?`)&&(localStorage.removeItem(`vrScores`),St(),f())}function St(){let e=yt(),t=a(`#vr-hstable`);if(!e.length){t.innerHTML=`<div class="vr-hs-empty">NO SCORES YET<br>BE THE FIRST PILOT!</div>`;return}let n=[`vr-gold-rank`,`vr-silver`,`vr-bronze`,`vr-other`,`vr-other`],r=[`1ST`,`2ND`,`3RD`,`4TH`,`5TH`];t.innerHTML=e.map((e,t)=>`
      <div class="vr-hs-row">
        <div class="vr-hs-rank ${n[t]}">${r[t]}</div>
        <div class="vr-hs-name">${e.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px">LV${e.level}</div>
        <div class="vr-hs-score">${e.score}</div>
      </div>`).join(``)}let Ct=[`vr-menuscreen`,`vr-highscorescreen`,`vr-settingsscreen`,`vr-howscreen`,`vr-countdownscreen`,`vr-pausescreen`,`vr-gameoverscreen`];function K(e){f(),Ct.forEach(e=>{let t=a(`#${e}`);t&&(t.style.display=`none`)});let t=a(`#${e}`);t&&(t.style.display=`flex`),e===`vr-highscorescreen`&&St(),e===`vr-settingsscreen`&&(a(`#vr-nameinput`).value=vt,a(`#vr-musicvol`).value=Math.round(gt*100),a(`#vr-sfxvol`).value=Math.round(_t*100),a(`#vr-musictoggle`).textContent=W?`ON`:`OFF`,a(`#vr-musictoggle`).className=`vr-toggle-btn `+(W?`vr-on`:`vr-off`),a(`#vr-sfxtoggle`).textContent=G?`ON`:`OFF`,a(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(G?`vr-on`:`vr-off`))}function wt(){vt=a(`#vr-nameinput`).value||`PILOT`,localStorage.setItem(`vrName`,vt)}function Tt(e){gt=e/100,p&&p.gain.setTargetAtTime(gt*.55,c.currentTime,.1)}function Et(e){_t=e/100}function Dt(){W=!W,a(`#vr-musictoggle`).textContent=W?`ON`:`OFF`,a(`#vr-musictoggle`).className=`vr-toggle-btn `+(W?`vr-on`:`vr-off`),W?F===`playing`&&(l(),_e()):_()}function Ot(){G=!G,a(`#vr-sfxtoggle`).textContent=G?`ON`:`OFF`,a(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(G?`vr-on`:`vr-off`)}function kt(){f(),n?.()}let q=!1,At=0,J=0,Y=0,X=0,Z=0,jt=0,Mt=0,Nt=0,Pt=1,Q={left:!1,right:!1};a(`#vr-besthud`).textContent=L,a(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${L}`,L>0&&(a(`#vr-menubest`).style.opacity=`1`);function Ft(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Q.left=!0),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Q.right=!0),(e.key===`p`||e.key===`P`||e.key===`Escape`)&&(F===`playing`||F===`paused`)&&en(),(e.key===` `||e.key===`Enter`)&&(F===`gameover`||F===`menu`)&&Qt()}function It(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Q.left=!1),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Q.right=!1)}document.addEventListener(`keydown`,Ft),document.addEventListener(`keyup`,It);let Lt=1,$=!1;function Rt(e){if($)return;let t=Lt+(e===`left`?-1:1);t<0||t>=P.length||(Lt=t,ht=P[Lt],$=!0,G&&c&&u(e===`left`?300:340,`sine`,.04,.03*_t),Bt(e))}let zt={};function Bt(e){let t=a(e===`left`?`#vr-btnleft`:`#vr-btnright`);t&&(t.classList.add(`vr-pressed`),clearTimeout(zt[e]),zt[e]=setTimeout(()=>t.classList.remove(`vr-pressed`),140))}function Vt(e){if(F!==`playing`)return;let t=o.getBoundingClientRect();Rt(e<t.left+t.width/2?`left`:`right`)}function Ht(e){l(),!(!e.touches||!e.touches.length)&&Vt(e.touches[0].clientX)}function Ut(e){l(),Vt(e.clientX)}o.addEventListener(`touchstart`,Ht,{passive:!0}),o.addEventListener(`mousedown`,Ut);function Wt(){let e=rt(),n=Math.floor(Math.random()*P.length),r=P[n],i=D+(Math.random()-.5)*1.5;e.group.position.set(r,i,-90),e.group.visible=!0,y.add(e.group),e.mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0),e.ring.rotation.x=Math.random(),e.rotSpd=new t.Vector3((Math.random()-.5)*.06,(Math.random()-.5)*.06,(Math.random()-.5)*.04),e.lane=n,e.warned=!1,k.push(e)}function Gt(){let e=ot(),t=Math.floor(Math.random()*P.length);e.position.set(P[t],D+(Math.random()-.5)*1.7,-95),e.rotation.set(0,0,0),j.push(e)}function Kt(){for(let e=1;e<=3;e++)a(`#vr-h${e}`).classList.toggle(`vr-dead`,e>pt)}let qt=0,Jt=null;function Yt(e){Jt=requestAnimationFrame(Yt);let t=Math.min((e-qt)/16.667,3);if(qt=e,Nt++,Z=Nt/60,je.rotation.y+=8e-5*t,F===`playing`){for(let e=0;e<w;e++)T[e]+=V*t,T[e]>12&&(T[e]-=w*5);Qe()}if(F===`menu`||F===`gameover`){O.position.y=D+Math.sin(Z*1.2)*.2,O.rotation.y=Math.sin(Z*.4)*.25,b.position.x=Math.sin(Z*.2)*1.5,b.lookAt(0,.5,0),S.position.copy(O.position),ut(t),v.render(y,b);return}if(F===`paused`||F===`countdown`){v.render(y,b);return}Q.left&&Rt(`left`),Q.right&&Rt(`right`);let n=t/60,r=1-Math.exp(-16*n),i=H;H+=r*(ht-H),H=Math.max(-3.2,Math.min(3.2,H)),$&&Math.abs(H-ht)<.12&&($=!1);let o=-((H-i)/n)*.01;if(U+=(o-U)*r*1.2,O.position.x=H,O.position.y=D+Math.sin(Z*2)*.04,O.rotation.z=Math.max(-.45,Math.min(.45,U)),O.rotation.y=U*.12,O.children[5].material.emissiveIntensity=3.5+Math.sin(Z*25)*1,S.position.copy(O.position),S.position.z+=1,q){At-=t;let e=.5+.5*Math.sin(At*.4);O.children[4].material.emissive.setHex(65535),O.children[4].material.emissiveIntensity=2+e*3,O.children[5].material.emissive.setHex(65535),O.children[5].material.emissiveIntensity=4+e*4,S.color.setHex(65535),S.intensity=4+e*3,At<=0&&(q=!1,O.children[4].material.emissive.setHex(13141),O.children[4].material.emissiveIntensity=1,O.children[5].material.emissive.setHex(62975),O.children[5].material.emissiveIntensity=4,S.color.setHex(62975),S.intensity=3)}V=Math.min(mt,.32+Z*.006),B=(V-.32)/(mt-.32),I=Math.floor(Z*15+z*8),R=Math.min(10,Math.floor(B*9)+1),R!==Pt&&(ne(),a(`#vr-levelhud`).textContent=`LV ${R}`,Pt=R),a(`#vr-speedfill`).style.width=`${B*100}%`,a(`#vr-scorehud`).textContent=I,a(`#vr-speedlines`).style.opacity=B>.5?String((B-.5)*.8):`0`,we.position.x=Math.sin(Z*.4)*5,Te.position.x=Math.cos(Z*.3)*5,we.intensity=3+Math.sin(Z*2)*.8,Te.intensity=3+Math.cos(Z*2.3)*.8,X>0&&(X-=t,X<=0&&(Y=0,a(`#vr-combodisplay`).style.opacity=`0`));let s=Math.max(28,75-R*5);jt-=t,jt<=0&&(Wt(),jt=s),Mt-=t,Mt<=0&&(Gt(),Mt=65+Math.random()*40);let c=!1;for(let e=k.length-1;e>=0;e--){let n=k[e];if(n.group.position.z+=(V+.28)*t,n.mesh.rotation.x+=n.rotSpd.x*t,n.mesh.rotation.y+=n.rotSpd.y*t,n.ring.rotation.z+=.04*t,n.group.position.z>-30&&n.group.position.z<-8){let e=.4+Math.sin(Z*12)*.3;n.ring.material.emissiveIntensity=2+e*3,Math.abs(n.group.position.x-H)<1.5&&(c=!0)}else n.ring.material.emissiveIntensity=1;if(n.group.position.z>14){A(n),k.splice(e,1);continue}if(!q&&n.group.position.z>4&&n.group.position.z<9){let t=Math.abs(n.group.position.x-O.position.x),r=Math.abs(n.group.position.y-O.position.y);if(t<.95&&r<.95){if(ct(n.group.position.x,n.group.position.y,n.group.position.z),A(n),k.splice(e,1),pt--,Kt(),re(),ft(`vr-hitflash`,200),J=20,Y=0,a(`#vr-combodisplay`).style.opacity=`0`,q=!0,At=100,pt<=0){$t();return}continue}t<1.8&&r<1.8&&!n.warned&&(n.warned=!0,ee(),Y++,X=120,Y>=2&&(a(`#vr-combotext`).textContent=`COMBO x${Y}`,a(`#vr-combodisplay`).style.opacity=`1`,I+=Y*5))}}a(`#vr-warningflash`).style.opacity=c?String(.4+Math.sin(Z*15)*.3):`0`;for(let e=j.length-1;e>=0;e--){let n=j[e];if(n.position.z+=(V+.15)*t,n.rotation.y+=.06*t,n.rotation.x+=.04*t,n.position.z>14){st(n),j.splice(e,1);continue}if(n.position.z>4&&n.position.z<9){let t=Math.abs(n.position.x-O.position.x),r=Math.abs(n.position.y-O.position.y);if(t<1.1&&r<1.1){te(),lt(n.position.x,n.position.y,n.position.z),ft(`vr-gemflash`,120),z++;let t=25*Math.max(1,Math.floor(Y/2)+1);I+=t,dt(`+${t}`,`#ffcc00`,600),st(n),j.splice(e,1)}}}ut(t);let l=H*.45;b.position.x+=(l-b.position.x)*.08*t,b.position.y+=(2.8-b.position.y)*.04*t,J>0&&(b.position.x+=Math.sin(Z*60)*(J*.018),b.position.y+=Math.cos(Z*55)*(J*.012),J-=t*1.8,J<0&&(J=0)),b.position.z=9,b.lookAt(H*.5,.8,0),ge(B),v.render(y,b)}function Xt(){k.forEach(e=>A(e)),k.length=0,j.forEach(e=>st(e)),j.length=0,M.forEach(e=>{y.remove(e.mesh)}),M.length=0}let Zt=null;function Qt(){l(),f(),[`vr-menuscreen`,`vr-gameoverscreen`,`vr-pausescreen`].forEach(e=>{a(`#${e}`).style.display=`none`}),a(`#vr-countdownscreen`).style.display=`flex`,a(`#vr-hud`).style.display=`none`,a(`#vr-speedbar`).style.display=`none`,a(`#vr-pausebtn`).style.display=`none`,a(`#vr-thumbcontrols`).style.display=`none`,Xt(),I=0,pt=3,z=0,R=1,Pt=1,a(`#vr-levelhud`).textContent=`LV 1`,Z=0,Nt=0,V=.32,B=0,ht=0,H=0,U=0,Lt=1,$=!1,q=!1,O.visible=!0,Y=0,X=0,J=0,jt=80,Mt=100,Kt(),a(`#vr-combodisplay`).style.opacity=`0`,a(`#vr-warningflash`).style.opacity=`0`,a(`#vr-speedlines`).style.opacity=`0`,F=`countdown`;let e=3,t=a(`#vr-countdownnum`);function n(){t.textContent=e>0?String(e):`GO!`,t.style.animation=`none`,t.offsetHeight,t.style.animation=`vrCountPulse 0.9s ease-out`,e>0?u(440,`square`,.1,.1):u(880,`square`,.15,.15),e--,Zt=setTimeout(e>=0?n:()=>{a(`#vr-countdownscreen`).style.display=`none`,a(`#vr-hud`).style.display=`flex`,a(`#vr-speedbar`).style.display=`flex`,a(`#vr-pausebtn`).style.display=`flex`,i&&(a(`#vr-thumbcontrols`).style.display=`block`),F=`playing`,he(),_e()},950)}n()}function $t(){F=`gameover`,d(),ve(),_(),ct(O.position.x,O.position.y,O.position.z,16729088),ct(O.position.x,O.position.y,O.position.z,16723355),O.visible=!1,J=35;let e=I>L;e&&(L=I,localStorage.setItem(`vrBest`,String(L)),a(`#vr-besthud`).textContent=L,a(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${L}`),bt(vt,I,R,z),a(`#vr-goscore`).textContent=I,a(`#vr-golevel`).textContent=R,a(`#vr-gogems`).textContent=z,a(`#vr-gobest`).textContent=L,a(`#vr-newbestbadge`).style.display=e?`block`:`none`,N.gameover=setTimeout(()=>{a(`#vr-thumbcontrols`).style.display=`none`,a(`#vr-pausebtn`).style.display=`none`,a(`#vr-hud`).style.display=`none`,a(`#vr-speedbar`).style.display=`none`,a(`#vr-gameoverscreen`).style.display=`flex`},600)}function en(){F===`playing`?(F=`paused`,f(),ve(),_(),a(`#vr-pausescreen`).style.display=`flex`,a(`#vr-pausebtn`).textContent=`▶`):F===`paused`&&(F=`playing`,f(),l(),he(),_e(),a(`#vr-pausescreen`).style.display=`none`,a(`#vr-pausebtn`).textContent=`⏸️`)}function tn(){F=`menu`,ve(),_(),Xt(),O.visible=!0,a(`#vr-hud`).style.display=`none`,a(`#vr-speedbar`).style.display=`none`,a(`#vr-pausebtn`).style.display=`none`,a(`#vr-thumbcontrols`).style.display=`none`,a(`#vr-warningflash`).style.opacity=`0`,a(`#vr-speedlines`).style.opacity=`0`,a(`#vr-menubest`).style.opacity=L>0?`1`:`0`,a(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${L}`,K(`vr-menuscreen`)}let nn=[[`#vr-btnplay`,`click`,Qt],[`#vr-btnscores`,`click`,()=>K(`vr-highscorescreen`)],[`#vr-btnsettings`,`click`,()=>K(`vr-settingsscreen`)],[`#vr-btnhow`,`click`,()=>K(`vr-howscreen`)],[`#vr-btnexit`,`click`,kt],[`#vr-btnclearscores`,`click`,xt],[`#vr-btnhsback`,`click`,()=>K(`vr-menuscreen`)],[`#vr-btnsetback`,`click`,()=>K(`vr-menuscreen`)],[`#vr-btnhowback`,`click`,()=>K(`vr-menuscreen`)],[`#vr-btnresume`,`click`,en],[`#vr-btnpausesettings`,`click`,()=>{K(`vr-settingsscreen`),F=`menu`}],[`#vr-btnpausemenu`,`click`,tn],[`#vr-btnagain`,`click`,Qt],[`#vr-btngoscores`,`click`,()=>K(`vr-highscorescreen`)],[`#vr-btngomenu`,`click`,tn],[`#vr-pausebtn`,`click`,en]];return nn.forEach(([e,t,n])=>a(e)?.addEventListener(t,n)),a(`#vr-nameinput`)?.addEventListener(`input`,wt),a(`#vr-musicvol`)?.addEventListener(`input`,e=>Tt(e.target.value)),a(`#vr-sfxvol`)?.addEventListener(`input`,e=>Et(e.target.value)),a(`#vr-musictoggle`)?.addEventListener(`click`,Dt),a(`#vr-sfxtoggle`)?.addEventListener(`click`,Ot),qt=performance.now(),Jt=requestAnimationFrame(Yt),{dispose(){if(cancelAnimationFrame(Jt),window.removeEventListener(`resize`,xe),document.removeEventListener(`keydown`,Ft),document.removeEventListener(`keyup`,It),o.removeEventListener(`touchstart`,Ht),o.removeEventListener(`mousedown`,Ut),nn.forEach(([e,t,n])=>a(e)?.removeEventListener(t,n)),Object.values(N).forEach(e=>clearTimeout(e)),Object.values(zt).forEach(e=>clearTimeout(e)),clearTimeout(ae),clearTimeout(Zt),_(),ve(),c)try{c.close()}catch{}y.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())}),v.dispose(),r(v)}}}function te({onBack:e}){let t=(0,i.useRef)(null),n=(0,i.useRef)(e);return n.current=e,(0,i.useEffect)(()=>{let e=t.current;if(!e)return;let r=null,i=!1;return e.innerHTML=u,c().then(t=>{i||!e.isConnected||(r=ee(e,t,{onBack:()=>n.current?.()}))}).catch(()=>{i||(e.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffe6b0;font-family:sans-serif">Requires an internet connection to load Void Runner.</div>`)}),()=>{i=!0,r?.dispose(),e.innerHTML=``}},[]),(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(`style`,{children:l}),(0,a.jsx)(`div`,{className:`vr-root`,ref:t})]})}export{te as default};