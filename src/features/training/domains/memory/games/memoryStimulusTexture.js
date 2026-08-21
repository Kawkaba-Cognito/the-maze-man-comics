import { THREE } from '../../../shared/c3dBoot';
import {
  GAME_COLORS,
  GAME_FX,
  GAME_INK,
  GAME_STIMULUS_6,
} from '../../../shared/gamePalette';

const CARD_SIZE = 768;
/* Canvas textures cannot read CSS variables, so keep their non-semantic card
 * surfaces here and take all state/accent colours from the shared play palette.
 * The previous cool-white/dark-blue cards were the last visible remnant of the
 * retired blue activity theme. */
const CARD_FACE = '#fffaf0';
const CARD_HIDDEN = '#16161b';
const CARD_HIDDEN_RAISED = '#24242a';
const CARD_HIDDEN_EDGE = '#0e0e12';
const SYMBOL_COLORS = {
  '★': GAME_STIMULUS_6[1],
  '▲': GAME_STIMULUS_6[3],
  '●': GAME_STIMULUS_6[0],
  '■': GAME_STIMULUS_6[2],
  '◆': GAME_STIMULUS_6[4],
  '✚': GAME_STIMULUS_6[3],
  '✦': GAME_STIMULUS_6[5],
  '❤': GAME_STIMULUS_6[4],
  '☀': GAME_STIMULUS_6[1],
  '☾': GAME_STIMULUS_6[0],
  '♣': GAME_STIMULUS_6[2],
  '♠': GAME_COLORS.muted.fill,
};

const OBJECT_COLORS = GAME_STIMULUS_6;

function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hashText(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  return canvas;
}

function paintCard(ctx, accent, dark = false) {
  ctx.clearRect(0, 0, CARD_SIZE, CARD_SIZE);
  ctx.fillStyle = dark ? CARD_HIDDEN : CARD_FACE;
  roundedRect(ctx, 22, 22, CARD_SIZE - 44, CARD_SIZE - 44, 92);
  ctx.fill();

  ctx.lineWidth = 24;
  ctx.strokeStyle = accent;
  roundedRect(ctx, 34, 34, CARD_SIZE - 68, CARD_SIZE - 68, 78);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.strokeStyle = dark ? GAME_FX.glint : GAME_FX.hairline;
  roundedRect(ctx, 68, 68, CARD_SIZE - 136, CARD_SIZE - 136, 58);
  ctx.stroke();
}

function makeTexture(canvas, renderer) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer?.capabilities?.getMaxAnisotropy?.() || 4, 16);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createHiddenCardTexture(renderer) {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  paintCard(ctx, GAME_COLORS.accent.fill, true);

  ctx.fillStyle = CARD_FACE;
  ctx.font = '700 330px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', CARD_SIZE / 2, CARD_SIZE / 2 + 18);
  return makeTexture(canvas, renderer);
}

export function createSymbolCardTexture(symbol, renderer) {
  const accent = SYMBOL_COLORS[symbol] || GAME_COLORS.item.fill;
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  paintCard(ctx, accent);

  ctx.fillStyle = accent;
  ctx.font = '700 380px "Segoe UI Symbol", "Arial Unicode MS", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, CARD_SIZE / 2, CARD_SIZE / 2 + 16);
  return makeTexture(canvas, renderer);
}

export function createIllustratedCardTexture({ id, src }, renderer) {
  const accent = OBJECT_COLORS[hashText(id) % OBJECT_COLORS.length];
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  paintCard(ctx, accent);
  const texture = makeTexture(canvas, renderer);
  const image = new Image();
  image.decoding = 'async';
  image.onload = () => {
    paintCard(ctx, accent);
    const maxSize = CARD_SIZE * 0.72;
    const scale = Math.min(maxSize / image.naturalWidth, maxSize / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    ctx.drawImage(image, (CARD_SIZE - width) / 2, (CARD_SIZE - height) / 2, width, height);
    texture.needsUpdate = true;
  };
  image.onerror = () => {
    ctx.fillStyle = accent;
    ctx.font = '700 300px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', CARD_SIZE / 2, CARD_SIZE / 2 + 16);
    texture.needsUpdate = true;
  };
  image.src = src;
  return texture;
}

export function createObjectCardTexture({ id, emoji }, renderer) {
  const accent = OBJECT_COLORS[hashText(id) % OBJECT_COLORS.length];
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  paintCard(ctx, accent);

  ctx.fillStyle = GAME_INK;
  ctx.font = '430px "Segoe UI Emoji", "Noto Color Emoji", "Apple Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji || '?', CARD_SIZE / 2, CARD_SIZE / 2 + 24);
  return makeTexture(canvas, renderer);
}

export function createGridSlotTexture(renderer) {
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_SIZE);
  gradient.addColorStop(0, CARD_HIDDEN_RAISED);
  gradient.addColorStop(1, CARD_HIDDEN_EDGE);
  ctx.fillStyle = gradient;
  roundedRect(ctx, 24, 24, CARD_SIZE - 48, CARD_SIZE - 48, 88);
  ctx.fill();

  ctx.lineWidth = 18;
  ctx.strokeStyle = GAME_COLORS.item.edge;
  roundedRect(ctx, 42, 42, CARD_SIZE - 84, CARD_SIZE - 84, 72);
  ctx.stroke();

  ctx.fillStyle = GAME_COLORS.accent.fill;
  ctx.beginPath();
  ctx.arc(CARD_SIZE / 2, CARD_SIZE / 2, 18, 0, Math.PI * 2);
  ctx.fill();
  return makeTexture(canvas, renderer);
}

export function createCardMaterial(texture) {
  return new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
  });
}
