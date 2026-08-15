import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../../../../../context/AppContext';
import ModeShell from '../../../../shared/ModeShell';
import { STR_COMMON } from '../../../../shared/trainingStrings';
import { makeRng } from '../../../../shared/rng';
import { createTrialLog } from '../../../../shared/trialLog';
import {
  TrainingPlayHeader, TrainingPauseModal, TrainingQuitModal,
} from '../../../../shared/TrainingChrome';
import { createProfileStore } from '../../../../../../lib/storage';
import {
  GATE_S, LAUNCH_BEATS, TRIALS_PER_LEVEL, WAVES_PER_SECTOR,
  buildTrial, levelCfg, levelPassed, pathPoint, positionAt, scoreLaunch, scoreTap, survivalCfg,
} from './data';
import { assetUrl } from '../../../../../../lib/assetUrl';
import './intercept.css';

/*
 * Intercept — the speed domain's timing game. Replaces Trail Making.
 *
 * A shape crosses the screen, vanishes behind cover, and you tap the instant it
 * would reach the gate. See data.js for the four levers that give this a
 * curriculum rather than one trick repeated a hundred times.
 *
 * ⚠ TIMING IS TAKEN FROM THE EVENT, NOT FROM THE FRAME. The tap is stamped from
 * the pointer event's own timestamp where the browser provides one, because a
 * value read inside a rAF callback is quantised to the frame and would put a
 * floor of ~8-16ms of pure noise under a window that goes down to 62ms.
 *
 * ⚠ WHAT WAS ACTUALLY WRONG WITH v1, AND WHY THIS FILE IS SHAPED THIS WAY.
 *
 * v1 called finish() the moment the last mover was claimed. On every one-mover
 * trial — all of Easy, all of Medium, most of Hard — that meant YOUR TAP KILLED
 * THE RUN. The shape never emerged, never crossed, and the canvas was swapped
 * for a modal reporting "48ms early" as text, with a button to continue.
 *
 * The payoff moment of a timing game is watching the thing arrive and seeing
 * where you were. v1 deleted it, six times per level, and replaced it with
 * reading and a button press. That, not the difficulty curve, is what made one
 * session feel like enough.
 *
 * So the rules here are: the tap NEVER ends the run, the mover is ALWAYS
 * revealed as it crosses (claimed or not — a miss you cannot see teaches
 * nothing), the error is drawn ON THE RAIL where it happened rather than
 * described in a sentence, and the set advances itself. There is no
 * between-trials modal and no between-trials button.
 */

const UI = {
  en: {
    ...STR_COMMON.en,
    title: 'Intercept',
    tag: 'predictive timing',
    /* Intercept is the one game whose Survival is a DIFFERENT GAME: Rift
       Defense adds sectors, a shield and between-sector upgrades, while Levels
       and Pass n Play stay the plain timing task. That is deliberate, but a
       player picking a mode could not tell — every other game's three modes are
       the same activity at different lengths. So each hint now names the ACTION
       first, and Survival says outright that it is a different shape. */
    hintFree: 'Rift Defense — a different mode: sectors, shield, upgrades',
    hintLevels: 'Tap the moment it reaches the gate · 3 difficulties · 100 levels each',
    hintPass: 'Tap the moment it reaches the gate · same runs for everyone',
    ready: 'Tap the moment it reaches the gate',
    readyGates: 'Tap at the gate matching its colour',
    readyLaunch: 'Tap to release — it must arrive on the silent beat',
    watch: 'Watch the run',
    early: 'early',
    late: 'late',
    hit: 'Caught it',
    perfect: 'Perfect',
    miss: 'Missed',
    tooSlow: 'No tap',
    noRelease: 'Never released',
    trialOf: (i, n) => `Run ${i} of ${n}`,
    caught: (c, t) => `${c} of ${t} caught`,
    avgErr: 'Average miss',
    bestErr: 'Closest',
    biasEarly: 'you tap early',
    biasLate: 'you tap late',
    biasNone: 'no consistent bias',
    leanEarly: (n) => `leaning ${n}ms early`,
    leanLate: (n) => `leaning ${n}ms late`,
    leanEven: 'well centred',
    streak: (n) => `${n} in a row`,
    // Not "you failed" — 12.2. It says what was missing, in the game's terms.
    needHits: `you need 4 of ${TRIALS_PER_LEVEL}`,
    runOver: 'Run ended',
    bestStage: (n) => `You reached round ${n}`,
    meaning: 'The number is how far off your prediction was, in milliseconds.',
    go: 'GO',
    personalBest: (n) => `Best ever: round ${n}`,
    perfects: (n) => `${n} perfect`,
    defenseTitle: 'Rift Defense',
    sector: (n) => `Sector ${n}`,
    wave: (n) => `Wave ${n}/${WAVES_PER_SECTOR}`,
    shieldLabel: 'Shield',
    scoreLabel: 'Score',
    surge: 'Rift surge',
    threatScout: 'Scout threat',
    threatSplit: 'Split-gate threat',
    threatWarp: 'Warp threat',
    threatSwarm: 'Swarm threat',
    threatSync: 'Sync launch',
    sectorSecured: 'Sector secured',
    chooseUpgrade: 'Choose one system before the next rift opens.',
    scanName: 'Scanner array',
    scanDesc: 'Watch every threat 80ms longer.',
    pulseName: 'Wide intercept pulse',
    pulseDesc: 'Add 12ms to the timing window.',
    shieldName: 'Shield cell',
    shieldDesc: 'Restore one shield point.',
    maxed: 'Fully charged',
    stationLost: 'Station breached',
    debrief: 'Defense debrief',
    reached: (sector, wave) => `Reached sector ${sector}, wave ${wave}`,
    totalScore: (n) => `Defense score ${n}`,
    coachEarly: 'Next run: hold your tap a little longer.',
    coachLate: 'Next run: commit a little earlier.',
    coachEven: 'Your timing is centred. Keep the rhythm.',
    coachNoTap: 'Next run: tap once as the threat reaches the rift.',
  },
  ar: {
    ...STR_COMMON.ar,
    title: 'الاعتراض',
    tag: 'توقيت تنبّؤي',
    hintFree: 'دفاع الشق — نمط مختلف: قطاعات ودرع وترقيات',
    hintLevels: 'اضغط لحظة الوصول إلى البوابة · ٣ صعوبات · ١٠٠ مستوى لكل',
    hintPass: 'اضغط لحظة الوصول إلى البوابة · نفس الجولات للجميع',
    ready: 'اضغط لحظة وصوله إلى البوابة',
    readyGates: 'اضغط عند البوابة المطابقة للونه',
    readyLaunch: 'اضغط للإطلاق — عليه أن يصل مع النبضة الصامتة',
    watch: 'راقب المسار',
    early: 'مبكّر',
    late: 'متأخّر',
    hit: 'أمسكته',
    perfect: 'مثالي',
    miss: 'أخطأت',
    tooSlow: 'لم تضغط',
    noRelease: 'لم تُطلقه',
    trialOf: (i, n) => `جولة ${i} من ${n}`,
    caught: (c, t) => `أمسكت ${c} من ${t}`,
    avgErr: 'متوسط الخطأ',
    bestErr: 'الأقرب',
    biasEarly: 'تضغط مبكّراً',
    biasLate: 'تضغط متأخّراً',
    biasNone: 'لا ميل ثابت',
    leanEarly: (n) => `تميل ${n} م.ث مبكّراً`,
    leanLate: (n) => `تميل ${n} م.ث متأخّراً`,
    leanEven: 'متّزن',
    streak: (n) => `${n} متتالية`,
    needHits: `تحتاج ٤ من ${TRIALS_PER_LEVEL}`,
    runOver: 'انتهت المحاولة',
    bestStage: (n) => `وصلت إلى الجولة ${n}`,
    meaning: 'الرقم هو مقدار انحراف توقّعك بالمللي ثانية.',
    go: 'انطلق',
    personalBest: (n) => `أفضل نتيجة: الجولة ${n}`,
    perfects: (n) => `${n} مثالية`,
    defenseTitle: 'دفاع الشق',
    sector: (n) => `القطاع ${n}`,
    wave: (n) => `الموجة ${n}/${WAVES_PER_SECTOR}`,
    shieldLabel: 'الدرع',
    scoreLabel: 'النتيجة',
    surge: 'موجة الشق',
    threatScout: 'تهديد استطلاعي',
    threatSplit: 'تهديد البوابتين',
    threatWarp: 'تهديد منعطف',
    threatSwarm: 'تهديد سربي',
    threatSync: 'إطلاق متزامن',
    sectorSecured: 'تم تأمين القطاع',
    chooseUpgrade: 'اختر نظاماً واحداً قبل انفتاح الشق التالي.',
    scanName: 'مصفوفة المسح',
    scanDesc: 'راقب كل تهديد لمدة ٨٠ مللي ثانية إضافية.',
    pulseName: 'نبضة اعتراض واسعة',
    pulseDesc: 'أضف ١٢ مللي ثانية لنافذة التوقيت.',
    shieldName: 'خلية درع',
    shieldDesc: 'استعد نقطة درع واحدة.',
    maxed: 'مشحون بالكامل',
    stationLost: 'تم اختراق المحطة',
    debrief: 'تقرير الدفاع',
    reached: (sector, wave) => `وصلت إلى القطاع ${sector}، الموجة ${wave}`,
    totalScore: (n) => `نتيجة الدفاع ${n}`,
    coachEarly: 'في الجولة التالية: انتظر قليلاً قبل الضغط.',
    coachLate: 'في الجولة التالية: اضغط أبكر قليلاً.',
    coachEven: 'توقيتك متّزن. حافظ على الإيقاع.',
    coachNoTap: 'في الجولة التالية: اضغط مرة واحدة عندما يصل التهديد إلى البوابة.',
  },
};

