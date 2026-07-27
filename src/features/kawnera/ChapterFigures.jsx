import React from 'react';

/*
 * Figures for authored chapters — inline SVG, no dependencies.
 *
 * WHY THESE FORMS
 * ---------------
 * Dual coding is real: words plus a picture beat words alone. But only when the
 * picture CARRIES information. A decorative diagram costs attention and buys
 * nothing, and in a learning product that is a straight loss.
 *
 * So the form was picked from the data's job, before any colour:
 *
 *   Compare  emphasis bars — ONE value is the point, the other is context.
 *            Most findings in this book are of that shape ("high school
 *            graduates read emotions better than college graduates"), and
 *            emphasis says that far better than two equal categorical hues,
 *            which would bury the surprise by treating both as equals.
 *   Steps    a numbered procedure. Experiment designs are sequences, not
 *            quantities; a bar chart of a method would be nonsense.
 *   Gap      a timeline with the interval called out. The whole point of the
 *            infancy chapter is the DISTANCE between two ages.
 *   Contrast a two-column can/cannot. The minimal-mindreading concepts are
 *            defined by their signature limits, so the limit is the content.
 *
 * COLOUR
 * ------
 * One data hue plus a de-emphasis gray, validated rather than eyeballed
 * (dataviz `validate_palette.js`): accent↔gray separates at ΔE 19.8 protan /
 * 18.1 tritan / 22.5 normal, comfortably above the 8 threshold. The gray trips
 * the contrast check at 2.47:1, which obliges visible labels — so every mark is
 * directly labelled, and no figure depends on colour alone.
 *
 * Blue deliberately: green and red already mean correct/wrong elsewhere in
 * Kawnera, and gold is Dr. Kawkab. A data mark must not borrow those.
 */
const INK = '#1d6fb8'; // the value that is the point
const MUTE = '#9aa5a1'; // context
const RULE = '#d5d0c3';

function Frame({ caption, source, children }) {
  return (
    <figure className="cfig">
      {children}
      <figcaption>
        <p>{caption}</p>
        {source && <small>{source}</small>}
      </figcaption>
    </figure>
  );
}

/**
 * Emphasis bars. `bars` is [{ label, value, of, note, lead }] — `lead` marks the
 * one that carries the finding; everything else is context gray.
 */
export function CompareBars({ title, bars, caption, source, unit = '%' }) {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <Frame caption={caption} source={source}>
      {title && <h4 className="cfigTitle">{title}</h4>}
      <div className="cfigBars">
        {bars.map((b) => (
          <div className="cfigBar" key={b.label}>
            <div className="cfigBarLabel">{b.label}</div>
            <div className="cfigBarTrack">
              <span
                className="cfigBarFill"
                style={{
                  width: `${Math.max(2, (b.value / max) * 100)}%`,
                  background: b.lead ? INK : MUTE,
                }}
              />
              {/* Direct label on every mark — this is what discharges the
                  contrast warning on the muted fill. */}
              <b className="cfigBarValue">
                {b.value}
                {unit}
              </b>
            </div>
            {b.note && <div className="cfigBarNote">{b.note}</div>}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** A numbered procedure — for experiment designs, which are sequences. */
export function Steps({ title, steps, caption, source }) {
  return (
    <Frame caption={caption} source={source}>
      {title && <h4 className="cfigTitle">{title}</h4>}
      <ol className="cfigSteps">
        {steps.map((s, i) => (
          <li key={i} className={s.key ? 'key' : ''}>
            <span>{i + 1}</span>
            <div>
              <b>{s.label}</b>
              {s.detail && <p>{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

/** A timeline where the INTERVAL is the finding. */
export function Gap({ title, from, to, caption, source }) {
  return (
    <Frame caption={caption} source={source}>
      {title && <h4 className="cfigTitle">{title}</h4>}
      <svg className="cfigGap" viewBox="0 0 320 92" role="img" aria-label={caption}>
        <line x1="20" y1="58" x2="300" y2="58" stroke={RULE} strokeWidth="2" />
        {/* the span between the two results is the point, so it is the mark */}
        <line x1="46" y1="58" x2="274" y2="58" stroke={INK} strokeWidth="2" />
        <circle cx="46" cy="58" r="6" fill={INK} />
        <circle cx="274" cy="58" r="6" fill={MUTE} />
        <text x="46" y="34" textAnchor="middle" className="cfigTick">{from.at}</text>
        <text x="274" y="34" textAnchor="middle" className="cfigTick">{to.at}</text>
        <text x="46" y="80" textAnchor="middle" className="cfigFoot">{from.label}</text>
        <text x="274" y="80" textAnchor="middle" className="cfigFoot">{to.label}</text>
      </svg>
    </Frame>
  );
}

/** Two columns: what a thing can do, and the limit that defines it. */
export function Contrast({ title, left, right, caption, source }) {
  return (
    <Frame caption={caption} source={source}>
      {title && <h4 className="cfigTitle">{title}</h4>}
      <div className="cfigContrast">
        {[left, right].map((col, i) => (
          <div key={i} className={i === 0 ? 'can' : 'cannot'}>
            <small>{col.head}</small>
            <ul>
              {col.items.map((x, j) => <li key={j}>{x}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Render whatever a chapter's figure spec asks for. */
export default function ChapterFigure({ figure }) {
  if (!figure) return null;
  switch (figure.kind) {
    case 'bars': return <CompareBars {...figure} />;
    case 'steps': return <Steps {...figure} />;
    case 'gap': return <Gap {...figure} />;
    case 'contrast': return <Contrast {...figure} />;
    default: return null;
  }
}
