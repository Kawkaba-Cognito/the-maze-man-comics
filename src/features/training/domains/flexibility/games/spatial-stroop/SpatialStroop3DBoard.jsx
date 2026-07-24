import React, { useEffect, useRef } from 'react';
import { bootC3dScene, disposeObject, THREE } from '../../../../shared/c3dBoot';
import '../../../../shared/c3dProto.css';

const SIDE_HEX = { left: 0x35b7d4, right: 0xf27d65 };
const SIDE_X = { left: -1.55, right: 1.55 };
const ROT_Z = { left: Math.PI / 2, right: -Math.PI / 2 };
const COLOR_HEX = { red: 0xf05d67, green: 0x65d18b };

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function laneTexture(side, isAr) {
  const S = 640;
  const canvas = document.createElement('canvas');
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext('2d');
  const accent = side === 'left' ? '#35b7d4' : '#f27d65';
  roundRectPath(ctx, 18, 18, S - 36, S - 36, 54);
  ctx.fillStyle = 'rgba(7, 18, 31, 0.96)';
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.strokeStyle = accent;
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = '800 54px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isAr ? (side === 'left' ? 'جهة اليسار' : 'جهة اليمين') : (side === 'left' ? 'LEFT SIDE' : 'RIGHT SIDE'), S / 2, 72);
  ctx.globalAlpha = 0.24;
  ctx.font = '800 230px system-ui, sans-serif';
  ctx.fillText(side === 'left' ? 'L' : 'R', S / 2, S / 2 + 60);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function responseTexture(side, isAr) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '800 210px system-ui, sans-serif';
  ctx.fillText(side === 'left' ? '←' : '→', 384, 182);
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText(isAr ? (side === 'left' ? 'يسار' : 'يمين') : side.toUpperCase(), 384, 382);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  return texture;
}

function arrowShape() {
  const shape = new THREE.Shape();
  shape.moveTo(-0.13, -0.62);
  shape.lineTo(0.13, -0.62);
  shape.lineTo(0.13, 0.16);
  shape.lineTo(0.42, 0.16);
  shape.lineTo(0, 0.72);
  shape.lineTo(-0.42, 0.16);
  shape.lineTo(-0.13, 0.16);
  shape.closePath();
  return shape;
}

function makeArrow(material, scale) {
  const group = new THREE.Group();
  const geometry = new THREE.ShapeGeometry(arrowShape());
  const fill = new THREE.Mesh(geometry, material);
  fill.scale.setScalar(scale);
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x06111d, transparent: true, opacity: 0.95 }),
  );
  outline.scale.setScalar(scale);
  outline.position.z = 0.025;
  group.add(fill, outline);
  group.userData.material = material;
  return group;
}

