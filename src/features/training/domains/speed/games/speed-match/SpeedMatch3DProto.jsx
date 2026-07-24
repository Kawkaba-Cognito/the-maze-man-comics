import React, { useEffect, useRef } from 'react';
import { bootC3dScene, matStd, THREE } from '../../../../shared/c3dBoot';
import { shapeGeometry } from '../../../../shared/c3dShapes';

const INK = '#f0e2c0';
const CARD_BG = '#241d13';
const GOLD = '#e8ac4e';

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glyphCard(kind, value) {
  const size = 150;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = CARD_BG;
  roundRectPath(ctx, 5, 5, size - 10, size - 10, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(240,226,192,0.35)';
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = kind === 'key' ? GOLD : INK;
  ctx.font = '800 84px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(value), size / 2, size / 2 + 4);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function cardMesh(texture, width, height) {
  const side = matStd(0x1d1811, { metalness: 0.15, roughness: 0.7 });
  const face = new THREE.MeshStandardMaterial({
    map: texture,
    emissive: new THREE.Color(0x62b277),
    emissiveIntensity: 0,
    metalness: 0.12,
    roughness: 0.6,
  });
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, 0.12),
    [side, side, side, side, face, side],
  );
  mesh.userData.faceMat = face;
  mesh.userData.flash = 0;
  return mesh;
}

function disposeOwned(root, keepGeometry = false) {
  root.traverse((node) => {
    if (!keepGeometry) node.geometry?.dispose?.();
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach((material) => {
      if (!material) return;
      for (const key of Object.keys(material)) {
        if (material[key]?.isTexture) material[key].dispose();
      }
      material.dispose?.();
    });
  });
}

