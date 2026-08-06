import{$ as e,Bt as t,Ct as n,E as r,O as i,Pt as a,Q as o,St as s,T as c,Ut as l,Vt as u,b as d,d as f,dt as p,f as m,g as h,ht as g,i as _,k as v,mt as y,pt as b,t as x,tt as S,u as C,ut as w,wt as T,zt as E}from"./three.module-BdeWVoKy.js";import{n as D,r as O,t as k}from"./c3dViewport-D3K1ZAxX.js";var A={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`},j=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},M=new w(-1,1,1,-1,0,1),N=new class extends f{constructor(){super(),this.setAttribute(`position`,new c([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new c([0,2,0,0,2,0],2))}},P=class{constructor(e){this._mesh=new o(N,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,M)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},F=class extends j{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof T?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=E.clone(e.uniforms),this.material=new T({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new P(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},I=class extends j{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},L=class extends j{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},R=class{constructor(e,n){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),n===void 0){let r=e.getSize(new t);this._width=r.width,this._height=r.height,n=new l(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:v}),n.texture.name=`EffectComposer.rt1`}else this._width=n.width,this._height=n.height;this.renderTarget1=n,this.renderTarget2=n.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new F(A),this.copyPass.material.blending=0,this.timer=new a}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}I!==void 0&&(r instanceof I?n=!0:r instanceof L&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let n=this.renderer.getSize(new t);this._pixelRatio=this.renderer.getPixelRatio(),this._width=n.width,this._height=n.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},z=class extends j{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new h}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},B={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new h(0)},defaultOpacity:{value:0}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform sampler2D tDiffuse;
		uniform vec3 defaultColor;
		uniform float defaultOpacity;
		uniform float luminosityThreshold;
		uniform float smoothWidth;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );

			float v = luminance( texel.xyz );

			vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

			float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

			gl_FragColor = mix( outputColor, texel, alpha );

		}`},V=class n extends j{constructor(n,r=1,i,a){super(),this.strength=r,this.radius=i,this.threshold=a,this.resolution=n===void 0?new t(256,256):new t(n.x,n.y),this.clearColor=new h(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let o=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);this.renderTargetBright=new l(o,s,{type:v}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let e=0;e<this.nMips;e++){let t=new l(o,s,{type:v});t.texture.name=`UnrealBloomPass.h`+e,t.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(t);let n=new l(o,s,{type:v});n.texture.name=`UnrealBloomPass.v`+e,n.texture.generateMipmaps=!1,this.renderTargetsVertical.push(n),o=Math.round(o/2),s=Math.round(s/2)}let c=B;this.highPassUniforms=E.clone(c.uniforms),this.highPassUniforms.luminosityThreshold.value=a,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new T({uniforms:this.highPassUniforms,vertexShader:c.vertexShader,fragmentShader:c.fragmentShader}),this.separableBlurMaterials=[];let d=[6,10,14,18,22];o=Math.round(this.resolution.x/2),s=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(d[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new t(1/o,1/s),o=Math.round(o/2),s=Math.round(s/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=r,this.compositeMaterial.uniforms.bloomRadius.value=.1;let f=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=f,this.bloomTintColors=[new u(1,1,1),new u(1,1,1),new u(1,1,1),new u(1,1,1),new u(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=E.clone(A.uniforms),this.blendMaterial=new T({uniforms:this.copyUniforms,vertexShader:A.vertexShader,fragmentShader:A.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new h,this._oldClearAlpha=1,this._basic=new e,this._fsQuad=new P(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,n){let r=Math.round(e/2),i=Math.round(n/2);this.renderTargetBright.setSize(r,i);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(r,i),this.renderTargetsVertical[e].setSize(r,i),this.separableBlurMaterials[e].uniforms.invSize.value=new t(1/r,1/i),r=Math.round(r/2),i=Math.round(i/2)}render(e,t,r,i,a){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),a&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let s=this.renderTargetBright;for(let t=0;t<this.nMips;t++)this._fsQuad.material=this.separableBlurMaterials[t],this.separableBlurMaterials[t].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[t].uniforms.direction.value=n.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[t]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[t].uniforms.colorTexture.value=this.renderTargetsHorizontal[t].texture,this.separableBlurMaterials[t].uniforms.direction.value=n.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[t]),e.clear(),this._fsQuad.render(e),s=this.renderTargetsVertical[t];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(r),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){let n=[],r=e/3;for(let t=0;t<e;t++)n.push(.39894*Math.exp(-.5*t*t/(r*r))/r);return new T({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new t(.5,.5)},direction:{value:new t(.5,.5)},gaussianCoefficients:{value:n}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				#include <common>

				varying vec2 vUv;

				uniform sampler2D colorTexture;
				uniform vec2 invSize;
				uniform vec2 direction;
				uniform float gaussianCoefficients[KERNEL_RADIUS];

				void main() {

					float weightSum = gaussianCoefficients[0];
					vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

					for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

						float x = float( i );
						float w = gaussianCoefficients[i];
						vec2 uvOffset = direction * invSize * x;
						vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
						vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
						diffuseSum += ( sample1 + sample2 ) * w;

					}

					gl_FragColor = vec4( diffuseSum, 1.0 );

				}`})}_getCompositeMaterial(e){return new T({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

				varying vec2 vUv;

				void main() {

					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

				}`,fragmentShader:`

				varying vec2 vUv;

				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];

				float lerpBloomFactor( const in float factor ) {

					float mirrorFactor = 1.2 - factor;
					return mix( factor, mirrorFactor, bloomRadius );

				}

				void main() {

					// 3.0 for backwards compatibility with previous alpha-based intensity
					vec3 bloom = 3.0 * bloomStrength * (
						lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
						lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
					);

					float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
					gl_FragColor = vec4( bloom, bloomAlpha );

				}`})}};V.BlurDirectionX=new t(1,0),V.BlurDirectionY=new t(0,1);var H=15248462,U=15786688,W=new WeakMap;function G(e,t){e&&W.get(e)?.(t)}var K=[`#ccdae6`,`#b3cadd`,`#9cb9d2`],q=11782877,J=[`#121826`,`#1e2130`,`#28303f`,`#2f3b4e`],Y=1185830;function X(e={}){let t=e.deep?J:K,n=document.createElement(`canvas`);n.width=2,n.height=256;let r=n.getContext(`2d`),i=r.createLinearGradient(0,0,0,256);e.deep?(i.addColorStop(0,t[0]),i.addColorStop(.45,t[1]),i.addColorStop(.75,t[2]),i.addColorStop(1,t[3])):(i.addColorStop(0,t[0]),i.addColorStop(.58,t[1]),i.addColorStop(1,t[2])),r.fillStyle=i,r.fillRect(0,0,2,256);let a=new m(n);return a.colorSpace=s,a}function Z(e,a={}){let o=k(),c=(()=>{try{return window.matchMedia(`(pointer: fine)`).matches}catch{return!o}})(),l=(()=>{try{return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}catch{return!1}})(),u;try{u=new x({antialias:!o,alpha:a.alpha===!0,powerPreference:o?`default`:`high-performance`})}catch(e){return{error:e,dispose:()=>{}}}let m=a.deep===!0,h=new n;h.fog=new r(m?Y:q,.02);let v=a.alpha===!0?null:X({deep:m});v&&(h.background=v);let S=new p(a.fov??(o?54:48),1,.1,80);if(S.position.set(0,0,12),u.setPixelRatio(Math.min(window.devicePixelRatio||1,o?1.3:c?1.5:1.25)),u.setClearColor(m?Y:q,a.alpha===!0?0:1),u.outputColorSpace=s,u.domElement.style.cssText=`display:block;width:100%;height:100%;touch-action:none`,e.appendChild(u.domElement),a.lights!==!1){h.add(new _(12101770,.62));let e=new d(16773336,1.1);e.position.set(3,5,6),h.add(e);let t=new b(H,1.2,30);t.position.set(-3,2,4),h.add(t)}let w=null,T=null;if(a.stars!==!1){let e=c?1200:700,t=new Float32Array(e*3);for(let n=0;n<e;n++)t[n*3]=(Math.random()-.5)*55,t[n*3+1]=(Math.random()-.5)*36,t[n*3+2]=-6-Math.random()*32;w=new f,w.setAttribute(`position`,new C(t,3));let n=a.alpha===!0||m;T=new y(w,new g({color:n?U:7168853,size:c?.04:.05,transparent:!0,opacity:n?.8:.42,depthWrite:!1,blending:n?2:1})),h.add(T)}let E=null;if(a.bloom!==!1&&c&&!l)try{E=new R(u),E.addPass(new z(h,S)),E.addPass(new V(new t(1,1),.32,.5,.8))}catch{E=null}let A=new i;h.add(A);let j=a.fitHalf??4.2,M=a.fitHalf??4.2,N=()=>{let t=e.clientWidth||1,n=e.clientHeight||1,r=t/Math.max(1,n),i=D(t,n);S.aspect=r,S.fov=a.fov??(o?56:i?46:50);let s=S.fov*Math.PI/180,c=Math.tan(s/2),l=a.hudReserveFrac==null?Math.max(92,Math.min(196,n*(o?.19:.13))):n*a.hudReserveFrac,d=Math.min(.45,l/Math.max(1,n)),f=o?1.05:i?1.06:1.08,p=M*f/(c*Math.max(.05,1-d)),m=j*f/(c*Math.max(.2,r)),h=Math.max(p,m),g=d*h*c;A.position.set(0,-g,0),S.position.set(0,0,h),S.lookAt(0,0,0),S.updateProjectionMatrix(),u.setSize(t,n,!1),E?.setSize(t,n)};N();let P=new ResizeObserver(N);P.observe(e);let F=()=>N();window.visualViewport?.addEventListener(`resize`,F);let I=0,L=performance.now(),B=null,G=!1,K=0,J=0,Z=e=>{I=requestAnimationFrame(Z);let t=e-J,n=G?0:Math.min(.05,(t-L)/1e3);G||(L=t),!l&&T&&!G&&(T.rotation.y+=n*.01);try{B?.(n,t)}catch(e){console.warn(`[c3d] tick`,e)}E?E.render():u.render(h,S)};I=requestAnimationFrame(Z);let Q=e=>{let t=!!e;t!==G&&(G=t,G?K=performance.now():(J+=performance.now()-K,L=performance.now()-J))};return W.set(e,Q),{scene:h,camera:S,renderer:u,playRoot:A,coarse:o,fine:c,reduced:l,setFitHalf:e=>{j=e,M=e,N()},setFitBox:(e,t)=>{j=e,M=t??e,N()},frame:N,setTick:e=>{B=e},setPaused:Q,dispose:()=>{cancelAnimationFrame(I),P.disconnect(),window.visualViewport?.removeEventListener(`resize`,F),w?.dispose(),T?.material.dispose(),E?.dispose(),u.dispose(),O(u),u.domElement.parentNode===e&&e.removeChild(u.domElement)},error:null}}function Q(e,t={}){return new S({color:e,emissive:new h(t.emissive??e),emissiveIntensity:t.emissiveIntensity??0,metalness:t.metalness??.4,roughness:t.roughness??.4,transparent:t.transparent??!1,opacity:t.opacity??1})}function $(e){let t=new Set;e.traverse(e=>{e.geometry&&!t.has(e.geometry)&&(t.add(e.geometry),e.geometry.dispose()),e.material&&(Array.isArray(e.material)?e.material:[e.material]).forEach(e=>{e&&!t.has(e)&&(t.add(e),e.dispose?.())})})}export{G as i,$ as n,Q as r,Z as t};