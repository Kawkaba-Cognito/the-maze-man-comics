import React from 'react';
import { assetUrl } from '../../lib/assetUrl';
import '../../styles/trainingHubPremium.css';

/** Kawkab, cut off the plate of the source artwork (transparent WebP, 640px). */
const KAWKAB_URL = assetUrl('Assets/characters/kawkab/kawkab-planet.webp');

/**
 * Kawkab at the Training hub centre — the clickable way into the assessment.
 *
 * Replaces TrainingBlueRobot3D. That version pulled three.js, GLTFLoader and a
 * 1.7 MB GLB onto the hub to draw one small still character; this is a 130 KB
 * image, so the hub no longer loads a 3D stack at all.
 *
 * The badge markup and its `training-blue-robot__badge*` class names are kept
 * verbatim — they are styled in trainingHubPremium.css and renaming them here
 * would be a cosmetic change that silently drops the styling.
 */
/**
 * Neutral stance: arms down, legs vertical. The cut art is 755x869, so the
 * character is TALLER than it is wide — the opposite of the earlier arms-out
 * pose, and the reason the stage box is derived rather than hard-coded.
 */
const ASPECT = 755 / 869;

export default function TrainingHubMascot({ size = 150, onActivate, isAr, label }) {
  return (
    <div
      /* Deliberately NOT `kawkab-stage`: that class paints a dark purple disc
         behind the character (global.css `.kawkab-stage::before`, switched on
         in the light/dusk themes). It backed the opaque robot; behind a
         translucent glowing planet it reads as a dark slab cutting through the
         legs, and Kawkab carries its own halo. */
      className="training-hub-mascot"
      role="button"
      tabIndex={0}
      aria-label={label || (isAr ? 'ابدأ التقييم' : 'Start assessment')}
      onClick={onActivate}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate?.();
        }
      }}
      style={{
        position: 'relative',
        width: size,
        height: Math.round(size / ASPECT),
        cursor: 'pointer',
        pointerEvents: 'auto',
        touchAction: 'manipulation',
      }}
    >
      <img
        src={KAWKAB_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="training-hub-mascot__art"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      <span
        className="training-blue-robot__badge"
        aria-hidden="true"
        lang={isAr ? 'ar' : 'en'}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <span className="training-blue-robot__badge-kicker">
          {isAr ? 'الملف المعرفي' : 'COGNITIVE PROFILE'}
        </span>
        <span className="training-blue-robot__badge-label">{isAr ? 'التقييم' : 'Assessment'}</span>
      </span>
    </div>
  );
}
