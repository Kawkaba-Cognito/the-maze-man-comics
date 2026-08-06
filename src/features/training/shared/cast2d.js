import { assetUrl } from '../../../lib/assetUrl';

export const CAST_2D_IDS = ['kawkab', 'ramy', 'lola', 'mimi', 'star', 'fadi'];

/** Shared transparent 2D cast used by the Detective and Story Time games. */
export function cast2dUrl(id) {
  const safeId = CAST_2D_IDS.includes(id) ? id : 'kawkab';
  return assetUrl(`Assets/cast-2d-minimal-2026/${safeId}.webp`);
}
