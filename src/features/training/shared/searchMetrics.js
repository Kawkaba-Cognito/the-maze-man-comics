/* =============================================================================
 * SEARCH ORGANISATION & SPATIAL BIAS
 *
 * HOW someone searched a cancellation board, as distinct from how much of it
 * they cleared. These are the second of the two factors this game reports, and
 * the evidence that they ARE two is the reason the module exists:
 *
 *   • Omissions and search organisation are statistically INDEPENDENT
 *     (Mark et al. 2004: r_s = -0.14, n.s., over 18 stroke patients).
 *   • Across 523 healthy adults, age predicted ~10% of variance in task
 *     DURATION at 0.59 s/year — and had minimal effect on the organisation
 *     measures (Dalmaijer et al., bioRxiv 307520).
 *
 * So the half a single score throws away is the half that barely ages. See
 * CANCELLATION-TASK-PLAN.md §2.1 and §3.3.
 *
 * Reference implementation for all of this is CancellationTools (Dalmaijer,
 * Van der Stigchel, Nijboer, Cornelissen & Husain, 2015, Behavior Research
 * Methods; PMC4636511). Equation numbers below are that paper's.
 *
 * ⚠ THIS FILE IS PLAIN .js AND MUST STAY THAT WAY, with explicit extensions on
 * any import it gains. The audit gates run in plain Node, which does not resolve
 * extensionless paths the way Vite does — dropping an extension here breaks the
 * GATES, not the app, which is the kind of failure that only shows up in CI.
 *
 * ⚠ Input positions are GRID coordinates ({row, col}), not pixels. Every board
 * this game deals is a uniform grid, so grid units are proportional to screen
 * units along each axis; using them keeps the measures comparable across the
 * 20-, 35- and 48-cell boards without carrying layout state around.
 * ========================================================================== */

/** Minimum cancellations before a spatial readout means anything.
 *
 * ⚠ NOT a tidiness threshold. Fixed Center-of-Cancellation cut-offs produce
 * false-positive rates "from 10% to 30% for R-L scores and from 10% to 90% for
 * CoC scores" depending on how many targets were cancelled in total (651 stroke
 * patients, JINS). The mechanism is obvious once stated: the mean of 6
 * positions is a very noisy estimate of a centre. Below this count the honest
 * output is null, not a number with a caveat next to it. */
export const MIN_CANCELLATIONS_SPATIAL = 8;

/** Minimum cancellations before an ORGANISATION readout means anything.
 * Lower than the spatial gate: best-r and the angle measure are defined on
 * consecutive pairs, so they stabilise sooner than a centroid does. */
export const MIN_CANCELLATIONS_ORG = 5;

const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);

export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 3) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

/** Do segments p1-p2 and p3-p4 properly cross? Standard orientation test. */
export function segmentsCross(p1, p2, p3, p4) {
  const o = (a, b, c) =>
    Math.sign((b.col - a.col) * (c.row - a.row) - (b.row - a.row) * (c.col - a.col));
  return o(p1, p2, p3) !== o(p1, p2, p4) && o(p3, p4, p1) !== o(p3, p4, p2);
}

const dist = (a, b) => Math.hypot(b.col - a.col, b.row - a.row);

/**
 * Standardised inter-cancellation distance (Dalmaijer et al. 2015).
 *
 *   mean(distance between consecutive cancellations)
 *   ────────────────────────────────────────────────
 *   mean(distance from each target to its NEAREST NEIGHBOUR)
 *
 * ⚠ THE NORMALISATION IS THE WHOLE POINT, and it is why the raw version from
 * Mark et al. (2004) is not used here. Our boards run 20, 35 and 48 cells, so a
 * raw mean distance is not comparable between them — it would report a bigger
 * board as less organised purely for being bigger. Dividing by the board's own
 * nearest-neighbour spacing makes it scale- and density-free.
 *
 * 1.0 means each move went to about the nearest available target. Higher means
 * jumping past near targets to reach far ones.
 *
 * ⚠ IT IS DENSITY-FREE, NOT WIDTH-FREE, AND THAT IS CORRECT BEHAVIOUR rather
 * than a residual artifact. Measured on plain row-major sweeps: 1.446 on a 3×5
 * board, 1.646 on a 6×8. The difference is the ROW WRAP — every time the sweep
 * finishes a row it travels the full width back, and a wider board makes that
 * jump longer. A boustrophedon over the same 3×5 board measures exactly 1.000,
 * because it never wraps.
 *
 * So this measure ranks a boustrophedon as more EFFICIENT than a row-major
 * sweep, which is simply true — it covers the same targets in less travel.
 * ⚠ That is why it is NOT part of `orgScore`: efficiency of travel and
 * tidiness of order are different claims, and averaging them would let a long
 * but perfectly systematic sweep be marked down for being long.
 */
