/*
 * SETTINGS FEATURE
 *
 * Full-screen settings page (account card, preferences, support / legal /
 * data sections) plus the sub-modals it opens (Help, Feedback, Terms,
 * Privacy, Export, Delete) and the standalone About modal.
 *
 * Clean, light, professional styling — no emojis. Styles live in
 * `src/styles/settings.css` (loaded globally via main.jsx). The container
 * exits via the `onClose` callback the parent passes in.
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IconBack } from '../training/shared/TrainingIcons';

const XP_PER_LEVEL = 200;
const APP_VERSION = '1.0';

function monogram(name) {
  const ch = (name || '').trim().charAt(0);
  return ch ? ch.toUpperCase() : '?';
}

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
      <p className="stg-modal-text">
        {isAr
          ? 'تطبيق كوميكس تفاعلي ثنائي اللغة يستكشف علم النفس عبر القصص والألعاب والتدريب الإدراكي.'
          : 'A bilingual interactive comics app that explores psychology through stories, puzzles, and cognitive training.'}
      </p>
      <div className="stg-modal-label">{isAr ? 'الإصدار' : 'Version'}</div>
      <p className="stg-modal-text">{isAr ? `الإصدار ${APP_VERSION}` : `Version ${APP_VERSION}`}</p>
      <div className="stg-modal-label">{isAr ? 'التطوير' : 'Studio'}</div>
      <p className="stg-modal-text">{isAr ? 'كوكبة كوغنيتو' : 'Kawkaba Cognito'}</p>
      <p className="stg-modal-subtext">© 2026 Kawkaba Cognito. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
    </SettingsModal>
  );
}

/* ────────────────────── Settings screen ────────────────────── */

