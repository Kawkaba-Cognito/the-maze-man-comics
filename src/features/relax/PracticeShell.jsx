import React from 'react';

/*
 * Shared shell for the Relaxation practices (Breathe, Grounding, PMR) so they all
 * match the warm paper/gold MBSR aesthetic. Provides the header + a set of base
 * CSS classes (rxp-*) scoped under .rxp-root. Each practice sets its accent via
 * the `accent` prop (exposed as the --acc CSS variable).
 */

export const INK = '#2d2210'; export const SUB = '#8a7f6f'; export const FAINT = '#b3a288';
export const LINE = '#e3d6c4'; export const CARD = '#fffdf8'; export const GOLD = '#b9842f';
export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const SANS = "'Outfit', system-ui, sans-serif";

export default function PracticeShell({ title, accent, isAr, onBack, children }) {
  return (
    <div className="rxp-root" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{BASE_CSS}</style>
      <div className="rxp-app" style={{ '--acc': accent }}>
        <div className="rxp-head">
          <button className="rxp-back" onClick={onBack} aria-label="Back">‹</button>
          <div className="rxp-title serif" style={{ color: accent }}>{title}</div>
          <div style={{ width: 36 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

const BASE_CSS = `
.rxp-root { position:fixed; inset:0; z-index:50; overflow-y:auto; -webkit-overflow-scrolling:touch; background:var(--color-training-palette-surface,#fff7f2); color:${INK}; font-family:${SANS}; }
.rxp-root *, .rxp-root *::before, .rxp-root *::after { box-sizing:border-box; }
.rxp-app { max-width:480px; margin:0 auto; min-height:100%; display:flex; flex-direction:column; padding-bottom:40px; }
.rxp-head { display:flex; align-items:center; justify-content:space-between; padding:calc(14px + env(safe-area-inset-top)) 14px 8px; }
.rxp-back { width:36px; height:36px; border-radius:10px; border:2px solid ${LINE}; background:${CARD}; color:#141210; font-size:22px; line-height:1; cursor:pointer; }
.rxp-title { font-family:${SERIF}; font-size:26px; font-weight:600; }
.rxp-root .serif { font-family:${SERIF}; font-weight:600; }
.rxp-body { flex:1; padding:8px 22px 20px; display:flex; flex-direction:column; gap:18px; }
.rxp-center { align-items:center; text-align:center; justify-content:center; }
.rxp-field { display:flex; flex-direction:column; gap:10px; }
.rxp-label { font-size:11px; letter-spacing:2px; text-transform:uppercase; color:${SUB}; font-weight:800; }
.rxp-chips { display:flex; flex-wrap:wrap; gap:8px; }
.rxp-chip { padding:10px 14px; border-radius:999px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; text-align:start; }
.rxp-chip.on { border-color:var(--acc); background:#fff6ec; color:${INK}; }
.rxp-chip small { display:block; font-size:11px; font-weight:600; color:${FAINT}; margin-top:1px; }
.rxp-primary { width:100%; max-width:340px; padding:15px; border-radius:14px; border:none; background:var(--acc); color:#fff; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; box-shadow:3px 3px 0 rgba(26,18,8,0.14); }
.rxp-ghost { width:100%; max-width:340px; padding:13px; border-radius:14px; border:2px solid ${LINE}; background:${CARD}; color:${SUB}; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; }
.rxp-tip { font-size:12.5px; color:${FAINT}; line-height:1.6; text-align:center; max-width:360px; }
.rxp-hero { font-size:60px; text-align:center; }
.rxp-remain { font-size:15px; font-weight:800; color:${SUB}; font-variant-numeric:tabular-nums; }

[data-home-theme='dark'] .rxp-root { color:#f0e2c0; }
[data-home-theme='dark'] .rxp-back { background:#241c10; border-color:rgba(212,168,80,0.3); color:#f0e2c0; }
[data-home-theme='dark'] .rxp-label { color:#c9b384; }
[data-home-theme='dark'] .rxp-chip { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .rxp-chip.on { background:#332818; color:#f0e2c0; }
[data-home-theme='dark'] .rxp-chip small { color:#8f7d58; }
[data-home-theme='dark'] .rxp-ghost { background:#211a10; border-color:rgba(212,168,80,0.25); color:#c9b384; }
[data-home-theme='dark'] .rxp-tip { color:#8f7d58; }
[data-home-theme='dark'] .rxp-remain { color:#c9b384; }
`;
