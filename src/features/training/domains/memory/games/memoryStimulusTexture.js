import { THREE } from '../../../shared/c3dBoot';

const CARD_SIZE = 768;
const SYMBOL_COLORS = {
  '★': '#f2b84b',
  '▲': '#e85d68',
  '●': '#3f8fdd',
  '■': '#39a875',
  '◆': '#8c6be8',
  '✚': '#ed7d3f',
  '✦': '#19a7a0',
  '❤': '#dc4c74',
  '☀': '#e6a626',
  '☾': '#6579d6',
  '♣': '#25906d',
  '♠': '#43506b',
};

const OBJECT_COLORS = [
  '#327bc4',
  '#d86455',
  '#268d76',
  '#7a66c2',
  '#d38d2d',
  '#cf4e79',
  '#2d93a5',
  '#5f75ce',
];

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
  ctx.fillStyle = dark ? '#131a24' : '#f8fbff';
  roundedRect(ctx, 22, 22, CARD_SIZE - 44, CARD_SIZE - 44, 92);
  ctx.fill();

  ctx.lineWidth = 24;
  ctx.strokeStyle = accent;
  roundedRect(ctx, 34, 34, CARD_SIZE - 68, CARD_SIZE - 68, 78);
  ctx.stroke();

  ctx.lineWidth = 5;
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(18,36,58,0.13)';
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
  paintCard(ctx, '#4c92cf', true);

  ctx.fillStyle = '#f6fbff';
  ctx.font = '700 330px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', CARD_SIZE / 2, CARD_SIZE / 2 + 18);
  return makeTexture(canvas, renderer);
}

export function createSymbolCardTexture(symbol, renderer) {
  const accent = SYMBOL_COLORS[symbol] || '#327bc4';
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

export function createObjectCardTexture({ id, emoji }, renderer) {
  const accent = OBJECT_COLORS[hashText(id) % OBJECT_COLORS.length];
  const canvas = makeCanvas();
  const ctx = canvas.getContext('2d');
  paintCard(ctx, accent);

  ctx.fillStyle = '#182334';
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
  gradient.addColorStop(0, '#19283a');
  gradient.addColorStop(1, '#0d1520');
  ctx.fillStyle = gradient;
  roundedRect(ctx, 24, 24, CARD_SIZE - 48, CARD_SIZE - 48, 88);
  ctx.fill();

  ctx.lineWidth = 18;
  ctx.strokeStyle = '#315776';
  roundedRect(ctx, 42, 42, CARD_SIZE - 84, CARD_SIZE - 84, 72);
  ctx.stroke();

  ctx.fillStyle = '#4c92cf';
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
