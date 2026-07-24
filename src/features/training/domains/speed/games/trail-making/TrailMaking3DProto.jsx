import React, { useEffect, useRef } from 'react';
import { bootC3dScene, matStd, disposeObject, THREE } from '../../../../shared/c3dBoot';

const COLORS = [0x0072b2, 0xe69f00];
const DONE = 0x49616e;
const DECOY = 0x8a7a5c;

function labelTexture(label) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.font = '800 76px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(10,8,4,0.85)';
  ctx.strokeText(String(label), size / 2, size / 2 + 2);
  ctx.fillStyle = '#fff';
  ctx.fillText(String(label), size / 2, size / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function nodeMesh(item) {
  const group = new THREE.Group();
  const color = item.isDecoy ? DECOY : COLORS[item.color] ?? COLORS[0];
  const sphere = new THREE.Mesh(
    item.isDecoy ? new THREE.OctahedronGeometry(0.4) : new THREE.SphereGeometry(0.42, 24, 18),
    matStd(color, { emissive: color, emissiveIntensity: 0.3, metalness: 0.25, roughness: 0.5 }),
  );
  group.add(sphere);
  group.userData.faceMat = sphere.material;
  group.userData.itemId = item.id;
  group.userData.item = item;
  if (!item.isDecoy) {
    const texture = labelTexture(item.n);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.56, 0.56),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    label.position.z = 0.43;
    label.userData.ownedTexture = texture;
    group.add(label);
  } else {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.25, 0.05, 10, 20),
      matStd(0xd7c9aa, { emissiveIntensity: 0.15, roughness: 0.65 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.y = Math.PI / 4;
    group.add(ring);
  }
  return group;
}

export default function TrailMaking3DProto({
  items,
  variant,
  startColor,
  progress,
  interactive,
  onPick,
}) {
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const pickRef = useRef(onPick);
  const interactiveRef = useRef(interactive);
  const stateRef = useRef({ variant, startColor, progress });
  pickRef.current = onPick;
  interactiveRef.current = interactive;
  stateRef.current = { variant, startColor, progress };

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;
    const boot = bootC3dScene(wrap, { fov: 52, fitHalf: 4.8, bloom: true, hudReserveFrac: 0 });
    if (boot.error) return () => boot.dispose();
    const { camera, playRoot, renderer, setFitBox, setTick, dispose } = boot;
    let meshes = [];
    let byId = new Map();

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3));
    lineGeometry.setDrawRange(0, 0);
    const line = new THREE.Line(
      lineGeometry,
      new THREE.LineBasicMaterial({ color: 0xe8ac4e, transparent: true, opacity: 0.95, depthTest: false }),
    );
    line.renderOrder = 5;
    playRoot.add(line);

    const clear = () => {
      meshes.forEach((mesh) => {
        mesh.traverse((node) => node.userData?.ownedTexture?.dispose?.());
        playRoot.remove(mesh);
        disposeObject(mesh);
      });
      meshes = [];
      byId = new Map();
      lineGeometry.setDrawRange(0, 0);
    };

    const syncState = () => {
      const state = stateRef.current;
      const positions = lineGeometry.attributes.position;
      let lineCount = 0;
      for (let number = 1; number <= state.progress; number += 1) {
        const expectedColor = state.variant === 'color' ? (state.startColor + number - 1) % 2 : 0;
        const node = meshes.find((mesh) => {
          const item = mesh.userData.item;
          return !item.isDecoy && item.n === number && item.color === expectedColor;
        });
        if (!node) continue;
        positions.setXYZ(lineCount, node.position.x, node.position.y, 0.5);
        lineCount += 1;
      }
      lineGeometry.setDrawRange(0, lineCount);
      positions.needsUpdate = true;
      meshes.forEach((mesh) => {
        const item = mesh.userData.item;
        const done = !item.isDecoy && item.n <= state.progress;
        mesh.userData.faceMat.color.setHex(done ? DONE : (item.isDecoy ? DECOY : COLORS[item.color]));
        mesh.userData.faceMat.emissiveIntensity = done ? 0.05 : 0.3;
        mesh.scale.setScalar(done ? 0.78 : 1);
      });
    };

    const syncItems = (nextItems = []) => {
      clear();
      nextItems.forEach((item) => {
        const mesh = nodeMesh(item);
        mesh.position.set((item.fx - 0.5) * 8, (0.5 - item.fy) * 8.6, 0);
        playRoot.add(mesh);
        meshes.push(mesh);
        byId.set(item.id, mesh);
      });
      setFitBox(4.45, 4.8);
      syncState();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const onPointerDown = (event) => {
      if (!interactiveRef.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(meshes, true);
      if (!hits.length) return;
      let object = hits[0].object;
      while (object.parent && object.userData.itemId == null) object = object.parent;
      if (object.userData.itemId == null) return;
      const item = object.userData.item;
      const state = stateRef.current;
      const next = state.progress + 1;
      const expectedColor = (state.startColor + next - 1) % 2;
      const correct = !item.isDecoy && item.n === next && (state.variant !== 'color' || item.color === expectedColor);
      object.userData.flash = 0.7;
      object.userData.flashHex = correct ? 0x62b277 : 0xdd7f7a;
      pickRef.current?.(object.userData.itemId);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    setTick((dt, now) => {
      meshes.forEach((mesh, index) => {
        mesh.rotation.y = Math.sin(now * 0.001 + index) * 0.1;
        if (mesh.userData.flash > 0) {
          mesh.userData.flash = Math.max(0, mesh.userData.flash - dt);
          mesh.userData.faceMat.emissive.setHex(mesh.userData.flashHex);
          mesh.userData.faceMat.emissiveIntensity = mesh.userData.flash;
        } else {
          const item = mesh.userData.item;
          mesh.userData.faceMat.emissive.setHex(item.isDecoy ? DECOY : COLORS[item.color]);
        }
      });
    });

    apiRef.current = { syncItems, syncState };
    return () => {
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      clear();
      lineGeometry.dispose();
      line.material.dispose();
      dispose();
      apiRef.current = {};
    };
  }, []);

  useEffect(() => { apiRef.current.syncItems?.(items); }, [items]);
  useEffect(() => { apiRef.current.syncState?.(); }, [variant, startColor, progress]);

  return <div ref={wrapRef} className="ct-trail-scene3d" aria-hidden="true" />;
}
