import React, { useState } from 'react';
import { X, Sparkle } from '@phosphor-icons/react';
import { NAYZAK_CAST } from '../../data/nayzakCast';
import { assetUrl } from '../../lib/assetUrl';
import '../../styles/nayzakChrome.css';

export default function NayzakFamilyModal({ isOpen, onClose, isAr }) {
  const [activeView, setActiveView] = useState('observatory'); // 'observatory' | 'cast'

  if (!isOpen) return null;

  return (
    <div
      className="nayzak-family-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        className="nayzak-family-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="nayzak-family-modal-close"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Close'}
        >
          <X size={20} weight="bold" />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 999,
              background: 'rgba(245, 166, 35, 0.14)',
              border: '1px solid rgba(245, 166, 35, 0.35)',
              color: 'var(--universe-accent)',
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: isAr ? 0 : 1.2,
              marginBottom: 8,
            }}
          >
            <Sparkle size={14} weight="fill" />
            <span>{isAr ? 'قصة عائلة نيزك • المرصد الفلكي' : 'The Nayzak Story • Astral Observatory'}</span>
          </div>
          
          <h2
            style={{
              margin: '2px 0 6px',
              fontFamily: isAr ? "'Cairo', sans-serif" : "'Cinzel', 'Syne', serif",
              fontSize: 23,
              fontWeight: 900,
              color: 'var(--universe-ink)',
            }}
          >
            {isAr ? 'عائلة نيزك للذكاء والإدراك' : 'The Nayzak Family'}
          </h2>
          
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--universe-muted)',
              lineHeight: 1.5,
              maxWidth: 520,
              marginInline: 'auto',
            }}
          >
            {isAr
              ? 'في قصر المرصد الفلكي، يكرّس كل فرد من أفراد عائلة نيزك طاقته الفكرية لرعاية بُعد إدراكي فريد، ومرافقتك في رحلتك المعرفية اليومية بروح الاستكشاف والعلوم.'
              : 'Within the Astral Observatory, each member of the Nayzak family masters a unique cognitive domain to guide your daily mental evolution.'}
          </p>

          {/* View Mode Segmented Controls */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: 4,
              marginTop: 14,
              background: 'rgba(0, 0, 0, 0.06)',
              borderRadius: 999,
              border: '1px solid rgba(245, 166, 35, 0.25)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveView('observatory')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                border: 'none',
                background: activeView === 'observatory' ? '#ffffff' : 'transparent',
                color: activeView === 'observatory' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: activeView === 'observatory' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{isAr ? '🔭 المرصد الفلكي' : '🔭 Astral Observatory'}</span>
            </button>
            
            <button
              type="button"
              onClick={() => setActiveView('cast')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 999,
                border: 'none',
                background: activeView === 'cast' ? '#ffffff' : 'transparent',
                color: activeView === 'cast' ? '#0f172a' : '#64748b',
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                boxShadow: activeView === 'cast' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <span>{isAr ? '👥 حراس الإدراك' : '👥 Cognitive Guardians'}</span>
            </button>
          </div>
        </div>

        {/* View 1: Master Astral Observatory Artwork (Google Flow Generated) */}
        {activeView === 'observatory' && (
          <div style={{ animation: 'nayzakFadeIn 0.25s ease' }}>
            <div className="nayzak-family-poster-wrap">
              <img
                src={assetUrl('Assets/brand/nayzak-family-observatory-1.webp')}
                alt={isAr ? 'مرصد عائلة نيزك الفلكي' : 'The Nayzak Astral Observatory'}
                draggable="false"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
            
            <div
              style={{
                background: 'rgba(245, 166, 35, 0.08)',
                border: '1px solid rgba(245, 166, 35, 0.25)',
                borderRadius: 14,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 12.5,
                lineHeight: 1.6,
                color: 'var(--universe-ink)',
                textAlign: 'center',
              }}
            >
              ✨ {isAr
                ? 'يلتقي الكابتن نيزك مع ريما وزايد وسامي وياسمين وليان في المرصد الفلكي كل مساء لدراسة الخرائط النجمية ومحاكاة الأنماط العصبية تحت قبة السماء المتلألئة.'
                : 'Captain Nayzak gathers with Rima, Zayd, Sami, Yasmin, and Layan in the Astral Observatory each evening to chart star maps and simulate neural pathways under the starlit dome.'}
            </div>
          </div>
        )}

        {/* View 2: Master Family Portrait */}
        {activeView === 'cast' && (
          <div style={{ animation: 'nayzakFadeIn 0.25s ease' }}>
            <div className="nayzak-family-poster-wrap">
              <img
                src={assetUrl('Assets/brand/nayzak-family.jpg')}
                alt={isAr ? 'عائلة نيزك' : 'The Nayzak Family'}
                draggable="false"
              />
            </div>
          </div>
        )}

        {/* Character Cast Grid */}
        <div className="nayzak-cast-grid">
          {NAYZAK_CAST.map((member) => (
            <div
              key={member.id}
              className="nayzak-cast-card"
              style={{
                borderInlineStart: `3px solid ${member.accentColor}`,
              }}
            >
              <img
                src={member.avatarUrl}
                alt={isAr ? member.nameAr : member.nameEn}
                className="nayzak-cast-card-avatar"
                style={{
                  border: `2px solid ${member.accentColor}`,
                }}
              />
              <div className="nayzak-cast-card-info">
                <span className="nayzak-cast-card-name">
                  {isAr ? member.nameAr : member.nameEn}
                </span>
                <span
                  className="nayzak-cast-card-role"
                  style={{ color: member.accentColor }}
                >
                  {isAr ? member.roleAr : member.roleEn}
                </span>
                <span className="nayzak-cast-card-bio">
                  {isAr ? member.bioAr : member.bioEn}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
