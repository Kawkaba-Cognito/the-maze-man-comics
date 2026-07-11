import React from 'react';
import { INK, SUB, FAINT, LINE, CARD, SERIF } from './PracticeShell';
import CosmosCharacter from '../character/CosmosCharacter';
import SpeechBubble from '../training/shared/scene/SpeechBubble';

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
.qz-likert-btn { flex:1; aspect-ratio:1; border-radius:12px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; transition:all .15s; }
.qz-likert-btn.on { border-color:var(--acc); background:var(--acc); color:#fff; }
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
.qz-trait-val { font-weight:800; font-size:13px; flex-shrink:0; }
.qz-trait-track { height:10px; border-radius:6px; background:#efe6d6; overflow:hidden; }
.qz-trait-fill { height:100%; border-radius:6px; transition:width .6s cubic-bezier(.2,.9,.3,1); }
.qz-trait-blurb { font-size:12.5px; color:${SUB}; line-height:1.55; margin-top:6px; }
.qz-trait-try { font-size:12.5px; color:${INK}; line-height:1.55; margin-top:6px; padding-top:6px; border-top:1px dashed ${LINE}; }
.qz-kawkab { position:relative; margin:30px 0 4px; }
.qz-kawkab-face { position:absolute; top:-28px; inset-inline-start:6px; }
.qz-choice-list { display:flex; flex-direction:column; gap:10px; }
.qz-choice { text-align:start; padding:14px 16px; border-radius:14px; border:2px solid ${LINE}; background:${CARD}; color:${INK}; font-size:14px; font-weight:600; line-height:1.5; cursor:pointer; font-family:inherit; transition:all .15s; }
.qz-choice.on { border-color:var(--acc); background:#fff6ec; }

[data-home-theme='dark'] .qz-progress { color:#c9b384; }
[data-home-theme='dark'] .qz-item-text { color:#f0e2c0; }
[data-home-theme='dark'] .qz-likert-btn { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .qz-likert-labels { color:#8f7d58; }
[data-home-theme='dark'] .qz-intro-meta { color:#c9b384; }
[data-home-theme='dark'] .qz-cite { color:#8f7d58; }
[data-home-theme='dark'] .qz-disclaimer { color:#8f7d58; }
[data-home-theme='dark'] .qz-trait-name { color:#f0e2c0; }
[data-home-theme='dark'] .qz-trait-track { background:#332818; }
[data-home-theme='dark'] .qz-trait-blurb { color:#c9b384; }
[data-home-theme='dark'] .qz-trait-try { color:#f0e2c0; border-top-color:rgba(212,168,80,0.25); }
[data-home-theme='dark'] .qz-choice { background:#211a10; border-color:rgba(212,168,80,0.25); color:#f0e2c0; }
[data-home-theme='dark'] .qz-choice.on { background:#332818; }
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

/** Kawkab, in first person, delivering a short guiding line — used at intro, mid-quiz check-ins, scenario transitions, and the top of results. */
export function KawkabSay({ children }) {
  return (
    <div className="qz-kawkab">
      <div className="qz-kawkab-face">
        <CosmosCharacter size={42} faceOnly glow={false} />
      </div>
      <SpeechBubble tail="top">{children}</SpeechBubble>
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
