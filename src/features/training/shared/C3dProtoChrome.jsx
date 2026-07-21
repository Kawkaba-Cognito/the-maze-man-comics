import React from 'react';
import './c3dProto.css';

/** Coerce bilingual {en,ar} bags to strings; pass through React nodes / primitives. */
function textOf(v, isAr) {
  if (v == null || typeof v === 'boolean') return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (React.isValidElement(v)) return v;
  if (typeof v === 'object' && ('en' in v || 'ar' in v)) {
    const s = isAr ? (v.ar ?? v.en) : (v.en ?? v.ar);
    if (s != null && typeof s !== 'object') return String(s);
    return '';
  }
  return '';
}

/**
 * Shared HUD / banners for training 3D prototypes.
 */
export default function C3dProtoChrome({
  isAr,
  title,
  tag,
  hint,
  question,
  chip,
  chipStyle,
  stats = [],
  banner,
  bannerOver,
  bannerMeta,
  bannerActions,
  bootError,
  onBack,
  playSfx,
  canvasRef,
  children,
}) {
  const titleText = textOf(title, isAr);
  const tagText = textOf(tag, isAr);
  const hintText = textOf(hint, isAr);
  const questionText = textOf(question, isAr);
  const chipText = textOf(chip, isAr) || '3D';
  const bannerText = textOf(banner, isAr);
  const metaText = textOf(bannerMeta, isAr);
  const errText = textOf(bootError, isAr);
  const safeStats = (stats || []).map((s) => textOf(s, isAr)).filter(Boolean);

  return (
    <div className="c3d-root" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="c3d-canvas" ref={canvasRef} aria-hidden="true" />
      {errText ? (
        <div className="c3d-banner c3d-banner--over">
          <span>{errText}</span>
          <button type="button" className="c3d-cta" onClick={() => { playSfx?.('click'); onBack(); }}>
            {isAr ? 'العودة' : 'Back'}
          </button>
        </div>
      ) : null}
      <div className="c3d-ui c3d-ui--overlay">
        <header className="c3d-top">
          <button type="button" className="c3d-icon-btn" onClick={() => { playSfx?.('click'); onBack(); }}>
            {isAr ? '›' : '‹'}
          </button>
          <div className="c3d-titles">
            <div className="c3d-title">{titleText}</div>
            {tagText ? <div className="c3d-tag">{tagText}</div> : null}
          </div>
          <div className="c3d-target-chip" style={chipStyle}>
            {chipText}
          </div>
        </header>
        {questionText
          ? <div className="c3d-question">{questionText}</div>
          : hintText ? <p className="c3d-hint">{hintText}</p> : null}
        {safeStats.length > 0 && (
          <div className="c3d-stats">
            {safeStats.map((s, i) => <span key={i}>{s}</span>)}
          </div>
        )}
      </div>
      {children}
      {bannerText && !errText ? (
        <div className={`c3d-banner${bannerOver ? ' c3d-banner--over' : ''}`}>
          <span>{bannerText}</span>
          {metaText ? <p className="c3d-banner-meta">{metaText}</p> : null}
          {bannerActions}
        </div>
      ) : null}
    </div>
  );
}

/** Standard ModeShell extraItems entry for 3D mode. */
export function proto3dExtraItem({ isAr, on, hintEn, hintAr }) {
  return {
    k: 'proto3d',
    lb: isAr ? 'ثلاثي الأبعاد' : '3D',
    hint: isAr ? (hintAr || 'نموذج ثلاثي الأبعاد') : (hintEn || '3D prototype'),
    on,
  };
}