export default function SpatialStroop3DBoard({
  probe,
  useColor,
  isAr,
  awaitingAnswer,
  leftState,
  rightState,
  ringMs,
  trialKey,
  frozen,
  onAnswer,
}) {
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const onAnswerRef = useRef(onAnswer);
  const interactiveRef = useRef(awaitingAnswer);
  onAnswerRef.current = onAnswer;
  interactiveRef.current = awaitingAnswer;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const boot = bootC3dScene(wrap, {
      fov: 50,
      fitHalf: 3.1,
      bloom: false,
      alpha: true,
      hudReserveFrac: 0,
    });
    if (boot.error) return () => boot.dispose();
    const { camera, playRoot, renderer, setFitBox, setTick, dispose } = boot;
    setFitBox(3.05, 2.65);

    const laneTextures = {};
    const lanes = ['left', 'right'].map((side) => {
      const texture = laneTexture(side, isAr);
      laneTextures[side] = texture;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.82, 1.82),
        new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.48, toneMapped: false }),
      );
      mesh.position.set(SIDE_X[side], 0.48, -0.16);
      mesh.userData.side = side;
      playRoot.add(mesh);
      return mesh;
    });

    const divider = new THREE.Mesh(
      new THREE.PlaneGeometry(0.035, 1.85),
      new THREE.MeshBasicMaterial({ color: 0xd9f6ff, transparent: true, opacity: 0.22, toneMapped: false }),
    );
    divider.position.set(0, 0.48, -0.12);
    playRoot.add(divider);

    const responseTextures = { left: responseTexture('left', isAr), right: responseTexture('right', isAr) };
    const pads = ['left', 'right'].map((side) => {
      const group = new THREE.Group();
      const border = new THREE.Mesh(
        new THREE.BoxGeometry(2.28, 1.12, 0.1),
        new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.84, toneMapped: false }),
      );
      border.position.z = -0.04;
      group.add(border);
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(2.15, 1, 0.16),
        new THREE.MeshBasicMaterial({ color: SIDE_HEX[side], toneMapped: false }),
      );
      group.add(base);
      const label = new THREE.Mesh(
        new THREE.PlaneGeometry(1.8, 0.9),
        new THREE.MeshBasicMaterial({ map: responseTextures[side], transparent: true, toneMapped: false }),
      );
      label.position.z = 0.09;
      group.add(label);
      group.position.set(side === 'left' ? -1.65 : 1.65, -1.72, 0);
      group.userData.side = side;
      group.userData.base = base.material;
      group.userData.targetHex = SIDE_HEX[side];
      playRoot.add(group);
      return group;
    });

    const mainMaterial = new THREE.MeshBasicMaterial({ color: 0xf5fbff, toneMapped: false });
    const mainArrow = makeArrow(mainMaterial, 1.2);
    const stimulus = new THREE.Group();
    stimulus.add(mainArrow);
    const flankers = [-1, 1].map((direction) => {
      const material = new THREE.MeshBasicMaterial({ color: 0xdde8ef, transparent: true, opacity: 0.72, toneMapped: false });
      const arrow = makeArrow(material, 0.46);
      arrow.position.y = direction * 0.72;
      arrow.visible = false;
      stimulus.add(arrow);
      return arrow;
    });
    stimulus.visible = false;
    playRoot.add(stimulus);

    const deadline = new THREE.Mesh(
      new THREE.RingGeometry(0.82, 0.88, 48),
      new THREE.MeshBasicMaterial({ color: 0xf3c65f, transparent: true, opacity: 0.7, side: THREE.DoubleSide, toneMapped: false }),
    );
    deadline.visible = false;
    playRoot.add(deadline);

    const state = { ringStart: performance.now(), ringMs: 2000, trialKey: null, frozen: false };
    const showProbe = (nextProbe, colorOn) => {
      if (!nextProbe) {
        stimulus.visible = false;
        deadline.visible = false;
        return;
      }
      const hex = colorOn && nextProbe.color ? COLOR_HEX[nextProbe.color] : 0xf5fbff;
      mainMaterial.color.setHex(hex);
      mainArrow.rotation.z = ROT_Z[nextProbe.dir] ?? 0;
      stimulus.position.set(SIDE_X[nextProbe.pos] ?? 0, 0.48, 0.12);
      stimulus.scale.setScalar(0.86);
      flankers.forEach((arrow) => {
        arrow.visible = !!nextProbe.flankerDir;
        if (nextProbe.flankerDir) arrow.rotation.z = ROT_Z[nextProbe.flankerDir] ?? 0;
      });
      lanes.forEach((lane) => { lane.material.opacity = lane.userData.side === nextProbe.pos ? 1 : 0.38; });
      deadline.position.set(SIDE_X[nextProbe.pos] ?? 0, 0.48, 0.04);
      stimulus.visible = true;
      deadline.visible = true;
    };

    const setPadStates = (left, right) => {
      pads.forEach((pad) => {
        const value = pad.userData.side === 'left' ? left : right;
        pad.userData.targetHex = value === 'correct' ? 0x62b277 : value === 'wrong' || value === 'timeout' ? 0xdd7f7a : SIDE_HEX[pad.userData.side];
      });
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerUp = (event) => {
      if (!interactiveRef.current) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pads, true)[0];
      let object = hit?.object;
      while (object && object.userData.side === undefined && object.parent) object = object.parent;
      if (object?.userData.side) onAnswerRef.current?.(object.userData.side, event);
    };
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const unitScale = new THREE.Vector3(1, 1, 1);
    const currentColor = new THREE.Color();
    const targetColor = new THREE.Color();
    setTick((dt, now) => {
      stimulus.position.y = 0.48 + Math.sin(now * 0.003) * 0.045;
      stimulus.scale.lerp(unitScale, Math.min(1, dt * 12));
      pads.forEach((pad) => {
        currentColor.copy(pad.userData.base.color);
        targetColor.setHex(pad.userData.targetHex);
        pad.userData.base.color.copy(currentColor.lerp(targetColor, Math.min(1, dt * 10)));
      });
      if (deadline.visible) {
        const fraction = Math.max(0, 1 - (now - state.ringStart) / Math.max(1, state.ringMs));
        deadline.scale.setScalar(0.82 + fraction * 0.18);
        deadline.material.color.setHex(state.frozen ? 0x55d6e8 : fraction < 0.3 ? 0xdd7f7a : 0xf3c65f);
        deadline.material.opacity = 0.25 + fraction * 0.55;
      }
    });

    apiRef.current = {
      showProbe,
      setPadStates,
      setDeadline: (ms, key, isFrozen, visible) => {
        if (state.trialKey !== key) state.ringStart = performance.now();
        state.trialKey = key;
        state.ringMs = Math.max(1, ms || 1);
        state.frozen = !!isFrozen;
        deadline.visible = !!visible && stimulus.visible;
      },
    };

    return () => {
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      Object.values(laneTextures).forEach((texture) => texture.dispose());
      Object.values(responseTextures).forEach((texture) => texture.dispose());
      [...lanes, ...pads, stimulus, deadline, divider].forEach((object) => {
        disposeObject(object);
        object.removeFromParent();
      });
      dispose();
      apiRef.current = {};
    };
  }, [isAr]);

  useEffect(() => { apiRef.current.showProbe?.(probe, useColor); }, [probe, useColor]);
  useEffect(() => { apiRef.current.setPadStates?.(leftState, rightState); }, [leftState, rightState]);
  useEffect(() => { apiRef.current.setDeadline?.(ringMs, trialKey, frozen, awaitingAnswer); }, [ringMs, trialKey, frozen, awaitingAnswer]);

  return (
    <div
      ref={wrapRef}
      className="ct-stroop-3d-board"
      role="group"
      aria-label={isAr ? 'لوحة لعبة اندفاع السهم' : 'Arrow Rush game board'}
    />
  );
}
