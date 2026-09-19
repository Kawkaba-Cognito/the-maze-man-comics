import React, { useState } from 'react';
import { GAME_SCIENCE } from './gameScience';
import ScienceBrainPanel, { ScienceBrainChip } from './ScienceBrainPanel';

/**
 * Shared science link shown under the three modes on every game hub.
 *
 * ⚠ THE LABEL WAS "Why this trains your brain" UNTIL 2026-09-20, and it was the
 * one claim on the screen that nothing supported. It is the headline over a
 * panel whose own closing section now says, in both languages, that broad
 * transfer to everyday attention is debated in the literature (Simons et al.,
 * 2016) — so the title was asserting precisely what the body refutes.
 *
 * It is also the exact shape SCI-01 exists to catch: not a false sentence in
 * the prose, but a promise in the furniture. "Trains your brain" is the phrase
 * the FTC's Lumosity settlement was about.
 *
 * `gameScience.js` already titles every entry "The science" / «العلم وراء
 * اللعبة», so this now agrees with the content it opens instead of overselling
 * it. ⚠ Shared by all 18 games — changing it back changes it everywhere.
 */
export default function HubScienceLink({ gameId, isAr, playSfx, className = '' }) {
  const [open, setOpen] = useState(false);
  const entry = GAME_SCIENCE[gameId];
  if (!entry) return null;

  const c = isAr ? entry.ar : entry.en;
  const brainLabel = isAr ? 'العلم وراء اللعبة' : 'The science';

  return (
    <>
      <ScienceBrainChip
        className={className}
        label={`ⓘ ${brainLabel}`}
        onClick={() => {
          playSfx?.('click');
          setOpen(true);
        }}
      />
      <ScienceBrainPanel
        open={open}
        onClose={() => setOpen(false)}
        title={brainLabel}
        intro={c.intro}
        sections={c.sections}
        foot={c.foot}
        isAr={isAr}
        playSfx={playSfx}
      />
    </>
  );
}
