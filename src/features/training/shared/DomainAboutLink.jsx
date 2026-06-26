import React, { useState } from 'react';
import { DOMAIN_SCIENCE } from './domainScience';
import ScienceBrainPanel, { ScienceBrainChip } from './ScienceBrainPanel';

/** Domain-level science chip on the 6 domain pick screens — same panel as game hubs. */
export default function DomainAboutLink({ domainId, isAr, playSfx }) {
  const [open, setOpen] = useState(false);
  const entry = DOMAIN_SCIENCE[domainId];
  if (!entry) return null;

  const c = isAr ? entry.ar : entry.en;
  const title = isAr ? `لماذا تدرّب ${c.domainLabel}؟` : `Why train ${c.domainLabel}?`;

  return (
    <>
      <ScienceBrainChip
        className="ct-domain-pick-about-link"
        label={`ⓘ ${title}`}
        onClick={() => {
          playSfx?.('click');
          setOpen(true);
        }}
      />
      <ScienceBrainPanel
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        intro={c.intro}
        sections={c.sections}
        foot={c.foot}
        isAr={isAr}
        playSfx={playSfx}
      />
    </>
  );
}
