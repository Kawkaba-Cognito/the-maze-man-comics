import{A as e,D as t,Dt as n,E as r,Jt as i,Kt as a,Ot as o,Vt as s,Xt as c,_ as l,a as u,bt as d,d as f,f as p,gt as m,it as h,k as g,kt as _,nt as v,p as y,pt as b,qt as x,t as S,tt as C,vt as w,x as T,yt as E}from"./three.module-v7hxcqJP.js";import{n as D,r as O,t as k}from"./c3dViewport-D3K1ZAxX.js";var A={name:`CopyShader`,uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

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


		}`},j=class{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error(`THREE.Pass: .render() must be implemented in derived pass.`)}dispose(){}},M=new b(-1,1,1,-1,0,1),N=new class extends p{constructor(){super(),this.setAttribute(`position`,new r([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute(`uv`,new r([0,2,0,0,2,0],2))}},P=class{constructor(e){this._mesh=new C(N,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,M)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}},F=class extends j{constructor(e,t=`tDiffuse`){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof _?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=a.clone(e.uniforms),this.material=new _({name:e.name===void 0?`unspecified`:e.name,defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new P(this.material)}render(e,t,n){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=n.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}},I=class extends j{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,n){let r=e.getContext(),i=e.state;i.buffers.color.setMask(!1),i.buffers.depth.setMask(!1),i.buffers.color.setLocked(!0),i.buffers.depth.setLocked(!0);let a,o;this.inverse?(a=0,o=1):(a=1,o=0),i.buffers.stencil.setTest(!0),i.buffers.stencil.setOp(r.REPLACE,r.REPLACE,r.REPLACE),i.buffers.stencil.setFunc(r.ALWAYS,a,4294967295),i.buffers.stencil.setClear(o),i.buffers.stencil.setLocked(!0),e.setRenderTarget(n),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),i.buffers.color.setLocked(!1),i.buffers.depth.setLocked(!1),i.buffers.color.setMask(!0),i.buffers.depth.setMask(!0),i.buffers.stencil.setLocked(!1),i.buffers.stencil.setFunc(r.EQUAL,1,4294967295),i.buffers.stencil.setOp(r.KEEP,r.KEEP,r.KEEP),i.buffers.stencil.setLocked(!0)}},L=class extends j{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}},R=class{constructor(t,n){if(this.renderer=t,this._pixelRatio=t.getPixelRatio(),n===void 0){let r=t.getSize(new x);this._width=r.width,this._height=r.height,n=new c(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:e}),n.texture.name=`EffectComposer.rt1`}else this._width=n.width,this._height=n.height;this.renderTarget1=n,this.renderTarget2=n.clone(),this.renderTarget2.texture.name=`EffectComposer.rt2`,this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new F(A),this.copyPass.material.blending=0,this.timer=new s}swapBuffers(){let e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){let t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){this.timer.update(),e===void 0&&(e=this.timer.getDelta());let t=this.renderer.getRenderTarget(),n=!1;for(let t=0,r=this.passes.length;t<r;t++){let r=this.passes[t];if(r.enabled!==!1){if(r.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(t),r.render(this.renderer,this.writeBuffer,this.readBuffer,e,n),r.needsSwap){if(n){let t=this.renderer.getContext(),n=this.renderer.state.buffers.stencil;n.setFunc(t.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),n.setFunc(t.EQUAL,1,4294967295)}this.swapBuffers()}I!==void 0&&(r instanceof I?n=!0:r instanceof L&&(n=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){let t=this.renderer.getSize(new x);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;let n=this._width*this._pixelRatio,r=this._height*this._pixelRatio;this.renderTarget1.setSize(n,r),this.renderTarget2.setSize(n,r);for(let e=0;e<this.passes.length;e++)this.passes[e].setSize(n,r)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}},z=class extends j{constructor(e,t,n=null,r=null,i=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=n,this.clearColor=r,this.clearAlpha=i,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this.isRenderPass=!0,this._oldClearColor=new l}render(e,t,n){let r=e.autoClear;e.autoClear=!1;let i,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(i=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==1&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:n),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(i),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=r}},B={name:`LuminosityHighPassShader`,uniforms:{tDiffuse:{value:null},luminosityThreshold:{value:1},smoothWidth:{value:1},defaultColor:{value:new l(0)},defaultOpacity:{value:0}},vertexShader:`

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

		}`},V=class t extends j{constructor(t,n=1,r,o){super(),this.strength=n,this.radius=r,this.threshold=o,this.resolution=t===void 0?new x(256,256):new x(t.x,t.y),this.clearColor=new l(0,0,0),this.needsSwap=!1,this.renderTargetsHorizontal=[],this.renderTargetsVertical=[],this.nMips=5;let s=Math.round(this.resolution.x/2),u=Math.round(this.resolution.y/2);this.renderTargetBright=new c(s,u,{type:e}),this.renderTargetBright.texture.name=`UnrealBloomPass.bright`,this.renderTargetBright.texture.generateMipmaps=!1;for(let t=0;t<this.nMips;t++){let n=new c(s,u,{type:e});n.texture.name=`UnrealBloomPass.h`+t,n.texture.generateMipmaps=!1,this.renderTargetsHorizontal.push(n);let r=new c(s,u,{type:e});r.texture.name=`UnrealBloomPass.v`+t,r.texture.generateMipmaps=!1,this.renderTargetsVertical.push(r),s=Math.round(s/2),u=Math.round(u/2)}let d=B;this.highPassUniforms=a.clone(d.uniforms),this.highPassUniforms.luminosityThreshold.value=o,this.highPassUniforms.smoothWidth.value=.01,this.materialHighPassFilter=new _({uniforms:this.highPassUniforms,vertexShader:d.vertexShader,fragmentShader:d.fragmentShader}),this.separableBlurMaterials=[];let f=[6,10,14,18,22];s=Math.round(this.resolution.x/2),u=Math.round(this.resolution.y/2);for(let e=0;e<this.nMips;e++)this.separableBlurMaterials.push(this._getSeparableBlurMaterial(f[e])),this.separableBlurMaterials[e].uniforms.invSize.value=new x(1/s,1/u),s=Math.round(s/2),u=Math.round(u/2);this.compositeMaterial=this._getCompositeMaterial(this.nMips),this.compositeMaterial.uniforms.blurTexture1.value=this.renderTargetsVertical[0].texture,this.compositeMaterial.uniforms.blurTexture2.value=this.renderTargetsVertical[1].texture,this.compositeMaterial.uniforms.blurTexture3.value=this.renderTargetsVertical[2].texture,this.compositeMaterial.uniforms.blurTexture4.value=this.renderTargetsVertical[3].texture,this.compositeMaterial.uniforms.blurTexture5.value=this.renderTargetsVertical[4].texture,this.compositeMaterial.uniforms.bloomStrength.value=n,this.compositeMaterial.uniforms.bloomRadius.value=.1;let p=[1,.8,.6,.4,.2];this.compositeMaterial.uniforms.bloomFactors.value=p,this.bloomTintColors=[new i(1,1,1),new i(1,1,1),new i(1,1,1),new i(1,1,1),new i(1,1,1)],this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,this.copyUniforms=a.clone(A.uniforms),this.blendMaterial=new _({uniforms:this.copyUniforms,vertexShader:A.vertexShader,fragmentShader:A.fragmentShader,premultipliedAlpha:!0,blending:2,depthTest:!1,depthWrite:!1,transparent:!0}),this._oldClearColor=new l,this._oldClearAlpha=1,this._basic=new v,this._fsQuad=new P(null)}dispose(){for(let e=0;e<this.renderTargetsHorizontal.length;e++)this.renderTargetsHorizontal[e].dispose();for(let e=0;e<this.renderTargetsVertical.length;e++)this.renderTargetsVertical[e].dispose();this.renderTargetBright.dispose();for(let e=0;e<this.separableBlurMaterials.length;e++)this.separableBlurMaterials[e].dispose();this.compositeMaterial.dispose(),this.blendMaterial.dispose(),this._basic.dispose(),this._fsQuad.dispose()}setSize(e,t){let n=Math.round(e/2),r=Math.round(t/2);this.renderTargetBright.setSize(n,r);for(let e=0;e<this.nMips;e++)this.renderTargetsHorizontal[e].setSize(n,r),this.renderTargetsVertical[e].setSize(n,r),this.separableBlurMaterials[e].uniforms.invSize.value=new x(1/n,1/r),n=Math.round(n/2),r=Math.round(r/2)}render(e,n,r,i,a){e.getClearColor(this._oldClearColor),this._oldClearAlpha=e.getClearAlpha();let o=e.autoClear;e.autoClear=!1,e.setClearColor(this.clearColor,0),a&&e.state.buffers.stencil.setTest(!1),this.renderToScreen&&(this._fsQuad.material=this._basic,this._basic.map=r.texture,e.setRenderTarget(null),e.clear(),this._fsQuad.render(e)),this.highPassUniforms.tDiffuse.value=r.texture,this.highPassUniforms.luminosityThreshold.value=this.threshold,this._fsQuad.material=this.materialHighPassFilter,e.setRenderTarget(this.renderTargetBright),e.clear(),this._fsQuad.render(e);let s=this.renderTargetBright;for(let n=0;n<this.nMips;n++)this._fsQuad.material=this.separableBlurMaterials[n],this.separableBlurMaterials[n].uniforms.colorTexture.value=s.texture,this.separableBlurMaterials[n].uniforms.direction.value=t.BlurDirectionX,e.setRenderTarget(this.renderTargetsHorizontal[n]),e.clear(),this._fsQuad.render(e),this.separableBlurMaterials[n].uniforms.colorTexture.value=this.renderTargetsHorizontal[n].texture,this.separableBlurMaterials[n].uniforms.direction.value=t.BlurDirectionY,e.setRenderTarget(this.renderTargetsVertical[n]),e.clear(),this._fsQuad.render(e),s=this.renderTargetsVertical[n];this._fsQuad.material=this.compositeMaterial,this.compositeMaterial.uniforms.bloomStrength.value=this.strength,this.compositeMaterial.uniforms.bloomRadius.value=this.radius,this.compositeMaterial.uniforms.bloomTintColors.value=this.bloomTintColors,e.setRenderTarget(this.renderTargetsHorizontal[0]),e.clear(),this._fsQuad.render(e),this._fsQuad.material=this.blendMaterial,this.copyUniforms.tDiffuse.value=this.renderTargetsHorizontal[0].texture,a&&e.state.buffers.stencil.setTest(!0),this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(r),this._fsQuad.render(e)),e.setClearColor(this._oldClearColor,this._oldClearAlpha),e.autoClear=o}_getSeparableBlurMaterial(e){let t=[],n=e/3;for(let r=0;r<e;r++)t.push(.39894*Math.exp(-.5*r*r/(n*n))/n);return new _({defines:{KERNEL_RADIUS:e},uniforms:{colorTexture:{value:null},invSize:{value:new x(.5,.5)},direction:{value:new x(.5,.5)},gaussianCoefficients:{value:t}},vertexShader:`

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

				}`})}_getCompositeMaterial(e){return new _({defines:{NUM_MIPS:e},uniforms:{blurTexture1:{value:null},blurTexture2:{value:null},blurTexture3:{value:null},blurTexture4:{value:null},blurTexture5:{value:null},bloomStrength:{value:1},bloomFactors:{value:null},bloomTintColors:{value:null},bloomRadius:{value:0}},vertexShader:`

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

				}`})}};V.BlurDirectionX=new x(1,0),V.BlurDirectionY=new x(0,1);var H=15248462,U=15786688,W=new WeakMap;function G(e,t){e&&W.get(e)?.(t)}var K=[`#ccdae6`,`#b3cadd`,`#9cb9d2`],q=11782877,J=[`#121826`,`#1e2130`,`#28303f`,`#2f3b4e`],Y=1185830;function X(e={}){let t=e.deep?J:K,r=document.createElement(`canvas`);r.width=2,r.height=256;let i=r.getContext(`2d`),a=i.createLinearGradient(0,0,0,256);e.deep?(a.addColorStop(0,t[0]),a.addColorStop(.45,t[1]),a.addColorStop(.75,t[2]),a.addColorStop(1,t[3])):(a.addColorStop(0,t[0]),a.addColorStop(.58,t[1]),a.addColorStop(1,t[2])),i.fillStyle=a,i.fillRect(0,0,2,256);let o=new y(r);return o.colorSpace=n,o}function Z(e,r={}){let i=k(),a=(()=>{try{return window.matchMedia(`(pointer: fine)`).matches}catch{return!i}})(),s=(()=>{try{return window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}catch{return!1}})(),c;try{c=new S({antialias:!i,alpha:r.alpha===!0,powerPreference:i?`default`:`high-performance`})}catch(e){return{error:e,dispose:()=>{}}}let l=r.deep===!0,h=new o;h.fog=new t(l?Y:q,.02);let _=r.alpha===!0?null:X({deep:l});_&&(h.background=_);let v=new m(r.fov??(i?54:48),1,.1,80);if(v.position.set(0,0,12),c.setPixelRatio(Math.min(window.devicePixelRatio||1,i?1.3:a?1.5:1.25)),c.setClearColor(l?Y:q,r.alpha===!0?0:1),c.outputColorSpace=n,c.domElement.style.cssText=`display:block;width:100%;height:100%;touch-action:none`,e.appendChild(c.domElement),r.lights!==!1){h.add(new u(12101770,.62));let e=new T(16773336,1.1);e.position.set(3,5,6),h.add(e);let t=new w(H,1.2,30);t.position.set(-3,2,4),h.add(t)}let y=null,b=null;if(r.stars!==!1){let e=a?1200:700,t=new Float32Array(e*3);for(let n=0;n<e;n++)t[n*3]=(Math.random()-.5)*55,t[n*3+1]=(Math.random()-.5)*36,t[n*3+2]=-6-Math.random()*32;y=new p,y.setAttribute(`position`,new f(t,3));let n=r.alpha===!0||l;b=new E(y,new d({color:n?U:7168853,size:a?.04:.05,transparent:!0,opacity:n?.8:.42,depthWrite:!1,blending:n?2:1})),h.add(b)}let C=null;if(r.bloom!==!1&&a&&!s)try{C=new R(c),C.addPass(new z(h,v)),C.addPass(new V(new x(1,1),.32,.5,.8))}catch{C=null}let A=new g;h.add(A);let j=r.fitHalf??4.2,M=r.fitHalf??4.2,N=()=>{let t=e.clientWidth||1,n=e.clientHeight||1,a=t/Math.max(1,n),o=D(t,n);v.aspect=a,v.fov=r.fov??(i?56:o?46:50);let s=v.fov*Math.PI/180,l=Math.tan(s/2),u=r.hudReserveFrac==null?Math.max(92,Math.min(196,n*(i?.19:.13))):n*r.hudReserveFrac,d=Math.min(.45,u/Math.max(1,n)),f=i?1.05:o?1.06:1.08,p=M*f/(l*Math.max(.05,1-d)),m=j*f/(l*Math.max(.2,a)),h=Math.max(p,m),g=d*h*l;A.position.set(0,-g,0),v.position.set(0,0,h),v.lookAt(0,0,0),v.updateProjectionMatrix(),c.setSize(t,n,!1),C?.setSize(t,n)};N();let P=new ResizeObserver(N);P.observe(e);let F=()=>N();window.visualViewport?.addEventListener(`resize`,F);let I=0,L=performance.now(),B=null,G=!1,K=0,J=0,Z=e=>{I=requestAnimationFrame(Z);let t=e-J,n=G?0:Math.min(.05,(t-L)/1e3);G||(L=t),!s&&b&&!G&&(b.rotation.y+=n*.01);try{B?.(n,t)}catch(e){console.warn(`[c3d] tick`,e)}C?C.render():c.render(h,v)};I=requestAnimationFrame(Z);let Q=e=>{let t=!!e;t!==G&&(G=t,G?K=performance.now():(J+=performance.now()-K,L=performance.now()-J))};return W.set(e,Q),{scene:h,camera:v,renderer:c,playRoot:A,coarse:i,fine:a,reduced:s,setFitHalf:e=>{j=e,M=e,N()},setFitBox:(e,t)=>{j=e,M=t??e,N()},frame:N,setTick:e=>{B=e},setPaused:Q,dispose:()=>{cancelAnimationFrame(I),P.disconnect(),window.visualViewport?.removeEventListener(`resize`,F),y?.dispose(),b?.material.dispose(),C?.dispose(),c.dispose(),O(c),c.domElement.parentNode===e&&e.removeChild(c.domElement)},error:null}}function Q(e,t={}){return new h({color:e,emissive:new l(t.emissive??e),emissiveIntensity:t.emissiveIntensity??0,metalness:t.metalness??.4,roughness:t.roughness??.4,transparent:t.transparent??!1,opacity:t.opacity??1})}function $(e){let t=new Set;e.traverse(e=>{e.geometry&&!t.has(e.geometry)&&(t.add(e.geometry),e.geometry.dispose()),e.material&&(Array.isArray(e.material)?e.material:[e.material]).forEach(e=>{e&&!t.has(e)&&(t.add(e),e.dispose?.())})})}export{G as i,$ as n,Q as r,Z as t};