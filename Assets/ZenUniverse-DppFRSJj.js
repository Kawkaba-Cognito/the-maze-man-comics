import{a as e,n as t,t as n}from"./jsx-runtime-DIAExeAg.js";import{C as r,F as i,H as a,I as o,N as s,O as c,R as l,S as ee,V as u,b as te,c as d,d as ne,f as re,i as ie,j as f,n as ae,r as oe,s as p,t as se,y as ce}from"./UnrealBloomPass-DbWDFr-C.js";var m=e(t()),h=n(),g=1.35,le=.36,_=.8,ue=3.2,de=3.2,v=6,fe=3.6;function y(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let e=Math.random()*2-1,o=Math.random()*Math.PI*2,s=Math.sqrt(1-e*e),c=t*(.9+.1*Math.random());n[a*3]=s*Math.cos(o)*c,n[a*3+1]=e*c,n[a*3+2]=s*Math.sin(o)*c,r[a]=Math.random(),i[a]=.6+Math.random()}let a=new d;return a.setAttribute(`position`,new p(n,3)),a.setAttribute(`aRand`,new p(r,1)),a.setAttribute(`aSize`,new p(i,1)),a}function pe(e,t){let n=new Float32Array(e*3),r=new Float32Array(e),i=new Float32Array(e);for(let a=0;a<e;a++){let o=a/e*Math.PI*2+Math.random()*.04,s=(Math.random()-.5)*.22,c=t*(.96+Math.random()*.1);n[a*3]=Math.cos(o)*c,n[a*3+1]=Math.sin(o)*c*.42+s*c,n[a*3+2]=Math.sin(o)*c*.18,r[a]=Math.random(),i[a]=.7+Math.random()*1.2}let a=new d;return a.setAttribute(`position`,new p(n,3)),a.setAttribute(`aRand`,new p(r,1)),a.setAttribute(`aSize`,new p(i,1)),a}function me(e){let t=0;for(let n=0;n<e.length;n++)t=t*31+e.charCodeAt(n)|0;return Math.abs(t)%1e3/1e3}var b=(0,m.forwardRef)(function({planets:e},t){let n=(0,m.useRef)(null),b=(0,m.useRef)({syncPlanets:()=>{},dissolvePlanet:()=>{},reformPlanet:()=>{},pulseCenter:()=>{}});return(0,m.useImperativeHandle)(t,()=>({dissolvePlanet:e=>b.current.dissolvePlanet(e),reformPlanet:e=>b.current.reformPlanet(e),pulseCenter:()=>b.current.pulseCenter()}),[]),(0,m.useEffect)(()=>{let e=n.current;if(!e)return;let t=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,m=window.matchMedia(`(pointer: fine)`).matches,h=m?1:1.45,x=new i,S=new c(55,1,.1,200);S.position.set(0,0,7);let C=new ie({antialias:!0});C.setPixelRatio(Math.min(window.devicePixelRatio||1,m?1.5:1.35)),C.setClearColor(0,1),C.domElement.style.display=`block`,e.appendChild(C.domElement);let he=y(m?22e3:16e3,g),w=[],T=[];for(let e=0;e<v;e++)w.push(new a),T.push(-99);let E=new o({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:h},uBreath:{value:1},uTouches:{value:w},uStarts:{value:T}},vertexShader:`
        attribute float aRand;
        attribute float aSize;
        uniform float uNow;
        uniform float uBoost;
        uniform float uBreath;
        uniform vec3 uTouches[${v}];
        uniform float uStarts[${v}];
        varying float vFade;
        void main() {
          vec3 p = position;
          vec3 dir = normalize(position);
          /* idle surface shimmer — a bit livelier */
          p += dir * sin(uNow * 1.25 + aRand * 40.0) * (0.028 + uBreath * 0.008);
          float fade = 0.0;
          for (int i = 0; i < ${v}; i++) {
            float age = uNow - uStarts[i];
            if (age < 0.0 || age > ${de.toFixed(1)}) continue;
            float pulse = sin(clamp(age / ${de.toFixed(1)}, 0.0, 1.0) * 3.14159);
            float d = distance(position, uTouches[i]);
            float infl = smoothstep(0.95, 0.0, d) * pulse;
            vec3 rnd = vec3(
              fract(sin(aRand * 127.1) * 43758.5) - 0.5,
              fract(sin(aRand * 311.7) * 43758.5) - 0.5,
              fract(sin(aRand * 74.7)  * 43758.5) - 0.5);
            p += (dir * 1.0 + rnd * 1.3) * infl * (0.85 + aRand * 0.55);
            fade += infl;
          }
          vFade = clamp(fade, 0.0, 1.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = aSize * (19.0 * uBoost * uBreath) / -mv.z * (1.0 + vFade * 1.15);
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        uniform float uBoost;
        uniform float uBreath;
        varying float vFade;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.06, d) * 0.36 * uBoost * uBreath
            * (1.0 - vFade * 0.55) * (1.0 - uDim * 0.96);
          gl_FragColor = vec4(vec3(1.0), clamp(alpha, 0.0, 1.0));
        }
      `}),D=new f(he,E);x.add(D);let ge=pe(m?720:480,g*1.38),O=new o({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0},uBoost:{value:h},uBreath:{value:1}},vertexShader:`
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
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha * 0.22 * uBoost * (1.0 - uDim * 0.9);
          gl_FragColor = vec4(0.92, 0.96, 1.0, clamp(alpha, 0.0, 1.0));
        }
      `}),k=new f(ge,O);x.add(k);let A=new ee(new l(g*1.12,16,16),new r({visible:!1}));x.add(A);let j=m?1300:900,M=new Float32Array(j*3),_e=new Float32Array(j),ve=new Float32Array(j),ye=new Float32Array(j),N=new Float32Array(j);for(let e=0;e<j;e++){let t=Math.random()*2-1,n=Math.random()*Math.PI*2,r=Math.sqrt(1-t*t),i=25+Math.random()*45;M[e*3]=r*Math.cos(n)*i,M[e*3+1]=t*i,M[e*3+2]=r*Math.sin(n)*i,_e[e]=Math.random()*Math.PI*2,ve[e]=.2+Math.random()*1.8,ye[e]=Math.random()<.35?1:.25+Math.random()*.4,N[e]=.5+Math.random()*1.3}let P=new d;P.setAttribute(`position`,new p(M,3)),P.setAttribute(`aPhase`,new p(_e,1)),P.setAttribute(`aSpeed`,new p(ve,1)),P.setAttribute(`aDepth`,new p(ye,1)),P.setAttribute(`aSize`,new p(N,1));let F=new o({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
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
          gl_PointSize = aSize * 120.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.05, d) * vAlpha * 0.9 * (1.0 - uDim * 0.85);
          gl_FragColor = vec4(vec3(1.0), alpha);
        }
      `});x.add(new f(P,F));let I=m?600:350,L=new Float32Array(I*3),be=new Float32Array(I),xe=new Float32Array(I);for(let e=0;e<I;e++)L[e*3]=(Math.random()-.5)*28,L[e*3+1]=(Math.random()-.5)*22,L[e*3+2]=(Math.random()-.5)*18-2,be[e]=Math.random(),xe[e]=1.2+Math.random()*2.8;let R=new d;R.setAttribute(`position`,new p(L,3)),R.setAttribute(`aRand`,new p(be,1)),R.setAttribute(`aSize`,new p(xe,1));let z=new o({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDim:{value:0}},vertexShader:`
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
          gl_PointSize = aSize * 90.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,fragmentShader:`
        uniform float uDim;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float alpha = smoothstep(0.5, 0.0, d) * vAlpha * 0.08 * (1.0 - uDim * 0.9);
          gl_FragColor = vec4(0.75, 0.85, 1.0, clamp(alpha, 0.0, 1.0));
        }
      `}),Se=new f(R,z);x.add(Se);let B=[];for(let e=0;e<6;e++){let t=new d;t.setAttribute(`position`,new p(new Float32Array(6),3)),t.setAttribute(`color`,new p(new Float32Array([1,1,1,0,0,0]),3));let n=new ce(t,new te({transparent:!0,opacity:0,blending:2,vertexColors:!0,depthWrite:!1,linewidth:1}));n.frustumCulled=!1,x.add(n),B.push({line:n,active:!1,nextAt:1.5+Math.random()*5+e*1.2,start:new a,dir:new a,speed:0,t0:0,dur:0,bright:1})}function Ce(){let e=0;for(let t of B)t.active&&e++;return e}function we(e,t){if(Ce()>=2){e.nextAt=t+.8+Math.random()*1.5;return}let n=Math.random()*1.6-.8,r=Math.random()*Math.PI*2,i=Math.sqrt(Math.max(0,1-n*n));e.start.set(i*Math.cos(r),n,i*Math.sin(r)).multiplyScalar(11+Math.random()*8),e.dir.set(Math.random()-.5,-(.25+Math.random()*.55),Math.random()-.5).normalize(),e.speed=11+Math.random()*12,e.dur=1.1+Math.random()*1.4,e.bright=Math.random()<.35?1.35:1,e.t0=t,e.active=!0;let a=e.line.geometry.attributes.color.array;a[0]=1,a[1]=1,a[2]=1,a[3]=.35,a[4]=.45,a[5]=.75,e.line.geometry.attributes.color.needsUpdate=!0}function Te(e){for(let t of B){if(!t.active){e>t.nextAt&&we(t,e);continue}let n=(e-t.t0)/t.dur;if(n>=1){t.active=!1,t.line.material.opacity=0,t.nextAt=e+2.2+Math.random()*6;continue}let r=t.start.clone().addScaledVector(t.dir,t.speed*(e-t.t0)),i=-(1.8+t.speed*.12)*(.7+t.bright*.25),a=r.clone().addScaledVector(t.dir,i),o=t.line.geometry.attributes.position.array;o[0]=r.x,o[1]=r.y,o[2]=r.z,o[3]=a.x,o[4]=a.y,o[5]=a.z,t.line.geometry.attributes.position.needsUpdate=!0,t.line.material.opacity=Math.sin(n*Math.PI)*.95*t.bright}}let V=1300,H=y(V,le);H.setAttribute(`aPaper`,new p(new Float32Array(V*3),3));let U=new Map;function Ee(e,t){let n=new o({transparent:!0,depthWrite:!1,blending:2,uniforms:{uNow:{value:0},uDissolve:{value:0},uMorph:{value:0},uDim:{value:0},uBoost:{value:h},uPulse:{value:1},uColor:{value:new re(e)}},vertexShader:`
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
    `}),r=new f(H,n);return x.add(r),{points:r,mat:n,phase:t}}function De(t){let n=e.clientWidth||1,r=e.clientHeight||1,i=2*(S.position.z-ue)*Math.tan(S.fov*Math.PI/360)/r,o=Math.min(.9*n,560)*i,s=Math.min(.68*r,620)*i,c=H.getAttribute(`aPaper`),l=t.points.position,ee=t.frozenRot,u=new a,te=new a(0,1,0);for(let e=0;e<V;e++){let t,n;if(e%3==0){let e=Math.random()*2*(o+s);e<o?(t=e-o/2,n=-s/2):e<o+s?(t=o/2,n=e-o-s/2):e<2*o+s?(t=e-o-s-o/2,n=s/2):(t=-o/2,n=e-2*o-s-s/2)}else t=(Math.random()-.5)*o,n=(Math.random()-.5)*s;u.set(t,n,ue+(Math.random()-.5)*.06).sub(l).applyAxisAngle(te,-ee),c.setXYZ(e,u.x,u.y,u.z)}c.needsUpdate=!0}function Oe(){let e=2*(S.position.z-_)*Math.tan(S.fov*Math.PI/360);return{w:e*S.aspect,h:e}}function ke(e,t){let{w:n,h:r}=Oe();return{x:(e/100-.5)*n,y:(.5-t/100)*r}}let Ae=-99,je=new s,Me=new u,W=0,G=0,K=new ne;function Ne(e){w[G].copy(e),T[G]=K.getElapsedTime(),G=(G+1)%v}b.current={syncPlanets(e){let t=new Set;for(let n of e){t.add(n.id);let e=U.get(n.id);if(!e){let t=me(String(n.id));e={...Ee(n.color,t),dissolve:0,target:0,morph:0,morphTarget:0,frozenRot:0,removing:!1,phase:t},e.dissolve=1,e.mat.uniforms.uDissolve.value=1,U.set(n.id,e)}e.xPct=n.x,e.yPct=n.y,e.mat.uniforms.uColor.value.set(n.color)}for(let[e,n]of U)!t.has(e)&&!n.removing&&(n.removing=!0,n.target=1)},dissolvePlanet(e){let t=U.get(e);t&&(t.frozenRot=t.points.rotation.y,De(t),t.morphTarget=1)},reformPlanet(e){let t=U.get(e);t&&(t.morphTarget=0)},pulseCenter(){let e=K.getElapsedTime();if(e-Ae<1.4)return;Ae=e;let t=new a(Math.random()-.5,Math.random()-.5,.6+Math.random()).normalize().multiplyScalar(g);Ne(D.worldToLocal(t))}};function Pe(e){let t=C.domElement.getBoundingClientRect();Me.set((e.clientX-t.left)/t.width*2-1,-((e.clientY-t.top)/t.height)*2+1),je.setFromCamera(Me,S);let n=je.intersectObject(A)[0];n&&Ne(D.worldToLocal(n.point.clone()).normalize().multiplyScalar(g))}C.domElement.addEventListener(`pointerdown`,Pe);let q=null,J=null;m&&!t&&(q=new oe(C),q.addPass(new ae(x,S)),J=new se(new u(1,1),.62,.85,.22),q.addPass(J));function Y(){let t=e.clientWidth||1,n=e.clientHeight||1;S.aspect=t/n,S.updateProjectionMatrix(),C.setSize(t,n),q?.setSize(t,n),J?.resolution.set(t,n)}Y();let Fe=new ResizeObserver(Y);Fe.observe(e);let X=0,Z=!0,Ie=0,Q=0;function $(){if(!Z)return;X=requestAnimationFrame($),W=K.getElapsedTime();let e=Math.min(W-Ie,.05);Ie=W;let n=t?0:W,r=t?1:1+.045*Math.sin(W*Math.PI*2/fe);E.uniforms.uNow.value=n,E.uniforms.uBreath.value=r,O.uniforms.uNow.value=n,O.uniforms.uBreath.value=r,F.uniforms.uNow.value=n,z.uniforms.uNow.value=n,t?(D.scale.setScalar(1),k.scale.setScalar(1),A.scale.setScalar(1),S.position.set(0,0,7),S.lookAt(0,0,0)):(D.rotation.y=W*.05,k.rotation.y=W*.08,D.scale.setScalar(r),k.scale.setScalar(r),A.scale.setScalar(r),Te(W),S.position.x=Math.sin(W*.07)*.08,S.position.y=Math.cos(W*.09)*.05,S.lookAt(0,0,0));let i=!1;for(let[,e]of U)e.morphTarget>.5&&(i=!0);let a=2*e;Q+=Math.max(-a,Math.min(a,+!!i-Q)),E.uniforms.uDim.value=Q,O.uniforms.uDim.value=Q,F.uniforms.uDim.value=Q,z.uniforms.uDim.value=Q;for(let e of B)e.active&&(e.line.material.opacity*=1-Q*.85);for(let[r,i]of U){let a=(i.target>i.dissolve?1.6:.8)*e;i.dissolve+=Math.max(-a,Math.min(a,i.target-i.dissolve));let o=(i.morphTarget>i.morph?1.15:.95)*e;i.morph+=Math.max(-o,Math.min(o,i.morphTarget-i.morph)),i.mat.uniforms.uDissolve.value=i.dissolve,i.mat.uniforms.uMorph.value=i.morph,i.mat.uniforms.uNow.value=n,i.mat.uniforms.uDim.value=i.morphTarget>.5||i.morph>.01?0:Q;let s=t?1:1+.06*Math.sin(W*1.1+i.phase*6.28);i.mat.uniforms.uPulse.value=s;let{x:c,y:l}=ke(i.xPct,i.yPct);if(i.morphTarget>.5||i.morph>.01)i.points.position.set(c,l,_),i.points.rotation.y=i.frozenRot,i.points.scale.setScalar(1);else if(t)i.points.position.set(c,l,_),i.points.scale.setScalar(1);else{let e=Math.sin(W*.85+i.phase*6.28)*.07,t=Math.cos(W*.55+i.phase*4.2)*.04;i.points.position.set(c+t,l+e,_),i.points.rotation.y=W*.12+i.phase,i.points.scale.setScalar(s)}i.removing&&i.dissolve>.98&&(x.remove(i.points),i.mat.dispose(),U.delete(r))}q?q.render():C.render(x,S)}$();function Le(){let e=document.visibilityState===`visible`;e&&!Z?(Z=!0,K.getElapsedTime(),$()):e||(Z=!1,cancelAnimationFrame(X))}return document.addEventListener(`visibilitychange`,Le),()=>{Z=!1,cancelAnimationFrame(X),document.removeEventListener(`visibilitychange`,Le),C.domElement.removeEventListener(`pointerdown`,Pe),Fe.disconnect();for(let[,e]of U)x.remove(e.points),e.mat.dispose();U.clear(),he.dispose(),E.dispose(),ge.dispose(),O.dispose(),P.dispose(),F.dispose(),R.dispose(),z.dispose(),H.dispose();for(let e of B)e.line.geometry.dispose(),e.line.material.dispose();A.geometry.dispose(),A.material.dispose(),q?.dispose(),C.dispose(),e.removeChild(C.domElement)}},[]),(0,m.useEffect)(()=>{b.current.syncPlanets(e||[])},[e]),(0,h.jsx)(`div`,{ref:n,"aria-hidden":`true`,style:{position:`absolute`,inset:0,overflow:`hidden`,background:`#000`}})});export{b as default};