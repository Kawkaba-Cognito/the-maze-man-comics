import React from 'react';
import { assetUrl } from '../../../lib/assetUrl';

/*
 * KawkabSprite — the mascot, as a picture.
 *
 * One 86 KB WebP of the black planet: the same character the Training hub puts
 * at its centre, so every screen showing "Kawkab" shows the same Kawkab.
 *
 * ── Why this exists ──
 * The games had three different ways of drawing him, none of them cheap:
 *
 *   AssessmentMascot3D   a WebGL canvas + Assets/biped-v1.glb (3.4 MB)
 *   drKawkabModel        the same GLB, loaded directly
 *   CosmosCharacter      2D, but a different character (kawkab-idle.png, the
 *                        old sprite) with its own moods and poses
 *
 * So a player could meet three unrelated mascots in one session, and a small
 * badge in the corner of a word game was pulling three megabytes and a renderer
 * to draw itself. The GLB made sense while the hub was 3D; it stopped making
 * sense the moment the hub became a 2D planet, and nothing went back to check.
 *
 * ── What this deliberately does NOT do ──
 * No moods, no poses, no animation clips. The artwork is a single image and
 * pretending otherwise is how the old sprite ended up with a `pose="cheer"` that
 * silently did nothing on half its callers. Motion belongs in CSS on the
 * wrapper, where the caller can see it.
 */
export default function KawkabSprite({
  size = 64,
  className = '',
  style,
  alt = '',
  ariaHidden = true,
}) {
  return (
    <img
      className={`kawkab-sprite clay-emblem-sprite${className ? ` ${className}` : ''}`}
      src={assetUrl('Assets/brand/clay-2026/brand-emblem.webp')}
      alt={alt}
      aria-hidden={ariaHidden || !alt ? 'true' : undefined}
      draggable={false}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        objectFit: 'cover',
        borderRadius: '50%',
        border: '1.5px solid rgba(27, 31, 36, 0.1)',
        boxShadow: '0 4px 12px rgba(27, 31, 36, 0.1)',
        userSelect: 'none',
        ...style,
      }}
    />
  );
}
