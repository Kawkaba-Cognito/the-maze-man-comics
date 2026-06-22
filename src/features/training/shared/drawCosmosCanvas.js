/** Cosmos planet palette — matches 2D CosmosCharacter. */
export const COSMOS_GOLD = '#c8943e';
export const COSMOS_GOLD_LIGHT = '#ffd85a';
export const COSMOS_BODY = '#0a0a0f';
export const COSMOS_LANE_A = 'rgba(200,148,62,0.05)';
export const COSMOS_LANE_B = 'rgba(200,148,62,0.02)';
export const COSMOS_STING_BG = 'rgba(200,148,62,0.92)';

const INK = '#1a1a22';
const LIMB = '#15151c';
const LIMB_HI = '#22222c';
const CAP = '#24242e';

function drawLimb(ctx, x1, y1, x2, y2, w, { foot = false } = {}) {
  ctx.strokeStyle = LIMB;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.strokeStyle = LIMB_HI;
  ctx.lineWidth = w * 0.34;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  if (foot) {
    ctx.fillStyle = CAP;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, w * 0.14);
    ctx.beginPath();
    ctx.ellipse(x2, y2 + w * 0.12, w * 0.72, w * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillStyle = CAP;
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1, w * 0.14);
    ctx.beginPath();
    ctx.arc(x2, y2, w * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

function drawFrontEye(ctx, x, y, R, dir, { look = 'forward' } = {}) {
  const w = R * 0.19;
  const hTop = look === 'forward' ? R * 0.15 : R * 0.22;
  const hBot = look === 'forward' ? R * 0.11 : R * 0.08;
  const tilt = look === 'forward' ? -dir * 0.06 : -dir * 0.12;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  ctx.fillStyle = 'rgba(200,148,62,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, -R * 0.04, w * 1.45, hTop * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COSMOS_GOLD_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-w, 0);
  ctx.quadraticCurveTo(0, -hTop, w, 0);
  ctx.quadraticCurveTo(0, hBot, -w, 0);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-w * 0.28, -hTop * 0.38, Math.max(0.9, R * 0.038), 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.38, -hTop * 0.12, Math.max(0.55, R * 0.021), 0, Math.PI * 2);
  ctx.globalAlpha = 0.55;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/** Front-facing Cosmos planet with arms, hands, legs — matches CosmosCharacter stance. */
export function drawCosmosRunner(ctx, cx, cy, R, { mirror = false, anchor = 'feet', faceOnly = false, eyeLook = 'forward' } = {}) {
  const footDrop = faceOnly ? R * 0.92 : R * 1.48;
  ctx.save();
  ctx.translate(cx, anchor === 'feet' ? cy - footDrop : cy);
  if (mirror) ctx.scale(-1, 1);

  const ringTilt = -0.26;
  const ringRx = R * 1.73;
  const ringRy = R * 0.44;
  const ringW = Math.max(1.4, R * 0.096);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  ctx.beginPath();
  ctx.ellipse(0, R * 1.52, R * 0.84, R * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Ring — back half
  ctx.save();
  ctx.rotate(ringTilt);
  ctx.strokeStyle = COSMOS_GOLD;
  ctx.lineWidth = ringW;
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx, ringRy, 0, Math.PI, 0);
  ctx.stroke();
  ctx.restore();

  // Planet body
  const bodyGrad = ctx.createRadialGradient(-R * 0.16, -R * 0.28, R * 0.08, 0, 0, R);
  bodyGrad.addColorStop(0, '#15151a');
  bodyGrad.addColorStop(0.42, COSMOS_BODY);
  bodyGrad.addColorStop(0.78, '#050508');
  bodyGrad.addColorStop(1, '#000000');

  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = Math.max(1.2, R * 0.046);
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = COSMOS_GOLD;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = Math.max(1, R * 0.033);
  ctx.beginPath();
  ctx.arc(0, 0, R * 0.988, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = COSMOS_GOLD_LIGHT;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = Math.max(1, R * 0.05);
  ctx.beginPath();
  ctx.arc(0, 0, R, -2.35, -0.85);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Ring — front half
  ctx.save();
  ctx.rotate(ringTilt);
  ctx.strokeStyle = COSMOS_GOLD;
  ctx.lineWidth = ringW;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, ringRx, ringRy, 0, 0, Math.PI);
  ctx.stroke();
  ctx.restore();

  // Legs + feet
  if (!faceOnly) {
    const legW = Math.max(2, R * 0.23);
    const legX = R * 0.31;
    const legTop = R * 0.88;
    const legBot = R * 1.34;
    drawLimb(ctx, -legX, legTop, -legX, legBot, legW, { foot: true });
    drawLimb(ctx, legX, legTop, legX, legBot, legW, { foot: true });

    const armW = Math.max(1.8, R * 0.19);
    drawLimb(ctx, -R * 0.69, R * 0.35, -R * 1.1, R * 0.65, armW);
    drawLimb(ctx, R * 0.69, R * 0.35, R * 1.1, R * 0.65, armW);
  }

  const eyeY = faceOnly ? R * 0.02 : -R * 0.06;
  drawFrontEye(ctx, -R * 0.35, eyeY, R, -1, { look: eyeLook });
  drawFrontEye(ctx, R * 0.35, eyeY, R, 1, { look: eyeLook });

  if (!faceOnly) {
    ctx.strokeStyle = 'rgba(160,100,30,0.72)';
    ctx.lineWidth = Math.max(1, R * 0.042);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.17, R * 0.35);
    ctx.quadraticCurveTo(0, R * 0.41, R * 0.17, R * 0.35);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(160,100,30,0.72)';
    ctx.lineWidth = Math.max(1, R * 0.042);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-R * 0.17, R * 0.22);
    ctx.quadraticCurveTo(0, R * 0.28, R * 0.17, R * 0.22);
    ctx.stroke();
  }

  ctx.restore();
}