const MAX_SHIELD = 4;
const MAX_SYSTEM_LEVEL = 4;
const ART_URLS = {
  steady: assetUrl('Assets/training/cancel-cosmic-atlas-2026/comet.webp'),
  accel: assetUrl('Assets/training/cancel-cosmic-atlas-2026/space-fighter.webp'),
  decel: assetUrl('Assets/training/cancel-cosmic-atlas-2026/quantum-shard.webp'),
  gate: assetUrl('Assets/training/cancel-cosmic-atlas-2026/warp-gate.webp'),
  station: assetUrl('Assets/training/cancel-cosmic-atlas-2026/station.webp'),
  scan: assetUrl('Assets/training/cancel-cosmic-atlas-2026/satellite.webp'),
  pulse: assetUrl('Assets/training/cancel-cosmic-atlas-2026/probe-right.webp'),
  shield: assetUrl('Assets/training/cancel-cosmic-atlas-2026/solar-array.webp'),
  burst: assetUrl('Assets/training/cancel-cosmic-atlas-2026/supernova.webp'),
};

/* The art belongs to the existing Training cosmic atlas and is loaded once for
   the whole module. Canvas keeps drawing the old geometric fallback until an
   image is ready, so asset decoding can never stall the timing loop. */
const ART_IMAGES = {};
function getInterceptArt() {
  if (typeof Image === 'undefined') return ART_IMAGES;
  for (const [key, src] of Object.entries(ART_URLS)) {
    if (ART_IMAGES[key]) continue;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    ART_IMAGES[key] = img;
  }
  return ART_IMAGES;
}

/*
 * ⚠ CANVAS COLOUR COMES FROM CSS, READ AT RUN TIME.
 *
 * A canvas cannot use `var(--game-accent)`, and the tempting shortcut — paste
 * the hex into the draw call, or import it from styles/tokens.js — produces a
 * game that is stuck in one theme forever. That is not hypothetical: a frozen
 * JS colour in a loading state is what made every game launch flash near-white
 * in dark mode.
 *
 * So the values are read off the live element with getComputedStyle, which
 * means they follow the theme like everything else. They are read once per
 * trial rather than per frame: a theme switch mid-round therefore lands on the
 * next run a few seconds later, which is the right trade against doing style
 * resolution 60 times a second.
 */
function readPalette(node) {
  const cs = getComputedStyle(node);
  const pick = (name, fallback) => (cs.getPropertyValue(name) || '').trim() || fallback;
  return {
    rail: pick('--game-muted-edge', '#3c4249'),
    cover: pick('--game-muted', '#545c66'),
    /* The two gates are told apart by colour, and the mover is filled in the
       colour of the gate it belongs to — so the decision is answerable from the
       visible stretch, which is the only place it can honestly be made. */
    gateFar: pick('--game-accent', '#d4952f'),
    gateNear: pick('--game-ok', '#386544'),
    ok: pick('--game-ok', '#386544'),
    bad: pick('--game-bad', '#854c49'),
    ink: pick('--game-ink', '#131e28'),
    spent: pick('--game-muted-edge', '#3c4249'),
  };
}

/* Survival's personal best. ModeShell owns the LEVEL progress under
   mm_spd_intercept; this is the one number it has no slot for, so it lives
   beside it under the same prefix and goes through lib/storage like everything
   else. */
const PROFILE = createProfileStore('mm_spd_intercept_profile_v1', { bestStage: 0 });

