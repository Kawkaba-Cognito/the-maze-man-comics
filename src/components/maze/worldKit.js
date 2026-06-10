/**
 * Comic-look art kit for the Babylon 3D world. Everything here is generated
 * in code (DynamicTexture canvases, fresnel rim lights, particle textures) so
 * the world ships zero asset files and works fully offline — no
 * playground.babylonjs.com dependencies.
 *
 * Usage: const kit = createKit(BABYLON, scene); then use kit.* helpers.
 */

export function createKit(BABYLON, s) {
  // ── Glow layer: only meshes we explicitly register glow (keeps the gold
  //    rim-light from blooming the whole scene). ──
  const glowLayer = new BABYLON.GlowLayer('glow', s, { blurKernelSize: 32 });
  glowLayer.intensity = 0.8;
  const glow = (mesh) => { glowLayer.addIncludedOnlyMesh(mesh); return mesh; };

  // ── Materials ──
  /** Flat comic material: strong diffuse, low spec, optional emissive. */
  const toonMat = (name, r, g, b, opts = {}) => {
    const m = new BABYLON.StandardMaterial(name, s);
    m.diffuseColor = new BABYLON.Color3(r, g, b);
    const sp = opts.spec ?? 0.06;
    m.specularColor = new BABYLON.Color3(sp, sp, sp);
    m.specularPower = 48;
    if (opts.emis) m.emissiveColor = new BABYLON.Color3(opts.emis[0], opts.emis[1], opts.emis[2]);
    if (opts.rim) rim(m, opts.rim, opts.rimBias ?? 0.28, opts.rimPower ?? 2.2);
    return m;
  };

  /** Gold edge-light: separates dark characters from the dark ground (the
   *  comic "ink rim"). Works on any StandardMaterial. */
  function rim(mat, [r, g, b], bias = 0.28, power = 2.2) {
    const f = new BABYLON.FresnelParameters();
    f.bias = bias;
    f.power = power;
    f.leftColor = new BABYLON.Color3(r, g, b); // edge
    f.rightColor = BABYLON.Color3.Black();     // centre
    mat.emissiveFresnelParameters = f;
    if (mat.emissiveColor.equals(BABYLON.Color3.Black())) {
      mat.emissiveColor = new BABYLON.Color3(1, 1, 1); // fresnel multiplies emissive
    }
    return mat;
  }

  // ── Procedural textures (drawn once on a canvas) ──
  const dyn = (name, w, h, draw) => {
    const t = new BABYLON.DynamicTexture(name, { width: w, height: h }, s, true);
    draw(t.getContext(), w, h);
    t.update();
    return t;
  };

  /** Night-meadow grass tile: flat base + blade strokes + mottled patches. */
  const grassTexture = () => dyn('grassTex', 512, 512, (c, w, h) => {
    c.fillStyle = '#2e5236';
    c.fillRect(0, 0, w, h);
    // soft mottled patches
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * w, y = Math.random() * h, r = 30 + Math.random() * 70;
      c.fillStyle = Math.random() > 0.5 ? 'rgba(62,104,66,0.5)' : 'rgba(34,66,42,0.5)';
      c.beginPath(); c.ellipse(x, y, r, r * 0.6, Math.random() * 3, 0, Math.PI * 2); c.fill();
    }
    // grass blades (kept inside a margin so the tile stays seamless)
    for (let i = 0; i < 700; i++) {
      const x = 8 + Math.random() * (w - 16), y = 8 + Math.random() * (h - 16);
      const len = 3 + Math.random() * 6, lean = (Math.random() - 0.5) * 3;
      c.strokeStyle = `rgba(${90 + Math.random() * 50 | 0},${150 + Math.random() * 60 | 0},${80 + Math.random() * 40 | 0},0.55)`;
      c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + lean, y - len); c.stroke();
    }
    // a few gold sparks in the grass (brand accent)
    for (let i = 0; i < 14; i++) {
      c.fillStyle = 'rgba(220,180,90,0.5)';
      const x = 10 + Math.random() * (w - 20), y = 10 + Math.random() * (h - 20);
      c.beginPath(); c.arc(x, y, 1.4, 0, Math.PI * 2); c.fill();
    }
  });

  /** Cobblestone pavers for roads/plaza. */
  const roadTexture = () => dyn('roadTex', 256, 256, (c, w, h) => {
    c.fillStyle = '#48405a';
    c.fillRect(0, 0, w, h);
    const cols = 5, rows = 5, cw = w / cols, ch = h / rows;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const off = (gy % 2) * cw * 0.5;
        const x = ((gx * cw + off) % w) + 3, y = gy * ch + 3;
        const tone = 110 + Math.random() * 38;
        c.fillStyle = `rgb(${tone | 0},${tone * 0.92 | 0},${tone * 1.08 | 0})`;
        roundRect(c, x, y, cw - 6, ch - 6, 8);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.06)';
        roundRect(c, x + 3, y + 3, cw - 12, (ch - 6) * 0.4, 6);
        c.fill();
      }
    }
  });

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /** Soft radial dot — the particle sprite for stars/dust/bursts/fireflies. */
  const flareTexture = () => dyn('flareTex', 64, 64, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,240,210,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.clearRect(0, 0, w, h);
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });

  /** Night sky dome: gradient, hand-placed stars and a gold moon — replaces
   *  the old CDN cube-texture skybox. */
  const skyDome = () => {
    const tex = dyn('skyTex', 2048, 1024, (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#03030f');     // zenith
      g.addColorStop(0.55, '#120c2a');
      g.addColorStop(0.78, '#2a1840');  // purple horizon glow
      g.addColorStop(1, '#3a2148');
      c.fillStyle = g;
      c.fillRect(0, 0, w, h);
      // stars — denser near the zenith, away from L/R edges so the seam hides
      for (let i = 0; i < 420; i++) {
        const x = 12 + Math.random() * (w - 24);
        const y = Math.pow(Math.random(), 1.6) * h * 0.7;
        const r = Math.random() * 1.8 + 0.4;
        const warm = Math.random() > 0.75;
        c.fillStyle = warm ? `rgba(255,214,140,${0.5 + Math.random() * 0.5})` : `rgba(235,240,255,${0.4 + Math.random() * 0.6})`;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        if (r > 1.6) { // sparkle cross on the brightest
          c.strokeStyle = 'rgba(255,255,255,0.35)';
          c.lineWidth = 0.8;
          c.beginPath(); c.moveTo(x - r * 3, y); c.lineTo(x + r * 3, y); c.moveTo(x, y - r * 3); c.lineTo(x, y + r * 3); c.stroke();
        }
      }
      // gold moon with craters
      const mx = w * 0.68, my = h * 0.22, mr = 56;
      const mg = c.createRadialGradient(mx, my, mr * 0.2, mx, my, mr * 2.6);
      mg.addColorStop(0, 'rgba(255,214,130,0.5)');
      mg.addColorStop(1, 'rgba(255,214,130,0)');
      c.fillStyle = mg;
      c.beginPath(); c.arc(mx, my, mr * 2.6, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#f5d488';
      c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
      c.fillStyle = 'rgba(190,150,80,0.5)';
      [[-18, -10, 11], [14, 6, 8], [-2, 22, 6], [22, -22, 5], [-28, 14, 5]].forEach(([dx, dy, r]) => {
        c.beginPath(); c.arc(mx + dx, my + dy, r, 0, Math.PI * 2); c.fill();
      });
    });
    const dome = BABYLON.MeshBuilder.CreateSphere('skyDome', { diameter: 900, segments: 24, sideOrientation: BABYLON.Mesh.BACKSIDE }, s);
    const m = new BABYLON.StandardMaterial('skyMat', s);
    m.emissiveTexture = tex;
    m.diffuseColor = BABYLON.Color3.Black();
    m.specularColor = BABYLON.Color3.Black();
    m.disableLighting = true;
    dome.material = m;
    dome.isPickable = false;
    dome.infiniteDistance = true;
    return dome;
  };

  // ── Particles ──
  const sprite = flareTexture();

  /** One-shot collect burst at a position. Cleans itself up. */
  const burst = (pos, color = [1, 0.85, 0.4]) => {
    const p = new BABYLON.ParticleSystem('burst', 26, s);
    p.particleTexture = sprite;
    p.emitter = pos.clone();
    p.color1 = new BABYLON.Color4(color[0], color[1], color[2], 1);
    p.color2 = new BABYLON.Color4(1, 1, 0.9, 1);
    p.colorDead = new BABYLON.Color4(color[0], color[1], color[2], 0);
    p.minSize = 0.25; p.maxSize = 0.6;
    p.minLifeTime = 0.25; p.maxLifeTime = 0.55;
    p.emitRate = 0;
    p.manualEmitCount = 26;
    p.createSphereEmitter(0.4);
    p.minEmitPower = 3; p.maxEmitPower = 7;
    p.gravity = new BABYLON.Vector3(0, -6, 0);
    p.disposeOnStop = true;
    p.targetStopDuration = 0.6;
    p.start();
  };

  /** Footstep dust attached to the player — toggle with .rate(moving). */
  const dustPuffs = (emitterMesh) => {
    const p = new BABYLON.ParticleSystem('dust', 40, s);
    p.particleTexture = sprite;
    p.emitter = emitterMesh;
    p.minEmitBox = new BABYLON.Vector3(-0.3, -1.9, -0.5);
    p.maxEmitBox = new BABYLON.Vector3(0.3, -1.8, 0.2);
    p.color1 = new BABYLON.Color4(0.55, 0.5, 0.42, 0.35);
    p.color2 = new BABYLON.Color4(0.4, 0.36, 0.3, 0.25);
    p.colorDead = new BABYLON.Color4(0.4, 0.36, 0.3, 0);
    p.minSize = 0.3; p.maxSize = 0.8;
    p.minLifeTime = 0.35; p.maxLifeTime = 0.7;
    p.emitRate = 0;
    p.direction1 = new BABYLON.Vector3(-0.4, 0.6, -0.4);
    p.direction2 = new BABYLON.Vector3(0.4, 1.2, 0.4);
    p.minEmitPower = 0.4; p.maxEmitPower = 1;
    p.start();
    return { rate: (moving) => { p.emitRate = moving ? 16 : 0; } };
  };

  /** Ambient gold fireflies drifting over an area. */
  const fireflies = (cx, cz, half) => {
    const p = new BABYLON.ParticleSystem('fireflies', 60, s);
    p.particleTexture = sprite;
    p.emitter = new BABYLON.Vector3(cx, 1.2, cz);
    p.minEmitBox = new BABYLON.Vector3(-half, 0, -half);
    p.maxEmitBox = new BABYLON.Vector3(half, 2.5, half);
    p.color1 = new BABYLON.Color4(1, 0.85, 0.4, 0.9);
    p.color2 = new BABYLON.Color4(1, 0.7, 0.25, 0.7);
    p.colorDead = new BABYLON.Color4(1, 0.8, 0.3, 0);
    p.minSize = 0.08; p.maxSize = 0.22;
    p.minLifeTime = 2.5; p.maxLifeTime = 5;
    p.emitRate = 14;
    p.direction1 = new BABYLON.Vector3(-0.25, 0.05, -0.25);
    p.direction2 = new BABYLON.Vector3(0.25, 0.3, 0.25);
    p.minEmitPower = 0.1; p.maxEmitPower = 0.35;
    p.start();
    return p;
  };

  /** Lazy chimney smoke. */
  const smoke = (x, y, z) => {
    const p = new BABYLON.ParticleSystem('smoke', 30, s);
    p.particleTexture = sprite;
    p.emitter = new BABYLON.Vector3(x, y, z);
    p.color1 = new BABYLON.Color4(0.6, 0.6, 0.65, 0.25);
    p.color2 = new BABYLON.Color4(0.5, 0.5, 0.55, 0.18);
    p.colorDead = new BABYLON.Color4(0.5, 0.5, 0.55, 0);
    p.minSize = 0.6; p.maxSize = 1.6;
    p.minLifeTime = 2.2; p.maxLifeTime = 4;
    p.emitRate = 7;
    p.direction1 = new BABYLON.Vector3(-0.15, 1, -0.1);
    p.direction2 = new BABYLON.Vector3(0.25, 1.6, 0.15);
    p.minEmitPower = 0.3; p.maxEmitPower = 0.7;
    p.start();
    return p;
  };

  /** Falling star dust over the whole map (kept from the old world's vibe). */
  const starDust = () => {
    const p = new BABYLON.ParticleSystem('starDust', 700, s);
    p.particleTexture = sprite;
    p.emitter = new BABYLON.Vector3(0, 90, 0);
    p.minEmitBox = new BABYLON.Vector3(-150, 0, -150);
    p.maxEmitBox = new BABYLON.Vector3(150, 30, 150);
    p.color1 = new BABYLON.Color4(1, 0.9, 0.7, 0.9);
    p.color2 = new BABYLON.Color4(0.8, 0.85, 1, 0.7);
    p.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    p.minSize = 0.08; p.maxSize = 0.4;
    p.minLifeTime = 4; p.maxLifeTime = 8;
    p.emitRate = 90;
    p.direction1 = new BABYLON.Vector3(0, -0.15, 0);
    p.direction2 = new BABYLON.Vector3(0, -0.35, 0);
    p.minEmitPower = 0.15; p.maxEmitPower = 0.5;
    p.start();
    return p;
  };

  return { glowLayer, glow, toonMat, rim, grassTexture, roadTexture, flareTexture: () => sprite, skyDome, burst, dustPuffs, fireflies, smoke, starDust };
}
