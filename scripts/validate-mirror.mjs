/*
 * validate:mirror — assert the OUTCOME of a Mirror World schedule.
 *
 * The failure this exists for is invisible: a schedule missing its washout block
 * PLAYS perfectly well. Nothing errors, the reaches feel fine, the level passes.
 * It just never shows the aftereffect — which is the only reason this game is in
 * the app. Same family as audit:fq certifying a curriculum nobody could finish.
 *
 * Also simulates a player to check the geometry actually does what it claims:
 * a perfect hand under rotation must produce an error EQUAL to the rotation, and
 * a hand that has fully adapted must produce an aftereffect of the OPPOSITE sign.
 */
import {
  BASE, DIFF_KEYS, LEVELS_PER_TIER, ROLE, HIT_DEG,
  levelSchedule, survivalSchedule, passSchedule,
  perturb, angularError, targetAngles, summarise, levelPassed,
} from '../src/features/training/domains/flexibility/games/mirror-world/data.js';

const problems = [];
const push = (m) => problems.push(m);

/* ── 1. Every schedule is shaped correctly ── */
function checkSchedule(tag, blocks) {
  const roles = blocks.map((b) => b.role);
  if (roles.filter((r) => r === ROLE.BASE).length !== 1) push(`${tag}: needs exactly one baseline block`);
  if (!roles.includes(ROLE.ADAPT)) push(`${tag}: no adaptation block`);
  if (roles[roles.length - 1] !== ROLE.WASH) {
    push(`${tag}: does NOT end with a washout — the aftereffect can never be measured`);
  }
  blocks.forEach((b, i) => {
    if (b.role === ROLE.WASH && b.rotation !== 0) push(`${tag} block ${i}: washout has rotation ${b.rotation}, must be 0`);
    if (b.role === ROLE.BASE && b.rotation !== 0) push(`${tag} block ${i}: baseline has rotation ${b.rotation}, must be 0`);
    if (b.role === ROLE.ADAPT && b.rotation === 0) push(`${tag} block ${i}: adaptation block has no rotation`);
    if (!(b.reaches > 0)) push(`${tag} block ${i}: ${b.reaches} reaches`);
    if (!targetAngles(b.targets).length) push(`${tag} block ${i}: no target directions`);
  });
  const total = blocks.reduce((a, b) => a + b.reaches, 0);
  if (total < 20 || total > 60) push(`${tag}: ${total} reaches total — outside the playable 20–60 range`);
  return total;
}

let scheds = 0;
for (const diff of DIFF_KEYS) {
  for (const lv of [1, 25, 50, 75, LEVELS_PER_TIER]) {
    checkSchedule(`${diff}/L${lv}`, levelSchedule(diff, lv));
    scheds++;
  }
}
for (let s = 0; s < 36; s++) { checkSchedule(`survival/${s}`, survivalSchedule(s).blocks); scheds++; }
checkSchedule('passplay', passSchedule());
scheds++;

/* ── 2. Difficulty goes the way it claims ── */
for (const diff of DIFF_KEYS) {
  let prev = -Infinity;
  for (let lv = 1; lv <= LEVELS_PER_TIER; lv++) {
    const rot = levelSchedule(diff, lv).find((b) => b.role === ROLE.ADAPT).rotation;
    if (rot < prev) push(`${diff} L${lv}: rotation fell (${prev}→${rot})`);
    prev = rot;
  }
  const lo = levelSchedule(diff, 1).find((b) => b.role === ROLE.ADAPT).rotation;
  const hi = levelSchedule(diff, LEVELS_PER_TIER).find((b) => b.role === ROLE.ADAPT).rotation;
  if (hi <= lo) push(`${diff}: rotation does not grow across the tier (${lo}→${hi})`);
}

/* ── 3. The geometry does what the game says it does ── */
function simulate(blocks, adaptRate) {
  // A player who aims at the target, then corrects by `adaptRate` of the error
  // she just saw. adaptRate 0 = never learns; 1 = perfect one-shot learner.
  const reaches = [];
  let held = 0;                       // the internal re-aim she is carrying
  blocks.forEach((block) => {
    const angles = targetAngles(block.targets);
    for (let i = 0; i < block.reaches; i++) {
      const tgt = angles[i % angles.length];
      const aim = tgt - held;                       // where the HAND goes
      const rad = (aim * Math.PI) / 180;
      const v = perturb(Math.cos(rad), Math.sin(rad), block, i);
      const seen = (Math.atan2(v.y, v.x) * 180) / Math.PI;
      const err = angularError(seen, tgt);
      reaches.push({ role: block.role, err });
      held += err * adaptRate;
    }
  });
  return reaches;
}

for (const diff of DIFF_KEYS) {
  const blocks = levelSchedule(diff, 60);
  const rot = blocks.find((b) => b.role === ROLE.ADAPT).rotation;

  // A player who never learns should show error ≈ the rotation and NO aftereffect.
  const rigid = summarise(simulate(blocks, 0), blocks);
  if (Math.abs(Math.abs(rigid.late) - rot) > 6) {
    push(`${diff}: a non-learner should end the block ~${rot}° off, got ${Math.round(rigid.late)}°`);
  }
  if (Math.abs(rigid.aftereffect) > 4) {
    push(`${diff}: a non-learner should show no aftereffect, got ${Math.round(rigid.aftereffect)}°`);
  }
  if (levelPassed(rigid)) push(`${diff}: a player who never adapted PASSED the level`);

  // A learner should end the block near zero and show an aftereffect of the
  // OPPOSITE sign to the rotation. That reversal is the whole demonstration.
  const learner = summarise(simulate(blocks, 0.6), blocks);
  if (Math.abs(learner.late) > HIT_DEG) {
    push(`${diff}: a learner should end the block on target, got ${Math.round(learner.late)}°`);
  }
  if (!(Math.sign(learner.aftereffect) === -Math.sign(rot) && Math.abs(learner.aftereffect) > 5)) {
    push(`${diff}: learner aftereffect should oppose the ${rot}° rotation, got ${Math.round(learner.aftereffect)}°`);
  }
  if (!levelPassed(learner)) push(`${diff}: a player who adapted did NOT pass the level`);
}

console.log(`validate-mirror: ${scheds} schedules, ${DIFF_KEYS.length} tiers simulated`);
if (problems.length) {
  console.error(`\nFAILED — ${problems.length} problem(s):`);
  problems.slice(0, 20).forEach((p) => console.error('  · ' + p));
  if (problems.length > 20) console.error(`  · …and ${problems.length - 20} more`);
  process.exit(1);
}
console.log('validate-mirror: OK');
