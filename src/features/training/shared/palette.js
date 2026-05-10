/*
 * Training palette — derived from `styles/tokens`.
 *
 * Single shared shape used by all training games (currently Cancellation,
 * Rush Hour, Echo Maze) and the training hub/shrine. Adding a new game?
 * Import { PALETTE } from this file rather than redefining colors.
 */

import { tokens } from '../../../styles/tokens';

export const PALETTE = {
  bg: tokens.bgShrine,
  text: tokens.text,
  muted: tokens.textMuted,
  accent: tokens.amber,
  rune: tokens.domain.memory,
  card: tokens.stoneMid,
  cardDeep: tokens.stoneDeep,
  cardBorder: tokens.stoneEdge,
};
