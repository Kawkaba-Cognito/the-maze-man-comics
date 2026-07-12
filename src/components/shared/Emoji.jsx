import React from 'react';
import { assetUrl } from '../../lib/assetUrl';

/*
 * Renders a native emoji character as a bundled Twemoji SVG (CC-BY 4.0,
 * https://github.com/jdecked/twemoji — credit lives in the About screen)
 * instead of the OS's own emoji font, so the same glyph looks identical on
 * Windows/iOS/Android instead of three different art styles.
 *
 * Only a curated subset is bundled (see BUNDLED below) — anything not in that
 * set falls back to rendering the native character, so this is always safe
 * to wrap around existing emoji strings incrementally, file by file.
 */
const BUNDLED = new Set([
  '2b50', '1f431', '1f3c6', '1f916', '1f48c', '2602', '1f330', '1f33b', '1f436', '2600',
  '1f382', '1f388', '1fa81', '1f331', '2601', '1f327', '1f308', '1f34b', '1f5bc', '1f392',
  '26fa', '1f525', '1f5fa', '1f4e6', '1f345', '1fa9c', '2728', '26c4', '1f30b', '1f41a',
  '1fad9', '1f426', '1fab5', '1f3ee', '1f981', '1f3ad', '1f490', '1f33f', '1f315', '1f31f',
  '1f680', '1fa90', '1f3e0', '1fa9f', '1f6cb', '1fab4', '1f6b8', '1f333', '1f6a6', '1f3eb',
  '1f6a9', '1f4da', '1f7e9', '1f550', '1fa91', '1f373', '1f34e', '1f9fa', '1f337', '1f98b',
  '26bd', '1f3d6', '1f334', '26f1', '1f30a', '1f3ca', '1f6df', '1f4a6', '1f3fa', '1f5ff',
  '1f4d6', '1fa94', '1f30c', '1f319', '2604', '1f3a4', '1faa9', '1f3b6', '1f526', '1f6cf',
  '1f9f8', '1f3d8', '1f6b6', '1f44b', '1f917', '1f4a1', '1f4ac', '1f50d', '1f91d', '1f528',
  '1f354', '1f4d5', '1f4af', '1f3a8', '1f381', '1f389', '1f634', '1f4a8', '1f495', '2757',
  '1f9f1', '2668', '1f3b5', '1f38a', '1f4a4', '23f1', '1f4cd', '1f642', '26a1', '1f9fd',
]);

/** Twemoji SVG filenames drop the U+FE0F variation selector. */
function toCodepoint(char) {
  return [...char]
    .map((c) => c.codePointAt(0))
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16))
    .join('-');
}

/**
 * Drop-in replacement for rendering a raw emoji character, e.g.
 * `<Emoji char="⭐" />` instead of `⭐`. Falls back to the native glyph
 * (still correct, just not consistent) when the char isn't bundled yet.
 */
export default function Emoji({ char, size = '1em', className, style, label }) {
  const cp = toCodepoint(char);
  if (BUNDLED.has(cp)) {
    return (
      <img
        src={assetUrl(`Assets/emoji/${cp}.svg`)}
        alt={label ?? char}
        draggable={false}
        className={className}
        style={{ width: size, height: size, display: 'inline-block', verticalAlign: '-0.15em', ...style }}
      />
    );
  }
  return (
    <span className={className} style={style} role="img" aria-label={label ?? char}>
      {char}
    </span>
  );
}
