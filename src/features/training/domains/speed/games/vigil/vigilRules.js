/** Vigil rule sets, shape assignment, and pre-block briefing copy. */

export const VIGIL_SHAPE_IDS = ['square', 'circle', 'triangle', 'diamond', 'hexagon'];

const RULES = {
  square_classic: {
    id: 'square_classic',
    targetShape: 'square',
    nogoShapes: ['circle'],
  },
  square_multi: {
    id: 'square_multi',
    targetShape: 'square',
    nogoShapes: ['circle', 'triangle', 'diamond'],
  },
  diamond_focus: {
    id: 'diamond_focus',
    targetShape: 'diamond',
    nogoShapes: ['square', 'circle', 'triangle', 'hexagon'],
  },
  triangle_focus: {
    id: 'triangle_focus',
    targetShape: 'triangle',
    nogoShapes: ['square', 'circle', 'diamond', 'hexagon'],
  },
  hexagon_focus: {
    id: 'hexagon_focus',
    targetShape: 'hexagon',
    nogoShapes: ['square', 'circle', 'triangle', 'diamond'],
  },
};

const SHAPE_LABEL = {
  en: {
    square: 'square',
    circle: 'circle',
    triangle: 'triangle',
    diamond: 'diamond',
    hexagon: 'hexagon',
  },
  ar: {
    square: 'مربع',
    circle: 'دائرة',
    triangle: 'مثلث',
    diamond: 'معيّن',
    hexagon: 'سداسي',
  },
};

/** Which go / no-go rule applies for this tier level. */
export function ruleForLevel(diff, lv) {
  const level = Math.max(1, Math.min(20, Math.floor(lv) || 1));
  if (diff === 'easy') {
    if (level <= 6) return RULES.square_classic;
    return RULES.square_multi;
  }
  if (diff === 'medium') {
    if (level <= 10) return RULES.square_multi;
    return RULES.diamond_focus;
  }
  if (level <= 8) return RULES.diamond_focus;
  if (level <= 15) return RULES.triangle_focus;
  return RULES.hexagon_focus;
}

function shapeListLabel(shapes, isAr) {
  const map = isAr ? SHAPE_LABEL.ar : SHAPE_LABEL.en;
  return shapes.map((s) => map[s] ?? s).join(isAr ? ' · ' : ', ');
}

function pickNogoShape(nogoShapes, rnd) {
  return nogoShapes[Math.floor(rnd() * nogoShapes.length)];
}

/** Attach a visible shape to each trial (target vs distractor). */
export function assignTrialShapes(trials, rule, seed = 0) {
  let a = (seed >>> 0) ^ 0x9e3779b9;
  const rnd = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return trials.map((tr) => ({
    ...tr,
    shape: tr.isTarget ? rule.targetShape : pickNogoShape(rule.nogoShapes, rnd),
  }));
}

export function estimateBlockSec(spec) {
  const n = spec?.trialCount ?? 48;
  const fix = spec?.fixationMs ?? 400;
  const stim = spec?.stimulusMs ?? 180;
  const isiMid = ((spec?.isiMinMs ?? 1000) + (spec?.isiMaxMs ?? 1600)) / 2;
  return Math.round((n * (fix + stim + isiMid)) / 1000);
}

export function describeBriefing(rule, spec, isAr) {
  const tapShapes = [rule.targetShape];
  const avoidShapes = [...rule.nogoShapes];
  const trials = spec?.trialCount ?? 48;
  const sec = estimateBlockSec(spec);
  const min = Math.max(1, Math.round(sec / 60));

  if (isAr) {
    return {
      headline: 'مهمة هذه الكتلة',
      tapLine: `اضغط عند: ${shapeListLabel(tapShapes, true)}`,
      avoidLine: `تجنّب: ${shapeListLabel(avoidShapes, true)}`,
      detailLine: `${trials} محاولة · نحو ${min} د · اضغط على الشكل مباشرة`,
      startLabel: 'ابدأ الكتلة',
      tapShapes,
      avoidShapes,
    };
  }
  return {
    headline: 'Your task this block',
    tapLine: `Tap for: ${shapeListLabel(tapShapes, false)}`,
    avoidLine: `Do not tap for: ${shapeListLabel(avoidShapes, false)}`,
    detailLine: `${trials} trials · ~${min} min · tap the shape directly`,
    startLabel: 'Start block',
    tapShapes,
    avoidShapes,
  };
}

export function liveCueForTrial(rule, trial, isAr, t) {
  if (!trial) return t.cueWait;
  if (trial.isTarget) {
    const map = isAr ? SHAPE_LABEL.ar : SHAPE_LABEL.en;
    const name = map[rule.targetShape] ?? rule.targetShape;
    return isAr ? `${name} — اضغط!` : `${name} — TAP!`;
  }
  const map = isAr ? SHAPE_LABEL.ar : SHAPE_LABEL.en;
  const name = map[trial.shape] ?? trial.shape;
  return isAr ? `${name} — لا تضغط` : `${name} — HOLD`;
}

export function hudRuleLines(rule, isAr) {
  const b = describeBriefing(rule, { trialCount: 0 }, isAr);
  return { tapLine: b.tapLine, avoidLine: b.avoidLine };
}

export function playHintForRule(rule, isAr) {
  const map = isAr ? SHAPE_LABEL.ar : SHAPE_LABEL.en;
  const target = map[rule.targetShape];
  if (isAr) {
    return `اضغط عند ظهور ${target}.`;
  }
  return `Tap when you see a ${target}.`;
}
