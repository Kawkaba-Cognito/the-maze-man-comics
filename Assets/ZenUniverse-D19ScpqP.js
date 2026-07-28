import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{$t as r,Bt as i,Dt as a,H as o,Mt as s,Qt as c,St as l,V as ee,_ as u,bt as te,f as d,it as ne,jt as re,p as f,rt as ie,t as ae,v as oe,yt as se}from"./three.module-Ua8PzK3C.js";import{r as ce}from"./c3dViewport-D3K1ZAxX.js";var p=e(t()),m=n(),h=1.35,le=.36,g=.8,ue=3.2,de=3.2,_=6,fe=3.6;function pe(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let e=Math.random()*2-1,o=Math.random()*Math.PI*2,s=Math.sqrt(1-e*e),c=t*(.9+.1*Math.random());n[a*3]=s*Math.cos(o)*c,n[a*3+1]=e*c,n[a*3+2]=s*Math.sin(o)*c,r[a]=Math.random(),i[a]=.6+Math.random()}let a=new f;return a.setAttribute(`position`,new d(n,3)),a.setAttribute(`aRand`,new d(r,1)),a.setAttribute(`aSize`,new d(i,1)),a}function me(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let o=a/e*Math.PI*2+Math.random()*.04,s=(Math.random()-.5)*.22,c=t*(.96+Math.random()*.1);n[a*3]=Math.cos(o)*c,n[a*3+1]=Math.sin(o)*c*.42+s*c,n[a*3+2]=Math.sin(o)*c*.18,r[a]=Math.random(),i[a]=.7+Math.random()*1.2}let a=new f;return a.setAttribute(`position`,new d(n,3)),a.setAttribute(`aRand`,new d(r,1)),a.setAttribute(`aSize`,new d(i,1)),a}function he(e){let t=0;for(let n=0;n<e.length;n++)t=t*31+e.charCodeAt(n)|0;return Math.abs(t)%1e3/1e3}var v=(0,p.forwardRef)(function({planets:e},t){let n=(0,p.useRef)(null),[v,ge]=(0,p.useState)(0),_e=(0,p.useRef)(!1),[y,b]=(0,p.useState)(!1);(0,p.useEffect)(()=>{let e=()=>{let e=document.documentElement.dataset.homeTheme===`light`;_e.current=e,b(e)};e();let t=new MutationObserver(e);return t.observe(document.documentElement,{attributes:!0,attributeFilter:[`data-home-theme`]}),()=>t.disconnect()},[]);let x=(0,p.useRef)({syncPlanets:()=>{},dissolvePlanet:()=>{},reformPlanet:()=>{},pulseCenter:()=>{},setRunning:()=>{}});return(0,p.useImperativeHandle)(t,()=>({dissolvePlanet:e=>x.current.dissolvePlanet(e),reformPlanet:e=>x.current.reformPlanet(e),pulseCenter:()=>x.current.pulseCenter(),setRunning:e=>x.current.setRunning(e)}),[]),(0,p.useEffect)(()=>{let e=n.current;if(!e)return;let t=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,p=window.matchMedia(`(pointer: fine)`).matches,m=p?1:1.45,v=new re,y=new se(55,1,.1,200);y.position.set(0,0,7);let b=new ae({antialias:!0,alpha:!0}),ve=e=>{e.preventDefault(),cancelAnimationFrame(Z),Z=0},ye=()=>{ge(e=>e+1)};b.domElement.addEventListener(`webglcontextlost`,ve,!1),b.domElement.addEventListener(`webglcontextrestored`,ye,!1),b.setPixelRatio(Math.min(window.devicePixelRatio||1,p?1.5:1.35)),b.setClearColor(0,0),b.domElement.style.display=`block`,e.appendChild(b.domElement);let be=pe(p?22e3:16e3,h),xe=[],Se=[];for(let e=0;e<_;e++)xe.push(new r),Se.push(-99);let S=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m},uBreath:{value:1},uLight:{value:0},uTouches:{value:xe},uStarts:{value:Se}},vertexShader:`
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        uniform float uLight;
        uniform vec3 uTouches[${_}];
        uniform float uStarts[${_}];
        varying float vFade;
        varying float vSpark;
        varying float vBand;
        varying vec3 vN;
        void main() {
          vec3 p = position;
          vec3 dir = normalize(position);
          /* idle surface shimmer — a bit livelier */
          p += dir * sin(uNow * 1.25 + aRand * 40.0) * (0.028 + uBreath * 0.008);
          float fade = 0.0;
          float spark = 0.0;
          for (int i = 0; i < ${_}; i++) {
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
          /* Light appearance: fatter sprites. Black is only as black as its
             coverage — at the night-sky point size the gaps between particles
             let the sunset through and the body reads as speckle rather than
             a planet. Roughly doubling the disc closes them. */
          gl_PointSize = aSize * (19.0 * uBoost * uBreath) * (1.0 + uLight * 1.0) / -mv.z
            * (1.0 + vFade * 1.15 + vSpark * 0.8);
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        uniform float uBoost;
        uniform float uBreath;
        uniform float uLight;
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
             so it cannot darken anything — the material is flipped to normal
             blending from JS (see the frame loop) and this branch supplies the
             dark body, a warm sunset rim, and enough per-point alpha for the
             overlapping particles to build one solid silhouette. */
          vec3 ink = mix(vec3(0.0), vec3(0.02, 0.02, 0.03), lightK);
          ink += vec3(0.40, 0.22, 0.12) * rim * 0.14;

          /* Touch: the shell tears open into EMBERS.
             On the night sky a touch works by subtraction — bright particles
             scatter and fade, and the hole they leave is the effect. That is
             exactly backwards here: a black particle thrown off a black planet
             onto a dark sunset simply vanishes, so the same gesture produced
             almost nothing. So the displaced points heat up instead — the
             further they are thrown the brighter they burn, from orange at the
             surface to near-white at the crest of the shockwave, and they keep
             their alpha on the way out so the spray stays a real object. */
          vec3 ember = mix(vec3(1.0, 0.48, 0.12), vec3(1.0, 0.85, 0.52), vSpark);
          ink = mix(ink, ember, clamp(vFade * 1.25, 0.0, 1.0));
          ink = mix(ink, vec3(1.0, 0.94, 0.72), vSpark * 0.95);
          float inkAlpha = disc * (0.90 + 0.04 * vBand) * uBreath
            * (1.0 - vFade * 0.12) + disc * vSpark * 0.6;
          col = mix(col, ink, uLight);
          alpha = mix(alpha, clamp(inkAlpha, 0.0, 1.0), uLight);

          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `}),C=new l(be,S);v.add(C);let w=new ie(new i(h*.98,48,32),new ne({color:0}));w.visible=!1,v.add(w);let Ce=me(p?220:480,h*1.38),T=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m},uBreath:{value:1}},vertexShader:`
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
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha * 0.08 * uBoost * (1.0 - uDim * 0.9);
          gl_FragColor = vec4(0.7, 0.8, 0.95, clamp(alpha, 0.0, 1.0));
        }
      `}),E=new l(Ce,T);v.add(E);let we=new te(h*(p?3.6:5.2),h*(p?3.6:5.2)),D=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m},uBreath:{value:1}},vertexShader:`
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
        varying vec2 vUv;
        void main() {
          float d = length(vUv - 0.5) * 2.0;
          /* planet silhouette sits at d ~= 0.385 on this plane */
          float rimGlow = exp(-pow((d - 0.40) * 5.0, 2.0));
          float outer = exp(-d * 2.6);
          float core = exp(-d * d * 26.0) * (1.0 + (uBreath - 1.0) * 6.0);
          vec3 atm = mix(vec3(0.55, 0.75, 1.0), vec3(0.72, 0.62, 1.0),
            0.5 + 0.5 * sin(uNow * 0.15));
          vec3 col = mix(atm, vec3(1.0, 0.97, 0.9), clamp(core, 0.0, 1.0));
          float a = (rimGlow * 0.028 + outer * 0.006 + core * 0.03)
            * uBoost * (1.0 - uDim * 0.95);
          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
        }
      `}),Te=new ie(we,D);v.add(Te);let O=[{r:h*1.55,speed:.5,tiltX:.55,tiltZ:.3,col:[1,.85,.58]},{r:h*1.85,speed:-.36,tiltX:-.72,tiltZ:.18,col:[.62,.85,1]},{r:h*2.15,speed:.27,tiltX:.24,tiltZ:-.6,col:[.85,.7,1]}],k=p?48:60,A=O.length*k,Ee=new Float32Array(A*3),De=new Float32Array(A),j=new Float32Array(A*4),Oe=new Float32Array(A*2),M=new Float32Array(A*3);for(let e=0;e<O.length;e++){let t=O[e],n=e/O.length*Math.PI*2;for(let r=0;r<k;r++){let i=e*k+r;De[i]=r/(k-1),j[i*4]=t.r,j[i*4+1]=t.speed,j[i*4+2]=n,j[i*4+3]=n*2.7,Oe[i*2]=t.tiltX,Oe[i*2+1]=t.tiltZ,M[i*3]=t.col[0],M[i*3+1]=t.col[1],M[i*3+2]=t.col[2]}}let N=new f;N.setAttribute(`position`,new d(Ee,3)),N.setAttribute(`aT`,new d(De,1)),N.setAttribute(`aOrb`,new d(j,4)),N.setAttribute(`aTilt`,new d(Oe,2)),N.setAttribute(`aCol`,new d(M,3));let P=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:m}},vertexShader:`
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
      `}),ke=new l(N,P);ke.frustumCulled=!1,ke.visible=!t,v.add(ke);let F=new ie(new i(h*1.12,16,16),new ne({visible:!1}));v.add(F);let I=p?700:900,L=new Float32Array(I*3),Ae=new Float32Array(I),je=new Float32Array(I),Me=new Float32Array(I),Ne=new Float32Array(I);for(let e=0;e<I;e++){let t=Math.random()*2-1,n=Math.random()*Math.PI*2,r=Math.sqrt(1-t*t),i=25+Math.random()*45;L[e*3]=r*Math.cos(n)*i,L[e*3+1]=t*i,L[e*3+2]=r*Math.sin(n)*i,Ae[e]=Math.random()*Math.PI*2,je[e]=.2+Math.random()*1.8,Me[e]=Math.random()<.35?1:.25+Math.random()*.4,Ne[e]=.5+Math.random()*1.3}let R=new f;R.setAttribute(`position`,new d(L,3)),R.setAttribute(`aPhase`,new d(Ae,1)),R.setAttribute(`aSpeed`,new d(je,1)),R.setAttribute(`aDepth`,new d(Me,1)),R.setAttribute(`aSize`,new d(Ne,1));let z=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
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
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.1, d) * vAlpha * 0.45 * (1.0 - uDim * 0.85);
          gl_FragColor = vec4(0.85, 0.82, 0.72, alpha);
        }
      `});v.add(new l(R,z));let B=p?0:350,V=new Float32Array(B*3),Pe=new Float32Array(B),Fe=new Float32Array(B);for(let e=0;e<B;e++)V[e*3]=(Math.random()-.5)*28,V[e*3+1]=(Math.random()-.5)*22,V[e*3+2]=(Math.random()-.5)*18-2,Pe[e]=Math.random(),Fe[e]=1.2+Math.random()*2.8;let H=new f;H.setAttribute(`position`,new d(V,3)),H.setAttribute(`aRand`,new d(Pe,1)),H.setAttribute(`aSize`,new d(Fe,1));let U=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
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
      `}),W=B>0?new l(H,U):null;W&&v.add(W);let G=[];for(let e=0;e<6;e++){let t=new f;t.setAttribute(`position`,new d(new Float32Array(6),3)),t.setAttribute(`color`,new d(new Float32Array([1,1,1,0,0,0]),3));let n=new ee(t,new o({transparent:!0,opacity:0,blending:2,vertexColors:!0,depthWrite:!1,linewidth:1}));n.frustumCulled=!1,v.add(n),G.push({line:n,active:!1,nextAt:1.5+Math.random()*5+e*1.2,start:new r,dir:new r,speed:0,t0:0,dur:0,bright:1})}function Ie(){let e=0;for(let t of G)t.active&&e++;return e}function Le(e,t){if(Ie()>=2){e.nextAt=t+.8+Math.random()*1.5;return}let n=Math.random()*1.6-.8,r=Math.random()*Math.PI*2,i=Math.sqrt(Math.max(0,1-n*n));e.start.set(i*Math.cos(r),n,i*Math.sin(r)).multiplyScalar(11+Math.random()*8),e.dir.set(Math.random()-.5,-(.25+Math.random()*.55),Math.random()-.5).normalize(),e.speed=11+Math.random()*12,e.dur=1.1+Math.random()*1.4,e.bright=Math.random()<.35?1.35:1,e.t0=t,e.active=!0;let a=e.line.geometry.attributes.color.array;a[0]=1,a[1]=1,a[2]=1,a[3]=.35,a[4]=.45,a[5]=.75,e.line.geometry.attributes.color.needsUpdate=!0}function Re(e){for(let t of G){if(!t.active){e>t.nextAt&&Le(t,e);continue}let n=(e-t.t0)/t.dur;if(n>=1){t.active=!1,t.line.material.opacity=0,t.nextAt=e+2.2+Math.random()*6;continue}let r=t.start.clone().addScaledVector(t.dir,t.speed*(e-t.t0)),i=-(1.8+t.speed*.12)*(.7+t.bright*.25),a=r.clone().addScaledVector(t.dir,i),o=t.line.geometry.attributes.position.array;o[0]=r.x,o[1]=r.y,o[2]=r.z,o[3]=a.x,o[4]=a.y,o[5]=a.z,t.line.geometry.attributes.position.needsUpdate=!0,t.line.material.opacity=Math.sin(n*Math.PI)*.95*t.bright}}let ze=1300,K=pe(ze,le);K.setAttribute(`aPaper`,new d(new Float32Array(ze*3),3));let q=new Map;function Be(e,t){let n=new s({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDissolve:{value:0},uMorph:{value:0},uDim:{value:0},uBoost:{value:m},uPulse:{value:1},uColor:{value:new oe(e)}},vertexShader:`
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
    `}),r=new l(K,n);return v.add(r),{points:r,mat:n,phase:t}}function Ve(t){let n=e.clientWidth||1,i=e.clientHeight||1,a=2*(y.position.z-ue)*Math.tan(y.fov*Math.PI/360)/i,o=Math.min(.9*n,560)*a,s=Math.min(.68*i,620)*a,c=K.getAttribute(`aPaper`),l=t.points.position,ee=t.frozenRot,u=new r,te=new r(0,1,0);for(let e=0;e<ze;e++){let t,n;if(e%3==0){let e=Math.random()*2*(o+s);e<o?(t=e-o/2,n=-s/2):e<o+s?(t=o/2,n=e-o-s/2):e<2*o+s?(t=e-o-s-o/2,n=s/2):(t=-o/2,n=e-2*o-s-s/2)}else t=(Math.random()-.5)*o,n=(Math.random()-.5)*s;u.set(t,n,ue+(Math.random()-.5)*.06).sub(l).applyAxisAngle(te,-ee),c.setXYZ(e,u.x,u.y,u.z)}c.needsUpdate=!0}function He(){let e=2*(y.position.z-g)*Math.tan(y.fov*Math.PI/360);return{w:e*y.aspect,h:e}}function Ue(e,t){let{w:n,h:r}=He();return{x:(e/100-.5)*n,y:(.5-t/100)*r}}let We=-99,Ge=new a,Ke=new c,J=0,Y=0,X=new u;function qe(e){xe[Y].copy(e),Se[Y]=X.getElapsedTime(),Y=(Y+1)%_}x.current={syncPlanets(e){let t=new Set;for(let n of e){t.add(n.id);let e=q.get(n.id);if(!e){let t=he(String(n.id));e={...Be(n.color,t),dissolve:0,target:0,morph:0,morphTarget:0,frozenRot:0,removing:!1,phase:t},e.dissolve=1,e.mat.uniforms.uDissolve.value=1,q.set(n.id,e)}e.xPct=n.x,e.yPct=n.y,e.mat.uniforms.uColor.value.set(n.color)}for(let[e,n]of q)!t.has(e)&&!n.removing&&(n.removing=!0,n.target=1)},dissolvePlanet(e){let t=q.get(e);t&&(t.frozenRot=t.points.rotation.y,Ve(t),t.morphTarget=1)},reformPlanet(e){let t=q.get(e);t&&(t.morphTarget=0)},pulseCenter(){let e=X.getElapsedTime();if(e-We<1.4)return;We=e;let t=new r(Math.random()-.5,Math.random()-.5,.6+Math.random()).normalize().multiplyScalar(h);qe(C.worldToLocal(t))}};function Je(e){let t=b.domElement.getBoundingClientRect();Ke.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),Ge.setFromCamera(Ke,y);let n=Ge.intersectObject(F)[0];n&&qe(C.worldToLocal(n.point.clone()).normalize().multiplyScalar(h))}b.domElement.addEventListener(`pointerdown`,Je);function Ye(){let t=e.clientWidth||1,n=e.clientHeight||1;y.aspect=t/n,y.updateProjectionMatrix(),b.setSize(t,n)}Ye();let Xe=new ResizeObserver(Ye);Xe.observe(e);let Z=0,Q=!0,Ze=0,$=0;function Qe(){if(!Q)return;Z=requestAnimationFrame(Qe),J=X.getElapsedTime();let e=Math.min(J-Ze,.05);Ze=J;let n=t?0:J,r=t?1:1+.045*Math.sin(J*Math.PI*2/fe);S.uniforms.uNow.value=n,S.uniforms.uBreath.value=r,T.uniforms.uNow.value=n,T.uniforms.uBreath.value=r,z.uniforms.uNow.value=n,W&&(U.uniforms.uNow.value=n),D.uniforms.uNow.value=n,D.uniforms.uBreath.value=r,P.uniforms.uNow.value=n,t?(C.scale.setScalar(1),E.scale.setScalar(1),Te.scale.setScalar(1),F.scale.setScalar(1),y.position.set(0,0,7),y.lookAt(0,0,0)):(C.rotation.y=J*.05,C.rotation.z=.14+.05*Math.sin(J*.1),E.rotation.y=J*.08,C.scale.setScalar(r),E.scale.setScalar(r),Te.scale.setScalar(r),F.scale.setScalar(r),Re(J),y.position.x=Math.sin(J*.07)*.08,y.position.y=Math.cos(J*.09)*.05,y.lookAt(0,0,0));let i=!1;for(let[,e]of q)e.morphTarget>.5&&(i=!0);let a=2*e;$+=Math.max(-a,Math.min(a,+!!i-$));let o=_e.current,s=o?.62:0,c=e=>Math.max(e,s);S.uniforms.uLight.value=+!!o;let l=o?1:2;S.blending!==l&&(S.blending=l),w.visible=o,w.rotation.copy(C.rotation),w.scale.copy(C.scale),S.uniforms.uDim.value=$,T.uniforms.uDim.value=c($),z.uniforms.uDim.value=c($),W&&(U.uniforms.uDim.value=c($)),D.uniforms.uDim.value=o?Math.max($,.94):$,P.uniforms.uDim.value=c($);for(let e of G)e.active&&(e.line.material.opacity*=1-$*.85);for(let[r,i]of q){let a=(i.target>i.dissolve?1.6:.8)*e;i.dissolve+=Math.max(-a,Math.min(a,i.target-i.dissolve));let o=(i.morphTarget>i.morph?1.15:.95)*e;i.morph+=Math.max(-o,Math.min(o,i.morphTarget-i.morph)),i.mat.uniforms.uDissolve.value=i.dissolve,i.mat.uniforms.uMorph.value=i.morph,i.mat.uniforms.uNow.value=n,i.mat.uniforms.uDim.value=i.morphTarget>.5||i.morph>.01?0:$;let s=t?1:1+.06*Math.sin(J*1.1+i.phase*6.28);i.mat.uniforms.uPulse.value=s;let{x:c,y:l}=Ue(i.xPct,i.yPct);if(i.morphTarget>.5||i.morph>.01)i.points.position.set(c,l,g),i.points.rotation.y=i.frozenRot,i.points.scale.setScalar(1);else if(t)i.points.position.set(c,l,g),i.points.scale.setScalar(1);else{let e=Math.sin(J*.85+i.phase*6.28)*.07,t=Math.cos(J*.55+i.phase*4.2)*.04;i.points.position.set(c+t,l+e,g),i.points.rotation.y=J*.12+i.phase,i.points.scale.setScalar(s)}i.removing&&i.dissolve>.98&&(v.remove(i.points),i.mat.dispose(),q.delete(r))}b.render(v,y)}Qe();let $e=document.visibilityState===`visible`,et=!0;function tt(){let e=$e&&et;e!==Q&&(e?(Q=!0,X.getElapsedTime(),Qe()):(Q=!1,cancelAnimationFrame(Z)))}x.current.setRunning=e=>{et=!!e,tt()};function nt(){$e=document.visibilityState===`visible`,tt()}return document.addEventListener(`visibilitychange`,nt),()=>{Q=!1,cancelAnimationFrame(Z),document.removeEventListener(`visibilitychange`,nt),b.domElement.removeEventListener(`pointerdown`,Je),Xe.disconnect();for(let[,e]of q)v.remove(e.points),e.mat.dispose();q.clear(),be.dispose(),S.dispose(),w.geometry.dispose(),w.material.dispose(),Ce.dispose(),T.dispose(),we.dispose(),D.dispose(),N.dispose(),P.dispose(),R.dispose(),z.dispose(),W&&(H.dispose(),U.dispose()),K.dispose();for(let e of G)e.line.geometry.dispose(),e.line.material.dispose();F.geometry.dispose(),F.material.dispose(),b.domElement.removeEventListener(`webglcontextlost`,ve),b.domElement.removeEventListener(`webglcontextrestored`,ye),b.dispose(),ce(b),e.removeChild(b.domElement)}},[v]),(0,p.useEffect)(()=>{x.current.syncPlanets(e||[])},[e]),(0,m.jsx)(`div`,{ref:n,"aria-hidden":`true`,style:{position:`absolute`,inset:0,overflow:`hidden`,background:y?`linear-gradient(180deg,
              #1b1033 0%, #33163f 18%, #5c2449 36%,
              #96384b 54%, #cb5c3f 70%, #e8894a 83%,
              #f4b16b 93%, #f8cf9c 100%)`:`#000`}})});export{v as default};