/*
 * LEGACY COMPAT LAYER for the training data spine.
 *
 * The source of truth lives in `src/features/training/`. This file reshapes
 * those configs into the historical export shape (`DOMAINS`, `DOMAIN_COLOR`,
 * `DOMAIN_ABOUT`, `PALETTE`) so existing consumers keep working without
 * touching their imports. New code should import directly from
 * `features/training/registry`.
 *
 * Slated to be removed in a future step once consumers (RadialMazeHub,
 * ShrinePage, ComicsScreen, CancellationTaskGame, EchoMazeGame) are migrated.
 */

import { DOMAIN_CONFIGS } from '../../features/training/registry';

export { PALETTE } from '../../features/training/shared/palette';

export const DOMAIN_COLOR = Object.fromEntries(
  DOMAIN_CONFIGS.map((d) => [d.id, d.color])
);

export const DOMAINS = DOMAIN_CONFIGS.map((d) => ({
  id: d.id,
  name: d.name,
  short: d.short,
  desc: d.desc,
  glyph: d.glyph,
  subs: d.subs.map((s) => ({
    id: s.id,
    name: s.name,
    nameAr: s.nameAr,
    blurb: s.blurb,
    blurbAr: s.blurbAr,
    games: s.gameCount ?? 1,
    progress: s.progress ?? 0,
    ...(s.gameKey ? { game: s.gameKey } : {}),
  })),
}));

export const DOMAIN_ABOUT = Object.fromEntries(
  DOMAIN_CONFIGS.filter((d) => d.about).map((d) => [d.id, d.about])
);