export default function SpeedMatch3DProto({ legend, item, interactive, onAnswer, pressedKey }) {
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const answerRef = useRef(onAnswer);
  const interactiveRef = useRef(interactive);
  answerRef.current = onAnswer;
  interactiveRef.current = interactive;

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.6, bloom: true });
    if (boot.error) return () => boot.dispose();
    const { camera, playRoot, coarse, setTick, setFitBox, renderer, dispose } = boot;
    let keyMeshes = [];
    let digitMeshes = [];
    let probeMesh = null;

    const clearKey = () => {
      keyMeshes.forEach((mesh) => { playRoot.remove(mesh); disposeOwned(mesh, true); });
      keyMeshes = [];
    };
    const clearDigits = () => {
      digitMeshes.forEach((mesh) => { playRoot.remove(mesh); disposeOwned(mesh); });
      digitMeshes = [];
    };
    const clearProbe = () => {
      if (!probeMesh) return;
      playRoot.remove(probeMesh);
      disposeOwned(probeMesh, !!probeMesh.userData.sharedGeometry);
      probeMesh = null;
    };

    const syncLegend = (nextLegend = []) => {
      clearKey();
      clearDigits();
      const entries = nextLegend || [];
      const count = entries.length;
      if (!count) return;
      const gapX = coarse ? 1.02 : 1.08;
      const perRow = count <= 6 ? count : Math.ceil(count / 2);
      entries.forEach((entry, index) => {
        const row = Math.floor(index / perRow);
        const col = index % perRow;
        const rowLength = row === 0 ? Math.min(count, perRow) : count - perRow;
        const group = new THREE.Group();
        if (entry.symbol) {
          const shape = new THREE.Mesh(
            shapeGeometry(entry.symbol),
            matStd(0xf0e2c0, { emissive: 0xf0e2c0, emissiveIntensity: 0.22, metalness: 0.3, roughness: 0.5 }),
          );
          shape.scale.setScalar(0.56);
          shape.position.y = 0.36;
          group.add(shape);
        }
        const digit = cardMesh(glyphCard('key', entry.digit), 0.52, 0.52);
        digit.position.y = entry.symbol ? -0.38 : 0;
        group.add(digit);
        group.position.set((col - (rowLength - 1) / 2) * gapX, 2.45 - row * 1.5, 0);
        playRoot.add(group);
        keyMeshes.push(group);
      });

      const digits = entries.map((entry) => entry.digit).sort((a, b) => a - b);
      const digitGap = coarse ? 1.05 : 1.12;
      const digitPerRow = digits.length <= 6 ? digits.length : Math.ceil(digits.length / 2);
      digits.forEach((digit, index) => {
        const row = Math.floor(index / digitPerRow);
        const col = index % digitPerRow;
        const rowLength = row === 0 ? Math.min(digits.length, digitPerRow) : digits.length - digitPerRow;
        const mesh = cardMesh(glyphCard('digit', digit), 0.95, 0.95);
        mesh.position.set((col - (rowLength - 1) / 2) * digitGap, -1.75 - row * 1.15, 0);
        mesh.userData.digit = digit;
        playRoot.add(mesh);
        digitMeshes.push(mesh);
      });

      const rows = count <= 6 ? 1 : 2;
      const bottomY = -1.75 - (rows - 1) * 1.15 - 0.55;
      const keyHalfX = ((Math.min(count, perRow) - 1) * gapX) / 2 + 0.4;
      const digitHalfX = ((Math.min(count, digitPerRow) - 1) * digitGap) / 2 + 0.58;
      setFitBox(Math.max(keyHalfX, digitHalfX) + 0.15, Math.max(3.05, -bottomY) + 0.18);
    };

    const syncItem = (nextItem) => {
      clearProbe();
      if (!nextItem) return;
      if (nextItem.symbol) {
        probeMesh = new THREE.Mesh(
          shapeGeometry(nextItem.symbol),
          matStd(0xf0e2c0, { emissive: 0xe8ac4e, emissiveIntensity: 0.4, metalness: 0.35, roughness: 0.4 }),
        );
        probeMesh.userData.sharedGeometry = true;
      } else {
        probeMesh = cardMesh(glyphCard('digit', nextItem.digit), 1.35, 1.35);
      }
      probeMesh.position.set(0, 0.35, 0.25);
      probeMesh.scale.setScalar(0.01);
      probeMesh.userData.enterT = 0;
      probeMesh.userData.baseScale = nextItem.symbol ? 1.2 : 1;
      playRoot.add(probeMesh);
    };

    const flashDigit = (digit) => {
      const mesh = digitMeshes.find((entry) => entry.userData.digit === digit);
      if (mesh) mesh.userData.flash = 0.7;
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const projected = new THREE.Vector3();
    const resolveDigit = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(digitMeshes, false);
      if (hits.length) return hits[0].object.userData.digit;
      let best = null;
      let bestDistance = coarse ? 0.15 : 0.09;
      digitMeshes.forEach((mesh) => {
        projected.copy(mesh.position).add(playRoot.position).project(camera);
        const distance = Math.hypot(projected.x - pointer.x, projected.y - pointer.y);
        if (distance < bestDistance) { bestDistance = distance; best = mesh.userData.digit; }
      });
      return best;
    };
    const onPointerUp = (event) => {
      if (!interactiveRef.current || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const digit = resolveDigit(event.clientX, event.clientY);
      if (digit != null) answerRef.current?.(digit);
    };
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    setTick((dt, now) => {
      if (probeMesh) {
        const state = probeMesh.userData;
        if (state.enterT < 1) {
          state.enterT = Math.min(1, state.enterT + dt * 3.2);
          const eased = 1 - (1 - state.enterT) ** 3;
          probeMesh.scale.setScalar(Math.max(0.01, (state.baseScale || 1) * eased));
        }
        probeMesh.rotation.y = Math.sin(now * 0.0014) * 0.12;
      }
      digitMeshes.forEach((mesh) => {
        const state = mesh.userData;
        if (state.flash > 0) {
          state.flash = Math.max(0, state.flash - dt);
          state.faceMat.emissive.setHex(0x62b277);
          state.faceMat.emissiveIntensity = state.flash;
        } else state.faceMat.emissiveIntensity = 0;
      });
    });

    apiRef.current = { syncLegend, syncItem, flashDigit };
    return () => {
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      clearKey();
      clearDigits();
      clearProbe();
      dispose();
      apiRef.current = {};
    };
  }, []);

  useEffect(() => { apiRef.current.syncLegend?.(legend); }, [legend]);
  useEffect(() => { apiRef.current.syncItem?.(item); }, [item]);
  useEffect(() => { if (pressedKey != null) apiRef.current.flashDigit?.(pressedKey); }, [pressedKey]);

  return <div ref={wrapRef} className="ct-sm-scene3d" aria-hidden="true" />;
}
