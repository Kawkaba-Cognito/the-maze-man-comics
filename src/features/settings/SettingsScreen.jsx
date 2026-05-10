/*
 * SETTINGS FEATURE
 *
 * Full-screen settings page (account card, avatar picker, preferences,
 * support / legal / data sections) plus the six sub-modals it opens
 * (Help, Feedback, Terms, Privacy, Export, Delete) and the standalone
 * About modal. Lifted out of SplashScreen.jsx during Phase 1 step 5.
 *
 * Styles live in `src/styles/settings.css` (loaded globally via main.jsx).
 * The container exits via the `onClose` callback the parent passes in.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IconBack } from '../training/shared/TrainingIcons';

const AVATARS = ['🧠', '🕵️', '🦊', '🌀', '🔮', '👁️'];
const XP_PER_LEVEL = 200;

/* ────────────────────── Primitives ────────────────────── */

function SettingsRow({ label, value, onClick, danger }) {
  return (
    <button type="button" onClick={onClick} className={`stg-row${danger ? ' stg-row--danger' : ''}`}>
      <span className="stg-row-label">{label}</span>
      {value && <span className="stg-row-value">{value}</span>}
      <span className="stg-row-chevron" aria-hidden>›</span>
    </button>
  );
}

function SettingsSection({ title, children }) {
  return (
    <div className="stg-section">
      <div className="stg-section-title">{title}</div>
      <div className="stg-section-body">{children}</div>
    </div>
  );
}

function SettingsModal({ title, onClose, children }) {
  const { playSfx } = useApp();
  const close = () => {
    playSfx('click');
    onClose();
  };
  return (
    <div className="stg-modal-backdrop" onClick={close}>
      <div className="stg-modal-box" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="stg-modal-header">
          <span className="stg-modal-title">{title}</span>
          <button type="button" className="stg-modal-close" onClick={close} aria-label="Close">✕</button>
        </div>
        <div className="stg-modal-body">{children}</div>
      </div>
    </div>
  );
}

/* ────────────────────── About modal (also opened from splash menu) ────────────────────── */

export function AboutModal({ onClose }) {
  const { currentLang } = useApp();
  const isAr = currentLang === 'ar';
  return (
    <SettingsModal title={isAr ? 'عن التطبيق' : 'About'} onClose={onClose}>
      <p className="stg-modal-text"><strong>{isAr ? 'رجل المتاهة' : 'The Maze Man'}</strong></p>
      <p className="stg-modal-text">{isAr ? 'تطبيق كوميكس تفاعلي ثنائي اللغة يستكشف علم النفس.' : 'A bilingual interactive comics app exploring psychology through stories and games.'}</p>
      <p className="stg-modal-text" style={{ marginTop: 10 }}>{isAr ? 'الإصدار 1.0 — مايو 2026' : 'Version 1.0 — May 2026'}</p>
      <p className="stg-modal-subtext">{isAr ? 'تصميم وتطوير: كوكبة كوغنيتو' : 'Design & Dev: Kawkaba Cognito'}</p>
    </SettingsModal>
  );
}

/* ────────────────────── Settings screen ────────────────────── */

