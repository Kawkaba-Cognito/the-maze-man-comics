import React from 'react';
import '../../../styles/attentionHeaderProtos.css';

/**
 * TEMPORARY — the chosen Attention domain-pick header redesign: the word
 * "Attention" itself rendered as a thick glass-slab bevel, with the
 * description in a refined frosted panel. Everything below (exercise cards,
 * GamePlanetScene, DomainAboutLink) is untouched and lives in
 * ComicsScreen.jsx. Delete this file + attentionHeaderProtos.css + its
 * import/usage in ComicsScreen.jsx if this direction is ever reverted.
 */
export function GlassBevel({ domainName, domainTag, domainDesc }) {
  return (
    <div className="ahp ahp--bevel">
      <span className="ahv-tag">{domainTag}</span>
      <h1 className="ahv-title">{domainName}</h1>
      <span className="ahv-rule" aria-hidden="true" />
      {domainDesc ? <p className="ahv-desc">{domainDesc}</p> : null}
    </div>
  );
}
