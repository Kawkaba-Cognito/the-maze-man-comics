import React, { useEffect, useRef, useState } from 'react';
import { GAME_COLORS, GAME_FX, GAME_INTS, GAME_SKY } from '../../../../shared/gamePalette';
import { bootC3dScene, disposeObject, matStd, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import {
  createCardMaterial,
  createHiddenCardTexture,
  createIllustratedCardTexture,
} from '../memoryStimulusTexture';
import { assetUrl } from '../../../../../../lib/assetUrl';
import { pairObjectLabel } from './palData.js';
import '../../../../shared/c3dProto.css';
import './pairedAssociates3D.css';

/*
 * Card body colour — near-black, matching the black-planet Kawkab.
 *
 * Named rather than inlined for two reasons. It is used by three separate
 * materials (grid frame, its idle-reset emissive, and the cue card), and the
 * first pass at this missed one of them and left the most looked-at card on the
 * board the only blue one. And `audit:design` is a CI-blocking ratchet on raw
 * colour literals, so four loose hexes here would fail the build for whoever
 * pushed next.
 *
 * NOT from GAME_COLORS: item.fill (#2f5f86) is shared by 15 files, so blackening
 * the palette would have repainted every other game's pieces too. Not pure
 * black either — a slight cool lift keeps the bevel and the emissive feedback
 * states readable, the same reason --universe-glass is #151517 and not #000.
 */
const CARD_BLACK = 0x16161b;
const CARD_BLACK_GLOW = 0x0e0e12;

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function createMemoryTableTexture(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 780;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, GAME_SKY.top);
  gradient.addColorStop(1, GAME_SKY.mid);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  roundedRect(ctx, 24, 24, canvas.width - 48, canvas.height - 48, 70);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = GAME_FX.shadowDrop;
  ctx.stroke();

  ctx.save();
  ctx.setLineDash([14, 18]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = GAME_FX.hairline;
  ctx.beginPath();
  ctx.moveTo(500, 105);
  ctx.lineTo(500, canvas.height - 105);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = GAME_COLORS.accent.fill;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(252, canvas.height / 2, 132, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(252, canvas.height / 2, 162, 0, Math.PI * 2);
  ctx.stroke();

  [0, 1, 2, 3].forEach((index) => {
    const angle = -0.72 + index * 1.42;
    ctx.fillStyle = index === 1 ? GAME_COLORS.accent.fill : GAME_FX.shadowDrop;
    ctx.beginPath();
    ctx.arc(
      252 + Math.cos(angle) * 162,
      canvas.height / 2 + Math.sin(angle) * 162,
      index === 1 ? 9 : 6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer?.capabilities?.getMaxAnisotropy?.() || 4, 12);
  texture.needsUpdate = true;
  return texture;
}

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
  stats = [],
  interactive = true,
  onPick,
  /* The live-board coach mounts inside `.c3d-root` — see C3dProtoChrome. */
  rootRef,
  coachSlot,
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

    const desktopLayout = wrap.clientWidth >= 900 && wrap.clientHeight >= 600;
    const boot = bootC3dScene(wrap, {
      fov: desktopLayout ? 44 : 48,
      fitHalf: 4.1,
      bloom: false,
      stars: false,
    });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }

    const { camera, playRoot, renderer, setFitBox, setTick, dispose } = boot;
    const textureCache = new Map();
    let memoryTable = null;
    let memoryTableTexture = null;
    let cueDock = null;

    if (desktopLayout) {
      memoryTableTexture = createMemoryTableTexture(renderer);
      memoryTable = new THREE.Mesh(
        new THREE.PlaneGeometry(8.8, 4.3),
        new THREE.MeshBasicMaterial({
          map: memoryTableTexture,
          transparent: true,
          toneMapped: false,
        }),
      );
      memoryTable.position.set(0, -0.06, -0.48);
      playRoot.add(memoryTable);

      cueDock = new THREE.Mesh(
        new THREE.RingGeometry(0.83, 0.88, 48),
        new THREE.MeshBasicMaterial({
          color: GAME_INTS.accent.fill,
          transparent: true,
          opacity: 0.58,
          depthWrite: false,
        }),
      );
      cueDock.position.set(-3.02, -0.05, -0.18);
      playRoot.add(cueDock);
    }
    const textureFor = (symbol) => {
      const key = symbol || 'hidden';
      if (!textureCache.has(key)) {
        textureCache.set(
          key,
          symbol
            ? createIllustratedCardTexture({
              id: symbol,
              src: assetUrl(`Assets/training/pair-match-2026/${symbol}.webp`),
            }, renderer)
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
      /* Card body: near-black, matching the black-planet Kawkab.
       *
       * Was 0x183047 — a dark blue — which is a LOCAL hex here, not
       * GAME_COLORS.item. That matters: item.fill (#2f5f86) is shared by 15
       * files, so recolouring the palette to blacken these cards would have
       * repainted every other game's pieces too.
       *
       * Not pure #000: a slight cool lift keeps the bevel and the emissive
       * feedback states readable, exactly as the app's own dark tokens do
       * (--universe-glass #151517 rather than black). */
      const frameMaterial = matStd(CARD_BLACK, {
        emissive: CARD_BLACK_GLOW,
        emissiveIntensity: 0.22,
        metalness: 0.3,
        roughness: 0.5,
      });
      const card = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.BoxGeometry(cardSize, cardSize, 0.3), frameMaterial);
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
          color: GAME_INTS.accent.fill,
          transparent: true,
          opacity: 0.12,
          depthWrite: false,
        }),
      );
      ring.position.z = -0.18;
      station.add(ring);
      station.userData.index = index;
      station.userData.card = card;
      station.userData.faceMaterial = faceMaterial;
      station.userData.frameMaterial = frameMaterial;
      station.userData.ringMaterial = ring.material;
      station.userData.reveal = 0;
      station.userData.hover = 0;
      station.userData.targetHover = 0;
      playRoot.add(station);
      return station;
    });

    const cueCard = new THREE.Group();
    const cueFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.4, 0.22),
      /* The CUE card — the one showing what to match — is a card too, so it goes
         black with the rest. Missed on the first pass, which would have left the
         single most looked-at card the only blue one on the board. */
      matStd(CARD_BLACK, {
        emissive: CARD_BLACK_GLOW,
        emissiveIntensity: 0.3,
        metalness: 0.25,
        roughness: 0.48,
      }),
    );
    const cueMaterial = createCardMaterial(hiddenTexture);
    const cueFace = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 1.24), cueMaterial);
    cueFace.position.z = 0.116;
    cueCard.add(cueFrame, cueFace);
    cueCard.position.set(desktopLayout ? -3.02 : 0, desktopLayout ? -0.05 : 2.35, 0.38);
    cueCard.visible = false;
    playRoot.add(cueCard);

    setFitBox(desktopLayout ? 4.48 : 3.25, desktopLayout ? 2.2 : count > 8 ? 3.0 : 3.15);

    const placeStations = (nextBoxes) => {
      stations.forEach((station, index) => {
        const item = nextBoxes[index];
        if (!item) return;
        station.position.set(
          (item.fx - 0.5) * (desktopLayout ? 5.95 : 5.2) + (desktopLayout ? 0.95 : 0),
          (0.5 - item.fy) * (desktopLayout ? 3.2 : 3.35) - (desktopLayout ? 0.06 : 0.18),
          0,
        );
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
          frameMaterial.emissive.setHex(GAME_INTS.accent.fill);
          frameMaterial.emissiveIntensity = 0.7;
        } else {
          /* Back to the idle near-black. Must match the frame material's own
             emissive above — they were both 0x102b42, and changing only one
             would leave a card blue-tinted the moment it closed again. */
          frameMaterial.emissive.setHex(CARD_BLACK_GLOW);
          frameMaterial.emissiveIntensity = 0.22;
        }
      });

      cueCard.visible = Boolean(state.cue);
      cueMaterial.map = textureFor(state.cue);
      cueMaterial.needsUpdate = true;
      if (state.phase !== 'recall') {
        stations.forEach((station) => {
          station.userData.targetHover = 0;
        });
        renderer.domElement.style.cursor = 'default';
      }
    };
    apiRef.current.sync = sync;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const canvas = renderer.domElement;
    const stationAtPointer = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(stations, true)[0];
      if (!hit) return null;
      let node = hit.object;
      while (node && node.userData.index === undefined) node = node.parent;
      return node?.userData.index !== undefined ? node : null;
    };
    const onPointerMove = (event) => {
      const station = phaseRef.current === 'recall' ? stationAtPointer(event) : null;
      stations.forEach((item) => {
        item.userData.targetHover = item === station ? 1 : 0;
      });
      canvas.style.cursor = station ? 'pointer' : 'default';
    };
    const onPointerLeave = () => {
      stations.forEach((station) => {
        station.userData.targetHover = 0;
      });
      canvas.style.cursor = 'default';
    };
    const onPointerUp = (event) => {
      if (phaseRef.current !== 'recall') return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      const station = stationAtPointer(event);
      if (station) onPickRef.current?.(station.userData.index);
    };
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('pointerup', onPointerUp);

    setTick((dt, now) => {
      cueCard.position.y = (desktopLayout ? -0.05 : 2.35) + Math.sin(now * 0.0022) * 0.035;
      stations.forEach((station) => {
        const target = station.userData.targetReveal || 0;
        station.userData.reveal += (target - station.userData.reveal) * Math.min(1, dt * 12);
        station.userData.hover +=
          (station.userData.targetHover - station.userData.hover) * Math.min(1, dt * 14);
        const reveal = station.userData.reveal;
        const hover = station.userData.hover;
        station.userData.card.position.z = reveal * 0.38;
        station.userData.card.scale.setScalar(1 + reveal * 0.055 + hover * 0.045);
        station.userData.ringMaterial.opacity = 0.12 + reveal * 0.12 + hover * 0.2;
      });
    });

    apiRef.current.sync?.({ boxes, openIndex, feedback, cue, phase });

    return () => {
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerup', onPointerUp);
      stations.forEach((station) => {
        disposeObject(station);
        playRoot.remove(station);
      });
      disposeObject(cueCard);
      playRoot.remove(cueCard);
      if (cueDock) {
        disposeObject(cueDock);
        playRoot.remove(cueDock);
      }
      if (memoryTable) {
        disposeObject(memoryTable);
        playRoot.remove(memoryTable);
      }
      memoryTableTexture?.dispose();
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
  const phaseHint = isAr
    ? phase === 'study'
      ? 'راقب كل رمز ومكانه'
      : phase === 'recall'
        ? 'اختر الموقع الصحيح'
        : 'قارن إجابتك'
    : phase === 'study'
      ? 'Observe each symbol and its location'
      : phase === 'recall'
        ? 'Choose the location that held the symbol'
        : 'Compare your choice with the correct location';

  return (
    <C3dProtoChrome
      isAr={isAr}
      rootClassName={`ct-pal3d-root ct-pal3d-root--${phase}`}
      title={isAr ? 'مطابقة الأزواج' : 'Pair Match'}
      question={question ? <span className="ct-pal3d-question">{question}</span> : ''}
      chip={phaseLabel}
      chipStyle={{ fontSize: '0.76rem', fontWeight: 900, color: 'var(--game-accent)' }}
      stats={stats.length ? stats : hud ? [hud] : []}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
      rootRef={rootRef}
      coachSlot={coachSlot}
    >
      <div className="ct-pal3d-phase-card" aria-hidden="true" data-coach="phase">
        <span>{isAr ? 'مرصد الذاكرة' : 'Memory observatory'}</span>
        <strong>{phaseLabel}</strong>
        <small>{phaseHint}</small>
      </div>
      <p className="ct-visually-hidden" aria-live="polite" aria-atomic="true">
        {phase === 'study' && openIndex >= 0
          ? isAr
            ? `الصندوق ${openIndex + 1} يحتوي على ${pairObjectLabel(boxes[openIndex]?.symbol, 'ar')}`
            : `Box ${openIndex + 1} contains ${pairObjectLabel(boxes[openIndex]?.symbol, 'en')}`
          : question}
      </p>
      {phase === 'recall' && interactive ? (
        <div className="ct-pal-access-wrap" data-coach="boxes">
          <span className="ct-pal-access-label">{isAr ? 'اختر الصندوق' : 'Choose a box'}</span>
          <div
            className="ct-pal-access-grid"
            role="group"
            aria-label={isAr
              ? `اختر صندوق ${pairObjectLabel(cue, 'ar')}`
              : `Choose the box for ${pairObjectLabel(cue, 'en')}`}
            style={{
              '--pal-box-count': boxes.length,
              gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(boxes.length))}, minmax(44px, 1fr))`,
            }}
          >
            {boxes.map((_, index) => (
              <button
                key={index}
                type="button"
                className="ct-pal-access-btn"
                aria-label={isAr ? `الصندوق ${index + 1}` : `Box ${index + 1}`}
                onClick={() => onPick?.(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </C3dProtoChrome>
  );
}