export default function SettingsScreen({ onClose }) {
  const {
    currentLang,
    toggleLang,
    profileData,
    globalXP,
    playSfx,
    sfxEnabled,
    setSfxEnabled,
  } = useApp();
  const isAr = currentLang === 'ar';
  const [subModal, setSubModal] = useState(null);

  const level = Math.floor(globalXP / XP_PER_LEVEL) + 1;
  const xpPct = Math.min(100, ((globalXP % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);

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
            <IconBack size={18} c="#1d2026" />
          </button>
          <span className="stg-topbar-title">{isAr ? 'الإعدادات' : 'Settings'}</span>
        </div>

        <div className="stg-scroll">

          {/* Account */}
          <div className="stg-account-card">
            <div className="stg-monogram" aria-hidden>{monogram(profileData.username)}</div>
            <div className="stg-account-info">
              <div className="stg-account-name">{profileData.username}</div>
              <div className="stg-account-level">{isAr ? `المستوى ${level} · ${globalXP} نقطة` : `Level ${level} · ${globalXP} XP`}</div>
              <div className="stg-xp-bar">
                <div className="stg-xp-fill" style={{ width: xpPct + '%' }} />
              </div>
            </div>
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
            <SettingsRow label={isAr ? 'ملاحظاتك' : 'Send Feedback'} onClick={() => { playSfx('click'); setSubModal('feedback'); }} />
            <SettingsRow label={isAr ? 'عن التطبيق' : 'About'} onClick={() => { playSfx('click'); setSubModal('about'); }} />
          </SettingsSection>

          <SettingsSection title={isAr ? 'قانوني' : 'Legal'}>
            <SettingsRow label={isAr ? 'شروط الاستخدام' : 'Terms of Use'} onClick={() => { playSfx('click'); setSubModal('terms'); }} />
            <SettingsRow label={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} onClick={() => { playSfx('click'); setSubModal('privacy'); }} />
          </SettingsSection>

          <SettingsSection title={isAr ? 'البيانات' : 'Data'}>
            <SettingsRow label={isAr ? 'تصدير بياناتي' : 'Export My Data'} onClick={() => { playSfx('click'); setSubModal('export'); }} />
            <SettingsRow label={isAr ? 'حذف الحساب' : 'Delete Account'} onClick={() => { playSfx('click'); setSubModal('delete'); }} danger />
          </SettingsSection>

          <div className="stg-footer">
            {isAr ? `رجل المتاهة · الإصدار ${APP_VERSION}` : `The Maze Man · Version ${APP_VERSION}`}
          </div>

        </div>
      </div>

      {/* Sub-modals */}
      {subModal === 'about' && <AboutModal onClose={() => setSubModal(null)} />}

      {subModal === 'help' && (
        <SettingsModal title={isAr ? 'المساعدة' : 'Help'} onClose={() => setSubModal(null)}>
          <div className="stg-modal-label">{isAr ? 'كيفية اللعب' : 'How to play'}</div>
          <p className="stg-modal-text">{isAr ? 'اضغط على لافتات الأبواب في الشاشة الرئيسية للوصول إلى الأقسام. ادخل المتاهة ثلاثية الأبعاد من الباب المركزي.' : 'Tap the door signs on the home screen to reach the sections. Enter the 3D maze from the centre door.'}</p>
          <div className="stg-modal-label">{isAr ? 'التواصل' : 'Contact'}</div>
          <p className="stg-modal-text">support@mazeman.app</p>
        </SettingsModal>
      )}

      {subModal === 'feedback' && (
        <SettingsModal title={isAr ? 'ملاحظاتك' : 'Send Feedback'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'نودّ أن نسمع رأيك في رجل المتاهة.' : 'We’d love to hear what you think about The Maze Man.'}</p>
          <textarea className="stg-textarea" placeholder={isAr ? 'أخبرنا برأيك…' : 'Tell us what you think…'} />
          <button className="stg-btn stg-btn--primary" onClick={() => { alert('Thank you! Feedback submission coming soon.'); setSubModal(null); }}>
            {isAr ? 'إرسال' : 'Send Feedback'}
          </button>
        </SettingsModal>
      )}

      {subModal === 'terms' && (
        <SettingsModal title={isAr ? 'شروط الاستخدام' : 'Terms of Use'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'باستخدامك للتطبيق توافق على استخدامه لأغراض شخصية غير تجارية فقط.' : 'By using the app you agree to use it for personal, non-commercial purposes only.'}</p>
          <p className="stg-modal-text">{isAr ? 'المحتوى لأغراض تعليمية وترفيهية ولا يُعدّ نصيحة طبية أو نفسية.' : 'Content is provided for educational and entertainment purposes and does not constitute medical or psychological advice.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}</p>
        </SettingsModal>
      )}

      {subModal === 'privacy' && (
        <SettingsModal title={isAr ? 'سياسة الخصوصية' : 'Privacy Policy'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'نجمع فقط البيانات التي تقدمها: اسم المستخدم وتقدّم النقاط ونتائج التقييم.' : 'We collect only the data you provide: username, XP progress, and assessment results.'}</p>
          <p className="stg-modal-text">{isAr ? 'تُخزَّن بيانات التقدم محلياً على جهازك.' : 'Progress data is stored locally on your device.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'آخر تحديث: مايو 2026' : 'Last updated: May 2026'}</p>
        </SettingsModal>
      )}

      {subModal === 'export' && (
        <SettingsModal title={isAr ? 'تصدير البيانات' : 'Export My Data'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'سيتوفّر تصدير البيانات الكامل عند تفعيل المزامنة السحابية.' : 'Full data export will be available once cloud sync is enabled.'}</p>
          <p className="stg-modal-subtext">{isAr ? 'قريباً.' : 'Coming soon.'}</p>
        </SettingsModal>
      )}

      {subModal === 'delete' && (
        <SettingsModal title={isAr ? 'حذف الحساب' : 'Delete Account'} onClose={() => setSubModal(null)}>
          <p className="stg-modal-text">{isAr ? 'سيؤدي هذا إلى حذف ملفك الشخصي وتقدمك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.' : 'This permanently deletes your profile and progress. This action cannot be undone.'}</p>
          <button className="stg-btn stg-btn--danger" onClick={() => { alert('Account deletion will be available once cloud accounts are enabled.'); setSubModal(null); }}>
            {isAr ? 'نعم، احذف كل شيء' : 'Yes, Delete Everything'}
          </button>
        </SettingsModal>
      )}
    </>
  );
}