const SHAPE_PATH = {
  steady: (c, s) => { c.beginPath(); c.arc(0, 0, s, 0, Math.PI * 2); },
  accel: (c, s) => {
    c.beginPath();
    c.moveTo(s * 1.15, 0);
    c.lineTo(-s * 0.8, s * 0.9);
    c.lineTo(-s * 0.35, 0);
    c.lineTo(-s * 0.8, -s * 0.9);
    c.closePath();
  },
  decel: (c, s) => {
    c.beginPath();
    c.moveTo(0, -s * 1.1);
    c.lineTo(s * 1.1, 0);
    c.lineTo(0, s * 1.1);
    c.lineTo(-s * 1.1, 0);
    c.closePath();
  },
};

/** How long the scene stays up after the last mover finishes, so it is watched. */
const REVEAL_HOLD = 520;
/** How long the verdict sits on screen before the next run starts itself. */
const FLASH_MS = 900;
/** Quiet beat between the launch preview and the count-in. */
const PREVIEW_GAP = 420;

/*
 * Paint the whole scene at time `ms`.
 *
 * Module-level, and taking the clock as an argument, because it is drawn from
 * several places: the running trial, the launch preview, and the countdown,
 * which paints the same scene frozen at ms=0. That matters — the countdown used
 * to leave the stage empty, so the route, the cover and the gates all appeared
 * for the first time on the same frame the shape started moving, and the first
 * run of every level was spent finding out where the line was. Now GO lands on a
 * board you have already read (checklist 8.3).
 */
