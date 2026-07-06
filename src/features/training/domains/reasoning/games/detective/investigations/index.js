/*
 * Detective Kawkab — INVESTIGATIONS: free-form deduction cases.
 *
 * The player IS the detective: search the scene, interrogate suspects,
 * confront them with evidence, and accuse only when ready. No step-by-step
 * questions — one final accusation: WHO did it + WHICH clue(s) prove it.
 *
 * Schema (all display text bilingual {en, ar}):
 *   id, tier          1 easy · 2 medium · 3 hard
 *   e                 case icon
 *   title, setting    setting = the scene board's name
 *   bg                [c1, c2] scene gradient colours
 *   assistant         { e, name } — Detective Kawkab's sidekick (optional)
 *   briefing          prologue text shown on the case-file card
 *   hotspots          [{ id, e, name, pos:{x,y} (%), clueId | empty }]
 *                     clueId → searching finds that clue; empty → flavour text
 *   clues             [{ id, e, name, text }] — notebook entries. Clues found
 *                     from hotspots group as EVIDENCE, clues given by dialogue
 *                     group as TESTIMONY. Red herrings are simply clues that
 *                     are not in solution.evidence.
 *   suspects          [{ id, e, name, role, questions }] — accusable
 *   witnesses         same shape, NOT accusable (optional)
 *     questions       [{ id, q, a, givesClue?, needsClue?, reaction? }]
 *                     needsClue → a CONFRONTATION: hidden until that clue is
 *                     in the notebook. givesClue → the answer logs a clue.
 *                     reaction → extra flavour bubble after the answer.
 *   solution          { culprit, evidence:[clueIds], explanation:[{en,ar}],
 *                       epilogue }
 *                     evidence = the proving clue(s): 1 in tier 1 → 2 in tier 3.
 *
 * Design rules: every solution must be airtight from findable clues; innocent
 * suspects may hide small SECRETS (a lie is not proof of guilt — the lie about
 * the crime is). No religion, no politics.
 */
import { INV_TIER1 } from './tier1';
import { INV_TIER2 } from './tier2';
import { INV_TIER3 } from './tier3';
import { QUICK1 } from './quick1';
import { QUICK2 } from './quick2';
import { QUICK3 } from './quick3';

// Full cases (LEVELS mode), indexed by difficulty tier.
export const FULL_BY_TIER = [INV_TIER1, INV_TIER2, INV_TIER3];

// Compact cases (SURVIVAL / PASS-N-PLAY), indexed by escalation tier.
export const QUICK_BY_TIER = [QUICK1, QUICK2, QUICK3];
