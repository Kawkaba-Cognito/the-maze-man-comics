import React, { useMemo } from 'react';
import { DOMAIN_CONFIGS } from '../training/registry.js';
import { domainRating, ratingBand } from '../training/rating.js';

/*
 * A real number for each of the six cognitive domains, on Home.
 *
 * Replaces the 3D universe as the thing Home leads with. `domainRating(id)`
 * is the same EWMA-over-games rating Training's own per-game screens already
 * show — nothing new is computed here, this is the existing number given a
 * place a returning user actually looks. Ratings run roughly 0-1000 (see
 * RATING_BANDS in rating.js); the bar is `rating / 10` clamped to 100%.
 *
 * A domain with no games played yet returns null from domainRating() and
 * renders as an empty outline rather than a zero bar — zero would say
 * "you're bad at this", null correctly says "no data yet".
 *
 * Returns null (renders nothing) when every domain is null — the same
 * new-user honesty ProgressCard and the old sky heading already use: no
 * empty-state filler, the section simply doesn't exist yet.
 */

const UI = {
  en: { title: 'Your domains', noData: 'Not started' },
  ar: { title: 'مجالاتك', noData: 'لم تبدأ بعد' },
};

export default function DomainSnapshot({ isAr, playSfx, onOpenDomain }) {
  const t = isAr ? UI.ar : UI.en;

  const rows = useMemo(() => DOMAIN_CONFIGS.map((d) => {
    const rating = domainRating(d.id);
    const band = rating != null ? ratingBand(rating) : null;
    return {
      id: d.id,
      name: isAr ? d.nameAr : d.name,
      rating,
      pct: rating != null ? Math.min(100, rating / 10) : 0,
      band,
    };
  }), [isAr]);

  if (!rows.some((r) => r.rating != null)) return null;

  return (
    <section className="ds" aria-label={t.title}>
      <button
        type="button"
        className="ds-head"
        onClick={() => { playSfx?.('click'); onOpenDomain?.(); }}
      >
        {t.title}
      </button>
      <div className="ds-rows">
        {rows.map((r) => (
          <button
            key={r.id}
            type="button"
            className="ds-row"
            onClick={() => { playSfx?.('click'); onOpenDomain?.(r.id); }}
          >
            <span className="ds-row-name">{r.name}</span>
            <span className="ds-row-track">
              <span
                className="ds-row-fill"
                style={{
                  width: `${r.pct}%`,
                  background: r.rating != null
                    ? `var(--color-domain-${r.id})`
                    : 'transparent',
                }}
              />
            </span>
            <span className="ds-row-band" style={r.band ? { color: r.band.color } : undefined}>
              {r.band ? (isAr ? r.band.ar : r.band.en) : t.noData}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
