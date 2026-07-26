import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{At as r,Et as i,H as a,Qt as o,V as s,Zt as c,_ as l,f as u,it as d,jt as f,p,rt as ee,t as te,v as ne,vt as re,xt as m,yt as ie,zt as ae}from"./three.module-C36HyJKG.js";import{r as oe}from"./c3dViewport-D3K1ZAxX.js";var h=e(t()),g=n(),_=1.35,se=.36,v=.8,ce=3.2,le=3.2,y=6,ue=3.6;function de(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let e=Math.random()*2-1,o=Math.random()*Math.PI*2,s=Math.sqrt(1-e*e),c=t*(.9+.1*Math.random());n[a*3]=s*Math.cos(o)*c,n[a*3+1]=e*c,n[a*3+2]=s*Math.sin(o)*c,r[a]=Math.random(),i[a]=.6+Math.random()}let a=new p;return a.setAttribute(`position`,new u(n,3)),a.setAttribute(`aRand`,new u(r,1)),a.setAttribute(`aSize`,new u(i,1)),a}function fe(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let o=a/e*Math.PI*2+Math.random()*.04,s=(Math.random()-.5)*.22,c=t*(.96+Math.random()*.1);n[a*3]=Math.cos(o)*c,n[a*3+1]=Math.sin(o)*c*.42+s*c,n[a*3+2]=Math.sin(o)*c*.18,r[a]=Math.random(),i[a]=.7+Math.random()*1.2}let a=new p;return a.setAttribute(`position`,new u(n,3)),a.setAttribute(`aRand`,new u(r,1)),a.setAttribute(`aSize`,new u(i,1)),a}function pe(e){let t=0;for(let n=0;n<e.length;n++)t=t*31+e.charCodeAt(n)|0;return Math.abs(t)%1e3/1e3}var b=(0,h.forwardRef)(function({planets:e},t){let n=(0,h.useRef)(null),b=(0,h.useRef)({syncPlanets:()=>{},dissolvePlanet:()=>{},reformPlanet:()=>{},pulseCenter:()=>{}});return(0,h.useImperativeHandle)(t,()=>({dissolvePlanet:e=>b.current.dissolvePlanet(e),reformPlanet:e=>b.current.reformPlanet(e),pulseCenter:()=>b.current.pulseCenter()}),[]),(0,h.useEffect)(()=>{let e=n.current;if(!e)return;let t=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,h=window.matchMedia(`(pointer: fine)`).matches,g=h?1:1.45,x=new r,S=new re(55,1,.1,200);S.position.set(0,0,7);let C=new te({antialias:!0});C.setPixelRatio(Math.min(window.devicePixelRatio||1,h?1.5:1.35)),C.setClearColor(0,1),C.domElement.style.display=`block`,e.appendChild(C.domElement);let me=de(h?22e3:16e3,_),he=[],ge=[];for(let e=0;e<y;e++)he.push(new o),ge.push(-99);let w=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:g},uBreath:{value:1},uTouches:{value:he},uStarts:{value:ge}},vertexShader:`
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        uniform vec3 uTouches[${y}];
        uniform float uStarts[${y}];
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
          for (int i = 0; i < ${y}; i++) {
            float age = uNow - uStarts[i];
            if (age < 0.0 || age > ${le.toFixed(1)}) continue;
            float life = 1.0 - age / ${le.toFixed(1)};
            float pulse = sin(clamp(age / ${le.toFixed(1)}, 0.0, 1.0) * 3.14159);
            float d = distance(position, uTouches[i]);
            float infl = smoothstep(0.95, 0.0, d) * pulse;
            vec3 rnd = vec3(
              fract(sin(aRand * 127.1) * 43758.5) - 0.5,
              fract(sin(aRand * 311.7) * 43758.5) - 0.5,
              fract(sin(aRand * 74.7)  * 43758.5) - 0.5);
            p += (dir * 1.0 + rnd * 1.3) * infl * (0.85 + aRand * 0.55);
            fade += infl;
            /* golden shockwave ring expanding along the surface from the touch */
            float wave = age * 1.45;
            float ring = exp(-pow((d - wave) * 5.5, 2.0)) * life * life;
            p += dir * ring * 0.07;
            spark += ring;
          }
          vFade = clamp(fade, 0.0, 1.0);
          vSpark = clamp(spark, 0.0, 1.0);
          vN = normalize(normalMatrix * dir);
          /* slow aurora bands flowing over the surface */
          vBand = 0.5 + 0.5 * sin(dir.y * 6.0 + uNow * 0.45
            + sin(dir.x * 3.5 + uNow * 0.26) * 1.3 + aRand * 0.35);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (19.0 * uBoost * uBreath) / -mv.z
            * (1.0 + vFade * 1.15 + vSpark * 0.8);
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        uniform float uBoost;
        uniform float uBreath;
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
          gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
        }
      `}),T=new m(me,w);x.add(T);let _e=fe(h?220:480,_*1.38),E=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:g},uBreath:{value:1}},vertexShader:`
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
      `}),D=new m(_e,E);x.add(D);let ve=new ie(_*(h?3.6:5.2),_*(h?3.6:5.2)),O=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:g},uBreath:{value:1}},vertexShader:`
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
      `}),ye=new ee(ve,O);x.add(ye);let k=[{r:_*1.55,speed:.5,tiltX:.55,tiltZ:.3,col:[1,.85,.58]},{r:_*1.85,speed:-.36,tiltX:-.72,tiltZ:.18,col:[.62,.85,1]},{r:_*2.15,speed:.27,tiltX:.24,tiltZ:-.6,col:[.85,.7,1]}],A=h?48:60,j=k.length*A,be=new Float32Array(j*3),xe=new Float32Array(j),M=new Float32Array(j*4),Se=new Float32Array(j*2),N=new Float32Array(j*3);for(let e=0;e<k.length;e++){let t=k[e],n=e/k.length*Math.PI*2;for(let r=0;r<A;r++){let i=e*A+r;xe[i]=r/(A-1),M[i*4]=t.r,M[i*4+1]=t.speed,M[i*4+2]=n,M[i*4+3]=n*2.7,Se[i*2]=t.tiltX,Se[i*2+1]=t.tiltZ,N[i*3]=t.col[0],N[i*3+1]=t.col[1],N[i*3+2]=t.col[2]}}let P=new p;P.setAttribute(`position`,new u(be,3)),P.setAttribute(`aT`,new u(xe,1)),P.setAttribute(`aOrb`,new u(M,4)),P.setAttribute(`aTilt`,new u(Se,2)),P.setAttribute(`aCol`,new u(N,3));let F=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:g}},vertexShader:`
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
      `}),Ce=new m(P,F);Ce.frustumCulled=!1,Ce.visible=!t,x.add(Ce);let I=new ee(new ae(_*1.12,16,16),new d({visible:!1}));x.add(I);let L=h?700:900,R=new Float32Array(L*3),we=new Float32Array(L),Te=new Float32Array(L),Ee=new Float32Array(L),De=new Float32Array(L);for(let e=0;e<L;e++){let t=Math.random()*2-1,n=Math.random()*Math.PI*2,r=Math.sqrt(1-t*t),i=25+Math.random()*45;R[e*3]=r*Math.cos(n)*i,R[e*3+1]=t*i,R[e*3+2]=r*Math.sin(n)*i,we[e]=Math.random()*Math.PI*2,Te[e]=.2+Math.random()*1.8,Ee[e]=Math.random()<.35?1:.25+Math.random()*.4,De[e]=.5+Math.random()*1.3}let z=new p;z.setAttribute(`position`,new u(R,3)),z.setAttribute(`aPhase`,new u(we,1)),z.setAttribute(`aSpeed`,new u(Te,1)),z.setAttribute(`aDepth`,new u(Ee,1)),z.setAttribute(`aSize`,new u(De,1));let B=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
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
      `});x.add(new m(z,B));let V=h?0:350,H=new Float32Array(V*3),Oe=new Float32Array(V),ke=new Float32Array(V);for(let e=0;e<V;e++)H[e*3]=(Math.random()-.5)*28,H[e*3+1]=(Math.random()-.5)*22,H[e*3+2]=(Math.random()-.5)*18-2,Oe[e]=Math.random(),ke[e]=1.2+Math.random()*2.8;let U=new p;U.setAttribute(`position`,new u(H,3)),U.setAttribute(`aRand`,new u(Oe,1)),U.setAttribute(`aSize`,new u(ke,1));let W=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
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
      `}),G=V>0?new m(U,W):null;G&&x.add(G);let K=[];for(let e=0;e<6;e++){let t=new p;t.setAttribute(`position`,new u(new Float32Array(6),3)),t.setAttribute(`color`,new u(new Float32Array([1,1,1,0,0,0]),3));let n=new s(t,new a({transparent:!0,opacity:0,blending:2,vertexColors:!0,depthWrite:!1,linewidth:1}));n.frustumCulled=!1,x.add(n),K.push({line:n,active:!1,nextAt:1.5+Math.random()*5+e*1.2,start:new o,dir:new o,speed:0,t0:0,dur:0,bright:1})}function Ae(){let e=0;for(let t of K)t.active&&e++;return e}function je(e,t){if(Ae()>=2){e.nextAt=t+.8+Math.random()*1.5;return}let n=Math.random()*1.6-.8,r=Math.random()*Math.PI*2,i=Math.sqrt(Math.max(0,1-n*n));e.start.set(i*Math.cos(r),n,i*Math.sin(r)).multiplyScalar(11+Math.random()*8),e.dir.set(Math.random()-.5,-(.25+Math.random()*.55),Math.random()-.5).normalize(),e.speed=11+Math.random()*12,e.dur=1.1+Math.random()*1.4,e.bright=Math.random()<.35?1.35:1,e.t0=t,e.active=!0;let a=e.line.geometry.attributes.color.array;a[0]=1,a[1]=1,a[2]=1,a[3]=.35,a[4]=.45,a[5]=.75,e.line.geometry.attributes.color.needsUpdate=!0}function Me(e){for(let t of K){if(!t.active){e>t.nextAt&&je(t,e);continue}let n=(e-t.t0)/t.dur;if(n>=1){t.active=!1,t.line.material.opacity=0,t.nextAt=e+2.2+Math.random()*6;continue}let r=t.start.clone().addScaledVector(t.dir,t.speed*(e-t.t0)),i=-(1.8+t.speed*.12)*(.7+t.bright*.25),a=r.clone().addScaledVector(t.dir,i),o=t.line.geometry.attributes.position.array;o[0]=r.x,o[1]=r.y,o[2]=r.z,o[3]=a.x,o[4]=a.y,o[5]=a.z,t.line.geometry.attributes.position.needsUpdate=!0,t.line.material.opacity=Math.sin(n*Math.PI)*.95*t.bright}}let Ne=1300,q=de(Ne,se);q.setAttribute(`aPaper`,new u(new Float32Array(Ne*3),3));let J=new Map;function Pe(e,t){let n=new f({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDissolve:{value:0},uMorph:{value:0},uDim:{value:0},uBoost:{value:g},uPulse:{value:1},uColor:{value:new ne(e)}},vertexShader:`
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
    `}),r=new m(q,n);return x.add(r),{points:r,mat:n,phase:t}}function Fe(t){let n=e.clientWidth||1,r=e.clientHeight||1,i=2*(S.position.z-ce)*Math.tan(S.fov*Math.PI/360)/r,a=Math.min(.9*n,560)*i,s=Math.min(.68*r,620)*i,c=q.getAttribute(`aPaper`),l=t.points.position,u=t.frozenRot,d=new o,f=new o(0,1,0);for(let e=0;e<Ne;e++){let t,n;if(e%3==0){let e=Math.random()*2*(a+s);e<a?(t=e-a/2,n=-s/2):e<a+s?(t=a/2,n=e-a-s/2):e<2*a+s?(t=e-a-s-a/2,n=s/2):(t=-a/2,n=e-2*a-s-s/2)}else t=(Math.random()-.5)*a,n=(Math.random()-.5)*s;d.set(t,n,ce+(Math.random()-.5)*.06).sub(l).applyAxisAngle(f,-u),c.setXYZ(e,d.x,d.y,d.z)}c.needsUpdate=!0}function Ie(){let e=2*(S.position.z-v)*Math.tan(S.fov*Math.PI/360);return{w:e*S.aspect,h:e}}function Le(e,t){let{w:n,h:r}=Ie();return{x:(e/100-.5)*n,y:(.5-t/100)*r}}let Re=-99,ze=new i,Be=new c,Y=0,X=0,Z=new l;function Ve(e){he[X].copy(e),ge[X]=Z.getElapsedTime(),X=(X+1)%y}b.current={syncPlanets(e){let t=new Set;for(let n of e){t.add(n.id);let e=J.get(n.id);if(!e){let t=pe(String(n.id));e={...Pe(n.color,t),dissolve:0,target:0,morph:0,morphTarget:0,frozenRot:0,removing:!1,phase:t},e.dissolve=1,e.mat.uniforms.uDissolve.value=1,J.set(n.id,e)}e.xPct=n.x,e.yPct=n.y,e.mat.uniforms.uColor.value.set(n.color)}for(let[e,n]of J)!t.has(e)&&!n.removing&&(n.removing=!0,n.target=1)},dissolvePlanet(e){let t=J.get(e);t&&(t.frozenRot=t.points.rotation.y,Fe(t),t.morphTarget=1)},reformPlanet(e){let t=J.get(e);t&&(t.morphTarget=0)},pulseCenter(){let e=Z.getElapsedTime();if(e-Re<1.4)return;Re=e;let t=new o(Math.random()-.5,Math.random()-.5,.6+Math.random()).normalize().multiplyScalar(_);Ve(T.worldToLocal(t))}};function He(e){let t=C.domElement.getBoundingClientRect();Be.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),ze.setFromCamera(Be,S);let n=ze.intersectObject(I)[0];n&&Ve(T.worldToLocal(n.point.clone()).normalize().multiplyScalar(_))}C.domElement.addEventListener(`pointerdown`,He);function Ue(){let t=e.clientWidth||1,n=e.clientHeight||1;S.aspect=t/n,S.updateProjectionMatrix(),C.setSize(t,n)}Ue();let We=new ResizeObserver(Ue);We.observe(e);let Ge=0,Q=!0,Ke=0,$=0;function qe(){if(!Q)return;Ge=requestAnimationFrame(qe),Y=Z.getElapsedTime();let e=Math.min(Y-Ke,.05);Ke=Y;let n=t?0:Y,r=t?1:1+.045*Math.sin(Y*Math.PI*2/ue);w.uniforms.uNow.value=n,w.uniforms.uBreath.value=r,E.uniforms.uNow.value=n,E.uniforms.uBreath.value=r,B.uniforms.uNow.value=n,G&&(W.uniforms.uNow.value=n),O.uniforms.uNow.value=n,O.uniforms.uBreath.value=r,F.uniforms.uNow.value=n,t?(T.scale.setScalar(1),D.scale.setScalar(1),ye.scale.setScalar(1),I.scale.setScalar(1),S.position.set(0,0,7),S.lookAt(0,0,0)):(T.rotation.y=Y*.05,T.rotation.z=.14+.05*Math.sin(Y*.1),D.rotation.y=Y*.08,T.scale.setScalar(r),D.scale.setScalar(r),ye.scale.setScalar(r),I.scale.setScalar(r),Me(Y),S.position.x=Math.sin(Y*.07)*.08,S.position.y=Math.cos(Y*.09)*.05,S.lookAt(0,0,0));let i=!1;for(let[,e]of J)e.morphTarget>.5&&(i=!0);let a=2*e;$+=Math.max(-a,Math.min(a,+!!i-$)),w.uniforms.uDim.value=$,E.uniforms.uDim.value=$,B.uniforms.uDim.value=$,G&&(W.uniforms.uDim.value=$),O.uniforms.uDim.value=$,F.uniforms.uDim.value=$;for(let e of K)e.active&&(e.line.material.opacity*=1-$*.85);for(let[r,i]of J){let a=(i.target>i.dissolve?1.6:.8)*e;i.dissolve+=Math.max(-a,Math.min(a,i.target-i.dissolve));let o=(i.morphTarget>i.morph?1.15:.95)*e;i.morph+=Math.max(-o,Math.min(o,i.morphTarget-i.morph)),i.mat.uniforms.uDissolve.value=i.dissolve,i.mat.uniforms.uMorph.value=i.morph,i.mat.uniforms.uNow.value=n,i.mat.uniforms.uDim.value=i.morphTarget>.5||i.morph>.01?0:$;let s=t?1:1+.06*Math.sin(Y*1.1+i.phase*6.28);i.mat.uniforms.uPulse.value=s;let{x:c,y:l}=Le(i.xPct,i.yPct);if(i.morphTarget>.5||i.morph>.01)i.points.position.set(c,l,v),i.points.rotation.y=i.frozenRot,i.points.scale.setScalar(1);else if(t)i.points.position.set(c,l,v),i.points.scale.setScalar(1);else{let e=Math.sin(Y*.85+i.phase*6.28)*.07,t=Math.cos(Y*.55+i.phase*4.2)*.04;i.points.position.set(c+t,l+e,v),i.points.rotation.y=Y*.12+i.phase,i.points.scale.setScalar(s)}i.removing&&i.dissolve>.98&&(x.remove(i.points),i.mat.dispose(),J.delete(r))}C.render(x,S)}qe();function Je(){let e=document.visibilityState===`visible`;e&&!Q?(Q=!0,Z.getElapsedTime(),qe()):e||(Q=!1,cancelAnimationFrame(Ge))}return document.addEventListener(`visibilitychange`,Je),()=>{Q=!1,cancelAnimationFrame(Ge),document.removeEventListener(`visibilitychange`,Je),C.domElement.removeEventListener(`pointerdown`,He),We.disconnect();for(let[,e]of J)x.remove(e.points),e.mat.dispose();J.clear(),me.dispose(),w.dispose(),_e.dispose(),E.dispose(),ve.dispose(),O.dispose(),P.dispose(),F.dispose(),z.dispose(),B.dispose(),G&&(U.dispose(),W.dispose()),q.dispose();for(let e of K)e.line.geometry.dispose(),e.line.material.dispose();I.geometry.dispose(),I.material.dispose(),C.dispose(),oe(C),e.removeChild(C.domElement)}},[]),(0,h.useEffect)(()=>{b.current.syncPlanets(e||[])},[e]),(0,g.jsx)(`div`,{ref:n,"aria-hidden":`true`,style:{position:`absolute`,inset:0,overflow:`hidden`,background:`#000`}})});export{b as default};