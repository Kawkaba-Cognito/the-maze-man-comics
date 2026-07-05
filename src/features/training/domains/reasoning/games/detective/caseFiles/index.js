/*
 * Detective — CASE FILES aggregator.
 *
 * Multi-act investigations (3 acts + prologue + epilogue) starring Detective
 * Kawkab and a rotating assistant. Used by LEVELS mode (long story per level).
 * The quick one-shot riddles in ../cases.js still power Survival & Pass n Play.
 *
 * 9 cases: 3 per difficulty tier. A faint thread — the "Grey Fox" who leaves a
 * folded grey paper fox — is seeded in two tier-3 cases and resolved in the last.
 */
import { TIER1 } from './tier1';
import { TIER2 } from './tier2';
import { TIER3 } from './tier3';

// Indexed by difficulty tier (1/2/3). Levels mode maps easy/med/hard → tier.
export const CASE_FILES_BY_TIER = [TIER1, TIER2, TIER3];

export const ALL_CASE_FILES = [...TIER1, ...TIER2, ...TIER3];
