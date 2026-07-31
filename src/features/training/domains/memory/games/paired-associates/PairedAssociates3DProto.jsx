import React, { useEffect, useRef, useState } from 'react';
import { GAME_INTS } from '../../../../shared/gamePalette';
import { bootC3dScene, disposeObject, matStd, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import {
  createCardMaterial,
  createHiddenCardTexture,
  createSymbolCardTexture,
} from '../memoryStimulusTexture';
import '../../../../shared/c3dProto.css';

const PHASE_LABEL = {
  en: { study: 'Study', recall: 'Recall', feedback: 'Check' },
  ar: { study: 'حفظ', recall: 'استرجاع', feedback: 'تحقق' },
};

export default function PairedAssociates3DProto({
  isAr,
  playSfx,
  onBack,
  boxes = [],
  openIndex = -1,
  feedback = null,
  cue = '',
  phase = 'study',
  question = '',
  hud = '',
  interactive = true,
  onPick,
}) {
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const onPickRef = useRef(onPick);
  const phaseRef = useRef(phase);
  const [bootError, setBootError] = useState(null);
  onPickRef.current = onPick;
  phaseRef.current = interactive ? phase : 'feedback';

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || boxes.length === 0) return undefined;

    const boot = bootC3dScene(wrap, { fov: 48, fitHalf: 4.1, bloom: false });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }

    const {
      camera,
      playRoot,
      renderer,
      setFitBox,
      setTick,
      dispose,
    } = boot;
    const textureCache = new Map();
    const textureFor = (symbol) => {
      const key = symbol || 'hidden';
      if (!textureCache.has(key)) {
        textureCache.set(
          key,
          symbol
            ? createSymbolCardTexture(symbol, renderer)
            : createHiddenCardTexture(renderer),
        );
      }
      return textureCache.get(key);
    };

    const hiddenTexture = textureFor('');
    const count = boxes.length;
    const cardSize = count <= 6 ? 1.28 : count <= 8 ? 1.06 : 0.86;
    const stations = boxes.map((_, index) => {
      const station = new THREE.Group();
      const frameMaterial = matStd(0x183047, {
        emissive: 0x102b42,
        emissiveIntensity: 0.22,
        metalness: 0.3,
        roughness: 0.5,
      });
      const card = new THREE.Group();
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(cardSize, cardSize, 0.3),
        frameMaterial,
      );
      const faceMaterial = createCardMaterial(hiddenTexture);
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(cardSize * 0.88, cardSize * 0.88),
        faceMaterial,
      );
      face.position.z = 0.156;
      card.add(frame, face);
      station.add(card);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(cardSize * 0.57, cardSize * 0.68, 32),
        new THREE.MeshBasicMaterial({
          color: GAME_INTS.item.fill,
          transparent: true,
          opacity: 0.14,
          depthWrite: false,
        }),
      );
      ring.position.z = -0.18;
      station.add(ring);
      station.userData.index = index;
      station.userData.card = card;
      station.userData.faceMaterial = faceMaterial;
      station.userData.frameMaterial = frameMaterial;
      station.userData.reveal = 0;
      playRoot.add(station);
      return station;
    });

    const cueCard = new THREE.Group();
    const cueFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 0.22),
      matStd(0x183047, {
        emissive: 0x214f73,
        emissiveIntensity: 0.3,
        metalness: 0.25,
        roughness: 0.48,
      }),
    );
    const cueMaterial = createCardMaterial(hiddenTexture);
    const cueFace = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 1.24), cueMaterial);
    cueFace.position.z = 0.116;
    cueCard.add(cueFrame, cueFace);
    cueCard.position.set(0, 2.35, 0.38);
    cueCard.visible = false;
    playRoot.add(cueCard);

    setFitBox(3.25, count > 8 ? 3.0 : 3.15);

    const placeStations = (nextBoxes) => {
      stations.forEach((station, index) => {
        const item = nextBoxes[index];
        if (!item) return;
        station.position.set((item.fx - 0.5) * 5.2, (0.5 - item.fy) * 3.35 - 0.18, 0);
      });
    };

    const sync = (state) => {
      placeStations(state.boxes);
      stations.forEach((station, index) => {
        const item = state.boxes[index];
        const isOpen = state.phase === 'study' && state.openIndex === index;
        const isCorrect = state.feedback?.correctIdx === index;
        const isWrong = state.feedback?.wrongIdx === index;
        const shownSymbol = isOpen ? item?.symbol : isCorrect ? state.feedback?.symbol : '';

        station.userData.faceMaterial.map = textureFor(shownSymbol);
        station.userData.faceMaterial.needsUpdate = true;
        station.userData.targetReveal = isOpen || isCorrect || isWrong ? 1 : 0;

        const frameMaterial = station.userData.frameMaterial;
        if (isWrong) {
          frameMaterial.emissive.setHex(GAME_INTS.bad.fill);
          frameMaterial.emissiveIntensity = 0.8;
        } else if (isCorrect) {
          frameMaterial.emissive.setHex(GAME_INTS.ok.fill);
          frameMaterial.emissiveIntensity = 0.82;
        } else if (isOpen) {
          frameMaterial.emissive.setHex(GAME_INTS.item.fill);
          frameMaterial.emissiveIntensity = 0.7;
        } else {
          frameMaterial.emissive.setHex(0x102b42);
          frameMaterial.emissiveIntensity = 0.22;
        }
      });

      cueCard.visible = Boolean(state.cue);
      cueMaterial.map = textureFor(state.cue);
      cueMaterial.needsUpdate = true;
    };
    apiRef.current.sync = sync;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const canvas = renderer.domElement;
    const onPointerUp = (event) => {
      if (phaseRef.current !== 'recall') return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(stations, true)[0];
      if (!hit) return;
      let node = hit.object;
      while (node && node.userData.index === undefined) node = node.parent;
      if (node?.userData.index !== undefined) onPickRef.current?.(node.userData.index);
    };
    canvas.addEventListener('pointerup', onPointerUp);

    setTick((dt, now) => {
      cueCard.position.y = 2.35 + Math.sin(now * 0.0022) * 0.035;
      stations.forEach((station) => {
        const target = station.userData.targetReveal || 0;
        station.userData.reveal += (target - station.userData.reveal) * Math.min(1, dt * 12);
        const reveal = station.userData.reveal;
        station.userData.card.position.z = reveal * 0.38;
        station.userData.card.scale.setScalar(1 + reveal * 0.055);
      });
    });

    apiRef.current.sync?.({ boxes, openIndex, feedback, cue, phase });

    return () => {
      canvas.removeEventListener('pointerup', onPointerUp);
      stations.forEach((station) => {
        disposeObject(station);
        playRoot.remove(station);
      });
      disposeObject(cueCard);
      playRoot.remove(cueCard);
      textureCache.forEach((texture) => texture.dispose());
      textureCache.clear();
      apiRef.current = {};
      dispose();
    };
    // The scene only needs rebuilding when the board size changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxes.length, isAr]);

  useEffect(() => {
    apiRef.current.sync?.({ boxes, openIndex, feedback, cue, phase });
  }, [boxes, cue, feedback, openIndex, phase]);

  const labels = PHASE_LABEL[isAr ? 'ar' : 'en'];
  const phaseLabel = labels[phase] || labels.study;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={isAr ? 'مطابقة الأزواج' : 'Pair Match'}
      question={question ? <span className="ct-pal3d-question">{question}</span> : ''}
      chip={phaseLabel}
      chipStyle={{ fontSize: '0.76rem', fontWeight: 900, color: 'var(--accent-bright)' }}
      stats={hud ? [hud] : []}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
    />
  );
}