function paintScene(ctx, W, H, pal, trial, ms, view = {}) {
  const {
    taps = null, marks = null, ghost = false, beatPulse = 0, onPad = false, art = ART_IMAGES,
  } = view;
  const pad = 26;
  ctx.clearRect(0, 0, W, H);

  /* Normalised path point → canvas, with a perpendicular offset so two movers
     sharing a path run parallel instead of on top of each other. */
  const toXY = (s, offset) => {
    const [nx, ny] = pathPoint(trial.path, s);
    let px = pad + nx * (W - pad * 2);
    let py = pad + ny * (H - pad * 2);
    if (offset) {
      const [ax, ay] = pathPoint(trial.path, Math.max(0, s - 0.02));
      const [bx, by] = pathPoint(trial.path, Math.min(1, s + 0.02));
      const dx = bx - ax;
      const dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      px += (-dy / len) * 30 * offset;
      py += (dx / len) * 30 * offset;
    }
    return [px, py];
  };
  /** Unit normal to the route at `s`, for anything drawn across the rail. */
  const normalAt = (s, offset) => {
    const [ax, ay] = toXY(Math.max(0, s - 0.02), offset);
    const [bx, by] = toXY(Math.min(1, s + 0.02), offset);
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    return [-dy / len, dx / len];
  };
  const stroke = (from, to, width, colour, offset, alpha = 1) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const [px, py] = toXY(from + ((to - from) * i) / steps, offset);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  };
  const tick = (s, offset, colour, half, width) => {
    const [nx, ny] = normalAt(s, offset);
    const [px, py] = toXY(s, offset);
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(px - nx * half, py - ny * half);
    ctx.lineTo(px + nx * half, py + ny * half);
    ctx.stroke();
  };
  const drawSprite = (img, x, y, width, height, angle = 0, alpha = 1) => {
    if (!img?.complete || !img.naturalWidth) return false;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(img, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  };

  /* The whole route, then the hidden stretch drawn over it as a tunnel.
     One cover per mover at its OWN hideAt, so each shape is visible for the
     same LENGTH OF TIME whatever its profile — a shared cover would give the
     accelerating shape a much shorter look than the slowing one, which is
     difficulty by accident rather than by design. */
  for (const m of trial.movers) stroke(0, 1, 3, pal.rail, m.offset, 0.58);
  if (!ghost) for (const m of trial.movers) {
    /* The old 40px opaque slab dominated the entire board. This is still an
       honest occlusion zone — the threat itself is not drawn inside it — but it
       now reads as a translucent rift corridor rather than a grey obstruction. */
    stroke(m.hideAt, 1, 36, pal.cover, m.offset, 0.3);
    stroke(m.hideAt, 1, 2, pal.ink, m.offset, 0.2);
  }

  /*
   * The gates. Both are drawn whenever the level deals two, because a gate you
   * only learn about by being marked wrong is a memory test.
   *
   * ⚠ THEY ARE DRAWN EQUALLY, AND THAT IS THE WHOLE MECHANIC. The first version
   * of this highlighted the live one and faded the other — which looked correct
   * on screen and quietly deleted the decision it exists to create: if the board
   * points at your gate, matching the shape's colour to it is busywork. Caught
   * by looking at Hard L100 rather than by any gate, because nothing here is
   * out of range, out of order, or unplayable — it was simply answering its own
   * question. The mover's fill colour is the only thing that says which is
   * yours, and it has to be read before the cover.
   */
  for (const m of trial.movers) {
    for (let g = 0; g < GATE_S.length; g++) {
      const s = GATE_S[g];
      if (trial.gates === 1 && s !== 1) continue;
      const gateColour = s === 1 ? pal.gateFar : pal.gateNear;
      tick(s, m.offset, gateColour, 28, 4);
      const [gx, gy] = toXY(s, m.offset);
      const [ax, ay] = toXY(Math.max(0, s - 0.025), m.offset);
      const angle = Math.atan2(gy - ay, gx - ax);
      drawSprite(art.gate, gx, gy, 34, 50, angle, ghost ? 0.42 : 0.88);
    }
  }

  /*
   * WARP CUE, at the mouth of the tunnel. The speed change happens where it
   * cannot be seen, so the WARNING has to be somewhere it can — chevrons
   * pointing forward for a mover that will speed up, backward for one that will
   * slow. Without this the strobe would be the first hint anything changed, and
   * a third of the hidden stretch would already be gone.
   */
  for (const m of trial.movers) {
    if (!m.warp || m.warp === 1 || ghost) continue;
    const fast = m.warp > 1;
    for (let k = 0; k < 3; k++) {
      const s = Math.min(0.98, m.hideAt + 0.035 + k * 0.035);
      const [nx, ny] = normalAt(s, m.offset);
      const [px, py] = toXY(s, m.offset);
      const [ax, ay] = toXY(Math.max(0, s - 0.03), m.offset);
      const dx = (px - ax) * (fast ? 1 : -1);
      const dy = (py - ay) * (fast ? 1 : -1);
      const len = Math.hypot(dx, dy) || 1;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = pal.gateFar;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(px - nx * 9 - (dx / len) * 7, py - ny * 9 - (dy / len) * 7);
      ctx.lineTo(px, py);
      ctx.lineTo(px + nx * 9 - (dx / len) * 7, py + ny * 9 - (dy / len) * 7);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* The launch metronome, drawn as a ring on the far gate so the beat is seen
     as well as heard — the sound is a 100ms tone and a player with the volume
     down would otherwise have no tempo at all. */
  if (beatPulse > 0) {
    const m = trial.movers[0];
    const [gx, gy] = toXY(m.gateS, m.offset);
    ctx.save();
    ctx.globalAlpha = beatPulse * 0.8;
    ctx.strokeStyle = pal.gateFar;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(gx, gy, 20 + (1 - beatPulse) * 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  /*
   * THE ERROR, DRAWN WHERE IT HAPPENED.
   *
   * A tick on the rail at the position the mover actually occupied at the
   * instant the player committed — the tap on an intercept trial, the silent
   * fifth beat on a launch one. The gap between that tick and the gate IS the
   * error, at the scale the eye already understands, and it is the thing v1
   * replaced with a number on a modal. Green inside the window, red outside.
   */
  if (marks) {
    for (const mk of marks) tick(mk.s, mk.offset, mk.hit ? pal.ok : pal.bad, 17, 3);
  }

  for (const m of trial.movers) {
    const s = onPad ? 0 : positionAt(m, ms);
    const tap = taps?.find((x) => x.lane === m.lane);
    const claimed = Boolean(tap);
    const strobing = m.strobeAt != null && ms >= m.strobeAt && ms <= m.strobeAt + m.strobeMs;
    /*
     * ⚠ THE REVEAL RULE, and the single most important line in the file.
     *
     * Hidden only while it is genuinely mid-tunnel AND has not yet crossed. Once
     * it passes its gate it is drawn WHATEVER HAPPENED — including on a trial
     * you never answered, which is exactly the trial where seeing it matters
     * most. v1 hid it until the player claimed it and then ended the run on the
     * claim, so the arrival was never once shown to anybody.
     */
    const hidden = !ghost && s >= m.hideAt && ms < m.arriveAt && !claimed && !strobing;
    if (hidden) continue;
    const [px, py] = toXY(s, m.offset);
    const [ax, ay] = toXY(Math.max(0, s - 0.02), m.offset);
    const angle = Math.atan2(py - ay, px - ax);

    /* A precise intercept now has a visible payoff at the gate. It is rendered
       from the existing atlas artwork and fades during the reveal hold, so it
       adds no particles, timers or DOM work to the animation loop. */
    if (tap?.hit && ms >= m.arriveAt && ms <= m.arriveAt + REVEAL_HOLD) {
      const [gx, gy] = toXY(m.gateS, m.offset);
      const fade = 1 - (ms - m.arriveAt) / REVEAL_HOLD;
      drawSprite(art.burst, gx, gy, 54, 54, 0, Math.max(0, fade));
    }

    ctx.save();
    ctx.globalAlpha = ghost ? 0.4 : 1;
    ctx.translate(px, py);
    ctx.rotate(angle);       // nose points along travel
    ctx.fillStyle = ghost
      ? pal.rail
      : (claimed && ms > m.arriveAt ? pal.spent : (m.gateS === 1 ? pal.gateFar : pal.gateNear));
    const sprite = art[m.profile];
    const spriteReady = sprite?.complete && sprite.naturalWidth;
    if (spriteReady) {
      ctx.rotate(Math.PI / 2);
      const size = strobing ? 38 : 34;
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      if (strobing) {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = pal.gateFar;
        ctx.beginPath();
        ctx.arc(0, 0, 23, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      (SHAPE_PATH[m.profile] || SHAPE_PATH.steady)(ctx, 13);
      ctx.fill();
      if (strobing) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = pal.ink;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}

/** DPR-correct canvas sizing, shared by the countdown and the run. */
function sizeCanvas(canvas, wrap, ctx) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = wrap.clientWidth;
  const H = wrap.clientHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [W, H];
}

/* ── The engine: watch → tap → SEE IT ARRIVE → next, without a button ─────── */
function InterceptEngine({
  mode, diff, level, seed, attempt, onResult, onExit, isAr, playSfx, awardFreeRun,
}) {
  const t = isAr ? UI.ar : UI.en;

  const [stage, setStage] = useState(0);
  const [trialIdx, setTrialIdx] = useState(0);
  /* 'count' first, so the clock never starts while the player is still reading
     the screen — checklist 8.1/8.2. The countdown runs once per SET, not once
     per trial: a 3-2-1 before every six-second run would be most of the game. */
  const [step, setStep] = useState('count');        // count | run | upgrade | over
  const [count, setCount] = useState(3);
  /* The verdict, shown as a banner OVER the finished scene rather than instead
     of it, and cleared by a timer. There is no Next button: a button between
     every run is what turned a two-second act into a six-second one. */
  const [flash, setFlash] = useState(null);
  const [paused, setPaused] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  /*
   * ⚠ LEAVING THE APP MUST STOP THE CLOCK, and this game is the one where that
   * is not a nicety.
   *
   * Every trial is ended by the rAF loop noticing the movers are done. Hidden
   * tabs get their rAF throttled to a crawl or stopped outright, so switching
   * apps mid-run leaves the trial live indefinitely — and because the tap no
   * longer ends the run, the first tap on returning is stamped against an
   * arrival that happened a long time ago. Caught in play: a 2.4-second run
   * scored "Missed — 23000ms late" and took a life for it.
   *
   * Treating it as a pause is the honest fix rather than a guard on the number:
   * the clock stops, the lost stretch is subtracted like any other pause, and
   * the player comes back to the run they left.
   */
  const [away, setAway] = useState(false);
  const [results, setResults] = useState([]);
  const [lives, setLives] = useState(MAX_SHIELD);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [upgrades, setUpgrades] = useState({ scan: 0, pulse: 0 });
  const [best, setBest] = useState(() => PROFILE.load().bestStage || 0);

  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const artRef = useRef(getInterceptArt());
  const trialLogRef = useRef(null);
  const pausedRef = useRef(false);
  /* The quit dialog freezes the run too. It is a modal over a live clock: if it
     only stopped taps, a player who opened it and changed their mind would come
     back to a shape that had already crossed the line. */
  useEffect(() => { pausedRef.current = paused || quitOpen; }, [paused, quitOpen]);

  /*
   * ⚠ THE HIDDEN GAP IS MEASURED BY THE LISTENER, NOT BY THE FRAME LOOP.
   *
   * The modal pauses above can be bookkept inside the loop because rAF keeps
   * running underneath them. Leaving the app cannot: the browser throttles or
   * stops rAF entirely, so the loop is not there to notice the gap starting,
   * and the first frame after returning would measure the pause as having begun
   * on that frame — subtracting nothing. So the timestamps are taken in the
   * visibility handler, which fires either way, and the loop simply refuses to
   * advance while `awayRef` is set. One owner for the lost time; no double
   * counting.
   */
  const awayRef = useRef(false);
  const clockRef = useRef({ lost: 0 });
  useEffect(() => {
    let hiddenAt = 0;
    const onVis = () => {
      const hidden = document.hidden;
      if (hidden) {
        hiddenAt = performance.now();
      } else if (hiddenAt) {
        clockRef.current.lost += performance.now() - hiddenAt;
        hiddenAt = 0;
      }
      awayRef.current = hidden;
      setAway(hidden);
    };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const baseCfg = useMemo(
    () => (mode === 'free' ? survivalCfg(stage) : levelCfg(diff, level)),
    [mode, stage, diff, level],
  );

  /* Sector upgrades create a decision loop without corrupting the authored level
     curriculum. They only exist in Rift Defense, and they buy readable time
     rather than pushing the underlying task below its human timing floors. */
  const cfg = useMemo(() => {
    if (mode !== 'free') return baseCfg;
    return {
      ...baseCfg,
      visibleMs: Math.min(
        baseCfg.travel * 0.8,
        baseCfg.visibleMs + Math.min(upgrades.scan, MAX_SYSTEM_LEVEL) * 80,
      ),
      tol: baseCfg.tol + Math.min(upgrades.pulse, MAX_SYSTEM_LEVEL) * 12,
    };
  }, [baseCfg, mode, upgrades]);

  const rng = useMemo(
    () => makeRng(`${seed}-${mode}-${diff}-${level}-${stage}-${trialIdx}-${attempt}`),
    [seed, mode, diff, level, stage, trialIdx, attempt],
  );

  const trial = useMemo(() => buildTrial(cfg, rng), [cfg, rng]);

  useEffect(() => {
    trialLogRef.current = createTrialLog({ game: 'intercept', mode, meta: { diff, level } });
    return () => trialLogRef.current?.flush?.();
  }, [mode, diff, level]);

  /* ── countdown ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (step !== 'count' || paused || quitOpen || away) return undefined;
    if (count <= 0) { setStep('run'); return undefined; }
    const id = window.setTimeout(() => {
      playSfx?.('click');
      setCount((c) => c - 1);
    }, 620);
    return () => window.clearTimeout(id);
  }, [step, count, paused, quitOpen, away, playSfx]);

  /* The board behind the countdown, frozen at t=0 — route, cover and gates all
     readable before anything moves. */
  useEffect(() => {
    if (step !== 'count') return undefined;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');
    const pal = readPalette(wrap);
    const draw = () => {
      const [W, H] = sizeCanvas(canvas, wrap, ctx);
      paintScene(ctx, W, H, pal, trial, 0, {
        onPad: trial.kind === 'launch', art: artRef.current,
      });
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [step, trial]);

  /* ── the run ─────────────────────────────────────────────────────────────
   *
   * One rAF loop covers the whole trial including the reveal, which is why the
   * reveal exists at all: v1 tore the loop down on the tap. The loop walks a
   * small phase machine so a launch trial (preview → beats → flight → reveal)
   * and an intercept trial (live → reveal) share every line of drawing, timing
   * and pause handling rather than forking into two engines.
   */
  useEffect(() => {
    if (step !== 'run') return undefined;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');

    const launch = trial.kind === 'launch';
    let raf = 0;
    let W = 0;
    let H = 0;
    const st = {
      phase: launch ? 'preview' : 'live',
      taps: [],
      released: null,
      relBt: null,
      beatsPlayed: 0,
      done: false,
      /* Wall clock at which the current phase began, in loop time. */
      phaseAt: 0,
    };

    const resize = () => { [W, H] = sizeCanvas(canvas, wrap, ctx); };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const pal = readPalette(wrap);
    const t0 = performance.now();
    let pauseAt = 0;
    /* Shared with the visibility handler, which is the only thing that can see
       a stretch where rAF was not running at all. Reset per trial. */
    clockRef.current.lost = 0;
    const clock = (now) => now - t0 - clockRef.current.lost;

    const finish = () => {
      if (st.done) return;
      st.done = true;

      const scored = launch
        ? [st.relBt == null
          ? { err: null, hit: false, perfect: false, points: 0, profile: trial.movers[0].profile }
          : scoreLaunch(trial, st.relBt)]
        : trial.movers.map((m) => {
          const tap = st.taps.find((x) => x.lane === m.lane);
          if (!tap) return { err: null, hit: false, perfect: false, points: 0, profile: m.profile };
          return { ...scoreTap(m, tap.ms, trial.tol), profile: m.profile };
        });

      const hit = scored.every((s) => s.hit);
      const perfect = hit && scored.every((s) => s.perfect);
      scored.forEach((s, i) => {
        trialLogRef.current?.trial({
          ok: s.hit,
          rt: s.err == null ? null : Math.round(Math.abs(s.err)),
          err: s.err == null ? null : Math.round(s.err),
          profile: s.profile,
          kind: trial.kind,
          tol: trial.tol,
          lane: i,
        });
      });
      /* ⚠ 'correct' and 'wrong' are NOT sounds. AppContext implements exactly
         click / collect / error / win, so v1's playSfx('correct') was a silent
         no-op on every hit and the game shipped with no audio feedback at all —
         in a game whose entire subject is an instant. */
      playSfx?.(perfect ? 'win' : (hit ? 'collect' : 'error'));
      const basePoints = scored.reduce((sum, s) => sum + (s.points || 0), 0);
      const multiplier = 1 + Math.min(streak, 6) * 0.15;
      setFlash({
        scored, hit, perfect, kind: trial.kind,
        points: Math.round(basePoints * multiplier),
      });
    };

    const onTap = (e) => {
      if (pausedRef.current || awayRef.current || st.done) return;
      const now = (e && typeof e.timeStamp === 'number' && e.timeStamp > 0)
        ? e.timeStamp
        : performance.now();
      const ms = now - t0 - clockRef.current.lost;

      if (launch) {
        if (st.phase !== 'beats' || st.released != null) return;
        st.released = ms;
        /* ⚠ Scored in BEAT time, not loop time. `targetAt` is measured from the
           first beat, so a release stamped from the round start would be wrong
           by the whole preview — several seconds of silent, invisible error. */
        st.relBt = ms - st.phaseAt;
        st.phase = 'flight';
        playSfx?.('click');
        return;
      }
      if (st.phase !== 'live') return;
      /* Each mover can be claimed once, by the tap nearest its arrival. The tap
         does NOT end the run — the loop carries on to the reveal. */
      const open = trial.movers.filter((m) => !st.taps.some((x) => x.lane === m.lane));
      if (!open.length) return;
      let pick = open[0];
      for (const m of open) {
        if (Math.abs(ms - m.arriveAt) < Math.abs(ms - pick.arriveAt)) pick = m;
      }
      const sc = scoreTap(pick, ms, trial.tol);
      st.taps.push({ lane: pick.lane, ms, hit: sc.hit });
    };
    canvas.addEventListener('pointerdown', onTap);

    const lastEnd = Math.max(...trial.movers.map((m) => m.endAt));

    const frame = (now) => {
      /* Away is handled entirely by the visibility listener — the loop must not
         also bookkeep it, or the same gap would be subtracted twice. */
      if (awayRef.current) { raf = requestAnimationFrame(frame); return; }
      if (pausedRef.current) {
        if (!pauseAt) pauseAt = now;
        raf = requestAnimationFrame(frame);
        return;
      }
      if (pauseAt) { clockRef.current.lost += now - pauseAt; pauseAt = 0; }
      const ms = clock(now);

      if (!launch) {
        /* The mark is the mover's position at the tap, so it is computed from
           the same positionAt the shape is drawn with — a second arrival
           calculation is how a tick ends up somewhere the shape never was. */
        const marks = st.taps.map((tp) => {
          const m = trial.movers.find((x) => x.lane === tp.lane);
          return { s: positionAt(m, tp.ms), offset: m.offset, hit: tp.hit };
        });
        paintScene(ctx, W, H, pal, trial, ms, { taps: st.taps, marks, art: artRef.current });
        if (!st.done && ms > lastEnd + REVEAL_HOLD) finish();
      } else {
        const m = trial.movers[0];
        if (st.phase === 'preview') {
          /* The preview is the whole point of launch mode: the release time is
             `beat5 − timeToGate`, and timeToGate is unknowable unless the run
             has been seen once. Drawn uncovered and dimmed — it is a
             demonstration, not a trial. */
          paintScene(ctx, W, H, pal, trial, ms, { ghost: true, art: artRef.current });
          if (ms > m.endAt + PREVIEW_GAP) { st.phase = 'beats'; st.phaseAt = ms; }
        } else {
          /* Beat time. The mover's own clock starts at the release, so its
             local time is `bt - relBt` — one subtraction, kept in one place. */
          const bt = ms - st.phaseAt;
          const relBt = st.relBt;
          const local = relBt == null ? 0 : bt - relBt;

          /* Beats 1..4 sound. The fifth is silent and is the target: that is the
             whole task, so it must not be announced. It still PULSES, because
             the pulse is the reveal — you watch the ring fire and see where your
             shape actually was at that instant. */
          const due = Math.min(LAUNCH_BEATS, Math.floor(bt / trial.beatMs));
          if (due > st.beatsPlayed) {
            if (due <= LAUNCH_BEATS - 1) playSfx?.('click');
            st.beatsPlayed = due;
          }
          const sinceBeat = bt - st.beatsPlayed * trial.beatMs;
          const pulse = st.beatsPlayed > 0 && sinceBeat < 260 ? 1 - sinceBeat / 260 : 0;

          const marks = (relBt != null && bt >= trial.targetAt)
            ? [{
              s: positionAt(m, trial.targetAt - relBt),
              offset: m.offset,
              hit: Math.abs(relBt + trial.toGate - trial.targetAt) <= trial.tol,
            }]
            : null;

          paintScene(ctx, W, H, pal, trial, local, {
            marks,
            beatPulse: pulse,
            onPad: relBt == null,
            art: artRef.current,
          });

          if (!st.done) {
            if (relBt == null) {
              if (bt > trial.targetAt + trial.tol + 400) finish();
            } else if (bt > Math.max(trial.targetAt, relBt + m.endAt) + REVEAL_HOLD) {
              finish();
            }
          }
        }
      }

      if (!st.done) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onTap);
    };
  }, [step, trial, playSfx, streak]);

  /* ── advancing ───────────────────────────────────────────────────────── */

  /*
   * The LEVELS end screen is ModeShell's, not this game's.
   *
   * It already renders "Level cleared ✓" / "Not quite" with Next level, Replay
   * or Retry, and Levels — the wording from STR_COMMON and the same three
   * actions as every other game. Rendering a local one would fork the chrome
   * for one game and, worse, would never be seen: calling onResult moves
   * ModeShell to its result phase and unmounts this engine. So the metrics
   * travel as `summary`, one line, which is what that screen takes.
   *
   * SURVIVAL keeps a local screen, exactly as keep-track does, because
   * ModeShell's result screen is built for a level — its actions are Next level
   * and Levels, and neither means anything after an endless run.
   */
  const summarise = useCallback((rows) => {
    const hitCount = rows.filter((r) => r.hit).length;
    const perfCount = rows.filter((r) => r.perfect).length;
    const errs = rows.flatMap((r) => r.scored)
      .filter((s) => s.err != null).map((s) => s.err);
    if (!errs.length) return t.caught(hitCount, rows.length);
    const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
    /* Signed mean, not absolute: which SIDE you err on is the coachable thing
       here. A consistent early tap is a fixable habit; a scattered one is not
       the same problem and should not read as one. */
    const lean = Math.abs(mean) < 25 ? t.biasNone : (mean < 0 ? t.biasEarly : t.biasLate);
    const closest = Math.round(Math.min(...errs.map((e) => Math.abs(e))));
    return `${t.caught(hitCount, rows.length)} · ${t.perfects(perfCount)}`
      + ` · ${t.avgErr} ${Math.abs(Math.round(mean))}ms`
      + ` · ${t.bestErr} ${closest}ms · ${lean}`;
  }, [t]);

  const advance = useCallback(() => {
    const row = flash;
    if (!row) return;
    const nextResults = [...results, row];
    setFlash(null);
    setStreak((s) => (row.hit ? s + 1 : 0));

    if (mode === 'free') {
      const nextStage = stage + 1;
      const earned = row.points || 0;
      setScore((n) => n + earned);
      setStage(nextStage);

      let left = lives;
      if (!row.hit) {
        left -= 1;
        setLives(left);
        if (left <= 0) {
          awardFreeRun?.('intercept', nextStage);
          if (nextStage > best) {
            setBest(nextStage);
            PROFILE.save({ ...PROFILE.load(), bestStage: nextStage });
          }
          setResults(nextResults);
          setStep('over');
          return;
        }
      }

      setResults(nextResults);
      /* Five waves make a sector. The old endless mode was one uninterrupted
         stream of identical rounds; this boundary creates a goal, a breath and
         a real build decision before pressure resumes. */
      if (nextStage % WAVES_PER_SECTOR === 0) {
        setStep('upgrade');
        return;
      }
      setTrialIdx((i) => i + 1);
      return;
    }

    if (nextResults.length >= TRIALS_PER_LEVEL) {
      const hits = nextResults.filter((r) => r.hit).length;
      const won = levelPassed(hits);
      onResult?.({
        won,
        score: hits,
        // A fail screen has to say WHY, not only that you did — 12.1.
        summary: won ? summarise(nextResults) : `${summarise(nextResults)} — ${t.needHits}`,
      });
      return;
    }
    setResults(nextResults);
    setTrialIdx((i) => i + 1);
  }, [flash, results, mode, lives, stage, best, awardFreeRun, onResult, summarise, t]);

  const chooseUpgrade = useCallback((id) => {
    playSfx?.('collect');
    if (id === 'shield') {
      if (lives >= MAX_SHIELD) setScore((n) => n + 200);
      else setLives((n) => Math.min(MAX_SHIELD, n + 1));
    } else if (upgrades[id] >= MAX_SYSTEM_LEVEL) {
      setScore((n) => n + 200);
    } else {
      setUpgrades((current) => ({ ...current, [id]: current[id] + 1 }));
    }
    setTrialIdx((i) => i + 1);
    setCount(2);
    setStep('count');
  }, [lives, playSfx, upgrades]);

  /* The set advances itself. A pause freezes the timer with everything else —
     including leaving the app — so neither opening the menu nor switching away
     mid-verdict skips the next run before it has been seen. */
  useEffect(() => {
    if (!flash || paused || quitOpen || away) return undefined;
    const id = window.setTimeout(advance, FLASH_MS);
    return () => window.clearTimeout(id);
  }, [flash, paused, quitOpen, away, advance]);

  /*
   * THE BIAS METER — the game's own measure, finally shown while it can be used.
   *
   * v1 computed the signed lean and put it in the summary line of a screen you
   * reach after the level is over. It is the single most actionable thing this
   * task produces: a consistent early tap is a habit you can correct inside the
   * same set, and telling someone about it afterwards is telling them too late.
   */
  const bias = useMemo(() => {
    const errs = results.flatMap((r) => r.scored)
      .filter((s) => s.err != null).map((s) => s.err);
    if (errs.length < 3) return null;
    const recent = errs.slice(-8);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const n = Math.abs(Math.round(mean));
    if (n < 22) return { text: t.leanEven, side: 0 };
    return { text: mean < 0 ? t.leanEarly(n) : t.leanLate(n), side: mean < 0 ? -1 : 1 };
  }, [results, t]);

  /* A short run can end before the live bias meter has the three samples it
     needs. The debrief still uses every tap so its coaching never contradicts
     the signed miss reported immediately above it. */
  const resultCoachSide = useMemo(() => {
    const errs = results.flatMap((r) => r.scored)
      .filter((s) => s.err != null).map((s) => s.err);
    if (!errs.length) return null;
    const mean = errs.reduce((a, b) => a + b, 0) / errs.length;
    if (Math.abs(mean) < 25) return 0;
    return mean < 0 ? -1 : 1;
  }, [results]);

  const mission = cfg.mission || {
    sector: Math.floor(stage / WAVES_PER_SECTOR) + 1,
    wave: (stage % WAVES_PER_SECTOR) + 1,
    surge: false,
  };
  const threatLabel = trial.kind === 'launch'
    ? t.threatSync
    : trial.movers.length >= 3
      ? t.threatSwarm
      : trial.movers.some((m) => m.warp !== 1)
        ? t.threatWarp
        : trial.gates > 1 ? t.threatSplit : t.threatScout;
  const lastWaveIndex = Math.max(0, stage - 1);
  const lastMission = {
    sector: Math.floor(lastWaveIndex / WAVES_PER_SECTOR) + 1,
    wave: (lastWaveIndex % WAVES_PER_SECTOR) + 1,
  };
  const displayedMission = step === 'over' ? lastMission : mission;
  const coachSide = bias?.side ?? resultCoachSide;
  const coach = coachSide == null
    ? t.coachNoTap
    : coachSide < 0 ? t.coachEarly : coachSide > 0 ? t.coachLate : t.coachEven;

  /* The header carries mode, progress and lives — the same three facts every
     other game puts there, through the shared TrainingPlayHeader rather than a
     hand-rolled bar, so back / title / pause sit where players expect them. */
  const headerTitle = mode === 'free'
    ? `${t.defenseTitle} · ${t.sector(displayedMission.sector)}`
    : mode === 'passplay'
      ? `${t.challengeHeader} · ${Math.min(results.length + 1, TRIALS_PER_LEVEL)}/${TRIALS_PER_LEVEL}`
      : `${t.levelMode} · L${level}`;
  const headerSub = mode === 'free'
    ? `${t.wave(displayedMission.wave)} · ${t.shieldLabel}: ${'●'.repeat(Math.max(0, lives))}${'○'.repeat(Math.max(0, MAX_SHIELD - lives))}`
    : t.trialOf(Math.min(results.length + 1, TRIALS_PER_LEVEL), TRIALS_PER_LEVEL);

  const cue = trial.kind === 'launch'
    ? t.readyLaunch
    : (trial.gates > 1 ? t.readyGates : t.ready);

  return (
    <div
      className="ct-training-root ic-root"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <TrainingPlayHeader
        isAr={isAr}
        title={headerTitle}
        subtitle={headerSub}
        playSfx={playSfx}
        onMenu={() => setQuitOpen(true)}
        onPause={step === 'run' ? () => setPaused(true) : undefined}
        pauseAriaLabel={t.paused}
        menuAriaLabel={t.menu}
      />

      {mode === 'free' && (step === 'count' || step === 'run') && (
        <div className="ic-mission-strip" aria-label={`${t.sector(mission.sector)}, ${t.wave(mission.wave)}`}>
          <img src={ART_URLS.station} alt="" aria-hidden="true" />
          <div className="ic-mission-copy">
            <strong>{mission.surge ? t.surge : threatLabel}</strong>
            <span>{t.wave(mission.wave)}</span>
          </div>
          <div className="ic-mission-score">
            <span>{t.scoreLabel}</span>
            <strong>{score}</strong>
          </div>
        </div>
      )}

      <div className="ic-stage-wrap">
        {(step === 'count' || step === 'run') && (
          <div className="ic-stage" ref={wrapRef}>
            <canvas ref={canvasRef} className="ic-canvas" />

            <div className="ic-chips">
              {streak >= 2 && <span className="ic-chip ic-chip--streak">{t.streak(streak)}</span>}
              {bias && (
                <span className={`ic-chip${bias.side === 0 ? ' ic-chip--even' : ''}`}>
                  {bias.text}
                </span>
              )}
            </div>

            {/* The cue is up before the first response is possible — 8.3. */}
            <p className="ic-cue">{cue}</p>

            {step === 'count' && (
              <div className="ic-count" aria-live="assertive">{count > 0 ? count : t.go}</div>
            )}

            {/* The verdict sits OVER the finished scene, so the arrival stays on
                screen while it is read. Replacing the scene with a panel is what
                hid the reveal in the first place. */}
            {flash && (
              <div className={`ic-flash${flash.perfect ? ' ic-flash--perfect' : ''}`} aria-live="polite">
                <strong className={flash.hit ? 'ic-ok' : 'ic-no'}>
                  {flash.perfect ? t.perfect : (flash.hit ? t.hit
                    : (flash.scored.some((s) => s.err == null)
                      ? (flash.kind === 'launch' ? t.noRelease : t.tooSlow)
                      : t.miss))}
                </strong>
                {flash.scored.map((s, i) => (
                  <span className="ic-err" key={`${s.profile}-${i}`}>
                    {s.err == null
                      ? ''
                      : `${Math.abs(Math.round(s.err))}ms ${s.err < 0 ? t.early : t.late}`}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'upgrade' && (
          <div className="ic-panel ic-upgrade-panel">
            <img className="ic-upgrade-station" src={ART_URLS.station} alt="" aria-hidden="true" />
            <p className="ic-eyebrow">{t.sector(Math.max(1, mission.sector - 1))}</p>
            <h3>{t.sectorSecured}</h3>
            <p className="ic-upgrade-copy">{t.chooseUpgrade}</p>
            <div className="ic-upgrade-grid">
              <button type="button" className="ic-upgrade-card" onClick={() => chooseUpgrade('scan')}>
                <img src={ART_URLS.scan} alt="" aria-hidden="true" />
                <span>
                  <strong>{t.scanName}</strong>
                  <small>{upgrades.scan >= MAX_SYSTEM_LEVEL ? t.maxed : t.scanDesc}</small>
                </span>
                <b>{upgrades.scan >= MAX_SYSTEM_LEVEL ? '+200' : `L${upgrades.scan + 1}`}</b>
              </button>
              <button type="button" className="ic-upgrade-card" onClick={() => chooseUpgrade('pulse')}>
                <img src={ART_URLS.pulse} alt="" aria-hidden="true" />
                <span>
                  <strong>{t.pulseName}</strong>
                  <small>{upgrades.pulse >= MAX_SYSTEM_LEVEL ? t.maxed : t.pulseDesc}</small>
                </span>
                <b>{upgrades.pulse >= MAX_SYSTEM_LEVEL ? '+200' : `L${upgrades.pulse + 1}`}</b>
              </button>
              <button type="button" className="ic-upgrade-card" onClick={() => chooseUpgrade('shield')}>
                <img src={ART_URLS.shield} alt="" aria-hidden="true" />
                <span>
                  <strong>{t.shieldName}</strong>
                  <small>{lives >= MAX_SHIELD ? t.maxed : t.shieldDesc}</small>
                </span>
                <b>{lives >= MAX_SHIELD ? '+200' : '+1'}</b>
              </button>
            </div>
          </div>
        )}

        {step === 'over' && (
          <div className="ic-panel ic-debrief-panel">
            <div className="ic-debrief-art" aria-hidden="true">
              <img src={ART_URLS.station} alt="" />
              <img src={ART_URLS.burst} alt="" />
            </div>
            <p className="ic-eyebrow">{t.debrief}</p>
            <h3>{t.stationLost}</h3>
            <div className="ic-debrief-metrics">
              <strong>{t.totalScore(score)}</strong>
              <span>{t.reached(lastMission.sector, lastMission.wave)}</span>
              <span>{t.personalBest(Math.max(best, stage))}</span>
            </div>
            <p className="ic-sum">{summarise(results)}</p>
            <p className="ic-coach">{coach}</p>
            <p className="ic-meaning">{t.meaning}</p>
            <div className="ic-actions">
              <button
                type="button"
                className="ct-training-btn ct-training-btn--pri"
                onClick={() => {
                  playSfx?.('click');
                  setStage(0); setLives(MAX_SHIELD); setScore(0); setUpgrades({ scan: 0, pulse: 0 });
                  setResults([]); setFlash(null); setStreak(0);
                  setTrialIdx((i) => i + 1);
                  setCount(3); setStep('count');
                }}
              >
                {t.freePlayAgain}
              </button>
              <button
                type="button"
                className="ct-training-btn ct-training-btn--ghost"
                onClick={() => { playSfx?.('click'); onExit?.(); }}
              >
                {t.menu}
              </button>
            </div>
          </div>
        )}
      </div>

      <TrainingPauseModal
        open={paused}
        showRestart={false}
        labels={{ paused: t.paused, resume: t.resume, quitMenu: t.quitMenu }}
        onResume={() => { setPaused(false); playSfx?.('click'); }}
        onQuitMenu={() => { playSfx?.('click'); onExit?.(); }}
      />
      <TrainingQuitModal
        open={quitOpen}
        labels={{ quitQ: t.quitQ, quitLose: t.quitLose, yesQuit: t.yesQuit, keep: t.keep }}
        onConfirmQuit={() => { playSfx?.('click'); onExit?.(); }}
        onKeepPlaying={() => { playSfx?.('click'); setQuitOpen(false); }}
      />
    </div>
  );
}

export default function InterceptGame({ onBack, workoutMode = false }) {
  const { currentLang, playSfx, awardFreeRun } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <ModeShell
      storageKey="mm_spd_intercept"
      gameId="intercept"
      scienceId="intercept"
      title={{ en: UI.en.title, ar: UI.ar.title }}
      hints={{
        free: { en: UI.en.hintFree, ar: UI.ar.hintFree },
        levels: { en: UI.en.hintLevels, ar: UI.ar.hintLevels },
        pass: { en: UI.en.hintPass, ar: UI.ar.hintPass },
      }}
      survivalIntro={{
        title: { en: UI.en.defenseTitle, ar: UI.ar.defenseTitle },
        body: {
          en: 'Protect the station through five-wave sectors. Read each threat, intercept it at the rift, then choose a system upgrade before the next sector.',
          ar: 'احمِ المحطة عبر قطاعات من خمس موجات. اقرأ حركة كل تهديد واعترضه عند الشق، ثم اختر ترقية للنظام قبل القطاع التالي.',
        },
      }}
      diffLabels={{
        easy: { en: 'Easy', ar: 'سهل' },
        med: { en: 'Medium', ar: 'متوسط' },
        hard: { en: 'Hard', ar: 'صعب' },
      }}
      levelCount={100}
      pass={{
        trials: TRIALS_PER_LEVEL,
        scoreLabel: { en: 'caught', ar: 'أمسك' },
        lowerBetter: false,
        diff: 'med',
      }}
      isAr={isAr}
      playSfx={playSfx}
      onBack={onBack}
      workoutMode={workoutMode}
      renderEngine={(p) => (
        <InterceptEngine
          {...p}
          isAr={isAr}
          playSfx={playSfx}
          awardFreeRun={awardFreeRun}
        />
      )}
    />
  );
}

export { UI as INTERCEPT_UI };
