/*
 * TRAINING REGISTRY
 *
 * The ONE place that knows what cognitive domains and games exist.
 * Adding a new domain or game = create its folder + config, then add it here.
 *
 * Consumers:
 *   - features/training/TrainingHub (the radial hub)        — reads DOMAIN_CONFIGS
 *   - features/comics/ComicsScreen (the routing screen)     — reads playable games
 *   - components/training/trainingData (legacy compat)      — reshapes for old shape
 *
 * Per ARCHITECTURE.md, this is the spine of the training feature. Don't reach
 * into individual `domain.config.js` files from outside the registry — go
 * through these helpers so we keep one source of truth.
 */

import attention   from './domains/attention/domain.config';
import speed       from './domains/speed/domain.config';
import memory      from './domains/memory/domain.config';
import language    from './domains/language/domain.config';
import reasoning   from './domains/reasoning/domain.config';
import flexibility from './domains/flexibility/domain.config';

/** Order matters — used by the radial hub's shrine layout (top row, bottom row, etc.). */
export const DOMAIN_CONFIGS = [
  attention,
  speed,
  memory,
  language,
  reasoning,
  flexibility,
];

export const DOMAINS_BY_ID = Object.fromEntries(
  DOMAIN_CONFIGS.map((d) => [d.id, d])
);

export function getDomain(id) {
  return DOMAINS_BY_ID[id];
}

export function getSub(domainId, subId) {
  return getDomain(domainId)?.subs.find((s) => s.id === subId);
}

/** Subs that have a wired game component (`gameKey`). The hub uses this to know
 *  which arches lead to a real game vs a "coming soon" placeholder. */
export function getPlayableSubs(domainId) {
  return getDomain(domainId)?.subs.filter((s) => s.gameKey) ?? [];
}

/** Quick helpers for the (future) entitlements layer. */
export function isFree(sub) {
  return !sub || sub.tier === 'free' || sub.tier == null;
}

export function isPro(sub) {
  return sub?.tier === 'pro';
}