export default function SettingsScreen({ onClose }) {
  const {
    currentLang,
    toggleLang,
    profileData,
    setProfileData,
    saveProfile,
    globalXP,
    playSfx,
    sfxEnabled,
    setSfxEnabled,
  } = useApp();
  const isAr = currentLang === 'ar';
  const [subModal, setSubModal] = useState(null);

  const level = Math.floor(globalXP / XP_PER_LEVEL) + 1;
  const xpPct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

  function setAvatar(emoji) {
    const updated = { ...profileData, avatar: emoji };
    setProfileData(updated);
    saveProfile(updated, globalXP);
  }

  return (
    <>
      <div className="stg-screen stg-screen--paper" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="stg-topbar">
          <button
            type="button"
            className="stg-back"
            aria-label={isAr ? 'رجوع' : 'Back'}
            onClick={() => {
              playSfx('click');
              onClose();
            }}
          >
            <IconBack size={18} c="#3a3228" />
          </button>
          <span className="stg-topbar-title">{isAr ? 'الإعدادات' : 'Settings'}</span>
        </div>

        <div className="stg-scroll">

          {/* Account */}
          <div className="stg-account-card">
            <div className="stg-avatar">{profileData.avatar}</div>
            <div className="stg-account-info">
              <div className="stg-account-name">{profileData.username}</div>
              <div className="stg-account-level">Level {level} · {globalXP} XP</div>
              <div className="stg-xp-bar">
                <div className="stg-xp-fill" style={{ width: xpPct + '%' }} />
              </div>
            </div>
          </div>

          <div className="stg-avatar-row">
            {AVATARS.map(e => (
              <button
                key={e}
                className={`stg-avatar-opt${profileData.avatar === e ? ' active' : ''}`}
                onClick={() => setAvatar(e)}
              >{e}</button>
            ))}
          </div>

          <SettingsSection title={isAr ? 'التفضيلات' : 'Preferences'}>
            <SettingsRow
              label={isAr ? 'اللغة' : 'Language'}
              value={isAr ? 'العربية' : 'English'}
              onClick={toggleLang}
            />
            <SettingsRow
              label={isAr ? 'المؤثرات الصوتية' : 'Sound effects'}
              value={sfxEnabled ? (isAr ? 'تشغيل' : 'On') : (isAr ? 'إيقاف' : 'Off')}
              onClick={() => {
                const next = !sfxEnabled;
                setSfxEnabled(next);
                if (next) playSfx('click');
              }}
            />
          </SettingsSection>

          <SettingsSection title={isAr ? 'الدعم' : 'Support'}>
            <SettingsRow label={isAr ? 'المساعدة' : 'Help'} onClick={() => { playSfx('click'); setSubModal('help'); }} />
            <SettingsRow label={isAr ? 'ملاحظاتك' : 'Your Feedback'} onClick={() => { playSfx('click'); setSubModal('feedback'); }} />
          </SettingsSection>

          <SettingsSection title={isAr ? 'قانوني' : 'Legal'}>
            <SettingsRow label={isAr ? 'شروط الاستخدام' : 'Terms of Use'} onClick={() => { playSfx('click'); setSubModal('terms'); }} />
            <SettingsRow label={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} onClick={() => { playSfx('click'); setSubModal('privacy'); }} />
          </SettingsSection>

          <SettingsSection title={isAr ? 'البيانات' : 'Data'}>
            <SettingsRow label={isAr ? 'تصدير بياناتي' : 'Export My Data'} onClick={() => { playSfx('click'); setSubModal('export'); }} />
            <SettingsRow label={isAr ? 'حذف الحساب' : 'Delete Account'} onClick={() => { playSfx('click'); setSubModal('delete'); }} danger />
          </SettingsSection>

        </div>
      </div>

      {/* Sub-modals */}
      {subModal === 'help' && (
        <SettingsModal title={isAr ? 'المساعدة' : 'Help'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text"><strong>{isAr ? 'كيفية اللعب' : 'How to play'}</strong></p>
          <p className="stg-modal-text">{isAr ? 'اضغط على أبواب الشاشة الرئيسية للوصول إلى الأقسام. ادخل المتاهة ثلاثية الأبعاد من الزر المركزي.' : 'Tap the door signs on the home screen to reach sections. Enter the 3D maze from the centre button.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 12 }}><strong>{isAr ? 'التواصل' : 'Contact'}</strong></p>
          <p className="stg-modal-text">support@mazeman.app</p>
        </SettingsModal>
      )}

      {subModal === 'feedback' && (
        <SettingsModal title={isAr ? 'ملاحظاتك' : 'Your Feedback'} onClose={() => setSubModal(null)}>
          <textarea className="stg-textarea" placeholder={isAr ? 'أخبرنا برأيك…' : 'Tell us what you think…'} />
          <button className="stg-send-btn" onClick={() => { alert('Coming soon!'); setSubModal(null); }}>
            {isAr ? 'إرسال' : 'Send Feedback'}
          </button>
        </SettingsModal>
      )}

      {subModal === 'terms' && (
        <SettingsModal title={isAr ? 'شروط الاستخدام' : 'Terms of Use'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'باستخدامك للتطبيق توافق على استخدامه لأغراض شخصية غير تجارية فقط.' : 'By using the app you agree to use it for personal, non-commercial purposes only.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 10 }}>{isAr ? 'المحتوى لأغراض تعليمية وترفيهية ولا يُعدّ نصيحة طبية أو نفسية.' : 'Content is for educational and entertainment purposes. It does not constitute medical advice.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}</p>
        </SettingsModal>
      )}

      {subModal === 'privacy' && (
        <SettingsModal title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'نجمع فقط البيانات التي تقدمها: الاسم، الصورة الرمزية، تقدم XP.' : 'We collect only data you provide: username, avatar, XP progress.'}</p>
          <p className="stg-modal-text" style={{ marginTop: 10 }}>{isAr ? 'بيانات التقدم مخزنة محلياً على جهازك.' : 'Progress data is stored locally on your device.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}</p>
        </SettingsModal>
      )}

      {subModal === 'export' && (
        <SettingsModal title={isAr ? 'تصدير البيانات' : 'Export My Data'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'تصدير البيانات الكاملة سيكون متاحاً مع المزامنة السحابية.' : 'Full data export will be available once cloud sync is enabled.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'قريباً مع Supabase.' : 'Coming with Supabase integration.'}</p>
        </SettingsModal>
      )}

      {subModal === 'delete' && (
        <SettingsModal title={isAr ? 'حذف الحساب' : 'Delete Account'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'سيؤدي هذا إلى حذف ملفك الشخصي وتقدمك بشكل دائم.' : 'This will permanently delete your profile and progress.'}</p>
          <button className="stg-delete-btn" onClick={() => { alert('Account deletion available once cloud accounts are enabled.'); setSubModal(null); }}>
            {isAr ? 'نعم، احذف كل شيء' : 'Yes, Delete Everything'}
          </button>
        </SettingsModal>
      )}
    </>
  );
}
