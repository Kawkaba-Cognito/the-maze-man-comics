import React, { useState } from 'react';
import { L } from '../schema';

/*
 * The case notebook. Unfound clues stay listed but blanked out, so the player
 * always knows how much of the scene is still hiding something.
 */
export default function Notebook({
  caseData, isAr, t, found, testimony, liesDone, lieTotal, mistakes, onClose,
}) {
  const [tab, setTab] = useState('evidence');
  const clueIds = Object.keys(caseData.clues);
  const testimonyIds = Object.keys(caseData.testimony || {});

  return (
    <aside className="nr-nb">
      <header>
        <h3>{t.nbTitle}</h3>
        <button type="button" className="nr-chip" onClick={onClose} aria-label={t.menu}>✕</button>
      </header>
      <div className="nr-nb-tabs">
        <button
          type="button"
          className={tab === 'evidence' ? 'on' : ''}
          onClick={() => setTab('evidence')}
        >
          {t.tabEvidence}
        </button>
        <button
          type="button"
          className={tab === 'statements' ? 'on' : ''}
          onClick={() => setTab('statements')}
        >
          {t.tabStatements}
        </button>
      </div>

      <div className="nr-nb-body">
        {tab === 'evidence' && clueIds.map((id) => {
          const clue = caseData.clues[id];
          const has = found.includes(id);
          return (
            <div key={id} className={`nr-nb-card${has ? '' : ' unk'}`}>
              <span className="nr-nb-e" aria-hidden="true">{has ? clue.e : '?'}</span>
              <div>
                <b>{has ? L(clue.name, isAr) : '— — —'}</b>
                <span>{has ? L(clue.desc, isAr) : t.notFound}</span>
              </div>
            </div>
          );
        })}

        {tab === 'statements' && testimonyIds.map((id) => {
          const item = caseData.testimony[id];
          const has = testimony.includes(id);
          return (
            <div key={id} className={`nr-nb-card${has ? '' : ' unk'}`}>
              <span className="nr-nb-e" aria-hidden="true">🗣</span>
              <div>
                <b>{has ? L(item.name, isAr) : '— — —'}</b>
                <span>{has ? L(item.desc, isAr) : t.noStatement}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="nr-nb-foot nr-mono">
        {t.progress(found.length, clueIds.length, liesDone, lieTotal, mistakes)}
      </div>
    </aside>
  );
}
