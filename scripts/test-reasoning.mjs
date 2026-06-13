import { createServer } from 'vite';
const server = await createServer({ appType: 'custom', server: { middlewareMode: true }, logLevel: 'error' });
const base = '/src/features/training/domains/reasoning/games';
const R = await server.ssrLoadModule(`${base}/raven-matrices/ravenEngine.js`);
const RD = await server.ssrLoadModule(`${base}/raven-matrices/ravenData.js`);
const RT = await server.ssrLoadModule(`${base}/raven-matrices/tutorialScript.js`);
const fail = [];
const ck = (cond, msg) => { if (!cond) fail.push(msg); };

try {
  // ── Raven engine ──
  for (let level = 0; level <= 14; level++) for (let s = 0; s < 120; s++) {
    const p = R.generateMatrix(level, 1000 + level * 1000 + s);
    ck(p.options.length === p.optionCount, `raven L${level}: option count`);
    ck(p.correctIndex >= 0 && p.correctIndex < p.optionCount, `raven L${level}: correctIndex range`);
    ck(R.figureEq(p.options[p.correctIndex], p.answer), `raven L${level}: correctIndex matches answer`);
    ck(R.figureEq(p.answer, p.grid[2][2]), `raven L${level}: answer = grid[2][2]`);
    ck(p.options.filter((o) => R.figureEq(o, p.answer)).length === 1, `raven L${level}: exactly one correct`);
  }
  const a1 = R.generateMatrix(5, 777), a2 = R.generateMatrix(5, 777);
  ck(a1.correctIndex === a2.correctIndex && R.figureEq(a1.answer, a2.answer), 'raven: seed not deterministic');

  // ── Raven data/modes ──
  for (const diff of RD.RV_DIFF_KEYS) {
    for (let lv = 1; lv <= RD.RV_LEVELS_PER_TIER; lv++) {
      const spec = RD.ravenLevelSpec(diff, lv);
      ck(spec.trials > 0 && spec.targetCorrect <= spec.trials && spec.genLevel >= 0, `raven spec ${diff}-${lv}`);
      ck(RD.gradeRaven(spec.trials, spec.trials).won && RD.gradeRaven(spec.trials, spec.trials).stars === 3, `raven grade perfect ${diff}-${lv}`);
      ck(!RD.gradeRaven(spec.targetCorrect - 1, spec.trials).won, `raven grade below-target should lose ${diff}-${lv}`);
      ck(RD.gradeRaven(spec.targetCorrect, spec.trials).won, `raven grade at-target should win ${diff}-${lv}`);
    }
    ck(RD.isRavenLevelUnlocked(diff, 1, {}), `raven lv1 unlocked`);
    ck(!RD.isRavenLevelUnlocked(diff, 2, {}), `raven lv2 locked`);
    ck(RD.isRavenLevelUnlocked(diff, 2, { [`${diff}-1`]: true }), `raven lv2 unlock after lv1`);
    const cs = RD.ravenChallengeSpec(diff);
    ck(cs.trials > 0 && cs.genLevel >= 0, `raven challenge spec ${diff}`);
  }
  for (const ar of [false, true]) {
    const steps = RT.buildRavenCoachSteps(ar, { gridRef: {}, optionsRef: {} });
    ck(steps.length >= 3 && steps.some((s) => s.gate === 'event' && s.event === 'answer'), `raven tutorial steps ${ar}`);
    ck(steps[steps.length - 1].last === true, `raven tutorial last flag ${ar}`);
  }
  console.log('Raven: engine + level/challenge specs + grading + unlock + tutorial OK');

  console.log(fail.length ? `\n✗ ${fail.length} FAILURES:\n` + fail.slice(0, 25).join('\n') : '\n✓ ALL RAVEN TESTS PASSED');
} finally { await server.close(); }
