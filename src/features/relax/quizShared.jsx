import React, { useState } from 'react';
import { INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import KawkabSprite from '../training/shared/KawkabSprite';

/*
 * Shared pieces for the Wellbeing science quizzes (Personality, Relationship).
 * Both are single-item-per-screen, 7-point Likert instruments with a
 * multi-trait bar result screen, so the item/progress/Likert/trait-bar/
 * disclaimer chrome lives here once instead of twice.
 */

export const QUIZ_CSS = `
.qz-progress { font-size:12px; color:${SUB}; font-weight:700; text-align:center; letter-spacing:1px; text-transform:uppercase; }
.qz-item-text { font-family:${SERIF}; font-size:22px; font-weight:600; color:${INK}; text-align:center; line-height:1.35; padding:0 4px; }
.qz-likert { display:flex; gap:6px; justify-content:space-between; }
.qz-likert-btn { flex:1; aspect-ratio:1; border-radius:12px; border:1px solid ${LINE}; background:${CARD}; color:${SUB}; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; transition:border-color .15s, background .15s, color .15s; box-shadow:var(--elev-rest); }
.qz-likert-btn.on { border-color:var(--rx-hue); background:var(--rx-hue); color:#fff; }
.qz-likert-labels { display:flex; justify-content:space-between; font-size:11px; color:${FAINT}; margin-top:6px; line-height:1.4; gap:10px; }
.qz-likert-labels span { max-width:44%; }
.qz-likert-labels span:last-child { text-align:end; }
.qz-intro-emoji { font-size:52px; text-align:center; }
.qz-intro-meta { font-size:12.5px; color:${SUB}; text-align:center; line-height:1.6; }
.qz-cite { font-size:11.5px; color:${FAINT}; font-style:italic; text-align:center; line-height:1.5; }
.qz-disclaimer { font-size:11.5px; color:${FAINT}; line-height:1.55; text-align:center; }
.qz-trait { margin-bottom:18px; }
.qz-trait-head { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:5px; gap:8px; }
.qz-trait-name { font-weight:800; font-size:14.5px; color:${INK}; }
/* ⚠ This carries a BAND ("Higher than most") rather than the bare number it
   used to, so it needs room to be a phrase without pushing the trait name off
   the row — hence the smaller size and the end-alignment. See bandFor() in
   PersonalityQuiz for why a two-item scale must not print a point estimate. */
.qz-trait-val { font-weight:800; font-size:11.5px; flex-shrink:0; text-align:end; max-width:52%; letter-spacing:0.2px; }
.qz-trait-track { height:10px; border-radius:6px; background:color-mix(in srgb, var(--rx-ink) 12%, var(--rx-card)); overflow:hidden; }
.qz-trait-fill { height:100%; border-radius:6px; transition:width .6s cubic-bezier(.2,.9,.3,1); }
.qz-trait-blurb { font-size:12.5px; color:${SUB}; line-height:1.55; margin-top:6px; }
.qz-trait-try { font-size:12.5px; color:${INK}; line-height:1.55; margin-top:6px; padding-top:6px; border-top:1px dashed ${LINE}; }
/* He STANDS beside the line now. The old rule pinned a 42px cropped face at
   top:-28px over the bubble's corner, so the character was half outside its own
   container — the sticker look this pass is removing. */
.qz-kawkab { display:flex; align-items:flex-end; gap:10px; margin:22px 0 4px; }
.qz-kawkab-art { flex:0 0 auto; filter:drop-shadow(0 5px 8px var(--fx-shadow-drop)); }
.qz-kawkab-bubble { flex:1; min-width:0; padding:11px 15px; border-radius:15px 15px 15px 4px;
  background:${CARD}; border:1px solid ${LINE}; box-shadow:var(--elev-rest);
  color:${INK}; font-size:14px; font-weight:600; line-height:1.5; }
.qz-choice-list { display:flex; flex-direction:column; gap:10px; }
.qz-choice { text-align:start; padding:14px 16px; border-radius:14px; border:1px solid ${LINE}; background:${CARD}; color:${INK}; font-size:14px; font-weight:600; line-height:1.5; cursor:pointer; font-family:inherit; transition:border-color .15s, background .15s, box-shadow .15s; box-shadow:var(--elev-rest); }
.qz-choice.on { border-color:var(--rx-hue); background:color-mix(in srgb, var(--rx-hue) 14%, ${CARD}); }
.qz-example { font-size:12.5px; color:${SUB}; font-style:italic; text-align:center; line-height:1.55; padding:0 10px; max-width:420px; margin:0 auto; }
.qz-deeper { margin-top:8px; }
.qz-deeper-toggle { display:flex; align-items:center; gap:5px; background:none; border:none; color:var(--rx-accent); font-weight:800; font-size:12px; cursor:pointer; font-family:inherit; padding:2px 0; }
.qz-deeper-body { font-size:12.5px; color:${SUB}; line-height:1.6; margin-top:8px; padding-top:8px; border-top:1px dashed ${LINE}; }

/* ⚠ The seventeen dark-theme overrides that used to close this
   file are GONE. They re-stated every surface above in a second hard-coded
   palette; now that the constants resolve to --rx-* → --universe-*, the theme
   flips on its own and a duplicate could only ever drift out of step with the
   original. Adding one back means a colour above it is wrong. */
`;

/*
 * A 1–7 agreement scale with end labels. Buttons and labels are both forced
 * to dir="ltr" regardless of app language — the numeric scale always reads
 * 1→7 left-to-right, so the labels underneath must stay in the same fixed
 * physical order (left label under button 1, right label under button 7)
 * rather than mirroring with the page's RTL direction, which would swap
 * "disagree"/"agree" onto the wrong ends.
 */
export function LikertRow({ value, onChange, leftLabel, rightLabel }) {
  return (
    <div dir="ltr">
      <div className="qz-likert">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            className={`qz-likert-btn${value === n ? ' on' : ''}`}
            onClick={() => onChange(n)}
            aria-label={String(n)}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="qz-likert-labels">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

/** A labeled 0–100 fill bar used for each Big Five trait in the results screen. `tryThis` is a short, concrete weekly micro-action — not just a description. */
export function TraitBar({ label, value, color, valueLabel, children, tryThis }) {
  return (
    <div className="qz-trait">
      <div className="qz-trait-head">
        <span className="qz-trait-name">{label}</span>
        <span className="qz-trait-val" style={{ color }}>{valueLabel}</span>
      </div>
      <div className="qz-trait-track">
        <div className="qz-trait-fill" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
      </div>
      {children && <div className="qz-trait-blurb">{children}</div>}
      {tryThis && <div className="qz-trait-try">{tryThis}</div>}
    </div>
  );
}

/** A short concrete illustration of what agreeing with a question looks like in real life — shown under every question so people can calibrate their answer instead of guessing at the abstract wording. */
export function QuestionExample({ children }) {
  if (!children) return null;
  return <p className="qz-example">💡 {children}</p>;
}

/**
 * An opt-in "go deeper" disclosure under a result — a second, more detailed
 * layer of the research (mechanism, origin, nuance) kept collapsed by
 * default so the main result stays plain-language and non-clinical, while
 * anyone who wants the fuller picture can open it without leaving the page.
 */
export function DeeperScience({ moreLabel, lessLabel, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="qz-deeper">
      <button type="button" className="qz-deeper-toggle" onClick={() => setOpen((o) => !o)}>
        {open ? lessLabel : moreLabel} {open ? '▴' : '▾'}
      </button>
      {open && <div className="qz-deeper-body">{children}</div>}
    </div>
  );
}

/**
 * Dr Kawkab, in first person, delivering a short guiding line — used at intro,
 * mid-quiz check-ins, scenario transitions, and the top of results.
 *
 * ⚠ THIS WAS A DIFFERENT CHARACTER (2026-09-05), under the words "Hi, I'm
 * Kawkab!". It rendered `CosmosCharacter size={42} faceOnly`, which resolves to
 * `kawkab-idle.png`/`kawkab-face.png` — the RETIRED sprite, a separate drawing
 * from the `kawkab-planet.webp` the Training hub puts at its centre. So a player
 * met one mascot in Training and a different one in Wellbeing, both introducing
 * themselves by the same name.
 *
 * `KawkabSprite`'s own file header already documented this as a known problem
 * ("CosmosCharacter — 2D, but a different character") and had consolidated the
 * training side onto one image; Wellbeing was simply never included in that
 * sweep, because nothing checks this tree.
 *
 * ⚠ It is a FULL FIGURE now, not a cropped face peeking from behind the bubble.
 * The old layout absolutely-positioned a 42px head above the bubble's top-left
 * corner, so the character was clipped by its own container and read as a
 * sticker stuck on the panel. He stands beside what he is saying instead.
 */
export function KawkabSay({ children }) {
  return (
    <div className="qz-kawkab">
      {/* ⚠ NOT the shared `SpeechBubble`. That one is the comic bubble Story
          Time and Detective wear — hard-coded `#fffdf8`, a 2px ink outline and
          a `2px 2px 0` sticker shadow. It is right for a comic panel and wrong
          for a wellbeing screen, and restyling it here would silently change
          two games. Wellbeing states its own. */}
      <KawkabSprite size={54} className="qz-kawkab-art" />
      <p className="qz-kawkab-bubble">{children}</p>
    </div>
  );
}

/**
 * A short everyday scenario with tappable multiple-choice options. Answers
 * are tallied for the results screen's "gut check" recap — they never feed
 * the validated Likert score, which is computed entirely separately.
 */
export function ScenarioChoice({ options, selectedId, onChoose }) {
  return (
    <div className="qz-choice-list">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={`qz-choice${selectedId === opt.id ? ' on' : ''}`}
          onClick={() => onChoose(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
