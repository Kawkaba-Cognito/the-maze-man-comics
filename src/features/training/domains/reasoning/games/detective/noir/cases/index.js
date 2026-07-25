import { OBSERVATORY } from './observatory';
import { ENCORE } from './encore';
import { LONG_RAIN } from './longRain';

/*
 * The noir case rotation, easiest first.
 *
 * Survival walks up this list as the player solves cases and drops back down
 * when they lose a life, so tier order here IS the difficulty curve. Every
 * suspect id must be a cast id from castModels.js — `npm run validate:noir`
 * enforces that, along with the rest of the case wiring.
 */
export const NOIR_CASES = [OBSERVATORY, ENCORE, LONG_RAIN];

export const NOIR_BY_TIER = [
  NOIR_CASES.filter((c) => c.tier === 1),
  NOIR_CASES.filter((c) => c.tier === 2),
  NOIR_CASES.filter((c) => c.tier === 3),
];

export const caseById = (id) => NOIR_CASES.find((c) => c.id === id) || null;
