import { ITEMS_BY_ID, SHOP_SLOTS } from '../../features/character/items';

/**
 * Code-built player avatars (fox / man / woman) for the 3D world. No model
 * files: geometry is primitives + merged sweeps, the "art" comes from the
 * comic kit (gold rim light, glow) and from animation — blink, secondary
 * motion (tail/ear lag), lean into turns, squash-and-stretch.
 *
 * Returns { rig: { root, update(moving, cyc, time, yawVel) } }.
 */
export function buildCharacter(BABYLON, s, parent, shadowGenerator, variant, equipped, kit) {
  const root = new BABYLON.TransformNode('charRoot', s);
  root.parent = parent;
  root.position.y = -2.0; // collider centre is at y=2 → drop to ground

  const GOLD_RIM = [0.3, 0.22, 0.07];
  const matBlack = kit.toonMat('cBlack', 0.07, 0.07, 0.09, { spec: 0.25, rim: GOLD_RIM, rimBias: 0.18, rimPower: 3.2 });
  const matGold = kit.toonMat('cGold', 0.85, 0.65, 0.18, { emis: [0.35, 0.26, 0.05], spec: 0.5 });
  const matEye = kit.toonMat('cEye', 1, 0.8, 0.3, { emis: [1, 0.78, 0.25] });

  const add = (mesh, mat, x, y, z) => {
    mesh.material = mat; mesh.position.set(x, y, z); mesh.parent = root;
    shadowGenerator.addShadowCaster(mesh); return mesh;
  };
  const node = (name, x, y, z, par) => { const n = new BABYLON.TransformNode(name, s); n.parent = par || root; n.position.set(x, y, z); return n; };
  const cast = (m) => { shadowGenerator.addShadowCaster(m); return m; };

  // Equipped gear → parented to the matching BONE node so it moves with the body.
  const mats = {
    black: matBlack,
    gold: matGold,
    eye: matEye,
    make: (r, g, b, emis) => kit.toonMat('itm', r, g, b, emis ? { emis } : { rim: GOLD_RIM, rimBias: 0.4 }),
    glow: kit.glow,
  };
  const applyEquip = (attach) => {
    if (!equipped) return;
    SHOP_SLOTS.forEach((slot) => {
      const it = ITEMS_BY_ID[equipped[slot]];
      if (!it || !it.build3d) return;
      const par = attach[it.attach || slot];
      if (!par) return;
      it.build3d({ BABYLON, s, parent: par, mats, shadow: shadowGenerator });
    });
  };

  // ── Blink system: every few seconds squash the listed eye meshes shut. ──
  const eyeMeshes = [];
  let nextBlink = 2 + Math.random() * 3;
  const blinkTick = (time) => {
    if (time > nextBlink) nextBlink = time + 2.6 + Math.random() * 3.4;
    const closing = nextBlink - time > 0 && nextBlink - time < 0.13;
    eyeMeshes.forEach((e) => {
      e.scaling.y = BABYLON.Scalar.Lerp(e.scaling.y, closing ? 0.08 : (e._oy ?? 1), 0.55);
    });
  };
  const trackEye = (m) => { m._oy = m.scaling.y; eyeMeshes.push(m); return m; };

  // ───────────────── Humanoid (man / woman) — GEOMETRIC MASCOT rig ─────────
  // Matches the 2D PersonCharacter doctrine: big round head (~1/3 of height),
  // capsule body, stubby limbs, flat friendly face (ink dot eyes + smile —
  // no eyeball whites / nose / brow boxes, which read uncanny on primitives).
  if (variant === 'male' || variant === 'female') {
    const V3 = (x, y, z) => new BABYLON.Vector3(x, y, z);
    const female = variant === 'female';
    // skin/hair match the 2D palette (#cf9367/#e0a87b, #2a2018/#3a2433)
    const skin = kit.toonMat('cSkin', female ? 0.88 : 0.81, female ? 0.66 : 0.58, female ? 0.48 : 0.4, { spec: 0.1 });
    const hair = kit.toonMat('cHair', female ? 0.23 : 0.16, female ? 0.14 : 0.13, female ? 0.2 : 0.09, { spec: 0.3, rim: GOLD_RIM });
    const cloth = kit.toonMat('cCloth', 0.1, 0.1, 0.13, { spec: 0.15, rim: GOLD_RIM });
    const sh = female ? 0.56 : 0.7;

    // Bone = a pivot node + a tapered cylinder hanging from it.
    const segment = (par, px, py, pz, len, dT, dB, mat, nm) => {
      const piv = node(nm + 'P', px, py, pz, par);
      const m = BABYLON.MeshBuilder.CreateCylinder(nm, { diameterTop: dT, diameterBottom: dB, height: len, tessellation: 12 }, s);
      m.parent = piv; m.position.y = -len / 2; m.material = mat; cast(m);
      return piv;
    };

    const hipY = 1.0;
    const mkLeg = (sgn) => {
      const thigh = segment(root, sgn * 0.24, hipY, 0, 0.5, 0.34, 0.38, cloth, 'thigh');
      const shin = segment(thigh, 0, -0.5, 0, 0.46, 0.28, 0.3, cloth, 'shin');
      const foot = BABYLON.MeshBuilder.CreateBox('foot', { width: 0.4, height: 0.22, depth: 0.6 }, s);
      foot.parent = shin; foot.position.set(0, -0.5, 0.12); foot.material = matBlack; cast(foot);
      return { thigh, shin };
    };
    const legL = mkLeg(-1), legR = mkLeg(1);

    // Upper body node — sways / twists / bobs as one unit.
    const upper = node('upper', 0, hipY, 0, root);
    const torso = BABYLON.MeshBuilder.CreateCylinder('torso', {
      diameterTop: sh * 1.9, diameterBottom: female ? sh * 1.6 : sh * 1.9, height: 0.95, tessellation: 18,
    }, s);
    torso.parent = upper; torso.position.y = 0.42; torso.material = cloth; cast(torso);
    const shoulders = BABYLON.MeshBuilder.CreateSphere('shB', { diameter: sh * 1.95, segments: 14 }, s);
    shoulders.parent = upper; shoulders.position.y = 0.86; shoulders.scaling = V3(1, 0.5, 0.9); shoulders.material = cloth; cast(shoulders);
    const belt = BABYLON.MeshBuilder.CreateTorus('belt', { diameter: female ? sh * 1.62 : sh * 1.92, thickness: 0.11, tessellation: 18 }, s);
    belt.rotation.x = Math.PI / 2; belt.parent = upper; belt.position.y = -0.02; belt.material = matGold; cast(belt);
    // chest maze emblem (brand mark, mirrors the 2D badge)
    const emblem = BABYLON.MeshBuilder.CreateBox('emblem', { width: 0.3, height: 0.3, depth: 0.06 }, s);
    emblem.parent = upper; emblem.position.set(0, 0.52, sh * 0.92); emblem.material = matGold; cast(emblem);
    if (female) {
      const skirt = BABYLON.MeshBuilder.CreateCylinder('skirt', { diameterTop: sh * 1.6, diameterBottom: sh * 2.6, height: 0.62, tessellation: 18 }, s);
      skirt.parent = upper; skirt.position.y = -0.32; skirt.material = cloth; cast(skirt);
    }

    const mkArm = (sgn) => {
      const up = segment(upper, sgn * (sh + 0.04), 0.86, 0, 0.42, 0.22, 0.24, cloth, 'uarm');
      const fore = segment(up, 0, -0.42, 0, 0.38, 0.19, 0.21, cloth, 'farm');
      const hand = node('hand', 0, -0.42, 0, fore);
      const hm = BABYLON.MeshBuilder.CreateSphere('handM', { diameter: 0.3, segments: 10 }, s);
      hm.parent = hand; hm.material = skin; cast(hm);
      return { up, fore, hand };
    };
    const armL = mkArm(-1), armR = mkArm(1);

    // Neck → BIG mascot head (headPivot lets the head bob/turn).
    const neckN = node('neckN', 0, 1.06, 0.02, upper);
    const headPivot = node('headP', 0, 0.06, 0, neckN);
    const headN = node('headN', 0, 0.66, 0, headPivot);
    const headM = BABYLON.MeshBuilder.CreateSphere('headM', { diameter: 1.5, segments: 20 }, s);
    headM.parent = headN; headM.scaling = V3(1, 1, 0.97); headM.material = skin; cast(headM);

    // Flat mascot face: ink dot eyes (blinkable) + smile. Nothing else.
    const matPup = kit.toonMat('pup', 0.05, 0.04, 0.04);
    [-1, 1].forEach((sgn) => {
      const e = BABYLON.MeshBuilder.CreateSphere('eyeD', { diameter: 0.15, segments: 10 }, s);
      e.parent = headN; e.position.set(sgn * 0.26, 0.06, 0.69); e.scaling = V3(1, 1, 0.5); e.material = matPup; trackEye(e);
    });
    const smile = BABYLON.MeshBuilder.CreateTorus('smile', { diameter: 0.3, thickness: 0.035, tessellation: 20 }, s);
    smile.parent = headN; smile.position.set(0, -0.24, 0.66); smile.rotation.x = Math.PI / 2.6; smile.material = matPup;
    // hair: cap for everyone, long back mass for the woman
    if (female) {
      const hb = BABYLON.MeshBuilder.CreateSphere('hairB', { diameter: 1.58, segments: 14 }, s);
      hb.parent = headN; hb.position.set(0, -0.12, -0.22); hb.scaling = V3(0.98, 1.45, 0.82); hb.material = hair; cast(hb);
    }
    const hc = BABYLON.MeshBuilder.CreateSphere('hairC', { diameter: 1.56, segments: 14 }, s);
    hc.parent = headN; hc.position.set(0, 0.3, -0.06); hc.scaling = V3(1, 0.72, 1); hc.material = hair; cast(hc);

    // Gear nodes scaled ~1.5 so the item build3d's (authored for the old small
    // head) sit correctly on the big mascot head without re-authoring.
    const hatN = node('hatN', 0, 0.28, 0, headN); hatN.scaling.setAll(1.5);
    const faceN = node('faceN', 0, 0.02, 0.24, headN); faceN.scaling.setAll(1.4);
    const neckGearN = node('neckGearN', 0, 0.02, 0, neckN); neckGearN.scaling.setAll(1.25);
    const backN = node('backN', 0, 0.8, -0.2, upper); backN.scaling.setAll(1.2);
    applyEquip({ hat: hatN, face: faceN, neck: neckGearN, back: backN, hand: armR.hand });
    const holding = !!(equipped && equipped.back === 'balloon'); // hand-held item → pose the right arm

    const update = (moving, cyc, time, yawVel = 0) => {
      const L = BABYLON.Scalar.Lerp;
      blinkTick(time);
      // lean into turns + slight forward lean while moving
      root.rotation.z = L(root.rotation.z, BABYLON.Scalar.Clamp(-yawVel * 1.6, -0.12, 0.12), 0.12);
      root.rotation.x = L(root.rotation.x, moving ? 0.06 : 0, 0.08);
      // head looks a touch into the turn, then settles
      headPivot.rotation.y = L(headPivot.rotation.y, BABYLON.Scalar.Clamp(yawVel * 4, -0.3, 0.3), 0.1);
      if (moving) {
        const sw = Math.sin(cyc);
        legL.thigh.rotation.x = sw * 0.55; legR.thigh.rotation.x = -sw * 0.55;
        legL.shin.rotation.x = -Math.max(0, Math.sin(cyc + Math.PI * 0.5)) * 0.9; // knee bends on swing
        legR.shin.rotation.x = -Math.max(0, Math.sin(cyc - Math.PI * 0.5)) * 0.9;
        armL.up.rotation.x = -sw * 0.5; armL.fore.rotation.x = -0.25 - Math.max(0, -sw) * 0.25;
        if (holding) { armR.up.rotation.x = -0.85; armR.fore.rotation.x = -1.15; }
        else { armR.up.rotation.x = sw * 0.5; armR.fore.rotation.x = -0.25 - Math.max(0, sw) * 0.25; }
        upper.position.y = hipY + Math.abs(Math.sin(cyc * 2)) * 0.06;
        upper.rotation.z = sw * 0.045;
        upper.rotation.y = sw * 0.07;
        headPivot.rotation.x = Math.sin(cyc * 2) * 0.02;
      } else {
        legL.thigh.rotation.x = L(legL.thigh.rotation.x, 0, 0.15); legR.thigh.rotation.x = L(legR.thigh.rotation.x, 0, 0.15);
        legL.shin.rotation.x = L(legL.shin.rotation.x, 0, 0.15); legR.shin.rotation.x = L(legR.shin.rotation.x, 0, 0.15);
        armL.up.rotation.x = L(armL.up.rotation.x, 0.05, 0.1); armL.fore.rotation.x = L(armL.fore.rotation.x, -0.22, 0.1);
        if (holding) { armR.up.rotation.x = L(armR.up.rotation.x, -0.85, 0.12); armR.fore.rotation.x = L(armR.fore.rotation.x, -1.15, 0.12); }
        else { armR.up.rotation.x = L(armR.up.rotation.x, 0.05, 0.1); armR.fore.rotation.x = L(armR.fore.rotation.x, -0.22, 0.1); }
        upper.position.y = L(upper.position.y, hipY + Math.sin(time * 1.4) * 0.02, 0.1); // breathing
        upper.rotation.z = L(upper.rotation.z, Math.sin(time * 0.7) * 0.015, 0.08);
        // idle weight shift: hips sway gently side to side
        upper.rotation.y = L(upper.rotation.y, Math.sin(time * 0.5) * 0.04, 0.06);
        headPivot.rotation.x = L(headPivot.rotation.x, 0, 0.1);
      }
    };

    return { rig: { root, update } };
  }

  // ───────────────── Fox (default) — geometric mascot ─────────────────
  // Matches the 2D FoxCharacter: cream muzzle + chest, ink nose, gold inner
  // ears + tail tip; no gems/collar clutter. Bigger head for mascot ratio.
  const matCream = kit.toonMat('cCream', 0.92, 0.88, 0.78, { spec: 0.1 });
  const body = BABYLON.MeshBuilder.CreateSphere('body', { diameter: 1.45, segments: 12 }, s);
  body.scaling = new BABYLON.Vector3(1, 0.85, 1.6); add(body, matBlack, 0, 1.2, -0.1);
  const head = BABYLON.MeshBuilder.CreateSphere('head', { diameter: 1.3, segments: 14 }, s); add(head, matBlack, 0, 1.62, 1.0);
  const snout = BABYLON.MeshBuilder.CreateCylinder('snout', { diameterTop: 0.12, diameterBottom: 0.5, height: 0.5, tessellation: 12 }, s);
  snout.rotation.x = Math.PI / 2; add(snout, matCream, 0, 1.5, 1.7);
  const noseTip = BABYLON.MeshBuilder.CreateSphere('noseTip', { diameter: 0.15, segments: 8 }, s); add(noseTip, matBlack, 0, 1.5, 1.96);

  const earL = BABYLON.MeshBuilder.CreateCylinder('earL', { diameterTop: 0, diameterBottom: 0.52, height: 0.85, tessellation: 6 }, s);
  earL.rotation.z = 0.18; add(earL, matBlack, -0.42, 2.42, 0.9);
  const earR = BABYLON.MeshBuilder.CreateCylinder('earR', { diameterTop: 0, diameterBottom: 0.52, height: 0.85, tessellation: 6 }, s);
  earR.rotation.z = -0.18; add(earR, matBlack, 0.42, 2.42, 0.9);
  const earLin = BABYLON.MeshBuilder.CreateCylinder('earLin', { diameterTop: 0, diameterBottom: 0.26, height: 0.5, tessellation: 6 }, s); add(earLin, matGold, -0.34, 2.05, 1.02);
  const earRin = BABYLON.MeshBuilder.CreateCylinder('earRin', { diameterTop: 0, diameterBottom: 0.26, height: 0.5, tessellation: 6 }, s); add(earRin, matGold, 0.34, 2.05, 1.02);
  earLin.parent = earL; earLin.position.set(0, 0, 0.07); earLin.rotation.z = 0;
  earRin.parent = earR; earRin.position.set(0, 0, 0.07); earRin.rotation.z = 0;

  const eyeL = BABYLON.MeshBuilder.CreateSphere('eyeL', { diameter: 0.24 }, s); add(eyeL, matEye, -0.3, 1.72, 1.5); trackEye(kit.glow(eyeL));
  const eyeR = BABYLON.MeshBuilder.CreateSphere('eyeR', { diameter: 0.24 }, s); add(eyeR, matEye, 0.3, 1.72, 1.5); trackEye(kit.glow(eyeR));
  // cream chest bib (mirrors the 2D fox)
  const mane = BABYLON.MeshBuilder.CreateSphere('mane', { diameter: 0.95, segments: 10 }, s); mane.scaling = new BABYLON.Vector3(0.95, 1.15, 0.6); add(mane, matCream, 0, 1.05, 0.92);
  const mkLeg = (name, x, z) => { const l = BABYLON.MeshBuilder.CreateCylinder(name, { diameter: 0.32, height: 1.0 }, s); return add(l, matBlack, x, 0.5, z); };
  const legFL = mkLeg('legFL', -0.42, 0.6), legFR = mkLeg('legFR', 0.42, 0.6), legBL = mkLeg('legBL', -0.42, -0.7), legBR = mkLeg('legBR', 0.42, -0.7);

  // ── Tail: one smooth tapered sweep (spheres merged along a curve), gold tip ──
  const tailPivot = new BABYLON.TransformNode('tailPivot', s); tailPivot.parent = root; tailPivot.position.set(0, 1.35, -0.95);
  const bez = (t, a, c, b) => {
    const u = 1 - t;
    return new BABYLON.Vector3(
      u * u * a.x + 2 * u * t * c.x + t * t * b.x,
      u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      u * u * a.z + 2 * u * t * c.z + t * t * b.z,
    );
  };
  const tA = new BABYLON.Vector3(0, -0.1, 0.1), tC = new BABYLON.Vector3(0, 0.05, -1.25), tB = new BABYLON.Vector3(0, 0.95, -1.7);
  const tailParts = [];
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    const seg = BABYLON.MeshBuilder.CreateSphere('tseg', { diameter: 1.05 - t * 0.62, segments: 10 }, s);
    seg.position = bez(t, tA, tC, tB);
    tailParts.push(seg);
  }
  const tailMesh = BABYLON.Mesh.MergeMeshes(tailParts, true, true);
  tailMesh.material = matBlack; tailMesh.parent = tailPivot; cast(tailMesh);
  const tipParts = [];
  for (let i = 0; i < 3; i++) {
    const t = 0.82 + i * 0.09;
    const seg = BABYLON.MeshBuilder.CreateSphere('ttip', { diameter: 0.52 - i * 0.13, segments: 8 }, s);
    seg.position = bez(t, tA, tC, tB).add(new BABYLON.Vector3(0, 0.04 + i * 0.05, 0));
    tipParts.push(seg);
  }
  const tailTip = BABYLON.Mesh.MergeMeshes(tipParts, true, true);
  tailTip.material = matGold; tailTip.parent = tailPivot; kit.glow(tailTip);

  // Bone nodes for equipped gear (balloon is held in the mouth), scaled so
  // item build3d's authored for a smaller head still fit the mascot head.
  const fHead = node('fHead', 0, 1.66, 1.0); fHead.scaling.setAll(1.3);
  const fNeck = node('fNeck', 0, 1.26, 0.55); fNeck.scaling.setAll(1.15);
  const fBack = node('fBack', 0, 1.4, -0.8); fBack.scaling.setAll(1.15);
  const fMouth = node('fMouth', 0, 1.46, 1.85);
  applyEquip({ hat: fHead, face: fHead, neck: fNeck, back: fBack, hand: fMouth });

  // ── Idle ear twitches ──
  let twitchStart = 4 + Math.random() * 4;
  let twitchSide = 1;

  const update = (moving, cyc, time = 0, yawVel = 0) => {
    const L = BABYLON.Scalar.Lerp;
    blinkTick(time);
    // lean into turns; nose dips slightly when running
    root.rotation.z = L(root.rotation.z, BABYLON.Scalar.Clamp(-yawVel * 2.2, -0.16, 0.16), 0.14);
    root.rotation.x = L(root.rotation.x, moving ? 0.05 : 0, 0.08);
    // tail drags behind the turn (secondary motion) + wag
    tailPivot.rotation.y = L(tailPivot.rotation.y, BABYLON.Scalar.Clamp(-yawVel * 7, -0.9, 0.9), 0.1);
    if (moving) {
      const sw = Math.sin(cyc) * 0.5;
      legFL.rotation.x = sw; legBR.rotation.x = sw; legFR.rotation.x = -sw; legBL.rotation.x = -sw;
      const hop = Math.abs(Math.sin(cyc * 2));
      body.position.y = 1.2 + hop * 0.1;
      body.scaling.y = 0.85 + hop * 0.05; // stretch at the top of the hop
      body.scaling.x = 1.02 - hop * 0.04;
      tailPivot.rotation.z = Math.sin(cyc * 2) * 0.35;
    } else {
      [legFL, legFR, legBL, legBR].forEach((l) => { l.rotation.x = L(l.rotation.x, 0, 0.15); });
      body.position.y = L(body.position.y, 1.2 + Math.sin(time * 1.6) * 0.015, 0.15); // breathing
      body.scaling.y = L(body.scaling.y, 0.85, 0.1);
      body.scaling.x = L(body.scaling.x, 1, 0.1);
      tailPivot.rotation.z = L(tailPivot.rotation.z, Math.sin(time * 1.1) * 0.12, 0.06); // lazy idle wag
      // occasional ear twitch (0.6s flutter, then schedule the next one)
      if (time > twitchStart + 0.6) { twitchStart = time + 3.5 + Math.random() * 5; twitchSide = Math.random() > 0.5 ? 1 : -1; }
      const tw = (time - twitchStart) / 0.6;
      const flick = tw >= 0 && tw <= 1 ? Math.sin(tw * Math.PI * 3) * 0.22 : 0;
      (twitchSide > 0 ? earR : earL).rotation.z = (twitchSide > 0 ? -0.18 : 0.18) + flick;
    }
  };
  return { rig: { root, update } };
}
