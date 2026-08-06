/*
 * Noir case schema — Detective Kawkab, Survival.
 *
 * The shape is built around one idea borrowed from the reference game: a
 * suspect does not simply answer questions, they state a LIE, and the player
 * has to hold up the one piece of evidence that breaks it. Everything else
 * (quirk hotspots, chained testimony, the four-axis accusation) exists to make
 * that moment land.
 *
 * Every suspect id maps to one of the shared illustrated cast characters on
 * the interrogation stage.
 *
 *   {
 *     id, e, title, setting, stamp,      // stamp = case-file header line
 *     victim: { line, sub },             // the "what happened" card on the board
 *     intro:  [Line],                    // opening cutscene
 *     hotspots: [Hotspot],
 *     clues:  { [id]: Clue },
 *     testimony: { [id]: { name, desc } },
 *     suspects: [Suspect],
 *     board:  { how: [Option], why: [Option] },
 *     solution: { who, how, why, proof },
 *     ending: [Line],
 *   }
 *
 *   Line     { w: 'kawkab' | 'n' | <suspectId>, t: T }
 *   Hotspot  { id, e, name: T, pos: {x,y}, clue?: string, quirk?: [Line[]] }
 *   Clue     { e, name: T, desc: T, narr: T }
 *   Suspect  { id, role: T, desc: T, accent, qs: [{q,a}], lies: [Lie], wrong }
 *   Lie      { claim: T, needs: clueId|testimonyId, hint: T, seq: [Line],
 *              unlocks?: testimonyId, react?: actionName }
 *
 * T is always { en, ar } — there is no i18n framework here, every string is
 * carried inline (see CLAUDE.md).
 *
 * `needs` may name a TESTIMONY id rather than a clue: that is how a case
 * chains, forcing the player to break one suspect before another becomes
 * crackable.
 */

/** Pick the localised half of a { en, ar } pair. */
export const L = (v, isAr) => (typeof v === 'string' ? v : (v?.[isAr ? 'ar' : 'en'] ?? ''));

/** Every lie in the case, flattened — the run's completion target. */
export function allLies(caseData) {
  return caseData.suspects.flatMap((s) => s.lies.map((lie) => ({ sid: s.id, lie })));
}

export const lieCount = (caseData) => allLies(caseData).length;

/** Clue ids a case expects the player to physically find in the scene. */
export function sceneClueIds(caseData) {
  return caseData.hotspots.filter((h) => h.clue).map((h) => h.clue);
}

/**
 * Accusation options. `who` is derived from the cast on stage and `proof` from
 * what the player actually collected, so neither can be authored out of sync
 * with the rest of the case.
 */
export function boardOptions(caseData, foundClueIds) {
  return {
    who: caseData.suspects.map((s) => ({ v: s.id, l: s.name, c: s.accent })),
    how: caseData.board.how,
    why: caseData.board.why,
    proof: foundClueIds.map((id) => ({ v: id, l: caseData.clues[id].name, e: caseData.clues[id].e })),
  };
}

/** Which axis is wrong — drives the targeted "not good enough" feedback. */
export function accusationFault(caseData, acc) {
  const s = caseData.solution;
  if (acc.who !== s.who) return 'who';
  if (acc.how !== s.how) return 'how';
  if (acc.why !== s.why) return 'why';
  if (acc.proof !== s.proof) return 'proof';
  return null;
}

export const isSolved = (caseData, acc) => accusationFault(caseData, acc) === null;