export function standardisedDistance(seq, allTargets) {
  if (!Array.isArray(seq) || seq.length < 2) return null;
  const all = Array.isArray(allTargets) && allTargets.length >= 2 ? allTargets : seq;
  let step = 0;
  for (let i = 0; i < seq.length - 1; i++) step += dist(seq[i], seq[i + 1]);
  const meanStep = step / (seq.length - 1);

  const nn = [];
  for (let i = 0; i < all.length; i++) {
    let best = Infinity;
    for (let j = 0; j < all.length; j++) {
      if (i === j) continue;
      const d = dist(all[i], all[j]);
      if (d > 0 && d < best) best = d;
    }
    if (Number.isFinite(best)) nn.push(best);
  }
  const meanNN = mean(nn);
  if (!meanNN) return null;
  return +(meanStep / meanNN).toFixed(3);
}

/**
 * Spatial bias — Center of Cancellation (Rorden & Karnath 2010).
 *
 * Each target's position is normalised to [-1, +1] across the TARGET EXTENT
 * (leftmost target = -1, rightmost = +1; top = -1, bottom = +1), then averaged
 * over the CANCELLED targets only.
 *   cocH/cocV  0 = balanced, >0 = rightward/downward, <0 = leftward/upward.
 *              Deviates when omissions cluster on one side.
 *   scanLat    mean normalised x of the first quartile of found taps — which
 *              side the search STARTED on. Informative even on a full clear,
 *              where CoC just reflects the layout centroid (~0).
 *
 * ⚠ `scanLat` IS SCRIPT-DEPENDENT AND HAS NO NORM HERE. Literate readers of
 * left-to-right scripts start top-left; an Arabic reader should start top-RIGHT,
 * and there is no published Arabic-script normative data for cancellation. It
 * is computed because it is cheap and may be useful later; it must NOT be shown
 * to a user against an English-reader baseline. See CANCELLATION-TASK-PLAN.md §4.
 */
export function spatialBias(trials) {
  const hVals = [];
  const vVals = [];
  const latVals = [];
  let cancellations = 0;
  for (const t of trials || []) {
    const found = Array.isArray(t.foundSeq) ? t.foundSeq : [];
    const all = [...found, ...(Array.isArray(t.omitPos) ? t.omitPos : [])];
    if (!all.length || !found.length) continue;
    cancellations += found.length;
    const cols = all.map((p) => p.col);
    const rows = all.map((p) => p.row);
    const spanC = Math.max(...cols) - Math.min(...cols);
    const spanR = Math.max(...rows) - Math.min(...rows);
    const minC = Math.min(...cols);
    const minR = Math.min(...rows);
    if (spanC > 0) hVals.push(mean(found.map((p) => ((p.col - minC) / spanC) * 2 - 1)));
    if (spanR > 0) vVals.push(mean(found.map((p) => ((p.row - minR) / spanR) * 2 - 1)));
    if (found.length >= 4 && spanC > 0) {
      const q = Math.max(1, Math.round(found.length * 0.25));
      latVals.push(mean(found.slice(0, q).map((p) => ((p.col - minC) / spanC) * 2 - 1)));
    }
  }
  // Below the gate the honest answer is "not enough to say", not a noisy number.
  const enough = cancellations >= MIN_CANCELLATIONS_SPATIAL;
  return {
    cocH: enough && hVals.length ? +mean(hVals).toFixed(3) : null,
    cocV: enough && vVals.length ? +mean(vVals).toFixed(3) : null,
    scanLat: enough && latVals.length ? +mean(latVals).toFixed(3) : null,
    cancellations,
  };
}

