import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{$t as r,Bt as i,Dt as a,H as o,Mt as s,Qt as c,St as l,V as ee,_ as u,bt as te,f as d,it as ne,jt as re,p as f,rt as ie,t as ae,v as oe,yt as se}from"./three.module-Ua8PzK3C.js";import{r as ce}from"./c3dViewport-D3K1ZAxX.js";var p=e(t()),m=n(),h={css:`linear-gradient(180deg,
    #262c3c 0%, #343544 20%, #47404c 38%, #63504f 55%,
    #8a6553 72%, #b8845d 86%, #ddaf80 100%)`,bodyTop:[.048,.052,.078],bodyBot:[.108,.072,.066],rim:[1,.6,.3],halo:[1,.7,.42],star:[.96,.94,.88],bgDim:.5},g=1.35,le=.36,_=.8,ue=3.2,de=3.2,v=6,fe=3.6;function pe(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let e=Math.random()*2-1,o=Math.random()*Math.PI*2,s=Math.sqrt(1-e*e),c=t*(.9+.1*Math.random());n[a*3]=s*Math.cos(o)*c,n[a*3+1]=e*c,n[a*3+2]=s*Math.sin(o)*c,r[a]=Math.random(),i[a]=.6+Math.random()}let a=new f;return a.setAttribute(`position`,new d(n,3)),a.setAttribute(`aRand`,new d(r,1)),a.setAttribute(`aSize`,new d(i,1)),a}function me(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let o=a/e*Math.PI*2+Math.random()*.04,s=(Math.random()-.5)*.22,c=t*(.96+Math.random()*.1);n[a*3]=Math.cos(o)*c,n[a*3+1]=Math.sin(o)*c*.42+s*c,n[a*3+2]=Math.sin(o)*c*.18,r[a]=Math.random(),i[a]=.7+Math.random()*1.2}let a=new f;return a.setAttribute(`position`,new d(n,3)),a.setAttribute(`aRand`,new d(r,1)),a.setAttribute(`aSize`,new d(i,1)),a}function he(e){let t=0;for(let n=0;n<e.length;n++)t=t*31+e.charCodeAt(n)|0;return Math.abs(t)%1e3/1e3}var y=(0,p.forwardRef)(function({planets:e},t){let n=(0,p.useRef)(null),[y,ge]=(0,p.useState)(0),_e=(0,p.useRef)(!1),[b,x]=(0,p.useState)(!1);(0,p.useEffect)(()=>{let e=()=>{let e=document.documentElement.dataset.homeTheme===`light`;_e.current=e,x(e)};e();let t=new MutationObserver(e);return t.observe(document.documentElement,{attributes:!0,attributeFilter:[`data-home-theme`]}),()=>t.disconnect()},[]);let S=(0,p.useRef)({syncPlanets:()=>{},dissolvePlanet:()=>{},reformPlanet:()=>{},pulseCenter:()=>{},setRunning:()=>{}});return(0,p.useImperativeHandle)(t,()=>({dissolvePlanet:e=>S.current.dissolvePlanet(e),reformPlanet:e=>S.current.reformPlanet(e),pulseCenter:()=>S.current.pulseCenter(),setRunning:e=>S.current.setRunning(e)}),[]),(0,p.useEffect)(()=>{let e=n.current;if(!e)return;let t=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,p=window.matchMedia(`(pointer: fine)`).matches,m=p?1:1.45,y=new re,b=new se(55,1,.1,200);b.position.set(0,0,7);let x=new ae({antialias:!0,alpha:!0}),ve=e=>{e.preventDefault(),cancelAnimationFrame(Z),Z=0},ye=()=>{ge(e=>e+1)};x.domElement.addEventListener(`webglcontextlost`,ve,!1),x.domElement.addEventListener(`webglcontextrestored`,ye,!1),x.setPixelRatio(Math.min(window.devicePixelRatio||1,p?1.5:1.35)),x.setClearColor(0,0),x.domElement.style.display=`block`,e.appendChild(x.domElement);let be=pe(p?22e3:16e3,g),xe=[],Se=[];for(let e=0;e<v;e++)xe.push(new r),Se.push(-99);let C=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m},uBreath:{value:1},uLight:{value:0},uBodyTop:{value:new r(...h.bodyTop)},uBodyBot:{value:new r(...h.bodyBot)},uRim:{value:new r(...h.rim)},uTouches:{value:xe},uStarts:{value:Se}},vertexShader:`
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        uniform float uLight;
        uniform vec3 uTouches[${v}];
        uniform float uStarts[${v}];
        varying float vFade;
        varying float vSpark;
        varying float vBand;
        varying vec3 vN;
        void main() {
          vec3 p = position;
          vec3 dir = normalize(position);
          /* idle surface shimmer â€” a bit livelier */
          p += dir * sin(uNow * 1.25 + aRand * 40.0) * (0.028 + uBreath * 0.008);
          float fade = 0.0;
          float spark = 0.0;
          for (int i = 0; i < ${v}; i++) {
            float age = uNow - uStarts[i];
            if (age < 0.0 || age > ${de.toFixed(1)}) continue;
            float life = 1.0 - age / ${de.toFixed(1)};
            float pulse = sin(clamp(age / ${de.toFixed(1)}, 0.0, 1.0) * 3.14159);
            float d = distance(position, uTouches[i]);
            float infl = smoothstep(0.95, 0.0, d) * pulse;
            vec3 rnd = vec3(
              fract(sin(aRand * 127.1) * 43758.5) - 0.5,
              fract(sin(aRand * 311.7) * 43758.5) - 0.5,
              fract(sin(aRand * 74.7)  * 43758.5) - 0.5);
            p += (dir * 1.0 + rnd * 1.3) * infl * (0.85 + aRand * 0.55);
            fade += infl;
            /* Golden shockwave rings expanding along the surface from the
               touch. Two of them, at different speeds: one fast crest that
               races away and a slower inner one chasing it, so an impact reads
               as an event with depth rather than a single expanding circle. */
            float wave = age * 1.45;
            float ring = exp(-pow((d - wave) * 5.5, 2.0)) * life * life;
            float ring2 = exp(-pow((d - wave * 0.58) * 8.5, 2.0)) * life;
            p += dir * (ring * 0.07 + ring2 * 0.04);
            spark += ring + ring2 * 0.55;
          }
          vFade = clamp(fade, 0.0, 1.0);
          vSpark = clamp(spark, 0.0, 1.0);
          vN = normalize(normalMatrix * dir);
          /* slow aurora bands flowing over the surface */
          vBand = 0.5 + 0.5 * sin(dir.y * 6.0 + uNow * 0.45
            + sin(dir.x * 3.5 + uNow * 0.26) * 1.3 + aRand * 0.35);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          /* Light appearance: FINER sprites, not fatter. Coverage is the solid
             body's job now; fat sprites here only turned the limb into a
             pom-pom of chunky dots. Small ones make it atmospheric haze. */
          gl_PointSize = aSize * (19.0 * uBoost * uBreath) * (1.0 - uLight * 0.28) / -mv.z
            * (1.0 + vFade * 1.15 + vSpark * 0.8);
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        uniform float uBoost;
        uniform float uBreath;
        uniform float uLight;
        uniform vec3 uBodyTop;
        uniform vec3 uBodyBot;
        uniform vec3 uRim;
        varying float vFade;
        varying float vSpark;
        varying float vBand;
        varying vec3 vN;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float rim = pow(1.0 - abs(vN.z), 2.0);
          float lightK = 0.5 + 0.5 * dot(vN, normalize(vec3(0.55, 0.45, 0.7)));
          vec3 tint = mix(vec3(0.62, 0.80, 1.0), vec3(1.0, 0.90, 0.74), lightK);
          vec3 col = mix(vec3(1.0), tint, 0.38);
          col += vec3(0.55, 0.75, 1.0) * rim * 0.28;
          col = mix(col, vec3(1.0, 0.86, 0.55), vSpark * 0.85);
          float disc = smoothstep(0.5, 0.06, d);
          float alpha = disc * 0.16 * uBoost * uBreath * (0.80 + 0.30 * vBand)
            * (1.0 - vFade * 0.55) * (1.0 - uDim * 0.96);
          alpha += disc * (rim * 0.03 + vSpark * 0.32) * (1.0 - uDim * 0.96);

          /* Light appearance: the planet is an INK body, not a white one.
             A white planet on a lit sky reads as a hole; the eye wants the
             subject dark against the sunset. Additive light can only ever add,
             so it cannot darken anything â€” the material is flipped to normal
             blending from JS (see the frame loop) and this branch supplies the
             dark body, a warm sunset rim, and enough per-point alpha for the
             overlapping particles to build one solid silhouette. */
          /* The shell wears the body's colours (see the body shader for why a
             dusk silhouette is graded sky-plum to ember rather than black),
             one notch darker so the fuzzy edge reads as atmosphere over the
             limb instead of soot stuck to it. */
          vec3 ink = mix(uBodyBot, uBodyTop, clamp(vN.y * 0.5 + 0.5, 0.0, 1.0));
          /* Directional, not a ring. An even warm rim all the way round is the
             giveaway that nothing is actually lighting this â€” the sun is below
             the horizon, so it can only graze the lower limb. */
          float sunLit = pow(clamp(dot(vN, normalize(vec3(-0.20, -0.90, -0.38))), 0.0, 1.0), 2.2);
          ink += uRim * rim * (0.05 + 0.62 * sunLit);

          /* Touch: the shell tears open into EMBERS.
             On the night sky a touch works by subtraction â€” bright particles
             scatter and fade, and the hole they leave is the effect. That is
             exactly backwards here: a black particle thrown off a black planet
             onto a dark sunset simply vanishes, so the same gesture produced
             almost nothing. So the displaced points heat up instead â€” the
             further they are thrown the brighter they burn, from orange at the
             surface to near-white at the crest of the shockwave, and they keep
             their alpha on the way out so the spray stays a real object. */
          vec3 ember = mix(vec3(0.82, 0.34, 0.13), vec3(0.97, 0.74, 0.46), vSpark);
          ink = mix(ink, ember, clamp(vFade * 1.1, 0.0, 1.0) * 0.88);
          ink = mix(ink, vec3(0.99, 0.86, 0.62), vSpark * 0.8);
          float inkAlpha = disc * (0.68 + 0.10 * vBand) * uBreath
            * (1.0 - vFade * 0.3) + disc * vSpark * 0.45;
          col = mix(col, ink, uLight);
          alpha = mix(alpha, clamp(inkAlpha, 0.0, 1.0), uLight);

          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `}),w=new l(be,C);y.add(w);let Ce=new s({uniforms:{uNow:{value:0},uTop:{value:new r(...h.bodyTop)},uBot:{value:new r(...h.bodyBot)},uRim:{value:new r(...h.rim)}},vertexShader:`
        varying vec3 vNv;
        varying vec3 vObj;
        varying vec3 vView;
        void main() {
          vNv = normalize(normalMatrix * normal);
          vObj = normalize(position);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform vec3 uTop;
        uniform vec3 uBot;
        uniform vec3 uRim;
        varying vec3 vNv;
        varying vec3 vObj;
        varying vec3 vView;
        void main() {
          float fres = pow(1.0 - clamp(dot(vNv, vView), 0.0, 1.0), 2.6);

          /* Vertical grade, read off the sky: plum above, ember below. */
          float h = clamp(vNv.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 body = mix(uBot, uTop, h);

          /* Low-contrast belts so it has volume; they turn with the planet. */
          float band = 0.5 + 0.5 * sin(vObj.y * 6.5 + sin(vObj.x * 3.4) * 1.15);
          float fleck = 0.5 + 0.5 * sin(vObj.x * 17.0 + vObj.z * 13.0);
          body *= 0.88 + 0.21 * band + 0.03 * fleck;

          /*
           * VOIDS â€” the porosity the night-sky planet has.
           *
           * That one is nothing but particles, so you see through it and it
           * breathes. Filling the light-mode version with an opaque body was
           * what made the middle solid, and solid is what made it a disc. So
           * the body keeps its job of stopping the sunset flooding through the
           * particle gaps, but only where it is actually wanted: low-frequency
           * noise opens real holes across the face, and the shell, the halo and
           * the sky show through them.
           *
           * The LIMB is deliberately excluded (the fres term below): voids that
           * eat the outline would dissolve the silhouette and take the
           * atmosphere ring with it. Holes in the face read as a world you can
           * see into; holes in the edge just read as a broken render.
           */
          float n = sin(vObj.x * 2.3 + 1.7) * sin(vObj.y * 2.9 - 0.6) * sin(vObj.z * 2.1 + 2.4);
          n = n * 0.5 + 0.5;
          /* Even the closed regions stay slightly open (0.82), so the sky reads
             faintly through the whole body and the planet breathes the way the
             night one does â€” the voids are the loud version of a porosity that
             is everywhere. */
          float solid = smoothstep(0.34, 0.66, n) * 0.82;
          float alpha = clamp(mix(solid, 0.95, fres * 0.75), 0.0, 1.0);

          /* The sun, below the horizon and slightly behind â€” a warm graze that
             can only land on the lower limb. */
          vec3 sunDir = normalize(vec3(-0.20, -0.90, -0.38));
          float sunK = clamp(dot(vNv, sunDir), 0.0, 1.0);
          body += uRim * pow(sunK, 2.2) * fres * 1.9;

          /* Residual skyglow on the rest of the limb, so the edge never goes
             hard against the sky â€” and so the top of the planet, which can sit
             tone-on-tone with the zenith, still separates from it. */
          body += uRim * fres * 0.20;

          gl_FragColor = vec4(body, alpha);
        }
      `,transparent:!0,depthWrite:!1}),T=new ie(new i(g*.98,64,48),Ce);T.visible=!1,T.renderOrder=-1,y.add(T);let we=me(p?220:480,g*1.38),E=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m},uBreath:{value:1},uLight:{value:0},uWarm:{value:new r(...h.halo)}},vertexShader:`
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float spin = uNow * 0.18 + aRand * 6.28;
          float c = cos(spin * 0.15); float s = sin(spin * 0.15);
          p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
          p *= (0.97 + uBreath * 0.06);
          vAlpha = 0.35 + 0.45 * (0.5 + 0.5 * sin(uNow * 1.4 + aRand * 20.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (22.0 * uBoost * uBreath) / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        uniform float uBoost;
        uniform float uLight;
        uniform vec3 uWarm;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha * 0.08 * uBoost * (1.0 - uDim * 0.9);
          /* At dusk this stops being a cold corona and becomes the planet's
             atmosphere lit from behind â€” the single strongest cue that a dark
             body is a world with air around it rather than a hole in the sky.
             Warm, and stronger, because it now has to survive a lit sky. */
          alpha *= mix(1.0, 2.4, uLight);
          vec3 col = mix(vec3(0.70, 0.80, 0.95), uWarm, uLight);
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `}),D=new l(we,E);y.add(D);let Te=new te(g*(p?3.6:5.2),g*(p?3.6:5.2)),O=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m},uBreath:{value:1},uLight:{value:0}},vertexShader:`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,fragmentShader:`
        uniform float uNow;
        uniform float uDim;
        uniform float uBoost;
        uniform float uBreath;
        uniform float uLight;
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          /* planet silhouette sits at d ~= 0.385 on this plane */
          float rimGlow = exp(-pow((d - 0.40) * 5.0, 2.0));
          float outer = exp(-d * 2.6);
          /* The core is the glow INSIDE the disc. On the night sky it is the
             planet's own light; over a solid dusk body it would just be a
             white smear on the surface, so it switches off â€” and the opaque
             body clips this plane anyway, leaving only the outer halo. */
          float core = exp(-d * d * 26.0) * (1.0 + (uBreath - 1.0) * 6.0)
            * (1.0 - uLight);
          vec3 atm = mix(vec3(0.55, 0.75, 1.0), vec3(0.72, 0.62, 1.0),
            0.5 + 0.5 * sin(uNow * 0.15));
          atm = mix(atm, vec3(1.0, 0.55, 0.26), uLight);
          vec3 col = mix(atm, vec3(1.0, 0.97, 0.9), clamp(core, 0.0, 1.0));
          float a = (rimGlow * 0.028 + outer * 0.006 + core * 0.03)
            * uBoost * (1.0 - uDim * 0.95) * mix(1.0, 2.6, uLight);
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }
      `}),Ee=new ie(Te,O);y.add(Ee);let k=[{r:g*1.55,speed:.5,tiltX:.55,tiltZ:.3,col:[1,.85,.58]},{r:g*1.85,speed:-.36,tiltX:-.72,tiltZ:.18,col:[.62,.85,1]},{r:g*2.15,speed:.27,tiltX:.24,tiltZ:-.6,col:[.85,.7,1]}],A=p?48:60,j=k.length*A,De=new Float32Array(j*3),Oe=new Float32Array(j),M=new Float32Array(j*4),ke=new Float32Array(j*2),N=new Float32Array(j*3);for(let e=0;e<k.length;e++){let t=k[e],n=e/k.length*Math.PI*2;for(let r=0;r<A;r++){let i=e*A+r;Oe[i]=r/(A-1),M[i*4]=t.r,M[i*4+1]=t.speed,M[i*4+2]=n,M[i*4+3]=n*2.7,ke[i*2]=t.tiltX,ke[i*2+1]=t.tiltZ,N[i*3]=t.col[0],N[i*3+1]=t.col[1],N[i*3+2]=t.col[2]}}let P=new f;P.setAttribute(`position`,new d(De,3)),P.setAttribute(`aT`,new d(Oe,1)),P.setAttribute(`aOrb`,new d(M,4)),P.setAttribute(`aTilt`,new d(ke,2)),P.setAttribute(`aCol`,new d(N,3));let F=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m}},vertexShader:`
        attribute float aT;
        attribute vec4 aOrb;
        attribute vec2 aTilt;
        attribute vec3 aCol;
        uniform float uNow;
        uniform float uBoost;
        varying float vA;
        varying vec3 vCol;
        void main() {
          float t = uNow * aOrb.y + aOrb.z - aT * 1.35;
          vec3 p = vec3(cos(t) * aOrb.x, sin(t * 2.0 + aOrb.w) * 0.10, sin(t) * aOrb.x);
          float cx = cos(aTilt.x); float sx = sin(aTilt.x);
          p = vec3(p.x, p.y * cx - p.z * sx, p.y * sx + p.z * cx);
          float cz = cos(aTilt.y); float sz = sin(aTilt.y);
          p = vec3(p.x * cz - p.y * sz, p.x * sz + p.y * cz, p.z);
          vA = pow(1.0 - aT, 1.6) * (0.8 + 0.2 * sin(uNow * 7.0 + aT * 30.0));
          vCol = aCol;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.2 + (1.0 - aT) * 2.2) * 16.0 * uBoost / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        varying float vA;
        varying vec3 vCol;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.06, d) * vA * 0.42 * (1.0 - uDim * 0.92);
          gl_FragColor = vec4(mix(vCol, vec3(0.95, 0.92, 0.85), vA * 0.35), clamp(alpha, 0.0, 1.0));
        }
      `}),Ae=new l(P,F);Ae.frustumCulled=!1,Ae.visible=!t,y.add(Ae);let I=new ie(new i(g*1.12,16,16),new ne({visible:!1}));y.add(I);let L=p?700:900,R=new Float32Array(L*3),je=new Float32Array(L),Me=new Float32Array(L),Ne=new Float32Array(L),Pe=new Float32Array(L);for(let e=0;e<L;e++){let t=Math.random()*2-1,n=Math.random()*Math.PI*2,r=Math.sqrt(1-t*t),i=25+Math.random()*45;R[e*3]=r*Math.cos(n)*i,R[e*3+1]=t*i,R[e*3+2]=r*Math.sin(n)*i,je[e]=Math.random()*Math.PI*2,Me[e]=.2+Math.random()*1.8,Ne[e]=Math.random()<.35?1:.25+Math.random()*.4,Pe[e]=.5+Math.random()*1.3}let z=new f;z.setAttribute(`position`,new d(R,3)),z.setAttribute(`aPhase`,new d(je,1)),z.setAttribute(`aSpeed`,new d(Me,1)),z.setAttribute(`aDepth`,new d(Ne,1)),z.setAttribute(`aSize`,new d(Pe,1));let B=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uCol:{value:new r(.85,.82,.72)}},vertexShader:`
        attribute float aPhase;
        attribute float aSpeed;
        attribute float aDepth;
        attribute float aSize;
        uniform float uNow;
        varying float vAlpha;
        void main() {
          float tw = 0.5 + 0.5 * sin(uNow * aSpeed + aPhase);
          tw = tw * tw;
          vAlpha = (1.0 - aDepth) + aDepth * tw;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 85.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        uniform vec3 uCol;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha * 0.45 * (1.0 - uDim * 0.85);
          gl_FragColor = vec4(uCol, alpha);
        }
      `});y.add(new l(z,B));let V=p?0:350,H=new Float32Array(V*3),Fe=new Float32Array(V),Ie=new Float32Array(V);for(let e=0;e<V;e++)H[e*3]=(Math.random()-.5)*28,H[e*3+1]=(Math.random()-.5)*22,H[e*3+2]=(Math.random()-.5)*18-2,Fe[e]=Math.random(),Ie[e]=1.2+Math.random()*2.8;let U=new f;U.setAttribute(`position`,new d(H,3)),U.setAttribute(`aRand`,new d(Fe,1)),U.setAttribute(`aSize`,new d(Ie,1));let W=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uNow * 0.07 + aRand * 12.0) * 0.35;
          p.y += cos(uNow * 0.09 + aRand * 9.0) * 0.28;
          vAlpha = 0.25 + 0.35 * (0.5 + 0.5 * sin(uNow * 0.4 + aRand * 8.0));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * 55.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha * 0.035 * (1.0 - uDim * 0.9);
          gl_FragColor = vec4(0.55, 0.65, 0.9, clamp(alpha, 0.0, 1.0));
        }
      `}),G=V>0?new l(U,W):null;G&&y.add(G);let K=[];for(let e=0;e<6;e++){let t=new f;t.setAttribute(`position`,new d(new Float32Array(6),3)),t.setAttribute(`color`,new d(new Float32Array([1,1,1,0,0,0]),3));let n=new ee(t,new o({transparent:!0,opacity:0,blending:2,vertexColors:!0,depthWrite:!1,linewidth:1}));n.frustumCulled=!1,y.add(n),K.push({line:n,active:!1,nextAt:1.5+Math.random()*5+e*1.2,start:new r,dir:new r,speed:0,t0:0,dur:0,bright:1})}function Le(){let e=0;for(let t of K)t.active&&e++;return e}function Re(e,t){if(Le()>=2){e.nextAt=t+.8+Math.random()*1.5;return}let n=Math.random()*1.6-.8,r=Math.random()*Math.PI*2,i=Math.sqrt(Math.max(0,1-n*n));e.start.set(i*Math.cos(r),n,i*Math.sin(r)).multiplyScalar(11+Math.random()*8),e.dir.set(Math.random()-.5,-(.25+Math.random()*.55),Math.random()-.5).normalize(),e.speed=11+Math.random()*12,e.dur=1.1+Math.random()*1.4,e.bright=Math.random()<.35?1.35:1,e.t0=t,e.active=!0;let a=e.line.geometry.attributes.color.array;a[0]=1,a[1]=1,a[2]=1,a[3]=.35,a[4]=.45,a[5]=.75,e.line.geometry.attributes.color.needsUpdate=!0}function ze(e){for(let t of K){if(!t.active){e>t.nextAt&&Re(t,e);continue}let n=(e-t.t0)/t.dur;if(n>=1){t.active=!1,t.line.material.opacity=0,t.nextAt=e+2.2+Math.random()*6;continue}let r=t.start.clone().addScaledVector(t.dir,t.speed*(e-t.t0)),i=-(1.8+t.speed*.12)*(.7+t.bright*.25),a=r.clone().addScaledVector(t.dir,i),o=t.line.geometry.attributes.position.array;o[0]=r.x,o[1]=r.y,o[2]=r.z,o[3]=a.x,o[4]=a.y,o[5]=a.z,t.line.geometry.attributes.position.needsUpdate=!0,t.line.material.opacity=Math.sin(n*Math.PI)*.95*t.bright}}let Be=1300,q=pe(Be,le);q.setAttribute(`aPaper`,new d(new Float32Array(Be*3),3));let J=new Map;function Ve(e,t){let n=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDissolve:{value:0},uMorph:{value:0},uDim:{value:0},uBoost:{value:m},uPulse:{value:1},uColor:{value:new oe(e)}},vertexShader:`
      attribute float aRand;
      attribute float aSize;
      attribute vec3 aPaper;
      uniform float uNow;
      uniform float uDissolve;
      uniform float uMorph;
      uniform float uBoost;
      uniform float uPulse;
      varying float vFade;
      varying float vPaper;
      void main() {
        vec3 p = position;
        vec3 dir = normalize(position);
        p += dir * sin(uNow * 1.3 + aRand * 40.0) * 0.014;
        vec3 rnd = vec3(
          fract(sin(aRand * 127.1) * 43758.5) - 0.5,
          fract(sin(aRand * 311.7) * 43758.5) - 0.5,
          fract(sin(aRand * 74.7)  * 43758.5) - 0.5);

        float delay = aRand * 0.4;
        float k = clamp((uDissolve * 1.4 - delay) / (1.0 - delay), 0.0, 1.0);
        k = k * k * (3.0 - 2.0 * k);
        p += (dir * 0.8 + rnd * 1.3) * k * 0.9;

        float md = aRand * 0.45;
        float me = clamp((uMorph - md) / (1.0 - md), 0.0, 1.0);
        me = me * me * (3.0 - 2.0 * me);
        p = mix(p, aPaper, me) + rnd * sin(me * 3.14159) * 1.1;

        vFade = k;
        vPaper = me;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * (1.0 + k * 0.6) * (1.0 - me * 0.25) * (15.0 * uBoost * uPulse) / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,fragmentShader:`
      uniform vec3 uColor;
      uniform float uDim;
      uniform float uBoost;
      uniform float uPulse;
      varying float vFade;
      varying float vPaper;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float alpha = smoothstep(0.5, 0.08, d) * 0.62 * uBoost * uPulse
          * (1.0 - vFade * 0.85) * (1.0 - uDim * 0.85);
        alpha *= (1.0 - vPaper * 0.3);
        float flight = sin(vPaper * 3.14159) * 0.35;
        vec3 col = mix(uColor, vec3(1.0), min(1.0, 0.22 + vFade * 0.55 + flight));
        gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
      }
    `}),r=new l(q,n);return y.add(r),{points:r,mat:n,phase:t}}function He(t){let n=e.clientWidth||1,i=e.clientHeight||1,a=2*(b.position.z-ue)*Math.tan(b.fov*Math.PI/360)/i,o=Math.min(.9*n,560)*a,s=Math.min(.68*i,620)*a,c=q.getAttribute(`aPaper`),l=t.points.position,ee=t.frozenRot,u=new r,te=new r(0,1,0);for(let e=0;e<Be;e++){let t,n;if(e%3==0){let e=Math.random()*2*(o+s);e<o?(t=e-o/2,n=-s/2):e<o+s?(t=o/2,n=e-o-s/2):e<2*o+s?(t=e-o-s-o/2,n=s/2):(t=-o/2,n=e-2*o-s-s/2)}else t=(Math.random()-.5)*o,n=(Math.random()-.5)*s;u.set(t,n,ue+(Math.random()-.5)*.06).sub(l).applyAxisAngle(te,-ee),c.setXYZ(e,u.x,u.y,u.z)}c.needsUpdate=!0}function Ue(){let e=2*(b.position.z-_)*Math.tan(b.fov*Math.PI/360);return{w:e*b.aspect,h:e}}function We(e,t){let{w:n,h:r}=Ue();return{x:(e/100-.5)*n,y:(.5-t/100)*r}}let Ge=-99,Ke=new a,qe=new c,Y=0,X=0,Je=new u;function Ye(e){xe[X].copy(e),Se[X]=Je.getElapsedTime(),X=(X+1)%v}S.current={syncPlanets(e){let t=new Set;for(let n of e){t.add(n.id);let e=J.get(n.id);if(!e){let t=he(String(n.id));e={...Ve(n.color,t),dissolve:0,target:0,morph:0,morphTarget:0,frozenRot:0,removing:!1,phase:t},e.dissolve=1,e.mat.uniforms.uDissolve.value=1,J.set(n.id,e)}e.xPct=n.x,e.yPct=n.y,e.mat.uniforms.uColor.value.set(n.color)}for(let[e,n]of J)!t.has(e)&&!n.removing&&(n.removing=!0,n.target=1)},dissolvePlanet(e){let t=J.get(e);t&&(t.frozenRot=t.points.rotation.y,He(t),t.morphTarget=1)},reformPlanet(e){let t=J.get(e);t&&(t.morphTarget=0)},pulseCenter(){let e=Je.getElapsedTime();if(e-Ge<1.4)return;Ge=e;let t=new r(Math.random()-.5,Math.random()-.5,.6+Math.random()).normalize().multiplyScalar(g);Ye(w.worldToLocal(t))}};function Xe(e){let t=x.domElement.getBoundingClientRect();qe.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),Ke.setFromCamera(qe,b);let n=Ke.intersectObject(I)[0];n&&Ye(w.worldToLocal(n.point.clone()).normalize().multiplyScalar(g))}x.domElement.addEventListener(`pointerdown`,Xe);function Ze(){let t=e.clientWidth||1,n=e.clientHeight||1;b.aspect=t/n,b.updateProjectionMatrix(),x.setSize(t,n)}Ze();let Qe=new ResizeObserver(Ze);Qe.observe(e);let Z=0,Q=!0,$e=0,$=0;function et(){if(!Q)return;Z=requestAnimationFrame(et),Y=Je.getElapsedTime();let e=Math.min(Y-$e,.05);$e=Y;let n=t?0:Y,r=t?1:1+.045*Math.sin(Y*Math.PI*2/fe);C.uniforms.uNow.value=n,C.uniforms.uBreath.value=r,E.uniforms.uNow.value=n,E.uniforms.uBreath.value=r,B.uniforms.uNow.value=n,G&&(W.uniforms.uNow.value=n),O.uniforms.uNow.value=n,O.uniforms.uBreath.value=r,F.uniforms.uNow.value=n,t?(w.scale.setScalar(1),D.scale.setScalar(1),Ee.scale.setScalar(1),I.scale.setScalar(1),b.position.set(0,0,7),b.lookAt(0,0,0)):(w.rotation.y=Y*.05,w.rotation.z=.14+.05*Math.sin(Y*.1),D.rotation.y=Y*.08,w.scale.setScalar(r),D.scale.setScalar(r),Ee.scale.setScalar(r),I.scale.setScalar(r),ze(Y),b.position.x=Math.sin(Y*.07)*.08,b.position.y=Math.cos(Y*.09)*.05,b.lookAt(0,0,0));let i=!1;for(let[,e]of J)e.morphTarget>.5&&(i=!0);let a=2*e;$+=Math.max(-a,Math.min(a,+!!i-$));let o=_e.current,s=o?h.bgDim:0;B.uniforms.uCol.value.set(...o?h.star:[.85,.82,.72]);let c=e=>Math.max(e,s);C.uniforms.uLight.value=+!!o;let l=o?1:2;C.blending!==l&&(C.blending=l),T.visible=o,T.rotation.copy(w.rotation),T.scale.copy(w.scale),E.uniforms.uLight.value=+!!o,O.uniforms.uLight.value=+!!o,C.uniforms.uDim.value=$,E.uniforms.uDim.value=$,B.uniforms.uDim.value=c($),G&&(W.uniforms.uDim.value=c($)),O.uniforms.uDim.value=$,F.uniforms.uDim.value=c($);for(let e of K)e.active&&(e.line.material.opacity*=1-$*.85);for(let[r,i]of J){let a=(i.target>i.dissolve?1.6:.8)*e;i.dissolve+=Math.max(-a,Math.min(a,i.target-i.dissolve));let o=(i.morphTarget>i.morph?1.15:.95)*e;i.morph+=Math.max(-o,Math.min(o,i.morphTarget-i.morph)),i.mat.uniforms.uDissolve.value=i.dissolve,i.mat.uniforms.uMorph.value=i.morph,i.mat.uniforms.uNow.value=n,i.mat.uniforms.uDim.value=i.morphTarget>.5||i.morph>.01?0:$;let s=t?1:1+.06*Math.sin(Y*1.1+i.phase*6.28);i.mat.uniforms.uPulse.value=s;let{x:c,y:l}=We(i.xPct,i.yPct);if(i.morphTarget>.5||i.morph>.01)i.points.position.set(c,l,_),i.points.rotation.y=i.frozenRot,i.points.scale.setScalar(1);else if(t)i.points.position.set(c,l,_),i.points.scale.setScalar(1);else{let e=Math.sin(Y*.85+i.phase*6.28)*.07,t=Math.cos(Y*.55+i.phase*4.2)*.04;i.points.position.set(c+t,l+e,_),i.points.rotation.y=Y*.12+i.phase,i.points.scale.setScalar(s)}i.removing&&i.dissolve>.98&&(y.remove(i.points),i.mat.dispose(),J.delete(r))}x.render(y,b)}et();let tt=document.visibilityState===`visible`,nt=!0;function rt(){let e=tt&&nt;e!==Q&&(e?(Q=!0,Je.getElapsedTime(),et()):(Q=!1,cancelAnimationFrame(Z)))}S.current.setRunning=e=>{nt=!!e,rt()};function it(){tt=document.visibilityState===`visible`,rt()}return document.addEventListener(`visibilitychange`,it),()=>{Q=!1,cancelAnimationFrame(Z),document.removeEventListener(`visibilitychange`,it),x.domElement.removeEventListener(`pointerdown`,Xe),Qe.disconnect();for(let[,e]of J)y.remove(e.points),e.mat.dispose();J.clear(),be.dispose(),C.dispose(),T.geometry.dispose(),Ce.dispose(),we.dispose(),E.dispose(),Te.dispose(),O.dispose(),P.dispose(),F.dispose(),z.dispose(),B.dispose(),G&&(U.dispose(),W.dispose()),q.dispose();for(let e of K)e.line.geometry.dispose(),e.line.material.dispose();I.geometry.dispose(),I.material.dispose(),x.domElement.removeEventListener(`webglcontextlost`,ve),x.domElement.removeEventListener(`webglcontextrestored`,ye),x.dispose(),ce(x),e.removeChild(x.domElement)}},[y]),(0,p.useEffect)(()=>{S.current.syncPlanets(e||[])},[e]),(0,m.jsx)(`div`,{ref:n,"aria-hidden":`true`,style:{position:`absolute`,inset:0,overflow:`hidden`,background:b?h.css:`#000`}})});export{y as default};