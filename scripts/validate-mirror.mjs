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
  LADDER, LADDER_LEVELS, ROLE, HIT_DEG,
  levelSchedule, survivalSchedule, passSchedule,
  perturb, angularError, targetAngles, aimAngles, summarise, levelPassed,
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
/* ⚠ ONE LADDER since 2026-08-28 — every level of it. */
for (let lv = 1; lv <= LADDER_LEVELS; lv++) {
  checkSchedule(`L${lv}`, levelSchedule(lv));
  scheds++;
}
for (let s = 0; s < 36; s++) { checkSchedule(`survival/${s}`, survivalSchedule(s).blocks); scheds++; }
checkSchedule('passplay', passSchedule());
scheds++;

/* ── 2. Difficulty goes the way it claims ── */
{
  let prev = -Infinity;
  for (let lv = 1; lv <= LADDER_LEVELS; lv++) {
    const rot = levelSchedule(lv).find((b) => b.role === ROLE.ADAPT).rotation;
    if (rot < prev) push(`L${lv}: rotation fell (${prev}→${rot})`);
    prev = rot;
  }
  const lo = levelSchedule(1).find((b) => b.role === ROLE.ADAPT).rotation;
  const hi = levelSchedule(LADDER_LEVELS).find((b) => b.role === ROLE.ADAPT).rotation;
  if (hi <= lo) push(`rotation does not grow across the ladder (${lo}→${hi})`);
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

/* One probe per BAND, so every structural setting is exercised. */
for (const diff of LADDER.map((_, b) => `band ${b + 1}`)) {
  const bandIdx = Number(diff.split(' ')[1]) - 1;
  const blocks = levelSchedule(bandIdx * 10 + 5);
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

/* ── 4. CONTROL PARITY ──────────────────────────────────────────────────────
 * Every input method must be able to reach the pass criterion on every level.
 *
 * The game ships two controls: a drag (continuous, can aim anywhere) and a
 * direction pad (discrete, WCAG 2.5.7 alternative). The pad originally offered
 * the TARGET angles — 4 of them on Easy, 90° apart — against rotations of
 * 20–35°, so its best achievable error exceeded the pass threshold and 156 of
 * 300 levels were unpassable through the accessible route. Nothing looked
 * wrong: the buttons rendered, the taps registered, the reaches scored.
 *
 * So this asserts the OUTCOME a real button-user gets — an optimal player
 * restricted to the discrete aim set must actually pass — rather than asserting
 * that some spacing constant looks reasonable.
 */
/*
 * Models a REAL button user, not an oracle: she starts aiming straight at the
 * target, sees where it went, and corrects by `adaptRate` of the error she just
 * saw — exactly the learner in check 3 — except her aim is quantised to the
 * discrete pad. An oracle that aims perfectly from reach 1 would fail
 * `levelPassed` for the opposite reason (it requires improvement WITHIN the
 * block, and a player who is already perfect has none), which would have hidden
 * the resolution problem behind a simulation artefact.
 */
function simulateButtonUser(blocks, adaptRate = 0.6) {
  const aims = aimAngles();
  const reaches = [];
  let held = 0;
  blocks.forEach((block) => {
    const angles = targetAngles(block.targets);
    for (let i = 0; i < block.reaches; i++) {
      const tgt = angles[i % angles.length];
      const wanted = tgt - held;
      // nearest reachable aim to what she intends
      let aim = aims[0];
      for (const a of aims) {
        const d = Math.abs(((a - wanted + 540) % 360) - 180);
        const best = Math.abs(((aim - wanted + 540) % 360) - 180);
        if (d < best) aim = a;
      }
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

let padFails = 0;
{
  for (let lv = 1; lv <= LADDER_LEVELS; lv++) {
    const blocks = levelSchedule(lv);
    const sum = summarise(simulateButtonUser(blocks), blocks);
    if (!levelPassed(sum)) {
      padFails++;
      if (padFails <= 5) {
        const rot = blocks.find((b) => b.role === ROLE.ADAPT).rotation;
        push(`L${lv} (rot ${rot}°): the direction pad CANNOT pass this level `
          + `— best residual ${Math.abs(Math.round(sum.late))}°, needs ≤ ${HIT_DEG + 6}°`);
      }
    }
  }
}
if (padFails > 5) push(`…and ${padFails - 5} more levels unpassable with the direction pad`);

console.log(`validate-mirror: ${scheds} schedules, ${LADDER.length} bands simulated, `
  + `${LADDER_LEVELS} levels checked for control parity`);
if (problems.length) {
  console.error(`\nFAILED — ${problems.length} problem(s):`);
  problems.slice(0, 20).forEach((p) => console.error('  · ' + p));
  if (problems.length > 20) console.error(`  · …and ${problems.length - 20} more`);
  process.exit(1);
}
console.log('validate-mirror: OK');