/**
 * Search organisation, from the tap-ordered found positions.
 *
 *   bestR         max |Pearson r| between cancellation rank and column/row
 *                 (Mark et al. 2004, Eq. 9). 1 = a systematic sweep, 0 = chaos.
 *   intersectRate path self-crossings / cancellations (Eqs. 3-8). LOWER is more
 *                 organised. Published scale: ~0.2 neglect, ~0.1 non-neglect.
 *   orgAngle      mean |2*theta/90 - 1| over consecutive moves, theta in [0,90]
 *                 (Eqs. 10-11). 1 = axis-aligned, 0 = diagonal.
 *   stdDistance   see standardisedDistance above.
 *   orgScore      a 0-1 BLEND — see the warning below.
 *
 * ⚠ bestR AND orgAngle ARE BOTH REQUIRED, and neither substitutes for the
 * other. A boustrophedon sweep — left-to-right, then right-to-left on the next
 * row — is perfectly organised and scores a LOW horizontal r, because rank and
 * column are not monotonically related. The angle measure catches exactly that
 * case, since every move is still axis-aligned. Dropping either one makes a
 * genuinely tidy searcher look chaotic.
 *
 * ⚠ THE DENOMINATOR OF intersectRate DIFFERS FROM THE PAPER, DELIBERATELY.
 * Mark et al. divide by "markings made at sequentially different locations",
 * excluding immediate revisits so a perseverating patient is not flattered.
 * Here a cell LOCKS when tapped (`if (!c || c.tapped) return`), so a revisit is
 * not merely rare, it is impossible — the two denominators are identical on
 * this board. If cells ever stop locking, this must change.
 *
 * ⚠ `orgScore` IS NOT A PUBLISHED MEASURE. It is an equal-thirds blend of three
 * that are. It is fine as an internal summary and as the input to a band label,
 * but if it is ever shown to a user as a number, the UI must say it is this
 * app's own composite — not imply it is the literature's.
 */
export function searchOrganization(trials) {
  const rVals = [];
  const interVals = [];
  const angleVals = [];
  const distVals = [];
  let cancellations = 0;
  for (const t of trials || []) {
    const seq = Array.isArray(t.foundSeq) ? t.foundSeq : [];
    const n = seq.length;
    if (n < MIN_CANCELLATIONS_ORG) continue;
    cancellations += n;
    const ranks = seq.map((_, i) => i + 1);
    const rCol = pearson(ranks, seq.map((p) => p.col));
    const rRow = pearson(ranks, seq.map((p) => p.row));
    rVals.push(Math.max(Math.abs(rCol ?? 0), Math.abs(rRow ?? 0)));

    let crossings = 0;
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 2; j < n - 1; j++) {
        if (segmentsCross(seq[i], seq[i + 1], seq[j], seq[j + 1])) crossings++;
      }
    }
    interVals.push(crossings / n);

    let aSum = 0;
    let aCount = 0;
    for (let i = 0; i < n - 1; i++) {
      const dx = Math.abs(seq[i + 1].col - seq[i].col);
      const dy = Math.abs(seq[i + 1].row - seq[i].row);
      if (dx === 0 && dy === 0) continue;
      const theta = (Math.atan2(dy, dx) * 180) / Math.PI; // [0,90]
      aSum += Math.abs((2 * theta) / 90 - 1);
      aCount++;
    }
    if (aCount > 0) angleVals.push(aSum / aCount);

    const allTargets = [...seq, ...(Array.isArray(t.omitPos) ? t.omitPos : [])];
    const sd = standardisedDistance(seq, allTargets);
    if (sd != null) distVals.push(sd);
  }
  const br = rVals.length ? mean(rVals) : null;
  const inter = interVals.length ? mean(interVals) : null;
  const ang = angleVals.length ? mean(angleVals) : null;
  const sdist = distVals.length ? +mean(distVals).toFixed(3) : null;
  let orgScore = null;
  if (br != null && inter != null && ang != null) {
    orgScore = +((br + ang + Math.max(0, 1 - inter)) / 3).toFixed(3);
  }
  return {
    bestR: br != null ? +br.toFixed(3) : null,
    intersectRate: inter != null ? +inter.toFixed(3) : null,
    orgAngle: ang != null ? +ang.toFixed(3) : null,
    stdDistance: sdist,
    orgScore,
    cancellations,
  };
}

/**
 * Band for the organisation blend. Descriptive of the SEARCH PATH only — it
 * says nothing about the player, and nothing about how much they found.
 */
export function organisationBand(orgScore) {
  if (orgScore == null) return null;
  if (orgScore >= 0.72) return 'systematic';
  if (orgScore >= 0.55) return 'mixed';
  return 'scattered';
}
