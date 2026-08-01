import React, { useEffect, useRef, useState } from 'react';
import { getCastPortrait } from './castPortraitBake';
import { SUSPECT_IDS, CAST } from './castRoster';

/*
 * <CastPortrait> — one cast member's face, for DOM lists.
 *
 * See castPortrait.js for why this is a baked <img> and not a live canvas.
 * Falls back to whatever `fallback` the caller passes (Detective's cases still
 * carry their original emoji) if WebGL is unavailable or the GLB fails, so a
 * portrait never becomes an empty hole in a case file.
 */

/**
 * Pick a cast rig for an arbitrary character id, stably.
 *
 * Detective's investigations were authored with their own named people (Dina,
 * Sami, Adel...) and no 3D identity, so somebody has to decide which of the
 * five suspect rigs stands in. Two rules make that not look random:
 *   - deterministic, so the same person is the same face on every visit;
 *   - de-duplicated WITHIN a case, so one line-up is never two identical faces.
 *
 * @param {string} personId
 * @param {string[]} [casePeopleIds] every person in this case, in order
 * @returns {string} a cast id
 */
export function castIdFor(personId, casePeopleIds) {
  const pool = SUSPECT_IDS;
  if (Array.isArray(casePeopleIds) && casePeopleIds.length) {
    const index = casePeopleIds.indexOf(personId);
    if (index >= 0) return pool[index % pool.length];
  }
  let hash = 0;
  const s = String(personId || '');
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

export default function CastPortrait({
  castId, size = 56, turn = 0, fallback = '', alt = '', style,
}) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    if (!castId || !CAST[castId]) { setFailed(true); return undefined; }
    // Bake at 2x so the portrait stays crisp on a retina panel, then let CSS
    // size it down.
    getCastPortrait(castId, { size: Math.round(size * 2), turn })
      .then((u) => { if (aliveRef.current) { if (u) setUrl(u); else setFailed(true); } })
      .catch(() => { if (aliveRef.current) setFailed(true); });
    return () => { aliveRef.current = false; };
  }, [castId, size, turn]);

  const box = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: '50%',
    display: 'grid',
    placeItems: 'center',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #f4f8fc 0%, #dbe6f0 100%)',
    border: '1.5px solid rgba(19, 30, 40, 0.16)',
    fontSize: Math.round(size * 0.52),
    lineHeight: 1,
    ...style,
  };

  if (url && !failed) {
    return (
      <span style={box} aria-hidden={alt ? undefined : true}>
        <img
          src={url}
          alt={alt}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
        />
      </span>
    );
  }
  // Pre-bake and hard-failure both show the caller's emoji, so the row never
  // collapses or flashes an empty circle.
  return <span style={box} aria-hidden="true">{fallback}</span>;
}
