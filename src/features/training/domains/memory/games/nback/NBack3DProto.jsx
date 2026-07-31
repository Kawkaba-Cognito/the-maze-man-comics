import React, { useEffect, useRef, useState } from 'react';
import { GAME_COLORS } from '../../../../shared/gamePalette';
import { bootC3dScene, disposeObject, matStd, THREE } from '../../../../shared/c3dBoot';
import C3dProtoChrome from '../../../../shared/C3dProtoChrome';
import { MEMO_OBJECTS } from '../memo-span/memoObjects';
import {
  createCardMaterial,
  createGridSlotTexture,
  createObjectCardTexture,
} from '../memoryStimulusTexture';
import '../../../../shared/c3dProto.css';

const OBJECT_BY_ID = Object.fromEntries(MEMO_OBJECTS.map((object) => [object.id, object]));

export default function NBack3DProto({
  isAr,
  playSfx,
  onBack,
  n = 1,
  trialIx = 0,
  trialCount = 0,
  cur = null,
  showStim = false,
  playStep = 'ready',
  resp = { pos: false, obj: false },
  feedback = { pos: null, obj: null },
  onRespond,
  subtitle = '',
}) {
  const wrapRef = useRef(null);
  const apiRef = useRef({});
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return undefined;

    const boot = bootC3dScene(wrap, { fov: 48, fitHalf: 4.1, bloom: false });
    if (boot.error) {
      setBootError(isAr ? 'تعذّر تشغيل ثلاثي الأبعاد' : 'Could not start 3D');
      return () => boot.dispose();
    }

    const {
      playRoot,
      coarse,
      renderer,
      setFitHalf,
      setTick,
      dispose,
    } = boot;
    const gap = coarse ? 1.62 : 1.72;
    const cellSize = 1.36;
    const slotTexture = createGridSlotTexture(renderer);
    const objectTextures = new Map();
    const cells = [];

    for (let index = 0; index < 9; index += 1) {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const cell = new THREE.Group();
      const frameMaterial = matStd(0x15283a, {
        emissive: 0x173b56,
        emissiveIntensity: 0.18,
        metalness: 0.28,
        roughness: 0.58,
      });
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(cellSize, cellSize, 0.16),
        frameMaterial,
      );
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(cellSize * 0.88, cellSize * 0.88),
        createCardMaterial(slotTexture),
      );
      face.position.z = 0.086;
      cell.add(frame, face);
      cell.userData.frameMaterial = frameMaterial;
      cell.position.set((column - 1) * gap, (1 - row) * gap, 0);
      playRoot.add(cell);
      cells.push(cell);
    }

    setFitHalf(gap + (coarse ? 1.0 : 1.55));

    let stimulus = null;
    const resetCells = () => {
      cells.forEach((cell) => {
        cell.userData.frameMaterial.emissive.setHex(0x173b56);
        cell.userData.frameMaterial.emissiveIntensity = 0.18;
      });
    };
    const hide = () => {
      if (stimulus) {
        playRoot.remove(stimulus);
        disposeObject(stimulus);
        stimulus = null;
      }
      resetCells();
    };
    const textureFor = (objectId) => {
      if (!objectTextures.has(objectId)) {
        objectTextures.set(
          objectId,
          createObjectCardTexture(OBJECT_BY_ID[objectId] || MEMO_OBJECTS[0], renderer),
        );
      }
      return objectTextures.get(objectId);
    };
    const show = (step) => {
      hide();
      if (!step) return;
      const cell = cells[step.pos] || cells[4];
      cell.userData.frameMaterial.emissive.setHex(0x4c92cf);
      cell.userData.frameMaterial.emissiveIntensity = 0.78;

      stimulus = new THREE.Group();
      const tileFrame = new THREE.Mesh(
        new THREE.BoxGeometry(cellSize + 0.1, cellSize + 0.1, 0.2),
        matStd(0x1d3d58, {
          emissive: 0x4c92cf,
          emissiveIntensity: 0.5,
          metalness: 0.22,
          roughness: 0.5,
        }),
      );
      const tileFace = new THREE.Mesh(
        new THREE.PlaneGeometry(cellSize * 0.94, cellSize * 0.94),
        createCardMaterial(textureFor(step.obj)),
      );
      tileFace.position.z = 0.106;
      stimulus.add(tileFrame, tileFace);
      stimulus.userData.birth = performance.now();
      stimulus.position.set(cell.position.x, cell.position.y, 0.34);
      playRoot.add(stimulus);
    };

    apiRef.current.sync = ({ nextCur, visible }) => {
      if (visible && nextCur) show(nextCur);
      else hide();
    };

    setTick((_dt, now) => {
      if (!stimulus) return;
      const appear = Math.min(1, Math.max(0, (now - stimulus.userData.birth) / 180));
      const eased = 1 - ((1 - appear) ** 3);
      stimulus.scale.setScalar(0.88 + eased * 0.12);
    });

    apiRef.current.sync({ nextCur: cur, visible: showStim });

    return () => {
      hide();
      cells.forEach((cell) => {
        disposeObject(cell);
        playRoot.remove(cell);
      });
      slotTexture.dispose();
      objectTextures.forEach((texture) => texture.dispose());
      objectTextures.clear();
      apiRef.current = {};
      dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAr]);

  useEffect(() => {
    apiRef.current.sync?.({ nextCur: cur, visible: showStim });
  }, [cur, showStim]);

  const readyText = isAr ? `${n}-عودة — استعد` : `${n}-back — get ready`;
  const prompt = isAr
    ? 'هل تكرّر قبل N؟ المكان أو الشيء'
    : 'Repeat from N back? Place or object';
  const positionLabel = isAr ? 'المكان' : 'PLACE';
  const objectLabel = isAr ? 'الشيء' : 'OBJECT';
  const trialLabel = `${Math.max(0, trialIx)}/${trialCount}`;

  return (
    <C3dProtoChrome
      isAr={isAr}
      title={isAr ? 'إن-باك' : 'N-Back'}
      question={playStep === 'ready' ? readyText : prompt}
      chip={<span className="ct-nback3d-badge">{isAr ? `${n}-عودة` : `${n}-back`}</span>}
      stats={[subtitle, trialLabel].filter(Boolean)}
      bootError={bootError}
      onBack={onBack}
      playSfx={playSfx}
      canvasRef={wrapRef}
    >
      <div className="c3d-overlay-actions">
        <button
          type="button"
          className="c3d-choice-btn"
          disabled={resp.pos || playStep !== 'run'}
          style={feedback.pos ? {
            borderColor: feedback.pos === 'good' ? GAME_COLORS.ok.fill : GAME_COLORS.bad.fill,
            color: feedback.pos === 'good' ? GAME_COLORS.ok.fill : GAME_COLORS.bad.fill,
          } : undefined}
          onPointerDown={() => onRespond?.('pos')}
        >
          ▦ {positionLabel}
        </button>
        <button
          type="button"
          className="c3d-choice-btn"
          disabled={resp.obj || playStep !== 'run'}
          style={feedback.obj ? {
            borderColor: feedback.obj === 'good' ? GAME_COLORS.ok.fill : GAME_COLORS.bad.fill,
            color: feedback.obj === 'good' ? GAME_COLORS.ok.fill : GAME_COLORS.bad.fill,
          } : undefined}
          onPointerDown={() => onRespond?.('obj')}
        >
          ◆ {objectLabel}
        </button>
      </div>
    </C3dProtoChrome>
  );
}
