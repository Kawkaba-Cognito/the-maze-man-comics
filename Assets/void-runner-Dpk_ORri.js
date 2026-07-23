import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";var r=e(t()),i=n(),a=`https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`,o=`sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==`;function s(){return window.THREE?Promise.resolve(window.THREE):new Promise((e,t)=>{let n=document.getElementById(`vr-three-cdn`);if(n){n.addEventListener(`load`,()=>e(window.THREE)),n.addEventListener(`error`,()=>t(Error(`three-cdn-failed`)));return}let r=document.createElement(`script`);r.id=`vr-three-cdn`,r.src=a,r.integrity=o,r.crossOrigin=`anonymous`,r.onload=()=>e(window.THREE),r.onerror=()=>{r.remove(),t(Error(`three-cdn-failed`))},document.head.appendChild(r)})}var c=`
.vr-root {
  --vr-pink:   #ff2d9b;
  --vr-cyan:   #00f5ff;
  --vr-purple: #b44fff;
  --vr-gold:   #ffcc00;
  --vr-dark-bg: #04000f;
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
`,l=`
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
`;function ee(e,t,{onBack:n}){let r=typeof navigator<`u`&&(navigator.maxTouchPoints>0||`ontouchstart`in window),i=t=>e.querySelector(t),a=i(`#vr-canvas`),o=window.AudioContext||window.webkitAudioContext,s=null;function c(){s||=new o,s.state===`suspended`&&s.resume()}function l(e,t,n,r,i=0){if(!s)return;let a=s.createOscillator(),o=s.createGain();a.connect(o),o.connect(s.destination),a.type=t,a.frequency.setValueAtTime(e,s.currentTime+i),o.gain.setValueAtTime(r,s.currentTime+i),o.gain.exponentialRampToValueAtTime(.001,s.currentTime+i+n),a.start(s.currentTime+i),a.stop(s.currentTime+i+n+.05)}function ee(){if(!s)return;let e=s.createOscillator(),t=s.createGain();e.connect(t),t.connect(s.destination),e.type=`sawtooth`,e.frequency.setValueAtTime(800,s.currentTime),e.frequency.exponentialRampToValueAtTime(200,s.currentTime+.15),t.gain.setValueAtTime(.12,s.currentTime),t.gain.exponentialRampToValueAtTime(.001,s.currentTime+.15),e.start(),e.stop(s.currentTime+.2)}function u(){[523,659,784,1047].forEach((e,t)=>l(e,`sine`,.12,.08,t*.05))}function te(){s&&[60,80,100,120].forEach(e=>{let t=s.createBuffer(1,s.sampleRate*.5,s.sampleRate),n=t.getChannelData(0);for(let e=0;e<n.length;e++)n[e]=(Math.random()*2-1)*(1-e/n.length);let r=s.createBufferSource(),i=s.createGain(),a=s.createBiquadFilter();r.buffer=t,a.type=`lowpass`,a.frequency.value=e*30,r.connect(a),a.connect(i),i.connect(s.destination),i.gain.setValueAtTime(.3,s.currentTime),i.gain.exponentialRampToValueAtTime(.001,s.currentTime+.6),r.start()})}function ne(){[400,500,600,800,1e3].forEach((e,t)=>l(e,`square`,.1,.06,t*.08))}function re(){l(120,`sawtooth`,.3,.15),l(80,`square`,.4,.1,.05)}function d(){G&&s&&l(440,`sine`,.08,.06*gt)}let ie=!1,ae=null,f=null,oe=[[220,261.63,329.63],[174.61,220,261.63],[130.81,164.81,196],[196,246.94,293.66]],se=[[440,523,659,523,440,392,440,523],[349,440,523,440,349,330,349,440],[262,330,392,330,262,247,262,330],[392,494,587,494,392,370,392,494]],p=60/128,m=p*4;function ce(e,t){let n=e.createOscillator(),r=e.createGain();n.connect(r),r.connect(f),n.frequency.setValueAtTime(180,t),n.frequency.exponentialRampToValueAtTime(40,t+.08),r.gain.setValueAtTime(.55,t),r.gain.exponentialRampToValueAtTime(.001,t+.18),n.start(t),n.stop(t+.2)}function le(e,t){let n=e.createBuffer(1,e.sampleRate*.12,e.sampleRate),r=n.getChannelData(0);for(let e=0;e<r.length;e++)r[e]=Math.random()*2-1;let i=e.createBufferSource(),a=e.createBiquadFilter(),o=e.createGain();i.buffer=n,a.type=`bandpass`,a.frequency.value=2400,a.Q.value=.8,i.connect(a),a.connect(o),o.connect(f),o.gain.setValueAtTime(.22,t),o.gain.exponentialRampToValueAtTime(.001,t+.14),i.start(t)}function ue(e,t,n=!1){let r=e.createBuffer(1,e.sampleRate*(n?.18:.04),e.sampleRate),i=r.getChannelData(0);for(let e=0;e<i.length;e++)i[e]=Math.random()*2-1;let a=e.createBufferSource(),o=e.createBiquadFilter(),s=e.createGain();a.buffer=r,o.type=`highpass`,o.frequency.value=9e3,a.connect(o),o.connect(s),s.connect(f),s.gain.setValueAtTime(n?.1:.07,t),s.gain.exponentialRampToValueAtTime(.001,t+(n?.18:.04)),a.start(t)}function de(e,t,n,r){let i=e.createOscillator(),a=e.createGain(),o=e.createBiquadFilter();i.type=`sawtooth`,i.frequency.value=t/2,o.type=`lowpass`,o.frequency.value=600,o.Q.value=3,i.connect(o),o.connect(a),a.connect(f),a.gain.setValueAtTime(.18,n),a.gain.setValueAtTime(.14,n+r*.7),a.gain.exponentialRampToValueAtTime(.001,n+r),i.start(n),i.stop(n+r+.05)}function fe(e,t,n,r){let i=e.createOscillator(),a=e.createGain();i.type=`square`,i.frequency.value=t,i.connect(a),a.connect(f),a.gain.setValueAtTime(.06,n),a.gain.exponentialRampToValueAtTime(.001,n+r*.9),i.start(n),i.stop(n+r)}function pe(e,t,n,r){t.forEach(t=>{let i=e.createOscillator(),a=e.createGain();i.type=`sine`,i.frequency.value=t,i.connect(a),a.connect(f),a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(.04,n+.3),a.gain.setValueAtTime(.04,n+r-.3),a.gain.linearRampToValueAtTime(0,n+r),i.start(n),i.stop(n+r+.1)})}function me(e,t,n){if(!ie)return;let r=oe[n%oe.length],i=se[n%se.length];pe(e,r,t,m),de(e,r[0],t,m/2),de(e,r[0],t+m/2,m/2);for(let n=0;n<4;n++){let r=t+n*p;(n===0||n===2)&&ce(e,r),(n===1||n===3)&&le(e,r),ue(e,r,!1),ue(e,r+p/2,n===1)}i.forEach((n,r)=>{fe(e,n,t+r*p/2,p/2*.85)}),ae=setTimeout(()=>{me(e,t+m,n+1)},(m-.1)*1e3)}let h=null;function he(){if(!s||h)return;let e=s.createOscillator(),t=s.createGain();e.type=`sawtooth`,e.frequency.value=60,t.gain.value=.018,e.connect(t),t.connect(s.destination),e.start(),h={osc1:e,gain:t}}function ge(e){if(!h)return;let t=60+e*80;h.osc1.frequency.setTargetAtTime(t,s.currentTime,.4),h.gain.gain.setTargetAtTime(.018+e*.012,s.currentTime,.4)}function _e(){!s||ie||!W||(ie=!0,f=s.createGain(),f.gain.value=ht*.55,f.connect(s.destination),me(s,s.currentTime+.05,0))}function g(){ie=!1,clearTimeout(ae),f&&(f.gain.setTargetAtTime(0,s.currentTime,.2),setTimeout(()=>{f=null},500))}function ve(){h&&(h.gain.gain.setTargetAtTime(0,s.currentTime,.15),setTimeout(()=>{try{h.osc1.stop()}catch{}h=null},400))}let _=new t.WebGLRenderer({canvas:a,antialias:!r});_.setPixelRatio(Math.min(window.devicePixelRatio||1,r?1.5:2)),_.shadowMap.enabled=!r,r||(_.shadowMap.type=t.PCFSoftShadowMap),_.setSize(window.innerWidth,window.innerHeight),_.setClearColor(262159);let v=new t.Scene;v.fog=new t.FogExp2(524304,.028);let y=new t.PerspectiveCamera(70,window.innerWidth/window.innerHeight,.1,300);y.position.set(0,2.8,9),y.lookAt(0,.5,0);let ye=y.position.z-6;function be(){let e=y.aspect,t=2*Math.atan(11/(2*ye)),n=2*Math.atan(Math.tan(t/2)/e)*(180/Math.PI);n=Math.max(70,Math.min(100,n)),y.fov=n,y.updateProjectionMatrix()}be();function xe(){y.aspect=window.innerWidth/window.innerHeight,be(),_.setSize(window.innerWidth,window.innerHeight)}window.addEventListener(`resize`,xe);function b(e){if(!r)return new t.MeshStandardMaterial(e);let{roughness:n,metalness:i,...a}=e;return new t.MeshLambertMaterial(a)}let Se=new t.AmbientLight(655392,2);v.add(Se);let Ce=new t.DirectionalLight(10040319,2.5);Ce.position.set(5,12,8),Ce.castShadow=!r,v.add(Ce);let x=new t.PointLight(16723355,4,25);x.position.set(-6,3,2),v.add(x);let we=new t.PointLight(62975,4,25);we.position.set(6,3,2),v.add(we);let S=new t.PointLight(62975,3,10);v.add(S);let Te=new t.BufferGeometry,Ee=r?1800:3e3,De=new Float32Array(Ee*3),Oe=new Float32Array(Ee*3);for(let e=0;e<Ee;e++){De[e*3]=(Math.random()-.5)*500,De[e*3+1]=(Math.random()-.5)*200,De[e*3+2]=(Math.random()-.5)*500-100;let t=Math.random();Oe[e*3]=t>.7?0:1,Oe[e*3+1]=t>.7?1:t>.4?0:.5,Oe[e*3+2]=1}Te.setAttribute(`position`,new t.BufferAttribute(De,3)),Te.setAttribute(`color`,new t.BufferAttribute(Oe,3));let ke=new t.PointsMaterial({size:.5,vertexColors:!0,transparent:!0,opacity:.85}),Ae=new t.Points(Te,ke);v.add(Ae);let je=6.5,C=r?20:30,w=new Float32Array(C);for(let e=0;e<C;e++)w[e]=-e*5;let Me=new t.PlaneGeometry(9,5,8,1);Me.rotateX(-Math.PI/2);let Ne=b({color:327704,roughness:1,metalness:0,emissive:327704}),Pe=new t.InstancedMesh(Me,Ne,C);Pe.receiveShadow=!r,v.add(Pe);let Fe=new t.BoxGeometry(.04,.02,5),Ie=b({color:4456652,emissive:4456652,emissiveIntensity:2}),Le=new t.InstancedMesh(Fe,Ie,C*9);v.add(Le);let Re=new t.BoxGeometry(.06,.06,5),ze=b({color:16723355,emissive:16723355,emissiveIntensity:1.5}),Be=b({color:62975,emissive:62975,emissiveIntensity:1.5}),Ve=new t.InstancedMesh(Re,ze,C),He=new t.InstancedMesh(Re,Be,C);v.add(Ve),v.add(He);let Ue=b({color:2228326,emissive:2228326,emissiveIntensity:1}),We=new t.BoxGeometry(.1,je,.1),T=new t.InstancedMesh(We,Ue,C*2);v.add(T);let Ge=new t.BoxGeometry(9,.1,.1),Ke=new t.InstancedMesh(Ge,Ue,C);v.add(Ke);let qe=new t.Matrix4,Je=new t.Vector3,Ye=new t.Quaternion,Xe=new t.Vector3(1,1,1);function E(e,t,n,r,i){Je.set(n,r,i),qe.compose(Je,Ye,Xe),e.setMatrixAt(t,qe)}function Ze(){for(let e=0;e<C;e++){let t=w[e];E(Pe,e,0,-1.1,t);for(let n=0;n<9;n++)E(Le,e*9+n,n-4,-1.09,t);E(Ve,e,-9/2,-1.05,t),E(He,e,9/2,-1.05,t);let n=t-5/2;E(T,e*2,-9/2,je/2-1.1,n),E(T,e*2+1,9/2,je/2-1.1,n),E(Ke,e,0,je-1.1,n)}Pe.instanceMatrix.needsUpdate=!0,Le.instanceMatrix.needsUpdate=!0,Ve.instanceMatrix.needsUpdate=!0,He.instanceMatrix.needsUpdate=!0,T.instanceMatrix.needsUpdate=!0,Ke.instanceMatrix.needsUpdate=!0}Ze();function Qe(){let e=new t.Group,n=b({color:13692671,emissive:2245734,roughness:.2,metalness:.9}),i=new t.Mesh(new t.ConeGeometry(.42,1.8,8),n);i.rotation.x=Math.PI/2,i.castShadow=!r,e.add(i);let a=b({color:3368618,emissive:1122884,roughness:.3,metalness:.9}),o=new t.Mesh(new t.BoxGeometry(2.2,.08,.7),a);o.position.z=.35,o.castShadow=!r,e.add(o);let s=b({color:16723355,emissive:16723355,emissiveIntensity:3});[-1.1,1.1].forEach(n=>{let r=new t.Mesh(new t.BoxGeometry(.08,.08,.6),s);r.position.set(n,0,.35),e.add(r)});let c=b({color:8969727,emissive:13141,roughness:.1,metalness:.2,transparent:!0,opacity:.75}),l=new t.Mesh(new t.SphereGeometry(.24,8,6),c);l.scale.z=1.6,l.position.z=-.45,e.add(l);let ee=b({color:62975,emissive:62975,emissiveIntensity:4,transparent:!0,opacity:.85}),u=new t.Mesh(new t.SphereGeometry(.22,8,8),ee);u.position.z=1,e.add(u);let te=b({color:35071,emissive:17663,emissiveIntensity:3,transparent:!0,opacity:.5}),ne=new t.Mesh(new t.ConeGeometry(.2,1,8),te);return ne.rotation.x=-Math.PI/2,ne.position.z=1.55,e.add(ne),e}let D=.3,O=Qe();O.position.set(0,D,6),O.frustumCulled=!1,O.traverse(e=>{e.frustumCulled=!1}),v.add(O);let $e=[],k=[],et=[b({color:16723245,emissive:6684672,roughness:.3,metalness:.7}),b({color:16737792,emissive:5579264,roughness:.3,metalness:.7}),b({color:13369599,emissive:4456550,roughness:.3,metalness:.7}),b({color:16711782,emissive:5570594,roughness:.3,metalness:.7}),b({color:16729088,emissive:6689024,roughness:.3,metalness:.7})],tt=[new t.BoxGeometry(1.3,1.3,1.3),new t.OctahedronGeometry(.85),new t.TetrahedronGeometry(1),new t.IcosahedronGeometry(.75),new t.TorusGeometry(.65,.22,8,14)];function nt(){if($e.length>0){let e=$e.pop();return e.group.visible=!0,e}let e=Math.floor(Math.random()*tt.length),n=Math.floor(Math.random()*et.length),i=new t.Mesh(tt[e],et[n]);i.castShadow=!r;let a=b({color:et[n].color,emissive:et[n].color,emissiveIntensity:3,transparent:!0,opacity:.8}),o=new t.Mesh(new t.TorusGeometry(1,.04,4,20),a);o.name=`ring`;let s=new t.Group;return s.add(i),s.add(o),v.add(s),{group:s,mesh:i,ring:o}}function rt(e){e.group.visible=!1,v.remove(e.group),$e.push(e)}for(let e=0;e<20;e++)rt(nt());let it=[],A=[],at=b({color:16763904,emissive:16746496,emissiveIntensity:2.5,roughness:.1,metalness:.8});function ot(){if(it.length>0){let e=it.pop();return e.visible=!0,v.add(e),e}let e=new t.Mesh(new t.OctahedronGeometry(.38),at);return e.castShadow=!r,v.add(e),e}function st(e){e.visible=!1,v.remove(e),it.push(e)}let j=[];function ct(e,n,r,i=16729088){for(let a=0;a<18;a++){let a=new t.Mesh(new t.SphereGeometry(.08+Math.random()*.14,4,4),b({color:i,emissive:i,emissiveIntensity:3,transparent:!0,opacity:1}));a.position.set(e,n,r),v.add(a);let o=Math.random()*Math.PI*2,s=Math.random()*Math.PI,c=Math.random()*.35+.1;j.push({mesh:a,vx:Math.sin(s)*Math.cos(o)*c,vy:Math.sin(s)*Math.sin(o)*c,vz:Math.cos(s)*c,life:1,decay:.025+Math.random()*.02})}}function lt(e,n,r){for(let i=0;i<10;i++){let i=new t.Mesh(new t.OctahedronGeometry(.06),b({color:16763904,emissive:16755200,emissiveIntensity:4,transparent:!0,opacity:1}));i.position.set(e,n,r),v.add(i);let a=Math.random()*Math.PI*2;j.push({mesh:i,vx:Math.cos(a)*.18,vy:.15+Math.random()*.1,vz:Math.sin(a)*.18,life:1,decay:.04})}}function ut(e){for(let t=j.length-1;t>=0;t--){let n=j[t];if(n.mesh.position.x+=n.vx*e,n.mesh.position.y+=n.vy*e,n.mesh.position.z+=n.vz*e,n.vy-=.008*e,n.life-=n.decay*e,n.life<=0){v.remove(n.mesh),n.mesh.geometry.dispose(),j.splice(t,1);continue}n.mesh.material.opacity=Math.max(0,n.life),n.mesh.scale.setScalar(n.life)}}let M={};function dt(e,t,n=700){let r=i(`#vr-popup`);r.textContent=e,r.style.color=t,r.style.opacity=`1`,r.style.transform=`translateX(-50%) scale(1)`,clearTimeout(M.popup),M.popup=setTimeout(()=>{r.style.opacity=`0`,r.style.transform=`translateX(-50%) scale(0.8)`},n)}function ft(e,t=150){let n=i(`#${e}`);n.style.opacity=`1`;let r=`flash-${e}`;clearTimeout(M[r]),M[r]=setTimeout(()=>{n.style.opacity=`0`},t)}let N=[-3.2,0,3.2],P=`menu`,F=0,I=parseInt(localStorage.getItem(`vrBest`)||`0`,10),pt=3,L=1,R=0,z=0,B=.32,mt=.85,V=0,H=0,U=0,W=!0,G=!0,ht=.7,gt=.8,_t=localStorage.getItem(`vrName`)||`PILOT`;function vt(){try{return JSON.parse(localStorage.getItem(`vrScores`)||`[]`)}catch{return[]}}function yt(e,t,n,r){let i=vt();i.push({name:e.toUpperCase().slice(0,10),score:t,level:n,gems:r,date:new Date().toLocaleDateString()}),i.sort((e,t)=>t.score-e.score),i.splice(5),localStorage.setItem(`vrScores`,JSON.stringify(i))}function bt(){window.confirm(`Clear all high scores?`)&&(localStorage.removeItem(`vrScores`),xt(),d())}function xt(){let e=vt(),t=i(`#vr-hstable`);if(!e.length){t.innerHTML=`<div class="vr-hs-empty">NO SCORES YET<br>BE THE FIRST PILOT!</div>`;return}let n=[`vr-gold-rank`,`vr-silver`,`vr-bronze`,`vr-other`,`vr-other`],r=[`1ST`,`2ND`,`3RD`,`4TH`,`5TH`];t.innerHTML=e.map((e,t)=>`
      <div class="vr-hs-row">
        <div class="vr-hs-rank ${n[t]}">${r[t]}</div>
        <div class="vr-hs-name">${e.name}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.25);letter-spacing:1px">LV${e.level}</div>
        <div class="vr-hs-score">${e.score}</div>
      </div>`).join(``)}let St=[`vr-menuscreen`,`vr-highscorescreen`,`vr-settingsscreen`,`vr-howscreen`,`vr-countdownscreen`,`vr-pausescreen`,`vr-gameoverscreen`];function K(e){d(),St.forEach(e=>{let t=i(`#${e}`);t&&(t.style.display=`none`)});let t=i(`#${e}`);t&&(t.style.display=`flex`),e===`vr-highscorescreen`&&xt(),e===`vr-settingsscreen`&&(i(`#vr-nameinput`).value=_t,i(`#vr-musicvol`).value=Math.round(ht*100),i(`#vr-sfxvol`).value=Math.round(gt*100),i(`#vr-musictoggle`).textContent=W?`ON`:`OFF`,i(`#vr-musictoggle`).className=`vr-toggle-btn `+(W?`vr-on`:`vr-off`),i(`#vr-sfxtoggle`).textContent=G?`ON`:`OFF`,i(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(G?`vr-on`:`vr-off`))}function Ct(){_t=i(`#vr-nameinput`).value||`PILOT`,localStorage.setItem(`vrName`,_t)}function wt(e){ht=e/100,f&&f.gain.setTargetAtTime(ht*.55,s.currentTime,.1)}function Tt(e){gt=e/100}function Et(){W=!W,i(`#vr-musictoggle`).textContent=W?`ON`:`OFF`,i(`#vr-musictoggle`).className=`vr-toggle-btn `+(W?`vr-on`:`vr-off`),W?P===`playing`&&(c(),_e()):g()}function Dt(){G=!G,i(`#vr-sfxtoggle`).textContent=G?`ON`:`OFF`,i(`#vr-sfxtoggle`).className=`vr-toggle-btn `+(G?`vr-on`:`vr-off`)}function Ot(){d(),n?.()}let q=!1,kt=0,J=0,Y=0,X=0,Z=0,At=0,jt=0,Mt=0,Nt=1,Q={left:!1,right:!1};i(`#vr-besthud`).textContent=I,i(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${I}`,I>0&&(i(`#vr-menubest`).style.opacity=`1`);function Pt(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Q.left=!0),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Q.right=!0),(e.key===`p`||e.key===`P`||e.key===`Escape`)&&(P===`playing`||P===`paused`)&&$t(),(e.key===` `||e.key===`Enter`)&&(P===`gameover`||P===`menu`)&&Zt()}function Ft(e){(e.key===`ArrowLeft`||e.key===`a`||e.key===`A`)&&(Q.left=!1),(e.key===`ArrowRight`||e.key===`d`||e.key===`D`)&&(Q.right=!1)}document.addEventListener(`keydown`,Pt),document.addEventListener(`keyup`,Ft);let It=1,$=!1;function Lt(e){if($)return;let t=It+(e===`left`?-1:1);t<0||t>=N.length||(It=t,V=N[It],$=!0,G&&s&&l(e===`left`?300:340,`sine`,.04,.03*gt),zt(e))}let Rt={};function zt(e){let t=i(e===`left`?`#vr-btnleft`:`#vr-btnright`);t&&(t.classList.add(`vr-pressed`),clearTimeout(Rt[e]),Rt[e]=setTimeout(()=>t.classList.remove(`vr-pressed`),140))}function Bt(e){if(P!==`playing`)return;let t=a.getBoundingClientRect();Lt(e<t.left+t.width/2?`left`:`right`)}function Vt(e){c(),!(!e.touches||!e.touches.length)&&Bt(e.touches[0].clientX)}function Ht(e){c(),Bt(e.clientX)}a.addEventListener(`touchstart`,Vt,{passive:!0}),a.addEventListener(`mousedown`,Ht);function Ut(){let e=nt(),n=Math.floor(Math.random()*N.length),r=N[n],i=D+(Math.random()-.5)*1.5;e.group.position.set(r,i,-90),e.group.visible=!0,v.add(e.group),e.mesh.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI,0),e.ring.rotation.x=Math.random(),e.rotSpd=new t.Vector3((Math.random()-.5)*.06,(Math.random()-.5)*.06,(Math.random()-.5)*.04),e.lane=n,e.warned=!1,k.push(e)}function Wt(){let e=ot(),t=Math.floor(Math.random()*N.length);e.position.set(N[t],D+(Math.random()-.5)*1.7,-95),e.rotation.set(0,0,0),A.push(e)}function Gt(){for(let e=1;e<=3;e++)i(`#vr-h${e}`).classList.toggle(`vr-dead`,e>pt)}let Kt=0,qt=null;function Jt(e){qt=requestAnimationFrame(Jt);let t=Math.min((e-Kt)/16.667,3);if(Kt=e,Mt++,Z=Mt/60,Ae.rotation.y+=8e-5*t,P===`playing`){for(let e=0;e<C;e++)w[e]+=B*t,w[e]>12&&(w[e]-=C*5);Ze()}if(P===`menu`||P===`gameover`){O.position.y=D+Math.sin(Z*1.2)*.2,O.rotation.y=Math.sin(Z*.4)*.25,y.position.x=Math.sin(Z*.2)*1.5,y.lookAt(0,.5,0),S.position.copy(O.position),ut(t),_.render(v,y);return}if(P===`paused`||P===`countdown`){_.render(v,y);return}Q.left&&Lt(`left`),Q.right&&Lt(`right`);let n=t/60,r=1-Math.exp(-16*n),a=H;H+=r*(V-H),H=Math.max(-3.2,Math.min(3.2,H)),$&&Math.abs(H-V)<.12&&($=!1);let o=-((H-a)/n)*.01;if(U+=(o-U)*r*1.2,O.position.x=H,O.position.y=D+Math.sin(Z*2)*.04,O.rotation.z=Math.max(-.45,Math.min(.45,U)),O.rotation.y=U*.12,O.children[5].material.emissiveIntensity=3.5+Math.sin(Z*25)*1,S.position.copy(O.position),S.position.z+=1,q){kt-=t;let e=.5+.5*Math.sin(kt*.4);O.children[4].material.emissive.setHex(65535),O.children[4].material.emissiveIntensity=2+e*3,O.children[5].material.emissive.setHex(65535),O.children[5].material.emissiveIntensity=4+e*4,S.color.setHex(65535),S.intensity=4+e*3,kt<=0&&(q=!1,O.children[4].material.emissive.setHex(13141),O.children[4].material.emissiveIntensity=1,O.children[5].material.emissive.setHex(62975),O.children[5].material.emissiveIntensity=4,S.color.setHex(62975),S.intensity=3)}B=Math.min(mt,.32+Z*.006),z=(B-.32)/(mt-.32),F=Math.floor(Z*15+R*8),L=Math.min(10,Math.floor(z*9)+1),L!==Nt&&(ne(),i(`#vr-levelhud`).textContent=`LV ${L}`,Nt=L),i(`#vr-speedfill`).style.width=`${z*100}%`,i(`#vr-scorehud`).textContent=F,i(`#vr-speedlines`).style.opacity=z>.5?String((z-.5)*.8):`0`,x.position.x=Math.sin(Z*.4)*5,we.position.x=Math.cos(Z*.3)*5,x.intensity=3+Math.sin(Z*2)*.8,we.intensity=3+Math.cos(Z*2.3)*.8,X>0&&(X-=t,X<=0&&(Y=0,i(`#vr-combodisplay`).style.opacity=`0`));let s=Math.max(28,75-L*5);At-=t,At<=0&&(Ut(),At=s),jt-=t,jt<=0&&(Wt(),jt=65+Math.random()*40);let c=!1;for(let e=k.length-1;e>=0;e--){let n=k[e];if(n.group.position.z+=(B+.28)*t,n.mesh.rotation.x+=n.rotSpd.x*t,n.mesh.rotation.y+=n.rotSpd.y*t,n.ring.rotation.z+=.04*t,n.group.position.z>-30&&n.group.position.z<-8){let e=.4+Math.sin(Z*12)*.3;n.ring.material.emissiveIntensity=2+e*3,Math.abs(n.group.position.x-H)<1.5&&(c=!0)}else n.ring.material.emissiveIntensity=1;if(n.group.position.z>14){rt(n),k.splice(e,1);continue}if(!q&&n.group.position.z>4&&n.group.position.z<9){let t=Math.abs(n.group.position.x-O.position.x),r=Math.abs(n.group.position.y-O.position.y);if(t<.95&&r<.95){if(ct(n.group.position.x,n.group.position.y,n.group.position.z),rt(n),k.splice(e,1),pt--,Gt(),re(),ft(`vr-hitflash`,200),J=20,Y=0,i(`#vr-combodisplay`).style.opacity=`0`,q=!0,kt=100,pt<=0){Qt();return}continue}t<1.8&&r<1.8&&!n.warned&&(n.warned=!0,ee(),Y++,X=120,Y>=2&&(i(`#vr-combotext`).textContent=`COMBO x${Y}`,i(`#vr-combodisplay`).style.opacity=`1`,F+=Y*5))}}i(`#vr-warningflash`).style.opacity=c?String(.4+Math.sin(Z*15)*.3):`0`;for(let e=A.length-1;e>=0;e--){let n=A[e];if(n.position.z+=(B+.15)*t,n.rotation.y+=.06*t,n.rotation.x+=.04*t,n.position.z>14){st(n),A.splice(e,1);continue}if(n.position.z>4&&n.position.z<9){let t=Math.abs(n.position.x-O.position.x),r=Math.abs(n.position.y-O.position.y);if(t<1.1&&r<1.1){u(),lt(n.position.x,n.position.y,n.position.z),ft(`vr-gemflash`,120),R++;let t=25*Math.max(1,Math.floor(Y/2)+1);F+=t,dt(`+${t}`,`#ffcc00`,600),st(n),A.splice(e,1)}}}ut(t);let l=H*.45;y.position.x+=(l-y.position.x)*.08*t,y.position.y+=(2.8-y.position.y)*.04*t,J>0&&(y.position.x+=Math.sin(Z*60)*(J*.018),y.position.y+=Math.cos(Z*55)*(J*.012),J-=t*1.8,J<0&&(J=0)),y.position.z=9,y.lookAt(H*.5,.8,0),ge(z),_.render(v,y)}function Yt(){k.forEach(e=>rt(e)),k.length=0,A.forEach(e=>st(e)),A.length=0,j.forEach(e=>{v.remove(e.mesh)}),j.length=0}let Xt=null;function Zt(){c(),d(),[`vr-menuscreen`,`vr-gameoverscreen`,`vr-pausescreen`].forEach(e=>{i(`#${e}`).style.display=`none`}),i(`#vr-countdownscreen`).style.display=`flex`,i(`#vr-hud`).style.display=`none`,i(`#vr-speedbar`).style.display=`none`,i(`#vr-pausebtn`).style.display=`none`,i(`#vr-thumbcontrols`).style.display=`none`,Yt(),F=0,pt=3,R=0,L=1,Nt=1,i(`#vr-levelhud`).textContent=`LV 1`,Z=0,Mt=0,B=.32,z=0,V=0,H=0,U=0,It=1,$=!1,q=!1,O.visible=!0,Y=0,X=0,J=0,At=80,jt=100,Gt(),i(`#vr-combodisplay`).style.opacity=`0`,i(`#vr-warningflash`).style.opacity=`0`,i(`#vr-speedlines`).style.opacity=`0`,P=`countdown`;let e=3,t=i(`#vr-countdownnum`);function n(){t.textContent=e>0?String(e):`GO!`,t.style.animation=`none`,t.offsetHeight,t.style.animation=`vrCountPulse 0.9s ease-out`,e>0?l(440,`square`,.1,.1):l(880,`square`,.15,.15),e--,Xt=setTimeout(e>=0?n:()=>{i(`#vr-countdownscreen`).style.display=`none`,i(`#vr-hud`).style.display=`flex`,i(`#vr-speedbar`).style.display=`flex`,i(`#vr-pausebtn`).style.display=`flex`,r&&(i(`#vr-thumbcontrols`).style.display=`block`),P=`playing`,he(),_e()},950)}n()}function Qt(){P=`gameover`,te(),ve(),g(),ct(O.position.x,O.position.y,O.position.z,16729088),ct(O.position.x,O.position.y,O.position.z,16723355),O.visible=!1,J=35;let e=F>I;e&&(I=F,localStorage.setItem(`vrBest`,String(I)),i(`#vr-besthud`).textContent=I,i(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${I}`),yt(_t,F,L,R),i(`#vr-goscore`).textContent=F,i(`#vr-golevel`).textContent=L,i(`#vr-gogems`).textContent=R,i(`#vr-gobest`).textContent=I,i(`#vr-newbestbadge`).style.display=e?`block`:`none`,M.gameover=setTimeout(()=>{i(`#vr-thumbcontrols`).style.display=`none`,i(`#vr-pausebtn`).style.display=`none`,i(`#vr-hud`).style.display=`none`,i(`#vr-speedbar`).style.display=`none`,i(`#vr-gameoverscreen`).style.display=`flex`},600)}function $t(){P===`playing`?(P=`paused`,d(),ve(),g(),i(`#vr-pausescreen`).style.display=`flex`,i(`#vr-pausebtn`).textContent=`▶`):P===`paused`&&(P=`playing`,d(),c(),he(),_e(),i(`#vr-pausescreen`).style.display=`none`,i(`#vr-pausebtn`).textContent=`⏸️`)}function en(){P=`menu`,ve(),g(),Yt(),O.visible=!0,i(`#vr-hud`).style.display=`none`,i(`#vr-speedbar`).style.display=`none`,i(`#vr-pausebtn`).style.display=`none`,i(`#vr-thumbcontrols`).style.display=`none`,i(`#vr-warningflash`).style.opacity=`0`,i(`#vr-speedlines`).style.opacity=`0`,i(`#vr-menubest`).style.opacity=I>0?`1`:`0`,i(`#vr-menubest`).textContent=`\u{1F3C6} BEST: ${I}`,K(`vr-menuscreen`)}let tn=[[`#vr-btnplay`,`click`,Zt],[`#vr-btnscores`,`click`,()=>K(`vr-highscorescreen`)],[`#vr-btnsettings`,`click`,()=>K(`vr-settingsscreen`)],[`#vr-btnhow`,`click`,()=>K(`vr-howscreen`)],[`#vr-btnexit`,`click`,Ot],[`#vr-btnclearscores`,`click`,bt],[`#vr-btnhsback`,`click`,()=>K(`vr-menuscreen`)],[`#vr-btnsetback`,`click`,()=>K(`vr-menuscreen`)],[`#vr-btnhowback`,`click`,()=>K(`vr-menuscreen`)],[`#vr-btnresume`,`click`,$t],[`#vr-btnpausesettings`,`click`,()=>{K(`vr-settingsscreen`),P=`menu`}],[`#vr-btnpausemenu`,`click`,en],[`#vr-btnagain`,`click`,Zt],[`#vr-btngoscores`,`click`,()=>K(`vr-highscorescreen`)],[`#vr-btngomenu`,`click`,en],[`#vr-pausebtn`,`click`,$t]];return tn.forEach(([e,t,n])=>i(e)?.addEventListener(t,n)),i(`#vr-nameinput`)?.addEventListener(`input`,Ct),i(`#vr-musicvol`)?.addEventListener(`input`,e=>wt(e.target.value)),i(`#vr-sfxvol`)?.addEventListener(`input`,e=>Tt(e.target.value)),i(`#vr-musictoggle`)?.addEventListener(`click`,Et),i(`#vr-sfxtoggle`)?.addEventListener(`click`,Dt),Kt=performance.now(),qt=requestAnimationFrame(Jt),{dispose(){if(cancelAnimationFrame(qt),window.removeEventListener(`resize`,xe),document.removeEventListener(`keydown`,Pt),document.removeEventListener(`keyup`,Ft),a.removeEventListener(`touchstart`,Vt),a.removeEventListener(`mousedown`,Ht),tn.forEach(([e,t,n])=>i(e)?.removeEventListener(t,n)),Object.values(M).forEach(e=>clearTimeout(e)),Object.values(Rt).forEach(e=>clearTimeout(e)),clearTimeout(ae),clearTimeout(Xt),g(),ve(),s)try{s.close()}catch{}v.traverse(e=>{e.geometry&&e.geometry.dispose(),e.material&&(Array.isArray(e.material)?e.material.forEach(e=>e.dispose()):e.material.dispose())}),_.dispose()}}}function u({onBack:e}){let t=(0,r.useRef)(null),n=(0,r.useRef)(e);return n.current=e,(0,r.useEffect)(()=>{let e=t.current;if(!e)return;let r=null,i=!1;return e.innerHTML=l,s().then(t=>{i||!e.isConnected||(r=ee(e,t,{onBack:()=>n.current?.()}))}).catch(()=>{i||(e.innerHTML=`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;color:#ffe6b0;font-family:sans-serif">Requires an internet connection to load Void Runner.</div>`)}),()=>{i=!0,r?.dispose(),e.innerHTML=``}},[]),(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(`style`,{children:c}),(0,i.jsx)(`div`,{className:`vr-root`,ref:t})]})}export{u as default};